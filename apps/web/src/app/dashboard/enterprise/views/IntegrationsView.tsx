import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Search, Filter, CheckCircle2, AlertTriangle, 
  XCircle, ArrowUpRight, ArrowDownRight, RefreshCw, ExternalLink, ChevronDown, X,
  ArrowLeft, Clock, ShieldCheck, Activity
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';

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
  const [viewMode, setViewMode] = useState<'grid' | 'activity_log'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Integrations');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [envFilter, setEnvFilter] = useState<string>('Production');

  // Activity Log Sub-Page State
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newIntegrationName, setNewIntegrationName] = useState<string>('');
  const [newIntegrationCat, setNewIntegrationCat] = useState<string>('Databases');
  const [newIntegrationUrl, setNewIntegrationUrl] = useState<string>('');

  // Dropdown States for Header Buttons
  const [showEnvDropdown, setShowEnvDropdown] = useState<boolean>(false);
  const [showCatDropdown, setShowCatDropdown] = useState<boolean>(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('All Status');

  // Interactive Diagram State
  const [selectedTopologyNode, setSelectedTopologyNode] = useState<string>('gateway');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categories = [
    'All Integrations', 'Connected', 'Databases', 'Communication', 
    'Payments', 'Storage', 'CRM', 'DevOps', 'AI/ML', 'Security'
  ];

  const envOptions = ['Production', 'Staging', 'Development'];
  const statusOptions = ['All Status', 'Connected', 'Healthy', 'Warning', 'Error'];

  const [integrationsList, setIntegrationsList] = useState<IntegrationItem[]>([
    { id: 'supabase', name: 'Supabase', category: 'Databases', status: 'connected', uptime: '99.99%', latency: '120ms', logo: getR2CdnUrl('/assets/logo/supabase.png'), fallbackLogo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg' },
    { id: 'stripe', name: 'Stripe', category: 'Payments', status: 'connected', uptime: '99.98%', latency: '132ms', logo: getR2CdnUrl('/assets/visualization/stripe.webp'), fallbackLogo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stripe/stripe-original.svg' },
    { id: 'slack', name: 'Slack', category: 'Communication', status: 'connected', uptime: '99.95%', latency: '95ms', logo: getR2CdnUrl('/assets/visualization/slack.webp'), fallbackLogo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg' },
    { id: 'whatsapp', name: 'WhatsApp Business', category: 'Communication', status: 'connected', uptime: '99.90%', latency: '105ms', logo: getR2CdnUrl('/assets/logo/whatsapp-for-business.webp'), fallbackLogo: 'https://cdn.simpleicons.org/whatsapp/25D366' },
    { id: 'telegram', name: 'Telegram Bot', category: 'Communication', status: 'connected', uptime: '99.98%', latency: '65ms', logo: getR2CdnUrl('/assets/logo/telegram.webp'), fallbackLogo: 'https://cdn.simpleicons.org/telegram/26A5E4' },
    { id: 'google_workspace', name: 'Google Workspace', category: 'Productivity', status: 'connected', uptime: '99.99%', latency: '80ms', logo: getR2CdnUrl('/assets/logo/google_drive.png'), fallbackLogo: 'https://cdn.simpleicons.org/google/4285F4' },
    { id: 'hubspot', name: 'HubSpot', category: 'CRM', status: 'connected', uptime: '99.92%', latency: '140ms', logo: getR2CdnUrl('/assets/logo/hubspot.png'), fallbackLogo: 'https://cdn.simpleicons.org/hubspot/FF7A59' },
    { id: 'salesforce', name: 'Salesforce', category: 'CRM', status: 'connected', uptime: '99.92%', latency: '155ms', logo: getR2CdnUrl('/assets/logo/salesforce.jpeg'), fallbackLogo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg' },
    { id: 'github', name: 'GitHub', category: 'DevOps', status: 'connected', uptime: '99.94%', latency: '90ms', logo: getR2CdnUrl('/assets/logo/github.svg'), fallbackLogo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
    { id: 'cloudflare', name: 'Cloudflare', category: 'DevOps', status: 'connected', uptime: '100%', latency: '36ms', logo: getR2CdnUrl('/assets/logo/Cloudflare_Logo.png'), fallbackLogo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cloudflare/cloudflare-original.svg' },
    { id: 'aws_s3', name: 'AWS S3', category: 'Storage', status: 'connected', uptime: '99.99%', latency: '78ms', logo: getR2CdnUrl('/assets/logo/aws_s3.webp'), fallbackLogo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
    { id: 'sendgrid', name: 'SendGrid', category: 'Communication', status: 'connected', uptime: '99.90%', latency: '110ms', logo: getR2CdnUrl('/assets/logo/sendgrid.webp'), fallbackLogo: 'https://cdn.simpleicons.org/sendgrid/1A82E2' },
    { id: 'notion', name: 'Notion', category: 'Productivity', status: 'connected', uptime: '99.90%', latency: '95ms', logo: getR2CdnUrl('/assets/logo/notion.png'), fallbackLogo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/notion/notion-original.svg' },
    { id: 'mongodb', name: 'MongoDB', category: 'Databases', status: 'connected', uptime: '99.97%', latency: '123ms', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
    { id: 'redis_cloud', name: 'Redis Cloud', category: 'Databases', status: 'connected', uptime: '99.96%', latency: '81ms', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg' }
  ]);

  const [activities, setActivities] = useState<any[]>([
    { id: 1, title: 'Stripe Integration updated', desc: 'Credentials refreshed successfully', time: '2m ago', status: 'success' },
    { id: 2, title: 'HubSpot Webhook enabled', desc: 'New deal webhook connected', time: '1h ago', status: 'success' },
    { id: 3, title: 'Slack connection reauthorized', desc: 'OAuth Token refreshed', time: '15m ago', status: 'warning' },
    { id: 4, title: 'Google Drive connected', desc: 'Drive sync enabled for AI workforce', time: '2h ago', status: 'success' }
  ]);

  const loadDataFromSupabase = async () => {
    try {
      const [integrationsRes, actRes] = await Promise.all([
        enterpriseSupabaseService.getIntegrations(selectedCategory),
        enterpriseSupabaseService.getIntegrationActivities()
      ]);

      if (integrationsRes.data && integrationsRes.data.length > 0) {
        const fallbackMap: Record<string, string> = {
          supabase: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg',
          stripe: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stripe/stripe-original.svg',
          slack: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg',
          whatsapp: 'https://cdn.simpleicons.org/whatsapp/25D366',
          telegram: 'https://cdn.simpleicons.org/telegram/26A5E4',
          google_workspace: 'https://cdn.simpleicons.org/google/4285F4',
          hubspot: 'https://cdn.simpleicons.org/hubspot/FF7A59',
          salesforce: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg',
          github: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
          cloudflare: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cloudflare/cloudflare-original.svg',
          aws_s3: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
          sendgrid: 'https://cdn.simpleicons.org/sendgrid/1A82E2',
          notion: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/notion/notion-original.svg',
          mongodb: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
          redis_cloud: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg'
        };

        const mapped = integrationsRes.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          status: item.status || 'connected',
          uptime: item.uptime_str || '99.99%',
          latency: item.latency_str || `${item.latency_ms || 120}ms`,
          logo: getR2CdnUrl(item.logo_url || '/assets/logo/external-api.png'),
          fallbackLogo: fallbackMap[item.id] || 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg'
        }));
        setIntegrationsList(mapped);
      }

      if (actRes.data && actRes.data.length > 0) {
        const mappedActs = actRes.data.map((a: any) => ({
          id: a.id,
          title: a.title,
          desc: a.description,
          time: 'Just now',
          status: a.status
        }));
        setActivities(mappedActs);
      }
    } catch (e) {
      // Keep static defaults on offline fallback
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
    const unsubscribe = enterpriseSupabaseService.subscribeToIntegrationsRealtime(() => {
      loadDataFromSupabase();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedCategory]);

  const handleAddIntegration = async () => {
    if (!newIntegrationName.trim()) {
      onTriggerToast?.('Please enter integration name!');
      return;
    }
    const newId = newIntegrationName.toLowerCase().replace(/\s+/g, '_');
    const newItem: IntegrationItem = {
      id: newId,
      name: newIntegrationName,
      category: newIntegrationCat,
      status: 'connected',
      uptime: '99.99%',
      latency: '115ms',
      logo: getR2CdnUrl('/assets/logo/external-api.png')
    };

    setIntegrationsList(prev => [newItem, ...prev]);
    onTriggerToast?.(`Successfully connected integration: ${newIntegrationName}`);
    
    // Save to Supabase
    await enterpriseSupabaseService.addIntegration({
      name: newIntegrationName,
      category: newIntegrationCat,
      api_endpoint: newIntegrationUrl || `https://api.${newId}.com/v1`,
      environment: envFilter
    });

    setNewIntegrationName('');
    setNewIntegrationUrl('');
    setShowAddModal(false);
  };

  // Filtered Activities for Sub-Page View
  const filteredActivities = activities.filter(act => {
    const matchesSearch = act.title.toLowerCase().includes(activitySearch.toLowerCase()) ||
                          act.desc.toLowerCase().includes(activitySearch.toLowerCase());
    if (activityStatusFilter === 'all') return matchesSearch;
    return matchesSearch && act.status === activityStatusFilter;
  });

  const filteredIntegrations = integrationsList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'All Integrations') return matchesSearch;
    if (selectedCategory === 'Connected') return matchesSearch && item.status === 'connected';
    return matchesSearch && item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  if (viewMode === 'activity_log') {
    return (
      <div className="space-y-6">
        {/* SUB-PAGE BREADCRUMB & HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <button 
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Integrations
            </button>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="text-indigo-600 dark:text-indigo-400 size-6" />
              Integration Activity Logs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of all real-time webhooks, API requests, credentials refresh, and system sync events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadDataFromSupabase()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
            >
              <RefreshCw size={13} />
              <span>Sync Database</span>
            </button>
          </div>
        </div>

        {/* LOG METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Logged Events</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{activities.length}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">Live Sync</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Success Rate</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">99.8%</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">Normal</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Warnings</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">1</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">Monitored</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Critical Errors</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">0</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Clean</span>
            </div>
          </div>
        </div>

        {/* SEARCH & STATUS FILTER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search audit logs..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['all', 'success', 'warning', 'error'].map((st) => (
              <button
                key={st}
                onClick={() => setActivityStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize cursor-pointer transition-colors ${
                  activityStatusFilter === st 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* FULL ACTIVITY LOG TABLE */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredActivities.map((act) => (
              <div 
                key={act.id} 
                className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className={`size-3 rounded-full shrink-0 mt-1 ${
                    act.status === 'warning' ? 'bg-amber-500' : 
                    act.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{act.title}</h4>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                        act.status === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' :
                        act.status === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400' :
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}>
                        {act.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{act.desc}</p>
                    <p className="text-[10px] font-mono text-slate-400">Endpoint: https://api.zegaai.site/v1/integrations/telemetry</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1 justify-end">
                    <Clock size={12} /> {act.time}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1 block">HTTP 200 OK</span>
                </div>
              </div>
            ))}

            {filteredActivities.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No activity log matching filter "{activitySearch}"
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          {/* Environment Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowEnvDropdown(!showEnvDropdown);
                setShowCatDropdown(false);
                setShowStatusDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-all shadow-2xs"
            >
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{envFilter}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showEnvDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showEnvDropdown && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 space-y-0.5">
                {envOptions.map(env => (
                  <button
                    key={env}
                    onClick={() => {
                      setEnvFilter(env);
                      setShowEnvDropdown(false);
                      onTriggerToast?.(`Switched environment to ${env}`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                      envFilter === env 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{env}</span>
                    {envFilter === env && <CheckCircle2 size={12} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44 transition-all"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowCatDropdown(!showCatDropdown);
                setShowEnvDropdown(false);
                setShowStatusDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer transition-all ${
                selectedCategory !== 'All Integrations' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Filter size={14} />
              <span>{selectedCategory === 'All Integrations' ? 'Categories' : selectedCategory}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showCatDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCatDropdown && (
              <div className="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 space-y-0.5 scrollbar-thin">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCatDropdown(false);
                      onTriggerToast?.(`Filtered by category: ${cat}`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <CheckCircle2 size={12} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowEnvDropdown(false);
                setShowCatDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer transition-all ${
                statusFilter !== 'All Status' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{statusFilter}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 space-y-0.5">
                {statusOptions.map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setShowStatusDropdown(false);
                      onTriggerToast?.(`Filtered status: ${st}`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                      statusFilter === st 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{st}</span>
                    {statusFilter === st && <CheckCircle2 size={12} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Integration Primary Action */}
          <button 
            onClick={() => setShowAddModal(true)}
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
          onClick={() => setShowAddModal(true)}
          className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center text-center cursor-pointer min-h-[130px] space-y-1.5 transition-all group"
        >
          <div className="size-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={18} />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Add Integration</span>
          <span className="text-[10px] text-slate-400">Connect new service</span>
        </div>
      </div>

      {/* INTERACTIVE TELEMETRY & TOPOLOGY FLOW MAP DIAGRAM */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              Live Integration Routing & Telemetry Topology
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time edge gateway routing, packet rates, and active node status</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
              1,420 req/s • 100% Operational
            </span>
          </div>
        </div>

        {/* Enterprise Topology Canvas with Grid-Locked Physical Cable Connectors */}
        <div className="relative bg-slate-950 rounded-2xl p-5 overflow-hidden border border-slate-800/90 text-white shadow-2xl space-y-4">
          {/* Background Technical Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />

          {/* Interactive Topology Nodes Grid with Embedded Anchor Sockets */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-0 lg:gap-0 items-center my-2">
            {/* NODE 1: Core Gateway */}
            <div 
              onClick={() => {
                setSelectedTopologyNode('gateway');
                onTriggerToast?.('Active Route: ZEGA Edge Router (1,420 req/s)');
              }}
              className={`p-4 rounded-xl bg-slate-900/95 border transition-all cursor-pointer space-y-2.5 relative group ${
                selectedTopologyNode === 'gateway' 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900 shadow-xl shadow-indigo-500/10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Output Anchor Socket */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center size-6 rounded-full bg-slate-950 border-2 border-indigo-500 shadow-md z-20">
                <span className="size-2 rounded-full bg-indigo-400 animate-pulse" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
                  <span className="size-2 rounded-full bg-indigo-400 animate-pulse" />
                  Core Gateway
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-800/80">
                  100% Up
                </span>
              </div>
              <p className="text-sm font-black text-white">ZEGA Edge Router</p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
                <span>gRPC / HTTP2</span>
                <span className="text-emerald-400 font-bold">12ms • 1,420 req/s</span>
              </div>
            </div>

            {/* PHYSICALLY ATTACHED CABLE 1: Gateway -> Event Stream */}
            <div className="hidden lg:flex items-center justify-center w-12 xl:w-16 z-10">
              <div className="w-full relative flex items-center justify-center">
                {/* Main Glowing Vector Line */}
                <div className={`h-1 w-full rounded-full transition-all ${
                  selectedTopologyNode === 'gateway' || selectedTopologyNode === 'bus'
                    ? 'bg-gradient-to-r from-indigo-500 via-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]'
                    : 'bg-slate-800'
                }`} />
                {/* Data Packet Pulse Orbs */}
                <div className="absolute left-1 size-2 rounded-full bg-indigo-400 animate-ping" />
                <div className="absolute right-1 size-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>

            {/* NODE 2: Event Stream */}
            <div 
              onClick={() => {
                setSelectedTopologyNode('bus');
                onTriggerToast?.('Active Route: Supabase Realtime Bus (3.2k msg/m)');
              }}
              className={`p-4 rounded-xl bg-slate-900/95 border transition-all cursor-pointer space-y-2.5 relative group ${
                selectedTopologyNode === 'bus' 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-slate-900 shadow-xl shadow-emerald-500/10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Input Anchor Socket */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center size-6 rounded-full bg-slate-950 border-2 border-emerald-500 shadow-md z-20">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              {/* Output Anchor Socket */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center size-6 rounded-full bg-slate-950 border-2 border-emerald-500 shadow-md z-20">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Event Stream
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-800/80">
                  Realtime
                </span>
              </div>
              <p className="text-sm font-black text-white">Supabase Realtime Bus</p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
                <span>WebSocket WSS</span>
                <span className="text-emerald-400 font-bold">3.2k msg/m</span>
              </div>
            </div>

            {/* PHYSICALLY ATTACHED CABLE 2: Event Stream -> Cloud Target */}
            <div className="hidden lg:flex items-center justify-center w-12 xl:w-16 z-10">
              <div className="w-full relative flex items-center justify-center">
                {/* Main Glowing Vector Line */}
                <div className={`h-1 w-full rounded-full transition-all ${
                  selectedTopologyNode === 'bus' || selectedTopologyNode === 'services'
                    ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                    : 'bg-slate-800'
                }`} />
                {/* Data Packet Pulse Orbs */}
                <div className="absolute left-1 size-2 rounded-full bg-emerald-400 animate-ping" />
                <div className="absolute right-1 size-2 rounded-full bg-amber-400 animate-ping" />
              </div>
            </div>

            {/* NODE 3: Cloud Target */}
            <div 
              onClick={() => {
                setSelectedTopologyNode('services');
                onTriggerToast?.('Active Route: SaaS Cloud APIs (Stripe, Slack, AWS)');
              }}
              className={`p-4 rounded-xl bg-slate-900/95 border transition-all cursor-pointer space-y-2.5 relative group ${
                selectedTopologyNode === 'services' 
                  ? 'border-amber-500 ring-2 ring-amber-500/30 bg-slate-900 shadow-xl shadow-amber-500/10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Input Anchor Socket */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center size-6 rounded-full bg-slate-950 border-2 border-amber-500 shadow-md z-20">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
                  <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                  Cloud Target
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-800/80">
                  Healthy
                </span>
              </div>
              <p className="text-sm font-black text-white">Cloud APIs & SaaS</p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/80">
                <span>REST TLS v1.3</span>
                <span className="text-emerald-400 font-bold">15 Active Services</span>
              </div>
            </div>
          </div>

          {/* ACTIVE ROUTE TELEMETRY INSPECTOR BAR */}
          <div className="relative z-10 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Active Topology Route:</span>
              <span className="font-mono font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
                {selectedTopologyNode === 'gateway' ? 'ZEGA Edge Gateway (1,420 req/s • gRPC)' :
                 selectedTopologyNode === 'bus' ? 'Supabase Realtime Stream (3.2k msg/m • WSS)' :
                 'SaaS Target Cloud Endpoints (Stripe, Slack, AWS • HTTPS)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onTriggerToast?.(`Pinged ${selectedTopologyNode} route: 12ms latency OK`)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[11px] cursor-pointer transition-colors shadow-sm"
              >
                Ping Route
              </button>
              <button 
                onClick={() => {
                  if (selectedTopologyNode === 'gateway') setSelectedCategory('DevOps');
                  else if (selectedTopologyNode === 'bus') setSelectedCategory('Databases');
                  else setSelectedCategory('Communication');
                  onTriggerToast?.(`Filtered integrations for node route: ${selectedTopologyNode}`);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-[11px] cursor-pointer transition-colors border border-slate-700"
              >
                Filter Node Services
              </button>
            </div>
          </div>
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
            <button 
              onClick={() => setViewMode('activity_log')}
              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {activities.slice(0, 4).map((act) => (
              <div 
                key={act.id} 
                className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`size-2 rounded-full shrink-0 mt-0.5 ${
                    act.status === 'warning' ? 'bg-amber-500' : 
                    act.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {act.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{act.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1/3 width): Interactive Categories Overview Donut Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Categories Overview</span>
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Live Diagram</span>
          </h3>

          <div className="flex items-center justify-center py-2 relative">
            <svg className="size-28 -rotate-90 transition-transform hover:scale-105" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="3.8"
                className="dark:stroke-slate-800"
              />
              {/* Database 12/58 = 20.6% */}
              <path
                onMouseEnter={() => setHoveredCategory('Databases')}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => {
                  setSelectedCategory('Databases');
                  onTriggerToast?.('Filtered integrations: Databases');
                }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#6366F1"
                strokeWidth={hoveredCategory === 'Databases' ? "5" : "3.8"}
                strokeDasharray="21, 100"
                className="cursor-pointer transition-all hover:stroke-indigo-400"
              />
              {/* Communication 10/58 = 17.2% */}
              <path
                onMouseEnter={() => setHoveredCategory('Communication')}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => {
                  setSelectedCategory('Communication');
                  onTriggerToast?.('Filtered integrations: Communication');
                }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10B981"
                strokeWidth={hoveredCategory === 'Communication' ? "5" : "3.8"}
                strokeDasharray="17, 100"
                strokeDashoffset="-21"
                className="cursor-pointer transition-all hover:stroke-emerald-400"
              />
              {/* Storage 8/58 = 13.7% */}
              <path
                onMouseEnter={() => setHoveredCategory('Storage')}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => {
                  setSelectedCategory('Storage');
                  onTriggerToast?.('Filtered integrations: Storage');
                }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={hoveredCategory === 'Storage' ? "5" : "3.8"}
                strokeDasharray="14, 100"
                strokeDashoffset="-38"
                className="cursor-pointer transition-all hover:stroke-amber-400"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                {hoveredCategory === 'Databases' ? '12' : hoveredCategory === 'Communication' ? '10' : hoveredCategory === 'Storage' ? '8' : '58'}
              </span>
              <span className="text-[8px] text-slate-400 font-semibold uppercase">
                {hoveredCategory || 'Integrations'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <button 
              onClick={() => setSelectedCategory('Databases')}
              className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-md transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-indigo-500" /> Databases
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">12 <span className="text-[9px] text-emerald-500 font-normal">+2</span></span>
            </button>

            <button 
              onClick={() => setSelectedCategory('Communication')}
              className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-md transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-emerald-500" /> Communication
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">10 <span className="text-[9px] text-emerald-500 font-normal">+1</span></span>
            </button>

            <button 
              onClick={() => setSelectedCategory('Storage')}
              className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-md transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-amber-500" /> Storage
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">8 <span className="text-[9px] text-emerald-500 font-normal">+3</span></span>
            </button>

            <button 
              onClick={() => setSelectedCategory('CRM')}
              className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-md transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-purple-500" /> CRM
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">8 <span className="text-[9px] text-emerald-500 font-normal">+1</span></span>
            </button>

            <button 
              onClick={() => setSelectedCategory('DevOps')}
              className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-md transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-cyan-500" /> DevOps
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">7</span>
            </button>

            <button 
              onClick={() => setSelectedCategory('AI/ML')}
              className="w-full flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1 rounded-md transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-pink-500" /> AI/ML
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">6 <span className="text-[9px] text-emerald-500 font-normal">+2</span></span>
            </button>
          </div>
        </div>
      </div>

      {/* ADD INTEGRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus size={18} className="text-indigo-500" />
                Add New Enterprise Integration
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Integration Name</label>
                <input
                  type="text"
                  value={newIntegrationName}
                  onChange={(e) => setNewIntegrationName(e.target.value)}
                  placeholder="e.g. Snowflake DW, PostgreSQL, Custom Webhook"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                <select
                  value={newIntegrationCat}
                  onChange={(e) => setNewIntegrationCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="Databases">Databases</option>
                  <option value="Communication">Communication</option>
                  <option value="Payments">Payments</option>
                  <option value="Storage">Storage</option>
                  <option value="CRM">CRM</option>
                  <option value="DevOps">DevOps</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">API Endpoint / Connection URL</label>
                <input
                  type="text"
                  value={newIntegrationUrl}
                  onChange={(e) => setNewIntegrationUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIntegration}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                Connect Integration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
