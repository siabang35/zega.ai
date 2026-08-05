import React, { useState } from 'react';
import { 
  X, Check, Activity, Zap, ShieldCheck, Database, Cpu, 
  Users, SlidersHorizontal, Layers, Sparkles, RefreshCw, 
  Search, ShieldAlert, AlertTriangle, ArrowUpRight, DollarSign, Clock
} from 'lucide-react';
import { getR2CdnUrl } from '../../../utils/cdn';

export interface OverviewModalsProps {
  activeModal: string | null;
  onClose: () => void;
  triggerToast: (msg: string) => void;
  timeRange: string;
  onSelectTimeRange?: (range: string) => void;
  realtimeData?: any;
}

export function OverviewModals({
  activeModal,
  onClose,
  triggerToast,
  timeRange,
  realtimeData
}: OverviewModalsProps) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      {activeModal === 'customize' && (
        <CustomizeModal onClose={onClose} triggerToast={triggerToast} />
      )}
      {activeModal === 'pipeline' && (
        <PipelineModal onClose={onClose} triggerToast={triggerToast} pipelineData={realtimeData?.pipeline} />
      )}
      {activeModal === 'agentTeams' && (
        <AgentTeamsModal onClose={onClose} triggerToast={triggerToast} teams={realtimeData?.agentTeams} />
      )}
      {activeModal === 'integrations' && (
        <IntegrationsModal onClose={onClose} triggerToast={triggerToast} />
      )}
      {activeModal === 'liveActivity' && (
        <LiveActivityModal onClose={onClose} triggerToast={triggerToast} activities={realtimeData?.activities} />
      )}
      {activeModal === 'costReport' && (
        <CostReportModal onClose={onClose} triggerToast={triggerToast} timeRange={timeRange} />
      )}
      {activeModal === 'tokenDetails' && (
        <TokenDetailsModal onClose={onClose} triggerToast={triggerToast} />
      )}
      {activeModal === 'securityEvents' && (
        <SecurityEventsModal onClose={onClose} triggerToast={triggerToast} />
      )}
      {activeModal === 'aiRouter' && (
        <AiRouterModal onClose={onClose} triggerToast={triggerToast} routerStats={realtimeData?.routerStats} />
      )}
      {activeModal === 'systemStatus' && (
        <SystemStatusModal onClose={onClose} triggerToast={triggerToast} components={realtimeData?.systemComponents} />
      )}
    </div>
  );
}

