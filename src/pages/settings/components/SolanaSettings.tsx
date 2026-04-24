import { useState } from 'react';

const networks = [
  { id: 'mainnet', label: 'Mainnet Beta', rpc: 'https://api.mainnet-beta.solana.com' },
  { id: 'devnet', label: 'Devnet', rpc: 'https://api.devnet.solana.com' },
  { id: 'testnet', label: 'Testnet', rpc: 'https://api.testnet.solana.com' },
  { id: 'custom', label: 'Custom RPC', rpc: '' },
];

const walletAdapters = [
  { id: 'phantom', label: 'Phantom', icon: 'ri-ghost-line' },
  { id: 'solflare', label: 'Solflare', icon: 'ri-sun-line' },
  { id: 'backpack', label: 'Backpack', icon: 'ri-briefcase-line' },
  { id: 'glow', label: 'Glow', icon: 'ri-flashlight-line' },
];

export default function SolanaSettings() {
  const [network, setNetwork] = useState('mainnet');
  const [customRpc, setCustomRpc] = useState('');
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [autoConnect, setAutoConnect] = useState(true);

  return (
    <div className="p-6 max-w-2xl">
      <h3 className="text-puma-text text-xl font-bold mb-2">Solana Wallet Adapter</h3>
      <p className="text-puma-muted text-sm mb-6">Configure Solana network and wallet connections</p>

      {/* Network Selection */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Network</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
          {networks.map((n, idx) => (
            <button
              key={n.id}
              onClick={() => setNetwork(n.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors text-left ${
                idx < networks.length - 1 ? 'border-b border-puma-border/20' : ''
              } ${network === n.id ? 'bg-puma-card' : 'hover:bg-puma-card/40'}`}
            >
              <div>
                <p className="text-puma-text text-sm font-medium">{n.label}</p>
                {n.rpc && <p className="text-puma-muted text-xs font-mono">{n.rpc}</p>}
              </div>
              {network === n.id && (
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-check-line text-puma-accent text-lg"></i>
                </div>
              )}
            </button>
          ))}
        </div>

        {network === 'custom' && (
          <div className="mt-3">
            <input
              type="url"
              value={customRpc}
              onChange={(e) => setCustomRpc(e.target.value)}
              placeholder="https://your-custom-rpc.com"
              className="w-full bg-puma-surface border border-puma-border/30 rounded-xl px-4 py-3 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
            />
          </div>
        )}
      </div>

      {/* Wallet Adapters */}
      <div className="mb-6">
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Wallet Adapters</h4>
        <div className="grid grid-cols-2 gap-2">
          {walletAdapters.map((w) => (
            <button
              key={w.id}
              onClick={() => setConnectedWallet(connectedWallet === w.id ? null : w.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                connectedWallet === w.id
                  ? 'bg-puma-card border-puma-accent puma-glow-sm'
                  : 'bg-puma-surface border-puma-border/30 hover:border-puma-border'
              }`}
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-puma-bg">
                <i className={`${w.icon} text-puma-accent text-base`}></i>
              </div>
              <div className="text-left">
                <p className="text-puma-text text-sm font-medium">{w.label}</p>
                <p className="text-xs text-puma-muted">{connectedWallet === w.id ? 'Connected' : 'Connect'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Auto Connect */}
      <div className="mb-6">
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-puma-text text-sm font-medium">Auto Connect</p>
            <p className="text-puma-muted text-xs">Automatically reconnect wallet on startup</p>
          </div>
          <button
            onClick={() => setAutoConnect(!autoConnect)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
              autoConnect ? 'bg-puma-accent' : 'bg-puma-border/50'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                autoConnect ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            ></span>
          </button>
        </div>
      </div>
    </div>
  );
}