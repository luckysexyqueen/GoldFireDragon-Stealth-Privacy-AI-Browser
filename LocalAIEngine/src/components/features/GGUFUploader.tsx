import { useState, useRef } from 'react';
import { Upload, HardDrive, Trash2, ExternalLink, AlertCircle, CloudUpload } from 'lucide-react';
import { DBGgufUpload } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface GGUFUploaderProps {
  uploads: DBGgufUpload[];
  loading: boolean;
  uploading: boolean;
  uploadProgress: number;
  onUpload: (file: File, displayName: string, quantization?: string, description?: string) => Promise<DBGgufUpload | null>;
  onDelete: (id: string, storagePath: string, displayName: string) => Promise<void>;
  onLoad: (url: string, name: string) => void;
}

export default function GGUFUploader({
  uploads,
  loading,
  uploading,
  uploadProgress,
  onUpload,
  onDelete,
  onLoad,
}: GGUFUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState('');
  const [quantization, setQuantization] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!displayName) {
      setDisplayName(file.name.replace('.gguf', '').replace(/_/g, ' '));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.gguf') || file.type === 'application/octet-stream')) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !displayName.trim()) return;
    const result = await onUpload(selectedFile, displayName.trim(), quantization || undefined, description || undefined);
    if (result) {
      setSelectedFile(null);
      setDisplayName('');
      setQuantization('');
      setDescription('');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <HardDrive className="w-4 h-4 text-[#ffc800]" />
        <span className="text-sm font-semibold text-gray-300 terminal-text">GGUF 모델 업로드</span>
      </div>
      <p className="text-xs text-gray-600 terminal-text -mt-2">
        .gguf 파일을 Supabase Storage에 업로드하여 클라우드에서 로드합니다. (최대 10GB)
      </p>

      {/* File Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200',
          dragOver
            ? 'border-[rgba(255,200,0,0.6)] bg-[rgba(255,200,0,0.05)]'
            : selectedFile
            ? 'border-[rgba(255,200,0,0.4)] bg-[rgba(255,200,0,0.04)]'
            : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,200,0,0.3)]'
        )}
      >
        <CloudUpload className={cn('w-8 h-8 transition-colors', dragOver || selectedFile ? 'text-[#ffc800]' : 'text-gray-600')} />
        {selectedFile ? (
          <div className="text-center">
            <p className="text-sm text-[#ffc800] terminal-text font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-500 terminal-text">{formatSize(selectedFile.size)}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-400 terminal-text">.gguf 파일 드래그 또는 클릭</p>
            <p className="text-xs text-gray-600 terminal-text mt-0.5">최대 10GB · llama.cpp WASM으로 직접 실행</p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".gguf,application/octet-stream"
        onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      {/* Metadata */}
      {selectedFile && (
        <div className="flex flex-col gap-2">
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="표시 이름 *"
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-xs text-gray-300 terminal-text outline-none focus:border-[rgba(255,200,0,0.3)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={quantization}
              onChange={e => setQuantization(e.target.value)}
              placeholder="양자화 (예: Q4_K_M)"
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-xs text-gray-300 terminal-text outline-none focus:border-[rgba(255,200,0,0.3)]"
            />
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="설명 (선택)"
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-xs text-gray-300 terminal-text outline-none focus:border-[rgba(255,200,0,0.3)]"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!displayName.trim() || uploading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[rgba(255,200,0,0.15)] border border-[rgba(255,200,0,0.35)] text-[#ffc800] text-xs font-bold terminal-text hover:bg-[rgba(255,200,0,0.25)] transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? `업로드 중... ${uploadProgress}%` : '업로드 시작'}
          </button>

          {uploading && (
            <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, #ffc800, #ff8c00)',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Uploaded Models List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 terminal-text font-medium">
            업로드된 모델 {uploads.length > 0 && `(${uploads.length})`}
          </span>
        </div>

        {loading ? (
          <div className="text-xs text-gray-600 terminal-text py-4 text-center animate-pulse">불러오는 중...</div>
        ) : uploads.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(255,200,0,0.04)] border border-[rgba(255,200,0,0.1)] text-xs text-gray-600 terminal-text">
            <AlertCircle className="w-3.5 h-3.5 text-[#ffc800] flex-shrink-0" />
            아직 업로드된 GGUF 모델이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {uploads.map(upload => (
              <div key={upload.id} className="glass-panel rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold text-gray-200 terminal-text truncate">{upload.display_name}</span>
                      {upload.quantization && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[rgba(255,200,0,0.1)] border border-[rgba(255,200,0,0.2)] text-[#ffc800]">
                          {upload.quantization}
                        </span>
                      )}
                    </div>
                    {upload.description && (
                      <p className="text-[10px] text-gray-600 terminal-text">{upload.description}</p>
                    )}
                    <p className="text-[10px] text-gray-700 terminal-text">{formatSize(upload.file_size)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {upload.download_url && (
                      <a
                        href={upload.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded text-gray-600 hover:text-[#ffc800] transition-colors"
                        title="다운로드 URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDelete(upload.id, upload.storage_path, upload.display_name)}
                      className="p-1.5 rounded text-gray-600 hover:text-red-400 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {upload.download_url && (
                  <button
                    onClick={() => onLoad(upload.download_url!, upload.display_name)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(255,200,0,0.1)] border border-[rgba(255,200,0,0.25)] text-[#ffc800] text-xs font-bold terminal-text hover:bg-[rgba(255,200,0,0.2)] transition-all"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    GGUF 로드
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
