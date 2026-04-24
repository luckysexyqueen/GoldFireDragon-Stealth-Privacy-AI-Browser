/**
 * useExtensionManager
 * 브라우저 확장프로그램 관리 훅
 *
 * 지원 설치 방식:
 *   1. Chrome Web Store URL  (chrome.google.com/webstore/...)
 *   2. Firefox Add-ons URL   (addons.mozilla.org/...)
 *   3. Whale Store URL       (store.whale.naver.com/...)
 *   4. Edge Add-ons URL      (microsoftedge.microsoft.com/addons/...)
 *   5. 로컬 파일: .crx (Chrome), .xpi (Firefox), .whl (Whale), .zip (압축)
 *
 * 브라우저 환경 제약:
 *   - 실제 확장프로그램 설치는 브라우저 네이티브 API 필요
 *   - 스토어 URL → 해당 스토어 페이지로 이동 (브라우저가 설치 처리)
 *   - 로컬 파일 → 브라우저 확장 관리 페이지 안내 + 파일 정보 저장
 *   - 설치 상태는 IndexedDB에 영구 저장
 */

import { useState, useCallback, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────
export type ExtensionSource = 'chrome_store' | 'firefox_store' | 'whale_store' | 'edge_store' | 'local_crx' | 'local_xpi' | 'local_whl' | 'local_zip' | 'url_direct';
export type ExtensionStatus = 'installed' | 'pending' | 'disabled' | 'error' | 'installing';
export type BrowserType = 'chrome' | 'firefox' | 'whale' | 'edge' | 'safari' | 'unknown';

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  source: ExtensionSource;
  sourceUrl?: string;
  localFileName?: string;
  localFileSize?: number;
  iconUrl?: string;
  status: ExtensionStatus;
  enabled: boolean;
  installedAt: string;
  updatedAt: string;
  permissions: string[];
  category: ExtensionCategory;
  storeId?: string;         // 스토어 내 ID
  homepageUrl?: string;
  tags: string[];
  installNote?: string;     // 설치 안내 메시지
}

export type ExtensionCategory =
  | 'productivity'
  | 'privacy'
  | 'developer'
  | 'ai'
  | 'media'
  | 'shopping'
  | 'social'
  | 'utility'
  | 'theme'
  | 'other';

export const CATEGORY_INFO: Record<ExtensionCategory, { label: string; icon: string; color: string; bg: string }> = {
  productivity: { label: '생산성',   icon: 'ri-briefcase-line',    color: 'text-puma-accent', bg: 'bg-puma-accent/15' },
  privacy:      { label: '프라이버시', icon: 'ri-shield-check-line', color: 'text-green-400',   bg: 'bg-green-400/15' },
  developer:    { label: '개발자',   icon: 'ri-code-s-slash-line', color: 'text-yellow-400',  bg: 'bg-yellow-400/15' },
  ai:           { label: 'AI',       icon: 'ri-robot-line',        color: 'text-pink-400',    bg: 'bg-pink-400/15' },
  media:        { label: '미디어',   icon: 'ri-play-circle-line',  color: 'text-red-400',     bg: 'bg-red-400/15' },
  shopping:     { label: '쇼핑',     icon: 'ri-shopping-cart-line',color: 'text-orange-400',  bg: 'bg-orange-400/15' },
  social:       { label: '소셜',     icon: 'ri-group-line',        color: 'text-cyan-400',    bg: 'bg-cyan-400/15' },
  utility:      { label: '유틸리티', icon: 'ri-tools-line',        color: 'text-teal-400',    bg: 'bg-teal-400/15' },
  theme:        { label: '테마',     icon: 'ri-palette-line',      color: 'text-violet-400',  bg: 'bg-violet-400/15' },
  other:        { label: '기타',     icon: 'ri-apps-line',         color: 'text-puma-muted',  bg: 'bg-puma-card' },
};

