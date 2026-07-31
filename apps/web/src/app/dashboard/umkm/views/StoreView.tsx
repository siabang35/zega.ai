import React from 'react';
import { 
  Store, Plus, Download, AlertTriangle, TrendingUp, ShoppingBag, 
  DollarSign, Package, AlertCircle 
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';

interface StoreViewProps {
  triggerToast: (msg: string) => void;
}

export function StoreView({ triggerToast }: StoreViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">STORE</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kelola produk, stok, dan pesanan dengan mudah.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => triggerToast('Importing products...')}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
          >
            <Download size={14} /> Import Produk
          </button>
          <button 
            onClick={() => triggerToast('Tambah Produk Baru')}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Tambah Produk
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Produk</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Package size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">152</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">+8 this month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Stok Value</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><DollarSign size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">Rp24.500.000</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">+12% this month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Low Stock</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><AlertTriangle size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">6</div>
            <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-1">Perlu perhatian</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Orders Today</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><ShoppingBag size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">43</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">+18% vs yesterday</div>
          </div>
        </div>
      </div>

      {/* Middle Section: Stok Alert + Top Selling Products */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Stok Alert List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-500" /> Stok Alert
            </h3>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              { 
                name: 'Kaos Polos Hitam', 
                category: 'Apparel · Cotton Comb 30s',
                stock: '2 pcs', 
                bg: 'bg-red-50 text-red-600 dark:bg-red-950/40 border-red-200/50',
                img: getR2CdnUrl('/assets/products/kaoshitam.png') 
              },
              { 
                name: 'Tumbler Premium', 
                category: 'Drinkware · Stainless 500ml',
                stock: '4 pcs', 
                bg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 border-orange-200/50',
                img: getR2CdnUrl('/assets/products/tumbler.png') 
              },
              { 
                name: 'Botol Minum 500ml', 
                category: 'Drinkware · BPA Free',
                stock: '5 pcs', 
                bg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 border-orange-200/50',
                img: getR2CdnUrl('/assets/products/botolminum.jpeg') 
              },
              { 
                name: 'Hoodie Full Zip', 
                category: 'Apparel · Fleece Premium',
                stock: '7 pcs', 
                bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 border-amber-200/50',
                img: getR2CdnUrl('/assets/products/hoodie.webp') 
              },
              { 
                name: 'Totebag Canvas', 
                category: 'Accessories · Canvas Drill',
                stock: '8 pcs', 
                bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 border-amber-200/50',
                img: getR2CdnUrl('/assets/products/tottebag.jpeg') 
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="relative size-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs flex-shrink-0 p-1 flex items-center justify-center">
                    <img 
                      src={item.img} 
                      alt={item.name} 
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${item.bg}`}>
                  Stok: {item.stock}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" /> Top Selling Products
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Bulan Ini</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="col-span-5">Product</span>
              <span className="col-span-3 text-center">Unit Terjual</span>
              <span className="col-span-4 text-right">Revenue</span>
            </div>
            {[
              { 
                name: 'Kaos Polos Hitam', 
                sold: '32', 
                rev: 'Rp1.920.000', 
                trend: '📈',
                img: getR2CdnUrl('/assets/products/kaoshitam.png')
              },
              { 
                name: 'Tumbler Premium', 
                sold: '28', 
                rev: 'Rp2.800.000', 
                trend: '📈',
                img: getR2CdnUrl('/assets/products/tumbler.png')
              },
              { 
                name: 'Botol Minum 500ml', 
                sold: '24', 
                rev: 'Rp1.680.000', 
                trend: '📈',
                img: getR2CdnUrl('/assets/products/botolminum.jpeg')
              },
              { 
                name: 'Hoodie Full Zip', 
                sold: '18', 
                rev: 'Rp3.600.000', 
                trend: '📈',
                img: getR2CdnUrl('/assets/products/hoodie.webp')
              },
              { 
                name: 'Totebag Canvas', 
                sold: '15', 
                rev: 'Rp750.000', 
                trend: '📈',
                img: getR2CdnUrl('/assets/products/tottebag.jpeg')
              },
            ].map((p, i) => (
              <div key={i} className="grid grid-cols-12 items-center p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="col-span-5 flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="size-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs flex-shrink-0 p-0.5 flex items-center justify-center">
                    <img 
                      src={p.img} 
                      alt={p.name} 
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{p.name}</span>
                </div>
                <span className="col-span-3 text-center text-slate-500 font-semibold">{p.sold}</span>
                <span className="col-span-3 text-right font-black text-slate-900 dark:text-slate-100">{p.rev}</span>
                <span className="col-span-1 text-right text-xs">{p.trend}</span>
              </div>
            ))}
          </div>
          <button onClick={() => triggerToast('Viewing all products')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">Lihat Semua Produk &gt;</button>
        </div>
      </div>
    </div>
  );
}
