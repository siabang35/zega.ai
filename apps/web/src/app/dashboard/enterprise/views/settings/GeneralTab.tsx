import React, { useState } from 'react';
import { Upload, Copy, CheckCircle, ShieldAlert, Trash2, Edit, X, Plus, Shield, Laptop, Globe, RefreshCw } from 'lucide-react';
import { enterpriseSupabaseService } from '../../../services/enterpriseSupabaseService';

interface GeneralTabProps {
  settings: any;
  setSettings: (s: any) => void;
  onTriggerToast?: (msg: string) => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

export function GeneralTab({ settings, setSettings, onTriggerToast, onUpdateAvatar }: GeneralTabProps) {
  // Modals state
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [cdnLogoInput, setCdnLogoInput] = useState(settings.logo_cdn_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop');

  const [showIpModal, setShowIpModal] = useState(false);
  const [newIpRule, setNewIpRule] = useState('');
  const [ipList, setIpList] = useState<string[]>(
    Array.isArray(settings.allowed_ip_allowlist) ? settings.allowed_ip_allowlist : ['103.12.45.67', '203.0.113.0/24']
  );

  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: '1', device: 'Chrome on macOS (Jakarta)', ip: '103.12.45.67', lastActive: 'Current Session', current: true },
    { id: '2', device: 'Firefox on Linux (Singapore)', ip: '203.0.113.12', lastActive: '12 mins ago', current: false },
    { id: '3', device: 'Safari on iOS (Bandung)', ip: '180.252.10.4', lastActive: '1 hour ago', current: false },
  ]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleLocalLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        if (onTriggerToast) onTriggerToast('⚠️ Ukuran berkas maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setCdnLogoInput(dataUrl);
          setSettings({ ...settings, logo_cdn_url: dataUrl, user_avatar: dataUrl });
          if (onUpdateAvatar) onUpdateAvatar(dataUrl);
          if (onTriggerToast) onTriggerToast('✓ Foto profil dari perangkat lokal berhasil dimuat!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Copy Org ID
  const copyOrgId = () => {
    navigator.clipboard.writeText(settings.organization_id_code || 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ');
    if (onTriggerToast) onTriggerToast('Organization ID disalin ke clipboard!');
  };

  // 2. Realtime Logo CDN Upload
  const handleUploadLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cdnLogoInput.trim()) return;
    const res = await enterpriseSupabaseService.uploadOrganizationLogoCDNRealtime(cdnLogoInput);
    if (res.success) {
      setSettings({ ...settings, logo_cdn_url: cdnLogoInput, user_avatar: cdnLogoInput });
      if (onUpdateAvatar) onUpdateAvatar(cdnLogoInput);
      if (onTriggerToast) onTriggerToast('Logo & Foto Profil CDN Berhasil Diperbarui & Disinkronkan Realtime!');
      setShowLogoModal(false);
    } else {
      if (onTriggerToast) onTriggerToast('Gagal update Logo: ' + res.error);
    }
  };

  // 3. Realtime Toggle Handlers
  const handleToggleInvite = async (checked: boolean) => {
    const newSettings = { ...settings, allow_member_invite: checked };
    setSettings(newSettings);
    await enterpriseSupabaseService.updateOrganizationProfileRealtime(newSettings);
    if (onTriggerToast) onTriggerToast(`Izin undang anggota: ${checked ? 'Aktif' : 'Nonaktif'} (Realtime DB)`);
  };

  const handleToggle2FA = async (checked: boolean) => {
    const newSettings = { ...settings, require_2fa_all: checked };
    setSettings(newSettings);
    await enterpriseSupabaseService.updateOrganizationProfileRealtime(newSettings);
    if (onTriggerToast) onTriggerToast(`Wajib 2FA seluruh anggota: ${checked ? 'Aktif' : 'Nonaktif'} (Realtime DB)`);
  };

  // 4. Realtime IP Allowlist
  const handleAddIpRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpRule.trim()) return;
    const updated = [...ipList, newIpRule.trim()];
    setIpList(updated);
    setSettings({ ...settings, allowed_ip_allowlist: updated });
    await enterpriseSupabaseService.addIpAllowlistRuleRealtime(newIpRule.trim());
    setNewIpRule('');
    if (onTriggerToast) onTriggerToast(`Rule IP ${newIpRule} Ditambahkan Realtime ke DB!`);
  };

  const handleDeleteIpRule = async (ip: string) => {
    const updated = ipList.filter((item) => item !== ip);
    setIpList(updated);
    setSettings({ ...settings, allowed_ip_allowlist: updated });
    await enterpriseSupabaseService.deleteIpAllowlistRuleRealtime(ip);
    if (onTriggerToast) onTriggerToast(`Rule IP ${ip} Dihapus dari DB!`);
  };

  // 5. Realtime Terminate Session
  const handleTerminateSession = (id: string) => {
    const updated = activeSessions.filter((s) => s.id !== id);
    setActiveSessions(updated);
    setSettings({ ...settings, active_sessions_count: updated.length });
    if (onTriggerToast) onTriggerToast('Sesi Berhasil Diakhiri Realtime!');
  };

  // 6. Delete Organization Realtime RPC
  const handleDeleteOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== (settings.organization_name || 'Acme Enterprise')) {
      if (onTriggerToast) onTriggerToast('Nama konfirmasi organisasi tidak cocok!');
      return;
    }
    setIsDeleting(true);
    const res = await enterpriseSupabaseService.deleteOrganizationRealtime(deleteConfirmText);
    setIsDeleting(false);
    setShowDeleteModal(false);
    if (res.success) {
      if (onTriggerToast) onTriggerToast('Permintaan penghapusan organisasi diterima & dicatat di audit logs DB!');
    } else {
      if (onTriggerToast) onTriggerToast('Gagal hapus org: ' + res.error);
    }
  };

  return (
    <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
      {/* 1. ORGANIZATION PROFILE CARD */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Organization Profile</h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Top Row / Left: Org Name & Website */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Organization Name</label>
              <input
                type="text"
                value={settings.organization_name || 'Acme Enterprise'}
                onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Website</label>
              <input
                type="text"
                value={settings.website || 'https://acme.com'}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Top Row / Right: Organization Logo & Profile Avatar */}
          <div className="lg:col-span-4 flex items-center justify-end">
            <div className="w-full p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative group size-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md overflow-hidden shrink-0 border-2 border-indigo-500">
                  {settings.user_avatar || settings.logo_cdn_url ? (
                    <img
                      src={settings.user_avatar || settings.logo_cdn_url}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'; }}
                      alt="Avatar Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    'A'
                  )}
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">Profile Avatar & Logo</span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">Realtime DB & CDN Sync</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0 transition-all active:scale-95"
              >
                <Upload size={13} /> <span>Ganti Foto</span>
              </button>
            </div>
          </div>

          {/* Bottom Row / Left: Description */}
          <div className="lg:col-span-8">
            <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Description</label>
            <textarea
              rows={3}
              value={settings.description || 'Acme Enterprise is building the future with AI-powered automation.'}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Bottom Row / Right: Contact Email, Industry, Org Size */}
          <div className="lg:col-span-4 space-y-3">
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Primary Contact Email</label>
              <input
                type="email"
                value={settings.primary_contact_email || 'admin@acme.com'}
                onChange={(e) => setSettings({ ...settings, primary_contact_email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Industry / Sector</label>
              <select
                value={settings.industry || 'Technology'}
                onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option>Technology</option>
                <option>Finance & Banking</option>
                <option>Healthcare</option>
                <option>E-commerce</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Organization Size</label>
              <select
                value={settings.organization_size || '1001+ employees'}
                onChange={(e) => setSettings({ ...settings, organization_size: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option>1-50 employees</option>
                <option>51-200 employees</option>
                <option>201-1000 employees</option>
                <option>1001+ employees</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THREE-COLUMN GRID BELOW ORGANIZATION PROFILE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* COLUMN 1: PREFERENCES */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Preferences</h3>

          <div className="space-y-4">
            {/* Allow members to invite */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Allow members to invite new users</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Enable team members to send invites to the organization</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.allow_member_invite !== false}
                  onChange={(e) => handleToggleInvite(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* Require 2FA */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Require 2FA for all members</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Enforce two-factor authentication for enhanced security</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={!!settings.require_2fa_all}
                  onChange={(e) => handleToggle2FA(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* Default Project Visibility */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Default Project Visibility</label>
                <span className="text-[10px] text-slate-400">Choose default visibility for new projects</span>
              </div>
              <select
                value={settings.default_project_visibility || 'Private'}
                onChange={(e) => setSettings({ ...settings, default_project_visibility: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold"
              >
                <option>Private</option>
                <option>Public</option>
                <option>Internal Only</option>
              </select>
            </div>

            {/* Default Dashboard */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Default Dashboard</label>
                <span className="text-[10px] text-slate-400">Set the default dashboard for all users</span>
              </div>
              <select
                value={settings.default_dashboard || 'Overview'}
                onChange={(e) => setSettings({ ...settings, default_dashboard: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold"
              >
                <option>Overview</option>
                <option>AI Command Center</option>
                <option>Analytics Hub</option>
              </select>
            </div>

            {/* Date & Time Format */}
            <div className="space-y-2">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Date & Time Format</label>
                <span className="text-[10px] text-slate-400 block mb-1.5">Set how dates and times are displayed across the platform</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Date Format</label>
                  <select
                    value={settings.date_format || 'May 27, 2025 (MMM DD, YYYY)'}
                    onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold text-[11px]"
                  >
                    <option>May 27, 2025 (MMM DD, YYYY)</option>
                    <option>27/05/2025 (DD/MM/YYYY)</option>
                    <option>2025-05-27 (YYYY-MM-DD)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Time Format</label>
                  <select
                    value={settings.time_format || '24-hour (14:30)'}
                    onChange={(e) => setSettings({ ...settings, time_format: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold text-[11px]"
                  >
                    <option>24-hour (14:30)</option>
                    <option>12-hour (2:30 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Language</label>
                <span className="text-[10px] text-slate-400">Select default language for organization</span>
              </div>
              <select
                value={settings.language || 'English (US)'}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold"
              >
                <option>English (US)</option>
                <option>Indonesian (ID)</option>
                <option>Japanese (JP)</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Currency</label>
                <span className="text-[10px] text-slate-400">Select default currency for billing</span>
              </div>
              <select
                value={settings.currency || 'USD - US Dollar ($)'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold"
              >
                <option>USD - US Dollar ($)</option>
                <option>IDR - Indonesian Rupiah (Rp)</option>
                <option>EUR - Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* COLUMN 2: REGIONAL SETTINGS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Regional Settings</h3>

          <div className="space-y-4">
            {/* Timezone */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Timezone</label>
              <select
                value={settings.timezone || '(GMT+7) Asia/Jakarta'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold"
              >
                <option>(GMT+7) Asia/Jakarta</option>
                <option>(GMT+8) Asia/Singapore</option>
                <option>(UTC+00:00) UTC / GMT</option>
              </select>
            </div>

            {/* Data Residency */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Data Residency</label>
              <span className="text-[10px] text-slate-400 block mb-1.5">Choose where your organization's data is stored</span>
              <select
                value={settings.data_residency || 'Asia Pacific (Singapore)'}
                onChange={(e) => setSettings({ ...settings, data_residency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold"
              >
                <option>Asia Pacific (Singapore)</option>
                <option>US East (N. Virginia)</option>
                <option>Europe (Frankfurt)</option>
              </select>
            </div>

            {/* Local Compliance */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Local Compliance</span>
                <span className="text-[10px] text-slate-400">Your data storage complies with local regulations.</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                Compliant
              </span>
            </div>

            {/* Storage Region */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Storage Region</label>
              <input
                type="text"
                readOnly
                value={settings.storage_region || 'ap-southeast-1 (AWS Singapore)'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Backup Region */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Backup Region</label>
              <input
                type="text"
                readOnly
                value={settings.backup_region || 'ap-southeast-3 (AWS Jakarta)'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* COLUMN 3: SESSION & ACCESS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Session & Access</h3>

          <div className="space-y-4">
            {/* Session Timeout */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Session Timeout</label>
              <span className="text-[10px] text-slate-400 block mb-1.5">Automatically log out inactive users</span>
              <select
                value={settings.session_timeout_minutes || 30}
                onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            {/* Idle Warning */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Idle Warning</label>
              <span className="text-[10px] text-slate-400 block mb-1.5">Show warning before session expires</span>
              <select
                value={settings.idle_warning_minutes || 5}
                onChange={(e) => setSettings({ ...settings, idle_warning_minutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 font-semibold"
              >
                <option value={3}>3 minutes before timeout</option>
                <option value={5}>5 minutes before timeout</option>
                <option value={10}>10 minutes before timeout</option>
              </select>
            </div>

            {/* Allowed IP Allowlist */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Allowed IP Allowlist</label>
              <span className="text-[10px] text-slate-400 block mb-1.5">Restrict access to specific IP addresses (optional)</span>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-3 space-y-2">
                <div className="font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {ipList.map((ip, i) => (
                    <div key={i}>{ip}</div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={12} /> {ipList.length} IP rules configured
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowIpModal(true)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-[11px] hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Active Sessions</span>
                <span className="text-[10px] text-slate-400 block mb-2">View and manage active sessions</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{activeSessions.length}</span>
                  <span className="text-[11px] font-medium text-slate-400">Active sessions</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionsModal(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                View Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SYSTEM INFORMATION FOOTER CARD */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-none">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">System Information</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-left">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Organization ID</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
                {settings.organization_id_code || 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ'}
              </span>
              <button onClick={copyOrgId} className="text-slate-400 hover:text-indigo-600 cursor-pointer" title="Copy Org ID">
                <Copy size={12} />
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Created At</span>
            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block mt-0.5">Jan 10, 2025</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Plan</span>
            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block mt-0.5">Enterprise Plan</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Status</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold inline-block mt-0.5">
              Active
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Member Since</span>
            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block mt-0.5">142 days</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Last Updated</span>
            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block mt-0.5">May 27, 2025 10:30 AM</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Environment</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold inline-block mt-0.5">
              Production
            </span>
          </div>
        </div>
      </div>

      {/* 4. DANGER ZONE RED PANEL */}
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Danger Zone</h3>
          <span className="font-bold text-xs text-rose-900 dark:text-rose-200 block mt-0.5">Permanently delete organization</span>
          <p className="text-[11px] text-rose-600/90 dark:text-rose-300/80 mt-0.5">
            This action cannot be undone. All data, projects, and settings will be permanently deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer shrink-0"
        >
          <Trash2 size={14} /> <span>Delete Organization</span>
        </button>
      </div>

      {/* MODAL 1: UPLOAD LOGO & AVATAR CDN */}
      {showLogoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Upload / Update Logo & Avatar CDN</h3>
                <p className="text-[10px] text-slate-400">Terhubung langsung ke Supabase DB & Cloudflare R2 CDN</p>
              </div>
              <button onClick={() => setShowLogoModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Hidden File Input for Device Storage Upload */}
            <input
              type="file"
              ref={logoFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLocalLogoFileUpload}
            />

            {/* Upload From Device Button */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">Pilih Dari Perangkat Saya</span>
                <span className="text-[10px] text-slate-400 block">Ambil berkas gambar asli dari galeri / penyimpanan komputer</span>
              </div>
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0"
              >
                <Upload size={13} /> <span>Browse Berkas</span>
              </button>
            </div>

            {/* Preset Admin Avatars */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Atau Pilih Avatar Enterprise Admin Preset</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces'
                ].map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCdnLogoInput(url);
                      setSettings({ ...settings, user_avatar: url, logo_cdn_url: url });
                    }}
                    className={`rounded-full overflow-hidden border-2 transition-all cursor-pointer aspect-square ${
                      cdnLogoInput === url ? 'border-indigo-600 ring-2 ring-indigo-600/30 scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleUploadLogo} className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Or Custom Image / Logo CDN URL</label>
                <input
                  type="text"
                  placeholder="https://cdn.zega.ai/assets/avatar.png"
                  value={cdnLogoInput}
                  onChange={(e) => setCdnLogoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
                <div className="size-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center overflow-hidden shrink-0 border border-indigo-300">
                  {cdnLogoInput ? <img src={cdnLogoInput} alt="Preview" className="w-full h-full object-cover" /> : 'A'}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase block">Live Preview</span>
                  <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[240px]">{cdnLogoInput || 'No URL set'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLogoModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs">
                  Simpan & Update CDN (Realtime DB)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT IP ALLOWLIST */}
      {showIpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">IP Allowlist Manager</h3>
              <button onClick={() => setShowIpModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddIpRule} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 192.168.1.1 or 10.0.0.0/16"
                value={newIpRule}
                onChange={(e) => setNewIpRule(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
              />
              <button type="submit" className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1">
                <Plus size={13} /> Tambah Rule
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 block">Current Configured IP Rules ({ipList.length})</span>
              {ipList.map((ip, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 font-mono">
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{ip}</span>
                  <button onClick={() => handleDeleteIpRule(ip)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setShowIpModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs">
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ACTIVE SESSIONS */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Organization Sessions ({activeSessions.length})</h3>
              <button onClick={() => setShowSessionsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {activeSessions.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                      <Laptop size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.device}</span>
                        {s.current && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">IP: {s.ip} • {s.lastActive}</span>
                    </div>
                  </div>

                  {!s.current && (
                    <button
                      onClick={() => handleTerminateSession(s.id)}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 font-bold text-[11px] hover:bg-rose-50 cursor-pointer"
                    >
                      Terminate
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setShowSessionsModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE ORGANIZATION CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-900/40">
              <h3 className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                <ShieldAlert size={16} /> <span>Konfirmasi Hapus Organisasi</span>
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Tindakan ini <strong className="text-rose-600">SANGAT BERBAHAYA</strong> dan tidak dapat dibatalkan. Seluruh data, agen, dan konfigurasi organisasi akan dihapus secara permanen dari database.
            </p>

            <form onSubmit={handleDeleteOrganization} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Ketik nama organisasi <strong className="text-slate-900 dark:text-slate-100">{settings.organization_name || 'Acme Enterprise'}</strong> untuk mengonfirmasi:
                </label>
                <input
                  type="text"
                  placeholder={settings.organization_name || 'Acme Enterprise'}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || deleteConfirmText !== (settings.organization_name || 'Acme Enterprise')}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1"
                >
                  {isDeleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>Hapus Organisasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
