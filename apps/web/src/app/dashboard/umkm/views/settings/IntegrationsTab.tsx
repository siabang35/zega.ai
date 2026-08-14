import React, { useState, useEffect } from 'react';
import { 
  Globe, Copy, Eye, EyeOff, Edit3, Key, ShieldCheck, Sparkles, ExternalLink, Settings, RefreshCw, X, Link2, Unlink, Server, Zap, Lock, CreditCard, ShoppingBag, MessageSquare, Search, Plus, Activity, Cpu, CheckCircle2
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';

interface IntegrationsTabProps {
  triggerToast: (msg: string) => void;
  integrationsList: any[];
  webhookUrl: string;
  onRefresh: () => void;
}

const DEFAULT_PRESET_INTEGRATIONS = [
  {
    key: 'wa',
    integration_key: 'wa',
    name: 'WhatsApp Business Bot',
    account: 'Belum dikonfigurasi (No. WhatsApp Toko)',
    category: 'Channel Penjualan',
    status: 'Terhubung',
    api_endpoint: 'https://zega-ai.onrender.com/api/v1/wa/webhook',
    api_key_masked: 'wa_live_••••••••••••34a1'
  },
  {
    key: 'shopee',
    integration_key: 'shopee',
    name: 'Shopee Official Store',
    account: 'Belum dikonfigurasi (ID Seller Shopee)',
    category: 'Channel Penjualan',
    status: 'Terhubung',
    api_endpoint: 'https://zega-ai.onrender.com/api/v1/shopee/webhook',
    api_key_masked: 'shp_live_••••••••••••99b2'
  },
  {
    key: 'tiktok',
    integration_key: 'tiktok',
    name: 'TikTok Shop Seller',
    account: 'Belum dikonfigurasi (Handle TikTok Shop)',
    category: 'Social Commerce',
    status: 'Terhubung',
    api_endpoint: 'https://zega-ai.onrender.com/api/v1/tiktok/webhook',
    api_key_masked: 'ttk_live_••••••••••••77c3'
  },
  {
    key: 'ig',
    integration_key: 'ig',
    name: 'Instagram Social Commerce',
    account: 'Belum dikonfigurasi (Handle IG Bisnis)',
    category: 'Social Commerce',
    status: 'Terhubung',
    api_endpoint: 'https://zega-ai.onrender.com/api/v1/ig/webhook',
    api_key_masked: 'ig_live_••••••••••••88d4'
  },
  {
    key: 'stripe',
    integration_key: 'stripe',
    name: 'Stripe Gateway',
    account: 'Belum dikonfigurasi (Stripe Merchant Account)',
    category: 'Payment Gateway',
    status: 'Terhubung',
    api_endpoint: 'https://zega-ai.onrender.com/api/v1/stripe/webhook',
    api_key_masked: 'sk_live_••••••••••••11e5'
  },
  {
    key: 'midtrans',
    integration_key: 'midtrans',
    name: 'Midtrans QRIS',
    account: 'Belum dikonfigurasi (Merchant ID Midtrans)',
    category: 'Payment Gateway',
    status: 'Terhubung',
    api_endpoint: 'https://zega-ai.onrender.com/api/v1/midtrans/webhook',
    api_key_masked: 'mdt_live_••••••••••••22f6'
  },
  {
    key: 'xendit',
    integration_key: 'xendit',
    name: 'Xendit Payment Gateway',
    account: 'Belum dikonfigurasi (Xendit Merchant ID)',
    category: 'Payment Gateway',
    status: 'Terhubung',
    api_endpoint: 'https://zega-ai.onrender.com/api/v1/xendit/webhook',
    api_key_masked: 'xnd_live_••••••••••••99x1'
  },
  {
    key: 'x402',
    integration_key: 'x402',
    name: 'x402 Protocol (Solana USDC Pay)',
    account: 'Belum dikonfigurasi (Wallet Solana Store)',
    category: 'Web3 Crypto',
    status: 'Terhubung',
    api_endpoint: 'https://zega-ai.onrender.com/api/v1/x402/webhook',
    api_key_masked: 'x402_live_••••••••••••55g7'
  }
];

function IntegrationBrandLogo({ name, integrationKey }: { name?: string; integrationKey?: string }) {
  const resolveLogoPaths = (n?: string, kStr?: string) => {
    const k = `${n || ''} ${kStr || ''}`.toLowerCase();
    let path = '/assets/logo/zegalogo.png';
    if (k.includes('whatsapp') || k === 'wa') path = '/assets/logo/whatsapp-for-business.webp';
    else if (k.includes('instagram') || k === 'ig') path = '/assets/logo/instagram.png';
    else if (k.includes('shopee')) path = '/assets/logo/shopee.png';
    else if (k.includes('tiktok')) path = '/assets/logo/tiktok.webp';
    else if (k.includes('stripe')) path = '/assets/logo/stripe.webp';
    else if (k.includes('midtrans')) path = '/assets/logo/Midtrans.png';
    else if (k.includes('xendit')) path = '/assets/logo/XENDIT-LOGO.png';
    else if (k.includes('qris')) path = '/assets/logo/qris.webp';
    else if (k.includes('x402')) path = '/assets/logo/x402.png';
    else if (k.includes('solana') || k.includes('usdc')) path = '/assets/logo/usdc.webp';

    return {
      cdnUrl: getR2CdnUrl(path),
      localUrl: path
    };
  };

  const { cdnUrl, localUrl } = resolveLogoPaths(name, integrationKey);
  const finalFallbackUrl = '/assets/logo/zegalogo.png';
  const [src, setSrc] = useState(localUrl); // Use local asset path as initial reliable source

  useEffect(() => {
    setSrc(localUrl);
  }, [name, integrationKey, localUrl]);

  return (
    <img 
      src={src} 
      onError={() => {
        if (src === localUrl && cdnUrl !== localUrl) {
          setSrc(cdnUrl);
        } else if (src !== finalFallbackUrl) {
          setSrc(finalFallbackUrl);
        }
      }} 
      alt={name || 'Brand Logo'} 
      className="size-8 object-contain rounded-xl shadow-xs" 
    />
  );
}

function formatAccountIdentifier(rawAccount: string, key: string, language: string): string {
  if (!rawAccount) return '-';
  const isUnconfigured = rawAccount.includes('Belum dikonfigurasi') || rawAccount.includes('Not configured') || rawAccount.includes('未配置');
  
  if (!isUnconfigured) return rawAccount;

  const keyLower = (key || '').toLowerCase();

  if (language === 'en') {
    if (keyLower.includes('wa')) return 'Not configured (Store WhatsApp No.)';
    if (keyLower.includes('shopee')) return 'Not configured (Shopee Seller ID)';
    if (keyLower.includes('tiktok')) return 'Not configured (TikTok Shop Handle)';
    if (keyLower.includes('ig')) return 'Not configured (Business IG Handle)';
    if (keyLower.includes('stripe')) return 'Not configured (Stripe Merchant Account)';
    if (keyLower.includes('midtrans')) return 'Not configured (Midtrans Merchant ID)';
    if (keyLower.includes('xendit')) return 'Not configured (Xendit Merchant ID)';
    if (keyLower.includes('x402') || keyLower.includes('solana')) return 'Not configured (Store Solana Wallet)';
    return 'Not configured';
  }

  if (language === 'zh') {
    if (keyLower.includes('wa')) return '未配置 (店铺 WhatsApp 号码)';
    if (keyLower.includes('shopee')) return '未配置 (Shopee 卖家 ID)';
    if (keyLower.includes('tiktok')) return '未配置 (TikTok Shop 账号)';
    if (keyLower.includes('ig')) return '未配置 (IG 商业账号)';
    if (keyLower.includes('stripe')) return '未配置 (Stripe 商家账户)';
    if (keyLower.includes('midtrans')) return '未配置 (Midtrans 商家 ID)';
    if (keyLower.includes('xendit')) return '未配置 (Xendit 商家 ID)';
    if (keyLower.includes('x402') || keyLower.includes('solana')) return '未配置 (店铺 Solana 钱包)';
    return '未配置';
  }

  // Indonesian default
  if (keyLower.includes('wa')) return 'Belum dikonfigurasi (No. WhatsApp Toko)';
  if (keyLower.includes('shopee')) return 'Belum dikonfigurasi (ID Seller Shopee)';
  if (keyLower.includes('tiktok')) return 'Belum dikonfigurasi (Handle TikTok Shop)';
  if (keyLower.includes('ig')) return 'Belum dikonfigurasi (Handle IG Bisnis)';
  if (keyLower.includes('stripe')) return 'Belum dikonfigurasi (Stripe Merchant Account)';
  if (keyLower.includes('midtrans')) return 'Belum dikonfigurasi (Merchant ID Midtrans)';
  if (keyLower.includes('xendit')) return 'Belum dikonfigurasi (Xendit Merchant ID)';
  if (keyLower.includes('x402') || keyLower.includes('solana')) return 'Belum dikonfigurasi (Wallet Solana Store)';
  return 'Belum dikonfigurasi';
}

export function IntegrationsTab({ triggerToast, integrationsList, webhookUrl: initialWebhookUrl, onRefresh }: IntegrationsTabProps) {
  const { t, language } = useLanguage();
  const i18n = t.settingsView?.integrationsTab || ({} as any);
  const kpiI18n = i18n.kpi || {};

  const [showPublic, setShowPublic] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [currentWebhookUrl, setCurrentWebhookUrl] = useState(initialWebhookUrl || 'https://zega-ai.onrender.com/api/v1/webhook');
  const [isEditingWebhook, setIsEditingWebhook] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');

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

  const categoryList: { key: string; label: string; internalName: string }[] = [
    { key: 'all', label: i18n.categories?.all || 'Semua', internalName: 'Semua' },
    { key: 'salesChannels', label: i18n.categories?.salesChannels || 'Channel Penjualan', internalName: 'Channel Penjualan' },
    { key: 'socialCommerce', label: i18n.categories?.socialCommerce || 'Social Commerce', internalName: 'Social Commerce' },
    { key: 'paymentGateway', label: i18n.categories?.paymentGateway || 'Payment Gateway', internalName: 'Payment Gateway' },
    { key: 'web3Crypto', label: i18n.categories?.web3Crypto || 'Web3 Crypto', internalName: 'Web3 Crypto' }
  ];

  // Populate localIntegrationsList with DB list or rich DEFAULT_PRESET_INTEGRATIONS if DB list is empty
  const [localIntegrationsList, setLocalIntegrationsList] = useState<any[]>(
    integrationsList && integrationsList.length > 0 ? integrationsList : DEFAULT_PRESET_INTEGRATIONS
  );

  useEffect(() => {
    if (integrationsList && Array.isArray(integrationsList) && integrationsList.length > 0) {
      setLocalIntegrationsList(integrationsList);
    } else {
      setLocalIntegrationsList(DEFAULT_PRESET_INTEGRATIONS);
    }
  }, [integrationsList]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    const template = i18n.toasts?.copied || '✓ {label} berhasil disalin!';
    triggerToast(template.replace('{label}', label));
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
      const template = i18n.toasts?.statusUpdated || '✓ Status integrasi {name} diubah menjadi {status}!';
      triggerToast(template.replace('{name}', name).replace('{status}', newStatus));
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
      const failTemplate = i18n.toasts?.statusUpdateFailed || '✕ Gagal memperbarui status integrasi {name}';
      triggerToast(failTemplate.replace('{name}', name));
    } finally {
      setLoadingKey(null);
    }
  };

  const handleSaveWebhook = async () => {
    try {
      await SupabaseDashboardService.updateUmkmWebhookUrl(currentWebhookUrl);
      setIsEditingWebhook(false);
      triggerToast(i18n.toasts?.webhookSaved || '✓ Webhook URL berhasil disimpan!');
      onRefresh();
    } catch (e) {
      triggerToast(i18n.toasts?.webhookSaveFailed || '✕ Gagal menyimpan Webhook URL');
    }
  };

  const handleRegenerateKeys = async () => {
    try {
      setIsRegeneratingKeys(true);
      const newKeys = await SupabaseDashboardService.regenerateUmkmApiKeys();
      setPublicApiKey(newKeys.public_api_key);
      setSecretApiKey(newKeys.secret_api_key);
      triggerToast(i18n.toasts?.keysGenerated || '✓ API Keys baru berhasil di-generate!');
    } catch (e) {
      triggerToast(i18n.toasts?.keysGenerateFailed || '✕ Gagal me-regenerate API Keys');
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
      const template = i18n.toasts?.configSaved || '✓ Konfigurasi {name} berhasil diperbarui!';
      triggerToast(template.replace('{name}', selectedIntegration.name));
      setSelectedIntegration(null);
      onRefresh();
    } catch (e) {
      const failTemplate = i18n.toasts?.configSaveFailed || '✕ Gagal menyimpan konfigurasi {name}';
      triggerToast(failTemplate.replace('{name}', selectedIntegration.name));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAccount) {
      triggerToast(i18n.toasts?.validationError || '✕ Nama platform dan Identitas Akun wajib diisi!');
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
      const template = i18n.toasts?.integrationAdded || '✓ Integrasi {name} berhasil ditambahkan!';
      triggerToast(template.replace('{name}', newName));
      setIsAddModalOpen(false);
      setNewName('');
      setNewKey('');
      setNewAccount('');
      setNewEndpoint('');
      onRefresh();
    } catch (err) {
      triggerToast(i18n.toasts?.integrationAddFailed || '✕ Gagal menambahkan integrasi baru');
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

  // Active Category Internal Name Target
  const selectedCatObj = categoryList.find(c => c.key === activeCategoryTab);
  const targetInternalCategory = selectedCatObj ? selectedCatObj.internalName : 'Semua';

  // Filter List (Category + Search Query)
  const filteredIntegrations = uniqueIntegrationsList.filter(item => {
    const matchesSearch = searchQuery === '' || 
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.account || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (targetInternalCategory === 'Semua') return true;

    return item.category === targetInternalCategory;
  });

  const connectedCount = uniqueIntegrationsList.filter(i => i.status === 'Terhubung').length;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. ENTERPRISE KPI METRIC CARDS TOP ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {kpiI18n.connectedServices || 'Connected Services'}
            </span>
            <div className="size-6 sm:size-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
              <Link2 size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {connectedCount}/{uniqueIntegrationsList.length}
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
            {kpiI18n.monthlyGrowth || '+2 this month'}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {kpiI18n.activePipelines || 'Active Data Pipelines'}
            </span>
            <div className="size-6 sm:size-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <Zap size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {connectedCount} Active
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 block truncate">
            {kpiI18n.lastSync || 'Real-time sync'}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {kpiI18n.systemLatency || 'System Latency'}
            </span>
            <div className="size-6 sm:size-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
              <Activity size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight text-purple-600 dark:text-purple-400">
            18ms
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
            {kpiI18n.healthyStatus || 'Healthy (18ms)'}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {kpiI18n.apiRateLimit || 'API Rate Limit'}
            </span>
            <div className="size-6 sm:size-7 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
              <Cpu size={13} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            99.98%
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
            {kpiI18n.operationalStatus || '100% Operational'}
          </span>
        </div>
      </div>

      {/* 2. EXECUTIVE OVERVIEW BANNER */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Link2 size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {i18n.bannerTitle || 'Ekosistem Integrasi & Multi-Channel ZEGA AI'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {i18n.bannerSubtitle || 'Hubungkan akun social commerce, payment gateway, WhatsApp bot, dan endpoint Web3 Solana secara real-time.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap max-w-full">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all whitespace-nowrap shrink-0"
          >
            <Plus size={15} />
            <span>{i18n.addIntegrationBtn || 'Tambah Integrasi'}</span>
          </button>
          
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
            <Zap size={14} className="text-emerald-500" />
            <span>{i18n.realtimeStatusLabel || 'Status Realtime:'} <strong className="text-emerald-600 dark:text-emerald-400">{connectedCount}/{uniqueIntegrationsList.length} {i18n.connectedText || 'Terhubung'}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH BAR & CATEGORY PILLS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {i18n.sectionTitle || 'Integrasi Terhubung & Saluran Penjualan'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {i18n.sectionSubtitle || 'Kelola status koneksi dan credential API masing-masing penyedia layanan.'}
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
                placeholder={i18n.searchPlaceholder || 'Cari channel / platform...'}
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
              {categoryList.map((catObj) => {
                const isSelected = activeCategoryTab === catObj.key;
                return (
                  <button
                    key={catObj.key}
                    onClick={() => setActiveCategoryTab(catObj.key)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {catObj.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. INTEGRATION CARDS GRID */}
        {filteredIntegrations.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs">
            {(i18n.noResults || 'Tidak ada integrasi yang cocok dengan pencarian "{query}".').replace('{query}', searchQuery)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredIntegrations.map((item) => {
              const name = item.name || item.integration_name || '';
              const key = item.key || item.integration_key || item.id || '';
              const account = item.account || item.account_identifier || '';
              const isConnected = item.status === 'Terhubung';
              const displayStatus = isConnected 
                ? (i18n.card?.statusConnected || 'Terhubung')
                : (i18n.card?.statusDisconnected || 'Terputus');

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
                          {formatAccountIdentifier(account, key, language)}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleOpenConfigModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title={i18n.card?.configTitle || 'Konfigurasi Integrasi'}
                    >
                      <Settings size={14} />
                    </button>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {displayStatus}
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
                      <span>
                        {loadingKey === key 
                          ? (i18n.card?.loading || 'Memuat...') 
                          : isConnected 
                            ? (i18n.card?.disconnectBtn || 'Putuskan') 
                            : (i18n.card?.connectBtn || 'Hubungkan')}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. API KEYS & WEBHOOK SECURITY SECTION */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 flex items-center justify-center font-black">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {i18n.apiSecurity?.title || 'API Keys & Webhook Security'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {i18n.apiSecurity?.subtitle || 'Gunakan kunci API resmi ZEGA untuk integrasi server-to-server dan backend deployment.'}
              </p>
            </div>
          </div>

          <button
            disabled={isRegeneratingKeys}
            onClick={handleRegenerateKeys}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
          >
            <RefreshCw size={14} className={isRegeneratingKeys ? 'animate-spin' : ''} />
            <span>{isRegeneratingKeys ? (i18n.apiSecurity?.generatingKeyBtn || 'Meng-generate...') : (i18n.apiSecurity?.generateKeyBtn || 'Generate Key Baru')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Public API Key */}
          <div className="space-y-2">
            <label className="block text-slate-500 dark:text-slate-400 font-bold">
              {i18n.apiSecurity?.publicApiKeyLabel || 'Public API Key (Client-side)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showPublic ? 'text' : 'password'}
                readOnly
                value={publicApiKey || 'zga_pk_live_••••••••••••34a1'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => setShowPublic(!showPublic)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPublic ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleCopy(publicApiKey || 'zga_pk_live_••••••••••••34a1', i18n.apiSecurity?.publicApiKeyLabel || 'Public API Key')}
                className="px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Copy size={14} />
                <span>{i18n.apiSecurity?.copyBtn || 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Secret API Key */}
          <div className="space-y-2">
            <label className="block text-slate-500 dark:text-slate-400 font-bold">
              {i18n.apiSecurity?.secretApiKeyLabel || 'Secret API Key (Server-side)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showSecret ? 'text' : 'password'}
                readOnly
                value={secretApiKey || 'zga_sk_live_••••••••••••88b2'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleCopy(secretApiKey || 'zga_sk_live_••••••••••••88b2', i18n.apiSecurity?.secretApiKeyLabel || 'Secret API Key')}
                className="px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Copy size={14} />
                <span>{i18n.apiSecurity?.copyBtn || 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Webhook URL Input */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <label className="block text-slate-500 dark:text-slate-400 font-bold">
            {i18n.apiSecurity?.webhookUrlLabel || 'Webhook Endpoint URL (Production Backend)'}
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
                {i18n.apiSecurity?.saveBtn || 'Simpan'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditingWebhook(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Edit3 size={14} />
                <span>{i18n.apiSecurity?.editBtn || 'Edit'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- INTEGRATION CONFIGURATION MODAL --- */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <IntegrationBrandLogo name={selectedIntegration.name} integrationKey={selectedIntegration.key} />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {i18n.configModal?.title || 'Konfigurasi Integrasi:'} {selectedIntegration.name}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    {i18n.configModal?.subtitle || 'Atur akun, endpoint webhook, dan credential API'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedIntegration(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {i18n.configModal?.accountLabel || 'Identitas Akun / Wallet / ID Merchant'}
                </label>
                <input
                  type="text"
                  value={configAccount}
                  onChange={e => setConfigAccount(e.target.value)}
                  placeholder={i18n.configModal?.accountPlaceholder || 'e.g. @username / Merchant ID / Phone No'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {i18n.configModal?.endpointLabel || 'API Endpoint / Webhook Callback'}
                </label>
                <input
                  type="text"
                  value={configEndpoint}
                  onChange={e => setConfigEndpoint(e.target.value)}
                  placeholder={i18n.configModal?.endpointPlaceholder || 'https://zega-ai.onrender.com/api/v1/...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {i18n.configModal?.apiKeyLabel || 'API Secret Key / Access Token'}
                </label>
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
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {i18n.configModal?.statusLabel || 'Status Koneksi'}
                </label>
                <select
                  value={configStatus}
                  onChange={e => setConfigStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="Terhubung">{i18n.configModal?.statusConnected || 'Terhubung (Active)'}</option>
                  <option value="Terputus">{i18n.configModal?.statusDisconnected || 'Terputus (Inactive)'}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedIntegration(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100"
              >
                {i18n.configModal?.cancelBtn || 'Batal'}
              </button>
              <button
                type="button"
                disabled={isSavingConfig}
                onClick={handleSaveIntegrationConfig}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-sm shadow-orange-500/20 disabled:opacity-50"
              >
                {isSavingConfig ? (i18n.configModal?.savingBtn || 'Menyimpan...') : (i18n.configModal?.saveBtn || 'Simpan Konfigurasi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD NEW INTEGRATION MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleCreateIntegration} className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {i18n.addModal?.title || 'Tambah Integrasi Baru'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    {i18n.addModal?.subtitle || 'Hubungkan saluran e-commerce atau payment gateway tambahan'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {i18n.addModal?.nameLabel || 'Nama Platform / Service *'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={i18n.addModal?.namePlaceholder || 'e.g. Tokopedia / Lazada / WooCommerce / Custom Webhook'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {i18n.addModal?.keyLabel || 'Integration Key (Unique)'}
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    placeholder={i18n.addModal?.keyPlaceholder || 'e.g. tokopedia'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {i18n.addModal?.categoryLabel || 'Kategori'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="Channel Penjualan">{i18n.categories?.salesChannels || 'Channel Penjualan'}</option>
                    <option value="Social Commerce">{i18n.categories?.socialCommerce || 'Social Commerce'}</option>
                    <option value="Payment Gateway">{i18n.categories?.paymentGateway || 'Payment Gateway'}</option>
                    <option value="Web3 Crypto">{i18n.categories?.web3Crypto || 'Web3 Crypto'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {i18n.addModal?.accountLabel || 'Identitas Akun / Username / Merchant ID *'}
                </label>
                <input
                  type="text"
                  required
                  value={newAccount}
                  onChange={e => setNewAccount(e.target.value)}
                  placeholder={i18n.addModal?.accountPlaceholder || 'e.g. @tokosaya / Merchant ID: 88291'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  {i18n.addModal?.endpointLabel || 'API Endpoint / Webhook URL (Opsional)'}
                </label>
                <input
                  type="text"
                  value={newEndpoint}
                  onChange={e => setNewEndpoint(e.target.value)}
                  placeholder={i18n.addModal?.endpointPlaceholder || 'https://zega-ai.onrender.com/api/v1/custom/webhook'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100"
              >
                {i18n.addModal?.cancelBtn || 'Batal'}
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-sm shadow-orange-500/20 disabled:opacity-50"
              >
                {isAdding ? (i18n.addModal?.addingBtn || 'Menambahkan...') : (i18n.addModal?.addBtn || 'Tambah Integrasi')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
