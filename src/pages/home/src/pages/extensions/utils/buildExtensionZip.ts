// Extension zip builder utility
// Generates realistic browser extension package files for download

export type BuildType = "mv3" | "mv2";

export interface ZipManifest {
  name: string;
  version: string;
  description: string;
  [key: string]: unknown;
}

function buildManifestMV3(): string {
  const manifest = {
    manifest_version: 3,
    name: "GoldFireDragon",
    version: "1.0.0",
    description: "GoldFireDragon 검색 확장 프로그램 — FireDragon 스텔스 UA, 추적 차단, 5가지 검색엔진, 커스텀 새 탭",
    icons: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
    action: {
      default_popup: "popup/popup.html",
      default_icon: { "16": "icons/icon16.png", "48": "icons/icon48.png" },
      default_title: "GoldFireDragon",
    },
    background: { service_worker: "background.js", type: "module" },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_start",
      },
    ],
    options_ui: { page: "options/options.html", open_in_tab: true },
    chrome_url_overrides: { newtab: "newtab/newtab.html" },
    permissions: ["storage", "tabs", "contextMenus", "scripting"],
    host_permissions: ["<all_urls>"],
    omnibox: { keyword: "gfd" },
    commands: {
      "focus-search": {
        suggested_key: { default: "Alt+S", mac: "Alt+S" },
        description: "검색창 포커스",
      },
      "go-back": {
        suggested_key: { default: "Alt+H", mac: "Alt+H" },
        description: "뒤로가기",
      },
      _execute_action: {
        suggested_key: { default: "Ctrl+Shift+G", mac: "Command+Shift+G" },
      },
    },
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'",
    },
  };
  return JSON.stringify(manifest, null, 2);
}

function buildManifestMV2(): string {
  const manifest = {
    manifest_version: 2,
    name: "GoldFireDragon",
    version: "1.0.0",
    description: "GoldFireDragon 검색 확장 프로그램 — FireDragon 스텔스 UA, 추적 차단, 5가지 검색엔진, 커스텀 새 탭",
    icons: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
    browser_action: {
      default_popup: "popup/popup.html",
      default_icon: { "16": "icons/icon16.png", "48": "icons/icon48.png" },
      default_title: "GoldFireDragon",
    },
    background: { scripts: ["background-mv2.js"], persistent: false },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_start",
      },
    ],
    options_ui: { page: "options/options.html", open_in_tab: true },
    chrome_url_overrides: { newtab: "newtab/newtab.html" },
    permissions: [
      "storage",
      "tabs",
      "contextMenus",
      "<all_urls>",
      "webRequest",
      "webRequestBlocking",
    ],
    omnibox: { keyword: "gfd" },
    commands: {
      "focus-search": {
        suggested_key: { default: "Alt+S", mac: "Alt+S" },
        description: "검색창 포커스",
      },
      "go-back": {
        suggested_key: { default: "Alt+H", mac: "Alt+H" },
        description: "뒤로가기",
      },
      _execute_browser_action: {
        suggested_key: { default: "Ctrl+Shift+G", mac: "Command+Shift+G" },
      },
    },
    content_security_policy:
      "script-src 'self'; object-src 'self'",
    browser_specific_settings: {
      gecko: {
        id: "goldfiredragon@goldfiredragon.com",
        strict_min_version: "109.0",
      },
    },
  };
  return JSON.stringify(manifest, null, 2);
}

