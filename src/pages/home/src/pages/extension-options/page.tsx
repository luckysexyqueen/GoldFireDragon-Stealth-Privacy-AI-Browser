import { useState } from "react";
import { Link } from "react-router-dom";

interface Setting {
  id: string;
  label: string;
  desc: string;
  type: "toggle" | "select" | "text" | "radio";
  value: boolean | string;
  options?: { value: string; label: string }[];
  icon: string;
  category: string;
}

const DEFAULT_SETTINGS: Setting[] = [
  {
    id: "engine",
    label: "기본 검색엔진",
    desc: "주소창에서 검색할 때 사용할 기본 엔진",
    type: "select",
    value: "goldfiredragon",
    options: [
      { value: "goldfiredragon", label: "🐉 GoldFireDragon (Google JP)" },
      { value: "presearch", label: "🔭 Presearch" },
      { value: "duckduckgo", label: "🦆 DuckDuckGo" },
      { value: "brave", label: "🦁 Brave Search" },
      { value: "bing", label: "🅱 Bing JP" },
    ],
    icon: "ri-search-line",
    category: "검색",
  },
  {
    id: "enableStealth",
    label: "FireDragon 스텔스 UA",
    desc: "navigator.userAgent를 FireDragon 스텔스 UA로 오버라이드",
    type: "toggle",
    value: true,
    icon: "ri-spy-line",
    category: "프라이버시",
  },
  {
    id: "enableTrackBlock",
    label: "URL 추적 파라미터 제거",
    desc: "UTM, fbclid, gclid 등 추적 매개변수를 URL에서 자동 제거",
    type: "toggle",
    value: true,
    icon: "ri-link-unlink",
    category: "프라이버시",
  },
  {
    id: "enableNewTab",
    label: "새 탭 페이지 커스텀",
    desc: "새 탭을 GoldFireDragon 다크 테마 검색 페이지로 대체",
    type: "toggle",
    value: true,
    icon: "ri-layout-2-line",
    category: "검색",
  },
  {
    id: "language",
    label: "검색 언어",
    desc: "검색 결과의 기본 언어 설정",
    type: "select",
    value: "ko",
    options: [
      { value: "ko", label: "한국어 (ko)" },
      { value: "ja", label: "일본어 (ja)" },
      { value: "en", label: "영어 (en)" },
      { value: "zh", label: "중국어 (zh)" },
    ],
    icon: "ri-translate-2",
    category: "검색",
  },
  {
    id: "region",
    label: "검색 지역",
    desc: "검색 결과의 기본 지역 설정 (gl 파라미터)",
    type: "select",
    value: "jp",
    options: [
      { value: "jp", label: "일본 (jp)" },
      { value: "kr", label: "한국 (kr)" },
      { value: "us", label: "미국 (us)" },
      { value: "uk", label: "영국 (uk)" },
    ],
    icon: "ri-earth-line",
    category: "검색",
  },
  {
    id: "safeSearch",
    label: "세이프서치",
    desc: "검색 결과 필터링 수준",
    type: "radio",
    value: "off",
    options: [
      { value: "off", label: "해제 (safe=off)" },
      { value: "moderate", label: "중간 (safe=moderate)" },
      { value: "strict", label: "엄격 (safe=strict)" },
    ],
    icon: "ri-shield-check-line",
    category: "프라이버시",
  },
  {
    id: "incognitoMode",
    label: "시크릿/사생활 보호 모드",
    desc: "시크릿 모드에서도 확장 프로그램 활성화",
    type: "toggle",
    value: false,
    icon: "ri-eye-off-line",
    category: "프라이버시",
  },
  {
    id: "contextMenu",
    label: "컨텍스트 메뉴",
    desc: "텍스트 선택 시 우클릭 메뉴에 GoldFireDragon 검색 추가",
    type: "toggle",
    value: true,
    icon: "ri-menu-2-line",
    category: "기능",
  },
  {
    id: "omnibox",
    label: "주소창 검색 (Omnibox)",
    desc: "주소창에서 'gfd' 입력 후 Tab으로 GoldFireDragon 검색",
    type: "toggle",
    value: true,
    icon: "ri-input-cursor-move",
    category: "기능",
  },
  {
    id: "keyboardShortcuts",
    label: "키보드 단축키",
    desc: "Alt+S: 검색창 포커스, Alt+H: 뒤로가기 등",
    type: "toggle",
    value: true,
    icon: "ri-keyboard-line",
    category: "기능",
  },
  {
    id: "darkMode",
    label: "다크 모드 UI",
    desc: "확장 프로그램 팝업과 옵션 페이지를 다크 테마로 표시",
    type: "toggle",
    value: true,
    icon: "ri-moon-line",
    category: "외관",
  },
  {
    id: "showToolbar",
    label: "페이지 툴바 표시",
    desc: "검색 페이지에 GoldFireDragon 플로팅 툴바 표시",
    type: "toggle",
    value: true,
    icon: "ri-layout-top-2-line",
    category: "외관",
  },
];

