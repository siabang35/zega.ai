import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, Plus, Download, Upload, Filter, Search, 
  AlertTriangle, TrendingUp, ShoppingBag, DollarSign, Package, 
  AlertCircle, Edit, BarChart2, MoreVertical, ChevronLeft, ChevronRight,
  RefreshCw, Tag, Barcode, Layers, Percent, Check
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { AddProductModal, ImportProductModal, ExportDataModal } from './store/StoreModals';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StoreViewProps {
  triggerToast: (msg: string) => void;
}

export function StoreView({ triggerToast }: StoreViewProps) {
  const [storeData, setStoreData] = useState<any>({
    metrics: {
      total_products: 152,
      total_stock: 1240,
      low_stock_count: 6,
      today_orders: 43,
      stock_value_idr: 24500000.00
    },
    performance: [
      { period_label: '1 Jul', orders_count: 8, revenue_idr: 500000 },
      { period_label: '6 Jul', orders_count: 18, revenue_idr: 1200000 },
      { period_label: '11 Jul', orders_count: 14, revenue_idr: 950000 },
      { period_label: '16 Jul', orders_count: 28, revenue_idr: 2160000 },
      { period_label: '21 Jul', orders_count: 20, revenue_idr: 1400000 },
      { period_label: '26 Jul', orders_count: 35, revenue_idr: 2800000 },
      { period_label: '31 Jul', orders_count: 30, revenue_idr: 2250000 }
    ],
    products: [
      { id: 'p1', name: 'Kaos Polos Hitam', sku: 'TSH-BLK-001', category: 'Apparel', stock: 120, sold: 32, price_idr: 60000, status: 'Aktif', image_path: '/assets/products/kaoshitam.png' },
      { id: 'p2', name: 'Tumbler Premium', sku: 'TMB-PRM-002', category: 'Drinkware', stock: 80, sold: 28, price_idr: 100000, status: 'Aktif', image_path: '/assets/products/tumbler.png' },
      { id: 'p3', name: 'Botol Minum 500ml', sku: 'BTL-500-003', category: 'Drinkware', stock: 60, sold: 24, price_idr: 70000, status: 'Aktif', image_path: '/assets/products/botolminum.jpeg' },
      { id: 'p4', name: 'Hoodie Full Zip', sku: 'HDZ-FZ-004', category: 'Apparel', stock: 45, sold: 18, price_idr: 200000, status: 'Aktif', image_path: '/assets/products/hoodie.webp' },
      { id: 'p5', name: 'Totebag Canvas', sku: 'TTB-CNV-005', category: 'Accessories', stock: 90, sold: 15, price_idr: 50000, status: 'Aktif', image_path: '/assets/products/tottebag.jpeg' }
    ],
    topSelling: [
      { name: 'Kaos Polos Hitam', sold: 32, rev: 'Rp1.920.000', rawPath: '/assets/products/kaoshitam.png' },
      { name: 'Tumbler Premium', sold: 28, rev: 'Rp2.800.000', rawPath: '/assets/products/tumbler.png' },
      { name: 'Botol Minum 500ml', sold: 24, rev: 'Rp1.680.000', rawPath: '/assets/products/botolminum.jpeg' },
      { name: 'Hoodie Full Zip', sold: 18, rev: 'Rp3.600.000', rawPath: '/assets/products/hoodie.webp' },
      { name: 'Totebag Canvas', sold: 15, rev: 'Rp750.000', rawPath: '/assets/products/tottebag.jpeg' }
    ],
    stockAlerts: [
      { name: 'Kaos Oversize Putih', category: 'Apparel', stock: 2, rawPath: '/assets/products/kaoshitam.png' },
      { name: 'Tumbler Silver', category: 'Drinkware', stock: 4, rawPath: '/assets/products/tumbler.png' },
      { name: 'Botol Minum 750ml', category: 'Drinkware', stock: 3, rawPath: '/assets/products/botolminum.jpeg' },
      { name: 'Hoodie Classic Navy', category: 'Apparel', stock: 5, rawPath: '/assets/products/hoodie.webp' },
      { name: 'Totebag Canvas Cream', category: 'Accessories', stock: 4, rawPath: '/assets/products/tottebag.jpeg' }
    ],
    categories: [
      { name: 'Apparel', count: 58, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50' },
      { name: 'Drinkware', count: 34, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50' },
      { name: 'Accessories', count: 28, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50' },
      { name: 'Lainnya', count: 32, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50' }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [chartTab, setChartTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua Kategori');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fetch real-time data from Supabase
  const loadStoreData = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmStoreOverview();
      if (data) {
        setStoreData((prev: any) => ({
          ...prev,
          metrics: data.metrics || prev.metrics,
          products: data.products?.length > 0 ? data.products : prev.products,
          performance: data.performance?.length > 0 ? data.performance : prev.performance
        }));
      }
    } catch (e) {
      console.warn('Store data load error:', e);
    }
  };

  useEffect(() => {
    loadStoreData();
    const unsubscribe = SupabaseDashboardService.subscribeToStoreRealtime(() => {
      loadStoreData();
    });
    return () => unsubscribe();
  }, []);

  // Filtered Products Calculation
  const filteredProducts = storeData.products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua Kategori' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'Semua Status' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Chart Data Setup
  const performanceLabels = storeData.performance.map((item: any) => item.period_label);
  const ordersData = storeData.performance.map((item: any) => item.orders_count);
  const revenueData = storeData.performance.map((item: any) => (item.revenue_idr / 1000000)); // Scaled to Millions for visual alignment

  const chartData = {
    labels: performanceLabels,
    datasets: [
      {
        label: 'Orders',
        data: ordersData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
      },
      {
        label: 'Revenue',
        data: revenueData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { size: 11, weight: 'bold' as const },
        bodyFont: { size: 11, weight: 'normal' as const },
        padding: 10,
        cornerRadius: 12,
        callbacks: {
          label: (context: any) => {
            if (context.dataset.label === 'Orders') {
              return ` Orders: ${context.parsed.y}`;
            }
            return ` Revenue: Rp${(context.parsed.y * 1000000).toLocaleString('id-ID')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        ticks: {
          font: { size: 10, weight: 'bold' as const },
          color: '#94a3b8',
          callback: (value: any) => `Rp${value}M`
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Store</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Kelola produk, stok, dan pesanan dengan mudah dalam satu dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Download size={14} /> <span>Import Produk</span>
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Upload size={14} /> <span>Export Data</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus size={16} /> <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Card 1: Total Produk */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Total Produk</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{storeData.metrics.total_products}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 8 produk baru</div>
          </div>
        </div>

        {/* Card 2: Total Stok */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Total Stok</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{storeData.metrics.total_stock.toLocaleString('id-ID')}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 120 unit masuk</div>
          </div>
        </div>

        {/* Card 3: Stok Rendah */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Stok Rendah</span>
            <div className="size-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{storeData.metrics.low_stock_count}</div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">Perlu perhatian</div>
          </div>
        </div>

        {/* Card 4: Orders Hari Ini */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Orders Hari Ini</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{storeData.metrics.today_orders}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 18% vs kemarin</div>
          </div>
        </div>

        {/* Card 5: Nilai Stok */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Nilai Stok</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(storeData.metrics.stock_value_idr).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">Total value semua stok</div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Chart, Top Selling Products, & Stok Alert */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Col 1: Performa Store Chart (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Performa Store</span>
              </h3>
              <div className="flex items-center gap-4 text-[11px] font-bold pt-1">
                <span className="text-blue-500 flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Orders</span>
                <span className="text-emerald-500 flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Revenue</span>
              </div>
            </div>

            {/* Time Horizon Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-extrabold">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Col 2: Top Selling Products (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Top Selling Products</h3>
            <button onClick={() => triggerToast('Viewing all top products')} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>Produk</span>
              <span>Terjual</span>
              <span className="text-right">Revenue</span>
            </div>

            {storeData.topSelling.map((p: any, i: number) => {
              const rawImg = p.rawPath || '/assets/products/kaoshitam.png';
              const cdnImg = getR2CdnUrl(rawImg, true);

              return (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                      <img 
                        src={cdnImg} 
                        alt={p.name} 
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('cdn.zegaai.site')) {
                            target.src = rawImg;
                          } else {
                            target.src = generateInitialsAvatar(p.name);
                          }
                        }}
                      />
                    </div>
                    <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 truncate max-w-[90px]">{p.name}</span>
                  </div>
                  <span className="text-slate-500 font-bold text-[11px]">{p.sold}</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px]">{p.rev || `Rp${(p.price_idr * p.sold).toLocaleString('id-ID')}`}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 3: Stok Alert (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Stok Alert</span>
              </h3>
              <button onClick={() => triggerToast('Viewing low stock items')} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {storeData.stockAlerts.map((item: any, i: number) => {
                const rawImg = item.rawPath || '/assets/products/kaoshitam.png';
                const cdnImg = getR2CdnUrl(rawImg, true);

                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                        <img 
                          src={cdnImg} 
                          alt={item.name} 
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('cdn.zegaai.site')) {
                              target.src = rawImg;
                            } else {
                              target.src = generateInitialsAvatar(item.name);
                            }
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 truncate max-w-[90px]">{item.name}</h4>
                        <span className="text-[9px] text-slate-400 font-medium block">{item.category}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                      Stok: {item.stock}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => triggerToast('Membuka Manajemen Stok Rendah')}
            className="w-full py-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-600 dark:text-orange-400 font-extrabold text-xs transition-all cursor-pointer text-center"
          >
            Kelola Stok Rendah
          </button>
        </div>
      </div>

      {/* 4. Bottom Section: Daftar Produk Main Table & Side Panel */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Main Product Table (lg:col-span-9) */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          {/* Table Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Daftar Produk</h3>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-orange-500 w-44"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none"
              >
                <option value="Semua Kategori">Semua Kategori</option>
                <option value="Apparel">Apparel</option>
                <option value="Drinkware">Drinkware</option>
                <option value="Accessories">Accessories</option>
                <option value="Lainnya">Lainnya</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
                <option value="Draft">Draft</option>
              </select>

              {/* Filter Button */}
              <button 
                onClick={() => triggerToast('Filter diterapkan')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
              >
                <Filter size={12} /> <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Table Rendering */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">PRODUK</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">KATEGORI</th>
                  <th className="py-2.5 px-3">STOK</th>
                  <th className="py-2.5 px-3">TERJUAL</th>
                  <th className="py-2.5 px-3">HARGA</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((product: any, idx: number) => {
                  const rawImg = product.image_path || '/assets/products/kaoshitam.png';
                  const cdnImg = getR2CdnUrl(rawImg, true);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                            <img 
                              src={cdnImg} 
                              alt={product.name} 
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src.includes('cdn.zegaai.site')) {
                                  target.src = rawImg;
                                } else {
                                  target.src = generateInitialsAvatar(product.name);
                                }
                              }}
                            />
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{product.sku}</td>
                      <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">{product.category}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-slate-100">{product.stock}</td>
                      <td className="py-3 px-3 font-bold text-slate-500">{product.sold}</td>
                      <td className="py-3 px-3 font-black text-slate-900 dark:text-slate-100">
                        Rp{(product.price_idr).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          product.status === 'Aktif' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-slate-400">
                          <button onClick={() => triggerToast(`Edit produk: ${product.name}`)} className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => triggerToast(`Analisis produk: ${product.name}`)} className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
                            <BarChart2 size={14} />
                          </button>
                          <button onClick={() => triggerToast(`Opsi tambahan: ${product.name}`)} className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-semibold text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <span>Menampilkan 1 - 5 dari {storeData.metrics.total_products} produk</span>
            <div className="flex items-center gap-1">
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <button className="size-7 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center shadow-xs">1</button>
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">2</button>
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">3</button>
              <span className="px-1 text-slate-400">...</span>
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">31</button>
              <button className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel Column (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Kategori Produk Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Kategori Produk</h3>
              <button onClick={() => triggerToast('Kelola Kategori')} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {storeData.categories.map((cat: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{cat.count || cat.product_count} Produk</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aksi Cepat Grid Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Aksi Cepat</h3>

            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-extrabold">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-orange-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 mx-auto grid place-items-center">
                  <Package size={14} />
                </div>
                <span>Tambah Produk</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 mx-auto grid place-items-center">
                  <Upload size={14} />
                </div>
                <span>Bulk Upload</span>
              </button>

              <button
                onClick={() => triggerToast('Pengaturan Diskon')}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 mx-auto grid place-items-center">
                  <Percent size={14} />
                </div>
                <span>Atur Diskon</span>
              </button>

              <button
                onClick={() => triggerToast('Kelola Kategori Produk')}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 mx-auto grid place-items-center">
                  <Tag size={14} />
                </div>
                <span>Kelola Kategori</span>
              </button>

              <button
                onClick={() => triggerToast('Mencetak Barcode Produk')}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 mx-auto grid place-items-center">
                  <Barcode size={14} />
                </div>
                <span>Cetak Barcode</span>
              </button>

              <button
                onClick={() => { loadStoreData(); triggerToast('Stok berhasil disinkronkan!'); }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 mx-auto grid place-items-center">
                  <RefreshCw size={14} />
                </div>
                <span>Sinkron Stok</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        triggerToast={triggerToast} 
        onRefresh={loadStoreData} 
      />
      <ImportProductModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        triggerToast={triggerToast} 
      />
      <ExportDataModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        triggerToast={triggerToast} 
      />
    </div>
  );
}
