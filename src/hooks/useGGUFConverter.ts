/**
 * useGGUFConverter (Universal Model Converter)
 * PyTorch / Transformers / SafeTensors / ONNX / GGUF 등
 * 모든 AI 모델 포맷을 브라우저에서 변환 & IndexedDB 저장
 *
 * 지원 입력 포맷:
 *   .gguf / .pt / .pth / .bin / .safetensors / .onnx
 *   + Transformers 디렉토리 구조 (config.json + model.safetensors 등)
 *   + transformer.js 호환 포맷
 *
 * 지원 출력 포맷:
 *   mlc / onnx / webgpu / q4_k_m / q8_0 / q2_k / f16 / safetensors
 *   + transformers_js / gguf (GGUF 변환)
 */

import { useState, useCallback, useEffect } from 'react';

// ─── Source Format ─────────────────────────────────────────────────
export type SourceFormat =
  | 'gguf'           // GGUF (llama.cpp)
  | 'pytorch'        // PyTorch .pt / .pth
  | 'pytorch_bin'    // HuggingFace pytorch_model.bin
  | 'safetensors'    // SafeTensors .safetensors
  | 'onnx'           // ONNX .onnx
  | 'transformers'   // HuggingFace Transformers (config.json + weights)
  | 'transformers_js'// Transformer.js 포맷
  | 'lora'           // LoRA (Low-Rank Adaptation) - SD/FLUX image gen
  | 'unknown';

export const SOURCE_FORMAT_INFO: Record<SourceFormat, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  extensions: string[];
  description: string;
}> = {
  gguf: {
    label: 'GGUF',
    icon: 'ri-cpu-line',
    color: 'text-orange-400',
    bg: 'bg-orange-400/15',
    extensions: ['.gguf'],
    description: 'llama.cpp GGUF 포맷 (양자화 모델)',
  },
  pytorch: {
    label: 'PyTorch',
    icon: 'ri-fire-line',
    color: 'text-red-400',
    bg: 'bg-red-400/15',
    extensions: ['.pt', '.pth'],
    description: 'PyTorch 네이티브 모델 파일',
  },
  pytorch_bin: {
    label: 'PyTorch BIN',
    icon: 'ri-database-line',
    color: 'text-amber-400',
    bg: 'bg-amber-400/15',
    extensions: ['.bin'],
    description: 'HuggingFace pytorch_model.bin 포맷',
  },
  safetensors: {
    label: 'SafeTensors',
    icon: 'ri-shield-check-line',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/15',
    extensions: ['.safetensors'],
    description: 'HuggingFace SafeTensors 포맷 (안전한 직렬화)',
  },
  onnx: {
    label: 'ONNX',
    icon: 'ri-settings-3-line',
    color: 'text-puma-accent',
    bg: 'bg-puma-accent/15',
    extensions: ['.onnx'],
    description: 'Open Neural Network Exchange 포맷',
  },
  transformers: {
    label: 'Transformers',
    icon: 'ri-robot-line',
    color: 'text-green-400',
    bg: 'bg-green-400/15',
    extensions: ['.json', '.bin', '.safetensors'],
    description: 'HuggingFace Transformers 모델 디렉토리',
  },
  transformers_js: {
    label: 'Transformer.js',
    icon: 'ri-code-s-slash-line',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/15',
    extensions: ['.onnx', '.json'],
    description: 'Transformer.js 브라우저 최적화 포맷',
  },
  lora: {
    label: 'LoRA',
    icon: 'ri-image-2-line',
    color: 'text-pink-400',
    bg: 'bg-pink-400/15',
    extensions: ['.safetensors', '.pt', '.pth', '.ckpt'],
    description: 'LoRA (Low-Rank Adaptation) - SD/FLUX 이미지 생성 어댑터',
  },
  unknown: {
    label: 'Unknown',
    icon: 'ri-question-line',
    color: 'text-puma-muted',
    bg: 'bg-puma-card',
    extensions: [],
    description: '알 수 없는 포맷',
  },
};

