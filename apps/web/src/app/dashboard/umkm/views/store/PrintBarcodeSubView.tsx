import React, { useState, useEffect } from 'react';
import { Barcode, Printer, Download, Search, Check, Layers } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { StoreHeaderShell } from './StoreHeaderShell';
import { useLanguage } from '../../../../../i18n/translations';

interface PrintBarcodeSubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function PrintBarcodeSubView({ triggerToast, onNavigateTab }: PrintBarcodeSubViewProps) {
  const { t } = useLanguage();
  const s = (t.storeView || {}) as any;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [paperLayout, setPaperLayout] = useState<'2x1' | '3x1'>('2x1');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmStoreOverview();
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
        setSelectedProductIds(data.products.slice(0, 4).map((p: any) => p.id));
      }
    } catch (err) {
      console.error('Failed to load products for barcode printer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const handlePrintTrigger = () => {
    if (selectedProductIds.length === 0) {
      triggerToast(s.selectMinBarcode || 'Mohon pilih minimal 1 produk untuk dicetak barcodenya');
      return;
    }
    triggerToast(`🖨️ ${s.sendingBarcodeToPrinter || 'Mengirim'} ${selectedProductIds.length} ${s.thermalBarcodeLabels || 'label barcode thermal ke printer...'}`);
    window.print();
  };

  const filteredProducts = products.filter(p => 
    !searchQuery || 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      <StoreHeaderShell activeTab="print_barcode" onNavigateTab={onNavigateTab} />

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 w-full">
        {/* Header Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center font-bold">
              <Barcode size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{s.printBarcodeTitle || 'Cetak Barcode & Label Thermal SKU'}</span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border border-slate-200 dark:border-slate-700">
                  THERMAL PRINTER READY
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {s.printBarcodeSubtitle || 'Hasilkan stiker barcode standar 2x1 / 3x1 untuk ditempel pada produk & rak toko fisik Anda.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paperLayout}
              onChange={e => setPaperLayout(e.target.value as any)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="2x1">{s.layout2x1 || 'Layout Thermal 2x1 Kolom'}</option>
              <option value="3x1">{s.layout3x1 || 'Layout Thermal 3x1 Kolom'}</option>
            </select>

            <button
              onClick={handlePrintTrigger}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <Printer size={16} />
              <span>{s.printBarcode || 'Cetak Barcode'} ({selectedProductIds.length})</span>
            </button>
          </div>
        </div>

        {/* Product Selection & Live Preview Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Col 1: Selector List */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>{s.selectBarcodeProducts || 'Pilih Produk Barcode'}</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
                  {selectedProductIds.length} / {products.length}
                </span>
              </h4>
              <button onClick={selectAll} className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {selectedProductIds.length === products.length ? (s.deselectAll || 'Batal Semua') : (s.selectAll || 'Pilih Semua')}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={s.searchBarcodePlaceholder || 'Cari produk berdasarkan nama atau SKU...'}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 font-bold focus:outline-none focus:border-blue-500"
              />
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
            </div>

            <div className="max-h-[460px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs">
              {filteredProducts.map(p => {
                const active = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      active ? 'bg-blue-50/60 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{p.name}</h5>
                      <span className="font-mono text-[10px] text-slate-400 block">SKU: {p.sku || 'N/A'}</span>
                    </div>
                    <div className={`size-5 rounded-lg border flex items-center justify-center transition-all ${
                      active ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      {active && <Check size={13} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col 2: Preview Thermal Label Sheet */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Printer size={15} className="text-blue-500" />
                <span>{s.previewThermalSheet || 'Preview Lembar Thermal Stiker'} ({paperLayout})</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-400">{s.standardDimensions || 'Dimensi Standard 50x30mm'}</span>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                {s.noProductsSelectedForBarcode || 'Belum ada produk yang dipilih untuk preview cetak barcode.'}
              </div>
            ) : (
              <div className={`grid ${paperLayout === '2x1' ? 'grid-cols-2' : 'grid-cols-3'} gap-3.5 max-h-[440px] overflow-y-auto p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner`}>
                {selectedProducts.map(p => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-300 text-slate-900 text-center space-y-1.5 shadow-2xs hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black uppercase tracking-wider block truncate text-slate-900">{p.name}</span>
                    <div className="bg-slate-950 text-white py-1.5 px-1 rounded font-mono text-[9px] tracking-widest font-black select-none">
                      ||||||| | ||||| || |||
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 block font-mono">*{p.sku || 'SKU-ITEM'}*</span>
                    <span className="text-[10px] font-black text-emerald-700 block">Rp{(p.price_idr || 0).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
