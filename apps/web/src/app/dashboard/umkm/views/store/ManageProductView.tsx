import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, Plus, Download, Upload, Filter, Search, 
  AlertTriangle, TrendingUp, ShoppingBag, DollarSign, Package, 
  AlertCircle, Edit, BarChart2, MoreVertical, ChevronLeft, ChevronRight,
  RefreshCw, Tag, Barcode, Layers, Percent, Check, Sparkles,
  X, ChevronUp, FileSpreadsheet, Image, Share2, UploadCloud, CheckCircle2
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';
import { 
  AddProductModal, ImportProductModal, ExportDataModal, DeployStoreSwarmModal,
  EditProductModal, ProductAnalysisModal, BulkDiscountModal, ManageCategoriesModal,
  BarcodePrintModal, StockSyncModal
} from './StoreModals';
import { StoreHeaderShell } from './StoreHeaderShell';

interface ManageProductViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function ManageProductView({ triggerToast, onNavigateTab }: ManageProductViewProps) {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua Kategori');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Inline Panel State (best practice: stay in context)
  const [activePanel, setActivePanel] = useState<'none' | 'add_product' | 'bulk_upload'>('none');
  const panelRef = useRef<HTMLDivElement>(null);

  // Inline Add Product form state
  const [addName, setAddName] = useState('');
  const [addSku, setAddSku] = useState(`SKU-${Date.now().toString().slice(-6)}`);
  const [addCategory, setAddCategory] = useState('Fashion & Pakaian');
  const [addPriceIdr, setAddPriceIdr] = useState('');
  const [addDiscountPriceIdr, setAddDiscountPriceIdr] = useState('');
  const [addStock, setAddStock] = useState('25');
  const [addStatus, setAddStatus] = useState('Aktif');
  const [addImagePath, setAddImagePath] = useState('/assets/products/kaoshitam.png');
  const [addSalesChannels, setAddSalesChannels] = useState<string[]>(['WhatsApp Toko', 'Shopee', 'Tokopedia']);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Inline Bulk Upload state
  const [bulkParsedData, setBulkParsedData] = useState<any[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isBulkDiscountModalOpen, setIsBulkDiscountModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isStockSyncModalOpen, setIsStockSyncModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any>(null);
  const [selectedProductForAnalysis, setSelectedProductForAnalysis] = useState<any>(null);

  // Scroll to panel when opened
  useEffect(() => {
    if (activePanel !== 'none' && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activePanel]);

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        if (dataUrl) { setAddImagePath(dataUrl); triggerToast(`✓ Foto "${file.name}" berhasil dimuat!`); }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleChannel = (ch: string) => {
    setAddSalesChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addPriceIdr) { triggerToast('Mohon isi nama produk dan harga jual IDR'); return; }
    setAddSubmitting(true);
    try {
      await SupabaseDashboardService.createStoreProduct({
        name: addName.trim(), sku: addSku.trim(), category: addCategory,
        price_idr: parseFloat(addPriceIdr) || 0,
        discount_price_idr: addDiscountPriceIdr ? parseFloat(addDiscountPriceIdr) : null,
        stock: parseInt(addStock, 10) || 0, status: addStatus,
        description: 'Produk unggulan katalog toko UMKM ZEGA AI.',
        sales_channels: addSalesChannels, image_path: addImagePath, cdn_icon_url: addImagePath
      });
      triggerToast(`✓ Produk "${addName}" berhasil ditambahkan!`);
      setActivePanel('none');
      setAddName(''); setAddPriceIdr(''); setAddSku(`SKU-${Date.now().toString().slice(-6)}`);
      loadData();
    } catch (err: any) {
      triggerToast(`⚠️ Gagal: ${err.message || 'Error Database'}`);
    } finally { setAddSubmitting(false); }
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) setBulkParsedData(json);
        } else {
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
            return {
              sku: obj.sku || obj.SKU || `SKU-BULK-${Math.floor(Math.random()*10000)}`,
              name: obj.name || obj.Nama || 'Produk Import',
              category: obj.category || obj.Kategori || 'Lainnya',
              price_idr: parseFloat(obj.price_idr || obj.price || '50000'),
              stock: parseInt(obj.stock || obj.Stok || '10', 10),
              image_path: obj.image_path || '/assets/products/kaoshitam.png'
            };
          });
          setBulkParsedData(rows);
        }
        triggerToast(`✓ File ${file.name} terbaca`);
      } catch { triggerToast('⚠️ Format file tidak valid.'); }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkUpload = async () => {
    if (bulkParsedData.length === 0) { triggerToast('Pilih file CSV/JSON terlebih dahulu'); return; }
    setBulkLoading(true);
    try {
      await SupabaseDashboardService.bulkImportStoreProducts(bulkParsedData);
      triggerToast(`🎉 ${bulkParsedData.length} produk berhasil diimpor!`);
      setActivePanel('none'); setBulkParsedData([]); setBulkFileName('');
      loadData();
    } catch (err: any) {
      triggerToast(`⚠️ Gagal impor: ${err.message || 'Error'}`);
    } finally { setBulkLoading(false); }
  };

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
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const navigateToRoute = (tabId: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabId);
    }
  };

  const filteredProducts = storeData.products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua Kategori' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleDuplicate = async (productId: string) => {
    try {
      await SupabaseDashboardService.duplicateStoreProduct(productId);
      triggerToast('Produk berhasil diduplikasi (Salinan dibuat)');
      loadData();
    } catch (err: any) {
      triggerToast('Gagal menduplikasi produk: ' + (err?.message || 'Error'));
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleToggleStatus = async (productId: string) => {
    try {
      await SupabaseDashboardService.toggleStoreProductStatus(productId);
      triggerToast('Status produk berhasil diperbarui');
      loadData();
    } catch (err: any) {
      triggerToast('Gagal mengubah status produk');
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini secara permanen dari Supabase?')) return;
    try {
      await SupabaseDashboardService.deleteStoreProduct(productId);
      triggerToast('Produk berhasil dihapus dari katalog');
      loadData();
    } catch (err: any) {
      triggerToast('Gagal menghapus produk');
    } finally {
      setActiveMenuId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Unified Enterprise Header Shell */}
      <StoreHeaderShell 
        activeTab="manage_product"
        onNavigateTab={(tab: string) => {
          // Intercept add_product/bulk_upload to open inline panels
          if (tab === 'add_product') { setActivePanel(activePanel === 'add_product' ? 'none' : 'add_product'); return; }
          if (tab === 'bulk_upload') { setActivePanel(activePanel === 'bulk_upload' ? 'none' : 'bulk_upload'); return; }
          setActivePanel('none');
          if (onNavigateTab) onNavigateTab(tab);
        }}
        metrics={storeData.metrics}
        onOpenAddModal={() => setActivePanel('add_product')}
        onOpenImportModal={() => setActivePanel('bulk_upload')}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
      />

      {/* ═══════ INLINE COLLAPSIBLE PANEL: Tambah Produk ═══════ */}
      {activePanel === 'add_product' && (
        <div ref={panelRef} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-500/30 dark:border-orange-500/20 shadow-xl overflow-hidden" style={{ animation: 'slideDown 0.3s ease-out' }}>
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center"><Package size={20} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Tambah Produk Manual</h3>
                <p className="text-[10px] text-slate-400 font-medium">Formulir input single produk — simpan langsung ke database & katalog</p>
              </div>
            </div>
            <button onClick={() => setActivePanel('none')} className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950/50 text-slate-500 hover:text-red-600 flex items-center justify-center cursor-pointer transition-all">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAddProductSubmit} className="p-5 space-y-5 text-xs font-semibold">
            {/* Photo Upload */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="size-16 rounded-2xl overflow-hidden border-2 border-orange-500/30 bg-white dark:bg-slate-900 p-0.5 flex items-center justify-center shrink-0">
                <img src={getR2CdnUrl(addImagePath, true)} alt="Preview" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = generateInitialsAvatar(addName || 'Produk'); }} />
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer transition-all text-[11px]">
                  <Upload size={13} /> Upload Foto
                  <input type="file" accept="image/*" onChange={handleDeviceImageUpload} className="hidden" />
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {[{ l: 'Kaos', p: '/assets/products/kaoshitam.png' }, { l: 'Tumbler', p: '/assets/products/tumbler.png' }, { l: 'Hoodie', p: '/assets/products/hoodie.png' }].map(pr => (
                    <button key={pr.p} type="button" onClick={() => setAddImagePath(pr.p)} className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-orange-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer">{pr.l}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Nama Produk *</label>
                <input type="text" required value={addName} onChange={e => setAddName(e.target.value)} placeholder="cth: Kaos Polos Hitam" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">SKU</label>
                <input type="text" value={addSku} onChange={e => setAddSku(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Kategori</label>
                <select value={addCategory} onChange={e => setAddCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:border-orange-500">
                  <option value="Fashion & Pakaian">Fashion & Pakaian</option>
                  <option value="Makanan & Minuman">Makanan & Minuman</option>
                  <option value="Drinkware">Drinkware</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Harga (IDR) *</label>
                <input type="number" required value={addPriceIdr} onChange={e => setAddPriceIdr(e.target.value)} placeholder="75000" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Harga Promo</label>
                <input type="number" value={addDiscountPriceIdr} onChange={e => setAddDiscountPriceIdr(e.target.value)} placeholder="Opsional" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-orange-600 focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Stok Awal</label>
                <input type="number" value={addStock} onChange={e => setAddStock(e.target.value)} placeholder="25" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Status</label>
                <select value={addStatus} onChange={e => setAddStatus(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none focus:border-orange-500">
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            {/* Sales Channels */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-2 font-extrabold flex items-center gap-1.5"><Share2 size={13} className="text-purple-500" /> Channel Penjualan</label>
              <div className="flex flex-wrap gap-1.5">
                {['WhatsApp Toko', 'Shopee', 'Tokopedia', 'TikTok Shop', 'POS Kasir'].map(ch => (
                  <button key={ch} type="button" onClick={() => toggleChannel(ch)} className={`px-2.5 py-1 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1 ${addSalesChannels.includes(ch) ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    {addSalesChannels.includes(ch) && <Check size={11} />} {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button type="button" onClick={() => setActivePanel('none')} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-all">Batal</button>
              <button type="submit" disabled={addSubmitting} className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-md cursor-pointer transition-all flex items-center gap-2">
                {addSubmitting ? 'Menyimpan...' : '✓ Simpan Produk'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════ INLINE COLLAPSIBLE PANEL: Bulk Upload ═══════ */}
      {activePanel === 'bulk_upload' && (
        <div ref={panelRef} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-500/30 dark:border-blue-500/20 shadow-xl overflow-hidden" style={{ animation: 'slideDown 0.3s ease-out' }}>
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center"><FileSpreadsheet size={20} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Bulk Upload Katalog Massal</h3>
                <p className="text-[10px] text-slate-400 font-medium">Impor ratusan produk sekaligus via CSV / JSON — validasi otomatis</p>
              </div>
            </div>
            <button onClick={() => { setActivePanel('none'); setBulkParsedData([]); setBulkFileName(''); }} className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950/50 text-slate-500 hover:text-red-600 flex items-center justify-center cursor-pointer transition-all">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3 hover:border-blue-500 transition-colors">
              <div className="size-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto"><UploadCloud size={24} /></div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Drag & Drop File CSV / JSON</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Atau pilih file dari komputer (.csv, .json)</p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
                <FileSpreadsheet size={14} /> {bulkFileName ? `File: ${bulkFileName}` : 'Pilih File Katalog'}
                <input type="file" accept=".csv,.json,.txt" onChange={handleBulkFileUpload} className="hidden" />
              </label>
            </div>

            {/* Preview Table */}
            {bulkParsedData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Preview: {bulkParsedData.length} baris terdeteksi</span>
                  <button onClick={handleExecuteBulkUpload} disabled={bulkLoading} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer transition-all flex items-center gap-2">
                    {bulkLoading ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Eksekusi Impor {bulkParsedData.length} Produk
                  </button>
                </div>
                <div className="overflow-x-auto max-h-56 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-[10px] uppercase font-bold text-slate-400">
                      <tr><th className="py-2 px-3">SKU</th><th className="py-2 px-3">NAMA</th><th className="py-2 px-3">KATEGORI</th><th className="py-2 px-3">HARGA</th><th className="py-2 px-3">STOK</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {bulkParsedData.slice(0, 8).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{item.sku}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                          <td className="py-2 px-3 text-slate-500">{item.category}</td>
                          <td className="py-2 px-3 font-bold text-emerald-600">Rp{(item.price_idr || 0).toLocaleString('id-ID')}</td>
                          <td className="py-2 px-3 font-extrabold">{item.stock} unit</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Product Table & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Daftar Produk Asli</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black">
              {filteredProducts.length} Produk
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold focus:outline-hidden"
            >
              <option value="Semua Kategori">Semua Kategori</option>
              {storeData.categories.map((c: any) => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">PRODUK</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">KATEGORI</th>
                <th className="py-3 px-3">HARGA</th>
                <th className="py-3 px-3">STOK</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">AKSI DEDICATED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                    Tidak ada produk yang sesuai dengan pencarian/kategori.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product: any) => (
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
                          <span className="text-[10px] text-slate-400 font-medium">{product.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">{product.sku}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-600 dark:text-slate-400">{product.category}</td>
                    <td className="py-3.5 px-3 font-black text-slate-900 dark:text-slate-100">
                      Rp{(Number(product.price_idr) || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                        product.stock <= 10 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {product.stock} unit
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        product.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {product.status || 'Aktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right relative">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedProductForAnalysis(product); setIsAnalysisModalOpen(true); }}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                        >
                          <BarChart2 size={13} /> <span>Analisis AI</span>
                        </button>
                        <button
                          onClick={() => { setSelectedProductForEdit(product); setIsEditModalOpen(true); }}
                          className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1"
                        >
                          <Edit size={13} /> <span>Edit</span>
                        </button>

                        {/* 3-Dots Context Menu Button */}
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === product.id ? null : product.id)}
                            className="size-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-all"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Context Menu Dropdown */}
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
                                <span>Edit Detail Produk</span>
                              </button>

                              <button
                                onClick={() => { setSelectedProductForEdit(product); setIsBarcodeModalOpen(true); setActiveMenuId(null); }}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Barcode size={13} className="text-indigo-500" />
                                <span>Cetak Barcode SKU</span>
                              </button>

                              <button
                                onClick={() => handleDuplicate(product.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <Layers size={13} className="text-blue-500" />
                                <span>Salin (Duplikasi)</span>
                              </button>

                              <button
                                onClick={() => handleToggleStatus(product.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <RefreshCw size={13} className="text-emerald-500" />
                                <span>{product.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan Produk'}</span>
                              </button>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                              <button
                                onClick={() => handleDelete(product.id)}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                              >
                                <AlertTriangle size={13} />
                                <span>Hapus Produk</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-semibold">
              Halaman {validCurrentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="size-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} triggerToast={triggerToast} onRefresh={loadData} />
      <ImportProductModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} triggerToast={triggerToast} onRefresh={loadData} />
      <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} triggerToast={triggerToast} />
      <DeployStoreSwarmModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} triggerToast={triggerToast} />
      <BulkDiscountModal isOpen={isBulkDiscountModalOpen} onClose={() => setIsBulkDiscountModalOpen(false)} triggerToast={triggerToast} onRefresh={loadData} />
      <ManageCategoriesModal isOpen={isManageCategoriesModalOpen} onClose={() => setIsManageCategoriesModalOpen(false)} triggerToast={triggerToast} onRefresh={loadData} />
      <BarcodePrintModal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)} triggerToast={triggerToast} product={selectedProductForEdit || storeData.products[0]} />
      <StockSyncModal isOpen={isStockSyncModalOpen} onClose={() => setIsStockSyncModalOpen(false)} triggerToast={triggerToast} onRefresh={loadData} />
      <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} product={selectedProductForEdit} triggerToast={triggerToast} onRefresh={loadData} />
      <ProductAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} product={selectedProductForAnalysis} triggerToast={triggerToast} />
    </div>
  );
}
