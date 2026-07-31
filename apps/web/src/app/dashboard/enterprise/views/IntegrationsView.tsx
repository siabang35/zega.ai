import React, { useState } from 'react';
import { 
  Layers, Plus, Search, Filter, CheckCircle2, AlertTriangle, 
  XCircle, ArrowUpRight, ArrowDownRight, RefreshCw, ExternalLink, ChevronDown
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';

interface IntegrationsViewProps {
  onTriggerToast?: (msg: string) => void;
}

interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'warning' | 'error' | 'disconnected';
  uptime: string;
  latency: string;
  logo: string;
  fallbackLogo?: string;
  desc?: string;
}

export function IntegrationsView({ onTriggerToast }: IntegrationsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Integrations');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [envFilter, setEnvFilter] = useState<string>('Production');

  const categories = [
    'All Integrations', 'Connected', 'Databases', 'Communication', 
    'Payments', 'Storage', 'CRM', 'DevOps', 'AI/ML', 'Security'
  ];

  const integrationsList: IntegrationItem[] = [
    {
      id: 'supabase',
      name: 'Supabase',
      category: 'Databases',
      status: 'connected',
      uptime: '99.99%',
      latency: '120ms',
      logo: getR2CdnUrl('/assets/logo/supabase.png'),
      fallbackLogo: '/assets/logo/supabase.png'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      category: 'Payments',
      status: 'connected',
      uptime: '99.98%',
      latency: '132ms',
      logo: getR2CdnUrl('/assets/visualization/stripe.webp'),
      fallbackLogo: '/assets/visualization/stripe.webp'
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Communication',
      status: 'connected',
      uptime: '99.95%',
      latency: '95ms',
      logo: getR2CdnUrl('/assets/visualization/slack.webp'),
      fallbackLogo: '/assets/visualization/slack.webp'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      category: 'Communication',
      status: 'connected',
      uptime: '99.90%',
      latency: '105ms',
      logo: getR2CdnUrl('/assets/logo/whatsapp-for-business.webp'),
      fallbackLogo: getR2CdnUrl('/assets/logo/whatsapp-for-business.webp')
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      category: 'Communication',
      status: 'connected',
      uptime: '99.98%',
      latency: '65ms',
      logo: getR2CdnUrl('/assets/logo/telegram.webp'),
      fallbackLogo: getR2CdnUrl('/assets/logo/telegram.webp')
    },
    {
      id: 'google_workspace',
      name: 'Google Workspace',
      category: 'Productivity',
      status: 'connected',
      uptime: '99.99%',
      latency: '80ms',
      logo: getR2CdnUrl('/assets/logo/google_drive.png'),
      fallbackLogo: '/assets/logo/google_drive.png'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      category: 'CRM',
      status: 'connected',
      uptime: '99.92%',
      latency: '140ms',
      logo: getR2CdnUrl('/assets/logo/hubspot.png'),
      fallbackLogo: '/assets/logo/hubspot.png'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      category: 'CRM',
      status: 'connected',
      uptime: '99.92%',
      latency: '155ms',
      logo: getR2CdnUrl('/assets/logo/salesforce.jpeg'),
      fallbackLogo: '/assets/logo/salesforce.jpeg'
    },
    {
      id: 'github',
      name: 'GitHub',
      category: 'DevOps',
      status: 'connected',
      uptime: '99.94%',
      latency: '90ms',
      logo: getR2CdnUrl('/assets/logo/github.svg'),
      fallbackLogo: '/assets/logo/github.svg'
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      category: 'Edge & CDN',
      status: 'connected',
      uptime: '100%',
      latency: '36ms',
      logo: getR2CdnUrl('/assets/logo/Cloudflare_Logo.png'),
      fallbackLogo: '/assets/logo/Cloudflare_Logo.png'
    },
    {
      id: 'aws_s3',
      name: 'AWS S3',
      category: 'Storage',
      status: 'connected',
      uptime: '99.99%',
      latency: '78ms',
      logo: getR2CdnUrl('/assets/logo/aws_s3.webp'),
      fallbackLogo: '/assets/logo/aws_s3.webp'
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      category: 'Email',
      status: 'connected',
      uptime: '99.90%',
      latency: '110ms',
      logo: getR2CdnUrl('/assets/logo/sendgrid.webp'),
      fallbackLogo: '/assets/logo/sendgrid.webp'
    },
    {
      id: 'notion',
      name: 'Notion',
      category: 'Productivity',
      status: 'connected',
      uptime: '99.90%',
      latency: '95ms',
      logo: getR2CdnUrl('/assets/logo/notion.png'),
      fallbackLogo: '/assets/logo/notion.png'
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      category: 'Databases',
      status: 'connected',
      uptime: '99.97%',
      latency: '123ms',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg'
    },
    {
      id: 'redis_cloud',
      name: 'Redis Cloud',
      category: 'Databases',
      status: 'connected',
      uptime: '99.96%',
      latency: '81ms',
      logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg'
    }
  ];

  const filteredIntegrations = integrationsList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'All Integrations') return matchesSearch;
    if (selectedCategory === 'Connected') return matchesSearch && item.status === 'connected';
    return matchesSearch && item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="text-indigo-600 dark:text-indigo-400 size-6" />
            Integrations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect and manage all external services, apps, databases, and tools.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Environment Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>{envFilter}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          {/* Category Filter */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <Filter size={14} />
            <span>Categories</span>
          </button>

          {/* Status Filter */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <span>Status</span>
          </button>

          {/* Add Integration Primary Action */}
          <button 
            onClick={() => onTriggerToast?.('Integrasi Baru Ditambahkan')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Plus size={15} />
            <span>Add Integration</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS (5 Horizontal Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Integrations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">58</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +12%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 30 days</span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Connected</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">48</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +10%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 30 days</span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Healthy</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">46</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +8%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 30 days</span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Warning</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">2</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <ArrowDownRight size={10} /> -50%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 30 days</span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Error</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">0</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
              --
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 30 days</span>
        </div>
      </div>

      {/* CATEGORY TABS NAV */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* INTEGRATION CARDS GRID (3x5 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {filteredIntegrations.map((item) => (
          <div 
            key={item.id}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-3 shadow-2xs group"
          >
            <div className="flex items-start justify-between">
              <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 p-1.5 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center">
                <img 
                  src={item.logo} 
                  alt={item.name}
                  className="size-full object-contain"
                  onError={(e) => {
                    if (item.fallbackLogo) {
                      (e.currentTarget as HTMLImageElement).src = item.fallbackLogo;
                    }
                  }}
                />
              </div>
              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                {item.category}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {item.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Connected</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9.5px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500" /> {item.uptime} uptime
              </span>
              <span>{item.latency}</span>
            </div>
          </div>
        ))}

        {/* Add Integration Placeholder Card */}
        <div 
          onClick={() => onTriggerToast?.('Integrasi Baru Ditambahkan')}
          className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center text-center cursor-pointer min-h-[130px] space-y-1.5 transition-all group"
        >
          <div className="size-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={18} />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Add Integration</span>
          <span className="text-[10px] text-slate-400">Connect new service</span>
        </div>
      </div>

      {/* BOTTOM SECTION (Split 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2/3 width): Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Recent Activity
            </h3>
            <button className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Stripe Integration updated
                  </p>
                  <p className="text-[10px] text-slate-400">Credentials refreshed successfully</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">2m ago</span>
            </div>

            <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    HubSpot Webhook enabled
                  </p>
                  <p className="text-[10px] text-slate-400">New deal webhook connected</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">1h ago</span>
            </div>

            <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Slack connection reauthorized
                  </p>
                  <p className="text-[10px] text-slate-400">Token refreshed</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">15m ago</span>
            </div>

            <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Google Drive connected
                  </p>
                  <p className="text-[10px] text-slate-400">Drive sync enabled</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">2h ago</span>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Categories Overview Donut Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Categories Overview
          </h3>

          <div className="flex items-center justify-center py-2 relative">
            <svg className="size-28 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="3.8"
                className="dark:stroke-slate-800"
              />
              {/* Database 12/58 = 20.6% */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#6366F1"
                strokeWidth="3.8"
                strokeDasharray="21, 100"
              />
              {/* Communication 10/58 = 17.2% */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10B981"
                strokeWidth="3.8"
                strokeDasharray="17, 100"
                strokeDashoffset="-21"
              />
              {/* Storage 8/58 = 13.7% */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.8"
                strokeDasharray="14, 100"
                strokeDashoffset="-38"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">58</span>
              <span className="text-[8px] text-slate-400 font-semibold uppercase">Integrations</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-indigo-500" /> Databases
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">12 <span className="text-[9px] text-emerald-500 font-normal">+2</span></span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-emerald-500" /> Communication
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">10 <span className="text-[9px] text-emerald-500 font-normal">+1</span></span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-amber-500" /> Storage
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">8 <span className="text-[9px] text-emerald-500 font-normal">+3</span></span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-purple-500" /> CRM
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">8 <span className="text-[9px] text-emerald-500 font-normal">+1</span></span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-cyan-500" /> DevOps
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">7</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-pink-500" /> AI/ML
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">6 <span className="text-[9px] text-emerald-500 font-normal">+2</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
