import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';

/**
 * Global PWA Install Prompt Banner
 * — Shows native install prompt on Android/Desktop Chrome|Edge
 * — Shows manual instructions for iOS Safari
 * — Respects 7-day dismiss cooldown
 */
export default function PWAInstallPrompt() {
  const { canInstall, isIOS, isInstalled, platform, swRegistered, triggerInstall, dismiss } = usePWA();
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Don't show if already installed
  if (isInstalled) return null;
  // Don't show if nothing to prompt and not iOS
  if (!canInstall && !isIOS) return null;
  // Don't show if done
  if (done) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const outcome = await triggerInstall();
    setInstalling(false);
    if (outcome === 'accepted') {
      setDone(true);
    }
  };

  const platformLabel =
    platform === 'android-chrome' ? 'Android'
    : platform === 'ios-safari'   ? 'iPhone/iPad'
    : platform === 'desktop-edge' ? 'Edge'
    : 'Chrome';

  // iOS Safari instruction modal
  if (isIOS && showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm bg-[#111] border border-white/15 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-red-500 flex-shrink-0">
                <i className="ri-fire-line text-white text-sm" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">홈 화면에 추가</p>
                <p className="text-xs text-gray-500">GoldFireDragon</p>
              </div>
            </div>
            <button onClick={() => { setShowIOSGuide(false); dismiss(); }} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 cursor-pointer">
              <i className="ri-close-line text-base" />
            </button>
          </div>

          {/* Steps */}
          <div className="p-5 space-y-4">
            {[
              { n: 1, icon: 'ri-share-forward-line', iconBg: 'bg-blue-500/20 text-blue-400', title: '하단 공유 버튼 탭', desc: '화면 하단 Safari 공유 버튼(□↑)을 탭하세요' },
              { n: 2, icon: 'ri-add-box-line', iconBg: 'bg-green-500/20 text-green-400', title: '"홈 화면에 추가" 선택', desc: '스크롤해서 "홈 화면에 추가" 메뉴를 찾아 탭하세요' },
              { n: 3, icon: 'ri-check-line', iconBg: 'bg-yellow-500/20 text-yellow-400', title: '"추가" 탭', desc: '우측 상단 "추가"를 탭하면 완료!' },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <div className={`w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 ${step.iconBg}`}>
                  <i className={`${step.icon} text-base`} />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <p className="text-xs text-gray-600 text-center">
              앱처럼 실행되고 오프라인에서도 사용 가능해요
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 sm:w-[340px] z-[9998]">
      <div className="bg-[#111] border border-white/15 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Top accent line */}
        <div className="h-0.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              {/* App icon from SW-generated PNG */}
              <img
                src="/pwa/icon-72.png"
                alt="GoldFireDragon"
                width={44}
                height={44}
                className="rounded-xl flex-shrink-0"
                onError={(e) => {
                  // fallback to gradient div if icon not loaded yet
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fb = target.nextElementSibling as HTMLElement;
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400 to-red-500 flex-shrink-0 items-center justify-center"
                style={{ display: 'none' }}
              >
                <i className="ri-fire-line text-white text-xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">GoldFireDragon</p>
                <p className="text-xs text-gray-500">앱으로 설치 — {platformLabel}</p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors cursor-pointer flex-shrink-0 mt-0.5"
              aria-label="닫기"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>

          {/* Features */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {[
              { icon: 'ri-wifi-off-line', label: '오프라인 지원' },
              { icon: 'ri-speed-up-line', label: '앱 속도' },
              { icon: 'ri-notification-line', label: '알림' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className={`${f.icon} text-yellow-500 text-xs`} />
                </div>
                {f.label}
              </div>
            ))}
          </div>

          {/* SW status badge */}
          {swRegistered && (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-green-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              서비스 워커 등록됨 — 오프라인 준비 완료
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {isIOS ? (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap transition-opacity hover:opacity-90"
              >
                <i className="ri-add-box-line text-sm" />
                홈 화면에 추가 방법
              </button>
            ) : (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {installing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    설치 중...
                  </>
                ) : (
                  <>
                    <i className="ri-download-2-line text-sm" />
                    앱으로 설치
                  </>
                )}
              </button>
            )}
            <button
              onClick={dismiss}
              className="px-3 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 rounded-xl text-xs cursor-pointer whitespace-nowrap transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
