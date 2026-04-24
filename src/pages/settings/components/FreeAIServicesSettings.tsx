import { useState, useEffect } from 'react';

interface FreeAIService {
  id: string;
  name: string;
  icon: string;
  desc: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  models: string[];
  docsUrl: string;
}

const services: FreeAIService[] = [
  {
    id: 'groq',
    name: 'Groq',
    icon: 'ri-flashlight-line',
    desc: 'Ultra-fast inference with free tier (1,000 req/day)',
    apiKeyLabel: 'Groq API Key',
    apiKeyPlaceholder: 'gsk_...',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    docsUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'ri-google-line',
    desc: 'Free tier with 60 requests/minute limit',
    apiKeyLabel: 'Gemini API Key',
    apiKeyPlaceholder: 'AIzaSy...',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    icon: 'ri-server-line',
    desc: 'Run models locally via Ollama server (completely free)',
    apiKeyLabel: 'Ollama Base URL',
    apiKeyPlaceholder: 'http://localhost:11434',
    models: ['llama3.2', 'qwen2.5', 'phi4', 'mistral', 'gemma2'],
    docsUrl: 'https://ollama.com/download',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: 'ri-route-line',
    desc: 'Access 200+ models with free tier credits',
    apiKeyLabel: 'OpenRouter API Key',
    apiKeyPlaceholder: 'sk-or-v1-...',
    models: ['meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.0-flash-exp', 'mistralai/mistral-7b-instruct'],
    docsUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    icon: 'ri-brain-line',
    desc: 'Free tier with 1,000 API calls/month',
    apiKeyLabel: 'Cohere API Key',
    apiKeyPlaceholder: '...',
    models: ['command-r', 'command-r-plus', 'command'],
    docsUrl: 'https://dashboard.cohere.com/api-keys',
  },
];

function loadServiceConfig(id: string): { apiKey: string; activeModel: string; enabled: boolean } {
  try {
    const raw = localStorage.getItem(`gfd_freeai_${id}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { apiKey: '', activeModel: '', enabled: false };
}

function saveServiceConfig(id: string, config: { apiKey: string; activeModel: string; enabled: boolean }) {
  localStorage.setItem(`gfd_freeai_${id}`, JSON.stringify(config));
}

interface Props {
  onBack: () => void;
}

export default function FreeAIServicesSettings({ onBack }: Props) {
  const [configs, setConfigs] = useState<Record<string, { apiKey: string; activeModel: string; enabled: boolean }>>(() => {
    const initial: Record<string, { apiKey: string; activeModel: string; enabled: boolean }> = {};
    services.forEach((s) => { initial[s.id] = loadServiceConfig(s.id); });
    return initial;
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const updateConfig = (id: string, updates: Partial<{ apiKey: string; activeModel: string; enabled: boolean }>) => {
    setConfigs((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...updates } };
      saveServiceConfig(id, next[id]);
      return next;
    });
  };

  const activeCount = Object.values(configs).filter((c) => c.enabled && c.apiKey.trim()).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-puma-border/30 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-puma-surface transition-colors cursor-pointer text-puma-text"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <div>
          <h3 className="text-puma-text text-xl font-bold">Free AI Services</h3>
          <p className="text-puma-muted text-xs">{activeCount} service{activeCount !== 1 ? 's' : ''} configured</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        <div className="bg-puma-accent/10 border border-puma-accent/20 rounded-xl p-4 mb-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-puma-accent/20 flex-shrink-0">
              <i className="ri-gift-line text-puma-accent text-lg"></i>
            </div>
            <div>
              <p className="text-puma-text text-sm font-semibold">100% Free AI Access</p>
              <p className="text-puma-muted text-xs mt-1 leading-relaxed">
                Connect to free-tier AI services. No credit card required. All services offer generous free quotas for personal use.
              </p>
            </div>
          </div>
        </div>

        {services.map((service) => {
          const config = configs[service.id];
          const isExpanded = expandedId === service.id;
          const isActive = config.enabled && config.apiKey.trim().length > 0;

          return (
            <div
              key={service.id}
              className={`bg-puma-surface rounded-xl border transition-all duration-200 overflow-hidden ${
                isActive ? 'border-puma-accent/40' : 'border-puma-border/30'
              }`}
            >
              {/* Header Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : service.id)}
                className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer text-left"
              >
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${
                  isActive ? 'bg-puma-accent/20' : 'bg-puma-bg'
                }`}>
                  <i className={`${service.icon} ${isActive ? 'text-puma-accent' : 'text-puma-muted'} text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-puma-text text-sm font-semibold">{service.name}</span>
                    {isActive && (
                      <span className="px-2 py-0.5 bg-green-400/20 text-green-400 text-xs rounded-full font-medium">Active</span>
                    )}
                  </div>
                  <p className="text-puma-muted text-xs mt-0.5">{service.desc}</p>
                </div>
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-puma-muted">
                  <i className={`ri-arrow-down-s-line text-lg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-puma-border/20 pt-3">
                  {/* API Key / URL Input */}
                  <div>
                    <label className="text-puma-muted text-xs font-medium mb-1.5 block">{service.apiKeyLabel}</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showKey[service.id] ? 'text' : 'password'}
                          value={config.apiKey}
                          onChange={(e) => updateConfig(service.id, { apiKey: e.target.value })}
                          placeholder={service.apiKeyPlaceholder}
                          className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2.5 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent pr-10"
                        />
                        <button
                          onClick={() => setShowKey((prev) => ({ ...prev, [service.id]: !prev[service.id] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-puma-muted hover:text-puma-text cursor-pointer"
                        >
                          <i className={`${showKey[service.id] ? 'ri-eye-off-line' : 'ri-eye-line'} text-sm`}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="text-puma-muted text-xs font-medium mb-1.5 block">Default Model</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {service.models.map((model) => (
                        <button
                          key={model}
                          onClick={() => updateConfig(service.id, { activeModel: model })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all cursor-pointer whitespace-nowrap ${
                            config.activeModel === model
                              ? 'bg-puma-accent/20 border border-puma-accent/40 text-puma-accent'
                              : 'bg-puma-bg border border-puma-border/30 text-puma-muted hover:text-puma-text'
                          }`}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Enable Toggle + Docs Link */}
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={service.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-puma-accent text-xs hover:underline flex items-center gap-1"
                    >
                      <i className="ri-external-link-line"></i>
                      Get API Key
                    </a>
                    <button
                      onClick={() => updateConfig(service.id, { enabled: !config.enabled })}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                        config.enabled ? 'bg-puma-accent' : 'bg-puma-border/50'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                          config.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      ></span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}