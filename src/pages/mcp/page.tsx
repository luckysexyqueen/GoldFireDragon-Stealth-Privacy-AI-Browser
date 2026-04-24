import { useState, useEffect } from 'react';
import Layout from '@/components/feature/Layout';
import { useSearchEngines } from '@/hooks/useSearchEngines';

// ─── Types ────────────────────────────────────────────────────────
interface MCPServer {
  id: string;
  name: string;
  description: string;
  type: 'builtin' | 'custom';
  category: 'filesystem' | 'database' | 'browser' | 'memory' | 'terminal' | 'search' | 'custom';
  localPath?: string;
  url?: string;
  enabled: boolean;
  status: 'active' | 'idle' | 'disabled' | 'error';
  tools: MCPTool[];
  unlimited: boolean;
  free: boolean;
  config?: Record<string, string>;
}

interface MCPTool {
  name: string;
  description: string;
  icon: string;
}

// ─── Built-in Local MCP Servers ───────────────────────────────────
const BUILTIN_SERVERS: MCPServer[] = [
  {
    id: 'mcp-filesystem',
    name: 'FileSystem',
    description: 'AI가 로컬 파일을 읽고, 쓰고, 편집합니다. 코딩 및 문서 작업에 필수적입니다.',
    type: 'builtin',
    category: 'filesystem',
    enabled: true,
    status: 'active',
    unlimited: true,
    free: true,
    tools: [
      { name: 'read_file', description: '파일 내용 읽기', icon: 'ri-file-text-line' },
      { name: 'write_file', description: '파일 생성/수정', icon: 'ri-file-edit-line' },
      { name: 'list_directory', description: '디렉토리 목록 조회', icon: 'ri-folder-open-line' },
      { name: 'search_files', description: '파일 검색', icon: 'ri-search-line' },
      { name: 'delete_file', description: '파일 삭제', icon: 'ri-delete-bin-line' },
      { name: 'move_file', description: '파일 이동/복사', icon: 'ri-file-copy-line' },
    ],
  },
  {
    id: 'mcp-git',
    name: 'Git',
    description: '로컬 저장소의 Git 기록 조회, 커밋, 브랜치 관리를 AI가 수행합니다.',
    type: 'builtin',
    category: 'filesystem',
    enabled: true,
    status: 'active',
    unlimited: true,
    free: true,
    tools: [
      { name: 'git_status', description: '저장소 상태 확인', icon: 'ri-git-repository-line' },
      { name: 'git_log', description: '커밋 기록 조회', icon: 'ri-history-line' },
      { name: 'git_diff', description: '변경사항 비교', icon: 'ri-git-merge-line' },
      { name: 'git_commit', description: '변경사항 커밋', icon: 'ri-git-commit-line' },
      { name: 'git_branch', description: '브랜치 관리', icon: 'ri-git-branch-line' },
      { name: 'git_clone', description: '저장소 클론', icon: 'ri-download-cloud-line' },
    ],
  },
  {
    id: 'mcp-sqlite',
    name: 'SQLite',
    description: '로컬 SQLite DB 파일을 조회하고 쿼리를 수행합니다. 데이터를 구조적으로 분석합니다.',
    type: 'builtin',
    category: 'database',
    enabled: true,
    status: 'active',
    unlimited: true,
    free: true,
    tools: [
      { name: 'query', description: 'SQL 쿼리 실행', icon: 'ri-database-2-line' },
      { name: 'list_tables', description: '테이블 목록 조회', icon: 'ri-table-line' },
      { name: 'describe_table', description: '테이블 구조 확인', icon: 'ri-layout-column-line' },
      { name: 'insert_data', description: '데이터 삽입', icon: 'ri-add-circle-line' },
      { name: 'export_csv', description: 'CSV로 내보내기', icon: 'ri-file-excel-line' },
    ],
  },
  {
    id: 'mcp-postgres',
    name: 'PostgreSQL',
    description: '로컬/원격 PostgreSQL 데이터베이스와 연동하여 SQL 쿼리를 실행합니다.',
    type: 'builtin',
    category: 'database',
    enabled: false,
    status: 'idle',
    unlimited: true,
    free: true,
    config: { host: 'localhost', port: '5432', database: '', user: '', password: '' },
    tools: [
      { name: 'query', description: 'SQL 쿼리 실행', icon: 'ri-database-2-line' },
      { name: 'list_schemas', description: '스키마 목록 조회', icon: 'ri-layout-grid-line' },
      { name: 'describe_table', description: '테이블 구조 확인', icon: 'ri-table-line' },
      { name: 'explain_query', description: '쿼리 실행 계획 분석', icon: 'ri-bar-chart-line' },
    ],
  },
  {
    id: 'mcp-memory',
    name: 'Memory',
    description: 'AI가 대화 세션 간에 컨텍스트를 저장하고 기억합니다. 장기 기억 시스템입니다.',
    type: 'builtin',
    category: 'memory',
    enabled: true,
    status: 'active',
    unlimited: true,
    free: true,
    tools: [
      { name: 'store_memory', description: '정보 저장', icon: 'ri-save-line' },
      { name: 'recall_memory', description: '기억 불러오기', icon: 'ri-brain-line' },
      { name: 'list_memories', description: '저장된 기억 목록', icon: 'ri-list-check' },
      { name: 'delete_memory', description: '기억 삭제', icon: 'ri-delete-bin-line' },
      { name: 'search_memory', description: '기억 검색', icon: 'ri-search-line' },
    ],
  },
  {
    id: 'mcp-puppeteer',
    name: 'Puppeteer',
    description: '브라우저 자동화로 웹 페이지를 렌더링하고 콘텐츠를 분석합니다.',
    type: 'builtin',
    category: 'browser',
    enabled: true,
    status: 'active',
    unlimited: true,
    free: true,
    tools: [
      { name: 'navigate', description: '웹 페이지 이동', icon: 'ri-global-line' },
      { name: 'screenshot', description: '스크린샷 캡처', icon: 'ri-screenshot-line' },
      { name: 'extract_text', description: '텍스트 추출', icon: 'ri-file-text-line' },
      { name: 'click_element', description: '요소 클릭', icon: 'ri-cursor-line' },
      { name: 'fill_form', description: '폼 자동 입력', icon: 'ri-edit-line' },
      { name: 'scrape_data', description: '데이터 스크래핑', icon: 'ri-download-line' },
    ],
  },
  {
    id: 'mcp-terminal',
    name: 'Terminal',
    description: '로컬 환경에서 Bash 등의 터미널 명령어를 실행합니다.',
    type: 'builtin',
    category: 'terminal',
    enabled: true,
    status: 'active',
    unlimited: true,
    free: true,
    tools: [
      { name: 'run_command', description: '명령어 실행', icon: 'ri-terminal-line' },
      { name: 'run_script', description: '스크립트 실행', icon: 'ri-code-s-slash-line' },
      { name: 'get_env', description: '환경변수 조회', icon: 'ri-settings-line' },
      { name: 'process_list', description: '프로세스 목록', icon: 'ri-cpu-line' },
      { name: 'pipe_output', description: '출력 파이프', icon: 'ri-arrow-right-line' },
    ],
  },
  {
    id: 'mcp-google-search',
    name: 'Google Search MCP',
    description: 'No API Key 구글 검색 MCP. SerpAPI 없이 로컬에서 Google 검색 결과를 AI에 제공합니다. 완전 무료 · 무제한.',
    type: 'builtin',
    category: 'search',
    enabled: true,
    status: 'active',
    unlimited: true,
    free: true,
    tools: [
      { name: 'google_search', description: 'Google 웹 검색', icon: 'ri-google-line' },
      { name: 'google_news', description: 'Google 뉴스 검색', icon: 'ri-newspaper-line' },
      { name: 'google_images', description: 'Google 이미지 검색', icon: 'ri-image-line' },
      { name: 'google_scholar', description: 'Google 학술 검색', icon: 'ri-book-open-line' },
      { name: 'search_summary', description: '검색 결과 AI 요약', icon: 'ri-file-list-line' },
      { name: 'related_queries', description: '연관 검색어 추출', icon: 'ri-links-line' },
    ],
  },
  {
    id: 'mcp-websearch',
    name: 'WebSearch-MCP',
    description: 'DuckDuckGo · Brave · Bing · SearXNG 등 다중 검색엔진을 API 없이 로컬에서 통합 검색합니다. 완전 무료 · 무제한.',
    type: 'builtin',
    category: 'search',
    enabled: true,
    status: 'active',
    unlimited: true,
    free: true,
    tools: [
      { name: 'web_search', description: '다중 엔진 통합 검색', icon: 'ri-search-line' },
      { name: 'duckduckgo_search', description: 'DuckDuckGo 검색', icon: 'ri-search-eye-line' },
      { name: 'brave_search', description: 'Brave Search 검색', icon: 'ri-shield-line' },
      { name: 'bing_search', description: 'Bing 검색', icon: 'ri-search-2-line' },
      { name: 'searxng_search', description: 'SearXNG 로컬 검색', icon: 'ri-server-line' },
      { name: 'fetch_page', description: '웹 페이지 내용 가져오기', icon: 'ri-global-line' },
      { name: 'extract_links', description: '페이지 링크 추출', icon: 'ri-links-line' },
      { name: 'search_and_summarize', description: '검색 후 AI 요약', icon: 'ri-file-list-line' },
    ],
  },
];

