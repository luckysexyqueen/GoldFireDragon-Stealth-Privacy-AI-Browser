import { useMemo } from "react";

export type BrowserName =
  | "chrome" | "firefox" | "edge" | "brave" | "opera" | "kiwi"
  | "samsung" | "yandex" | "safari" | "unknown";

export type PlatformName = "windows" | "mac" | "linux" | "android" | "ios" | "unknown";

export interface PlatformInfo {
  browser: BrowserName;
  browserVersion: string;
  platform: PlatformName;
  isPC: boolean;
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isBrave: boolean;
  isKiwi: boolean;
  isSamsung: boolean;
  supportsExtensions: boolean;
  supportsUserScript: boolean;
  manifestVersion: 2 | 3 | null;
  storeUrl: string;
  storeName: string;
  installMethod: "chrome-store" | "firefox-amo" | "edge-store" | "kiwi-crx" | "firefox-android" | "local" | "none";
  installNote: string;
  browserLabel: string;
  platformLabel: string;
}

function detectBrowser(ua: string): { name: BrowserName; version: string } {
  if (/Kiwi/i.test(ua)) return { name: "kiwi", version: ua.match(/Kiwi\/([^\s]+)/)?.[1] ?? "" };
  if (/SamsungBrowser/i.test(ua)) return { name: "samsung", version: ua.match(/SamsungBrowser\/([^\s]+)/)?.[1] ?? "" };
  if (/YaBrowser/i.test(ua)) return { name: "yandex", version: ua.match(/YaBrowser\/([^\s]+)/)?.[1] ?? "" };
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return { name: "opera", version: ua.match(/OPR\/([^\s]+)/)?.[1] ?? "" };
  if (/Edg\//i.test(ua)) return { name: "edge", version: ua.match(/Edg\/([^\s]+)/)?.[1] ?? "" };
  if (/Firefox/i.test(ua)) return { name: "firefox", version: ua.match(/Firefox\/([^\s]+)/)?.[1] ?? "" };
  if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) {
    // Brave check
    if (typeof navigator !== "undefined" && (navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }).brave) {
      return { name: "brave", version: ua.match(/Chrome\/([^\s]+)/)?.[1] ?? "" };
    }
    return { name: "chrome", version: ua.match(/Chrome\/([^\s]+)/)?.[1] ?? "" };
  }
  if (/Safari/i.test(ua)) return { name: "safari", version: ua.match(/Version\/([^\s]+)/)?.[1] ?? "" };
  return { name: "unknown", version: "" };
}

function detectPlatform(ua: string): PlatformName {
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) return "mac";
  if (/Linux/i.test(ua)) return "linux";
  return "unknown";
}

const BROWSER_LABELS: Record<BrowserName, string> = {
  chrome: "Chrome", firefox: "Firefox", edge: "Microsoft Edge",
  brave: "Brave", opera: "Opera", kiwi: "Kiwi Browser",
  samsung: "Samsung Internet", yandex: "Yandex Browser",
  safari: "Safari", unknown: "알 수 없는 브라우저",
};

const PLATFORM_LABELS: Record<PlatformName, string> = {
  windows: "Windows PC", mac: "macOS", linux: "Linux PC",
  android: "Android", ios: "iOS", unknown: "알 수 없는 기기",
};

