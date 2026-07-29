import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle2, Clock, Calendar, ArrowUpRight, 
  Search, SlidersHorizontal, ShieldCheck, Zap, Plus, X
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { AgentMetric } from '../types';
import { SupabaseDashboardService } from '../services/supabaseService';

export function AgentRosterView() {
  const [agents, setAgents] = useState<AgentMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newAgentName, setNewAgentName] = useState<string>('');
  const [newAgentRole, setNewAgentRole] = useState<string>('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const data = await SupabaseDashboardService.getAgents();
    setAgents(data);
    setLoading(false);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentRole) return;

    await SupabaseDashboardService.createAgent({
      name: newAgentName,
      role: newAgentRole,
      avatar: '🤖',
    });

    setNewAgentName('');
    setNewAgentRole('');
    setIsCreateModalOpen(false);
    loadAgents();
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = {
    labels: agents.map(a => a.name.toUpperCase()),
    datasets: [
      {
        label: 'Success Rate (%)',
        data: agents.map(a => a.successRate),
        backgroundColor: '#e05638',
        borderRadius: 4,
        barThickness: 12,
      },
      {
        label: 'Avg Resolution (Days)',
        data: agents.map(a => a.avgResolutionDays * 20),
        backgroundColor: '#38BDF8',
        borderRadius: 4,
        barThickness: 12,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'monospace', size: 10 }, color: '#64748B' } },
      y: { grid: { color: 'rgba(226, 232, 240, 0.4)' }, ticks: { font: { family: 'monospace', size: 10 }, color: '#64748B' } },
    },
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Top Header: Matrix & Heatmap Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Heatmap Matrix: Task volume by day */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">TASK VOLUME BY DAY</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time agent execution density heatmap</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">
              LIVE SUPABASE SYNC
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 font-mono text-[10px]">
                  <th className="py-2 pr-3">AGENT</th>
                  <th className="py-2 px-1 text-center">S</th>
                  <th className="py-2 px-1 text-center">M</th>
                  <th className="py-2 px-1 text-center">T</th>
                  <th className="py-2 px-1 text-center">W</th>
                  <th className="py-2 px-1 text-center">T</th>
                  <th className="py-2 px-1 text-center">F</th>
                  <th className="py-2 px-1 text-center">S</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { name: 'COO', values: [1, 5, 10, 12, 15, 11, 2] },
                  { name: 'ECHO', values: [7, 19, 13, 11, 50, 45, 1] },
                  { name: 'FIXR', values: [9, 16, 13, 65, 50, 6, 3] },
                  { name: 'SPARK', values: [8, 8, 41, 56, 50, 45, 6] },
                  { name: 'CLOSI', values: [6, 25, 13, 42, 50, 6, 7] },
                  { name: 'LEDGR', values: [12, 56, 23, 10, 50, 9, 8] },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 pr-3 font-mono font-bold text-slate-900 dark:text-slate-100">{row.name}</td>
                    {row.values.map((val, idx) => (
                      <td key={idx} className="py-1 px-1 text-center">
                        <span className={`inline-flex size-6 items-center justify-center rounded-md font-mono text-[10px] font-bold ${
                          val > 40 ? 'bg-[#e05638] text-white' :
                          val > 20 ? 'bg-[#e05638]/30 text-slate-900 dark:text-slate-100' :
                          val > 10 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {val}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart.js Success Rate & Time Trend */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">SUCCESS RATE & TIME TREND</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Performance metric benchmark via Chart.js</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#e05638]" /> Success Rate</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#38BDF8]" /> Time Trend</span>
            </div>
          </div>

          <div className="mt-4 h-48 w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Grid of Agent Roster Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            ACTIVE AGENT ROSTER ({filteredAgents.length})
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents..."
                className="h-8 w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 text-xs focus:outline-none focus:border-[#e05638]"
              />
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#e05638] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#c8462b] cursor-pointer"
            >
              <Plus size={14} /> Add Agent
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:border-[#e05638]/50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl">
                    {agent.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{agent.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{agent.role}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">Task this week</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{agent.tasksThisWeek}</div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">Open Ticket</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{agent.openTickets}</div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">Success Rate</div>
                  <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{agent.successRate}%</div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">Avg Resolution</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{agent.avgResolutionDays} Days</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono text-[10px] uppercase">LAST ACTIVITY</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[170px]">{agent.lastActivity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create New Agent Supabase Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md dark:shadow-black/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create New Autonomous Agent</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Compliance Guard"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#e05638]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Agent Role / Description</label>
                <input
                  type="text"
                  required
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder="e.g. Audits EU General Data Protection Regulation"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#e05638]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#e05638] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#c8462b] cursor-pointer"
                >
                  Save to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
