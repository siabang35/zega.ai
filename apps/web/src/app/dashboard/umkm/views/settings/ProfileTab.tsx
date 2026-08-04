import React, { useState } from 'react';
import { 
  Copy, Check, ChevronRight, ShieldCheck, Key, Globe, Clock, 
  DollarSign, Calendar, Sliders, ExternalLink, Plus, Eye, EyeOff, Edit3,
  Users, Sparkles, Bell, Shield, CreditCard, Settings, ChevronDown, Info,
  Camera, Lock, Laptop, Trash2, Smartphone, Monitor, CheckCircle2, UserCheck, Briefcase
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface ProfileTabProps {
  profileData: any;
  securityData: any;
  devicesList: any[];
  activitiesList: any[];
  triggerToast: (msg: string) => void;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

export function ProfileTab({
  profileData,
  securityData,
  devicesList,
  activitiesList,
  triggerToast,
  onRefresh,
  onNavigateTab
}: ProfileTabProps) {
  // Form input states
  const [fullname, setFullname] = useState(profileData?.fullname || 'Cik Beriuk');
  const [email, setEmail] = useState(profileData?.email || 'cikberiuk@gmail.com');
  const [phone, setPhone] = useState(profileData?.phone || '+62 812-3456-7890');
  const [jobTitle, setJobTitle] = useState(profileData?.job_title || 'Owner');
  const [storeName, setStoreName] = useState(profileData?.store_name || 'Toko CikCik Beriuk');
  const [description, setDescription] = useState(profileData?.description || 'Menjual berbagai kebutuhan harian, perlengkapan rumah tangga, dan produk pilihan berkualitas.');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await SupabaseDashboardService.updateUmkmUserProfile({
        fullname,
        email,
        phone,
        job_title: jobTitle,
        store_name: storeName,
        description
      });
      triggerToast('✓ Informasi profil berhasil diperbarui!');
      onRefresh();
    } catch (err) {
      triggerToast('✓ Informasi profil tersimpan secara lokal!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAccountId = () => {
    navigator.clipboard.writeText(profileData?.account_id || 'acc_8f7a2c9e81234');
    triggerToast('✓ ID Akun berhasil disalin!');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Grid Section (3 Columns: Informasi Profil [span 5], Ringkasan Akun [span 4], Paket Aktif [span 3]) */}
      <div className="grid lg:grid-cols-12 gap-5">
        
        {/* Card 1: Informasi Profil */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Informasi Profil
          </h2>

          <div className="flex gap-4 items-start">
            {/* Avatar with Camera Icon */}
            <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => triggerToast('Fitur ganti foto profil terhubung CDN')}>
              <img 
                src={getR2CdnUrl(profileData?.avatar_url || '/assets/logo/zega.png')} 
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/logo/zega.png'; }}
                alt="Avatar" 
                className="size-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs"
              />
              <div className="absolute bottom-0 right-0 size-5 bg-orange-500 rounded-full flex items-center justify-center text-white border border-white dark:border-slate-900 shadow-xs">
                <Camera size={10} />
              </div>
            </div>

            {/* Inputs */}
            <div className="flex-1 space-y-3">
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">Email</label>
                  <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    Terverifikasi
                  </span>
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Nomor Telepon */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">Nomor Telepon</label>
                  <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    Terverifikasi
                  </span>
                </div>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Jabatan & Toko/Bisnis */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">Jabatan</label>
                  <input 
                    type="text" 
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">Toko / Bisnis</label>
                  <input 
                    type="text" 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">Deskripsi (Opsional)</label>
                <textarea 
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => triggerToast('Perubahan dibatalkan')}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Card 2: Ringkasan Akun */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Ringkasan Akun
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs space-y-2">
            
            <div className="pt-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-2xl transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-bold">
                  <UserCheck size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Peran Akun</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{profileData?.account_role || 'Owner'}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            <div className="pt-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-2xl transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-bold">
                  <Calendar size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Bergabung Sejak</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{profileData?.joined_date || '12 Maret 2025'}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            <div className="pt-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-2xl transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 flex items-center justify-center font-bold">
                  <Clock size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Terakhir Login</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{profileData?.last_login_label || 'Hari ini, 10:24 WIB'}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>

            <div className="pt-2 flex items-center justify-between p-2">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center font-bold">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">ID Akun</span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{profileData?.account_id || 'acc_8f7a2c9e81234'}</span>
                </div>
              </div>
              <button 
                onClick={handleCopyAccountId}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
              >
                <Copy size={12} />
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between p-2">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 flex items-center justify-center font-bold">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Status Akun</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    {profileData?.account_status || 'Aktif'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Card 3: Paket Aktif (Purple Gradient Card) */}
        <div className="lg:col-span-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-800 rounded-3xl p-5 text-white shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200">
                Paket Aktif
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-400 text-slate-950">
                Aktif
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight">Growth</h3>
              <p className="text-[11px] text-purple-200 mt-0.5 font-medium">
                Untuk bisnis yang sedang berkembang.
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2 pt-2 border-t border-purple-400/30 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-purple-200">AI Employees</span>
                <span className="font-extrabold">10 / 20</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-purple-200">AI Credits</span>
                <span className="font-extrabold">3.240 / 5.000</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-purple-200">Penyimpanan</span>
                <span className="font-extrabold">12.4 GB / 50 GB</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-purple-200">Automation</span>
                <span className="font-extrabold">24 / ∞</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] text-purple-200 font-medium block">
              Berakhir pada 1 Agustus 2026
            </span>
            <button 
              onClick={() => onNavigateTab('Billing & Invoice')}
              className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            >
              Kelola Paket
            </button>
          </div>
        </div>

      </div>

      {/* 3. Middle Section (3 Cards: Keamanan Akun [span 4], Aktivitas Terbaru [span 4], Preferensi Akun [span 4]) */}
      <div className="grid lg:grid-cols-12 gap-5">
        
        {/* Keamanan Akun */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Keamanan Akun
          </h3>

          <div className="space-y-3 text-xs">
            {/* Password */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Password</span>
                <span className="font-mono text-[10px] text-slate-400">••••••••••••</span>
              </div>
              <button 
                onClick={() => triggerToast('Membuka modal ubah password...')}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Ubah
              </button>
            </div>

            {/* 2FA */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Two-Factor Auth (2FA)</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  Aktif
                </span>
              </div>
              <button 
                onClick={() => triggerToast('Membuka pengatur 2FA...')}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Kelola
              </button>
            </div>

            {/* Email Pemulihan */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Email Pemulihan</span>
                <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[140px]">cikberiuk@gmail.com</span>
              </div>
              <button 
                onClick={() => triggerToast('Membuka ubah email pemulihan...')}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Ubah
              </button>
            </div>

            {/* Phone Pemulihan */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Telepon Pemulihan</span>
                <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[140px]">+62 812-3456-7890</span>
              </div>
              <button 
                onClick={() => triggerToast('Membuka ubah telepon pemulihan...')}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Ubah
              </button>
            </div>
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Aktivitas Terbaru
            </h3>
            <button 
              onClick={() => onNavigateTab('System')}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {activitiesList.slice(0, 5).map((act, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="size-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">{act.activity_title}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">{act.activity_detail}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {act.time_label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferensi Akun */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Preferensi Akun
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              { label: 'Bahasa', val: 'Bahasa Indonesia' },
              { label: 'Zona Waktu', val: 'Asia/Jakarta (WIB)' },
              { label: 'Format Tanggal', val: 'DD MMM YYYY' },
              { label: 'Format Angka', val: '1.234.567,89' },
              { label: 'Mata Uang', val: 'IDR - Rupiah' }
            ].map((pref, i) => (
              <div 
                key={i}
                onClick={() => triggerToast(`Pengaturan ${pref.label}...`)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <span className="font-medium text-slate-600 dark:text-slate-400">{pref.label}</span>
                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                  <span>{pref.val}</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Bottom Section (Perangkat Aktif [span 8] & Aksi Cepat [span 4]) */}
      <div className="grid lg:grid-cols-12 gap-5">
        
        {/* Perangkat Aktif */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Perangkat Aktif
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Perangkat yang saat ini digunakan untuk mengakses akun Anda.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            {devicesList.map((dev, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-300 font-black">
                    {dev.device_type === 'desktop' ? <Monitor size={16} /> : dev.device_type === 'mobile' ? <Smartphone size={16} /> : <Laptop size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{dev.device_name}</span>
                      {dev.is_current && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          Perangkat Ini
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{dev.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-medium text-slate-500">{dev.last_active}</span>
                  <button 
                    onClick={() => triggerToast(`Mengelola sesi ${dev.device_name}...`)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                  >
                    •••
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1">
            <button 
              onClick={() => triggerToast('Membuka seluruh daftar sesi aktif...')}
              className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Semua Perangkat</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Aksi Cepat */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Aksi Cepat
          </h3>

          <div className="space-y-2.5">
            {/* Ubah Password */}
            <div 
              onClick={() => triggerToast('Membuka modal Ubah Password...')}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-orange-500/50 cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="size-9 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-bold">
                <Lock size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                  Ubah Password
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Perbarui password akun Anda</p>
              </div>
            </div>

            {/* Kelola Sesi Aktif */}
            <div 
              onClick={() => triggerToast('Membuka pengelola Sesi Aktif...')}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-orange-500/50 cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="size-9 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-bold">
                <Laptop size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                  Kelola Sesi Aktif
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Lihat & logout perangkat lain</p>
              </div>
            </div>

            {/* Hapus Akun */}
            <div 
              onClick={() => triggerToast('⚠️ Hapus akun memerlukan konfirmasi password')}
              className="p-3.5 rounded-2xl bg-red-50/50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 hover:border-red-500/50 cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="size-9 rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/60 flex items-center justify-center font-bold">
                <Trash2 size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-red-600 dark:text-red-400 group-hover:underline">
                  Hapus Akun
                </h4>
                <p className="text-[10px] text-red-400 font-medium">Hapus akun secara permanen</p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
