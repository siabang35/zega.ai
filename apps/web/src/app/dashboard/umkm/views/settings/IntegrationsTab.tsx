import React, { useState, useEffect } from 'react';
import { 
  Globe, Copy, Eye, EyeOff, Edit3, Key, ShieldCheck, Sparkles, ExternalLink, Settings, RefreshCw, X, Link2, Unlink, Server, Zap, Lock, CreditCard, ShoppingBag, MessageSquare, Search, Plus
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface IntegrationsTabProps {
  triggerToast: (msg: string) => void;
  integrationsList: any[];
  webhookUrl: string;
  onRefresh: () => void;
}

function IntegrationBrandLogo({ name, integrationKey }: { name?: string; integrationKey?: string }) {
  const getCdnLogo = (n?: string, kStr?: string) => {
    const k = `${n || ''} ${kStr || ''}`.toLowerCase();
    if (k.includes('whatsapp') || k === 'wa') return getR2CdnUrl('/assets/logo/whatsapp-for-business.webp');
    if (k.includes('instagram') || k === 'ig') return getR2CdnUrl('/assets/logo/instagram.png');
    if (k.includes('shopee')) return getR2CdnUrl('/assets/logo/shopee.png');
    if (k.includes('tiktok')) return getR2CdnUrl('/assets/logo/tiktok.webp');
    if (k.includes('stripe')) return getR2CdnUrl('/assets/logo/stripe.webp');
    if (k.includes('midtrans')) return getR2CdnUrl('/assets/logo/Midtrans.png');
    if (k.includes('qris')) return getR2CdnUrl('/assets/logo/qris.webp');
    if (k.includes('x402') || k.includes('solana') || k.includes('usdc')) return getR2CdnUrl('/assets/logo/usdc.webp');
    return getR2CdnUrl('/assets/logo/zegalogo.png');
  };

  const primaryUrl = getCdnLogo(name, integrationKey);
  const fallbackUrl = '/assets/logo/zegalogo.png';
  const [src, setSrc] = useState(primaryUrl);

  useEffect(() => {
    setSrc(primaryUrl);
  }, [name, integrationKey]);

  return (
    <img 
      src={src} 
      onError={() => {
        if (src !== fallbackUrl) setSrc(fallbackUrl);
      }} 
      alt={name || 'Brand Logo'} 
      className="size-8 object-contain rounded-xl shadow-xs" 
    />
  );
}

export function IntegrationsTab({ triggerToast, integrationsList, webhookUrl: initialWebhookUrl, onRefresh }: IntegrationsTabProps) {
  const [showPublic, setShowPublic] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [currentWebhookUrl, setCurrentWebhookUrl] = useState(initialWebhookUrl || 'https://zega-ai.onrender.com/api/v1/webhook');
  const [isEditingWebhook, setIsEditingWebhook] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('Semua');

  // Config Modal State
  const [selectedIntegration, setSelectedIntegration] = useState<any | null>(null);
  const [configAccount, setConfigAccount] = useState('');
  const [configEndpoint, setConfigEndpoint] = useState('');
  const [configApiKey, setConfigApiKey] = useState('');
  const [configStatus, setConfigStatus] = useState('Terhubung');
  const [showModalSecret, setShowModalSecret] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Add Custom Integration Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Channel Penjualan');
  const [newAccount, setNewAccount] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // API Keys state
  const [publicApiKey, setPublicApiKey] = useState('');
  const [secretApiKey, setSecretApiKey] = useState('');
  const [isRegeneratingKeys, setIsRegeneratingKeys] = useState(false);

  useEffect(() => {
    if (initialWebhookUrl) {
      const clean = (!initialWebhookUrl || initialWebhookUrl.includes('app.zega.ai'))
        ? 'https://zega-ai.onrender.com/api/v1/webhook'
        : initialWebhookUrl;
      setCurrentWebhookUrl(clean);
    }

    // Fetch live API keys from backend
    const fetchApiKeys = async () => {
      try {
        const overview = await SupabaseDashboardService.getUmkmSettingsOverview();
        if (overview?.apiKeys) {
          if (overview.apiKeys.public_api_key) setPublicApiKey(overview.apiKeys.public_api_key);
          if (overview.apiKeys.secret_api_key) setSecretApiKey(overview.apiKeys.secret_api_key);
          if (overview.apiKeys.webhook_url) setCurrentWebhookUrl(overview.apiKeys.webhook_url);
        }
      } catch (e) {
        console.warn('Failed to fetch API keys in IntegrationsTab:', e);
      }
    };
    fetchApiKeys();
  }, [initialWebhookUrl]);

  const categories = ['Semua', 'Channel Penjualan', 'Social Commerce', 'Payment Gateway', 'Web3 Crypto'];

  const [localIntegrationsList, setLocalIntegrationsList] = useState<any[]>(integrationsList || []);

  useEffect(() => {
    if (integrationsList && Array.isArray(integrationsList)) {
      setLocalIntegrationsList(integrationsList);
    }
  }, [integrationsList]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`✓ ${label} berhasil disalin!`);
  };

  const handleToggleIntegration = async (key: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === 'Terhubung' ? 'Terputus' : 'Terhubung';
    // Optimistic UI update for 0ms latency
    setLocalIntegrationsList(prev => prev.map(item => {
      const itemKey = item.key || item.integration_key || item.id;
      if (itemKey === key) {
        return { ...item, status: newStatus };
      }
      return item;
    }));

    try {
      setLoadingKey(key);
      await SupabaseDashboardService.updateUmkmIntegrationStatus(key, newStatus);
      triggerToast(`✓ Status integrasi ${name} diubah menjadi ${newStatus}!`);
      onRefresh();
    } catch (e) {
      // Revert optimistic update on failure
      setLocalIntegrationsList(prev => prev.map(item => {
        const itemKey = item.key || item.integration_key || item.id;
        if (itemKey === key) {
          return { ...item, status: currentStatus };
        }
        return item;
      }));
      triggerToast(`✕ Gagal memperbarui status integrasi ${name}`);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleSaveWebhook = async () => {
    try {
      await SupabaseDashboardService.updateUmkmWebhookUrl(currentWebhookUrl);
      setIsEditingWebhook(false);
      triggerToast('✓ Webhook URL berhasil disimpan!');
      onRefresh();
    } catch (e) {
      triggerToast('✕ Gagal menyimpan Webhook URL');
    }
  };

  const handleRegenerateKeys = async () => {
    try {
      setIsRegeneratingKeys(true);
      const newKeys = await SupabaseDashboardService.regenerateUmkmApiKeys();
      setPublicApiKey(newKeys.public_api_key);
      setSecretApiKey(newKeys.secret_api_key);
      triggerToast('✓ API Keys baru berhasil di-generate!');
    } catch (e) {
      triggerToast('✕ Gagal me-regenerate API Keys');
    } finally {
      setIsRegeneratingKeys(false);
    }
  };

  const handleOpenConfigModal = (item: any) => {
    const key = item.key || item.integration_key || item.id || '';
    const name = item.name || item.integration_name || '';
    const account = item.account || item.account_identifier || '';
    const endpoint = item.api_endpoint || `https://zega-ai.onrender.com/api/v1/${key}/webhook`;
    const apiKey = item.api_key_masked || `${key}_live_••••••••••••34a1`;
    const status = item.status || 'Terhubung';

    setSelectedIntegration({ ...item, key, name, account, endpoint, apiKey, status });
    setConfigAccount(account);
    setConfigEndpoint(endpoint);
    setConfigApiKey(apiKey);
    setConfigStatus(status);
  };

  const handleSaveIntegrationConfig = async () => {
    if (!selectedIntegration) return;
    try {
      setIsSavingConfig(true);
      await SupabaseDashboardService.updateUmkmIntegrationConfig(selectedIntegration.key, {
        account_identifier: configAccount,
        api_endpoint: configEndpoint,
        api_key_masked: configApiKey,
        status: configStatus,
        name: selectedIntegration.name
      });
      triggerToast(`✓ Konfigurasi ${selectedIntegration.name} berhasil diperbarui!`);
      setSelectedIntegration(null);
      onRefresh();
    } catch (e) {
      triggerToast(`✕ Gagal menyimpan konfigurasi ${selectedIntegration.name}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAccount) {
      triggerToast('✕ Nama platform dan Identitas Akun wajib diisi!');
      return;
    }
    try {
      setIsAdding(true);
      const generatedKey = newKey.trim() ? newKey.trim().toLowerCase().replace(/\s+/g, '_') : newName.toLowerCase().replace(/\s+/g, '_');
      await SupabaseDashboardService.addUmkmIntegration({
        key: generatedKey,
        name: newName,
        category: newCategory,
        account_identifier: newAccount,
        api_endpoint: newEndpoint || `https://zega-ai.onrender.com/api/v1/${generatedKey}/webhook`
      });
      triggerToast(`✓ Integrasi ${newName} berhasil ditambahkan!`);
      setIsAddModalOpen(false);
      setNewName('');
      setNewKey('');
      setNewAccount('');
      setNewEndpoint('');
      onRefresh();
    } catch (err) {
      triggerToast('✕ Gagal menambahkan integrasi baru');
    } finally {
      setIsAdding(false);
    }
  };

  const resolveCategory = (item: any): string => {
    const key = (item.key || item.integration_key || item.id || '').toLowerCase();
    const name = (item.name || item.integration_name || '').toLowerCase();

    if (key === 'wa' || key.includes('whatsapp') || key === 'shopee' || name.includes('shopee') || name.includes('whatsapp')) {
      return 'Channel Penjualan';
    }
    if (key === 'ig' || key.includes('instagram') || key === 'tiktok' || name.includes('instagram') || name.includes('tiktok')) {
      return 'Social Commerce';
    }
    if (key === 'stripe' || key === 'midtrans' || key === 'qris' || name.includes('stripe') || name.includes('midtrans') || name.includes('qris')) {
      return 'Payment Gateway';
    }
    if (key === 'x402' || key.includes('solana') || key.includes('web3') || name.includes('x402') || name.includes('crypto')) {
      return 'Web3 Crypto';
    }

    const rawCat = (item.category || '').trim();
    if (rawCat && rawCat !== 'Integration Channel') return rawCat;
    
    return 'Channel Penjualan';
  };

  // Deduplicate Integrations List by key (driven by localIntegrationsList for optimistic UI)
  const uniqueIntegrationsMap = new Map<string, any>();
  localIntegrationsList.forEach(item => {
    const k = item.key || item.integration_key || item.id;
    if (k && !uniqueIntegrationsMap.has(k)) {
      const resolvedCat = resolveCategory(item);
      uniqueIntegrationsMap.set(k, {
        ...item,
        key: k,
        name: item.name || item.integration_name,
        account: item.account || item.account_identifier,
        category: resolvedCat
      });
    }
  });
  const uniqueIntegrationsList = Array.from(uniqueIntegrationsMap.values());

  // Filter List (Category + Search Query)
  const filteredIntegrations = uniqueIntegrationsList.filter(item => {
    const matchesSearch = searchQuery === '' || 
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.account || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeCategoryTab === 'Semua') return true;

    return item.category === activeCategoryTab;
  });

  const connectedCount = uniqueIntegrationsList.filter(i => i.status === 'Terhubung').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Executive Overview Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Link2 size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Ekosistem Integrasi & Multi-Channel ZEGA AI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Hubungkan akun social commerce, payment gateway, WhatsApp bot, dan endpoint Web3 Solana secara real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all"
          >
            <Plus size={15} />
            <span>Tambah Integrasi</span>
          </button>
          
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Zap size={14} className="text-emerald-500" />
            <span>Status Realtime: <strong className="text-emerald-600 dark:text-emerald-400">{connectedCount}/{uniqueIntegrationsList.length} Terhubung</strong></span>
          </div>
        </div>
      </div>

      {/* Search Bar & Category Pills */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Integrasi Terhubung & Saluran Penjualan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Kelola status koneksi dan credential API masing-masing penyedia layanan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari channel / platform..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map((cat) => {
                const isSelected = activeCategoryTab === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryTab(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
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
        </div>

        {/* Integration Cards Grid */}
        {filteredIntegrations.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs">
            Tidak ada integrasi yang cocok dengan pencarian &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredIntegrations.map((item) => {
              const name = item.name || item.integration_name || '';
              const key = item.key || item.integration_key || item.id || '';
              const account = item.account || item.account_identifier || '';
              const isConnected = item.status === 'Terhubung';

              return (
                <div
                  key={key}
                  className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all flex flex-col justify-between space-y-3.5 group"
                >
                  {/* Card Top Section: Brand Logo, Name & Config Gear */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shrink-0">
                        <IntegrationBrandLogo name={name} integrationKey={key} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                          {name}
                        </h4>
                        <p className="text-[10.5px] text-slate-400 font-medium truncate max-w-[130px] mt-0.5">
                          {account || '-'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleOpenConfigModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Konfigurasi Integrasi"
                    >
                      <Settings size={14} />
                    </button>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {item.status}
                    </span>

                    <button
                      disabled={loadingKey === key}
                      onClick={() => handleToggleIntegration(key, item.status, name)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        isConnected
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50'
                          : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xs'
                      }`}
                    >
                      {loadingKey === key ? (
                        <RefreshCw size={12} className="animate-spin inline mr-1" />
                      ) : null}
                      <span>{loadingKey === key ? 'Loading...' : isConnected ? 'Putuskan' : 'Hubungkan'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* API Keys & Webhook Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 flex items-center justify-center font-black">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                API Keys & Webhook Security
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Gunakan kunci API resmi ZEGA untuk integrasi server-to-server dan backend deployment.
              </p>
            </div>
          </div>

          <button
            disabled={isRegeneratingKeys}
            onClick={handleRegenerateKeys}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
          >
            <RefreshCw size={14} className={isRegeneratingKeys ? 'animate-spin' : ''} />
            <span>{isRegeneratingKeys ? 'Meng-generate...' : 'Generate Key Baru'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Public API Key */}
          <div className="space-y-2">
            <label className="block text-slate-500 dark:text-slate-400 font-bold">
              Public API Key (Client-side)
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showPublic ? 'text' : 'password'}
                readOnly
                value={publicApiKey}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => setShowPublic(!showPublic)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPublic ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleCopy(publicApiKey, 'Public API Key')}
                className="px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Copy size={14} />
                <span>Salin</span>
              </button>
            </div>
          </div>

          {/* Secret API Key */}
          <div className="space-y-2">
            <label className="block text-slate-500 dark:text-slate-400 font-bold">
              Secret API Key (Server-side)
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showSecret ? 'text' : 'password'}
                readOnly
                value={secretApiKey}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleCopy(secretApiKey, 'Secret API Key')}
                className="px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Copy size={14} />
                <span>Salin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Webhook URL Input */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <label className="block text-slate-500 dark:text-slate-400 font-bold">
            Webhook Endpoint URL (Production Backend)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly={!isEditingWebhook}
              value={currentWebhookUrl}
              onChange={e => setCurrentWebhookUrl(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border font-mono transition-all ${
                isEditingWebhook
                  ? 'border-orange-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
              }`}
            />
            {isEditingWebhook ? (
              <button
                onClick={handleSaveWebhook}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shrink-0 cursor-pointer shadow-xs"
              >
                Simpan
              </button>
            ) : (
              <button
                onClick={() => setIsEditingWebhook(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- INTEGRATION CONFIGURATION MODAL --- */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <IntegrationBrandLogo name={selectedIntegration.name} integrationKey={selectedIntegration.key} />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Konfigurasi Integrasi: {selectedIntegration.name}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">Atur akun, endpoint webhook, dan credential API</p>
                </div>
              </div>
              <button onClick={() => setSelectedIntegration(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Identitas Akun / Wallet / ID Merchant</label>
                <input
                  type="text"
                  value={configAccount}
                  onChange={e => setConfigAccount(e.target.value)}
                  placeholder="e.g. @username / Merchant ID / Phone No"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">API Endpoint / Webhook Callback</label>
                <input
                  type="text"
                  value={configEndpoint}
                  onChange={e => setConfigEndpoint(e.target.value)}
                  placeholder="https://zega-ai.onrender.com/api/v1/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">API Secret Key / Access Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showModalSecret ? 'text' : 'password'}
                    value={configApiKey}
                    onChange={e => setConfigApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalSecret(!showModalSecret)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showModalSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Status Koneksi</label>
                <select
                  value={configStatus}
                  onChange={e => setConfigStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="Terhubung">Terhubung (Active)</option>
                  <option value="Terputus">Terputus (Inactive)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedIntegration(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingConfig}
                onClick={handleSaveIntegrationConfig}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-sm shadow-orange-500/20 disabled:opacity-50"
              >
                {isSavingConfig ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD NEW INTEGRATION MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleCreateIntegration} className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Tambah Integrasi Baru
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">Hubungkan saluran e-commerce atau payment gateway tambahan</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Nama Platform / Service *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Tokopedia / Lazada / WooCommerce / Custom Webhook"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Integration Key (Unique)</label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    placeholder="e.g. tokopedia"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="Channel Penjualan">Channel Penjualan</option>
                    <option value="Social Commerce">Social Commerce</option>
                    <option value="Payment Gateway">Payment Gateway</option>
                    <option value="Web3 Crypto">Web3 Crypto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Identitas Akun / Username / Merchant ID *</label>
                <input
                  type="text"
                  required
                  value={newAccount}
                  onChange={e => setNewAccount(e.target.value)}
                  placeholder="e.g. @tokosaya / Merchant ID: 88291"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">API Endpoint / Webhook URL (Opsional)</label>
                <input
                  type="text"
                  value={newEndpoint}
                  onChange={e => setNewEndpoint(e.target.value)}
                  placeholder="https://zega-ai.onrender.com/api/v1/custom/webhook"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-sm shadow-orange-500/20 disabled:opacity-50"
              >
                {isAdding ? 'Menambahkan...' : 'Tambah Integrasi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
