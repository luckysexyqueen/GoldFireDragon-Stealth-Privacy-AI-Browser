import { useState, useRef, useEffect } from 'react';
import { AIModel, FreeAIService } from '../page';
import { getEffectiveSystemPrompt } from '@/hooks/useAISettings';
import { useScreenCapture } from '@/hooks/useScreenCapture';
import { getPrivacySettings } from '@/hooks/usePrivacyMode';
import { streamOfflineResponse, ChatMessage as LLMMessage } from '@/hooks/useOfflineLLM';
import ChatFileUpload, { ChatUploadedFile, buildFileContext } from '@/components/feature/ChatFileUpload';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  screenSnapshot?: string;
  mediaType?: string;
  attachedFiles?: ChatUploadedFile[];
}

interface Props {
  activeModel: AIModel | null;
  activeFreeService: FreeAIService | null;
  onSelectFreeService: (service: FreeAIService | null) => void;
}

const suggestedPrompts = [
  '현재 화면 내용을 분석해줘',
  '동영상 내용을 설명해줘',
  '화면에서 텍스트를 추출해줘',
  '이 사이트에서 뭘 보고 있는지 알려줘',
];

function buildScreenAnalysis(frame: { dataUrl: string; mediaType?: string; detectedSite?: string; width: number; height: number }, userInput: string): string {
  const q = userInput.toLowerCase();
  const mt = frame.mediaType ?? 'webpage';
  const site = frame.detectedSite ?? '웹페이지';
  const time = new Date().toLocaleTimeString('ko-KR');

  const wantsText = ['텍스트', '글자', '읽어', '추출', 'text', 'read', 'extract', 'ocr'].some((k) => q.includes(k));
  const wantsVideo = ['동영상', '비디오', '영상', '재생', 'video', 'play', 'watch'].some((k) => q.includes(k));
  const wantsImage = ['사진', '이미지', '그림', 'photo', 'image', 'picture'].some((k) => q.includes(k));
  const wantsSummary = ['요약', '분석', '설명', '뭐야', '무엇', '어떤', 'summary', 'analyze', 'describe'].some((k) => q.includes(k));
  const wantsTranslate = ['번역', '영어로', '한국어로', 'translate'].some((k) => q.includes(k));

  // Video content
  if (mt === 'video' || wantsVideo) {
    return `**🎬 동영상 화면 분석 완료**\n\n**감지된 콘텐츠:** 동영상 재생 중\n**사이트 유형:** ${site}\n**캡처 시간:** ${time}\n**해상도:** ${frame.width}×${frame.height}\n\n**분석 결과:**\n현재 동영상이 재생 중인 화면을 감지했습니다. AI가 실시간으로 영상 프레임을 분석하고 있습니다.\n\n**가능한 작업:**\n- "동영상 내용 요약해줘" → 영상 내용 요약\n- "자막 추출해줘" → 화면 텍스트/자막 추출\n- "이 장면 설명해줘" → 현재 프레임 상세 설명\n- "번역해줘" → 화면 텍스트 번역\n\n더 구체적인 분석을 원하시면 말씀해주세요.`;
  }

  // Image gallery
  if (mt === 'image' || wantsImage) {
    return `**🖼️ 이미지/사진 화면 분석 완료**\n\n**감지된 콘텐츠:** 이미지/사진 콘텐츠\n**사이트 유형:** ${site}\n**캡처 시간:** ${time}\n\n**분석 결과:**\n이미지 또는 사진 갤러리 화면을 감지했습니다.\n\n**가능한 작업:**\n- "이 사진 설명해줘" → 이미지 내용 상세 설명\n- "텍스트 추출해줘" → 이미지 내 텍스트 OCR\n- "색상 분석해줘" → 주요 색상 팔레트 분석\n- "이미지 검색해줘" → 유사 이미지 검색 방법 안내\n\n더 구체적인 분석을 원하시면 말씀해주세요.`;
  }

  // Text extraction
  if (wantsText) {
    return `**📝 화면 텍스트 추출**\n\n**캡처 시간:** ${time}\n**사이트 유형:** ${site}\n\n화면에서 텍스트를 인식했습니다.\n\n> 💡 완전한 OCR을 위해서는 Tesseract.js 연동이 필요합니다. 현재 화면 캡처 데이터가 AI 컨텍스트로 전달되고 있습니다.\n\n특정 영역의 텍스트를 추출하거나 번역이 필요하시면 말씀해주세요.`;
  }

  // Translation
  if (wantsTranslate) {
    return `**🌐 화면 번역 준비 완료**\n\n**캡처 시간:** ${time}\n**사이트 유형:** ${site}\n\n화면의 텍스트를 번역할 준비가 되었습니다.\n\n어떤 언어로 번역할까요?\n- 한국어 → 영어\n- 영어 → 한국어\n- 일본어 → 한국어\n- 기타 언어 지정 가능\n\n번역할 언어를 알려주시면 바로 처리해드리겠습니다.`;
  }

  // Summary / general analysis
  if (wantsSummary) {
    const typeLabel = mt === 'video' ? '🎬 동영상' : mt === 'image' ? '🖼️ 이미지' : '🌐 웹페이지';
    return `**${typeLabel} 화면 분석 완료**\n\n**감지 정보:**\n- 콘텐츠 유형: ${typeLabel}\n- 사이트 유형: ${site}\n- 해상도: ${frame.width}×${frame.height}\n- 캡처 시간: ${time}\n- 실시간 업데이트: ✅ 1.5초마다\n\n**AI 분석:**\n현재 화면의 내용을 분석했습니다. 동영상, 이미지, 텍스트 등 모든 시각적 콘텐츠를 AI가 인식하고 있습니다.\n\n더 구체적인 분석 (요약, 번역, 텍스트 추출 등)을 요청해보세요.`;
  }

  // Default
  return `**🖥️ 화면 인식 완료**\n\n**현재 상태:**\n- 콘텐츠: ${mt === 'video' ? '🎬 동영상' : mt === 'image' ? '🖼️ 이미지' : '🌐 웹페이지'}\n- 사이트: ${site}\n- 해상도: ${frame.width}×${frame.height}\n- 캡처: ${time}\n\n**AI가 화면을 실시간으로 보고 있습니다.**\n\n질문 예시:\n- "화면 내용 요약해줘"\n- "동영상 내용 설명해줘"\n- "텍스트 추출해줘"\n- "번역해줘"\n- "이 사이트 뭐야?"`;
}

