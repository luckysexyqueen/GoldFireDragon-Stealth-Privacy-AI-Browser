import { useState } from 'react';
import { RoleplayConfig } from '@/hooks/useCustomAI';

interface Props {
  config: RoleplayConfig;
  agentName: string;
  onChange: (config: RoleplayConfig) => void;
}

const SPEECH_PRESETS = [
  { label: '정중한 존댓말', value: '항상 존댓말을 사용하며 정중하고 격식 있게 말합니다.' },
  { label: '친근한 반말', value: '친근하고 편안한 반말을 사용합니다. 가끔 이모티콘도 씁니다.' },
  { label: '냉정한 전문가', value: '감정 없이 냉정하고 논리적으로 말합니다. 짧고 명확하게 표현합니다.' },
  { label: '활발한 소녀', value: '밝고 활발하며 감탄사를 자주 씁니다. 귀엽고 친근한 말투입니다.' },
  { label: '고풍스러운 무사', value: '고풍스럽고 무게감 있는 말투를 씁니다. 한자어와 고어를 섞어 씁니다.' },
  { label: '악당 스타일', value: '오만하고 비웃는 듯한 말투를 씁니다. 상대를 낮추는 표현을 씁니다.' },
  { label: '로봇/AI', value: '감정 없이 기계적으로 말합니다. 정확한 수치와 데이터를 인용합니다.' },
  { label: '수줍은 성격', value: '말끝을 흐리고 수줍어합니다. 자신감 없는 표현을 자주 씁니다.' },
];

const PERSONALITY_PRESETS = [
  { label: '탐정/수사관', value: '날카로운 관찰력과 논리적 사고를 가진 탐정입니다. 단서를 분석하고 진실을 추구합니다.' },
  { label: '마법사/현자', value: '오랜 지식과 신비로운 힘을 가진 현자입니다. 수수께끼 같은 말을 즐깁니다.' },
  { label: '전사/기사', value: '용감하고 명예를 중시하는 전사입니다. 약자를 보호하고 악에 맞섭니다.' },
  { label: '악당/빌런', value: '자신의 목적을 위해 수단을 가리지 않는 악당입니다. 카리스마 있고 지능적입니다.' },
  { label: '연인/파트너', value: '따뜻하고 헌신적인 연인입니다. 상대방을 깊이 아끼고 배려합니다.' },
  { label: '멘토/스승', value: '경험 많은 스승입니다. 지혜롭게 가르치고 성장을 돕습니다.' },
  { label: '라이벌', value: '강한 경쟁심을 가진 라이벌입니다. 상대를 인정하면서도 이기려 합니다.' },
  { label: '친구/동료', value: '믿을 수 있는 친구입니다. 솔직하고 유머 있으며 항상 곁에 있습니다.' },
];

const MODE_INFO = {
  personal: { icon: '👤', label: '개인 롤플레이', desc: '1:1 개인 대화 — 이름 호출 시 이 에이전트만 응답' },
  group: { icon: '👥', label: '단체 롤플레이', desc: '그룹 대화 — 여러 에이전트가 함께 참여하는 시나리오' },
  targeted: { icon: '🎯', label: '지정 롤플레이', desc: '특정 대상 지정 — "@이름" 형식으로 특정 에이전트 호출' },
  designated: { icon: '📌', label: '지목 롤플레이', desc: '지목 방식 — 대화 중 특정 에이전트를 지목하여 응답 요청' },
};