const CATEGORIES = [...new Set(DEFAULT_SETTINGS.map((s) => s.category))];

export default function ExtensionOptionsPage() {
  const [settings, setSettings] = useState<Setting[]>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState("검색");

  const updateSetting = (id: string, value: boolean | string) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaved(false);
  };

  const filtered = settings.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-500">
              <i className="ri-fire-line text-white text-sm" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">GoldFireDragon 설정</h1>
              <p className="text-xs text-gray-400">확장 프로그램 옵션</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
            >
              <i className="ri-refresh-line mr-1" />
              초기화
            </button>
            <button
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                saved ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-900 hover:bg-gray-700 text-white"
              }`}
            >
              <i className={saved ? "ri-check-line" : "ri-save-line"} />
              {saved ? "저장됨!" : "설정 저장"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-44 flex-shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                  activeCategory === cat
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={`${
                    cat === "검색" ? "ri-search-line" :
                    cat === "프라이버시" ? "ri-shield-line" :
                    cat === "기능" ? "ri-settings-3-line" :
                    "ri-palette-line"
                  } text-sm`} />
                </div>
                {cat}
              </button>
            ))}
          </div>

          {/* Quick links */}
          <div className="hidden lg:block mt-6 p-4 bg-white rounded-2xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-3">바로가기</p>
            <div className="space-y-2">
              <Link to="/extensions" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
                <i className="ri-puzzle-line" />확장 프로그램 관리자
              </Link>
              <Link to="/extension-popup" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
                <i className="ri-window-line" />팝업 UI 미리보기
              </Link>
              <Link to="/extension-newtab" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
                <i className="ri-layout-2-line" />새 탭 페이지
              </Link>
              <Link to="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
                <i className="ri-home-4-line" />홈으로
              </Link>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">{activeCategory}</h2>
            <span className="text-xs text-gray-400">{filtered.length}개 설정</span>
          </div>

          {filtered.map((setting) => (
            <div key={setting.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 flex-shrink-0">
                    <i className={`${setting.icon} text-gray-500 text-base`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{setting.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{setting.desc}</p>
                  </div>
                </div>

                {/* Control */}
                {setting.type === "toggle" && (
                  <button
                    onClick={() => updateSetting(setting.id, !setting.value)}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                      setting.value ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      setting.value ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                )}

                {setting.type === "select" && (
                  <select
                    value={setting.value as string}
                    onChange={(e) => updateSetting(setting.id, e.target.value)}
                    className="px-3 py-2 bg-gray-100 border border-transparent rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer flex-shrink-0"
                  >
                    {setting.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {setting.type === "radio" && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {setting.options?.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={setting.value === opt.value}
                          onChange={() => updateSetting(setting.id, opt.value)}
                          className="accent-gray-900"
                        />
                        <span className="text-xs text-gray-600">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
