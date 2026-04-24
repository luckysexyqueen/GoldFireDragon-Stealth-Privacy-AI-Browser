import { useState } from 'react';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';

interface PrivacyItem {
  key: keyof ReturnType<typeof usePrivacyMode>['settings'];
  icon: string;
  label: string;
  desc: string;
  color: 'accent' | 'green' | 'red' | 'yellow';
  critical?: boolean;
}

const privacyItems: PrivacyItem[] = [
  { key: 'privateMode', icon: 'ri-shield-keyhole-line', label: '프라이빗 모드 (Private Mode)', desc: '모든 AI 처리를 완전 로컬로 실행 — 외부 서버 연결 없음', color: 'accent', critical: true },
  { key: 'secretMode', icon: 'ri-spy-line', label: '시크릿 모드 (Secret Mode)', desc: '대화 기록 저장 안 함 — 세션 종료 시 자동 삭제', color: 'accent', critical: true },
  { key: 'anonymousMode', icon: 'ri-user-unfollow-line', label: '익명 모드 (Anonymous Mode)', desc: '사용자 식별 정보 제거 — AI에 개인정보 전달 안 함', color: 'accent', critical: true },
  { key: 'isolatedAI', icon: 'ri-lock-2-line', label: 'AI 완전 격리 (Isolated AI)', desc: 'GGUF/로컬 AI가 외부 네트워크에 접근 불가 — 완전 오프라인', color: 'green', critical: true },
  { key: 'noExternalCalls', icon: 'ri-forbid-2-line', label: '외부 API 호출 차단', desc: 'AI가 외부 서버로 데이터를 전송하지 않음 — 완전 격리', color: 'green' },
  { key: 'noDataLeakage', icon: 'ri-shield-check-line', label: '데이터 유출 방지', desc: '입력 데이터, 파일, 화면 캡처가 외부로 유출되지 않음', color: 'green' },
  { key: 'noLogging', icon: 'ri-file-forbid-line', label: '로그 저장 안 함 (No Logging)', desc: 'AI 사용 로그, 쿼리 기록을 저장하지 않음', color: 'green' },
  { key: 'noTelemetry', icon: 'ri-radar-line', label: '텔레메트리 비활성화', desc: '사용 통계, 오류 보고 등 원격 측정 데이터 전송 차단', color: 'green' },
  { key: 'blockFingerprint', icon: 'ri-fingerprint-line', label: '핑거프린트 차단', desc: '브라우저/기기 핑거프린트 수집 차단 — 추적 불가', color: 'yellow' },
  { key: 'noAITracking', icon: 'ri-eye-off-line', label: 'AI 사용 추적 차단', desc: 'AI 서비스가 사용 패턴을 추적하지 못하게 차단', color: 'yellow' },
  { key: 'encryptLocal', icon: 'ri-key-2-line', label: '로컬 데이터 암호화', desc: 'localStorage에 저장된 데이터를 암호화 (성능 영향 있음)', color: 'yellow' },
  { key: 'clearOnExit', icon: 'ri-delete-bin-line', label: '종료 시 데이터 삭제', desc: '브라우저 탭 닫을 때 모든 채팅 기록 자동 삭제', color: 'red' },
];

const colorMap = {
  accent: { bg: 'bg-puma-accent/10', text: 'text-puma-accent', on: 'bg-puma-accent' },
  green: { bg: 'bg-green-400/10', text: 'text-green-400', on: 'bg-green-500' },
  yellow: { bg: 'bg-yellow-400/10', text: 'text-yellow-400', on: 'bg-yellow-500' },
  red: { bg: 'bg-red-400/10', text: 'text-red-400', on: 'bg-red-500' },
};

