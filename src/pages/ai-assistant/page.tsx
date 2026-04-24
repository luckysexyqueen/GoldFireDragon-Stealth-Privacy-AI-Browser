import { useState } from 'react';
import Layout from '@/components/feature/Layout';
import ModelManager from './components/ModelManager';
import ChatInterface from './components/ChatInterface';
import FreeAIServicePanel from './components/FreeAIServicePanel';
import GGUFConverterPanel from './components/GGUFConverterPanel';

export type AIModel = {
  id: string;
  name: string;
  size: string;
  type: 'webllm' | 'custom';
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress?: number;
  file?: File;
};

export type FreeAIService = {
  id: string;
  name: string;
  model: string;
};

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'models' | 'free-ai' | 'converter'>('chat');
  const [models, setModels] = useState<AIModel[]>([
    { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', size: '0.7 GB', type: 'webllm', status: 'idle' },
    { id: 'llama-3.2-3b', name: 'Llama 3.2 3B', size: '1.9 GB', type: 'webllm', status: 'idle' },
    { id: 'gemma-2-2b', name: 'Gemma 2 2B', size: '1.5 GB', type: 'webllm', status: 'idle' },
    { id: 'qwen2.5-1.5b', name: 'Qwen 2.5 1.5B', size: '1.0 GB', type: 'webllm', status: 'idle' },
    { id: 'phi-3.5-mini', name: 'Phi 3.5 Mini', size: '2.2 GB', type: 'webllm', status: 'idle' },
    { id: 'mistral-7b', name: 'Mistral 7B', size: '4.1 GB', type: 'webllm', status: 'idle' },
  ]);
  const [activeModel, setActiveModel] = useState<AIModel | null>(null);
  const [activeFreeService, setActiveFreeService] = useState<FreeAIService | null>(null);

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-puma-border/30 bg-puma-surface flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-puma-accent/20">
              <i className="ri-robot-2-line text-puma-accent text-lg"></i>
            </div>
            <div>
              <h2 className="text-puma-text font-bold text-base">AI Assistant</h2>
              {activeFreeService ? (
                <p className="text-puma-accent text-xs">{activeFreeService.name} · {activeFreeService.model}</p>
              ) : activeModel ? (
                <p className="text-puma-accent text-xs">{activeModel.name} · Local</p>
              ) : (
                <p className="text-puma-muted text-xs">No model loaded</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-puma-bg rounded-lg p-1">
            {(['chat', 'models', 'free-ai', 'converter'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-puma-card text-puma-accent'
                    : 'text-puma-muted hover:text-puma-text'
                }`}
              >
                {tab === 'chat' ? 'Chat' : tab === 'models' ? 'Models' : tab === 'free-ai' ? 'Free AI' : '🔄 Converter'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? (
            <ChatInterface
              activeModel={activeModel}
              activeFreeService={activeFreeService}
              onSelectFreeService={setActiveFreeService}
            />
          ) : activeTab === 'models' ? (
            <ModelManager
              models={models}
              setModels={setModels}
              activeModel={activeModel}
              setActiveModel={setActiveModel}
            />
          ) : activeTab === 'free-ai' ? (
            <FreeAIServicePanel
              activeService={activeFreeService}
              onSelectService={setActiveFreeService}
            />
          ) : (
            <GGUFConverterPanel models={models} />
          )}
        </div>
      </div>
    </Layout>
  );
}