import { useState } from 'react';

interface Gateway {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  latency?: number;
}

const defaultGateways: Gateway[] = [
  { id: '1', name: 'Cloudflare IPFS', url: 'https://cloudflare-ipfs.com/ipfs/', enabled: true, latency: 45 },
  { id: '2', name: 'IPFS.io', url: 'https://ipfs.io/ipfs/', enabled: true, latency: 120 },
  { id: '3', name: 'Pinata', url: 'https://gateway.pinata.cloud/ipfs/', enabled: false, latency: 89 },
  { id: '4', name: 'Infura', url: 'https://infura-ipfs.io/ipfs/', enabled: false, latency: 67 },
  { id: '5', name: 'Dweb.link', url: 'https://dweb.link/ipfs/', enabled: true, latency: 55 },
];

export default function IPFSSettings() {
  const [gateways, setGateways] = useState<Gateway[]>(defaultGateways);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [arweave, setArweave] = useState(false);

  const toggleGateway = (id: string) => {
    setGateways(gateways.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)));
  };

  const deleteGateway = (id: string) => {
    setGateways(gateways.filter((g) => g.id !== id));
  };

  const addGateway = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    const gateway: Gateway = {
      id: Date.now().toString(),
      name: newName,
      url: newUrl,
      enabled: true,
    };
    setGateways([...gateways, gateway]);
    setNewName('');
    setNewUrl('');
    setShowAdd(false);
  };

  const getLatencyColor = (latency?: number) => {
    if (!latency) return 'text-puma-muted';
    if (latency < 60) return 'text-green-400';
    if (latency < 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-puma-text text-xl font-bold">IPFS Gateways</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <i className="ri-add-line text-base"></i>
          </div>
          Add Gateway
        </button>
      </div>
      <p className="text-puma-muted text-sm mb-6">Configure IPFS gateways for decentralized web access</p>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-6 bg-puma-surface rounded-xl border border-puma-accent/30 p-4">
          <h4 className="text-puma-text text-sm font-semibold mb-3">New Gateway</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Gateway name..."
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://gateway.example.com/ipfs/"
              className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
            />
            <div className="flex gap-2">
              <button onClick={addGateway} className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-lg text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap">Add</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Gateways List */}
      <div className="space-y-2 mb-6">
        {gateways.map((gateway) => (
          <div key={gateway.id} className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-puma-text text-sm font-medium">{gateway.name}</p>
                  {gateway.latency && (
                    <span className={`text-xs font-mono ${getLatencyColor(gateway.latency)}`}>{gateway.latency}ms</span>
                  )}
                </div>
                <p className="text-puma-muted text-xs truncate">{gateway.url}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleGateway(gateway.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                    gateway.enabled ? 'bg-puma-accent' : 'bg-puma-border/50'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${gateway.enabled ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                </button>
                <button onClick={() => deleteGateway(gateway.id)} className="w-7 h-7 flex items-center justify-center text-puma-muted hover:text-red-400 transition-colors cursor-pointer">
                  <i className="ri-delete-bin-line text-base"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arweave */}
      <div>
        <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Arweave</h4>
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-puma-text text-sm font-medium">Enable Arweave Access</p>
            <p className="text-puma-muted text-xs">Access permanent decentralized storage</p>
          </div>
          <button
            onClick={() => setArweave(!arweave)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${arweave ? 'bg-puma-accent' : 'bg-puma-border/50'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${arweave ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
          </button>
        </div>
      </div>
    </div>
  );
}