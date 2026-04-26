export type EngineType = 'webllm' | 'gguf' | 'onnx' | 'custom';

export type EngineStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'generating'
  | 'error';

export interface ModelInfo {
  id: string;
  name: string;
  engine: EngineType;
  size?: string;
  description?: string;
  url?: string;
  quantization?: string;
  contextLength?: number;
  license?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokenCount?: number;
  engine?: EngineType;
  model?: string;
}

export interface EngineState {
  type: EngineType | null;
  status: EngineStatus;
  modelId: string | null;
  loadProgress: number;
  loadMessage: string;
  error: string | null;
  tokensPerSecond: number;
  totalTokens: number;
  webgpuSupported: boolean;
  wasmSupported: boolean;
}

export interface GenerationConfig {
  temperature: number;
  top_p: number;
  max_tokens: number;
  repetition_penalty: number;
  stop_sequences: string[];
  stream: boolean;
  system_prompt: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  embedding?: number[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  chunks?: DocumentChunk[];
  storagePath?: string;
}

export interface PlaygroundPreset {
  name: string;
  system_prompt: string;
  temperature: number;
  description: string;
}