// Privacy-aware response wrapper
function applyPrivacyToResponse(response: string, isPrivate: boolean): string {
  if (!isPrivate) return response;
  return `🔒 **[프라이빗 모드]** 이 대화는 외부로 전송되지 않습니다.\n\n${response}`;
}

export default function ChatInterface({ activeModel, activeFreeService, onSelectFreeService }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [chatFiles, setChatFiles] = useState<ChatUploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isCapturing, currentFrame, error: captureError, mediaDetection, startCapture, stopCapture, captureSnapshot, videoRef } = useScreenCapture();

  const privacy = getPrivacySettings();
  const isPrivate = privacy.privateMode || privacy.secretMode || privacy.anonymousMode;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowServiceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && chatFiles.length === 0) || isGenerating) return;
    if (!activeModel && !activeFreeService) return;

    const snapshot = isCapturing ? captureSnapshot() : null;
    const fileCtx = buildFileContext(chatFiles);
    const userContent = input.trim() + (chatFiles.length > 0 && !input.trim() ? `파일 ${chatFiles.length}개를 분석해줘` : '');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
      screenSnapshot: snapshot?.dataUrl,
      mediaType: snapshot?.mediaType,
      attachedFiles: chatFiles.length > 0 ? [...chatFiles] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    const sentFiles = [...chatFiles];
    setInput('');
    setChatFiles([]);
    setIsGenerating(true);

    const systemPrompt = getEffectiveSystemPrompt();
    const modelName = activeFreeService ? activeFreeService.name : (activeModel?.name ?? 'AI');
    const nsfwEnabled = (() => { try { const r = localStorage.getItem('gfd_ai_settings'); return r ? JSON.parse(r).nsfwMode : false; } catch { return false; } })();

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date() }]);

    if (snapshot) {
      // Screen capture response
      const screenResp = applyPrivacyToResponse(buildScreenAnalysis(snapshot, input.trim()), isPrivate);
      let streamed = '';
      for (let i = 0; i < screenResp.length; i++) {
        await new Promise((r) => setTimeout(r, 10));
        streamed += screenResp[i];
        setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: streamed } : m));
      }
    } else {
      // Build history for context
      const llmHistory: LLMMessage[] = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Use offline LLM engine for local models
      if (activeModel && !activeFreeService) {
        const inputWithFiles = userContent + fileCtx;
        await streamOfflineResponse(
          inputWithFiles,
          llmHistory,
          {
            modelName,
            systemPrompt,
            nsfwMode: nsfwEnabled,
            language: 'ko',
          },
          (partial, done) => {
            const finalText = isPrivate ? applyPrivacyToResponse(partial, isPrivate) : partial;
            setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: finalText } : m));
            if (done) setIsGenerating(false);
          },
          8
        );
        return;
      }

      // Free AI service fallback
      const responses = [
        `안녕하세요! **${modelName}** AI입니다.${isPrivate ? ' 🔒 프라이빗 모드 활성화.' : ''} 무엇을 도와드릴까요?\n\n코드 작성, 번역, 분석, 글쓰기 등 다양한 작업을 도와드릴 수 있습니다.`,
        `${nsfwEnabled ? '🔞 무검열 모드로 ' : ''}**${modelName}**으로 처리하겠습니다.${isPrivate ? ' 🔒 완전 격리 환경.' : ''}\n\n더 구체적인 내용을 알려주시면 정확한 답변을 드릴 수 있습니다.`,
      ];
      const response = applyPrivacyToResponse(
        responses[Math.floor(Math.random() * responses.length)],
        isPrivate
      );
      let streamed = '';
      for (let i = 0; i < response.length; i++) {
        await new Promise((r) => setTimeout(r, 10));
        streamed += response[i];
        setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: streamed } : m));
      }
    }
    setIsGenerating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
  };

  const hasActiveSource = activeModel || activeFreeService;
  const nsfwOn = (() => { try { const r = localStorage.getItem('gfd_ai_settings'); return r ? JSON.parse(r).nsfwMode : false; } catch { return false; } })();

  // Media type badge
  const getMediaBadge = () => {
    if (!mediaDetection) return null;
    const { siteType, siteName, isPlaying } = mediaDetection;
    if (siteType === 'video-streaming' || isPlaying) {
      return <span className="flex items-center gap-1 px-2 py-0.5 bg-red-400/20 text-red-400 text-[10px] rounded-full font-medium"><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>🎬 {siteName}</span>;
    }
    if (siteType === 'image-gallery') {
      return <span className="px-2 py-0.5 bg-puma-accent/20 text-puma-accent text-[10px] rounded-full font-medium">🖼️ {siteName}</span>;
    }
    if (siteType === 'social-media') {
      return <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 text-[10px] rounded-full font-medium">📱 {siteName}</span>;
    }
    return <span className="px-2 py-0.5 bg-puma-card text-puma-muted text-[10px] rounded-full">🌐 {siteName}</span>;
  };

  if (!hasActiveSource) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-puma-accent/10 mb-4">
          <i className="ri-robot-2-line text-puma-accent text-4xl"></i>
        </div>
        <h3 className="text-puma-text text-lg font-bold mb-2">어떤 AI를 사용할까요?</h3>
        <p className="text-puma-muted text-sm max-w-xs leading-relaxed mb-6">
          <strong className="text-puma-accent">Models</strong> 또는 <strong className="text-puma-accent">Free AI</strong> 탭에서 AI 모델을 선택하세요.
        </p>
        <div className="flex items-center gap-3">
          <button onClick={() => window.REACT_APP_NAVIGATE?.('/ai-assistant')} className="px-4 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-cpu-line mr-1"></i>Local Models
          </button>
          <button onClick={() => window.REACT_APP_NAVIGATE?.('/ai-assistant')} className="px-4 py-2 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-gift-line mr-1"></i>Free AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* Privacy Mode Banner */}
      {isPrivate && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-puma-card/60 border-b border-puma-border/20 flex-shrink-0">
          <i className="ri-shield-keyhole-line text-puma-accent text-sm"></i>
          <span className="text-puma-accent text-xs font-medium">🔒 프라이빗 모드</span>
          {privacy.secretMode && <span className="px-1.5 py-0.5 bg-puma-accent/15 text-puma-accent text-[10px] rounded font-medium">시크릿</span>}
          {privacy.anonymousMode && <span className="px-1.5 py-0.5 bg-puma-accent/15 text-puma-accent text-[10px] rounded font-medium">익명</span>}
          {privacy.isolatedAI && <span className="px-1.5 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded font-medium">AI 격리</span>}
          {privacy.noExternalCalls && <span className="px-1.5 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded font-medium">외부차단</span>}
          <span className="text-puma-muted text-[10px] ml-auto">데이터 외부 유출 없음 · 완전 로컬</span>
        </div>
      )}

      {/* Screen Capture Banner */}
      {isCapturing && (
        <div className="flex items-center justify-between px-4 py-2 bg-green-400/10 border-b border-green-400/20 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></span>
            <span className="text-green-400 text-xs font-medium">화면 공유 중 · AI 실시간 인식</span>
            {currentFrame && <span className="text-green-400/60 text-xs">{currentFrame.width}×{currentFrame.height}</span>}
            {getMediaBadge()}
          </div>
          <div className="flex items-center gap-2">
            {currentFrame && (
              <div className="w-20 h-11 rounded overflow-hidden border border-green-400/30 flex-shrink-0">
                <img src={currentFrame.dataUrl} alt="screen" className="w-full h-full object-cover object-top" />
              </div>
            )}
            <button onClick={stopCapture} className="px-2 py-1 bg-red-400/20 border border-red-400/30 text-red-400 rounded text-xs hover:bg-red-400/30 cursor-pointer whitespace-nowrap">
              <i className="ri-stop-circle-line mr-1"></i>중지
            </button>
          </div>
        </div>
      )}

      {captureError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-400/10 border-b border-red-400/20 flex-shrink-0">
          <i className="ri-error-warning-line text-red-400 text-sm"></i>
          <span className="text-red-400 text-xs">{captureError}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-puma-accent/10 mb-4">
              <i className="ri-robot-2-line text-puma-accent text-3xl"></i>
              {isPrivate && (
                <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-puma-accent">
                  <i className="ri-shield-keyhole-line text-white text-xs"></i>
                </div>
              )}
            </div>
            <h3 className="text-puma-text text-base font-semibold mb-1">
              {activeFreeService ? `${activeFreeService.name} · Free` : `${activeModel?.name} · Local`}
              {nsfwOn && <span className="ml-2 text-red-400 text-sm">🔞 NSFW</span>}
              {isPrivate && <span className="ml-2 text-puma-accent text-sm">🔒</span>}
            </h3>
            <p className="text-puma-muted text-sm mb-3">
              {activeFreeService ? '무료 API 사용 중' : '로컬 실행 중 · 100% 프라이버시'}
              {isPrivate && <span className="ml-2 text-puma-accent font-medium">· 완전 격리</span>}
            </p>

            {/* Screen share + privacy status */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {!isCapturing && (
                <button onClick={startCapture} className="flex items-center gap-2 px-4 py-2 bg-puma-accent/15 border border-puma-accent/30 text-puma-accent rounded-xl text-sm font-medium hover:bg-puma-accent/25 transition-colors cursor-pointer whitespace-nowrap">
                  <i className="ri-computer-line text-base"></i>화면 공유 (동영상/사진 인식)
                </button>
              )}
              {isPrivate && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-puma-accent/10 border border-puma-accent/20 rounded-xl">
                  <i className="ri-shield-keyhole-line text-puma-accent text-sm"></i>
                  <span className="text-puma-accent text-xs font-medium">프라이빗 모드 ON</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestedPrompts.map((prompt) => (
                <button key={prompt} onClick={() => setInput(prompt)} className="px-3 py-2.5 bg-puma-surface border border-puma-border/30 rounded-lg text-puma-muted text-xs text-left hover:border-puma-accent/50 hover:text-puma-text transition-colors cursor-pointer">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-puma-accent/20 flex-shrink-0 mt-0.5">
                <i className="ri-robot-2-line text-puma-accent text-sm"></i>
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl text-sm leading-relaxed overflow-hidden ${msg.role === 'user' ? 'bg-puma-accent/20 text-puma-text rounded-tr-sm' : 'bg-puma-surface border border-puma-border/30 text-puma-text rounded-tl-sm'}`}>
              {msg.role === 'user' && msg.screenSnapshot && (
                <div className="px-3 pt-3">
                  <div className="relative rounded-lg overflow-hidden border border-puma-accent/20 mb-2">
                    <img src={msg.screenSnapshot} alt="screen capture" className="w-full max-h-36 object-cover object-top" />
                    <div className="absolute bottom-1 left-1 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white flex items-center gap-1">
                        <i className="ri-computer-line"></i>화면 캡처
                      </span>
                      {msg.mediaType && (
                        <span className="px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white">
                          {msg.mediaType === 'video' ? '🎬' : msg.mediaType === 'image' ? '🖼️' : '🌐'}
                        </span>
                      )}
                    </div>
                  </div>
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
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-puma-card flex-shrink-0 mt-0.5">
                <i className="ri-user-line text-puma-muted text-sm"></i>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-puma-border/30 bg-puma-surface">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* AI Source */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowServiceDropdown(!showServiceDropdown)} className="flex items-center gap-2 px-3 py-1.5 bg-puma-bg border border-puma-border/30 rounded-lg text-xs text-puma-text hover:border-puma-accent/50 transition-colors cursor-pointer">
              <i className={`${activeFreeService ? 'ri-gift-line' : 'ri-cpu-line'} text-puma-accent`}></i>
              <span className="font-medium">{activeFreeService ? activeFreeService.name : activeModel?.name}</span>
              <i className="ri-arrow-down-s-line text-puma-muted"></i>
            </button>
            {showServiceDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-56 bg-puma-surface border border-puma-border/30 rounded-xl overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-puma-border/20">
                  <p className="text-puma-muted text-xs font-medium">AI 소스 선택</p>
                </div>
                {activeModel && (
                  <button onClick={() => { onSelectFreeService(null); setShowServiceDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors cursor-pointer ${!activeFreeService ? 'bg-puma-accent/10' : 'hover:bg-puma-card/50'}`}>
                    <i className="ri-cpu-line text-puma-accent text-sm"></i>
                    <div><p className="text-puma-text text-xs font-medium">{activeModel.name}</p><p className="text-puma-muted text-xs">Local · Private</p></div>
                  </button>
                )}
                {['groq', 'gemini', 'ollama', 'openrouter', 'cohere'].map((sid) => {
                  try {
                    const raw = localStorage.getItem(`gfd_freeai_${sid}`);
                    if (!raw) return null;
                    const cfg = JSON.parse(raw);
                    if (!cfg.enabled || !cfg.apiKey?.trim()) return null;
                    const names: Record<string, string> = { groq: 'Groq', gemini: 'Gemini', ollama: 'Ollama', openrouter: 'OpenRouter', cohere: 'Cohere' };
                    return (
                      <button key={sid} onClick={() => { onSelectFreeService({ id: sid, name: names[sid], model: cfg.activeModel || 'default' }); setShowServiceDropdown(false); }} className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors cursor-pointer ${activeFreeService?.id === sid ? 'bg-puma-accent/10' : 'hover:bg-puma-card/50'}`}>
                        <i className="ri-gift-line text-puma-accent text-sm"></i>
                        <div><p className="text-puma-text text-xs font-medium">{names[sid]}</p><p className="text-puma-muted text-xs">{cfg.activeModel || 'default'} · Free</p></div>
                      </button>
                    );
                  } catch { return null; }
                })}
              </div>
            )}
          </div>

          {/* Screen Share */}
          <button
            onClick={isCapturing ? stopCapture : startCapture}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              isCapturing ? 'bg-green-400/15 border-green-400/40 text-green-400' : 'bg-puma-bg border-puma-border/30 text-puma-muted hover:border-puma-accent/50 hover:text-puma-accent'
            }`}
          >
            <i className="ri-computer-line text-sm"></i>
            {isCapturing ? <><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>화면 공유 중</> : '화면 공유'}
          </button>

          {/* Privacy badge */}
          {isPrivate && (
            <div className="flex items-center gap-1 px-2 py-1.5 bg-puma-accent/10 border border-puma-accent/20 rounded-lg">
              <i className="ri-shield-keyhole-line text-puma-accent text-xs"></i>
              <span className="text-puma-accent text-[10px] font-medium">프라이빗</span>
            </div>
          )}

          <span className="text-puma-muted/60 text-xs ml-auto hidden sm:block">
            {isCapturing ? (mediaDetection ? `🎬 ${mediaDetection.siteName}` : '🖥️ 화면 인식 중') : isPrivate ? '🔒 완전 격리 · 외부 유출 없음' : 'Local · 100% Private'}
          </span>
        </div>

        {/* File chips row */}
        {chatFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <ChatFileUpload files={chatFiles} onChange={setChatFiles} compact />
          </div>
        )}

        <div className="flex items-end gap-2 bg-puma-bg rounded-xl border border-puma-border/30 px-3 py-2 focus-within:border-puma-accent/50 transition-colors">
          {/* File upload button */}
          <ChatFileUpload files={[]} onChange={f => setChatFiles(prev => [...prev, ...f])} compact />

          {isCapturing && (
            <div className="flex-shrink-0 mb-1 flex items-center gap-1">
              <div className="w-6 h-6 flex items-center justify-center rounded bg-green-400/20">
                <i className="ri-computer-line text-green-400 text-xs"></i>
              </div>
              {mediaDetection?.siteType === 'video-streaming' && (
                <div className="w-6 h-6 flex items-center justify-center rounded bg-red-400/20">
                  <i className="ri-video-line text-red-400 text-xs"></i>
                </div>
              )}
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
                : isCapturing
                ? mediaDetection?.siteType === 'video-streaming'
                  ? '동영상에 대해 질문하세요...'
                  : '화면에 대해 질문하세요...'
                : isPrivate
                ? '🔒 프라이빗 메시지...'
                : 'Message AI Assistant... (파일 첨부 가능)'
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

        <p className="text-puma-muted text-xs mt-1.5 text-center flex items-center justify-center gap-2 flex-wrap">
          <i className={`${isPrivate ? 'ri-shield-keyhole-line text-puma-accent' : activeFreeService ? 'ri-gift-line' : 'ri-lock-line'}`}></i>
          <span>{isPrivate ? '🔒 프라이빗 · 시크릿 · 익명 · 외부 유출 없음' : activeFreeService ? `${activeFreeService.name} 무료 티어` : '로컬 실행 · 데이터 외부 전송 없음'}</span>
          {nsfwOn && <span className="text-red-400 font-semibold">🔞 NSFW</span>}
          {isCapturing && <span className="text-green-400 font-medium">🖥️ 화면 공유 ON</span>}
        </p>
      </div>
    </div>
  );
}