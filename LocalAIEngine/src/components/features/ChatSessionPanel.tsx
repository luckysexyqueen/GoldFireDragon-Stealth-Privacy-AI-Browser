import { useState } from 'react';
import { MessageSquare, Plus, Trash2, ChevronRight, Clock, Bot } from 'lucide-react';
import { DBChatSession } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface ChatSessionPanelProps {
  sessions: DBChatSession[];
  currentSessionId: string | null;
  loading: boolean;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function ChatSessionPanel({
  sessions,
  currentSessionId,
  loading,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatSessionPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#00d4aa]" />
          <span className="text-xs font-semibold text-gray-400 terminal-text">대화 기록</span>
          {sessions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,212,170,0.1)] text-[#00d4aa] border border-[rgba(0,212,170,0.2)]">
              {sessions.length}
            </span>
          )}
        </div>
        <button
          onClick={onNewSession}
          className="p-1.5 rounded-md bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.2)] transition-all"
          title="새 대화"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {loading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-lg bg-[rgba(255,255,255,0.03)] animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center">
            <Bot className="w-8 h-8 text-gray-700" />
            <p className="text-xs text-gray-600 terminal-text">저장된 대화가 없습니다</p>
            <button
              onClick={onNewSession}
              className="px-3 py-1.5 rounded-lg bg-[rgba(0,212,170,0.08)] border border-[rgba(0,212,170,0.15)] text-[#00d4aa] text-xs terminal-text hover:bg-[rgba(0,212,170,0.15)] transition-all"
            >
              새 대화 시작
            </button>
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              onMouseEnter={() => setHoveredId(session.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 mb-1',
                currentSessionId === session.id
                  ? 'bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)]'
                  : 'hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs font-medium truncate terminal-text',
                  currentSessionId === session.id ? 'text-[#00d4aa]' : 'text-gray-300'
                )}>
                  {session.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-gray-700" />
                  <span className="text-[10px] text-gray-600 terminal-text">{formatDate(session.updated_at)}</span>
                  {session.message_count > 0 && (
                    <span className="text-[10px] text-gray-700 terminal-text">· {session.message_count}개</span>
                  )}
                  {session.engine_type && (
                    <span className={cn('text-[10px] px-1 rounded engine-badge-' + session.engine_type, 'py-0')}>
                      {session.engine_type.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {hoveredId === session.id && (
                <button
                  onClick={e => { e.stopPropagation(); onDeleteSession(session.id); }}
                  className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
