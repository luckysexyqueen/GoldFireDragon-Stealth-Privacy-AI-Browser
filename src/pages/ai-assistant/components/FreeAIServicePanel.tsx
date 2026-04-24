import { useState, useEffect } from 'react';
import { FreeAIService } from '../page';

interface ServiceConfig {
  apiKey: string;
  activeModel: string;
  enabled: boolean;
}

const serviceList = [
  { id: 'groq', name: 'Groq', icon: 'ri-flashlight-line', desc: 'Ultra-fast inference · 1,000 req/day free', color: 'text-orange-400' },
  { id: 'gemini', name: 'Google Gemini', icon: 'ri-google-line', desc: '60 requests/minute free tier', color: 'text-blue-400' },
  { id: 'ollama', name: 'Ollama', icon: 'ri-server-line', desc: 'Run locally · Completely free', color: 'text-purple-400' },
  { id: 'openrouter', name: 'OpenRouter', icon: 'ri-route-line', desc: '200+ models · Free credits', color: 'text-green-400' },
  { id: 'cohere', name: 'Cohere', icon: 'ri-brain-line', desc: '1,000 API calls/month free', color: 'text-pink-400' },
];

function loadConfig(id: string): ServiceConfig {
  try {
    const raw = localStorage.getItem(`gfd_freeai_${id}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { apiKey: '', activeModel: '', enabled: false };
}

interface Props {
  activeService: FreeAIService | null;
  onSelectService: (service: FreeAIService | null) => void;
}

export default function FreeAIServicePanel({ activeService, onSelectService }: Props) {
  const [configs, setConfigs] = useState<Record<string, ServiceConfig>>({});

  useEffect(() => {
    const loaded: Record<string, ServiceConfig> = {};
    serviceList.forEach((s) => { loaded[s.id] = loadConfig(s.id); });
    setConfigs(loaded);
  }, []);

  const handleSelect = (id: string, name: string) => {
    const config = configs[id];
    if (!config || !config.enabled || !config.apiKey.trim()) return;
    onSelectService({ id, name, model: config.activeModel || 'default' });
  };

  const handleDeselect = () => {
    onSelectService(null);
  };

  return (
    <div className="h-full overflow-y-auto px-5 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-puma-accent/10 mx-auto mb-4">
            <i className="ri-gift-line text-puma-accent text-3xl"></i>
          </div>
          <h2 className="text-puma-text text-xl font-bold mb-2">Free AI Services</h2>
          <p className="text-puma-muted text-sm max-w-md mx-auto leading-relaxed">
            Connect to free-tier AI APIs. No credit card required. Configure API keys in Settings &gt; AI Assistant &gt; Free AI Services.
          </p>
        </div>

        {/* Active Service Banner */}
        {activeService && (
          <div className="mb-6 bg-puma-accent/10 border border-puma-accent/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-puma-accent/20">
                <i className="ri-check-line text-puma-accent text-lg"></i>
              </div>
              <div>
                <p className="text-puma-text text-sm font-semibold">{activeService.name} Active</p>
                <p className="text-puma-muted text-xs">{activeService.model}</p>
              </div>
            </div>
            <button
              onClick={handleDeselect}
              className="px-3 py-1.5 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-xs font-medium hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Service Cards */}
        <div className="space-y-3">
          {serviceList.map((service) => {
            const config = configs[service.id];
            const isConfigured = config?.enabled && config?.apiKey?.trim().length > 0;
            const isActive = activeService?.id === service.id;

            return (
              <div
                key={service.id}
                className={`bg-puma-surface rounded-xl border p-4 transition-all duration-200 ${
                  isActive
                    ? 'border-puma-accent/50'
                    : isConfigured
                    ? 'border-puma-border/30 hover:border-puma-border'
                    : 'border-puma-border/20 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-puma-bg flex-shrink-0`}>
                    <i className={`${service.icon} ${service.color} text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-puma-text text-sm font-semibold">{service.name}</span>
                      {isConfigured && (
                        <span className="px-2 py-0.5 bg-green-400/20 text-green-400 text-xs rounded-full font-medium">Ready</span>
                      )}
                      {!isConfigured && (
                        <span className="px-2 py-0.5 bg-puma-border/30 text-puma-muted text-xs rounded-full">Not Configured</span>
                      )}
                    </div>
                    <p className="text-puma-muted text-xs mt-0.5">{service.desc}</p>
                  </div>
                  {isConfigured && (
                    <button
                      onClick={() => isActive ? handleDeselect() : handleSelect(service.id, service.name)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-puma-accent/20 border border-puma-accent/40 text-puma-accent'
                          : 'bg-puma-bg border border-puma-border/30 text-puma-text hover:bg-puma-card'
                      }`}
                    >
                      {isActive ? 'Selected' : 'Use'}
                    </button>
                  )}
                  {!isConfigured && (
                    <a
                      href="/settings"
                      onClick={(e) => {
                        e.preventDefault();
                        window.REACT_APP_NAVIGATE?.('/settings');
                      }}
                      className="px-4 py-2 bg-puma-bg border border-puma-border/30 text-puma-muted rounded-lg text-xs font-medium hover:text-puma-text transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Configure
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}