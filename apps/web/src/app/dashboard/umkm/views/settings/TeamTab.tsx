import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Mail, Trash2, CheckCircle2, UserPlus, X, Search, Phone, Edit3, RefreshCw, Key, Shield, UserCheck, Clock, TrendingUp, Award, Briefcase, Activity, FileText, PieChart as PieIcon, BarChart3, Filter } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface TeamTabProps {
  triggerToast: (msg: string) => void;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Sales Agent' | 'Finance' | 'Developer' | string;
  department?: string;
  status: 'Aktif' | 'Pending' | 'Non-Aktif' | string;
  avatar_url?: string;
  phone?: string;
  tasks_completed?: number;
  performance_score?: number;
  total_sales_handled?: number;
  recent_activity?: string;
  bio?: string;
  last_active_at?: string;
  permissions_json?: any;
}

export function TeamTab({ triggerToast }: TeamTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState('Semua');
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Sales Agent' | 'Finance' | 'Developer'>('Sales Agent');
  const [newDepartment, setNewDepartment] = useState('Customer Support');
  const [newBio, setNewBio] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit Member Modal State
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Sales Agent');
  const [editDepartment, setEditDepartment] = useState('Customer Support');
  const [editStatus, setEditStatus] = useState('Aktif');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const roles = ['Semua', 'Owner', 'Admin', 'Sales Agent', 'Finance', 'Developer'];

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmTeamMembers();
      setMembers(data);
    } catch (e) {
      console.warn('Error loading team members:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    const unsub = SupabaseDashboardService.subscribeToSettingsRealtime(() => {
      fetchMembers();
    });
    return () => unsub();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      setIsAdding(true);
      const computedName = newName.trim() || newEmail.split('@')[0].replace('.', ' ');
      
      const tempId = Date.now().toString();
      const newMemberItem: TeamMember = {
        id: tempId,
        name: computedName,
        email: newEmail,
        phone: newPhone,
        role: newRole,
        department: newDepartment,
        bio: newBio || 'Anggota tim baru',
        status: 'Pending',
        tasks_completed: 0,
        performance_score: 100.00,
        total_sales_handled: 0,
        recent_activity: 'Baru ditambahkan ke sistem',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };
      setMembers(prev => [...prev, newMemberItem]);

      await SupabaseDashboardService.addUmkmTeamMember({
        name: computedName,
        email: newEmail,
        phone: newPhone,
        role: newRole,
        department: newDepartment,
        bio: newBio,
        avatar_url: newMemberItem.avatar_url
      });

      triggerToast(`✓ Undangan berhasil dikirim ke ${newEmail}!`);
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewBio('');
      fetchMembers();
    } catch (err) {
      triggerToast('✕ Gagal mengirim undangan anggota tim');
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setEditName(member.name);
    setEditRole(member.role);
    setEditDepartment(member.department || 'General');
    setEditStatus(member.status);
    setEditPhone(member.phone || '');
    setEditBio(member.bio || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      setIsSavingEdit(true);
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? {
        ...m,
        name: editName,
        role: editRole,
        department: editDepartment,
        status: editStatus,
        phone: editPhone,
        bio: editBio
      } : m));

      await SupabaseDashboardService.updateUmkmTeamMember(selectedMember.id, {
        name: editName,
        role: editRole,
        department: editDepartment,
        status: editStatus,
        phone: editPhone,
        bio: editBio
      });

      triggerToast(`✓ Data profil ${editName} berhasil diperbarui!`);
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      triggerToast('✕ Gagal memperbarui data anggota');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${name} dari tim?`)) return;
    try {
      setMembers(prev => prev.filter(m => m.id !== id));
      await SupabaseDashboardService.deleteUmkmTeamMember(id);
      triggerToast(`✓ Anggota ${name} berhasil dihapus.`);
      fetchMembers();
    } catch (err) {
      triggerToast('✕ Gagal menghapus anggota');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchQuery === '' ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.department || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeRoleTab === 'Semua') return true;
    return member.role === activeRoleTab;
  });

  const activeCount = members.filter(m => m.status === 'Aktif').length;
  const pendingCount = members.filter(m => m.status === 'Pending').length;
  const totalTasks = members.reduce((acc, m) => acc + (m.tasks_completed || 0), 0);
  const totalSales = members.reduce((acc, m) => acc + (m.total_sales_handled || 0), 0);
  const avgScore = members.length > 0 
    ? (members.reduce((acc, m) => acc + (m.performance_score || 0), 0) / members.length).toFixed(1)
    : '-';

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900';
      case 'Admin':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900';
      case 'Sales Agent':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900';
      case 'Finance':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900';
      case 'Developer':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const getRoleColorCode = (role: string) => {
    switch (role) {
      case 'Owner': return '#9333ea'; // purple-600
      case 'Admin': return '#2563eb'; // blue-600
      case 'Sales Agent': return '#10b981'; // emerald-500
      case 'Finance': return '#f59e0b'; // amber-500
      case 'Developer': return '#6366f1'; // indigo-500
      default: return '#64748b';
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val || val === 0) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Donut Chart Data Calculation
  const roleCounts: Record<string, number> = {};
  ['Owner', 'Admin', 'Sales Agent', 'Finance', 'Developer'].forEach(r => {
    roleCounts[r] = members.filter(m => m.role === r).length;
  });

  const totalMembersCount = members.length || 1;
  const donutSegments: Array<{ role: string; count: number; percentage: number; color: string; strokeDasharray: string; strokeDashoffset: number }> = [];
  
  let cumulativeOffset = 0;
  const circumference = 2 * Math.PI * 40; // radius = 40, circumference ~ 251.32

  Object.entries(roleCounts).forEach(([role, count]) => {
    if (count > 0) {
      const percentage = (count / totalMembersCount) * 100;
      const strokeLength = (percentage / 100) * circumference;
      const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
      const strokeDashoffset = -cumulativeOffset;
      cumulativeOffset += strokeLength;

      donutSegments.push({
        role,
        count,
        percentage,
        color: getRoleColorCode(role),
        strokeDasharray,
        strokeDashoffset
      });
    }
  });

  // Top Performers for Bar Chart
  const topPerformers = [...members]
    .sort((a, b) => (b.tasks_completed || 0) - (a.tasks_completed || 0))
    .slice(0, 5);

  const maxTasks = topPerformers.length > 0 ? Math.max(...topPerformers.map(m => m.tasks_completed || 1)) : 100;

  return (
    <div className="space-y-6 font-sans">
      {/* Clean Enterprise Header Banner (No Gradient) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Tim & Pengguna Bisnis ZEGA AI ({members.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pusat kendali tim, visualisasi produktivitas staf real-time, dan manajemen izin akses terpusat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <UserPlus size={16} />
            <span>Undang Anggota</span>
          </button>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            <UserCheck size={14} className="text-emerald-500" />
            <span>Telemetry: <strong className="text-emerald-600 dark:text-emerald-400">{activeCount} Aktif</strong> {pendingCount > 0 && <span className="text-amber-500 font-normal">({pendingCount} Pending)</span>}</span>
          </div>
        </div>
      </div>

      {/* Interactive Analytics Dashboard (Donut Chart & Bar Chart Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5">
        {/* Interactive Donut Diagram Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <PieIcon size={16} />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                Distribusi Peran Tim (Donut)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Real-time</span>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative size-32 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="14"
                  className="text-slate-100 dark:text-slate-800"
                />
                {/* Donut Segments */}
                {donutSegments.map((segment) => {
                  const isHovered = hoveredRole === segment.role;
                  return (
                    <circle
                      key={segment.role}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={segment.color}
                      strokeWidth={isHovered ? 18 : 14}
                      strokeDasharray={segment.strokeDasharray}
                      strokeDashoffset={segment.strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredRole(segment.role)}
                      onMouseLeave={() => setHoveredRole(null)}
                      onClick={() => setActiveRoleTab(segment.role)}
                    />
                  );
                })}
              </svg>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {hoveredRole ? roleCounts[hoveredRole] || 0 : members.length}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {hoveredRole || 'Staf'}
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-1.5 min-w-0 flex-1">
              {donutSegments.map((seg) => (
                <div
                  key={seg.role}
                  onClick={() => setActiveRoleTab(seg.role)}
                  onMouseEnter={() => setHoveredRole(seg.role)}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`flex items-center justify-between text-[11px] p-1.5 rounded-xl cursor-pointer transition-all ${
                    activeRoleTab === seg.role || hoveredRole === seg.role
                      ? 'bg-slate-100 dark:bg-slate-800 font-extrabold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-slate-700 dark:text-slate-300 truncate">{seg.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-900 dark:text-slate-100 font-bold">{seg.count}</span>
                    <span className="text-[10px] text-slate-400">({seg.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Bar Chart Card (Top Staff Productivity) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <BarChart3 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                  Diagram Produktivitas Staf (Tugas & Tiket Chat Selesai)
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Perbandingan kontribusi penyelesaian tiket chat dan pesanan.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 size={13} />
              <span>Total: {totalTasks} Tiket Selesai</span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-3 py-1">
            {topPerformers.map((m) => {
              const tasks = m.tasks_completed || 0;
              const barPercent = Math.min((tasks / maxTasks) * 100, 100);
              
              return (
                <div key={m.id} className="space-y-1 group">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-900 dark:text-slate-100 font-extrabold truncate">{m.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${getRoleBadgeStyle(m.role)}`}>
                        {m.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-slate-500 dark:text-slate-400">
                      <span>{formatCurrency(m.total_sales_handled)}</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-black">{tasks} Tiket</strong>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                    <div
                      className="bg-blue-500 group-hover:bg-orange-500 h-full rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Role Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Daftar Staf & Visualisasi Hasil Kerja
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pantau skor pencapaian, jumlah tugas selesai, dan aktivitas real-time tiap anggota.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, departemen..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {roles.map((r) => {
                const isSelected = activeRoleTab === r;
                return (
                  <button
                    key={r}
                    onClick={() => setActiveRoleTab(r)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        {loading ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-orange-500" />
            <span>Memuat data kinerja tim dari database...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs">
            Tidak ada anggota tim yang cocok dengan kriteria &quot;{searchQuery || activeRoleTab}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
            {filteredMembers.map((member) => {
              const score = member.performance_score || 95.0;
              const tasks = member.tasks_completed || 0;
              const sales = member.total_sales_handled || 0;
              
              return (
                <div
                  key={member.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col justify-between gap-4 group transition-all"
                >
                  {/* Member Top Bar: Identity & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={member.avatar_url || '/assets/logo/zega.png'}
                          alt={member.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                          }}
                          className="size-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <span className={`size-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-slate-900 ${
                          member.status === 'Aktif' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-500 transition-colors">
                            {member.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${getRoleBadgeStyle(member.role)}`}>
                            {member.role}
                          </span>
                          {member.department && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {member.department}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          <span className="truncate flex items-center gap-1">
                            <Mail size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </span>
                          {member.phone && (
                            <span className="hidden sm:flex items-center gap-1 text-[10.5px]">
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              <span>{member.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(member)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Profil & Peran"
                      >
                        <Edit3 size={15} />
                      </button>

                      {member.role !== 'Owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus Anggota"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Real Work Visualization Telemetry Bar */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Award size={13} className="text-amber-500" />
                        <span>Skor Kinerja / CSAT</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{score}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>

                    {/* Work Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-blue-500 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Tugas Selesai:</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">{tasks} Tiket</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-emerald-500 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Omzet Diproses:</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">{formatCurrency(sales)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity & Bio Footer */}
                  <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {member.recent_activity && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Activity size={12} className="text-orange-500 shrink-0" />
                        <span className="truncate"><strong>Aktivitas Terakhir:</strong> {member.recent_activity}</span>
                      </div>
                    )}
                    {member.bio && (
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 italic truncate">
                        <FileText size={11} className="shrink-0" />
                        <span className="truncate">{member.bio}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Invite Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-orange-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Undang Anggota Tim Baru
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="contoh: Ahmad Subagja"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="contoh: ahmad@zega.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Nomor Telepon (WhatsApp)
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="contoh: +62 812-3456-7890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">
                    Peran Pengguna
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sales Agent">Sales Agent</option>
                    <option value="Finance">Finance</option>
                    <option value="Developer">Developer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">
                    Departemen
                  </label>
                  <select
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Customer Support">Customer Support</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Operational">Operational</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Bio / Catatan Staf
                </label>
                <input
                  type="text"
                  value={newBio}
                  onChange={e => setNewBio(e.target.value)}
                  placeholder="contoh: Senior Sales Officer WhatsApp Store"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isAdding ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={15} />}
                  <span>{isAdding ? 'Mengirim...' : 'Kirim Undangan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Member */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-orange-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Edit Profil Anggota: {selectedMember.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">
                    Peran Pengguna
                  </label>
                  <select
                    value={editRole}
                    disabled={selectedMember.role === 'Owner'}
                    onChange={e => setEditRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Sales Agent">Sales Agent</option>
                    <option value="Finance">Finance</option>
                    <option value="Developer">Developer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">
                    Departemen
                  </label>
                  <select
                    value={editDepartment}
                    onChange={e => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Operational">Operational</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Status Anggota
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Pending">Pending (Menunggu Konfirmasi)</option>
                  <option value="Non-Aktif">Non-Aktif (Ditangguhkan)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Bio / Catatan Profil Staf
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Catatan keahlian atau tugas utama staf..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSavingEdit ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
