export interface ExtensionItem {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  icon: string;
  iconBg: string;
  permissions: string[];
  hostPermissions: string[];
  size: string;
  author: string;
  category: string;
  rating: number;
  installs: string;
  official?: boolean;
  devMode?: boolean;
  hasError?: boolean;
  errorMsg?: string;
  updateAvailable?: boolean;
  shortcut?: string;
}

export interface UserScript {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  matchUrls: string[];
  excludeUrls: string[];
  runAt: "document-start" | "document-end" | "document-idle";
  grants: string[];
  code: string;
  lastModified: string;
  runCount: number;
}

export const mockInstalledExtensions: ExtensionItem[] = [
  {
    id: "goldfiredragon-search",
    name: "GoldFireDragon Search",
    description: "기본 검색엔진을 GoldFireDragon으로 설정하고 FireDragon 스텔스 UA를 자동 적용합니다.",
    version: "1.0.0",
    enabled: true,
    icon: "ri-fire-line",
    iconBg: "from-yellow-400 to-red-500",
    permissions: ["search", "tabs", "storage", "activeTab"],
    hostPermissions: ["*://goldfiredragon.app/*", "*://www.google.co.jp/*"],
    size: "42KB",
    author: "GoldFireDragon Team",
    category: "search",
    rating: 5.0,
    installs: "12.4K",
    official: true,
    shortcut: "Ctrl+Shift+G",
  },
  {
    id: "ublock-origin",
    name: "uBlock Origin",
    description: "가장 효율적인 광고 차단기. CPU와 메모리를 가장 적게 사용합니다.",
    version: "1.57.2",
    enabled: true,
    icon: "ri-shield-line",
    iconBg: "from-red-500 to-red-600",
    permissions: ["webRequest", "webRequestBlocking", "storage", "tabs"],
    hostPermissions: ["<all_urls>"],
    size: "2.1MB",
    author: "Raymond Hill",
    category: "privacy",
    rating: 4.9,
    installs: "38M",
    official: false,
  },
  {
    id: "darkreader",
    name: "Dark Reader",
    description: "모든 웹사이트에 다크 모드 적용. 눈의 피로를 줄여줍니다.",
    version: "4.9.88",
    enabled: false,
    icon: "ri-moon-line",
    iconBg: "from-gray-700 to-gray-900",
    permissions: ["storage", "tabs", "activeTab"],
    hostPermissions: ["<all_urls>"],
    size: "780KB",
    author: "Alexander Shutau",
    category: "accessibility",
    rating: 4.7,
    installs: "5.2M",
    official: false,
    updateAvailable: true,
  },
  {
    id: "tampermonkey",
    name: "Tampermonkey",
    description: "유저스크립트 관리자. 웹사이트에 커스텀 스크립트를 실행합니다.",
    version: "5.1.1",
    enabled: true,
    icon: "ri-code-s-slash-line",
    iconBg: "from-gray-800 to-black",
    permissions: ["storage", "tabs", "webRequest", "contextMenus", "notifications"],
    hostPermissions: ["<all_urls>"],
    size: "1.4MB",
    author: "Jan Biniok",
    category: "dev",
    rating: 4.8,
    installs: "10M",
    official: false,
  },
  {
    id: "bitwarden",
    name: "Bitwarden",
    description: "무료 오픈소스 비밀번호 관리자. 안전하게 비밀번호를 저장하고 자동 입력합니다.",
    version: "2024.11.0",
    enabled: true,
    icon: "ri-lock-2-line",
    iconBg: "from-blue-500 to-blue-700",
    permissions: ["storage", "tabs", "activeTab", "contextMenus", "alarms"],
    hostPermissions: ["<all_urls>"],
    size: "14.2MB",
    author: "Bitwarden Inc.",
    category: "security",
    rating: 4.8,
    installs: "3.1M",
    official: false,
    hasError: false,
    shortcut: "Ctrl+Shift+L",
  },
  {
    id: "privacy-badger",
    name: "Privacy Badger",
    description: "EFF의 프라이버시 도구. 사용자 동의 없이 추적하는 스크립트를 자동 차단합니다.",
    version: "2024.7.17",
    enabled: true,
    icon: "ri-spy-line",
    iconBg: "from-green-500 to-green-700",
    permissions: ["webRequest", "webRequestBlocking", "storage", "tabs"],
    hostPermissions: ["<all_urls>"],
    size: "1.9MB",
    author: "Electronic Frontier Foundation",
    category: "privacy",
    rating: 4.6,
    installs: "1.2M",
    official: false,
  },
];

