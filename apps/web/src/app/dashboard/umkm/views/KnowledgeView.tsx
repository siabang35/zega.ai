import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Sparkles, FileText, Send, HelpCircle, BookOpen, 
  Download, Filter, ChevronDown, LayoutList, LayoutGrid, Star, 
  Bookmark, MoreHorizontal, ArrowRight, Check, Eye, Clock, ShieldCheck
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { 
  NewArticleModal, UploadDocumentModal, AskAIKnowledgeModal, KnowledgeItemDetailModal 
} from './knowledge/KnowledgeModals';

interface KnowledgeViewProps {
  triggerToast: (msg: string) => void;
}

export function KnowledgeView({ triggerToast }: KnowledgeViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAssistantQuery, setAiAssistantQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals state
  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isAskAIModalOpen, setIsAskAIModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);

  // Consolidated Knowledge Data State
  const [knowledgeData, setKnowledgeData] = useState<any>({
    metrics: {
      articles_count: 128,
      articles_growth_pct: 18.00,
      documents_count: 54,
      documents_growth_pct: 12.00,
      templates_count: 39,
      templates_growth_pct: 15.00,
      ai_confidence_pct: 97.00,
      ai_confidence_level: 'Tinggi',
      last_updated_label: '2 jam lalu'
    },
    categories: [
      { name: 'Semua Kategori', count: 128 },
      { name: 'Produk', count: 18 },
      { name: 'Prosedur Operasional', count: 22 },
      { name: 'Sales', count: 14 },
      { name: 'Marketing', count: 12 },
      { name: 'Finance', count: 9 },
      { name: 'Customer Service', count: 10 },
      { name: 'Shipping & Logistik', count: 8 },
      { name: 'FAQ', count: 15 },
      { name: 'Invoice', count: 7 }
    ],
    items: [
      {
        id: 'k1',
        title: 'Cara Membuat Invoice Otomatis',
        description: 'Panduan lengkap membuat invoice otomatis untuk semua pesanan.',
        category_name: 'Invoice',
        badge_label: 'Prosedur',
        badge_type: 'prosedur',
        status: 'Published',
        author_name: 'Cik Berliuk',
        author_role: 'UMKM Owner',
        author_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        views_count: 532,
        rating_score: 4.9,
        rating_count: 24,
        is_bookmarked: false,
        updated_time_ago: 'Diperbarui 2 jam lalu'
      },
      {
        id: 'k2',
        title: 'Kebijakan Pengembalian Barang',
        description: 'Aturan dan kebijakan retur produk untuk pelanggan.',
        category_name: 'Prosedur Operasional',
        badge_label: 'Prosedur',
        badge_type: 'prosedur',
        status: 'Published',
        author_name: 'Admin',
        author_role: 'Operations',
        author_avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        views_count: 421,
        rating_score: 4.8,
        rating_count: 16,
        is_bookmarked: false,
        updated_time_ago: 'Diperbarui 4 jam lalu'
      },
      {
        id: 'k3',
        title: 'FAQ - Pengiriman & Ongkir',
        description: 'Pertanyaan umum mengenai pengiriman dan ongkos kirim.',
        category_name: 'FAQ',
        badge_label: 'FAQ',
        badge_type: 'faq',
        status: 'Published',
        author_name: 'Cik Berliuk',
        author_role: 'UMKM Owner',
        author_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        views_count: 389,
        rating_score: 4.7,
        rating_count: 12,
        is_bookmarked: true,
        updated_time_ago: 'Diperbarui 6 jam lalu'
      },
      {
        id: 'k4',
        title: 'Panduan Packing Produk',
        description: 'Cara packing produk agar aman dan rapi sebelum dikirim.',
        category_name: 'Shipping & Logistik',
        badge_label: 'Prosedur',
        badge_type: 'prosedur',
        status: 'Published',
        author_name: 'Warehouse Team',
        author_role: 'Logistics',
        author_avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        views_count: 312,
        rating_score: 4.9,
        rating_count: 16,
        is_bookmarked: false,
        updated_time_ago: 'Diperbarui 1 hari lalu'
      },
      {
        id: 'k5',
        title: 'Strategi Promosi di WhatsApp',
        description: 'Tips & strategi promosi efektif melalui WhatsApp Business.',
        category_name: 'Marketing',
        badge_label: 'Marketing',
        badge_type: 'marketing',
        status: 'Draft',
        author_name: 'Marketing Team',
        author_role: 'Marketing',
        author_avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        views_count: 298,
        rating_score: 4.6,
        rating_count: 10,
        is_bookmarked: false,
        updated_time_ago: 'Diperbarui 1 hari lalu'
      },
      {
        id: 'k6',
        title: 'Template Pesan Balasan Cepat',
        description: 'Kumpulan template pesan cepat untuk CS & admin.',
        category_name: 'Sales',
        badge_label: 'Sales',
        badge_type: 'sales',
        status: 'Published',
        author_name: 'CS Team',
        author_role: 'Support',
        author_avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        views_count: 276,
        rating_score: 4.8,
        rating_count: 20,
        is_bookmarked: false,
        updated_time_ago: 'Diperbarui 2 hari lalu'
      }
    ],
    healthScore: {
      health_score_pct: 92,
      health_label: 'Sangat Baik',
      missing_sop_count: 4,
      outdated_docs_count: 2,
      broken_links_count: 0,
      duplicate_count: 1
    },
    documents: [
      { id: 'd1', file_name: 'SOP-Operasional.pdf', file_type: 'pdf', file_size_label: '2.4 MB', file_url: '#' },
      { id: 'd2', file_name: 'Daftar-Supplier.xlsx', file_type: 'xlsx', file_size_label: '1.1 MB', file_url: '#' },
      { id: 'd3', file_name: 'Template-Invoice.docx', file_type: 'docx', file_size_label: '480 KB', file_url: '#' },
      { id: 'd4', file_name: 'Product-Photo.jpg', file_type: 'jpg', file_size_label: '1.2 MB', file_url: '#' }
    ],
    popularArticles: [
      { title: 'Cara Membuat Invoice Otomatis', views_count: 532 },
      { title: 'Kebijakan Pengembalian Barang', views_count: 421 },
      { title: 'FAQ - Pengiriman & Ongkir', views_count: 389 }
    ],
    templates: [
      { title: 'Invoice Template', templates_count: 24 },
      { title: 'WhatsApp Reply', templates_count: 18 },
      { title: 'Packing Checklist', templates_count: 16 }
    ],
    prompts: [
      { title: 'Sales Prompt', prompts_count: 12 },
      { title: 'Marketing Prompt', prompts_count: 15 },
      { title: 'Customer Prompt', prompts_count: 10 }
    ]
  });

  // Fetch Consolidated Knowledge Overview from Supabase
  const loadKnowledgeOverview = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmKnowledgeOverview();
      if (data) {
        setKnowledgeData((prev: any) => ({
          ...prev,
          metrics: data.metrics || prev.metrics,
          categories: data.categories?.length > 0 ? data.categories : prev.categories,
          items: data.items?.length > 0 ? data.items : prev.items,
          healthScore: data.healthScore || prev.healthScore,
          documents: data.documents?.length > 0 ? data.documents : prev.documents,
          popularArticles: data.popularArticles?.length > 0 ? data.popularArticles : prev.popularArticles,
          templates: data.templates?.length > 0 ? data.templates : prev.templates,
          prompts: data.prompts?.length > 0 ? data.prompts : prev.prompts
        }));
      }
    } catch (e) {
      console.warn('Knowledge overview fetch error:', e);
    }
  };

  useEffect(() => {
    loadKnowledgeOverview();
    const unsubscribe = SupabaseDashboardService.subscribeToKnowledgeRealtime(() => {
      loadKnowledgeOverview();
    });
    return () => unsubscribe();
  }, []);

  // Filter Knowledge Items
  const filteredItems = knowledgeData.items.filter((item: any) => {
    const matchesCategory = selectedCategory === 'Semua Kategori' || item.category_name === selectedCategory;
    const matchesTab = activeTab === 'Semua' 
      || (activeTab === 'Artikel' && item.badge_type === 'prosedur')
      || (activeTab === 'Dokumen' && item.badge_type === 'document')
      || (activeTab === 'Template' && item.badge_type === 'template')
      || (activeTab === 'FAQ' && item.badge_type === 'faq')
      || (activeTab === 'AI Prompt' && item.badge_type === 'prompt')
      || (activeTab === 'Favorit' && item.is_bookmarked);
    const matchesSearch = !searchQuery.trim() || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesTab && matchesSearch;
  });

  const toggleBookmark = (id: string) => {
    setKnowledgeData((prev: any) => ({
      ...prev,
      items: prev.items.map((it: any) => it.id === id ? { ...it, is_bookmarked: !it.is_bookmarked } : it)
    }));
    triggerToast('✓ Status Bookmark diperbarui');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Knowledge Hub</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Semua pengetahuan bisnis Anda. Temukan, kelola, dan tingkatkan dengan AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* + New Article Action */}
          <button 
            onClick={() => setIsNewArticleModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus size={16} /> <span>New Article</span>
          </button>

          {/* Upload Document Action */}
          <button 
            onClick={() => setIsUploadDocModalOpen(true)}
            className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <FileText size={14} /> <span>Upload Document</span>
          </button>

          {/* Ask AI Action */}
          <button 
            onClick={() => setIsAskAIModalOpen(true)}
            className="px-4 py-2 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/40 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles size={14} className="text-purple-500" /> <span>Ask AI</span>
          </button>

          {/* Options Dropdown */}
          <button 
            onClick={() => triggerToast('Pengaturan Akses Pengetahuan')}
            className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 cursor-pointer shadow-xs"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* 2. Top 5 Metric KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Card 1: Articles */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Articles</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-black">
              <BookOpen size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {knowledgeData.metrics.articles_count}
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              ↑ {knowledgeData.metrics.articles_growth_pct}% this month
            </span>
          </div>
        </div>

        {/* Card 2: Documents */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-orange-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Documents</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black">
              <FileText size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {knowledgeData.metrics.documents_count}
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              ↑ {knowledgeData.metrics.documents_growth_pct}% this month
            </span>
          </div>
        </div>

        {/* Card 3: Templates */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-pink-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Templates</span>
            <div className="size-8 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/60 flex items-center justify-center font-black">
              <LayoutList size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {knowledgeData.metrics.templates_count}
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              ↑ {knowledgeData.metrics.templates_growth_pct}% this month
            </span>
          </div>
        </div>

        {/* Card 4: AI Confidence */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>AI Confidence</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center font-black">
              <Sparkles size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {knowledgeData.metrics.ai_confidence_pct}%
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              {knowledgeData.metrics.ai_confidence_level}
            </span>
          </div>
        </div>

        {/* Card 5: Last Updated */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs col-span-2 md:col-span-1 hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Last Updated</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-black">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {knowledgeData.metrics.last_updated_label}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              16 Jul 2026, 10:24
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & View Controllers Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-5 text-xs font-bold overflow-x-auto no-scrollbar">
          {['Semua', 'Artikel', 'Dokumen', 'Template', 'FAQ', 'AI Prompt', 'Favorit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-1 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Controllers */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SOP, invoice, retur..." 
              className="pl-8 pr-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-48 focus:outline-none focus:border-orange-500"
            />
          </div>

          <button 
            onClick={() => triggerToast(`Filter Aktif: ${activeTab} (${selectedCategory})`)}
            className="px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Filter size={14} /> <span>Filter</span>
          </button>

          <select className="px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer">
            <option value="terbaru">Terbaru</option>
            <option value="terpopuler">Terpopuler</option>
            <option value="rating">Rating Tertinggi</option>
          </select>

          {/* List/Grid View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-lg cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400'}`}
            >
              <LayoutList size={14} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-lg cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400'}`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Grid Layout (Categories + Main List + AI Assistant Right Sidebar) */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left Sidebar: Categories (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Categories</h3>
            <button onClick={() => triggerToast('Tambah Kategori Baru')} className="text-slate-400 hover:text-slate-600 font-black"><Plus size={14} /></button>
          </div>

          <div className="space-y-1 text-xs font-semibold">
            {knowledgeData.categories.map((cat: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl transition-all cursor-pointer ${
                  selectedCategory === cat.name
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold border border-orange-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{cat.count}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={() => triggerToast('Menampilkan semua kategori')}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Lihat semua kategori</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Center Column: Knowledge Items List (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="space-y-2.5">
            {filteredItems.map((item: any) => {
              const avatarSrc = (item.author_avatar_url && item.author_avatar_url.startsWith('http'))
                ? item.author_avatar_url
                : getR2CdnUrl(item.author_avatar_url || '', true);

              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedDetailItem(item)}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 uppercase">
                          {item.badge_label}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.status === 'Published' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'
                      }`}>
                        {item.status}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                        className={`p-1 rounded-lg cursor-pointer ${item.is_bookmarked ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <Bookmark size={14} fill={item.is_bookmarked ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={(e) => e.stopPropagation()} className="p-1 text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <img 
                        src={avatarSrc} 
                        alt={item.author_name}
                        className="size-5 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = generateInitialsAvatar(item.author_name);
                        }}
                      />
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">{item.author_name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.updated_time_ago}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Eye size={12} /> {item.views_count}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                        <Star size={12} fill="currentColor" /> {item.rating_score} ({item.rating_count})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2 text-xs font-extrabold text-slate-500">
            <div className="flex items-center gap-1">
              <button className="size-7 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 cursor-pointer">&lt;</button>
              <button className="size-7 rounded-xl bg-orange-500 text-white flex items-center justify-center cursor-pointer shadow-xs">1</button>
              <button className="size-7 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 cursor-pointer">2</button>
              <button className="size-7 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 cursor-pointer">3</button>
              <span className="px-1 text-slate-300">...</span>
              <button className="size-7 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 cursor-pointer">11</button>
              <button className="size-7 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 cursor-pointer">&gt;</button>
            </div>

            <select className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer">
              <option value="10">10 / halaman</option>
              <option value="25">25 / halaman</option>
              <option value="50">50 / halaman</option>
            </select>
          </div>
        </div>

        {/* Right Sidebar: AI Assistant, Health Gauge, Documents (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: AI Knowledge Assistant */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-slate-100">
                <Sparkles size={16} className="text-purple-500" />
                <span>AI Knowledge Assistant</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 uppercase">Beta</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Tanyakan apa saja tentang bisnis Anda.</p>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5 text-[10px] font-semibold">
              {[
                'Bagaimana cara membuat invoice otomatis?',
                'Apa kebijakan retur produk?',
                'Bagaimana alur pengiriman?',
                'Template pesan untuk customer baru?'
              ].map((chip, i) => (
                <button 
                  key={i} 
                  onClick={() => setAiAssistantQuery(chip)}
                  className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/40 cursor-pointer transition-all border border-slate-100 dark:border-slate-800/60"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Action */}
            <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <input 
                type="text"
                value={aiAssistantQuery}
                onChange={(e) => setAiAssistantQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiAssistantQuery.trim()) {
                    setIsAskAIModalOpen(true);
                  }
                }}
                placeholder="Ketik pertanyaan Anda..." 
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl focus:outline-none focus:border-orange-500 font-bold"
              />
              <button 
                onClick={() => setIsAskAIModalOpen(true)}
                className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl cursor-pointer shadow-xs"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Card 2: Knowledge Health Gauge */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Knowledge Health</h3>
              <button onClick={() => triggerToast('Lihat Detail Knowledge Health')} className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer">Lihat Detail →</button>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="relative size-20 flex-shrink-0">
                <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                  <path stroke="#e2e8f0" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path stroke="#10b981" strokeWidth="3.5" strokeDasharray="92, 100" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">92%</span>
                  <span className="text-[7px] font-bold text-emerald-600 uppercase">Sangat Baik</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500" /> Missing SOP</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{knowledgeData.healthScore.missing_sop_count}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" /> Outdated Docs</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{knowledgeData.healthScore.outdated_docs_count}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500" /> Broken Links</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{knowledgeData.healthScore.broken_links_count}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-purple-500" /> Duplicate</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{knowledgeData.healthScore.duplicate_count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Documents Center */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Documents Center</h3>
              <button onClick={() => setIsUploadDocModalOpen(true)} className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer">Lihat Semua →</button>
            </div>

            <div className="space-y-2 text-xs">
              {knowledgeData.documents.map((doc: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={16} className={
                      doc.file_type === 'pdf' ? 'text-red-500' :
                      doc.file_type === 'xlsx' ? 'text-emerald-500' :
                      doc.file_type === 'docx' ? 'text-blue-500' : 'text-purple-500'
                    } />
                    <div className="min-w-0">
                      <h4 className="font-black text-[11px] text-slate-900 dark:text-slate-100 truncate">{doc.file_name}</h4>
                      <span className="text-[9px] text-slate-400 font-mono">{doc.file_type.toUpperCase()} • {doc.file_size_label}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => triggerToast(`Downloading ${doc.file_name}...`)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Grid Row (5 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1: AI Recommendation */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-400">
              <Sparkles size={16} /> <span>AI Recommendation</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              Pelanggan sering bertanya tentang retur, ongkir, dan pembayaran. AI menyarankan membuat FAQ baru.
            </p>
          </div>
          <button 
            onClick={() => {
              triggerToast('⚡ FAQ Baru berhasil dibuat secara otomatis oleh ZEGA AI Agent!');
              loadKnowledgeOverview();
            }}
            className="w-full py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer shadow-xs transition-all"
          >
            Generate FAQ
          </button>
        </div>

        {/* Card 2: Popular Articles */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Popular Articles</h4>
            <div className="space-y-2 text-xs font-semibold">
              {knowledgeData.popularArticles.map((art: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300 truncate font-extrabold">{art.title}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{art.views_count} views</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Lihat Semua Artikel Populer')} className="text-left text-[11px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer pt-1">
            Lihat semua →
          </button>
        </div>

        {/* Card 3: Recently Updated */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Recently Updated</h4>
            <div className="space-y-2 text-xs font-semibold">
              {[
                { title: 'Invoice SOP', time: '2 jam lalu' },
                { title: 'Shipping Policy', time: '4 jam lalu' },
                { title: 'New Promotion SOP', time: '6 jam lalu' }
              ].map((rec, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{rec.title}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{rec.time}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Lihat Riwayat Pembaruan')} className="text-left text-[11px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer pt-1">
            Lihat semua →
          </button>
        </div>

        {/* Card 4: Templates Library */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Templates Library</h4>
            <div className="space-y-2 text-xs font-semibold">
              {knowledgeData.templates.map((tpl: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{tpl.title}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{tpl.templates_count} template</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Membuka Templates Library')} className="text-left text-[11px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer pt-1">
            Lihat semua →
          </button>
        </div>

        {/* Card 5: AI Prompt Library */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">AI Prompt Library</h4>
            <div className="space-y-2 text-xs font-semibold">
              {knowledgeData.prompts.map((prm: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{prm.title}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{prm.prompts_count} prompt</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Membuka AI Prompt Library')} className="text-left text-[11px] font-extrabold text-slate-400 hover:text-slate-600 cursor-pointer pt-1">
            Lihat semua →
          </button>
        </div>
      </div>

      {/* Action Modals */}
      <NewArticleModal
        isOpen={isNewArticleModalOpen}
        onClose={() => setIsNewArticleModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadKnowledgeOverview}
      />

      <UploadDocumentModal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadKnowledgeOverview}
      />

      <AskAIKnowledgeModal
        isOpen={isAskAIModalOpen}
        onClose={() => setIsAskAIModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadKnowledgeOverview}
      />

      {selectedDetailItem && (
        <KnowledgeItemDetailModal
          isOpen={true}
          onClose={() => setSelectedDetailItem(null)}
          item={selectedDetailItem}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
}
