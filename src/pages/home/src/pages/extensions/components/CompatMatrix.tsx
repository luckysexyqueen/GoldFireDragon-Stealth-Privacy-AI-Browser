type Support = "full" | "partial" | "no" | "workaround";

interface BrowserEntry {
  name: string;
  icon: string;
  platform: string;
  platformIcon: string;
}

interface FeatureRow {
  feature: string;
  category: string;
  support: Record<string, Support>;
  note?: string;
}

const BROWSERS: BrowserEntry[] = [
  { name: "Chrome PC", icon: "ri-chrome-line", platform: "PC", platformIcon: "ri-computer-line" },
  { name: "Firefox PC", icon: "ri-firefox-line", platform: "PC", platformIcon: "ri-computer-line" },
  { name: "Edge PC", icon: "ri-edge-line", platform: "PC", platformIcon: "ri-computer-line" },
  { name: "Brave PC", icon: "ri-shield-star-line", platform: "PC", platformIcon: "ri-computer-line" },
  { name: "Opera PC", icon: "ri-opera-line", platform: "PC", platformIcon: "ri-computer-line" },
  { name: "Firefox Android", icon: "ri-firefox-line", platform: "Android", platformIcon: "ri-android-line" },
  { name: "Kiwi Android", icon: "ri-smartphone-line", platform: "Android", platformIcon: "ri-android-line" },
  { name: "Chrome Android", icon: "ri-chrome-line", platform: "Android", platformIcon: "ri-android-line" },
  { name: "Samsung Internet", icon: "ri-smartphone-line", platform: "Android", platformIcon: "ri-android-line" },
];

const FEATURES: FeatureRow[] = [
  {
    feature: "확장 프로그램 설치",
    category: "기본",
    support: {
      "Chrome PC": "full", "Firefox PC": "full", "Edge PC": "full", "Brave PC": "full", "Opera PC": "full",
      "Firefox Android": "partial", "Kiwi Android": "full", "Chrome Android": "no", "Samsung Internet": "no",
    },
    note: "Firefox Android는 AMO 공식 확장만 지원",
  },
  {
    feature: "Chrome Web Store",
    category: "스토어",
    support: {
      "Chrome PC": "full", "Firefox PC": "no", "Edge PC": "full", "Brave PC": "full", "Opera PC": "workaround",
      "Firefox Android": "no", "Kiwi Android": "full", "Chrome Android": "no", "Samsung Internet": "no",
    },
    note: "Edge는 '다른 스토어 허용' 설정 후 지원",
  },
  {
    feature: "Firefox AMO",
    category: "스토어",
    support: {
      "Chrome PC": "no", "Firefox PC": "full", "Edge PC": "no", "Brave PC": "no", "Opera PC": "no",
      "Firefox Android": "full", "Kiwi Android": "no", "Chrome Android": "no", "Samsung Internet": "no",
    },
  },
  {
    feature: "로컬 .crx 설치",
    category: "설치",
    support: {
      "Chrome PC": "workaround", "Firefox PC": "no", "Edge PC": "workaround", "Brave PC": "workaround", "Opera PC": "workaround",
      "Firefox Android": "no", "Kiwi Android": "full", "Chrome Android": "no", "Samsung Internet": "no",
    },
    note: "PC Chrome/Edge/Brave는 개발자 모드 필요",
  },
  {
    feature: "로컬 .xpi 설치",
    category: "설치",
    support: {
      "Chrome PC": "no", "Firefox PC": "workaround", "Edge PC": "no", "Brave PC": "no", "Opera PC": "no",
      "Firefox Android": "workaround", "Kiwi Android": "no", "Chrome Android": "no", "Samsung Internet": "no",
    },
    note: "about:debugging 임시 설치 또는 ESR+서명해제",
  },
  {
    feature: "Manifest V3",
    category: "기술",
    support: {
      "Chrome PC": "full", "Firefox PC": "partial", "Edge PC": "full", "Brave PC": "full", "Opera PC": "full",
      "Firefox Android": "partial", "Kiwi Android": "full", "Chrome Android": "no", "Samsung Internet": "no",
    },
    note: "Firefox는 MV3 부분 지원 (MV2 완전 지원)",
  },
  {
    feature: "Manifest V2",
    category: "기술",
    support: {
      "Chrome PC": "partial", "Firefox PC": "full", "Edge PC": "partial", "Brave PC": "partial", "Opera PC": "partial",
      "Firefox Android": "full", "Kiwi Android": "partial", "Chrome Android": "no", "Samsung Internet": "no",
    },
    note: "Chrome MV2는 2024년 이후 지원 축소",
  },
  {
    feature: "UserScript (Tampermonkey 등)",
    category: "고급",
    support: {
      "Chrome PC": "full", "Firefox PC": "full", "Edge PC": "full", "Brave PC": "full", "Opera PC": "full",
      "Firefox Android": "full", "Kiwi Android": "full", "Chrome Android": "no", "Samsung Internet": "no",
    },
    note: "Tampermonkey/Violentmonkey 설치 후 사용 가능",
  },
  {
    feature: "개발자 모드",
    category: "개발",
    support: {
      "Chrome PC": "full", "Firefox PC": "full", "Edge PC": "full", "Brave PC": "full", "Opera PC": "full",
      "Firefox Android": "partial", "Kiwi Android": "full", "Chrome Android": "no", "Samsung Internet": "no",
    },
  },
  {
    feature: "시크릿/사생활 모드",
    category: "프라이버시",
    support: {
      "Chrome PC": "workaround", "Firefox PC": "workaround", "Edge PC": "workaround", "Brave PC": "workaround", "Opera PC": "workaround",
      "Firefox Android": "workaround", "Kiwi Android": "workaround", "Chrome Android": "no", "Samsung Internet": "no",
    },
    note: "각 브라우저에서 수동으로 허용 설정 필요",
  },
];

