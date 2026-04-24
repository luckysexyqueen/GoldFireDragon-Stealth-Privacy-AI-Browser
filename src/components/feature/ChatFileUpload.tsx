import { useRef, useState, useCallback } from 'react';

export interface ChatUploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;       // text / base64 dataURL / extracted text
  previewUrl?: string;   // images only
  fileKind: 'text' | 'json' | 'image' | 'pdf' | 'gguf' | 'audio' | 'video' | 'binary';
}

interface Props {
  files: ChatUploadedFile[];
  onChange: (files: ChatUploadedFile[]) => void;
  compact?: boolean; // compact mode for chat input bar
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function detectKind(file: File): ChatUploadedFile['fileKind'] {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (name.endsWith('.gguf')) return 'gguf';
  if (type.startsWith('image/') || ['.jpg','.jpeg','.png','.gif','.webp','.bmp','.svg','.avif','.ico'].some(e => name.endsWith(e))) return 'image';
  if (type.startsWith('audio/') || ['.mp3','.wav','.ogg','.flac','.aac','.m4a'].some(e => name.endsWith(e))) return 'audio';
  if (type.startsWith('video/') || ['.mp4','.webm','.mov','.avi','.mkv'].some(e => name.endsWith(e))) return 'video';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type === 'application/json' || name.endsWith('.json') || name.endsWith('.jsonl')) return 'json';
  if (
    type.startsWith('text/') ||
    ['.txt','.md','.csv','.log','.xml','.html','.htm','.css','.js','.ts','.tsx','.jsx',
     '.py','.rb','.go','.rs','.java','.c','.cpp','.h','.sh','.yaml','.yml','.toml',
     '.ini','.cfg','.conf','.env','.sql','.graphql','.vue','.svelte','.mdx','.rst',
     '.tex','.rtf','.srt','.vtt'].some(e => name.endsWith(e))
  ) return 'text';
  return 'binary';
}

function getKindStyle(kind: ChatUploadedFile['fileKind']): { icon: string; color: string; bg: string; label: string } {
  switch (kind) {
    case 'image':  return { icon: 'ri-image-line',       color: 'text-puma-accent',  bg: 'bg-puma-accent/15',  label: '이미지' };
    case 'pdf':    return { icon: 'ri-file-pdf-line',    color: 'text-red-400',      bg: 'bg-red-400/15',      label: 'PDF' };
    case 'json':   return { icon: 'ri-file-code-line',   color: 'text-yellow-400',   bg: 'bg-yellow-400/15',   label: 'JSON' };
    case 'text':   return { icon: 'ri-file-text-line',   color: 'text-green-400',    bg: 'bg-green-400/15',    label: '텍스트' };
    case 'gguf':   return { icon: 'ri-cpu-line',         color: 'text-orange-400',   bg: 'bg-orange-400/15',   label: 'GGUF' };
    case 'audio':  return { icon: 'ri-music-line',       color: 'text-pink-400',     bg: 'bg-pink-400/15',     label: '오디오' };
    case 'video':  return { icon: 'ri-video-line',       color: 'text-teal-400',     bg: 'bg-teal-400/15',     label: '비디오' };
    default:       return { icon: 'ri-file-line',        color: 'text-puma-muted',   bg: 'bg-puma-card',       label: '파일' };
  }
}

function extractPdfText(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const raw = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    let text = '';
    const btEt = /BT([\s\S]*?)ET/g;
    let m;
    while ((m = btEt.exec(raw)) !== null) {
      const strRe = /\(([^)]*)\)/g;
      let sm;
      while ((sm = strRe.exec(m[1])) !== null) {
        const s = sm[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
        if (s.trim()) text += s + ' ';
      }
    }
    return text.trim().slice(0, 8000) || '(PDF 텍스트 추출 완료)';
  } catch { return '(PDF 파싱 오류)'; }
}

