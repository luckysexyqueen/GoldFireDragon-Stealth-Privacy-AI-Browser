import { ExtensionItem } from "@/mocks/extensions";

interface Props {
  ext: ExtensionItem;
  onClose: () => void;
}

const permissionLabels: Record<string, { label: string; icon: string; risk: "low" | "medium" | "high" }> = {
  storage: { label: "데이터 저장", icon: "ri-database-line", risk: "low" },
  tabs: { label: "탭 접근", icon: "ri-layout-top-line", risk: "medium" },
  activeTab: { label: "현재 탭 접근", icon: "ri-focus-3-line", risk: "low" },
  webRequest: { label: "네트워크 요청 감시", icon: "ri-wifi-line", risk: "high" },
  webRequestBlocking: { label: "네트워크 요청 차단", icon: "ri-forbid-line", risk: "high" },
  search: { label: "검색 엔진 관리", icon: "ri-search-line", risk: "low" },
  notifications: { label: "알림 표시", icon: "ri-notification-line", risk: "low" },
  contextMenus: { label: "컨텍스트 메뉴", icon: "ri-menu-2-line", risk: "low" },
  alarms: { label: "알람 설정", icon: "ri-alarm-line", risk: "low" },
  history: { label: "방문 기록 접근", icon: "ri-history-line", risk: "high" },
  bookmarks: { label: "북마크 접근", icon: "ri-bookmark-line", risk: "medium" },
  cookies: { label: "쿠키 접근", icon: "ri-file-text-line", risk: "high" },
};

const riskColor = {
  low: "text-green-600 bg-green-50 border-green-100",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-100",
  high: "text-red-600 bg-red-50 border-red-100",
};

export default function ExtensionDetailModal({ ext, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br ${ext.iconBg}`}>
              <i className={`${ext.icon} text-white text-lg`} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{ext.name}</p>
              <p className="text-xs text-gray-400">v{ext.version} · {ext.author}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <i className="ri-close-line text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-sm text-gray-600 leading-relaxed">{ext.description}</p>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "버전", value: `v${ext.version}`, icon: "ri-price-tag-3-line" },
              { label: "크기", value: ext.size, icon: "ri-hard-drive-2-line" },
              { label: "평점", value: `★ ${ext.rating}`, icon: "ri-star-fill" },
              { label: "설치 수", value: ext.installs, icon: "ri-download-line" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className={`${item.icon} text-gray-400 text-sm`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-700">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="ri-shield-keyhole-line text-gray-400" />
              요청 권한
              <span className="text-xs font-normal text-gray-400 ml-1">({ext.permissions.length}개)</span>
            </h4>
            <div className="space-y-2">
              {ext.permissions.map((perm) => {
                const info = permissionLabels[perm];
                return (
                  <div
                    key={perm}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${info ? riskColor[info.risk] : "text-gray-600 bg-gray-50 border-gray-100"}`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <i className={`${info?.icon ?? "ri-checkbox-blank-circle-line"} text-sm`} />
                    </div>
                    <span className="flex-1 font-medium">{info?.label ?? perm}</span>
                    <span className="font-mono opacity-60">{perm}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Host permissions */}
          {ext.hostPermissions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <i className="ri-earth-line text-gray-400" />
                접근 도메인
              </h4>
              <div className="space-y-1.5">
                {ext.hostPermissions.map((host) => (
                  <div key={host} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-global-line text-gray-400 text-xs" />
                    </div>
                    <code className="text-xs text-gray-600 font-mono">{host}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shortcut */}
          {ext.shortcut && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <i className="ri-keyboard-line text-gray-400" />
                키보드 단축키
              </h4>
              <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5">
                {ext.shortcut.split("+").map((k, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-gray-400 text-xs">+</span>}
                    <kbd className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs font-mono shadow-sm">{k}</kbd>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {ext.hasError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
              <div className="w-4 h-4 flex items-center justify-center mt-0.5">
                <i className="ri-error-warning-fill text-red-500 text-sm" />
              </div>
              <p className="text-xs text-red-600">{ext.errorMsg ?? "알 수 없는 오류가 발생했습니다."}</p>
            </div>
          )}

          {/* Update available */}
          {ext.updateAvailable && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-refresh-line text-blue-500 text-sm" />
                </div>
                <p className="text-xs text-blue-600">새 버전이 있어요!</p>
              </div>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap cursor-pointer">
                업데이트
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
