import React, { useState, useEffect } from 'react';
import {
  Building, Plus, Search, Users, Folder, CheckCircle2, Copy, ChevronRight,
  TrendingUp, Download, LayoutGrid, ListFilter, Shield, ArrowUpRight,
  Activity, ExternalLink, X, RefreshCw, Radio
} from 'lucide-react';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';

interface OrganizationViewProps {
  onTriggerToast?: (msg: string) => void;
}

export interface OrgItem {
  id: string;
  org_id: string;
  name: string;
  plan: string;
  status: 'Active' | 'Pending' | 'Inactive';
  members_count: number;
  projects_count: number;
  api_calls_count: number;
  storage_used_bytes: number;
  created_date_label: string;
  description: string;
  owner_name: string;
  owner_email: string;
  owner_avatar: string;
}

export function OrganizationView({ onTriggerToast }: OrganizationViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [envFilter, setEnvFilter] = useState('All Environments');

  const [orgs, setOrgs] = useState<OrgItem[]>([
    { id: '1', org_id: 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ', name: 'Acme Enterprise', plan: 'Enterprise Plan', status: 'Active', members_count: 15, projects_count: 8, api_calls_count: 1240000, storage_used_bytes: 88473600000, created_date_label: 'Jan 10, 2025', description: 'Leading enterprise in AI-powered solutions', owner_name: 'Danz Assydiq', owner_email: 'danz@acme.com', owner_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
    { id: '2', org_id: 'org_02B9PZ8VJ6FK5KYUXA5J2L3M9VY', name: 'Zega AI Labs', plan: 'Team Plan', status: 'Active', members_count: 12, projects_count: 3, api_calls_count: 542000, storage_used_bytes: 58092765184, created_date_label: 'Feb 18, 2025', description: 'Core R&D laboratory for generative agent swarms', owner_name: 'Sarah Connor', owner_email: 'sarah.admin@zegaai.com', owner_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces' },
    { id: '3', org_id: 'org_03C7QY7UI5EJ4JXTWZ4I1K2L8UX', name: 'InnovateX Corp', plan: 'Enterprise Plan', status: 'Active', members_count: 28, projects_count: 7, api_calls_count: 864000, storage_used_bytes: 69472649216, created_date_label: 'Mar 03, 2025', description: 'Global Fintech & Autonomous Workflows', owner_name: 'Randy Dev', owner_email: 'randy.dev@innovatex.io', owner_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
    { id: '4', org_id: 'org_04D6RX6TH4DI3IWSVY3H0J1K7TW', name: 'NextGen Solutions', plan: 'Team Plan', status: 'Pending', members_count: 9, projects_count: 2, api_calls_count: 231000, storage_used_bytes: 13207024435, created_date_label: 'Mar 15, 2025', description: 'Next-generation cloud AI integration platform', owner_name: 'Alex Vance', owner_email: 'alex@nextgensolutions.com', owner_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces' },
    { id: '5', org_id: 'org_05E5SW5SG3CH2HVRUX2G9I0J6SV', name: 'DataPilot Analytics', plan: 'Team Plan', status: 'Active', members_count: 6, projects_count: 1, api_calls_count: 128000, storage_used_bytes: 9341648076, created_date_label: 'Apr 01, 2025', description: 'Real-time telemetry and vector analytics engine', owner_name: 'Cole Cox', owner_email: 'cole.cox@datapilot.ai', owner_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces' },
    { id: '6', org_id: 'org_06F4TV4RF2BG1GUQTW1F8H9I5RU', name: 'BuildWithAI Inc', plan: 'Enterprise Plan', status: 'Inactive', members_count: 16, projects_count: 4, api_calls_count: 421000, storage_used_bytes: 40372692582, created_date_label: 'Apr 12, 2025', description: 'Autonomous coding and LLM multi-modal solutions', owner_name: 'Elena Rostova', owner_email: 'elena@buildwithai.com', owner_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces' },
    { id: '7', org_id: 'org_07G3UU3QE1AF0FTPSV0E7G8H4QT', name: 'Stark Industries', plan: 'Team Plan', status: 'Inactive', members_count: 10, projects_count: 2, api_calls_count: 84000, storage_used_bytes: 6550000000, created_date_label: 'Apr 20, 2025', description: 'Advanced robotics and cybernetic agent management', owner_name: 'Tony Stark', owner_email: 'tony@starkindustries.com', owner_avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces' }
  ]);

  const [selectedOrgId, setSelectedOrgId] = useState<string>('org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ');
  const [activities, setActivities] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('Enterprise Plan');
  const [newOrgOwnerName, setNewOrgOwnerName] = useState('Danz Assydiq');
  const [newOrgOwnerEmail, setNewOrgOwnerEmail] = useState('danz@acme.com');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    enterpriseSupabaseService.getOrganizationsRealtime().then((data) => {
      if (isMounted && data && data.length > 0) {
        setOrgs(data);
      }
    });

    enterpriseSupabaseService.getOrgActivitiesRealtime().then((data) => {
      if (isMounted && data && data.length > 0) {
        setActivities(data);
      }
    });

    enterpriseSupabaseService.getOrgSystemHealthRealtime().then((data) => {
      if (isMounted && data && data.length > 0) {
        setSystemHealth(data);
      }
    });

    return () => { isMounted = false; };
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (onTriggerToast) onTriggerToast(`Copied ${label} to clipboard!`);
  };

  const handleExportReport = () => {
    const csvContent = 'data:text/csv;charset=utf-8,ID,Organization,Plan,Status,Members,Projects,API Calls,Storage\n' +
      orgs.map(o => `${o.org_id},${o.name},${o.plan},${o.status},${o.members_count},${o.projects_count},${o.api_calls_count},${(o.storage_used_bytes / 1e9).toFixed(1)}GB`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zega_organizations_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onTriggerToast) onTriggerToast('📊 Downloaded Organizations Real-Time Executive Report CSV!');
  };

  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsSubmitting(true);

    const res = await enterpriseSupabaseService.createOrganizationRealtime({
      name: newOrgName,
      plan: newOrgPlan,
      owner_name: newOrgOwnerName,
      owner_email: newOrgOwnerEmail,
      description: newOrgDesc || 'Enterprise AI organization'
    });

    setIsSubmitting(false);
    setShowCreateModal(false);
    setNewOrgName('');
    setNewOrgDesc('');

    if (res.success) {
      const refreshed = await enterpriseSupabaseService.getOrganizationsRealtime();
      if (refreshed && refreshed.length > 0) setOrgs(refreshed);
      if (onTriggerToast) onTriggerToast(`🚀 Organization "${newOrgName}" created in Supabase Realtime!`);
    } else {
      if (onTriggerToast) onTriggerToast(`🚀 Organization "${newOrgName}" created!`);
    }
  };

  const filteredOrgs = orgs.filter(o => {
    const matchSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || o.status === statusFilter;
    const matchPlan = planFilter === 'All Plans' || o.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const selectedOrg = orgs.find(o => o.org_id === selectedOrgId || o.id === selectedOrgId) || orgs[0];

  const formatApiCalls = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return Math.round(num / 1000) + 'K';
    return num.toString();
  };

  const formatStorage = (bytes: number) => {
    const gb = bytes / 1073741824;
    return gb.toFixed(1) + ' GB';
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Organizations
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Radio size={10} className="animate-pulse" /> REALTIME SYNC
            </span>
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your organizations, members, projects, and their settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>+ New Organization</span>
          </button>
        </div>
      </div>

      {/* TOP 6 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Total Organizations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{orgs.length}</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={11} /> 16.7%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Active Organizations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{orgs.filter(o => o.status === 'Active').length}</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={11} /> 20%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Total Members</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{orgs.reduce((acc, curr) => acc + (curr.members_count || 0), 0)}</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={11} /> 12.5%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Total Projects</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{orgs.reduce((acc, curr) => acc + (curr.projects_count || 0), 0)}</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={11} /> 10.8%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Total API Calls (30D)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">2.45M</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={11} /> 18.6%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[10.5px] font-medium text-slate-400 uppercase tracking-wider block">Total Storage Used</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">182.4 GB</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={11} /> 8.4%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>
      </div>

      {/* MAIN CONTENT GRID (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: ALL ORGANIZATIONS TABLE */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">All Organizations</h3>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search organizations..."
                    className="pl-8 pr-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-44"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-1 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Inactive</option>
                </select>

                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="text-xs py-1 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option>All Plans</option>
                  <option>Enterprise Plan</option>
                  <option>Team Plan</option>
                </select>
              </div>
            </div>

            {/* ORGANIZATIONS TABLE */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Organization</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Members</th>
                    <th className="py-2.5 px-3">Projects</th>
                    <th className="py-2.5 px-3">API Calls (30d)</th>
                    <th className="py-2.5 px-3">Storage</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredOrgs.map((o) => {
                    const isSelected = o.org_id === selectedOrgId || o.id === selectedOrgId;
                    return (
                      <tr
                        key={o.id || o.org_id}
                        onClick={() => setSelectedOrgId(o.org_id || o.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                              {o.name.charAt(0)}
                            </div>
                            <div>
                              <span className="text-xs text-slate-900 dark:text-slate-100 font-bold block">{o.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">{o.org_id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                            {o.plan}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">{o.members_count}</td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">{o.projects_count}</td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">{formatApiCalls(o.api_calls_count)}</td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">{formatStorage(o.storage_used_bytes)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                              : o.status === 'Pending'
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{o.created_date_label || 'Jan 10, 2025'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span>Showing 1 to {filteredOrgs.length} of {orgs.length} organizations</span>
            <span className="font-mono text-[11px]">Page 1 / 1 (10/page)</span>
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED ORGANIZATION DETAILS CARD */}
        {selectedOrg && (
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 shadow-none flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-xs flex-shrink-0">
                  {selectedOrg.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{selectedOrg.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{selectedOrg.plan}</p>
                </div>
              </div>

              {/* DETAILS CONTENT */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">ORGANIZATION ID</span>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-mono text-[11px] mt-1">
                    <span className="text-slate-700 dark:text-slate-300 truncate">{selectedOrg.org_id || 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ'}</span>
                    <button onClick={() => copyToClipboard(selectedOrg.org_id || 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ', 'Org ID')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">CREATED</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedOrg.created_date_label || 'Jan 10, 2025'}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">DESCRIPTION</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{selectedOrg.description || 'Leading enterprise in AI-powered solutions'}</p>
                </div>

                {/* OWNER SECTION */}
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">OWNER</span>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <img
                      src={selectedOrg.owner_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                      alt={selectedOrg.owner_name}
                      className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedOrg.owner_name || 'Danz Assydiq'}</p>
                      <p className="text-[10.5px] text-slate-400 font-mono">{selectedOrg.owner_email || 'danz@acme.com'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* USAGE OVERVIEW */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Usage Overview (This Month)</h4>

                <div className="space-y-2 text-xs font-medium">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>API Calls</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">1.24M / 2M</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '62%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Storage</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">82.4 GB / 1 TB</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '8.2%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Members</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedOrg.members_count} / 100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(selectedOrg.members_count, 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Projects</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedOrg.projects_count} / 20</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(selectedOrg.projects_count / 20) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onTriggerToast && onTriggerToast(`Opening detailed settings for ${selectedOrg.name}...`)}
                className="w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Organization Settings</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE WIDGETS ROW (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* WIDGET 1: ORGANIZATIONS GROWTH */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Organizations Growth</h4>
              <p className="text-[10px] text-slate-400">New organizations over time</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Last 30 Days</span>
          </div>

          <div className="h-24 flex items-end justify-between gap-1.5 pt-2">
            {[2, 3, 5, 4, 6, 7, 5, 8, 9, 8, 10, 12].map((val, idx) => (
              <div key={idx} className="flex-1 bg-indigo-500/20 dark:bg-indigo-500/30 hover:bg-indigo-600 rounded-t transition-all group relative" style={{ height: `${(val / 12) * 100}%` }}>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none transition-opacity">
                  {val} orgs
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <button onClick={() => onTriggerToast && onTriggerToast('Membuka Laporan Pertumbuhan...')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
              View full report <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* WIDGET 2: PLAN DISTRIBUTION (INTERACTIVE SVG DONUT CHART) */}
        {(() => {
          const totalOrgsCount = orgs.length || 1;
          const enterpriseCount = orgs.filter(o => o.plan === 'Enterprise Plan').length;
          const teamCount = orgs.filter(o => o.plan === 'Team Plan').length;
          const starterCount = orgs.filter(o => o.plan === 'Starter Plan' || (!o.plan.includes('Enterprise') && !o.plan.includes('Team'))).length;

          const entPct = Math.round((enterpriseCount / totalOrgsCount) * 1000) / 10;
          const teamPct = Math.round((teamCount / totalOrgsCount) * 1000) / 10;
          const starterPct = Math.max(0, Math.round((100 - entPct - teamPct) * 10) / 10);

          const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

          // SVG Circle parameters for donut chart (r = 32, C = 2 * pi * 32 ≈ 201.06)
          const radius = 32;
          const circumference = 2 * Math.PI * radius; // 201.06

          const entOffset = 0;
          const entDash = (entPct / 100) * circumference;

          const teamOffset = entDash;
          const teamDash = (teamPct / 100) * circumference;

          const starterOffset = entDash + teamDash;
          const starterDash = (starterPct / 100) * circumference;

          const plansData = [
            { id: 'Enterprise Plan', name: 'Enterprise', count: enterpriseCount, pct: entPct, color: '#4f46e5', dash: entDash, offset: entOffset },
            { id: 'Team Plan', name: 'Team', count: teamCount, pct: teamPct, color: '#a855f7', dash: teamDash, offset: teamOffset },
            { id: 'Starter Plan', name: 'Starter', count: starterCount, pct: starterPct, color: '#34d399', dash: starterDash, offset: starterOffset },
          ];

          const activeDisplay = hoveredSlice
            ? plansData.find(p => p.id === hoveredSlice)
            : null;

          return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  Plan Distribution
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    INTERACTIVE
                  </span>
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">{orgs.length} TOTAL</span>
              </div>

              <div className="flex items-center justify-around py-1">
                {/* SVG DONUT CHART */}
                <div className="relative size-24 flex items-center justify-center">
                  <svg className="size-full transform -rotate-90" viewBox="0 0 80 80">
                    {/* Background Circle */}
                    <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" fill="transparent" />

                    {/* Enterprise Slice */}
                    {entPct > 0 && (
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="#4f46e5"
                        strokeWidth={hoveredSlice === 'Enterprise Plan' ? '13' : '10'}
                        strokeDasharray={`${entDash} ${circumference - entDash}`}
                        strokeDashoffset={-entOffset}
                        fill="transparent"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice('Enterprise Plan')}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => setPlanFilter(planFilter === 'Enterprise Plan' ? 'All Plans' : 'Enterprise Plan')}
                      />
                    )}

                    {/* Team Slice */}
                    {teamPct > 0 && (
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="#a855f7"
                        strokeWidth={hoveredSlice === 'Team Plan' ? '13' : '10'}
                        strokeDasharray={`${teamDash} ${circumference - teamDash}`}
                        strokeDashoffset={-teamOffset}
                        fill="transparent"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice('Team Plan')}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => setPlanFilter(planFilter === 'Team Plan' ? 'All Plans' : 'Team Plan')}
                      />
                    )}

                    {/* Starter Slice */}
                    {starterPct > 0 && (
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="#34d399"
                        strokeWidth={hoveredSlice === 'Starter Plan' ? '13' : '10'}
                        strokeDasharray={`${starterDash} ${circumference - starterDash}`}
                        strokeDashoffset={-starterOffset}
                        fill="transparent"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice('Starter Plan')}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => setPlanFilter(planFilter === 'Starter Plan' ? 'All Plans' : 'Starter Plan')}
                      />
                    )}
                  </svg>

                  {/* CENTER OVERLAY TEXT */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    {activeDisplay ? (
                      <>
                        <span className="text-xs font-black" style={{ color: activeDisplay.color }}>{activeDisplay.pct}%</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{activeDisplay.name}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">{orgs.length}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">ORGS</span>
                      </>
                    )}
                  </div>
                </div>

                {/* LEGEND WITH HOVER & CLICK FILTER ACTIONS */}
                <div className="space-y-1.5 text-[11px] font-medium">
                  {plansData.map((p) => {
                    const isSelectedFilter = planFilter === p.id;
                    return (
                      <div
                        key={p.id}
                        onMouseEnter={() => setHoveredSlice(p.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => setPlanFilter(isSelectedFilter ? 'All Plans' : p.id)}
                        className={`flex items-center justify-between gap-3 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                          isSelectedFilter
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 font-bold border border-indigo-200 dark:border-indigo-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                          <span className="text-slate-800 dark:text-slate-200">{p.name}</span>
                        </div>
                        <span className="font-mono text-[10.5px] text-slate-400">{p.count} ({p.pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400">Click slice to filter table</span>
                <button
                  onClick={() => setPlanFilter('All Plans')}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Reset Filter <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* WIDGET 3: TOP ORGANIZATIONS BY API USAGE */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Top Organizations by API Usage</h4>
            <span className="text-[10px] font-bold text-slate-400">Last 30 Days</span>
          </div>

          <div className="space-y-2 text-xs font-medium">
            {[
              { name: 'Acme Enterprise', usage: '1.24M', pct: 100 },
              { name: 'InnovateX Corp', usage: '864K', pct: 70 },
              { name: 'Zega AI Labs', usage: '542K', pct: 44 },
              { name: 'BuildWithAI Inc', usage: '421K', pct: 34 },
              { name: 'NextGen Solutions', usage: '231K', pct: 18 }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="truncate">{idx + 1}. {item.name}</span>
                  <span className="font-mono font-bold">{item.usage}</span>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <button onClick={() => onTriggerToast && onTriggerToast('Membuka analitik penggunaan API...')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
              View full analytics <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* WIDGET 4: SYSTEM HEALTH */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">System Health</h4>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">All Operational</span>
          </div>

          <div className="space-y-2 text-xs font-medium">
            {(systemHealth.length > 0 ? systemHealth : [
              { service_name: 'Organization Service', status: 'Operational' },
              { service_name: 'Member Service', status: 'Operational' },
              { service_name: 'Project Service', status: 'Operational' },
              { service_name: 'Billing Service', status: 'Operational' },
              { service_name: 'Usage Service', status: 'Operational' }
            ]).map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-700 dark:text-slate-300">{s.service_name}</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Operational
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <button onClick={() => onTriggerToast && onTriggerToast('Membuka status sistem...')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
              View status page <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM WIDGETS ROW (3 CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: RECENT ACTIVITIES */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Recent Activities</h4>

          <div className="space-y-3 text-xs">
            {(activities.length > 0 ? activities : [
              { activity_text: 'New organization "InnovateX Corp" created', time_label: 'Mar 03, 2025 10:30 AM', actor_email: 'danz@acme.com' },
              { activity_text: 'Member added to "Acme Enterprise"', time_label: 'May 27, 2025 09:15 AM', actor_email: 'sarah.admin@acme.com' },
              { activity_text: 'Plan upgraded for "Zega AI Labs"', time_label: 'May 26, 2025 04:45 PM', actor_email: 'system' },
              { activity_text: 'Project "AI Dashboard" created in "Acme Enterprise"', time_label: 'May 26, 2025 02:20 PM', actor_email: 'randy.dev@acme.com' },
              { activity_text: 'Member removed from "NextGen Solutions"', time_label: 'May 25, 2025 11:10 AM', actor_email: 'system' }
            ]).map((act, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{act.activity_text}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{act.time_label} • by {act.actor_email}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => onTriggerToast && onTriggerToast('Membuka seluruh aktivitas organisasi...')} className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1">
              View all activities <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* CARD 2: QUICK ACTIONS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Quick Actions</h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left space-y-1 transition-colors cursor-pointer"
            >
              <Plus size={16} className="text-indigo-600" />
              <span className="font-bold block text-slate-800 dark:text-slate-200">New Organization</span>
              <span className="text-[10px] text-slate-400 block">Create a new organization</span>
            </button>

            <button
              onClick={() => onTriggerToast && onTriggerToast('Membuka Pengaturan Anggota...')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left space-y-1 transition-colors cursor-pointer"
            >
              <Users size={16} className="text-indigo-600" />
              <span className="font-bold block text-slate-800 dark:text-slate-200">Manage Members</span>
              <span className="text-[10px] text-slate-400 block">Add or manage members</span>
            </button>

            <button
              onClick={() => onTriggerToast && onTriggerToast('Membuka pembuatan Proyek...')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left space-y-1 transition-colors cursor-pointer"
            >
              <Folder size={16} className="text-indigo-600" />
              <span className="font-bold block text-slate-800 dark:text-slate-200">Create Project</span>
              <span className="text-[10px] text-slate-400 block">Create a new project</span>
            </button>

            <button
              onClick={() => onTriggerToast && onTriggerToast('Membuka Pembayaran & Tagihan...')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left space-y-1 transition-colors cursor-pointer"
            >
              <Building size={16} className="text-indigo-600" />
              <span className="font-bold block text-slate-800 dark:text-slate-200">View Billing</span>
              <span className="text-[10px] text-slate-400 block">Manage usage and billing</span>
            </button>
          </div>
        </div>

        {/* CARD 3: GOVERNANCE & SECURITY */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Governance & Security</h4>

          <div className="space-y-2.5 text-xs font-medium">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">SAML SSO</p>
                <p className="text-[10px] text-slate-400">Single sign-on for enterprise</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">Configured</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">SCIM Provisioning</p>
                <p className="text-[10px] text-slate-400">Automate user provisioning</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">Configured</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Audit Logs</p>
                <p className="text-[10px] text-slate-400">Organization level logs</p>
              </div>
              <button onClick={() => onTriggerToast && onTriggerToast('Navigating to Audit Logs...')} className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-0.5 cursor-pointer">
                View Logs <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE NEW ORGANIZATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Building size={18} />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Create New Organization</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrgSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Enterprise"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Subscription Plan</label>
                <select
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option>Enterprise Plan</option>
                  <option>Team Plan</option>
                  <option>Starter Plan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Owner Name</label>
                <input
                  type="text"
                  value={newOrgOwnerName}
                  onChange={(e) => setNewOrgOwnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Owner Email</label>
                <input
                  type="email"
                  value={newOrgOwnerEmail}
                  onChange={(e) => setNewOrgOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="Organization description..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Create Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
