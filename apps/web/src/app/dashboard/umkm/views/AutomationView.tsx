import React, { useState } from 'react';
import { 
  Play, Pause, MoreVertical, Search, ChevronDown, 
  CheckCircle2, Clock, ShieldCheck, Mail, ArrowUpRight, 
  ShoppingBag, MessageSquare, FileText, Users, ShoppingCart, 
  BookOpen, ExternalLink 
} from 'lucide-react';

interface AutomationViewProps {
  triggerToast: (msg: string) => void;
}

export function AutomationView({ triggerToast }: AutomationViewProps) {
  const [filterTab, setFilterTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const automations = [
    {
      id: 1,
      name: 'New Order -> Invoice -> WA -> Save -> Update Stock',
      sub: 'Ketika ada order baru di toko online',
      triggerName: 'New Order (Online Store)',
      triggerIcon: ShoppingBag,
      triggerBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60',
      lastRun: '2 menit yang lalu',
      status: 'Berjalan',
      statusType: 'running',
      rate: '100%',
    },
    {
      id: 2,
      name: 'Customer Chat -> AI Reply -> Tag -> Follow Up',
      sub: 'Chat pelanggan dibalas otomatis & di-follow up',
      triggerName: 'New Message (WhatsApp)',
      triggerIcon: MessageSquare,
      triggerBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60',
      lastRun: '1 menit yang lalu',
      status: 'Berjalan',
      statusType: 'running',
      rate: '98%',
    },
    {
      id: 3,
      name: 'Payment Reminder -> WA -> Email -> Update Status',
      sub: 'Kirim pengingat pembayaran otomatis',
      triggerName: 'Invoice Due (Finance AI)',
      triggerIcon: FileText,
      triggerBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60',
      lastRun: '5 menit yang lalu',
      status: 'Berjalan',
      statusType: 'running',
      rate: '100%',
    },
    {
      id: 4,
      name: 'New Lead -> CRM -> Email -> Add to List',
      sub: 'Lead baru masuk ke CRM dan email list',
      triggerName: 'New Lead (Form/Website)',
      triggerIcon: Users,
      triggerBg: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60',
      lastRun: '10 menit yang lalu',
      status: 'Berjalan',
      statusType: 'running',
      rate: '94%',
    },
    {
      id: 5,
      name: 'Abandoned Cart -> WA -> Discount -> Recover',
      sub: 'Pulihkan keranjang yang ditinggalkan',
      triggerName: 'Abandoned Cart (Store)',
      triggerIcon: ShoppingCart,
      triggerBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60',
      lastRun: '15 menit yang lalu',
      status: 'Dijeda',
      statusType: 'paused',
      rate: '86%',
    },
  ];

  const filteredAutomations = automations.filter((item) => {
    if (filterTab === 'Berjalan') return item.statusType === 'running';
    if (filterTab === 'Dijeda') return item.statusType === 'paused';
    return true;
  }).filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sub.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Automation</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Buat dan kelola workflow otomatisasi tanpa kode.</p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Automation</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Play size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">12</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 20% vs last month</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tasks Automated Today</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Mail size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">89</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 18% vs yesterday</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Success Rate</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">96%</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 2% vs yesterday</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Hours Saved This Week</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Clock size={16} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">56.2</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">▲ 22% vs last week</div>
          </div>
        </div>
      </div>

      {/* Filter Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs font-bold">
          {['Semua', 'Berjalan', 'Dijeda', 'Gagal', 'Selesai'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTab(t)}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterTab === t
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari automation..."
              className="pl-8 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-48 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Semua Status</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Automation Table + Right Sidebar Widgets */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Main Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                  <th className="pb-3 pl-2">Automation</th>
                  <th className="pb-3">Trigger</th>
                  <th className="pb-3">Terakhir Jalan</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-center">Success Rate</th>
                  <th className="pb-3 pr-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAutomations.map((item) => {
                  const TriggerIcon = item.triggerIcon;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-2 pr-4 max-w-[240px]">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</p>
                      </td>
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-2">
                          <div className={`size-6 rounded-lg ${item.triggerBg} flex items-center justify-center flex-shrink-0`}>
                            <TriggerIcon size={12} />
                          </div>
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{item.triggerName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">{item.lastRun}</td>
                      <td className="py-3.5 pr-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.statusType === 'running'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}>
                          <span className={`size-1.5 rounded-full ${item.statusType === 'running' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-bold text-xs text-slate-900 dark:text-slate-100">{item.rate}</td>
                      <td className="py-3.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => triggerToast(`Toggle status for ${item.name}`)} 
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                          >
                            {item.statusType === 'running' ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button 
                            onClick={() => triggerToast(`Actions for ${item.name}`)} 
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button 
            onClick={() => triggerToast('Viewing all automations')} 
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-2 flex items-center justify-center gap-1 cursor-pointer"
          >
            Lihat Semua Automation <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-4">
          {/* Template Populer Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Template Populer</h3>
              <button onClick={() => triggerToast('Viewing all templates')} className="text-[10px] font-bold text-orange-500 hover:underline cursor-pointer">Lihat Semua</button>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Order & Invoice Automation', sub: 'Buat invoice otomatis setelah order', icon: ShoppingBag, bg: 'bg-emerald-50 text-emerald-600' },
                { title: 'WhatsApp Auto Reply', sub: 'Balas chat & kirim informasi otomatis', icon: MessageSquare, bg: 'bg-emerald-50 text-emerald-600' },
                { title: 'Payment Reminder', sub: 'Kirim pengingat pembayaran', icon: FileText, bg: 'bg-blue-50 text-blue-600' },
                { title: 'New Lead Follow Up', sub: 'Follow up leads otomatis', icon: Users, bg: 'bg-purple-50 text-purple-600' },
                { title: 'Stock Alert', sub: 'Notifikasi stok menipis', icon: ShoppingCart, bg: 'bg-amber-50 text-amber-600' },
              ].map((tpl, i) => {
                const Icon = tpl.icon;
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-8 rounded-xl ${tpl.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={14} />
                      </div>
                      <div className="truncate max-w-[140px]">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{tpl.title}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{tpl.sub}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => triggerToast(`Using template: ${tpl.title}`)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer shadow-xs"
                    >
                      Gunakan
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Butuh Bantuan Widget */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Butuh Bantuan?</h4>
              <p className="text-[10px] text-slate-400">Pelajari cara membuat automation</p>
              <button 
                onClick={() => triggerToast('Opening documentation...')}
                className="mt-2 text-xs font-bold text-orange-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Buka Dokumentasi <ExternalLink size={12} />
              </button>
            </div>
            <div className="size-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-500">
              <BookOpen size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
