import { useState } from 'react';
import Layout from '@/components/feature/Layout';
import { usePrompts } from '@/hooks/usePrompts';

const categories = ['All', 'Web', 'Writing', 'Dev', 'Translation', 'Education', 'Analysis'];

export default function PromptsPage() {
  const { prompts, addPrompt, deletePrompt, toggleFavorite, incrementUsage } = usePrompts();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usedId, setUsedId] = useState<string | null>(null);

  const filtered = prompts.filter((p) => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const copyPrompt = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runPrompt = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    incrementUsage(id);
    setUsedId(id);
    setTimeout(() => setUsedId(null), 2000);
  };

  const handleAdd = () => {
    if (!newName.trim() || !newContent.trim()) return;
    addPrompt(newName, newContent, newCategory);
    setNewName('');
    setNewContent('');
    setNewCategory('General');
    setShowAdd(false);
  };

  return (
    <Layout>
      <div className="p-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-puma-text text-xl font-bold">Prompts</h2>
            <p className="text-puma-muted text-sm">{prompts.length} saved prompts</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-add-line text-base"></i>
            </div>
            New Prompt
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="mb-5 bg-puma-surface rounded-xl border border-puma-accent/30 p-4">
            <h4 className="text-puma-text text-sm font-semibold mb-3">Create New Prompt</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Prompt name..."
                  className="bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                />
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category..."
                  className="bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                />
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Prompt content..."
                rows={3}
                maxLength={500}
                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap">Save</button>
                <button onClick={() => { setShowAdd(false); setNewName(''); setNewContent(''); setNewCategory('General'); }} className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
            <i className="ri-search-line text-puma-muted text-sm"></i>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full bg-puma-surface border border-puma-border/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-puma-accent text-white'
                  : 'bg-puma-surface border border-puma-border/30 text-puma-muted hover:text-puma-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((prompt) => (
            <div key={prompt.id} className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 hover:border-puma-border transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-puma-text text-sm font-semibold">{prompt.name}</span>
                  <span className="px-2 py-0.5 bg-puma-accent/20 text-puma-accent text-xs rounded-full">{prompt.category}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleFavorite(prompt.id)} className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${prompt.isFavorite ? 'text-yellow-400' : 'text-puma-muted hover:text-yellow-400'}`}>
                    <i className={`${prompt.isFavorite ? 'ri-star-fill' : 'ri-star-line'} text-sm`}></i>
                  </button>
                  <button onClick={() => copyPrompt(prompt.id, prompt.content)} className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-colors ${copiedId === prompt.id ? 'text-green-400' : 'text-puma-muted hover:text-puma-text'}`}>
                    <i className={`${copiedId === prompt.id ? 'ri-check-line' : 'ri-file-copy-line'} text-sm`}></i>
                  </button>
                  <button onClick={() => deletePrompt(prompt.id)} className="w-6 h-6 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer">
                    <i className="ri-delete-bin-line text-sm"></i>
                  </button>
                </div>
              </div>
              <p className="text-puma-muted text-xs leading-relaxed line-clamp-2 mb-3">{prompt.content}</p>
              <div className="flex items-center justify-between">
                <p className="text-puma-muted/60 text-xs">Used {prompt.usageCount} times</p>
                <button
                  onClick={() => runPrompt(prompt.id, prompt.content)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    usedId === prompt.id
                      ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                      : 'bg-puma-accent/20 text-puma-accent border border-puma-accent/30 hover:bg-puma-accent/30'
                  }`}
                >
                  {usedId === prompt.id ? 'Copied!' : 'Use Prompt'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-puma-surface mx-auto mb-3">
              <i className="ri-file-text-line text-puma-muted text-2xl"></i>
            </div>
            <p className="text-puma-muted text-sm">No prompts found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}