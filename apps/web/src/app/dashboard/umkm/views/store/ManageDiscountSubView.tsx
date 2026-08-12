import React, { useState, useEffect } from 'react';
import { Tag, Percent, DollarSign, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { StoreHeaderShell } from './StoreHeaderShell';

interface ManageDiscountSubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function ManageDiscountSubView({ triggerToast, onNavigateTab }: ManageDiscountSubViewProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmStoreOverview();
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
        const cats = Array.from(new Set(data.products.map((p: any) => p.category || 'Apparel')));
        setCategories(['Semua', ...cats]);
      }
    } catch (err) {
      console.error('Failed to load products for discount manager:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleApplyDiscount = async () => {
    const val = parseFloat(discountValue);
    if (!val || val <= 0) {
      triggerToast('Mohon masukkan besaran diskon yang valid');
      return;
    }

    setSubmitting(true);
    try {
      await SupabaseDashboardService.batchUpdateProductDiscounts({
        productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
        category: selectedCategory !== 'Semua' ? selectedCategory : undefined,
        discountPercent: discountType === 'percent' ? val : 0,
        discountFlat: discountType === 'flat' ? val : 0
      });

      triggerToast(`🎉 Diskon ${discountType === 'percent' ? `${val}%` : `Rp${val.toLocaleString('id-ID')}`} berhasil diterapkan!`);
      await loadProducts();
    } catch (err: any) {
      triggerToast(`⚠️ Gagal menerapkan diskon: ${err.message || 'Error Server'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p: any) => {
    if (selectedCategory === 'Semua') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      <StoreHeaderShell activeTab="manage_discount" onNavigateTab={onNavigateTab} />

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 w-full">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/60 flex items-center justify-center font-bold">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Pengaturan Diskon & Promo Massal</span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border border-slate-200 dark:border-slate-700">
                  BULK DISCOUNT ENGINE
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Terapkan diskon persentase atau potongan harga untuk produk terpilih atau per kategori secara otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Form Diskon Generator */}
        <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span>Kalkulator & Pengaplikasi Diskon Massal</span>
            </h4>
            <span className="text-xs font-bold text-slate-500">
              Selected: <strong className="text-orange-600 dark:text-orange-400">{selectedProductIds.length > 0 ? `${selectedProductIds.length} Produk` : `Semua Produk (${selectedCategory})`}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-bold">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-extrabold">Target Kategori Produk</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-orange-500 shadow-2xs"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-extrabold">Tipe Potongan Harga</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    discountType === 'percent' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  % Persen
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('flat')}
                  className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    discountType === 'flat' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Rp Flat (Nominal)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-extrabold">
                {discountType === 'percent' ? 'Nilai Persentase Diskon (%)' : 'Nilai Potongan Price (Rp)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? '15' : '10000'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 shadow-2xs text-sm"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  {discountType === 'percent' ? '%' : 'IDR'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 dark:border-slate-700/80 pt-4">
            <span className="text-xs text-slate-500 font-medium">
              Targeting Scope: <strong className="text-slate-900 dark:text-slate-100">{selectedProductIds.length > 0 ? `${selectedProductIds.length} produk spesifik dipilih` : `Semua katalog produk dalam kategori "${selectedCategory}"`}</strong>
            </span>

            <button
              onClick={handleApplyDiscount}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              {submitting ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>Terapkan Diskon Massal</span>
            </button>
          </div>
        </div>

        {/* Product Selection List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Daftar Produk Target Diskon</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
                {filteredProducts.length} Produk
              </span>
            </h4>

            {filteredProducts.length > 0 && (
              <button
                onClick={() => {
                  if (selectedProductIds.length === filteredProducts.length) setSelectedProductIds([]);
                  else setSelectedProductIds(filteredProducts.map(p => p.id));
                }}
                className="text-xs font-extrabold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                {selectedProductIds.length === filteredProducts.length ? 'Batalkan Pilih Semua' : 'Pilih Semua Produk'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">PILIH</th>
                  <th className="py-3 px-4">PRODUK</th>
                  <th className="py-3 px-4">KATEGORI</th>
                  <th className="py-3 px-4">HARGA ASLI</th>
                  <th className="py-3 px-4">HARGA PROMO SAAT INI</th>
                  <th className="py-3 px-4 text-right">STATUS PROMO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      Tidak ada produk ditemukan untuk kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    return (
                      <tr 
                        key={product.id} 
                        onClick={() => toggleSelectProduct(product.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50/50 dark:bg-orange-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProduct(product.id)}
                            className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 size-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-slate-100">{product.name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-500">{product.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Rp{(product.price_idr || 0).toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4 font-black text-orange-600 dark:text-orange-400">
                          {product.discount_price_idr ? `Rp${(product.discount_price_idr).toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {product.discount_price_idr ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-900">
                              Diskon Aktif
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-normal">Harga Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
