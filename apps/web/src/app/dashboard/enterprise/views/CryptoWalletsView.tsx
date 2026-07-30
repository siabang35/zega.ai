import React from 'react';
import { Key } from 'lucide-react';

interface CryptoWalletsViewProps {
  onTriggerToast: (msg: string) => void;
}

export function CryptoWalletsView({ onTriggerToast }: CryptoWalletsViewProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Key size={16} className="text-indigo-600 dark:text-indigo-400" />
            Autonomous Gas & Multi-Sig Vault Manager
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            Kelola cadangan gas fee dan brankas multi-sig non-custodial untuk transaksi agen otonom.
          </p>
        </div>
        <button
          onClick={() => onTriggerToast('Deposit Gas Solana Dimulai')}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
        >
          + Deposit Gas Vault
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Solana Agent Gas Vault</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">45.8 SOL ($6,870)</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Address: 7xKX...9qLz (Active)</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Ethereum L2 Gas Tank</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">2.4 ETH ($7,200)</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Address: 0x48...91bA (Active)</div>
        </div>
      </div>
    </div>
  );
}
