import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Key,
  CreditCard,
  Bell,
  Lock,
  Link2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Globe,
  Clock,
  User,
  ExternalLink,
  Save,
  Check
} from 'lucide-react';

interface SettingsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function SettingsView({ onTriggerToast }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [orgName, setOrgName] = useState('Acme Enterprise');
  const [website, setWebsite] = useState('https://acme.com');
  const [description, setDescription] = useState('Acme Enterprise is building the future with AI-powered automation.');

  const [allowInvite, setAllowInvite] = useState(true);
  const [require2FA, setRequire2FA] = useState(false);
  const [visibility, setVisibility] = useState('Private');

  const handleSave = () => {
    if (onTriggerToast) onTriggerToast('Pengaturan Berhasil Disimpan!');
  };

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Settings
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your organization settings and preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          <Save size={15} />
          <span>Save Changes</span>
        </button>
      </div>

      {/* TWO-COLUMN LAYOUT: NAV SIDEBAR + MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT NAV SIDEBAR */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1 shadow-none">
          {[
            { id: 'general', label: 'General', desc: 'Organization profile and basic settings', icon: Settings },
            { id: 'security', label: 'Security', desc: 'Password, SSO, and security policies', icon: ShieldCheck },
            { id: 'api_access', label: 'API & Access', desc: 'API keys, tokens, and access control', icon: Key },
            { id: 'billing', label: 'Billing & Plan', desc: 'Subscription, invoices, and usage', icon: CreditCard },
            { id: 'notifications', label: 'Notifications', desc: 'Email and system notifications', icon: Bell },
            { id: 'privacy', label: 'Data & Privacy', desc: 'Data retention and privacy settings', icon: Lock },
            { id: 'integrations', label: 'Integrations', desc: 'Manage connected services', icon: Link2 },
            { id: 'advanced', label: 'Advanced', desc: 'Advanced configuration options', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400 mt-0.5' : 'text-slate-400 mt-0.5'} />
                <div className="truncate">
                  <span className="text-xs block font-bold leading-tight">{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal block truncate mt-0.5">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="lg:col-span-9 space-y-5">
          {/* SECTION 1: GENERAL SETTINGS */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 shadow-none">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              General Settings
            </h3>

            {/* Organization Profile */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Organization Profile</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Logo Upload Box */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-xs">
                    A
                  </div>
                  <div>
                    <button
                      onClick={() => onTriggerToast && onTriggerToast('Upload Logo Triggered')}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                    >
                      Upload New Logo
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or SVG. Max 2MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Switches */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Preferences</h4>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Allow members to invite new users</span>
                  <span className="text-[10.5px] text-slate-400 block">Enable team members to send invites to the organization</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowInvite}
                  onChange={(e) => setAllowInvite(e.target.checked)}
                  className="size-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Require 2FA for all members</span>
                  <span className="text-[10.5px] text-slate-400 block">Enforce two-factor authentication for enhanced security</span>
                </div>
                <input
                  type="checkbox"
                  checked={require2FA}
                  onChange={(e) => setRequire2FA(e.target.checked)}
                  className="size-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Default Project Visibility</span>
                  <span className="text-[10.5px] text-slate-400 block">Choose the default visibility for new projects</span>
                </div>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="py-1 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option>Private</option>
                  <option>Public</option>
                  <option>Team Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: REGIONAL & SECURITY & RECENT ACTIVITY GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Regional Settings */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                Regional Settings
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Timezone</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                    <option>(GMT+7) Asia/Jakarta</option>
                    <option>(GMT+0) UTC</option>
                    <option>(GMT-5) America/New_York</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Language</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                    <option>English (US)</option>
                    <option>Indonesian (ID)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Date Format</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                    <option>May 27, 2025</option>
                    <option>27/05/2025</option>
                    <option>2025-05-27</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Time Format</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                    <option>24-hour (14:30)</option>
                    <option>12-hour (2:30 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Status Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Security Status
                </h3>

                <div className="text-center py-3 space-y-1">
                  <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500">
                    <ShieldCheck size={26} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Secure</h4>
                  <p className="text-[11px] text-slate-400">Your organization settings are configured securely.</p>
                </div>

                <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>SSO Enabled</span>
                    </span>
                    <span className="text-[10.5px] font-mono text-slate-400">Google Workspace</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <AlertTriangle size={13} className="text-amber-500" />
                      <span>2FA Enforcement</span>
                    </span>
                    <span className="text-[10.5px] font-mono text-amber-500 font-bold">Recommended</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Strong Password Policy</span>
                    </span>
                    <span className="text-[10.5px] font-mono text-emerald-500 font-bold">Enabled</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Session Timeout</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">30 minutes</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">IP Allowlist</span>
                    <span className="font-mono text-slate-400">Not Configured</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer">
                View Security Settings
              </button>
            </div>
          </div>

          {/* SECTION 3: RECENT ACTIVITY CARD */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Activity</h3>
                <p className="text-xs text-slate-400 mt-0.5">Audit log of recent organization changes.</p>
              </div>
              <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All Activity
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { action: 'Organization settings updated', by: 'Danz Assyidq', time: '2 minutes ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
                { action: 'New member invited', by: 'Alsa Dwi Nur H.', time: '15 minutes ago', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces' },
                { action: 'API key generated', by: 'Faris Ramadhan', time: '1 hour ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
                { action: 'Billing information updated', by: 'Danz Assyidq', time: '3 hours ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
                { action: 'SSO configuration changed', by: 'Danz Assyidq', time: '5 hours ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
              ].map((act, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2.5">
                    <img src={act.avatar} alt={act.by} className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{act.action}</span>
                      <span className="text-[10.5px] text-slate-400 block">by {act.by}</span>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-mono text-slate-400">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
