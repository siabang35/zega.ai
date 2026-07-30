import React from 'react';
import { 
  Users, Plus, Download, UserPlus, RefreshCw, Sparkles, Heart 
} from 'lucide-react';

interface CustomersViewProps {
  triggerToast: (msg: string) => void;
}

export function CustomersView({ triggerToast }: CustomersViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">CUSTOMERS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kenali pelanggan Anda lebih dalam.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => triggerToast('Importing customer list...')}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
          >
            <Download size={14} /> Import Customers
          </button>
          <button 
            onClick={() => triggerToast('Tambah Customer Baru')}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Tambah Customer
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Customers</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Users size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">1.248</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">+12% this month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>New Customers</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><UserPlus size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">126</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">+15% this month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Repeat Customers</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><RefreshCw size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">312</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">+22% this month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Retention Rate</span>
            <div className="size-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center"><Heart size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">68%</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">+5% vs last month</div>
          </div>
        </div>
      </div>

      {/* Middle Section: Customer Segment + Top Customers */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Customer Segment Donut */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Customer Segment</h3>
          <div className="flex items-center justify-center py-4 relative">
            <svg className="size-40 transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f97316" strokeWidth="3.8" strokeDasharray="32, 100" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3.8" strokeDasharray="28, 100" strokeDashoffset="-32" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#a855f7" strokeWidth="3.8" strokeDasharray="22, 100" strokeDashoffset="-60" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3.8" strokeDasharray="18, 100" strokeDashoffset="-82" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">1.248</span>
              <span className="text-[10px] text-slate-400 font-medium">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-orange-500" /> VIP (18%)</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-blue-500" /> Loyal (32%)</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-purple-500" /> Repeat (28%)</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500" /> New (22%)</span>
          </div>
        </div>

        {/* Top Customers Leaderboard */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Top Customers</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="col-span-5">Customer</span>
              <span className="col-span-2 text-center">Orders</span>
              <span className="col-span-3 text-right">Total Spend</span>
              <span className="col-span-2 text-right">Last Order</span>
            </div>
            {[
              { name: 'Siti Aisyah', orders: '12', spend: 'Rp3.200.000', date: '28 Jul 2026', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Budi Santoso', orders: '9', spend: 'Rp2.180.000', date: '27 Jul 2026', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Dewi Lestari', orders: '8', spend: 'Rp1.950.000', date: '26 Jul 2026', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Rizky Pratama', orders: '7', spend: 'Rp1.120.000', date: '26 Jul 2026', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Maya Putri', orders: '6', spend: 'Rp1.450.000', date: '25 Jul 2026', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=80' },
            ].map((c, i) => (
              <div key={i} className="grid grid-cols-12 items-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-2">
                  <img src={c.avatar} alt={c.name} className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0" />
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{c.name}</span>
                </div>
                <span className="col-span-2 text-center text-slate-500 font-semibold">{c.orders}</span>
                <span className="col-span-3 text-right font-black text-slate-900 dark:text-slate-100">{c.spend}</span>
                <span className="col-span-2 text-right text-[10px] text-slate-400 font-mono">{c.date}</span>
              </div>
            ))}
          </div>
          <button onClick={() => triggerToast('Viewing all customers')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">Lihat Semua Customer &gt;</button>
        </div>
      </div>

      {/* Bottom Row: Customer Activity Insight Banner & Stream */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-3xl p-5 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] font-bold text-orange-200 block">Customer Activity</span>
            <h4 className="font-extrabold text-base mt-1">312 pelanggan belum repeat order lebih dari 30 hari.</h4>
            <p className="text-xs text-orange-100 mt-2">Potensi revenue hilang: <span className="font-black text-white">Rp4.120.000</span></p>
          </div>
          <button onClick={() => triggerToast('Automated retention promo triggered!')} className="w-full py-2.5 rounded-2xl bg-white text-orange-600 font-bold text-xs shadow-md hover:bg-orange-50 cursor-pointer">
            Kirim Promo Sekarang
          </button>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Customer Activity Stream</h3>
          <div className="space-y-2 text-xs">
            {[
              { name: 'Siti Aisyah', action: 'Melakukan pembelian Rp450.000', time: '2 jam lalu', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Budi Santoso', action: 'Membuka pesan WhatsApp promo', time: '3 jam lalu', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Dewi Lestari', action: 'Klik link promo diskon', time: '5 jam lalu', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80' },
              { name: 'Rizky Pratama', action: 'Menambahkan produk ke keranjang', time: '6 jam lalu', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&q=80' },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={a.avatar} alt={a.name} className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{a.name}</span>
                    <span className="text-slate-500 font-normal ml-2">{a.action}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 ml-2">{a.time}</span>
              </div>
            ))}
          </div>
          <button onClick={() => triggerToast('Viewing activity stream')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">Lihat Semua Activity &gt;</button>
        </div>
      </div>
    </div>
  );
}
