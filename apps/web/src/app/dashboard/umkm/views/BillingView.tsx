import React from 'react';
import { 
  Check, CreditCard, Plus, ArrowUpRight, Download, ShieldCheck, 
  ExternalLink, Sparkles, AlertCircle 
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';

interface BillingViewProps {
  triggerToast: (msg: string) => void;
}

export function BillingView({ triggerToast }: BillingViewProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">Billing & Subscription</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Kelola langganan, penggunaan, dan metode pembayaran Anda.
        </p>
      </div>

      {/* Top 3 Cards Grid (Paket Anda, Ringkasan Penggunaan, Metode Pembayaran) */}
      <div className="grid lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Card 1: Paket Anda (col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Paket Anda</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">Growth</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold">
                  Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Untuk bisnis yang sedang berkembang.
              </p>
            </div>

            <button 
              onClick={() => triggerToast('Opening Plan Upgrade options...')}
              className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              Upgrade Paket
            </button>

            <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {[
                '10 AI Employees',
                'Unlimited Automation',
                '5.000 AI Credits / bulan',
                'Priority Support'
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check size={14} className="text-orange-500 flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Periode berikutnya: 1 Agustus 2026</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">Rp299.000</span>
                <span className="text-[11px] text-slate-400 font-normal">/ bulan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Ringkasan Penggunaan (col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Ringkasan Penggunaan
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">1 - 30 Juli 2026</span>
            </div>

            <div className="space-y-4">
              {/* Progress 1: AI Credits */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">AI Credits</span>
                  <span className="text-slate-500 font-medium text-[11px]">3.240 / 5.000 <span className="text-slate-400">(64%)</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '64%' }} />
                </div>
              </div>

              {/* Progress 2: AI Employees */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">AI Employees</span>
                  <span className="text-slate-500 font-medium text-[11px]">7 / 10 <span className="text-slate-400">(70%)</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>

              {/* Progress 3: Automation */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Automation</span>
                  <span className="text-slate-500 font-medium text-[11px]">24 / ∞</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              {/* Progress 4: Storage */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Storage</span>
                  <span className="text-slate-500 font-medium text-[11px]">12.4 GB / 50 GB <span className="text-slate-400">(25%)</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Metode Pembayaran (col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Metode Pembayaran
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* Method 1: Stripe */}
              <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                    <img src={getR2CdnUrl('/assets/visualization/stripe.webp')} className="h-4 w-auto object-contain" alt="Stripe" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Stripe •••• 4242</h4>
                    <span className="text-[10px] text-slate-400">Kartu Kredit</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[9px] font-extrabold">
                  Utama
                </span>
              </div>

              {/* Method 2: QRIS */}
              <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                    <img src={getR2CdnUrl('/assets/logo/qris.webp')} className="h-3.5 w-auto object-contain" alt="QRIS" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">QRIS (VA)</h4>
                    <span className="text-[10px] text-slate-400">Virtual Account</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-bold">
                  Aktif
                </span>
              </div>

              {/* Method 3: GoPay */}
              <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                    <img src={getR2CdnUrl('/assets/logo/gopay.webp')} className="h-4 w-auto object-contain" alt="GoPay" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">GoPay</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-bold">
                  Aktif
                </span>
              </div>

              {/* Method 4: DANA */}
              <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                    <img src={getR2CdnUrl('/assets/logo/dana.webp')} className="h-4 w-auto object-contain" alt="DANA" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">DANA</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-bold">
                  Aktif
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => triggerToast('Add new payment method...')}
            className="mt-4 w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Tambah Metode Pembayaran
          </button>
        </div>

      </div>

      {/* Bottom Tables: Riwayat Tagihan & Transaksi x402 (M2H) */}
      <div className="grid lg:grid-cols-12 gap-5">
        
        {/* Table 1: Riwayat Tagihan (col-span-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Riwayat Tagihan
            </h3>
            <button 
              onClick={() => triggerToast('Viewing all billing history')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              { id: 'INV-2026-0721', desc: 'Growth Plan - Juli 2026', price: 'Rp299.000', status: 'Lunas' },
              { id: 'INV-2026-0621', desc: 'Growth Plan - Juni 2026', price: 'Rp299.000', status: 'Lunas' },
              { id: 'INV-2026-0521', desc: 'Growth Plan - Mei 2026', price: 'Rp299.000', status: 'Lunas' },
              { id: 'INV-2026-0421', desc: 'Growth Plan - April 2026', price: 'Rp299.000', status: 'Lunas' },
            ].map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{inv.id}</h4>
                  <span className="text-[10px] text-slate-400">{inv.desc}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{inv.price}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table 2: Transaksi x402 (M2H) (col-span-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Transaksi x402 (M2H)
            </h3>
            <button 
              onClick={() => triggerToast('Viewing all x402 transactions')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              { tx: 'TXN-7f3...a9b2', date: '28 Juli 2026 16:21', amount: '2.50', coin: 'USDC', status: 'Berhasil' },
              { tx: 'TXN-8a1...c304', date: '28 Juli 2026 09:15', amount: '-1.20', coin: 'USDC', status: 'Berhasil' },
              { tx: 'TXN-3c2...f6e7', date: '27 Juli 2026 14:45', amount: '-0.80', coin: 'USDC', status: 'Berhasil' },
              { tx: 'TXN-9d4...e8f1', date: '27 Juli 2026 11:32', amount: '-3.00', coin: 'USDC', status: 'Berhasil' },
            ].map((tx, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-mono font-bold text-slate-900 dark:text-slate-100">{tx.tx}</h4>
                  <span className="text-[10px] text-slate-400">{tx.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{tx.coin} {tx.amount}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Banner Bar */}
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Semua pembayaran diproses secara aman melalui Stripe, Midtrans, atau x402 Network.
          </p>
          <div className="flex items-center gap-2 opacity-80">
            <img src={getR2CdnUrl('/assets/visualization/stripe.webp')} className="h-3.5 w-auto object-contain" alt="Stripe" />
            <span className="text-slate-300">|</span>
            <img src={getR2CdnUrl('/assets/logo/Midtrans.png')} className="h-3.5 w-auto object-contain" alt="Midtrans" />
            <span className="text-slate-300">|</span>
            <img src={getR2CdnUrl('/assets/logo/qris.webp')} className="h-3 w-auto object-contain" alt="QRIS" />
            <span className="text-slate-300">|</span>
            <img src={getR2CdnUrl('/assets/visualization/x402.jpg')} className="size-4 object-contain rounded-xs" alt="x402" />
          </div>
        </div>

        <button 
          onClick={() => triggerToast('Downloading latest invoice...')}
          className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-orange-500 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          <Download size={14} /> Download Invoice
        </button>
      </div>

    </div>
  );
}
