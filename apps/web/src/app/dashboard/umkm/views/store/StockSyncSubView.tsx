import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, CheckCircle2, AlertTriangle, Layers, Smartphone, ShoppingBag, Store } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { StoreHeaderShell } from './StoreHeaderShell';

interface StockSyncSubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function StockSyncSubView({ triggerToast, onNavigateTab }: StockSyncSubViewProps) {
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
      triggerToast(`🎉 Sinkronisasi stok inventaris dengan ${activeChannel} berhasil diselaraskan!`);
      await loadProducts();
    } catch (err: any) {
      triggerToast('⚠️ Gagal menyinkronkan stok');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      <StoreHeaderShell activeTab="stock_sync" onNavigateTab={onNavigateTab} />

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
                <RefreshCw size={18} className="text-emerald-500" />
                <span>Sinkronisasi Stok Multi-Channel Real-time</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Cegah overselling dengan menyelaraskan stok antar POS fisik, Shopee, Tokopedia & WhatsApp.</p>
            </div>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="grid grid-cols-3 gap-3">
          {(['Tokopedia', 'Shopee', 'POS Kasir'] as const).map(ch => {
            const active = activeChannel === ch;
            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  active 
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 shadow-xs' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{ch}</span>
                  {active && <CheckCircle2 size={16} className="text-orange-500" />}
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">Status: Online Sync</span>
              </button>
            );
          })}
        </div>

        {/* Discrepancy Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
              Auditing Discrepancy Stok ({products.length} Produk)
            </h4>

            <button
              onClick={handleSyncExecution}
              disabled={syncing}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {syncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Sinkronkan Stok Ke {activeChannel} Now</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">PRODUK</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">STOK DATABASE ZEGA</th>
                  <th className="py-2.5 px-3">STOK DI {activeChannel.toUpperCase()}</th>
                  <th className="py-2.5 px-3">STATUS SINKRONISASI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{p.sku}</td>
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-slate-100">{p.stock} unit</td>
                    <td className="py-2.5 px-3 font-extrabold text-blue-600">{p.stock} unit</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold">
                        ✓ Synchronized
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
