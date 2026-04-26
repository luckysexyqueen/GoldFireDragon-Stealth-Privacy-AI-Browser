import { useState } from "react";
import { ExtensionItem } from "@/mocks/extensions";
import ExtensionDetailModal from "./ExtensionDetailModal";

interface Props {
  extensions: ExtensionItem[];
  devMode: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string) => void;
}

export default function MyExtensions({ extensions, devMode, onToggle, onRemove, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [detailExt, setDetailExt] = useState<ExtensionItem | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const filtered = extensions.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = extensions.filter((e) => e.enabled).length;

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">설치된 확장 프로그램</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            전체 {extensions.length}개 · 활성화 {enabledCount}개
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
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
          {devMode && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap transition-colors">
              <i className="ri-folder-open-line text-sm" />
              압축 해제된 항목 로드
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {extensions.some((e) => e.hasError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100">
            <i className="ri-error-warning-line text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-700">오류가 있는 확장 프로그램</p>
            <p className="text-xs text-red-500 mt-0.5">
              {extensions.filter((e) => e.hasError).map((e) => e.name).join(", ")}에서 오류가 감지됐어요.
            </p>
          </div>
        </div>
      )}

      {/* Extension list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <i className="ri-search-line text-3xl text-gray-200" />
            </div>
            <p className="text-sm">검색 결과가 없어요</p>
          </div>
        ) : (
          filtered.map((ext) => (
            <div
              key={ext.id}
              className={`bg-white border rounded-2xl p-5 transition-all ${
                ext.enabled ? "border-gray-200" : "border-gray-100 opacity-70"
              } ${ext.hasError ? "border-red-200" : ""}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${ext.iconBg} flex-shrink-0`}>
                  <i className={`${ext.icon} text-white text-xl`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{ext.name}</h3>
                        <span className="text-xs text-gray-400 flex-shrink-0">v{ext.version}</span>
                        {ext.official && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded text-xs">
                            <i className="ri-verified-badge-fill text-xs" />공식
                          </span>
                        )}
                        {ext.updateAvailable && (
                          <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded text-xs">
                            업데이트 있음
                          </span>
                        )}
                        {ext.hasError && (
                          <span className="px-1.5 py-0.5 bg-red-50 border border-red-100 text-red-600 rounded text-xs flex items-center gap-1">
                            <i className="ri-error-warning-line text-xs" />오류
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{ext.description}</p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => onToggle(ext.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                        ext.enabled ? "bg-gray-900" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          ext.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-3 flex-wrap">
                    <button
                      onClick={() => setDetailExt(ext)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-information-line" />
                      세부정보
                    </button>
                    {ext.shortcut && (
                      <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                        <i className="ri-keyboard-line" />
                        단축키
                      </button>
                    )}
                    {ext.updateAvailable && (
                      <button
                        onClick={() => onUpdate(ext.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-refresh-line" />
                        업데이트
                      </button>
                    )}
                    {devMode && (
                      <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                        <i className="ri-refresh-line" />
                        새로고침
                      </button>
                    )}
                    {removeConfirm === ext.id ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-gray-500">삭제할까요?</span>
                        <button
                          onClick={() => { onRemove(ext.id); setRemoveConfirm(null); }}
                          className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >확인</button>
                        <button
                          onClick={() => setRemoveConfirm(null)}
                          className="px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >취소</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRemoveConfirm(ext.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap ml-auto"
                      >
                        <i className="ri-delete-bin-line" />
                        제거
                      </button>
                    )}
                  </div>

                  {/* Dev mode info */}
                  {devMode && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-1.5">
                      <i className="ri-code-s-slash-line text-sm" />
                      <span>ID: {ext.id}</span>
                      <span>·</span>
                      <span>{ext.size}</span>
                      <span>·</span>
                      <span>{ext.permissions.length} 권한</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {detailExt && (
        <ExtensionDetailModal ext={detailExt} onClose={() => setDetailExt(null)} />
      )}
    </div>
  );
}