export const mockStoreExtensions: ExtensionItem[] = [
  {
    id: "vimium",
    name: "Vimium",
    description: "키보드만으로 브라우저를 완전히 조작. Vim 스타일의 단축키를 제공합니다.",
    version: "2.1.2",
    enabled: false,
    icon: "ri-keyboard-line",
    iconBg: "from-gray-600 to-gray-800",
    permissions: ["tabs", "storage"],
    hostPermissions: ["<all_urls>"],
    size: "240KB",
    author: "Phil Crosby",
    category: "productivity",
    rating: 4.7,
    installs: "2.3M",
    official: false,
  },
  {
    id: "json-viewer",
    name: "JSON Viewer",
    description: "JSON 파일을 보기 좋게 포맷팅하고 색상 강조로 표시합니다.",
    version: "0.19.0",
    enabled: false,
    icon: "ri-braces-line",
    iconBg: "from-yellow-500 to-orange-500",
    permissions: ["activeTab"],
    hostPermissions: [],
    size: "120KB",
    author: "tulios",
    category: "dev",
    rating: 4.6,
    installs: "1.8M",
    official: false,
  },
  {
    id: "wappalyzer",
    name: "Wappalyzer",
    description: "방문 중인 웹사이트에서 사용하는 기술 스택을 자동으로 감지합니다.",
    version: "6.10.76",
    enabled: false,
    icon: "ri-stack-line",
    iconBg: "from-purple-500 to-purple-700",
    permissions: ["tabs", "storage", "webRequest"],
    hostPermissions: ["<all_urls>"],
    size: "3.5MB",
    author: "Wappalyzer",
    category: "dev",
    rating: 4.5,
    installs: "1.5M",
    official: false,
  },
  {
    id: "clearurls",
    name: "ClearURLs",
    description: "URL에서 추적 매개변수를 자동으로 제거합니다. 프라이버시를 강화합니다.",
    version: "1.26.1",
    enabled: false,
    icon: "ri-link-unlink",
    iconBg: "from-teal-500 to-teal-700",
    permissions: ["webRequest", "webRequestBlocking", "storage"],
    hostPermissions: ["<all_urls>"],
    size: "1.1MB",
    author: "Kevin Röbert",
    category: "privacy",
    rating: 4.8,
    installs: "800K",
    official: false,
  },
  {
    id: "return-youtube-dislike",
    name: "Return YouTube Dislike",
    description: "유튜브 싫어요 수를 복원합니다. API와 크라우드소싱 데이터를 활용합니다.",
    version: "3.0.0.17",
    enabled: false,
    icon: "ri-thumb-down-line",
    iconBg: "from-red-500 to-red-700",
    permissions: ["storage"],
    hostPermissions: ["*://*.youtube.com/*"],
    size: "180KB",
    author: "Dmitry Selivanov",
    category: "media",
    rating: 4.9,
    installs: "4.2M",
    official: false,
  },
  {
    id: "sponsorblock",
    name: "SponsorBlock",
    description: "유튜브 영상에서 스폰서, 인트로, 아웃트로를 자동으로 건너뜁니다.",
    version: "5.6.2",
    enabled: false,
    icon: "ri-skip-right-line",
    iconBg: "from-green-600 to-green-800",
    permissions: ["storage", "tabs"],
    hostPermissions: ["*://*.youtube.com/*"],
    size: "890KB",
    author: "Ajay Ramachandran",
    category: "media",
    rating: 4.8,
    installs: "1.9M",
    official: false,
  },
];

