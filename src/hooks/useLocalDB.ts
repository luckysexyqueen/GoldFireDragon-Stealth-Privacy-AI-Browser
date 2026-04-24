// IndexedDB-based local storage for all app data
// Replaces localStorage for large/important data

const DB_NAME = 'StealthPrivacyAI';
const DB_VERSION = 1;

const STORES = {
  agents: 'agents',
  chatHistory: 'chatHistory',
  files: 'files',
  prompts: 'prompts',
  settings: 'settings',
  roleplay: 'roleplay',
} as const;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      Object.values(STORES).forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
    req.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function dbGet<T>(store: string, id: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

export async function dbGetAll<T>(store: string): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch { return []; }
}

export async function dbPut<T extends { id: string }>(store: string, item: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* ignore */ }
}

export async function dbDelete(store: string, id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* ignore */ }
}

export async function dbClear(store: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* ignore */ }
}

// Save all agents to IndexedDB
export async function saveAgentsToDB(agents: object[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.agents, 'readwrite');
    const store = tx.objectStore(STORES.agents);
    store.clear();
    (agents as Array<{ id: string }>).forEach((a) => store.put(a));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
}

export async function loadAgentsFromDB(): Promise<object[]> {
  return dbGetAll(STORES.agents);
}

// Save chat history
export async function saveChatHistory(agentId: string, messages: object[]): Promise<void> {
  await dbPut(STORES.chatHistory, { id: agentId, messages, updatedAt: new Date().toISOString() });
}

export async function loadChatHistory(agentId: string): Promise<object[]> {
  const record = await dbGet<{ id: string; messages: object[] }>(STORES.chatHistory, agentId);
  return record?.messages ?? [];
}

// Save file content (large files go to IndexedDB, not localStorage)
export async function saveFileContent(fileId: string, content: string, meta: object): Promise<void> {
  await dbPut(STORES.files, { id: fileId, content, meta, savedAt: new Date().toISOString() });
}

export async function loadFileContent(fileId: string): Promise<string | null> {
  const record = await dbGet<{ id: string; content: string }>(STORES.files, fileId);
  return record?.content ?? null;
}

// Save settings
export async function saveSetting(key: string, value: unknown): Promise<void> {
  await dbPut(STORES.settings, { id: key, value, updatedAt: new Date().toISOString() });
}

export async function loadSetting<T>(key: string): Promise<T | null> {
  const record = await dbGet<{ id: string; value: T }>(STORES.settings, key);
  return record?.value ?? null;
}

export { STORES };