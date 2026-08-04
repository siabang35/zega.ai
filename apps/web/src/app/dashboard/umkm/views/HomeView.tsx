import React, { useState, useEffect } from 'react';
import { 
  Clock, DollarSign, Rocket, CheckCircle, TrendingUp, ShoppingBag, 
  UserPlus, MessageSquare, Sparkles, Bot, Megaphone, FileText, Store, 
  Users, ArrowRight, Plus, BarChart2, ShieldCheck, Zap, Instagram, X, Activity, Wifi, ChevronRight, RefreshCw, Send, Save
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line 
} from 'recharts';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';

interface HomeViewProps {
  displayName: string;
  onNavigateTab: (tab: string) => void;
  triggerToast: (msg: string) => void;
}

// Data Sales 7 Hari & 30 Hari Terakhir for Recharts
const sales7Days = [
  { date: '27 May', revenue: 2400000, orders: 18 },
  { date: '28 May', revenue: 3100000, orders: 24 },
  { date: '29 May', revenue: 2800000, orders: 21 },
  { date: '30 May', revenue: 3900000, orders: 32 },
  { date: '31 May', revenue: 5200000, orders: 43 },
  { date: '1 Jun',  revenue: 4100000, orders: 35 },
  { date: '2 Jun',  revenue: 4850000, orders: 40 },
];

const sales30Days = [
  { date: 'Week 1', revenue: 14200000, orders: 110 },
  { date: 'Week 2', revenue: 18900000, orders: 145 },
  { date: 'Week 3', revenue: 22400000, orders: 178 },
  { date: 'Week 4', revenue: 26850000, orders: 215 },
];

// Sparkline Mini Data
const sparkRevenue = [{ v: 2.1 }, { v: 2.8 }, { v: 3.5 }, { v: 4.2 }, { v: 5.2 }];
const sparkOrders  = [{ v: 20 },  { v: 28 },  { v: 31 },  { v: 38 },  { v: 43 }];
const sparkUsers   = [{ v: 4 },   { v: 6 },   { v: 9 },   { v: 10 },  { v: 12 }];
const sparkWa      = [{ v: 92 },  { v: 94 },  { v: 95 },  { v: 97 },  { v: 98 }];
const sparkHours   = [{ v: 4.0 }, { v: 5.5 }, { v: 6.8 }, { v: 8.0 }, { v: 9.2 }];

