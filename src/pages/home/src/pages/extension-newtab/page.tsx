import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

const ENGINES = [
  { id: "goldfiredragon", label: "🐉 GFD", fullLabel: "GoldFireDragon", url: "https://www.google.co.jp/search?q={q}&gl=jp&hl=ko&safe=off" },
  { id: "presearch", label: "🔭 PRE", fullLabel: "Presearch", url: "https://presearch.com/search?q={q}" },
  { id: "duckduckgo", label: "🦆 DDG", fullLabel: "DuckDuckGo", url: "https://duckduckgo.com/?q={q}&kl=jp-jp" },
  { id: "brave", label: "🦁 BRV", fullLabel: "Brave Search", url: "https://search.brave.com/search?q={q}&lang=ko&country=jp" },
  { id: "bing", label: "🅱 BNG", fullLabel: "Bing", url: "https://www.bing.com/search?q={q}&setlang=ko&cc=JP" },
];

const SHORTCUTS = [
  { icon: "ri-youtube-line", label: "YouTube", url: "https://youtube.com", color: "text-red-500" },
  { icon: "ri-github-line", label: "GitHub", url: "https://github.com", color: "text-gray-800" },
  { icon: "ri-reddit-line", label: "Reddit", url: "https://reddit.com", color: "text-orange-500" },
  { icon: "ri-twitter-x-line", label: "X / Twitter", url: "https://x.com", color: "text-gray-900" },
  { icon: "ri-mail-line", label: "Gmail", url: "https://mail.google.com", color: "text-red-400" },
  { icon: "ri-drive-line", label: "Drive", url: "https://drive.google.com", color: "text-green-500" },
  { icon: "ri-map-2-line", label: "Maps", url: "https://maps.google.com", color: "text-green-600" },
  { icon: "ri-translate-2", label: "Translate", url: "https://translate.google.com", color: "text-blue-500" },
];

const RECENT_SITES = [
  { title: "GoldFireDragon 검색", url: "https://goldfiredragon.app", time: "2분 전" },
  { title: "GitHub - GoldFireDragon", url: "https://github.com/goldfiredragon", time: "15분 전" },
  { title: "Chrome 웹 스토어", url: "https://chrome.google.com/webstore", time: "32분 전" },
  { title: "Firefox AMO", url: "https://addons.mozilla.org", time: "1시간 전" },
  { title: "DuckDuckGo", url: "https://duckduckgo.com", time: "2시간 전" },
  { title: "Presearch", url: "https://presearch.com", time: "3시간 전" },
];

const BACKGROUNDS = [
  "https://readdy.ai/api/search-image?query=dark%20abstract%20geometric%20minimalist%20background%20with%20subtle%20orange%20and%20yellow%20gradient%20accents%20on%20deep%20black%20surface%20modern%20sleek%20design%20low%20poly%20mesh%20pattern%20soft%20glowing%20edges%20premium%20quality%20wallpaper&width=1920&height=1080&seq=newtab1&orientation=landscape",
  "https://readdy.ai/api/search-image?query=dark%20night%20sky%20with%20stars%20and%20subtle%20aurora%20borealis%20colors%20deep%20blue%20and%20purple%20gradient%20minimalist%20calm%20serene%20atmosphere%20high%20quality%20wallpaper%20background&width=1920&height=1080&seq=newtab2&orientation=landscape",
  "https://readdy.ai/api/search-image?query=abstract%20dark%20fluid%20art%20background%20with%20warm%20amber%20and%20gold%20swirls%20on%20deep%20charcoal%20black%20surface%20luxurious%20elegant%20minimalist%20modern%20design%20wallpaper&width=1920&height=1080&seq=newtab3&orientation=landscape",
];

