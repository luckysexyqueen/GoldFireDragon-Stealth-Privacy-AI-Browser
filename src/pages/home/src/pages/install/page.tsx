import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const APK_SERVICES = [
  {
    name: "AppsGeyser",
    badge: "무료",
    badgeColor: "bg-green-500",
    icon: "ri-android-line",
    desc: "완전 무료, 회원가입 없이 5분 만에 APK 생성",
    url: "https://appsgeyser.com/create/WebsiteApp/",
    steps: ["사이트 접속 → 'Website App' 선택", "URL 붙여넣기 → 앱 이름 입력", "아이콘 설정 → 'Create' 클릭", "APK 직접 다운로드 (즉시)"],
    highlight: true,
  },
  {
    name: "WebViewGold",
    badge: "유료",
    badgeColor: "bg-yellow-500",
    icon: "ri-shield-star-line",
    desc: "전문가급 WebView APK, 광고 없음, 커스텀 UA 지원",
    url: "https://webviewgold.com/",
    steps: ["구매 후 템플릿 다운로드", "URL + 설정 입력", "온라인 빌더로 APK 생성", "Google Play 배포 가능"],
    highlight: false,
  },
  {
    name: "Gonative.io",
    badge: "무료체험",
    badgeColor: "bg-blue-500",
    icon: "ri-smartphone-line",
    desc: "iOS + Android 동시 생성, 푸시 알림 지원",
    url: "https://gonative.io/",
    steps: ["URL 입력 → Preview 확인", "앱 이름 + 아이콘 설정", "Build 클릭 (이메일로 전송)", "APK + IPA 동시 수령"],
    highlight: false,
  },
  {
    name: "WebIntoApp",
    badge: "무료",
    badgeColor: "bg-green-500",
    icon: "ri-code-box-line",
    desc: "간단한 무료 변환, 광고 포함 버전 즉시 다운로드",
    url: "https://www.webintoapp.com/",
    steps: ["URL 붙여넣기", "앱 이름 + 패키지명 설정", "Generate APK 클릭", "이메일 or 직접 다운로드"],
    highlight: false,
  },
];

