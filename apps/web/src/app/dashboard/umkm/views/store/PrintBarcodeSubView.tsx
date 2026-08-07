import React, { useState, useEffect } from 'react';
import { Barcode, ArrowLeft, Printer, Download, Search, Check, Layers } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { StoreHeaderShell } from './StoreHeaderShell';

interface PrintBarcodeSubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function PrintBarcodeSubView({ triggerToast, onNavigateTab }: PrintBarcodeSubViewProps) {
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
      triggerToast('Mohon pilih minimal 1 produk untuk dicetak barcodenya');
      return;
    }
    triggerToast(`🖨️ Mengirim ${selectedProductIds.length} label barcode thermal ke printer...`);
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

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigateTab && onNavigateTab('manage_product')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Barcode size={18} className="text-blue-500" />
                <span>Cetak Barcode & Label Thermal SKU</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Hasilkan stiker barcode standar 2x1 / 3x1 untuk ditempel pada produk toko Anda.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paperLayout}
              onChange={e => setPaperLayout(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            >
              <option value="2x1">Layout Thermal 2x1 Kolom</option>
              <option value="3x1">Layout Thermal 3x1 Kolom</option>
            </select>

            <button
              onClick={handlePrintTrigger}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Printer size={16} />
              <span>Cetak Barcode ({selectedProductIds.length})</span>
            </button>
          </div>
        </div>

        {/* Product Selection Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Col 1: Selector List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                Pilih Produk ({selectedProductIds.length} terpilih)
              </h4>
              <button onClick={selectAll} className="text-[11px] font-bold text-orange-500 hover:underline">
                {selectedProductIds.length === products.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama / SKU..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map(p => {
                const active = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      active ? 'bg-orange-50/60 dark:bg-orange-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{p.name}</h5>
                      <span className="font-mono text-[10px] text-slate-400 block">SKU: {p.sku}</span>
                    </div>
                    <div className={`size-5 rounded-lg border flex items-center justify-center ${
                      active ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {active && <Check size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col 2: Preview Thermal Label Sheet */}
          <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 space-y-4">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Printer size={14} className="text-orange-500" />
              <span>Preview Sheet Stiker Thermal ({paperLayout})</span>
            </h4>

            {selectedProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold">
                Belum ada produk yang dipilih untuk preview cetak barcode.
              </div>
            ) : (
              <div className={`grid ${paperLayout === '2x1' ? 'grid-cols-2' : 'grid-cols-3'} gap-3 max-h-[400px] overflow-y-auto p-2`}>
                {selectedProducts.map(p => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-300 text-slate-900 text-center space-y-1.5 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider block truncate">{p.name}</span>
                    <div className="bg-slate-900 text-white p-1 rounded font-mono text-[9px] tracking-widest font-black">
                      ||||||| | ||||| || |||
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 block font-mono">*{p.sku}*</span>
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