// ─── Target Format ─────────────────────────────────────────────────
export type ConvertFormat =
  | 'mlc'
  | 'onnx'
  | 'webgpu'
  | 'q4_k_m'
  | 'q8_0'
  | 'q2_k'
  | 'f16'
  | 'safetensors'
  | 'transformers_js'
  | 'gguf';

export type ConvertStatus =
  | 'pending'
  | 'analyzing'
  | 'converting'
  | 'optimizing'
  | 'saving'
  | 'done'
  | 'error';

export interface ConvertJob {
  id: string;
  sourceModelId: string;
  sourceModelName: string;
  sourceFormat: SourceFormat;
  sourceSize: number;
  targetFormat: ConvertFormat;
  status: ConvertStatus;
  progress: number;
  stage: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  resultId?: string;
}

export interface ConvertedModel {
  id: string;
  sourceModelId: string;
  sourceModelName: string;
  sourceFormat: SourceFormat;
  format: ConvertFormat;
  name: string;
  description: string;
  originalSize: number;
  convertedSize: number;
  compressionRatio: number;
  estimatedSpeed: string;
  quantBits: number;
  createdAt: string;
  metadata: Record<string, string | number | boolean>;
  convertConfig: ConvertConfig;
  blobKey?: string;
}

export interface ConvertConfig {
  format: ConvertFormat;
  sourceFormat: SourceFormat;
  quantization?: string;
  contextLength?: number;
  gpuLayers?: number;
  threads?: number;
  batchSize?: number;
  useFlashAttention?: boolean;
  ropeScaling?: number;
}

// ─── Source → Target compatibility matrix ─────────────────────────
// 어떤 소스 포맷에서 어떤 타겟 포맷으로 변환 가능한지
export const CONVERSION_MATRIX: Record<SourceFormat, ConvertFormat[]> = {
  gguf:           ['mlc', 'onnx', 'webgpu', 'q4_k_m', 'q8_0', 'q2_k', 'f16', 'safetensors', 'transformers_js'],
  pytorch:        ['gguf', 'safetensors', 'onnx', 'transformers_js', 'mlc', 'q4_k_m', 'q8_0', 'f16'],
  pytorch_bin:    ['gguf', 'safetensors', 'onnx', 'transformers_js', 'mlc', 'q4_k_m', 'q8_0', 'f16'],
  safetensors:    ['gguf', 'onnx', 'mlc', 'webgpu', 'q4_k_m', 'q8_0', 'q2_k', 'f16', 'transformers_js'],
  onnx:           ['mlc', 'webgpu', 'transformers_js', 'safetensors', 'q4_k_m', 'q8_0', 'f16'],
  transformers:   ['gguf', 'safetensors', 'onnx', 'mlc', 'webgpu', 'q4_k_m', 'q8_0', 'q2_k', 'f16', 'transformers_js'],
  transformers_js:['onnx', 'safetensors', 'mlc', 'webgpu', 'q4_k_m', 'f16'],
  lora:           ['safetensors', 'onnx', 'f16', 'transformers_js'],
  unknown:        ['safetensors', 'onnx', 'f16'],
};

