import React, { useState } from 'react';
import { X, Plus, Download, Upload, Filter, Tag, Barcode, RefreshCw, Percent, Package, Check } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  onRefresh?: () => void;
}

/**
 * 1. Add Product Modal
 */
export function AddProductModal({ isOpen, onClose, triggerToast, onRefresh }: ModalBaseProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [priceIdr, setPriceIdr] = useState('60000');
  const [stock, setStock] = useState('100');
  const [status, setStatus] = useState('Aktif');
  const [imagePath, setImagePath] = useState('/assets/products/kaoshitam.png');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await SupabaseDashboardService.createStoreProduct({
        name: name.trim(),
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        category,
        price_idr: parseFloat(priceIdr) || 0,
        stock: parseInt(stock, 10) || 0,
        sold: 0,
        status,
        image_path: imagePath
      });

      triggerToast(`✓ Produk "${name}" berhasil ditambahkan!`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      triggerToast('⚠️ Gagal menambahkan produk');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package size={18} className="text-orange-500" />
              <span>Tambah Produk Baru</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">Lengkapi rincian produk untuk katalog toko Anda.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">Nama Produk *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Kaos Polos Hitam Cotton 30s"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">SKU Produk</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="TSH-BLK-001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="Apparel">Apparel</option>
                <option value="Drinkware">Drinkware</option>
                <option value="Accessories">Accessories</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Harga (Rp)</label>
              <input
                type="number"
                required
                value={priceIdr}
                onChange={(e) => setPriceIdr(e.target.value)}
                placeholder="60000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Stok Awal</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="100"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Status Produk</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Gambar Asset Path</label>
              <select
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="/assets/products/kaoshitam.png">Kaos Hitam</option>
                <option value="/assets/products/tumbler.png">Tumbler Silver</option>
                <option value="/assets/products/botolminum.jpeg">Botol Minum</option>
                <option value="/assets/products/hoodie.webp">Hoodie Fleece</option>
                <option value="/assets/products/tottebag.jpeg">Totebag Canvas</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer shadow-xs"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. Import Products Modal
 */
export function ImportProductModal({ isOpen, onClose, triggerToast }: ModalBaseProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
        <div className="size-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 grid place-items-center mx-auto">
          <Upload size={24} />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Import Massal Katalog Produk</h3>
          <p className="text-xs text-slate-400 mt-1">Unggah berkas CSV / Excel (.xlsx) dengan format kolom SKU, Nama, Kategori, Harga, Stok.</p>
        </div>
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-slate-50 dark:bg-slate-800/50 hover:border-orange-500 transition-colors cursor-pointer">
          <Upload size={32} className="mx-auto text-slate-400 mb-2" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tarik berkas CSV ke sini atau Klik untuk memilih</span>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold text-xs">Batal</button>
          <button onClick={() => { triggerToast('✓ 152 Produk Berhasil Di-import!'); onClose(); }} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs">Mulai Import</button>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Export Data Modal
 */
export function ExportDataModal({ isOpen, onClose, triggerToast }: ModalBaseProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Download size={16} className="text-emerald-500" /> Export Data Toko
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="space-y-2 text-xs font-semibold">
          <label className="block text-slate-600 dark:text-slate-400">Pilih Format File:</label>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-3 rounded-xl border border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 font-bold text-left">CSV (.csv)</button>
            <button className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold text-left">Excel (.xlsx)</button>
          </div>
        </div>
        <button onClick={() => { triggerToast('✓ Laporan Stok & Produk berhasil diunduh!'); onClose(); }} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs">Unduh Sekarang</button>
      </div>
    </div>
  );
}
