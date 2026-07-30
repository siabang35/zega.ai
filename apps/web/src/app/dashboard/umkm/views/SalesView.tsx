import React from 'react';
import { 
  DollarSign, ShoppingBag, BarChart3, TrendingUp, ChevronDown 
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
  ArcElement, 
  Filler 
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
  ArcElement, 
  Filler
);

export function SalesView() {
  // Chart.js Line Data for Revenue Over Time
  const lineData = {
    labels: ['1 Jul', '8 Jul', '15 Jul', '22 Jul', '29 Jul'],
    datasets: [
      {
        label: 'Revenue',
        data: [1.2, 2.5, 1.8, 3.2, 2.8],
        borderColor: '#f97316',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#f97316',
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` Rp${context.raw}M`,
        },
      },
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
          callback: (value: any) => `Rp${value}M`
        },
      },
    },
  };

  // Chart.js Doughnut Data for Sales by Channel
  const doughnutData = {
    labels: ['WhatsApp', 'Shopee', 'Instagram', 'TikTok'],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: ['#10b981', '#f97316', '#a855f7', '#06b6d4'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Sales Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pantau performa penjualan dan pertumbuhan bisnis Anda.</p>
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
            <span className="text-xs font-semibold text-slate-400">Orders</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><ShoppingBag size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">116</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 21% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Average Order Value</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><BarChart3 size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">Rp116.379</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 5% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Conversion Rate</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">4.2%</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 1.3% vs last month</div>
          </div>
        </div>
      </div>

      {/* Middle Row: Chart.js Line Chart & Chart.js Doughnut Chart */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Revenue Over Time</h3>
            <span className="text-[10px] font-bold text-slate-400">Daily ∨</span>
          </div>
          <div className="h-56">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Sales by Channel Doughnut */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Sales by Channel</h3>
          <div className="h-44 relative flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-medium">Total</span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">Rp13.5M</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-medium pt-1">
            <div className="flex justify-between"><span>WhatsApp</span><span className="font-bold text-emerald-600">45% (Rp6.1M)</span></div>
            <div className="flex justify-between"><span>Shopee</span><span className="font-bold text-orange-600">30% (Rp4.1M)</span></div>
            <div className="flex justify-between"><span>Instagram</span><span className="font-bold text-purple-600">15% (Rp2.0M)</span></div>
            <div className="flex justify-between"><span>TikTok</span><span className="font-bold text-cyan-600">10% (Rp1.3M)</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Products Table + Sales Goals */}
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Top Products</h3>
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="col-span-6">Product</span>
              <span className="col-span-3 text-center">Sold</span>
              <span className="col-span-3 text-right">Revenue</span>
            </div>
            {[
              { rank: '1.', name: 'Paket Skincare Basic', sold: '32', rev: 'Rp3.840.000' },
              { rank: '2.', name: 'Paket Skincare Premium', sold: '24', rev: 'Rp3.576.000' },
              { rank: '3.', name: 'Serum Brightening', sold: '18', rev: 'Rp2.160.000' },
              { rank: '4.', name: 'Face Wash', sold: '16', rev: 'Rp1.276.000' },
              { rank: '5.', name: 'Moisturizer', sold: '12', rev: 'Rp1.020.000' },
            ].map((p, i) => (
              <div key={i} className="grid grid-cols-12 items-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="col-span-6 flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-4">{p.rank}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</span>
                </div>
                <span className="col-span-3 text-center font-semibold text-slate-500">{p.sold}</span>
                <span className="col-span-3 text-right font-black text-slate-900 dark:text-slate-100">{p.rev}</span>
              </div>
            ))}
          </div>
          <button className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">View all products →</button>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Sales Goals</h3>
            <span className="text-xs text-slate-400 block mt-1">Monthly Goal</span>
            <div className="text-xl font-black mt-2">Rp13.500.000 <span className="text-xs text-slate-400 font-normal">/ Rp20.000.000</span> <span className="text-xs text-orange-500 font-bold ml-1">68%</span></div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: '68%' }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Days Left</span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100">3 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
