import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Folder, BookOpen, ChevronRight, FileText, 
  ArrowLeft, Filter, Star, Eye, Bookmark, Clock, UserCheck, ShieldCheck,
  LayoutGrid, List, SortAsc, SortDesc, Tag, ChevronDown
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';

interface CategoriesSubViewProps {
  categories: any[];
  items: any[];
  selectedCategoryName?: string | null;
  onSelectCategory: (catName: string, catSlug: string) => void;
  onSelectArticle: (article: any) => void;
  onNavigateBack: () => void;
  onOpenCreateCategoryModal?: () => void;
}

export function categoryToSlug(name: string): string {
  if (!name) return 'all';
  return name.toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CategoriesSubView({
  categories,
  items,
  selectedCategoryName,
  onSelectCategory,
  onSelectArticle,
  onNavigateBack,
  onOpenCreateCategoryModal
}: CategoriesSubViewProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [sortBy, setSortBy] = useState<'sort_order' | 'name' | 'count'>('sort_order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showSortPopover, setShowSortPopover] = useState(false);

  const catList = Array.isArray(categories) ? categories : [];
  const itemList = Array.isArray(items) ? items : [];

  // ─────────────── TOP LEVEL HOOK (ALL CATEGORIES FILTER & SORT) ───────────────
  const filteredCategories = useMemo(() => {
    let list = catList.filter(c =>
      c.name !== 'Semua Kategori' && (
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
      )
    );

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') {
        return sortDir === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'count') {
        const ca = itemList.filter((i: any) => i.category_name === a.name).length || a.count || 0;
        const cb = itemList.filter((i: any) => i.category_name === b.name).length || b.count || 0;
        return sortDir === 'asc' ? ca - cb : cb - ca;
      }
      return sortDir === 'asc' ? (a.sort_order || 99) - (b.sort_order || 99) : (b.sort_order || 99) - (a.sort_order || 99);
    });

    return list;
  }, [catList, itemList, search, sortBy, sortDir]);

  // ─────────────── CATEGORY DETAIL VIEW ───────────────
  if (selectedCategoryName && selectedCategoryName !== 'Semua Kategori') {
    const selectedCatObj = catList.find(c => c.name === selectedCategoryName) || {
      name: selectedCategoryName,
      description: 'Kategori dokumentasi operasional dan panduan kerja toko UMKM.',
      icon_name: 'Folder'
    };

    const categoryArticles = itemList.filter(i => 
      i.category_name === selectedCategoryName || 
      (i.category_id && selectedCatObj.id && i.category_id === selectedCatObj.id)
    ).filter(i => 
      !search.trim() || 
      i.title?.toLowerCase().includes(search.toLowerCase()) || 
      i.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Category Detail Header */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateBack}
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all flex items-center gap-1 text-xs font-extrabold"
              >
                <ArrowLeft size={16} />
                <span>Semua Kategori</span>
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <Folder className="text-orange-500" size={22} />
                  <span>Kategori: {selectedCatObj.name}</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">{selectedCatObj.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* View Mode Switcher */}
              <div className="hidden sm:flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button onClick={() => setViewMode('grid')} title="Grid" className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}>
                  <LayoutGrid size={15} />
                </button>
                <button onClick={() => setViewMode('list')} title="List" className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}>
                  <List size={15} />
                </button>
              </div>

              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Cari di ${selectedCatObj.name}...`}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="flex items-center gap-1.5"><FileText size={13} className="text-blue-500" /> {categoryArticles.length} Artikel</span>
            <span className="flex items-center gap-1.5"><Eye size={13} className="text-emerald-500" /> {categoryArticles.reduce((s: number, a: any) => s + (a.views_count || 0), 0)} Total Views</span>
            <span className="flex items-center gap-1.5"><Star size={13} className="text-amber-500" /> {(categoryArticles.reduce((s: number, a: any) => s + (a.rating_score || 0), 0) / Math.max(1, categoryArticles.length)).toFixed(1)} Avg Rating</span>
          </div>
        </div>

        {/* Category Articles */}
        {categoryArticles.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryArticles.map((art, idx) => {
                const avatarSrc = (art.author_avatar_url && art.author_avatar_url.startsWith('http'))
                  ? art.author_avatar_url
                  : getR2CdnUrl(art.author_avatar_url || '', true);
                return (
                  <div
                    key={art.id || idx}
                    onClick={() => onSelectArticle(art)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-orange-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                          {art.badge_label || art.badge_type || 'Prosedur'}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-extrabold text-xs">
                          <Star size={12} fill="currentColor" />
                          <span>{art.rating_score ?? 0}</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                        {art.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold">
                      <div className="flex items-center gap-2">
                        <img src={avatarSrc} alt={art.author_name} className="size-5 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = generateInitialsAvatar(art.author_name || 'UMKM'); }} />
                        <span className="truncate max-w-[100px]">{art.author_name || 'Tim UMKM'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-extrabold">
                        <span>Baca</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW for articles */
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoryArticles.map((art, idx) => {
                  const avatarSrc = (art.author_avatar_url && art.author_avatar_url.startsWith('http'))
                    ? art.author_avatar_url
                    : getR2CdnUrl(art.author_avatar_url || '', true);
                  return (
                    <div
                      key={art.id || idx}
                      onClick={() => onSelectArticle(art)}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <img src={avatarSrc} alt={art.author_name} className="size-9 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = generateInitialsAvatar(art.author_name || 'UMKM'); }} />
                        <div className="truncate flex-1">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors truncate">{art.title}</h4>
                          <p className="text-xs text-slate-400 truncate font-medium">{art.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-xs flex-wrap sm:flex-nowrap justify-end">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-orange-50 dark:bg-orange-950/60 text-orange-600">{art.badge_label || 'Prosedur'}</span>
                        <span className="flex items-center gap-1 text-amber-500 font-bold"><Star size={12} fill="currentColor" /> {art.rating_score || 4.9}</span>
                        <span className="hidden sm:inline font-mono text-slate-400">{art.views_count || 0} views</span>
                        <div className="size-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
            <BookOpen size={36} className="mx-auto text-slate-300" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Belum ada artikel di kategori {selectedCatObj.name}</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Gunakan Studio Copywriter untuk menambahkan artikel baru di kategori ini.</p>
          </div>
        )}
      </div>
    );
  }

  // ─────────────── ALL CATEGORIES VIEW ───────────────
  const totalArticles = itemList.length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Folder className="text-orange-500" size={20} />
              <span>Semua Kategori Pengetahuan</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">{filteredCategories.length} Kategori</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">Kelola dan jelajahi seluruh kategori SOP, logistik, sales, dan perpajakan toko.</p>
          </div>

          {onOpenCreateCategoryModal && (
            <button
              onClick={onOpenCreateCategoryModal}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-2xl cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 transition-all"
            >
              <Plus size={14} /> <span>Kategori Baru</span>
            </button>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('grid')} title="Tampilan Grid"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setViewMode('list')} title="Tampilan Daftar"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={15} />
            </button>
            <button onClick={() => setViewMode('compact')} title="Tampilan Kompak / Chip"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'compact' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
              <Tag size={15} />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortPopover(!showSortPopover)}
              className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-orange-400 cursor-pointer flex items-center gap-1.5"
            >
              {sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
              <span>{sortBy === 'name' ? 'Nama A-Z' : sortBy === 'count' ? 'Jumlah Artikel' : 'Urutan Default'}</span>
              <ChevronDown size={12} />
            </button>
            {showSortPopover && (
              <div className="absolute top-full left-0 mt-1 z-20 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                {([
                  { key: 'sort_order', label: '📋 Urutan Default' },
                  { key: 'name', label: '🔤 Nama Kategori A-Z' },
                  { key: 'count', label: '📊 Jumlah Artikel' }
                ] as const).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortBy(opt.key); setShowSortPopover(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold cursor-pointer transition-all ${sortBy === opt.key ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => { setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setShowSortPopover(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl font-bold cursor-pointer text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    {sortDir === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />}
                    <span>{sortDir === 'asc' ? 'Ascending ↑' : 'Descending ↓'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 ml-auto">
            <span>{totalArticles} artikel total</span>
            <span>•</span>
            <span>{filteredCategories.length} kategori</span>
          </div>
        </div>
      </div>

      {/* ─── GRID VIEW ─── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat, idx) => {
            const categoryItems = itemList.filter(i => i.category_name === cat.name || (i.category_id && cat.id && i.category_id === cat.id));
            const artCount = categoryItems.length || cat.count || 0;
            const catSlug = cat.slug || categoryToSlug(cat.name);

            return (
              <div
                key={cat.id || idx}
                onClick={() => onSelectCategory(cat.name, catSlug)}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-orange-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-black">
                      <BookOpen size={20} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-[11px]">
                      {artCount} Artikel SOP
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description || 'Kategori dokumentasi operasional dan panduan kerja toko UMKM.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-extrabold text-orange-600 dark:text-orange-400">
                  <span>Jelajahi Kategori</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── LIST VIEW ─── */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          {/* Table Header */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span className="flex-1">Nama Kategori</span>
            <span className="w-28 text-center hidden sm:block">Jumlah Artikel</span>
            <span className="w-24 text-center hidden md:block">Ikon</span>
            <span className="w-20 text-center">Aksi</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCategories.map((cat, idx) => {
              const categoryItems = itemList.filter(i => i.category_name === cat.name || (i.category_id && cat.id && i.category_id === cat.id));
              const artCount = categoryItems.length || cat.count || 0;
              const catSlug = cat.slug || categoryToSlug(cat.name);

              return (
                <div
                  key={cat.id || idx}
                  onClick={() => onSelectCategory(cat.name, catSlug)}
                  className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center gap-4 group"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="size-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-black shrink-0">
                      <BookOpen size={18} />
                    </div>
                    <div className="truncate flex-1">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors truncate">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate font-medium">
                        {cat.description || 'Kategori dokumentasi operasional dan panduan kerja toko UMKM.'}
                      </p>
                    </div>
                  </div>

                  <div className="w-28 text-center hidden sm:block">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs">
                      {artCount} Artikel
                    </span>
                  </div>

                  <div className="w-24 text-center text-xs text-slate-400 font-mono hidden md:block">
                    {cat.icon_name || 'Folder'}
                  </div>

                  <div className="w-20 flex justify-center">
                    <div className="size-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── COMPACT / CHIP VIEW ─── */}
      {viewMode === 'compact' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Akses Cepat Kategori</h3>
          <div className="flex flex-wrap gap-2.5">
            {filteredCategories.map((cat, idx) => {
              const categoryItems = itemList.filter(i => i.category_name === cat.name || (i.category_id && cat.id && i.category_id === cat.id));
              const artCount = categoryItems.length || cat.count || 0;
              const catSlug = cat.slug || categoryToSlug(cat.name);

              return (
                <button
                  key={cat.id || idx}
                  onClick={() => onSelectCategory(cat.name, catSlug)}
                  className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:border-orange-500 hover:bg-orange-50/60 dark:hover:bg-orange-950/40 transition-all cursor-pointer group flex items-center gap-3 shadow-xs hover:shadow-md"
                >
                  <div className="size-9 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 flex items-center justify-center font-black group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors">{cat.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{artCount} Artikel</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all ml-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
          <Folder size={36} className="mx-auto text-slate-300" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Tidak ada kategori ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Coba ubah kata kunci pencarian atau buat kategori baru.</p>
        </div>
      )}
    </div>
  );
}
