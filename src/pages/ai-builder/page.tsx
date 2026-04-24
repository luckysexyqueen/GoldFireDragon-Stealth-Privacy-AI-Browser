import { useNavigate } from 'react-router-dom';
import Layout from '@/components/feature/Layout';
import { useCustomAI } from '@/hooks/useCustomAI';

export default function AIBuilderPage() {
  const navigate = useNavigate();
  const { agents, createAgent, deleteAgent, duplicateAgent } = useCustomAI();

  const handleCreate = () => {
    const agent = createAgent();
    navigate(`/ai-builder/${agent.id}`);
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-puma-border/30 bg-puma-surface flex-shrink-0">
          <div>
            <h2 className="text-puma-text text-xl font-bold">Custom AI Builder</h2>
            <p className="text-puma-muted text-sm mt-0.5">Create and manage your custom AI agents</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-xl text-sm font-semibold hover:bg-puma-accent/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line text-base"></i>
            New Agent
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {agents.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-24 h-24 flex items-center justify-center rounded-3xl bg-puma-surface border border-puma-border/30 mb-6 text-5xl">
                🤖
              </div>
              <h3 className="text-puma-text text-xl font-bold mb-3">Build Your First AI Agent</h3>
              <p className="text-puma-muted text-sm max-w-md leading-relaxed mb-8">
                Create custom AI agents with unique personalities, system prompts, instructions, and knowledge files.
                Connect them to local GGUF models or free AI services.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-lg mb-8">
                {[
                  { icon: 'ri-brain-line', label: 'Custom Personality', desc: 'Define unique behavior' },
                  { icon: 'ri-file-text-line', label: 'Knowledge Files', desc: 'Upload unlimited docs' },
                  { icon: 'ri-cpu-line', label: 'GGUF Models', desc: 'Link local AI models' },
                ].map((f) => (
                  <div key={f.label} className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 text-center">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-puma-card mx-auto mb-2">
                      <i className={`${f.icon} text-puma-accent text-xl`}></i>
                    </div>
                    <p className="text-puma-text text-xs font-semibold">{f.label}</p>
                    <p className="text-puma-muted text-xs mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-3 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-xl text-sm font-semibold hover:bg-puma-accent/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line"></i>
                Create Your First Agent
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Create New Card */}
                <button
                  onClick={handleCreate}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-puma-surface border-2 border-dashed border-puma-border/40 rounded-2xl hover:border-puma-accent/50 hover:bg-puma-card/20 transition-all cursor-pointer group min-h-[180px]"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-puma-card group-hover:bg-puma-accent/20 transition-colors">
                    <i className="ri-add-line text-puma-muted group-hover:text-puma-accent text-2xl transition-colors"></i>
                  </div>
                  <div className="text-center">
                    <p className="text-puma-text text-sm font-semibold">New Agent</p>
                    <p className="text-puma-muted text-xs mt-0.5">Create a custom AI</p>
                  </div>
                </button>

                {/* Agent Cards */}
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-puma-surface rounded-2xl border border-puma-border/30 p-5 hover:border-puma-border transition-all group relative"
                  >
                    {/* Top Actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateAgent(agent.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-puma-card text-puma-muted hover:text-puma-text transition-colors cursor-pointer"
                        title="Duplicate"
                      >
                        <i className="ri-file-copy-line text-sm"></i>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAgent(agent.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-puma-card text-puma-muted hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-puma-card text-2xl flex-shrink-0">
                        {agent.avatar}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-puma-text text-sm font-bold truncate">{agent.name}</h3>
                        <p className="text-puma-muted text-xs">
                          {agent.linkedModelName || 'No model linked'}
                        </p>
                      </div>
                    </div>

                    {/* System Prompt Preview */}
                    {agent.systemPrompt ? (
                      <p className="text-puma-muted text-xs leading-relaxed line-clamp-2 mb-4">
                        {agent.systemPrompt}
                      </p>
                    ) : (
                      <p className="text-puma-muted/50 text-xs italic mb-4">No system prompt set</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-file-line text-puma-muted text-xs"></i>
                        </div>
                        <span className="text-puma-muted text-xs">{agent.files.length} files</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-chat-3-line text-puma-muted text-xs"></i>
                        </div>
                        <span className="text-puma-muted text-xs">{agent.messageCount} msgs</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/ai-builder/${agent.id}/chat`)}
                        className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/30 text-puma-accent rounded-lg text-xs font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-chat-3-line mr-1"></i>
                        Chat
                      </button>
                      <button
                        onClick={() => navigate(`/ai-builder/${agent.id}`)}
                        className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs font-medium hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-settings-3-line mr-1"></i>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}