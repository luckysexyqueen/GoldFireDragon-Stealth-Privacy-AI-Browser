import { useState } from 'react';
import Layout from '@/components/feature/Layout';
import GeneralSettings from './components/GeneralSettings';
import AIAssistantSettings from './components/AIAssistantSettings';
import PromptsSettings from './components/PromptsSettings';
import MCPSettings from './components/MCPSettings';
import WalletSettings from './components/WalletSettings';
import SolanaSettings from './components/SolanaSettings';
import IPFSSettings from './components/IPFSSettings';
import PaymentBlockerSettings from './components/PaymentBlockerSettings';

type SettingSection =
  | 'general'
  | 'ai-assistant'
  | 'prompts'
  | 'mcp'
  | 'payment-blocker'
  | 'wallet'
  | 'solana'
  | 'ipfs';

const aiToolsItems: { id: SettingSection; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'ri-settings-3-line' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: 'ri-robot-2-line' },
  { id: 'prompts', label: 'Prompts', icon: 'ri-file-text-line' },
  { id: 'mcp', label: 'MCP Server', icon: 'ri-server-line' },
  { id: 'payment-blocker', label: '자동결제 차단', icon: 'ri-shield-check-line' },
];

const cryptoItems: { id: SettingSection; label: string; icon: string }[] = [
  { id: 'wallet', label: 'Wallet', icon: 'ri-wallet-3-line' },
  { id: 'solana', label: 'Solana Wallet Adapter', icon: 'ri-coin-line' },
  { id: 'ipfs', label: 'IPFS Gateways', icon: 'ri-global-line' },
];

const sectionComponents: Record<SettingSection, JSX.Element> = {
  general: <GeneralSettings />,
  'ai-assistant': <AIAssistantSettings />,
  prompts: <PromptsSettings />,
  mcp: <MCPSettings />,
  'payment-blocker': <PaymentBlockerSettings />,
  wallet: <WalletSettings />,
  solana: <SolanaSettings />,
  ipfs: <IPFSSettings />,
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>('general');

  return (
    <Layout>
      <div className="flex h-screen overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-72 bg-puma-surface border-r border-puma-border/30 overflow-y-auto flex-shrink-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-puma-border/30">
            <h2 className="text-puma-text text-xl font-bold">설정</h2>
          </div>

          <div className="py-4">
            {/* Puma AI Tools Section */}
            <div className="px-5 mb-2">
              <span className="text-puma-accent text-sm font-semibold tracking-wide">Stealth AI Tools</span>
            </div>
            {aiToolsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 transition-all duration-200 cursor-pointer text-left ${
                  activeSection === item.id
                    ? 'bg-puma-card text-puma-text border-r-2 border-puma-accent'
                    : 'text-puma-text hover:bg-puma-card/40'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center text-puma-muted">
                  <i className={`${item.icon} text-lg`}></i>
                </div>
                <span className="text-base font-medium">{item.label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="mx-5 my-3 border-t border-puma-border/30"></div>

            {/* Crypto Section */}
            <div className="px-5 mb-2">
              <span className="text-puma-accent text-sm font-semibold tracking-wide">Crypto</span>
            </div>
            {cryptoItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 transition-all duration-200 cursor-pointer text-left ${
                  activeSection === item.id
                    ? 'bg-puma-card text-puma-text border-r-2 border-puma-accent'
                    : 'text-puma-text hover:bg-puma-card/40'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center text-puma-muted">
                  <i className={`${item.icon} text-lg`}></i>
                </div>
                <span className="text-base font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-puma-bg">
          {sectionComponents[activeSection]}
        </div>
      </div>
    </Layout>
  );
}