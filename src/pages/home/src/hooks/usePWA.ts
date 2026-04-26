import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type PWAPlatform = 'android-chrome' | 'ios-safari' | 'desktop-chrome' | 'desktop-edge' | 'unsupported';

export interface PWAState {
  /** Can show native install prompt (Android Chrome / Desktop Chrome|Edge) */
  canInstall: boolean;
  /** Is iOS Safari — needs manual "Add to Home Screen" */
  isIOS: boolean;
  /** Already installed as standalone app */
  isInstalled: boolean;
  /** Platform detected */
  platform: PWAPlatform;
  /** SW registration state */
  swRegistered: boolean;
  /** Trigger native install prompt */
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** Dismiss and remember for session */
  dismiss: () => void;
  /** User explicitly dismissed */
  dismissed: boolean;
}

function detectPlatform(): PWAPlatform {
  const ua = navigator.userAgent;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (isStandalone) return 'unsupported'; // already installed

  if (/iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua)) return 'ios-safari';
  if (/Android/.test(ua) && /Chrome/.test(ua)) return 'android-chrome';
  if (/Edg\//.test(ua)) return 'desktop-edge';
  if (/Chrome/.test(ua) && !/Chromium/.test(ua)) return 'desktop-chrome';
  return 'unsupported';
}

const DISMISS_KEY = 'gfd_pwa_dismissed_at';
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (!ts) return false;
      return Date.now() - parseInt(ts, 10) < DISMISS_TTL;
    } catch {
      return false;
    }
  });

  const platform = detectPlatform();

  // Register Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        setSwRegistered(true);
        // Check for updates periodically
        const intervalId = setInterval(() => reg.update(), 60 * 60 * 1000);
        return () => clearInterval(intervalId);
      })
      .catch(() => {
        // SW registration failed — non-critical
      });
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Detect already installed
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const check = () => setIsInstalled(mq.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    check();
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);

  // Detect installed via appinstalled event
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  const canInstall = !!deferredPrompt && !isInstalled && !dismissed;
  const isIOS = platform === 'ios-safari' && !isInstalled && !dismissed;

  return {
    canInstall,
    isIOS,
    isInstalled,
    platform,
    swRegistered,
    triggerInstall,
    dismiss,
    dismissed,
  };
}
