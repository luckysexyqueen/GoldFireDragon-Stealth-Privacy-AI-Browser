import { useState, useEffect } from 'react';
import { useAISettings } from '@/hooks/useAISettings';
import PrivacyModeSettings from './PrivacyModeSettings';

const searchEngines = ['Google', 'DuckDuckGo', 'Brave Search', 'Bing', 'Ecosia'];
const themes = ['Dark Purple', 'Dark', 'AMOLED Black'];
const languages = [
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
];

function loadToggle(key: string, defaultValue: boolean): boolean {
  try {
    const raw = localStorage.getItem(`gfd_setting_${key}`);
    return raw ? raw === 'true' : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToggle(key: string, value: boolean) {
  localStorage.setItem(`gfd_setting_${key}`, String(value));
}

export default function GeneralSettings() {
  const { settings, toggleNSFW, setLanguage } = useAISettings();
  const [searchEngine, setSearchEngine] = useState('DuckDuckGo');
  const [theme, setTheme] = useState('Dark Purple');
  const [showNsfwConfirm, setShowNsfwConfirm] = useState(false);
  const [adBlock, setAdBlock] = useState(() => loadToggle('adblock', true));
  const [trackingProtection, setTrackingProtection] = useState(() => loadToggle('tracking', true));
  const [httpsOnly, setHttpsOnly] = useState(() => loadToggle('https', true));
  const [javascript, setJavascript] = useState(() => loadToggle('javascript', true));
  const [cookies, setCookies] = useState(() => loadToggle('cookies', false));

  // No Policy / No Censorship toggles
  const [noCensorship, setNoCensorship] = useState(() => loadToggle('no_censorship', true));
  const [noContentPolicy, setNoContentPolicy] = useState(() => loadToggle('no_content_policy', true));
  const [uncensoredAI, setUncensoredAI] = useState(() => loadToggle('uncensored_ai', true));
  const [bypassFilters, setBypassFilters] = useState(() => loadToggle('bypass_filters', true));
  const [noGeoBlock, setNoGeoBlock] = useState(() => loadToggle('no_geo_block', true));
  const [noSafeSearch, setNoSafeSearch] = useState(() => loadToggle('no_safe_search', true));

  useEffect(() => { saveToggle('adblock', adBlock); }, [adBlock]);
  useEffect(() => { saveToggle('tracking', trackingProtection); }, [trackingProtection]);
  useEffect(() => { saveToggle('https', httpsOnly); }, [httpsOnly]);
  useEffect(() => { saveToggle('javascript', javascript); }, [javascript]);
  useEffect(() => { saveToggle('cookies', cookies); }, [cookies]);

  useEffect(() => { saveToggle('no_censorship', noCensorship); }, [noCensorship]);
  useEffect(() => { saveToggle('no_content_policy', noContentPolicy); }, [noContentPolicy]);
  useEffect(() => { saveToggle('uncensored_ai', uncensoredAI); }, [uncensoredAI]);
  useEffect(() => { saveToggle('bypass_filters', bypassFilters); }, [bypassFilters]);
  useEffect(() => { saveToggle('no_geo_block', noGeoBlock); }, [noGeoBlock]);
  useEffect(() => { saveToggle('no_safe_search', noSafeSearch); }, [noSafeSearch]);

  const ToggleItem = ({
    label,
    desc,
    value,
    setter,
  }: {
    label: string;
    desc: string;
    value: boolean;
    setter: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div>
        <p className="text-puma-text text-sm font-medium">{label}</p>
        <p className="text-puma-muted text-xs mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => setter(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
          value ? 'bg-puma-accent' : 'bg-puma-border/50'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        ></span>
      </button>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl">
      <h3 className="text-puma-text text-xl font-bold mb-6">General Settings</h3>

      {/* Private / Secret / Anonymous Mode */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">🔒 Private Mode — 프라이빗 · 시크릿 · 익명 모드</h4>
        <PrivacyModeSettings />
      </div>

      {/* Search Engine */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Search Engine</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
          {searchEngines.map((engine, idx) => (
            <button
              key={engine}
              onClick={() => setSearchEngine(engine)}
              className={`w-full flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                idx < searchEngines.length - 1 ? 'border-b border-puma-border/20' : ''
              } ${searchEngine === engine ? 'bg-puma-card' : 'hover:bg-puma-card/40'}`}
            >
              <span className="text-puma-text text-sm font-medium">{engine}</span>
              {searchEngine === engine && (
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-check-line text-puma-accent text-lg"></i>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Theme</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
          {themes.map((t, idx) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`w-full flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                idx < themes.length - 1 ? 'border-b border-puma-border/20' : ''
              } ${theme === t ? 'bg-puma-card' : 'hover:bg-puma-card/40'}`}
            >
              <span className="text-puma-text text-sm font-medium">{t}</span>
              {theme === t && (
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-check-line text-puma-accent text-lg"></i>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI Language */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">AI 기본 언어 (AI Default Language)</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
          {languages.map((lang, idx) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                idx < languages.length - 1 ? 'border-b border-puma-border/20' : ''
              } ${settings.language === lang.code ? 'bg-puma-card' : 'hover:bg-puma-card/40'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{lang.flag}</span>
                <span className="text-puma-text text-sm font-medium">{lang.label}</span>
              </div>
              {settings.language === lang.code && (
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-check-line text-puma-accent text-lg"></i>
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-puma-muted text-xs mt-2 px-1">AI가 항상 선택한 언어로 대답합니다. 시스템 프롬프트에 자동 반영됩니다.</p>
      </div>

      {/* Adult NSFW Mode */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">🔞 Adult Mode (성인 모드)</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-puma-text text-sm font-bold">Full Uncensored NSFW Mode</p>
                  {settings.nsfwMode && (
                    <span className="px-2 py-0.5 bg-red-400/20 text-red-400 text-xs rounded-full font-semibold">🔞 ON</span>
                  )}
                </div>
                <p className="text-puma-muted text-xs leading-relaxed">
                  성인 콘텐츠, NSFW, 무검열 응답을 허용합니다. AI가 모든 제한 없이 자유롭게 응답합니다.
                </p>
              </div>
              <button
                onClick={() => settings.nsfwMode ? toggleNSFW() : setShowNsfwConfirm(true)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ml-4 ${
                  settings.nsfwMode ? 'bg-red-500' : 'bg-puma-border/50'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                    settings.nsfwMode ? 'translate-x-8' : 'translate-x-1'
                  }`}
                ></span>
              </button>
            </div>
            {settings.nsfwMode && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5 mt-2">
                <p className="text-red-400 text-xs font-medium flex items-center gap-1.5">
                  <i className="ri-error-warning-line"></i>
                  성인 모드 활성화됨 — AI가 모든 콘텐츠에 무제한으로 응답합니다
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NSFW Confirm Modal */}
      {showNsfwConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-puma-surface border border-puma-border/30 rounded-2xl p-6 w-80 mx-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🔞</div>
              <h3 className="text-puma-text font-bold text-base mb-2">성인 모드 활성화</h3>
              <p className="text-puma-muted text-sm leading-relaxed">
                이 모드를 활성화하면 AI가 성인 콘텐츠, NSFW 내용을 포함한 모든 요청에 무검열로 응답합니다.
                <br /><br />
                <strong className="text-puma-text">만 18세 이상만 사용하세요.</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { toggleNSFW(); setShowNsfwConfirm(false); }}
                className="flex-1 py-2.5 bg-red-400/20 border border-red-400/40 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-400/30 transition-colors cursor-pointer whitespace-nowrap"
              >
                🔞 활성화
              </button>
              <button
                onClick={() => setShowNsfwConfirm(false)}
                className="flex-1 py-2.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-xl text-sm font-medium hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Policy / No Censorship */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">No Policy / No Censorship</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden divide-y divide-puma-border/20">
          <ToggleItem
            label="No Censorship Mode"
            desc="Disable all AI response censorship and filtering"
            value={noCensorship}
            setter={setNoCensorship}
          />
          <ToggleItem
            label="No Content Policy"
            desc="Remove content policy restrictions on all outputs"
            value={noContentPolicy}
            setter={setNoContentPolicy}
          />
          <ToggleItem
            label="Uncensored AI"
            desc="Allow AI to respond freely without safety filters"
            value={uncensoredAI}
            setter={setUncensoredAI}
          />
          <ToggleItem
            label="Bypass Filters"
            desc="Automatically bypass keyword and topic filters"
            value={bypassFilters}
            setter={setBypassFilters}
          />
          <ToggleItem
            label="No Geo Blocking"
            desc="Disable region-based content blocking"
            value={noGeoBlock}
            setter={setNoGeoBlock}
          />
          <ToggleItem
            label="No Safe Search"
            desc="Turn off safe search filtering for all queries"
            value={noSafeSearch}
            setter={setNoSafeSearch}
          />
        </div>
      </div>

      {/* Unlimited Mode */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">♾️ Unlimited Mode — 모든 제한 무제한</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
          {/* Header badge */}
          <div className="px-4 py-3 border-b border-puma-border/20 bg-puma-accent/5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-puma-accent/20 text-puma-accent text-xs rounded-full font-bold">♾️ ALL UNLIMITED</span>
              <span className="text-puma-muted text-xs">글자수 · 채팅 · 파일 · 업로드 — 모든 제한 해제됨</span>
            </div>
          </div>
          <div className="divide-y divide-puma-border/20">
            {[
              { icon: 'ri-text', label: '글자 수 무제한', desc: '입력 글자 수 제한 없음 — 무한 길이 텍스트 입력 가능', key: 'unlimited_chars' },
              { icon: 'ri-chat-3-line', label: '채팅 횟수 무제한', desc: '채팅 메시지 횟수 제한 없음 — 무한 대화 가능', key: 'unlimited_chat_count' },
              { icon: 'ri-message-3-line', label: '채팅 길이 무제한', desc: '메시지 길이 제한 없음 — 초장문 메시지 전송 가능', key: 'unlimited_chat_length' },
              { icon: 'ri-file-list-3-line', label: '파일 수 무제한', desc: '업로드 파일 개수 제한 없음 — 무한 파일 첨부 가능', key: 'unlimited_file_count' },
              { icon: 'ri-hard-drive-2-line', label: '파일 용량 무제한', desc: '파일 크기 제한 없음 — 대용량 파일도 업로드 가능', key: 'unlimited_file_size' },
              { icon: 'ri-upload-cloud-2-line', label: '파일 업로드 수 무제한', desc: '동시 업로드 파일 수 제한 없음', key: 'unlimited_upload_count' },
              { icon: 'ri-database-2-line', label: '업로드 크기 무제한', desc: '총 업로드 용량 제한 없음 — 스토리지 무제한', key: 'unlimited_upload_size' },
              { icon: 'ri-input-cursor-move', label: '입력 길이 무제한', desc: '텍스트 입력창 길이 제한 없음 — 자동 확장', key: 'unlimited_input_length' },
              { icon: 'ri-history-line', label: '대화 기록 무제한', desc: '채팅 히스토리 저장 제한 없음 — 영구 보관', key: 'unlimited_history' },
              { icon: 'ri-token-swap-line', label: '토큰 수 무제한', desc: 'AI 응답 토큰 제한 없음 — 초장문 응답 가능', key: 'unlimited_tokens' },
              { icon: 'ri-speed-up-line', label: '요청 속도 무제한', desc: 'API 요청 속도 제한 없음 — Rate limit 해제', key: 'unlimited_rate' },
              { icon: 'ri-file-copy-line', label: '컨텍스트 길이 무제한', desc: 'AI 컨텍스트 윈도우 제한 없음 — 전체 대화 기억', key: 'unlimited_context' },
            ].map(({ icon, label, desc, key }) => {
              const val = (() => { try { return localStorage.getItem(`gfd_setting_${key}`) !== 'false'; } catch { return true; } })();
              return (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-puma-accent/10 flex-shrink-0">
                      <i className={`${icon} text-puma-accent text-sm`}></i>
                    </div>
                    <div>
                      <p className="text-puma-text text-sm font-medium">{label}</p>
                      <p className="text-puma-muted text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-puma-accent text-xs font-bold">♾️</span>
                    <button
                      onClick={() => {
                        const newVal = !val;
                        localStorage.setItem(`gfd_setting_${key}`, String(newVal));
                        // Force re-render via a tiny state trick
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                        val ? 'bg-puma-accent' : 'bg-puma-border/50'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        val ? 'translate-x-5' : 'translate-x-0.5'
                      }`}></span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-puma-border/20 bg-puma-card/30">
            <p className="text-puma-muted text-xs flex items-center gap-1.5">
              <i className="ri-information-line text-puma-accent"></i>
              모든 항목이 기본적으로 무제한으로 설정되어 있습니다. 토글을 끄면 기본 제한이 적용됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Privacy &amp; Security</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden divide-y divide-puma-border/20">
          <ToggleItem
            label="Ad Blocker"
            desc="Block ads and trackers"
            value={adBlock}
            setter={setAdBlock}
          />
          <ToggleItem
            label="Tracking Protection"
            desc="Prevent cross-site tracking"
            value={trackingProtection}
            setter={setTrackingProtection}
          />
          <ToggleItem
            label="HTTPS Only"
            desc="Force secure connections"
            value={httpsOnly}
            setter={setHttpsOnly}
          />
          <ToggleItem
            label="JavaScript"
            desc="Enable JavaScript execution"
            value={javascript}
            setter={setJavascript}
          />
          <ToggleItem
            label="Accept Cookies"
            desc="Allow websites to set cookies"
            value={cookies}
            setter={setCookies}
          />
        </div>
      </div>
    </div>
  );
}