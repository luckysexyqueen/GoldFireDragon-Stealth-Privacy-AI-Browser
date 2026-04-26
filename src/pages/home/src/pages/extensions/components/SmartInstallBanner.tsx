import { useState } from "react";
import { usePlatform } from "@/hooks/usePlatform";

const BROWSER_ICONS: Record<string, string> = {
  chrome: "ri-chrome-line", firefox: "ri-firefox-line", edge: "ri-edge-line",
  brave: "ri-shield-star-line", opera: "ri-opera-line", kiwi: "ri-smartphone-line",
  samsung: "ri-smartphone-line", yandex: "ri-global-line", safari: "ri-safari-line", unknown: "ri-globe-line",
};

const PLATFORM_ICONS: Record<string, string> = {
  windows: "ri-windows-line", mac: "ri-apple-line", linux: "ri-ubuntu-line",
  android: "ri-android-line", ios: "ri-apple-line", unknown: "ri-device-line",
};

export default function SmartInstallBanner() {
  const platform = usePlatform();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const browserIcon = BROWSER_ICONS[platform.browser] ?? "ri-global-line";
  const platformIcon = PLATFORM_ICONS[platform.platform] ?? "ri-device-line";

  const statusColor = platform.supportsExtensions
    ? "from-green-50 to-emerald-50 border-green-200"
    : "from-amber-50 to-yellow-50 border-amber-200";

  const statusDot = platform.supportsExtensions ? "bg-green-400" : "bg-amber-400";

  return (
    <div className={`bg-gradient-to-r ${statusColor} border rounded-2xl p-5 mb-6 relative`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 cursor-pointer transition-colors text-gray-400"
      >
        <i className="ri-close-line text-sm" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Detected env */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-white/80 shadow-sm">
              <i className={`${browserIcon} text-gray-700 text-2xl`} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-gray-100">
              <i className={`${platformIcon} text-gray-500 text-xs`} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className={`w-2 h-2 rounded-full ${statusDot} flex-shrink-0`} />
              <span className="text-xs font-semibold text-gray-700">현재 환경 감지됨</span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {platform.browserLabel}
              {platform.browserVersion && (
                <span className="text-xs font-normal text-gray-400 ml-1">v{platform.browserVersion.split(".")[0]}</span>
              )}
            </p>
            <p className="text-xs text-gray-500">{platform.platformLabel}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 bg-black/10 mx-1" />

        {/* Recommendation */}
        <div className="flex-1">
          {platform.supportsExtensions ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <i className="ri-checkbox-circle-fill text-green-500 text-sm" />
                <span className="text-xs font-semibold text-green-700">이 환경에서 확장 프로그램을 지원해요!</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{platform.installNote}</p>
              {platform.manifestVersion && (
                <span className="inline-block mt-1.5 text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">
                  Manifest V{platform.manifestVersion}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <i className="ri-error-warning-fill text-amber-500 text-sm" />
                <span className="text-xs font-semibold text-amber-700">이 브라우저는 확장을 지원하지 않아요</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{platform.installNote}</p>
            </>
          )}
        </div>

        {/* CTA Button */}
        {platform.storeUrl && (
          <a
            href={platform.storeUrl}
            target={platform.storeUrl.startsWith("http") ? "_blank" : undefined}
            rel="nofollow noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white transition-colors whitespace-nowrap cursor-pointer flex-shrink-0 ${
              platform.supportsExtensions
                ? "bg-gray-900 hover:bg-gray-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            <i className={browserIcon} />
            {platform.supportsExtensions ? `${platform.storeName}에서 설치` : `${platform.storeName} 설치하기`}
          </a>
        )}
      </div>

      {/* Extra: alternate browsers */}
      {platform.isAndroid && !platform.isFirefox && !platform.isKiwi && (
        <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-400">Android에서 확장 프로그램 사용하려면:</span>
          <a
            href="https://play.google.com/store/apps/details?id=com.kiwibrowser.browser"
            target="_blank" rel="nofollow noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-gray-300 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-smartphone-line text-sm" />Kiwi Browser
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=org.mozilla.firefox"
            target="_blank" rel="nofollow noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-gray-300 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-firefox-line text-orange-400 text-sm" />Firefox for Android
          </a>
        </div>
      )}
    </div>
  );
}
