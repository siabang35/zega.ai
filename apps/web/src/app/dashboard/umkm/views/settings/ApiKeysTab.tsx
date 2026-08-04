import React, { useState, useEffect } from 'react';
import {
  Key, ShieldCheck, Clock, Ban, Eye, EyeOff, Copy, Plus, Search, Filter,
  CheckCircle2, Info, ExternalLink, Shield, Edit, MoreVertical, RefreshCw, Trash2
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';

interface ApiKeysTabProps {
  triggerToast: (msg: string) => void;
}

export function ApiKeysTab({ triggerToast }: ApiKeysTabProps) {
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  // Reveal & Modal states
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDesc, setNewKeyDesc] = useState('');
  const [newKeyScope, setNewKeyScope] = useState('Full Access');
  const [createdTokenModal, setCreatedTokenModal] = useState<string | null>(null);

  // Kebab menu state
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmApiKeysList();
      if (data && data.length > 0) {
        setApiKeys(data);
      } else {
        // Mock fallback matching design screenshot if database initial empty
        setApiKeys([
          { id: '1', name: 'Integrasi Midtrans', description: 'Pembayaran invoice', key_prefix: 'zga_live_', key_token: 'zga_live_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c', access_scope: 'Billing, Invoice', created_at: '28 Mei 2026 10:24 WIB', last_used_at: 'Hari ini, 10:24 WIB', status: 'Aktif' },
          { id: '2', name: 'Webhook Shopee', description: 'Sinkronisasi pesanan', key_prefix: 'zga_live_', key_token: 'zga_live_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', access_scope: 'Store, Orders', created_at: '20 Mei 2026 14:32 WIB', last_used_at: 'Kemarin, 16:15 WIB', status: 'Aktif' },
          { id: '3', name: 'Laporan Analytics', description: 'Akses data analitik', key_prefix: 'zga_live_', key_token: 'zga_live_8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c', access_scope: 'Reports', created_at: '15 Mei 2026 09:10 WIB', last_used_at: '2 hari lalu, 11:20 WIB', status: 'Aktif' },
          { id: '4', name: 'Automation External App', description: 'Trigger automation', key_prefix: 'zga_live_', key_token: 'zga_live_7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d', access_scope: 'Automation', created_at: '10 Mei 2026 08:45 WIB', last_used_at: '3 hari lalu, 09:02 WIB', status: 'Aktif' },
          { id: '5', name: 'Partner Dashboard', description: 'Akses dashboard partner', key_prefix: 'zga_live_', key_token: 'zga_live_3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f', access_scope: 'Dashboard', created_at: '2 Mei 2026 13:22 WIB', last_used_at: '14 Mei 2026, 10:11 WIB', status: 'Kedaluwarsa' },
          { id: '6', name: 'Lama Test App', description: 'Testing (dicabut)', key_prefix: 'zga_live_', key_token: 'zga_live_0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c', access_scope: 'Full Access', created_at: '18 Apr 2026 16:40 WIB', last_used_at: '5 Mei 2026, 12:00 WIB', status: 'Dicabut' }
        ]);
      }
    } catch (e) {
      console.warn('API Keys fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  // Compute metrics
  const totalCount = apiKeys.length;
  const activeCount = apiKeys.filter(k => k.status === 'Aktif').length;
  const expiredCount = apiKeys.filter(k => k.status === 'Kedaluwarsa').length;
  const revokedCount = apiKeys.filter(k => k.status === 'Dicabut').length;

  // Filtered keys
  const filteredKeys = apiKeys.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          item.access_scope.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Semua Status' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleRevealKey = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyKey = (token: string) => {
    navigator.clipboard.writeText(token);
    triggerToast('✓ API Key berhasil disalin ke clipboard!');
  };

  const handleRevokeKey = async (id: string, name: string) => {
    try {
      await SupabaseDashboardService.updateUmkmApiKeyStatus(id, 'Dicabut');
      setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'Dicabut' } : k));
      triggerToast(`✓ API Key "${name}" berhasil dicabut.`);
    } catch (e) {
      triggerToast('✕ Gagal mencabut API Key.');
    } finally {
      setOpenKebabId(null);
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    try {
      await SupabaseDashboardService.deleteUmkmApiKey(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
      triggerToast(`✓ API Key "${name}" berhasil dihapus.`);
    } catch (e) {
      triggerToast('✕ Gagal menghapus API Key.');
    } finally {
      setOpenKebabId(null);
    }
  };

  const handleCreateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) {
      triggerToast('✕ Harap isi nama API Key!');
      return;
    }

    try {
      const res = await SupabaseDashboardService.createUmkmApiKey({
        name: newKeyName,
        description: newKeyDesc,
        access_scope: newKeyScope
      });

      if (res.record) {
        setApiKeys(prev => [res.record, ...prev]);
        setCreatedTokenModal(res.fullToken);
        triggerToast('✓ API Key baru berhasil dibuat!');
      }
    } catch (e) {
      triggerToast('✕ Gagal membuat API Key baru.');
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewKeyName('');
    setNewKeyDesc('');
    setNewKeyScope('Full Access');
    setCreatedTokenModal(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Primary Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            API Keys
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Kelola API Keys Anda untuk mengakses layanan ZEGA AI melalui integrasi dan aplikasi pihak ketiga.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Buat API Key</span>
        </button>
      </div>

      {/* 2. Top Info Notice Card */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
            <Info size={16} />
          </div>
          <p className="text-blue-900 dark:text-blue-200 font-semibold leading-relaxed">
            <strong>API Key digunakan untuk mengautentikasi permintaan ke API ZEGA AI.</strong> Jangan bagikan API Key Anda. Anda bertanggung jawab penuh atas penggunaannya.
          </p>
        </div>

        <button
          onClick={() => triggerToast('✓ Membuka Dokumentasi API ZEGA AI...')}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-extrabold text-xs hover:bg-blue-50 cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <span>Pelajari Dokumentasi</span>
          <ExternalLink size={13} />
        </button>
      </div>

      {/* 3. 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total API Keys */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 flex items-center justify-center shrink-0 font-black">
            <Key size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block">Total API Keys</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{totalCount}</span>
            <span className="text-[10px] text-slate-400 font-medium ml-1.5">Semua waktu</span>
          </div>
        </div>

        {/* Card 2: API Keys Aktif */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 font-black">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block">API Keys Aktif</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{activeCount}</span>
            <span className="text-[10px] text-slate-400 font-medium ml-1.5">Sedang digunakan</span>
          </div>
        </div>

        {/* Card 3: API Keys Kedaluwarsa */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 flex items-center justify-center shrink-0 font-black">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block">API Keys Kedaluwarsa</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{expiredCount}</span>
            <span className="text-[10px] text-slate-400 font-medium ml-1.5">Perlu diperbarui</span>
          </div>
        </div>

        {/* Card 4: API Keys Dicabut */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 flex items-center justify-center shrink-0 font-black">
            <Ban size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block">API Keys Dicabut</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">{revokedCount}</span>
            <span className="text-[10px] text-slate-400 font-medium ml-1.5">Tidak aktif</span>
          </div>
        </div>
      </div>

      {/* 4. Split Main Content & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Table Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            {/* Table Filters Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Daftar API Keys
              </h3>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  <option value="Semua Status">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Kedaluwarsa">Kedaluwarsa</option>
                  <option value="Dicabut">Dicabut</option>
                </select>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari API Key..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-orange-500 w-44"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                    <th className="pb-3">NAMA / DESKRIPSI</th>
                    <th className="pb-3">KEY</th>
                    <th className="pb-3">AKSES</th>
                    <th className="pb-3">DIBUAT</th>
                    <th className="pb-3">TERAKHIR DIGUNAKAN</th>
                    <th className="pb-3">STATUS</th>
                    <th className="pb-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredKeys.map((item) => {
                    const isRevealed = revealedKeys[item.id];
                    const maskedToken = `${item.key_prefix || 'zga_live_'}•••••••••••••`;
                    const displayToken = isRevealed ? (item.key_token || maskedToken) : maskedToken;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                        {/* Name / Desc */}
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-bold shrink-0">
                              <Key size={14} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</h4>
                              <p className="text-[10px] text-slate-400 font-medium">{item.description}</p>
                            </div>
                          </div>
                        </td>

                        {/* Key */}
                        <td className="py-3 pr-2 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">{displayToken}</span>
                            <button
                              onClick={() => toggleRevealKey(item.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title={isRevealed ? 'Sembunyikan' : 'Tampilkan'}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              onClick={() => handleCopyKey(item.key_token || displayToken)}
                              className="p-1 text-slate-400 hover:text-orange-500 cursor-pointer"
                              title="Salin Key"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </td>

                        {/* Akses */}
                        <td className="py-3 pr-2 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                          {item.access_scope}
                        </td>

                        {/* Dibuat */}
                        <td className="py-3 pr-2 text-slate-400 text-[10px]">
                          {item.created_at}
                        </td>

                        {/* Terakhir Digunakan */}
                        <td className="py-3 pr-2 text-slate-500 text-[11px]">
                          {item.last_used_at}
                        </td>

                        {/* Status */}
                        <td className="py-3 pr-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            item.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : item.status === 'Kedaluwarsa'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right relative">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => triggerToast(`✓ Mengedit API Key "${item.name}"...`)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setOpenKebabId(openKebabId === item.id ? null : item.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>

                          {/* Kebab Dropdown */}
                          {openKebabId === item.id && (
                            <div className="absolute right-0 top-10 z-20 w-36 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-left text-xs font-semibold">
                              {item.status !== 'Dicabut' && (
                                <button
                                  onClick={() => handleRevokeKey(item.id, item.name)}
                                  className="w-full px-3 py-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer"
                                >
                                  <Ban size={13} /> Cabut Key
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteKey(item.id, item.name)}
                                className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} /> Hapus Key
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar Cards (1 Col) */}
        <div className="space-y-6">
          {/* 1. Tentang API Keys */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Tentang API Keys</h4>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              API Key memungkinkan Anda untuk mengakses API ZEGA AI secara aman.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
                <span>Gunakan minimal privilege</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
                <span>Jangan bagikan API Key</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
                <span>Rotasi key secara berkala</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
                <span>Pantau penggunaan secara rutin</span>
              </li>
            </ul>
          </div>

          {/* 2. Batasan Penggunaan */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Batasan Penggunaan</h4>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  <span>API Calls / Bulan</span>
                  <span className="font-mono text-orange-600 font-black">45.231 / 100.000</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[45%]" />
                </div>
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-400 font-medium">Rate Limit</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">120 requests / menit</span>
              </div>

              <div className="flex justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-slate-400 font-medium">Batasan Aktif</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">4 dari 10 key</span>
              </div>
            </div>

            <button
              onClick={() => triggerToast('✓ Memuat analisis kuota API lengkap...')}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
            >
              Lihat Detail Penggunaan
            </button>
          </div>

          {/* 3. Sumber Daya */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Sumber Daya</h4>
            <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <a
                href="#docs"
                onClick={(e) => { e.preventDefault(); triggerToast('✓ Membuka Dokumentasi API...'); }}
                className="flex items-center justify-between hover:text-orange-500 transition-colors"
              >
                <span>Dokumentasi API</span>
                <ExternalLink size={13} />
              </a>
              <a
                href="#guide"
                onClick={(e) => { e.preventDefault(); triggerToast('✓ Membuka Panduan Integrasi...'); }}
                className="flex items-center justify-between hover:text-orange-500 transition-colors border-t border-slate-100 dark:border-slate-800 pt-2"
              >
                <span>Panduan Integrasi</span>
                <ExternalLink size={13} />
              </a>
              <a
                href="#code"
                onClick={(e) => { e.preventDefault(); triggerToast('✓ Membuka Repositori Contoh Kode...'); }}
                className="flex items-center justify-between hover:text-orange-500 transition-colors border-t border-slate-100 dark:border-slate-800 pt-2"
              >
                <span>Contoh Kode</span>
                <ExternalLink size={13} />
              </a>
              <a
                href="#status"
                onClick={(e) => { e.preventDefault(); triggerToast('✓ Membuka Status API Service...'); }}
                className="flex items-center justify-between hover:text-orange-500 transition-colors border-t border-slate-100 dark:border-slate-800 pt-2"
              >
                <span>Status API</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Security Footer Banner */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Shield size={16} className="text-orange-500" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">
            <strong>Keamanan adalah prioritas kami.</strong> Semua API request dienkripsi menggunakan HTTPS. Pelajari lebih lanjut di dokumentasi keamanan.
          </p>
        </div>
        <ExternalLink size={14} className="text-slate-400 cursor-pointer hover:text-orange-500" />
      </div>

      {/* 6. "+ Buat API Key" Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Buat API Key Baru</h3>
              <button onClick={closeCreateModal} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {createdTokenModal ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <h4 className="font-black text-emerald-700 dark:text-emerald-300">✓ API Key Berhasil Dibuat!</h4>
                  <p className="text-emerald-800 dark:text-emerald-200">
                    Harap simpan key ini di tempat aman. Kunci ini hanya akan ditampilkan sekali ini saja.
                  </p>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{createdTokenModal}</span>
                    <button
                      onClick={() => handleCopyKey(createdTokenModal)}
                      className="px-2 py-1 rounded bg-orange-500 text-white font-bold text-[10px]"
                    >
                      Salin
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={closeCreateModal}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKeySubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Nama API Key</label>
                  <input
                    type="text"
                    required
                    placeholder="cth. Integrasi Midtrans Prod"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Deskripsi Singkat</label>
                  <input
                    type="text"
                    placeholder="cth. Digunakan untuk sinkronisasi webhook transaksi"
                    value={newKeyDesc}
                    onChange={e => setNewKeyDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Cakupan Akses (Scope)</label>
                  <select
                    value={newKeyScope}
                    onChange={e => setNewKeyScope(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Full Access">Full Access</option>
                    <option value="Billing, Invoice">Billing & Invoice</option>
                    <option value="Store, Orders">Store & Orders</option>
                    <option value="Reports">Reports</option>
                    <option value="Automation">Automation</option>
                    <option value="Dashboard">Dashboard</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer"
                  >
                    Buat Key Now
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
