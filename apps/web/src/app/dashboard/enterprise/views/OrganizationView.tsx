import React, { useState } from 'react';
import {
  Building,
  Plus,
  Search,
  Users,
  Folder,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  TrendingUp,
  Filter
} from 'lucide-react';

interface OrganizationViewProps {
  onTriggerToast?: (msg: string) => void;
}

interface OrgItem {
  id: string;
  name: string;
  plan: string;
  isCurrent?: boolean;
  members: number;
  projects: number;
  status: 'Active' | 'Pending' | 'Inactive';
}

export function OrganizationView({ onTriggerToast }: OrganizationViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('org_1');

  const [orgs, setOrgs] = useState<OrgItem[]>([
    { id: 'org_1', name: 'Acme Enterprise', plan: 'Enterprise Plan', isCurrent: true, members: 15, projects: 8, status: 'Active' },
    { id: 'org_2', name: 'Zega AI Labs', plan: 'Team Plan', members: 12, projects: 3, status: 'Active' },
    { id: 'org_3', name: 'InnovateX Corp', plan: 'Enterprise Plan', members: 28, projects: 7, status: 'Active' },
    { id: 'org_4', name: 'NextGen Solutions', plan: 'Team Plan', members: 9, projects: 2, status: 'Pending' },
    { id: 'org_5', name: 'DataPilot Analytics', plan: 'Team Plan', members: 6, projects: 1, status: 'Active' },
    { id: 'org_6', name: 'BuildWithAI Inc', plan: 'Enterprise Plan', members: 16, projects: 4, status: 'Inactive' },
    { id: 'org_7', name: 'Stark Industries', plan: 'Team Plan', members: 10, projects: 2, status: 'Inactive' },
  ]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (onTriggerToast) onTriggerToast(`${label} disalin ke clipboard!`);
  };

  const handleCreateOrg = () => {
    if (onTriggerToast) onTriggerToast('Modal Tambah Organisasi Dibuka!');
  };

  const filteredOrgs = orgs.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedOrg = orgs.find(o => o.id === selectedOrgId) || orgs[0];

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Organizations
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your organizations and their settings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizations..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
            />
          </div>

          <button
            onClick={handleCreateOrg}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>New Organization</span>
          </button>
        </div>
      </div>

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Organizations */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Organizations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">7</span>
            <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} />
              <span>16.7%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        {/* Active Organizations */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Active Organizations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">6</span>
            <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} />
              <span>20%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        {/* Total Members */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Members</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">128</span>
            <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} />
              <span>12.5%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        {/* Total Projects */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Projects</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">32</span>
            <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} />
              <span>10.8%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>
      </div>

      {/* TWO COLUMN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: ALL ORGANIZATIONS LIST */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">All Organizations</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none">
                <option>All</option>
                <option>Active</option>
                <option>Pending</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {filteredOrgs.map((o) => {
              const isSelected = o.id === selectedOrgId;
              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrgId(o.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                      : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                      {o.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{o.name}</span>
                        {o.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">{o.plan}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="hidden sm:inline font-mono text-[11px]">{o.members} Members</span>
                    <span className="hidden sm:inline font-mono text-[11px]">{o.projects} Projects</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
                          : o.status === 'Pending'
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span>Showing 1 to {filteredOrgs.length} of {orgs.length} organizations</span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-xs">1</span>
              <button className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED ORGANIZATION DETAILS */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 shadow-none">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
              {selectedOrg.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{selectedOrg.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                  ● Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedOrg.plan}</p>
            </div>
          </div>

          {/* Org Details Info */}
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider block">Organization ID</span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-mono text-[11px] mt-1">
                <span className="text-slate-700 dark:text-slate-300 truncate">org_01H8QZ6VJ7GJ6JZVYB8K3M4N9WZ</span>
                <button
                  onClick={() => copyToClipboard('org_01H8QZ6VJ7GJ6JZVYB8K3M4N9WZ', 'Organization ID')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider block">Created</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Jan 10, 2025</p>
            </div>

            {/* Owner Section (Danz Assyidq per user request) */}
            <div>
              <span className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider block">Owner</span>
              <div className="flex items-center gap-2.5 mt-1.5">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                  alt="Danz Assyidq"
                  className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Danz Assyidq</p>
                  <p className="text-[10.5px] text-slate-400 font-mono">danz@acme.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Overview Progress Bars */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Usage Overview</h4>

            <div className="space-y-2 text-xs font-medium">
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Members</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">45 / 100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Projects</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">8 / 20</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>API Calls (This Month)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">2.45M / 10M</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '24.5%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Storage</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">182.4 GB / 1TB</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '18.2%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Link */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onTriggerToast && onTriggerToast('Membuka Pengaturan Organisasi...')}
              className="w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Organization Settings</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
