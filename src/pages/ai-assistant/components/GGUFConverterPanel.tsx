import { useRef, useState } from 'react';
import {
  useGGUFConverter,
  ConvertFormat,
  SourceFormat,
  FORMAT_INFO,
  SOURCE_FORMAT_INFO,
  CONVERSION_MATRIX,
  ALLOWED_MODEL_EXTENSIONS,
  detectSourceFormat,
  ConvertedModel,
  ConvertJob,
} from '@/hooks/useGGUFConverter';
import { AIModel } from '../page';

interface Props {
  models: AIModel[];
  onModelAdded?: (model: AIModel) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const STATUS_STYLE: Record<ConvertJob['status'], { color: string; bg: string; label: string; icon: string }> = {
  pending:    { color: 'text-puma-muted',   bg: 'bg-puma-card',        label: '대기',   icon: 'ri-time-line' },
  analyzing:  { color: 'text-yellow-400',   bg: 'bg-yellow-400/15',    label: '분석',   icon: 'ri-search-line' },
  converting: { color: 'text-puma-accent',  bg: 'bg-puma-accent/15',   label: '변환',   icon: 'ri-loader-4-line' },
  optimizing: { color: 'text-orange-400',   bg: 'bg-orange-400/15',    label: '최적화', icon: 'ri-settings-3-line' },
  saving:     { color: 'text-teal-400',     bg: 'bg-teal-400/15',      label: '저장',   icon: 'ri-save-line' },
  done:       { color: 'text-green-400',    bg: 'bg-green-400/15',     label: '완료',   icon: 'ri-check-line' },
  error:      { color: 'text-red-400',      bg: 'bg-red-400/15',       label: '오류',   icon: 'ri-error-warning-line' },
};

// ─── Uploaded Source Model ─────────────────────────────────────────
interface SourceModel {
  id: string;
  name: string;
  filename: string;
  size: number;
  sourceFormat: SourceFormat;
  uploadedAt: string;
}

// ─── Job Card ─────────────────────────────────────────────────────
function JobCard({ job, onClear }: { job: ConvertJob; onClear: () => void }) {
  const st = STATUS_STYLE[job.status];
  const fmtInfo = FORMAT_INFO[job.targetFormat];
  const srcInfo = SOURCE_FORMAT_INFO[job.sourceFormat] ?? SOURCE_FORMAT_INFO.unknown;
  const isRunning = job.status !== 'done' && job.status !== 'error' && job.status !== 'pending';

  return (
    <div className="bg-puma-bg rounded-xl border border-puma-border/20 p-3">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 ${fmtInfo.bg}`}>
          <i className={`${fmtInfo.icon} ${fmtInfo.color} text-base`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${srcInfo.bg} ${srcInfo.color}`}>{srcInfo.label}</span>
            <span className="text-puma-muted text-[10px]">→</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fmtInfo.bg} ${fmtInfo.color}`}>{fmtInfo.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${st.bg} ${st.color} flex items-center gap-1`}>
              <i className={`${st.icon} text-[10px] ${isRunning ? 'animate-spin' : ''}`}></i>
              {st.label}
            </span>
          </div>
          <p className="text-puma-text text-xs font-semibold truncate mt-0.5">{job.sourceModelName}</p>
          <p className="text-puma-muted text-xs mt-0.5 truncate">{job.stage}</p>

          {job.status !== 'pending' && job.status !== 'error' && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-puma-muted/60 text-[10px]">{job.progress}%</span>
                {job.status === 'done' && job.completedAt && (
                  <span className="text-green-400/70 text-[10px]">
                    {new Date(job.completedAt).toLocaleTimeString('ko-KR')}
                  </span>
                )}
              </div>
              <div className="w-full bg-puma-card rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    job.status === 'done' ? 'bg-green-400' :
                    job.status === 'error' ? 'bg-red-400' : 'bg-puma-accent'
                  }`}
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {job.status === 'error' && job.error && (
            <p className="text-red-400 text-[10px] mt-1">{job.error}</p>
          )}
        </div>
        {(job.status === 'done' || job.status === 'error') && (
          <button
            onClick={onClear}
            className="w-6 h-6 flex items-center justify-center rounded text-puma-muted hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
          >
            <i className="ri-close-line text-sm"></i>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Converted Model Card ─────────────────────────────────────────
function ConvertedModelCard({ model, onDelete }: { model: ConvertedModel; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const fmtInfo = FORMAT_INFO[model.format];
  const srcInfo = SOURCE_FORMAT_INFO[model.sourceFormat] ?? SOURCE_FORMAT_INFO.unknown;

  // 변환 결과를 JSON 설정 파일로 다운로드
  const handleDownload = () => {
    const exportData = {
      name: model.name,
      format: model.format,
      sourceFormat: model.sourceFormat,
      originalSize: model.originalSize,
      convertedSize: model.convertedSize,
      compressionRatio: model.compressionRatio,
      quantBits: model.quantBits,
      metadata: model.metadata,
      convertConfig: model.convertConfig,
      createdAt: model.createdAt,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.name.replace(/[^a-z0-9]/gi, '_')}_${model.format}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${fmtInfo.bg}`}>
          <i className={`${fmtInfo.icon} ${fmtInfo.color} text-lg`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-puma-text text-sm font-bold truncate">{model.name}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${srcInfo.bg} ${srcInfo.color}`}>{srcInfo.label}</span>
            <span className="text-puma-muted/50 text-[10px]">→</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fmtInfo.bg} ${fmtInfo.color}`}>{fmtInfo.label}</span>
            <span className="px-1.5 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded font-semibold">{fmtInfo.badge}</span>
          </div>
          <p className="text-puma-muted text-xs mt-0.5 line-clamp-1">{model.description}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <i className="ri-file-reduce-line text-puma-muted text-xs"></i>
              <span className="text-puma-muted text-xs">{formatSize(model.originalSize)} → {formatSize(model.convertedSize)}</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="ri-arrow-down-line text-green-400 text-xs"></i>
              <span className="text-green-400 text-xs font-semibold">{model.compressionRatio}% 감소</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="ri-flashlight-line text-yellow-400 text-xs"></i>
              <span className="text-yellow-400 text-xs font-semibold">{model.estimatedSpeed}</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="ri-bit-coin-line text-puma-muted text-xs"></i>
              <span className="text-puma-muted text-xs">{model.quantBits}bit</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleDownload}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent hover:bg-puma-card transition-colors cursor-pointer"
            title="변환 설정 다운로드"
          >
            <i className="ri-download-line text-sm"></i>
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent hover:bg-puma-card transition-colors cursor-pointer"
          >
            <i className={expanded ? 'ri-arrow-up-s-line text-sm' : 'ri-arrow-down-s-line text-sm'}></i>
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
          >
            <i className="ri-delete-bin-line text-sm"></i>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-puma-border/20 pt-3">
          <p className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2">변환 설정 & 메타데이터</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(model.metadata).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 px-2 py-1.5 bg-puma-bg rounded-lg">
                <span className="text-puma-muted/70 text-[10px] font-mono">{k}</span>
                <span className="text-puma-text text-[10px] font-semibold ml-auto">{String(v)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 px-2 py-1.5 bg-puma-accent/8 border border-puma-accent/20 rounded-lg">
            <p className="text-puma-accent text-[10px] font-semibold">변환 설정 (재현 가능)</p>
            <pre className="text-puma-muted text-[10px] mt-1 font-mono overflow-auto">
              {JSON.stringify(model.convertConfig, null, 2)}
            </pre>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-puma-accent/15 text-puma-accent text-xs font-semibold hover:bg-puma-accent/25 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-download-line"></i>변환 설정 다운로드 (.json)
            </button>
          </div>
          <p className="text-puma-muted/50 text-[10px] mt-2">
            생성: {new Date(model.createdAt).toLocaleString('ko-KR')} · 원본: {model.sourceModelName}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Source Format Badge ───────────────────────────────────────────
function SourceFormatBadge({ fmt }: { fmt: SourceFormat }) {
  const info = SOURCE_FORMAT_INFO[fmt] ?? SOURCE_FORMAT_INFO.unknown;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${info.bg} ${info.color}`}>
      <i className={`${info.icon} text-[10px]`}></i>
      {info.label}
    </span>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────
