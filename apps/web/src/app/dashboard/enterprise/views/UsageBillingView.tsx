import React from 'react';
import { CreditCard } from 'lucide-react';

export function UsageBillingView() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <CreditCard size={16} className="text-indigo-600 dark:text-indigo-400" />
            Metered Usage & Enterprise Credit Billing
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            Kalkulasi konsumsi token LLM real-time, kredit API unit, dan histori tagihan.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-500">Monthly Credit Balance:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">$14,250.00 / $20,000.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Current Month LLM Token Usage:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">142.8M Tokens</span>
        </div>
      </div>
    </div>
  );
}
