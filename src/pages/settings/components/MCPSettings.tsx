import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchEngines } from '@/hooks/useSearchEngines';

interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  status: 'active' | 'idle' | 'disabled' | 'error';
  tools: { name: string; icon: string }[];
  free: boolean;
  unlimited: boolean;
}

const STORAGE_KEY = 'gfd_mcp_servers';

const BUILTIN_SERVERS: MCPServer[] = [
  {
    id: 'mcp-filesystem', name: 'FileSystem', description: 'AI가 로컬 파일을 읽고, 쓰고, 편집합니다',
    category: 'filesystem', enabled: true, status: 'active', free: true, unlimited: true,
    tools: [{ name: 'read_file', icon: 'ri-file-text-line' }, { name: 'write_file', icon: 'ri-file-edit-line' }, { name: 'list_directory', icon: 'ri-folder-open-line' }],
  },
  {
    id: 'mcp-git', name: 'Git', description: '로컬 저장소의 Git 기록 조회, 커밋, 브랜치 관리',
    category: 'filesystem', enabled: true, status: 'active', free: true, unlimited: true,
    tools: [{ name: 'git_status', icon: 'ri-git-repository-line' }, { name: 'git_log', icon: 'ri-history-line' }, { name: 'git_commit', icon: 'ri-git-commit-line' }],
  },
  {
    id: 'mcp-sqlite', name: 'SQLite', description: '로컬 SQLite DB 파일 조회 및 쿼리 수행',
    category: 'database', enabled: true, status: 'active', free: true, unlimited: true,
    tools: [{ name: 'query', icon: 'ri-database-2-line' }, { name: 'list_tables', icon: 'ri-table-line' }],
  },
  {
    id: 'mcp-postgres', name: 'PostgreSQL', description: '로컬/원격 PostgreSQL 데이터베이스 연동',
    category: 'database', enabled: false, status: 'idle', free: true, unlimited: true,
    tools: [{ name: 'query', icon: 'ri-database-2-line' }, { name: 'list_schemas', icon: 'ri-layout-grid-line' }],
  },
  {
    id: 'mcp-memory', name: 'Memory', description: 'AI가 대화 세션 간 컨텍스트를 저장하고 기억',
    category: 'memory', enabled: true, status: 'active', free: true, unlimited: true,
    tools: [{ name: 'store_memory', icon: 'ri-save-line' }, { name: 'recall_memory', icon: 'ri-brain-line' }],
  },
  {
    id: 'mcp-puppeteer', name: 'Puppeteer', description: '브라우저 자동화로 웹 페이지 렌더링 및 스크래핑',
    category: 'browser', enabled: true, status: 'active', free: true, unlimited: true,
    tools: [{ name: 'navigate', icon: 'ri-global-line' }, { name: 'screenshot', icon: 'ri-screenshot-line' }, { name: 'scrape_data', icon: 'ri-download-line' }],
  },
  {
    id: 'mcp-terminal', name: 'Terminal', description: '로컬 환경에서 Bash 터미널 명령어 실행',
    category: 'terminal', enabled: true, status: 'active', free: true, unlimited: true,
    tools: [{ name: 'run_command', icon: 'ri-terminal-line' }, { name: 'run_script', icon: 'ri-code-s-slash-line' }],
  },
];

const CAT_ICON: Record<string, { icon: string; color: string }> = {
  filesystem: { icon: 'ri-folder-line', color: 'text-yellow-400' },
  database: { icon: 'ri-database-2-line', color: 'text-green-400' },
  browser: { icon: 'ri-global-line', color: 'text-puma-accent' },
  memory: { icon: 'ri-brain-line', color: 'text-pink-400' },
  terminal: { icon: 'ri-terminal-line', color: 'text-orange-400' },
  custom: { icon: 'ri-server-line', color: 'text-puma-muted' },
};

function loadServers(): MCPServer[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch { /* empty */ }
  return BUILTIN_SERVERS;
}

