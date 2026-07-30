import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  ExternalLink,
  Code,
  Terminal,
  Check,
  Zap
} from 'lucide-react';

interface ApiSdkViewProps {
  onTriggerToast?: (msg: string) => void;
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  environment: 'Production' | 'Development';
  permissions: string;
  lastUsed: string;
  status: 'Active' | 'Inactive';
}

export function ApiSdkView({ onTriggerToast }: ApiSdkViewProps) {
  const [activeTab, setActiveTab] = useState<'keys' | 'sdks' | 'examples'>('keys');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key_1',
      name: 'Production Key',
      keyPrefix: 'zga_live_••••••••••••',
      environment: 'Production',
      permissions: 'Full Access',
      lastUsed: '2 min ago',
      status: 'Active',
    },
    {
      id: 'key_2',
      name: 'Dev Key',
      keyPrefix: 'zga_dev_••••••••••••',
      environment: 'Development',
      permissions: 'Read / Write',
      lastUsed: '1 hour ago',
      status: 'Active',
    },
    {
      id: 'key_3',
      name: 'CI/CD Key',
      keyPrefix: 'zga_ci_••••••••••••',
      environment: 'Production',
      permissions: 'Read Only',
      lastUsed: '3 hours ago',
      status: 'Active',
    },
    {
      id: 'key_4',
      name: 'Billing Key',
      keyPrefix: 'zga_billing_••••••••••••',
      environment: 'Production',
      permissions: 'Billing',
      lastUsed: '1 day ago',
      status: 'Inactive',
    },
  ]);

  const toggleShowKey = (id: string) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateApiKey = () => {
    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: 'New Custom Key',
      keyPrefix: `zga_live_${Math.random().toString(36).substring(2, 10)}••••`,
      environment: 'Production',
      permissions: 'Full Access',
      lastUsed: 'Just now',
      status: 'Active',
    };
    setApiKeys((prev) => [newKey, ...prev]);
    if (onTriggerToast) onTriggerToast('API Key Baru Berhasil Dibuat!');
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (onTriggerToast) onTriggerToast(`${label} disalin ke clipboard!`);
  };

  const sampleCurlCode = `curl --request POST \\
  --url https://api.zegaai.site/v1/agents/run \\
  --header 'Authorization: Bearer zga_live_xxxxxxxxxxxx' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "agent_id": "support-agent",
    "input": "Summarize last 10 support tickets",
    "stream": false
  }'`;

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            API & SDK
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your API keys and integrate ZEGA AI with our SDKs.
          </p>
        </div>

        <button
          onClick={handleCreateApiKey}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>Create API Key</span>
        </button>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        {[
          { id: 'keys', label: 'API Keys' },
          { id: 'sdks', label: 'SDKs & Libraries' },
          { id: 'examples', label: 'Code Examples' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: YOUR API KEYS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Your API Keys</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Use API keys to authenticate your requests to ZEGA AI API.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-2.5 px-3">NAME</th>
                <th className="py-2.5 px-3">KEY</th>
                <th className="py-2.5 px-3">ENVIRONMENT</th>
                <th className="py-2.5 px-3">PERMISSIONS</th>
                <th className="py-2.5 px-3">LAST USED</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{k.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span>{showKey[k.id] ? k.keyPrefix.replace(/•/g, 'x') : k.keyPrefix}</span>
                      <button onClick={() => toggleShowKey(k.id)} className="text-slate-400 hover:text-slate-600">
                        {showKey[k.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        k.environment === 'Production'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60'
                      }`}
                    >
                      {k.environment}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{k.permissions}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{k.lastUsed}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        k.status === 'Active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => copyText(k.keyPrefix, k.name)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
                      title="Copy Key"
                    >
                      <Copy size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SDKs & LIBRARIES + CODE EXAMPLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: SDKs & Libraries */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">SDKs & Libraries</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Official SDKs to build faster with ZEGA AI.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* JS / TS */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">JavaScript / TypeScript</span>
                <span className="text-[10px] font-mono text-slate-400">v2.3.0</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10.5px]">
                <span className="text-slate-700 dark:text-slate-300">npm install @zegaai/sdk</span>
                <button onClick={() => copyText('npm install @zegaai/sdk', 'Command')} className="text-slate-400 hover:text-slate-600">
                  <Copy size={12} />
                </button>
              </div>
              <button className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Documentation →
              </button>
            </div>

            {/* Python */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">Python</span>
                <span className="text-[10px] font-mono text-slate-400">v2.3.0</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10.5px]">
                <span className="text-slate-700 dark:text-slate-300">pip install zegaai</span>
                <button onClick={() => copyText('pip install zegaai', 'Command')} className="text-slate-400 hover:text-slate-600">
                  <Copy size={12} />
                </button>
              </div>
              <button className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Documentation →
              </button>
            </div>

            {/* Go */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">Go</span>
                <span className="text-[10px] font-mono text-slate-400">v1.2.0</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10.5px]">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">go get github.com/zegaai/go-sdk</span>
                <button onClick={() => copyText('go get github.com/zegaai/go-sdk', 'Command')} className="text-slate-400 hover:text-slate-600">
                  <Copy size={12} />
                </button>
              </div>
              <button className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Documentation →
              </button>
            </div>

            {/* cURL */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">cURL</span>
                <span className="text-[10px] font-mono text-slate-400">Latest</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10.5px]">
                <span className="text-slate-700 dark:text-slate-300">curl https://api.zegaai.site/...</span>
                <button onClick={() => copyText('curl https://api.zegaai.site/...', 'Command')} className="text-slate-400 hover:text-slate-600">
                  <Copy size={12} />
                </button>
              </div>
              <button className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Documentation →
              </button>
            </div>
          </div>
        </div>

        {/* Right: Code Example & Playground */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Code Example (cURL)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Make your first API request.</p>
            </div>
            <button
              onClick={() => copyText(sampleCurlCode, 'cURL snippet')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              <Copy size={12} />
              <span>Copy</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 space-y-1 leading-relaxed">
            <pre>{sampleCurlCode}</pre>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Response</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                200 OK
              </span>
            </div>
            <button className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              View Example Response →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
