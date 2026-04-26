import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ZipDownloader from "@/pages/extensions/components/ZipDownloader";

const FEATURES = [
  {
    icon: "ri-spy-line",
    title: "FireDragon 스텔스 UA",
    desc: "navigator.userAgent를 FireDragon 스텔스 UA로 오버라이드하여 추적을 방지합니다.",
    color: "from-red-500 to-orange-500",
    bg: "bg-red-50",
    border: "border-red-100",
    text: "text-red-700",
  },
  {
    icon: "ri-link-unlink",
    title: "URL 추적 파라미터 제거",
    desc: "UTM, fbclid, gclid 등 추적 매개변수를 URL에서 자동으로 제거합니다.",
    color: "from-green-500 to-teal-500",
    bg: "bg-green-50",
    border: "border-green-100",
    text: "text-green-700",
  },
  {
    icon: "ri-search-line",
    title: "5가지 검색엔진",
    desc: "GoldFireDragon, Presearch, DuckDuckGo, Brave Search, Bing을 빠르게 전환합니다.",
    color: "from-yellow-500 to-amber-500",
    bg: "bg-yellow-50",
    border: "border-yellow-100",
    text: "text-yellow-700",
  },
  {
    icon: "ri-layout-2-line",
    title: "커스텀 새 탭 페이지",
    desc: "다크 테마 시계, 검색, 단축키, 최근 방문이 있는 아름다운 새 탭을 제공합니다.",
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
    border: "border-purple-100",
    text: "text-purple-700",
  },
  {
    icon: "ri-keyboard-line",
    title: "키보드 단축키",
    desc: "Alt+S로 검색창 포커스, Alt+H로 뒤로가기 등 키보드만으로 빠르게 탐색합니다.",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-700",
  },
  {
    icon: "ri-shield-check-line",
    title: "크로스브라우저 호환",
    desc: "Chrome, Firefox, Edge, Brave, Kiwi, Opera, Vivaldi, Yandex 등 전부 지원합니다.",
    color: "from-gray-600 to-gray-800",
    bg: "bg-gray-50",
    border: "border-gray-100",
    text: "text-gray-700",
  },
];

const STEPS = [
  {
    n: 1,
    icon: "ri-settings-3-line",
    title: "설정 확인",
    desc: "기본 검색엔진, 언어, 지역, 프라이버시 설정을 확인하고 조정하세요.",
    action: { label: "옵션 페이지 열기", to: "/extension-options", icon: "ri-arrow-right-line" },
  },
  {
    n: 2,
    icon: "ri-layout-2-line",
    title: "새 탭 페이지 체험",
    desc: "아름다운 다크 테마 새 탭 페이지로 브라우저를 새롭게 꾸며보세요.",
    action: { label: "새 탭 페이지 보기", to: "/extension-newtab", icon: "ri-arrow-right-line" },
  },
  {
    n: 3,
    icon: "ri-window-line",
    title: "팝업 UI 확인",
    desc: "툴바 아이콘을 클릭해 팝업에서 검색엔진을 전환하고 기능을 켜고 끄세요.",
    action: { label: "팝업 UI 미리보기", to: "/extension-popup", icon: "ri-arrow-right-line" },
  },
  {
    n: 4,
    icon: "ri-puzzle-line",
    title: "확장 프로그램 관리",
    desc: "스토어, 유저스크립트, 호환성 매트릭스, 소스 코드까지 모두 탐색해보세요.",
    action: { label: "관리자 열기", to: "/extensions", icon: "ri-arrow-right-line" },
  },
];

const SHORTCUTS = [
  { keys: ["Alt", "S"], desc: "검색창 포커스" },
  { keys: ["Alt", "H"], desc: "뒤로가기" },
  { keys: ["Ctrl", "Shift", "G"], desc: "GoldFireDragon 팝업 열기" },
  { keys: ["Ctrl", "L"], desc: "주소창 포커스 (브라우저 기본)" },
];

const BROWSERS = [
  { icon: "ri-chrome-line", label: "Chrome", color: "text-gray-600" },
  { icon: "ri-firefox-line", label: "Firefox", color: "text-orange-500" },
  { icon: "ri-edge-line", label: "Edge", color: "text-blue-500" },
  { icon: "ri-shield-star-line", label: "Brave", color: "text-orange-400" },
  { icon: "ri-opera-line", label: "Opera", color: "text-red-500" },
  { icon: "ri-smartphone-line", label: "Kiwi", color: "text-green-500" },
];

