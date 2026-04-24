import { useState } from 'react';
import Layout from '@/components/feature/Layout';

const tokens = [
  { symbol: 'SOL', name: 'Solana', balance: '12.45', usd: '1,823.40', change: '+5.2%', positive: true },
  { symbol: 'ETH', name: 'Ethereum', balance: '0.82', usd: '2,156.80', change: '+2.1%', positive: true },
  { symbol: 'USDC', name: 'USD Coin', balance: '450.00', usd: '450.00', change: '0.0%', positive: true },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.012', usd: '789.60', change: '-1.3%', positive: false },
];

const nfts = [
  { id: '1', name: 'Stealth Genesis #042', collection: 'Stealth NFTs', img: 'https://readdy.ai/api/search-image?query=abstract%20digital%20art%20purple%20glowing%20puma%20cat%20neon%20cyberpunk%20style%20dark%20background%20minimal&width=200&height=200&seq=nft1&orientation=squarish' },
  { id: '2', name: 'Web3 Pioneer #117', collection: 'Web3 Pioneers', img: 'https://readdy.ai/api/search-image?query=futuristic%20digital%20badge%20holographic%20purple%20blue%20glowing%20web3%20blockchain%20art%20dark%20background&width=200&height=200&seq=nft2&orientation=squarish' },
  { id: '3', name: 'Privacy Shield #08', collection: 'Privacy Club', img: 'https://readdy.ai/api/search-image?query=glowing%20shield%20emblem%20purple%20violet%20neon%20digital%20art%20cyberpunk%20dark%20minimal%20background&width=200&height=200&seq=nft3&orientation=squarish' },
];

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'activity'>('tokens');
  const [connected, setConnected] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);

  const totalUsd = tokens.reduce((sum, t) => sum + parseFloat(t.usd.replace(',', '')), 0);

  // Free mode screen
  if (!paymentsEnabled) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-green-400/10 mb-6">
            <i className="ri-gift-line text-green-400 text-5xl"></i>
          </div>
          <h2 className="text-puma-text text-2xl font-bold mb-2">완전 무료 모드</h2>
          <p className="text-puma-muted text-sm max-w-xs mb-2 leading-relaxed">
            현재 결제 기능이 비활성화되어 있습니다.
            모든 AI 기능을 무료로 사용할 수 있습니다.
          </p>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-400/10 border border-green-400/20 rounded-xl mb-8">
            <i className="ri-checkbox-circle-line text-green-400"></i>
            <span className="text-green-400 text-sm font-medium">결제 없이 이용 중</span>
          </div>

          <div className="w-full max-w-sm space-y-3 mb-8">
            {[
              { icon: 'ri-gift-line', name: 'Groq', desc: '무료 고속 AI API' },
              { icon: 'ri-server-line', name: 'Ollama', desc: '완전 로컬 무료 실행' },
              { icon: 'ri-route-line', name: 'OpenRouter', desc: '무료 모델 다수 제공' },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3 px-4 py-3 bg-puma-surface border border-puma-border/30 rounded-xl">
                <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-puma-card">
                  <i className={`${s.icon} text-puma-accent text-base`}></i>
                </div>
                <div className="text-left">
                  <p className="text-puma-text text-sm font-semibold">{s.name}</p>
                  <p className="text-puma-muted text-xs">{s.desc}</p>
                </div>
                <span className="ml-auto px-2 py-0.5 bg-green-400/15 text-green-400 text-xs rounded-full font-medium">무료</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 px-5 py-3.5 bg-puma-surface border border-puma-border/30 rounded-xl w-full max-w-sm">
            <div>
              <p className="text-puma-text text-sm font-semibold text-left">결제 기능 활성화</p>
              <p className="text-puma-muted text-xs text-left">Web3 지갑, NFT, 마이크로페이먼트 사용</p>
            </div>
            <button
              onClick={() => setPaymentsEnabled(true)}
              className="ml-auto relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer bg-puma-border/50 flex-shrink-0"
            >
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 translate-x-0.5"></span>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!connected) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-puma-accent/10 mb-6">
            <i className="ri-wallet-3-line text-puma-accent text-5xl"></i>
          </div>
          <h2 className="text-puma-text text-2xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-puma-muted text-sm max-w-xs mb-8 leading-relaxed">
            Connect your Web3 wallet to manage tokens, NFTs, and enable micropayments
          </p>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-4">
            {['Phantom', 'MetaMask', 'WalletConnect', 'Coinbase'].map((w) => (
              <button
                key={w}
                onClick={() => setConnected(true)}
                className="flex items-center gap-2 px-4 py-3 bg-puma-surface border border-puma-border/30 rounded-xl text-puma-text text-sm font-medium hover:border-puma-accent transition-colors cursor-pointer whitespace-nowrap"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-wallet-line text-puma-accent text-base"></i>
                </div>
                {w}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPaymentsEnabled(false)}
            className="text-puma-muted text-xs hover:text-puma-text transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line mr-1"></i>무료 모드로 돌아가기
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-5 max-w-2xl mx-auto">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-puma-card to-puma-surface rounded-2xl border border-puma-accent/20 p-6 mb-5 puma-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-puma-muted text-xs">Connected · Phantom</span>
            </div>
            <button onClick={() => setConnected(false)} className="text-puma-muted text-xs hover:text-red-400 transition-colors cursor-pointer">Disconnect</button>
          </div>
          <p className="text-puma-muted text-sm mb-1">Total Balance</p>
          <p className="text-puma-text text-3xl font-bold">${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-puma-muted text-xs font-mono mt-2">0x7f3a...b9c2</p>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowSend(!showSend)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-xl text-sm font-medium hover:bg-puma-accent/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-send-plane-line text-sm"></i>
              </div>
              Send
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-puma-card border border-puma-border/30 text-puma-text rounded-xl text-sm font-medium hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-download-line text-sm"></i>
              </div>
              Receive
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-puma-card border border-puma-border/30 text-puma-text rounded-xl text-sm font-medium hover:bg-puma-card/70 transition-colors cursor-pointer whitespace-nowrap">
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-swap-line text-sm"></i>
              </div>
              Swap
            </button>
          </div>
        </div>

        {/* Send Form */}
        {showSend && (
          <div className="mb-5 bg-puma-surface rounded-xl border border-puma-accent/30 p-4">
            <h4 className="text-puma-text text-sm font-semibold mb-3">Send Tokens</h4>
            <div className="space-y-3">
              <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="Recipient address..." className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent font-mono" />
              <input type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="Amount..." className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent" />
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-puma-accent/20 border border-puma-accent/50 text-puma-accent rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">Confirm Send</button>
                <button onClick={() => setShowSend(false)} className="flex-1 py-2 bg-puma-card border border-puma-border/30 text-puma-muted rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-puma-surface rounded-xl p-1 mb-4">
          {(['tokens', 'nfts', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer capitalize whitespace-nowrap ${
                activeTab === tab ? 'bg-puma-card text-puma-accent' : 'text-puma-muted hover:text-puma-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tokens */}
        {activeTab === 'tokens' && (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div key={token.symbol} className="bg-puma-surface rounded-xl border border-puma-border/30 px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-puma-card">
                    <span className="text-puma-accent text-xs font-bold">{token.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-puma-text text-sm font-medium">{token.name}</p>
                    <p className="text-puma-muted text-xs">{token.balance} {token.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-puma-text text-sm font-medium">${token.usd}</p>
                  <p className={`text-xs ${token.positive ? 'text-green-400' : 'text-red-400'}`}>{token.change}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NFTs */}
        {activeTab === 'nfts' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {nfts.map((nft) => (
              <div key={nft.id} className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden cursor-pointer hover:border-puma-accent transition-colors">
                <div className="w-full h-32 bg-puma-card">
                  <img src={nft.img} alt={nft.name} className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-2.5">
                  <p className="text-puma-text text-xs font-semibold">{nft.name}</p>
                  <p className="text-puma-muted text-xs">{nft.collection}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activity */}
        {activeTab === 'activity' && (
          <div className="space-y-2">
            {[
              { type: 'Received', amount: '+2.5 SOL', from: '0x4a2b...', time: '2h ago', positive: true },
              { type: 'Sent', amount: '-0.1 ETH', from: '0x9f1c...', time: '1d ago', positive: false },
              { type: 'Swap', amount: '100 USDC → 0.05 ETH', from: 'Uniswap', time: '2d ago', positive: true },
              { type: 'NFT Purchase', amount: '-0.5 SOL', from: 'Magic Eden', time: '3d ago', positive: false },
            ].map((tx, idx) => (
              <div key={idx} className="bg-puma-surface rounded-xl border border-puma-border/30 px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full ${tx.positive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <i className={`${tx.positive ? 'ri-arrow-down-line text-green-400' : 'ri-arrow-up-line text-red-400'} text-base`}></i>
                  </div>
                  <div>
                    <p className="text-puma-text text-sm font-medium">{tx.type}</p>
                    <p className="text-puma-muted text-xs">{tx.from} · {tx.time}</p>
                  </div>
                </div>
                <p className={`text-sm font-medium ${tx.positive ? 'text-green-400' : 'text-red-400'}`}>{tx.amount}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}