const scriptGoldFireDragon = `// ==UserScript==
// @name         GoldFireDragon Enhancer
// @namespace    https://goldfiredragon.app
// @version      1.2.0
// @description  GoldFireDragon 검색 강화: 결과 하이라이팅, 키보드 단축키
// @author       GoldFireDragon Team
// @match        *://goldfiredragon.app/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // 검색 결과 키워드 하이라이팅
  GM_addStyle(\`
    .search-highlight {
      background: rgba(255, 200, 0, 0.3);
      border-radius: 2px;
      padding: 0 2px;
    }
    .gfd-toolbar {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 9999;
      background: rgba(0,0,0,0.8);
      border-radius: 12px;
      padding: 8px;
      display: flex;
      gap: 6px;
    }
  \`);

  // 키보드 단축키 등록
  document.addEventListener('keydown', (e) => {
    // Alt+S: 검색창 포커스
    if (e.altKey && e.key === 's') {
      const input = document.querySelector('input[type="search"]');
      if (input) input.focus();
      e.preventDefault();
    }
    // Alt+H: 히스토리 열기
    if (e.altKey && e.key === 'h') {
      window.history.back();
      e.preventDefault();
    }
  });

  // 검색 횟수 카운팅
  const count = GM_getValue('searchCount', 0);
  GM_setValue('searchCount', count + 1);
  console.log(\`[GFD Enhancer] 총 \${count + 1}번 검색했어요!\`);
})();`;

const scriptBlockTracking = `// ==UserScript==
// @name         URL 추적 파라미터 제거
// @namespace    https://goldfiredragon.app/scripts
// @version      2.0.1
// @description  URL에서 UTM, fbclid 등 추적 파라미터를 자동으로 제거합니다
// @author       Privacy Guard
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const TRACKING_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'msclkid', 'mc_eid', 'ref', '_hsenc', '_hsmi',
    'yclid', 'dclid', 'zanpid', 'origin',
  ];

  function cleanUrl() {
    const url = new URL(window.location.href);
    let changed = false;

    TRACKING_PARAMS.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    });

    if (changed) {
      window.history.replaceState({}, document.title, url.toString());
      console.log('[URL Cleaner] 추적 파라미터 제거됨:', url.toString());
    }
  }

  cleanUrl();
  window.addEventListener('popstate', cleanUrl);
})();`;

const scriptYouTubeEnhancer = `// ==UserScript==
// @name         YouTube 강화 팩
// @namespace    https://goldfiredragon.app/scripts
// @version      3.1.0
// @description  YouTube: 자동재생 차단, 스킵 불가 광고 제거, 기본 화질 1080p 설정
// @author       MediaEnhancer
// @match        *://*.youtube.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // 자동재생 비활성화
  GM_addStyle(\`
    .ytp-autonav-toggle-button-container { display: none !important; }
    .ytd-watch-next-secondary-results-renderer[is-in-watch] { opacity: 0.5; }
  \`);

  // 광고 자동 스킵
  const observer = new MutationObserver(() => {
    const skipBtn = document.querySelector('.ytp-skip-intro-button, .ytp-ad-skip-button');
    if (skipBtn) {
      skipBtn.click();
      console.log('[YT Enhancer] 광고 스킵!');
    }
    // 광고 음소거
    const adOverlay = document.querySelector('.ad-showing');
    if (adOverlay) {
      const video = document.querySelector('video');
      if (video) video.muted = true;
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // 기본 화질 1080p 설정
  const quality = GM_getValue('preferredQuality', '1080');
  console.log(\`[YT Enhancer] 선호 화질: \${quality}p\`);
})();`;

const scriptDarkMode = `// ==UserScript==
// @name         커스텀 다크모드
// @namespace    https://goldfiredragon.app/scripts
// @version      1.5.0
// @description  모든 웹사이트에 커스텀 다크모드 CSS를 주입합니다
// @author       DarkMode Dev
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const isDark = GM_getValue('darkMode', true);

  if (isDark) {
    GM_addStyle(\`
      html, body {
        background-color: #1a1a1a !important;
        color: #e8e8e8 !important;
      }
      a { color: #7ab8f5 !important; }
      input, textarea, select {
        background-color: #2d2d2d !important;
        color: #e8e8e8 !important;
        border-color: #444 !important;
      }
      img, video { filter: brightness(0.85); }
      * { 
        scrollbar-color: #555 #1a1a1a;
      }
    \`);
  }

  GM_registerMenuCommand(
    isDark ? '🌙 다크모드 끄기' : '☀️ 다크모드 켜기',
    () => {
      GM_setValue('darkMode', !isDark);
      location.reload();
    }
  );
})();`;

