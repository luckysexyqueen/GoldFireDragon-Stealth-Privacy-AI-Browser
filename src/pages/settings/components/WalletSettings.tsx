import { useState } from 'react';

export default function WalletSettings() {
  const [walletAddress, setWalletAddress] = useState('');
  const [micropayments, setMicropayments] = useState(false);
  const [paymentPointer, setPaymentPointer] = useState('');
  const [autoPayThreshold, setAutoPayThreshold] = useState('0.01');
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);

  return (
    <div className="p-6 max-w-2xl">
      <h3 className="text-puma-text text-xl font-bold mb-2">Wallet</h3>
      <p className="text-puma-muted text-sm mb-6">Web3 wallet and payment settings</p>

      {/* Payment Master Toggle */}
      <div className="mb-6">
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-puma-card">
                <i className="ri-bank-card-line text-puma-accent text-xl"></i>
              </div>
              <div>
                <p className="text-puma-text text-sm font-semibold">결제 기능 활성화</p>
                <p className="text-puma-muted text-xs mt-0.5">
                  {paymentsEnabled
                    ? '결제 기능이 활성화되어 있습니다'
                    : '현재 결제 기능이 비활성화됨 · 완전 무료 모드'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPaymentsEnabled(!paymentsEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                paymentsEnabled ? 'bg-puma-accent' : 'bg-puma-border/50'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  paymentsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              ></span>
            </button>
          </div>

          {!paymentsEnabled && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-green-400/10 border border-green-400/20 rounded-lg">
                <i className="ri-checkbox-circle-line text-green-400 text-sm"></i>
                <div>
                  <p className="text-green-400 text-xs font-semibold">완전 무료 모드 활성화됨</p>
                  <p className="text-green-400/70 text-xs">모든 AI 기능을 무료로 사용합니다. 결제 없이 이용 가능합니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment features - only shown when enabled */}
      {paymentsEnabled && (
        <>
          {/* Connect Wallet */}
          <div className="mb-6">
            <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Connect Wallet</h4>
            <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-4">
              {walletAddress ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-puma-text text-sm font-medium">Connected</p>
                    <p className="text-puma-muted text-xs font-mono mt-0.5">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>
                  </div>
                  <button
                    onClick={() => setWalletAddress('')}
                    className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-puma-muted text-sm">No wallet connected</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['MetaMask', 'WalletConnect', 'Coinbase', 'Phantom'].map((w) => (
                      <button
                        key={w}
                        onClick={() => setWalletAddress('0x' + Math.random().toString(16).slice(2, 42))}
                        className="flex items-center gap-2 px-3 py-2.5 bg-puma-card border border-puma-border/30 rounded-lg text-sm text-puma-text hover:border-puma-accent transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <i className="ri-wallet-line text-puma-accent text-sm"></i>
                        </div>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Micropayments */}
          <div className="mb-6">
            <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Micropayments (Interledger)</h4>
            <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-puma-border/20">
                <div>
                  <p className="text-puma-text text-sm font-medium">Enable Micropayments</p>
                  <p className="text-puma-muted text-xs">Pay content creators instead of seeing ads</p>
                </div>
                <button
                  onClick={() => setMicropayments(!micropayments)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                    micropayments ? 'bg-puma-accent' : 'bg-puma-border/50'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      micropayments ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  ></span>
                </button>
              </div>

              {micropayments && (
                <>
                  <div className="px-4 py-3.5 border-b border-puma-border/20">
                    <p className="text-puma-text text-sm font-medium mb-2">Payment Pointer</p>
                    <input
                      type="text"
                      value={paymentPointer}
                      onChange={(e) => setPaymentPointer(e.target.value)}
                      placeholder="$wallet.example.com/alice"
                      className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text placeholder-puma-muted/50 focus:outline-none focus:border-puma-accent"
                    />
                  </div>
                  <div className="px-4 py-3.5">
                    <p className="text-puma-text text-sm font-medium mb-2">Auto-pay Threshold (USD)</p>
                    <input
                      type="number"
                      value={autoPayThreshold}
                      onChange={(e) => setAutoPayThreshold(e.target.value)}
                      step="0.001"
                      min="0"
                      className="w-full bg-puma-bg border border-puma-border/30 rounded-lg px-3 py-2 text-sm text-puma-text focus:outline-none focus:border-puma-accent"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ENS / HNS */}
          <div className="mb-6">
            <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">Web3 Domains</h4>
            <div className="bg-puma-surface rounded-xl border border-puma-border/30 overflow-hidden">
              {[
                { label: 'ENS Domains', desc: 'Ethereum Name Service (.eth)', icon: 'ri-coin-line' },
                { label: 'HNS Domains', desc: 'Handshake Name Service', icon: 'ri-links-line' },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-4 px-4 py-3.5 ${idx === 0 ? 'border-b border-puma-border/20' : ''}`}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-puma-card">
                    <i className={`${item.icon} text-puma-accent text-base`}></i>
                  </div>
                  <div>
                    <p className="text-puma-text text-sm font-medium">{item.label}</p>
                    <p className="text-puma-muted text-xs">{item.desc}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Free Mode Info */}
      {!paymentsEnabled && (
        <div className="bg-puma-surface rounded-xl border border-puma-border/30 p-5">
          <h4 className="text-puma-accent text-sm font-semibold mb-3 uppercase tracking-wide">무료 AI 서비스</h4>
          <div className="space-y-2">
            {[
              { icon: 'ri-gift-line', name: 'Groq', desc: '무료 고속 AI API' },
              { icon: 'ri-google-line', name: 'Google Gemini', desc: '무료 티어 제공' },
              { icon: 'ri-server-line', name: 'Ollama', desc: '완전 로컬 무료 실행' },
              { icon: 'ri-route-line', name: 'OpenRouter', desc: '무료 모델 다수 제공' },
              { icon: 'ri-cloud-line', name: 'Cohere', desc: '무료 티어 제공' },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3 px-3 py-2.5 bg-puma-bg rounded-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-puma-card">
                  <i className={`${s.icon} text-puma-accent text-sm`}></i>
                </div>
                <div>
                  <p className="text-puma-text text-xs font-semibold">{s.name}</p>
                  <p className="text-puma-muted text-xs">{s.desc}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-green-400/15 text-green-400 text-[10px] rounded-full font-medium">무료</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-puma-muted text-xs mt-3 text-center">
            Settings → AI Assistant → Free AI Services 에서 설정하세요
          </p>
        </div>
      )}
    </div>
  );
}
