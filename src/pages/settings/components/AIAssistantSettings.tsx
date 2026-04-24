import { useState } from 'react';
import LocalLLMSettings from './LocalLLMSettings';
import CustomChatPromptSettings from './CustomChatPromptSettings';
import FreeAIServicesSettings from './FreeAIServicesSettings';

type SubPage = null | 'local-llm' | 'custom-prompt' | 'free-ai';

const menuItems = [
  {
    id: 'free-ai' as const,
    icon: 'ri-gift-line',
    title: 'Free AI Services',
    desc: 'Connect to free-tier AI APIs (Groq, Gemini, Ollama, etc.)',
  },
  {
    id: 'local-llm' as const,
    icon: 'ri-cpu-line',
    title: 'Local LLMs',
    desc: 'Choose local model used by AI Assistant',
  },
  {
    id: 'custom-prompt' as const,
    icon: 'ri-terminal-box-line',
    title: 'Custom chat prompt',
    desc: 'Provide custom prompt used for chatting with your Ai assistant',
  },
];

export default function AIAssistantSettings() {
  const [subPage, setSubPage] = useState<SubPage>(null);

  if (subPage === 'local-llm') {
    return <LocalLLMSettings onBack={() => setSubPage(null)} />;
  }

  if (subPage === 'custom-prompt') {
    return <CustomChatPromptSettings onBack={() => setSubPage(null)} />;
  }

  if (subPage === 'free-ai') {
    return <FreeAIServicesSettings onBack={() => setSubPage(null)} />;
  }

  return (
    <div className="p-6 max-w-2xl">
      <h3 className="text-puma-text text-xl font-bold mb-6">AI Assistant</h3>

      <div className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSubPage(item.id)}
            className="w-full flex items-center gap-4 px-4 py-5 rounded-xl hover:bg-puma-surface transition-all duration-200 cursor-pointer text-left group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-puma-surface group-hover:bg-puma-card transition-colors flex-shrink-0">
              <i className={`${item.icon} text-puma-text text-xl`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-puma-text text-base font-bold leading-snug">{item.title}</p>
              <p className="text-puma-muted text-sm mt-0.5 leading-snug">{item.desc}</p>
            </div>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-puma-muted group-hover:text-puma-text transition-colors">
              <i className="ri-arrow-right-s-line text-lg"></i>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}