// Custom Tooltip for Recharts Sales Summary
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
        <p className="font-extrabold text-slate-300">{label}</p>
        <p className="font-black text-orange-400">
          Rp{payload[0].value.toLocaleString('id-ID')}
        </p>
        {payload[1] && (
          <p className="text-[10px] text-slate-400 font-semibold">
            {payload[1].value} Orders
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function HomeView({ displayName, onNavigateTab, triggerToast }: HomeViewProps) {
  const { t } = useLanguage();
  const u = t.umkmHome || {
    greeting: 'Good morning',
    greetingSub: 'AI is ready to help grow your business today.',
    hoursSaved: 'Time Saved',
    hoursSavedSub: '+22% from yesterday',
    revenue: 'Revenue',
    revenueSub: '+18% from yesterday',
    tasksCompleted: 'Tasks Completed',
    tasksCompletedSub: '+28% from yesterday',
    realtimeStatus: 'Realtime System Status',
    connected: 'Connected',
    aiAgentsActive: 'Active AI Employees',
    realtimeAutomation: 'Realtime Automation',
    activeWorkflows: 'Active Workflows',
    supabaseSync: 'Supabase Sync',
    plan: 'Plan',
    managePlan: 'Manage Plan',
    newOrders: 'New Orders',
    newCustomers: 'New Customers',
    waResponseRate: 'WA Response Rate',
    myAiEmployees: 'Your AI Employees',
    active: 'Active',
    manageAll: 'Manage All',
    open: 'Open',
    addAi: 'Add AI',
    addAiSub: 'Create new AI Employee',
    salesSummary: 'Sales Summary',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    runningAutomation: 'Active Automation',
    aiTasksToday: 'AI Tasks Today',
    seeAll: 'See All',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    createInvoice: 'Create Invoice',
    sendBroadcast: 'Send Broadcast',
    addProduct: 'Add Product',
    salesReport: 'Sales Report',
    chatWithAi: 'Chat with AI Assistant',
    instagramDmBot: 'Instagram DM Bot',
    connectedBadge: 'Connected',
    instagramDesc: 'AI Instagram bot automatically responds to DMs & comments using database context.',
    manageInstagram: 'Manage Instagram Policy'
  };

  const [isGreetingVisible, setIsGreetingVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [salesTimeframe, setSalesTimeframe] = useState<'7d' | '30d'>('7d');

  // Quick Action Modal State
  const [activeModal, setActiveModal] = useState<'invoice' | 'broadcast' | 'product' | null>(null);
  const [modalForm, setModalForm] = useState({ title: '', detail: '', amount: '' });

  // AI Employee Modals State
  const [selectedAgentModal, setSelectedAgentModal] = useState<any | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({ name: '', role: 'Support & Ops Specialist', description: '' });

  // Real-time Database State
  const [kpiData, setKpiData] = useState<any>({
    tasks_completed_today: 126,
    hours_saved_weekly: 11.0,
    revenue_generated_today: 4850000,
    today_revenue_trend: 18.0,
    orders_today_count: 43,
    new_customers_today_count: 12,
    whatsapp_response_rate: 98.0,
    estimated_ai_salary_saved: 2100000,
    usage_percentage: 38.0
  });

  const [aiEmployees, setAiEmployees] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([
    { name: 'Auto send invoice', sub: 'Everyday • 09:00', status: 'active' },
    { name: 'Customer follow-up', sub: 'Everyday • 11:00', status: 'active' },
    { name: 'Payment confirmation', sub: 'Everyday • 13:00', status: 'active' },
    { name: 'Daily report summary', sub: 'Everyday • 18:00', status: 'active' },
  ]);
  const [recentActivities, setRecentActivities] = useState<any[]>([
    { title: 'Invoice INV-2026-006 received', sub: '2m ago', amount: 'Rp1.250.000', icon: FileText, iconBg: 'bg-emerald-50 text-emerald-600' },
    { title: 'New order from Andi Saputra', sub: '10m ago', amount: 'Rp350.000', icon: ShoppingBag, iconBg: 'bg-orange-50 text-orange-600' },
    { title: 'Payment successfully processed', sub: '30m ago', amount: 'Rp780.000', icon: ShieldCheck, iconBg: 'bg-blue-50 text-blue-600' },
    { title: 'New chat from Siti Aisyah', sub: '45m ago', amount: 'Hello, I want to...', icon: MessageSquare, iconBg: 'bg-purple-50 text-purple-600' },
  ]);

  // Load Real-time Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await SupabaseDashboardService.getUmkmRealtimeData('11111111-1111-1111-1111-111111111111');
      if (res.kpis) setKpiData(res.kpis);
      if (res.aiEmployees && res.aiEmployees.length > 0) setAiEmployees(res.aiEmployees);
      if (res.automations && res.automations.length > 0) {
        const mappedAuto = res.automations.map((a: any) => ({
          name: a.name || 'Automated Workflow',
          sub: `Trigger: ${a.trigger_type || 'Schedule'}`,
          status: a.status || 'active'
        }));
        setAutomations(mappedAuto);
      }
      if (res.timelineEvents && res.timelineEvents.length > 0) {
        const mappedEvents = res.timelineEvents.slice(0, 4).map((ev: any) => ({
          title: ev.title || 'System Action',
          sub: ev.created_at ? new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          amount: ev.badge_label || 'Completed',
          icon: ev.event_type === 'transaction' ? ShoppingBag : FileText,
          iconBg: 'bg-orange-50 text-orange-600'
        }));
        setRecentActivities(mappedEvents);
      }
    } catch (err) {
      console.error('Failed to load real-time dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = SupabaseDashboardService.subscribeToUmkmRealtime(
      '11111111-1111-1111-1111-111111111111',
      () => loadDashboardData()
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    triggerToast('Synchronizing Home Dashboard with Supabase Realtime...');
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal === 'invoice') {
      triggerToast(`Invoice generated for ${modalForm.title} (${modalForm.amount})`);
    } else if (activeModal === 'broadcast') {
      triggerToast(`Broadcast message "${modalForm.title}" queued for sending!`);
    } else if (activeModal === 'product') {
      triggerToast(`Product "${modalForm.title}" added to store catalog!`);
    }
    setActiveModal(null);
    setModalForm({ title: '', detail: '', amount: '' });
  };

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100 max-w-[1600px] mx-auto">
      
      {/* ========================================================================= */}
      {/* ROW 1: WELCOME BANNER + REALTIME SYSTEM & AI STATUS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* BANNER CARD (LG: 8 COLS) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
                {u.greeting}, {displayName || 'Cik'}! <span className="text-2xl">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {u.greetingSub}
              </p>
            </div>

            {/* 3D ROBOT MASCOT DISPLAY */}
            <div className="relative flex-shrink-0 cursor-pointer group/robot">
              {isGreetingVisible && (
                <div className="absolute top-full mt-2 right-0 w-72 z-50 p-3.5 rounded-xl bg-slate-900/95 text-white shadow-2xl backdrop-blur-md border border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-300">ZEGA AI Copilot</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsGreetingVisible(false); }} className="text-slate-400 hover:text-white p-0.5 rounded-md">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 mt-2 font-medium leading-relaxed">
                    Hello {displayName}! 👋 Your AI Team is active and completed <span className="font-bold text-amber-300">{kpiData.tasks_completed_today || 126} tasks</span> today!
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); setIsGreetingVisible(false); onNavigateTab('my_agents'); }} className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <span>{u.manageAll}</span> <ArrowRight size={12} />
                  </button>
                </div>
              )}

              <div 
                onClick={() => setIsGreetingVisible(!isGreetingVisible)}
                className="relative size-20 sm:size-24 rounded-2xl bg-slate-950 border-2 border-orange-400/50 p-1 shadow-sm overflow-hidden group-hover/robot:scale-105 group-hover/robot:border-orange-500 transition-all duration-300 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-transparent to-black/50 pointer-events-none z-20" />
                <video autoPlay loop muted playsInline className="w-full h-full object-cover rounded-xl relative z-10">
                  <source src="https://cdn.zegaai.site/assets/3D/robotic.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>

          {/* 3 KPI CHIPS IN BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">{u.hoursSaved}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">{kpiData.hours_saved_weekly || 11} Hours</span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{u.hoursSavedSub}</span>
                </div>
              </div>
              <div className="size-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Clock size={16} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">{u.revenue}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">
                    Rp{(kpiData.revenue_generated_today || 4850000).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{u.revenueSub}</span>
                </div>
              </div>
              <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={16} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">{u.tasksCompleted}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">{kpiData.tasks_completed_today || 126}</span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{u.tasksCompletedSub}</span>
                </div>
              </div>
              <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* REALTIME SYSTEM & AI WORKFORCE STATUS CARD */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{u.realtimeStatus}</h3>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleManualRefresh} 
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-orange-500 cursor-pointer transition-all"
                  title="Refresh Database"
                >
                  <RefreshCw size={12} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                </button>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-extrabold flex items-center gap-1">
                  <Wifi size={11} className="text-emerald-500" /> {u.connected}
                </span>
              </div>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Bot size={15} className="text-orange-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{u.aiAgentsActive}</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px]">{aiEmployees.length || 5} Swarm Nodes</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-purple-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{u.realtimeAutomation}</span>
                </div>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px]">{automations.length || 12} Workflows</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-blue-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{u.supabaseSync}</span>
                </div>
                <span className="font-bold text-slate-500 text-[10px]">WebSocket Live</span>
              </div>
            </div>
          </div>

          {/* SUBTLE ACCOUNT PLAN STRIP AT BOTTOM */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium">{u.plan}:</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-black text-[10px]">Starter</span>
            </div>
            <button 
              onClick={() => onNavigateTab('billing')}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{u.managePlan}</span> <ChevronRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 2: 5 METRIC CARDS WITH RECHARTS SPARKLINE CURVES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* PENDAPATAN */}
        <div 
          onClick={() => onNavigateTab('sales')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.revenue}</span>
            <div className="size-6.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              Rp{(kpiData.revenue_generated_today || 5200000).toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{u.revenueSub}</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkRevenue}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* PESANAN BARU */}
        <div 
          onClick={() => onNavigateTab('store')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.newOrders}</span>
            <div className="size-6.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              {kpiData.orders_today_count || 43}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+12%</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkOrders}>
                    <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* PELANGGAN BARU */}
        <div 
          onClick={() => onNavigateTab('customers')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.newCustomers}</span>
            <div className="size-6.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <UserPlus size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              {kpiData.new_customers_today_count || 12}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+9%</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkUsers}>
                    <Line type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* RESPONSE RATE WA */}
        <div 
          onClick={() => onNavigateTab('inbox')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.waResponseRate}</span>
            <div className="size-6.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <MessageSquare size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              {kpiData.whatsapp_response_rate || 98}%
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+3%</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkWa}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* JAM TERSIMPAN */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1 hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.hoursSaved}</span>
            <div className="size-6.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Clock size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              9.2 Hours
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+15%</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkHours}>
                    <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 3: AI EMPLOYEES ANDA */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{u.myAiEmployees}</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold">
              {aiEmployees.length || 5} {u.active}
            </span>
          </div>
          <button 
            onClick={() => onNavigateTab('my_agents')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            {u.manageAll} &gt;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(() => {
            const defaultAgentConfigs = [
              { name: 'Customer Service AI', role: 'Support & Ops Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
              { name: 'Marketing & Campaign AI', role: 'Growth & Content Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
              { name: 'Finance & Billing AI', role: 'Finance & Audit Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
              { name: 'Inventory & Store AI', role: 'Logistics Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
              { name: 'B2B Sales & Leads AI', role: 'Sales & Pipeline Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
            ];

            const list = aiEmployees && aiEmployees.length > 0 ? aiEmployees.slice(0, 5) : defaultAgentConfigs;

            return list.map((agent: any, idx: number) => {
              const def = defaultAgentConfigs[idx % defaultAgentConfigs.length];
              const agentName = (agent.name && agent.name !== 'AI Employee') 
                ? agent.name 
                : (agent.agent_name && agent.agent_name !== 'AI Employee' ? agent.agent_name : def.name);
              const agentRole = agent.role || agent.category || def.role;
              const isAgentActive = agent.status === 'active' || agent.status === 'working' || !agent.status;
              const isWarning = agent.status === 'warning';
              const tasksDone = agent.tasks_completed_today || agent.chats_today || (120 + idx * 15);
              const resolvedVal = agent.resolution_rate ? `${agent.resolution_rate}%` : `${94 + idx * 1.2}%`;
              
              return (
                <div 
                  key={agent.id || agent.agent_code || idx}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between space-y-2.5 hover:border-orange-400/50 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-slate-900 border border-slate-700/80 overflow-hidden flex-shrink-0 p-0.5">
                        <img 
                          src={SupabaseDashboardService.getCdnUrl(agent.avatar_path || 'assets/visualization/ai-avatar.png')} 
                          alt={agentName}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 truncate" title={agentName}>
                          {agentName}
                        </h4>
                        <span className={`text-[8.5px] font-bold ${
                          isAgentActive 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : isWarning 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-slate-400'
                        }`}>
                          • {isAgentActive ? u.active : (isWarning ? 'Attention' : 'Paused')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] space-y-0.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Tasks Today</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{tasksDone}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Success</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{resolvedVal}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSelectedAgentModal({
                        ...agent,
                        name: agentName,
                        role: agentRole,
                        status: isAgentActive ? 'active' : 'paused',
                        tasksDone,
                        resolvedVal
                      });
                    }} 
                    className="w-full py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all cursor-pointer"
                  >
                    {u.open}
                  </button>
                </div>
              );
            });
          })()}

          {/* TAMBAH AI */}
          <div 
            onClick={() => setShowDeployModal(true)}
            className="p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-1 hover:border-orange-500 transition-all cursor-pointer group min-h-[110px]"
          >
            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-colors">
              <Plus size={16} />
            </div>
            <div>
              <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200">{u.addAi}</h4>
              <p className="text-[8.5px] text-slate-400 leading-tight">{u.addAiSub}</p>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: RINGKASAN PENJUALAN, OTOMASI, TUGAS AI & AKTIVITAS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* LEFT 8 COLS: RINGKASAN PENJUALAN + (OTOMASI & TUGAS AI) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* RINGKASAN PENJUALAN RECHARTS AREA CHART */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.salesSummary}</h3>
              <select 
                value={salesTimeframe}
                onChange={(e) => setSalesTimeframe(e.target.value as any)}
                className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="7d">{u.last7Days}</option>
                <option value="30d">{u.last30Days}</option>
              </select>
            </div>

            {/* REAL RECHARTS INTERACTIVE GRAPH */}
            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTimeframe === '7d' ? sales7Days : sales30Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 6, fill: '#f97316', stroke: '#ffffff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SUB-GRID: OTOMASI BERJALAN & TUGAS AI HARI INI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* OTOMASI BERJALAN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.runningAutomation}</h3>
                <button onClick={() => onNavigateTab('automation')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">{u.seeAll} &gt;</button>
              </div>

              <div className="space-y-2">
                {automations.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      triggerToast(`Opening automation: ${item.name}`);
                      onNavigateTab('automation');
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-orange-400/50 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Zap size={13} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{item.name}</h4>
                        <span className="text-[9px] text-slate-400">{item.sub}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-extrabold">
                      {u.active}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TUGAS AI HARI INI */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.aiTasksToday}</h3>
                <button onClick={() => onNavigateTab('my_agents')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">{u.seeAll} &gt;</button>
              </div>

              <div className="space-y-2">
                {[
                  { task: 'Replied 8 customer chats', agent: 'Customer Service AI', time: '2m ago' },
                  { task: 'Created promotional content', agent: 'Marketing AI', time: '15m ago' },
                  { task: 'Verified 5 transactions', agent: 'Finance AI', time: '30m ago' },
                  { task: 'Updated stock for 3 items', agent: 'Store AI', time: '45m ago' },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      triggerToast(`Viewing AI task: ${item.task}`);
                      onNavigateTab('my_agents');
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-orange-400/50 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <CheckCircle size={13} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{item.task}</h4>
                        <span className="text-[9px] text-slate-400">{item.agent}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT 4 COLS: AKTIVITAS TERBARU, AKSI CEPAT & INSTAGRAM */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* AKTIVITAS TERBARU */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.recentActivity}</h3>
              <button onClick={() => onNavigateTab('reports')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">{u.seeAll} &gt;</button>
            </div>

            <div className="space-y-2 text-xs">
              {recentActivities.map((act, i) => {
                const Icon = act.icon || FileText;
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      triggerToast(`Activity detail: ${act.title}`);
                      onNavigateTab('reports');
                    }}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-orange-50/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`size-7 rounded-lg ${act.iconBg || 'bg-orange-50 text-orange-600'} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon size={14} />
                      </div>
                      <div className="truncate min-w-0">
                        <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">{act.title}</h4>
                        <span className="text-[9px] text-slate-400">{act.sub}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 ml-1.5 flex-shrink-0">{act.amount}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AKSI CEPAT */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.quickActions}</h3>
            
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <button 
                onClick={() => {
                  setModalForm({ title: 'Customer PT Maju Jaya', detail: 'INV-2026-009', amount: 'Rp1.500.000' });
                  setActiveModal('invoice');
                }} 
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <FileText size={16} className="text-emerald-500" />
                <span className="text-[9.5px] font-bold">{u.createInvoice}</span>
              </button>

              <button 
                onClick={() => {
                  setModalForm({ title: 'Promo Flash Sale 8.8 Diskon 50%', detail: 'All Active Customers', amount: 'WhatsApp & IG' });
                  setActiveModal('broadcast');
                }} 
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <Megaphone size={16} className="text-orange-500" />
                <span className="text-[9.5px] font-bold">{u.sendBroadcast}</span>
              </button>

              <button 
                onClick={() => {
                  setModalForm({ title: 'Kopi Arabika Premium 250g', detail: 'Minuman / Kopi', amount: 'Rp85.000' });
                  setActiveModal('product');
                }} 
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <Store size={16} className="text-pink-500" />
                <span className="text-[9.5px] font-bold">{u.addProduct}</span>
              </button>

              <button 
                onClick={() => onNavigateTab('sales')} 
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <BarChart2 size={16} className="text-purple-500" />
                <span className="text-[9.5px] font-bold">{u.salesReport}</span>
              </button>
            </div>

            <button 
              onClick={() => triggerToast('Opening ZEGA AI Copilot Assistant...')}
              className="w-full py-2.5 rounded-xl border-2 border-orange-500/80 bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-[11px] shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={15} className="text-orange-500" />
              <span>{u.chatWithAi}</span>
            </button>
          </div>

          {/* INSTAGRAM INTEGRATION */}
          <div className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 dark:from-pink-950/40 dark:to-indigo-950/40 rounded-2xl p-4 border border-pink-200 dark:border-pink-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram size={16} className="text-pink-600" />
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{u.instagramDmBot}</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[8.5px] font-extrabold">{u.connectedBadge}</span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {u.instagramDesc}
            </p>
            <button 
              onClick={() => onNavigateTab('marketplace')} 
              className="w-full py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>{u.manageInstagram}</span> <ArrowRight size={11} />
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* QUICK ACTION MODALS */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                {activeModal === 'invoice' && 'Create Quick Invoice'}
                {activeModal === 'broadcast' && 'Send WhatsApp / IG Broadcast'}
                {activeModal === 'product' && 'Add Product to Store'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Customer Name' : activeModal === 'broadcast' ? 'Broadcast Title' : 'Product Name'}
                </label>
                <input 
                  type="text" 
                  value={modalForm.title}
                  onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                  required 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Invoice Number / Note' : activeModal === 'broadcast' ? 'Target Audience' : 'Category'}
                </label>
                <input 
                  type="text" 
                  value={modalForm.detail}
                  onChange={(e) => setModalForm(prev => ({ ...prev, detail: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Total Amount' : activeModal === 'broadcast' ? 'Channels' : 'Price (Rp)'}
                </label>
                <input 
                  type="text" 
                  value={modalForm.amount}
                  onChange={(e) => setModalForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1.5 shadow-xs">
                  <Send size={14} /> Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AGENT QUICK VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
                  <img
                    src={SupabaseDashboardService.getCdnUrl(selectedAgentModal.avatar_path || 'assets/visualization/ai-avatar.png')}
                    alt={selectedAgentModal.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{selectedAgentModal.name}</h3>
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">{selectedAgentModal.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAgentModal(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Tasks Today</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{selectedAgentModal.tasksDone || 125}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Resolution Rate</span>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{selectedAgentModal.resolvedVal || '94.2%'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Avg Response</span>
                <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">1.2s</span>
              </div>
            </div>

            {/* Active Capabilities */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Capabilities & Tools</span>
              <div className="flex flex-wrap gap-1.5">
                {['WhatsApp API', 'Supabase RAG', 'Auto-Invoice', 'Instagram DM', 'Sentiment Analysis'].map((cap, ci) => (
                  <span key={ci} className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle size={12} className="text-orange-500" />
                    <span>{cap}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Status Toggle & Full Workspace Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-3">
              <button
                onClick={async () => {
                  const newStatus = selectedAgentModal.status === 'active' ? 'paused' : 'active';
                  if (selectedAgentModal.id) {
                    await SupabaseDashboardService.updateUmkmAiEmployeeStatus(selectedAgentModal.id, newStatus);
                  }
                  setSelectedAgentModal({ ...selectedAgentModal, status: newStatus });
                  triggerToast(`Updated ${selectedAgentModal.name} status to ${newStatus.toUpperCase()}`);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors border ${
                  selectedAgentModal.status === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                {selectedAgentModal.status === 'active' ? '• Status: Active' : '• Status: Paused'}
              </button>

              <button
                onClick={() => {
                  setSelectedAgentModal(null);
                  onNavigateTab('my_agents');
                }}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Full Agent Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DEPLOY NEW AI EMPLOYEE MODAL */}
      {/* ========================================================================= */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-orange-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Deploy New AI Employee</h3>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAgentForm.name.trim()) return;

                const payload = {
                  name: newAgentForm.name,
                  role: newAgentForm.role,
                  category: newAgentForm.role,
                  desc: newAgentForm.description || 'Autonomous enterprise AI worker.',
                  status: 'active',
                  avatar_path: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
                  capabilities: ['WhatsApp API', 'Supabase RAG', 'Automated Responses']
                };

                const res = await SupabaseDashboardService.addUmkmAiEmployee('11111111-1111-1111-1111-111111111111', payload);
                if (res.data) {
                  setAiEmployees(prev => [res.data, ...prev]);
                  triggerToast(`Successfully deployed ${res.data.name || newAgentForm.name}!`);
                } else {
                  triggerToast(`Deployed ${newAgentForm.name} locally.`);
                }

                setShowDeployModal(false);
                setNewAgentForm({ name: '', role: 'Support & Ops Specialist', description: '' });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">AI Employee Name</label>
                <input
                  type="text"
                  required
                  value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                  placeholder="e.g. Sales Specialist Bot"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Role Specialization</label>
                <select
                  value={newAgentForm.role}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Support & Ops Specialist">Support & Ops Specialist</option>
                  <option value="Growth & Content Specialist">Growth & Content Specialist</option>
                  <option value="Finance & Audit Specialist">Finance & Audit Specialist</option>
                  <option value="Logistics Specialist">Logistics Specialist</option>
                  <option value="Sales & Pipeline Specialist">Sales & Pipeline Specialist</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Primary Mandate / Description</label>
                <textarea
                  rows={2}
                  value={newAgentForm.description}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, description: e.target.value })}
                  placeholder="e.g. Auto-responds to customer queries and updates Supabase CRM."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Deploy AI Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
