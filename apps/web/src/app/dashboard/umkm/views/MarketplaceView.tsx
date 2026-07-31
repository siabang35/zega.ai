import React, { useState } from 'react';
import { 
  Search, Star, Download, ChevronRight, Sparkles, CheckCircle2, 
  ExternalLink, ArrowUpRight, ShieldCheck, Zap, Plus, Layers
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';

interface MarketplaceViewProps {
  triggerToast: (msg: string) => void;
}

// Brand SVG & CDN Image Logos for crisp, authentic look
const BrandLogos = {
  whatsapp: (
    <img src={getR2CdnUrl('/assets/logo/whatsapp-for-business.webp')} className="size-6 object-contain" alt="WhatsApp Business" />
  ),
  shopee: (
    <img src={getR2CdnUrl('/assets/logo/shopee.png')} className="size-6 object-contain" alt="Shopee" />
  ),
  instagram: (
    <img src={getR2CdnUrl('/assets/logo/instagram.png')} className="size-6 object-contain" alt="Instagram" />
  ),
  qris: (
    <img src={getR2CdnUrl('/assets/logo/qris.webp')} className="h-4.5 w-auto object-contain" alt="QRIS" />
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
    <img src={getR2CdnUrl('/assets/visualization/x402.jpg')} className="size-6 object-contain rounded-md" alt="x402 Protocol" />
  ),
  stripe: (
    <img src={getR2CdnUrl('/assets/visualization/stripe.webp')} className="h-4.5 w-auto object-contain" alt="Stripe" />
  ),
  midtrans: (
    <img src={getR2CdnUrl('/assets/logo/Midtrans.png')} className="h-4 w-auto object-contain" alt="Midtrans" />
  ),
  gopay: (
    <img src={getR2CdnUrl('/assets/logo/gopay.webp')} className="h-4.5 w-auto object-contain" alt="GoPay" />
  ),
  ovo: (
    <img src={getR2CdnUrl('/assets/logo/ovo.png')} className="h-5 w-auto object-contain" alt="OVO" />
  ),
  dana: (
    <img src={getR2CdnUrl('/assets/logo/dana.webp')} className="h-4.5 w-auto object-contain" alt="DANA" />
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
