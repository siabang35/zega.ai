import React, { useState } from 'react';
import {
  Code,
  Copy,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  BookOpen,
  Layers,
  Send,
  Users,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Key,
  Terminal,
  Zap,
  Globe
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Development'>('Production');
  const baseUrl = 'https://api.zegaai.site';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (onTriggerToast) onTriggerToast(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Developer Portal
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Build, integrate and extend ZEGA AI into your applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {/* Environment selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-[10px] text-slate-400 font-mono">Environment</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="size-2 rounded-full bg-emerald-500" />
              {environment}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          {/* API Base URL */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-slate-700 dark:text-slate-300">
            <span className="text-[10px] text-slate-400">API Base URL</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{baseUrl}</span>
            <button
              onClick={() => copyToClipboard(baseUrl, 'API Base URL')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Copy Base URL"
            >
              <Copy size={13} />
            </button>
          </div>

          {/* Docs Button */}
          <button
            onClick={() => onTriggerToast?.('Opening ZEGA AI API Documentation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 cursor-pointer transition-colors"
          >
            <BookOpen size={13} />
            <span>Docs</span>
          </button>
        </div>
      </div>

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: API Requests */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">API Requests (24h)</span>
            <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={13} /> 18.5%
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">2.45M</span>
            <div className="w-20 h-6">
              <Line
                data={{
                  labels: ['1', '2', '3', '4', '5', '6'],
                  datasets: [{ data: [1.8, 2.0, 2.1, 2.3, 2.4, 2.45], borderColor: '#8b5cf6', borderWidth: 1.5, tension: 0.4 }],
                }}
                options={sparklineOptions}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Success Rate */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Success Rate (24h)</span>
            <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={13} /> 0.8%
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">99.42%</span>
            <div className="w-20 h-6">
              <Line
                data={{
                  labels: ['1', '2', '3', '4', '5', '6'],
                  datasets: [{ data: [98.5, 98.8, 99.1, 99.2, 99.3, 99.42], borderColor: '#10b981', borderWidth: 1.5, tension: 0.4 }],
                }}
                options={sparklineOptions}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Avg Latency */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg. Latency (24h)</span>
            <span className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
              <ArrowDownRight size={13} /> 12ms
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">142ms</span>
            <div className="w-20 h-6">
              <Line
                data={{
                  labels: ['1', '2', '3', '4', '5', '6'],
                  datasets: [{ data: [170, 162, 155, 148, 145, 142], borderColor: '#3b82f6', borderWidth: 1.5, tension: 0.4 }],
                }}
                options={sparklineOptions}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Active API Keys */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active API Keys</span>
            <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <ArrowUpRight size={13} /> 2
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">12</span>
            <div className="w-20 h-6">
              <Line
                data={{
                  labels: ['1', '2', '3', '4', '5', '6'],
                  datasets: [{ data: [8, 9, 10, 10, 11, 12], borderColor: '#f59e0b', borderWidth: 1.5, tension: 0.4 }],
                }}
                options={sparklineOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: GETTING STARTED & DEVELOPER RESOURCES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Getting Started */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Getting Started</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Follow the steps below to start using ZEGA AI API.</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-100">Create API Key</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Generate your API key from API & SDK section.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-100">Make Your First Request</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Send your first API request using the provided SDK or cURL.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-100">Explore Documentation</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Learn more about available endpoints and parameters.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onTriggerToast?.('Navigating to Quickstart Guide')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Quickstart Guide</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Right: Developer Resources */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Developer Resources</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { title: 'API Documentation', desc: 'Explore all API endpoints and schemas.', icon: BookOpen },
              { title: 'SDKs & Libraries', desc: 'Official SDKs for popular languages.', icon: Layers },
              { title: 'Postman Collection', desc: 'Import and test APIs in Postman.', icon: Send },
              { title: 'Community', desc: 'Join our developer community.', icon: Users },
            ].map((res) => {
              const IconComp = res.icon;
              return (
                <div
                  key={res.title}
                  onClick={() => onTriggerToast?.(`Opening ${res.title}`)}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <IconComp size={15} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{res.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{res.desc}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 font-bold">→</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: SYSTEM STATUS & RECENT ANNOUNCEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: System Status */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">System Status</h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">All systems operational</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              'API Gateway',
              'Agent Runtime',
              'Vector Database',
              'Workflow Engine',
              'Payments Service',
            ].map((svc) => (
              <div key={svc} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{svc}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  Operational <span>›</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Announcements */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Announcements</h3>
            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all</button>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { title: 'Introducing ZeroClaw Terminal', date: 'May 24, 2025', badge: 'Terminal' },
              { title: 'New API: Workflow Execution', date: 'May 20, 2025', badge: 'API' },
              { title: 'SDK v2.3.0 Released', date: 'May 15, 2025', badge: 'SDK' },
            ].map((anc) => (
              <div key={anc.title} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                    {anc.badge}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{anc.title}</p>
                    <p className="text-[10.5px] text-slate-400">{anc.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
