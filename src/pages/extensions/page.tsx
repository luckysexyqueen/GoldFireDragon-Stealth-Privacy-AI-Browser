import { useState } from 'react';
import Layout from '@/components/feature/Layout';
import { useExtensionManager, BROWSER_INFO, Extension } from '@/hooks/useExtensionManager';
import ExtensionInstaller from './components/ExtensionInstaller';
import ExtensionList from './components/ExtensionList';

type Tab = 'installed' | 'install';

export default function ExtensionsPage() {
  const {
    extensions,
    loaded,
    currentBrowser,
    toggleExtension,
    removeExtension,
    openExtensionPage,
  } = useExtensionManager();

  const [activeTab, setActiveTab] = useState<Tab>('install');
  const [justInstalled, setJustInstalled] = useState<Extension | null>(null);

  const browserInfo = BROWSER_INFO[currentBrowser];
  const enabledCount = extensions.filter(e => e.enabled).length;

  const handleInstalled = (ext: Extension) => {
    setJustInstalled(ext);
    setActiveTab('installed');
    setTimeout(() => setJustInstalled(null), 4000);
  };

  return (
    <Layout>
      <div className="p-5 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-puma-text text-xl font-bold flex items-center gap-2">
              <i className="ri-puzzle-line text-puma-accent"></i>
              Extension Manager
            </h2>
            <p className="text-puma-muted text-sm mt-0.5">
              Chrome · Firefox · Whale · Edge 확장프로그램 통합 관리
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Browser Badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${browserInfo.bg} border-current/20`}>
              <i className={`${browserInfo.icon} ${browserInfo.color} text-base`}></i>
              <span className={`text-xs font-bold ${browserInfo.color}`}>{browserInfo.label}</span>
            </div>
            {/* Open Extension Page */}
            <button
              onClick={openExtensionPage}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-puma-border/30 bg-puma-surface text-puma-muted text-xs font-semibold hover:text-puma-accent hover:border-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-external-link-line text-sm"></i>
              확장 관리 페이지
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: '전체 확장', value: extensions.length, icon: 'ri-puzzle-line', color: 'text-puma-accent', bg: 'bg-puma-accent/10' },
            { label: '활성화됨', value: enabledCount, icon: 'ri-check-line', color: 'text-green-400', bg: 'bg-green-400/10' },
            { label: '비활성화', value: extensions.length - enabledCount, icon: 'ri-pause-line', color: 'text-puma-muted', bg: 'bg-puma-card' },
            { label: '지원 브라우저', value: 4, icon: 'ri-global-line', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
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

        {/* Just Installed Notification */}
        {justInstalled && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-green-400/10 border border-green-400/20 rounded-xl">
            <i className="ri-check-line text-green-400 text-lg flex-shrink-0"></i>
            <div>
              <p className="text-green-400 text-sm font-semibold">{justInstalled.name} 등록 완료!</p>
              <p className="text-puma-muted text-xs">{justInstalled.installNote}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-puma-bg rounded-xl p-1 mb-5">
          {([
            { id: 'install',   label: '설치하기',       icon: 'ri-download-line' },
            { id: 'installed', label: `설치됨 (${extensions.length})`, icon: 'ri-puzzle-line' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-puma-surface text-puma-accent'
                  : 'text-puma-muted hover:text-puma-text'
              }`}
            >
              <i className={`${tab.icon} text-base`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-5">
          {activeTab === 'install' && (
            <ExtensionInstaller onInstalled={handleInstalled} />
          )}
          {activeTab === 'installed' && (
            loaded ? (
              <ExtensionList
                extensions={extensions}
                onToggle={toggleExtension}
                onDelete={removeExtension}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <i className="ri-loader-4-line text-puma-accent text-2xl animate-spin"></i>
              </div>
            )
          )}
        </div>

        {/* Browser Compatibility Guide */}
        <div className="mt-6 bg-puma-surface rounded-xl border border-puma-border/20 p-5">
          <h3 className="text-puma-text text-sm font-bold mb-4 flex items-center gap-2">
            <i className="ri-information-line text-puma-accent"></i>
            브라우저별 설치 가이드
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['chrome', 'firefox', 'whale', 'edge'] as const).map(browser => {
              const info = BROWSER_INFO[browser];
              return (
                <div key={browser} className={`rounded-xl border border-current/10 p-4 ${info.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <i className={`${info.icon} ${info.color} text-lg`}></i>
                    <span className={`text-sm font-bold ${info.color}`}>{info.label}</span>
                  </div>
                  <p className="text-puma-muted text-xs leading-relaxed mb-3">{info.localInstallGuide}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => window.open(info.storeUrl, '_blank', 'noopener,noreferrer')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-opacity hover:opacity-80 ${info.bg} ${info.color}`}
                    >
                      <i className="ri-store-2-line"></i>스토어
                    </button>
                    <button
                      onClick={() => window.open(info.extensionPageUrl, '_blank')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-opacity hover:opacity-80 ${info.bg} ${info.color}`}
                    >
                      <i className="ri-settings-3-line"></i>관리 페이지
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
