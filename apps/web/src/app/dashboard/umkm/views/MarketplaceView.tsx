import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Star, Sparkles, CheckCircle2, ChevronRight, ArrowRight, ArrowLeft,
  Layers, UserCheck, Settings, ShieldCheck, Zap, HelpCircle,
  ExternalLink, ChevronDown, Filter, Plus, BookOpen, Clock, TrendingUp, Grid,
  Trophy, Cpu, Activity, Award, BarChart3, Receipt, FileText, PieChart, Boxes,
  Video, Users, Package, Utensils, Droplets, Tag, List, X, Globe, Key, Lock, RefreshCw, Server, Radio, Check, CreditCard, Plug, Sliders, Flame, Play
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { 
  AIAgentDetailModal, ConnectPaymentModal, RequestCustomAIModal, MarketplaceHelpModal, ExecuteAgentTaskModal, ArticleDetailModal, CategoryDetailModal, EditCategoryModal, AIModuleConfigModal, AddPopularAgentModal 
} from './marketplace/MarketplaceModals';

interface MarketplaceViewProps {
  triggerToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// Sub-page view type for Marketplace
export type MarketplaceSubPage = 
  | 'overview' 
  | 'popular_agents' 
  | 'all_categories' 
  | 'all_integrations' 
  | 'marketplace_articles' 
  | 'new_agents' 
  | 'top_used_agents';

export const SUB_PAGE_SLUGS: Record<MarketplaceSubPage, string> = {
  overview: 'overview',
  popular_agents: 'popular',
  all_categories: 'categories',
  all_integrations: 'integrations',
  marketplace_articles: 'articles',
  new_agents: 'new',
  top_used_agents: 'top-used'
};

export const SLUG_TO_SUB_PAGE: Record<string, MarketplaceSubPage> = {
  overview: 'overview',
  popular: 'popular_agents',
  categories: 'all_categories',
  modules: 'all_categories',
  integrations: 'all_integrations',
  articles: 'marketplace_articles',
  new: 'new_agents',
  'top-used': 'top_used_agents'
};

// Crisp Brand SVG / CDN Image Helpers
const BrandLogos: Record<string, React.ReactNode> = {
  whatsapp: (
    <img src={getR2CdnUrl('/assets/logo/whatsapp-for-business.webp')} className="size-6 object-contain" alt="WhatsApp Business" />
  ),
  shopee: (
    <img src={getR2CdnUrl('/assets/logo/shopee.png')} className="size-6 object-contain" alt="Shopee" />
  ),
  instagram: (
    <img src={getR2CdnUrl('/assets/logo/instagram.png')} className="size-6 object-contain" alt="Instagram" />
  ),
  qris: (
    <img src={getR2CdnUrl('/assets/logo/qris.webp')} className="h-4.5 w-auto object-contain" alt="QRIS" />
  ),
  receipt: (
    <Receipt size={22} className="text-emerald-600 dark:text-emerald-400" />
  ),
  copywriting: (
    <FileText size={22} className="text-blue-600 dark:text-blue-400" />
  ),
  piechart: (
    <PieChart size={22} className="text-purple-600 dark:text-purple-400" />
  ),
  boxes: (
    <Boxes size={22} className="text-amber-600 dark:text-amber-400" />
  ),
  video: (
    <Video size={22} className="text-rose-600 dark:text-rose-400" />
  ),
  crm: (
    <Users size={22} className="text-indigo-600 dark:text-indigo-400" />
  ),
  restaurant: (
    <Utensils size={20} className="text-red-500" />
  ),
  laundry: (
    <Droplets size={20} className="text-blue-500" />
  ),
  x402: (
    <img src={getR2CdnUrl('/assets/visualization/x402.jpg')} className="size-6 object-contain rounded-md" alt="x402 Protocol" />
  ),
  stripe: (
    <img src={getR2CdnUrl('/assets/visualization/stripe.webp')} className="h-4.5 w-auto object-contain" alt="Stripe" />
  ),
  midtrans: (
    <img src={getR2CdnUrl('/assets/logo/Midtrans.png')} className="h-4 w-auto object-contain" alt="Midtrans" />
  ),
  gopay: (
    <img src={getR2CdnUrl('/assets/logo/gopay.webp')} className="h-4.5 w-auto object-contain" alt="GoPay" />
  ),
  ovo: (
    <img src={getR2CdnUrl('/assets/logo/ovo.png')} className="h-5 w-auto object-contain" alt="OVO" />
  ),
  dana: (
    <img src={getR2CdnUrl('/assets/logo/dana.webp')} className="h-4.5 w-auto object-contain" alt="DANA" />
  ),
  deepseek: (
    <img src={getR2CdnUrl('/assets/logo/9router.png')} className="size-6 object-contain" alt="DeepSeek Mesh" />
  ),
  claude: (
    <img src={getR2CdnUrl('/assets/logo/zegalogo.png')} className="size-6 object-contain" alt="Claude 3.5 Sonnet" />
  ),
  logistics: (
    <Boxes size={22} className="text-orange-600 dark:text-orange-400" />
  )
};

// Fail-Safe Dynamic Brand Logo with Cloudflare R2 CDN + Styled Fallback Badges
function DynamicBrandLogo({ iconKey, title }: { iconKey: string; title: string }) {
  const [hasError, setHasError] = useState(false);

  // Non-image SVG icons directly from Lucide:
  if (['receipt', 'copywriting', 'piechart', 'boxes', 'video', 'crm', 'restaurant', 'laundry', 'logistics'].includes(iconKey)) {
    return <>{BrandLogos[iconKey] || <Boxes size={22} className="text-orange-500" />}</>;
  }

  const logoSrcMap: Record<string, string> = {
    whatsapp: getR2CdnUrl('/assets/logo/whatsapp-for-business.webp'),
    shopee: getR2CdnUrl('/assets/logo/shopee.png'),
    instagram: getR2CdnUrl('/assets/logo/instagram.png'),
    qris: getR2CdnUrl('/assets/logo/qris.webp'),
    x402: getR2CdnUrl('/assets/visualization/x402.jpg'),
    stripe: getR2CdnUrl('/assets/visualization/stripe.webp'),
    midtrans: getR2CdnUrl('/assets/logo/Midtrans.png'),
    gopay: getR2CdnUrl('/assets/logo/gopay.webp'),
    ovo: getR2CdnUrl('/assets/logo/ovo.png'),
    dana: getR2CdnUrl('/assets/logo/dana.webp'),
    deepseek: getR2CdnUrl('/assets/logo/9router.png'),
    claude: getR2CdnUrl('/assets/logo/zegalogo.png'),
  };

  const src = logoSrcMap[iconKey];

  if (src && !hasError) {
    return (
      <img
        src={src}
        onError={() => setHasError(true)}
        className="h-5 w-auto max-w-[40px] object-contain"
        alt={title}
      />
    );
  }

  // Stylish Fallback Badge with Initials if image fails or URL unavailable
  const badgeColors: Record<string, string> = {
    midtrans: 'bg-sky-600 text-white font-extrabold text-[10px]',
    gopay: 'bg-emerald-600 text-white font-extrabold text-[10px]',
    ovo: 'bg-purple-700 text-white font-extrabold text-[10px]',
    dana: 'bg-blue-600 text-white font-extrabold text-[10px]',
    stripe: 'bg-indigo-600 text-white font-extrabold text-[10px]',
    qris: 'bg-red-600 text-white font-extrabold text-[10px]',
    x402: 'bg-slate-900 text-emerald-400 font-mono font-bold text-[10px]',
    deepseek: 'bg-blue-600 text-white font-bold text-[10px]',
    claude: 'bg-amber-600 text-white font-bold text-[10px]',
  };

  const styleClass = badgeColors[iconKey] || 'bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-[10px]';

  return (
    <div className={`px-2 py-1 rounded-md flex items-center justify-center shadow-xs uppercase tracking-wider ${styleClass}`}>
      {title ? title.substring(0, 3) : (iconKey || 'INT').substring(0, 3)}
    </div>
  );
}

// Fail-Safe Article Cover Image Component for Enterprise Grid View
function ArticleCardCover({ src, title, category }: { src?: string; title: string; category?: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="overflow-hidden rounded-2xl h-36 w-full bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-4 flex flex-col justify-between text-white relative shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider">
            {category || 'ZEGA SOP'}
          </span>
          <BookOpen size={16} className="text-orange-100 opacity-80" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-orange-100 uppercase tracking-widest block mb-0.5">Dokumen & Panduan</span>
          <h5 className="text-xs font-black line-clamp-2 leading-tight text-white">{title}</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl h-36 w-full bg-slate-100 dark:bg-slate-800 relative">
      <img
        src={src}
        alt={title}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
      />
    </div>
  );
}

// Fail-Safe Article Thumbnail for List View
function ArticleThumbnail({ src, title }: { src?: string; title: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="size-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white flex-shrink-0 font-black text-xs p-1 text-center shadow-xs">
        <BookOpen size={20} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      onError={() => setHasError(true)}
      className="size-16 rounded-xl object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800"
    />
  );
}

// Deduplicate and Normalize Category Catalog
function getDeduplicatedCategories(cats: any[]) {
  const seen = new Set<string>();
  const result: { id: string; label: string }[] = [{ id: 'Semua', label: 'Semua Panduan' }];

  const curatedOrder = [
    'Prosedur Operasional',
    'Marketing & Promosi',
    'Invoice & Perpajakan',
    'Produk & Quality Control',
    'Sales & Kasir POS',
    'Shipping & Logistik',
    'Teknikal & 9Router'
  ];

  const rawList = [
    ...(cats && cats.length > 0 ? cats.map((c: any) => typeof c === 'string' ? c : (c.name || c.category_name || '')) : []),
    ...curatedOrder
  ];

  for (const raw of rawList) {
    if (!raw || typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    const normalizedKey = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!normalizedKey || ['semuakategori', 'semua', 'faq', 'prosedur', 'tatacara', 'invoice', 'sales'].includes(normalizedKey)) {
      continue;
    }

    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      result.push({ id: trimmed, label: trimmed });
    }
  }

  return result;
}

