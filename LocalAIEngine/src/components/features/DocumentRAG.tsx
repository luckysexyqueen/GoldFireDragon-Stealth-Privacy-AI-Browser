import { useRef, useState } from 'react';
import { Upload, FileText, X, Search, Database, ChevronRight, AlertCircle, FileIcon } from 'lucide-react';
import { UploadedFile } from '@/types/engine';
import { cn } from '@/lib/utils';

interface DocumentRAGProps {
  files: UploadedFile[];
  isProcessing: boolean;
  totalChunks: number;
  totalSize: number;
  onAddFile: (file: File) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onTestSearch: (query: string) => string;
  ragEnabled: boolean;
  onToggleRAG: (enabled: boolean) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;   // 10MB for text files
const MAX_PDF_SIZE  = 50 * 1024 * 1024;   // 50MB for PDFs

function isPDFFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export default function DocumentRAG({
  files,
  isProcessing,
  totalChunks,
  totalSize,
  onAddFile,
  onRemoveFile,
  onClearFiles,
  onTestSearch,
  ragEnabled,
  onToggleRAG,
}: DocumentRAGProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState('');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(processFile);
  };

  const processFile = (file: File) => {
    const max = isPDFFile(file) ? MAX_PDF_SIZE : MAX_FILE_SIZE;
    const maxLabel = isPDFFile(file) ? '최대 50MB' : '최대 10MB';
    if (file.size > max) {
      alert(`파일이 너무 큽니다 (${maxLabel}): ${file.name}`);
      return;
    }
    onAddFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    selected.forEach(processFile);
    e.target.value = '';
  };

  const handleTestSearch = () => {
    if (!testQuery.trim()) return;
    const result = onTestSearch(testQuery);
    setTestResult(result || '관련 청크를 찾을 수 없습니다.');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* RAG Toggle */}
      <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-200 terminal-text flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00d4ff]" />
            RAG 모드 (문서 기반 응답)
          </div>
          <p className="text-xs text-gray-500 terminal-text mt-0.5">
            업로드된 문서를 컨텍스트로 사용하여 정확한 응답 생성
          </p>
        </div>
        <button
          onClick={() => onToggleRAG(!ragEnabled)}
          className={cn(
            'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
            ragEnabled
              ? 'bg-[rgba(0,212,170,0.4)] border border-[rgba(0,212,170,0.6)]'
              : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]'
          )}
        >
          <span
            className={cn('absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200', ragEnabled ? 'bg-[#00d4aa]' : 'bg-gray-600')}
            style={{ left: ragEnabled ? '22px' : '2px' }}
          />
        </button>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200',
          dragOver
            ? 'border-[rgba(0,212,255,0.6)] bg-[rgba(0,212,255,0.05)]'
            : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(0,212,170,0.3)] hover:bg-[rgba(0,212,170,0.03)]'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center">
          <Upload className={cn('w-5 h-5 transition-colors', dragOver ? 'text-[#00d4ff]' : 'text-gray-500')} />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400 terminal-text font-medium">파일을 드래그하거나 클릭</p>
          <p className="text-xs text-gray-600 terminal-text mt-0.5">
            <span className="text-red-400 font-semibold">PDF</span> (최대 50MB) · TXT, MD, CSV, JSON, HTML, JS, Python (최대 10MB)
          </p>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-[#ffc800] terminal-text animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffc800] inline-block" />
            처리 중... (PDF는 페이지 분석 중일 수 있습니다)
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.csv,.json,.html,.xml,.js,.ts,.py,.log"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Stats */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: '파일', value: files.length },
            { label: '청크', value: totalChunks },
            { label: '크기', value: formatSize(totalSize) },
          ].map(stat => (
            <div key={stat.label} className="glass-panel-subtle rounded-lg p-2">
              <div className="text-sm font-bold text-[#00d4ff] terminal-text">{stat.value}</div>
              <div className="text-[10px] text-gray-600 terminal-text">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 terminal-text font-medium">업로드된 파일</span>
            <button
              onClick={onClearFiles}
              className="text-xs text-gray-600 hover:text-red-400 terminal-text transition-colors"
            >
              전체 삭제
            </button>
          </div>
          {files.map(file => {
            const pdf = isPDFFile(file);
            return (
              <div key={file.id} className="glass-panel-subtle rounded-lg p-3 flex items-center gap-3">
                {pdf
                  ? <FileIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  : <FileText className="w-4 h-4 text-[#00d4ff] flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-gray-300 terminal-text truncate">{file.name}</p>
                    {pdf && (
                      <span className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold bg-[rgba(255,80,80,0.12)] border border-[rgba(255,80,80,0.2)] text-red-400">
                        PDF
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 terminal-text">
                    {formatSize(file.size)} · {file.chunks?.length || 0} 청크
                  </p>
                </div>
                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Search */}
      {files.length > 0 && (
        <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
          <div className="text-xs font-semibold text-gray-400 terminal-text flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            청크 검색 테스트
          </div>
          <div className="flex gap-2">
            <input
              value={testQuery}
              onChange={e => setTestQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTestSearch()}
              placeholder="검색어 입력..."
              className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-gray-300 terminal-text outline-none focus:border-[rgba(0,212,170,0.3)]"
            />
            <button
              onClick={handleTestSearch}
              className="px-3 py-2 rounded-lg bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] text-[#00d4aa] text-xs terminal-text hover:bg-[rgba(0,212,170,0.2)] transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {testResult && (
            <pre className="text-[10px] text-gray-400 terminal-text bg-[rgba(0,0,0,0.3)] rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
              {testResult}
            </pre>
          )}
        </div>
      )}

      {files.length === 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(0,212,170,0.04)] border border-[rgba(0,212,170,0.12)] text-xs text-gray-600 terminal-text">
          <AlertCircle className="w-3.5 h-3.5 text-[#00d4aa] flex-shrink-0 mt-0.5" />
          <span>
            <span className="text-red-400 font-semibold">PDF</span> 지원 추가됨.{' '}
            PDF 파일을 업로드하면 pdfjs-dist가 모든 페이지 텍스트를 자동 추출하여 청크화합니다.
          </span>
        </div>
      )}
    </div>
  );
}
