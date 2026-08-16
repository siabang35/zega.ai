import React, { useState, useEffect } from 'react';
import { 
  Activity, Zap, CheckCircle2, 
  Plus, Clock, ShieldCheck, Database,
  Cpu, SlidersHorizontal, Users,
  Bot, Building, DollarSign, ShieldAlert
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { getR2CdnUrl } from '../../utils/cdn';
import { SupabaseDashboardService } from '../services/supabaseService';
import { getActiveTenantIds } from '../contexts/TenantContext';
import { OverviewModals } from './overview/OverviewModals';
import { EnterpriseHeaderWidgets } from './overview/EnterpriseHeaderWidgets';
import { EnterpriseCopilot } from './overview/EnterpriseCopilot';

export interface ZegaOrchestratorViewProps {
  userRole?: 'individual' | 'enterprise';
  userName?: string;
  userEmail?: string;
  isGuest?: boolean;
  dark?: boolean;
  onNavigateToSandbox?: () => void;
  onSwitchWorkspace?: (workspace: 'enterprise' | 'umkm') => void;
}

export function ZegaOrchestratorView({
  userRole = 'enterprise',
  userName = '',
  userEmail = '',
  isGuest = false,
  dark = false,
  onNavigateToSandbox,
  onSwitchWorkspace
}: ZegaOrchestratorViewProps) {
  const displayOrgName = userName || 'Enterprise';

  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState('Last 24 hours');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Supabase Enterprise Overview Realtime Data
  useEffect(() => {
    let isMounted = true;

    async function loadOverviewData() {
      setLoading(true);
      const data = await SupabaseDashboardService.getEnterpriseOverviewRealtimeData((getActiveTenantIds().organizationId || ''), timeRange);
      if (isMounted && data) {
        setRealtimeData(data);
        setLoading(false);
      }
    }

    loadOverviewData();

    // Subscribe to Realtime Postgres Changes (Anti-throttled & OWASP Anti-chunking protected)
    const unsubscribe = SupabaseDashboardService.subscribeToEnterpriseOverviewRealtime((getActiveTenantIds().organizationId || ''), () => {
      loadOverviewData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [timeRange]);

  // Dynamic KPI Extraction with database fallback
  const kpis = realtimeData?.kpis || {};
  const activeAgentsVal = kpis.active_agents ?? 638;
  const businessUnitsVal = kpis.business_units ?? 14;
  const automationHoursVal = kpis.automation_hours ? `${kpis.automation_hours.toLocaleString()} h` : '9,420 h';
  const monthlySavingsVal = kpis.monthly_savings_usd ? `$${(kpis.monthly_savings_usd / 1000000).toFixed(2)}M` : '$2.61M';
  const aiRequestsVal = kpis.ai_requests_per_min ? kpis.ai_requests_per_min.toLocaleString() : '18,732';
  const systemHealthVal = kpis.system_health_pct ? `${kpis.system_health_pct}%` : '99.98%';
  const avgLatencyVal = kpis.avg_latency_ms ? `${kpis.avg_latency_ms} ms` : '121 ms';

  // Sparkline SVG Generator
  const generateSparklineSvg = (color: string, points: number[]) => {
    const dataPoints = points && points.length ? points : [20, 25, 22, 30, 38, 45, 52, 60, 63];
    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const range = max - min || 1;
    const width = 120;
    const height = 28;
    
    const coords = dataPoints.map((p, idx) => {
      const x = (idx / (dataPoints.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' L ');

    return (
      <svg className="w-full h-7 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={`M ${coords}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // Cost Analytics Chart Data
  const costLineData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      { label: 'OpenAI', data: [12000, 19000, 35000, 58000, 72000, 85000, 94000], borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.05)', tension: 0.4, borderWidth: 2, pointRadius: 0 },
      { label: 'Anthropic', data: [8000, 14000, 22000, 38000, 48000, 56000, 62000], borderColor: '#f97316', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, pointRadius: 0 },
      { label: 'Google', data: [4000, 7000, 12000, 21000, 29000, 34000, 38000], borderColor: '#06b6d4', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, pointRadius: 0 },
      { label: 'Others', data: [2000, 3500, 6000, 9000, 12000, 14000, 16000], borderColor: '#a855f7', backgroundColor: 'transparent', tension: 0.4, borderWidth: 2, pointRadius: 0 },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
      y: { grid: { color: 'rgba(226, 232, 240, 0.5)' }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
    },
  };

  // Token Usage Donut Chart Data
  const donutData = {
    labels: ['Input Tokens', 'Output Tokens', 'Cache Read', 'Cache Write'],
    datasets: [
      {
        data: [41, 32, 17, 10],
        backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  };

  const agentTeamsList = realtimeData?.agentTeams?.length ? realtimeData.agentTeams : [
    { team_name: 'Sales Team', agent_count: 42, badge_color: 'bg-blue-500' },
    { team_name: 'Finance Team', agent_count: 36, badge_color: 'bg-emerald-500' },
    { team_name: 'HR Team', agent_count: 29, badge_color: 'bg-purple-500' },
    { team_name: 'Marketing Team', agent_count: 33, badge_color: 'bg-amber-500' },
    { team_name: 'Legal Team', agent_count: 16, badge_color: 'bg-indigo-500' },
    { team_name: 'DevOps Team', agent_count: 41, badge_color: 'bg-sky-500' },
    { team_name: 'Research Team', agent_count: 22, badge_color: 'bg-teal-500' },
    { team_name: 'Coding Team', agent_count: 65, badge_color: 'bg-rose-500' },
  ];

  const liveActivitiesList = realtimeData?.activities?.length ? realtimeData.activities : [
    { event_timestamp: '09:41:22', workflow_title: 'Invoice Processing Workflow', agent_name: 'Finance Agent', status: 'Completed' },
    { event_timestamp: '09:41:18', workflow_title: 'Lead Qualification', agent_name: 'Sales Agent', status: 'Running' },
    { event_timestamp: '09:41:15', workflow_title: 'Support Ticket Resolution', agent_name: 'Support Agent', status: 'Completed' },
    { event_timestamp: '09:41:10', workflow_title: 'Employee Onboarding', agent_name: 'HR Agent', status: 'Running' },
    { event_timestamp: '09:41:05', workflow_title: 'Marketing Campaign Report', agent_name: 'Marketing Agent', status: 'Completed' },
  ];

  const systemComponentsList = realtimeData?.systemComponents?.length ? realtimeData.systemComponents : [
    'API Gateway', 'Supabase', 'Vector Database', 'Redis Cache', 'ZeroClaw Node', 'MCP Server', 'Edge Network', 'Monitoring'
  ];

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 text-xs font-semibold shadow-2xl border border-slate-700 dark:border-slate-200 animate-slideUp">
          <CheckCircle2 size={15} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER BAR (RESPONSIVE DESKTOP & MOBILE BEST PRACTICES) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Executive Animated Robotic Video Showcase Card (Proportional Desktop & Mobile) */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-500/40 bg-slate-950 shadow-xl shrink-0 w-24 sm:w-32 md:w-40 aspect-video transition-all hover:scale-[1.02] hover:border-indigo-400 group">
            {!hasVideoError ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                controls={false}
                poster={getR2CdnUrl('/assets/3D/robotic.webp', true)}
                onError={() => setHasVideoError(true)}
                className="w-full h-full object-cover"
              >
                <source src={getR2CdnUrl('/design/design_enterprise/robotic_enterprise.mp4', true)} type="video/mp4" />
                <source src="/design/design_enterprise/robotic_enterprise.mp4" type="video/mp4" />
                <source src={getR2CdnUrl('/assets/3D/robotic.mp4', true)} type="video/mp4" />
                <img
                  src={getR2CdnUrl('/assets/3D/robotic.webp', true)}
                  alt="ZEGA Robotic Enterprise AI"
                  className="w-full h-full object-cover"
                />
              </video>
            ) : (
              <img
                src={getR2CdnUrl('/assets/3D/robotic.webp', true)}
                alt="ZEGA Robotic Enterprise AI"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 truncate">
              Good Morning, {displayOrgName} 👋
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enterprise AI Operating System
            </p>
          </div>
        </div>

        {/* Time Filter & Customize Actions */}
        <div className="flex items-center gap-2 shrink-0 pt-1 lg:pt-0">

          {/* Time Picker Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-2xs shrink-0">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent focus:outline-none text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option>Last 24 hours</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>

          {/* Customize Button (Active Modal Trigger) */}
          <button 
            onClick={() => setActiveModal('customize')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal size={14} className="text-slate-400" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS STRIP (7 Cards with Live Realtime Data - 2 cols on mobile for best practice UI) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
        {/* Card 1: Active AI Agents */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="truncate">Active AI Agents</span>
              <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Bot size={13} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-mono">{activeAgentsVal}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                ▲ {kpis.active_agents_change_pct ?? 18.2}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1">
            {generateSparklineSvg('#3b82f6', kpis.active_agents_sparkline)}
          </div>
        </div>

        {/* Card 2: Business Units */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="truncate">Business Units</span>
              <div className="size-6 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Building size={13} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-mono">{businessUnitsVal}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                ▲ {kpis.business_units_change_pct ?? 7.1}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1">
            {generateSparklineSvg('#8b5cf6', kpis.business_units_sparkline)}
          </div>
        </div>

        {/* Card 3: Automation Hours Saved */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="truncate">Automation Hours</span>
              <div className="size-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock size={13} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-mono">{automationHoursVal}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                ▲ {kpis.automation_hours_change_pct ?? 24.5}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1">
            {generateSparklineSvg('#10b981', kpis.automation_hours_sparkline)}
          </div>
        </div>

        {/* Card 4: Monthly Cost Savings */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="truncate">Monthly Savings</span>
              <div className="size-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <DollarSign size={13} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-mono">{monthlySavingsVal}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                ▲ {kpis.monthly_savings_change_pct ?? 32.6}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1">
            {generateSparklineSvg('#f59e0b', kpis.monthly_savings_sparkline)}
          </div>
        </div>

        {/* Card 5: AI Requests / min */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="truncate">AI Requests / min</span>
              <div className="size-6 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Zap size={13} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-mono">{aiRequestsVal}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                ▲ {kpis.ai_requests_change_pct ?? 28.4}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1">
            {generateSparklineSvg('#0284c7', kpis.ai_requests_sparkline)}
          </div>
        </div>

        {/* Card 6: System Health */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="truncate">System Health</span>
              <div className="size-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={13} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-mono">{systemHealthVal}</span>
              <span className="text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                {kpis.system_health_status || 'Excellent'}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1">
            {generateSparklineSvg('#10b981', kpis.system_health_sparkline)}
          </div>
        </div>

        {/* Card 7: Avg Latency */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="truncate">Avg Latency</span>
              <div className="size-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Activity size={13} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-mono">{avgLatencyVal}</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                ▼ {Math.abs(kpis.avg_latency_change_pct ?? 8.2)}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1">
            {generateSparklineSvg('#6366f1', kpis.avg_latency_sparkline)}
          </div>
        </div>
      </div>

      {/* MIDDLE GRID ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Component 1: AI Orchestration Pipeline */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  AI Orchestration Pipeline
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>
              <button 
                onClick={() => setActiveModal('pipeline')} 
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                View Details &gt;
              </button>
            </div>

            {/* Visual Horizontal Pipeline Nodes */}
            <div className="mt-6 py-2 overflow-x-auto no-scrollbar">
              <div className="min-w-[680px] flex items-center justify-between gap-2 text-center">
                {[
                  { name: 'Trigger', sub: 'Event / API', icon: Zap, done: true },
                  { name: 'Planner', sub: 'Goal Decomp.', icon: Bot, done: true },
                  { name: 'Reasoning', sub: 'Multi-step Think', icon: Activity, done: true },
                  { name: 'Memory', sub: 'Vector Store', icon: Database, done: true },
                  { name: 'Tool Calling', sub: 'APIs & MCP', icon: Cpu, done: true },
                  { name: 'Validation', sub: 'Guardrails', icon: ShieldCheck, done: true },
                  { name: 'Execution', sub: 'Run & Act', icon: PlayIcon, done: true },
                  { name: 'Human Approval', sub: 'Review', icon: Users, done: false, amber: true },
                ].map((node, idx, arr) => (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center group cursor-pointer" onClick={() => setActiveModal('pipeline')}>
                      <div className={`size-11 rounded-2xl flex items-center justify-center border transition-all ${
                        node.amber 
                          ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}>
                        <node.icon size={18} />
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{node.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{node.sub}</div>
                      <div className="mt-1">
                        {node.done ? (
                          <div className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </div>
                        ) : (
                          <div className="size-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                            !
                          </div>
                        )}
                      </div>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="flex-1 h-0.5 border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-1 mb-6" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-Metrics Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-5 gap-2 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Running Workflows</div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100 text-base">{realtimeData?.pipeline?.running_workflows ?? 27}</span>
                <span className="text-[9.5px] font-bold text-emerald-600">▲ 15.3%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Queued</div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100 text-base">{realtimeData?.pipeline?.queued_workflows ?? 12}</span>
                <span className="text-[9.5px] font-bold text-emerald-600">▲ 4.2%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Completed</div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100 text-base">{(realtimeData?.pipeline?.completed_workflows ?? 1892).toLocaleString()}</span>
                <span className="text-[9.5px] font-bold text-emerald-600">▲ 22.1%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Failed</div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100 text-base">{realtimeData?.pipeline?.failed_workflows ?? 3}</span>
                <span className="text-[9.5px] font-bold text-emerald-600">▼ 25.0%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Avg Exec Time</div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100 text-base">{realtimeData?.pipeline?.avg_exec_time_sec ?? 2.43}s</span>
                <span className="text-[9.5px] font-bold text-emerald-600">▼ 18.4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Component 2: Agent Teams */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Agent Teams
              </h3>
              <button 
                onClick={() => setActiveModal('agentTeams')} 
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                View All &gt;
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {agentTeamsList.map((team: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveModal('agentTeams')}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`size-7 rounded-lg ${team.badge_color || 'bg-blue-500'}/10 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-[10px]`}>
                      <Users size={13} className="text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{team.team_name}</div>
                      <div className="text-[10px] text-slate-400">{team.agent_count} Agents</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Healthy &gt;
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Component 3: Top Integrations */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Top Integrations
              </h3>
              <button 
                onClick={() => setActiveModal('integrations')} 
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Manage All
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { name: 'Supabase', logo: getR2CdnUrl('/assets/logo/supabase.png') },
                { name: 'Stripe', logo: getR2CdnUrl('/assets/visualization/stripe.webp') },
                { name: 'Slack', logo: getR2CdnUrl('/assets/visualization/slack.webp') },
                { name: 'Cloudflare', logo: getR2CdnUrl('/assets/logo/Cloudflare_Logo.png') },
                { name: 'BigQuery', logo: getR2CdnUrl('/assets/visualization/bigquery.webp') },
                { name: 'GitHub', logo: getR2CdnUrl('/assets/logo/github.svg') },
                { name: 'WhatsApp', logo: getR2CdnUrl('/assets/logo/whatsapp-for-business.webp') },
                { name: 'HubSpot', logo: getR2CdnUrl('/assets/logo/hubspot.png') },
                { name: 'Salesforce', logo: getR2CdnUrl('/assets/logo/salesforce.jpeg') },
                { name: 'Snowflake', logo: getR2CdnUrl('/assets/logo/snowflake.png') },
                { name: 'Google Workspace', logo: getR2CdnUrl('/assets/logo/google_drive.png') },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveModal('integrations')}
                  className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center text-center hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                >
                  <img src={item.logo} alt={item.name} className="size-6 object-contain rounded-xs" />
                  <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[50px]">{item.name}</span>
                </div>
              ))}
              <div 
                onClick={() => setActiveModal('integrations')}
                className="p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col items-center justify-center text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Plus size={16} className="text-slate-400" />
                <span className="text-[9px] font-bold text-slate-500 mt-0.5">Add</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Panel 1: Live Workflow Activity */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Live Workflow Activity</h3>
            <button 
              onClick={() => setActiveModal('liveActivity')} 
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="mt-3 space-y-3 text-xs">
            {liveActivitiesList.map((log: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between cursor-pointer" onClick={() => setActiveModal('liveActivity')}>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span>{log.event_timestamp || log.time}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{log.agent_name || log.agent}</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 text-xs truncate max-w-[150px]">{log.workflow_title || log.title}</div>
                </div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                  log.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Cost Analytics */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Cost Analytics</h3>
            <button 
              onClick={() => setActiveModal('costReport')} 
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View Report
            </button>
          </div>

          <div className="mt-3">
            <div className="text-[10px] text-slate-400 font-medium">Total Spend</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-50">$128,430.50</span>
              <span className="text-[10px] font-bold text-emerald-600">▲ 14.3% vs yesterday</span>
            </div>
          </div>

          <div className="mt-3 h-28 w-full cursor-pointer" onClick={() => setActiveModal('costReport')}>
            <Line data={costLineData} options={lineOptions} />
          </div>

          <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-indigo-600" /> OpenAI</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-orange-500" /> Anthropic</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-cyan-500" /> Google</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-purple-500" /> Others</span>
          </div>
        </div>

        {/* Panel 3: Token Usage */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Token Usage</h3>
            <button 
              onClick={() => setActiveModal('tokenDetails')} 
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View Details
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between cursor-pointer" onClick={() => setActiveModal('tokenDetails')}>
            <div className="relative size-24 shrink-0 flex items-center justify-center">
              <Doughnut data={donutData} options={donutOptions} />
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-xs font-black font-mono text-slate-900 dark:text-slate-50">45.2M</span>
                <span className="text-[8px] text-slate-400">Tokens</span>
              </div>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-500" /> Input (41%)</div>
              <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-500" /> Output (32%)</div>
              <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Cache Read (17%)</div>
              <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" /> Cache Write (10%)</div>
            </div>
          </div>
        </div>

        {/* Panel 4: Security Events */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Security Events</h3>
            <button 
              onClick={() => setActiveModal('securityEvents')} 
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3 cursor-pointer" onClick={() => setActiveModal('securityEvents')}>
            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-50">23 <span className="text-[10px] font-semibold text-slate-400">Events</span></div>
              <div className="text-[10px] font-bold text-emerald-600">▼ 12.5%</div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-[10.5px]">
            <div className="flex items-center justify-between"><span className="text-rose-600 font-bold">● 2 High Severity</span> <span className="font-mono text-slate-400">Action Needed</span></div>
            <div className="flex items-center justify-between"><span className="text-amber-600 font-bold">● 7 Medium Severity</span> <span className="font-mono text-slate-400">Monitored</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-500 font-semibold">● 14 Low Severity</span> <span className="font-mono text-slate-400">Resolved</span></div>
          </div>
        </div>

        {/* Panel 5: AI Router */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">AI Router</h3>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Live</span>
            </div>
            <button 
              onClick={() => setActiveModal('aiRouter')} 
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View Router
            </button>
          </div>

          <div className="mt-2.5 space-y-2 text-xs cursor-pointer" onClick={() => setActiveModal('aiRouter')}>
            {[
              { name: 'GPT-5', pct: 32, tok: '1.2M', color: 'bg-emerald-500' },
              { name: 'Claude 3.5', pct: 24, tok: '920K', color: 'bg-orange-500' },
              { name: 'Gemini 2.5', pct: 18, tok: '680K', color: 'bg-cyan-500' },
              { name: 'DeepSeek R1', pct: 12, tok: '450K', color: 'bg-blue-500' },
              { name: 'Llama 3.3 70B', pct: 8, tok: '310K', color: 'bg-purple-500' },
              { name: 'Mistral Large', pct: 6, tok: '210K', color: 'bg-rose-500' },
            ].map((m, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{m.name}</span>
                  <span className="font-mono text-slate-500">{m.pct}% ({m.tok})</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Total Tokens</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">3.77M <span className="text-emerald-600 font-bold">▲ 24.6%</span></span>
          </div>
        </div>
      </div>

      {/* SYSTEM STATUS FOOTER BAR */}
      <div 
        onClick={() => setActiveModal('systemStatus')}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
      >
        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">System Status</div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          {(typeof systemComponentsList[0] === 'string' 
            ? systemComponentsList 
            : systemComponentsList.map((c: any) => c.component_name)
          ).map((sys: string, idx: number) => (
            <div key={idx} className="flex items-center gap-1.5">
              <div className="size-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
              <span>{sys}</span>
              <span className="text-[9.5px] text-slate-400 font-normal font-mono">Operational</span>
            </div>
          ))}
        </div>
      </div>

      {/* OVERVIEW MODALS CONTAINER */}
      <OverviewModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        triggerToast={triggerToast}
        timeRange={timeRange}
        realtimeData={realtimeData}
      />

      {/* DEDICATED ENTERPRISE ZEGA COPILOT AI ASSISTANT */}
      <EnterpriseCopilot
        dark={dark}
        userName={userName}
        userEmail={userEmail}
        triggerToast={triggerToast}
      />
    </div>
  );
}

function PlayIcon(props: any) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
