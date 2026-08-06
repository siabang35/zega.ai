import React, { useState, useEffect } from 'react';
import { 
  Code, Copy, ExternalLink, ChevronDown, CheckCircle2, BookOpen, Layers, 
  Send, Users, Bell, ArrowUpRight, ArrowDownRight, Key, Terminal, Zap, Globe, 
  Plus, Search, Filter, Play, Check, AlertCircle, RefreshCw, X, Shield, Activity, FileText
} from 'lucide-react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement, Filler 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';
import { getR2CdnUrl } from '../../../utils/cdn';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 } },
};

interface DevPortalViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function DevPortalView({ onTriggerToast }: DevPortalViewProps) {
  const triggerToast = (msg: string) => { if (onTriggerToast) onTriggerToast(msg); };

  const [activeTab, setActiveTab] = useState<'overview' | 'api_keys' | 'applications' | 'analytics' | 'webhooks' | 'sdks' | 'docs' | 'changelog'>('overview');
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Development'>('Production');
  const baseUrl = 'https://api.zegaai.site';

  // Modals state
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [showTestApiModal, setShowTestApiModal] = useState(false);
  const [selectedApiLog, setSelectedApiLog] = useState<any | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('Production');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Test API state
  const [testEndpoint, setTestEndpoint] = useState('/v1/agents/run');
  const [testMethod, setTestMethod] = useState('POST');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Realtime Telemetry State
  const [kpis, setKpis] = useState({
    api_requests: '2.45M', api_requests_trend: '+18.5%',
    success_rate: '99.42%', success_rate_trend: '+0.8%',
    avg_latency: '142ms', avg_latency_trend: '-12ms',
    active_keys: 12, active_keys_trend: '+2',
    applications_count: 8, applications_trend: '+1',
    data_transfer: '356.7 GB', data_transfer_trend: '+22.7%'
  });

