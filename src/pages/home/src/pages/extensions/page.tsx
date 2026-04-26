import { useState } from "react";
import { Link } from "react-router-dom";
import { mockInstalledExtensions, mockUserScripts, mockStoreExtensions, ExtensionItem, UserScript } from "@/mocks/extensions";
import MyExtensions from "./components/MyExtensions";
import StoreTab from "./components/StoreTab";
import UserScripts from "./components/UserScripts";
import SmartInstallBanner from "./components/SmartInstallBanner";
import PlatformGuide from "./components/PlatformGuide";
import CompatMatrix from "./components/CompatMatrix";
import AllStores from "./components/AllStores";
import ExtensionSource from "./components/ExtensionSource";
import ZipDownloader from "./components/ZipDownloader";

type Tab = "extensions" | "store" | "userscripts" | "install" | "compat" | "allstores" | "source";

export default function ExtensionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("extensions");
  const [devMode, setDevMode] = useState(false);
  const [extensions, setExtensions] = useState<ExtensionItem[]>(mockInstalledExtensions);
  const [scripts, setScripts] = useState<UserScript[]>(mockUserScripts);

  const handleToggleExt = (id: string) => {
    setExtensions((prev) => prev.map((e) => e.id === id ? { ...e, enabled: !e.enabled } : e));
  };
  const handleRemoveExt = (id: string) => {
    setExtensions((prev) => prev.filter((e) => e.id !== id));
  };
  const handleUpdateExt = (id: string) => {
    setExtensions((prev) => prev.map((e) => e.id === id ? { ...e, updateAvailable: false } : e));
  };
  const handleInstallFromStore = (ext: ExtensionItem) => {
    if (!extensions.find((e) => e.id === ext.id)) {
      setExtensions((prev) => [...prev, ext]);
    }
  };
  const handleToggleScript = (id: string) => {
    setScripts((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };
  const handleSaveScript = (updated: UserScript) => {
    setScripts((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  };
  const handleDeleteScript = (id: string) => {
    setScripts((prev) => prev.filter((s) => s.id !== id));
  };
  const handleAddScript = (script: UserScript) => {
    setScripts((prev) => [...prev, script]);
  };

  const enabledExt = extensions.filter((e) => e.enabled).length;
  const enabledScripts = scripts.filter((s) => s.enabled).length;
  const updateCount = extensions.filter((e) => e.updateAvailable).length;

  const STORES_COUNT = 12;
  const TABS = [
    { id: "extensions" as Tab, label: "확장 프로그램", icon: "ri-puzzle-line", badge: extensions.length },
    { id: "store" as Tab, label: "스토어", icon: "ri-store-2-line", badge: mockStoreExtensions.filter((e) => !extensions.find((i) => i.id === e.id)).length },
    { id: "userscripts" as Tab, label: "유저스크립트", icon: "ri-code-s-slash-line", badge: scripts.length },
    { id: "install" as Tab, label: "설치 가이드", icon: "ri-download-cloud-line", badge: 0 },
    { id: "compat" as Tab, label: "호환성", icon: "ri-table-line", badge: 0 },
    { id: "allstores" as Tab, label: "모든 스토어", icon: "ri-store-3-line", badge: STORES_COUNT },
    { id: "source" as Tab, label: "소스 코드", icon: "ri-code-s-slash-line", badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-['Inter',sans-serif]">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/" className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-500">
                <i className="ri-fire-line text-white text-xs" />
              </div>
              <span className="font-semibold text-gray-800 text-sm hidden sm:block">GoldFireDragon</span>
            </Link>
            <span className="text-gray-200 hidden sm:block">/</span>
            <span className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 truncate">
              <i className="ri-puzzle-line text-gray-400 flex-shrink-0" />
              <span className="truncate">확장 프로그램 관리자</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {updateCount > 0 && (
              <button
                onClick={() => extensions.forEach((e) => e.updateAvailable && handleUpdateExt(e.id))}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-blue-100 transition-colors"
              >
                <i className="ri-refresh-line" />
                <span className="hidden sm:inline">{updateCount}개 업데이트</span>
                <span className="sm:hidden">{updateCount}</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">개발자 모드</span>
              <button
                onClick={() => setDevMode(!devMode)}
                className={`relative w-9 sm:w-10 h-5 rounded-full transition-colors cursor-pointer ${devMode ? "bg-gray-900" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${devMode ? "translate-x-4 sm:translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </div>

        {devMode && (
          <div className="bg-amber-50 border-t border-amber-100 px-4 sm:px-6 py-2 flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <i className="ri-error-warning-line text-amber-500 text-sm" />
            </div>
            <p className="text-xs text-amber-700">
              개발자 모드 활성화됨 — 확장 ID, 패키징 도구, 로컬 압축 해제 로드 기능 사용 가능
            </p>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Smart Install Banner - always visible */}
        <SmartInstallBanner />

        {/* Status bar */}
        <div className="flex items-center gap-4 sm:gap-6 mb-5 flex-wrap">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            확장 프로그램 {enabledExt}/{extensions.length} 활성화
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
            유저스크립트 {enabledScripts}/{scripts.length} 활성화
          </div>
        </div>

        {/* Tab nav - scrollable on mobile */}
        <div className="flex items-center gap-0 border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium cursor-pointer transition-colors whitespace-nowrap border-b-2 -mb-px flex-shrink-0 ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${tab.icon} text-base`} />
              </div>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              {tab.badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  activeTab === tab.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "extensions" && (
          <MyExtensions
            extensions={extensions}
            devMode={devMode}
            onToggle={handleToggleExt}
            onRemove={handleRemoveExt}
            onUpdate={handleUpdateExt}
          />
        )}
        {activeTab === "store" && (
          <StoreTab installed={extensions} onInstall={handleInstallFromStore} />
        )}
        {activeTab === "userscripts" && (
          <UserScripts
            scripts={scripts}
            onToggle={handleToggleScript}
            onSave={handleSaveScript}
            onDelete={handleDeleteScript}
            onAdd={handleAddScript}
          />
        )}
        {activeTab === "install" && (
          <div className="space-y-8">
            <ZipDownloader />
            <PlatformGuide />
          </div>
        )}
        {activeTab === "compat" && <CompatMatrix />}
        {activeTab === "allstores" && <AllStores />}
        {activeTab === "source" && <ExtensionSource />}
      </main>
    </div>
  );
}
