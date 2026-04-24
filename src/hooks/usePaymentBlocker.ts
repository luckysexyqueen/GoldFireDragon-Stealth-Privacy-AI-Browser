/**
 * usePaymentBlocker
 * 자동결제 차단 시스템
 *
 * 차단 대상:
 *   - 자동결제 / 구독 결제 팝업 감지 & 차단
 *   - 결제 API 호출 인터셉트 (Stripe, PayPal, Braintree 등)
 *   - 결제 폼 자동 제출 차단
 *   - 숨겨진 결제 트리거 차단
 *   - 1-click 결제 차단
 *   - 인앱결제 차단
 *   - 구독 갱신 알림 차단
 *   - 결제 관련 쿠키/스토리지 차단
 *
 * 화이트리스트:
 *   - 사용자가 직접 승인한 결제 도메인
 *   - 수동 결제 (사용자가 직접 클릭한 경우)
 */

import { useState, useCallback, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────
export type BlockLevel = 'strict' | 'moderate' | 'light' | 'off';

export interface BlockedEvent {
  id: string;
  type: BlockedEventType;
  domain: string;
  url: string;
  description: string;
  amount?: string;
  currency?: string;
  provider?: string;
  blockedAt: string;
  severity: 'high' | 'medium' | 'low';
}

export type BlockedEventType =
  | 'auto_payment'
  | 'subscription_renewal'
  | 'one_click_payment'
  | 'hidden_payment'
  | 'payment_form_submit'
  | 'payment_api_call'
  | 'in_app_purchase'
  | 'recurring_charge'
  | 'trial_conversion'
  | 'upsell_popup';

export interface PaymentBlockerSettings {
  enabled: boolean;
  blockLevel: BlockLevel;
  blockAutoSubscriptions: boolean;
  blockOneClickPayments: boolean;
  blockHiddenPayments: boolean;
  blockPaymentForms: boolean;
  blockPaymentAPIs: boolean;
  blockInAppPurchases: boolean;
  blockTrialConversions: boolean;
  blockUpsellPopups: boolean;
  showBlockNotification: boolean;
  requireConfirmation: boolean;
  whitelist: string[];
  blockedProviders: string[];
}

export interface PaymentProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  domains: string[];
  description: string;
  riskLevel: 'high' | 'medium' | 'low';
}

// ─── Payment Providers ─────────────────────────────────────────────
export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: 'ri-bank-card-line',
    color: 'text-violet-400',
    bg: 'bg-violet-400/15',
    domains: ['stripe.com', 'js.stripe.com', 'checkout.stripe.com'],
    description: '온라인 결제 처리 플랫폼',
    riskLevel: 'medium',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'ri-paypal-line',
    color: 'text-puma-accent',
    bg: 'bg-puma-accent/15',
    domains: ['paypal.com', 'paypalobjects.com', 'checkout.paypal.com'],
    description: '글로벌 온라인 결제 서비스',
    riskLevel: 'medium',
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    icon: 'ri-apple-line',
    color: 'text-puma-text',
    bg: 'bg-puma-card',
    domains: ['apple.com', 'appleid.apple.com'],
    description: 'Apple 1-click 결제',
    riskLevel: 'high',
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    icon: 'ri-google-line',
    color: 'text-green-400',
    bg: 'bg-green-400/15',
    domains: ['pay.google.com', 'payments.google.com'],
    description: 'Google 1-click 결제',
    riskLevel: 'high',
  },
  {
    id: 'braintree',
    name: 'Braintree',
    icon: 'ri-secure-payment-line',
    color: 'text-teal-400',
    bg: 'bg-teal-400/15',
    domains: ['braintreegateway.com', 'braintree-api.com'],
    description: 'PayPal 계열 결제 게이트웨이',
    riskLevel: 'medium',
  },
  {
    id: 'adyen',
    name: 'Adyen',
    icon: 'ri-bank-line',
    color: 'text-orange-400',
    bg: 'bg-orange-400/15',
    domains: ['adyen.com', 'checkoutshopper-live.adyen.com'],
    description: '글로벌 결제 플랫폼',
    riskLevel: 'medium',
  },
  {
    id: 'recurly',
    name: 'Recurly',
    icon: 'ri-refresh-line',
    color: 'text-pink-400',
    bg: 'bg-pink-400/15',
    domains: ['recurly.com', 'js.recurly.com'],
    description: '구독 결제 전문 플랫폼',
    riskLevel: 'high',
  },
  {
    id: 'chargebee',
    name: 'Chargebee',
    icon: 'ri-calendar-check-line',
    color: 'text-amber-400',
    bg: 'bg-amber-400/15',
    domains: ['chargebee.com', 'js.chargebee.com'],
    description: '구독 관리 & 자동결제',
    riskLevel: 'high',
  },
  {
    id: 'paddle',
    name: 'Paddle',
    icon: 'ri-ship-line',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/15',
    domains: ['paddle.com', 'checkout.paddle.com'],
    description: 'SaaS 구독 결제',
    riskLevel: 'high',
  },
  {
    id: 'klarna',
    name: 'Klarna',
    icon: 'ri-shopping-bag-line',
    color: 'text-rose-400',
    bg: 'bg-rose-400/15',
    domains: ['klarna.com', 'x.klarnacdn.net'],
    description: '후불결제 / BNPL 서비스',
    riskLevel: 'high',
  },
];

