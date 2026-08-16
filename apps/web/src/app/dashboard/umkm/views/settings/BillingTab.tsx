import React, { useState, useEffect } from 'react';
import {
  Download, Check, Sparkles, CreditCard, Plus, HelpCircle, ExternalLink, RefreshCw,
  Shield, AlertCircle, CheckCircle2, Zap, ArrowRight, X, Search, Filter, MessageSquare, Send,
  Edit2, Trash2, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';

interface BillingTabProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function BillingTab({ triggerToast, onNavigateTab }: BillingTabProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Database States
  const [billingOverview, setBillingOverview] = useState<any>({
    plan_name: 'Free',
    plan_status: 'Inactive',
    expires_at: null,
    ai_credits_used: 0,
    ai_credits_total: 0,
    ai_employees_used: 0,
    ai_employees_total: 0,
    automation_used: 0,
    automation_total: 0,
    storage_used_gb: 0,
    storage_total_gb: 0,
    primary_payment_brand: 'Stripe',
    primary_payment_card: 'No card connected',
    primary_payment_expiry: '-'
  });

  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isManagePaymentModalOpen, setIsManagePaymentModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isAllInvoicesModalOpen, setIsAllInvoicesModalOpen] = useState(false);
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Seamless Inline Expand/Collapse Toggle State for History Tables
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Form states
  const [newCardBrand, setNewCardBrand] = useState('Stripe');
  const [newCardLast4, setNewCardLast4] = useState('');
  const [newCardExpMonth, setNewCardExpMonth] = useState(12);
  const [newCardExpYear, setNewCardExpYear] = useState(2028);

  // Edit Card states
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editExpMonth, setEditExpMonth] = useState(12);
  const [editExpYear, setEditExpYear] = useState(2028);
  const [editCardType, setEditCardType] = useState('Visa');

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportPriority, setSupportPriority] = useState('Tinggi');

  const [searchInvoice, setSearchInvoice] = useState('');
  const [searchTx, setSearchTx] = useState('');

  const stripeLogoUrl = getR2CdnUrl('/assets/logo/stripe.webp');
  const [stripeSrc, setStripeSrc] = useState(stripeLogoUrl);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmBillingOverviewData();
      if (data.overview) setBillingOverview(data.overview);
      if (data.invoices && data.invoices.length > 0) setInvoices(data.invoices);
      if (data.transactions && data.transactions.length > 0) setTransactions(data.transactions);
      if (data.paymentMethods && data.paymentMethods.length > 0) setPaymentMethods(data.paymentMethods);
    } catch (e) {
      console.warn('Billing load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();

    // Subscribe to realtime changes
    const unsubscribe = SupabaseDashboardService.subscribeToBillingRealtime(undefined as any, () => {
      loadBillingData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDownloadInvoice = (invNum: string) => {
    setDownloadingId(invNum);
    
    // Find target invoice details or construct zero-state fallback
    const targetInv = invoices.find((inv) => inv.invoice_number === invNum) || {
      invoice_number: invNum,
      period: '-',
      total_amount_idr: 0,
      status: 'Lunas',
      e_faktur_no: '-'
    };

    const invoiceHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Invoice & e-Faktur - ${targetInv.invoice_number}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; padding: 40px; background: #fff; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #f97316; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: 900; color: #0f172a; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .badge { background: #dcfce7; color: #15803d; font-size: 12px; font-weight: bold; padding: 6px 14px; border-radius: 20px; border: 1px solid #86efac; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
    .meta-item label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; }
    .meta-item div { font-size: 14px; font-weight: bold; color: #1e293b; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; background: #f1f5f9; padding: 12px; font-size: 11px; text-transform: uppercase; color: #475569; }
    td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .total-row td { font-weight: 900; font-size: 16px; color: #0f172a; border-top: 2px solid #cbd5e1; }
    .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">ZEGA AI Platform</div>
      <div class="subtitle">PT ZEGA Artificial Intelligence Indonesia • Tax ID: 01.394.881.2-028.000</div>
    </div>
    <div>
      <span class="badge">LUNAS / PAID</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <label>Nomor Invoice</label>
      <div>${targetInv.invoice_number}</div>
    </div>
    <div class="meta-item">
      <label>Nomor Seri e-Faktur PPN (11%)</label>
      <div>${targetInv.e_faktur_no || '-'}</div>
    </div>
    <div class="meta-item">
      <label>Periode Langganan</label>
      <div>${targetInv.period || '-'}</div>
    </div>
    <div class="meta-item">
      <label>ID Merchant Store</label>
      <div>&lt;STORE_ID&gt;</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Deskripsi Layanan</th>
        <th>Kuantitas</th>
        <th>Harga Satuan</th>
        <th>Jumlah (IDR)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${targetInv.description || 'ZEGA AI Subscription'}</strong></td>
        <td>1 Bulan</td>
        <td>Rp ${((Number(targetInv.total_amount_idr) || 0) * 0.89).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
        <td>Rp ${((Number(targetInv.total_amount_idr) || 0) * 0.89).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
      </tr>
      <tr>
        <td><strong>PPN (11%)</strong></td>
        <td>11%</td>
        <td>Rp ${((Number(targetInv.total_amount_idr) || 0) * 0.11).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
        <td>Rp ${((Number(targetInv.total_amount_idr) || 0) * 0.11).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" style="text-align:right;">TOTAL PEMBAYARAN:</td>
        <td style="color:#f97316;">Rp ${(Number(targetInv.total_amount_idr) || 0).toLocaleString('id-ID')}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Dokumen elektronik ini merupakan bukti pembayaran sah dan Faktur Pajak Resmi ZEGA AI Platform.<br>
    Dicetak otomatis oleh Sistem ZEGA AI Realtime Invoicing.
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

    // 1. Open Printable PDF Invoice Window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
    }

    // 2. Trigger direct .pdf document download blob
    const pdfHeader = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj 4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj 5 0 obj<</Length 180>>stream\nBT /F1 16 Tf 50 750 TD (ZEGA AI Platform - Invoice & e-Faktur) Tj /F1 12 Tf 0 -25 TD (Invoice: ${targetInv.invoice_number}) Tj 0 -20 TD (e-Faktur: ${targetInv.e_faktur_no || '-'}) Tj 0 -20 TD (Total: Rp ${(Number(targetInv.total_amount_idr) || 0).toLocaleString('id-ID')}) Tj 0 -20 TD (Status: LUNAS / PAID) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\n0000000274 00000 n\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n505\n%%EOF`;
    
    const pdfBlob = new Blob([pdfHeader], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Invoice_eFaktur_${targetInv.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(pdfUrl);

    setTimeout(() => {
      setDownloadingId(null);
      triggerToast(`✓ ${t.settingsView?.billingTab?.toastDownloaded || 'Invoice PDF & e-Faktur download started!'}`);
    }, 600);
  };

  const handleSelectPlan = async (planName: string, credits: number, employees: number, storage: number) => {
    try {
      await SupabaseDashboardService.updateUmkmSubscriptionPlan({
        plan_name: planName,
        ai_credits_total: credits,
        ai_employees_total: employees,
        storage_total_gb: storage
      });
      triggerToast(`✓ ${t.settingsView?.billingTab?.toastPlanUpdated || 'Subscription plan successfully updated!'}`);
      setIsPlanModalOpen(false);
      loadBillingData();
    } catch (e) {
      triggerToast('✕ Gagal memperbarui paket.');
    }
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardLast4 || newCardLast4.length < 4) {
      triggerToast('✕ Harap masukkan 4 digit terakhir nomor kartu!');
      return;
    }

    try {
      await SupabaseDashboardService.addUmkmPaymentMethod({
        brand: newCardBrand,
        card_last4: newCardLast4,
        exp_month: Number(newCardExpMonth),
        exp_year: Number(newCardExpYear),
        card_type: 'Visa'
      });

      triggerToast('✓ Metode pembayaran baru tersimpan di Supabase!');
      setIsAddPaymentModalOpen(false);
      setNewCardLast4('');
      loadBillingData();
    } catch (e) {
      triggerToast('✕ Gagal menambahkan metode pembayaran.');
    }
  };

  const handleSetPrimaryPayment = async (pm: any) => {
    try {
      const cardText = `${pm.card_type || pm.brand || 'Visa'} •••• ${pm.card_last4}`;
      const cardExpiry = `Kedaluwarsa ${pm.exp_month}/${pm.exp_year}`;
      const ok = await SupabaseDashboardService.setPrimaryUmkmPaymentMethod(pm.id, cardText, cardExpiry);
      if (ok) {
        triggerToast(`✓ ${cardText} dijadikan Metode Pembayaran Utama!`);
        loadBillingData();
      } else {
        triggerToast('✕ Gagal mengubah metode pembayaran utama.');
      }
    } catch (e) {
      triggerToast('✕ Terjadi kesalahan saat mengubah metode pembayaran.');
    }
  };

  const handleDeletePayment = async (pmId: string, isDefault: boolean) => {
    if (isDefault) {
      triggerToast('✕ Kartu Utama tidak dapat dihapus! Atur kartu lain sebagai utama terlebih dahulu.');
      return;
    }
    if (!window.confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini dari akun Anda?')) {
      return;
    }
    try {
      const ok = await SupabaseDashboardService.deleteUmkmPaymentMethod(pmId);
      if (ok) {
        triggerToast('✓ Metode pembayaran berhasil dihapus dari Supabase!');
        loadBillingData();
      } else {
        triggerToast('✕ Gagal menghapus metode pembayaran.');
      }
    } catch (e) {
      triggerToast('✕ Terjadi kesalahan saat menghapus.');
    }
  };

  const handleStartEditPayment = (pm: any) => {
    setEditingPaymentId(pm.id);
    setEditExpMonth(pm.exp_month || 12);
    setEditExpYear(pm.exp_year || 2028);
    setEditCardType(pm.card_type || pm.brand || 'Visa');
  };

  const handleSaveEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaymentId) return;
    try {
      await SupabaseDashboardService.updateUmkmPaymentMethod(editingPaymentId, {
        exp_month: Number(editExpMonth),
        exp_year: Number(editExpYear),
        card_type: editCardType
      });
      triggerToast('✓ Perubahan metode pembayaran tersimpan!');
      setEditingPaymentId(null);
      loadBillingData();
    } catch (e) {
      triggerToast('✕ Gagal menyimpan perubahan.');
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) {
      triggerToast('✕ Harap isi subjek dan pesan tiket bantuan!');
      return;
    }

    try {
      await SupabaseDashboardService.submitUmkmBillingSupportTicket(
        undefined as any,
        supportSubject,
        'Billing & Invoicing',
        supportPriority,
        supportMessage
      );

      triggerToast('✓ Tiket bantuan billing telah terkirim! Tim ZEGA AI akan menghubungi Anda.');
      setIsSupportModalOpen(false);
      setSupportSubject('');
      setSupportMessage('');
    } catch (e) {
      triggerToast('✕ Gagal mengirim tiket bantuan.');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    (inv.invoice_number || '').toLowerCase().includes(searchInvoice.toLowerCase()) ||
    (inv.period || '').toLowerCase().includes(searchInvoice.toLowerCase())
  );

  const filteredTransactions = transactions.filter(tx =>
    (tx.description || '').toLowerCase().includes(searchTx.toLowerCase()) ||
    (tx.method || '').toLowerCase().includes(searchTx.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>{t.settingsView?.billingTab?.title || 'Billing & Subskripsi'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t.settingsView?.billingTab?.subtitle || 'Kelola paket langganan ZEGA AI, metode pembayaran, ringkasan penggunaan kuota, dan unduh e-Faktur resmi.'}
          </p>
        </div>

        <button
          onClick={loadBillingData}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{t.settingsView?.billingTab?.refreshBtn || 'Refresh Data'}</span>
        </button>
      </div>

      {/* 3 Top Cards Grid matching Enterprise Spec */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Paket Aktif */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">{t.settingsView?.billingTab?.activePlanTitle || 'Paket Aktif'}</h4>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{billingOverview.plan_name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                billingOverview.plan_status === 'Aktif' || billingOverview.plan_status === 'Active'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}>
                {billingOverview.plan_status === 'Aktif' || billingOverview.plan_status === 'Active'
                  ? (t.settingsView?.billingTab?.activeBadge || 'Active')
                  : (t.settingsView?.billingTab?.inactiveBadge || 'Inactive')}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{t.settingsView?.billingTab?.expiresOn || 'Berakhir pada'} {formatDate(billingOverview.expires_at)}</p>

            <ul className="space-y-1.5 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-orange-500 shrink-0" />
                <span>{billingOverview.ai_employees_total} {t.settingsView?.billingTab?.aiEmployees || 'AI Employees'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-orange-500 shrink-0" />
                <span>{(billingOverview.ai_credits_total || 5000).toLocaleString('id-ID')} {t.settingsView?.billingTab?.creditsPerMonth || 'AI Credits / bulan'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-orange-500 shrink-0" />
                <span>{t.settingsView?.billingTab?.unlimitedAutomation || 'Unlimited Automation Engine'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-orange-500 shrink-0" />
                <span>{t.settingsView?.billingTab?.prioritySupport || 'Priority Support 24/7 & e-Faktur'}</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {t.settingsView?.billingTab?.managePlanBtn || 'Kelola Paket'}
          </button>
        </div>

        {/* 2. Ringkasan Penggunaan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">{t.settingsView?.billingTab?.usageSummaryTitle || 'Ringkasan Penggunaan (Periode Berjalan)'}</h4>
            
            <div className="space-y-3.5 pt-1 text-xs">
              {/* AI Credits */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5"><Zap size={12} className="text-orange-500" /> {t.settingsView?.billingTab?.aiCredits || 'AI Credits'}</span>
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{billingOverview.ai_credits_used} / {billingOverview.ai_credits_total} ({Math.round((billingOverview.ai_credits_used / (billingOverview.ai_credits_total || 5000)) * 100)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (billingOverview.ai_credits_used / (billingOverview.ai_credits_total || 5000)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* AI Employees */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-purple-500" /> {t.settingsView?.billingTab?.aiEmployees || 'AI Employees'}</span>
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{billingOverview.ai_employees_used} / {billingOverview.ai_employees_total} ({Math.round((billingOverview.ai_employees_used / (billingOverview.ai_employees_total || 20)) * 100)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (billingOverview.ai_employees_used / (billingOverview.ai_employees_total || 20)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Automation */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-500" /> {t.settingsView?.billingTab?.automationEngine || 'Automation Engine'}</span>
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{billingOverview.automation_used} / Unlimited</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-full" />
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5"><ExternalLink size={12} className="text-blue-500" /> {t.settingsView?.billingTab?.r2Storage || 'R2 Storage'}</span>
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{billingOverview.storage_used_gb} GB / {billingOverview.storage_total_gb} GB ({Math.round((billingOverview.storage_used_gb / (billingOverview.storage_total_gb || 50)) * 100)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (billingOverview.storage_used_gb / (billingOverview.storage_total_gb || 50)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/dashboard/billing/usage');
                window.dispatchEvent(new Event('popstate'));
              }
              if (onNavigateTab) onNavigateTab('usage');
              setIsUsageModalOpen(true);
            }}
            className="text-xs font-bold text-orange-500 hover:underline cursor-pointer text-left flex items-center gap-1"
          >
            <span>{t.settingsView?.billingTab?.viewUsageDetail || 'Lihat Detail Usage (Billing & Plan)'}</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* 3. Metode Pembayaran Utama */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">{t.settingsView?.billingTab?.primaryPaymentTitle || 'Metode Pembayaran Utama'}</h4>
            </div>
            
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={stripeSrc}
                  onError={() => setStripeSrc('/assets/logo/stripe.webp')}
                  alt="Stripe"
                  className="size-8 object-contain rounded-lg"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {billingOverview.primary_payment_card === 'Belum ada kartu terhubung' || billingOverview.primary_payment_card === 'No card connected' || !billingOverview.primary_payment_card
                      ? (t.settingsView?.billingTab?.noCardConnected || 'No card connected')
                      : billingOverview.primary_payment_card}
                  </h5>
                  <p className="text-[10px] text-slate-400 font-medium">{billingOverview.primary_payment_expiry || '-'}</p>
                </div>
              </div>
              {billingOverview.primary_payment_card && billingOverview.primary_payment_card !== 'Belum ada kartu terhubung' && billingOverview.primary_payment_card !== 'No card connected' && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  {t.settingsView?.billingTab?.primaryBadge || 'Utama'}
                </span>
              )}
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/dashboard/billing/payment-methods');
                  window.dispatchEvent(new Event('popstate'));
                }
                if (onNavigateTab) onNavigateTab('payment-methods');
                setIsManagePaymentModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer text-center"
            >
              {t.settingsView?.billingTab?.managePaymentBtn || 'Kelola Pembayaran'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Tables: Riwayat Invoice & Riwayat Transaksi */}
      <div className="space-y-4">
        {/* Top Header & Unified Toggle Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.historyTitle || 'Riwayat Tagihan & Transaksi'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{t.settingsView?.billingTab?.historySubtitle || 'Daftar rekapan invoice tagihan dan riwayat transaksi pembayaran bisnis Anda.'}</p>
          </div>
          <button
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <span>{isHistoryExpanded ? (t.settingsView?.billingTab?.closeHistory || 'Tutup Riwayat') : `${t.settingsView?.billingTab?.openHistory || 'Buka Riwayat'} (${invoices.length + transactions.length})`}</span>
            <ChevronDown size={15} className={`transition-transform duration-300 ${isHistoryExpanded ? 'rotate-180 text-orange-500' : 'text-slate-500'}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 4. Riwayat Invoice */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.invoiceTabTitle || 'Riwayat Invoice'}</h3>
              <span className="text-[10px] text-slate-400 font-medium">{invoices.length} {t.settingsView?.billingTab?.invoiceUnit || 'Invoice'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                    <th className="pb-2">{t.settingsView?.billingTab?.colInvoice || 'Invoice'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colPeriod || 'Periode'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colTotal || 'Total'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colStatus || 'Status'}</th>
                    <th className="pb-2 text-right">{t.settingsView?.billingTab?.colAction || 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                        {t.settingsView?.billingTab?.noInvoices || 'Belum ada riwayat invoice.'}
                      </td>
                    </tr>
                  ) : (
                    (isHistoryExpanded ? invoices : invoices.slice(0, 3)).map((inv, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                        <td className="py-2.5 text-slate-500">{inv.period}</td>
                        <td className="py-2.5 text-slate-900 dark:text-slate-100 font-semibold">Rp {Number(inv.total_amount_idr).toLocaleString('id-ID')}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            {inv.status === 'Lunas' ? (t.settingsView?.billingTab?.statusPaid || 'Lunas') : inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDownloadInvoice(inv.invoice_number)}
                            disabled={downloadingId === inv.invoice_number}
                            className="p-1 rounded-lg text-slate-400 hover:text-orange-500 cursor-pointer"
                            title={t.settingsView?.billingTab?.downloadTooltip || 'Unduh Invoice PDF & e-Faktur'}
                          >
                            <Download size={14} className={downloadingId === inv.invoice_number ? 'animate-bounce' : ''} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Riwayat Transaksi */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.txTabTitle || 'Riwayat Transaksi'}</h3>
              <span className="text-[10px] text-slate-400 font-medium">{transactions.length} {t.settingsView?.billingTab?.txUnit || 'Transaksi'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                    <th className="pb-2">{t.settingsView?.billingTab?.colDate || 'Tanggal'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colDesc || 'Deskripsi'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colMethod || 'Metode'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colAmount || 'Jumlah'}</th>
                    <th className="pb-2 text-right">{t.settingsView?.billingTab?.colStatus || 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                        {t.settingsView?.billingTab?.noTx || 'Belum ada riwayat transaksi.'}
                      </td>
                    </tr>
                  ) : (
                    (isHistoryExpanded ? transactions : transactions.slice(0, 3)).map((tx, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                        <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                          {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </td>
                        <td className="py-2.5 text-slate-900 dark:text-slate-100 font-semibold">{tx.description}</td>
                        <td className="py-2.5 text-slate-500">{tx.method}</td>
                        <td className="py-2.5 text-slate-900 dark:text-slate-100 font-bold">USD {Number(tx.amount_usd).toFixed(2)}</td>
                        <td className="py-2.5 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            {tx.status}
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
      </div>

      {/* Bottom Support Banner */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-slate-400" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.settingsView?.billingTab?.helpBannerTitle || 'Butuh bantuan dengan billing?'}</h4>
            <p className="text-[10px] text-slate-400">{t.settingsView?.billingTab?.helpBannerDesc || 'Kunjungi Pusat Bantuan kami atau hubungi tim support finansial 24/7.'}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/dashboard/help');
              window.dispatchEvent(new Event('popstate'));
            }
            if (onNavigateTab) onNavigateTab('help');
            setIsSupportModalOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>{t.settingsView?.billingTab?.helpCenterBtn || 'Pusat Bantuan & Support'}</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Kelola Paket Subskripsi Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />
                <span>{t.settingsView?.billingTab?.modalPlanTitle || 'Pilih Paket Langganan ZEGA AI'}</span>
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 1. Starter Plan */}
              {(() => {
                const currentPlan = billingOverview.plan_name || 'Growth';
                const isStarterActive = currentPlan === 'Starter' || currentPlan === 'UMKM Starter';
                const isGrowthActive = currentPlan === 'Growth' || currentPlan === 'UMKM Pro' || currentPlan === 'Bisnis';
                const isProActive = currentPlan === 'Pro Enterprise' || currentPlan === 'Enterprise Ultra';

                return (
                  <>
                    <div className={`p-4 rounded-2xl border-2 space-y-3 flex flex-col justify-between relative transition-all ${
                      isStarterActive 
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'
                    }`}>
                      {isStarterActive && (
                        <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase">
                          {t.settingsView?.billingTab?.activeTag || 'Aktif Saat Ini'}
                        </span>
                      )}
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.starterPlan || 'Starter'}</h4>
                        <p className="text-[10px] text-slate-400">{t.settingsView?.billingTab?.forStarters || 'Untuk UMKM Pemula'}</p>
                        <div className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">Rp 99.000 <span className="text-[10px] font-normal text-slate-400">/bln</span></div>
                        <ul className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <li>✓ 1.500 AI Credits</li>
                          <li>✓ 3 AI Employees</li>
                          <li>✓ 10 GB Storage</li>
                        </ul>
                      </div>
                      {isStarterActive ? (
                        <button disabled className="w-full py-2 rounded-xl bg-emerald-500 text-white font-extrabold text-xs opacity-80 cursor-default">
                          {t.settingsView?.billingTab?.activeTag || 'Paket Aktif'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan('Starter', 1500, 3, 10)}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs cursor-pointer transition-colors"
                        >
                          {t.settingsView?.billingTab?.selectPlanBtn || 'Pilih Starter'}
                        </button>
                      )}
                    </div>

                    {/* 2. Growth / UMKM Pro Plan */}
                    <div className={`p-4 rounded-2xl border-2 space-y-3 flex flex-col justify-between relative transition-all ${
                      isGrowthActive 
                        ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'
                    }`}>
                      {isGrowthActive ? (
                        <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase">
                          {t.settingsView?.billingTab?.activeTag || 'Aktif Saat Ini'}
                        </span>
                      ) : (
                        <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase border border-orange-200 dark:border-orange-800">
                          {t.settingsView?.billingTab?.popularTag || 'Paling Populer'}
                        </span>
                      )}
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.growthPlan || 'Growth'}</h4>
                        <p className="text-[10px] text-slate-400">{t.settingsView?.billingTab?.mostPopular || 'Paling Populer untuk UMKM'}</p>
                        <div className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">Rp 299.000 <span className="text-[10px] font-normal text-slate-400">/bln</span></div>
                        <ul className="mt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                          <li>✓ 5.000 AI Credits</li>
                          <li>✓ 20 AI Employees</li>
                          <li>✓ 50 GB Storage</li>
                          <li>✓ e-Faktur PPN 11%</li>
                        </ul>
                      </div>
                      {isGrowthActive ? (
                        <button disabled className="w-full py-2 rounded-xl bg-orange-500 text-white font-extrabold text-xs opacity-80 cursor-default">
                          {t.settingsView?.billingTab?.activeTag || 'Paket Aktif'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan('Growth', 5000, 20, 50)}
                          className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer transition-colors"
                        >
                          {t.settingsView?.billingTab?.selectPlanBtn || 'Upgrade ke Growth'}
                        </button>
                      )}
                    </div>

                    {/* 3. Pro Enterprise Plan */}
                    <div className={`p-4 rounded-2xl border-2 space-y-3 flex flex-col justify-between relative transition-all ${
                      isProActive 
                        ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20' 
                        : 'border-purple-200 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/20'
                    }`}>
                      {isProActive && (
                        <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase">
                          {t.settingsView?.billingTab?.activeTag || 'Aktif Saat Ini'}
                        </span>
                      )}
                      <div>
                        <h4 className="font-black text-purple-900 dark:text-purple-100">{t.settingsView?.billingTab?.proPlan || 'Pro Enterprise'}</h4>
                        <p className="text-[10px] text-slate-400">{t.settingsView?.billingTab?.forLargeScale || 'Skala Besar & Multi-cabang'}</p>
                        <div className="mt-2 text-lg font-black text-purple-900 dark:text-purple-100">Rp 899.000 <span className="text-[10px] font-normal text-slate-400">/bln</span></div>
                        <ul className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <li>✓ 25.000 AI Credits</li>
                          <li>✓ 50 AI Employees</li>
                          <li>✓ 250 GB Storage</li>
                          <li>✓ Dedicated Manager</li>
                        </ul>
                      </div>
                      {isProActive ? (
                        <button disabled className="w-full py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs opacity-80 cursor-default">
                          {t.settingsView?.billingTab?.activeTag || 'Paket Aktif'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan('Pro Enterprise', 25000, 50, 250)}
                          className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs cursor-pointer transition-colors"
                        >
                          {t.settingsView?.billingTab?.selectPlanBtn || 'Upgrade ke Enterprise'}
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 2. Detail Usage Telemetry Modal */}
      {isUsageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.usageModalTitle || 'Analisis Detail Penggunaan Kuota'}</h3>
              <button onClick={() => setIsUsageModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between">
                  <span>AI Agent Executions</span>
                  <span className="font-bold text-orange-600">
                    {(billingOverview.ai_credits_used || 0).toLocaleString('id-ID')} / {(billingOverview.ai_credits_total || 5000).toLocaleString('id-ID')} Calls
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${Math.min(100, ((billingOverview.ai_credits_used || 0) / (billingOverview.ai_credits_total || 5000)) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span>AI Employee Active Workforce</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {billingOverview.ai_employees_used || 0} / {billingOverview.ai_employees_total || 20} Active Agents
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span>R2 Storage Infrastructure</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {billingOverview.storage_used_gb || 0} GB / {billingOverview.storage_total_gb || 50} GB
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setIsUsageModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">
                  {t.settingsView?.billingTab?.closeBtn || 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Kelola Pembayaran Modal */}
      {isManagePaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CreditCard size={18} className="text-orange-500" />
                  <span>{t.settingsView?.billingTab?.savedPaymentMethods || 'Metode Pembayaran Tersimpan'}</span>
                </h3>
                <p className="text-[11px] text-slate-400">{t.settingsView?.billingTab?.savedPaymentSubtitle || 'Kelola kartu kredit/debit terhubung untuk tagihan otomatis ZEGA AI'}</p>
              </div>
              <button onClick={() => setIsManagePaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs font-semibold max-h-[60vh] overflow-y-auto pr-1">
              {paymentMethods.length === 0 ? (
                <div className="p-4 text-center text-slate-400 font-medium">{t.settingsView?.billingTab?.noPaymentMethods || 'Belum ada metode pembayaran tersimpan.'}</div>
              ) : (
                paymentMethods.map((pm) => (
                  <div key={pm.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${pm.is_default ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-slate-100">{pm.card_type || pm.brand || 'Visa'} •••• {pm.card_last4}</h5>
                          <p className="text-[10px] text-slate-400">{t.settingsView?.billingTab?.expiresLabel || 'Kedaluwarsa'} {pm.exp_month}/{pm.exp_year}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pm.is_default ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 size={10} /> {t.settingsView?.billingTab?.primaryBadge || 'Utama'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">{t.settingsView?.billingTab?.optionalBadge || 'Opsional'}</span>
                        )}
                      </div>
                    </div>

                    {/* Inline Edit Form */}
                    {editingPaymentId === pm.id ? (
                      <form onSubmit={handleSaveEditPayment} className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 items-end">
                        <div>
                          <label className="text-[9px] text-slate-400 font-bold uppercase">{t.settingsView?.billingTab?.typeLabel || 'Tipe'}</label>
                          <select
                            value={editCardType}
                            onChange={(e) => setEditCardType(e.target.value)}
                            className="w-full text-[11px] p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          >
                            <option value="Visa">Visa</option>
                            <option value="Mastercard">Mastercard</option>
                            <option value="JCB">JCB</option>
                            <option value="Amex">Amex</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 font-bold uppercase">{t.settingsView?.billingTab?.monthYearLabel || 'Bulan / Tahun'}</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={editExpMonth}
                              onChange={(e) => setEditExpMonth(Number(e.target.value))}
                              className="w-full text-[11px] p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                            <input
                              type="number"
                              min={2026}
                              max={2035}
                              value={editExpYear}
                              onChange={(e) => setEditExpYear(Number(e.target.value))}
                              className="w-full text-[11px] p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>
                        <div className="flex gap-1 justify-end">
                          <button type="submit" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">{t.settingsView?.billingTab?.saveBtn || 'Simpan'}</button>
                          <button type="button" onClick={() => setEditingPaymentId(null)} className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">{t.settingsView?.billingTab?.cancelBtn || 'Batal'}</button>
                        </div>
                      </form>
                    ) : (
                      /* Action Controls: Set Primary, Edit, Delete */
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                        {!pm.is_default && (
                          <button
                            onClick={() => handleSetPrimaryPayment(pm)}
                            className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Star size={12} /> {t.settingsView?.billingTab?.setPrimary || 'Set Utama'}
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEditPayment(pm)}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={12} /> {t.settingsView?.billingTab?.editBtn || 'Ubah'}
                        </button>
                        <button
                          onClick={() => handleDeletePayment(pm.id, pm.is_default)}
                          className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> {t.settingsView?.billingTab?.deleteBtn || 'Hapus'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button onClick={() => setIsAddPaymentModalOpen(true)} className="text-orange-500 font-extrabold flex items-center gap-1 cursor-pointer">
                  <Plus size={14} /> {t.settingsView?.billingTab?.addCardBtn || 'Tambah Kartu Baru'}
                </button>
                <button onClick={() => setIsManagePaymentModalOpen(false)} className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">
                  {t.settingsView?.billingTab?.doneBtn || 'Selesai'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tambah Metode Pembayaran Modal */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.addPaymentModalTitle || 'Tambah Metode Pembayaran'}</h3>
              <button onClick={() => setIsAddPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{t.settingsView?.billingTab?.providerLabel || 'Penyedia Pembayaran'}</label>
                <select
                  value={newCardBrand}
                  onChange={e => setNewCardBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="Stripe">Stripe Gateway</option>
                  <option value="Midtrans">Midtrans Snap</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{t.settingsView?.billingTab?.last4DigitsLabel || '4 Digit Terakhir Kartu Kredit / Debit'}</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="cth. 8812"
                  value={newCardLast4}
                  onChange={e => setNewCardLast4(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{t.settingsView?.billingTab?.expMonthLabel || 'Bulan Exp'}</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newCardExpMonth}
                    onChange={e => setNewCardExpMonth(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">{t.settingsView?.billingTab?.expYearLabel || 'Tahun Exp'}</label>
                  <input
                    type="number"
                    min={2026}
                    max={2035}
                    value={newCardExpYear}
                    onChange={e => setNewCardExpYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddPaymentModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold">
                  {t.settingsView?.billingTab?.cancelBtn || 'Batal'}
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer">
                  {t.settingsView?.billingTab?.saveCardBtn || 'Simpan Kartu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Lihat Semua Invoice Modal */}
      {isAllInvoicesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.allInvoicesModalTitle || 'Daftar Lengkap Riwayat Invoice'}</h3>
              <button onClick={() => setIsAllInvoicesModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={t.settingsView?.billingTab?.searchInvoicePlaceholder || 'Cari nomor invoice / periode...'}
                value={searchInvoice}
                onChange={e => setSearchInvoice(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                    <th className="pb-2">{t.settingsView?.billingTab?.colInvoice || 'Invoice'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colPeriod || 'Periode'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colTotalIdr || 'Total IDR'}</th>
                    <th className="pb-2">e-Faktur</th>
                    <th className="pb-2 text-right">{t.settingsView?.billingTab?.colAction || 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                        {t.settingsView?.billingTab?.noInvoices || 'Belum ada data invoice.'}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-950">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                        <td className="py-2.5 text-slate-500">{inv.period}</td>
                        <td className="py-2.5 font-semibold">Rp {Number(inv.total_amount_idr).toLocaleString('id-ID')}</td>
                        <td className="py-2.5 text-[10px] text-slate-400 font-medium tabular-nums">{inv.e_faktur_no || '-'}</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => handleDownloadInvoice(inv.invoice_number)} className="p-1 text-slate-400 hover:text-orange-500">
                            <Download size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsAllInvoicesModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">
                {t.settingsView?.billingTab?.closeBtn || 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Lihat Semua Transaksi Modal */}
      {isAllTransactionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.settingsView?.billingTab?.allTxModalTitle || 'Daftar Lengkap Log Transaksi'}</h3>
              <button onClick={() => setIsAllTransactionsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={t.settingsView?.billingTab?.searchTxPlaceholder || 'Cari transaksi...'}
                value={searchTx}
                onChange={e => setSearchTx(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                    <th className="pb-2">{t.settingsView?.billingTab?.colDate || 'Tanggal'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colDesc || 'Deskripsi'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colMethod || 'Metode'}</th>
                    <th className="pb-2">{t.settingsView?.billingTab?.colAmountUsd || 'Jumlah USD'}</th>
                    <th className="pb-2 text-right">{t.settingsView?.billingTab?.colStatus || 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                        {t.settingsView?.billingTab?.noTx || 'Belum ada log transaksi.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-950">
                        <td className="py-2.5 text-slate-400 tabular-nums text-[11px] font-medium">
                          {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">{tx.description}</td>
                        <td className="py-2.5 text-slate-500">{tx.method}</td>
                        <td className="py-2.5 font-bold">USD {Number(tx.amount_usd).toFixed(2)}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">{tx.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsAllTransactionsModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">
                {t.settingsView?.billingTab?.closeBtn || 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Hubungi Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare size={18} className="text-orange-500" />
                <span>{t.settingsView?.billingTab?.supportModalTitle || 'Kirim Tiket Bantuan Billing'}</span>
              </h3>
              <button onClick={() => setIsSupportModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{t.settingsView?.billingTab?.subjectLabel || 'Subjek Pertanyaan'}</label>
                <input
                  type="text"
                  required
                  placeholder={t.settingsView?.billingTab?.subjectPlaceholder || 'cth. Kendala Pembayaran Invoice atau e-Faktur PPN'}
                  value={supportSubject}
                  onChange={e => setSupportSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{t.settingsView?.billingTab?.priorityLabel || 'Prioritas Tiket'}</label>
                <select
                  value={supportPriority}
                  onChange={e => setSupportPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="Normal">{t.settingsView?.billingTab?.priorityNormal || 'Normal (Respon < 2 Jam)'}</option>
                  <option value="Tinggi">{t.settingsView?.billingTab?.priorityHigh || 'Tinggi (Respon < 15 Menit)'}</option>
                  <option value="Mendesak">{t.settingsView?.billingTab?.priorityUrgent || 'Mendesak (VIP Instant Handler)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">{t.settingsView?.billingTab?.messageLabel || 'Detail Pesan Bantuan'}</label>
                <textarea
                  rows={4}
                  required
                  placeholder={t.settingsView?.billingTab?.messagePlaceholder || 'Tuliskan kendala faktur atau pertanyaan billing Anda di sini...'}
                  value={supportMessage}
                  onChange={e => setSupportMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsSupportModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold">
                  {t.settingsView?.billingTab?.cancelBtn || 'Batal'}
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer flex items-center gap-1.5">
                  <Send size={14} /> {t.settingsView?.billingTab?.sendTicketBtn || 'Kirim Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
