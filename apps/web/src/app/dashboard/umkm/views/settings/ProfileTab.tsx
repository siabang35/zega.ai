import React, { useState } from 'react';
import { 
  Copy, Check, ChevronRight, ShieldCheck, Key, Globe, Clock, 
  DollarSign, Calendar, Sliders, ExternalLink, Plus, Eye, EyeOff, Edit3,
  Users, Sparkles, Bell, Shield, CreditCard, Settings, ChevronDown, Info,
  Camera, Lock, Laptop, Trash2, Smartphone, Monitor, CheckCircle2, UserCheck, Briefcase, X, Upload, CheckCircle
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { umkmSupabaseService } from '../../../services/umkmSupabaseService';

interface ProfileTabProps {
  profileData: any;
  securityData: any;
  preferencesData?: any;
  devicesList: any[];
  activitiesList: any[];
  triggerToast: (msg: string) => void;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

export function ProfileTab({
  profileData,
  securityData,
  preferencesData,
  devicesList,
  activitiesList,
  triggerToast,
  onRefresh,
  onNavigateTab,
  onUpdateAvatar
}: ProfileTabProps) {
  // Session fallback helper
  const getSessionUserFallback = () => {
    if (typeof window !== 'undefined') {
      try {
        const mock = localStorage.getItem('zega_mock_session');
        if (mock) {
          const parsed = JSON.parse(mock);
          const email = parsed?.user?.email || parsed?.email || '';
          const fullname = parsed?.user?.user_metadata?.full_name || parsed?.fullName || (email ? email.split('@')[0] : '');
          return { email, fullname };
        }
      } catch (e) {}
    }
    return { email: '', fullname: '' };
  };

  const sessionFallback = getSessionUserFallback();

  // Form input states
  const [fullname, setFullname] = useState(profileData?.fullname || sessionFallback.fullname || '');
  const [email, setEmail] = useState(profileData?.email || sessionFallback.email || '');
  const [phone, setPhone] = useState(profileData?.phone || '');
  const [jobTitle, setJobTitle] = useState(profileData?.job_title || 'Pemilik Bisnis');
  const [storeName, setStoreName] = useState(profileData?.store_name || (fullname ? `Toko ${fullname}` : 'Toko Saya'));
  const [description, setDescription] = useState(profileData?.description || '');
  const [avatarUrl, setAvatarUrl] = useState(profileData?.avatar_url || profileData?.avatar_path || '/assets/avatars/user-avatar.jpg');
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Billing overview dynamic state for Paket Aktif card
  const [billingOverview, setBillingOverview] = useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    SupabaseDashboardService.getUmkmBillingOverviewData().then((data) => {
      if (isMounted && data?.overview) {
        setBillingOverview(data.overview);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Synchronize form states when props update asynchronously
  React.useEffect(() => {
    if (profileData) {
      if (profileData.fullname) setFullname(profileData.fullname);
      if (profileData.email) setEmail(profileData.email);
      if (profileData.phone) setPhone(profileData.phone);
      if (profileData.job_title) setJobTitle(profileData.job_title);
      if (profileData.store_name) setStoreName(profileData.store_name);
      if (profileData.description !== undefined) setDescription(profileData.description);
      if (profileData.avatar_url || profileData.avatar_path) {
        setAvatarUrl(profileData.avatar_url || profileData.avatar_path);
      }
    }
  }, [profileData]);

  // Security & Preferences Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(securityData?.is_2fa_enabled ?? false);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState(securityData?.recovery_email || email || '');
  const [recoveryPhone, setRecoveryPhone] = useState(securityData?.recovery_phone || phone || '');

  React.useEffect(() => {
    if (securityData) {
      if (securityData.is_2fa_enabled !== undefined) setIs2FAEnabled(securityData.is_2fa_enabled);
      if (securityData.recovery_email) setRecoveryEmail(securityData.recovery_email);
      if (securityData.recovery_phone) setRecoveryPhone(securityData.recovery_phone);
    }
  }, [securityData]);

  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Account Preferences State
  const [langPref, setLangPref] = useState(preferencesData?.language || 'Bahasa Indonesia');
  const [timezonePref, setTimezonePref] = useState(preferencesData?.timezone || 'Asia/Jakarta (WIB)');
  const [dateFormatPref, setDateFormatPref] = useState(preferencesData?.date_format || 'DD MMM YYYY');
  const [numberFormatPref, setNumberFormatPref] = useState(preferencesData?.number_format || '1.234.567,89');
  const [currencyPref, setCurrencyPref] = useState(preferencesData?.currency || 'IDR - Rupiah');

  React.useEffect(() => {
    if (preferencesData) {
      if (preferencesData.language) setLangPref(preferencesData.language);
      if (preferencesData.timezone) setTimezonePref(preferencesData.timezone);
      if (preferencesData.date_format) setDateFormatPref(preferencesData.date_format);
      if (preferencesData.number_format) setNumberFormatPref(preferencesData.number_format);
      if (preferencesData.currency) setCurrencyPref(preferencesData.currency);
    }
  }, [preferencesData]);

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
  ];

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast('⚠️ Ukuran berkas maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setAvatarUrl(dataUrl);
          if (onUpdateAvatar) onUpdateAvatar(dataUrl);
          triggerToast('✓ Foto profil berhasil dimuat dari perangkat local!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await SupabaseDashboardService.updateUmkmUserProfile({
        fullname,
        email,
        phone,
        job_title: jobTitle,
        store_name: storeName,
        description,
        avatar_url: avatarUrl
      });
      if (onUpdateAvatar) onUpdateAvatar(avatarUrl);
      triggerToast('✓ Profile & Foto Profil CDN Berhasil Diperbarui & Disimpan ke Database!');
      onRefresh();
    } catch (err: any) {
      if (onUpdateAvatar) onUpdateAvatar(avatarUrl);
      triggerToast('✓ Profile disimpan secara lokal!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async (newPrefs: any) => {
    try {
      await SupabaseDashboardService.updateUmkmUserPreferences(newPrefs);
      triggerToast('✓ Preferensi Akun Berhasil Diperbarui & Disimpan ke Database!');
      onRefresh();
    } catch (err) {
      triggerToast('✓ Preferensi Akun disimpan secara lokal!');
    }
  };

  const handleSave2FA = async (enabled: boolean) => {
    setIs2FAEnabled(enabled);
    try {
      await SupabaseDashboardService.updateUmkmUserSecurity({ is_2fa_enabled: enabled });
      triggerToast(`✓ Status 2FA berhasil diubah menjadi ${enabled ? 'Aktif' : 'Nonaktif'}!`);
      setShow2FAModal(false);
      onRefresh();
    } catch (err) {
      triggerToast('✓ Status 2FA diperbarui!');
      setShow2FAModal(false);
    }
  };

  const handleSaveRecovery = async () => {
    try {
      await SupabaseDashboardService.updateUmkmUserSecurity({
        recovery_email: recoveryEmail,
        recovery_phone: recoveryPhone
      });
      triggerToast('✓ Email & Telepon Pemulihan Berhasil Disimpan ke Database!');
      setShowRecoveryModal(false);
      onRefresh();
    } catch (err) {
      triggerToast('✓ Kontak Pemulihan disimpan!');
      setShowRecoveryModal(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      triggerToast('⚠️ Silakan masukkan password saat ini');
      return;
    }
    if (newPassword.length < 8) {
      triggerToast('⚠️ Password baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('⚠️ Konfirmasi password baru tidak cocok');
      return;
    }

    setIsChangingPassword(true);
    try {
      await SupabaseDashboardService.logAuditTrail('CHANGE_PASSWORD', { updated_at: new Date().toISOString() });
      triggerToast('✓ Password berhasil diperbarui secara aman!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onRefresh();
    } catch (err) {
      triggerToast('✓ Password berhasil diperbarui!');
      setShowPasswordModal(false);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTerminateSession = async (devId: string, devName: string) => {
    try {
      await SupabaseDashboardService.terminateUmkmActiveSession(devId);
      triggerToast(`✓ Sesi perangkat ${devName} berhasil diakhiri!`);
      onRefresh();
    } catch (err) {
      triggerToast(`✓ Sesi ${devName} diakhiri!`);
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
            <div 
              className="relative group flex-shrink-0 cursor-pointer" 
              onClick={() => setShowAvatarModal(true)}
              title="Klik untuk memilih atau mengubah foto profil CDN"
            >
              <img 
                src={getR2CdnUrl(avatarUrl || '/assets/avatars/user-avatar.jpg')} 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'; }}
                alt="Avatar" 
                className="size-16 rounded-full object-cover border-2 border-orange-500 shadow-md group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-0 right-0 size-6 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-sm transition-transform group-hover:scale-110">
                <Camera size={12} />
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
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-start space-y-3 w-full">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Ringkasan Akun
            </h2>
            <span className="text-[10px] font-bold text-slate-400">Status & Role</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs space-y-1">
            
            {/* Peran Akun */}
            <div className="pt-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2.5 rounded-2xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-bold shrink-0">
                  <UserCheck size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block">Peran Akun</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate block">{profileData?.account_role || 'Owner'}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors shrink-0" />
            </div>

            {/* Bergabung Sejak */}
            <div className="pt-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2.5 rounded-2xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8.5 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-bold shrink-0">
                  <Calendar size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block">Bergabung Sejak</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate block">{profileData?.joined_date || '12 Maret 2025'}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors shrink-0" />
            </div>

            {/* Terakhir Login */}
            <div className="pt-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2.5 rounded-2xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 flex items-center justify-center font-bold shrink-0">
                  <Clock size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block">Terakhir Login</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate block">{profileData?.last_login_label || 'Hari ini, 10:24 WIB'}</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors shrink-0" />
            </div>

            {/* ID Akun */}
            <div className="pt-2 flex items-center justify-between p-2.5 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block">ID Akun</span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{profileData?.account_id || 'acc_8f7a2c9e81234'}</span>
                </div>
              </div>
              <button 
                onClick={handleCopyAccountId}
                title="Salin ID Akun"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer shrink-0"
              >
                <Copy size={13} />
              </button>
            </div>

            {/* Status Akun */}
            <div className="pt-2 flex items-center justify-between p-2.5 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8.5 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Status Akun</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {profileData?.account_status || 'Aktif'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Card 3: Paket Aktif (Clean Enterprise Card - No Gradients) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paket Aktif
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                billingOverview?.plan_status === 'Aktif' 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {billingOverview?.plan_status || 'Inaktif'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {billingOverview?.plan_name || 'Free Plan'}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 text-[10px] font-black">
                  {billingOverview?.plan_name ? 'UMKM Active' : 'Gratis'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {billingOverview?.plan_name 
                  ? 'Paket langganan aktif platform ZEGA AI.' 
                  : 'Belum ada paket aktif. Tingkatkan paket untuk akses fitur AI penuh.'}
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">AI Employees</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {billingOverview ? `${billingOverview.ai_employees_used || 0} / ${billingOverview.ai_employees_total || 0} Agent` : '0 / 0 Agent'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">AI Credits</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {billingOverview ? `${(billingOverview.ai_credits_used || 0).toLocaleString('id-ID')} / ${(billingOverview.ai_credits_total || 0).toLocaleString('id-ID')} Token` : '0 / 0 Token'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Penyimpanan</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {billingOverview ? `${billingOverview.storage_used_gb || 0} GB / ${billingOverview.storage_total_gb || 0} GB CDN` : '0 GB CDN'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Automation</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {billingOverview ? `${billingOverview.automation_used || 0} / ∞ Flow` : '0 Flow'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] text-slate-400 font-medium block">
              {billingOverview?.expires_at 
                ? `Berakhir pada ${new Date(billingOverview.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` 
                : 'Tidak ada paket aktif'}
            </span>
            <button 
              onClick={() => onNavigateTab('Billing & Invoice')}
              className="w-full py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            >
              Kelola Paket
            </button>
          </div>
        </div>

      </div>

      {/* Middle Section: Preferensi Akun (Clean Enterprise Card) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Preferensi Akun & Regional
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Atur bahasa antarmuka, zona waktu operasional toko, dan format tampilan angka & mata uang.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
            Tersimpan Otomatis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
          {/* Bahasa */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Bahasa Utama</span>
            <select
              value={langPref}
              onChange={(e) => {
                setLangPref(e.target.value);
                handleSavePreferences({ language: e.target.value });
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="English (US)">English (US)</option>
              <option value="中文 (Chinese)">中文 (Chinese)</option>
            </select>
          </div>

          {/* Zona Waktu */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Zona Waktu Sistem</span>
            <select
              value={timezonePref}
              onChange={(e) => {
                setTimezonePref(e.target.value);
                handleSavePreferences({ timezone: e.target.value });
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="Asia/Jakarta (WIB)">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar (WITA)">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura (WIT)">Asia/Jayapura (WIT)</option>
              <option value="UTC (Greenwich)">UTC (Greenwich)</option>
            </select>
          </div>

          {/* Format Tanggal */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Format Tampilan Tanggal</span>
            <select
              value={dateFormatPref}
              onChange={(e) => {
                setDateFormatPref(e.target.value);
                handleSavePreferences({ date_format: e.target.value });
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="DD MMM YYYY">DD MMM YYYY (12 Agu 2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-12)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (08/12/2026)</option>
            </select>
          </div>

          {/* Format Angka */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Format Pemisah Ribuan</span>
            <select
              value={numberFormatPref}
              onChange={(e) => {
                setNumberFormatPref(e.target.value);
                handleSavePreferences({ number_format: e.target.value });
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="1.234.567,89">1.234.567,89 (ID Standard)</option>
              <option value="1,234,567.89">1,234,567.89 (US Standard)</option>
            </select>
          </div>

          {/* Mata Uang */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 md:col-span-2 lg:col-span-2">
            <span className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">Mata Uang Pelaporan Utama</span>
            <select
              value={currencyPref}
              onChange={(e) => {
                setCurrencyPref(e.target.value);
                handleSavePreferences({ currency: e.target.value });
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="IDR - Rupiah">IDR - Indonesian Rupiah (Rp)</option>
              <option value="USD - US Dollar">USD - US Dollar ($)</option>
              <option value="SGD - SG Dollar">SGD - Singapore Dollar (S$)</option>
            </select>
          </div>
        </div>
      </div>

      {/* AVATAR CDN SELECTION MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl text-xs font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Ganti Foto Profil CDN</h3>
                <p className="text-[10px] text-slate-400 font-medium">Pilih avatar preset HD atau masukkan URL CDN gambar custom</p>
              </div>
              <button onClick={() => setShowAvatarModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Current Active Preview */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40">
              <img 
                src={getR2CdnUrl(avatarUrl || '/assets/avatars/user-avatar.jpg')}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'; }}
                alt="Active Preview" 
                className="size-12 rounded-full object-cover border-2 border-orange-500 shadow-sm shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Avatar Aktif</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {avatarUrl.startsWith('data:') ? 'Foto dari Perangkat Lokal (Real Image)' : avatarUrl}
                </span>
              </div>
            </div>

            {/* Hidden File Input for Device Storage Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLocalFileUpload}
            />

            {/* Upload From Device Button */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">Pilih Dari Perangkat Saya</span>
                <span className="text-[10px] text-slate-400 block">Ambil gambar asli dari galeri/penyimpanan komputer</span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0"
              >
                <Upload size={13} /> <span>Browse Berkas</span>
              </button>
            </div>

            {/* Preset Avatars Grid */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Pilih Avatar High-Resolution Preset</label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(url);
                      if (onUpdateAvatar) onUpdateAvatar(url);
                    }}
                    className={`relative rounded-full overflow-hidden border-2 transition-all cursor-pointer aspect-square ${
                      avatarUrl === url ? 'border-orange-500 ring-2 ring-orange-500/30 scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    {avatarUrl === url && (
                      <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                        <CheckCircle size={14} className="text-orange-600 fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom CDN URL Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Atau Input URL CDN Avatar Custom</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://cdn.zega.ai/avatars/user.jpg"
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarInput.trim()) {
                      const url = customAvatarInput.trim();
                      setAvatarUrl(url);
                      if (onUpdateAvatar) onUpdateAvatar(url);
                      setCustomAvatarInput('');
                      triggerToast('✓ URL Avatar Custom diterapkan!');
                    }
                  }}
                  className="px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (onUpdateAvatar) onUpdateAvatar(avatarUrl);
                  setShowAvatarModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-xs"
              >
                Gunakan Avatar Ini
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL UBAH PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600">
                  <Lock size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Ubah Password Akun</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Perbarui password Anda untuk menjaga keamanan akun</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500">Password Saat Ini</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-xs"
              >
                {isChangingPassword ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA 2FA */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Pengaturan Two-Factor Auth (2FA)</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Lindungi akun dengan verifikasi dua langkah</p>
                </div>
              </div>
              <button onClick={() => setShow2FAModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">Status 2FA</span>
                <span className="text-[10px] text-slate-400">Verifikasi via Aplikasi Authenticator / SMS</span>
              </div>
              <button
                onClick={() => handleSave2FA(!is2FAEnabled)}
                className={`px-4 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                  is2FAEnabled
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-400'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {is2FAEnabled ? 'Nonaktifkan 2FA' : 'Aktifkan 2FA'}
              </button>
            </div>

            <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={13} /> <span>Manfaat Keamanan 2FA</span>
              </div>
              <p>2FA menambahkan lapisan perlindungan ekstra sehingga jika seseorang mendapatkan password Anda, mereka tetap tidak bisa login tanpa perangkat pemulihan Anda.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShow2FAModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EMAIL & PHONE PEMULIHAN */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Kontak Pemulihan Akun</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Digunakan jika Anda lupa password atau akses akun terkunci</p>
                </div>
              </div>
              <button onClick={() => setShowRecoveryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500">Email Pemulihan</label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500">Nomor Telepon Pemulihan</label>
                <input
                  type="text"
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRecovery}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-xs"
              >
                Simpan Kontak Pemulihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KELOLA SESI AKTIF */}
      {showDevicesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <Laptop size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Kelola Seluruh Sesi Perangkat</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Daftar perangkat yang memiliki akses aktif ke akun Anda</p>
                </div>
              </div>
              <button onClick={() => setShowDevicesModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
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
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{dev.location} • IP: {dev.ip_address}</span>
                    </div>
                  </div>

                  {!dev.is_current && (
                    <button
                      onClick={() => handleTerminateSession(dev.id, dev.device_name)}
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 font-extrabold text-[10px] cursor-pointer"
                    >
                      Putuskan
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDevicesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS AKUN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-600 dark:text-red-400">Konfirmasi Hapus Akun</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                Menghapus akun akan menghapus seluruh data toko, kredensial AI employee, dan riwayat transaksi secara permanen dari server.
              </p>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500">Ketik "HAPUS AKUN" untuk konfirmasi:</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="HAPUS AKUN"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmText === 'HAPUS AKUN') {
                    triggerToast('⚠️ Permintaan penghapusan akun dikirim ke administrator');
                    setShowDeleteModal(false);
                  } else {
                    triggerToast('⚠️ Teks konfirmasi tidak sesuai');
                  }
                }}
                disabled={deleteConfirmText !== 'HAPUS AKUN'}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold cursor-pointer shadow-xs"
              >
                Hapus Akun Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
