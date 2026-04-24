/**
 * UserscriptEditor
 * Tampermonkey 스타일 메타데이터 + 코드 에디터
 */
import { useState, useEffect } from 'react';
import { Userscript, parseUserscriptMeta, buildUserscriptMeta } from '@/hooks/useUserscriptManager';

interface Props {
  script?: Userscript;
  onSave: (script: Partial<Userscript> & { code: string }, existingId?: string) => void;
  onCancel: () => void;
}

const DEFAULT_TEMPLATE = `// ==UserScript==
// @name         New Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Try to take over the world!
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    console.log('Hello from Userscript!');
})();`;

export default function UserscriptEditor({ script, onSave, onCancel }: Props) {
  const [code, setCode] = useState(script?.code || DEFAULT_TEMPLATE);
  const [name, setName] = useState(script?.name || '');
  const [version, setVersion] = useState(script?.version || '');
  const [description, setDescription] = useState(script?.description || '');
  const [author, setAuthor] = useState(script?.author || '');
  const [matches, setMatches] = useState(script?.matches?.join('\n') || '*://*/*');
  const [grants, setGrants] = useState(script?.grants?.join('\n') || 'none');
  const [runAt, setRunAt] = useState<Userscript['runAt']>(script?.runAt || 'document-end');
  const [activeTab, setActiveTab] = useState<'code' | 'meta'>('code');

  // Parse metadata from code on mount
  useEffect(() => {
    if (!script) {
      const meta = parseUserscriptMeta(DEFAULT_TEMPLATE);
      setName(meta.name || 'New Script');
      setVersion(meta.version || '1.0');
      setDescription(meta.description || '');
      setAuthor(meta.author || '');
    }
  }, [script]);

  const handleSave = () => {
    // Rebuild metadata block
    const metaBlock = buildUserscriptMeta({
      name: name || undefined,
      namespace: 'http://tampermonkey.net/',
      version: version || undefined,
      description: description || undefined,
      author: author || undefined,
      matches: matches.split('\n').filter(m => m.trim()),
      grants: grants.split('\n').filter(g => g.trim()),
      runAt,
    });

    // Replace existing meta block or prepend
    let newCode = code;
    if (code.includes('==UserScript==')) {
      newCode = code.replace(/==UserScript==[\s\S]*?==\/UserScript==/, metaBlock);
    } else {
      newCode = metaBlock + '\n\n' + code;
    }

    onSave(
      {
        code: newCode,
        name,
        version,
        description,
        author,
        matches: matches.split('\n').filter(m => m.trim()),
        grants: grants.split('\n').filter(g => g.trim()),
        runAt,
      },
      script?.id,
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-puma-bg rounded-xl p-1">
        {([
          { id: 'code', label: '코드', icon: 'ri-code-s-slash-line' },
          { id: 'meta', label: '메타데이터', icon: 'ri-settings-3-line' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? 'bg-puma-surface text-puma-accent' : 'text-puma-muted hover:text-puma-text'
            }`}
          >
            <i className={`${tab.icon} text-sm`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Tab */}
      {activeTab === 'code' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-puma-muted text-xs font-semibold uppercase tracking-wide">JavaScript 코드</label>
            <span className="text-puma-muted/60 text-[10px]">{code.length} chars</span>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={20}
            className="w-full bg-puma-bg border border-puma-border/30 rounded-xl px-3.5 py-3 text-sm text-puma-text font-mono leading-relaxed focus:outline-none focus:border-puma-accent resize-none"
            spellCheck={false}
          />
        </div>
      )}

      {/* Meta Tab */}
      {activeTab === 'meta' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-puma-muted text-xs mb-1 block">이름 (@name)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent"
              />
            </div>
            <div>
              <label className="text-puma-muted text-xs mb-1 block">버전 (@version)</label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent"
              />
            </div>
          </div>
          <div>
            <label className="text-puma-muted text-xs mb-1 block">설명 (@description)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent"
            />
          </div>
          <div>
            <label className="text-puma-muted text-xs mb-1 block">작성자 (@author)</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent"
            />
          </div>
          <div>
            <label className="text-puma-muted text-xs mb-1 block">매치 URL (@match) — 줄바꿈으로 여러 개</label>
            <textarea
              value={matches}
              onChange={e => setMatches(e.target.value)}
              rows={3}
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text font-mono focus:outline-none focus:border-puma-accent resize-none"
              placeholder="*://*/*&#10;*://example.com/*"
            />
          </div>
          <div>
            <label className="text-puma-muted text-xs mb-1 block">권한 (@grant) — 줄바꿈으로 여러 개</label>
            <textarea
              value={grants}
              onChange={e => setGrants(e.target.value)}
              rows={2}
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text font-mono focus:outline-none focus:border-puma-accent resize-none"
              placeholder="none&#10;GM_setValue&#10;GM_getValue"
            />
          </div>
          <div>
            <label className="text-puma-muted text-xs mb-1 block">실행 시점 (@run-at)</label>
            <select
              value={runAt}
              onChange={e => setRunAt(e.target.value as Userscript['runAt'])}
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent cursor-pointer"
            >
              <option value="document-start">document-start (페이지 로딩 전)</option>
              <option value="document-end">document-end (DOM 완료 후)</option>
              <option value="document-idle">document-idle (페이지 완전 로드 후)</option>
            </select>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-puma-accent/20 border border-puma-accent/40 text-puma-accent hover:bg-puma-accent/30 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
        >
          <i className="ri-save-line"></i>
          {script ? '수정 저장' : '스크립트 생성'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-puma-card text-puma-muted hover:text-puma-text transition-all cursor-pointer whitespace-nowrap"
        >
          취소
        </button>
      </div>
    </div>
  );
}