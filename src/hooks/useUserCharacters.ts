import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────
export type CharacterGender = 'male' | 'female' | 'nonbinary' | 'unknown';
export type CharacterRole = 'hero' | 'villain' | 'support' | 'neutral' | 'custom';
export type CharacterStatus = 'active' | 'archived' | 'draft';

export interface CharacterFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;       // text / base64 dataURL
  previewUrl?: string;
  fileKind: 'image' | 'text' | 'json' | 'pdf' | 'audio' | 'video' | 'binary';
}

export interface UserCharacter {
  id: string;
  name: string;
  nickname: string;       // 호출명 / 별명
  avatar: string;         // emoji or image dataURL
  avatarImage?: string;   // uploaded image dataURL
  gender: CharacterGender;
  age: string;
  role: CharacterRole;
  customRole: string;
  status: CharacterStatus;

  // 외모
  appearance: string;
  height: string;
  bodyType: string;
  hairColor: string;
  eyeColor: string;
  clothingStyle: string;

  // 성격 & 말투
  personality: string;
  speechStyle: string;
  quirks: string;         // 버릇 / 특이점
  likes: string;
  dislikes: string;

  // 배경
  background: string;
  occupation: string;
  skills: string;
  relationships: string;

  // 롤플레이 설정
  scenario: string;
  worldSetting: string;
  callNames: string[];    // 이 캐릭터를 부를 이름들
  responseStyle: string;  // 응답 스타일 지침

  // 파일 첨부
  files: CharacterFile[];

  // 메타
  tags: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isFavorite: boolean;
  color: string;          // accent color for card
}

// ─── Defaults ─────────────────────────────────────────────────────
const AVATAR_EMOJIS = ['🧑', '👩', '👨', '🧙', '🧝', '🧛', '🤖', '👾', '🦊', '🐉', '🌟', '⚔️', '🌸', '🔥', '💎', '🌙'];
const CARD_COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444'];

export function createDefaultCharacter(): UserCharacter {
  const id = `char-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    name: '새 캐릭터',
    nickname: '',
    avatar: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
    avatarImage: undefined,
    gender: 'unknown',
    age: '',
    role: 'neutral',
    customRole: '',
    status: 'draft',
    appearance: '',
    height: '',
    bodyType: '',
    hairColor: '',
    eyeColor: '',
    clothingStyle: '',
    personality: '',
    speechStyle: '',
    quirks: '',
    likes: '',
    dislikes: '',
    background: '',
    occupation: '',
    skills: '',
    relationships: '',
    scenario: '',
    worldSetting: '',
    callNames: [],
    responseStyle: '',
    files: [],
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    isFavorite: false,
    color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
  };
}

// ─── IndexedDB helpers ────────────────────────────────────────────
const DB_NAME = 'gfd_user_characters_db';
const DB_VERSION = 1;
const STORE = 'characters';
const META_KEY = 'gfd_user_characters_meta';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(): Promise<UserCharacter[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(char: UserCharacter): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(char);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// localStorage meta (id list + name for fast sidebar render)
function saveMeta(chars: UserCharacter[]) {
  try {
    const meta = chars.map(c => ({ id: c.id, name: c.name, avatar: c.avatar, avatarImage: c.avatarImage, color: c.color, isFavorite: c.isFavorite, status: c.status }));
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch { /* empty */ }
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useUserCharacters() {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    dbGetAll().then(all => {
      const sorted = all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setCharacters(sorted);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const saveCharacter = useCallback(async (char: UserCharacter) => {
    const updated = { ...char, updatedAt: new Date().toISOString() };
    await dbPut(updated);
    setCharacters(prev => {
      const exists = prev.find(c => c.id === updated.id);
      const next = exists
        ? prev.map(c => c.id === updated.id ? updated : c)
        : [updated, ...prev];
      saveMeta(next);
      return next;
    });
    return updated;
  }, []);

  const createCharacter = useCallback(async () => {
    const char = createDefaultCharacter();
    await dbPut(char);
    setCharacters(prev => {
      const next = [char, ...prev];
      saveMeta(next);
      return next;
    });
    return char;
  }, []);

  const deleteCharacter = useCallback(async (id: string) => {
    await dbDelete(id);
    setCharacters(prev => {
      const next = prev.filter(c => c.id !== id);
      saveMeta(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    setCharacters(prev => {
      const next = prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite, updatedAt: new Date().toISOString() } : c);
      const target = next.find(c => c.id === id);
      if (target) dbPut(target).catch(() => {});
      saveMeta(next);
      return next;
    });
  }, []);

  const incrementUsage = useCallback(async (id: string) => {
    setCharacters(prev => {
      const next = prev.map(c => c.id === id ? { ...c, usageCount: c.usageCount + 1 } : c);
      const target = next.find(c => c.id === id);
      if (target) dbPut(target).catch(() => {});
      return next;
    });
  }, []);

  const duplicateCharacter = useCallback(async (id: string) => {
    const original = characters.find(c => c.id === id);
    if (!original) return null;
    const copy: UserCharacter = {
      ...original,
      id: `char-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `${original.name} (복사본)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      status: 'draft',
    };
    await dbPut(copy);
    setCharacters(prev => {
      const next = [copy, ...prev];
      saveMeta(next);
      return next;
    });
    return copy;
  }, [characters]);

  return {
    characters,
    loaded,
    saveCharacter,
    createCharacter,
    deleteCharacter,
    toggleFavorite,
    incrementUsage,
    duplicateCharacter,
  };
}