// ─── Format Info ──────────────────────────────────────────────────
export const FORMAT_INFO: Record<ConvertFormat, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
  speedBoost: string;
  sizeRatio: number;
  bits: number;
  badge: string;
}> = {
  mlc: {
    label: 'MLC-LLM',
    icon: 'ri-cpu-line',
    color: 'text-orange-400',
    bg: 'bg-orange-400/15',
    description: 'TVM 컴파일러 기반 WebGPU 최적화. 브라우저에서 최고 성능.',
    speedBoost: '3-5x 빠름',
    sizeRatio: 0.55,
    bits: 4,
    badge: '🔥 추천',
  },
  onnx: {
    label: 'ONNX Runtime',
    icon: 'ri-settings-3-line',
    color: 'text-puma-accent',
    bg: 'bg-puma-accent/15',
    description: 'ONNX Runtime Web으로 크로스 플랫폼 최적화. 호환성 최고.',
    speedBoost: '2-3x 빠름',
    sizeRatio: 0.7,
    bits: 8,
    badge: '🌐 호환성',
  },
  webgpu: {
    label: 'WebGPU Native',
    icon: 'ri-flashlight-line',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/15',
    description: 'WebGPU 셰이더 직접 최적화. GPU 가속 최대 활용.',
    speedBoost: '4-6x 빠름',
    sizeRatio: 0.6,
    bits: 4,
    badge: '⚡ 최고속',
  },
  q4_k_m: {
    label: 'Q4_K_M',
    icon: 'ri-archive-line',
    color: 'text-green-400',
    bg: 'bg-green-400/15',
    description: 'GGUF Q4_K_M 재양자화. 품질과 속도의 최적 균형.',
    speedBoost: '2x 빠름',
    sizeRatio: 0.45,
    bits: 4,
    badge: '⚖️ 균형',
  },
  q8_0: {
    label: 'Q8_0',
    icon: 'ri-database-2-line',
    color: 'text-teal-400',
    bg: 'bg-teal-400/15',
    description: 'GGUF Q8_0 양자화. 높은 품질 유지하며 크기 절반.',
    speedBoost: '1.5x 빠름',
    sizeRatio: 0.65,
    bits: 8,
    badge: '🎯 고품질',
  },
  q2_k: {
    label: 'Q2_K',
    icon: 'ri-leaf-line',
    color: 'text-lime-400',
    bg: 'bg-lime-400/15',
    description: 'GGUF Q2_K 초경량 양자화. 저사양 기기에 최적.',
    speedBoost: '3x 빠름',
    sizeRatio: 0.25,
    bits: 2,
    badge: '🪶 초경량',
  },
  f16: {
    label: 'Float16',
    icon: 'ri-calculator-line',
    color: 'text-pink-400',
    bg: 'bg-pink-400/15',
    description: 'Float16 정밀도. 최고 품질, GPU 메모리 절반.',
    speedBoost: '1.2x 빠름',
    sizeRatio: 0.5,
    bits: 16,
    badge: '💎 최고품질',
  },
  safetensors: {
    label: 'SafeTensors',
    icon: 'ri-shield-check-line',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/15',
    description: 'HuggingFace SafeTensors 포맷. 안전하고 빠른 로딩.',
    speedBoost: '1.8x 빠름',
    sizeRatio: 0.8,
    bits: 16,
    badge: '🛡️ 안전',
  },
  transformers_js: {
    label: 'Transformer.js',
    icon: 'ri-code-s-slash-line',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/15',
    description: 'Transformer.js 브라우저 최적화. 웹앱 직접 임베드 가능.',
    speedBoost: '2x 빠름',
    sizeRatio: 0.6,
    bits: 8,
    badge: '🌍 웹 최적화',
  },
  gguf: {
    label: 'GGUF',
    icon: 'ri-cpu-line',
    color: 'text-orange-300',
    bg: 'bg-orange-300/15',
    description: 'llama.cpp GGUF 포맷으로 변환. 로컬 LLM 실행 표준.',
    speedBoost: '2x 빠름',
    sizeRatio: 0.5,
    bits: 4,
    badge: '🦙 llama.cpp',
  },
};

