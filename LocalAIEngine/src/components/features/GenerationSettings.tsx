import { useState, useRef } from 'react';
import { Sliders, RotateCcw, Sparkles, ChevronDown, ChevronUp, Save, Trash2, Download, Cloud } from 'lucide-react';
import { GenerationConfig } from '@/types/engine';
import { PLAYGROUND_PRESETS, DEFAULT_GENERATION_CONFIG } from '@/constants/presets';
import { DBModelProfile } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface GenerationSettingsProps {
  config: GenerationConfig;
  onChange: (config: Partial<GenerationConfig>) => void;
  profiles: DBModelProfile[];
  profilesLoading: boolean;
  onSaveProfile: (name: string, description: string, config: GenerationConfig) => Promise<boolean>;
  onDeleteProfile: (id: string, name: string) => Promise<void>;
  onLoadProfile: (profile: DBModelProfile) => void;
}

export default function GenerationSettings({
  config,
  onChange,
  profiles,
  profilesLoading,
  onSaveProfile,
  onDeleteProfile,
  onLoadProfile,
}: GenerationSettingsProps) {
  const [expandAdvanced, setExpandAdvanced] = useState(false);
  const [expandProfiles, setExpandProfiles] = useState(true);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReset = () => {
    onChange(DEFAULT_GENERATION_CONFIG);
  };

  const applyPreset = (preset: typeof PLAYGROUND_PRESETS[0]) => {
    onChange({
      system_prompt: preset.system_prompt,
      temperature: preset.temperature,
    });
  };

  const handleSaveProfile = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    await onSaveProfile(saveName.trim(), saveDesc.trim(), config);
    setSaving(false);
    setSaveName('');
    setSaveDesc('');
  };

  const SliderField = ({
    label, value, min, max, step, onChange: fieldChange, unit = '', description
  }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; unit?: string; description?: string;
  }) => (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs text-gray-400 terminal-text">{label}</label>
        <span className="text-xs text-[#00d4aa] terminal-text font-mono font-bold">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => fieldChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #00d4aa ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
      {description && <p className="text-[10px] text-gray-700 terminal-text mt-0.5">{description}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Cloud Profiles */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandProfiles(!expandProfiles)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-400 terminal-text hover:text-gray-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-[#00d4ff]" />
            클라우드 프로필
            {profiles.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border border-[rgba(0,212,255,0.2)]">
                {profiles.length}
              </span>
            )}
          </span>
          {expandProfiles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expandProfiles && (
          <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[rgba(255,255,255,0.05)]">
            {/* Save Form */}
            <div className="flex flex-col gap-2 pt-3">
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="프로필 이름..."
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-xs text-gray-300 terminal-text outline-none focus:border-[rgba(0,212,170,0.3)]"
              />
              <input
                value={saveDesc}
                onChange={e => setSaveDesc(e.target.value)}
                placeholder="설명 (선택)..."
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-xs text-gray-300 terminal-text outline-none focus:border-[rgba(0,212,170,0.3)]"
              />
              <button
                onClick={handleSaveProfile}
                disabled={!saveName.trim() || saving}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] text-[#00d4aa] text-xs terminal-text hover:bg-[rgba(0,212,170,0.2)] transition-all disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? '저장 중...' : '현재 설정 저장'}
              </button>
            </div>

            {/* Saved Profiles List */}
            {profilesLoading ? (
              <div className="text-xs text-gray-600 terminal-text py-2 text-center animate-pulse">불러오는 중...</div>
            ) : profiles.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {profiles.map(profile => (
                  <div key={profile.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,212,170,0.2)] group transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-300 terminal-text font-medium truncate">{profile.name}</div>
                      {profile.description && (
                        <div className="text-[10px] text-gray-600 terminal-text truncate">{profile.description}</div>
                      )}
                      <div className="text-[10px] text-gray-700 terminal-text">T:{profile.temperature} · {profile.max_tokens}tok</div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => onLoadProfile(profile)}
                        className="p-1.5 rounded text-gray-600 hover:text-[#00d4aa] transition-colors"
                        title="적용"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProfile(profile.id, profile.name)}
                        className="p-1.5 rounded text-gray-600 hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-700 terminal-text text-center py-1">저장된 프로필 없음</div>
            )}
          </div>
        )}
      </div>

      {/* Presets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#00d4aa]" />
          <span className="text-xs font-semibold text-gray-400 terminal-text">로컬 프리셋</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PLAYGROUND_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="px-3 py-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(0,212,170,0.25)] hover:bg-[rgba(0,212,170,0.05)] transition-all text-left group"
            >
              <div className="text-xs font-medium text-gray-300 group-hover:text-[#00d4aa] terminal-text transition-colors">{preset.name}</div>
              <div className="text-[10px] text-gray-700 terminal-text mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <label className="text-xs text-gray-400 terminal-text block mb-1.5">시스템 프롬프트</label>
        <textarea
          value={config.system_prompt}
          onChange={e => onChange({ system_prompt: e.target.value })}
          rows={4}
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2 text-xs text-gray-300 terminal-text outline-none focus:border-[rgba(0,212,170,0.3)] resize-none leading-relaxed"
          placeholder="AI의 역할과 행동 방식을 정의하세요..."
        />
      </div>

      {/* Core Sliders */}
      <div className="flex flex-col gap-4">
        <SliderField
          label="Temperature (창의성)"
          value={config.temperature}
          min={0} max={2} step={0.05}
          onChange={v => onChange({ temperature: v })}
          description="높을수록 창의적, 낮을수록 일관적"
        />
        <SliderField
          label="Max Tokens (최대 길이)"
          value={config.max_tokens}
          min={64} max={8192} step={64}
          onChange={v => onChange({ max_tokens: v })}
          description="생성할 최대 토큰 수"
        />
      </div>

      {/* Advanced Toggle */}
      <button
        onClick={() => setExpandAdvanced(!expandAdvanced)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-xs text-gray-500 terminal-text hover:text-gray-400 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sliders className="w-3 h-3" />
          고급 설정
        </span>
        {expandAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expandAdvanced && (
        <div className="flex flex-col gap-4">
          <SliderField
            label="Top-P (핵심 샘플링)"
            value={config.top_p}
            min={0.1} max={1} step={0.05}
            onChange={v => onChange({ top_p: v })}
            description="누적 확률 임계값"
          />
          <SliderField
            label="Repetition Penalty (반복 억제)"
            value={config.repetition_penalty}
            min={1} max={2} step={0.05}
            onChange={v => onChange({ repetition_penalty: v })}
            description="반복 표현을 줄임. 1.0 = 비활성"
          />

          {/* Stream Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs text-gray-400 terminal-text">스트리밍 출력</label>
              <p className="text-[10px] text-gray-700 terminal-text">토큰을 실시간으로 표시 (WebLLM만 완전 지원)</p>
            </div>
            <button
              onClick={() => onChange({ stream: !config.stream })}
              className={cn(
                'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
                config.stream ? 'bg-[rgba(0,212,170,0.4)] border border-[rgba(0,212,170,0.6)]' : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]'
              )}
            >
              <span
                className={cn('absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200', config.stream ? 'bg-[#00d4aa]' : 'bg-gray-600')}
                style={{ left: config.stream ? '22px' : '2px' }}
              />
            </button>
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={handleReset}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.07)] text-gray-600 text-xs terminal-text hover:text-gray-400 hover:border-[rgba(255,255,255,0.12)] transition-all"
      >
        <RotateCcw className="w-3 h-3" />
        기본값으로 초기화
      </button>
    </div>
  );
}
