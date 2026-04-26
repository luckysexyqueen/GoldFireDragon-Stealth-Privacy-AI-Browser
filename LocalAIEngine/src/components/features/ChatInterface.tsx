import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Square, Trash2, Copy, RotateCcw, Bot, User, ChevronDown } from 'lucide-react';
import { ChatMessage, EngineState, GenerationConfig } from '@/types/engine';
import { ENGINE_LABELS } from '@/constants/models';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/lib/markdown';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  engineState: EngineState;
  config: GenerationConfig;
  onSend: (content: string) => void;
  onAbort: () => void;
  onClear: () => void;
  ragContext?: string;
  docFiles?: Array<{ name: string }>;
}

export default function ChatInterface({
  messages,
  streamingContent,
  isStreaming,
  engineState,
  config,
  onSend,
  onAbort,
  onClear,
  docFiles = [],
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('클립보드에 복사됨');
  };

  const isReady = engineState.status === 'ready' || engineState.status === 'generating';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.05)] flex-shrink-0">
        <div className="flex items-center gap-2 text-xs terminal-text">
          {engineState.modelId ? (
            <>
              <span className={cn('w-2 h-2 rounded-full', isStreaming ? 'bg-[#00d4ff] animate-pulse' : 'bg-[#00d4aa]')} />
              <span className="text-gray-400 truncate max-w-[200px] sm:max-w-none">{engineState.modelId}</span>
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold engine-badge-' + (engineState.type || 'custom'))}>
                {ENGINE_LABELS[engineState.type || 'custom']}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              <span className="text-gray-600">모델을 로드하세요</span>
            </>
          )}
          {docFiles.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff]">
              RAG {docFiles.length}개
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {engineState.tokensPerSecond > 0 && (
            <span className="text-xs text-[#00d4ff] terminal-text mr-2">{engineState.tokensPerSecond.toFixed(1)} t/s</span>
          )}
          <button
            onClick={onClear}
            disabled={messages.length === 0 && !streamingContent}
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-400 hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-30"
            title="대화 초기화"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0"
      >
        {messages.length === 0 && !streamingContent && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(0,212,170,0.15)] to-[rgba(0,212,255,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center justify-center">
              <Bot className="w-8 h-8 text-[#00d4aa]" />
            </div>
            <div>
              <p className="text-gray-400 text-sm terminal-text font-medium">로컬 AI 엔진 준비됨</p>
              <p className="text-gray-600 text-xs terminal-text mt-1">
                {engineState.modelId
                  ? '메시지를 입력하세요. 완전 로컬 처리, 네트워크 불필요.'
                  : '좌측에서 모델을 먼저 로드하세요.'}
              </p>
            </div>
            {!engineState.modelId && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {['WebGPU 가속 추론', 'GGUF 양자화 지원', 'ONNX Runtime Web', '커스텀 URL 모델'].map(feat => (
                  <div key={feat} className="px-3 py-2 rounded-lg bg-[rgba(0,212,170,0.05)] border border-[rgba(0,212,170,0.1)] text-[10px] text-gray-600 terminal-text text-center">
                    {feat}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onCopy={copyMessage} />
        ))}

        {/* Streaming Message */}
        {streamingContent && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[rgba(0,212,170,0.2)] to-[rgba(0,212,255,0.1)] border border-[rgba(0,212,170,0.25)] flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-[#00d4aa]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="glass-panel-subtle rounded-xl rounded-tl-none p-3 text-sm text-gray-200 leading-relaxed">
                <div className="prose prose-invert prose-sm max-w-none cursor-blink terminal-text">
                  <MarkdownRenderer content={streamingContent} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-2 rounded-full glass-panel border border-[rgba(0,212,170,0.3)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.15)] transition-all z-10"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-[rgba(255,255,255,0.05)] safe-bottom">
        <div className={cn(
          'flex gap-2 items-end glass-panel rounded-xl p-3 transition-all duration-200',
          isReady && input ? 'border-[rgba(0,212,170,0.3)]' : ''
        )}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !engineState.modelId ? '먼저 모델을 로드하세요...' :
              isStreaming ? '생성 중...' :
              docFiles.length > 0 ? '문서에 대해 질문하세요... (RAG 모드)' :
              '메시지 입력... (Shift+Enter: 줄바꿈)'
            }
            disabled={!engineState.modelId || isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none resize-none terminal-text leading-relaxed disabled:cursor-not-allowed"
            style={{ maxHeight: '120px', minHeight: '24px' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 120) + 'px';
            }}
          />
          <div className="flex gap-1 flex-shrink-0">
            {isStreaming ? (
              <button
                onClick={onAbort}
                className="p-2 rounded-lg bg-[rgba(255,50,50,0.15)] border border-[rgba(255,50,50,0.3)] text-red-400 hover:bg-[rgba(255,50,50,0.25)] transition-all"
                title="생성 중지"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || !engineState.modelId}
                className="p-2 rounded-lg bg-[rgba(0,212,170,0.15)] border border-[rgba(0,212,170,0.3)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.25)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="전송 (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-700 terminal-text mt-1 text-center">
          완전 로컬 처리 · 데이터 외부 전송 없음 · 오프라인 동작
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, onCopy }: { message: ChatMessage; onCopy: (c: string) => void }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 items-start group', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
        isUser
          ? 'bg-gradient-to-br from-[rgba(0,212,255,0.2)] to-[rgba(0,212,170,0.1)] border border-[rgba(0,212,255,0.25)]'
          : 'bg-gradient-to-br from-[rgba(0,212,170,0.2)] to-[rgba(0,212,255,0.1)] border border-[rgba(0,212,170,0.25)]'
      )}>
        {isUser ? <User className="w-3.5 h-3.5 text-[#00d4ff]" /> : <Bot className="w-3.5 h-3.5 text-[#00d4aa]" />}
      </div>

      <div className={cn('flex-1 min-w-0', isUser && 'flex flex-col items-end')}>
        <div className={cn(
          'relative rounded-xl p-3 text-sm leading-relaxed max-w-[85%]',
          isUser
            ? 'bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] text-gray-200 rounded-tr-none'
            : 'glass-panel-subtle rounded-tl-none text-gray-200'
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap terminal-text">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none terminal-text">
              <MarkdownRenderer content={message.content} />
            </div>
          )}
        </div>
        <div className={cn(
          'flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser && 'flex-row-reverse'
        )}>
          <span className="text-[10px] text-gray-700 terminal-text">
            {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.engine && (
            <span className={cn('text-[10px] px-1.5 rounded engine-badge-' + message.engine)}>
              {ENGINE_LABELS[message.engine]}
            </span>
          )}
          <button
            onClick={() => onCopy(message.content)}
            className="p-0.5 rounded text-gray-700 hover:text-gray-500 transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}


