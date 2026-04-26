export const MANIFEST_MV3 = `{
  "manifest_version": 3,
  "name": "GoldFireDragon Search",
  "short_name": "GoldFireDragon",
  "version": "1.0.0",
  "description": "GoldFireDragon 검색엔진 설정 · FireDragon 스텔스 UA · JP/KO 지역 최적화 · 추적 차단",
  "author": "GoldFireDragon Team",

  "permissions": [
    "search",
    "storage",
    "tabs",
    "activeTab",
    "omnibox",
    "contextMenus",
    "notifications",
    "alarms"
  ],
  "host_permissions": ["<all_urls>"],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["browser-polyfill.js", "content.js"],
      "css": ["content.css"],
      "run_at": "document_start",
      "all_frames": false
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_title": "GoldFireDragon",
    "default_icon": {
      "16":  "icons/icon16.png",
      "32":  "icons/icon32.png",
      "48":  "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  },

  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },

  "icons": {
    "16":  "icons/icon16.png",
    "32":  "icons/icon32.png",
    "48":  "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "web_accessible_resources": [
    {
      "resources": ["*.html", "*.js", "*.css", "icons/*"],
      "matches": ["<all_urls>"]
    }
  ],

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },

  "browser_specific_settings": {
    "gecko": {
      "id": "goldfiredragon@goldfiredragon.app",
      "strict_min_version": "109.0"
    },
    "gecko_android": {
      "strict_min_version": "113.0"
    }
  },

  "minimum_chrome_version": "88"
}`;

export const MANIFEST_MV2 = `{
  "manifest_version": 2,
  "name": "GoldFireDragon Search",
  "short_name": "GoldFireDragon",
  "version": "1.0.0",
  "description": "GoldFireDragon 검색엔진 설정 · FireDragon 스텔스 UA · JP/KO 지역 최적화 · 추적 차단",
  "author": "GoldFireDragon Team",

  "permissions": [
    "search",
    "storage",
    "tabs",
    "activeTab",
    "omnibox",
    "contextMenus",
    "notifications",
    "alarms",
    "webRequest",
    "webRequestBlocking",
    "<all_urls>"
  ],

  "background": {
    "scripts": ["browser-polyfill.js", "background.js"],
    "persistent": false
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["browser-polyfill.js", "content.js"],
      "css": ["content.css"],
      "run_at": "document_start",
      "all_frames": false
    }
  ],

  "browser_action": {
    "default_popup": "popup.html",
    "default_title": "GoldFireDragon",
    "default_icon": {
      "16":  "icons/icon16.png",
      "32":  "icons/icon32.png",
      "48":  "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "options_ui": {
    "page": "options.html",
    "open_in_tab": true,
    "chrome_style": false,
    "browser_style": true
  },

  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },

  "icons": {
    "16":  "icons/icon16.png",
    "32":  "icons/icon32.png",
    "48":  "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "web_accessible_resources": ["*.html", "*.js", "*.css", "icons/*"],

  "browser_specific_settings": {
    "gecko": {
      "id": "goldfiredragon@goldfiredragon.app",
      "strict_min_version": "57.0"
    },
    "gecko_android": {
      "strict_min_version": "113.0"
    }
  }
}`;

