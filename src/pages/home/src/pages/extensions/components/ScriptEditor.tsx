import { useState, useRef, useEffect, useCallback } from "react";
import { UserScript } from "@/mocks/extensions";

interface Props {
  script: UserScript;
  onSave: (updated: UserScript) => void;
  onCancel: () => void;
}

interface MetaField { key: string; value: string }

function parseMetadata(code: string): MetaField[] {
  const fields: MetaField[] = [];
  const lines = code.split("\n");
  let inMeta = false;
  for (const line of lines) {
    if (line.trim() === "// ==UserScript==") { inMeta = true; continue; }
    if (line.trim() === "// ==/UserScript==") break;
    if (inMeta) {
      const match = line.match(/^\/\/\s*@(\S+)\s+(.*)/);
      if (match) fields.push({ key: match[1], value: match[2] });
    }
  }
  return fields;
}

function buildMetadata(fields: MetaField[]): string {
  const lines = ["// ==UserScript=="];
  for (const f of fields) lines.push(`// @${f.key.padEnd(16)} ${f.value}`);
  lines.push("// ==/UserScript==");
  return lines.join("\n");
}

function getCodeBody(code: string): string {
  const match = code.match(/\/\/ ==\/UserScript==([\s\S]*)/);
  return match ? match[1].trimStart() : code;
}

function buildFullCode(metaFields: MetaField[], body: string): string {
  return buildMetadata(metaFields) + "\n\n" + body;
}

const GM_APIS = [
  { name: "GM_setValue(key, value)", desc: "값을 영구 저장소에 저장" },
  { name: "GM_getValue(key, default)", desc: "저장된 값 불러오기" },
  { name: "GM_deleteValue(key)", desc: "저장된 값 삭제" },
  { name: "GM_listValues()", desc: "저장된 모든 키 목록" },
  { name: "GM_addStyle(css)", desc: "CSS 스타일 주입" },
  { name: "GM_xmlhttpRequest(details)", desc: "크로스 도메인 HTTP 요청" },
  { name: "GM_notification(text, title)", desc: "브라우저 알림 표시" },
  { name: "GM_openInTab(url, options)", desc: "새 탭에서 URL 열기" },
  { name: "GM_registerMenuCommand(name, fn)", desc: "컨텍스트 메뉴 등록" },
  { name: "GM_getResourceText(name)", desc: "리소스 파일 텍스트 가져오기" },
  { name: "unsafeWindow", desc: "페이지의 실제 window 객체 접근" },
];

const RUN_AT_OPTIONS: { value: UserScript["runAt"]; label: string }[] = [
  { value: "document-start", label: "document-start (HTML 파싱 전)" },
  { value: "document-end", label: "document-end (DOM 로드 후)" },
  { value: "document-idle", label: "document-idle (페이지 완전 로드 후)" },
];

