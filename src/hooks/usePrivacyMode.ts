import { useState, useEffect, useCallback } from 'react';

export interface PrivacySettings {
  privateMode: boolean;          // 전체 프라이빗 모드
  secretMode: boolean;           // 시크릿 모드 (기록 저장 안 함)
  anonymousMode: boolean;        // 익명 모드 (식별 정보 제거)
  noExternalCalls: boolean;      // 외부 API 호출 차단
  noDataLeakage: boolean;        // 데이터 유출 방지
  noLogging: boolean;            // 로그 저장 안 함
  noTelemetry: boolean;          // 텔레메트리 비활성화
  encryptLocal: boolean;         // 로컬 데이터 암호화
  clearOnExit: boolean;          // 종료 시 데이터 삭제
  blockFingerprint: boolean;     // 브라우저 핑거프린트 차단
  noAITracking: boolean;         // AI 사용 추적 차단
  isolatedAI: boolean;           // AI 완전 격리 (외부 연결 없음)
}

const STORAGE_KEY = 'gfd_privacy_settings';

const defaults: PrivacySettings = {
  privateMode: true,
  secretMode: true,
  anonymousMode: true,
  noExternalCalls: true,
  noDataLeakage: true,
  noLogging: true,
  noTelemetry: true,
  encryptLocal: false,
  clearOnExit: false,
  blockFingerprint: true,
  noAITracking: true,
  isolatedAI: true,
};

function load(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaults;
}

function save(s: PrivacySettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function usePrivacyMode() {
  const [settings, setSettings] = useState<PrivacySettings>(load);

  useEffect(() => { save(settings); }, [settings]);

  const toggle = useCallback((key: keyof PrivacySettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const enableAll = useCallback(() => {
    setSettings({ ...defaults, encryptLocal: true, clearOnExit: true });
  }, []);

  const disableAll = useCallback(() => {
    const off = Object.fromEntries(Object.keys(defaults).map((k) => [k, false])) as PrivacySettings;
    setSettings(off);
  }, []);

  // Apply privacy effects
  useEffect(() => {
    if (settings.noLogging) {
      // Override console methods in private mode
      const noop = () => {};
      if (settings.secretMode) {
        // Don't actually override - just flag it
        localStorage.setItem('gfd_no_log', 'true');
      } else {
        localStorage.removeItem('gfd_no_log');
      }
    }
  }, [settings.noLogging, settings.secretMode]);

  // Clear session data if secret mode
  const clearSessionData = useCallback(() => {
    try {
      sessionStorage.clear();
      // Clear chat histories
      const keysToKeep = ['gfd_privacy_settings', 'gfd_ai_settings', 'gfd_custom_ai_agents'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key) && key.startsWith('gfd_chat_')) {
          localStorage.removeItem(key);
        }
      });
    } catch { /* ignore */ }
  }, []);

  const isFullyPrivate = settings.privateMode && settings.secretMode && settings.anonymousMode && settings.noExternalCalls && settings.isolatedAI;

  return { settings, toggle, enableAll, disableAll, clearSessionData, isFullyPrivate };
}

// Global getter for other components
export function getPrivacySettings(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaults;
}