const SUPPORT_CONFIG: Record<Support, { icon: string; color: string; label: string; bg: string }> = {
  full: { icon: "ri-checkbox-circle-fill", color: "text-green-500", label: "완전 지원", bg: "bg-green-50" },
  partial: { icon: "ri-checkbox-indeterminate-line", color: "text-yellow-500", label: "부분 지원", bg: "bg-yellow-50" },
  workaround: { icon: "ri-tools-fill", color: "text-blue-400", label: "설정 필요", bg: "bg-blue-50" },
  no: { icon: "ri-close-circle-fill", color: "text-gray-300", label: "미지원", bg: "" },
};

const CATEGORIES = [...new Set(FEATURES.map((f) => f.category))];

export default function CompatMatrix() {
  const pcBrowsers = BROWSERS.filter((b) => b.platform === "PC");
  const androidBrowsers = BROWSERS.filter((b) => b.platform === "Android");

  const renderCell = (support: Support) => {
    const cfg = SUPPORT_CONFIG[support];
    return (
      <td key={support} className={`py-2.5 px-2 text-center ${cfg.bg}`}>
        <div className="flex justify-center">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className={`${cfg.icon} ${cfg.color} text-base`} />
          </div>
        </div>
      </td>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">전체 호환성 매트릭스</h3>
        <p className="text-sm text-gray-400">PC · Android · 모든 브라우저 기능별 지원 현황</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
        {(Object.entries(SUPPORT_CONFIG) as [Support, typeof SUPPORT_CONFIG[Support]][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className={`${cfg.icon} ${cfg.color} text-sm`} />
            </div>
            <span className="text-xs text-gray-600">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* PC Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <i className="ri-computer-line text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">PC 브라우저</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-xs w-40 sticky left-0 bg-white">기능</th>
                <th className="text-xs text-gray-400 font-normal py-2 px-1 text-center w-8">카테고리</th>
                {pcBrowsers.map((b) => (
                  <th key={b.name} className="py-3 px-2 text-center min-w-[80px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <i className={`${b.icon} text-gray-600 text-base`} />
                      </div>
                      <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{b.name.replace(" PC", "")}</span>
                    </div>
                  </th>
                ))}
                <th className="text-left py-3 px-3 text-gray-400 font-normal text-xs min-w-[160px]">비고</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                FEATURES.filter((f) => f.category === cat).map((feature, idx) => (
                  <tr key={feature.feature} className={`${idx === 0 ? "border-t-2 border-gray-100" : "border-t border-gray-50"} hover:bg-gray-50/50 transition-colors`}>
                    <td className="py-2.5 px-4 text-xs text-gray-700 font-medium sticky left-0 bg-white">{feature.feature}</td>
                    <td className="py-2.5 px-1 text-center">
                      <span className="text-xs bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5 whitespace-nowrap">{cat}</span>
                    </td>
                    {pcBrowsers.map((b) => renderCell(feature.support[b.name] ?? "no"))}
                    <td className="py-2.5 px-3 text-xs text-gray-400 leading-relaxed">{feature.note ?? ""}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Android Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <i className="ri-android-line text-green-500" />
          <span className="text-sm font-semibold text-gray-700">Android 브라우저</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium text-xs w-40 sticky left-0 bg-white">기능</th>
                <th className="text-xs text-gray-400 font-normal py-2 px-1 text-center w-8">카테고리</th>
                {androidBrowsers.map((b) => (
                  <th key={b.name} className="py-3 px-2 text-center min-w-[90px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <i className={`${b.icon} text-gray-600 text-base`} />
                      </div>
                      <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{b.name.replace(" Android", "")}</span>
                    </div>
                  </th>
                ))}
                <th className="text-left py-3 px-3 text-gray-400 font-normal text-xs min-w-[160px]">비고</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                FEATURES.filter((f) => f.category === cat).map((feature, idx) => (
                  <tr key={feature.feature} className={`${idx === 0 ? "border-t-2 border-gray-100" : "border-t border-gray-50"} hover:bg-gray-50/50 transition-colors`}>
                    <td className="py-2.5 px-4 text-xs text-gray-700 font-medium sticky left-0 bg-white">{feature.feature}</td>
                    <td className="py-2.5 px-1 text-center">
                      <span className="text-xs bg-gray-100 text-gray-400 rounded-full px-1.5 py-0.5 whitespace-nowrap">{cat}</span>
                    </td>
                    {androidBrowsers.map((b) => renderCell(feature.support[b.name] ?? "no"))}
                    <td className="py-2.5 px-3 text-xs text-gray-400 leading-relaxed">{feature.note ?? ""}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Recommendation */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <i className="ri-computer-line text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">PC 추천 브라우저</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: "ri-chrome-line", name: "Chrome", note: "가장 많은 확장, 최신 MV3" },
              { icon: "ri-firefox-line", name: "Firefox", note: "프라이버시 + MV2 완전 지원" },
              { icon: "ri-edge-line", name: "Edge", note: "Windows 내장 + Chrome 호환" },
            ].map((b) => (
              <div key={b.name} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-100">
                  <i className={`${b.icon} text-gray-600 text-sm`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <i className="ri-android-line text-green-500" />
            <span className="text-sm font-semibold text-gray-800">Android 추천 브라우저</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: "ri-firefox-line", name: "Firefox for Android", note: "공식 AMO 지원 + 안전" },
              { icon: "ri-smartphone-line", name: "Kiwi Browser", note: "Chrome 확장 완전 지원" },
              { icon: "ri-firefox-line", name: "Firefox Nightly", note: "모든 확장 설치 가능" },
            ].map((b) => (
              <div key={b.name} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-100">
                  <i className={`${b.icon} text-gray-600 text-sm`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
