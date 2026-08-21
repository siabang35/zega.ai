import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, Send, Bot, ShieldCheck, Activity, Cpu, Zap, RefreshCw, X, Plus, History, Search, Copy, Check } from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';
import { getApiBase } from '../../../../config/api';
import { SupabaseDashboardService, isValidUuid, getCanonicalAuthHeaders, isVerifiedTenantContext } from '../../services/supabaseService';
import { getActiveTenantIds } from '../../contexts/TenantContext';
import { chatSessionManager } from '../../services/chatSessionManager';

export interface EnterpriseCopilotProps {
  dark?: boolean;
  userEmail?: string;
  userName?: string;
  triggerToast: (msg: string) => void;
}

export function EnterpriseCopilot({
  dark = false,
  userEmail = '',
  userName = '',
  triggerToast
}: EnterpriseCopilotProps) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // Chat session & history state
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleCopyMessage = (text: string, msgId: string) => {
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
      setCopiedMsgId(msgId);
      triggerToast('✓ Copied to clipboard');
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const getSeedMessageText = () => {
    return 'Welcome to **ZEGA Enterprise Copilot AI** 🚀. I am connected directly to your enterprise clusters, 9Router engine, and OWASP security telemetry. How can I assist with your orchestration, security audit, or cost optimization today?';
  };

  const [copilotMessages, setCopilotMessages] = useState<Array<{
    id?: string;
    sender: 'user' | 'copilot' | 'system';
    message: string;
    ai_model?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    inference_ms?: number;
    created_at?: string;
  }>>([
    {
      id: 'ent-seed-1',
      sender: 'copilot',
      message: getSeedMessageText(),
      ai_model: 'deepseek-r1-zeroclaw',
      prompt_tokens: 64,
      completion_tokens: 92,
      total_tokens: 156,
      inference_ms: 180,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Clean Markdown Text Formatter
  const renderFormattedMessage = (text: string) => {
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
            bulletPrefix = <span className="text-indigo-400 font-bold text-xs shrink-0 select-none">•</span>;
          } else if (numMatch) {
            contentLine = numMatch[2];
            bulletPrefix = (
              <span className="text-indigo-400 font-mono font-bold text-[10px] shrink-0 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20">
                {numMatch[1]}
              </span>
            );
          }

          const parts = contentLine.split(/(\*\*[^*]+\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-indigo-400 dark:text-indigo-300">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (bulletPrefix) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
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

  // 1. Fetch Session History List
  const fetchHistoryList = async () => {
    try {
      const tenant = getActiveTenantIds();
      const list = await SupabaseDashboardService.getUmkmRecentChatHistory(tenant.userId || '', 'enterprise_copilot');
      if (list && list.length > 0) {
        setHistoryList(list.map((item: any) => ({
          id: item.chat_id,
          title: item.title,
          created_at: item.updated_at || item.created_at,
          last_message: item.last_message
        })));
      }
    } catch (e) {
      console.warn('Note loading history list:', e);
    }
  };

  useEffect(() => {
    if (showHistoryDrawer) {
      fetchHistoryList();
    }
  }, [showHistoryDrawer]);

  // 2. Initialize Canonical Chat Session on mount
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const tenant = getActiveTenantIds();
        const res = await SupabaseDashboardService.resolveOrCreateCanonicalAiAssistantChat(
          tenant.storeId,
          tenant.userId,
          'Enterprise Copilot Chat',
          'ZEGA Enterprise Specialist'
        );
        if (res.ok && res.chatId) {
          if (isMounted) setChatSessionId(res.chatId);
          const msgs = await SupabaseDashboardService.getUmkmAiAssistantMessages(res.chatId);
          if (msgs && msgs.length > 0 && isMounted) {
            setCopilotMessages(msgs.map((m: any) => ({
              id: m.id,
              sender: m.sender === 'user' ? 'user' : 'copilot',
              message: m.text,
              ai_model: m.model_engine || 'deepseek-r1-zeroclaw',
              inference_ms: m.inference_ms || 180,
              created_at: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
          }
        }
      } catch (err) {
        console.warn('Failed init Enterprise Copilot Session:', err);
      }
    };
    initSession();
    return () => { isMounted = false; };
  }, []);

  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // 3. Create New Chat Session
  const handleNewSession = async () => {
    if (isCreatingSession) return;
    setIsCreatingSession(true);
    try {
      const tenant = getActiveTenantIds();
      const newChat = await SupabaseDashboardService.createUmkmAiAssistantChat(
        tenant.storeId || '',
        tenant.userId || '',
        `Copilot Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        'ZEGA Enterprise Specialist'
      );
      if (newChat && newChat.id) {
        setChatSessionId(newChat.id);
        const seedText = getSeedMessageText();
        setCopilotMessages([{
          id: 'seed-' + Date.now(),
          sender: 'copilot',
          message: seedText,
          ai_model: 'deepseek-r1-zeroclaw',
          inference_ms: 180,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        await SupabaseDashboardService.saveUmkmAiAssistantMessage({
          chat_id: newChat.id,
          sender: 'ai',
          text: seedText
        });
        fetchHistoryList();
        setShowHistoryDrawer(false);
      }
    } catch (e) {
      console.warn('Error creating new session:', e);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // 4. Select Session from History
  const handleSelectSession = async (session: any) => {
    try {
      // Clear previous message state immediately before loading selected session messages
      setCopilotMessages([]);
      setChatSessionId(session.id);
      const msgs = await SupabaseDashboardService.getUmkmAiAssistantMessages(session.id);
      if (msgs && msgs.length > 0) {
        setCopilotMessages(msgs.map((m: any) => ({
          id: m.id,
          sender: m.sender === 'user' ? 'user' : 'copilot',
          message: m.text,
          ai_model: m.model_engine || 'deepseek-r1-zeroclaw',
          inference_ms: m.inference_ms || 180,
          created_at: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      } else {
        setCopilotMessages([{
          id: 'seed-' + Date.now(),
          sender: 'copilot',
          message: getSeedMessageText(),
          ai_model: 'deepseek-r1-zeroclaw',
          inference_ms: 180,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
      setShowHistoryDrawer(false);
    } catch (e) {
      console.warn('Error selecting session:', e);
    }
  };

  const handleSendCopilotMessage = async (customText?: string) => {
    const textToSend = customText || copilotInput;
    if (!textToSend.trim()) return;

    // Requirement 18: Copilot Hard Gate (tenantVerified != true -> no API request, no headers, no payload, return STORE_CONTEXT_UNAVAILABLE)
    const tenantCtx = await SupabaseDashboardService.getCanonicalTenantContext();
    if (!tenantCtx || !isVerifiedTenantContext(tenantCtx)) {
      console.warn('[Copilot Gate] tenantVerified != true — blocking request, returning STORE_CONTEXT_UNAVAILABLE');
      if (!customText) setCopilotInput('');
      setCopilotMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'user' as const,
          message: textToSend.trim(),
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: (Date.now() + 1).toString(),
          sender: 'copilot' as const,
          message: '⚠️ **STORE_CONTEXT_UNAVAILABLE**: Copilot AI features are gated because tenant identity is blocked or unverified. Verified backend identity and store context required.',
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      message: textToSend.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    if (!customText) setCopilotInput('');
    setIsCopilotTyping(true);

    // Save user message to database if active session is valid
    if (chatSessionId && isValidUuid(chatSessionId)) {
      try {
        await SupabaseDashboardService.saveUmkmAiAssistantMessage({
          chat_id: chatSessionId,
          sender: 'user',
          text: textToSend.trim()
        });
      } catch (err) {
        console.warn('Failed saving user message:', err);
      }
    }

    const startTime = Date.now();
    const promptLower = textToSend.toLowerCase();
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let replyMessage = '';
    let aiModel = 'deepseek-r1-huggingface';
    let promptTokens = Math.floor(textToSend.length * 1.2);
    let completionTokens = 120;
    let totalTokens = promptTokens + completionTokens;
    let latencyMs = 180;

    // Read AI Language Preference
    const getAiLang = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('zega_ai_default_language');
        if (saved && (saved === 'en' || saved === 'id' || saved === 'zh')) return saved;
      }
      return 'en';
    };
    const currentAiLang = getAiLang();

    // Enforce Hard AI Gate: Check verified tenant context before AI model execution
    const activeTenant = getActiveTenantIds();
    const isVerified = isVerifiedTenantContext(activeTenant, activeTenant.userId);

    if (!isVerified) {
      console.warn('[AI_HARD_GATE] Enterprise Copilot AI execution blocked: tenant unverified or identity blocked');
      replyMessage = '⚠️ **AI GATED**: Enterprise Copilot AI model execution is gated because your tenant identity is unverified or blocked. Verified backend identity required.';
      aiModel = 'gated-identity';
      latencyMs = Date.now() - startTime;
    } else {
      // Real AI Model inference endpoint call
      try {
        const apiHost = getApiBase();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const headers = getCanonicalAuthHeaders();
        const reqFingerprint = `ent:${chatSessionId || 'anon'}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
        headers['X-Request-Fingerprint'] = reqFingerprint;

        const fetchStart = Date.now();
        const response = await fetch(`${apiHost}/v1/enterprise/copilot/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ chatId: chatSessionId, assistantType: 'zega_copilot', message: textToSend.trim(), language: currentAiLang, requestFingerprint: reqFingerprint }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const totalLatency = Date.now() - startTime;
        if (response.ok) {
          const json = await response.json();
          const reqId = `req-ai-ent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          console.log('[AI_MODEL_EXECUTION]', {
            requestId: reqId,
            provider: json?.data?.ai_model || 'deepseek-r1-huggingface',
            model: json?.data?.ai_model || 'deepseek-r1-huggingface',
            status: json?.success ? 'SUCCESS' : 'FAILED',
          });

          console.log('[AI_LATENCY]', {
            requestStart: startTime,
            firstTokenLatencyMs: Date.now() - fetchStart,
            totalLatencyMs: totalLatency,
            inferenceMs: json?.data?.inference_ms || totalLatency
          });

          if (json?.success && json?.data?.message) {
            replyMessage = json.data.message;
            aiModel = json.data.ai_model || 'deepseek-r1-huggingface';
            promptTokens = json.data.prompt_tokens || promptTokens;
            completionTokens = json.data.completion_tokens || completionTokens;
            totalTokens = json.data.total_tokens || (promptTokens + completionTokens);
            latencyMs = json.data.inference_ms || (Date.now() - startTime);
          } else {
            replyMessage = '⚠️ **Model Execution Failed**: Enterprise Copilot backend returned error.';
          }
        } else {
          replyMessage = `⚠️ **Model Execution Error (${response.status})**: Backend AI service unavailable.`;
        }
      } catch (err) {
        console.warn('[EnterpriseCopilot] Backend API execution exception:', err);
        if (!replyMessage) {
          replyMessage = '⚠️ **Model Execution Error**: Unable to reach backend AI service.';
        }
      }
    }

    completionTokens = Math.floor((replyMessage || '').length * 0.8);
    totalTokens = promptTokens + completionTokens;

    const copilotMsg = {
      id: (Date.now() + 1).toString(),
      sender: 'copilot' as const,
      message: replyMessage,
      ai_model: aiModel,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      inference_ms: latencyMs,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages(prev => [...prev, copilotMsg]);
    setIsCopilotTyping(false);

    // Save AI response to database if active session is valid
    if (chatSessionId && isValidUuid(chatSessionId)) {
      try {
        await SupabaseDashboardService.saveUmkmAiAssistantMessage({
          chat_id: chatSessionId,
          sender: 'ai',
          text: replyMessage,
          inference_ms: latencyMs,
          tokens: totalTokens
        });
      } catch (err) {
        console.warn('Failed saving AI response:', err);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
      {/* Copilot Floating Chat Panel */}
      {copilotOpen && (
        <div className="w-[90vw] sm:w-[380px] max-w-[380px] h-[520px] max-h-[580px] bg-slate-950/95 text-slate-100 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 p-0.5 shrink-0 shadow-md flex items-center justify-center overflow-hidden">
                <img
                  src={getR2CdnUrl('/assets/logo/zega_copilot.png')}
                  alt="ZEGA Copilot"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white tracking-tight flex items-center gap-1.5">
                  Enterprise Copilot
                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-mono font-bold">
                    Enterprise AI
                  </span>
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-semibold">Realtime Connected</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleNewSession}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                title="Sesi Chat Baru"
              >
                <Plus size={14} /> <span>Baru</span>
              </button>
              <button
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${showHistoryDrawer ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Riwayat Chat"
              >
                <History size={15} />
              </button>
              <button
                onClick={() => setCopilotOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* History Drawer Popover */}
          {showHistoryDrawer ? (
            <div className="flex-1 p-3 bg-slate-900/90 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
                <span>Riwayat Sesi Enterprise Copilot</span>
                <button onClick={() => setShowHistoryDrawer(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari sesi chat..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1 pt-1">
                {historyList.length > 0 ? (
                  historyList
                    .filter(s => (s.title || '').toLowerCase().includes(historySearch.toLowerCase()))
                    .map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`w-full text-left p-2 rounded-xl transition-all border text-xs font-semibold ${chatSessionId === s.id
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                          }`}
                      >
                        <div className="font-bold truncate text-white">{s.title || 'Sesi Enterprise Copilot'}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.last_message || 'Belum ada pesan'}</div>
                      </button>
                    ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs italic">Belum ada riwayat sesi tersimpan</div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Prompt Pills */}
              <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleSendCopilotMessage('Cluster status & node latency')}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-400 border border-slate-700/80 text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer"
                >
                  🖥️ Cluster Status
                </button>
                <button
                  onClick={() => handleSendCopilotMessage('OWASP security threat audit')}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-400 border border-slate-700/80 text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer"
                >
                  🛡️ Security Audit
                </button>
                <button
                  onClick={() => handleSendCopilotMessage('LLM Cost Optimization Report')}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-400 border border-slate-700/80 text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer"
                >
                  💰 Cost Optimization
                </button>
                <button
                  onClick={() => handleSendCopilotMessage('Swarm workflow telemetry')}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-400 border border-slate-700/80 text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer"
                >
                  ⚡ Swarm Telemetry
                </button>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                {copilotMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[90%]">
                      {msg.sender === 'copilot' && (
                        <div className="size-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
                          <img
                            src={getR2CdnUrl('/assets/logo/zega_copilot.png')}
                            alt="ZEGA Copilot"
                            className="w-full h-full object-contain p-0.5"
                          />
                        </div>
                      )}

                      <div className={`p-3 rounded-2xl ${msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs'
                        }`}>
                        <div className="flex items-center justify-between gap-2 text-[9.5px] opacity-80 font-mono mb-1 font-bold">
                          <span>{msg.sender === 'user' ? 'You' : 'ZEGA Copilot'}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.message, msg.id || `ent-copilot-msg-${idx}`)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer shrink-0"
                            title="Copy Message"
                          >
                            {copiedMsgId === (msg.id || `ent-copilot-msg-${idx}`) ? (
                              <Check size={12} className="text-emerald-400 font-bold" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        {msg.sender === 'copilot' ? renderFormattedMessage(msg.message) : <p className="text-xs">{msg.message}</p>}

                        {msg.sender === 'copilot' && (
                          <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
                            <span>ZEGA Copilot</span>
                            <span>{msg.inference_ms}ms • {msg.total_tokens || 140} tokens</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isCopilotTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                    <span className="size-2 rounded-full bg-indigo-500 animate-ping" />
                    Copilot is querying enterprise telemetry...
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCopilotMessage()}
                  placeholder="Ask Enterprise Copilot AI..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  onClick={() => handleSendCopilotMessage()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Action Button (Icon only on mobile) */}
      <button
        onClick={() => setCopilotOpen(!copilotOpen)}
        className="group flex items-center gap-2 p-1 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white font-extrabold text-xs shadow-2xl hover:scale-105 transition-all cursor-pointer border border-indigo-400/40"
      >
        <div className="size-9.5 sm:size-10 rounded-full bg-white/20 p-0.5 flex items-center justify-center overflow-hidden">
          <img
            src={getR2CdnUrl('/assets/logo/zega_copilot.png')}
            alt="ZEGA Copilot"
            className="w-full h-full object-contain p-0 scale-125"
          />
        </div>
        <span className="hidden sm:inline">Enterprise Copilot</span>
        <span className="hidden sm:block size-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>
    </div>
  );
}
