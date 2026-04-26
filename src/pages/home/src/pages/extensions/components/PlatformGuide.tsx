import { useState } from "react";
import { buildExtensionZip } from "@/pages/extensions/utils/buildExtensionZip";

type PlatformId = "pc-chrome" | "pc-firefox" | "pc-edge" | "pc-brave" | "android-firefox" | "android-kiwi" | "local-crx" | "local-xpi";

interface PlatformConfig {
  id: PlatformId;
  label: string;
  sublabel: string;
  icon: string;
  iconColor: string;
  tag: string;
  tagColor: string;
  supported: boolean;
  steps: { n: number; title: string; desc: string; code?: string }[];
  notes: string[];
  downloadBtn?: { label: string; color: string };
  storeBtn?: { label: string; url: string; color: string };
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "pc-chrome",
    label: "Chrome (PC)",
    sublabel: "Windows / Mac / Linux",
    icon: "ri-chrome-line",
    iconColor: "text-gray-700",
    tag: "추천",
    tagColor: "bg-green-50 text-green-700 border-green-200",
    supported: true,
    storeBtn: { label: "Chrome 웹 스토어 열기", url: "https://chrome.google.com/webstore", color: "bg-[#1a73e8] hover:bg-[#1765cc]" },
    steps: [
      { n: 1, title: "Chrome 웹 스토어 방문", desc: "우측 \"Chrome 웹 스토어 열기\" 버튼 클릭", code: "https://chrome.google.com/webstore" },
      { n: 2, title: "\"Chrome에 추가\" 버튼 클릭", desc: "페이지 상단 파란 버튼을 클릭하세요" },
      { n: 3, title: "권한 확인", desc: "팝업에서 요청 권한 확인 후 \"확장 프로그램 추가\" 클릭" },
      { n: 4, title: "툴바 고정", desc: "퍼즐 아이콘(🧩) → GoldFireDragon 옆 고정 핀 클릭" },
      { n: 5, title: "기본 검색엔진 설정", desc: "Chrome 설정 → 검색엔진 → GoldFireDragon 선택", code: "chrome://settings/searchEngines" },
    ],
    notes: ["Manifest V3 지원", "자동 업데이트 포함", "Google 공식 검증 완료", "Brave · Opera · Yandex에서도 동일하게 작동"],
  },
  {
    id: "pc-firefox",
    label: "Firefox (PC)",
    sublabel: "Windows / Mac / Linux",
    icon: "ri-firefox-line",
    iconColor: "text-orange-500",
    tag: "추천",
    tagColor: "bg-orange-50 text-orange-700 border-orange-200",
    supported: true,
    storeBtn: { label: "Firefox AMO 열기", url: "https://addons.mozilla.org", color: "bg-orange-500 hover:bg-orange-600" },
    steps: [
      { n: 1, title: "Firefox 부가 기능 페이지 방문", desc: "우측 버튼으로 AMO(addons.mozilla.org) 이동", code: "https://addons.mozilla.org" },
      { n: 2, title: "\"Firefox에 추가\" 클릭", desc: "초록색 \"Firefox에 추가\" 버튼을 클릭하세요" },
      { n: 3, title: "권한 허용", desc: "팝업에서 \"추가\" 버튼 클릭으로 설치 완료" },
      { n: 4, title: "도구 모음에 고정", desc: "☰ 메뉴 → 확장 기능 및 테마 → 설정 아이콘 → \"도구 모음에 고정\"" },
      { n: 5, title: "기본 검색엔진 설정", desc: "설정 → 검색 → 기본 검색엔진 → GoldFireDragon", code: "about:preferences#search" },
    ],
    notes: ["Manifest V2 완전 지원 (MV3 부분 지원)", "Mozilla 공식 서명 검증", "자동 업데이트 포함", "시크릿 모드 허용 가능"],
  },
  {
    id: "pc-edge",
    label: "Edge (PC)",
    sublabel: "Windows 11/10 내장",
    icon: "ri-edge-line",
    iconColor: "text-blue-500",
    tag: "호환",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200",
    supported: true,
    storeBtn: { label: "Edge 애드온 스토어 열기", url: "https://microsoftedge.microsoft.com/addons", color: "bg-blue-600 hover:bg-blue-700" },
    steps: [
      { n: 1, title: "Edge 애드온 스토어 또는 Chrome 웹 스토어 방문", desc: "Edge는 두 스토어 모두 지원해요", code: "edge://extensions/" },
      { n: 2, title: "\"다른 스토어의 확장 허용\" 활성화", desc: "edge://extensions/ → 왼쪽 하단 \"다른 스토어의 확장 허용\" 토글 ON" },
      { n: 3, title: "Chrome 웹 스토어에서 설치", desc: "chrome.google.com/webstore 에서 직접 설치 가능" },
      { n: 4, title: "기본 검색엔진 설정", desc: "Edge 설정 → 개인 정보 검색 → 주소 표시줄에서 사용한 검색엔진 → GoldFireDragon", code: "edge://settings/searchEngines" },
    ],
    notes: ["Chrome CRX 완전 호환", "Edge 자체 스토어 + Chrome 스토어 모두 지원", "Manifest V3 지원", "Windows 11 내장 브라우저"],
  },
  {
    id: "pc-brave",
    label: "Brave (PC)",
    sublabel: "프라이버시 특화 브라우저",
    icon: "ri-shield-star-line",
    iconColor: "text-orange-500",
    tag: "호환",
    tagColor: "bg-orange-50 text-orange-700 border-orange-200",
    supported: true,
    storeBtn: { label: "Chrome 웹 스토어 열기", url: "https://chrome.google.com/webstore", color: "bg-orange-500 hover:bg-orange-600" },
    steps: [
      { n: 1, title: "Chrome 웹 스토어 방문", desc: "Brave는 Chrome Web Store를 그대로 지원해요" },
      { n: 2, title: "Chrome 설치와 동일", desc: "Chrome 웹 스토어에서 \"Chrome에 추가\" 클릭 → 동일하게 설치" },
      { n: 3, title: "기본 검색엔진 설정", desc: "Brave 설정 → 검색엔진 → GoldFireDragon 선택", code: "brave://settings/searchEngines" },
    ],
    notes: ["Chrome Web Store 완전 호환", "광고 차단 내장으로 이중 보호", "Manifest V3 지원", "Brave Shields와 병행 사용 가능"],
  },
  {
    id: "android-firefox",
    label: "Firefox for Android",
    sublabel: "Android 공식 지원",
    icon: "ri-firefox-line",
    iconColor: "text-orange-500",
    tag: "Android",
    tagColor: "bg-green-50 text-green-700 border-green-200",
    supported: true,
    storeBtn: { label: "Google Play에서 설치", url: "https://play.google.com/store/apps/details?id=org.mozilla.firefox", color: "bg-orange-500 hover:bg-orange-600" },
    steps: [
      { n: 1, title: "Firefox for Android 설치", desc: "Google Play에서 Firefox(Fenix)를 설치하세요" },
      { n: 2, title: "Firefox 실행 → 메뉴 → 부가 기능", desc: "앱 우측 하단 ⋮ 메뉴 → \"부가 기능\"" },
      { n: 3, title: "추천 컬렉션에서 설치", desc: "GoldFireDragon 검색 또는 AMO 링크로 직접 설치", code: "https://addons.mozilla.org/android" },
      { n: 4, title: "사용자 컬렉션 설정 (고급)", desc: "Firefox → about:config → xpinstall.signatures.required = false (Nightly만)" },
      { n: 5, title: "기본 검색엔진 설정", desc: "설정 → 검색 → 기본 검색엔진 → GoldFireDragon" },
    ],
    notes: ["Firefox Fenix(공식) + Nightly 지원", "AMO 공식 확장 프로그램만 설치 가능", "Firefox Nightly로 임의 확장 설치 가능", "한국어 완전 지원"],
  },
  {
    id: "android-kiwi",
    label: "Kiwi Browser (Android)",
    sublabel: "Chrome 확장 지원 Android 브라우저",
    icon: "ri-smartphone-line",
    iconColor: "text-green-600",
    tag: "Android 추천",
    tagColor: "bg-green-50 text-green-700 border-green-200",
    supported: true,
    storeBtn: { label: "Kiwi Browser 다운로드", url: "https://play.google.com/store/apps/details?id=com.kiwibrowser.browser", color: "bg-green-600 hover:bg-green-700" },
    steps: [
      { n: 1, title: "Kiwi Browser 설치", desc: "Google Play에서 Kiwi Browser를 설치하세요" },
      { n: 2, title: "Chrome 웹 스토어 접속", desc: "Kiwi에서 chrome.google.com/webstore 방문" },
      { n: 3, title: "\"Chrome에 추가\" 클릭", desc: "GoldFireDragon 확장 페이지에서 설치 버튼 클릭" },
      { n: 4, title: "로컬 CRX 설치 (대안)", desc: ".crx 파일 다운로드 후 파일 관리자에서 Kiwi로 열기", code: "kiwi://extensions/" },
      { n: 5, title: "기본 검색엔진 설정", desc: "Kiwi 설정 → 검색엔진 → GoldFireDragon 선택" },
    ],
    notes: ["Android에서 Chrome 확장을 지원하는 유일한 Chromium 브라우저", "Chrome 웹 스토어 직접 지원", ".crx 로컬 설치 지원", "Manifest V3 호환"],
  },
  {
    id: "local-crx",
    label: ".crx 로컬 설치",
    sublabel: "Chrome / Edge / Brave / Kiwi",
    icon: "ri-folder-download-line",
    iconColor: "text-gray-600",
    tag: "고급",
    tagColor: "bg-gray-100 text-gray-600 border-gray-200",
    supported: true,
    downloadBtn: { label: ".crx 파일 다운로드", color: "bg-gray-900 hover:bg-gray-700" },
    steps: [
      { n: 1, title: ".crx 파일 다운로드", desc: "아래 다운로드 버튼 클릭 또는 개발자가 제공한 파일 사용" },
      { n: 2, title: "chrome://extensions 열기", desc: "주소창에 입력 후 Enter", code: "chrome://extensions/" },
      { n: 3, title: "개발자 모드 ON", desc: "우측 상단 \"개발자 모드\" 토글 활성화" },
      { n: 4, title: ".crx 드래그 앤 드롭", desc: "다운로드한 .crx 파일을 확장 프로그램 관리 페이지에 드래그" },
      { n: 5, title: "설치 확인", desc: "팝업에서 \"확장 프로그램 추가\" 클릭 → 완료" },
    ],
    notes: [
      "Chrome 최신 버전은 드래그 설치 제한 가능 → \"압축 해제된 폴더 로드\" 사용",
      "Kiwi(Android): 파일 관리자에서 .crx 직접 열기 가능",
      "자동 업데이트 미지원 (수동 재설치 필요)",
      "개발/테스트 목적에 적합",
    ],
  },
  {
    id: "local-xpi",
    label: ".xpi 로컬 설치",
    sublabel: "Firefox (PC / Android)",
    icon: "ri-folder-download-line",
    iconColor: "text-orange-500",
    tag: "고급",
    tagColor: "bg-gray-100 text-gray-600 border-gray-200",
    supported: true,
    downloadBtn: { label: ".xpi 파일 다운로드", color: "bg-orange-500 hover:bg-orange-600" },
    steps: [
      { n: 1, title: ".xpi 파일 다운로드", desc: "아래 다운로드 버튼 클릭" },
      { n: 2, title: "about:config 열기 (선택)", desc: "Firefox Stable에서 서명 검사 비활성화 필요 시", code: "about:config" },
      { n: 3, title: "xpinstall.signatures.required → false", desc: "검색 후 더블클릭으로 false 설정 (Firefox ESR/Nightly 권장)" },
      { n: 4, title: "about:debugging 열기", desc: "주소창 입력 후 Enter", code: "about:debugging#/runtime/this-firefox" },
      { n: 5, title: "임시 부가 기능 로드", desc: "\"임시 부가 기능 로드...\" → .xpi 파일 선택 → 완료" },
    ],
    notes: [
      "Firefox Stable: 서명 필수 (공식 AMO 사용 권장)",
      "Firefox Developer Edition / Nightly: 서명 없이 설치 가능",
      "about:debugging 설치는 재시작 시 제거됨 (임시)",
      "영구 설치는 Firefox ESR + xpinstall.signatures.required=false",
    ],
  },
];

