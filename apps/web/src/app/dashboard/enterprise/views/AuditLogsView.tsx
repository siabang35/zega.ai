import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Download, ChevronDown, Filter, Code, X, Copy, Check, 
  ArrowUpRight, ArrowDownRight, Eye, ShieldAlert, CheckCircle2, User,
  Database, Server, Shield, FileText, Layers, RefreshCw, ChevronRight, Activity
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';
import { getActiveTenantIds } from '../../contexts/TenantContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

interface AuditLogsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function AuditLogsView({ onTriggerToast }: AuditLogsViewProps) {
  const triggerToast = (msg: string) => { if (onTriggerToast) onTriggerToast(msg); };

  // State Management
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedSystem, setSelectedSystem] = useState('All Systems');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogIndex, setSelectedLogIndex] = useState(0);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRangeLabel, setDateRangeLabel] = useState('May 20 – May 27, 2025');
  const [copiedJson, setCopiedJson] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [timeframeOverTime, setTimeframeOverTime] = useState('Last 7 Days');

  // Supabase Data State with Realistic Fallback
  const [auditLogs, setAuditLogs] = useState<any[]>([
    {
      id: 'evt_20250527_103045',
      time: 'May 27, 2025 10:30:45 AM',
      user: 'cole.coa@zegaai.com',
      userName: 'Cole Coa',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      action: 'User login successful',
      category: 'Authentication',
      resource: 'Console',
      ip: '103.12.45.67',
      severity: 'Informational',
      status: 'Success',
      payload: { event_id: 'evt_20250527_103045', auth_type: 'SAML SSO', provider: 'Okta', user: 'cole.coa@zegaai.com' }
    },
    {
      id: 'evt_20250527_102812',
      time: 'May 27, 2025 10:28:12 AM',
      user: 'wildan@zegaai.com',
      userName: 'Wildan A.',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      action: 'Created API key',
      category: 'Configuration',
      resource: 'API Keys',
      ip: '103.12.45.67',
      severity: 'Medium',
      status: 'Success',
      payload: { event_id: 'evt_20250527_102812', key_name: 'ZK42-PROD', created_by: 'wildan@zegaai.com' }
    },
    {
      id: 'evt_20250527_102533',
      time: 'May 27, 2025 10:25:33 AM',
      user: 'sarah.admin@zegaai.com',
      userName: 'Sarah Jenkins',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
      action: 'Accessed sensitive data',
      category: 'Data Access',
      resource: 'Customer Database',
      ip: '185.34.21.123',
      severity: 'High',
      status: 'Success',
      payload: { event_id: 'evt_20250527_102533', table: 'enterprise_customers', records: 1420 }
    },
    {
      id: 'evt_20250527_102011',
      time: 'May 27, 2025 10:20:11 AM',
      user: 'system',
      userName: 'System Orchestrator',
      userAvatar: null,
      action: 'Firewall rule updated',
      category: 'Configuration',
      resource: 'Security Center',
      ip: '10.0.0.1',
      severity: 'Medium',
      status: 'Success',
      payload: { event_id: 'evt_20250527_102011', action: 'BLOCK_IP', target: '198.51.100.23' }
    },
    {
      id: 'evt_20250527_101807',
      time: 'May 27, 2025 10:18:07 AM',
      user: 'rendy.dev@zegaai.com',
      userName: 'Rendy Dev',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      action: 'Failed login attempt',
      category: 'Authentication',
      resource: 'Console',
      ip: '203.0.113.45',
      severity: 'High',
      status: 'Failed',
      payload: { event_id: 'evt_20250527_101807', reason: 'Invalid MFA Token', attempt: 3 }
    },
    {
      id: 'evt_20250527_101522',
      time: 'May 27, 2025 10:15:22 AM',
      user: 'api-service',
      userName: 'API Integration Engine',
      userAvatar: null,
      action: 'Data export completed',
      category: 'Data Access',
      resource: 'Reports Export',
      ip: '54.239.28.85',
      severity: 'Informational',
      status: 'Success',
      payload: { event_id: 'evt_20250527_101522', export_type: 'PDF Audit Report', size: '14.8 MB' }
    },
    {
      id: 'evt_20250527_100541',
      time: 'May 27, 2025 10:05:41 AM',
      user: 'mfa.system',
      userName: 'MFA Security Engine',
      userAvatar: null,
      action: 'MFA enabled for user',
      category: 'Security',
      resource: 'User Security',
      ip: '10.0.0.2',
      severity: 'Low',
      status: 'Success',
      payload: { event_id: 'evt_20250527_100541', user: 'cole.coa@zegaai.com', method: 'TOTP' }
    },
    {
      id: 'evt_20250527_100114',
      time: 'May 27, 2025 10:01:14 AM',
      user: 'security.bot',
      userName: 'AI Threat Detector',
      userAvatar: null,
      action: 'Suspicious activity detected',
      category: 'Security',
      resource: 'Threat Detection',
      ip: '198.51.100.23',
      severity: 'Critical',
      status: 'Success',
      payload: { event_id: 'evt_20250527_100114', threat: 'SQL Injection', mitigation: 'IP Geo-Fence Block' }
    }
  ]);

  // Load Realtime Data from Supabase
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    const loadAuditData = async () => {
      const data = await enterpriseSupabaseService.getEnterpriseRealtimeData();
      if (data && data.auditLogs && data.auditLogs.length > 0) {
        setAuditLogs(data.auditLogs.map((log: any) => ({
          id: log.event_id || log.id,
          time: log.formatted_time || log.created_at,
          user: log.user_email || 'user@zegaai.com',
          userName: log.user_name || log.user_email,
          userAvatar: log.user_avatar || null,
          action: log.action || 'System Event',
          category: log.category || 'Authentication',
          resource: log.resource || 'Console',
          ip: log.ip_address || '103.12.45.67',
          severity: log.severity || 'Informational',
          status: log.status || 'Success',
          payload: log.payload_json || { event_id: log.event_id }
        })));
      }
    };

    loadAuditData();
    unsubscribe = enterpriseSupabaseService.subscribeToEnterpriseRealtime(getActiveTenantIds().organizationId || '', () => {
      loadAuditData();
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Filtered Logs Calculation
  const filteredLogs = auditLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      log.user.toLowerCase().includes(q) || 
      log.action.toLowerCase().includes(q) || 
      log.resource.toLowerCase().includes(q) || 
      log.category.toLowerCase().includes(q) ||
      log.ip.includes(q);

    const matchesTab = 
      activeTab === 'Overview' || 
      activeTab === 'All Logs' || 
      (activeTab === 'Admin Activity' && (log.user.includes('admin') || log.category === 'Configuration')) ||
      (activeTab === 'User Activity' && log.category === 'Authentication') ||
      (activeTab === 'Data Access' && log.category === 'Data Access') ||
      (activeTab === 'Security Events' && (log.category === 'Security' || log.severity === 'Critical' || log.severity === 'High')) ||
      (activeTab === 'Configuration' && log.category === 'Configuration') ||
      (activeTab === 'System Events' && (log.user === 'system' || log.user.includes('bot'))) ||
      (activeTab === 'API Activity' && (log.resource.includes('API') || log.action.includes('API')));

    return matchesSearch && matchesTab;
  });

  const selectedLog = filteredLogs[selectedLogIndex] || filteredLogs[0] || auditLogs[0];

  // Helper Badge Colors
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Authentication': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Configuration': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Data Access': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Security': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'Informational': return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'Low': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Medium': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'High': return 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Critical': return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300 font-extrabold animate-pulse';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Export JSON Report Handler
  const handleExportLogs = () => {
    const reportData = {
      export_timestamp: new Date().toISOString(),
      system_filter: selectedSystem,
      date_range: dateRangeLabel,
      total_records: filteredLogs.length,
      audit_logs: filteredLogs
    };
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('📥 Real-time audit logs report exported successfully!');
  };

  // Chart Data Configurations
  const lineChartData = {
    labels: ['May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'],
    datasets: [
      {
        label: 'All Events',
        data: [52000, 64000, 58000, 51000, 59000, 48000, 62000],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2
      },
      {
        label: 'Admin Actions',
        data: [38000, 42000, 39000, 34000, 41000, 33000, 43000],
        borderColor: '#8B5CF6',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 2
      },
      {
        label: 'Failed Attempts',
        data: [18000, 29000, 21000, 16000, 24000, 19000, 22000],
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 2
      },
      {
        label: 'Data Access',
        data: [28000, 34000, 31000, 27000, 35000, 29000, 37000],
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 2
      }
    ]
  };

  const categoryDonutData = {
    labels: ['Administrative', 'Authentication', 'Data Access', 'Configuration', 'System', 'Others'],
    datasets: [
      {
        data: [38.7, 24.1, 17.6, 9.8, 6.1, 3.7],
        backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#94A3B8'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const severityDonutData = {
    labels: ['Informational', 'Low', 'Medium', 'High', 'Critical'],
    datasets: [
      {
        data: [38.9, 24.1, 17.2, 3.8, 9.8],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#F97316', '#EF4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  return (
    <div className="space-y-5 select-none font-sans pb-10">
      {/* 1. EXECUTIVE TITLE HEADER & TOP CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <ShieldAlert size={18} />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Audit Logs</h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Track and review activities across your organization for security, compliance, and operational visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select 
            value={selectedSystem} 
            onChange={(e) => {
              setSelectedSystem(e.target.value);
              triggerToast(`Filtered logs by system: ${e.target.value}`);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="All Systems">All Systems</option>
            <option value="Console Core">Console Core</option>
            <option value="Workflow Engine">Workflow Engine</option>
            <option value="AI Agents Swarm">AI Agents Swarm</option>
            <option value="Security Gateway">Security Gateway</option>
          </select>

          <button 
            onClick={() => setShowDateRangeModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs hover:border-indigo-500 transition-all"
          >
            <Calendar size={14} className="text-indigo-500" />
            <span>{dateRangeLabel}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
          >
            <Filter size={14} className="text-slate-400" />
            <span>Filters</span>
          </button>

          <button 
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {/* 2. CATEGORY PILL FILTER TABS BAR (8 TABS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 [&::-webkit-scrollbar]:hidden">
        {[
          'Overview', 'All Logs', 'Admin Activity', 'User Activity', 
          'Data Access', 'Security Events', 'Configuration', 'System Events', 'API Activity'
        ].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                triggerToast(`Filtered view by: ${tab}`);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 3. TOP 6 KPI METRIC CARDS WITH SPARKLINES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'TOTAL EVENTS', val: '2,458,732', trend: '↑ 18.6%', trendType: 'up', sub: 'vs last 7d', color: '#3B82F6', line: 'M0,15 Q20,5 40,12 T80,8 T120,18 T160,4' },
          { label: 'UNIQUE USERS', val: '1,248', trend: '↑ 12.4%', trendType: 'up', sub: 'vs last 7d', color: '#10B981', line: 'M0,18 Q20,12 40,14 T80,8 T120,10 T160,5' },
          { label: 'ADMIN ACTIONS', val: '8,642', trend: '↑ 9.7%', trendType: 'up', sub: 'vs last 7d', color: '#8B5CF6', line: 'M0,14 Q20,16 40,10 T80,12 T120,8 T160,6' },
          { label: 'FAILED ATTEMPTS', val: '312', trend: '↑ 15.3%', trendType: 'alert', sub: 'vs last 7d', color: '#EF4444', line: 'M0,12 Q20,18 40,8 T80,14 T120,6 T160,16' },
          { label: 'DATA ACCESS EVENTS', val: '24,851', trend: '↑ 21.6%', trendType: 'up', sub: 'vs last 7d', color: '#6366F1', line: 'M0,16 Q20,10 40,15 T80,7 T120,12 T160,4' },
          { label: 'CRITICAL EVENTS', val: '42', trend: '↓ 16.7%', trendType: 'down', sub: 'vs last 7d', color: '#F59E0B', line: 'M0,18 Q20,8 40,14 T80,6 T120,10 T160,3' }
        ].map((card, i) => (
          <div key={i} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs hover:border-indigo-400 transition-all">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{card.label}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">{card.val}</span>
              <span className={`text-[10px] font-black flex items-center gap-0.5 ${card.trendType === 'alert' ? 'text-rose-500' : card.trendType === 'down' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {card.trend}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-bold text-slate-400">{card.sub}</span>
              <svg className="w-16 h-4 stroke-current" fill="none" viewBox="0 0 160 24">
                <path d={card.line} stroke={card.color} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* 4. VISUALIZATION SECTION (3 PANELS: AREA CHART + 2 DONUT CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panel 1: Events Over Time */}
        <div className="lg:col-span-6 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">EVENTS OVER TIME</h3>
            <select 
              value={timeframeOverTime}
              onChange={(e) => setTimeframeOverTime(e.target.value)}
              className="text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border-none focus:outline-none cursor-pointer"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
            </select>
          </div>
          <div className="h-48 w-full">
            <Line 
              data={lineChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'top', labels: { boxWidth: 8, font: { size: 9, weight: 'bold' } } } }, 
                scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { grid: { color: 'rgba(226, 232, 240, 0.4)' }, ticks: { font: { size: 9 } } } } 
              }} 
            />
          </div>
        </div>

        {/* Panel 2: Events by Category */}
        <div className="lg:col-span-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">EVENTS BY CATEGORY</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-32 relative shrink-0">
              <Doughnut data={categoryDonutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">2.45M</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">TOTAL</span>
              </div>
            </div>
            <div className="space-y-1 text-[10px] font-bold flex-1">
              {[
                { name: 'Administrative', pct: '38.7%', color: 'bg-blue-500' },
                { name: 'Authentication', pct: '24.1%', color: 'bg-purple-500' },
                { name: 'Data Access', pct: '17.6%', color: 'bg-emerald-500' },
                { name: 'Configuration', pct: '9.8%', color: 'bg-amber-500' },
                { name: 'System', pct: '6.1%', color: 'bg-rose-500' },
                { name: 'Others', pct: '3.7%', color: 'bg-slate-400' }
              ].map((c, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className={`size-2 rounded-full ${c.color}`} /> {c.name}
                  </span>
                  <span className="font-mono text-slate-500">{c.pct}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Inspecting full category telemetry breakdown')} className="text-[10px] font-black text-indigo-600 hover:underline text-left">
            View all categories →
          </button>
        </div>

        {/* Panel 3: Events by Severity */}
        <div className="lg:col-span-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">EVENTS BY SEVERITY</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-32 relative shrink-0">
              <Doughnut data={severityDonutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">2.45M</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">TOTAL</span>
              </div>
            </div>
            <div className="space-y-1 text-[10px] font-bold flex-1">
              {[
                { name: 'Informational', pct: '38.9%', color: 'bg-blue-500' },
                { name: 'Low', pct: '24.1%', color: 'bg-emerald-500' },
                { name: 'Medium', pct: '17.2%', color: 'bg-amber-500' },
                { name: 'High', pct: '3.8%', color: 'bg-orange-500' },
                { name: 'Critical', pct: '9.8%', color: 'bg-rose-500' }
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className={`size-2 rounded-full ${s.color}`} /> {s.name}
                  </span>
                  <span className="font-mono text-slate-500">{s.pct}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Inspecting security severity levels')} className="text-[10px] font-black text-indigo-600 hover:underline text-left">
            View all severity levels →
          </button>
        </div>
      </div>

      {/* 5. RECENT AUDIT LOGS TABLE & RIGHT COLUMN RANKING STACK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Table Column (9 cols) */}
        <div className="lg:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">RECENT AUDIT LOGS</h3>
              <div className="relative w-48">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[9.5px] uppercase font-black text-slate-400 tracking-wider">
                    <th className="py-2 px-2">TIME</th>
                    <th className="py-2 px-2">USER</th>
                    <th className="py-2 px-2">ACTION</th>
                    <th className="py-2 px-2">CATEGORY</th>
                    <th className="py-2 px-2">RESOURCE</th>
                    <th className="py-2 px-2">IP ADDRESS</th>
                    <th className="py-2 px-2">SEVERITY</th>
                    <th className="py-2 px-2">STATUS</th>
                    <th className="py-2 px-2 text-center">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-bold">
                  {filteredLogs.map((log, i) => {
                    const isSelected = selectedLogIndex === i;
                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLogIndex(i)} 
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                      >
                        <td className="py-2.5 px-2 font-mono text-slate-400 text-[10px] whitespace-nowrap">{log.time}</td>
                        <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {log.userAvatar ? (
                              <img src={log.userAvatar} alt="user" className="size-4.5 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="size-4.5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-600 shrink-0">
                                {log.user.substring(0, 2).toUpperCase()}
                              </span>
                            )}
                            <span className="truncate max-w-[120px]">{log.user}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{log.action}</td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md border text-[9.5px] font-bold ${getCategoryBadgeClass(log.category)}`}>
                            {log.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-400 text-[10px] whitespace-nowrap">{log.resource}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-400 text-[10px] whitespace-nowrap">{log.ip}</td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md border text-[9.5px] font-black ${getSeverityBadgeClass(log.severity)}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black ${log.status === 'Success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLogIndex(i);
                              setShowJsonModal(true);
                            }}
                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            title="Inspect JSON Payload"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
            <span>Showing 1 to {filteredLogs.length} of 2,458,732 results</span>
            <div className="flex items-center gap-1 font-bold">
              <button disabled className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 opacity-40">&lt;</button>
              {[1, 2, 3, 4, 5].map((pg) => (
                <button 
                  key={pg} 
                  onClick={() => setCurrentPage(pg)}
                  className={`px-2.5 py-0.5 rounded-lg ${currentPage === pg ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300'}`}
                >
                  {pg}
                </button>
              ))}
              <span>...</span>
              <button onClick={() => setCurrentPage(245874)} className="px-2 py-0.5 rounded-lg hover:bg-slate-100">245874</button>
              <button onClick={() => setCurrentPage(2)} className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">&gt;</button>
            </div>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2 py-0.5 text-[10px] font-bold cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Right Stack Column (3 cols): TOP ACTIVE USERS + TOP ACCESSED RESOURCES */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Active Users */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">TOP ACTIVE USERS</h3>
            <div className="space-y-2 text-[10px] font-bold">
              {[
                { name: 'cole.coa@zegaai.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', count: '24,853' },
                { name: 'sarah.admin@zegaai.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', count: '18,721' },
                { name: 'wildan@zegaai.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', count: '15,942' },
                { name: 'api-service', avatar: null, count: '11,352' },
                { name: 'rendy.dev@zegaai.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces', count: '9,876' }
              ].map((u, i) => (
                <div key={i} className="flex justify-between items-center p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-2 truncate">
                    {u.avatar ? (
                      <img src={u.avatar} alt="user" className="size-5 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="size-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-[9px] font-black shrink-0">API</span>
                    )}
                    <span className="text-slate-800 dark:text-slate-200 truncate">{u.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0 ml-1">{u.count}</span>
                </div>
              ))}
            </div>
            <button onClick={() => triggerToast('Loading complete active users directory')} className="text-[10px] font-black text-indigo-600 hover:underline block pt-1">
              View all users →
            </button>
          </div>

          {/* Top Accessed Resources */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">TOP ACCESSED RESOURCES</h3>
            <div className="space-y-2 text-[10px] font-bold">
              {[
                { icon: Database, name: 'Customer Database', count: '8,432' },
                { icon: FileText, name: 'Reports Export', count: '6,125' },
                { icon: Server, name: 'S3 Bucket - zega-data', count: '5,287' },
                { icon: Layers, name: 'API Gateway', count: '4,931' },
                { icon: Shield, name: 'Security Center', count: '3,442' }
              ].map((r, i) => {
                const Icon = r.icon;
                return (
                  <div key={i} className="flex justify-between items-center p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-2 truncate">
                      <Icon size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200 truncate">{r.name}</span>
                    </div>
                    <span className="font-mono text-slate-500 shrink-0 ml-1">{r.count}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => triggerToast('Loading complete enterprise resources index')} className="text-[10px] font-black text-indigo-600 hover:underline block pt-1">
              View all resources →
            </button>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ROW: 3 OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Card 1: Log Retention & Storage */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">LOG RETENTION & STORAGE</h3>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Retention Period</span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">365 Days</span>
                <span className="text-[9px] font-bold text-slate-400">(Configurable)</span>
              </div>
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-500">Storage Used</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">3.46 TB of 10 TB (34.6%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[34.6%]" />
              </div>
              <span className="text-[9px] font-mono text-slate-400 block pt-0.5">246 / 365 days used</span>
            </div>
          </div>
          <button onClick={() => triggerToast('Opened log retention policy settings')} className="text-[10px] font-black text-indigo-600 hover:underline text-left pt-2">
            View retention settings →
          </button>
        </div>

        {/* Card 2: Compliance Overview */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">COMPLIANCE OVERVIEW</h3>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              {[
                { name: 'SOC 2', status: 'Compliant' },
                { name: 'ISO 27001', status: 'Compliant' },
                { name: 'GDPR', status: 'Compliant' },
                { name: 'PCI DSS', status: 'Compliant' },
                { name: 'HIPAA', status: 'Compliant' }
              ].map((c, i) => (
                <div key={i} className="flex-1 min-w-[70px] p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-1">
                  <div className="size-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="block font-black text-slate-900 dark:text-slate-100 text-[10px]">{c.name}</span>
                  <span className="block text-[8px] font-bold text-emerald-600 dark:text-emerald-400">{c.status}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Opened enterprise compliance reports portal')} className="text-[10px] font-black text-indigo-600 hover:underline text-left pt-2">
            View compliance reports →
          </button>
        </div>

        {/* Card 3: Log Integrations */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">LOG INTEGRATIONS</h3>
            <div className="space-y-2 text-[10px] font-bold">
              {[
                { name: 'SIEM Integration', desc: 'Splunk, Elastic, Microsoft Sentinel', status: 'Active' },
                { name: 'Log Forwarding', desc: 'Real-time log streaming enabled', status: 'Active' },
                { name: 'Webhook Alerts', desc: 'Critical events webhook configured', status: 'Active' }
              ].map((ig, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-slate-900 dark:text-slate-100 block font-extrabold">{ig.name}</span>
                    <span className="text-[9px] text-slate-400 block font-medium">{ig.desc}</span>
                  </div>
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    {ig.status} <ChevronRight size={12} className="text-slate-400" />
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => triggerToast('Opened SIEM & Webhook integration settings')} className="text-[10px] font-black text-indigo-600 hover:underline text-left pt-2">
            Manage integrations →
          </button>
        </div>
      </div>

      {/* 7. JSON PAYLOAD INSPECTOR MODAL */}
      {showJsonModal && selectedLog && (
        <div className="fixed inset-0 z-[10050] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Audit Payload Inspector — {selectedLog.id}</h3>
              </div>
              <button onClick={() => setShowJsonModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
              <pre className="text-[11px] text-emerald-400 leading-relaxed">{JSON.stringify(selectedLog.payload, null, 2)}</pre>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400 font-mono">Payload format: JSON Schema v2</span>
              <button 
                onClick={() => { 
                  navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2)); 
                  setCopiedJson(true); 
                  triggerToast('📋 Raw JSON Audit Payload copied!'); 
                  setTimeout(() => setCopiedJson(false), 2000); 
                }} 
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedJson ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. FILTER AUDIT LOGS MODAL */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[10050] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Filter System Audit Logs</h3>
              </div>
              <button onClick={() => setShowFilterModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block mb-1">System Target</label>
                <select 
                  value={selectedSystem} 
                  onChange={(e) => setSelectedSystem(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="All Systems">All Systems</option>
                  <option value="Console Core">Console Core</option>
                  <option value="Workflow Engine">Workflow Engine</option>
                  <option value="AI Agents Swarm">AI Agents Swarm</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Category Filter</label>
                <select 
                  value={activeTab} 
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Overview">Overview</option>
                  <option value="All Logs">All Logs</option>
                  <option value="Admin Activity">Admin Activity</option>
                  <option value="User Activity">User Activity</option>
                  <option value="Data Access">Data Access</option>
                  <option value="Security Events">Security Events</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => { setSelectedSystem('All Systems'); setActiveTab('Overview'); setSearchQuery(''); triggerToast('Reset audit filters'); }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Reset
              </button>
              <button 
                onClick={() => { setShowFilterModal(false); triggerToast('Applied audit log filters'); }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. DATE RANGE SELECTOR MODAL */}
      {showDateRangeModal && (
        <div className="fixed inset-0 z-[10050] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Select Date Range</h3>
              <button onClick={() => setShowDateRangeModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1.5 text-xs font-bold">
              {['Today', 'Last 24 Hours', 'May 20 – May 27, 2025', 'Last 30 Days', 'Last 90 Days'].map(lbl => (
                <button
                  key={lbl}
                  onClick={() => { setDateRangeLabel(lbl); setShowDateRangeModal(false); triggerToast(`Date range set to ${lbl}`); }}
                  className={`w-full text-left px-3 py-2 rounded-xl cursor-pointer ${dateRangeLabel === lbl ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
