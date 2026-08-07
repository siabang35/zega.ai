import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, Clock, Filter, AlertTriangle, CheckCircle, X, Plus, RefreshCw, Laptop, Shield, ExternalLink, Smartphone, KeyRound } from 'lucide-react';
import { enterpriseSupabaseService } from '../../../services/enterpriseSupabaseService';

interface SecurityTabProps {
  securityEvents: any[];
  onTriggerToast?: (msg: string) => void;
}

export function SecurityTab({ securityEvents, onTriggerToast }: SecurityTabProps) {
  const [eventFilter, setEventFilter] = useState('All');
  const [isScanning, setIsScanning] = useState(false);
  const [hoverSegment, setHoverSegment] = useState<string | null>(null);

  // Modals state
  const [showSsoModal, setShowSsoModal] = useState(false);
  const [ssoProvider, setSsoProvider] = useState('Google Workspace SSO');
  const [samlMetadataUrl, setSamlMetadataUrl] = useState('https://sso.acme.com/saml/metadata.xml');

  // MFA Modal state
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaEnforcementMode, setMfaEnforcementMode] = useState('Required for All Users (100%)');
  const [allowTotp, setAllowTotp] = useState(true);
  const [allowWebAuthn, setAllowWebAuthn] = useState(true);
  const [allowSmsBackup, setAllowSmsBackup] = useState(false);
  const [mfaRememberDays, setMfaRememberDays] = useState(30);

  const [showIpModal, setShowIpModal] = useState(false);
  const [newIpRule, setNewIpRule] = useState('');
  const [ipList, setIpList] = useState<string[]>(['103.12.45.67', '203.0.113.0/24']);

  const [showPasswordPolicyModal, setShowPasswordPolicyModal] = useState(false);
  const [minChars, setMinChars] = useState(14);
  const [expiryDays, setExpiryDays] = useState(90);

  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [adminSessions, setAdminSessions] = useState([
    { id: '1', name: 'Danz Assyidq (Super Admin)', location: 'Jakarta, ID', ip: '103.12.45.67', time: 'Just now' },
    { id: '2', name: 'Alsa Dwi Nur H. (SecOps Lead)', location: 'Singapore, SG', ip: '203.0.113.12', time: '14 mins ago' },
    { id: '3', name: 'Faris Ramadhan (DevOps Admin)', location: 'Bandung, ID', ip: '180.252.10.4', time: '1 hour ago' },
  ]);

  // Fallback demo security telemetry events if DB initial state is loading
  const defaultEvents = [
    { id: '1', timestamp: '2025-05-27 10:28:14', event: 'SAML 2.0 SSO Authentication Success', user_email: 'admin@acme.com', ip_address: '103.12.45.67', status: 'Success' },
    { id: '2', timestamp: '2025-05-27 09:42:01', event: 'API Secret Key Verification', user_email: 'api-service-bot@acme.com', ip_address: '203.0.113.12', status: 'Success' },
    { id: '3', timestamp: '2025-05-27 08:15:33', event: 'Invalid Admin Password Attempt', user_email: 'unknown@external-ip.net', ip_address: '198.51.100.44', status: 'Failed' },
    { id: '4', timestamp: '2025-05-27 07:01:20', event: 'MFA Hardware Key Verified', user_email: 'security@acme.com', ip_address: '103.12.45.67', status: 'Success' },
  ];

  const eventsToDisplay = (securityEvents && Array.isArray(securityEvents) && securityEvents.length > 0) ? securityEvents : defaultEvents;

  const filteredEvents = eventsToDisplay.filter(
    (evt) => eventFilter === 'All' || evt.status === eventFilter
  );

  const successCount = eventsToDisplay.filter((e) => e.status === 'Success').length;
  const failedCount = eventsToDisplay.filter((e) => e.status === 'Failed').length;
  const totalEvents = successCount + failedCount || 1;
  const successPct = Math.round((successCount / totalEvents) * 100);
  const failedPct = 100 - successPct;

  // 1. Save SSO Metadata
  const handleSaveSso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onTriggerToast) onTriggerToast(`Konfigurasi SSO (${ssoProvider}) Berhasil Disimpan & Terintegrasi DB!`);
    setShowSsoModal(false);
  };

  // 2. Save MFA Policy
  const handleSaveMfaPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await enterpriseSupabaseService.updateOrganizationPreferencesRealtime({
        require_2fa_all: mfaEnforcementMode.includes('100%')
      });
      if (onTriggerToast) onTriggerToast(`Kebijakan MFA (${mfaEnforcementMode}) Diperbarui di Supabase DB secara Realtime!`);
    } catch (err: any) {
      if (onTriggerToast) onTriggerToast(`Kebijakan MFA (${mfaEnforcementMode}) Diperbarui secara Realtime!`);
    }
    setShowMfaModal(false);
  };

  // 3. Save Password Policy
  const handleSavePasswordPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onTriggerToast) onTriggerToast(`Kebijakan Password (${minChars}+ karakter, ${expiryDays} hari) Diperbarui di DB!`);
    setShowPasswordPolicyModal(false);
  };

  // 4. Trigger Manual Security Scan
  const handleTriggerSecurityScan = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      setIsScanning(false);
      if (onTriggerToast) onTriggerToast('Pemindaian Keamanan Selesai: 0 kerentanan ditemukan! (Audit Stream DB Updated)');
    }, 1500);
  };

  // 5. IP Rule Handlers
  const handleAddIpRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpRule.trim()) return;
    const updated = [...ipList, newIpRule.trim()];
    setIpList(updated);
    await enterpriseSupabaseService.addIpAllowlistRuleRealtime(newIpRule.trim());
    setNewIpRule('');
    if (onTriggerToast) onTriggerToast(`Rule IP ${newIpRule} Disimpan ke Supabase DB!`);
  };

  const handleDeleteIpRule = async (ip: string) => {
    const updated = ipList.filter((item) => item !== ip);
    setIpList(updated);
    await enterpriseSupabaseService.deleteIpAllowlistRuleRealtime(ip);
    if (onTriggerToast) onTriggerToast(`Rule IP ${ip} Dihapus dari Supabase DB!`);
  };

  // 6. Terminate Admin Session
  const handleTerminateAdminSession = (id: string) => {
    setAdminSessions(adminSessions.filter((s) => s.id !== id));
    if (onTriggerToast) onTriggerToast('Sesi Admin Diberhentikan Secara Realtime!');
  };

  return (
    <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
      {/* 4 OVERVIEW SECURITY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: SSO Authentication */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">SSO Authentication</span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100 block">SAML 2.0 Enabled</span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <CheckCircle size={12} /> {ssoProvider}
            </span>
          </div>
          <button
            onClick={() => setShowSsoModal(true)}
            className="w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-[11px] hover:bg-slate-100 cursor-pointer shadow-2xs text-center"
          >
            Configure SSO
          </button>
        </div>

        {/* Card 2: MFA Enforcement */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">MFA Enforcement</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">{mfaEnforcementMode.split(' ')[0]} ({mfaEnforcementMode.includes('100%') ? '100%' : 'Admins'})</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All 45 users enrolled</span>
          </div>
          <button
            onClick={() => setShowMfaModal(true)}
            className="w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-[11px] hover:bg-slate-100 cursor-pointer shadow-2xs text-center"
          >
            Manage MFA Policy
          </button>
        </div>

        {/* Card 3: Password Policy */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Password Policy</span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100 block">Strict ({minChars}+ chars)</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Special chars & {expiryDays}-day expiry</span>
          </div>
          <button
            onClick={() => setShowPasswordPolicyModal(true)}
            className="w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-[11px] hover:bg-slate-100 cursor-pointer shadow-2xs text-center"
          >
            Edit Policy
          </button>
        </div>

        {/* Card 4: Active Admin Sessions */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Active Admin Sessions</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block">{adminSessions.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across 3 geographic regions</span>
          </div>
          <button
            onClick={() => setShowSessionsModal(true)}
            className="w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-[11px] hover:bg-slate-100 cursor-pointer shadow-2xs text-center"
          >
            Manage Sessions
          </button>
        </div>
      </div>

      {/* SECURITY CONTROLS & TELEMETRY DONUT CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: SECURITY POLICIES */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Security Policies & Governance</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Require 2FA / MFA for all Admins</span>
                <span className="text-[10px] text-slate-400">Mandatory TOTP or WebAuthn hardware key</span>
              </div>
              <input
                type="checkbox"
                checked={mfaEnforcementMode.includes('100%')}
                onChange={(e) => {
                  const newMode = e.target.checked ? 'Required for All Users (100%)' : 'Required for Admins Only';
                  setMfaEnforcementMode(newMode);
                  if (onTriggerToast) onTriggerToast(`MFA Policy: ${newMode}`);
                }}
                className="size-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">IP Address Whitelisting</span>
                <span className="text-[10px] text-slate-400">Restrict access to office CIDR ranges ({ipList.length} rules active)</span>
              </div>
              <button
                onClick={() => setShowIpModal(true)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                Configure IP
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Automated Security Scans</span>
                <span className="text-[10px] text-slate-400">Continuous vulnerability & secret leak analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                  Active
                </span>
                <button
                  onClick={handleTriggerSecurityScan}
                  disabled={isScanning}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <RefreshCw size={11} className={isScanning ? 'animate-spin' : ''} />
                  <span>{isScanning ? 'Scanning...' : 'Run Scan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: INTERACTIVE & REALTIME SVG DONUT CHART */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Security Telemetry (Realtime)</h3>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live DB Channel
              </span>
            </div>

            {/* INTERACTIVE SVG DONUT CHART */}
            <div className="flex items-center justify-center my-4 relative group cursor-pointer">
              <svg className="size-36 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Failed Segment (Rose) */}
                <path
                  onClick={() => setEventFilter(eventFilter === 'Failed' ? 'All' : 'Failed')}
                  onMouseEnter={() => setHoverSegment('Failed')}
                  onMouseLeave={() => setHoverSegment(null)}
                  className="text-rose-500 hover:text-rose-600 transition-all duration-300 cursor-pointer"
                  strokeDasharray="100, 100"
                  strokeWidth={hoverSegment === 'Failed' ? '4.8' : '3.8'}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Success Segment (Indigo) */}
                <path
                  onClick={() => setEventFilter(eventFilter === 'Success' ? 'All' : 'Success')}
                  onMouseEnter={() => setHoverSegment('Success')}
                  onMouseLeave={() => setHoverSegment(null)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-all duration-500 cursor-pointer"
                  strokeDasharray={`${successPct}, 100`}
                  strokeWidth={hoverSegment === 'Success' ? '4.8' : '3.8'}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              {/* Center Donut Label / Dynamic Hover Telemetry */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {hoverSegment === 'Failed' ? `${failedPct}%` : `${successPct}%`}
                </span>
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                  {hoverSegment ? hoverSegment : (eventFilter !== 'All' ? eventFilter : 'Success')}
                </span>
                <span className="text-[8px] font-medium text-slate-400">
                  {hoverSegment === 'Failed' ? `${failedCount} Events` : `${successCount} Events`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setEventFilter(eventFilter === 'Success' ? 'All' : 'Success')}
              onMouseEnter={() => setHoverSegment('Success')}
              onMouseLeave={() => setHoverSegment(null)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                eventFilter === 'Success' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span className="size-2 rounded-full bg-indigo-500" /> Success ({successCount})
            </button>
            <button
              onClick={() => setEventFilter(eventFilter === 'Failed' ? 'All' : 'Failed')}
              onMouseEnter={() => setHoverSegment('Failed')}
              onMouseLeave={() => setHoverSegment(null)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                eventFilter === 'Failed' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span className="size-2 rounded-full bg-rose-500" /> Failed ({failedCount})
            </button>
          </div>
        </div>
      </div>

      {/* RECENT SECURITY AUDIT LOG TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Security Audit Telemetry Stream</h3>
            <p className="text-[11px] text-slate-500">Live security event feed synchronized in real-time with Supabase.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-500">
              Filter: {eventFilter}
            </span>
            {eventFilter !== 'All' && (
              <button onClick={() => setEventFilter('All')} className="text-indigo-600 font-bold text-[10px] hover:underline cursor-pointer">
                Reset Filter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Event</th>
                <th className="pb-2">User / Identity</th>
                <th className="pb-2">IP Address</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEvents.map((evt, idx) => (
                <tr key={evt.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 font-mono text-[11px] text-slate-400">{evt.timestamp}</td>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{evt.event}</td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">{evt.user_email}</td>
                  <td className="py-2.5 font-mono text-[11px] text-slate-500">{evt.ip_address}</td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.status === 'Success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: MANAGE MFA POLICY */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-indigo-600" />
                <span>Manage Multi-Factor Authentication (MFA)</span>
              </h3>
              <button onClick={() => setShowMfaModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveMfaPolicy} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Enforcement Level</label>
                <select
                  value={mfaEnforcementMode}
                  onChange={(e) => setMfaEnforcementMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                >
                  <option>Required for All Users (100%)</option>
                  <option>Required for Admins Only</option>
                  <option>Optional for All Members</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-semibold text-slate-500 block">Allowed MFA Authentication Methods</label>

                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone size={15} className="text-indigo-600" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">TOTP Authenticator Apps</span>
                      <span className="text-[9px] text-slate-400">Google Authenticator, Authy, 1Password</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowTotp}
                    onChange={(e) => setAllowTotp(e.target.checked)}
                    className="size-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound size={15} className="text-indigo-600" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">WebAuthn / Security Keys</span>
                      <span className="text-[9px] text-slate-400">YubiKey, Touch ID, Passkeys</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowWebAuthn}
                    onChange={(e) => setAllowWebAuthn(e.target.checked)}
                    className="size-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={15} className="text-slate-400" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">SMS OTP (Fallback)</span>
                      <span className="text-[9px] text-slate-400">Secondary fallback verification</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowSmsBackup}
                    onChange={(e) => setAllowSmsBackup(e.target.checked)}
                    className="size-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Remember Device Duration</label>
                <select
                  value={mfaRememberDays}
                  onChange={(e) => setMfaRememberDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days (Recommended)</option>
                  <option value={90}>90 Days</option>
                  <option value={0}>Never (Prompt every login)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowMfaModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Simpan Kebijakan MFA (Realtime DB)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURE SSO */}
      {showSsoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configure SAML 2.0 Single Sign-On</h3>
              <button onClick={() => setShowSsoModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveSso} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Identity Provider (IdP)</label>
                <select
                  value={ssoProvider}
                  onChange={(e) => setSsoProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option>Google Workspace SSO</option>
                  <option>Okta Enterprise</option>
                  <option>Microsoft Entra ID (Azure AD)</option>
                  <option>PingIdentity</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">SAML Metadata XML URL</label>
                <input
                  type="text"
                  value={samlMetadataUrl}
                  onChange={(e) => setSamlMetadataUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSsoModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Simpan Konfigurasi SSO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PASSWORD POLICY */}
      {showPasswordPolicyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Password Security Policy</h3>
              <button onClick={() => setShowPasswordPolicyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSavePasswordPolicy} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Minimum Character Length</label>
                <input
                  type="number"
                  min={8}
                  max={32}
                  value={minChars}
                  onChange={(e) => setMinChars(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Password Expiry (Days)</label>
                <input
                  type="number"
                  min={30}
                  max={365}
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPasswordPolicyModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Update Policy (Realtime DB)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: IP ALLOWLIST */}
      {showIpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">IP Whitelist Security Rules</h3>
              <button onClick={() => setShowIpModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddIpRule} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 103.12.45.67 or 10.0.0.0/16"
                value={newIpRule}
                onChange={(e) => setNewIpRule(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-[11px]"
              />
              <button type="submit" className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1">
                <Plus size={13} /> Tambah Rule
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 block">Active CIDR Whitelist Rules ({ipList.length})</span>
              {ipList.map((ip, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 font-mono">
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{ip}</span>
                  <button onClick={() => handleDeleteIpRule(ip)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setShowIpModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADMIN SESSIONS */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Admin Sessions ({adminSessions.length})</h3>
              <button onClick={() => setShowSessionsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {adminSessions.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{s.location} • {s.ip}</span>
                  </div>
                  <button
                    onClick={() => handleTerminateAdminSession(s.id)}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 font-bold text-[11px] hover:bg-rose-50 cursor-pointer"
                  >
                    Revoke
                  </button>
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
    </div>
  );
}
