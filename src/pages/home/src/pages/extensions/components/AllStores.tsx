import { useState } from "react";

type StoreStatus = "available" | "compatible" | "coming" | "unsupported";

interface Store {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  platform: string[];
  status: StoreStatus;
  url: string;
  installUrl: string;
  desc: string;
  manifests: string[];
  badge?: string;
  dlExt?: string;
}

const STORES: Store[] = [
  {
    id: "chrome-webstore",
    name: "Chrome 웹 스토어",
    icon: "ri-chrome-line",
    iconColor: "text-gray-700",
    platform: ["PC", "Android(Kiwi)"],
    status: "available",
    url: "https://chrome.google.com/webstore",
    installUrl: "https://chrome.google.com/webstore/detail/goldfiredragon",
    desc: "Chrome, Brave, Edge, Opera, Vivaldi, Kiwi 공통 지원. 최대 38M+ 사용자 플랫폼.",
    manifests: ["MV3", "MV2(레거시)"],
    badge: "주요 스토어",
    dlExt: "crx",
  },
  {
    id: "firefox-amo",
    name: "Firefox 부가 기능 (AMO)",
    icon: "ri-firefox-line",
    iconColor: "text-orange-500",
    platform: ["PC", "Android"],
    status: "available",
    url: "https://addons.mozilla.org",
    installUrl: "https://addons.mozilla.org/addon/goldfiredragon",
    desc: "Firefox PC + Android 공식 스토어. Mozilla 서명 검증. MV2 완전 지원.",
    manifests: ["MV2", "MV3(부분)"],
    badge: "주요 스토어",
    dlExt: "xpi",
  },
  {
    id: "edge-addons",
    name: "Microsoft Edge 애드온",
    icon: "ri-edge-line",
    iconColor: "text-blue-500",
    platform: ["PC(Windows)"],
    status: "available",
    url: "https://microsoftedge.microsoft.com/addons",
    installUrl: "https://microsoftedge.microsoft.com/addons/detail/goldfiredragon",
    desc: "Edge 전용 스토어. Chrome 웹 스토어와 동일 CRX 포맷. Windows 내장 브라우저.",
    manifests: ["MV3"],
    badge: "Windows",
    dlExt: "crx",
  },
  {
    id: "opera-addons",
    name: "Opera 애드온",
    icon: "ri-opera-line",
    iconColor: "text-red-500",
    platform: ["PC"],
    status: "available",
    url: "https://addons.opera.com",
    installUrl: "https://addons.opera.com/extensions/details/goldfiredragon",
    desc: "Opera GX / Opera 브라우저 공식 스토어. Chrome CRX 완전 호환.",
    manifests: ["MV3", "MV2"],
    dlExt: "crx",
  },
  {
    id: "brave-store",
    name: "Brave Web Store",
    icon: "ri-shield-star-line",
    iconColor: "text-orange-500",
    platform: ["PC"],
    status: "compatible",
    url: "https://chrome.google.com/webstore",
    installUrl: "https://chrome.google.com/webstore/detail/goldfiredragon",
    desc: "Brave는 Chrome 웹 스토어를 직접 사용. 별도 설치 없이 Chrome Store에서 그대로 설치.",
    manifests: ["MV3"],
    badge: "Chrome 호환",
    dlExt: "crx",
  },
  {
    id: "kiwi-android",
    name: "Kiwi Browser (Android)",
    icon: "ri-smartphone-line",
    iconColor: "text-green-600",
    platform: ["Android"],
    status: "compatible",
    url: "https://play.google.com/store/apps/details?id=com.kiwibrowser.browser",
    installUrl: "https://chrome.google.com/webstore/detail/goldfiredragon",
    desc: "Android에서 Chrome 확장을 지원하는 유일한 Chromium 브라우저. Chrome Store 직접 설치.",
    manifests: ["MV3"],
    badge: "Android 전용",
    dlExt: "crx",
  },
  {
    id: "firefox-android",
    name: "Firefox for Android (AMO)",
    icon: "ri-firefox-line",
    iconColor: "text-orange-400",
    platform: ["Android"],
    status: "available",
    url: "https://addons.mozilla.org/android",
    installUrl: "https://addons.mozilla.org/android/addon/goldfiredragon",
    desc: "Firefox Fenix Android 공식 AMO. Mozilla 서명 필수. Nightly는 서명 없이 설치 가능.",
    manifests: ["MV2"],
    badge: "Android",
    dlExt: "xpi",
  },
  {
    id: "vivaldi",
    name: "Vivaldi",
    icon: "ri-global-line",
    iconColor: "text-red-500",
    platform: ["PC"],
    status: "compatible",
    url: "https://chrome.google.com/webstore",
    installUrl: "https://chrome.google.com/webstore/detail/goldfiredragon",
    desc: "Vivaldi는 Chromium 기반으로 Chrome Web Store를 완전 지원.",
    manifests: ["MV3"],
    badge: "Chrome 호환",
    dlExt: "crx",
  },
  {
    id: "yandex",
    name: "Yandex Browser",
    icon: "ri-global-line",
    iconColor: "text-yellow-500",
    platform: ["PC", "Android"],
    status: "compatible",
    url: "https://chrome.google.com/webstore",
    installUrl: "https://chrome.google.com/webstore/detail/goldfiredragon",
    desc: "Yandex 브라우저는 Chrome 확장을 그대로 지원. Chrome Web Store에서 설치 가능.",
    manifests: ["MV3"],
    badge: "Chrome 호환",
    dlExt: "crx",
  },
  {
    id: "waterfox",
    name: "Waterfox",
    icon: "ri-water-flash-line",
    iconColor: "text-blue-400",
    platform: ["PC"],
    status: "compatible",
    url: "https://addons.mozilla.org",
    installUrl: "https://addons.mozilla.org/addon/goldfiredragon",
    desc: "Firefox 기반 Waterfox는 Firefox AMO 확장을 완전 지원.",
    manifests: ["MV2"],
    badge: "Firefox 호환",
    dlExt: "xpi",
  },
  {
    id: "librewolf",
    name: "LibreWolf",
    icon: "ri-firefox-line",
    iconColor: "text-purple-400",
    platform: ["PC"],
    status: "compatible",
    url: "https://addons.mozilla.org",
    installUrl: "https://addons.mozilla.org/addon/goldfiredragon",
    desc: "Privacy-hardened Firefox 포크. Firefox AMO 확장 및 .xpi 로컬 설치 지원.",
    manifests: ["MV2"],
    badge: "Firefox 호환",
    dlExt: "xpi",
  },
  {
    id: "samsung-internet",
    name: "Samsung Internet",
    icon: "ri-smartphone-line",
    iconColor: "text-blue-400",
    platform: ["Android"],
    status: "unsupported",
    url: "https://play.google.com/store/apps/details?id=org.mozilla.firefox",
    installUrl: "",
    desc: "Samsung Internet은 확장 프로그램을 지원하지 않아요. Firefox for Android로 대체 권장.",
    manifests: [],
    dlExt: undefined,
  },
];