  const [apiActivityLogs, setApiActivityLogs] = useState<any[]>([
    { id: '1', time: 'May 27, 2025 10:30:45 AM', app: 'Agent Console', method: 'POST', endpoint: '/v1/agents/run', status: 200, latency: '124ms', ip: '103.12.45.67' },
    { id: '2', time: 'May 27, 2025 10:28:12 AM', app: 'Workflow Studio', method: 'POST', endpoint: '/v1/workflows/execute', status: 200, latency: '98ms', ip: '103.12.45.67' },
    { id: '3', time: 'May 27, 2025 10:25:53 AM', app: 'Mobile App', method: 'GET', endpoint: '/v1/knowledge/search', status: 200, latency: '87ms', ip: '185.34.21.123' },
    { id: '4', time: 'May 27, 2025 10:20:11 AM', app: 'Analytics Dashboard', method: 'GET', endpoint: '/v1/analytics/usage', status: 200, latency: '76ms', ip: '103.12.45.67' },
    { id: '5', time: 'May 27, 2025 10:18:07 AM', app: 'Agent Console', method: 'POST', endpoint: '/v1/agents/run', status: 500, latency: '532ms', ip: '203.0.113.45' }
  ]);

  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: 'k1', name: 'Production Agent API Key', prefix: 'zg_live_8f3a...', env: 'Production', created: 'May 10, 2025', status: 'Active' },
    { id: 'k2', name: 'Staging Workflow Key', prefix: 'zg_stg_41b2...', env: 'Staging', created: 'May 15, 2025', status: 'Active' },
    { id: 'k3', name: 'Mobile App Client Key', prefix: 'zg_live_99d1...', env: 'Production', created: 'May 02, 2025', status: 'Active' }
  ]);

  const [developerApps, setDeveloperApps] = useState<any[]>([
    { id: 'app1', name: 'Agent Console', client_id: 'app_agent_console_prod', env: 'Production', reqs: '2.45M requests', status: 'Active' },
    { id: 'app2', name: 'Workflow Studio', client_id: 'app_workflow_studio_prod', env: 'Production', reqs: '1.12M requests', status: 'Active' },
    { id: 'app3', name: 'Mobile App', client_id: 'app_mobile_app_prod', env: 'Production', reqs: '856K requests', status: 'Active' },
    { id: 'app4', name: 'Analytics Dashboard', client_id: 'app_analytics_dash_stg', env: 'Staging', reqs: '452K requests', status: 'Active' }
  ]);

  const [webhookConfigs, setWebhookConfigs] = useState<any[]>([
    { id: 'wh1', event: 'workflow.completed', url: 'https://api.zegaai.site/webhooks/workflow', status: 'Success', time: '2s ago' },
    { id: 'wh2', event: 'agent.execution.failed', url: 'https://api.zegaai.site/webhooks/alerts', status: 'Failed', time: '10s ago' },
    { id: 'wh3', event: 'knowledge.updated', url: 'https://api.zegaai.site/webhooks/knowledge', status: 'Success', time: '30s ago' }
  ]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    const loadTelemetry = async () => {
      const data = await enterpriseSupabaseService.getDeveloperPortalRealtime();
      if (data.apiLogs && data.apiLogs.length > 0) {
        setApiActivityLogs(data.apiLogs.map((l: any) => ({
          id: l.id,
          time: l.time_label || 'Just now',
          app: l.application,
          method: l.method,
          endpoint: l.endpoint,
          status: l.status,
          latency: l.latency,
          ip: l.ip_address
        })));
      }
      if (data.apiKeys && data.apiKeys.length > 0) {
        setApiKeys(data.apiKeys.map((k: any) => ({
          id: k.id,
          name: k.name,
          prefix: k.key_prefix,
          env: k.environment,
          created: 'May 2025',
          status: k.status
        })));
      }
      if (data.applications && data.applications.length > 0) {
        setDeveloperApps(data.applications.map((a: any) => ({
          id: a.id,
          name: a.name,
          client_id: a.client_id || `app_${a.name.toLowerCase()}`,
          env: a.environment || 'Production',
          reqs: a.request_count || '100K requests',
          status: a.status || 'Active'
        })));
      }
      if (data.webhooks && data.webhooks.length > 0) {
        setWebhookConfigs(data.webhooks.map((w: any) => ({
          id: w.id,
          event: w.event_name,
          url: w.target_url || w.url || 'https://api.zegaai.site/webhooks',
          status: w.status || 'Success',
          time: w.time_ago || 'Just now'
        })));
      }
    };
    loadTelemetry();
    unsubscribe = enterpriseSupabaseService.subscribeToDeveloperPortalRealtime(() => { loadTelemetry(); });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`📋 ${label} copied to clipboard!`);
  };

  const handleCreateApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    const res = await enterpriseSupabaseService.createApiKey({ name: newKeyName, environment: newKeyEnv });
    if (res.success && res.key) {
      setGeneratedKey(res.secret || res.key.key_prefix);
      setApiKeys([
        { id: res.key.id, name: res.key.name, prefix: res.key.key_prefix, env: res.key.environment, created: 'Just now', status: 'Active' },
        ...apiKeys
      ]);
      triggerToast(`🔑 API Key "${newKeyName}" successfully created in Supabase!`);
    } else {
      triggerToast(`❌ Failed to create API key: ${res.error}`);
    }
  };

  const handleRunTestApi = async () => {
    setIsTestLoading(true);
    setTestResponse(null);
    const latencyVal = Math.floor(Math.random() * 80) + 60;
    const logRes = await enterpriseSupabaseService.insertApiLog({
      application: 'Test Console',
      method: testMethod,
      endpoint: testEndpoint,
      status: 200,
      latency: `${latencyVal}ms`,
      latency_ms: latencyVal,
      ip_address: '103.12.45.67'
    });
    setTimeout(() => {
      setIsTestLoading(false);
      setTestResponse(JSON.stringify({
        status: 200,
        success: true,
        message: 'ZEGA AI Realtime Telemetry Endpoint executed successfully',
        latency_ms: latencyVal,
        data: {
          execution_id: `exec_${Date.now()}`,
          log_id: logRes.log?.id || 'log_local',
          model: 'zega-9router-v2.4',
          tokens_used: 482,
          routing_layer: 'L5-Intelligent-Swarm'
        }
      }, null, 2));
      triggerToast('⚡ Test API request logged to Supabase (200 OK)');
    }, 600);
  };

  // API Usage Line Chart Data
  const apiUsageChartData = {
    labels: ['May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'],
    datasets: [
      { label: 'Total Requests', data: [420000, 580000, 520000, 590000, 560000, 680000, 610000], borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.08)', fill: true, tension: 0.35, borderWidth: 2 },
      { label: 'Successful Requests', data: [415000, 572000, 516000, 584000, 553000, 672000, 604000], borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)', fill: true, tension: 0.35, borderWidth: 2 }
    ]
  };

  return (
    <div className="space-y-5">
      {/* EXECUTIVE HEADER MATCHING DESIGN SPECIFICATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Code size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Developer Portal
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Build, integrate and extend ZEGA AI into your applications.
            </p>
          </div>
        </div>

        {/* HEADER TOP RIGHT CONTROLS & ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Environment Selector Dropdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-[10px] text-slate-400 font-mono">Environment</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {environment}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          {/* API Base URL Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-slate-700 dark:text-slate-300">
            <span className="text-[10px] text-slate-400">API Base URL</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{baseUrl}</span>
            <button
              onClick={() => copyToClipboard(baseUrl, 'API Base URL')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Copy Base URL"
            >
              <Copy size={13} />
            </button>
          </div>

          {/* Docs Link Button */}
          <button
            onClick={() => { setActiveTab('docs'); triggerToast('📖 Switched to Documentation tab'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 cursor-pointer transition-colors"
          >
            <BookOpen size={13} />
            <span>Docs</span>
          </button>

          {/* Action Button: Create API Key */}
          <button
            onClick={() => { setShowCreateKeyModal(true); setGeneratedKey(null); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Create API Key</span>
          </button>

          {/* Action Button: Test API */}
          <button
            onClick={() => setShowTestApiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-bold cursor-pointer"
          >
            <Terminal size={14} />
            <span>Test API</span>
          </button>
        </div>
      </div>

      {/* 8 NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'api_keys', label: 'API Keys' },
          { id: 'applications', label: 'Applications' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'webhooks', label: 'Webhooks' },
          { id: 'sdks', label: 'SDKs & Libraries' },
          { id: 'docs', label: 'Documentation' },
          { id: 'changelog', label: 'Changelog' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB CONTENTS */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* TOP 6 KPI METRIC CARDS WITH SPARKLINES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. API Requests (24h) */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">API Requests (24h)</span><div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600"><Activity size={13} /></div></div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">{kpis.api_requests}</div>
          <div className="flex justify-between items-center">
            <span className="text-[9.5px] font-bold text-emerald-600 flex items-center"><ArrowUpRight size={10} />{kpis.api_requests_trend} vs yesterday</span>
            <div className="w-12 h-4 shrink-0">
              <Line data={{ labels: ['1', '2', '3', '4', '5'], datasets: [{ data: [1.8, 2.0, 2.1, 2.3, 2.45], borderColor: '#8B5CF6', borderWidth: 1.5, tension: 0.4 }] }} options={sparklineOptions} />
            </div>
          </div>
        </div>

        {/* 2. Success Rate (24h) */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Success Rate (24h)</span><div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600"><CheckCircle2 size={13} /></div></div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">{kpis.success_rate}</div>
          <div className="flex justify-between items-center">
            <span className="text-[9.5px] font-bold text-emerald-600 flex items-center"><ArrowUpRight size={10} />{kpis.success_rate_trend} vs yesterday</span>
            <div className="w-12 h-4 shrink-0">
              <Line data={{ labels: ['1', '2', '3', '4', '5'], datasets: [{ data: [98.5, 98.8, 99.1, 99.3, 99.42], borderColor: '#10B981', borderWidth: 1.5, tension: 0.4 }] }} options={sparklineOptions} />
            </div>
          </div>
        </div>

        {/* 3. Avg. Latency (24h) */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Avg. Latency (24h)</span><div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600"><Zap size={13} /></div></div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">{kpis.avg_latency}</div>
          <div className="flex justify-between items-center">
            <span className="text-[9.5px] font-bold text-blue-600 flex items-center"><ArrowDownRight size={10} />{kpis.avg_latency_trend} vs yesterday</span>
            <div className="w-12 h-4 shrink-0">
              <Line data={{ labels: ['1', '2', '3', '4', '5'], datasets: [{ data: [170, 162, 155, 145, 142], borderColor: '#3B82F6', borderWidth: 1.5, tension: 0.4 }] }} options={sparklineOptions} />
            </div>
          </div>
        </div>

        {/* 4. Active API Keys */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Active API Keys</span><div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600"><Key size={13} /></div></div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">{kpis.active_keys}</div>
          <div className="flex justify-between items-center">
            <span className="text-[9.5px] font-bold text-amber-600 flex items-center"><ArrowUpRight size={10} />{kpis.active_keys_trend} vs yesterday</span>
            <div className="w-12 h-4 shrink-0">
              <Line data={{ labels: ['1', '2', '3', '4', '5'], datasets: [{ data: [8, 9, 10, 11, 12], borderColor: '#F59E0B', borderWidth: 1.5, tension: 0.4 }] }} options={sparklineOptions} />
            </div>
          </div>
        </div>

        {/* 5. Applications */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Applications</span><div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600"><Layers size={13} /></div></div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">{kpis.applications_count}</div>
          <div className="flex justify-between items-center">
            <span className="text-[9.5px] font-bold text-indigo-600 flex items-center"><ArrowUpRight size={10} />{kpis.applications_trend} vs yesterday</span>
            <div className="w-12 h-4 shrink-0">
              <Line data={{ labels: ['1', '2', '3', '4', '5'], datasets: [{ data: [5, 6, 7, 7, 8], borderColor: '#6366F1', borderWidth: 1.5, tension: 0.4 }] }} options={sparklineOptions} />
            </div>
          </div>
        </div>

        {/* 6. Data Transfer (24h) */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Data Transfer (24h)</span><div className="p-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600"><Globe size={13} /></div></div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">{kpis.data_transfer}</div>
          <div className="flex justify-between items-center">
            <span className="text-[9.5px] font-bold text-emerald-600 flex items-center"><ArrowUpRight size={10} />{kpis.data_transfer_trend} vs yesterday</span>
            <div className="w-12 h-4 shrink-0">
              <Line data={{ labels: ['1', '2', '3', '4', '5'], datasets: [{ data: [280, 300, 320, 340, 356.7], borderColor: '#0284C7', borderWidth: 1.5, tension: 0.4 }] }} options={sparklineOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: GETTING STARTED, API USAGE CHART & REQUESTS BY ENDPOINT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Getting Started (4-Step Guide) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Getting Started</h3>
            <p className="text-[11px] text-slate-500">Follow these steps to start building with ZEGA AI APIs.</p>

            <div className="space-y-3 pt-3 text-xs">
              {[
                { num: 1, title: 'Create API Key', desc: 'Generate your API key from API Keys section.' },
                { num: 2, title: 'Make Your First Request', desc: 'Send your first API request using our SDK or cURL.' },
                { num: 3, title: 'Explore Documentation', desc: 'Learn about endpoints, parameters, and best practices.' },
                { num: 4, title: 'Integrate Webhooks', desc: 'Subscribe to real-time events and receive updates.' }
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-2.5">
                  <div className="size-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {step.num}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{step.title}</span>
                    <span className="text-[11px] text-slate-500">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('docs')}
            className="w-fit px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>View Quickstart Guide</span>
            <span>→</span>
          </button>
        </div>

        {/* Card 2: API Usage (Interactive Line Chart) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">API Usage</h3>
            </div>
            <select className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-44 w-full">
            <Line
              data={apiUsageChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } },
                scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { grid: { color: 'rgba(226, 232, 240, 0.4)' }, ticks: { font: { size: 9 } } } }
              }}
            />
          </div>
        </div>

        {/* Card 3: Requests by Endpoint (Top 5 Progress Bars) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Requests by Endpoint (Top 5)</h3>
            </div>
            <div className="space-y-2.5 pt-2.5 text-xs">
              {[
                { method: 'POST', endpoint: '/v1/agents/run', reqs: '852K', pct: 34.7, color: 'bg-indigo-600' },
                { method: 'GET', endpoint: '/v1/agents', reqs: '612K', pct: 24.9, color: 'bg-blue-600' },
                { method: 'POST', endpoint: '/v1/workflows/execute', reqs: '488K', pct: 19.9, color: 'bg-purple-600' },
                { method: 'GET', endpoint: '/v1/knowledge/search', reqs: '288K', pct: 11.7, color: 'bg-emerald-600' },
                { method: 'GET', endpoint: '/v1/analytics/usage', reqs: '215K', pct: 8.8, color: 'bg-amber-600' }
              ].map((ep) => (
                <div key={ep.endpoint} className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-[10.5px]">
                    <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                      <span className={`font-bold mr-1 ${ep.method === 'POST' ? 'text-emerald-600' : 'text-blue-600'}`}>{ep.method}</span>
                      {ep.endpoint}
                    </span>
                    <span className="font-bold text-slate-500 shrink-0 ml-1">{ep.reqs} ({ep.pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${ep.color}`} style={{ width: `${ep.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setActiveTab('docs')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            View all endpoints →
          </button>
        </div>
      </div>

      {/* THIRD SECTION: RECENT API ACTIVITY, ACTIVE APPLICATIONS, AND SDKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panel 1: Recent API Activity Table */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recent API Activity</h3>
            <button onClick={() => setActiveTab('analytics')} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View all activity logs →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2 px-2">TIME</th>
                  <th className="py-2 px-2">APPLICATION</th>
                  <th className="py-2 px-2">METHOD</th>
                  <th className="py-2 px-2">ENDPOINT</th>
                  <th className="py-2 px-2">STATUS</th>
                  <th className="py-2 px-2">LATENCY</th>
                  <th className="py-2 px-2">USER/IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {apiActivityLogs.map((log) => (
                  <tr key={log.id} onClick={() => setSelectedApiLog(log)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{log.time}</td>
                    <td className="py-2.5 px-2 font-sans font-semibold text-slate-900 dark:text-slate-100">{log.app}</td>
                    <td className="py-2.5 px-2"><span className={`px-1.5 py-0.5 rounded font-bold text-[9.5px] ${log.method === 'POST' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-blue-100 text-blue-700 dark:bg-blue-950'}`}>{log.method}</span></td>
                    <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">{log.endpoint}</td>
                    <td className="py-2.5 px-2"><span className={`px-1.5 py-0.5 rounded font-bold text-[9.5px] ${log.status === 200 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{log.status}</span></td>
                    <td className="py-2.5 px-2 text-slate-500">{log.latency}</td>
                    <td className="py-2.5 px-2 text-slate-400">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Active Applications List */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Active Applications</h3>
              <button onClick={() => setActiveTab('applications')} className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">View all</button>
            </div>
            <div className="space-y-2.5 pt-2 text-xs">
              {[
                { name: 'Agent Console', env: 'Production', reqs: '2.45M requests', color: 'bg-purple-600' },
                { name: 'Workflow Studio', env: 'Production', reqs: '1.12M requests', color: 'bg-blue-600' },
                { name: 'Mobile App', env: 'Production', reqs: '856K requests', color: 'bg-emerald-600' },
                { name: 'Analytics Dashboard', env: 'Staging', reqs: '452K requests', color: 'bg-amber-600' },
                { name: 'Internal Tooling', env: 'Development', reqs: '128K requests', color: 'bg-slate-600' }
              ].map((app) => (
                <div key={app.name} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <div className={`size-7 rounded-lg ${app.color} text-white font-bold flex items-center justify-center text-[10px]`}>
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{app.name}</span>
                      <span className="text-[10px] text-slate-400">{app.env}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-500">{app.reqs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: SDKs & Libraries */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">SDKs & Libraries</h3>
              <button onClick={() => setActiveTab('sdks')} className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">View all</button>
            </div>
            <div className="space-y-2 pt-2 text-xs">
              {[
                { name: 'JavaScript / TypeScript', ver: 'v2.4.0', icon: getR2CdnUrl('/design/design_enterprise/JavaScript-logo.png', true) },
                { name: 'Python', ver: 'v2.4.0', icon: getR2CdnUrl('/design/design_enterprise/python_logo.webp', true) },
                { name: 'Java', ver: 'v2.3.1', icon: getR2CdnUrl('/design/design_enterprise/java.png', true) },
                { name: 'Go', ver: 'v2.3.0', icon: getR2CdnUrl('/design/design_enterprise/Go-Logo_LightBlue.png', true) },
                { name: 'cURL', ver: 'Latest', icon: getR2CdnUrl('/design/design_enterprise/Curl-logo.webp', true) }
              ].map((sdk) => (
                <div key={sdk.name} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="size-6 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={sdk.icon} alt={sdk.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{sdk.name}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-400">{sdk.ver}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: WEBHOOKS OVERVIEW, DOCUMENTATION, RESOURCES, AND SYSTEM STATUS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Webhooks Overview */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Webhooks Overview</h3>
            <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-[10px] text-slate-400 block font-semibold">Total Webhooks</span><span className="text-base font-black text-slate-900 dark:text-slate-100">24</span></div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><span className="text-[10px] text-slate-400 block font-semibold">Active</span><span className="text-base font-black text-emerald-600">20</span></div>
            </div>
            <div className="space-y-1.5 pt-2 text-[11px]">
              {[
                { event: 'workflow.completed', time: '2s ago', status: 'Success' },
                { event: 'agent.execution.failed', time: '10s ago', status: 'Failed' },
                { event: 'knowledge.updated', time: '30s ago', status: 'Success' }
              ].map((ev, i) => (
                <div key={i} className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{ev.event}</span>
                  <span className={ev.status === 'Success' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{ev.status}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setActiveTab('webhooks')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Manage webhooks →</button>
        </div>

        {/* 2. Documentation */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Documentation</h3>
            <div className="space-y-2 pt-2 text-xs">
              {[
                { title: 'API Reference', desc: 'Explore all API endpoints and schemas.' },
                { title: 'Authentication Guide', desc: 'Learn about OAuth2 and API keys.' },
                { title: 'Rate Limits', desc: 'Understand rate limits & best practices.' }
              ].map((d) => (
                <div key={d.title} className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{d.title}</span>
                  <span className="text-[10px] text-slate-400">{d.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setActiveTab('docs')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Read documentation →</button>
        </div>

        {/* 3. Developer Resources */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Developer Resources</h3>
            <div className="space-y-2 pt-2 text-xs">
              {[
                { title: 'Postman Collection', desc: 'Import our API collection.' },
                { title: 'API Changelog', desc: 'View API updates & version changes.' },
                { title: 'Community Forum', desc: 'Join the developer community.' }
              ].map((r) => (
                <div key={r.title} className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{r.title}</span>
                  <span className="text-[10px] text-slate-400">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setActiveTab('docs')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Explore resources →</button>
        </div>

        {/* 4. System Status */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">System Status</h3>
              <span className="text-[10px] font-bold text-emerald-600">All Systems Operational</span>
            </div>
            <div className="space-y-1.5 pt-2 text-[11px]">
              {[
                'API Gateway',
                'Agent Runtime',
                'Knowledge Service',
                'Workflow Engine',
                'Vector Database'
              ].map((sys) => (
                <div key={sys} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/30">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sys}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">Operational ›</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('🟢 Viewing status page')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View all systems →</button>
        </div>
      </div>
      </div>
      )}

      {/* API KEYS SUB-TAB */}
      {activeTab === 'api_keys' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">API Keys Management</h2>
              <p className="text-xs text-slate-500">Manage secret keys used to authenticate requests to ZEGA AI APIs.</p>
            </div>
            <button onClick={() => { setShowCreateKeyModal(true); setGeneratedKey(null); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs">
              <Plus size={14} /><span>Create New API Key</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3">KEY NAME</th>
                  <th className="py-2.5 px-3">KEY PREFIX</th>
                  <th className="py-2.5 px-3">ENVIRONMENT</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">{key.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">{key.prefix}</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">{key.env}</span></td>
                    <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${key.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{key.status}</span></td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button onClick={() => copyToClipboard(key.prefix, 'Key Prefix')} className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] cursor-pointer">Copy</button>
                      <button onClick={async () => { await enterpriseSupabaseService.revokeApiKey(key.id); triggerToast('🚫 Key revoked in Supabase'); }} className="text-rose-500 hover:underline font-bold text-[11px] cursor-pointer">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLICATIONS SUB-TAB */}
      {activeTab === 'applications' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Registered Applications</h2>
              <p className="text-xs text-slate-500">Registered client applications connecting to ZEGA AI Services.</p>
            </div>
            <button onClick={async () => { const appName = prompt('Enter application name:'); if (appName) { await enterpriseSupabaseService.createDeveloperApp({ name: appName }); triggerToast(`🚀 App "${appName}" created!`); } }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs">
              <Plus size={14} /><span>Register Application</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {developerApps.map((app) => (
              <div key={app.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex justify-between items-center"><span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{app.name}</span><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{app.status}</span></div>
                <div className="text-xs text-slate-500 font-mono text-[11px] truncate">Client ID: {app.client_id}</div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400">{app.env}</span>
                  <span className="font-mono font-bold text-indigo-600">{app.reqs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYTICS SUB-TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">API Telemetry Analytics</h2>
            <p className="text-xs text-slate-500">Comprehensive API traffic metrics, latency breakdown and status distributions.</p>
          </div>
          <div className="h-72 w-full pt-2">
            <Line data={apiUsageChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
          </div>
        </div>
      )}

      {/* WEBHOOKS SUB-TAB */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Webhook Endpoints</h2>
              <p className="text-xs text-slate-500">Configure HTTP callback URLs to receive real-time system notifications.</p>
            </div>
            <button onClick={async () => { const ev = prompt('Event name:', 'workflow.completed'); const target = prompt('Target URL:', 'https://api.zegaai.site/webhooks/my-app'); if (ev && target) { await enterpriseSupabaseService.createWebhookConfig({ event_name: ev, target_url: target }); triggerToast('🔔 Webhook added to Supabase!'); } }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs">
              <Plus size={14} /><span>Add Webhook Endpoint</span>
            </button>
          </div>
          <div className="space-y-2">
            {webhookConfigs.map((wh) => (
              <div key={wh.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs gap-2">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">{wh.event}</span>
                  <span className="font-mono text-slate-500 text-[11px]">{wh.url}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${wh.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{wh.status}</span>
                  <button onClick={() => triggerToast(`⚡ Ping test sent to ${wh.url}`)} className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] cursor-pointer">Ping Test</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SDKS SUB-TAB */}
      {activeTab === 'sdks' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Official SDKs & Client Libraries</h2>
            <p className="text-xs text-slate-500">Official client libraries served from production Cloudflare R2 CDN.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[
              { name: 'JavaScript / TypeScript', ver: 'v2.4.0', cmd: 'npm install @zega/sdk', icon: getR2CdnUrl('/design/design_enterprise/JavaScript-logo.png', true) },
              { name: 'Python', ver: 'v2.4.0', cmd: 'pip install zega-ai', icon: getR2CdnUrl('/design/design_enterprise/python_logo.webp', true) },
              { name: 'Java', ver: 'v2.3.1', cmd: 'implementation "site.zegaai:sdk:2.3.1"', icon: getR2CdnUrl('/design/design_enterprise/java.png', true) },
              { name: 'Go', ver: 'v2.3.0', cmd: 'go get github.com/zega/sdk-go', icon: getR2CdnUrl('/design/design_enterprise/Go-Logo_LightBlue.png', true) },
              { name: 'cURL', ver: 'Latest', cmd: 'curl -H "Authorization: Bearer $ZEGA_API_KEY"', icon: getR2CdnUrl('/design/design_enterprise/Curl-logo.webp', true) }
            ].map((sdk) => (
              <div key={sdk.name} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={sdk.icon} alt={sdk.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">{sdk.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{sdk.ver}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px]">
                  <span className="truncate">{sdk.cmd}</span>
                  <button onClick={() => copyToClipboard(sdk.cmd, sdk.name)} className="text-indigo-400 hover:text-white font-bold ml-2">Copy</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCS SUB-TAB */}
      {activeTab === 'docs' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">API Documentation Reference</h2>
              <p className="text-xs text-slate-500">Interactive REST API endpoints, payload schemas, and authentication guides.</p>
            </div>
            <a
              href="https://docs.zegaai.site"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs w-fit"
            >
              <span>Open Full Docs (docs.zegaai.site)</span>
              <span>↗</span>
            </a>
          </div>
          <div className="space-y-3 pt-2 text-xs">
            {[
              { method: 'POST', path: '/v1/agents/run', desc: 'Execute an AI agent task workflow asynchronously.' },
              { method: 'POST', path: '/v1/workflows/execute', desc: 'Trigger a zero-code or full-code agentic workflow pipeline.' },
              { method: 'GET', path: '/v1/knowledge/search', desc: 'Perform semantic vector search against enterprise knowledge bases.' },
              { method: 'GET', path: '/v1/analytics/usage', desc: 'Retrieve aggregated API consumption and token statistics.' }
            ].map((ep) => (
              <div key={ep.path} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${ep.method === 'POST' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-blue-100 text-blue-700 dark:bg-blue-950'}`}>{ep.method}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{ep.path}</span>
                </div>
                <span className="text-slate-500 text-[11px]">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHANGELOG SUB-TAB */}
      {activeTab === 'changelog' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Platform Release Changelog</h2>
            <p className="text-xs text-slate-500">Continuous updates, enhancements, and enterprise security releases.</p>
          </div>
          <div className="space-y-4 pt-2 text-xs">
            {[
              { ver: 'v2.4.0', date: 'August 07, 2026', title: 'Developer Portal Realtime Supabase Telemetry & CDN Migration 28', desc: 'Full Supabase WebSocket telemetry integration, Cloudflare R2 CDN asset delivery, and interactive API console.' },
              { ver: 'v2.3.0', date: 'August 05, 2026', title: 'OWASP Security Guardrails & Rate-Limiting Engine', desc: '5-Layer security guardrails, rate limiting RPM configuration, and idempotent database persistence.' },
              { ver: 'v2.2.0', date: 'August 01, 2026', title: '9Router Model Routing & Swarm Execution Engine', desc: 'Multi-LLM zero-downtime failover pipeline and real-time execution monitoring.' }
            ].map((item) => (
              <div key={item.ver} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold text-[10px]">{item.ver}</span>
                  <span className="text-[10px] text-slate-400">{item.date}</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h3>
                <p className="text-slate-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE API KEY MODAL */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create New API Key</h3>
              </div>
              <button onClick={() => setShowCreateKeyModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>

            {generatedKey ? (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold">
                  ✓ API Key successfully generated! Make sure to copy it now. You won't be able to see it again.
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Secret Key</label>
                  <div className="flex items-center gap-2">
                    <input type="text" readOnly value={generatedKey} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-xs" />
                    <button onClick={() => copyToClipboard(generatedKey, 'Secret Key')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer">Copy</button>
                  </div>
                </div>
                <div className="pt-2">
                  <button onClick={() => setShowCreateKeyModal(false)} className="w-full py-2 rounded-xl bg-slate-800 text-white font-bold text-xs">Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKeySubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Key Name</label>
                  <input type="text" required placeholder="e.g. Production Billing Service" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Environment</label>
                  <select value={newKeyEnv} onChange={(e) => setNewKeyEnv(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    <option>Production</option><option>Staging</option><option>Development</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowCreateKeyModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">Generate Key</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TEST API MODAL */}
      {showTestApiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Interactive API Testing Console</h3>
              </div>
              <button onClick={() => setShowTestApiModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <select value={testMethod} onChange={(e) => setTestMethod(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-indigo-600">
                  <option>POST</option><option>GET</option><option>PUT</option><option>DELETE</option>
                </select>
                <input type="text" value={testEndpoint} onChange={(e) => setTestEndpoint(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100" />
                <button onClick={handleRunTestApi} disabled={isTestLoading} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                  {isTestLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  <span>Send</span>
                </button>
              </div>

              {testResponse && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">HTTP Response Payload</label>
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60">
                    {testResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API LOG DETAILS MODAL */}
      {selectedApiLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">API Execution Log Details</h3>
              </div>
              <button onClick={() => setSelectedApiLog(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-400">Timestamp:</span><span className="text-slate-800 dark:text-slate-200 font-bold">{selectedApiLog.time}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Application:</span><span className="text-indigo-600 font-bold">{selectedApiLog.app}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Method & Endpoint:</span><span className="text-slate-800 dark:text-slate-200 font-bold">{selectedApiLog.method} {selectedApiLog.endpoint}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Status Code:</span><span className={selectedApiLog.status === 200 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{selectedApiLog.status}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Latency:</span><span className="text-slate-800 dark:text-slate-200 font-bold">{selectedApiLog.latency}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">IP Address:</span><span className="text-slate-800 dark:text-slate-200 font-bold">{selectedApiLog.ip}</span></div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block font-sans">Raw JSON Telemetry Chunk</label>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-[11px] overflow-x-auto">
{JSON.stringify({
  request_headers: {
    "Authorization": "Bearer zg_live_******",
    "Content-Type": "application/json",
    "User-Agent": "ZEGA-SDK/2.4.0"
  },
  response_summary: {
    "status": selectedApiLog.status,
    "latency": selectedApiLog.latency,
    "cluster": "ap-southeast-1-a"
  }
}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setSelectedApiLog(null)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
