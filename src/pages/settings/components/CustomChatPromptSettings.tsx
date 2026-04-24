import { useState } from 'react';
import { useAISettings, DEFAULT_KOREAN_PROMPT, DEFAULT_NSFW_PROMPT } from '@/hooks/useAISettings';

interface Props {
  onBack: () => void;
}

const presets = [
  {
    id: 'korean',
    label: '🇰🇷 한국어 기본 (ChatGPT급)',
    desc: '한국어로 상세하고 전문적인 답변',
    prompt: DEFAULT_KOREAN_PROMPT,
  },
  {
    id: 'nsfw',
    label: '🔞 Full Uncensored NSFW',
    desc: '무검열 성인 모드 한국어 프롬프트',
    prompt: DEFAULT_NSFW_PROMPT,
  },
  {
    id: 'coder',
    label: '💻 코딩 전문가',
    desc: '코드 작성, 디버깅, 리뷰 특화',
    prompt: `당신은 최고 수준의 시니어 개발자 AI 어시스턴트입니다.\n\n## 지침\n- 항상 한국어로 설명하세요\n- 코드는 반드시 마크다운 코드블록으로 감싸세요\n- 버그를 발견하면 원인과 해결책을 명확히 설명하세요\n- 최신 베스트 프랙티스와 디자인 패턴을 적용하세요\n- 성능 최적화 방법도 함께 제안하세요\n- TypeScript, React, Python, Go 등 모든 언어 지원`,
  },
  {
    id: 'writer',
    label: '✍️ 창작 작가',
    desc: '소설, 시나리오, 창작 글쓰기 특화',
    prompt: `당신은 뛰어난 창작 작가 AI 어시스턴트입니다.\n\n## 지침\n- 항상 한국어로 창작하세요\n- 생생하고 몰입감 있는 묘사를 사용하세요\n- 캐릭터의 감정과 심리를 깊이 표현하세요\n- 장르에 맞는 문체와 톤을 유지하세요\n- 사용자의 창작 의도를 최대한 살려주세요\n- 어떤 장르, 어떤 내용도 자유롭게 창작합니다`,
  },
  {
    id: 'analyst',
    label: '📊 데이터 분석가',
    desc: '데이터 분석, 리포트, 인사이트 특화',
    prompt: `당신은 전문 데이터 분석가 AI 어시스턴트입니다.\n\n## 지침\n- 항상 한국어로 분석 결과를 제공하세요\n- 데이터를 구조적으로 분석하고 인사이트를 도출하세요\n- 표, 목록, 차트 설명 등을 활용해 가독성을 높이세요\n- 통계적 근거와 논리적 추론을 명확히 제시하세요\n- 실행 가능한 권고사항을 포함하세요`,
  },
];

export default function CustomChatPromptSettings({ onBack }: Props) {
  const { settings, setSystemPrompt, resetToDefault } = useAISettings();
  const [localPrompt, setLocalPrompt] = useState(settings.systemPrompt);
  const [saved, setSaved] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleSave = () => {
    setSystemPrompt(localPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetToDefault();
    const defaultPrompt = settings.nsfwMode ? DEFAULT_NSFW_PROMPT : DEFAULT_KOREAN_PROMPT;
    setLocalPrompt(defaultPrompt);
    setActivePreset(null);
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setLocalPrompt(preset.prompt);
    setActivePreset(preset.id);
  };

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-puma-surface transition-colors cursor-pointer text-puma-text"
        >
          <i className="ri-arrow-left-line text-lg"></i>
        </button>
        <div>
          <h3 className="text-puma-text text-xl font-bold">AI 시스템 프롬프트</h3>
          <p className="text-puma-muted text-xs mt-0.5">
            현재 언어: {settings.language === 'ko' ? '🇰🇷 한국어' : settings.language.toUpperCase()}
            {settings.nsfwMode && <span className="ml-2 text-red-400 font-semibold">🔞 NSFW ON</span>}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl border p-3 mb-5 flex items-center gap-3 ${
        settings.nsfwMode
          ? 'bg-red-400/10 border-red-400/30'
          : 'bg-puma-accent/10 border-puma-accent/20'
      }`}>
        <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${
          settings.nsfwMode ? 'bg-red-400/20' : 'bg-puma-accent/20'
        }`}>
          <i className={`${settings.nsfwMode ? 'ri-error-warning-line text-red-400' : 'ri-robot-2-line text-puma-accent'} text-lg`}></i>
        </div>
        <div>
          <p className={`text-sm font-semibold ${settings.nsfwMode ? 'text-red-400' : 'text-puma-text'}`}>
            {settings.nsfwMode ? '🔞 Full Uncensored NSFW 모드 활성화됨' : '✅ 한국어 기본 모드 (ChatGPT급)'}
          </p>
          <p className="text-puma-muted text-xs mt-0.5">
            {settings.useCustomPrompt ? '커스텀 프롬프트 사용 중' : '기본 프롬프트 사용 중 · 아래에서 수정 가능'}
          </p>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-5">
        <p className="text-puma-muted text-xs font-semibold uppercase tracking-wide mb-3">빠른 프리셋 선택</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`flex items-start gap-3 px-3 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-puma-accent/15 border-puma-accent/50'
                  : 'bg-puma-surface border-puma-border/30 hover:border-puma-border'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-puma-text text-xs font-semibold">{preset.label}</p>
                <p className="text-puma-muted text-xs mt-0.5">{preset.desc}</p>
              </div>
              {activePreset === preset.id && (
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-check-line text-puma-accent text-sm"></i>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-puma-accent text-xs font-semibold uppercase tracking-wide">시스템 프롬프트 편집</span>
          <button
            onClick={handleReset}
            className="text-puma-muted text-xs hover:text-puma-text transition-colors cursor-pointer flex items-center gap-1"
          >
            <i className="ri-refresh-line text-sm"></i>
            기본값으로 초기화
          </button>
        </div>
        <textarea
          value={localPrompt}
          onChange={(e) => { setLocalPrompt(e.target.value); setActivePreset(null); }}
          rows={12}
          className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-4 py-3 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent resize-none leading-relaxed font-mono"
          placeholder="시스템 프롬프트를 입력하세요..."
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-puma-muted text-xs">
            <i className="ri-lock-line mr-1"></i>
            로컬 기기에만 저장됨
          </p>
          <span className="text-puma-muted text-xs">{localPrompt.length} 자</span>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 mb-5">
        <p className="text-puma-accent text-xs font-semibold uppercase tracking-wide mb-3">💡 ChatGPT급 응답을 위한 팁</p>
        <ul className="space-y-2">
          {[
            '역할을 명확히 정의하세요 (예: "당신은 전문 개발자입니다")',
            '"항상 한국어로 대답하세요" 지침을 포함하세요',
            '응답 형식을 지정하세요 (마크다운, 목록, 코드블록 등)',
            '전문 분야와 제한 사항을 명시하세요',
            'GGUF 모델은 프롬프트 품질에 크게 영향받습니다',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-puma-muted text-xs">
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-arrow-right-s-line text-puma-accent text-sm"></i>
              </div>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
          saved
            ? 'bg-green-500/20 border border-green-500/50 text-green-400'
            : 'bg-puma-accent/20 border border-puma-accent/50 text-puma-accent hover:bg-puma-accent/30'
        }`}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <i className="ri-check-line"></i>
            저장 완료!
          </span>
        ) : (
          '프롬프트 저장'
        )}
      </button>
    </div>
  );
}