export const SOURCE_INFO: Record<ExtensionSource, { label: string; icon: string; color: string; bg: string; accept?: string }> = {
  chrome_store:  { label: 'Chrome Web Store', icon: 'ri-chrome-line',  color: 'text-amber-400',  bg: 'bg-amber-400/15' },
  firefox_store: { label: 'Firefox Add-ons',  icon: 'ri-firefox-line', color: 'text-orange-400', bg: 'bg-orange-400/15' },
  whale_store:   { label: 'Whale Store',       icon: 'ri-global-line',  color: 'text-teal-400',   bg: 'bg-teal-400/15' },
  edge_store:    { label: 'Edge Add-ons',      icon: 'ri-edge-line',    color: 'text-puma-accent',bg: 'bg-puma-accent/15' },
  local_crx:     { label: 'Local .crx',        icon: 'ri-file-zip-line',color: 'text-amber-400',  bg: 'bg-amber-400/15', accept: '.crx' },
  local_xpi:     { label: 'Local .xpi',        icon: 'ri-file-zip-line',color: 'text-orange-400', bg: 'bg-orange-400/15', accept: '.xpi' },
  local_whl:     { label: 'Local .whl',        icon: 'ri-file-zip-line',color: 'text-teal-400',   bg: 'bg-teal-400/15', accept: '.whl' },
  local_zip:     { label: 'Local .zip',        icon: 'ri-file-zip-line',color: 'text-green-400',  bg: 'bg-green-400/15', accept: '.zip' },
  url_direct:    { label: 'Direct URL',        icon: 'ri-link',         color: 'text-puma-muted', bg: 'bg-puma-card' },
};

// ─── Browser Detection ─────────────────────────────────────────────
export function detectBrowser(): BrowserType {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('whale')) return 'whale';
  if (ua.includes('edg/') || ua.includes('edge/')) return 'edge';
  if (ua.includes('firefox') || ua.includes('fxios')) return 'firefox';
  if (ua.includes('chrome') || ua.includes('crios')) return 'chrome';
  if (ua.includes('safari')) return 'safari';
  return 'unknown';
}

export const BROWSER_INFO: Record<BrowserType, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  storeUrl: string;
  extensionPageUrl: string;
  localInstallGuide: string;
}> = {
  chrome: {
    label: 'Chrome',
    icon: 'ri-chrome-line',
    color: 'text-amber-400',
    bg: 'bg-amber-400/15',
    storeUrl: 'https://chrome.google.com/webstore',
    extensionPageUrl: 'chrome://extensions',
    localInstallGuide: 'chrome://extensions → 개발자 모드 ON → "압축해제된 확장 프로그램 로드" 또는 .crx 파일 드래그',
  },
  firefox: {
    label: 'Firefox',
    icon: 'ri-firefox-line',
    color: 'text-orange-400',
    bg: 'bg-orange-400/15',
    storeUrl: 'https://addons.mozilla.org',
    extensionPageUrl: 'about:addons',
    localInstallGuide: 'about:addons → 톱니바퀴 → "파일에서 부가 기능 설치" → .xpi 파일 선택',
  },
  whale: {
    label: 'Whale',
    icon: 'ri-global-line',
    color: 'text-teal-400',
    bg: 'bg-teal-400/15',
    storeUrl: 'https://store.whale.naver.com',
    extensionPageUrl: 'whale://extensions',
    localInstallGuide: 'whale://extensions → 개발자 모드 ON → .crx/.whl 파일 드래그 또는 "압축해제된 확장 로드"',
  },
  edge: {
    label: 'Edge',
    icon: 'ri-edge-line',
    color: 'text-puma-accent',
    bg: 'bg-puma-accent/15',
    storeUrl: 'https://microsoftedge.microsoft.com/addons',
    extensionPageUrl: 'edge://extensions',
    localInstallGuide: 'edge://extensions → 개발자 모드 ON → .crx 파일 드래그 또는 "압축해제된 확장 로드"',
  },
  safari: {
    label: 'Safari',
    icon: 'ri-safari-line',
    color: 'text-puma-muted',
    bg: 'bg-puma-card',
    storeUrl: 'https://apps.apple.com',
    extensionPageUrl: 'safari://extensions',
    localInstallGuide: 'Safari → 환경설정 → 확장 프로그램 탭에서 관리',
  },
  unknown: {
    label: 'Browser',
    icon: 'ri-global-line',
    color: 'text-puma-muted',
    bg: 'bg-puma-card',
    storeUrl: '',
    extensionPageUrl: '',
    localInstallGuide: '브라우저 확장 관리 페이지에서 설치하세요',
  },
};

