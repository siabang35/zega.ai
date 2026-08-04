import React, { useState, useEffect } from 'react';
import { 
  Check, CreditCard, Plus, ArrowRight, Download, ShieldCheck, 
  ExternalLink, Sparkles, CheckCircle2, ArrowDownRight, RefreshCw,
  BarChart2, Headset, ChevronDown, Clock, Layers, Filter, Search, FileText, History, Settings
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { 
  UpgradePlanModal, AddPaymentMethodModal, UsageDetailModal, InvoiceDetailModal 
} from './billing/BillingModals';

interface BillingViewProps {
  triggerToast: (msg: string) => void;
}

export function BillingView({ triggerToast }: BillingViewProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [trendRange, setTrendRange] = useState('30 Hari Terakhir');

  // Modals state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<any | null>(null);

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
      plan_name: 'Growth',
      status: 'Aktif',
      expires_at: '2026-08-01 00:00:00+00',
      monthly_price_idr: 299000,
      tax_pct: 11,
      credits_remaining: 3240,
      credits_limit: 5000,
      credits_pct: 64
    },
    paymentMethods: [
      { id: 'b1', method_name: 'Stripe •••• 4242', method_type: 'Kartu Kredit', card_last4: '4242', exp_date: '12/28', is_primary: true, status: 'Utama', icon_key: 'stripe' },
      { id: 'b2', method_name: 'QRIS (VA)', method_type: 'Virtual Account', card_last4: null, exp_date: null, is_primary: false, status: 'Aktif', icon_key: 'qris' },
      { id: 'b3', method_name: 'GoPay', method_type: 'E-Wallet', card_last4: null, exp_date: null, is_primary: false, status: 'Aktif', icon_key: 'gopay' },
      { id: 'b4', method_name: 'DANA', method_type: 'E-Wallet', card_last4: null, exp_date: null, is_primary: false, status: 'Aktif', icon_key: 'dana' },
      { id: 'b5', method_name: 'OVO', method_type: 'E-Wallet', card_last4: null, exp_date: null, is_primary: false, status: 'Aktif', icon_key: 'ovo' }
    ],
    usage: [
      { metric_key: 'credits', metric_label: 'AI Credits', current_value_label: '3.240', limit_value_label: '5.000', percentage: 64 },
      { metric_key: 'employees', metric_label: 'AI Employees', current_value_label: '7', limit_value_label: '10', percentage: 70 },
      { metric_key: 'automation', metric_label: 'Automation', current_value_label: '24', limit_value_label: '∞', percentage: 40 },
      { metric_key: 'storage', metric_label: 'Storage', current_value_label: '12.4 GB', limit_value_label: '50 GB', percentage: 25 }
    ],
    invoices: [
      { invoice_number: 'INV-2026-0721', period_label: 'Growth Plan - Juli 2026', total_amount_idr: 299000, status: 'Lunas' },
      { invoice_number: 'INV-2026-0621', period_label: 'Growth Plan - Juni 2026', total_amount_idr: 299000, status: 'Lunas' },
      { invoice_number: 'INV-2026-0521', period_label: 'Growth Plan - Mei 2026', total_amount_idr: 299000, status: 'Lunas' },
      { invoice_number: 'INV-2026-0421', period_label: 'Growth Plan - April 2026', total_amount_idr: 299000, status: 'Lunas' },
      { invoice_number: 'INV-2026-0321', period_label: 'Growth Plan - Maret 2026', total_amount_idr: 299000, status: 'Lunas' }
    ],
    transactions: [
      { txn_hash: 'TXN-7f3...a8b2', txn_date_label: '28 Jul 2026, 16:21', payment_method: 'stripe •••• 4242', amount_crypto: 'USDC 2.50', status: 'Berhasil' },
      { txn_hash: 'TXN-8a1...c304', txn_date_label: '28 Jul 2026, 09:15', payment_method: 'QRIS (VA)', amount_crypto: 'USDC -1.20', status: 'Berhasil' },
      { txn_hash: 'TXN-3c2...f6e7', txn_date_label: '27 Jul 2026, 14:45', payment_method: 'GoPay', amount_crypto: 'USDC -0.80', status: 'Berhasil' },
      { txn_hash: 'TXN-9d4...e8f1', txn_date_label: '27 Jul 2026, 11:32', payment_method: 'DANA', amount_crypto: 'USDC -3.00', status: 'Berhasil' },
      { txn_hash: 'TXN-1b7...d5c9', txn_date_label: '26 Jul 2026, 10:08', payment_method: 'OVO', amount_crypto: 'USDC 1.50', status: 'Berhasil' }
    ]
  });

  // Fetch Consolidated Billing Overview from Supabase
  const loadBillingOverview = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmBillingOverview();
      if (data) {
        setBillingData((prev: any) => ({
          ...prev,
          plan: data.plan || prev.plan,
          paymentMethods: data.paymentMethods?.length > 0 ? data.paymentMethods : prev.paymentMethods,
          usage: data.usage?.length > 0 ? data.usage : prev.usage,
          invoices: data.invoices?.length > 0 ? data.invoices : prev.invoices,
          transactions: data.transactions?.length > 0 ? data.transactions : prev.transactions
        }));
      }
    } catch (e) {
      console.warn('Billing fetch error:', e);
    }
  };

  useEffect(() => {
    loadBillingOverview();
    const unsubscribe = SupabaseDashboardService.subscribeToBillingRealtime(() => {
      loadBillingOverview();
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header & Page Subtitle */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Billing & Subscription
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
          Kelola langganan, penggunaan, dan metode pembayaran Anda.
        </p>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        {['Overview', 'Invoice', 'Usage', 'Payment Methods', 'History', 'Settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 cursor-pointer transition-colors relative border-b-2 ${
              activeTab === tab
                ? 'border-orange-500 text-slate-900 dark:text-slate-100 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT IMPLEMENTATION */}
      {activeTab === 'Invoice' ? (
        /* Full Invoice Tab View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Daftar Tagihan & Invoice</h3>
              <p className="text-xs text-slate-400">Riwayat faktur langganan dan bukti pembayaran</p>
            </div>
            <button 
              onClick={() => triggerToast('✓ Berhasil mengekspor semua invoice ke CSV')}
              className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Download size={14} /> Ekspor Semua (CSV)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="pb-3">INVOICE</th>
                  <th className="pb-3">PERIODE</th>
                  <th className="pb-3">TOTAL TAGIHAN</th>
                  <th className="pb-3">STATUS</th>
                  <th className="pb-3 text-right">UNDUH INVOICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {billingData.invoices.map((inv: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                    <td className="py-3 text-slate-500">{inv.period_label}</td>
                    <td className="py-3 font-extrabold text-slate-900 dark:text-slate-100">
                      Rp{Number(inv.total_amount_idr || 299000).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => setSelectedInvoiceForDetail(inv)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:bg-orange-500 hover:text-white cursor-pointer transition-all"
                      >
                        Unduh PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'Payment Methods' ? (
        /* Full Payment Methods Tab View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Metode Pembayaran Tersimpan</h3>
              <p className="text-xs text-slate-400">Kelola kartu, QRIS, dan e-wallet untuk perpanjangan otomatis</p>
            </div>
            <button 
              onClick={() => setIsAddPaymentModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> Tambah Metode Baru
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {billingData.paymentMethods.map((pm: any) => (
              <div key={pm.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 font-bold text-xs shadow-xs">
                      <PaymentBrandLogo iconKey={pm.icon_key || pm.method_name} className="h-5 w-auto object-contain" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{pm.method_name}</h4>
                      <span className="text-[10px] text-slate-400">{pm.method_type}</span>
                    </div>
                  </div>
                  {pm.is_primary && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-extrabold">
                      Utama
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400">Status: {pm.status}</span>
                  <button 
                    onClick={() => triggerToast(`✓ ${pm.method_name} diset sebagai metode utama`)}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Atur Sebagai Utama
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'History' ? (
        /* Full History Tab View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Riwayat Transaksi Settlement (x402 & FIAT)</h3>
              <p className="text-xs text-slate-400">Log lengkap transaksi mesin-ke-mesin dan gateway pembayaran</p>
            </div>
            <button 
              onClick={() => triggerToast('✓ Log transaksi berhasil diperbarui!')}
              className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Refresh Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="pb-3">TRANSAKSI HASH</th>
                  <th className="pb-3">TANGGAL</th>
                  <th className="pb-3">METODE PEMBAYARAN</th>
                  <th className="pb-3">NOMINAL (USDC)</th>
                  <th className="pb-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                {billingData.transactions.map((tx: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{tx.txn_hash}</td>
                    <td className="py-3 text-slate-500">{tx.txn_date_label}</td>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{tx.payment_method}</td>
                    <td className="py-3 font-extrabold text-slate-900 dark:text-slate-100">{tx.amount_crypto}</td>
                    <td className="py-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'Usage' ? (
        /* Usage Tab View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Pantau Pemakaian Kuota Fitur</h3>
              <p className="text-xs text-slate-400">Rincian penggunaan AI Credits, AI Employees, Automation, dan Storage</p>
            </div>
            <button 
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Tambah Kuota / Upgrade
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {billingData.usage.map((u: any, i: number) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-black text-slate-900 dark:text-slate-100">{u.metric_label}</span>
                  <span className="font-mono text-slate-500 font-bold text-xs">
                    {u.current_value_label} / {u.limit_value_label} ({u.percentage || 0}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${u.percentage || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'Settings' ? (
        /* Settings Tab View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Pengaturan Tagihan & Faktur</h3>
            <p className="text-xs text-slate-400">Informasi NPWP toko, alamat penerbitan invoice, dan email notifikasi</p>
          </div>

          <div className="space-y-4 max-w-lg text-xs font-semibold">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">Nama Badan Usaha / Toko</label>
              <input type="text" defaultValue="Toko CikCik Berluk (STORE-DEMO-1283)" className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">Email Penerima Faktur</label>
              <input type="email" defaultValue="cikberluk@gmail.com" className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold" />
            </div>
            <button onClick={() => triggerToast('✓ Pengaturan billing berhasil disimpan')} className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs cursor-pointer">
              Simpan Pengaturan
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
                <span className="text-[10px] font-bold text-slate-400">Paket Aktif</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{billingData.plan.plan_name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[9px] font-extrabold">
                    {billingData.plan.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Berakhir pada 1 Agustus 2026</p>
              </div>
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs transition-all"
              >
                Kelola Paket
              </button>
            </div>

            {/* Card 2: Total Tagihan Bulan Ini */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Total Tagihan Bulan Ini</span>
                <div className="pt-0.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    Rp{Number(billingData.plan.monthly_price_idr || 299000).toLocaleString('id-ID')}
                  </h2>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Termasuk PPN {billingData.plan.tax_pct || 11}%</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight size={12} />
                <span>0% dari bulan lalu</span>
              </div>
            </div>

            {/* Card 3: AI Credits Tersisa */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400">AI Credits Tersisa</span>
                <div className="pt-0.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {billingData.plan.credits_remaining?.toLocaleString('id-ID') || '3.240'} / {billingData.plan.credits_limit?.toLocaleString('id-ID') || '5.000'}
                  </h2>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${billingData.plan.credits_pct || 64}%` }} />
                </div>
              </div>
              <button 
                onClick={() => setIsUsageModalOpen(true)}
                className="text-left text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Lihat Detail Usage
              </button>
            </div>

            {/* Card 4: Metode Pembayaran Utama */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Metode Pembayaran Utama</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">•••• 4242</h2>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 text-[9px] font-extrabold">
                    stripe
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Kadaluarsa 12/28</p>
              </div>
              <button 
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="text-left text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Kelola Pembayaran
              </button>
            </div>

            {/* Card 5: Status Pembayaran */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Status Pembayaran</span>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-base pt-0.5">
                  <CheckCircle2 size={18} />
                  <span>Aman</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Semua pembayaran terbaru</p>
              </div>
              <button 
                onClick={() => setActiveTab('History')}
                className="text-left text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Lihat Riwayat
              </button>
            </div>

          </div>

          {/* 4. Middle Section: Ringkasan Penggunaan, Trend Penggunaan, & Rocket Upgrade Card */}
          <div className="grid lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Ringkasan Penggunaan (col-span-3) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Ringkasan Penggunaan</h3>
                  <span className="text-[9px] text-slate-400 font-medium">1 - 30 Juli 2026</span>
                </div>

                <div className="space-y-3.5">
                  {billingData.usage.map((u: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{u.metric_label}</span>
                        <span className="font-mono text-[10px] text-slate-500 font-bold">
                          {u.current_value_label} / {u.limit_value_label} {u.percentage ? `(${u.percentage}%)` : ''}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${u.percentage || 40}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setIsUsageModalOpen(true)}
                className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer pt-2"
              >
                <span>Lihat Semua Usage</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Trend Penggunaan SVG Chart (col-span-5) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Trend Penggunaan</h3>
                  <select 
                    value={trendRange}
                    onChange={(e) => setTrendRange(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="30 Hari Terakhir">30 Hari Terakhir</option>
                    <option value="7 Hari Terakhir">7 Hari Terakhir</option>
                    <option value="90 Hari Terakhir">90 Hari Terakhir</option>
                  </select>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-600 dark:text-slate-400 mb-4">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-orange-500" /> AI Credits</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> AI Employees</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Automation</span>
                </div>

                {/* Interactive SVG Chart */}
                <div className="h-44 w-full relative flex items-end pt-4 pb-6">
                  {/* Y Axis Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between text-[9px] font-mono text-slate-300 pointer-events-none">
                    <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>8K</span></div>
                    <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>6K</span></div>
                    <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>4K</span></div>
                    <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>2K</span></div>
                    <div className="border-b border-slate-100 dark:border-slate-800/80 w-full flex justify-between"><span>0</span></div>
                  </div>

                  {/* Chart SVG */}
                  <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 400 120">
                    <defs>
                      <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Areas */}
                    <path d="M 10 90 L 80 85 L 150 50 L 220 70 L 290 35 L 370 45 L 370 120 L 10 120 Z" fill="url(#orangeGrad)" />
                    <path d="M 10 100 L 80 95 L 150 75 L 220 80 L 290 60 L 370 50 L 370 120 L 10 120 Z" fill="url(#blueGrad)" />
                    <path d="M 10 70 L 80 65 L 150 45 L 220 55 L 290 25 L 370 30 L 370 120 L 10 120 Z" fill="url(#emeraldGrad)" />

                    {/* AI Credits (Orange Line) */}
                    <path
                      d="M 10 90 L 80 85 L 150 50 L 220 70 L 290 35 L 370 45"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* AI Employees (Blue Line) */}
                    <path
                      d="M 10 100 L 80 95 L 150 75 L 220 80 L 290 60 L 370 50"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Automation (Green Line) */}
                    <path
                      d="M 10 70 L 80 65 L 150 45 L 220 55 L 290 25 L 370 30"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Data Points - Orange */}
                    {[[10,90], [80,85], [150,50], [220,70], [290,35], [370,45]].map(([cx, cy], i) => (
                      <circle key={`o-${i}`} cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#f97316" strokeWidth="2.5" className="hover:r-6 transition-all cursor-pointer" />
                    ))}

                    {/* Data Points - Blue */}
                    {[[10,100], [80,95], [150,75], [220,80], [290,60], [370,50]].map(([cx, cy], i) => (
                      <circle key={`b-${i}`} cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" className="hover:r-6 transition-all cursor-pointer" />
                    ))}

                    {/* Data Points - Emerald */}
                    {[[10,70], [80,65], [150,45], [220,55], [290,25], [370,30]].map(([cx, cy], i) => (
                      <circle key={`e-${i}`} cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" className="hover:r-6 transition-all cursor-pointer" />
                    ))}
                  </svg>

                  {/* X Axis Labels */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between text-[9px] font-mono text-slate-400 px-2">
                    <span>1 Jul</span>
                    <span>8 Jul</span>
                    <span>15 Jul</span>
                    <span>22 Jul</span>
                    <span>29 Jul</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Yakin mau upgrade? Rocket Banner (col-span-4) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between relative overflow-hidden group">
              <div className="space-y-3 z-10 max-w-[62%]">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Yakin mau upgrade?</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                    Tingkatkan paket untuk mendapatkan lebih banyak fitur dan kapasitas.
                  </p>
                </div>

                <ul className="space-y-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 flex-shrink-0" /> <span>Lebih banyak AI Credits</span></li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 flex-shrink-0" /> <span>AI Employees tanpa batas</span></li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 flex-shrink-0" /> <span>Automation tanpa batas</span></li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 flex-shrink-0" /> <span>Penyimpanan lebih besar</span></li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500 flex-shrink-0" /> <span>Priority Support</span></li>
                </ul>

                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="mt-2 px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <span>Upgrade Sekarang</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* 3D Rocket Image Floating on the Right with Local Fallback */}
              <div className="absolute right-[-10px] bottom-[-10px] top-[-10px] w-[45%] flex items-center justify-center pointer-events-none">
                <img 
                  src={rocketSrc} 
                  onError={() => setRocketSrc('/design/dashboard_umkm/billing/rocket.png')}
                  alt="Rocket Upgrade" 
                  className="h-[115%] w-auto object-contain drop-shadow-xl transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

          </div>

          {/* 5. Tables Row: Riwayat Tagihan & Transaksi Terakhir */}
          <div className="grid lg:grid-cols-12 gap-5">
            
            {/* Left Column: Riwayat Tagihan (col-span-6) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Riwayat Tagihan</h3>
                <button 
                  onClick={() => setActiveTab('Invoice')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="pb-2">INVOICE</th>
                      <th className="pb-2">PERIODE</th>
                      <th className="pb-2">TOTAL</th>
                      <th className="pb-2">STATUS</th>
                      <th className="pb-2 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    {billingData.invoices.map((inv: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                        <td className="py-2.5 text-slate-500">{inv.period_label}</td>
                        <td className="py-2.5 font-extrabold text-slate-900 dark:text-slate-100">
                          Rp{Number(inv.total_amount_idr || 299000).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold">
                            {inv.status}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Transaksi Terakhir (col-span-6) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Transaksi Terakhir</h3>
                <button 
                  onClick={() => setActiveTab('History')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="pb-2">TRANSAKSI</th>
                      <th className="pb-2">TANGGAL</th>
                      <th className="pb-2">METODE</th>
                      <th className="pb-2">JUMLAH</th>
                      <th className="pb-2 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    {billingData.transactions.map((tx: any, i: number) => (
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
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* 6. Bottom Row: Aksi Cepat (5 Action Cards) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Aksi Cepat</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              
              {/* Action 1: Download Invoice */}
              <div 
                onClick={() => {
                  if (billingData.invoices?.length > 0) {
                    setSelectedInvoiceForDetail(billingData.invoices[0]);
                  } else {
                    triggerToast('✓ Unduh Invoice terbaru berhasil!');
                  }
                }}
                className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 cursor-pointer shadow-xs transition-all flex items-center gap-3 group"
              >
                <div className="size-9 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0 font-black">
                  <Download size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                    Download Invoice
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Unduh invoice terbaru</p>
                </div>
              </div>

              {/* Action 2: Ubah Paket */}
              <div 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 cursor-pointer shadow-xs transition-all flex items-center gap-3 group"
              >
                <div className="size-9 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0 font-black">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                    Ubah Paket
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Pilih paket yang sesuai</p>
                </div>
              </div>

              {/* Action 3: Tambah Metode */}
              <div 
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 cursor-pointer shadow-xs transition-all flex items-center gap-3 group"
              >
                <div className="size-9 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center flex-shrink-0 font-black">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                    Tambah Metode
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Kartu, e-wallet, atau VA</p>
                </div>
              </div>

              {/* Action 4: Lihat Usage Detail */}
              <div 
                onClick={() => setIsUsageModalOpen(true)}
                className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 cursor-pointer shadow-xs transition-all flex items-center gap-3 group"
              >
                <div className="size-9 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0 font-black">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                    Lihat Usage Detail
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Pantau penggunaan</p>
                </div>
              </div>

              {/* Action 5: Hubungi Support */}
              <div 
                onClick={() => triggerToast('Menghubungkan ke Tim Support ZEGA AI...')}
                className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 cursor-pointer shadow-xs transition-all flex items-center gap-3 group"
              >
                <div className="size-9 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0 font-black">
                  <Headset size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                    Hubungi Support
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Butuh bantuan?</p>
                </div>
              </div>

            </div>

            {/* Footer Payment Gateway Logos Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  Semua pembayaran diproses secara aman melalui Stripe, Midtrans, QRIS, GoPay, DANA, OVO, atau x402 Network.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <PaymentBrandLogo iconKey="stripe" className="h-4 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                <PaymentBrandLogo iconKey="midtrans" className="h-4 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                <PaymentBrandLogo iconKey="qris" className="h-4 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                <PaymentBrandLogo iconKey="gopay" className="h-4 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                <PaymentBrandLogo iconKey="dana" className="h-4 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                <PaymentBrandLogo iconKey="ovo" className="h-4 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                <PaymentBrandLogo iconKey="usdc" className="h-4 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
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

      {selectedInvoiceForDetail && (
        <InvoiceDetailModal
          isOpen={true}
          onClose={() => setSelectedInvoiceForDetail(null)}
          invoice={selectedInvoiceForDetail}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
}
