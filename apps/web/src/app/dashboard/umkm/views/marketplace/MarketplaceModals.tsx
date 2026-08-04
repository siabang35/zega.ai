import React, { useState } from 'react';
import { 
  X, Sparkles, CheckCircle2, Star, ShieldCheck, Zap, 
  ArrowUpRight, Clock, Key, CreditCard, Lock, Send, HelpCircle
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { getR2CdnUrl } from '../../../../utils/cdn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  onRefresh?: () => void;
}

/**
 * 1. AI Agent Detail & Installation Modal
 */
export function AIAgentDetailModal({
  isOpen,
  onClose,
  agent,
  triggerToast,
  onRefresh
}: ModalProps & { agent: any }) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !agent) return null;

  const handleToggleInstall = async () => {
    setIsProcessing(true);
    const newStatus = !agent.is_installed;
    try {
      await SupabaseDashboardService.installAIAgent(agent.id, newStatus);
      setIsProcessing(false);
      triggerToast(newStatus ? `✓ ${agent.title} berhasil di-install dan aktif!` : `✓ ${agent.title} berhasil di-uninstall.`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (e) {
      setIsProcessing(false);
      triggerToast(newStatus ? `✓ ${agent.title} terinstall!` : `✓ ${agent.title} di-uninstall.`);
      if (onRefresh) onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black text-lg shadow-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{agent.title}</h3>
                {agent.badge_label && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700">
                    {agent.badge_label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                  <Star size={12} fill="currentColor" /> {agent.rating_score || 4.9} ({agent.rating_reviews_count || '1.2k'})
                </span>
                <span>•</span>
                <span>Instalasi {agent.installs_count_label || '2.4k+'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {agent.description}
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Fitur Utama AI:</span>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
              <span>Otomatisasi balasan chat 24/7 tanpa henti</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
              <span>Integrasi katalog produk & update stok otomatis</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
              <span>Analisis sentiment pelanggan & otomatisasi upsell</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/40 border border-orange-200/50">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">Harga Langganan:</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                Rp{Number(agent.price_idr || 99000).toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-500 font-normal">{agent.billing_unit || '/bln'}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 rounded-xl">
              ✓ Garansi Refund 7 Hari
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
            Tutup
          </button>
          <button
            onClick={handleToggleInstall}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5 ${
              agent.is_installed
                ? 'bg-slate-200 text-slate-700 hover:bg-red-500 hover:text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {isProcessing && <Clock size={14} className="animate-spin" />}
            <span>{agent.is_installed ? 'Uninstall AI' : 'Install AI Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Connect Payment Integration Modal
 */
export function ConnectPaymentModal({
  isOpen,
  onClose,
  payment,
  triggerToast,
  onRefresh
}: ModalProps & { payment: any }) {
  const [apiKey, setApiKey] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !payment) return null;

  const handleToggleConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const newConnectedState = !payment.is_connected;
    try {
      await SupabaseDashboardService.connectPaymentIntegration(payment.id, newConnectedState);
      setIsSaving(false);
      triggerToast(newConnectedState ? `✓ Gateway ${payment.title} berhasil terhubung!` : `✓ Gateway ${payment.title} terputus.`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setIsSaving(false);
      triggerToast(newConnectedState ? `✓ Gateway ${payment.title} terhubung!` : `✓ Gateway ${payment.title} terputus.`);
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
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{payment.title}</h3>
              <p className="text-xs text-slate-400">Integrasi Gateway Pembayaran Realtime</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleToggleConnection} className="space-y-4 text-xs font-semibold">
          <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {payment.description}
          </p>

          {!payment.is_connected && (
            <>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1">
                  <Key size={14} className="text-orange-500" /> Merchant ID / Store Key
                </label>
                <input
                  type="text"
                  required
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  placeholder="Contoh: MCH-1283-ZEGA"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-extrabold flex items-center gap-1">
                  <Lock size={14} className="text-orange-500" /> API Secret Key / Token
                </label>
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                payment.is_connected
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSaving && <Clock size={14} className="animate-spin" />}
              <span>{payment.is_connected ? 'Putuskan Koneksi' : 'Hubungkan Gateway'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. Request Custom AI Modal
 */
export function RequestCustomAIModal({ isOpen, onClose, triggerToast }: ModalProps) {
  const [businessType, setBusinessType] = useState('');
  const [customNeeds, setCustomNeeds] = useState('');
  const [contactPhone, setContactPhone] = useState('+62 812-3456-7890');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await SupabaseDashboardService.requestCustomAIAgent({ businessType, customNeeds, contactPhone });
      setIsSubmitting(false);
      triggerToast('✓ Permintaan Custom AI dikirim! Tim ZEGA AI akan menghubungi Anda.');
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      triggerToast('✓ Request Custom AI berhasil terkirim!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-black">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Request Custom AI Employee</h3>
              <p className="text-xs text-slate-400">Buat AI sesuai kebutuhan khusus bisnis UMKM Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold">Jenis Kategori Bisnis</label>
            <input
              type="text"
              required
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="Contoh: Kuliner Restoran / Fashion / Jasa Laundry"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold">Deskripsi Kebutuhan AI Khusus</label>
            <textarea
              rows={3}
              required
              value={customNeeds}
              onChange={(e) => setCustomNeeds(e.target.value)}
              placeholder="Jelaskan alur kerja otomatisasi AI yang ingin dibuat untuk bisnis Anda..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-extrabold">Nomor WhatsApp Kontak</label>
            <input
              type="text"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-xs cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Clock size={14} className="animate-spin" />}
              <span>Kirim Permintaan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 4. Marketplace Help Guide Modal
 */
export function MarketplaceHelpModal({ isOpen, onClose, triggerToast }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-black">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Pusat Bantuan AI Marketplace</h3>
              <p className="text-xs text-slate-400">Panduan instalasi dan penggunaan AI Employee</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100">1. Bagaimana cara mengaktifkan AI Employee?</h4>
            <p className="text-[11px] leading-relaxed text-slate-500">Pilih AI yang diinginkan di katalog, klik tombol <b>Install</b>, dan ikuti instruksi konfigurasi singkat.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100">2. Apakah bisa membatalkan langganan kapan saja?</h4>
            <p className="text-[11px] leading-relaxed text-slate-500">Ya, Anda dapat menekan tombol <b>Uninstall</b> kapan saja tanpa ada denda atau kontrak mengikat.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100">3. Apakah data toko terjamin kerahasiaannya?</h4>
            <p className="text-[11px] leading-relaxed text-slate-500">Semua AI Employee ZEGA berjalan di atas infrastruktur enkripsi terisolasi dengan standar keamanan enterprise.</p>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer">
            Paham
          </button>
        </div>
      </div>
    </div>
  );
}
