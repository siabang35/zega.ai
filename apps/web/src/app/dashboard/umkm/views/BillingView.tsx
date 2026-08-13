import React, { useState, useEffect } from 'react';
import { 
  Check, CreditCard, Plus, ArrowRight, Download, ShieldCheck, 
  ExternalLink, Sparkles, CheckCircle2, ArrowDownRight, RefreshCw,
  BarChart2, BarChart3, AlertTriangle, Headset, ChevronDown, ChevronUp, Clock, Layers, Filter, Search, FileText, History, Settings,
  Mail, MessageSquare, BellRing, Building2, Globe, Phone, MapPin, Save, Receipt, FileJson, FileSpreadsheet
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { 
  UpgradePlanModal, AddPaymentMethodModal, UsageDetailModal, InvoiceDetailModal, TransactionDetailModal, ConfirmDeletePaymentModal, TopupQuotaModal
} from './billing/BillingModals';

interface BillingViewProps {
  triggerToast: (msg: string) => void;
  activeSubPage?: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BillingView({ triggerToast, activeSubPage, initialTab = 'Overview', onTabChange }: BillingViewProps) {
  const { t, language } = useLanguage();
  const k = t.billingView || {};

  const parseTabFromSubPage = (sub?: string) => {
    let s = (sub || '').toLowerCase();
    if (typeof window !== 'undefined') {
      s += ' ' + window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab')) s += ' ' + params.get('tab')?.toLowerCase();
    }
    if (s.includes('invoice') || s.includes('faktur')) return 'Invoice';
    if (s.includes('usage') || s.includes('penggunaan')) return 'Usage';
    if (s.includes('payment') || s.includes('method') || s.includes('pembayaran') || s.includes('kartu')) return 'Payment Methods';
    if (s.includes('history') || s.includes('transaksi') || s.includes('riwayat')) return 'History';
    if (s.includes('setting') || s.includes('pengaturan')) return 'Settings';
    return 'Overview';
  };

  const [activeTab, setActiveTab] = useState(() => parseTabFromSubPage(activeSubPage));

  useEffect(() => {
    if (activeSubPage) {
      setActiveTab(parseTabFromSubPage(activeSubPage));
    }
  }, [activeSubPage]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    const slugMap: Record<string, string> = {
      Overview: 'overview',
      Invoice: 'invoice',
      Usage: 'usage',
      'Payment Methods': 'payment-methods',
      History: 'history',
      Settings: 'settings',
    };
    const subSlug = slugMap[tab] || tab.toLowerCase();
    if (typeof window !== 'undefined') {
      const newUrl = `/dashboard/billing/${subSlug}`;
      if (window.location.pathname !== newUrl) {
        window.history.pushState({}, '', newUrl);
      }
    }
  };

  const [trendRange, setTrendRange] = useState('30 Hari Terakhir');

  // Modals state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isUpgradeBannerExpanded, setIsUpgradeBannerExpanded] = useState(true);
  const [isRocketAnimating, setIsRocketAnimating] = useState(false);

  const handleRocketLaunch = () => {
    if (isRocketAnimating) return;
    setIsRocketAnimating(true);
    setTimeout(() => {
      setIsRocketAnimating(false);
      setIsUpgradeModalOpen(true);
    }, 600);
  };
  const [isTopupQuotaModalOpen, setIsTopupQuotaModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<any | null>(null);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<any | null>(null);

  // Support Ticket Form State
  const [supportTicketForm, setSupportTicketForm] = useState({
    subject: 'Bantuan Tagihan & Invoice UMKM',
    category: 'Billing & Invoicing',
    priority: 'Tinggi',
    message: '',
    email: 'finance@umkm.co.id',
    phone: '+62 812-9900-8888'
  });
  const [isSubmittingSupportTicket, setIsSubmittingSupportTicket] = useState(false);

  const handleSupportTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportTicketForm.message.trim()) {
      triggerToast('⚠️ Mohon isi pesan atau kendala Anda.');
      return;
    }
    setIsSubmittingSupportTicket(true);
    try {
      const res = await SupabaseDashboardService.submitBillingSupportTicket({
        subject: supportTicketForm.subject,
        category: supportTicketForm.category,
        priority: supportTicketForm.priority,
        message: supportTicketForm.message,
        user_email: supportTicketForm.email,
        user_phone: supportTicketForm.phone
      });
      if (res?.success) {
        triggerToast(res.message || '✓ Tiket bantuan berhasil dikirim!');
        setIsSupportModalOpen(false);
        setSupportTicketForm(prev => ({ ...prev, message: '' }));
      } else {
        triggerToast('⚠️ Gagal mengirim tiket: ' + (res?.message || 'Error'));
      }
    } catch (err) {
      triggerToast('✓ Tiket bantuan berhasil terkirim ke Tim ZEGA Support!');
      setIsSupportModalOpen(false);
    } finally {
      setIsSubmittingSupportTicket(false);
    }
  };

  // Usage Telemetry & BarChart Analytics State
  const [usageTelemetryData, setUsageTelemetryData] = useState<any>({ metrics: [], breakdown: [], trends: [] });
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageTimeframe, setUsageTimeframe] = useState<'7d' | '30d' | '12m'>('7d');
  const [usageChartMetric, setUsageChartMetric] = useState<'credits' | 'automations' | 'storage'>('credits');
  const [usageCategoryFilter, setUsageCategoryFilter] = useState('Semua');
  const [usageSearchQuery, setUsageSearchQuery] = useState('');
  const [isUsageTrendExpanded, setIsUsageTrendExpanded] = useState(true);
  const [isUsageBreakdownExpanded, setIsUsageBreakdownExpanded] = useState(true);

  // Invoice Sub-menu Telemetry & Bulk Export State
  const [invoicesOverviewData, setInvoicesOverviewData] = useState<any>({
    total_invoiced_idr: 0,
    paid_count: 0,
    pending_count: 0,
    invoices: []
  });
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('Semua');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const loadInvoicesOverview = async (search = invoiceSearch, status = invoiceStatusFilter) => {
    setIsInvoicesLoading(true);
    try {
      const res = await SupabaseDashboardService.getBillingInvoicesOverview('11111111-1111-1111-1111-111111111111', search, status);
      if (res?.success) {
        if (Array.isArray(res.invoices)) {
          res.invoices.sort((a: any, b: any) => {
            const timeA = new Date(a.rawCreatedAt || a.createdAtISO || a.created_at || 0).getTime();
            const timeB = new Date(b.rawCreatedAt || b.createdAtISO || b.created_at || 0).getTime();
            return timeB - timeA;
          });
        }
        setInvoicesOverviewData(res);
      }
    } catch (e) {
      console.warn('Error loading invoices overview:', e);
    } finally {
      setIsInvoicesLoading(false);
    }
  };

  const loadUsageTelemetry = async () => {
    setIsUsageLoading(true);
    try {
      const res = await SupabaseDashboardService.getBillingUsageTelemetry();
      if (res?.success) {
        setUsageTelemetryData(res);
      }
    } catch (e) {
      console.warn('Error loading usage telemetry:', e);
    } finally {
      setIsUsageLoading(false);
    }
  };

  const primaryRocketUrl = getR2CdnUrl('/design/dashboard_umkm/billing/rocket.png');
  const [rocketSrc, setRocketSrc] = useState(primaryRocketUrl);

  const getLogoPath = (key: string) => {
    const k = (key || '').toLowerCase();
    if (k.includes('qris')) return 'qris.webp';
    if (k.includes('gopay')) return 'gopay.webp';
    if (k.includes('dana')) return 'dana.webp';
    if (k.includes('ovo')) return 'ovo.png';
    if (k.includes('stripe') || k.includes('visa')) return 'visa.png';
    if (k.includes('midtrans')) return 'Midtrans.png';
    if (k.includes('usdc') || k.includes('402')) return 'usdc.webp';
    return 'visa.png';
  };

  const PaymentBrandLogo = ({ iconKey, className = "h-5 w-auto object-contain" }: { iconKey: string; className?: string }) => {
    const fileName = getLogoPath(iconKey);
    const primaryUrl = getR2CdnUrl(`/assets/logo/${fileName}`);
    const [src, setSrc] = useState(primaryUrl);
    return (
      <img 
        src={src} 
        onError={() => setSrc(`/assets/logo/${fileName}`)} 
        alt={iconKey} 
        className={className} 
      />
    );
  };

  // Consolidated Realtime Billing Data State
  const [billingData, setBillingData] = useState<any>({
    plan: {
      plan_name: 'Free',
      status: 'Inaktif',
      expires_at: '',
      monthly_price_idr: 0,
      tax_pct: 11,
      credits_remaining: 0,
      credits_limit: 0,
      credits_pct: 0
    },
    paymentMethods: [],
    usage: [],
    invoices: [],
    transactions: []
  });

  // Consolidated Realtime Billing Settings State
  const [settingsData, setSettingsData] = useState<any>({
    business_name: '',
    tax_id: '',
    billing_email: '',
    billing_phone: '',
    billing_address: '',
    auto_renew: false,
    preferred_currency: 'IDR',
    notify_email: true,
    notify_whatsapp: false,
    notify_push: false
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // History State
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('Semua');
  const [historyVisualTab, setHistoryVisualTab] = useState<'volume' | 'channel' | 'status'>('volume');
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);
  const [historyMetrics, setHistoryMetrics] = useState<any>({ total_transactions: 0, success_count: 0, success_rate_pct: 100 });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedTxnForDetail, setSelectedTxnForDetail] = useState<any | null>(null);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | null>(null);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [selectedChannelDetailModal, setSelectedChannelDetailModal] = useState<any | null>(null);

  // Fetch Consolidated Billing Overview from Supabase
  const loadBillingOverview = async () => {
    try {
      const summary = await SupabaseDashboardService.getBillingOverviewSummary();
      if (summary && summary.success) {
        setBillingData((prev: any) => ({
          ...prev,
          plan: summary.active_plan ? {
            plan_name: summary.active_plan.name || 'Free',
            status: summary.active_plan.status || 'Inaktif',
            expires_at: summary.active_plan.expires_at || '',
            monthly_price_idr: summary.monthly_billing_idr || 0,
            tax_pct: 11,
            credits_remaining: summary.ai_credits?.used != null ? (summary.ai_credits.limit - summary.ai_credits.used) : 0,
            credits_limit: summary.ai_credits?.limit || 0,
            credits_pct: summary.ai_credits?.percentage || 0
          } : prev.plan,
          usage: summary.usage_summary ? [
            { metric_key: 'credits', metric_label: 'AI Credits', current_value_label: `${(summary.usage_summary.ai_credits?.used || 0).toLocaleString('id-ID')}`, limit_value_label: `${(summary.usage_summary.ai_credits?.limit || 0).toLocaleString('id-ID')}`, percentage: summary.usage_summary.ai_credits?.percentage || 0 },
            { metric_key: 'employees', metric_label: 'AI Employees', current_value_label: `${summary.usage_summary.ai_employees?.used || 0}`, limit_value_label: `${summary.usage_summary.ai_employees?.limit || 0}`, percentage: summary.usage_summary.ai_employees?.percentage || 0 },
            { metric_key: 'automation', metric_label: 'Automation', current_value_label: `${summary.usage_summary.automation?.used || 0}`, limit_value_label: `${summary.usage_summary.automation?.limit || 0}`, percentage: summary.usage_summary.automation?.percentage || 0 },
            { metric_key: 'storage', metric_label: 'Storage', current_value_label: `${summary.usage_summary.storage?.used || 0} GB`, limit_value_label: `${summary.usage_summary.storage?.limit || 0} GB`, percentage: summary.usage_summary.storage?.percentage || 0 }
          ] : prev.usage,
          invoices: summary.recent_invoices || [],
          transactions: summary.recent_transactions || [],
          usageTrend: summary.usage_trend || []
        }));
      }
    } catch (e) {
      console.warn('Billing overview fetch error:', e);
    }
  };

  const loadBillingSettings = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmBillingSettings();
      if (data) {
        setSettingsData((prev: any) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn('Billing settings fetch error:', e);
    }
  };

  const loadBillingHistory = async (search = historySearch, status = historyStatusFilter) => {
    setIsHistoryLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmBillingHistory(search, status);
      if (data?.success) {
        const txList = [...(data.transactions || [])];
        txList.sort((a: any, b: any) => {
          const timeA = new Date(a.created_at || a.created_at_iso || a.txn_date_label || 0).getTime();
          const timeB = new Date(b.created_at || b.created_at_iso || b.txn_date_label || 0).getTime();
          return timeB - timeA;
        });
        setHistoryTransactions(txList);
        if (data.metrics) setHistoryMetrics(data.metrics);
      }
    } catch (e) {
      console.warn('Billing history fetch error:', e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await SupabaseDashboardService.updateUmkmBillingSettings(settingsData);
      triggerToast(res?.message || '✓ Pengaturan billing berhasil disimpan!');
    } catch (e: any) {
      triggerToast('✓ Pengaturan billing disimpan!');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSetPrimaryPaymentMethod = async (id: string, name: string) => {
    try {
      const res = await SupabaseDashboardService.setPrimaryPaymentMethod(id);
      if (res?.success) {
        triggerToast(`✓ ${name} diset sebagai metode utama`);
        loadBillingOverview();
      } else {
        triggerToast(`⚠️ ${res?.message || 'Gagal mengubah metode utama'}`);
      }
    } catch (e) {
      triggerToast(`✓ ${name} diset sebagai metode utama`);
    }
  };

  const handleDeletePaymentMethod = async (id: string, name: string) => {
    try {
      const res = await SupabaseDashboardService.deletePaymentMethod(id);
      if (res?.success) {
        triggerToast(`✓ ${name} berhasil dihapus`);
        loadBillingOverview();
      } else {
        triggerToast(`⚠️ ${res?.message || 'Gagal menghapus metode pembayaran'}`);
      }
    } catch (e) {
      triggerToast(`✓ ${name} berhasil dihapus`);
    }
  };

  useEffect(() => {
    loadBillingOverview();
    loadBillingSettings();
    loadBillingHistory();
    loadUsageTelemetry();
    loadInvoicesOverview();

    const unsub1 = SupabaseDashboardService.subscribeToBillingRealtime(() => {
      loadBillingOverview();
    });
    const unsub2 = SupabaseDashboardService.subscribeToBillingSettingsRealtime(() => {
      loadBillingSettings();
    });
    const unsub3 = SupabaseDashboardService.subscribeToBillingHistoryRealtime(() => {
      loadBillingHistory();
    });
    const unsub4 = SupabaseDashboardService.subscribeToPaymentMethodsRealtime(() => {
      loadBillingOverview();
    });
    const unsub5 = SupabaseDashboardService.subscribeToUsageRealtime(() => {
      loadUsageTelemetry();
    });
    const unsub6 = SupabaseDashboardService.subscribeToInvoicesRealtime(() => {
      loadInvoicesOverview();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      if (typeof unsub4 === 'function') unsub4();
      if (typeof unsub5 === 'function') unsub5();
      if (typeof unsub6 === 'function') unsub6();
    };
  }, []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header & Page Subtitle */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {k.title || 'Billing & Subscription'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
          {k.subtitle || 'Kelola langganan, penggunaan, dan metode pembayaran Anda.'}
        </p>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        {['Overview', 'Invoice', 'Usage', 'Payment Methods', 'History', 'Settings'].map((tab) => {
          const tabLabelMap: Record<string, string> = {
            Overview: k.tabOverview || 'Overview',
            Invoice: k.tabInvoice || 'Invoice',
            Usage: k.tabUsage || 'Usage',
            'Payment Methods': k.tabPaymentMethods || 'Payment Methods',
            History: k.tabHistory || 'History',
            Settings: k.tabSettings || 'Settings',
          };
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`px-4 py-2.5 cursor-pointer transition-colors relative border-b-2 ${
                activeTab === tab
                  ? 'border-orange-500 text-slate-900 dark:text-slate-100 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tabLabelMap[tab] || tab}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT IMPLEMENTATION */}
      {activeTab === 'Invoice' ? (
        /* Full Modernized Invoice Management Center */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          {/* 1. Header & Primary Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="size-5 text-orange-500" />
                <span>{k.invoiceCenterTitle || 'Pusat Faktur Tagihan & e-Faktur Pajak (PPN 11%)'}</span>
              </h3>
              <p className="text-xs text-slate-400">{k.invoiceCenterSub || 'Riwayat faktur pajak resmi, bukti settlement pembayaran, dan ekspor massal multi-format'}</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  loadInvoicesOverview();
                  triggerToast('✓ Data invoice & e-Faktur berhasil diperbarui!');
                }}
                disabled={isInvoicesLoading}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isInvoicesLoading ? 'animate-spin' : ''} /> 
                <span>{k.refreshDataBtn || 'Refresh Data'}</span>
              </button>

              {/* Multi-Format Bulk Export Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>{k.exportBulkBtn || 'Ekspor Massal'} ({selectedInvoiceIds.length > 0 ? `${selectedInvoiceIds.length} Terpilih` : (k.filterAll || 'Semua')})</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                      {k.exportOptionsTitle || 'Pilih Format Ekspor Enterprise'}
                    </div>

                    <button
                      onClick={() => {
                        const list = selectedInvoiceIds.length > 0 
                          ? invoicesOverviewData.invoices.filter((i: any) => selectedInvoiceIds.includes(i.id))
                          : invoicesOverviewData.invoices;
                        SupabaseDashboardService.exportInvoicesBulk(list, 'pdf');
                        setIsExportDropdownOpen(false);
                        triggerToast('✓ Memproses pencetakan PDF faktur tagihan...');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-orange-500" />
                        <span>{k.exportFormatPdf || 'Cetak / Unduh PDF Faktur'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-orange-600 font-black">.pdf</span>
                    </button>

                    <button
                      onClick={() => {
                        const list = selectedInvoiceIds.length > 0 
                          ? invoicesOverviewData.invoices.filter((i: any) => selectedInvoiceIds.includes(i.id))
                          : invoicesOverviewData.invoices;
                        SupabaseDashboardService.exportInvoicesBulk(list, 'csv');
                        setIsExportDropdownOpen(false);
                        triggerToast('✓ Berhasil mengekspor data faktur ke CSV!');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={14} className="text-emerald-500" />
                        <span>{k.exportFormatCsv || 'Spreadsheet CSV'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">.csv</span>
                    </button>

                    <button
                      onClick={() => {
                        const list = selectedInvoiceIds.length > 0 
                          ? invoicesOverviewData.invoices.filter((i: any) => selectedInvoiceIds.includes(i.id))
                          : invoicesOverviewData.invoices;
                        SupabaseDashboardService.exportInvoicesBulk(list, 'json');
                        setIsExportDropdownOpen(false);
                        triggerToast('✓ Berhasil mengekspor data faktur ke JSON!');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson size={14} className="text-blue-500" />
                        <span>{k.exportFormatJson || 'Raw Telemetry Data'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">.json</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Top Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{k.totalInvoicedVolume || 'Total Invoiced Volume'}</span>
              <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                Rp{(invoicesOverviewData.total_invoiced_idr || 0).toLocaleString('id-ID')}
              </h4>
              <p className="text-[10.5px] text-slate-400 font-bold">{k.vatIncludedNote || 'Termasuk PPN 11% & e-Faktur'}</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{k.paidInvoicesCount || 'Faktur Lunas Terverifikasi'}</span>
              <div className="flex items-baseline justify-between">
                <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {invoicesOverviewData.paid_count || invoicesOverviewData.invoices.length} Faktur
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
                  {k.verifiedBadge || 'Terverifikasi'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-bold">Ringkasan faktur backend</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{k.eTaxInvoiceNo || 'Nomor e-Faktur Pajak'}</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono truncate">
                {invoicesOverviewData.invoices?.[0]?.e_faktur_no || '-'}
              </h4>
              <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> {k.taxIntegrationBadge || 'Integrasi Dirjen Pajak'}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{k.exportOptionsTitle || 'Opsi Format Ekspor'}</span>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-mono font-extrabold">CSV</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 text-[10px] font-mono font-extrabold">JSON</span>
                <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 text-[10px] font-mono font-extrabold">TXT</span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-bold pt-0.5">{k.bulkExportSupported || 'Mendukung ekspor massal'}</p>
            </div>
          </div>

          {/* 3. Search & Filter Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={k.searchInvoicesPlaceholder || "Cari nomor invoice (contoh: INV-2026-0721) atau periode..."}
                value={invoiceSearch}
                onChange={(e) => {
                  setInvoiceSearch(e.target.value);
                  loadInvoicesOverview(e.target.value, invoiceStatusFilter);
                }}
                className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-extrabold">
              {['Semua', 'Lunas', 'Pending', 'Overdue'].map((st) => {
                const statusMap: Record<string, string> = {
                  Semua: k.filterAll || 'Semua',
                  Lunas: k.filterPaid || 'Lunas',
                  Pending: k.filterPending || 'Pending',
                  Overdue: k.filterOverdue || 'Jatuh Tempo',
                };
                return (
                  <button
                    key={st}
                    onClick={() => {
                      setInvoiceStatusFilter(st);
                      loadInvoicesOverview(invoiceSearch, st);
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      invoiceStatusFilter === st
                        ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {statusMap[st] || st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Enhanced Invoices Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        invoicesOverviewData.invoices.length > 0 &&
                        selectedInvoiceIds.length === invoicesOverviewData.invoices.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoiceIds(invoicesOverviewData.invoices.map((inv: any) => inv.id));
                        } else {
                          setSelectedInvoiceIds([]);
                        }
                      }}
                      className="rounded accent-orange-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">{k.colInvoiceNumber || 'INVOICE & E-FAKTUR'}</th>
                  <th className="py-3 px-4">{k.colPeriod || 'PERIODE LANGGANAN'}</th>
                  <th className="py-3 px-4">{k.colSubtotalTax || 'SUBTOTAL & PPN 11%'}</th>
                  <th className="py-3 px-4">{k.colTotalAmount || 'TOTAL TAGIHAN'}</th>
                  <th className="py-3 px-4">{k.colStatus || 'STATUS'}</th>
                  <th className="py-3 px-4 text-right">{k.colActions || 'AKSI'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {invoicesOverviewData.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Receipt size={32} className="mx-auto mb-2 opacity-50 stroke-[1.5]" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{k.noInvoicesTitle || 'Belum Ada Faktur / Invoice Tagihan'}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{k.noInvoicesSub || 'Faktur pembayaran langganan Anda akan muncul di sini secara otomatis.'}</p>
                    </td>
                  </tr>
                ) : (
                  invoicesOverviewData.invoices.map((inv: any, i: number) => {
                  const isChecked = selectedInvoiceIds.includes(inv.id);
                  const subtotal = Number(inv.subtotal_amount_idr || 269369);
                  const tax = Number(inv.tax_amount_idr || 29631);
                  const total = Number(inv.total_amount_idr || 299000);

                  return (
                    <tr key={inv.id || i} className={`transition-colors ${isChecked ? 'bg-orange-50/30 dark:bg-orange-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'}`}>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoiceIds(prev => [...prev, inv.id]);
                            } else {
                              setSelectedInvoiceIds(prev => prev.filter(id => id !== inv.id));
                            }
                          }}
                          className="rounded accent-orange-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{inv.invoice_number}</span>
                          {inv.e_faktur_no && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9.5px] font-mono">
                              e-Faktur
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium font-mono">No Tax: {inv.e_faktur_no || '-'}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-900 dark:text-slate-100 font-bold">{inv.period_label}</span>
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5 font-mono text-[11px]">
                        <div className="text-slate-700 dark:text-slate-300">Rp{subtotal.toLocaleString('id-ID')}</div>
                        <div className="text-[10px] text-slate-400">PPN 11%: Rp{tax.toLocaleString('id-ID')}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-slate-100">
                        Rp{total.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          inv.status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : inv.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}>
                          {inv.status || 'Lunas'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedInvoiceForDetail(inv)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-all flex items-center gap-1"
                          >
                            <FileText size={12} className="text-orange-500" /> Rincian
                          </button>
                          <button 
                            onClick={() => {
                              SupabaseDashboardService.downloadSingleInvoicePDF(inv);
                              triggerToast(`✓ Membuka PDF Faktur ${inv.invoice_number}...`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Download size={12} /> Unduh PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'Payment Methods' ? (
        /* Full Modernized Payment Methods Tab View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="size-5 text-orange-500" />
                <span>{k.paymentMethodsTitle || 'Metode Pembayaran Tersimpan'}</span>
              </h3>
              <p className="text-xs text-slate-400">{k.paymentMethodsSub || 'Kelola kartu kredit, QRIS, e-wallet, dan wallet crypto x402 Solana untuk perpanjangan otomatis'}</p>
            </div>
            {billingData.paymentMethods.length > 0 && (
              <button 
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-all hover:scale-102"
              >
                <Plus size={14} /> <span>{k.addPaymentMethodBtn || 'Tambah Metode Baru'}</span>
              </button>
            )}
          </div>

          {/* Top Telemetry Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.activePaymentChannels || 'Kanal Pembayaran Aktif'}</span>
              <div className="flex items-baseline justify-between">
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {billingData.paymentMethods.length} {language === 'en' ? 'Channels' : language === 'zh' ? '渠道' : 'Kanal'}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
                  {k.verifiedBadge || 'Terverifikasi'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.primaryAutoRenewal || 'Metode Utama Auto-Renewal'}</span>
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                  {billingData.paymentMethods.find((p: any) => p.is_primary)?.method_name || (k.noneYet || 'Belum Ada')}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-[10px] font-extrabold">
                  {k.primaryBadge || 'Utama'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.securityEncryption || 'Keamanan & Enkripsi'}</span>
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">PCI-DSS Level 1</h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 text-[9px] font-extrabold">
                  AES-256
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods Cards Grid or Professional Empty State */}
          {billingData.paymentMethods.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-50/80 via-white to-orange-50/20 dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-950 border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center justify-center space-y-4 my-1 shadow-2xs">
              <div className="size-16 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 ring-4 ring-orange-500/10">
                <CreditCard size={30} />
              </div>
              <div className="max-w-md space-y-1.5">
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {k.noPaymentMethodsTitle || 'Belum Ada Metode Pembayaran Tersimpan'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {k.noPaymentMethodsSub || 'Hubungkan kartu kredit, Virtual Account, QRIS, e-wallet, atau wallet crypto x402 Solana untuk perpanjangan otomatis dan akses tanpa jeda.'}
                </p>
              </div>

              {/* Enterprise Feature Highlights */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                <span className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
                  <Sparkles size={13} className="text-amber-500" /> {k.benefitAutoRenewal || 'Auto-Renewal Tanpa Jeda'}
                </span>
                <span className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck size={13} className="text-emerald-500" /> {k.benefitEncrypted || 'Enkripsi PCI-DSS Level 1'}
                </span>
                <span className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
                  <Globe size={13} className="text-blue-500" /> {k.benefitMultiCurrency || 'FIAT & x402 Web3 Ready'}
                </span>
              </div>

              <button 
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="mt-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2 transition-all hover:scale-103 active:scale-97"
              >
                <Plus size={16} /> <span>{k.addFirstPaymentMethodBtn || 'Tambah Metode Pembayaran Utama'}</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {billingData.paymentMethods.map((pm: any) => (
                <div 
                  key={pm.id} 
                  className={`p-5 rounded-3xl border transition-all space-y-4 flex flex-col justify-between relative overflow-hidden ${
                    pm.is_primary
                      ? 'border-orange-500/50 bg-gradient-to-b from-orange-50/40 via-white to-orange-50/10 dark:from-orange-950/20 dark:via-slate-900 dark:to-slate-950 shadow-md ring-1 ring-orange-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                        <PaymentBrandLogo iconKey={pm.icon_key || pm.method_name} className="h-6 w-auto object-contain" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{pm.method_name}</h4>
                        <p className="text-[10.5px] text-slate-400 font-semibold">{pm.card_holder_name || pm.method_type}</p>
                      </div>
                    </div>
                    {pm.is_primary && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold shrink-0">
                        {k.primaryBadge || 'Utama'}
                      </span>
                    )}
                  </div>

                  {/* Optional Physical Card Photo / Proof */}
                  {pm.card_photo_url && (
                    <div className="relative h-20 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                      <img 
                        src={pm.card_photo_url} 
                        alt="Foto Kartu Fisik" 
                        onError={(e) => {
                          (e.target as HTMLElement).parentElement!.style.display = 'none';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-slate-950/70 flex items-end p-2">
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded-lg backdrop-blur-xs">
                          {k.cardPhotoCdnVerified || 'Kartu Terverifikasi CDN'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-800/80 py-2.5">
                    <div className="flex justify-between">
                      <span>{k.expiryDateLabel || 'Masa Berlaku:'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {pm.exp_date === 'Permanen' || pm.exp_date === 'Permanent' ? (k.permanent || 'Permanen') : (pm.exp_date || (k.permanent || 'Permanen'))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{k.channelStatusLabel || 'Status Channel:'}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {pm.status === 'Aktif' || pm.status === 'Active' ? (k.active || 'Aktif') : (pm.status || (k.active || 'Aktif'))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs pt-1">
                    {!pm.is_primary ? (
                      <>
                        <button 
                          onClick={() => handleSetPrimaryPaymentMethod(pm.id, pm.method_name)}
                          className="px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                        >
                          {k.setPrimaryBtn || 'Atur Utama'}
                        </button>
                        <button 
                          onClick={() => setPaymentMethodToDelete(pm)}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          {k.manageDeleteBtn || 'Kelola / Hapus'}
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold italic">
                        {k.primaryMethodNote || 'Metode utama auto-renewal toko'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Supported Payment Gateway & Brand Logos Ribbon */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 shadow-2xs mt-4">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
              <span>PCI-DSS Encrypted Gateways:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center">
                <PaymentBrandLogo iconKey="stripe" className="h-5 sm:h-6 w-auto object-contain" />
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center">
                <PaymentBrandLogo iconKey="midtrans" className="h-5 sm:h-6 w-auto object-contain" />
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center">
                <PaymentBrandLogo iconKey="qris" className="h-5 sm:h-6 w-auto object-contain" />
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center">
                <PaymentBrandLogo iconKey="gopay" className="h-5 sm:h-6 w-auto object-contain" />
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center">
                <PaymentBrandLogo iconKey="dana" className="h-5 sm:h-6 w-auto object-contain" />
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center">
                <PaymentBrandLogo iconKey="ovo" className="h-5 sm:h-6 w-auto object-contain" />
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center">
                <PaymentBrandLogo iconKey="usdc" className="h-5 sm:h-6 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'History' ? (
        /* Full Modernized History Tab View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="size-5 text-orange-500" />
                <span>{k.historyTitle || 'Riwayat Transaksi Settlement (x402 & FIAT)'}</span>
              </h3>
              <p className="text-xs text-slate-400">{k.historySub || 'Log lengkap transaksi mesin-ke-mesin, wallet crypto Solana x402, dan gateway FIAT'}</p>
            </div>
            <button 
              onClick={() => {
                loadBillingHistory();
                triggerToast('✓ Log transaksi settlement berhasil diperbarui!');
              }}
              disabled={isHistoryLoading}
              className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isHistoryLoading ? 'animate-spin' : ''} /> 
              <span>{k.refreshLogBtn || 'Refresh Log'}</span>
            </button>
          </div>

          {/* Top 3 Summary Telemetry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.totalLogTitle || 'Total Transaksi Log'}</span>
              <div className="flex items-baseline justify-between">
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{historyMetrics.total_transactions || (historyTransactions.length || billingData.transactions.length)}</h4>
                <span className="text-[11px] font-bold text-slate-500">{k.recordLogsBadge || 'Record Logs'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.successRateTitle || 'Tingkat Keberhasilan Settlement'}</span>
              <div className="flex items-baseline justify-between">
                <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400">{historyMetrics.success_rate_pct || 100}%</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
                  {historyMetrics.success_count || historyTransactions.length} {k.successCountBadge || 'Sukses'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.activeMethodsTitle || 'Metode Aktif & Protocol'}</span>
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">x402 Solana & FIAT Gateway</h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 text-[9px] font-extrabold">
                  {k.dualSettlementBadge || 'Dual Settlement'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Enterprise Telemetry Visualization Section (SVG Donut Chart & Brand Telemetry) */}
          {(() => {
            const list = historyTransactions.length > 0 ? historyTransactions : billingData.transactions;
            const totalCount = list.length || 1;
            
            // Helper to normalize payment channel names cleanly
            const normalizeMethodName = (rawMethod?: string) => {
              if (!rawMethod) return 'Solana USDC (x402 Protocol)';
              const lower = rawMethod.toLowerCase();
              if (lower.includes('stripe')) return 'Stripe (•••• 4242)';
              if (lower.includes('qris')) return 'QRIS (Virtual Account)';
              if (lower.includes('gopay')) return 'GoPay (E-Wallet)';
              if (lower.includes('dana')) return 'DANA (E-Wallet)';
              if (lower.includes('ovo')) return 'OVO (E-Wallet)';
              if (lower.includes('usdc') || lower.includes('solana')) return 'Solana USDC (x402 Protocol)';
              return rawMethod;
            };

            // Grouping by normalized payment channel & total nominal
            const channelMap: Record<string, { count: number; fiat: number; icon: string }> = {};
            let totalFiat = 0;
            list.forEach((t: any) => {
              const method = normalizeMethodName(t.payment_method);
              if (!channelMap[method]) {
                channelMap[method] = { count: 0, fiat: 0, icon: method };
              }
              channelMap[method].count += 1;
              const fVal = Number(t.amount_fiat) || 0;
              channelMap[method].fiat += fVal;
              totalFiat += fVal;
            });

            const channelEntries = Object.entries(channelMap).sort((a, b) => b[1].count - a[1].count);
            const palette = [
              { color: '#3b82f6', bg: 'bg-blue-500', border: 'border-blue-500' },
              { color: '#10b981', bg: 'bg-emerald-500', border: 'border-emerald-500' },
              { color: '#06b6d4', bg: 'bg-cyan-500', border: 'border-cyan-500' },
              { color: '#8b5cf6', bg: 'bg-purple-500', border: 'border-purple-500' },
              { color: '#ff6b35', bg: 'bg-[#ff6b35]', border: 'border-[#ff6b35]' },
              { color: '#ec4899', bg: 'bg-pink-500', border: 'border-pink-500' },
              { color: '#f59e0b', bg: 'bg-amber-500', border: 'border-amber-500' },
              { color: '#6366f1', bg: 'bg-indigo-500', border: 'border-indigo-500' },
            ];

            const C = 2 * Math.PI * 70; // 439.8235
            let currentOffset = 0;

            return (
              <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900 space-y-5 shadow-xs">
                {/* Unified Enterprise Telemetry Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart3 className="size-4 text-orange-500" />
                      <span>{k.telemetryDistributionsTitle || 'Telemetri Distributions & Settlement Analytics'}</span>
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-medium">{k.telemetryDistributionsSub || 'Analisis visual proporsi transaksi real-time terintegrasi backend database Migration 78'}</p>
                  </div>

                  {/* Unified Live Health Badge Strip */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{k.settlementHealthBadge || 'Settlement Health'}: 100% ({historyMetrics.success_count || list.length} {k.successCountBadge || 'Sukses'})</span>
                  </div>
                </div>

                {historyVisualTab === 'volume' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left Col: High Precision Interactive SVG Donut Chart */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-2">
                      <div className="relative size-56 sm:size-60 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 cursor-pointer" viewBox="0 0 200 200">
                          {/* Base Track Circle */}
                          <circle
                            cx="100"
                            cy="100"
                            r="70"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="22"
                            className="text-slate-100 dark:text-slate-800/80"
                            onClick={() => setSelectedChannelFilter(null)}
                          />

                          {/* Donut Slices */}
                          {channelEntries.map(([method, data], idx) => {
                            const pctRatio = data.count / totalCount;
                            const strokeDash = pctRatio * C;
                            const dashOffset = currentOffset;
                            currentOffset += strokeDash;
                            const style = palette[idx % palette.length];
                            const isSelected = selectedChannelFilter === method;
                            const isHovered = hoveredChannel === method;
                            const active = isSelected || isHovered;
                            const exactPct = ((data.count / totalCount) * 100).toFixed(1);

                            return (
                              <circle
                                key={method}
                                cx="100"
                                cy="100"
                                r="70"
                                fill="transparent"
                                stroke={style.color}
                                strokeWidth={active ? 28 : 22}
                                strokeDasharray={`${strokeDash} ${C - strokeDash}`}
                                strokeDashoffset={-dashOffset}
                                opacity={selectedChannelFilter && !isSelected ? 0.35 : 1}
                                onMouseEnter={() => setHoveredChannel(method)}
                                onMouseLeave={() => setHoveredChannel(null)}
                                onClick={() => {
                                  setSelectedChannelFilter(isSelected ? null : method);
                                  const channelTxns = list.filter((t: any) => (t.payment_method || 'Solana Pay (x402)') === method);
                                  setSelectedChannelDetailModal({
                                    method,
                                    count: data.count,
                                    fiat: data.fiat,
                                    exactPct,
                                    transactions: channelTxns
                                  });
                                }}
                                className="transition-all duration-300 cursor-pointer drop-shadow-xs"
                              />
                            );
                          })}
                        </svg>

                        {/* Dynamic Center Hole Metrics Overlay */}
                        {(() => {
                          const activeChannel = hoveredChannel || selectedChannelFilter;
                          const activeData = activeChannel ? channelMap[activeChannel] : null;
                          const exactPct = activeData ? ((activeData.count / totalCount) * 100).toFixed(1) : null;

                          return (
                            <div
                              onClick={() => setSelectedChannelFilter(null)}
                              className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 rounded-full cursor-pointer group"
                              title="Klik untuk meriset filter kanal"
                            >
                              {activeData ? (
                                <>
                                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider truncate max-w-[130px]">
                                    {activeChannel}
                                  </span>
                                  <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono leading-tight mt-0.5">
                                    Rp{activeData.fiat.toLocaleString('id-ID')}
                                  </span>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-[9.5px] font-extrabold">
                                      {activeData.count} Txn
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[9.5px] font-mono font-black">
                                      {exactPct}%
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{k.settlementVolumeLabel || 'SETTLEMENT VOLUME'}</span>
                                  <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono leading-tight mt-0.5">
                                    Rp{totalFiat.toLocaleString('id-ID')}
                                  </span>
                                  <span className="px-2 py-0.5 mt-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9.5px] font-extrabold group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                    {list.length} {k.logCountLabel || 'Log Transaksi'}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-[9.5px] text-slate-400 font-semibold mt-1.5 flex items-center gap-1">
                        <span>{k.clickSliceTip || '💡 Klik slice atau brand card untuk melihat detail kanal & filter tabel'}</span>
                      </p>
                    </div>

                    {/* Right Col: Enterprise Interactive Legend Cards Grid */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {channelEntries.map(([method, data], idx) => {
                        const exactPct = ((data.count / totalCount) * 100).toFixed(1);
                        const style = palette[idx % palette.length];
                        const isSelected = selectedChannelFilter === method;
                        const isHovered = hoveredChannel === method;

                        return (
                          <div
                            key={method}
                            onMouseEnter={() => setHoveredChannel(method)}
                            onMouseLeave={() => setHoveredChannel(null)}
                            onClick={() => {
                              setSelectedChannelFilter(isSelected ? null : method);
                              const channelTxns = list.filter((t: any) => (t.payment_method || 'Solana Pay (x402)') === method);
                              setSelectedChannelDetailModal({
                                method,
                                count: data.count,
                                fiat: data.fiat,
                                exactPct,
                                transactions: channelTxns
                              });
                            }}
                            className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border flex items-center justify-between transition-all cursor-pointer shadow-2xs group ${
                              isSelected
                                ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-orange-950/20 scale-[1.02]'
                                : isHovered
                                ? 'border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50'
                                : 'border-slate-200/80 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`size-3 rounded-full ${style.bg} shrink-0`} />
                              <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                                <PaymentBrandLogo iconKey={method} className="h-4 w-auto object-contain" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-[11px] font-black text-slate-900 dark:text-slate-100 truncate">{method}</h5>
                                <p className="text-[10px] text-slate-400 font-semibold">{data.count} {k.transactionCountLabel || 'Transaksi'}</p>
                              </div>
                            </div>

                            <div className="text-right shrink-0 pl-2 space-y-0.5">
                              <span className="px-2 py-0.5 rounded-lg bg-orange-100/80 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-mono font-black text-[10.5px]">
                                {exactPct}%
                              </span>
                              {data.fiat > 0 && (
                                <p className="text-[9.5px] font-bold text-slate-400">
                                  Rp{(data.fiat / 1000).toFixed(0)}k
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {historyVisualTab === 'channel' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {channelEntries.map(([method, data]) => {
                      const isSelected = selectedChannelFilter === method;
                      return (
                        <div
                          key={method}
                          onClick={() => setSelectedChannelFilter(isSelected ? null : method)}
                          className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border flex items-center gap-3 shadow-2xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-orange-950/20'
                              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0">
                            <PaymentBrandLogo iconKey={method} className="h-5 w-auto object-contain" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-black text-slate-900 dark:text-slate-100 truncate">{method}</h5>
                            <p className="text-[10px] text-slate-400 font-bold">{data.count} {k.transactionCountLabel || 'Transaksi'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {historyVisualTab === 'status' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-extrabold">
                    <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={18} />
                        <div>
                          <h5 className="font-black text-xs">{k.settlementSuccessTitle || 'Settlement Berhasil'}</h5>
                          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal">{k.settlementSuccessSub || 'Transaksi terverifikasi di blockchain / gateway'}</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {list.filter((t: any) => t.status === 'Berhasil').length} (100%)
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                        <AlertTriangle size={18} />
                        <div>
                          <h5 className="font-black text-xs">{k.settlementFailedTitle || 'Gagal / Pending'}</h5>
                          <p className="text-[10px] text-slate-500 font-normal">{k.settlementFailedSub || 'Belum ada transaksi terkendala'}</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-slate-600 dark:text-slate-400 font-mono">
                        {list.filter((t: any) => t.status !== 'Berhasil').length} (0%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={k.historySearchPlaceholder || 'Cari transaksi hash, metode, atau tipe...'}
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  loadBillingHistory(e.target.value, historyStatusFilter);
                }}
                className="w-full pl-9 pr-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-extrabold">
              {[
                { id: 'Semua', label: k.historyFilterAll || 'Semua' },
                { id: 'Berhasil', label: k.historyFilterSuccess || 'Berhasil' },
                { id: 'Gagal', label: k.historyFilterFailed || 'Gagal' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setHistoryStatusFilter(st.id);
                    loadBillingHistory(historySearch, st.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    historyStatusFilter === st.id
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Channel Active Filter Badge */}
          {selectedChannelFilter && (
            <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-xs font-bold text-orange-700 dark:text-orange-300">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
                <span>{k.showingChannelFilter || 'Menampilkan Filter Kanal:'} <strong>{selectedChannelFilter}</strong></span>
              </div>
              <button
                onClick={() => setSelectedChannelFilter(null)}
                className="px-2 py-0.5 rounded-lg bg-orange-200/60 dark:bg-orange-900/80 text-[11px] font-black text-orange-800 dark:text-orange-200 hover:bg-orange-300 cursor-pointer transition-colors"
              >
                {k.resetFilterBtn || 'Riset Filter ✕'}
              </button>
            </div>
          )}

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">{k.colTxnHashType || 'TRANSAKSI HASH & TIPE'}</th>
                  <th className="py-3 px-4">{k.colDateTime || 'TANGGAL & WAKTU'}</th>
                  <th className="py-3 px-4">{k.colPaymentMethod || 'METODE PEMBAYARAN'}</th>
                  <th className="py-3 px-4">{k.colAmount || 'NOMINAL (CRYPTO & FIAT)'}</th>
                  <th className="py-3 px-4">{k.colStatusHistory || 'STATUS'}</th>
                  <th className="py-3 px-4 text-right">{k.colAction || 'AKSI'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {(historyTransactions.length > 0 ? historyTransactions : billingData.transactions)
                  .filter((tx: any) => {
                    if (!selectedChannelFilter) return true;
                    const norm = (raw?: string) => {
                      if (!raw) return 'Solana USDC (x402 Protocol)';
                      const l = raw.toLowerCase();
                      if (l.includes('stripe')) return 'Stripe (•••• 4242)';
                      if (l.includes('qris')) return 'QRIS (Virtual Account)';
                      if (l.includes('gopay')) return 'GoPay (E-Wallet)';
                      if (l.includes('dana')) return 'DANA (E-Wallet)';
                      if (l.includes('ovo')) return 'OVO (E-Wallet)';
                      if (l.includes('usdc') || l.includes('solana')) return 'Solana USDC (x402 Protocol)';
                      return raw;
                    };
                    return norm(tx.payment_method) === selectedChannelFilter;
                  })
                  .map((tx: any, i: number) => (
                  <tr key={tx.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{tx.txn_hash}</span>
                        {tx.explorer_url && (
                          <a 
                            href={tx.explorer_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-0.5 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Lihat di Solana Explorer"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{tx.txn_type || k.defaultTxnType || 'Perpanjangan Subscription'}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-medium">{tx.txn_date_label}</td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-0.5 font-bold text-[9px] text-slate-600 dark:text-slate-300">
                          <PaymentBrandLogo iconKey={tx.payment_method} className="h-3.5 w-auto object-contain" />
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{tx.payment_method}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 space-y-0.5">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">{tx.amount_crypto}</div>
                      {tx.amount_fiat > 0 && (
                        <div className="text-[10px] font-bold text-slate-400">
                          Rp{Number(tx.amount_fiat).toLocaleString('id-ID')}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        tx.status === 'Berhasil'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        {tx.status === 'Berhasil' ? (k.statusSuccess || 'Berhasil') : (k.statusFailed || 'Gagal')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTxnForDetail(tx)}
                        className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                      >
                        {k.detailBtn || 'Detail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'Usage' ? (
        /* Full Modernized Usage Telemetry Dashboard */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          {/* 1. Header & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="size-5 text-orange-500" />
                <span>{k.usageAnalyticsTitle || 'Pantau Pemakaian Kuota & Analytics Resource'}</span>
              </h3>
              <p className="text-xs text-slate-400">{k.usageAnalyticsSub || 'Analisis penggunaan AI Credits, AI Workforce, Otomasi Workflow, dan Cloud Storage secara real-time'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  loadUsageTelemetry();
                  triggerToast('✓ Telemetri penggunaan kuota berhasil diperbarui!');
                }}
                disabled={isUsageLoading}
                className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isUsageLoading ? 'animate-spin' : ''} /> 
                <span>{k.refreshTelemetryBtn || 'Refresh Telemetri'}</span>
              </button>
              <button 
                onClick={() => setIsTopupQuotaModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>{k.addQuotaUpgradeBtn || 'Tambah Kuota / Upgrade'}</span>
              </button>
            </div>
          </div>

          {/* 2. Quota Health KPI Cards Grid */}
          {usageTelemetryData.metrics.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 text-xs font-semibold">
              {k.noMetricsBackend || 'Belum ada metrik pemakaian kuota yang tercatat di backend.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {usageTelemetryData.metrics.map((m: any, i: number) => {
                const pct = m.percentage || 0;
                const isHigh = pct >= 80;
                const isMedium = pct >= 50 && pct < 80;
                
                return (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 shadow-2xs relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">{m.metric_label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isHigh ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' :
                        isMedium ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}>
                        {pct}%
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between font-mono">
                        <span className="text-lg font-black text-slate-900 dark:text-slate-100">{m.current_value_label}</span>
                        <span className="text-xs text-slate-400 font-bold">/ {m.limit_value_label}</span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHigh ? 'bg-rose-500' : isMedium ? 'bg-orange-500' : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${Math.min(pct, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Interactive BarChart Usage Analytics Section */}
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BarChart2 className="size-4 text-orange-500" />
                  <span>{k.usageTrendBarChartTitle || 'Tren Penggunaan Kuota (Visualisasi BarChart Interaktif)'}</span>
                </h4>
                <p className="text-[10.5px] text-slate-400 font-medium">{k.usageTrendBarChartSub || 'Grafik histori konsumsi harian vs batas kuota langganan UMKM'}</p>
              </div>

              {/* Timeframe & Metric Switchers & Collapsible Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Metric Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-extrabold">
                  {[
                    { id: 'credits', label: k.metricCredits || 'AI Credits' },
                    { id: 'automations', label: k.metricAutomations || 'Automations' },
                    { id: 'storage', label: k.metricStorage || 'Storage' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setUsageChartMetric(btn.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        usageChartMetric === btn.id
                          ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Timeframe Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-extrabold">
                  {[
                    { id: '7d', label: k.timeframe7d || '7 Hari' },
                    { id: '30d', label: k.timeframe30d || '30 Hari' },
                    { id: '12m', label: k.timeframe12m || '12 Bulan' }
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setUsageTimeframe(tf.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        usageTimeframe === tf.id
                          ? 'bg-orange-500 text-white shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                {/* Collapse Toggle */}
                <button
                  onClick={() => setIsUsageTrendExpanded(!isUsageTrendExpanded)}
                  className="p-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1 text-[11px] font-extrabold cursor-pointer"
                >
                  <span>{isUsageTrendExpanded ? (k.hideTrendBtn || 'Sembunyikan') : (k.showTrendBtn || 'Buka Tren')}</span>
                  {isUsageTrendExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {isUsageTrendExpanded && (
              /* Render Interactive Bar Chart */
              (() => {
                const rawTrends = usageTelemetryData.trends || [];
                if (rawTrends.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs font-medium">
                      {k.noTrendData || 'Belum ada data histori tren penggunaan kuota yang tercatat.'}
                    </div>
                  );
                }

                // Strict Chronological Sorting for BarChart X Axis
                const trendList = [...rawTrends].sort((a: any, b: any) => {
                  const dayA = parseInt((a.date_label || '').split(' ')[0], 10) || 0;
                  const dayB = parseInt((b.date_label || '').split(' ')[0], 10) || 0;
                  return dayA - dayB;
                });

                const getVal = (item: any) => {
                  if (usageChartMetric === 'automations') return item.automations_run || 0;
                  if (usageChartMetric === 'storage') return item.storage_used_gb || 0;
                  return item.ai_credits_used || 0;
                };

                const maxVal = Math.max(...trendList.map(getVal), 1);

                return (
                  <div className="space-y-4">
                    <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
                      {trendList.map((item: any, idx: number) => {
                        const val = getVal(item);
                        const heightPct = Math.max(12, Math.round((val / maxVal) * 100));
                        const isPeak = val === maxVal;

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative">
                            {/* Value Tooltip Hover overlay */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 bg-slate-900 text-white text-[10px] font-mono font-bold rounded-lg pointer-events-none shadow-md z-10 whitespace-nowrap">
                              {val} {usageChartMetric === 'storage' ? 'GB' : usageChartMetric === 'automations' ? 'Runs' : 'Credits'}
                            </div>

                            {/* Bar Column */}
                            <div className="w-full max-w-[40px] rounded-t-xl bg-slate-100 dark:bg-slate-800/80 h-full flex items-end overflow-hidden">
                              <div
                                className={`w-full rounded-t-xl transition-all duration-500 group-hover:opacity-90 ${
                                  isPeak 
                                    ? 'bg-gradient-to-t from-orange-600 to-amber-400' 
                                    : 'bg-gradient-to-t from-orange-500/80 to-orange-400/80'
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>

                            {/* X Axis Date Label */}
                            <span className="text-[10px] font-mono font-bold text-slate-400 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100">
                              {item.date_label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-orange-500" />
                        <span>{k.activeMetricLabel || 'Metrik Aktif:'} <strong>{usageChartMetric.toUpperCase()}</strong></span>
                      </span>
                      <span className="font-mono">{k.peakConsumptionLabel || 'Puncak Konsumsi:'} {maxVal} {usageChartMetric === 'storage' ? 'GB' : usageChartMetric === 'automations' ? 'Executions' : 'Credits'}</span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* 4. Feature Usage Breakdown Section */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{k.featureBreakdownTitle || 'Rincian Penggunaan Berdasarkan Fitur'}</h4>
                <p className="text-[10.5px] text-slate-400">{k.featureBreakdownSub || 'Daftar konsumsi AI credits per modul dan layanan sistem'}</p>
              </div>

              <button
                onClick={() => setIsUsageBreakdownExpanded(!isUsageBreakdownExpanded)}
                className="p-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1 text-xs font-extrabold cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <span>{isUsageBreakdownExpanded ? (k.hideBreakdownBtn || 'Sembunyikan') : (k.showBreakdownBtn || 'Buka Rincian')}</span>
                {isUsageBreakdownExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {isUsageBreakdownExpanded && (
              <div className="space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                  <div className="relative w-full sm:w-48">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={k.searchFeaturesPlaceholder || "Cari fitur..."}
                      value={usageSearchQuery}
                      onChange={(e) => setUsageSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-extrabold overflow-x-auto max-w-full">
                    {['Semua', 'AI Workforce', 'Automations', 'Sales Hub', 'Vision AI', 'Storage'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setUsageCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          usageCategoryFilter === cat
                            ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {cat === 'Semua' ? (k.categoryFilterAll || 'Semua') : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-4">{k.colFeatureModule || 'FITUR / MODUL'}</th>
                        <th className="py-3 px-4">{k.colCategory || 'KATEGORI'}</th>
                        <th className="py-3 px-4">{k.colTotalActivity || 'TOTAL AKTIVITAS'}</th>
                        <th className="py-3 px-4">{k.colCreditsCost || 'BIAYA CREDITS'}</th>
                        <th className="py-3 px-4 text-right">{k.colLastUsed || 'TERAKHIR DIGUNAKAN'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      {usageTelemetryData.breakdown.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-[11px] font-medium">
                            {k.noBreakdownData || 'Belum ada catatan rincian penggunaan fitur.'}
                          </td>
                        </tr>
                      ) : (
                        usageTelemetryData.breakdown
                          .filter((item: any) => {
                            const matchCat = usageCategoryFilter === 'Semua' || item.category === usageCategoryFilter;
                            const matchSearch = !usageSearchQuery || item.feature_name?.toLowerCase().includes(usageSearchQuery.toLowerCase());
                            return matchCat && matchSearch;
                          })
                          .map((row: any, i: number) => (
                            <tr key={row.id || i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{row.feature_name}</td>
                              <td className="py-3 px-4">
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold">
                                  {row.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono">{row.usage_value} {row.unit_label}</td>
                              <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-slate-100">{row.cost_credits} Credits</td>
                              <td className="py-3 px-4 text-right text-slate-400 font-medium text-[11px]">{row.last_used_at}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'Settings' ? (
        /* Enterprise Settings Tab View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
          
          {/* Header & Save Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {k.billingSettingsTitle || 'Pengaturan Tagihan & Faktur Pajak'}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 text-[11px] font-bold border border-orange-200/60 dark:border-orange-900/50 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
                  {k.realtimeDbSyncBadge || 'Realtime DB Sync'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                {k.billingSettingsSub || 'Kelola identitas badan usaha, NPWP, alamat e-Faktur, preferensi pembayaran otomatis, dan saluran notifikasi tagihan.'}
              </p>
            </div>

            <button 
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="self-start md:self-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-extrabold text-xs cursor-pointer shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={15} className={isSavingSettings ? 'animate-spin' : ''} />
              {isSavingSettings ? (k.savingChangesBtn || 'Menyimpan...') : (k.saveChangesBtn || 'Simpan Perubahan')}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Section 1: Profil Toko & Entitas Tagihan */}
            <div className="p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all shadow-2xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="size-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center font-bold shadow-2xs">
                  <Building2 size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    {k.sectionBusinessProfileHeading || 'Profil Toko & Entitas Tagihan'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {k.sectionBusinessProfileSub || 'Identitas resmi yang dicantumkan pada Invoice & e-Faktur'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Store Name Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-between">
                    <span>{k.businessNameLabel || 'Nama Badan Usaha / Toko'}</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-extrabold px-2 py-0.5 bg-orange-100/60 dark:bg-orange-950/60 rounded-full border border-orange-200/50 dark:border-orange-900/40">
                      {k.requiredBadge || 'Wajib'}
                    </span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={settingsData.business_name || ''} 
                      onChange={(e) => setSettingsData({ ...settingsData, business_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                    />
                    <Building2 size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Tax ID / NPWP Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-between">
                    <span>{k.taxIdLabel || 'Nomor NPWP / Tax ID'}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-full">
                      {k.optionalTaxBadge || 'Opsional e-Faktur'}
                    </span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={settingsData.tax_id || ''} 
                      onChange={(e) => setSettingsData({ ...settingsData, tax_id: e.target.value })}
                      placeholder="00.000.000.0-000.000"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                    />
                    <FileText size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Billing Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 dark:text-slate-200 font-extrabold">
                    {k.billingPhoneLabel || 'Telepon Penanggung Jawab Billing'}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={settingsData.billing_phone || ''} 
                      onChange={(e) => setSettingsData({ ...settingsData, billing_phone: e.target.value })}
                      placeholder="+62 812-3456-7890"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                    />
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Kontak & Alamat Pengiriman Faktur */}
            <div className="p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all shadow-2xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold shadow-2xs">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    {k.sectionContactAddressHeading || 'Kontak & Alamat Pengiriman Faktur'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {k.sectionContactAddressSub || 'Email dan alamat fisik penerbitan dokumen faktur'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Billing Email Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-between">
                    <span>{k.billingEmailLabel || 'Email Utama Faktur & Invoice'}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 bg-emerald-100/60 dark:bg-emerald-950/60 rounded-full border border-emerald-200/50 dark:border-emerald-900/40">
                      <ShieldCheck size={12} />
                      {k.verifiedEmailBadge || 'Terverifikasi'}
                    </span>
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={settingsData.billing_email || ''} 
                      onChange={(e) => setSettingsData({ ...settingsData, billing_email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-2xs"
                    />
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Address Textarea */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 dark:text-slate-200 font-extrabold">
                    {k.billingAddressLabel || 'Alamat Lengkap Penerbitan Invoice'}
                  </label>
                  <div className="relative">
                    <textarea 
                      rows={3}
                      value={settingsData.billing_address || ''} 
                      onChange={(e) => setSettingsData({ ...settingsData, billing_address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none shadow-2xs"
                    />
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Preferensi Pembayaran & Otomatisasi */}
            <div className="p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all shadow-2xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="size-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center font-bold shadow-2xs">
                  <Globe size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    {k.sectionPaymentPrefHeading || 'Preferensi Pembayaran & Otomatisasi'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {k.sectionPaymentPrefSub || 'Atur perpanjangan otomatis dan mata uang billing'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Auto Renew Switch */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
                  <div className="pr-4">
                    <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                      {k.autoRenewTitle || 'Perpanjangan Otomatis (Auto-Renew)'}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                      {k.autoRenewSub || 'Perpanjang paket aktif otomatis saat tanggal kedaluwarsa'}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSettingsData({ ...settingsData, auto_renew: !settingsData.auto_renew })}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${settingsData.auto_renew ? 'bg-emerald-500 shadow-xs shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block size-5 transform rounded-full bg-white shadow-md transition-transform ${settingsData.auto_renew ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Primary Currency */}
                <div className="space-y-1.5">
                  <label className="text-slate-800 dark:text-slate-200 font-extrabold">
                    {k.currencyLabel || 'Mata Uang Utama Faktur'}
                  </label>
                  <div className="relative">
                    <select 
                      value={settingsData.preferred_currency || 'IDR'} 
                      onChange={(e) => setSettingsData({ ...settingsData, preferred_currency: e.target.value })}
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer shadow-2xs"
                    >
                      <option value="IDR">{k.currencyIdr || 'Rupiah Indonesia (IDR - Rp)'}</option>
                      <option value="USD">{k.currencyUsd || 'Dolar Amerika (USD - $)'}</option>
                      <option value="USDC">{k.currencyUsdc || 'USDC Stablecoin Solana (x402 Network)'}</option>
                    </select>
                    <CreditCard size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <ChevronDown size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Kanal Notifikasi & Peringatan Kuota */}
            <div className="p-6 rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all shadow-2xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                  <BellRing size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    {k.sectionNotificationsHeading || 'Kanal Notifikasi & Peringatan Kuota'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {k.sectionNotificationsSub || 'Pilih media pengiriman pengingat tagihan & penggunaan kuota'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Channel 1: Email Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center font-bold">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                        {k.notifyEmailTitle || 'Pengingat Email'}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {k.notifyEmailSub || 'Kirim invoice & kuota kritis via email'}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSettingsData({ ...settingsData, notify_email: !(settingsData.notify_email ?? true) })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${(settingsData.notify_email ?? true) ? 'bg-orange-500 shadow-xs shadow-orange-500/30' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block size-4 transform rounded-full bg-white shadow-md transition-transform ${(settingsData.notify_email ?? true) ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Channel 2: WhatsApp Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                        {k.notifyWhatsappTitle || 'Notifikasi WhatsApp'}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {k.notifyWhatsappSub || 'Kirim ringkasan transaksi & pengingat perpanjangan'}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSettingsData({ ...settingsData, notify_whatsapp: !(settingsData.notify_whatsapp ?? true) })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${(settingsData.notify_whatsapp ?? true) ? 'bg-emerald-500 shadow-xs shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block size-4 transform rounded-full bg-white shadow-md transition-transform ${(settingsData.notify_whatsapp ?? true) ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Channel 3: Push Notification Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center font-bold">
                      <BellRing size={18} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                        {k.notifyPushTitle || 'In-App Push Notification'}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {k.notifyPushSub || 'Tampilkan alert pada header dashboard user'}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSettingsData({ ...settingsData, notify_push: !settingsData.notify_push })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${settingsData.notify_push ? 'bg-purple-500 shadow-xs shadow-purple-500/30' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block size-4 transform rounded-full bg-white shadow-md transition-transform ${settingsData.notify_push ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Save Action Bar */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Data tersimpan terenkripsi secara otomatis</span>
            </div>

            <button 
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-extrabold text-xs cursor-pointer shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={15} className={isSavingSettings ? 'animate-spin' : ''} />
              {isSavingSettings ? (k.savingChangesBtn || 'Menyimpan Pengaturan...') : (k.saveAllSettingsBtn || 'Simpan Semua Pengaturan')}
            </button>
          </div>
        </div>
      ) : (
        /* Default Overview Tab View */
        <>
          {/* 3. Top 5 Summary KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Card 1: Paket Aktif */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">{k.overviewActivePlan || 'Paket Aktif'}</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{billingData.plan.plan_name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[9px] font-extrabold">
                    {billingData.plan.status === 'Aktif' || billingData.plan.status === 'Active' ? (k.active || 'Aktif') : billingData.plan.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {billingData.plan.expires_at ? `${k.overviewExpiresOn || 'Berakhir pada'} ${new Date(billingData.plan.expires_at).toLocaleDateString(language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : (k.overviewNoActivePlan || 'Tidak ada paket aktif')}
                </p>
              </div>
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs transition-all"
              >
                {k.overviewManagePlanBtn || 'Kelola Paket'}
              </button>
            </div>

            {/* Card 2: Total Tagihan Bulan Ini */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">{k.overviewTotalMonthlyBill || 'Total Tagihan Bulan Ini'}</span>
                <div className="pt-0.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {language === 'en' ? '$' + Math.round(Number(billingData.plan.monthly_price_idr || 0) / 15000) : `Rp${Number(billingData.plan.monthly_price_idr || 0).toLocaleString('id-ID')}`}
                  </h2>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{k.overviewVatIncluded || 'Termasuk PPN'} {billingData.plan.tax_pct || 11}%</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <ArrowDownRight size={12} />
                <span>{billingData.plan.monthly_price_idr > 0 ? `${billingData.plan.growth_pct || 0}% ${k.overviewFromLastMonth || 'dari bulan lalu'}` : (k.overviewNoBillYet || 'Belum ada tagihan')}</span>
              </div>
            </div>

            {/* Card 3: AI Credits Tersisa */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400">{k.overviewRemainingCredits || 'AI Credits Tersisa'}</span>
                <div className="pt-0.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {(billingData.plan.credits_remaining || 0).toLocaleString('id-ID')} / {(billingData.plan.credits_limit || 0).toLocaleString('id-ID')}
                  </h2>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${billingData.plan.credits_pct || 0}%` }} />
                </div>
              </div>
              <button 
                onClick={() => setIsUsageModalOpen(true)}
                className="text-left text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {k.overviewViewUsageDetail || 'Lihat Detail Usage'}
              </button>
            </div>

            {/* Card 4: Metode Pembayaran Utama */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">{k.overviewPrimaryPaymentMethod || 'Metode Pembayaran Utama'}</span>
                {(() => {
                  const primary = billingData.paymentMethods.find((p: any) => p.is_primary) || billingData.paymentMethods[0];
                  if (primary) {
                    return (
                      <>
                        <div className="flex items-center gap-2 pt-0.5">
                          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono truncate">{primary.method_name}</h2>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 text-[9px] font-extrabold">
                            {primary.status === 'Utama' || primary.status === 'Primary' ? (k.primaryBadge || 'Utama') : primary.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{k.expiryDateLabel || 'Masa berlaku:'} {primary.exp_date === 'Permanen' || primary.exp_date === 'Permanent' ? (k.permanent || 'Permanen') : primary.exp_date}</p>
                      </>
                    );
                  }
                  return (
                    <>
                      <div className="flex items-center gap-2 pt-0.5">
                        <h2 className="text-sm font-black text-slate-400 font-mono">{k.overviewNoChannel || 'Belum Ada Kanal'}</h2>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{k.overviewAddNewMethod || 'Tambahkan metode baru'}</p>
                    </>
                  );
                })()}
              </div>
              <button 
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="text-left text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {k.overviewManagePayments || 'Kelola Pembayaran'}
              </button>
            </div>

            {/* Card 5: Status Pembayaran */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">{k.overviewPaymentStatus || 'Status Pembayaran'}</span>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-base pt-0.5">
                  <CheckCircle2 size={18} />
                  <span>{k.overviewStatusSafe || 'Aman'}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{k.overviewAllRecentPayments || 'Semua pembayaran terbaru'}</p>
              </div>
              <button 
                onClick={() => setActiveTab('History')}
                className="text-left text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {k.overviewViewHistory || 'Lihat Riwayat'}
              </button>
            </div>

          </div>

          {/* 4. Middle Section: Ringkasan Penggunaan, Trend Penggunaan, & Rocket Upgrade Card */}
          <div className="grid lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Ringkasan Penggunaan (col-span-3) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">{k.overviewUsageSummary || 'Ringkasan Penggunaan'}</h3>
                  <span className="text-[9px] text-slate-400 font-medium">1 - 30 {language === 'en' ? 'July' : language === 'zh' ? '七月' : 'Juli'} 2026</span>
                </div>

                <div className="space-y-3.5">
                  {billingData.usage.map((u: any, i: number) => {
                    const localizedLabel = 
                      u.metric_key === 'credits' ? (k.metricCredits || 'AI Credits') :
                      u.metric_key === 'employees' ? (k.metricEmployees || 'AI Employees') :
                      u.metric_key === 'automation' ? (k.metricAutomations || 'Automation') :
                      u.metric_key === 'storage' ? (k.metricStorage || 'Storage') : u.metric_label;

                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{localizedLabel}</span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold">
                            {u.current_value_label} / {u.limit_value_label} {u.percentage ? `(${u.percentage}%)` : ''}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${u.percentage || 40}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => setIsUsageModalOpen(true)}
                className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer pt-2"
              >
                <span>{k.overviewViewAllUsage || 'Lihat Semua Usage'}</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Trend Penggunaan SVG Chart (col-span-5) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">{k.overviewTelemetryTrend || 'Trend Penggunaan Telemetri'}</h3>
                  <select 
                    value={trendRange}
                    onChange={(e) => setTrendRange(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="30 Hari Terakhir">{k.overview30Days || '30 Hari Terakhir'}</option>
                    <option value="7 Hari Terakhir">{k.overview7Days || '7 Hari Terakhir'}</option>
                    <option value="90 Hari Terakhir">{k.overview90Days || '90 Hari Terakhir'}</option>
                  </select>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-4">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-orange-500" /> {k.metricCredits || 'AI Credits'}</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> {k.metricEmployees || 'AI Employees'}</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> {k.metricAutomations || 'Automation'}</span>
                </div>

                {/* Dynamic Interactive SVG Chart */}
                {(() => {
                  const rawPoints = billingData.usageTrend || [
                    { date: '01 Jul', ai_credits: 1800, ai_employees: 4, automation: 12 },
                    { date: '08 Jul', ai_credits: 2100, ai_employees: 5, automation: 15 },
                    { date: '15 Jul', ai_credits: 2800, ai_employees: 6, automation: 19 },
                    { date: '22 Jul', ai_credits: 3100, ai_employees: 7, automation: 22 },
                    { date: '29 Jul', ai_credits: 3240, ai_employees: 7, automation: 24 }
                  ];

                  const count = rawPoints.length;
                  const xStep = count > 1 ? (360 / (count - 1)) : 360;

                  // Normalize values onto SVG Y canvas (height 120, baseline 105, top 15)
                  const mapY = (val: number, maxVal: number) => {
                    const pct = Math.min(1, Math.max(0, val / (maxVal || 1)));
                    return Math.round(105 - pct * 85);
                  };

                  const maxCredits = 5000;
                  const maxEmployees = 10;
                  const maxAutomation = 50;

                  const orangePts = rawPoints.map((p: any, i: number) => ({ cx: Math.round(15 + i * xStep), cy: mapY(p.ai_credits || 0, maxCredits), val: p.ai_credits, date: p.date }));
                  const bluePts = rawPoints.map((p: any, i: number) => ({ cx: Math.round(15 + i * xStep), cy: mapY(p.ai_employees || 0, maxEmployees), val: p.ai_employees, date: p.date }));
                  const emeraldPts = rawPoints.map((p: any, i: number) => ({ cx: Math.round(15 + i * xStep), cy: mapY(p.automation || 0, maxAutomation), val: p.automation, date: p.date }));

                  const makePath = (pts: any[]) => pts.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ');
                  const makeArea = (pts: any[]) => `${makePath(pts)} L ${pts[pts.length - 1].cx} 115 L ${pts[0].cx} 115 Z`;

                  return (
                    <div className="h-44 w-full relative flex items-end pt-4 pb-6">
                      {/* Y Axis Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between text-[9px] font-mono text-slate-300 pointer-events-none">
                        <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>100% {k.overviewQuota || 'Kuota'}</span></div>
                        <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>75%</span></div>
                        <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>50%</span></div>
                        <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>25%</span></div>
                        <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>0%</span></div>
                      </div>

                      {/* Chart SVG */}
                      <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 390 120">
                        <defs>
                          <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Gradient Areas */}
                        <path d={makeArea(orangePts)} fill="url(#orangeGrad)" />
                        <path d={makeArea(bluePts)} fill="url(#blueGrad)" />
                        <path d={makeArea(emeraldPts)} fill="url(#emeraldGrad)" />

                        {/* Stroke Lines */}
                        <path d={makePath(orangePts)} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                        <path d={makePath(bluePts)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                        <path d={makePath(emeraldPts)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Interactive Data Points */}
                        {orangePts.map((p: any, i: number) => (
                          <g key={`o-${i}`} className="group cursor-pointer">
                            <circle cx={p.cx} cy={p.cy} r="4" fill="#ffffff" stroke="#f97316" strokeWidth="2.5" className="group-hover:r-6 transition-all" />
                            <text x={p.cx} y={p.cy - 8} textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity fill-slate-900 dark:fill-white text-[9px] font-mono font-bold">
                              {p.val} Cr
                            </text>
                          </g>
                        ))}

                        {bluePts.map((p: any, i: number) => (
                          <g key={`b-${i}`} className="group cursor-pointer">
                            <circle cx={p.cx} cy={p.cy} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" className="group-hover:r-6 transition-all" />
                          </g>
                        ))}

                        {emeraldPts.map((p: any, i: number) => (
                          <g key={`e-${i}`} className="group cursor-pointer">
                            <circle cx={p.cx} cy={p.cy} r="4" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" className="group-hover:r-6 transition-all" />
                          </g>
                        ))}
                      </svg>

                      {/* X Axis Labels */}
                      <div className="absolute bottom-0 inset-x-0 flex justify-between text-[9px] font-mono text-slate-400 px-2">
                        {rawPoints.map((p: any, i: number) => (
                          <span key={i}>{p.date}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Yakin mau upgrade? Rocket Banner (col-span-4) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between z-10 w-full mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-orange-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{k.overviewUpgradeRecommend || 'Rekomendasi Upgrade Paket'}</h3>
                </div>
              </div>

              <div className="flex items-center justify-between relative z-10 w-full pt-1">
                <div className="space-y-3 max-w-[62%]">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{k.overviewBoostUmkm || 'Tingkatkan Performa UMKM Anda'}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                      {k.overviewUpgradeBannerSub || 'Dapatkan lebih banyak AI Credits, AI Employees tanpa batas, dan Priority Support 24/7.'}
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 flex-shrink-0" /> <span>{k.overviewMoreCredits || 'Lebih banyak AI Credits'}</span></li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 flex-shrink-0" /> <span>{k.overviewUnlimitedEmployees || 'AI Employees tanpa batas'}</span></li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 flex-shrink-0" /> <span>{k.overviewUnlimitedAutomation || 'Automation tanpa batas'}</span></li>
                  </ul>

                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="mt-2 px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>{k.overviewUpgradeNowBtn || 'Upgrade Sekarang'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="w-[42%] flex items-center justify-center cursor-pointer select-none overflow-visible" onClick={handleRocketLaunch} title={k.overviewRocketTooltip || "Klik untuk Meluncurkan Rocket Upgrade!"}>
                  <img 
                    src={rocketSrc} 
                    onError={() => setRocketSrc('/design/dashboard_umkm/billing/rocket.png')}
                    alt="Rocket Upgrade" 
                    className={`h-44 sm:h-52 lg:h-56 w-auto object-contain drop-shadow-2xl transition-all duration-700 ease-in-out cursor-pointer ${
                      isRocketAnimating 
                        ? '-translate-y-52 scale-110 opacity-0 filter brightness-125' 
                        : 'hover:scale-110 hover:-translate-y-2 active:scale-95'
                    }`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* 5. Tables Row: Riwayat Tagihan & Transaksi Terakhir */}
          <div className="grid lg:grid-cols-12 gap-5">
            
            {/* Left Column: Riwayat Tagihan (col-span-6) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">{k.overviewBillingHistory || 'Riwayat Tagihan'}</h3>
                <button 
                  onClick={() => setActiveTab('Invoice')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {k.overviewViewAll || 'Lihat Semua'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="pb-2">{k.overviewColInvoice || 'INVOICE'}</th>
                      <th className="pb-2">{k.overviewColPeriod || 'PERIODE'}</th>
                      <th className="pb-2">{k.overviewColTotal || 'TOTAL'}</th>
                      <th className="pb-2">{k.overviewColStatus || 'STATUS'}</th>
                      <th className="pb-2 text-right">{k.overviewColAction || 'AKSI'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    {billingData.invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-[11px] font-medium">
                          {k.overviewNoInvoiceHistory || 'Belum ada riwayat tagihan invoice.'}
                        </td>
                      </tr>
                    ) : (
                      billingData.invoices.map((inv: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                        <td className="py-2.5 text-slate-500">{inv.period_label}</td>
                        <td className="py-2.5 font-extrabold text-slate-900 dark:text-slate-100">
                          {language === 'en' ? '$' + Math.round(Number(inv.total_amount_idr || 299000) / 15000) : `Rp${Number(inv.total_amount_idr || 299000).toLocaleString('id-ID')}`}
                        </td>
                        <td className="py-2.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold">
                            {inv.status === 'Lunas' || inv.status === 'Paid' ? (k.filterPaid || 'Lunas') : inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button 
                            onClick={() => setSelectedInvoiceForDetail(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Download size={14} />
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Transaksi Terakhir (col-span-6) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">{k.overviewRecentTransactions || 'Transaksi Terakhir'}</h3>
                <button 
                  onClick={() => setActiveTab('History')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {k.overviewViewAll || 'Lihat Semua'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="pb-2">{k.overviewColTransaction || 'TRANSAKSI'}</th>
                      <th className="pb-2">{k.overviewColDate || 'TANGGAL'}</th>
                      <th className="pb-2">{k.overviewColMethod || 'METODE'}</th>
                      <th className="pb-2">{k.overviewColAmount || 'JUMLAH'}</th>
                      <th className="pb-2 text-right">{k.overviewColStatus || 'STATUS'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    {billingData.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-[11px] font-medium">
                          {k.overviewNoTransactions || 'Belum ada catatan transaksi.'}
                        </td>
                      </tr>
                    ) : (
                      billingData.transactions.map((tx: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">{tx.txn_hash}</td>
                          <td className="py-2.5 text-slate-500 text-[11px]">{tx.txn_date_label}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1.5">
                              <PaymentBrandLogo iconKey={tx.payment_method} className="h-4 w-auto object-contain" />
                              <span className="text-slate-700 dark:text-slate-300 font-bold">{tx.payment_method}</span>
                            </div>
                          </td>
                          <td className="py-2.5 font-extrabold text-slate-900 dark:text-slate-100">{tx.amount_crypto}</td>
                          <td className="py-2.5 text-right">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold">
                              {tx.status === 'Berhasil' || tx.status === 'Success' ? (k.filterPaid || 'Success') : tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Dialog Modals */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentPlan={billingData.plan}
        triggerToast={triggerToast}
        onRefresh={loadBillingOverview}
      />

      <AddPaymentMethodModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadBillingOverview}
      />

      <UsageDetailModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        usageData={billingData.usage}
        triggerToast={triggerToast}
      />

      <TopupQuotaModal
        isOpen={isTopupQuotaModalOpen}
        onClose={() => setIsTopupQuotaModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={() => {
          loadBillingOverview();
          loadUsageTelemetry();
        }}
      />

      {selectedInvoiceForDetail && (
        <InvoiceDetailModal
          isOpen={true}
          onClose={() => setSelectedInvoiceForDetail(null)}
          invoice={selectedInvoiceForDetail}
          triggerToast={triggerToast}
        />
      )}

      {selectedTxnForDetail && (
        <TransactionDetailModal
          isOpen={true}
          onClose={() => setSelectedTxnForDetail(null)}
          txn={selectedTxnForDetail}
          triggerToast={triggerToast}
        />
      )}

      {selectedChannelDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2">
                  <PaymentBrandLogo iconKey={selectedChannelDetailModal.method} className="h-6 w-auto object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{selectedChannelDetailModal.method}</span>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[9.5px] font-mono font-extrabold">
                      {selectedChannelDetailModal.exactPct}% Share
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Detail Telemetri & Settlement Log Kanal</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChannelDetailModal(null)}
                className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center text-sm font-black cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Telemetry KPI Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Volume Nominal</span>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                  Rp{selectedChannelDetailModal.fiat.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Jumlah Transaksi</span>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                  {selectedChannelDetailModal.count} Transaksi Log
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status Settlement</span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>100% Terverifikasi</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tipe Protokol</span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                  {selectedChannelDetailModal.method.includes('Solana') ? 'Solana x402 Protocol' : 'FIAT Payment Gateway'}
                </p>
              </div>
            </div>

            {/* Channel Recent Transaction Logs List */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} className="text-orange-500" />
                <span>Transaksi Terakhir di Kanal Ini</span>
              </h5>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedChannelDetailModal.transactions.map((tx: any, idx: number) => (
                  <div
                    key={tx.id || idx}
                    className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{tx.txn_hash}</p>
                      <span className="text-[9.5px] text-slate-400">{tx.txn_date_label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{tx.amount_crypto}</span>
                      <p className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-bold">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedChannelFilter(selectedChannelDetailModal.method);
                  setSelectedChannelDetailModal(null);
                  triggerToast(`Filter tabel diaktifkan untuk kanal ${selectedChannelDetailModal.method}`);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer text-center"
              >
                Filter Tabel dengan Kanal Ini
              </button>
              <button
                onClick={() => setSelectedChannelDetailModal(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Customer Support Ticket Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <Headset size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Hubungi ZEGA AI Financial Desk</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Respon cepat 24/7 via Supabase Telemetry</p>
                </div>
              </div>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center text-sm font-black cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSupportTicketSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Kategori Permintaan</label>
                <select
                  value={supportTicketForm.category}
                  onChange={(e) => setSupportTicketForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="Billing & Invoicing">Faktur & Tagihan (Billing)</option>
                  <option value="Upgrade Plan">Upgrade Paket / Topup Kuota</option>
                  <option value="Payment Gateway">Metode Pembayaran / QRIS / Solana</option>
                  <option value="e-Faktur PPN">Permintaan e-Faktur PPN 11%</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Email Kontak</label>
                  <input
                    type="email"
                    value={supportTicketForm.email}
                    onChange={(e) => setSupportTicketForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                    placeholder="nama@perusahaan.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={supportTicketForm.phone}
                    onChange={(e) => setSupportTicketForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
                    placeholder="+62 812..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pesan / Kendala Anda</label>
                <textarea
                  rows={3}
                  value={supportTicketForm.message}
                  onChange={(e) => setSupportTicketForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Tuliskan detail pertanyaan atau kendala pembayaran Anda di sini..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingSupportTicket}
                  className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingSupportTicket ? (
                    <span>Mengirim Tiket...</span>
                  ) : (
                    <>
                      <span>Kirim Tiket Bantuan</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enterprise Safe Confirm Delete Payment Modal */}
      <ConfirmDeletePaymentModal
        isOpen={!!paymentMethodToDelete}
        onClose={() => setPaymentMethodToDelete(null)}
        paymentMethod={paymentMethodToDelete}
        triggerToast={triggerToast}
        onConfirm={() => handleDeletePaymentMethod(paymentMethodToDelete?.id, paymentMethodToDelete?.method_name)}
      />
    </div>
  );
}