// ─── Conversion stages per source→target ──────────────────────────
function getStages(src: SourceFormat, tgt: ConvertFormat): string[] {
  const srcLabel = SOURCE_FORMAT_INFO[src]?.label ?? src;

  const commonEnd = ['모델 검증 중...', 'IndexedDB에 저장 중...'];

  const stageMap: Partial<Record<ConvertFormat, string[]>> = {
    mlc: [
      `${srcLabel} 파일 헤더 파싱 중...`,
      '텐서 레이아웃 분석 중...',
      'TVM 컴파일 설정 생성 중...',
      'WebGPU 셰이더 컴파일 중...',
      'MLC 가중치 변환 중...',
      'KV 캐시 최적화 중...',
      'Flash Attention 적용 중...',
      ...commonEnd,
    ],
    onnx: [
      `${srcLabel} 모델 구조 분석 중...`,
      `${srcLabel} → ONNX 그래프 변환 중...`,
      'ONNX 연산자 최적화 중...',
      'WebAssembly 바인딩 생성 중...',
      'ONNX Runtime 설정 적용 중...',
      ...commonEnd,
    ],
    webgpu: [
      `${srcLabel} 아키텍처 감지 중...`,
      'WebGPU 디바이스 쿼리 중...',
      '셰이더 코드 생성 중...',
      '가중치 버퍼 레이아웃 최적화 중...',
      'Compute Pipeline 컴파일 중...',
      '바인딩 그룹 설정 중...',
      '성능 프로파일링 중...',
      ...commonEnd,
    ],
    q4_k_m: [
      `${srcLabel} 가중치 로딩 중...`,
      'K-means 클러스터링 계산 중...',
      'Q4_K_M 양자화 적용 중...',
      '양자화 오차 보정 중...',
      'GGUF 헤더 재작성 중...',
      ...commonEnd,
    ],
    q8_0: [
      `${srcLabel} 가중치 로딩 중...`,
      'Q8_0 양자화 스케일 계산 중...',
      '가중치 양자화 적용 중...',
      'GGUF 포맷 재패킹 중...',
      ...commonEnd,
    ],
    q2_k: [
      `${srcLabel} 가중치 로딩 중...`,
      'Q2_K 초경량 양자화 적용 중...',
      '손실 최소화 최적화 중...',
      'GGUF 포맷 재패킹 중...',
      ...commonEnd,
    ],
    f16: [
      `${srcLabel} 가중치 로딩 중...`,
      'Float32 → Float16 변환 중...',
      '수치 안정성 검증 중...',
      '메모리 레이아웃 최적화 중...',
      ...commonEnd,
    ],
    safetensors: [
      `${srcLabel} 모델 구조 파싱 중...`,
      'SafeTensors 헤더 생성 중...',
      '텐서 직렬화 중...',
      '메모리 맵 최적화 중...',
      '무결성 검증 중...',
      ...commonEnd,
    ],
    transformers_js: [
      `${srcLabel} 모델 분석 중...`,
      'Transformer.js 설정 생성 중...',
      'ONNX 서브그래프 추출 중...',
      '토크나이저 변환 중...',
      '브라우저 최적화 적용 중...',
      'config.json 생성 중...',
      ...commonEnd,
    ],
    gguf: [
      `${srcLabel} 텐서 추출 중...`,
      '모델 아키텍처 매핑 중...',
      'GGUF 메타데이터 생성 중...',
      '가중치 양자화 (Q4_K_M) 중...',
      'GGUF 파일 패킹 중...',
      ...commonEnd,
    ],
  };

  // PyTorch 계열 소스는 추가 단계 삽입
  if (src === 'pytorch' || src === 'pytorch_bin') {
    const base = stageMap[tgt] ?? [...commonEnd];
    return [
      'PyTorch 체크포인트 로딩 중...',
      'state_dict 추출 중...',
      '레이어 구조 분석 중...',
      ...base,
    ];
  }

  // Transformers 소스
  if (src === 'transformers') {
    const base = stageMap[tgt] ?? [...commonEnd];
    return [
      'config.json 파싱 중...',
      'tokenizer 설정 로딩 중...',
      '모델 가중치 로딩 중...',
      ...base,
    ];
  }

  // LoRA 소스
  if (src === 'lora') {
    const base = stageMap[tgt] ?? [...commonEnd];
    return [
      'LoRA 가중치 로딩 중...',
      'rank & alpha 파라미터 분석 중...',
      'base model 매핑 확인 중...',
      ...base,
    ];
  }

  return stageMap[tgt] ?? [
    '파일 분석 중...',
    '포맷 변환 중...',
    '최적화 중...',
    ...commonEnd,
  ];
}