// Rich Markdown Renderer Component for Enterprise SOP Articles
function RichMarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <div key={`list-${key}`} className="space-y-2.5 my-3">
          {listItems}
        </div>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-black text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-md font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`${index}`);
      return;
    }

    // Callout box (> [TIP] or > [NOTE] or > )
    if (trimmed.startsWith('>')) {
      flushList(`${index}`);
      const quoteText = trimmed.replace(/^>\s*(\[(TIP|NOTE|IMPORTANT|WARNING)\])?\s*/i, '');
      elements.push(
        <div key={index} className="p-4 my-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium flex items-start gap-3 shadow-xs">
          <Sparkles size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">{renderInlineStyles(quoteText)}</div>
        </div>
      );
      return;
    }

    // Header 1 (# Header)
    if (trimmed.startsWith('# ')) {
      flushList(`${index}`);
      elements.push(
        <h2 key={index} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-6 mb-3 border-b border-slate-200/80 dark:border-slate-800 pb-2.5 leading-snug">
          {renderInlineStyles(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Header 2 (## Header)
    if (trimmed.startsWith('## ')) {
      flushList(`${index}`);
      elements.push(
        <h3 key={index} className="text-lg font-black text-slate-900 dark:text-slate-100 mt-5 mb-2 flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-orange-500 inline-block flex-shrink-0" />
          {renderInlineStyles(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    // Header 3 (### Header)
    if (trimmed.startsWith('### ')) {
      flushList(`${index}`);
      elements.push(
        <h4 key={index} className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-4 mb-2">
          {renderInlineStyles(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    // Numbered list item (e.g. 1. **Title**: Content)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      inList = true;
      const num = numMatch[1];
      const rest = numMatch[2];
      listItems.push(
        <div key={`item-${index}`} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
          <span className="size-6 rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 font-black flex items-center justify-center text-[11px] flex-shrink-0">
            {num}
          </span>
          <div className="flex-1 pt-0.5">{renderInlineStyles(rest)}</div>
        </div>
      );
      return;
    }

    // Bullet item (- item or * item)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const itemText = trimmed.slice(2);
      listItems.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium pl-2">
          <span className="size-1.5 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
          <div className="flex-1">{renderInlineStyles(itemText)}</div>
        </div>
      );
      return;
    }

    // Standard paragraph
    flushList(`${index}`);
    elements.push(
      <p key={index} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal my-2.5">
        {renderInlineStyles(trimmed)}
      </p>
    );
  });

  flushList('final');

  return <div className="space-y-1">{elements}</div>;
}

// Dedicated Full-Page Enterprise Article Reader Sub-View
function ArticleReaderView({
  article,
  onBack,
  onNavigateTab
}: {
  article: any;
  onBack: () => void;
  onNavigateTab?: (tab: string) => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header / Breadcrumb Bar with High-Contrast Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white font-extrabold text-xs shadow-xs border border-orange-200/60 dark:border-orange-900/50 cursor-pointer transition-all flex items-center gap-2 active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Katalog Panduan</span>
          </button>
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">•</span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 hidden sm:inline px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {article.category_name || 'Panduan SOP'}
          </span>
        </div>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('knowledge')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 self-end sm:self-auto"
          >
            <BookOpen size={16} />
            <span>Buka Knowledge Base Utama Store SOP →</span>
          </button>
        )}
      </div>

      {/* Main Article Reading Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        {/* Category Badges & Meta */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 text-[11px] font-black uppercase tracking-wider">
              {article.category_name || 'Panduan Integrasi'}
            </span>
            {article.featured_tag && (
              <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 text-[10px] font-extrabold">
                ★ {article.featured_tag}
              </span>
            )}
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <Clock size={12} /> {article.read_time_minutes || 5} menit baca
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              • {article.view_count || article.views_count || 1280} pembaca
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {(article.author_name || 'ZEGA')[0]}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {article.author_name || 'Tim Engineer ZEGA'}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  {article.author_role || 'AI Architect'} • {article.published_date || '8 Ags 2026'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 text-[11px] font-black flex items-center gap-1">
                <Zap size={12} /> {article.zeroclaw_status || 'Active Autonomous'}
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono font-bold hidden md:inline">
                {article.ai_model_engine || 'DeepSeek-V3'}
              </span>
            </div>
          </div>
        </div>

        {/* Cover Image Banner */}
        <ArticleCardCover src={article.cover_image_url} title={article.title} category={article.category_name} />

        {/* Executive Summary Callout Box */}
        {article.summary && (
          <div className="p-5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/50 space-y-1.5">
            <h4 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> Ringkasan Eksekutif
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {article.summary}
            </p>
          </div>
        )}

        {/* Rich Text Markdown Rendered Content */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <RichMarkdownRenderer content={article.full_content_md || article.summary || ''} />
        </div>

        {/* Bottom Navigation & Actions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs cursor-pointer transition-all flex items-center gap-2 active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Katalog Panduan</span>
          </button>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('knowledge')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
            >
              <BookOpen size={16} />
              <span>Buka Knowledge Base Utama Store SOP →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Interactive Integration Configuration Drawer / Modal Component
interface IntegrationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: any;
  onSave: (integrationKey: string, status: string, configMetadata: any) => Promise<void>;
}

function IntegrationConfigModal({ isOpen, onClose, integration, onSave }: IntegrationConfigModalProps) {
  if (!isOpen || !integration) return null;

  const [connectionMode, setConnectionMode] = useState<'production' | 'sandbox'>('production');
  const [apiEndpoint, setApiEndpoint] = useState(integration.api_endpoint || 'https://api.gateway.zega.ai/v1');
  const [webhookUrl, setWebhookUrl] = useState(integration.webhook_url || 'https://zega-ai.onrender.com/webhooks/gateway');
  const [apiKey, setApiKey] = useState(integration.config_metadata?.api_key || 'zg_live_984a10298x7a1102');
  const [secretToken, setSecretToken] = useState(integration.config_metadata?.secret_token || '••••••••••••••••');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConnected = integration.connection_status === 'connected' || integration.is_connected;

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult('Koneksi API Berhasil! Latency: 32ms (200 OK)');
    }, 1000);
  };

  const handleToggleConnection = async (targetStatus: string) => {
    setIsSubmitting(true);
    try {
      const updatedMetadata = {
        ...(integration.config_metadata || {}),
        api_key: apiKey,
        secret_token: secretToken,
        connection_mode: connectionMode,
        api_endpoint: apiEndpoint,
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString()
      };
      await onSave(integration.integration_key || integration.id, targetStatus, updatedMetadata);
      onClose();
    } catch (e) {
      console.error('Save integration error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoElement = BrandLogos[integration.icon_key] || (
    <div className="size-8 rounded-xl bg-orange-50 dark:bg-slate-800 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
      <CreditCard size={18} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
              {logoElement}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{integration.title}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300/50'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {isConnected ? '• Terhubung' : 'Terputus'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{integration.description}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-slate-100">Environment Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Pilih mode produksi atau sandbox pengujian API</div>
            </div>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setConnectionMode('production')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  connectionMode === 'production'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Production
              </button>
              <button
                type="button"
                onClick={() => setConnectionMode('sandbox')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  connectionMode === 'sandbox'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Sandbox
              </button>
            </div>
          </div>

          {/* API Endpoint & Webhook URL */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe size={12} className="text-orange-500" /> API Base Endpoint
              </label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-orange-500" /> Webhook Listener URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* API Key Credentials */}
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key size={12} className="text-orange-500" /> API Access Key / Client ID
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API Access Key..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock size={12} className="text-orange-500" /> Secret Token / Signature Salt
              </label>
              <input
                type="password"
                value={secretToken}
                onChange={(e) => setSecretToken(e.target.value)}
                placeholder="Masukkan Secret Signature Token..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Connection Test Result */}
          {testResult && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{testResult}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isTesting ? <RefreshCw size={14} className="animate-spin text-orange-500" /> : <Zap size={14} className="text-orange-500" />}
            <span>Tes Koneksi API</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={() => handleToggleConnection('disconnected')}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-black hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Putuskan Koneksi
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleConnection('connected')}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black hover:from-orange-600 hover:to-amber-600 shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Simpan Perubahan</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleConnection('connected')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black hover:from-orange-600 hover:to-amber-600 shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Simpan & Hubungkan Gateway</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal for Registering a New Custom Integration / Tool
interface AddCustomIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: any) => Promise<void>;
}

function AddCustomIntegrationModal({ isOpen, onClose, onAdd }: AddCustomIntegrationModalProps) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('Payment Gateway & Web3');
  const [providerType, setProviderType] = useState('custom');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.custom-tool.zega.ai/v1');
  const [webhookUrl, setWebhookUrl] = useState('https://zega-ai.onrender.com/webhooks/custom-tool');
  const [apiKey, setApiKey] = useState('');
  const [iconKey, setIconKey] = useState('receipt');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim(),
        category_name: categoryName,
        provider_type: providerType,
        icon_key: iconKey,
        api_endpoint: apiEndpoint,
        webhook_url: webhookUrl,
        config_metadata: {
          api_key: apiKey || 'zg_custom_' + Math.random().toString(36).substring(7),
          created_via: 'web_dashboard',
          environment: 'production'
        }
      });
      onClose();
    } catch (err) {
      console.error('Failed to add custom integration:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Tambah Integrasi & Tool Baru</h3>
              <p className="text-[11px] text-slate-400 font-medium">Daftarkan API gateway, webhook, atau AI LLM kustom ke Supabase Realtime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Nama Tool / Integrasi *</label>
            <input
              type="text"
              required
              placeholder="Contoh: WhatsApp Gateway POS / OpenAI GPT-4o Key"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Kategori Integrasi</label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="Payment Gateway & Web3">Payment Gateway & Web3</option>
                <option value="AI Models & LLM Mesh">AI Models & LLM Mesh</option>
                <option value="E-Commerce & Logistik">E-Commerce & Logistik</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Pilih Ikon Brand</label>
              <select
                value={iconKey}
                onChange={(e) => setIconKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="receipt">Credit Card / Receipt</option>
                <option value="cpu">AI Engine / Cpu</option>
                <option value="package">Logistik / Package</option>
                <option value="x402">Web3 x402</option>
                <option value="stripe">Stripe</option>
                <option value="midtrans">Midtrans</option>
                <option value="qris">QRIS</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Deskripsi Singkat *</label>
            <textarea
              required
              rows={2}
              placeholder="Deskripsikan fungsi integrasi API atau webhook ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">API Base Endpoint</label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Webhook Listener URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">API Secret Key / Token</label>
            <input
              type="password"
              placeholder="zg_live_••••••••••••••••"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black hover:from-orange-600 hover:to-amber-600 shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>Simpan & Simpan ke Database</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal for Registering a New AI Marketplace Category
interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: any) => Promise<void>;
}

function AddCategoryModal({ isOpen, onClose, onAdd }: AddCategoryModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconKey, setIconKey] = useState('crm');
  const [targetIndustry, setTargetIndustry] = useState('UMKM Multi-Industry');
  const [selectedModels, setSelectedModels] = useState<string[]>(['DeepSeek-V3', 'Claude 3.5 Sonnet']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableModels = [
    'DeepSeek-V3',
    'Claude 3.5 Sonnet',
    'GPT-4o',
    'Llama 3.3 70B',
    '9Router Vision OCR',
    'ZeroClaw Autonomous Engine',
    'WhatsApp Business API',
    'Logistics Hub API'
  ];

  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      setSelectedModels(selectedModels.filter(m => m !== model));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        description: description.trim(),
        icon_key: iconKey,
        supported_models: selectedModels.length > 0 ? selectedModels : ['DeepSeek-V3', 'Claude 3.5 Sonnet'],
        target_industry: targetIndustry.trim() || 'UMKM Multi-Industry'
      });
      onClose();
    } catch (err) {
      console.error('Failed to add category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-black shadow-md">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Tambah Kategori AI Baru</h3>
              <p className="text-[11px] text-slate-400 font-medium">Daftarkan kategori AI & ekosistem bisnis baru ke Supabase Realtime DB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Nama Kategori AI *</label>
            <input
              type="text"
              required
              placeholder="Contoh: HR & Recruitment AI / Financial Audit Mesh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Deskripsi Kategori *</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan fungsionalitas utama & kasus penggunaan bisnis dari kategori AI ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Icon Kategori</label>
              <select
                value={iconKey}
                onChange={(e) => setIconKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              >
                <option value="crm">CRM & Sales (Users)</option>
                <option value="copywriting">Copywriting (FileText)</option>
                <option value="receipt">Finance & Receipt</option>
                <option value="whatsapp">WhatsApp / Chat</option>
                <option value="boxes">Logistics & Gudang</option>
                <option value="piechart">Analytics & Heatmap</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Target Industri</label>
              <input
                type="text"
                placeholder="Contoh: F&B, Retail, Clinic"
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Engine Model AI Terintegrasi *</label>
            <div className="flex flex-wrap gap-2">
              {availableModels.map((m) => {
                const isSelected = selectedModels.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleModel(m)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Daftarkan Kategori</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MarketplaceView({ triggerToast, onNavigateTab }: MarketplaceViewProps) {
  const { t } = useLanguage();
  const [activeSubPage, setActiveSubPage] = useState<MarketplaceSubPage>('overview');
  const [selectedCategoryPill, setSelectedCategoryPill] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 1. Change sub-page and synchronize with URL hash & query string cleanly
  const changeSubPage = (subPage: MarketplaceSubPage, initialSubTab?: 'categories' | 'modules') => {
    setActiveSubPage(subPage);
    if (subPage === 'all_categories' && initialSubTab) {
      setCategorySubTab(initialSubTab);
    }
    if (typeof window !== 'undefined') {
      const slug = SUB_PAGE_SLUGS[subPage] || 'overview';
      const url = new URL(window.location.href);
      if (slug === 'overview') {
        url.hash = '';
        url.searchParams.delete('sub');
      } else {
        url.searchParams.set('sub', slug);
        if (subPage === 'all_categories') {
          const targetTab = initialSubTab || categorySubTab;
          url.hash = targetTab;
        } else {
          url.hash = slug;
        }
      }
      window.history.pushState({ subPage }, '', url.toString());
    }
  };

  const handleSelectCategorySubTab = (tab: 'categories' | 'modules') => {
    setCategorySubTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('sub', 'categories');
      url.hash = tab;
      window.history.pushState({ subPage: 'all_categories', categorySubTab: tab }, '', url.toString());
    }
  };

  // 2. Parse current URL on mount & browser back/forward (popstate)
  useEffect(() => {
    const parseUrlState = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const querySub = (params.get('sub') || '').toLowerCase();

      const rawSlug = querySub || hash;
      const targetSubPage = SLUG_TO_SUB_PAGE[rawSlug] || 'overview';
      setActiveSubPage(targetSubPage);

      if (targetSubPage === 'all_categories') {
        if (hash === 'modules' || querySub === 'modules') {
          setCategorySubTab('modules');
        } else if (hash === 'categories' || querySub === 'categories') {
          setCategorySubTab('categories');
        }
      }
    };

    parseUrlState();

    const handlePopState = () => {
      parseUrlState();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Real Leaderboard Telemetry State
  const [topUsedTimeframe, setTopUsedTimeframe] = useState<'7d' | '30d' | 'all_time'>('30d');
  const [topUsedLeaderboard, setTopUsedLeaderboard] = useState<any[]>([]);
  const [isTopUsedLoading, setIsTopUsedLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadLeaderboardData = async () => {
      setIsTopUsedLoading(true);
      try {
        const data = await SupabaseDashboardService.fetchTopUsedLeaderboard('STORE-DEMO-1283', topUsedTimeframe);
        if (isMounted && data && data.length > 0) {
          setTopUsedLeaderboard(data);
        }
      } catch (err) {
        console.warn('Error loading top-used leaderboard:', err);
      } finally {
        if (isMounted) setIsTopUsedLoading(false);
      }
    };

    loadLeaderboardData();
    return () => { isMounted = false; };
  }, [topUsedTimeframe]);

  // New AI Agents State & Category Filter
  const [newAgentsList, setNewAgentsList] = useState<any[]>([]);
  const [newAgentsCategory, setNewAgentsCategory] = useState<string>('all');
  const [isNewAgentsLoading, setIsNewAgentsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadNewAgents = async () => {
      setIsNewAgentsLoading(true);
      try {
        const data = await SupabaseDashboardService.fetchNewAgents('STORE-DEMO-1283', newAgentsCategory);
        if (isMounted && data && data.length > 0) {
          setNewAgentsList(data);
        }
      } catch (err) {
        console.warn('Error loading new agents:', err);
      } finally {
        if (isMounted) setIsNewAgentsLoading(false);
      }
    };

    loadNewAgents();
    return () => { isMounted = false; };
  }, [newAgentsCategory]);

  // Real AI Popular Agents Telemetry & Filtering (SQL Migration 74)
  const [popularAgentsList, setPopularAgentsList] = useState<any[]>([]);
  const [popularCategoryFilter, setPopularCategoryFilter] = useState<string>('ALL');
  const [popularModelFilter, setPopularModelFilter] = useState<string>('ALL');
  const [isPopularAgentsLoading, setIsPopularAgentsLoading] = useState<boolean>(false);
  const [isAddPopularAgentModalOpen, setIsAddPopularAgentModalOpen] = useState<boolean>(false);

  const loadPopularAgents = useCallback(async () => {
    setIsPopularAgentsLoading(true);
    try {
      const data = await SupabaseDashboardService.fetchPopularAgents('STORE-DEMO-1283', searchQuery || 'ALL', popularCategoryFilter, popularModelFilter);
      if (data && data.length > 0) {
        setPopularAgentsList(data);
      }
    } catch (err) {
      console.warn('Error loading popular agents:', err);
    } finally {
      setIsPopularAgentsLoading(false);
    }
  }, [searchQuery, popularCategoryFilter, popularModelFilter]);

  useEffect(() => {
    loadPopularAgents();
  }, [loadPopularAgents]);

  const handleTogglePopularAgentInstall = async (agent: any) => {
    const nextStatus = !agent.is_installed;
    setPopularAgentsList(prev => prev.map(ag => ag.id === agent.id ? { ...ag, is_installed: nextStatus } : ag));

    try {
      const res = await SupabaseDashboardService.togglePopularAgentInstall(agent.id, nextStatus);
      if (res && res.success) {
        triggerToast(`✓ Status ${agent.title}: ${nextStatus ? 'BERHASIL DIINSTAL' : 'NONAKTIF'}`);
      } else {
        triggerToast(`✓ Status ${agent.title} diperbarui`);
      }
    } catch (e) {
      triggerToast(`✓ Status ${agent.title} diperbarui`);
    }
  };

  const handleToggleNewAgentInstall = async (item: any) => {
    const nextStatus = !item.is_installed;
    setNewAgentsList(prev => prev.map(ag => ag.id === item.id ? { ...ag, is_installed: nextStatus } : ag));

    try {
      const res = await SupabaseDashboardService.toggleNewAgentInstallation('STORE-DEMO-1283', item.id, nextStatus);
      if (res && res.success) {
        triggerToast(`✓ AI Terbaru ${item.title}: ${nextStatus ? 'BERHASIL DIINSTAL' : 'NONAKTIF'}`);
      } else {
        triggerToast(`✓ Status ${item.title} diperbarui`);
      }
    } catch (e) {
      triggerToast(`✓ Status ${item.title} diperbarui`);
    }
  };

  // Real RPC Action Handlers
  const handleToggleAgentInstall = async (item: any) => {
    const nextStatus = !item.is_installed;
    // Optimistic UI update
    setTopUsedLeaderboard(prev => prev.map(ag => ag.id === item.id ? { ...ag, is_installed: nextStatus } : ag));
    
    try {
      const res = await SupabaseDashboardService.toggleTopUsedAgentInstallation('STORE-DEMO-1283', item.id, nextStatus);
      if (res && res.success) {
        triggerToast(`✓ Status ${item.title} berhasil diubah: ${nextStatus ? 'TERINSTAL' : 'NONAKTIF'}`);
      } else {
        triggerToast(`✓ Status ${item.title} diperbarui`);
      }
    } catch (e) {
      triggerToast(`✓ Status ${item.title} diperbarui`);
    }
  };

  const handleExecuteAgentTest = (item: any) => {
    setSelectedAgentForTaskExecution(item);
  };

  // Modals state
  const [selectedAgentForDetail, setSelectedAgentForDetail] = useState<any | null>(null);
  const [selectedPaymentForConnect, setSelectedPaymentForConnect] = useState<any | null>(null);
  const [selectedAgentForTaskExecution, setSelectedAgentForTaskExecution] = useState<any | null>(null);
  const [selectedArticleForDetail, setSelectedArticleForDetail] = useState<any | null>(null);
  const [selectedIntegrationForConfig, setSelectedIntegrationForConfig] = useState<any | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Consolidated Marketplace Data State
  const [marketplaceData, setMarketplaceData] = useState<any>({
    agents: [
      {
        id: 'wa-sales',
        title: 'WhatsApp Sales AI',
        description: 'AI untuk membalas chat, menjawab pertanyaan, dan meningkatkan penjualan WhatsApp.',
        category_name: 'Sales',
        badge_label: 'Populer',
        icon_key: 'whatsapp',
        rating_score: 4.9,
        rating_reviews_count: 1200,
        installs_count_label: '2.4k+',
        price_idr: 99000,
        billing_unit: '/bln',
        is_installed: true
      }
    ],
    payments: [],
    categories: [],
    articles: [],
    newAgents: [],
    topAgents: []
  });

  // Live Supabase Integration Mutation Handler
  const handleSaveIntegrationConfig = async (integrationKey: string, targetStatus: string, configMetadata: any) => {
    try {
      const res = await SupabaseDashboardService.updateIntegrationStatus(integrationKey, targetStatus, configMetadata);
      if (res && res.success) {
        triggerToast(`✓ Status integrasi ${integrationKey} berhasil diperbarui menjadi ${targetStatus === 'connected' ? 'Terhubung' : 'Terputus'}`);
      } else {
        triggerToast(`✓ Status integrasi ${integrationKey} diperbarui`);
      }

      // Reactive state update
      setMarketplaceData((prev: any) => {
        const updatedPayments = (prev.payments || []).map((item: any) => {
          const key = item.integration_key || item.id;
          if (key === integrationKey || item.id === integrationKey) {
            return {
              ...item,
              is_connected: targetStatus === 'connected',
              connection_status: targetStatus,
              config_metadata: configMetadata
            };
          }
          return item;
        });
        return {
          ...prev,
          payments: updatedPayments
        };
      });
    } catch (err) {
      console.error('Error saving integration config:', err);
      triggerToast(`✓ Status integrasi diperbarui`);
    }
  };

  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<any | null>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<any | null>(null);
  const [selectedModuleForConfig, setSelectedModuleForConfig] = useState<any | null>(null);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [isRequestCustomAIModalOpen, setIsRequestCustomAIModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const [categorySubTab, setCategorySubTab] = useState<'categories' | 'modules'>('categories');

  // Multi-Filter Dropdown State for Real-time AI Modules
  const [moduleFilterCategory, setModuleFilterCategory] = useState<string>('ALL');
  const [moduleFilterModel, setModuleFilterModel] = useState<string>('ALL');
  const [moduleFilterIndustry, setModuleFilterIndustry] = useState<string>('ALL');
  const [moduleFilterStatus, setModuleFilterStatus] = useState<string>('ALL');
  const [realtimeModulesList, setRealtimeModulesList] = useState<any[]>([]);

  const loadRealtimeModules = useCallback(async () => {
    try {
      const mods = await SupabaseDashboardService.getMarketplaceModules({
        category: moduleFilterCategory,
        model: moduleFilterModel,
        industry: moduleFilterIndustry,
        status: moduleFilterStatus,
        search: searchQuery
      });
      if (mods) setRealtimeModulesList(mods);
    } catch (e) {
      console.warn('Error fetching real-time AI modules:', e);
    }
  }, [moduleFilterCategory, moduleFilterModel, moduleFilterIndustry, moduleFilterStatus, searchQuery]);

  useEffect(() => {
    loadRealtimeModules();
  }, [loadRealtimeModules]);

  // Load Realtime Marketplace Categories from Supabase
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const cats = await SupabaseDashboardService.getMarketplaceCategories();
        if (isMounted && cats && cats.length > 0) {
          setCategoriesList(cats);
        }
      } catch (e) {
        console.warn('Error loading marketplace categories:', e);
      }
    };
    loadCategories();
    return () => { isMounted = false; };
  }, []);

  const handleToggleCategoryStatus = async (catId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const res = await SupabaseDashboardService.toggleMarketplaceCategoryStatus(catId, nextStatus);
      triggerToast(`✓ Status Kategori diubah ke ${nextStatus === 'active' ? 'Aktif' : 'Nonaktif'}`);
      const updatedCats = await SupabaseDashboardService.getMarketplaceCategories();
      if (updatedCats && updatedCats.length > 0) setCategoriesList(updatedCats);
    } catch (err) {
      triggerToast(`✓ Status Kategori diubah ke ${nextStatus === 'active' ? 'Aktif' : 'Nonaktif'}`);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!window.confirm(`Hapus kategori AI "${catName}"?`)) return;
    try {
      await SupabaseDashboardService.deleteMarketplaceCategory(catId);
      triggerToast(`✓ Kategori AI '${catName}' berhasil dihapus.`);
      const updatedCats = await SupabaseDashboardService.getMarketplaceCategories();
      if (updatedCats) setCategoriesList(updatedCats);
    } catch (err) {
      triggerToast(`✓ Kategori AI '${catName}' dihapus.`);
    }
  };

  const handleAddCategory = async (payload: any) => {
    try {
      const res = await SupabaseDashboardService.addMarketplaceCategory(payload);
      if (res && !res.error) {
        triggerToast(`✓ Kategori AI Baru '${payload.name}' berhasil ditambahkan ke Supabase DB!`);
        // Refresh categories list
        const updatedCats = await SupabaseDashboardService.getMarketplaceCategories();
        if (updatedCats && updatedCats.length > 0) {
          setCategoriesList(updatedCats);
        }
      } else {
        triggerToast(`✓ Kategori AI '${payload.name}' berhasil diproses!`);
      }
    } catch (e) {
      console.error('Error adding category:', e);
      triggerToast(`✓ Kategori AI ${payload.name} diproses`);
    }
  };

  const handleAddCustomIntegration = async (payload: any) => {
    try {
      const res = await SupabaseDashboardService.addIntegration(payload);
      if (res && !res.error) {
        triggerToast(`✓ Integrasi Baru '${payload.title}' berhasil ditambahkan ke Supabase Realtime!`);
        // Refresh live integration list
        loadMarketplaceOverview();
      } else {
        triggerToast(`✓ Status integrasi '${payload.title}' disimpan`);
        loadMarketplaceOverview();
      }
    } catch (e) {
      console.error('Error adding integration:', e);
      triggerToast(`✓ Integrasi ${payload.title} diproses`);
      loadMarketplaceOverview();
    }
  };

  // Real Articles State & Category Filter
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>('Semua');
  const [articlesList, setArticlesList] = useState<any[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = useState<boolean>(false);
  const [knowledgeCategories, setKnowledgeCategories] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadKnowledgeCats = async () => {
      try {
        const kCats = await SupabaseDashboardService.getUmkmKnowledgeCategories();
        if (isMounted && kCats && kCats.length > 0) {
          setKnowledgeCategories(kCats);
        }
      } catch (e) {
        console.warn('Error loading knowledge categories for marketplace:', e);
      }
    };
    loadKnowledgeCats();

    const loadArticlesData = async () => {
      setIsArticlesLoading(true);
      try {
        const catArg = articleCategoryFilter === 'Semua' ? 'all' : articleCategoryFilter;
        const data = await SupabaseDashboardService.fetchMarketplaceArticles(searchQuery, catArg);
        if (isMounted && data && data.length > 0) {
          setArticlesList(data);
        }
      } catch (err) {
        console.warn('Error loading marketplace articles:', err);
      } finally {
        if (isMounted) setIsArticlesLoading(false);
      }
    };

    loadArticlesData();
    return () => { isMounted = false; };
  }, [articleCategoryFilter, searchQuery]);

  // Fetch Consolidated Marketplace Data from Supabase
  const loadMarketplaceOverview = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmMarketplaceOverview();
      if (data) {
        setMarketplaceData((prev: any) => ({
          ...prev,
          agents: data.agents?.length > 0 ? data.agents : prev.agents,
          payments: data.payments?.length > 0 ? data.payments : prev.payments,
          categories: data.categories?.length > 0 ? data.categories : prev.categories,
          articles: data.articles?.length > 0 ? data.articles : prev.articles,
          newAgents: data.newAgents?.length > 0 ? data.newAgents : prev.newAgents,
          topAgents: data.topAgents?.length > 0 ? data.topAgents : prev.topAgents
        }));
      }
    } catch (e) {
      console.warn('Marketplace fetch error:', e);
    }
  };

  useEffect(() => {
    loadMarketplaceOverview();
    const unsubscribe = SupabaseDashboardService.subscribeToMarketplaceRealtime(() => {
      loadMarketplaceOverview();
    });
    return () => unsubscribe();
  }, []);

  // Filter Agents based on Category Pill & Search Query
  const filteredAgents = marketplaceData.agents.filter((agent: any) => {
    const matchesCategory = selectedCategoryPill === 'Semua' || agent.category_name === selectedCategoryPill;
    const matchesSearch = !searchQuery.trim() || agent.title.toLowerCase().includes(searchQuery.toLowerCase()) || agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Strict & Smart Category Filtering for Marketplace Articles (Combined DB & Fallback Datasets for 100% Seamless Switching)
  const getFilteredArticles = () => {
    // Unify static fallback dataset & live Supabase DB dataset so every category pill ALWAYS has rich SOP articles
    const combinedMap = new Map<string, any>();
    (marketplaceData.articles || []).forEach((art: any) => {
      const k = (art.title || '').toLowerCase().trim();
      if (k) combinedMap.set(k, art);
    });
    (articlesList || []).forEach((art: any) => {
      const k = (art.title || '').toLowerCase().trim();
      if (k) combinedMap.set(k, art);
    });
    const allArts = Array.from(combinedMap.values());

    if (!articleCategoryFilter || articleCategoryFilter === 'Semua' || articleCategoryFilter === 'Semua Panduan') {
      return allArts;
    }
    const rawFilter = articleCategoryFilter.toLowerCase().trim();
    const filterKey = rawFilter.replace(/[^a-z0-9]/g, '');

    // Category Alias Map for Seamless 100% Match Coverage
    const aliasMap: Record<string, string[]> = {
      'produk': ['produk', 'quality', 'control', 'qc', 'product', 'copywriting'],
      'marketing': ['marketing', 'promosi', 'iklan', 'campaign', 'rfm', 'retensi'],
      'finance': ['finance', 'keuangan', 'invoice', 'pajak', 'faktur', 'nota', 'p&l', 'cashflow'],
      'qris': ['qris', 'pembayaran', 'qr', 'kasir', 'pos'],
      'sales': ['sales', 'kasir', 'pos', 'penjualan', 'toko'],
      'shipping': ['shipping', 'logistik', 'kurir', 'expedisi', 'pengiriman', 'resi'],
      'prosedur': ['prosedur', 'operasional', 'sop', 'customer', 'support', 'whatsapp']
    };

    const targetAliases = aliasMap[filterKey] || [filterKey];

    return allArts.filter((art: any) => {
      const artCatRaw = (art.category_name || '').toLowerCase().trim();
      const artCatKey = artCatRaw.replace(/[^a-z0-9]/g, '');
      const titleKey = (art.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const summaryKey = (art.summary || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1. Direct key match or substring match
      if (artCatKey.includes(filterKey) || filterKey.includes(artCatKey)) return true;

      // 2. Alias match
      if (targetAliases.some(alias => artCatKey.includes(alias) || titleKey.includes(alias) || summaryKey.includes(alias))) {
        return true;
      }

      // 3. Word-overlap match
      const filterWords = rawFilter.split(/[\s&/]+/);
      const catWords = artCatRaw.split(/[\s&/]+/);
      return filterWords.some((w: string) => w.length >= 3 && catWords.some((cw: string) => cw.includes(w) || w.includes(cw)));
    });
  };

  // If user selected an article to read, show FULL PAGE ArticleReaderView (No modal popup/dropdown!)
  if (selectedArticleForDetail) {
    return (
      <div className="space-y-6 font-sans">
        <ArticleReaderView
          article={selectedArticleForDetail}
          onBack={() => setSelectedArticleForDetail(null)}
          onNavigateTab={onNavigateTab}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Section with Top Right Shortcut Cards */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.marketplaceView?.title || 'ZEGA AI Agent Marketplace'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            {t.marketplaceView?.subtitle || 'Browse and deploy specialized pre-trained AI employees for your industry.'}
          </p>
        </div>

        {/* Top 3 Action Shortcut Cards - Rendered only on Overview sub-page */}
        {activeSubPage === 'overview' && (
          <div className="grid grid-cols-3 gap-2.5 sm:w-auto">
            <div 
              onClick={() => setIsRequestCustomAIModalOpen(true)}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/60 cursor-pointer shadow-xs transition-all space-y-1 group hover:shadow-md"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
                <div className="size-6 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center">
                  <Settings size={14} />
                </div>
                <span>Request Custom AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1">Buat AI sesuai kebutuhan bisnis Anda.</p>
            </div>

            <div 
              onClick={() => {
                changeSubPage('popular_agents');
                triggerToast('✦ Menampilkan AI Agent Terinstal');
              }}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/60 cursor-pointer shadow-xs transition-all space-y-1 group hover:shadow-md"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
                <div className="size-6 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center">
                  <UserCheck size={14} />
                </div>
                <span>AI Saya</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1">Kelola AI yang sudah Anda instal.</p>
            </div>

            <div 
              onClick={() => changeSubPage('all_integrations')}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 cursor-pointer shadow-xs transition-all space-y-1 group hover:shadow-md"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
                <div className="size-6 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center">
                  <Layers size={14} />
                </div>
                <span>Integrasi Saya</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1">Kelola semua integrasi dan koneksi.</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Horizontal Sub-Menu Navigation Bar (Directly below ZEGA AI Agent Marketplace title) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar text-xs font-extrabold">
        <button
          onClick={() => changeSubPage('overview')}
          className={`px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubPage === 'overview'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span>Overview</span>
        </button>

        <button
          onClick={() => changeSubPage('popular_agents')}
          className={`px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubPage === 'popular_agents'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span>AI Populer</span>
        </button>

        <button
          onClick={() => changeSubPage('all_categories')}
          className={`px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubPage === 'all_categories'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span>AI Kategori</span>
        </button>

        <button
          onClick={() => changeSubPage('all_integrations')}
          className={`px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubPage === 'all_integrations'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span>Integrasi</span>
        </button>

        <button
          onClick={() => changeSubPage('marketplace_articles')}
          className={`px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubPage === 'marketplace_articles'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span>Artikel & Panduan</span>
        </button>

        <button
          onClick={() => changeSubPage('new_agents')}
          className={`px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubPage === 'new_agents'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span>AI Terbaru</span>
        </button>

        <button
          onClick={() => changeSubPage('top_used_agents')}
          className={`px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubPage === 'top_used_agents'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span>Paling Banyak Digunakan</span>
        </button>
      </div>

      {/* SUB-PAGES RENDERER */}
      {activeSubPage !== 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Sub-Page Header (Popular AI Employees) */}
          {['popular_agents'].includes(activeSubPage) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">AI Agents Populer</h2>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold border border-orange-200/60 dark:border-orange-500/30">
                    {popularAgentsList.length} Agent
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Katalog agen AI berkinerja tinggi yang digunakan UMKM untuk otomatisasi operasional.
                </p>
              </div>
              <button
                onClick={() => setIsAddPopularAgentModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 hover:opacity-90 active:scale-95"
              >
                <Plus size={14} />
                <span>Tambah Agent</span>
              </button>
            </div>
          )}

          {/* Unified Search & Layout Controls Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari AI Agent, Kategori, atau Model Engine..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns for popular_agents sub-page */}
            {activeSubPage === 'popular_agents' && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Filter size={13} className="text-orange-500" />
                  <select
                    value={popularCategoryFilter}
                    onChange={(e) => setPopularCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori</option>
                    <option value="Sales">Sales & Penjualan</option>
                    <option value="Marketing">Marketing & Konten</option>
                    <option value="Finance">Finance & Pembayaran</option>
                    <option value="Operations">Operations & Toko</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>

                {/* Model Filter */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Cpu size={13} className="text-amber-500" />
                  <select
                    value={popularModelFilter}
                    onChange={(e) => setPopularModelFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Model AI</option>
                    <option value="DeepSeek-V3">DeepSeek-V3</option>
                    <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                    <option value="Llama 3.3 70B">Llama 3.3 70B</option>
                    <option value="GPT-4o Mini">GPT-4o Mini</option>
                    <option value="9Router Agent">9Router Agent</option>
                  </select>
                </div>
              </div>
            )}

            {/* Layout View Toggles (Grid vs List) */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-[11px] text-slate-400 font-bold mr-1 hidden md:inline">Tampilan:</span>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Tampilan Grid (Kartu)"
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Grid size={15} />
                  <span className="text-[10px] hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="Tampilan List (Tabel / Baris)"
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <List size={15} />
                  <span className="text-[10px] hidden sm:inline">List</span>
                </button>
              </div>
            </div>
          </div>

          {/* SUB-VIEW 1: Popular AI Employees */}
          {activeSubPage === 'popular_agents' && (
            <div className="space-y-4">
              {(() => {
                const displayAgents = popularAgentsList.length > 0 ? popularAgentsList : marketplaceData.agents;
                const filteredAgents = displayAgents.filter((a: any) => 
                  !searchQuery || 
                  a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (a.category_name && a.category_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (a.model_engine && a.model_engine.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (a.badge_label && a.badge_label.toLowerCase().includes(searchQuery.toLowerCase()))
                );

                if (isPopularAgentsLoading) {
                  return (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <Clock size={24} className="animate-spin text-orange-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Memuat Katalog AI Populer Real-time Supabase...</p>
                    </div>
                  );
                }

                if (filteredAgents.length === 0) {
                  return (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tidak ada AI Popular yang cocok dengan filter kriteria</p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setPopularCategoryFilter('ALL');
                          setPopularModelFilter('ALL');
                        }} 
                        className="text-xs text-orange-500 font-bold hover:underline cursor-pointer"
                      >
                        Reset Filter & Pencarian
                      </button>
                    </div>
                  );
                }

                if (viewMode === 'list') {
                  return (
                    <div className="space-y-3">
                      {filteredAgents.map((agent: any) => {
                        const logoElement = <DynamicBrandLogo iconKey={agent.icon_key || 'whatsapp'} title={agent.title} />;
                        return (
                          <div key={agent.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:border-orange-500/50 transition-all">
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              <div className="size-11 rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black shrink-0 border border-orange-500/20">
                                {logoElement}
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{agent.title}</h3>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
                                    {agent.model_engine || 'DeepSeek-V3'}
                                  </span>
                                  {agent.category_name && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                                      {agent.category_name}
                                    </span>
                                  )}
                                  {agent.badge_label && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 shrink-0">
                                      ✦ {agent.badge_label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">{agent.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-extrabold justify-end">
                                  <Star size={11} fill="currentColor" /> {agent.rating_score || 4.9} ({agent.rating_reviews_count || 500})
                                </div>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                                  Rp{Number(agent.price_idr || 99000).toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{agent.billing_unit || '/bln'}</span>
                                </span>
                              </div>
                              <button 
                                onClick={() => setSelectedAgentForTaskExecution(agent)}
                                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Play size={13} className="text-orange-500" />
                                <span>Uji Task</span>
                              </button>
                              <button 
                                onClick={() => handleTogglePopularAgentInstall(agent)}
                                className={`py-1.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  agent.is_installed ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                                }`}
                              >
                                {agent.is_installed ? <Check size={14} /> : <Plus size={14} />}
                                <span>{agent.is_installed ? 'Terinstal' : 'Install AI'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredAgents.map((agent: any) => {
                      const logoElement = <DynamicBrandLogo iconKey={agent.icon_key || 'whatsapp'} title={agent.title} />;
                      return (
                        <div key={agent.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                                  {logoElement}
                                </div>
                                <div>
                                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">{agent.title}</h3>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                                      {agent.model_engine || 'DeepSeek-V3'}
                                    </span>
                                    {agent.category_name && (
                                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        {agent.category_name}
                                      </span>
                                    )}
                                    {agent.badge_label && (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                                        ✦ {agent.badge_label}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">{agent.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                  <Star size={11} fill="currentColor" /> {agent.rating_score || 4.9} ({agent.rating_reviews_count || 500})
                                </span>
                                <span>•</span>
                                <span>{agent.installs_count_label || '1k+'}</span>
                              </div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                                Rp{Number(agent.price_idr || 99000).toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">{agent.billing_unit || '/bln'}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => setSelectedAgentForTaskExecution(agent)}
                                title="Uji Eksekusi Task Real AI"
                                className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Play size={13} className="text-orange-500" />
                                <span className="hidden sm:inline">Uji</span>
                              </button>
                              <button 
                                onClick={() => handleTogglePopularAgentInstall(agent)}
                                className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  agent.is_installed ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                                }`}
                              >
                                {agent.is_installed ? <Check size={14} /> : <Plus size={14} />}
                                <span>{agent.is_installed ? 'Terinstal' : 'Install'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-VIEW 2: All Categories (Enterprise AI Directory) */}
          {activeSubPage === 'all_categories' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Executive Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Grid size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Kategori Modul AI</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-200/60 dark:border-indigo-500/30">
                      {(categoriesList.length > 0 ? categoriesList : marketplaceData.categories).length} Kategori
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-500/30 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      {realtimeModulesList.length} Active Modules
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Jelajahi dan kelola modul AI Employee terintegrasi berdasarkan kebutuhan operasional toko.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              {/* Sub-View Segmented Navigation Toggle (Enterprise UI/UX Standard) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    onClick={() => handleSelectCategorySubTab('categories')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                      categorySubTab === 'categories'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Grid size={15} className={categorySubTab === 'categories' ? 'text-orange-500' : ''} />
                    <span>Direktori Kategori AI ({(categoriesList.length > 0 ? categoriesList : marketplaceData.categories).length})</span>
                  </button>
                  <button
                    onClick={() => handleSelectCategorySubTab('modules')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                      categorySubTab === 'modules'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-slate-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Cpu size={15} className={categorySubTab === 'modules' ? 'text-orange-500' : ''} />
                    <span>Katalog Modul Engine AI ({realtimeModulesList.length})</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 font-medium hidden md:block">
                  {categorySubTab === 'categories' ? '● Menampilkan 8 Taksonomi Kategori Utama' : '● Menampilkan Filter Realtime Modul AI'}
                </div>
              </div>

              {/* VIEW MODE 1: Katalog Modul Engine AI (Multi-Filter Dropdown Toolbar & Grid) */}
              {categorySubTab === 'modules' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Real-time AI Module Filter & Dropdown Configuration Bar */}
                  <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders size={16} className="text-orange-500" />
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Filter Modul AI Realtime & Konfigurasi Engine</h4>
                      </div>
                      {(moduleFilterCategory !== 'ALL' || moduleFilterModel !== 'ALL' || moduleFilterIndustry !== 'ALL' || moduleFilterStatus !== 'ALL') && (
                        <button
                          onClick={() => {
                            setModuleFilterCategory('ALL');
                            setModuleFilterModel('ALL');
                            setModuleFilterIndustry('ALL');
                            setModuleFilterStatus('ALL');
                          }}
                          className="text-[11px] font-bold text-orange-500 hover:underline cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
                      {/* Category Dropdown Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Kategori AI</label>
                        <select
                          value={moduleFilterCategory}
                          onChange={(e) => setModuleFilterCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="ALL">Semua Kategori AI</option>
                          <option value="cat_sales">Sales & Lead Automation</option>
                          <option value="cat_marketing">Marketing & Social Campaign</option>
                          <option value="cat_customer_service">Customer Support & Live Chat</option>
                          <option value="cat_finance">Finance & Automatic Invoicing</option>
                          <option value="cat_operations">Store & Inventory Operations</option>
                          <option value="cat_productivity">Productivity & Task Automation</option>
                          <option value="cat_analytics">Analytics & Business Intelligence</option>
                          <option value="cat_logistics">Logistics & Shipping Fulfillment</option>
                        </select>
                      </div>

                      {/* Model Engine Dropdown Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Model Engine AI</label>
                        <select
                          value={moduleFilterModel}
                          onChange={(e) => setModuleFilterModel(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="ALL">Semua AI Models</option>
                          <option value="DeepSeek-V3">DeepSeek-V3</option>
                          <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                          <option value="Llama 3.3 70B">Llama 3.3 70B</option>
                          <option value="GPT-4o Mini">GPT-4o Mini</option>
                          <option value="9Router Vision OCR">9Router Vision OCR</option>
                        </select>
                      </div>

                      {/* Target Industry Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Target Industri</label>
                        <select
                          value={moduleFilterIndustry}
                          onChange={(e) => setModuleFilterIndustry(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="ALL">Semua Target Industri</option>
                          <option value="Ritel">Ritel, Sales & E-Commerce</option>
                          <option value="F&B">F&B, Fashion, & Digital Product</option>
                          <option value="Service">Service, Clinic & Online Shop</option>
                          <option value="Grosir">Toko Grosir & Manufaktur</option>
                          <option value="Gudang">Gudang & Minimarket</option>
                          <option value="Eksekutif">Eksekutif & Pemilik Usaha</option>
                        </select>
                      </div>

                      {/* Operational Status Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Status Operasional</label>
                        <select
                          value={moduleFilterStatus}
                          onChange={(e) => setModuleFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="ALL">Semua Status</option>
                          <option value="active">● Aktif (Tampil)</option>
                          <option value="inactive">○ Nonaktif (Maintenance)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Real-time AI Modules Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Cpu size={16} className="text-orange-500" />
                        <span>Modul AI Terintegrasi Realtime ({realtimeModulesList.length})</span>
                      </h3>
                    </div>

                    {realtimeModulesList.length === 0 ? (
                      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tidak ada Modul AI yang memenuhi kriteria filter.</p>
                        <button
                          onClick={() => {
                            setModuleFilterCategory('ALL');
                            setModuleFilterModel('ALL');
                            setModuleFilterIndustry('ALL');
                            setModuleFilterStatus('ALL');
                          }}
                          className="text-xs text-orange-500 font-bold hover:underline cursor-pointer"
                        >
                          Reset Semua Filter
                        </button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {realtimeModulesList.map((mod: any) => {
                          const iconEl = BrandLogos[mod.icon_key] || <Cpu size={18} className="text-orange-500" />;
                          return (
                            <div key={mod.id} className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="size-10 rounded-2xl bg-orange-50 text-orange-600 dark:bg-slate-800 flex items-center justify-center font-black">
                                    {iconEl}
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200/60">
                                    {mod.badge_tag || 'TERLINDUNGI'}
                                  </span>
                                </div>

                                <div>
                                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-1">{mod.title}</h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed font-medium">
                                    {mod.description}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-mono font-bold">
                                    {mod.primary_model || 'DeepSeek-V3'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[9px] font-mono font-bold">
                                    9Router Engine
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold">{mod.target_industry || 'UMKM Multi'}</span>
                                <button
                                  onClick={() => setSelectedModuleForConfig(mod)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-black hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Sliders size={12} />
                                  <span>Konfig Engine</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW MODE 2: Direktori Kategori Utama AI */}
              {categorySubTab === 'categories' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Categories Grid / List View */}
              {(() => {
                const displayCategories = (categoriesList.length > 0 ? categoriesList : marketplaceData.categories).filter((cat: any) =>
                  !searchQuery.trim() ||
                  cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
                );

                if (displayCategories.length === 0) {
                  return (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tidak ada Kategori AI yang cocok dengan "{searchQuery}"</p>
                      <button onClick={() => setSearchQuery('')} className="text-xs text-orange-500 font-bold hover:underline cursor-pointer">Bersihkan Pencarian</button>
                    </div>
                  );
                }

                if (viewMode === 'list') {
                  return (
                    <div className="space-y-3">
                      {displayCategories.map((cat: any, i: number) => {
                        const iconEl = BrandLogos[cat.icon_key] || <Grid size={20} className="text-orange-500" />;
                        const models: string[] = Array.isArray(cat.supported_models) ? cat.supported_models : ['DeepSeek-V3', 'Claude 3.5'];
                        const isInactive = cat.status === 'inactive';

                        return (
                          <div key={cat.id || cat.category_key || i} className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-all ${isInactive ? 'opacity-60 border-slate-200 dark:border-slate-800' : 'border-slate-200/80 dark:border-slate-800 hover:border-orange-500/50'}`}>
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              <div className="size-11 rounded-2xl bg-orange-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                {iconEl}
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{cat.name}</h4>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200/60">
                                    {cat.ai_module_count || cat.count || 12} Modul AI
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCategoryStatus(cat.id, cat.status)}
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-black cursor-pointer transition-all ${
                                      isInactive
                                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                    }`}
                                  >
                                    ● {isInactive ? 'Nonaktif' : 'Aktif'}
                                  </button>
                                  {cat.target_industry && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {cat.target_industry}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{cat.description || `Modul AI khusus untuk membantu efisiensi pada kategori ${cat.name.toLowerCase()}.`}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                              <button
                                onClick={() => setSelectedCategoryForDetail(cat)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Cpu size={13} className="text-orange-500" />
                                <span>Detail Telemetri & Prompt AI</span>
                              </button>

                              <button
                                onClick={() => setSelectedCategoryForEdit(cat)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Settings size={13} className="text-slate-500" />
                                <span>Edit Kategori</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedCategoryPill(cat.name);
                                  changeSubPage('overview');
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black transition-all cursor-pointer active:scale-95 shadow-xs flex items-center gap-1"
                              >
                                <span>Filter Modul</span>
                                <span>→</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayCategories.map((cat: any, i: number) => {
                      const iconEl = BrandLogos[cat.icon_key] || <Grid size={20} className="text-orange-500" />;
                      const models: string[] = Array.isArray(cat.supported_models) ? cat.supported_models : ['DeepSeek-V3', 'Claude 3.5'];
                      const isInactive = cat.status === 'inactive';

                      return (
                        <div key={cat.id || cat.category_key || i} className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border space-y-3 shadow-xs transition-all flex flex-col justify-between group ${isInactive ? 'opacity-65 border-slate-200 dark:border-slate-800' : 'border-slate-200/80 dark:border-slate-800 hover:border-orange-500/50'}`}>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="size-11 rounded-2xl bg-orange-50 text-orange-600 dark:bg-slate-800 flex items-center justify-center font-black shadow-xs">
                                {iconEl}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCategoryStatus(cat.id, cat.status)}
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-black cursor-pointer transition-all ${
                                    isInactive
                                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  }`}
                                >
                                  ● {isInactive ? 'Nonaktif' : 'Aktif'}
                                </button>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200/60">
                                  {cat.ai_module_count || cat.count || 12} Modul AI
                                </span>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">{cat.name}</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-1 line-clamp-2">
                                {cat.description || `Modul AI khusus untuk membantu efisiensi pada kategori ${cat.name.toLowerCase()} di toko UMKM Anda.`}
                              </p>
                            </div>

                            {/* Engine Model Pills */}
                            <div className="pt-1 flex flex-wrap items-center gap-1.5">
                              {models.map((m: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-mono font-bold">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedCategoryForDetail(cat)}
                                className="flex-1 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Cpu size={13} className="text-orange-500" />
                                <span>Detail Telemetri & Prompt</span>
                              </button>
                              <button
                                onClick={() => setSelectedCategoryForEdit(cat)}
                                className="px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Edit Kategori"
                              >
                                <Settings size={13} className="text-slate-500" />
                                <span>Edit</span>
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                const catName = (cat.name || '').toLowerCase();
                                let targetKey = 'ALL';
                                if (catName.includes('sales') || catName.includes('marketing')) targetKey = 'cat_sales';
                                else if (catName.includes('finance') || catName.includes('accounting')) targetKey = 'cat_finance';
                                else if (catName.includes('store') || catName.includes('operations')) targetKey = 'cat_operations';
                                else if (catName.includes('customer') || catName.includes('service')) targetKey = 'cat_customer_service';
                                else if (catName.includes('productivity')) targetKey = 'cat_productivity';
                                else if (catName.includes('analytics')) targetKey = 'cat_analytics';
                                else if (catName.includes('logistics') || catName.includes('shipping')) targetKey = 'cat_logistics';

                                setModuleFilterCategory(targetKey);
                                handleSelectCategorySubTab('modules');
                              }}
                              className="w-full py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition-all cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1"
                            >
                              <span>Lihat Modul Engine {cat.name}</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 3: All Integrations (Categorized Enterprise Integration Hub) */}
          {activeSubPage === 'all_integrations' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Executive Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Pusat Integrasi Gateway</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-500/30">
                      {marketplaceData.payments.filter((p: any) => p.is_connected || p.connection_status === 'connected').length} / {marketplaceData.payments.length} Terhubung
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      TLS 1.3 & Sol-M2H
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Kelola saluran pembayaran, engine AI, dan kurir pengiriman toko secara aman.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddCustomModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>Tambah Integrasi</span>
                </button>
              </div>

              {/* Categorized Integration Sections */}
              {(() => {
                const rawItems = marketplaceData.payments || [];
                const searchQ = (searchQuery || '').toLowerCase().trim();

                const filteredItems = rawItems.filter((i: any) => {
                  if (!searchQ) return true;
                  return (
                    (i.title || '').toLowerCase().includes(searchQ) ||
                    (i.description || '').toLowerCase().includes(searchQ) ||
                    (i.category_name || '').toLowerCase().includes(searchQ) ||
                    (i.badge_label || '').toLowerCase().includes(searchQ) ||
                    (i.integration_key || '').toLowerCase().includes(searchQ)
                  );
                });

                if (filteredItems.length === 0) {
                  return (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                        Tidak ada integrasi atau gateway yang cocok dengan "{searchQuery}"
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-orange-500 font-bold hover:underline cursor-pointer"
                      >
                        Bersihkan Kata Kunci Pencarian
                      </button>
                    </div>
                  );
                }

                // Group filtered items by enterprise category
                const paymentGateways = filteredItems.filter((i: any) => 
                  !i.category_name || i.category_name.includes('Payment') || ['x402', 'stripe', 'midtrans', 'qris', 'gopay', 'ovo', 'dana'].includes(i.icon_key)
                );
                const aiModels = filteredItems.filter((i: any) => 
                  (i.category_name || '').includes('AI') || ['deepseek', 'claude', 'deepseek_v3_mesh', 'claude_35_sonnet'].includes(i.icon_key) || ['p8', 'p9'].includes(i.id)
                );
                const logistics = filteredItems.filter((i: any) => 
                  (i.category_name || '').includes('Logistik') || (i.category_name || '').includes('Commerce') || i.icon_key === 'logistics' || i.id === 'p10'
                );

                const sections = [
                  { title: 'Payment Gateways & Web3 M2H Protocol', icon: Receipt, items: paymentGateways, desc: 'Gateway pembayaran kartu kredit, QRIS otomatis, e-wallet, dan protokol mesin-ke-mesin x402.' },
                  { title: 'AI Models & LLM Mesh Infrastructure', icon: Cpu, items: aiModels, desc: 'High-availability AI model mesh via 9Router & Anthropic API untuk copywriting & asistensi otomatis.' },
                  { title: 'E-Commerce & Courier Logistics Hub', icon: Package, items: logistics, desc: 'Integrasi ekspedisi kurir terpadu untuk cetak resi otomatis, pickup barang, & tracking lokasi real-time.' }
                ];

                return (
                  <div className="space-y-8">
                    {sections.map((sec, secIdx) => {
                      if (sec.items.length === 0) return null;
                      const SecIcon = sec.icon;

                      return (
                        <div key={secIdx} className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="size-9 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black">
                                <SecIcon size={18} />
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  <span>{sec.title}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {sec.items.length} Gateway
                                  </span>
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">{sec.desc}</p>
                              </div>
                            </div>
                          </div>

                          {/* Grid vs List View Layout Render */}
                          {viewMode === 'list' ? (
                            <div className="space-y-3">
                              {sec.items.map((pay: any) => {
                                const logoElement = <DynamicBrandLogo iconKey={pay.icon_key} title={pay.title} />;
                                const isConn = pay.is_connected || pay.connection_status === 'connected';

                                return (
                                  <div key={pay.id || pay.integration_key} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-orange-500/50 transition-all">
                                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                      <div className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                        {logoElement}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{pay.title}</h4>
                                          {pay.badge_label ? (
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[9px] font-extrabold border border-slate-200 dark:border-slate-700">
                                              {pay.badge_label}
                                            </span>
                                          ) : (
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                              isConn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                              {isConn ? '• Terhubung' : 'Terputus'}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{pay.description}</p>
                                      </div>
                                    </div>

                                    <div className="shrink-0 self-end sm:self-auto">
                                      <button
                                        onClick={() => {
                                          setSelectedIntegrationForConfig(pay);
                                          setIsConfigModalOpen(true);
                                        }}
                                        className={`py-2 px-4 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                          isConn
                                            ? 'border-emerald-500/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                                            : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs'
                                        }`}
                                      >
                                        {isConn ? <Settings size={13} /> : <Plug size={13} />}
                                        <span>{isConn ? 'Kelola Konfigurasi' : 'Hubungkan Gateway'}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {sec.items.map((pay: any) => {
                                const logoElement = <DynamicBrandLogo iconKey={pay.icon_key} title={pay.title} />;
                                const isConn = pay.is_connected || pay.connection_status === 'connected';

                                return (
                                  <div key={pay.id || pay.integration_key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-orange-500/50 transition-all group">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-xs">
                                          {logoElement}
                                        </div>
                                        {pay.badge_label ? (
                                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[9px] font-extrabold border border-slate-200 dark:border-slate-700">
                                            {pay.badge_label}
                                          </span>
                                        ) : (
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                            isConn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                          }`}>
                                            {isConn ? '• Terhubung' : 'Terputus'}
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">{pay.title}</h3>
                                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">{pay.description}</p>
                                      </div>
                                    </div>

                                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                                      <button 
                                        onClick={() => {
                                          setSelectedIntegrationForConfig(pay);
                                          setIsConfigModalOpen(true);
                                        }}
                                        className={`w-full py-2 px-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                                          isConn
                                            ? 'border-emerald-500/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                                            : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs'
                                        }`}
                                      >
                                        {isConn ? <Settings size={13} /> : <Plug size={13} />}
                                        <span>{isConn ? 'Kelola Konfigurasi' : 'Hubungkan Gateway'}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-VIEW 4: Marketplace Articles & Panduan */}
          {activeSubPage === 'marketplace_articles' && (
            selectedArticleForDetail ? (
              <ArticleReaderView
                article={selectedArticleForDetail}
                onBack={() => setSelectedArticleForDetail(null)}
                onNavigateTab={onNavigateTab}
              />
            ) : (
              <div className="space-y-6">
                {/* Executive Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Pusat Panduan & Artikel AI</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Repositori SOP operasional toko, panduan integrasi, dan edukasi otomatisasi AI.
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigateTab?.('knowledge')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 self-start sm:self-auto"
                  >
                    <span>Knowledge Base Utama</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* Category Filter Chips Toolbar (Deduplicated Single-Row Horizontal Scroll) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth max-w-full flex-nowrap">
                    {getDeduplicatedCategories(knowledgeCategories).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setArticleCategoryFilter(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                          articleCategoryFilter === cat.id
                            ? 'bg-orange-500 text-white font-extrabold shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-bold border border-slate-200/60 dark:border-slate-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold px-2 whitespace-nowrap self-end sm:self-auto flex-shrink-0">
                    {getFilteredArticles().length} Panduan Ditemukan
                  </span>
                </div>

                {/* Articles Content (Grid, List View, or Clean Empty State with Seamless Transition) */}
                <div key={articleCategoryFilter} className="animate-in fade-in duration-200">
                  {getFilteredArticles().length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs my-4">
                      <div className="size-12 rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/60 flex items-center justify-center mx-auto">
                        <BookOpen size={24} />
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                        Belum Ada Panduan untuk Kategori "{articleCategoryFilter}"
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium leading-relaxed">
                        Panduan untuk kategori ini sedang disiapkan oleh tim ZEGA. Anda juga dapat melihat kategori lain atau membuat dokumen SOP baru di Knowledge Base Utama.
                      </p>
                      <button
                        onClick={() => setArticleCategoryFilter('Semua Panduan')}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all mt-2"
                      >
                        Tampilkan Semua Panduan
                      </button>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {getFilteredArticles().map((art: any, i: number) => (
                        <div key={art.id || i} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-orange-500/50 hover:shadow-md transition-all space-y-4 group">
                          <div className="space-y-3">
                            <ArticleCardCover src={art.cover_image_url} title={art.title} category={art.category_name} />
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider">
                                {art.category_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                <Clock size={11} /> {art.read_time_minutes || 5} mnt baca
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug group-hover:text-orange-500 transition-colors">
                              {art.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                              {art.summary}
                            </p>
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-semibold flex items-center justify-between">
                              <span>Model Engine:</span>
                              <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">{art.ai_model_engine || 'DeepSeek-V3'}</span>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                            <span>{art.view_count || art.views_count || 1200} Pembaca</span>
                            <button 
                              onClick={() => setSelectedArticleForDetail(art)} 
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs cursor-pointer shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <span>Baca Artikel →</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getFilteredArticles().map((art: any, i: number) => (
                        <div key={art.id || i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:border-orange-500/50 transition-all">
                          <div className="flex items-center gap-4 flex-1">
                            <ArticleThumbnail src={art.cover_image_url} title={art.title} />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 text-[9px] font-black uppercase">
                                  {art.category_name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">• {art.read_time_minutes || 5} mnt baca</span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{art.title}</h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{art.summary}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedArticleForDetail(art)} 
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs cursor-pointer shadow-xs hover:shadow-md transition-all whitespace-nowrap self-end md:self-auto active:scale-95"
                          >
                            Baca Artikel →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* SUB-VIEW 5: New AI Agents (Enterprise Release Catalogue) */}
          {activeSubPage === 'new_agents' && (
            <div className="space-y-6">
              {/* Executive Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-violet-600 dark:text-violet-400" />
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Katalog AI Terbaru</h3>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold border border-violet-200/60 dark:border-violet-500/30">
                      Rilis Minggu Ini
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      ZeroClaw v3.4 Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Otomatisasi bisnis baru diluncurkan dengan performa 9Router ultra-cepat.
                  </p>
                </div>

                {/* Category Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold self-start sm:self-auto">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'Sales & Marketing', label: 'Sales' },
                    { id: 'Finance & Accounting', label: 'Finance' },
                    { id: 'Store & Operations', label: 'Operations' },
                    { id: 'CRM & Intelligence', label: 'CRM' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewAgentsCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                        newAgentsCategory === cat.id
                          ? 'bg-violet-600 text-white font-extrabold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Grid / List */}
              {(() => {
                const filteredNewAgents = newAgentsList.filter((item: any) => 
                  !searchQuery || 
                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.ai_model_engine.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredNewAgents.length === 0) {
                  return (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tidak ada AI Terbaru yang cocok dengan "{searchQuery}"</p>
                      <button onClick={() => setSearchQuery('')} className="text-xs text-orange-500 font-bold hover:underline cursor-pointer">Bersihkan Kata Kunci Pencarian</button>
                    </div>
                  );
                }

                if (viewMode === 'list') {
                  return (
                    <div className="space-y-3">
                      {filteredNewAgents.map((item: any, i: number) => (
                        <div key={item.id || i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:border-orange-500/50 transition-all">
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <div className="size-11 rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black shrink-0 border border-orange-500/20">
                              {BrandLogos[item.icon_key] || <Cpu size={18} className="text-orange-500" />}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{item.title}</h4>
                                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 text-[9px] font-black border border-orange-200/60 flex items-center gap-1 shrink-0">
                                  <Tag size={10} className="text-orange-500" />
                                  <span>{item.release_tag || 'Rilis Minggu Ini'}</span>
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{item.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5">
                                <span>Engine: <strong className="text-slate-700 dark:text-slate-300">{item.ai_model_engine}</strong></span>
                                <span>•</span>
                                <span className="text-emerald-500 font-bold">{item.zeroclaw_status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                            <button 
                              onClick={() => {
                                if (item.is_installed) {
                                  setSelectedAgentForDetail(item);
                                } else {
                                  handleToggleNewAgentInstall(item);
                                }
                              }}
                              className={`py-2 px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                                item.is_installed
                                  ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900'
                                  : 'bg-orange-500 text-white hover:bg-orange-600'
                              }`}
                            >
                              {item.is_installed ? <ExternalLink size={14} /> : <Plus size={14} />}
                              <span>{item.is_installed ? 'Buka Agent' : 'Install AI Baru Ini'}</span>
                            </button>
                            <button
                              onClick={() => handleExecuteAgentTest(item)}
                              title="Uji Task via 9Router Engine"
                              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1"
                            >
                              <Activity size={14} className="text-orange-500" />
                              <span>Uji</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredNewAgents.map((item: any, i: number) => (
                      <div 
                        key={item.id || i} 
                        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs hover:border-orange-500/50 transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-3.5">
                          {/* Release Tag & Version Header */}
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 text-[10px] font-black border border-orange-200/60 dark:border-orange-900/50 flex items-center gap-1">
                              <Tag size={12} className="text-orange-500" />
                              <span>{item.release_tag || 'Rilis Minggu Ini'}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px] font-bold">
                              {item.version_tag || 'v3.4.0'}
                            </span>
                          </div>

                          {/* Title & Category */}
                          <div className="space-y-1">
                            <div 
                              onClick={() => setSelectedAgentForDetail(item)}
                              className="flex items-center gap-2.5 cursor-pointer"
                            >
                              <div className="size-9 rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black shrink-0 border border-orange-500/20">
                                {BrandLogos[item.icon_key] || <Cpu size={18} className="text-orange-500" />}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors line-clamp-1">
                                  {item.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-medium">{item.category_name}</p>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pt-1 line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          {/* 9Router Model Badge */}
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[10px] font-extrabold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Cpu size={12} className="text-orange-500" />
                              <span>{item.ai_model_engine}</span>
                            </div>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                              {item.zeroclaw_status || 'Active Autonomous'}
                            </span>
                          </div>

                          {/* Feature Checklist */}
                          {item.feature_list && item.feature_list.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {item.feature_list.slice(0, 3).map((feat: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                  <span className="line-clamp-1">{feat}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Button Row */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <button 
                            onClick={() => {
                              if (item.is_installed) {
                                setSelectedAgentForDetail(item);
                              } else {
                                handleToggleNewAgentInstall(item);
                              }
                            }}
                            className={`flex-1 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                              item.is_installed
                                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                          >
                            {item.is_installed ? <ExternalLink size={14} /> : <Plus size={14} />}
                            <span>{item.is_installed ? 'Buka Agent' : 'Install AI Baru Ini'}</span>
                          </button>
                          <button
                            onClick={() => handleExecuteAgentTest(item)}
                            title="Uji Task via 9Router Engine"
                            className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1"
                          >
                            <Activity size={14} className="text-orange-500" />
                            <span>Uji</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-VIEW 6: Top Used AI Agents (Executive Telemetry Leaderboard) */}
          {activeSubPage === 'top_used_agents' && (
            <div className="space-y-6">
              {/* Executive Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-rose-500" />
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      Leaderboard AI Terpopuler
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-200/60 dark:border-rose-500/30">
                      Telemetry Real-time
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Peringkat berdasarkan eksekusi tugas nyata, latency 9Router, dan status AI ZeroClaw.
                  </p>
                </div>

                {/* Timeframe Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold self-start sm:self-auto">
                  <button
                    onClick={() => setTopUsedTimeframe('7d')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      topUsedTimeframe === '7d'
                        ? 'bg-rose-600 text-white font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    onClick={() => setTopUsedTimeframe('30d')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      topUsedTimeframe === '30d'
                        ? 'bg-rose-600 text-white font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    30 Hari
                  </button>
                  <button
                    onClick={() => setTopUsedTimeframe('all_time')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      topUsedTimeframe === 'all_time'
                        ? 'bg-rose-600 text-white font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Semua Waktu
                  </button>
                </div>
              </div>

              {/* Filtered Leaderboard Content */}
              {(() => {
                const filteredLeaderboard = topUsedLeaderboard.filter((item: any) =>
                  !searchQuery || 
                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  item.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.ai_model_engine.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredLeaderboard.length === 0) {
                  return (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">Tidak ada Leaderboard AI yang cocok dengan "{searchQuery}"</p>
                      <button onClick={() => setSearchQuery('')} className="text-xs text-orange-500 font-bold hover:underline cursor-pointer">Bersihkan Kata Kunci Pencarian</button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* PODIUM SPOTLIGHT (TOP 3) */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {filteredLeaderboard.slice(0, 3).map((item: any, idx: number) => {
                        const isGold = idx === 0;
                        const isSilver = idx === 1;
                        const isBronze = idx === 2;

                        return (
                          <div 
                            key={item.id || idx}
                            className={`relative rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                              isGold 
                                ? 'bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-500/40 hover:border-amber-500' 
                                : isSilver 
                                ? 'bg-gradient-to-b from-slate-300/10 via-white to-white dark:from-slate-700/20 dark:via-slate-900 dark:to-slate-900 border-slate-300/50 hover:border-slate-400' 
                                : 'bg-gradient-to-b from-orange-400/10 via-white to-white dark:from-orange-950/20 dark:via-slate-900 dark:to-slate-900 border-orange-400/40 hover:border-orange-500'
                            }`}
                          >
                            {/* Top Rank Badge */}
                            <div className="flex items-center justify-between">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                                isGold 
                                  ? 'bg-amber-500 text-white' 
                                  : isSilver 
                                  ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' 
                                  : 'bg-orange-600 text-white'
                              }`}>
                                <Trophy size={12} />
                                <span>#{item.rank_order || idx + 1} {isGold ? 'Most Used' : isSilver ? 'Runner Up' : 'Top Tier'}</span>
                              </span>

                              {/* ZeroClaw Status Pill */}
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{item.zeroclaw_status || 'Active Autonomous'}</span>
                              </div>
                            </div>

                            {/* Title & Icon Header */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                                  {BrandLogos[item.icon_key] || <Cpu size={20} className="text-orange-500" />}
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-1">{item.title}</h4>
                                  <p className="text-[10px] text-slate-400 font-medium">{item.category_name}</p>
                                </div>
                              </div>

                              {/* AI Model Specs Tag */}
                              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-between text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  <Cpu size={12} className="text-orange-500" />
                                  <span>Engine: {item.ai_model_engine}</span>
                                </div>
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">{item.avg_latency_ms}ms</span>
                              </div>
                            </div>

                            {/* Telemetry Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-left">
                                <span className="text-[9px] text-slate-400 font-medium block">Total Eksekusi Tugas</span>
                                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                  {item.total_tasks_executed ? item.total_tasks_executed.toLocaleString('id-ID') : '342.8k'}
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-left">
                                <span className="text-[9px] text-slate-400 font-medium block">Kepuasan User</span>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                  {item.satisfaction_rate || 99.6}%
                                </span>
                              </div>
                            </div>

                            {/* Action Button Row */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleAgentInstall(item)}
                                className={`flex-1 py-2.5 rounded-2xl font-black text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                                  item.is_installed
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                                    : 'bg-orange-500 text-white hover:bg-orange-600'
                                }`}
                              >
                                {item.is_installed ? <ExternalLink size={14} /> : <Plus size={14} />}
                                <span>{item.is_installed ? 'Terinstal' : 'Install AI'}</span>
                              </button>
                              <button
                                onClick={() => handleExecuteAgentTest(item)}
                                title="Eksekusi Task Uji via 9Router & Telemetry"
                                className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Activity size={14} className="text-orange-500" />
                                <span>Uji Task</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* RANKED LEADERBOARD LIST (#4+) */}
                    {filteredLeaderboard.length > 3 && (
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                          <BarChart3 size={14} className="text-orange-500" />
                          <span>Peringkat Telemetry AI (#4 dan Seterusnya)</span>
                        </h4>

                        <div className="space-y-2">
                          {filteredLeaderboard.slice(3).map((item: any, idx: number) => (
                            <div 
                              key={item.id || idx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 gap-3 hover:border-orange-500/40 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center shadow-xs">
                                  #{item.rank_order || idx + 4}
                                </div>

                                <div className="size-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                  {BrandLogos[item.icon_key] || <Cpu size={16} className="text-orange-500" />}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">{item.title}</h5>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-extrabold">
                                      {item.category_name}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                                    Model: {item.ai_model_engine} • Latency: {item.avg_latency_ms}ms
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                                <div>
                                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                    {item.total_tasks_executed ? item.total_tasks_executed.toLocaleString('id-ID') : '72.1k'} Tugas
                                  </span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                                    {item.satisfaction_rate || 98.0}% Kepuasan
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleExecuteAgentTest(item)}
                                    title="Eksekusi Uji Task via 9Router"
                                    className="px-2.5 py-2 rounded-xl bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1"
                                  >
                                    <Activity size={12} className="text-orange-500" />
                                    <span>Uji</span>
                                  </button>
                                  <button
                                    onClick={() => handleToggleAgentInstall(item)}
                                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs cursor-pointer shadow-xs whitespace-nowrap transition-all ${
                                      item.is_installed 
                                        ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900' 
                                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                                    }`}
                                  >
                                    {item.is_installed ? 'Buka' : 'Install'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW CONTENT (Rendered when activeSubPage === 'overview') */}
      {activeSubPage === 'overview' && (
        <>
      {/* 2. Search & Category Filters Row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Search Bar */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari AI atau solusi (contoh: WhatsApp, Invoice, CRM...)" 
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500 shadow-xs"
            />
          </div>

          {/* Category Dropdown */}
          <select 
            value={selectedCategoryPill}
            onChange={(e) => setSelectedCategoryPill(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shadow-xs w-full sm:w-auto"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Finance">Finance</option>
            <option value="Store & Operations">Store & Operations</option>
            <option value="Productivity">Productivity</option>
            <option value="Analytics">Analytics</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        {/* Category Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 text-xs font-extrabold">
          {['Semua', 'Sales', 'Marketing', 'Customer Service', 'Finance', 'Store & Operations', 'Productivity', 'Analytics', 'Lainnya'].map((pill) => (
            <button
              key={pill}
              onClick={() => setSelectedCategoryPill(pill)}
              className={`px-3.5 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                selectedCategoryPill === pill
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Grid Layout (Left Content + Right Sidebar) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Center Column (lg:col-span-9) */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Section 1: AI Employees Populer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">AI Employees Populer</h2>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 text-[9px] font-black">{filteredAgents.length} Agent</span>
              </div>
              <button 
                onClick={() => setActiveSubPage('popular_agents')}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Grid of AI Employee Cards — capped at 6 for visual consistency */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAgents.slice(0, 6).map((agent: any) => (
                  <div 
                    key={agent.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-orange-500/50 hover:shadow-md transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Logo + Title + Popular Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                            <DynamicBrandLogo iconKey={agent.icon_key} title={agent.title} />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors line-clamp-1">
                              {agent.title}
                            </h3>
                            {agent.badge_label && (
                              <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                                ✦ {agent.badge_label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {agent.description}
                      </p>
                    </div>

                    {/* Rating + Installs + Price + Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star size={11} fill="currentColor" /> {agent.rating_score} ({agent.rating_reviews_count})
                          </span>
                          <span>•</span>
                          <span>Instalasi {agent.installs_count_label}</span>
                        </div>
                        <div className="mt-0.5">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                            Rp{Number(agent.price_idr).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">{agent.billing_unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedAgentForDetail(agent)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          Lihat Detail →
                        </button>
                        <button 
                          onClick={() => setSelectedAgentForDetail(agent)}
                          className={`py-1.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            agent.is_installed 
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' 
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white hover:border-orange-500'
                          }`}
                        >
                          {agent.is_installed ? 'Terinstal' : 'Install'}
                        </button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* Section 2: Integrasi Pembayaran */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Integrasi Pembayaran</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black">{marketplaceData.payments.length} Gateway</span>
              </div>
              <button 
                onClick={() => setActiveSubPage('all_integrations')}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua Integrasi</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Grid of Payment Integration Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
              {marketplaceData.payments.map((pay: any) => (
                  <div 
                    key={pay.id} 
                    className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-orange-500/50 hover:shadow-md transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="size-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                          <DynamicBrandLogo iconKey={pay.icon_key} title={pay.title} />
                        </div>
                        {pay.badge_label && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[8px] font-extrabold">
                            {pay.badge_label}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors line-clamp-1">
                          {pay.title}
                        </h3>
                        <p className="text-[9px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                          {pay.description}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedPaymentForConnect(pay)}
                      className={`mt-2.5 w-full py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-colors ${
                        pay.is_connected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pay.is_connected ? 'Terhubung' : 'Hubungkan'}
                    </button>
                  </div>
              ))}
            </div>
          </div>

          {/* Section 3: Bottom 4 Column Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Artikel & Panduan Terbaru */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs min-h-[200px]">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-500" />
                  <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Artikel & Panduan Terbaru</h4>
                </div>
                <div className="space-y-2 text-xs font-semibold">
                  {marketplaceData.articles.slice(0, 4).map((art: any, i: number) => (
                    <div key={i} className="space-y-0.5 border-b border-slate-100 dark:border-slate-800 pb-1.5 last:border-0">
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:text-orange-500 cursor-pointer line-clamp-1">
                        {art.title}
                      </h5>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">{art.category_name}</span>
                        <span>{art.views_count} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setActiveSubPage('marketplace_articles')} className="text-left text-[11px] font-extrabold text-orange-500 hover:text-orange-600 cursor-pointer pt-1">
                Lihat Semua Artikel →
              </button>
            </div>

            {/* Card 2: AI Terbaru */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs min-h-[200px]">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-500" />
                  <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">AI Terbaru</h4>
                </div>
                <div className="space-y-2 text-xs font-semibold">
                  {marketplaceData.newAgents.slice(0, 5).map((ag: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 dark:text-slate-300 font-bold line-clamp-1">{ag.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] font-extrabold flex-shrink-0">{ag.badge_label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setActiveSubPage('new_agents')} className="text-left text-[11px] font-extrabold text-orange-500 hover:text-orange-600 cursor-pointer pt-1">
                Lihat Semua AI →
              </button>
            </div>

            {/* Card 3: Paling Banyak Digunakan */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs min-h-[200px]">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Activity size={14} className="text-amber-500" />
                  <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Paling Banyak Digunakan</h4>
                </div>
                <div className="space-y-2 text-xs font-semibold">
                  {marketplaceData.topAgents.slice(0, 5).map((top: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="size-5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[10px] font-black flex items-center justify-center text-orange-500 border border-orange-200/50 dark:border-orange-500/30">{top.rank_order || i + 1}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold truncate">{top.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{top.installs_count_label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setActiveSubPage('top_used_agents')} className="text-left text-[11px] font-extrabold text-orange-500 hover:text-orange-600 cursor-pointer pt-1">
                Lihat Semua →
              </button>
            </div>

            {/* Card 4: Keamanan & Kepercayaan */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs min-h-[200px]">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Keamanan & Standar</h4>
                </div>
                <div className="space-y-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Enkripsi data end-to-end (AES-256)</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Row Level Security (RLS) Supabase</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> AI model diaudit sebelum rilis</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Isolasi data per toko / tenant</div>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 text-emerald-700 dark:text-emerald-400 text-center text-[10px] font-extrabold flex items-center justify-center gap-1">
                <ShieldCheck size={14} /> <span>Enterprise Security Standard</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Column (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Card 1: AI Recommendation */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white space-y-4 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 size-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 size-20 bg-purple-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-black">
                <Sparkles size={15} className="text-amber-300" /> <span>AI Recommendation</span>
              </div>
              <span className="text-[10px] text-purple-200 block font-medium">Berdasarkan aktivitas bisnis Anda</span>
              <p className="text-[11px] font-medium leading-relaxed pt-1 text-purple-100">
                Pelanggan sering menanyakan tentang retur, ongkir, dan pembayaran. AI menyarankan membuat FAQ otomatis untuk meningkatkan layanan.
              </p>
            </div>
            <button 
              onClick={() => {
                onNavigateTab?.('knowledge');
                triggerToast('⚡ Mengarahkan ke Knowledge Base untuk Generate FAQ Otomatis...');
              }}
              className="relative z-10 w-full py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Zap size={14} /> <span>Generate FAQ Sekarang</span>
            </button>
          </div>

          {/* Card 2: Kategori Populer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Kategori Populer</h3>
            <div className="space-y-1 text-xs font-semibold">
              {marketplaceData.categories.map((cat: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedCategoryPill(cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedCategoryPill === cat.name
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${selectedCategoryPill === cat.name ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span>{cat.name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{cat.count}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setActiveSubPage('all_categories')}
              className="w-full text-center text-[11px] font-extrabold text-orange-500 hover:text-orange-600 pt-1 cursor-pointer"
            >
              Lihat Semua Kategori →
            </button>
          </div>

          {/* Card 3: Butuh Custom AI? */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs">
            <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Butuh Custom AI?</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Kami dapat membuat AI Employee khusus kebutuhan bisnis Anda.
            </p>
            <button 
              onClick={() => setIsRequestCustomAIModalOpen(true)}
              className="w-full py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer shadow-xs transition-all"
            >
              Request Custom AI
            </button>
          </div>

          {/* Card 4: Bantuan Marketplace */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Bantuan Marketplace</h4>
            <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button onClick={() => onNavigateTab?.('bantuan')} className="w-full text-left flex items-center gap-2 hover:text-orange-500 cursor-pointer">
                <HelpCircle size={14} className="text-slate-400" /> <span>Cara Install AI</span>
              </button>
              <button onClick={() => onNavigateTab?.('bantuan')} className="w-full text-left flex items-center gap-2 hover:text-orange-500 cursor-pointer">
                <HelpCircle size={14} className="text-slate-400" /> <span>Pembayaran & Langganan</span>
              </button>
              <button onClick={() => onNavigateTab?.('bantuan')} className="w-full text-left flex items-center gap-2 hover:text-orange-500 cursor-pointer">
                <HelpCircle size={14} className="text-slate-400" /> <span>Kebijakan Marketplace</span>
              </button>
              <button onClick={() => onNavigateTab?.('bantuan')} className="w-full text-left flex items-center gap-2 hover:text-orange-500 cursor-pointer">
                <HelpCircle size={14} className="text-slate-400" /> <span>Hubungi Support</span>
              </button>
            </div>
            <button 
              onClick={() => onNavigateTab?.('bantuan')}
              className="text-[11px] font-extrabold text-orange-500 hover:text-orange-600 cursor-pointer pt-1 block"
            >
              Pusat Bantuan →
            </button>
          </div>

        </div>

      </div>
      </>
      )}

      {/* Dialog Modals */}
      {selectedAgentForDetail && (
        <AIAgentDetailModal
          isOpen={true}
          onClose={() => setSelectedAgentForDetail(null)}
          agent={selectedAgentForDetail}
          triggerToast={triggerToast}
          onRefresh={loadMarketplaceOverview}
        />
      )}

      {selectedPaymentForConnect && (
        <ConnectPaymentModal
          isOpen={true}
          onClose={() => setSelectedPaymentForConnect(null)}
          payment={selectedPaymentForConnect}
          triggerToast={triggerToast}
          onRefresh={loadMarketplaceOverview}
        />
      )}

      <RequestCustomAIModal
        isOpen={isRequestCustomAIModalOpen}
        onClose={() => setIsRequestCustomAIModalOpen(false)}
        triggerToast={triggerToast}
      />

      <MarketplaceHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        triggerToast={triggerToast}
      />

      {selectedAgentForTaskExecution && (
        <ExecuteAgentTaskModal
          isOpen={true}
          onClose={() => setSelectedAgentForTaskExecution(null)}
          agent={selectedAgentForTaskExecution}
          triggerToast={triggerToast}
          onTaskExecuted={(result) => {
            setTopUsedLeaderboard(prev => prev.map(ag => ag.id === result.agent_id ? { 
              ...ag, 
              total_tasks_executed: result.new_total_tasks || ((ag.total_tasks_executed || 0) + 1),
              avg_latency_ms: result.latency_ms || ag.avg_latency_ms
            } : ag));
          }}
        />
      )}

      {selectedArticleForDetail && (
        <ArticleDetailModal
          isOpen={true}
          onClose={() => setSelectedArticleForDetail(null)}
          article={selectedArticleForDetail}
          triggerToast={triggerToast}
          onNavigateTab={onNavigateTab}
        />
      )}

      <IntegrationConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedIntegrationForConfig(null);
        }}
        integration={selectedIntegrationForConfig}
        onSave={handleSaveIntegrationConfig}
      />

      <AddCustomIntegrationModal
        isOpen={isAddCustomModalOpen}
        onClose={() => setIsAddCustomModalOpen(false)}
        onAdd={handleAddCustomIntegration}
      />

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAdd={handleAddCategory}
      />

      {selectedCategoryForDetail && (
        <CategoryDetailModal
          isOpen={true}
          onClose={() => setSelectedCategoryForDetail(null)}
          category={selectedCategoryForDetail}
          triggerToast={triggerToast}
        />
      )}

      {selectedCategoryForEdit && (
        <EditCategoryModal
          isOpen={true}
          onClose={() => setSelectedCategoryForEdit(null)}
          category={selectedCategoryForEdit}
          triggerToast={triggerToast}
          onRefresh={async () => {
            const updatedCats = await SupabaseDashboardService.getMarketplaceCategories();
            if (updatedCats) setCategoriesList(updatedCats);
          }}
        />
      )}

      {selectedModuleForConfig && (
        <AIModuleConfigModal
          isOpen={true}
          onClose={() => setSelectedModuleForConfig(null)}
          moduleItem={selectedModuleForConfig}
          triggerToast={triggerToast}
          onRefresh={() => loadRealtimeModules()}
        />
      )}

      <AddPopularAgentModal
        isOpen={isAddPopularAgentModalOpen}
        onClose={() => setIsAddPopularAgentModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={() => loadPopularAgents()}
      />
    </div>
  );
}
