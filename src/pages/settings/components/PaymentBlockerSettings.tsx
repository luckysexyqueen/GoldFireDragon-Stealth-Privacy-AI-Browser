import { useState } from 'react';
import {
  usePaymentBlocker,
  PAYMENT_PROVIDERS,
  BLOCK_LEVEL_INFO,
  BlockLevel,
  BlockedEventType,
} from '@/hooks/usePaymentBlocker';

const EVENT_TYPE_LABELS: Record<BlockedEventType, { label: string; icon: string; color: string }> = {
  auto_payment: { label: '자동결제', icon: 'ri-refresh-line', color: 'text-red-400' },
  subscription_renewal: { label: '구독 갱신', icon: 'ri-calendar-check-line', color: 'text-orange-400' },
  one_click_payment: { label: '1-click 결제', icon: 'ri-cursor-line', color: 'text-amber-400' },
  hidden_payment: { label: '숨겨진 결제', icon: 'ri-eye-off-line', color: 'text-red-500' },
  payment_form_submit: { label: '폼 자동 제출', icon: 'ri-file-list-line', color: 'text-orange-400' },
  payment_api_call: { label: 'API 호출', icon: 'ri-code-line', color: 'text-yellow-400' },
  in_app_purchase: { label: '인앱 결제', icon: 'ri-smartphone-line', color: 'text-amber-400' },
  recurring_charge: { label: '반복 결제', icon: 'ri-loop-right-line', color: 'text-red-400' },
  trial_conversion: { label: '무료→유료 전환', icon: 'ri-exchange-line', color: 'text-orange-500' },
  upsell_popup: { label: '업셀 팝업', icon: 'ri-notification-badge-line', color: 'text-yellow-400' },
};

const DEMO_TYPES: BlockedEventType[] = [
  'auto_payment',
  'subscription_renewal',
  'one_click_payment',
  'hidden_payment',
  'trial_conversion',
];

