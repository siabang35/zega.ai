import React, { useState, useRef, useEffect } from 'react';
import { 
  Store, Plus, Upload, Download, Sparkles, ChevronRight, ChevronDown, Package, TrendingUp, AlertTriangle, FileSpreadsheet, Printer, Tag
} from 'lucide-react';

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
        return 'Kelola Produk';
      case 'top_selling':
        return 'Top Selling';
      case 'manage_stock_limit':
        return 'Stok Alert';
      case 'add_product':
        return 'Tambah Produk';
      case 'bulk_upload':
        return 'Bulk Upload';
      case 'manage_discount':
        return 'Atur Diskon';
      case 'manage_category':
        return 'Kelola Kategori';
      case 'print_barcode':
        return 'Cetak Barcode';
      case 'stock_sync':
        return 'Sinkron Stok';
      case 'store':
      default:
        return 'Katalog Utama';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
      {/* Top Row: Breadcrumbs, Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <button 
              onClick={() => onNavigateTab && onNavigateTab('store')} 
              className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Store size={14} className="text-orange-500" />
              <span>Store Management</span>
            </button>
            <ChevronRight size={13} />
            <span className="text-slate-900 dark:text-slate-100 font-extrabold">{getSubViewLabel()}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">
            Store & Inventory Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Manage product catalog, stock inventory, and multi-channel store sync.
          </p>
        </div>

        {/* Primary Header Action Buttons — only on Katalog Utama & Kelola Produk */}
        {(activeTab === 'store' || activeTab === 'manage_product') && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={onOpenDeployModal} 
            className="px-3.5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-98"
          >
            <Sparkles size={14} /> <span>Deploy AI Swarm</span>
          </button>

          {/* Clean Enterprise Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
            >
              <Plus size={16} /> 
              <span>Tambah & Impor Produk</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-1.5 space-y-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab('add_product');
                    else onOpenAddModal?.();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-800 dark:text-slate-200 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 flex items-center gap-0 justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Plus size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Tambah Produk Manual</div>
                    <div className="text-[10px] text-slate-400 font-medium">Formulir input single produk baru</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab('bulk_upload');
                    else onOpenImportModal?.();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Bulk Upload CSV / JSON</div>
                    <div className="text-[10px] text-slate-400 font-medium">Impor katalog massal sekaligus</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab('print_barcode');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Printer size={15} className="text-slate-500 ml-1.5" />
                  <span className="text-xs font-semibold">Cetak Barcode Tag</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onNavigateTab) onNavigateTab('manage_discount');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Tag size={15} className="text-slate-500 ml-1.5" />
                  <span className="text-xs font-semibold">Atur Diskon Massal</span>
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Divider Line */}
      <div className="border-t border-slate-100 dark:border-slate-800" />

      {/* Bottom Row: Unified Sub-Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {/* Core Views Group */}
        {[
          { id: 'store', label: 'Katalog Utama', icon: Package },
          { id: 'manage_product', label: 'Kelola Produk', icon: Package, badge: metrics.total_products || 0 },
          { id: 'top_selling', label: 'Top Selling', icon: TrendingUp, badge: '🏆' },
          { id: 'manage_stock_limit', label: 'Stok Alert', icon: AlertTriangle, badge: `${metrics.low_stock_count || 0} Kritis` },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigateTab && onNavigateTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <IconComp size={13} />
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
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-1" />

        {/* Tools Group */}
        {[
          { id: 'manage_discount', label: 'Atur Diskon', icon: Sparkles },
          { id: 'manage_category', label: 'Kelola Kategori', icon: Package },
          { id: 'print_barcode', label: 'Cetak Barcode', icon: Package },
          { id: 'stock_sync', label: 'Sinkron Stok', icon: Sparkles }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigateTab && onNavigateTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <IconComp size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
