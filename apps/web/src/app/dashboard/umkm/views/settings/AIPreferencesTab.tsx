import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, Check, Database, Sliders, Cpu, RefreshCw } from 'lucide-react';
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

  // States matching design mockup 1
  const [selectedModel, setSelectedModel] = useState('GPT-4o (Recommended)');
  const [responseStyle, setResponseStyle] = useState('Profesional');
  const [useDataForTraining, setUseDataForTraining] = useState(true);
  const [autoInsights, setAutoInsights] = useState(true);
  const [webSearchAccess, setWebSearchAccess] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState('Bahasa Indonesia');
  const [responseLength, setResponseLength] = useState('Sedang');
  const [showSources, setShowSources] = useState(true);
  const [responseFormat, setResponseFormat] = useState('Ringkas');

  const models = [
    {
      id: 'GPT-4o (Recommended)',
      name: 'GPT-4o (Recommended)',
      badge: 'Recommended',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
      desc: 'Akurat, cepat, dan seimbang'
    },
    {
      id: 'Claude 3.5 Sonnet',
      name: 'Claude 3.5 Sonnet',
      badge: '',
      desc: 'Lebih baik untuk analisis & penulisan panjang'
    },
    {
      id: 'Gemini 1.5 Pro',
      name: 'Gemini 1.5 Pro',
      badge: '',
      desc: 'Kuat untuk data & reasoning'
    },
    {
      id: 'Llama 3 70B',
      name: 'Llama 3 70B',
      badge: '',
      desc: 'Open source, cocok untuk privasi'
    }
  ];

  const styles = [
    { id: 'Profesional', name: 'Profesional', desc: 'Formal, jelas, dan to the point' },
    { id: 'Ramah', name: 'Ramah', desc: 'Hangat, sopan, dan mudah dipahami' },
    { id: 'Kasual', name: 'Kasual', desc: 'Santai, ringan, dan akrab' },
    { id: 'Teknis', name: 'Teknis', desc: 'Detail, analitis, dan berbasis data' }
  ];

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

  useEffect(() => {
    loadPreferences();
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
      triggerToast('✓ Preferences AI berhasil diperbarui!');
    } catch (e) {
      triggerToast('✕ Gagal menyegarkan AI Preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Model AI Default & Gaya Respon AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model AI Default */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu size={16} className="text-orange-500" /> Model AI Default
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pilih model AI yang digunakan secara default oleh AI Employees.
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
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-orange-500/40 bg-slate-50/30 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-1 shrink-0">
                      <ModelBrandLogo modelKey={m.id} defaultName={m.name} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
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
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders size={16} className="text-orange-500" /> Gaya Respon AI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pilih gaya komunikasi AI saat berinteraksi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-2 ring-orange-500/20'
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
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
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
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              AI Output Preference
            </h3>
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
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="English">English</option>
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
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Singkat">Singkat</option>
                <option value="Sedang">Sedang</option>
                <option value="Panjang">Panjang</option>
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

      {/* 3. AI Memory */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
            AI Memory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            AI akan mengingat konteks bisnis Anda untuk memberikan jawaban yang lebih relevan.
          </p>
        </div>

        <button
          onClick={() => triggerToast('✓ Membuka Manajer AI Memory...')}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
        >
          Kelola Memory
        </button>
      </div>
    </div>
  );
}
