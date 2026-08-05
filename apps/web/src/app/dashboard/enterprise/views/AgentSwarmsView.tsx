import React, { useState, useEffect } from 'react';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { 
  Bot, Plus, Search, Filter, Star, Sparkles, TrendingUp, TrendingDown,
  CheckCircle2, ChevronRight, Users, LayoutGrid, List, MoreVertical,
  ShieldCheck, ArrowUpRight, Zap, Play, Activity, Sliders, RefreshCw,
  X, Layers, Download, Check, FileText, ExternalLink, Workflow, BarChart3,
  ChevronDown, ShieldAlert, Cpu, UserPlus, Settings, Copy, CheckCircle, Pause, AlertTriangle, Trash2, Globe, Database
} from 'lucide-react';

interface AgentSwarmsViewProps {
  onTriggerToast?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// Sparkline SVG Component for KPI Cards
function Sparkline({ color = '#6366f1', data = [10, 15, 8, 22, 18, 30, 25, 40] }: { color?: string; data?: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 18;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Realtime SVG Donut Chart Component with Ultra-Interactive Hover & Selection
function RealtimeAgentDonutChart({ data, totalCount, onCategoryClick }: { data: any[]; totalCount: number; onCategoryClick: (cat: string) => void }) {
  const [hoveredCategory, setHoveredCategory] = useState<any | null>(null);

  const size = 110;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const activeDisplay = hoveredCategory || { category: 'Total Agents', count: totalCount, percent: 100 };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* SVG Donut Ring with Hover Tooltip */}
      <div className="relative size-28 flex-shrink-0 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {data.map((item) => {
            const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += item.percent;
            const isHovered = hoveredCategory?.category === item.category;

            return (
              <circle
                key={item.category}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.colorHex}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredCategory(item)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => onCategoryClick(item.category)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono pointer-events-none">
          <span className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
            {activeDisplay.count}
          </span>
          <span className="text-[7.5px] text-indigo-600 dark:text-indigo-400 font-sans font-black uppercase tracking-tighter truncate max-w-[70px]">
            {activeDisplay.category}
          </span>
        </div>
      </div>

      {/* Interactive Side Legend */}
      <div className="w-full sm:w-auto flex-1 text-[10.5px] font-bold space-y-1 font-sans">
        {data.map((d) => {
          const isHovered = hoveredCategory?.category === d.category;
          return (
            <button
              key={d.category}
              onMouseEnter={() => setHoveredCategory(d)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => onCategoryClick(d.category)}
              className={`w-full flex items-center justify-between px-1.5 py-0.5 rounded transition-all cursor-pointer text-left ${
                isHovered ? 'bg-indigo-50 dark:bg-indigo-950/60 scale-[1.02]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.colorHex }}></span>
                <span className={`font-medium truncate ${isHovered ? 'text-indigo-600 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                  {d.category}
                </span>
              </div>
              <span className="font-mono text-slate-900 dark:text-slate-100 font-black ml-1.5">
                {d.percent}% <span className="text-slate-400 font-medium font-mono text-[9px]">({d.count})</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AgentSwarmsView({ onTriggerToast, onNavigateTab }: AgentSwarmsViewProps) {
  // Sub-tabs in exact mockup order: Marketplace, My Agents, Teams, Templates (Default: Marketplace)
  const [activeSubTab, setActiveSubTab] = useState<'marketplace' | 'my_agents' | 'teams' | 'templates'>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeDropdownRow, setActiveDropdownRow] = useState<string | null>(null);

  // Form State
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentCategory, setNewAgentCategory] = useState('Sales');
  const [newAgentDesc, setNewAgentDesc] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCategory, setNewTeamCategory] = useState('Sales');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  // Selected Team Detail Subview state
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<any | null>(null);
  const [teamDetailSubTab, setTeamDetailSubTab] = useState<'overview' | 'members' | 'agents' | 'workflows' | 'activity' | 'settings'>('overview');

  // AI Teams Realtime Data (Matching Mockup Panel 2 & 3)
  const [teamsData, setTeamsData] = useState<any[]>([
    { id: 'team-1', team_name: 'Sales Team', slug: 'sales-growth-swarm', description: 'Manage all sales agents and workflows', category: 'Sales', lead_owner: 'Danz A.', status: 'Active', member_count: 8, agents_count: 12, workflows_count: 18, total_runs_7d: '642K', success_rate_pct: '98.7%', health: 'Excellent', last_activity: '2h ago', members: ['Wildan A.', 'Sarah K.', 'Alex M.', 'Elena R.', 'Rudi H.'] },
    { id: 'team-2', team_name: 'Finance Team', slug: 'financial-audit-team', description: 'Finance automation and reporting agents', category: 'Finance', lead_owner: 'Danz A.', status: 'Active', member_count: 5, agents_count: 32, workflows_count: 48, total_runs_7d: '521K', success_rate_pct: '99.1%', health: 'Excellent', last_activity: '5h ago', members: ['Sarah K.', 'Alex M.', 'Rudi H.'] },
    { id: 'team-3', team_name: 'Support Team', slug: 'customer-support-pod', description: 'Customer support and service automation', category: 'Support', lead_owner: 'Danz A.', status: 'Active', member_count: 8, agents_count: 24, workflows_count: 67, total_runs_7d: '312K', success_rate_pct: '97.2%', health: 'Excellent', last_activity: '1d ago', members: ['Elena R.', 'Wildan A.'] },
    { id: 'team-4', team_name: 'Operations Team', slug: 'ops-team', description: 'Operations and process automation', category: 'Operations', lead_owner: 'Danz A.', status: 'Active', member_count: 6, agents_count: 29, workflows_count: 67, total_runs_7d: '436K', success_rate_pct: '97.8%', health: 'Very Good', last_activity: '2d ago', members: ['Rudi H.', 'Alex M.'] },
    { id: 'team-5', team_name: 'Marketing Team', slug: 'marketing-team', description: 'Marketing automation and content', category: 'Marketing', lead_owner: 'Danz A.', status: 'Active', member_count: 4, agents_count: 35, workflows_count: 71, total_runs_7d: '456K', success_rate_pct: '96.9%', health: 'Very Good', last_activity: '3d ago', members: ['Wildan A.', 'Sarah K.'] },
  ]);

  // Templates Realtime Data (Matching Mockup Panel 4)
  const [templatesData, setTemplatesData] = useState<any[]>([
    { id: 'tmpl-1', template_name: 'Lead Qualification Agent', category: 'Sales', use_case: 'CRM', difficulty: 'Easy', rating: 4.9, reviews: 124, usage: '1.2K', tags: ['Sales', 'CRM'] },
    { id: 'tmpl-2', template_name: 'Invoice Processing Agent', category: 'Finance', use_case: 'Accounting', difficulty: 'Medium', rating: 4.8, reviews: 98, usage: '892', tags: ['Finance', 'Accounting'] },
    { id: 'tmpl-3', template_name: 'Customer Support Agent', category: 'Support', use_case: 'ITSM', difficulty: 'Medium', rating: 4.8, reviews: 155, usage: '1.5K', tags: ['Support', 'ITSM'] },
    { id: 'tmpl-4', template_name: 'Market Research Agent', category: 'Research', use_case: 'Analytics', difficulty: 'Easy', rating: 4.7, reviews: 87, usage: '742', tags: ['Research', 'Analytics'] },
    { id: 'tmpl-5', template_name: 'Social Media Content Agent', category: 'Marketing', use_case: 'Content creation', difficulty: 'Easy', rating: 4.9, reviews: 134, usage: '1.2K', tags: ['Marketing', 'Content'] },
    { id: 'tmpl-6', template_name: 'Contract Analysis Agent', category: 'Legal', use_case: 'Document analysis', difficulty: 'Medium', rating: 4.8, reviews: 92, usage: '892', tags: ['Legal', 'Contracts'] },
    { id: 'tmpl-7', template_name: 'Data Extraction Agent', category: 'Operations', use_case: 'Data processing', difficulty: 'Medium', rating: 4.7, reviews: 112, usage: '1.5K', tags: ['Operations', 'ETL'] },
    { id: 'tmpl-8', template_name: 'Employee Onboarding Agent', category: 'HR', use_case: 'HR Automation', difficulty: 'Medium', rating: 4.9, reviews: 91, usage: '1.1K', tags: ['HR', 'Onboarding'] },
  ]);

  // My Deployed Enterprise Workforce Data (Matching exact screenshot: Wildan A., Sarah K., Alex M., Elena R., Rudi H.)
  const [myAgentsWorkforce, setMyAgentsWorkforce] = useState<any[]>([
    { id: 'mag-1', instance_name: 'Marketing Agent', subtitle: 'Social media content, campaigns', category: 'Marketing', status: 'Active', health_score: 99.80, runs_7d: '24,092', success_rate_pct: '98.7%', owner_name: 'Wildan A.', updated: '2h ago', bgTint: 'bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400' },
    { id: 'mag-2', instance_name: 'HR Agent', subtitle: 'Recruitment, onboarding, HR ops', category: 'HR', status: 'Active', health_score: 99.60, runs_7d: '18,392', success_rate_pct: '98.1%', owner_name: 'Sarah K.', updated: '5h ago', bgTint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400' },
    { id: 'mag-3', instance_name: 'Data Analyst Agent', subtitle: 'Data analysis, insights, reports', category: 'Analytics', status: 'Active', health_score: 99.90, runs_7d: '15,208', success_rate_pct: '99.2%', owner_name: 'Alex M.', updated: '1d ago', bgTint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400' },
    { id: 'mag-4', instance_name: 'Legal Agent', subtitle: 'Contract review, compliance', category: 'Legal', status: 'Active', health_score: 99.70, runs_7d: '8,921', success_rate_pct: '97.9%', owner_name: 'Elena R.', updated: '1d ago', bgTint: 'bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400' },
    { id: 'mag-5', instance_name: 'SEO Agent', subtitle: 'Keyword research, optimization', category: 'Marketing', status: 'Active', health_score: 99.50, runs_7d: '7,214', success_rate_pct: '97.1%', owner_name: 'Wildan A.', updated: '2d ago', bgTint: 'bg-sky-50 text-sky-600 dark:bg-sky-950/80 dark:text-sky-400' },
    { id: 'mag-6', instance_name: 'Operations Agent', subtitle: 'Process automation, SOPs', category: 'Operations', status: 'Active', health_score: 99.30, runs_7d: '6,532', success_rate_pct: '98.3%', owner_name: 'Rudi H.', updated: '2d ago', bgTint: 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400' },
    { id: 'mag-7', instance_name: 'Customer Success Agent', subtitle: 'Customer lifecycle management', category: 'Support', status: 'Active', health_score: 99.60, runs_7d: '6,021', success_rate_pct: '98.5%', owner_name: 'Sarah K.', updated: '3d ago', bgTint: 'bg-teal-50 text-teal-600 dark:bg-teal-950/80 dark:text-teal-400' },
    { id: 'mag-8', instance_name: 'Product Research Agent', subtitle: 'Market research, competitor intel', category: 'Research', status: 'Active', health_score: 99.40, runs_7d: '4,892', success_rate_pct: '97.8%', owner_name: 'Alex M.', updated: '3d ago', bgTint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400' },
  ]);

  // Realtime Supabase Database Sync
  const fetchMyAgentsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/enterprise/my-agents/list');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setMyAgentsWorkforce(json.data.map((item: any, idx: number) => ({
            id: item.id || `mag-${idx}`,
            instance_name: item.instance_name || item.name || 'Enterprise Agent',
            subtitle: item.subtitle || item.description || 'Autonomous AI Agent instance',
            category: item.category || 'General',
            status: item.status || 'Active',
            health_score: item.health_score || 99.80,
            runs_7d: Number(item.runs_7d || 12850).toLocaleString(),
            success_rate_pct: typeof item.success_rate_pct === 'string' ? item.success_rate_pct : `${item.success_rate_pct || 98.7}%`,
            owner_name: item.owner_name || 'Wildan A.',
            updated: item.updated || 'Just now',
            bgTint: ['bg-purple-50 text-purple-600', 'bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600', 'bg-sky-50 text-sky-600', 'bg-rose-50 text-rose-600'][idx % 6],
          })));
        }
      }
    } catch (e) {
      console.warn('My Agents API sync fallback:', e);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchMyAgentsData();
    const unsubscribe = SupabaseDashboardService.subscribeToMyAgentsWorkforceRealtime(() => {
      fetchMyAgentsData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle Realtime Pause / Resume Toggle Action
  const handleToggleAgentStatus = async (agent: any) => {
    const newStatus = agent.status === 'Active' || agent.status === 'Online' ? 'Paused' : 'Active';
    setMyAgentsWorkforce(prev => prev.map(item => item.id === agent.id ? { ...item, status: newStatus } : item));
    setActiveDropdownRow(null);

    if (onTriggerToast) {
      onTriggerToast(`${newStatus === 'Active' ? 'Resumed' : 'Paused'} agent '${agent.instance_name}' successfully!`);
    }

    try {
      await fetch('/api/v1/enterprise/my-agents/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: agent.id,
          action: newStatus === 'Active' ? 'resume' : 'pause',
        }),
      });
    } catch (err) {
      console.warn('Status toggle API error:', err);
    }
  };

  // Handle Create Agent Submission
  const handleCreateAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const newAgent = {
      id: `mag-${Date.now()}`,
      instance_name: newAgentName,
      subtitle: newAgentDesc || 'Custom enterprise AI agent instance',
      category: newAgentCategory,
      status: 'Active',
      health_score: 99.90,
      runs_7d: '1',
      success_rate_pct: '100.0%',
      owner_name: 'Danz A.',
      updated: 'Just now',
      bgTint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400',
    };

    setMyAgentsWorkforce([newAgent, ...myAgentsWorkforce]);
    setActiveModal(null);
    setNewAgentName('');
    setNewAgentDesc('');

    if (onTriggerToast) {
      onTriggerToast(`SUCCESS: Created AI Agent '${newAgent.instance_name}' under Danz A.!`);
    }

    try {
      await fetch('/api/v1/enterprise/agents/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          agentName: newAgent.instance_name,
          category: newAgent.category,
          description: newAgent.subtitle,
        }),
      });
    } catch (err) {
      console.warn('Create agent API error:', err);
    }
  };

  // Handle Create Team Submission
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newTeam = {
      id: `team-${Date.now()}`,
      team_name: newTeamName,
      slug: newTeamName.toLowerCase().replace(/\s+/g, '-'),
      description: newTeamDesc || 'Enterprise AI agent team swarm',
      category: newTeamCategory,
      lead_owner: 'Danz A.',
      status: 'Active',
      member_count: 1,
      agents_count: 4,
      workflows_count: 8,
      total_runs_7d: '12.4K',
      success_rate_pct: '99.5%',
      health: 'Excellent',
      last_activity: 'Just now',
      members: ['Danz A.']
    };

    setTeamsData([newTeam, ...teamsData]);
    setActiveModal(null);
    setNewTeamName('');
    setNewTeamDesc('');

    if (onTriggerToast) {
      onTriggerToast(`SUCCESS: Created AI Team '${newTeam.team_name}' under Danz A.!`);
    }

    try {
      await fetch('/api/v1/enterprise/teams/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          teamName: newTeam.team_name,
          category: newTeam.category,
          description: newTeam.description,
        }),
      });
    } catch (err) {
      console.warn('Create team API error:', err);
    }
  };

  // Filter My Agents Workforce
  const filteredMyAgents = myAgentsWorkforce.filter(agent => {
    const matchesSearch = agent.instance_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          agent.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All Categories' || agent.category === categoryFilter;
    const matchesStatus = statusFilter === 'All Status' || agent.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 font-sans pb-10">
      {/* 1. HEADER SECTION (EXACT MOCKUP TITLE & CREATE BUTTON) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              AI Agents
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
              638 Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Build, deploy, and manage your AI workforce
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveModal('create_agent_modal')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Agent</span>
          </button>
        </div>
      </div>
      {/* 2. SUB TABS & FILTERS BAR (EXACT ORDER: Marketplace, My Agents, Teams, Templates) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          {[
            { id: 'marketplace', label: 'Marketplace' },
            { id: 'my_agents', label: 'My Agents' },
            { id: 'teams', label: 'Teams' },
            { id: 'templates', label: 'Templates' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                if (onTriggerToast) onTriggerToast(`Switched sub-tab: ${tab.label}`);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-48 font-medium"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
          >
            <option>All Categories</option>
            <option>Marketing</option>
            <option>HR</option>
            <option>Analytics</option>
            <option>Legal</option>
            <option>Operations</option>
            <option>Support</option>
            <option>Research</option>
            <option>Sales</option>
            <option>Finance</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Paused</option>
          </select>
          <button 
            onClick={() => setActiveModal('distribution_modal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold cursor-pointer hover:bg-slate-50"
          >
            <Filter size={13} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 3. TOP KPI STRIP (CLICKABLE INTERACTIVE CARDS WITH SVG SPARKLINES) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div onClick={() => setActiveModal('kpi_total_modal')} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">TOTAL AGENTS</span>
            <Users size={14} className="text-indigo-500 opacity-60" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight">{activeSubTab === 'my_agents' ? '128' : '638'}</span>
            <span className="text-[10px] font-bold text-emerald-500">▲ 18.2%</span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-[9.5px] text-slate-400 font-semibold">vs last 7 days</span>
            <Sparkline color="#6366f1" data={[12, 18, 14, 25, 22, 35, 30, 42]} />
          </div>
        </div>

        <div onClick={() => setActiveModal('kpi_active_modal')} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">ACTIVE AGENTS</span>
            <Zap size={14} className="text-emerald-500 opacity-60" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeSubTab === 'my_agents' ? '118' : '421'}</span>
            <span className="text-[10px] font-bold text-emerald-500">▲ 15.7%</span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-[9.5px] text-slate-400 font-semibold">Running pipelines</span>
            <Sparkline color="#10b981" data={[15, 20, 18, 28, 26, 38, 36, 45]} />
          </div>
        </div>

        <div onClick={() => setActiveModal('kpi_deployed_modal')} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">DEPLOYED</span>
            <ShieldCheck size={14} className="text-sky-500 opacity-60" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{activeSubTab === 'my_agents' ? '98' : '198'}</span>
            <span className="text-[10px] font-bold text-emerald-500">▲ 12.4%</span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-[9.5px] text-slate-400 font-semibold">Production pods</span>
            <Sparkline color="#0284c7" data={[10, 12, 16, 20, 22, 30, 28, 35]} />
          </div>
        </div>

        <div onClick={() => setActiveModal('kpi_drafts_modal')} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-amber-400 cursor-pointer transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">DRAFTS</span>
            <FileText size={14} className="text-amber-500 opacity-60" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{activeSubTab === 'my_agents' ? '10' : '42'}</span>
            <span className="text-[10px] font-bold text-rose-500">▼ 5.1%</span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-[9.5px] text-slate-400 font-semibold">Ready to resume</span>
            <Sparkline color="#f59e0b" data={[30, 28, 25, 20, 18, 15, 12, 10]} />
          </div>
        </div>

        <div onClick={() => setActiveModal('kpi_runs_modal')} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">TOTAL RUNS (THIS MONTH)</span>
            <Activity size={14} className="text-purple-500 opacity-60" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono">{activeSubTab === 'my_agents' ? '1.84M' : '2.43M'}</span>
            <span className="text-[10px] font-bold text-emerald-500">▲ 28.5%</span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-[9.5px] text-slate-400 font-semibold">Tasks automated</span>
            <Sparkline color="#8b5cf6" data={[20, 25, 30, 45, 50, 68, 75, 90]} />
          </div>
        </div>

        <div onClick={() => setActiveModal('kpi_success_modal')} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">SUCCESS RATE</span>
            <CheckCircle2 size={14} className="text-emerald-500 opacity-60" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">98.56%</span>
            <span className="text-[10px] font-bold text-emerald-500">▲ 1.7%</span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-[9.5px] text-slate-400 font-semibold">Zero-trust verified</span>
            <Sparkline color="#10b981" data={[85, 88, 90, 92, 95, 97, 98, 99]} />
          </div>
        </div>
      </div>

      {/* 4. CONDITIONAL SUB-TAB CONTENT (MARKETPLACE | MY AGENTS | TEAMS | TEMPLATES) */}

      {/* A. MARKETPLACE VIEW (MATCHING MOCKUP PANEL 1) */}
      {activeSubTab === 'marketplace' && (
        <div className="space-y-6 animate-fadeIn">
          {/* MARKETPLACE HERO BANNER */}
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-700/50">
            <div className="space-y-3 max-w-xl z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                <Sparkles size={12} className="text-amber-300" />
                <span>Enterprise Agent Marketplace</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Discover AI Agents Built for Enterprise
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed font-medium">
                Production-ready agents from verified creators. Deploy in minutes with OWASP L3 security guardrails and sub-second telemetry.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button onClick={() => setActiveModal('create_agent_modal')} className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 text-xs font-black hover:bg-indigo-50 transition-all cursor-pointer shadow-md active:scale-95">
                  How it works
                </button>
                <button onClick={() => setActiveSubTab('my_agents')} className="px-5 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-black border border-indigo-500/50 transition-all cursor-pointer">
                  View My Deployed Workforce
                </button>
              </div>
            </div>

            {/* FLOATING DECORATIVE CARDS */}
            <div className="relative size-44 hidden md:flex items-center justify-center flex-shrink-0">
              <div className="absolute size-32 rounded-2xl bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rotate-6 transform translate-x-4 translate-y-2"></div>
              <div className="absolute size-32 rounded-2xl bg-indigo-600/30 backdrop-blur-md border border-indigo-300/40 -rotate-3 transform -translate-x-2 -translate-y-2"></div>
              <div className="relative size-28 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/30 flex flex-col items-center justify-center p-3 text-center shadow-2xl">
                <Bot size={36} className="text-indigo-200 mb-1" />
                <span className="text-[10px] font-black text-white">638+ AGENTS</span>
                <span className="text-[8px] text-indigo-200 font-mono">OWASP L3 READY</span>
              </div>
            </div>
          </div>

          {/* FEATURED AGENTS GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">FEATURED AGENTS</h2>
              <button className="text-xs font-black text-indigo-600 hover:underline cursor-pointer">View all agents</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Sales Agent', creator: 'Zega AI', popular: true, desc: 'Automates lead management and sales outreach', category: 'Sales', rating: 4.9, reviews: 124, tags: ['Sales', 'CRM'] },
                { name: 'Finance Agent', creator: 'Zega AI', popular: false, desc: 'Handles invoices, payments and reconciliation', category: 'Finance', rating: 4.8, reviews: 98, tags: ['Finance', 'Accounting'] },
                { name: 'Support Agent', creator: 'Support Hub', popular: false, desc: 'Resolves customer issues and manages tickets', category: 'Support', rating: 4.8, reviews: 155, tags: ['Support', 'ITSM'] },
                { name: 'Research Agent', creator: 'ZegaWorks', popular: false, desc: 'Research and generate insights from data', category: 'Research', rating: 4.9, reviews: 87, tags: ['Research', 'Analytics'] },
              ].map((agent) => (
                <div key={agent.name} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between space-y-3 hover:border-indigo-400 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                          <Bot size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">{agent.name}</span>
                          <span className="text-[9.5px] text-slate-400 font-medium">By {agent.creator}</span>
                        </div>
                      </div>
                      {agent.popular && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-200">Popular</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed font-medium">{agent.desc}</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      {agent.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9.5px] font-bold text-slate-600 dark:text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{agent.rating}</span>
                      <span className="text-slate-400 font-normal">({agent.reviews})</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedAgent(agent);
                        setActiveModal('deploy_modal');
                      }} 
                      className="px-3.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-xs font-black cursor-pointer shadow-2xs active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP CATEGORIES STRIP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">TOP CATEGORIES</h2>
              <button className="text-xs font-black text-indigo-600 hover:underline cursor-pointer">View all categories</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { name: 'Sales', count: '70 agents', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/80' },
                { name: 'Finance', count: '64 agents', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80' },
                { name: 'Support', count: '58 agents', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/80' },
                { name: 'Marketing', count: '52 agents', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/80' },
                { name: 'HR', count: '36 agents', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/80' },
                { name: 'Operations', count: '42 agents', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/80' },
                { name: 'Analytics', count: '48 agents', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/80' },
                { name: 'Legal', count: '32 agents', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/80' },
              ].map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setCategoryFilter(cat.name);
                    if (onTriggerToast) onTriggerToast(`Filtered marketplace by ${cat.name}`);
                  }}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-left transition-all cursor-pointer shadow-2xs active:scale-95 space-y-1.5"
                >
                  <div className={`size-7 rounded-lg flex items-center justify-center font-bold ${cat.color}`}>
                    <Bot size={14} />
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-slate-100">{cat.name}</div>
                  <div className="text-[9.5px] text-slate-400 font-semibold">{cat.count}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* B. AI TEAMS SUB-TAB & TEAM DETAIL SUBVIEW (MATCHING MOCKUP PANELS 2 & 3) */}
      {activeSubTab === 'teams' && (
        <div className="space-y-6 animate-fadeIn">
          {/* TEAM DETAIL SUBVIEW IF A TEAM IS SELECTED */}
          {selectedTeamDetail ? (
            <div className="space-y-6">
              {/* BREADCRUMB & HEADER */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                    <button onClick={() => setSelectedTeamDetail(null)} className="hover:text-indigo-600 cursor-pointer">AI Teams</button>
                    <span>&gt;</span>
                    <span className="text-slate-900 dark:text-slate-100">{selectedTeamDetail.team_name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{selectedTeamDetail.team_name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{selectedTeamDetail.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveModal('create_team_modal')} className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold hover:bg-slate-50 cursor-pointer">
                    Team Actions
                  </button>
                  <button onClick={() => setActiveModal('add_member_modal')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 shadow-md transition-all active:scale-95 cursor-pointer">
                    <UserPlus size={14} />
                    <span>Add Member</span>
                  </button>
                </div>
              </div>

              {/* TEAM SUB-TABS */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                {['overview', 'members', 'agents', 'workflows', 'activity', 'settings'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTeamDetailSubTab(st as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold capitalize cursor-pointer transition-all ${
                      teamDetailSubTab === st ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {st === 'members' ? `Members ${selectedTeamDetail.member_count}` : st === 'agents' ? `Agents ${selectedTeamDetail.agents_count}` : st === 'workflows' ? `Workflows ${selectedTeamDetail.workflows_count}` : st}
                  </button>
                ))}
              </div>

              {/* TEAM OVERVIEW KPIS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">TEAM MEMBERS</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-black">{selectedTeamDetail.member_count}</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 2 vs last 7 days</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">ACTIVE AGENTS</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-indigo-600">{selectedTeamDetail.agents_count}</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 2 vs last 7 days</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">WORKFLOWS</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-600">{selectedTeamDetail.workflows_count}</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 3 vs last 7 days</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">RUNS (7D)</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono">{selectedTeamDetail.total_runs_7d}</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 15% vs last 7 days</span>
                  </div>
                </div>
              </div>

              {/* TEAM MEMBERS TABLE & TEAM PERFORMANCE CARD */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT 2/3: TEAM MEMBERS LIST */}
                <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider">TEAM MEMBERS</h3>
                    <button className="text-xs font-black text-indigo-600 hover:underline cursor-pointer">View all members</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-black">
                          <th className="py-2 px-3">Member</th>
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                          { name: 'Wildan A.', email: 'wildan@zega.ai', role: 'Team Owner', status: 'Active', isOwner: true },
                          { name: 'Sarah K.', email: 'sarah@zega.ai', role: 'Admin', status: 'Active', isOwner: false },
                          { name: 'Alex M.', email: 'alex@zega.ai', role: 'Member', status: 'Active', isOwner: false },
                          { name: 'Elena R.', email: 'elena@zega.ai', role: 'Member', status: 'Active', isOwner: false },
                          { name: 'Rudi H.', email: 'rudi@zega.ai', role: 'Member', status: 'Active', isOwner: false },
                        ].map((m) => (
                          <tr key={m.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 flex items-center gap-2.5">
                              <div className="size-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center text-xs">
                                {m.name[0]}
                              </div>
                              <div>
                                <div className="font-bold flex items-center gap-1.5">
                                  <span>{m.name}</span>
                                  {m.isOwner && <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-50 text-indigo-600 font-extrabold">Team Owner</span>}
                                </div>
                                <span className="text-[9.5px] text-slate-400">{m.email}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-600">{m.role}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT 1/3: TEAM PERFORMANCE CARD */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider">TEAM PERFORMANCE (7D)</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Success Rate</span>
                        <div className="text-xl font-black text-emerald-600 mt-0.5">98.7% <span className="text-[10px] font-bold text-emerald-500">▲ 1.2%</span></div>
                      </div>
                      <Sparkline color="#10b981" data={[90, 92, 95, 98, 98, 99, 98.7]} />
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Response Time</span>
                        <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">2.42s <span className="text-[10px] font-bold text-emerald-500">▼ 0.6s</span></div>
                      </div>
                      <Sparkline color="#6366f1" data={[3.2, 3.0, 2.8, 2.6, 2.5, 2.42]} />
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Tasks Completed</span>
                        <div className="text-xl font-black text-indigo-600 mt-0.5">24.8K <span className="text-[10px] font-bold text-emerald-500">▲ 12.6%</span></div>
                      </div>
                      <Sparkline color="#8b5cf6" data={[15, 18, 20, 22, 24, 24.8]} />
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Cost Saved</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">$12,450 <span className="text-[10px] font-bold text-emerald-500">▲ 18.2%</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIVE AGENTS CARDS STRIP */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">ACTIVE AGENTS IN TEAM</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { name: 'Sales Agent', status: 'Active', tag: 'Lead management' },
                    { name: 'Lead Scoring Agent', status: 'Active', tag: 'Score and qualify leads' },
                    { name: 'Email Outreach Agent', status: 'Active', tag: 'Email automation' },
                    { name: 'Proposal Agent', status: 'Active', tag: 'Generate proposals' },
                    { name: 'CRM Sync Agent', status: 'Active', tag: 'Sync CRM data' },
                  ].map((ag) => (
                    <div key={ag.name} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black truncate">{ag.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 block truncate">{ag.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* AI TEAMS OVERVIEW IF NO TEAM SELECTED (PANEL 2) */
            <div className="space-y-6">
              {/* TEAMS HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">AI Teams</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Organize AI agents into specialized enterprise workforce teams</p>
                </div>
                <button onClick={() => setActiveModal('create_team_modal')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 shadow-md transition-all active:scale-95 cursor-pointer">
                  <Plus size={15} />
                  <span>Create Team</span>
                </button>
              </div>

              {/* 5 EXECUTIVE KPI STRIP FOR TEAMS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">TOTAL TEAMS</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-black">12</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 20%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">vs last 7 days</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">TOTAL MEMBERS</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-indigo-600">128</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 18%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">vs last 7 days</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">AGENTS IN TEAMS</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-600">215</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 22%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">vs last 7 days</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">ACTIVE WORKFLOWS</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono">342</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 14%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">vs last 7 days</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase">TASKS AUTOMATED</span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-purple-600">2.43M</span>
                    <span className="text-[10px] font-bold text-emerald-500">▲ 28%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">vs last 7 days</span>
                </div>
              </div>

              {/* AI TEAMS TABLE & TEAM ACTIVITY LOGFEED */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* LEFT 3/4: TEAMS TABLE */}
                <div className="lg:col-span-3 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider">AI TEAMS</h3>
                    <button className="text-xs font-black text-indigo-600 hover:underline cursor-pointer">View all teams</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-black">
                          <th className="py-2.5 px-3">Team</th>
                          <th className="py-2.5 px-3">Members</th>
                          <th className="py-2.5 px-3">Agents</th>
                          <th className="py-2.5 px-3">Workflows</th>
                          <th className="py-2.5 px-3">Runs (7D)</th>
                          <th className="py-2.5 px-3">Performance</th>
                          <th className="py-2.5 px-3">Last Activity</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {teamsData.map((team) => (
                          <tr 
                            key={team.id} 
                            onClick={() => setSelectedTeamDetail(team)} 
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                              <div className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                                <Users size={16} />
                              </div>
                              <div>
                                <div className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">{team.team_name}</div>
                                <span className="text-[9.5px] text-slate-400 font-normal">{team.description}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center -space-x-1.5">
                                {team.members.slice(0, 3).map((m: string, idx: number) => (
                                  <div key={idx} className="size-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px] border-2 border-white dark:border-slate-900">
                                    {m[0]}
                                  </div>
                                ))}
                                {team.member_count > 3 && (
                                  <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                                    +{team.member_count - 3}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">{team.agents_count}</td>
                            <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">{team.workflows_count}</td>
                            <td className="py-3 px-3 font-mono font-bold">{team.total_runs_7d}</td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                              {team.success_rate_pct} <span className="text-[9.5px] font-sans px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600">{team.health}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-400">{team.last_activity}</td>
                            <td className="py-3 px-3 text-right">
                              <button onClick={(e) => { e.stopPropagation(); setSelectedTeamDetail(team); }} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                                <MoreVertical size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT 1/4: TEAM ACTIVITY STREAM */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-wider">TEAM ACTIVITY</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">See what your teams are working on</p>
                  <div className="space-y-3 text-xs pt-1">
                    {[
                      { team: 'Sales Team', msg: 'Workflow updated', time: '2m ago' },
                      { team: 'Finance Team', msg: 'New agent deployed', time: '5m ago' },
                      { team: 'Support Team', msg: 'Agent configuration changed', time: '1d ago' },
                      { team: 'Operations Team', msg: 'New workflow created', time: '2d ago' },
                      { team: 'Marketing Team', msg: 'Template applied', time: '3d ago' },
                    ].map((act, idx) => (
                      <div key={idx} className="pb-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-indigo-600">{act.team}</span>
                          <span className="text-slate-400">{act.time}</span>
                        </div>
                        <p className="font-bold text-[11px] mt-0.5 text-slate-800 dark:text-slate-200">{act.msg}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer">
                    View all activity
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* C. TEMPLATES SUB-TAB (MATCHING MOCKUP PANEL 4) */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6 animate-fadeIn">
          {/* TEMPLATES HERO BANNER */}
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-800/50">
            <div className="space-y-3 max-w-xl z-10">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Start with professional templates
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed font-medium">
                Use pre-built templates to create powerful agents and workflows in minutes with 9Router-L5 multi-LLM router integration.
              </p>
            </div>
            <button onClick={() => setActiveModal('create_agent_modal')} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer active:scale-95 flex-shrink-0">
              + New Template
            </button>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold">
                <option>All Categories</option>
                <option>Sales</option>
                <option>Finance</option>
                <option>Support</option>
                <option>Marketing</option>
              </select>
              <select className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold">
                <option>All Use Cases</option>
                <option>CRM</option>
                <option>Accounting</option>
                <option>ITSM</option>
              </select>
            </div>
          </div>

          {/* POPULAR TEMPLATES GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">POPULAR TEMPLATES</h2>
              <button className="text-xs font-black text-indigo-600 hover:underline cursor-pointer">View all templates</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {templatesData.slice(0, 4).map((tmpl) => (
                <div key={tmpl.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between space-y-3 hover:border-indigo-400 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                        <Layers size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">{tmpl.template_name}</span>
                        <span className="text-[9.5px] text-slate-400">Qualify leads and score prospects</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      {tmpl.tags.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9.5px] font-bold text-slate-600">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{tmpl.rating}</span>
                      <span className="text-slate-400 font-normal">({tmpl.reviews})</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (onTriggerToast) onTriggerToast(`Template '${tmpl.template_name}' applied successfully!`);
                        setActiveSubTab('my_agents');
                      }} 
                      className="px-3.5 py-1 rounded-xl bg-indigo-600 text-white text-xs font-black cursor-pointer shadow-2xs active:scale-95"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ALL TEMPLATES TABLE */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider">ALL TEMPLATES</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-black">
                    <th className="py-2.5 px-3">Template</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Use Case</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Usage</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {templatesData.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Bot size={15} className="text-indigo-600" />
                        <span>{t.template_name}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-600">{t.category}</td>
                      <td className="py-3 px-3 text-slate-500">{t.use_case}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${t.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {t.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold flex items-center gap-1">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{t.rating} ({t.reviews})</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">{t.usage}</td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => {
                            if (onTriggerToast) onTriggerToast(`Applied template '${t.template_name}'`);
                            setActiveSubTab('my_agents');
                          }} 
                          className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black cursor-pointer hover:bg-indigo-100"
                        >
                          Use Template
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span>Showing 1 to 5 of 120 templates</span>
              <div className="flex items-center gap-1 font-bold">
                {[1, 2, 3, 24].map(p => (
                  <button key={p} className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs cursor-pointer">{p}</button>
                ))}
                <span className="ml-2 text-xs">5 / page</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D. MY AGENTS WORKFORCE SUB-TAB (MATCHING MOCKUP & REALTIME TELEMETRY) */}
      {activeSubTab === 'my_agents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* LEFT 3/4: RECOMMENDED CARDS */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  MY FEATURED AGENTS (OWNER: DANZ A.)
                </h2>
                <button onClick={() => setActiveSubTab('marketplace')} className="text-xs font-black text-indigo-600 hover:underline cursor-pointer">
                  View all marketplace
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'Sales Agent', popular: true, desc: 'Automates lead management, CRM updates, and sales outreach.', tags: ['Sales', 'CRM'], rating: '4.9', reviews: '124' },
                  { name: 'Finance Agent', popular: false, desc: 'Handles invoices, payments, reconciliation, and reporting.', tags: ['Finance', 'Accounting'], rating: '4.8', reviews: '98' },
                  { name: 'Support Agent', popular: false, desc: 'Resolves customer issues and manages support workflows.', tags: ['Support', 'ITSM'], rating: '4.8', reviews: '155' },
                  { name: 'Research Agent', popular: false, desc: 'Conducts research and generates insights from multiple sources.', tags: ['Research', 'Analytics'], rating: '4.9', reviews: '87' },
                ].map((agent) => (
                  <div key={agent.name} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between space-y-3 hover:border-indigo-400 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                            <Bot size={18} />
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">{agent.name}</span>
                        </div>
                        {agent.popular && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-200">Popular</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed font-medium">{agent.desc}</p>
                      <div className="flex items-center gap-1.5 mt-3">
                        {agent.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9.5px] font-bold text-slate-600 dark:text-slate-400">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{agent.rating}</span>
                        <span className="text-slate-400 font-normal">({agent.reviews})</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedAgent(agent);
                          setActiveModal('deploy_modal');
                        }} 
                        className="px-3.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-xs font-black cursor-pointer shadow-2xs active:scale-95"
                      >
                        Deploy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT 1/4: REALTIME SVG AGENT DISTRIBUTION DONUT */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">AGENT DISTRIBUTION</h2>
                <button onClick={() => setActiveModal('distribution_modal')} className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer">View report</button>
              </div>
              
              <RealtimeAgentDonutChart
                totalCount={128}
                onCategoryClick={(cat) => {
                  setCategoryFilter(cat === 'Others' ? 'All Categories' : cat);
                  if (onTriggerToast) onTriggerToast(`Filtered by category: ${cat}`);
                }}
                data={[
                  { category: 'Sales', percent: 22.5, count: 144, colorHex: '#4f46e5' },
                  { category: 'Finance', percent: 18.2, count: 116, colorHex: '#10b981' },
                  { category: 'Support', percent: 16.1, count: 103, colorHex: '#0284c7' },
                  { category: 'Marketing', percent: 12.7, count: 81, colorHex: '#f59e0b' },
                  { category: 'HR', percent: 9.1, count: 58, colorHex: '#a855f7' },
                  { category: 'Operations', percent: 8.3, count: 53, colorHex: '#e11d48' },
                  { category: 'Research', percent: 7.1, count: 45, colorHex: '#0d9488' },
                  { category: 'Others', percent: 6.0, count: 38, colorHex: '#94a3b8' },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. ALL AGENTS / MY DEPLOYED WORKFORCE TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LEFT 3/4: MAIN AGENTS DATA TABLE */}
        <div className="lg:col-span-3 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {activeSubTab === 'my_agents' ? 'MY DEPLOYED WORKFORCE (OWNER: DANZ A.)' : 'ALL AGENTS'}
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveSubTab('marketplace')} className="text-[11px] font-black text-indigo-600 hover:underline cursor-pointer">
                View all agents
              </button>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button onClick={() => setViewMode('list')} className={`p-1 rounded-md cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600' : 'text-slate-400'}`}>
                  <List size={13} />
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1 rounded-md cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600' : 'text-slate-400'}`}>
                  <LayoutGrid size={13} />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold text-[10px] uppercase">
                    <th className="py-2.5 px-3">Agent</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Health</th>
                    <th className="py-2.5 px-3">Runs (7D)</th>
                    <th className="py-2.5 px-3">Success Rate</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Updated</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredMyAgents.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                        <div className={`size-7 rounded-lg flex items-center justify-center font-bold ${row.bgTint}`}>
                          <Bot size={15} />
                        </div>
                        <div>
                          <div>{row.instance_name}</div>
                          <span className="text-[9.5px] text-slate-400 font-normal">{row.subtitle}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-bold">{row.category}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${row.status === 'Active' || row.status === 'Online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">● {row.health_score}%</td>
                      <td className="py-3 px-3 font-mono font-bold">{row.runs_7d}</td>
                      <td className="py-3 px-3 font-mono text-emerald-600 font-black">{row.success_rate_pct}</td>
                      <td className="py-3 px-3 text-slate-600 font-bold">{row.owner_name}</td>
                      <td className="py-3 px-3 text-slate-400">{row.updated}</td>
                      <td className="py-3 px-3 text-right relative">
                        <button 
                          onClick={() => setActiveDropdownRow(activeDropdownRow === row.id ? null : row.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {activeDropdownRow === row.id && (
                          <div className="absolute right-3 top-8 z-30 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-left space-y-1 animate-fadeIn">
                            <button 
                              onClick={() => handleToggleAgentStatus(row)} 
                              className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                            >
                              <Pause size={12} />
                              <span>{row.status === 'Active' ? 'Pause Agent' : 'Resume Agent'}</span>
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedAgent(row);
                                setActiveModal('config_modal');
                                setActiveDropdownRow(null);
                              }} 
                              className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                            >
                              <Sliders size={12} />
                              <span>Configure</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMyAgents.map((row) => (
                <div key={row.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">{row.instance_name}</span>
                    <span className="text-[10px] font-black text-emerald-600">{row.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">{row.subtitle}</div>
                  <div className="flex justify-between text-xs font-mono pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Runs: {row.runs_7d}</span>
                    <span className="text-emerald-500 font-bold">{row.success_rate_pct}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Showing 1 to 8 of 638 agents</span>
            <div className="flex items-center gap-1 font-bold">
              {[1, 2, 3].map(pg => (
                <button 
                  key={pg} 
                  onClick={() => setCurrentPage(pg)} 
                  className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${currentPage === pg ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}
                >
                  {pg}
                </button>
              ))}
              <span className="px-1">...</span>
              <button className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs">80</button>
              <span className="ml-2 text-xs">10 / page</span>
            </div>
          </div>
        </div>

        {/* RIGHT 1/4: AGENT HEALTH & RECENT ACTIVITY */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider">AGENT HEALTH</h2>
              <button onClick={() => setActiveModal('health_modal')} className="text-[10px] font-black text-emerald-600 hover:underline cursor-pointer">99.2% Excellent</button>
            </div>
            <div className="flex justify-between font-bold"><span>Healthy</span><span className="text-emerald-600">613 (96.1%)</span></div>
            <div className="flex justify-between font-bold"><span>Warning</span><span className="text-amber-600">20 (3.1%)</span></div>
            <div className="flex justify-between font-bold"><span>Critical</span><span className="text-rose-600">5 (0.8%)</span></div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider">RECENT ACTIVITY</h2>
              <button onClick={() => setActiveModal('activity_modal')} className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer">View all</button>
            </div>
            {[
              { name: 'Sales Agent', msg: 'Lead qualified: ACME Corporation', time: '2m ago' },
              { name: 'Finance Agent', msg: 'Invoice processed: $12,450.00', time: '9m ago' },
              { name: 'Support Agent', msg: 'Ticket resolved: #TK-7832', time: '15m ago' },
              { name: 'HR Agent', msg: 'New candidate onboarded', time: '25m ago' },
              { name: 'Data Analyst Agent', msg: 'Report generated successfully', time: '1h ago' },
            ].map((act, i) => (
              <div key={i} className="pb-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span className="text-indigo-600">{act.name}</span>
                  <span>{act.time}</span>
                </div>
                <p className="font-bold text-[11px] truncate">{act.msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ROW: PERFORMANCE OVERVIEW, TOP PERFORMERS, QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PERFORMANCE OVERVIEW */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-wider">PERFORMANCE OVERVIEW (LAST 7 DAYS)</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Runs</span>
              <div className="text-base font-black mt-0.5">169.2K <span className="text-[10px] text-emerald-500 font-bold">▲ 16.3%</span></div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
              <div className="text-base font-black mt-0.5">98.6% <span className="text-[10px] text-emerald-500 font-bold">▲ 1.9%</span></div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Response Time</span>
              <div className="text-base font-black mt-0.5">2.42s <span className="text-[10px] text-emerald-500 font-bold">▼ 8.6%</span></div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cost Saved</span>
              <div className="text-base font-black mt-0.5">$42,580 <span className="text-[10px] text-emerald-500 font-bold">▲ 22.3%</span></div>
            </div>
          </div>
        </div>

        {/* TOP PERFORMERS */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-wider">TOP PERFORMERS</h2>
            <button onClick={() => setActiveModal('top_performers_modal')} className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer">View leaderboard</button>
          </div>
          <div className="space-y-2 text-xs font-bold">
            {[
              { rank: 1, name: 'Sales Agent', rate: '99.9%', runs: '24,892' },
              { rank: 2, name: 'Finance Agent', rate: '99.8%', runs: '18,392' },
              { rank: 3, name: 'Data Analyst Agent', rate: '99.7%', runs: '15,208' },
              { rank: 4, name: 'Support Agent', rate: '99.5%', runs: '12,102' },
              { rank: 5, name: 'Marketing Agent', rate: '99.1%', runs: '9,812' },
            ].map((p) => (
              <div key={p.rank} className="flex justify-between items-center p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className="size-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-[10px] font-black flex items-center justify-center">{p.rank}</span>
                  <span>{p.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-emerald-500">{p.rate}</span>
                  <span className="text-slate-400">{p.runs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS GRID (6 ACTIVE BUTTONS) */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black uppercase tracking-wider">QUICK ACTIONS</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Create Agent', sub: 'Build a new AI agent', icon: Plus, act: () => setActiveModal('create_agent_modal') },
              { label: 'Import Template', sub: 'Use pre-built templates', icon: Layers, act: () => setActiveSubTab('templates') },
              { label: 'Deploy Agent', sub: 'Deploy to production', icon: Zap, act: () => setActiveModal('deploy_modal') },
              { label: 'Create Team', sub: 'Organize agent teams', icon: Users, act: () => setActiveSubTab('teams') },
              { label: 'Workflow Studio', sub: 'Design automation', icon: Workflow, act: () => onNavigateTab ? onNavigateTab('sandbox') : (onTriggerToast && onTriggerToast('Navigating to Workflow Studio...')) },
              { label: 'View Reports', sub: 'Analytics & Insights', icon: BarChart3, act: () => onNavigateTab ? onNavigateTab('audit_logs') : (onTriggerToast && onTriggerToast('Navigating to Reports...')) },
            ].map((qa) => {
              const IconComponent = qa.icon;
              return (
                <button
                  key={qa.label}
                  onClick={qa.act}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-indigo-400 text-left transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <IconComponent size={14} className="text-indigo-600 mb-1" />
                  <div className="text-[11px] font-black leading-tight">{qa.label}</div>
                  <div className="text-[9px] text-slate-400 font-semibold">{qa.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. ALL REALTIME INTERACTIVE MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          {/* CREATE AGENT MODAL */}
          {activeModal === 'create_agent_modal' && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Plus size={18} className="text-indigo-600" />
                  Create Enterprise AI Agent
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 cursor-pointer"><X size={16} /></button>
              </div>

              <form onSubmit={handleCreateAgentSubmit} className="space-y-3 text-xs font-bold">
                <div>
                  <label className="text-slate-700 dark:text-slate-300">Agent Instance Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lead Qualification Bot" 
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300">Operational Category</label>
                  <select 
                    value={newAgentCategory}
                    onChange={(e) => setNewAgentCategory(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option>Sales</option>
                    <option>Finance</option>
                    <option>Support</option>
                    <option>Marketing</option>
                    <option>HR</option>
                    <option>Legal</option>
                    <option>Research</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300">Description & Role</label>
                  <textarea 
                    rows={2}
                    placeholder="Autonomous lead generation and customer CRM updates." 
                    value={newAgentDesc}
                    onChange={(e) => setNewAgentDesc(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500 text-xs font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow cursor-pointer">Create Agent</button>
                </div>
              </form>
            </div>
          )}

          {/* CREATE TEAM MODAL */}
          {activeModal === 'create_team_modal' && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" />
                  Create Enterprise AI Team
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 cursor-pointer"><X size={16} /></button>
              </div>

              <form onSubmit={handleCreateTeamSubmit} className="space-y-3 text-xs font-bold">
                <div>
                  <label className="text-slate-700 dark:text-slate-300">Team Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Autonomous Growth Swarm" 
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300">Department / Category</label>
                  <select 
                    value={newTeamCategory}
                    onChange={(e) => setNewTeamCategory(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option>Sales</option>
                    <option>Finance</option>
                    <option>Support</option>
                    <option>Marketing</option>
                    <option>Operations</option>
                    <option>HR</option>
                    <option>Legal</option>
                    <option>Research</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300">Team Mission & Description</label>
                  <textarea 
                    rows={2}
                    placeholder="End-to-end lead qualification, CRM synchronization, and outreach automation." 
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300">
                  Team lead owner will default to <span className="font-extrabold">Danz A.</span> with OWASP Level 3 RLS permissions.
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500 text-xs font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow cursor-pointer">Create Team</button>
                </div>
              </form>
            </div>
          )}

          {/* DISTRIBUTION REPORT MODAL */}
          {activeModal === 'distribution_modal' && (
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
              <PieChartIcon size={32} className="text-indigo-600 mx-auto" />
              <div>
                <h3 className="text-base font-black">Agent Distribution Telemetry</h3>
                <p className="text-xs text-slate-500 mt-1">Live telemetry across 638 enterprise agent pods</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-mono text-xs space-y-1 text-left">
                <div className="flex justify-between"><span>Sales Pods:</span><span className="text-indigo-600 font-bold">144 (22.5%)</span></div>
                <div className="flex justify-between"><span>Finance Pods:</span><span className="text-emerald-600 font-bold">116 (18.2%)</span></div>
                <div className="flex justify-between"><span>Support Pods:</span><span className="text-sky-600 font-bold">103 (16.1%)</span></div>
                <div className="flex justify-between"><span>CDN Low Latency:</span><span className="text-purple-600 font-bold">142ms Avg</span></div>
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer">Close Report</button>
            </div>
          )}

          {/* CONFIGURATION MODAL */}
          {activeModal === 'config_modal' && selectedAgent && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Sliders size={18} className="text-indigo-600" />
                  Configure Instance: {selectedAgent.instance_name}
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 cursor-pointer"><X size={16} /></button>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div>
                  <label className="text-slate-700 dark:text-slate-300">Model Engine Router</label>
                  <select className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold">
                    <option>9Router-L5 (Flagship Enterprise Engine)</option>
                    <option>Claude 3.5 Sonnet (Direct High Precision)</option>
                    <option>GPT-4o Enterprise (Zero-Data Retention)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-slate-300">Max Concurrency</label>
                    <input type="number" defaultValue={25} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold" />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-slate-300">Rate Limit (req/min)</label>
                    <input type="number" defaultValue={500} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-500 text-xs font-bold cursor-pointer">Cancel</button>
                <button 
                  onClick={() => {
                    setActiveModal(null);
                    if (onTriggerToast) onTriggerToast(`Configuration saved for ${selectedAgent.instance_name}!`);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {/* DEPLOY MODAL */}
          {activeModal === 'deploy_modal' && (
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
              <Zap size={28} className="text-indigo-600 mx-auto" />
              <div>
                <h3 className="text-base font-black">Deploy Enterprise AI Agent</h3>
                <p className="text-xs text-slate-500 mt-1">Instance will be deployed to active production workforce under Danz A.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(null)} className="w-1/2 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">Cancel</button>
                <button 
                  onClick={() => {
                    setActiveModal(null);
                    if (onTriggerToast) onTriggerToast(`SUCCESS: Agent deployed into production under Danz A.!`);
                  }}
                  className="w-1/2 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Deploy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PieChartIcon(props: any) {
  return <BarChart3 {...props} />;
}