export default function PlatformGuide() {
  const [active, setActive] = useState<PlatformId>("pc-chrome");
  const [dlLoading, setDlLoading] = useState(false);
  const [dlDone, setDlDone] = useState(false);
  const current = PLATFORMS.find((p) => p.id === active)!

  const handleDownload = async () => {
    if (dlLoading) return;
    const type = active === "local-xpi" ? "mv2" : "mv3";
    setDlLoading(true);
    setDlDone(false);
    try {
      const blob = await buildExtensionZip(type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GoldFireDragon-v1.0.0-${type === "mv3" ? "chromium-mv3" : "firefox-mv2"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDlDone(true);
      setTimeout(() => setDlDone(false), 3000);
    } finally {
      setDlLoading(false);
    }
  };;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">플랫폼별 설치 가이드</h2>
        <p className="text-sm text-gray-400">PC, Android, 로컬 파일까지 모든 환경을 지원해요</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:w-52 flex-shrink-0 pb-2 lg:pb-0">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                active === p.id
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className={`${p.icon} text-base ${active === p.id ? "text-white" : p.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${active === p.id ? "text-white" : "text-gray-700"}`}>{p.label}</p>
                <p className={`text-xs truncate ${active === p.id ? "text-gray-300" : "text-gray-400"}`}>{p.sublabel}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 flex-shrink-0">
                  <i className={`${current.icon} ${current.iconColor} text-2xl`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900">{current.label}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${current.tagColor}`}>{current.tag}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{current.sublabel}</p>
                </div>
              </div>
              {current.storeBtn && (
                <a
                  href={current.storeBtn.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2.5 ${current.storeBtn.color} text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer flex-shrink-0`}
                >
                  <i className={current.icon} />
                  {current.storeBtn.label}
                </a>
              )}
              {current.downloadBtn && (
                <button
                  onClick={handleDownload}
                  disabled={dlLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 ${current.downloadBtn.color} text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer flex-shrink-0 disabled:opacity-60`}
                >
                  {dlLoading ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 생성 중...</>
                  ) : dlDone ? (
                    <><i className="ri-check-double-line" /> 다운로드 완료!</>
                  ) : (
                    <><i className="ri-download-line" /> {current.downloadBtn.label}</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Steps */}
          <div className="p-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="ri-list-ordered text-gray-400" />
              설치 단계
            </h4>
            <ol className="space-y-4 mb-6">
              {current.steps.map((step) => (
                <li key={step.n} className="flex items-start gap-4">
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {step.n}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-0.5">{step.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                    {step.code && (
                      <code className="inline-block mt-1.5 text-xs font-mono bg-gray-900 text-green-400 rounded-lg px-3 py-1.5">
                        {step.code}
                      </code>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {/* Notes */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h5 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <i className="ri-information-line text-gray-400" />
                참고 사항
              </h5>
              <ul className="space-y-1.5">
                {current.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ri-checkbox-circle-line text-green-500 text-xs" />
                    </div>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
