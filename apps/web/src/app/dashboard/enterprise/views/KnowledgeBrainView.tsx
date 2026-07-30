import React from 'react';
import { Brain } from 'lucide-react';

interface KnowledgeBrainViewProps {
  onTriggerToast: (msg: string) => void;
}

export function KnowledgeBrainView({ onTriggerToast }: KnowledgeBrainViewProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Brain size={16} className="text-indigo-600 dark:text-indigo-400" />
            Enterprise Knowledge & Vector RAG Indexing
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            Kelola basis data vektor, parameter chunking, dan konteks memori kognitif agen.
          </p>
        </div>
        <button
          onClick={() => onTriggerToast('Sinkronisasi Vektor RAG Dimulai')}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold cursor-pointer"
        >
          Sync Knowledge Base
        </button>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-500">Active Vector Database:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">Qdrant Cluster (34.2M Vektor)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Embedding Model:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">text-embedding-3-large (3072 dim)</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-slate-500">Status Indexing:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Synced & Live (142kb/s)</span>
        </div>
      </div>
    </div>
  );
}
