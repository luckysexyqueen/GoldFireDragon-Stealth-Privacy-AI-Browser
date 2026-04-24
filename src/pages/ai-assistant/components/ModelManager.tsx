import { useRef, useState } from 'react';
import { AIModel } from '../page';
import {
  useGGUFConverter,
  detectSourceFormat,
  ALLOWED_MODEL_EXTENSIONS,
  SOURCE_FORMAT_INFO,
} from '@/hooks/useGGUFConverter';

interface Props {
  models: AIModel[];
  setModels: (models: AIModel[]) => void;
  activeModel: AIModel | null;
  setActiveModel: (model: AIModel | null) => void;
}

export default function ModelManager({ models, setModels, activeModel, setActiveModel }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [autoConvert, setAutoConvert] = useState(true);
  const [autoConvertFormats, setAutoConvertFormats] = useState<string[]>(['mlc', 'q4_k_m']);
  const [justConverted, setJustConverted] = useState<string | null>(null);
  const { startConversion } = useGGUFConverter();

  const handleLoadModel = (model: AIModel) => {
    if (model.status === 'ready') {
      setActiveModel(model);
      return;
    }
    setLoadingId(model.id);
    // Simulate loading progress
    let progress = 0;
    setModels(models.map((m) => m.id === model.id ? { ...m, status: 'loading', progress: 0 } : m));
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setLoadingId(null);
        const updatedModels = models.map((m) =>
          m.id === model.id ? { ...m, status: 'ready' as const, progress: 100 } : m
        );
        setModels(updatedModels);
        setActiveModel({ ...model, status: 'ready' });
      } else {
        setModels(models.map((m) => m.id === model.id ? { ...m, status: 'loading', progress: Math.round(progress) } : m));
      }
    }, 300);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const srcFmt = detectSourceFormat(file.name);
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    const sizeLabel = parseFloat(sizeMB) > 1024
      ? `${(file.size / 1024 / 1024 / 1024).toFixed(1)} GB`
      : `${sizeMB} MB`;

    const modelId = `custom-${Date.now()}`;
    const modelName = file.name.replace(/\.[^.]+$/, '');
    const srcInfo = SOURCE_FORMAT_INFO[srcFmt];
    const newModel: AIModel = {
      id: modelId,
      name: modelName,
      size: sizeLabel,
      type: 'custom',
      status: 'idle',
      file,
    };
    setModels([...models, newModel]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Auto-convert if enabled
    if (autoConvert && autoConvertFormats.length > 0) {
      setJustConverted(modelId);
      setTimeout(() => setJustConverted(null), 5000);
      startConversion(
        modelId,
        modelName,
        file.size,
        autoConvertFormats as import('@/hooks/useGGUFConverter').ConvertFormat[],
        srcFmt,
      ).catch(() => {});
    }

    console.info(`[ModelManager] Uploaded: ${file.name} → ${srcInfo?.label ?? srcFmt}`);
  };

  const handleDeleteModel = (id: string) => {
    if (activeModel?.id === id) setActiveModel(null);
    setModels(models.filter((m) => m.id !== id));
  };

  const getStatusBadge = (model: AIModel) => {
    if (model.status === 'ready') return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Ready</span>;
    if (model.status === 'loading') return <span className="px-2 py-0.5 bg-puma-accent/20 text-puma-accent text-xs rounded-full">Loading...</span>;
    if (model.status === 'error') return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Error</span>;
    return <span className="px-2 py-0.5 bg-puma-border/30 text-puma-muted text-xs rounded-full">Not loaded</span>;
  };

  const webllmModels = models.filter((m) => m.type === 'webllm');
  const customModels = models.filter((m) => m.type === 'custom');

  return (
    <div className="h-full overflow-y-auto p-5">
      {/* WebGPU Notice */}
      <div className="bg-puma-surface rounded-xl border border-puma-accent/20 p-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="ri-cpu-line text-puma-accent text-base"></i>
          </div>
          <div>
            <p className="text-puma-text text-sm font-semibold">Local AI via WebGPU</p>
            <p className="text-puma-muted text-xs mt-1 leading-relaxed">
              Models run entirely on your device using WebGPU. No data leaves your browser.
              First load downloads the model and caches it permanently.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Custom Model */}
      <div className="mb-5">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Upload Model (All Formats)</h4>

        {/* Auto-convert toggle */}
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="ri-exchange-line text-puma-accent text-base"></i>
              <div>
                <p className="text-puma-text text-sm font-semibold">자동 변환 (Auto Convert)</p>
                <p className="text-puma-muted text-xs">업로드 즉시 선택한 포맷으로 자동 변환 & 저장</p>
              </div>
            </div>
            <button
              onClick={() => setAutoConvert(!autoConvert)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                autoConvert ? 'bg-puma-accent' : 'bg-puma-border/50'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                autoConvert ? 'translate-x-5' : 'translate-x-0.5'
              }`}></span>
            </button>
          </div>

          {autoConvert && (
            <div>
              <p className="text-puma-muted text-xs font-semibold mb-2">자동 변환 포맷 선택:</p>
              <div className="flex flex-wrap gap-1.5">
                {(['mlc', 'webgpu', 'onnx', 'q4_k_m', 'q8_0', 'q2_k', 'f16', 'safetensors'] as const).map(fmt => {
                  const labels: Record<string, string> = {
                    mlc: 'MLC-LLM', webgpu: 'WebGPU', onnx: 'ONNX',
                    q4_k_m: 'Q4_K_M', q8_0: 'Q8_0', q2_k: 'Q2_K',
                    f16: 'Float16', safetensors: 'SafeTensors',
                  };
                  const selected = autoConvertFormats.includes(fmt);
                  return (
                    <button
                      key={fmt}
                      onClick={() => setAutoConvertFormats(prev =>
                        prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
                      )}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                        selected
                          ? 'bg-puma-accent/20 border-puma-accent/50 text-puma-accent'
                          : 'bg-puma-bg border-puma-border/30 text-puma-muted hover:border-puma-border/60'
                      }`}
                    >
                      {labels[fmt]}
                    </button>
                  );
                })}
              </div>
              {autoConvertFormats.length > 0 && (
                <p className="text-puma-muted/60 text-xs mt-2">
                  업로드 시 {autoConvertFormats.length}개 포맷으로 자동 변환됩니다
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-puma-border/50 rounded-xl p-6 flex flex-col items-center gap-3 hover:border-puma-accent/50 hover:bg-puma-surface/50 transition-all duration-200 cursor-pointer"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-puma-accent/10">
            <i className="ri-upload-cloud-2-line text-puma-accent text-2xl"></i>
          </div>
          <div className="text-center">
            <p className="text-puma-text text-sm font-medium">모델 파일 업로드</p>
            <p className="text-puma-muted text-xs mt-1">
              .gguf · .pt · .pth · .bin · .safetensors · .onnx · .json
            </p>
            <p className="text-puma-muted/60 text-[10px] mt-0.5">
              {autoConvert && autoConvertFormats.length > 0
                ? `업로드 즉시 ${autoConvertFormats.length}개 포맷으로 자동 변환됩니다`
                : 'PyTorch / Transformers / SafeTensors / ONNX / GGUF 모두 지원'}
            </p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MODEL_EXTENSIONS}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Auto-convert triggered notification */}
        {justConverted && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-puma-accent/10 border border-puma-accent/20 rounded-lg">
            <i className="ri-loader-4-line text-puma-accent text-sm animate-spin"></i>
            <span className="text-puma-accent text-xs font-medium">
              자동 변환 시작됨 — Converter 탭에서 진행 상황을 확인하세요
            </span>
          </div>
        )}
      </div>

      {/* Custom Models */}
      {customModels.length > 0 && (
        <div className="mb-6">
          <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Custom Models</h4>
          <div className="space-y-2">
            {customModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isActive={activeModel?.id === model.id}
                onLoad={() => handleLoadModel(model)}
                onDelete={() => handleDeleteModel(model.id)}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      )}

      {/* Built-in WebLLM Models */}
      <div>
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Built-in Models (WebLLM)</h4>
        <div className="space-y-2">
          {webllmModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isActive={activeModel?.id === model.id}
              onLoad={() => handleLoadModel(model)}
              onDelete={undefined}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: AIModel;
  isActive: boolean;
  onLoad: () => void;
  onDelete?: () => void;
  getStatusBadge: (model: AIModel) => JSX.Element;
}

function ModelCard({ model, isActive, onLoad, onDelete, getStatusBadge }: ModelCardProps) {
  return (
    <div className={`bg-puma-surface rounded-xl border p-4 transition-all duration-200 ${isActive ? 'border-puma-accent puma-glow-sm' : 'border-puma-border/30'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-puma-bg flex-shrink-0">
            <i className={`${model.type === 'custom' ? 'ri-file-code-line' : 'ri-brain-line'} text-puma-accent text-lg`}></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-puma-text text-sm font-medium">{model.name}</p>
              {getStatusBadge(model)}
              {isActive && <span className="px-2 py-0.5 bg-puma-accent/30 text-puma-accent text-xs rounded-full">Active</span>}
            </div>
            <p className="text-puma-muted text-xs mt-0.5">{model.size} · {model.type === 'custom' ? 'Custom Model' : 'WebLLM'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onDelete && (
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer">
              <i className="ri-delete-bin-line text-base"></i>
            </button>
          )}
          <button
            onClick={onLoad}
            disabled={model.status === 'loading'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-puma-accent/30 text-puma-accent border border-puma-accent/50'
                : model.status === 'loading'
                ? 'bg-puma-border/30 text-puma-muted cursor-not-allowed'
                : 'bg-puma-accent/20 text-puma-accent border border-puma-accent/30 hover:bg-puma-accent/30'
            }`}
          >
            {isActive ? 'Active' : model.status === 'loading' ? `${model.progress ?? 0}%` : model.status === 'ready' ? 'Use' : 'Load'}
          </button>
        </div>
      </div>
      {model.status === 'loading' && (
        <div className="mt-3">
          <div className="w-full bg-puma-bg rounded-full h-1.5">
            <div
              className="bg-puma-accent h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${model.progress ?? 0}%` }}
            ></div>
          </div>
          <p className="text-puma-muted text-xs mt-1">Downloading and caching model... {model.progress ?? 0}%</p>
        </div>
      )}
    </div>
  );
}