export const BACKGROUND_JS = `// GoldFireDragon Background Service Worker (MV3) / Background Script (MV2)
// Cross-browser compatible via webextension-polyfill

// Universal browser API (polyfill handles chrome.* vs browser.*)
const api = typeof browser !== 'undefined' ? browser : chrome;

const ENGINES = {
  goldfiredragon: 'https://www.google.co.jp/search?q={q}&gl=jp&hl=ko&safe=off',
  google:         'https://www.google.co.jp/search?q={q}&gl=jp&hl=ko',
  presearch:      'https://presearch.com/search?q={q}',
  duckduckgo:     'https://duckduckgo.com/?q={q}&kl=jp-jp',
  brave:          'https://search.brave.com/search?q={q}&lang=ko&country=jp',
  bing:           'https://www.bing.com/search?q={q}&setlang=ko&cc=JP',
};

const FIREDRAGON_UA = 'Mozilla/9.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 ' +
  'FireDragon/135.0 stealth privatebrowsing incognito windowedfullscreen/complete';

const TRACKING_PARAMS = [
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
  'fbclid','gclid','msclkid','mc_eid','yclid','dclid','ref','_hsenc',
];

// ─── Install / Update handler ─────────────────────────────────────────────
api.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await api.storage.local.set({
      engine:            'goldfiredragon',
      enableStealth:     true,
      enableTrackBlock:  true,
      enableNewTab:      true,
      language:          'ko',
      region:            'jp',
      installedAt:       Date.now(),
    });
    // Open welcome page
    api.tabs.create({ url: 'https://goldfiredragon.app' });
  }
  if (reason === 'update') {
    console.log('[GFD] Extension updated to v' + api.runtime.getManifest().version);
  }
});

// ─── Omnibox (address bar search) ─────────────────────────────────────────
if (api.omnibox) {
  api.omnibox.setDefaultSuggestion({ description: 'GoldFireDragon: "%s" 검색하기' });

  api.omnibox.onInputEntered.addListener(async (text, disposition) => {
    const { engine = 'goldfiredragon' } = await api.storage.local.get('engine');
    const template = ENGINES[engine] ?? ENGINES.goldfiredragon;
    const url = template.replace('{q}', encodeURIComponent(text));

    if (disposition === 'currentTab') {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      api.tabs.update(tab.id, { url });
    } else {
      api.tabs.create({ url, active: disposition === 'newForegroundTab' });
    }
  });
}

// ─── Context Menu ──────────────────────────────────────────────────────────
api.contextMenus.create({
  id: 'gfd-search',
  title: 'GoldFireDragon로 "%s" 검색',
  contexts: ['selection'],
});

api.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'gfd-search' && info.selectionText) {
    const { engine = 'goldfiredragon' } = await api.storage.local.get('engine');
    const template = ENGINES[engine] ?? ENGINES.goldfiredragon;
    const url = template.replace('{q}', encodeURIComponent(info.selectionText));
    api.tabs.create({ url });
  }
});

// ─── URL Tracking Cleaner (MV3: via declarativeNetRequest; MV2: webRequest) ─
// MV2 webRequest blocking
if (api.webRequest && api.webRequest.onBeforeRequest) {
  api.webRequest.onBeforeRequest.addListener(
    (details) => {
      try {
        const url = new URL(details.url);
        let changed = false;
        TRACKING_PARAMS.forEach(p => {
          if (url.searchParams.has(p)) { url.searchParams.delete(p); changed = true; }
        });
        if (changed) return { redirectUrl: url.toString() };
      } catch {}
      return {};
    },
    { urls: ['<all_urls>'] },
    ['blocking']
  );
}

// ─── Message handler (from content/popup) ─────────────────────────────────
api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_SETTINGS') {
    api.storage.local.get(null).then(sendResponse);
    return true; // async
  }
  if (msg.type === 'SET_ENGINE') {
    api.storage.local.set({ engine: msg.engine }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'GET_UA') {
    sendResponse({ ua: FIREDRAGON_UA });
  }
});`;

export const CONTENT_JS = `// GoldFireDragon Content Script
// Runs at document_start on all pages

(function () {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;

  // ─── UA Spoofing via Object.defineProperty ────────────────────────────
  api.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
    if (!settings?.enableStealth) return;

    const FIREDRAGON_UA =
      'Mozilla/9.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 ' +
      'FireDragon/135.0 stealth privatebrowsing incognito windowedfullscreen/complete';

    // Override navigator.userAgent (read-only → defineProperty)
    try {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => FIREDRAGON_UA,
        configurable: true,
      });
      Object.defineProperty(navigator, 'appVersion', {
        get: () => FIREDRAGON_UA.replace('Mozilla/', ''),
        configurable: true,
      });
    } catch (e) {
      console.warn('[GFD] UA override failed:', e);
    }
  });

  // ─── Tracking Parameter Removal ──────────────────────────────────────
  const TRACKING_PARAMS = [
    'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
    'fbclid','gclid','msclkid','mc_eid','yclid','dclid','ref','_hsenc',
  ];

  function cleanUrl() {
    try {
      const url = new URL(location.href);
      let changed = false;
      TRACKING_PARAMS.forEach(p => {
        if (url.searchParams.has(p)) { url.searchParams.delete(p); changed = true; }
      });
      if (changed) history.replaceState({}, '', url.toString());
    } catch {}
  }

  cleanUrl();
  window.addEventListener('popstate', cleanUrl);

  // ─── Search page enhancement ──────────────────────────────────────────
  if (location.hostname.includes('google') || location.hostname.includes('goldfiredragon')) {
    document.addEventListener('DOMContentLoaded', () => {
      // Keyboard shortcut: Alt+S → focus search box
      document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 's') {
          const input = document.querySelector('input[name="q"], input[type="search"]');
          if (input) { input.focus(); e.preventDefault(); }
        }
      });
    });
  }
})();`;

