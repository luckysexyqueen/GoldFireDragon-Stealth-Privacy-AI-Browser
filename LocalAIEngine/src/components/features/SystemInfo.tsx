import { useState, useEffect } from 'react';
import { Monitor, Cpu, Zap, Globe, ChevronRight, Activity } from 'lucide-react';
import { EngineState } from '@/types/engine';
import { ENGINE_LABELS } from '@/constants/models';

interface SystemInfoProps {
  engineState: EngineState;
}

interface SystemCapabilities {
  webgpu: boolean;
  webgpuAdapter: string;
  wasm: boolean;
  sharedArrayBuffer: boolean;
  workers: boolean;
  cores: number;
  memory: string;
  browser: string;
  userAgent: string;
  platform: string;
  isMobile: boolean;
}

async function detectCapabilities(): Promise<SystemCapabilities> {
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(ua);
  const cores = navigator.hardwareConcurrency || 0;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const browser =
    ua.includes('Chrome') ? 'Chrome' :
    ua.includes('Firefox') ? 'Firefox' :
    ua.includes('Safari') ? 'Safari' :
    ua.includes('Edge') ? 'Edge' : 'Unknown';

  let webgpu = false;
  let webgpuAdapter = '';

  if ('gpu' in navigator) {
    try {
      const adapter = await (navigator as unknown as { gpu: { requestAdapter: () => Promise<{ info?: { vendor: string; architecture: string } }> } }).gpu.requestAdapter();
      if (adapter) {
        webgpu = true;
        const info = adapter.info;
        webgpuAdapter = info ? `${info.vendor} ${info.architecture}`.trim() : '지원됨';
      }
    } catch {
      webgpu = false;
    }
  }

  return {
    webgpu,
    webgpuAdapter,
    wasm: typeof WebAssembly === 'object',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    workers: typeof Worker !== 'undefined',
    cores,
    memory: mem ? `${mem} GB` : '알 수 없음',
    browser,
    userAgent: ua.slice(0, 80),
    platform: navigator.platform || '알 수 없음',
    isMobile,
  };
}

