import React, { useState } from 'react';
import { 
  Search, Star, Download, ChevronRight, Sparkles, CheckCircle2, 
  ExternalLink, ArrowUpRight, ShieldCheck, Zap, Plus, Layers
} from 'lucide-react';

interface MarketplaceViewProps {
  triggerToast: (msg: string) => void;
}

// Brand SVG Icons for crisp, authentic look
const BrandLogos = {
  whatsapp: (
    <svg className="size-6 text-emerald-500 fill-current" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.157 4.228 4.23-1.107z"/>
    </svg>
  ),
  shopee: (
    <svg className="size-6 text-orange-500 fill-current" viewBox="0 0 24 24">
      <path d="M19.8 8.2h-3.3C16.1 5 13.8 2.5 12 2.5S7.9 5 7.5 8.2H4.2c-.7 0-1.2.6-1.2 1.3l1.2 11.5c.1.9.8 1.5 1.7 1.5h12.2c.9 0 1.6-.6 1.7-1.5l1.2-11.5c0-.7-.5-1.3-1.2-1.3zm-7.8-3.7c1.1 0 2.6 1.9 3 3.7H9c.4-1.8 1.9-3.7 3-3.7zm0 13c-2.3 0-4-1.2-4.1-2.6h1.9c.1.6 1 1.1 2.2 1.1 1.3 0 2.2-.6 2.2-1.3 0-.7-.7-1.1-2.2-1.5-2.2-.6-3.8-1.2-3.8-2.9 0-1.6 1.6-2.8 3.8-2.8s3.8 1.2 3.9 2.6h-1.9c-.1-.6-.9-1.1-2-1.1-1.2 0-2 .5-2 1.2 0 .6.7 1 2.2 1.4 2.3.6 3.8 1.3 3.8 3 0 1.6-1.6 2.9-4 2.9z"/>
    </svg>
  ),
  instagram: (
    <svg className="size-6 text-pink-500 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  qris: (
    <div className="size-7 rounded-lg bg-slate-950 text-white font-black text-[10px] tracking-widest flex items-center justify-center border border-slate-800">
      QRIS
    </div>
  ),
  restaurant: (
    <div className="size-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold text-xs">
      ❤️
    </div>
  ),
  laundry: (
    <div className="size-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs">
      💧
    </div>
  ),
  x402: (
    <div className="size-7 rounded-lg bg-slate-900 text-slate-100 font-mono font-bold text-[10px] flex items-center justify-center border border-slate-700">
      x402
    </div>
  ),
  stripe: (
    <div className="size-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
      S
    </div>
  ),
  midtrans: (
    <div className="size-7 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
      M
    </div>
  ),
  gopay: (
    <div className="size-7 rounded-lg bg-blue-500 text-white font-bold text-xs flex items-center justify-center">
      G
    </div>
  ),
  ovo: (
    <div className="size-7 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
      O
    </div>
  ),
  dana: (
    <div className="size-7 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center justify-center">
      D
    </div>
  )
};

