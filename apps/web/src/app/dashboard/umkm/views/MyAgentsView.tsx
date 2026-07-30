import React, { useState } from 'react';
import { 
  Bot, Plus, Search, ChevronDown, LayoutGrid, List, 
  CheckCircle2, Clock, DollarSign, Megaphone, FileText, 
  Store, Users, AlertCircle, ShoppingBag, Sparkles 
} from 'lucide-react';

interface MyAgentsViewProps {
  triggerToast: (msg: string) => void;
}

export function MyAgentsView({ triggerToast }: MyAgentsViewProps) {
  const [filterTab, setFilterTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const employees = [
    {
      id: 'cs',
      name: 'Customer Service AI',
      desc: 'Membalas chat pelanggan di WhatsApp, Instagram, dan Shopee.',
      status: 'Aktif',
      statusType: 'active',
      icon: Bot,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      m1Label: 'Hari Ini',
      m1Val: '125 chats',
      m2Label: 'Selesai',
      m2Val: '118 (94%)',
      m3Label: 'Waktu Aktif',
      m3Val: '8.2 jam',
    },
    {
      id: 'mkt',
      name: 'Marketing AI',
      desc: 'Membuat konten, posting IG, TikTok, dan kelola campaign.',
      status: 'Aktif',
      statusType: 'active',
      icon: Megaphone,
      iconBg: 'bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400',
      m1Label: 'Konten Dibuat',
      m1Val: '12 post',
      m2Label: 'Campaign',
      m2Val: '3 aktif',
      m3Label: 'Engagement',
      m3Val: '7.8% rate',
    },
    {
      id: 'fin',
      name: 'Finance AI',
      desc: 'Buat invoice, tagihan, reminder, dan rekonsiliasi pembayaran.',
      status: 'Aktif',
      statusType: 'active',
      icon: FileText,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      m1Label: 'Invoice',
      m1Val: '43 terkirim',
      m2Label: 'Reminder',
      m2Val: '15 terkirim',
      m3Label: 'Outstanding',
      m3Val: '8 belum bayar',
    },
    {
      id: 'str',
      name: 'Store AI',
      desc: 'Kelola produk, stok, dan pesanan otomatis.',
      status: 'Aktif',
      statusType: 'active',
      icon: Store,
      iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400',
      m1Label: 'Produk Update',
      m1Val: '25 hari ini',
      m2Label: 'Stok Alert',
      m2Val: '2 produk',
      m3Label: 'Order Diproses',
      m3Val: '17 hari ini',
    },
    {
      id: 'sls',
      name: 'Sales AI',
      desc: 'Follow up leads, closing penjualan, dan upsell.',
      status: 'Aktif',
      statusType: 'active',
      icon: Users,
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      m1Label: 'Leads Follow Up',
      m1Val: '18',
      m2Label: 'Deals Closed',
      m2Val: '7',
      m3Label: 'Revenue',
      m3Val: 'Rp2.100.000',
    },
    {
      id: 'wa_sales',
      name: 'WhatsApp Sales AI',
      desc: 'Membantu jualan via WhatsApp secara otomatis.',
      status: 'Aktif',
      statusType: 'active',
      icon: Bot,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      m1Label: 'Chat Dibalas',
      m1Val: '98',
      m2Label: 'Order Diterima',
      m2Val: '23',
      m3Label: 'Conversion',
      m3Val: '23.5%',
    },
    {
      id: 'research',
      name: 'Riset Produk AI',
      desc: 'Riset trend produk & kompetitor.',
      status: 'Perlu Perhatian',
      statusType: 'warning',
      icon: Sparkles,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      m1Label: 'Riset Selesai',
      m1Val: '3',
      m2Label: 'Insight Baru',
      m2Val: '7',
      m3Label: 'Akurasi',
      m3Val: '82%',
    },
  ];

  const filteredEmployees = employees.filter((emp) => {
    if (filterTab === 'Aktif') return emp.statusType === 'active';
    if (filterTab === 'Perlu Perhatian') return emp.statusType === 'warning';
    if (filterTab === 'Tidak Aktif') return emp.statusType === 'inactive';
    return true;
  }).filter((emp) => emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.desc.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">My AI Employees</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kelola tim AI Anda yang bekerja 24/7 untuk bisnis Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => triggerToast('Opening Employee Templates...')}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Employee Template
          </button>
          <button 
            onClick={() => triggerToast('Tambah AI Employee Baru')}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Tambah AI Employee
          </button>
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total AI Employees', val: '7', change: '16% vs last month', icon: Bot, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Active Now', val: '6', change: '86% bekerja sekarang', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Tasks Completed Today', val: '126', change: '22% vs yesterday', icon: FileText, color: 'bg-blue-50 text-blue-600' },
          { label: 'Hours Saved Today', val: '11.0', change: '16% vs yesterday', icon: Clock, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Cost Saved Today', val: 'Rp2.100.000', change: '20% vs yesterday', icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 block truncate">{m.label}</span>
                <div className={`size-8 rounded-xl ${m.color} flex items-center justify-center flex-shrink-0`}><Icon size={16} /></div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100">{m.val}</div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ {m.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-Navigation & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs font-bold">
          {[
            { label: 'Semua (7)', key: 'Semua' },
            { label: 'Aktif (6)', key: 'Aktif' },
            { label: 'Perlu Perhatian (1)', key: 'Perlu Perhatian' },
            { label: 'Tidak Aktif (0)', key: 'Tidak Aktif' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterTab(t.key)}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterTab === t.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right Search & Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari AI Employee..."
              className="pl-8 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-48 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Semua Kategori</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {/* Grid of AI Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredEmployees.map((emp) => {
          const Icon = emp.icon;
          return (
            <div key={emp.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`size-10 rounded-2xl ${emp.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    emp.statusType === 'active' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}>
                    {emp.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{emp.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">{emp.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                <div>
                  <span className="text-slate-400 block truncate">{emp.m1Label}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">{emp.m1Val}</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block truncate">{emp.m2Label}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">{emp.m2Val}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block truncate">{emp.m3Label}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">{emp.m3Val}</span>
                </div>
              </div>

              <button 
                onClick={() => triggerToast(`Opening detail for ${emp.name}`)}
                className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Lihat Detail
              </button>
            </div>
          );
        })}

        {/* Dotted Placeholder Card "+ Tambah AI Employee" */}
        <div className="p-5 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col items-center justify-center text-center space-y-3 min-h-[260px]">
          <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">+ Tambah AI Employee</h3>
            <p className="text-xs text-slate-400 max-w-[200px] mt-1">Pilih template atau buat AI Employee custom sesuai kebutuhan bisnis Anda.</p>
          </div>
          <button 
            onClick={() => triggerToast('Selecting AI Employee template...')}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer shadow-xs"
          >
            Pilih Template
          </button>
        </div>
      </div>
    </div>
  );
}
