import { useState, useRef, useEffect } from "react";
import EngineSelector from "./EngineSelector";
import { getEngine, getSavedEngineId, saveEngineId } from "./engines";

const suggestions = [
  "날씨",
  "번역",
  "유튜브",
  "네이버",
  "쿠팡",
  "구글 번역",
  "환율",
  "주식",
];

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [safeSearch, setSafeSearch] = useState(false);
  const [censored, setCensored] = useState(false);
  const [desktopMode, setDesktopMode] = useState(true);
  const [privateMode] = useState(true); // 항상 강제 ON
  const [jpIp, setJpIp] = useState(true);
  const [ipVerified, setIpVerified] = useState<boolean | null>(null);
  const [engineId, setEngineId] = useState(getSavedEngineId);
  const JP_IP = "109.123.230.28";
  const PROXY_URL = "https://zuhevuyotcigibupboaz.supabase.co/functions/v1/jp-ip-search-proxy";
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEngineChange = (id: string) => {
    setEngineId(id);
    saveEngineId(id);
  };

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (focused && query.length > 0) {
      setShowSuggestions(true);
    } else if (focused && query.length === 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [focused, query]);

  const buildSearchUrl = (q: string) => {
    const engine = getEngine(engineId);
    return engine.buildDirectUrl(q.trim(), safeSearch && !censored);
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setShowSuggestions(false);

    // onSearch가 연결되어 있으면 페이지 내 결과 표시
    if (onSearch) {
      onSearch(q.trim());
      return;
    }

    // onSearch 없으면 직접 Google로 이동
    if (jpIp) {
      try {
        const params = new URLSearchParams({
          q: q.trim(),
          safe: safeSearch && !censored ? "active" : "off",
          num: desktopMode ? "10" : "6",
        });
        const resp = await fetch(`${PROXY_URL}?${params.toString()}`);
        const data = await resp.json();
        if (data.success) {
          setIpVerified(true);
          window.open(data.search_url, "_blank");
          return;
        }
      } catch {
        setIpVerified(false);
      }
    }
    window.open(buildSearchUrl(q), "_blank");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch(query);
  };

  return (
    <div className="w-full max-w-[584px] mx-auto relative">
      <div
        className={`flex items-center w-full border rounded-full px-4 py-3 transition-shadow ${
          focused
            ? "shadow-md border-white"
            : "border-[#dfe1e5] hover:shadow-md hover:border-white"
        } bg-white`}
      >
        <div className="w-5 h-5 flex items-center justify-center mr-3 text-[#9aa0a6]">
          <i className="ri-search-line text-lg" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          className="flex-1 outline-none bg-transparent text-base text-[#202124] placeholder-[#9aa0a6]"
          placeholder=""
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="w-5 h-5 flex items-center justify-center text-[#70757a] hover:text-[#202124] cursor-pointer mr-2"
          >
            <i className="ri-close-line text-lg" />
          </button>
        )}
        <div className="w-px h-6 bg-[#dfe1e5] mx-2" />
        {/* Voice search */}
        <button
          className="w-6 h-6 flex items-center justify-center text-[#4285f4] cursor-pointer ml-1"
          title="음성 검색"
        >
          <i className="ri-mic-line text-xl" />
        </button>
        {/* Image search */}
        <button
          className="w-6 h-6 flex items-center justify-center text-[#4285f4] cursor-pointer ml-2"
          title="이미지로 검색"
        >
          <i className="ri-camera-line text-xl" />
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-2xl mt-1 shadow-lg z-50 overflow-hidden py-2">
          {(query ? filtered : suggestions).map((s) => (
            <div
              key={s}
              onMouseDown={() => { setQuery(s); handleSearch(s); }}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="w-4 h-4 flex items-center justify-center text-[#9aa0a6]">
                <i className="ri-search-line text-sm" />
              </div>
              <span className="text-sm text-[#202124]">{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* 엔진 선택 */}
      <div className="flex justify-center mt-4">
        <EngineSelector selectedId={engineId} onChange={handleEngineChange} variant="dark" />
      </div>

      {/* Buttons below search */}
      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={() => handleSearch(query)}
          className="px-4 py-2 bg-[#f8f9fa] text-[#3c4043] text-sm rounded-md hover:bg-[#f0f0f0] border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow-sm whitespace-nowrap cursor-pointer"
        >
          Google 검색
        </button>
        <button
          onClick={async () => {
            const q = query.trim() || "행운";
            if (jpIp) {
              try {
                const params = new URLSearchParams({ q, safe: (safeSearch && !censored) ? "active" : "off", num: "10" });
                const resp = await fetch(`${PROXY_URL}?${params.toString()}`);
                const data = await resp.json();
                if (data.success) { setIpVerified(true); window.open(data.search_url, "_blank"); return; }
              } catch { setIpVerified(false); }
            }
            const luckyParams = new URLSearchParams({ q, hl: "ko", gl: jpIp ? "jp" : "kr", btnI: "1", safe: (safeSearch && !censored) ? "active" : "off", pws: "0", nfpr: "1", ...(jpIp ? { cr: "countryJP", near: "Tokyo" } : {}) });
            window.open(`${jpIp ? "https://www.google.co.jp" : "https://www.google.com"}/search?${luckyParams.toString()}`, "_blank");
          }}
          className="px-4 py-2 bg-[#f8f9fa] text-[#3c4043] text-sm rounded-md hover:bg-[#f0f0f0] border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow-sm whitespace-nowrap cursor-pointer"
        >
          행운을 느껴봐!
        </button>
      </div>

      {/* SafeSearch + 무검열 toggles */}
      <div className="flex justify-center gap-3 mt-4 flex-wrap">
        {/* 프라이빗 모드 - 항상 강제 ON */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap bg-purple-500/20 border-purple-400/60 text-purple-200 select-none"
          title="개인·프라이빗·시크릿·인코그니토 모드 — 항상 강제 활성화"
        >
          <div className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" />
          <div className="w-3 h-3 flex items-center justify-center">
            <i className="ri-spy-line text-xs" />
          </div>
          <span>프라이빗&nbsp;</span>
          <span className="font-bold tracking-widest text-purple-200">LOCK</span>
          <i className="ri-lock-line text-xs ml-0.5" />
        </div>

        {/* 일본 IP */}
        <button
          onClick={() => { setJpIp(!jpIp); setIpVerified(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
            jpIp
              ? "bg-red-500/20 border-red-400/60 text-red-200 hover:bg-red-500/30"
              : "bg-white/10 border-white/20 text-white/50 hover:bg-white/20"
          }`}
          title={jpIp ? `일본 IP 활성화 중\nIP: ${JP_IP}\nX-Forwarded-For 헤더 주입` : "일본 IP 비활성화"}
        >
          <div className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${
            jpIp ? "bg-red-300 animate-pulse" : "bg-white/30"
          }`} />
          <span className="font-bold text-sm leading-none">🇯🇵</span>
          <div className="flex flex-col items-start leading-none gap-0.5">
            <span className="font-bold tracking-wide">
              JP&nbsp;
              {jpIp ? (
                <span className={ipVerified === true ? "text-green-300" : ipVerified === false ? "text-orange-300" : "text-red-200"}>
                  {ipVerified === true ? "✓" : ipVerified === false ? "~" : "ON"}
                </span>
              ) : (
                <span className="text-white/40">OFF</span>
              )}
            </span>
            {jpIp && (
              <span className="text-[10px] opacity-70 font-mono tracking-tight">{JP_IP}</span>
            )}
          </div>
        </button>

        {/* SafeSearch */}
        <button
          onClick={() => setSafeSearch(!safeSearch)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
            safeSearch
              ? "bg-green-500/20 border-green-400/60 text-green-300 hover:bg-green-500/30"
              : "bg-red-500/20 border-red-400/60 text-red-300 hover:bg-red-500/30"
          }`}
        >
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            safeSearch ? "bg-green-400" : "bg-red-400"
          }`} />
          <span>세이프서치&nbsp;</span>
          <span className={`font-bold tracking-widest ${
            safeSearch ? "text-green-300" : "text-red-300"
          }`}>
            {safeSearch ? "ON" : "OFF"}
          </span>
        </button>

        {/* 무검열 */}
        <button
          onClick={() => setCensored(!censored)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
            !censored
              ? "bg-yellow-500/20 border-yellow-400/60 text-yellow-300 hover:bg-yellow-500/30"
              : "bg-white/10 border-white/20 text-white/50 hover:bg-white/20"
          }`}
        >
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            !censored ? "bg-yellow-400" : "bg-white/30"
          }`} />
          <div className="w-3 h-3 flex items-center justify-center">
            <i className={`text-xs ${
              !censored ? "ri-eye-line" : "ri-eye-off-line"
            }`} />
          </div>
          <span>무검열&nbsp;</span>
          <span className={`font-bold tracking-widest ${
            !censored ? "text-yellow-300" : "text-white/40"
          }`}>
            {!censored ? "ON" : "OFF"}
          </span>
        </button>

        {/* 데스크탑 모드 */}
        <button
          onClick={() => setDesktopMode(!desktopMode)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
            desktopMode
              ? "bg-blue-400/20 border-blue-300/60 text-blue-200 hover:bg-blue-400/30"
              : "bg-white/10 border-white/20 text-white/50 hover:bg-white/20"
          }`}
        >
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            desktopMode ? "bg-blue-300" : "bg-white/30"
          }`} />
          <div className="w-3 h-3 flex items-center justify-center">
            <i className={`text-xs ${
              desktopMode ? "ri-computer-line" : "ri-smartphone-line"
            }`} />
          </div>
          <span>데스크탑&nbsp;</span>
          <span className={`font-bold tracking-widest ${
            desktopMode ? "text-blue-200" : "text-white/40"
          }`}>
            {desktopMode ? "ON" : "OFF"}
          </span>
        </button>
      </div>
    </div>
  );
}