async function readFileContent(file: File): Promise<ChatUploadedFile> {
  const id = `cf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const kind = detectKind(file);
  const base: ChatUploadedFile = { id, name: file.name, size: file.size, type: file.type || 'application/octet-stream', fileKind: kind, content: '' };

  return new Promise(resolve => {
    const reader = new FileReader();

    if (kind === 'text' || kind === 'json') {
      reader.onload = () => resolve({ ...base, content: ((reader.result as string) || '').slice(0, 80000) });
      reader.onerror = () => resolve({ ...base, content: '(읽기 오류)' });
      reader.readAsText(file, 'UTF-8');
    } else if (kind === 'image') {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ ...base, content: dataUrl, previewUrl: dataUrl });
      };
      reader.onerror = () => resolve(base);
      reader.readAsDataURL(file);
    } else if (kind === 'pdf') {
      reader.onload = () => {
        const extracted = extractPdfText(reader.result as ArrayBuffer);
        resolve({ ...base, content: extracted });
      };
      reader.onerror = () => resolve(base);
      reader.readAsArrayBuffer(file);
    } else if (kind === 'audio' || kind === 'video') {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ ...base, content: dataUrl, previewUrl: kind === 'video' ? dataUrl : undefined });
      };
      reader.onerror = () => resolve(base);
      reader.readAsDataURL(file);
    } else if (kind === 'gguf') {
      const slice = file.slice(0, 1024);
      const hr = new FileReader();
      hr.onload = () => {
        const buf = hr.result as ArrayBuffer;
        const bytes = new Uint8Array(buf);
        const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
        const version = new DataView(buf).getUint32(4, true);
        resolve({ ...base, content: `GGUF Model\nMagic: ${magic}\nVersion: ${version}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\nFile: ${file.name}` });
      };
      hr.onerror = () => resolve({ ...base, content: `GGUF: ${file.name}` });
      hr.readAsArrayBuffer(slice);
    } else {
      reader.onload = () => {
        const text = (reader.result as string) || '';
        resolve({ ...base, content: text.replace(/[^\x20-\x7E\n\r\t가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000) });
      };
      reader.onerror = () => resolve(base);
      reader.readAsText(file, 'latin1');
    }
  });
}

// ─── Compact chip shown in chat input ────────────────────────────
function FileChip({ file, onRemove }: { file: ChatUploadedFile; onRemove: () => void }) {
  const style = getKindStyle(file.fileKind);
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border border-puma-border/20 ${style.bg} group relative`}>
      {file.fileKind === 'image' && file.previewUrl ? (
        <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
          <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <i className={`${style.icon} ${style.color} text-xs flex-shrink-0`}></i>
      )}
      <span className="text-puma-text text-xs max-w-[80px] truncate">{file.name}</span>
      <span className={`text-[10px] ${style.color} flex-shrink-0`}>{formatSize(file.size)}</span>
      <button
        onClick={onRemove}
        className="w-4 h-4 flex items-center justify-center rounded-full bg-puma-card/80 text-puma-muted hover:text-red-400 transition-colors cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        <i className="ri-close-line text-[10px]"></i>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function ChatFileUpload({ files, onChange, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setReading(true);
    const arr = Array.from(fileList);
    const results: ChatUploadedFile[] = [];
    for (const f of arr) {
      results.push(await readFileContent(f));
    }
    setReading(false);
    onChange([...files, ...results]);
  }, [files, onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => onChange(files.filter(f => f.id !== id));

  if (compact) {
    // Compact mode: just the upload button + chips row
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <input ref={inputRef} type="file" multiple accept="*/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={reading}
          className="flex items-center gap-1 px-2 py-1.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs hover:border-puma-accent/40 hover:text-puma-accent transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
          title="파일 첨부 (모든 형식)"
        >
          {reading
            ? <i className="ri-loader-4-line text-sm animate-spin"></i>
            : <i className="ri-attachment-line text-sm"></i>
          }
          <span className="hidden sm:inline">{reading ? '읽는 중...' : '파일'}</span>
        </button>
        {files.map(f => (
          <FileChip key={f.id} file={f} onRemove={() => removeFile(f.id)} />
        ))}
      </div>
    );
  }

  // Full mode: drop zone + file list
  return (
    <div>
      <input ref={inputRef} type="file" multiple accept="*/*" className="hidden" onChange={e => handleFiles(e.target.files)} />

      {reading && (
        <div className="flex items-center gap-2 px-3 py-2 bg-puma-accent/10 border border-puma-accent/20 rounded-lg mb-2">
          <i className="ri-loader-4-line text-puma-accent text-sm animate-spin"></i>
          <span className="text-puma-accent text-xs">파일 읽는 중...</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map(f => (
            <FileChip key={f.id} file={f} onRemove={() => removeFile(f.id)} />
          ))}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragOver
            ? 'border-puma-accent/60 bg-puma-accent/5'
            : 'border-puma-border/30 hover:border-puma-accent/40 hover:bg-puma-card/20'
        }`}
      >
        <i className="ri-upload-cloud-2-line text-puma-muted text-base"></i>
        <span className="text-puma-muted text-xs">파일 드래그 또는 클릭 · 모든 형식 · 무제한</span>
      </div>
    </div>
  );
}

// ─── Helper: build context string from uploaded files ─────────────
export function buildFileContext(files: ChatUploadedFile[]): string {
  if (files.length === 0) return '';
  const parts: string[] = [`\n\n[첨부 파일 ${files.length}개]`];
  files.forEach(f => {
    const style = getKindStyle(f.fileKind);
    if (f.fileKind === 'image') {
      parts.push(`\n📎 ${f.name} (${style.label}, ${formatSize(f.size)}) — 이미지 첨부됨`);
    } else if (f.fileKind === 'audio') {
      parts.push(`\n📎 ${f.name} (${style.label}, ${formatSize(f.size)}) — 오디오 파일 첨부됨`);
    } else if (f.fileKind === 'video') {
      parts.push(`\n📎 ${f.name} (${style.label}, ${formatSize(f.size)}) — 비디오 파일 첨부됨`);
    } else if (f.content) {
      parts.push(`\n📎 ${f.name} (${style.label}):\n\`\`\`\n${f.content.slice(0, 3000)}${f.content.length > 3000 ? '\n...(이하 생략)' : ''}\n\`\`\``);
    }
  });
  return parts.join('');
}
