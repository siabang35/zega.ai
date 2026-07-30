import React from 'react';
import { Target } from 'lucide-react';

interface AgentEvalsViewProps {
  onTriggerToast: (msg: string) => void;
}

export function AgentEvalsView({ onTriggerToast }: AgentEvalsViewProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Target size={16} className="text-indigo-600 dark:text-indigo-400" />
            Automated Agent Evals & Benchmark Testing
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            Deteksi halusinasi otomatis, skor akurasi agen, dan pengujian regresi.
          </p>
        </div>
        <button
          onClick={() => onTriggerToast('Jalankan Eval Test Suite')}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold cursor-pointer"
        >
          Run Benchmark Suite
        </button>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-500">Overall Accuracy Score:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">98.6%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Hallucination Rate:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">0.12%</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-slate-500">Latest Eval Run:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">Passed 420 Test Suites (100%)</span>
        </div>
      </div>
    </div>
  );
}
