import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, Send, MessageSquare, Instagram,
  ShoppingBag, Video, Phone, CheckCircle2, Bot, ChevronDown, UserCheck,
  Check, Plus, Tag, Star, MoreHorizontal, UserPlus, FileText, ShoppingCart,
  Truck, MapPin, Package, Paperclip, Smile, Image as ImageIcon, Sliders,
  HelpCircle, Settings, ExternalLink, RefreshCw, PanelLeftClose, PanelLeftOpen, ChevronRight, ChevronLeft
} from 'lucide-react';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { executeZeroClawAiInference, select9RouterModel, type ZeroClawInferenceResult } from '../../services/zeroClaw9RouterEngine';
import { useLanguage } from '../../../../i18n/translations';
import {
  ManageIntegrationsModal, CreateOrderModal, CheckOngkirModal,
  TrackOrderModal, ProductCatalogModal, AiReasoningModal,
  CustomerFullProfileModal, AssignAgentModal, AddTagModal
} from './inbox/InboxModals';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface InboxViewProps {
  triggerToast: (msg: string) => void;
}

export function InboxView({ triggerToast }: InboxViewProps) {
  const { t } = useLanguage();
  const u = (t as any).umkmInbox || (t as any).inboxView || {};
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<'list' | 'chat' | 'info'>('chat'); // Responsive mobile tab state
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

  // Functional Emoji, Image, & File Attachment Controls
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string; url?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Database Real-time States (Strictly dynamic from Supabase - Zero Dummy Data)
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

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

  // Live Database Dynamic KPI State
  const [kpiStats, setKpiStats] = useState<any>(null);

  // Load conversations & messages from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      const convData = await SupabaseDashboardService.getUmkmInboxConversations();
      if (convData && convData.length > 0) {
        setConversations(convData);
      }
      const kpis = await SupabaseDashboardService.getUmkmInboxKpis();
      if (kpis) {
        setKpiStats(kpis);
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

    const unsubscribe = SupabaseDashboardService.subscribeToInboxRealtime(undefined, () => {
      loadData();
      loadMessages(selectedConvId);
    });

    return () => { unsubscribe(); };
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fallbackConv = {
    id: 'empty-state',
    customer_name: u.noCustomerYet || t.inboxView.noCustomerYet || 'Belum Ada Pelanggan',
    customer_phone: '-',
    customer_email: '-',
    customer_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    channel: 'whatsapp',
    status: 'unread',
    priority: 'low',
    intent: u.zeroStateIntent || t.inboxView.zeroStateIntent || 'Zero State',
    sentiment: u.neutralSentiment || t.inboxView.neutralSentiment || 'Netral',
    ai_confidence: 100,
    tags: [],
    last_message: u.noIncomingMessagesYet || t.inboxView.noIncomingMessagesYet || 'Belum ada pesan masuk',
    last_message_time: '-',
    unread_count: 0,
    total_orders: 0,
    total_spent: 0,
    customer_since: '2026',
    ai_auto_respond: true,
    ai_summary: u.noConversationsSummary || t.inboxView.noConversationsSummary || 'Belum ada percakapan masuk dari pelanggan.',
    suggested_actions: []
  };

  const activeConv = (conversations && conversations.length > 0)
    ? (conversations.find(c => c.id === selectedConvId) || conversations[0])
    : fallbackConv;

  // Dynamic Channel Counts calculation (Strictly real database data)
  const getChannelCount = (channelName: string) => {
    if (!conversations || conversations.length === 0) return 0;
    if (channelName === 'Semua' || channelName === 'All') return conversations.length;
    return conversations.filter(c => c.channel?.toLowerCase() === channelName.toLowerCase()).length;
  };

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    priority: 'all', // 'all' | 'high' | 'medium' | 'low'
    intent: 'all',   // 'all' | 'Order Inquiry' | 'Product Question' | 'Restock' | 'Sizing' | 'How to Order' | 'Shipping' | 'Invoice'
    sentiment: 'all',// 'all' | 'Positif' | 'Netral' | 'Negatif'
    starredOnly: false,
    hasUnread: false
  });

  const activeFilterCount = [
    advancedFilters.priority !== 'all',
    advancedFilters.intent !== 'all',
    advancedFilters.sentiment !== 'all',
    advancedFilters.starredOnly,
    advancedFilters.hasUnread,
  ].filter(Boolean).length;

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      priority: 'all',
      intent: 'all',
      sentiment: 'all',
      starredOnly: false,
      hasUnread: false
    });
  };

  // Channel & Advanced Filtering
  const filteredConversations = conversations.filter(c => {
    // 1. Channel Filter
    if (channelTab !== 'Semua' && channelTab !== 'All') {
      if (c.channel?.toLowerCase() !== channelTab.toLowerCase()) return false;
    }

    // 2. Sub tab status Filter
    if (subTab === 'Belum Dibaca' || subTab === 'Unread') {
      if (c.status !== 'unread' && c.unread_count === 0) return false;
    } else if (subTab === 'Menunggu' || subTab === 'Waiting') {
      if (c.status !== 'waiting') return false;
    } else if (subTab === 'Selesai' || subTab === 'Completed') {
      if (c.status !== 'completed') return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = c.customer_name?.toLowerCase().includes(q);
      const matchesMsg = c.last_message?.toLowerCase().includes(q);
      const matchesPhone = c.customer_phone?.toLowerCase().includes(q);
      const matchesTags = c.tags?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchesName && !matchesMsg && !matchesPhone && !matchesTags) return false;
    }

    // 4. Advanced Filters
    if (advancedFilters.priority !== 'all') {
      if (c.priority?.toLowerCase() !== advancedFilters.priority.toLowerCase()) return false;
    }
    if (advancedFilters.intent !== 'all') {
      if (c.intent?.toLowerCase() !== advancedFilters.intent.toLowerCase()) return false;
    }
    if (advancedFilters.sentiment !== 'all') {
      if (c.sentiment?.toLowerCase() !== advancedFilters.sentiment.toLowerCase()) return false;
    }
    if (advancedFilters.starredOnly && !c.is_starred) return false;
    if (advancedFilters.hasUnread && (!c.unread_count || c.unread_count === 0)) return false;

    return true;
  });

  // Sync AI Assistant toggle state when selected conversation changes
  useEffect(() => {
    const currentConv = conversations.find(c => c.id === selectedConvId);
    if (currentConv && currentConv.ai_auto_respond !== undefined) {
      setAiAssistantEnabled(currentConv.ai_auto_respond);
    }
  }, [selectedConvId, conversations]);

  const [isAiTyping, setIsAiTyping] = useState(false);

  // Toggle AI Assistant Handler
  const handleToggleAiAssistant = async () => {
    const nextVal = !aiAssistantEnabled;
    setAiAssistantEnabled(nextVal);

    // Update local conversations array state
    setConversations(prev => prev.map(c =>
      c.id === selectedConvId ? { ...c, ai_auto_respond: nextVal } : c
    ));

    // Persist to backend Supabase
    await SupabaseDashboardService.toggleAiAssistant(selectedConvId, nextVal);

    triggerToast(`AI Assistant untuk ${activeConv.customer_name} ${nextVal ? 'Diaktifkan 🤖' : 'Dinonaktifkan 👤'}`);
  };

  // Real ZeroClaw & 9Router AI Smart Draft Generator
  const handleGenerateAiDraft = async () => {
    setIsAiTyping(true);
    triggerToast('Mengontak ZeroClaw Omni-Orchestrator & 9Router Multi-LLM Model...');

    const res = await executeZeroClawAiInference({
      conversationId: selectedConvId,
      customerName: activeConv.customer_name,
      lastMessageText: activeConv.last_message || 'Order Inquiry',
      channel: activeConv.channel,
      intent: activeConv.intent,
      sentiment: activeConv.sentiment
    });

    setIsAiTyping(false);
    setChatInput(res.messageText);
    triggerToast(`Draf AI (${res.modelUsed}) berhasil dibuat dalam ${res.latencyMs}ms! 🤖`);
  };

  // Handle Image & File Selection with Supabase CDN Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerToast(`Mengunggah gambar "${file.name}" ke Supabase CDN... 📤`);
      const res = await SupabaseDashboardService.uploadInboxAttachment(file);
      setAttachedImage(res.cdnUrl);
      triggerToast(`Gambar terunggah ke CDN! 🖼️`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerToast(`Mengunggah berkas "${file.name}" ke Supabase CDN... 📤`);
      const sizeKb = Math.round(file.size / 1024);
      const formattedSize = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
      const res = await SupabaseDashboardService.uploadInboxAttachment(file);
      setAttachedFile({
        name: file.name,
        size: formattedSize,
        type: file.type || 'Dokumen',
        url: res.cdnUrl || undefined
      });
      triggerToast(`Dokumen terlampir via CDN 📎`);
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setChatInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle Send Message with Real ZeroClaw & 9Router Auto-Response
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !attachedImage && !attachedFile) return;

    const newMsgText = chatInput;
    const currentImg = attachedImage;
    const currentFile = attachedFile;

    setChatInput('');
    setAttachedImage(null);
    setAttachedFile(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    // Optimistic UI update for Agent Message
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_type: 'agent',
      sender_name: 'Anda',
      message_text: newMsgText,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attached_image: currentImg,
      attached_file: currentFile
    };
    setMessages(prev => [...prev, tempMsg]);

    const res = await SupabaseDashboardService.sendInboxMessage(selectedConvId, newMsgText, 'agent', 'Anda');
    if (res.data) {
      triggerToast('Pesan berhasil terkirim');
    } else {
      triggerToast('Pesan dikirim (Local State Sync)');
    }

    // If AI Assistant is active, execute Real ZeroClaw AI Auto-Response using 9Router
    if (aiAssistantEnabled) {
      setIsAiTyping(true);

      // Execute Real Multi-Model Inference with ZeroClaw Guardrails
      const aiResult = await executeZeroClawAiInference({
        conversationId: selectedConvId,
        customerName: activeConv.customer_name,
        lastMessageText: newMsgText || 'Lampiran Berkas / Gambar',
        channel: activeConv.channel,
        intent: activeConv.intent,
        sentiment: activeConv.sentiment
      });

      setIsAiTyping(false);

      const aiMsg = {
        id: 'zeroclaw-' + Date.now(),
        sender_type: 'ai_assistant',
        sender_name: `ZeroClaw AI (${aiResult.provider.toUpperCase()})`,
        message_text: aiResult.messageText,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model_used: aiResult.modelUsed,
        latency_ms: aiResult.latencyMs,
        confidence_score: aiResult.confidenceScore
      };

      setMessages(prev => [...prev, aiMsg]);
      triggerToast(`AI Auto-Respond: ${aiResult.modelUsed} (${aiResult.latencyMs}ms)`);
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

  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(true);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & INTEGRATION BADGES */}
      {/* ========================================================================= */}
      <div className={`${mobileTab === 'list' ? 'flex' : 'hidden lg:flex'} flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-xs min-w-0`}>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 truncate">{t.inboxView.title}</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
            {t.inboxView.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <button
            onClick={() => setIsIntegrationsOpen(!isIntegrationsOpen)}
            className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all cursor-pointer border border-slate-200/70 dark:border-slate-700 shadow-xs"
            title="Toggle Active Integrations"
          >
            <span className="text-slate-600 dark:text-slate-300 font-bold">{t.inboxView.activeIntegrations}</span>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 text-[10px] font-black text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">4 Active</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isIntegrationsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isIntegrationsOpen && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex-shrink-0">
                <div className="size-5 sm:size-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs" title="WhatsApp (32)">
                  <MessageSquare size={11} />
                </div>
                <div className="size-5 sm:size-6 rounded-lg bg-pink-500 text-white flex items-center justify-center text-xs shadow-xs" title="Instagram (12)">
                  <Instagram size={11} />
                </div>
                <div className="size-5 sm:size-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs" title="Shopee (8)">
                  <ShoppingBag size={11} />
                </div>
                <div className="size-5 sm:size-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shadow-xs" title="TikTok (5)">
                  <Video size={11} />
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[9.5px] sm:text-[10px] font-extrabold text-slate-600 dark:text-slate-300">+2</span>
              </div>

              <button
                onClick={() => setActiveModal('integrations')}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10.5px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all min-w-0"
              >
                <Settings size={13} className="text-blue-500 flex-shrink-0" />
                <span className="truncate">{t.inboxView.manageIntegrations}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHANNEL FILTER TABS */}
      {/* ========================================================================= */}
      <div className={`${mobileTab === 'list' ? 'flex' : 'hidden lg:flex'} -mx-1 px-1 items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x min-w-0 w-full`}>
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
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[10.5px] sm:text-xs font-extrabold transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 cursor-pointer ${isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
            >
              <span>{item.label}</span>
              <span className={`px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Responsive Navigation Segment Selector (Visible on mobile/tablet screens < lg) */}
      <div className="lg:hidden flex items-center bg-slate-100 dark:bg-slate-800 p-1 sm:p-1.5 rounded-2xl text-[10px] sm:text-xs font-extrabold shadow-inner mb-2 min-w-0">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-1.5 sm:py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-w-0 ${mobileTab === 'list' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <MessageSquare size={13} className="flex-shrink-0" />
          <span className="truncate">{u.mobileConversations || 'Percakapan'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px] font-mono flex-shrink-0">
            {filteredConversations.length}
          </span>
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-1.5 sm:py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-w-0 ${mobileTab === 'chat' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Send size={13} className="flex-shrink-0" />
          <span className="truncate">{u.mobileMessages || 'Pesan'}</span>
        </button>

        <button
          onClick={() => setMobileTab('info')}
          className={`flex-1 py-1.5 sm:py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-w-0 ${mobileTab === 'info' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Bot size={13} className="flex-shrink-0" />
          <span className="truncate">{u.mobileInfoAi || 'Info & AI'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN 3-COLUMN LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-4 items-start">

        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: CONVERSATION LIST & SEARCH */}
        {/* ----------------------------------------------------------------------- */}
        {!isLeftSidebarOpen ? (
          /* COMPACT MINI-SIDEBAR STRIP WHEN COLLAPSED */
          <div className={`${mobileTab === 'list' ? 'block' : 'hidden lg:flex'} lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs flex-col items-center h-[500px] sm:h-[600px] lg:h-[740px] space-y-2 animate-in fade-in slide-in-from-left-2 duration-300`}>
            {/* Header controls (fixed) */}
            <div className="flex flex-col items-center space-y-1.5 w-full flex-shrink-0 pt-1">
              <button
                onClick={() => setIsLeftSidebarOpen(true)}
                className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all cursor-pointer shadow-xs"
                title={u.expandSidebar || "Tampilkan Panel Percakapan (Expand Left)"}
              >
                <PanelLeftOpen size={16} />
              </button>

              <div className="px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black" title={u.totalConversations || "Total Percakapan"}>
                {filteredConversations.length}
              </div>

              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>

            {/* Scrollable list container */}
            <div className="flex-1 w-full min-h-0 overflow-y-auto space-y-2 flex flex-col items-center py-1 px-0.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {filteredConversations.map(conv => {
                const isSelected = selectedConvId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setMobileTab('chat');
                    }}
                    className={`relative p-1 rounded-2xl transition-all cursor-pointer flex-shrink-0 group ${isSelected ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    title={`${conv.customer_name} (${conv.channel})`}
                  >
                    <img
                      src={conv.customer_avatar}
                      alt={conv.customer_name}
                      className="size-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 bg-blue-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white dark:border-slate-900">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`${mobileTab === 'list' ? 'block' : 'hidden lg:flex'} lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex-col h-[calc(100vh-210px)] min-h-[460px] lg:h-[740px] justify-between space-y-3 transition-all duration-300 min-w-0`}>

            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              {/* Search Bar & Advanced Filter Toggle */}
              <div className="relative min-w-0">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={u.searchPlaceholder || 'Cari percakapan...'}
                      className="w-full pl-8 pr-8 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100 min-w-0"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                    className={`p-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${showAdvancedFilter || activeFilterCount > 0
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    title={u.advancedFilterTitle || "Filter Lanjutan"}
                  >
                    <Sliders size={14} />
                    {activeFilterCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-white text-blue-600 text-[10px] font-black">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setIsLeftSidebarOpen(false)}
                    className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer flex-shrink-0"
                    title={u.collapseSidebar || "Sembunyikan Panel Percakapan (Collapse Left)"}
                  >
                    <PanelLeftClose size={14} />
                  </button>
                </div>

                {/* ADVANCED FILTER ENTERPRISE POPOVER MODAL */}
                {showAdvancedFilter && (
                  <div className="absolute left-0 right-0 top-12 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 space-y-3.5 text-xs animate-in fade-in zoom-in-95 max-h-[75vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sliders size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{u.advancedFilterTitle || 'Filter Lanjutan Percakapan'}</h4>
                      </div>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={resetAdvancedFilters}
                          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          {u.resetFilter || 'Reset Filter'} ({activeFilterCount})
                        </button>
                      )}
                    </div>

                    {/* FILTER 1: PRIORITAS */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">{u.priorityLevel || 'Tingkat Prioritas'}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: 'all', label: u.channelAll || 'Semua' },
                          { key: 'high', label: 'High Priority' },
                          { key: 'medium', label: 'Medium' },
                          { key: 'low', label: 'Low' },
                        ].map(p => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setAdvancedFilters(prev => ({ ...prev, priority: p.key }))}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${advancedFilters.priority === p.key
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FILTER 2: INTENT PELANGGAN */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">{u.intentCategory || 'Kategori Intent (Tujuan)'}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'all', 'Order Inquiry', 'Product Question', 'Restock', 'Sizing', 'How to Order', 'Shipping', 'Invoice'
                        ].map(i => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAdvancedFilters(prev => ({ ...prev, intent: i }))}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${advancedFilters.intent === i
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                          >
                            {i === 'all' ? (u.allIntents || 'Semua Intent') : i}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FILTER 3: SENTIMEN AI */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">{u.aiSentiment || 'Analisis Sentimen AI'}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: 'all', label: u.allSentiments || 'Semua Sentimen' },
                          { key: 'Positif', label: u.positive || 'Positif 👍' },
                          { key: 'Netral', label: u.neutral || 'Netral 😐' },
                          { key: 'Negatif', label: u.negative || 'Negatif 👎' },
                        ].map(s => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setAdvancedFilters(prev => ({ ...prev, sentiment: s.key }))}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${advancedFilters.sentiment === s.key
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FILTER 4 & 5: TOGGLES (STARRED & UNREAD ONLY) */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={advancedFilters.starredOnly}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, starredOnly: e.target.checked }))}
                          className="rounded text-blue-600 focus:ring-blue-500 size-4"
                        />
                        <span>{u.starredOnly || 'Hanya Bintang ⭐'}</span>
                      </label>

                      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={advancedFilters.hasUnread}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasUnread: e.target.checked }))}
                          className="rounded text-blue-600 focus:ring-blue-500 size-4"
                        />
                        <span>{u.unreadOnly || 'Hanya Belum Dibaca ✉️'}</span>
                      </label>
                    </div>

                    {/* FOOTER ACTION BUTTONS */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedFilter(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer"
                      >
                        {u.close || 'Tutup'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdvancedFilter(false);
                          triggerToast(`Filter diterapkan (${filteredConversations.length} hasil)`);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer shadow-xs"
                      >
                        {u.applyFilter || 'Terapkan Filter'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Filter Chips Bar */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                  <span className="text-slate-400">Filter Aktif:</span>
                  {advancedFilters.priority !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                      Priority: {advancedFilters.priority}
                      <button onClick={() => setAdvancedFilters(prev => ({ ...prev, priority: 'all' }))} className="hover:text-rose-900 cursor-pointer">✕</button>
                    </span>
                  )}
                  {advancedFilters.intent !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      Intent: {advancedFilters.intent}
                      <button onClick={() => setAdvancedFilters(prev => ({ ...prev, intent: 'all' }))} className="hover:text-blue-900 cursor-pointer">✕</button>
                    </span>
                  )}
                  {advancedFilters.sentiment !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      Sentiment: {advancedFilters.sentiment}
                      <button onClick={() => setAdvancedFilters(prev => ({ ...prev, sentiment: 'all' }))} className="hover:text-emerald-900 cursor-pointer">✕</button>
                    </span>
                  )}
                  {advancedFilters.starredOnly && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      ⭐ Starred
                      <button onClick={() => setAdvancedFilters(prev => ({ ...prev, starredOnly: false }))} className="hover:text-amber-900 cursor-pointer">✕</button>
                    </span>
                  )}
                  {advancedFilters.hasUnread && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                      ✉️ Unread
                      <button onClick={() => setAdvancedFilters(prev => ({ ...prev, hasUnread: false }))} className="hover:text-indigo-900 cursor-pointer">✕</button>
                    </span>
                  )}
                  <button onClick={resetAdvancedFilters} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer">
                    {u.resetAll || 'Reset Semua'}
                  </button>
                </div>
              )}

              {/* Sub-Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl text-[11px] font-bold">
                {[
                  { key: 'Semua', label: u.subTabAll || t.inboxView.subTabAll },
                  { key: 'Belum Dibaca', label: u.subTabUnread || t.inboxView.subTabUnread, badge: conversations.filter(c => c.status === 'unread').length || undefined },
                  { key: 'Menunggu', label: u.subTabWaiting || t.inboxView.subTabWaiting },
                  { key: 'Selesai', label: u.subTabCompleted || t.inboxView.subTabCompleted },
                ].map(sub => (
                  <button
                    key={sub.key}
                    onClick={() => setSubTab(sub.key)}
                    className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${subTab === sub.key
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
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 space-y-2 my-auto">
                  <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <MessageSquare size={18} />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                    {conversations.length === 0 ? (u.noConversations || 'Belum Ada Percakapan Masuk') : (u.noMatchingConversations || 'Tidak ada percakapan yang cocok')}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto">
                    {conversations.length === 0
                      ? (u.emptyInboxDesc || 'Kotak masuk Anda masih bersih. Saat pelanggan berkirim pesan via WhatsApp atau Instagram, percakapan akan muncul secara realtime di sini.')
                      : (u.noMatchDesc || 'Cobalah ubah kata kunci pencarian atau reset filter lanjutan yang aktif.')}
                  </p>
                  {conversations.length > 0 && (
                    <button
                      onClick={resetAdvancedFilters}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                    >
                      {u.resetFilter || 'Reset Filter'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                  {filteredConversations.map((conv) => {
                    const isSelected = selectedConvId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-start gap-3 relative ${isSelected
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
              )}
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
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* CENTER COLUMN: ACTIVE CHAT STREAM */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'} ${isLeftSidebarOpen ? 'lg:col-span-6' : 'lg:col-span-8'} bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex-col h-[calc(100vh-200px)] min-h-[480px] lg:h-[740px] justify-between space-y-2.5 sm:space-y-3 transition-all duration-300 min-w-0 overflow-hidden`}>

          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 sm:pb-3 flex-shrink-0 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setMobileTab('list')}
                className="lg:hidden p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex-shrink-0 cursor-pointer"
                title="Kembali ke Daftar Percakapan"
              >
                <ChevronLeft size={18} />
              </button>
              {!isLeftSidebarOpen && (
                <button
                  onClick={() => setIsLeftSidebarOpen(true)}
                  className="hidden lg:flex p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all text-xs font-extrabold items-center gap-1.5 cursor-pointer mr-1 shadow-2xs flex-shrink-0"
                  title={u.expandSidebar || "Tampilkan Panel Percakapan (Expand Left)"}
                >
                  <PanelLeftOpen size={15} />
                  <span>{u.mobileConversations || 'Daftar Chat'}</span>
                </button>
              )}
              <div className="relative flex-shrink-0">
                <img
                  src={activeConv.customer_avatar}
                  alt={activeConv.customer_name}
                  className="size-9 sm:size-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                />
                <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                    {activeConv.customer_name}
                  </h3>
                  {activeConv.channel === 'whatsapp' && (
                    <div className="size-3.5 sm:size-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] flex-shrink-0" title="Verified WhatsApp">
                      <Check size={10} />
                    </div>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                  {activeConv.customer_phone}
                </p>
                <p className="hidden md:block text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                  {u.customerSince || 'Bergabung'} {formatDate(activeConv.customer_since)} • {u.totalOrder || 'Total Order'} {activeConv.total_orders} • {u.totalSpent || 'Total Belanja'} Rp{activeConv.total_spent?.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-1 text-slate-400 relative flex-shrink-0 ml-1">
              {/* Sleek 9Router AI Diagnostics Pill */}
              <button
                onClick={() => setActiveModal('aiReasoning')}
                className="px-2 sm:px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[10.5px] font-bold flex items-center gap-1 hover:bg-purple-100 dark:hover:bg-purple-900/80 cursor-pointer shadow-xs transition-all mr-0.5"
                title="ZeroClaw & 9Router AI Reasoning Diagnostics"
              >
                <Bot size={12} className="text-purple-500 animate-pulse flex-shrink-0" />
                <span className="hidden sm:inline">9Router AI</span>
              </button>

              <button
                onClick={() => setActiveModal('assignAgent')}
                className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                title={u.assignedAgent || "Tugaskan Agen CS"}
              >
                <UserPlus size={15} />
              </button>
              <button
                onClick={() => setActiveModal('addTag')}
                className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                title={u.addTag || "Tambah Tag Label"}
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
                className={`p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors ${activeConv.is_starred ? 'text-amber-500 fill-amber-500' : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
                  }`}
                title={activeConv.is_starred ? (u.unstar || 'Lepas Bintang') : (u.markStarred || 'Tandai Bintang')}
              >
                <Star size={15} className={activeConv.is_starred ? 'fill-amber-500 text-amber-500' : ''} />
              </button>

              {/* 3-Dots Options Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                  title={u.moreOptions || "Opsi Lanjutan"}
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
                      {u.markUnread || 'Tandai Belum Dibaca'}
                    </button>
                    <button
                      onClick={async () => {
                        setShowMoreMenu(false);
                        await SupabaseDashboardService.archiveConversation(activeConv.id, true);
                        triggerToast('Percakapan diarsipkan');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      {u.archiveConversation || 'Arsipkan Percakapan'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setActiveModal('fullProfile');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      {u.viewFullProfileOption || 'Lihat Profil Lengkap Pelanggan'}
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        triggerToast(`Pelanggan ${activeConv.customer_name} telah diblokir`);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold cursor-pointer"
                    >
                      {u.blockCustomer || 'Blokir Pelanggan'}
                    </button>
                  </div>
                )}
              </div>
            </div>
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

                  <div className={`max-w-[88%] sm:max-w-[80%] space-y-1 min-w-0 break-words ${isCustomer
                      ? 'p-2.5 sm:p-3 rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
                      : 'p-3 sm:p-3.5 rounded-2xl rounded-tr-xs bg-blue-600 text-white font-medium shadow-xs'
                    }`}>
                    {msg.sender_type === 'ai_assistant' && (
                      <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold text-blue-100 bg-blue-700/50 px-2 py-0.5 rounded-lg mb-1 border border-blue-400/30 truncate">
                        <Bot size={10} className="text-blue-300 animate-pulse flex-shrink-0" />
                        <span className="truncate">{msg.model_used || 'ZeroClaw (9Router: Multi-LLM Model)'}</span>
                        {msg.latency_ms && <span className="opacity-80 flex-shrink-0">• {msg.latency_ms}ms</span>}
                        {msg.confidence_score && <span className="opacity-80 flex-shrink-0">• {msg.confidence_score}%</span>}
                      </div>
                    )}
                    {msg.attached_image && (
                      <div className="mt-1.5 overflow-hidden rounded-xl border border-white/20 max-w-[240px] shadow-sm">
                        <img src={msg.attached_image} alt="Attachment" className="w-full h-auto object-cover max-h-52" />
                      </div>
                    )}
                    {msg.attached_file && (
                      <div className="mt-1.5 flex items-center gap-2 p-2 rounded-xl bg-white/10 border border-white/20 text-xs min-w-0">
                        <FileText size={16} className="text-amber-300 shrink-0" />
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-bold truncate text-[11px]">{msg.attached_file.name}</p>
                          <p className="text-[9px] opacity-80">{msg.attached_file.size}</p>
                        </div>
                      </div>
                    )}
                    {msg.message_text && (
                      <p className="whitespace-pre-line leading-relaxed text-[11px] break-words">
                        {msg.message_text.replace(/\\n/g, '\n')}
                      </p>
                    )}
                    <div className={`flex items-center justify-end gap-1 text-[9px] ${isCustomer ? 'text-slate-400' : 'text-blue-100'
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
            {isAiTyping && (
              <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 p-2 rounded-2xl animate-pulse border border-purple-200 dark:border-purple-800/60 min-w-0">
                <Bot size={13} className="animate-bounce text-blue-500 flex-shrink-0" />
                <span className="truncate">{u.aiTyping || 'AI Assistant sedang mengetik balasan otomatis...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Bar (With Relative Wrapper for Unclipped Popover) */}
          <div className="relative min-w-0">
            {/* Unclipped Template Dropdown Popover */}
            {showTemplateMenu && (
              <div className="absolute right-0 bottom-full mb-2 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 max-w-[calc(100vw-32px)] sm:w-80 space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2.5 py-1 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-extrabold truncate">
                    <FileText size={12} className="text-blue-500 flex-shrink-0" />
                    {u.quickReplyTemplates || 'Template Balasan Cepat'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTemplateMenu(false)}
                    className="size-5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {(t.inboxView.quickReplyTemplatesList || []).map((tpl, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => {
                        handleQuickChip(tpl);
                        setShowTemplateMenu(false);
                      }}
                      className="w-full text-left p-2 rounded-xl text-[11px] hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 font-medium cursor-pointer transition-colors flex items-start gap-1.5"
                    >
                      <span className="text-blue-500 font-bold">•</span>
                      <span className="break-words">{tpl}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-[10.5px] sm:text-[11px] font-bold touch-pan-x min-w-0 no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {aiAssistantEnabled && (
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  className="px-2.5 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/80 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-xs transition-all animate-in fade-in"
                  title="Hasikan Draf Balasan Otomatis Berbasis AI"
                >
                  <Bot size={12} className="text-purple-600 dark:text-purple-400" />
                  <span>{u.draftAiBtn || 'Draft AI'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveModal('createOrder')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <ShoppingCart size={12} className="text-blue-500" />
                <span>{u.createOrder || t.inboxView.createOrder}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('checkOngkir')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <Truck size={12} className="text-blue-500" />
                <span>{u.checkOngkir || t.inboxView.checkOngkir}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('trackOrder')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <MapPin size={12} className="text-emerald-500" />
                <span>{u.trackOrder || t.inboxView.trackOrder}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('productCatalog')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <Package size={12} className="text-purple-500" />
                <span>{u.productCatalog || t.inboxView.productCatalog}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${showTemplateMenu
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <FileText size={12} className={showTemplateMenu ? 'text-blue-600' : 'text-slate-500'} />
                <span>{u.template || t.inboxView.template}</span>
                <ChevronDown size={10} className={`transition-transform ${showTemplateMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Hidden File & Image Inputs */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Message Form & Input Container */}
          <form onSubmit={handleSendMessage} className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800 min-w-0">
            {/* Attachment Preview Bar (Renders if image or file is selected) */}
            {(attachedImage || attachedFile) && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50/90 dark:bg-blue-950/60 rounded-2xl border border-blue-200 dark:border-blue-800 animate-in fade-in min-w-0">
                {attachedImage && (
                  <div className="relative group flex-shrink-0">
                    <img src={attachedImage} alt="Preview" className="size-12 rounded-xl object-cover border border-blue-300 dark:border-blue-700 shadow-xs" />
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="absolute -top-1.5 -right-1.5 size-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer hover:bg-red-600 transition-colors"
                      title="Hapus Gambar"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {attachedFile && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs min-w-0 flex-1">
                    <FileText size={16} className="text-blue-500 shrink-0" />
                    <div className="overflow-hidden min-w-0 flex-1">
                      <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">{attachedFile.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{attachedFile.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="size-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] font-bold cursor-pointer ml-1 flex-shrink-0"
                      title="Hapus Dokumen"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="relative flex flex-col bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 sm:p-3 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-xs min-w-0">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder={u.typeMessage || t.inboxView.typeMessage}
                className="w-full bg-transparent px-1.5 text-xs sm:text-sm font-medium focus:outline-none text-slate-900 dark:text-slate-100 resize-none min-h-[56px] max-h-40 leading-relaxed min-w-0"
              />

              {/* Toolbar inside input box */}
              <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2 mt-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-medium">
                  <span className="hidden sm:inline">{t.inboxView.pressEnterToSend}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowAttachmentMenu(false);
                    }}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${showEmojiPicker ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    title={u.chooseEmoji || "Pilih Emoji"}
                  >
                    <Smile size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(!showAttachmentMenu);
                      setShowEmojiPicker(false);
                    }}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${showAttachmentMenu ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    title={u.attachFile || "Lampirkan Berkas"}
                  >
                    <Paperclip size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${attachedImage ? 'text-purple-500 bg-purple-50 dark:bg-purple-950/50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    title={u.uploadImage || "Unggah Gambar"}
                  >
                    <ImageIcon size={16} />
                  </button>

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 ml-1"
                    title={u.sendMessage || "Kirim Pesan"}
                  >
                    <span>{t.inboxView.sendMessageBtn}</span>
                    <Send size={12} />
                  </button>
                </div>
              </div>

              {/* Popover Real WhatsApp / Instagram Style Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute right-2 sm:right-4 bottom-full mb-3 z-50 shadow-2xl rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 max-w-[calc(100vw-32px)] sm:max-w-[340px]">
                  <EmojiPicker
                    onEmojiClick={(emojiData: EmojiClickData) => {
                      handleSelectEmoji(emojiData.emoji);
                    }}
                    theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
                    lazyLoadEmojis={true}
                    searchPlaceHolder="Cari emoji (senyum, cinta)..."
                    width="100%"
                    height={360}
                  />
                </div>
              )}

              {/* Popover Attachment / Pin Menu */}
              {showAttachmentMenu && (
                <div className="absolute right-8 bottom-full mb-2 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 w-60 space-y-1 animate-in fade-in slide-in-from-bottom-2 text-xs">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span>{u.attachments || 'Lampiran Berkas'}</span>
                    <button type="button" onClick={() => setShowAttachmentMenu(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold cursor-pointer">✕</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Paperclip size={14} className="text-blue-500" />
                    <span>{u.uploadDocPdf || 'Unggah Berkas / PDF / Word'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      imageInputRef.current?.click();
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ImageIcon size={14} className="text-purple-500" />
                    <span>{u.chooseGalleryImage || 'Pilih Gambar dari Galeri'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Auto-Respond Info & AI Assistant Switch */}
            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-medium px-1 gap-1.5 pr-14 sm:pr-1 min-w-0 border-t border-slate-100 dark:border-slate-800 pt-1.5">
              <div className="flex items-center gap-1 truncate">
                <HelpCircle size={11} className="text-slate-400 flex-shrink-0" />
                <span className={`truncate ${aiAssistantEnabled ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
                  {aiAssistantEnabled ? (u.autoRespondAiActive || 'Auto-respond AI Aktif') : (u.sentByAi || t.inboxView.sentByAi)}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[10px]">{t.inboxView.useAiAssistant}</span>
                <button
                  type="button"
                  onClick={handleToggleAiAssistant}
                  className={`w-9 h-5 rounded-full transition-all duration-300 p-0.5 flex items-center cursor-pointer shadow-xs ${aiAssistantEnabled ? 'bg-blue-600 justify-end ring-2 ring-blue-400/30' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  title={aiAssistantEnabled ? "AI Assistant Aktif (Klik untuk menonaktifkan)" : "AI Assistant Mati (Klik untuk mengaktifkan)"}
                >
                  <div className={`size-4 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center transition-transform ${aiAssistantEnabled ? 'scale-110' : ''}`}>
                    {aiAssistantEnabled && <Bot size={9} className="text-blue-600" />}
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: AI ASSISTANT SUMMARY PRO & CUSTOMER DETAILS */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`${mobileTab === 'info' ? 'block' : 'hidden lg:block'} lg:col-span-3 space-y-3.5 h-auto lg:h-[740px] lg:overflow-y-auto scrollbar-thin`}>

          {/* AI Assistant Summary Card (Pro) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-all duration-300">
            <div
              onClick={() => setIsAiSummaryOpen(!isAiSummaryOpen)}
              className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Bot size={13} />
                </div>
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors">
                  {t.inboxView.aiSummaryTitle}
                </h3>
                <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[9px] font-extrabold">
                  Pro
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isAiSummaryOpen && (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full animate-in fade-in">
                    {activeConv.intent || 'Insight'} • {activeConv.ai_confidence || 98}%
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAiSummaryOpen(!isAiSummaryOpen);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center"
                  title={isAiSummaryOpen ? "Sembunyikan Ringkasan AI" : "Tampilkan Ringkasan AI"}
                >
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isAiSummaryOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''}`} />
                </button>
              </div>
            </div>

            {isAiSummaryOpen && (
              <div className="space-y-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
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
            )}
          </div>

          {/* Customer Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-all duration-300">
            <div 
              onClick={() => setIsCustomerProfileOpen(!isCustomerProfileOpen)}
              className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer select-none group"
            >
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                {t.inboxView.customerProfile}
              </h3>

              <div className="flex items-center gap-2">
                {!isCustomerProfileOpen && (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {activeConv.customer_name}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCustomerProfileOpen(!isCustomerProfileOpen);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center"
                  title={isCustomerProfileOpen ? "Sembunyikan Profil Pelanggan" : "Tampilkan Profil Pelanggan"}
                >
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isCustomerProfileOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
                </button>
              </div>
            </div>

            {isCustomerProfileOpen && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={activeConv.customer_avatar}
                    alt={activeConv.customer_name}
                    className="size-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{activeConv.customer_name}</h4>
                      <Check size={12} className="text-emerald-500 flex-shrink-0" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{activeConv.customer_phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1 text-center min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 min-w-0">
                    <p className="text-[9.5px] sm:text-[10px] text-slate-400 font-medium truncate">{t.inboxView.totalOrder}</p>
                    <p className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate">{activeConv.total_orders}x</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 min-w-0">
                    <p className="text-[9.5px] sm:text-[10px] text-slate-400 font-medium truncate">{t.inboxView.totalSpent}</p>
                    <p className="font-black text-[10.5px] sm:text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate">Rp{(activeConv.total_spent / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 min-w-0">
                    <p className="text-[9.5px] sm:text-[10px] text-slate-400 font-medium truncate">{t.inboxView.customerSince}</p>
                    <p className="font-black text-[9.5px] sm:text-[10px] text-slate-900 dark:text-slate-100 mt-0.5 truncate">{formatDate(activeConv.customer_since)}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal('fullProfile')}
                  className="w-full py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-center transition-colors"
                >
                  {t.inboxView.viewFullProfile}
                </button>
              </div>
            )}
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
                  placeholder={u.writeInternalNote || "Tulis catatan internal (hanya tim Anda yang bisa lihat)..."}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-orange-500"
                  rows={2}
                />
                <button
                  onClick={handleAddNote}
                  className="w-full py-1.5 rounded-xl bg-orange-500 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  {u.saveNote || 'Simpan Catatan'}
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
                    {u.addedBy || 'Ditambahkan oleh'} {note.created_by} • {formatDate(note.created_at)}
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
        conversation={activeConv}
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