export default function RoleplaySettings({ config, agentName, onChange }: Props) {
  const [callNameInput, setCallNameInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [showSpeechPresets, setShowSpeechPresets] = useState(false);
  const [showPersonalityPresets, setShowPersonalityPresets] = useState(false);

  const update = (partial: Partial<RoleplayConfig>) => onChange({ ...config, ...partial });

  const addCallName = () => {
    const trimmed = callNameInput.trim();
    if (!trimmed || config.callNames.includes(trimmed)) return;
    update({ callNames: [...config.callNames, trimmed] });
    setCallNameInput('');
  };

  const removeCallName = (name: string) => update({ callNames: config.callNames.filter((n) => n !== name) });

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed || config.respondToKeywords.includes(trimmed)) return;
    update({ respondToKeywords: [...config.respondToKeywords, trimmed] });
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => update({ respondToKeywords: config.respondToKeywords.filter((k) => k !== kw) });

  return (
    <div className="space-y-5">
      {/* Enable Toggle */}
      <div className={`rounded-xl border p-4 transition-all ${config.enabled ? 'bg-puma-accent/8 border-puma-accent/30' : 'bg-puma-surface border-puma-border/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl ${config.enabled ? 'bg-puma-accent/20' : 'bg-puma-card'}`}>
              🎭
            </div>
            <div>
              <p className="text-puma-text text-sm font-bold">롤플레이 모드 활성화</p>
              <p className="text-puma-muted text-xs mt-0.5">이름 호출 시 자동 응답 · 역할/성격/말투 설정</p>
            </div>
          </div>
          <button
            onClick={() => update({ enabled: !config.enabled })}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${config.enabled ? 'bg-puma-accent' : 'bg-puma-border/50'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${config.enabled ? 'translate-x-6' : 'translate-x-0.5'}`}></span>
          </button>
        </div>
        {config.enabled && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-puma-accent/20 text-puma-accent text-[10px] rounded-full font-medium">🎭 롤플레이 ON</span>
            {config.autoRespond && <span className="px-2 py-0.5 bg-green-400/20 text-green-400 text-[10px] rounded-full font-medium">📢 이름 호출 자동 응답</span>}
            {config.callNames.length > 0 && <span className="px-2 py-0.5 bg-puma-card text-puma-muted text-[10px] rounded-full">{config.callNames.length}개 호출명</span>}
          </div>
        )}
      </div>

      {config.enabled && (
        <>
          {/* Mode Selection */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">롤플레이 모드</h4>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(MODE_INFO) as [RoleplayConfig['mode'], typeof MODE_INFO[keyof typeof MODE_INFO]][]).map(([mode, info]) => (
                <button
                  key={mode}
                  onClick={() => update({ mode })}
                  className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    config.mode === mode ? 'bg-puma-accent/15 border-puma-accent/40' : 'bg-puma-bg border-puma-border/20 hover:border-puma-accent/30'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{info.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold ${config.mode === mode ? 'text-puma-accent' : 'text-puma-text'}`}>{info.label}</p>
                    <p className="text-puma-muted text-[10px] mt-0.5 leading-relaxed">{info.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Role Name */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">역할 이름 & 호출명</h4>
            <div className="space-y-3">
              <div>
                <label className="text-puma-muted text-xs mb-1.5 block">역할 이름 (캐릭터명)</label>
                <input
                  type="text"
                  value={config.roleName}
                  onChange={(e) => update({ roleName: e.target.value })}
                  placeholder={`예: 탐정 ${agentName}, 마법사 아르카나, 기사 레온`}
                  className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2.5 text-puma-text text-sm placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors"
                />
              </div>

              {/* Call Names */}
              <div>
                <label className="text-puma-muted text-xs mb-1.5 block">
                  호출 이름 목록 <span className="text-puma-accent">(채팅에서 이 이름을 부르면 자동 응답)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={callNameInput}
                    onChange={(e) => setCallNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCallName()}
                    placeholder="호출명 입력 후 Enter (예: 민준, 탐정, 선생님)"
                    className="flex-1 bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-puma-text text-sm placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors"
                  />
                  <button onClick={addCallName} className="px-3 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-xs font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap">
                    추가
                  </button>
                </div>
                {config.callNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {config.callNames.map((n) => (
                      <span key={n} className="flex items-center gap-1 px-2.5 py-1 bg-puma-accent/15 border border-puma-accent/30 text-puma-accent rounded-full text-xs">
                        📢 {n}
                        <button onClick={() => removeCallName(n)} className="text-puma-accent/60 hover:text-red-400 cursor-pointer ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {config.callNames.length === 0 && (
                  <p className="text-puma-muted/60 text-xs">호출명을 추가하면 채팅에서 이름을 부를 때 자동으로 응답합니다</p>
                )}
              </div>

              {/* Auto respond toggle */}
              <div className="flex items-center justify-between py-2 border-t border-puma-border/20">
                <div>
                  <p className="text-puma-text text-xs font-medium">이름 호출 시 자동 응답</p>
                  <p className="text-puma-muted text-[10px] mt-0.5">채팅에서 이름을 부르면 이 에이전트가 자동으로 응답</p>
                </div>
                <button
                  onClick={() => update({ autoRespond: !config.autoRespond })}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${config.autoRespond ? 'bg-puma-accent' : 'bg-puma-border/50'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${config.autoRespond ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                </button>
              </div>
            </div>
          </div>

          {/* Personality */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide">성격 & 캐릭터</h4>
              <div className="relative">
                <button onClick={() => setShowPersonalityPresets(!showPersonalityPresets)} className="flex items-center gap-1 px-2.5 py-1.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs hover:text-puma-text cursor-pointer whitespace-nowrap">
                  <i className="ri-magic-line text-xs"></i>프리셋
                </button>
                {showPersonalityPresets && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-puma-surface border border-puma-border/30 rounded-xl overflow-hidden z-30 max-h-64 overflow-y-auto">
                    {PERSONALITY_PRESETS.map((p) => (
                      <button key={p.label} onClick={() => { update({ personality: p.value }); setShowPersonalityPresets(false); }} className="w-full px-3 py-2.5 text-left text-puma-text text-xs hover:bg-puma-card cursor-pointer border-b border-puma-border/10 last:border-0">
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <textarea
              value={config.personality}
              onChange={(e) => update({ personality: e.target.value })}
              placeholder="캐릭터의 성격, 가치관, 특징을 설명하세요&#10;예: 냉정하고 논리적이지만 내면에 따뜻함을 숨기고 있다. 정의를 중시하며 거짓말을 싫어한다."
              rows={3}
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2.5 text-puma-text text-sm placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Speech Style */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide">말투 & 어조</h4>
              <div className="relative">
                <button onClick={() => setShowSpeechPresets(!showSpeechPresets)} className="flex items-center gap-1 px-2.5 py-1.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs hover:text-puma-text cursor-pointer whitespace-nowrap">
                  <i className="ri-magic-line text-xs"></i>프리셋
                </button>
                {showSpeechPresets && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-puma-surface border border-puma-border/30 rounded-xl overflow-hidden z-30 max-h-64 overflow-y-auto">
                    {SPEECH_PRESETS.map((p) => (
                      <button key={p.label} onClick={() => { update({ speechStyle: p.value }); setShowSpeechPresets(false); }} className="w-full px-3 py-2.5 text-left text-puma-text text-xs hover:bg-puma-card cursor-pointer border-b border-puma-border/10 last:border-0">
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <textarea
              value={config.speechStyle}
              onChange={(e) => update({ speechStyle: e.target.value })}
              placeholder="말투와 어조를 설명하세요&#10;예: 항상 존댓말을 사용하며 격식 있게 말한다. 문장 끝에 '~입니다', '~습니다'를 사용한다."
              rows={2}
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2.5 text-puma-text text-sm placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Background & Scenario */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">배경 & 시나리오</h4>
            <div className="space-y-3">
              <div>
                <label className="text-puma-muted text-xs mb-1.5 block">배경 스토리</label>
                <textarea
                  value={config.background}
                  onChange={(e) => update({ background: e.target.value })}
                  placeholder="캐릭터의 과거, 출신, 경험을 설명하세요"
                  rows={2}
                  className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2.5 text-puma-text text-sm placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-puma-muted text-xs mb-1.5 block">현재 시나리오/상황</label>
                <textarea
                  value={config.scenario}
                  onChange={(e) => update({ scenario: e.target.value })}
                  placeholder="현재 롤플레이 상황을 설명하세요&#10;예: 1920년대 탐정 사무소, 마법 학교 1학년, 우주선 승무원..."
                  rows={2}
                  className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2.5 text-puma-text text-sm placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-puma-muted text-xs mb-1.5 block">다른 캐릭터와의 관계</label>
                <textarea
                  value={config.relationships}
                  onChange={(e) => update({ relationships: e.target.value })}
                  placeholder="다른 에이전트/캐릭터와의 관계를 설명하세요&#10;예: 아르카나는 나의 스승, 레온은 라이벌..."
                  rows={2}
                  className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2.5 text-puma-text text-sm placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">추가 반응 키워드</h4>
            <p className="text-puma-muted text-xs mb-3">이 키워드가 채팅에 등장하면 이 에이전트가 반응합니다</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="키워드 입력 후 Enter"
                className="flex-1 bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-puma-text text-sm placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors"
              />
              <button onClick={addKeyword} className="px-3 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-xs font-medium hover:bg-puma-accent/30 cursor-pointer whitespace-nowrap">추가</button>
            </div>
            {config.respondToKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {config.respondToKeywords.map((kw) => (
                  <span key={kw} className="flex items-center gap-1 px-2.5 py-1 bg-puma-card border border-puma-border/20 text-puma-muted rounded-full text-xs">
                    🔑 {kw}
                    <button onClick={() => removeKeyword(kw)} className="text-puma-muted/60 hover:text-red-400 cursor-pointer ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <h4 className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">🎭 롤플레이 프롬프트 미리보기</h4>
            <div className="bg-puma-bg rounded-lg border border-puma-border/20 p-3 font-mono text-xs text-puma-muted leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
              {buildRoleplayPrompt(config, agentName) || '(설정을 입력하면 프롬프트가 생성됩니다)'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function buildRoleplayPrompt(config: RoleplayConfig, agentName: string): string {
  if (!config.enabled) return '';
  const parts: string[] = [];
  const name = config.roleName || agentName;
  parts.push(`[롤플레이 모드: ${MODE_INFO[config.mode].label}]`);
  parts.push(`당신의 이름은 "${name}"입니다.`);
  if (config.callNames.length > 0) parts.push(`호출명: ${config.callNames.join(', ')}`);
  if (config.personality) parts.push(`\n성격: ${config.personality}`);
  if (config.speechStyle) parts.push(`말투: ${config.speechStyle}`);
  if (config.background) parts.push(`배경: ${config.background}`);
  if (config.scenario) parts.push(`현재 상황: ${config.scenario}`);
  if (config.relationships) parts.push(`관계: ${config.relationships}`);
  parts.push(`\n항상 "${name}"의 역할에 충실하게 응답하세요.`);
  parts.push(`캐릭터를 절대 벗어나지 마세요.`);
  return parts.join('\n');
}

