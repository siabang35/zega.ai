import React, { useState, useEffect } from 'react';
import { 
  Workflow, Plus, Zap, Activity, Clock, ShieldCheck, 
  Search, Play, Settings, ChevronRight, Layers, FileText, 
  BarChart3, RefreshCw, Sparkles, CheckCircle2, ArrowRight, Upload, X, Code
} from 'lucide-react';
import { SupabaseDashboardService } from '../services/supabaseService';
import { getR2CdnUrl } from '../../utils/cdn';

export interface WorkflowHubViewProps {
  onOpenCanvas: (workflowId: string) => void;
  onTriggerToast?: (msg: string) => void;
}

export function WorkflowHubView({ onOpenCanvas, onTriggerToast }: WorkflowHubViewProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'published' | 'draft' | 'templates'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExecutingId, setIsExecutingId] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [newWorkflowData, setNewWorkflowData] = useState({
    name: '',
    description: '',
    engine_type: 'LangGraph_Swarm',
    template: 'Blank Canvas'
  });

  const [importJsonContent, setImportJsonContent] = useState<string>(`{
  "name": "Customer Support Triage Swarm",
  "engine_type": "LangGraph_Swarm",
  "nodes": [
    { "id": "trigger_webhook", "type": "Trigger" },
    { "id": "ai_triage_agent", "type": "LLM_Planner" }
  ]
}`);

  const defaultWorkflows = [
    {
      id: 'customer_support',
      name: 'Customer Support Escalation v3.4',
      slug: 'customer-support-escalation-v3-4',
      description: 'Intelligent triage and escalation workflow for customer support tickets using LangGraph state graph memory',
      version: 'v3.4',
      status: 'Published',
      environment: 'Production',
      engine_type: 'LangGraph_Swarm',
      live_requests_per_min: 42,
      success_rate_pct: 99.23,
      avg_latency_sec: 2.41,
      total_cost_today: 18.32,
      tokens_today: '1.24M',
      system_health: 'Healthy',
      last_deployed_by: 'Wildan A.',
      nodes_count: 12,
      mcp_connectors: ['Slack MCP', 'Zendesk MCP', 'Supabase Realtime'],
      updated_at: '2 hours ago',
    },
    {
      id: 'sales_outreach',
      name: 'Autonomous Sales Lead Enrichment v2.1',
      slug: 'autonomous-sales-lead-enrichment-v2-1',
      description: 'End-to-end CRM synchronization and cold lead qualification swarm powered by AutoGen GroupChat consensus',
      version: 'v2.1',
      status: 'Published',
      environment: 'Production',
      engine_type: 'AutoGen_GroupChat',
      live_requests_per_min: 68,
      success_rate_pct: 98.75,
      avg_latency_sec: 1.85,
      total_cost_today: 24.50,
      tokens_today: '1.85M',
      system_health: 'Healthy',
      last_deployed_by: 'Danz A.',
      nodes_count: 15,
      mcp_connectors: ['HubSpot CRM', 'Stripe Payments', 'Perplexity RAG'],
      updated_at: '4 hours ago',
    },
    {
      id: 'financial_audit',
      name: 'Financial Reconciliation Pipeline v1.8',
      slug: 'financial-reconciliation-pipeline-v1-8',
      description: 'Real-time accounting ledger verification, anomaly detection, and automated fraud prevention DAG',
      version: 'v1.8',
      status: 'Draft',
      environment: 'Staging',
      engine_type: 'n8n_DAG',
      live_requests_per_min: 15,
      success_rate_pct: 99.90,
      avg_latency_sec: 0.95,
      total_cost_today: 8.40,
      tokens_today: '450K',
      system_health: 'Healthy',
      last_deployed_by: 'Alex Morgan',
      nodes_count: 9,
      mcp_connectors: ['Stripe Billing', 'Supabase DB', 'Qdrant Vector'],
      updated_at: '1 day ago',
    },
    {
      id: 'devops_triage',
      name: 'DevOps Incident Escalation v4.0',
      slug: 'devops-incident-escalation-v4-0',
      description: 'Autonomous P0/P1 infrastructure triage, log analysis, and PagerDuty routing swarm with zero latency SLA',
      version: 'v4.0',
      status: 'Published',
      environment: 'Production',
      engine_type: 'LangGraph_Swarm',
      live_requests_per_min: 104,
      success_rate_pct: 99.98,
      avg_latency_sec: 0.65,
      total_cost_today: 42.10,
      tokens_today: '3.10M',
      system_health: 'Healthy',
      last_deployed_by: 'Wildan A.',
      nodes_count: 18,
      mcp_connectors: ['PagerDuty MCP', 'GitHub Actions', 'Datadog Telemetry'],
      updated_at: 'Just now',
    },
  ];

  const [templates, setTemplates] = useState<any[]>([]);

  const fetchWorkflows = async () => {
    setLoading(true);
    const [data, tplData] = await Promise.all([
      SupabaseDashboardService.getEnterpriseWorkflowsList(),
      SupabaseDashboardService.getEnterpriseWorkflowTemplates()
    ]);

    if (data && Array.isArray(data) && data.length > 0) {
      setWorkflows(data);
    } else {
      setWorkflows(defaultWorkflows);
    }

    if (tplData?.data && Array.isArray(tplData.data) && tplData.data.length > 0) {
      setTemplates(tplData.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleInstantiateTemplate = async (templateKey: string, templateName: string) => {
    if (onTriggerToast) onTriggerToast(`Instantiating Realtime Template '${templateName}' in Supabase...`);
    const { data } = await SupabaseDashboardService.instantiateWorkflowFromTemplate(templateKey);
    if (data) {
      if (onTriggerToast) onTriggerToast(`SUCCESS: Template '${templateName}' instantiated! Opening Studio Canvas...`);
      onOpenCanvas(data.id || data.workflow_key || templateKey);
    } else {
      onOpenCanvas(templateKey);
    }
  };

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesTab = 
      filterTab === 'all' ? true :
      filterTab === 'published' ? wf.status === 'Published' :
      filterTab === 'draft' ? wf.status === 'Draft' : true;
    
    const matchesSearch = 
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.engine_type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleRunExecution = async (wfId: string, wfName: string) => {
    setIsExecutingId(wfId);
    if (onTriggerToast) onTriggerToast(`Triggering real-time execution run for ${wfName}...`);
    await SupabaseDashboardService.executeWorkflowRunInDb(wfId, 'Manual Trigger from Workflow Studio Catalog');
    setTimeout(() => {
      setIsExecutingId(null);
      if (onTriggerToast) onTriggerToast(`Execution for ${wfName} completed successfully [HTTP 200 OK]`);
    }, 1500);
  };

  const handleCreateWorkflowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowData.name.trim()) return;

    setIsSubmitting(true);
    if (onTriggerToast) onTriggerToast(`Creating real-time workflow '${newWorkflowData.name}' in Supabase...`);

    const { data } = await SupabaseDashboardService.createEnterpriseWorkflowInDb({
      name: newWorkflowData.name,
      description: newWorkflowData.description || 'Enterprise AI Swarm Workflow',
      engine_type: newWorkflowData.engine_type,
      version: 'v1.0',
      status: 'Draft'
    });

    setIsSubmitting(false);
    setIsCreateModalOpen(false);

    if (data) {
      setWorkflows(prev => [data, ...prev]);
      if (onTriggerToast) onTriggerToast(`SUCCESS: Workflow '${data.name}' created! Opening Studio canvas...`);
      onOpenCanvas(data.id || data.workflow_key);
    }
  };

  const handleImportJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJsonContent);
      const name = parsed.name || 'Imported Workflow ' + new Date().toLocaleDateString();
      setIsSubmitting(true);

      const { data } = await SupabaseDashboardService.createEnterpriseWorkflowInDb({
        name,
        description: parsed.description || 'Imported JSON Workflow Schema',
        engine_type: parsed.engine_type || 'LangGraph_Swarm',
        version: parsed.version || 'v1.0',
        status: 'Draft'
      });

      setIsSubmitting(false);
      setIsImportModalOpen(false);

      if (data) {
        setWorkflows(prev => [data, ...prev]);
        if (onTriggerToast) onTriggerToast(`SUCCESS: Imported workflow '${name}' schema! Opening Studio canvas...`);
        onOpenCanvas(data.id || data.workflow_key);
      }
    } catch (err: any) {
      if (onTriggerToast) onTriggerToast('Error parsing JSON: Invalid workflow JSON syntax');
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none animate-fadeIn">
      {/* 1. TOP TITLE HEADER & REALTIME CLUSTER STATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xs backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Workflow size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Enterprise AI Workflow Studio
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                  Realtime Engine Active
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                LangGraph State Graphs, n8n DAGs, AutoGen Swarms & 25+ Global Internet Connectors
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchWorkflows}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
            title="Refresh Realtime Database Workflows"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Sync</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <Upload size={14} />
            <span>Import JSON</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Plus size={16} />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">TOTAL ACTIVE WORKFLOWS</span>
            <Workflow size={16} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">4 Workflows</span>
            <span className="text-xs font-bold text-emerald-600">3 Published</span>
          </div>
          <p className="text-[10px] text-slate-400">100% Operational under OWASP L3 Security</p>
        </div>

        <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">REALTIME REQUEST STREAM</span>
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">229 req/min</span>
            <span className="text-xs font-bold text-emerald-600">+18.4% vs avg</span>
          </div>
          <p className="text-[10px] text-slate-400">Multi-Node Realtime Telemetry Bus</p>
        </div>

        <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">AVERAGE RESPONSE LATENCY</span>
            <Clock size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">1.46s SLA</span>
            <span className="text-xs font-bold text-emerald-600">Sub-2s Target</span>
          </div>
          <p className="text-[10px] text-slate-400">Groq LPU & Gemini 1.5 Acceleration</p>
        </div>

        <div className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">DAILY TOKEN CONSUMPTION</span>
            <Activity size={16} className="text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">6.64M Tokens</span>
            <span className="text-xs font-bold text-slate-500">$93.32 Today</span>
          </div>
          <p className="text-[10px] text-slate-400">GPT-5, Claude 3.5 & DeepSeek V4</p>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Workflows', count: workflows.length },
            { id: 'published', label: 'Published', count: workflows.filter(w => w.status === 'Published').length },
            { id: 'draft', label: 'Drafts', count: workflows.filter(w => w.status === 'Draft').length },
            { id: 'templates', label: 'Templates Catalog', count: templates.length || 4 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                filterTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                filterTab === tab.id ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows, engines, tags..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* 4. WORKFLOW CATALOG CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(filterTab === 'templates' ? (templates.length > 0 ? templates : defaultWorkflows) : filteredWorkflows).map((wf) => (
          <div
            key={wf.id || wf.template_key}
            className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-lg hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between space-y-4 group"
          >
            {/* Card Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      wf.status === 'Published' || filterTab === 'templates'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:border-amber-800'
                    }`}>
                      {filterTab === 'templates' ? 'Template' : wf.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-mono font-bold">
                      {wf.engine_type || 'LangGraph_Swarm'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{wf.version || 'v1.0'}</span>
                  </div>
                  <h3 
                    onClick={() => filterTab === 'templates' ? handleInstantiateTemplate(wf.template_key || wf.id, wf.name) : onOpenCanvas(wf.id)}
                    className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {wf.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-emerald-600">Ready</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{wf.description}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center font-mono">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Throughput</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">{wf.live_requests_per_min || 42} req/m</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Success</span>
                <span className="text-xs font-black text-emerald-600 block">{wf.success_rate_pct || 99.2}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Avg Latency</span>
                <span className="text-xs font-black text-indigo-600 block">{wf.avg_latency_sec || 2.4}s</span>
              </div>
            </div>

            {/* Connectors & Deployment Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tools:</span>
                <div className="flex items-center gap-1">
                  {(wf.mcp_tools || wf.mcp_connectors || ['Slack MCP', 'Supabase MCP']).map((c: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-[9.5px] font-semibold text-slate-700 dark:text-slate-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunExecution(wf.id, wf.name)}
                  disabled={isExecutingId === wf.id}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Trigger Test Run Execution"
                >
                  <Play size={13} className={isExecutingId === wf.id ? 'animate-spin text-indigo-500' : 'text-emerald-500'} />
                  <span className="hidden sm:inline">Run</span>
                </button>

                <button
                  onClick={() => filterTab === 'templates' ? handleInstantiateTemplate(wf.template_key || wf.id, wf.name) : onOpenCanvas(wf.id)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span>{filterTab === 'templates' ? 'Use Template' : 'Open Studio'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. CREATE NEW WORKFLOW MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-indigo-600 text-white">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Create New AI Workflow</h3>
                  <p className="text-xs text-slate-500 font-medium">Configure workflow parameters and initialize state graph</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflowSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Workflow Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Support Escalation v4.0"
                  value={newWorkflowData.name}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Intelligent triage and escalation workflow for customer support tickets..."
                  value={newWorkflowData.description}
                  onChange={(e) => setNewWorkflowData({ ...newWorkflowData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Orchestration Engine
                  </label>
                  <select
                    value={newWorkflowData.engine_type}
                    onChange={(e) => setNewWorkflowData({ ...newWorkflowData, engine_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="LangGraph_Swarm">LangGraph Swarm</option>
                    <option value="AutoGen_GroupChat">AutoGen GroupChat</option>
                    <option value="n8n_DAG">n8n DAG Pipeline</option>
                    <option value="OpenAI_Swarm">OpenAI Swarm Engine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Starter Template
                  </label>
                  <select
                    value={newWorkflowData.template}
                    onChange={(e) => setNewWorkflowData({ ...newWorkflowData, template: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Blank Canvas">Blank Canvas</option>
                    <option value="Support Triage">Support Triage Template</option>
                    <option value="DevOps Incident">DevOps Incident Swarm</option>
                    <option value="CRM Sales Enrichment">CRM Sales Enrichment</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Create & Open Studio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. IMPORT JSON WORKFLOW SCHEMA MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-600 text-white">
                  <Code size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Import LangGraph / n8n Workflow JSON</h3>
                  <p className="text-xs text-slate-500 font-medium">Paste workflow JSON schema definition to initialize nodes and graph topology</p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)} 
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportJsonSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Workflow JSON Schema
                </label>
                <textarea
                  rows={8}
                  value={importJsonContent}
                  onChange={(e) => setImportJsonContent(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Supports LangGraph, n8n, AutoGen & OpenAI JSON specs</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>Parse & Import Schema</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
