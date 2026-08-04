import React, { useState, useEffect } from 'react';
import { 
  Search, Star, Sparkles, CheckCircle2, ChevronRight, ArrowRight,
  Layers, UserCheck, Settings, ShieldCheck, Zap, HelpCircle,
  ExternalLink, ChevronDown, Filter, Plus
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { 
  AIAgentDetailModal, ConnectPaymentModal, RequestCustomAIModal, MarketplaceHelpModal 
} from './marketplace/MarketplaceModals';

interface MarketplaceViewProps {
  triggerToast: (msg: string) => void;
}

// Crisp Brand SVG / CDN Image Helpers
const BrandLogos: Record<string, React.ReactNode> = {
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
  const [selectedCategoryPill, setSelectedCategoryPill] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedAgentForDetail, setSelectedAgentForDetail] = useState<any | null>(null);
  const [selectedPaymentForConnect, setSelectedPaymentForConnect] = useState<any | null>(null);
  const [isRequestCustomAIModalOpen, setIsRequestCustomAIModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Consolidated Marketplace Data State
  const [marketplaceData, setMarketplaceData] = useState<any>({
    agents: [
      {
        id: 'wa-sales',
        title: 'WhatsApp Sales AI',
        description: 'AI untuk membalas chat, menjawab pertanyaan, dan meningkatkan penjualan WhatsApp.',
        category_name: 'Sales',
        badge_label: 'Populer',
        icon_key: 'whatsapp',
        rating_score: 4.9,
        rating_reviews_count: 1200,
        installs_count_label: '2.4k+',
        price_idr: 99000,
        billing_unit: '/bln',
        is_installed: true
      },
      {
        id: 'shopee-ai',
        title: 'Shopee AI Assistant',
        description: 'Kelola toko Shopee otomatis: balas chat, update stok, dan proses pesanan.',
        category_name: 'Sales',
        badge_label: null,
        icon_key: 'shopee',
        rating_score: 4.8,
        rating_reviews_count: 856,
        installs_count_label: '1.8k+',
        price_idr: 129000,
        billing_unit: '/bln',
        is_installed: false
      },
      {
        id: 'ig-ai',
        title: 'Instagram AI',
        description: 'Buat konten, balas DM, dan kelola komentar Instagram otomatis.',
        category_name: 'Marketing',
        badge_label: null,
        icon_key: 'instagram',
        rating_score: 4.8,
        rating_reviews_count: 742,
        installs_count_label: '1.5k+',
        price_idr: 89000,
        billing_unit: '/bln',
        is_installed: false
      },
      {
        id: 'qris-ai',
        title: 'QRIS Payment AI',
        description: 'Terima pembayaran QRIS, cek pembayaran, dan kirim struk otomatis.',
        category_name: 'Finance',
        badge_label: null,
        icon_key: 'qris',
        rating_score: 4.8,
        rating_reviews_count: 532,
        installs_count_label: '1.2k+',
        price_idr: 79000,
        billing_unit: '/bln',
        is_installed: true
      },
      {
        id: 'restaurant-ai',
        title: 'Restaurant AI',
        description: 'AI untuk restoran, terima pesanan, reservasi, dan promosi otomatis.',
        category_name: 'Store & Operations',
        badge_label: null,
        icon_key: 'restaurant',
        rating_score: 4.7,
        rating_reviews_count: 523,
        installs_count_label: '980+',
        price_idr: 149000,
        billing_unit: '/bln',
        is_installed: false
      },
      {
        id: 'laundry-ai',
        title: 'Laundry AI',
        description: 'Kelola pesanan laundry, notifikasi, dan pemindahan otomatis.',
        category_name: 'Store & Operations',
        badge_label: null,
        icon_key: 'laundry',
        rating_score: 4.7,
        rating_reviews_count: 412,
        installs_count_label: '760+',
        price_idr: 99000,
        billing_unit: '/bln',
        is_installed: false
      }
    ],
    payments: [
      { id: 'p1', title: 'x402 Network (M2H)', description: 'Pembayaran mesin-ke-mesin menggunakan stablecoin v...', badge_label: 'Baru', icon_key: 'x402', is_connected: true, connection_status: 'Terhubung' },
      { id: 'p2', title: 'Stripe', description: 'Terima pembayaran kartu kredit global via Stripe Connect.', badge_label: null, icon_key: 'stripe', is_connected: false, connection_status: 'Hubungkan' },
      { id: 'p3', title: 'Midtrans', description: 'Gateway pembayaran lengkap untuk Indonesia.', badge_label: null, icon_key: 'midtrans', is_connected: true, connection_status: 'Terhubung' },
      { id: 'p4', title: 'QRIS', description: 'Terima pembayaran QRIS otomatis.', badge_label: null, icon_key: 'qris', is_connected: true, connection_status: 'Terhubung' },
      { id: 'p5', title: 'GoPay', description: 'Terima pembayaran GoPay.', badge_label: null, icon_key: 'gopay', is_connected: false, connection_status: 'Hubungkan' },
      { id: 'p6', title: 'OVO', description: 'Terima pembayaran OVO.', badge_label: null, icon_key: 'ovo', is_connected: false, connection_status: 'Hubungkan' },
      { id: 'p7', title: 'DANA', description: 'Terima pembayaran DANA.', badge_label: null, icon_key: 'dana', is_connected: false, connection_status: 'Hubungkan' }
    ],
    categories: [
      { name: 'Sales', count: 23 },
      { name: 'Marketing', count: 18 },
      { name: 'Customer Service', count: 14 },
      { name: 'Finance', count: 12 },
      { name: 'Store & Operations', count: 10 },
      { name: 'Productivity', count: 8 },
      { name: 'Analytics', count: 6 }
    ],
    articles: [
      { title: 'Cara Mengoptimalkan WhatsApp Sales AI', category_name: 'Sales', views_count: 532, time_ago: '2 jam lalu' },
      { title: 'Panduan Integrasi Pembayaran QRIS', category_name: 'Finance', views_count: 421, time_ago: '5 jam lalu' },
      { title: 'Tips Meningkatkan Conversion dengan AI', category_name: 'Marketing', views_count: 389, time_ago: '1 hari lalu' }
    ],
    newAgents: [
      { title: 'AI Invoice Processor', category_name: 'Finance', badge_label: 'Baru' },
      { title: 'AI Product Description Generator', category_name: 'Marketing', badge_label: 'Baru' },
      { title: 'AI Customer Segmentation', category_name: 'Analytics', badge_label: 'Baru' }
    ],
    topAgents: [
      { rank_order: 1, title: 'WhatsApp Sales AI', installs_count_label: '2.4k instalasi' },
      { rank_order: 2, title: 'Shopee AI Assistant', installs_count_label: '1.8k instalasi' },
      { rank_order: 3, title: 'QRIS Payment AI', installs_count_label: '1.2k instalasi' }
    ]
  });

  // Fetch Consolidated Marketplace Data from Supabase
  const loadMarketplaceOverview = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmMarketplaceOverview();
      if (data) {
        setMarketplaceData((prev: any) => ({
          ...prev,
          agents: data.agents?.length > 0 ? data.agents : prev.agents,
          payments: data.payments?.length > 0 ? data.payments : prev.payments,
          categories: data.categories?.length > 0 ? data.categories : prev.categories,
          articles: data.articles?.length > 0 ? data.articles : prev.articles,
          newAgents: data.newAgents?.length > 0 ? data.newAgents : prev.newAgents,
          topAgents: data.topAgents?.length > 0 ? data.topAgents : prev.topAgents
        }));
      }
    } catch (e) {
      console.warn('Marketplace fetch error:', e);
    }
  };

  useEffect(() => {
    loadMarketplaceOverview();
    const unsubscribe = SupabaseDashboardService.subscribeToMarketplaceRealtime(() => {
      loadMarketplaceOverview();
    });
    return () => unsubscribe();
  }, []);

  // Filter Agents based on Category Pill & Search Query
  const filteredAgents = marketplaceData.agents.filter((agent: any) => {
    const matchesCategory = selectedCategoryPill === 'Semua' || agent.category_name === selectedCategoryPill;
    const matchesSearch = !searchQuery.trim() || agent.title.toLowerCase().includes(searchQuery.toLowerCase()) || agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Section with Top Right Shortcut Cards */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">AI Marketplace</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Temukan, instal, dan kelola AI Employee atau integrasi premium untuk mempercepat bisnis Anda.
          </p>
        </div>

        {/* Top 3 Action Shortcut Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:w-auto">
          <div 
            onClick={() => setIsRequestCustomAIModalOpen(true)}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 cursor-pointer shadow-xs transition-all space-y-1 group"
          >
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
              <div className="size-6 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center">
                <Settings size={14} />
              </div>
              <span>Request Custom AI</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">Buat AI sesuai kebutuhan bisnis Anda.</p>
          </div>

          <div 
            onClick={() => triggerToast('Menampilkan AI Terinstal')}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 cursor-pointer shadow-xs transition-all space-y-1 group"
          >
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
              <div className="size-6 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center">
                <UserCheck size={14} />
              </div>
              <span>AI Saya</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">Kelola AI yang sudah Anda instal.</p>
          </div>

          <div 
            onClick={() => triggerToast('Menampilkan Integrasi Aktif')}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 cursor-pointer shadow-xs transition-all space-y-1 group"
          >
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
              <div className="size-6 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center">
                <Layers size={14} />
              </div>
              <span>Integrasi Saya</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">Kelola semua integrasi dan koneksi.</p>
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters Row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Search Bar */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari AI atau solusi (contoh: WhatsApp, Invoice, CRM...)" 
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 shadow-xs"
            />
          </div>

          {/* Category Dropdown */}
          <select 
            value={selectedCategoryPill}
            onChange={(e) => setSelectedCategoryPill(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shadow-xs w-full sm:w-auto"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Finance">Finance</option>
            <option value="Store & Operations">Store & Operations</option>
            <option value="Productivity">Productivity</option>
            <option value="Analytics">Analytics</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        {/* Category Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 text-xs font-extrabold">
          {['Semua', 'Sales', 'Marketing', 'Customer Service', 'Finance', 'Store & Operations', 'Productivity', 'Analytics', 'Lainnya'].map((pill) => (
            <button
              key={pill}
              onClick={() => setSelectedCategoryPill(pill)}
              className={`px-3.5 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                selectedCategoryPill === pill
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Grid Layout (Left Content + Right Sidebar) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Center Column (lg:col-span-9) */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Section 1: AI Employees Populer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">AI Employees Populer</h2>
              <button 
                onClick={() => triggerToast('Menampilkan semua AI Employees')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Grid of AI Employee Cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAgents.map((agent: any) => {
                const logoElement = BrandLogos[agent.icon_key] || (
                  <div className="size-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                );

                return (
                  <div 
                    key={agent.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Logo + Title + Popular Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                            {logoElement}
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                              {agent.title}
                            </h3>
                            {agent.badge_label && (
                              <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                                ✦ {agent.badge_label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {agent.description}
                      </p>
                    </div>

                    {/* Rating + Installs + Price + Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star size={11} fill="currentColor" /> {agent.rating_score} ({agent.rating_reviews_count})
                          </span>
                          <span>•</span>
                          <span>Instalasi {agent.installs_count_label}</span>
                        </div>
                        <div className="mt-0.5">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                            Rp{Number(agent.price_idr).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">{agent.billing_unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedAgentForDetail(agent)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          Lihat Detail →
                        </button>
                        <button 
                          onClick={() => setSelectedAgentForDetail(agent)}
                          className={`py-1.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            agent.is_installed 
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' 
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white hover:border-orange-500'
                          }`}
                        >
                          {agent.is_installed ? 'Terinstal' : 'Install'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Integrasi Pembayaran */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Integrasi Pembayaran</h2>
              <button 
                onClick={() => triggerToast('Menampilkan semua integrasi pembayaran')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua Integrasi</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Grid of Payment Integration Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {marketplaceData.payments.map((pay: any) => {
                const logoElement = BrandLogos[pay.icon_key] || (
                  <div className="size-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    💳
                  </div>
                );

                return (
                  <div 
                    key={pay.id} 
                    className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="size-9 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                          {logoElement}
                        </div>
                        {pay.badge_label && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[9px] font-extrabold">
                            {pay.badge_label}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors line-clamp-1">
                          {pay.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                          {pay.description}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedPaymentForConnect(pay)}
                      className={`mt-3 w-full py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-colors ${
                        pay.is_connected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pay.is_connected ? 'Terhubung' : 'Hubungkan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Bottom 4 Column Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1: Artikel & Panduan Terbaru */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Artikel & Panduan Terbaru</h4>
                <div className="space-y-2 text-xs font-semibold">
                  {marketplaceData.articles.map((art: any, i: number) => (
                    <div key={i} className="space-y-0.5 border-b border-slate-100 dark:border-slate-800 pb-1.5 last:border-0">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:text-orange-500 cursor-pointer line-clamp-1">
                        {art.title}
                      </h5>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-bold">{art.category_name}</span>
                        <span>{art.views_count} views • {art.time_ago}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => triggerToast('Membuka Panduan Artikel Marketplace')} className="text-left text-[11px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer pt-1">
                Lihat Semua Artikel →
              </button>
            </div>

            {/* Card 2: AI Terbaru */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">AI Terbaru</h4>
                <div className="space-y-2 text-xs font-semibold">
                  {marketplaceData.newAgents.map((ag: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-slate-300 font-bold line-clamp-1">{ag.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-extrabold flex-shrink-0">{ag.badge_label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => triggerToast('Menampilkan AI Terbaru')} className="text-left text-[11px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer pt-1">
                Lihat Semua AI →
              </button>
            </div>

            {/* Card 3: Paling Banyak Digunakan */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Paling Banyak Digunakan</h4>
                <div className="space-y-2 text-xs font-semibold">
                  {marketplaceData.topAgents.map((top: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="size-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center text-slate-500">{top.rank_order || i + 1}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold truncate">{top.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{top.installs_count_label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => triggerToast('Menampilkan AI Terpopuler')} className="text-left text-[11px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer pt-1">
                Lihat Semua →
              </button>
            </div>

            {/* Card 4: Keamanan & Kepercayaan */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
              <div className="space-y-2.5">
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Keamanan & Kepercayaan</h4>
                <div className="space-y-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Semua AI diverifikasi & aman</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Data bisnis 100% terlindungi</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Dukungan 24/7 tim ZEGA AI</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Refund 7 hari jika tidak sesuai</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 text-emerald-700 dark:text-emerald-400 text-center text-[10px] font-extrabold flex items-center justify-center gap-1">
                <ShieldCheck size={14} /> <span>100% Aman & Terpercaya</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Column (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Card 1: AI Recommendation (Purple Card) */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white space-y-4 shadow-md relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 size-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Sparkles size={16} className="text-purple-200" /> <span>AI Recommendation</span>
                </div>
              </div>
              <span className="text-[10px] text-purple-200 block font-medium">Berdasarkan aktivitas bisnis Anda</span>
              <p className="text-xs font-medium leading-relaxed pt-1 text-purple-100">
                Pelanggan sering menanyakan tentang retur, ongkir, dan pembayaran. AI menyarankan membuat FAQ otomatis untuk meningkatkan layanan.
              </p>
            </div>
            <button 
              onClick={() => triggerToast('⚡ FAQ Otomatis berhasil digenerate oleh AI Agent!')}
              className="w-full py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Zap size={14} /> <span>Generate FAQ Sekarang</span>
            </button>
          </div>

          {/* Card 2: Kategori Populer */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Kategori Populer</h3>
            <div className="space-y-1.5 text-xs font-semibold">
              {marketplaceData.categories.map((cat: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedCategoryPill(cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedCategoryPill === cat.name
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-orange-500" />
                    <span>{cat.name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{cat.count}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => triggerToast('Menampilkan semua kategori')}
              className="w-full text-center text-[11px] font-extrabold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer"
            >
              Lihat Semua Kategori →
            </button>
          </div>

          {/* Card 3: Butuh Custom AI? */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs">
            <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Butuh Custom AI?</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Kami dapat membuat AI Employee khusus kebutuhan bisnis Anda.
            </p>
            <button 
              onClick={() => setIsRequestCustomAIModalOpen(true)}
              className="w-full py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer shadow-xs transition-all"
            >
              Request Custom AI
            </button>
          </div>

          {/* Card 4: Bantuan Marketplace */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Bantuan Marketplace</h4>
            <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button onClick={() => setIsHelpModalOpen(true)} className="w-full text-left flex items-center gap-2 hover:text-orange-500 cursor-pointer">
                <HelpCircle size={14} className="text-slate-400" /> <span>Cara Install AI</span>
              </button>
              <button onClick={() => setIsHelpModalOpen(true)} className="w-full text-left flex items-center gap-2 hover:text-orange-500 cursor-pointer">
                <HelpCircle size={14} className="text-slate-400" /> <span>Pembayaran & Langganan</span>
              </button>
              <button onClick={() => setIsHelpModalOpen(true)} className="w-full text-left flex items-center gap-2 hover:text-orange-500 cursor-pointer">
                <HelpCircle size={14} className="text-slate-400" /> <span>Kebijakan Marketplace</span>
              </button>
              <button onClick={() => setIsHelpModalOpen(true)} className="w-full text-left flex items-center gap-2 hover:text-orange-500 cursor-pointer">
                <HelpCircle size={14} className="text-slate-400" /> <span>Hubungi Support</span>
              </button>
            </div>
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="text-[11px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer pt-1 block"
            >
              Pusat Bantuan →
            </button>
          </div>

        </div>

      </div>

      {/* Dialog Modals */}
      {selectedAgentForDetail && (
        <AIAgentDetailModal
          isOpen={true}
          onClose={() => setSelectedAgentForDetail(null)}
          agent={selectedAgentForDetail}
          triggerToast={triggerToast}
          onRefresh={loadMarketplaceOverview}
        />
      )}

      {selectedPaymentForConnect && (
        <ConnectPaymentModal
          isOpen={true}
          onClose={() => setSelectedPaymentForConnect(null)}
          payment={selectedPaymentForConnect}
          triggerToast={triggerToast}
          onRefresh={loadMarketplaceOverview}
        />
      )}

      <RequestCustomAIModal
        isOpen={isRequestCustomAIModalOpen}
        onClose={() => setIsRequestCustomAIModalOpen(false)}
        triggerToast={triggerToast}
      />

      <MarketplaceHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        triggerToast={triggerToast}
      />
    </div>
  );
}
