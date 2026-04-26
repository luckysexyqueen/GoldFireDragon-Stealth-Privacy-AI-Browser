import { useState } from 'react';
import { Cpu, Settings, FileText, MessageSquare, FlaskConical, Menu, X, HardDrive } from 'lucide-react';
import { EngineState } from '@/types/engine';
import { ENGINE_LABELS } from '@/constants/models';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  engineState: EngineState;
}

const TABS = [
  { id: 'chat',      label: '채팅',      icon: MessageSquare },
  { id: 'docs',      label: '문서 RAG',  icon: FileText },
  { id: 'playground',label: '플레이그라운드', icon: FlaskConical },
  { id: 'uploads',   label: 'GGUF 업로드', icon: HardDrive },
  { id: 'settings',  label: '설정',      icon: Settings },
];

export default function AppHeader({ activeTab, onTabChange, engineState }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const statusColor =
    engineState.status === 'ready' ? 'text-[#00d4aa] bg-[#00d4aa]' :
    engineState.status === 'loading' ? 'text-[#ffc800] bg-[#ffc800]' :
    engineState.status === 'generating' ? 'text-[#00d4ff] bg-[#00d4ff]' :
    engineState.status === 'error' ? 'text-red-400 bg-red-400' :
    'text-gray-500 bg-gray-500';

  const statusLabel =
    engineState.status === 'ready' ? '준비됨' :
    engineState.status === 'loading' ? '로딩 중' :
    engineState.status === 'generating' ? '생성 중' :
    engineState.status === 'error' ? '오류' :
    '대기 중';

  return (
    <header className="glass-panel border-b border-[rgba(0,212,170,0.15)] sticky top-0 z-50 safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#00d4ff] flex items-center justify-center glow-green">
              <Cpu className="w-4 h-4 text-[#0d1117]" />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="font-bold text-sm text-gradient-green tracking-widest terminal-text">LOCAL AI ENGINE</div>
            <div className="text-[10px] text-gray-500 tracking-wider">WebGPU · GGUF · ONNX</div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 terminal-text',
                  activeTab === tab.id
                    ? 'bg-[rgba(0,212,170,0.15)] text-[#00d4aa] border border-[rgba(0,212,170,0.3)]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[rgba(255,255,255,0.05)]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Status + Engine Info */}
        <div className="flex items-center gap-3">
          {engineState.modelId && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel-subtle text-xs terminal-text">
              <span className={cn(
                'inline-block w-2 h-2 rounded-full flex-shrink-0',
                engineState.status === 'generating' ? 'animate-pulse' : '',
                statusColor.split(' ')[1]
              )} />
              <span className={statusColor.split(' ')[0]}>{statusLabel}</span>
              <span className="text-gray-500">·</span>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                `engine-badge-${engineState.type || 'custom'}`
              )}>
                {ENGINE_LABELS[engineState.type || 'custom'] || 'Unknown'}
              </span>
              {engineState.tokensPerSecond > 0 && (
                <>
                  <span className="text-gray-500">·</span>
                  <span className="text-[#00d4ff]">{engineState.tokensPerSecond.toFixed(1)} t/s</span>
                </>
              )}
            </div>
          )}

          {!engineState.modelId && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 terminal-text">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              모델 미로드
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[rgba(0,212,170,0.1)] px-4 py-2 flex flex-col gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); setMobileOpen(false); }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-[rgba(0,212,170,0.15)] text-[#00d4aa]'
                    : 'text-gray-400'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
          {engineState.modelId && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 terminal-text border-t border-[rgba(255,255,255,0.05)] mt-1">
              <span className={cn('w-2 h-2 rounded-full', statusColor.split(' ')[1])} />
              <span>{statusLabel} · {ENGINE_LABELS[engineState.type || 'custom']}</span>
              {engineState.tokensPerSecond > 0 && (
                <span className="text-[#00d4ff] ml-auto">{engineState.tokensPerSecond.toFixed(1)} t/s</span>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
