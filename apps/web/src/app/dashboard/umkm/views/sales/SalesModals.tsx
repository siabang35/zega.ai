import React, { useState } from 'react';
import {
  X, Check, DollarSign, Target, Calendar, Filter, Sparkles, TrendingUp,
  ShoppingBag, ArrowUpRight, Award, RefreshCw, BarChart2, HelpCircle, User, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '@/i18n/translations';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function ModalBase({ isOpen, onClose, title, children }: ModalBaseProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// 1. Set Sales Goal Modal
export function SetGoalModal({
  isOpen,
  onClose,
  currentGoal,
  onSaveGoal,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  onSaveGoal: (val: number) => void;
  triggerToast: (msg: string) => void
}) {
  const { t } = useLanguage();
  const u = (t.salesView || {}) as any;
  const [target, setTarget] = useState(currentGoal || 20000000);

  const handleSave = () => {
    onSaveGoal(target);
    triggerToast(`Sales goal berhasil diperbarui menjadi Rp${target.toLocaleString('id-ID')}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={u.goalModalTitle || 'Atur Target Penjualan Bulanan'}>
      <div className="space-y-4 text-xs">
        <p className="text-slate-500 dark:text-slate-400">{u.goalModalDesc || 'Tentukan target pendapatan bulanan untuk memotivasi tim sales dan AI Assistant Anda.'}</p>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">{u.targetRevenueLabel || 'Target Pendapatan (Rp)'}</label>
          <div className="relative">
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              step={1000000}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-orange-800 dark:text-orange-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Target size={14} className="text-orange-500" />
            <span>{u.currentGoalPrefix || 'Target Saat Ini:'} Rp{target.toLocaleString('id-ID')}</span>
          </div>
          <p className="text-[11px]">{u.goalProgressNote || 'Progres pencapaian Anda saat ini akan dihitung secara otomatis secara real-time.'}</p>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          {u.saveNewGoalBtn || 'Simpan Target Baru'}
        </button>
      </div>
    </ModalBase>
  );
}

// 2. Date Range Filter Modal
export function DateFilterModal({
  isOpen,
  onClose,
  onSelectRange,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectRange: (label: string) => void;
  triggerToast: (msg: string) => void
}) {
  const ranges = [
    { label: 'Hari Ini (Today)', val: '4 Agt 2026' },
    { label: '7 Hari Terakhir', val: '28 Jul - 4 Agt 2026' },
    { label: '30 Hari Terakhir', val: '5 Jul - 4 Agt 2026' },
    { label: 'Bulan Ini (Juli 2026)', val: '1 Jul - 31 Jul 2026' },
    { label: 'Bulan Lalu (Juni 2026)', val: '1 Jun - 30 Jun 2026' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Pilih Rentang Waktu Penjualan">
      <div className="space-y-2 text-xs">
        {ranges.map((r, i) => (
          <button
            key={i}
            onClick={() => {
              onSelectRange(r.val);
              triggerToast(`Periode data diubah ke: ${r.val}`);
              onClose();
            }}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-slate-900 dark:text-slate-100 font-bold cursor-pointer transition-all"
          >
            <span>{r.label}</span>
            <span className="text-[11px] font-medium text-slate-400">{r.val}</span>
          </button>
        ))}
      </div>
    </ModalBase>
  );
}

// 3. Advanced Filter Modal
export function FilterModal({
  isOpen,
  onClose,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void
}) {
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const handleApply = () => {
    triggerToast(`Filter diterapkan: Channel=${selectedChannel}, Status=${selectedStatus}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Filter Penjualan Lanjutan">
      <div className="space-y-4 text-xs">
        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Filter Channel Sales</label>
          <div className="grid grid-cols-2 gap-2">
            {['All', 'WhatsApp', 'Shopee', 'Instagram', 'TikTok'].map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer ${selectedChannel === ch
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Status Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            {['All', 'Lunas', 'Menunggu', 'Refund'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer ${selectedStatus === st
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleApply}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer shadow-md"
        >
          Terapkan Filter
        </button>
      </div>
    </ModalBase>
  );
}

// 4. Help Info Modal
export function HelpInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Panduan & Metrik Revenue Over Time">
      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <BarChart2 size={14} className="text-orange-500" />
            <span>Bagaimana Revenue Dihitung?</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Grafik Revenue Over Time menampilkan akumulasi total transaksi pembayaran yang telah dikonfirmasi (Lunas) dari semua saluran (WhatsApp, Shopee, Instagram, TikTok) secara real-time via Supabase WebSockets.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Verifikasi Pembayaran Otomatis</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            AI Assistant ZEGA memverifikasi setiap transaksi pembayaran dan memperbarui metrik penjualan tanpa perlu input manual.
          </p>
        </div>
      </div>
    </ModalBase>
  );
}

// 5. All Top Products Modal
export function AllProductsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const products = [
    { rank: 1, name: 'Paket Skincare Basic', sold: 32, rev: 'Rp3.840.000', trend: '↑ 16%' },
    { rank: 2, name: 'Paket Skincare Premium', sold: 24, rev: 'Rp3.576.000', trend: '↑ 12%' },
    { rank: 3, name: 'Serum Brightening', sold: 18, rev: 'Rp2.160.000', trend: '↑ 8%' },
    { rank: 4, name: 'Face Wash', sold: 16, rev: 'Rp1.276.000', trend: '↑ 4%' },
    { rank: 5, name: 'Moisturizer', sold: 12, rev: 'Rp1.020.000', trend: '↑ 6%' },
    { rank: 6, name: 'Sunscreen Gel SPF50', sold: 10, rev: 'Rp850.000', trend: '↑ 5%' },
    { rank: 7, name: 'Toner Hydra Boosting', sold: 8, rev: 'Rp780.000', trend: '↑ 3%' },
  ];

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Laporan Lengkap Produk Terlaris">
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <span className="col-span-5">Produk</span>
          <span className="col-span-3 text-center">Terjual</span>
          <span className="col-span-4 text-right">Revenue</span>
        </div>

        {products.map((p) => (
          <div key={p.rank} className="grid grid-cols-12 items-center p-2.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="col-span-5 flex items-center gap-2">
              <span className="font-extrabold text-orange-500 w-4">{p.rank}.</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
            </div>
            <span className="col-span-3 text-center font-bold text-slate-600 dark:text-slate-300">{p.sold} unit</span>
            <div className="col-span-4 text-right">
              <div className="font-black text-slate-900 dark:text-slate-100">{p.rev}</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{p.trend}</div>
            </div>
          </div>
        ))}
      </div>
    </ModalBase>
  );
}

// 6. All Channels Modal (Sub-View with Interactive SVG Donut Chart)
export function AllChannelsModal({ isOpen, onClose, channelData = [] }: { isOpen: boolean; onClose: () => void; channelData?: any[] }) {
  const defaultChannels = [
    { channel_name: 'WhatsApp Business API', total_revenue_idr: 6100000, orders_count: 52, percentage: 45.0, conversion_rate: 5.8, color_hex: '#10b981', cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp' },
    { channel_name: 'Shopee Seller Store', total_revenue_idr: 4100000, orders_count: 35, percentage: 30.0, conversion_rate: 4.2, color_hex: '#f97316', cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/shopee.png' },
    { channel_name: 'Instagram Direct', total_revenue_idr: 2000000, orders_count: 18, percentage: 15.0, conversion_rate: 3.4, color_hex: '#a855f7', cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/instagram.png' },
    { channel_name: 'TikTok Shop Messaging', total_revenue_idr: 1300000, orders_count: 11, percentage: 10.0, conversion_rate: 2.9, color_hex: '#06b6d4', cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/tiktok.webp' }
  ];

  const channels = channelData.length ? channelData : defaultChannels;
  const totalRev = channels.reduce((acc, c) => acc + (c.total_revenue_idr || c.amount || 0), 0);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Rincian & Visualisasi Penjualan Per Channel">
      <div className="space-y-5 text-xs font-sans">
        {/* Interactive Donut Chart Visualizer */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="relative size-36 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              {(() => {
                let accumulatedPercent = 0;
                return channels.map((c, idx) => {
                  const pct = Number(c.percentage || 25);
                  const strokeDasharray = `${pct} ${100 - pct}`;
                  const strokeDashoffset = -accumulatedPercent;
                  accumulatedPercent += pct;
                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={c.color_hex || '#10b981'}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      pathLength="100"
                      className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[9px] uppercase font-black text-slate-400">Total Omset</span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">Rp{(totalRev / 1000000).toFixed(1)}M</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 w-full">
            <div className="flex justify-between items-center pb-1 border-b border-slate-200/60 dark:border-slate-700/60 text-[10px] uppercase font-extrabold text-slate-400">
              <span>Channel</span>
              <span>Pangsa / Conversion</span>
            </div>
            {channels.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color_hex || '#10b981' }} />
                  <span className="text-slate-800 dark:text-slate-200">{c.channel_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-900 dark:text-slate-100 font-black">{c.percentage}%</span>
                  <span className="text-[10px] text-slate-400 font-medium block">CR: {c.conversion_rate || '4.2'}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Channel Breakdown Cards */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">Breakdown Per Saluran Real-time:</h4>
          {channels.map((c, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <img
                    src={c.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png'}
                    alt={c.channel_name}
                    className="size-6 object-contain rounded-lg bg-slate-50 p-0.5 border border-slate-200/60 dark:border-slate-700"
                  />
                  <div>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-xs block">{c.channel_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{c.orders_count || 30} Pesanan Selesai</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 dark:text-slate-100 text-xs block">Rp{(c.total_revenue_idr || c.amount || 0).toLocaleString('id-ID')}</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Pangsa: {c.percentage}%</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.percentage}%`, backgroundColor: c.color_hex || '#10b981' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalBase>
  );
}

// 6b. Sales By Source Modal
export function SalesBySourceModal({ isOpen, onClose, sourceData = [] }: { isOpen: boolean; onClose: () => void; sourceData?: any[] }) {
  const defaultSources = [
    { source_name: 'WhatsApp Direct', channel_category: 'Messaging', impressions: 12500, clicks: 3200, conversions: 52, revenue_idr: 6100000, growth_pct: 18.5, cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp' },
    { source_name: 'Shopee Live & Search', channel_category: 'Marketplace', impressions: 24100, clicks: 4800, conversions: 35, revenue_idr: 4100000, growth_pct: 14.2, cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/shopee.png' },
    { source_name: 'Instagram Reels Ads', channel_category: 'Social Media', impressions: 18400, clicks: 2100, conversions: 18, revenue_idr: 2000000, growth_pct: 12.0, cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/instagram.png' },
    { source_name: 'TikTok Shop Affiliate', channel_category: 'Short Video', impressions: 31200, clicks: 3900, conversions: 11, revenue_idr: 1300000, growth_pct: 22.4, cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/tiktok.webp' }
  ];

  const sources = sourceData.length ? sourceData : defaultSources;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Laporan Sumber Trafik & Atribusi Penjualan">
      <div className="space-y-4 text-xs font-sans">
        <p className="text-slate-500 dark:text-slate-400 font-medium">Analisa dari mana datangnya calon pembeli dan performa konversi per sumber iklan & organik.</p>

        <div className="space-y-3">
          {sources.map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={s.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png'} alt={s.source_name} className="size-6 object-contain rounded-lg bg-white p-0.5" />
                  <div>
                    <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{s.source_name}</h5>
                    <span className="text-[10px] text-slate-400 font-medium">{s.channel_category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 dark:text-slate-100 text-xs block">Rp{(s.revenue_idr ?? s.total_revenue_idr ?? 0).toLocaleString('id-ID')}</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">↑ {s.growth_pct}% vs bln lalu</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center text-[10px]">
                <div>
                  <span className="text-slate-400 block font-medium">Impressions</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{(s.impressions ?? 0).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Klik Kontak</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">{(s.clicks ?? 0).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Konversi Pembeli</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{s.conversions ?? s.buyers_count ?? 0} order</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalBase>
  );
}

// 7. AI Executive Monthly Report Modal
export function AiReportModal({
  isOpen,
  onClose,
  insights = [],
  monthlyReport = null
}: {
  isOpen: boolean;
  onClose: () => void;
  insights?: any[];
  monthlyReport?: any;
}) {
  const rawReport = Array.isArray(monthlyReport) ? monthlyReport[0] : monthlyReport;
  const report = rawReport || {
    period_month: 'Juli 2026',
    total_revenue_idr: 13500000,
    total_orders: 116,
    avg_order_value_idr: 116379,
    total_refund_idr: 250000,
    repeat_customer_pct: 42.0,
    returning_customer_val_idr: 5670000,
    best_day_date: '22 Juli 2026',
    best_day_revenue_idr: 920000,
    ai_executive_summary: 'Performa penjualan Juli 2026 tumbuh 18% vs bulan lalu driven by WhatsApp Direct Conversions & Shopee Live Flash Sale.'
  };

  const totalRev = Number(report.total_revenue_idr || 13500000);
  const totalOrders = Number(report.total_orders || 116);
  const bestDayRev = Number(report.best_day_revenue_idr || 920000);
  const totalRefund = Number(report.total_refund_idr || 250000);
  const returningVal = Number(report.returning_customer_val_idr || 5670000);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Laporan Eksekutif Bulanan & AI Intelligence">
      <div className="space-y-4 text-xs font-sans">
        {/* Executive Overview Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 space-y-1">
            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block">TOTAL REVENUE ({report.period_month})</span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100">Rp{totalRev.toLocaleString('id-ID')}</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">PESANAN TERKONFIRMASI</span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100">{totalOrders} Transaksi</span>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">Metrik Finansial & Retensi Bulanan:</h4>
          <div className="space-y-1.5 text-xs font-medium">
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-500">Hari Penjualan Tertinggi (Best Day):</span>
              <span className="font-bold text-emerald-600">{report.best_day_date} (Rp{report.best_day_revenue_idr?.toLocaleString('id-ID') || '920.000'})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-500">Total Pengembalian Dana (Refund):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">Rp{report.total_refund_idr?.toLocaleString('id-ID') || '250.000'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-500">Rasio Pembeli Berulang (Repeat Rate):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{report.repeat_customer_pct}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Nilai Omset Returning Customer:</span>
              <span className="font-black text-orange-600 dark:text-orange-400">Rp{report.returning_customer_val_idr?.toLocaleString('id-ID') || '5.670.000'}</span>
            </div>
          </div>
        </div>

        {/* AI Intelligence Insights Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles size={14} className="text-orange-500" />
              <span>Rekomendasi AI Intelligence ({insights.length} Insights):</span>
            </h4>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {insights.map((ins: any, idx: number) => (
              <div key={ins.id || idx} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={ins.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png'} alt="AI Logo" className="size-5 rounded-lg object-contain bg-slate-50 p-0.5" />
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{ins.headline}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-600 border border-orange-200 dark:border-orange-900/60">
                    {ins.model_engine || '9Router'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">{ins.content}</p>
                {ins.action_suggestion && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                    💡 Rekomendasi AI: {ins.action_suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalBase>
  );
}

// 8. Deploy Real AI Model Sales Swarm Modal
export function DeploySalesSwarmModal({
  isOpen,
  onClose,
  onDeploySwarm,
  triggerToast
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeploySwarm: (modelPayload: any) => Promise<void>;
  triggerToast: (msg: string) => void;
}) {
  const [selectedEngine, setSelectedEngine] = useState('9Router-Auto-Cost-Optimizer');
  const [insightType, setInsightType] = useState('forecast');
  const [customHeadline, setCustomHeadline] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  const realModels = [
    {
      engine: '9Router-Auto-Cost-Optimizer',
      provider: '9router/gpt-4o-mini',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/9router.png',
      desc: 'Layer 5 Intelligent Cost-Optimized Router Engine with sub-200ms latency.'
    },
    {
      engine: 'ZeroClaw-Edge-Daemon',
      provider: 'zeroclaw/daemon-v0.5.3',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
      desc: 'High-throughput edge daemon executing localized sales forecasting.'
    },
    {
      engine: 'ZEGA-Swarm-Llama-3.3-70B',
      provider: '9router/llama-3.3-70b',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
      desc: 'Flagship open-weights enterprise intelligence model for sales analytics.'
    },
    {
      engine: 'Qwen-2.5-Coder-32B',
      provider: '9router/qwen-2.5-coder-32b',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/Qwen.png',
      desc: 'Specialized analytical engine for sales revenue & invoice generation.'
    },
    {
      engine: 'DeepSeek-R1-Reasoning',
      provider: '9router/deepseek-r1',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
      desc: 'Advanced reasoning engine for complex multi-channel conversion analysis.'
    },
    {
      engine: 'Claude-3.5-Sonnet',
      provider: '9router/claude-3.5-sonnet',
      gateway: 'ZeroClaw-Edge-Gateway',
      icon: 'https://cdn.zegaai.site/assets/logo/claude.webp',
      desc: 'Premium natural language model for generating sales copy & strategy.'
    }
  ];

  const handleDeploy = async () => {
    setIsDeploying(true);
    const chosen = realModels.find(m => m.engine === selectedEngine) || realModels[0];

    const modelPayload = {
      model_engine: chosen.engine,
      model_provider: chosen.provider,
      execution_gateway: chosen.gateway,
      cdn_icon_url: chosen.icon,
      insight_type: insightType,
      headline: customHeadline.trim() || `Sales AI Forecast (${chosen.engine})`,
      content: `AI Model ${chosen.engine} menganalisis data omset real-time dan menyarankan penguatan strategi promosi di channel utama.`,
      action_suggestion: `Deploy alokasi iklan otomatis via 9Router Router Engine.`
    };

    await onDeploySwarm(modelPayload);
    setIsDeploying(false);
    triggerToast(`Real AI Model Swarm Deployed: ${chosen.engine}`);
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Deploy Real AI Sales Swarm & Model Engine">
      <div className="space-y-4 text-xs">
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Pilih Real AI Model Engine yang terhubung langsung ke Supabase WebSockets & Cloudflare R2 CDN untuk menghasilkan prediksi sales real-time.
        </p>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-2">Pilih Real AI Model Engine:</label>
          <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
            {realModels.map((m) => (
              <button
                key={m.engine}
                type="button"
                onClick={() => setSelectedEngine(m.engine)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${selectedEngine === m.engine
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 ring-1 ring-orange-500'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
              >
                <img src={m.icon} alt={m.engine} className="size-7 rounded-xl object-contain bg-white p-1 border border-slate-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">{m.engine}</span>
                    <span className="text-[9px] font-mono text-slate-400">{m.provider}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">Judul Prediksi AI Custom (Opsional):</label>
          <input
            type="text"
            value={customHeadline}
            onChange={(e) => setCustomHeadline(e.target.value)}
            placeholder="mis. Prediksi Kenaikan Omset Harian 25%"
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-orange-500 text-xs"
          />
        </div>

        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDeploying ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>{isDeploying ? 'Deploying Model Swarm...' : 'Deploy Real AI Sales Swarm'}</span>
        </button>
      </div>
    </ModalBase>
  );
}