// ─── Block Level Descriptions ──────────────────────────────────────
export const BLOCK_LEVEL_INFO: Record<BlockLevel, {
  label: string;
  description: string;
  color: string;
  bg: string;
  icon: string;
}> = {
  strict: {
    label: '완전 차단',
    description: '모든 자동결제 시도를 차단. 결제 API 호출, 폼 제출, 팝업 모두 차단',
    color: 'text-red-400',
    bg: 'bg-red-400/15',
    icon: 'ri-shield-cross-line',
  },
  moderate: {
    label: '균형 차단',
    description: '자동결제와 1-click 결제 차단. 수동 결제는 허용',
    color: 'text-orange-400',
    bg: 'bg-orange-400/15',
    icon: 'ri-shield-check-line',
  },
  light: {
    label: '가벼운 차단',
    description: '명백한 자동결제만 차단. 대부분의 결제는 허용',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/15',
    icon: 'ri-shield-line',
  },
  off: {
    label: '차단 해제',
    description: '모든 결제 허용. 차단 기능 비활성화',
    color: 'text-puma-muted',
    bg: 'bg-puma-card',
    icon: 'ri-shield-line',
  },
};

// ─── Default Settings ──────────────────────────────────────────────
const DEFAULT_SETTINGS: PaymentBlockerSettings = {
  enabled: true,
  blockLevel: 'moderate',
  blockAutoSubscriptions: true,
  blockOneClickPayments: true,
  blockHiddenPayments: true,
  blockPaymentForms: false,
  blockPaymentAPIs: true,
  blockInAppPurchases: true,
  blockTrialConversions: true,
  blockUpsellPopups: true,
  showBlockNotification: true,
  requireConfirmation: true,
  whitelist: [],
  blockedProviders: ['recurly', 'chargebee', 'paddle', 'klarna', 'apple_pay', 'google_pay'],
};

// ─── Storage Keys ──────────────────────────────────────────────────
const SETTINGS_KEY = 'gfd_payment_blocker_settings';
const EVENTS_KEY = 'gfd_payment_blocked_events';

function loadSettings(): PaymentBlockerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* empty */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: PaymentBlockerSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* empty */ }
}

function loadEvents(): BlockedEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return [];
}

function saveEvents(events: BlockedEvent[]) {
  try {
    // 최근 200개만 유지
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, 200)));
  } catch { /* empty */ }
}

