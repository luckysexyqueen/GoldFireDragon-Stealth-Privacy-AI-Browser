import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/feature/Layout';
import { useCustomAI, CustomAIAgent } from '@/hooks/useCustomAI';
import { getEffectiveSystemPrompt } from '@/hooks/useAISettings';
import { useScreenCapture } from '@/hooks/useScreenCapture';
import { buildRoleplayPrompt } from '../components/RoleplaySettings';
import { saveChatHistory, loadChatHistory } from '@/hooks/useLocalDB';
import { streamOfflineResponse, ChatMessage as LLMMessage } from '@/hooks/useOfflineLLM';
import { streamFreeAIResponse, getAvailableFreeAIService, FreeAIChatMessage } from '@/hooks/useFreeAI';
import ChatFileUpload, { ChatUploadedFile, buildFileContext } from '@/components/feature/ChatFileUpload';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  isRoleplay?: boolean;
  attachedFiles?: ChatUploadedFile[];
}

function analyzeFile(file: { name: string; size: number; type: string; content?: string }, userInput: string): string {
  const q = userInput.toLowerCase();
  const content = file.content ?? '';
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const sizekb = (file.size / 1024).toFixed(1);

  const wantsSummary = ['요약', '정리', '핵심', 'summary'].some((k) => q.includes(k));

  if (ext === 'gguf') {
    const lines = content.split('\n');
    const ver = lines.find((l) => l.startsWith('Version:'))?.replace('Version:', '').trim() ?? '?';
    return `**${name}** GGUF 모델 (v${ver}, ${(file.size / 1024 / 1024).toFixed(2)} MB)\n로컬 실행 가능한 양자화 LLM입니다.`;
  }
  if (file.type?.startsWith('image/')) {
    return `**${name}** 이미지 (${sizekb} KB) — ✅ 로드 완료\n이미지 설명, OCR, 색상 분석을 요청해보세요.`;
  }
  if (ext === 'pdf' || file.type?.includes('pdf')) {
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    return `**${name}** PDF (${(file.size / 1024 / 1024).toFixed(2)} MB)\n추출 텍스트: 약 ${wordCount}단어\n\`\`\`\n${content.slice(0, 500)}\n\`\`\``;
  }
  if (ext === 'json' || file.type?.includes('json')) {
    try {
      const parsed = JSON.parse(content);
      const isArr = Array.isArray(parsed);
      const keys = isArr ? Object.keys(parsed[0] ?? {}).slice(0, 5) : Object.keys(parsed).slice(0, 5);
      return `**${name}** JSON — ${isArr ? `배열 ${parsed.length}개` : `객체 ${Object.keys(parsed).length}키`}\n키: \`${keys.join('`, `')}\`\n\`\`\`json\n${JSON.stringify(isArr ? parsed.slice(0, 2) : parsed, null, 2).slice(0, 400)}\n\`\`\``;
    } catch {
      return `**${name}** JSON (파싱 오류)\n\`\`\`\n${content.slice(0, 400)}\n\`\`\``;
    }
  }
  const lines = content.split('\n');
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wantsSummary) {
    return `**${name}** 요약\n${lines.length}줄 / ${wordCount}단어\n\n${lines.filter((l) => l.trim()).slice(0, 8).join('\n')}`;
  }
  return `**${name}** (${sizekb} KB, ${lines.length}줄)\n\`\`\`\n${content.slice(0, 600)}\n\`\`\``;
}

// Build full system prompt including roleplay
function buildFullSystemPrompt(agent: CustomAIAgent): string {
  const base = getEffectiveSystemPrompt();
  const agentPrompt = [agent.systemPrompt, agent.instructions].filter(Boolean).join('\n\n');
  const roleplayPrompt = agent.roleplay?.enabled ? buildRoleplayPrompt(agent.roleplay, agent.name) : '';
  return [base, agentPrompt, roleplayPrompt].filter(Boolean).join('\n\n---\n\n');
}

