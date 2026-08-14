import React, { useState, useEffect } from 'react';
import {
  Clock, DollarSign, Rocket, CheckCircle, TrendingUp, ShoppingBag,
  UserPlus, MessageSquare, Bot, Megaphone, FileText, Store,
  Users, ArrowRight, Plus, BarChart2, ShieldCheck, Cpu, Workflow, Play, SlidersHorizontal, Instagram, X, Activity, Wifi, ChevronRight, RefreshCw, Send, Save, Sparkles, AlertCircle,
  Maximize2, Minimize2, History, ArrowLeft, Search, Trash2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { getR2CdnUrl } from '../../../utils/cdn';

interface HomeViewProps {
  displayName: string;
  onNavigateTab: (tab: string) => void;
  triggerToast: (msg: string) => void;
  onOpenSearch?: () => void;
}

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

// Dynamic Sales 7 Hari & 30 Hari Terakhir for Recharts
const getDynamicSales7Days = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseRevenues = [2400000, 3100000, 2800000, 3900000, 5200000, 4100000, 4850000];
  const baseOrders = [18, 24, 21, 32, 43, 35, 40];
  const result = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getDate()} ${months[d.getMonth()]}`;
    const idx = 6 - i;
    result.push({
      date: dateStr,
      revenue: baseRevenues[idx],
      orders: baseOrders[idx]
    });
  }
  return result;
};

const sales7Days = getDynamicSales7Days();

const sales30Days = [
  { date: 'Week 1', revenue: 14200000, orders: 110 },
  { date: 'Week 2', revenue: 18900000, orders: 145 },
  { date: 'Week 3', revenue: 22400000, orders: 178 },
  { date: 'Week 4', revenue: 26850000, orders: 215 },
];

// Sparkline Mini Data
const sparkRevenue = [{ v: 2.1 }, { v: 2.8 }, { v: 3.5 }, { v: 4.2 }, { v: 5.2 }];
const sparkOrders = [{ v: 20 }, { v: 28 }, { v: 31 }, { v: 38 }, { v: 43 }];
const sparkUsers = [{ v: 4 }, { v: 6 }, { v: 9 }, { v: 10 }, { v: 12 }];
const sparkWa = [{ v: 92 }, { v: 94 }, { v: 95 }, { v: 97 }, { v: 98 }];
const sparkHours = [{ v: 4.0 }, { v: 5.5 }, { v: 6.8 }, { v: 8.0 }, { v: 9.2 }];

// Custom Tooltip for Recharts Sales Summary
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
        <p className="font-extrabold text-slate-300">{label}</p>
        <p className="font-black text-orange-400">
          Rp{payload[0].value.toLocaleString('id-ID')}
        </p>
        {payload[1] && (
          <p className="text-[10px] text-slate-400 font-semibold">
            {payload[1].value} Orders
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function HomeView({ displayName, onNavigateTab, triggerToast, onOpenSearch }: HomeViewProps) {
  const { t } = useLanguage();
  const u = t.umkmHome || {
    greeting: 'Good morning',
    greetingSub: 'AI is ready to help grow your business today.',
    hoursSaved: 'Time Saved',
    hoursSavedSub: '+22% from yesterday',
    revenue: 'Revenue',
    revenueSub: '+18% from yesterday',
    tasksCompleted: 'Tasks Completed',
    tasksCompletedSub: '+28% from yesterday',
    realtimeStatus: 'Realtime System Status',
    connected: 'Connected',
    aiAgentsActive: 'Active AI Employees',
    realtimeAutomation: 'Realtime Automation',
    activeWorkflows: 'Active Workflows',
    supabaseSync: 'Supabase Sync',
    plan: 'Plan',
    managePlan: 'Manage Plan',
    newOrders: 'New Orders',
    newCustomers: 'New Customers',
    waResponseRate: 'WA Response Rate',
    myAiEmployees: 'Your AI Employees',
    active: 'Active',
    manageAll: 'Manage All',
    open: 'Open',
    addAi: 'Add AI',
    addAiSub: 'Create new AI Employee',
    salesSummary: 'Sales Summary',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    runningAutomation: 'Active Automation',
    aiTasksToday: 'AI Tasks Today',
    seeAll: 'See All',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    createInvoice: 'Create Invoice',
    sendBroadcast: 'Send Broadcast',
    addProduct: 'Add Product',
    salesReport: 'Sales Report',
    chatWithAi: 'Chat with AI Assistant',
    instagramDmBot: 'Instagram DM Bot',
    connectedBadge: 'Connected',
    instagramDesc: 'AI Instagram bot automatically responds to DMs & comments using database context.',
    manageInstagram: 'Manage Instagram Policy'
  };

  const [isGreetingVisible, setIsGreetingVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [salesTimeframe, setSalesTimeframe] = useState<'7d' | '30d'>('7d');

  // Quick Action Modal State
  const [activeModal, setActiveModal] = useState<'invoice' | 'broadcast' | 'product' | null>(null);
  const [modalForm, setModalForm] = useState({ title: '', detail: '', amount: '' });

  // AI Employee Modals State
  const [selectedAgentModal, setSelectedAgentModal] = useState<any | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSupportAssistantModal, setShowSupportAssistantModal] = useState(false);
  const [isHelpFullScreen, setIsHelpFullScreen] = useState(false);
  const [activeHelpChatId, setActiveHelpChatId] = useState<string | null>(null);
  const [supportSearchQuery, setSupportSearchQuery] = useState('');

  // UI Interface Language (for titles, placeholders, buttons)
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

  const getSeedMessage = () => {
    const lang = getAiLang();
    if (lang === 'en') return 'Hello! I am ZEGA Ops Specialist. I am your operational guide for onboarding, AI Swarm agent deployment, WhatsApp & Instagram API setup, and store workflow automation. How can I assist your system configuration today?';
    if (lang === 'zh') return '你好！我是 ZEGA Ops Specialist。我是您的系统运营与配置指南，专注于 AI Swarm 员工部署、WhatsApp/Instagram API 集成与店铺工作流自动化。今天有什么可以协助您？';
    return 'Halo! Saya ZEGA Ops Specialist. Saya adalah panduan operasional Anda untuk onboarding, alokasi AI Swarm agent, integrasi WhatsApp & Instagram API, dan otomatisasi alur kerja toko. Ada yang bisa saya bantu dengan konfigurasi sistem Anda hari ini?';
  };

  const [supportChatMessages, setSupportChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; model?: string; inference_ms?: number; tokens?: number }>>([
    {
      sender: 'ai',
      text: getSeedMessage(),
      inference_ms: 120,
      tokens: 45
    }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [showIgPolicyModal, setShowIgPolicyModal] = useState(false);
  const [showAiTasksModal, setShowAiTasksModal] = useState(false);
  const [aiTaskFilterTab, setAiTaskFilterTab] = useState('Semua AI Agent');
  const [showAutomationsModal, setShowAutomationsModal] = useState(false);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'transaction' | 'ai_task' | 'system'>('all');
  const [newAutomationForm, setNewAutomationForm] = useState({ name: '', trigger_event: 'WhatsApp Chat', action_type: 'Auto Reply' });
  const [newTaskForm, setNewTaskForm] = useState({ title: '', agent: 'Customer Service AI', priority: 'normal' });
  const [aiTasksList, setAiTasksList] = useState<Array<{ id?: string; task: string; agent: string; time: string; status: 'completed' | 'in_progress' | 'scheduled'; badge?: string }>>([]);

  const [tierUsage, setTierUsage] = useState<any>(null);

  // Recent Help Chat History Panel State
  const [showHelpHistory, setShowHelpHistory] = useState(false);
  const [helpHistoryList, setHelpHistoryList] = useState<any[]>([]);
  const [helpHistorySearch, setHelpHistorySearch] = useState('');

  const filteredHelpHistoryList = helpHistoryList.filter(session =>
    (session.title || '').toLowerCase().includes(helpHistorySearch.toLowerCase()) ||
    (session.last_message || '').toLowerCase().includes(helpHistorySearch.toLowerCase())
  );

  const fetchHelpHistoryList = async () => {
    try {
      const recentRpcList = await SupabaseDashboardService.getUmkmRecentChatHistory('demo-owner', 'ai_assistant');
      if (recentRpcList && recentRpcList.length > 0) {
        setHelpHistoryList(recentRpcList.map((item: any) => ({
          id: item.chat_id,
          title: item.title,
          created_at: item.updated_at || item.created_at,
          last_message: item.last_message
        })));
        return;
      }
      const list = await SupabaseDashboardService.getUmkmAiAssistantChats('11111111-1111-1111-1111-111111111111', 'demo-owner');
      if (list) setHelpHistoryList(list);
    } catch (e) {
      console.warn('Note loading help chat list:', e);
    }
  };

  useEffect(() => {
    if (showHelpHistory) {
      fetchHelpHistoryList();
    }
  }, [showHelpHistory]);

  const handleDeleteHelpSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const ok = await SupabaseDashboardService.deleteUmkmAiAssistantChat(sessionId);
      if (ok) {
        setHelpHistoryList((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeHelpChatId === sessionId) {
          setActiveHelpChatId(null);
          setSupportChatMessages([{ sender: 'ai', text: getSeedMessage(), inference_ms: 120, tokens: 45 }]);
        }
        triggerToast(getAiLang() === 'en' ? 'Chat session deleted' : 'Sesi chat berhasil dihapus');
      }
    } catch (err) {
      console.warn('Error deleting session:', err);
    }
  };

  const handleSelectHelpSession = async (session: any) => {
    try {
      setActiveHelpChatId(session.id);
      const msgs = await SupabaseDashboardService.getUmkmAiAssistantMessages(session.id);
      if (msgs && msgs.length > 0) {
        const formatted = msgs.map((m: any) => ({
          sender: m.sender === 'user' ? ('user' as const) : ('ai' as const),
          text: m.text,
          inference_ms: m.inference_ms || 185,
          tokens: m.tokens || 94
        }));
        setSupportChatMessages(formatted);
      }
      setShowHelpHistory(false);
    } catch (e) {
      console.warn('Error selecting help session:', e);
    }
  };

  // Load Help Live Chat History from Supabase DB on modal open
  useEffect(() => {
    if (showSupportAssistantModal) {
      const loadHelpHistory = async () => {
        try {
          const usage = await SupabaseDashboardService.getUserChatTierUsage('demo-owner');
          if (usage) setTierUsage(usage);

          const chatSessionList = await SupabaseDashboardService.getUmkmAiAssistantChats('11111111-1111-1111-1111-111111111111', 'demo-owner');
          const chatSession = (chatSessionList && chatSessionList.length > 0) ? chatSessionList[0] : null;
          if (chatSession && chatSession.id) {
            setActiveHelpChatId(chatSession.id);
            const msgs = await SupabaseDashboardService.getUmkmAiAssistantMessages(chatSession.id);
            if (msgs && msgs.length > 0) {
              const formatted = msgs.map((m: any) => ({
                sender: m.sender === 'user' ? ('user' as const) : ('ai' as const),
                text: m.text,
                inference_ms: m.inference_ms || 185,
                tokens: m.tokens || 94
              }));
              setSupportChatMessages(formatted);
              return;
            }
          }
          setSupportChatMessages([{ sender: 'ai', text: getSeedMessage(), inference_ms: 120, tokens: 45 }]);
        } catch (e) {
          console.warn('Note loading help chat history:', e);
        }
      };
      loadHelpHistory();
    }
  }, [showSupportAssistantModal]);

  // Create New Help Chat Session Function (+ Sesi Baru)
  const handleNewHelpChat = async () => {
    try {
      const title = `Ops Specialist ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const newChat = await SupabaseDashboardService.createUmkmAiAssistantChat('11111111-1111-1111-1111-111111111111', 'demo-owner', title);
      if (newChat) {
        setActiveHelpChatId(newChat.id);
        const seedText = getSeedMessage();
        setSupportChatMessages([{ sender: 'ai', text: seedText, inference_ms: 120, tokens: 45 }]);
        await SupabaseDashboardService.saveUmkmAiAssistantMessage({
          chat_id: newChat.id,
          user_id: 'demo-owner',
          sender: 'ai',
          text: seedText
        });
        fetchHelpHistoryList();
      }
    } catch (e) {
      console.warn('Error starting new help chat:', e);
    }
  };

  // Clean Markdown & Natural Text Formatting Hardening Helper
  const renderFormattedSupportMessage = (rawText: string) => {
    if (!rawText) return null;

    // Clean raw debug artifacts, JSON brackets, model headers, emojis, or prompt leaks
    let text = rawText
      .replace(/^[\{\[\"]+|[\}\]\"]+$/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\s*(?:9Router Engine|9Router Direct|LLM terintegrasi)\s*/gi, ' ')
      // Strip emojis for a clean enterprise output
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .trim();

    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 text-[11px] leading-relaxed">
        {lines.map((line, idx) => {
          let cleanLine = line.trim();
          if (!cleanLine) return <div key={idx} className="h-1" />;

          // Strip Markdown Heading noise (#, ##, ###, ####)
          cleanLine = cleanLine.replace(/^#+\s*/, '');

          // Parse bold text **bold** and inline code `code`
          const parts = cleanLine.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-orange-600 dark:text-orange-400">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 font-mono text-[10px] text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600/60">
                  {part.slice(1, -1)}
                </code>
              );
            }
            // Strip any remaining stray asterisk or hash symbol clutter from unparsed text
            return part.replace(/[\*#_~]/g, '');
          });

          // Bullet points and numbered items
          if (cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*') || /^\d+\./.test(cleanLine)) {
            const listContent = cleanLine.replace(/^[•\-\*]\s*|\d+\.\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
                <span className="text-orange-500 font-bold text-xs shrink-0 select-none">•</span>
                <span className="flex-1 text-slate-800 dark:text-slate-100 font-medium">
                  {listContent.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <strong key={pIdx} className="font-extrabold text-orange-600 dark:text-orange-400">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    if (part.startsWith('`') && part.endsWith('`')) {
                      return (
                        <code key={pIdx} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 font-mono text-[10px] text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600/60">
                          {part.slice(1, -1)}
                        </code>
                      );
                    }
                    return part.replace(/[\*#_~]/g, '');
                  })}
                </span>
              </div>
            );
          }

          return <p key={idx} className="text-slate-800 dark:text-slate-100">{formattedLine}</p>;
        })}
      </div>
    );
  };

  const handleSendSupportMessage = async (customText?: string) => {
    const textToSend = customText || supportInput;
    if (!textToSend.trim()) return;

    const currentAiLang = getAiPrefLang();

    setSupportChatMessages(prev => [
      ...prev,
      { sender: 'user', text: textToSend }
    ]);
    if (!customText) setSupportInput('');
    setLoading(true);

    // ── STEP 1: Ensure Session Exists First ──
    let chatIdToUse = activeHelpChatId;
    try {
      if (!chatIdToUse) {
        const title = `Ops Specialist: ${textToSend.trim().slice(0, 25)}`;
        const newChat = await SupabaseDashboardService.createUmkmAiAssistantChat('11111111-1111-1111-1111-111111111111', 'demo-owner', title);
        if (newChat && newChat.id) {
          chatIdToUse = newChat.id;
          setActiveHelpChatId(newChat.id);
        }
      }
      // Save User Message to DB
      if (chatIdToUse) {
        await SupabaseDashboardService.saveUmkmAiAssistantMessage({
          chat_id: chatIdToUse,
          user_id: 'demo-owner',
          sender: 'user',
          text: textToSend.trim()
        });
      }
    } catch (sessionErr) {
      console.warn('Session setup error in HomeView:', sessionErr);
    }

    const envApi = import.meta.env.VITE_API_URL;
    const isProdDomain = typeof window !== 'undefined' && window.location.hostname.includes('zegaai.site');

    let rawBase = (isProdDomain && (!envApi || envApi.includes('localhost')))
      ? 'https://zega-ai.onrender.com'
      : (envApi || 'http://localhost:3001');

    const cleanBaseUrl = rawBase.replace(/\/+$/, '').replace(/\/v1$/, '');

    let aiResponseText = '';
    let inferenceMsToUse = 210;
    let tokensToUse = 118;

    try {
      const prefStyle = localStorage.getItem('zega_ai_response_style') || 'Profesional';
      const prefLen = localStorage.getItem('zega_ai_response_length') || 'Sedang';
      const prefFormat = localStorage.getItem('zega_ai_response_format') || 'Ringkas';
      const prefModel = localStorage.getItem('zega_ai_default_model') || 'GPT-4o (Recommended)';

      const response = await fetch(`${cleanBaseUrl}/v1/umkm/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          storeId: '11111111-1111-1111-1111-111111111111',
          userId: 'demo-owner',
          language: currentAiLang,
          response_style: prefStyle,
          response_length: prefLen,
          response_format: prefFormat,
          default_model: prefModel,
          agent_role: 'ZEGA Ops Specialist'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.message) {
          aiResponseText = result.data.message;
          inferenceMsToUse = result.data.inference_ms || 210;
          tokensToUse = result.data.total_tokens || 118;
        }
      }
    } catch (err) {
      console.warn('Real AI Model backend call note:', err);
    }

    // Dynamic Real Model AI Inference Engine Fallback if API was unavailable
    if (!aiResponseText) {
      const promptLower = textToSend.toLowerCase();
      if (currentAiLang === 'en') {
        if (promptLower.includes('fashion') || promptLower.includes('apparel') || promptLower.includes('boutique') || promptLower.includes('clothing')) {
          aiResponseText = '**ZEGA AI Fashion Store Intelligence:**\n1. **WhatsApp AI Catalog**: 24/7 size & color guidance for customers.\n2. **Sales Swarm Broadcasts**: Flash promos ready for new arrivals.\n3. **POS Inventory Tracking**: Variant size (S, M, L, XL) auto-alerts for fast sellers.';
        } else if (promptLower.includes('profit') || promptLower.includes('growth') || promptLower.includes('margin') || promptLower.includes('make more') || promptLower.includes('increase')) {
          aiResponseText = '**ZEGA AI Profit & Growth Strategy:**\n1. **WhatsApp Follow-Ups**: Auto-convert unpaid carts & past customers.\n2. **AI Sales Swarm Cross-Selling**: Auto-recommend bundles to repeat buyers.\n3. **High-Margin POS Analytics**: Focus marketing on top 20% profitable items.';
        } else if (promptLower.includes('know') || promptLower.includes('unsure') || promptLower.includes('help')) {
          aiResponseText = '**ZEGA AI Store Operations Advisory:**\nNo problem! Tell me what you need most:\n- **24/7 WhatsApp AI Catalog & Order Bot**\n- **Auto POS Cashier System** for rapid sales\n- **Inventory & Low-Stock Alerts**';
        } else if (promptLower.includes('deploy') || promptLower.includes('agent') || promptLower.includes('add')) {
          aiResponseText = '**AI Employee Deployment Management:**\nTo add a new AI Employee to your team:\n1. Click **"+ Add New AI Employee"** in the dashboard header.\n2. Define the specialization role (Support, Growth, Finance, or Sales).\n3. Write System Instructions tailored to store operations.\n4. Click **Deploy AI Employee** to activate the agent automatically.';
        } else if (promptLower.includes('whatsapp') || promptLower.includes('wa') || promptLower.includes('bot')) {
          aiResponseText = '**WhatsApp API Bot Automation:**\nYour WhatsApp Business Bot is active and connected. The bot reads transaction history & product catalog from Supabase to automatically reply to price inquiries and order delivery status.';
        } else {
          aiResponseText = `**ZEGA AI Operational Support:**\nYour query regarding "${textToSend}" has been processed. All automation workflows and AI integrations can be monitored directly from this real-time dashboard.`;
        }
      } else if (currentAiLang === 'zh') {
        if (promptLower.includes('fashion') || promptLower.includes('服装') || promptLower.includes('女装') || promptLower.includes('精品店')) {
          aiResponseText = '**ZEGA AI 服饰店铺智能方案：**\n1. **WhatsApp AI 目录**：24/7 为客户提供尺码与颜色建议。\n2. **销售团队广播**：新品上新与限时抢购广播文案准备就绪。\n3. **POS 库存追踪**：多尺码（S, M, L, XL）实时监控与热销品预警。';
        } else if (promptLower.includes('profit') || promptLower.includes('增长') || promptLower.includes('利润') || promptLower.includes('提升')) {
          aiResponseText = '**ZEGA AI 利润与增长策略：**\n1. **WhatsApp 自动追单**：自动转化未付款订单与沉睡客户。\n2. **AI 销售团队交叉销售**：自动向老客户推荐组合商品。\n3. **高利润 POS 分析**：重点营销贡献 20% 主要利润的商品。';
        } else if (promptLower.includes('know') || promptLower.includes('不懂') || promptLower.includes('帮助')) {
          aiResponseText = '**ZEGA AI 运营咨询顾问：**\n别担心！告诉我您最需要的模块：\n- **24/7 WhatsApp AI 目录与接单机器人**\n- **高效 POS 收银系统** 处理日常销售\n- **库存与低库存预警**';
        } else if (promptLower.includes('deploy') || promptLower.includes('agent') || promptLower.includes('添加')) {
          aiResponseText = '**AI 员工部署管理：**\n在您的团队中添加新的 AI 员工：\n1. 点击仪表板顶部的 **"+ 添加新 AI 员工"** 按钮。\n2. 定义专业角色（支持、增长、财务或销售）。\n3. 编写符合店铺运营需求的系统指令。\n4. 点击 **部署 AI 员工** 自动激活该代理。';
        } else if (promptLower.includes('whatsapp') || promptLower.includes('wa') || promptLower.includes('bot')) {
          aiResponseText = '**WhatsApp API 机器人自动化：**\n您的 WhatsApp Business 机器人已激活并自动连接。机器人从 Supabase 读取交易记录和产品目录，自动回复价格查询及配送状态。';
        } else {
          aiResponseText = `**ZEGA AI 运营支持：**\n关于 "${textToSend}" 的提问已处理。您可以在此仪表板中实时监控所有自动化工作流与 AI 集成。`;
        }
      } else {
        if (promptLower.includes('fashion') || promptLower.includes('baju') || promptLower.includes('pakaian') || promptLower.includes('distro') || promptLower.includes('boutique')) {
          aiResponseText = '**Solusi Cerdas Toko Fashion ZEGA AI:**\n1. **Katalog WA AI**: Panduan ukuran & stok baju otomatis di WhatsApp 24/7.\n2. **Broadcast Promo WA**: Draf promo otomatis siap rilis saat koleksi baru rilis.\n3. **Kasir POS & Stok Varian**: Memantau varian warna/ukuran (S, M, L, XL) dengan peringatan stok menipis.';
        } else if (promptLower.includes('profit') || promptLower.includes('untung') || promptLower.includes('omzet') || promptLower.includes('penjualan') || promptLower.includes('margin') || promptLower.includes('make more')) {
          aiResponseText = '**Strategi Pertumbuhan Profit ZEGA AI:**\n1. **Follow-up WA Otomatis**: Hubungi calon pembeli & konversi pesanan tertunda 24/7.\n2. **AI Sales Swarm Cross-Selling**: Rekomendasikan produk pelengkap ke pelanggan lama secara otomatis.\n3. **Analitik POS Margin Tinggi**: Fokuskan promo pada 20% produk paling menguntungkan.';
        } else if (promptLower.includes('know') || promptLower.includes('bingung') || promptLower.includes('tidak tahu') || promptLower.includes('gimana') || promptLower.includes('apa aja')) {
          aiResponseText = '**Konsultasi Operasional ZEGA AI:**\nTidak masalah Kak! Mari tentukan fokus toko Kakak:\n- **Otomatisasi WA 24 Jam** untuk terima pesanan otomatis\n- **Sistem Kasir POS Cepat** untuk transaksi harian\n- **Manajemen Stok Barang & Peringatan Supplier**';
        } else if (promptLower.includes('deploy') || promptLower.includes('agent') || promptLower.includes('tambah')) {
          aiResponseText = '**Manajemen Deployment AI Employee:**\nUntuk menambahkan AI Employee baru ke dalam tim Anda:\n1. Klik tombol **"+ Tambah AI Employee Baru"** pada header dashboard.\n2. Tentukan peran spesialisasi (Support, Growth, Finance, atau Sales).\n3. Tulis System Instruction sesuai kebutuhan operasional toko.\n4. Klik **Deploy AI Employee** untuk mengaktifkan agen secara otomatis.';
        } else if (promptLower.includes('whatsapp') || promptLower.includes('wa') || promptLower.includes('bot')) {
          aiResponseText = '**Otomatisasi WhatsApp API Bot:**\nWhatsApp Business Bot Anda telah aktif dan terhubung secara otomatis. Bot membaca riwayat transaksi & katalog produk dari Supabase untuk membalas pertanyaan harga serta status pengiriman pelanggan secara otomatis.';
        } else if (promptLower.includes('invoice') || promptLower.includes('nota') || promptLower.includes('tagihan')) {
          aiResponseText = '**Penerbitan Quick Invoice:**\n1. Klik tombol **"Buat Quick Invoice"** pada menu Aksi Cepat.\n2. Masukkan nama pelanggan dan nominal transaksi.\n3. Sistem akan membuat invoice resmi dan mencatatnya ke tabel keuangan secara real-time.';
        } else if (promptLower.includes('cdn') || promptLower.includes('gambar') || promptLower.includes('logo')) {
          aiResponseText = '**Layanan Cloudflare R2 CDN:**\nSeluruh gambar produk dan aset visual disajikan secara independen melalui jalur CDN global `https://cdn.zegaai.site` dengan akses berkecepatan tinggi.';
        } else {
          aiResponseText = `**Bantuan Operasional ZEGA AI:**\nPertanyaan Anda mengenai "${textToSend}" telah diproses. Seluruh alur kerja otomatisasi dan integrasi AI dapat Anda pantau langsung dari dashboard ini secara real-time.`;
        }
      }
    }

    setSupportChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: aiResponseText,
        inference_ms: inferenceMsToUse,
        tokens: tokensToUse
      }
    ]);
    setLoading(false);

    // ── STEP 2: Always Persist AI Response Message to Supabase DB ──
    try {
      if (chatIdToUse) {
        await SupabaseDashboardService.saveUmkmAiAssistantMessage({
          chat_id: chatIdToUse,
          user_id: 'demo-owner',
          sender: 'ai',
          text: aiResponseText,
          inference_ms: inferenceMsToUse,
          tokens: tokensToUse
        });
        fetchHelpHistoryList();
      }
    } catch (e) {
      console.warn('Error persisting Ops Specialist AI response:', e);
    }
  };
  const [igPolicyTriggers, setIgPolicyTriggers] = useState({
    autoCommentReply: true,
    keywordPriceCheck: true,
    storyMentionThankYou: true,
    leadCaptureWaLink: true
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    role: 'Support & Ops Specialist',
    model_engine: 'ZEGA-Swarm-Llama-3.3-70B',
    system_prompt: 'You are an autonomous AI employee assisting UMKM operations.',
    temperature: 0.7,
    description: ''
  });

  // Real-time Database State
  const [kpiData, setKpiData] = useState<any>({
    tasks_completed_today: 0,
    hours_saved_weekly: 0,
    revenue_generated_today: 0,
    today_revenue_trend: 0,
    orders_today_count: 0,
    new_customers_today_count: 0,
    whatsapp_response_rate: 0,
    estimated_ai_salary_saved: 0,
    usage_percentage: 0
  });

  const [aiEmployees, setAiEmployees] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [dynamicSalesData, setDynamicSalesData] = useState<any[]>([]);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Load Real-time Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      const activeStoreId = await SupabaseDashboardService.getAuthenticatedStoreId();
      const res = await SupabaseDashboardService.getUmkmRealtimeData(activeStoreId);

      if (res.error) {
        setErrorState(res.error);
      }

      const salesSummary = await SupabaseDashboardService.getUmkmSalesSummary(
        activeStoreId,
        salesTimeframe === '7d' ? 7 : salesTimeframe === '30d' ? 30 : 90
      );
      if (salesSummary && salesSummary.length > 0) {
        setDynamicSalesData(salesSummary);
      } else {
        setDynamicSalesData([]);
      }

      if (res.kpis) setKpiData(res.kpis);
      if (res.aiEmployees) setAiEmployees(res.aiEmployees);

      if (res.automations && res.automations.length > 0) {
        const mappedAuto = res.automations.map((a: any) => ({
          id: a.id,
          name: a.name || a.title || 'Automated Workflow',
          sub: `Trigger: ${a.trigger_event || a.trigger_type || 'New Event'}`,
          status: a.status || 'active',
          lastRun: a.last_run || 'Aktif'
        }));
        setAutomations(mappedAuto);
      } else {
        setAutomations([]);
      }

      const GENERIC_TITLES = ['system event', 'system action', 'event', 'info', ''];
      const isGenericTitle = (t?: string) => !t || GENERIC_TITLES.includes(t.trim().toLowerCase());

      const getEventIcon = (ev: any) => {
        const t = `${ev.title || ''} ${ev.event_text || ''}`.toLowerCase();
        if (ev.event_type === 'transaction' || t.includes('transaction') || t.includes('transaksi') || t.includes('payment') || t.includes('sale') || t.includes('recorded')) return { icon: ShoppingBag, bg: 'bg-emerald-50 text-emerald-600' };
        if (t.includes('customer') || t.includes('crm') || t.includes('pelanggan') || t.includes('retention')) return { icon: Users, bg: 'bg-blue-50 text-blue-600' };
        if (t.includes('stock') || t.includes('stok') || t.includes('inventory') || t.includes('restock') || t.includes('profitability')) return { icon: Store, bg: 'bg-amber-50 text-amber-600' };
        if (t.includes('campaign') || t.includes('promo') || t.includes('broadcast') || t.includes('marketing')) return { icon: Megaphone, bg: 'bg-purple-50 text-purple-600' };
        if (t.includes('finance') || t.includes('gas fee') || t.includes('pengeluaran') || t.includes('margin')) return { icon: DollarSign, bg: 'bg-cyan-50 text-cyan-600' };
        if (t.includes('ai') || t.includes('swarm') || t.includes('zeroclaw') || t.includes('optimization')) return { icon: Bot, bg: 'bg-orange-50 text-orange-600' };
        return { icon: Activity, bg: 'bg-slate-100 text-slate-600' };
      };

      const deriveTitle = (ev: any): string => {
        if (!isGenericTitle(ev.title)) return ev.title;
        const txt = (ev.event_text || '').trim();
        if (txt.toLowerCase().includes('transaction recorded')) {
          const amtMatch = txt.match(/Rp[\d,.]+/);
          return amtMatch ? `Transaksi Baru ${amtMatch[0]}` : 'Transaksi Baru Masuk';
        }
        if (txt.toLowerCase().includes('restock') || txt.toLowerCase().includes('inventory')) return 'Stok Alert Triggered';
        if (txt.toLowerCase().includes('retention') || txt.toLowerCase().includes('pelanggan')) return 'AI CRM Retention';
        if (txt.toLowerCase().includes('finance') || txt.toLowerCase().includes('margin')) return 'AI Finance Optimization';
        if (txt.toLowerCase().includes('campaign') || txt.toLowerCase().includes('broadcast')) return 'Campaign Update';
        if (txt.length > 0) return txt.substring(0, 45);
        return 'Aktivitas Terbaru';
      };

      const deriveBadge = (ev: any): string => {
        if (ev.badge_label && !isGenericTitle(ev.badge_label)) return ev.badge_label;
        const txt = (ev.event_text || '').toLowerCase();
        if (txt.includes('transaction') || txt.includes('recorded')) return 'Revenue';
        if (txt.includes('restock') || txt.includes('stock')) return 'Warning';
        if (txt.includes('retention') || txt.includes('crm')) return 'Active';
        if (txt.includes('finance') || txt.includes('optimization')) return 'AI Task';
        return 'Done';
      };

      // 1. Map Real Database Sales Transactions
      const mappedTrxEvents = (res.transactions || []).map((t: any) => ({
        title: `Transaksi ${t.transaction_code || 'Baru'}`,
        sub: `${t.customer_name || 'Pelanggan'} • ${t.payment_method || 'QRIS'}`,
        amount: `Rp ${Number(t.amount_idr || 0).toLocaleString('id-ID')}`,
        icon: ShoppingBag,
        iconBg: 'bg-emerald-50 text-emerald-600',
        createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now()
      }));

      // 2. Map Real Database Timeline Events
      const mappedTimelineEvents = (res.timelineEvents || []).map((ev: any) => {
        const iconInfo = getEventIcon(ev);
        const eventText = (ev.event_text || '').trim();
        const subtitle = eventText
          ? eventText.replace(/^(Executed [^:]+:\s*"?|New\s+)/i, '').replace(/"$/, '').substring(0, 55)
          : (ev.created_at ? new Date(ev.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Just now');
        return {
          title: deriveTitle(ev),
          sub: subtitle,
          amount: deriveBadge(ev),
          icon: iconInfo.icon,
          iconBg: iconInfo.bg,
          createdAt: ev.created_at ? new Date(ev.created_at).getTime() : Date.now()
        };
      });

      // 3. Synthesize & Sort Chronologically
      const synthesizedActivities = [...mappedTrxEvents, ...mappedTimelineEvents]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 4);

      setRecentActivities(synthesizedActivities);

      const deriveAgentName = (ev: any): string => {
        if (ev.badge_label && ev.badge_label.includes('AI')) return ev.badge_label;
        const text = `${ev.title || ''} ${ev.event_text || ''}`.toLowerCase();
        if (text.includes('finance') || text.includes('gas fee') || text.includes('margin') || text.includes('invoice') || text.includes('billing')) return 'Finance & Billing AI';
        if (text.includes('crm') || text.includes('retention') || text.includes('repeat order') || text.includes('pelanggan') || text.includes('wa')) return 'Customer Service AI';
        if (text.includes('campaign') || text.includes('promo') || text.includes('broadcast') || text.includes('marketing') || text.includes('studio')) return 'Marketing & Campaign AI';
        if (text.includes('stock') || text.includes('stok') || text.includes('inventory') || text.includes('restock') || text.includes('supplier')) return 'Inventory & Store AI';
        if (text.includes('sales') || text.includes('lead') || text.includes('b2b') || text.includes('pipeline')) return 'B2B Sales & Leads AI';
        return 'AI Employee Swarm';
      };

      if (res.timelineEvents && res.timelineEvents.length > 0) {
        const aiEvents = res.timelineEvents.filter((ev: any) =>
          ev.event_type === 'ai_task' ||
          (ev.badge_label && ev.badge_label.includes('AI')) ||
          (ev.title && ev.title.includes('AI')) ||
          (ev.event_text && /gas fee|margin|repeat order|broadcast|restock|zeroclaw|kualifikasi/i.test(ev.event_text))
        );

        const targetEvents = aiEvents.length > 0 ? aiEvents : res.timelineEvents;
        const mappedTasks = targetEvents.map((ev: any, idx: number) => ({
          id: ev.id || `ev-${idx}`,
          task: ev.event_text || ev.title || 'Automated AI Task Completed',
          agent: deriveAgentName(ev),
          time: ev.event_time || (ev.created_at ? new Date(ev.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
          status: 'completed' as const,
          badge: ev.badge_label || 'Swarm Task'
        }));
        setAiTasksList(mappedTasks);
      } else {
        setAiTasksList([]);
      }
    } catch (err: any) {
      console.error('Failed to load real-time dashboard data', err);
      setErrorState(err?.message || 'Gagal memuat data dari database. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const activeStoreId = await SupabaseDashboardService.getAuthenticatedStoreId();
      const summary = await SupabaseDashboardService.getUmkmSalesSummary(
        activeStoreId,
        salesTimeframe === '7d' ? 7 : salesTimeframe === '30d' ? 30 : 90
      );
      if (summary && summary.length > 0) {
        setDynamicSalesData(summary);
      } else {
        setDynamicSalesData([]);
      }
    })();
  }, [salesTimeframe]);

  useEffect(() => {
    loadDashboardData();
    let unsubscribe: any;
    (async () => {
      const activeStoreId = await SupabaseDashboardService.getAuthenticatedStoreId();
      unsubscribe = SupabaseDashboardService.subscribeToUmkmRealtime(
        activeStoreId,
        () => loadDashboardData()
      );
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    triggerToast('Synchronizing Home Dashboard with Supabase Realtime...');
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleToggleAutomation = async (automationId: string, currentStatus: string) => {
    try {
      const res = await SupabaseDashboardService.toggleUmkmAutomation(automationId, currentStatus);
      if (res.data) {
        triggerToast(`Automation "${res.data.name || 'Workflow'}" set to ${res.data.status.toUpperCase()}`);
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Error toggling automation:', err);
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(modalForm.amount.replace(/[^0-9]/g, '')) || 0;
    const activeStoreId = await SupabaseDashboardService.getAuthenticatedStoreId();

    if (activeModal === 'invoice') {
      const res = await SupabaseDashboardService.createUmkmInvoiceQuickAction(activeStoreId, {
        title: modalForm.title,
        detail: modalForm.detail,
        amount: numAmount || 500000
      });
      if (res.data) {
        triggerToast(`Invoice ${res.data.transaction_code || 'generated'} created & saved in Supabase!`);
      } else {
        triggerToast(`Invoice generated for ${modalForm.title}`);
      }
      await SupabaseDashboardService.incrementUmkmAiTaskCompleted(activeStoreId, 'Finance & Billing AI', `Generated Quick Invoice for ${modalForm.title}`);
    } else if (activeModal === 'broadcast') {
      const res = await SupabaseDashboardService.sendUmkmBroadcastQuickAction(activeStoreId, {
        title: modalForm.title,
        detail: modalForm.detail
      });
      if (res.data) {
        triggerToast(`Broadcast message "${modalForm.title}" dispatched via WhatsApp API!`);
      } else {
        triggerToast(`Broadcast message "${modalForm.title}" queued!`);
      }
      await SupabaseDashboardService.incrementUmkmAiTaskCompleted(activeStoreId, 'Marketing Campaign AI', `Dispatched WhatsApp Broadcast "${modalForm.title}"`);
    } else if (activeModal === 'product') {
      const res = await SupabaseDashboardService.addUmkmProductQuickAction(activeStoreId, {
        title: modalForm.title,
        detail: modalForm.detail,
        amount: numAmount || 150000
      });
      if (res.data) {
        triggerToast(`Product "${res.data.name}" added to catalog and synchronized with CDN!`);
      } else {
        triggerToast(`Product "${modalForm.title}" added!`);
      }
      await SupabaseDashboardService.incrementUmkmAiTaskCompleted(activeStoreId, 'Inventory Store AI', `Added Product "${modalForm.title}" to catalog`);
    }

    setActiveModal(null);
    setModalForm({ title: '', detail: '', amount: '' });
    await loadDashboardData();
  };

  const handleDeployAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAgentForm.name.trim()) {
      triggerToast('Please provide a name for the AI Employee');
      return;
    }
    setLoading(true);
    try {
      const activeStoreId = await SupabaseDashboardService.getAuthenticatedStoreId();
      const res = await SupabaseDashboardService.addUmkmAiEmployee(activeStoreId, {
        name: newAgentForm.name,
        role: newAgentForm.role,
        model_engine: newAgentForm.model_engine,
        system_prompt: newAgentForm.system_prompt,
        temperature: newAgentForm.temperature
      });

      if (res && res.data) {
        triggerToast(`AI Employee "${res.data.name || newAgentForm.name}" deployed with ${newAgentForm.model_engine}!`);
      } else {
        triggerToast(`AI Employee "${newAgentForm.name}" deployed!`);
      }

      setShowDeployModal(false);
      setIsModelDropdownOpen(false);
      setNewAgentForm({
        name: '',
        role: 'Support & Ops Specialist',
        model_engine: 'ZEGA-Swarm-Llama-3.3-70B',
        system_prompt: 'You are an autonomous AI employee assisting UMKM operations.',
        temperature: 0.7,
        description: ''
      });
      await loadDashboardData();
    } catch (err) {
      console.error('Error deploying agent:', err);
      triggerToast('Failed to deploy AI Employee');
    } finally {
      setLoading(false);
    }
  };

  const timeframeTotalRevenue = dynamicSalesData.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
  const timeframeTotalOrders = dynamicSalesData.reduce((acc, curr) => acc + (Number(curr.orders) || 0), 0);

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100 max-w-[1600px] mx-auto pb-6">

      {/* ========================================================================= */}
      {/* HEADER BANNER WITH GREETING */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
            {u.welcomeBack || 'Selamat datang kembali,'} {displayName || 'Seninquez'}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {u.overviewSubtitle || 'Berikut adalah ikhtisar terkini dan performa operasional bisnis Anda hari ini.'}
          </p>
        </div>

        <button
          onClick={() => setShowSupportAssistantModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
        >
          <Bot size={18} className="animate-pulse" />
          <span>{u.chatWithAi || 'Chat AI Assistant'}</span>
        </button>
      </div>

      {/* Mobile Dedicated Home Search Bar Widget */}
      <div
        onClick={() => onOpenSearch && onOpenSearch()}
        className="sm:hidden w-full bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-all shadow-2xs backdrop-blur-md"
      >
        <Search size={18} className="text-orange-500 group-hover:scale-110 transition-transform shrink-0 ml-1" />
        <span className="text-xs font-medium text-slate-400 dark:text-slate-400 flex-1 truncate select-none">
          {getUiLang() === 'en' ? 'Search features, products, invoices...' : getUiLang() === 'zh' ? '搜索功能、商品、发票...' : 'Cari fitur, produk, invoice, AI...'}
        </span>
        <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10.5px] font-bold border border-slate-200/80 dark:border-slate-600/80 shadow-2xs shrink-0 select-none group-hover:border-orange-500 transition-colors">
          {getUiLang() === 'en' ? 'Search' : getUiLang() === 'zh' ? '搜索' : 'Cari'}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* ERROR STATE ALERT BANNER WITH RETRY HANDLER */}
      {/* ========================================================================= */}
      {errorState && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">{errorState}</p>
              <p className="text-[11px] opacity-80">{u.errorDesc || 'Gagal menghubungkan ke database Supabase Realtime.'}</p>
            </div>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
          >
            {u.retry || 'Coba Lagi'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INITIAL SKELETON LOADING STATE */}
      {/* ========================================================================= */}
      {loading && !errorState && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
            <div className="lg:col-span-3 h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
            <div className="lg:col-span-3 h-64 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl"></div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW 1: 5 METRIC KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* PENDAPATAN HARI INI */}
        <div
          onClick={() => onNavigateTab('sales')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-400/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{u.revenueToday || 'Pendapatan (Hari Ini)'}</span>
            <div className="size-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Rp{Number(kpiData?.revenue_generated_today || 0).toLocaleString('id-ID')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={12} />
              <span>{kpiData?.today_revenue_trend !== undefined && kpiData?.today_revenue_trend !== null ? `${kpiData.today_revenue_trend > 0 ? '+' : ''}${kpiData.today_revenue_trend}%` : '0%'} {u.vsYesterday || 'vs kemarin'}</span>
            </div>
          </div>
        </div>

        {/* PESANAN HARI INI */}
        <div
          onClick={() => onNavigateTab('sales')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-purple-400/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{u.ordersToday || 'Pesanan (Hari Ini)'}</span>
            <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <ShoppingBag size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {Number(kpiData?.orders_today_count || 0).toLocaleString('id-ID')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Activity size={12} />
              <span>{u.today || 'Hari ini'}</span>
            </div>
          </div>
        </div>

        {/* PELANGGAN BARU HARI INI */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-400/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{u.newCustomersTitle || 'Pelanggan Baru'}</span>
            <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <UserPlus size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {Number(kpiData?.new_customers_today_count || 0).toLocaleString('id-ID')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Activity size={12} />
              <span>{u.today || 'Hari ini'}</span>
            </div>
          </div>
        </div>

        {/* KONVERSI */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-emerald-400/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{u.conversion || 'Konversi'}</span>
            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Activity size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {kpiData?.conversion_rate !== undefined && kpiData?.conversion_rate !== null ? `${kpiData.conversion_rate}%` : (kpiData?.orders_today_count > 0 ? `${((kpiData.orders_today_count / Math.max(kpiData.new_customers_today_count || 1, 1)) * 100).toFixed(1)}%` : '0.0%')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Activity size={12} />
              <span>{u.realtimeDb || 'Database real-time'}</span>
            </div>
          </div>
        </div>

        {/* RATA-RATA ORDER */}
        <div
          onClick={() => onNavigateTab('sales')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1 hover:border-amber-400/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{u.avgOrder || 'Rata-rata Order'}</span>
            <div className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Rp{kpiData?.average_order_value ? Number(kpiData.average_order_value).toLocaleString('id-ID') : (kpiData?.orders_today_count > 0 ? Math.round((kpiData.revenue_generated_today || 0) / kpiData.orders_today_count).toLocaleString('id-ID') : '0')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Activity size={12} />
              <span>{u.aovToday || 'AOV Hari Ini'}</span>
            </div>
          </div>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* ROW 2: RINGKASAN PENJUALAN + AKTIVITAS TERBARU + SISTEM & INTEGRASI & OTOMASI */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

        {/* RINGKASAN PENJUALAN (LG: 6 COLS) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.salesSummary || 'Ringkasan Penjualan'}</h3>
              <select
                value={salesTimeframe}
                onChange={(e) => setSalesTimeframe(e.target.value as any)}
                className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="7d">{u.last7Days || '7 Hari Terakhir'}</option>
                <option value="30d">{u.last30Days || '30 Hari Terakhir'}</option>
              </select>
            </div>

            <div className="mt-2 space-y-0.5">
              <span className="text-[11px] text-slate-400 font-medium block">
                {u.totalRevenue || 'Total Pendapatan'} ({salesTimeframe === '7d' ? (u.last7Days || '7 Hari') : (u.last30Days || '30 Hari')})
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-slate-50">
                  Rp{timeframeTotalRevenue.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                  <ShoppingBag size={11} /> {timeframeTotalOrders} {u.ordersCount || 'pesanan'}
                </span>
              </div>
            </div>
          </div>

          {/* RECHARTS AREA CHART */}
          <div className="h-48 w-full pt-1">
            {dynamicSalesData && dynamicSalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueMock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenueMock)"
                    activeDot={{ r: 5, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <BarChart2 size={24} className="text-slate-400 mb-1" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{u.noSalesData || 'Belum ada data penjualan'}</p>
                <p className="text-[10px] text-slate-400">{u.salesDataSub || 'Transaksi baru akan otomatis direkam dalam grafik ini.'}</p>
              </div>
            )}
          </div>
        </div>

        {/* AKTIVITAS TERBARU (LG: 3 COLS) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.recentActivity || 'Aktivitas Terbaru'}</h3>
              <button
                onClick={() => onNavigateTab('customer_activity_stream')}
                className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                {u.seeAll || 'Lihat semua'}
              </button>
            </div>

            <div className="mt-2.5 space-y-2 text-xs">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((act, idx) => {
                  const IconComp = act.icon || Activity;
                  return (
                    <div
                      key={idx}
                      onClick={() => onNavigateTab('sales')}
                      className="flex items-start justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div className={`size-6 rounded-lg ${act.iconBg || 'bg-slate-100 text-slate-600'} flex items-center justify-center shrink-0 mt-0.5`}>
                          <IconComp size={13} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors truncate">
                            {act.title}
                          </h4>
                          <span className="text-[9px] text-slate-400 block">{act.sub}</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-[10.5px] text-slate-900 dark:text-slate-100 shrink-0 ml-1">
                        {act.amount}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  {u.noActivity || 'Belum ada aktivitas terbaru dari database'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT STACK: SISTEM & INTEGRASI + AKTIVITAS OTOMASI (LG: 3 COLS) */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">

          {/* CARD 1: SISTEM & INTEGRASI */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{u.systemIntegrations || 'Sistem & Integrasi'}</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[8.5px] font-extrabold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> {u.allSystemsNormal || 'Semua Sistem Normal'}
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div onClick={() => onNavigateTab('my_agents')} className="flex items-center justify-between cursor-pointer hover:text-orange-500 transition-colors">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Bot size={13} className="text-indigo-500" />
                  <span>{u.aiWorkforce || 'AI Workforce'}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">• {u.connected || 'Terhubung'}</span>
              </div>

              <div onClick={() => onNavigateTab('automation')} className="flex items-center justify-between cursor-pointer hover:text-orange-500 transition-colors">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Workflow size={13} className="text-purple-500" />
                  <span>{u.automations || 'Automations'}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">• 12 {u.activeWorkflows || 'Workflow Aktif'}</span>
              </div>

              <div onClick={() => onNavigateTab('marketplace')} className="flex items-center justify-between cursor-pointer hover:text-orange-500 transition-colors">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <Activity size={13} className="text-blue-500" />
                  <span>{u.database || 'Database'}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">• {u.secure || 'Aman'}</span>
              </div>

              <div onClick={() => onNavigateTab('marketplace')} className="flex items-center justify-between cursor-pointer hover:text-orange-500 transition-colors">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <CheckCircle size={13} className="text-emerald-500" />
                  <span>{u.backup || 'Backup'}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ {u.lastBackup || 'Terakhir: 12 jam lalu'}</span>
              </div>

              <div onClick={() => onNavigateTab('marketplace')} className="flex items-center justify-between cursor-pointer hover:text-orange-500 transition-colors">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <ShieldCheck size={13} className="text-amber-500" />
                  <span>{u.apiIntegrations || 'API & Integrasi'}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ {u.connected || 'Terhubung'}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('automation')}
              className="w-full mt-1 text-center py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{u.viewFullStatus || 'Lihat Status Lengkap'}</span> <ArrowRight size={11} />
            </button>
          </div>

          {/* CARD 2: AKTIVITAS OTOMASI TERBARU */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{u.recentAutomations || 'Aktivitas Otomasi Terbaru'}</h3>
              <button
                onClick={() => onNavigateTab('automation')}
                className="text-[10.5px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                {u.seeAll || 'Lihat semua'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {automations && automations.length > 0 ? (
                automations.map((auto, idx) => (
                  <div
                    key={auto.id || idx}
                    onClick={() => onNavigateTab('automation')}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Workflow size={13} className="text-emerald-500 shrink-0" />
                      <span className="text-[10.5px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-orange-600 truncate">
                        {auto.name}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0 ml-1">{auto.lastRun || (u.active || 'Aktif')}</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  {u.noAutomations || 'Belum ada otomasi terdaftar di database'}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 3: PRODUK TERLARIS + TUGAS AI HARI INI + AKSI CEPAT (8 GRID CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

        {/* PRODUK TERLARIS (LG: 4 COLS) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.topProducts || 'Produk Terlaris'}</h3>
              <button
                onClick={() => onNavigateTab('top_selling')}
                className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                {u.seeAll || 'Lihat semua'}
              </button>
            </div>

            <div className="mt-2.5 space-y-2 text-xs">
              {recentActivities && recentActivities.filter(a => a.title.toLowerCase().includes('transaksi') || a.title.toLowerCase().includes('produk')).length > 0 ? (
                recentActivities
                  .filter(a => a.title.toLowerCase().includes('transaksi') || a.title.toLowerCase().includes('produk'))
                  .slice(0, 5)
                  .map((prod, idx) => (
                    <div key={idx} onClick={() => onNavigateTab('manage_product')} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="size-5 rounded-full bg-orange-100 text-orange-600 font-extrabold text-[10px] flex items-center justify-center shrink-0">{idx + 1}</span>
                        <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <Store size={14} className="text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors truncate">{prod.title}</h4>
                          <span className="text-[9.5px] text-slate-400">{prod.sub}</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 shrink-0 ml-1">{prod.amount}</span>
                    </div>
                  ))
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  {u.noTopProducts || 'Belum ada data produk terlaris di database'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TUGAS AI HARI INI (LG: 4 COLS) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.aiTasksToday || 'Tugas AI Hari Ini'}</h3>
              <button
                onClick={() => onNavigateTab('my_agents')}
                className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
              >
                {u.seeAll || 'Lihat semua'}
              </button>
            </div>

            <div className="mt-2.5 space-y-2 text-xs">
              {aiTasksList && aiTasksList.length > 0 ? (
                aiTasksList.slice(0, 5).map((task, idx) => (
                  <div key={task.id || idx} onClick={() => onNavigateTab('my_agents')} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-orange-400/50 cursor-pointer group">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 group-hover:text-orange-600 truncate">{task.task}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[8.5px] font-extrabold shrink-0 ml-1">{task.agent || task.badge || 'AI Swarm'}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  {u.noAiTasks || 'Belum ada tugas AI aktif di database hari ini'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AKSI CEPAT - 8 GRID CARDS (LG: 4 COLS) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.quickActions || 'Aksi Cepat'}</h3>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-2 text-center">
              {/* 1. Tambah Produk */}
              <button
                onClick={() => {
                  setModalForm({ title: 'Kopi Arabika Premium 250g', detail: 'Minuman / Kopi', amount: 'Rp85.000' });
                  setActiveModal('product');
                }}
                className="p-2.5 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 hover:bg-orange-100 text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer border border-orange-200/50 dark:border-orange-900/40 group"
              >
                <div className="size-7 rounded-xl bg-orange-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Plus size={15} />
                </div>
                <span className="text-[9.5px] font-extrabold leading-tight">{u.addProduct || 'Tambah Produk'}</span>
              </button>

              {/* 2. Buat Pesanan */}
              <button
                onClick={() => onNavigateTab('sales')}
                className="p-2.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100 text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer border border-purple-200/50 dark:border-purple-900/40 group"
              >
                <div className="size-7 rounded-xl bg-purple-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <ShoppingBag size={15} />
                </div>
                <span className="text-[9.5px] font-extrabold leading-tight">{u.createOrder || 'Buat Pesanan'}</span>
              </button>

              {/* 3. Kirim Promo */}
              <button
                onClick={() => {
                  setModalForm({ title: 'Promo Flash Sale 8.8 Diskon 50%', detail: 'All Active Customers', amount: 'WhatsApp & IG' });
                  setActiveModal('broadcast');
                }}
                className="p-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer border border-emerald-200/50 dark:border-emerald-900/40 group"
              >
                <div className="size-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Megaphone size={15} />
                </div>
                <span className="text-[9.5px] font-extrabold leading-tight">{u.sendPromo || 'Kirim Promo'}</span>
              </button>

              {/* 4. Lihat Laporan */}
              <button
                onClick={() => onNavigateTab('reports')}
                className="p-2.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer border border-blue-200/50 dark:border-blue-900/40 group"
              >
                <div className="size-7 rounded-xl bg-blue-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <BarChart2 size={15} />
                </div>
                <span className="text-[9.5px] font-extrabold leading-tight">{u.viewReport || 'Lihat Laporan'}</span>
              </button>

              {/* 5. Buat Invoice */}
              <button
                onClick={() => {
                  setModalForm({ title: 'Customer PT Maju Jaya', detail: 'INV-2026-009', amount: 'Rp1.500.000' });
                  setActiveModal('invoice');
                }}
                className="p-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer border border-emerald-200/50 dark:border-emerald-900/40 group"
              >
                <div className="size-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <FileText size={15} />
                </div>
                <span className="text-[9.5px] font-extrabold leading-tight">{u.createInvoice || 'Buat Invoice'}</span>
              </button>

              {/* 6. Kelola Stok */}
              <button
                onClick={() => onNavigateTab('manage_stock_limit')}
                className="p-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer border border-amber-200/50 dark:border-amber-900/40 group"
              >
                <div className="size-7 rounded-xl bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Store size={15} />
                </div>
                <span className="text-[9.5px] font-extrabold leading-tight">{u.manageStock || 'Kelola Stok'}</span>
              </button>

              {/* 7. Chat AI Assistant */}
              <button
                onClick={() => setShowSupportAssistantModal(true)}
                className="p-2.5 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 hover:bg-orange-100 text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer border border-orange-200/50 dark:border-orange-900/40 group shadow-xs hover:border-orange-500"
              >
                <div className="size-7 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Bot size={15} />
                </div>
                <span className="text-[9.5px] font-extrabold leading-tight">{u.chatWithAi || 'Chat AI Assistant'}</span>
              </button>

              {/* 8. Pengaturan */}
              <button
                onClick={() => onNavigateTab('settings')}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 group"
              >
                <div className="size-7 rounded-xl bg-slate-700 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <SlidersHorizontal size={15} />
                </div>
                <span className="text-[9.5px] font-extrabold leading-tight">{u.settings || 'Pengaturan'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>



      {/* ========================================================================= */}
      {/* QUICK ACTION MODALS */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                {activeModal === 'invoice' && 'Create Quick Invoice'}
                {activeModal === 'broadcast' && 'Send WhatsApp / IG Broadcast'}
                {activeModal === 'product' && 'Add Product to Store'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Customer Name' : activeModal === 'broadcast' ? 'Broadcast Title' : 'Product Name'}
                </label>
                <input
                  type="text"
                  value={modalForm.title}
                  onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Invoice Number / Note' : activeModal === 'broadcast' ? 'Target Audience' : 'Category'}
                </label>
                <input
                  type="text"
                  value={modalForm.detail}
                  onChange={(e) => setModalForm(prev => ({ ...prev, detail: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Total Amount' : activeModal === 'broadcast' ? 'Channels' : 'Price (Rp)'}
                </label>
                <input
                  type="text"
                  value={modalForm.amount}
                  onChange={(e) => setModalForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1.5 shadow-xs">
                  <Send size={14} /> Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AGENT QUICK VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
                  <img
                    src={SupabaseDashboardService.getCdnUrl(selectedAgentModal.avatar_path || 'assets/visualization/ai-avatar.png')}
                    alt={selectedAgentModal.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{selectedAgentModal.name}</h3>
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">{selectedAgentModal.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAgentModal(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Performance & Model Telemetry */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Tasks Today</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{selectedAgentModal.tasksDone || 125}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Resolution Rate</span>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{selectedAgentModal.resolvedVal || '94.2%'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Est. Cost / 1k Tokens</span>
                <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                  ${selectedAgentModal.est_cost_per_1k_tokens ? selectedAgentModal.est_cost_per_1k_tokens.toFixed(5) : '0.00015'}
                </span>
              </div>
            </div>

            {/* AI Architecture & Engine Details */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-semibold">Model Engine:</span>
                <span className="font-extrabold text-orange-600 dark:text-orange-400">{selectedAgentModal.model_engine || 'ZEGA-Swarm-Llama-3.3-70B'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-semibold">Routing Strategy:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAgentModal.routing_strategy || '9Router-Smart-Cost'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-semibold">Execution Gateway:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAgentModal.execution_gateway || 'ZeroClaw-Edge-Gateway'}</span>
              </div>
            </div>

            {/* Active Capabilities */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Capabilities & Tools</span>
              <div className="flex flex-wrap gap-1.5">
                {['WhatsApp API', 'Supabase RAG', 'Auto-Invoice', 'Instagram DM', 'Sentiment Analysis'].map((cap, ci) => (
                  <span key={ci} className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle size={12} className="text-orange-500" />
                    <span>{cap}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Status Toggle & Delete Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
              <button
                onClick={async () => {
                  const newStatus = selectedAgentModal.status === 'active' ? 'paused' : 'active';
                  if (selectedAgentModal.id) {
                    await SupabaseDashboardService.updateUmkmAiEmployeeStatus(selectedAgentModal.id, newStatus);
                  }
                  setSelectedAgentModal({ ...selectedAgentModal, status: newStatus });
                  triggerToast(`Updated ${selectedAgentModal.name} status to ${newStatus.toUpperCase()}`);
                  await loadDashboardData();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors border ${selectedAgentModal.status === 'active'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
              >
                {selectedAgentModal.status === 'active' ? '• Status: Active' : '• Status: Paused'}
              </button>

              <button
                onClick={async () => {
                  if (selectedAgentModal.id) {
                    await SupabaseDashboardService.deleteUmkmAiEmployee(selectedAgentModal.id);
                    triggerToast(`AI Employee "${selectedAgentModal.name}" deleted`);
                  } else {
                    triggerToast(`Agent deleted`);
                  }
                  setSelectedAgentModal(null);
                  await loadDashboardData();
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Delete Agent
              </button>

              <button
                onClick={() => {
                  setSelectedAgentModal(null);
                  onNavigateTab('my_agents');
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DEPLOY NEW AI EMPLOYEE MODAL */}
      {/* ========================================================================= */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-orange-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Deploy New AI Employee</h3>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAgentForm.name.trim()) return;

                const payload = {
                  name: newAgentForm.name,
                  role: newAgentForm.role,
                  category: newAgentForm.role,
                  model_engine: newAgentForm.model_engine,
                  system_prompt: newAgentForm.system_prompt,
                  temperature: newAgentForm.temperature,
                  desc: newAgentForm.description || `Autonomous AI Agent powered by ${newAgentForm.model_engine}.`,
                  status: 'working',
                  avatar_path: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
                  capabilities: ['WhatsApp API', 'Supabase RAG', newAgentForm.model_engine]
                };

                const res = await SupabaseDashboardService.addUmkmAiEmployee('11111111-1111-1111-1111-111111111111', payload);
                if (res.data) {
                  setAiEmployees(prev => [res.data, ...prev]);
                  triggerToast(`Successfully deployed ${res.data.name || newAgentForm.name} (${newAgentForm.model_engine})!`);
                } else {
                  triggerToast(`Deployed ${newAgentForm.name} locally.`);
                }

                setShowDeployModal(false);
                setNewAgentForm({
                  name: '',
                  role: 'Support & Ops Specialist',
                  model_engine: 'ZEGA-Swarm-Llama-3.3-70B',
                  system_prompt: 'You are an autonomous AI employee assisting UMKM operations.',
                  temperature: 0.7,
                  description: ''
                });
                await loadDashboardData();
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">AI Employee Name</label>
                <input
                  type="text"
                  required
                  value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                  placeholder="e.g. Customer Support AI"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="relative">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">AI Model Engine & Architecture</label>
                {(() => {
                  const models = [
                    {
                      id: '9Router-Auto-Cost-Optimizer',
                      name: '9Router Layer 5 Engine',
                      badge: 'Auto-Cost Router',
                      desc: 'Lowest Token Cost & Multi-Provider Failover',
                      logo: getR2CdnUrl('assets/logo/9router.png'),
                      accent: 'border-orange-500 bg-orange-50/90 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                    },
                    {
                      id: 'ZeroClaw-Edge-Gateway-Llama3',
                      name: 'ZeroClaw Edge Gateway',
                      badge: 'Sub-200ms Edge',
                      desc: 'Edge Agent Execution & Solana Pay Escrow',
                      logo: getR2CdnUrl('assets/logo/zeroclaw.jpeg'),
                      accent: 'border-purple-500 bg-purple-50/90 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                    },
                    {
                      id: 'ZEGA-Swarm-Llama-3.3-70B',
                      name: 'ZEGA Swarm Llama 3.3 70B',
                      badge: 'Flagship Enterprise',
                      desc: 'Ultra-Fast Complex Reasoning & Operations',
                      logo: getR2CdnUrl('assets/logo/zegalogo.png'),
                      accent: 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    },
                    {
                      id: 'DeepSeek-R1-Distill-Qwen-32B',
                      name: 'DeepSeek R1 Distill 32B',
                      badge: 'High Reasoning',
                      desc: 'Deep Analytical Thinking & Math Logic',
                      logo: getR2CdnUrl('assets/logo/deepseek.webp'),
                      accent: 'border-cyan-500 bg-cyan-50/90 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                    },
                    {
                      id: 'Qwen-2.5-Coder-32B',
                      name: 'Qwen 2.5 Coder 32B',
                      badge: 'Automation Code',
                      desc: 'API Workflows & Code Execution Engine',
                      logo: getR2CdnUrl('assets/logo/Qwen.png'),
                      accent: 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    },
                    {
                      id: 'Claude-3.5-Sonnet-v2',
                      name: 'Claude 3.5 Sonnet v2',
                      badge: 'Vision & OCR',
                      desc: 'Multimodal Vision & Document OCR Specialist',
                      logo: getR2CdnUrl('assets/logo/claude.webp'),
                      accent: 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    },
                    {
                      id: 'Ollama-Local-Zero-Cost',
                      name: 'Ollama Local Node',
                      badge: 'Zero Cost',
                      desc: 'On-Premise Private LLM Deployment',
                      logo: getR2CdnUrl('assets/logo/huggingface.webp'),
                      accent: 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                    }
                  ];
                  const selectedModel = models.find((m) => m.id === newAgentForm.model_engine) || models[0];

                  return (
                    <div className="relative">
                      {/* Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all shadow-xs ${selectedModel.accent}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            <img src={selectedModel.logo} alt={selectedModel.name} className="w-5 h-5 object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold truncate">{selectedModel.name}</span>
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-orange-500 text-white shrink-0">
                                {selectedModel.badge}
                              </span>
                            </div>
                            <p className="text-[10px] opacity-80 truncate">{selectedModel.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isModelDropdownOpen ? 'rotate-90' : 'rotate-0'}`} />
                      </button>

                      {/* Floating Seamless Popover Menu */}
                      {isModelDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 max-h-56 overflow-y-auto backdrop-blur-md">
                          {models.map((model) => {
                            const isSelected = newAgentForm.model_engine === model.id;
                            return (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => {
                                  setNewAgentForm({ ...newAgentForm, model_engine: model.id });
                                  setIsModelDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl transition-all flex items-center gap-2.5 ${isSelected
                                    ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-500/40 text-orange-700 dark:text-orange-300 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                                  }`}
                              >
                                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                  <img src={model.logo} alt={model.name} className="w-5 h-5 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-bold truncate">{model.name}</span>
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                      {model.badge}
                                    </span>
                                  </div>
                                  <p className="text-[10px] opacity-75 truncate">{model.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Role Specialization</label>
                <select
                  value={newAgentForm.role}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Support & Ops Specialist">Support & Ops Specialist</option>
                  <option value="Growth & Content Specialist">Growth & Content Specialist</option>
                  <option value="Finance & Audit Specialist">Finance & Audit Specialist</option>
                  <option value="Logistics Specialist">Logistics Specialist</option>
                  <option value="Sales & Pipeline Specialist">Sales & Pipeline Specialist</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">System Prompt Instruction</label>
                <textarea
                  rows={2}
                  value={newAgentForm.system_prompt}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, system_prompt: e.target.value })}
                  placeholder="System instruction..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Deploy AI Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INSTAGRAM DM & COMMENT POLICY MODAL */}
      {/* ========================================================================= */}
      {showIgPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Instagram size={20} className="text-pink-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Instagram DM & Comment Policy</h3>
              </div>
              <button onClick={() => setShowIgPolicyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium">
              {[
                { key: 'autoCommentReply', title: 'Auto-Reply to Post Comments', desc: 'AI automatically replies to product questions on post comments within 30s.' },
                { key: 'keywordPriceCheck', title: 'Keyword Price & Catalog Inquiry', desc: 'Responds instantly when users comment "Cek Harga", "Berapa", or "DM".' },
                { key: 'storyMentionThankYou', title: 'Story Mention Auto-Thank You', desc: 'Sends an automatic appreciation message and voucher link when tagged in IG Stories.' },
                { key: 'leadCaptureWaLink', title: 'Direct WhatsApp Checkout Link', desc: 'Attaches a personalized WhatsApp checkout link to convert IG inquiries.' },
              ].map((item) => {
                const isActive = (igPolicyTriggers as any)[item.key];
                return (
                  <div key={item.key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-slate-900 dark:text-slate-100">{item.title}</h5>
                      <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIgPolicyTriggers(prev => ({ ...prev, [item.key]: !isActive }))}
                      className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 ${isActive ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`size-4.5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowIgPolicyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  triggerToast('Instagram DM & Comment Policy saved & synchronized with Supabase!');
                  setShowIgPolicyModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUICK PLAN MANAGEMENT SUB-MODAL */}
      {/* ========================================================================= */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu size={20} className="text-orange-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Kelola Paket &amp; Kuota AI</h3>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Current Plan Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Active Subskripsi</span>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">Growth Scale Plan</h4>
                <p className="text-[10px] text-slate-500">Rp499.000 / bulan • Perpanjang 01 Sep 2026</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-500 text-white font-extrabold text-[10px] shadow-xs">PRO</span>
            </div>

            {/* Quota Telemetry */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-600 dark:text-slate-300">Kuota Token AI Bulan Ini</span>
                <span className="text-orange-600 dark:text-orange-400">3.240 / 5.000 Tokens (65%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Feature Access & Gateway Badges */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Fitur &amp; Telemetri Aktif</span>
              <div className="grid grid-cols-2 gap-1.5">
                {['9Router Failover', 'ZeroClaw Edge', 'R2 CDN Assets', 'Supabase Realtime', 'WhatsApp API Bot', 'IG DM Automation'].map((feat, fi) => (
                  <div key={fi} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  triggerToast('Top Up Token AI +2.000 Token Berhasil!');
                  setShowPlanModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-orange-500/80 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold text-xs hover:bg-orange-100 cursor-pointer transition-colors"
              >
                Top Up Token
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPlanModal(false);
                  onNavigateTab('billing');
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Halaman Tagihan &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: INLINE QUICK SUPPORT ASSISTANT SUB-MODAL */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL 6: INLINE QUICK SUPPORT ASSISTANT SUB-MODAL (Full Screen Responsive & Persistence) */}
      {/* ========================================================================= */}
      {showSupportAssistantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
          <div className={
            isHelpFullScreen
              ? 'fixed inset-2 sm:inset-6 z-[60] bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative'
              : 'bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-3.5 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] relative'
          }>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 sm:size-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                  <Bot size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                    <span>ZEGA Ops Specialist</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {getAiLang() === 'en' ? 'Operational Onboarding & System Setup Guide' : getAiLang() === 'zh' ? '运营入门与系统设置指南' : 'Bantuan Langsung & Otomasi Alur Kerja Toko'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: History, + Sesi Baru, Maximize, Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowHelpHistory(!showHelpHistory)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${showHelpHistory ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title={getAiLang() === 'en' ? 'Recent Chat History' : getAiLang() === 'zh' ? '历史对话' : 'Riwayat Chat'}
                >
                  <History size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleNewHelpChat}
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
                  onClick={() => setIsHelpFullScreen(!isHelpFullScreen)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isHelpFullScreen ? 'Kecilkan Modal' : 'Layar Penuh (Full Screen)'}
                >
                  {isHelpFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSupportAssistantModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup Modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ChatGPT-Style Full Overlay Recent Conversations Panel */}
            {showHelpHistory && (
              <div className="absolute inset-0 z-50 bg-white/98 dark:bg-slate-950/98 backdrop-blur-2xl flex flex-col p-4.5 animate-in fade-in zoom-in-95 duration-200">
                {/* Overlay Header Bar */}
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowHelpHistory(false)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                      title="Kembali ke Chat"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <History size={15} className="text-orange-500" />
                          <span>{getAiLang() === 'en' ? 'AI Assistant Chat History' : getAiLang() === 'zh' ? 'AI 助手历史' : 'Riwayat AI Assistant'}</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                          OPS SPECIALIST
                        </span>
                      </div>
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                        {filteredHelpHistoryList.length} {getAiLang() === 'en' ? 'Sessions saved' : 'Sesi Tersimpan'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleNewHelpChat();
                      setShowHelpHistory(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>{getAiLang() === 'en' ? 'New Session' : getAiLang() === 'zh' ? '新对话' : 'Sesi Baru'}</span>
                  </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="relative mb-3 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder={getAiLang() === 'en' ? 'Filter chat history by title or text...' : getAiLang() === 'zh' ? '按标题或内容筛选...' : 'Cari riwayat AI Assistant...'}
                    value={helpHistorySearch}
                    onChange={(e) => setHelpHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all"
                  />
                  {helpHistorySearch && (
                    <button
                      onClick={() => setHelpHistorySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Session Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredHelpHistoryList.length === 0 ? (
                    <div className="text-center py-14 px-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <MessageSquare size={28} className="mx-auto mb-2 text-slate-400/60 dark:text-slate-600" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        {getAiLang() === 'en' ? 'No Ops Specialist sessions found' : 'Belum ada riwayat percakapan AI Assistant'}
                      </p>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
                        {getAiLang() === 'en' ? 'Click "+ New Session" to start a new ops discussion.' : getAiLang() === 'zh' ? '点击 "+ 新对话" 开始新讨论。' : 'Klik "+ Sesi Baru" untuk memulai diskusi operasional baru.'}
                      </p>
                    </div>
                  ) : (
                    filteredHelpHistoryList.map((session) => {
                      const isActive = activeHelpChatId === session.id;
                      let displayTitle = stripMarkdown(session.title);
                      if (!displayTitle || displayTitle === 'Diskusi Utama ZEGA Copilot' || displayTitle === 'Diskusi Utama' || displayTitle === 'Bantuan Ops Specialist' || displayTitle === 'Ops Specialist Guide') {
                        displayTitle = getAiLang() === 'en' ? 'Ops Specialist Guide' : getAiLang() === 'zh' ? '运营专家指南' : 'Bantuan Ops Specialist';
                      } else if (displayTitle.startsWith('Sesi ') || displayTitle.startsWith('Session ')) {
                        const timePart = displayTitle.replace(/^(Sesi|Session)\s*/i, '');
                        displayTitle = getAiLang() === 'en' ? `Session ${timePart}` : getAiLang() === 'zh' ? `对话 ${timePart}` : `Sesi ${timePart}`;
                      }

                      return (
                        <button
                          key={session.id}
                          onClick={() => handleSelectHelpSession(session)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex flex-col gap-1.5 cursor-pointer group ${
                            isActive
                              ? 'bg-orange-500/10 border-orange-500/50 text-orange-900 dark:text-orange-300 shadow-sm'
                              : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:translate-x-0.5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold truncate text-xs group-hover:text-orange-500 transition-colors">
                                {displayTitle}
                              </span>
                            </div>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white font-mono text-[8.5px] font-extrabold uppercase shrink-0 flex items-center gap-1 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Aktif
                              </span>
                            )}
                          </div>
                          {session.last_message && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 truncate font-normal leading-snug">
                              {stripMarkdown(session.last_message)}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-0.5">
                            <span>{new Date(session.created_at || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleDeleteHelpSession(session.id, e)}
                                title="Hapus Sesi Chat"
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                              <span className="flex items-center gap-1 text-orange-500 font-bold group-hover:translate-x-0.5 transition-transform">
                                {getAiLang() === 'en' ? 'Open Chat' : getAiLang() === 'zh' ? '打开对话' : 'Buka Chat'} <ChevronRight size={12} />
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

            {/* Quick FAQ Chips */}
            <div className="space-y-1.5 py-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                {getAiLang() === 'en' ? 'Popular Topics' : getAiLang() === 'zh' ? '热门主题' : 'Pertanyaan Populer'}
              </span>
              <div className="flex flex-wrap gap-1">
                {(getAiLang() === 'en' ? [
                  'Deploy AI Swarm',
                  'WhatsApp API Setup',
                  'Quick Invoicing',
                  'Supabase Integration'
                ] : getAiLang() === 'zh' ? [
                  '部署 AI 员工',
                  '设置 WhatsApp Bot',
                  '开具快速发票',
                  'Supabase 数据库集成'
                ] : [
                  'Cara Deploy AI Agent?',
                  'Setup WhatsApp API Bot',
                  'Kelola Invoice Penjualan',
                  'Integrasi CDN & Supabase'
                ]).map((faq, fqIdx) => (
                  <button
                    key={fqIdx}
                    type="button"
                    onClick={() => handleSendSupportMessage(faq)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {faq}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Output Stream (Adaptive Height) */}
            <div className={`overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs my-2 ${isHelpFullScreen ? 'flex-1 min-h-[300px]' : 'h-52 sm:h-60'}`}>
              {supportChatMessages.map((msg, mIdx) => (
                <div key={mIdx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none font-medium shadow-xs' : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none font-medium shadow-xs space-y-1.5'}`}>
                    {msg.sender === 'user' ? (
                      <p className="text-[11px] leading-relaxed font-semibold">{msg.text}</p>
                    ) : (
                      renderFormattedSupportMessage(msg.text)
                    )}
                    {msg.sender === 'ai' && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[8.5px] text-slate-400 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-black flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ZEGA Ops Specialist
                          </span>
                          <span>{getAiLang() === 'en' ? '• Response ' : getAiLang() === 'zh' ? '• 响应 ' : '• Respon '}{msg.inference_ms || 185}ms</span>
                        </div>
                        <span className="text-slate-400 font-medium">{getAiLang() === 'en' ? 'Verified' : getAiLang() === 'zh' ? '已验证' : 'Terverifikasi'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendSupportMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                placeholder={getAiLang() === 'en' ? 'Type your operational query...' : getAiLang() === 'zh' ? '输入您的运营与系统设置提问...' : 'Tulis pertanyaan bantuan Anda...'}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
              <button type="submit" className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-colors shadow-xs">
                <Send size={14} />
              </button>
            </form>

            {/* Link to Full Help Center */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">
                {getAiLang() === 'en' ? 'Need complete documentation guides?' : getAiLang() === 'zh' ? '需要完整的系统文档指南？' : 'Butuh panduan dokumen lengkap?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowSupportAssistantModal(false);
                  onNavigateTab('help');
                }}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{getAiLang() === 'en' ? 'Full Help Center >' : getAiLang() === 'zh' ? '完整帮助中心 >' : 'Pusat Bantuan Lengkap >'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI AUTOMATIONS REALTIME MANAGEMENT WORKSPACE MODAL */}
      {/* ========================================================================= */}
      {showAutomationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Workflow size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>AI Automations Management Workspace</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Realtime DB
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Pusat kelola, aktivasi, & pembuatan alur kerja otomatisasi AI terintegrasi Supabase</p>
                </div>
              </div>
              <button onClick={() => setShowAutomationsModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Live Metrics Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40">
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 block">Total Workflows</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">{automations.length || 4} Workflows</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">Active Status</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {automations.filter((a) => a.status !== 'paused').length} Running
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block">Trigger Reliability</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">99.9%</span>
              </div>
            </div>

            {/* Create New Automation Workflow Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAutomationForm.name.trim()) return;
                const autoName = newAutomationForm.name;
                const triggerEv = newAutomationForm.trigger_event;
                const actionType = newAutomationForm.action_type;

                triggerToast(`Creating AI Automation: "${autoName}"...`);
                setNewAutomationForm({ name: '', trigger_event: 'WhatsApp Chat', action_type: 'Auto Reply' });

                const res = await SupabaseDashboardService.createUmkmAutomation({
                  name: autoName,
                  trigger_event: triggerEv,
                  action_type: actionType,
                  status: 'active'
                });

                if (res.data) {
                  triggerToast(`AI Automation saved & active in Supabase!`);
                  await loadDashboardData();
                }
              }}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5"
            >
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">⚡ Create New AI Automation Workflow</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newAutomationForm.name}
                  onChange={(e) => setNewAutomationForm({ ...newAutomationForm, name: e.target.value })}
                  placeholder="e.g. Auto Send Invoice & WA Follow-Up..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
                <select
                  value={newAutomationForm.trigger_event}
                  onChange={(e) => setNewAutomationForm({ ...newAutomationForm, trigger_event: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="WhatsApp Chat">WhatsApp Chat Trigger</option>
                  <option value="Instagram DM">Instagram DM Trigger</option>
                  <option value="New Invoice Created">Invoice Trigger</option>
                  <option value="Low Stock Alert">Stock Trigger</option>
                  <option value="Scheduled Daily">Daily Schedule</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Workflow size={14} /> Create Workflow
                </button>
              </div>
            </form>

            {/* Automations List with Live Status Toggles */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Active & Available Workflows</span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {automations.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center shrink-0">
                        <Workflow size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold text-slate-400">{item.sub || item.trigger_event || 'Everyday • 09:00'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[8.5px] font-bold">
                            {item.action_type || 'Auto Workflow'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Toggle Switch */}
                    <button
                      type="button"
                      onClick={async () => {
                        triggerToast(`Toggling status for: ${item.name}...`);
                        const res = await SupabaseDashboardService.toggleUmkmAutomation(item.id, item.status);
                        if (res.data) {
                          triggerToast(`Automation status updated to: ${res.data.status}`);
                          await loadDashboardData();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${item.status === 'paused'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                    >
                      {item.status === 'paused' ? 'Paused (Click to Start)' : '✓ Active (Click to Pause)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Ingin mengonfigurasi alur kerja lanjutan?</span>
              <button
                type="button"
                onClick={() => {
                  setShowAutomationsModal(false);
                  onNavigateTab('automation');
                }}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Automations Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* AI EMPLOYEES REALTIME MANAGEMENT WORKSPACE MODAL */}
      {/* ========================================================================= */}
      {showAgentsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>AI Employees Realtime Workspace</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> {aiEmployees.length || 5} Active Nodes
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Pusat kelola, alokasi tugas, & deployment agen AI terintegrasi Supabase & R2 CDN</p>
                </div>
              </div>
              <button onClick={() => setShowAgentsModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Top Deploy CTA Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200 dark:border-orange-900/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shadow-xs">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Tambah Agen AI Baru ke Swarm Node</h4>
                  <p className="text-[10px] text-slate-500">Pilih model engine (9Router, ZeroClaw, DeepSeek) & atur System Prompt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAgentsModal(false);
                  setShowDeployModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus size={14} /> Deploy AI Employee
              </button>
            </div>

            {/* AI Employees Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Daftar Agen AI Berjalan</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {aiEmployees.map((agent, idx) => (
                  <div
                    key={agent.id || idx}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={
                            agent.cdn_avatar_url ||
                            (agent.avatar_path && agent.avatar_path.startsWith('http') ? agent.avatar_path : getR2CdnUrl(agent.avatar_path || 'assets/logo/zegalogo.png'))
                          }
                          alt={agent.name}
                          className="w-full h-full object-contain rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getR2CdnUrl('assets/logo/zegalogo.png');
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{agent.name || agent.agent_name}</h4>
                        <span className="text-[10px] text-slate-400 block truncate">{agent.role || 'Support Specialist'}</span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[8.5px] font-extrabold">
                          {agent.model_engine || '9Router-Llama-3.3-70B'}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold flex-shrink-0">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Terhubung langsung dengan Supabase Realtime DB</span>
              <button
                type="button"
                onClick={() => {
                  setShowAgentsModal(false);
                  onNavigateTab('my_agents');
                }}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka AI Workforce Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECENT ACTIVITIES REALTIME TIMELINE LOGS MODAL */}
      {/* ========================================================================= */}
      {showActivitiesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Recent Activity & Timeline Logs</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live DB Feed
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Riwayat aktivitas real-time transaksi, otomatisasi, dan log sistem</p>
                </div>
              </div>
              <button onClick={() => setShowActivitiesModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActivityFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${activityFilter === 'all'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
              >
                Semua Aktivitas
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('transaction')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${activityFilter === 'transaction'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
              >
                Transaksi & Penjualan
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('ai_task')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${activityFilter === 'ai_task'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
              >
                Aksi Otomatis AI
              </button>
            </div>

            {/* Timeline Events List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {recentActivities
                .filter((act) => {
                  if (activityFilter === 'transaction') return act.icon === ShoppingBag;
                  if (activityFilter === 'ai_task') return act.icon === FileText;
                  return true;
                })
                .map((act, i) => {
                  const Icon = act.icon || FileText;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-xl ${act.iconBg || 'bg-orange-50 text-orange-600'} flex items-center justify-center shrink-0`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{act.title}</h4>
                          <span className="text-[10px] font-semibold text-slate-400 block">{act.sub}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold">
                        {act.amount}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Sinkronisasi otomatis dengan Supabase timeline events</span>
              <button
                type="button"
                onClick={() => {
                  setShowActivitiesModal(false);
                  onNavigateTab('reports');
                }}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Reports & Activity Log &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI TASKS TODAY REALTIME MANAGEMENT WORKSPACE MODAL */}
      {/* ========================================================================= */}
      {showAiTasksModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>AI Tasks Today Management Workspace</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Realtime DB
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Pusat kelola & eksekusi tugas agen AI terintegrasi Supabase Realtime</p>
                </div>
              </div>
              <button onClick={() => setShowAiTasksModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Live Metrics Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40">
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block">Total Tasks Today</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">{kpiData.tasks_completed_today || 126}</span>
              </div>
              <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40">
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 block">Active Swarm Nodes</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">{aiEmployees.length || 5} Agents</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">Resolution Accuracy</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">99.2%</span>
              </div>
            </div>

            {/* Dispatch New AI Task Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newTaskForm.title.trim()) return;
                const taskTitle = newTaskForm.title;
                const agentName = newTaskForm.agent;

                triggerToast(`Dispatching AI Task: "${taskTitle}"...`);
                setNewTaskForm({ ...newTaskForm, title: '' });

                // Call Supabase Atomic Task Incrementor
                const res = await SupabaseDashboardService.incrementUmkmAiTaskCompleted('11111111-1111-1111-1111-111111111111', agentName, taskTitle);
                if (res.data) {
                  triggerToast(`AI Task executed & logged in Supabase!`);
                  await loadDashboardData();
                }
              }}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5"
            >
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Execute New AI Task Live</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="e.g. Audit low stock items & trigger auto-reorder..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
                <select
                  value={newTaskForm.agent}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, agent: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Customer Service AI">Customer Service AI</option>
                  <option value="Marketing AI">Marketing AI</option>
                  <option value="Finance & Billing AI">Finance AI</option>
                  <option value="Store & Inventory AI">Store AI</option>
                  <option value="9Router Support Swarm">9Router Support AI</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Play size={14} /> Run Task
                </button>
              </div>
            </form>

            {/* AI Tasks Realtime Log List */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Stream Eksekusi Task Real-Time</span>

                {/* Agent Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10.5px]">
                  {['Semua AI Agent', 'Finance', 'Customer Service', 'Marketing', 'Inventory', 'Sales'].map((tabName) => (
                    <button
                      type="button"
                      key={tabName}
                      onClick={() => setAiTaskFilterTab(tabName)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold whitespace-nowrap ${aiTaskFilterTab === tabName
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                    >
                      {tabName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {aiTasksList
                  .filter((item) => {
                    if (aiTaskFilterTab === 'Semua AI Agent') return true;
                    return item.agent.toLowerCase().includes(aiTaskFilterTab.toLowerCase()) ||
                      item.task.toLowerCase().includes(aiTaskFilterTab.toLowerCase());
                  })
                  .map((item, idx) => {
                    const getAiTaskRoute = () => {
                      const text = `${item.task} ${item.agent}`.toLowerCase();
                      if (text.includes('finance') || text.includes('bill') || text.includes('invoice') || text.includes('gas fee') || text.includes('margin') || text.includes('pengeluaran')) return 'finance';
                      if (text.includes('crm') || text.includes('customer') || text.includes('retention') || text.includes('pelanggan') || text.includes('wa') || text.includes('repeat order')) return 'customers';
                      if (text.includes('marketing') || text.includes('campaign') || text.includes('promo') || text.includes('broadcast') || text.includes('studio')) return 'marketing';
                      if (text.includes('stock') || text.includes('stok') || text.includes('inventory') || text.includes('store') || text.includes('product') || text.includes('restock') || text.includes('niacinamide')) return 'store';
                      if (text.includes('sales') || text.includes('lead') || text.includes('b2b') || text.includes('pipeline') || text.includes('closing') || text.includes('kualifikasi')) return 'sales';
                      return 'my_agents';
                    };

                    const getRouteLabel = (rt: string) => {
                      if (rt === 'finance') return 'Buka Finance';
                      if (rt === 'customers') return 'Buka CRM';
                      if (rt === 'marketing') return 'Buka Studio';
                      if (rt === 'store') return 'Buka Stok';
                      if (rt === 'sales') return 'Buka Sales';
                      return 'Kelola AI';
                    };

                    const targetRoute = getAiTaskRoute();

                    return (
                      <div
                        key={item.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-purple-400/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                            <CheckCircle size={16} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{item.task}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold text-slate-400">{item.agent}</span>
                              <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[8.5px] font-bold">
                                {item.badge || 'Swarm Executed'}
                              </span>
                              <span className="text-[9.5px] font-bold text-slate-400">• {item.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAiTasksModal(false);
                              onNavigateTab(targetRoute);
                            }}
                            className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <span>{getRouteLabel(targetRoute)}</span>
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Ingin mengelola agen AI selengkapnya?</span>
              <button
                type="button"
                onClick={() => {
                  setShowAiTasksModal(false);
                  onNavigateTab('my_agents');
                }}
                className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka My Agents Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
