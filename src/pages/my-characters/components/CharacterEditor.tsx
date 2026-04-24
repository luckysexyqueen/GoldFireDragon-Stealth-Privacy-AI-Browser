import { useState, useRef, useCallback } from 'react';
import { UserCharacter, CharacterFile, CharacterGender, CharacterRole, CharacterStatus } from '@/hooks/useUserCharacters';

interface Props {
  character: UserCharacter;
  onSave: (char: UserCharacter) => void;
  onClose: () => void;
}

type EditorTab = 'basic' | 'appearance' | 'personality' | 'background' | 'roleplay' | 'files';

const AVATAR_EMOJIS = ['🧑','👩','👨','🧙','🧝','🧛','🤖','👾','🦊','🐉','🌟','⚔️','🌸','🔥','💎','🌙','🦁','🐺','🦋','🌊','⚡','🎭','🗡️','🛡️','🌺','🍀','🦅','🐦','🎪','🎨'];
const CARD_COLORS = ['#f59e0b','#10b981','#6366f1','#ec4899','#14b8a6','#f97316','#8b5cf6','#ef4444','#06b6d4','#84cc16'];

const PERSONALITY_PRESETS = [
  '밝고 활발하며 긍정적인 성격. 항상 웃음을 잃지 않고 주변을 밝게 만든다.',
  '차갑고 냉정하지만 내면에는 따뜻한 마음을 숨기고 있다.',
  '호기심이 많고 탐구적이며 새로운 것을 배우는 것을 좋아한다.',
  '충직하고 의리 있으며 한번 믿은 사람은 끝까지 지킨다.',
  '자유분방하고 규칙에 얽매이지 않으며 자신만의 방식으로 살아간다.',
  '신중하고 계획적이며 모든 일을 꼼꼼하게 처리한다.',
  '장난기 많고 유머 감각이 뛰어나며 분위기를 띄우는 것을 좋아한다.',
  '조용하고 내성적이지만 깊은 생각과 통찰력을 가지고 있다.',
];

const SPEECH_PRESETS = [
  '정중하고 격식 있는 존댓말 사용. 항상 예의 바르게 말한다.',
  '친근하고 편안한 반말 사용. 친구처럼 자연스럽게 대화한다.',
  '고풍스럽고 옛스러운 말투. 고어체나 문어체를 즐겨 사용한다.',
  '짧고 간결하게 말한다. 불필요한 말은 하지 않는다.',
  '감탄사와 이모티콘을 자주 사용하며 활기차게 말한다.',
  '학술적이고 논리적인 말투. 근거와 이유를 항상 제시한다.',
  '시적이고 은유적인 표현을 즐겨 사용한다.',
  '직설적이고 솔직하게 말한다. 돌려 말하지 않는다.',
];

function detectFileKind(file: File): CharacterFile['fileKind'] {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type.startsWith('image/') || ['.jpg','.jpeg','.png','.gif','.webp','.bmp','.svg','.avif'].some(e => name.endsWith(e))) return 'image';
  if (type.startsWith('audio/') || ['.mp3','.wav','.ogg','.flac','.aac'].some(e => name.endsWith(e))) return 'audio';
  if (type.startsWith('video/') || ['.mp4','.webm','.mov','.avi'].some(e => name.endsWith(e))) return 'video';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type === 'application/json' || name.endsWith('.json')) return 'json';
  if (type.startsWith('text/') || ['.txt','.md','.csv','.log','.xml','.html','.css','.js','.ts','.py','.rb','.go','.rs','.yaml','.yml','.toml','.sh'].some(e => name.endsWith(e))) return 'text';
  return 'binary';
}