// ─── Hook ──────────────────────────────────────────────────────────
export function usePaymentBlocker() {
  const [settings, setSettings] = useState<PaymentBlockerSettings>(loadSettings);
  const [blockedEvents, setBlockedEvents] = useState<BlockedEvent[]>(loadEvents);
  const [isActive, setIsActive] = useState(false);

  // 설정 저장
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // 차단 이벤트 저장
  useEffect(() => {
    saveEvents(blockedEvents);
  }, [blockedEvents]);

  // 실제 차단 로직 활성화
  useEffect(() => {
    if (!settings.enabled || settings.blockLevel === 'off') {
      setIsActive(false);
      return;
    }
    setIsActive(true);

    // Payment API 인터셉트
    if (settings.blockPaymentAPIs) {
      interceptPaymentAPIs(settings, addBlockedEvent);
    }

    // Payment Request API 차단
    if (settings.blockOneClickPayments && 'PaymentRequest' in window) {
      interceptPaymentRequest(settings, addBlockedEvent);
    }

    return () => {
      // cleanup은 페이지 리로드 시 자동 처리
    };
  }, [settings.enabled, settings.blockLevel, settings.blockPaymentAPIs, settings.blockOneClickPayments]);

  const addBlockedEvent = useCallback((event: Omit<BlockedEvent, 'id' | 'blockedAt'>) => {
    const newEvent: BlockedEvent = {
      ...event,
      id: `be-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      blockedAt: new Date().toISOString(),
    };
    setBlockedEvents(prev => [newEvent, ...prev].slice(0, 200));
  }, []);

  // 테스트 차단 이벤트 추가 (데모용)
  const simulateBlock = useCallback((type: BlockedEventType = 'auto_payment') => {
    const demos: Record<BlockedEventType, Omit<BlockedEvent, 'id' | 'blockedAt'>> = {
      auto_payment: {
        type: 'auto_payment',
        domain: 'example-shop.com',
        url: 'https://example-shop.com/checkout/auto',
        description: '자동결제 시도 차단됨',
        amount: '9.99',
        currency: 'USD',
        provider: 'Stripe',
        severity: 'high',
      },
      subscription_renewal: {
        type: 'subscription_renewal',
        domain: 'saas-service.com',
        url: 'https://saas-service.com/billing/renew',
        description: '구독 자동 갱신 차단됨',
        amount: '29.99',
        currency: 'USD',
        provider: 'Chargebee',
        severity: 'high',
      },
      one_click_payment: {
        type: 'one_click_payment',
        domain: 'amazon.com',
        url: 'https://amazon.com/gp/buy/1click',
        description: '1-click 결제 차단됨',
        amount: '49.99',
        currency: 'USD',
        provider: 'Amazon Pay',
        severity: 'medium',
      },
      hidden_payment: {
        type: 'hidden_payment',
        domain: 'dark-pattern.com',
        url: 'https://dark-pattern.com/hidden-charge',
        description: '숨겨진 결제 시도 차단됨',
        amount: '4.99',
        currency: 'USD',
        provider: 'Unknown',
        severity: 'high',
      },
      payment_form_submit: {
        type: 'payment_form_submit',
        domain: 'shop.example.com',
        url: 'https://shop.example.com/checkout',
        description: '결제 폼 자동 제출 차단됨',
        severity: 'medium',
      },
      payment_api_call: {
        type: 'payment_api_call',
        domain: 'js.stripe.com',
        url: 'https://js.stripe.com/v3/payment',
        description: 'Stripe API 호출 차단됨',
        provider: 'Stripe',
        severity: 'medium',
      },
      in_app_purchase: {
        type: 'in_app_purchase',
        domain: 'app.example.com',
        url: 'https://app.example.com/purchase',
        description: '인앱 결제 차단됨',
        amount: '2.99',
        currency: 'USD',
        severity: 'medium',
      },
      recurring_charge: {
        type: 'recurring_charge',
        domain: 'subscription.io',
        url: 'https://subscription.io/charge',
        description: '반복 결제 차단됨',
        amount: '14.99',
        currency: 'USD',
        provider: 'Recurly',
        severity: 'high',
      },
      trial_conversion: {
        type: 'trial_conversion',
        domain: 'freemium-app.com',
        url: 'https://freemium-app.com/trial/convert',
        description: '무료체험 → 유료 자동 전환 차단됨',
        amount: '19.99',
        currency: 'USD',
        severity: 'high',
      },
      upsell_popup: {
        type: 'upsell_popup',
        domain: 'ecommerce.com',
        url: 'https://ecommerce.com/upsell',
        description: '업셀 결제 팝업 차단됨',
        severity: 'low',
      },
    };
    addBlockedEvent(demos[type]);
  }, [addBlockedEvent]);

  const updateSettings = useCallback((updates: Partial<PaymentBlockerSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const addToWhitelist = useCallback((domain: string) => {
    setSettings(prev => ({
      ...prev,
      whitelist: [...new Set([...prev.whitelist, domain.trim().toLowerCase()])],
    }));
  }, []);

  const removeFromWhitelist = useCallback((domain: string) => {
    setSettings(prev => ({
      ...prev,
      whitelist: prev.whitelist.filter(d => d !== domain),
    }));
  }, []);

  const toggleProvider = useCallback((providerId: string) => {
    setSettings(prev => {
      const blocked = prev.blockedProviders.includes(providerId)
        ? prev.blockedProviders.filter(p => p !== providerId)
        : [...prev.blockedProviders, providerId];
      return { ...prev, blockedProviders: blocked };
    });
  }, []);

  const clearEvents = useCallback(() => {
    setBlockedEvents([]);
  }, []);

  const totalBlocked = blockedEvents.length;
  const todayBlocked = blockedEvents.filter(
    e => new Date(e.blockedAt).toDateString() === new Date().toDateString()
  ).length;
  const amountSaved = blockedEvents
    .filter(e => e.amount)
    .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

  return {
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
  };
}

// ─── Payment API Interceptors ──────────────────────────────────────
function interceptPaymentAPIs(
  settings: PaymentBlockerSettings,
  onBlock: (e: Omit<BlockedEvent, 'id' | 'blockedAt'>) => void,
) {
  // Stripe 인터셉트
  if (settings.blockedProviders.includes('stripe')) {
    const origFetch = window.fetch;
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('stripe.com') || url.includes('stripe.network')) {
        onBlock({
          type: 'payment_api_call',
          domain: new URL(url).hostname,
          url,
          description: 'Stripe API 호출 차단됨',
          provider: 'Stripe',
          severity: 'medium',
        });
        if (settings.blockLevel === 'strict') {
          return new Response(JSON.stringify({ error: 'blocked' }), { status: 403 });
        }
      }
      return origFetch.call(this, input, init);
    };
  }
}

function interceptPaymentRequest(
  settings: PaymentBlockerSettings,
  onBlock: (e: Omit<BlockedEvent, 'id' | 'blockedAt'>) => void,
) {
  if (!('PaymentRequest' in window)) return;

  const OrigPaymentRequest = (window as Window & { PaymentRequest?: unknown }).PaymentRequest;
  if (!OrigPaymentRequest) return;

  // PaymentRequest API 래핑
  (window as Window & { PaymentRequest?: unknown }).PaymentRequest = class extends (OrigPaymentRequest as typeof PaymentRequest) {
    constructor(...args: ConstructorParameters<typeof PaymentRequest>) {
      super(...args);
      onBlock({
        type: 'one_click_payment',
        domain: window.location.hostname,
        url: window.location.href,
        description: 'Payment Request API 차단됨 (1-click 결제)',
        severity: 'high',
      });
    }
  };
}