export const POPUP_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GoldFireDragon</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <div class="header">
    <span class="logo">🔥 GoldFireDragon</span>
    <span class="version" id="version"></span>
  </div>

  <div class="section">
    <label class="label">검색 엔진</label>
    <select id="engine" class="select">
      <option value="goldfiredragon">🐉 GoldFireDragon (Google JP)</option>
      <option value="presearch">🔭 Presearch</option>
      <option value="duckduckgo">🦆 DuckDuckGo</option>
      <option value="brave">🦁 Brave Search</option>
      <option value="bing">🅱 Bing JP</option>
    </select>
  </div>

  <div class="section toggles">
    <div class="toggle-row">
      <span>스텔스 UA</span>
      <label class="switch"><input type="checkbox" id="enableStealth" /><span></span></label>
    </div>
    <div class="toggle-row">
      <span>추적 차단</span>
      <label class="switch"><input type="checkbox" id="enableTrackBlock" /><span></span></label>
    </div>
    <div class="toggle-row">
      <span>새 탭 커스텀</span>
      <label class="switch"><input type="checkbox" id="enableNewTab" /><span></span></label>
    </div>
  </div>

  <div class="footer">
    <a href="options.html" target="_blank" id="optionsLink">⚙ 설정</a>
    <a href="https://goldfiredragon.app" target="_blank">홈</a>
  </div>

  <script src="browser-polyfill.js"></script>
  <script src="popup.js"></script>
</body>
</html>`;

export const POPUP_JS = `// GoldFireDragon Popup Script
const api = typeof browser !== 'undefined' ? browser : chrome;

async function load() {
  const settings = await api.storage.local.get([
    'engine', 'enableStealth', 'enableTrackBlock', 'enableNewTab'
  ]);

  document.getElementById('engine').value = settings.engine ?? 'goldfiredragon';
  document.getElementById('enableStealth').checked = settings.enableStealth ?? true;
  document.getElementById('enableTrackBlock').checked = settings.enableTrackBlock ?? true;
  document.getElementById('enableNewTab').checked = settings.enableNewTab ?? true;
  document.getElementById('version').textContent = 'v' + api.runtime.getManifest().version;
}

document.getElementById('engine').addEventListener('change', (e) => {
  api.storage.local.set({ engine: e.target.value });
});

['enableStealth', 'enableTrackBlock', 'enableNewTab'].forEach(id => {
  document.getElementById(id).addEventListener('change', (e) => {
    api.storage.local.set({ [id]: e.target.checked });
  });
});

load();`;

export const BROWSER_POLYFILL_NOTE = `// webextension-polyfill (Mozilla)
// 파일: browser-polyfill.js
//
// 이 파일은 Mozilla의 공식 webextension-polyfill 라이브러리입니다.
// Chrome(chrome.*)과 Firefox(browser.*)의 API 차이를 통일해줍니다.
//
// 다운로드: https://github.com/mozilla/webextension-polyfill/releases
// CDN: https://unpkg.com/webextension-polyfill/dist/browser-polyfill.min.js
//
// 빌드된 확장 프로그램에는 이 파일이 자동으로 포함됩니다.
// 아래는 핵심 동작 원리 요약입니다.

if (typeof globalThis.browser === 'undefined' || !globalThis.browser.runtime) {
  // Chrome API를 Promise 기반 browser.* API로 래핑
  globalThis.browser = {
    runtime:     wrapAPI(chrome.runtime),
    storage:     wrapAPI(chrome.storage),
    tabs:        wrapAPI(chrome.tabs),
    contextMenus:wrapAPI(chrome.contextMenus),
    omnibox:     wrapAPI(chrome.omnibox),
    // ... (실제 파일은 2000줄+, 전체 API 커버)
  };
}

