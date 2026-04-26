import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import AppHeader from '@/components/layout/AppHeader';
import ModelLoader from '@/components/features/ModelLoader';
import ChatInterface from '@/components/features/ChatInterface';
import DocumentRAG from '@/components/features/DocumentRAG';
import GenerationSettings from '@/components/features/GenerationSettings';
import SystemInfo from '@/components/features/SystemInfo';
import ChatSessionPanel from '@/components/features/ChatSessionPanel';
import GGUFUploader from '@/components/features/GGUFUploader';
import { useEngineState } from '@/hooks/useEngineState';
import { useWebLLM } from '@/hooks/useWebLLM';
import { useGGUF } from '@/hooks/useGGUF';
import { useONNX } from '@/hooks/useONNX';
import { useChat } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';
import { useModelProfiles } from '@/hooks/useModelProfiles';
import { useGGUFUploads } from '@/hooks/useGGUFUploads';
import { GenerationConfig, EngineType } from '@/types/engine';
import { DEFAULT_GENERATION_CONFIG } from '@/constants/presets';
import { ChevronLeft, ChevronRight, Layers, MessageSquare, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = ['chat', 'docs', 'playground', 'settings', 'uploads'] as const;
type TabId = typeof TABS[number];

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_GENERATION_CONFIG);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { state: engineState, setProgress, setError, setReady, setStatus, updateTPS, reset: resetEngine } = useEngineState();
  const webllm = useWebLLM();
  const gguf = useGGUF();
  const onnx = useONNX();
  const chat = useChat();
  const docs = useDocuments();
  const modelProfiles = useModelProfiles();
  const ggufUploads = useGGUFUploads();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoadWebLLM = useCallback(async (modelId: string) => {
    setStatus('loading');
    const ok = await webllm.loadModel(
      modelId,
      (p, m) => setProgress(p, m),
      (e) => { setError(e); toast.error(e); }
    );
    if (ok) {
      setReady('webllm', modelId);
      toast.success(`WebLLM 모델 로드 완료: ${modelId}`);
    }
  }, [webllm, setStatus, setProgress, setError, setReady]);

  const handleLoadGGUF = useCallback(async (url: string, modelId: string) => {
    setStatus('loading');
    const ok = await gguf.loadModel(
      url,
      (p, m) => setProgress(p, m),
      (e) => { setError(e); toast.error(e); }
    );
    if (ok) {
      setReady('gguf', modelId);
      toast.success(`GGUF 모델 로드 완료`);
    }
  }, [gguf, setStatus, setProgress, setError, setReady]);

  const handleLoadONNX = useCallback(async (modelId: string) => {
    setStatus('loading');
    const ok = await onnx.loadModel(
      modelId,
      (p, m) => setProgress(p, m),
      (e) => { setError(e); toast.error(e); }
    );
    if (ok) {
      setReady('onnx', modelId);
      toast.success(`ONNX 모델 로드 완료: ${modelId}`);
    }
  }, [onnx, setStatus, setProgress, setError, setReady]);

  const handleLoadCustom = useCallback(async (url: string, engine: EngineType, name: string) => {
    if (engine === 'webllm') await handleLoadWebLLM(url);
    else if (engine === 'gguf') await handleLoadGGUF(url, name);
    else if (engine === 'onnx') await handleLoadONNX(url);
  }, [handleLoadWebLLM, handleLoadGGUF, handleLoadONNX]);

  const handleUnload = useCallback(async () => {
    if (engineState.type === 'webllm') await webllm.unload();
    else if (engineState.type === 'gguf') await gguf.unload();
    else if (engineState.type === 'onnx') await onnx.unload();
    resetEngine();
    toast.info('모델 언로드됨');
  }, [engineState.type, webllm, gguf, onnx, resetEngine]);

  // Create or ensure session exists before sending
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (chat.currentSessionId) return chat.currentSessionId;

    // Create a new session with a timestamp title
    const title = `대화 ${new Date().toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    return chat.createSession(title, engineState.type || undefined, engineState.modelId || undefined);
  }, [chat, engineState]);

  const handleSend = useCallback(async (content: string) => {
    if (!engineState.modelId) {
      toast.error('먼저 모델을 로드하세요.');
      return;
    }

    // Build RAG context if enabled
    const currentConfig = { ...config };
    if (ragEnabled && docs.files.length > 0) {
      const ragContext = docs.searchDocuments(content, 3);
      if (ragContext) {
        currentConfig.system_prompt = ragContext + '\n\n' + config.system_prompt;
      }
    }

    // Ensure session exists in DB
    const sessionId = await ensureSession();

    chat.addMessage({ role: 'user', content });

    // Save user message to DB
    if (sessionId) {
      await import('@/lib/supabase').then(({ supabase }) => {
        supabase.from('chat_messages').insert({
          id: `msg_${Date.now()}_u`,
          session_id: sessionId,
          role: 'user',
          content,
          timestamp: Date.now(),
        });
      });
    }

    chat.startStreaming();
    setStatus('generating');

    const allMessages = [
      ...chat.messages,
      { id: 'tmp', role: 'user' as const, content, timestamp: Date.now() }
    ];

    let tokenCount = 0;

    const onToken = (token: string, done: boolean, tps?: number) => {
      if (done) {
        chat.finalizeStream(engineState.type || undefined, engineState.modelId || undefined);
        setStatus('ready');
        if (tps !== undefined && tps > 0) updateTPS(tps, tokenCount);
      } else {
        tokenCount++;
        chat.appendStreamToken(token);
        if (tps !== undefined && tps > 0) updateTPS(tps, tokenCount);
      }
    };

    const onError = (err: string) => {
      chat.finalizeStream();
      setError(err);
      toast.error(err);
    };

    if (engineState.type === 'webllm') {
      await webllm.generate(allMessages, currentConfig, onToken, onError);
    } else if (engineState.type === 'gguf') {
      await gguf.generate(allMessages, currentConfig, onToken, onError);
    } else if (engineState.type === 'onnx') {
      await onnx.generate(allMessages, currentConfig, onToken, onError);
    }
  }, [engineState, config, ragEnabled, docs, chat, webllm, gguf, onnx, setStatus, setError, updateTPS, ensureSession]);

  const handleAbort = useCallback(() => {
    if (engineState.type === 'webllm') webllm.abort();
    else if (engineState.type === 'gguf') gguf.abort();
    else if (engineState.type === 'onnx') onnx.abort();
    setStatus('ready');
    toast.info('생성 중지됨');
  }, [engineState.type, webllm, gguf, onnx, setStatus]);

  const handleConfigChange = useCallback((partial: Partial<GenerationConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const handleNewSession = useCallback(() => {
    chat.clearMessages();
    setShowHistory(false);
    setActiveTab('chat');
  }, [chat]);

  const handleSelectSession = useCallback(async (sessionId: string) => {
    await chat.loadSession(sessionId);
    setShowHistory(false);
    setActiveTab('chat');
  }, [chat]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
        engineState={engineState}
      />

      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'absolute top-4 z-20 p-1.5 rounded-full glass-panel border border-[rgba(0,212,170,0.2)] text-[#00d4aa] hover:bg-[rgba(0,212,170,0.1)] transition-all shadow-lg',
            sidebarOpen ? 'left-[calc(320px-12px)]' : 'left-2'
          )}
          style={{ transition: 'left 0.3s ease' }}
        >
          {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Sidebar */}
        <aside
          className={cn(
            'flex-shrink-0 overflow-hidden glass-panel border-r border-[rgba(0,212,170,0.1)] transition-all duration-300 flex flex-col',
            sidebarOpen ? 'w-[320px]' : 'w-0'
          )}
        >
          {sidebarOpen && (
            <>
              {/* Sidebar Tab Switcher */}
              <div className="flex border-b border-[rgba(255,255,255,0.05)] px-4 pt-3 pb-0 gap-3">
                <button
                  onClick={() => setShowHistory(false)}
                  className={cn(
                    'pb-2 text-xs font-semibold terminal-text border-b-2 transition-all flex items-center gap-1.5',
                    !showHistory
                      ? 'text-[#00d4aa] border-[#00d4aa]'
                      : 'text-gray-600 border-transparent hover:text-gray-400'
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  모델
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className={cn(
                    'pb-2 text-xs font-semibold terminal-text border-b-2 transition-all flex items-center gap-1.5',
                    showHistory
                      ? 'text-[#00d4aa] border-[#00d4aa]'
                      : 'text-gray-600 border-transparent hover:text-gray-400'
                  )}
                >
                  <History className="w-3.5 h-3.5" />
                  대화 기록
                  {chat.sessions.length > 0 && (
                    <span className="text-[10px] px-1 rounded bg-[rgba(0,212,170,0.1)] text-[#00d4aa]">
                      {chat.sessions.length}
                    </span>
                  )}
                </button>
              </div>

              {!showHistory ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <ModelLoader
                    engineState={engineState}
                    onLoadWebLLM={handleLoadWebLLM}
                    onLoadGGUF={handleLoadGGUF}
                    onLoadONNX={handleLoadONNX}
                    onLoadCustom={handleLoadCustom}
                    onUnload={handleUnload}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <ChatSessionPanel
                    sessions={chat.sessions}
                    currentSessionId={chat.currentSessionId}
                    loading={chat.sessionsLoading}
                    onSelectSession={handleSelectSession}
                    onNewSession={handleNewSession}
                    onDeleteSession={chat.deleteSession}
                  />
                </div>
              )}
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatInterface
              messages={chat.messages}
              streamingContent={chat.streamingContent}
              isStreaming={chat.isStreaming}
              engineState={engineState}
              config={config}
              onSend={handleSend}
              onAbort={handleAbort}
              onClear={chat.clearMessages}
              docFiles={docs.files}
            />
          )}

          {activeTab === 'docs' && (
            <DocumentRAG
              files={docs.files}
              isProcessing={docs.isProcessing}
              totalChunks={docs.totalChunks}
              totalSize={docs.totalSize}
              onAddFile={docs.addFile}
              onRemoveFile={docs.removeFile}
              onClearFiles={docs.clearFiles}
              onTestSearch={docs.searchDocuments}
              ragEnabled={ragEnabled}
              onToggleRAG={setRagEnabled}
            />
          )}

          {activeTab === 'playground' && (
            <GenerationSettings
              config={config}
              onChange={handleConfigChange}
              profiles={modelProfiles.profiles}
              profilesLoading={modelProfiles.loading}
              onSaveProfile={modelProfiles.saveProfile}
              onDeleteProfile={modelProfiles.deleteProfile}
              onLoadProfile={(profile) => {
                const partial = modelProfiles.profileToConfig(profile);
                setConfig(prev => ({ ...prev, ...partial }));
                toast.success(`"${profile.name}" 프로필 적용됨`);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SystemInfo engineState={engineState} />
          )}

          {activeTab === 'uploads' && (
            <GGUFUploader
              uploads={ggufUploads.uploads}
              loading={ggufUploads.loading}
              uploading={ggufUploads.uploading}
              uploadProgress={ggufUploads.uploadProgress}
              onUpload={ggufUploads.uploadGGUF}
              onDelete={ggufUploads.deleteUpload}
              onLoad={(url, name) => {
                handleLoadGGUF(url, name);
                setActiveTab('chat');
                setSidebarOpen(true);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