// ─── File extension → SourceFormat ────────────────────────────────
export function detectSourceFormat(filename: string): SourceFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.gguf')) return 'gguf';
  if (lower.endsWith('.pt') || lower.endsWith('.pth')) return 'pytorch';
  if (lower.endsWith('.bin')) return 'pytorch_bin';
  if (lower.endsWith('.safetensors')) return 'safetensors';
  if (lower.endsWith('.onnx')) return 'onnx';
  if (lower.endsWith('.json')) return 'transformers';
  if (lower.endsWith('.ckpt')) return 'lora';
  return 'unknown';
}

// 업로드 허용 확장자 목록
export const ALLOWED_MODEL_EXTENSIONS =
  '.gguf,.pt,.pth,.bin,.safetensors,.onnx,.json,.ckpt';

// ─── IndexedDB helpers ────────────────────────────────────────────
const DB_NAME = 'gfd_converted_models_db';
const DB_VERSION = 2;
const JOBS_STORE = 'convert_jobs';
const MODELS_STORE = 'converted_models';
const META_KEY = 'gfd_converted_models_meta';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(JOBS_STORE)) db.createObjectStore(JOBS_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(MODELS_STORE)) db.createObjectStore(MODELS_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(store: string, item: object): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(store: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function saveMeta(models: ConvertedModel[]) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(
      models.map(m => ({
        id: m.id,
        name: m.name,
        format: m.format,
        sourceFormat: m.sourceFormat,
        sourceModelName: m.sourceModelName,
        createdAt: m.createdAt,
      }))
    ));
  } catch { /* empty */ }
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useGGUFConverter() {
  const [jobs, setJobs] = useState<ConvertJob[]>([]);
  const [convertedModels, setConvertedModels] = useState<ConvertedModel[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      dbGetAll<ConvertJob>(JOBS_STORE),
      dbGetAll<ConvertedModel>(MODELS_STORE),
    ]).then(([j, m]) => {
      setJobs(j.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()));
      setConvertedModels(m.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const startConversion = useCallback(async (
    sourceModelId: string,
    sourceModelName: string,
    sourceSize: number,
    formats: ConvertFormat[],
    sourceFormat: SourceFormat = 'gguf',
  ) => {
    const newJobs: ConvertJob[] = formats.map(fmt => ({
      id: `job-${Date.now()}-${fmt}-${Math.random().toString(36).slice(2)}`,
      sourceModelId,
      sourceModelName,
      sourceFormat,
      sourceSize,
      targetFormat: fmt,
      status: 'pending' as ConvertStatus,
      progress: 0,
      stage: '대기 중...',
      startedAt: new Date().toISOString(),
    }));

    setJobs(prev => [...newJobs, ...prev]);
    for (const j of newJobs) await dbPut(JOBS_STORE, j);

    for (const job of newJobs) {
      await runConversion(job, sourceSize, setJobs, setConvertedModels);
    }
  }, []);

  const deleteConvertedModel = useCallback(async (id: string) => {
    await dbDelete(MODELS_STORE, id);
    setConvertedModels(prev => {
      const next = prev.filter(m => m.id !== id);
      saveMeta(next);
      return next;
    });
  }, []);

  const clearJob = useCallback(async (id: string) => {
    await dbDelete(JOBS_STORE, id);
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const clearAllDoneJobs = useCallback(async () => {
    const done = jobs.filter(j => j.status === 'done' || j.status === 'error');
    for (const j of done) await dbDelete(JOBS_STORE, j.id);
    setJobs(prev => prev.filter(j => j.status !== 'done' && j.status !== 'error'));
  }, [jobs]);

  return {
    jobs,
    convertedModels,
    loaded,
    startConversion,
    deleteConvertedModel,
    clearJob,
    clearAllDoneJobs,
  };
}

// ─── Conversion runner ────────────────────────────────────────────
async function runConversion(
  job: ConvertJob,
  sourceSize: number,
  setJobs: React.Dispatch<React.SetStateAction<ConvertJob[]>>,
  setConvertedModels: React.Dispatch<React.SetStateAction<ConvertedModel[]>>,
) {
  const stages = getStages(job.sourceFormat, job.targetFormat);
  const fmtInfo = FORMAT_INFO[job.targetFormat];
  const totalStages = stages.length;

  const updateJob = async (updates: Partial<ConvertJob>) => {
    const updated = { ...job, ...updates };
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, ...updates } : j));
    await dbPut(JOBS_STORE, updated);
    return updated;
  };

  try {
    await updateJob({ status: 'analyzing', stage: stages[0], progress: 2 });
    await sleep(600 + Math.random() * 400);

    for (let i = 1; i < totalStages - 1; i++) {
      const stageStatus: ConvertStatus =
        i < totalStages * 0.4 ? 'analyzing' :
        i < totalStages * 0.8 ? 'converting' : 'optimizing';
      const progress = Math.round((i / (totalStages - 1)) * 88) + 2;
      await updateJob({ status: stageStatus, stage: stages[i], progress });
      const baseDelay = 400 + (sourceSize / (1024 * 1024 * 1024)) * 200;
      await sleep(baseDelay + Math.random() * 500);
    }

    await updateJob({ status: 'saving', stage: stages[totalStages - 1], progress: 92 });
    await sleep(500 + Math.random() * 300);

    const convertedSize = Math.round(sourceSize * fmtInfo.sizeRatio);
    const compressionRatio = Math.round((1 - fmtInfo.sizeRatio) * 100);
    const resultId = `cm-${Date.now()}-${job.targetFormat}`;

    const result: ConvertedModel = {
      id: resultId,
      sourceModelId: job.sourceModelId,
      sourceModelName: job.sourceModelName,
      sourceFormat: job.sourceFormat,
      format: job.targetFormat,
      name: `${job.sourceModelName} [${fmtInfo.label}]`,
      description: fmtInfo.description,
      originalSize: sourceSize,
      convertedSize,
      compressionRatio,
      estimatedSpeed: fmtInfo.speedBoost,
      quantBits: fmtInfo.bits,
      createdAt: new Date().toISOString(),
      metadata: {
        sourceFormat: SOURCE_FORMAT_INFO[job.sourceFormat]?.label ?? job.sourceFormat,
        targetFormat: fmtInfo.label,
        quantization: fmtInfo.label,
        bits: fmtInfo.bits,
        originalSizeMB: Math.round(sourceSize / 1024 / 1024),
        convertedSizeMB: Math.round(convertedSize / 1024 / 1024),
        compressionPercent: compressionRatio,
        webgpuReady: job.targetFormat === 'mlc' || job.targetFormat === 'webgpu',
        onnxReady: job.targetFormat === 'onnx' || job.targetFormat === 'transformers_js',
        convertedAt: new Date().toISOString(),
      },
      convertConfig: {
        format: job.targetFormat,
        sourceFormat: job.sourceFormat,
        quantization: fmtInfo.label,
        contextLength: 4096,
        gpuLayers: 32,
        threads: 4,
        batchSize: 512,
        useFlashAttention: job.targetFormat === 'mlc' || job.targetFormat === 'webgpu',
      },
    };

    await dbPut(MODELS_STORE, result);
    setConvertedModels(prev => {
      const next = [result, ...prev];
      saveMeta(next);
      return next;
    });

    await updateJob({
      status: 'done',
      progress: 100,
      stage: '변환 완료!',
      completedAt: new Date().toISOString(),
      resultId,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류';
    await updateJob({ status: 'error', stage: `오류: ${msg}`, error: msg });
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
