import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function AiSafetyView() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" />
            OWASP AI Safety & Prompt Injection Guardrails
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            Filter ancaman real-time, masking data PII, dan moderasi output LLM.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-500">Active Firewall Status:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">● Active (0 Prompt Injections Blocked Today)</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-slate-500">Standards Compliance:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">SOC2 Type II, ISO 27001, OWASP Top 10 LLM</span>
        </div>
      </div>
    </div>
  );
}