export default function GGUFConverterPanel({ models }: Props) {
  const { jobs, convertedModels, loaded, startConversion, deleteConvertedModel, clearJob, clearAllDoneJobs } = useGGUFConverter();

  // 직접 업로드한 소스 모델 목록 (기존 AIModel + 새로 업로드)
  const [sourceModels, setSourceModels] = useState<SourceModel[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedFormats, setSelectedFormats] = useState<Set<ConvertFormat>>(new Set(['mlc', 'q4_k_m']));
  const [activeTab, setActiveTab] = useState<'convert' | 'results' | 'jobs'>('convert');
  const [isConverting, setIsConverting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 기존 AIModel(custom)도 소스로 사용 가능
  const existingCustomModels = models.filter(m => m.type === 'custom');

  // 전체 소스 목록 = 직접 업로드 + 기존 custom 모델
  const allSources: SourceModel[] = [
    ...sourceModels,
    ...existingCustomModels.map(m => ({
      id: m.id,
      name: m.name,
      filename: m.name + '.gguf',
      size: parseFloat(m.size) * (m.size.includes('GB') ? 1024 * 1024 * 1024 : 1024 * 1024),
      sourceFormat: 'gguf' as SourceFormat,
      uploadedAt: new Date().toISOString(),
    })),
  ];

  const selectedSource = allSources.find(s => s.id === selectedSourceId) ?? allSources[0];
  const availableFormats: ConvertFormat[] = selectedSource
    ? CONVERSION_MATRIX[selectedSource.sourceFormat] ?? []
    : [];

  const activeJobs = jobs.filter(j => j.status !== 'done' && j.status !== 'error');
  const doneJobs = jobs.filter(j => j.status === 'done' || j.status === 'error');

  const toggleFormat = (fmt: ConvertFormat) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(fmt)) next.delete(fmt);
      else next.add(fmt);
      return next;
    });
  };

  // 포맷 변경 시 사용 불가 포맷 제거
  const handleSourceSelect = (id: string) => {
    setSelectedSourceId(id);
    const src = allSources.find(s => s.id === id);
    if (!src) return;
    const available = new Set(CONVERSION_MATRIX[src.sourceFormat] ?? []);
    setSelectedFormats(prev => {
      const next = new Set<ConvertFormat>();
      prev.forEach(f => { if (available.has(f)) next.add(f); });
      if (next.size === 0) {
        // 기본 추천 포맷 자동 선택
        if (available.has('mlc')) next.add('mlc');
        if (available.has('q4_k_m')) next.add('q4_k_m');
        if (available.has('gguf')) next.add('gguf');
      }
      return next;
    });
  };

  const handleFileUpload = (file: File) => {
    const srcFmt = detectSourceFormat(file.name);
    const id = `src-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newSrc: SourceModel = {
      id,
      name: file.name.replace(/\.[^.]+$/, ''),
      filename: file.name,
      size: file.size,
      sourceFormat: srcFmt,
      uploadedAt: new Date().toISOString(),
    };
    setSourceModels(prev => [newSrc, ...prev]);
    handleSourceSelect(id);
    setActiveTab('convert');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleConvert = async () => {
    if (!selectedSource || selectedFormats.size === 0 || isConverting) return;
    setIsConverting(true);
    setActiveTab('jobs');
    await startConversion(
      selectedSource.id,
      selectedSource.name,
      selectedSource.size,
      Array.from(selectedFormats),
      selectedSource.sourceFormat,
    );
    setIsConverting(false);
  };

  const ALL_TARGET_FORMATS: ConvertFormat[] = [
    'mlc', 'webgpu', 'onnx', 'transformers_js',
    'gguf', 'q4_k_m', 'q8_0', 'q2_k', 'f16', 'safetensors',
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-puma-border/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-puma-text font-bold text-base flex items-center gap-2">
              <i className="ri-exchange-line text-puma-accent"></i>
              Universal Model Converter
            </h3>
            <p className="text-puma-muted text-xs mt-0.5">
              PyTorch · Transformers · SafeTensors · ONNX · GGUF → MLC / WebGPU / Q4 / Q8 / Transformer.js
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeJobs.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-puma-accent/10 border border-puma-accent/20 rounded-lg">
                <i className="ri-loader-4-line text-puma-accent text-xs animate-spin"></i>
                <span className="text-puma-accent text-xs font-medium">{activeJobs.length}개 변환 중</span>
              </div>
            )}
            {convertedModels.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-400/10 border border-green-400/20 rounded-lg">
                <i className="ri-check-line text-green-400 text-xs"></i>
                <span className="text-green-400 text-xs font-medium">{convertedModels.length}개 완료</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3">
          {([
            { id: 'convert', label: '변환 설정', icon: 'ri-settings-3-line' },
            { id: 'jobs', label: `작업 현황${activeJobs.length > 0 ? ` (${activeJobs.length})` : ''}`, icon: 'ri-loader-4-line' },
            { id: 'results', label: `변환 결과 (${convertedModels.length})`, icon: 'ri-archive-line' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? 'bg-puma-card text-puma-accent' : 'text-puma-muted hover:text-puma-text'
              }`}
            >
              <i className={`${tab.icon} text-sm ${tab.id === 'jobs' && activeJobs.length > 0 ? 'animate-spin' : ''}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ── 변환 설정 탭 ── */}
        {activeTab === 'convert' && (
          <div className="space-y-5">

            {/* 지원 포맷 안내 */}
            <div className="bg-puma-surface rounded-xl border border-puma-border/20 p-4">
              <p className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-3">지원 입력 포맷</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.entries(SOURCE_FORMAT_INFO) as [SourceFormat, typeof SOURCE_FORMAT_INFO[SourceFormat]][])
                  .filter(([k]) => k !== 'unknown')
                  .map(([key, info]) => (
                    <div key={key} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${info.bg}`}>
                      <i className={`${info.icon} ${info.color} text-sm`}></i>
                      <div>
                        <p className={`text-xs font-bold ${info.color}`}>{info.label}</p>
                        <p className="text-puma-muted/70 text-[10px]">{info.extensions.join(', ')}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 파일 업로드 드롭존 */}
            <div>
              <label className="block text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2">
                모델 파일 업로드
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer ${
                  dragOver
                    ? 'border-puma-accent bg-puma-accent/8'
                    : 'border-puma-border/50 hover:border-puma-accent/50 hover:bg-puma-surface/50'
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-puma-accent/10">
                  <i className="ri-upload-cloud-2-line text-puma-accent text-2xl"></i>
                </div>
                <div className="text-center">
                  <p className="text-puma-text text-sm font-medium">
                    {dragOver ? '여기에 놓으세요!' : '클릭 또는 드래그 & 드롭'}
                  </p>
                  <p className="text-puma-muted text-xs mt-1">
                    .gguf · .pt · .pth · .bin · .safetensors · .onnx · .json
                  </p>
                  <p className="text-puma-muted/60 text-[10px] mt-0.5">
                    PyTorch / Transformers / SafeTensors / ONNX / GGUF 모두 지원
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_MODEL_EXTENSIONS}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* 소스 모델 선택 */}
            {allSources.length > 0 && (
              <div>
                <label className="block text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2">
                  변환할 모델 선택 ({allSources.length}개)
                </label>
                <div className="space-y-2">
                  {allSources.map(src => {
                    const srcInfo = SOURCE_FORMAT_INFO[src.sourceFormat] ?? SOURCE_FORMAT_INFO.unknown;
                    const isSelected = selectedSourceId === src.id || (!selectedSourceId && src === allSources[0]);
                    return (
                      <button
                        key={src.id}
                        onClick={() => handleSourceSelect(src.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'border-puma-accent/50 bg-puma-accent/8'
                            : 'border-puma-border/30 bg-puma-surface hover:border-puma-border/60'
                        }`}
                      >
                        <div className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 ${srcInfo.bg}`}>
                          <i className={`${srcInfo.icon} ${srcInfo.color} text-lg`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-puma-text text-sm font-semibold truncate">{src.name}</p>
                            <SourceFormatBadge fmt={src.sourceFormat} />
                          </div>
                          <p className="text-puma-muted text-xs">{formatSize(src.size)} · {src.filename}</p>
                        </div>
                        {isSelected && (
                          <i className="ri-check-line text-puma-accent text-base flex-shrink-0"></i>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 타겟 포맷 선택 */}
            {allSources.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide">
                    변환 포맷 선택
                    {selectedSource && (
                      <span className="ml-1 text-puma-muted/60 normal-case font-normal">
                        ({SOURCE_FORMAT_INFO[selectedSource.sourceFormat]?.label ?? selectedSource.sourceFormat} 호환 포맷만 표시)
                      </span>
                    )}
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSelectedFormats(new Set(availableFormats))}
                      className="text-puma-accent text-xs cursor-pointer hover:underline whitespace-nowrap"
                    >
                      전체 선택
                    </button>
                    <span className="text-puma-muted/40 text-xs">|</span>
                    <button
                      onClick={() => setSelectedFormats(new Set())}
                      className="text-puma-muted text-xs cursor-pointer hover:underline whitespace-nowrap"
                    >
                      초기화
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_TARGET_FORMATS.map(fmt => {
                    const info = FORMAT_INFO[fmt];
                    const isAvailable = availableFormats.includes(fmt);
                    const selected = selectedFormats.has(fmt);
                    return (
                      <button
                        key={fmt}
                        onClick={() => isAvailable && toggleFormat(fmt)}
                        disabled={!isAvailable}
                        className={`flex items-start gap-3 px-3 py-3 rounded-xl border transition-all text-left ${
                          !isAvailable
                            ? 'border-puma-border/15 bg-puma-bg/50 opacity-40 cursor-not-allowed'
                            : selected
                            ? `border-puma-accent/50 ${info.bg} cursor-pointer`
                            : 'border-puma-border/30 bg-puma-surface hover:border-puma-border/60 cursor-pointer'
                        }`}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${selected && isAvailable ? info.bg : 'bg-puma-card'}`}>
                          <i className={`${info.icon} ${selected && isAvailable ? info.color : 'text-puma-muted'} text-base`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-xs font-bold ${selected && isAvailable ? 'text-puma-text' : 'text-puma-muted'}`}>{info.label}</p>
                            <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${info.bg} ${info.color}`}>{info.badge}</span>
                            {!isAvailable && (
                              <span className="px-1 py-0.5 rounded text-[9px] bg-puma-card text-puma-muted/60">비호환</span>
                            )}
                          </div>
                          <p className="text-puma-muted/70 text-[10px] mt-0.5 leading-relaxed line-clamp-2">{info.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-yellow-400 text-[10px] font-semibold">{info.speedBoost}</span>
                            <span className="text-puma-muted/60 text-[10px]">·</span>
                            <span className="text-green-400 text-[10px]">{Math.round((1 - info.sizeRatio) * 100)}% 크기 감소</span>
                            <span className="text-puma-muted/60 text-[10px]">·</span>
                            <span className="text-puma-muted text-[10px]">{info.bits}bit</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          selected && isAvailable ? 'bg-puma-accent border-puma-accent' : 'border-puma-border/50'
                        }`}>
                          {selected && isAvailable && <i className="ri-check-line text-white text-[10px]"></i>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 변환 요약 & 시작 버튼 */}
            {selectedFormats.size > 0 && selectedSource && (
              <div className="bg-puma-accent/8 border border-puma-accent/20 rounded-xl p-4">
                <p className="text-puma-accent text-xs font-semibold mb-3">변환 요약</p>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-puma-muted">원본 모델</span>
                    <span className="text-puma-text font-medium truncate max-w-[60%] text-right">{selectedSource.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-puma-muted">입력 포맷</span>
                    <SourceFormatBadge fmt={selectedSource.sourceFormat} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-puma-muted">파일 크기</span>
                    <span className="text-puma-text font-medium">{formatSize(selectedSource.size)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-puma-muted">변환 포맷 수</span>
                    <span className="text-puma-accent font-bold">{selectedFormats.size}개</span>
                  </div>
                  <div className="flex items-start justify-between text-xs gap-2">
                    <span className="text-puma-muted flex-shrink-0">선택된 포맷</span>
                    <span className="text-puma-text text-right text-[11px]">
                      {Array.from(selectedFormats).map(f => FORMAT_INFO[f].label).join(' · ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
                    isConverting
                      ? 'bg-puma-card text-puma-muted cursor-not-allowed'
                      : 'bg-puma-accent/20 border border-puma-accent/40 text-puma-accent hover:bg-puma-accent/30'
                  }`}
                >
                  {isConverting ? (
                    <><i className="ri-loader-4-line animate-spin"></i>변환 중...</>
                  ) : (
                    <><i className="ri-exchange-line"></i>{selectedFormats.size}개 포맷으로 자동 변환 시작</>
                  )}
                </button>
              </div>
            )}

            {/* 빈 상태 */}
            {allSources.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-puma-card mb-4">
                  <i className="ri-upload-cloud-2-line text-puma-muted text-3xl"></i>
                </div>
                <p className="text-puma-text text-sm font-semibold mb-1">모델 파일을 업로드하세요</p>
                <p className="text-puma-muted text-xs leading-relaxed">
                  .gguf / .pt / .pth / .bin / .safetensors / .onnx<br />
                  PyTorch, Transformers, ONNX 모두 지원합니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 작업 현황 탭 ── */}
        {activeTab === 'jobs' && (
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-puma-card mb-3 text-3xl">⚙️</div>
                <p className="text-puma-muted text-sm">변환 작업이 없습니다</p>
                <button onClick={() => setActiveTab('convert')} className="mt-2 text-puma-accent text-xs cursor-pointer hover:underline">변환 시작하기</button>
              </div>
            ) : (
              <>
                {doneJobs.length > 0 && (
                  <div className="flex justify-end">
                    <button onClick={clearAllDoneJobs} className="text-puma-muted/60 text-xs hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap">
                      <i className="ri-delete-bin-line mr-1"></i>완료된 작업 모두 삭제
                    </button>
                  </div>
                )}
                {activeJobs.length > 0 && (
                  <div>
                    <p className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2">진행 중 ({activeJobs.length})</p>
                    <div className="space-y-2">
                      {activeJobs.map(job => <JobCard key={job.id} job={job} onClear={() => clearJob(job.id)} />)}
                    </div>
                  </div>
                )}
                {doneJobs.length > 0 && (
                  <div>
                    <p className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-2 mt-4">완료 / 오류 ({doneJobs.length})</p>
                    <div className="space-y-2">
                      {doneJobs.map(job => <JobCard key={job.id} job={job} onClear={() => clearJob(job.id)} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── 변환 결과 탭 ── */}
        {activeTab === 'results' && (
          <div className="space-y-3">
            {!loaded ? (
              <div className="flex items-center justify-center py-12">
                <i className="ri-loader-4-line text-puma-accent text-2xl animate-spin"></i>
              </div>
            ) : convertedModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-puma-card mb-3 text-3xl">📦</div>
                <p className="text-puma-muted text-sm">변환된 모델이 없습니다</p>
                <button onClick={() => setActiveTab('convert')} className="mt-2 text-puma-accent text-xs cursor-pointer hover:underline">변환 시작하기</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-puma-muted text-xs">{convertedModels.length}개 변환 완료 · IndexedDB 저장됨</p>
                </div>
                {convertedModels.map(m => (
                  <ConvertedModelCard key={m.id} model={m} onDelete={() => deleteConvertedModel(m.id)} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
