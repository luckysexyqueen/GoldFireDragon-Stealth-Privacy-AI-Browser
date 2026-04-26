import { useState } from "react";
import { ExtensionItem, mockStoreExtensions } from "@/mocks/extensions";

interface Props {
  installed: ExtensionItem[];
  onInstall: (ext: ExtensionItem) => void;
}

const CATEGORIES = [
  { id: "all", label: "전체", icon: "ri-apps-line" },
  { id: "privacy", label: "프라이버시", icon: "ri-shield-line" },
  { id: "productivity", label: "생산성", icon: "ri-flashlight-line" },
  { id: "dev", label: "개발자", icon: "ri-code-s-slash-line" },
  { id: "media", label: "미디어", icon: "ri-youtube-line" },
  { id: "search", label: "검색", icon: "ri-search-line" },
  { id: "security", label: "보안", icon: "ri-lock-2-line" },
];

export default function StoreTab({ installed, onInstall }: Props) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [installing, setInstalling] = useState<string | null>(null);
  const [justInstalled, setJustInstalled] = useState<Set<string>>(new Set());

  const installedIds = new Set(installed.map((e) => e.id));

  const filtered = mockStoreExtensions.filter((e) => {
    const matchCat = category === "all" || e.category === category;
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleInstall = async (ext: ExtensionItem) => {
    setInstalling(ext.id);
    await new Promise((r) => setTimeout(r, 1500));
    onInstall({ ...ext, enabled: true });
    setInstalling(null);
    setJustInstalled((prev) => new Set(prev).add(ext.id));
    setTimeout(() => {
      setJustInstalled((prev) => {
        const next = new Set(prev);
        next.delete(ext.id);
        return next;
      });
    }, 3000);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">확장 프로그램 스토어</h2>
          <p className="text-xs text-gray-400 mt-0.5">인기 확장 프로그램을 검색하고 설치하세요</p>
        </div>
        <div className="relative w-full sm:w-60">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
            <i className="ri-search-line text-gray-400 text-sm" />
          </div>
          <input
            type="text"
            placeholder="확장 프로그램 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
              category === cat.id
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="w-3 h-3 flex items-center justify-center">
              <i className={`${cat.icon} text-sm`} />
            </div>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <i className="ri-search-line text-3xl text-gray-200" />
          </div>
          <p className="text-sm">검색 결과가 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((ext) => {
            const isInstalled = installedIds.has(ext.id);
            const isInstalling = installing === ext.id;
            const wasJustInstalled = justInstalled.has(ext.id);

            return (
              <div key={ext.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${ext.iconBg} flex-shrink-0`}>
                    <i className={`${ext.icon} text-white text-xl`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{ext.name}</h3>
                    <p className="text-xs text-gray-400">{ext.author}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{ext.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className={`text-xs ${i < Math.floor(ext.rating) ? "ri-star-fill text-yellow-400" : "ri-star-line text-gray-200"}`}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-0.5">{ext.rating}</span>
                    </div>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      <i className="ri-download-line" /> {ext.installs}
                    </span>
                  </div>

                  <button
                    onClick={() => !isInstalled && !isInstalling && handleInstall(ext)}
                    disabled={isInstalled || isInstalling}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      wasJustInstalled
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : isInstalled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isInstalling
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-900 text-white hover:bg-gray-700"
                    }`}
                  >
                    {wasJustInstalled ? (
                      <><i className="ri-check-line" />설치됨</>
                    ) : isInstalled ? (
                      <><i className="ri-check-line" />설치됨</>
                    ) : isInstalling ? (
                      <><i className="ri-loader-4-line animate-spin" />설치 중...</>
                    ) : (
                      <><i className="ri-add-line" />설치</>
                    )}
                  </button>
                </div>

                {/* Permissions preview */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {ext.permissions.slice(0, 3).map((p) => (
                    <span key={p} className="text-xs bg-gray-50 border border-gray-100 text-gray-400 rounded-md px-1.5 py-0.5 font-mono">{p}</span>
                  ))}
                  {ext.permissions.length > 3 && (
                    <span className="text-xs text-gray-400">+{ext.permissions.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
