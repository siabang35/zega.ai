import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Smartphone, Laptop, LogOut, Check, Eye, EyeOff, Globe, Shield, RefreshCw } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface SecurityTabProps {
  triggerToast: (msg: string) => void;
  securityData?: any;
}

export function SecurityTab({ triggerToast }: SecurityTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // States matching reference design 3
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [twoFactorMethod, setTwoFactorMethod] = useState('Authenticator App');
  const [magicLinkLogin, setMagicLinkLogin] = useState(false);
  const [newDeviceVerify, setNewDeviceVerify] = useState(true);
  const [ipAllowlistEnabled, setIpAllowlistEnabled] = useState(false);

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadSecurity = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmSecuritySettings();
      if (data) {
        if (data.two_factor_enabled !== undefined) setTwoFactorEnabled(data.two_factor_enabled);
        if (data.two_factor_method) setTwoFactorMethod(data.two_factor_method);
        if (data.magic_link_login !== undefined) setMagicLinkLogin(data.magic_link_login);
        if (data.new_device_verify !== undefined) setNewDeviceVerify(data.new_device_verify);
        if (data.ip_allowlist_enabled !== undefined) setIpAllowlistEnabled(data.ip_allowlist_enabled);
      }
    } catch (e) {
      console.warn('Security settings load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurity();
  }, []);

  const handleSave = async (overrides?: any) => {
    try {
      setSaving(true);
      const payload = {
        two_factor_enabled: overrides?.two_factor_enabled ?? twoFactorEnabled,
        two_factor_method: overrides?.two_factor_method ?? twoFactorMethod,
        magic_link_login: overrides?.magic_link_login ?? magicLinkLogin,
        new_device_verify: overrides?.new_device_verify ?? newDeviceVerify,
        ip_allowlist_enabled: overrides?.ip_allowlist_enabled ?? ipAllowlistEnabled
      };
      await SupabaseDashboardService.updateUmkmSecuritySettings(payload);
      triggerToast('✓ Pengaturan keamanan berhasil disimpan!');
    } catch (e) {
      triggerToast('✕ Gagal menyegarkan keamanan.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      triggerToast('✕ Harap isi semua kolom kata sandi!');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('✕ Konfirmasi kata sandi tidak cocok!');
      return;
    }
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(false);
    triggerToast('✓ Kata sandi berhasil diperbarui!');
  };

  const renderToggle = (checked: boolean, onChange: (val: boolean) => void) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
        checked ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Split 2 Columns matching Layout 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Password, 2FA, Perangkat Aktif */}
        <div className="space-y-6">
          {/* 1. Password Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 flex items-center justify-center font-black">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Password</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Terakhir diubah 2 bulan lalu</p>
              </div>
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Ubah Password
            </button>
          </div>

          {/* 2. Two-Factor Authentication (2FA) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-black">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                    Two-Factor Authentication (2FA)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Tambahkan lapisan keamanan ekstra untuk akun Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const next = !twoFactorEnabled;
                  setTwoFactorEnabled(next);
                  handleSave({ two_factor_enabled: next });
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Kelola 2FA
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className={`px-2.5 py-0.5 rounded-full font-black ${
                twoFactorEnabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {twoFactorEnabled ? '2FA Aktif' : '2FA Non-Aktif'}
              </span>
              <span className="text-slate-400 font-medium">Metode: <strong className="text-slate-700 dark:text-slate-300">{twoFactorMethod}</strong></span>
            </div>
          </div>

          {/* 3. Perangkat Aktif */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Perangkat Aktif</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Kelola perangkat yang sedang masuk ke akun Anda.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Laptop size={16} className="text-slate-600 dark:text-slate-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Windows • Chrome</h4>
                    <p className="text-[10px] text-slate-400">Jakarta, Indonesia - Saat ini</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  Aktif
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Smartphone size={16} className="text-slate-600 dark:text-slate-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">iPhone 14 • iOS 17</h4>
                    <p className="text-[10px] text-slate-400">Jakarta, Indonesia - 1 jam lalu</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  Aktif
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Laptop size={16} className="text-slate-600 dark:text-slate-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">MacBook Air • Safari</h4>
                    <p className="text-[10px] text-slate-400">Surabaya, Indonesia - 2 hari lalu</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => triggerToast('✓ Memuat daftar semua perangkat...')}
                className="text-xs font-extrabold text-orange-500 hover:underline cursor-pointer"
              >
                Lihat Semua Perangkat →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sesi Aktif, Aktivitas Login, Additional Security */}
        <div className="space-y-6">
          {/* 4. Sesi Aktif Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 flex items-center justify-center font-black">
                <LogOut size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Sesi Aktif</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Anda memiliki 3 sesi aktif di 2 perangkat</p>
              </div>
            </div>

            <button
              onClick={() => triggerToast('✓ Berhasil keluar dari semua sesi lain!')}
              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold cursor-pointer transition-colors"
            >
              Keluar dari Semua Sesi
            </button>
          </div>

          {/* 5. Aktivitas Login Terakhir */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Aktivitas Login Terakhir</h3>
            </div>

            <div className="space-y-3 relative pl-3 border-l-2 border-slate-100 dark:border-slate-800">
              <div className="relative pl-4 space-y-0.5">
                <div className="absolute -left-[19px] top-1 size-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Jakarta, Indonesia</h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600">Saat ini</span>
                </div>
                <p className="text-[10px] text-slate-400">Chrome • Windows</p>
              </div>

              <div className="relative pl-4 space-y-0.5 pt-2">
                <div className="absolute -left-[19px] top-3 size-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900" />
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Jakarta, Indonesia</h4>
                  <span className="text-[10px] text-slate-400">1 jam lalu</span>
                </div>
                <p className="text-[10px] text-slate-400">Safari • iPhone</p>
              </div>

              <div className="relative pl-4 space-y-0.5 pt-2">
                <div className="absolute -left-[19px] top-3 size-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900" />
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Surabaya, Indonesia</h4>
                  <span className="text-[10px] text-slate-400">2 hari lalu</span>
                </div>
                <p className="text-[10px] text-slate-400">Safari • MacOS</p>
              </div>

              <div className="relative pl-4 space-y-0.5 pt-2">
                <div className="absolute -left-[19px] top-3 size-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900" />
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Bandung, Indonesia</h4>
                  <span className="text-[10px] text-slate-400">5 hari lalu</span>
                </div>
                <p className="text-[10px] text-slate-400">Chrome • Windows</p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => triggerToast('✓ Memuat riwayat aktivitas lengkap...')}
                className="text-xs font-extrabold text-orange-500 hover:underline cursor-pointer"
              >
                Lihat Semua Aktivitas →
              </button>
            </div>
          </div>

          {/* 6. Pengaturan Keamanan Tambahan */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Pengaturan Keamanan Tambahan</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Login dengan email magic link</h4>
                  <p className="text-[10px] text-slate-400">Masuk tanpa password menggunakan email.</p>
                </div>
                {renderToggle(magicLinkLogin, (val) => { setMagicLinkLogin(val); handleSave({ magic_link_login: val }); })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Verifikasi perangkat baru</h4>
                  <p className="text-[10px] text-slate-400">Dapatkan notifikasi saat ada perangkat baru yang login.</p>
                </div>
                {renderToggle(newDeviceVerify, (val) => { setNewDeviceVerify(val); handleSave({ new_device_verify: val }); })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Batasi akses berdasarkan IP (IP Allowlist)</h4>
                  <p className="text-[10px] text-slate-400">Hanya izinkan IP tertentu untuk mengakses akun.</p>
                </div>
                <button
                  onClick={() => triggerToast('✓ Membuka Pengaturan IP Allowlist...')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Atur IP Allowlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Ubah Password Akun</h3>
            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Password saat ini</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
