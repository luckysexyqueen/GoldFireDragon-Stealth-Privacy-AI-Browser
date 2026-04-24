/**
 * useSearchEngines
 * 통합 검색 엔진 관리 + 무검열 설정
 * Home, MCP, Settings 모두 동일한 설정 공유
 */

import { useState, useEffect, useCallback } from 'react';

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  isDefault: boolean;
  isCustom?: boolean;
  uncensored?: boolean;
  nsfw?: boolean;
  proxy?: boolean;
  tor?: boolean;
}

export const ALL_SEARCH_ENGINES: SearchEngine[] = [
  // ─── Standard Engines ──────────────────────────────────────────
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', isDefault: true },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', isDefault: false },
  { id: 'brave', name: 'Brave Search', url: 'https://search.brave.com/search?q={query}', isDefault: false },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', isDefault: false },
  { id: 'startpage', name: 'Startpage', url: 'https://www.startpage.com/search?q={query}', isDefault: false },
  { id: 'searxng', name: 'SearXNG (로컬)', url: 'http://localhost:8080/search?q={query}', isDefault: false },
  { id: 'kagi', name: 'Kagi', url: 'https://kagi.com/search?q={query}', isDefault: false },
  { id: 'yandex', name: 'Yandex', url: 'https://yandex.com/search/?text={query}', isDefault: false },
  { id: 'naver', name: 'Naver', url: 'https://search.naver.com/search.naver?query={query}', isDefault: false },
  // ─── Uncensored / Privacy Engines ──────────────────────────────
  { id: 'searx', name: 'SearX (무검열)', url: 'https://searx.be/search?q={query}', isDefault: false, uncensored: true },
  { id: 'searx_foss', name: 'SearXNG FOSS', url: 'https://search.sapti.me/search?q={query}', isDefault: false, uncensored: true },
  { id: '4get', name: '4get (프록시)', url: 'https://4get.ca/web?s={query}', isDefault: false, uncensored: true, proxy: true },
  { id: 'whoogle', name: 'Whoogle (자체호스팅)', url: 'https://search.bus-hit.me/search?q={query}', isDefault: false, uncensored: true },
  { id: 'librex', name: 'LibreX (Tor/프록시)', url: 'https://search.davidovski.xyz/search.php?q={query}', isDefault: false, uncensored: true, proxy: true },
  { id: 'ahmia', name: 'Ahmia (Tor 검색)', url: 'https://ahmia.fi/search/?q={query}', isDefault: false, uncensored: true, tor: true },
  { id: 'torch', name: 'Torch (Tor 검색)', url: 'http://xmh57jrknzkhv6y5ls7voza4yatcgbihslaos2g94e3bro7qixxad.onion/search?q={query}', isDefault: false, uncensored: true, tor: true },
  { id: 'presearch', name: 'Presearch (탈중앙)', url: 'https://presearch.com/search?q={query}', isDefault: false, uncensored: true },
  { id: 'mojeek', name: 'Mojeek (독립)', url: 'https://www.mojeek.com/search?q={query}', isDefault: false, uncensored: true },
  { id: 'wiby', name: 'Wiby (작은웹)', url: 'https://wiby.me/?q={query}', isDefault: false, uncensored: true },
  { id: 'rightdao', name: 'RightDao (무검열)', url: 'https://rightdao.com/search?q={query}', isDefault: false, uncensored: true },
  { id: 'gigablast', name: 'Gigablast (오픈소스)', url: 'https://www.gigablast.com/search?q={query}', isDefault: false, uncensored: true },
  { id: 'yacy', name: 'YaCy (P2P 검색)', url: 'https://yacy.searchlab.eu/yacysearch.html?query={query}', isDefault: false, uncensored: true },
  { id: 'metager', name: 'MetaGer (독일·개인정보보호)', url: 'https://metager.org/meta/meta.ger3?eingabe={query}', isDefault: false, uncensored: true },
  { id: 'swisscows', name: 'Swisscows (스위스·개인정보보호)', url: 'https://swisscows.com/en/web?query={query}', isDefault: false, uncensored: true },
  { id: 'qwant', name: 'Qwant (EU·개인정보보호)', url: 'https://www.qwant.com/?q={query}', isDefault: false, uncensored: true },
  { id: 'ecosia', name: 'Ecosia (친환경)', url: 'https://www.ecosia.org/search?q={query}', isDefault: false, uncensored: true },
  // ─── NSFW (Safe Search OFF) ────────────────────────────────────
  { id: 'naver_uncensored', name: 'Naver (안전검색OFF)', url: 'https://search.naver.com/search.naver?query={query}&adult=1', isDefault: false, uncensored: true, nsfw: true },
  { id: 'google_uncensored', name: 'Google (안전검색OFF)', url: 'https://www.google.com/search?q={query}&safe=off', isDefault: false, uncensored: true, nsfw: true },
  { id: 'bing_uncensored', name: 'Bing (안전검색OFF)', url: 'https://www.bing.com/search?q={query}&adlt=off', isDefault: false, uncensored: true, nsfw: true },
  { id: 'duckduckgo_uncensored', name: 'DuckDuckGo (안전검색OFF)', url: 'https://duckduckgo.com/?q={query}&kp=-2', isDefault: false, uncensored: true, nsfw: true },
  { id: 'yandex_uncensored', name: 'Yandex (안전검색OFF)', url: 'https://yandex.com/search/?text={query}&fyandex=1&adult=1', isDefault: false, uncensored: true, nsfw: true },
];

