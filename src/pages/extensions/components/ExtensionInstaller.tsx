/**
 * ExtensionInstaller
 * URL 입력 + 로컬 파일 업로드로 확장프로그램 설치
 */
import { useRef, useState } from 'react';
import {
  useExtensionManager,
  parseExtensionUrl,
  SOURCE_INFO,
  BROWSER_INFO,
  CATEGORY_INFO,
  ExtensionCategory,
  Extension,
} from '@/hooks/useExtensionManager';

const POPULAR_EXTENSIONS = [
  {
    name: 'uBlock Origin',
    desc: '최강 광고 차단기',
    category: 'privacy' as ExtensionCategory,
    icon: 'ri-shield-check-line',
    iconColor: 'text-green-400',
    iconBg: 'bg-green-400/15',
    urls: {
      chrome: 'https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/',
      whale: 'https://store.whale.naver.com/detail/odfafepnkmbhccpbejgmiehpchacaeak',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/ublock-origin/odfafepnkmbhccpbejgmiehpchacaeak',
    },
  },
  {
    name: 'Dark Reader',
    desc: '모든 사이트 다크모드',
    category: 'utility' as ExtensionCategory,
    icon: 'ri-moon-line',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-400/15',
    urls: {
      chrome: 'https://chrome.google.com/webstore/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/darkreader/',
      whale: 'https://store.whale.naver.com/detail/eimadpbcbfnmbkopoojfekhnkhdbieeh',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/dark-reader/ifoakfbpdcdoeenechcleahebpibofpc',
    },
  },
  {
    name: 'Bitwarden',
    desc: '오픈소스 비밀번호 관리자',
    category: 'privacy' as ExtensionCategory,
    icon: 'ri-lock-password-line',
    iconColor: 'text-puma-accent',
    iconBg: 'bg-puma-accent/15',
    urls: {
      chrome: 'https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/',
      whale: 'https://store.whale.naver.com/detail/nngceckbapebfimnlniiiahkandclblb',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/bitwarden-free-password/jbkfoedolllekgbhcbcoahefnbanhhlh',
    },
  },
  {
    name: 'Tampermonkey',
    desc: '유저스크립트 관리자',
    category: 'developer' as ExtensionCategory,
    icon: 'ri-code-s-slash-line',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-400/15',
    urls: {
      chrome: 'https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/',
      whale: 'https://store.whale.naver.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd',
    },
  },
  {
    name: 'Wappalyzer',
    desc: '웹사이트 기술 스택 분석',
    category: 'developer' as ExtensionCategory,
    icon: 'ri-search-eye-line',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-400/15',
    urls: {
      chrome: 'https://chrome.google.com/webstore/detail/wappalyzer-technology-pro/gppongmhjkpfnbhagpmjfkannfbllamg',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/wappalyzer/',
      whale: 'https://store.whale.naver.com/detail/gppongmhjkpfnbhagpmjfkannfbllamg',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/wappalyzer-technology-pro/mnbndgmknlpdjdnjfmfcdjoegcckoimn',
    },
  },
  {
    name: 'React DevTools',
    desc: 'React 개발자 도구',
    category: 'developer' as ExtensionCategory,
    icon: 'ri-reactjs-line',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-400/15',
    urls: {
      chrome: 'https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/react-devtools/',
      whale: 'https://store.whale.naver.com/detail/fmkadmapgofadopljbjfkapdkoienihi',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil',
    },
  },
];

interface Props {
  onInstalled?: (ext: Extension) => void;
}

