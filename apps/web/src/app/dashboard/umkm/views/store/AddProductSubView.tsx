import React, { useState } from 'react';
import { Package, Upload, ArrowLeft, Check, Sparkles, Image, DollarSign, Tag, Layers, Share2 } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';
import { StoreHeaderShell } from './StoreHeaderShell';

interface AddProductSubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function AddProductSubView({ triggerToast, onNavigateTab }: AddProductSubViewProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState(`SKU-${Date.now().toString().slice(-6)}`);
  const [category, setCategory] = useState('Fashion & Pakaian');
  const [priceIdr, setPriceIdr] = useState('');
  const [discountPriceIdr, setDiscountPriceIdr] = useState('');
  const [stock, setStock] = useState('25');
  const [weightGram, setWeightGram] = useState('250');
  const [status, setStatus] = useState('Aktif');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState('S, M, L, XL');
  const [imagePath, setImagePath] = useState('');
  const [salesChannels, setSalesChannels] = useState<string[]>(['WhatsApp Toko', 'Shopee', 'Tokopedia']);
  const [submitting, setSubmitting] = useState(false);

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        if (dataUrl) {
          setImagePath(dataUrl);
          triggerToast(`✓ Foto "${file.name}" berhasil dimuat dari perangkat!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleChannel = (ch: string) => {
    setSalesChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !priceIdr) {
      triggerToast('Mohon isi nama produk dan harga jual IDR');
      return;
    }

    setSubmitting(true);
    try {
      await SupabaseDashboardService.createStoreProduct({
        name: name.trim(),
        sku: sku.trim(),
        category,
        price_idr: parseFloat(priceIdr) || 0,
        discount_price_idr: discountPriceIdr ? parseFloat(discountPriceIdr) : null,
        stock: parseInt(stock, 10) || 0,
        weight_gram: parseInt(weightGram, 10) || 250,
        status,
        description: description.trim() || 'Produk unggulan katalog toko UMKM ZEGA AI.',
        variants: variants.trim() ? variants.split(',').map(v => v.trim()) : ['All Size'],
        sales_channels: salesChannels,
        image_path: imagePath,
        cdn_icon_url: imagePath
      });

      triggerToast(`✓ Produk "${name}" berhasil ditambahkan ke katalog & database!`);
      if (onNavigateTab) onNavigateTab('manage_product');
    } catch (err: any) {
      triggerToast(`⚠️ Gagal menyimpan produk: ${err.message || 'Error Database'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      <StoreHeaderShell activeTab="add_product" onNavigateTab={onNavigateTab} />

      {/* Expandable Dropdown Sub-Page Panel Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-orange-500/30 dark:border-orange-500/20 shadow-xl space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-extrabold flex items-center justify-center shadow-xs">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
                  Halaman Panel Dropdown
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Formulir Tambah Produk Manual
              </h2>
              <p className="text-xs text-slate-400 font-medium">Input spesifikasi lengkap, foto dari HP/PC, harga promo, & channel sync.</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('manage_product')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>Tutup Panel ✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold">
          {/* Section 1: Upload Foto Device */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-slate-900 dark:text-slate-100 font-black text-sm flex items-center gap-2">
                <Image size={16} className="text-blue-500" />
                <span>Foto Produk Real (Device / Preset CDN)</span>
              </label>
              <label className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs">
                <Upload size={14} />
                <span>Upload Foto dari HP / Laptop</span>
                <input type="file" accept="image/*" onChange={handleDeviceImageUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="size-20 rounded-2xl overflow-hidden border-2 border-orange-500/40 bg-white dark:bg-slate-900 flex-shrink-0 p-1 flex items-center justify-center shadow-md">
                <img 
                  src={getR2CdnUrl(imagePath, true)} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = generateInitialsAvatar(name || 'Produk'); }}
                />
              </div>

              <div className="flex-1 space-y-2">
                <input 
                  type="text" 
                  value={imagePath}
                  onChange={e => setImagePath(e.target.value)}
                  placeholder="URL Foto / Data Base64..."
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-orange-500"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold">Preset CDN:</span>
                  {[
                    { label: 'Kaos Hitam', path: '/assets/products/kaoshitam.png' },
                    { label: 'Tumbler', path: '/assets/products/tumbler.png' },
                    { label: 'Hoodie', path: '/assets/products/hoodie.png' },
                    { label: 'Botol Stainless', path: '/assets/products/botolminum.jpeg' }
                  ].map(p => (
                    <button
                      key={p.path}
                      type="button"
                      onClick={() => setImagePath(p.path)}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-orange-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Detail Produk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Nama Produk *</label>
              <input 
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="cth: Kaos Polos Hitam Cotton Combed 30s"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">SKU Kode Barcode</label>
              <input 
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Kategori Produk</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="Fashion & Pakaian">Fashion & Pakaian</option>
                <option value="Makanan & Minuman">Makanan & Minuman</option>
                <option value="Kecantikan & Skincare">Kecantikan & Skincare</option>
                <option value="Elektronik & Gadget">Elektronik & Gadget</option>
                <option value="Perlengkapan Rumah">Perlengkapan Rumah</option>
                <option value="Kerajinan & Souvenir">Kerajinan & Souvenir</option>
                <option value="Drinkware">Drinkware</option>
                <option value="Apparel">Apparel</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Status Publikasi</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="Aktif">Aktif (Tampil di Toko)</option>
                <option value="Nonaktif">Nonaktif (Diarsipkan)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Harga & Diskon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Harga Normal (IDR) *</label>
              <input 
                type="number"
                required
                value={priceIdr}
                onChange={e => setPriceIdr(e.target.value)}
                placeholder="75000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Harga Coret / Promo (IDR)</label>
              <input 
                type="number"
                value={discountPriceIdr}
                onChange={e => setDiscountPriceIdr(e.target.value)}
                placeholder="59000 (Opsional)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-orange-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-extrabold">Jumlah Stok Awal</label>
              <input 
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="25"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Section 4: Channel Penjualan */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-2 font-extrabold flex items-center gap-1.5">
              <Share2 size={14} className="text-purple-500" />
              <span>Channel Penjualan Terintegrasi</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {['WhatsApp Toko', 'Shopee', 'Tokopedia', 'TikTok Shop', 'POS Kasir'].map(ch => {
                const active = salesChannels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      active 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {active && <Check size={12} />}
                    <span>{ch}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('manage_product')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {submitting ? 'Menyimpan...' : '✓ Simpan Produk ke Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