const ENGINES_KEY = 'gfd_search_engines';
const UNCENSORED_KEY = 'gfd_uncensored_search';
const NSFW_KEY = 'gfd_nsfw_search';
const SAFE_OFF_KEY = 'gfd_safe_search_off';
const DEFAULT_ENGINE_KEY = 'gfd_default_engine';

function loadEngines(): SearchEngine[] {
  try {
    const raw = localStorage.getItem(ENGINES_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as SearchEngine[];
      // Merge with defaults to ensure new engines are added
      const savedIds = new Set(saved.map(e => e.id));
      const newDefaults = ALL_SEARCH_ENGINES.filter(e => !savedIds.has(e.id));
      return [...saved, ...newDefaults];
    }
  } catch { /* empty */ }
  return [...ALL_SEARCH_ENGINES];
}

function saveEngines(engines: SearchEngine[]) {
  try { localStorage.setItem(ENGINES_KEY, JSON.stringify(engines)); } catch { /* empty */ }
}

export function useSearchEngines() {
  const [engines, setEngines] = useState<SearchEngine[]>(loadEngines);
  const [uncensoredMode, setUncensoredMode] = useState(() => {
    try { return localStorage.getItem(UNCENSORED_KEY) === 'true'; } catch { return false; }
  });
  const [nsfwEnabled, setNsfwEnabled] = useState(() => {
    try { return localStorage.getItem(NSFW_KEY) === 'true'; } catch { return false; }
  });
  const [safeSearchOff, setSafeSearchOff] = useState(() => {
    try { return localStorage.getItem(SAFE_OFF_KEY) === 'true'; } catch { return false; }
  });
  const [defaultEngineId, setDefaultEngineId] = useState(() => {
    try { return localStorage.getItem(DEFAULT_ENGINE_KEY) || 'google'; } catch { return 'google'; }
  });

  // Persist
  useEffect(() => { saveEngines(engines); }, [engines]);
  useEffect(() => { localStorage.setItem(UNCENSORED_KEY, String(uncensoredMode)); }, [uncensoredMode]);
  useEffect(() => { localStorage.setItem(NSFW_KEY, String(nsfwEnabled)); }, [nsfwEnabled]);
  useEffect(() => { localStorage.setItem(SAFE_OFF_KEY, String(safeSearchOff)); }, [safeSearchOff]);
  useEffect(() => { localStorage.setItem(DEFAULT_ENGINE_KEY, defaultEngineId); }, [defaultEngineId]);

  const defaultEngine = engines.find(e => e.id === defaultEngineId) || engines[0];

  const setDefault = useCallback((id: string) => {
    setEngines(prev => prev.map(e => ({ ...e, isDefault: e.id === id })));
    setDefaultEngineId(id);
  }, []);

  const addCustomEngine = useCallback((name: string, url: string) => {
    const engine: SearchEngine = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      isDefault: false,
      isCustom: true,
    };
    setEngines(prev => [...prev, engine]);
    return engine.id;
  }, []);

  const deleteEngine = useCallback((id: string) => {
    setEngines(prev => prev.filter(e => e.id !== id));
    if (defaultEngineId === id) {
      setDefaultEngineId('google');
    }
  }, [defaultEngineId]);

  const performSearch = useCallback((query: string, engineId?: string) => {
    const target = engineId
      ? engines.find(e => e.id === engineId)
      : defaultEngine;
    if (!target || !query.trim()) return;

    let url = target.url.replace('{query}', encodeURIComponent(query.trim()));

    // Apply uncensored params if mode is on
    if (uncensoredMode && safeSearchOff && !target.nsfw) {
      // Only add safe=off if not already present
      if (!url.includes('safe=off') && !url.includes('adlt=off') && !url.includes('kp=-2')) {
        const sep = url.includes('?') ? '&' : '?';
        if (target.id.includes('google')) url += `${sep}safe=off`;
        else if (target.id.includes('bing')) url += `${sep}adlt=off`;
        else if (target.id.includes('duckduckgo')) url += `${sep}kp=-2`;
        else if (target.id.includes('yandex')) url += `${sep}fyandex=1&adult=1`;
        else if (target.id.includes('naver')) url += `${sep}adult=1`;
      }
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }, [engines, defaultEngine, uncensoredMode, safeSearchOff]);

  // Stats
  const uncensoredCount = engines.filter(e => e.uncensored).length;
  const nsfwCount = engines.filter(e => e.nsfw).length;
  const proxyCount = engines.filter(e => e.proxy).length;
  const torCount = engines.filter(e => e.tor).length;
  const standardCount = engines.filter(e => !e.uncensored).length;

  return {
    engines,
    defaultEngine,
    defaultEngineId,
    uncensoredMode,
    nsfwEnabled,
    safeSearchOff,
    uncensoredCount,
    nsfwCount,
    proxyCount,
    torCount,
    standardCount,
    setUncensoredMode,
    setNsfwEnabled,
    setSafeSearchOff,
    setDefault,
    addCustomEngine,
    deleteEngine,
    performSearch,
  };
}