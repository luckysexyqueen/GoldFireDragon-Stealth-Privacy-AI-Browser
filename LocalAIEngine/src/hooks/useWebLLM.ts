import { useCallback, useRef } from 'react';
import { ChatMessage, GenerationConfig } from '@/types/engine';

type ProgressCallback = (progress: number, message: string) => void;
type TokenCallback = (token: string, done: boolean, tps?: number) => void;
type ErrorCallback = (error: string) => void;

export function useWebLLM() {
  const engineRef = useRef<unknown>(null);
  const abortRef = useRef<boolean>(false);

  const loadModel = useCallback(async (
    modelId: string,
    onProgress: ProgressCallback,
    onError: ErrorCallback
  ) => {
    try {
      onProgress(5, 'WebLLM 라이브러리 로딩 중...');
      const webllm = await import('@mlc-ai/web-llm');

      onProgress(10, 'WebGPU 엔진 초기화 중...');

      const engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (report: { progress: number; text: string }) => {
          const pct = Math.round(report.progress * 90) + 10;
          onProgress(pct, report.text || `다운로드 중... ${Math.round(report.progress * 100)}%`);
        },
        logLevel: 'SILENT',
      });

      engineRef.current = engine;
      onProgress(100, '모델 준비 완료!');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onError(`WebLLM 로드 실패: ${msg}`);
      return false;
    }
  }, []);

  const generate = useCallback(async (
    messages: ChatMessage[],
    config: GenerationConfig,
    onToken: TokenCallback,
    onError: ErrorCallback
  ) => {
    if (!engineRef.current) {
      onError('엔진이 초기화되지 않았습니다.');
      return;
    }

    abortRef.current = false;
    const startTime = Date.now();
    let tokenCount = 0;

    try {
      const webllm = await import('@mlc-ai/web-llm');
      const engine = engineRef.current as InstanceType<typeof webllm.MLCEngine>;

      const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

      if (config.system_prompt) {
        apiMessages.push({ role: 'system', content: config.system_prompt });
      }

      messages.forEach(m => {
        if (m.role === 'user' || m.role === 'assistant') {
          apiMessages.push({ role: m.role, content: m.content });
        }
      });

      if (config.stream) {
        const stream = await engine.chat.completions.create({
          messages: apiMessages,
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
          stream: true,
        });

        for await (const chunk of stream) {
          if (abortRef.current) break;
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) {
            tokenCount++;
            const elapsed = (Date.now() - startTime) / 1000;
            const tps = elapsed > 0 ? tokenCount / elapsed : 0;
            onToken(delta, false, tps);
          }
        }
      } else {
        const resp = await engine.chat.completions.create({
          messages: apiMessages,
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
          stream: false,
        });
        const content = resp.choices[0]?.message?.content ?? '';
        onToken(content, false, 0);
      }

      onToken('', true, 0);
    } catch (err: unknown) {
      if (abortRef.current) {
        onToken('', true, 0);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      onError(`생성 오류: ${msg}`);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const unload = useCallback(async () => {
    if (engineRef.current) {
      try {
        const webllm = await import('@mlc-ai/web-llm');
        const engine = engineRef.current as InstanceType<typeof webllm.MLCEngine>;
        await engine.unload();
      } catch {
        // ignore
      }
      engineRef.current = null;
    }
  }, []);

  return { loadModel, generate, abort, unload, engineRef };
}