// ─── URL Parser ────────────────────────────────────────────────────
export function parseExtensionUrl(url: string): {
  source: ExtensionSource;
  storeId?: string;
  name?: string;
} | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname;

    // Chrome Web Store
    if (host.includes('chrome.google.com') && path.includes('/webstore/detail/')) {
      const parts = path.split('/');
      const idIdx = parts.indexOf('detail') + 2;
      return { source: 'chrome_store', storeId: parts[idIdx] };
    }
    // Firefox Add-ons
    if (host.includes('addons.mozilla.org')) {
      const parts = path.split('/');
      const addonIdx = parts.indexOf('addon') + 1;
      return { source: 'firefox_store', storeId: parts[addonIdx] };
    }
    // Whale Store
    if (host.includes('store.whale.naver.com')) {
      const parts = path.split('/');
      return { source: 'whale_store', storeId: parts[parts.length - 1] };
    }
    // Edge Add-ons
    if (host.includes('microsoftedge.microsoft.com') && path.includes('/addons/')) {
      const parts = path.split('/');
      return { source: 'edge_store', storeId: parts[parts.length - 1] };
    }
    // Direct URL (crx/xpi download link)
    if (url.endsWith('.crx')) return { source: 'local_crx' };
    if (url.endsWith('.xpi')) return { source: 'local_xpi' };
    if (url.endsWith('.whl')) return { source: 'local_whl' };
    if (url.endsWith('.zip')) return { source: 'local_zip' };

    return { source: 'url_direct' };
  } catch {
    return null;
  }
}

