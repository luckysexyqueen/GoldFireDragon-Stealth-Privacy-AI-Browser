import { useState } from "react";
import { UserScript, newScriptTemplate } from "@/mocks/extensions";
import ScriptEditor from "./ScriptEditor";

interface Props {
  scripts: UserScript[];
  onToggle: (id: string) => void;
  onSave: (updated: UserScript) => void;
  onDelete: (id: string) => void;
  onAdd: (script: UserScript) => void;
}

export default function UserScripts({ scripts, onToggle, onSave, onDelete, onAdd }: Props) {
  const [editing, setEditing] = useState<UserScript | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");

  const enabled = scripts.filter((s) => s.enabled).length;
  const totalRuns = scripts.reduce((acc, s) => acc + s.runCount, 0);

  const filtered = scripts.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewScript = () => {
    const newScript: UserScript = {
      id: "script-" + Date.now(),
      name: "새 스크립트",
      description: "새로운 유저스크립트",
      version: "1.0.0",
      author: "사용자",
      enabled: false,
      matchUrls: ["*://*/*"],
      excludeUrls: [],
      runAt: "document-end",
      grants: ["GM_setValue", "GM_getValue"],
      code: newScriptTemplate,
      lastModified: new Date().toISOString().slice(0, 10),
      runCount: 0,
    };
    onAdd(newScript);
    setEditing(newScript);
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const mockCode = newScriptTemplate.replace("새 스크립트", `임포트된 스크립트`).replace("https://goldfiredragon.app/scripts", importUrl);
    const newScript: UserScript = {
      id: "imported-" + Date.now(),
      name: "임포트된 스크립트",
      description: `${importUrl} 에서 임포트`,
      version: "1.0.0",
      author: "임포트",
      enabled: false,
      matchUrls: ["*://*/*"],
      excludeUrls: [],
      runAt: "document-end",
      grants: [],
      code: mockCode,
      lastModified: new Date().toISOString().slice(0, 10),
      runCount: 0,
    };
    onAdd(newScript);
    setImportUrl("");
    setImporting(false);
    setEditing(newScript);
  };

  const handleExport = (script: UserScript) => {
    const blob = new Blob([script.code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.name.replace(/\s+/g, "_")}.user.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (editing) {
    return (
      <div className="flex flex-col" style={{ minHeight: "600px" }}>
        <ScriptEditor
          script={editing}
          onSave={(updated) => { onSave(updated); setEditing(updated); }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "전체 스크립트", value: scripts.length, icon: "ri-file-code-line", color: "text-gray-700" },
          { label: "활성화", value: enabled, icon: "ri-checkbox-circle-line", color: "text-green-600" },
          { label: "총 실행 횟수", value: totalRuns.toLocaleString(), icon: "ri-play-circle-line", color: "text-gray-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className={`${stat.icon} ${stat.color} text-base`} />
              </div>
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 sm:max-w-xs">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
            <i className="ri-search-line text-gray-400 text-sm" />
          </div>
          <input
            type="text"
            placeholder="스크립트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white">
            <input
              type="text"
              placeholder="URL에서 임포트..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              className="text-xs outline-none text-gray-700 w-40 placeholder-gray-400"
            />
            <button
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
              className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-40"
            >
              {importing ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-download-line" />}
            </button>
          </div>
          <button
            onClick={handleNewScript}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
          >
            <i className="ri-add-line" />
            새 스크립트
          </button>
        </div>
      </div>

      {/* Script list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <i className="ri-file-code-line text-3xl text-gray-200" />
            </div>
            <p className="text-sm text-gray-400">스크립트가 없어요</p>
            <button
              onClick={handleNewScript}
              className="mt-3 text-xs text-gray-500 hover:text-gray-900 underline cursor-pointer"
            >
              새 스크립트 만들기
            </button>
          </div>
        ) : (
          filtered.map((script) => (
            <div
              key={script.id}
              className={`bg-white border rounded-2xl p-5 transition-all ${script.enabled ? "border-gray-200" : "border-gray-100 opacity-70"}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 flex-shrink-0">
                  <i className="ri-file-code-line text-white text-base" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{script.name}</h3>
                        <span className="text-xs text-gray-400">v{script.version}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{script.description}</p>
                    </div>
                    <button
                      onClick={() => onToggle(script.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${script.enabled ? "bg-gray-900" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${script.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  {/* Meta chips */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md border font-mono ${
                      script.runAt === "document-start"
                        ? "bg-red-50 text-red-600 border-red-100"
                        : script.runAt === "document-end"
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-gray-50 text-gray-500 border-gray-100"
                    }`}>
                      @run-at {script.runAt}
                    </span>
                    {script.matchUrls.slice(0, 2).map((url) => (
                      <span key={url} className="text-xs bg-gray-50 border border-gray-100 text-gray-400 rounded-md px-1.5 py-0.5 font-mono truncate max-w-[140px]">
                        {url}
                      </span>
                    ))}
                    {script.matchUrls.length > 2 && (
                      <span className="text-xs text-gray-400">+{script.matchUrls.length - 2}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      실행 {script.runCount.toLocaleString()}회 · {script.lastModified}
                    </span>
                  </div>

                  {/* Grants */}
                  {script.grants.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <i className="ri-key-2-line text-gray-300 text-xs" />
                      {script.grants.slice(0, 4).map((g) => (
                        <span key={g} className="text-xs font-mono bg-gray-900 text-gray-300 rounded px-1.5 py-0.5">{g}</span>
                      ))}
                      {script.grants.length > 4 && (
                        <span className="text-xs text-gray-400">+{script.grants.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setEditing(script)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
                    >
                      <i className="ri-edit-line" />편집
                    </button>
                    <button
                      onClick={() => handleExport(script)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer whitespace-nowrap transition-colors"
                    >
                      <i className="ri-download-line" />내보내기
                    </button>
                    {deleteConfirm === script.id ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-gray-400">삭제할까요?</span>
                        <button onClick={() => { onDelete(script.id); setDeleteConfirm(null); }} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded cursor-pointer whitespace-nowrap">확인</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 rounded cursor-pointer whitespace-nowrap">취소</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(script.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer whitespace-nowrap transition-colors ml-auto"
                      >
                        <i className="ri-delete-bin-line" />삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
