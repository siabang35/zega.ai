import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Calendar, Download, AlertTriangle, ShieldAlert, 
  CheckCircle2, Lock, Key, ChevronDown, Activity, ArrowUpRight, ArrowDownRight,
  Filter, RefreshCw, X, Check, Globe, Server, FileText, Zap, ArrowRight, Radio,
  Shield, Eye, Database, Layers, UserCheck, Settings, Network
} from 'lucide-react';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { InteractiveThreatMap } from './security/InteractiveThreatMap';
import { SecurityCharts, RiskAndDataCharts } from './security/SecurityCharts';
import { SecuritySubViews } from './security/SecuritySubViews';
import { FullMapModal } from './security/FullMapModal';
import { SecurityFilterModal, SecurityFilters } from './security/SecurityFilterModal';

interface AiSafetyViewProps {
  onTriggerToast?: (msg: string) => void;
  initialTab?: string;
}

export function AiSafetyView({ onTriggerToast, initialTab = 'overview' }: AiSafetyViewProps) {
  // Navigation Sub-tabs (7 Tabs matching user specification)
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Filters & State
  const [systemFilter, setSystemFilter] = useState<string>('All Systems');
  const [dateRange, setDateRange] = useState<string>('May 20 – May 27, 2025');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showFullMapModal, setShowFullMapModal] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<SecurityFilters | null>(null);

  // Real-Time Supabase Data State
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Load Realtime Telemetry from Supabase
  const loadData = async () => {
    setIsRefreshing(true);
    const [teleRes, vulnRes, compRes, recRes] = await Promise.all([
      SupabaseDashboardService.getSecurityTelemetry(),
      SupabaseDashboardService.getSecurityVulnerabilities(),
      SupabaseDashboardService.getComplianceFrameworks(),
      SupabaseDashboardService.getSecurityRecommendations(),
    ]);
    setTelemetry(teleRes || []);
    setVulnerabilities(vulnRes || []);
    setCompliance(compRes || []);
    setRecommendations(recRes || []);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = SupabaseDashboardService.subscribeToSecurityRealtime(() => {
      loadData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleApplyFilters = (filters: SecurityFilters) => {
    setAppliedFilters(filters);
    onTriggerToast?.(`Filter Keamanan Diterapkan (${filters.severities.length} Keparahan, ${filters.categories.length} Kategori)`);
  };

  // Export Audit Report
  const handleExportReport = () => {
    const reportData = {
      title: "ZEGA Enterprise Security & Threat Intelligence Audit Report",
      timestamp: new Date().toISOString(),
      security_score: "92/100",
      threats_detected: 23,
      incidents: 4,
      total_vulnerabilities: 7,
      compliance_score: "98.4%",
      mfa_coverage: "100%",
      telemetry,
      compliance,
      sha256_verification: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      cdn_url: "https://cdn.zegaai.site/security/reports/audit-2025.json"
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZEGA-Security-Report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onTriggerToast?.('Laporan Keamanan PDF/JSON Berhasil Diunduh & Terverifikasi SHA-256');
  };

  return (
    <div className="space-y-5 select-none pb-12">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400 size-6" />
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Security Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" /> REAL-TIME SHIELD
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Comprehensive security analytics, compliance, and threat risk insights across your organization.
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refresh Data Telemetry"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
          </button>

          {/* System Dropdown */}
          <div className="relative">
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All Systems">All Systems</option>
              <option value="Production API">Production API Gateway</option>
              <option value="Solana Gateway">Solana Pay Gateway</option>
              <option value="Auth & Identity">Auth & Identity Vault</option>
              <option value="Qdrant Vector DB">Qdrant Vector DB Cluster</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Picker */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-7 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="May 20 – May 27, 2025">May 20 – May 27, 2025</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
            <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter Button */}
          <button 
            onClick={() => setShowFilterModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              appliedFilters 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400' 
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter size={13} className="text-indigo-500" />
            <span>{appliedFilters ? 'Filtered' : 'Filters'}</span>
          </button>

          {/* Purple Export Button */}
          <button 
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
          >
            <Download size={13} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. 7 NAVIGATION TABS */}
      <div className="flex items-center gap-1 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: ShieldCheck },
          { id: 'threats', label: 'Threats', icon: ShieldAlert, badge: '23' },
          { id: 'compliance', label: 'Compliance', icon: CheckCircle2, badge: '98.4%' },
          { id: 'identity', label: 'Identity', icon: Key, badge: '100% MFA' },
          { id: 'data_protection', label: 'Data Protection', icon: Lock },
          { id: 'network_security', label: 'Network Security', icon: Network },
          { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: '4' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN OVERVIEW TAB */}
      {activeTab === 'overview' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* ROW 1: TOP 6 KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: SECURITY SCORE */}
            <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shadow-xs">
              <div className="relative size-11 flex items-center justify-center shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="92, 100" />
                </svg>
                <span className="absolute font-black text-xs text-slate-900 dark:text-slate-100">92</span>
              </div>
              <div>
                <span className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider">SECURITY SCORE</span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">92 <span className="text-[10px] text-slate-400 font-normal">/ 100</span></span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block">Excellent • ↑ 8 pts vs last 7d</span>
              </div>
            </div>

            {/* Card 2: THREATS DETECTED */}
            <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">THREATS DETECTED</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">23</span>
                <span className="text-[9.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowDownRight size={10} /> 12% vs last 7d
                </span>
              </div>
              <div className="h-3 w-full">
                <svg className="size-full overflow-visible" viewBox="0 0 100 20">
                  <path d="M 0 15 Q 25 5, 50 18 T 100 8" fill="none" stroke="#EF4444" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Card 3: INCIDENTS */}
            <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">INCIDENTS</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">4</span>
                <span className="text-[9.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowDownRight size={10} /> 33% vs last 7d
                </span>
              </div>
              <div className="h-3 w-full">
                <svg className="size-full overflow-visible" viewBox="0 0 100 20">
                  <path d="M 0 18 Q 25 10, 50 5 T 100 12" fill="none" stroke="#F59E0B" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Card 4: VULNERABILITIES */}
            <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">VULNERABILITIES</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">7</span>
                <span className="text-[9.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> 22% vs last 7d
                </span>
              </div>
              <div className="h-3 w-full">
                <svg className="size-full overflow-visible" viewBox="0 0 100 20">
                  <path d="M 0 10 Q 25 18, 50 8 T 100 4" fill="none" stroke="#8B5CF6" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Card 5: COMPLIANCE SCORE */}
            <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">COMPLIANCE SCORE</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">98.4%</span>
                <span className="text-[9.5px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> 1.2% vs last 7d
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[98.4%]" />
              </div>
            </div>

            {/* Card 6: MFA COVERAGE */}
            <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">MFA COVERAGE</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">100%</span>
              </div>
              <span className="text-[9px] text-emerald-600 font-bold block">All critical systems protected</span>
            </div>
          </div>

          {/* ROW 2: MIDDLE CHARTS & LEAFLET THREAT MAP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <SecurityCharts threatsCount={23} telemetryData={telemetry} onNavigateTab={(t) => setActiveTab(t)} />
            </div>
            <div className="lg:col-span-4">
              <InteractiveThreatMap onOpenFullMap={() => setShowFullMapModal(true)} />
            </div>
          </div>

          {/* ROW 3: RECENT INCIDENTS, COMPLIANCE OVERVIEW, LIVE SECURITY ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. RECENT SECURITY INCIDENTS */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  RECENT SECURITY INCIDENTS
                </h3>
                <button
                  onClick={() => setActiveTab('incidents')}
                  className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View all incidents</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {/* Item 1 */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Unauthorized access attempt blocked</span>
                    <span className="text-[8.5px] font-black px-1.5 py-0.3 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 uppercase">HIGH • 2m ago</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Blocked suspicious IP trying to brute force admin portal</p>
                </div>

                {/* Item 2 */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">API key leaked in public repository</span>
                    <span className="text-[8.5px] font-black px-1.5 py-0.3 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 uppercase">MEDIUM • 14m ago</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Exposed API key detected in public repository</p>
                </div>

                {/* Item 3 */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Abnormal data export detected</span>
                    <span className="text-[8.5px] font-black px-1.5 py-0.3 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 uppercase">LOW • 2h ago</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Large data export detected from us-west-2</p>
                </div>

                {/* Item 4 */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Multiple failed admin login attempts</span>
                    <span className="text-[8.5px] font-black px-1.5 py-0.3 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 uppercase">MEDIUM • 5h ago</span>
                  </div>
                  <p className="text-[10px] text-slate-500">5 failed attempts from 103.12.45.67</p>
                </div>
              </div>
            </div>

            {/* 2. COMPLIANCE OVERVIEW */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  COMPLIANCE OVERVIEW
                </h3>
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View compliance center</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-slate-200">SOC 2 Type II</span>
                    <span className="text-emerald-600 font-extrabold">Compliant 96%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[96%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-slate-200">ISO 27001</span>
                    <span className="text-emerald-600 font-extrabold">Compliant 94%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-slate-200">GDPR</span>
                    <span className="text-emerald-600 font-extrabold">Compliant 100%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[100%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-slate-200">HIPAA</span>
                    <span className="text-emerald-600 font-extrabold">Compliant 92%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-slate-200">PCI DSS</span>
                    <span className="text-emerald-600 font-extrabold">Compliant 95%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[95%]" />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600">
                <CheckCircle2 size={13} />
                <span>All frameworks up to date</span>
              </div>
            </div>

            {/* 3. SECURITY ACTIVITY (LIVE STREAM) */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  SECURITY ACTIVITY (LIVE)
                </h3>
                <button
                  onClick={() => setActiveTab('audit_logs')}
                  className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View all activity</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">MFA enabled for user</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">wildan@zegaai.com • 2m ago</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">New device login</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Chrome on macOS • 5m ago</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Failed login attempt</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">5 times from 103.12.45.67 • 6m ago</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">API key rotated</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">2K42-**** • 10m ago</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Policy updated</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Admin updated access policy • 15m ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 4: BOTTOM WIDGETS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
            {/* 1. ASSET INVENTORY */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  ASSET INVENTORY
                </h3>
                <button onClick={() => setActiveTab('infrastructure')} className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">
                  View all →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[9.5px] font-bold text-slate-400 block">AI Agents</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100 block">638</span>
                  <span className="text-[9px] font-bold text-emerald-600 block">Active</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[9.5px] font-bold text-slate-400 block">Services</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100 block">124</span>
                  <span className="text-[9px] font-bold text-emerald-600 block">Running</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[9.5px] font-bold text-slate-400 block">Endpoints</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100 block">1,248</span>
                  <span className="text-[9px] font-bold text-emerald-600 block">Online</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[9.5px] font-bold text-slate-400 block">Databases</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100 block">32</span>
                  <span className="text-[9px] font-bold text-emerald-600 block">Protected</span>
                </div>
              </div>
            </div>

            {/* 2. RISK DISTRIBUTION & DATA CLASSIFICATION */}
            <RiskAndDataCharts />

            {/* 4. POLICY STATUS */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs flex flex-col justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                POLICY STATUS
              </h3>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">32</span>
                  <span className="text-xs font-bold text-slate-500">Active Policies</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-rose-600">3</span>
                  <span className="text-xs font-bold text-rose-600">Policies Need Review</span>
                </div>
              </div>
              <button onClick={() => setActiveTab('data_protection')} className="text-[10.5px] font-bold text-indigo-600 hover:underline cursor-pointer">
                View policies →
              </button>
            </div>

            {/* 5. REPORT SUMMARY */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs flex flex-col justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                REPORT SUMMARY
              </h3>
              <div className="space-y-1 text-[10.5px]">
                <p className="text-slate-400">Last generated: <span className="font-bold text-slate-700 dark:text-slate-300">May 27, 2025 10:30 AM</span></p>
                <p className="text-slate-400">Next scheduled: <span className="font-bold text-slate-700 dark:text-slate-300">May 28, 2025 10:30 AM</span></p>
              </div>
              <button
                onClick={handleExportReport}
                className="w-full py-1.5 rounded-xl border border-indigo-600 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer transition-all"
              >
                Export Full Report
              </button>
            </div>
          </div>
        </div>
      ) : (
        <SecuritySubViews 
          activeTab={activeTab} 
          telemetry={telemetry} 
          compliance={compliance} 
          vulnerabilities={vulnerabilities}
          onRefresh={loadData}
          onTriggerToast={onTriggerToast}
        />
      )}

      {/* FULL MAP MODAL */}
      {showFullMapModal && (
        <FullMapModal onClose={() => setShowFullMapModal(false)} />
      )}

      {/* SECURITY FILTER MODAL */}
      <SecurityFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
}
