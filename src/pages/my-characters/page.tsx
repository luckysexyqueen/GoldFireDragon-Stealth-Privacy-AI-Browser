import { useState, useMemo } from 'react';
import Layout from '@/components/feature/Layout';
import { useUserCharacters, UserCharacter } from '@/hooks/useUserCharacters';
import CharacterCard from './components/CharacterCard';
import CharacterEditor from './components/CharacterEditor';

type FilterStatus = 'all' | 'active' | 'draft' | 'archived';
type SortBy = 'updated' | 'created' | 'name' | 'usage' | 'favorite';

export default function MyCharactersPage() {
  const { characters, loaded, saveCharacter, createCharacter, deleteCharacter, toggleFavorite, duplicateCharacter } = useUserCharacters();
  const [editingChar, setEditingChar] = useState<UserCharacter | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCreate = async () => {
    const char = await createCharacter();
    setEditingChar(char);
  };

  const handleSave = async (char: UserCharacter) => {
    await saveCharacter(char);
    setEditingChar(null);
  };

  const handleDelete = async (id: string) => {
    await deleteCharacter(id);
    setShowDeleteConfirm(null);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateCharacter(id);
  };

  const filtered = useMemo(() => {
    let list = [...characters];

    // Status filter
    if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.nickname.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.personality.toLowerCase().includes(q) ||
        c.occupation.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':    return a.name.localeCompare(b.name, 'ko');
        case 'usage':   return b.usageCount - a.usageCount;
        case 'created': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'favorite': return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        default:        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return list;
  }, [characters, filterStatus, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: characters.length,
    active: characters.filter(c => c.status === 'active').length,
    draft: characters.filter(c => c.status === 'draft').length,
    favorites: characters.filter(c => c.isFavorite).length,
  }), [characters]);

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-puma-border/30 bg-puma-surface flex-shrink-0">
          <div>
            <h2 className="text-puma-text text-xl font-bold">내 캐릭터</h2>
            <p className="text-puma-muted text-sm mt-0.5">나만의 캐릭터를 만들고 롤플레이에 활용하세요</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-puma-card rounded-lg">
                <span className="text-puma-text text-sm font-bold">{stats.total}</span>
                <span className="text-puma-muted text-xs">전체</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-400/10 border border-green-400/20 rounded-lg">
                <span className="text-green-400 text-sm font-bold">{stats.active}</span>
                <span className="text-green-400/80 text-xs">활성</span>
              </div>
              {stats.favorites > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/10 border border-red-400/20 rounded-lg">
                  <i className="ri-heart-fill text-red-400 text-sm"></i>
                  <span className="text-red-400 text-sm font-bold">{stats.favorites}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-xl text-sm font-semibold hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line text-base"></i>새 캐릭터 만들기
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-puma-border/20 bg-puma-bg flex-shrink-0 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-puma-surface border border-puma-border/30 rounded-lg px-3 py-2 focus-within:border-puma-accent/50 transition-colors">
            <i className="ri-search-line text-puma-muted text-sm flex-shrink-0"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="이름, 태그, 성격으로 검색..."
              className="flex-1 bg-transparent text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-puma-muted hover:text-puma-text cursor-pointer flex-shrink-0">
                <i className="ri-close-line text-sm"></i>
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-puma-surface border border-puma-border/30 rounded-lg p-1">
            {([
              { id: 'all', label: '전체' },
              { id: 'active', label: '활성' },
              { id: 'draft', label: '초안' },
              { id: 'archived', label: '보관' },
            ] as const).map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === f.id ? 'bg-puma-card text-puma-accent' : 'text-puma-muted hover:text-puma-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            className="bg-puma-surface border border-puma-border/30 rounded-lg px-3 py-2 text-xs text-puma-muted focus:outline-none focus:border-puma-accent cursor-pointer"
          >
            <option value="updated">최근 수정순</option>
            <option value="created">생성일순</option>
            <option value="name">이름순</option>
            <option value="usage">사용 횟수순</option>
            <option value="favorite">즐겨찾기 우선</option>
          </select>

          {/* View mode */}
          <div className="flex items-center gap-1 bg-puma-surface border border-puma-border/30 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-puma-card text-puma-accent' : 'text-puma-muted hover:text-puma-text'}`}
            >
              <i className="ri-grid-line text-sm"></i>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${viewMode === 'list' ? 'bg-puma-card text-puma-accent' : 'text-puma-muted hover:text-puma-text'}`}
            >
              <i className="ri-list-check text-sm"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!loaded ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex items-center gap-3 text-puma-muted">
                <i className="ri-loader-4-line text-xl animate-spin"></i>
                <span className="text-sm">캐릭터 불러오는 중...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              {characters.length === 0 ? (
                <>
                  <div className="w-20 h-20 flex items-center justify-center rounded-full bg-puma-card mb-4 text-4xl">🎭</div>
                  <h3 className="text-puma-text text-lg font-bold mb-2">아직 캐릭터가 없어요</h3>
                  <p className="text-puma-muted text-sm mb-5 max-w-xs leading-relaxed">
                    나만의 캐릭터를 만들어 롤플레이, AI 채팅, 스토리텔링에 활용해보세요!
                  </p>
                  <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-xl text-sm font-semibold hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line text-base"></i>첫 캐릭터 만들기
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-puma-card mb-3 text-3xl">🔍</div>
                  <p className="text-puma-muted text-sm">검색 결과가 없습니다</p>
                  <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); }} className="mt-2 text-puma-accent text-xs cursor-pointer hover:underline">필터 초기화</button>
                </>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Create new card */}
              <button
                onClick={handleCreate}
                className="bg-puma-surface rounded-2xl border-2 border-dashed border-puma-border/30 hover:border-puma-accent/40 hover:bg-puma-card/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 py-10 group"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-puma-card group-hover:bg-puma-accent/20 transition-colors">
                  <i className="ri-add-line text-puma-muted group-hover:text-puma-accent text-2xl transition-colors"></i>
                </div>
                <div className="text-center">
                  <p className="text-puma-muted group-hover:text-puma-text text-sm font-medium transition-colors">새 캐릭터</p>
                  <p className="text-puma-muted/60 text-xs mt-0.5">클릭하여 생성</p>
                </div>
              </button>

              {filtered.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  onEdit={() => setEditingChar(char)}
                  onDelete={() => setShowDeleteConfirm(char.id)}
                  onDuplicate={() => handleDuplicate(char.id)}
                  onToggleFavorite={() => toggleFavorite(char.id)}
                />
              ))}
            </div>
          ) : (
            /* List view */
            <div className="space-y-2">
              {filtered.map(char => (
                <div
                  key={char.id}
                  className="flex items-center gap-4 px-4 py-3 bg-puma-surface rounded-xl border border-puma-border/30 hover:border-puma-border/60 transition-all cursor-pointer group"
                  style={{ borderLeftColor: char.color, borderLeftWidth: 3 }}
                  onClick={() => setEditingChar(char)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: char.color + '20' }}
                  >
                    {char.avatarImage ? (
                      <img src={char.avatarImage} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{char.avatar}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-puma-text text-sm font-bold truncate">{char.name}</p>
                      {char.nickname && <span className="text-puma-muted text-xs">"{char.nickname}"</span>}
                      {char.isFavorite && <i className="ri-heart-fill text-red-400 text-xs flex-shrink-0"></i>}
                    </div>
                    <p className="text-puma-muted text-xs truncate mt-0.5">{char.personality || char.occupation || '설명 없음'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {char.tags.slice(0, 2).map(t => (
                      <span key={t} className="px-1.5 py-0.5 bg-puma-card rounded text-[10px] text-puma-muted hidden sm:block">#{t}</span>
                    ))}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      char.status === 'active' ? 'bg-green-400/15 text-green-400' :
                      char.status === 'draft' ? 'bg-yellow-400/15 text-yellow-400' :
                      'bg-puma-card text-puma-muted'
                    }`}>{char.status === 'active' ? '활성' : char.status === 'draft' ? '초안' : '보관'}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleFavorite(char.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-red-400 transition-colors cursor-pointer">
                        <i className={`${char.isFavorite ? 'ri-heart-fill text-red-400' : 'ri-heart-line'} text-sm`}></i>
                      </button>
                      <button onClick={() => handleDuplicate(char.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent transition-colors cursor-pointer">
                        <i className="ri-file-copy-line text-sm"></i>
                      </button>
                      <button onClick={() => setShowDeleteConfirm(char.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-red-400 transition-colors cursor-pointer">
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Character Editor Modal */}
      {editingChar && (
        <CharacterEditor
          character={editingChar}
          onSave={handleSave}
          onClose={() => setEditingChar(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-puma-surface rounded-2xl border border-puma-border/30 p-6 max-w-sm w-full">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-400/15 mx-auto mb-4">
              <i className="ri-delete-bin-line text-red-400 text-2xl"></i>
            </div>
            <h3 className="text-puma-text text-base font-bold text-center mb-2">캐릭터 삭제</h3>
            <p className="text-puma-muted text-sm text-center mb-5">
              이 캐릭터를 삭제하면 모든 설정과 파일이 영구적으로 삭제됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap hover:text-puma-text transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-2.5 bg-red-400/20 border border-red-400/30 text-red-400 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap hover:bg-red-400/30 transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