function buildBackgroundMV3(): string {
  return `// GoldFireDragon — background service worker (MV3)
// Handles context menus, omnibox, storage, and messaging

const SEARCH_ENGINES = {
  goldfiredragon: 'https://goldfiredragon.com/search?q=',
  presearch:      'https://presearch.com/search?q=',
  duckduckgo:     'https://duckduckgo.com/?q=',
  brave:          'https://search.brave.com/search?q=',
  bing:           'https://www.bing.com/search?q=',
};

// Default settings
const DEFAULT_SETTINGS = {
  defaultEngine:   'goldfiredragon',
  stealthUA:       true,
  trackingBlock:   true,
  customNewtab:    true,
  safeSearch:      'moderate',
  omniboxSearch:   true,
  contextMenu:     true,
  darkModeUI:      true,
  showPageToolbar: true,
};

// Initialize storage with defaults
chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.sync.get(null);
  const merged = { ...DEFAULT_SETTINGS, ...existing };
  await chrome.storage.sync.set(merged);

  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  }

  setupContextMenu();
});

// Context menu
function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id:       'gfd-search',
      title:    'GoldFireDragon으로 검색: "%s"',
      contexts: ['selection'],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'gfd-search' && info.selectionText) {
    const { defaultEngine } = await chrome.storage.sync.get('defaultEngine');
    const base = SEARCH_ENGINES[defaultEngine] || SEARCH_ENGINES.goldfiredragon;
    chrome.tabs.create({ url: base + encodeURIComponent(info.selectionText) });
  }
});

// Omnibox
chrome.omnibox.onInputEntered.addListener(async (text) => {
  const { defaultEngine } = await chrome.storage.sync.get('defaultEngine');
  const base = SEARCH_ENGINES[defaultEngine] || SEARCH_ENGINES.goldfiredragon;
  chrome.tabs.update({ url: base + encodeURIComponent(text) });
});

// Keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'go-back') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func:   () => window.history.back(),
      });
    });
  }
});

// Message handler
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(null).then(sendResponse);
    return true;
  }
  if (msg.type === 'SET_SETTINGS') {
    chrome.storage.sync.set(msg.data).then(() => sendResponse({ ok: true }));
    return true;
  }
});
`;
}

function buildBackgroundMV2(): string {
  return `// GoldFireDragon — background script (MV2 / Firefox)
// Handles context menus, omnibox, webRequest UA spoofing, and messaging

const SEARCH_ENGINES = {
  goldfiredragon: 'https://goldfiredragon.com/search?q=',
  presearch:      'https://presearch.com/search?q=',
  duckduckgo:     'https://duckduckgo.com/?q=',
  brave:          'https://search.brave.com/search?q=',
  bing:           'https://www.bing.com/search?q=',
};

const DEFAULT_SETTINGS = {
  defaultEngine:   'goldfiredragon',
  stealthUA:       true,
  trackingBlock:   true,
  customNewtab:    true,
  safeSearch:      'moderate',
  omniboxSearch:   true,
  contextMenu:     true,
  darkModeUI:      true,
  showPageToolbar: true,
};

let settings = { ...DEFAULT_SETTINGS };

// Initialize
browser.storage.sync.get(null).then((stored) => {
  settings = { ...DEFAULT_SETTINGS, ...stored };
  setupContextMenu();
  setupWebRequest();
});

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    browser.tabs.create({ url: browser.runtime.getURL('welcome/welcome.html') });
  }
});

// Context menu
function setupContextMenu() {
  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({
      id:       'gfd-search',
      title:    'GoldFireDragon으로 검색: "%s"',
      contexts: ['selection'],
    });
  });
}

browser.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'gfd-search' && info.selectionText) {
    const base = SEARCH_ENGINES[settings.defaultEngine] || SEARCH_ENGINES.goldfiredragon;
    browser.tabs.create({ url: base + encodeURIComponent(info.selectionText) });
  }
});

// Omnibox
browser.omnibox.onInputEntered.addListener((text) => {
  const base = SEARCH_ENGINES[settings.defaultEngine] || SEARCH_ENGINES.goldfiredragon;
  browser.tabs.update({ url: base + encodeURIComponent(text) });
});

// WebRequest — UA spoofing (MV2 only)
const STEALTH_UA = 'Mozilla/5.0 (Windows NT 10.0; rv:125.0) Gecko/20100101 Firefox/125.0';

function setupWebRequest() {
  if (!settings.stealthUA) return;
  browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      const headers = details.requestHeaders.map((h) =>
        h.name.toLowerCase() === 'user-agent' ? { ...h, value: STEALTH_UA } : h
      );
      return { requestHeaders: headers };
    },
    { urls: ['<all_urls>'] },
    ['blocking', 'requestHeaders']
  );
}

// Message handler
browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'GET_SETTINGS') return Promise.resolve(settings);
  if (msg.type === 'SET_SETTINGS') {
    Object.assign(settings, msg.data);
    return browser.storage.sync.set(msg.data).then(() => ({ ok: true }));
  }
});
`;
}

