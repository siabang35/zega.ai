import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Check, Database, Sliders, Cpu, Zap, ShieldCheck, FileText, Globe, Volume2, HardDrive
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';

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
      className="size-6 object-contain rounded-md"
    />
  );
};

export function AIPreferencesTab({ triggerToast }: AIPreferencesTabProps) {
  const { t } = useLanguage();
  const prefT = t.settingsView?.aiPreferencesTab;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI Preferences States
  const [selectedModel, setSelectedModel] = useState('GPT-4o (Recommended)');
  const [responseStyle, setResponseStyle] = useState('Profesional');
  const [useDataForTraining, setUseDataForTraining] = useState(true);
  const [autoInsights, setAutoInsights] = useState(true);
  const [webSearchAccess, setWebSearchAccess] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zega_ai_default_language');
      if (saved === 'en') return 'English';
      if (saved === 'zh') return 'Mandarin';
    }
    return 'Bahasa Indonesia';
  });
  const [responseLength, setResponseLength] = useState('Sedang');
  const [showSources, setShowSources] = useState(true);
  const [responseFormat, setResponseFormat] = useState('Ringkas');

  const models = [
    {
      id: 'GPT-4o (Recommended)',
      name: 'GPT-4o (Recommended)',
      badge: 'Recommended',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
      desc: prefT?.gptDesc || 'Akurat, cepat, dan seimbang untuk semua jenis agent'
    },
    {
      id: 'Claude 3.5 Sonnet',
      name: 'Claude 3.5 Sonnet',
      badge: 'Pro Reasoning',
      badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800',
      desc: prefT?.claudeDesc || 'Lebih baik untuk analisis & penulisan narasi panjang'
    },
    {
      id: 'Gemini 1.5 Pro',
      name: 'Gemini 1.5 Pro',
      badge: '1M Context',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800',
      desc: prefT?.geminiDesc || 'Kuat untuk pemrosesan dokumen besar & reasoning'
    },
    {
      id: 'Llama 3 70B',
      name: 'Llama 3 70B',
      badge: 'Zero-Trust Private',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
      desc: prefT?.llamaDesc || 'Open source, privasi maksimal & hosting terisolasi'
    }
  ];

  const styles = [
    { id: 'Profesional', name: prefT?.styleProf || 'Profesional', desc: prefT?.styleProfDesc || 'Formal, jelas, dan to the point.' },
    { id: 'Ramah', name: prefT?.styleFriendly || 'Ramah', desc: prefT?.styleFriendlyDesc || 'Hangat, sopan, dan mudah dipahami.' },
    { id: 'Kasual', name: prefT?.styleCasualTitle || 'Kasual', desc: prefT?.styleCasualDesc || 'Santai, ringan, dan akrab.' },
    { id: 'Teknis', name: prefT?.styleTech || 'Teknis', desc: prefT?.styleTechDesc || 'Detail, analitis, dan berbasis data.' }
  ];

  const formats = [
    { id: 'Ringkas', label: prefT?.fmtConcise || 'Ringkas' },
    { id: 'Terstruktur', label: prefT?.fmtStructured || 'Terstruktur' },
    { id: 'Detail', label: prefT?.fmtDetailed || 'Detail' }
  ];

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
        if (data.default_language) {
          const langVal = data.default_language;
          let normalizedLang = 'Bahasa Indonesia';
          let aiLangCode = 'id';
          if (langVal.toLowerCase().includes('english') || langVal === 'en') {
            normalizedLang = 'English';
            aiLangCode = 'en';
          } else if (langVal.toLowerCase().includes('mandarin') || langVal.toLowerCase().includes('chinese') || langVal === 'zh') {
            normalizedLang = 'Mandarin';
            aiLangCode = 'zh';
          } else if (langVal.toLowerCase().includes('indonesia') || langVal === 'id') {
            normalizedLang = 'Bahasa Indonesia';
            aiLangCode = 'id';
          } else {
            normalizedLang = langVal;
          }
          setDefaultLanguage(normalizedLang);
          localStorage.setItem('zega_ai_default_language', aiLangCode);
        }
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
    const unsub = SupabaseDashboardService.subscribeToAiPreferencesRealtime(undefined as any, () => {
      loadPreferences();
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
      triggerToast(`✓ ${prefT?.toastSuccess || 'AI preferences saved successfully!'}`);
    } catch (e) {
      triggerToast(`✕ ${prefT?.toastError || 'Failed to save AI preferences.'}`);
    } finally {
      setSaving(false);
    }
  };

  const renderToggle = (checked: boolean, onChange: (val: boolean) => void) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
        checked ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out ${
        checked ? 'translate-x-3.5' : 'translate-x-0'
      }`} />
    </button>
  );

  return (
    <div className="max-w-6xl space-y-4 font-sans">
      {/* Executive Overview Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 dark:border-orange-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-8.5 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {prefT?.bannerTitle || 'Konfigurasi Model & Intelligence AI'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {prefT?.bannerSub || 'Kelola arsitektur AI, gaya percakapan, dan akses data ZEGA AI.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
          <Zap size={13} className="text-orange-500" />
          <span className="text-[11px]">{prefT?.activeModel || 'Model Aktif'}: <strong className="text-orange-600 dark:text-orange-400 font-mono">{selectedModel.split(' ')[0]}</strong></span>
        </div>
      </div>

      {/* Grid Layout (Matched Heights & Structured Alignments) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        
        {/* Card 1: Default AI Model */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Cpu size={14} className="text-orange-500" /> {prefT?.defaultModelTitle || 'Model AI Default'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {prefT?.defaultModelSub || 'Pilih model LLM utama yang mengeksekusi tugas AI Employees.'}
                </p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                4 Available
              </span>
            </div>

            <div className="space-y-2 mt-3">
              {models.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      handleSave({ default_model: m.id });
                    }}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-1 ring-orange-500/20'
                        : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center p-0.5 shrink-0">
                        <ModelBrandLogo modelKey={m.id} defaultName={m.name} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {m.name}
                          </h4>
                          {m.badge && (
                            <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-extrabold ${m.badgeClass}`}>
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                          {m.desc}
                        </p>
                      </div>
                    </div>

                    <div className={`size-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <Check size={8} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: AI Response Style */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sliders size={14} className="text-orange-500" /> {prefT?.responseStyleTitle || 'Gaya Respon AI'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {prefT?.responseStyleSub || 'Pilih gaya komunikasi AI saat berinteraksi dengan pengguna & pelanggan.'}
                </p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                Persona
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {styles.map((s) => {
                const isSelected = responseStyle === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setResponseStyle(s.id);
                      handleSave({ response_style: s.id });
                    }}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 ring-1 ring-orange-500/20'
                        : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40'
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
                    <p className="text-[10px] text-slate-400 font-medium leading-tight">
                      {s.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Data Usage for AI */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Database size={14} className="text-orange-500" /> {prefT?.dataUsageTitle || 'Penggunaan Data untuk AI'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {prefT?.dataUsageSub || 'Kontrol bagaimana data bisnis Anda digunakan untuk meningkatkan layanan AI.'}
                </p>
              </div>
              <ShieldCheck size={14} className="text-emerald-500" />
            </div>

            <div className="space-y-2 mt-3">
              <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {prefT?.trainData || 'Gunakan data saya untuk meningkatkan akurasi AI'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {prefT?.trainDataDesc || 'AI akan belajar dari interaksi dan data Anda.'}
                  </p>
                </div>
                {renderToggle(useDataForTraining, (val) => {
                  setUseDataForTraining(val);
                  handleSave({ use_data_for_training: val });
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {prefT?.autoInsightsTitle || 'Izinkan AI membuat insight otomatis'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {prefT?.autoInsightsDesc || 'AI akan secara proaktif memberikan insight dan rekomendasi.'}
                  </p>
                </div>
                {renderToggle(autoInsights, (val) => {
                  setAutoInsights(val);
                  handleSave({ auto_insights: val });
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {prefT?.webSearch || 'Izinkan AI mengakses data eksternal (web search)'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {prefT?.webSearchDesc || 'AI dapat mencari informasi publik untuk jawaban lebih akurat.'}
                  </p>
                </div>
                {renderToggle(webSearchAccess, (val) => {
                  setWebSearchAccess(val);
                  handleSave({ web_search_access: val });
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: AI Output Preferences */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileText size={14} className="text-orange-500" /> {prefT?.outputPrefTitle || 'AI Output Preferences'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {prefT?.outputPrefSub || 'Sesuaikan format dan tingkat kedalaman keluaran AI.'}
                </p>
              </div>
              <Globe size={14} className="text-slate-400" />
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{prefT?.defaultLang || 'Bahasa Default'}</span>
                  <select
                    value={defaultLanguage}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDefaultLanguage(val);
                      let aiCode = 'id';
                      if (val.toLowerCase().includes('english') || val === 'en') aiCode = 'en';
                      else if (val.toLowerCase().includes('mandarin') || val === 'zh') aiCode = 'zh';
                      else aiCode = 'id';
                      localStorage.setItem('zega_ai_default_language', aiCode);
                      handleSave({ default_language: val });
                    }}
                    className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="English">English</option>
                    <option value="Mandarin">Mandarin</option>
                  </select>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{prefT?.defaultLen || 'Panjang Jawaban'}</span>
                  <select
                    value={responseLength}
                    onChange={(e) => {
                      setResponseLength(e.target.value);
                      handleSave({ response_length: e.target.value });
                    }}
                    className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="Singkat">{prefT?.lenShort || 'Singkat'}</option>
                    <option value="Sedang">{prefT?.lenMedium || 'Sedang'}</option>
                    <option value="Panjang">{prefT?.lenLong || 'Panjang'}</option>
                    <option value="Detail">{prefT?.lenDetail || 'Detail'}</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {prefT?.showSourcesTitle || 'Tampilkan Sumber Jawaban'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{prefT?.showSourcesDesc || 'Tampilkan referensi & sumber informasi.'}</p>
                </div>
                {renderToggle(showSources, (val) => {
                  setShowSources(val);
                  handleSave({ show_sources: val });
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">{prefT?.defaultFmt || 'Format Jawaban Default'}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {formats.map((fmt) => {
                    const isSelected = responseFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => {
                          setResponseFormat(fmt.id);
                          handleSave({ response_format: fmt.id });
                        }}
                        className={`py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
