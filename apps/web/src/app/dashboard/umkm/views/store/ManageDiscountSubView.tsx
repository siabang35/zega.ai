import React, { useState, useEffect } from 'react';
import { Tag, ArrowLeft, Percent, DollarSign, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
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

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigateTab && onNavigateTab('manage_product')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Tag size={18} className="text-orange-500" />
                <span>Pengaturan Diskon & Promo Massal</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Terapkan diskon persentase atau potongan harga untuk produk terpilih atau per kategori.</p>
            </div>
          </div>
        </div>

        {/* Form Diskon Generator */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <span>Kalkulator & Pengaplikasi Diskon</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Target Kategori</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold focus:outline-none focus:border-orange-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Tipe Potongan Harga</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    discountType === 'percent' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  % Persen
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('flat')}
                  className={`py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    discountType === 'flat' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Rp Flat
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">
                {discountType === 'percent' ? 'Nilai Persentase Diskon (%)' : 'Nilai Potongan (Rp)'}
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '15' : '10000'}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-orange-600 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
            <span className="text-xs text-slate-500 font-medium">
              Targeting: <strong className="text-slate-900 dark:text-slate-100">{selectedProductIds.length > 0 ? `${selectedProductIds.length} produk dipilih` : `Semua produk dalam kategori ${selectedCategory}`}</strong>
            </span>

            <button
              onClick={handleApplyDiscount}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Terapkan Diskon Massal</span>
            </button>
          </div>
        </div>

        {/* Product Selection List */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
            Daftar Produk Target Diskon ({filteredProducts.length} Produk)
          </h4>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">PILIH</th>
                  <th className="py-2.5 px-3">PRODUK</th>
                  <th className="py-2.5 px-3">KATEGORI</th>
                  <th className="py-2.5 px-3">HARGA ASLI</th>
                  <th className="py-2.5 px-3">HARGA PROMO SAAT INI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 size-4"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{product.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{product.category}</td>
                      <td className="py-2.5 px-3 font-bold">Rp{(product.price_idr || 0).toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-3 font-black text-orange-600">
                        {product.discount_price_idr ? `Rp${(product.discount_price_idr).toLocaleString('id-ID')}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
