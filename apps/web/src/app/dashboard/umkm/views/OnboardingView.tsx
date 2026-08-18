import React, { useState } from 'react';
import { 
  Store, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Loader2, 
  Sparkles, 
  LogIn, 
  Shirt, 
  Utensils, 
  Sparkle, 
  Smartphone, 
  Palette, 
  Home, 
  Wrench, 
  MoreHorizontal,
  ChevronRight,
  Bot,
  Zap,
  Globe
} from 'lucide-react';
import { useAuthorizedUmkmContext } from '../../contexts/TenantContext';
import { getAuthBridgeState } from '../../../components/auth/PrivyAuthBridge';
import { SocialAuthService } from '../../../services/socialAuthService';

interface OnboardingViewProps {
  onComplete?: () => void;
}

type Lang = 'id' | 'en';

const TRANSLATIONS = {
  id: {
    step1Tag: 'Langkah 1 dari 2',
    step2Tag: 'Langkah 2 dari 2',
    step1Title: 'Nama & Kategori Usaha',
    step1Subtitle: 'Isi nama dan pilih kategori bisnis Anda.',
    step2Title: 'Detail Kontak & Lokasi',
    step2Subtitle: 'Informasi kontak opsional untuk toko Anda.',
    storeNameLabel: 'Nama Toko / Usaha',
    storeNamePlaceholder: 'cth: Toko Kopi Sejahtera',
    categoryLabel: 'Kategori Bisnis',
    phoneLabel: 'WhatsApp Toko',
    phonePlaceholder: '081234567890 (Opsional)',
    locationLabel: 'Kota / Wilayah',
    locationPlaceholder: 'Jakarta Selatan (Opsional)',
    nextStep: 'Lanjut',
    backStep: 'Kembali',
    submitButton: 'Buka Dashboard',
    loginGoogle: 'Masuk Google & Aktifkan Toko',
    loading: 'Menyiapkan Toko...',
    authInitializing: 'Memuat Autentikasi...',
    previewTitle: 'Preview Toko',
    previewBadge: 'Siap Aktif',
    aiCopilotReady: 'ZEGA AI Copilot Ready',
    aiCopilotDesc: 'Otomatisasi pencatatan stok & respon pembeli 24/7.',
    guarantee: '100% Gratis • Tanpa Biaya Tersembunyi • Proteksi Multi-Tenant',
    categories: {
      'Fashion & Pakaian': 'Fashion',
      'Makanan & Minuman': 'Kuliner & F&B',
      'Kecantikan & Skincare': 'Kecantikan',
      'Elektronik & Gadget': 'Gadget & Tech',
      'Kerajinan & Souvenir': 'Craft & Art',
      'Perlengkapan Rumah': 'Home & Decor',
      'Jasa & Pelayanan': 'Jasa & Service',
      'Lainnya': 'Lainnya'
    }
  },
  en: {
    step1Tag: 'Step 1 of 2',
    step2Tag: 'Step 2 of 2',
    step1Title: 'Store Name & Category',
    step1Subtitle: 'Enter your business name and select a category.',
    step2Title: 'Contact & Location',
    step2Subtitle: 'Optional contact details for your store.',
    storeNameLabel: 'Store / Business Name',
    storeNamePlaceholder: 'e.g. Sejahtera Coffee Shop',
    categoryLabel: 'Business Category',
    phoneLabel: 'Store WhatsApp',
    phonePlaceholder: '081234567890 (Optional)',
    locationLabel: 'City / Region',
    locationPlaceholder: 'South Jakarta (Optional)',
    nextStep: 'Next',
    backStep: 'Back',
    submitButton: 'Open Dashboard',
    loginGoogle: 'Sign in with Google & Activate',
    loading: 'Setting up store...',
    authInitializing: 'Initializing Auth...',
    previewTitle: 'Store Preview',
    previewBadge: 'Ready',
    aiCopilotReady: 'ZEGA AI Copilot Ready',
    aiCopilotDesc: 'Automated inventory & 24/7 buyer responses.',
    guarantee: '100% Free • No Hidden Fees • Multi-Tenant Security',
    categories: {
      'Fashion & Pakaian': 'Fashion',
      'Makanan & Minuman': 'Culinary & F&B',
      'Kecantikan & Skincare': 'Beauty & Skincare',
      'Elektronik & Gadget': 'Gadget & Tech',
      'Kerajinan & Souvenir': 'Craft & Art',
      'Perlengkapan Rumah': 'Home & Decor',
      'Jasa & Pelayanan': 'Services',
      'Lainnya': 'Others'
    }
  }
};

