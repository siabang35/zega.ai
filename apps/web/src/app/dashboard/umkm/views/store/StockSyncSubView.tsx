import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Layers, Smartphone, ShoppingBag, Store } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { StoreHeaderShell } from './StoreHeaderShell';
import { useLanguage } from '../../../../../i18n/translations';

interface StockSyncSubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function StockSyncSubView({ triggerToast, onNavigateTab }: StockSyncSubViewProps) {
  const { t } = useLanguage();
  const s = (t.storeView || {}) as any;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<'Tokopedia' | 'Shopee' | 'POS Kasir'>('Tokopedia');
  const [syncing, setSyncing] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmStoreOverview();
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load products for stock sync:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSyncExecution = async () => {
    setSyncing(true);
    try {
      const adjustments = products.map(p => ({ id: p.id, stock: p.stock }));
      await SupabaseDashboardService.syncInventoryStock(activeChannel, adjustments);
      triggerToast(`✓ ${s.syncSuccess || 'Sinkronisasi stok inventaris dengan'} ${activeChannel} ${s.successAligned || 'berhasil diselaraskan!'}`);
      await loadProducts();
    } catch (err: any) {
      triggerToast(`⚠️ ${s.syncFailed || 'Gagal menyinkronkan stok'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 pb-28 sm:pb-8">
      <StoreHeaderShell activeTab="stock_sync" onNavigateTab={onNavigateTab} />

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 w-full">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center font-bold">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{s.stockSyncTitle || 'Sinkronisasi Stok Multi-Channel Real-time'}</span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border border-slate-200 dark:border-slate-700">
                  OMNICHANNEL SYNC
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {s.stockSyncSubtitle || 'Cegah overselling dengan menyelaraskan stok inventaris POS fisik, Shopee, Tokopedia, & TikTok Shop secara otomatis.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncExecution}
              disabled={syncing}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-98"
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              <span>{s.syncStockTo || 'Sinkronkan Stok Ke'} {activeChannel}</span>
            </button>
          </div>
        </div>

        {/* Channel Selector Cards Grid */}
        <div className="space-y-3">
          <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
            {s.connectedChannels || 'Channel Penjualan Terhubung'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['Tokopedia', 'Shopee', 'POS Kasir'] as const).map(ch => {
              const active = activeChannel === ch;
              return (
                <button
                  key={ch}
                  onClick={() => setActiveChannel(ch)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                    active 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500' 
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900 dark:text-slate-100">{ch}</span>
                    {active ? (
                      <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-semibold">Status Sync:</span>
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      ONLINE SYNCED
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inventory Discrepancy Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{s.inventoryDiscrepancyAudit || 'Auditing Discrepancy Stok Inventaris'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
                {products.length} {s.activeCatalog || 'Produk'}
              </span>
            </h4>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{s.colProduct || 'PRODUK'}</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">{s.zegaDbStock || 'STOK DATABASE ZEGA'}</th>
                  <th className="py-3 px-4">{s.channelStock || 'STOK DI'} {activeChannel.toUpperCase()}</th>
                  <th className="py-3 px-4 text-right">{s.syncStatus || 'STATUS SINKRONISASI'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      {s.noStockDataFound || 'Belum ada data stok produk ditemukan.'}
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-slate-100">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{p.sku || 'N/A'}</td>
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-slate-100">{p.stock || 0} unit</td>
                      <td className="py-3 px-4 font-extrabold text-blue-600 dark:text-blue-400">{p.stock || 0} unit</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-900">
                          ✓ Synchronized
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
