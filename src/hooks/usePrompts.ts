import { useState, useEffect, useCallback } from 'react';

export interface Prompt {
  id: string;
  name: string;
  content: string;
  category: string;
  isFavorite: boolean;
  usageCount: number;
}

const STORAGE_KEY = 'gfd_prompts';

const defaultPrompts: Prompt[] = [
  { id: '1', name: 'Summarize Page', content: 'Please summarize the main points of this webpage in bullet points.', category: 'Web', isFavorite: true, usageCount: 24 },
  { id: '2', name: 'Translate to Korean', content: 'Translate the following text to Korean:', category: 'Translation', isFavorite: false, usageCount: 18 },
  { id: '3', name: 'Explain Simply', content: 'Explain this concept in simple terms that a beginner can understand:', category: 'Education', isFavorite: true, usageCount: 31 },
  { id: '4', name: 'Code Review', content: 'Review this code and suggest improvements for readability and performance:', category: 'Dev', isFavorite: false, usageCount: 12 },
  { id: '5', name: 'Write Email', content: 'Write a professional email based on the following context:', category: 'Writing', isFavorite: false, usageCount: 8 },
  { id: '6', name: 'Extract Key Points', content: 'Extract the 5 most important key points from this text:', category: 'Analysis', isFavorite: true, usageCount: 19 },
  { id: '7', name: 'Debug Code', content: 'Find and fix the bugs in this code. Explain what was wrong:', category: 'Dev', isFavorite: false, usageCount: 7 },
  { id: '8', name: 'SEO Analysis', content: 'Analyze this webpage content for SEO and suggest improvements:', category: 'Web', isFavorite: false, usageCount: 5 },
];

function loadPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Prompt[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return defaultPrompts;
}

function savePrompts(prompts: Prompt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>(loadPrompts);

  useEffect(() => {
    savePrompts(prompts);
  }, [prompts]);

  const addPrompt = useCallback((name: string, content: string, category: string) => {
    const p: Prompt = {
      id: Date.now().toString(),
      name: name.trim(),
      content: content.trim(),
      category: category.trim() || 'General',
      isFavorite: false,
      usageCount: 0,
    };
    setPrompts((prev) => [p, ...prev]);
    return p;
  }, []);

  const updatePrompt = useCallback((id: string, updates: Partial<Omit<Prompt, 'id'>>) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePrompt = useCallback((id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  }, []);

  const incrementUsage = useCallback((id: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p))
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    setPrompts(defaultPrompts);
  }, []);

  return {
    prompts,
    addPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    incrementUsage,
    resetToDefaults,
  };
}