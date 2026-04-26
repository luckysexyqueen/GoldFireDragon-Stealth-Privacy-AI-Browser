import { ModelInfo } from '@/types/engine';

export const WEBLLM_MODELS: ModelInfo[] = [
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 3B Instruct',
    engine: 'webllm',
    size: '1.9 GB',
    description: 'Meta Llama 3.2 — 빠른 추론, 다목적',
    quantization: 'q4f16',
    contextLength: 131072,
    license: 'Meta Llama License',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
    name: 'Llama 3.1 8B Instruct',
    engine: 'webllm',
    size: '4.9 GB',
    description: 'Meta Llama 3.1 8B — 고성능 명령 수행',
    quantization: 'q4f32',
    contextLength: 131072,
    license: 'Meta Llama License',
  },
  {
    id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
    name: 'Mistral 7B Instruct v0.3',
    engine: 'webllm',
    size: '4.1 GB',
    description: 'Mistral AI — 유럽산 강력 7B 모델',
    quantization: 'q4f16',
    contextLength: 32768,
    license: 'Apache 2.0',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi-3.5 Mini Instruct',
    engine: 'webllm',
    size: '2.4 GB',
    description: 'Microsoft Phi-3.5 — 소형 고효율',
    quantization: 'q4f16',
    contextLength: 128000,
    license: 'MIT',
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    name: 'Gemma 2 2B IT',
    engine: 'webllm',
    size: '1.5 GB',
    description: 'Google Gemma 2 — 경량 최적화',
    quantization: 'q4f16',
    contextLength: 8192,
    license: 'Gemma ToS',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B Instruct',
    engine: 'webllm',
    size: '4.5 GB',
    description: 'Alibaba Qwen 2.5 — 다국어 강력 지원',
    quantization: 'q4f16',
    contextLength: 131072,
    license: 'Apache 2.0',
  },
  {
    id: 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC',
    name: 'DeepSeek-R1 7B (Distill)',
    engine: 'webllm',
    size: '4.3 GB',
    description: 'DeepSeek R1 추론 특화 경량 증류 버전',
    quantization: 'q4f16',
    contextLength: 32768,
    license: 'MIT',
  },
  {
    id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
    name: 'TinyLlama 1.1B Chat',
    engine: 'webllm',
    size: '0.7 GB',
    description: '초경량 — 저사양 기기 최적',
    quantization: 'q4f16',
    contextLength: 2048,
    license: 'Apache 2.0',
  },
];

export const GGUF_PRESET_MODELS: ModelInfo[] = [
  {
    id: 'llama-3.2-3b-instruct.gguf',
    name: 'Llama 3.2 3B (GGUF Q4_K_M)',
    engine: 'gguf',
    size: '2.0 GB',
    description: 'llama.cpp WASM 기반, 완전 오프라인',
    quantization: 'Q4_K_M',
    url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    license: 'Meta Llama License',
  },
  {
    id: 'phi-3.5-mini.gguf',
    name: 'Phi-3.5 Mini (GGUF Q4_K_M)',
    engine: 'gguf',
    size: '2.2 GB',
    description: 'Microsoft Phi-3.5 Mini GGUF',
    quantization: 'Q4_K_M',
    url: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
    license: 'MIT',
  },
  {
    id: 'mistral-7b-instruct.gguf',
    name: 'Mistral 7B Instruct (GGUF Q4_K_M)',
    engine: 'gguf',
    size: '4.4 GB',
    description: 'Mistral 7B GGUF 양자화',
    quantization: 'Q4_K_M',
    url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
    license: 'Apache 2.0',
  },
];

export const ONNX_PRESET_MODELS: ModelInfo[] = [
  {
    id: 'phi-3-mini-4k-instruct',
    name: 'Phi-3 Mini 4K (ONNX)',
    engine: 'onnx',
    size: '2.3 GB',
    description: 'ONNX Runtime Web — CPU/GPU 범용',
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx-web',
    license: 'MIT',
  },
  {
    id: 'phi-3.5-mini-instruct',
    name: 'Phi-3.5 Mini (ONNX)',
    engine: 'onnx',
    size: '2.4 GB',
    description: 'Microsoft Phi-3.5 ONNX Web 버전',
    url: 'https://huggingface.co/microsoft/Phi-3.5-mini-instruct-onnx-web',
    license: 'MIT',
  },
];

export const ALL_PRESET_MODELS: ModelInfo[] = [
  ...WEBLLM_MODELS,
  ...GGUF_PRESET_MODELS,
  ...ONNX_PRESET_MODELS,
];

export const ENGINE_LABELS: Record<string, string> = {
  webllm: 'WebLLM',
  gguf: 'GGUF',
  onnx: 'ONNX',
  custom: 'Custom',
};

export const ENGINE_DESCRIPTIONS: Record<string, string> = {
  webllm: 'WebGPU 가속 — 브라우저 네이티브 GPU 추론 (Chrome 113+)',
  gguf: 'llama.cpp WASM — CPU GGUF 양자화 모델 실행',
  onnx: 'ONNX Runtime Web — CPU/GPU 범용 최적화 추론',
  custom: '사용자 지정 모델 URL — HuggingFace / 직접 링크',
};
