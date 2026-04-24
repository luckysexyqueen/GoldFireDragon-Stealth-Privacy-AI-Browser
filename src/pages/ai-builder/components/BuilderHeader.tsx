import { useNavigate } from 'react-router-dom';
import { CustomAIAgent } from '@/hooks/useCustomAI';

interface Props {
  agent: CustomAIAgent;
  onSave: () => void;
  onDelete: () => void;
  saved: boolean;
}

export default function BuilderHeader({ agent, onSave, onDelete, saved }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-puma-border/30 bg-puma-surface flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/ai-builder')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-puma-card transition-colors cursor-pointer text-puma-muted hover:text-puma-text"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.avatar}</span>
          <div>
            <h2 className="text-puma-text font-bold text-base leading-tight">{agent.name || 'Untitled Agent'}</h2>
            <p className="text-puma-muted text-xs">Custom AI Builder</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDelete}
          className="px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-delete-bin-line mr-1"></i>
          Delete
        </button>
        <button
          onClick={() => navigate(`/ai-builder/${agent.id}/chat`)}
          className="flex items-center gap-2 px-4 py-2 bg-puma-card border border-puma-border/30 text-puma-text rounded-lg text-sm font-medium hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-chat-3-line"></i>
          Preview Chat
        </button>
        <button
          onClick={onSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            saved
              ? 'bg-green-400/20 border border-green-400/30 text-green-400'
              : 'bg-puma-accent/20 border border-puma-accent/40 text-puma-accent hover:bg-puma-accent/30'
          }`}
        >
          <i className={`${saved ? 'ri-check-line' : 'ri-save-line'}`}></i>
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  );
}