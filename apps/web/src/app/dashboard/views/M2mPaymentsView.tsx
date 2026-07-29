import React, { useState } from 'react';
import { 
  CreditCard, ArrowUpRight, CheckCircle2, ShieldCheck, 
  Zap, RefreshCw, Layers, DollarSign, Wallet, ArrowRight,
  Activity, Clock, Lock, Globe, Server, Check, Copy
} from 'lucide-react';

export function M2mPaymentsView() {
  const [activeTab, setActiveTab] = useState<'x402' | 'stripe' | 'solana'>('x402');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
              MACHINE-TO-MACHINE (M2M) PAYMENT PROTOCOLS
            </h2>
            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              ● Active Gateway
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Autonomous agent micro-transactions, non-custodial Stripe merchant payouts, and Solana Web3 micro-settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: 'x402', label: 'x402 Protocol', icon: Zap },
            { id: 'stripe', label: 'Stripe Non-Custodial', icon: CreditCard },
            { id: 'solana', label: 'Solana Kits', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                    : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Protocol Metric Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>HTTP 402 MICRO-PAYMENTS</span>
            <Zap size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-2">$1,420.85</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">+14.2% Autonomous volume</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>STRIPE CONNECT PAYOUTS</span>
            <CreditCard size={14} className="text-sky-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-2">$18,940.00</div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono mt-1">Non-custodial merchant direct</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>SOLANA AGENT SETTLEMENTS</span>
            <Wallet size={14} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-2">1,248.5 SOL</div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-1">~ $187,275 USDC equivalency</div>
        </div>
      </div>

      {/* Protocol Detail Content */}
      {activeTab === 'x402' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">x402 Payment Required Telemetry</h3>
              <p className="text-xs text-slate-500">Machine-readable paywall for AI-to-AI agent API calls.</p>
            </div>
            <span className="font-mono text-xs text-slate-400">Endpoint: https://api.zega.ai/x402/v1</span>
          </div>

          <div className="space-y-3">
            {[
              { id: 'tx_89124', agent: 'Finance Agent #1', target: 'Tax Data API', cost: '$0.004', status: '200 OK (Paid)', time: '2s ago' },
              { id: 'tx_89123', agent: 'Sales Agent #3', target: 'LinkedIn Enrichment', cost: '$0.012', status: '200 OK (Paid)', time: '14s ago' },
              { id: 'tx_89122', agent: 'Research Agent #2', target: 'Academic Index', cost: '$0.002', status: '200 OK (Paid)', time: '45s ago' },
              { id: 'tx_89121', agent: 'Support Agent #4', target: 'Translation Engine', cost: '$0.001', status: '200 OK (Paid)', time: '1m ago' },
            ].map((tx) => (
              <div key={tx.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{tx.agent} → {tx.target}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">TX: {tx.id} • {tx.time}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{tx.cost}</span>
                  <div className="text-[10px] text-slate-500">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stripe' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Non-Custodial Stripe Connect Integration</h3>
              <p className="text-xs text-slate-500">Direct merchant settlement without third-party custody holding.</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Connected (acct_1N89412)
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100">Merchant Account Credentials</div>
              <div className="text-slate-500 text-[11px]">Publishable Key: pk_live_51N89412...</div>
              <button 
                onClick={() => handleCopy('pk_live_51N89412941294', 'stripe')}
                className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                {copied === 'stripe' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied === 'stripe' ? 'Copied Key' : 'Copy Key'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100">Payout Schedule & Auto-Sweep</div>
              <div className="text-slate-500 text-[11px]">Frequency: Daily Rolling (T+2)</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Auto-Sweep Active (100% Direct Payout)</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'solana' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Solana Agent Kits & Web3 Micro-Settlement</h3>
              <p className="text-xs text-slate-500">Instant sub-cent settlement via Solana Mainnet-Beta.</p>
            </div>
            <span className="font-mono text-xs text-slate-400">Wallet: 7xKX...9a12</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="text-slate-400">SOL BALANCE</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">14.285 SOL</div>
              <div className="text-[10px] text-emerald-500">Gas balance healthy</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="text-slate-400">USDC SPL BALANCE</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">4,250.00 USDC</div>
              <div className="text-[10px] text-sky-500">Instant agent settlements enabled</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
