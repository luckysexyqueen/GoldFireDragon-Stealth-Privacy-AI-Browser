import { useState, useEffect } from "react";
import EngineSelector from "./EngineSelector";
import { getEngine, getSavedEngineId, saveEngineId } from "./engines";

interface SearchResultsProps {
  query: string;
  safeSearch?: boolean;
  onNewSearch?: (q: string) => void;
}

const tabList = [
  { label: "전체", icon: "ri-search-line" },
  { label: "이미지", icon: "ri-image-line" },
  { label: "동영상", icon: "ri-video-line" },
  { label: "뉴스", icon: "ri-newspaper-line" },
  { label: "지도", icon: "ri-map-2-line" },
];

function buildTabUrl(query: string, tab: string, safe: boolean): string {
  const q = encodeURIComponent(query);
  const s = safe ? "active" : "off";
  switch (tab) {
    case "이미지": return `https://www.google.co.jp/search?q=${q}&hl=ko&gl=jp&tbm=isch&safe=${s}`;
    case "동영상": return `https://www.google.co.jp/search?q=${q}&hl=ko&gl=jp&tbm=vid&safe=${s}`;
    case "뉴스": return `https://www.google.co.jp/search?q=${q}&hl=ko&gl=jp&tbm=nws&safe=${s}`;
    case "지도": return `https://www.google.co.jp/maps/search/${q}?hl=ko`;
    default: return "";
  }
}

export default function SearchResults({ query, safeSearch = false, onNewSearch }: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState("전체");
  const [inputVal, setInputVal] = useState(query);
  const [currentQuery, setCurrentQuery] = useState(query);
  const [engineId, setEngineId] = useState(getSavedEngineId);
  const [countdown, setCountdown] = useState(2);
  const [moved, setMoved] = useState(false);

  const engine = getEngine(engineId);

  const directUrl = activeTab === "전체"
    ? engine.buildDirectUrl(currentQuery, safeSearch)
    : buildTabUrl(currentQuery, activeTab, safeSearch);

  const handleEngineChange = (id: string) => {
    setEngineId(id);
    saveEngineId(id);
  };

  // 검색어/엔진/탭 바뀌면 카운트다운 리셋
  useEffect(() => {
    setInputVal(query);
    setCurrentQuery(query);
    setCountdown(2);
    setMoved(false);
  }, [query, activeTab, engineId]);

  // 자동 이동 카운트다운
  useEffect(() => {
    if (moved) return;
    if (countdown <= 0) {
      setMoved(true);
      window.open(directUrl, "_blank");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, directUrl, moved]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setCurrentQuery(inputVal.trim());
      onNewSearch?.(inputVal.trim());
      setCountdown(2);
      setMoved(false);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    const url = buildTabUrl(currentQuery, tab, safeSearch);
    if (url) window.open(url, "_blank");
  };

  const handleManualOpen = () => {
    setMoved(true);
    window.open(directUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상단 검색바 (sticky) */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#ebebeb] shrink-0">
        <div className="flex items-center gap-4 px-6 py-3">
          <a href="/" className="shrink-0 cursor-pointer">
            <img
              src="https://cdn-ai.onspace.ai/onspace/project/code/latest/9besdg-cCYhDexFaSNynPhyC8QrNM-1776790082899152/GoldFireDragonBrowser_logo-removebg-preview.png"
              alt="GoldFireDragonBrowser"
              className="h-[36px] w-auto object-contain"
            />
          </a>

          <form onSubmit={handleSubmit} className="flex-1 max-w-[640px]">
            <div className="flex items-center border border-[#dfe1e5] rounded-full px-4 py-2 hover:shadow-md focus-within:shadow-md bg-white gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="flex-1 outline-none text-sm text-[#202124] bg-transparent"
                autoComplete="off"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => setInputVal("")}
                  className="text-[#70757a] cursor-pointer w-4 h-4 flex items-center justify-center"
                >
                  <i className="ri-close-line text-base" />
                </button>
              )}
              <div className="w-px h-5 bg-[#dfe1e5]" />
              <button type="submit" className="text-[#9aa0a6] cursor-pointer w-5 h-5 flex items-center justify-center">
                <i className="ri-search-line text-base" />
              </button>
            </div>
          </form>

          <div className="shrink-0 flex items-center gap-2">
            <EngineSelector selectedId={engineId} onChange={handleEngineChange} variant="light" />
          </div>
        </div>

        {/* 탭 */}
        <div className="flex items-center gap-1 px-6 lg:px-[168px]">
          {tabList.map((tab) => (
            <button
              key={tab.label}
              onClick={() => handleTabClick(tab.label)}
              className={`flex items-center gap-1 px-3 py-2.5 text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.label
                  ? "border-[#1a73e8] text-[#1a73e8]"
                  : "border-transparent text-[#5f6368] hover:text-[#202124]"
              }`}
            >
              <i className={`${tab.icon} text-sm`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 직빵 이동 화면 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          {/* 엔진 아이콘 */}
          <div className="text-6xl mb-4">{engine.emoji}</div>

          <h2 className="text-xl font-semibold text-[#202124] mb-2">
            {engine.name}에서 검색 중
          </h2>

          <p className="text-sm text-[#5f6368] mb-1">
            <strong>&apos;{currentQuery}&apos;</strong>
          </p>

          <p className="text-xs text-[#9aa0a6] mb-6">
            {moved
              ? "새 탭에서 열렸어요. 팝업 차단을 확인해주세요."
              : `${countdown}초 후 ${engine.name}으로 이동합니다...`}
          </p>

          {/* 프로그레스 바 */}
          {!moved && (
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[#1a73e8] rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((2 - countdown) / 2) * 100}%` }}
              />
            </div>
          )}

          {/* 수동 이동 버튼 */}
          <button
            onClick={handleManualOpen}
            className="px-6 py-3 text-sm font-medium text-white bg-[#1a73e8] rounded-full hover:bg-[#1765cc] cursor-pointer whitespace-nowrap transition-colors"
          >
            {moved ? "다시 열기" : `${engine.name}에서 결과 보기`}
          </button>

          {/* URL 미리보기 */}
          <p className="mt-4 text-[10px] text-[#9aa0a6] break-all font-mono bg-gray-50 rounded-lg px-3 py-2">
            {directUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
