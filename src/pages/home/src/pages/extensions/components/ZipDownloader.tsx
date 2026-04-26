import { useState } from "react";
import { buildExtensionZip, type BuildType } from "@/pages/extensions/utils/buildExtensionZip";

type PackageOption = {
  id: BuildType;
  label: string;
  sublabel: string;
  ext: string;
  icon: string;
  iconColor: string;
  accentColor: string;
  borderColor: string;
  browsers: string[];
  badgeColor: string;
  badge: string;
};

const PACKAGES: PackageOption[] = [
  {
    id: "mv3",
    label: "Chrome / Edge / Brave",
    sublabel: "Manifest V3 패키지",
    ext: ".zip (Chromium)",
    icon: "ri-chrome-line",
    iconColor: "text-gray-700",
    accentColor: "bg-gray-900 hover:bg-gray-700",
    borderColor: "border-gray-200 hover:border-gray-400",
    browsers: ["Chrome", "Edge", "Brave", "Opera", "Kiwi", "Vivaldi"],
    badgeColor: "bg-green-50 text-green-700 border-green-200",
    badge: "MV3",
  },
  {
    id: "mv2",
    label: "Firefox",
    sublabel: "Manifest V2 패키지",
    ext: ".zip (Firefox / XPI)",
    icon: "ri-firefox-line",
    iconColor: "text-orange-500",
    accentColor: "bg-orange-500 hover:bg-orange-600",
    borderColor: "border-orange-100 hover:border-orange-300",
    browsers: ["Firefox PC", "Firefox Android", "Firefox ESR", "Firefox Nightly"],
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    badge: "MV2",
  },
];

interface ZipDownloaderProps {
  compact?: boolean;
}

export default function ZipDownloader({ compact = false }: ZipDownloaderProps) {
  const [loading, setLoading] = useState<BuildType | null>(null);
  const [done, setDone] = useState<BuildType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (pkg: PackageOption) => {
    if (loading) return;
    setLoading(pkg.id);
    setError(null);
    setDone(null);
    try {
      const blob = await buildExtensionZip(pkg.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GoldFireDragon-v1.0.0-${pkg.id === "mv3" ? "chromium-mv3" : "firefox-mv2"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(pkg.id);
      setTimeout(() => setDone(null), 3000);
    } catch (err) {
      setError("다운로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(null);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => handleDownload(pkg)}
            disabled={!!loading}
            className={`inline-flex items-center gap-2 px-4 py-2 ${pkg.accentColor} text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60`}
          >
            {loading === pkg.id ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                생성 중...
              </>
            ) : done === pkg.id ? (
              <>
                <i className="ri-check-line text-sm" />
                다운로드 완료!
              </>
            ) : (
              <>
                <i className={`${pkg.icon} text-sm`} />
                {pkg.id === "mv3" ? ".zip (Chrome)" : ".zip (Firefox)"}
              </>
            )}
          </button>
        ))}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-900">
              <i className="ri-folder-zip-line text-white text-sm" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">.zip 패키지 다운로드</h3>
          </div>
          <p className="text-xs text-gray-400 ml-10">
            소스 코드를 .zip으로 패키징하여 로컬에서 바로 설치하거나 배포할 수 있어요.
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-500">
            <i className="ri-award-line text-yellow-500" />
            v1.0.0
          </span>
        </div>
      </div>

      {/* Package cards */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`border rounded-xl p-4 transition-colors ${pkg.borderColor}`}
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 flex-shrink-0">
                  <i className={`${pkg.icon} ${pkg.iconColor} text-lg`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-gray-800">{pkg.label}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${pkg.badgeColor}`}>
                      {pkg.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{pkg.sublabel}</p>
                </div>
              </div>
            </div>

            {/* Supported browsers */}
            <div className="flex flex-wrap gap-1 mb-4">
              {pkg.browsers.map((b) => (
                <span key={b} className="text-xs px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-gray-500">
                  {b}
                </span>
              ))}
            </div>

            {/* File info row */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 bg-gray-50 rounded-lg px-3 py-2">
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                <i className="ri-file-zip-line text-gray-400" />
              </div>
              <span className="font-mono">GoldFireDragon-v1.0.0-{pkg.id === "mv3" ? "chromium-mv3" : "firefox-mv2"}.zip</span>
            </div>

            {/* Download button */}
            <button
              onClick={() => handleDownload(pkg)}
              disabled={!!loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 ${pkg.accentColor} text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60`}
            >
              {loading === pkg.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  패키지 생성 중...
                </>
              ) : done === pkg.id ? (
                <>
                  <i className="ri-check-double-line text-sm" />
                  다운로드 완료!
                </>
              ) : (
                <>
                  <i className="ri-download-2-line text-sm" />
                  {pkg.ext} 다운로드
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Contents list */}
      <div className="px-5 pb-5">
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
            <i className="ri-folder-open-line" />
            패키지 포함 파일
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {[
              { file: "manifest.json",           desc: "확장 매니페스트 (MV3/MV2)" },
              { file: "background.js",            desc: "서비스 워커 / 백그라운드" },
              { file: "content.js",               desc: "스텔스 UA + 추적 차단" },
              { file: "popup/popup.html",         desc: "툴바 팝업 UI" },
              { file: "popup/popup.js",           desc: "팝업 검색 · 엔진 전환" },
              { file: "options/options.html",     desc: "설정 페이지" },
              { file: "options/options.js",       desc: "설정 저장 로직" },
              { file: "newtab/newtab.html",       desc: "새 탭 페이지" },
              { file: "icons/*.png",              desc: "16 / 32 / 48 / 128px 아이콘" },
              { file: "README.md",                desc: "설치 가이드 문서" },
            ].map((row) => (
              <div key={row.file} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                  <i className="ri-check-line text-green-400 text-xs" />
                </div>
                <code className="text-yellow-400 font-mono">{row.file}</code>
                <span className="text-gray-500">{row.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
          <i className="ri-error-warning-line mr-1" />
          {error}
        </div>
      )}

      {/* Note */}
      <div className="px-5 pb-5">
        <p className="text-xs text-gray-400 flex items-start gap-1.5">
          <i className="ri-information-line flex-shrink-0 mt-0.5" />
          압축 해제 후 브라우저 개발자 모드에서 &ldquo;압축 해제된 확장 프로그램 로드&rdquo;로 설치하거나,
          <strong className="text-gray-600">&nbsp;설치 가이드 탭</strong>에서 자세한 방법을 확인하세요.
        </p>
      </div>
    </div>
  );
}
