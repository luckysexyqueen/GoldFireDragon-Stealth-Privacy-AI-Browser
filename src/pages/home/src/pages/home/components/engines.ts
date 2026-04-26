export interface Engine {
  id: string;
  name: string;
  emoji: string;
  badge: string;
  badgeColor: string;
  buildDirectUrl: (q: string, safe: boolean) => string;
  buildIframeUrl: (q: string, safe: boolean) => string;
}

export const ENGINES: Engine[] = [
  {
    id: "firedragon_google",
    name: "FireDragon Google",
    emoji: "🐉",
    badge: "JP stealth",
    badgeColor: "bg-orange-500",
    buildDirectUrl: (q, safe) => {
      const params = new URLSearchParams({
        q,
        gl: "jp",
        hl: "ko",
        safe: safe ? "active" : "off",
        pws: "0",
        nfpr: "1",
        desktop: "true",
        ua: "Mozilla/9.0+(Windows+NT+10.0;+Win64;+x64)+Gecko/20100101+FireDragon/135.0+stealth+privatebrowsing+incognito+windowedfullscreen",
      });
      return `https://www.google.co.jp/search?${params.toString()}`;
    },
    // Google blocks iframe → DuckDuckGo HTML fallback (iframe 전용)
    buildIframeUrl: (q, safe) => {
      const p = safe ? "1" : "-1";
      return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=ko-kr&kp=${p}`;
    },
  },
  {
    id: "presearch",
    name: "Presearch",
    emoji: "🔭",
    badge: "탈중앙화",
    badgeColor: "bg-green-600",
    buildDirectUrl: (q) =>
      `https://presearch.com/search?q=${encodeURIComponent(q)}`,
    buildIframeUrl: (q) =>
      `https://presearch.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    emoji: "🦆",
    badge: "프라이버시",
    badgeColor: "bg-orange-400",
    buildDirectUrl: (q, safe) => {
      const p = safe ? "1" : "-1";
      return `https://duckduckgo.com/?q=${encodeURIComponent(q)}&kl=ko-kr&kp=${p}`;
    },
    buildIframeUrl: (q, safe) => {
      const p = safe ? "1" : "-1";
      return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=ko-kr&kp=${p}`;
    },
  },
  {
    id: "bing",
    name: "Bing",
    emoji: "🅱",
    badge: "MS",
    badgeColor: "bg-teal-600",
    buildDirectUrl: (q, safe) => {
      const params = new URLSearchParams({
        q,
        setlang: "ko",
        cc: "JP",
        SafeSearch: safe ? "Moderate" : "Off",
      });
      return `https://www.bing.com/search?${params.toString()}`;
    },
    buildIframeUrl: (q, safe) => {
      const params = new URLSearchParams({
        q,
        setlang: "ko",
        cc: "JP",
        SafeSearch: safe ? "Moderate" : "Off",
      });
      return `https://www.bing.com/search?${params.toString()}`;
    },
  },
  {
    id: "brave",
    name: "Brave Search",
    emoji: "🦁",
    badge: "독립검색",
    badgeColor: "bg-orange-600",
    buildDirectUrl: (q, safe) => {
      const params = new URLSearchParams({ q, lang: "ko", country: "jp", safe_search: safe ? "moderate" : "off" });
      return `https://search.brave.com/search?${params.toString()}`;
    },
    buildIframeUrl: (q, safe) => {
      const params = new URLSearchParams({ q, lang: "ko", country: "jp", safe_search: safe ? "moderate" : "off" });
      return `https://search.brave.com/search?${params.toString()}`;
    },
  },
];

export const DEFAULT_ENGINE_ID = "firedragon_google";

export function getEngine(id: string): Engine {
  return ENGINES.find((e) => e.id === id) ?? ENGINES[0];
}

export function getSavedEngineId(): string {
  try { return localStorage.getItem("selectedEngine") ?? DEFAULT_ENGINE_ID; } catch { return DEFAULT_ENGINE_ID; }
}

export function saveEngineId(id: string): void {
  try { localStorage.setItem("selectedEngine", id); } catch { /* noop */ }
}
