import React, { useState, useEffect } from 'react';
import { 
  Store, Store as StoreIcon, Plus, Download, Upload, Filter, Search, 
  AlertTriangle, TrendingUp, ShoppingBag, DollarSign, Package, 
  AlertCircle, Edit, BarChart2, MoreVertical, ChevronLeft, ChevronRight,
  RefreshCw, Tag, Barcode, Layers, Percent, Check, Sparkles
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { 
  AddProductModal, ImportProductModal, ExportDataModal, DeployStoreSwarmModal,
  EditProductModal, ProductAnalysisModal, BulkDiscountModal, ManageCategoriesModal,
  BarcodePrintModal, StockSyncModal
} from './store/StoreModals';
import { StoreHeaderShell } from './store/StoreHeaderShell';

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
  defaultSubView?: 'catalog' | 'top_selling' | 'stock_alert';
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function StoreView({ defaultSubView = 'catalog', triggerToast, onNavigateTab }: StoreViewProps) {
  const { t, language } = useLanguage();
  const s = (t.storeView || {}) as any;
  const [storeData, setStoreData] = useState<any>({
    metrics: {
      total_products: 0,
      total_stock: 0,
      low_stock_count: 0,
      today_orders: 0,
      stock_value_idr: 0
    },
    performance: [],
    products: [],
    topSelling: [],
    stockAlerts: [],
    categories: []
  });

  const [loading, setLoading] = useState(false);
  const [chartTab, setChartTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua Kategori');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [subView, setSubView] = useState<'catalog' | 'top_selling' | 'stock_alert'>(defaultSubView);

  useEffect(() => {
    if (defaultSubView) {
      setSubView(defaultSubView);
      if (defaultSubView === 'stock_alert') setLowStockFilter(true);
      if (defaultSubView === 'top_selling') setLowStockFilter(false);
    }
  }, [defaultSubView]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);

  // New Interactive Action Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any>(null);
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<any>(null);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<any>(null);

  // Fetch real-time data from Supabase
  const loadStoreData = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmStoreOverview();
      if (data) {
        setStoreData((prev: any) => ({
          ...prev,
          metrics: data.metrics || prev.metrics,
          products: Array.isArray(data.products) ? data.products : [],
          performance: data.performance?.length > 0 ? data.performance : prev.performance,
          topSelling: data.topSelling || [],
          stockAlerts: data.stockAlerts || [],
          categories: data.categories || prev.categories,
          swarms: data.swarms || prev.swarms,
          insights: data.insights || prev.insights
        }));
      }
    } catch (e) {
      console.warn('Store data load error:', e);
    }
  };

  const handleQuickRestock = async (productId: string, addStock: number, productName: string) => {
    try {
      await SupabaseDashboardService.quickRestockProduct(productId, addStock);
      triggerToast(`✓ Stok "${productName}" berhasil ditambah +${addStock} unit di Supabase!`);
      loadStoreData();
    } catch (err: any) {
      triggerToast(`⚠️ Gagal memperbarui stok: ${err?.message || 'Error'}`);
    }
  };

  const handleExecuteInsight = async (id: string, label: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'applied' ? 'active' : 'applied';
    triggerToast(nextStatus === 'applied' ? `✓ Action "${label}" Berhasil Diterapkan!` : `Action "${label}" Di-undo.`);

    setStoreData((prev: any) => ({
      ...prev,
      insights: (prev.insights || []).map((ins: any) =>
        ins.id === id ? { ...ins, status: nextStatus } : ins
      )
    }));

    try {
      await SupabaseDashboardService.executeStoreInsightAction(id, label, nextStatus);
    } catch (err) {
      console.warn('Store insight action update note:', err);
    }
  };

  const handleShowLowStock = () => {
    setLowStockFilter(true);
    triggerToast('✓ Menampilkan Produk Kritis dengan Stok Rendah (≤ 10 unit)');
    const tableEl = document.getElementById('product-table-section');
    if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShowTopSelling = () => {
    setLowStockFilter(false);
    setCategoryFilter('Semua Kategori');
    setStatusFilter('Semua Status');
    triggerToast('✓ Menampilkan Seluruh Katalog Produk Terlaris!');
    const tableEl = document.getElementById('product-table-section');
    if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
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
    const matchesLowStock = !lowStockFilter || p.stock <= 10;
    return matchesSearch && matchesCategory && matchesStatus && matchesLowStock;
  });

  // Chart Data Setup for Daily, Weekly, Monthly Horizons
  const getChartDatasets = () => {
    if (chartTab === 'Daily') {
      return {
        labels: ['1 Aug', '2 Aug', '3 Aug', '4 Aug', '5 Aug', '6 Aug', '7 Aug'],
        orders: [5, 12, 8, 15, 22, 19, 24],
        revenue: [0.35, 0.84, 0.56, 1.05, 1.54, 1.33, 1.68] // Millions IDR
      };
    }
    if (chartTab === 'Monthly') {
      return {
        labels: ['Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'],
        orders: [120, 185, 240, 310, 420, 390],
        revenue: [8.4, 12.95, 16.8, 21.7, 29.4, 27.3] // Millions IDR
      };
    }
    // Default: Weekly
    const performanceLabels = storeData.performance && storeData.performance.length > 0
      ? storeData.performance.map((item: any) => item.period_label)
      : ['1 Jul', '6 Jul', '11 Jul', '16 Jul', '21 Jul', '26 Jul', '31 Jul'];

    const ordersData = storeData.performance && storeData.performance.length > 0
      ? storeData.performance.map((item: any) => item.orders_count)
      : [8, 18, 14, 28, 20, 35, 30];

    const revenueData = storeData.performance && storeData.performance.length > 0
      ? storeData.performance.map((item: any) => (item.revenue_idr / 1000000))
      : [0.5, 1.2, 0.95, 2.16, 1.4, 2.8, 2.25];

    return {
      labels: performanceLabels,
      orders: ordersData,
      revenue: revenueData
    };
  };

  const activeChart = getChartDatasets();

  const chartData = {
    labels: activeChart.labels,
    datasets: [
      {
        label: 'Orders',
        data: activeChart.orders,
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
        data: activeChart.revenue,
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

  // --- FULL DEDICATED PAGE 1: TOP SELLING PRODUCTS & PERFORMANCE ANALYTICS ---
  if (subView === 'top_selling') {
    const sortedTopSelling = [...storeData.products].sort((a, b) => (b.sold || 0) - (a.sold || 0));
    const totalTopRev = sortedTopSelling.reduce((acc, p) => acc + ((p.sold || 0) * (Number(p.price_idr) || 0)), 0);
    const totalTopSold = sortedTopSelling.reduce((acc, p) => acc + (p.sold || 0), 0);
    const topLeader = sortedTopSelling[0];

    return (
      <div className="space-y-6 animate-in fade-in pb-28 sm:pb-8">
        {/* Full Page Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <button onClick={() => setSubView('catalog')} className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 cursor-pointer">
                <Store size={14} className="text-orange-500" />
                <span>{s.title || 'Store Management'}</span>
              </button>
              <ChevronRight size={13} />
              <span className="text-blue-600 dark:text-blue-400 font-black">{s.topSelling || 'Top Selling'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🏆 {s.topSellingAndOrders || 'Top Selling Products & Performance Analytics'}</span>
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white">ZEGA AI</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
              {s.subtitle || 'Manage product catalog, stock inventory, and multi-channel store sync.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSubView('catalog')}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-extrabold text-xs hover:bg-slate-800 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
            >
              ← {s.mainCatalog || 'Overview Store'}
            </button>
          </div>
        </div>

        {/* Dedicated KPI Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-1">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>{s.estimatedRevenue || 'Total Omset Top Selling'}</span>
              <DollarSign size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Rp{totalTopRev.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-blue-600 font-bold">↑ 24%</div>
          </div>

          <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{s.totalStock || 'Total Volume Terjual'}</span>
              <Package size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalTopSold} Unit
            </div>
            <div className="text-[10px] text-emerald-600 font-bold">Across all channels</div>
          </div>

          <div className="p-4 rounded-3xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 space-y-1">
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
              <span>{s.topSelling || 'Produk Juara #1'}</span>
              <TrendingUp size={16} />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
              {topLeader ? topLeader.name : '-'}
            </div>
            <div className="text-[10px] text-purple-600 font-bold">{topLeader ? `${topLeader.sold} unit` : '-'}</div>
          </div>

          <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 space-y-1">
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>{s.aiAnalysis || 'Status AI Catalog'}</span>
              <Sparkles size={16} />
            </div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              ⚡ High Conversion
            </div>
            <div className="text-[10px] text-amber-600 font-bold">ZEGA AI</div>
          </div>
        </div>

        {/* Dedicated Top Selling Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{s.leaderboardTitle || 'Leaderboard Penjualan Produk Terlaris'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
                {sortedTopSelling.length} {s.activeCatalog || 'Produk'}
              </span>
            </h3>

            {/* Filter Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={s.searchProductPlaceholder || 'Cari produk...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">{s.colProduct || 'PRODUK TERLARIS'}</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">{s.colCategory || 'KATEGORI'}</th>
                  <th className="py-3 px-3">TERJUAL</th>
                  <th className="py-3 px-3">{s.estimatedRevenue || 'ESTIMASI REVENUE'}</th>
                  <th className="py-3 px-3">{s.remainingStock || 'SISA STOK'}</th>
                  <th className="py-3 px-3 text-right">{s.aiPromoAction || 'AKSI PROMO AI'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedTopSelling
                  .filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((product: any, idx: number) => {
                    const estRevenue = (product.sold || 0) * (Number(product.price_idr) || 0);

                    return (
                      <tr key={product.id || idx} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className={`size-8 rounded-xl font-black text-xs flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                            idx === 1 ? 'bg-slate-300 text-slate-900 shadow-xs' :
                            idx === 2 ? 'bg-amber-700 text-white shadow-xs' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="size-11 rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                              <img 
                                src={product.cdn_icon_url || (product.image_path ? getR2CdnUrl(product.image_path, true) : generateInitialsAvatar(product.name))} 
                                alt={product.name} 
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = generateInitialsAvatar(product.name); }}
                              />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-sm">{product.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{product.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">{product.sku}</td>
                        <td className="py-3.5 px-3 font-semibold text-slate-600 dark:text-slate-400">{product.category}</td>
                        <td className="py-3.5 px-3 font-black text-blue-600 dark:text-blue-400 text-sm">
                          {product.sold || 0} unit
                        </td>
                        <td className="py-3.5 px-3 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          Rp{estRevenue.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            product.stock <= 10 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {product.stock} unit
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setSelectedProductForAnalysis(product); setIsAnalysisModalOpen(true); }}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                            >
                              <BarChart2 size={13} /> <span>{s.aiAnalysis || 'Analisis AI'}</span>
                            </button>
                            <button
                              onClick={() => { setSelectedProductForEdit(product); setIsEditModalOpen(true); }}
                              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1"
                            >
                              <Edit size={13} /> <span>{s.manage || 'Kelola'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- FULL DEDICATED PAGE 2: STOK ALERT & AUTOMATED REPLENISHMENT ---
  if (subView === 'stock_alert') {
    const lowStockItems = storeData.products.filter((p: any) => p.stock <= 10);
    const outOfStockItems = storeData.products.filter((p: any) => p.stock === 0);

    return (
      <div className="space-y-6 animate-in fade-in pb-28 sm:pb-8">
        {/* Full Page Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <button onClick={() => setSubView('catalog')} className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 cursor-pointer">
                <Store size={14} className="text-orange-500" />
                <span>{s.title || 'Store Management'}</span>
              </button>
              <ChevronRight size={13} />
              <span className="text-amber-600 dark:text-amber-400 font-black">{s.stockAlert || 'Stok Alert'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>⚠️ {s.criticalStockAlert || 'Peringatan Stok & Restok Otomatis (Stok Alert)'}</span>
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">ZEROCLAW EDGE</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
              {s.subtitle || 'Manage product catalog, stock inventory, and multi-channel store sync.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSubView('catalog')}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-extrabold text-xs hover:bg-slate-800 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
            >
              ← {s.mainCatalog || 'Overview Store'}
            </button>
          </div>
        </div>

        {/* Dedicated Stok Alert Summary KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-1">
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>{s.criticalStockItems || 'Stok Kritis (≤ 10 Unit)'}</span>
              <AlertTriangle size={16} />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {lowStockItems.length} {s.activeCatalog || 'Produk'}
            </div>
            <div className="text-[10px] text-amber-600 font-bold">{s.lowStockAlerts || 'Membutuhkan restok segera'}</div>
          </div>

          <div className="p-4 rounded-3xl bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900 space-y-1">
            <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
              <span>{s.outOfStockRisk || 'Stok Kosong (Out of Stock)'}</span>
              <AlertCircle size={16} />
            </div>
            <div className="text-2xl font-black text-red-700 dark:text-red-300">
              {outOfStockItems.length} {s.activeCatalog || 'Produk'}
            </div>
            <div className="text-[10px] text-red-600 font-bold">{s.outOfStock || 'Stok Kosong'}</div>
          </div>

          <div className="p-4 rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>{s.estimatedRestockUnits || 'Estimasi Unit Restok'}</span>
              <Layers size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {lowStockItems.length * 50} Unit
            </div>
            <div className="text-[10px] text-blue-600 font-bold">50 unit / {s.colProduct || 'produk'}</div>
          </div>

          <div className="p-4 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{s.telemetryAutoRestock || 'Telemetry Auto-Restok'}</span>
              <RefreshCw size={16} />
            </div>
            <div className="text-base font-black text-emerald-700 dark:text-emerald-300">
              ⚡ Supabase RPC
            </div>
            <div className="text-[10px] text-emerald-600 font-bold">fn_quick_restok</div>
          </div>
        </div>

        {/* Full Page Low Stock Inventory Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{s.inventoryListAndQuickRestock || 'Daftar Inventaris Stok Kritis & Aksi Restok Cepat'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                {lowStockItems.length} {s.critical || 'Kritis'}
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">{s.colProduct || 'PRODUK KRITIS'}</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">{s.colCategory || 'KATEGORI'}</th>
                  <th className="py-3 px-3">{s.colStock || 'STOK SAAT INI'}</th>
                  <th className="py-3 px-3">TERJUAL</th>
                  <th className="py-3 px-3">STATUS AI</th>
                  <th className="py-3 px-3 text-right">{s.quickRestock || 'AKSI RESTOK INSTAN (SUPABASE RPC)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 font-semibold">
                      🎉 {s.noProductsFound || 'Semua produk stoknya aman!'}
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((product: any) => (
                    <tr key={product.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                            <img 
                              src={product.cdn_icon_url || (product.image_path ? getR2CdnUrl(product.image_path, true) : generateInitialsAvatar(product.name))} 
                              alt={product.name} 
                              className="w-full h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = generateInitialsAvatar(product.name); }}
                            />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-sm">{product.name}</span>
                            <span className="text-[10px] text-amber-600 font-bold">Terjual: {product.sold || 0} unit</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">{product.sku}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-600 dark:text-slate-400">{product.category}</td>
                      <td className="py-3.5 px-3 font-black text-amber-600 dark:text-amber-400">
                        <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-xs">
                          {product.stock} unit
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">{product.sold || 0} unit</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1 w-fit">
                          <span>⚡ {s.critical || 'Restok Kritis'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickRestock(product.id, 10, product.name)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-all"
                          >
                            +10 Unit
                          </button>
                          <button
                            onClick={() => handleQuickRestock(product.id, 50, product.name)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs cursor-pointer transition-all"
                          >
                            +50 Unit
                          </button>
                          <button
                            onClick={() => handleQuickRestock(product.id, 100, product.name)}
                            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all"
                          >
                            +100 Unit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- DEFAULT PAGE: KATALOG PRODUK UTAMA & DASHBOARD OVERVIEW ---
  return (
    <div className="space-y-6 pb-28 sm:pb-8">
      {/* Unified Enterprise Header Shell */}
      <StoreHeaderShell 
        activeTab="store"
        onNavigateTab={onNavigateTab}
        metrics={storeData.metrics}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
      />

      {/* 2. Top 5 Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Card 1: Total Produk */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{s.totalProducts || 'Total Produk'}</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{storeData.metrics.total_products}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 8</div>
          </div>
        </div>

        {/* Card 2: Total Stok */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{s.totalStock || 'Total Stok'}</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{storeData.metrics.total_stock.toLocaleString('id-ID')}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">↑ 120</div>
          </div>
        </div>

        {/* Card 3: Stok Rendah */}
        <div 
          onClick={() => {
            if (onNavigateTab) onNavigateTab('manage_stock_limit');
            else { setSubView('stock_alert'); setLowStockFilter(true); }
          }}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{s.lowStockTitle || 'Stok Rendah'}</span>
            <div className="size-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{storeData.metrics.low_stock_count}</div>
            <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
              <span>{s.stockAlert || 'Buka Stok Alert'}</span>
              <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 4: Orders Hari Ini / Top Selling */}
        <div 
          onClick={() => {
            if (onNavigateTab) onNavigateTab('top_selling');
            else { setSubView('top_selling'); setLowStockFilter(false); }
          }}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs cursor-pointer hover:border-blue-400 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{s.topSellingAndOrders || 'Top Selling & Orders'}</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{storeData.metrics.today_orders}</div>
            <div className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
              <span>{s.topSelling || 'Lihat Leaderboard'}</span>
              <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 5: Nilai Stok */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{s.stockValue || 'Nilai Stok'}</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(storeData.metrics.stock_value_idr).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">Total Value</div>
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
                <span>{s.storePerformance || 'Performa Store'}</span>
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
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{s.topSelling || 'Top Selling Products'}</h3>
            <button 
              onClick={() => onNavigateTab ? onNavigateTab('top_selling') : handleShowTopSelling()} 
              className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all"
            >
              <span>{s.seeAll || (language === 'en' ? 'See All' : language === 'zh' ? '查看全部' : 'Lihat Semua')}</span>
              <ChevronRight size={11} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>{s.colProduct || 'Produk'}</span>
              <span>{s.colSold || 'TERJUAL'}</span>
            </div>

            {(() => {
              const topList = (storeData.topSelling && storeData.topSelling.length > 0)
                ? storeData.topSelling
                : (storeData.products || []).slice(0, 5);

              if (!topList || topList.length === 0) {
                return (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium">
                    Belum ada data produk
                  </div>
                );
              }

              return topList.slice(0, 5).map((p: any, idx: number) => {
                const rawImg = p.image_path || p.image || p.rawPath || '';
                const cdnImg = rawImg ? getR2CdnUrl(rawImg, true) : generateInitialsAvatar(p.name || 'Produk');

                return (
                  <div key={p.id || idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                        <img 
                          src={cdnImg} 
                          alt={p.name} 
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = generateInitialsAvatar(p.name || 'Produk');
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 truncate max-w-[95px]">{p.name}</h4>
                        <span className="text-[9px] text-slate-400 font-medium block">{p.category || p.cat || 'General'}</span>
                      </div>
                    </div>
                    <span className="text-slate-500 font-bold text-[11px]">{p.sold || 0}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Col 3: Stok Alert (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{s.stockAlert || 'Stok Alert'}</span>
              </h3>
              <button 
                onClick={() => onNavigateTab ? onNavigateTab('manage_stock_limit') : handleShowLowStock()} 
                className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all"
              >
                <span>{s.seeAll || (language === 'en' ? 'See All' : language === 'zh' ? '查看全部' : 'Lihat Semua')}</span>
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {(() => {
                const alertList = (storeData.stockAlerts && storeData.stockAlerts.length > 0)
                  ? storeData.stockAlerts
                  : (storeData.products || []).filter((p: any) => (p.stock || 0) <= 10).slice(0, 5);

                if (!alertList || alertList.length === 0) {
                  return (
                    <div className="py-6 text-center text-slate-400 text-xs font-medium">
                      Semua stok produk aman
                    </div>
                  );
                }

                return alertList.slice(0, 5).map((item: any, i: number) => {
                  const rawImg = item.image_path || item.image || item.rawPath || '';
                  const cdnImg = rawImg ? getR2CdnUrl(rawImg, true) : generateInitialsAvatar(item.name || 'Produk');

                  return (
                    <div key={item.id || i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                          <img 
                            src={cdnImg} 
                            alt={item.name} 
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = generateInitialsAvatar(item.name || 'Produk');
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 truncate max-w-[90px]">{item.name}</h4>
                          <span className="text-[9px] text-slate-400 font-medium block">{item.category || item.cat || 'General'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                        {s.colStock || 'Stok'}: {item.stock}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <button 
            onClick={() => onNavigateTab ? onNavigateTab('manage_stock_limit') : handleShowLowStock()}
            className="w-full py-2.5 rounded-2xl border border-orange-200 dark:border-orange-900/80 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>{s.manage || 'Kelola'} {s.lowStockTitle || 'Stok Rendah'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Bottom Section: Main Product Table & Side Panel */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Main Product Table (lg:col-span-9) */}
        <div id="product-table-section" className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          {/* Table Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center justify-between md:justify-start gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{s.manageProducts || 'Daftar Produk'}</h3>
              {lowStockFilter && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 text-[10px] font-black animate-in fade-in">
                  <span>⚠️ {s.lowStockTitle || 'Stok Rendah'} (≤ 10)</span>
                  <button 
                    onClick={() => { setLowStockFilter(false); triggerToast('Filter stok rendah di-reset'); }}
                    className="hover:underline text-[9px] cursor-pointer ml-1 text-orange-800 dark:text-orange-200 font-extrabold"
                  >
                    [Reset]
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={s.searchProductPlaceholder || 'Cari produk...'}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setLowStockFilter(false); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none truncate"
                >
                  <option value="Semua Kategori">{s.allCategories || 'Semua Kategori'}</option>
                  <option value="Fashion & Pakaian">{s.fashionPakaian || 'Fashion & Pakaian'}</option>
                  <option value="Makanan & Minuman">{s.fnb || 'Makanan & Minuman (F&B)'}</option>
                  <option value="Kecantikan & Skincare">{s.beautySkincare || 'Kecantikan & Skincare'}</option>
                  <option value="Elektronik & Gadget">{s.electronicsGadgets || 'Elektronik & Gadget'}</option>
                  <option value="Perlengkapan Rumah">{s.homeLifestyle || 'Perlengkapan Rumah & Lifestyle'}</option>
                  <option value="Kerajinan & Souvenir">{s.handicrafts || 'Kerajinan & Souvenir'}</option>
                  <option value="Kesehatan & Herbal">{s.healthHerbal || 'Kesehatan & Herbal'}</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Drinkware">Drinkware</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Lainnya">{s.other || 'Lainnya'}</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setLowStockFilter(false); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none"
                >
                  <option value="Semua Status">{s.allStatus || 'Semua Status'}</option>
                  <option value="Aktif">{s.statusActive || 'Aktif'}</option>
                  <option value="Nonaktif">{s.statusInactive || 'Nonaktif'}</option>
                  <option value="Draft">{s.statusDraft || 'Draft'}</option>
                </select>
              </div>

              {/* Filter Button */}
              <button 
                onClick={() => triggerToast('Filter katalog berhasil diterapkan')}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 flex items-center justify-center gap-1 cursor-pointer shrink-0"
              >
                <Filter size={12} /> <span>Filter</span>
              </button>
            </div>
          </div>

          {/* DUAL-VIEW RENDERING: Desktop Table vs Mobile Product Cards */}
          {(() => {
            const itemsPerPage = 5;
            const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
            const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
            const paginatedProducts = filteredProducts.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

            if (paginatedProducts.length === 0) {
              return (
                <div className="py-12 text-center text-slate-400 font-semibold border-y border-slate-100 dark:border-slate-800">
                  {s.noProductsDB || 'Belum ada produk yang ditemukan di database. Klik'} <span className="font-bold text-orange-500">{s.addProduct || '+ Tambah Produk'}</span> {s.toAddFirstProduct || 'untuk menambahkan produk pertama Anda.'}
                </div>
              );
            }

            return (
              <>
                {/* 1. DESKTOP VIEW: High-Density HTML Table (hidden on mobile, visible md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">{s.colProduct || 'PRODUK'}</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">{s.colCategory || 'KATEGORI'}</th>
                        <th className="py-2.5 px-3">{s.colStock || 'STOK'}</th>
                        <th className="py-2.5 px-3">{s.colSold || 'TERJUAL'}</th>
                        <th className="py-2.5 px-3">{s.colPrice || 'HARGA'}</th>
                        <th className="py-2.5 px-3">STATUS</th>
                        <th className="py-2.5 px-3 text-right">{s.colAction || 'AKSI'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedProducts.map((product: any, idx: number) => {
                        const cdnImg = product.cdn_icon_url || (product.image_path ? getR2CdnUrl(product.image_path, true) : generateInitialsAvatar(product.name));

                        return (
                          <tr key={product.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                                  <img 
                                    src={cdnImg} 
                                    alt={product.name} 
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = generateInitialsAvatar(product.name);
                                    }}
                                  />
                                </div>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100">{product.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{product.sku}</td>
                            <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">{product.category}</td>
                            <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-slate-100">{product.stock}</td>
                            <td className="py-3 px-3 font-bold text-slate-500">{product.sold || 0}</td>
                            <td className="py-3 px-3 font-black text-slate-900 dark:text-slate-100">
                              Rp{(Number(product.price_idr) || 0).toLocaleString('id-ID')}
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
                                <button 
                                  onClick={() => { setSelectedProductForEdit(product); setIsEditModalOpen(true); }} 
                                  title="Edit Produk"
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-orange-500 cursor-pointer transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedProductForAnalysis(product); setIsAnalysisModalOpen(true); }} 
                                  title="Analisis Performa AI"
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 cursor-pointer transition-colors"
                                >
                                  <BarChart2 size={14} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedProductForBarcode(product); setIsBarcodeModalOpen(true); }} 
                                  title="Cetak Barcode SKU"
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 cursor-pointer transition-colors"
                                >
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

                {/* 2. MOBILE VIEW: Touch-Friendly Responsive Product Cards (visible on mobile, hidden md+) */}
                <div className="block md:hidden space-y-3 pt-1">
                  {paginatedProducts.map((product: any, idx: number) => {
                    const cdnImg = product.cdn_icon_url || (product.image_path ? getR2CdnUrl(product.image_path, true) : generateInitialsAvatar(product.name));

                    return (
                      <div 
                        key={product.id || idx}
                        className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3 shadow-2xs"
                      >
                        {/* Header Row: Thumbnail + Product Name & SKU */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 p-1 flex items-center justify-center">
                              <img 
                                src={cdnImg} 
                                alt={product.name} 
                                className="w-full h-full object-contain"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = generateInitialsAvatar(product.name);
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{product.name}</h4>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.2 rounded">{product.sku}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{product.category}</span>
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                            product.status === 'Aktif' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {product.status}
                          </span>
                        </div>

                        {/* Middle Info Grid: Stock, Sold, Price */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px]">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">{s.colStock || 'STOK'}</span>
                            <span className={`font-black ${product.stock <= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                              {product.stock} unit
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">{s.colSold || 'TERJUAL'}</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">{product.sold || 0} unit</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">{s.colPrice || 'HARGA'}</span>
                            <span className="font-black text-orange-600 dark:text-orange-400">
                              Rp{(Number(product.price_idr) || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Action Buttons Bar */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            onClick={() => { setSelectedProductForEdit(product); setIsEditModalOpen(true); }}
                            className="py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit size={13} />
                            <span>{s.manage || 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => { setSelectedProductForAnalysis(product); setIsAnalysisModalOpen(true); }}
                            className="py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <BarChart2 size={13} />
                            <span>AI Analisis</span>
                          </button>
                          <button
                            onClick={() => { setSelectedProductForBarcode(product); setIsBarcodeModalOpen(true); }}
                            className="py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Barcode size={13} />
                            <span>Barcode</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {/* Table Footer & Pagination */}
          {(() => {
            const itemsPerPage = 5;
            const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
            const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
            const startIdx = filteredProducts.length > 0 ? (validCurrentPage - 1) * itemsPerPage + 1 : 0;
            const endIdx = Math.min(validCurrentPage * itemsPerPage, filteredProducts.length);

            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs font-semibold text-slate-500 border-t border-slate-100 dark:border-slate-800">
                <span className="text-center sm:text-left text-[11px]">
                  {s.showingRangeOfTotal
                    ? s.showingRangeOfTotal.replace('{start}', String(startIdx)).replace('{end}', String(endIdx)).replace('{total}', String(filteredProducts.length))
                    : `Menampilkan ${startIdx} - ${endIdx} dari ${filteredProducts.length} produk`}
                </span>
                <div className="flex items-center justify-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={validCurrentPage === 1}
                    className="size-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button 
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs cursor-pointer transition-colors ${
                        validCurrentPage === pg
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="size-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

      {/* Side Panel Column (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Kategori Produk Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{s.productCategories || 'Kategori Produk'}</h3>
              <button 
                onClick={() => { setCategoryFilter('Semua Kategori'); setLowStockFilter(false); triggerToast('Semua kategori ditampilkan'); }} 
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {s.seeAll || (language === 'en' ? 'See All' : language === 'zh' ? '查看全部' : 'Lihat Semua')}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {storeData.categories.map((cat: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat.name);
                    setLowStockFilter(false);
                    triggerToast(`✓ Filter: ${cat.name}`);
                    const tableEl = document.getElementById('product-table-section');
                    if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    categoryFilter === cat.name 
                      ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500/80 shadow-xs' 
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">{cat.count || cat.product_count} {s.activeCatalog || 'Produk'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aksi Cepat Grid Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{s.quickActions || 'Aksi Cepat'}</h3>

            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-extrabold">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-orange-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 mx-auto grid place-items-center">
                  <Package size={14} />
                </div>
                <span>{s.addProduct || 'Tambah Produk'}</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 mx-auto grid place-items-center">
                  <Upload size={14} />
                </div>
                <span>{s.bulkUpload || 'Bulk Upload'}</span>
              </button>

              <button
                onClick={() => setIsDiscountModalOpen(true)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 mx-auto grid place-items-center">
                  <Percent size={14} />
                </div>
                <span>{s.setDiscount || 'Atur Diskon'}</span>
              </button>

              <button
                onClick={() => setIsCategoriesModalOpen(true)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 mx-auto grid place-items-center">
                  <Tag size={14} />
                </div>
                <span>{s.manageCategories || 'Kelola Kategori'}</span>
              </button>

              <button
                onClick={() => { setSelectedProductForBarcode(null); setIsBarcodeModalOpen(true); }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 mx-auto grid place-items-center">
                  <Barcode size={14} />
                </div>
                <span>{s.printBarcode || 'Cetak Barcode'}</span>
              </button>

              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer space-y-1.5"
              >
                <div className="size-7 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 mx-auto grid place-items-center">
                  <RefreshCw size={14} />
                </div>
                <span>{s.syncStock || 'Sinkron Stok'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Core Action Modals */}
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
        onRefresh={loadStoreData}
      />
      <ExportDataModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        triggerToast={triggerToast} 
      />
      <DeployStoreSwarmModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadStoreData}
      />

      {/* New Interactive E-Commerce Action Modals */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadStoreData}
        product={selectedProductForEdit}
      />
      <ProductAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        triggerToast={triggerToast}
        product={selectedProductForAnalysis}
      />
      <BulkDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadStoreData}
      />
      <ManageCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadStoreData}
      />
      <BarcodePrintModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        triggerToast={triggerToast}
        product={selectedProductForBarcode}
      />
      <StockSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadStoreData}
      />
    </div>
  );
}
