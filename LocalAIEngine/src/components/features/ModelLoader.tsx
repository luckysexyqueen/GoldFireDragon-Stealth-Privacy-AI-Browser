import { useState, useEffect } from 'react';
import { Cpu, Download, Zap, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Info } from 'lucide-react';
import { ModelInfo, EngineType, EngineState } from '@/types/engine';
import { WEBLLM_MODELS, GGUF_PRESET_MODELS, ONNX_PRESET_MODELS, ENGINE_LABELS, ENGINE_DESCRIPTIONS } from '@/constants/models';
import { cn } from '@/lib/utils';

interface ModelLoaderProps {
  engineState: EngineState;
  onLoadWebLLM: (modelId: string) => void;
  onLoadGGUF: (modelUrl: string, modelId: string) => void;
  onLoadONNX: (modelId: string) => void;
  onLoadCustom: (url: string, engine: EngineType, name: string) => void;
  onUnload: () => void;
}

const ENGINE_TABS: { id: EngineType; label: string; color: string; badgeClass: string }[] = [
  { id: 'webllm', label: 'WebLLM', color: '#00d4aa', badgeClass: 'engine-badge-webllm' },
  { id: 'gguf',   label: 'GGUF',   color: '#ffc800', badgeClass: 'engine-badge-gguf'   },
  { id: 'onnx',   label: 'ONNX',   color: '#00d4ff', badgeClass: 'engine-badge-onnx'   },
  { id: 'custom', label: 'Custom', color: '#b464ff', badgeClass: 'engine-badge-custom' },
];

