import { useState, useCallback } from 'react';
import Layout from '@/components/feature/Layout';
import { useImageGallery } from '@/hooks/useImageGallery';
import { GenerationRecord, ImageStyle, STYLE_PRESETS } from '@/pages/ai-tools/components/ImageGenerator';

const RESOLUTION_LABELS: Record<string, string> = {
  '512x512': '512×512',
  '768x768': '768×768',
  '1024x1024': '1024×1024',
  '1024x1536': '1024×1536',
  '1536x1024': '1536×1024',
};

export default function GalleryPage() {
  const { images, loaded, deleteImage, deleteAll, downloadAll } = useImageGallery();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterStyle, setFilterStyle] = useState<ImageStyle | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<GenerationRecord | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const filtered = images.filter(img => {
    if (filterStyle !== 'all' && img.style !== filterStyle) return false;
    if (search && !img.prompt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(f => f.id)));
    }
  }, [filtered, selectedIds.size]);

  const handleDownloadSelected = async () => {
    await downloadAll(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleDownloadAll = async () => {
    await downloadAll();
  };

  const handleDeleteAll = async () => {
    await deleteAll();
    setConfirmDeleteAll(false);
    setSelectedIds(new Set());
  };

  const styleCounts: Record<string, number> = {};
  images.forEach(img => {
    styleCounts[img.style] = (styleCounts[img.style] || 0) + 1;
  });

  return (
    <Layout>
      <div className="p-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-puma-text text-xl font-bold flex items-center gap-2">
              <i className="ri-gallery-line text-puma-accent"></i>
              Image Gallery
            </h2>
            <p className="text-puma-muted text-sm mt-0.5">
              AI로 생성된 모든 이미지 보관함 · {images.length}개 저장됨
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-puma-bg rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-puma-surface text-puma-accent' : 'text-puma-muted hover:text-puma-text'
                }`}
              >
                <i className="ri-grid-line text-sm"></i>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-puma-surface text-puma-accent' : 'text-puma-muted hover:text-puma-text'
                }`}
              >
                <i className="ri-list-check text-sm"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: '전체 이미지', value: images.length, color: 'text-puma-accent', bg: 'bg-puma-accent/10', icon: 'ri-image-line' },
            { label: '오늘 생성', value: images.filter(i => new Date(i.createdAt).toDateString() === new Date().toDateString()).length, color: 'text-green-400', bg: 'bg-green-400/10', icon: 'ri-calendar-check-line' },
            { label: '선택됨', value: selectedIds.size, color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: 'ri-checkbox-circle-line' },
            { label: '스타일 수', value: Object.keys(styleCounts).length, color: 'text-pink-400', bg: 'bg-pink-400/10', icon: 'ri-palette-line' },
          ].map(stat => (
            <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-puma-border/20 ${stat.bg}`}>
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl ${stat.bg} flex-shrink-0`}>
                <i className={`${stat.icon} ${stat.color} text-lg`}></i>
              </div>
              <div>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-puma-muted text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-puma-muted text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="프롬프트 검색..."
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg pl-9 pr-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
            />
          </div>

          {/* Style Filter */}
          <select
            value={filterStyle}
            onChange={e => setFilterStyle(e.target.value as ImageStyle | 'all')}
            className="bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-xs text-puma-text focus:outline-none focus:border-puma-accent cursor-pointer"
          >
            <option value="all">전체 스타일</option>
            {(Object.entries(STYLE_PRESETS) as [ImageStyle, typeof STYLE_PRESETS[ImageStyle]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label} ({styleCounts[k] || 0})</option>
            ))}
          </select>

          {/* Select All */}
          <button
            onClick={selectAll}
            className="px-3 py-2 rounded-lg bg-puma-bg border border-puma-border/30 text-puma-muted text-xs font-semibold hover:text-puma-accent hover:border-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? '전체 해제' : '전체 선택'}
          </button>

          {/* Batch Actions */}
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleDownloadSelected}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-puma-accent/15 text-puma-accent text-xs font-semibold hover:bg-puma-accent/25 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-download-line"></i>{selectedIds.size}개 다운로드
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-2 rounded-lg bg-puma-card text-puma-muted text-xs font-semibold hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap"
              >
                선택 취소
              </button>
            </>
          )}

          {/* Download All */}
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-400/15 text-green-400 text-xs font-semibold hover:bg-green-400/25 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-download-cloud-line"></i>전체 다운로드
          </button>

          {/* Delete All */}
          {confirmDeleteAll ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteAll}
                className="px-3 py-2 rounded-lg bg-red-400/20 text-red-400 text-xs font-semibold hover:bg-red-400/30 transition-colors cursor-pointer whitespace-nowrap"
              >
                전체 삭제
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="px-3 py-2 rounded-lg bg-puma-card text-puma-muted text-xs cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-400/10 text-red-400/70 text-xs font-semibold hover:text-red-400 hover:bg-red-400/20 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-delete-bin-line"></i>전체 삭제
            </button>
          )}
        </div>

        {/* Gallery Content */}
        {!loaded ? (
          <div className="flex items-center justify-center py-20">
            <i className="ri-loader-4-line text-puma-accent text-3xl animate-spin"></i>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-puma-card mb-4">
              <i className="ri-image-line text-puma-muted text-4xl"></i>
            </div>
            <p className="text-puma-text text-base font-semibold mb-1">
              {images.length === 0 ? '아직 생성된 이미지가 없습니다' : '검색 결과가 없습니다'}
            </p>
            <p className="text-puma-muted text-sm">
              AI Tools → Image Generator에서 이미지를 생성해보세요
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(img => {
              const styleInfo = STYLE_PRESETS[img.style];
              const isSelected = selectedIds.has(img.id);
              return (
                <div
                  key={img.id}
                  className={`relative rounded-xl overflow-hidden border transition-all duration-200 group cursor-pointer ${
                    isSelected ? 'border-puma-accent ring-2 ring-puma-accent/30' : 'border-puma-border/20 hover:border-puma-border/50'
                  }`}
                  onClick={() => setPreviewImage(img)}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.prompt}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                    <div className="flex items-start justify-between">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                          isSelected ? 'bg-puma-accent text-white' : 'bg-white/20 text-white hover:bg-white/40'
                        }`}
                      >
                        <i className={`${isSelected ? 'ri-check-line' : 'ri-checkbox-blank-line'} text-sm`}></i>
                      </button>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${styleInfo.bg} ${styleInfo.color}`}>
                        {styleInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = img.imageUrl;
                          link.download = `gfd-${img.style}-${img.id.slice(-6)}.png`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/40 transition-colors"
                      >
                        <i className="ri-download-line text-sm"></i>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-red-400/60 transition-colors"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                  {/* Bottom Info (always visible) */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/50">
                    <p className="text-white text-[10px] truncate">{img.prompt}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filtered.map(img => {
              const styleInfo = STYLE_PRESETS[img.style];
              const isSelected = selectedIds.has(img.id);
              return (
                <div
                  key={img.id}
                  className={`flex items-center gap-3 bg-puma-surface rounded-xl border transition-all duration-200 px-4 py-3 ${
                    isSelected ? 'border-puma-accent/50' : 'border-puma-border/20'
                  }`}
                >
                  <button
                    onClick={() => toggleSelect(img.id)}
                    className={`w-6 h-6 flex items-center justify-center rounded border-2 flex-shrink-0 transition-all ${
                      isSelected ? 'bg-puma-accent border-puma-accent' : 'border-puma-border/50'
                    }`}
                  >
                    {isSelected && <i className="ri-check-line text-white text-xs"></i>}
                  </button>
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                    onClick={() => setPreviewImage(img)}
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${styleInfo.bg} ${styleInfo.color}`}>{styleInfo.label}</span>
                      <span className="text-puma-muted/60 text-[10px]">{RESOLUTION_LABELS[img.resolution] || img.resolution}</span>
                      <span className="text-puma-muted/60 text-[10px]">seed:{img.seed}</span>
                    </div>
                    <p className="text-puma-text text-xs mt-0.5 truncate">{img.prompt}</p>
                    <p className="text-puma-muted/60 text-[10px]">
                      {new Date(img.createdAt).toLocaleString('ko-KR')}
                      {img.negativePrompt && ' · 네거티브 적용'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = img.imageUrl;
                        link.download = `gfd-${img.style}-${img.id.slice(-6)}.png`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-puma-muted hover:text-puma-accent hover:bg-puma-card transition-colors cursor-pointer"
                    >
                      <i className="ri-download-line text-sm"></i>
                    </button>
                    <button
                      onClick={() => deleteImage(img.id)}
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

        {/* Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={previewImage.imageUrl}
                alt={previewImage.prompt}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
              <div className="mt-4 bg-puma-surface rounded-xl border border-puma-border/30 p-4 w-full max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${STYLE_PRESETS[previewImage.style].bg} ${STYLE_PRESETS[previewImage.style].color}`}>
                    {STYLE_PRESETS[previewImage.style].label}
                  </span>
                  <span className="text-puma-muted text-xs">{RESOLUTION_LABELS[previewImage.resolution] || previewImage.resolution}</span>
                  <span className="text-puma-muted text-xs">seed:{previewImage.seed}</span>
                </div>
                <p className="text-puma-text text-sm mb-1"><strong>Prompt:</strong> {previewImage.prompt}</p>
                {previewImage.negativePrompt && (
                  <p className="text-puma-muted text-xs"><strong>Negative:</strong> {previewImage.negativePrompt}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = previewImage.imageUrl;
                      link.download = `gfd-${previewImage.style}-${previewImage.id.slice(-6)}.png`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-puma-accent/20 text-puma-accent text-sm font-semibold hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-download-line"></i>다운로드
                  </button>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="px-4 py-2 rounded-lg bg-puma-card text-puma-muted text-sm font-semibold hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap"
                  >
                    닫기
                  </button>
                </div>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-400/60 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}