function wrapAPI(api) {
  // chrome.* 콜백 → Promise 변환
  return new Proxy(api, {
    get(target, prop) {
      const orig = target[prop];
      if (typeof orig !== 'function') return orig;
      return (...args) => new Promise((resolve, reject) => {
        orig.call(target, ...args, (result) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(result);
        });
      });
    }
  });
}`;

export const CONTENT_CSS = `/* GoldFireDragon Content CSS */

/* GFD 툴바 (검색 페이지에 주입) */
.gfd-toolbar {
  position: fixed !important;
  bottom: 70px !important;
  right: 16px !important;
  z-index: 2147483647 !important;
  background: rgba(0,0,0,0.85) !important;
  border-radius: 12px !important;
  padding: 8px 12px !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  font-size: 12px !important;
  color: #fff !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
  backdrop-filter: blur(10px) !important;
}

.gfd-toolbar a {
  color: #fbbf24 !important;
  text-decoration: none !important;
}

/* 추적 파라미터 제거 알림 (잠깐 보임) */
.gfd-clean-badge {
  position: fixed !important;
  top: 12px !important;
  right: 12px !important;
  z-index: 2147483647 !important;
  background: #22c55e !important;
  color: #fff !important;
  border-radius: 8px !important;
  padding: 6px 12px !important;
  font-size: 11px !important;
  font-family: -apple-system, sans-serif !important;
  animation: gfd-fadeout 2.5s forwards !important;
}

@keyframes gfd-fadeout {
  0%   { opacity: 1; transform: translateY(0); }
  70%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}`;

export const NEWTAB_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>GoldFireDragon - 새 탭</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0f0f0f;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .logo { font-size: 3rem; margin-bottom: 0.5rem; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; color: #fbbf24; }
    .search-wrap {
      display: flex;
      width: min(640px, 90vw);
      border-radius: 999px;
      overflow: hidden;
      border: 2px solid #333;
      background: #1a1a1a;
    }
    input {
      flex: 1;
      background: transparent;
      border: none;
      padding: 14px 20px;
      font-size: 1rem;
      color: #fff;
      outline: none;
    }
    button {
      background: #f59e0b;
      border: none;
      padding: 0 24px;
      cursor: pointer;
      font-size: 1.2rem;
    }
    .engines {
      display: flex;
      gap: 12px;
      margin-top: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .eng-btn {
      background: #1a1a1a;
      border: 1px solid #333;
      color: #aaa;
      padding: 6px 14px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
    }
    .eng-btn:hover, .eng-btn.active { background: #f59e0b; color: #000; border-color: #f59e0b; }
  </style>
</head>
<body>
  <div class="logo">🔥</div>
  <h1>GoldFireDragon</h1>
  <form class="search-wrap" id="searchForm">
    <input type="text" id="q" placeholder="검색어 입력..." autofocus autocomplete="off" />
    <button type="submit">🔍</button>
  </form>
  <div class="engines">
    <button class="eng-btn active" data-engine="goldfiredragon">🐉 GFD</button>
    <button class="eng-btn" data-engine="presearch">🔭 Presearch</button>
    <button class="eng-btn" data-engine="duckduckgo">🦆 DDG</button>
    <button class="eng-btn" data-engine="brave">🦁 Brave</button>
    <button class="eng-btn" data-engine="bing">🅱 Bing</button>
  </div>
  <script src="browser-polyfill.js"></script>
  <script>
    const api = typeof browser !== 'undefined' ? browser : chrome;
    const ENGINES = {
      goldfiredragon: 'https://www.google.co.jp/search?q={q}&gl=jp&hl=ko&safe=off',
      presearch: 'https://presearch.com/search?q={q}',
      duckduckgo: 'https://duckduckgo.com/?q={q}',
      brave: 'https://search.brave.com/search?q={q}',
      bing: 'https://www.bing.com/search?q={q}&setlang=ko&cc=JP',
    };
    let activeEngine = 'goldfiredragon';
    document.querySelectorAll('.eng-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.eng-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeEngine = btn.dataset.engine;
        api.storage.local.set({ engine: activeEngine });
      });
    });
    api.storage.local.get('engine').then(({ engine }) => {
      if (engine) {
        activeEngine = engine;
        document.querySelector(\`[data-engine="\${engine}"]\`)?.classList.add('active');
      }
    });
    document.getElementById('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = document.getElementById('q').value.trim();
      if (q) location.href = ENGINES[activeEngine].replace('{q}', encodeURIComponent(q));
    });
  </script>
</body>
</html>`;