export default function ExtensionWelcomePage() {
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    // Staggered animation for features
    FEATURES.forEach((_, i) => {
      setTimeout(() => {
        setVisibleFeatures((prev) => [...prev, i]);
      }, 200 + i * 120);
    });
    // Staggered animation for steps
    STEPS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleSteps((prev) => [...prev, i]);
      }, 800 + i * 150);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Inter',sans-serif]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-yellow-500/20 via-red-500/10 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          {/* Success badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-xs text-green-400 font-medium mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            설치 완료
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-red-500 shadow-lg shadow-yellow-500/20">
              <i className="ri-fire-line text-white text-2xl" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            GoldFireDragon
            <span className="block text-lg sm:text-xl font-normal text-gray-400 mt-1">확장 프로그램이 설치되었어요!</span>
          </h1>

          <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed mb-8">
            FireDragon 스텔스 UA, 추적 차단, 5가지 검색엔진, 커스텀 새 탭 페이지까지.<br />
            지금 바로 GoldFireDragon의 강력한 기능을 경험해보세요.
          </p>

          {/* Browser badges */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
            {BROWSERS.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={`${b.icon} ${b.color} text-sm`} />
                </div>
                <span className="text-xs text-gray-400">{b.label}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/extension-options"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl text-sm font-medium hover:opacity-90 cursor-pointer whitespace-nowrap transition-opacity shadow-lg shadow-yellow-500/20"
            >
              <i className="ri-settings-3-line" />
              설정 시작하기
            </Link>
            <Link
              to="/extension-newtab"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/20 cursor-pointer whitespace-nowrap transition-colors"
            >
              <i className="ri-layout-2-line" />
              새 탭 페이지 보기
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold mb-2">주요 기능</h2>
          <p className="text-sm text-gray-500">GoldFireDragon이 제공하는 6가지 핵심 기능</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`p-5 rounded-2xl border transition-all duration-500 ${f.bg} ${f.border} ${
                visibleFeatures.includes(i)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-3`}>
                <i className={`${f.icon} text-white text-lg`} />
              </div>
              <h3 className={`text-sm font-semibold ${f.text} mb-1`}>{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick start steps */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold mb-2">빠른 시작</h2>
          <p className="text-sm text-gray-500">4단계로 GoldFireDragon을 완벽하게 설정하세요</p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`flex items-start gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl transition-all duration-500 hover:border-white/20 ${
                visibleSteps.includes(i)
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4"
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-red-500 flex-shrink-0">
                <i className={`${step.icon} text-white text-base`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-yellow-400">Step {step.n}</span>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{step.desc}</p>
                <Link
                  to={step.action.to}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                >
                  {step.action.label}
                  <i className={`${step.action.icon} text-xs`} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold mb-2">키보드 단축키</h2>
          <p className="text-sm text-gray-500">키보드만으로 빠르게 탐색하는 방법</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHORTCUTS.map((s) => (
            <div key={s.desc} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-1 flex-shrink-0">
                {s.keys.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    {i > 0 && <span className="text-xs text-gray-600">+</span>}
                    <kbd className="bg-white/10 border border-white/20 rounded-md px-2 py-1 text-xs font-mono text-gray-300">{k}</kbd>
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="p-6 bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/20 rounded-2xl">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <i className="ri-lightbulb-line" />
            Pro 팁
          </h3>
          <ul className="space-y-2">
            {[
              "주소창에 'gfd' 입력 후 Tab을 누르면 GoldFireDragon 검색 모드로 전환됩니다.",
              "텍스트를 선택하고 우클릭하면 'GoldFireDragon로 검색' 메뉴가 나타납니다.",
              "설정에서 시크릿 모드를 허용하면 사생활 보호 창에서도 확장이 작동합니다.",
              "새 탭 페이지의 배경 이미지는 설정 패널에서 3가지 중 선택하거나 끌 수 있습니다.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-check-line text-yellow-500 text-xs" />
                </div>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Download section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-2">.zip 패키지 다운로드</h2>
          <p className="text-sm text-gray-500">로컬에서 바로 설치하거나 개발 · 배포용으로 사용하세요</p>
        </div>
        <ZipDownloader />
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-sm text-gray-500 mb-4">모든 설정이 끝났나요? 이제 GoldFireDragon으로 검색해보세요!</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl text-sm font-medium hover:opacity-90 cursor-pointer whitespace-nowrap transition-opacity"
          >
            <i className="ri-home-4-line" />
            홈으로 이동
          </Link>
          <Link
            to="/extensions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/20 cursor-pointer whitespace-nowrap transition-colors"
          >
            <i className="ri-puzzle-line" />
            확장 관리자
          </Link>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 py-6 text-center">
        <p className="text-xs text-gray-600">
          GoldFireDragon v1.0.0 · <Link to="/extensions" className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">확장 프로그램 관리자</Link>
        </p>
      </div>
    </div>
  );
}
