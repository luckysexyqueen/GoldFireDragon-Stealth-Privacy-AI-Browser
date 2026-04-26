/**
 * useFreeAI - 실제 무료 AI 서비스 API 호출 훅
 * Groq / Google Gemini / Ollama / OpenRouter / Cohere 지원
 */

export interface FreeAIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FreeAIConfig {
  serviceId: string;
  apiKey: string;
  model: string;
  systemPrompt?: string;
}

function loadServiceConfig(id: string): { apiKey: string; activeModel: string; enabled: boolean } | null {
  try {
    const raw = localStorage.getItem(`gfd_freeai_${id}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

// ─── Groq ──────────────────────────────────────────────────────────
async function callGroq(
  messages: FreeAIChatMessage[],
  model: string,
  apiKey: string,
  onChunk: (text: string, done: boolean) => void
): Promise<void> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages,
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API 오류 (${response.status}): ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('스트림을 읽을 수 없습니다');

  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        onChunk(accumulated, true);
        return;
      }
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        if (delta) {
          accumulated += delta;
          onChunk(accumulated, false);
        }
      } catch { /* skip malformed */ }
    }
  }
  onChunk(accumulated, true);
}

// ─── Google Gemini ──────────────────────────────────────────────────
async function callGemini(
  messages: FreeAIChatMessage[],
  model: string,
  apiKey: string,
  onChunk: (text: string, done: boolean) => void
): Promise<void> {
  // Convert messages to Gemini format
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const geminiModel = model || 'gemini-2.0-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API 오류 (${response.status}): ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('스트림을 읽을 수 없습니다');

  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          accumulated += text;
          onChunk(accumulated, false);
        }
      } catch { /* skip */ }
    }
  }
  onChunk(accumulated, true);
}

// ─── Ollama ──────────────────────────────────────────────────────────
async function callOllama(
  messages: FreeAIChatMessage[],
  model: string,
  baseUrl: string,
  onChunk: (text: string, done: boolean) => void
): Promise<void> {
  const url = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');

  const response = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3.2',
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama 오류 (${response.status}): ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('스트림을 읽을 수 없습니다');

  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const content = parsed.message?.content || '';
        if (content) {
          accumulated += content;
          onChunk(accumulated, false);
        }
        if (parsed.done) {
          onChunk(accumulated, true);
          return;
        }
      } catch { /* skip */ }
    }
  }
  onChunk(accumulated, true);
}

// ─── OpenRouter ────────────────────────────────────────────────────
async function callOpenRouter(
  messages: FreeAIChatMessage[],
  model: string,
  apiKey: string,
  onChunk: (text: string, done: boolean) => void
): Promise<void> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://goldfiredragon.browser',
      'X-Title': 'GoldFireDragon Browser',
    },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.3-70b-instruct',
      messages,
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter 오류 (${response.status}): ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('스트림을 읽을 수 없습니다');

  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        onChunk(accumulated, true);
        return;
      }
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        if (delta) {
          accumulated += delta;
          onChunk(accumulated, false);
        }
      } catch { /* skip */ }
    }
  }
  onChunk(accumulated, true);
}

// ─── Cohere ────────────────────────────────────────────────────────
async function callCohere(
  messages: FreeAIChatMessage[],
  model: string,
  apiKey: string,
  onChunk: (text: string, done: boolean) => void
): Promise<void> {
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const chatHistory = messages
    .filter(m => m.role !== 'system')
    .slice(0, -1)
    .map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content,
    }));
  const lastUser = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'command-r',
      message: lastUser,
      chat_history: chatHistory,
      preamble: systemMsg || undefined,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cohere 오류 (${response.status}): ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('스트림을 읽을 수 없습니다');

  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.event_type === 'text-generation' && parsed.text) {
          accumulated += parsed.text;
          onChunk(accumulated, false);
        }
        if (parsed.event_type === 'stream-end') {
          onChunk(accumulated, true);
          return;
        }
      } catch { /* skip */ }
    }
  }
  onChunk(accumulated, true);
}

// ─── 메인 스트리밍 함수 ────────────────────────────────────────────
export async function streamFreeAIResponse(
  serviceId: string,
  messages: FreeAIChatMessage[],
  onChunk: (text: string, done: boolean) => void
): Promise<void> {
  const config = loadServiceConfig(serviceId);
  if (!config || !config.apiKey?.trim()) {
    throw new Error(`${serviceId} API 키가 설정되지 않았습니다. Settings > AI Assistant > Free AI Services에서 설정해주세요.`);
  }
  if (!config.enabled) {
    throw new Error(`${serviceId} 서비스가 비활성화되어 있습니다.`);
  }

  const { apiKey, activeModel } = config;

  switch (serviceId) {
    case 'groq':
      return callGroq(messages, activeModel, apiKey, onChunk);
    case 'gemini':
      return callGemini(messages, activeModel, apiKey, onChunk);
    case 'ollama':
      return callOllama(messages, activeModel, apiKey, onChunk);
    case 'openrouter':
      return callOpenRouter(messages, activeModel, apiKey, onChunk);
    case 'cohere':
      return callCohere(messages, activeModel, apiKey, onChunk);
    default:
      throw new Error(`알 수 없는 서비스: ${serviceId}`);
  }
}

// ─── AI Tools용 단일 응답 함수 (non-streaming) ────────────────────
export async function callFreeAISingle(
  serviceId: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let result = '';
    streamFreeAIResponse(
      serviceId,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      (text, done) => {
        result = text;
        if (done) resolve(result);
      }
    ).catch(reject);
  });
}

// ─── 사용 가능한 서비스 가져오기 ──────────────────────────────────
export function getAvailableFreeAIService(): string | null {
  const services = ['groq', 'gemini', 'ollama', 'openrouter', 'cohere'];
  for (const id of services) {
    const config = loadServiceConfig(id);
    if (config?.enabled && config?.apiKey?.trim()) return id;
  }
  return null;
}