export function MarketplaceView({ triggerToast }: MarketplaceViewProps) {
  const [activeCategory, setActiveCategory] = useState('Semua');

  const categories = [
    { name: 'Semua', count: 24 },
    { name: 'Sales', count: 6 },
    { name: 'Marketing', count: 5 },
    { name: 'Customer Service', count: 4 },
    { name: 'Finance', count: 4 },
    { name: 'Store & Operations', count: 3 },
    { name: 'Integrations', count: 2 },
  ];

  const popularAgents = [
    {
      id: 'wa-sales',
      title: 'WhatsApp Sales AI',
      badge: 'Popular',
      badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
      logo: BrandLogos.whatsapp,
      desc: 'AI untuk membalas chat, menjawab pertanyaan, dan meningkatkan penjualan WhatsApp.',
      rating: '4.9',
      reviews: '1.2k',
      installs: '2.4k+',
      price: 'Rp99.000',
      unit: '/bln'
    },
    {
      id: 'shopee-ai',
      title: 'Shopee AI Assistant',
      badge: null,
      logo: BrandLogos.shopee,
      desc: 'Kelola toko Shopee otomatis: balas chat, update stok, dan proses pesanan.',
      rating: '4.8',
      reviews: '856',
      installs: '1.8k+',
      price: 'Rp129.000',
      unit: '/bln'
    },
    {
      id: 'ig-ai',
      title: 'Instagram AI',
      badge: null,
      logo: BrandLogos.instagram,
      desc: 'Buat konten, balas DM, dan kelola komentar Instagram otomatis.',
      rating: '4.8',
      reviews: '742',
      installs: '1.5k+',
      price: 'Rp89.000',
      unit: '/bln'
    },
    {
      id: 'qris-ai',
      title: 'QRIS Payment AI',
      badge: null,
      logo: BrandLogos.qris,
      desc: 'Terima pembayaran QRIS, cek pembayaran, dan kirim struk otomatis.',
      rating: '4.9',
      reviews: '532',
      installs: '1.2k+',
      price: 'Rp79.000',
      unit: '/bln'
    },
    {
      id: 'restaurant-ai',
      title: 'Restaurant AI',
      badge: null,
      logo: BrandLogos.restaurant,
      desc: 'AI untuk restoran, terima pesanan, reservasi, dan promosi otomatis.',
      rating: '4.7',
      reviews: '523',
      installs: '980+',
      price: 'Rp149.000',
      unit: '/bln'
    },
    {
      id: 'laundry-ai',
      title: 'Laundry AI',
      badge: null,
      logo: BrandLogos.laundry,
      desc: 'Kelola pesanan laundry, notifikasi, dan pemindaian otomatis.',
      rating: '4.7',
      reviews: '412',
      installs: '760+',
      price: 'Rp99.000',
      unit: '/bln'
    },
  ];

  const paymentIntegrations = [
    {
      id: 'x402',
      title: 'x402 Network (M2H)',
      badge: 'Baru',
      logo: BrandLogos.x402,
      desc: 'Pembayaran mesin-ke-mesin menggunakan stablecoin via x402 protocol.'
    },
    {
      id: 'stripe',
      title: 'Stripe Non-Custodial',
      badge: null,
      logo: BrandLogos.stripe,
      desc: 'Terima pembayaran kartu kredit global via Stripe Connect.'
    },
    {
      id: 'midtrans',
      title: 'Midtrans',
      badge: null,
      logo: BrandLogos.midtrans,
      desc: 'Gateway pembayaran lengkap untuk Indonesia.'
    },
    {
      id: 'qris-pay',
      title: 'QRIS',
      badge: null,
      logo: BrandLogos.qris,
      desc: 'Terima pembayaran QRIS otomatis.'
    },
    {
      id: 'gopay',
      title: 'GoPay',
      badge: null,
      logo: BrandLogos.gopay,
      desc: 'Terima pembayaran GoPay.'
    },
    {
      id: 'ovo',
      title: 'OVO',
      badge: null,
      logo: BrandLogos.ovo,
      desc: 'Terima pembayaran OVO.'
    },
    {
      id: 'dana',
      title: 'DANA',
      badge: null,
      logo: BrandLogos.dana,
      desc: 'Terima pembayaran DANA.'
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">Marketplace</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Temukan dan install AI Employee atau integrasi premium untuk mempercepat bisnis Anda.
        </p>
      </div>

      {/* Main Grid: Left Sidebar (Categories + Custom Banner) & Right Content (AI Employees + Integrations) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (col-span-3) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Categories Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">Kategori</h3>
            <div className="space-y-1">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-900/40' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[11px] font-bold ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom AI Banner Card */}
          <div className="bg-slate-50/80 dark:bg-slate-800/30 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Butuh Custom AI?</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Kami dapat membuat AI Employee khusus untuk bisnis Anda.
            </p>
            <button 
              onClick={() => triggerToast('Requesting Custom AI Assistant...')}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              Request Custom AI
            </button>
          </div>
        </div>

        {/* Right Column (col-span-9) */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Section 1: AI Employees Populer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">AI Employees Populer</h2>
              <button 
                onClick={() => triggerToast('Viewing all popular AI Employees')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Lihat Semua
              </button>
            </div>

            {/* Grid of 6 AI Employee Cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {popularAgents.map((agent) => (
                <div 
                  key={agent.id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Logo + Title + Popular Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                          {agent.logo}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                            {agent.title}
                          </h3>
                          {agent.badge && (
                            <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-bold ${agent.badgeColor}`}>
                              🔥 {agent.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {agent.desc}
                    </p>
                  </div>

                  {/* Rating + Installs + Price + Install Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star size={11} className="fill-current" /> {agent.rating} ({agent.reviews})
                        </span>
                        <span>•</span>
                        <span>Instalasi {agent.installs}</span>
                      </div>
                      <div className="mt-1">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{agent.price}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{agent.unit}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => triggerToast(`Installing ${agent.title}...`)}
                      className="py-1.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all cursor-pointer shadow-xs"
                    >
                      Install
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Integrasi Pembayaran */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Integrasi Pembayaran</h2>
              <button 
                onClick={() => triggerToast('Viewing all payment integrations')}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Lihat Semua Integrasi
              </button>
            </div>

            {/* Scrollable / Grid of Payment Integrations */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {paymentIntegrations.map((pay) => (
                <div 
                  key={pay.id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="size-9 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                        {pay.logo}
                      </div>
                      {pay.badge && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[9px] font-extrabold">
                          {pay.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors line-clamp-1">
                        {pay.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                        {pay.desc}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => triggerToast(`Connecting ${pay.title}...`)}
                    className="mt-3 w-full py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Hubungkan
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
