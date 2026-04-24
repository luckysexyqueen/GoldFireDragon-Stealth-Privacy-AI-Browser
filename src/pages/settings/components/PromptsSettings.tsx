import { useState } from 'react';
import { usePrompts } from '@/hooks/usePrompts';

export default function PromptsSettings() {
  const { prompts, addPrompt, updatePrompt, deletePrompt, resetToDefaults } = usePrompts();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAdd = () => {
    if (!newName.trim() || !newContent.trim()) return;
    addPrompt(newName, newContent, newCategory);
    setNewName('');
    setNewContent('');
    setNewCategory('General');
    setShowAdd(false);
  };

  const startEdit = (id: string, name: string, content: string, category: string) => {
    setEditingId(id);
    setEditName(name);
    setEditContent(content);
    setEditCategory(category);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim() || !editContent.trim()) return;
    updatePrompt(editingId, {
      name: editName.trim(),
      content: editContent.trim(),
      category: editCategory.trim() || 'General',
    });
    setEditingId(null);
    setEditName('');
    setEditContent('');
    setEditCategory('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditContent('');
    setEditCategory('');
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-puma-text text-xl font-bold">Prompts</h3>
          <p className="text-puma-muted text-sm mt-0.5">{prompts.length} saved prompts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-2 text-puma-muted text-sm hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap"
          >
            Reset
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-add-line text-base"></i>
            </div>
            Add Prompt
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-6 bg-puma-surface rounded-xl border border-puma-accent/30 p-4">
          <h4 className="text-puma-text text-sm font-semibold mb-3">New Prompt</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Prompt name..."
                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
              />
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category..."
                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
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
              <button
                onClick={handleAdd}
                className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
              >
                Save
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewName(''); setNewContent(''); setNewCategory('General'); }}
                className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="mb-6 bg-puma-surface rounded-xl border border-red-400/30 p-4">
          <p className="text-puma-text text-sm mb-3">Reset all prompts to defaults? This will erase your custom prompts.</p>
          <div className="flex gap-2">
            <button
              onClick={() => { resetToDefaults(); setShowResetConfirm(false); }}
              className="flex-1 py-2 bg-red-400/20 border border-red-400/50 text-red-400 rounded-lg text-sm font-medium hover:bg-red-400/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              Yes, Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Prompts List */}
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 hover:border-puma-border transition-colors"
          >
            {editingId === prompt.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent"
                  />
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent"
                  />
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-puma-text text-sm font-semibold">{prompt.name}</span>
                    <span className="px-2 py-0.5 bg-puma-accent/20 text-puma-accent text-xs rounded-full">{prompt.category}</span>
                    {prompt.isFavorite && (
                      <span className="text-yellow-400 text-xs">
                        <i className="ri-star-fill"></i>
                      </span>
                    )}
                  </div>
                  <p className="text-puma-muted text-xs leading-relaxed line-clamp-2">{prompt.content}</p>
                  <p className="text-puma-muted/60 text-xs mt-1">Used {prompt.usageCount} times</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(prompt.id, prompt.name, prompt.content, prompt.category)}
                    className="w-7 h-7 flex items-center justify-center text-puma-muted hover:text-puma-text transition-colors cursor-pointer"
                  >
                    <i className="ri-pencil-line text-base"></i>
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="w-7 h-7 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <i className="ri-delete-bin-line text-base"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {prompts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-puma-surface mx-auto mb-3">
            <i className="ri-file-text-line text-puma-muted text-2xl"></i>
          </div>
          <p className="text-puma-muted text-sm">No prompts saved yet</p>
        </div>
      )}
    </div>
  );
}