function buildContentScript(): string {
  return `// GoldFireDragon — content script
// Runs on all pages at document_start

(function () {
  'use strict';

  // --- Stealth UA via Object.defineProperty ---
  const STEALTH_UA = 'Mozilla/5.0 (Windows NT 10.0; rv:125.0) Gecko/20100101 Firefox/125.0';

  function applyStealthUA() {
    try {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => STEALTH_UA,
        configurable: false,
      });
    } catch (_) {
      // Already defined / non-configurable in some browsers
    }
  }

  // --- Tracking parameter removal ---
  const TRACKING_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'gclsrc', 'msclkid', 'mc_eid', 'mc_cid',
    '_ga', '_gl', 'ref', 'referrer', 'source', 'igshid',
  ];

  function removeTrackingParams() {
    const url = new URL(window.location.href);
    let changed = false;
    TRACKING_PARAMS.forEach((p) => {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        changed = true;
      }
    });
    if (changed) {
      window.history.replaceState(null, '', url.toString());
    }
  }

  // --- Keyboard shortcuts ---
  function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt+S: focus first visible search input
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const input = document.querySelector('input[type="search"], input[type="text"]');
        if (input) input.focus();
      }
      // Alt+H: go back
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.history.back();
      }
    });
  }

  // --- Init ---
  chrome.storage.sync.get(['stealthUA', 'trackingBlock'], (cfg) => {
    if (cfg.stealthUA !== false) applyStealthUA();
    if (cfg.trackingBlock !== false) removeTrackingParams();
  });
  setupShortcuts();
})();
`;
}

function buildPopupHTML(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GoldFireDragon</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <div class="popup">
    <header class="header">
      <div class="logo">
        <span class="flame">🔥</span>
        <span class="brand">GoldFireDragon</span>
      </div>
      <button id="btnOptions" title="설정" aria-label="설정 열기">⚙️</button>
    </header>

    <div class="search-wrap">
      <input type="text" id="searchInput" placeholder="검색어를 입력하세요..." autocomplete="off" />
      <button id="btnSearch" aria-label="검색">→</button>
    </div>

    <section class="engines">
      <p class="section-label">검색엔진</p>
      <div class="engine-list" id="engineList"></div>
    </section>

    <section class="toggles">
      <p class="section-label">빠른 설정</p>
      <div class="toggle-row">
        <label for="togStealth">스텔스 UA</label>
        <input type="checkbox" id="togStealth" role="switch" />
      </div>
      <div class="toggle-row">
        <label for="togTracking">추적 차단</label>
        <input type="checkbox" id="togTracking" role="switch" />
      </div>
      <div class="toggle-row">
        <label for="togNewtab">커스텀 새 탭</label>
        <input type="checkbox" id="togNewtab" role="switch" />
      </div>
    </section>

    <footer class="footer">
      <a id="linkHome" href="#">홈</a>
      <a id="linkOptions" href="#">옵션</a>
      <a id="linkManager" href="#">관리자</a>
    </footer>
  </div>
  <script src="popup.js"></script>
</body>
</html>`;
}

function buildPopupCSS(): string {
  return `/* GoldFireDragon Popup Styles */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  width: 320px;
  font-family: 'Inter', system-ui, sans-serif;
  background: #0f0f0f;
  color: #f0f0f0;
  font-size: 13px;
}

.popup { display: flex; flex-direction: column; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #222;
}