export default function PaymentBlockerSettings() {
  const {
    settings,
    blockedEvents,
    isActive,
    totalBlocked,
    todayBlocked,
    amountSaved,
    updateSettings,
    addToWhitelist,
    removeFromWhitelist,
    toggleProvider,
    clearEvents,
    simulateBlock,
  } = usePaymentBlocker();

  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'rules' | 'log' | 'whitelist'>('overview');
  const [whitelistInput, setWhitelistInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAddWhitelist = () => {
    if (whitelistInput.trim()) {
      addToWhitelist(whitelistInput.trim());
      setWhitelistInput('');
    }
  };

  const tabs = [
    { id: 'overview' as const, label: '개요', icon: 'ri-dashboard-line' },
    { id: 'providers' as const, label: '결제사', icon: 'ri-bank-card-line' },
    { id: 'rules' as const, label: '차단 규칙', icon: 'ri-shield-check-line' },
    { id: 'log' as const, label: `차단 기록 (${totalBlocked})`, icon: 'ri-history-line' },
    { id: 'whitelist' as const, label: '화이트리스트', icon: 'ri-checkbox-circle-line' },
  ];

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-puma-text text-xl font-bold">자동결제 차단</h3>
          <p className="text-puma-muted text-sm mt-0.5">
            자동결제, 구독 갱신, 1-click 결제 등을 차단합니다
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
          isActive ? 'bg-green-400/15 text-green-400' : 'bg-puma-card text-puma-muted'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-puma-muted'}`}></span>
          {isActive ? '차단 활성' : '비활성'}
        </div>
      </div>

      {/* Master Toggle */}
      <div className="mb-5 bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-puma-card">
              <i className="ri-shield-check-line text-puma-accent text-xl"></i>
            </div>
            <div>
              <p className="text-puma-text text-sm font-semibold">자동결제 차단 활성화</p>
              <p className="text-puma-muted text-xs mt-0.5">
                {settings.enabled ? '자동결제 차단이 활성화되어 있습니다' : '차단 기능이 비활성화됨'}
              </p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
              settings.enabled ? 'bg-puma-accent' : 'bg-puma-border/50'
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
              settings.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}></span>
          </button>
        </div>

        {/* Block Level Selector */}
        {settings.enabled && (
          <div className="px-4 pb-4 border-t border-puma-border/20 pt-3">
            <p className="text-puma-muted text-xs mb-2 font-medium">차단 강도</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['strict', 'moderate', 'light', 'off'] as BlockLevel[]).map((level) => {
                const info = BLOCK_LEVEL_INFO[level];
                const isSelected = settings.blockLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => updateSettings({ blockLevel: level })}
                    className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? `${info.bg} border-current ${info.color}`
                        : 'bg-puma-bg border-puma-border/30 text-puma-muted hover:border-puma-accent/50'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className={`${info.icon} text-base`}></i>
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap">{info.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-puma-muted text-xs mt-2">
              {BLOCK_LEVEL_INFO[settings.blockLevel].description}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-puma-surface rounded-xl p-1 border border-puma-border/30 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-puma-accent text-white'
                : 'text-puma-muted hover:text-puma-text'
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className={`${tab.icon} text-sm`}></i>
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '총 차단', value: totalBlocked, icon: 'ri-shield-check-line', color: 'text-puma-accent', bg: 'bg-puma-accent/15' },
              { label: '오늘 차단', value: todayBlocked, icon: 'ri-calendar-line', color: 'text-green-400', bg: 'bg-green-400/15' },
              { label: '절약 금액', value: `$${amountSaved.toFixed(2)}`, icon: 'ri-money-dollar-circle-line', color: 'text-amber-400', bg: 'bg-amber-400/15' },
            ].map((stat) => (
              <div key={stat.label} className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 text-center">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${stat.bg} mx-auto mb-2`}>
                  <i className={`${stat.icon} ${stat.color} text-xl`}></i>
                </div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-puma-muted text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Current Level Info */}
          <div className={`rounded-xl border p-4 ${BLOCK_LEVEL_INFO[settings.blockLevel].bg} border-current/20`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10">
                <i className={`${BLOCK_LEVEL_INFO[settings.blockLevel].icon} ${BLOCK_LEVEL_INFO[settings.blockLevel].color} text-xl`}></i>
              </div>
              <div>
                <p className={`text-sm font-bold ${BLOCK_LEVEL_INFO[settings.blockLevel].color}`}>
                  현재: {BLOCK_LEVEL_INFO[settings.blockLevel].label}
                </p>
                <p className="text-puma-muted text-xs mt-0.5">
                  {BLOCK_LEVEL_INFO[settings.blockLevel].description}
                </p>
              </div>
            </div>
          </div>

          {/* What's being blocked */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <p className="text-puma-text text-sm font-semibold mb-3">차단 중인 항목</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'blockAutoSubscriptions', label: '자동 구독 결제', icon: 'ri-refresh-line' },
                { key: 'blockOneClickPayments', label: '1-click 결제', icon: 'ri-cursor-line' },
                { key: 'blockHiddenPayments', label: '숨겨진 결제', icon: 'ri-eye-off-line' },
                { key: 'blockPaymentAPIs', label: '결제 API 호출', icon: 'ri-code-line' },
                { key: 'blockInAppPurchases', label: '인앱 결제', icon: 'ri-smartphone-line' },
                { key: 'blockTrialConversions', label: '무료→유료 전환', icon: 'ri-exchange-line' },
                { key: 'blockUpsellPopups', label: '업셀 팝업', icon: 'ri-notification-badge-line' },
                { key: 'blockPaymentForms', label: '결제 폼 제출', icon: 'ri-file-list-line' },
              ].map((item) => {
                const active = settings[item.key as keyof typeof settings] as boolean;
                return (
                  <div key={item.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    active ? 'bg-green-400/10' : 'bg-puma-bg'
                  }`}>
                    <div className="w-4 h-4 flex items-center justify-center">
                      <i className={`${item.icon} text-sm ${active ? 'text-green-400' : 'text-puma-muted'}`}></i>
                    </div>
                    <span className={`text-xs font-medium ${active ? 'text-green-400' : 'text-puma-muted'}`}>
                      {item.label}
                    </span>
                    {active && (
                      <div className="ml-auto w-3 h-3 flex items-center justify-center">
                        <i className="ri-check-line text-green-400 text-xs"></i>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demo Simulate */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <p className="text-puma-text text-sm font-semibold mb-1">차단 테스트</p>
            <p className="text-puma-muted text-xs mb-3">차단 기록에 테스트 이벤트를 추가합니다</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_TYPES.map((type) => {
                const info = EVENT_TYPE_LABELS[type];
                return (
                  <button
                    key={type}
                    onClick={() => simulateBlock(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-puma-bg border border-puma-border/30 rounded-lg text-xs text-puma-muted hover:text-puma-text hover:border-puma-accent/50 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <div className="w-3 h-3 flex items-center justify-center">
                      <i className={`${info.icon} text-xs ${info.color}`}></i>
                    </div>
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Providers Tab ── */}
      {activeTab === 'providers' && (
        <div className="space-y-3">
          <p className="text-puma-muted text-xs">
            차단할 결제 서비스를 선택하세요. 활성화된 결제사의 API 호출이 차단됩니다.
          </p>
          {PAYMENT_PROVIDERS.map((provider) => {
            const isBlocked = settings.blockedProviders.includes(provider.id);
            return (
              <div
                key={provider.id}
                className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${provider.bg}`}>
                    <i className={`${provider.icon} ${provider.color} text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-puma-text text-sm font-semibold">{provider.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        provider.riskLevel === 'high'
                          ? 'bg-red-400/15 text-red-400'
                          : provider.riskLevel === 'medium'
                          ? 'bg-orange-400/15 text-orange-400'
                          : 'bg-green-400/15 text-green-400'
                      }`}>
                        {provider.riskLevel === 'high' ? '고위험' : provider.riskLevel === 'medium' ? '중위험' : '저위험'}
                      </span>
                    </div>
                    <p className="text-puma-muted text-xs mt-0.5">{provider.description}</p>
                    <p className="text-puma-muted/60 text-[10px] mt-0.5 truncate">
                      {provider.domains.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleProvider(provider.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                      isBlocked ? 'bg-red-500' : 'bg-puma-border/50'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      isBlocked ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rules Tab ── */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          <p className="text-puma-muted text-xs mb-1">세부 차단 규칙을 설정합니다.</p>

          {[
            {
              key: 'blockAutoSubscriptions',
              label: '자동 구독 결제 차단',
              desc: '구독 서비스의 자동 갱신 결제를 차단합니다',
              icon: 'ri-refresh-line',
              severity: 'high',
            },
            {
              key: 'blockOneClickPayments',
              label: '1-click 결제 차단',
              desc: 'Amazon, Apple, Google 등의 원클릭 결제를 차단합니다',
              icon: 'ri-cursor-line',
              severity: 'high',
            },
            {
              key: 'blockHiddenPayments',
              label: '숨겨진 결제 차단',
              desc: '다크패턴으로 숨겨진 결제 시도를 감지하고 차단합니다',
              icon: 'ri-eye-off-line',
              severity: 'high',
            },
            {
              key: 'blockPaymentAPIs',
              label: '결제 API 호출 차단',
              desc: 'Stripe, PayPal 등 결제 API 호출을 인터셉트합니다',
              icon: 'ri-code-line',
              severity: 'medium',
            },
            {
              key: 'blockInAppPurchases',
              label: '인앱 결제 차단',
              desc: '앱 내 결제 요청을 차단합니다',
              icon: 'ri-smartphone-line',
              severity: 'medium',
            },
            {
              key: 'blockTrialConversions',
              label: '무료체험 → 유료 자동 전환 차단',
              desc: '무료 체험 종료 후 자동으로 유료 전환되는 것을 차단합니다',
              icon: 'ri-exchange-line',
              severity: 'high',
            },
            {
              key: 'blockUpsellPopups',
              label: '업셀 팝업 차단',
              desc: '추가 결제를 유도하는 팝업을 차단합니다',
              icon: 'ri-notification-badge-line',
              severity: 'low',
            },
            {
              key: 'blockPaymentForms',
              label: '결제 폼 자동 제출 차단',
              desc: '결제 폼이 자동으로 제출되는 것을 차단합니다',
              icon: 'ri-file-list-line',
              severity: 'medium',
            },
            {
              key: 'showBlockNotification',
              label: '차단 알림 표시',
              desc: '결제가 차단될 때 알림을 표시합니다',
              icon: 'ri-notification-3-line',
              severity: 'info',
            },
            {
              key: 'requireConfirmation',
              label: '결제 전 확인 요청',
              desc: '모든 결제 시도 시 사용자 확인을 요청합니다',
              icon: 'ri-question-line',
              severity: 'info',
            },
          ].map((rule, idx, arr) => {
            const active = settings[rule.key as keyof typeof settings] as boolean;
            return (
              <div
                key={rule.key}
                className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${
                    rule.severity === 'high' ? 'bg-red-400/15' :
                    rule.severity === 'medium' ? 'bg-orange-400/15' :
                    rule.severity === 'low' ? 'bg-yellow-400/15' : 'bg-puma-card'
                  }`}>
                    <i className={`${rule.icon} text-base ${
                      rule.severity === 'high' ? 'text-red-400' :
                      rule.severity === 'medium' ? 'text-orange-400' :
                      rule.severity === 'low' ? 'text-yellow-400' : 'text-puma-accent'
                    }`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-puma-text text-sm font-medium">{rule.label}</p>
                    <p className="text-puma-muted text-xs mt-0.5">{rule.desc}</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ [rule.key]: !active })}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                      active ? 'bg-puma-accent' : 'bg-puma-border/50'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      active ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Log Tab ── */}
      {activeTab === 'log' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-puma-muted text-xs">최근 차단된 결제 시도 기록</p>
            {blockedEvents.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-red-500/25 transition-colors"
              >
                <div className="w-3 h-3 flex items-center justify-center">
                  <i className="ri-delete-bin-line text-xs"></i>
                </div>
                기록 삭제
              </button>
            )}
          </div>

          {showClearConfirm && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm font-medium mb-2">모든 차단 기록을 삭제하시겠습니까?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { clearEvents(); setShowClearConfirm(false); }}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
                >
                  삭제
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 bg-puma-card text-puma-muted rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {blockedEvents.length === 0 ? (
            <div className="text-center py-12 bg-puma-surface rounded-xl border border-puma-border/30">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-puma-card mx-auto mb-3">
                <i className="ri-shield-check-line text-puma-accent text-2xl"></i>
              </div>
              <p className="text-puma-text text-sm font-medium">차단 기록 없음</p>
              <p className="text-puma-muted text-xs mt-1">차단된 결제 시도가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedEvents.map((event) => {
                const typeInfo = EVENT_TYPE_LABELS[event.type];
                return (
                  <div
                    key={event.id}
                    className="bg-puma-surface rounded-xl border border-puma-border/30 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${
                        event.severity === 'high' ? 'bg-red-400/15' :
                        event.severity === 'medium' ? 'bg-orange-400/15' : 'bg-yellow-400/15'
                      }`}>
                        <i className={`${typeInfo.icon} text-sm ${typeInfo.color}`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold ${typeInfo.color}`}>{typeInfo.label}</span>
                          {event.provider && (
                            <span className="px-1.5 py-0.5 bg-puma-card text-puma-muted text-[10px] rounded">
                              {event.provider}
                            </span>
                          )}
                          {event.amount && (
                            <span className="px-1.5 py-0.5 bg-red-400/15 text-red-400 text-[10px] rounded font-mono">
                              {event.currency} {event.amount}
                            </span>
                          )}
                        </div>
                        <p className="text-puma-text text-xs mt-0.5">{event.description}</p>
                        <p className="text-puma-muted/60 text-[10px] mt-0.5 truncate">{event.domain}</p>
                      </div>
                      <div className="text-puma-muted/60 text-[10px] flex-shrink-0 text-right">
                        {new Date(event.blockedAt).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Whitelist Tab ── */}
      {activeTab === 'whitelist' && (
        <div className="space-y-4">
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <p className="text-puma-text text-sm font-semibold mb-1">도메인 화이트리스트</p>
            <p className="text-puma-muted text-xs mb-3">
              이 도메인의 결제는 차단하지 않습니다. 신뢰하는 결제 사이트를 추가하세요.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={whitelistInput}
                onChange={(e) => setWhitelistInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWhitelist()}
                placeholder="example.com"
                className="flex-1 bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
              />
              <button
                onClick={handleAddWhitelist}
                className="px-4 py-2 bg-puma-accent text-white rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap hover:opacity-90 transition-opacity"
              >
                추가
              </button>
            </div>
          </div>

          {settings.whitelist.length === 0 ? (
            <div className="text-center py-10 bg-puma-surface rounded-xl border border-puma-border/30">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-puma-card mx-auto mb-2">
                <i className="ri-checkbox-circle-line text-puma-muted text-xl"></i>
              </div>
              <p className="text-puma-muted text-sm">화이트리스트가 비어 있습니다</p>
              <p className="text-puma-muted/60 text-xs mt-1">신뢰하는 도메인을 추가하세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.whitelist.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center justify-between px-4 py-3 bg-puma-surface rounded-xl border border-puma-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-400/15">
                      <i className="ri-checkbox-circle-line text-green-400 text-sm"></i>
                    </div>
                    <span className="text-puma-text text-sm font-mono">{domain}</span>
                  </div>
                  <button
                    onClick={() => removeFromWhitelist(domain)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer"
                  >
                    <i className="ri-close-line text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Preset trusted domains */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <p className="text-puma-text text-sm font-semibold mb-2">추천 신뢰 도메인</p>
            <div className="flex flex-wrap gap-2">
              {['paypal.com', 'stripe.com', 'amazon.com', 'apple.com', 'google.com', 'samsung.com'].map((d) => {
                const already = settings.whitelist.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => !already && addToWhitelist(d)}
                    disabled={already}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      already
                        ? 'bg-green-400/15 text-green-400 cursor-default'
                        : 'bg-puma-bg border border-puma-border/30 text-puma-muted hover:border-puma-accent/50 hover:text-puma-text'
                    }`}
                  >
                    {already && <i className="ri-check-line mr-1 text-xs"></i>}
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}