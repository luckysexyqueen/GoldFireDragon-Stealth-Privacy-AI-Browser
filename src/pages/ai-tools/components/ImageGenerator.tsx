/**
 * ImageGenerator
 * Pollinations.ai 무료 API 기반 이미지 생성
 * - Prompt + Negative Prompt
 * - Image-to-Image (img2img)
 * - Style presets (Anime, 3D, Realistic, etc.)
 * - LoRA adapter support
 * - High resolution options
 * - Generation history (IndexedDB)
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────
export type ImageStyle =
  | 'anime'
  | '3d'
  | 'realistic'
  | 'digital_art'
  | 'pixel_art'
  | 'oil_painting'
  | 'sketch'
  | 'cinematic'
  | 'cyberpunk'
  | 'fantasy';

export type Resolution = '512x512' | '768x768' | '1024x1024' | '1024x1536' | '1536x1024';

export interface LoRAFile {
  id: string;
  name: string;
  triggerWord: string;
  strength: number;
}

export interface GenerationRecord {
  id: string;
  prompt: string;
  negativePrompt: string;
  style: ImageStyle;
  resolution: Resolution;
  seed: number;
  imageUrl: string;
  loraId?: string;
  loraStrength?: number;
  createdAt: string;
}

// ─── Style Presets ─────────────────────────────────────────────────
export const STYLE_PRESETS: Record<ImageStyle, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  prefix: string;
  negative: string;
}> = {
  anime: {
    label: 'Anime',
    icon: 'ri-user-smile-line',
    color: 'text-pink-400',
    bg: 'bg-pink-400/15',
    prefix: 'masterpiece, best quality, anime style, detailed anime illustration, vibrant colors, clean lines,',
    negative: 'photorealistic, 3d render, western cartoon, low quality, blurry, deformed, bad anatomy',
  },
  '3d': {
    label: '3D Render',
    icon: 'ri-box-3-line',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/15',
    prefix: '3D render, octane render, blender, unreal engine 5, highly detailed 3D model, volumetric lighting, ray tracing,',
    negative: '2d, flat, sketch, painting, low poly, blurry, noisy',
  },
  realistic: {
    label: 'Realistic',
    icon: 'ri-camera-line',
    color: 'text-amber-400',
    bg: 'bg-amber-400/15',
    prefix: 'photorealistic, 8k uhd, dslr, professional photography, sharp focus, detailed skin texture, natural lighting,',
    negative: 'anime, cartoon, 3d render, painting, sketch, low quality, blurry',
  },
  digital_art: {
    label: 'Digital Art',
    icon: 'ri-palette-line',
    color: 'text-violet-400',
    bg: 'bg-violet-400/15',
    prefix: 'digital art, concept art, artstation, deviantart, highly detailed digital painting, rich colors, dramatic lighting,',
    negative: 'photorealistic, 3d render, low quality, blurry, amateur',
  },
  pixel_art: {
    label: 'Pixel Art',
    icon: 'ri-grid-line',
    color: 'text-green-400',
    bg: 'bg-green-400/15',
    prefix: 'pixel art, 16-bit, retro game style, crisp pixels, dithering, limited color palette,',
    negative: 'smooth, photorealistic, 3d, blurry, anti-aliased',
  },
  oil_painting: {
    label: 'Oil Painting',
    icon: 'ri-brush-line',
    color: 'text-orange-400',
    bg: 'bg-orange-400/15',
    prefix: 'oil painting, classical art, renaissance style, impasto technique, rich oil colors, canvas texture, masterwork,',
    negative: 'digital, 3d, anime, photorealistic, modern, low quality',
  },
  sketch: {
    label: 'Sketch',
    icon: 'ri-pencil-line',
    color: 'text-stone-400',
    bg: 'bg-stone-400/15',
    prefix: 'pencil sketch, hand drawn, cross hatching, graphite on paper, artistic sketch, detailed line work,',
    negative: 'color, painted, 3d, photorealistic, digital, blurry',
  },
  cinematic: {
    label: 'Cinematic',
    icon: 'ri-movie-line',
    color: 'text-red-400',
    bg: 'bg-red-400/15',
    prefix: 'cinematic shot, film still, anamorphic lens, depth of field, dramatic lighting, movie scene, color grading,',
    negative: 'anime, cartoon, 3d render, low quality, blurry, overexposed',
  },
  cyberpunk: {
    label: 'Cyberpunk',
    icon: 'ri-flashlight-line',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-400/15',
    prefix: 'cyberpunk, neon lights, futuristic city, rain, holograms, dystopian, high tech low life, blade runner style,',
    negative: 'pastoral, natural, medieval, low tech, bright daylight',
  },
  fantasy: {
    label: 'Fantasy',
    icon: 'ri-star-line',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/15',
    prefix: 'fantasy art, magical, ethereal, enchanted forest, glowing particles, mystical atmosphere, lord of the rings style,',
    negative: 'modern, sci-fi, cyberpunk, photorealistic, mundane',
  },
};

export const RESOLUTIONS: Record<Resolution, { width: number; height: number; label: string }> = {
  '512x512':   { width: 512,  height: 512,  label: '512 × 512' },
  '768x768':   { width: 768,  height: 768,  label: '768 × 768' },
  '1024x1024': { width: 1024, height: 1024, label: '1024 × 1024' },
  '1024x1536': { width: 1024, height: 1536, label: '1024 × 1536 (Portrait)' },
  '1536x1024': { width: 1536, height: 1024, label: '1536 × 1024 (Landscape)' },
};

// ─── IndexedDB helpers for history ─────────────────────────────────
const DB_NAME = 'gfd_image_gen_db';
const DB_VERSION = 1;
const HISTORY_STORE = 'image_history';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHistory(record: GenerationRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getHistory(): Promise<GenerationRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readonly');
    const req = tx.objectStore(HISTORY_STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result ?? []) as GenerationRecord[];
      resolve(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    req.onerror = () => reject(req.error);
  });
}

async function deleteHistory(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Image Generation API ──────────────────────────────────────────
async function generatePollinationsImage(params: {
  prompt: string;
  negative?: string;
  width: number;
  height: number;
  seed: number;
  image?: string; // base64 for img2img
}): Promise<string> {
  const { prompt, negative, width, height, seed, image } = params;

  let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  const query = new URLSearchParams();
  query.set('width', String(width));
  query.set('height', String(height));
  query.set('nologo', 'true');
  query.set('seed', String(seed));
  if (negative) query.set('negative', encodeURIComponent(negative));
  if (image) query.set('image', image);

  url += '?' + query.toString();
  return url;
}

// ─── Component ─────────────────────────────────────────────────────
export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('anime');
  const [resolution, setResolution] = useState<Resolution>('1024x1024');
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [img2imgBase64, setImg2imgBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [batchCount, setBatchCount] = useState(1);
  const [loras, setLoras] = useState<LoRAFile[]>([]);
  const [selectedLora, setSelectedLora] = useState<string>('');
  const [loraStrength, setLoraStrength] = useState(0.8);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const img2imgInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    getHistory().then(setHistory).catch(() => {});
  }, []);

  // Load LoRAs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gfd_lora_files');
      if (saved) setLoras(JSON.parse(saved));
    } catch { /* empty */ }
  }, []);

  const handleImg2imgUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImg2imgBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImg2imgInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImg2imgUpload(file);
    if (img2imgInputRef.current) img2imgInputRef.current.value = '';
  };

  const handleLoRAUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = `lora-${Date.now()}`;
    const name = file.name.replace(/\.[^.]+$/, '');
    const trigger = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newLora: LoRAFile = { id, name, triggerWord: trigger, strength: 0.8 };
    const updated = [...loras, newLora];
    setLoras(updated);
    setSelectedLora(id);
    try { localStorage.setItem('gfd_lora_files', JSON.stringify(updated)); } catch { /* empty */ }
  };

  const removeLoRA = (id: string) => {
    const updated = loras.filter(l => l.id !== id);
    setLoras(updated);
    if (selectedLora === id) setSelectedLora('');
    try { localStorage.setItem('gfd_lora_files', JSON.stringify(updated)); } catch { /* empty */ }
  };

  const buildFinalPrompt = (): { prompt: string; negative: string } => {
    const preset = STYLE_PRESETS[style];
    let finalPrompt = preset.prefix + ' ' + prompt;

    // Add LoRA trigger word
    if (selectedLora) {
      const lora = loras.find(l => l.id === selectedLora);
      if (lora) {
        finalPrompt += `, <lora:${lora.triggerWord}:${loraStrength.toFixed(1)}>`;
      }
    }

    // Add high quality suffix
    finalPrompt += ', ultra detailed, high resolution, best quality';

    const finalNegative = negativePrompt.trim()
      ? preset.negative + ', ' + negativePrompt
      : preset.negative;

    return { prompt: finalPrompt.trim(), negative: finalNegative.trim() };
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    const { width, height } = RESOLUTIONS[resolution];
    const { prompt: finalPrompt, negative } = buildFinalPrompt();

    const images: string[] = [];

    try {
      for (let i = 0; i < batchCount; i++) {
        const currentSeed = useRandomSeed
          ? Math.floor(Math.random() * 1000000)
          : seed + i;

        const imageUrl = await generatePollinationsImage({
          prompt: finalPrompt,
          negative,
          width,
          height,
          seed: currentSeed,
          image: img2imgBase64 ?? undefined,
        });

        images.push(imageUrl);

        // Save to history
        const record: GenerationRecord = {
          id: `gen-${Date.now()}-${i}`,
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim(),
          style,
          resolution,
          seed: currentSeed,
          imageUrl,
          loraId: selectedLora || undefined,
          loraStrength: selectedLora ? loraStrength : undefined,
          createdAt: new Date().toISOString(),
        };
        await saveHistory(record);
      }

      setGeneratedImages(images);
      const updatedHistory = await getHistory();
      setHistory(updatedHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `gfd-generated-${style}-${Date.now()}-${index}.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteHistory(id);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const currentStyle = STYLE_PRESETS[style];
  const resInfo = RESOLUTIONS[resolution];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-pink-400/15">
          <i className="ri-image-2-line text-pink-400 text-xl"></i>
        </div>
        <div>
          <h3 className="text-puma-text text-base font-bold">AI Image Generator</h3>
          <p className="text-puma-muted text-xs">Pollinations.ai 무료 API · Prompt + Negative + img2img + LoRA</p>
        </div>
      </div>

      {/* Prompt Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide">Prompt</label>
          <span className="text-puma-muted/60 text-[10px]">{prompt.length}/500</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
          placeholder="Describe the image you want to generate... (e.g., a beautiful anime girl with blue hair, cherry blossom background)"
          rows={3}
          className="w-full bg-puma-bg border border-puma-border/30 rounded-xl px-3.5 py-2.5 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent resize-none"
        />
      </div>

      {/* Negative Prompt */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide">Negative Prompt</label>
          <span className="text-puma-muted/60 text-[10px]">{negativePrompt.length}/300</span>
        </div>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value.slice(0, 300))}
          placeholder="Things to avoid... (e.g., low quality, blurry, deformed hands, extra fingers)"
          rows={2}
          className="w-full bg-puma-bg border border-puma-border/30 rounded-xl px-3.5 py-2.5 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent resize-none"
        />
        <p className="text-puma-muted/50 text-[10px] mt-1">
          스타일별 기본 네거티브가 자동 적용됩니다. 추가로 원하는 것을 입력하세요.
        </p>
      </div>

      {/* Style Selector */}
      <div>
        <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2 block">Style</label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {(Object.entries(STYLE_PRESETS) as [ImageStyle, typeof STYLE_PRESETS[ImageStyle]][]).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setStyle(key)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border transition-all cursor-pointer ${
                style === key
                  ? `border-puma-accent/50 ${info.bg}`
                  : 'border-puma-border/30 bg-puma-surface hover:border-puma-border/60'
              }`}
            >
              <i className={`${info.icon} ${style === key ? info.color : 'text-puma-muted'} text-base`}></i>
              <span className={`text-[10px] font-semibold ${style === key ? 'text-puma-text' : 'text-puma-muted'}`}>{info.label}</span>
            </button>
          ))}
        </div>
        <p className="text-puma-muted/60 text-[10px] mt-1.5">
          현재: <span className={currentStyle.color}>{currentStyle.label}</span> — {currentStyle.prefix.slice(0, 60)}...
        </p>
      </div>

      {/* img2img Upload */}
      <div>
        <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2 block">Image-to-Image (선택)</label>
        {img2imgBase64 ? (
          <div className="relative rounded-xl overflow-hidden border border-puma-border/30">
            <img
              src={`data:image/png;base64,${img2imgBase64}`}
              alt="Reference"
              className="w-full h-40 object-cover"
            />
            <button
              onClick={() => setImg2imgBase64(null)}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-sm"></i>
            </button>
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-[10px] font-semibold">
              img2img Reference
            </div>
          </div>
        ) : (
          <div
            onClick={() => img2imgInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) handleImg2imgUpload(file);
            }}
            className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${
              dragOver ? 'border-puma-accent bg-puma-accent/8' : 'border-puma-border/40 hover:border-puma-accent/40'
            }`}
          >
            <i className="ri-image-add-line text-puma-muted text-xl"></i>
            <p className="text-puma-muted text-xs">이미지를 업로드하면 img2img로 변형합니다</p>
            <p className="text-puma-muted/50 text-[10px]">클릭 또는 드래그 & 드롭 · PNG, JPG, WEBP</p>
          </div>
        )}
        <input
          ref={img2imgInputRef}
          type="file"
          accept="image/*"
          onChange={handleImg2imgInput}
          className="hidden"
        />
      </div>

      {/* LoRA Section */}
      <div className="bg-puma-surface rounded-xl border border-puma-border/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide">LoRA Adapters</label>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-400/15 text-pink-400 text-xs font-semibold hover:bg-pink-400/25 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i>LoRA 업로드
          </button>
        </div>

        {loras.length === 0 ? (
          <p className="text-puma-muted/60 text-xs text-center py-2">
            LoRA 파일(.safetensors, .pt, .ckpt)을 업로드하여 캐릭터/스타일을 적용하세요
          </p>
        ) : (
          <div className="space-y-2">
            {loras.map(lora => (
              <div
                key={lora.id}
                onClick={() => setSelectedLora(selectedLora === lora.id ? '' : lora.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                  selectedLora === lora.id
                    ? 'border-pink-400/50 bg-pink-400/8'
                    : 'border-puma-border/30 bg-puma-bg hover:border-puma-border/50'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${selectedLora === lora.id ? 'bg-pink-400/15' : 'bg-puma-card'}`}>
                  <i className={`ri-image-2-line ${selectedLora === lora.id ? 'text-pink-400' : 'text-puma-muted'} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${selectedLora === lora.id ? 'text-puma-text' : 'text-puma-muted'}`}>{lora.name}</p>
                  <p className="text-puma-muted/60 text-[10px]">trigger: &lt;lora:{lora.triggerWord}:X&gt;</p>
                </div>
                {selectedLora === lora.id && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={loraStrength}
                      onChange={(e) => setLoraStrength(parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 accent-pink-400"
                    />
                    <span className="text-pink-400 text-xs font-bold w-8">{loraStrength.toFixed(1)}</span>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeLoRA(lora.id); }}
                  className="w-6 h-6 flex items-center justify-center rounded text-puma-muted hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".safetensors,.pt,.pth,.ckpt"
          onChange={handleLoRAUpload}
          className="hidden"
        />
      </div>

      {/* Resolution & Seed & Batch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Resolution */}
        <div>
          <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2 block">Resolution</label>
          <div className="space-y-1.5">
            {(Object.entries(RESOLUTIONS) as [Resolution, typeof RESOLUTIONS[Resolution]][]).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setResolution(key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                  resolution === key
                    ? 'border-puma-accent/50 bg-puma-accent/8 text-puma-text'
                    : 'border-puma-border/30 bg-puma-bg text-puma-muted hover:border-puma-border/50'
                }`}
              >
                <span className="font-medium">{info.label}</span>
                <span className="text-puma-muted/60">{info.width}×{info.height}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seed */}
        <div>
          <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2 block">Seed</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseRandomSeed(!useRandomSeed)}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                  useRandomSeed ? 'bg-puma-accent' : 'bg-puma-border/50'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  useRandomSeed ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}></span>
              </button>
              <span className="text-puma-muted text-xs">{useRandomSeed ? 'Random' : 'Fixed'}</span>
            </div>
            {!useRandomSeed && (
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent"
                placeholder="Enter seed number"
              />
            )}
            <button
              onClick={() => { setSeed(Math.floor(Math.random() * 1000000)); setUseRandomSeed(false); }}
              className="w-full py-1.5 rounded-lg border border-puma-border/30 text-puma-muted text-xs hover:border-puma-accent/50 hover:text-puma-accent transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-shuffle-line mr-1"></i>랜덤 시드 생성
            </button>
          </div>
        </div>

        {/* Batch */}
        <div>
          <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2 block">Batch Count</label>
          <div className="flex items-center gap-2">
            {[1, 2, 4].map(n => (
              <button
                key={n}
                onClick={() => setBatchCount(n)}
                className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  batchCount === n
                    ? 'border-puma-accent/50 bg-puma-accent/8 text-puma-accent'
                    : 'border-puma-border/30 bg-puma-bg text-puma-muted hover:border-puma-border/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-puma-muted/50 text-[10px] mt-2">한 번에 생성할 이미지 수</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-400/10 border border-red-400/20 rounded-lg">
          <i className="ri-error-warning-line text-red-400 text-sm"></i>
          <span className="text-red-400 text-xs">{error}</span>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
          prompt.trim() && !isGenerating
            ? 'bg-pink-400/20 border border-pink-400/40 text-pink-400 hover:bg-pink-400/30'
            : 'bg-puma-card text-puma-muted cursor-not-allowed'
        }`}
      >
        {isGenerating ? (
          <>
            <i className="ri-loader-4-line animate-spin"></i>
            이미지 생성 중... {batchCount > 1 ? `(1/${batchCount})` : ''}
          </>
        ) : (
          <>
            <i className="ri-magic-line"></i>
            {batchCount > 1 ? `${batchCount}장 생성` : '이미지 생성'}
          </>
        )}
      </button>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-puma-text text-sm font-bold flex items-center gap-2">
              <i className="ri-image-line text-puma-accent"></i>
              생성 결과
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Download All */}
              <button
                onClick={async () => {
                  for (let i = 0; i < generatedImages.length; i++) {
                    const link = document.createElement('a');
                    link.href = generatedImages[i];
                    link.download = `gfd-generated-${style}-${Date.now()}-${i}.png`;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    await new Promise(r => setTimeout(r, 300));
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-400/15 text-green-400 text-xs font-semibold hover:bg-green-400/25 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-download-cloud-line"></i>전체 다운로드
              </button>
              {/* Gallery Link */}
              <button
                onClick={() => window.open('/gallery', '_blank')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-puma-accent/15 text-puma-accent text-xs font-semibold hover:bg-puma-accent/25 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-gallery-line"></i>갤러리 보기
              </button>
              {generatedImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDownload(generatedImages[i], i)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-puma-card text-puma-muted text-xs hover:text-puma-accent hover:bg-puma-accent/10 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-download-line"></i>#{i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className={`grid gap-3 ${generatedImages.length === 1 ? 'grid-cols-1' : generatedImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
            {generatedImages.map((url, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border border-puma-border/30 group">
                <img
                  src={url}
                  alt={`Generated ${i + 1}`}
                  className="w-full object-cover"
                  style={{ aspectRatio: `${resInfo.width}/${resInfo.height}` }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(url, i)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
                    >
                      <i className="ri-download-line text-lg"></i>
                    </button>
                    <button
                      onClick={() => {
                        setImg2imgBase64(null);
                        // Use this image as new img2img reference
                        fetch(url)
                          .then(r => r.blob())
                          .then(b => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const base64 = (reader.result as string).split(',')[1];
                              setImg2imgBase64(base64);
                            };
                            reader.readAsDataURL(b);
                          });
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
                    >
                      <i className="ri-image-edit-line text-lg"></i>
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-[10px] font-semibold">
                  {resInfo.label} · #{i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Toggle */}
      <div className="border-t border-puma-border/20 pt-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-puma-muted text-xs font-semibold hover:text-puma-text transition-colors cursor-pointer"
        >
          <i className={showHistory ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
          생성 기록 ({history.length}개)
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-puma-muted/60 text-xs text-center py-4">아직 생성 기록이 없습니다</p>
            ) : (
              history.map(record => {
                const styleInfo = STYLE_PRESETS[record.style];
                return (
                  <div key={record.id} className="flex items-start gap-3 bg-puma-bg rounded-xl border border-puma-border/20 p-3">
                    <img
                      src={record.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${styleInfo.bg} ${styleInfo.color}`}>{styleInfo.label}</span>
                        <span className="text-puma-muted text-[10px]">{RESOLUTIONS[record.resolution].label}</span>
                        <span className="text-puma-muted/50 text-[10px]">seed:{record.seed}</span>
                      </div>
                      <p className="text-puma-text text-xs mt-1 truncate">{record.prompt}</p>
                      <p className="text-puma-muted/60 text-[10px] mt-0.5">
                        {new Date(record.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleDownload(record.imageUrl, 0)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent hover:bg-puma-card transition-colors cursor-pointer"
                      >
                        <i className="ri-download-line text-sm"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(record.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
