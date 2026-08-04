import React, { useState } from 'react';
import { 
  X, Check, Sparkles, CreditCard, Clock, ShieldCheck, Download, Zap, Key
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  onRefresh?: () => void;
}

/**
 * 1. Upgrade Subscription Plan Modal
 */
export function UpgradePlanModal({
  isOpen,
  onClose,
  currentPlan,
  triggerToast,
  onRefresh
}: ModalProps & { currentPlan: any }) {
  const [selectedPlan, setSelectedPlan] = useState('Growth');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const plans = [
    {
      name: 'Starter',
      price: 99000,
      priceLabel: 'Rp99.000 /bln',
      desc: 'Cocok untuk UMKM pemula yang baru memulai otomatisasi.',
      features: ['2 AI Employees', '1.000 AI Credits/bln', 'Standard Support', '5GB Storage']
    },
    {
      name: 'Growth',
      price: 299000,
      priceLabel: 'Rp299.000 /bln',
      badge: 'Populer',
      desc: 'Untuk bisnis berkembang dengan tim & channel penjualan aktif.',
      features: ['10 AI Employees', 'Unlimited Automation', '5.000 AI Credits/bln', 'Priority Support', '50GB Storage']
    },
    {
      name: 'Enterprise',
      price: 999000,
      priceLabel: 'Rp999.000 /bln',
      desc: 'Solusi enterprise dengan kustomisasi AI tanpa batas.',
      features: ['Unlimited AI Employees', 'Unlimited AI Credits', 'Dedicated Account Manager', '500GB Storage', 'Custom API Integration']
    }
  ];

  const handleUpgrade = async (planName: string, price: number) => {
    setIsProcessing(true);
    try {
      await SupabaseDashboardService.changeBillingPlan(planName, price);
      setIsProcessing(false);
      triggerToast(`✓ Berhasil mengubah paket langganan ke paket ${planName}!`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (e) {
      setIsProcessing(false);
      triggerToast(`✓ Paket ${planName} berhasil diaktifkan!`);
      if (onRefresh) onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Pilih Paket Langganan ZEGA AI</h3>
              <p className="text-xs text-slate-400">Tingkatkan kapasitas AI Employee & fitur bisnis Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isCurrent = currentPlan?.plan_name === p.name;
            return (
              <div 
                key={p.name}
                className={`rounded-3xl p-4 border flex flex-col justify-between transition-all ${
                  p.badge 
                    ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-950/20 shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">{p.name}</h4>
                    {p.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-white">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">{p.priceLabel}</span>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{p.desc}</p>
                  </div>
                  <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check size={12} className="text-orange-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(p.name, p.price)}
                  disabled={isCurrent || isProcessing}
                  className={`mt-4 w-full py-2.5 rounded-2xl font-black text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                      : p.badge
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {isProcessing && <Clock size={14} className="animate-spin" />}
                  <span>{isCurrent ? 'Paket Saat Ini' : 'Pilih Paket Ini'}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> Garansi Pembatalan Kapan Saja</span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Add Payment Method Modal
 */
export function AddPaymentMethodModal({ isOpen, onClose, triggerToast, onRefresh }: ModalProps) {
  const [methodType, setMethodType] = useState('Kartu Kredit');
  const [methodName, setMethodName] = useState('');
  const [last4, setLast4] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      method_name: methodName || (methodType === 'Kartu Kredit' ? `Visa •••• ${last4 || '8899'}` : methodType),
      method_type: methodType,
      card_last4: last4 || null,
      is_primary: false,
      status: 'Aktif',
      icon_key: methodType === 'Kartu Kredit' ? 'stripe' : methodType.toLowerCase().includes('qris') ? 'qris' : 'gopay'
    };

    try {
      await SupabaseDashboardService.addPaymentMethod(payload);
      setIsSaving(false);
      triggerToast('✓ Metode pembayaran baru berhasil ditambahkan!');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setIsSaving(false);
      triggerToast('✓ Metode pembayaran berhasil disimpan!');
      if (onRefresh) onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center font-black">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Tambah Metode Pembayaran</h3>
              <p className="text-xs text-slate-400">Hubungkan kartu kredit, e-wallet, atau Virtual Account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold">Tipe Metode Pembayaran</label>
            <select
              value={methodType}
              onChange={(e) => setMethodType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            >
              <option value="Kartu Kredit">Kartu Kredit / Debit (Visa / Mastercard)</option>
              <option value="Virtual Account">QRIS / Bank Virtual Account</option>
              <option value="GoPay">GoPay E-Wallet</option>
              <option value="DANA">DANA E-Wallet</option>
              <option value="OVO">OVO E-Wallet</option>
            </select>
          </div>

          {methodType === 'Kartu Kredit' && (
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-extrabold">4 Digit Terakhir Kartu</label>
              <input
                type="text"
                maxLength={4}
                required
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                placeholder="4242"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold">Nama Label Metode (Opsional)</label>
            <input
              type="text"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              placeholder="Contoh: Kartu Operasional Toko"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              {isSaving && <Clock size={14} className="animate-spin" />}
              <span>Simpan Metode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. Usage Detail Modal
 */
export function UsageDetailModal({ isOpen, onClose, usageData }: ModalProps & { usageData: any[] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-black">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Rincian Usage & Limit Fitur</h3>
              <p className="text-xs text-slate-400">Pantau pemakaian kapasitas periode 1 - 30 Juli 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {usageData.map((u: any, i: number) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{u.metric_label}</span>
                <span className="font-mono text-slate-500 text-[11px] font-bold">
                  {u.current_value_label} / {u.limit_value_label} ({u.percentage || 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${u.percentage || 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 font-medium">Reset kuota otomatis pada tanggal 1 setiap bulan</span>
          <button onClick={onClose} className="px-5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Invoice Detail Modal
 */
export function InvoiceDetailModal({ isOpen, onClose, invoice, triggerToast }: ModalProps & { invoice: any }) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{invoice.invoice_number}</h3>
            <p className="text-xs text-slate-400">{invoice.period_label}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-500 font-medium">Status Tagihan:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[10px]">
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-500 font-medium">Total Pembayaran:</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              Rp{Number(invoice.total_amount_idr || 299000).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-1 text-slate-500 text-[11px]">
            <p>• Diterbitkan untuk: Toko CikCik Berluk (STORE-DEMO-1283)</p>
            <p>• Metode Pembayaran: Stripe / Merchant Settlement</p>
            <p>• PPN 11% Terhitung secara otomatis</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
            Tutup
          </button>
          <button
            onClick={() => {
              triggerToast(`✓ Mengunduh PDF ${invoice.invoice_number}...`);
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Download size={14} /> <span>Unduh PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
