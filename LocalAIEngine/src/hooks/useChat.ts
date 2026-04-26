import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/engine';
import { supabase, DBChatSession, DBChatMessage } from '@/lib/supabase';
import { toast } from 'sonner';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<boolean>(false);

  // Supabase session state
  const [sessions, setSessions] = useState<DBChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const isSavingRef = useRef(false);

  // Load sessions on mount + Realtime subscription
  useEffect(() => {
    loadSessions();

    const channel = supabase
      .channel('chat_sessions_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_sessions' },
        (payload) => {
          const newSession = payload.new as DBChatSession;
          setSessions(prev => {
            // Avoid duplicates (own inserts already added optimistically)
            if (prev.some(s => s.id === newSession.id)) return prev;
            return [newSession, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_sessions' },
        (payload) => {
          const updated = payload.new as DBChatSession;
          setSessions(prev =>
            prev.map(s => s.id === updated.id ? updated : s)
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_sessions' },
        (payload) => {
          const deletedId = payload.old?.id as string;
          if (deletedId) {
            setSessions(prev => prev.filter(s => s.id !== deletedId));
            setCurrentSessionId(prev => prev === deletedId ? null : prev);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] chat_sessions:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setSessions(data as DBChatSession[]);
    }
    setSessionsLoading(false);
  }, []);

  const createSession = useCallback(async (title: string, engineType?: string, modelId?: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        title,
        engine_type: engineType || null,
        model_id: modelId || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Session create error:', error);
      return null;
    }

    const session = data as DBChatSession;
    setSessions(prev => [session, ...prev]);
    setCurrentSessionId(session.id);
    return session.id;
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      toast.error('대화 불러오기 실패');
      return;
    }

    const msgs: ChatMessage[] = (data as DBChatMessage[]).map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      engine: m.engine as ChatMessage['engine'],
      model: m.model || undefined,
    }));

    setMessages(msgs);
    setCurrentSessionId(sessionId);
    setStreamingContent('');
    setIsStreaming(false);
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (!error) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
        setStreamingContent('');
      }
    }
  }, [currentSessionId]);

  const saveMessageToDB = useCallback(async (sessionId: string, msg: ChatMessage) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    await supabase.from('chat_messages').insert({
      id: msg.id,
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      engine: msg.engine || null,
      model: msg.model || null,
      timestamp: msg.timestamp,
    });

    // Update session message count + updated_at
    await supabase
      .from('chat_sessions')
      .update({
        message_count: messages.length + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    isSavingRef.current = false;
  }, [messages.length]);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const fullMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, fullMsg]);
    return fullMsg;
  }, []);

  const appendStreamToken = useCallback((token: string) => {
    setStreamingContent(prev => prev + token);
  }, []);

  const finalizeStream = useCallback((engine?: string, model?: string) => {
    setStreamingContent(prev => {
      const content = prev;
      if (content) {
        const msg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          role: 'assistant',
          content,
          timestamp: Date.now(),
          engine: engine as ChatMessage['engine'],
          model,
        };
        setMessages(p => {
          // Save assistant message to DB
          if (currentSessionId) {
            supabase.from('chat_messages').insert({
              id: msg.id,
              session_id: currentSessionId,
              role: msg.role,
              content: msg.content,
              engine: msg.engine || null,
              model: msg.model || null,
              timestamp: msg.timestamp,
            }).then(() => {
              supabase.from('chat_sessions').update({
                message_count: p.length + 1,
                updated_at: new Date().toISOString(),
              }).eq('id', currentSessionId);
            });
          }
          return [...p, msg];
        });
      }
      return '';
    });
    setIsStreaming(false);
  }, [currentSessionId]);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setStreamingContent('');
    abortRef.current = false;
  }, []);

  const clearMessages = useCallback(async () => {
    if (currentSessionId) {
      await supabase.from('chat_sessions').delete().eq('id', currentSessionId);
      setSessions(prev => prev.filter(s => s.id !== currentSessionId));
    }
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setCurrentSessionId(null);
  }, [currentSessionId]);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const editMessage = useCallback((id: string, content: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content } : m));
  }, []);

  return {
    messages,
    streamingContent,
    isStreaming,
    addMessage,
    appendStreamToken,
    finalizeStream,
    startStreaming,
    clearMessages,
    removeMessage,
    editMessage,
    // Supabase session management
    sessions,
    sessionsLoading,
    currentSessionId,
    createSession,
    loadSession,
    deleteSession,
    loadSessions,
    saveMessageToDB,
  };
}
