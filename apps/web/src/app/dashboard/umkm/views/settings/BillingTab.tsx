import React, { useState, useEffect } from 'react';
import { Download, Check, Sparkles, CreditCard, Plus, HelpCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface BillingTabProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function BillingTab({ triggerToast }: BillingTabProps) {
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // States from Supabase
  const [billingOverview, setBillingOverview] = useState<any>({
    plan_name: 'Growth',
    plan_status: 'Aktif',
    expires_at: '2026-08-01 00:00:00+00',
    ai_credits_used: 3340,
    ai_credits_total: 5000,
    ai_employees_used: 10,
    ai_employees_total: 20,
    automation_used: 24,
    automation_total: -1,
    storage_used_gb: 12.4,
    storage_total_gb: 50.0,
    primary_payment_brand: 'Stripe',
    primary_payment_card: 'Visa •••• 4242',
    primary_payment_expiry: 'Kedaluwarsa 12/28'
  });

  const [invoices, setInvoices] = useState<any[]>([
    { invoice_number: 'INV-2026-0721', period: '1 - 31 Jul 2026', total_amount_idr: 299000, status: 'Lunas' },
    { invoice_number: 'INV-2026-0621', period: '1 - 30 Jun 2026', total_amount_idr: 299000, status: 'Lunas' },
    { invoice_number: 'INV-2026-0521', period: '1 - 31 Mei 2026', total_amount_idr: 299000, status: 'Lunas' },
    { invoice_number: 'INV-2026-0421', period: '1 - 30 Apr 2026', total_amount_idr: 299000, status: 'Lunas' },
    { invoice_number: 'INV-2026-0321', period: '1 - 31 Mar 2026', total_amount_idr: 299000, status: 'Lunas' }
  ]);

  const [transactions, setTransactions] = useState<any[]>([
    { transaction_date: '28 Jul 2026 16:21', description: 'Pembayaran Invoice', method: 'Stripe', amount_usd: 12.90, status: 'Berhasil' },
    { transaction_date: '28 Jun 2026 09:15', description: 'Pembayaran Invoice', method: 'Stripe', amount_usd: 12.90, status: 'Berhasil' },
    { transaction_date: '28 Mei 2026 14:40', description: 'Pembayaran Invoice', method: 'Stripe', amount_usd: 12.90, status: 'Berhasil' },
    { transaction_date: '27 Apr 2026 11:32', description: 'Pembayaran Invoice', method: 'Stripe', amount_usd: 12.90, status: 'Berhasil' },
    { transaction_date: '28 Mar 2026 10:08', description: 'Pembayaran Invoice', method: 'Stripe', amount_usd: 12.90, status: 'Berhasil' }
  ]);

  const stripeLogoUrl = getR2CdnUrl('/assets/logo/stripe.webp');
  const [stripeSrc, setStripeSrc] = useState(stripeLogoUrl);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmBillingOverviewData();
      if (data.overview) setBillingOverview(data.overview);
      if (data.invoices && data.invoices.length > 0) setInvoices(data.invoices);
      if (data.transactions && data.transactions.length > 0) setTransactions(data.transactions);
    } catch (e) {
      console.warn('Billing load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleDownloadInvoice = (invNum: string) => {
    setDownloadingId(invNum);
    setTimeout(() => {
      setDownloadingId(null);
      triggerToast(`✓ Invoice ${invNum} berhasil diunduh (PDF)!`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* 3 Top Cards Grid matching Layout 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Paket Aktif */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Paket Aktif</h4>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{billingOverview.plan_name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                {billingOverview.plan_status}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Berakhir pada 1 Agustus 2026</p>

            <ul className="space-y-1.5 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-orange-500 shrink-0" />
                <span>20 AI Employees</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-orange-500 shrink-0" />
                <span>5.000 AI Credits / bulan</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-orange-500 shrink-0" />
                <span>Unlimited Automation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-orange-500 shrink-0" />
                <span>Priority Support</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => triggerToast('✓ Membuka Manajer Paket Subskripsi...')}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Kelola Paket
          </button>
        </div>

        {/* 2. Ringkasan Penggunaan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Ringkasan Penggunaan (1 - 30 Juli 2026)</h4>
            
            <div className="space-y-3 pt-1 text-xs">
              {/* AI Credits */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  <span>AI Credits</span>
                  <span>{billingOverview.ai_credits_used} / {billingOverview.ai_credits_total} ({Math.round((billingOverview.ai_credits_used / billingOverview.ai_credits_total) * 100)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(billingOverview.ai_credits_used / billingOverview.ai_credits_total) * 100}%` }}
                  />
                </div>
              </div>

              {/* AI Employees */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  <span>AI Employees</span>
                  <span>{billingOverview.ai_employees_used} / {billingOverview.ai_employees_total} ({Math.round((billingOverview.ai_employees_used / billingOverview.ai_employees_total) * 100)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(billingOverview.ai_employees_used / billingOverview.ai_employees_total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Automation */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  <span>Automation</span>
                  <span>{billingOverview.automation_used} / ∞</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-full" />
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  <span>Storage</span>
                  <span>{billingOverview.storage_used_gb} GB / {billingOverview.storage_total_gb} GB ({Math.round((billingOverview.storage_used_gb / billingOverview.storage_total_gb) * 100)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(billingOverview.storage_used_gb / billingOverview.storage_total_gb) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => triggerToast('✓ Memuat analisis penggunaan lengkap...')}
            className="text-xs font-extrabold text-orange-500 hover:underline cursor-pointer"
          >
            Lihat Detail Usage →
          </button>
        </div>

        {/* 3. Metode Pembayaran Utama */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Metode Pembayaran Utama</h4>
            
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={stripeSrc}
                  onError={() => setStripeSrc('/assets/logo/stripe.webp')}
                  alt="Stripe"
                  className="size-8 object-contain rounded-lg"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{billingOverview.primary_payment_card}</h5>
                  <p className="text-[10px] text-slate-400 font-medium">{billingOverview.primary_payment_expiry}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                Utama
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => triggerToast('✓ Membuka Pengaturan Metode Pembayaran...')}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Kelola Pembayaran
            </button>
            <button
              onClick={() => triggerToast('✓ Membuka Form Tambah Metode Pembayaran...')}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus size={13} /> Tambah Metode Pembayaran
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Tables: Riwayat Invoice & Riwayat Transaksi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Riwayat Invoice */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Riwayat Invoice</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                  <th className="pb-2">Invoice</th>
                  <th className="pb-2">Periode</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {invoices.map((inv, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                    <td className="py-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                    <td className="py-2.5 text-slate-500">{inv.period}</td>
                    <td className="py-2.5 text-slate-900 dark:text-slate-100 font-semibold">Rp {Number(inv.total_amount_idr).toLocaleString('id-ID')}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv.invoice_number)}
                        className="p-1 rounded-lg text-slate-400 hover:text-orange-500 cursor-pointer"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => triggerToast('✓ Memuat semua daftar invoice...')}
              className="text-xs font-extrabold text-orange-500 hover:underline cursor-pointer"
            >
              Lihat Semua Invoice →
            </button>
          </div>
        </div>

        {/* 5. Riwayat Transaksi */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">Riwayat Transaksi</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                  <th className="pb-2">Tanggal</th>
                  <th className="pb-2">Deskripsi</th>
                  <th className="pb-2">Metode</th>
                  <th className="pb-2">Jumlah</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {transactions.map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                    <td className="py-2.5 text-[11px] text-slate-400">{tx.transaction_date}</td>
                    <td className="py-2.5 text-slate-900 dark:text-slate-100 font-semibold">{tx.description}</td>
                    <td className="py-2.5 text-slate-500">{tx.method}</td>
                    <td className="py-2.5 text-slate-900 dark:text-slate-100 font-bold">USD {Number(tx.amount_usd).toFixed(2)}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => triggerToast('✓ Memuat semua log transaksi...')}
              className="text-xs font-extrabold text-orange-500 hover:underline cursor-pointer"
            >
              Lihat Semua Transaksi →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Support Banner */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-slate-400" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Butuh bantuan dengan billing?</h4>
            <p className="text-[10px] text-slate-400">Kunjungi Pusat Bantuan kami atau hubungi tim support.</p>
          </div>
        </div>

        <button
          onClick={() => triggerToast('✓ Mengarahkan ke Tim Support Billing...')}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
        >
          Hubungi Support
        </button>
      </div>
    </div>
  );
}