export default function ExtensionInstaller({ onInstalled }: Props) {
  const { installFromUrl, installFromFile, currentBrowser } = useExtensionManager();
  const [urlInput, setUrlInput] = useState('');
  const [extName, setExtName] = useState('');
  const [extDesc, setExtDesc] = useState('');
  const [extCategory, setExtCategory] = useState<ExtensionCategory>('other');
  const [isInstalling, setIsInstalling] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'popular'>('popular');
  const [installingPopular, setInstallingPopular] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const browserInfo = BROWSER_INFO[currentBrowser];
  const parsedUrl = urlInput.trim() ? parseExtensionUrl(urlInput.trim()) : null;
  const urlSourceInfo = parsedUrl ? SOURCE_INFO[parsedUrl.source] : null;

  const handleUrlInstall = async () => {
    if (!urlInput.trim() || isInstalling) return;
    setIsInstalling(true);
    setResult(null);
    const res = await installFromUrl(urlInput.trim(), {
      name: extName || undefined,
      description: extDesc || undefined,
      category: extCategory,
    });
    setResult(res);
    if (res.success) {
      setUrlInput('');
      setExtName('');
      setExtDesc('');
      if (res.ext) onInstalled?.(res.ext);
    }
    setIsInstalling(false);
  };

  const handleFileUpload = async (file: File) => {
    setIsInstalling(true);
    setResult(null);
    const res = await installFromFile(file, { category: extCategory });
    setResult(res);
    if (res.success && res.ext) onInstalled?.(res.ext);
    setIsInstalling(false);
  };

  const handlePopularInstall = async (ext: typeof POPULAR_EXTENSIONS[0]) => {
    const urlMap = ext.urls as Record<string, string>;
    const url = urlMap[currentBrowser] ?? urlMap['chrome'];
    if (!url) return;
    setInstallingPopular(ext.name);
    const res = await installFromUrl(url, {
      name: ext.name,
      description: ext.desc,
      category: ext.category,
    });
    if (res.ext) onInstalled?.(res.ext);
    setInstallingPopular(null);
  };

  return (
    <div className="space-y-4">
      {/* Browser Detection Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${browserInfo.bg} border-current/20`}>
        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${browserInfo.bg} flex-shrink-0`}>
          <i className={`${browserInfo.icon} ${browserInfo.color} text-lg`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${browserInfo.color}`}>
            {browserInfo.label} 감지됨
          </p>
          <p className="text-puma-muted text-xs truncate">
            {browserInfo.storeUrl || '스토어 URL 없음'}
          </p>
        </div>
        <button
          onClick={() => window.open(browserInfo.storeUrl, '_blank', 'noopener,noreferrer')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${browserInfo.bg} ${browserInfo.color} hover:opacity-80`}
        >
          <i className="ri-store-2-line mr-1"></i>스토어 열기
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-puma-bg rounded-xl p-1">
        {([
          { id: 'popular', label: '추천 확장', icon: 'ri-star-line' },
          { id: 'url',     label: 'URL 설치',  icon: 'ri-link' },
          { id: 'file',    label: '파일 설치', icon: 'ri-file-zip-line' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? 'bg-puma-surface text-puma-accent' : 'text-puma-muted hover:text-puma-text'
            }`}
          >
            <i className={`${tab.icon} text-sm`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 추천 확장 탭 ── */}
      {activeTab === 'popular' && (
        <div className="space-y-2">
          <p className="text-puma-muted text-xs">현재 브라우저({browserInfo.label})에 맞는 스토어 링크로 자동 연결됩니다</p>
          {POPULAR_EXTENSIONS.map(ext => {
            const catInfo = CATEGORY_INFO[ext.category];
            const isInstalling = installingPopular === ext.name;
            return (
              <div key={ext.name} className="flex items-center gap-3 bg-puma-surface rounded-xl border border-puma-border/20 px-4 py-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${ext.iconBg}`}>
                  <i className={`${ext.icon} ${ext.iconColor} text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-puma-text text-sm font-bold">{ext.name}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${catInfo.bg} ${catInfo.color}`}>{catInfo.label}</span>
                  </div>
                  <p className="text-puma-muted text-xs mt-0.5">{ext.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* 각 브라우저 스토어 버튼 */}
                  {(Object.entries(ext.urls) as [string, string][]).map(([browser, url]) => {
                    const bInfo = BROWSER_INFO[browser as keyof typeof BROWSER_INFO];
                    if (!bInfo) return null;
                    return (
                      <button
                        key={browser}
                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                        title={`${bInfo.label}에서 설치`}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${bInfo.bg} ${bInfo.color} hover:opacity-80`}
                      >
                        <i className={`${bInfo.icon} text-sm`}></i>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePopularInstall(ext)}
                    disabled={isInstalling}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isInstalling
                        ? 'bg-puma-card text-puma-muted cursor-not-allowed'
                        : 'bg-puma-accent/15 text-puma-accent hover:bg-puma-accent/25'
                    }`}
                  >
                    {isInstalling ? (
                      <><i className="ri-loader-4-line animate-spin"></i>설치 중</>
                    ) : (
                      <><i className="ri-download-line"></i>설치</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── URL 설치 탭 ── */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div className="bg-puma-surface rounded-xl border border-puma-border/20 p-4 space-y-3">
            <p className="text-puma-muted text-xs font-semibold uppercase tracking-wide">지원 URL 형식</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: 'Chrome Web Store', example: 'chrome.google.com/webstore/detail/...', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: 'ri-chrome-line' },
                { label: 'Firefox Add-ons',  example: 'addons.mozilla.org/addon/...',          color: 'text-orange-400', bg: 'bg-orange-400/10', icon: 'ri-firefox-line' },
                { label: 'Whale Store',      example: 'store.whale.naver.com/detail/...',      color: 'text-teal-400',   bg: 'bg-teal-400/10',   icon: 'ri-global-line' },
                { label: 'Edge Add-ons',     example: 'microsoftedge.microsoft.com/addons/...', color: 'text-puma-accent', bg: 'bg-puma-accent/10', icon: 'ri-edge-line' },
              ]).map(item => (
                <div key={item.label} className={`flex items-start gap-2 px-3 py-2 rounded-lg ${item.bg}`}>
                  <i className={`${item.icon} ${item.color} text-sm mt-0.5 flex-shrink-0`}></i>
                  <div>
                    <p className={`text-xs font-semibold ${item.color}`}>{item.label}</p>
                    <p className="text-puma-muted/60 text-[10px] break-all">{item.example}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-1.5 block">스토어 URL 또는 직접 다운로드 링크</label>
            <div className="relative">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://chrome.google.com/webstore/detail/..."
                className="w-full bg-puma-bg border border-puma-border/30 rounded-xl px-4 py-3 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent pr-12"
              />
              {urlSourceInfo && (
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg ${urlSourceInfo.bg}`}>
                  <i className={`${urlSourceInfo.icon} ${urlSourceInfo.color} text-xs`}></i>
                  <span className={`text-[10px] font-bold ${urlSourceInfo.color}`}>{urlSourceInfo.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Optional meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-puma-muted text-xs mb-1 block">이름 (선택)</label>
              <input
                type="text"
                value={extName}
                onChange={e => setExtName(e.target.value)}
                placeholder="확장프로그램 이름"
                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
              />
            </div>
            <div>
              <label className="text-puma-muted text-xs mb-1 block">카테고리</label>
              <select
                value={extCategory}
                onChange={e => setExtCategory(e.target.value as ExtensionCategory)}
                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent cursor-pointer"
              >
                {(Object.entries(CATEGORY_INFO) as [ExtensionCategory, typeof CATEGORY_INFO[ExtensionCategory]][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleUrlInstall}
            disabled={!urlInput.trim() || isInstalling}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
              urlInput.trim() && !isInstalling
                ? 'bg-puma-accent/20 border border-puma-accent/40 text-puma-accent hover:bg-puma-accent/30'
                : 'bg-puma-card text-puma-muted cursor-not-allowed'
            }`}
          >
            {isInstalling ? (
              <><i className="ri-loader-4-line animate-spin"></i>스토어 페이지 열기 중...</>
            ) : (
              <><i className="ri-external-link-line"></i>스토어에서 설치</>
            )}
          </button>
        </div>
      )}

      {/* ── 파일 설치 탭 ── */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          {/* 파일 형식 안내 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { ext: '.crx',  label: 'Chrome',  desc: 'Chrome/Whale/Edge', color: 'text-amber-400',  bg: 'bg-amber-400/10' },
              { ext: '.xpi',  label: 'Firefox', desc: 'Firefox 전용',      color: 'text-orange-400', bg: 'bg-orange-400/10' },
              { ext: '.whl',  label: 'Whale',   desc: 'Whale 전용',        color: 'text-teal-400',   bg: 'bg-teal-400/10' },
              { ext: '.zip',  label: 'ZIP',     desc: '압축 해제 후 로드', color: 'text-green-400',  bg: 'bg-green-400/10' },
            ]).map(item => (
              <div key={item.ext} className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl ${item.bg} border border-current/10`}>
                <span className={`text-lg font-black font-mono ${item.color}`}>{item.ext}</span>
                <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
                <span className="text-puma-muted/70 text-[10px] text-center">{item.desc}</span>
              </div>
            ))}
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-all cursor-pointer ${
              dragOver
                ? 'border-puma-accent bg-puma-accent/8'
                : 'border-puma-border/40 hover:border-puma-accent/50 hover:bg-puma-surface/50'
            }`}
          >
            {isInstalling ? (
              <>
                <i className="ri-loader-4-line text-puma-accent text-3xl animate-spin"></i>
                <p className="text-puma-accent text-sm font-semibold">설치 처리 중...</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-puma-accent/10">
                  <i className="ri-file-zip-line text-puma-accent text-3xl"></i>
                </div>
                <div className="text-center">
                  <p className="text-puma-text text-sm font-semibold">
                    {dragOver ? '여기에 놓으세요!' : '확장프로그램 파일 드래그 & 드롭'}
                  </p>
                  <p className="text-puma-muted text-xs mt-1">.crx · .xpi · .whl · .zip</p>
                  <p className="text-puma-muted/60 text-[10px] mt-0.5">클릭하여 파일 선택</p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".crx,.xpi,.whl,.zip"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
            className="hidden"
          />

          {/* 수동 설치 안내 */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/20 p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${browserInfo.bg}`}>
                <i className={`${browserInfo.icon} ${browserInfo.color} text-base`}></i>
              </div>
              <div>
                <p className={`text-sm font-bold ${browserInfo.color} mb-1`}>{browserInfo.label} 수동 설치 방법</p>
                <p className="text-puma-muted text-xs leading-relaxed">{browserInfo.localInstallGuide}</p>
                <button
                  onClick={() => window.open(browserInfo.extensionPageUrl, '_blank')}
                  className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${browserInfo.bg} ${browserInfo.color} hover:opacity-80`}
                >
                  <i className="ri-external-link-line"></i>확장 관리 페이지 열기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${
          result.success
            ? 'bg-green-400/10 border-green-400/20'
            : 'bg-red-400/10 border-red-400/20'
        }`}>
          <i className={`${result.success ? 'ri-check-line text-green-400' : 'ri-error-warning-line text-red-400'} text-base flex-shrink-0 mt-0.5`}></i>
          <p className={`text-xs leading-relaxed ${result.success ? 'text-green-400' : 'text-red-400'}`}>{result.message}</p>
        </div>
      )}
    </div>
  );
}
