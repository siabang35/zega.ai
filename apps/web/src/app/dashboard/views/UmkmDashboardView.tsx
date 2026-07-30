import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, FileText, Sparkles, BarChart3, Plus, CheckCircle2,
  ShoppingBag, Users, DollarSign, ChevronRight, Copy, Link2, Clock,
  Bot, Megaphone, Store, UserPlus, TrendingUp, Heart, ArrowUpRight,
  Rocket, CheckCircle, ChevronDown, MoreHorizontal, Filter, Search,
  PhoneCall, Paperclip, Send, ShieldCheck, HelpCircle, Check, Play, Zap,
  TrendingDown, PieChart, Tag, Eye, Download, Package, AlertTriangle,
  UserCheck, RefreshCw, BookOpen, ExternalLink, FileCode, Layers,
  CreditCard, Settings, ShoppingCart, Activity, ShieldAlert
} from 'lucide-react';
import { MarketplaceView } from '../umkm/views/MarketplaceView';
import { BillingView } from '../umkm/views/BillingView';
import { SettingsView } from '../umkm/views/SettingsView';

interface UmkmDashboardViewProps {
  activeTab?: string;
  userName?: string;
  isGuest?: boolean;
}

export function UmkmDashboardView({ activeTab: externalTab, userName, isGuest }: UmkmDashboardViewProps) {
  const [internalTab, setInternalTab] = useState('overview');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [inboxChannel, setInboxChannel] = useState('All');
  const [activeChatId, setActiveChatId] = useState('1021');
  const [chatMessage, setChatMessage] = useState('');
  const [empFilter, setEmpFilter] = useState('All Employees');
  const [autoFilter, setAutoFilter] = useState('All');

  // Dynamic user display name: "Guest" for guest mode, or actual name if authenticated
  const displayName = useMemo(() => {
    if (isGuest || !userName || userName.toLowerCase().includes('guest')) {
      return 'Guest';
    }
    return userName.split(' ')[0];
  }, [userName, isGuest]);

  const activeTab = useMemo(() => {
    if (externalTab === 'umkm' || externalTab === 'home' || externalTab === 'overview' || !externalTab) return 'overview';
    if (externalTab === 'my_agents' || externalTab === 'my_ai_employees') return 'my_agents';
    if (externalTab === 'wa_bot' || externalTab === 'inbox') return 'inbox';
    if (externalTab === 'sales_rekap' || externalTab === 'sales') return 'sales';
    if (externalTab === 'invoice_gen' || externalTab === 'finance') return 'finance';
    if (externalTab === 'ai_copywriter' || externalTab === 'marketing') return 'marketing';
    if (externalTab === 'store') return 'store';
    if (externalTab === 'customers') return 'customers';
    if (externalTab === 'reports') return 'reports';
    if (externalTab === 'knowledge') return 'knowledge';
    if (externalTab === 'automation' || externalTab === 'sandbox') return 'automation';
    if (externalTab === 'marketplace' || externalTab === 'integrations') return 'marketplace';
    if (externalTab === 'billing') return 'billing';
    if (externalTab === 'settings') return 'settings';
    return internalTab;
  }, [externalTab, internalTab]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-5 pb-16 font-sans text-slate-900 dark:text-slate-100">
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} className="text-orange-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. HOME / OVERVIEW VIEW */}
      {/* ========================================================= */}
      {(activeTab === 'overview' || activeTab === 'umkm' || activeTab === 'home' || !activeTab) && (
        <div className="space-y-5">
          {/* Top Banner Row */}
          <div className="grid lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      Good Morning, {displayName} <span className="text-2xl">👋</span>
                    </h1>

                    {/* Interactive 3D Video Mascot Display (Enlarged size-28 / sm:size-32) */}
                    <div className="relative flex-shrink-0 flex items-center justify-center cursor-pointer group/robot">
                      <div 
                        onClick={() => triggerToast('ZEGA Copilot AI Active!')}
                        className="relative size-28 sm:size-32 rounded-3xl bg-slate-950 border-2 border-orange-400/50 p-1 shadow-2xl overflow-hidden group-hover/robot:scale-105 group-hover/robot:border-orange-500 transition-all duration-300 flex items-center justify-center"
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-transparent to-black/50 pointer-events-none z-20" />
                        <video 
                          src="/assets/3D/robotic.mp4" 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="w-full h-full object-cover rounded-2xl relative z-10 filter drop-shadow-lg cursor-pointer"
                        />
                        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700/80 backdrop-blur-xs">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[9px] font-extrabold text-slate-200 uppercase">3D AI</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Your AI Team has completed <span className="text-orange-600 dark:text-orange-400 font-bold">126</span> tasks today.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Estimated time saved</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">11 Hours</span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">+22% vs yesterday</span>
                    </div>
                  </div>
                  <div className="size-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0"><Clock size={20} /></div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Revenue generated</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Rp4.850.000</span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">+18% vs yesterday</span>
                    </div>
                  </div>
                  <div className="size-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center flex-shrink-0"><DollarSign size={20} /></div>
                </div>
              </div>
            </div>

            {/* Right Upgrade PRO Banner Card */}
            <div className="lg:col-span-4 bg-gradient-to-br from-orange-50/90 via-amber-50/60 to-orange-100/40 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200/80 dark:border-orange-800/50 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden shadow-xs">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">You're saving</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">11 Hours/week</h3>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500" /> Upgrade to PRO</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500" /> Unlimited AI Employees</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500" /> Unlimited Automation</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-orange-500" /> Priority AI</li>
                </ul>
              </div>
              <div className="absolute right-3 top-3 opacity-80 pointer-events-none"><Rocket size={52} className="text-orange-400 transform rotate-12" /></div>
              <button onClick={() => triggerToast('Upgrade initiated!')} className="mt-4 w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2">
                <Rocket size={16} /> Upgrade Now
              </button>
            </div>
          </div>

          {/* 6 Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { title: "Today's Revenue", val: "Rp5.200.000", change: "+18% vs yesterday", icon: TrendingUp, iconBg: "bg-emerald-50 text-emerald-600" },
              { title: "Orders", val: "43", change: "+12% vs yesterday", icon: ShoppingBag, iconBg: "bg-orange-50 text-orange-600" },
              { title: "New Customers", val: "12", change: "+9% vs yesterday", icon: UserPlus, iconBg: "bg-purple-50 text-purple-600" },
              { title: "WhatsApp Response Rate", val: "98%", change: "+3% vs yesterday", icon: MessageSquare, iconBg: "bg-emerald-50 text-emerald-600" },
              { title: "Hours Saved", val: "9.2 Hours", change: "+15% vs yesterday", icon: Clock, iconBg: "bg-blue-50 text-blue-600" },
              { title: "Estimated AI Salary Saved", val: "Rp2.100.000", change: "+18% vs yesterday", icon: Sparkles, iconBg: "bg-amber-50 text-amber-600" },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 line-clamp-1">{m.title}</span>
                    <div className={`size-8 rounded-xl ${m.iconBg} flex items-center justify-center flex-shrink-0`}><Icon size={16} /></div>
                  </div>
                  <div className="mt-3">
                    <div className="text-lg font-black text-slate-900 dark:text-slate-100">{m.val}</div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{m.change}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Middle Row: Your AI Employees (7 Active) & Daily Timeline */}
          <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Your AI Employees</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">7 Active</span>
                </div>
                <button onClick={() => setInternalTab('my_agents')} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Manage All Employees &gt;</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { name: 'Customer Service AI', status: 'Working', icon: Bot, bg: 'bg-emerald-100 text-emerald-600', m1: "Today's Chats", v1: '125', m2: 'Solved', v2: '118' },
                  { name: 'Marketing AI', status: 'Working', icon: Megaphone, bg: 'bg-pink-100 text-pink-600', m1: 'Posts', v1: '12', m2: 'Leads', v2: '18' },
                  { name: 'Finance AI', status: 'Working', icon: FileText, bg: 'bg-blue-100 text-blue-600', m1: 'Invoices', v1: '43', m2: 'Overdue', v3: '0' },
                  { name: 'Store AI', status: 'Working', icon: Store, bg: 'bg-orange-100 text-orange-600', m1: 'Products', v1: '25', m2: 'Alerts', v2: '2' },
                  { name: 'Sales AI', status: 'Working', icon: Users, bg: 'bg-purple-100 text-purple-600', m1: 'Leads', v1: '18', m2: 'Deals', v2: '7' },
                ].map((emp, i) => {
                  const Icon = emp.icon;
                  return (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`size-8 rounded-xl ${emp.bg} flex items-center justify-center flex-shrink-0`}><Icon size={16} /></div>
                        <div className="truncate">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{emp.name}</h4>
                          <span className="text-[9px] font-bold text-emerald-600">• {emp.status}</span>
                        </div>
                      </div>
                      <div className="text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-400"><span>{emp.m1}</span><span className="font-bold text-slate-800 dark:text-slate-200">{emp.v1}</span></div>
                        <div className="flex justify-between text-slate-400"><span>{emp.m2}</span><span className="font-bold text-slate-800 dark:text-slate-200">{emp.v2 || '0'}</span></div>
                      </div>
                      <button onClick={() => triggerToast(`Opening ${emp.name}`)} className="w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer">Open</button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Timeline */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Daily Timeline</h3>
                <span className="text-xs font-bold text-slate-400">View All</span>
              </div>
              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { time: '08.00', icon: '🟢', text: 'Customer asked price' },
                  { time: '08.01', icon: '🤖', text: 'AI replied' },
                  { time: '08.02', icon: '🛒', text: 'Customer purchased' },
                  { time: '08.03', icon: '📄', text: 'Invoice generated' },
                  { time: '08.04', icon: '✅', text: 'Payment confirmed' },
                  { time: '08.05', icon: '💖', text: 'WhatsApp thank you sent' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-slate-400 text-[10px] font-bold w-9">{item.time}</span>
                    <span className="text-xs">{item.icon}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-sans font-medium text-[11px] truncate">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom 4 Widgets */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Widget 1: Revenue Center */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Revenue Center</h3>
                <span className="text-[10px] font-bold text-slate-400">This Month ∨</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Revenue', val: 'Rp13.500.000', color: 'stroke-emerald-500' },
                  { label: 'AI Generated Revenue', val: 'Rp5.200.000', color: 'stroke-emerald-500' },
                  { label: 'Recovery Revenue', val: 'Rp1.300.000', color: 'stroke-emerald-500' },
                  { label: 'Abandoned Cart Recovery', val: '34%', color: 'stroke-orange-500' },
                  { label: 'Upsell Success', val: '18%', color: 'stroke-blue-500' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{r.label}</span>
                      <span className="font-black text-slate-900 dark:text-slate-100">{r.val}</span>
                    </div>
                    <svg className="w-12 h-5" viewBox="0 0 50 20">
                      <path d="M 0 15 Q 12 5, 25 10 T 50 2" fill="none" className={r.color} strokeWidth="2" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Automation Running */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Automation Running</h3>
                <button onClick={() => setInternalTab('automation')} className="text-[10px] font-bold text-orange-500">Create New</button>
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  { title: 'New order received', sub: 'Trigger: Online Store' },
                  { title: 'Generate invoice', sub: 'Action: Invoice AI' },
                  { title: 'Send WhatsApp message', sub: 'Action: WhatsApp AI' },
                  { title: 'Save to Spreadsheet', sub: 'Action: Google Sheets' },
                  { title: 'Update stock', sub: 'Action: Store AI' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div>
                      <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100">{step.title}</h4>
                      <span className="text-[9px] text-slate-400">{step.sub}</span>
                    </div>
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Recent Conversations */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Recent Conversations</h3>
                <button onClick={() => setInternalTab('inbox')} className="text-[10px] font-bold text-slate-400">View Inbox</button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Siti Aisyah', tag: 'Replied', msg: 'Mau tanya ongkir ke...' },
                  { name: 'Budi Santoso', tag: 'Solved', msg: 'Terima kasih, sudah...' },
                  { name: 'Dewi Lestari', tag: 'Replied', msg: 'Kapan ready stock...' },
                  { name: 'Rizky Pratama', tag: 'Waiting', msg: 'Apakah bisa COD?' },
                  { name: 'Maya Putri', tag: 'Replied', msg: 'Size M masih ada?' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[11px]">{c.name}</span>
                        <span className="text-[9px] text-emerald-600 font-bold">• {c.tag}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{c.msg}</p>
                    </div>
                    <div className="flex gap-1 text-slate-400 flex-shrink-0 ml-1">
                      <MessageSquare size={12} />
                      <ExternalLink size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 4: Today's Recommendation & Marketplace */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Sparkles size={14} className="text-amber-300" /> Today's Recommendation
                </div>
                <p className="text-[11px] leading-relaxed text-purple-100">
                  AI menemukan <span className="font-bold text-white">17 pelanggan</span> belum melakukan repeat order. Klik untuk kirim promo otomatis.
                </p>
                <button onClick={() => triggerToast('Automated Promo Campaign Started!')} className="w-full py-2 rounded-xl bg-white text-purple-700 font-bold text-xs shadow-xs hover:bg-purple-50 cursor-pointer">
                  Run Campaign &gt;
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Marketplace</h3>
                  <span className="text-[10px] font-bold text-slate-400">View All</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-medium">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><MessageSquare size={16} className="text-emerald-500 mx-auto mb-1" /> WhatsApp</div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><ShoppingBag size={16} className="text-orange-500 mx-auto mb-1" /> Shopee</div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><Heart size={16} className="text-pink-500 mx-auto mb-1" /> Instagram</div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><CreditCard size={16} className="text-purple-500 mx-auto mb-1" /> QRIS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGES RENDERING */}
      {activeTab === 'my_agents' && renderMyAgentsView({ setEmpFilter, empFilter, triggerToast })}
      {activeTab === 'automation' && renderAutomationView({ setAutoFilter, autoFilter, triggerToast })}
      {activeTab === 'inbox' && renderInboxView({ inboxChannel, setInboxChannel, activeChatId, setActiveChatId, chatMessage, setChatMessage, triggerToast })}
      {activeTab === 'sales' && renderSalesView()}
      {activeTab === 'finance' && renderFinanceView()}
      {activeTab === 'marketplace' && <MarketplaceView triggerToast={triggerToast} />}
      {activeTab === 'billing' && <BillingView triggerToast={triggerToast} />}
      {activeTab === 'settings' && <SettingsView triggerToast={triggerToast} />}

      {/* FLOATING ZEGA COPILOT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => triggerToast('Opening ZEGA Copilot Assistant...')} className="px-4 py-2.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs shadow-2xl flex items-center gap-2 hover:scale-105 transition-all cursor-pointer border border-slate-700 dark:border-slate-200">
          <Sparkles size={16} className="text-orange-400" />
          <span>ZEGA Copilot</span>
          <ChevronRight size={14} />
          <span className="size-5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center ml-0.5">2</span>
        </button>
      </div>
    </div>
  );
}

// Sub-view helper functions
function renderMyAgentsView({ setEmpFilter, empFilter, triggerToast }: any) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black">My AI Employees</h1><p className="text-xs text-slate-400">Kelola tim AI Anda yang bekerja 24/7 untuk bisnis.</p></div>
        <button onClick={() => triggerToast('Add new AI Employee')} className="px-4 py-2.5 rounded-2xl bg-orange-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"><Plus size={16} /> Add New AI Employee</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Total AI Employees</span><p className="text-2xl font-black mt-1">6</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Tasks Completed Today</span><p className="text-2xl font-black mt-1">126</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Hours Saved Today</span><p className="text-2xl font-black mt-1">11.0</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Success Rate</span><p className="text-2xl font-black mt-1">98%</p></div></div>
      </div>
      <div className="space-y-3">
        {[
          { name: 'Customer Service AI', desc: 'Menangani chat WhatsApp, FAQ, dan keluhan pelanggan', status: 'Working', v1: '125', v2: '118', v3: '4.9 / 5', active: '07.30' },
          { name: 'Marketing AI', desc: 'Buat konten, sosmed, dan kampanye', status: 'Working', v1: '12', v2: '1.2K', v3: '18', active: '07.00' },
          { name: 'Finance AI', desc: 'Kelola invoice, pembayaran, dan laporan keuangan', status: 'Working', v1: '43', v2: '15', v3: '0', active: '08.00' },
          { name: 'Store AI', desc: 'Kelola produk, stok, dan pesanan', status: 'Working', v1: '25', v2: '2', v3: '17', active: '06.45' },
          { name: 'Sales AI', desc: 'Bantu closing deal dan follow up leads', status: 'Working', v1: '28', v2: '7', v3: 'Rp2.1M', active: '09.10' },
        ].map((emp, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><h3 className="font-bold text-sm">{emp.name}</h3><p className="text-xs text-slate-400">{emp.desc}</p></div>
            <button onClick={() => triggerToast(`Manage ${emp.name}`)} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer">Manage</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderAutomationView({ setAutoFilter, autoFilter, triggerToast }: any) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black">Automation</h1><p className="text-xs text-slate-400">Bangun workflow otomatisasi tanpa kode.</p></div>
        <button onClick={() => triggerToast('Create new automation')} className="px-4 py-2.5 rounded-2xl bg-orange-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"><Plus size={16} /> Create Automation</button>
      </div>
      <div className="space-y-4">
        {[
          { title: 'New Order -> Invoice -> WA -> Save -> Update Stock', sub: 'E-commerce Order Flow', status: 'Running', runs: '24', rate: '100%', last: '2 min ago' },
          { title: 'Customer Chat -> AI Reply -> Tag -> Follow Up', sub: 'WhatsApp Auto Reply', status: 'Running', runs: '125', rate: '98%', last: '1 min ago' },
          { title: 'Payment Reminder -> WA -> Email -> Update Status', sub: 'Payment Reminder Flow', status: 'Running', runs: '15', rate: '100%', last: '5 min ago' },
        ].map((wf, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div><h3 className="font-bold text-sm">{wf.title}</h3><p className="text-xs text-slate-400">{wf.sub}</p></div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{wf.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderInboxView({ inboxChannel, setInboxChannel, activeChatId, setActiveChatId, chatMessage, setChatMessage, triggerToast }: any) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Inbox</h1>
      <div className="grid lg:grid-cols-12 gap-4 h-[550px]">
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-xs mb-3">Conversations</h3>
          <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200">
            <h4 className="font-bold text-xs">Siti Aisyah</h4>
            <p className="text-[11px] text-slate-400">Halo, saya mau tanya harga...</p>
          </div>
        </div>
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="border-b pb-3"><h3 className="font-bold text-sm">Siti Aisyah</h3></div>
          <div className="p-3 rounded-2xl bg-orange-500 text-white max-w-[80%]">Halo Kak Siti! 👋 Ada yang bisa kami bantu?</div>
          <div className="flex gap-2 pt-2 border-t"><input type="text" placeholder="Type a message..." className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl" /><button onClick={() => triggerToast('Message sent')} className="p-2 bg-orange-500 text-white rounded-xl"><Send size={16} /></button></div>
        </div>
      </div>
    </div>
  );
}

function renderSalesView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Sales Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Total Revenue</span><p className="text-2xl font-black mt-1">Rp13.500.000</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Orders</span><p className="text-2xl font-black mt-1">116</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Average Order Value</span><p className="text-2xl font-black mt-1">Rp116.379</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Conversion Rate</span><p className="text-2xl font-black mt-1">4.2%</p></div></div>
      </div>
    </div>
  );
}

function renderFinanceView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Finance Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Total Revenue</span><p className="text-2xl font-black mt-1">Rp13.500.000</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Total Expense</span><p className="text-2xl font-black mt-1">Rp6.250.000</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Net Profit</span><p className="text-2xl font-black mt-1">Rp7.250.000</p></div></div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><div><span className="text-xs text-slate-400">Profit Margin</span><p className="text-2xl font-black mt-1">53.7%</p></div></div>
      </div>
    </div>
  );
}
