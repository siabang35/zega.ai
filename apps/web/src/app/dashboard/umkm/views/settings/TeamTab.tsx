import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, Mail, MoreVertical, Trash2, CheckCircle2, UserPlus, X } from 'lucide-react';

interface TeamTabProps {
  triggerToast: (msg: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Sales Agent' | 'Finance';
  status: 'Aktif' | 'Pending';
  avatar: string;
}

export function TeamTab({ triggerToast }: TeamTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Cik Beriuk', email: 'cikberiuk@gmail.com', role: 'Owner', status: 'Aktif', avatar: '/assets/logo/zega.png' },
    { id: '2', name: 'Ahmad Subagja', email: 'ahmad.subagja@zega.ai', role: 'Admin', status: 'Aktif', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: '3', name: 'Siti Sarah', email: 'siti.sarah@zega.ai', role: 'Sales Agent', status: 'Aktif', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: '4', name: 'Budi Kurniawan', email: 'budi.kurniawan@zega.ai', role: 'Finance', status: 'Pending', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Sales Agent' | 'Finance'>('Sales Agent');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newEmail.split('@')[0].replace('.', ' '),
      email: newEmail,
      role: newRole,
      status: 'Pending',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    setMembers(prev => [...prev, newMember]);
    setNewEmail('');
    setIsModalOpen(false);
    triggerToast(`✓ Undangan berhasil dikirim ke ${newEmail}!`);
  };

  const handleRemoveMember = (id: string, name: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    triggerToast(`✓ Anggota ${name} berhasil dihapus dari tim.`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black">
            <Users size={22} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Tim & Anggota Pengguna ({members.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Kelola akses staf, agen penjualan, dan peran pengguna bisnis Anda.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Tambah Anggota</span>
        </button>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map(member => (
          <div
            key={member.id}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 group hover:border-orange-500/40 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={member.avatar}
                alt={member.name}
                className="size-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                    {member.name}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    member.status === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}>
                    {member.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                  <Mail size={12} />
                  <span>{member.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                {member.role}
              </span>
              {member.role !== 'Owner' && (
                <button
                  onClick={() => handleRemoveMember(member.id, member.name)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Hapus Anggota"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Undah Anggota Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="contoh: staf@zega.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Peran & Akses
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Admin">Admin (Akses Penuh)</option>
                  <option value="Sales Agent">Sales Agent (Chat & CRM)</option>
                  <option value="Finance">Finance (Billing & Invoice)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold"
                >
                  Kirim Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