export default function ModelLoader({
  engineState,
  onLoadWebLLM,
  onLoadGGUF,
  onLoadONNX,
  onLoadCustom,
  onUnload,
}: ModelLoaderProps) {
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('webllm');
  const [customUrl, setCustomUrl] = useState('');
  const [customEngine, setCustomEngine] = useState<EngineType>('gguf');
  const [customName, setCustomName] = useState('');
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [webgpuOk, setWebgpuOk] = useState<boolean | null>(null);

  useEffect(() => {
    const checkGPU = async () => {
      setWebgpuOk('gpu' in navigator);
    };
    checkGPU();
  }, []);

  const isLoading = engineState.status === 'loading';
  const isReady = engineState.status === 'ready';

  const handleLoad = (model: ModelInfo) => {
    if (model.engine === 'webllm') {
      onLoadWebLLM(model.id);
    } else if (model.engine === 'gguf' && model.url) {
      onLoadGGUF(model.url, model.id);
    } else if (model.engine === 'onnx') {
      onLoadONNX(model.id);
    }
  };

  const handleCustomLoad = () => {
    if (!customUrl.trim()) return;
    onLoadCustom(customUrl.trim(), customEngine, customName || 'Custom Model');
  };

  const currentModels =
    selectedEngine === 'webllm' ? WEBLLM_MODELS :
    selectedEngine === 'gguf'   ? GGUF_PRESET_MODELS :
    selectedEngine === 'onnx'   ? ONNX_PRESET_MODELS : [];

  return (
    <div className="flex flex-col gap-4">
      {/* System Capability Banner */}
      <div className="glass-panel-subtle rounded-xl p-4 flex flex-wrap gap-4 text-xs terminal-text">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', webgpuOk === true ? 'bg-[#00d4aa]' : webgpuOk === false ? 'bg-red-400' : 'bg-gray-500')} />
          <span className="text-gray-400">WebGPU</span>
          <span className={webgpuOk === true ? 'text-[#00d4aa]' : 'text-red-400'}>
            {webgpuOk === null ? '확인 중...' : webgpuOk ? '지원됨' : '미지원 (Chrome 113+ 필요)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00d4aa]" />
          <span className="text-gray-400">WebAssembly</span>
          <span className="text-[#00d4aa]">지원됨</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00d4aa]" />
          <span className="text-gray-400">SharedArrayBuffer</span>
          <span className={typeof SharedArrayBuffer !== 'undefined' ? 'text-[#00d4aa]' : 'text-[#ffc800]'}>
            {typeof SharedArrayBuffer !== 'undefined' ? '지원됨' : '제한됨'}
          </span>
        </div>
      </div>

      {/* Engine Selection Tabs */}
      <div className="flex gap-2 flex-wrap">
        {ENGINE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedEngine(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-bold terminal-text transition-all duration-200 border',
              selectedEngine === tab.id
                ? `${tab.badgeClass} shadow-lg`
                : 'border-[rgba(255,255,255,0.08)] text-gray-500 hover:text-gray-300 hover:border-[rgba(255,255,255,0.15)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Engine Description */}
      <div className="text-xs text-gray-500 terminal-text flex items-start gap-2">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-600" />
        <span>{ENGINE_DESCRIPTIONS[selectedEngine]}</span>
      </div>

      {/* Custom Engine Panel */}
      {selectedEngine === 'custom' && (
        <div className="glass-panel rounded-xl p-5 flex flex-col gap-3">
          <div className="text-sm font-semibold text-[#b464ff] terminal-text flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            커스텀 모델 로드
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-500 terminal-text block mb-1">엔진 타입</label>
              <select
                value={customEngine}
                onChange={e => setCustomEngine(e.target.value as EngineType)}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-gray-200 terminal-text outline-none focus:border-[#b464ff]"
              >
                <option value="webllm">WebLLM (MLC 컴파일된 모델 ID)</option>
                <option value="gguf">GGUF (직접 URL)</option>
                <option value="onnx">ONNX / Transformers.js (HF 모델 ID)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 terminal-text block mb-1">모델 URL / ID</label>
              <input
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder={
                  customEngine === 'gguf'
                    ? 'https://huggingface.co/.../model.gguf'
                    : customEngine === 'webllm'
                    ? 'Llama-3.2-3B-Instruct-q4f16_1-MLC'
                    : 'Xenova/gpt2'
                }
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-gray-200 terminal-text outline-none focus:border-[#b464ff] font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 terminal-text block mb-1">표시 이름 (선택)</label>
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="My Custom Model"
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-gray-200 terminal-text outline-none focus:border-[#b464ff]"
              />
            </div>
            <button
              onClick={handleCustomLoad}
              disabled={!customUrl.trim() || isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[rgba(180,100,255,0.15)] border border-[rgba(180,100,255,0.35)] text-[#b464ff] text-sm font-bold terminal-text hover:bg-[rgba(180,100,255,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              로드
            </button>
          </div>
        </div>
      )}

      {/* Model List */}
      {selectedEngine !== 'custom' && (
        <div className="flex flex-col gap-2">
          {currentModels.map(model => {
            const isLoaded = engineState.modelId === model.id && isReady;
            const isCurrentlyLoading = engineState.modelId === model.id && isLoading;
            const isExpanded = expandedModel === model.id;

            return (
              <div
                key={model.id}
                className={cn(
                  'glass-panel rounded-xl overflow-hidden transition-all duration-200',
                  isLoaded && 'border-[rgba(0,212,170,0.35)] glow-green',
                  isCurrentlyLoading && 'border-[rgba(255,200,0,0.35)]'
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {isLoaded && <CheckCircle2 className="w-4 h-4 text-[#00d4aa] flex-shrink-0" />}
                        <span className="text-sm font-semibold text-gray-200 terminal-text">{model.name}</span>
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold engine-badge-' + model.engine)}>
                          {ENGINE_LABELS[model.engine]}
                        </span>
                        {model.quantization && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[rgba(255,255,255,0.05)] text-gray-500 border border-[rgba(255,255,255,0.08)]">
                            {model.quantization}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 terminal-text">{model.description}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {model.size && (
                        <span className="text-xs text-gray-600 terminal-text whitespace-nowrap">{model.size}</span>
                      )}
                      <button
                        onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                        className="p-1 rounded text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)] grid grid-cols-2 gap-2 text-xs terminal-text">
                      {model.contextLength && (
                        <div>
                          <span className="text-gray-600">컨텍스트</span>
                          <span className="text-gray-400 ml-2">{(model.contextLength / 1024).toFixed(0)}K 토큰</span>
                        </div>
                      )}
                      {model.license && (
                        <div>
                          <span className="text-gray-600">라이선스</span>
                          <span className="text-gray-400 ml-2">{model.license}</span>
                        </div>
                      )}
                      {model.url && (
                        <div className="col-span-2">
                          <a href={model.url} target="_blank" rel="noopener noreferrer"
                            className="text-[#00d4aa] hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            HuggingFace 모델 페이지
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Loading Progress */}
                  {isCurrentlyLoading && (
                    <div className="mt-3 pt-3 border-t border-[rgba(255,200,0,0.1)]">
                      <div className="flex justify-between text-xs terminal-text mb-1">
                        <span className="text-[#ffc800] truncate">{engineState.loadMessage}</span>
                        <span className="text-[#ffc800] ml-2">{engineState.loadProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                        <div
                          className="h-full progress-bar-animated rounded-full transition-all duration-300"
                          style={{ width: `${engineState.loadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-3 flex gap-2">
                    {isLoaded ? (
                      <button
                        onClick={onUnload}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-gray-400 text-xs font-medium terminal-text hover:bg-[rgba(255,255,255,0.08)] transition-all"
                      >
                        언로드
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLoad(model)}
                        disabled={isLoading}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold terminal-text transition-all duration-200',
                          model.engine === 'webllm' ? 'bg-[rgba(0,212,170,0.12)] border border-[rgba(0,212,170,0.3)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.2)]' :
                          model.engine === 'gguf'   ? 'bg-[rgba(255,200,0,0.12)] border border-[rgba(255,200,0,0.3)] text-[#ffc800] hover:bg-[rgba(255,200,0,0.2)]' :
                          'bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.2)]',
                          isLoading && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Download className="w-3.5 h-3.5" />
                        로드
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Loading Progress (any model loading) */}
      {isLoading && engineState.modelId && !currentModels.find(m => m.id === engineState.modelId) && (
        <div className="glass-panel rounded-xl p-4">
          <div className="text-sm text-[#ffc800] terminal-text mb-2 font-medium">로딩 중: {engineState.modelId}</div>
          <div className="text-xs text-gray-500 terminal-text mb-2">{engineState.loadMessage}</div>
          <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
            <div
              className="h-full progress-bar-animated rounded-full transition-all duration-300"
              style={{ width: `${engineState.loadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {engineState.status === 'error' && engineState.error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[rgba(255,50,50,0.08)] border border-[rgba(255,50,50,0.25)] text-red-400 text-xs terminal-text">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">로드 실패</div>
            <div className="text-red-500">{engineState.error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
