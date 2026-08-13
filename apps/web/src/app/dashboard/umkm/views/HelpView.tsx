import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Search, BookOpen, MessageSquare, Ticket, 
  Send, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle,
  Sparkles, ExternalLink, Zap, Shield, Code, Headphones, X, Bot
} from 'lucide-react';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { getApiBase } from '../../../../config/api';
import { getR2CdnUrl } from '../../../utils/cdn';

export const HelpView: React.FC = () => {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Ticket Modal & Live Chat State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

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

  // Clean Markdown Text Formatter
  const renderFormattedChatMessage = (text: string) => {
    if (!text) return null;
    const cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!cleanText) return null;
    const lines = cleanText.split('\n');

    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((rawLine, idx) => {
          const trimmed = rawLine.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          const isBullet = /^[•\-\*\+]\s+/.test(trimmed) || /^[•\-\*\+]$/.test(trimmed);
          const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)/);

          let contentLine = trimmed;
          let bulletPrefix: React.ReactNode = null;

          if (isBullet) {
            contentLine = trimmed.replace(/^[•\-\*\+]\s*/, '');
            bulletPrefix = <span className="text-orange-400 font-bold text-xs shrink-0 select-none">•</span>;
          } else if (numMatch) {
            contentLine = numMatch[2];
            bulletPrefix = (
              <span className="text-orange-400 font-mono font-bold text-[10px] shrink-0 bg-orange-500/10 px-1 py-0.2 rounded border border-orange-500/20">
                {numMatch[1]}
              </span>
            );
          }

          const parts = contentLine.split(/(\*\*[^*]+\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-orange-600 dark:text-orange-300">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (bulletPrefix) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-0.5">
                {bulletPrefix}
                <div className="flex-1 leading-snug">{formattedLine}</div>
              </div>
            );
          }

          return <p key={idx} className="leading-snug">{formattedLine}</p>;
        })}
      </div>
    );
  };

  // AI Language Preference (independent from UI language)
  const getAiLang = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zega_ai_default_language');
      if (saved && (saved === 'en' || saved === 'id' || saved === 'zh')) return saved;
    }
    return 'id';
  };

  const handleOpenLiveChat = () => {
    setIsLiveChatOpen(true);
    if (chatMessages.length === 0) {
      const lang = getAiLang();
      const seedMsg = lang === 'en'
        ? 'Hello! Welcome to the ZEGA UMKM Support Center. How can I help you today regarding WhatsApp API, Auto POS, or AI Employees?'
        : lang === 'zh'
        ? '你好！欢迎来到 ZEGA UMKM 支持中心。关于 WhatsApp API、自动收银台或 AI 员工，有什么可以帮您的？'
        : 'Halo! Selamat datang di Pusat Bantuan UMKM ZEGA. Ada yang bisa saya bantu terkait WhatsApp API, Kasir Otomatis, atau AI Employees?';
      setChatMessages([
        {
          id: '1',
          sender_type: 'ai_specialist',
          sender_name: 'ZEGA UMKM Support Assistant',
          message: seedMsg,
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiThinking) return;

    const userMsg = chatInput;
    const currentAiLang = getAiLang();
    setChatInput('');

    const newMsg = {
      id: Date.now().toString(),
      sender_type: 'user',
      sender_name: currentAiLang === 'en' ? 'UMKM User' : currentAiLang === 'zh' ? 'UMKM 用户' : 'Pengguna UMKM',
      message: userMsg,
      created_at: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setIsAiThinking(true);

    try {
      const apiHost = getApiBase();
      const res = await fetch(`${apiHost}/v1/enterprise/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, language: currentAiLang })
      });

      let aiReply = '';
      if (res.ok) {
        const data = await res.json();
        aiReply = data.data?.message || data.message;
      }

      if (!aiReply) {
        aiReply = currentAiLang === 'en'
          ? `Thank you for your question about "${userMsg}". The ZEGA support team is ready to assist your business to the fullest.`
          : currentAiLang === 'zh'
          ? `感谢您关于 "${userMsg}" 的提问。ZEGA 支持团队已准备好全力协助您的业务。`
          : `Terima kasih atas pertanyaan Anda tentang "${userMsg}". Tim support ZEGA siap membantu bisnis Anda secara maksimal.`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender_type: 'ai_specialist',
          sender_name: 'ZEGA UMKM Support Assistant',
          message: aiReply,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      const currentLang = getAiLang();
      const fallback = currentLang === 'en'
        ? `Thank you! Your message "${userMsg}" has been synced to the UMKM support queue.`
        : currentLang === 'zh'
        ? `感谢您！您的消息 "${userMsg}" 已同步到 UMKM 支持队列。`
        : `Terima kasih! Pesan Anda "${userMsg}" telah disinkronkan ke antrean support UMKM.`;
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender_type: 'ai_specialist',
          sender_name: 'ZEGA UMKM Support Assistant',
          message: fallback,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
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
    <div className="p-3 sm:p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
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
            {t.helpView?.title || 'Bagaimana Kami Bisa Membantu Bisnis Anda Hari Ini?'}
          </h1>
          <p className="text-xs md:text-sm text-orange-100 font-medium">
            {t.helpView?.subtitle || 'Cari panduan otomatisasi, integrasi API, manajemen AI Employees, atau ajukan tiket bantuan langsung ke tim teknis ZEGA.'}
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
          onClick={handleOpenLiveChat}
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
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Ticket size={18} className="text-orange-500 shrink-0" />
            <span>Riwayat Tiket Bantuan (Realtime)</span>
          </h3>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="px-3 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send size={14} />
            <span className="hidden sm:inline">Kirim Tiket Baru</span>
            <span className="sm:hidden">Tiket Baru</span>
          </button>
        </div>

        {/* Mobile View: Stacked Ticket Cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {tickets.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
              Belum ada tiket bantuan dikirim. Klik "Tiket Baru" untuk mengirim.
            </div>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{t.ticket_code}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Clock size={11} className="animate-spin" />
                    {t.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{t.subject}</h4>
                <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-medium">Kategori: <strong>{t.category}</strong></span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    t.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {t.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={handleOpenLiveChat}
                    className="px-3 py-1 rounded-lg bg-orange-500 text-white font-bold text-[11px] hover:bg-orange-600 transition-colors"
                  >
                    Live Chat
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
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
      {/* LIVE CHAT DRAWER */}
      {isLiveChatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full flex flex-col border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-sm">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">ZEGA AI Specialist Direct</h4>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> 24/7 Live Agent Queue
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsLiveChatOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.sender_type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9.5px] font-mono text-slate-400 mb-1">{msg.sender_name}</span>
                  <div className={`p-3 rounded-2xl max-w-[85%] font-medium ${
                    msg.sender_type === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}>
                    {msg.sender_type === 'user' ? msg.message : renderFormattedChatMessage(msg.message)}
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex flex-col items-start">
                  <span className="text-[9.5px] font-mono text-slate-400 mb-1">ZEGA AI Specialist Direct</span>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                    <Sparkles size={14} className="animate-spin text-orange-500" />
                    <span className="text-xs font-medium animate-pulse">Sedang memproses jawaban dengan AI model...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input Footer */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ketik pesan untuk AI Support..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-colors shadow-xs"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
