import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Scale, TrendingUp, ChevronDown, Sparkles, X, ArrowRight, QrCode, ExternalLink,
  Calendar, Filter, CheckCircle2, ArrowUpRight, ArrowDownRight, Wallet, Receipt, CreditCard,
  PieChart, RefreshCw, FileText, Plus, ShieldCheck, ChevronRight, Copy, Check, Bot, Settings
} from 'lucide-react';
import { ZeroClawTerminalView } from '../../enterprise/views/ZeroClawTerminalView';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { PrivyWalletService } from '../../../services/privyWalletService';
import { useLanguage } from '../../../../i18n/translations';
import { 
  CreateInvoiceModal, RecordExpenseModal, ReconciliationModal, 
  TaxSettingsModal, AllTransactionsModal, DateFilterModal, FilterModal,
  DeployFinanceSwarmModal, FinancialReportModal, ManageFinanceSwarmModal, ConfigureFinanceModelModal
} from './finance/FinanceModals';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
);

interface FinanceViewProps {
  triggerToast?: (msg: string) => void;
  isGuest?: boolean;
  userEmail?: string;
  userName?: string;
}

export function FinanceView({ triggerToast, isGuest, userEmail, userName }: FinanceViewProps) {
  const getInitialTab = (): 'overview' | 'zeroclaw' => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = (params.get('tab') || params.get('subtab') || params.get('view') || '').toLowerCase();
      if (tabParam === 'zeroclaw' || tabParam === 'terminal' || tabParam === 'solana') {
        return 'zeroclaw';
      }
      const hash = window.location.hash.toLowerCase();
      if (hash === '#zeroclaw' || hash === '#terminal' || hash === '#solana') {
        return 'zeroclaw';
      }
    }
    return 'overview';
  };

  const [activeFinanceTab, setActiveFinanceTab] = useState<'overview' | 'zeroclaw'>(getInitialTab);

  const handleTabChange = (tab: 'overview' | 'zeroclaw') => {
    setActiveFinanceTab(tab);
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      if (tab === 'zeroclaw') {
        url.searchParams.set('tab', 'zeroclaw');
      } else {
        url.searchParams.set('tab', 'overview');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = (params.get('tab') || params.get('subtab') || params.get('view') || '').toLowerCase();
        if (tabParam === 'zeroclaw' || tabParam === 'terminal' || tabParam === 'solana') {
          setActiveFinanceTab('zeroclaw');
        } else if (tabParam === 'overview' || !tabParam) {
          setActiveFinanceTab('overview');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [currencyMode, setCurrencyMode] = useState<'USDC' | 'IDR'>('USDC');
  const [periodLabel, setPeriodLabel] = useState('1 Jul - 31 Jul 2026');
  const [cashflowTab, setCashflowTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isAllTxModalOpen, setIsAllTxModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isManageSwarmModalOpen, setIsManageSwarmModalOpen] = useState(false);
  const [isConfigureModelModalOpen, setIsConfigureModelModalOpen] = useState(false);

  const [copiedWallet, setCopiedWallet] = useState(false);

  // Realtime Finance Data
  const [financeData, setFinanceData] = useState<any>({
    metrics: {
      total_revenue: 2450.00,
      total_expense: 680.00,
      net_profit: 1770.00,
      profit_margin: 72.20,
      cash_balance_usdc: 1950.00,
      cash_balance_idr: 31512000.00,
      revenue_growth: 18.00,
      expense_growth: -8.00,
      profit_growth: 32.00,
      margin_growth: 6.50,
      period_label: '1 Jul - 31 Jul 2026'
    },
    cashflow: [
      { date_label: '1 Jul', income: 350.00, expense: 120.00, balance: 230.00 },
      { date_label: '6 Jul', income: 620.00, expense: 180.00, balance: 440.00 },
      { date_label: '11 Jul', income: 500.00, expense: 150.00, balance: 350.00 },
      { date_label: '16 Jul', income: 1020.00, expense: 420.00, balance: 600.00 },
      { date_label: '21 Jul', income: 780.00, expense: 210.00, balance: 570.00 },
      { date_label: '26 Jul', income: 910.00, expense: 310.00, balance: 600.00 },
      { date_label: '31 Jul', income: 820.00, expense: 250.00, balance: 570.00 }
    ],
    expenses: [
      { category_name: 'Kasir Operasional', percentage: 45.00, amount_usdc: 306.00, color_hex: '#3b82f6' },
      { category_name: 'Gas & RPC Fee', percentage: 25.00, amount_usdc: 170.00, color_hex: '#f97316' },
      { category_name: 'SOP Audit Reserve', percentage: 15.00, amount_usdc: 102.00, color_hex: '#a855f7' },
      { category_name: 'Pengiriman', percentage: 10.00, amount_usdc: 68.00, color_hex: '#06b6d4' },
      { category_name: 'Lainnya', percentage: 5.00, amount_usdc: 34.00, color_hex: '#64748b' }
    ],
    solanaTx: [],
    invoices: [
      { invoice_code: 'INV-2026-0722', customer_name: 'Siti Aisyah', due_status: 'Jatuh tempo hari ini', amount_usdc: 25.00 },
      { invoice_code: 'INV-2026-0720', customer_name: 'Budi Santoso', due_status: '2 hari lagi', amount_usdc: 18.50 },
      { invoice_code: 'INV-2026-0718', customer_name: 'Dewi Lestari', due_status: '4 hari lagi', amount_usdc: 42.00 }
    ]
  });

  const [zeroClawLiveTx, setZeroClawLiveTx] = useState<any[]>([]);
  const [gatewayActive, setGatewayActive] = useState<boolean>(true);

  // Poll Authentic ZeroClaw Terminal Solana Devnet RPC Data
  useEffect(() => {
    let isMounted = true;
    const fetchZeroClawRealtime = async () => {
      try {
        const [statusRes, rpcRes] = await Promise.allSettled([
          fetch('/v1/zeroclaw/status').then(r => r.json()),
          fetch('/v1/zeroclaw/solana-rpc').then(r => r.json())
        ]);

        if (isMounted && statusRes.status === 'fulfilled' && statusRes.value?.success) {
          setGatewayActive(true);
        }

        if (isMounted && rpcRes.status === 'fulfilled' && rpcRes.value?.success && Array.isArray(rpcRes.value.signatures)) {
          const sigs = rpcRes.value.signatures.slice(0, 10);
          if (sigs.length > 0) {
            const mapped = sigs.map((s: any, idx: number) => {
              const fullSig = s.signature || s.tx_signature || '';
              const shortSig = fullSig.length >= 10 
                ? `TX#${fullSig.substring(0, 4)}...${fullSig.substring(fullSig.length - 4)}` 
                : `TX#Devnet_${idx + 1}`;
              
              const parsedAmt = typeof s.amountUsdc === 'number' ? s.amountUsdc : (typeof s.amount === 'number' ? s.amount : 15.00);
              const memoText = s.memo || (s.err ? 'Failed Tx' : 'ZeroClaw Solana Pay Settlement');
              const confStatus = s.confirmationStatus === 'finalized' || s.confirmationStatus === 'confirmed' || !s.err ? 'Sukses' : 'Pending';

              // Calculate time ago from blockTime or current time
              let timeLabel = `${(idx + 1) * 3} menit lalu`;
              if (s.blockTime) {
                const diffSec = Math.max(1, Math.floor(Date.now() / 1000 - s.blockTime));
                if (diffSec < 60) timeLabel = `${diffSec} detik lalu`;
                else if (diffSec < 3600) timeLabel = `${Math.floor(diffSec / 60)} menit lalu`;
                else timeLabel = `${Math.floor(diffSec / 3600)} jam lalu`;
              }

              return {
                tx_hash: shortSig,
                full_signature: fullSig,
                customer_name: s.customerName || memoText,
                amount_usdc: parsedAmt,
                status: confStatus,
                time_ago: timeLabel,
                slot: s.slot ? `Slot ${s.slot}` : 'Devnet'
              };
            });
            setZeroClawLiveTx(mapped);
          } else {
            setZeroClawLiveTx([]);
          }
        }
      } catch (err) {
        console.warn('ZeroClaw live RPC polling note:', err);
      }
    };

    fetchZeroClawRealtime();
    const interval = setInterval(fetchZeroClawRealtime, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const fetchFinanceData = async () => {
    const data = await SupabaseDashboardService.getUmkmFinanceOverview();
    if (data && data.metrics) {
      setFinanceData(data);
    }
  };

  useEffect(() => {
    fetchFinanceData();
    const unsubscribe = SupabaseDashboardService.subscribeToFinanceRealtime('11111111-1111-1111-1111-111111111111', () => {
      fetchFinanceData();
    });
    return () => unsubscribe();
  }, []);

  const activeMerchantWallet = PrivyWalletService.getEmbeddedSolanaWallet(userEmail || '').address;
  const shortMerchantWallet = activeMerchantWallet ? `${activeMerchantWallet.substring(0, 6)}...${activeMerchantWallet.substring(activeMerchantWallet.length - 6)}` : 'CikBeriuk...XYZ123';

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(activeMerchantWallet || 'CikBeriuk...XYZ123');
    setCopiedWallet(true);
    if (triggerToast) triggerToast(`Wallet address (${shortMerchantWallet}) copied to clipboard!`);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleAddInvoice = async (inv: any) => {
    await SupabaseDashboardService.createFinanceInvoice('11111111-1111-1111-1111-111111111111', inv);
    fetchFinanceData();
  };

  const handleAddExpense = async (exp: any) => {
    await SupabaseDashboardService.createFinanceExpense('11111111-1111-1111-1111-111111111111', exp);
    fetchFinanceData();
  };

  const handleDeploySwarm = async (swarm: any) => {
    await SupabaseDashboardService.deployFinanceAiSwarm('11111111-1111-1111-1111-111111111111', swarm);
    fetchFinanceData();
  };

  const handleExecuteInsight = async (insightId: string, actionLabel: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'applied' ? 'active' : 'applied';
    await SupabaseDashboardService.executeFinanceInsightAction(insightId, actionLabel, nextStatus);
    if (triggerToast) {
      triggerToast(nextStatus === 'applied' ? `Rekomendasi AI (${actionLabel}) berhasil diterapkan!` : `Status rekomendasi dikembalikan.`);
    }
    fetchFinanceData();
  };

  // Helper Money Formatter
  const formatMoney = (valUsdc: number) => {
    if (currencyMode === 'IDR') {
      const idr = valUsdc * 16160;
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(idr);
    }
    return `$${valUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
  };

  // 1. Cash Flow Multi-Line Chart (Income, Expense, Balance) Dynamic Timeframes
  const getDynamicCashflow = () => {
    if (cashflowTab === 'Weekly') {
      return {
        labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
        income: [2450, 3100, 2850, 3600],
        expense: [680, 890, 720, 950],
        balance: [1770, 2210, 2130, 2650]
      };
    }
    if (cashflowTab === 'Monthly') {
      return {
        labels: ['Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
        income: [7800, 8900, 9400, 11200, 12500, 14200],
        expense: [2400, 2700, 2900, 3100, 3400, 3800],
        balance: [5400, 6200, 6500, 8100, 9100, 10400]
      };
    }
    // Default Daily
    return {
      labels: financeData.cashflow?.length ? financeData.cashflow.map((c: any) => c.date_label) : ['1 Jul', '6 Jul', '11 Jul', '16 Jul', '21 Jul', '26 Jul', '31 Jul'],
      income: financeData.cashflow?.length ? financeData.cashflow.map((c: any) => c.income) : [350, 620, 500, 1020, 780, 910, 820],
      expense: financeData.cashflow?.length ? financeData.cashflow.map((c: any) => c.expense) : [120, 180, 150, 420, 210, 310, 250],
      balance: financeData.cashflow?.length ? financeData.cashflow.map((c: any) => c.balance) : [230, 440, 350, 600, 570, 600, 570]
    };
  };

  const currentCashflow = getDynamicCashflow();

  const cashFlowChartData = {
    labels: currentCashflow.labels,
    datasets: [
      {
        label: 'Income',
        data: currentCashflow.income,
        borderColor: '#10b981',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointHoverRadius: 7,
      },
      {
        label: 'Expense',
        data: currentCashflow.expense,
        borderColor: '#ef4444',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.18)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#ef4444',
        pointHoverRadius: 7,
      },
      {
        label: 'Balance',
        data: currentCashflow.balance,
        borderColor: '#3b82f6',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointHoverRadius: 7,
      },
    ],
  };

  const cashFlowChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11, weight: 'bold' },
        padding: 12,
        cornerRadius: 14,
        callbacks: {
          label: (item: any) => ` ${item.dataset.label}: ${formatMoney(item.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { 
          font: { size: 10, weight: 'bold' }, 
          color: '#94a3b8',
          callback: (val: any) => currencyMode === 'IDR' ? `Rp${(val/1000).toFixed(0)}k` : `$${val}`
        },
      },
    },
  };

  // 2. Expense Breakdown Doughnut Chart
  const expenseChartData = {
    labels: financeData.expenses.map((e: any) => e.category_name),
    datasets: [
      {
        data: financeData.expenses.map((e: any) => e.percentage),
        backgroundColor: financeData.expenses.map((e: any) => e.color_hex),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const expenseChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '76%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 12,
        callbacks: {
          label: (item: any) => ` ${item.label}: ${item.raw}%`,
        },
      },
    },
  };

  const m = financeData.metrics;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Finance & Solana Payment Terminal</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Kelola keuangan, arus kas, dan pembayaran Solana Pay bisnis Anda dengan AI.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Currency Toggle Switcher (USDC vs IDR) */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setCurrencyMode('USDC');
                if (triggerToast) triggerToast('Mata uang diubah ke USDC ($)');
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                currencyMode === 'USDC'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              USDC (Solana)
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrencyMode('IDR');
                if (triggerToast) triggerToast('Mata uang diubah ke IDR (Rp)');
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                currencyMode === 'IDR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              IDR (Rp)
            </button>
          </div>

          {/* View Tab Switcher (Finance Overview vs ZeroClaw Terminal) */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeFinanceTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Finance Overview
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('zeroclaw')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFinanceTab === 'zeroclaw'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="size-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Solana Terminal</span>
              <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.2 rounded-md font-mono">Live</span>
            </button>
          </div>

          {/* Controls: Date Picker, Filter & Deploy Swarm */}
          <button
            onClick={() => setIsDateModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Calendar size={14} className="text-slate-400" />
            <span>{periodLabel}</span>
          </button>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Filter size={14} className="text-slate-400" />
            <span>Filter</span>
          </button>

          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles size={14} />
            <span>+ Deploy AI Swarm</span>
          </button>
        </div>
      </div>

      {/* Switch between Overview and ZeroClaw Terminal */}
      {activeFinanceTab === 'zeroclaw' ? (
        <ZeroClawTerminalView onTriggerToast={triggerToast || (() => {})} isGuest={isGuest} userEmail={userEmail} userName={userName} />
      ) : (
        <>
        {/* 5 Metric Sparkline Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Revenue */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Total Revenue</span>
              <div className="size-7 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center">
                <DollarSign size={14} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                {formatMoney(m.total_revenue)}
              </div>
              <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <ArrowUpRight size={12} />
                <span>↑ {m.revenue_growth}% vs last month</span>
              </div>
            </div>
            {/* Green Sparkline SVG */}
            <div className="pt-2">
              <svg className="w-full h-7 stroke-emerald-500 fill-none" viewBox="0 0 100 25">
                <path d="M0 20 Q 25 5, 50 15 T 100 5" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Total Expense */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Total Expense</span>
              <div className="size-7 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center">
                <DollarSign size={14} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                {formatMoney(m.total_expense)}
              </div>
              <div className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-0.5">
                <ArrowDownRight size={12} />
                <span>↓ {Math.abs(m.expense_growth)}% vs last month</span>
              </div>
            </div>
            {/* Orange Sparkline SVG */}
            <div className="pt-2">
              <svg className="w-full h-7 stroke-orange-500 fill-none" viewBox="0 0 100 25">
                <path d="M0 10 Q 25 22, 50 10 T 100 18" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Net Profit */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Net Profit</span>
              <div className="size-7 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center">
                <Scale size={14} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                {formatMoney(m.net_profit)}
              </div>
              <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <ArrowUpRight size={12} />
                <span>↑ {m.profit_growth}% vs last month</span>
              </div>
            </div>
            {/* Purple Sparkline SVG */}
            <div className="pt-2">
              <svg className="w-full h-7 stroke-purple-500 fill-none" viewBox="0 0 100 25">
                <path d="M0 18 Q 25 15, 50 8 T 100 5" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Profit Margin */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Profit Margin</span>
              <div className="size-7 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center">
                <TrendingUp size={14} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                {m.profit_margin}%
              </div>
              <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <ArrowUpRight size={12} />
                <span>↑ {m.margin_growth}% vs last month</span>
              </div>
            </div>
            {/* Blue Sparkline SVG */}
            <div className="pt-2">
              <svg className="w-full h-7 stroke-blue-500 fill-none" viewBox="0 0 100 25">
                <path d="M0 15 Q 30 20, 60 10 T 100 8" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 5: Cash Balance (USDC) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Cash Balance (USDC)</span>
              <div className="size-7 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 flex items-center justify-center">
                <Wallet size={14} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                {formatMoney(m.cash_balance_usdc)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 truncate">
                ≈ Rp31.512.000
              </div>
              <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>▲ Live Solana Stream •</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Cash Flow, Expense Breakdown, & Ringkasan Bulanan */}
        <div className="grid lg:grid-cols-12 gap-5">
          {/* Cash Flow Line Chart (col-span-6) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Cash Flow (Real-time Settlement Stream)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </h3>
                <div className="flex items-center gap-4 text-[11px] font-bold pt-1">
                  <span className="text-emerald-600 flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Income</span>
                  <span className="text-red-500 flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Expense</span>
                  <span className="text-blue-500 flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Balance</span>
                </div>
              </div>

              {/* Time Horizon Selector */}
              <select
                value={cashflowTab}
                onChange={(e) => setCashflowTab(e.target.value as any)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div className="h-60">
              <Line data={cashFlowChartData} options={cashFlowChartOptions} />
            </div>
          </div>

          {/* Expense Breakdown Doughnut (col-span-4) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Expense Breakdown</h3>
            </div>

            <div className="h-44 relative flex items-center justify-center">
              <Doughnut data={expenseChartData} options={expenseChartOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-bold">Total</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {formatMoney(m.total_expense)}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">USDC</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-bold pt-1">
              {financeData.expenses.map((exp: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: exp.color_hex }} />
                    <span className="text-[11px]">{exp.category_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>{exp.percentage}%</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">${exp.amount_usdc.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 cursor-pointer pt-1"
            >
              <span>Lihat Detail Lengkap →</span>
            </button>
          </div>

          {/* Ringkasan Bulanan (col-span-2) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Ringkasan Bulanan</h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-bold">Best Performing Day</div>
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">22 Jul 2026</div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
                <span className="text-slate-500 font-medium">Total Transactions</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">128</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
                <span className="text-slate-500 font-medium">Total Customers</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">86</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
                <span className="text-slate-500 font-medium">Average Order Value</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">$28.64</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
                <span className="text-slate-500 font-medium">Repeat Customer Rate</span>
                <span className="font-extrabold text-emerald-600">42%</span>
              </div>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer shadow-xs text-center"
            >
              Lihat Laporan Keuangan →
            </button>
          </div>
        </div>

        {/* Lower-Middle Section: Solana Payment Terminal & Right Column */}
        <div className="grid lg:grid-cols-12 gap-5">
          {/* Solana Payment Terminal Section (col-span-8) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Solana Payment Terminal</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-4 items-center">
              {/* Left: QR Code Solana Pay */}
              <div className="md:col-span-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 text-center space-y-2 border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] font-black text-slate-500">QR Code Solana Pay</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 inline-block mx-auto shadow-xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=1&ecc=M&data=${encodeURIComponent(`solana:${activeMerchantWallet}?amount=25.00`)}`}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = 'true';
                        target.src = `https://quickchart.io/qr?size=250&text=${encodeURIComponent(`solana:${activeMerchantWallet}?amount=25.00`)}`;
                      }
                    }}
                    alt="Solana Pay QR Code"
                    className="size-28 mx-auto object-contain rounded-lg"
                  />
                </div>
                <div className="text-[10px] font-medium text-slate-400">Scan untuk menerima pembayaran</div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                  <span className="truncate text-slate-600 dark:text-slate-300">{shortMerchantWallet}</span>
                  <button onClick={handleCopyWallet} className="text-slate-400 hover:text-emerald-600 cursor-pointer">
                    {copiedWallet ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Middle: Transaksi Terbaru */}
              <div className="md:col-span-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  <span>Transaksi Terbaru</span>
                  <button onClick={() => setIsAllTxModalOpen(true)} className="text-[11px] text-emerald-600 hover:underline cursor-pointer">
                    Lihat Semua Transaksi →
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  {zeroClawLiveTx.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center space-y-2">
                      <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 grid place-items-center mx-auto">
                        <QrCode size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Belum Ada Transaksi Solana Pay Live</h4>
                        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                          Transaksi yang Anda terima di Terminal Solana Pay akan muncul di sini secara real-time via ZeroClaw RPC.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('zeroclaw')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      >
                        <QrCode size={12} />
                        <span>Buka Solana Terminal →</span>
                      </button>
                    </div>
                  ) : (
                    zeroClawLiveTx.map((tx: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between font-medium hover:border-emerald-500/50 transition-all">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">{tx.tx_hash}</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400">Solana Devnet</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">{tx.customer_name} • {tx.time_ago}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">${tx.amount_usdc.toFixed(2)}</div>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                            tx.status === 'Sukses' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Stats Hari Ini */}
              <div className="md:col-span-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3 border border-slate-100 dark:border-slate-700 text-center">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  <span>Stats Hari Ini</span>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {(() => {
                  const txList = zeroClawLiveTx;
                  const totalAmt = txList.reduce((acc: number, t: any) => acc + (t.amount_usdc || 0), 0);
                  const sukCount = txList.filter((t: any) => t.status === 'Sukses').length;
                  const pendCount = txList.length - sukCount;
                  const sukRatio = txList.length > 0 ? Math.round((sukCount / txList.length) * 100) : 100;

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-[9px] text-slate-400 font-bold">Total Payment</div>
                          <div className="text-sm font-black text-slate-900 dark:text-slate-100">${totalAmt.toFixed(2)}</div>
                          <div className="text-[9px] text-emerald-600 font-bold">↑ Live RPC</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-[9px] text-slate-400 font-bold">Total Tx</div>
                          <div className="text-sm font-black text-slate-900 dark:text-slate-100">{txList.length}</div>
                          <div className="text-[9px] text-emerald-600 font-bold">↑ Realtime</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-[9px] text-slate-400 font-bold">Sukses</div>
                          <div className="text-sm font-black text-emerald-600">{sukCount} <span className="text-[9px] font-normal text-slate-400">{sukRatio}%</span></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="text-[9px] text-slate-400 font-bold">Pending</div>
                          <div className="text-sm font-black text-amber-600">{pendCount} <span className="text-[9px] font-normal text-slate-400">{100 - sukRatio}%</span></div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <button
                  onClick={() => handleTabChange('zeroclaw')}
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-md transition-all"
                >
                  Buka Terminal →
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AI Finance Assistant & Jatuh Tempo Pembayaran (col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            {/* AI Finance Assistant Gradient Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white space-y-3 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-purple-300" />
                  <h3 className="font-extrabold text-xs tracking-wider uppercase">AI Finance Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    Active
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAccordionExpanded(!isAccordionExpanded)}
                    className="px-2.5 py-1 rounded-xl bg-purple-800/60 hover:bg-purple-700/60 text-purple-200 text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 border border-purple-400/30"
                  >
                    <span>{isAccordionExpanded ? 'Tutup' : 'Buka'}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isAccordionExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-purple-100 font-medium">
                ZeroClaw AI mendeteksi <span className="font-bold text-white">{financeData.insights?.length || 3} insight penting</span> untuk Anda:
              </p>

              <div className="space-y-2.5 text-xs max-h-80 overflow-y-auto pr-0.5">
                {(isAccordionExpanded ? (financeData.insights || []) : (financeData.insights || []).slice(0, 1)).map((ins: any, idx: number) => (
                  <div key={ins.id || idx} className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img src={ins.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg'} alt={ins.model_engine} className="size-6 rounded-lg object-cover bg-white/20 p-0.5" />
                        <div>
                          <div className="font-extrabold text-white leading-tight">{ins.title}</div>
                          <div className="text-[9px] text-purple-200 font-mono mt-0.5">{ins.model_provider || 'ZeroClaw AI'}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black shrink-0 ${
                        ins.impact_level === 'CRITICAL' ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40' :
                        ins.impact_level === 'HIGH IMPACT' ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40' :
                        'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                      }`}>
                        {ins.impact_level || 'RECOMMENDED'}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-purple-100/90 leading-relaxed">{ins.description}</p>

                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleExecuteInsight(ins.id, ins.action_label, ins.status)}
                        className={`w-full py-1.5 px-3 rounded-xl font-extrabold text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                          ins.status === 'applied'
                            ? 'bg-emerald-500 text-white shadow-emerald-900/30'
                            : 'bg-white/20 hover:bg-emerald-600 text-white hover:shadow-md'
                        }`}
                      >
                        {ins.status === 'applied' ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>✓ Telah Diterapkan</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            <span>{ins.action_label || 'Terapkan Rekomendasi'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                <button
                  onClick={() => setIsManageSwarmModalOpen(true)}
                  className="py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Bot size={14} />
                  <span>Kelola Swarm</span>
                </button>
                <button
                  onClick={() => setIsConfigureModelModalOpen(true)}
                  className="py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Settings size={14} />
                  <span>Konfigurasi</span>
                </button>
              </div>
            </div>

            {/* Jatuh Tempo Pembayaran Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Jatuh Tempo Pembayaran</h3>
                <button onClick={() => setIsInvoiceModalOpen(true)} className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer">
                  Lihat Semua →
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {financeData.invoices.map((inv: any, i: number) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">{inv.invoice_code}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{inv.customer_name}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9.5px] font-bold text-red-500 block">{inv.due_status}</span>
                      <span className="font-black text-slate-900 dark:text-slate-100">${inv.amount_usdc.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Quick Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-3 cursor-pointer shadow-xs text-left group"
          >
            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <FileText size={18} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Buat Invoice</div>
              <div className="text-[10px] text-slate-400 font-medium">Kirim invoice ke pelanggan</div>
            </div>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-3 cursor-pointer shadow-xs text-left group"
          >
            <div className="size-9 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Receipt size={18} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Catat Pengeluaran</div>
              <div className="text-[10px] text-slate-400 font-medium">Tambah pengeluaran bisnis</div>
            </div>
          </button>

          <button
            onClick={() => setIsReconModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-3 cursor-pointer shadow-xs text-left group"
          >
            <div className="size-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <RefreshCw size={18} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Rekonsiliasi</div>
              <div className="text-[10px] text-slate-400 font-medium">Cocokkan transaksi & bank</div>
            </div>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-3 cursor-pointer shadow-xs text-left group"
          >
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <PieChart size={18} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Laporan Keuangan</div>
              <div className="text-[10px] text-slate-400 font-medium">Lihat laporan lengkap</div>
            </div>
          </button>

          <button
            onClick={() => setIsTaxModalOpen(true)}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center gap-3 cursor-pointer shadow-xs text-left group"
          >
            <div className="size-9 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Pengaturan Pajak</div>
              <div className="text-[10px] text-slate-400 font-medium">Atur pajak & e-Faktur</div>
            </div>
          </button>
        </div>
        </>
      )}

      {/* Render Action Modals */}
      <CreateInvoiceModal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)} 
        onCreateInvoice={handleAddInvoice}
        triggerToast={triggerToast || (() => {})} 
      />
      <RecordExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onCreateExpense={handleAddExpense}
        triggerToast={triggerToast || (() => {})} 
      />
      <ReconciliationModal 
        isOpen={isReconModalOpen} 
        onClose={() => setIsReconModalOpen(false)} 
        triggerToast={triggerToast || (() => {})} 
      />
      <TaxSettingsModal 
        isOpen={isTaxModalOpen} 
        onClose={() => setIsTaxModalOpen(false)} 
        triggerToast={triggerToast || (() => {})} 
      />
      <AllTransactionsModal 
        isOpen={isAllTxModalOpen} 
        onClose={() => setIsAllTxModalOpen(false)} 
      />
      <DateFilterModal 
        isOpen={isDateModalOpen} 
        onClose={() => setIsDateModalOpen(false)} 
        onSelectRange={(range) => setPeriodLabel(range)}
        triggerToast={triggerToast || (() => {})} 
      />
      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        triggerToast={triggerToast || (() => {})} 
      />
      <DeployFinanceSwarmModal 
        isOpen={isDeployModalOpen} 
        onClose={() => setIsDeployModalOpen(false)} 
        onDeploy={handleDeploySwarm}
        triggerToast={triggerToast || (() => {})} 
      />
      <FinancialReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        financeData={financeData}
        triggerToast={triggerToast || (() => {})}
      />
      <ManageFinanceSwarmModal
        isOpen={isManageSwarmModalOpen}
        onClose={() => setIsManageSwarmModalOpen(false)}
        financeData={financeData}
        triggerToast={triggerToast || (() => {})}
      />
      <ConfigureFinanceModelModal
        isOpen={isConfigureModelModalOpen}
        onClose={() => setIsConfigureModelModalOpen(false)}
        triggerToast={triggerToast || (() => {})}
      />
    </div>
  );
}
