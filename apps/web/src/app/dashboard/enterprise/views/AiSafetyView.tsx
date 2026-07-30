import React, { useState } from 'react';
import { 
  ShieldCheck, Calendar, Download, AlertTriangle, ShieldAlert, 
  CheckCircle2, Lock, Key, ChevronDown, Activity, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';

interface AiSafetyViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function AiSafetyView({ onTriggerToast }: AiSafetyViewProps) {
  const [systemFilter, setSystemFilter] = useState<string>('All Systems');
  const [dateRange, setDateRange] = useState<string>('May 20 – May 27, 2025');

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400 size-6" />
            Security Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor security posture, threats, and compliance across your organization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* System Dropdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{systemFilter}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar size={14} className="text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Export Report Action */}
          <button 
            onClick={() => onTriggerToast?.('Laporan Keamanan Diunduh')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* TOP 6 KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Security Score Gauge */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="relative size-12 flex items-center justify-center shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="92, 100" />
            </svg>
            <span className="absolute font-black text-xs text-slate-900 dark:text-slate-100">92</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">Security Score</span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">92 <span className="text-[10px] text-slate-400 font-normal">/ 100</span></span>
            <span className="text-[9px] font-bold text-emerald-600 block">Excellent</span>
          </div>
        </div>

        {/* Card 2: Threats Detected */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Threats Detected</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">7</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +2
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 7 days</span>
        </div>

        {/* Card 3: Vulnerabilities */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Vulnerabilities</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">3</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowDownRight size={10} /> -1
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 7 days</span>
        </div>

        {/* Card 4: Incidents */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Incidents</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">1</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              +0 vs last 7d
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">Investigating</span>
        </div>

        {/* Card 5: Compliance */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Compliance</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">98.4%</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +1.2%
            </span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">4 Frameworks</span>
        </div>

        {/* Card 6: MFA Coverage */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">MFA Coverage</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">100%</span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">Enforced globally</span>
        </div>
      </div>

      {/* MIDDLE SECTION (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Col 1 (1/4 width): Security Posture */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Security Posture
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Identity & Access</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600">Strong</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Data Protection</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600">Strong</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Network Security</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600">Strong</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="text-amber-500" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Application Security</span>
              </div>
              <span className="text-[9px] font-bold text-amber-600">Warning (2)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Infrastructure Security</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600">Strong</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">Monitoring & Logging</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600">Strong</span>
            </div>
          </div>
        </div>

        {/* Col 2 (2/4 width): Threat Activity (7 Days) SVG Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Threat Activity (7 Days)
            </h3>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-rose-500"><span className="size-2 rounded-full bg-rose-500" /> High</span>
              <span className="flex items-center gap-1 text-amber-500"><span className="size-2 rounded-full bg-amber-500" /> Medium</span>
              <span className="flex items-center gap-1 text-blue-500"><span className="size-2 rounded-full bg-blue-500" /> Low</span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative h-48 w-full pt-2">
            <svg className="size-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
              <line x1="0" y1="30" x2="500" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#E2E8F0" className="dark:stroke-slate-800" />

              {/* Lines */}
              <path d="M 0 140 Q 100 130, 200 90 T 400 110 T 500 60" fill="none" stroke="#F43F5E" strokeWidth="2.5" />
              <path d="M 0 110 Q 100 80, 200 110 T 400 70 T 500 40" fill="none" stroke="#F59E0B" strokeWidth="2" />
              <path d="M 0 80 Q 100 50, 200 70 T 400 40 T 500 20" fill="none" stroke="#3B82F6" strokeWidth="2" />
            </svg>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>May 20</span>
              <span>May 21</span>
              <span>May 22</span>
              <span>May 23</span>
              <span>May 24</span>
              <span>May 25</span>
              <span>May 26</span>
            </div>
          </div>
        </div>

        {/* Col 3 (1/4 width): Recent Incidents */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Recent Incidents
            </h3>
            <button className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2 rounded-xl bg-rose-50/40 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-700 dark:text-rose-400">Unauthorized access attempt</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">High</span>
              </div>
              <p className="text-[9.5px] text-slate-500">Blocked login attempt from 103.12.45.67</p>
              <span className="text-[8.5px] text-slate-400 font-mono block">2h ago</span>
            </div>

            <div className="p-2 rounded-xl bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-400">API Key leaked</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Medium</span>
              </div>
              <p className="text-[9.5px] text-slate-500">API key exposed in public repo</p>
              <span className="text-[8.5px] text-slate-400 font-mono block">1d ago</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">Abnormal data export</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Low</span>
              </div>
              <p className="text-[9.5px] text-slate-500">Large data export detected</p>
              <span className="text-[8.5px] text-slate-400 font-mono block">2d ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Col 1: Compliance Overview */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Compliance Overview
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">SOC 2 Type II</span>
                <span className="text-[10px] font-bold text-emerald-600">Compliant (96%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[96%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">ISO 27001</span>
                <span className="text-[10px] font-bold text-emerald-600">Compliant (94%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">GDPR</span>
                <span className="text-[10px] font-bold text-emerald-600">Compliant (100%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[100%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">HIPAA</span>
                <span className="text-[10px] font-bold text-emerald-600">Compliant (92%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              → View compliance center
            </button>
          </div>
        </div>

        {/* Col 2: Top Vulnerabilities */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Top Vulnerabilities
            </h3>
            <button className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-700 dark:text-rose-400">Outdated dependency (Boleto)</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">High</span>
              </div>
              <p className="text-[10px] text-slate-500">Detected in 3 services</p>
            </div>

            <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-400">S3 bucket public access</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Medium</span>
              </div>
              <p className="text-[10px] text-slate-500">1 bucket affected</p>
            </div>

            <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700 dark:text-blue-400">Weak API key permissions</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Low</span>
              </div>
              <p className="text-[10px] text-slate-500">2 keys affected</p>
            </div>
          </div>
        </div>

        {/* Col 3: Security Activity (Live) Feed */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Security Activity (Live)
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">MFA enabled for user</p>
                <p className="text-[9.5px] text-slate-400">wildan@zenith.co.id</p>
              </div>
              <span className="text-[9px] font-mono text-slate-400">2m ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">New device login</p>
                <p className="text-[9.5px] text-slate-400">Chrome on macOS</p>
              </div>
              <span className="text-[9px] font-mono text-slate-400">5m ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Failed login attempt</p>
                <p className="text-[9.5px] text-slate-400">5 times from 103.12.45.67</p>
              </div>
              <span className="text-[9px] font-mono text-slate-400">8m ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">API key rotated</p>
                <p className="text-[9.5px] text-slate-400">ZK42-****</p>
              </div>
              <span className="text-[9px] font-mono text-slate-400">10m ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
