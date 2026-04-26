import { useState } from "react";
import { Link } from "react-router-dom";

const ENGINES = [
  { id: "goldfiredragon", label: "🐉 GoldFireDragon", sub: "Google JP + 스텔스", active: true },
  { id: "presearch", label: "🔭 Presearch", sub: "탈중앙화 검색", active: false },
  { id: "duckduckgo", label: "🦆 DuckDuckGo", sub: "프라이버시 중심", active: false },
  { id: "brave", label: "🦁 Brave Search", sub: "독립 검색엔진", active: false },
  { id: "bing", label: "🅱 Bing", sub: "Microsoft", active: false },
];

const TOGGLES = [
  { id: "stealth", label: "스텔스 UA", desc: "FireDragon UA 적용", on: true },
  { id: "track", label: "추적 차단", desc: "UTM 파라미터 제거", on: true },
  { id: "newtab", label: "새 탭 커스텀", desc: "GoldFireDragon 새 탭", on: true },
];

const STATS = [
  { label: "검색", value: "342", icon: "ri-search-line" },
  { label: "차단", value: "1,208", icon: "ri-shield-check-line" },
  { label: "UA 변경", value: "452", icon: "ri-spy-line" },
];

export default function ExtensionPopupPage() {
  const [engine, setEngine] = useState("goldfiredragon");
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    stealth: true, track: true, newtab: true,
  });
  const [searchText, setSearchText] = useState("");

  const toggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-['Inter',sans-serif] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">확장 프로그램 팝업 UI</h1>
          <p className="text-xs text-gray-400">브라우저 툴바 아이콘 클릭 시 나오는 패널</p>
        </div>

        {/* Popup simulation */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mx-auto" style={{ width: "360px", maxWidth: "100%" }}>
          {/* Header */}
          <div className="px-4 py-3 bg-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-500">
                <i className="ri-fire-line text-white text-xs" />
              </div>
              <span className="text-xs font-semibold text-white">GoldFireDragon</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/extension-options"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer transition-colors text-white/70"
                title="설정"
              >
                <i className="ri-settings-3-line text-xs" />
              </Link>
              <Link
                to="/extensions"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer transition-colors text-white/70"
                title="관리자"
              >
                <i className="ri-puzzle-line text-xs" />
              </Link>
            </div>
          </div>

          {/* Search box */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-search-line text-gray-400 text-sm" />
              </div>
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchText.trim()) {
                    window.open(`https://www.google.co.jp/search?q=${encodeURIComponent(searchText)}&gl=jp&hl=ko&safe=off`, "_blank");
                  }
                }}
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xs" />
                </button>
              )}
            </div>
          </div>

          {/* Engine selector */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">검색 엔진</p>
            <div className="space-y-1.5">
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEngine(e.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    engine === e.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 ${
                    engine === e.id ? "bg-white/20" : "bg-white border border-gray-200"
                  }`}>
                    <span className="text-sm">{e.label.split(" ")[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{e.label.split(" ").slice(1).join(" ")}</p>
                    <p className={`text-xs truncate ${engine === e.id ? "text-gray-300" : "text-gray-400"}`}>{e.sub}</p>
                  </div>
                  {engine === e.id && (
                    <div className="w-4 h-4 flex items-center justify-center ml-auto flex-shrink-0">
                      <i className="ri-check-line text-xs" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">기능</p>
            <div className="space-y-2">
              {TOGGLES.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{t.label}</p>
                    <p className="text-xs text-gray-400">{t.desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(t.id)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                      toggles[t.id] ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      toggles[t.id] ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">오늘의 활동</p>
            <div className="flex items-center gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="flex-1 text-center p-2 bg-gray-50 rounded-xl">
                  <div className="w-5 h-5 flex items-center justify-center mx-auto mb-1">
                    <i className={`${s.icon} text-gray-400 text-sm`} />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">v1.0.0</span>
            <div className="flex items-center gap-2">
              <Link
                to="/extension-options"
                className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
              >
                ⚙ 설정
              </Link>
              <Link
                to="/"
                className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
              >
                홈
              </Link>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 mb-3">이 팝업은 실제 확장 프로그램의 툴바 아이콘 클릭 시 나타나는 UI입니다</p>
          <div className="flex justify-center gap-3">
            <Link
              to="/extension-options"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:border-gray-300 cursor-pointer transition-colors"
            >
              <i className="ri-settings-3-line" />
              옵션 페이지
            </Link>
            <Link
              to="/extensions"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <i className="ri-puzzle-line" />
              확장 관리자
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
