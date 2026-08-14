import React, { useState, useEffect } from 'react';
import { 
  Store, TrendingUp, DollarSign, Package, Sparkles, ChevronRight, ChevronLeft,
  BarChart2, Megaphone, Edit, Barcode, RefreshCw, AlertTriangle, MoreVertical, Layers
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';
import { ProductAnalysisModal, EditProductModal, BarcodePrintModal } from './StoreModals';
import { StoreHeaderShell } from './StoreHeaderShell';

interface TopSellingViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function TopSellingView({ triggerToast, onNavigateTab }: TopSellingViewProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [storeData, setStoreData] = useState<any>({
    store: null,
    metrics: { total_products: 0, total_stock: 0, low_stock_count: 0, today_orders: 0, stock_value_idr: 0 },
    products: [],
    categories: [],
    stockAlerts: [],
    topSelling: []
  });

  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<any>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState<'sold' | 'revenue' | 'stock'>('sold');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmStoreOverview();
      if (data) {
        setStoreData((prev: any) => ({
          ...prev,
          metrics: data.metrics || prev.metrics,
          products: Array.isArray(data.products) ? data.products : [],
          categories: Array.isArray(data.categories) ? data.categories : prev.categories,
        }));
      }
    } catch (err) {
      console.error('Failed to load top selling data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDuplicate = async (productId: string) => {
    try {
      await SupabaseDashboardService.duplicateStoreProduct(productId);
      triggerToast(t.storeView.productDuplicatedToast);
      loadData();
    } catch (err: any) {
      triggerToast(t.storeView.productDuplicateFailedToast);
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleToggleStatus = async (productId: string) => {
    try {
      await SupabaseDashboardService.toggleStoreProductStatus(productId);
      triggerToast(t.storeView.productStatusUpdatedToast);
      loadData();
    } catch (err: any) {
      triggerToast(t.storeView.productStatusUpdateFailedToast);
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t.storeView.confirmDeleteProductCatalog)) return;
    try {
      await SupabaseDashboardService.deleteStoreProduct(productId);
      triggerToast(t.storeView.productDeletedToast);
      loadData();
    } catch (err: any) {
      triggerToast(t.storeView.productDeleteFailedToast);
    } finally {
      setActiveMenuId(null);
    }
  };

  // Compute filtered & sorted top selling products
  const filteredProducts = storeData.products.filter((p: any) => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedTopProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'sold') {
      return (b.sold || 0) - (a.sold || 0);
    } else if (sortBy === 'revenue') {
      return ((b.sold || 0) * (b.price_idr || 0)) - ((a.sold || 0) * (a.price_idr || 0));
    } else {
      return (b.stock || 0) - (a.stock || 0);
    }
  });

  const totalRevenue = sortedTopProducts.reduce((acc, p) => acc + ((p.sold || 0) * (p.price_idr || 0)), 0);
  const totalSoldUnits = sortedTopProducts.reduce((acc, p) => acc + (p.sold || 0), 0);

  // Extract unique categories
  const categoriesList = ['Semua', ...Array.from(new Set(storeData.products.map((p: any) => p.category || 'Apparel')))];

  const categoryDisplayName = (cat: string) => (cat === 'Semua' ? t.storeView.allCategories : cat);

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Unified Enterprise Header Shell */}
      <StoreHeaderShell 
        activeTab="top_selling"
        onNavigateTab={onNavigateTab}
        metrics={storeData.metrics}
      />

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t.storeView.totalVolumeSold}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalSoldUnits.toLocaleString('id-ID')}</span>
            <span className="text-xs font-extrabold text-blue-600">{t.storeView.productUnits}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t.storeView.estimatedTopSellingRevenue}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">Rp{totalRevenue.toLocaleString('id-ID')}</span>
            <span className="text-xs font-bold text-slate-400">IDR</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t.storeView.topSellingProductNum1}</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {sortedTopProducts[0]?.name || 'N/A'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black shrink-0">
              {t.storeView.championBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table with Integrated Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t.storeView.leaderboardTitle}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-bold">
              {t.storeView.productsCountDisplayed.replace('{count}', String(sortedTopProducts.length))}
            </span>
          </h3>

          {/* Interactive Filters Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <input 
              type="text" 
              placeholder={t.storeView.searchNameSkuPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-orange-500 w-44"
            />

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:outline-none focus:border-orange-500"
            >
              {categoriesList.map((cat: any) => (
                <option key={cat} value={cat}>{categoryDisplayName(cat)}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500"
            >
              <option value="sold">{t.storeView.sortTopSoldUnits}</option>
              <option value="revenue">{t.storeView.sortTopRevenue}</option>
              <option value="stock">{t.storeView.sortMostStock}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">{t.storeView.colRank}</th>
                <th className="py-3 px-3">{t.storeView.colProduct}</th>
                <th className="py-3 px-3">{t.storeView.colCategory}</th>
                <th className="py-3 px-3">{t.storeView.colUnitPrice}</th>
                <th className="py-3 px-3">{t.storeView.colUnitsSold}</th>
                <th className="py-3 px-3">{t.storeView.colEstimatedRevenue}</th>
                <th className="py-3 px-3 text-right">{t.storeView.colActionRecommendation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedTopProducts.map((product: any, idx: number) => {
                const revenue = (product.sold || 0) * (product.price_idr || 0);
                const isChampion = idx === 0;
                const isTopThree = idx < 3;

                return (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`size-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          isChampion 
                            ? 'bg-amber-400 text-slate-950 shadow-xs' 
                            : isTopThree 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 p-0.5 flex items-center justify-center">
                          <img 
                            src={getR2CdnUrl(product.image_path || '/assets/products/kaoshitam.png', true)} 
                            alt={product.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = generateInitialsAvatar(product.name); }}
                          />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{product.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">SKU: {product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-600 dark:text-slate-400">{categoryDisplayName(product.category)}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                      Rp{(Number(product.price_idr) || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-black text-xs">
                        🔥 {product.sold || 0} {t.storeView.units}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-black text-emerald-600">
                      Rp{revenue.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-3 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedProductForAnalysis(product); setIsAnalysisModalOpen(true); }}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                        >
                          <BarChart2 size={13} /> <span>{t.storeView.aiAnalysisBtn}</span>
                        </button>
                        <button
                          onClick={() => { setSelectedProductForEdit(product); setIsEditModalOpen(true); }}
                          className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1"
                        >
                          <Edit size={13} /> <span>{t.storeView.editBtn}</span>
                        </button>

                        {/* 3-Dots Action Menu */}
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === product.id ? null : product.id)}
                            className="size-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-all"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeMenuId === product.id && (
                            <div 
                              className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95"
                              onMouseLeave={() => setActiveMenuId(null)}
                            >
                              <button
                                onClick={() => { setSelectedProductForEdit(product); setIsEditModalOpen(true); setActiveMenuId(null); }}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit size={13} className="text-orange-500" />
                                <span>{t.storeView.menuEditDetailDiscount}</span>
                              </button>

                              <button
                                onClick={() => { setSelectedProductForEdit(product); setIsBarcodeModalOpen(true); setActiveMenuId(null); }}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Barcode size={13} className="text-indigo-500" />
                                <span>{t.storeView.menuPrintSkuBarcode}</span>
                              </button>

                              <button
                                onClick={() => handleDuplicate(product.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Layers size={13} className="text-blue-500" />
                                <span>{t.storeView.menuDuplicateProduct}</span>
                              </button>

                              <button
                                onClick={() => handleToggleStatus(product.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <RefreshCw size={13} className="text-emerald-500" />
                                <span>{product.status === 'Aktif' ? t.storeView.menuDeactivateProduct : t.storeView.menuActivateProduct}</span>
                              </button>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <button
                                onClick={() => handleDelete(product.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                              >
                                <AlertTriangle size={13} />
                                <span>{t.storeView.menuDeleteProduct}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} product={selectedProductForAnalysis} triggerToast={triggerToast} />
      <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} product={selectedProductForEdit} triggerToast={triggerToast} onRefresh={loadData} />
      <BarcodePrintModal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)} triggerToast={triggerToast} product={selectedProductForEdit || sortedTopProducts[0]} />
    </div>
  );
}