const scriptAutoLogin = `// ==UserScript==
// @name         폼 자동완성 강화
// @namespace    https://goldfiredragon.app/scripts
// @version      1.0.3
// @description  로그인 폼 자동 포커스, 엔터키 제출 지원 강화
// @author       FormHelper
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // 첫 번째 비어있는 입력 필드에 자동 포커스
  const loginForms = document.querySelectorAll('form[action*="login"], form[action*="signin"], form#login, form#signin');
  
  loginForms.forEach(form => {
    const firstInput = form.querySelector('input[type="text"], input[type="email"]');
    if (firstInput && !firstInput.value) {
      firstInput.focus();
      console.log('[FormHelper] 로그인 폼 자동 포커스');
    }

    // 엔터키로 폼 제출
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const submitBtn = form.querySelector('[type="submit"], button');
        if (submitBtn) submitBtn.click();
      }
    });
  });

  // 기억된 필드 자동 복원
  const savedData = GM_getValue('formData_' + location.hostname, {});
  Object.entries(savedData).forEach(([name, value]) => {
    const field = document.querySelector(\`input[name="\${name}"]\`);
    if (field && field.type !== 'password' && !field.value) {
      field.value = value;
    }
  });
})();`;

export const mockUserScripts: UserScript[] = [
  {
    id: "gfd-enhancer",
    name: "GoldFireDragon Enhancer",
    description: "GoldFireDragon 검색 강화: 결과 하이라이팅, 키보드 단축키, 검색 카운터",
    version: "1.2.0",
    author: "GoldFireDragon Team",
    enabled: true,
    matchUrls: ["*://goldfiredragon.app/*"],
    excludeUrls: [],
    runAt: "document-end",
    grants: ["GM_setValue", "GM_getValue", "GM_addStyle"],
    code: scriptGoldFireDragon,
    lastModified: "2026-04-20",
    runCount: 342,
  },
  {
    id: "url-cleaner",
    name: "URL 추적 파라미터 제거",
    description: "UTM, fbclid, gclid 등 추적 파라미터를 URL에서 자동 제거",
    version: "2.0.1",
    author: "Privacy Guard",
    enabled: true,
    matchUrls: ["*://*/*"],
    excludeUrls: ["*://localhost/*"],
    runAt: "document-start",
    grants: [],
    code: scriptBlockTracking,
    lastModified: "2026-04-15",
    runCount: 1208,
  },
  {
    id: "yt-enhancer",
    name: "YouTube 강화 팩",
    description: "자동재생 차단, 광고 스킵, 기본 화질 1080p, 광고 음소거",
    version: "3.1.0",
    author: "MediaEnhancer",
    enabled: false,
    matchUrls: ["*://*.youtube.com/*"],
    excludeUrls: [],
    runAt: "document-end",
    grants: ["GM_setValue", "GM_getValue", "GM_addStyle"],
    code: scriptYouTubeEnhancer,
    lastModified: "2026-04-10",
    runCount: 89,
  },
  {
    id: "dark-mode",
    name: "커스텀 다크모드",
    description: "모든 웹사이트에 다크모드 CSS 주입. GM_registerMenuCommand 지원",
    version: "1.5.0",
    author: "DarkMode Dev",
    enabled: true,
    matchUrls: ["*://*/*"],
    excludeUrls: [],
    runAt: "document-start",
    grants: ["GM_addStyle", "GM_getValue", "GM_setValue", "GM_registerMenuCommand"],
    code: scriptDarkMode,
    lastModified: "2026-04-18",
    runCount: 4521,
  },
  {
    id: "form-helper",
    name: "폼 자동완성 강화",
    description: "로그인 폼 자동 포커스, 엔터키 제출, 필드 자동 복원",
    version: "1.0.3",
    author: "FormHelper",
    enabled: false,
    matchUrls: ["*://*/*"],
    excludeUrls: [],
    runAt: "document-end",
    grants: ["GM_getValue", "GM_setValue"],
    code: scriptAutoLogin,
    lastModified: "2026-04-05",
    runCount: 0,
  },
];

export const newScriptTemplate = `// ==UserScript==
// @name         새 스크립트
// @namespace    https://goldfiredragon.app/scripts
// @version      1.0.0
// @description  스크립트 설명을 입력하세요
// @author       사용자
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // 여기에 코드를 작성하세요
  console.log('[Script] 스크립트가 실행됐어요!');

})();`;
