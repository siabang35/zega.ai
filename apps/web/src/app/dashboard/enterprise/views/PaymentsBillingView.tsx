import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Sparkles, ArrowUpRight, ArrowDownRight, TrendingUp, 
  Layers, ChevronDown, CheckCircle2, DollarSign, Download, Plus, 
  ExternalLink, Calendar, ShieldCheck, Check, X, FileText, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';
import { getR2CdnUrl } from '../../../utils/cdn';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface PaymentsBillingViewProps {
  onTriggerToast?: (msg: string) => void;
  mode?: 'payments_billing' | 'cost_intelligence';
}

export function PaymentsBillingView({ onTriggerToast, mode = 'payments_billing' }: PaymentsBillingViewProps) {
  const isCostIntelligenceMode = mode === 'cost_intelligence';

  // Navigation Sub-Page Tabs matching screenshot: Overview, Invoices, Payment Methods, Billing History, Usage & Limits
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payment_methods' | 'billing_history' | 'usage_limits'>('overview');
  
  // Interactive Modals
  const [showAddCardModal, setShowAddCardModal] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Form State for Add Card
  const [newCardNumber, setNewCardNumber] = useState<string>('');
  const [newCardExpiry, setNewCardExpiry] = useState<string>('');
  const [newCardCvc, setNewCardCvc] = useState<string>('');
  const [newCardName, setNewCardName] = useState<string>('');

  // Real-time Database Telemetry State
  const [costData, setCostData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await enterpriseSupabaseService.getEnterpriseCostIntelligenceRealtime();
      setCostData(data);
    } catch (err) {
      console.error('Error loading payments & billing telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = enterpriseSupabaseService.subscribeToCostIntelligenceRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string) => {
    if (onTriggerToast) onTriggerToast(msg);
  };

  // KPIs matching screenshot
  const kpis = costData?.kpis || {
    current_balance: '$0.00',
    current_balance_status: 'No outstanding balance',
    monthly_spend: '$28,430.50',
    monthly_spend_trend: '+14.3%',
    yearly_spend: '$246,742.20',
    yearly_spend_trend: '+18.7%',
    next_invoice_date: 'May 28, 2025',
    next_invoice_status: 'Due in 5 days',
    primary_payment_method: 'Visa **** 4242',
    primary_payment_expiry: '03/28'
  };

  // Chart.js Data for Spending Breakdown Donut Chart
  const donutData = {
    labels: ['LLM & Inference', 'MCP Calls', 'Storage', 'Data Transfer', 'Other Services'],
    datasets: [
      {
        data: [12430.20, 6210.10, 4320.60, 2110.30, 3359.30],
        backgroundColor: ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B'],
        borderWidth: 3,
        borderColor: '#FFFFFF',
        hoverOffset: 6
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: $${ctx.parsed.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${((ctx.parsed / 28430.50) * 100).toFixed(1)}%)`
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {isCostIntelligenceMode ? (
              <>
                <TrendingUp className="text-indigo-600 dark:text-indigo-400 size-6" />
                <span>Cost Intelligence & AI FinOps</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 ml-1">
                  Savings
                </span>
              </>
            ) : (
              <>
                <CreditCard className="text-indigo-600 dark:text-indigo-400 size-6" />
                <span>Payments & Bills</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 ml-1">
                  Enterprise
                </span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isCostIntelligenceMode
              ? 'Analyze AI model consumption, token cost efficiency, savings recommendations, and budget projections.'
              : 'Manage your subscription, payment methods, invoices, and billing history.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 font-normal">Current Plan</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Enterprise Scale</span>
          </div>

          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors active:scale-95"
          >
            <Sparkles size={14} />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* SUB-PAGE NAVIGATION TABS (Matching screenshot) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'invoices', label: 'Invoices' },
          { id: 'payment_methods', label: 'Payment Methods' },
          { id: 'billing_history', label: 'Billing History' },
          { id: 'usage_limits', label: 'Usage & Limits' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              triggerToast(`📌 Navigasi ke sub-halaman: ${tab.label}`);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-PAGE CONTENT BASED ON ACTIVE TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* TOP SUMMARY KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Current Balance</span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.current_balance}</span>
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">{kpis.current_balance_status}</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Monthly Spend (May)</span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.monthly_spend}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> {kpis.monthly_spend_trend}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">vs Apr</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Yearly Spend (2025)</span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.yearly_spend}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> {kpis.yearly_spend_trend}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">vs 2024</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Next Invoice</span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.next_invoice_date}</span>
              </div>
              <span className="text-[10px] text-amber-600 font-semibold block">{kpis.next_invoice_status}</span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Payment Method</span>
              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.primary_payment_method}</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Expires {kpis.primary_payment_expiry}</span>
            </div>
          </div>

          {/* MIDDLE GRID SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Panel 1: USAGE VS PLAN LIMITS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Usage vs Plan Limits
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">May 1 – May 31, 2025</span>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('usage_limits');
                    triggerToast('⚙️ Navigasi ke Konfigurasi Kuota & Ambang Batas');
                  }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Configure Limits</span>
                  <ExternalLink size={10} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* AI Requests */}
                <div onClick={() => { setActiveTab('usage_limits'); triggerToast('📊 AI Requests (12.7M / 50M)'); }} className="space-y-1 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">AI Requests</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">25.4%</span>
                      <span className="font-mono text-slate-400 font-medium">12.7M <span className="text-slate-500 font-bold">/ 50M</span></span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-[25.4%]" />
                  </div>
                </div>

                {/* Workflow Executions */}
                <div onClick={() => { setActiveTab('usage_limits'); triggerToast('⚡ Workflow Executions (634K / 2M)'); }} className="space-y-1 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">Workflow Executions</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">31.7%</span>
                      <span className="font-mono text-slate-400 font-medium">634K <span className="text-slate-500 font-bold">/ 2M</span></span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full w-[31.7%]" />
                  </div>
                </div>

                {/* Active AI Agents */}
                <div onClick={() => { setActiveTab('usage_limits'); triggerToast('🤖 Active AI Agents (128 / 250)'); }} className="space-y-1 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors">Active AI Agents</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">51.2%</span>
                      <span className="font-mono text-slate-400 font-medium">128 <span className="text-slate-500 font-bold">/ 250</span></span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full w-[51.2%]" />
                  </div>
                </div>

                {/* Storage */}
                <div onClick={() => { setActiveTab('usage_limits'); triggerToast('💾 Storage (2.34 TB / 5 TB)'); }} className="space-y-1 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">Storage</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">46.8%</span>
                      <span className="font-mono text-slate-400 font-medium">2.34 TB <span className="text-slate-500 font-bold">/ 5 TB</span></span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[46.8%]" />
                  </div>
                </div>

                {/* Vector Storage */}
                <div onClick={() => { setActiveTab('usage_limits'); triggerToast('⚡ Vector Storage (1.52 TB / 3 TB)'); }} className="space-y-1 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors">Vector Storage</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">50.6%</span>
                      <span className="font-mono text-slate-400 font-medium">1.52 TB <span className="text-slate-500 font-bold">/ 3 TB</span></span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-[50.6%]" />
                  </div>
                </div>

                {/* Data Transfer */}
                <div onClick={() => { setActiveTab('usage_limits'); triggerToast('🌐 Data Transfer (3.45 TB / 10 TB)'); }} className="space-y-1 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 transition-colors">Data Transfer</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">34.5%</span>
                      <span className="font-mono text-slate-400 font-medium">3.45 TB <span className="text-slate-500 font-bold">/ 10 TB</span></span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full w-[34.5%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: SPENDING BREAKDOWN */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                Spending Breakdown (May 2025)
              </h3>

              <div className="h-36 w-full flex items-center justify-center relative py-1">
                <Doughnut data={donutData} options={donutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">$28,430.50</span>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase">TOTAL SPEND</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-purple-500" /> LLM & Inference</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$12,430.20 <span className="text-slate-400 text-[10px] font-normal">(43.7%)</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-blue-500" /> MCP Calls</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$6,210.10 <span className="text-slate-400 text-[10px] font-normal">(21.8%)</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-cyan-500" /> Storage</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$4,320.60 <span className="text-slate-400 text-[10px] font-normal">(15.2%)</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-emerald-500" /> Data Transfer</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$2,110.30 <span className="text-slate-400 text-[10px] font-normal">(7.4%)</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-amber-500" /> Other Services</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$3,359.30 <span className="text-slate-400 text-[10px] font-normal">(11.8%)</span></span>
                </div>
              </div>
            </div>

            {/* Panel 3: TOP COST DRIVERS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                Top Cost Drivers
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'GPT-4o (OpenAI)', vol: '5.2M requests', cost: '$9,432.10', logo: getR2CdnUrl('/assets/logo/gpt.webp') },
                  { name: 'Claude 3.5', vol: '4.2M requests', cost: '$3,210.80', logo: getR2CdnUrl('/assets/logo/claude.webp') },
                  { name: 'Vector Search', vol: '15.2M queries', cost: '$4,120.50', logo: getR2CdnUrl('/assets/logo/ai-agents.png') },
                  { name: 'Supabase DB', vol: '2.24 TB storage', cost: '$3,230.90', logo: getR2CdnUrl('/assets/logo/supabase.png') },
                  { name: 'Stripe MCP', vol: '1.0M calls', cost: '$2,110.30', logo: getR2CdnUrl('/assets/visualization/stripe.webp') }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <img src={item.logo} alt={item.name} className="size-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{item.vol}</p>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM GRID SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: RECENT INVOICES */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recent Invoices</h3>
                <button onClick={() => setActiveTab('invoices')} className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  View all invoices
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Invoice ID</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Paid Date</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {[
                      { id: 'INV-2025-00056', period: 'May 1 – May 31, 2025', status: 'Unpaid', amount: '$28,430.50', due: 'May 28, 2025', paid: '-' },
                      { id: 'INV-2025-00055', period: 'Apr 1 – Apr 30, 2025', status: 'Paid', amount: '$24,892.10', due: 'Apr 28, 2025', paid: 'Apr 25, 2025' },
                      { id: 'INV-2025-00054', period: 'Mar 1 – Mar 31, 2025', status: 'Paid', amount: '$21,345.80', due: 'Mar 28, 2025', paid: 'Mar 25, 2025' },
                      { id: 'INV-2025-00053', period: 'Feb 1 – Feb 28, 2025', status: 'Paid', amount: '$18,892.30', due: 'Feb 28, 2025', paid: 'Feb 25, 2025' }
                    ].map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{inv.id}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{inv.period}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                            inv.status === 'Unpaid' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>{inv.status}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-extrabold text-slate-900 dark:text-slate-100">{inv.amount}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{inv.due}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{inv.paid}</td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => { setSelectedInvoice(inv); triggerToast(`📄 Detail: ${inv.id}`); }} className="text-indigo-600 hover:underline font-bold text-xs cursor-pointer">
                            {inv.status === 'Unpaid' ? 'View' : 'Download'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: PAYMENT METHODS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  Payment Methods
                </h3>
                <div className="space-y-2.5 pt-3">
                  <div className="p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={18} className="text-indigo-600" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">Visa **** 4242</span>
                        <span className="text-[10px] text-slate-400">Expires 03/28</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[9px]">Primary</span>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={18} className="text-slate-400" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">Mastercard **** 8888</span>
                        <span className="text-[10px] text-slate-400">Expires 11/27</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setShowAddCardModal(true)} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-indigo-600 cursor-pointer flex items-center justify-center gap-1.5">
                    <Plus size={14} />
                    <span>Add Payment Method</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Billing Details</h4>
                <p className="font-bold text-slate-800 dark:text-slate-200">PT Zenith Enterprise</p>
                <p className="text-[10px] text-slate-400 font-mono">NPWP: 12.345.678.9-012.000</p>
                <p className="text-[10px] text-slate-400">billing@zenith.co.id</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Enterprise Invoices & Billing Documents</h3>
              <p className="text-xs text-slate-500">View, search, and download tax invoices, monthly billing statements, and VAT receipts.</p>
            </div>
            <button onClick={() => triggerToast('📥 Batch invoice export diproses')} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer">
              <Download size={14} /><span>Export All Invoices (ZIP)</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Invoice Number</th><th className="py-2.5 px-3">Billing Period</th><th className="py-2.5 px-3">Status</th><th className="py-2.5 px-3">Amount</th><th className="py-2.5 px-3">Due Date</th><th className="py-2.5 px-3">Payment Date</th><th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {[
                  { id: 'INV-2025-00056', period: 'May 1 – May 31, 2025', status: 'Unpaid', amount: '$28,430.50', due: 'May 28, 2025', paid: '-' },
                  { id: 'INV-2025-00055', period: 'Apr 1 – Apr 30, 2025', status: 'Paid', amount: '$24,892.10', due: 'Apr 28, 2025', paid: 'Apr 25, 2025' },
                  { id: 'INV-2025-00054', period: 'Mar 1 – Mar 31, 2025', status: 'Paid', amount: '$21,345.80', due: 'Mar 28, 2025', paid: 'Mar 25, 2025' },
                  { id: 'INV-2025-00053', period: 'Feb 1 – Feb 28, 2025', status: 'Paid', amount: '$18,892.30', due: 'Feb 28, 2025', paid: 'Feb 25, 2025' },
                  { id: 'INV-2025-00052', period: 'Jan 1 – Jan 31, 2025', status: 'Paid', amount: '$17,450.00', due: 'Jan 28, 2025', paid: 'Jan 24, 2025' }
                ].map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{inv.id}</td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{inv.period}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-md font-bold text-[9.5px] ${
                        inv.status === 'Unpaid' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900 dark:text-slate-100">{inv.amount}</td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px]">{inv.due}</td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px]">{inv.paid}</td>
                    <td className="py-3.5 px-3 text-right">
                      <button onClick={() => { setSelectedInvoice(inv); triggerToast(`📄 Detail tagihan ${inv.id} dibuka`); }} className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 cursor-pointer">
                        {inv.status === 'Unpaid' ? 'Pay Now' : 'Download PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PAGE: PAYMENT METHODS */}
      {activeTab === 'payment_methods' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Payment Methods & Auto-Billing</h3>
              <p className="text-xs text-slate-500">Manage corporate credit cards, auto-renewal preferences, and billing contact details.</p>
            </div>
            <button onClick={() => setShowAddCardModal(true)} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
              <Plus size={14} /><span>Add Payment Method</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-indigo-600" size={20} />
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Visa **** 4242</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[9.5px]">Primary Card</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Expires 03/2028 &bull; Cardholder: Cole Coa</p>
              <div className="flex items-center gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">Auto-pay Active</span>
                <span className="text-[10px] text-slate-400 font-mono">Last charged $24,892.10</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-slate-400" size={20} />
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Mastercard **** 8888</span>
                </div>
                <button onClick={() => triggerToast('⭐ Kartu Mastercard dijadikan kartu utama')} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Set Primary</button>
              </div>
              <p className="text-xs text-slate-500 font-medium">Expires 11/2027 &bull; Cardholder: PT Zenith Admin</p>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button onClick={() => triggerToast('🗑️ Kartu berhasil dihapus')} className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer">Remove Card</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE: BILLING HISTORY */}
      {activeTab === 'billing_history' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Enterprise Billing History</h3>
            <p className="text-xs text-slate-500">Audit trail of all previous transactions, automatic subscription renewals, and ledger settlements.</p>
          </div>
          <div className="space-y-3 text-xs">
            {[
              { tx: 'TX-9901241', date: 'Apr 25, 2025 09:12 WIB', desc: 'Enterprise Scale Monthly Subscription', amount: '$24,892.10', method: 'Visa **** 4242', status: 'Success' },
              { tx: 'TX-9900812', date: 'Mar 25, 2025 09:10 WIB', desc: 'Enterprise Scale Monthly Subscription', amount: '$21,345.80', method: 'Visa **** 4242', status: 'Success' },
              { tx: 'TX-9899120', date: 'Feb 25, 2025 09:08 WIB', desc: 'Enterprise Scale Monthly Subscription', amount: '$18,892.30', method: 'Visa **** 4242', status: 'Success' }
            ].map((row, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">{row.tx}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{row.desc}</span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-mono block mt-0.5">{row.date} &bull; {row.method}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">{row.amount}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9.5px] font-bold">{row.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-PAGE: USAGE & LIMITS */}
      {activeTab === 'usage_limits' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 shadow-2xs">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Plan Quota & Resource Usage Limits</h3>
            <p className="text-xs text-slate-500">Monitor active capacity usage, set auto-scaling thresholds, and manage alert notifications.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { metric: 'AI Requests', current: '12.7M', limit: '50M', pct: 25.4, color: 'bg-indigo-600' },
              { metric: 'Workflow Executions', current: '634K', limit: '2M', pct: 31.7, color: 'bg-blue-600' },
              { metric: 'Active AI Agents', current: '128', limit: '250', pct: 51.2, color: 'bg-purple-600' },
              { metric: 'Storage', current: '2.34 TB', limit: '5 TB', pct: 46.8, color: 'bg-emerald-500' },
              { metric: 'Vector Storage', current: '1.52 TB', limit: '3 TB', pct: 50.6, color: 'bg-amber-500' },
              { metric: 'Data Transfer & CDN', current: '3.45 TB', limit: '10 TB', pct: 34.5, color: 'bg-cyan-500' }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{item.metric}</span>
                  <span className="font-mono text-slate-400 font-semibold">{item.current} / <span className="text-slate-700 dark:text-slate-200 font-bold">{item.limit}</span> ({item.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD PAYMENT METHOD */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); setShowAddCardModal(false); triggerToast('💳 Metode pembayaran baru berhasil ditambahkan!'); }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Credit / Debit Card</h3>
              <button type="button" onClick={() => setShowAddCardModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cardholder Name</label>
                <input type="text" placeholder="e.g. Cole Coa" value={newCardName} onChange={(e) => setNewCardName(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Card Number</label>
                <input type="text" placeholder="4242 •••• •••• 4242" value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Expiry (MM/YY)</label>
                  <input type="text" placeholder="12/28" value={newCardExpiry} onChange={(e) => setNewCardExpiry(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">CVC / CVV</label>
                  <input type="text" placeholder="123" value={newCardCvc} onChange={(e) => setNewCardCvc(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowAddCardModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">Save Card</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: UPGRADE PLAN */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Enterprise Plan Management</h3>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30">
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] tracking-wider block">CURRENT ACTIVE PLAN</span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Enterprise Scale ($28,430/mo)</h4>
                <p className="text-slate-500 mt-1">Unlimited AI Agent swarm instances, 50M inference tokens, dedicated GPU cluster access & 99.99% SLA.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowUpgradeModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