const CATEGORIES = [
  { id: 'Fashion & Pakaian', icon: Shirt },
  { id: 'Makanan & Minuman', icon: Utensils },
  { id: 'Kecantikan & Skincare', icon: Sparkle },
  { id: 'Elektronik & Gadget', icon: Smartphone },
  { id: 'Kerajinan & Souvenir', icon: Palette },
  { id: 'Perlengkapan Rumah', icon: Home },
  { id: 'Jasa & Pelayanan', icon: Wrench },
  { id: 'Lainnya', icon: MoreHorizontal }
];

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const authCtx = useAuthorizedUmkmContext();
  const authBridge = getAuthBridgeState();
  const authState = authBridge.authState;

  const [lang, setLang] = useState<Lang>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('zega_lang') as Lang;
      if (saved === 'en' || saved === 'id') return saved;
    }
    return 'id';
  });

  const t = TRANSLATIONS[lang];

  const toggleLanguage = (newLang: Lang) => {
    setLang(newLang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zega_lang', newLang);
    }
  };

  const hasUserSession = Boolean(
    authBridge.userEmail || 
    authBridge.supabaseUserId || 
    localStorage.getItem('zega_access_token') || 
    localStorage.getItem('zega_mock_session')
  );
  const isAuthInitializing = authState === 'AUTH_INITIALIZING' && !hasUserSession;
  const isAuthReady = authState === 'AUTH_READY' || authCtx.authReady || hasUserSession;
  const isAuthRequired = !isAuthReady && !isAuthInitializing;

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('Fashion & Pakaian');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    SocialAuthService.initiateGoogleOAuth('INDIVIDUAL_UMKM').catch((err) => {
      console.error('[OnboardingView] Google login error:', err);
    });
  };

  const handleNextStep = () => {
    if (!storeName.trim()) {
      setErrorMsg(lang === 'id' ? 'Harap isi nama toko terlebih dahulu.' : 'Please enter your store name first.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAuthInitializing) return;

    if (isAuthRequired) {
      setErrorMsg(lang === 'id' ? 'Silakan masuk terlebih dahulu untuk melanjutkan.' : 'Please sign in first to continue.');
      return;
    }

    if (!storeName.trim()) {
      setErrorMsg(lang === 'id' ? 'Nama toko wajib diisi.' : 'Store name is required.');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (!authCtx.provisionStore) {
        throw new Error(lang === 'id' ? 'Layanan pendaftaran toko sedang menyiapkan server. Coba beberapa saat lagi.' : 'Store registration service initializing. Please try again shortly.');
      }

      const res = await authCtx.provisionStore({
        storeName: storeName.trim(),
        category,
        phone: phone.trim(),
        location: location.trim()
      });

      if (!res.ok || !res.storeId) {
        throw new Error(res.error || (lang === 'id' ? 'Gagal mendaftarkan toko.' : 'Failed to register store.'));
      }

      // Immediately lock tenant context store readiness so dashboard does not re-trigger onboarding view
      const { updateActiveTenantStore } = await import('../../contexts/TenantContext');
      updateActiveTenantStore(res.storeId, 'ready');

      setLoading(false);
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error('[OnboardingView] Setup error:', err);
      setErrorMsg(err?.message || (lang === 'id' ? 'Terjadi kesalahan saat memproses pendaftaran toko.' : 'An error occurred during store registration.'));
      setLoading(false);
    }
  };

  const selectedCategoryObj = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const CategoryIcon = selectedCategoryObj.icon;
  const categoryLabel = t.categories[category as keyof typeof t.categories] || category;

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-4 sm:py-6 sm:px-6">
      
      {/* Top Header Bar: Language Switcher */}
      <div className="flex items-center justify-between mb-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ZEGA Onboarding</span>
        </div>

        {/* Language Switcher Pill */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-bold shadow-xs">
          <Globe size={13} className="text-slate-400 ml-1.5 mr-1" />
          <button
            type="button"
            onClick={() => toggleLanguage('id')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              lang === 'id' 
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs font-black' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🇮🇩 ID
          </button>
          <button
            type="button"
            onClick={() => toggleLanguage('en')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              lang === 'en' 
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs font-black' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Main Onboarding Card */}
        <div className="lg:col-span-7 relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5 backdrop-blur-xl">
          
          {/* Step Progress Line */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">
                {currentStep}
              </span>
              <span className="text-slate-900 dark:text-white font-extrabold">
                {currentStep === 1 ? t.step1Tag : t.step2Tag}
              </span>
            </div>

            <div className="flex gap-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === 1 ? 'w-8 bg-orange-500' : 'w-3 bg-slate-200 dark:bg-slate-800'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === 2 ? 'w-8 bg-orange-500' : 'w-3 bg-slate-200 dark:bg-slate-800'}`} />
            </div>
          </div>

          {/* Header Title */}
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {currentStep === 1 ? t.step1Title : t.step2Title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentStep === 1 ? t.step1Subtitle : t.step2Subtitle}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
              <span>⚠️ {errorMsg}</span>
              {isAuthRequired && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Login
                </button>
              )}
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {currentStep === 1 ? (
              <>
                {/* Store Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t.storeNameLabel} <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                      <Store size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={storeName}
                      onChange={(e) => {
                        setStoreName(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder={t.storeNamePlaceholder}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                </div>

                {/* Compact Category Selector Grid */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t.categoryLabel} <span className="text-orange-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      const label = t.categories[cat.id as keyof typeof t.categories] || cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold shadow-xs ring-2 ring-orange-500/20 scale-[1.01]' 
                              : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <Icon size={16} className={isSelected ? 'text-orange-500' : 'text-slate-400'} />
                          <span className="text-[11px] font-bold text-center truncate w-full">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 1 Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!storeName.trim()}
                    className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{t.nextStep}</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Contact & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t.phoneLabel}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                        <Phone size={18} />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t.locationLabel}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                        <MapPin size={18} />
                      </div>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={t.locationPlaceholder}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    {t.backStep}
                  </button>

                  {isAuthRequired ? (
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <LogIn size={18} />
                      <span>{t.loginGoogle}</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !storeName.trim()}
                      className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>{t.loading}</span>
                        </>
                      ) : isAuthInitializing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>{t.authInitializing}</span>
                        </>
                      ) : (
                        <>
                          <Zap size={18} className="fill-current" />
                          <span>{t.submitButton}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        </div>

        {/* Right Side: Live Store Card Preview */}
        <div className="lg:col-span-5 space-y-3">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden">
            
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Store size={15} className="text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{t.previewTitle}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                {t.previewBadge}
              </span>
            </div>

            {/* Store Preview Details */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">{t.storeNameLabel}</span>
                <h3 className="text-lg font-black text-white truncate">
                  {storeName.trim() || (lang === 'id' ? 'Toko UMKM Anda' : 'Your Store Name')}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block font-bold">{t.categoryLabel}</span>
                  <div className="flex items-center gap-1 mt-0.5 text-orange-400 font-bold">
                    <CategoryIcon size={14} />
                    <span className="truncate">{categoryLabel}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-[10px] text-slate-400 block font-bold">{t.locationLabel}</span>
                  <span className="font-bold text-slate-200 truncate block mt-0.5">
                    {location.trim() || 'Indonesia'}
                  </span>
                </div>
              </div>

              {/* AI Copilot Badge */}
              <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-2.5">
                <Bot size={16} className="text-orange-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-extrabold text-orange-300 block text-[11px]">{t.aiCopilotReady}</span>
                  <span className="text-[10px] text-slate-400 leading-tight block">
                    {t.aiCopilotDesc}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Security Pill */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 shadow-2xs">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>{t.guarantee}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
