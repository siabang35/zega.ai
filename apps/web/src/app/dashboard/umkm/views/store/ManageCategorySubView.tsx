import React, { useState, useEffect } from 'react';
import { Layers, ArrowLeft, Plus, Edit2, Trash2, Check, Package, Sparkles } from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { StoreHeaderShell } from './StoreHeaderShell';

interface ManageCategorySubViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function ManageCategorySubView({ triggerToast, onNavigateTab }: ManageCategorySubViewProps) {
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
      triggerToast(`✓ Kategori "${newCatName}" berhasil ditambahkan!`);
      setNewCatName('');
    } catch (err) {
      triggerToast('⚠️ Gagal membuat kategori');
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
      triggerToast(`✓ Kategori "${oldName}" diubah menjadi "${renameValue.trim()}"`);
      setEditingCategory(null);
      await loadData();
    } catch (err: any) {
      triggerToast('⚠️ Gagal mengedit nama kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!window.confirm(`Hapus kategori "${catName}"? Produk dalam kategori ini akan dipindahkan ke "Lainnya".`)) return;

    setSubmitting(true);
    try {
      await SupabaseDashboardService.manageStoreCategory('delete', catName);
      triggerToast(`✓ Kategori "${catName}" berhasil dihapus`);
      await loadData();
    } catch (err: any) {
      triggerToast('⚠️ Gagal menghapus kategori');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      <StoreHeaderShell activeTab="manage_category" onNavigateTab={onNavigateTab} />

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
                <Layers size={18} className="text-purple-500" />
                <span>Kelola Kategori Produk Katalog</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Strukturkan kategori katalog toko Anda agar memudahkan pelanggan mencari produk.</p>
            </div>
          </div>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex gap-3">
          <input
            type="text"
            required
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="Tambah Nama Kategori Baru (cth: Aksesoris Gadget)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Kategori</span>
          </button>
        </form>

        {/* Category List Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categoriesData.map((cat) => {
            const isEditing = editingCategory === cat.name;
            return (
              <div 
                key={cat.name} 
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-xs hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/60 dark:border-slate-800">{cat.icon}</span>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          className="px-2 py-1 text-xs rounded-lg border border-orange-500 bg-white dark:bg-slate-900 font-bold w-full"
                        />
                        <button 
                          onClick={() => handleRenameCategory(cat.name)}
                          className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{cat.name}</h4>
                        <span className="text-[11px] font-semibold text-slate-400 block">{cat.count} produk terdaftar</span>
                      </>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingCategory(cat.name); setRenameValue(cat.name); }}
                      className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                      title="Edit Nama"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.name)}
                      className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/60 text-red-500 transition-colors cursor-pointer"
                      title="Hapus Kategori"
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
  );
}
