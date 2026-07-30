import React, { useState } from 'react';
import { 
  Brain, Plus, Search, Sparkles, FileText, Send, 
  HelpCircle, BookOpen, ExternalLink, Download 
} from 'lucide-react';

interface KnowledgeViewProps {
  triggerToast: (msg: string) => void;
}

export function KnowledgeView({ triggerToast }: KnowledgeViewProps) {
  const [selectedCat, setSelectedCat] = useState('Semua');
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">KNOWLEDGE</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Semua pengetahuan bisnis Anda dalam satu tempat.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search knowledge..." 
              className="pl-8 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-48 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button 
            onClick={() => triggerToast('Tambah Artikel Baru')}
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} /> New Article
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Categories + Article Table + AI Assistant Sidebar */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Categories Sidebar */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-2">Categories</h3>
          <div className="space-y-1 text-xs font-semibold">
            {[
              { name: 'Semua', count: 24 },
              { name: 'Produk', count: 8 },
              { name: 'Prosedur Operasional', count: 6 },
              { name: 'Sales', count: 4 },
              { name: 'Marketing', count: 3 },
              { name: 'Keuangan', count: 2 },
              { name: 'Lainnya', count: 1 },
            ].map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCat(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedCat === cat.name
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Article Table */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Article List</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="col-span-6">Title</span>
              <span className="col-span-3">Category</span>
              <span className="col-span-3 text-right">Views</span>
            </div>
            {[
              { title: 'Cara Membuat Invoice Otomatis', cat: 'Prosedur', views: '532', date: '28 Jul 2026' },
              { title: 'Kebijakan Pengembalian Barang', cat: 'Prosedur', views: '421', date: '25 Jul 2026' },
              { title: 'FAQ - Pengiriman & Ongkir', cat: 'FAQ', views: '389', date: '24 Jul 2026' },
              { title: 'Panduan Packing Produk', cat: 'Prosedur', views: '312', date: '22 Jul 2026' },
              { title: 'Strategi Promosi di WhatsApp', cat: 'Marketing', views: '298', date: '20 Jul 2026' },
              { title: 'Template Pesan Balasan Cepat', cat: 'Sales', views: '276', date: '18 Jul 2026' },
              { title: 'Cara Kelola Stok di Sistem', cat: 'Prosedur', views: '254', date: '15 Jul 2026' },
              { title: 'Panduan Foto Produk yang Menarik', cat: 'Marketing', views: '231', date: '12 Jul 2026' },
            ].map((art, i) => (
              <div key={i} className="grid grid-cols-12 items-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <span className="col-span-6 font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{art.title}</span>
                <span className="col-span-3 text-[10px] text-slate-500 font-medium">{art.cat}</span>
                <span className="col-span-3 text-right font-mono text-slate-400">{art.views}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Knowledge Assistant & Documents */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Sparkles size={16} className="text-purple-500" /> AI Knowledge Assistant
            </div>
            <p className="text-[11px] text-slate-500">Tanyakan apa saja tentang bisnis Anda.</p>
            <div className="space-y-1.5 text-[10px]">
              {['Bagaimana cara membuat invoice otomatis?', 'Apa kebijakan retur produk?', 'Bagaimana alur pengiriman?', 'Template pesan untuk customer baru?'].map((chip, i) => (
                <button key={i} onClick={() => setQuery(chip)} className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 cursor-pointer">
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik pertanyaan Anda..." 
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl focus:outline-none"
              />
              <button onClick={() => { triggerToast('AI answering query...'); setQuery(''); }} className="p-2 bg-orange-500 text-white rounded-xl cursor-pointer">
                <Send size={14} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Documents</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-red-500" />
                  <div><h4 className="font-bold text-[11px]">SOP-Operasional-Toko.pdf</h4><span className="text-[9px] text-slate-400">PDF • 2.4 MB</span></div>
                </div>
                <Download size={14} className="text-slate-400 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-emerald-500" />
                  <div><h4 className="font-bold text-[11px]">Daftar-Supplier.xlsx</h4><span className="text-[9px] text-slate-400">Excel • 1.1 MB</span></div>
                </div>
                <Download size={14} className="text-slate-400 cursor-pointer" />
              </div>
            </div>
            <button onClick={() => triggerToast('Viewing all documents')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">Lihat Semua Dokumen &gt;</button>
          </div>
        </div>
      </div>

      {/* Popular Articles Row */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Popular Articles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Cara Membuat Invoice Otomatis', cat: 'Prosedur', views: '532 views' },
            { title: 'Kebijakan Pengembalian Barang', cat: 'Prosedur', views: '421 views' },
            { title: 'FAQ - Pengiriman & Ongkir', cat: 'FAQ', views: '389 views' },
            { title: 'Strategi Promosi di WhatsApp', cat: 'Marketing', views: '298 views' },
          ].map((art, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{art.title}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold inline-block">{art.cat}</span>
              <span className="text-[10px] text-slate-400 font-mono block">{art.views}</span>
            </div>
          ))}
        </div>
        <button onClick={() => triggerToast('Viewing all popular articles')} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 pt-1 cursor-pointer">Lihat Semua Artikel &gt;</button>
      </div>
    </div>
  );
}
