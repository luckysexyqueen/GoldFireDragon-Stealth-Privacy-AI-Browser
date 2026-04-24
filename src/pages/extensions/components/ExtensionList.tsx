/**
 * ExtensionList
 * 설치된 확장프로그램 목록 + ON/OFF 토글 + 삭제 + 상세 정보
 */
import { useState } from 'react';
import {
  Extension,
  ExtensionCategory,
  CATEGORY_INFO,
  SOURCE_INFO,
  useExtensionManager,
} from '@/hooks/useExtensionManager';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const STATUS_STYLE: Record<Extension['status'], { label: string; color: string; bg: string; icon: string }> = {
  installed:  { label: '설치됨',   color: 'text-green-400',  bg: 'bg-green-400/15',  icon: 'ri-check-line' },
  pending:    { label: '대기 중',  color: 'text-yellow-400', bg: 'bg-yellow-400/15', icon: 'ri-time-line' },
  disabled:   { label: '비활성',   color: 'text-puma-muted', bg: 'bg-puma-card',     icon: 'ri-pause-line' },
  error:      { label: '오류',     color: 'text-red-400',    bg: 'bg-red-400/15',    icon: 'ri-error-warning-line' },
  installing: { label: '설치 중',  color: 'text-puma-accent',bg: 'bg-puma-accent/15',icon: 'ri-loader-4-line' },
};

interface ExtensionCardProps {
  ext: Extension;
  onToggle: () => void;
  onDelete: () => void;
}