export default function MCPSettings() {
  const navigate = useNavigate();
  const [servers, setServers] = useState<MCPServer[]>(loadServers);
  const [activeTab, setActiveTab] = useState<'servers' | 'search'>('servers');
  const [showAddEngine, setShowAddEngine] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Use shared search engines hook
  const {
    engines,
    defaultEngine,
    uncensoredMode,
    nsfwEnabled,
    safeSearchOff,
    setUncensoredMode,
    setNsfwEnabled,
    setSafeSearchOff,
    setDefault: setDefaultEngine,
    addCustomEngine,
    deleteEngine,
    uncensoredCount,
    nsfwCount,
    proxyCount,
    torCount,
    standardCount,
  } = useSearchEngines();

  const [searchFilter, setSearchFilter] = useState<'all' | 'uncensored' | 'nsfw' | 'proxy' | 'tor' | 'standard'>('all');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(servers)); }, [servers]);

  const toggleServer = (id: string) => {
    setServers(prev => prev.map(s => {
      if (s.id !== id) return s;
      const enabled = !s.enabled;
      return { ...s, enabled, status: enabled ? 'active' : 'disabled' };
    }));
  };

  const addEngine = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    addCustomEngine(newName.trim(), newUrl.trim());
    setNewName(''); setNewUrl(''); setShowAddEngine(false);
  };

  const enabledCount = servers.filter(s => s.enabled).length;

  const filteredEngines = engines.filter(e => {
    if (searchFilter === 'all') return true;
    if (searchFilter === 'uncensored') return e.uncensored;
    if (searchFilter === 'nsfw') return e.nsfw;
    if (searchFilter === 'proxy') return e.proxy;
    if (searchFilter === 'tor') return e.tor;
    if (searchFilter === 'standard') return !e.uncensored;
    return true;
  });

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-puma-text text-xl font-bold">MCP Server</h3>
        <button
          onClick={() => navigate('/mcp')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-external-link-line text-sm"></i>
          전체 화면
        </button>
      </div>
      <p className="text-puma-muted text-sm mb-4">완전 무료 · 노 API · 로컬 전용 · 무제한</p>

      {/* Status bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-400/8 border border-green-400/20 rounded-lg">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-green-400 text-xs font-medium">{enabledCount}개 활성</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-puma-accent/8 border border-puma-accent/20 rounded-lg">
          <i className="ri-gift-line text-puma-accent text-sm"></i>
          <span className="text-puma-accent text-xs font-medium">영구 완전 무료</span>
        </div>
        {defaultEngine && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-puma-card border border-puma-border/30 rounded-lg">
            <i className="ri-search-line text-puma-muted text-sm"></i>
            <span className="text-puma-muted text-xs">{defaultEngine.name}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-puma-surface rounded-xl p-1 mb-5">
        {[
          { id: 'servers', label: '🔌 MCP 서버' },
          { id: 'search', label: '🔍 검색 엔진' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? 'bg-puma-card text-puma-accent' : 'text-puma-muted hover:text-puma-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MCP Servers */}
      {activeTab === 'servers' && (
        <div className="space-y-2">
          {servers.map(server => {
            const cat = CAT_ICON[server.category] ?? CAT_ICON.custom;
            return (
              <div key={server.id} className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-puma-card flex-shrink-0">
                    <i className={`${cat.icon} ${cat.color} text-base`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-puma-text text-sm font-semibold">{server.name}</p>
                      <span className="px-1.5 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded font-semibold">FREE</span>
                      <span className="px-1.5 py-0.5 bg-puma-accent/15 text-puma-accent text-[10px] rounded font-semibold">♾️</span>
                    </div>
                    <p className="text-puma-muted text-xs truncate">{server.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${server.enabled ? 'bg-green-400 animate-pulse' : 'bg-puma-border'}`}></span>
                      <span className={`text-xs ${server.enabled ? 'text-green-400' : 'text-puma-muted'}`}>
                        {server.enabled ? '활성' : '비활성'}
                      </span>
                      <span className="text-puma-muted/50 text-xs">· {server.tools.length}개 도구</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleServer(server.id)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                      server.enabled ? 'bg-puma-accent' : 'bg-puma-border/50'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      server.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></span>
                  </button>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => navigate('/mcp')}
            className="w-full py-2.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-xl text-sm hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-external-link-line mr-2"></i>
            전체 MCP 관리 페이지 열기
          </button>
        </div>
      )}

      {/* Search Engines */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          {/* Uncensored Mode */}
          <div className={`rounded-xl border p-4 transition-all ${
            uncensoredMode ? 'bg-red-400/8 border-red-400/30' : 'bg-puma-surface border-puma-border/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i className={`ri-eye-off-line text-lg ${uncensoredMode ? 'text-red-400' : 'text-puma-muted'}`}></i>
                <div>
                  <p className={`text-sm font-bold ${uncensoredMode ? 'text-red-400' : 'text-puma-text'}`}>무검열 검색 모드</p>
                  <p className="text-puma-muted text-xs">{uncensoredMode ? '검열 없이 모든 콘텐츠 접근' : '검색 결과에 검열 적용'}</p>
                </div>
              </div>
              <button
                onClick={() => setUncensoredMode(!uncensoredMode)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                  uncensoredMode ? 'bg-red-500' : 'bg-puma-border/50'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  uncensoredMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}></span>
              </button>
            </div>
            {uncensoredMode && (
              <div className="space-y-2 border-t border-puma-border/20 pt-2">
                <div className="flex items-center justify-between px-3 py-1.5 bg-puma-bg rounded-lg">
                  <span className="text-puma-text text-xs font-medium">안전검색 OFF</span>
                  <button
                    onClick={() => setSafeSearchOff(!safeSearchOff)}
                    className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${safeSearchOff ? 'bg-orange-400' : 'bg-puma-border/50'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${safeSearchOff ? 'translate-x-4' : 'translate-x-0.5'}`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between px-3 py-1.5 bg-puma-bg rounded-lg">
                  <span className="text-puma-text text-xs font-medium">성인 콘텐츠 허용</span>
                  <button
                    onClick={() => setNsfwEnabled(!nsfwEnabled)}
                    className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${nsfwEnabled ? 'bg-red-500' : 'bg-puma-border/50'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${nsfwEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}></span>
                  </button>
                </div>
                <div className="flex items-start gap-2 px-3 py-2 bg-red-400/10 rounded-lg">
                  <i className="ri-alert-line text-red-400 text-xs flex-shrink-0 mt-0.5"></i>
                  <p className="text-red-400/80 text-xs leading-relaxed">
                    무검열 모드는 모든 검색 결과를 필터링 없이 표시합니다. 사용자 책임 하에 사용하세요.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: '전체', count: engines.length, icon: 'ri-search-line', color: 'text-puma-accent', bg: 'bg-puma-accent/15' },
              { label: '무검열', count: uncensoredCount, icon: 'ri-eye-off-line', color: 'text-orange-400', bg: 'bg-orange-400/15' },
              { label: '성인', count: nsfwCount, icon: 'ri-fire-line', color: 'text-red-400', bg: 'bg-red-400/15' },
              { label: '프록시', count: proxyCount, icon: 'ri-global-line', color: 'text-teal-400', bg: 'bg-teal-400/15' },
              { label: 'Tor', count: torCount, icon: 'ri-shield-keyhole-line', color: 'text-violet-400', bg: 'bg-violet-400/15' },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setSearchFilter(s.label === '전체' ? 'all' : s.label === '무검열' ? 'uncensored' : s.label === '성인' ? 'nsfw' : s.label === '프록시' ? 'proxy' : 'tor')}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg border transition-all cursor-pointer ${
                  (s.label === '전체' && searchFilter === 'all') ||
                  (s.label === '무검열' && searchFilter === 'uncensored') ||
                  (s.label === '성인' && searchFilter === 'nsfw') ||
                  (s.label === '프록시' && searchFilter === 'proxy') ||
                  (s.label === 'Tor' && searchFilter === 'tor')
                    ? `${s.bg} border-current ${s.color}`
                    : 'bg-puma-surface border-puma-border/30 text-puma-muted hover:border-puma-accent/30'
                }`}
              >
                <div className="w-3 h-3 flex items-center justify-center">
                  <i className={`${s.icon} text-xs`}></i>
                </div>
                <span className="text-[10px] font-bold">{s.count}</span>
                <span className="text-[9px]">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-puma-surface rounded-xl p-1 border border-puma-border/30">
            {[
              { id: 'all', label: '전체' },
              { id: 'standard', label: '일반' },
              { id: 'uncensored', label: '무검열' },
              { id: 'nsfw', label: '성인' },
              { id: 'proxy', label: '프록시' },
              { id: 'tor', label: 'Tor' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSearchFilter(f.id as typeof searchFilter)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  searchFilter === f.id ? 'bg-puma-card text-puma-accent' : 'text-puma-muted hover:text-puma-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Engine list */}
          <div className="space-y-2">
            {filteredEngines.map(engine => (
              <div key={engine.id} className={`bg-puma-surface rounded-xl border p-3.5 ${engine.isDefault ? 'border-puma-accent/40' : 'border-puma-border/30'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${engine.isDefault ? 'bg-puma-accent/20' : 'bg-puma-card'}`}>
                    <i className={`ri-search-line text-sm ${engine.isDefault ? 'text-puma-accent' : 'text-puma-muted'}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-puma-text text-sm font-semibold">{engine.name}</p>
                      {engine.isDefault && <span className="px-1.5 py-0.5 bg-puma-accent/20 text-puma-accent text-[10px] rounded font-semibold">기본값</span>}
                      {engine.isCustom && <span className="px-1.5 py-0.5 bg-puma-card text-puma-muted text-[10px] rounded">커스텀</span>}
                      {engine.uncensored && <span className="px-1.5 py-0.5 bg-orange-400/15 text-orange-400 text-[10px] rounded font-semibold">무검열</span>}
                      {engine.nsfw && <span className="px-1.5 py-0.5 bg-red-400/15 text-red-400 text-[10px] rounded font-semibold">성인</span>}
                      {engine.proxy && <span className="px-1.5 py-0.5 bg-teal-400/15 text-teal-400 text-[10px] rounded font-semibold">프록시</span>}
                      {engine.tor && <span className="px-1.5 py-0.5 bg-violet-400/15 text-violet-400 text-[10px] rounded font-semibold">Tor</span>}
                    </div>
                    <p className="text-puma-muted text-xs font-mono truncate">{engine.url}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!engine.isDefault && (
                      <button onClick={() => setDefaultEngine(engine.id)} className="px-2 py-1 bg-puma-card border border-puma-border/30 text-puma-muted rounded text-xs hover:text-puma-accent transition-colors cursor-pointer whitespace-nowrap">기본값</button>
                    )}
                    {engine.isCustom && (
                      <button onClick={() => deleteEngine(engine.id)} className="w-6 h-6 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer">
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAddEngine ? (
            <div className="bg-puma-surface rounded-xl border border-puma-accent/30 p-4 space-y-3">
              <h4 className="text-puma-text text-sm font-semibold">커스텀 검색 엔진 추가</h4>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="검색 엔진 이름..." className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent" />
              <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (예: https://example.com/search?q={query})..." className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-xs text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent font-mono" />
              <p className="text-puma-muted/60 text-xs">URL에 {'{query}'}를 포함하세요</p>
              <div className="flex gap-2">
                <button onClick={addEngine} className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">추가</button>
                <button onClick={() => setShowAddEngine(false)} className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">취소</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddEngine(true)} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-puma-border/30 rounded-xl text-puma-muted hover:border-puma-accent/40 hover:text-puma-accent transition-all cursor-pointer">
              <i className="ri-add-line text-base"></i>
              <span className="text-sm">커스텀 검색 엔진 추가</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