// ─── IndexedDB ─────────────────────────────────────────────────────
const DB_NAME = 'gfd_extensions_db';
const DB_VERSION = 1;
const EXT_STORE = 'extensions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(EXT_STORE)) {
        db.createObjectStore(EXT_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(item: Extension): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXT_STORE, 'readwrite');
    tx.objectStore(EXT_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetAll(): Promise<Extension[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXT_STORE, 'readonly');
    const req = tx.objectStore(EXT_STORE).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EXT_STORE, 'readwrite');
    tx.objectStore(EXT_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Hook ──────────────────────────────────────────────────────────
export function useExtensionManager() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loaded, setLoaded] = useState(false);
  const currentBrowser = detectBrowser();

  useEffect(() => {
    dbGetAll()
      .then(exts => {
        setExtensions(exts.sort((a, b) => new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime()));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // 스토어 URL로 설치 (브라우저 스토어 페이지 열기)
  const installFromUrl = useCallback(async (
    url: string,
    meta: Partial<Extension> = {},
  ): Promise<{ success: boolean; message: string; ext?: Extension }> => {
    const parsed = parseExtensionUrl(url);
    if (!parsed) return { success: false, message: '유효하지 않은 URL입니다' };

    const id = `ext-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    const ext: Extension = {
      id,
      name: meta.name ?? parsed.storeId ?? 'Unknown Extension',
      description: meta.description ?? '',
      version: meta.version ?? '1.0.0',
      author: meta.author ?? 'Unknown',
      source: parsed.source,
      sourceUrl: url,
      iconUrl: meta.iconUrl,
      status: 'pending',
      enabled: false,
      installedAt: now,
      updatedAt: now,
      permissions: meta.permissions ?? [],
      category: meta.category ?? 'other',
      storeId: parsed.storeId,
      homepageUrl: url,
      tags: meta.tags ?? [],
      installNote: `스토어 페이지에서 설치 버튼을 클릭하세요`,
    };

    await dbPut(ext);
    setExtensions(prev => [ext, ...prev]);

    // 스토어 URL 열기
    window.open(url, '_blank', 'noopener,noreferrer');

    // 잠시 후 installed로 업데이트 (사용자가 설치했다고 가정)
    setTimeout(async () => {
      const updated: Extension = { ...ext, status: 'installed', enabled: true, updatedAt: new Date().toISOString() };
      await dbPut(updated);
      setExtensions(prev => prev.map(e => e.id === id ? updated : e));
    }, 3000);

    return { success: true, message: '스토어 페이지를 열었습니다. 설치 버튼을 클릭하세요.', ext };
  }, []);

  // 로컬 파일로 설치
  const installFromFile = useCallback(async (
    file: File,
    meta: Partial<Extension> = {},
  ): Promise<{ success: boolean; message: string; ext?: Extension }> => {
    const lower = file.name.toLowerCase();
    let source: ExtensionSource = 'local_zip';
    if (lower.endsWith('.crx')) source = 'local_crx';
    else if (lower.endsWith('.xpi')) source = 'local_xpi';
    else if (lower.endsWith('.whl')) source = 'local_whl';
    else if (lower.endsWith('.zip')) source = 'local_zip';
    else return { success: false, message: '.crx, .xpi, .whl, .zip 파일만 지원합니다' };

    const id = `ext-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const name = file.name.replace(/\.(crx|xpi|whl|zip)$/i, '');

    const ext: Extension = {
      id,
      name: meta.name ?? name,
      description: meta.description ?? `로컬 파일에서 설치됨: ${file.name}`,
      version: meta.version ?? '1.0.0',
      author: meta.author ?? 'Local',
      source,
      localFileName: file.name,
      localFileSize: file.size,
      status: 'installing',
      enabled: false,
      installedAt: now,
      updatedAt: now,
      permissions: meta.permissions ?? [],
      category: meta.category ?? 'other',
      tags: meta.tags ?? [],
      installNote: BROWSER_INFO[currentBrowser].localInstallGuide,
    };

    await dbPut(ext);
    setExtensions(prev => [ext, ...prev]);

    // 파일 저장 (Cache Storage)
    try {
      const cache = await caches.open('gfd-extensions-v1');
      const response = new Response(file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      await cache.put(`/ext-files/${id}/${file.name}`, response);
    } catch { /* Cache Storage 실패 시 무시 */ }

    // 설치 시뮬레이션 (실제 설치는 브라우저 네이티브 API 필요)
    await new Promise(r => setTimeout(r, 1500));

    const updated: Extension = {
      ...ext,
      status: 'installed',
      enabled: true,
      updatedAt: new Date().toISOString(),
    };
    await dbPut(updated);
    setExtensions(prev => prev.map(e => e.id === id ? updated : e));

    return {
      success: true,
      message: `${file.name} 파일이 등록되었습니다. 브라우저 확장 관리 페이지에서 수동 설치가 필요합니다.`,
      ext: updated,
    };
  }, [currentBrowser]);

  // 활성화/비활성화 토글
  const toggleExtension = useCallback(async (id: string) => {
    setExtensions(prev => {
      const updated = prev.map(e => {
        if (e.id !== id) return e;
        const toggled = { ...e, enabled: !e.enabled, updatedAt: new Date().toISOString() };
        dbPut(toggled).catch(() => {});
        return toggled;
      });
      return updated;
    });
  }, []);

  // 삭제
  const removeExtension = useCallback(async (id: string) => {
    await dbDelete(id);
    // Cache Storage에서도 삭제
    try {
      const cache = await caches.open('gfd-extensions-v1');
      const keys = await cache.keys();
      for (const req of keys) {
        if (req.url.includes(`/ext-files/${id}/`)) await cache.delete(req);
      }
    } catch { /* empty */ }
    setExtensions(prev => prev.filter(e => e.id !== id));
  }, []);

  // 상태 업데이트
  const updateExtensionStatus = useCallback(async (id: string, status: ExtensionStatus, note?: string) => {
    setExtensions(prev => {
      const updated = prev.map(e => {
        if (e.id !== id) return e;
        const u = { ...e, status, updatedAt: new Date().toISOString(), ...(note ? { installNote: note } : {}) };
        dbPut(u).catch(() => {});
        return u;
      });
      return updated;
    });
  }, []);

  // 브라우저 확장 관리 페이지 열기
  const openExtensionPage = useCallback(() => {
    const info = BROWSER_INFO[currentBrowser];
    if (info.extensionPageUrl) {
      window.open(info.extensionPageUrl, '_blank');
    }
  }, [currentBrowser]);

  return {
    extensions,
    loaded,
    currentBrowser,
    installFromUrl,
    installFromFile,
    toggleExtension,
    removeExtension,
    updateExtensionStatus,
    openExtensionPage,
  };
}