const CATEGORY_INFO: Record<MCPServer['category'], { label: string; icon: string; color: string }> = {
  filesystem: { label: '파일 시스템', icon: 'ri-folder-line', color: 'text-yellow-400' },
  database: { label: '데이터베이스', icon: 'ri-database-2-line', color: 'text-green-400' },
  browser: { label: '브라우저', icon: 'ri-global-line', color: 'text-puma-accent' },
  memory: { label: '메모리', icon: 'ri-brain-line', color: 'text-pink-400' },
  terminal: { label: '터미널', icon: 'ri-terminal-line', color: 'text-orange-400' },
  search: { label: '검색', icon: 'ri-search-line', color: 'text-teal-400' },
  custom: { label: '커스텀', icon: 'ri-server-line', color: 'text-puma-muted' },
};

const STORAGE_KEY = 'gfd_mcp_servers';

function loadServers(): MCPServer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return BUILTIN_SERVERS;
}

function saveServers(servers: MCPServer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
}

// ─── Sub-components ───────────────────────────────────────────────
function StatusBadge({ status }: { status: MCPServer['status'] }) {
  const cfg = {
    active: { dot: 'bg-green-400', text: 'text-green-400', label: '활성' },
    idle: { dot: 'bg-puma-muted', text: 'text-puma-muted', label: '대기' },
    disabled: { dot: 'bg-puma-border', text: 'text-puma-muted', label: '비활성' },
    error: { dot: 'bg-red-400', text: 'text-red-400', label: '오류' },
  }[status];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'active' ? 'animate-pulse' : ''}`}></span>
      <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

function ServerCard({
  server,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
}: {
  server: MCPServer;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const cat = CATEGORY_INFO[server.category];
  return (
    <div
      onClick={onSelect}
      className={`bg-puma-surface rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-puma-accent/60' : 'border-puma-border/30 hover:border-puma-border/60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-puma-card flex-shrink-0`}>
          <i className={`${cat.icon} ${cat.color} text-xl`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-puma-text text-sm font-bold truncate">{server.name}</p>
            {server.free && (
              <span className="px-1.5 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded font-semibold flex-shrink-0">FREE</span>
            )}
            {server.unlimited && (
              <span className="px-1.5 py-0.5 bg-puma-accent/15 text-puma-accent text-[10px] rounded font-semibold flex-shrink-0">♾️</span>
            )}
          </div>
          <p className="text-puma-muted text-xs leading-relaxed line-clamp-2">{server.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={server.enabled ? server.status : 'disabled'} />
            <span className="text-puma-muted/60 text-xs">{server.tools.length}개 도구</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
              server.enabled ? 'bg-puma-accent' : 'bg-puma-border/50'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              server.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}></span>
          </button>
          {server.type === 'custom' && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-6 h-6 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line text-sm"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function MCPPage() {
  const [servers, setServers] = useState<MCPServer[]>(loadServers);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(servers[0] ?? null);
  const [activeTab, setActiveTab] = useState<'servers' | 'search'>('servers');
  const [showAddServer, setShowAddServer] = useState(false);
  const [showAddEngine, setShowAddEngine] = useState(false);
  const [pgConfig, setPgConfig] = useState<Record<string, string>>({});

  // Use shared search engines hook
  const {
    engines: searchEngines,
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

  // Custom server form
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerDesc, setNewServerDesc] = useState('');

  // Custom search engine form
  const [newEngineName, setNewEngineName] = useState('');
  const [newEngineUrl, setNewEngineUrl] = useState('');

  // Persist servers only
  useEffect(() => { saveServers(servers); }, [servers]);

  const toggleServer = (id: string) => {
    setServers(prev => prev.map(s => {
      if (s.id !== id) return s;
      const enabled = !s.enabled;
      return { ...s, enabled, status: enabled ? 'active' : 'disabled' };
    }));
    setSelectedServer(prev => prev?.id === id ? { ...prev, enabled: !prev.enabled } : prev);
  };

  const deleteServer = (id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
    if (selectedServer?.id === id) setSelectedServer(null);
  };

  const addCustomServer = () => {
    if (!newServerName.trim() || !newServerUrl.trim()) return;
    const s: MCPServer = {
      id: `custom-${Date.now()}`,
      name: newServerName.trim(),
      description: newServerDesc.trim() || '커스텀 MCP 서버',
      type: 'custom',
      category: 'custom',
      url: newServerUrl.trim(),
      enabled: false,
      status: 'idle',
      unlimited: true,
      free: true,
      tools: [
        { name: 'custom_tool', description: '커스텀 도구', icon: 'ri-tools-line' },
      ],
    };
    setServers(prev => [...prev, s]);
    setNewServerName(''); setNewServerUrl(''); setNewServerDesc('');
    setShowAddServer(false);
  };

  const addCustomEngineLocal = () => {
    if (!newEngineName.trim() || !newEngineUrl.trim()) return;
    addCustomEngine(newEngineName.trim(), newEngineUrl.trim());
    setNewEngineName(''); setNewEngineUrl('');
    setShowAddEngine(false);
  };

  const enabledCount = servers.filter(s => s.enabled).length;

  const filteredEngines = searchEngines.filter(e => {
    if (searchFilter === 'all') return true;
    if (searchFilter === 'uncensored') return e.uncensored;
    if (searchFilter === 'nsfw') return e.nsfw;
    if (searchFilter === 'proxy') return e.proxy;
    if (searchFilter === 'tor') return e.tor;
    if (searchFilter === 'standard') return !e.uncensored;
    return true;
  });

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-puma-border/30 bg-puma-surface flex-shrink-0">
          <div>
            <h2 className="text-puma-text text-xl font-bold">MCP Server</h2>
            <p className="text-puma-muted text-sm mt-0.5">
              Model Context Protocol · 완전 무료 · 무제한 · 로컬 전용
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-400/10 border border-green-400/20 rounded-lg">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-xs font-medium">{enabledCount}개 활성</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-puma-accent/10 border border-puma-accent/20 rounded-lg">
              <i className="ri-gift-line text-puma-accent text-sm"></i>
              <span className="text-puma-accent text-xs font-medium">영구 완전 무료</span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-0 bg-puma-bg border-b border-puma-border/30 flex-shrink-0">
          {[
            { id: 'servers', label: '🔌 MCP 서버', count: servers.length },
            { id: 'search', label: '🔍 검색 엔진', count: searchEngines.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all cursor-pointer border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-puma-accent border-puma-accent'
                  : 'text-puma-muted border-transparent hover:text-puma-text'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                activeTab === tab.id ? 'bg-puma-accent/20 text-puma-accent' : 'bg-puma-card text-puma-muted'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">

          {/* ── MCP Servers Tab ── */}
          {activeTab === 'servers' && (
            <>
              {/* Server List */}
              <div className="w-full lg:w-[420px] flex-shrink-0 overflow-y-auto border-r border-puma-border/30 bg-puma-bg">
                <div className="p-4 space-y-3">
                  {/* Free banner */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-green-400/8 border border-green-400/20 rounded-xl">
                    <i className="ri-shield-check-line text-green-400 text-lg flex-shrink-0"></i>
                    <div>
                      <p className="text-green-400 text-xs font-semibold">완전 무료 · 노 API · 로컬 전용</p>
                      <p className="text-green-400/70 text-xs">모든 MCP 서버는 로컬에서 실행되며 API 키나 결제가 필요 없습니다</p>
                    </div>
                  </div>

                  {/* Category groups */}
                  {(['filesystem', 'database', 'memory', 'browser', 'terminal', 'search', 'custom'] as const).map(cat => {
                    const catServers = servers.filter(s => s.category === cat);
                    if (catServers.length === 0) return null;
                    const catInfo = CATEGORY_INFO[cat];
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 px-1 mb-2">
                          <i className={`${catInfo.icon} ${catInfo.color} text-sm`}></i>
                          <span className="text-puma-muted text-xs font-semibold uppercase tracking-wide">{catInfo.label}</span>
                        </div>
                        <div className="space-y-2">
                          {catServers.map(server => (
                            <ServerCard
                              key={server.id}
                              server={server}
                              isSelected={selectedServer?.id === server.id}
                              onSelect={() => setSelectedServer(server)}
                              onToggle={() => toggleServer(server.id)}
                              onDelete={server.type === 'custom' ? () => deleteServer(server.id) : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Custom Server */}
                  {showAddServer ? (
                    <div className="bg-puma-surface rounded-xl border border-puma-accent/30 p-4 space-y-3">
                      <h4 className="text-puma-text text-sm font-semibold">커스텀 MCP 서버 추가</h4>
                      <input
                        type="text"
                        value={newServerName}
                        onChange={e => setNewServerName(e.target.value)}
                        placeholder="서버 이름..."
                        className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                      />
                      <input
                        type="url"
                        value={newServerUrl}
                        onChange={e => setNewServerUrl(e.target.value)}
                        placeholder="서버 URL (예: http://localhost:3001)..."
                        className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                      />
                      <input
                        type="text"
                        value={newServerDesc}
                        onChange={e => setNewServerDesc(e.target.value)}
                        placeholder="설명 (선택사항)..."
                        className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                      />
                      <div className="flex gap-2">
                        <button onClick={addCustomServer} className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">추가</button>
                        <button onClick={() => setShowAddServer(false)} className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">취소</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddServer(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-puma-border/30 rounded-xl text-puma-muted hover:border-puma-accent/40 hover:text-puma-accent transition-all cursor-pointer"
                    >
                      <i className="ri-add-line text-base"></i>
                      <span className="text-sm">커스텀 서버 추가</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Server Detail */}
              <div className="flex-1 overflow-y-auto bg-puma-bg">
                {selectedServer ? (
                  <div className="p-6 max-w-2xl">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-puma-surface border border-puma-border/30 flex-shrink-0`}>
                        <i className={`${CATEGORY_INFO[selectedServer.category].icon} ${CATEGORY_INFO[selectedServer.category].color} text-2xl`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-puma-text text-xl font-bold">{selectedServer.name}</h3>
                          <span className="px-2 py-0.5 bg-green-400/15 text-green-400 text-xs rounded-full font-semibold">무료</span>
                          <span className="px-2 py-0.5 bg-puma-accent/15 text-puma-accent text-xs rounded-full font-semibold">♾️ 무제한</span>
                          {selectedServer.type === 'builtin' && (
                            <span className="px-2 py-0.5 bg-puma-card text-puma-muted text-xs rounded-full">내장</span>
                          )}
                        </div>
                        <p className="text-puma-muted text-sm mt-1 leading-relaxed">{selectedServer.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <StatusBadge status={selectedServer.enabled ? selectedServer.status : 'disabled'} />
                          <span className="text-puma-muted/60 text-xs">{CATEGORY_INFO[selectedServer.category].label}</span>
                        </div>
                      </div>
                    </div>

                    {/* PostgreSQL Config */}
                    {selectedServer.id === 'mcp-postgres' && selectedServer.enabled && (
                      <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 mb-5">
                        <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">PostgreSQL 연결 설정</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'host', label: 'Host', placeholder: 'localhost' },
                            { key: 'port', label: 'Port', placeholder: '5432' },
                            { key: 'database', label: 'Database', placeholder: 'mydb' },
                            { key: 'user', label: 'User', placeholder: 'postgres' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="text-puma-muted text-xs mb-1 block">{f.label}</label>
                              <input
                                type="text"
                                value={pgConfig[f.key] ?? ''}
                                onChange={e => setPgConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent"
                              />
                            </div>
                          ))}
                          <div className="col-span-2">
                            <label className="text-puma-muted text-xs mb-1 block">Password</label>
                            <input
                              type="password"
                              value={pgConfig['password'] ?? ''}
                              onChange={e => setPgConfig(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="비밀번호..."
                              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tools */}
                    <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-5 mb-5">
                      <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">
                        사용 가능한 도구 ({selectedServer.tools.length}개)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedServer.tools.map(tool => (
                          <div key={tool.name} className="flex items-center gap-3 px-3 py-2.5 bg-puma-bg rounded-lg border border-puma-border/20">
                            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-puma-card flex-shrink-0">
                              <i className={`${tool.icon} text-puma-accent text-sm`}></i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-puma-text text-xs font-semibold font-mono">{tool.name}</p>
                              <p className="text-puma-muted text-xs truncate">{tool.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unlimited / Free info */}
                    <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 mb-5">
                      <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">사용 제한</h4>
                      <div className="space-y-2">
                        {[
                          { icon: 'ri-gift-line', label: '비용', value: '완전 무료 · 영구', color: 'text-green-400' },
                          { icon: 'ri-infinity-line', label: '사용 횟수', value: '무제한', color: 'text-puma-accent' },
                          { icon: 'ri-file-upload-line', label: '파일 업로드', value: '무제한 · 모든 형식', color: 'text-puma-accent' },
                          { icon: 'ri-lock-line', label: 'API 키', value: '불필요 · 로컬 전용', color: 'text-green-400' },
                          { icon: 'ri-shield-check-line', label: '프라이버시', value: '100% 로컬 · 외부 전송 없음', color: 'text-green-400' },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-3 px-3 py-2 bg-puma-bg rounded-lg">
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                              <i className={`${item.icon} ${item.color} text-sm`}></i>
                            </div>
                            <span className="text-puma-muted text-xs w-24 flex-shrink-0">{item.label}</span>
                            <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleServer(selectedServer.id)}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        selectedServer.enabled
                          ? 'bg-red-400/15 border border-red-400/30 text-red-400 hover:bg-red-400/25'
                          : 'bg-puma-accent/20 border border-puma-accent/40 text-puma-accent hover:bg-puma-accent/30'
                      }`}
                    >
                      <i className={`${selectedServer.enabled ? 'ri-stop-circle-line' : 'ri-play-circle-line'} mr-2`}></i>
                      {selectedServer.enabled ? '서버 비활성화' : '서버 활성화'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center p-8">
                    <div>
                      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-puma-surface border border-puma-border/30 mx-auto mb-4">
                        <i className="ri-server-line text-puma-muted text-3xl"></i>
                      </div>
                      <p className="text-puma-muted text-sm">서버를 선택하면 상세 정보가 표시됩니다</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Search Engines Tab ── */}
          {activeTab === 'search' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Uncensored Mode Banner */}
                <div className={`rounded-xl border p-4 transition-all ${
                  uncensoredMode
                    ? 'bg-red-400/8 border-red-400/30'
                    : 'bg-puma-surface border-puma-border/30'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                        uncensoredMode ? 'bg-red-400/15' : 'bg-puma-card'
                      }`}>
                        <i className={`ri-eye-off-line text-xl ${uncensoredMode ? 'text-red-400' : 'text-puma-muted'}`}></i>
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${uncensoredMode ? 'text-red-400' : 'text-puma-text'}`}>
                          무검열 검색 모드
                        </p>
                        <p className="text-puma-muted text-xs mt-0.5">
                          {uncensoredMode
                            ? '검열 없이 모든 콘텐츠에 접근 가능합니다'
                            : '검색 결과에 검열이 적용됩니다'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUncensoredMode(!uncensoredMode)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                        uncensoredMode ? 'bg-red-500' : 'bg-puma-border/50'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        uncensoredMode ? 'translate-x-5' : 'translate-x-0.5'
                      }`}></span>
                    </button>
                  </div>

                  {uncensoredMode && (
                    <div className="space-y-2 border-t border-puma-border/20 pt-3">
                      <div className="flex items-center justify-between px-3 py-2 bg-puma-bg rounded-lg">
                        <div className="flex items-center gap-2">
                          <i className="ri-shield-line text-orange-400 text-sm"></i>
                          <span className="text-puma-text text-xs font-medium">안전검색 완전 OFF</span>
                        </div>
                        <button
                          onClick={() => setSafeSearchOff(!safeSearchOff)}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                            safeSearchOff ? 'bg-orange-400' : 'bg-puma-border/50'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            safeSearchOff ? 'translate-x-4' : 'translate-x-0.5'
                          }`}></span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between px-3 py-2 bg-puma-bg rounded-lg">
                        <div className="flex items-center gap-2">
                          <i className="ri-fire-line text-red-400 text-sm"></i>
                          <span className="text-puma-text text-xs font-medium">성인 콘텐츠 허용</span>
                        </div>
                        <button
                          onClick={() => setNsfwEnabled(!nsfwEnabled)}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                            nsfwEnabled ? 'bg-red-500' : 'bg-puma-border/50'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            nsfwEnabled ? 'translate-x-4' : 'translate-x-0.5'
                          }`}></span>
                        </button>
                      </div>

                      <div className="flex items-start gap-2 px-3 py-2 bg-red-400/10 rounded-lg">
                        <i className="ri-alert-line text-red-400 text-sm flex-shrink-0 mt-0.5"></i>
                        <p className="text-red-400/80 text-xs leading-relaxed">
                          무검열 모드는 모든 검색 결과를 필터링 없이 표시합니다.
                          성인 콘텐츠, 폭력적 콘텐츠 등이 포함될 수 있습니다.
                          사용자의 책임 하에 사용하세요.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: '전체', count: searchEngines.length, icon: 'ri-search-line', color: 'text-puma-accent', bg: 'bg-puma-accent/15' },
                    { label: '무검열', count: uncensoredCount, icon: 'ri-eye-off-line', color: 'text-orange-400', bg: 'bg-orange-400/15' },
                    { label: '성인', count: nsfwCount, icon: 'ri-fire-line', color: 'text-red-400', bg: 'bg-red-400/15' },
                    { label: '프록시', count: proxyCount, icon: 'ri-global-line', color: 'text-teal-400', bg: 'bg-teal-400/15' },
                    { label: 'Tor', count: torCount, icon: 'ri-shield-keyhole-line', color: 'text-violet-400', bg: 'bg-violet-400/15' },
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => setSearchFilter(s.label === '전체' ? 'all' : s.label === '무검열' ? 'uncensored' : s.label === '성인' ? 'nsfw' : s.label === '프록시' ? 'proxy' : 'tor')}
                      className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border transition-all cursor-pointer ${
                        (s.label === '전체' && searchFilter === 'all') ||
                        (s.label === '무검열' && searchFilter === 'uncensored') ||
                        (s.label === '성인' && searchFilter === 'nsfw') ||
                        (s.label === '프록시' && searchFilter === 'proxy') ||
                        (s.label === 'Tor' && searchFilter === 'tor')
                          ? `${s.bg} border-current ${s.color}`
                          : 'bg-puma-surface border-puma-border/30 text-puma-muted hover:border-puma-accent/30'
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className={`${s.icon} text-sm`}></i>
                      </div>
                      <span className="text-xs font-bold">{s.count}</span>
                      <span className="text-[10px]">{s.label}</span>
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
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        searchFilter === f.id
                          ? 'bg-puma-card text-puma-accent'
                          : 'text-puma-muted hover:text-puma-text'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Info */}
                <div className="flex items-start gap-3 px-4 py-3 bg-puma-accent/8 border border-puma-accent/20 rounded-xl">
                  <i className="ri-information-line text-puma-accent text-base flex-shrink-0"></i>
                  <div>
                    <p className="text-puma-text text-sm font-semibold">커스텀 검색 엔진</p>
                    <p className="text-puma-muted text-xs mt-0.5 leading-relaxed">
                      URL에 <code className="bg-puma-card px-1 rounded text-puma-accent">{'{query}'}</code>를 포함하면 검색어가 자동으로 치환됩니다.
                      예: <code className="bg-puma-card px-1 rounded text-puma-muted text-xs">https://example.com/search?q={'{query}'}</code>
                    </p>
                  </div>
                </div>

                {/* Current default */}
                {defaultEngine && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-green-400/8 border border-green-400/20 rounded-xl">
                    <i className="ri-search-line text-green-400 text-base flex-shrink-0"></i>
                    <div>
                      <p className="text-green-400 text-xs font-semibold">현재 기본 검색 엔진</p>
                      <p className="text-puma-text text-sm font-bold">{defaultEngine.name}</p>
                    </div>
                  </div>
                )}

                {/* Engine list */}
                <div className="space-y-2">
                  {filteredEngines.map(engine => (
                    <div
                      key={engine.id}
                      className={`bg-puma-surface rounded-xl border p-4 transition-all ${
                        engine.isDefault ? 'border-puma-accent/40' : 'border-puma-border/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 ${
                          engine.isDefault ? 'bg-puma-accent/20' : 'bg-puma-card'
                        }`}>
                          <i className={`ri-search-line text-base ${engine.isDefault ? 'text-puma-accent' : 'text-puma-muted'}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-puma-text text-sm font-semibold">{engine.name}</p>
                            {engine.isDefault && (
                              <span className="px-1.5 py-0.5 bg-puma-accent/20 text-puma-accent text-[10px] rounded font-semibold">기본값</span>
                            )}
                            {engine.isCustom && (
                              <span className="px-1.5 py-0.5 bg-puma-card text-puma-muted text-[10px] rounded">커스텀</span>
                            )}
                            {engine.uncensored && (
                              <span className="px-1.5 py-0.5 bg-orange-400/15 text-orange-400 text-[10px] rounded font-semibold">무검열</span>
                            )}
                            {engine.nsfw && (
                              <span className="px-1.5 py-0.5 bg-red-400/15 text-red-400 text-[10px] rounded font-semibold">성인</span>
                            )}
                            {engine.proxy && (
                              <span className="px-1.5 py-0.5 bg-teal-400/15 text-teal-400 text-[10px] rounded font-semibold">프록시</span>
                            )}
                            {engine.tor && (
                              <span className="px-1.5 py-0.5 bg-violet-400/15 text-violet-400 text-[10px] rounded font-semibold">Tor</span>
                            )}
                          </div>
                          <p className="text-puma-muted text-xs font-mono truncate mt-0.5">{engine.url}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!engine.isDefault && (
                            <button
                              onClick={() => setDefaultEngine(engine.id)}
                              className="px-3 py-1.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs hover:border-puma-accent/40 hover:text-puma-accent transition-colors cursor-pointer whitespace-nowrap"
                            >
                              기본값 설정
                            </button>
                          )}
                          {engine.isCustom && (
                            <button
                              onClick={() => deleteEngine(engine.id)}
                              className="w-7 h-7 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add custom engine */}
                {showAddEngine ? (
                  <div className="bg-puma-surface rounded-xl border border-puma-accent/30 p-4 space-y-3">
                    <h4 className="text-puma-text text-sm font-semibold">커스텀 검색 엔진 추가</h4>
                    <input
                      type="text"
                      value={newEngineName}
                      onChange={e => setNewEngineName(e.target.value)}
                      placeholder="검색 엔진 이름..."
                      className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                    />
                    <input
                      type="url"
                      value={newEngineUrl}
                      onChange={e => setNewEngineUrl(e.target.value)}
                      placeholder="검색 URL (예: https://example.com/search?q={query})..."
                      className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent font-mono text-xs"
                    />
                    <p className="text-puma-muted/60 text-xs">
                      URL에 <code className="bg-puma-card px-1 rounded">{'{query}'}</code>를 포함하세요
                    </p>
                    <div className="flex gap-2">
                      <button onClick={addCustomEngineLocal} className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">추가</button>
                      <button onClick={() => setShowAddEngine(false)} className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">취소</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddEngine(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-puma-border/30 rounded-xl text-puma-muted hover:border-puma-accent/40 hover:text-puma-accent transition-all cursor-pointer"
                  >
                    <i className="ri-add-line text-base"></i>
                    <span className="text-sm">커스텀 검색 엔진 추가</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
