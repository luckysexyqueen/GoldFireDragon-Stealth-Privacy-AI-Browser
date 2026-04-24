import { useState } from 'react';
import Layout from '@/components/feature/Layout';

const popularSites = [
  { name: 'IPFS Docs', hash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco', desc: 'Official IPFS documentation' },
  { name: 'Ethereum.org', hash: 'bafybeiasb5vpmaounyilfuxbd3lryvosl4yefqrfahsb2esg46q3bbb405', desc: 'Ethereum official site on IPFS' },
  { name: 'Uniswap Interface', hash: 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m', desc: 'Uniswap DEX interface' },
  { name: 'ENS App', hash: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu', desc: 'Ethereum Name Service app' },
];

export default function IPFSPage() {
  const [ipfsInput, setIpfsInput] = useState('');
  const [activeGateway, setActiveGateway] = useState('https://cloudflare-ipfs.com/ipfs/');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const gateways = [
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
  ];

  const handleLoad = async () => {
    if (!ipfsInput.trim()) return;
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setResult(`${activeGateway}${ipfsInput.trim()}`);
    setLoading(false);
  };

  const handleQuickLoad = (hash: string) => {
    setIpfsInput(hash);
    setResult(`${activeGateway}${hash}`);
  };

  return (
    <Layout>
      <div className="p-5 max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-puma-text text-xl font-bold">IPFS Gateways</h2>
          <p className="text-puma-muted text-sm">Access decentralized web content via IPFS</p>
        </div>

        {/* Info Banner */}
        <div className="bg-puma-surface rounded-xl border border-puma-accent/20 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="ri-global-line text-puma-accent text-base"></i>
            </div>
            <div>
              <p className="text-puma-text text-sm font-semibold">InterPlanetary File System</p>
              <p className="text-puma-muted text-xs mt-1 leading-relaxed">
                IPFS is a decentralized protocol for storing and sharing data. Content is addressed by its hash,
                not its location - making it censorship-resistant and permanent.
              </p>
            </div>
          </div>
        </div>

        {/* Gateway Selector */}
        <div className="mb-5">
          <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Active Gateway</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {gateways.map((gw) => (
              <button
                key={gw}
                onClick={() => setActiveGateway(gw)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  activeGateway === gw
                    ? 'bg-puma-card border-puma-accent'
                    : 'bg-puma-surface border-puma-border/30 hover:border-puma-border'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {activeGateway === gw
                    ? <i className="ri-radio-button-fill text-puma-accent text-sm"></i>
                    : <i className="ri-radio-button-line text-puma-muted text-sm"></i>
                  }
                </div>
                <span className="text-puma-text text-xs font-mono truncate">{gw.replace('https://', '').replace('/ipfs/', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* IPFS Input */}
        <div className="mb-6">
          <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Load IPFS Content</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={ipfsInput}
              onChange={(e) => setIpfsInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
              placeholder="Enter CID or IPFS hash (e.g. Qm... or bafy...)"
              className="flex-1 bg-puma-surface border border-puma-border/30 rounded-xl px-4 py-3 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent font-mono"
            />
            <button
              onClick={handleLoad}
              disabled={!ipfsInput.trim() || loading}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                ipfsInput.trim() && !loading
                  ? 'bg-puma-accent/20 border border-puma-accent/50 text-puma-accent hover:bg-puma-accent/30'
                  : 'bg-puma-border/20 border border-puma-border/30 text-puma-muted cursor-not-allowed'
              }`}
            >
              {loading ? <i className="ri-loader-4-line animate-spin text-base"></i> : 'Load'}
            </button>
          </div>

          {result && (
            <div className="mt-3 bg-puma-surface rounded-xl border border-green-500/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-check-line text-green-400 text-sm"></i>
                </div>
                <span className="text-green-400 text-xs font-medium">Gateway URL Generated</span>
              </div>
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-puma-accent text-xs font-mono break-all hover:underline"
              >
                {result}
              </a>
            </div>
          )}
        </div>

        {/* Popular IPFS Sites */}
        <div>
          <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Popular IPFS Sites</h4>
          <div className="space-y-2">
            {popularSites.map((site) => (
              <div key={site.hash} className="bg-puma-surface rounded-xl border border-puma-border/30 p-4 hover:border-puma-border transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-puma-text text-sm font-semibold">{site.name}</p>
                    <p className="text-puma-muted text-xs">{site.desc}</p>
                    <p className="text-puma-muted/60 text-xs font-mono mt-1 truncate">{site.hash.slice(0, 30)}...</p>
                  </div>
                  <button
                    onClick={() => handleQuickLoad(site.hash)}
                    className="px-3 py-1.5 bg-puma-accent/20 border border-puma-accent/30 text-puma-accent rounded-lg text-xs font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}