export function usePlatform(): PlatformInfo {
  return useMemo(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const { name: browser, version: browserVersion } = detectBrowser(ua);
    const platform = detectPlatform(ua);
    const isAndroid = platform === "android";
    const isIOS = platform === "ios";
    const isPC = !isAndroid && !isIOS;

    const isChrome = browser === "chrome";
    const isFirefox = browser === "firefox";
    const isEdge = browser === "edge";
    const isBrave = browser === "brave";
    const isKiwi = browser === "kiwi";
    const isSamsung = browser === "samsung";

    let supportsExtensions = false;
    let supportsUserScript = false;
    let manifestVersion: 2 | 3 | null = null;
    let storeUrl = "";
    let storeName = "";
    let installMethod: PlatformInfo["installMethod"] = "none";
    let installNote = "";

    if (isPC) {
      if (isChrome || isBrave) {
        supportsExtensions = true;
        supportsUserScript = true;
        manifestVersion = 3;
        storeUrl = "https://chrome.google.com/webstore";
        storeName = "Chrome 웹 스토어";
        installMethod = "chrome-store";
        installNote = isBrave ? "Brave는 Chrome Web Store를 지원해요!" : "가장 많은 확장 프로그램을 지원해요!";
      } else if (isFirefox) {
        supportsExtensions = true;
        supportsUserScript = true;
        manifestVersion = 2;
        storeUrl = "https://addons.mozilla.org";
        storeName = "Firefox 부가 기능 (AMO)";
        installMethod = "firefox-amo";
        installNote = "Mozilla 공식 서명 검증 완료. MV2 완전 지원!";
      } else if (isEdge) {
        supportsExtensions = true;
        supportsUserScript = true;
        manifestVersion = 3;
        storeUrl = "https://microsoftedge.microsoft.com/addons";
        storeName = "Edge 애드온 스토어";
        installMethod = "chrome-store";
        installNote = "Edge는 Chrome Web Store도 함께 지원해요!";
      } else if (browser === "opera") {
        supportsExtensions = true;
        supportsUserScript = true;
        manifestVersion = 3;
        storeUrl = "https://addons.opera.com";
        storeName = "Opera 애드온";
        installMethod = "chrome-store";
        installNote = "Opera는 Chrome CRX 확장을 지원해요!";
      } else if (browser === "yandex") {
        supportsExtensions = true;
        supportsUserScript = true;
        manifestVersion = 3;
        storeUrl = "https://chrome.google.com/webstore";
        storeName = "Chrome 웹 스토어";
        installMethod = "chrome-store";
        installNote = "Yandex 브라우저는 Chrome 확장을 지원해요!";
      }
    } else if (isAndroid) {
      if (isFirefox) {
        supportsExtensions = true;
        supportsUserScript = true;
        manifestVersion = 2;
        storeUrl = "https://addons.mozilla.org/android";
        storeName = "Firefox for Android AMO";
        installMethod = "firefox-android";
        installNote = "Firefox for Android는 공식 확장 프로그램을 지원해요!";
      } else if (isKiwi) {
        supportsExtensions = true;
        supportsUserScript = true;
        manifestVersion = 3;
        storeUrl = "https://chrome.google.com/webstore";
        storeName = "Chrome 웹 스토어 (Kiwi)";
        installMethod = "kiwi-crx";
        installNote = "Kiwi는 Android에서 Chrome 확장을 지원하는 유일한 대안!";
      } else if (isChrome) {
        supportsExtensions = false;
        supportsUserScript = false;
        manifestVersion = null;
        storeUrl = "https://play.google.com/store/apps/details?id=com.kiwibrowser.browser";
        storeName = "Kiwi Browser (Google Play)";
        installMethod = "kiwi-crx";
        installNote = "Android Chrome는 확장 프로그램을 지원하지 않아요. Kiwi 브라우저 설치 후 사용하세요!";
      } else if (isSamsung) {
        supportsExtensions = false;
        installNote = "Samsung Internet은 확장 프로그램을 지원하지 않아요. Firefox for Android를 사용해보세요!";
        installMethod = "firefox-android";
        storeUrl = "https://play.google.com/store/apps/details?id=org.mozilla.firefox";
        storeName = "Firefox for Android";
      }
    }

    return {
      browser, browserVersion, platform,
      isPC, isMobile: !isPC, isAndroid, isIOS,
      isChrome, isFirefox, isEdge, isBrave, isKiwi, isSamsung,
      supportsExtensions, supportsUserScript, manifestVersion,
      storeUrl, storeName, installMethod, installNote,
      browserLabel: BROWSER_LABELS[browser],
      platformLabel: PLATFORM_LABELS[platform],
    };
  }, []);
}