.logo { display: flex; align-items: center; gap: 6px; }
.flame { font-size: 16px; }
.brand { font-weight: 700; font-size: 14px; background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.header button { background: none; border: none; cursor: pointer; font-size: 16px; opacity: .7; transition: opacity .15s; }
.header button:hover { opacity: 1; }

.search-wrap {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid #222;
}

.search-wrap input {
  flex: 1;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #f0f0f0;
  padding: 7px 10px;
  font-size: 13px;
  outline: none;
  transition: border-color .15s;
}
.search-wrap input:focus { border-color: #f59e0b; }

.search-wrap button {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border: none;
  border-radius: 8px;
  color: white;
  width: 34px;
  cursor: pointer;
  font-size: 15px;
  transition: opacity .15s;
}
.search-wrap button:hover { opacity: .9; }

section { padding: 10px 14px; border-bottom: 1px solid #1a1a1a; }

.section-label { font-size: 10px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }

.engine-list { display: flex; flex-direction: column; gap: 4px; }

.engine-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s;
  border: 1px solid transparent;
}
.engine-item:hover { background: #1a1a1a; }
.engine-item.active { background: #1a1a1a; border-color: #f59e0b44; }

.engine-dot { width: 8px; height: 8px; border-radius: 50%; background: #333; transition: background .15s; }
.engine-item.active .engine-dot { background: #f59e0b; }
.engine-name { font-size: 12px; color: #ccc; }
.engine-item.active .engine-name { color: #f0f0f0; font-weight: 500; }

.toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
.toggle-row label { font-size: 12px; color: #aaa; cursor: pointer; }

input[type="checkbox"][role="switch"] {
  -webkit-appearance: none;
  width: 36px;
  height: 20px;
  background: #333;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: background .2s;
}
input[type="checkbox"][role="switch"]:checked { background: #f59e0b; }
input[type="checkbox"][role="switch"]::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: white;
  transition: transform .2s;
}
input[type="checkbox"][role="switch"]:checked::after { transform: translateX(16px); }

.footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 10px 14px;
}
.footer a { color: #666; text-decoration: none; font-size: 11px; transition: color .15s; }
.footer a:hover { color: #f59e0b; }
`;
}

function buildPopupJS(): string {
  return `// GoldFireDragon Popup Script

const ENGINES = [
  { id: 'goldfiredragon', name: 'GoldFireDragon', url: 'https://goldfiredragon.com/search?q=' },
  { id: 'presearch',      name: 'Presearch',      url: 'https://presearch.com/search?q=' },
  { id: 'duckduckgo',     name: 'DuckDuckGo',     url: 'https://duckduckgo.com/?q=' },
  { id: 'brave',          name: 'Brave Search',   url: 'https://search.brave.com/search?q=' },
  { id: 'bing',           name: 'Bing',            url: 'https://www.bing.com/search?q=' },
];

let currentEngine = 'goldfiredragon';

async function loadSettings() {
  const s = await chrome.storage.sync.get(['defaultEngine', 'stealthUA', 'trackingBlock', 'customNewtab']);
  currentEngine = s.defaultEngine || 'goldfiredragon';
  document.getElementById('togStealth').checked  = s.stealthUA   !== false;
  document.getElementById('togTracking').checked = s.trackingBlock !== false;
  document.getElementById('togNewtab').checked   = s.customNewtab  !== false;
  renderEngines();
}

function renderEngines() {
  const list = document.getElementById('engineList');
  list.innerHTML = ENGINES.map((e) =>
    '<div class="engine-item' + (e.id === currentEngine ? ' active' : '') + '" data-id="' + e.id + '">' +
    '<div class="engine-dot"></div>' +
    '<span class="engine-name">' + e.name + '</span>' +
    '</div>'
  ).join('');
  list.querySelectorAll('.engine-item').forEach((el) => {
    el.addEventListener('click', () => selectEngine(el.dataset.id));
  });
}

function selectEngine(id) {
  currentEngine = id;
  chrome.storage.sync.set({ defaultEngine: id });
  renderEngines();
}

function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  const engine = ENGINES.find((e) => e.id === currentEngine) || ENGINES[0];
  chrome.tabs.create({ url: engine.url + encodeURIComponent(q) });
  window.close();
}

document.getElementById('btnSearch').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

document.getElementById('togStealth').addEventListener('change', (e) =>
  chrome.storage.sync.set({ stealthUA: e.target.checked })
);
document.getElementById('togTracking').addEventListener('change', (e) =>
  chrome.storage.sync.set({ trackingBlock: e.target.checked })
);
document.getElementById('togNewtab').addEventListener('change', (e) =>
  chrome.storage.sync.set({ customNewtab: e.target.checked })
);

document.getElementById('btnOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

document.getElementById('linkOptions').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
});
document.getElementById('linkManager').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://goldfiredragon.com/extensions' });
  window.close();
});
document.getElementById('linkHome').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://goldfiredragon.com' });
  window.close();
});

loadSettings();
document.getElementById('searchInput').focus();
`;
}

function buildOptionsHTML(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GoldFireDragon 옵션</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #f8f9fa; color: #1a1a1a; font-size: 14px; }
    .page { max-width: 680px; margin: 0 auto; padding: 40px 24px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: #888; font-size: 13px; margin-bottom: 32px; }
    .section { background: white; border: 1px solid #eee; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 16px; }
    .setting-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
    .setting-row:last-child { border-bottom: none; padding-bottom: 0; }
    .setting-label { font-size: 14px; font-weight: 500; }
    .setting-desc { font-size: 12px; color: #aaa; margin-top: 2px; }
    select { background: #f5f5f5; border: 1px solid #eee; border-radius: 8px; padding: 6px 10px; font-size: 13px; cursor: pointer; }
    input[type="checkbox"] { width: 40px; height: 22px; -webkit-appearance: none; background: #ddd; border-radius: 11px; position: relative; cursor: pointer; transition: background .2s; }
    input[type="checkbox"]:checked { background: #f59e0b; }
    input[type="checkbox"]::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: white; transition: transform .2s; }
    input[type="checkbox"]:checked::after { transform: translateX(18px); }
    .save-btn { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; border: none; border-radius: 10px; padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer; display: block; width: 100%; margin-top: 8px; transition: opacity .15s; }
    .save-btn:hover { opacity: .9; }
    .saved-msg { text-align: center; color: #10b981; font-size: 13px; margin-top: 8px; display: none; }
  </style>
</head>
<body>
<div class="page">
  <h1>GoldFireDragon 옵션</h1>
  <p class="subtitle">검색엔진, 프라이버시, 기능, 외관을 설정하세요</p>

  <div class="section">
    <p class="section-title">검색</p>
    <div class="setting-row">
      <div>
        <p class="setting-label">기본 검색엔진</p>
        <p class="setting-desc">팝업 및 Omnibox에서 사용할 기본 검색엔진</p>
      </div>
      <select id="defaultEngine">
        <option value="goldfiredragon">GoldFireDragon</option>
        <option value="presearch">Presearch</option>
        <option value="duckduckgo">DuckDuckGo</option>
        <option value="brave">Brave Search</option>
        <option value="bing">Bing</option>
      </select>
    </div>
    <div class="setting-row">
      <div>
        <p class="setting-label">세이프서치</p>
        <p class="setting-desc">성인 콘텐츠 필터링 수준</p>
      </div>
      <select id="safeSearch">
        <option value="off">끄기</option>
        <option value="moderate">보통</option>
        <option value="strict">엄격</option>
      </select>
    </div>
  </div>

  <div class="section">
    <p class="section-title">프라이버시</p>
    <div class="setting-row">
      <div>
        <p class="setting-label">FireDragon 스텔스 UA</p>
        <p class="setting-desc">User-Agent를 FireDragon 스텔스 값으로 오버라이드</p>
      </div>
      <input type="checkbox" id="stealthUA" />
    </div>
    <div class="setting-row">
      <div>
        <p class="setting-label">URL 추적 파라미터 제거</p>
        <p class="setting-desc">UTM, fbclid, gclid 등 추적 파라미터 자동 제거</p>
      </div>
      <input type="checkbox" id="trackingBlock" />
    </div>
  </div>

  <div class="section">
    <p class="section-title">기능</p>
    <div class="setting-row">
      <div>
        <p class="setting-label">커스텀 새 탭 페이지</p>
        <p class="setting-desc">브라우저 새 탭을 GoldFireDragon 페이지로 교체</p>
      </div>
      <input type="checkbox" id="customNewtab" />
    </div>
    <div class="setting-row">
      <div>
        <p class="setting-label">컨텍스트 메뉴 검색</p>
        <p class="setting-desc">텍스트 선택 후 우클릭 메뉴에 검색 항목 추가</p>
      </div>
      <input type="checkbox" id="contextMenu" />
    </div>
    <div class="setting-row">
      <div>
        <p class="setting-label">Omnibox 키워드 (gfd)</p>
        <p class="setting-desc">주소창에 gfd + Tab으로 GoldFireDragon 검색 활성화</p>
      </div>
      <input type="checkbox" id="omniboxSearch" />
    </div>
  </div>

  <div class="section">
    <p class="section-title">외관</p>
    <div class="setting-row">
      <div>
        <p class="setting-label">팝업 다크 모드 UI</p>
        <p class="setting-desc">팝업 패널을 다크 테마로 표시</p>
      </div>
      <input type="checkbox" id="darkModeUI" />
    </div>
  </div>

  <button class="save-btn" id="saveBtn">설정 저장</button>
  <p class="saved-msg" id="savedMsg">✓ 설정이 저장되었습니다!</p>
</div>
<script src="options.js"></script>
</body>
</html>`;
}

function buildOptionsJS(): string {
  return `// GoldFireDragon Options Script
const FIELDS = ['defaultEngine', 'safeSearch', 'stealthUA', 'trackingBlock', 'customNewtab', 'contextMenu', 'omniboxSearch', 'darkModeUI'];

async function loadSettings() {
  const s = await chrome.storage.sync.get(FIELDS);
  if (s.defaultEngine)  document.getElementById('defaultEngine').value = s.defaultEngine;
  if (s.safeSearch)     document.getElementById('safeSearch').value = s.safeSearch;
  FIELDS.slice(2).forEach((k) => {
    const el = document.getElementById(k);
    if (el && el.type === 'checkbox') el.checked = s[k] !== false;
  });
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  const data = {};
  FIELDS.forEach((k) => {
    const el = document.getElementById(k);
    if (el) data[k] = el.type === 'checkbox' ? el.checked : el.value;
  });
  await chrome.storage.sync.set(data);
  const msg = document.getElementById('savedMsg');
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 2500);
});

loadSettings();
`;
}

function buildReadme(type: BuildType): string {
  const ext = type === "mv3" ? ".crx (Chrome/Edge/Brave/Kiwi)" : ".xpi (Firefox)";
  return `# GoldFireDragon Browser Extension

Version: 1.0.0
Type: Manifest ${type === "mv3" ? "V3" : "V2"} — ${ext}

## 파일 구성

- manifest.json         — 확장 프로그램 매니페스트
- background.js         — 백그라운드 서비스 워커 ${type === "mv3" ? "(MV3)" : "/ 백그라운드 스크립트 (MV2)"}
- content.js            — 콘텐츠 스크립트 (모든 페이지)
- popup/                — 팝업 UI (popup.html / popup.js / popup.css)
- options/              — 옵션 페이지 (options.html / options.js)
- newtab/               — 새 탭 페이지 (newtab.html)
- icons/                — 확장 프로그램 아이콘 (16/32/48/128px)

## 로컬 설치 방법

### Chrome / Edge / Brave
1. chrome://extensions/ 열기
2. 개발자 모드 ON
3. "압축 해제된 확장 프로그램 로드" → 이 폴더 선택

### Firefox
1. about:debugging#/runtime/this-firefox 열기
2. "임시 부가 기능 로드" → manifest.json 선택

## 공식 스토어
- Chrome Web Store: https://chrome.google.com/webstore
- Firefox AMO:      https://addons.mozilla.org

## 저작권
© 2024 GoldFireDragon. All rights reserved.
`;
}

// Small base64-encoded 16x16 orange fire icon (PNG)
const ICON_BASE64_16 =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AkBCCkGaJfFzQAAAJtJREFUOMutkjEOwjAMRZ8DuQAdWLkBHICRC3AHLsLIAbiCA3AAlg7sTkKqKnVp4kkZSv6zn+0fAwCApgEWwBe4AHtgBWwzJUkCSmBjJUnqgB1QA2tJ0kpSl6SQJGVJUrqkNEnKkiRJSZKUJUnKkiRJSZKUJUnKkiRJSZKUJUnKkiRJSZKUJUnKkiRJSZKUJUnKkiT/kzsGJBUXt5d6OQAAAABJRU5ErkJggg==";

export async function buildExtensionZip(type: BuildType): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // Root files
  zip.file("manifest.json", type === "mv3" ? buildManifestMV3() : buildManifestMV2());
  zip.file(type === "mv3" ? "background.js" : "background-mv2.js", type === "mv3" ? buildBackgroundMV3() : buildBackgroundMV2());
  zip.file("content.js", buildContentScript());
  zip.file("README.md", buildReadme(type));

  // Popup folder
  const popup = zip.folder("popup")!;
  popup.file("popup.html", buildPopupHTML());
  popup.file("popup.css", buildPopupCSS());
  popup.file("popup.js", buildPopupJS());

  // Options folder
  const options = zip.folder("options")!;
  options.file("options.html", buildOptionsHTML());
  options.file("options.js", buildOptionsJS());

  // Newtab folder (stub pointing to GoldFireDragon)
  const newtab = zip.folder("newtab")!;
  newtab.file("newtab.html", `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=https://goldfiredragon.com/extension-newtab" />
  <title>GoldFireDragon 새 탭</title>
  <style>body{margin:0;background:#0a0a0a;display:flex;align-items:center;justify-content:center;height:100vh;}</style>
</head>
<body>
  <p style="color:#666;font-family:system-ui;font-size:14px;">GoldFireDragon 로딩 중...</p>
  <script>
    // Full newtab app loaded from GoldFireDragon CDN
    window.location.replace('https://goldfiredragon.com/extension-newtab');
  <\/script>
</body>
</html>`);

  // Icons folder — use same placeholder data
  const icons = zip.folder("icons")!;
  const iconData = ICON_BASE64_16;
  icons.file("icon16.png", iconData, { base64: true });
  icons.file("icon32.png", iconData, { base64: true });
  icons.file("icon48.png", iconData, { base64: true });
  icons.file("icon128.png", iconData, { base64: true });

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