export default function ScriptEditor({ script, onSave, onCancel }: Props) {
  const [metaFields, setMetaFields] = useState<MetaField[]>(() => parseMetadata(script.code));
  const [codeBody, setCodeBody] = useState(() => getCodeBody(script.code));
  const [activeTab, setActiveTab] = useState<"code" | "meta" | "api">("code");
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  const lineCount = codeBody.split("\n").length;

  const syncScroll = useCallback(() => {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) ta.addEventListener("scroll", syncScroll);
    return () => { if (ta) ta.removeEventListener("scroll", syncScroll); };
  }, [syncScroll]);

  const handleSave = () => {
    const fullCode = buildFullCode(metaFields, codeBody);
    const matchMeta = metaFields.filter((f) => f.key === "match").map((f) => f.value);
    const nameMeta = metaFields.find((f) => f.key === "name")?.value ?? script.name;
    const descMeta = metaFields.find((f) => f.key === "description")?.value ?? script.description;
    const verMeta = metaFields.find((f) => f.key === "version")?.value ?? script.version;
    const authorMeta = metaFields.find((f) => f.key === "author")?.value ?? script.author;
    const runAtMeta = (metaFields.find((f) => f.key === "run-at")?.value ?? "document-end") as UserScript["runAt"];
    const grants = metaFields.filter((f) => f.key === "grant").map((f) => f.value);

    onSave({
      ...script,
      name: nameMeta,
      description: descMeta,
      version: verMeta,
      author: authorMeta,
      runAt: runAtMeta,
      matchUrls: matchMeta.length > 0 ? matchMeta : script.matchUrls,
      grants,
      code: fullCode,
      lastModified: new Date().toISOString().slice(0, 10),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRun = () => {
    setIsRunning(true);
    setConsoleOutput([]);
    const logs: string[] = [];
    const fakeConsole = {
      log: (...args: unknown[]) => logs.push("[LOG] " + args.map(String).join(" ")),
      warn: (...args: unknown[]) => logs.push("[WARN] " + args.map(String).join(" ")),
      error: (...args: unknown[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
    };
    const storage: Record<string, unknown> = {};
    const GM_setValue = (k: string, v: unknown) => { storage[k] = v; logs.push(`[GM] setValue("${k}", ${JSON.stringify(v)})`); };
    const GM_getValue = (k: string, def: unknown) => { logs.push(`[GM] getValue("${k}") → ${JSON.stringify(storage[k] ?? def)}`); return storage[k] ?? def; };
    const GM_addStyle = (css: string) => { logs.push(`[GM] addStyle(${css.length}자 CSS 주입)`); };
    const GM_notification = (text: string, title?: string) => { logs.push(`[GM] notification: "${title ?? ""}" - "${text}"`); };
    const GM_registerMenuCommand = (name: string) => { logs.push(`[GM] registerMenuCommand: "${name}"`); };
    const unsafeWindow = window;
    try {
      const fn = new Function(
        "console", "GM_setValue", "GM_getValue", "GM_addStyle",
        "GM_notification", "GM_registerMenuCommand", "unsafeWindow",
        `"use strict"; try { ${codeBody} } catch(e) { console.error(e.message); }`
      );
      fn(fakeConsole, GM_setValue, GM_getValue, GM_addStyle, GM_notification, GM_registerMenuCommand, unsafeWindow);
    } catch (err) {
      logs.push("[ERROR] " + String(err));
    }
    setConsoleOutput(logs.length > 0 ? logs : ["[INFO] 스크립트 실행 완료. 콘솔 출력 없음."]);
    setIsRunning(false);
  };

  const updateMetaField = (idx: number, field: Partial<MetaField>) => {
    setMetaFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...field } : f)));
  };

  const addMetaField = () => setMetaFields((prev) => [...prev, { key: "match", value: "*://*/*" }]);
  const removeMetaField = (idx: number) => setMetaFields((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 ml-1">{script.name}</span>
          <span className="text-xs text-gray-400">· v{script.version}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
          >
            <i className={isRunning ? "ri-loader-4-line animate-spin" : "ri-play-line"} />
            {isRunning ? "실행 중..." : "테스트 실행"}
          </button>
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
              saved ? "bg-green-50 text-green-600" : "bg-gray-900 hover:bg-gray-700 text-white"
            }`}
          >
            <i className={saved ? "ri-check-line" : "ri-save-line"} />
            {saved ? "저장됨!" : "저장"}
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors"
          >
            <i className="ri-close-line" />
            닫기
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-gray-100 px-2">
        {(["code", "meta", "api"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab === "code" && <><i className="ri-code-s-slash-line mr-1" />코드</>}
            {tab === "meta" && <><i className="ri-file-info-line mr-1" />메타데이터</>}
            {tab === "api" && <><i className="ri-book-2-line mr-1" />GM API 레퍼런스</>}
          </button>
        ))}
      </div>

      {/* Code Editor */}
      {activeTab === "code" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden font-mono text-sm bg-gray-950">
            {/* Line numbers */}
            <div
              ref={lineNumRef}
              className="select-none overflow-hidden text-right pr-3 pl-4 py-4 text-gray-600 bg-gray-900 border-r border-gray-800 min-w-[52px]"
              style={{ overflowY: "hidden" }}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} className="leading-6 text-xs">{i + 1}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={codeBody}
              onChange={(e) => setCodeBody(e.target.value)}
              className="flex-1 bg-gray-950 text-gray-100 resize-none outline-none p-4 leading-6 text-xs overflow-auto"
              spellCheck={false}
              style={{ tabSize: 2 }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const start = el.selectionStart;
                  const end = el.selectionEnd;
                  const newVal = el.value.substring(0, start) + "  " + el.value.substring(end);
                  setCodeBody(newVal);
                  requestAnimationFrame(() => {
                    el.selectionStart = el.selectionEnd = start + 2;
                  });
                }
              }}
            />
          </div>
          {/* Console Output */}
          {consoleOutput.length > 0 && (
            <div className="border-t border-gray-800 bg-gray-950 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                <span className="text-xs text-gray-400 font-mono">콘솔 출력</span>
                <button onClick={() => setConsoleOutput([])} className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer">
                  <i className="ri-close-line" />
                </button>
              </div>
              {consoleOutput.map((line, i) => (
                <div
                  key={i}
                  className={`px-4 py-1 text-xs font-mono ${
                    line.startsWith("[ERROR]") ? "text-red-400" :
                    line.startsWith("[WARN]") ? "text-yellow-400" :
                    line.startsWith("[GM]") ? "text-purple-400" : "text-green-400"
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metadata Editor */}
      {activeTab === "meta" && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">메타데이터 필드</h3>
            <button
              onClick={addMetaField}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-600 cursor-pointer whitespace-nowrap transition-colors"
            >
              <i className="ri-add-line" />필드 추가
            </button>
          </div>

          {/* Run-at selector */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="text-xs font-medium text-gray-600 mb-2 block">@run-at 실행 시점</label>
            <div className="space-y-2">
              {RUN_AT_OPTIONS.map((opt) => {
                const runAtField = metaFields.find((f) => f.key === "run-at");
                const current = runAtField?.value ?? "document-end";
                return (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={current === opt.value}
                      onChange={() => {
                        const idx = metaFields.findIndex((f) => f.key === "run-at");
                        if (idx >= 0) updateMetaField(idx, { value: opt.value });
                        else setMetaFields((prev) => [...prev, { key: "run-at", value: opt.value }]);
                      }}
                      className="accent-gray-900"
                    />
                    <span className="text-xs text-gray-700">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-2">
            {metaFields.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1.5 min-w-[110px]">
                  <span className="text-xs text-gray-500 font-mono">@</span>
                  <input
                    type="text"
                    value={f.key}
                    onChange={(e) => updateMetaField(i, { key: e.target.value })}
                    className="bg-transparent outline-none text-xs font-mono text-gray-700 w-20"
                  />
                </div>
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => updateMetaField(i, { value: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-gray-100 border border-transparent rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                <button
                  onClick={() => removeMetaField(i)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                >
                  <i className="ri-close-line text-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GM API Reference */}
      {activeTab === "api" && (
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">GM API 레퍼런스</h3>
          <div className="space-y-2">
            {GM_APIS.map((api) => (
              <div key={api.name} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <code className="text-xs text-gray-900 font-mono block mb-1">{api.name}</code>
                <p className="text-xs text-gray-500">{api.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs font-semibold text-amber-700 mb-2">
              <i className="ri-information-line mr-1" />
              테스트 실행 안내
            </p>
            <p className="text-xs text-amber-600 leading-relaxed">
              "테스트 실행"은 샌드박스 환경에서 코드를 실행합니다. GM_setValue/getValue는 메모리 내 임시 저장, GM_addStyle/GM_notification은 로그로 출력됩니다. 실제 DOM 조작은 실제 브라우저 환경에서만 동작합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
