import { UserCharacter } from '@/hooks/useUserCharacters';

interface Props {
  character: UserCharacter;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  hero: '🦸 영웅',
  villain: '🦹 악당',
  support: '🤝 조력자',
  neutral: '⚖️ 중립',
  custom: '✨ 커스텀',
};

const GENDER_LABELS: Record<string, string> = {
  male: '♂ 남성',
  female: '♀ 여성',
  nonbinary: '⚧ 논바이너리',
  unknown: '? 미정',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-400/15', text: 'text-green-400', label: '활성' },
  archived: { bg: 'bg-puma-card', text: 'text-puma-muted', label: '보관됨' },
  draft: { bg: 'bg-yellow-400/15', text: 'text-yellow-400', label: '초안' },
};

export default function CharacterCard({ character, onEdit, onDelete, onDuplicate, onToggleFavorite }: Props) {
  const statusStyle = STATUS_STYLES[character.status] ?? STATUS_STYLES.draft;
  const roleLabel = character.role === 'custom' ? (character.customRole || '커스텀') : (ROLE_LABELS[character.role] ?? '');

  return (
    <div
      className="bg-puma-surface rounded-2xl border border-puma-border/30 overflow-hidden hover:border-puma-border/60 transition-all duration-200 group cursor-pointer"
      style={{ borderTopColor: character.color, borderTopWidth: 3 }}
      onClick={onEdit}
    >
      {/* Card Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border-2"
            style={{ borderColor: character.color + '40', backgroundColor: character.color + '15' }}
          >
            {character.avatarImage ? (
              <img src={character.avatarImage} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{character.avatar}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-puma-text font-bold text-base truncate">{character.name}</h3>
                {character.nickname && (
                  <p className="text-puma-muted text-xs truncate">"{character.nickname}"</p>
                )}
              </div>
              <button
                onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-puma-card transition-colors cursor-pointer"
              >
                <i className={`${character.isFavorite ? 'ri-heart-fill text-red-400' : 'ri-heart-line text-puma-muted'} text-base`}></i>
              </button>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
              {character.age && (
                <span className="px-1.5 py-0.5 bg-puma-card rounded text-[10px] text-puma-muted">{character.age}세</span>
              )}
              <span className="px-1.5 py-0.5 bg-puma-card rounded text-[10px] text-puma-muted">{GENDER_LABELS[character.gender]}</span>
              {roleLabel && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: character.color + '20', color: character.color }}>
                  {roleLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Personality snippet */}
        {character.personality && (
          <p className="text-puma-muted text-xs mt-2.5 leading-relaxed line-clamp-2">{character.personality}</p>
        )}

        {/* Tags */}
        {character.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {character.tags.slice(0, 4).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-puma-bg rounded text-[10px] text-puma-muted/80">#{tag}</span>
            ))}
            {character.tags.length > 4 && (
              <span className="text-[10px] text-puma-muted/60">+{character.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="px-4 py-2.5 border-t border-puma-border/20 bg-puma-bg/50 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <i className="ri-file-line text-puma-muted text-xs"></i>
          <span className="text-puma-muted text-xs">{character.files.length}개 파일</span>
        </div>
        {character.callNames.length > 0 && (
          <div className="flex items-center gap-1.5">
            <i className="ri-at-line text-puma-muted text-xs"></i>
            <span className="text-puma-muted text-xs">{character.callNames.length}개 호출명</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <i className="ri-chat-3-line text-puma-muted text-xs"></i>
          <span className="text-puma-muted text-xs">{character.usageCount}회</span>
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="px-3 py-2 border-t border-puma-border/20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-puma-card hover:bg-puma-accent/20 hover:text-puma-accent text-puma-muted transition-colors cursor-pointer text-xs font-medium whitespace-nowrap"
        >
          <i className="ri-edit-line text-sm"></i>편집
        </button>
        <button
          onClick={onDuplicate}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-puma-card hover:bg-puma-card/80 text-puma-muted transition-colors cursor-pointer text-xs font-medium whitespace-nowrap"
        >
          <i className="ri-file-copy-line text-sm"></i>복사
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-8 h-7 rounded-lg bg-puma-card hover:bg-red-400/20 hover:text-red-400 text-puma-muted transition-colors cursor-pointer"
        >
          <i className="ri-delete-bin-line text-sm"></i>
        </button>
      </div>
    </div>
  );
}
