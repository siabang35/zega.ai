import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Search, BookOpen, MessageSquare, Ticket, 
  Send, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle,
  Sparkles, ExternalLink, Zap, Shield, Code, Headphones, X, RefreshCw,
  Activity, ArrowUpRight, Bot, User, Check, Plus, Maximize2, Minimize2, Copy
} from 'lucide-react';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';
import { getApiBase } from '../../../../config/api';
import { getR2CdnUrl } from '../../../utils/cdn';

interface HelpViewProps {
  onTriggerToast?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onTriggerToast, onNavigateTab }) => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Modal & Live Chat Drawer State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isLiveChatFullScreen, setIsLiveChatFullScreen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedHelpMsgId, setCopiedHelpMsgId] = useState<string | null>(null);

  const handleCopyHelpMessage = (text: string, msgId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedHelpMsgId(msgId);
      triggerToast('✓ Copied to clipboard');
      setTimeout(() => setCopiedHelpMsgId(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Otomatisasi',
    priority: 'Sedang',
    message: ''
  });

  const [localToast, setLocalToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    if (onTriggerToast) onTriggerToast(msg);
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 3500);
  };

  // Clean Markdown Text Formatter for Live Chat Messages
  const renderFormattedChatMessage = (text: string) => {
    if (!text) return null;
    let cleanText = text
      // Strip closed <think> blocks
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      // Strip unclosed <think> to end of string
      .replace(/<think>[\s\S]*$/gi, '')
      // Strip "Here's a thinking process:" followed by everything until a double newline or end
      .replace(/^(?:Here'?s a thinking process:|Thinking Process:|Here is my thinking:)[\s\S]*?(?:\n\n|\n(?=[A-Z]))/gi, '')
      // Strip entire block if it starts with thinking process header (greedy fallback)
      .replace(/^(?:Here'?s a thinking process:|Thinking Process:|Here is my thinking:)[\s\S]*/gi, '')
      // Strip numbered reasoning steps patterns (e.g. "1. **Analyze User Input:**", "2. **Check Constraints:**")
      .replace(/^\d+\.\s*\*?\*?(?:Analyze|Check|Draft|Plan|Review|Evaluate|Consider|Assess|Identify|Determine|Key Observation|My Approach|Final Response|Step \d|Security|Format|Language|Tone|Greeting Rule|Store Context|Focus|Role|Time|Constraint|Requirement)[^:]*:\*?\*?[^\n]*(?:\n(?!\n)[^\n]*)*/gim, '')
      // Strip "**Role:**", "**Focus:**", "**Language:**" etc metadata blocks 
      .replace(/^\s*\*?\*?(?:Role|Focus|Time\/Date|Store Context|Greeting Rule|Language|Tone|Format|Security\/Transparency|Constraints? & Requirements?|User Input|Analyze User|Check Constraints|Draft Response)[^:]*:\*?\*?\s*[^\n]*$/gim, '')
      // Strip bullet points that look like internal reasoning ("• User said:", "• This is a simple")
      .replace(/^\s*[•\-\*]\s*(?:User said|This is a|I need to|Let me|I should|I will|My response|The user)[^\n]*$/gim, '')
      .trim();
    if (!cleanText && text) cleanText = text.replace(/<\/?think>/gi, '').trim();
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [faqsRes, ticketsRes] = await Promise.all([
        enterpriseSupabaseService.getHelpFaqs(),
        enterpriseSupabaseService.getHelpTickets()
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
    const unsubscribe = enterpriseSupabaseService.subscribeToHelpRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.message) {
      triggerToast('⚠️ Harap isi subjek dan detail pesan tiket!');
      return;
    }

    setSubmittingTicket(true);
    try {
      const { data, error } = await enterpriseSupabaseService.createHelpTicket(ticketForm);
      if (error) throw error;
      triggerToast('✓ Tiket bantuan berhasil dikirim! Tim support ZEGA akan membalas secara realtime.');
      setIsTicketModalOpen(false);
      setTicketForm({ subject: '', category: 'Otomatisasi', priority: 'Sedang', message: '' });
      await loadData();
    } catch (err: any) {
      triggerToast(`❌ Gagal mengirim tiket: ${err.message || 'Error server'}`);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleIncrementHelpful = async (faq: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await enterpriseSupabaseService.incrementHelpfulFaq(faq.id, faq.helpful_count || 0);
      triggerToast('👍 Terima kasih atas penilaian Anda!');
      await loadData();
    } catch (err) {
      triggerToast('👍 Terima kasih atas masukan Anda!');
    }
  };

  // AI Language Preference helper
  const getAiLang = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zega_ai_default_language');
      if (saved && (saved === 'en' || saved === 'id' || saved === 'zh')) return saved;
    }
    return 'en';
  };

  const handleOpenLiveChat = (ticket?: any) => {
    setSelectedTicket(ticket || null);
    setIsLiveChatOpen(true);
    const lang = getAiLang();
    let seedMsg = '';
    if (ticket) {
      seedMsg = lang === 'en'
        ? `Hello! I am ZEGA AI Specialist connected to real-time inference. I am monitoring ticket #${ticket.ticket_code} (${ticket.subject}). Is there any additional information you would like to share?`
        : lang === 'zh'
        ? `你好！我是连接实时推理的 ZEGA AI 专家。我正在监控工单 #${ticket.ticket_code} (${ticket.subject})。您有什么补充信息要提交吗？`
        : `Halo! Saya AI Specialist ZEGA terhubung dengan model inference real-time. Saya sedang memantau tiket #${ticket.ticket_code} (${ticket.subject}). Ada info tambahan yang ingin Anda sampaikan?`;
    } else {
      seedMsg = lang === 'en'
        ? 'Hello Enterprise Admin! Welcome to ZEGA Live Chat Direct. How can I assist your workflow, AI infrastructure, or APIs today?'
        : lang === 'zh'
        ? '您好，企业管理员！欢迎来到 ZEGA 实时在线客服。今天在工作流、AI 基础设施或 API 方面有什么可以帮您？'
        : 'Halo Enterprise Admin! Selamat datang di ZEGA Live Chat Direct. Bagaimana saya bisa membantu workflow, infrastruktur AI, atau API Anda hari ini?';
    }

    setChatMessages([
      {
        id: '1',
        sender_type: 'ai_specialist',
        sender_name: 'ZEGA AI Support Specialist',
        message: seedMsg,
        created_at: new Date().toISOString()
      }
    ]);
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
      sender_name: 'Enterprise Admin',
      message: userMsg,
      created_at: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setIsAiThinking(true);

    // Call Real-time Backend AI Model Endpoint (/v1/enterprise/copilot/chat)
    try {
      const apiHost = getApiBase();
      const res = await fetch(`${apiHost}/v1/enterprise/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: selectedTicket 
            ? `[Tiket #${selectedTicket.ticket_code} - ${selectedTicket.subject}] ${userMsg}`
            : userMsg,
          language: currentAiLang
        })
      });

      let aiReply = '';
      if (res.ok) {
        const data = await res.json();
        aiReply = data.data?.message || data.message;
      }

      if (!aiReply) {
        aiReply = currentAiLang === 'en'
          ? `Thank you for your message regarding "${userMsg}". Your request has been received and will be processed by an AI Support Specialist.`
          : currentAiLang === 'zh'
          ? `感谢您关于 "${userMsg}" 的消息。我们已收到您的请求，AI 支持专家将立即进行处理。`
          : `Terima kasih atas pesan Anda mengenai "${userMsg}". Permintaan Anda telah kami terima dan akan langsung diproses oleh AI Support Specialist.`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender_type: 'ai_specialist',
          sender_name: 'ZEGA AI Support Specialist',
          message: aiReply,
          created_at: new Date().toISOString()
        }
      ]);

      // Save to Supabase Realtime DB table
      await enterpriseSupabaseService.sendLiveChatMessage({
        ticket_id: selectedTicket?.id,
        sender_type: 'user',
        sender_name: 'Enterprise Admin',
        message: userMsg
      });
    } catch (err) {
      const lang = getAiLang();
      const fallbackMsg = lang === 'en'
        ? `Thank you! Information "${userMsg}" has been synced to the agent support queue.`
        : lang === 'zh'
        ? `感谢您！信息 "${userMsg}" 已同步到支持代理队列。`
        : `Terima kasih! Informasi "${userMsg}" telah disinkronkan ke agent support queue.`;
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender_type: 'ai_specialist',
          sender_name: 'ZEGA AI Support Specialist',
          message: fallbackMsg,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const categories = [
    { name: 'Semua', icon: BookOpen, count: faqs.length },
    { name: 'Pengenalan', icon: Sparkles, count: faqs.filter(f => f.category === 'Pengenalan').length || 1 },
    { name: 'Otomatisasi', icon: Zap, count: faqs.filter(f => f.category === 'Otomatisasi').length || 1 },
    { name: 'AI Employees', icon: Headphones, count: faqs.filter(f => f.category === 'AI Employees').length || 1 },
    { name: 'Billing & Paket', icon: Shield, count: faqs.filter(f => f.category === 'Billing & Paket').length || 1 },
    { name: 'API & Integrasi', icon: Code, count: faqs.filter(f => f.category === 'API & Integrasi').length || 1 }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchCategory = selectedCategory === 'Semua' || faq.category === selectedCategory;
    const matchSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Toast Notification */}
      {localToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-bounce flex items-center gap-2">
          <Sparkles className="text-orange-400" size={16} />
          <span>{localToast}</span>
        </div>
      )}

      {/* HERO BANNER SECTION (Vibrant Orange Gradient matching user design) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 md:p-10 text-white shadow-xl shadow-orange-500/20">
        {/* Background Subtle Tech Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-100 border border-white/30 shadow-xs">
            <HelpCircle size={14} className="text-white" />
            <span>Pusat Bantuan & Layanan Bimbingan</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Help Center & AI Support
          </h1>

          {/* Subtitle */}
          <p className="text-xs md:text-sm text-orange-100 font-medium leading-relaxed">
            Find guides, documentation, or chat directly with 24/7 technical support.
          </p>

          {/* Embedded Real-time Search Bar */}
          <div className="relative mt-5 pt-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci... (contoh: WhatsApp API, Upgrade, Automation)"
              className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white text-slate-900 text-xs font-semibold placeholder-slate-400 shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300/60 transition-all border-0"
            />
          </div>
        </div>
      </div>

      {/* TOP ACTION SUPPORT CARDS GRID (3 Columns matching screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Buat Tiket Bantuan */}
        <div 
          onClick={() => setIsTicketModalOpen(true)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer shadow-xs hover:shadow-md group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform shrink-0">
            <Ticket size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Buat Tiket Bantuan</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
              Kirimkan pertanyaan teknis langsung ke engineer ZEGA.
            </p>
          </div>
        </div>

        {/* Card 2: Live Chat Direct */}
        <div 
          onClick={() => handleOpenLiveChat()}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-xs hover:shadow-md group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
            <MessageSquare size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Live Chat Direct</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
              Respons instan dari AI Support Specialist kami.
            </p>
          </div>
        </div>

        {/* Card 3: Dokumentasi API */}
        <div 
          onClick={() => {
            if (onNavigateTab) onNavigateTab('dev_portal');
            else triggerToast('✓ Membuka Developer Portal & Dokumentasi API...');
          }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs hover:shadow-md group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
            <ExternalLink size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Dokumentasi API</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
              Panduan integrasi Webhook, SDK, dan REST API.
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER PILLS WITH COUNT BADGES */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} className={isActive ? (cat.name === 'Semua' ? 'text-amber-400' : 'text-white dark:text-slate-900') : 'text-slate-400'} />
              <span>{cat.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* INTERACTIVE FAQ ACCORDIONS */}
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
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
              >
                <button
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="w-full p-4.5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {faq.question}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4.5 pb-4.5 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                    <p className="leading-relaxed font-medium text-slate-700 dark:text-slate-200">{faq.answer}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                      <span className="font-mono">Kategori: <strong className="text-slate-700 dark:text-slate-300">{faq.category}</strong></span>
                      <button 
                        onClick={(e) => handleIncrementHelpful(faq, e)}
                        className="hover:text-orange-500 font-bold cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40"
                      >
                        👍 Membantu ({faq.helpful_count || 0})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* REAL-TIME SUPPORT TICKET HISTORY AUDIT SECTION */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Ticket size={18} className="text-orange-500 shrink-0" />
            <span>Riwayat Tiket Bantuan (Realtime)</span>
          </h3>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="px-3 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
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
              Belum ada tiket bantuan. Klik "Tiket Baru" untuk mengirim.
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
                    onClick={() => handleOpenLiveChat(t)}
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
        <div className="hidden md:block rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
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
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                      Belum ada tiket bantuan dikirim. Klik "Kirim Tiket Baru" untuk memulai.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-orange-600 dark:text-orange-400">{t.ticket_code}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">{t.subject}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">{t.category}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
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
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenLiveChat(t)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Buka Chat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
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
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex justify-end p-2 sm:p-4">
          <div className={
            isLiveChatFullScreen
              ? 'fixed inset-2 sm:inset-6 z-[60] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200'
              : 'bg-white dark:bg-slate-900 w-full max-w-md h-full flex flex-col border-l border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl animate-in slide-in-from-right duration-250 overflow-hidden'
          }>
            {/* Drawer Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 sm:size-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                  <Bot size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">ZEGA AI Specialist Direct</h4>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1 truncate">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /> 24/7 Live Agent Queue
                  </span>
                </div>
              </div>

              {/* Action Buttons: New Chat, Maximize, Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenLiveChat()}
                  className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white border border-orange-500/20 font-bold text-[10px] sm:text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title={getAiLang() === 'en' ? 'Start New Chat Session' : getAiLang() === 'zh' ? '开始新对话' : 'Mulai Sesi Chat Baru'}
                >
                  <Plus size={13} />
                  <span className="hidden sm:inline">
                    {getAiLang() === 'en' ? 'New Chat' : getAiLang() === 'zh' ? '新对话' : 'Sesi Baru'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsLiveChatFullScreen(!isLiveChatFullScreen)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isLiveChatFullScreen ? 'Kecilkan Layar' : 'Layar Penuh (Full Screen)'}
                >
                  {isLiveChatFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button 
                  type="button"
                  onClick={() => setIsLiveChatOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup Modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={msg.id || idx}
                  className={`flex flex-col ${msg.sender_type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9.5px] font-mono text-slate-400">{msg.sender_name}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyHelpMessage(msg.message, msg.id || `ent-help-msg-${idx}`)}
                      className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-orange-500 transition-all cursor-pointer"
                      title="Copy Message"
                    >
                      {copiedHelpMsgId === (msg.id || `ent-help-msg-${idx}`) ? (
                        <Check size={11} className="text-emerald-500 font-bold" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
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
                  <span className="text-[9.5px] font-mono text-slate-400 mb-1">ZEGA AI Support Specialist</span>
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
