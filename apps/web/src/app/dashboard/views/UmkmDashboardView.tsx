import React, { useState } from 'react';
import { 
  MessageSquare, FileText, Sparkles, BarChart3, Plus, CheckCircle2,
  ShoppingBag, Users, Calendar, DollarSign, ChevronRight, Copy, Share2,
  Sliders, Link2, Check, RefreshCw, Globe, Shield, ExternalLink
} from 'lucide-react';

interface UmkmDashboardViewProps {
  activeTab?: string;
}

export function UmkmDashboardView({ activeTab: externalTab }: UmkmDashboardViewProps) {
  const [internalTab, setInternalTab] = useState<'wa' | 'invoice' | 'content' | 'rekap' | 'integrations'>('wa');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync internal tab if externalTab is passed
  const activeTab = React.useMemo(() => {
    if (externalTab === 'wa_bot') return 'wa';
    if (externalTab === 'invoice_gen') return 'invoice';
    if (externalTab === 'ai_copywriter') return 'content';
    if (externalTab === 'sales_rekap') return 'rekap';
    if (externalTab === 'integrations') return 'integrations';
    return internalTab;
  }, [externalTab, internalTab]);

  const setActiveTab = (tab: 'wa' | 'invoice' | 'content' | 'rekap' | 'integrations') => {
    setInternalTab(tab);
  };

  // Invoice Form State
  const [customerName, setCustomerName] = useState('');
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');

  // AI Copywriter State
  const [productTopic, setProductTopic] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');

  // Integrations Connected State
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({
    wa_api: true,
    qris_gateway: true,
    midtrans: true,
    xendit: false,
    instagram: true,
    tiktok_shop: true,
    shopee: false,
    google_sheets: true,
  });

  const toggleApp = (key: string, name: string) => {
    setConnectedApps(prev => {
      const nextState = !prev[key];
      triggerToast(`${name} ${nextState ? 'Terhubung (Connected)' : 'Terputus (Disconnected)'}`);
      return { ...prev, [key]: nextState };
    });
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return;
    triggerToast(`Invoice PDF untuk ${customerName} (Rp ${Number(amount).toLocaleString('id-ID')}) berhasil dibuat & terkirim ke WA!`);
    setCustomerName('');
    setItemName('');
    setAmount('');
  };

  const handleGenerateContent = () => {
    if (!productTopic) return;
    setGeneratedCaption(`🔥 PROMO SPESIAL: ${productTopic}! 🔥\n\nDapatkan penawaran terbatas hari ini! Produk terbaik untuk solusi bisnis Anda. Klik link di bio untuk order sekarang juga via WhatsApp! 🛍️✨\n\n#PromoBisnis #UMKM #ZegaAI #OrderWA #${productTopic.replace(/\s+/g, '')}`);
    triggerToast('Caption promo berhasil dibuat oleh AI!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-900 text-white dark:bg-indigo-100 dark:text-indigo-900 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER BANNER UMKM */}
      <div className="p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold uppercase tracking-widest border border-indigo-200/80 dark:border-indigo-800/80">
              WARUNG DIGITAL / UMKM STARTER PRO
            </span>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">
              Portal Otomatisasi Bisnis UMKM 👋
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              Asisten AI praktis untuk kelola WhatsApp pelanggan, buat invoice PDF otomatis, & promosi produk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp Bot Active
            </span>
          </div>
        </div>

        {/* 4 Metric Chips */}
        <div className="mt-4 md:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-[10px] text-slate-400 font-medium uppercase">Chat WA Terbalas</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              342 <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">+18% hr</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-[10px] text-slate-400 font-medium uppercase">Invoice Terkirim</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              156 <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Rp 42.5M</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-[10px] text-slate-400 font-medium uppercase">Konten Promo IG</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              48 Posts <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Aktif</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-[10px] text-slate-400 font-medium uppercase">Waktu Dihemat</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              28 Jam <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">/minggu</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION FITUR UMKM */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {[
          { key: 'wa', label: '💬 Bot WhatsApp CS', icon: MessageSquare },
          { key: 'invoice', label: '📄 Buat Invoice & Tagihan', icon: FileText },
          { key: 'content', label: '✨ AI Content Creator IG/TikTok', icon: Sparkles },
          { key: 'rekap', label: '📊 Rekap Penjualan Harian', icon: BarChart3 },
          { key: 'integrations', label: '🔌 Integrasi API & Toko', icon: Link2 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUB-VIEW TAB 1: WHATSAPP BOT CS */}
      {activeTab === 'wa' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Pengaturan Balasan Otomatis WhatsApp
              </h3>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-200/80 dark:border-indigo-800/80">
                ● Connected: +62 812-3456-7890
              </span>
            </div>

            <div className="space-y-3">
              {[
                { trigger: 'Salam & Jam Operasional', reply: 'Halo kak! Toko kami buka setiap hari jam 08:00 - 21:00 WIB. Silakan ketik nama produk yang ingin diorder ya! 😊' },
                { trigger: 'Katalog Produk & Harga', reply: 'Berikut katalog produk terlaris kami: 1. Paket Super (Rp 50rb) 2. Paket Hemat (Rp 35rb). Mau order yang mana kak?' },
                { trigger: 'Rekening & QRIS Pembayaran', reply: 'Pembayaran dapat mentransfer ke BCA 12345678 a/n Toko Berkah atau scan QRIS terlampir. Kirim bukti tf untuk proses paking ya!' },
              ].map((rule, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Kata Kunci: "{rule.trigger}"</span>
                    <button onClick={() => triggerToast(`Edit Aturan ${rule.trigger}`)} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer">Edit Aturan</button>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-[11px] font-normal">{rule.reply}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => triggerToast('Tambah Aturan Balasan Otomatis Baru')}
              className="w-full py-2.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={15} /> Tambah Aturan Balasan WA Baru
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Riwayat Chat Pelanggan Terbaru
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { name: 'Ibu Ratna', msg: 'Transfer Rp 150.000 sudah dikirim ya min', time: '3m lalu', status: 'Lunas' },
                { name: 'Budi Santoso', msg: 'Toko buka jam berapa min?', time: '12m lalu', status: 'Terbalas AI' },
                { name: 'Siti Aminah', msg: 'Minta katalog baju terbaru', time: '25m lalu', status: 'Terbalas AI' },
              ].map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex justify-between font-medium">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{c.name}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">{c.status}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5 font-normal">{c.msg}</p>
                  <span className="text-[9px] text-slate-400">{c.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW TAB 2: INVOICE GENERATOR */}
      {activeTab === 'invoice' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleGenerateInvoice} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Buat Invoice & Tagihan Pelanggan
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Pelanggan / Toko</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Toko Berkah / Pak Hendra"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Produk / Rincian Order</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Contoh: 5x Baju Gamis Premium"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Nominal Tagihan (Rp)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="450000"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileText size={16} /> Generate & Kirim Invoice PDF ke WhatsApp
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Daftar Tagihan Terkirim
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { no: 'INV-8910', client: 'Budi Santoso', amt: 'Rp 450.000', status: 'LUNAS', date: '30 Jul 2026' },
                { no: 'INV-8911', client: 'Apotek Sehat', amt: 'Rp 1.250.000', status: 'MENUNGGU', date: '30 Jul 2026' },
                { no: 'INV-8912', client: 'Siti Aminah', amt: 'Rp 350.000', status: 'LUNAS', date: '29 Jul 2026' },
              ].map((inv, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{inv.no} — {inv.client}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{inv.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{inv.amt}</div>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
                      inv.status === 'LUNAS' 
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW TAB 3: AI COPYWRITER */}
      {activeTab === 'content' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              AI Generator Copywriting Promo IG/TikTok
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Produk / Promo Yang Ingin Diiklankan</label>
              <input
                type="text"
                value={productTopic}
                onChange={(e) => setProductTopic(e.target.value)}
                placeholder="Contoh: Kopi Susu Gula Aren Diskon Merdeka 20%"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleGenerateContent}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Buat Caption Promo Menarik
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Hasil Caption AI & Hashtag
            </h3>
            {generatedCaption ? (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <p className="text-xs leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200 font-normal">{generatedCaption}</p>
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCaption);
                      triggerToast('Caption berhasil disalin!');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  >
                    <Copy size={13} /> Salin Teks
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Isi nama produk di sebelah kiri lalu klik tombol generator untuk melihat hasil caption promo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW TAB 4: REKAP PENJUALAN HARIAN */}
      {activeTab === 'rekap' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Rekapitulasi Penjualan Harian (Otomatis)
            </h3>
            <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Total Penjualan Hari Ini: Rp 3.850.000
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { time: '14:22', desc: 'Order 5x Paket Combo via WA', amt: 'Rp 250.000', status: 'Lunas (QRIS)' },
              { time: '12:05', desc: 'Invoice #INV-8910 Pembayaran Grosir', amt: 'Rp 1.500.000', status: 'Lunas (Transfer BCA)' },
              { time: '10:15', desc: 'Order 2x Baju Gamis Premium', amt: 'Rp 450.000', status: 'Lunas (QRIS)' },
              { time: '08:40', desc: 'Order Kopi Susu Dusen 10 Pcs', amt: 'Rp 350.000', status: 'Lunas (Cash)' },
            ].map((row, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 font-normal">{row.time}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{row.desc}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{row.amt}</span>
                  <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 px-2 py-0.5 rounded">{row.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW TAB 5: INTEGRATION API & TOKO */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Link2 size={16} className="text-indigo-600 dark:text-indigo-400" />
              Integrasi API, Payment Gateway & Toko Online
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Hubungkan akun WhatsApp Business, Payment Gateway, Instagram/TikTok Shop, dan Google Sheets untuk otomatisasi usaha tanpa ribet.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {[
              {
                id: 'wa_api',
                name: 'WhatsApp Business Cloud API',
                desc: 'Nomor utama untuk kirim tagihan & jawab chat otomatis.',
                type: 'Messaging',
                status: connectedApps['wa_api'] ? 'Connected' : 'Disconnected',
              },
              {
                id: 'qris_gateway',
                name: 'QRIS Statis & Dynamic Gateway',
                desc: 'Terima pembayaran QRIS langsung dari semua E-Wallet & Mobile Banking.',
                type: 'Payments',
                status: connectedApps['qris_gateway'] ? 'Connected' : 'Disconnected',
              },
              {
                id: 'midtrans',
                name: 'Midtrans Payment API',
                desc: 'Metode transfer bank otomatis & kartu kredit/debit.',
                type: 'Payments',
                status: connectedApps['midtrans'] ? 'Connected' : 'Disconnected',
              },
              {
                id: 'xendit',
                name: 'Xendit Virtual Account & Retail',
                desc: 'Terima pembayaran via Indomaret, Alfamart, dan VA Bank.',
                type: 'Payments',
                status: connectedApps['xendit'] ? 'Connected' : 'Disconnected',
              },
              {
                id: 'instagram',
                name: 'Instagram Business Graph API',
                desc: 'Post konten promo buatan AI langsung ke feed & story IG.',
                type: 'Social',
                status: connectedApps['instagram'] ? 'Connected' : 'Disconnected',
              },
              {
                id: 'tiktok_shop',
                name: 'TikTok Shop Partner API',
                desc: 'Sinkronkan stok produk & balasan otomatis order TikTok Shop.',
                type: 'E-Commerce',
                status: connectedApps['tiktok_shop'] ? 'Connected' : 'Disconnected',
              },
              {
                id: 'shopee',
                name: 'Shopee Seller Open API',
                desc: 'Otomatisasi pesan balasan dan rekap order Shopee.',
                type: 'E-Commerce',
                status: connectedApps['shopee'] ? 'Connected' : 'Disconnected',
              },
              {
                id: 'google_sheets',
                name: 'Google Sheets Live Sync',
                desc: 'Export rekap penjualan harian secara real-time ke spreadsheet.',
                type: 'Productivity',
                status: connectedApps['google_sheets'] ? 'Connected' : 'Disconnected',
              },
            ].map((app) => {
              const isConnected = connectedApps[app.id];
              return (
                <div key={app.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{app.name}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {app.type}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px] font-normal leading-relaxed">{app.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                      isConnected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                    }`}>
                      <span className={`size-1.5 rounded-full ${isConnected ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                      {app.status}
                    </span>

                    <button
                      onClick={() => toggleApp(app.id, app.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        isConnected
                          ? 'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-none'
                      }`}
                    >
                      {isConnected ? 'Kelola Integrasi' : 'Hubungkan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
