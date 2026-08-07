import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, Bell, ChevronLeft, ChevronRight, ChevronDown, 
  ShieldAlert, Activity, CheckCircle2, Zap, Rocket, Sun, Moon, 
  Settings, CreditCard, LogOut, Search, X, Check
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';
import { LanguageSelector } from '../../../components/LanguageSelector';
import { SupabaseDashboardService } from '../../services/supabaseService';

export interface EnterpriseHeaderWidgetsProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  dark?: boolean;
  setDark?: (val: boolean) => void;
  triggerToast: (msg: string) => void;
  timeRange: string;
  setTimeRange: (val: string) => void;
}

export function EnterpriseHeaderWidgets({
  userName = 'Enterprise Admin',
  userEmail = 'admin@zegaai.site',
  userAvatar = '/assets/avatars/enterprise_admin.png',
  dark = false,
  setDark,
  triggerToast,
  timeRange,
  setTimeRange
}: EnterpriseHeaderWidgetsProps) {
  // Calendar States
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarCurrentMonth, setCalendarCurrentMonth] = useState(new Date());
  const [selectedDateRange, setSelectedDateRange] = useState('Today (Aug 5, 2026)');
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString('en-US'));

  // Notifications States
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'OWASP Security Gate Triggered', message: 'Rate-limiting token bucket blocked suspicious probe from IP 192.168.1.104', is_read: false, action_url: 'securityEvents', created_at: '10m ago' },
    { id: '2', title: 'ZeroClaw Swarm Failover', message: 'Frankfurt Node auto-healed latency spike in 22ms', is_read: false, action_url: 'pipeline', created_at: '45m ago' },
    { id: '3', title: 'Monthly Billing Invoice Ready', message: 'Invoice #INV-2026-08 generated: $128,430.50', is_read: true, action_url: 'costReport', created_at: '2h ago' },
  ]);

  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Profile Dropdown State
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Ticking Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    triggerToast('All notifications marked as read');
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
      {/* 1. UPGRADE ENTERPRISE SCALE BUTTON (Desktop visible, Mobile inside Profile) */}
      <button
        onClick={() => setUpgradeModalOpen(true)}
        className="hidden sm:flex group items-center gap-1 cursor-pointer active:scale-95 transition-all shrink-0 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs border border-indigo-400/40"
        title="Upgrade Enterprise Scale Plan"
      >
        <img 
          src={getR2CdnUrl('/assets/logo/rockets_upgrade.png')} 
          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/logo/rockets_upgrade.png'; }}
          alt="Upgrade Rocket" 
          className="h-5 w-auto object-contain shrink-0 group-hover:scale-110 transition-transform duration-300 drop-shadow-xs" 
        />
        <span>Upgrade Scale</span>
      </button>

      {/* 2. REALTIME CALENDAR BUTTON (Visible on Mobile & Desktop) */}
      <div className="relative shrink-0">
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors relative flex items-center justify-center"
          title="Enterprise Realtime Calendar & Schedule"
        >
          <Calendar size={16} />
          <span className="absolute top-1 right-1 size-2 rounded-full bg-indigo-500 animate-ping" />
        </button>

        {calendarOpen && (
          <>
            <div className="fixed inset-0 z-[60] bg-slate-950/20 backdrop-blur-xs sm:bg-transparent" onClick={() => setCalendarOpen(false)} />
            <div className="fixed top-16 right-3 sm:absolute sm:top-full sm:right-0 sm:mt-3.5 w-80 sm:w-88 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[70] p-3.5 space-y-3 animate-slideUp origin-top-right max-w-[calc(100vw-1.5rem)]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-500" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {calendarCurrentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <p className="text-[10px] text-indigo-500 font-semibold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span>{liveTime} • Live Telemetry</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const prev = new Date(calendarCurrentMonth);
                      prev.setMonth(prev.getMonth() - 1);
                      setCalendarCurrentMonth(prev);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const next = new Date(calendarCurrentMonth);
                      next.setMonth(next.getMonth() + 1);
                      setCalendarCurrentMonth(next);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Date Filter Pills */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                {['Today', 'Last 7 Days', 'This Month'].map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDateRange(label);
                      triggerToast(`Calendar filter set: ${label}`);
                      setCalendarOpen(false);
                    }}
                    className="py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-indigo-400 text-center cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Mini Calendar Grid */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <span
                      key={d}
                      onClick={() => {
                        setSelectedDateRange(`Aug ${d}, 2026`);
                        triggerToast(`Date filter: Aug ${d}, 2026`);
                        setCalendarOpen(false);
                      }}
                      className={`p-1 rounded-lg cursor-pointer transition-colors ${
                        d === 5 ? 'bg-indigo-600 text-white font-extrabold shadow-sm' : 'hover:bg-indigo-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Automated AI Schedule */}
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px] flex justify-between">
                  <span>Automated AI Schedule</span>
                  <span className="text-[9px] text-indigo-500 font-semibold">3 Active Tasks</span>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">ZeroClaw Backup Sync</span>
                  <span className="font-mono text-indigo-600 font-bold">03:00 UTC</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 flex justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">OWASP Threat Audit Scan</span>
                  <span className="font-mono text-emerald-600 font-bold">14:00 UTC</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. NOTIFICATIONS CENTER */}
      <div className="relative shrink-0">
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {notificationsOpen && (
          <>
            <div className="fixed inset-0 z-[60] bg-slate-950/20 backdrop-blur-xs sm:bg-transparent" onClick={() => setNotificationsOpen(false)} />
            <div className="fixed top-16 right-3 sm:absolute sm:top-full sm:right-0 sm:mt-3.5 w-80 sm:w-96 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[70] p-3.5 space-y-3 animate-slideUp origin-top-right max-w-[calc(100vw-1.5rem)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-indigo-500" />
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Enterprise Security & System Alerts</h4>
                </div>
                <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">
                  Mark all read
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      triggerToast(`Opening notification: ${notif.title}`);
                      setNotificationsOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      notif.is_read
                        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75'
                        : 'bg-indigo-50/50 dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-900/50'
                    }`}
                  >
                    <div className="size-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity size={14} />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 truncate">{notif.title}</h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. PROFILE CONTROL CENTER */}
      <div className="relative shrink-0">
        <div
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-3 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <img
            src={getR2CdnUrl(userAvatar || '/assets/avatars/enterprise_admin.png')}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'; }}
            alt="Profile Avatar"
            className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div className="text-left hidden md:block">
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">{userName}</p>
            <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold mt-0.5">Enterprise Admin</p>
          </div>
          <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
        </div>

        {profileDropdownOpen && (
          <>
            <div className="fixed inset-0 z-[60] bg-slate-950/20 backdrop-blur-xs sm:bg-transparent" onClick={() => setProfileDropdownOpen(false)} />
            <div className="fixed top-16 right-3 sm:absolute sm:top-full sm:right-0 sm:mt-3.5 w-72 sm:w-68 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[70] p-3 space-y-2.5 text-xs font-bold animate-slideUp origin-top-right max-w-[calc(100vw-1.5rem)]">
              {/* User Profile Card */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2.5">
                <img
                  src={getR2CdnUrl(userAvatar || '/assets/avatars/enterprise_admin.png')}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'; }}
                  alt="Profile Avatar"
                  className="size-9 rounded-full object-cover border-2 border-indigo-500 shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{userName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">{userEmail}</p>
                </div>
              </div>

              {/* Upgrade Quick Action */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setUpgradeModalOpen(true);
                }}
                className="w-full p-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white font-black flex items-center justify-between text-xs cursor-pointer shadow-xs active:scale-98 transition-all hover:brightness-110"
              >
                <span className="flex items-center gap-2">
                  <Rocket size={14} />
                  <span className="font-extrabold text-xs">Upgrade Plan</span>
                </span>
                <ChevronRight size={14} />
              </button>

              {/* Preferences Grid (Theme & Language) */}
              <div className="p-1 bg-slate-100/90 dark:bg-slate-950/90 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5">
                {setDark && (
                  <button
                    onClick={() => setDark(!dark)}
                    className="h-8 flex-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs font-extrabold text-[10.5px]"
                  >
                    {dark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-indigo-400" />}
                    <span>{dark ? 'Light' : 'Dark'}</span>
                  </button>
                )}
                <div className="h-8 flex-1 flex items-center justify-center">
                  <LanguageSelector compact={true} className="!h-8 !w-full !justify-center !rounded-lg !font-black !text-[10.5px]" />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-0.5" />

              {/* Sign Out Button */}
              <button
                onClick={async () => {
                  await SupabaseDashboardService.signOut();
                }}
                className="w-full px-2.5 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer flex items-center justify-between font-black text-xs transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
              >
                <span className="flex items-center gap-2">
                  <LogOut size={14} className="text-rose-500" />
                  <span>Sign Out</span>
                </span>
                <ChevronRight size={13} className="opacity-50" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* UPGRADE ENTERPRISE PLAN MODAL (Teleported to document.body via Portal to prevent sticky header clipping) */}
      {upgradeModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-auto animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
                  <Rocket size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Enterprise Scale Allocation</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Tier 3 Custom Capacity & Infrastructure</p>
                </div>
              </div>
              <button 
                onClick={() => setUpgradeModalOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Current Active Plan</span>
                  <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">Enterprise Scale Tier 3</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow-xs">Active</span>
              </div>

              <div className="space-y-2.5 text-xs font-bold">
                <div className="flex justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Dedicated Microservice Nodes</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">8 High-Avail Nodes</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Monthly AI Credit Limit</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">10,000,000 Credits</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-400">Dedicated MCP Connectors</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Unlimited</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button 
                onClick={() => setUpgradeModalOpen(false)} 
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerToast('Enterprise Scale Allocation upgrade request sent to account manager');
                  setUpgradeModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:brightness-110 text-white text-xs font-black shadow-md cursor-pointer active:scale-98 transition-all"
              >
                Request Scale Upgrade
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
