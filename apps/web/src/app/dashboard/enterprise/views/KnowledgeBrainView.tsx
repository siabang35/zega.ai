import React, { useState } from 'react';
import { 
  Brain, Plus, Search, Filter, Database, FileText, Globe, Image, Video,
  TrendingUp, TrendingDown, CheckCircle2, ChevronRight, HardDrive, Layers,
  Lock, RefreshCw, Folder, Server
} from 'lucide-react';

interface KnowledgeBrainViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function KnowledgeBrainView({ onTriggerToast }: KnowledgeBrainViewProps) {
  const [activeTab, setActiveTab] = useState('collections');
  const [selectedCollection, setSelectedCollection] = useState('Company Policy');

  const collections = [
    { name: 'Company Policy', count: '256 docs', color: 'bg-indigo-50 text-indigo-600' },
    { name: 'HR Knowledge', count: '142 docs', color: 'bg-pink-50 text-pink-600' },
    { name: 'Financial Reports', count: '98 docs', color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Product Documentation', count: '312 docs', color: 'bg-sky-50 text-sky-600' },
    { name: 'Market Research', count: '178 docs', color: 'bg-amber-50 text-amber-600' },
    { name: 'Legal Documents', count: '74 docs', color: 'bg-purple-50 text-purple-600' },
    { name: 'Customer Insights', count: '156 docs', color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Knowledge Hub
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Qdrant Vector Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralize, manage and power your enterprise knowledge
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search knowledge..."
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
            />
          </div>
          <button 
            onClick={() => onTriggerToast && onTriggerToast('Opening Knowledge Import Wizard...')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Knowledge</span>
          </button>
        </div>
      </div>

      {/* SUB TABS & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          {[
            { id: 'collections', label: 'Collections' },
            { id: 'documents', label: 'Documents' },
            { id: 'datasets', label: 'Datasets' },
            { id: 'websites', label: 'Websites' },
            { id: 'databases', label: 'Databases' },
            { id: 'images', label: 'Images' },
            { id: 'videos', label: 'Videos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold">
            <option>All Collections</option>
          </select>
          <select className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold">
            <option>All Owners</option>
          </select>
          <select className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold">
            <option>All Types</option>
          </select>
          <select className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold">
            <option>Sort: Recently Updated</option>
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT: COLLECTIONS SIDEBAR + CENTER TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* COLLECTIONS LIST SIDEBAR */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Collections</h2>
            <button 
              onClick={() => onTriggerToast && onTriggerToast('Creating new Collection...')}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + New Collection
            </button>
          </div>

          <div className="space-y-1">
            {collections.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCollection(c.name)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCollection === c.name
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder size={14} className={selectedCollection === c.name ? 'text-indigo-500' : 'text-slate-400'} />
                  <span>{c.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER TABLE (3 COLS) */}
        <div className="lg:col-span-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">{selectedCollection}</h2>
              <span className="text-[10px] text-slate-400 font-mono">Collection Details</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Vectorized
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[10.5px]">
                  <th className="py-2 px-2">Collection</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">Documents</th>
                  <th className="py-2 px-2">Chunks</th>
                  <th className="py-2 px-2">Embeddings</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Updated</th>
                  <th className="py-2 px-2 text-right">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {[
                  { name: 'Company Policy', type: 'Document', docs: '256', chunks: '12,430', embed: '24.6M', status: 'Indexed', updated: '2h ago', owner: 'Wildan A.' },
                  { name: 'HR Knowledge', type: 'Document', docs: '142', chunks: '8,921', embed: '17.2M', status: 'Indexed', updated: '4h ago', owner: 'Sarah K.' },
                  { name: 'Financial Reports', type: 'Document', docs: '98', chunks: '6,210', embed: '11.8M', status: 'Indexed', updated: '6h ago', owner: 'Alex M.' },
                  { name: 'Product Documentation', type: 'Document', docs: '312', chunks: '18,923', embed: '35.7M', status: 'Indexed', updated: '8h ago', owner: 'Wildan A.' },
                  { name: 'Market Research', type: 'Website', docs: '178', chunks: '11,002', embed: '20.1M', status: 'Indexed', updated: '12h ago', owner: 'Elena R.' },
                  { name: 'Legal Documents', type: 'Document', docs: '74', chunks: '4,112', embed: '7.8M', status: 'Indexed', updated: '1d ago', owner: 'Sarah K.' },
                  { name: 'Database', type: 'Database', docs: '156', chunks: '9,876', embed: '16.4M', status: 'Indexed', updated: '1d ago', owner: 'Alex M.' },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Folder size={14} className="text-indigo-500" />
                      <span>{row.name}</span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-medium">{row.type}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-700 dark:text-slate-300 font-semibold">{row.docs}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-700 dark:text-slate-300">{row.chunks}</td>
                    <td className="py-2.5 px-2 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{row.embed}</td>
                    <td className="py-2.5 px-2">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-400 text-[10px]">{row.updated}</td>
                    <td className="py-2.5 px-2 text-right font-medium text-slate-600 dark:text-slate-400">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOTTOM KPI STRIP (6 STATS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Collections</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">42</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">▲ 12%</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Documents</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">1,216</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">▲ 18%</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chunks</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">81,474</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">▲ 24%</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Embeddings</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">142.6M</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">▲ 21%</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg. Retrieval</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">45ms</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">▼ 8%</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Storage Used</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">2.34 TB</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">▲ 9%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
