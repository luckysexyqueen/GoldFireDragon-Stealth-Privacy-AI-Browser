import { useState } from "react";
import { Link } from "react-router-dom";
import { usePlatform } from "@/hooks/usePlatform";

export default function ExtensionBanner() {
  const platform = usePlatform();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-700 cursor-pointer transition-all"
        title="확장 프로그램"
      >
        <i className="ri-puzzle-line text-lg" />
      </button>
    );
  }

  const isSupported = platform.supportsExtensions;

  return (
    <div className="fixed bottom-24 right-4 z-40 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-500">
            <i className="ri-fire-line text-white text-xs" />
          </div>
          <span className="text-xs font-semibold text-white">GoldFireDragon</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(true)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer transition-colors text-white/70"
          >
            <i className="ri-subtract-line text-xs" />
          </button>
          <Link
            to="/extensions"
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer transition-colors text-white/70"
          >
            <i className="ri-arrow-right-up-line text-xs" />
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Detected env */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100">
            <i className={`${platform.isChrome ? "ri-chrome-line" : platform.isFirefox ? "ri-firefox-line" : "ri-global-line"} text-gray-600 text-sm`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{platform.browserLabel}</p>
            <p className="text-xs text-gray-400">{platform.platformLabel}</p>
          </div>
          <div className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${isSupported ? "bg-green-400" : "bg-amber-400"}`} />
        </div>

        {/* Status */}
        {isSupported ? (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <i className="ri-checkbox-circle-fill text-green-500 text-xs" />
              <span className="text-xs font-medium text-green-700">확장 프로그램 지원됨</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{platform.installNote}</p>
          </div>
        ) : (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <i className="ri-error-warning-fill text-amber-500 text-xs" />
              <span className="text-xs font-medium text-amber-700">확장 미지원 브라우저</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{platform.installNote}</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="space-y-2">
          {isSupported && platform.storeUrl && (
            <a
              href={platform.storeUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <i className="ri-download-line" />
              {platform.storeName}에서 설치
            </a>
          )}
          <Link
            to="/extensions"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <i className="ri-puzzle-line" />
            확장 프로그램 관리자
          </Link>
          <Link
            to="/extensions"
            state={{ tab: "source" }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 rounded-xl text-xs transition-colors cursor-pointer"
          >
            <i className="ri-code-s-slash-line" />
            소스 코드 보기
          </Link>
        </div>

        {/* Android alternatives */}
        {platform.isAndroid && !platform.isFirefox && !platform.isKiwi && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Android에서 확장 사용하려면:</p>
            <div className="flex gap-2">
              <a
                href="https://play.google.com/store/apps/details?id=com.kiwibrowser.browser"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-green-50 border border-green-100 text-green-600 rounded-lg text-xs cursor-pointer"
              >
                <i className="ri-smartphone-line" />Kiwi
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=org.mozilla.firefox"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-orange-50 border border-orange-100 text-orange-600 rounded-lg text-xs cursor-pointer"
              >
                <i className="ri-firefox-line" />Firefox
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
