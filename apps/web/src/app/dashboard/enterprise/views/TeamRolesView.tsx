import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Shield,
  UserCheck,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Check,
  Minus,
  ExternalLink
} from 'lucide-react';

interface TeamRolesViewProps {
  onTriggerToast?: (msg: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Enterprise Admin' | 'Admin' | 'Developer' | 'Analyst' | 'Viewer' | 'Billing Manager';
  status: 'Active' | 'Inactive' | 'Pending';
  lastActive: string;
}

export function TeamRolesView({ onTriggerToast }: TeamRolesViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'permissions'>('members');
  const [searchQuery, setSearchQuery] = useState('');

  // Team Members data with Danz Assyidq as Enterprise Admin per user request
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'm1',
      name: 'Danz Assyidq',
      email: 'danz@acme.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'Enterprise Admin',
      status: 'Active',
      lastActive: '2 minutes ago',
    },
    {
      id: 'm2',
      name: 'Alsa Dwi Nur H.',
      email: 'alsa@acme.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
      role: 'Admin',
      status: 'Active',
      lastActive: '10 minutes ago',
    },
    {
      id: 'm3',
      name: 'Faris Ramadhan',
      email: 'faris@acme.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      role: 'Developer',
      status: 'Active',
      lastActive: '1 hour ago',
    },
    {
      id: 'm4',
      name: 'Siti Aisyah',
      email: 'aisyah@acme.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
      role: 'Analyst',
      status: 'Active',
      lastActive: '2 hours ago',
    },
    {
      id: 'm5',
      name: 'Dimas Pratama',
      email: 'dimas@acme.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      role: 'Viewer',
      status: 'Active',
      lastActive: '1 day ago',
    },
    {
      id: 'm6',
      name: 'Rizky Abdullah',
      email: 'rizky@acme.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
      role: 'Developer',
      status: 'Inactive',
      lastActive: '3 days ago',
    },
    {
      id: 'm7',
      name: 'Naufal Hakim',
      email: 'naufal@acme.com',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces',
      role: 'Viewer',
      status: 'Pending',
      lastActive: '-',
    },
  ]);

  const handleInviteMember = () => {
    if (onTriggerToast) onTriggerToast('Modal Invite Member Dibuka!');
  };

  const filteredMembers = members.filter(
    (m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Enterprise Admin':
        return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
      case 'Admin':
        return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'Developer':
        return 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800';
      case 'Analyst':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case 'Billing Manager':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Team & Roles
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your team members, roles, and permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
            />
          </div>

          <button
            onClick={handleInviteMember}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        {[
          { id: 'members', label: 'Team Members' },
          { id: 'roles', label: 'Roles' },
          { id: 'permissions', label: 'Permissions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Members</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">45</span>
            <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} />
              <span>12.5%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Active Members</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">38</span>
            <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp size={12} />
              <span>8.6%</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Pending Invitations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">7</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Roles</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">6</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">vs last 30 days</span>
        </div>
      </div>

      {/* TWO COLUMN MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: TEAM MEMBERS TABLE */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Team Members</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">MEMBER</th>
                  <th className="py-2.5 px-3">ROLE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">LAST ACTIVE</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{m.name}</p>
                          <p className="text-[10.5px] text-slate-400 font-mono truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getRoleBadgeStyle(m.role)}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : m.status === 'Pending'
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">{m.lastActive}</td>
                    <td className="py-3 px-3 text-right">
                      <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span>Showing 1 to {filteredMembers.length} of 45 members</span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-xs">1</span>
              <span className="px-2 py-0.5 text-slate-500">2</span>
              <span className="px-2 py-0.5 text-slate-500">3</span>
              <span className="px-2 py-0.5 text-slate-400">...</span>
              <span className="px-2 py-0.5 text-slate-500">7</span>
              <button className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <ChevronRight size={14} />
              </button>
              <select className="ml-2 text-xs py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <option>10 / page</option>
                <option>25 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STACKED CARDS */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Roles & Permissions Overview */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Roles & Permissions Overview</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage roles and their permissions.</p>
              </div>
              <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All Roles
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { name: 'Enterprise Admin', desc: 'Full access to all features and settings', users: 3 },
                { name: 'Admin', desc: 'Manage organization, teams, and settings', users: 7 },
                { name: 'Developer', desc: 'Build, deploy, and manage AI workflows', users: 18 },
                { name: 'Analyst', desc: 'View analytics, reports, and insights', users: 9 },
                { name: 'Viewer', desc: 'View only access to limited resources', users: 6 },
                { name: 'Billing Manager', desc: 'Manage billing, payments, and invoices', users: 2 },
              ].map((r, i) => (
                <div key={i} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{r.name}</span>
                    <span className="text-[10.5px] text-slate-400 block">{r.desc}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap ml-2">
                    Users <strong>{r.users}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Permission Matrix (Overview) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Permission Matrix (Overview)</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase text-slate-400 font-semibold">
                    <th className="py-2 px-2">PERMISSION</th>
                    <th className="py-2 px-2 text-center">ADMIN</th>
                    <th className="py-2 px-2 text-center">DEVELOPER</th>
                    <th className="py-2 px-2 text-center">ANALYST</th>
                    <th className="py-2 px-2 text-center">VIEWER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {[
                    { perm: 'Manage Organization', admin: true, dev: false, analyst: false, viewer: false },
                    { perm: 'Manage Members', admin: true, dev: true, analyst: false, viewer: false },
                    { perm: 'Create Workflows', admin: true, dev: true, analyst: true, viewer: false },
                    { perm: 'View Analytics', admin: true, dev: true, analyst: true, viewer: true },
                    { perm: 'Manage Billing', admin: true, dev: false, analyst: false, viewer: false },
                    { perm: 'Access Logs', admin: true, dev: true, analyst: false, viewer: false },
                  ].map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-2 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">{p.perm}</td>
                      <td className="py-2 px-2 text-center">{p.admin ? <span className="inline-block size-2 rounded-full bg-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}</td>
                      <td className="py-2 px-2 text-center">{p.dev ? <span className="inline-block size-2 rounded-full bg-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}</td>
                      <td className="py-2 px-2 text-center">{p.analyst ? <span className="inline-block size-2 rounded-full bg-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}</td>
                      <td className="py-2 px-2 text-center">{p.viewer ? <span className="inline-block size-2 rounded-full bg-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100/50 cursor-pointer">
              Manage Roles & Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
