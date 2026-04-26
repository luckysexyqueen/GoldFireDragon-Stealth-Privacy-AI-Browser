import { useCallback, useRef } from 'react';
import { ChatMessage, GenerationConfig } from '@/types/engine';

type ProgressCallback = (progress: number, message: string) => void;
type TokenCallback = (token: string, done: boolean, tps?: number) => void;
type ErrorCallback = (error: string) => void;

export function useONNX() {
  const engineRef = useRef<unknown>(null);
  const abortRef = useRef<boolean>(false);

  const loadModel = useCallback(async (
    modelId: string,
    onProgress: ProgressCallback,
    onError: ErrorCallback
  ) => {
    try {
      onProgress(5, 'Transformers.js 로딩 중...');

      const { pipeline, env } = await import('@xenova/transformers');

      // Use ONNX Web backend
      env.allowRemoteModels = true;
      env.useBrowserCache = true;

      onProgress(15, 'ONNX 파이프라인 초기화 중...');

      const generator = await pipeline('text-generation', modelId, {
        progress_callback: (info: { status: string; file?: string; progress?: number; loaded?: number; total?: number }) => {
          if (info.status === 'downloading') {
            const pct = info.progress ? Math.round(info.progress * 0.8 + 15) : 50;
            const file = info.file || '';
            const loaded = info.loaded ? (info.loaded / 1024 / 1024).toFixed(1) : '0';
            const total = info.total ? (info.total / 1024 / 1024).toFixed(1) : '?';
            onProgress(pct, `${file}: ${loaded}MB / ${total}MB`);
          } else if (info.status === 'loading') {
            onProgress(90, 'ONNX 모델 로딩 중...');
          }
        },
      });

      engineRef.current = generator;
      onProgress(100, 'ONNX 모델 준비 완료!');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onError(`ONNX 로드 실패: ${msg}`);
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
      onError('ONNX 엔진이 초기화되지 않았습니다.');
      return;
    }

    abortRef.current = false;

    try {
      const generator = engineRef.current as (prompt: string, options: Record<string, unknown>) => Promise<Array<{ generated_text: string }>>;

      // Build prompt
      let prompt = '';
      if (config.system_prompt) {
        prompt += `System: ${config.system_prompt}\n\n`;
      }
      messages.forEach(m => {
        if (m.role === 'user') prompt += `Human: ${m.content}\n`;
        else if (m.role === 'assistant') prompt += `Assistant: ${m.content}\n`;
      });
      prompt += 'Assistant: ';

      const startTime = Date.now();

      const result = await generator(prompt, {
        max_new_tokens: config.max_tokens,
        temperature: config.temperature,
        top_p: config.top_p,
        do_sample: config.temperature > 0,
        repetition_penalty: config.repetition_penalty,
      });

      const generatedText = result[0]?.generated_text ?? '';
      const newText = generatedText.startsWith(prompt)
        ? generatedText.slice(prompt.length)
        : generatedText;

      const elapsed = (Date.now() - startTime) / 1000;
      const words = newText.split(' ').length;
      const estimatedTPS = elapsed > 0 ? Math.round(words * 1.3 / elapsed) : 0;

      onToken(newText, false, estimatedTPS);
      onToken('', true, 0);
    } catch (err: unknown) {
      if (abortRef.current) {
        onToken('', true, 0);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      onError(`ONNX 생성 오류: ${msg}`);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const unload = useCallback(async () => {
    if (engineRef.current) {
      engineRef.current = null;
    }
  }, []);

  return { loadModel, generate, abort, unload, engineRef };
}
