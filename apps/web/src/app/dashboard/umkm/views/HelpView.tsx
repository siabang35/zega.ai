import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Search, BookOpen, MessageSquare, Ticket, 
  Send, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle,
  Sparkles, ExternalLink, Zap, Shield, Code, Headphones, X, Bot,
  Plus, Maximize2, Minimize2, History, ArrowLeft, ChevronRight, Trash2
} from 'lucide-react';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { getApiBase } from '../../../../config/api';
import { getR2CdnUrl } from '../../../utils/cdn';
import { DocsPage } from '../../../DocsPage';

// Helper to strip markdown formatting symbols and excessive emojis from plain text previews
const stripMarkdown = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[\*\_\#\`]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Comprehensive FAQ i18n Dictionary for en, id, and zh
const FAQ_I18N: Record<string, Record<string, { question: string; answer: string; category: string }>> = {
  '1': {
    en: { question: 'How to get started with ZEGA AI Platform?', answer: 'You can navigate to the Home menu and AI Employees to activate your first AI assistant.', category: 'Introduction' },
    id: { question: 'Bagaimana cara memulai dengan ZEGA AI Platform?', answer: 'Anda dapat menavigasi ke menu Beranda dan AI Employees untuk mengaktifkan asisten AI pertama Anda.', category: 'Pengenalan' },
    zh: { question: '如何开始使用 ZEGA AI 平台？', answer: '您可以导航至首页菜单和 AI Employees 来激活您的首个 AI 助手。', category: '简介' }
  },
  '2': {
    en: { question: 'How to create a new automation workflow?', answer: 'Open the Automation menu in business navigation, click "+ Create Automation", and select order/inventory triggers.', category: 'Automation' },
    id: { question: 'Bagaimana cara membuat workflow otomatisasi baru?', answer: 'Buka menu Automation di navigasi bisnis, klik tombol "+ Buat Automation", pilih trigger pesanan/stok.', category: 'Otomatisasi' },
    zh: { question: '如何创建新的自动化工作流？', answer: '打开业务导航中的 Automation 菜单，点击“+ 创建自动化”，并选择订单/库存触发器。', category: '自动化' }
  },
  '3': {
    en: { question: 'What is the difference between Customer Support Agent and Sales Agent?', answer: 'Customer Support Agent handles general inquiries, while Sales Agent actively promotes products and closes sales.', category: 'AI Employees' },
    id: { question: 'Apa bedanya Customer Support Agent dengan Sales Agent?', answer: 'Customer Support Agent menjawab pertanyaan umum, sedangkan Sales Agent aktif melakukan promosi dan closing.', category: 'AI Employees' },
    zh: { question: '客服 AI Agent 与销售 AI Agent 有何区别？', answer: '客服 Agent 回答常见咨询，而销售 Agent 主动推广产品并促成交易。', category: 'AI Employees' }
  },
  '4': {
    en: { question: 'How do I upgrade my subscription plan?', answer: 'Click the Upgrade button in the top header or go to Settings > Billing & Invoice to select Scale/Enterprise plans.', category: 'Billing & Plan' },
    id: { question: 'Bagaimana cara mengupgrade paket langganan?', answer: 'Klik tombol Upgrade di header atas atau ke Settings > Billing & Invoice untuk memilih paket Scale/Enterprise.', category: 'Billing & Paket' },
    zh: { question: '如何升级订阅套餐？', answer: '点击顶部导航栏中的 Upgrade 按钮，或转到 Settings > Billing & Invoice 选择 Scale/Enterprise 套餐。', category: '账单与套餐' }
  },
  '5': {
    en: { question: 'Where can I obtain a ZEGA API Key?', answer: 'Navigate to Settings > API Keys, then click "+ Generate New API Key".', category: 'API & Integration' },
    id: { question: 'Di mana saya bisa mendapatkan API Key ZEGA?', answer: 'Navigasi ke menu Settings > API Keys, lalu klik "+ Generate API Key Baru".', category: 'API & Integrasi' },
    zh: { question: '在何处获取 ZEGA API 密钥？', answer: '导航至 Settings > API Keys 菜单，然后点击“+ 生成新 API 密钥”。', category: 'API 与集成' }
  },
  '6': {
    en: { question: 'What is ZeroClaw Autonomous Agent?', answer: 'ZeroClaw is ZEGA’s autonomous AI Agent architecture capable of executing business workflow automations without manual oversight.', category: 'Introduction' },
    id: { question: 'Apa itu ZeroClaw Autonomous Agent?', answer: 'ZeroClaw adalah arsitektur AI Agent mandiri dari ZEGA yang dapat mengeksekusi otomatisasi tugas bisnis tanpa pengawasan manual.', category: 'Pengenalan' },
    zh: { question: '什么是 ZeroClaw 自主 AI Agent？', answer: 'ZeroClaw 是 ZEGA 的自主 AI Agent 架构，可无须人工干预地自动执行业务任务。', category: '简介' }
  },
  '7': {
    en: { question: 'How to connect WhatsApp Business API?', answer: 'Go to Integrations > WhatsApp menu, then follow Meta Cloud API authentication steps or scan QR Code.', category: 'Automation' },
    id: { question: 'Bagaimana menghubungkan WhatsApp Business API?', answer: 'Masuk ke menu Integrasi > WhatsApp, lalu ikuti langkah otentikasi Meta Cloud API atau scan QR Code Webhook.', category: 'Otomatisasi' },
    zh: { question: '如何连接 WhatsApp Business API？', answer: '进入 Integrations > WhatsApp 菜单，然后按照 Meta Cloud API 认证步骤或扫描 Webhook 二维码。', category: '自动化' }
  },
  '8': {
    en: { question: 'How to use ZEGA REST API and SDK?', answer: 'Use the API Key created in Settings > API Keys. Endpoint specifications and Webhook guides are available in the API Documentation button.', category: 'API & Integration' },
    id: { question: 'Bagaimana cara menggunakan REST API dan SDK ZEGA?', answer: 'Gunakan API Key yang dibuat pada menu Settings > API Keys. Rincian endpoint dan dokumentasi Webhook tersedia pada tombol API Documentation.', category: 'API & Integrasi' },
    zh: { question: '如何使用 ZEGA REST API 和 SDK？', answer: '使用在 Settings > API Keys 中创建的 API 密钥。端点详情和 Webhook 指南可在 API Documentation 按钮中获取。', category: 'API 与集成' }
  }
};

export const HelpView: React.FC = () => {
  const { t, language } = useLanguage();
  const activeLang = language || 'id';
  const [faqs, setFaqs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Ticket Modal, API Docs Modal & Live Chat State
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isLiveChatFullScreen, setIsLiveChatFullScreen] = useState(false);
  const [activeHelpChatId, setActiveHelpChatId] = useState<string | null>(null);

  // Collapsible Section Toggle States (Default Closed)
  const [isFaqSectionOpen, setIsFaqSectionOpen] = useState(false);
  const [isTicketsSectionOpen, setIsTicketsSectionOpen] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Recent Direct Help History State
  const [showDirectHelpHistory, setShowDirectHelpHistory] = useState(false);
  const [directHelpHistoryList, setDirectHelpHistoryList] = useState<any[]>([]);
  const [directHelpHistorySearch, setDirectHelpHistorySearch] = useState('');

  const filteredDirectHelpHistoryList = directHelpHistoryList.filter(session =>
    (session.title || '').toLowerCase().includes(directHelpHistorySearch.toLowerCase()) ||
    (session.last_message || '').toLowerCase().includes(directHelpHistorySearch.toLowerCase())
  );

  const fetchDirectHelpHistoryList = async () => {
    try {
      const recentRpcList = await SupabaseDashboardService.getUmkmRecentChatHistory('demo-owner', 'live_help');
      if (recentRpcList && recentRpcList.length > 0) {
        setDirectHelpHistoryList(recentRpcList.map((item: any) => ({
          id: item.chat_id,
          title: item.title,
          created_at: item.updated_at || item.created_at,
          last_message: item.last_message
        })));
        return;
      }
      const list = await SupabaseDashboardService.getUmkmLiveHelpChats('11111111-1111-1111-1111-111111111111', 'demo-owner');
      if (list) setDirectHelpHistoryList(list);
    } catch (e) {
      console.warn('Note loading help chat list:', e);
    }
  };

  useEffect(() => {
    if (showDirectHelpHistory) {
      fetchDirectHelpHistoryList();
    }
  }, [showDirectHelpHistory]);

  const handleDeleteDirectHelpSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const ok = await SupabaseDashboardService.deleteUmkmLiveHelpChat(sessionId);
      if (ok) {
        setDirectHelpHistoryList((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeHelpChatId === sessionId) {
          setActiveHelpChatId(null);
          const lang = getAiLang();
          const seedMsg = lang === 'en'
            ? 'Hello! Welcome to the ZEGA UMKM Support Center. How can I help you today regarding WhatsApp API, Auto POS, or AI Employees?'
            : lang === 'zh'
            ? '你好！欢迎来到 ZEGA UMKM 支持中心。关于 WhatsApp API、自动收银台或 AI 员工，有什么可以帮您的？'
            : 'Halo! Selamat datang di Pusat Bantuan UMKM ZEGA. Ada yang bisa saya bantu terkait WhatsApp API, Kasir Otomatis, atau AI Employees?';
          setChatMessages([{
            id: '1',
            sender_type: 'ai_specialist',
            sender_name: 'ZEGA UMKM Support Assistant',
            message: seedMsg,
            created_at: new Date().toISOString()
          }]);
        }
      }
    } catch (err) {
      console.warn('Error deleting direct help session:', err);
    }
  };

  const handleSelectDirectHelpSession = async (session: any) => {
    try {
      setActiveHelpChatId(session.id);
      const dbMsgs = await SupabaseDashboardService.getUmkmLiveHelpMessages(session.id);
      const lang = getAiLang();
      if (dbMsgs && dbMsgs.length > 0) {
        const formatted = dbMsgs.map((m: any, idx: number) => ({
          id: m.id || idx.toString(),
          sender_type: m.sender === 'user' ? 'user' : 'ai_specialist',
          sender_name: m.sender === 'user' ? (lang === 'en' ? 'UMKM User' : lang === 'zh' ? 'UMKM 用户' : 'Pengguna UMKM') : 'ZEGA UMKM Support Assistant',
          message: m.text,
          created_at: m.created_at || new Date().toISOString()
        }));
        setChatMessages(formatted);
      }
      setShowDirectHelpHistory(false);
    } catch (e) {
      console.warn('Error selecting direct help session:', e);
    }
  };

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

  // UI Interface Language (for titles, buttons, placeholders)
  const getUiLang = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zega_language') || localStorage.getItem('zega_umkm_language');
      if (saved) {
        const lower = saved.toLowerCase();
        if (lower === 'en' || lower.includes('english')) return 'en';
        if (lower === 'zh' || lower.includes('mandarin') || lower.includes('chinese')) return 'zh';
        if (lower === 'id' || lower.includes('indonesia')) return 'id';
      }
    }
    return 'id';
  };

  // AI Output Result Language Preference (for backend AI response generation)
  const getAiPrefLang = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zega_ai_default_language');
      if (saved) {
        const lower = saved.toLowerCase();
        if (lower === 'en' || lower.includes('english')) return 'en';
        if (lower === 'zh' || lower.includes('mandarin') || lower.includes('chinese')) return 'zh';
        if (lower === 'id' || lower.includes('indonesia')) return 'id';
      }
    }
    return getUiLang();
  };

  const getAiLang = getUiLang;

  const [tierUsage, setTierUsage] = useState<any>(null);

  const handleOpenLiveChat = async () => {
    setIsLiveChatOpen(true);
    const lang = getAiLang();
    const seedMsg = lang === 'en'
      ? 'Hello! Welcome to the ZEGA UMKM Support Center. How can I help you today regarding WhatsApp API, Auto POS, or AI Employees?'
      : lang === 'zh'
      ? '你好！欢迎来到 ZEGA UMKM 支持中心。关于 WhatsApp API、自动收银台或 AI 员工，有什么可以帮您的？'
      : 'Halo! Selamat datang di Pusat Bantuan UMKM ZEGA. Ada yang bisa saya bantu terkait WhatsApp API, Kasir Otomatis, atau AI Employees?';

    try {
      const usage = await SupabaseDashboardService.getUserChatTierUsage('demo-owner');
      if (usage) setTierUsage(usage);

      const sessionList = await SupabaseDashboardService.getUmkmLiveHelpChats('11111111-1111-1111-1111-111111111111', 'demo-owner');
      const session = (sessionList && sessionList.length > 0) ? sessionList[0] : null;
      if (session && session.id) {
        setActiveHelpChatId(session.id);
        const dbMsgs = await SupabaseDashboardService.getUmkmLiveHelpMessages(session.id);
        if (dbMsgs && dbMsgs.length > 0) {
          const formatted = dbMsgs.map((m: any, idx: number) => ({
            id: m.id || idx.toString(),
            sender_type: m.sender === 'user' ? 'user' : 'ai_specialist',
            sender_name: m.sender === 'user' ? (lang === 'en' ? 'UMKM User' : lang === 'zh' ? 'UMKM 用户' : 'Pengguna UMKM') : 'ZEGA UMKM Support Assistant',
            message: m.text,
            created_at: m.created_at || new Date().toISOString()
          }));
          setChatMessages(formatted);
          return;
        }
      }
    } catch (e) {
      console.warn('Note loading live chat history:', e);
    }

    setChatMessages([
      {
        id: '1',
        sender_type: 'ai_specialist',
        sender_name: 'ZEGA UMKM Support Assistant',
        message: seedMsg,
        created_at: new Date().toISOString()
      }
    ]);
  };

  const handleNewLiveChatSession = async () => {
    try {
      const newChat = await SupabaseDashboardService.createUmkmLiveHelpChat('11111111-1111-1111-1111-111111111111', 'demo-owner', `Live Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      if (newChat) {
        setActiveHelpChatId(newChat.id);
        const lang = getAiLang();
        const seedMsg = lang === 'en'
          ? 'Hello! Welcome to the ZEGA UMKM Support Center. How can I help you today regarding WhatsApp API, Auto POS, or AI Employees?'
          : lang === 'zh'
          ? '你好！欢迎来到 ZEGA UMKM 支持中心。关于 WhatsApp API、自动收银台或 AI 员工，有什么可以帮您的？'
          : 'Halo! Selamat datang di Pusat Bantuan UMKM ZEGA. Ada yang bisa saya bantu terkait WhatsApp API, Kasir Otomatis, atau AI Employees?';
        setChatMessages([
          {
            id: Date.now().toString(),
            sender_type: 'ai_specialist',
            sender_name: 'ZEGA UMKM Support Assistant',
            message: seedMsg,
            created_at: new Date().toISOString()
          }
        ]);
        await SupabaseDashboardService.saveUmkmLiveHelpMessage({
          chat_id: newChat.id,
          user_id: 'demo-owner',
          sender: 'ai',
          text: seedMsg
        });
      }
    } catch (e) {
      console.warn('Error creating new live chat session:', e);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiThinking) return;

    const userMsg = chatInput;
    const currentAiLang = getAiPrefLang();
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

    let chatIdToUse = activeHelpChatId;
    if (!chatIdToUse) {
      try {
        const title = `Live Help: ${userMsg.trim().slice(0, 25)}`;
        const newChat = await SupabaseDashboardService.createUmkmLiveHelpChat('11111111-1111-1111-1111-111111111111', 'demo-owner', title);
        if (newChat && newChat.id) {
          chatIdToUse = newChat.id;
          setActiveHelpChatId(newChat.id);
        }
      } catch (e) {
        console.warn('Error auto-creating live help chat:', e);
      }
    }

    if (chatIdToUse) {
      await SupabaseDashboardService.saveUmkmLiveHelpMessage({
        chat_id: chatIdToUse,
        user_id: 'demo-owner',
        sender: 'user',
        text: userMsg
      });
    }

    try {
      const envApi = (import.meta as any).env?.VITE_API_URL;
      const isProdDomain = typeof window !== 'undefined' && window.location.hostname.includes('zegaai.site');
      let rawBase = (isProdDomain && (!envApi || envApi.includes('localhost')))
        ? 'https://zega-ai.onrender.com'
        : (envApi || getApiBase());
      const cleanBaseUrl = rawBase.replace(/\/+$/, '').replace(/\/v1$/, '');

      let aiReply = '';

      // Try Enterprise Copilot Chat Endpoint First
      try {
        const prefStyle = (typeof window !== 'undefined' && localStorage.getItem('zega_ai_response_style')) || 'Profesional';
        const prefLen = (typeof window !== 'undefined' && localStorage.getItem('zega_ai_response_length')) || 'Sedang';
        const prefFormat = (typeof window !== 'undefined' && localStorage.getItem('zega_ai_response_format')) || 'Ringkas';
        const prefModel = (typeof window !== 'undefined' && localStorage.getItem('zega_ai_default_model')) || 'GPT-4o (Recommended)';

        const res = await fetch(`${cleanBaseUrl}/v1/enterprise/copilot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg,
            language: currentAiLang,
            response_style: prefStyle,
            response_length: prefLen,
            response_format: prefFormat,
            default_model: prefModel,
            agent_role: 'ZEGA AI Specialist Direct'
          })
        });
        if (res.ok) {
          const data = await res.json();
          aiReply = data.data?.message || data.message || '';
        }
      } catch (e) {
        // Retry with UMKM Copilot Endpoint
        try {
          const prefStyle = (typeof window !== 'undefined' && localStorage.getItem('zega_ai_response_style')) || 'Profesional';
          const prefLen = (typeof window !== 'undefined' && localStorage.getItem('zega_ai_response_length')) || 'Sedang';
          const prefFormat = (typeof window !== 'undefined' && localStorage.getItem('zega_ai_response_format')) || 'Ringkas';
          const prefModel = (typeof window !== 'undefined' && localStorage.getItem('zega_ai_default_model')) || 'GPT-4o (Recommended)';

          const res2 = await fetch(`${cleanBaseUrl}/v1/umkm/copilot/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMsg,
              language: currentAiLang,
              userId: 'demo-owner',
              response_style: prefStyle,
              response_length: prefLen,
              response_format: prefFormat,
              default_model: prefModel
            })
          });
          if (res2.ok) {
            const data2 = await res2.json();
            aiReply = data2.data?.message || data2.message || '';
          }
        } catch (err2) {
          console.warn('Backend proxy fetch note:', err2);
        }
      }

      // Enterprise-Grade Natural & Friendly AI Specialist Support Engine
      if (!aiReply) {
        const promptLower = userMsg.toLowerCase().trim();

        if (promptLower.includes('fashion') || promptLower.includes('baju') || promptLower.includes('pakaian') || promptLower.includes('distro') || promptLower.includes('boutique')) {
          aiReply = currentAiLang === 'en'
            ? `For a fashion & apparel business, ZEGA optimizes your entire workflow:\n\n1. **WhatsApp AI Catalog & Size Guide**: Customers can browse clothing 24/7 and receive automated sizing advice.\n2. **AI Sales Swarm Campaigns**: Run automated WA promo broadcasts when releasing new seasonal collections or flash sales.\n3. **Auto POS & Multi-Variant Inventory**: Track color and size variants (S, M, L, XL) in real-time with automated low-stock reorder alerts.\n\nWould you like assistance configuring your fashion product catalog or setting up WhatsApp promo broadcasts first?`
            : currentAiLang === 'zh'
            ? `对于服装与时尚店铺，ZEGA 可以全面优化您的业务流程：\n\n1. **WhatsApp AI 目录与尺码指南**：客户可 24/7 浏览服装系列并获取自动尺码建议。\n2. **AI 销售团队活动**：在新季上新或限时抢购时群发 WhatsApp 促销信息。\n3. **自动 POS 与多尺码库存追踪**：实时追踪颜色/尺码（S, M, L, XL）库存，并接收低库存自动提醒。\n\n需要我协助配置服装目录还是激活 WhatsApp 促销群发？`
            : `Untuk toko fashion & pakaian, ZEGA mengoptimalkan seluruh operasional Anda:\n\n1. **Katalog WA AI & Panduan Ukuran**: Pelanggan bisa melihat koleksi baju 24/7 dan mendapatkan saran ukuran otomatis.\n2. **Kampanye AI Sales Swarm**: Menjalankan broadcast promo otomatis saat ada koleksi baru atau flash sale.\n3. **Kasir POS & Manajemen Stok Varian**: Memantau stok warna/ukuran (S, M, L, XL) secara real-time dengan peringatan stok menipis.\n\nMau disiapkan katalog produk fashion atau diaktifkan pesan promo WA terlebih dahulu Kak?`;
        } else if (promptLower.includes('profit') || promptLower.includes('untung') || promptLower.includes('omzet') || promptLower.includes('penjualan') || promptLower.includes('revenue') || promptLower.includes('margin') || promptLower.includes('make more')) {
          aiReply = currentAiLang === 'en'
            ? `To maximize your store profits and net margins, ZEGA delivers 3 key growth drivers:\n\n1. **Automated WhatsApp Re-engagement**: Convert abandoned cart prospects & repeat customers 24/7.\n2. **AI Sales Swarm Cross-Selling**: Automatically recommend high-margin products to existing customers.\n3. **POS Profit Margin Analytics**: Identify your top 20% profitable items and optimize sales pricing.\n\nWhich profit-boosting strategy would you like to launch today?`
            : currentAiLang === 'zh'
            ? `为了提升您的店铺利润与营业额，ZEGA 提供 3 个核心增长引擎：\n\n1. **WhatsApp 自动追单与复购**：自动向未付款客户发送提醒以促成成交。\n2. **AI 销售团队交叉销售**：自动向老客户推荐配套商品。\n3. **高利润 POS 分析**：识别贡献 20% 主要利润的热销商品并优化定价。\n\n今天想先启动哪个利润增长策略？`
            : `Untuk menggenjot profit dan omzet toko Kakak, ZEGA menyediakan 3 pendorong pertumbuhan utama:\n\n1. **Follow-up Pembeli WA Otomatis**: Menghubungi calon pembeli & memproses pesanan tertunda secara otomatis.\n2. **AI Sales Swarm Cross-Selling**: Merekomendasikan produk pelengkap ke pelanggan lama secara otomatis.\n3. **Analitik Margin Produk POS**: Mengidentifikasi 20% produk paling menguntungkan untuk optimasi harga.\n\nStrategi peningkat profit mana yang ingin Kakak jalankan terlebih dahulu?`;
        } else if (promptLower.includes('know') || promptLower.includes('bingung') || promptLower.includes('tidak tahu') || promptLower.includes('gimana') || promptLower.includes('apa aja')) {
          aiReply = currentAiLang === 'en'
            ? `No worries at all! Let's start with your store's biggest priority:\n- Want **24/7 automated WhatsApp customer ordering**?\n- Need a **fast Auto POS cashier system** for daily sales?\n- Want to track **inventory stock & supplier alerts**?\n\nTell me a bit about your business and I'll tailor the exact setup for you!`
            : currentAiLang === 'zh'
            ? `完全没问题！让我们从您店铺最重要的需求开始：\n- 需要 **24 小时 WhatsApp 自动接单**？\n- 需要 **高效的 POS 收银系统** 处理日常销售？\n- 想要 **管理商品库存与供应商提醒**？\n\n简单告诉我一些您店铺的情况，我来为您定制最合适的配置！`
            : `Tidak masalah Kak! Mari kita mulai dari kebutuhan toko Kakak yang paling utama:\n- Mau **otomatisasi WA untuk terima pesanan 24 jam**?\n- Butuh **sistem Kasir POS cepat** untuk transaksi harian?\n- Ingin **memantau stok barang & peringatan supplier**?\n\nCeritakan sedikit tentang toko Kakak, nanti saya bantu siapkan alur yang paling pas!`;
        } else if (promptLower.includes('zega') || promptLower.includes('platform') || promptLower.includes('explain') || promptLower.includes('apa itu')) {
          aiReply = currentAiLang === 'en'
            ? `ZEGA is an Enterprise-Grade Autonomous AI Platform designed for UMKM & modern businesses. It integrates Auto POS cashier systems, 24/7 WhatsApp API automation, multi-agent AI Swarms (sales, customer support, inventory management), and real-time store analytics into a unified workspace. How can I assist you with your ZEGA store configuration today?`
            : currentAiLang === 'zh'
            ? `ZEGA 是为中小微企业与现代商家设计的企业级自主 AI 平台。它集成了自动收银 POS 系统、24/7 WhatsApp API 自动化、多智能体 AI Swarms（销售、客服与库存管理）以及实时店铺数据分析。今天有什么可以协助您设置 ZEGA 的？`
            : `ZEGA adalah platform AI Otonom kelas Enterprise yang dirancang khusus untuk UMKM dan bisnis modern. ZEGA mengintegrasikan sistem Kasir Otomatis (POS), otomatisasi WhatsApp API 24/7, tim AI Swarm (penjualan, layanan pelanggan, dan stok barang), serta analitik toko real-time dalam satu dasbor terpadu. Ada modul ZEGA yang ingin Kakak ketahui lebih lanjut?`;
        } else if (promptLower.includes('whatsapp') || promptLower.includes('wa') || promptLower.includes('broadcast') || promptLower.includes('template')) {
          aiReply = currentAiLang === 'en'
            ? `For WhatsApp API & broadcast setup, ensure your Webhook status is Connected under Dashboard > Integrations. You can send automated order receipts, broadcast promo campaigns, or enable 24/7 AI catalog chats. Would you like assistance drafting a broadcast template?`
            : currentAiLang === 'zh'
            ? `关于 WhatsApp API 与群发设置，请确保在仪表板 > 集成中已连接 Webhook。您可以自动发送订单收据、群发促销活动或启用 24/7 AI 目录对话。需要我帮您撰写群发文案吗？`
            : `Untuk otomatisasi WhatsApp API & broadcast promo, pastikan status Webhook sudah *Terhubung* di menu Dashboard > Integrasi ya. Struk transaksi akan otomatis terkirim via WA, dan Kakak bisa membuat pesan broadcast pelanggan kapan saja. Ada draf promo yang ingin dibantu buat hari ini?`;
        } else if (promptLower.includes('kasir') || promptLower.includes('pos') || promptLower.includes('transaksi') || promptLower.includes('printer') || promptLower.includes('struk')) {
          aiReply = currentAiLang === 'en'
            ? `For the Auto POS cashier system, all store sales and online orders are synced in real-time. If thermal printing is delayed, try re-pairing your Bluetooth/USB printer or refreshing your cashier session. What specific cashier feature can I help you configure?`
            : currentAiLang === 'zh'
            ? `关于自动收银 POS 系统，线下与线上销售数据会进行实时同步。如果热敏打印机未响应，请尝试刷新收银页面或重新连接打印机。有具体的收银功能需要我协助配置吗？`
            : `Untuk sistem Kasir Otomatis (POS), data penjualan toko fisik & online Kakak tersinkronisasi secara otomatis. Jika printer thermal Bluetooth/USB belum merespons, coba segarkan sesi kasir atau hubungkan ulang printer ya Kak. Ada kendala kasir yang perlu dicek lagi Kak?`;
        } else if (promptLower.includes('stok') || promptLower.includes('inventory') || promptLower.includes('barang') || promptLower.includes('gudang')) {
          aiReply = currentAiLang === 'en'
            ? `For inventory management, stock levels automatically update with every POS transaction or WhatsApp order. You can set minimum stock thresholds to trigger automatic low-stock alerts. Would you like me to guide you through setting up supplier reorder alerts?`
            : currentAiLang === 'zh'
            ? `关于库存管理，每当通过 POS 或 WhatsApp 发生销售时，商品库存都会自动更新。您还可以设置低库存预警以便及时补货。需要我协助检查今天的库存提醒吗？`
            : `Mengenai manajemen stok barang, jumlah stok otomatis berkurang setiap ada transaksi kasir atau pesanan WA. Kakak juga bisa mengatur batas stok minimum agar peringatan otomatis muncul saat barang mulai tipis. Ada daftar stok barang yang perlu diperiksa hari ini Kak?`;
        } else if (promptLower.includes('halo') || promptLower.includes('hi') || promptLower.includes('hello') || promptLower.includes('pagi') || promptLower.includes('siang') || promptLower.includes('malam') || promptLower.includes('selamat')) {
          aiReply = currentAiLang === 'en'
            ? `Hello! 👋 Welcome to ZEGA AI Support Specialist Direct. How can I help make your store operations smoother today? Feel free to ask about WhatsApp API, POS cashier setup, or stock management!`
            : currentAiLang === 'zh'
            ? `您好！👋 欢迎来到 ZEGA AI 直连支持。今天有什么可以协助您的店铺运营？无论是 WhatsApp API、POS 收银设置还是库存管理，随时告诉我！`
            : `Halo Kak! 👋 Selamat datang di ZEGA Support Direct. Ada yang bisa saya bantu untuk kelancaran operasional toko Kakak hari ini? Boleh tanyakan apa saja seputar Kasir POS, WhatsApp API, atau manajemen stok ya Kak!`;
        } else {
          // Flexible, Warm, Natural Support Response for any query
          aiReply = currentAiLang === 'en'
            ? `I am right here to help make your store operations run smoothly! You can ask me anything about setting up your Auto POS cashier, configuring 24/7 WhatsApp API automation, managing inventory stock, or activating AI Swarm agents. What area of your business would you like to optimize right now?`
            : currentAiLang === 'zh'
            ? `我随时在此协助您的店铺运营！您可以咨询任何关于 POS 收银设置、24/7 WhatsApp API 自动化、库存管理或 AI Swarm 员工激活的问题。今天想优化哪个环节？`
            : `Saya siap membantu kelancaran operasional toko Kakak! Kakak bisa menanyakan apa saja seputar pengaturan Kasir POS, otomatisasi WhatsApp API 24/7, pengelolaan stok barang, atau aktivasi AI Swarm agents. Ada bagian operasional yang ingin disempurnakan hari ini?`;
        }
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender_type: 'ai_specialist',
          sender_name: 'ZEGA Support Specialist',
          message: aiReply,
          created_at: new Date().toISOString()
        }
      ]);

      if (chatIdToUse) {
        await SupabaseDashboardService.saveUmkmLiveHelpMessage({
          chat_id: chatIdToUse,
          user_id: 'demo-owner',
          sender: 'ai',
          text: aiReply
        });
        fetchDirectHelpHistoryList();
      }
    } catch (err) {
      const currentLang = getAiLang();
      const fallback = currentLang === 'en'
        ? `Thank you! Your inquiry "${userMsg}" has been registered in the ZEGA Support direct queue.`
        : currentLang === 'zh'
        ? `感谢您！您的咨询 "${userMsg}" 已记录在 ZEGA 直连支持队列中。`
        : `Terima kasih! Pertanyaan Anda "${userMsg}" telah terdaftar di antrean direct support ZEGA.`;
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender_type: 'ai_specialist',
          sender_name: 'ZEGA Support Specialist',
          message: fallback,
          created_at: new Date().toISOString()
        }
      ]);
      if (chatIdToUse) {
        await SupabaseDashboardService.saveUmkmLiveHelpMessage({
          chat_id: chatIdToUse,
          user_id: 'demo-owner',
          sender: 'ai',
          text: fallback
        });
        fetchDirectHelpHistoryList();
      }
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

  const categoriesList = [
    { nameKey: 'all', fallback: 'Semua', icon: BookOpen, count: faqs.length },
    { nameKey: 'introduction', fallback: 'Pengenalan', icon: Sparkles, count: faqs.filter(f => f.category === 'Pengenalan' || f.category === 'Introduction').length },
    { nameKey: 'automation', fallback: 'Otomatisasi', icon: Zap, count: faqs.filter(f => f.category === 'Otomatisasi' || f.category === 'Automation').length },
    { nameKey: 'aiEmployees', fallback: 'AI Employees', icon: Headphones, count: faqs.filter(f => f.category === 'AI Employees' || f.category?.includes('AI')).length },
    { nameKey: 'billingPlan', fallback: 'Billing & Paket', icon: Shield, count: faqs.filter(f => f.category === 'Billing & Paket' || f.category?.includes('Billing')).length },
    { nameKey: 'apiIntegration', fallback: 'API & Integrasi', icon: Code, count: faqs.filter(f => f.category === 'API & Integrasi' || f.category?.includes('API')).length }
  ];

  const getCategoryLabel = (nameKey: string, fallback: string) => {
    return (t.helpView?.categories as any)?.[nameKey] || fallback;
  };

  const filteredFaqs = faqs.filter(faq => {
    const isAll = selectedCategory === 'Semua' || selectedCategory === 'All' || selectedCategory === 'all';
    let matchCategory = isAll;
    if (!isAll) {
      if (selectedCategory === 'Pengenalan' || selectedCategory === 'Introduction') {
        matchCategory = faq.category === 'Pengenalan' || faq.category === 'Introduction';
      } else if (selectedCategory === 'Otomatisasi' || selectedCategory === 'Automation') {
        matchCategory = faq.category === 'Otomatisasi' || faq.category === 'Automation';
      } else if (selectedCategory === 'AI Employees') {
        matchCategory = faq.category === 'AI Employees' || faq.category?.includes('AI');
      } else if (selectedCategory.includes('Billing') || selectedCategory.includes('Paket')) {
        matchCategory = faq.category?.includes('Billing') || faq.category?.includes('Paket');
      } else if (selectedCategory.includes('API') || selectedCategory.includes('Integrasi')) {
        matchCategory = faq.category?.includes('API') || faq.category?.includes('Integrasi');
      } else {
        matchCategory = faq.category === selectedCategory;
      }
    }
    const matchSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (isApiDocsOpen) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto pb-24 md:pb-8">
        {/* Sticky Enterprise Header Bar to return to Help Center */}
        <div className="sticky top-0 z-50 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-lg">
          <button
            onClick={() => setIsApiDocsOpen(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Help Center</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Code size={16} className="text-blue-500" />
            <span className="hidden sm:inline">ZEGA Developer Hub —</span>
            <span className="text-blue-600 dark:text-blue-400">Webhook, SDK & REST API Guides</span>
          </div>
        </div>

        {/* Embedded Interactive Docs Component */}
        <DocsPage onBack={() => setIsApiDocsOpen(false)} isEmbedded={true} />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Hero Header Section (Clean Enterprise Design) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-5 md:p-7 text-white shadow-lg shadow-orange-500/15">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold text-amber-100 border border-white/30 shadow-xs">
              <HelpCircle size={13} className="text-amber-200" />
              <span>{t.helpView?.bannerBadge || 'Pusat Bantuan & Layanan Bimbingan'}</span>
            </div>
            
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-100/90">
              <Sparkles size={13} className="text-amber-300 animate-pulse" />
              <span>ZEGA AI Knowledge Base v2.4</span>
            </span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black tracking-tight drop-shadow-xs">
              {t.helpView?.title || 'Help Center & AI Support'}
            </h1>
            <p className="text-xs text-orange-100 font-medium leading-relaxed max-w-2xl">
              {t.helpView?.subtitle || 'Cari panduan otomatisasi, integrasi API, manajemen AI Employees, atau ajukan tiket bantuan langsung ke tim teknis ZEGA.'}
            </p>
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
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {t.helpView?.cards?.createTicket?.title || 'Buat Tiket Bantuan'}
              </h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t.helpView?.cards?.createTicket?.subtitle || 'Kirimkan pertanyaan teknis langsung ke engineer ZEGA.'}
              </p>
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
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {t.helpView?.cards?.liveChat?.title || 'Live Chat Direct'}
              </h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t.helpView?.cards?.liveChat?.subtitle || 'Respons instan dari AI Support Specialist kami.'}
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setIsApiDocsOpen(true)}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <ExternalLink size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {t.helpView?.cards?.apiDocs?.title || 'Dokumentasi API'}
              </h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t.helpView?.cards?.apiDocs?.subtitle || 'Panduan integrasi Webhook, SDK, dan REST API.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Floating Search Bar (Positioned Directly Above Category Tabs) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.helpView?.searchPlaceholder || 'Cari kata kunci... (contoh: WhatsApp API, Upgrade, Automation, ZeroClaw)'}
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs md:text-sm font-semibold placeholder-slate-400 shadow-2xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-3 focus:ring-orange-500/30 dark:focus:ring-orange-500/40 transition-all"
          />
          
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs transition-all cursor-pointer"
                title="Bersihkan pencarian"
              >
                <X size={13} />
              </button>
            )}
            <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 shadow-2xs select-none">
              <span>Ctrl</span>
              <span>+</span>
              <span>K</span>
            </span>
          </div>
        </div>

        {/* Quick Topic Search Pills */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
          <span className="text-slate-400 font-bold text-[10.5px] uppercase tracking-wider">Populer:</span>
          {[
            { label: 'WhatsApp API', query: 'WhatsApp' },
            { label: 'ZeroClaw', query: 'ZeroClaw' },
            { label: 'Kasir POS', query: 'POS' },
            { label: 'Upgrade Paket', query: 'Upgrade' },
            { label: 'REST API & Webhook', query: 'API' }
          ].map((pill) => (
            <button
              key={pill.label}
              onClick={() => setSearchQuery(pill.query)}
              className={`px-3 py-1 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer border ${
                searchQuery === pill.query
                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categoriesList.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.fallback;
          const label = getCategoryLabel(cat.nameKey, cat.fallback);
          return (
            <button
              key={cat.fallback}
              onClick={() => setSelectedCategory(cat.fallback)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* FAQs Interactive Accordion (Collapsible Enterprise Section - Default Closed) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-all">
        <div 
          onClick={() => setIsFaqSectionOpen(!isFaqSectionOpen)}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{t.helpView?.faqSection?.title || 'Pertanyaan Sering Diajukan (FAQ)'}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold">
                  {filteredFaqs.length} {activeLang === 'en' ? 'Guides' : activeLang === 'zh' ? '个指南' : 'Panduan'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isFaqSectionOpen 
                  ? (activeLang === 'en' ? 'Click to collapse questions list' : activeLang === 'zh' ? '点击折叠问题列表' : 'Klik untuk menutup daftar pertanyaan')
                  : (activeLang === 'en' ? 'Click to expand questions & quick solutions' : activeLang === 'zh' ? '点击展开常见问题与快捷解决方案' : 'Klik untuk membuka daftar pertanyaan & solusi cepat')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-500 group-hover:text-white text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
              aria-label="Toggle FAQs Section"
            >
              <ChevronDown 
                size={18} 
                className={`transition-transform duration-300 ${isFaqSectionOpen ? 'rotate-180' : 'rotate-0'}`} 
              />
            </button>
          </div>
        </div>

        {isFaqSectionOpen && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            {filteredFaqs.map((rawFaq) => {
              const localizedFaq = FAQ_I18N[rawFaq.id]?.[activeLang] || {
                question: rawFaq.question,
                answer: rawFaq.answer,
                category: rawFaq.category
              };
              const isExpanded = expandedFaqId === rawFaq.id;

              return (
                <div 
                  key={rawFaq.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setExpandedFaqId(isExpanded ? null : rawFaq.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {localizedFaq.question}
                    </span>
                    <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
                      <p className="leading-relaxed font-medium">{localizedFaq.answer}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                        <span>{t.helpView?.faqSection?.categoryLabel || 'Kategori:'} <strong>{localizedFaq.category}</strong></span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerToast(`✓ ${t.helpView?.faqSection?.helpfulToast || 'Terima kasih atas masukan Anda!'}`);
                          }}
                          className="hover:text-orange-500 font-bold cursor-pointer"
                        >
                          👍 {t.helpView?.faqSection?.helpful || 'Membantu'} ({rawFaq.helpful_count})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Support Ticket Status Tracker (Collapsible Enterprise Section - Default Closed) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-all">
        <div 
          onClick={() => setIsTicketsSectionOpen(!isTicketsSectionOpen)}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform">
              <Ticket size={20} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{t.helpView?.ticketSection?.title || 'Riwayat Tiket Bantuan (Realtime)'}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold">
                  {tickets.length} {activeLang === 'en' ? 'Tickets' : activeLang === 'zh' ? '工单' : 'Tiket'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isTicketsSectionOpen 
                  ? (activeLang === 'en' ? 'Click to collapse support tickets history' : activeLang === 'zh' ? '点击折叠支持工单历史' : 'Klik untuk menutup riwayat tiket')
                  : (activeLang === 'en' ? 'Click to expand support ticket history & status' : activeLang === 'zh' ? '点击展开支持工单历史与状态' : 'Klik untuk membuka status riwayat tiket bantuan')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsTicketModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send size={13} />
              <span className="hidden sm:inline">{t.helpView?.ticketSection?.newTicketBtn || 'Kirim Tiket Baru'}</span>
              <span className="sm:hidden">{t.helpView?.ticketSection?.newTicketShort || 'Tiket Baru'}</span>
            </button>

            <button 
              type="button"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-500 group-hover:text-white text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
              aria-label="Toggle Support Tickets Section"
            >
              <ChevronDown 
                size={18} 
                className={`transition-transform duration-300 ${isTicketsSectionOpen ? 'rotate-180' : 'rotate-0'}`} 
              />
            </button>
          </div>
        </div>

        {isTicketsSectionOpen && (
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            {/* Mobile View: Stacked Ticket Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {tickets.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                  {t.helpView?.ticketSection?.emptyTickets || 'Belum ada tiket bantuan dikirim. Klik "Tiket Baru" untuk mengirim.'}
                </div>
              ) : (
                tickets.map((tItem) => (
                  <div key={tItem.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{tItem.ticket_code}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <Clock size={11} className="animate-spin" />
                        {tItem.status === 'Selesai' ? (t.helpView?.ticketSection?.statusResolved || 'Selesai') : tItem.status === 'Dalam Peninjauan' ? (t.helpView?.ticketSection?.statusInReview || 'Dalam Peninjauan') : (t.helpView?.ticketSection?.statusPending || tItem.status)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{tItem.subject}</h4>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-medium">{t.helpView?.faqSection?.categoryLabel || 'Kategori:'} <strong>{tItem.category}</strong></span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        tItem.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {tItem.priority === 'Tinggi' ? (t.helpView?.ticketSection?.priorityHigh || 'Tinggi') : tItem.priority === 'Sedang' ? (t.helpView?.ticketSection?.priorityMedium || 'Sedang') : (t.helpView?.ticketSection?.priorityLow || tItem.priority)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(tItem.created_at).toLocaleDateString(getUiLang() === 'en' ? 'en-US' : getUiLang() === 'zh' ? 'zh-CN' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                      <th className="p-3.5">{t.helpView?.ticketSection?.columns?.code || 'Kode Tiket'}</th>
                      <th className="p-3.5">{t.helpView?.ticketSection?.columns?.subject || 'Subjek'}</th>
                      <th className="p-3.5">{t.helpView?.ticketSection?.columns?.category || 'Kategori'}</th>
                      <th className="p-3.5">{t.helpView?.ticketSection?.columns?.priority || 'Prioritas'}</th>
                      <th className="p-3.5">{t.helpView?.ticketSection?.columns?.status || 'Status'}</th>
                      <th className="p-3.5">{t.helpView?.ticketSection?.columns?.date || 'Tanggal'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tickets.map((tItem) => (
                      <tr key={tItem.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-orange-600 dark:text-orange-400">{tItem.ticket_code}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">{tItem.subject}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">{tItem.category}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                            tItem.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {tItem.priority === 'Tinggi' ? (t.helpView?.ticketSection?.priorityHigh || 'Tinggi') : tItem.priority === 'Sedang' ? (t.helpView?.ticketSection?.priorityMedium || 'Sedang') : (t.helpView?.ticketSection?.priorityLow || tItem.priority)}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <Clock size={12} className="animate-spin" />
                            {tItem.status === 'Selesai' ? (t.helpView?.ticketSection?.statusResolved || 'Selesai') : tItem.status === 'Dalam Peninjauan' ? (t.helpView?.ticketSection?.statusInReview || 'Dalam Peninjauan') : (t.helpView?.ticketSection?.statusPending || tItem.status)}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 font-medium">
                          {new Date(tItem.created_at).toLocaleDateString(getUiLang() === 'en' ? 'en-US' : getUiLang() === 'zh' ? 'zh-CN' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Support Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Ticket className="text-orange-500" size={18} />
                <span>{t.helpView?.ticketModal?.title || 'Buat Tiket Bantuan Baru'}</span>
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.helpView?.ticketModal?.subjectLabel || 'Subjek Pertanyaan'}
                </label>
                <input
                  type="text"
                  required
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder={t.helpView?.ticketModal?.subjectPlaceholder || 'Contoh: Kendala pada Sync WhatsApp API'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.helpView?.ticketModal?.categoryLabel || 'Kategori'}
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Otomatisasi">{getCategoryLabel('automation', 'Otomatisasi')}</option>
                    <option value="AI Employees">{getCategoryLabel('aiEmployees', 'AI Employees')}</option>
                    <option value="Billing & Paket">{getCategoryLabel('billingPlan', 'Billing & Paket')}</option>
                    <option value="API & Integrasi">{getCategoryLabel('apiIntegration', 'API & Integrasi')}</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.helpView?.ticketModal?.priorityLabel || 'Prioritas'}
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Rendah">{t.helpView?.ticketSection?.priorityLow || 'Rendah'}</option>
                    <option value="Sedang">{t.helpView?.ticketSection?.priorityMedium || 'Sedang'}</option>
                    <option value="Tinggi">{t.helpView?.ticketSection?.priorityHigh || 'Tinggi'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.helpView?.ticketModal?.messageLabel || 'Detail Pesan / Pertanyaan'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  placeholder={t.helpView?.ticketModal?.messagePlaceholder || 'Jelaskan secara singkat kendala atau pertanyaan yang Anda hadapi...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t.helpView?.ticketModal?.cancelBtn || 'Batal'}
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingTicket ? (t.helpView?.ticketModal?.submittingBtn || 'Mengirim...') : (t.helpView?.ticketModal?.submitBtn || 'Kirim Tiket')}
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
              ? 'relative fixed inset-2 sm:inset-6 z-[60] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200'
              : 'relative bg-white dark:bg-slate-900 w-full max-w-md h-full flex flex-col border-l border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl animate-in slide-in-from-right duration-250 overflow-hidden'
          }>
            {/* Drawer Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 sm:size-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                  <Bot size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                    {t.helpView?.liveChatDrawer?.title || 'ZEGA AI Specialist Direct'}
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1 truncate">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /> {t.helpView?.liveChatDrawer?.queueStatus || '24/7 Live Queue'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: History, New Chat, Maximize, Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDirectHelpHistory(!showDirectHelpHistory)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${showDirectHelpHistory ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title={t.helpView?.liveChatDrawer?.historyTooltip || 'Riwayat Chat'}
                >
                  <History size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleNewLiveChatSession}
                  className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white border border-orange-500/20 font-bold text-[10px] sm:text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title={t.helpView?.liveChatDrawer?.newChatBtn || 'Sesi Baru'}
                >
                  <Plus size={13} />
                  <span className="hidden sm:inline">
                    {t.helpView?.liveChatDrawer?.newChatBtn || 'Sesi Baru'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsLiveChatFullScreen(!isLiveChatFullScreen)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isLiveChatFullScreen ? (t.helpView?.liveChatDrawer?.minimizeTooltip || 'Kecilkan Layar') : (t.helpView?.liveChatDrawer?.maximizeTooltip || 'Layar Penuh')}
                >
                  {isLiveChatFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button 
                  type="button"
                  onClick={() => setIsLiveChatOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t.helpView?.liveChatDrawer?.closeTooltip || 'Tutup Modal'}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ChatGPT-Style Full Overlay Recent Conversations Panel */}
            {showDirectHelpHistory && (
              <div className="absolute inset-0 z-50 bg-white/98 dark:bg-slate-950/98 backdrop-blur-2xl flex flex-col p-4.5 animate-in fade-in zoom-in-95 duration-200">
                {/* Overlay Header Bar */}
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowDirectHelpHistory(false)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                      title="Kembali ke Chat"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <History size={15} className="text-emerald-500 dark:text-emerald-400" />
                        <span>{t.helpView?.liveChatDrawer?.historyTitle || 'Riwayat Chat Help Direct'}</span>
                      </h4>
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                        {filteredDirectHelpHistoryList.length} {t.helpView?.liveChatDrawer?.historySessionsSaved || 'Sesi Tersimpan'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleNewLiveChatSession();
                      setShowDirectHelpHistory(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>{t.helpView?.liveChatDrawer?.newChatBtn || 'Sesi Baru'}</span>
                  </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="relative mb-3 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder={t.helpView?.liveChatDrawer?.historySearchPlaceholder || 'Cari riwayat live help...'}
                    value={directHelpHistorySearch}
                    onChange={(e) => setDirectHelpHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                  {directHelpHistorySearch && (
                    <button
                      onClick={() => setDirectHelpHistorySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Session Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredDirectHelpHistoryList.length === 0 ? (
                    <div className="text-center py-14 px-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <MessageSquare size={28} className="mx-auto mb-2 text-slate-400/60 dark:text-slate-600" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        {t.helpView?.liveChatDrawer?.historyEmpty || 'Belum ada riwayat percakapan Live Help'}
                      </p>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
                        {t.helpView?.liveChatDrawer?.historyEmptySub || 'Klik "+ Sesi Baru" untuk memulai diskusi baru.'}
                      </p>
                    </div>
                  ) : (
                    filteredDirectHelpHistoryList.map((session) => {
                      const isActive = activeHelpChatId === session.id;
                      return (
                        <button
                          key={session.id}
                          onClick={() => handleSelectDirectHelpSession(session)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex flex-col gap-1.5 cursor-pointer group ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-900 dark:text-emerald-300 shadow-sm'
                              : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:translate-x-0.5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold truncate text-xs group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                                {stripMarkdown(session.title) || 'Live Help Session'}
                              </span>
                            </div>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[8.5px] font-extrabold uppercase shrink-0 flex items-center gap-1 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                {t.helpView?.liveChatDrawer?.activeBadge || 'Aktif'}
                              </span>
                            )}
                          </div>
                          {session.last_message && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 truncate font-normal leading-snug">
                              {stripMarkdown(session.last_message)}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-0.5">
                            <span>{new Date(session.created_at || Date.now()).toLocaleDateString(getUiLang() === 'en' ? 'en-US' : getUiLang() === 'zh' ? 'zh-CN' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDirectHelpSession(session.id, e)}
                                title={t.helpView?.liveChatDrawer?.deleteChatTooltip || 'Hapus Sesi Chat'}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                              <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
                                {t.helpView?.liveChatDrawer?.openChatBtn || 'Buka Chat'} <ChevronRight size={12} />
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

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
                  <span className="text-[9.5px] font-mono text-slate-400 mb-1">{t.helpView?.liveChatDrawer?.title || 'ZEGA AI Specialist Direct'}</span>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                    <Sparkles size={14} className="animate-spin text-orange-500" />
                    <span className="text-xs font-medium animate-pulse">{t.helpView?.liveChatDrawer?.thinkingText || 'Sedang memproses jawaban dengan AI model...'}</span>
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
                placeholder={t.helpView?.liveChatDrawer?.inputPlaceholder || 'Ketik pesan untuk AI Support...'}
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
