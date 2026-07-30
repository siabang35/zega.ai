import React, { useState } from 'react';
import { 
  Bot, Plus, Search, Filter, Star, Sparkles, TrendingUp, TrendingDown,
  CheckCircle2, ChevronRight, Users, LayoutGrid, List, MoreVertical,
  ShieldCheck, ArrowUpRight, Zap, Play
} from 'lucide-react';

interface AgentSwarmsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function AgentSwarmsView({ onTriggerToast }: AgentSwarmsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'marketplace' | 'my_agents' | 'teams' | 'templates'>('marketplace');

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              AI Agents
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              638 Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Build, deploy and manage your AI workforce
          </p>
        </div>

        <button 
          onClick={() => onTriggerToast && onTriggerToast('Opening Agent Creation Wizard...')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={14} />
          <span>Create Agent</span>
        </button>
      </div>

      {/* SUB TABS & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          {[
            { id: 'marketplace', label: 'Marketplace' },
            { id: 'my_agents', label: 'My Agents' },
            { id: 'teams', label: 'Teams' },
            { id: 'templates', label: 'Templates' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH & DROPDOWNS */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents..."
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
            />
          </div>
          <select className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none">
            <option>All Categories</option>
            <option>Sales & Marketing</option>
            <option>Finance & Accounting</option>
            <option>Support & Operations</option>
          </select>
          <select className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none">
            <option>All Status</option>
            <option>Active</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* KPI STRIP (5 METRICS) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Agents</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">638</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp size={11} className="mr-0.5" /> ▲ 18.2%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400">vs last 7 days</span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Agents</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">421</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp size={11} className="mr-0.5" /> ▲ 15.7%
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deployed</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">198</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp size={11} className="mr-0.5" /> ▲ 12.4%
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Drafts</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">42</span>
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center">
              <TrendingDown size={11} className="mr-0.5" /> ▼ 5.1%
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Runs (This Month)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">2.43M</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp size={11} className="mr-0.5" /> ▲ 28.5%
            </span>
          </div>
        </div>
      </div>

      {/* RECOMMENDED FOR YOU SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Recommended For You
          </h2>
          <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              name: 'Sales Agent',
              popular: true,
              desc: 'Automates lead management, CRM updates, and sales outreach.',
              tags: ['Sales', 'CRM'],
              rating: '4.9',
              reviews: '124',
            },
            {
              name: 'Finance Agent',
              popular: false,
              desc: 'Handles invoices, payments, reconciliation, and reporting.',
              tags: ['Finance', 'Accounting'],
              rating: '4.8',
              reviews: '98',
            },
            {
              name: 'Support Agent',
              popular: false,
              desc: 'Resolves customer issues and manages support workflows.',
              tags: ['Support', 'ITSM'],
              rating: '4.8',
              reviews: '155',
            },
            {
              name: 'Research Agent',
              popular: false,
              desc: 'Conducts research and generates insights from multiple sources.',
              tags: ['Research', 'Analytics'],
              rating: '4.9',
              reviews: '87',
            },
          ].map((agent) => (
            <div key={agent.name} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Bot size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{agent.name}</span>
                  </div>
                  {agent.popular && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {agent.desc}
                </p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  {agent.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9.5px] font-semibold text-slate-600 dark:text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{agent.rating}</span>
                  <span className="text-slate-400 font-normal">({agent.reviews})</span>
                </div>
                <button 
                  onClick={() => onTriggerToast && onTriggerToast(`Deploying ${agent.name}...`)}
                  className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-colors cursor-pointer"
                >
                  Deploy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SECTION: ALL AGENTS TABLE & TOP PERFORMERS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ALL AGENTS DATA TABLE (3 COLS) */}
        <div className="lg:col-span-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">All Agents</h2>
            <button className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all agents</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-[10.5px]">
                  <th className="py-2 px-2">Agent</th>
                  <th className="py-2 px-2">Category</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Health</th>
                  <th className="py-2 px-2">Runs (7D)</th>
                  <th className="py-2 px-2">Success Rate</th>
                  <th className="py-2 px-2">Owner</th>
                  <th className="py-2 px-2 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {[
                  { name: 'Marketing Agent', cat: 'Marketing', status: 'Active', health: '99.8%', runs: '24,892', success: '98.7%', owner: 'Wildan A.', updated: '2h ago' },
                  { name: 'HR Agent', cat: 'HR', status: 'Active', health: '99.6%', runs: '18,392', success: '98.1%', owner: 'Sarah K.', updated: '5h ago' },
                  { name: 'Data Analyst Agent', cat: 'Analytics', status: 'Active', health: '99.9%', runs: '15,208', success: '99.2%', owner: 'Alex M.', updated: '1d ago' },
                  { name: 'Legal Agent', cat: 'Legal', status: 'Active', health: '99.7%', runs: '8,921', success: '97.9%', owner: 'Elena R.', updated: '1d ago' },
                  { name: 'SEO Agent', cat: 'Marketing', status: 'Active', health: '99.5%', runs: '7,214', success: '97.1%', owner: 'Wildan A.', updated: '2d ago' },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Bot size={14} className="text-indigo-500" />
                      <span>{row.name}</span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-medium">{row.cat}</td>
                    <td className="py-2.5 px-2">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-700 dark:text-slate-300 font-semibold">{row.health}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-700 dark:text-slate-300">{row.runs}</td>
                    <td className="py-2.5 px-2 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{row.success}</td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 font-medium">{row.owner}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-400 text-[10px]">{row.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP PERFORMERS LEADERBOARD (1 COL) */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Top Performers</h2>
            <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View leaderboard</button>
          </div>

          <div className="space-y-2.5">
            {[
              { rank: 1, name: 'Sales Agent', score: '99.9%' },
              { rank: 2, name: 'Finance Agent', score: '99.8%' },
              { rank: 3, name: 'Data Analyst Agent', score: '99.7%' },
              { rank: 4, name: 'Research Agent', score: '99.6%' },
              { rank: 5, name: 'Support Agent', score: '99.5%' },
            ].map((item) => (
              <div key={item.rank} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <span className="size-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center">
                    {item.rank}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
