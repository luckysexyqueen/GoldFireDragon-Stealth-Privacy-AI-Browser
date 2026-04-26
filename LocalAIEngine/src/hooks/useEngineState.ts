import { useState, useCallback, useRef } from 'react';
import { EngineState, EngineType } from '@/types/engine';

const initialState: EngineState = {
  type: null,
  status: 'idle',
  modelId: null,
  loadProgress: 0,
  loadMessage: '',
  error: null,
  tokensPerSecond: 0,
  totalTokens: 0,
  webgpuSupported: false,
  wasmSupported: false,
};

export function useEngineState() {
  const [state, setState] = useState<EngineState>(initialState);
  const engineRef = useRef<unknown>(null);

  const setStatus = useCallback((status: EngineState['status']) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const setProgress = useCallback((progress: number, message: string) => {
    setState(prev => ({ ...prev, loadProgress: progress, loadMessage: message }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, status: 'error', error }));
  }, []);

  const setReady = useCallback((type: EngineType, modelId: string) => {
    setState(prev => ({
      ...prev,
      type,
      modelId,
      status: 'ready',
      loadProgress: 100,
      loadMessage: '모델 로드 완료',
      error: null,
    }));
  }, []);

  const updateTPS = useCallback((tps: number, totalTokens: number) => {
    setState(prev => ({ ...prev, tokensPerSecond: tps, totalTokens }));
  }, []);

  const checkCapabilities = useCallback(async () => {
    const webgpuSupported = 'gpu' in navigator;
    const wasmSupported = typeof WebAssembly === 'object';
    setState(prev => ({ ...prev, webgpuSupported, wasmSupported }));
    return { webgpuSupported, wasmSupported };
  }, []);

  const reset = useCallback(() => {
    engineRef.current = null;
    setState(initialState);
  }, []);

  return {
    state,
    engineRef,
    setStatus,
    setProgress,
    setError,
    setReady,
    updateTPS,
    checkCapabilities,
    reset,
  };
}
