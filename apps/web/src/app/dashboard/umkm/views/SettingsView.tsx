import React, { useState } from 'react';
import { 
  Copy, Check, ChevronRight, ShieldCheck, Key, Globe, Clock, 
  DollarSign, Calendar, Sliders, ExternalLink, Plus 
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';

interface SettingsViewProps {
  triggerToast: (msg: string) => void;
}

// Brand SVG & CDN Image Logos for Settings Integrations
const IntegrationLogos = {
  whatsapp: (
    <img src={getR2CdnUrl('/assets/logo/whatsapp-for-business.webp')} className="size-6 object-contain" alt="WhatsApp Business" />
  ),
  instagram: (
    <img src={getR2CdnUrl('/assets/logo/instagram.png')} className="size-6 object-contain" alt="Instagram" />
  ),
  shopee: (
    <img src={getR2CdnUrl('/assets/logo/shopee.png')} className="size-6 object-contain" alt="Shopee" />
  ),
  tiktok: (
    <svg className="size-5.5 text-slate-900 dark:text-slate-100 fill-current" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 11-5.2-1.74 2.89 2.89 0 012.31-1.39V9.06a6.34 6.34 0 00-6.13 6.33A6.33 6.33 0 009.68 21.7a6.33 6.33 0 006.33-6.33V9.3a8.16 8.16 0 004.83 1.57V7.42a4.85 4.85 0 01-1.25-.73z"/>
    </svg>
  ),
  stripe: (
    <img src={getR2CdnUrl('/assets/visualization/stripe.webp')} className="h-4.5 w-auto object-contain" alt="Stripe" />
  ),
  midtrans: (
    <img src={getR2CdnUrl('/assets/logo/Midtrans.png')} className="h-4 w-auto object-contain" alt="Midtrans" />
  ),
  qris: (
    <img src={getR2CdnUrl('/assets/logo/qris.webp')} className="h-4.5 w-auto object-contain" alt="QRIS" />
  ),
  x402: (
    <img src={getR2CdnUrl('/assets/visualization/x402.jpg')} className="size-6 object-contain rounded-md" alt="x402 Protocol" />
  )
};

export function SettingsView({ triggerToast }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('Integrasi');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const tabs = [
    'Profil',
    'Tim & Pengguna',
    'Integrasi',
    'AI Preferences',
    'Notifikasi',
    'Keamanan',
    'Billing & Invoice',
  ];

  const integrations = [
    {
      id: 'wa',
      name: 'WhatsApp Business',
      status: 'Terhubung',
      account: '+62 812-3456-7890',
      logo: IntegrationLogos.whatsapp,
    },
    {
      id: 'ig',
      name: 'Instagram',
      status: 'Terhubung',
      account: '@tokowildan.id',
      logo: IntegrationLogos.instagram,
    },
    {
      id: 'shopee',
      name: 'Shopee',
      status: 'Terhubung',
      account: 'tokowildan.id',
      logo: IntegrationLogos.shopee,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      status: 'Terhubung',
      account: '@tokowildan.id',
      logo: IntegrationLogos.tiktok,
    },
    {
      id: 'stripe',
      name: 'Stripe Connect',
      status: 'Terhubung',
      account: '•••• •••• 4242',
      logo: IntegrationLogos.stripe,
    },
    {
      id: 'midtrans',
      name: 'Midtrans',
      status: 'Terhubung',
      account: 'Merchant ID: 01234567',
      logo: IntegrationLogos.midtrans,
    },
    {
      id: 'qris',
      name: 'QRIS (VA)',
      status: 'Terhubung',
      account: 'Bank Permata •••• 8888',
      logo: IntegrationLogos.qris,
    },
    {
      id: 'x402',
      name: 'x402 Network',
      status: 'Terhubung',
      account: 'Wallet: 0x773...a9b2',
      logo: IntegrationLogos.x402,
    },
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    triggerToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Kelola pengaturan akun, tim, integrasi, dan preferensi.
        </p>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200/80 dark:border-slate-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Section 1: Integrasi Terhubung */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Integrasi Terhubung</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola koneksi layanan dan channel bisnis Anda.
          </p>
        </div>

        {/* Grid of 8 Connected Integrations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((item) => (
            <div 
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs hover:border-orange-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  {item.logo}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">
                      {item.name}
                    </h3>
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[120px]">
                    {item.account}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => triggerToast(`Managing ${item.name} settings...`)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Kelola
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Keamanan API & Preferensi Sistem (2 Columns) */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Card: Keamanan API (col-span-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Keamanan API
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola API Key untuk integrasi dan akses developer.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Public API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Public API Key</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value="pk_19e_****************" 
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-mono text-slate-600 dark:text-slate-300 outline-none"
                />
                <button 
                  onClick={() => handleCopy('pk_19e_9841284192419241', 'Public API Key')}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                >
                  <Copy size={14} />
                </button>
                <button 
                  onClick={() => triggerToast('New Public API Key generated')}
                  className="py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Buat Baru
                </button>
              </div>
            </div>

            {/* Secret API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Secret API Key</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value="sk_19e_****************" 
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-mono text-slate-600 dark:text-slate-300 outline-none"
                />
                <button 
                  onClick={() => handleCopy('sk_19e_8124912481924812', 'Secret API Key')}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                >
                  <Copy size={14} />
                </button>
                <button 
                  onClick={() => triggerToast('New Secret API Key generated')}
                  className="py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Buat Baru
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => triggerToast('Opening API Documentation...')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Lihat Dokumentasi API &gt;
            </button>
          </div>
        </div>

        {/* Right Card: Preferensi Sistem (col-span-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Preferensi Sistem
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pengaturan zona waktu, bahasa, dan format tampilan.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              { label: 'Zona Waktu', val: 'Asia/Jakarta (WIB)' },
              { label: 'Bahasa', val: 'Bahasa Indonesia' },
              { label: 'Mata Uang', val: 'IDR - Rupiah' },
              { label: 'Format Tanggal', val: 'DD MMM YYYY' },
              { label: 'Format Angka', val: '1.234.567,89' },
            ].map((pref, i) => (
              <div 
                key={i} 
                onClick={() => triggerToast(`Changing ${pref.label}...`)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <span className="font-medium text-slate-600 dark:text-slate-400">{pref.label}</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <span>{pref.val}</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={() => triggerToast('Pengaturan berhasil disimpan!')}
          className="py-3 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus size={16} /> Simpan Perubahan
        </button>
      </div>

    </div>
  );
}
