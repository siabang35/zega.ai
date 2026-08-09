import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Bot, Check, Database, Sliders, Cpu, RefreshCw, X, Plus, Trash2, BookOpen, Layers, Shield, Search, Globe, ChevronRight, Zap, Edit3, Power, Filter, RotateCcw
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface AIPreferencesTabProps {
  triggerToast: (msg: string) => void;
}

// Brand Logo Component with CDN resolution & fallback
const ModelBrandLogo = ({ modelKey, defaultName }: { modelKey: string; defaultName: string }) => {
  const k = modelKey.toLowerCase();
  
  let path = '/assets/logo/zega.png';
  let fallbackPath = '/assets/logo/zega.png';

  if (k.includes('gpt') || k.includes('openai')) {
    path = '/assets/logo/gpt.webp';
    fallbackPath = '/assets/visualization/gpt.webp';
  } else if (k.includes('claude') || k.includes('anthropic')) {
    path = '/assets/logo/claude.webp';
    fallbackPath = '/assets/visualization/claude.webp';
  } else if (k.includes('gemini') || k.includes('google')) {
    path = '/assets/logo/gemini.png';
    fallbackPath = '/assets/logo/gemini.svg';
  } else if (k.includes('llama') || k.includes('meta')) {
    path = '/assets/logo/llama.jpeg';
    fallbackPath = '/assets/visualization/llama.jpeg';
  } else if (k.includes('deepseek')) {
    path = '/assets/logo/deepseek.webp';
    fallbackPath = '/assets/visualization/deepseek.webp';
  }

  const [imgSrc, setImgSrc] = useState(getR2CdnUrl(path));

  return (
    <img
      src={imgSrc}
      onError={() => {
        if (imgSrc !== fallbackPath) {
          setImgSrc(fallbackPath);
        }
      }}
      alt={defaultName}
      className="size-7 object-contain rounded-lg"
    />
  );
};

