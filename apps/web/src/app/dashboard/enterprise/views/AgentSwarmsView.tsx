import React from 'react';
import { Layers } from 'lucide-react';

interface AgentSwarmsViewProps {
  onTriggerToast: (msg: string) => void;
}

export function AgentSwarmsView({ onTriggerToast }: AgentSwarmsViewProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
            Hierarchical Agent Swarms & Team Orchestration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            Topologi tim agen otonom dengan koordinasi Leader-Worker dan konsensus otomatis.
          </p>
        </div>
        <button
          onClick={() => onTriggerToast('Buat Swarm Agen Baru Dimulai')}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
        >
          + Buat Swarm Agen Baru
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Swarm #1: Financial Audit Team</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
              Running
            </span>
          </div>
          <div className="text-slate-500 font-normal">5 Agen • Leader: Finance Master Agent</div>
          <div className="text-slate-700 dark:text-slate-300 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
            Status: Autonomous Executing (99.4% Consensus)
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Swarm #2: B2B Sales Lead Outreach</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
              Active
            </span>
          </div>
          <div className="text-slate-500 font-normal">8 Agen • Leader: CRM Dispatcher Agent</div>
          <div className="text-slate-700 dark:text-slate-300 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
            Status: 14,280 Kontak Terproses
          </div>
        </div>
      </div>
    </div>
  );
}
