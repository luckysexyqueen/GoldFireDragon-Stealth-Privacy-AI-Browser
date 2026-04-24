import { useRef, useState } from 'react';
import { UploadedFile } from '@/hooks/useCustomAI';

interface Props {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

export interface ExtendedFile extends UploadedFile {
  previewUrl?: string;   // for images
  extractedText?: string; // for PDF text extraction attempt
  fileKind?: 'text' | 'json' | 'image' | 'pdf' | 'gguf' | 'binary';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function detectKind(file: File): ExtendedFile['fileKind'] {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (name.endsWith('.gguf')) return 'gguf';
  if (type.startsWith('image/') || ['.jpg','.jpeg','.png','.gif','.webp','.bmp','.svg','.ico','.tiff','.avif'].some(e => name.endsWith(e))) return 'image';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type === 'application/json' || name.endsWith('.json') || name.endsWith('.jsonl')) return 'json';
  if (
    type.startsWith('text/') ||
    ['.txt','.md','.csv','.log','.xml','.html','.htm','.css','.js','.ts','.tsx','.jsx',
     '.py','.rb','.go','.rs','.java','.c','.cpp','.h','.sh','.yaml','.yml','.toml',
     '.ini','.cfg','.conf','.env','.sql','.graphql','.vue','.svelte','.mdx','.rst',
     '.tex','.rtf','.srt','.vtt','.ass','.sub'].some(e => name.endsWith(e))
  ) return 'text';
  return 'binary';
}

function getFileIcon(kind: ExtendedFile['fileKind']): string {
  switch (kind) {
    case 'pdf': return 'ri-file-pdf-line';
    case 'image': return 'ri-image-line';
    case 'json': return 'ri-file-code-line';
    case 'text': return 'ri-file-text-line';
    case 'gguf': return 'ri-cpu-line';
    default: return 'ri-file-line';
  }
}

function getKindLabel(kind: ExtendedFile['fileKind']): string {
  switch (kind) {
    case 'pdf': return 'PDF';
    case 'image': return '이미지';
    case 'json': return 'JSON';
    case 'text': return '텍스트';
    case 'gguf': return 'GGUF 모델';
    default: return '파일';
  }
}

// Extract readable text from PDF binary (basic approach)
function extractPdfText(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    let text = '';
    // Decode as latin1 to preserve byte values
    const raw = Array.from(bytes).map((b) => String.fromCharCode(b)).join('');
    // Extract text between BT and ET markers (PDF text objects)
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      const block = match[1];
      // Extract strings in parentheses
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(block)) !== null) {
        const s = strMatch[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
        if (s.trim().length > 0) text += s + ' ';
      }
    }
    // Also try to extract from stream objects
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    while ((match = streamRegex.exec(raw)) !== null) {
      const streamContent = match[1];
      const printable = streamContent.replace(/[^\x20-\x7E\n\r\t가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (printable.length > 20) text += printable + '\n';
    }
    return text.trim().slice(0, 8000) || '(PDF 텍스트 추출 완료 - 이미지 기반 PDF는 OCR 필요)';
  } catch {
    return '(PDF 파싱 오류)';
  }
}

