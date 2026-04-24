import { useState } from 'react';
import Layout from '@/components/feature/Layout';
import { useUserscriptManager, Userscript, parseUserscriptMeta } from '@/hooks/useUserscriptManager';
import UserscriptEditor from './components/UserscriptEditor';

const STATUS_STYLE: Record<Userscript['status'], { label: string; color: string; bg: string; icon: string }> = {
  active:   { label: '활성',   color: 'text-green-400',  bg: 'bg-green-400/15',  icon: 'ri-check-line' },
  disabled: { label: '비활성', color: 'text-puma-muted', bg: 'bg-puma-card',     icon: 'ri-pause-line' },
  error:    { label: '오류',   color: 'text-red-400',    bg: 'bg-red-400/15',    icon: 'ri-error-warning-line' },
};

export default function UserscriptsPage() {
  const {
    scripts,
    loaded,
    installFromUrl,
    installFromFile,
    saveScript,
    toggleScript,
    deleteScript,
    runScript,
    exportScript,
  } = useUserscriptManager();

  const [activeTab, setActiveTab] = useState<'list' | 'install' | 'editor'>('list');
  const [editingScript, setEditingScript] = useState<Userscript | undefined>();
  const [urlInput, setUrlInput] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const filtered = scripts.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleUrlInstall = async () => {
    if (!urlInput.trim()) return;
    setIsInstalling(true);
    setResult(null);
    const res = await installFromUrl(urlInput.trim());
    setResult(res);
    if (res.success) {
      setUrlInput('');
      setActiveTab('list');
    }
    setIsInstalling(false);
  };

  const handleFileUpload = async (file: File) => {
    setIsInstalling(true);
    setResult(null);
    const res = await installFromFile(file);
    setResult(res);
    if (res.success) setActiveTab('list');
    setIsInstalling(false);
  };

  const handleSave = (script: Partial<Userscript> & { code: string }, existingId?: string) => {
    const res = saveScript(script, existingId);
    setResult({ success: true, message: '스크립트 저장 완료' });
    setActiveTab('list');
    setEditingScript(undefined);
  };

  const handleEdit = (script: Userscript) => {
    setEditingScript(script);
    setActiveTab('editor');
  };

  const handleNew = () => {
    setEditingScript(undefined);
    setActiveTab('editor');
  };

  return (
    <Layout>
      <div className="p-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-puma-text text-xl font-bold flex items-center gap-2">
              <i className="ri-code-box-line text-puma-accent"></i>
              Userscript Manager
            </h2>
            <p className="text-puma-muted text-sm mt-0.5">
              Tampermonkey / Greasemonkey 스타일 유저스크립트 관리
            </p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-puma-accent/20 border border-puma-accent/40 text-puma-accent text-sm font-bold hover:bg-puma-accent/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i>새 스크립트
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: '전체 스크립트', value: scripts.length, color: 'text-puma-accent', bg: 'bg-puma-accent/10', icon: 'ri-code-box-line' },
            { label: '활성', value: scripts.filter(s => s.status === 'active').length, color: 'text-green-400', bg: 'bg-green-400/10', icon: 'ri-check-line' },
            { label: '비활성/오류', value: scripts.filter(s => s.status !== 'active').length, color: 'text-puma-muted', bg: 'bg-puma-card', icon: 'ri-pause-line' },
          ].map(stat => (
            <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-puma-border/20 ${stat.bg}`}>
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl ${stat.bg} flex-shrink-0`}>
                <i className={`${stat.icon} ${stat.color} text-lg`}></i>
              </div>
              <div>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-puma-muted text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-puma-bg rounded-xl p-1 mb-5">
          {([
            { id: 'list',    label: `스크립트 목록 (${scripts.length})`, icon: 'ri-list-check' },
            { id: 'install', label: '설치하기',                        icon: 'ri-download-line' },
            { id: 'editor',  label: editingScript ? '스크립트 편집' : '새 스크립트', icon: 'ri-code-s-slash-line' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? 'bg-puma-surface text-puma-accent' : 'text-puma-muted hover:text-puma-text'
              }`}
            >
              <i className={`${tab.icon} text-base`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-5">
          {/* List Tab */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-puma-muted text-sm"></i>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="스크립트 검색..."
                  className="w-full bg-puma-bg border border-puma-border/30 rounded-lg pl-9 pr-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-puma-card mb-3">
                    <i className="ri-code-box-line text-puma-muted text-3xl"></i>
                  </div>
                  <p className="text-puma-muted text-sm">
                    {scripts.length === 0 ? '설치된 스크립트가 없습니다' : '검색 결과가 없습니다'}
                  </p>
                  <button
                    onClick={handleNew}
                    className="mt-2 text-puma-accent text-xs cursor-pointer hover:underline"
                  >
                    새 스크립트 만들기
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(script => {
                    const status = STATUS_STYLE[script.status];
                    return (
                      <div
                        key={script.id}
                        className={`bg-puma-bg rounded-xl border transition-all duration-200 overflow-hidden ${
                          script.status === 'active' ? 'border-puma-border/20' : 'border-puma-border/10 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 ${status.bg}`}>
                            <i className={`${status.icon} ${status.color} text-base`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-puma-text text-sm font-bold truncate">{script.name}</p>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${status.bg} ${status.color}`}>
                                {status.label}
                              </span>
                              <span className="text-puma-muted/60 text-[10px]">v{script.version}</span>
                            </div>
                            <p className="text-puma-muted text-xs mt-0.5 truncate">{script.description || '설명 없음'}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-puma-muted/50 text-[10px]">매치: {script.matches.slice(0, 2).join(', ')}{script.matches.length > 2 ? '...' : ''}</span>
                              <span className="text-puma-muted/50 text-[10px]">·</span>
                              <span className="text-puma-muted/50 text-[10px]">실행 {script.runCount}회</span>
                              {script.lastRunAt && (
                                <>
                                  <span className="text-puma-muted/50 text-[10px]">·</span>
                                  <span className="text-puma-muted/50 text-[10px]">마지막: {new Date(script.lastRunAt).toLocaleDateString('ko-KR')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleScript(script.id)}
                              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                                script.status === 'active' ? 'bg-puma-accent' : 'bg-puma-border/50'
                              }`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                script.status === 'active' ? 'translate-x-4.5' : 'translate-x-0.5'
                              }`}></span>
                            </button>
                            <button
                              onClick={() => handleEdit(script)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent hover:bg-puma-card transition-colors cursor-pointer"
                            >
                              <i className="ri-edit-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => exportScript(script.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent hover:bg-puma-card transition-colors cursor-pointer"
                              title=".user.js로 다운로드"
                            >
                              <i className="ri-download-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => deleteScript(script.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Install Tab */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              {/* URL Install */}
              <div className="bg-puma-bg rounded-xl border border-puma-border/20 p-4 space-y-3">
                <p className="text-puma-muted text-xs font-semibold uppercase tracking-wide">URL에서 설치</p>
                <p className="text-puma-muted/60 text-xs">.user.js 파일의 직접 다운로드 URL을 입력하세요</p>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/script.user.js"
                    className="flex-1 bg-puma-surface border border-puma-border/30 rounded-lg px-3 py-2.5 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                  />
                  <button
                    onClick={handleUrlInstall}
                    disabled={!urlInput.trim() || isInstalling}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      urlInput.trim() && !isInstalling
                        ? 'bg-puma-accent/20 border border-puma-accent/40 text-puma-accent hover:bg-puma-accent/30'
                        : 'bg-puma-card text-puma-muted cursor-not-allowed'
                    }`}
                  >
                    {isInstalling ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-download-line"></i>}
                    설치
                  </button>
                </div>
              </div>

              {/* File Install */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && (file.name.endsWith('.js') || file.name.endsWith('.user.js'))) {
                    handleFileUpload(file);
                  }
                }}
                onClick={() => fileInputRef[1](null)}
                className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  dragOver ? 'border-puma-accent bg-puma-accent/8' : 'border-puma-border/40 hover:border-puma-accent/50'
                }`}
              >
                {isInstalling ? (
                  <>
                    <i className="ri-loader-4-line text-puma-accent text-3xl animate-spin"></i>
                    <p className="text-puma-accent text-sm font-semibold">설치 중...</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-puma-accent/10">
                      <i className="ri-file-code-line text-puma-accent text-3xl"></i>
                    </div>
                    <div className="text-center">
                      <p className="text-puma-text text-sm font-semibold">
                        {dragOver ? '여기에 놓으세요!' : '.user.js 파일 드래그 & 드롭'}
                      </p>
                      <p className="text-puma-muted text-xs mt-1">.js · .user.js</p>
                    </div>
                  </>
                )}
              </div>

              {/* Result */}
              {result && (
                <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${
                  result.success ? 'bg-green-400/10 border-green-400/20' : 'bg-red-400/10 border-red-400/20'
                }`}>
                  <i className={`${result.success ? 'ri-check-line text-green-400' : 'ri-error-warning-line text-red-400'} text-base flex-shrink-0 mt-0.5`}></i>
                  <p className={`text-xs leading-relaxed ${result.success ? 'text-green-400' : 'text-red-400'}`}>{result.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <UserscriptEditor
              script={editingScript}
              onSave={handleSave}
              onCancel={() => { setActiveTab('list'); setEditingScript(undefined); }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}