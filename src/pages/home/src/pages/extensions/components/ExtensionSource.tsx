import { useState, useRef } from "react";
import {
  MANIFEST_MV3, MANIFEST_MV2, BACKGROUND_JS, CONTENT_JS,
  POPUP_HTML, POPUP_JS, BROWSER_POLYFILL_NOTE, CONTENT_CSS, NEWTAB_HTML,
} from "@/mocks/extensionSource";

interface FileTab {
  id: string;
  label: string;
  lang: string;
  content: string;
  desc: string;
  compat: string[];
}

const FILES: FileTab[] = [
  { id: "mv3", label: "manifest.json (MV3)", lang: "json", content: MANIFEST_MV3, desc: "Chrome/Edge/Brave/Kiwi/Opera용 Manifest V3", compat: ["Chrome", "Edge", "Brave", "Kiwi", "Opera", "Vivaldi"] },
  { id: "mv2", label: "manifest_v2.json (MV2)", lang: "json", content: MANIFEST_MV2, desc: "Firefox/Waterfox/LibreWolf용 Manifest V2", compat: ["Firefox PC", "Firefox Android", "Waterfox", "LibreWolf"] },
  { id: "bg", label: "background.js", lang: "js", content: BACKGROUND_JS, desc: "서비스 워커(MV3) / 백그라운드 스크립트(MV2). Omnibox, 컨텍스트 메뉴, 메시지 처리", compat: ["전체 브라우저"] },
  { id: "content", label: "content.js", lang: "js", content: CONTENT_JS, desc: "모든 페이지에 주입. UA 스푸핑, 추적 파라미터 제거, 키보드 단축키", compat: ["전체 브라우저"] },
  { id: "popup", label: "popup.html", lang: "html", content: POPUP_HTML, desc: "툴바 아이콘 클릭 시 나오는 팝업 UI", compat: ["전체 브라우저"] },
  { id: "popupjs", label: "popup.js", lang: "js", content: POPUP_JS, desc: "팝업 스크립트. 검색엔진 전환, 설정 저장", compat: ["전체 브라우저"] },
  { id: "polyfill", label: "browser-polyfill.js", lang: "js", content: BROWSER_POLYFILL_NOTE, desc: "Mozilla webextension-polyfill. chrome.* ↔ browser.* API 통일", compat: ["전체 브라우저"] },
  { id: "css", label: "content.css", lang: "css", content: CONTENT_CSS, desc: "콘텐츠 스크립트 스타일. GFD 툴바, 알림 배지 등", compat: ["전체 브라우저"] },
  { id: "newtab", label: "newtab.html", lang: "html", content: NEWTAB_HTML, desc: "새 탭 오버라이드 페이지. 다크 테마 + 검색엔진 전환", compat: ["전체 브라우저"] },
];

const LANG_COLOR: Record<string, string> = {
  json: "text-yellow-400", js: "text-green-400", html: "text-orange-400", css: "text-blue-400",
};

