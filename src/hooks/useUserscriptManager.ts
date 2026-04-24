/**
 * useUserscriptManager
 * Tampermonkey/Greasemonkey 스타일 유저스크립트 관리
 *
 * 지원 기능:
 *   - .user.js URL에서 설치
 *   - 직접 코드 입력/편집
 *   - 파일 업로드 (.js, .user.js)
 *   - 메타데이터 파싱 (@name, @version, @match, @grant 등)
 *   - ON/OFF 토글
 *   - 매치 URL 패턴 관리
 *   - 스크립트 실행 (브라우저 환경)
 */

import { useState, useCallback, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────
export type UserscriptStatus = 'active' | 'disabled' | 'error';

export interface Userscript {
  id: string;
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  source: 'url' | 'file' | 'editor';
  sourceUrl?: string;
  code: string;
  status: UserscriptStatus;
  matches: string[];      // @match patterns
  includes: string[];   // @include patterns
  excludes: string[];     // @exclude patterns
  grants: string[];       // @grant permissions
  runAt: 'document-start' | 'document-end' | 'document-idle';
  iconUrl?: string;
  updateUrl?: string;
  downloadUrl?: string;
  requires: string[];     // @require URLs
  resources: { name: string; url: string }[]; // @resource
  installedAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runCount: number;
  errorMessage?: string;
}

// ─── Metadata Parser ───────────────────────────────────────────────
export function parseUserscriptMeta(code: string): Partial<Userscript> {
  const meta: Partial<Userscript> = {
    name: 'Untitled Script',
    namespace: '',
    version: '1.0.0',
    description: '',
    author: '',
    matches: ['*://*/*'],
    includes: [],
    excludes: [],
    grants: [],
    runAt: 'document-end',
    requires: [],
    resources: [],
  };

  const metaBlock = code.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
  if (!metaBlock) return meta;

  const block = metaBlock[1];

  const getValue = (key: string): string | undefined => {
    const match = block.match(new RegExp(`//@${key}\\s+(.+)`));
    return match?.[1]?.trim();
  };

  const getValues = (key: string): string[] => {
    const matches = block.matchAll(new RegExp(`//@${key}\\s+(.+)`, 'g'));
    return Array.from(matches).map(m => m[1].trim());
  };

  meta.name = getValue('name') || meta.name;
  meta.namespace = getValue('namespace') || '';
  meta.version = getValue('version') || meta.version;
  meta.description = getValue('description') || '';
  meta.author = getValue('author') || '';
  meta.matches = getValues('match');
  meta.includes = getValues('include');
  meta.excludes = getValues('exclude');
  meta.grants = getValues('grant');
  meta.runAt = (getValue('run-at') as Userscript['runAt']) || 'document-end';
  meta.updateUrl = getValue('updateURL');
  meta.downloadUrl = getValue('downloadURL');
  meta.iconUrl = getValue('icon');
  meta.requires = getValues('require');

  const resources = getValues('resource');
  meta.resources = resources.map(r => {
    const parts = r.split(/\s+/);
    return { name: parts[0] || '', url: parts[1] || '' };
  });

  return meta;
}

export function buildUserscriptMeta(script: Partial<Userscript>): string {
  const lines = ['// ==UserScript=='];
  if (script.name) lines.push(`// @name         ${script.name}`);
  if (script.namespace) lines.push(`// @namespace    ${script.namespace}`);
  if (script.version) lines.push(`// @version      ${script.version}`);
  if (script.description) lines.push(`// @description   ${script.description}`);
  if (script.author) lines.push(`// @author       ${script.author}`);
  script.matches?.forEach(m => lines.push(`// @match         ${m}`));
  script.includes?.forEach(i => lines.push(`// @include       ${i}`));
  script.excludes?.forEach(e => lines.push(`// @exclude       ${e}`));
  script.grants?.forEach(g => lines.push(`// @grant         ${g}`));
  if (script.runAt) lines.push(`// @run-at        ${script.runAt}`);
  if (script.updateUrl) lines.push(`// @updateURL     ${script.updateUrl}`);
  if (script.downloadUrl) lines.push(`// @downloadURL   ${script.downloadUrl}`);
  if (script.iconUrl) lines.push(`// @icon          ${script.iconUrl}`);
  script.requires?.forEach(r => lines.push(`// @require       ${r}`));
  script.resources?.forEach(r => lines.push(`// @resource      ${r.name} ${r.url}`));
  lines.push('// ==/UserScript==');
  return lines.join('\n');
}

// ─── IndexedDB ─────────────────────────────────────────────────────
const DB_NAME = 'gfd_userscripts_db';
const DB_VERSION = 1;
const SCRIPT_STORE = 'userscripts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SCRIPT_STORE)) {
        db.createObjectStore(SCRIPT_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(item: Userscript): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCRIPT_STORE, 'readwrite');
    tx.objectStore(SCRIPT_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetAll(): Promise<Userscript[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCRIPT_STORE, 'readonly');
    const req = tx.objectStore(SCRIPT_STORE).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCRIPT_STORE, 'readwrite');
    tx.objectStore(SCRIPT_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Hook ──────────────────────────────────────────────────────────
export function useUserscriptManager() {
  const [scripts, setScripts] = useState<Userscript[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    dbGetAll()
      .then(s => {
        setScripts(s.sort((a, b) => new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime()));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // URL에서 설치
  const installFromUrl = useCallback(async (url: string): Promise<{ success: boolean; message: string; script?: Userscript }> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const code = await response.text();

      if (!code.includes('==UserScript==')) {
        return { success: false, message: '유효한 UserScript가 아닙니다 (==UserScript== 블록 없음)' };
      }

      const meta = parseUserscriptMeta(code);
      const id = `us-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();

      const script: Userscript = {
        id,
        name: meta.name || 'Untitled Script',
        namespace: meta.namespace || '',
        version: meta.version || '1.0.0',
        description: meta.description || '',
        author: meta.author || '',
        source: 'url',
        sourceUrl: url,
        code,
        status: 'active',
        matches: meta.matches?.length ? meta.matches : ['*://*/*'],
        includes: meta.includes || [],
        excludes: meta.excludes || [],
        grants: meta.grants || [],
        runAt: meta.runAt || 'document-end',
        iconUrl: meta.iconUrl,
        updateUrl: meta.updateUrl || url,
        downloadUrl: meta.downloadUrl || url,
        requires: meta.requires || [],
        resources: meta.resources || [],
        installedAt: now,
        updatedAt: now,
        runCount: 0,
      };

      await dbPut(script);
      setScripts(prev => [script, ...prev]);
      return { success: true, message: `${script.name} v${script.version} 설치 완료`, script };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : '설치 실패' };
    }
  }, []);

  // 파일에서 설치
  const installFromFile = useCallback(async (file: File): Promise<{ success: boolean; message: string; script?: Userscript }> => {
    try {
      const code = await file.text();
      if (!code.includes('==UserScript==')) {
        return { success: false, message: '유효한 UserScript가 아닙니다' };
      }

      const meta = parseUserscriptMeta(code);
      const id = `us-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();

      const script: Userscript = {
        id,
        name: meta.name || file.name.replace(/\.user\.js$/, '').replace(/\.js$/, ''),
        namespace: meta.namespace || '',
        version: meta.version || '1.0.0',
        description: meta.description || '',
        author: meta.author || '',
        source: 'file',
        code,
        status: 'active',
        matches: meta.matches?.length ? meta.matches : ['*://*/*'],
        includes: meta.includes || [],
        excludes: meta.excludes || [],
        grants: meta.grants || [],
        runAt: meta.runAt || 'document-end',
        iconUrl: meta.iconUrl,
        requires: meta.requires || [],
        resources: meta.resources || [],
        installedAt: now,
        updatedAt: now,
        runCount: 0,
      };

      await dbPut(script);
      setScripts(prev => [script, ...prev]);
      return { success: true, message: `${script.name} 설치 완료`, script };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : '설치 실패' };
    }
  }, []);

  // 에디터에서 생성/수정
  const saveScript = useCallback(async (
    script: Partial<Userscript> & { code: string },
    existingId?: string,
  ): Promise<{ success: boolean; message: string; script?: Userscript }> => {
    const meta = parseUserscriptMeta(script.code);
    const now = new Date().toISOString();

    const fullScript: Userscript = {
      id: existingId || `us-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: script.name || meta.name || 'Untitled Script',
      namespace: script.namespace || meta.namespace || '',
      version: script.version || meta.version || '1.0.0',
      description: script.description || meta.description || '',
      author: script.author || meta.author || '',
      source: existingId ? (scripts.find(s => s.id === existingId)?.source || 'editor') : 'editor',
      sourceUrl: script.sourceUrl,
      code: script.code,
      status: script.status || 'active',
      matches: script.matches || meta.matches || ['*://*/*'],
      includes: script.includes || meta.includes || [],
      excludes: script.excludes || meta.excludes || [],
      grants: script.grants || meta.grants || [],
      runAt: script.runAt || meta.runAt || 'document-end',
      iconUrl: script.iconUrl || meta.iconUrl,
      updateUrl: script.updateUrl || meta.updateUrl,
      downloadUrl: script.downloadUrl || meta.downloadUrl,
      requires: script.requires || meta.requires || [],
      resources: script.resources || meta.resources || [],
      installedAt: existingId ? (scripts.find(s => s.id === existingId)?.installedAt || now) : now,
      updatedAt: now,
      lastRunAt: existingId ? scripts.find(s => s.id === existingId)?.lastRunAt : undefined,
      runCount: existingId ? (scripts.find(s => s.id === existingId)?.runCount || 0) : 0,
    };

    await dbPut(fullScript);
    setScripts(prev => {
      const exists = prev.find(s => s.id === fullScript.id);
      if (exists) {
        return prev.map(s => s.id === fullScript.id ? fullScript : s);
      }
      return [fullScript, ...prev];
    });

    return {
      success: true,
      message: existingId ? `${fullScript.name} 수정 완료` : `${fullScript.name} 생성 완료`,
      script: fullScript,
    };
  }, [scripts]);

  // 토글
  const toggleScript = useCallback(async (id: string) => {
    setScripts(prev => {
      const updated = prev.map(s => {
        if (s.id !== id) return s;
        const toggled: Userscript = {
          ...s,
          status: s.status === 'active' ? 'disabled' : 'active',
          updatedAt: new Date().toISOString(),
        };
        dbPut(toggled).catch(() => {});
        return toggled;
      });
      return updated;
    });
  }, []);

  // 삭제
  const deleteScript = useCallback(async (id: string) => {
    await dbDelete(id);
    setScripts(prev => prev.filter(s => s.id !== id));
  }, []);

  // 실행 (브라우저 환경)
  const runScript = useCallback(async (id: string, targetUrl?: string): Promise<{ success: boolean; message: string }> => {
    const script = scripts.find(s => s.id === id);
    if (!script) return { success: false, message: '스크립트를 찾을 수 없습니다' };
    if (script.status !== 'active') return { success: false, message: '스크립트가 비활성화 상태입니다' };

    try {
      // URL 매칭 확인
      if (targetUrl) {
        const url = new URL(targetUrl);
        const hostname = url.hostname;
        const pathname = url.pathname;
        const fullUrl = url.href;

        const isMatch = script.matches.some(pattern => {
          const regex = pattern
            .replace(/\*\:\/\//, 'https?://')
            .replace(/\*\./g, '[^/]*\.')
            .replace(/\*/g, '.*');
          return new RegExp(regex).test(fullUrl);
        });

        if (!isMatch) {
          return { success: false, message: `URL이 매치 패턴과 일치하지 않습니다: ${script.matches.join(', ')}` };
        }
      }

      // 실제 실행은 브라우저 제약으로 시뮬레이션
      // 실제 Tampermonkey는 content script injection을 사용
      console.info(`[Userscript] Running: ${script.name} on ${targetUrl || 'current page'}`);

      const updated: Userscript = {
        ...script,
        lastRunAt: new Date().toISOString(),
        runCount: script.runCount + 1,
        updatedAt: new Date().toISOString(),
      };
      await dbPut(updated);
      setScripts(prev => prev.map(s => s.id === id ? updated : s));

      return { success: true, message: `${script.name} 실행 완료 (실제 브라우저 확장 필요)` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '실행 오류';
      const updated: Userscript = { ...script, status: 'error', errorMessage: msg, updatedAt: new Date().toISOString() };
      await dbPut(updated);
      setScripts(prev => prev.map(s => s.id === id ? updated : s));
      return { success: false, message: msg };
    }
  }, [scripts]);

  //보내기 (.user.js 파일 다운로드)
  const exportScript = useCallback((id: string) => {
    const script = scripts.find(s => s.id === id);
    if (!script) return;

    const blob = new Blob([script.code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${script.name.replace(/[^a-z0-9]/gi, '_')}.user.js`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [scripts]);

  return {
    scripts,
    loaded,
    installFromUrl,
    installFromFile,
    saveScript,
    toggleScript,
    deleteScript,
    runScript,
    exportScript,
  };
}