// 1. CUSTOMIZE WIDGETS LAYOUT MODAL
function CustomizeModal({ onClose, triggerToast }: { onClose: () => void; triggerToast: (m: string) => void }) {
  const [widgets, setWidgets] = useState([
    { id: 'kpis', name: '7 KPI Metrics Strip', enabled: true },
    { id: 'pipeline', name: 'AI Orchestration Pipeline', enabled: true },
    { id: 'teams', name: 'Agent Teams', enabled: true },
    { id: 'integrations', name: 'Top Integrations', enabled: true },
    { id: 'activity', name: 'Live Workflow Activity', enabled: true },
    { id: 'cost', name: 'Cost Analytics', enabled: true },
    { id: 'tokens', name: 'Token Usage', enabled: true },
    { id: 'security', name: 'Security Events', enabled: true },
    { id: 'router', name: 'AI Router Distribution', enabled: true },
    { id: 'status', name: 'System Status Footer', enabled: true },
  ]);

  const toggle = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Customize Dashboard Widgets</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {widgets.map(w => (
          <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{w.name}</span>
            <button
              onClick={() => toggle(w.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                w.enabled 
                  ? 'bg-emerald-500 text-white shadow-xs' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}
            >
              {w.enabled ? 'Visible' : 'Hidden'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline">
          Cancel
        </button>
        <button
          onClick={() => {
            triggerToast('Dashboard widget layout updated & cached.');
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md cursor-pointer"
        >
          Save Layout
        </button>
      </div>
    </div>
  );
}

// 2. AI ORCHESTRATION PIPELINE DETAILS MODAL
function PipelineModal({ onClose, triggerToast, pipelineData }: { onClose: () => void; triggerToast: (m: string) => void; pipelineData?: any }) {
  const stages = pipelineData?.stages_json || [
    { name: 'Trigger', sub: 'Event / API', status: 'Healthy', latency: '4ms' },
    { name: 'Planner', sub: 'Goal Decomp.', status: 'Healthy', latency: '12ms' },
    { name: 'Reasoning', sub: 'Multi-step Think', status: 'Healthy', latency: '45ms' },
    { name: 'Memory', sub: 'Vector Store', status: 'Healthy', latency: '18ms' },
    { name: 'Tool Calling', sub: 'APIs & MCP', status: 'Healthy', latency: '24ms' },
    { name: 'Validation', sub: 'Guardrails', status: 'Healthy', latency: '8ms' },
    { name: 'Execution', sub: 'Run & Act', status: 'Healthy', latency: '32ms' },
    { name: 'Human Approval', sub: 'Review', status: 'Pending Review', latency: '-' },
  ];

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap size={18} className="text-emerald-500" />
            AI Orchestration Pipeline Stage Deep-Dive
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">8-Stage Autonomous Task Execution Pipeline</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stages.map((st: any, idx: number) => (
          <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{idx + 1}. {st.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{st.sub}</div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className={`font-semibold ${st.amber ? 'text-amber-500' : 'text-emerald-500'}`}>
                ● {st.status || 'Active'}
              </span>
              <span className="font-mono text-slate-400">{st.latency || '12ms'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Pipeline Status: <span className="text-emerald-600 font-bold">100% Operational</span></span>
        <button
          onClick={() => {
            triggerToast('Rerunning pipeline guardrails diagnostics...');
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md cursor-pointer"
        >
          Rerun Diagnostics
        </button>
      </div>
    </div>
  );
}

// 3. AGENT TEAMS DRAWER MODAL
function AgentTeamsModal({ onClose, triggerToast, teams }: { onClose: () => void; triggerToast: (m: string) => void; teams?: any[] }) {
  const defaultTeams = [
    { team_name: 'Sales Team', agent_count: 42, badge_color: 'bg-blue-500', status: 'Healthy', description: 'Autonomous lead scoring & outreach' },
    { team_name: 'Finance Team', agent_count: 36, badge_color: 'bg-emerald-500', status: 'Healthy', description: 'Automated reconciliation & invoicing' },
    { team_name: 'HR Team', agent_count: 29, badge_color: 'bg-purple-500', status: 'Healthy', description: 'Employee onboarding & policy RAG' },
    { team_name: 'Marketing Team', agent_count: 33, badge_color: 'bg-amber-500', status: 'Healthy', description: 'Content generation & campaign optimization' },
    { team_name: 'Legal Team', agent_count: 16, badge_color: 'bg-indigo-500', status: 'Healthy', description: 'Contract parsing & NDA compliance' },
    { team_name: 'DevOps Team', agent_count: 41, badge_color: 'bg-sky-500', status: 'Healthy', description: 'Infra monitoring & auto-remediation' },
    { team_name: 'Research Team', agent_count: 22, badge_color: 'bg-teal-500', status: 'Healthy', description: 'Deep web research & market intel' },
    { team_name: 'Coding Team', agent_count: 65, badge_color: 'bg-rose-500', status: 'Healthy', description: 'ZeroClaw code synthesis & PR reviewer' },
  ];

  const list = teams?.length ? teams : defaultTeams;

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users size={18} className="text-indigo-500" />
            Enterprise Agent Teams Roster
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Active AI agent pods assigned per business department</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {list.map((t: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className={`size-8 rounded-lg ${t.badge_color || 'bg-blue-500'}/10 text-indigo-600 flex items-center justify-center font-bold text-xs`}>
                <Users size={15} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.team_name}</div>
                <div className="text-[10px] text-slate-400">{t.description || `${t.agent_count} Active Autonomous Agents`}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-slate-100">{t.agent_count} Agents</span>
              <button
                onClick={() => triggerToast(`Managing ${t.team_name}`)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          onClick={() => {
            triggerToast('Opening New Agent Team Deployment Wizard');
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md cursor-pointer"
        >
          + Deploy New Agent Team
        </button>
      </div>
    </div>
  );
}

// 4. INTEGRATIONS MANAGER MODAL
function IntegrationsModal({ onClose, triggerToast }: { onClose: () => void; triggerToast: (m: string) => void }) {
  const integrations = [
    { name: 'Supabase', logo: getR2CdnUrl('/assets/logo/supabase.png'), category: 'Database', status: 'Connected' },
    { name: 'Stripe', logo: getR2CdnUrl('/assets/visualization/stripe.webp'), category: 'Financial', status: 'Connected' },
    { name: 'Slack', logo: getR2CdnUrl('/assets/visualization/slack.webp'), category: 'Messaging', status: 'Connected' },
    { name: 'Cloudflare', logo: getR2CdnUrl('/assets/logo/Cloudflare_Logo.png'), category: 'CDN Edge', status: 'Connected' },
    { name: 'BigQuery', logo: getR2CdnUrl('/assets/visualization/bigquery.webp'), category: 'Data Warehouse', status: 'Connected' },
    { name: 'GitHub', logo: getR2CdnUrl('/assets/logo/github.svg'), category: 'DevOps', status: 'Connected' },
    { name: 'WhatsApp', logo: getR2CdnUrl('/assets/logo/whatsapp-for-business.webp'), category: 'Customer Comm', status: 'Connected' },
    { name: 'HubSpot', logo: getR2CdnUrl('/assets/logo/hubspot.png'), category: 'CRM', status: 'Connected' },
    { name: 'Salesforce', logo: getR2CdnUrl('/assets/logo/salesforce.jpeg'), category: 'Enterprise CRM', status: 'Connected' },
    { name: 'Snowflake', logo: getR2CdnUrl('/assets/logo/snowflake.png'), category: 'AI Lakehouse', status: 'Connected' },
    { name: 'Google Workspace', logo: getR2CdnUrl('/assets/logo/google_drive.png'), category: 'Productivity', status: 'Connected' },
  ];

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Enterprise Integrations Hub</h3>
          <p className="text-xs text-slate-500 mt-0.5">MCP Connectors & Third-Party API Adapters</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
        {integrations.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={item.logo} alt={item.name} className="size-7 object-contain rounded-sm" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[90px]">{item.name}</div>
                <div className="text-[9px] text-slate-400">{item.category}</div>
              </div>
            </div>
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button
          onClick={() => {
            triggerToast('Connecting new integration webhook...');
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md cursor-pointer"
        >
          + Add New Integration Key
        </button>
      </div>
    </div>
  );
}

// 5. LIVE WORKFLOW ACTIVITY MODAL
function LiveActivityModal({ onClose, triggerToast, activities }: { onClose: () => void; triggerToast: (m: string) => void; activities?: any[] }) {
  const defaultActivities = [
    { time: '09:41:22', title: 'Invoice Processing Workflow', agent: 'Finance Agent', status: 'Completed' },
    { time: '09:41:18', title: 'Lead Qualification', agent: 'Sales Agent', status: 'Running' },
    { time: '09:41:15', title: 'Support Ticket Resolution', agent: 'Support Agent', status: 'Completed' },
    { time: '09:41:10', title: 'Employee Onboarding', agent: 'HR Agent', status: 'Running' },
    { time: '09:41:05', title: 'Marketing Campaign Report', agent: 'Marketing Agent', status: 'Completed' },
  ];

  const list = activities?.length ? activities : defaultActivities;

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Workflow Execution Logs</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time audit stream of all enterprise autonomous tasks</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {list.map((log: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>{log.event_timestamp || log.time}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{log.agent_name || log.agent}</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">{log.workflow_title || log.title}</div>
            </div>
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
              log.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              {log.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          onClick={() => {
            triggerToast('Exporting audit log CSV...');
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
        >
          Export Log CSV
        </button>
      </div>
    </div>
  );
}

// 6. COST REPORT MODAL
function CostReportModal({ onClose, triggerToast, timeRange }: { onClose: () => void; triggerToast: (m: string) => void; timeRange: string }) {
  return (
    <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign size={18} className="text-amber-500" />
            Cost Intelligence Report ({timeRange})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Multi-LLM Spend Breakdown & Budget Allocation</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Invoiced Spend</div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-50 mt-1">$128,430.50</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-600 font-bold">▲ 14.3% vs previous</div>
            <div className="text-[10px] text-slate-400 mt-1">Monthly Budget: $250,000</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100">OpenAI Models</div>
            <div className="text-indigo-600 font-mono font-extrabold text-sm mt-1">$68,240.00 (53%)</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100">Anthropic Models</div>
            <div className="text-orange-500 font-mono font-extrabold text-sm mt-1">$35,110.50 (27%)</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100">Google Gemini</div>
            <div className="text-cyan-500 font-mono font-extrabold text-sm mt-1">$16,420.00 (13%)</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-900 dark:text-slate-100">Self-Hosted / Others</div>
            <div className="text-purple-500 font-mono font-extrabold text-sm mt-1">$8,660.00 (7%)</div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500">Close</button>
        <button
          onClick={() => {
            triggerToast('Downloading Financial Cost Report PDF...');
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-md cursor-pointer"
        >
          Download PDF Report
        </button>
      </div>
    </div>
  );
}

// 7. TOKEN DETAILS MODAL
function TokenDetailsModal({ onClose, triggerToast }: { onClose: () => void; triggerToast: (m: string) => void }) {
  return (
    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Token Usage & Prompt Caching</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Total Tokens Processed</div>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">45,210,000</div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold">17% Cache Savings</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Input Tokens (41%)</span>
            <span className="font-mono font-bold">18.5M</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Output Tokens (32%)</span>
            <span className="font-mono font-bold">14.4M</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Cache Read (17%)</span>
            <span className="font-mono font-bold text-emerald-600">7.6M</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Cache Write (10%)</span>
            <span className="font-mono font-bold text-amber-600">4.5M</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer">
          Done
        </button>
      </div>
    </div>
  );
}

// 8. SECURITY EVENTS MODAL
function SecurityEventsModal({ onClose, triggerToast }: { onClose: () => void; triggerToast: (m: string) => void }) {
  return (
    <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-rose-600">
            <ShieldAlert size={18} />
            OWASP Security Event Telemetry
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">23 Events Recorded in 24 Hours</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-1 text-xs">
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
          <div>
            <div className="font-bold text-rose-900">Anti-Throttling Rate Limit Triggered</div>
            <div className="text-[10px] text-rose-700">IP: 192.168.1.104 • 300 req/sec blocked</div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-extrabold">HIGH</span>
        </div>
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
          <div>
            <div className="font-bold text-rose-900">Anti-Chunking Payload Limit Check</div>
            <div className="text-[10px] text-rose-700">Audit log payload chunk size validation</div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-extrabold">HIGH</span>
        </div>
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
          <div>
            <div className="font-bold text-amber-900">SSO Key Rotation Audit Notice</div>
            <div className="text-[10px] text-amber-700">SAML 2.0 cert updated by danz@zegaai.site</div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-extrabold">MEDIUM</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Security Gate: <span className="text-emerald-600 font-bold">OWASP Level 3 Compliant</span></span>
        <button
          onClick={() => {
            triggerToast('All High Severity Security Threats Mitigated');
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md cursor-pointer"
        >
          Mitigate Threats
        </button>
      </div>
    </div>
  );
}

// 9. AI ROUTER MODAL
function AiRouterModal({ onClose, triggerToast, routerStats }: { onClose: () => void; triggerToast: (m: string) => void; routerStats?: any }) {
  const [strategy, setStrategy] = useState(routerStats?.routing_strategy || 'Cost & Latency Optimized');

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">AI Model Router Engine</h3>
          <p className="text-xs text-slate-500 mt-0.5">Dynamic 9Router Layer 5 Multi-LLM Load Balancing</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Routing Strategy</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="mt-1.5 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
          >
            <option>Cost & Latency Optimized</option>
            <option>Quality First</option>
            <option>Latency First</option>
            <option>Failover Redundant</option>
          </select>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
          <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
            <span>GPT-5 (OpenAI)</span>
            <span>32% Allocation</span>
          </div>
          <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
            <span>Claude 3.5 Sonnet (Anthropic)</span>
            <span>24% Allocation</span>
          </div>
          <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
            <span>Gemini 2.5 Pro (Google)</span>
            <span>18% Allocation</span>
          </div>
          <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
            <span>DeepSeek R1 (ZeroClaw)</span>
            <span>12% Allocation</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
        <button
          onClick={() => {
            triggerToast(`AI Router strategy set to: ${strategy}`);
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md cursor-pointer"
        >
          Apply Routing Policy
        </button>
      </div>
    </div>
  );
}

// 10. SYSTEM STATUS MODAL
function SystemStatusModal({ onClose, triggerToast, components }: { onClose: () => void; triggerToast: (m: string) => void; components?: any[] }) {
  const defaultComponents = [
    { component_name: 'API Gateway', status: 'Operational', latency_ms: 8, region: 'us-east-1' },
    { component_name: 'Supabase Database', status: 'Operational', latency_ms: 12, region: 'us-east-1' },
    { component_name: 'Vector Database', status: 'Operational', latency_ms: 18, region: 'us-east-1' },
    { component_name: 'Redis Cache', status: 'Operational', latency_ms: 3, region: 'us-east-1' },
    { component_name: 'ZeroClaw Node', status: 'Operational', latency_ms: 22, region: 'eu-central-1' },
    { component_name: 'MCP Server', status: 'Operational', latency_ms: 14, region: 'us-east-1' },
    { component_name: 'Edge Network', status: 'Operational', latency_ms: 5, region: 'Global Cloudflare' },
    { component_name: 'Monitoring', status: 'Operational', latency_ms: 9, region: 'us-east-1' },
  ];

  const list = components?.length ? components : defaultComponents;

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" />
            Infrastructure Status & Latency
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">All 8 Microservice Clusters Online</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        {list.map((c: any, idx: number) => (
          <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{c.component_name}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.region || 'Global'}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {c.status || 'Operational'}
              </span>
              <div className="text-[10px] font-mono text-slate-400 mt-1">{c.latency_ms || 10} ms</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          onClick={() => {
            triggerToast('Full system health report re-verified.');
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
        >
          Re-Check Status
        </button>
      </div>
    </div>
  );
}