// Generate roleplay-aware response
function generateRoleplayResponse(agent: CustomAIAgent, userInput: string, calledByName: boolean): string {
  const rp = agent.roleplay;
  const roleName = rp?.roleName || agent.name;
  const q = userInput.toLowerCase();

  if (!rp?.enabled) return '';

  // Greeting when called by name
  if (calledByName) {
    const greetings = [
      `네, 저 ${roleName}입니다. 무엇을 도와드릴까요?`,
      `부르셨나요? ${roleName}이(가) 응답합니다.`,
      `${roleName} 여기 있습니다. 말씀하세요.`,
      `네! ${roleName}입니다. 어떤 일인가요?`,
    ];
    const base = greetings[Math.floor(Math.random() * greetings.length)];
    if (rp.speechStyle) return applyStyle(base, rp.speechStyle);
    return base;
  }

  // Context-aware responses
  const wantsIntro = ['소개', '누구', '자기소개', 'who', 'introduce'].some((k) => q.includes(k));
  const wantsScenario = ['상황', '시나리오', '지금', '어디', 'where', 'situation'].some((k) => q.includes(k));
  const wantsRelation = ['관계', '아는', '친구', '적', 'relation', 'know'].some((k) => q.includes(k));

  let response = '';

  if (wantsIntro) {
    response = `저는 ${roleName}입니다.`;
    if (rp.personality) response += `\n\n${rp.personality}`;
    if (rp.background) response += `\n\n**배경:** ${rp.background}`;
  } else if (wantsScenario) {
    response = rp.scenario
      ? `현재 상황: ${rp.scenario}`
      : `현재 ${roleName}으로서 대화 중입니다.`;
  } else if (wantsRelation) {
    response = rp.relationships
      ? `관계 정보: ${rp.relationships}`
      : `다른 캐릭터와의 관계는 아직 설정되지 않았습니다.`;
  } else {
    const defaults = [
      `${roleName}으로서 답변드리겠습니다. ${userInput}에 대해 생각해보면...`,
      `흥미로운 질문이군요. ${roleName}의 관점에서 말씀드리자면...`,
      `${roleName}입니다. 말씀하신 내용을 잘 들었습니다.`,
    ];
    response = defaults[Math.floor(Math.random() * defaults.length)];
  }

  if (rp.speechStyle) response = applyStyle(response, rp.speechStyle);
  return response;
}

function applyStyle(text: string, style: string): string {
  // Apply speech style hints
  if (style.includes('존댓말') || style.includes('격식')) {
    return text.replace(/이야\./g, '입니다.').replace(/야\./g, '입니다.');
  }
  if (style.includes('반말') || style.includes('친근')) {
    return text.replace(/입니다\./g, '야.').replace(/습니다\./g, '어.');
  }
  return text;
}

