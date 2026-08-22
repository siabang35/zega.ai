import React, { useState, useRef, useEffect } from 'react';
import { 
  Store, Plus, Upload, Download, Sparkles, ChevronRight, ChevronDown, Package, TrendingUp, AlertTriangle, FileSpreadsheet, Printer, Tag, Bot, ShieldCheck, Activity, Zap, MessageSquare, X, Send, ArrowRight
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
  | 'stock_sync'
  | 'swarm_history'
  | 'swarm_chat';

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
  onOpenSwarmControl?: () => void;
}

export function StoreHeaderShell({
  activeTab,
  onNavigateTab,
  metrics = { total_products: 0, low_stock_count: 0 },
  onOpenAddModal,
  onOpenImportModal,
  onOpenExportModal,
  onOpenDeployModal,
  onOpenSwarmControl
}: StoreHeaderShellProps) {
  const { t } = useLanguage();
  const s = (t.storeView || {}) as any;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [swarmDropdownOpen, setSwarmDropdownOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const swarmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (swarmRef.current && !swarmRef.current.contains(e.target as Node)) {
        setSwarmDropdownOpen(false);
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
      case 'swarm_history':
        return 'AI Swarm History';
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

  const getSubViewTitle = () => {
    switch (activeTab) {
      case 'manage_product':
        return s.manageProductsTitle || s.manageProducts || 'Kelola Produk';
      case 'top_selling':
        return s.topSellingTitle || s.topSelling || 'Produk Terlaris';
      case 'manage_stock_limit':
        return s.stockAlertTitle || s.stockAlert || 'Batas Stok Kritis';
      case 'swarm_chat':
        return '🤖 Universal AI Swarm Chatbot Control Plane';
      case 'swarm_history':
        return 'Log Eksekusi AI Swarm';
      case 'add_product':
        return s.addProductTitle || s.addProduct || 'Tambah Produk Baru';
      case 'bulk_upload':
        return s.bulkUploadTitle || s.bulkUploadCsvJson || 'Impor Produk Massal';
      case 'manage_discount':
        return s.manageDiscountTitle || s.manageDiscountBulk || 'Kelola Diskon Massal';
      case 'manage_category':
        return s.manageCategoryTitle || s.manageCategory || 'Kelola Kategori';
      case 'print_barcode':
        return s.printBarcodeTitle || s.printBarcode || 'Cetak Barcode Tag';
      case 'stock_sync':
        return s.stockSyncTitle || s.stockSync || 'Sinkronisasi Stok';
      case 'store':
      default:
        return s.mainCatalogTitle || 'Store & Inventory Management';
    }
  };

  const getSubViewSubtitle = () => {
    switch (activeTab) {
      case 'manage_product':
        return s.manageProductsSub || 'Kelola daftar produk, inventaris stok, harga, varian, dan ketersediaan barang toko Anda.';
      case 'top_selling':
        return s.topSellingSub || 'Analisis produk dengan volume penjualan tertinggi dan tren permintaan pelanggan.';
      case 'manage_stock_limit':
        return s.stockAlertSub || 'Pantau dan atur ambang batas minimum persediaan produk untuk mencegah kehabisan stok.';
      case 'swarm_chat':
        return 'Orkestrasi interaktif 6 agen AI persediaan toko secara realtime dengan ZeroClaw Router.';
      case 'swarm_history':
        return 'Riwayat lengkap eksekusi dan telemetry agent AI Swarm secara real-time.';
      case 'add_product':
        return s.addProductSub || 'Tambah produk baru secara manual ke dalam katalog toko Anda.';
      case 'bulk_upload':
        return s.bulkUploadSub || 'Unggah data produk dalam jumlah besar secara efisien via file CSV atau JSON.';
      case 'manage_discount':
        return s.manageDiscountSub || 'Atur potongan harga, promosi, dan diskon massal untuk meningkatkan penjualan.';
      case 'manage_category':
        return s.manageCategorySub || 'Pengelompokan kategori produk untuk memudahkan pencarian oleh pembeli.';
      case 'print_barcode':
        return s.printBarcodeSub || 'Cetak label barcode dan tag harga produk untuk manajemen kasir toko fisik.';
      case 'stock_sync':
        return s.stockSyncSub || 'Sinkronkan stok barang secara otomatis antar marketplace dan channel penjualan.';
      case 'store':
      default:
        return s.mainCatalogSub || 'Pusat kendali utama katalog barang, performa toko, dan AI Swarm Stock Control.';
    }
  };

  const handleExecuteQuickPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSwarmDropdownOpen(false);
    if (onOpenSwarmControl) onOpenSwarmControl();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-3.5 sm:space-y-5">
      {/* Top Row: Clean Submenu Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Store size={22} className="text-orange-500 shrink-0" />
            <span>{getSubViewTitle()}</span>
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            {getSubViewSubtitle()}
          </p>
        </div>

        {/* Primary Header Action Buttons — Adapted specifically for Main Catalog vs Manage Products */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
          {activeTab === 'manage_product' ? (
            /* MANAGE PRODUCTS TAB: Show ONLY + Tambah Produk Button */
            <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-xs flex items-center justify-between sm:justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-98 border border-slate-800 dark:border-slate-200"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Plus size={15} /> 
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
          ) : (
            /* MAIN CATALOG & OTHER TABS: Show AI Swarm Control & Deploy AI Swarm Buttons Side-by-Side */
            <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full md:w-auto">
              {/* AI Swarm Control Interactive Dropdown Container */}
              <div className="relative w-full sm:w-auto" ref={swarmRef}>
                <button 
                  onClick={() => setSwarmDropdownOpen(!swarmDropdownOpen)} 
                  className="w-full px-2.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 text-white text-[11px] sm:text-xs font-black shadow-md hover:shadow-orange-500/25 cursor-pointer flex items-center justify-between gap-1.5 transition-all active:scale-98 border border-orange-400/30 group min-w-0"
                >
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <Bot size={14} className="animate-pulse text-white group-hover:rotate-12 transition-transform shrink-0" /> 
                    <span className="whitespace-nowrap font-black truncate">AI Swarm</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white/25 text-white flex items-center gap-1 shrink-0">
                      <span className="size-1.5 rounded-full bg-emerald-300 animate-ping inline-block shrink-0" />
                      <span>5</span>
                    </span>
                  </div>
                  <ChevronDown size={12} className={`transition-transform duration-200 shrink-0 ${swarmDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* HIGH-PERFORMANCE SWARM CONTROL DROPDOWN & MOBILE FLYOUT PANEL */}
                {swarmDropdownOpen && (
                  <div className="absolute left-0 sm:left-auto right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200 p-4 space-y-3 backdrop-blur-xl">
                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                          <Bot size={18} className="animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>AI Swarm Control Plane</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">Active</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Orkestrasi 5 Agen Persediaan Real-time</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSwarmDropdownOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* 5 Participating Agents Telemetry List */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">Agen Swarm Aktif</div>
                      
                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {[
                          { name: 'Stock Analyzer', desc: 'Scan SKU persediaan & turn-rate', icon: Activity, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50' },
                          { name: 'Demand Forecaster', desc: 'Prediksi proyeksi tren penjualan', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' },
                          { name: 'Reorder Trigger Agent', desc: 'Otomatisasi ambang batas reorder stok', icon: Zap, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50' },
                          { name: 'Price & Margin Guard', desc: 'Optimalisasi profit margin & promo', icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50' },
                          { name: 'Supplier Matcher', desc: 'Restock supplier multi-channel sync', icon: Package, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50' }
                        ].map((agent, i) => {
                          const IconComp = agent.icon;
                          return (
                            <div key={i} className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 hover:border-orange-500/40 transition-all text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`size-7 rounded-xl ${agent.color} flex items-center justify-center shrink-0`}>
                                  <IconComp size={14} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 truncate">{agent.name}</div>
                                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate">{agent.desc}</div>
                                </div>
                              </div>
                              <span className="size-2 rounded-full bg-emerald-500 shrink-0 ml-1" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Direct Action Buttons: Chatbot, Swarm History & Deploy */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setSwarmDropdownOpen(false);
                          if (onNavigateTab) onNavigateTab('swarm_chat');
                          else if (onOpenSwarmControl) onOpenSwarmControl();
                        }}
                        className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <MessageSquare size={13} />
                        <span>Chatbot</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSwarmDropdownOpen(false);
                          if (onNavigateTab) onNavigateTab('swarm_history');
                        }}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Activity size={13} />
                        <span>History</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSwarmDropdownOpen(false);
                          if (onOpenDeployModal) onOpenDeployModal();
                        }}
                        className="p-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <Sparkles size={13} />
                        <span>Deploy</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Deploy AI Swarm Button */}
              <button 
                onClick={onOpenDeployModal} 
                className="w-full sm:w-auto px-2.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] sm:text-xs font-bold shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-98 shrink-0"
              >
                <Sparkles size={14} /> <span className="whitespace-nowrap truncate">{s.deployAiSwarm || 'Deploy Swarm'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Unified Sub-Navigation Tab Bar (Clean, no redundant submenus) */}
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
