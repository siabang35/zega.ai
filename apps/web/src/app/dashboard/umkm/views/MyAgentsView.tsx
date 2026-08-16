import React, { useState, useEffect } from 'react';
import {
  Bot, Plus, Search, ChevronDown, LayoutGrid, List,
  CheckCircle2, Clock, DollarSign, Megaphone, FileText,
  Store, Users, AlertCircle, ShoppingBag, Sparkles, Activity,
  Play, Pause, Sliders, ArrowUpRight, ShieldCheck, Zap, Layers, RefreshCw, X, Save, Check, Trash2
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../../../../i18n/translations';
import { SupabaseDashboardService } from '../../services/supabaseService';

interface MyAgentsViewProps {
  triggerToast: (msg: string) => void;
}

// Default zero-state sparkline data
const zeroSparkData = [{ v: 0 }, { v: 0 }];

const REAL_CDN_LOGOS = [
  '/assets/logo/ai-agents.png',
  '/assets/logo/claude.webp',
  '/assets/logo/stripe.webp',
  '/assets/logo/shopee.png',
  '/assets/logo/gpt.webp',
  '/assets/logo/deepseek.webp',
  '/assets/logo/gemini.png',
  '/assets/logo/9router.png'
];

const AI_MODEL_ENGINES = [
  {
    id: '9Router-Auto-Cost-Optimizer',
    name: '9Router Layer 5 Engine',
    badge: 'Auto-Cost Router',
    desc: 'Lowest Token Cost & Multi-Provider Failover',
    logo: '/assets/logo/9router.png',
    avatar: '/assets/logo/9router.png'
  },
  {
    id: 'ZeroClaw-Edge-Gateway-Llama3',
    name: 'ZeroClaw Edge Gateway',
    badge: 'Sub-200ms Edge',
    desc: 'Edge Swarm Node Execution & Solana Pay Escrow',
    logo: '/assets/logo/zeroclaw.jpeg',
    avatar: '/assets/logo/zeroclaw.jpeg'
  },
  {
    id: 'ZEGA-Swarm-Llama-3.3-70B',
    name: 'ZEGA Swarm Llama 3.3 70B',
    badge: 'Flagship Enterprise',
    desc: 'Ultra-Fast Complex Reasoning & Operations',
    logo: '/assets/logo/zegalogo.png',
    avatar: '/assets/logo/zegalogo.png'
  },
  {
    id: 'DeepSeek-R1-Distill-Qwen-32B',
    name: 'DeepSeek R1 Distill 32B',
    badge: 'High Reasoning',
    desc: 'Deep Analytical Thinking & Logic Swarm',
    logo: '/assets/logo/deepseek.webp',
    avatar: '/assets/logo/deepseek.webp'
  },
  {
    id: 'Qwen-2.5-Coder-32B',
    name: 'Qwen 2.5 Coder 32B',
    badge: 'Automation Code',
    desc: 'API Workflows & Code Synthesis Engine',
    logo: '/assets/logo/Qwen.png',
    avatar: '/assets/logo/Qwen.png'
  },
  {
    id: 'Claude-3.5-Sonnet-v2',
    name: 'Claude 3.5 Sonnet v2',
    badge: 'Vision & OCR',
    desc: 'Multimodal Vision & Document OCR Specialist',
    logo: '/assets/logo/claude.webp',
    avatar: '/assets/logo/claude.webp'
  },
  {
    id: 'Ollama-Local-Zero-Cost',
    name: 'Ollama Local Node',
    badge: 'Zero Cost',
    desc: 'On-Premise Private LLM Deployment',
    logo: '/assets/logo/huggingface.webp',
    avatar: '/assets/logo/huggingface.webp'
  }
];

const TEMPLATE_PRESETS = [
  {
    name: 'Omnichannel Customer Service AI',
    category: 'Support & Ops',
    desc: 'Auto-responds customer inquiries across WhatsApp Business, IG DM, and Shopee with RAG knowledge base.',
    capabilities: ['WhatsApp API', 'Supabase RAG', 'IG DM Bot', 'Auto Ticket'],
    avatar_path: 'https://cdn.zegaai.site/assets/logo/ai-agents.png'
  },
  {
    name: 'Viral TikTok & IG Campaign AI',
    category: 'Marketing',
    desc: 'Generates viral short video scripts, creates promo banners, and auto-posts across TikTok and IG.',
    capabilities: ['AI Script Gen', 'TikTok API', 'Banner Studio', 'Auto Schedule'],
    avatar_path: 'https://cdn.zegaai.site/assets/logo/claude.webp'
  },
  {
    name: 'Automated Invoice & Reconciliation AI',
    category: 'Finance',
    desc: 'Creates electronic invoices, sends WA payment links, and reconciles incoming bank transfers.',
    capabilities: ['E-Invoice Generator', 'Payment Gateway', 'Bank Reconciliation'],
    avatar_path: 'https://cdn.zegaai.site/assets/logo/stripe.webp'
  },
  {
    name: 'Shopee & Tokopedia Stock Router AI',
    category: 'E-Commerce',
    desc: 'Synchronizes product inventory in real-time across Shopee, Tokopedia, and offline POS.',
    capabilities: ['Multi-channel Sync', 'Stock Alert', 'Order Dispatch'],
    avatar_path: 'https://cdn.zegaai.site/assets/logo/shopee.png'
  },
  {
    name: 'B2B Sales Closing & Upsell AI',
    category: 'Sales',
    desc: 'Follows up pending buyer quotes, executes personalized discount triggers, and closes deals.',
    capabilities: ['CRM Pipeline', 'Lead Scoring', 'Auto Upsell'],
    avatar_path: 'https://cdn.zegaai.site/assets/logo/gpt.webp'
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
    avatar_path: '/assets/logo/ai-agents.png',
    model_engine: '9Router-Auto-Cost-Optimizer'
  });

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Real-time Database KPI State (Initialized to zero-state)
  const [kpis, setKpis] = useState<any>({
    tasks_completed_today: 0,
    hours_saved_weekly: 0.0,
    revenue_generated_today: 0
  });

  // Employee State initialized to empty array (no mock data fallback)
  const [employees, setEmployees] = useState<any[]>([]);

  // Load Database Real-time AI Employee Records
  const loadDatabaseData = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmRealtimeData();
      if (data.kpis) {
        setKpis(data.kpis);
      } else {
        setKpis({
          tasks_completed_today: 0,
          hours_saved_weekly: 0.0,
          revenue_generated_today: 0
        });
      }

      const dbEmployees = Array.isArray(data.aiEmployees) ? data.aiEmployees : [];
      const mapped = dbEmployees.map((dbEmp: any) => {
        const metrics = typeof dbEmp.metrics === 'object' && dbEmp.metrics !== null ? dbEmp.metrics : {};
        const sparkData = Array.isArray(dbEmp.sparkline_data) && dbEmp.sparkline_data.length > 0
          ? dbEmp.sparkline_data
          : [{ v: 0 }, { v: 0 }];

        const resolvedAvatar = SupabaseDashboardService.getCdnUrl(
          dbEmp.avatar_path || dbEmp.cdn_avatar_url || '/assets/logo/ai-agents.png'
        );

        return {
          id: dbEmp.id,
          agent_code: dbEmp.agent_code,
          name: dbEmp.name || dbEmp.agent_name || 'AI Employee',
          category: dbEmp.category || dbEmp.role || 'Support & Ops',
          desc: dbEmp.description || '',
          status: dbEmp.status || 'inactive',
          icon: Bot,
          iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          avatar_path: resolvedAvatar,
          capabilities: Array.isArray(dbEmp.capabilities) ? dbEmp.capabilities : [],
          m1Label: metrics.m1Label || 'Tasks Today',
          m1Val: metrics.m1Val || `${dbEmp.tasks_completed_today ?? 0} tasks`,
          m2Label: metrics.m2Label || 'Resolution Rate',
          m2Val: metrics.m2Val || (dbEmp.resolution_rate !== undefined ? `${dbEmp.resolution_rate}%` : '0%'),
          m3Label: metrics.m3Label || 'Avg Response',
          m3Val: metrics.m3Val || (dbEmp.avg_response_time_sec !== undefined ? `${dbEmp.avg_response_time_sec}s` : '0s'),
          spark: sparkData
        };
      });
      setEmployees(mapped);
    } catch (err) {
      console.error('Failed to sync DB real-time employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const init = async () => {
      await loadDatabaseData();
      const storeId = await SupabaseDashboardService.getAuthenticatedStoreId().catch(() => undefined);
      unsubscribe = SupabaseDashboardService.subscribeToUmkmRealtime(
        storeId || undefined as any,
        () => loadDatabaseData()
      );
    };
    init();
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
    const nextStatus = target.status === 'active' ? 'paused' : 'active';

    // Optimistic UI update
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, status: nextStatus } : emp));
    triggerToast(`ZeroClaw Swarm Node ${target.name} status updated to ${nextStatus.toUpperCase()}`);

    // Persist change to Supabase database
    await SupabaseDashboardService.updateUmkmAiEmployeeStatus(id, nextStatus);
    loadDatabaseData();
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
      avatar_path: emp.avatar_path || '/assets/logo/ai-agents.png',
      model_engine: emp.model_engine || '9Router-Auto-Cost-Optimizer'
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

  // Delete Agent from Supabase & Local state
  const handleDeleteAgent = async (employeeId: string) => {
    const target = employees.find(e => e.id === employeeId);
    const agentName = target ? target.name : formData.name || 'AI Employee';

    if (!window.confirm(`Are you sure you want to delete "${agentName}"? This action cannot be undone.`)) {
      return;
    }

    triggerToast(`Deleting agent ${agentName}...`);
    setActiveModal(null);

    // Optimistic local UI removal
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));

    // Supabase database deletion
    const res = await SupabaseDashboardService.deleteUmkmAiEmployee(employeeId);
    if (res?.error) {
      triggerToast(`Failed to delete agent: ${res.error}`);
    } else {
      triggerToast(`Agent "${agentName}" successfully deleted.`);
    }
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

    const selectedModelConfig = AI_MODEL_ENGINES.find(m => m.id === formData.model_engine) || AI_MODEL_ENGINES[0];
    const resolvedAvatar = (formData.avatar_path && !formData.avatar_path.includes('ai-avatar.png'))
      ? formData.avatar_path
      : selectedModelConfig.avatar;

    const payload = {
      name: formData.name,
      category: formData.category,
      desc: formData.desc || 'Custom enterprise AI employee.',
      status: formData.status || 'active',
      model_engine: formData.model_engine || '9Router-Auto-Cost-Optimizer',
      capabilities: capabilitiesArray.length > 0 ? capabilitiesArray : ['WhatsApp API', 'Supabase RAG', '9Router Engine'],
      avatar_path: resolvedAvatar
    };

    triggerToast(`Deploying ${formData.name} (${selectedModelConfig.name})...`);
    setActiveModal(null);

    const res = await SupabaseDashboardService.addUmkmAiEmployee(undefined as any, payload);
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

    const res = await SupabaseDashboardService.addUmkmAiEmployee(undefined as any, payload);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">{m.title}</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
            {m.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto mt-1 md:mt-0">
          <button
            onClick={handleManualRefresh}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shrink-0"
            title="Force Refresh Database"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-orange-500' : ''} />
          </button>

          <button
            onClick={() => setActiveModal('templates')}
            className="flex-1 sm:flex-none min-w-0 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2"
          >
            <Layers size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{m.templates}</span>
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
                avatar_path: '/assets/logo/ai-agents.png',
                model_engine: '9Router-Auto-Cost-Optimizer'
              });
              setActiveModal('deploy');
            }}
            className="flex-1 sm:flex-none min-w-0 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-2 shadow-xs cursor-pointer transition-all"
          >
            <Plus size={15} className="shrink-0" />
            <span className="truncate">{m.addEmployee}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* METRICS OVERVIEW: 5 HIGH-DENSITY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {[
          { label: m.totalEmployees, val: employees.length.toString(), change: 'Synced CDN', icon: Bot, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60' },
          { label: m.activeNow, val: employees.filter(e => e.status === 'active' || e.status === 'working').length.toString(), change: 'Swarm Live', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
          { label: m.tasksToday, val: (kpis.tasks_completed_today ?? 0).toString(), change: 'Live Telemetry', icon: Zap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
          { label: m.hoursSavedToday, val: `${kpis.hours_saved_weekly ?? 0} Hours`, change: 'Live Calculation', icon: Clock, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
          { label: m.costSavedToday, val: `Rp${(kpis.revenue_generated_today ?? 0).toLocaleString('id-ID')}`, change: 'Live Revenue', icon: DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
        ].map((mItem, i) => {
          const Icon = mItem.icon;
          const isLastCard = i === 4;
          return (
            <div
              key={i}
              className={`p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2 ${
                isLastCard ? 'col-span-2 sm:col-span-1 lg:col-span-1' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">{mItem.label}</span>
                <div className={`size-7 rounded-lg ${mItem.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} />
                </div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{mItem.val}</div>
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
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-none font-bold text-xs -mx-1 px-1">
          {[
            { label: `${m.filterAll} (${employees.length})`, key: 'Semua' },
            { label: `${m.filterActive} (${employees.filter(e => e.status === 'active').length})`, key: 'Aktif' },
            { label: `${m.filterAttention} (${employees.filter(e => e.status === 'warning').length})`, key: 'Perlu Perhatian' },
            { label: `${m.filterInactive} (${employees.filter(e => e.status === 'inactive').length})`, key: 'Tidak Aktif' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${filterTab === tab.key
                  ? 'bg-orange-500 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH & TOGGLE SWITCHER */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={m.searchPlaceholder}
              className="w-full pl-8 pr-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-orange-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-start">
            {/* DYNAMIC CATEGORY DROPDOWN */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 appearance-none cursor-pointer focus:outline-none focus:border-orange-500"
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

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
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

      </div>

      {/* ========================================================================= */}
      {/* GRID / LIST WORKFORCE DISPLAY */}
      {/* ========================================================================= */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="size-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto shadow-2xs">
            <Bot size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
              {m.noActiveEmployees || 'Belum Ada AI Employee Aktif'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {m.noActiveEmployeesDesc || 'Tidak ada data tenaga kerja AI di database untuk toko ini. Klik tombol Deploy AI Employee atau pilih dari Galeri Template untuk mulai menyebar agen otonom real-time.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveModal('templates')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Layers size={14} className="text-orange-500" />
              <span>{m.templates}</span>
            </button>
            <button
              onClick={() => setActiveModal('deploy')}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{m.addEmployee}</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
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
                      <div className="size-11 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <img
                          src={emp.avatar_path || '/assets/logo/ai-agents.png'}
                          alt={emp.name}
                          className="size-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.dataset.fallbackTried === 'true') return;
                            target.dataset.fallbackTried = 'true';
                            target.src = '/assets/logo/ai-agents.png';
                          }}
                        />
                      </div>
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
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer ${isActive
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
                      <LineChart data={emp.spark || zeroSparkData}>
                        <Line type="monotone" dataKey="v" stroke={isActive ? '#10b981' : '#94a3b8'} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ACTION BUTTON: CONFIGURE / EDIT AGENT */}
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
                  <div className="size-10 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <img
                      src={emp.avatar_path || '/assets/logo/ai-agents.png'}
                      alt={emp.name}
                      className="size-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('ai-agents.png')) {
                          target.src = '/assets/logo/ai-agents.png';
                        } else if (!target.src.includes('zegalogo.png')) {
                          target.src = '/assets/logo/zegalogo.png';
                        }
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{emp.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
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

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteAgent(formData.id)}
                  className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-bold cursor-pointer flex items-center gap-1.5 transition-all text-xs"
                >
                  <Trash2 size={14} /> Delete Agent
                </button>
                <div className="flex items-center gap-2">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
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
                <label className="block text-slate-500 font-bold mb-1">AI Model Engine & Architecture</label>
                {(() => {
                  const selectedModel = AI_MODEL_ENGINES.find(m => m.id === formData.model_engine) || AI_MODEL_ENGINES[0];

                  return (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/90 text-left flex items-center justify-between transition-all hover:border-orange-500/50 shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                            <img src={selectedModel.logo} alt={selectedModel.name} className="size-5 object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">{selectedModel.name}</span>
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-orange-500 text-white shrink-0">
                                {selectedModel.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{selectedModel.desc}</p>
                          </div>
                        </div>
                        <ChevronDown className={`size-4 text-slate-400 transition-transform duration-200 shrink-0 ${isModelDropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
                      </button>

                      {isModelDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 max-h-56 overflow-y-auto backdrop-blur-md">
                          {AI_MODEL_ENGINES.map((model) => {
                            const isSelected = formData.model_engine === model.id;
                            return (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    model_engine: model.id,
                                    avatar_path: model.avatar
                                  }));
                                  setIsModelDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-500/40 text-orange-700 dark:text-orange-300 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="size-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                  <img src={model.logo} alt={model.name} className="size-5 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">{model.name}</span>
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                      {model.badge}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{model.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
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
