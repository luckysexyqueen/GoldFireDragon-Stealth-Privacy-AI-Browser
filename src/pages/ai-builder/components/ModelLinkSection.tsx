interface ModelOption {
  id: string;
  name: string;
  size: string;
  type: 'local' | 'free';
  service?: string;
}

interface Props {
  linkedModelId: string;
  linkedModelName: string;
  onChange: (id: string, name: string) => void;
}

const builtinModels: ModelOption[] = [
  { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', size: '0.7 GB', type: 'local' },
  { id: 'llama-3.2-3b', name: 'Llama 3.2 3B', size: '1.9 GB', type: 'local' },
  { id: 'gemma-2-2b', name: 'Gemma 2 2B', size: '1.5 GB', type: 'local' },
  { id: 'qwen2.5-1.5b', name: 'Qwen 2.5 1.5B', size: '1.0 GB', type: 'local' },
  { id: 'phi-3.5-mini', name: 'Phi 3.5 Mini', size: '2.2 GB', type: 'local' },
  { id: 'mistral-7b', name: 'Mistral 7B', size: '4.1 GB', type: 'local' },
];

const freeServices = [
  { id: 'groq', name: 'Groq', key: 'groq' },
  { id: 'gemini', name: 'Google Gemini', key: 'gemini' },
  { id: 'ollama', name: 'Ollama', key: 'ollama' },
  { id: 'openrouter', name: 'OpenRouter', key: 'openrouter' },
  { id: 'cohere', name: 'Cohere', key: 'cohere' },
];

export default function ModelLinkSection({ linkedModelId, linkedModelName, onChange }: Props) {
  // Check which free services are configured
  const configuredFreeServices = freeServices.filter((s) => {
    try {
      const raw = localStorage.getItem(`gfd_freeai_${s.key}`);
      if (!raw) return false;
      const cfg = JSON.parse(raw);
      return cfg.enabled && cfg.apiKey?.trim();
    } catch { return false; }
  });

  const allModels: ModelOption[] = [
    ...builtinModels,
    ...configuredFreeServices.map((s) => ({
      id: `free-${s.id}`,
      name: s.name,
      size: 'Free API',
      type: 'free' as const,
      service: s.id,
    })),
  ];

  return (
    <div>
      <h3 className="text-puma-text text-sm font-semibold mb-1">Linked AI Model</h3>
      <p className="text-puma-muted text-xs mb-3">Choose which model powers this AI agent</p>

      <div className="grid grid-cols-2 gap-2">
        {allModels.map((model) => {
          const isSelected = linkedModelId === model.id;
          return (
            <button
              key={model.id}
              onClick={() => onChange(model.id, model.name)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-puma-accent/15 border-puma-accent/50 text-puma-accent'
                  : 'bg-puma-bg border-puma-border/30 text-puma-muted hover:border-puma-border hover:text-puma-text'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <i className={`${model.type === 'free' ? 'ri-gift-line' : 'ri-cpu-line'} text-sm`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{model.name}</p>
                <p className="text-xs opacity-60">{model.size}</p>
              </div>
              {isSelected && (
                <div className="w-4 h-4 flex items-center justify-center ml-auto flex-shrink-0">
                  <i className="ri-check-line text-xs"></i>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {linkedModelId && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-puma-accent/10 border border-puma-accent/20 rounded-lg">
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-check-line text-puma-accent text-sm"></i>
          </div>
          <span className="text-puma-accent text-xs font-medium">Using: {linkedModelName}</span>
        </div>
      )}
    </div>
  );
}