import React, { useState } from 'react';
import { 
  Copy, Check, ChevronRight, ShieldCheck, Key, Globe, Clock, 
  DollarSign, Calendar, Sliders, ExternalLink, Plus 
} from 'lucide-react';

interface SettingsViewProps {
  triggerToast: (msg: string) => void;
}

// Brand SVG Icons for Settings Integrations
const IntegrationLogos = {
  whatsapp: (
    <svg className="size-6 text-emerald-500 fill-current" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.157 4.228 4.23-1.107z"/>
    </svg>
  ),
  instagram: (
    <svg className="size-6 text-pink-500 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  shopee: (
    <svg className="size-6 text-orange-500 fill-current" viewBox="0 0 24 24">
      <path d="M19.8 8.2h-3.3C16.1 5 13.8 2.5 12 2.5S7.9 5 7.5 8.2H4.2c-.7 0-1.2.6-1.2 1.3l1.2 11.5c.1.9.8 1.5 1.7 1.5h12.2c.9 0 1.6-.6 1.7-1.5l1.2-11.5c0-.7-.5-1.3-1.2-1.3zm-7.8-3.7c1.1 0 2.6 1.9 3 3.7H9c.4-1.8 1.9-3.7 3-3.7zm0 13c-2.3 0-4-1.2-4.1-2.6h1.9c.1.6 1 1.1 2.2 1.1 1.3 0 2.2-.6 2.2-1.3 0-.7-.7-1.1-2.2-1.5-2.2-.6-3.8-1.2-3.8-2.9 0-1.6 1.6-2.8 3.8-2.8s3.8 1.2 3.9 2.6h-1.9c-.1-.6-.9-1.1-2-1.1-1.2 0-2 .5-2 1.2 0 .6.7 1 2.2 1.4 2.3.6 3.8 1.3 3.8 3 0 1.6-1.6 2.9-4 2.9z"/>
    </svg>
  ),
  tiktok: (
    <div className="size-7 rounded-lg bg-slate-950 text-white font-bold text-xs flex items-center justify-center border border-slate-800">
      🎵
    </div>
  ),
  stripe: (
    <div className="size-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
      S
    </div>
  ),
  midtrans: (
    <div className="size-7 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
      M
    </div>
  ),
  qris: (
    <div className="size-7 rounded-lg bg-slate-950 text-white font-black text-[9px] flex items-center justify-center border border-slate-800">
      QRIS
    </div>
  ),
  x402: (
    <div className="size-7 rounded-lg bg-slate-900 text-slate-100 font-mono font-bold text-[9px] flex items-center justify-center border border-slate-700">
      x402
    </div>
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
