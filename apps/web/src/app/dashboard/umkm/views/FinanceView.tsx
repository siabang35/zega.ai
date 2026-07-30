import React, { useState } from 'react';
import { 
  DollarSign, Scale, TrendingUp, ChevronDown, Sparkles, X, ArrowRight 
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
);

interface FinanceViewProps {
  triggerToast?: (msg: string) => void;
}

export function FinanceView({ triggerToast }: FinanceViewProps) {
  const [isGreetingVisible, setIsGreetingVisible] = useState(false);

  // Chart.js Cash Flow Multi-Line Data (Revenue vs Expense)
  const cashFlowData = {
    labels: ['1 Jul', '8 Jul', '15 Jul', '22 Jul', '29 Jul'],
    datasets: [
      {
        label: 'Revenue',
        data: [1.2, 2.5, 1.8, 3.2, 2.8],
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Expense',
        data: [0.6, 1.1, 0.9, 1.4, 1.2],
        borderColor: '#f97316',
        backgroundColor: '#f97316',
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const cashFlowOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.3)' },
        ticks: { 
          color: '#94a3b8', 
          font: { size: 10 },
          callback: (val: any) => `Rp${val}M`
        },
      },
    },
  };

  // Chart.js Doughnut Data for Expense Breakdown
  const expenseData = {
    labels: ['Produk', 'Marketing', 'Operasional', 'Pengiriman', 'Lainnya'],
    datasets: [
      {
        data: [40, 25, 15, 10, 10],
        backgroundColor: ['#3b82f6', '#f97316', '#a855f7', '#10b981', '#64748b'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const expenseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Finance Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kelola keuangan bisnis Anda dengan AI.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span>This Month</span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">Rp13.500.000</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 18% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Expense</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><DollarSign size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">Rp6.250.000</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 12% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Net Profit</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Scale size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">Rp7.250.000</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 24% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Profit Margin</span>
            <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">53.7%</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 5% vs last month</div>
          </div>
        </div>
      </div>

      {/* Middle Row: Cash Flow Chart & Expense Breakdown Doughnut */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Cash Flow Line Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Cash Flow</h3>
            <span className="text-[10px] font-bold text-slate-400">Daily ∨</span>
          </div>
          <div className="h-56">
            <Line data={cashFlowData} options={cashFlowOptions} />
          </div>
        </div>

        {/* Expense Breakdown Doughnut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Expense Breakdown</h3>
          <div className="h-44 relative flex items-center justify-center">
            <Doughnut data={expenseData} options={expenseOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-medium">Total</span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">Rp6.25M</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-medium pt-1">
            <div className="flex justify-between"><span>Produk</span><span className="font-bold text-blue-600">40% (Rp2.5M)</span></div>
            <div className="flex justify-between"><span>Marketing</span><span className="font-bold text-orange-600">25% (Rp1.5M)</span></div>
            <div className="flex justify-between"><span>Operasional</span><span className="font-bold text-purple-600">15% (Rp937K)</span></div>
            <div className="flex justify-between"><span>Pengiriman</span><span className="font-bold text-emerald-600">10% (Rp625K)</span></div>
            <div className="flex justify-between"><span>Lainnya</span><span className="font-bold text-slate-600">10% (Rp625K)</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Outstanding Invoices + AI Finance Assistant Card */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Outstanding Invoices</h3>
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="col-span-3">Invoice</span>
              <span className="col-span-3">Customer</span>
              <span className="col-span-2">Due Date</span>
              <span className="col-span-2 text-right">Amount</span>
              <span className="col-span-2 text-right">Status</span>
            </div>
            {[
              { inv: 'INV-1025', name: 'Siti Aisyah', date: '02 Aug 2026', amt: 'Rp430.000', status: 'Overdue', statusBg: 'bg-rose-100 text-rose-700' },
              { inv: 'INV-1024', name: 'Budi Santoso', date: '03 Aug 2026', amt: 'Rp730.000', status: 'Unpaid', statusBg: 'bg-orange-100 text-orange-700' },
              { inv: 'INV-1023', name: 'Dewi Lestari', date: '05 Aug 2026', amt: 'Rp299.000', status: 'Due Soon', statusBg: 'bg-amber-100 text-amber-700' },
              { inv: 'INV-1022', name: 'Rizky Pratama', date: '07 Aug 2026', amt: 'Rp495.000', status: 'Pending', statusBg: 'bg-blue-100 text-blue-700' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-12 items-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <span className="col-span-3 font-bold text-xs text-slate-900 dark:text-slate-100">{row.inv}</span>
                <span className="col-span-3 text-slate-600 dark:text-slate-300 font-medium truncate">{row.name}</span>
                <span className="col-span-2 text-[10px] text-slate-400 font-mono">{row.date}</span>
                <span className="col-span-2 text-right font-black text-slate-900 dark:text-slate-100">{row.amt}</span>
                <span className="col-span-2 text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${row.statusBg}`}>
                    {row.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <button className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">View all invoices →</button>
        </div>

        {/* AI Finance Assistant Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between z-10">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-orange-500" /> AI Finance Assistant
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">Active</span>
          </div>

          <div className="space-y-2 py-3 my-1">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              AI menemukan <span className="font-bold text-slate-900 dark:text-slate-100">8 penghematan</span> yang bisa dihemat.
            </p>
            <div className="p-3 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Total Potensi Penghematan</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-base">Rp1.050.000</span>
            </div>
          </div>

          <button 
            onClick={() => triggerToast?.('Viewing AI finance recommendations...')}
            className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-orange-500 hover:text-orange-500 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <Sparkles size={14} className="text-orange-500" /> Lihat Rekomendasi
          </button>
        </div>
      </div>
    </div>
  );
}
