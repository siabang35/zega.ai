import React, { useState, useEffect } from 'react';
import { 
  Store, AlertTriangle, Package, RefreshCw, ChevronRight, ChevronLeft,
  Plus, Edit, BarChart2, ShieldAlert, CheckCircle2, TrendingUp, Barcode, MoreVertical, Layers
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';
import { EditProductModal, StockSyncModal, ProductAnalysisModal, BarcodePrintModal } from './StoreModals';
import { StoreHeaderShell } from './StoreHeaderShell';

interface ManageStockLimitViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function ManageStockLimitView({ triggerToast, onNavigateTab }: ManageStockLimitViewProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any>({
    store: null,
    metrics: { total_products: 0, total_stock: 0, low_stock_count: 0, today_orders: 0, stock_value_idr: 0 },
    products: [],
    categories: [],
    stockAlerts: [],
    topSelling: []
  });

  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any>(null);
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockSyncModalOpen, setIsStockSyncModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
      console.error('Failed to load stock alert data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickRestock = async (productId: string, addQty: number, productName: string) => {
    setRestockingId(productId);
    try {
      const res = await SupabaseDashboardService.quickRestockProduct(productId, addQty);
      if (res.success) {
        triggerToast(
          t.storeView.quickRestockSuccessToast
            .replace('{productName}', productName)
            .replace('{addQty}', String(addQty))
        );
        await loadData();
      } else {
        triggerToast(t.storeView.quickRestockFailedToast.replace('{err}', res.error || 'Error'));
      }
    } catch (err: any) {
      triggerToast(t.storeView.quickRestockFailedToast.replace('{err}', err.message || 'Error'));
    } finally {
      setRestockingId(null);
    }
  };

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

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'out' | 'critical'>('all');

  const lowStockProducts = storeData.products.filter((p: any) => p.stock <= 10);
  const outOfStockProducts = storeData.products.filter((p: any) => p.stock === 0);

  // Filtered products list
  const filteredStockAlerts = lowStockProducts.filter((p: any) => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || p.category === categoryFilter;
    let matchesStockLevel = true;
    if (stockLevelFilter === 'out') matchesStockLevel = p.stock === 0;
    if (stockLevelFilter === 'critical') matchesStockLevel = p.stock > 0 && p.stock <= 10;
    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  const categoriesList = ['Semua', ...Array.from(new Set(lowStockProducts.map((p: any) => p.category || 'Apparel')))];

  const categoryDisplayName = (cat: string) => (cat === 'Semua' ? t.storeView.allCategories : cat);

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 pb-28 sm:pb-8">
      {/* Unified Enterprise Header Shell */}
      <StoreHeaderShell 
        activeTab="manage_stock_limit"
        onNavigateTab={onNavigateTab}
        metrics={storeData.metrics}
      />

      {/* Alert KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.storeView.criticalStockKpiTitle}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-orange-600">{lowStockProducts.length}</span>
            <span className="text-xs font-extrabold text-slate-500">{t.storeView.needRestock}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.storeView.outOfStockKpiTitle}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">{outOfStockProducts.length}</span>
            <span className="text-xs font-bold text-slate-400">{t.storeView.emptyStock}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.storeView.totalStockValueKpiTitle}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Rp{(storeData.metrics.stock_value_idr || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Stock Table with Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t.storeView.lowStockMonitoringTitle}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-black">
              {t.storeView.actionRequiredBadge.replace('{count}', String(filteredStockAlerts.length))}
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
              value={stockLevelFilter}
              onChange={e => setStockLevelFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500"
            >
              <option value="all">{t.storeView.filterAllLowStock}</option>
              <option value="out">{t.storeView.filterTotalOut}</option>
              <option value="critical">{t.storeView.filterCriticalStock}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">{t.storeView.colProduct}</th>
                <th className="py-3 px-3">{t.storeView.colSku}</th>
                <th className="py-3 px-3">{t.storeView.colCategory}</th>
                <th className="py-3 px-3">{t.storeView.colRemainingStock}</th>
                <th className="py-3 px-3">{t.storeView.colStockStatus}</th>
                <th className="py-3 px-3 text-right">{t.storeView.colQuickRestockAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStockAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                    {t.storeView.noProductsStockFilter}
                  </td>
                </tr>
              ) : (
                filteredStockAlerts.map((product: any) => {
                  const isRestocking = restockingId === product.id;
                  const isOutOfStock = product.stock === 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
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
                            <span className="text-[10px] text-slate-400 font-medium">Rp{(Number(product.price_idr) || 0).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">{product.sku}</td>
                      <td className="py-3.5 px-3 font-semibold text-slate-600 dark:text-slate-400">{categoryDisplayName(product.category)}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                          isOutOfStock ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                        }`}>
                          {product.stock} {t.storeView.units}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-black flex items-center gap-1 w-fit">
                            <ShieldAlert size={12} /> {t.storeView.outOfStockTotalBadge}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 font-black flex items-center gap-1 w-fit">
                            <AlertTriangle size={12} /> {t.storeView.criticalStockBadge}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickRestock(product.id, 10, product.name)}
                            disabled={isRestocking}
                            className="px-2.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all"
                          >
                            {t.storeView.add10Units}
                          </button>
                          <button
                            onClick={() => handleQuickRestock(product.id, 50, product.name)}
                            disabled={isRestocking}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all"
                          >
                            {t.storeView.add50Units}
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
                                className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95"
                                onMouseLeave={() => setActiveMenuId(null)}
                              >
                                <button
                                  onClick={() => { setSelectedProductForEdit(product); setIsEditModalOpen(true); setActiveMenuId(null); }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit size={13} className="text-orange-500" />
                                  <span>{t.storeView.menuEditProductPromo}</span>
                                </button>

                                <button
                                  onClick={() => { setSelectedProductForAnalysis(product); setIsAnalysisModalOpen(true); setActiveMenuId(null); }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <BarChart2 size={13} className="text-blue-500" />
                                  <span>{t.storeView.menuAiSwarmAnalysis}</span>
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
                                  <Layers size={13} className="text-cyan-500" />
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} product={selectedProductForEdit} triggerToast={triggerToast} onRefresh={loadData} />
      <StockSyncModal isOpen={isStockSyncModalOpen} onClose={() => setIsStockSyncModalOpen(false)} triggerToast={triggerToast} onRefresh={loadData} />
      <ProductAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} product={selectedProductForAnalysis} triggerToast={triggerToast} />
      <BarcodePrintModal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)} triggerToast={triggerToast} product={selectedProductForEdit || lowStockProducts[0]} />
    </div>
  );
}
