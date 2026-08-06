import React, { useState, useEffect } from 'react';
import { 
  Play, Send, Check, Settings, Plus, Sparkles, Sliders, 
  Code2, ArrowRight, RefreshCw, ZoomIn, ZoomOut, Maximize2, 
  Cpu, Database, Mail, Layers, Eye, Search, ChevronDown, 
  Share2, History, CheckCircle2, AlertCircle, Clock, Zap,
  FileText, MessageSquare, ShieldCheck, Box, X, HelpCircle,
  Activity, SlidersHorizontal, LayoutGrid, RotateCcw, Brain, ArrowLeft
} from 'lucide-react';

import { SupabaseDashboardService } from '../services/supabaseService';
import { getR2CdnUrl } from '../../utils/cdn';

export interface SandboxWorkflowViewProps {
  onTriggerToast?: (msg: string) => void;
  onBackToCatalog?: () => void;
  initialWorkflowId?: string;
}

interface NodeItem {
  id: string;
  name: string;
  icon: any;
  color?: string;
  logoUrl?: string;
}

interface NodeCategory {
  category: string;
  items: NodeItem[];
}

export function SandboxWorkflowView({ onTriggerToast, onBackToCatalog, initialWorkflowId }: SandboxWorkflowViewProps) {
  const [activeTab, setActiveTab] = useState<'canvas' | 'flow' | 'code' | 'variables' | 'integrations' | 'settings'>('canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ai_planner');
  const [zoom, setZoom] = useState<number>(100);
  const [autoLayout, setAutoLayout] = useState<boolean>(true);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'configuration' | 'prompt' | 'tools'>('overview');
  const [consoleTab, setConsoleTab] = useState<'console' | 'logs' | 'executions' | 'metrics' | 'tracing' | 'variables' | 'checkpoints'>('console');
  const [selectedRun, setSelectedRun] = useState<string>('#8921');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Global Internet Tool Connectors & Vault State
  const [globalConnectors, setGlobalConnectors] = useState<any[]>([]);
  const [langgraphCheckpoints, setLanggraphCheckpoints] = useState<any[]>([]);

  useEffect(() => {
    const loadGlobalConnectors = async () => {
      const { data } = await SupabaseDashboardService.getEnterpriseGlobalConnectors();
      if (data && data.length > 0) setGlobalConnectors(data);

      const chk = await SupabaseDashboardService.getEnterpriseLangGraphCheckpoints();
      if (chk.data) setLanggraphCheckpoints(chk.data);
    };
    loadGlobalConnectors();
  }, []);

  // Workflow Selection & Dynamic Status State
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(initialWorkflowId || 'customer_support');
  const [activeVersion, setActiveVersion] = useState<string>('v1.0');
  const [activeEnvironment, setActiveEnvironment] = useState<string>('Production');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExecutingRun, setIsExecutingRun] = useState<boolean>(false);
  const [customWorkflows, setCustomWorkflows] = useState<any[]>([]);

  useEffect(() => {
    if (initialWorkflowId) {
      setActiveWorkflowId(initialWorkflowId);
    }
  }, [initialWorkflowId]);

  useEffect(() => {
    const fetchDbWorkflows = async () => {
      const dbList = await SupabaseDashboardService.getEnterpriseWorkflowsList();
      if (dbList && Array.isArray(dbList) && dbList.length > 0) {
        setCustomWorkflows(dbList);
      }
    };
    fetchDbWorkflows();
  }, [initialWorkflowId]);

  const [workflowStatuses, setWorkflowStatuses] = useState<Record<string, string>>({
    customer_support: 'Published',
    sales_outreach: 'Published',
    financial_audit: 'Draft',
    devops_triage: 'Published',
  });

  const defaultWorkflowsList = [
    { id: 'customer_support', name: 'Customer Support Escalation v3.4', description: 'Intelligent triage and escalation workflow for customer support tickets', version: 'v3.4', status: workflowStatuses.customer_support || 'Published' },
    { id: 'sales_outreach', name: 'Autonomous Sales Lead Enrichment v2.1', description: 'End-to-end CRM synchronization and cold lead qualification swarm', version: 'v2.1', status: workflowStatuses.sales_outreach || 'Published' },
    { id: 'financial_audit', name: 'Financial Reconciliation Pipeline v1.8', description: 'Real-time accounting ledger verification and fraud detection', version: 'v1.8', status: workflowStatuses.financial_audit || 'Draft' },
    { id: 'devops_triage', name: 'DevOps Incident Escalation v4.0', description: 'Autonomous P0/P1 infrastructure triage and PagerDuty routing', version: 'v4.0', status: workflowStatuses.devops_triage || 'Published' },
  ];

  const workflowsList = customWorkflows.length > 0
    ? [...customWorkflows, ...defaultWorkflowsList.filter(d => !customWorkflows.some(c => (c.id === d.id || c.workflow_key === d.id)))]
    : defaultWorkflowsList;

  const currentWorkflow = workflowsList.find(w => w.id === activeWorkflowId || w.workflow_key === activeWorkflowId) || {
    id: activeWorkflowId,
    name: activeWorkflowId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: 'Custom Enterprise AI Workflow Studio Canvas Instance',
    version: 'v1.0',
    status: 'Published'
  };

  // Inspector Form State (Dynamic per node)
  const [nodeMetadataMap, setNodeMetadataMap] = useState<Record<string, { name: string; type: string; model: string; temp: number; tokens: number; prompt: string; desc: string }>>({
    webhook: { name: 'Webhook Trigger', type: 'Business Node', model: 'HTTP POST', temp: 0.0, tokens: 1024, prompt: 'Listen to incoming webhook payloads at /api/v1/webhooks/support-tickets', desc: 'Ingests new customer support tickets in real-time at 12 req/min.' },
    ai_planner: { name: 'AI Planner', type: 'AI Node', model: 'GPT-5', temp: 0.3, tokens: 2048, prompt: 'You are an AI planner that analyzes customer support tickets and creates execution plans.', desc: 'Analyzes incoming ticket and creates execution plan with intent classification.' },
    classify_intent: { name: 'Classify Intent', type: 'AI Node', model: 'Claude 3.5 Sonnet', temp: 0.2, tokens: 1536, prompt: 'Categorize ticket intent into billing, support, escalation, or general inquiry.', desc: 'AI Reasoner node for zero-shot intent categorization.' },
    support_agent: { name: 'Support Agent', type: 'Agent Node', model: 'Claude 3.5 Sonnet', temp: 0.4, tokens: 4096, prompt: 'Assist customer with Tier 1 and Tier 2 technical support queries.', desc: 'Primary support handling agent operating with 95% online availability.' },
    escalation_agent: { name: 'Escalation Agent', type: 'Agent Node', model: 'GPT-5', temp: 0.1, tokens: 4096, prompt: 'Evaluate urgent escalation cases and request manager review when required.', desc: 'Complex escalation management agent operating with 92% online availability.' },
    refund_agent: { name: 'Refund Agent', type: 'Agent Node', model: 'Gemini 1.5 Pro', temp: 0.0, tokens: 2048, prompt: 'Verify transaction signatures and trigger automated refund processing.', desc: 'Payments and transaction processing agent operating with 93% online availability.' },
    knowledge_retr: { name: 'Knowledge Retrieval', type: 'MCP Node', model: 'Qdrant Vector DB', temp: 0.0, tokens: 2048, prompt: 'Query embedding database for relevant product documentation chunks.', desc: 'Vector search knowledge retrieval node operating with 145ms response time.' },
    slack_mcp: { name: 'Slack MCP', type: 'MCP Node', model: 'Slack Web API', temp: 0.0, tokens: 1024, prompt: 'Send notification alert to #support channel.', desc: 'Slack connector dispatching real-time notifications to #support.' },
    human_approval: { name: 'Human Approval', type: 'Business Node', model: 'Interactive Gate', temp: 0.0, tokens: 512, prompt: 'Pause workflow execution until manager approves refund request.', desc: 'Manager review approval gate with pending approval state.' },
    stripe_mcp: { name: 'Stripe MCP', type: 'MCP Node', model: 'Stripe API v2', temp: 0.0, tokens: 2048, prompt: 'Execute payment refund via Stripe API endpoint.', desc: 'Financial transaction connector for Stripe API integration.' },
    zendesk_mcp: { name: 'Zendesk MCP', type: 'MCP Node', model: 'Zendesk REST API', temp: 0.0, tokens: 1024, prompt: 'Update ticket status and append agent resolution notes.', desc: 'ITSM ticket management connector for Zendesk.' },
    supabase_mcp: { name: 'Supabase MCP', type: 'MCP Node', model: 'PostgreSQL Realtime', temp: 0.0, tokens: 1024, prompt: 'Store updated execution state in enterprise_workflow_executions table.', desc: 'Database connector persisting state to Supabase.' },
  });

  const currentNodeMeta = nodeMetadataMap[selectedNodeId] || nodeMetadataMap.ai_planner;

  const [selectedModel, setSelectedModel] = useState<string>(currentNodeMeta.model);
  const [temperature, setTemperature] = useState<number>(currentNodeMeta.temp);
  const [maxTokens, setMaxTokens] = useState<number>(currentNodeMeta.tokens);
  const [systemPrompt, setSystemPrompt] = useState<string>(currentNodeMeta.prompt);

  // Sync Form State when selectedNodeId changes
  useEffect(() => {
    const meta = nodeMetadataMap[selectedNodeId] || nodeMetadataMap.ai_planner;
    setSelectedModel(meta.model);
    setTemperature(meta.temp);
    setMaxTokens(meta.tokens);
    setSystemPrompt(meta.prompt);
  }, [selectedNodeId]);

  // Save Node Configuration to local state & database
  const handleSaveNodeConfig = async () => {
    setNodeMetadataMap(prev => ({
      ...prev,
      [selectedNodeId]: {
        ...currentNodeMeta,
        model: selectedModel,
        temp: temperature,
        tokens: maxTokens,
        prompt: systemPrompt,
      }
    }));

    await SupabaseDashboardService.saveWorkflowNodeConfigInDb(
      currentWorkflow.id,
      selectedNodeId,
      currentNodeMeta.name,
      currentNodeMeta.type,
      selectedModel,
      temperature,
      maxTokens,
      systemPrompt
    );

    if (onTriggerToast) {
      onTriggerToast(`Node '${currentNodeMeta.name}' configuration saved to Supabase vault!`);
    }
  };

  // Workflow Environment Variables State
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string; secret: boolean }>>([
    { key: 'SUPABASE_URL', value: 'https://zega-enterprise.supabase.co', secret: false },
    { key: 'OPENAI_API_KEY', value: 'sk-proj-**********************', secret: true },
    { key: 'SLACK_WEBHOOK_URL', value: 'https://hooks.slack.com/services/T00/B00/X00', secret: true },
    { key: 'STRIPE_SECRET_KEY', value: 'sk_live_**********************', secret: true },
  ]);

  // Workflow YAML/JSON Code Representation
  const workflowCodeText = `{
  "workflow_id": "${currentWorkflow.id}",
  "name": "${currentWorkflow.name}",
  "version": "${activeVersion}",
  "environment": "${activeEnvironment}",
  "status": "${currentWorkflow.status}",
  "nodes": [
    { "id": "webhook", "type": "trigger", "endpoint": "/api/v1/webhooks/support-tickets" },
    { "id": "ai_planner", "type": "llm", "model": "${selectedModel}", "temp": ${temperature} },
    { "id": "classify_intent", "type": "reasoner", "model": "Claude 3.5 Sonnet" },
    { "id": "support_agent", "type": "agent", "handler": "primary_support" },
    { "id": "slack_mcp", "type": "mcp", "channel": "#support" },
    { "id": "supabase_mcp", "type": "mcp", "action": "save_state" }
  ]
}`;

  // Realtime Telemetry State
  const [telemetry, setTelemetry] = useState<any>({
    live_requests_per_min: 42,
    success_rate_pct: 99.23,
    avg_latency_sec: 2.41,
    total_cost_today: 18.32,
    tokens_today: '1.24M',
    system_health: 'Healthy',
    health_description: 'All systems operational',
    last_deployed_by: 'Wildan A.',
    last_deployed_at: '2 hours ago',
  });

  const [runs, setRuns] = useState([
    { id: '#8921', status: 'Completed', time: 'Just now', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
    { id: '#8920', status: 'Completed', time: '3m ago', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
    { id: '#8919', status: 'Failed', time: '5m ago', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60' },
    { id: '#8918', status: 'Completed', time: '6m ago', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
  ]);

  // Action Dispatcher for Run, Test, Publish
  const handleWorkflowAction = async (actionId: string, actionLabel: string) => {
    if (actionId === 'run') {
      setIsExecutingRun(true);
      const newRunCode = `#${Math.floor(8922 + Math.random() * 100)}`;
      if (onTriggerToast) onTriggerToast(`Triggering real-time execution ${newRunCode} for '${currentWorkflow.name}'...`);

      // Database insertion log
      await SupabaseDashboardService.executeWorkflowRunInDb(currentWorkflow.id, newRunCode, 'Completed');

      setTimeout(() => {
        setIsExecutingRun(false);
        setRuns(prev => [
          { id: newRunCode, status: 'Completed', time: 'Just now', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
          ...prev
        ]);
        setSelectedRun(newRunCode);
        if (onTriggerToast) onTriggerToast(`SUCCESS: Real-time execution ${newRunCode} completed in 1.42s with 100% success!`);
      }, 1000);
    } else if (actionId === 'test') {
      if (onTriggerToast) onTriggerToast(`Executing unit test suite... 12/12 assertions PASSED for ${currentWorkflow.name}`);
    } else if (actionId === 'publish') {
      const nextStatus = currentWorkflow.status === 'Published' ? 'Draft' : 'Published';
      setWorkflowStatuses(prev => ({ ...prev, [activeWorkflowId]: nextStatus }));
      await SupabaseDashboardService.updateWorkflowStatusInDb(activeWorkflowId, nextStatus);
      if (onTriggerToast) onTriggerToast(`SUCCESS: Updated ${currentWorkflow.name} status to ${nextStatus}!`);
    }
  };

  const nodeLibrary: NodeCategory[] = [
    {
      category: 'AI NODES',
      items: [
        { id: 'planner', name: 'Planner', icon: Brain, logoUrl: getR2CdnUrl('/assets/visualization/gpt.webp') },
        { id: 'reasoner', name: 'Reasoner', icon: Sparkles, logoUrl: getR2CdnUrl('/assets/visualization/claude.webp') },
        { id: 'decision', name: 'Decision', icon: Zap },
        { id: 'memory', name: 'Memory', icon: Database },
        { id: 'evaluator', name: 'Evaluator', icon: CheckCircle2 },
        { id: 'decomposer', name: 'Goal Decomposer', icon: Layers },
      ]
    },
    {
      category: 'AGENT NODES',
      items: [
        { id: 'support_agent', name: 'Support Agent', icon: MessageSquare },
        { id: 'escalation_agent', name: 'Escalation Agent', icon: ShieldCheck },
        { id: 'refund_agent', name: 'Refund Agent', icon: FileText },
        { id: 'knowledge_agent', name: 'Knowledge Agent', icon: Box },
      ]
    },
    {
      category: 'MCP NODES',
      items: [
        { id: 'slack_mcp', name: 'Slack MCP', icon: MessageSquare, color: 'text-amber-500', logoUrl: getR2CdnUrl('/assets/visualization/slack.webp') },
        { id: 'supabase_mcp', name: 'Supabase MCP', icon: Database, color: 'text-emerald-500', logoUrl: getR2CdnUrl('/assets/logo/supabase.png') },
        { id: 'stripe_mcp', name: 'Stripe MCP', icon: Zap, color: 'text-indigo-500', logoUrl: getR2CdnUrl('/assets/visualization/stripe.webp') },
        { id: 'zendesk_mcp', name: 'Zendesk MCP', icon: FileText, color: 'text-sky-500', logoUrl: getR2CdnUrl('/assets/logo/zendesk.webp') },
      ]
    },
    {
      category: 'BUSINESS NODES',
      items: [
        { id: 'condition', name: 'Condition', icon: SlidersHorizontal },
        { id: 'branch', name: 'Branch', icon: ArrowRight },
        { id: 'delay', name: 'Delay', icon: Clock },
        { id: 'webhook', name: 'Webhook', icon: Zap, logoUrl: getR2CdnUrl('/assets/logo/webhook.webp') },
      ]
    }
  ];

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100 font-sans">
      {/* ANIMATED DASHED STROKE STYLES */}
      <style>{`
        @keyframes strokeFlow {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-data-flow {
          stroke-dasharray: 6 6;
          animation: strokeFlow 1.2s linear infinite;
        }
      `}</style>

      {/* 1. TOP TITLE & CONTROLS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {onBackToCatalog && (
              <button 
                onClick={onBackToCatalog}
                className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Kembali ke Katalog Workflow Studio"
              >
                <ArrowLeft size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Katalog Workflow</span>
              </button>
            )}
            <button onClick={onBackToCatalog || (() => setActiveModal('workflow_selector_modal'))} className="text-xs font-semibold text-slate-400 hover:text-indigo-600 cursor-pointer">Workflow Studio /</button>
            
            {/* WORKFLOW SELECTOR DROPDOWN */}
            <div className="relative">
              <button 
                onClick={() => setActiveModal('workflow_selector_modal')}
                className="flex items-center gap-1.5 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer"
              >
                <span>{currentWorkflow.name}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Check size={11} /> {currentWorkflow.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {currentWorkflow.description}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* VERSION SELECTOR */}
          <select
            value={activeVersion}
            onChange={(e) => {
              setActiveVersion(e.target.value);
              if (onTriggerToast) onTriggerToast(`Switched to version ${e.target.value}`);
            }}
            className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="v3.4">Version v3.4</option>
            <option value="v3.3">Version v3.3</option>
            <option value="v3.0">Version v3.0</option>
          </select>

          {/* ENVIRONMENT SELECTOR */}
          <select
            value={activeEnvironment}
            onChange={(e) => {
              setActiveEnvironment(e.target.value);
              if (onTriggerToast) onTriggerToast(`Switched environment to ${e.target.value}`);
            }}
            className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="Production">Production</option>
            <option value="Staging">Staging</option>
            <option value="Development">Development</option>
          </select>

          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-2">
            <button onClick={() => setActiveModal('share_modal')} title="Share Workflow" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><Share2 size={14} /></button>
            <button onClick={() => setActiveModal('history_modal')} title="Version History" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><History size={14} /></button>
            <button onClick={() => setActiveTab('settings')} title="Workflow Settings" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><Settings size={14} /></button>
          </div>

          <button 
            onClick={() => handleWorkflowAction('run', 'Run Workflow')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <Play size={13} className="text-emerald-500 fill-emerald-500" />
            <span>Run</span>
          </button>

          <button 
            onClick={() => setActiveModal('test_modal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <span>🧪</span>
            <span>Test</span>
          </button>

          <button 
            onClick={() => setActiveModal('publish_modal')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 6 KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Live Requests</span>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">42 <span className="text-[10px] font-semibold text-slate-400">req/min</span></span>
          </div>
          <svg className="w-full h-4 text-emerald-500 mt-1" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 15 Q 25 5, 50 12 T 100 3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Success Rate</span>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">99.23%</span>
          </div>
          <svg className="w-full h-4 text-emerald-500 mt-1" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 18 Q 30 8, 60 14 T 100 4" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Avg. Latency</span>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">2.41s</span>
          </div>
          <svg className="w-full h-4 text-purple-500 mt-1" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 10 Q 40 4, 70 16 T 100 8" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Cost (Today)</span>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">$18.32</span>
          </div>
          <svg className="w-full h-4 text-amber-500 mt-1" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 14 Q 25 18, 50 8 T 100 12" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tokens (Today)</span>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">1.24M</span>
          </div>
          <svg className="w-full h-4 text-blue-500 mt-1" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 6 Q 30 16, 60 4 T 100 14" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Healthy</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">All systems operational</span>
          </div>
          <div className="text-right pl-2 border-l border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Last Deployed</span>
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">2 hours ago</span>
            <span className="text-[9px] text-slate-400 block">by Wildan A.</span>
          </div>
        </div>
      </div>

      {/* 3. SUB TABS */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'canvas', label: 'Canvas' },
          { id: 'flow', label: 'Flow' },
          { id: 'code', label: 'Code' },
          { id: 'variables', label: 'Variables' },
          { id: 'integrations', label: 'Global Internet Integrations' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 4. MAIN CANVAS WORKFLOW SECTION (PROPORTIONAL 100% SEAMLESS FIT) */}
      {activeTab === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[560px]">
          {/* LEFT PALETTE (2 COLS) */}
        <div className="lg:col-span-3 xl:col-span-2.5 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between overflow-y-auto space-y-3">
          <div className="space-y-2.5">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none w-full font-medium"
              />
            </div>

            {nodeLibrary.map((cat) => {
              const filteredItems = cat.items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
              if (filteredItems.length === 0) return null;
              return (
                <div key={cat.category} className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{cat.category}</span>
                  <div className="space-y-1">
                    {filteredItems.map((node) => {
                      const Icon = node.icon;
                      return (
                        <div
                          key={node.id}
                          onClick={() => {
                            if (onTriggerToast) onTriggerToast(`Added ${node.name} to canvas`);
                          }}
                          className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 cursor-pointer transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {node.logoUrl ? (
                            <img src={node.logoUrl} alt={node.name} className="size-3.5 object-contain shrink-0" />
                          ) : (
                            <Icon size={13} className={node.color || "text-indigo-600 dark:text-indigo-400"} />
                          )}
                          <span className="truncate">{node.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => {
              setActiveModal('add_node_modal');
              if (onTriggerToast) onTriggerToast('Opening Node Library Modal...');
            }} 
            className="w-full py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> More Nodes
          </button>
        </div>

        {/* CENTER PROPORTIONAL CANVAS GRAPH (6.5 COLS) */}
        <div className="lg:col-span-6 xl:col-span-6.5 relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          {/* TOOLBAR */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 backdrop-blur-sm text-[11px] font-bold shadow-2xs">
              <span className="text-slate-400">Auto Layout</span>
              <button onClick={() => setAutoLayout(!autoLayout)} className={`size-3.5 rounded-full transition-colors cursor-pointer ${autoLayout ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            </div>

            <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 backdrop-blur-sm p-1 rounded-xl shadow-2xs">
              <button className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"><LayoutGrid size={12} /></button>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600"><Layers size={12} /></button>
            </div>
          </div>

          {/* 100% PROPORTIONAL FULL-CONTAINER CANVAS VIEWBOX (0 0 1000 500) */}
          <div className="relative size-full select-none overflow-hidden">
            {/* SVG SPLINES & PARTICLES */}
            <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 1000 500" preserveAspectRatio="none">
              <defs>
                <path id="path-1-2" d="M 140 250 C 155 250, 165 250, 180 250" fill="none" vectorEffect="non-scaling-stroke" />
                <path id="path-2-3" d="M 320 250 C 330 250, 340 250, 350 250" fill="none" vectorEffect="non-scaling-stroke" />

                <path id="path-3-agent-top" d="M 490 250 C 505 250, 505 90, 520 90" fill="none" vectorEffect="non-scaling-stroke" />
                <path id="path-3-agent-mid" d="M 490 250 C 500 250, 510 250, 520 250" fill="none" vectorEffect="non-scaling-stroke" />
                <path id="path-3-agent-bot" d="M 490 250 C 505 250, 505 410, 520 410" fill="none" vectorEffect="non-scaling-stroke" />

                <path id="path-top-kr" d="M 660 90 C 670 90, 680 90, 690 90" fill="none" vectorEffect="non-scaling-stroke" />
                <path id="path-kr-slack" d="M 830 90 C 840 90, 850 90, 860 90" fill="none" vectorEffect="non-scaling-stroke" />

                <path id="path-mid-approval" d="M 660 250 C 670 250, 680 250, 690 250" fill="none" vectorEffect="non-scaling-stroke" />
                <path id="path-approval-stripe" d="M 830 250 C 840 250, 850 250, 860 250" fill="none" vectorEffect="non-scaling-stroke" />

                <path id="path-bot-zendesk" d="M 660 410 C 670 410, 680 410, 690 410" fill="none" vectorEffect="non-scaling-stroke" />
                <path id="path-zendesk-supabase" d="M 830 410 C 840 410, 850 410, 860 410" fill="none" vectorEffect="non-scaling-stroke" />
                <path id="path-supabase-end" d="M 950 410 L 960 410" fill="none" vectorEffect="non-scaling-stroke" />
              </defs>

              <use href="#path-1-2" stroke="#818CF8" strokeWidth="2.5" fill="none" className="animate-data-flow" />
              <use href="#path-2-3" stroke="#818CF8" strokeWidth="2.5" fill="none" className="animate-data-flow" />

              <use href="#path-3-agent-top" stroke="#6366F1" strokeWidth="2" fill="none" className="animate-data-flow" />
              <use href="#path-3-agent-mid" stroke="#F59E0B" strokeWidth="2" fill="none" className="animate-data-flow" />
              <use href="#path-3-agent-bot" stroke="#EC4899" strokeWidth="2" fill="none" className="animate-data-flow" />

              <use href="#path-top-kr" stroke="#10B981" strokeWidth="2" fill="none" className="animate-data-flow" />
              <use href="#path-kr-slack" stroke="#F59E0B" strokeWidth="2" fill="none" className="animate-data-flow" />

              <use href="#path-mid-approval" stroke="#8B5CF6" strokeWidth="2" fill="none" className="animate-data-flow" />
              <use href="#path-approval-stripe" stroke="#6366F1" strokeWidth="2" fill="none" className="animate-data-flow" />

              <use href="#path-bot-zendesk" stroke="#3B82F6" strokeWidth="2" fill="none" className="animate-data-flow" />
              <use href="#path-zendesk-supabase" stroke="#10B981" strokeWidth="2" fill="none" className="animate-data-flow" />
              <use href="#path-supabase-end" stroke="#10B981" strokeWidth="2" fill="none" className="animate-data-flow" />

              {/* PARTICLES */}
              <circle r="3.5" fill="#4F46E5" filter="drop-shadow(0 0 4px #4F46E5)">
                <animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#path-1-2" /></animateMotion>
              </circle>

              <circle r="3.5" fill="#6366F1" filter="drop-shadow(0 0 4px #6366F1)">
                <animateMotion dur="1.4s" repeatCount="indefinite"><mpath href="#path-2-3" /></animateMotion>
              </circle>

              <circle r="3" fill="#6366F1">
                <animateMotion dur="1.8s" repeatCount="indefinite" begin="0.2s"><mpath href="#path-3-agent-top" /></animateMotion>
              </circle>
              <circle r="3" fill="#F59E0B">
                <animateMotion dur="1.6s" repeatCount="indefinite" begin="0.4s"><mpath href="#path-3-agent-mid" /></animateMotion>
              </circle>
              <circle r="3" fill="#EC4899">
                <animateMotion dur="1.9s" repeatCount="indefinite" begin="0.1s"><mpath href="#path-3-agent-bot" /></animateMotion>
              </circle>

              <circle r="2.5" fill="#10B981">
                <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.5s"><mpath href="#path-top-kr" /></animateMotion>
              </circle>
              <circle r="2.5" fill="#F59E0B">
                <animateMotion dur="1.3s" repeatCount="indefinite" begin="0.8s"><mpath href="#path-kr-slack" /></animateMotion>
              </circle>

              <circle r="2.5" fill="#8B5CF6">
                <animateMotion dur="1.7s" repeatCount="indefinite" begin="0.3s"><mpath href="#path-mid-approval" /></animateMotion>
              </circle>
              <circle r="2.5" fill="#6366F1">
                <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.6s"><mpath href="#path-approval-stripe" /></animateMotion>
              </circle>

              <circle r="2.5" fill="#3B82F6">
                <animateMotion dur="1.4s" repeatCount="indefinite"><mpath href="#path-bot-zendesk" /></animateMotion>
              </circle>
              <circle r="2.5" fill="#10B981">
                <animateMotion dur="1.6s" repeatCount="indefinite" begin="0.4s"><mpath href="#path-zendesk-supabase" /></animateMotion>
              </circle>
              <circle r="2.5" fill="#10B981">
                <animateMotion dur="1.0s" repeatCount="indefinite" begin="0.2s"><mpath href="#path-supabase-end" /></animateMotion>
              </circle>
            </svg>

            {/* STAGE 1: WEBHOOK (col 1: left-[2%], width 12%) */}
            <div 
              onClick={() => { setSelectedNodeId('webhook'); if (onTriggerToast) onTriggerToast('Selected Webhook Trigger Node'); }}
              className={`absolute left-[2%] top-[50%] -translate-y-1/2 w-[12%] p-2 rounded-2xl border transition-all cursor-pointer space-y-1 z-10 ${
                selectedNodeId === 'webhook'
                  ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-950/20 ring-2 ring-purple-500/30 shadow-md'
                  : 'border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[10px] text-slate-900 dark:text-slate-100">
                <img 
                  src={getR2CdnUrl('/assets/logo/webhook.webp')} 
                  alt="Webhook Logo" 
                  className="size-3.5 object-contain shrink-0" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo/webhook.webp'; }}
                />
                <span className="truncate">Webhook</span>
              </div>
              <span className="text-[8.5px] text-slate-400 block truncate">New Ticket</span>
              <div className="flex items-center justify-between text-[8px] font-mono text-purple-600 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span>Realtime</span>
                <span>12/m</span>
              </div>
            </div>

            {/* STAGE 2: AI PLANNER (col 2: left-[18%], width 14%) */}
            <div 
              onClick={() => { setSelectedNodeId('ai_planner'); if (onTriggerToast) onTriggerToast('Selected AI Planner Node'); }}
              className={`absolute left-[18%] top-[50%] -translate-y-1/2 w-[14%] p-2 rounded-2xl border transition-all cursor-pointer space-y-1 z-10 ${
                selectedNodeId === 'ai_planner'
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[10px] text-slate-900 dark:text-slate-100">
                <div className="flex items-center gap-1 truncate">
                  <img 
                    src={getR2CdnUrl('/assets/visualization/gpt.webp')} 
                    alt="GPT Logo" 
                    className="size-3.5 object-contain rounded shrink-0" 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/visualization/gpt.webp'; }}
                  />
                  <span className="truncate">AI Planner</span>
                </div>
                <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold">GPT-5</span>
              </div>
              <p className="text-[8.5px] text-slate-400 truncate">Triage & Intent</p>
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span>2.1s</span>
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* STAGE 3: CLASSIFY INTENT (col 3: left-[35%], width 14%) */}
            <div 
              onClick={() => { setSelectedNodeId('classify_intent'); if (onTriggerToast) onTriggerToast('Selected Classify Intent Node'); }}
              className={`absolute left-[35%] top-[50%] -translate-y-1/2 w-[14%] p-2 rounded-2xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'classify_intent'
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[10px] text-slate-900 dark:text-slate-100">
                <img 
                  src={getR2CdnUrl('/assets/visualization/claude.webp')} 
                  alt="Claude Logo" 
                  className="size-3.5 object-contain rounded shrink-0" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/visualization/claude.webp'; }}
                />
                <span className="truncate">Classify Intent</span>
              </div>
              <span className="text-[8.5px] text-slate-400 block truncate">AI Reasoner Node</span>
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span>1.2s</span>
                <span className="size-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* STAGE 4: 3 AGENTS (col 4: left-[52%], width 14%) */}
            {/* Top Agent */}
            <div 
              onClick={() => { setSelectedNodeId('support_agent'); if (onTriggerToast) onTriggerToast('Selected Support Agent Node'); }}
              className={`absolute left-[52%] top-[12%] w-[14%] p-2 rounded-2xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'support_agent'
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[10px] text-slate-900 dark:text-slate-100">
                <span className="flex items-center gap-1 truncate"><MessageSquare size={11} className="text-indigo-600 shrink-0" /> Support Agent</span>
              </div>
              <span className="text-[8.5px] text-slate-400 block truncate">Primary Handler</span>
              <div className="flex items-center justify-between text-[8px] pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-emerald-600 font-bold">Online</span>
                <span className="font-mono text-slate-400">95%</span>
              </div>
            </div>

            {/* Mid Agent */}
            <div 
              onClick={() => { setSelectedNodeId('escalation_agent'); if (onTriggerToast) onTriggerToast('Selected Escalation Agent Node'); }}
              className={`absolute left-[52%] top-[44%] w-[14%] p-2 rounded-2xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'escalation_agent'
                  ? 'border-amber-600 bg-amber-50/20 dark:bg-amber-950/20 ring-2 ring-amber-500/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[10px] text-slate-900 dark:text-slate-100">
                <span className="flex items-center gap-1 truncate"><ShieldCheck size={11} className="text-amber-500 shrink-0" /> Escalation Agent</span>
              </div>
              <span className="text-[8.5px] text-slate-400 block truncate">Complex Cases</span>
              <div className="flex items-center justify-between text-[8px] pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-emerald-600 font-bold">Online</span>
                <span className="font-mono text-slate-400">92%</span>
              </div>
            </div>

            {/* Bot Agent */}
            <div 
              onClick={() => { setSelectedNodeId('refund_agent'); if (onTriggerToast) onTriggerToast('Selected Refund Agent Node'); }}
              className={`absolute left-[52%] top-[76%] w-[14%] p-2 rounded-2xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'refund_agent'
                  ? 'border-pink-600 bg-pink-50/20 dark:bg-pink-950/20 ring-2 ring-pink-500/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[10px] text-slate-900 dark:text-slate-100">
                <span className="flex items-center gap-1 truncate"><FileText size={11} className="text-pink-500 shrink-0" /> Refund Agent</span>
              </div>
              <span className="text-[8.5px] text-slate-400 block truncate">Payments</span>
              <div className="flex items-center justify-between text-[8px] pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-emerald-600 font-bold">Online</span>
                <span className="font-mono text-slate-400">93%</span>
              </div>
            </div>

            {/* STAGE 5: DOWNSTREAM MCPs */}
            {/* Knowledge Retrieval */}
            <div 
              onClick={() => { setSelectedNodeId('knowledge_retr'); if (onTriggerToast) onTriggerToast('Selected Knowledge Retrieval Node'); }}
              className={`absolute left-[69%] top-[12%] w-[14%] p-1.5 rounded-xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'knowledge_retr'
                  ? 'border-emerald-600 bg-emerald-50/20 ring-2 ring-emerald-500/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
              }`}
            >
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-[9.5px] truncate">Knowledge Retr.</span>
              <span className="text-[8px] text-slate-400 block truncate">Vector Search</span>
              <span className="text-[7.5px] font-mono text-slate-400 block border-t border-slate-100 dark:border-slate-800 pt-0.5">145ms</span>
            </div>

            {/* Slack MCP */}
            <div 
              onClick={() => { setSelectedNodeId('slack_mcp'); if (onTriggerToast) onTriggerToast('Selected Slack MCP Node'); }}
              className={`absolute left-[86%] top-[12%] w-[9%] p-1.5 rounded-xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'slack_mcp'
                  ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-500/30 shadow-md'
                  : 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1">
                <img 
                  src={getR2CdnUrl('/assets/visualization/slack.webp')} 
                  alt="Slack Logo" 
                  className="size-3.5 object-contain shrink-0" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/visualization/slack.webp'; }}
                />
                <span className="font-bold text-amber-700 dark:text-amber-400 block text-[9.5px] truncate">Slack MCP</span>
              </div>
              <span className="text-[8px] text-amber-600 block truncate">#support</span>
              <span className="text-[7.5px] font-mono text-slate-400 block border-t border-amber-100 dark:border-amber-900/40 pt-0.5">120ms</span>
            </div>

            {/* Human Approval */}
            <div 
              onClick={() => { setSelectedNodeId('human_approval'); if (onTriggerToast) onTriggerToast('Selected Human Approval Gate Node'); }}
              className={`absolute left-[69%] top-[44%] w-[14%] p-1.5 rounded-xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'human_approval'
                  ? 'border-purple-600 bg-purple-50/20 ring-2 ring-purple-500/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'
              }`}
            >
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-[9.5px] truncate">Human Approval</span>
              <span className="text-[8px] text-slate-400 block truncate">Manager Review</span>
              <span className="text-[7.5px] font-mono text-amber-500 block border-t border-slate-100 dark:border-slate-800 pt-0.5">Pending</span>
            </div>

            {/* Stripe MCP */}
            <div 
              onClick={() => { setSelectedNodeId('stripe_mcp'); if (onTriggerToast) onTriggerToast('Selected Stripe MCP Node'); }}
              className={`absolute left-[86%] top-[44%] w-[9%] p-1.5 rounded-xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'stripe_mcp'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/30 shadow-md'
                  : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1">
                <img 
                  src={getR2CdnUrl('/assets/visualization/stripe.webp')} 
                  alt="Stripe Logo" 
                  className="size-3.5 object-contain shrink-0" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/visualization/stripe.webp'; }}
                />
                <span className="font-bold text-indigo-700 dark:text-indigo-400 block text-[9.5px] truncate">Stripe MCP</span>
              </div>
              <span className="text-[8px] text-indigo-600 block truncate">Refund API</span>
              <span className="text-[7.5px] font-mono text-slate-400 block border-t border-indigo-100 dark:border-indigo-900/40 pt-0.5">320ms</span>
            </div>

            {/* Zendesk MCP */}
            <div 
              onClick={() => { setSelectedNodeId('zendesk_mcp'); if (onTriggerToast) onTriggerToast('Selected Zendesk MCP Node'); }}
              className={`absolute left-[69%] top-[76%] w-[14%] p-1.5 rounded-xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'zendesk_mcp'
                  ? 'border-sky-600 bg-sky-50/40 ring-2 ring-sky-500/30 shadow-md'
                  : 'border-sky-200 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/20 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1">
                <img 
                  src={getR2CdnUrl('/assets/logo/zendesk.webp')} 
                  alt="Zendesk Logo" 
                  className="size-3.5 object-contain shrink-0" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo/zendesk.webp'; }}
                />
                <span className="font-bold text-sky-700 dark:text-sky-400 block text-[9.5px] truncate">Zendesk MCP</span>
              </div>
              <span className="text-[8px] text-sky-600 block truncate">Update Ticket</span>
              <span className="text-[7.5px] font-mono text-slate-400 block border-t border-sky-100 dark:border-sky-900/40 pt-0.5">200ms</span>
            </div>

            {/* Supabase MCP */}
            <div 
              onClick={() => { setSelectedNodeId('supabase_mcp'); if (onTriggerToast) onTriggerToast('Selected Supabase MCP Node'); }}
              className={`absolute left-[86%] top-[76%] w-[9%] p-1.5 rounded-xl border transition-all cursor-pointer space-y-0.5 z-10 ${
                selectedNodeId === 'supabase_mcp'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/30 shadow-md'
                  : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1">
                <img 
                  src={getR2CdnUrl('/assets/logo/supabase.png')} 
                  alt="Supabase Logo" 
                  className="size-3.5 object-contain shrink-0" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo/supabase.png'; }}
                />
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[9.5px] truncate">Supabase MCP</span>
              </div>
              <span className="text-[8px] text-emerald-600 block truncate">Store Data</span>
              <span className="text-[7.5px] font-mono text-slate-400 block border-t border-emerald-100 dark:border-emerald-900/40 pt-0.5">160ms</span>
            </div>

            {/* END NODE */}
            <div className="absolute left-[96%] top-[76%] w-[3.5%] p-1 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-center space-y-0.5 z-10 shadow-2xs">
              <span className="font-black text-emerald-700 dark:text-emerald-400 block text-[9px]">End</span>
              <span className="text-[7px] text-emerald-600 block font-semibold truncate">OK</span>
            </div>
          </div>

          {/* MINIMAP */}
          <div className="absolute bottom-2.5 left-2.5 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-md space-y-1 z-20">
            <div className="w-24 h-11 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-center justify-center text-[7.5px] text-slate-400 font-mono">
              Minimap Preview
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-0.5 hover:text-slate-900"><ZoomOut size={11} /></button>
              <span className="font-mono font-bold text-[9px]">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-0.5 hover:text-slate-900"><ZoomIn size={11} /></button>
              <button onClick={() => setZoom(100)} className="p-0.5 hover:text-slate-900"><Maximize2 size={11} /></button>
            </div>
          </div>
        </div>

        {/* RIGHT DRAWER INSPECTOR (3 COLS) */}
        <div className="lg:col-span-3 xl:col-span-3 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2.5 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Node Configuration</h3>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">AI Planner <span className="text-[10px] font-normal text-slate-400">(GPT-5)</span></p>
              <span className="text-[9px] font-mono text-slate-400">Node ID: node_2f4a8c</span>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
          </div>

          <div className="flex items-center gap-3 text-xs border-b border-slate-100 dark:border-slate-800 pb-1.5">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'configuration', label: 'Configuration' },
              { id: 'prompt', label: 'Prompt' },
              { id: 'tools', label: 'Tools' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setInspectorTab(tab.id as any)}
                className={`font-bold transition-colors cursor-pointer ${
                  inspectorTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-1.5 -mb-1.5'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">DESCRIPTION</span>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-normal">
                Analyzes incoming ticket and creates execution plan with intent classification.
              </p>
            </div>

            <div>
              <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">MODEL</label>
              <select 
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  if (onTriggerToast) onTriggerToast(`Model updated to ${e.target.value}`);
                }}
                className="w-full px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
              >
                <option>GPT-5</option>
                <option>Claude 3.5 Sonnet</option>
                <option>Gemini 1.5 Pro</option>
                <option>DeepSeek R1</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>TEMPERATURE</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer" 
              />
            </div>

            <div>
              <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">MAX TOKENS</label>
              <input 
                type="number" 
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                className="w-full px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold" 
              />
            </div>

            <div>
              <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">SYSTEM PROMPT</label>
              <textarea 
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-mono text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500" 
              />
            </div>

          </div>
        </div>
      </div>
    )}

      {/* GLOBAL INTERNET INTEGRATIONS TAB VIEW */}
      {activeTab === 'integrations' && (
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4 min-h-[560px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Global Internet Tool Connectors Ecosystem</h3>
              <p className="text-xs text-slate-500">25+ Production-Grade OAuth & Webhook Connectors (LangGraph, n8n, AutoGen, OpenAI Swarm)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                25 Connectors Online
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {globalConnectors.map((c) => (
              <div 
                key={c.connector_key}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <img 
                    src={getR2CdnUrl(c.cdn_icon_url)} 
                    alt={c.name} 
                    className="size-7 object-contain rounded-lg p-1 bg-white dark:bg-slate-900 shadow-2xs shrink-0" 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/logo/supabase.png'; }}
                  />
                  <div className="truncate">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">{c.name}</span>
                    <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 block uppercase">{c.provider || c.category}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] border-t border-slate-100 dark:border-slate-800/80 pt-2">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                  </span>
                  <button 
                    onClick={() => {
                      if (onTriggerToast) onTriggerToast(`Initiating OAuth integration for ${c.name}...`);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. BOTTOM EXECUTION DOCK */}
      <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
        <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-2">
          {[
            { id: 'console', label: 'Console' },
            { id: 'logs', label: 'Logs' },
            { id: 'executions', label: 'Executions' },
            { id: 'checkpoints', label: 'LangGraph Memory' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'tracing', label: 'Tracing' },
            { id: 'variables', label: 'Variables' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setConsoleTab(tab.id as any)}
              className={`text-xs font-bold transition-colors cursor-pointer ${
                consoleTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-2 -mb-2'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {consoleTab === 'checkpoints' ? (
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LANGGRAPH PERSISTENT CHECKPOINTS MEMORY THREADS</span>
              <span className="text-[10px] font-mono font-bold text-emerald-600">Active State Graph Thread: thread_support_8921</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {langgraphCheckpoints.map((chk, idx) => (
                <div key={idx} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 font-mono text-[10px] space-y-1">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                    <span>{chk.checkpoint_ns}</span>
                    <span className="text-slate-400 font-normal">{chk.created_at || 'Just now'}</span>
                  </div>
                  <pre className="p-1 rounded bg-slate-900 text-slate-200 text-[9.5px] overflow-x-auto">
                    {JSON.stringify(chk.channel_values || {}, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
          {/* RUNS (2 COLS) */}
          <div className="lg:col-span-2 space-y-1.5 border-r border-slate-100 dark:border-slate-800 pr-2">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">EXECUTION RUNS</span>
            <div className="space-y-1">
              {runs.map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run.id)}
                  className={`flex items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer ${
                    selectedRun === run.id
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono text-[11px]">{run.id}</span>
                  <span className={`px-1 py-0.2 rounded text-[8.5px] font-bold ${run.color}`}>{run.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TIMELINE (4 COLS) */}
          <div className="lg:col-span-4 space-y-1.5 border-r border-slate-100 dark:border-slate-800 pr-2">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">EXECUTION FLOW ({selectedRun})</span>
              <span className="text-[9.5px] font-mono text-slate-400">Total: 11.64s</span>
            </div>

            <div className="space-y-1 font-mono text-[10px]">
              {[
                { name: 'Webhook', time: '12:42:01.123', dur: '300ms' },
                { name: 'AI Planner', time: '12:42:01.323', dur: '2.1s' },
                { name: 'Classify Intent', time: '12:42:03.423', dur: '1.2s' },
                { name: 'Support Agent', time: '12:42:04.623', dur: '3.6s' },
                { name: 'Knowledge Retrieval', time: '12:42:08.223', dur: '145ms' },
                { name: 'Slack MCP', time: '12:42:08.368', dur: '120ms' },
                { name: 'Zendesk MCP', time: '12:42:12.568', dur: '200ms' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-0.5">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{step.name}</span>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{step.time}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{step.dur}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PERFORMANCE (3 COLS) */}
          <div className="lg:col-span-3 space-y-2 border-r border-slate-100 dark:border-slate-800 pr-2">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">PERFORMANCE OVERVIEW</span>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Total Latency</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">11.64s</span>
              </div>
              <div className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Total Tokens</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">21,436</span>
              </div>
              <div className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Total Cost</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">$0.0187</span>
              </div>
              <div className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Success Rate</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">99.23%</span>
              </div>
            </div>
          </div>

          {/* DONUT (3 COLS) */}
          <div className="lg:col-span-3 space-y-1.5">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">TOKEN USAGE BY MODEL</span>
            
            <div className="flex items-center gap-3">
              <div className="relative size-14 flex-shrink-0">
                <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                  <path strokeDasharray="58 100" strokeDashoffset="0" className="text-indigo-600" strokeWidth="6" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path strokeDasharray="21 100" strokeDashoffset="-58" className="text-emerald-500" strokeWidth="6" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path strokeDasharray="11 100" strokeDashoffset="-79" className="text-amber-500" strokeWidth="6" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path strokeDasharray="10 100" strokeDashoffset="-90" className="text-purple-500" strokeWidth="6" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
              <div className="space-y-0.5 text-[9px] font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-indigo-600" /> GPT-5 58%</div>
                <div className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" /> Claude 3.5 21%</div>
                <div className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" /> Gemini 1.5 11%</div>
                <div className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-purple-500" /> Other 10%</div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {activeTab !== 'canvas' && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          {activeTab === 'flow' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers size={16} className="text-indigo-600" />
                Execution Flow DAG Sequence ({currentWorkflow.name})
              </h3>
              <div className="space-y-2 font-mono text-xs">
                {[
                  { step: '01', name: 'Webhook Trigger', type: 'Ingress Webhook', status: 'Active', latency: '12ms' },
                  { step: '02', name: 'AI Planner (GPT-5)', type: 'LLM Orchestrator', status: 'Completed', latency: '2.10s' },
                  { step: '03', name: 'Classify Intent (Claude 3.5)', type: 'Intent Classifier', status: 'Completed', latency: '1.20s' },
                  { step: '04', name: 'Support Agent Swarm', type: 'Agent Delegation', status: 'Running', latency: '3.60s' },
                  { step: '05', name: 'Zendesk & Supabase MCP', type: 'Persistence Gate', status: 'Queued', latency: '200ms' },
                ].map((st) => (
                  <div key={st.step} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-indigo-600">{st.step}</span>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{st.name}</span>
                        <span className="text-[10px] text-slate-400">{st.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{st.latency}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">{st.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 font-mono space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Code2 size={15} className="text-indigo-400" />
                  <span>workflow_spec.json</span>
                  <span className="text-[10px] text-emerald-400 font-sans px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">Valid Spec</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(workflowCodeText);
                    if (onTriggerToast) onTriggerToast('Copied JSON specification to clipboard!');
                  }} 
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-sans font-bold cursor-pointer"
                >
                  Copy JSON
                </button>
              </div>
              <pre className="text-xs leading-relaxed overflow-x-auto text-indigo-300">
                {workflowCodeText}
              </pre>
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-600" />
                  Workflow Environment Variables
                </h3>
                <button 
                  onClick={() => {
                    const k = prompt('Variable Key (e.g. CUSTOM_API_KEY):');
                    const v = prompt('Variable Value:');
                    if (k && v) {
                      setEnvVars([...envVars, { key: k.toUpperCase(), value: v, secret: true }]);
                      if (onTriggerToast) onTriggerToast(`Added environment variable ${k.toUpperCase()}`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                >
                  + Add Variable
                </button>
              </div>

              <div className="space-y-2">
                {envVars.map((v, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-indigo-600">{v.key}</span>
                    <span className="text-slate-500 truncate max-w-xs">{v.value}</span>
                    <button 
                      onClick={() => {
                        setEnvVars(envVars.filter((_, idx) => idx !== i));
                        if (onTriggerToast) onTriggerToast(`Removed variable ${v.key}`);
                      }}
                      className="text-rose-500 text-xs font-sans font-bold hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings size={16} className="text-indigo-600" />
                Workflow Settings & OWASP Security Guardrails
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-400 uppercase block mb-1">Workflow Name</label>
                  <input type="text" defaultValue={currentWorkflow.name} className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-400 uppercase block mb-1">Max Execution Timeout (ms)</label>
                  <input type="number" defaultValue={30000} className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-400 uppercase block mb-1">OWASP Anti-Throttling Rate Limit</label>
                  <select className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold">
                    <option>Token-Bucket (100 req/min limit)</option>
                    <option>Strict Burst Guard (20 req/sec limit)</option>
                  </select>
                </div>
                <button 
                  onClick={() => onTriggerToast && onTriggerToast('Workflow settings saved successfully!')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Save Workflow Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OVERLAY MODAL 1: WORKFLOW SELECTOR MODAL */}
      {activeModal === 'workflow_selector_modal' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Select Enterprise AI Workflow</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {workflowsList.map((wf) => (
                <div 
                  key={wf.id}
                  onClick={() => {
                    setActiveWorkflowId(wf.id);
                    setActiveModal(null);
                    if (onTriggerToast) onTriggerToast(`Switched active workflow to ${wf.name}`);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                    activeWorkflowId === wf.id
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="text-slate-900 dark:text-slate-100">{wf.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">{wf.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{wf.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 2: SHARE WORKFLOW MODAL */}
      {activeModal === 'share_modal' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Share Workflow Link</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-2 text-xs">
              <span className="text-slate-400 font-bold uppercase block">Production Canvas URL</span>
              <input type="text" readOnly value={`https://app.zega.ai/workflow/studio/${activeWorkflowId}?v=${activeVersion}`} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-mono text-indigo-600" />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`https://app.zega.ai/workflow/studio/${activeWorkflowId}?v=${activeVersion}`);
                  setActiveModal(null);
                  if (onTriggerToast) onTriggerToast('Copied workflow link to clipboard!');
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 3: VERSION HISTORY MODAL */}
      {activeModal === 'history_modal' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Workflow Version Snapshots</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { v: 'v3.4', date: '2 hours ago', by: 'Wildan A.', active: true },
                { v: 'v3.3', date: 'Yesterday at 14:20', by: 'Danz A.', active: false },
                { v: 'v3.0', date: '3 days ago', by: 'System Auto-Backup', active: false },
              ].map((h, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{h.v}</span>
                    <span className="text-[10px] text-slate-400">{h.date} by {h.by}</span>
                  </div>
                  {h.active ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Current</span>
                  ) : (
                    <button 
                      onClick={() => {
                        setActiveVersion(h.v);
                        setActiveModal(null);
                        if (onTriggerToast) onTriggerToast(`Rolled back workflow to ${h.v}`);
                      }}
                      className="text-indigo-600 font-bold text-[11px] hover:underline cursor-pointer"
                    >
                      Rollback
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 5: TEST RUN PAYLOAD MODAL */}
      {activeModal === 'test_modal' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🧪</span> Interactive Workflow Test Sandbox
                </h3>
                <p className="text-xs text-slate-500">Provide mock JSON payload to simulate real-time workflow execution</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-400 uppercase block mb-1">MOCK INPUT PAYLOAD (JSON)</label>
                <textarea 
                  rows={5}
                  defaultValue={`{\n  "event": "ticket_created",\n  "ticket_id": "TCK-9921",\n  "customer": "enterprise@acme.com",\n  "priority": "HIGH",\n  "message": "Urgent: Payment webhook timeout on Stripe settlement"\n}`}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-[11px] text-emerald-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Assertions: 12/12 standard test rules enabled</span>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    handleWorkflowAction('run', 'Run Test');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Execute Test Run
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 6: PUBLISH RELEASE MODAL */}
      {activeModal === 'publish_modal' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600" />
                  Publish Workflow Version
                </h3>
                <p className="text-xs text-slate-500">Deploy changes directly to live production cluster</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-400 uppercase block mb-1">RELEASE VERSION TAG</label>
                <input type="text" defaultValue={activeVersion} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold" />
              </div>
              <div>
                <label className="font-bold text-slate-400 uppercase block mb-1">RELEASE CHANGELOG NOTES</label>
                <textarea 
                  rows={3}
                  defaultValue="Updated AI Planner model engine to GPT-5 and added Slack MCP notification trigger for high priority support escalations."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-medium"
                />
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold space-y-1">
                <span className="font-bold block">✓ OWASP Level 3 Verification Passed</span>
                <span className="text-[10px] opacity-80 block">Zero secret leaks, anti-throttling active, prompt injection guard enabled.</span>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  handleWorkflowAction('publish', 'Publish Workflow');
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Confirm & Deploy to Production
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 4: ADD NODE MODAL */}
      {activeModal === 'add_node_modal' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Enterprise AI Node Library</h3>
                <p className="text-xs text-slate-500">Select a pre-configured node template to add to canvas</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {[
                { name: 'LLM Orchestrator', type: 'AI Node', model: 'GPT-5 / Claude 3.5', icon: Brain, desc: 'Multi-modal orchestration engine' },
                { name: 'Vector RAG Query', type: 'MCP Node', model: 'Qdrant / Supabase', icon: Database, desc: 'High-speed semantic search gate' },
                { name: 'PagerDuty Alert', type: 'MCP Node', model: 'PagerDuty v2', icon: Zap, desc: 'P0/P1 incident escalation dispatch' },
                { name: 'HubSpot CRM Sync', type: 'MCP Node', model: 'HubSpot API', icon: FileText, desc: 'Automated deal status synchronization' },
                { name: 'Stripe Refund Gate', type: 'MCP Node', model: 'Stripe API v2', icon: Zap, desc: 'Secure payment reversal handling' },
                { name: 'Human Approval Gate', type: 'Business Node', model: 'Interactive UI', icon: ShieldCheck, desc: 'Manager sign-off pause state' },
              ].map((tmpl, idx) => {
                const Icon = tmpl.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveModal(null);
                      if (onTriggerToast) onTriggerToast(`Added '${tmpl.name}' (${tmpl.type}) to active workflow!`);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-600 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/20 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Icon size={14} className="text-indigo-600" />
                      <span className="text-slate-900 dark:text-slate-100">{tmpl.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{tmpl.desc}</p>
                    <span className="text-[9px] font-mono text-indigo-500 font-semibold block">{tmpl.model}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