export default function InstallPage() {
  const [appUrl, setAppUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const qrUrl = appUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(appUrl)}&bgcolor=1a1a1a&color=f0c040&margin=10`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-sm border-b border-yellow-900/30 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer">
          <i className="ri-arrow-left-line text-white text-lg" />
        </Link>
        <div className="w-6 h-6 flex items-center justify-center">
          <i className="ri-android-line text-green-400 text-xl" />
        </div>
        <h1 className="font-bold text-white text-base">Android APK 변환</h1>
        <span className="ml-auto text-xs text-yellow-400/70 bg-yellow-900/30 px-2 py-1 rounded-full whitespace-nowrap">URL → APK</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Hero + QR */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1400] to-[#0d0d0d] border border-yellow-700/30 p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* QR Code */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            {qrUrl && (
              <div className="w-[120px] h-[120px] rounded-xl overflow-hidden border-2 border-yellow-600/40 bg-[#1a1a1a] flex items-center justify-center">
                <img
                  src={qrUrl}
                  alt="앱 URL QR코드"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <span className="text-xs text-white/50">QR 스캔</span>
          </div>

          {/* URL + Info */}
          <div className="flex-1 flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-fire-line text-yellow-400 text-sm" />
                </div>
                <span className="text-xs text-yellow-400 font-semibold tracking-wide uppercase">GoldFireDragonBrowser</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                아래 URL을 복사해서 APK 변환 서비스에 붙여넣으면<br />
                <strong className="text-yellow-300">5분 안에 Android 앱</strong>으로 만들 수 있어요!
              </p>
            </div>

            {/* URL Copy Box */}
            <div className="flex items-center gap-2 bg-[#111] border border-yellow-800/40 rounded-xl px-3 py-2">
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                <i className="ri-links-line text-yellow-500 text-sm" />
              </div>
              <span className="flex-1 text-xs text-yellow-200 font-mono truncate">{appUrl}</span>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold cursor-pointer whitespace-nowrap transition-all"
              >
                <div className="w-3 h-3 flex items-center justify-center">
                  <i className={`text-xs ${copied ? "ri-check-line" : "ri-clipboard-line"}`} />
                </div>
                {copied ? "복사됨!" : "복사"}
              </button>
            </div>

            {/* WebView tips */}
            <div className="flex flex-wrap gap-2">
              {["JavaScript 활성화 필요", "쿠키 허용 권장", "외부 링크 새탭 열기"].map((tip) => (
                <span key={tip} className="text-xs bg-white/5 border border-white/10 text-white/50 px-2 py-1 rounded-full">{tip}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Service Cards */}
        <div>
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4">변환 서비스 선택</h2>
          <div className="space-y-3">
            {APK_SERVICES.map((svc, idx) => (
              <div
                key={svc.name}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  svc.highlight
                    ? "border-yellow-600/50 bg-gradient-to-r from-[#1a1200] to-[#0f0f0f]"
                    : "border-white/10 bg-[#111]"
                }`}
              >
                <button
                  onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                  className="w-full flex items-center gap-4 p-4 cursor-pointer text-left"
                >
                  <div className={`w-11 h-11 flex items-center justify-center rounded-xl ${
                    svc.highlight ? "bg-yellow-600/20 border border-yellow-600/40" : "bg-white/5 border border-white/10"
                  }`}>
                    <i className={`${svc.icon} text-xl ${svc.highlight ? "text-yellow-400" : "text-white/60"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-sm ${svc.highlight ? "text-yellow-300" : "text-white"}`}>
                        {svc.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${svc.badgeColor}`}>
                        {svc.badge}
                      </span>
                      {svc.highlight && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-black bg-yellow-400">추천</span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 leading-snug">{svc.desc}</p>
                  </div>

                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <i className={`ri-arrow-down-s-line text-white/40 text-lg transition-transform duration-200 ${activeStep === idx ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {activeStep === idx && (
                  <div className="px-4 pb-4 border-t border-white/5">
                    <div className="pt-3 space-y-2 mb-4">
                      {svc.steps.map((step, si) => (
                        <div key={si} className="flex items-start gap-3">
                          <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                            svc.highlight ? "bg-yellow-600 text-black" : "bg-white/10 text-white/60"
                          }`}>
                            {si + 1}
                          </span>
                          <span className="text-xs text-white/70 pt-0.5">{step}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href={svc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold cursor-pointer whitespace-nowrap transition-all ${
                        svc.highlight
                          ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-external-link-line text-sm" />
                      </div>
                      {svc.name} 바로 가기
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* WebView Settings Guide */}
        <div className="rounded-2xl bg-[#0f1a0f] border border-green-900/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 flex items-center justify-center">
              <i className="ri-settings-3-line text-green-400 text-lg" />
            </div>
            <h3 className="font-bold text-green-300 text-sm">APK 변환 시 WebView 권장 설정</h3>
          </div>
          <div className="space-y-3">
            {[
              { icon: "ri-javascript-line", label: "JavaScript 활성화", val: "필수 ON" },
              { icon: "ri-database-2-line", label: "쿠키 허용", val: "허용" },
              { icon: "ri-external-link-line", label: "외부 링크 처리", val: "새 탭 / 기본 브라우저" },
              { icon: "ri-zoom-in-line", label: "줌 허용", val: "OFF (고정)" },
              { icon: "ri-smartphone-line", label: "User Agent", val: "모바일 UA 유지" },
              { icon: "ri-lock-line", label: "HTTPS 허용", val: "Mixed Content 허용 OFF" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={`${item.icon} text-green-400/70 text-sm`} />
                  </div>
                  <span className="text-xs text-white/60">{item.label}</span>
                </div>
                <span className="text-xs font-mono text-green-300 bg-green-900/30 px-2 py-0.5 rounded-full">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back button */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-yellow-700/30 text-yellow-400 hover:bg-yellow-900/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-home-4-line text-lg" />
          </div>
          <span className="text-sm font-medium">홈으로 돌아가기</span>
        </Link>
      </div>
    </div>
  );
}
