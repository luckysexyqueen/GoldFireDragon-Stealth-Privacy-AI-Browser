import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCustomAI } from '@/hooks/useCustomAI';

const topNavItems = [
  { path: '/', icon: 'ri-home-4-line', label: 'Home' },
  { path: '/ai-assistant', icon: 'ri-robot-2-line', label: 'AI Assistant' },
  { path: '/my-characters', icon: 'ri-user-star-line', label: '내 캐릭터' },
  { path: '/prompts', icon: 'ri-file-text-line', label: 'Prompts' },
  { path: '/ai-tools', icon: 'ri-tools-line', label: 'AI Tools' },
  { path: '/extensions', icon: 'ri-puzzle-line', label: 'Extensions' },
  { path: '/userscripts', icon: 'ri-code-box-line', label: 'Userscripts' },
  { path: '/gallery', icon: 'ri-gallery-line', label: 'Gallery' },
];

const bottomNavItems = [
  { path: '/wallet', icon: 'ri-wallet-3-line', label: 'Wallet' },
  { path: '/ipfs', icon: 'ri-global-line', label: 'IPFS' },
  { path: '/mcp', icon: 'ri-server-line', label: 'MCP Server' },
  { path: '/settings', icon: 'ri-settings-3-line', label: 'Settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { agents, createAgent } = useCustomAI();
  const [agentsExpanded, setAgentsExpanded] = useState(true);

  const handleCreateAgent = () => {
    const agent = createAgent();
    navigate(`/ai-builder/${agent.id}`);
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-puma-surface border-r border-puma-border/30 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-puma-border/30 flex-shrink-0">
        <div className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 overflow-hidden">
          <img
            src="https://storage.readdy-site.link/project_files/7ae17de7-71a8-4204-8ce8-97a0353bab30/41fede91-a128-4994-8ae5-caff147b13f5_GoldFireDragonBrowser-logo.png?v=4fa5078b34901bbafa05e9972eed4709"
            alt="Stealth Privacy AI Browser"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-puma-text font-bold text-base leading-tight">GoldFireDragon Stealth Privacy AI Browser</h1>
          <p className="text-puma-muted text-xs">Stealth Privacy Browser</p>
        </div>
      </div>

      {/* Scrollable Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {/* Top Nav */}
        {topNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'bg-puma-card text-puma-accent puma-glow-sm'
                  : 'text-puma-muted hover:bg-puma-card/50 hover:text-puma-text'
              }`
            }
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={`${item.icon} text-lg`}></i>
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Divider */}
        <div className="mx-2 my-3 border-t border-puma-border/20"></div>

        {/* Custom AI Builder Section */}
        <div>
          {/* Section Header */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
            <button
              onClick={() => setAgentsExpanded(!agentsExpanded)}
              className="flex items-center gap-2 text-puma-muted hover:text-puma-text transition-colors cursor-pointer flex-1 text-left"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`ri-arrow-right-s-line text-sm transition-transform duration-200 ${agentsExpanded ? 'rotate-90' : ''}`}></i>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide">Custom AI Builder</span>
            </button>
            <button
              onClick={handleCreateAgent}
              className="w-5 h-5 flex items-center justify-center rounded text-puma-muted hover:text-puma-accent transition-colors cursor-pointer"
              title="New Agent"
            >
              <i className="ri-add-line text-sm"></i>
            </button>
          </div>

          {/* Builder Main Link */}
          <NavLink
            to="/ai-builder"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'bg-puma-card text-puma-accent puma-glow-sm'
                  : 'text-puma-muted hover:bg-puma-card/50 hover:text-puma-text'
              }`
            }
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-magic-line text-lg"></i>
            </div>
            <span className="text-sm font-medium">All Agents</span>
            {agents.length > 0 && (
              <span className="ml-auto text-xs bg-puma-card px-1.5 py-0.5 rounded-full text-puma-muted">
                {agents.length}
              </span>
            )}
          </NavLink>

          {/* Agent List */}
          {agentsExpanded && agents.length > 0 && (
            <div className="mt-1 space-y-0.5 pl-2">
              {agents.slice(0, 8).map((agent) => (
                <NavLink
                  key={agent.id}
                  to={`/ai-builder/${agent.id}/chat`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group ${
                      isActive
                        ? 'bg-puma-card text-puma-accent'
                        : 'text-puma-muted hover:bg-puma-card/50 hover:text-puma-text'
                    }`
                  }
                >
                  <span className="text-base flex-shrink-0">{agent.avatar}</span>
                  <span className="text-xs font-medium truncate flex-1">{agent.name}</span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/ai-builder/${agent.id}`); }}
                    className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 text-puma-muted hover:text-puma-text transition-all cursor-pointer flex-shrink-0"
                  >
                    <i className="ri-settings-3-line text-xs"></i>
                  </button>
                </NavLink>
              ))}
              {agents.length > 8 && (
                <NavLink
                  to="/ai-builder"
                  className="flex items-center gap-2 px-3 py-1.5 text-puma-muted hover:text-puma-accent text-xs transition-colors cursor-pointer"
                >
                  <i className="ri-more-line text-sm"></i>
                  <span>+{agents.length - 8} more agents</span>
                </NavLink>
              )}
            </div>
          )}

          {/* Empty state hint */}
          {agentsExpanded && agents.length === 0 && (
            <button
              onClick={handleCreateAgent}
              className="w-full flex items-center gap-2 px-3 py-2 text-puma-muted/60 hover:text-puma-muted text-xs transition-colors cursor-pointer"
            >
              <i className="ri-add-circle-line text-sm"></i>
              <span>Create your first agent</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mx-2 my-3 border-t border-puma-border/20"></div>

        {/* Bottom Nav */}
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'bg-puma-card text-puma-accent puma-glow-sm'
                  : 'text-puma-muted hover:bg-puma-card/50 hover:text-puma-text'
              }`
            }
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={`${item.icon} text-lg`}></i>
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Status */}
      <div className="px-4 py-4 border-t border-puma-border/30 flex-shrink-0">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-puma-card/50">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0"></div>
          <span className="text-xs text-puma-muted">Local AI Ready</span>
        </div>
      </div>
    </aside>
  );
}