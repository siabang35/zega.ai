import React, { useState } from 'react';
import { 
  BarChart3, Download, TrendingUp, ShoppingBag, Users, 
  DollarSign, ChevronDown 
} from 'lucide-react';

interface ReportsViewProps {
  triggerToast: (msg: string) => void;
}

export function ReportsView({ triggerToast }: ReportsViewProps) {
  const [subTab, setSubTab] = useState('Overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">REPORTS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Laporan lengkap performa bisnis Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>This Month</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <button 
            onClick={() => triggerToast('Exporting Report PDF...')}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        {['Overview', 'Sales', 'Marketing', 'Store', 'Finance', 'Customers'].map((t) => (
          <button 
            key={t}
            onClick={() => setSubTab(t)}
            className={`pb-3 transition-all cursor-pointer ${
              subTab === t 
                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 5 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Revenue', val: 'Rp13.500.000', change: '+18% vs last month', icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Orders', val: '116', change: '+21% vs last month', icon: ShoppingBag, color: 'text-orange-500' },
          { label: 'New Customers', val: '126', change: '+14% vs last month', icon: Users, color: 'text-purple-500' },
          { label: 'Avg Order Value', val: 'Rp116.379', change: '+5% vs last month', icon: BarChart3, color: 'text-blue-500' },
          { label: 'Conversion Rate', val: '4.2%', change: '+1.3% vs last month', icon: TrendingUp, color: 'text-emerald-500' },
        ].map((m, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 font-semibold block truncate">{m.label}</span>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{m.val}</div>
            <span className="text-[10px] font-bold text-emerald-600 block">{m.change}</span>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Sales by Channel */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Revenue Over Time Line Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Revenue Over Time</h3>
            <span className="text-[10px] font-bold text-slate-400">Daily ∨</span>
          </div>
          <div className="h-44 flex items-end justify-between pt-6 px-2 border-b border-slate-100 dark:border-slate-800">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
              <path d="M 0 80 Q 50 30, 100 60 T 200 20 T 300 70 T 400 10" fill="none" stroke="#f97316" strokeWidth="3" />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-2">
            <span>1 Jul</span><span>8 Jul</span><span>15 Jul</span><span>22 Jul</span><span>29 Jul</span>
          </div>
        </div>

        {/* Sales by Channel Donut */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Sales by Channel</h3>
          <div className="flex items-center justify-center py-2 relative">
            <svg className="size-36 transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="4" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="45, 100" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="30, 100" strokeDashoffset="-45" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#a855f7" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="-75" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#06b6d4" strokeWidth="4" strokeDasharray="10, 100" strokeDashoffset="-90" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-400 font-medium">Total</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">Rp13.5M</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-medium">
            <div className="flex justify-between"><span>WhatsApp</span><span className="font-bold text-emerald-600">45% (Rp6.1M)</span></div>
            <div className="flex justify-between"><span>Shopee</span><span className="font-bold text-orange-600">30% (Rp4.1M)</span></div>
            <div className="flex justify-between"><span>Instagram</span><span className="font-bold text-purple-600">15% (Rp2.0M)</span></div>
            <div className="flex justify-between"><span>TikTok</span><span className="font-bold text-cyan-600">10% (Rp1.3M)</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Products + Sales Goals + Summary Insight */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Top Products</h3>
          <div className="space-y-2 text-xs">
            {[
              { rank: '1.', name: 'Kaos Polos Hitam', sold: '32', rev: 'Rp1.920.000' },
              { rank: '2.', name: 'Tumbler Premium', sold: '28', rev: 'Rp2.800.000' },
              { rank: '3.', name: 'Botol Minum 500ml', sold: '24', rev: 'Rp1.680.000' },
              { rank: '4.', name: 'Hoodie Full Zip', sold: '18', rev: 'Rp3.600.000' },
              { rank: '5.', name: 'Totebag Canvas', sold: '15', rev: 'Rp750.000' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-4">{p.rank}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</span>
                </div>
                <span className="font-bold text-xs">{p.rev}</span>
              </div>
            ))}
          </div>
          <button onClick={() => triggerToast('Viewing all products')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">Lihat Semua Produk &gt;</button>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Sales Goals</h3>
            <span className="text-xs text-slate-400 block mt-1">Monthly Goal</span>
            <div className="text-lg font-black mt-2">Rp13.500.000 <span className="text-xs text-slate-400 font-normal">/ Rp20.000.000</span> <span className="text-xs text-orange-500 font-bold ml-1">68%</span></div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: '68%' }} />
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs text-slate-400">Days Left</span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">3 days</span>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Summary Insight</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Pendapatan Anda naik <span className="font-bold text-emerald-600">18%</span> dari periode sebelumnya. Channel WhatsApp memberikan kontribusi terbesar.
            </p>
          </div>
          <button onClick={() => triggerToast('Viewing full insights')} className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
            Lihat Insight Lengkap
          </button>
        </div>
      </div>
    </div>
  );
}