export default function SystemInfo({ engineState }: SystemInfoProps) {
  const [caps, setCaps] = useState<SystemCapabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectCapabilities().then(c => {
      setCaps(c);
      setLoading(false);
    });
  }, []);

  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
      <span className="text-xs text-gray-500 terminal-text">{label}</span>
      <span className={`text-xs font-medium terminal-text px-2 py-0.5 rounded ${ok ? 'text-[#00d4aa] bg-[rgba(0,212,170,0.1)]' : 'text-red-400 bg-[rgba(255,50,50,0.1)]'}`}>
        {ok ? '지원됨' : '미지원'}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Engine Status */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#00d4aa]" />
          <span className="text-xs font-semibold text-gray-400 terminal-text">엔진 상태</span>
        </div>
        {engineState.modelId ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 terminal-text">모델</span>
              <span className="text-xs text-gray-300 terminal-text truncate max-w-[180px]">{engineState.modelId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 terminal-text">엔진</span>
              <span className={`text-xs font-bold terminal-text engine-badge-${engineState.type || 'custom'} px-2 py-0.5 rounded`}>
                {ENGINE_LABELS[engineState.type || 'custom']}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 terminal-text">상태</span>
              <span className={`text-xs terminal-text font-medium ${
                engineState.status === 'ready' ? 'text-[#00d4aa]' :
                engineState.status === 'generating' ? 'text-[#00d4ff]' :
                engineState.status === 'loading' ? 'text-[#ffc800]' : 'text-red-400'
              }`}>
                {engineState.status === 'ready' ? '준비됨' :
                 engineState.status === 'generating' ? '생성 중' :
                 engineState.status === 'loading' ? '로딩 중' : '오류'}
              </span>
            </div>
            {engineState.tokensPerSecond > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 terminal-text">처리 속도</span>
                <span className="text-xs text-[#00d4ff] terminal-text font-bold">{engineState.tokensPerSecond.toFixed(1)} tok/s</span>
              </div>
            )}
            {engineState.totalTokens > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 terminal-text">총 토큰</span>
                <span className="text-xs text-gray-400 terminal-text">{engineState.totalTokens.toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-600 terminal-text py-2">모델 미로드</div>
        )}
      </div>

      {/* Browser Capabilities */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-[#00d4ff]" />
          <span className="text-xs font-semibold text-gray-400 terminal-text">브라우저 기능</span>
        </div>
        {loading ? (
          <div className="text-xs text-gray-600 terminal-text py-2 animate-pulse">감지 중...</div>
        ) : caps && (
          <div>
            <StatusBadge ok={caps.webgpu} label="WebGPU (WebLLM 필요)" />
            <StatusBadge ok={caps.wasm} label="WebAssembly (GGUF/ONNX 필요)" />
            <StatusBadge ok={caps.sharedArrayBuffer} label="SharedArrayBuffer (멀티스레드)" />
            <StatusBadge ok={caps.workers} label="Web Workers" />
            {caps.webgpuAdapter && (
              <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-gray-500 terminal-text">GPU 어댑터</span>
                <span className="text-xs text-gray-400 terminal-text">{caps.webgpuAdapter}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hardware */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-[#ffc800]" />
          <span className="text-xs font-semibold text-gray-400 terminal-text">하드웨어</span>
        </div>
        {caps && (
          <div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-xs text-gray-500 terminal-text">CPU 코어</span>
              <span className="text-xs text-gray-300 terminal-text">{caps.cores}개</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-xs text-gray-500 terminal-text">디바이스 메모리</span>
              <span className="text-xs text-gray-300 terminal-text">{caps.memory}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-xs text-gray-500 terminal-text">플랫폼</span>
              <span className="text-xs text-gray-300 terminal-text">{caps.platform}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.04)]">
              <span className="text-xs text-gray-500 terminal-text">브라우저</span>
              <span className="text-xs text-gray-300 terminal-text">{caps.browser}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-gray-500 terminal-text">모바일</span>
              <span className={`text-xs terminal-text ${caps.isMobile ? 'text-[#ffc800]' : 'text-gray-400'}`}>
                {caps.isMobile ? '모바일 기기' : '데스크탑'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Best Engine Recommendation */}
      {caps && (
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#00d4aa]" />
            <span className="text-xs font-semibold text-gray-400 terminal-text">추천 엔진</span>
          </div>
          <div className="flex flex-col gap-2">
            {caps.webgpu ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(0,212,170,0.08)] border border-[rgba(0,212,170,0.2)]">
                <span className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                <span className="text-xs text-[#00d4aa] terminal-text font-semibold">WebLLM (WebGPU)</span>
                <span className="text-[10px] text-gray-600 terminal-text ml-auto">가장 빠름</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(255,200,0,0.08)] border border-[rgba(255,200,0,0.2)]">
                <span className="w-2 h-2 rounded-full bg-[#ffc800]" />
                <span className="text-xs text-[#ffc800] terminal-text font-semibold">GGUF (llama.cpp WASM)</span>
                <span className="text-[10px] text-gray-600 terminal-text ml-auto">CPU 최적</span>
              </div>
            )}
            <p className="text-[10px] text-gray-700 terminal-text">
              {caps.webgpu
                ? 'WebGPU가 지원됩니다. WebLLM으로 GPU 가속 추론을 권장합니다.'
                : 'WebGPU 미지원. GGUF(llama.cpp WASM) 또는 ONNX Runtime을 사용하세요.'}
            </p>
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-700 terminal-text text-center px-2">
        모든 추론은 완전히 로컬에서 처리됩니다. 어떤 데이터도 외부 서버로 전송되지 않습니다.
      </div>
    </div>
  );
}
