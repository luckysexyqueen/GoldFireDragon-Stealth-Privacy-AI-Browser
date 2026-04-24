import { useState, useEffect, useCallback } from 'react';
import { saveAgentsToDB, loadAgentsFromDB } from './useLocalDB';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
}

// Roleplay configuration for each agent
export interface RoleplayConfig {
  enabled: boolean;
  mode: 'personal' | 'group' | 'targeted' | 'designated'; // 개인/단체/지정/지목
  roleName: string;          // 역할 이름 (예: "탐정 김민준")
  callNames: string[];       // 호출 이름 목록 (예: ["민준", "탐정", "김탐정"])
  personality: string;       // 성격 설명
  speechStyle: string;       // 말투 스타일
  background: string;        // 배경 스토리
  relationships: string;     // 다른 캐릭터와의 관계
  scenario: string;          // 현재 시나리오/상황
  allowedTopics: string;     // 허용 주제
  forbiddenTopics: string;   // 금지 주제
  autoRespond: boolean;      // 이름 호출 시 자동 응답
  respondToKeywords: string[]; // 추가 반응 키워드
}

export interface CustomAIAgent {
  id: string;
  name: string;
  avatar: string;
  systemPrompt: string;
  instructions: string;
  files: UploadedFile[];
  linkedModelId: string;
  linkedModelName: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  roleplay: RoleplayConfig;  // 롤플레이 설정
  tags: string[];            // 태그 (검색용)
  isActive: boolean;         // 활성화 여부
}

const STORAGE_KEY = 'gfd_custom_ai_agents';

const defaultRoleplay: RoleplayConfig = {
  enabled: false,
  mode: 'personal',
  roleName: '',
  callNames: [],
  personality: '',
  speechStyle: '',
  background: '',
  relationships: '',
  scenario: '',
  allowedTopics: '',
  forbiddenTopics: '',
  autoRespond: true,
  respondToKeywords: [],
};

function loadAgentsFromStorage(): CustomAIAgent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CustomAIAgent[];
      if (Array.isArray(parsed)) {
        // Migrate old agents without roleplay field
        return parsed.map((a) => ({
          ...a,
          roleplay: a.roleplay ?? { ...defaultRoleplay },
          tags: a.tags ?? [],
          isActive: a.isActive ?? true,
        }));
      }
    }
  } catch { /* ignore */ }
  return [];
}

function saveAgentsToStorage(agents: CustomAIAgent[]) {
  // Save slim version to localStorage (no file content)
  const slim = agents.map((a) => ({
    ...a,
    files: a.files.map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type })),
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch { /* ignore if quota exceeded */ }

  // Also save full version to IndexedDB (with file content)
  saveAgentsToDB(agents).catch(() => {});
}

export function useCustomAI() {
  const [agents, setAgents] = useState<CustomAIAgent[]>(loadAgentsFromStorage);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load from IndexedDB on mount (may have richer data)
  useEffect(() => {
    loadAgentsFromDB().then((dbAgents) => {
      if (dbAgents.length > 0) {
        const typed = (dbAgents as CustomAIAgent[]).map((a) => ({
          ...a,
          roleplay: a.roleplay ?? { ...defaultRoleplay },
          tags: a.tags ?? [],
          isActive: a.isActive ?? true,
        }));
        setAgents(typed);
      }
      setDbLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (dbLoaded) {
      saveAgentsToStorage(agents);
    }
  }, [agents, dbLoaded]);

  const createAgent = useCallback((): CustomAIAgent => {
    const emojis = ['🤖', '🦊', '🐉', '🔥', '⚡', '🧠', '🦁', '🐺', '🦅', '🌟'];
    const agent: CustomAIAgent = {
      id: `agent-${Date.now()}`,
      name: 'New AI Agent',
      avatar: emojis[Math.floor(Math.random() * emojis.length)],
      systemPrompt: '',
      instructions: '',
      files: [],
      linkedModelId: '',
      linkedModelName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      roleplay: { ...defaultRoleplay },
      tags: [],
      isActive: true,
    };
    setAgents((prev) => [agent, ...prev]);
    return agent;
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Omit<CustomAIAgent, 'id' | 'createdAt'>>) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      )
    );
  }, []);

  const deleteAgent = useCallback((id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const duplicateAgent = useCallback((id: string) => {
    setAgents((prev) => {
      const original = prev.find((a) => a.id === id);
      if (!original) return prev;
      const copy: CustomAIAgent = {
        ...original,
        id: `agent-${Date.now()}`,
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
      };
      return [copy, ...prev];
    });
  }, []);

  const incrementMessageCount = useCallback((id: string) => {
    setAgents((prev) =>
      prev.map((a) => a.id === id ? { ...a, messageCount: a.messageCount + 1 } : a)
    );
  }, []);

  // Find agent by call name (for name-based invocation)
  const findAgentByCallName = useCallback((text: string): CustomAIAgent | null => {
    const lower = text.toLowerCase();
    for (const agent of agents) {
      if (!agent.roleplay?.enabled || !agent.roleplay?.autoRespond) continue;
      const callNames = agent.roleplay.callNames ?? [];
      const keywords = agent.roleplay.respondToKeywords ?? [];
      const allNames = [agent.name, agent.roleplay.roleName, ...callNames, ...keywords].filter(Boolean);
      for (const n of allNames) {
        if (n && lower.includes(n.toLowerCase())) return agent;
      }
    }
    return null;
  }, [agents]);

  // Find all agents that should respond (for group roleplay)
  const findGroupAgents = useCallback((text: string): CustomAIAgent[] => {
    const lower = text.toLowerCase();
    return agents.filter((agent) => {
      if (!agent.roleplay?.enabled) return false;
      if (agent.roleplay.mode !== 'group') return false;
      const callNames = agent.roleplay.callNames ?? [];
      const keywords = agent.roleplay.respondToKeywords ?? [];
      const allNames = [agent.name, agent.roleplay.roleName, ...callNames, ...keywords].filter(Boolean);
      return allNames.some((n) => n && lower.includes(n.toLowerCase()));
    });
  }, [agents]);

  return {
    agents,
    dbLoaded,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    incrementMessageCount,
    findAgentByCallName,
    findGroupAgents,
    defaultRoleplay,
  };
}

export { defaultRoleplay };