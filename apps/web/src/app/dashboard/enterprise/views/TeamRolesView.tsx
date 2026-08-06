import React, { useState, useEffect } from 'react';
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
  TrendingDown,
  Check,
  Minus,
  Download,
  Filter,
  Copy,
  Lock,
  Building,
  Key,
  Layers,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';

interface TeamRolesViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function TeamRolesView({ onTriggerToast }: TeamRolesViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'permissions'>('members');

  // Real-time State
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchMember, setSearchMember] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deptFilter, setDeptFilter] = useState('All Departments');

  const [searchRole, setSearchRole] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('All Types');

  const [searchPerm, setSearchPerm] = useState('');
  const [permCategory, setPermCategory] = useState('All Permissions');

  // Selected Role Inspector State
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ full_name: '', email: '', role_name: 'Developer', department: 'Engineering' });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({ name: '', description: '' });

  useEffect(() => {
    let memSub: any, roleSub: any, permSub: any;

    async function loadRealtimeData() {
      setLoading(true);
      memSub = await enterpriseSupabaseService.getTeamMembersRealtime((data) => setMembers(data));
      roleSub = await enterpriseSupabaseService.getRolesRealtime((data) => {
        setRoles(data);
        if (data.length > 0 && !selectedRole) {
          const dev = data.find((r: any) => r.name === 'Developer') || data[0];
          setSelectedRole(dev);
        }
      });
      permSub = await enterpriseSupabaseService.getPermissionsRealtime((data) => setPermissions(data));
      setLoading(false);
    }

    loadRealtimeData();

    return () => {
      if (memSub?.unsubscribe) memSub.unsubscribe();
      if (roleSub?.unsubscribe) roleSub.unsubscribe();
      if (permSub?.unsubscribe) permSub.unsubscribe();
    };
  }, []);

  // Handlers
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.full_name || !inviteData.email) return;
    const res = await enterpriseSupabaseService.inviteTeamMemberRealtime(inviteData);
    if (res.success) {
      if (onTriggerToast) onTriggerToast(`Undangan terkirim ke ${inviteData.email}!`);
      setShowInviteModal(false);
      setInviteData({ full_name: '', email: '', role_name: 'Developer', department: 'Engineering' });
    }
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleData.name) return;
    const res = await enterpriseSupabaseService.createCustomRoleRealtime(newRoleData);
    if (res.success) {
      if (onTriggerToast) onTriggerToast(`Role baru "${newRoleData.name}" berhasil dibuat!`);
      setShowRoleModal(false);
      setNewRoleData({ name: '', description: '' });
    }
  };

  const exportCSV = (type: string) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (type === 'members') {
      csvContent += 'Name,Email,Role,Department,Status,Last Active,MFA,SSO\n';
      members.forEach((m) => {
        csvContent += `"${m.full_name}","${m.email}","${m.role_name}","${m.department}","${m.status}","${m.last_active}","${m.mfa_enabled ? 'Enabled' : 'Disabled'}","${m.sso_provider}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zega_enterprise_${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onTriggerToast) onTriggerToast(`Laporan ${type} berhasil di-export ke CSV!`);
  };

  // Filtered Arrays
  const filteredMembers = members.filter((m) => {
    const matchesSearch = (m.full_name || '').toLowerCase().includes(searchMember.toLowerCase()) || (m.email || '').toLowerCase().includes(searchMember.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || m.role_name === roleFilter;
    const matchesStatus = statusFilter === 'All Status' || m.status === statusFilter;
    const matchesDept = deptFilter === 'All Departments' || m.department === deptFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  });

  const filteredRoles = roles.filter((r) => {
    const matchesSearch = (r.name || '').toLowerCase().includes(searchRole.toLowerCase()) || (r.description || '').toLowerCase().includes(searchRole.toLowerCase());
    const matchesType = roleTypeFilter === 'All Types' || r.role_type === roleTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredPerms = permissions.filter((p) => {
    const matchesSearch = (p.permission_code || '').toLowerCase().includes(searchPerm.toLowerCase()) || (p.description || '').toLowerCase().includes(searchPerm.toLowerCase());
    const matchesCat = permCategory === 'All Permissions' || p.category === permCategory;
    return matchesSearch && matchesCat;
  });

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
            Teams & Roles
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your team members, roles, and permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportCSV(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'roles') setShowRoleModal(true);
              else setShowInviteModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>{activeTab === 'roles' ? 'Create Role' : 'Invite Member'}</span>
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
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: TEAM MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-5">
          {/* 6 SUMMARY KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL MEMBERS</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">45</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={11} /> 12.8%
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE MEMBERS</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">38</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={11} /> 8.4%
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Invitations</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600">7</span>
                <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                  <TrendingDown size={11} /> 2.1%
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 block font-mono">vs last 30 days</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Departments</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block">6</span>
              <span className="text-[9.5px] text-slate-400 block font-mono">Active units</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SSO Enabled</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block">SAML</span>
              <span className="text-[9.5px] text-slate-400 block font-mono">Single Sign-On</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MFA Enforced</span>
              <span className="text-2xl font-black text-emerald-600 block">98%</span>
              <span className="text-[9.5px] text-slate-400 block font-mono">of active users</span>
            </div>
          </div>

          {/* FILTER BAR & SEARCH */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search size={14} className="text-slate-400 ml-1" />
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Search members..."
                className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option>All Roles</option>
                <option>Enterprise Admin</option>
                <option>Admin</option>
                <option>Developer</option>
                <option>Analyst</option>
                <option>Viewer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Pending</option>
              </select>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Operations</option>
                <option>Analytics</option>
                <option>Finance</option>
                <option>Support</option>
              </select>

              <button
                onClick={() => onTriggerToast && onTriggerToast('Filter tambahan diterapkan!')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                <Filter size={13} />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* MAIN DIRECTORY TABLE */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3 px-3">MEMBER</th>
                    <th className="py-3 px-3">ROLE</th>
                    <th className="py-3 px-3">DEPARTMENT</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3">LAST ACTIVE</th>
                    <th className="py-3 px-3">MFA</th>
                    <th className="py-3 px-3">SSO</th>
                    <th className="py-3 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={m.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                            alt={m.full_name}
                            className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{m.full_name}</p>
                            <p className="text-[10.5px] text-slate-400 font-mono">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${getRoleBadgeStyle(m.role_name)}`}>
                          {m.role_name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{m.department}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">{m.last_active}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10.5px] font-bold ${m.mfa_enabled ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {m.mfa_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {m.sso_provider || 'SAML'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button onClick={() => onTriggerToast && onTriggerToast(`Detail anggota ${m.full_name}`)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span>Showing 1 to {filteredMembers.length} of 45 members</span>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-500">
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2.5 py-0.5 rounded bg-indigo-600 text-white font-bold text-xs">1</span>
                <span className="px-2 py-0.5 text-slate-500">2</span>
                <span className="px-2 py-0.5 text-slate-500">3</span>
                <span className="px-2 py-0.5 text-slate-400">...</span>
                <span className="px-2 py-0.5 text-slate-500">7</span>
                <button className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-500">
                  <ChevronRight size={14} />
                </button>
                <select className="ml-2 text-xs py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <option>10 / page</option>
                  <option>25 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES */}
      {activeTab === 'roles' && (
        <div className="space-y-5">
          {/* 4 SUMMARY KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Roles</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">6</span>
                <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={12} /> +2 vs last 30 days
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Custom Roles</span>
              <span className="text-2xl font-black text-indigo-600 block">4</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">System Roles</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block">2</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Users</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">45</span>
                <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={12} /> +12.8% vs last 30 days
                </span>
              </div>
            </div>
          </div>

          {/* ROLES SPLIT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT TABLE: ROLES LIST */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search size={14} className="text-slate-400 ml-1" />
                  <input
                    type="text"
                    value={searchRole}
                    onChange={(e) => setSearchRole(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                <select
                  value={roleTypeFilter}
                  onChange={(e) => setRoleTypeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <option>All Types</option>
                  <option>System</option>
                  <option>Custom</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3 px-3">ROLE</th>
                      <th className="py-3 px-3">TYPE</th>
                      <th className="py-3 px-3">DESCRIPTION</th>
                      <th className="py-3 px-3">USERS</th>
                      <th className="py-3 px-3">PERMISSIONS</th>
                      <th className="py-3 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredRoles.map((r) => {
                      const isSelected = selectedRole?.id === r.id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRole(r)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-l-4 border-l-indigo-600'
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">{r.name}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.role_type === 'System'
                                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                  : 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                              }`}
                            >
                              {r.role_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{r.description}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{r.assigned_users_count}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{r.permissions_count_label}</td>
                          <td className="py-3.5 px-3 text-right">
                            <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                              <MoreHorizontal size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT INSPECTOR PANEL: ROLE INSPECTOR */}
            {selectedRole && (
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
                <div className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{selectedRole.name}</h3>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mt-0.5">
                      {selectedRole.role_type} ROLE
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">DESCRIPTION</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">{selectedRole.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 font-bold uppercase block">USERS</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 block">{selectedRole.assigned_users_count} users</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 font-bold uppercase block">TYPE</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">{selectedRole.role_type}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 font-bold uppercase block">CREATED</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedRole.created_date_label}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9.5px] text-slate-400 font-bold uppercase block">PERMISSIONS</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedRole.permissions_count_label} permissions</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onTriggerToast && onTriggerToast(`Edit role ${selectedRole.name}`)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Edit Role
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS */}
      {activeTab === 'permissions' && (
        <div className="space-y-5">
          {/* SUB-HEADER BANNER */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key size={18} className="text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">All Permissions (120)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Manage and configure permissions for your organization roles.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT SIDEBAR: CATEGORIES */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block">Permission Categories</span>
              <div className="space-y-1 text-xs font-semibold">
                {[
                  { name: 'All Permissions', count: 120 },
                  { name: 'Organization', count: 12 },
                  { name: 'Members & Teams', count: 18 },
                  { name: 'Projects', count: 14 },
                  { name: 'AI Agents', count: 16 },
                  { name: 'Workflows', count: 12 },
                  { name: 'Analytics', count: 17 },
                  { name: 'Billing & Payments', count: 8 },
                  { name: 'Security', count: 11 },
                  { name: 'Integrations', count: 8 },
                  { name: 'System', count: 8 },
                ].map((cat) => {
                  const isActive = permCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setPermCategory(cat.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CENTER MATRIX GRID */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Search size={14} className="text-slate-400 ml-1" />
                  <input
                    type="text"
                    value={searchPerm}
                    onChange={(e) => setSearchPerm(e.target.value)}
                    placeholder="Search permissions..."
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[9.5px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-2.5 px-2">PERMISSION</th>
                      <th className="py-2.5 px-2">CATEGORY</th>
                      <th className="py-2.5 px-2 text-center">ENT ADMIN</th>
                      <th className="py-2.5 px-2 text-center">ADMIN</th>
                      <th className="py-2.5 px-2 text-center">DEV</th>
                      <th className="py-2.5 px-2 text-center">ANALYST</th>
                      <th className="py-2.5 px-2 text-center">VIEWER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredPerms.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-2 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">{p.permission_code}</td>
                        <td className="py-2.5 px-2 text-slate-500 text-[11px]">{p.category}</td>
                        <td className="py-2.5 px-2 text-center">
                          {p.allow_enterprise_admin ? <CheckCircle2 size={13} className="inline text-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {p.allow_admin ? <CheckCircle2 size={13} className="inline text-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {p.allow_developer ? <CheckCircle2 size={13} className="inline text-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {p.allow_analyst ? <CheckCircle2 size={13} className="inline text-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {p.allow_viewer ? <CheckCircle2 size={13} className="inline text-emerald-500" /> : <Minus size={12} className="inline text-slate-300" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT WIDGETS: PERMISSION SUMMARY & QUICK ACTIONS */}
            <div className="lg:col-span-3 space-y-4">
              {/* WIDGET 1: PERMISSION SUMMARY DONUT CHART */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Permission Summary</h4>

                <div className="flex items-center justify-center py-2">
                  <div className="relative size-24 flex items-center justify-center">
                    <svg className="size-full transform -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="10" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#4f46e5" strokeWidth="10" strokeDasharray="66 135" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#a855f7" strokeWidth="10" strokeDasharray="88 113" strokeDashoffset="-66" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#f43f5e" strokeWidth="10" strokeDasharray="47 154" strokeDashoffset="-154" fill="transparent" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">128</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">TOTAL</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      <span>Full Access</span>
                    </div>
                    <span className="font-mono text-slate-400">42 (32.8%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      <span>Limited Access</span>
                    </div>
                    <span className="font-mono text-slate-400">56 (43.8%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>No Access</span>
                    </div>
                    <span className="font-mono text-slate-400">30 (23.4%)</span>
                  </div>
                </div>
              </div>

              {/* WIDGET 2: QUICK ACTIONS */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Quick Actions</h4>

                <div className="space-y-2 text-xs font-semibold">
                  <button onClick={() => onTriggerToast && onTriggerToast('Membuka form custom permission...')} className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 flex items-center justify-between cursor-pointer">
                    <span>Create Custom Permission</span>
                    <Plus size={13} className="text-slate-400" />
                  </button>

                  <button onClick={() => onTriggerToast && onTriggerToast('Permission berhasil diduplikasi!')} className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 flex items-center justify-between cursor-pointer">
                    <span>Duplicate Permission</span>
                    <Copy size={13} className="text-slate-400" />
                  </button>

                  <button onClick={() => exportCSV('permissions')} className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 flex items-center justify-between cursor-pointer">
                    <span>Export Permissions</span>
                    <Download size={13} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: INVITE MEMBER */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteData.full_name}
                  onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
                  placeholder="e.g. Budi Santoso"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="budi@acme.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Role</label>
                  <select
                    value={inviteData.role_name}
                    onChange={(e) => setInviteData({ ...inviteData, role_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                  >
                    <option>Enterprise Admin</option>
                    <option>Admin</option>
                    <option>Developer</option>
                    <option>Analyst</option>
                    <option>Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Department</label>
                  <select
                    value={inviteData.department}
                    onChange={(e) => setInviteData({ ...inviteData, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                  >
                    <option>Engineering</option>
                    <option>Operations</option>
                    <option>Analytics</option>
                    <option>Finance</option>
                    <option>Support</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE ROLE */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create Custom Role</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRoleData.name}
                  onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                  placeholder="e.g. AI Security Officer"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                  placeholder="Describe permissions and target scope for this role..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
