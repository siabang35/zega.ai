import React, { useState } from 'react';
import { Key, Plus, Copy, Trash2, ShieldCheck, Zap, Server, MoreHorizontal, FileText, ArrowRight, X, ExternalLink, Check, RefreshCw } from 'lucide-react';
import { enterpriseSupabaseService } from '../../../services/enterpriseSupabaseService';

interface ApiAccessTabProps {
  apiKeys: any[];
  setShowApiKeyModal: (b: boolean) => void;
  onTriggerToast?: (msg: string) => void;
}

export function ApiAccessTab({ apiKeys, setShowApiKeyModal, onTriggerToast }: ApiAccessTabProps) {
  const [activeMenuKeyId, setActiveMenuKeyId] = useState<string | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Default seed keys if DB initial state is loading
  const defaultKeys = [
    { id: '1', name: 'Production Key', key_masked: 'zga_live_••••••••••••', environment: 'Production', permissions: 'Full Access', last_used: '2 min ago', status: 'Active' },
    { id: '2', name: 'Development Key', key_masked: 'zga_dev_••••••••••••', environment: 'Development', permissions: 'Read / Write', last_used: '1 hour ago', status: 'Active' },
    { id: '3', name: 'CI/CD Key', key_masked: 'zga_cli_••••••••••••', environment: 'Production', permissions: 'Read Only', last_used: '3 hours ago', status: 'Active' },
    { id: '4', name: 'Billing Key', key_masked: 'zga_billing_••••••••••••', environment: 'Production', permissions: 'Billing', last_used: '1 day ago', status: 'Inactive' },
    { id: '5', name: 'Analytics Key', key_masked: 'zga_analytics_••••••••••••', environment: 'Development', permissions: 'Analytics', last_used: '2 days ago', status: 'Active' },
  ];

  const keysToDisplay = apiKeys.length > 0 ? apiKeys : defaultKeys;

  const handleRevokeKey = async (id: string, name: string) => {
    setActiveMenuKeyId(null);
    const res = await enterpriseSupabaseService.revokeApiKeyRealtime(id);
    if (onTriggerToast) {
      onTriggerToast(`API Key ${name} Berhasil Dicabut/Revoke dari Supabase DB!`);
    }
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    if (onTriggerToast) onTriggerToast('Disalin ke Clipboard!');
  };

  return (
    <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
      {/* 1. TOP 5 KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Active API Keys</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">{keysToDisplay.filter(k => k.status === 'Active').length || 12}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Requests (24h)</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">2.45M</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Success Rate (24h)</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">99.42%</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Rate Limit (RPM)</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">10,000</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 block">Quota Usage</span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 block">45%</span>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-600 w-[45%]" />
          </div>
        </div>
      </div>

      {/* 2. API KEYS TABLE CARD */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">API Keys</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2.5">Name</th>
                <th className="pb-2.5">Key</th>
                <th className="pb-2.5">Environment</th>
                <th className="pb-2.5">Permissions</th>
                <th className="pb-2.5">Last Used</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {keysToDisplay.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{k.name}</td>

                  <td className="py-3 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 dark:text-slate-400">
                        {k.key_masked || (k.key_prefix ? `${k.key_prefix}••••••••••••` : 'zga_live_••••••••••••')}
                      </span>
                      <button
                        onClick={() => copyToClipboard(k.key_masked || 'zga_live_secret_key_123')}
                        className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Copy Key"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </td>

                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        k.environment === 'Production'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {k.environment || 'Production'}
                    </span>
                  </td>

                  <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">{k.permissions || 'Full Access'}</td>

                  <td className="py-3 text-slate-500 font-medium">{k.last_used || '2 min ago'}</td>

                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        k.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {k.status || 'Active'}
                    </span>
                  </td>

                  <td className="py-3 text-right relative">
                    <button
                      onClick={() => setActiveMenuKeyId(activeMenuKeyId === k.id ? null : k.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {/* ACTION DROPDOWN MENU */}
                    {activeMenuKeyId === k.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1 text-[11px] text-left">
                        <button
                          onClick={() => { copyToClipboard(k.key_masked || 'zga_live_123'); setActiveMenuKeyId(null); }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <Copy size={13} /> Copy Key
                        </button>
                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="w-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={13} /> Revoke Key
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: RATE LIMITS & QUOTAS + API DOCUMENTATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: RATE LIMITS & QUOTAS */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rate Limits & Quotas</h3>

            {/* RPM */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-500">Requests Per Minute (RPM)</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">45%</span>
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">4,500 / 10,000</span>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-600 w-[45%]" />
              </div>
            </div>

            {/* RPD */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-500">Requests Per Day</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">53%</span>
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">106,450 / 200,000</span>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-600 w-[53%]" />
              </div>
            </div>

            {/* RPM (Monthly) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-500">Requests Per Month</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">49%</span>
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">2.45M / 5M</span>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-600 w-[49%]" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowUsageModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View detailed usage</span> <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: API DOCUMENTATION */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">API Documentation</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Explore our API documentation and SDKs to get started.
            </p>

            <button
              onClick={() => setShowDocsModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
            >
              <FileText size={15} className="text-indigo-600" />
              <span>API Docs</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowDocsModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Documentation</span> <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: DETAILED USAGE MODAL */}
      {showUsageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Detailed API Usage Analytics</h3>
              <button onClick={() => setShowUsageModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Rest API Endpoint Breakdown</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>POST /v1/chat/completions: <strong>1.85M reqs</strong></div>
                  <div>POST /v1/embeddings: <strong>420K reqs</strong></div>
                  <div>GET /v1/agents/status: <strong>180K reqs</strong></div>
                  <div>POST /v1/workflows/trigger: <strong>50K reqs</strong></div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Latency SLA</span>
                <span className="text-[11px] text-slate-500 block">Average Response Time: <strong>38ms</strong> (Global CDN Edge)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowUsageModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: API DOCUMENTATION MODAL */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">ZEGA AI SDK & API Documentation</h3>
              <button onClick={() => setShowDocsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-indigo-600 block">cURL Quickstart</span>
                <pre className="p-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto">
{`curl -X POST https://api.zega.ai/v1/chat/completions \\
  -H "Authorization: Bearer zga_live_••••••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "zega-swarm-v2.4", "messages": [{"role": "user", "content": "Hello"}]}'`}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-indigo-600 block">Python SDK</span>
                <pre className="p-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto">
{`pip install zega-ai
import zega
client = zega.Client(api_key="zga_live_••••••••••••")`}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowDocsModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