function ExtensionCard({ ext, onToggle, onDelete }: ExtensionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const catInfo = CATEGORY_INFO[ext.category];
  const srcInfo = SOURCE_INFO[ext.source];
  const statusInfo = STATUS_STYLE[ext.status];

  return (
    <div className={`bg-puma-surface rounded-xl border transition-all duration-200 overflow-hidden ${
      ext.enabled ? 'border-puma-border/30' : 'border-puma-border/15 opacity-60'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${catInfo.bg}`}>
          {ext.iconUrl ? (
            <img src={ext.iconUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <i className={`${catInfo.icon} ${catInfo.color} text-xl`}></i>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-puma-text text-sm font-bold truncate">{ext.name}</p>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${catInfo.bg} ${catInfo.color}`}>{catInfo.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 ${statusInfo.bg} ${statusInfo.color}`}>
              <i className={`${statusInfo.icon} text-[10px] ${ext.status === 'installing' ? 'animate-spin' : ''}`}></i>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`flex items-center gap-1 text-[10px] ${srcInfo.color}`}>
              <i className={`${srcInfo.icon} text-[10px]`}></i>
              {srcInfo.label}
            </span>
            {ext.version && <span className="text-puma-muted/60 text-[10px]">v{ext.version}</span>}
            {ext.localFileSize && <span className="text-puma-muted/60 text-[10px]">{formatSize(ext.localFileSize)}</span>}
          </div>
          {ext.description && (
            <p className="text-puma-muted text-xs mt-0.5 truncate">{ext.description}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle */}
          <button
            onClick={onToggle}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
              ext.enabled ? 'bg-puma-accent' : 'bg-puma-border/50'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              ext.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}></span>
          </button>

          {/* Expand */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent hover:bg-puma-card transition-colors cursor-pointer"
          >
            <i className={`${expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-sm`}></i>
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="px-2 py-1 rounded-lg bg-red-400/20 text-red-400 text-xs font-semibold cursor-pointer whitespace-nowrap hover:bg-red-400/30 transition-colors"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-puma-card text-puma-muted text-xs cursor-pointer whitespace-nowrap hover:text-puma-text transition-colors"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line text-sm"></i>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-puma-border/20 pt-3 space-y-3">
          {/* Install Note */}
          {ext.installNote && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-puma-accent/8 border border-puma-accent/20 rounded-lg">
              <i className="ri-information-line text-puma-accent text-sm flex-shrink-0 mt-0.5"></i>
              <p className="text-puma-muted text-xs leading-relaxed">{ext.installNote}</p>
            </div>
          )}

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: '소스', value: srcInfo.label },
              { label: '카테고리', value: catInfo.label },
              { label: '버전', value: ext.version || '-' },
              { label: '작성자', value: ext.author || '-' },
              { label: '설치일', value: new Date(ext.installedAt).toLocaleDateString('ko-KR') },
              { label: '업데이트', value: new Date(ext.updatedAt).toLocaleDateString('ko-KR') },
              ...(ext.localFileName ? [{ label: '파일명', value: ext.localFileName }] : []),
              ...(ext.localFileSize ? [{ label: '파일 크기', value: formatSize(ext.localFileSize) }] : []),
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 px-2.5 py-1.5 bg-puma-bg rounded-lg">
                <span className="text-puma-muted/70 text-[10px]">{item.label}</span>
                <span className="text-puma-text text-[10px] font-semibold ml-auto truncate max-w-[60%]">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Permissions */}
          {ext.permissions.length > 0 && (
            <div>
              <p className="text-puma-muted text-xs font-semibold mb-1.5">권한</p>
              <div className="flex flex-wrap gap-1">
                {ext.permissions.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-puma-card rounded-full text-puma-muted text-[10px]">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex items-center gap-2 flex-wrap">
            {ext.sourceUrl && (
              <button
                onClick={() => window.open(ext.sourceUrl, '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-puma-card text-puma-muted text-xs hover:text-puma-accent hover:bg-puma-accent/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-external-link-line text-sm"></i>스토어 페이지
              </button>
            )}
            {ext.homepageUrl && ext.homepageUrl !== ext.sourceUrl && (
              <button
                onClick={() => window.open(ext.homepageUrl, '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-puma-card text-puma-muted text-xs hover:text-puma-accent hover:bg-puma-accent/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-home-line text-sm"></i>홈페이지
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  extensions: Extension[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ExtensionList({ extensions, onToggle, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExtensionCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'category'>('date');

  const filtered = extensions
    .filter(e => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (filterStatus === 'enabled' && !e.enabled) return false;
      if (filterStatus === 'disabled' && e.enabled) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime();
    });

  const enabledCount = extensions.filter(e => e.enabled).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '전체', value: extensions.length, color: 'text-puma-text', bg: 'bg-puma-surface' },
          { label: '활성', value: enabledCount, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: '비활성', value: extensions.length - enabledCount, color: 'text-puma-muted', bg: 'bg-puma-card' },
        ].map(stat => (
          <div key={stat.label} className={`flex flex-col items-center py-3 rounded-xl border border-puma-border/20 ${stat.bg}`}>
            <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
            <span className="text-puma-muted text-xs">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-puma-muted text-sm"></i>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="확장프로그램 검색..."
            className="w-full bg-puma-bg border border-puma-border/30 rounded-lg pl-9 pr-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-xs text-puma-text focus:outline-none focus:border-puma-accent cursor-pointer"
        >
          <option value="all">전체 상태</option>
          <option value="enabled">활성만</option>
          <option value="disabled">비활성만</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-xs text-puma-text focus:outline-none focus:border-puma-accent cursor-pointer"
        >
          <option value="date">최신순</option>
          <option value="name">이름순</option>
          <option value="category">카테고리순</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            filterCategory === 'all' ? 'bg-puma-accent/20 text-puma-accent' : 'bg-puma-card text-puma-muted hover:text-puma-text'
          }`}
        >
          전체
        </button>
        {(Object.entries(CATEGORY_INFO) as [ExtensionCategory, typeof CATEGORY_INFO[ExtensionCategory]][]).map(([k, v]) => {
          const count = extensions.filter(e => e.category === k).length;
          if (count === 0) return null;
          return (
            <button
              key={k}
              onClick={() => setFilterCategory(k)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === k ? `${v.bg} ${v.color}` : 'bg-puma-card text-puma-muted hover:text-puma-text'
              }`}
            >
              <i className={`${v.icon} text-xs`}></i>
              {v.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-puma-card mb-3">
            <i className="ri-puzzle-line text-puma-muted text-3xl"></i>
          </div>
          <p className="text-puma-muted text-sm">
            {extensions.length === 0 ? '설치된 확장프로그램이 없습니다' : '검색 결과가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ext => (
            <ExtensionCard
              key={ext.id}
              ext={ext}
              onToggle={() => onToggle(ext.id)}
              onDelete={() => onDelete(ext.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
