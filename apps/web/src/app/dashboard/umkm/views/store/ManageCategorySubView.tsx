import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Check, Package, Sparkles } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { StoreHeaderShell } from './StoreHeaderShell';
import { useLanguage } from '../../../../../i18n/translations';

interface ManageCategorySubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function ManageCategorySubView({ triggerToast, onNavigateTab }: ManageCategorySubViewProps) {
  const { t } = useLanguage();
  const s = (t.storeView || {}) as any;

  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmStoreOverview();
      if (data && Array.isArray(data.products)) {
        const counts: Record<string, number> = {};
        data.products.forEach((p: any) => {
          const cat = p.category || 'Apparel';
          counts[cat] = (counts[cat] || 0) + 1;
        });

        const catList = Object.keys(counts).map(catName => ({
          name: catName,
          count: counts[catName],
          icon: catName.includes('Fashion') ? '👔' : catName.includes('Makanan') ? '🍱' : catName.includes('Drink') ? '🥤' : '📦'
        }));
        setCategoriesData(catList);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmitting(true);
    try {
      setCategoriesData(prev => [...prev, { name: newCatName.trim(), count: 0, icon: '📦' }]);
      triggerToast(`✓ ${s.categoryAdded || 'Kategori'} "${newCatName}" ${s.categoryAddedSuccess || 'berhasil ditambahkan!'}`);
      setNewCatName('');
    } catch (err) {
      triggerToast(`⚠️ ${s.failedCreateCategory || 'Gagal membuat kategori'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenameCategory = async (oldName: string) => {
    if (!renameValue.trim() || renameValue.trim() === oldName) {
      setEditingCategory(null);
      return;
    }

    setSubmitting(true);
    try {
      await SupabaseDashboardService.manageStoreCategory('rename', oldName, renameValue.trim());
      triggerToast(`✓ ${s.categoryRenamed || 'Kategori'} "${oldName}" ${s.changedTo || 'diubah menjadi'} "${renameValue.trim()}"`);
      setEditingCategory(null);
      await loadData();
    } catch (err: any) {
      triggerToast(`⚠️ ${s.failedEditCategory || 'Gagal mengedit nama kategori'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!window.confirm(`${s.confirmDeleteCategory || 'Hapus kategori'} "${catName}"?`)) return;

    setSubmitting(true);
    try {
      await SupabaseDashboardService.manageStoreCategory('delete', catName);
      triggerToast(`✓ ${s.categoryDeleted || 'Kategori'} "${catName}" ${s.deletedSuccess || 'berhasil dihapus'}`);
      await loadData();
    } catch (err: any) {
      triggerToast(`⚠️ ${s.failedDeleteCategory || 'Gagal menghapus kategori'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100 pb-28 sm:pb-8">
      <StoreHeaderShell activeTab="manage_category" onNavigateTab={onNavigateTab} />

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 w-full">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{s.manageCategoryTitle || 'Kelola Kategori Produk Katalog'}</span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border border-slate-200 dark:border-slate-700">
                  CATALOG TAXONOMY
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {s.manageCategorySubtitle || 'Strukturkan kategori produk katalog toko Anda agar memudahkan pelanggan mencari dan memesan barang.'}
              </p>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500">
            {s.totalCategories || 'Total Kategori'}: <strong className="text-purple-600 dark:text-purple-400 font-extrabold">{categoriesData.length} {s.categoriesCount || 'Kategori'}</strong>
          </div>
        </div>

        {/* Add Category Form Card */}
        <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles size={15} className="text-purple-500" />
            <span>{s.createNewCategory || 'Buat Kategori Katalog Baru'}</span>
          </h4>
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder={s.inputNewCategoryPlaceholder || 'Masukkan Nama Kategori Baru (cth: Aksesoris Gadget, Apparel Pria, Drinkware)...'}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 shadow-2xs"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-98"
            >
              <Plus size={16} />
              <span>{s.addCategory || 'Tambah Kategori'}</span>
            </button>
          </form>
        </div>

        {/* Category List Grid */}
        <div className="space-y-3">
          <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{s.activeCategoriesList || 'Daftar Kategori Aktif'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
              {categoriesData.length} {s.categoriesCount || 'Kategori'}
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoriesData.map((cat) => {
              const isEditing = editingCategory === cat.name;
              return (
                <div 
                  key={cat.name} 
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs hover:shadow-md hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <span className="text-xl size-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center border border-purple-200/60 dark:border-purple-900/60 shrink-0">
                      {cat.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-purple-500 bg-white dark:bg-slate-900 font-bold w-full focus:outline-none"
                          />
                          <button 
                            onClick={() => handleRenameCategory(cat.name)}
                            className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{cat.name}</h4>
                          <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{cat.count} {s.registeredProducts || 'produk terdaftar'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingCategory(cat.name); setRenameValue(cat.name); }}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={s.editCategoryName || 'Edit Nama Kategori'}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.name)}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/60 text-red-500 transition-colors cursor-pointer"
                        title={s.deleteCategory || 'Hapus Kategori'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