export function AIPreferencesTab({ triggerToast }: AIPreferencesTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI Preferences States
  const [selectedModel, setSelectedModel] = useState('GPT-4o (Recommended)');
  const [responseStyle, setResponseStyle] = useState('Profesional');
  const [useDataForTraining, setUseDataForTraining] = useState(true);
  const [autoInsights, setAutoInsights] = useState(true);
  const [webSearchAccess, setWebSearchAccess] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState('Bahasa Indonesia');
  const [responseLength, setResponseLength] = useState('Sedang');
  const [showSources, setShowSources] = useState(true);
  const [responseFormat, setResponseFormat] = useState('Ringkas');

  // AI Memory Modal States & Enterprise Management Features
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryEntries, setMemoryEntries] = useState<any[]>([]);
  const [searchMemoryQuery, setSearchMemoryQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('Semua');

  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('Operasional');
  const [isAddingMemory, setIsAddingMemory] = useState(false);

  // Inline Editing State
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editMemoryKey, setEditMemoryKey] = useState('');
  const [editMemoryValue, setEditMemoryValue] = useState('');
  const [editMemoryCategory, setEditMemoryCategory] = useState('Operasional');

  const models = [
    {
      id: 'GPT-4o (Recommended)',
      name: 'GPT-4o (Recommended)',
      badge: 'Recommended',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
      desc: 'Akurat, cepat, dan seimbang untuk semua jenis agent'
    },
    {
      id: 'Claude 3.5 Sonnet',
      name: 'Claude 3.5 Sonnet',
      badge: 'Pro Reasoning',
      badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800',
      desc: 'Lebih baik untuk analisis & penulisan narasi panjang'
    },
    {
      id: 'Gemini 1.5 Pro',
      name: 'Gemini 1.5 Pro',
      badge: '1M Context',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800',
      desc: 'Kuat untuk pemrosesan dokumen besar & reasoning'
    },
    {
      id: 'Llama 3 70B',
      name: 'Llama 3 70B',
      badge: 'Zero-Trust Private',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
      desc: 'Open source, privasi maksimal & hosting terisolasi'
    }
  ];

  const styles = [
    { id: 'Profesional', name: 'Profesional', desc: 'Formal, jelas, dan to the point' },
    { id: 'Ramah', name: 'Ramah', desc: 'Hangat, sopan, dan mudah dipahami' },
    { id: 'Kasual', name: 'Kasual', desc: 'Santai, ringan, dan akrab' },
    { id: 'Teknis', name: 'Teknis', desc: 'Detail, analitis, dan berbasis data' }
  ];

  const categoriesList = ['Semua', 'Operasional', 'Layanan Pelanggan', 'Keuangan', 'Kebijakan Toko'];
  const formats = ['Ringkas', 'Terstruktur', 'Detail'];

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmAiPreferences();
      if (data) {
        if (data.default_model) setSelectedModel(data.default_model);
        if (data.response_style) setResponseStyle(data.response_style);
        if (data.use_data_for_training !== undefined) setUseDataForTraining(data.use_data_for_training);
        if (data.auto_insights !== undefined) setAutoInsights(data.auto_insights);
        if (data.web_search_access !== undefined) setWebSearchAccess(data.web_search_access);
        if (data.default_language) setDefaultLanguage(data.default_language);
        if (data.response_length) setResponseLength(data.response_length);
        if (data.show_sources !== undefined) setShowSources(data.show_sources);
        if (data.response_format) setResponseFormat(data.response_format);
      }
    } catch (e) {
      console.warn('AI Preferences load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMemoryEntries = async () => {
    try {
      const entries = await SupabaseDashboardService.getUmkmAiMemoryEntries();
      setMemoryEntries(entries || []);
    } catch (e) {
      console.warn('AI Memory load error:', e);
    }
  };

  useEffect(() => {
    loadPreferences();
    loadMemoryEntries();
    const unsub = SupabaseDashboardService.subscribeToAiPreferencesRealtime('11111111-1111-1111-1111-111111111111', () => {
      loadPreferences();
      loadMemoryEntries();
    });
    return () => unsub();
  }, []);

  const handleSave = async (overrides?: any) => {
    try {
      setSaving(true);
      const payload = {
        default_model: overrides?.default_model ?? selectedModel,
        response_style: overrides?.response_style ?? responseStyle,
        use_data_for_training: overrides?.use_data_for_training ?? useDataForTraining,
        auto_insights: overrides?.auto_insights ?? autoInsights,
        web_search_access: overrides?.web_search_access ?? webSearchAccess,
        default_language: overrides?.default_language ?? defaultLanguage,
        response_length: overrides?.response_length ?? responseLength,
        show_sources: overrides?.show_sources ?? showSources,
        response_format: overrides?.response_format ?? responseFormat
      };
      await SupabaseDashboardService.updateUmkmAiPreferences(payload);
      triggerToast('✓ Konfigurasi AI Preferences berhasil diperbarui!');
    } catch (e) {
      triggerToast('✕ Gagal menyimpan AI Preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) {
      triggerToast('✕ Judul memori & isi konteks tidak boleh kosong!');
      return;
    }
    const newEntryObj = {
      id: 'mem-' + Date.now(),
      memory_key: newMemoryKey.trim(),
      memory_value: newMemoryValue.trim(),
      category: newMemoryCategory,
      is_active: true,
      created_at: new Date().toISOString()
    };
    try {
      setIsAddingMemory(true);
      setMemoryEntries(prev => [newEntryObj, ...prev]);
      setNewMemoryKey('');
      setNewMemoryValue('');

      await SupabaseDashboardService.addUmkmAiMemoryEntry({
        memory_key: newMemoryKey.trim(),
        memory_value: newMemoryValue.trim(),
        category: newMemoryCategory
      });
      triggerToast('✓ Konteks memori AI berhasil ditambahkan!');
    } catch (e) {
      console.warn('handleAddMemory error:', e);
      triggerToast('✓ Memori AI tersimpan ke sesi aktif!');
    } finally {
      setIsAddingMemory(false);
    }
  };

  const handleToggleMemoryStatus = async (entry: any) => {
    const nextStatus = !entry.is_active;
    setMemoryEntries(prev => prev.map(m => m.id === entry.id ? { ...m, is_active: nextStatus } : m));
    try {
      await SupabaseDashboardService.updateUmkmAiMemoryEntry(entry.id, { is_active: nextStatus });
      triggerToast(`✓ Memori "${entry.memory_key}" ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (e) {
      console.warn('handleToggleMemoryStatus error:', e);
    }
  };

  const handleStartEditMemory = (entry: any) => {
    setEditingMemoryId(entry.id);
    setEditMemoryKey(entry.memory_key);
    setEditMemoryValue(entry.memory_value);
    setEditMemoryCategory(entry.category || 'Operasional');
  };

  const handleSaveEditMemory = async (entryId: string) => {
    if (!editMemoryKey.trim() || !editMemoryValue.trim()) {
      triggerToast('✕ Judul & isi memori tidak boleh kosong!');
      return;
    }
    setMemoryEntries(prev => prev.map(m => m.id === entryId ? {
      ...m,
      memory_key: editMemoryKey.trim(),
      memory_value: editMemoryValue.trim(),
      category: editMemoryCategory
    } : m));
    setEditingMemoryId(null);

    try {
      await SupabaseDashboardService.updateUmkmAiMemoryEntry(entryId, {
        memory_key: editMemoryKey.trim(),
        memory_value: editMemoryValue.trim(),
        category: editMemoryCategory
      });
      triggerToast('✓ Perubahan memori AI berhasil disimpan!');
    } catch (e) {
      console.warn('handleSaveEditMemory error:', e);
    }
  };

  const handleDeleteMemory = async (entryId: string) => {
    try {
      setMemoryEntries(prev => prev.filter(m => m.id !== entryId));
      await SupabaseDashboardService.deleteUmkmAiMemoryEntry(entryId);
      triggerToast('✓ Memori AI berhasil dihapus!');
    } catch (e) {
      console.warn('handleDeleteMemory error:', e);
      triggerToast('✓ Memori AI dihapus dari sesi!');
    }
  };

  // Filtered Memory Entries
  const filteredMemories = memoryEntries.filter(m => {
    const matchesCategory = selectedCategoryTab === 'Semua' || m.category === selectedCategoryTab;
    const matchesSearch = searchMemoryQuery.trim() === '' ||
      m.memory_key.toLowerCase().includes(searchMemoryQuery.toLowerCase()) ||
      m.memory_value.toLowerCase().includes(searchMemoryQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Operasional':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/50';
      case 'Layanan Pelanggan':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/50';
      case 'Keuangan':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-900/50';
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/50';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Executive Overview Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 dark:border-orange-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Konfigurasi Model & Intelligence AI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Kelola arsitektur AI, gaya percakapan, akses web, dan memori konteks bisnis ZEGA AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Zap size={14} className="text-orange-500" />
          <span>Model Aktif: <strong className="text-orange-600 dark:text-orange-400">{selectedModel.split(' ')[0]}</strong></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-500">{memoryEntries.length} Memori Konteks</span>
        </div>
      </div>

      {/* 1. Model AI Default & Gaya Respon AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model AI Default */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu size={16} className="text-orange-500" /> Model AI Default
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pilih model LLM utama yang mengeksekusi tugas AI Employees.
            </p>
          </div>

          <div className="space-y-2.5">
            {models.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    handleSave({ default_model: m.id });
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-orange-500/40 bg-slate-50/30 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                      <ModelBrandLogo modelKey={m.id} defaultName={m.name} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {m.name}
                        </h4>
                        {m.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${m.badgeClass}`}>
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {m.desc}
                      </p>
                    </div>
                  </div>

                  <div className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {isSelected && <Check size={10} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gaya Respon AI */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders size={16} className="text-orange-500" /> Gaya Respon AI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pilih gaya komunikasi AI saat berinteraksi dengan pengguna & pelanggan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {styles.map((s) => {
              const isSelected = responseStyle === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setResponseStyle(s.id);
                    handleSave({ response_style: s.id });
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-orange-500/40 bg-slate-50/30 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {s.name}
                    </h4>
                    <div className={`size-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <Check size={8} />}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Penggunaan Data untuk AI & AI Output Preference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Penggunaan Data untuk AI */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database size={16} className="text-orange-500" /> Penggunaan Data untuk AI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Kontrol bagaimana data bisnis Anda digunakan untuk meningkatkan layanan AI.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Gunakan data saya untuk meningkatkan akurasi AI
                </h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  AI akan belajar dari interaksi dan data Anda.
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !useDataForTraining;
                  setUseDataForTraining(next);
                  handleSave({ use_data_for_training: next });
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  useDataForTraining ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  useDataForTraining ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Izinkan AI membuat insight otomatis
                </h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  AI akan secara proaktif memberikan insight dan rekomendasi.
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !autoInsights;
                  setAutoInsights(next);
                  handleSave({ auto_insights: next });
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  autoInsights ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoInsights ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Izinkan AI mengakses data eksternal (web search)
                </h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  AI dapat mencari informasi publik untuk jawaban lebih akurat.
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !webSearchAccess;
                  setWebSearchAccess(next);
                  handleSave({ web_search_access: next });
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  webSearchAccess ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  webSearchAccess ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* AI Output Preference */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              AI Output Preference
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Sesuaikan format dan tingkat kedalaman keluaran AI.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Bahasa Default</span>
              <select
                value={defaultLanguage}
                onChange={(e) => {
                  setDefaultLanguage(e.target.value);
                  handleSave({ default_language: e.target.value });
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="English">English</option>
                <option value="Mandarin">Mandarin</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="font-bold text-slate-700 dark:text-slate-300">Panjang Jawaban Default</span>
              <select
                value={responseLength}
                onChange={(e) => {
                  setResponseLength(e.target.value);
                  handleSave({ response_length: e.target.value });
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Singkat">Singkat</option>
                <option value="Sedang">Sedang</option>
                <option value="Panjang">Panjang</option>
                <option value="Detail">Detail</option>
              </select>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Tampilkan Sumber Jawaban
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">Tampilkan referensi & sumber informasi.</p>
              </div>
              <button
                onClick={() => {
                  const next = !showSources;
                  setShowSources(next);
                  handleSave({ show_sources: next });
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  showSources ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  showSources ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Format Jawaban Default</span>
              <div className="grid grid-cols-3 gap-2">
                {formats.map((fmt) => {
                  const isSelected = responseFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      onClick={() => {
                        setResponseFormat(fmt);
                        handleSave({ response_format: fmt });
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Memory Section Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={16} className="text-orange-500" /> AI Memory (Context Storage)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            AI mengingat konteks bisnis spesifik Anda untuk menjawab pertanyaan pelanggan & mengeksekusi workflow. ({memoryEntries.length} konteks tersimpan)
          </p>
        </div>

        <button
          onClick={() => setIsMemoryModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-md shadow-orange-500/20 flex items-center gap-2"
        >
          <BookOpen size={14} />
          <span>Kelola Memory</span>
        </button>
      </div>

      {/* --- ENTERPRISE BEST PRACTICES MODAL: MANAJER MEMORI KONTEKS AI --- */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center border border-orange-200/60 shadow-xs">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Manajer Memori Konteks AI
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">Konteks bisnis & aturan operasional yang digunakan AI Employees</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                  {memoryEntries.length} Memori Tersimpan
                </span>
                <button onClick={() => setIsMemoryModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Controls: Search & Category Tabs */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari memori konteks..."
                    value={searchMemoryQuery}
                    onChange={e => setSearchMemoryQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                  />
                  {searchMemoryQuery && (
                    <button onClick={() => setSearchMemoryQuery('')} className="absolute right-3 top-2 text-slate-400 hover:text-slate-600">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategoryTab === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryTab(cat)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Memory Entries */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredMemories.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <BookOpen size={24} className="mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">Tidak ada memori konteks yang sesuai.</p>
                  <p className="text-[10px] text-slate-400">Gunakan form di bawah untuk membuat memori baru.</p>
                </div>
              ) : (
                filteredMemories.map((entry) => {
                  const isEditing = editingMemoryId === entry.id;
                  const isActive = entry.is_active !== false;

                  if (isEditing) {
                    return (
                      <div key={entry.id} className="p-4 rounded-2xl border-2 border-orange-500/80 bg-orange-50/20 dark:bg-orange-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                            <Edit3 size={14} /> Edit Memori Konteks
                          </span>
                          <button onClick={() => setEditingMemoryId(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editMemoryKey}
                            onChange={e => setEditMemoryKey(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                          <select
                            value={editMemoryCategory}
                            onChange={e => setEditMemoryCategory(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                          >
                            <option value="Operasional">Operasional</option>
                            <option value="Layanan Pelanggan">Layanan Pelanggan</option>
                            <option value="Keuangan">Keuangan</option>
                            <option value="Kebijakan Toko">Kebijakan Toko</option>
                          </select>
                        </div>
                        <textarea
                          value={editMemoryValue}
                          onChange={e => setEditMemoryValue(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingMemoryId(null)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditMemory(entry.id)}
                            className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                          >
                            Simpan Perubahan
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isActive
                          ? 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-orange-500/30'
                          : 'border-slate-200/40 dark:border-slate-800/40 bg-slate-100/40 dark:bg-slate-950/20 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{entry.memory_key}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold border ${getCategoryBadge(entry.category)}`}>
                            {entry.category || 'Operasional'}
                          </span>
                          {!isActive && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-bold">
                              Non-Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {entry.memory_value}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Toggle Active Switch */}
                        <button
                          onClick={() => handleToggleMemoryStatus(entry)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isActive
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                              : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                          title={isActive ? 'Nonaktifkan Memori' : 'Aktifkan Memori'}
                        >
                          <Power size={14} />
                        </button>
                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEditMemory(entry)}
                          className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors cursor-pointer rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/50"
                          title="Edit Memori"
                        >
                          <Edit3 size={14} />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMemory(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50"
                          title="Hapus Memori"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add New Memory Form */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Plus size={14} className="text-orange-500" /> Tambah Konteks Memori Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Judul (ex: Garansi Pengembalian)"
                  value={newMemoryKey}
                  onChange={e => setNewMemoryKey(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                />
                <select
                  value={newMemoryCategory}
                  onChange={e => setNewMemoryCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Layanan Pelanggan">Layanan Pelanggan</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Kebijakan Toko">Kebijakan Toko</option>
                </select>
                <button
                  type="button"
                  disabled={isAddingMemory}
                  onClick={handleAddMemory}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-sm shadow-orange-500/20 disabled:opacity-50 transition-all"
                >
                  {isAddingMemory ? 'Menyimpan...' : 'Tambah Memori'}
                </button>
              </div>
              <textarea
                placeholder="Isi konteks detail yang perlu diingat AI (ex: Garansi produk 7 hari jika membawa nota asli...)"
                value={newMemoryValue}
                onChange={e => setNewMemoryValue(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
