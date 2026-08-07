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
  FileSpreadsheet,
  Edit2,
  Trash2,
  PieChart,
  RefreshCw,
  AlertTriangle
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

  // Pagination for members
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Donut Chart Filter ('ALL' | 'FULL' | 'LIMITED' | 'NONE')
  const [donutFilter, setDonutFilter] = useState<'ALL' | 'FULL' | 'LIMITED' | 'NONE'>('ALL');
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState<string | null>(null);

  // Selected Role Inspector State
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ full_name: '', email: '', role_name: 'Developer', department: 'Engineering' });

  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [deletingMember, setDeletingMember] = useState<any>(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({ name: '', description: '' });

  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [deletingRole, setDeletingRole] = useState<any>(null);

  const [showCreatePermModal, setShowCreatePermModal] = useState(false);
  const [newPermData, setNewPermData] = useState({
    permission_code: '',
    category: 'Organization',
    description: '',
    allow_enterprise_admin: true,
    allow_admin: true,
    allow_developer: false,
    allow_analyst: false,
    allow_viewer: false
  });

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

  // Real-time Handlers
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

  const handleEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    const res = await enterpriseSupabaseService.updateTeamMemberRealtime(editingMember.id, editingMember);
    if (res.success) {
      if (onTriggerToast) onTriggerToast(`Anggota ${editingMember.full_name} berhasil diperbarui!`);
      setShowEditMemberModal(false);
      setEditingMember(null);
    }
  };

  const handleDeleteMemberSubmit = async () => {
    if (!deletingMember) return;
    const res = await enterpriseSupabaseService.deleteTeamMemberRealtime(deletingMember.id);
    if (res.success) {
      if (onTriggerToast) onTriggerToast(`Anggota ${deletingMember.full_name} berhasil dihapus!`);
      setShowDeleteMemberModal(false);
      setDeletingMember(null);
    }
  };

  const handleToggleMFA = async (m: any) => {
    const updated = !m.mfa_enabled;
    const res = await enterpriseSupabaseService.updateTeamMemberRealtime(m.id, { mfa_enabled: updated });
    if (res.success && onTriggerToast) {
      onTriggerToast(`MFA untuk ${m.full_name} ${updated ? 'Diaktifkan' : 'Dinonaktifkan'}!`);
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

  const handleEditRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    const res = await enterpriseSupabaseService.updateCustomRoleRealtime(editingRole.id, editingRole);
    if (res.success) {
      if (onTriggerToast) onTriggerToast(`Role "${editingRole.name}" berhasil diperbarui!`);
      if (selectedRole?.id === editingRole.id) setSelectedRole(editingRole);
      setShowEditRoleModal(false);
      setEditingRole(null);
    }
  };

  const handleDeleteRoleSubmit = async () => {
    if (!deletingRole) return;
    if (deletingRole.role_type === 'System') {
      if (onTriggerToast) onTriggerToast(`Role System "${deletingRole.name}" tidak dapat dihapus!`);
      return;
    }
    const res = await enterpriseSupabaseService.deleteCustomRoleRealtime(deletingRole.id);
    if (res.success) {
      if (onTriggerToast) onTriggerToast(`Role "${deletingRole.name}" berhasil dihapus!`);
      if (selectedRole?.id === deletingRole.id) setSelectedRole(roles.find(r => r.id !== deletingRole.id) || null);
      setShowDeleteRoleModal(false);
      setDeletingRole(null);
    }
  };

  const handleTogglePermission = async (permId: string, roleKey: string, currentValue: boolean) => {
    // Optimistic UI update
    setPermissions(prev => prev.map(p => p.id === permId ? { ...p, [roleKey]: !currentValue } : p));
    const res = await enterpriseSupabaseService.togglePermissionRealtime(permId, roleKey, !currentValue);
    if (res.success && onTriggerToast) {
      onTriggerToast(`Permission di-update secara realtime di database!`);
    }
  };

  const handleCreatePermissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermData.permission_code) return;
    const res = await enterpriseSupabaseService.createPermissionRealtime(newPermData);
    if (res.success) {
      if (onTriggerToast) onTriggerToast(`Permission "${newPermData.permission_code}" berhasil ditambahkan!`);
      setShowCreatePermModal(false);
      setNewPermData({
        permission_code: '',
        category: 'Organization',
        description: '',
        allow_enterprise_admin: true,
        allow_admin: true,
        allow_developer: false,
        allow_analyst: false,
        allow_viewer: false
      });
    }
  };

  const handleDuplicatePermission = async (perm: any) => {
    const dupCode = `${perm.permission_code}_copy_${Math.floor(Math.random() * 1000)}`;
    const res = await enterpriseSupabaseService.createPermissionRealtime({
      permission_code: dupCode,
      category: perm.category,
      description: `Copy of ${perm.description}`,
      allow_enterprise_admin: perm.allow_enterprise_admin,
      allow_admin: perm.allow_admin,
      allow_developer: perm.allow_developer,
      allow_analyst: perm.allow_analyst,
      allow_viewer: perm.allow_viewer
    });
    if (res.success && onTriggerToast) {
      onTriggerToast(`Permission ${dupCode} diduplikasi!`);
    }
  };

  const exportCSV = (type: string) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (type === 'members') {
      csvContent += 'Name,Email,Role,Department,Status,Last Active,MFA,SSO\n';
      members.forEach((m) => {
        csvContent += `"${m.full_name}","${m.email}","${m.role_name}","${m.department}","${m.status}","${m.last_active}","${m.mfa_enabled ? 'Enabled' : 'Disabled'}","${m.sso_provider}"\n`;
      });
    } else if (type === 'roles') {
      csvContent += 'Role Name,Type,Description,Assigned Users,Permissions Count\n';
      roles.forEach((r) => {
        csvContent += `"${r.name}","${r.role_type}","${r.description}","${r.assigned_users_count}","${r.permissions_count_label}"\n`;
      });
    } else if (type === 'permissions') {
      csvContent += 'Permission Code,Category,Description,Enterprise Admin,Admin,Developer,Analyst,Viewer\n';
      permissions.forEach((p) => {
        csvContent += `"${p.permission_code}","${p.category}","${p.description}","${p.allow_enterprise_admin}","${p.allow_admin}","${p.allow_developer}","${p.allow_analyst}","${p.allow_viewer}"\n`;
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

  // Real-time Dynamic Calculations for Donut Chart
  const getAccessTier = (p: any) => {
    const allowedCount = [
      p.allow_enterprise_admin,
      p.allow_admin,
      p.allow_developer,
      p.allow_analyst,
      p.allow_viewer
    ].filter(Boolean).length;

    if (allowedCount === 5) return 'FULL';
    if (allowedCount === 0) return 'NONE';
    return 'LIMITED';
  };

  const fullAccessCount = permissions.filter(p => getAccessTier(p) === 'FULL').length;
  const limitedAccessCount = permissions.filter(p => getAccessTier(p) === 'LIMITED').length;
  const noAccessCount = permissions.filter(p => getAccessTier(p) === 'NONE').length;
  const totalPermsCount = permissions.length || 1;

  const fullAccessPct = Math.round((fullAccessCount / totalPermsCount) * 100);
  const limitedAccessPct = Math.round((limitedAccessCount / totalPermsCount) * 100);
  const noAccessPct = Math.round((noAccessCount / totalPermsCount) * 100);

  // Filtered Arrays
  const filteredMembers = members.filter((m) => {
    const matchesSearch = (m.full_name || '').toLowerCase().includes(searchMember.toLowerCase()) || (m.email || '').toLowerCase().includes(searchMember.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || m.role_name === roleFilter;
    const matchesStatus = statusFilter === 'All Status' || m.status === statusFilter;
    const matchesDept = deptFilter === 'All Departments' || m.department === deptFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  });

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredRoles = roles.filter((r) => {
    const matchesSearch = (r.name || '').toLowerCase().includes(searchRole.toLowerCase()) || (r.description || '').toLowerCase().includes(searchRole.toLowerCase());
    const matchesType = roleTypeFilter === 'All Types' || r.role_type === roleTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredPerms = permissions.filter((p) => {
    const matchesSearch = (p.permission_code || '').toLowerCase().includes(searchPerm.toLowerCase()) || (p.description || '').toLowerCase().includes(searchPerm.toLowerCase());
    const matchesCat = permCategory === 'All Permissions' || p.category === permCategory;
    const matchesDonut = donutFilter === 'ALL' || getAccessTier(p) === donutFilter;
    return matchesSearch && matchesCat && matchesDonut;
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

      {/* SUB-NAVIGATION TABS (TOUCH SCROLL RESPONSIVE) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
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
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{members.length}</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={11} /> Live DB
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 block font-mono">realtime synchronized</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE MEMBERS</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{members.filter(m => m.status === 'Active').length}</span>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp size={11} /> {Math.round((members.filter(m => m.status === 'Active').length / (members.length || 1)) * 100)}%
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 block font-mono">active session status</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Invitations</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600">{members.filter(m => m.status === 'Pending').length}</span>
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                  <Clock size={11} /> Pending
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 block font-mono">awaiting acceptance</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Departments</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block">{new Set(members.map(m => m.department)).size}</span>
              <span className="text-[9.5px] text-slate-400 block font-mono">Active units</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SSO Enabled</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block">SAML</span>
              <span className="text-[9.5px] text-slate-400 block font-mono">Single Sign-On</span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MFA Enforced</span>
              <span className="text-2xl font-black text-emerald-600 block">
                {Math.round((members.filter(m => m.mfa_enabled).length / (members.length || 1)) * 100)}%
              </span>
              <span className="text-[9.5px] text-slate-400 block font-mono">of total members</span>
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
                placeholder="Search members by name or email..."
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
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada anggota tim yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((m) => (
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
                          <button
                            onClick={() => handleToggleMFA(m)}
                            className={`text-[10.5px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              m.mfa_enabled
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950 text-rose-500 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {m.mfa_enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {m.sso_provider || 'SAML'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="Edit Anggota"
                              onClick={() => {
                                setEditingMember(m);
                                setShowEditMemberModal(true);
                              }}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              title="Hapus Anggota"
                              onClick={() => {
                                setDeletingMember(m);
                                setShowDeleteMemberModal(true);
                              }}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span>
                Showing {filteredMembers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-500 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2.5 py-0.5 rounded bg-indigo-600 text-white font-bold text-xs">{currentPage}</span>
                <button
                  disabled={currentPage * itemsPerPage >= filteredMembers.length}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-500 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 text-xs py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
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
                </div>                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingRole({ ...selectedRole });
                      setShowEditRoleModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Edit Role
                  </button>

                  {selectedRole.role_type === 'Custom' && (
                    <button
                      onClick={() => {
                        setDeletingRole(selectedRole);
                        setShowDeleteRoleModal(true);
                      }}
                      className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
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
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  All Permissions ({permissions.length}) {donutFilter !== 'ALL' && <span className="text-indigo-600 font-mono text-[11px] ml-2">Filtered: {donutFilter} ACCESS</span>}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Klik checkbox untuk toggle hak akses secara realtime ke database.
                </p>
              </div>
            </div>
            {donutFilter !== 'ALL' && (
              <button
                onClick={() => setDonutFilter('ALL')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT SIDEBAR: CATEGORIES */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block">Permission Categories</span>
              <div className="space-y-1 text-xs font-semibold">
                {[
                  'All Permissions',
                  'Organization',
                  'Members & Teams',
                  'Projects',
                  'AI Agents',
                  'Workflows',
                  'Analytics',
                  'Billing & Payments',
                  'Security',
                  'Integrations',
                  'System'
                ].map((catName) => {
                  const count = catName === 'All Permissions'
                    ? permissions.length
                    : permissions.filter(p => p.category === catName).length;
                  const isActive = permCategory === catName;
                  return (
                    <button
                      key={catName}
                      onClick={() => setPermCategory(catName)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{catName}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {count}
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
                    placeholder="Search permissions by code or description..."
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
                    {filteredPerms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          Tidak ada permission yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPerms.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-2 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                            {p.permission_code}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 text-[11px]">{p.category}</td>

                          {/* Enterprise Admin */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!p.allow_enterprise_admin}
                              onChange={() => handleTogglePermission(p.id, 'allow_enterprise_admin', !!p.allow_enterprise_admin)}
                              className="accent-indigo-600 cursor-pointer rounded"
                            />
                          </td>

                          {/* Admin */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!p.allow_admin}
                              onChange={() => handleTogglePermission(p.id, 'allow_admin', !!p.allow_admin)}
                              className="accent-indigo-600 cursor-pointer rounded"
                            />
                          </td>

                          {/* Developer */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!p.allow_developer}
                              onChange={() => handleTogglePermission(p.id, 'allow_developer', !!p.allow_developer)}
                              className="accent-indigo-600 cursor-pointer rounded"
                            />
                          </td>

                          {/* Analyst */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!p.allow_analyst}
                              onChange={() => handleTogglePermission(p.id, 'allow_analyst', !!p.allow_analyst)}
                              className="accent-indigo-600 cursor-pointer rounded"
                            />
                          </td>

                          {/* Viewer */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!p.allow_viewer}
                              onChange={() => handleTogglePermission(p.id, 'allow_viewer', !!p.allow_viewer)}
                              className="accent-indigo-600 cursor-pointer rounded"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT WIDGETS: PERMISSION SUMMARY & QUICK ACTIONS */}
            <div className="lg:col-span-3 space-y-4">
              {/* WIDGET 1: PERMISSION SUMMARY INTERACTIVE DONUT CHART */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <PieChart size={14} className="text-indigo-600" />
                    <span>Permission Analytics</span>
                  </h4>
                  {donutFilter !== 'ALL' && (
                    <button
                      onClick={() => setDonutFilter('ALL')}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center py-2 relative">
                  <div className="relative size-28 flex items-center justify-center">
                    <svg className="size-full transform -rotate-90" viewBox="0 0 80 80">
                      {/* Background ring */}
                      <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="10" fill="transparent" />

                      {/* Slice 1: Full Access (Indigo) */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#4f46e5"
                        strokeWidth={donutFilter === 'FULL' || hoveredDonutSlice === 'FULL' ? "12" : "10"}
                        strokeDasharray={`${Math.round((fullAccessCount / totalPermsCount) * 201)} 201`}
                        strokeDashoffset="0"
                        fill="transparent"
                        className="cursor-pointer transition-all hover:opacity-80"
                        onClick={() => setDonutFilter(donutFilter === 'FULL' ? 'ALL' : 'FULL')}
                        onMouseEnter={() => setHoveredDonutSlice('FULL')}
                        onMouseLeave={() => setHoveredDonutSlice(null)}
                      />

                      {/* Slice 2: Limited Access (Purple) */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#a855f7"
                        strokeWidth={donutFilter === 'LIMITED' || hoveredDonutSlice === 'LIMITED' ? "12" : "10"}
                        strokeDasharray={`${Math.round((limitedAccessCount / totalPermsCount) * 201)} 201`}
                        strokeDashoffset={`-${Math.round((fullAccessCount / totalPermsCount) * 201)}`}
                        fill="transparent"
                        className="cursor-pointer transition-all hover:opacity-80"
                        onClick={() => setDonutFilter(donutFilter === 'LIMITED' ? 'ALL' : 'LIMITED')}
                        onMouseEnter={() => setHoveredDonutSlice('LIMITED')}
                        onMouseLeave={() => setHoveredDonutSlice(null)}
                      />

                      {/* Slice 3: No Access (Rose) */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        stroke="#f43f5e"
                        strokeWidth={donutFilter === 'NONE' || hoveredDonutSlice === 'NONE' ? "12" : "10"}
                        strokeDasharray={`${Math.round((noAccessCount / totalPermsCount) * 201)} 201`}
                        strokeDashoffset={`-${Math.round(((fullAccessCount + limitedAccessCount) / totalPermsCount) * 201)}`}
                        fill="transparent"
                        className="cursor-pointer transition-all hover:opacity-80"
                        onClick={() => setDonutFilter(donutFilter === 'NONE' ? 'ALL' : 'NONE')}
                        onMouseEnter={() => setHoveredDonutSlice('NONE')}
                        onMouseLeave={() => setHoveredDonutSlice(null)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-base font-black text-slate-900 dark:text-slate-100">{permissions.length}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">TOTAL</span>
                    </div>
                  </div>
                </div>

                {/* LEGEND / INTERACTIVE FILTERS */}
                <div className="space-y-1.5 text-[11px] font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setDonutFilter(donutFilter === 'FULL' ? 'ALL' : 'FULL')}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                      donutFilter === 'FULL' ? 'bg-indigo-50 dark:bg-indigo-950/60 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      <span className="text-slate-700 dark:text-slate-300">Full Access</span>
                    </div>
                    <span className="font-mono text-slate-500 font-bold">{fullAccessCount} ({fullAccessPct}%)</span>
                  </button>

                  <button
                    onClick={() => setDonutFilter(donutFilter === 'LIMITED' ? 'ALL' : 'LIMITED')}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                      donutFilter === 'LIMITED' ? 'bg-purple-50 dark:bg-purple-950/60 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      <span className="text-slate-700 dark:text-slate-300">Limited Access</span>
                    </div>
                    <span className="font-mono text-slate-500 font-bold">{limitedAccessCount} ({limitedAccessPct}%)</span>
                  </button>

                  <button
                    onClick={() => setDonutFilter(donutFilter === 'NONE' ? 'ALL' : 'NONE')}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                      donutFilter === 'NONE' ? 'bg-rose-50 dark:bg-rose-950/60 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-slate-700 dark:text-slate-300">No Access</span>
                    </div>
                    <span className="font-mono text-slate-500 font-bold">{noAccessCount} ({noAccessPct}%)</span>
                  </button>
                </div>
              </div>

              {/* WIDGET 2: QUICK ACTIONS */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-none">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Quick Actions</h4>

                <div className="space-y-2 text-xs font-semibold">
                  <button
                    onClick={() => setShowCreatePermModal(true)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>Create Custom Permission</span>
                    <Plus size={13} className="text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (permissions.length > 0) handleDuplicatePermission(permissions[0]);
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>Duplicate Selected Permission</span>
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
      {/* MODAL 3: EDIT MEMBER */}
      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Anggota Tim</h3>
              <button onClick={() => setShowEditMemberModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editingMember.full_name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, full_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={editingMember.email || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Role</label>
                  <select
                    value={editingMember.role_name || 'Developer'}
                    onChange={(e) => setEditingMember({ ...editingMember, role_name: e.target.value })}
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
                    value={editingMember.department || 'Engineering'}
                    onChange={(e) => setEditingMember({ ...editingMember, department: e.target.value })}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={editingMember.status || 'Active'}
                    onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                  >
                    <option>Active</option>
                    <option>Pending</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">MFA Enforced</label>
                  <select
                    value={editingMember.mfa_enabled ? 'true' : 'false'}
                    onChange={(e) => setEditingMember({ ...editingMember, mfa_enabled: e.target.value === 'true' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Avatar CDN URL</label>
                <input
                  type="text"
                  value={editingMember.avatar_url || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, avatar_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1 font-mono text-[11px]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditMemberModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE MEMBER CONFIRMATION */}
      {showDeleteMemberModal && deletingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={24} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Hapus Anggota Tim?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:text-slate-100">{deletingMember.full_name}</strong>? Tindakan ini akan menghapus akses pengguna dari database secara permanen.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShowDeleteMemberModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteMemberSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
              >
                Hapus Anggota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT ROLE */}
      {showEditRoleModal && editingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Role ({editingRole.name})</h3>
              <button onClick={() => setShowEditRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditRoleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Nama Role</label>
                <input
                  type="text"
                  required
                  value={editingRole.name || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Deskripsi</label>
                <textarea
                  rows={3}
                  value={editingRole.description || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditRoleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Simpan Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: DELETE ROLE CONFIRMATION */}
      {showDeleteRoleModal && deletingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={24} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Hapus Role Custom?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus role <strong className="text-slate-900 dark:text-slate-100">{deletingRole.name}</strong>? Role System tidak dapat dihapus.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShowDeleteRoleModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteRoleSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
              >
                Hapus Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: CREATE CUSTOM PERMISSION */}
      {showCreatePermModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tambah Permission Baru</h3>
              <button onClick={() => setShowCreatePermModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePermissionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Permission Code</label>
                <input
                  type="text"
                  required
                  value={newPermData.permission_code}
                  onChange={(e) => setNewPermData({ ...newPermData, permission_code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g. org:audit_logs:export"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={newPermData.category}
                  onChange={(e) => setNewPermData({ ...newPermData, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                >
                  <option>Organization</option>
                  <option>Members & Teams</option>
                  <option>Projects</option>
                  <option>AI Agents</option>
                  <option>Workflows</option>
                  <option>Analytics</option>
                  <option>Billing & Payments</option>
                  <option>Security</option>
                  <option>Integrations</option>
                  <option>System</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Deskripsi</label>
                <textarea
                  rows={2}
                  value={newPermData.description}
                  onChange={(e) => setNewPermData({ ...newPermData, description: e.target.value })}
                  placeholder="Fungsi dan cakupan hak akses ini..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-1"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Initial Role Allowances</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermData.allow_enterprise_admin}
                      onChange={(e) => setNewPermData({ ...newPermData, allow_enterprise_admin: e.target.checked })}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Enterprise Admin</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermData.allow_admin}
                      onChange={(e) => setNewPermData({ ...newPermData, allow_admin: e.target.checked })}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Admin</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermData.allow_developer}
                      onChange={(e) => setNewPermData({ ...newPermData, allow_developer: e.target.checked })}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Developer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermData.allow_analyst}
                      onChange={(e) => setNewPermData({ ...newPermData, allow_analyst: e.target.checked })}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Analyst</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermData.allow_viewer}
                      onChange={(e) => setNewPermData({ ...newPermData, allow_viewer: e.target.checked })}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Viewer</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePermModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Simpan Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

