import { useCallback, useRef } from 'react';
import { ChatMessage, GenerationConfig } from '@/types/engine';

type ProgressCallback = (progress: number, message: string) => void;
type TokenCallback = (token: string, done: boolean, tps?: number) => void;
type ErrorCallback = (error: string) => void;

// llama.cpp WASM via wllama
export function useGGUF() {
  const engineRef = useRef<unknown>(null);
  const abortRef = useRef<boolean>(false);

  const loadModel = useCallback(async (
    modelUrl: string,
    onProgress: ProgressCallback,
    onError: ErrorCallback
  ) => {
    try {
      onProgress(5, 'wllama (llama.cpp WASM) 로딩 중...');

      const { Wllama } = await import('@wllama/wllama');

      onProgress(15, 'WASM 모듈 초기화 중...');

      const wllama = new Wllama({
        'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@latest/esm/single-thread/wllama.wasm',
        'multi-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@latest/esm/multi-thread/wllama.wasm',
        'single-thread/wllama.worker.mjs': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@latest/esm/single-thread/wllama.worker.mjs',
        'multi-thread/wllama.worker.mjs': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@latest/esm/multi-thread/wllama.worker.mjs',
      });

      onProgress(20, `GGUF 모델 다운로드 중: ${modelUrl}`);

      await wllama.loadModelFromUrl(modelUrl, {
        progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
          const pct = total > 0 ? Math.round((loaded / total) * 70) + 20 : 50;
          const loadedMB = (loaded / 1024 / 1024).toFixed(1);
          const totalMB = total > 0 ? (total / 1024 / 1024).toFixed(1) : '?';
          onProgress(pct, `다운로드 중: ${loadedMB}MB / ${totalMB}MB`);
        },
      });

      engineRef.current = wllama;
      onProgress(100, 'GGUF 모델 준비 완료!');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onError(`GGUF 로드 실패: ${msg}`);
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
      onError('GGUF 엔진이 초기화되지 않았습니다.');
      return;
    }

    abortRef.current = false;
    const startTime = Date.now();
    let tokenCount = 0;

    try {
      const { Wllama } = await import('@wllama/wllama');
      const wllama = engineRef.current as InstanceType<typeof Wllama>;

      // Build prompt from messages
      let prompt = '';
      if (config.system_prompt) {
        prompt += `<|system|>\n${config.system_prompt}</s>\n`;
      }
      messages.forEach(m => {
        if (m.role === 'user') {
          prompt += `<|user|>\n${m.content}</s>\n`;
        } else if (m.role === 'assistant') {
          prompt += `<|assistant|>\n${m.content}</s>\n`;
        }
      });
      prompt += '<|assistant|>\n';

      const result = await wllama.createCompletion(prompt, {
        nPredict: config.max_tokens,
        temperature: config.temperature,
        topP: config.top_p,
        sampling: {
          temp: config.temperature,
          top_p: config.top_p,
        },
        onNewToken: (_token: unknown, _piece: unknown, currentText: string) => {
          if (abortRef.current) return;
          const lastChar = currentText.slice(-1);
          tokenCount++;
          const elapsed = (Date.now() - startTime) / 1000;
          const tps = elapsed > 0 ? tokenCount / elapsed : 0;
          onToken(lastChar, false, tps);
        },
      });

      console.log('[GGUF] Generation complete, total tokens:', result.length);
      onToken('', true, 0);
    } catch (err: unknown) {
      if (abortRef.current) {
        onToken('', true, 0);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      onError(`GGUF 생성 오류: ${msg}`);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const unload = useCallback(async () => {
    if (engineRef.current) {
      try {
        const { Wllama } = await import('@wllama/wllama');
        const wllama = engineRef.current as InstanceType<typeof Wllama>;
        await wllama.exit();
      } catch {
        // ignore
      }
      engineRef.current = null;
    }
  }, []);

  return { loadModel, generate, abort, unload, engineRef };
}
