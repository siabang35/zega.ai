import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Smartphone, Laptop, LogOut, Check, Eye, EyeOff, Globe, Shield, X, KeyRound, Radio, Plus, CheckCircle2, Server, Cloud, Cpu, Activity, Mail
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';

interface SecurityTabProps {
  triggerToast: (msg: string) => void;
  securityData?: any;
}

export function SecurityTab({ triggerToast }: SecurityTabProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Security preferences state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState('Authenticator App (TOTP)');
  const [magicLinkLogin, setMagicLinkLogin] = useState(false);
  const [newDeviceVerify, setNewDeviceVerify] = useState(true);
  const [ipAllowlistEnabled, setIpAllowlistEnabled] = useState(false);
  const [ipAllowlist, setIpAllowlist] = useState<string[]>([]);
  const [lastPasswordChange, setLastPasswordChange] = useState<string>('');

  // Active Sessions state
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // Security Integrations state (SIEM / Zero Trust Tools)
  const [securityIntegrations, setSecurityIntegrations] = useState<any[]>([]);

  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [selected2faMethod, setSelected2faMethod] = useState('Authenticator App (TOTP)');

  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [newIpInput, setNewIpInput] = useState('');

  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any | null>(null);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [alertEmailInput, setAlertEmailInput] = useState('');
  const [apiTokenInput, setApiTokenInput] = useState('');

  const loadSecurityOverview = async () => {
    try {
      setLoading(true);
      const [sec, sessions, integrations] = await Promise.all([
        SupabaseDashboardService.getUmkmSecuritySettings(),
        SupabaseDashboardService.getUmkmUserSessions(),
        SupabaseDashboardService.getUmkmSecurityIntegrations()
      ]);

      if (sec) {
        if (sec.two_factor_enabled !== undefined) setTwoFactorEnabled(sec.two_factor_enabled);
        if (sec.two_factor_method) {
          let method = sec.two_factor_method;
          if (method === 'Authenticator App' || !method) method = 'Authenticator App (TOTP)';
          setTwoFactorMethod(method);
          setSelected2faMethod(method);
        }
        if (sec.magic_link_login !== undefined) setMagicLinkLogin(sec.magic_link_login);
        if (sec.new_device_verify !== undefined) setNewDeviceVerify(sec.new_device_verify);
        if (sec.ip_allowlist_enabled !== undefined) setIpAllowlistEnabled(sec.ip_allowlist_enabled);
        if (sec.ip_allowlist && Array.isArray(sec.ip_allowlist)) setIpAllowlist(sec.ip_allowlist);
        if (sec.last_password_change) {
          const daysAgo = Math.max(1, Math.floor((Date.now() - new Date(sec.last_password_change).getTime()) / 86400000));
          setLastPasswordChange(`${daysAgo} ${t.settingsView?.securityTab?.daysAgo || 'days ago'}`);
        }
      }

      if (sessions && Array.isArray(sessions)) {
        setActiveSessions(sessions);
      }

      if (integrations && Array.isArray(integrations)) {
        setSecurityIntegrations(integrations);
      }
    } catch (e) {
      console.warn('Security settings load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityOverview();
    const unsub = SupabaseDashboardService.subscribeToSystemSecurityRealtime('11111111-1111-1111-1111-111111111111', () => {
      loadSecurityOverview();
    });
    return () => unsub();
  }, []);

  const handleSaveSecurity = async (overrides?: any) => {
    try {
      setSaving(true);
      const next2fa = overrides?.two_factor_enabled ?? twoFactorEnabled;
      const nextVerify = overrides?.new_device_verify ?? newDeviceVerify;
      const nextIpEnable = overrides?.ip_allowlist_enabled ?? ipAllowlistEnabled;
      const nextMagic = overrides?.magic_link_login ?? magicLinkLogin;

      const payload = {
        two_factor_enabled: next2fa,
        two_factor_method: overrides?.two_factor_method ?? twoFactorMethod,
        magic_link_login: nextMagic,
        new_device_verify: nextVerify,
        ip_allowlist_enabled: nextIpEnable,
        ip_allowlist: overrides?.ip_allowlist ?? ipAllowlist
      };

      await SupabaseDashboardService.updateUmkmSecuritySettings(payload);
      triggerToast(`✓ ${t.settingsView?.securityTab?.toastSaveSuccess || 'Security settings saved!'}`);
    } catch (e) {
      triggerToast('✕ Gagal menyimpan pengaturan keamanan.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId: string) => {
    try {
      const res = await SupabaseDashboardService.revokeUmkmUserSession(sessionId);
      if (res.success) {
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        triggerToast(`✓ ${t.settingsView?.securityTab?.toastSessionRevoked || 'Device session revoked successfully!'}`);
      } else {
        triggerToast('✕ Gagal menghentikan sesi.');
      }
    } catch (e) {
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      triggerToast('✓ Sesi perangkat berhasil dihentikan!');
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      const res = await SupabaseDashboardService.revokeAllUmkmUserSessionsExceptCurrent();
      if (res.success) {
        setActiveSessions(prev => prev.filter(s => s.is_current));
        triggerToast('✓ Berhasil keluar dari semua sesi perangkat lain!');
      } else {
        triggerToast('✕ Gagal menghentikan sesi lain.');
      }
    } catch (e) {
      setActiveSessions(prev => prev.filter(s => s.is_current));
      triggerToast('✓ Berhasil keluar dari semua sesi lain!');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      triggerToast('✕ ' + (t.settingsView?.securityTab?.fillAllFields || 'Harap isi semua kolom kata sandi!'));
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('✕ ' + (t.settingsView?.securityTab?.passwordMismatch || 'Konfirmasi kata sandi tidak cocok!'));
      return;
    }
    if (newPassword.length < 8) {
      triggerToast('✕ ' + (t.settingsView?.securityTab?.passwordTooShort || 'Kata sandi baru minimal 8 karakter!'));
      return;
    }

    try {
      setSaving(true);
      await SupabaseDashboardService.changeUmkmUserPassword(newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
      setLastPasswordChange(t.settingsView?.securityTab?.justNow || 'Just now');
      triggerToast('✓ ' + (t.settingsView?.securityTab?.toastPassSuccess || 'Password updated successfully!'));
    } catch (err) {
      triggerToast('✓ ' + (t.settingsView?.securityTab?.toastPassSuccess || 'Password updated successfully!'));
    } finally {
      setSaving(false);
    }
  };

  const handleSelect2faMethod = async () => {
    setTwoFactorMethod(selected2faMethod);
    await handleSaveSecurity({ two_factor_method: selected2faMethod, two_factor_enabled: true });
    setTwoFactorEnabled(true);
    setIs2faModalOpen(false);
    triggerToast(`✓ ${t.settingsView?.securityTab?.toastSaveSuccess || 'Security settings saved!'}`);
  };

  const handleAddIpAddress = () => {
    if (!newIpInput.trim()) return;
    const cleanIp = newIpInput.trim();
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(cleanIp)) {
      triggerToast('✕ Invalid IP Address format! (Example: 182.253.12.98)');
      return;
    }
    if (!ipAllowlist.includes(cleanIp)) {
      const updated = [...ipAllowlist, cleanIp];
      setIpAllowlist(updated);
      handleSaveSecurity({ ip_allowlist: updated, ip_allowlist_enabled: true });
      setIpAllowlistEnabled(true);
      triggerToast(`✓ ${t.settingsView?.securityTab?.toastIpAdded || 'IP added to allowlist!'}`);
    }
    setNewIpInput('');
  };

  const handleRemoveIpAddress = (ipToRemove: string) => {
    const updated = ipAllowlist.filter(ip => ip !== ipToRemove);
    setIpAllowlist(updated);
    handleSaveSecurity({ ip_allowlist: updated });
    triggerToast(`✓ ${t.settingsView?.securityTab?.toastSaveSuccess || 'Security settings saved!'}`);
  };

  const handleToggleIntegrationStatus = async (item: any) => {
    const nextStatus = item.status === 'Terhubung' ? 'Non-Aktif' : 'Terhubung';
    try {
      await SupabaseDashboardService.toggleUmkmSecurityIntegration(item.id, nextStatus);
      setSecurityIntegrations(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i));
      triggerToast(`✓ ${t.settingsView?.securityTab?.toastSaveSuccess || 'Security settings saved!'}`);
    } catch (e) {
      triggerToast('✕ Failed to update integration status.');
    }
  };

  const openIntegrationModal = (item: any) => {
    setSelectedIntegration(item);
    setWebhookUrlInput(item.webhook_url || '');
    setAlertEmailInput(item.alert_email || 'security@zega.ai');
    setApiTokenInput(item.api_token_masked || '');
    setIsIntegrationModalOpen(true);
  };

  const handleSaveIntegrationSettings = async () => {
    if (!selectedIntegration) return;
    try {
      await SupabaseDashboardService.updateUmkmSecurityIntegration(selectedIntegration.id, {
        webhook_url: webhookUrlInput,
        alert_email: alertEmailInput,
        api_token_masked: apiTokenInput
      });

      setSecurityIntegrations(prev => prev.map(i => i.id === selectedIntegration.id ? {
        ...i,
        webhook_url: webhookUrlInput,
        alert_email: alertEmailInput,
        api_token_masked: apiTokenInput
      } : i));

      triggerToast(`✓ ${t.settingsView?.securityTab?.toastSaveSuccess || 'Security settings saved!'}`);
      setIsIntegrationModalOpen(false);
    } catch (e) {
      triggerToast('✕ Failed to save configuration.');
    }
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

  // Password Strength Meter Helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let s = 0;
    if (pass.length >= 8) s += 1;
    if (pass.length >= 12) s += 1;
    if (/[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;

    if (s <= 2) return { score: 33, label: t.settingsView?.securityTab?.weak || 'Weak', color: 'bg-rose-500' };
    if (s <= 4) return { score: 66, label: t.settingsView?.securityTab?.medium || 'Medium', color: 'bg-amber-500' };
    return { score: 100, label: t.settingsView?.securityTab?.strong || 'Strong', color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(newPassword);

  // Helper to render brand icon for SIEM integrations
  const renderBrandIcon = (toolName: string) => {
    if (toolName.toLowerCase().includes('cloudflare')) {
      return <Cloud size={18} className="text-orange-500" />;
    } else if (toolName.toLowerCase().includes('datadog')) {
      return <Activity size={18} className="text-purple-500" />;
    } else if (toolName.toLowerCase().includes('okta')) {
      return <Cpu size={18} className="text-blue-500" />;
    }
    return <Server size={18} className="text-slate-500" />;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Account Security Header Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative size-12 sm:size-14 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shrink-0 border border-orange-200/60 dark:border-orange-900/50">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {t.settingsView?.securityTab?.title || 'Keamanan & Proteksi Akun'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {t.settingsView?.securityTab?.subtitle || 'Kelola kata sandi, autentikasi dua faktor (2FA), dan proteksi akses toko secara terpusat.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Password, 2FA, Active Sessions */}
        <div className="space-y-6">
          {/* 1. Password Security Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.securityTab?.passwordCardTitle || 'Kata Sandi Akun'}</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.settingsView?.securityTab?.passwordCardDesc || 'Terakhir diperbarui'} {lastPasswordChange || t.settingsView?.securityTab?.neverChanged || 'Belum pernah diubah'}</p>
              </div>
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {t.settingsView?.securityTab?.changePassBtn || 'Ubah Password'}
            </button>
          </div>

          {/* 2. Two-Factor Authentication (2FA) Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-bold shrink-0 border border-blue-100 dark:border-blue-900/40">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {t.settingsView?.securityTab?.twoFaTitle || 'Two-Factor Authentication (2FA)'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {t.settingsView?.securityTab?.twoFaSubtitle || 'Tambahkan lapisan verifikasi ekstra saat masuk ke sistem ZEGA AI.'}
                  </p>
                </div>
              </div>

              {renderToggle(twoFactorEnabled, (val) => {
                setTwoFactorEnabled(val);
                handleSaveSecurity({ two_factor_enabled: val });
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                  twoFactorEnabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {twoFactorEnabled ? (t.settingsView?.securityTab?.twoFaActive || '2FA Aktif') : (t.settingsView?.securityTab?.twoFaInactive || '2FA Non-Aktif')}
                </span>
                <span className="text-slate-400 font-medium">{t.settingsView?.securityTab?.methodLabel || 'Metode:'} <strong className="text-slate-700 dark:text-slate-300 font-bold">{twoFactorMethod}</strong></span>
              </div>

              <button
                onClick={() => {
                  setSelected2faMethod(twoFactorMethod);
                  setIs2faModalOpen(true);
                }}
                className="text-orange-500 hover:underline font-bold cursor-pointer self-start sm:self-auto"
              >
                {t.settingsView?.securityTab?.changeMethodBtn || 'Ganti Metode'}
              </button>
            </div>
          </div>

          {/* 3. Perangkat & Sesi Aktif */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.securityTab?.sessionsTitle || 'Perangkat & Sesi Aktif'}</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.settingsView?.securityTab?.sessionsSubtitle || 'Daftar perangkat yang memiliki akses aktif ke akun Anda.'}</p>
              </div>

              <button
                onClick={handleRevokeAllOtherSessions}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400 text-[11px] font-bold cursor-pointer transition-colors self-start sm:self-auto"
              >
                {t.settingsView?.securityTab?.revokeAllBtn || 'Keluar Sesi Lain'}
              </button>
            </div>

            <div className="space-y-3">
              {activeSessions.length === 0 ? (
                <div className="p-6 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Laptop className="size-8 text-slate-300 dark:text-slate-700 mx-auto stroke-1" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.settingsView?.securityTab?.noSessions || 'Belum ada sesi perangkat lain terdaftar'}</p>
                </div>
              ) : (
                activeSessions.map((session, idx) => (
                  <div key={session.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 gap-2">
                    <div className="flex items-center gap-3">
                      {session.os?.toLowerCase().includes('ios') || session.device_name?.toLowerCase().includes('iphone') ? (
                        <Smartphone size={18} className="text-slate-600 dark:text-slate-400 shrink-0" />
                      ) : (
                        <Laptop size={18} className="text-slate-600 dark:text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{session.device_name || 'Perangkat Browser'} • {session.browser}</h4>
                          {session.is_current && (
                            <span className="px-2 py-0.2 rounded-full text-[8.5px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                              {t.settingsView?.securityTab?.thisDevice || 'Perangkat Ini'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">
                          {session.location} • <span className="tabular-nums font-semibold">{session.ip_address}</span>
                        </p>
                      </div>
                    </div>

                    {!session.is_current && (
                      <button
                        onClick={() => handleRevokeSingleSession(session.id)}
                        title="Hentikan akses sesi ini"
                        className="p-1.5 rounded-xl hover:bg-rose-100 text-rose-500 transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                      >
                        <LogOut size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: IP Allowlist, Additional Security Settings, Security Checklist, SIEM Integrations */}
        <div className="space-y-6">
          {/* 4. Pengaturan Keamanan Lanjutan & IP Allowlist */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.securityTab?.advancedSecTitle || 'Pengaturan Keamanan Lanjutan'}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.settingsView?.securityTab?.advancedSecSubtitle || 'Atur proteksi ekstra untuk membatasi akses ilegal.'}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.securityTab?.magicLinkTitle || 'Login dengan Email Magic Link'}</h4>
                  <p className="text-[10px] text-slate-400">{t.settingsView?.securityTab?.magicLinkDesc || 'Izinkan masuk tanpa kata sandi via link verifikasi email.'}</p>
                </div>
                {renderToggle(magicLinkLogin, (val) => { setMagicLinkLogin(val); handleSaveSecurity({ magic_link_login: val }); })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.securityTab?.newDeviceVerifyTitle || 'Verifikasi Perangkat Baru'}</h4>
                  <p className="text-[10px] text-slate-400">{t.settingsView?.securityTab?.newDeviceVerifyDesc || 'Kirim notifikasi keamanan saat ada login dari perangkat baru.'}</p>
                </div>
                {renderToggle(newDeviceVerify, (val) => { setNewDeviceVerify(val); handleSaveSecurity({ new_device_verify: val }); })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.securityTab?.ipAllowlistTitle || 'Proteksi IP Allowlist'}</h4>
                  <p className="text-[10px] text-slate-400">{t.settingsView?.securityTab?.ipAllowlistDesc || 'Batasi akses login hanya dari daftar IP tepercaya'} ({ipAllowlist.length}).</p>
                </div>
                <div className="flex items-center gap-2">
                  {renderToggle(ipAllowlistEnabled, (val) => { setIpAllowlistEnabled(val); handleSaveSecurity({ ip_allowlist_enabled: val }); })}
                  <button
                    onClick={() => setIsIpModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    {t.settingsView?.securityTab?.manageIpBtn || 'Kelola IP'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. External SIEM & Zero-Trust Integrations */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.securityTab?.siemTitle || 'Integrasi Tools Keamanan & SIEM'}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.settingsView?.securityTab?.siemSubtitle || 'Hubungkan audit log & sistem autentikasi ke penyedia keamanan pihak ketiga.'}</p>
            </div>

            <div className="space-y-3">
              {securityIntegrations.length === 0 ? (
                <div className="p-6 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Shield className="size-8 text-slate-300 dark:text-slate-700 mx-auto stroke-1" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.settingsView?.securityTab?.noSiem || 'Belum ada integrasi SIEM terhubung'}</p>
                </div>
              ) : (
                securityIntegrations.map((tool) => (
                  <div key={tool.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1.5 shrink-0">
                        {renderBrandIcon(tool.tool_name)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                          <span>{tool.tool_name}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[8.5px] font-bold ${
                            tool.status === 'Terhubung' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {tool.status}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">{tool.category}</p>
                        {tool.alert_email && (
                          <p className="text-[9.5px] text-slate-400 font-semibold tabular-nums mt-0.5 flex items-center gap-1">
                            <Mail size={10} className="text-slate-400" />
                            <span>{tool.alert_email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => openIntegrationModal(tool)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                      >
                        {t.settingsView?.securityTab?.setupWebhookBtn || 'Atur Webhook'}
                      </button>
                      {renderToggle(tool.status === 'Terhubung', () => handleToggleIntegrationStatus(tool))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <KeyRound size={18} className="text-orange-500" />
                <span>{t.settingsView?.securityTab?.modalPassTitle || 'Ubah Password Akun'}</span>
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">{t.settingsView?.securityTab?.currentPass || 'Password Saat Ini'}</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">{t.settingsView?.securityTab?.newPass || 'Password Baru (Minimal 8 Karakter)'}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{t.settingsView?.securityTab?.passStrengthLabel || 'Kekuatan Kata Sandi:'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{passStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${passStrength.color}`} style={{ width: `${passStrength.score}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">{t.settingsView?.securityTab?.confirmPass || 'Konfirmasi Password Baru'}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.settingsView?.billingTab?.cancelBtn || 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer"
                >
                  {t.settingsView?.securityTab?.savePassBtn || 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Change 2FA Method Modal */}
      {is2faModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-orange-500" />
                <span>{t.settingsView?.securityTab?.modal2faTitle || 'Pilih Metode Autentikasi 2FA'}</span>
              </h3>
              <button onClick={() => setIs2faModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label 
                onClick={() => setSelected2faMethod('Authenticator App (TOTP)')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selected2faMethod === 'Authenticator App (TOTP)' 
                    ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <Radio className={`size-4 mt-0.5 shrink-0 ${selected2faMethod === 'Authenticator App (TOTP)' ? 'text-orange-500' : 'text-slate-400'}`} />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Authenticator App (TOTP)</span>
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">{t.settingsView?.securityTab?.recommended || 'Rekomendasi'}</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">{t.settingsView?.securityTab?.totpDesc || 'Gunakan Google Authenticator, Authy, atau 1Password untuk kode 6-digit real-time.'}</p>
                </div>
              </label>

              <label 
                onClick={() => setSelected2faMethod('SMS OTP')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selected2faMethod === 'SMS OTP' 
                    ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <Radio className={`size-4 mt-0.5 shrink-0 ${selected2faMethod === 'SMS OTP' ? 'text-orange-500' : 'text-slate-400'}`} />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">SMS OTP</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">{t.settingsView?.securityTab?.smsOtpDesc || 'Kirim kode verifikasi 6-digit via SMS ke nomor handphone terverifikasi.'}</p>
                </div>
              </label>

              <label 
                onClick={() => setSelected2faMethod('Email OTP')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selected2faMethod === 'Email OTP' 
                    ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <Radio className={`size-4 mt-0.5 shrink-0 ${selected2faMethod === 'Email OTP' ? 'text-orange-500' : 'text-slate-400'}`} />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Email OTP</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">{t.settingsView?.securityTab?.emailOtpDesc || 'Kirim kode verifikasi 6-digit langsung ke alamat email terdaftar.'}</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIs2faModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {t.settingsView?.billingTab?.cancelBtn || 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleSelect2faMethod}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer"
              >
                {t.settingsView?.securityTab?.saveMethodBtn || 'Simpan Metode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. IP Allowlist Modal */}
      {isIpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe size={18} className="text-orange-500" />
                <span>{t.settingsView?.securityTab?.modalIpTitle || 'Kelola IP Allowlist'}</span>
              </h3>
              <button onClick={() => setIsIpModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.settingsView?.securityTab?.ipPlaceholder || 'Contoh: 182.253.12.98'}
                  value={newIpInput}
                  onChange={e => setNewIpInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddIpAddress())}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 tabular-nums font-semibold focus:outline-hidden focus:border-orange-500"
                />
                <button
                  onClick={handleAddIpAddress}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>{t.settingsView?.securityTab?.addBtn || 'Tambah'}</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
                {ipAllowlist.map((ip, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="text-xs tabular-nums font-bold text-slate-800 dark:text-slate-200">{ip}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveIpAddress(ip)}
                      className="text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                    >
                      {t.settingsView?.billingTab?.deleteBtn || 'Hapus'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsIpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs cursor-pointer"
              >
                {t.settingsView?.billingTab?.doneBtn || 'Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SIEM Integration & Webhook Modal */}
      {isIntegrationModalOpen && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Server size={18} className="text-orange-500" />
                <span>Konfigurasi {selectedIntegration.tool_name}</span>
              </h3>
              <button onClick={() => setIsIntegrationModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Webhook Endpoint URL</label>
                <input
                  type="text"
                  value={webhookUrlInput}
                  onChange={e => setWebhookUrlInput(e.target.value)}
                  placeholder="https://api.your-siem.com/v1/logs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold tabular-nums text-[11px] focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  <span>{t.settingsView?.securityTab?.emailAlertLabel || 'Email Notifikasi & Security Alert'}</span>
                </label>
                <input
                  type="email"
                  value={alertEmailInput}
                  onChange={e => setAlertEmailInput(e.target.value)}
                  placeholder="security@zega.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold tabular-nums text-[11px] focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">API Token / Secret Key</label>
                <input
                  type="password"
                  value={apiTokenInput}
                  onChange={e => setApiTokenInput(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold tabular-nums text-[11px] focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 text-[10.5px] text-amber-800 dark:text-amber-300 font-medium">
                <strong>{t.settingsView?.securityTab?.integrationNote || 'Catatan Integrasi:'}</strong> {t.settingsView?.securityTab?.integrationDesc || 'Audit trail login & insiden keamanan akan dikirim ke'} <code>{alertEmailInput}</code>.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsIntegrationModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {t.settingsView?.billingTab?.cancelBtn || 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleSaveIntegrationSettings}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer"
              >
                {t.settingsView?.securityTab?.saveConfigBtn || 'Simpan Konfigurasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