function LineNumberEditor({ content, lang }: { content: string; lang: string }) {
  const lines = content.split("\n");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden font-mono text-xs bg-gray-950" style={{ minHeight: "320px" }}>
      <div
        ref={lineNumRef}
        className="select-none text-right pr-3 pl-3 py-4 text-gray-600 bg-gray-900 border-r border-gray-800 min-w-[44px] overflow-hidden"
        style={{ overflowY: "hidden" }}
      >
        {lines.map((_, i) => (
          <div key={i} className="leading-6">{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        readOnly
        value={content}
        onScroll={onScroll}
        className={`flex-1 bg-gray-950 resize-none outline-none p-4 leading-6 overflow-auto ${LANG_COLOR[lang] ?? "text-gray-300"}`}
        spellCheck={false}
        style={{ tabSize: 2 }}
      />
    </div>
  );
}

export default function ExtensionSource() {
  const [activeFile, setActiveFile] = useState("mv3");
  const [copied, setCopied] = useState(false);

  const current = FILES.find((f) => f.id === activeFile)!;

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (file: FileTab) => {
    const ext = file.lang === "json" ? "json" : file.lang === "html" ? "html" : file.lang === "css" ? "css" : "js";
    const filename = file.id === "mv3" ? "manifest.json" : file.id === "mv2" ? "manifest_v2.json" : `${file.id.replace("js", "")}.${ext}`;
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Download each file sequentially
    FILES.forEach((file, i) => {
      setTimeout(() => handleDownload(file), i * 150);
    });
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">확장 프로그램 소스 코드</h2>
          <p className="text-sm text-gray-400">MV2/MV3 크로스브라우저 완전 호환 소스. 복사하거나 파일별 다운로드 가능</p>
        </div>
        <button
          onClick={handleDownloadAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap transition-colors flex-shrink-0"
        >
          <i className="ri-download-2-line" />
          전체 다운로드
        </button>
      </div>

      {/* File compatibility overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: "ri-chrome-line", label: "Chrome MV3", files: ["manifest.json", "background.js", "content.js"], color: "text-gray-600" },
          { icon: "ri-firefox-line", label: "Firefox MV2", files: ["manifest_v2.json", "background.js", "content.js"], color: "text-orange-500" },
          { icon: "ri-edge-line", label: "Edge MV3", files: ["manifest.json", "background.js", "content.js"], color: "text-blue-500" },
          { icon: "ri-shield-star-line", label: "Brave", files: ["manifest.json (Chrome 공유)"], color: "text-orange-400" },
          { icon: "ri-smartphone-line", label: "Kiwi (Android)", files: ["manifest.json (Chrome 공유)"], color: "text-green-500" },
          { icon: "ri-firefox-line", label: "Firefox Android", files: ["manifest_v2.json (Firefox 공유)"], color: "text-orange-400" },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className={`${item.icon} ${item.color} text-base`} />
              </div>
              <span className="text-xs font-semibold text-gray-700">{item.label}</span>
            </div>
            <div className="space-y-0.5">
              {item.files.map((f) => (
                <div key={f} className="flex items-center gap-1 text-xs text-gray-400">
                  <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                    <i className="ri-check-line text-green-400 text-xs" />
                  </div>
                  <code className="font-mono">{f}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Code editor */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* File tabs - scrollable */}
        <div className="flex items-center overflow-x-auto bg-gray-900 border-b border-gray-800">
          {FILES.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFile(f.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap cursor-pointer transition-colors flex-shrink-0 border-b-2 ${
                activeFile === f.id
                  ? "border-white text-white bg-gray-800"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className={`font-mono text-xs ${LANG_COLOR[f.lang]}`}>.{f.lang}</span>
              <span>{f.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* File info bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-xs font-mono ${LANG_COLOR[current.lang]}`}>{current.lang.toUpperCase()}</span>
            <span className="text-xs text-gray-300 font-medium">{current.label}</span>
            <span className="text-xs text-gray-500 truncate hidden sm:block">— {current.desc}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5">
              {current.compat.slice(0, 3).map((c) => (
                <span key={c} className="text-xs bg-gray-700 text-gray-300 rounded px-1.5 py-0.5">{c}</span>
              ))}
            </div>
            <button
              onClick={() => handleDownload(current)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs cursor-pointer whitespace-nowrap transition-colors"
            >
              <i className="ri-download-line text-xs" />
              저장
            </button>
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer whitespace-nowrap transition-colors ${
                copied ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              <i className={copied ? "ri-check-line text-xs" : "ri-file-copy-line text-xs"} />
              {copied ? "복사됨!" : "복사"}
            </button>
          </div>
        </div>

        {/* Code view */}
        <LineNumberEditor content={current.content} lang={current.lang} />

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-t border-gray-800">
          <span className="text-xs text-gray-500 font-mono">{current.content.split("\n").length} 줄</span>
          <span className="text-xs text-gray-500 font-mono">{current.content.length.toLocaleString()} bytes</span>
          <span className="text-xs text-gray-500 font-mono">UTF-8</span>
          <span className="text-xs text-gray-500 font-mono ml-auto">Cross-browser compatible</span>
        </div>
      </div>

      {/* Structure tree */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="ri-folder-3-line text-gray-400" />
          확장 프로그램 파일 구조
        </h3>
        <div className="font-mono text-xs bg-gray-950 rounded-xl p-5 text-gray-300 leading-7">
          <div className="text-yellow-400">goldfiredragon-extension/</div>
          {[
            { indent: 1, name: "manifest.json", note: "← Chrome/Edge/Brave/Kiwi (MV3)", color: "text-yellow-300" },
            { indent: 1, name: "manifest_v2.json", note: "← Firefox/Waterfox (MV2)", color: "text-orange-300" },
            { indent: 1, name: "background.js", note: "← 서비스 워커 + 백그라운드", color: "text-green-300" },
            { indent: 1, name: "content.js", note: "← 콘텐츠 스크립트", color: "text-green-300" },
            { indent: 1, name: "content.css", note: "← 콘텐츠 스타일", color: "text-blue-300" },
            { indent: 1, name: "popup.html", note: "← 팝업 UI", color: "text-orange-300" },
            { indent: 1, name: "popup.js", note: "← 팝업 로직", color: "text-green-300" },
            { indent: 1, name: "options.html", note: "← 옵션 페이지", color: "text-orange-300" },
            { indent: 1, name: "newtab.html", note: "← 새 탭 오버라이드", color: "text-orange-300" },
            { indent: 1, name: "browser-polyfill.js", note: "← Mozilla 크로스브라우저 폴리필", color: "text-purple-300" },
            { indent: 1, name: "icons/", note: "", color: "text-yellow-400" },
            { indent: 2, name: "icon16.png", note: "", color: "text-gray-400" },
            { indent: 2, name: "icon32.png", note: "", color: "text-gray-400" },
            { indent: 2, name: "icon48.png", note: "", color: "text-gray-400" },
            { indent: 2, name: "icon128.png", note: "", color: "text-gray-400" },
          ].map((item) => (
            <div key={item.name} style={{ paddingLeft: `${item.indent * 1.5}rem` }}>
              <span className="text-gray-600">{"│  ".repeat(item.indent - 1)}├─ </span>
              <span className={item.color}>{item.name}</span>
              {item.note && <span className="text-gray-600 ml-2">{item.note}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Build tip */}
      <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i className="ri-information-line text-amber-500 text-sm" />
        </div>
        <div className="text-xs text-amber-700 leading-relaxed">
          <strong>빌드 방법:</strong> 위 파일들을 모두 하나의 폴더에 저장 → Chrome: <code className="bg-amber-100 rounded px-1">zip -r extension.zip .</code> 후 CRX로 패키징 / Firefox: <code className="bg-amber-100 rounded px-1">web-ext build</code> 명령으로 .xpi 생성. browser-polyfill.js는 <a href="https://github.com/mozilla/webextension-polyfill/releases" className="underline cursor-pointer" target="_blank" rel="noopener noreferrer">Mozilla 공식 릴리즈</a>에서 다운로드하세요.
        </div>
      </div>
    </div>
  );
}
