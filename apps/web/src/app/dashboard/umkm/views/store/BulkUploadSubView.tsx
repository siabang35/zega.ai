import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { StoreHeaderShell } from './StoreHeaderShell';

interface BulkUploadSubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function BulkUploadSubView({ triggerToast, onNavigateTab }: BulkUploadSubViewProps) {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) setParsedData(json);
        } else {
          // Parse CSV simple lines
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, idx) => {
              obj[h] = vals[idx] || '';
            });
            return {
              sku: obj.sku || obj.SKU || `SKU-BULK-${Math.floor(Math.random()*10000)}`,
              name: obj.name || obj.Nama || obj.title || 'Produk Import',
              category: obj.category || obj.Kategori || 'Fashion & Pakaian',
              price_idr: parseFloat(obj.price_idr || obj.price || obj.Harga || '50000'),
              stock: parseInt(obj.stock || obj.Stok || '10', 10),
              image_path: obj.image_path || '/assets/products/kaoshitam.png'
            };
          });
          setParsedData(rows);
        }
        triggerToast(`✓ Berhasil membaca ${parsedData.length || 'produk'} dari file ${file.name}`);
      } catch (err) {
        triggerToast('⚠️ Gagal membaca format file. Gunakan CSV atau JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkUpload = async () => {
    if (parsedData.length === 0) {
      triggerToast('Mohon pilih file CSV/JSON terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      await SupabaseDashboardService.bulkImportStoreProducts(parsedData);
      setSuccessCount(parsedData.length);
      triggerToast(`🎉 Berhasil mengimpor ${parsedData.length} produk ke database!`);
    } catch (err: any) {
      triggerToast(`⚠️ Gagal impor massal: ${err.message || 'Error Database'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      <StoreHeaderShell activeTab="bulk_upload" onNavigateTab={onNavigateTab} />

      {/* Expandable Dropdown Sub-Page Panel Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-blue-500/30 dark:border-blue-500/20 shadow-xl space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 font-extrabold flex items-center justify-center shadow-xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Halaman Panel Dropdown
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Bulk Upload Katalog Massal (CSV / JSON)
              </h2>
              <p className="text-xs text-slate-400 font-medium">Impor ratusan produk sekaligus dengan validasi otomatis & sinkronisasi CDN.</p>
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

        {/* Dropzone Upload */}
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-8 text-center space-y-4 bg-slate-50/50 dark:bg-slate-800/20 hover:border-orange-500 transition-colors">
          <div className="size-16 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mx-auto shadow-xs">
            <UploadCloud size={32} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Drag & Drop File CSV / JSON Katalog</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">Atau pilih file dari komputer Anda (Format: .csv, .json, .xlsx)</p>
          </div>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-md transition-all">
            <FileSpreadsheet size={16} />
            <span>{fileName ? `File: ${fileName}` : 'Pilih File Katalog'}</span>
            <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Data Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Preview Impor Produk ({parsedData.length} baris terdeteksi)</span>
              </h4>
              <button
                onClick={handleExecuteBulkUpload}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Eksekusi Impor {parsedData.length} Produk</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-72 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">NAMA PRODUK</th>
                    <th className="py-2.5 px-3">KATEGORI</th>
                    <th className="py-2.5 px-3">HARGA</th>
                    <th className="py-2.5 px-3">STOK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedData.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">{item.sku}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">Rp{(item.price_idr || 0).toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-3 font-extrabold">{item.stock} unit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