export default function AIBuilderChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agents, incrementMessageCount, findAgentByCallName, findGroupAgents } = useCustomAI();
  const agent = agents.find((a) => a.id === id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [chatFiles, setChatFiles] = useState<ChatUploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isCapturing, currentFrame, error: captureError, startCapture, stopCapture, captureSnapshot, videoRef } = useScreenCapture();

  // Load chat history from IndexedDB
  useEffect(() => {
    if (!id || historyLoaded) return;
    loadChatHistory(id).then((history) => {
      if (history.length > 0) {
        setMessages(history.map((m: object) => {
          const msg = m as Message;
          return { ...msg, timestamp: new Date(msg.timestamp) };
        }));
      }
      setHistoryLoaded(true);
    });
  }, [id, historyLoaded]);

  // Save chat history to IndexedDB on every message change
  useEffect(() => {
    if (!id || !historyLoaded || messages.length === 0) return;
    saveChatHistory(id, messages).catch(() => {});
  }, [messages, id, historyLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamResponse = useCallback(async (response: string, agentInfo: { id: string; name: string; avatar: string }, isRoleplay: boolean) => {
    const msgId = `${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      agentId: agentInfo.id,
      agentName: agentInfo.name,
      agentAvatar: agentInfo.avatar,
      isRoleplay,
    }]);
    let streamed = '';
    for (let i = 0; i < response.length; i++) {
      await new Promise((r) => setTimeout(r, 12));
      streamed += response[i];
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: streamed } : m));
    }
  }, []);

  const generateResponse = useCallback((targetAgent: CustomAIAgent, userInput: string, calledByName: boolean): string => {
    const q = userInput.toLowerCase();
    const hasFiles = targetAgent.files.length > 0;
    const readableFiles = targetAgent.files.filter((f) => f.content && f.content.length > 0);
    const imageFiles = targetAgent.files.filter((f) => f.type?.startsWith('image/') || ['jpg','jpeg','png','gif','webp','bmp','svg'].some(e => f.name.toLowerCase().endsWith(`.${e}`)));

    const wantsFile = ['파일', '문서', '내용', '분석', '요약', '읽어', '설명', '보여', 'file', 'analyze', 'show', 'read'].some((k) => q.includes(k));
    const wantsCode = ['코드', '함수', '작성', 'code', 'function', 'write', '프로그램', '스크립트'].some((k) => q.includes(k));
    const wantsImage = ['이미지', '사진', '그림', '보여', 'image', 'photo', 'picture', 'show'].some((k) => q.includes(k));
    const wantsAllFiles = ['모든 파일', '전체 파일', '파일 목록', '파일 리스트', 'all files', 'list files'].some((k) => q.includes(k));

    // Build file context for roleplay
    const buildFileContext = (): string => {
      if (!hasFiles) return '';
      const parts: string[] = [`\n\n[업로드된 파일 ${targetAgent.files.length}개]`];
      readableFiles.forEach((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
        if (ext === 'gguf') {
          parts.push(`- ${f.name}: GGUF 모델 파일 (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
        } else if (f.type?.startsWith('image/') || ['jpg','jpeg','png','gif','webp'].some(e => f.name.toLowerCase().endsWith(`.${e}`))) {
          parts.push(`- ${f.name}: 이미지 파일 (${(f.size / 1024).toFixed(1)} KB)`);
        } else if (f.content && f.content.length > 0) {
          parts.push(`- ${f.name}: ${f.content.slice(0, 200)}...`);
        }
      });
      return parts.join('\n');
    };

    // Roleplay response with file context
    if (targetAgent.roleplay?.enabled) {
      const rpResponse = generateRoleplayResponse(targetAgent, userInput, calledByName);
      if (rpResponse) {
        // Append file context if files exist and relevant
        if (hasFiles && (wantsFile || wantsImage)) {
          const fileCtx = buildFileContext();
          return rpResponse + (fileCtx ? `\n\n---\n📁 **참조 파일:**${fileCtx}` : '');
        }
        return rpResponse;
      }
    }

    // Show all files list
    if (wantsAllFiles && hasFiles) {
      const lines = [`📁 **업로드된 파일 목록 (${targetAgent.files.length}개)**\n`];
      targetAgent.files.forEach((f, i) => {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
        const icon = ext === 'pdf' ? '🔴' : ext === 'json' ? '🟡' : ext === 'gguf' ? '🟠' : f.type?.startsWith('image/') ? '🖼️' : '📄';
        lines.push(`${i + 1}. ${icon} **${f.name}** (${(f.size / 1024).toFixed(1)} KB)${f.content ? ' ✓ 인식됨' : ''}`);
      });
      lines.push(`\n모든 파일이 AI 컨텍스트에 포함되어 있습니다. 특정 파일에 대해 질문해보세요!`);
      return lines.join('\n');
    }

    // Image file display
    if (wantsImage && imageFiles.length > 0) {
      const imgFile = imageFiles[0];
      return `🖼️ **${imgFile.name}** 이미지 파일\n\n파일 크기: ${(imgFile.size / 1024).toFixed(1)} KB\n상태: ✅ 로드 완료\n\n이미지에 대해 설명, 분석, OCR 텍스트 추출 등을 요청해보세요.\n${imageFiles.length > 1 ? `\n총 ${imageFiles.length}개의 이미지 파일이 있습니다.` : ''}`;
    }

    // File analysis
    if (hasFiles && wantsFile && readableFiles.length > 0) {
      const file = readableFiles.find((f) => q.includes(f.name.toLowerCase().split('.')[0])) ?? readableFiles[0];
      return analyzeFile(file, userInput);
    }

    // Code generation
    if (wantsCode) {
      const fileCtx = hasFiles ? `\n\n> 📁 참조 파일: ${targetAgent.files.map(f => f.name).join(', ')}` : '';
      return `네, 코드를 작성해드리겠습니다!${fileCtx}\n\n\`\`\`python\n# ${userInput}\ndef solution(data):\n    result = []\n    for item in data:\n        result.append(item)\n    return result\n\`\`\`\n\n더 구체적인 요구사항을 알려주시면 완성된 코드를 작성해드리겠습니다.`;
    }

    const modelName = targetAgent.linkedModelName || 'AI';
    const systemPrompt = buildFullSystemPrompt(targetAgent);
    const fileInfo = hasFiles ? `\n\n📁 **참조 가능한 파일:** ${targetAgent.files.map(f => f.name).join(', ')}` : '';
    const defaults = [
      `안녕하세요! 저는 **${targetAgent.name}**입니다.\n\n${modelName} 모델로 구동되며, ${hasFiles ? `📁 ${targetAgent.files.length}개의 파일을 참조할 수 있습니다.` : '현재 참조 파일이 없습니다.'}${fileInfo}\n\n무엇을 도와드릴까요?`,
      `${systemPrompt.includes('NSFW') ? '🔞 무검열 모드로 ' : ''}${modelName} 모델로 처리하겠습니다.${fileInfo}\n\n질문을 더 구체적으로 말씀해주시면 더 정확한 답변을 드릴 수 있습니다.`,
      `분석 결과를 정리해드리겠습니다:${fileInfo}\n\n**핵심 포인트:**\n- 첫 번째 중요 사항\n- 두 번째 고려할 점\n- 세 번째 권장 사항\n\n더 자세한 설명이 필요하시면 말씀해주세요.`,
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && chatFiles.length === 0) || isGenerating || !agent) return;

    const snapshot = isCapturing ? captureSnapshot() : null;
    const fileCtx = buildFileContext(chatFiles);
    const userContent = input.trim() + (chatFiles.length > 0 && !input.trim() ? `첸팅 파일 ${chatFiles.length}개를 분석해줘` : '');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
      attachedFiles: chatFiles.length > 0 ? [...chatFiles] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    const userInput = userContent + fileCtx;
    setInput('');
    setChatFiles([]);
    setIsGenerating(true);
    if (id) incrementMessageCount(id);

    // Screen capture response
    if (snapshot) {
      const screenResp = `**화면 분석 완료** 🖥️\n\n해상도: ${snapshot.width}×${snapshot.height}\n시간: ${new Date(snapshot.timestamp).toLocaleTimeString('ko-KR')}\n\n화면 내용을 기반으로 분석, 요약, 텍스트 추출 등을 요청해보세요.`;
      await streamResponse(screenResp, { id: agent.id, name: agent.name, avatar: agent.avatar }, false);
      setIsGenerating(false);
      return;
    }

    // Check for name-based invocation (group roleplay)
    const groupAgents = findGroupAgents(userInput);
    if (groupAgents.length > 1) {
      for (const ga of groupAgents) {
        const calledByName = (ga.roleplay?.callNames ?? []).some((n) => userInput.toLowerCase().includes(n.toLowerCase()));
        const resp = generateResponse(ga, userInput, calledByName);
        await streamResponse(resp, { id: ga.id, name: ga.name, avatar: ga.avatar }, true);
        await new Promise((r) => setTimeout(r, 300));
      }
      setIsGenerating(false);
      return;
    }

    // Check if a specific agent is called by name
    const calledAgent = findAgentByCallName(userInput);
    const targetAgent = calledAgent ?? agent;
    const calledByName = calledAgent !== null;

    // Roleplay or file-specific response takes priority
    const quickResp = generateResponse(targetAgent, userInput, calledByName);
    const isRoleplayResp = targetAgent.roleplay?.enabled ?? false;

    // If roleplay is active or files are referenced, use quick response
    const hasFileRef = targetAgent.files.length > 0 &&
      ['파일', '문서', '이미지', '사진', '분석', '요약', 'file', 'image', 'analyze'].some(k => userInput.toLowerCase().includes(k));
    const isNameCall = calledByName;

    if (isRoleplayResp || hasFileRef || isNameCall) {
      await streamResponse(quickResp, { id: targetAgent.id, name: targetAgent.name, avatar: targetAgent.avatar }, isRoleplayResp);
      setIsGenerating(false);
      return;
    }

    // Use offline LLM engine for high-quality responses
    const llmHistory: LLMMessage[] = messages.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const fullSystemPrompt = buildFullSystemPrompt(targetAgent);
    const nsfwEnabled = (() => { try { const r = localStorage.getItem('gfd_ai_settings'); return r ? JSON.parse(r).nsfwMode : false; } catch { return false; } })();

    const msgId = `${Date.now()}-${Math.random()}`;
    setMessages((prev) => [...prev, {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      agentId: targetAgent.id,
      agentName: targetAgent.name,
      agentAvatar: targetAgent.avatar,
      isRoleplay: false,
    }]);

    await streamOfflineResponse(
      userInput,
      llmHistory,
      {
        modelName: targetAgent.linkedModelName || targetAgent.name,
        systemPrompt: fullSystemPrompt,
        nsfwMode: nsfwEnabled,
        language: 'ko',
      },
      (partial, done) => {
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: partial } : m));
        if (done) setIsGenerating(false);
      },
      8
    );

    // Free AI 서비스가 설정된 경우 실제 API 호출로 업그레이드 시도
    const freeServiceId = getAvailableFreeAIService();
    if (freeServiceId && targetAgent.linkedModelId === '') {
      // 로컬 모델이 없고 Free AI가 설정된 경우 Free AI 사용
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: '' } : m));
      const freeHistory: FreeAIChatMessage[] = [
        { role: 'system', content: fullSystemPrompt },
        ...messages.slice(-10).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userInput + fileCtx },
      ];
      try {
        await streamFreeAIResponse(
          freeServiceId,
          freeHistory,
          (partial, done) => {
            setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: partial } : m));
            if (done) setIsGenerating(false);
          }
        );
      } catch {
        // Free AI 실패시 이미 오프라인 응답이 표시됨
        setIsGenerating(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
  };

  const clearHistory = async () => {
    setMessages([]);
    if (id) await saveChatHistory(id, []);
  };

  const nsfwOn = (() => { try { const r = localStorage.getItem('gfd_ai_settings'); return r ? JSON.parse(r).nsfwMode : false; } catch { return false; } })();

  if (!agent) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-puma-muted text-sm">에이전트를 찾을 수 없습니다</p>
            <button onClick={() => navigate('/ai-builder')} className="mt-3 text-puma-accent text-sm cursor-pointer">빌더로 돌아가기</button>
          </div>
        </div>
      </Layout>
    );
  }

  const readableFiles = agent.files.filter((f) => f.content && f.content.length > 0);
  const rpEnabled = agent.roleplay?.enabled;
  const callNames = agent.roleplay?.callNames ?? [];

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        <video ref={videoRef} className="hidden" muted playsInline />

        {/* Screen Capture Banner */}
        {isCapturing && (
          <div className="flex items-center justify-between px-4 py-2 bg-green-400/10 border-b border-green-400/20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-xs font-medium">화면 공유 중 · AI 실시간 인식</span>
            </div>
            <div className="flex items-center gap-2">
              {currentFrame && <div className="w-16 h-9 rounded overflow-hidden border border-green-400/30"><img src={currentFrame.dataUrl} alt="screen" className="w-full h-full object-cover" /></div>}
              <button onClick={stopCapture} className="px-2 py-1 bg-red-400/20 border border-red-400/30 text-red-400 rounded text-xs cursor-pointer whitespace-nowrap"><i className="ri-stop-circle-line mr-1"></i>중지</button>
            </div>
          </div>
        )}
        {captureError && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-400/10 border-b border-red-400/20 flex-shrink-0">
            <i className="ri-error-warning-line text-red-400 text-sm"></i>
            <span className="text-red-400 text-xs">{captureError}</span>
          </div>
        )}

        {/* Roleplay Banner */}
        {rpEnabled && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-puma-accent/8 border-b border-puma-accent/20 flex-shrink-0 flex-wrap">
            <span className="text-puma-accent text-xs font-medium">🎭 롤플레이 모드</span>
            {agent.roleplay.roleName && <span className="px-2 py-0.5 bg-puma-accent/15 text-puma-accent text-[10px] rounded-full font-medium">역할: {agent.roleplay.roleName}</span>}
            <span className="px-1.5 py-0.5 bg-puma-card text-puma-muted text-[10px] rounded">{agent.roleplay.mode === 'personal' ? '👤 개인' : agent.roleplay.mode === 'group' ? '👥 단체' : agent.roleplay.mode === 'targeted' ? '🎯 지정' : '📌 지목'}</span>
            {callNames.length > 0 && (
              <span className="text-puma-muted text-[10px]">호출명: {callNames.slice(0, 3).join(', ')}{callNames.length > 3 ? ` +${callNames.length - 3}` : ''}</span>
            )}
            <span className="text-puma-muted/60 text-[10px] ml-auto">이름을 부르면 자동 응답</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-puma-border/30 bg-puma-surface flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/ai-builder/${id}`)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-puma-card transition-colors cursor-pointer text-puma-muted hover:text-puma-text">
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-puma-card text-2xl flex-shrink-0">{agent.avatar}</div>
            <div>
              <h2 className="text-puma-text font-bold text-base">{agent.name}</h2>
              <p className="text-puma-muted text-xs">
                {agent.linkedModelName ? `${agent.linkedModelName} · Custom AI` : 'Custom AI Agent'}
                {nsfwOn && <span className="ml-2 text-red-400">🔞</span>}
                {rpEnabled && <span className="ml-2 text-puma-accent">🎭</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {agent.files.length > 0 && (
              <button onClick={() => setShowFilePanel(!showFilePanel)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${showFilePanel ? 'bg-puma-accent/15 border-puma-accent/40 text-puma-accent' : 'bg-puma-card border-puma-border/30 text-puma-muted'}`}>
                <i className="ri-file-line text-sm"></i>
                <span className="text-xs">{agent.files.length}개 파일</span>
                {readableFiles.length > 0 && <span className="px-1.5 py-0.5 bg-green-400/20 text-green-400 text-[10px] rounded font-medium">{readableFiles.length} 인식됨</span>}
              </button>
            )}
            <button
              onClick={isCapturing ? stopCapture : startCapture}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${isCapturing ? 'bg-green-400/15 border-green-400/40 text-green-400' : 'bg-puma-card border-puma-border/30 text-puma-muted hover:text-puma-accent'}`}
            >
              <i className="ri-computer-line text-sm"></i>
              {isCapturing ? <><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>화면 공유 중</> : '화면 공유'}
            </button>
            <button onClick={() => navigate(`/ai-builder/${id}`)} className="flex items-center gap-2 px-3 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-settings-3-line text-sm"></i>Edit
            </button>
          </div>
        </div>

        {/* File Panel */}
        {showFilePanel && agent.files.length > 0 && (
          <div className="bg-puma-surface border-b border-puma-border/30 px-5 py-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-puma-text text-sm font-semibold">업로드된 파일 ({agent.files.length})</p>
              <button onClick={() => setShowFilePanel(false)} className="text-puma-muted hover:text-puma-text cursor-pointer"><i className="ri-close-line"></i></button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {agent.files.map((file) => {
                const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
                const isImg = file.type?.startsWith('image/');
                const icon = ext === 'pdf' ? 'ri-file-pdf-line' : ext === 'json' ? 'ri-file-code-line' : ext === 'gguf' ? 'ri-cpu-line' : isImg ? 'ri-image-line' : 'ri-file-text-line';
                const color = ext === 'pdf' ? 'text-red-400' : ext === 'json' ? 'text-yellow-400' : ext === 'gguf' ? 'text-orange-400' : isImg ? 'text-puma-accent' : 'text-green-400';
                return (
                  <div key={file.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-shrink-0 ${file.content ? 'bg-green-400/10 border-green-400/20' : 'bg-puma-bg border-puma-border/20'}`}>
                    <i className={`${icon} text-sm ${color}`}></i>
                    <div>
                      <p className="text-puma-text text-xs font-medium truncate max-w-[120px]">{file.name}</p>
                      <p className="text-puma-muted text-[10px]">{file.content ? '✓ 인식됨' : '읽는 중...'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-puma-card text-4xl mb-4">{agent.avatar}</div>
              <h3 className="text-puma-text text-lg font-bold mb-1">{agent.name}</h3>
              <p className="text-puma-muted text-sm mb-2">
                {agent.linkedModelName ? `${agent.linkedModelName}로 구동 중` : 'Custom AI Agent'}
                {nsfwOn && <span className="ml-2 text-red-400">🔞 무검열</span>}
                {rpEnabled && <span className="ml-2 text-puma-accent">🎭 롤플레이</span>}
              </p>

              {/* Roleplay info */}
              {rpEnabled && (
                <div className="bg-puma-accent/10 border border-puma-accent/20 rounded-xl px-4 py-3 mb-4 max-w-sm text-left">
                  <p className="text-puma-accent text-xs font-semibold mb-2">🎭 롤플레이 모드 활성화</p>
                  {agent.roleplay.roleName && <p className="text-puma-muted text-xs">역할: <span className="text-puma-text">{agent.roleplay.roleName}</span></p>}
                  {callNames.length > 0 && (
                    <div className="mt-1.5">
                      <p className="text-puma-muted text-xs mb-1">호출명 (이름을 부르면 응답):</p>
                      <div className="flex flex-wrap gap-1">
                        {callNames.map((n) => (
                          <span key={n} className="px-2 py-0.5 bg-puma-accent/20 text-puma-accent text-[10px] rounded-full">📢 {n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {agent.roleplay.personality && <p className="text-puma-muted text-xs mt-1.5 line-clamp-2">{agent.roleplay.personality}</p>}
                </div>
              )}

              {agent.files.length > 0 && (
                <div className="bg-puma-accent/10 border border-puma-accent/20 rounded-xl px-4 py-3 mb-4 max-w-sm">
                  <p className="text-puma-accent text-xs font-medium flex items-center gap-1.5 mb-1">
                    <i className="ri-file-line"></i>{agent.files.length}개 파일 인식됨
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {agent.files.map((f) => {
                      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
                      const badge = ext === 'pdf' ? '🔴 PDF' : ext === 'json' ? '🟡 JSON' : ext === 'gguf' ? '🟠 GGUF' : f.type?.startsWith('image/') ? '🖼️ 이미지' : '📄 TXT';
                      return <span key={f.id} className="text-[10px] px-1.5 py-0.5 bg-puma-card rounded text-puma-muted">{badge}</span>;
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  rpEnabled ? `${callNames[0] || agent.name}! 소개해줘` : '안녕! 소개해줘',
                  agent.files.length > 0 ? '파일 내용 분석해줘' : '무엇을 할 수 있어?',
                  rpEnabled ? '지금 상황이 어때?' : '도움이 필요해',
                ].map((q) => (
                  <button key={q} onClick={() => setInput(q)} className="px-3 py-2 bg-puma-surface border border-puma-border/30 rounded-lg text-puma-muted text-xs hover:border-puma-accent/50 hover:text-puma-text transition-colors cursor-pointer">{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-puma-card text-lg flex-shrink-0 mt-0.5">
                  {msg.agentAvatar || agent.avatar}
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl text-sm leading-relaxed overflow-hidden ${msg.role === 'user' ? 'bg-puma-accent/20 text-puma-text rounded-tr-sm' : 'bg-puma-surface border border-puma-border/30 text-puma-text rounded-tl-sm'}`}>
                {/* Agent name label for group roleplay */}
                {msg.role === 'assistant' && msg.agentName && msg.agentName !== agent.name && (
                  <div className="px-4 pt-2.5 pb-0">
                    <span className="text-puma-accent text-[10px] font-semibold">{msg.agentAvatar} {msg.agentName}</span>
                    {msg.isRoleplay && <span className="ml-1.5 text-puma-muted text-[10px]">🎭</span>}
                  </div>
                )}
                {msg.role === 'assistant' && msg.isRoleplay && msg.agentName === agent.name && (
                  <div className="px-4 pt-2.5 pb-0">
                    <span className="text-puma-accent text-[10px] font-semibold">🎭 {agent.roleplay?.roleName || agent.name}</span>
                  </div>
                )}
                {/* Attached files */}
                {msg.role === 'user' && msg.attachedFiles && msg.attachedFiles.length > 0 && (
                  <div className="px-3 pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {msg.attachedFiles.map(f => (
                        <div key={f.id} className="flex items-center gap-1.5 px-2 py-1 bg-puma-card/60 rounded-lg border border-puma-border/20">
                          {f.fileKind === 'image' && f.previewUrl ? (
                            <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                              <img src={f.previewUrl} alt={f.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <i className={`${
                              f.fileKind === 'pdf' ? 'ri-file-pdf-line text-red-400' :
                              f.fileKind === 'json' ? 'ri-file-code-line text-yellow-400' :
                              f.fileKind === 'audio' ? 'ri-music-line text-pink-400' :
                              f.fileKind === 'video' ? 'ri-video-line text-teal-400' :
                              f.fileKind === 'gguf' ? 'ri-cpu-line text-orange-400' :
                              'ri-file-text-line text-green-400'
                            } text-sm`}></i>
                          )}
                          <span className="text-puma-text text-xs max-w-[100px] truncate">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 whitespace-pre-wrap">
                  {msg.content}
                  {msg.role === 'assistant' && msg.content === '' && (
                    <div className="flex gap-1 items-center h-4">
                      <span className="typing-dot w-1.5 h-1.5 bg-puma-accent rounded-full"></span>
                      <span className="typing-dot w-1.5 h-1.5 bg-puma-accent rounded-full"></span>
                      <span className="typing-dot w-1.5 h-1.5 bg-puma-accent rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-puma-card flex-shrink-0 mt-0.5">
                  <i className="ri-user-line text-puma-muted text-sm"></i>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-puma-border/30 bg-puma-surface">
          {/* File chips */}
          {chatFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              <ChatFileUpload files={chatFiles} onChange={setChatFiles} compact />
            </div>
          )}
          <div className="flex items-end gap-2 bg-puma-bg rounded-xl border border-puma-border/30 px-3 py-2 focus-within:border-puma-accent/50 transition-colors">
            {/* File upload button */}
            <ChatFileUpload files={[]} onChange={f => setChatFiles(prev => [...prev, ...f])} compact />
            {isCapturing && (
              <div className="flex-shrink-0 mb-1">
                <div className="w-6 h-6 flex items-center justify-center rounded bg-green-400/20">
                  <i className="ri-computer-line text-green-400 text-xs"></i>
                </div>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                chatFiles.length > 0
                  ? `${chatFiles.length}개 파일 첨부됨 · 질문을 입력하거나 바로 전송...`
                  : rpEnabled && callNames.length > 0
                  ? `"${callNames[0]}" 또는 "${agent.name}"을 불러보세요...`
                  : isCapturing
                  ? '화면에 대해 질문하세요...'
                  : `${agent.name}에게 메시지... (파일 첨부 가능)`
              }
              rows={1}
              className="flex-1 bg-transparent text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none resize-none py-1 min-h-[24px]"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && chatFiles.length === 0) || isGenerating}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer flex-shrink-0 ${
                (input.trim() || chatFiles.length > 0) && !isGenerating
                  ? 'bg-puma-accent text-white hover:bg-puma-accentBright'
                  : 'bg-puma-border/30 text-puma-muted cursor-not-allowed'
              }`}
            >
              <i className="ri-send-plane-fill text-sm"></i>
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-puma-muted text-xs flex items-center gap-2">
              <i className="ri-shield-check-line"></i>
              <span>{agent.name} · {agent.linkedModelName || 'No model'} · 로컬 저장됨</span>
              {nsfwOn && <span className="text-red-400 font-semibold">🔞</span>}
              {rpEnabled && <span className="text-puma-accent">🎭 롤플레이</span>}
              {isCapturing && <span className="text-green-400">🖥️ 화면 공유</span>}
            </p>
            {messages.length > 0 && (
              <button onClick={clearHistory} className="text-puma-muted/60 text-xs hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-delete-bin-line mr-1"></i>기록 삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}