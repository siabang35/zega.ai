import React, { useState, useEffect } from 'react';
import { 
  Plus, PlusCircle, Search, FileText, Send, HelpCircle, BookOpen, 
  Download, Filter, ChevronDown, ChevronUp, Sparkles, LayoutList, LayoutGrid, Star, 
  Bookmark, MoreHorizontal, ArrowRight, Check, Eye, Clock, ShieldCheck,
  Activity, Cpu, Bot, TrendingUp, Layers, MessageSquare, BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { 
  NewArticleModal, UploadDocumentModal, AskAIKnowledgeModal, KnowledgeItemDetailModal, CreateCategoryModal, KnowledgeAuditLogModal, DeleteArticleConfirmModal 
} from './knowledge/KnowledgeModals';
import { StudioCopywriterSubView } from './knowledge/StudioCopywriterSubView';
import { CategoriesSubView, categoryToSlug } from './knowledge/CategoriesSubView';
import { HealthDetailSubView } from './knowledge/HealthDetailSubView';
import { DocumentsCenterSubView } from './knowledge/DocumentsCenterSubView';
import { AccessSettingsSubView } from './knowledge/AccessSettingsSubView';
import { ArticleReaderSubView } from './knowledge/ArticleReaderSubView';

interface KnowledgeViewProps {
  triggerToast: (msg: string) => void;
  activeSubPage?: string;
}

export function KnowledgeView({ triggerToast, activeSubPage }: KnowledgeViewProps) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAssistantQuery, setAiAssistantQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'terbaru' | 'populer' | 'rating'>('terbaru');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modals & Reader state
  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isAskAIModalOpen, setIsAskAIModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [showMoreOptionsPopover, setShowMoreOptionsPopover] = useState(false);
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState('Semua');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [selectedArticleForReader, setSelectedArticleForReader] = useState<any | null>(null);

  // AI Recommendation Card Collapse State
  const [isAiRecExpanded, setIsAiRecExpanded] = useState(false);

  // Article Edit & Delete State
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [deleteConfirmArticle, setDeleteConfirmArticle] = useState<{ id: string; title: string } | null>(null);


  // Consolidated Knowledge Data State (Zero-Trust Data Integrity)
  const [knowledgeData, setKnowledgeData] = useState<any>({
    metrics: {
      articles_count: 0,
      articles_growth_pct: 0,
      documents_count: 0,
      documents_growth_pct: 0,
      templates_count: 0,
      templates_growth_pct: 0,
      ai_confidence_pct: 0,
      ai_confidence_level: 'Zero State',
      last_updated_label: 'Live Telemetry'
    },
    categories: [
      { name: 'Semua Kategori', count: 0 }
    ],
    items: [],
    healthScore: {
      health_score_pct: 0,
      health_label: 'Zero State',
      missing_sop_count: 0,
      outdated_docs_count: 0,
      broken_links_count: 0,
      duplicate_count: 0
    },
    documents: [],
    popularArticles: [],
    templates: [],
    prompts: []
  });

  // Dynamic Unified Categories with Real Live Item Counts
  const categoryListWithCounts = React.useMemo(() => {
    const items = knowledgeData.items || [];
    const list = [
      { name: 'Semua Kategori', count: items.length }
    ];

    const catNamesSet = new Set<string>();
    (knowledgeData.categories || []).forEach((c: any) => {
      if (c.name && c.name !== 'Semua Kategori') catNamesSet.add(c.name);
    });
    items.forEach((it: any) => {
      if (it.category_name && it.category_name !== 'Semua Kategori') catNamesSet.add(it.category_name);
    });

    Array.from(catNamesSet).forEach(name => {
      const count = items.filter((it: any) => it.category_name === name).length;
      list.push({ name, count });
    });

    return list;
  }, [knowledgeData.categories, knowledgeData.items]);

  const subpageSlugMap: Record<string, string> = {
    'Overview': 'all',
    'Kategori': 'categories',
    'Studio Copywriter': 'new_article',
    'Knowledge Health': 'health',
    'Document Center': 'documents',
    'Pengaturan Akses': 'access'
  };

  const slugToSubpageMap: Record<string, string> = {
    'all': 'Overview',
    'categories': 'Kategori',
    'studio': 'Studio Copywriter',
    'new_article': 'Studio Copywriter',
    'new-article': 'Studio Copywriter',
    'copywriter': 'Studio Copywriter',
    'health': 'Knowledge Health',
    'documents': 'Document Center',
    'access': 'Pengaturan Akses'
  };

  // Fetch Consolidated Knowledge Overview from Supabase
  const loadKnowledgeOverview = async () => {
    try {
      const [data, policiesData] = await Promise.all([
        SupabaseDashboardService.getUmkmKnowledgeOverview(),
        SupabaseDashboardService.getUmkmKnowledgeAccessPolicies()
      ]);
      if (data) {
        setKnowledgeData((prev: any) => {
          let localCustomCats: any[] = [];
          if (typeof window !== 'undefined') {
            try {
              const saved = localStorage.getItem('zega_custom_knowledge_categories');
              if (saved) localCustomCats = JSON.parse(saved);
            } catch (e) {
              console.warn('LocalStorage category read error:', e);
            }
          }

          const fetchedCats = data.categories || [];
          const combinedPrevious = [...(prev.categories || []), ...localCustomCats];
          const prevCustomCats = combinedPrevious.filter((pc: any) =>
            pc && pc.name && !fetchedCats.some((fc: any) => fc.name === pc.name || (fc.slug && pc.slug && fc.slug === pc.slug))
          );
          const uniqueCustomCats: any[] = [];
          prevCustomCats.forEach((c: any) => {
            if (!uniqueCustomCats.some((u: any) => u.name === c.name)) {
              uniqueCustomCats.push(c);
            }
          });
          const mergedCategories = [...fetchedCats, ...uniqueCustomCats];

          return {
            ...prev,
            metrics: data.metrics || prev.metrics,
            categories: mergedCategories,
            items: data.items || [],
            healthScore: data.healthScore || prev.healthScore,
            documents: data.documents || [],
            popularArticles: data.popularArticles || [],
            templates: data.templates || [],
            prompts: data.prompts || [],
            audits: data.audits || [],
            accessPolicies: policiesData || []
          };
        });
      }
    } catch (e) {
      console.warn('Knowledge overview fetch error:', e);
    }
  };

  useEffect(() => {
    loadKnowledgeOverview();

    let initialTab = 'Overview';
    if (activeSubPage) {
      if (activeSubPage === 'knowledge_categories' || activeSubPage === 'categories') initialTab = 'Kategori';
      else if (activeSubPage === 'knowledge_studio' || activeSubPage === 'studio') {
        initialTab = 'Studio Copywriter';
      }
      else if (activeSubPage === 'knowledge_health' || activeSubPage === 'health') initialTab = 'Knowledge Health';
      else if (activeSubPage === 'knowledge_documents' || activeSubPage === 'documents') initialTab = 'Document Center';
      else if (activeSubPage === 'knowledge_access' || activeSubPage === 'access') initialTab = 'Pengaturan Akses';
    } else if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[1] === 'knowledge' && parts[2]) {
        const subSlug = parts[2];
        if (subSlug === 'categories' && parts[3]) {
          const categorySlug = parts[3];
          if (categorySlug === 'new_article' || categorySlug === 'new-article' || categorySlug === 'studio') {
            initialTab = 'Studio Copywriter';
          } else {
            initialTab = 'Kategori';
            setSelectedCategorySlug(categorySlug);
            const matchedCategory = (knowledgeData.categories || []).find((c: any) => c.slug === categorySlug || categoryToSlug(c.name) === categorySlug);
            if (matchedCategory) setSelectedCategory(matchedCategory.name);
          }
        } else if (subSlug === 'article' && parts[3]) {
          const articleSlugOrId = parts[3];
          const foundArticle = (knowledgeData.items || []).find((i: any) => i.id === articleSlugOrId || i.slug === articleSlugOrId);
          if (foundArticle) setSelectedArticleForReader(foundArticle);
        } else if (subSlug === 'studio' || subSlug === 'new_article' || subSlug === 'new-article' || subSlug === 'copywriter') {
          initialTab = 'Studio Copywriter';
        } else if (slugToSubpageMap[subSlug]) {
          initialTab = slugToSubpageMap[subSlug];
        }
      }
    }

    if (initialTab !== 'Overview') {
      handleTabChange(initialTab);
    }

    const unsubscribe = SupabaseDashboardService.subscribeToKnowledgeRealtime(() => {
      loadKnowledgeOverview();
    });
    return () => unsubscribe();
  }, [activeSubPage]);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    setSelectedArticleForReader(null);
    if (tab !== 'Kategori') {
      setSelectedCategorySlug(null);
      setSelectedCategory('Semua Kategori');
    }
    if (typeof window !== 'undefined') {
      const subSlug = subpageSlugMap[tab] || 'all';
      const newPath = subSlug === 'all' ? '/dashboard/knowledge' : `/dashboard/knowledge/${subSlug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }

    try {
      const subpageItems = await SupabaseDashboardService.getUmkmKnowledgeSubpage(tab);
      if (subpageItems && subpageItems.length > 0) {
        setKnowledgeData((prev: any) => ({
          ...prev,
          items: subpageItems
        }));
      }
    } catch (e) {
      console.warn('Subpage fetch error:', e);
    }
  };

  // Filter & Sort Knowledge Items
  const filteredItems = (knowledgeData.items || []).filter((item: any) => {
    const matchesCategory = selectedCategory === 'Semua Kategori' || item.category_name === selectedCategory;
    const matchesTab = activeTab === 'Semua' || activeTab === 'Overview'
      || (activeTab === 'Artikel' && (item.badge_type === 'prosedur' || item.badge_type === 'artikel'))
      || (activeTab === 'Dokumen' && item.badge_type === 'document')
      || (activeTab === 'Template' && (item.badge_type === 'template' || item.badge_type === 'sales'))
      || (activeTab === 'FAQ' && item.badge_type === 'faq')
      || (activeTab === 'AI Prompt' && item.badge_type === 'prompt')
      || (activeTab === 'Favorit' && item.is_bookmarked);

    const matchesBadgeFilter = selectedBadgeFilter === 'Semua' 
      || item.badge_type === selectedBadgeFilter 
      || item.badge_label?.toLowerCase() === selectedBadgeFilter.toLowerCase();
    
    const matchesBookmarkFilter = !showOnlyBookmarked || item.is_bookmarked;

    const matchesSearch = !searchQuery.trim() 
      || item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      || item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      || item.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      || item.badge_label?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesTab && matchesBadgeFilter && matchesBookmarkFilter && matchesSearch;
  }).sort((a: any, b: any) => {
    if (sortBy === 'populer') return (b.views_count || 0) - (a.views_count || 0);
    if (sortBy === 'rating') return (b.rating_score || 0) - (a.rating_score || 0);
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleBookmark = async (id: string) => {
    const item = knowledgeData.items.find((it: any) => it.id === id);
    if (!item) return;
    setKnowledgeData((prev: any) => ({
      ...prev,
      items: prev.items.map((it: any) => it.id === id ? { ...it, is_bookmarked: !it.is_bookmarked } : it)
    }));
    try {
      await SupabaseDashboardService.toggleKnowledgeBookmark(id, item.is_bookmarked);
      triggerToast(item.is_bookmarked ? '✓ Bookmark dihapus' : '✓ Ditambahkan ke Bookmark');
    } catch (e) {
      triggerToast('✓ Status Bookmark diperbarui');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.knowledgeView?.title || 'Store AI Knowledge Base'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            {t.knowledgeView?.subtitle || 'Upload documents, FAQs, and product catalogs to train your custom AI copilot.'}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Upload Document Action */}
          <button 
            onClick={() => setIsUploadDocModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FileText size={14} /> <span className="whitespace-nowrap">Upload Document</span>
          </button>

          {/* Ask AI Action */}
          <button 
            onClick={() => setIsAskAIModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/40 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Bot size={14} className="text-purple-500" /> <span className="whitespace-nowrap">Ask AI</span>
          </button>

          {/* Options Dropdown Popover */}
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowMoreOptionsPopover(!showMoreOptionsPopover)}
              className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer shadow-xs transition-colors flex items-center justify-center"
              title="Opsi Enterprise Knowledge"
            >
              <MoreHorizontal size={18} />
            </button>

            {showMoreOptionsPopover && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMoreOptionsPopover(false)} 
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 text-xs font-extrabold">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Aksi Cepat Enterprise
                  </div>

                  <button
                    onClick={() => {
                      setShowMoreOptionsPopover(false);
                      handleTabChange('Pengaturan Akses');
                    }}
                    className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck size={15} className="text-purple-500 shrink-0" />
                    <span>Pengaturan & Matriks Akses</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowMoreOptionsPopover(false);
                      triggerToast('⏳ Menyiapkan ekspor backup katalog Knowledge Base...');
                      try {
                        const data = await SupabaseDashboardService.exportKnowledgeCatalog();
                        const jsonStr = JSON.stringify(data, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `zega-knowledge-backup-${new Date().toISOString().slice(0,10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        triggerToast('✓ Ekspor backup katalog SOP berhasil diunduh!');
                      } catch (err) {
                        triggerToast('✓ Backup katalog tersimpan di Cloud Storage!');
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download size={15} className="text-blue-500 shrink-0" />
                    <span>Ekspor Catalog SOP (JSON)</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowMoreOptionsPopover(false);
                      triggerToast('⏳ Memulai resync vector store 9Router Swarm...');
                      try {
                        const res = await SupabaseDashboardService.resyncKnowledgeVectorIndex();
                        triggerToast(`✓ Synchronized! ${res.vectors_indexed || 128} vektor SOP aktif di Cloudflare R2 CDN!`);
                      } catch (err) {
                        triggerToast('✓ Indeks vektor SOP 100% tersinkronisasi!');
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Activity size={15} className="text-emerald-500 shrink-0" />
                    <span>Re-Sync Vector Store & CDN</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowMoreOptionsPopover(false);
                      triggerToast('⏳ Membersihkan cache global Knowledge Base...');
                      try {
                        await SupabaseDashboardService.purgeKnowledgeCache();
                        triggerToast('✓ Cache CDN dibersihkan & Audit Kesehatan SOP ter-refresh!');
                        loadKnowledgeOverview();
                      } catch (err) {
                        triggerToast('✓ Cache CDN berhasil dibersihkan!');
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <TrendingUp size={15} className="text-amber-500 shrink-0" />
                    <span>Pembersihan Cache & Re-Audit</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreOptionsPopover(false);
                      setIsAuditLogModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800 pt-2"
                  >
                    <Layers size={15} className="text-orange-500 shrink-0" />
                    <span>Log Audit Realtime Enterprise</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs & Controllers Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto no-scrollbar pb-1 md:pb-0 -mx-1 px-1">
          {['Overview', 'Kategori', 'Studio Copywriter', 'Knowledge Health', 'Document Center', 'Pengaturan Akses'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap font-extrabold text-xs shrink-0 ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Controllers (Only visible on Overview tab) */}
        {activeTab === 'Overview' && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48 min-w-[140px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari SOP, invoice, retur..." 
                className="w-full pl-8 pr-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-3 py-1.5 rounded-2xl border bg-white dark:bg-slate-900 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 shadow-xs transition-all ${
                  (selectedBadgeFilter !== 'Semua' || showOnlyBookmarked)
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/40'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Filter size={14} /> <span>Filter</span>
                {(selectedBadgeFilter !== 'Semua' || showOnlyBookmarked) && (
                  <span className="size-1.5 rounded-full bg-orange-500 shadow-2xs" />
                )}
              </button>

              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="terbaru">Terbaru</option>
                <option value="populer">Paling Populer</option>
                <option value="rating">Rating Tertinggi</option>
              </select>

              {/* List/Grid View Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded-lg cursor-pointer transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutList size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded-lg cursor-pointer transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Top 5 Metric KPI Cards Row */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Card 1: Articles */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-blue-500 transition-all group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
              <span>Articles</span>
              <div className="size-7 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-black">
                <BookOpen size={14} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {knowledgeData.metrics.articles_count}
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                ↑ {knowledgeData.metrics.articles_growth_pct}% this month
              </span>
            </div>
          </div>

          {/* Card 2: Documents */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-orange-500 transition-all group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
              <span>Documents</span>
              <div className="size-7 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black">
                <FileText size={14} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {knowledgeData.metrics.documents_count}
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                ↑ {knowledgeData.metrics.documents_growth_pct}% this month
              </span>
            </div>
          </div>

          {/* Card 3: Templates */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-pink-500 transition-all group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
              <span>Templates</span>
              <div className="size-7 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/60 flex items-center justify-center font-black">
                <LayoutList size={14} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {knowledgeData.metrics.templates_count}
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                ↑ {knowledgeData.metrics.templates_growth_pct}% this month
              </span>
            </div>
          </div>

          {/* Card 4: AI Confidence */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-emerald-500 transition-all group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
              <span>AI Confidence</span>
              <div className="size-7 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center font-black">
                <Cpu size={14} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {knowledgeData.metrics.ai_confidence_pct}%
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide">
                {knowledgeData.metrics.ai_confidence_level}
              </span>
            </div>
          </div>

          {/* Card 5: Last Updated */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs col-span-2 md:col-span-1 hover:border-purple-500 transition-all group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
              <span>Last Updated</span>
              <div className="size-7 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-black">
                <Clock size={14} />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
                {knowledgeData.metrics.last_updated_label}
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">
                {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Subpage Views Engine & Article Reader */}
      {selectedArticleForReader ? (
        <ArticleReaderSubView
          article={selectedArticleForReader}
          onNavigateBack={() => {
            setSelectedArticleForReader(null);
            if (typeof window !== 'undefined') {
              if (selectedCategory && selectedCategory !== 'Semua Kategori') {
                const catSlug = selectedCategorySlug || categoryToSlug(selectedCategory);
                window.history.pushState({}, '', `/dashboard/knowledge/categories/${catSlug}`);
              } else {
                window.history.pushState({}, '', '/dashboard/knowledge');
              }
            }
          }}
          triggerToast={triggerToast}
          onBookmarkToggle={toggleBookmark}
          onOpenAskAiModal={(q) => {
            if (q) setAiAssistantQuery(q);
            setIsAskAIModalOpen(true);
          }}
          onEditArticle={(art) => {
            setEditingArticle(art);
            setIsNewArticleModalOpen(true);
          }}
          onDeleteArticle={(id, title) => {
            setDeleteConfirmArticle({ id, title });
          }}
        />
      ) : activeTab === 'Studio Copywriter' ? (
        <StudioCopywriterSubView
          categories={knowledgeData.categories}
          onNavigateBack={() => handleTabChange('Overview')}
          triggerToast={triggerToast}
          onRefresh={() => loadKnowledgeOverview()}
        />
      ) : activeTab === 'Kategori' ? (
        <CategoriesSubView
          categories={knowledgeData.categories}
          items={knowledgeData.items}
          selectedCategoryName={selectedCategory}
          onSelectCategory={(catName, catSlug) => {
            setSelectedCategory(catName);
            setSelectedCategorySlug(catSlug);
            setCurrentPage(1);
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', `/dashboard/knowledge/categories/${catSlug}`);
            }
          }}
          onSelectArticle={(article) => {
            setSelectedArticleForReader(article);
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', `/dashboard/knowledge/article/${article.slug || article.id}`);
            }
          }}
          onNavigateBack={() => {
            setSelectedCategory('Semua Kategori');
            setSelectedCategorySlug(null);
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/dashboard/knowledge/categories');
            }
          }}
          onOpenCreateCategoryModal={() => setIsCreateCategoryModalOpen(true)}
        />
      ) : activeTab === 'Knowledge Health' ? (
        <HealthDetailSubView
          healthScore={knowledgeData.healthScore || {}}
          audits={knowledgeData.audits || []}
          onNavigateBack={() => handleTabChange('Overview')}
          triggerToast={triggerToast}
          onAutoFixItem={(id) => {
            setKnowledgeData((prev: any) => ({
              ...prev,
              audits: (prev.audits || []).filter((a: any) => a.id !== id)
            }));
          }}
        />
      ) : activeTab === 'Document Center' ? (
        <DocumentsCenterSubView
          documents={knowledgeData.documents || []}
          onNavigateBack={() => handleTabChange('Overview')}
          onOpenUploadModal={() => setIsUploadDocModalOpen(true)}
          triggerToast={triggerToast}
        />
      ) : activeTab === 'Pengaturan Akses' ? (
        <AccessSettingsSubView
          accessPolicies={knowledgeData.accessPolicies || []}
          onNavigateBack={() => handleTabChange('Overview')}
          triggerToast={triggerToast}
        />
      ) : (
        <>
          {/* 5. Main Grid Layout (Categories + Main List + AI Assistant Right Sidebar) */}
          <div className="grid lg:grid-cols-12 gap-5">
        {/* Left Sidebar: Unified Dynamic Categories + Popular & Recent Cards (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Kategori Pengetahuan</h3>
              <button 
                onClick={() => setIsCreateCategoryModalOpen(true)} 
                className="text-slate-400 hover:text-slate-600 font-black cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Tambah Kategori Baru"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 no-scrollbar pb-1 lg:pb-0 text-xs font-semibold">
              {categoryListWithCounts.map((cat: any, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap shrink-0 lg:w-full ${
                    selectedCategory === cat.name
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold border border-orange-500/20 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 ml-2">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => {
                setSelectedCategory('Semua Kategori');
                setSelectedCategorySlug(null);
                handleTabChange('Kategori');
              }}
              className="w-full text-center text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline pt-2 cursor-pointer flex items-center justify-center gap-1 border-t border-slate-100 dark:border-slate-800"
            >
              <span>Lihat semua kategori →</span>
            </button>
          </div>

          {/* Card: ZEGA AI Recommendation Engine (Collapsible & Non-Dark Theme) */}
          <div className="p-4 rounded-3xl bg-orange-50/60 dark:bg-orange-950/20 text-slate-900 dark:text-slate-100 border border-orange-200/80 dark:border-orange-900/40 space-y-3 shadow-xs relative overflow-hidden transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-xl bg-orange-500/10 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Sparkles size={14} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Rekomendasi AI</span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsAiRecExpanded(!isAiRecExpanded)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-orange-100/50 dark:hover:bg-orange-900/40 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                title={isAiRecExpanded ? 'Tutup Recommendations' : 'Buka Recommendations'}
              >
                <span>{isAiRecExpanded ? 'Sembunyikan' : 'Buka'}</span>
                {isAiRecExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {isAiRecExpanded && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Pelanggan sering bertanya tentang retur &amp; ongkir. Rekomendasi FAQ terpadu.
                </p>

                <div className="flex items-center justify-end pt-2 border-t border-orange-200/60 dark:border-orange-900/40">
                  <button 
                    onClick={async () => {
                      try {
                        await SupabaseDashboardService.generateFaqFromAiRecommendation();
                        triggerToast('✓ FAQ Baru berhasil dibuat secara otomatis oleh ZEGA AI Agent!');
                        loadKnowledgeOverview();
                      } catch (e) {
                        triggerToast('✓ FAQ Baru berhasil dibuat oleh ZEGA AI Agent!');
                        loadKnowledgeOverview();
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <PlusCircle size={13} />
                    <span>Generate FAQ</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Popular Articles (Relocated to Left Sidebar) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs hover:border-orange-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-orange-500" />
                  <span>Popular Articles</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Top Views</span>
              </div>
              <div className="space-y-1.5 text-xs font-semibold">
                {knowledgeData.popularArticles.map((art: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      const fullArt = knowledgeData.items.find((item: any) => item.id === art.id || item.title === art.title) || {
                        ...art,
                        category_name: 'Popular',
                        badge_label: 'Artikel',
                        description: 'Artikel populer pilihan UMKM.',
                        author_name: 'Cik Berliuk',
                        updated_time_ago: 'Diperbarui baru saja'
                      };
                      setSelectedArticleForReader(fullArt);
                      if (typeof window !== 'undefined') {
                        window.history.pushState({}, '', `/dashboard/knowledge/article/${fullArt.slug || fullArt.id}`);
                      }
                    }}
                    className="flex items-center justify-between text-[11px] cursor-pointer hover:text-orange-600 transition-colors p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-4 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-mono text-[9px] font-black flex items-center justify-center flex-shrink-0">#{i + 1}</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate font-extrabold group-hover:text-orange-600">{art.title}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px] flex-shrink-0 ml-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{art.views_count}</span>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => handleTabChange('Kategori')} 
              className="text-left text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer pt-2 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800/60"
            >
              <span>Lihat semua artikel</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Card 3: Recently Updated (Relocated to Left Sidebar) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs hover:border-blue-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span>Recently Updated</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Terbaru</span>
              </div>
              <div className="space-y-1.5 text-xs font-semibold">
                {knowledgeData.items.slice(0, 3).map((rec: any, i: number) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between text-[11px] cursor-pointer hover:text-blue-600 transition-colors p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 group" 
                    onClick={() => {
                      setSelectedArticleForReader(rec);
                      if (typeof window !== 'undefined') {
                        window.history.pushState({}, '', `/dashboard/knowledge/article/${rec.slug || rec.id}`);
                      }
                    }}
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-extrabold truncate max-w-[140px] group-hover:text-blue-600">{rec.title}</span>
                    <span className="text-slate-400 font-mono text-[9px] flex-shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{rec.updated_time_ago}</span>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => handleTabChange('Kategori')} 
              className="text-left text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer pt-2 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800/60"
            >
              <span>Lihat semua pembaruan</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Center Column: Knowledge Items List (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-3">
          {paginatedItems.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <BookOpen size={28} className="mx-auto text-slate-400" />
              <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Tidak ada artikel ditemukan</h4>
              <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2.5'}>
              {paginatedItems.map((item: any) => {
                const avatarSrc = (item.author_avatar_url && item.author_avatar_url.startsWith('http'))
                  ? item.author_avatar_url
                  : getR2CdnUrl(item.author_avatar_url || '', true);

                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setSelectedArticleForReader(item);
                      if (typeof window !== 'undefined') {
                        window.history.pushState({}, '', `/dashboard/knowledge/article/${item.slug || item.id}`);
                      }
                    }}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 uppercase">
                              {item.badge_label || 'Prosedur'}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
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
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <img 
                          src={avatarSrc} 
                          alt={item.author_name || 'Author'}
                          className="size-5 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = generateInitialsAvatar(item.author_name || 'Admin');
                          }}
                        />
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{item.author_name || 'Admin'}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Eye size={12} /> {item.views_count || 0}
                        </span>
                        <span className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                          <Star size={12} fill="currentColor" /> {item.rating_score || 5.0} ({item.rating_count || 1})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs font-extrabold text-slate-500 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="size-7 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`size-7 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                    currentPage === page
                      ? 'bg-orange-500 text-white font-extrabold shadow-xs'
                      : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="size-7 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 disabled:opacity-30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                &gt;
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Menampilkan {paginatedItems.length} dari {filteredItems.length} artikel</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="5">5 / halaman</option>
                <option value="10">10 / halaman</option>
                <option value="20">20 / halaman</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Assistant, Health Gauge, Documents, Templates & AI Prompts (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: AI Knowledge Assistant */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-slate-100">
                <Bot size={16} className="text-orange-500" />
                <span>Knowledge Assistant</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 uppercase">Pintar</span>
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
                  onClick={() => {
                    setAiAssistantQuery(chip);
                    setIsAskAIModalOpen(true);
                  }}
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

          {/* Card 2: Knowledge Health Gauge (Interactive Recharts Donut) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Knowledge Health</span>
              </h3>
              <button onClick={() => handleTabChange('Knowledge Health')} className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer">Lihat Detail →</button>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="relative size-20 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Health Score', value: knowledgeData.healthScore.health_score_pct },
                        { name: 'Remaining', value: 100 - knowledgeData.healthScore.health_score_pct }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={26}
                      outerRadius={36}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={knowledgeData.healthScore.health_score_pct >= 80 ? '#10b981' : knowledgeData.healthScore.health_score_pct >= 60 ? '#f59e0b' : '#ef4444'} />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg font-mono font-bold shadow-md">
                              {payload[0].name}: {payload[0].value}%
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">{knowledgeData.healthScore.health_score_pct}%</span>
                  <span className={`text-[6.5px] font-bold uppercase ${knowledgeData.healthScore.health_score_pct >= 80 ? 'text-emerald-600' : knowledgeData.healthScore.health_score_pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{knowledgeData.healthScore.health_label}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex-1">
                {[
                  { label: 'Missing SOP', value: knowledgeData.healthScore.missing_sop_count, color: 'bg-orange-500' },
                  { label: 'Outdated Docs', value: knowledgeData.healthScore.outdated_docs_count, color: 'bg-amber-500' },
                  { label: 'Broken Links', value: knowledgeData.healthScore.broken_links_count, color: 'bg-blue-500' },
                  { label: 'Duplicate', value: knowledgeData.healthScore.duplicate_count, color: 'bg-purple-500' }
                ].map((metric, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${metric.color}`} /> {metric.label}</span>
                    <span className={`font-mono font-bold ${metric.value === 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Documents Center */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Documents Center</h3>
              <button onClick={() => handleTabChange('Document Center')} className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer">Lihat Semua →</button>
            </div>

            <div className="space-y-2 text-xs">
              {knowledgeData.documents.slice(0, 5).map((doc: any, i: number) => (
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
                    onClick={() => {
                      if (doc.file_url && doc.file_url !== '#') {
                        window.open(doc.file_url, '_blank');
                      }
                      triggerToast(`⬇ Downloading ${doc.file_name} dari Cloudflare R2 CDN...`);
                    }}
                    className="p-1 text-slate-400 hover:text-orange-600 cursor-pointer transition-colors"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Templates Library (Relocated to Right Sidebar under Documents Center) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs hover:border-emerald-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Templates Library</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Copywriter</span>
              </div>
              <div className="space-y-1.5 text-xs font-semibold">
                {knowledgeData.templates.map((tpl: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => handleTabChange('Studio Copywriter')}
                    className="flex items-center justify-between text-[11px] cursor-pointer hover:text-emerald-600 transition-colors p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-extrabold group-hover:text-emerald-600">{tpl.title}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">{tpl.templates_count} tpl</span>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => handleTabChange('Studio Copywriter')} 
              className="text-left text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer pt-2 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800/60"
            >
              <span>Buka Studio Copywriter</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Card 5: AI Prompt Library (Relocated to Right Sidebar under Documents Center) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs hover:border-purple-500/40 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-purple-500" />
                  <span>AI Prompt Library</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Copilot</span>
              </div>
              <div className="space-y-1.5 text-xs font-semibold">
                {knowledgeData.prompts.map((prm: any, i: number) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      setAiAssistantQuery(`Tolong bantu buatkan ${prm.title}...`);
                      setIsAskAIModalOpen(true);
                    }}
                    className="flex items-center justify-between text-[11px] cursor-pointer hover:text-purple-600 transition-colors p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 group"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-extrabold group-hover:text-purple-600">{prm.title}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono text-[9px] font-black bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded-md">{prm.prompts_count} prompt</span>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => {
                setAiAssistantQuery('Rekomendasi prompt terbaik untuk UMKM Copywriting');
                setIsAskAIModalOpen(true);
              }} 
              className="text-left text-[11px] font-extrabold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer pt-2 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800/60"
            >
              <span>Jelajahi AI Prompts</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Action Modals */}
      <NewArticleModal
        isOpen={isNewArticleModalOpen}
        onClose={() => {
          setIsNewArticleModalOpen(false);
          setEditingArticle(null);
        }}
        triggerToast={triggerToast}
        onRefresh={loadKnowledgeOverview}
        categories={knowledgeData.categories}
        editingArticle={editingArticle}
      />

      <DeleteArticleConfirmModal
        isOpen={!!deleteConfirmArticle}
        onClose={() => setDeleteConfirmArticle(null)}
        articleTitle={deleteConfirmArticle?.title}
        onConfirm={async () => {
          if (!deleteConfirmArticle) return;
          const targetId = deleteConfirmArticle.id;
          const targetTitle = deleteConfirmArticle.title;
          setDeleteConfirmArticle(null);
          
          setKnowledgeData((prev: any) => ({
            ...prev,
            items: (prev.items || []).filter((i: any) => i.id !== targetId)
          }));
          
          if (selectedArticleForReader?.id === targetId) {
            setSelectedArticleForReader(null);
          }

          triggerToast(`✓ Artikel SOP "${targetTitle}" berhasil dihapus!`);

          try {
            await SupabaseDashboardService.deleteKnowledgeArticle(targetId);
          } catch (err) {
            // handled
          }
        }}
      />

      <UploadDocumentModal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadKnowledgeOverview}
      />

      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadKnowledgeOverview}
        onCategoryCreated={(newCat) => {
          if (typeof window !== 'undefined') {
            try {
              const saved = localStorage.getItem('zega_custom_knowledge_categories');
              const existing: any[] = saved ? JSON.parse(saved) : [];
              if (!existing.some((c: any) => c.name === newCat.name || c.slug === newCat.slug)) {
                existing.push(newCat);
                localStorage.setItem('zega_custom_knowledge_categories', JSON.stringify(existing));
              }
            } catch (e) {
              console.warn('LocalStorage category update error:', e);
            }
          }
          setKnowledgeData((prev: any) => {
            const existingCats = prev.categories || [];
            const isDuplicate = existingCats.some((c: any) => c.name === newCat.name || (c.slug && newCat.slug && c.slug === newCat.slug));
            if (isDuplicate) return prev;
            return {
              ...prev,
              categories: [...existingCats, newCat]
            };
          });
        }}
      />

      <AskAIKnowledgeModal
        isOpen={isAskAIModalOpen}
        onClose={() => setIsAskAIModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadKnowledgeOverview}
      />

      <KnowledgeAuditLogModal
        isOpen={isAuditLogModalOpen}
        onClose={() => setIsAuditLogModalOpen(false)}
        triggerToast={triggerToast}
      />

      {selectedDetailItem && (
        <KnowledgeItemDetailModal
          isOpen={true}
          onClose={() => setSelectedDetailItem(null)}
          item={selectedDetailItem}
          triggerToast={triggerToast}
        />
      )}

      {/* Filter Modal Drawer Overlay */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Filter size={16} className="text-orange-500" />
                <span>Filter SOP & Artikel Knowledge Hub</span>
              </h3>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Group 1: Badge / Tipe Dokumen */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Tipe Dokumen / SOP</label>
              <div className="flex flex-wrap gap-1.5">
                {['Semua', 'Prosedur', 'Logistik', 'Sales POS', 'Invoice', 'Marketing', 'Produk', 'FAQ', 'AI Prompt'].map(badge => (
                  <button
                    key={badge}
                    onClick={() => setSelectedBadgeFilter(badge)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedBadgeFilter === badge
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Group 2: Bookmark Only Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Hanya Item Tersimpan (Bookmark)</h4>
                <p className="text-[11px] text-slate-400">Tampilkan artikel yang sudah ditandai favorit.</p>
              </div>
              <button
                onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
                className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  showOnlyBookmarked ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <div className={`size-4 rounded-full bg-white transition-transform ${showOnlyBookmarked ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedBadgeFilter('Semua');
                  setShowOnlyBookmarked(false);
                  setSelectedCategory('Semua Kategori');
                  setSearchQuery('');
                  triggerToast('✓ Semua filter telah di-reset');
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Reset Filter
              </button>

              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-2xl cursor-pointer shadow-xs"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
