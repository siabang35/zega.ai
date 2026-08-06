import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Activity, ShieldAlert, PieChart } from 'lucide-react';

interface SecurityChartsProps {
  threatsCount?: number;
  telemetryData?: any[];
  onNavigateTab?: (tab: string) => void;
}

// Daily Trend Data Points
const DAILY_TRENDS = [
  { day: 'May 20', high: 12, medium: 22, low: 32 },
  { day: 'May 21', high: 18, medium: 25, low: 34 },
  { day: 'May 22', high: 15, medium: 28, low: 38 },
  { day: 'May 23', high: 22, medium: 20, low: 35 },
  { day: 'May 24', high: 14, medium: 24, low: 42 },
  { day: 'May 25', high: 16, medium: 27, low: 45 },
  { day: 'May 26', high: 23, medium: 32, low: 48 },
];

export function SecurityCharts({ threatsCount = 23, telemetryData = [], onNavigateTab }: SecurityChartsProps) {
  const [timeframe, setTimeframe] = useState<string>('Last 7 Days');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(6); // Default to last day
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Categories data calculated from telemetry or defaults
  const categories = [
    { key: 'unauth', label: 'Unauthorized Access', percent: 30.4, count: 7, color: '#EF4444' },
    { key: 'malware', label: 'Malware', percent: 21.7, count: 5, color: '#F59E0B' },
    { key: 'exfil', label: 'Exfiltration', percent: 17.4, count: 4, color: '#3B82F6' },
    { key: 'cred', label: 'Credentials', percent: 13.0, count: 3, color: '#8B5CF6' },
    { key: 'lateral', label: 'Lateral Movement', percent: 9.6, count: 2, color: '#10B981' },
    { key: 'others', label: 'Others', percent: 7.9, count: 2, color: '#64748B' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. THREAT ACTIVITY OVER TIME (Interactive Multi-line Curve + Live Tooltips) */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-indigo-600 dark:text-indigo-400" /> THREAT ACTIVITY OVER TIME
            </h3>
            <p className="text-[10.5px] text-slate-400 font-medium">Daily telemetry stream anomaly breakdown</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-rose-500"><span className="size-2 rounded-full bg-rose-500 animate-pulse" /> High</span>
              <span className="flex items-center gap-1 text-amber-500"><span className="size-2 rounded-full bg-amber-500" /> Medium</span>
              <span className="flex items-center gap-1 text-blue-500"><span className="size-2 rounded-full bg-blue-500" /> Low</span>
            </div>
            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="appearance-none pl-2.5 pr-6 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 14 Days">Last 14 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Interactive Multi-Line Curve SVG Chart with Active Tooltip */}
        <div className="relative h-48 w-full pt-2">
          <svg className="size-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="30" x2="500" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
            <line x1="0" y1="70" x2="500" y2="70" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
            <line x1="0" y1="110" x2="500" y2="110" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
            <line x1="0" y1="150" x2="500" y2="150" stroke="#E2E8F0" className="dark:stroke-slate-800" />

            {/* Low Severity Curve (Blue) */}
            <path d="M 0 70 C 60 55, 120 60, 180 50 C 240 40, 300 30, 380 25 C 440 20, 480 15, 500 12" fill="none" stroke="#3B82F6" strokeWidth="2.5" />
            
            {/* Medium Severity Curve (Orange) */}
            <path d="M 0 110 C 60 90, 120 105, 180 95 C 240 85, 300 70, 380 65 C 440 60, 480 35, 500 30" fill="none" stroke="#F59E0B" strokeWidth="2.5" />

            {/* High Severity Curve (Red) */}
            <path d="M 0 140 C 60 120, 120 70, 180 80 C 240 90, 300 100, 380 95 C 440 90, 480 50, 500 40" fill="none" stroke="#EF4444" strokeWidth="3" />

            {/* Interactive Data Target Points */}
            {DAILY_TRENDS.map((item, idx) => {
              const xPos = (idx / 6) * 500;
              const isHovered = hoveredPoint === idx;
              return (
                <g key={idx} onMouseEnter={() => setHoveredPoint(idx)} className="cursor-pointer">
                  <line x1={xPos} y1="0" x2={xPos} y2="160" stroke={isHovered ? '#6366F1' : 'transparent'} strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx={xPos} cy={140 - (item.high * 3.5)} r={isHovered ? "6" : "4"} fill="#EF4444" stroke="#FFF" strokeWidth="2" />
                  <circle cx={xPos} cy={140 - (item.medium * 2.5)} r={isHovered ? "6" : "4"} fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
                  <circle cx={xPos} cy={140 - (item.low * 1.8)} r={isHovered ? "6" : "4"} fill="#3B82F6" stroke="#FFF" strokeWidth="2" />
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Hover Tooltip */}
          {hoveredPoint !== null && (
            <div 
              className="absolute -top-3 z-20 px-3 py-1.5 rounded-xl bg-slate-900/95 backdrop-blur-xs text-white text-[10px] font-bold shadow-xl border border-indigo-500/50 space-y-0.5 transition-all"
              style={{ left: `calc(${(hoveredPoint / 6) * 85}% + 10px)` }}
            >
              <div className="text-slate-400 font-mono pb-0.5 border-b border-slate-800">{DAILY_TRENDS[hoveredPoint].day}</div>
              <div className="flex items-center justify-between gap-3 text-rose-400"><span>High:</span> <b>{DAILY_TRENDS[hoveredPoint].high} events</b></div>
              <div className="flex items-center justify-between gap-3 text-amber-400"><span>Medium:</span> <b>{DAILY_TRENDS[hoveredPoint].medium} events</b></div>
              <div className="flex items-center justify-between gap-3 text-blue-400"><span>Low:</span> <b>{DAILY_TRENDS[hoveredPoint].low} events</b></div>
            </div>
          )}

          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 font-bold">
            {DAILY_TRENDS.map((t, i) => (
              <span 
                key={i} 
                onMouseEnter={() => setHoveredPoint(i)}
                className={`cursor-pointer transition-colors ${hoveredPoint === i ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-110' : ''}`}
              >
                {t.day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TOP THREAT CATEGORIES (Interactive Donut Diagram + Segment Hovering) */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs flex flex-col justify-between">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <PieChart size={14} className="text-purple-600 dark:text-purple-400" /> TOP THREAT CATEGORIES
        </h3>

        <div className="flex items-center justify-between gap-4">
          {/* Ring Donut SVG with Interactive Center Text */}
          <div className="relative size-36 shrink-0 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <circle 
                onMouseEnter={() => setHoveredSlice('Unauthorized Access (30.4%)')}
                onMouseLeave={() => setHoveredSlice(null)}
                cx="18" cy="18" r="15.9155" fill="none" stroke="#EF4444" 
                strokeWidth={hoveredSlice?.includes('Unauthorized') ? "6" : "4.5"} 
                strokeDasharray="30.4 69.6" strokeDashoffset="0" className="transition-all cursor-pointer hover:opacity-80" 
              />
              <circle 
                onMouseEnter={() => setHoveredSlice('Malware (21.7%)')}
                onMouseLeave={() => setHoveredSlice(null)}
                cx="18" cy="18" r="15.9155" fill="none" stroke="#F59E0B" 
                strokeWidth={hoveredSlice?.includes('Malware') ? "6" : "4.5"} 
                strokeDasharray="21.7 78.3" strokeDashoffset="-30.4" className="transition-all cursor-pointer hover:opacity-80" 
              />
              <circle 
                onMouseEnter={() => setHoveredSlice('Exfiltration (17.4%)')}
                onMouseLeave={() => setHoveredSlice(null)}
                cx="18" cy="18" r="15.9155" fill="none" stroke="#3B82F6" 
                strokeWidth={hoveredSlice?.includes('Exfiltration') ? "6" : "4.5"} 
                strokeDasharray="17.4 82.6" strokeDashoffset="-52.1" className="transition-all cursor-pointer hover:opacity-80" 
              />
              <circle 
                onMouseEnter={() => setHoveredSlice('Credentials (13.0%)')}
                onMouseLeave={() => setHoveredSlice(null)}
                cx="18" cy="18" r="15.9155" fill="none" stroke="#8B5CF6" 
                strokeWidth={hoveredSlice?.includes('Credentials') ? "6" : "4.5"} 
                strokeDasharray="13.0 87.0" strokeDashoffset="-69.5" className="transition-all cursor-pointer hover:opacity-80" 
              />
              <circle 
                onMouseEnter={() => setHoveredSlice('Lateral Movement (9.6%)')}
                onMouseLeave={() => setHoveredSlice(null)}
                cx="18" cy="18" r="15.9155" fill="none" stroke="#10B981" 
                strokeWidth={hoveredSlice?.includes('Lateral') ? "6" : "4.5"} 
                strokeDasharray="9.6 90.4" strokeDashoffset="-82.5" className="transition-all cursor-pointer hover:opacity-80" 
              />
              <circle 
                onMouseEnter={() => setHoveredSlice('Others (7.9%)')}
                onMouseLeave={() => setHoveredSlice(null)}
                cx="18" cy="18" r="15.9155" fill="none" stroke="#64748B" 
                strokeWidth={hoveredSlice?.includes('Others') ? "6" : "4.5"} 
                strokeDasharray="7.9 92.1" strokeDashoffset="-92.1" className="transition-all cursor-pointer hover:opacity-80" 
              />
            </svg>
            <div className="absolute text-center px-1">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">{threatsCount}</span>
              <span className="text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase truncate max-w-[80px]">
                {hoveredSlice || 'TOTAL THREATS'}
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-1.5 text-[10.5px] font-bold flex-1">
            {categories.map((cat) => (
              <div 
                key={cat.key}
                onMouseEnter={() => setHoveredSlice(`${cat.label} (${cat.percent}%)`)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`flex items-center justify-between p-1 rounded-lg transition-all cursor-pointer ${
                  hoveredSlice?.includes(cat.label) ? 'bg-slate-100 dark:bg-slate-800 scale-102' : ''
                }`}
              >
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="size-2 rounded-full" style={{ backgroundColor: cat.color }} /> {cat.label}
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-extrabold">{cat.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* View Link */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onNavigateTab?.('threats')}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View threat intelligence</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

{/* Risk & Data Classification Donut Widgets with Hover Interactions */}
export function RiskAndDataCharts() {
  const [hoverRisk, setHoverRisk] = useState<string | null>(null);
  const [hoverData, setHoverData] = useState<string | null>(null);

  return (
    <>
      {/* RISK DISTRIBUTION */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          RISK DISTRIBUTION
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative size-24 shrink-0 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <circle onMouseEnter={() => setHoverRisk('High: 12.5%')} onMouseLeave={() => setHoverRisk(null)} cx="18" cy="18" r="15.9155" fill="none" stroke="#EF4444" strokeWidth={hoverRisk?.includes('High') ? "6" : "4.5"} strokeDasharray="12.5 87.5" strokeDashoffset="0" className="transition-all cursor-pointer" />
              <circle onMouseEnter={() => setHoverRisk('Med: 30%')} onMouseLeave={() => setHoverRisk(null)} cx="18" cy="18" r="15.9155" fill="none" stroke="#F59E0B" strokeWidth={hoverRisk?.includes('Med') ? "6" : "4.5"} strokeDasharray="30 70" strokeDashoffset="-12.5" className="transition-all cursor-pointer" />
              <circle onMouseEnter={() => setHoverRisk('Low: 57.5%')} onMouseLeave={() => setHoverRisk(null)} cx="18" cy="18" r="15.9155" fill="none" stroke="#3B82F6" strokeWidth={hoverRisk?.includes('Low') ? "6" : "4.5"} strokeDasharray="57.5 42.5" strokeDashoffset="-42.5" className="transition-all cursor-pointer" />
            </svg>
            <div className="absolute text-center px-0.5">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">40</span>
              <span className="text-[7.5px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase truncate">{hoverRisk || 'Total'}</span>
            </div>
          </div>
          <div className="space-y-1 text-[10px] font-bold flex-1">
            <div onMouseEnter={() => setHoverRisk('High: 12.5%')} onMouseLeave={() => setHoverRisk(null)} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-0.5 rounded">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-rose-500" /> High</span>
              <span className="text-slate-900 dark:text-slate-100 font-extrabold">12.5% (5)</span>
            </div>
            <div onMouseEnter={() => setHoverRisk('Med: 30%')} onMouseLeave={() => setHoverRisk(null)} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-0.5 rounded">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-amber-500" /> Medium</span>
              <span className="text-slate-900 dark:text-slate-100 font-extrabold">30% (12)</span>
            </div>
            <div onMouseEnter={() => setHoverRisk('Low: 57.5%')} onMouseLeave={() => setHoverRisk(null)} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-0.5 rounded">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-blue-500" /> Low</span>
              <span className="text-slate-900 dark:text-slate-100 font-extrabold">57.5% (23)</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA CLASSIFICATION */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          DATA CLASSIFICATION
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative size-24 shrink-0 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <circle onMouseEnter={() => setHoverData('Public: 42%')} onMouseLeave={() => setHoverData(null)} cx="18" cy="18" r="15.9155" fill="none" stroke="#10B981" strokeWidth={hoverData?.includes('Public') ? "6" : "4.5"} strokeDasharray="42 58" strokeDashoffset="0" className="transition-all cursor-pointer" />
              <circle onMouseEnter={() => setHoverData('Internal: 33%')} onMouseLeave={() => setHoverData(null)} cx="18" cy="18" r="15.9155" fill="none" stroke="#3B82F6" strokeWidth={hoverData?.includes('Internal') ? "6" : "4.5"} strokeDasharray="33 67" strokeDashoffset="-42" className="transition-all cursor-pointer" />
              <circle onMouseEnter={() => setHoverData('Conf: 17%')} onMouseLeave={() => setHoverData(null)} cx="18" cy="18" r="15.9155" fill="none" stroke="#8B5CF6" strokeWidth={hoverData?.includes('Conf') ? "6" : "4.5"} strokeDasharray="17 83" strokeDashoffset="-75" className="transition-all cursor-pointer" />
              <circle onMouseEnter={() => setHoverData('Restricted: 8%')} onMouseLeave={() => setHoverData(null)} cx="18" cy="18" r="15.9155" fill="none" stroke="#64748B" strokeWidth={hoverData?.includes('Restricted') ? "6" : "4.5"} strokeDasharray="8 92" strokeDashoffset="-92" className="transition-all cursor-pointer" />
            </svg>
            <div className="absolute text-center px-0.5">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">1.2 TB</span>
              <span className="text-[7.5px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase truncate">{hoverData || 'Total Data'}</span>
            </div>
          </div>
          <div className="space-y-1 text-[10px] font-bold flex-1">
            <div onMouseEnter={() => setHoverData('Public: 42%')} onMouseLeave={() => setHoverData(null)} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-0.5 rounded">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-emerald-500" /> Public</span>
              <span className="text-slate-900 dark:text-slate-100 font-extrabold">42%</span>
            </div>
            <div onMouseEnter={() => setHoverData('Internal: 33%')} onMouseLeave={() => setHoverData(null)} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-0.5 rounded">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-blue-500" /> Internal</span>
              <span className="text-slate-900 dark:text-slate-100 font-extrabold">33%</span>
            </div>
            <div onMouseEnter={() => setHoverData('Conf: 17%')} onMouseLeave={() => setHoverData(null)} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-0.5 rounded">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-purple-500" /> Confidential</span>
              <span className="text-slate-900 dark:text-slate-100 font-extrabold">17%</span>
            </div>
            <div onMouseEnter={() => setHoverData('Restricted: 8%')} onMouseLeave={() => setHoverData(null)} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-0.5 rounded">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><span className="size-2 rounded-full bg-slate-500" /> Restricted</span>
              <span className="text-slate-900 dark:text-slate-100 font-extrabold">8%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