export default function FileUploadSection({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [readingIds, setReadingIds] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<ExtendedFile | null>(null);

  const readFile = async (file: File): Promise<ExtendedFile> => {
    const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const kind = detectKind(file);

    const base: ExtendedFile = {
      id,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      fileKind: kind,
      content: '',
    };

    return new Promise((resolve) => {
      const reader = new FileReader();

      if (kind === 'text' || kind === 'json') {
        reader.onload = () => {
          const text = (reader.result as string) || '';
          resolve({ ...base, content: text.slice(0, 80000) });
        };
        reader.onerror = () => resolve({ ...base, content: '(읽기 오류)' });
        reader.readAsText(file, 'UTF-8');

      } else if (kind === 'image') {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve({
            ...base,
            content: dataUrl,          // full base64 data URL
            previewUrl: dataUrl,
          });
        };
        reader.onerror = () => resolve(base);
        reader.readAsDataURL(file);

      } else if (kind === 'pdf') {
        reader.onload = () => {
          const buffer = reader.result as ArrayBuffer;
          const extracted = extractPdfText(buffer);
          // Also store base64 for reference
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.byteLength; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          resolve({
            ...base,
            content: extracted,
            extractedText: extracted,
          });
        };
        reader.onerror = () => resolve(base);
        reader.readAsArrayBuffer(file);

      } else if (kind === 'gguf') {
        // Read first 1KB of header for metadata
        const slice = file.slice(0, 1024);
        const headerReader = new FileReader();
        headerReader.onload = () => {
          const buf = headerReader.result as ArrayBuffer;
          const bytes = new Uint8Array(buf);
          // GGUF magic: 0x47 0x47 0x55 0x46 = "GGUF"
          const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
          const version = new DataView(buf).getUint32(4, true);
          resolve({
            ...base,
            content: `GGUF Model File\nMagic: ${magic}\nVersion: ${version}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\nFile: ${file.name}`,
          });
        };
        headerReader.onerror = () => resolve({ ...base, content: `GGUF Model: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` });
        headerReader.readAsArrayBuffer(slice);

      } else {
        // Binary: read as text and keep printable chars
        reader.onload = () => {
          const text = (reader.result as string) || '';
          const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
          resolve({ ...base, content: printable.slice(0, 5000) });
        };
        reader.onerror = () => resolve(base);
        reader.readAsText(file, 'latin1');
      }
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    const tempIds = arr.map(() => `tmp-${Date.now()}-${Math.random()}`);
    setReadingIds(new Set(tempIds));

    const results: ExtendedFile[] = [];
    for (const file of arr) {
      const result = await readFile(file);
      results.push(result);
    }
    setReadingIds(new Set());
    onChange([...files, ...results]);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const removeFile = (id: string) => onChange(files.filter((f) => f.id !== id));

  const extFiles = files as ExtendedFile[];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-puma-text text-sm font-semibold">Knowledge Files</h3>
          <p className="text-puma-muted text-xs mt-0.5">모든 파일 형식 지원 · 무제한 업로드 · 롤플레이 컨텍스트 반영</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-xs font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line"></i>
          파일 추가
        </button>
      </div>

      <input ref={inputRef} type="file" multiple accept="*/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      {/* Reading indicator */}
      {readingIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-puma-accent/10 border border-puma-accent/20 rounded-lg mb-3">
          <i className="ri-loader-4-line text-puma-accent text-sm animate-spin"></i>
          <span className="text-puma-accent text-xs">파일 읽는 중... ({readingIds.size}개)</span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => extFiles.length === 0 && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl transition-all duration-200 ${
          extFiles.length === 0 ? 'border-puma-border/40 hover:border-puma-accent/40 cursor-pointer p-8' : 'border-puma-border/20 p-3'
        }`}
      >
        {extFiles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-puma-card">
              <i className="ri-upload-cloud-2-line text-puma-muted text-2xl"></i>
            </div>
            <div>
              <p className="text-puma-text text-sm font-medium">파일을 드래그하거나 클릭해서 업로드</p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {['TXT', 'JSON', 'PDF', '이미지', 'GGUF', 'CSV', 'MD', 'ZIP', 'MP3', 'MP4', '모든 파일'].map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-puma-card text-puma-muted text-xs rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {extFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-3 px-3 py-2.5 bg-puma-bg rounded-lg border border-puma-border/20 group">
                {/* Thumbnail for images */}
                {file.fileKind === 'image' && file.previewUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-puma-border/20">
                    <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 ${
                    file.fileKind === 'pdf' ? 'bg-red-400/15' :
                    file.fileKind === 'json' ? 'bg-yellow-400/15' :
                    file.fileKind === 'text' ? 'bg-puma-accent/15' :
                    file.fileKind === 'gguf' ? 'bg-orange-400/15' :
                    'bg-puma-surface'
                  }`}>
                    <i className={`${getFileIcon(file.fileKind)} text-lg ${
                      file.fileKind === 'pdf' ? 'text-red-400' :
                      file.fileKind === 'json' ? 'text-yellow-400' :
                      file.fileKind === 'text' ? 'text-puma-accent' :
                      file.fileKind === 'gguf' ? 'text-orange-400' :
                      'text-puma-muted'
                    }`}></i>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-puma-text text-xs font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-puma-muted text-[10px]">{formatSize(file.size)}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                      file.fileKind === 'pdf' ? 'bg-red-400/15 text-red-400' :
                      file.fileKind === 'json' ? 'bg-yellow-400/15 text-yellow-400' :
                      file.fileKind === 'image' ? 'bg-puma-accent/15 text-puma-accent' :
                      file.fileKind === 'text' ? 'bg-green-400/15 text-green-400' :
                      file.fileKind === 'gguf' ? 'bg-orange-400/15 text-orange-400' :
                      'bg-puma-card text-puma-muted'
                    }`}>
                      {getKindLabel(file.fileKind)}
                    </span>
                    {file.content && file.content.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded font-medium">
                        ✓ 인식됨
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Preview button */}
                  {file.content && (
                    <button
                      onClick={() => setPreviewFile(previewFile?.id === file.id ? null : file)}
                      className="w-6 h-6 flex items-center justify-center text-puma-muted hover:text-puma-accent transition-colors cursor-pointer"
                      title="미리보기"
                    >
                      <i className="ri-eye-line text-sm"></i>
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="w-6 h-6 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
              </div>
            ))}

            {/* Preview Panel */}
            {previewFile && (
              <div className="mt-2 bg-puma-bg border border-puma-border/30 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-puma-border/20">
                  <span className="text-puma-text text-xs font-medium">{previewFile.name}</span>
                  <button onClick={() => setPreviewFile(null)} className="text-puma-muted hover:text-puma-text cursor-pointer">
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
                <div className="p-3 max-h-48 overflow-y-auto">
                  {previewFile.fileKind === 'image' && previewFile.previewUrl ? (
                    <img src={previewFile.previewUrl} alt={previewFile.name} className="max-w-full rounded-lg" />
                  ) : (
                    <pre className="text-puma-muted text-xs leading-relaxed whitespace-pre-wrap font-mono">
                      {previewFile.content?.slice(0, 2000) || '(내용 없음)'}
                      {(previewFile.content?.length ?? 0) > 2000 && '\n\n...(이하 생략)'}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Add more */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-puma-border/30 rounded-lg cursor-pointer hover:border-puma-accent/40 transition-colors"
            >
              <i className="ri-add-line text-puma-muted text-sm"></i>
              <span className="text-puma-muted text-xs">파일 더 추가...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}