export default function PrivacyModeSettings() {
  const { settings, toggle, enableAll, disableAll, clearSessionData, isFullyPrivate } = usePrivacyMode();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    clearSessionData();
    setCleared(true);
    setShowClearConfirm(false);
    setTimeout(() => setCleared(false), 3000);
  };

  const activeCount = Object.values(settings).filter(Boolean).length;

  return (
    <div>
      {/* Status Header */}
      <div className={`rounded-xl border p-4 mb-4 ${isFullyPrivate ? 'bg-puma-accent/10 border-puma-accent/30' : 'bg-puma-surface border-puma-border/30'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isFullyPrivate ? 'bg-puma-accent/20' : 'bg-puma-card'}`}>
              <i className={`ri-shield-keyhole-line text-lg ${isFullyPrivate ? 'text-puma-accent' : 'text-puma-muted'}`}></i>
            </div>
            <div>
              <p className={`text-sm font-bold ${isFullyPrivate ? 'text-puma-accent' : 'text-puma-text'}`}>
                {isFullyPrivate ? '🔒 완전 프라이빗 모드 활성화' : '⚠️ 부분 프라이빗 모드'}
              </p>
              <p className="text-puma-muted text-xs">{activeCount}/{Object.keys(settings).length}개 보호 항목 활성화</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFullyPrivate && (
              <span className="px-2 py-1 bg-puma-accent/20 text-puma-accent text-xs rounded-full font-bold animate-pulse">
                🔒 FULLY PRIVATE
              </span>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5">
          {settings.privateMode && <span className="px-2 py-0.5 bg-puma-accent/15 text-puma-accent text-[10px] rounded-full font-medium">🔒 프라이빗</span>}
          {settings.secretMode && <span className="px-2 py-0.5 bg-puma-accent/15 text-puma-accent text-[10px] rounded-full font-medium">🕵️ 시크릿</span>}
          {settings.anonymousMode && <span className="px-2 py-0.5 bg-puma-accent/15 text-puma-accent text-[10px] rounded-full font-medium">👤 익명</span>}
          {settings.isolatedAI && <span className="px-2 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded-full font-medium">🔐 AI 격리</span>}
          {settings.noExternalCalls && <span className="px-2 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded-full font-medium">🚫 외부차단</span>}
          {settings.noDataLeakage && <span className="px-2 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded-full font-medium">🛡️ 유출방지</span>}
          {settings.noLogging && <span className="px-2 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded-full font-medium">📵 노로그</span>}
          {settings.blockFingerprint && <span className="px-2 py-0.5 bg-yellow-400/15 text-yellow-400 text-[10px] rounded-full font-medium">🖐️ 핑거프린트차단</span>}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={enableAll}
            className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-xs font-semibold hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            🔒 모두 활성화 (최강 보호)
          </button>
          <button
            onClick={disableAll}
            className="px-3 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap"
          >
            모두 끄기
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-2 bg-red-400/10 border border-red-400/20 text-red-400 rounded-lg text-xs hover:bg-red-400/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-delete-bin-line mr-1"></i>기록 삭제
          </button>
        </div>

        {cleared && (
          <div className="mt-2 px-3 py-2 bg-green-400/10 border border-green-400/20 rounded-lg">
            <p className="text-green-400 text-xs flex items-center gap-1.5">
              <i className="ri-check-line"></i>세션 데이터가 삭제되었습니다.
            </p>
          </div>
        )}
      </div>

      {/* Privacy Items */}
      <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden divide-y divide-puma-border/20">
        {privacyItems.map(({ key, icon, label, desc, color, critical }) => {
          const val = settings[key];
          const c = colorMap[color];
          return (
            <div key={key} className={`flex items-center justify-between px-4 py-3.5 ${critical && val ? 'bg-puma-accent/3' : ''}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${val ? c.bg : 'bg-puma-card'}`}>
                  <i className={`${icon} text-sm ${val ? c.text : 'text-puma-muted'}`}></i>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-puma-text text-sm font-medium">{label}</p>
                    {critical && <span className="px-1 py-0.5 bg-puma-accent/15 text-puma-accent text-[9px] rounded font-bold">핵심</span>}
                  </div>
                  <p className="text-puma-muted text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ml-3 ${val ? c.on : 'bg-puma-border/50'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${val ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-4 px-4 py-3 bg-puma-surface border border-puma-border/30 rounded-xl">
        <p className="text-puma-muted text-xs leading-relaxed flex items-start gap-2">
          <i className="ri-information-line text-puma-accent mt-0.5 flex-shrink-0"></i>
          <span>
            <strong className="text-puma-text">GGUF 로컬 모델</strong>은 항상 완전히 오프라인으로 실행됩니다. 외부 API(Groq, Gemini 등)를 사용할 경우 해당 서비스의 개인정보 처리방침이 적용됩니다. 프라이빗 모드를 활성화하면 AI 채팅 인터페이스에 🔒 배지가 표시됩니다.
          </span>
        </p>
      </div>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-puma-surface border border-puma-border/30 rounded-2xl p-6 w-80 mx-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-400/15 mx-auto mb-3">
                <i className="ri-delete-bin-line text-red-400 text-2xl"></i>
              </div>
              <h3 className="text-puma-text font-bold text-base mb-2">세션 데이터 삭제</h3>
              <p className="text-puma-muted text-sm leading-relaxed">
                현재 세션의 채팅 기록과 임시 데이터를 삭제합니다. 설정과 에이전트 정보는 유지됩니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleClear} className="flex-1 py-2.5 bg-red-400/20 border border-red-400/40 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-400/30 transition-colors cursor-pointer whitespace-nowrap">
                삭제
              </button>
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-xl text-sm font-medium hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}