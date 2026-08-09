import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, Send, MessageSquare, Instagram, 
  ShoppingBag, Video, Phone, CheckCircle2, Bot, ChevronDown, UserCheck,
  Check, Plus, Sparkles, Tag, Star, MoreHorizontal, UserPlus, FileText,
  Truck, MapPin, Package, Paperclip, Smile, Image as ImageIcon, Sliders,
  HelpCircle, Settings, ExternalLink, RefreshCw, Zap
} from 'lucide-react';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { 
  ManageIntegrationsModal, CreateOrderModal, CheckOngkirModal, 
  TrackOrderModal, ProductCatalogModal, AiReasoningModal,
  CustomerFullProfileModal, AssignAgentModal, AddTagModal
} from './inbox/InboxModals';

interface InboxViewProps {
  triggerToast: (msg: string) => void;
}

export function InboxView({ triggerToast }: InboxViewProps) {
  const { t } = useLanguage();
  const [channelTab, setChannelTab] = useState('Semua');
  const [subTab, setSubTab] = useState('Semua'); // Semua, Belum Dibaca, Menunggu, Selesai
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState('d1111111-1111-1111-1111-111111111111');
  const [chatInput, setChatInput] = useState('');
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Database Real-time States
  const [conversations, setConversations] = useState<any[]>([
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      customer_name: 'Siti Aisyah',
      customer_phone: '+62 812-3456-7890',
      customer_email: 'siti.aisyah@gmail.com',
      customer_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      channel: 'whatsapp',
      status: 'unread',
      priority: 'high',
      intent: 'Order Inquiry',
      sentiment: 'Positif',
      ai_confidence: 98,
      tags: ['High Priority', 'Order Inquiry'],
      last_message: 'Halo, saya mau tanya harga paket skincare...',
      last_message_time: '08:45',
      unread_count: 2,
      total_orders: 3,
      total_spent: 650000,
      customer_since: '12 Mei 2026',
      ai_auto_respond: true,
      ai_summary: 'Pelanggan menanyakan harga paket skincare basic untuk remaja dan berminat membeli paket basic untuk kulit berminyak.',
      suggested_actions: ['Buat order paket basic', 'Kirim detail produk', 'Minta alamat pengiriman']
    },
    {
      id: 'd2222222-1111-1111-1111-111111111111',
      customer_name: 'Budi Santoso',
      customer_phone: '+62 813-9876-5432',
      customer_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      channel: 'whatsapp',
      status: 'unread',
      priority: 'medium',
      intent: 'Product Question',
      sentiment: 'Netral',
      ai_confidence: 92,
      tags: ['Product Question'],
      last_message: 'Apakah masih ada stok warna hitam?',
      last_message_time: '08:30',
      unread_count: 1,
      total_orders: 1,
      total_spent: 250000,
      customer_since: '10 Apr 2026',
      ai_auto_respond: true,
      ai_summary: 'Pelanggan menanyakan ketersediaan stok warna hitam.',
      suggested_actions: ['Cek stok gudang', 'Konfirmasi ketersediaan']
    },
    {
      id: 'd3333333-1111-1111-1111-111111111111',
      customer_name: 'Dewi Lestari',
      customer_phone: '@dewilestari_shop',
      customer_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      channel: 'instagram',
      status: 'waiting',
      priority: 'medium',
      intent: 'Restock',
      sentiment: 'Positif',
      ai_confidence: 90,
      tags: ['Restock'],
      last_message: 'Kapan restock tas selempang ini?',
      last_message_time: '08:25',
      unread_count: 0,
      total_orders: 2,
      total_spent: 490000,
      customer_since: '15 Mar 2026',
      ai_auto_respond: true,
      ai_summary: 'Pelanggan menanyakan jadwal restock produk tas.',
      suggested_actions: ['Beri tahu estimasi restock', 'Tawarkan preorder']
    },
    {
      id: 'd4444444-1111-1111-1111-111111111111',
      customer_name: 'Rizky Pratama',
      customer_phone: '+62 856-1122-3344',
      customer_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      channel: 'whatsapp',
      status: 'unread',
      priority: 'medium',
      intent: 'Sizing',
      sentiment: 'Netral',
      ai_confidence: 94,
      tags: ['Sizing'],
      last_message: 'Bisa minta ukuran detailnya?',
      last_message_time: '08:10',
      unread_count: 3,
      total_orders: 0,
      total_spent: 0,
      customer_since: '01 Jun 2026',
      ai_auto_respond: true,
      ai_summary: 'Pelanggan meminta ukuran detail baju.',
      suggested_actions: ['Kirim chart size']
    },
    {
      id: 'd5555555-1111-1111-1111-111111111111',
      customer_name: 'Maya Putri',
      customer_phone: '@mayaputri_tok',
      customer_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      channel: 'tiktok',
      status: 'waiting',
      priority: 'low',
      intent: 'How to Order',
      sentiment: 'Positif',
      ai_confidence: 96,
      tags: ['How to Order'],
      last_message: 'Bagaimana cara ordernya?',
      last_message_time: '07:58',
      unread_count: 0,
      total_orders: 1,
      total_spent: 150000,
      customer_since: '20 Mei 2026',
      ai_auto_respond: true,
      ai_summary: 'Pelanggan menanyakan tata cara pemesanan.',
      suggested_actions: ['Kirim link checkout']
    },
    {
      id: 'd6666666-1111-1111-1111-111111111111',
      customer_name: 'Andi Wijaya',
      customer_phone: '+62 878-4455-6677',
      customer_avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      channel: 'whatsapp',
      status: 'completed',
      priority: 'low',
      intent: 'Shipping',
      sentiment: 'Positif',
      ai_confidence: 99,
      tags: ['Shipping'],
      last_message: 'Ongkir ke Bali berapa?',
      last_message_time: '07:45',
      unread_count: 0,
      total_orders: 5,
      total_spent: 1200000,
      customer_since: '05 Jan 2026',
      ai_auto_respond: true,
      ai_summary: 'Pelanggan menanyakan ongkos kirim ke Bali.',
      suggested_actions: ['Beri info ekspedisi']
    },
    {
      id: 'd7777777-1111-1111-1111-111111111111',
      customer_name: 'Nadia Rahma',
      customer_phone: 'nadia.rahma@company.com',
      customer_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      channel: 'email',
      status: 'completed',
      priority: 'medium',
      intent: 'Invoice',
      sentiment: 'Netral',
      ai_confidence: 95,
      tags: ['Invoice'],
      last_message: 'Request invoice untuk PO #1234',
      last_message_time: '07:30',
      unread_count: 0,
      total_orders: 4,
      total_spent: 3500000,
      customer_since: '12 Nov 2025',
      ai_auto_respond: true,
      ai_summary: 'Request invoice PO #1234.',
      suggested_actions: ['Kirim PDF invoice']
    }
  ]);

  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm1',
      sender_type: 'customer',
      sender_name: 'Siti Aisyah',
      message_text: 'Halo, saya mau tanya harga paket skincare basic untuk remaja ya kak',
      created_at: '08:44'
    },
    {
      id: 'm2',
      sender_type: 'ai_assistant',
      sender_name: 'AI Assistant',
      message_text: 'Halo Kak Siti! 👋\nBerikut harga paket skincare basic untuk remaja:\n\n• Paket Basic: Rp199.000\n• Paket Premium: Rp499.000\n• Paket Ultimate: Rp899.000\n\nMau saya bantu buatkan order sekarang?',
      created_at: '08:45'
    },
    {
      id: 'm3',
      sender_type: 'customer',
      sender_name: 'Siti Aisyah',
      message_text: 'Paket basic aja kak, untuk kulit berminyak',
      created_at: '08:46'
    },
    {
      id: 'm4',
      sender_type: 'ai_assistant',
      sender_name: 'AI Assistant',
      message_text: 'Baik Kak! Paket Basic untuk kulit berminyak sudah kami catat. Apakah sudah ada alamat pengiriman? 😊',
      created_at: '08:46'
    }
  ]);

  const [notes, setNotes] = useState<any[]>([
    {
      id: 'n1',
      note_text: 'Pelanggan ramah, respon cepat. Sering beli produk skincare.',
      created_by: 'Anda',
      created_at: '10 Mei 2026'
    }
  ]);

  // Date & Timestamp Helper Utilities
  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Baru saja';
    if (dateStr.includes(':') && !dateStr.includes('T')) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '2026';
    if (dateStr.length === 4) return dateStr; // e.g. '2026'
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations & messages from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      const convData = await SupabaseDashboardService.getUmkmInboxConversations();
      if (convData && convData.length > 0) {
        setConversations(convData);
      }
    } catch (e) {
      console.error('Failed to load inbox data', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgData = await SupabaseDashboardService.getUmkmInboxMessages(convId);
      if (msgData && msgData.length > 0) {
        setMessages(msgData);
      }
      const noteData = await SupabaseDashboardService.getUmkmInboxNotes(convId);
      if (noteData && noteData.length > 0) {
        setNotes(noteData);
      }
    } catch (e) {
      console.error('Failed to load messages or notes', e);
    }
  };

  useEffect(() => {
    loadData();
    loadMessages(selectedConvId);

    const unsubscribe = SupabaseDashboardService.subscribeToInboxRealtime('11111111-1111-1111-1111-111111111111', () => {
      loadData();
      loadMessages(selectedConvId);
    });

    return () => { unsubscribe(); };
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find(c => c.id === selectedConvId) || conversations[0];

  // Dynamic Channel Counts calculation
  const getChannelCount = (channelName: string) => {
    if (channelName === 'Semua' || channelName === 'All') return conversations.length > 0 ? Math.max(conversations.length, 127) : 127;
    const matchCount = conversations.filter(c => c.channel?.toLowerCase() === channelName.toLowerCase()).length;
    if (matchCount > 0) return matchCount;
    switch (channelName.toLowerCase()) {
      case 'whatsapp': return 32;
      case 'instagram': return 12;
      case 'shopee': return 8;
      case 'tiktok': return 5;
      case 'email': return 3;
      case 'messenger': return 2;
      default: return 0;
    }
  };

  // Channel Filtering
  const filteredConversations = conversations.filter(c => {
    if (channelTab !== 'Semua' && channelTab !== 'All') {
      if (c.channel.toLowerCase() !== channelTab.toLowerCase()) return false;
    }
    if (subTab === 'Belum Dibaca' || subTab === 'Unread') {
      if (c.status !== 'unread' && c.unread_count === 0) return false;
    } else if (subTab === 'Menunggu' || subTab === 'Waiting') {
      if (c.status !== 'waiting') return false;
    } else if (subTab === 'Selesai' || subTab === 'Completed') {
      if (c.status !== 'completed') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.customer_name?.toLowerCase().includes(q) ||
        c.last_message?.toLowerCase().includes(q) ||
        c.customer_phone?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsgText = chatInput;
    setChatInput('');

    // Optimistic UI update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_type: 'agent',
      sender_name: 'Anda',
      message_text: newMsgText,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, tempMsg]);

    const res = await SupabaseDashboardService.sendInboxMessage(selectedConvId, newMsgText, 'agent', 'Anda');
    if (res.data) {
      triggerToast('Pesan berhasil terkirim');
    } else {
      triggerToast('Pesan dikirim (Local State Sync)');
    }
  };

  // Quick Action insertion
  const handleQuickChip = (text: string) => {
    setChatInput(prev => (prev ? `${prev} ${text}` : text));
  };

  // Handle Add Internal Note
  const handleAddNote = async () => {
    if (!newNoteInput.trim()) return;
    const noteText = newNoteInput;
    setNewNoteInput('');
    setShowNoteInput(false);

    const tempNote = {
      id: 'note-' + Date.now(),
      note_text: noteText,
      created_by: 'Anda',
      created_at: 'Baru saja'
    };
    setNotes(prev => [tempNote, ...prev]);

    await SupabaseDashboardService.addInboxNote(selectedConvId, noteText);
    triggerToast('Catatan internal ditambahkan');
  };

  // Helper for Channel Icons
  const getChannelBadge = (channelName: string) => {
    switch (channelName.toLowerCase()) {
      case 'whatsapp':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full"><MessageSquare size={10} /> WhatsApp</span>;
      case 'instagram':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 px-2 py-0.5 rounded-full"><Instagram size={10} /> Instagram</span>;
      case 'shopee':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full"><ShoppingBag size={10} /> Shopee</span>;
      case 'tiktok':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"><Video size={10} /> TikTok</span>;
      case 'email':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full"><FileText size={10} /> Email</span>;
      default:
        return <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"><MessageSquare size={10} /> Messenger</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & INTEGRATION BADGES */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{t.inboxView.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t.inboxView.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">{t.inboxView.activeIntegrations}</span>
          
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div className="size-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs" title="WhatsApp (32)">
              <MessageSquare size={12} />
            </div>
            <div className="size-6 rounded-lg bg-pink-500 text-white flex items-center justify-center text-xs shadow-xs" title="Instagram (12)">
              <Instagram size={12} />
            </div>
            <div className="size-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs" title="Shopee (8)">
              <ShoppingBag size={12} />
            </div>
            <div className="size-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shadow-xs" title="TikTok (5)">
              <Video size={12} />
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-extrabold text-slate-600 dark:text-slate-300">+2</span>
          </div>

          <button
            onClick={() => setActiveModal('integrations')}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Settings size={14} className="text-blue-500" />
            <span>{t.inboxView.manageIntegrations}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHANNEL FILTER TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'Semua', label: t.inboxView.channelAll },
          { key: 'WhatsApp', label: 'WhatsApp' },
          { key: 'Instagram', label: 'Instagram' },
          { key: 'Shopee', label: 'Shopee' },
          { key: 'TikTok', label: 'TikTok' },
          { key: 'Email', label: 'Email' },
          { key: 'Messenger', label: 'Messenger' },
        ].map((item) => {
          const isActive = channelTab.toLowerCase() === item.key.toLowerCase();
          const count = getChannelCount(item.key);
          return (
            <button
              key={item.key}
              onClick={() => setChannelTab(item.key)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{item.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN 3-COLUMN LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-4 items-start">

        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: CONVERSATION LIST & SEARCH */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[740px] justify-between space-y-3">
          
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {/* Search Bar & View Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.inboxView.searchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <button 
                onClick={() => triggerToast('Filter lanjutan')} 
                className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <Sliders size={14} />
              </button>
            </div>

            {/* Sub-Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl text-[11px] font-bold">
              {[
                { key: 'Semua', label: t.inboxView.subTabAll },
                { key: 'Belum Dibaca', label: t.inboxView.subTabUnread, badge: 8 },
                { key: 'Menunggu', label: t.inboxView.subTabWaiting },
                { key: 'Selesai', label: t.inboxView.subTabCompleted },
              ].map(sub => (
                <button
                  key={sub.key}
                  onClick={() => setSubTab(sub.key)}
                  className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    subTab === sub.key
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{sub.label}</span>
                  {sub.badge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-extrabold">
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Conversation Items List */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
              {filteredConversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-blue-600 border-y border-r border-blue-200/60 dark:border-blue-900/60 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="relative flex-shrink-0 mt-0.5">
                      <img
                        src={conv.customer_avatar}
                        alt={conv.customer_name}
                        className="size-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        {conv.channel === 'whatsapp' && (
                          <div className="size-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px]">
                            <MessageSquare size={8} />
                          </div>
                        )}
                        {conv.channel === 'instagram' && (
                          <div className="size-4 bg-pink-500 text-white rounded-full flex items-center justify-center text-[8px]">
                            <Instagram size={8} />
                          </div>
                        )}
                        {conv.channel === 'tiktok' && (
                          <div className="size-4 bg-black text-white rounded-full flex items-center justify-center text-[8px]">
                            <Video size={8} />
                          </div>
                        )}
                        {conv.channel === 'email' && (
                          <div className="size-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px]">
                            <FileText size={8} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {conv.customer_name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 ml-1 flex-shrink-0">
                          {formatTimestamp(conv.last_message_time)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {conv.last_message}
                      </p>

                      {/* Tags & Badges */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {conv.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[9px] font-extrabold">
                            High Priority
                          </span>
                        )}
                        {conv.intent && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[9px] font-bold">
                            {conv.intent}
                          </span>
                        )}
                      </div>
                    </div>

                    {conv.unread_count > 0 && (
                      <span className="size-5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 shadow-xs">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* List Footer Pagination */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium">
              {t.inboxView.showingItems} 1 - {filteredConversations.length} dari {getChannelCount(channelTab)}
            </span>
            <button
              onClick={() => triggerToast('Memuat lebih banyak percakapan...')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold hover:bg-slate-200 cursor-pointer"
            >
              {t.inboxView.loadMore}
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CENTER COLUMN: ACTIVE CHAT STREAM */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[740px] justify-between space-y-3">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={activeConv.customer_avatar}
                  alt={activeConv.customer_name}
                  className="size-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                />
                <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {activeConv.customer_name}
                  </h3>
                  {activeConv.channel === 'whatsapp' && (
                    <div className="size-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px]" title="Verified WhatsApp">
                      <Check size={10} />
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {activeConv.customer_phone}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Bergabung {formatDate(activeConv.customer_since)} • Total Order {activeConv.total_orders} • Total Belanja Rp{activeConv.total_spent?.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-1 text-slate-400 relative">
              <button 
                onClick={() => setActiveModal('assignAgent')} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors" 
                title="Tugaskan Agen CS"
              >
                <UserPlus size={15} />
              </button>
              <button 
                onClick={() => setActiveModal('addTag')} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors" 
                title="Tambah Tag Label"
              >
                <Tag size={15} />
              </button>
              <button 
                onClick={async () => {
                  const nextStar = !activeConv.is_starred;
                  const updated = conversations.map(c => c.id === activeConv.id ? { ...c, is_starred: nextStar } : c);
                  setConversations(updated);
                  await SupabaseDashboardService.toggleStarConversation(activeConv.id, nextStar);
                  triggerToast(nextStar ? 'Percakapan ditandai bintang (Bintang)' : 'Bintang dilepas');
                }} 
                className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors ${
                  activeConv.is_starred ? 'text-amber-500 fill-amber-500' : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
                }`} 
                title={activeConv.is_starred ? 'Lepas Bintang' : 'Tandai Bintang'}
              >
                <Star size={15} className={activeConv.is_starred ? 'fill-amber-500 text-amber-500' : ''} />
              </button>
              
              {/* 3-Dots Options Dropdown Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors" 
                  title="Opsi Lanjutan"
                >
                  <MoreHorizontal size={15} />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-10 z-40 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        triggerToast('Percakapan ditandai Belum Dibaca');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      Tandai Belum Dibaca
                    </button>
                    <button
                      onClick={async () => {
                        setShowMoreMenu(false);
                        await SupabaseDashboardService.archiveConversation(activeConv.id, true);
                        triggerToast('Percakapan diarsipkan');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      Arsipkan Percakapan
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setActiveModal('fullProfile');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      Lihat Profil Lengkap Pelanggan
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        triggerToast(`Pelanggan ${activeConv.customer_name} telah diblokir`);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold cursor-pointer"
                    >
                      Blokir Pelanggan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Responding Auto Banner */}
          <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 p-2.5 rounded-2xl flex items-center justify-between text-xs text-blue-950 dark:text-blue-200">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles size={14} className="text-amber-500" />
              <span>{t.inboxView.aiRespondingAuto}</span>
              <span title="AI secara otomatis menjawab pertanyaan pelanggan berdasarkan basis data pengetahuan produk">
                <HelpCircle size={12} className="text-blue-400 cursor-pointer" />
              </span>
            </div>
            <button
              onClick={() => setActiveModal('aiReasoning')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-[11px] font-extrabold border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 cursor-pointer shadow-xs"
            >
              {t.inboxView.viewAction}
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 text-xs scrollbar-thin">
            {messages.map((msg) => {
              const isCustomer = msg.sender_type === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isCustomer ? '' : 'justify-end'}`}
                >
                  {isCustomer && (
                    <img
                      src={activeConv.customer_avatar}
                      alt={activeConv.customer_name}
                      className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 mt-0.5"
                    />
                  )}

                  <div className={`max-w-[85%] space-y-1 ${
                    isCustomer 
                      ? 'p-3 rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60' 
                      : 'p-3.5 rounded-2xl rounded-tr-xs bg-blue-600 text-white font-medium shadow-xs'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed text-[11px]">
                      {msg.message_text ? msg.message_text.replace(/\\n/g, '\n') : ''}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-[9px] ${
                      isCustomer ? 'text-slate-400' : 'text-blue-100'
                    }`}>
                      <span>{formatTimestamp(msg.created_at)}</span>
                      {!isCustomer && <CheckCircle2 size={10} className="text-white" />}
                    </div>
                  </div>

                  {!isCustomer && (
                    <div className="size-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                      AI
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none relative">
            <button
              onClick={() => setActiveModal('createOrder')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <Zap size={12} className="text-amber-500" />
              <span>{t.inboxView.createOrder}</span>
            </button>
            <button
              onClick={() => setActiveModal('checkOngkir')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <Truck size={12} className="text-blue-500" />
              <span>{t.inboxView.checkOngkir}</span>
            </button>
            <button
              onClick={() => setActiveModal('trackOrder')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <MapPin size={12} className="text-emerald-500" />
              <span>{t.inboxView.trackOrder}</span>
            </button>
            <button
              onClick={() => setActiveModal('productCatalog')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <Package size={12} className="text-purple-500" />
              <span>{t.inboxView.productCatalog}</span>
            </button>
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <FileText size={12} className="text-slate-500" />
              <span>{t.inboxView.template}</span>
              <ChevronDown size={10} />
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 bottom-full mb-1 z-30 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 w-56 space-y-1">
                {[
                  'Halo Kak! Ada yang bisa kami bantu hari ini? 😊',
                  'Terima kasih atas pesanannya! Pesanan Kakak sedang kami proses. 📦',
                  'Pembayaran dapat dilakukan melalui QRIS / Transfer Bank ke BCA 123-456-7890. 💳',
                  'Untuk garansi retur produk berlaku 7 hari setelah barang diterima. 🛡️',
                ].map((tpl, tIdx) => (
                  <button
                    key={tIdx}
                    onClick={() => {
                      handleQuickChip(tpl);
                      setShowTemplateMenu(false);
                    }}
                    className="w-full text-left p-2 rounded-xl text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium truncate cursor-pointer"
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Form & Input Container */}
          <form onSubmit={handleSendMessage} className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t.inboxView.typeMessage}
                className="w-full bg-transparent px-2 text-xs font-medium focus:outline-none text-slate-900 dark:text-slate-100 pr-24"
              />

              <div className="absolute right-2 flex items-center gap-1">
                <button type="button" onClick={() => triggerToast('Emoji picker')} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <Smile size={15} />
                </button>
                <button type="button" onClick={() => triggerToast('Lampirkan berkas')} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <Paperclip size={15} />
                </button>
                <button type="button" onClick={() => triggerToast('Unggah Gambar')} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <ImageIcon size={15} />
                </button>
                
                <button
                  type="submit"
                  className="size-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-xs transition-all ml-1"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>

            {/* Footer Auto-Respond Info & AI Assistant Switch */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
              <div className="flex items-center gap-1">
                <HelpCircle size={11} className="text-slate-400" />
                <span>{t.inboxView.sentByAi}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700 dark:text-slate-300">{t.inboxView.useAiAssistant}</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !aiAssistantEnabled;
                    setAiAssistantEnabled(nextVal);
                    SupabaseDashboardService.toggleAiAssistant(selectedConvId, nextVal);
                    triggerToast(`AI Assistant ${nextVal ? 'Diaktifkan' : 'Dinonaktifkan'}`);
                  }}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    aiAssistantEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="size-4 rounded-full bg-white dark:bg-slate-900 shadow-xs" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: AI ASSISTANT SUMMARY PRO & CUSTOMER DETAILS */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-3.5 h-[740px] overflow-y-auto scrollbar-thin">

          {/* AI Assistant Summary Card (Pro) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                  {t.inboxView.aiSummaryTitle}
                </h3>
                <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-extrabold">
                  Pro
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">{t.inboxView.intent}</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-extrabold">
                  {activeConv.intent}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">{t.inboxView.sentiment}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                  {activeConv.sentiment} 👍
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">{t.inboxView.priority}</span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold text-xs">
                  {activeConv.priority === 'high' ? 'High' : 'Normal'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t.inboxView.confidence}</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{activeConv.ai_confidence}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${activeConv.ai_confidence}%` }}
                  />
                </div>
              </div>

              {/* Summary Paragraph */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">{t.inboxView.summary}</h4>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {activeConv.ai_summary}
                </p>
              </div>

              {/* Suggested Actions */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">{t.inboxView.suggestedActions}</h4>
                <div className="space-y-1">
                  {activeConv.suggested_actions?.map((act: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                      <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              {t.inboxView.customerProfile}
            </h3>

            <div className="flex items-center gap-3">
              <img
                src={activeConv.customer_avatar}
                alt={activeConv.customer_name}
                className="size-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{activeConv.customer_name}</h4>
                  <Check size={12} className="text-emerald-500" />
                </div>
                <p className="text-[10px] font-mono text-slate-400">{activeConv.customer_phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] text-slate-400 font-medium">{t.inboxView.totalOrder}</p>
                <p className="font-black text-xs text-slate-900 dark:text-slate-100 mt-0.5">{activeConv.total_orders}x</p>
              </div>
              <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] text-slate-400 font-medium">{t.inboxView.totalSpent}</p>
                <p className="font-black text-xs text-slate-900 dark:text-slate-100 mt-0.5">Rp{(activeConv.total_spent / 1000).toFixed(0)}k</p>
              </div>
              <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] text-slate-400 font-medium">{t.inboxView.customerSince}</p>
                <p className="font-black text-[10px] text-slate-900 dark:text-slate-100 mt-0.5">{formatDate(activeConv.customer_since)}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('fullProfile')}
              className="w-full py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-center transition-colors"
            >
              {t.inboxView.viewFullProfile}
            </button>
          </div>

          {/* Internal Notes Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                {t.inboxView.internalNotes}
              </h3>
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
              >
                {t.inboxView.addNote}
              </button>
            </div>

            {showNoteInput && (
              <div className="space-y-2 pt-1">
                <textarea
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  placeholder="Tulis catatan internal (hanya tim Anda yang bisa lihat)..."
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-orange-500"
                  rows={2}
                />
                <button
                  onClick={handleAddNote}
                  className="w-full py-1.5 rounded-xl bg-orange-500 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            )}

            <div className="space-y-2 text-xs">
              {notes.map((note) => (
                <div key={note.id} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    {note.note_text}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Ditambahkan oleh {note.created_by} • {formatDate(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Render Active Modals */}
      <ManageIntegrationsModal
        isOpen={activeModal === 'integrations'}
        onClose={() => setActiveModal(null)}
        triggerToast={triggerToast}
      />

      <CreateOrderModal
        isOpen={activeModal === 'createOrder'}
        onClose={() => setActiveModal(null)}
        onInsertText={handleQuickChip}
        triggerToast={triggerToast}
      />

      <CheckOngkirModal
        isOpen={activeModal === 'checkOngkir'}
        onClose={() => setActiveModal(null)}
        onInsertText={handleQuickChip}
        triggerToast={triggerToast}
      />

      <TrackOrderModal
        isOpen={activeModal === 'trackOrder'}
        onClose={() => setActiveModal(null)}
        onInsertText={handleQuickChip}
        triggerToast={triggerToast}
      />

      <ProductCatalogModal
        isOpen={activeModal === 'productCatalog'}
        onClose={() => setActiveModal(null)}
        onInsertText={handleQuickChip}
        triggerToast={triggerToast}
      />

      <AiReasoningModal
        isOpen={activeModal === 'aiReasoning'}
        onClose={() => setActiveModal(null)}
      />

      <CustomerFullProfileModal
        isOpen={activeModal === 'fullProfile'}
        onClose={() => setActiveModal(null)}
        customer={activeConv}
        triggerToast={triggerToast}
      />

      <AssignAgentModal
        isOpen={activeModal === 'assignAgent'}
        onClose={() => setActiveModal(null)}
        onAssign={async (agentName) => {
          const updated = conversations.map(c => c.id === activeConv.id ? { ...c, assigned_agent: agentName } : c);
          setConversations(updated);
          await SupabaseDashboardService.assignAgentToConversation(activeConv.id, agentName);
        }}
        triggerToast={triggerToast}
      />

      <AddTagModal
        isOpen={activeModal === 'addTag'}
        onClose={() => setActiveModal(null)}
        onAddTag={async (tagName) => {
          const currentTags = activeConv.tags || [];
          const updatedTags = Array.from(new Set([...currentTags, tagName]));
          const updated = conversations.map(c => c.id === activeConv.id ? { ...c, tags: updatedTags } : c);
          setConversations(updated);
          await SupabaseDashboardService.addTagToConversation(activeConv.id, tagName, currentTags);
        }}
        triggerToast={triggerToast}
      />
    </div>
  );
}
