import React, { useState, useRef, useEffect } from 'react';
import { 
  Store, Plus, Upload, Download, Sparkles, ChevronRight, ChevronDown, Package, TrendingUp, AlertTriangle, FileSpreadsheet, Printer, Tag
} from 'lucide-react';
import { useLanguage } from '../../../../../i18n/translations';

export type StoreSubTab = 
  | 'store' 
  | 'manage_product' 
  | 'top_selling' 
  | 'manage_stock_limit' 
  | 'add_product' 
  | 'bulk_upload' 
  | 'manage_discount' 
  | 'manage_category' 
  | 'print_barcode' 
  | 'stock_sync';

interface StoreHeaderShellProps {
  activeTab: StoreSubTab;
  onNavigateTab?: (tab: string) => void;
  metrics?: {
    total_products?: number;
    low_stock_count?: number;
  };
  onOpenAddModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenExportModal?: () => void;
  onOpenDeployModal?: () => void;
}

export function StoreHeaderShell({
  activeTab,
  onNavigateTab,
  metrics = { total_products: 0, low_stock_count: 0 },
  onOpenAddModal,
  onOpenImportModal,
  onOpenExportModal,
  onOpenDeployModal
}: StoreHeaderShellProps) {
  const { t } = useLanguage();
  const s = (t.storeView || {}) as any;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSubViewLabel = () => {
    switch (activeTab) {
      case 'manage_product':
        return s.manageProducts || 'Kelola Produk';
      case 'top_selling':
        return s.topSelling || 'Top Selling';
      case 'manage_stock_limit':
        return s.stockAlert || 'Stok Alert';
      case 'add_product':
        return s.addProduct || 'Tambah Produk';
      case 'bulk_upload':
        return s.bulkUploadCsvJson || 'Bulk Upload';
      case 'manage_discount':
        return s.manageDiscountBulk || 'Atur Diskon';
      case 'manage_category':
        return s.manageCategory || 'Kelola Kategori';
      case 'print_barcode':
        return s.printBarcode || 'Cetak Barcode';
      case 'stock_sync':
        return s.stockSync || 'Sinkron Stok';
      case 'store':
      default:
        return s.mainCatalog || 'Katalog Utama';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-3.5 sm:space-y-5">
      {/* Top Row: Breadcrumbs, Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-400 mb-0.5">
            <button 
              onClick={() => onNavigateTab && onNavigateTab('store')} 
              className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Store size={13} className="text-orange-500" />
              <span>{s.title || 'Store Management'}</span>
            </button>
            <ChevronRight size={12} />
            <span className="text-slate-900 dark:text-slate-100 font-extrabold">{getSubViewLabel()}</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {s.title || 'Store & Inventory Management'}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            {s.subtitle || 'Manage product catalog, stock inventory, and multi-channel store sync.'}
          </p>
        </div>

        {/* Primary Header Action Buttons — only on Kelola Produk tab */}
        {activeTab === 'manage_product' && (
        <div className="flex flex-row items-center gap-2 w-full md:w-auto shrink-0">
          <button 
            onClick={onOpenDeployModal} 
            className="flex-1 sm:flex-initial px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] sm:text-xs font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <Sparkles size={13} /> <span className="whitespace-nowrap">{s.deployAiSwarm || 'Deploy AI'}</span>
          </button>

          {/* Clean Enterprise Dropdown Button */}
          <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full sm:w-auto px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-[11px] sm:text-xs flex items-center justify-between sm:justify-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98 border border-slate-800 dark:border-slate-200"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Plus size={14} /> 
                <span className="whitespace-nowrap truncate">{s.addProductsAndImport || 'Tambah Produk'}</span>
              </div>
              <ChevronDown size={13} className={`transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-1.5 space-y-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab('add_product');
                    else onOpenAddModal?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Plus size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{s.addSingleProduct || 'Tambah Produk Manual'}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{s.addSingleProductDesc || 'Formulir input single produk baru'}</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab('bulk_upload');
                    else onOpenImportModal?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{s.bulkUploadCsvJson || 'Bulk Upload CSV / JSON'}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{s.bulkUploadDesc || 'Impor katalog massal sekaligus'}</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab('print_barcode');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Printer size={14} className="text-slate-500 ml-1" />
                  <span className="text-xs font-semibold">{s.printBarcodeTag || 'Cetak Barcode Tag'}</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab('manage_discount');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Tag size={14} className="text-slate-500 ml-1" />
                  <span className="text-xs font-semibold">{s.manageDiscountBulk || 'Atur Diskon Massal'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Bottom Row: Unified Sub-Navigation Tab Bar */}
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 pt-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-auto border-t border-slate-100 dark:border-slate-800">
        {/* Core Views Group */}
        {[
          { id: 'store', label: s.mainCatalog || 'Katalog Utama', icon: Package },
          { id: 'manage_product', label: s.manageProducts || 'Kelola Produk', icon: Package, badge: metrics.total_products || 0 },
          { id: 'top_selling', label: s.topSelling || 'Top Selling', icon: TrendingUp, badge: '🏆' },
          { id: 'manage_stock_limit', label: s.stockAlert || 'Stok Alert', icon: AlertTriangle, badge: (metrics?.low_stock_count ?? 0) > 0 ? `${metrics.low_stock_count}` : '0' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigateTab && onNavigateTab(tab.id)}
              className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <IconComp size={12} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Vertical Divider */}
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

        {/* Tools Group */}
        {[
          { id: 'manage_discount', label: s.manageDiscountBulk || 'Atur Diskon', icon: Sparkles },
          { id: 'manage_category', label: s.manageCategory || 'Kelola Kategori', icon: Package },
          { id: 'print_barcode', label: s.printBarcode || 'Cetak Barcode', icon: Package },
          { id: 'stock_sync', label: s.stockSync || 'Sinkron Stok', icon: Sparkles }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigateTab && onNavigateTab(tab.id)}
              className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                isActive
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <IconComp size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
