import React, { useState } from 'react';
import { Globe, Copy, Check, Eye, EyeOff, Edit3, Key, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
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
    if (k.includes('x402')) return getR2CdnUrl('/assets/logo/usdc.webp');
    return getR2CdnUrl('/assets/logo/zegalogo.png');
  };

  const primaryUrl = getCdnLogo(name, integrationKey);
  const fallbackUrl = '/assets/logo/zegalogo.png';
  const [src, setSrc] = useState(primaryUrl);

  return (
    <img 
      src={src} 
      onError={() => setSrc(fallbackUrl)} 
      alt={name || 'Brand Logo'} 
      className="size-7 object-contain rounded-lg" 
    />
  );
}

export function IntegrationsTab({ triggerToast, integrationsList, webhookUrl: initialWebhookUrl, onRefresh }: IntegrationsTabProps) {
  const [showPublic, setShowPublic] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [currentWebhookUrl, setCurrentWebhookUrl] = useState(initialWebhookUrl);
  const [isEditingWebhook, setIsEditingWebhook] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const publicApiKey = (import.meta.env.VITE_ZEGA_PUBLIC_API_KEY as string) || 'zga_pk_live_client_key';
  const secretApiKey = '••••••••••••••••••••••••••••••••';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`✓ ${label} berhasil disalin!`);
  };

  const handleToggleIntegration = async (key: string, currentStatus: string, name: string) => {
    try {
      setLoadingKey(key);
      const newStatus = currentStatus === 'Terhubung' ? 'Terputus' : 'Terhubung';
      await SupabaseDashboardService.updateUmkmIntegrationStatus(key, newStatus);
      triggerToast(`✓ Status integrasi ${name} diubah menjadi ${newStatus}!`);
      onRefresh();
    } catch (e) {
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

  return (
    <div className="space-y-6">
      {/* Active Integrations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Integrasi Terhubung & Saluran Penjualan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Hubungkan WhatsApp, Social Media E-commerce, dan Gateway Pembayaran.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrationsList.map((item) => {
            const name = item.name || item.integration_name || '';
            const key = item.key || item.integration_key || item.id || '';
            const account = item.account || item.account_identifier || '';
            const isConnected = item.status === 'Terhubung';

            return (
              <div
                key={key}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/60 shadow-xs transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <IntegrationBrandLogo name={name} integrationKey={key} />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                        {name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                        {account}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                  <button
                    disabled={loadingKey === key}
                    onClick={() => handleToggleIntegration(key, item.status, name)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                      isConnected
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {loadingKey === key ? 'Loading...' : isConnected ? 'Putuskan' : 'Hubungkan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Keys & Webhook Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 flex items-center justify-center font-black">
            <Key size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              API Keys & Webhook Security
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Gunakan kunci API resmi ZEGA untuk integrasi server-to-server dan webhook.
            </p>
          </div>
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
                className="px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1 cursor-pointer"
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
                className="px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1 cursor-pointer"
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
            Webhook Endpoint URL
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
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shrink-0 cursor-pointer"
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
    </div>
  );
}