const STATUS_CONFIG: Record<StoreStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  available:   { label: "설치 가능", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", icon: "ri-checkbox-circle-fill" },
  compatible:  { label: "호환 지원", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: "ri-tools-fill" },
  coming:      { label: "준비 중", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: "ri-time-line" },
  unsupported: { label: "미지원", color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-100", icon: "ri-close-circle-fill" },
};

const PLATFORM_FILTER = ["전체", "PC", "Android"];

export default function AllStores() {
  const [filter, setFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState<StoreStatus | "all">("all");

  const filtered = STORES.filter((s) => {
    const matchPlat = filter === "전체" || s.platform.some((p) => p.startsWith(filter));
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchPlat && matchStatus;
  });

  const counts = {
    available: STORES.filter((s) => s.status === "available").length,
    compatible: STORES.filter((s) => s.status === "compatible").length,
    total: STORES.length,
  };

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { label: "총 스토어/플랫폼", value: counts.total, icon: "ri-store-2-line", color: "text-gray-700" },
          { label: "공식 스토어 설치", value: counts.available, icon: "ri-checkbox-circle-fill", color: "text-green-600" },
          { label: "호환 설치 가능", value: counts.compatible, icon: "ri-tools-fill", color: "text-blue-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className={`${s.icon} ${s.color} text-base`} />
              </div>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
          {PLATFORM_FILTER.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
                filter === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
          {(["all", "available", "compatible", "unsupported"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all whitespace-nowrap ${
                statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "all" ? "전체 상태" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((store) => {
          const sc = STATUS_CONFIG[store.status];
          return (
            <div
              key={store.id}
              className={`bg-white rounded-2xl border p-5 transition-all ${
                store.status === "unsupported" ? "border-gray-100 opacity-60" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 flex-shrink-0">
                    <i className={`${store.icon} ${store.iconColor} text-2xl`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{store.name}</h3>
                      {store.badge && (
                        <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 border border-gray-200">{store.badge}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {store.platform.map((p) => (
                        <span key={p} className="text-xs text-gray-400">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium flex-shrink-0 ${sc.bg} ${sc.color} ${sc.border}`}>
                  <div className="w-3 h-3 flex items-center justify-center">
                    <i className={`${sc.icon} text-xs`} />
                  </div>
                  {sc.label}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{store.desc}</p>

              {/* Manifest tags */}
              {store.manifests.length > 0 && (
                <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                  {store.manifests.map((m) => (
                    <span key={m} className="text-xs font-mono bg-gray-900 text-gray-300 rounded px-1.5 py-0.5">{m}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {store.installUrl && store.status !== "unsupported" ? (
                  <a
                    href={store.installUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-add-line" />
                    {store.status === "compatible" ? "호환 설치하기" : "설치하기"}
                  </a>
                ) : store.status === "unsupported" ? (
                  <a
                    href={store.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-arrow-right-line" />
                    대체 브라우저 설치
                  </a>
                ) : null}
                <a
                  href={store.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-external-link-line" />
                  스토어 방문
                </a>
                {store.dlExt && store.status !== "unsupported" && (
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer ml-auto">
                    <i className="ri-download-line" />
                    .{store.dlExt}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Universal install tip */}
      <div className="mt-6 p-5 bg-white rounded-2xl border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i className="ri-lightbulb-line text-yellow-400" />
          어떤 브라우저든 설치하는 방법
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: "ri-chrome-line", title: "Chromium 계열 전부 (Chrome/Edge/Brave/Opera/Vivaldi/Kiwi/Yandex)", desc: "Chrome 웹 스토어에서 동일하게 설치. .crx 로컬 설치도 지원." },
            { icon: "ri-firefox-line", title: "Firefox 계열 전부 (Firefox/Waterfox/LibreWolf/Pale Moon)", desc: "Firefox AMO에서 .xpi 설치. 모두 browser.* API 폴리필 포함." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 flex-shrink-0">
                <i className={`${item.icon} text-gray-600 text-sm`} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800 mb-0.5">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