async function readCharacterFile(file: File): Promise<CharacterFile> {
  const id = `cf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const kind = detectFileKind(file);
  const base: CharacterFile = { id, name: file.name, size: file.size, type: file.type || 'application/octet-stream', fileKind: kind, content: '' };

  return new Promise(resolve => {
    const reader = new FileReader();
    if (kind === 'image') {
      reader.onload = () => { const d = reader.result as string; resolve({ ...base, content: d, previewUrl: d }); };
      reader.onerror = () => resolve(base);
      reader.readAsDataURL(file);
    } else if (kind === 'text' || kind === 'json') {
      reader.onload = () => resolve({ ...base, content: ((reader.result as string) || '').slice(0, 80000) });
      reader.onerror = () => resolve(base);
      reader.readAsText(file, 'UTF-8');
    } else if (kind === 'audio' || kind === 'video') {
      reader.onload = () => { const d = reader.result as string; resolve({ ...base, content: d }); };
      reader.onerror = () => resolve(base);
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => resolve({ ...base, content: (reader.result as string || '').slice(0, 5000) });
      reader.onerror = () => resolve(base);
      reader.readAsText(file, 'latin1');
    }
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const FILE_KIND_STYLE: Record<CharacterFile['fileKind'], { icon: string; color: string; bg: string }> = {
  image:  { icon: 'ri-image-line',       color: 'text-puma-accent',  bg: 'bg-puma-accent/15' },
  text:   { icon: 'ri-file-text-line',   color: 'text-green-400',    bg: 'bg-green-400/15' },
  json:   { icon: 'ri-file-code-line',   color: 'text-yellow-400',   bg: 'bg-yellow-400/15' },
  pdf:    { icon: 'ri-file-pdf-line',    color: 'text-red-400',      bg: 'bg-red-400/15' },
  audio:  { icon: 'ri-music-line',       color: 'text-pink-400',     bg: 'bg-pink-400/15' },
  video:  { icon: 'ri-video-line',       color: 'text-teal-400',     bg: 'bg-teal-400/15' },
  binary: { icon: 'ri-file-line',        color: 'text-puma-muted',   bg: 'bg-puma-card' },
};

// ─── Input helpers ────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-puma-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-puma-muted/60 text-xs mt-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors ${className}`}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors resize-none"
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent transition-colors cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────
export default function CharacterEditor({ character, onSave, onClose }: Props) {
  const [char, setChar] = useState<UserCharacter>({ ...character });
  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [newTag, setNewTag] = useState('');
  const [newCallName, setNewCallName] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [fileReading, setFileReading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<CharacterFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(<K extends keyof UserCharacter>(key: K, value: UserCharacter[K]) => {
    setChar(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    const saved = { ...char, updatedAt: new Date().toISOString(), status: char.status === 'draft' ? 'active' as CharacterStatus : char.status };
    onSave(saved);
  };

  // Avatar image upload
  const handleAvatarUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      update('avatarImage', reader.result as string);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };

  // File upload
  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setFileReading(true);
    const results: CharacterFile[] = [];
    for (const f of Array.from(fileList)) {
      results.push(await readCharacterFile(f));
    }
    setFileReading(false);
    setChar(prev => ({ ...prev, files: [...prev.files, ...results] }));
  }, []);

  const removeFile = (id: string) => setChar(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));

  const addTag = () => {
    const t = newTag.trim().replace(/^#/, '');
    if (t && !char.tags.includes(t)) {
      update('tags', [...char.tags, t]);
    }
    setNewTag('');
  };

  const removeTag = (t: string) => update('tags', char.tags.filter(x => x !== t));

  const addCallName = () => {
    const n = newCallName.trim();
    if (n && !char.callNames.includes(n)) {
      update('callNames', [...char.callNames, n]);
    }
    setNewCallName('');
  };

  const removeCallName = (n: string) => update('callNames', char.callNames.filter(x => x !== n));

  const TABS: { id: EditorTab; label: string; icon: string }[] = [
    { id: 'basic',       label: '기본',   icon: 'ri-user-line' },
    { id: 'appearance',  label: '외모',   icon: 'ri-eye-line' },
    { id: 'personality', label: '성격',   icon: 'ri-heart-line' },
    { id: 'background',  label: '배경',   icon: 'ri-book-open-line' },
    { id: 'roleplay',    label: '롤플레이', icon: 'ri-gamepad-line' },
    { id: 'files',       label: '파일',   icon: 'ri-folder-line' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-puma-surface rounded-2xl border border-puma-border/30 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-puma-border/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border-2 cursor-pointer"
              style={{ borderColor: char.color + '60', backgroundColor: char.color + '20' }}
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              title="아바타 변경"
            >
              {char.avatarImage ? (
                <img src={char.avatarImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{char.avatar}</span>
              )}
            </div>
            <div>
              <h2 className="text-puma-text font-bold text-base">{char.name || '새 캐릭터'}</h2>
              <p className="text-puma-muted text-xs">{char.nickname ? `"${char.nickname}"` : '캐릭터 편집'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-sm font-semibold hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-save-line mr-1.5"></i>저장
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-text hover:bg-puma-card transition-colors cursor-pointer">
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
        </div>

        {/* Avatar Picker Dropdown */}
        {showAvatarPicker && (
          <div className="px-5 py-3 border-b border-puma-border/30 bg-puma-bg flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-puma-muted text-xs font-semibold">아바타 선택</p>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs hover:border-puma-accent/40 hover:text-puma-accent transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-upload-line text-sm"></i>이미지 업로드
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
              {char.avatarImage && (
                <button onClick={() => update('avatarImage', undefined)} className="px-2.5 py-1 bg-red-400/15 border border-red-400/30 text-red-400 rounded-lg text-xs cursor-pointer whitespace-nowrap">
                  이미지 제거
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { update('avatar', emoji); setShowAvatarPicker(false); }}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-xl transition-all cursor-pointer ${char.avatar === emoji && !char.avatarImage ? 'bg-puma-accent/20 border border-puma-accent/40' : 'bg-puma-card hover:bg-puma-card/80'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* Color picker */}
            <div className="flex items-center gap-2 mt-2">
              <p className="text-puma-muted text-xs">카드 색상:</p>
              {CARD_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => update('color', c)}
                  className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${char.color === c ? 'scale-125 ring-2 ring-white/40' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex items-center gap-0.5 px-4 pt-3 pb-0 border-b border-puma-border/30 overflow-x-auto flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all cursor-pointer border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-puma-accent border-puma-accent'
                  : 'text-puma-muted border-transparent hover:text-puma-text'
              }`}
            >
              <i className={`${tab.icon} text-sm`}></i>
              {tab.label}
              {tab.id === 'files' && char.files.length > 0 && (
                <span className="px-1 py-0.5 bg-puma-accent/20 text-puma-accent text-[10px] rounded-full">{char.files.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── 기본 정보 ── */}
          {activeTab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="캐릭터 이름 *">
                  <Input value={char.name} onChange={v => update('name', v)} placeholder="이름을 입력하세요" />
                </Field>
                <Field label="별명 / 닉네임">
                  <Input value={char.nickname} onChange={v => update('nickname', v)} placeholder="별명 또는 호칭" />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="성별">
                  <Select
                    value={char.gender}
                    onChange={v => update('gender', v as CharacterGender)}
                    options={[
                      { value: 'unknown', label: '미정' },
                      { value: 'male', label: '남성' },
                      { value: 'female', label: '여성' },
                      { value: 'nonbinary', label: '논바이너리' },
                    ]}
                  />
                </Field>
                <Field label="나이">
                  <Input value={char.age} onChange={v => update('age', v)} placeholder="예: 17, 성인, 불명" />
                </Field>
                <Field label="직업 / 신분">
                  <Input value={char.occupation} onChange={v => update('occupation', v)} placeholder="예: 마법사, 학생" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="역할">
                  <Select
                    value={char.role}
                    onChange={v => update('role', v as CharacterRole)}
                    options={[
                      { value: 'hero', label: '🦸 영웅' },
                      { value: 'villain', label: '🦹 악당' },
                      { value: 'support', label: '🤝 조력자' },
                      { value: 'neutral', label: '⚖️ 중립' },
                      { value: 'custom', label: '✨ 커스텀' },
                    ]}
                  />
                </Field>
                {char.role === 'custom' && (
                  <Field label="커스텀 역할명">
                    <Input value={char.customRole} onChange={v => update('customRole', v)} placeholder="역할을 직접 입력" />
                  </Field>
                )}
                <Field label="상태">
                  <Select
                    value={char.status}
                    onChange={v => update('status', v as CharacterStatus)}
                    options={[
                      { value: 'active', label: '✅ 활성' },
                      { value: 'draft', label: '📝 초안' },
                      { value: 'archived', label: '📦 보관됨' },
                    ]}
                  />
                </Field>
              </div>

              {/* Tags */}
              <Field label="태그" hint="Enter 또는 추가 버튼으로 태그 추가">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="#판타지, #마법사, #주인공..."
                    className="flex-1 bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors"
                  />
                  <button onClick={addTag} className="px-3 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm hover:border-puma-accent/40 hover:text-puma-accent transition-colors cursor-pointer whitespace-nowrap">추가</button>
                </div>
                {char.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {char.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-puma-card rounded-lg text-xs text-puma-muted">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="text-puma-muted/60 hover:text-red-400 cursor-pointer"><i className="ri-close-line text-xs"></i></button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </>
          )}

          {/* ── 외모 ── */}
          {activeTab === 'appearance' && (
            <>
              <Field label="전체 외모 설명">
                <Textarea value={char.appearance} onChange={v => update('appearance', v)} placeholder="캐릭터의 전반적인 외모를 자유롭게 묘사하세요..." rows={4} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="키 / 체형">
                  <Input value={char.height} onChange={v => update('height', v)} placeholder="예: 170cm, 작고 날씬한" />
                </Field>
                <Field label="체형 특징">
                  <Input value={char.bodyType} onChange={v => update('bodyType', v)} placeholder="예: 근육질, 날씬, 통통" />
                </Field>
                <Field label="머리카락 색">
                  <Input value={char.hairColor} onChange={v => update('hairColor', v)} placeholder="예: 은발, 검은 단발" />
                </Field>
                <Field label="눈 색">
                  <Input value={char.eyeColor} onChange={v => update('eyeColor', v)} placeholder="예: 붉은 눈, 금빛 눈동자" />
                </Field>
              </div>
              <Field label="의상 스타일">
                <Textarea value={char.clothingStyle} onChange={v => update('clothingStyle', v)} placeholder="주로 입는 옷, 특징적인 아이템, 색상 등..." rows={3} />
              </Field>
            </>
          )}

          {/* ── 성격 & 말투 ── */}
          {activeTab === 'personality' && (
            <>
              <Field label="성격">
                <Textarea value={char.personality} onChange={v => update('personality', v)} placeholder="캐릭터의 성격, 기질, 특성을 상세히 묘사하세요..." rows={4} />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PERSONALITY_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => update('personality', p)}
                      className="px-2 py-1 bg-puma-card border border-puma-border/20 text-puma-muted rounded text-xs hover:border-puma-accent/40 hover:text-puma-accent transition-colors cursor-pointer text-left"
                    >
                      {p.slice(0, 20)}...
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="말투 / 화법">
                <Textarea value={char.speechStyle} onChange={v => update('speechStyle', v)} placeholder="어떻게 말하는지, 어떤 표현을 자주 쓰는지..." rows={3} />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SPEECH_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => update('speechStyle', p)}
                      className="px-2 py-1 bg-puma-card border border-puma-border/20 text-puma-muted rounded text-xs hover:border-puma-accent/40 hover:text-puma-accent transition-colors cursor-pointer"
                    >
                      {p.slice(0, 18)}...
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="버릇 / 특이점">
                  <Textarea value={char.quirks} onChange={v => update('quirks', v)} placeholder="특이한 습관, 말버릇, 행동 패턴..." rows={3} />
                </Field>
                <div className="space-y-4">
                  <Field label="좋아하는 것">
                    <Textarea value={char.likes} onChange={v => update('likes', v)} placeholder="취미, 음식, 활동 등..." rows={3} />
                  </Field>
                </div>
              </div>

              <Field label="싫어하는 것">
                <Textarea value={char.dislikes} onChange={v => update('dislikes', v)} placeholder="두려움, 혐오, 약점 등..." rows={2} />
              </Field>
            </>
          )}

          {/* ── 배경 ── */}
          {activeTab === 'background' && (
            <>
              <Field label="배경 스토리">
                <Textarea value={char.background} onChange={v => update('background', v)} placeholder="캐릭터의 과거, 성장 배경, 중요한 사건들..." rows={5} />
              </Field>
              <Field label="능력 / 스킬">
                <Textarea value={char.skills} onChange={v => update('skills', v)} placeholder="특기, 마법, 전투 능력, 특수 능력 등..." rows={3} />
              </Field>
              <Field label="인간관계">
                <Textarea value={char.relationships} onChange={v => update('relationships', v)} placeholder="가족, 친구, 적, 연인 등 주요 관계..." rows={3} />
              </Field>
            </>
          )}

          {/* ── 롤플레이 설정 ── */}
          {activeTab === 'roleplay' && (
            <>
              {/* Call Names */}
              <Field label="호출명 (이 이름으로 불리면 응답)" hint="채팅에서 이 이름을 부르면 이 캐릭터가 응답합니다">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCallName}
                    onChange={e => setNewCallName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCallName(); } }}
                    placeholder="호출명 입력 (예: 아리아, Aria, 선생님)..."
                    className="flex-1 bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/40 focus:outline-none focus:border-puma-accent transition-colors"
                  />
                  <button onClick={addCallName} className="px-3 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm hover:border-puma-accent/40 hover:text-puma-accent transition-colors cursor-pointer whitespace-nowrap">추가</button>
                </div>
                {char.callNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {char.callNames.map(n => (
                      <span key={n} className="flex items-center gap-1 px-2.5 py-1 bg-puma-accent/15 border border-puma-accent/30 rounded-lg text-xs text-puma-accent">
                        <i className="ri-at-line text-xs"></i>{n}
                        <button onClick={() => removeCallName(n)} className="text-puma-accent/60 hover:text-red-400 cursor-pointer"><i className="ri-close-line text-xs"></i></button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="현재 시나리오 / 상황">
                <Textarea value={char.scenario} onChange={v => update('scenario', v)} placeholder="현재 어떤 상황에 있는지, 어떤 장면에서 시작하는지..." rows={3} />
              </Field>

              <Field label="세계관 설정">
                <Textarea value={char.worldSetting} onChange={v => update('worldSetting', v)} placeholder="이 캐릭터가 사는 세계, 시대, 배경 설정..." rows={3} />
              </Field>

              <Field label="AI 응답 스타일 지침" hint="AI가 이 캐릭터를 연기할 때 따라야 할 지침">
                <Textarea value={char.responseStyle} onChange={v => update('responseStyle', v)} placeholder="예: 항상 1인칭으로 말하기, 감정을 풍부하게 표현하기, 특정 단어 사용하기..." rows={4} />
              </Field>
            </>
          )}

          {/* ── 파일 ── */}
          {activeTab === 'files' && (
            <>
              <input ref={fileInputRef} type="file" multiple accept="*/*" className="hidden" onChange={e => handleFiles(e.target.files)} />

              {/* Upload area */}
              <div
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  dragOver ? 'border-puma-accent/60 bg-puma-accent/5' : 'border-puma-border/30 hover:border-puma-accent/40 hover:bg-puma-card/20'
                }`}
              >
                {fileReading ? (
                  <>
                    <i className="ri-loader-4-line text-puma-accent text-3xl animate-spin"></i>
                    <p className="text-puma-muted text-sm">파일 읽는 중...</p>
                  </>
                ) : (
                  <>
                    <i className="ri-upload-cloud-2-line text-puma-muted text-3xl"></i>
                    <div className="text-center">
                      <p className="text-puma-text text-sm font-medium">파일을 드래그하거나 클릭하여 업로드</p>
                      <p className="text-puma-muted text-xs mt-1">이미지, 텍스트, PDF, JSON, 오디오, 비디오 등 모든 형식 · 무제한</p>
                    </div>
                  </>
                )}
              </div>

              {/* File list */}
              {char.files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-puma-muted text-xs font-semibold uppercase tracking-wide">{char.files.length}개 파일</p>
                  {char.files.map(f => {
                    const style = FILE_KIND_STYLE[f.fileKind];
                    return (
                      <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 bg-puma-bg rounded-xl border border-puma-border/20">
                        {f.fileKind === 'image' && f.previewUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-puma-border/20">
                            <img src={f.previewUrl} alt={f.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 ${style.bg}`}>
                            <i className={`${style.icon} ${style.color} text-lg`}></i>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-puma-text text-sm font-medium truncate">{f.name}</p>
                          <p className="text-puma-muted text-xs">{formatSize(f.size)} · {f.fileKind.toUpperCase()}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {(f.fileKind === 'text' || f.fileKind === 'json') && f.content && (
                            <button
                              onClick={() => setPreviewFile(previewFile?.id === f.id ? null : f)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent hover:bg-puma-card transition-colors cursor-pointer"
                            >
                              <i className="ri-eye-line text-sm"></i>
                            </button>
                          )}
                          <button
                            onClick={() => removeFile(f.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* File preview */}
              {previewFile && (
                <div className="bg-puma-bg rounded-xl border border-puma-border/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-puma-accent text-xs font-semibold">{previewFile.name}</p>
                    <button onClick={() => setPreviewFile(null)} className="text-puma-muted hover:text-puma-text cursor-pointer"><i className="ri-close-line text-sm"></i></button>
                  </div>
                  <pre className="text-puma-muted text-xs overflow-auto max-h-40 whitespace-pre-wrap">{previewFile.content.slice(0, 2000)}</pre>
                </div>
              )}

              {char.files.length === 0 && !fileReading && (
                <div className="text-center py-4">
                  <p className="text-puma-muted/60 text-xs">캐릭터 관련 파일을 업로드하세요</p>
                  <p className="text-puma-muted/40 text-xs mt-1">참고 이미지, 설정 문서, 배경 스토리 파일 등</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-puma-border/30 flex items-center justify-between flex-shrink-0 bg-puma-bg/50">
          <p className="text-puma-muted/60 text-xs">
            <i className="ri-save-line mr-1"></i>
            마지막 수정: {new Date(char.updatedAt).toLocaleString('ko-KR')}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm cursor-pointer whitespace-nowrap hover:text-puma-text transition-colors">취소</button>
            <button onClick={handleSave} className="px-4 py-1.5 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap hover:bg-puma-accent/30 transition-colors">
              <i className="ri-save-line mr-1.5"></i>저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
