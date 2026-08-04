'use client';

import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Search, BookOpen, MessageSquare, Ticket, 
  Send, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle,
  Sparkles, ExternalLink, Zap, Shield, Code, Headphones, X
} from 'lucide-react';
import { SupabaseDashboardService } from '../../services/supabaseService';

export const HelpView: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Ticket Modal & Form State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Otomatisasi',
    priority: 'Sedang',
    message: ''
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [faqsRes, ticketsRes] = await Promise.all([
        SupabaseDashboardService.getHelpFaqs(),
        SupabaseDashboardService.getHelpTickets()
      ]);
      setFaqs(faqsRes || []);
      setTickets(ticketsRes || []);
    } catch (err) {
      console.error('Error loading Help Center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = SupabaseDashboardService.subscribeToHelpTickets(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) {
      triggerToast('⚠️ Harap isi judul dan pesan tiket!');
      return;
    }

    setSubmittingTicket(true);
    try {
      await SupabaseDashboardService.createHelpTicket(ticketForm);
      triggerToast('✓ Tiket bantuan berhasil dikirim! Tim support kami akan membalas secara realtime.');
      setIsTicketModalOpen(false);
      setTicketForm({ subject: '', category: 'Otomatisasi', priority: 'Sedang', message: '' });
      await loadData();
    } catch (err: any) {
      triggerToast(`❌ Gagal mengirim tiket: ${err.message}`);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const categories = [
    { name: 'Semua', icon: BookOpen, count: faqs.length },
    { name: 'Pengenalan', icon: Sparkles, count: faqs.filter(f => f.category === 'Pengenalan').length },
    { name: 'Otomatisasi', icon: Zap, count: faqs.filter(f => f.category === 'Otomatisasi').length },
    { name: 'AI Employees', icon: Headphones, count: faqs.filter(f => f.category === 'AI Employees').length },
    { name: 'Billing & Paket', icon: Shield, count: faqs.filter(f => f.category === 'Billing & Paket').length },
    { name: 'API & Integrasi', icon: Code, count: faqs.filter(f => f.category === 'API & Integrasi').length }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchCategory = selectedCategory === 'Semua' || faq.category === selectedCategory;
    const matchSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Hero Header & Search Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 md:p-10 text-white shadow-xl shadow-orange-500/20">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-100 border border-white/30">
            <HelpCircle size={14} />
            <span>Pusat Bantuan & Layanan Bimbingan</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            Bagaimana Kami Bisa Membantu Bisnis Anda Hari Ini?
          </h1>
          <p className="text-xs md:text-sm text-orange-100 font-medium">
            Cari panduan otomatisasi, integrasi API, manajemen AI Employees, atau ajukan tiket bantuan langsung ke tim teknis ZEGA.
          </p>

          {/* Search Input */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci... (contoh: WhatsApp API, Upgrade, Automation)"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 text-xs font-semibold placeholder-slate-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Quick Action Support Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setIsTicketModalOpen(true)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <Ticket size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Buat Tiket Bantuan</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Kirimkan pertanyaan teknis langsung ke engineer ZEGA.</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => triggerToast('✓ Menghubungkan ke Live Chat Support (WhatsApp API)...')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Live Chat Direct</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Respons instan dari AI Support Specialist kami.</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => triggerToast('✓ Membuka Dokumentasi Pengembang ZEGA API...')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <ExternalLink size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Dokumentasi API</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Panduan integrasi Webhook, SDK, dan REST API.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{cat.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* FAQs Interactive Accordion */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BookOpen size={18} className="text-orange-500" />
          <span>Pertanyaan Sering Diajukan (FAQ)</span>
        </h3>

        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div 
                key={faq.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {faq.question}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                    <p className="leading-relaxed font-medium">{faq.answer}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                      <span>Kategori: <strong>{faq.category}</strong></span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerToast('✓ Terima kasih atas masukan Anda!');
                        }}
                        className="hover:text-orange-500 font-bold cursor-pointer"
                      >
                        👍 Membantu ({faq.helpful_count})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Ticket Status Tracker */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Ticket size={18} className="text-orange-500" />
            <span>Riwayat Tiket Bantuan Anda (Realtime)</span>
          </h3>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={14} />
            <span>Kirim Tiket Baru</span>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Kode Tiket</th>
                  <th className="p-3.5">Subjek</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Prioritas</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-orange-600 dark:text-orange-400">{t.ticket_code}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">{t.subject}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{t.category}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                        t.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <Clock size={12} className="animate-spin" />
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-medium">
                      {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Support Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Ticket className="text-orange-500" size={18} />
                <span>Buat Tiket Bantuan Baru</span>
              </h3>
              <button 
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subjek Pertanyaan</label>
                <input
                  type="text"
                  required
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Contoh: Kendala pada Sync WhatsApp API"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Otomatisasi">Otomatisasi</option>
                    <option value="AI Employees">AI Employees</option>
                    <option value="Billing & Paket">Billing & Paket</option>
                    <option value="API & Integrasi">API & Integrasi</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prioritas</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Detail Pesan / Pertanyaan</label>
                <textarea
                  required
                  rows={4}
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  placeholder="Jelaskan secara singkat kendala atau pertanyaan yang Anda hadapi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingTicket ? 'Mengirim...' : 'Kirim Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
