import React, { useState, useEffect } from 'react';
import { 
  Bot, Plus, Search, ChevronDown, LayoutGrid, List, 
  CheckCircle2, Clock, DollarSign, Megaphone, FileText, 
  Store, Users, AlertCircle, ShoppingBag, Sparkles, Activity,
  Play, Pause, Sliders, ArrowUpRight, ShieldCheck, Zap, Layers, RefreshCw, X, Save, Check
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../../../../i18n/translations';
import { SupabaseDashboardService } from '../../services/supabaseService';

interface MyAgentsViewProps {
  triggerToast: (msg: string) => void;
}

// Sparkline dummy data for agent KPI mini charts
const sparkData1 = [{ v: 20 }, { v: 45 }, { v: 78 }, { v: 95 }, { v: 125 }];
const sparkData2 = [{ v: 4 },  { v: 6 },  { v: 8 },  { v: 10 }, { v: 12 }];
const sparkData3 = [{ v: 10 }, { v: 22 }, { v: 31 }, { v: 38 }, { v: 43 }];
const sparkData4 = [{ v: 5 },  { v: 12 }, { v: 18 }, { v: 22 }, { v: 25 }];
const sparkData5 = [{ v: 2 },  { v: 5 },  { v: 10 }, { v: 14 }, { v: 18 }];

const TEMPLATE_PRESETS = [
  {
    name: 'Omnichannel Customer Service AI',
    category: 'Support & Ops',
    desc: 'Auto-responds customer inquiries across WhatsApp Business, IG DM, and Shopee with RAG knowledge base.',
    capabilities: ['WhatsApp API', 'Supabase RAG', 'IG DM Bot', 'Auto Ticket'],
    avatar_path: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png'
  },
  {
    name: 'Viral TikTok & IG Campaign AI',
    category: 'Marketing',
    desc: 'Generates viral short video scripts, creates promo banners, and auto-posts across TikTok and IG.',
    capabilities: ['AI Script Gen', 'TikTok API', 'Banner Studio', 'Auto Schedule'],
    avatar_path: 'https://cdn.zegaai.site/assets/logo/zegalogo.png'
  },
  {
    name: 'Automated Invoice & Reconciliation AI',
    category: 'Finance',
    desc: 'Creates electronic invoices, sends WA payment links, and reconciles incoming bank transfers.',
    capabilities: ['E-Invoice Generator', 'Payment Gateway', 'Bank Reconciliation'],
    avatar_path: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png'
  },
  {
    name: 'Shopee & Tokopedia Stock Router AI',
    category: 'E-Commerce',
    desc: 'Synchronizes product inventory in real-time across Shopee, Tokopedia, and offline POS.',
    capabilities: ['Multi-channel Sync', 'Stock Alert', 'Order Dispatch'],
    avatar_path: 'https://cdn.zegaai.site/assets/logo/zegalogo.png'
  },
  {
    name: 'B2B Sales Closing & Upsell AI',
    category: 'Sales',
    desc: 'Follows up pending buyer quotes, executes personalized discount triggers, and closes deals.',
    capabilities: ['CRM Pipeline', 'Lead Scoring', 'Auto Upsell'],
    avatar_path: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png'
  }
];

export function MyAgentsView({ triggerToast }: MyAgentsViewProps) {
  const { t } = useLanguage();
  const m = t.myEmployees || {
    title: 'My AI Workforce',
    subtitle: 'Manage your 24/7 autonomous AI team orchestrating your enterprise operations.',
    addEmployee: 'Deploy AI Employee',
    templates: 'Templates Gallery',
    totalEmployees: 'Total AI Workforce',
    activeNow: 'Active Swarm Nodes',
    tasksToday: 'Tasks Executed Today',
    hoursSavedToday: 'Time Saved Today',
    costSavedToday: 'Cost Saved Today',
    filterAll: 'All Employees',
    filterActive: 'Active',
    filterAttention: 'Attention Needed',
    filterInactive: 'Inactive',
    searchPlaceholder: 'Search AI Employee or capability...',
    allCategories: 'All Categories',
    viewDetails: 'Configure Agent',
    pauseAgent: 'Pause Agent',
    resumeAgent: 'Resume Agent',
    addCustomCard: 'Custom AI Worker',
    addCustomDesc: 'Build or clone an AI Employee tailored to your business workflow.',
    selectTemplate: 'Browse Templates',
    workingStatus: 'Working',
    idleStatus: 'Idle',
    warningStatus: 'Attention'
  };

  const [filterTab, setFilterTab] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<'config' | 'deploy' | 'templates' | null>(null);
  const [selectedAgentForConfig, setSelectedAgentForConfig] = useState<any>(null);

  // Form states for Modal
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'Support & Ops',
    desc: '',
    status: 'active',
    capabilities: '',
    avatar_path: 'assets/visualization/ai-avatar.png'
  });

  // Real-time Database KPI State
  const [kpis, setKpis] = useState<any>({
    tasks_completed_today: 126,
    hours_saved_weekly: 11.0,
    revenue_generated_today: 2100000
  });

  // Employee State initialized with database defaults & R2 CDN URLs
  const [employees, setEmployees] = useState<any[]>([
    {
      id: 'cs',
      name: 'Customer Service AI',
      category: 'Support & Ops',
      desc: 'Auto-responds customer inquiries across WhatsApp, Instagram DM, and Shopee 24/7.',
      status: 'active',
      icon: Bot,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      capabilities: ['WhatsApp API', 'Supabase RAG', 'IG DM Bot'],
      m1Label: 'Chats Today',
      m1Val: '125 chats',
      m2Label: 'Resolution Rate',
      m2Val: '94.2%',
      m3Label: 'Avg Response',
      m3Val: '1.2s',
      spark: sparkData1
    },
    {
      id: 'mkt',
      name: 'Marketing Content AI',
      category: 'Marketing',
      desc: 'Generates viral social posts, schedules IG/TikTok feeds, and monitors engagement.',
      status: 'active',
      icon: Megaphone,
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
      capabilities: ['AI Image Gen', 'TikTok API', 'Auto Schedule'],
      m1Label: 'Posts Gen',
      m1Val: '12 posts',
      m2Label: 'Active Campaign',
      m2Val: '3 live',
      m3Label: 'Engagement Rate',
      m3Val: '7.8%',
      spark: sparkData2
    },
    {
      id: 'fin',
      name: 'Finance & Billing AI',
      category: 'Finance',
      desc: 'Creates invoices, sends payment reminders, and auto-reconciles bank transactions.',
      status: 'active',
      icon: FileText,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      capabilities: ['Invoice Engine', 'Bank Sync', 'Payment Gateway'],
      m1Label: 'Invoices Sent',
      m1Val: '43 sent',
      m2Label: 'Reminders Sent',
      m2Val: '15 sent',
      m3Label: 'Outstanding',
      m3Val: '8 pending',
      spark: sparkData3
    },
    {
      id: 'str',
      name: 'Store Inventory AI',
      category: 'E-Commerce',
      desc: 'Syncs product stock across channels, flags low inventory, and processes orders.',
      status: 'active',
      icon: Store,
      iconBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      capabilities: ['Stock Sync', 'Order Pipeline', 'Low Stock Alert'],
      m1Label: 'Products Sync',
      m1Val: '25 today',
      m2Label: 'Low Stock Alert',
      m2Val: '2 items',
      m3Label: 'Orders Processed',
      m3Val: '17 today',
      spark: sparkData4
    },
    {
      id: 'sls',
      name: 'Sales & Closing AI',
      category: 'Sales',
      desc: 'Follows up leads, converts inquiries to paid sales, and executes cross-sell offers.',
      status: 'active',
      icon: Users,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      capabilities: ['Lead Scoring', 'CRM Pipeline', 'Upsell Trigger'],
      m1Label: 'Leads Followed',
      m1Val: '18 leads',
      m2Label: 'Deals Closed',
      m2Val: '7 deals',
      m3Label: 'Revenue Added',
      m3Val: 'Rp2.100.000',
      spark: sparkData5
    }
  ]);

  // Load Database Real-time AI Employee Records
  const loadDatabaseData = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmRealtimeData('11111111-1111-1111-1111-111111111111');
      if (data.kpis) setKpis(data.kpis);
      if (data.aiEmployees && data.aiEmployees.length > 0) {
        // Map database records to high-density UI format with R2 CDN URLs & JSONB metrics
        const DEFAULT_ROLE_NAME_CONFIGS = [
          { name: 'Omnichannel Customer Service AI', category: 'Support & Ops', desc: 'Auto-responds customer inquiries across WhatsApp Business, IG DM, and Shopee with RAG knowledge base.' },
          { name: 'Viral TikTok & IG Campaign AI', category: 'Marketing', desc: 'Generates viral short video scripts, creates promo banners, and auto-posts across TikTok and IG.' },
          { name: 'Automated Invoice & Reconciliation AI', category: 'Finance', desc: 'Creates electronic invoices, sends WA payment links, and reconciles incoming bank transfers.' },
          { name: 'Shopee & Tokopedia Stock Router AI', category: 'E-Commerce', desc: 'Synchronizes product inventory in real-time across Shopee, Tokopedia, and offline POS.' },
          { name: 'B2B Sales Closing & Upsell AI', category: 'Sales', desc: 'Follows up pending buyer quotes, executes personalized discount triggers, and closes deals.' },
          { name: 'WhatsApp Broadcast Bot AI', category: 'Marketing', desc: 'Executes targeted WhatsApp broadcast campaigns and analyzes response metrics.' },
          { name: 'Support Swarm Escalation AI', category: 'Support & Ops', desc: 'Handles complex customer complaints, escalates to human agents, and logs ticket status.' }
        ];

        const mapped = data.aiEmployees.map((dbEmp: any, index: number) => {
          const defaultEmp = employees[index % employees.length] || employees[0];
          const roleConfig = DEFAULT_ROLE_NAME_CONFIGS[index % DEFAULT_ROLE_NAME_CONFIGS.length];
          
          // Detect generic repetitive name "AI Employee" or duplicate "Customer Service AI" on non-0 indices
          const rawName = dbEmp.name || dbEmp.agent_name;
          const isGeneric = !rawName || rawName.trim() === 'AI Employee' || (rawName.trim() === 'Customer Service AI' && index > 0);
          const finalName = isGeneric ? roleConfig.name : rawName;
          const finalCategory = (dbEmp.category && dbEmp.category !== 'Support & Ops' && dbEmp.category !== 'General') 
            ? dbEmp.category 
            : roleConfig.category;
          const finalDesc = (dbEmp.description && dbEmp.description.length > 25 && !dbEmp.description.includes('Auto-responds customer inquiries across WhatsApp'))
            ? dbEmp.description
            : roleConfig.desc;

          // Parse JSONB metrics if available
          const metrics = typeof dbEmp.metrics === 'object' && dbEmp.metrics !== null ? dbEmp.metrics : {};
          const sparkData = Array.isArray(dbEmp.sparkline_data) && dbEmp.sparkline_data.length > 0
            ? dbEmp.sparkline_data 
            : defaultEmp.spark;

          return {
            id: dbEmp.id || defaultEmp.id,
            agent_code: dbEmp.agent_code,
            name: finalName,
            category: finalCategory,
            desc: finalDesc,
            status: dbEmp.status || defaultEmp.status,
            icon: defaultEmp.icon || Bot,
            iconBg: defaultEmp.iconBg || 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            avatar_path: SupabaseDashboardService.getCdnUrl(dbEmp.avatar_path || 'assets/visualization/ai-avatar.png'),
            capabilities: (dbEmp.capabilities && dbEmp.capabilities.length > 0) ? dbEmp.capabilities : defaultEmp.capabilities,
            m1Label: metrics.m1Label || defaultEmp.m1Label || 'Tasks Today',
            m1Val: metrics.m1Val || `${dbEmp.tasks_completed_today || 125} tasks`,
            m2Label: metrics.m2Label || defaultEmp.m2Label || 'Resolution Rate',
            m2Val: metrics.m2Val || (dbEmp.resolution_rate ? `${dbEmp.resolution_rate}%` : '94.2%'),
            m3Label: metrics.m3Label || defaultEmp.m3Label || 'Avg Response',
            m3Val: metrics.m3Val || (dbEmp.avg_response_time_sec ? `${dbEmp.avg_response_time_sec}s` : '1.2s'),
            spark: sparkData
          };
        });
        setEmployees(mapped);
      }
    } catch (err) {
      console.error('Failed to sync DB real-time employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
    const unsubscribe = SupabaseDashboardService.subscribeToUmkmRealtime(
      '11111111-1111-1111-1111-111111111111',
      () => loadDatabaseData()
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    triggerToast('Synchronizing realtime database state...');
    await loadDatabaseData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const toggleStatus = async (id: string) => {
    const target = employees.find(e => e.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';

    // Optimistic UI update
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, status: nextStatus } : emp));
    triggerToast(`${target.name} status updated to ${nextStatus.toUpperCase()}`);

    // Persist change to Supabase database
    await SupabaseDashboardService.updateUmkmAiEmployeeStatus(id, nextStatus);
  };

  // Open Configure Modal
  const handleOpenConfig = (emp: any) => {
    setSelectedAgentForConfig(emp);
    setFormData({
      id: emp.id,
      name: emp.name,
      category: emp.category || 'Support & Ops',
      desc: emp.desc || '',
      status: emp.status || 'active',
      capabilities: Array.isArray(emp.capabilities) ? emp.capabilities.join(', ') : '',
      avatar_path: emp.avatar_path || 'assets/visualization/ai-avatar.png'
    });
    setActiveModal('config');
  };

  // Save Configured Agent to Supabase
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const capabilitiesArray = formData.capabilities
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      category: formData.category,
      desc: formData.desc,
      status: formData.status,
      capabilities: capabilitiesArray,
      avatar_path: formData.avatar_path
    };

    triggerToast(`Saving changes for ${formData.name}...`);
    setActiveModal(null);

    // Optimistic update
    setEmployees(prev => prev.map(emp => emp.id === formData.id ? { ...emp, ...payload } : emp));

    // Save to Database
    await SupabaseDashboardService.updateUmkmAiEmployee(formData.id, payload);
    triggerToast(`Agent ${formData.name} updated successfully!`);
    loadDatabaseData();
  };

  // Deploy New Custom AI Employee
  const handleDeployAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const capabilitiesArray = formData.capabilities
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      category: formData.category,
      desc: formData.desc || 'Custom enterprise AI employee.',
      status: formData.status || 'active',
      capabilities: capabilitiesArray.length > 0 ? capabilitiesArray : ['WhatsApp API', 'Supabase RAG'],
      avatar_path: formData.avatar_path || 'assets/visualization/ai-avatar.png'
    };

    triggerToast(`Deploying ${formData.name} to AI Workforce...`);
    setActiveModal(null);

    const res = await SupabaseDashboardService.addUmkmAiEmployee('11111111-1111-1111-1111-111111111111', payload);
    if (res.error) {
      triggerToast(`Error deploying agent: ${res.error}`);
    } else {
      triggerToast(`AI Employee ${formData.name} deployed successfully!`);
      loadDatabaseData();
    }
  };

  // Deploy Pre-configured Preset from Template Gallery
  const handleDeployPreset = async (preset: typeof TEMPLATE_PRESETS[0]) => {
    triggerToast(`Deploying preset template: ${preset.name}...`);
    setActiveModal(null);

    const payload = {
      name: preset.name,
      category: preset.category,
      desc: preset.desc,
      status: 'active',
      capabilities: preset.capabilities,
      avatar_path: preset.avatar_path
    };

    const res = await SupabaseDashboardService.addUmkmAiEmployee('11111111-1111-1111-1111-111111111111', payload);
    if (res.error) {
      triggerToast(`Failed to deploy template: ${res.error}`);
    } else {
      triggerToast(`Template ${preset.name} deployed into your workforce!`);
      loadDatabaseData();
    }
  };

  // Filter Employees
  const filteredEmployees = employees.filter((emp) => {
    if (filterTab === 'Aktif') return emp.status === 'active';
    if (filterTab === 'Perlu Perhatian') return emp.status === 'warning';
    if (filterTab === 'Tidak Aktif') return emp.status === 'inactive';
    return true;
  }).filter((emp) => {
    if (selectedCategory !== 'All Categories') {
      return emp.category?.toLowerCase() === selectedCategory.toLowerCase();
    }
    return true;
  }).filter((emp) => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.capabilities && emp.capabilities.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-5 font-sans max-w-[1600px] mx-auto text-slate-900 dark:text-slate-100">
      
      {/* ========================================================================= */}
      {/* EXECUTIVE HEADER: TITLE + QUICK DEPLOY ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">{m.title}</h1>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1.5 border border-emerald-500/20">
              <Activity size={12} className="animate-pulse text-emerald-500" /> Supabase Realtime Live
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {m.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button 
            onClick={handleManualRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Force Refresh Database"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-orange-500' : ''} />
          </button>

          <button 
            onClick={() => setActiveModal('templates')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Layers size={15} className="text-slate-400" />
            <span>{m.templates}</span>
          </button>

          <button 
            onClick={() => {
              setFormData({
                id: '',
                name: '',
                category: 'Support & Ops',
                desc: '',
                status: 'active',
                capabilities: 'WhatsApp API, Supabase RAG',
                avatar_path: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png'
              });
              setActiveModal('deploy');
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <Plus size={16} /> 
            <span>{m.addEmployee}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* METRICS OVERVIEW: 5 HIGH-DENSITY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: m.totalEmployees, val: employees.length.toString(), change: '100% Synced CDN', icon: Bot, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60' },
          { label: m.activeNow, val: employees.filter(e => e.status === 'active').length.toString(), change: 'Swarm Live', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
          { label: m.tasksToday, val: (kpis.tasks_completed_today || 126).toString(), change: '+22% vs yesterday', icon: Zap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
          { label: m.hoursSavedToday, val: `${kpis.hours_saved_weekly || 11.0} Hours`, change: '+16% vs yesterday', icon: Clock, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
          { label: m.costSavedToday, val: `Rp${(kpis.revenue_generated_today || 2100000).toLocaleString('id-ID')}`, change: '+20% vs yesterday', icon: DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
        ].map((mItem, i) => {
          const Icon = mItem.icon;
          return (
            <div key={i} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-slate-400 block truncate">{mItem.label}</span>
                <div className={`size-7 rounded-lg ${mItem.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} />
                </div>
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 dark:text-slate-100">{mItem.val}</div>
                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-0.5">
                  <span>▲</span> <span>{mItem.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* FILTER & VIEW CONTROLS BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* TABS */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none font-bold text-xs">
          {[
            { label: `${m.filterAll} (${employees.length})`, key: 'Semua' },
            { label: `${m.filterActive} (${employees.filter(e=>e.status==='active').length})`, key: 'Aktif' },
            { label: `${m.filterAttention} (${employees.filter(e=>e.status==='warning').length})`, key: 'Perlu Perhatian' },
            { label: `${m.filterInactive} (${employees.filter(e=>e.status==='inactive').length})`, key: 'Tidak Aktif' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterTab === tab.key
                  ? 'bg-orange-500 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH & TOGGLE SWITCHER */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={m.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-orange-500 font-medium"
            />
          </div>

          {/* DYNAMIC CATEGORY DROPDOWN */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 appearance-none cursor-pointer focus:outline-none focus:border-orange-500"
            >
              <option value="All Categories">All Categories</option>
              <option value="Support & Ops">Support & Ops</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="E-Commerce">E-Commerce</option>
              <option value="Sales">Sales</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-xs' : 'text-slate-400'}`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-xs' : 'text-slate-400'}`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* GRID / LIST WORKFORCE DISPLAY */}
      {/* ========================================================================= */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => {
            const Icon = emp.icon || Bot;
            const isActive = emp.status === 'active';
            const isWarning = emp.status === 'warning';

            return (
              <div 
                key={emp.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3.5 shadow-xs hover:border-orange-500/50 transition-all group"
              >
                <div>
                  {/* CARD HEADER: ICON/AVATAR + STATUS BADGE + TOGGLE */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {emp.avatar_path ? (
                        <img 
                          src={emp.avatar_path} 
                          alt={emp.name} 
                          className="size-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={`size-11 rounded-2xl border flex items-center justify-center flex-shrink-0 ${emp.iconBg}`}>
                          <Icon size={20} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors leading-snug">
                          {emp.name}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400">{emp.category}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleStatus(emp.id)}
                      title={isActive ? m.pauseAgent : m.resumeAgent}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isActive 
                          ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600' 
                          : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isActive ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed line-clamp-2 font-normal">
                    {emp.desc}
                  </p>

                  {/* CAPABILITY BADGES */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    {emp.capabilities && emp.capabilities.map((cap: string, ci: number) => (
                      <span key={ci} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[9.5px] font-semibold">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* KPI METRICS & RECHARTS MINI SPARKLINE */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">{emp.m1Label}</span>
                    <span className="font-black text-slate-900 dark:text-slate-100">{emp.m1Val}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block font-medium truncate">{emp.m2Label}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{emp.m2Val}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block font-medium truncate">{emp.m3Label}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{emp.m3Val}</span>
                    </div>
                  </div>

                  {/* MINI SPARKLINE GRAPH */}
                  <div className="w-full h-6 pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={emp.spark || sparkData1}>
                        <Line type="monotone" dataKey="v" stroke={isActive ? '#10b981' : '#94a3b8'} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <button 
                  onClick={() => handleOpenConfig(emp)}
                  className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 group-hover:border-orange-400/60"
                >
                  <span>{m.viewDetails}</span>
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-orange-500" />
                </button>
              </div>
            );
          })}

          {/* DOTTED DEPLOY PLACEHOLDER CARD */}
          <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-5 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3 min-h-[280px]">
            <div className="size-11 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Plus size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{m.addCustomCard}</h3>
              <p className="text-xs text-slate-400 max-w-[200px] mt-1 leading-normal">{m.addCustomDesc}</p>
            </div>
            <button 
              onClick={() => setActiveModal('templates')}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              {m.selectTemplate}
            </button>
          </div>
        </div>
      ) : (
        /* LIST VIEW FORMAT */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
          {filteredEmployees.map((emp) => {
            const Icon = emp.icon || Bot;
            const isActive = emp.status === 'active';
            return (
              <div key={emp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3.5">
                  {emp.avatar_path ? (
                    <img src={emp.avatar_path} alt={emp.name} className="size-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                  ) : (
                    <div className={`size-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${emp.iconBg}`}>
                      <Icon size={18} />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{emp.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {isActive ? m.workingStatus : m.idleStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{emp.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="hidden md:block">
                    <span className="text-[10px] text-slate-400 block">{emp.m1Label}</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{emp.m1Val}</span>
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-[10px] text-slate-400 block">{emp.m2Label}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{emp.m2Val}</span>
                  </div>
                  <button 
                    onClick={() => handleOpenConfig(emp)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {m.viewDetails}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIGURE AI AGENT */}
      {/* ========================================================================= */}
      {activeModal === 'config' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Sliders size={18} />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">Configure AI Agent</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Agent Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Role / Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-semibold"
                  >
                    <option value="Support & Ops">Support & Ops</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-semibold"
                  >
                    <option value="active">Active / Working</option>
                    <option value="warning">Attention Needed</option>
                    <option value="inactive">Paused / Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={formData.desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Capabilities (Comma Separated)</label>
                <input 
                  type="text"
                  value={formData.capabilities}
                  onChange={(e) => setFormData(prev => ({ ...prev, capabilities: e.target.value }))}
                  placeholder="e.g. WhatsApp API, Supabase RAG, IG DM Bot"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Avatar CDN Path / URL</label>
                <input 
                  type="text"
                  value={formData.avatar_path}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_path: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Save size={15} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DEPLOY NEW AI EMPLOYEE */}
      {/* ========================================================================= */}
      {activeModal === 'deploy' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">Deploy New AI Employee</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDeployAgent} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Agent Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Shopee Auto Order Processor"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Role / Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-semibold"
                >
                  <option value="Support & Ops">Support & Ops</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Describe what this AI Employee handles..."
                  value={formData.desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Capabilities (Comma Separated)</label>
                <input 
                  type="text"
                  value={formData.capabilities}
                  onChange={(e) => setFormData(prev => ({ ...prev, capabilities: e.target.value }))}
                  placeholder="WhatsApp API, Supabase RAG, IG DM Bot"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={15} /> Deploy Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TEMPLATES GALLERY */}
      {/* ========================================================================= */}
      {activeModal === 'templates' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">Enterprise AI Templates Gallery</h3>
                  <p className="text-xs text-slate-400 font-medium">Select a pre-configured AI Agent template to deploy immediately.</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {TEMPLATE_PRESETS.map((preset, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-4 hover:border-orange-500/60 transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{preset.name}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[9.5px] font-bold">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 font-normal">{preset.desc}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {preset.capabilities.map((c, ci) => (
                        <span key={ci} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeployPreset(preset)}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs whitespace-nowrap cursor-pointer transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>Deploy</span>
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