function formatTime(date: Date) {
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function formatDate(date: Date) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}요일`;
}

export default function ExtensionNewtabPage() {
  const [engine, setEngine] = useState("goldfiredragon");
  const [searchText, setSearchText] = useState("");
  const [time, setTime] = useState(new Date());
  const [bgIndex, setBgIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecent, setShowRecent] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [bgEnabled, setBgEnabled] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = time.getHours();
    if (hour < 6) setGreeting("🌙 좋은 밤이에요");
    else if (hour < 12) setGreeting("☀️ 좋은 아침이에요");
    else if (hour < 18) setGreeting("🌤️ 좋은 오후예요");
    else setGreeting("🌆 좋은 저녁이에요");
  }, [time]);

  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    const e = ENGINES.find((en) => en.id === engine) ?? ENGINES[0];
    const url = e.url.replace("{q}", encodeURIComponent(searchText));
    window.open(url, "_blank");
  }, [searchText, engine]);

  const currentBg = bgEnabled ? BACKGROUNDS[bgIndex] : undefined;

  return (
    <div
      className={`min-h-screen relative overflow-hidden font-['Inter',sans-serif] transition-colors ${
        darkMode ? "bg-[#0a0a0a] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Background image */}
      {currentBg && (
        <div className="absolute inset-0 z-0">
          <img
            src={currentBg}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 ${darkMode ? "bg-black/60" : "bg-white/40"}`} />
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-500">
            <i className="ri-fire-line text-white text-xs" />
          </div>
          <span className="text-xs font-semibold opacity-80">GoldFireDragon</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer transition-colors"
          >
            <i className="ri-settings-3-line text-sm opacity-70" />
          </button>
          <Link
            to="/extension-options"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer transition-colors"
          >
            <i className="ri-puzzle-line text-sm opacity-70" />
          </Link>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="relative z-20 mx-6 mb-4 max-w-sm ml-auto">
          <div className={`rounded-2xl border p-4 space-y-3 ${darkMode ? "bg-[#1a1a1a]/90 border-white/10 backdrop-blur-md" : "bg-white/90 border-gray-200 backdrop-blur-md"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">새 탭 설정</span>
              <button onClick={() => setShowSettings(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer">
                <i className="ri-close-line text-xs" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-70">다크 모드</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${darkMode ? "bg-yellow-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-70">배경 이미지</span>
                <button
                  onClick={() => setBgEnabled(!bgEnabled)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${bgEnabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${bgEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              {bgEnabled && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs opacity-50">배경:</span>
                  {BACKGROUNDS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBgIndex(i)}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all ${
                        bgIndex === i ? "border-yellow-400 scale-110" : "border-white/20"
                      }`}
                      style={{ background: i === 0 ? "#1a1a1a" : i === 1 ? "#0f172a" : "#18181b" }}
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-70">단축키 표시</span>
                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${showShortcuts ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showShortcuts ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-70">최근 방문 표시</span>
                <button
                  onClick={() => setShowRecent(!showRecent)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${showRecent ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showRecent ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* Clock */}
        <div className="text-center mb-8">
          <p className="text-6xl sm:text-7xl font-light tracking-tight tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatTime(time)}
          </p>
          <p className="text-sm mt-2 opacity-60">{formatDate(time)}</p>
          <p className="text-xs mt-1 opacity-40">{greeting}</p>
        </div>

        {/* Logo + Search */}
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-red-500">
              <i className="ri-fire-line text-white text-xl" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent">
              GoldFireDragon
            </span>
          </div>

          {/* Search bar */}
          <div className={`flex items-center gap-3 rounded-2xl border px-5 py-3.5 transition-all ${
            darkMode
              ? "bg-white/10 border-white/20 backdrop-blur-md focus-within:border-yellow-400/50"
              : "bg-white border-gray-200 shadow-sm focus-within:border-gray-400"
          }`}>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i className="ri-search-line text-lg opacity-50" />
            </div>
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-transparent outline-none text-base placeholder:opacity-40"
              autoFocus
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <i className="ri-close-line text-sm" />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl text-sm font-medium hover:opacity-90 cursor-pointer whitespace-nowrap transition-opacity flex-shrink-0"
            >
              검색
            </button>
          </div>

          {/* Engine selector */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {ENGINES.map((e) => (
              <button
                key={e.id}
                onClick={() => setEngine(e.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
                  engine === e.id
                    ? "bg-gradient-to-r from-yellow-500 to-red-500 text-white"
                    : darkMode
                    ? "bg-white/10 border border-white/10 text-white/60 hover:bg-white/20"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span>{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        {showShortcuts && (
          <div className="w-full max-w-xl mt-10">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {SHORTCUTS.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all cursor-pointer ${
                    darkMode
                      ? "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                      : "bg-white border border-gray-200 hover:border-gray-300 shadow-sm"
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <i className={`${s.icon} ${s.color} text-xl`} />
                  </div>
                  <span className="text-xs opacity-70 truncate w-full text-center">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Recent visits */}
        {showRecent && (
          <div className={`w-full max-w-xl mt-6 rounded-2xl border p-4 ${
            darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium opacity-60 flex items-center gap-1.5">
                <i className="ri-history-line" />
                최근 방문
              </span>
              <button
                onClick={() => setShowRecent(false)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
              >
                <i className="ri-close-line text-xs" />
              </button>
            </div>
            <div className="space-y-2">
              {RECENT_SITES.map((site) => (
                <a
                  key={site.url}
                  href={site.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    darkMode ? "hover:bg-white/10" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                    <i className="ri-global-line text-xs opacity-50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{site.title}</p>
                    <p className="text-xs opacity-40 truncate">{site.url}</p>
                  </div>
                  <span className="text-xs opacity-30 flex-shrink-0">{site.time}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs opacity-40 hover:opacity-80 cursor-pointer transition-opacity">
            <i className="ri-home-4-line mr-1" />홈
          </Link>
          <Link to="/extension-options" className="text-xs opacity-40 hover:opacity-80 cursor-pointer transition-opacity">
            <i className="ri-settings-3-line mr-1" />설정
          </Link>
          <Link to="/extensions" className="text-xs opacity-40 hover:opacity-80 cursor-pointer transition-opacity">
            <i className="ri-puzzle-line mr-1" />확장 관리자
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-30">v1.0.0</span>
          <span className="text-xs opacity-30">GoldFireDragon</span>
        </div>
      </div>
    </div>
  );
}
