import { useRef, useState } from 'react';

interface LocalModel {
  id: string;
  name: string;
  size: string;
  status: 'loaded' | 'available' | 'downloading';
  progress?: number;
  isCustom?: boolean;
  quant?: string;
  params?: string;
}

interface Props {
  onBack: () => void;
}

export default function LocalLLMSettings({ onBack }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [models, setModels] = useState<LocalModel[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadedModels = models.filter((m) => m.status === 'loaded');
  const availableModels = models.filter((m) => m.status === 'available' || m.status === 'downloading');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!file.name.endsWith('.gguf')) {
      setUploadError('Please upload a valid .gguf model file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const sizeMB = file.size / 1024 / 1024;
    const sizeLabel =
      sizeMB >= 1024
        ? `${(sizeMB / 1024).toFixed(2)} GB`
        : `${sizeMB.toFixed(0)} MB`;

    const nameRaw = file.name.replace('.gguf', '');
    const quantMatch = nameRaw.match(/(Q\d[_A-Z0-9]*)/i);
    const quant = quantMatch ? quantMatch[1].toUpperCase() : 'GGUF';

    const newModel: LocalModel = {
      id: `custom-${Date.now()}`,
      name: nameRaw,
      size: sizeLabel,
      quant,
      params: 'Custom',
      status: 'available',
      isCustom: true,
    };

    setModels((prev) => [...prev, newModel]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoad = (id: string) => {
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, status: 'downloading', progress: 0 };
      })
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 5;
      if (progress >= 100) {
        clearInterval(interval);
        setModels((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, status: 'loaded', progress: 100 } : m
          )
        );
      } else {
        setModels((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, progress: Math.round(progress) } : m
          )
        );
      }
    }, 250);
  };

  const handleDelete = (id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-puma-border/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-puma-surface transition-colors cursor-pointer text-puma-text"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <h3 className="text-puma-text text-xl font-bold">Local LLMs</h3>
        </div>

        {/* Upload GGUF Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-puma-surface hover:bg-puma-card border border-puma-border/30 transition-colors cursor-pointer"
          title="Upload GGUF model"
        >
          <i className="ri-file-upload-line text-puma-text text-lg"></i>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gguf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Error */}
      {uploadError && (
        <div className="mx-5 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <i className="ri-error-warning-line text-base flex-shrink-0"></i>
          {uploadError}
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">

        {/* Loaded Models */}
        <section>
          <h2 className="text-puma-text text-2xl font-bold text-center mb-4">Loaded models</h2>
          <div className="border-t border-puma-border/30 pt-4">
            {loadedModels.length === 0 ? (
              <p className="text-puma-muted text-sm text-center py-4">No models loaded yet</p>
            ) : (
              <div className="space-y-3">
                {loadedModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onAction={() => {}}
                    onDelete={() => handleDelete(model.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Available Models */}
        <section>
          <h2 className="text-puma-text text-2xl font-bold text-center mb-4">Available models</h2>
          {availableModels.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-puma-surface border border-puma-border/30">
                <i className="ri-upload-cloud-2-line text-puma-muted text-3xl"></i>
              </div>
              <div className="text-center">
                <p className="text-puma-text text-sm font-semibold">No models yet</p>
                <p className="text-puma-muted text-xs mt-1">
                  Upload a <span className="text-puma-accent font-medium">.gguf</span> file using the button above
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-puma-accent/20 border border-puma-accent/40 text-puma-accent rounded-xl text-sm font-semibold hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-upload-line mr-2"></i>
                Upload GGUF Model
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {availableModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onAction={() => handleLoad(model.id)}
                  onDelete={() => handleDelete(model.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: LocalModel;
  onAction: () => void;
  onDelete: () => void;
}

function ModelCard({ model, onAction, onDelete }: ModelCardProps) {
  const isDownloading = model.status === 'downloading';
  const isLoaded = model.status === 'loaded';

  return (
    <div className="relative bg-puma-surface rounded-2xl border border-puma-border/30 overflow-hidden">
      {/* Hot badge */}
      <div className="absolute top-0 right-0 w-10 h-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-0 h-0"
          style={{
            borderStyle: 'solid',
            borderWidth: '0 40px 40px 0',
            borderColor: 'transparent #f97316 transparent transparent',
          }}
        />
        <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center">
          <i className="ri-fire-fill text-white text-xs"></i>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-4 pr-12">
        {/* Icon */}
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-puma-bg flex-shrink-0">
          <i className="ri-file-code-line text-puma-accent text-2xl"></i>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-puma-text text-base font-bold truncate">{model.name}</p>
          <p className="text-puma-muted text-sm mt-0.5">
            {model.params && `${model.params} · `}{model.quant && `${model.quant} · `}{model.size}
          </p>
          {isDownloading && (
            <div className="mt-2">
              <div className="w-full bg-puma-bg rounded-full h-1.5">
                <div
                  className="bg-puma-accent h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${model.progress ?? 0}%` }}
                />
              </div>
              <p className="text-puma-muted text-xs mt-1">Loading... {model.progress ?? 0}%</p>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoaded ? (
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500/20">
              <i className="ri-check-line text-green-400 text-lg"></i>
            </div>
          ) : isDownloading ? (
            <div className="w-9 h-9 flex items-center justify-center">
              <i className="ri-loader-4-line text-puma-accent text-xl animate-spin"></i>
            </div>
          ) : (
            <button
              onClick={onAction}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-puma-bg hover:bg-puma-card border border-puma-border/30 transition-colors cursor-pointer"
            >
              <i className="ri-download-cloud-line text-puma-muted text-lg"></i>
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer"
          >
            <i className="ri-delete-bin-line text-base"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
