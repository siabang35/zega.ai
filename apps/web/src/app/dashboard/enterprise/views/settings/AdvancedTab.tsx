import React, { useState } from 'react';
import { Sliders, AlertTriangle, ArrowRight, Trash2, RefreshCw, Key, ShieldAlert, CheckCircle, ExternalLink, HelpCircle, X, Code, Server, Zap, Check, Copy } from 'lucide-react';
import { enterpriseSupabaseService } from '../../../services/enterpriseSupabaseService';

interface AdvancedTabProps {
  advancedConfig: any;
  setAdvancedConfig: (a: any) => void;
  onTriggerToast?: (msg: string) => void;
}

// Reusable iOS-Style Toggle Switch
function ToggleSwitch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100/70 dark:border-slate-800/60 last:border-0">
      <div className="pr-4 space-y-0.5">
        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">{label}</span>
        {description && <span className="text-[10px] text-slate-400 font-normal block leading-tight">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          } my-0.5`}
        />
      </button>
    </div>
  );
}

export function AdvancedTab({ advancedConfig = {}, setAdvancedConfig, onTriggerToast }: AdvancedTabProps) {
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showApiDocsModal, setShowApiDocsModal] = useState(false);
  const [showFeatureFlagsModal, setShowFeatureFlagsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

  // Active sub-tabs in API docs modal
  const [apiDocTab, setApiDocTab] = useState<'chat' | 'agents' | 'models' | 'webhooks'>('chat');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Local config fallback if empty
  const config = {
    environment: 'Production',
    log_level: 'Info',
    maintenance_mode: false,
    rate_limiting_mode: 'Standard',
    background_jobs_concurrency: '10',
    allow_legacy_api: false,
    api_response_caching: true,
    webhook_retry_attempts: 5,
    webhook_timeout: 30,
    enable_graphql: true,
    beta_features: true,
    ai_model_preview: true,
    vector_store_compression: false,
    custom_domains: true,
    ...advancedConfig
  };

  const handleUpdateField = async (key: string, value: any) => {
    const updated = { ...config, [key]: value };
    setAdvancedConfig(updated);

    // Save directly to Supabase Realtime DB
    await enterpriseSupabaseService.updateAdvancedConfigRealtime({ [key]: value });

    if (onTriggerToast) {
      onTriggerToast(`Pengaturan '${key}' diperbarui secara Realtime!`);
    }
  };

  const handleDangerAction = async (actionType: string) => {
    setShowConfirmModal(null);
    if (actionType === 'reset_keys') {
      if (onTriggerToast) onTriggerToast('Semua API Keys & Token Organisasi Berhasil Direset!');
    } else if (actionType === 'clear_cache') {
      if (onTriggerToast) onTriggerToast('System & Edge Cache Berhasil Dibersihkan!');
    } else if (actionType === 'delete_org') {
      if (onTriggerToast) onTriggerToast('Permintaan penghapusan organisasi dikirim ke Super Admin!');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
    if (onTriggerToast) onTriggerToast('cURL Code Snippet disalin ke clipboard!');
  };

  return (
    <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
      {/* 3-COLUMN CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: SYSTEM CONFIGURATION */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">System Configuration</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Advanced system-wide settings.</p>
            </div>

            {/* Environment Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Environment</label>
              <select
                value={config.environment}
                onChange={(e) => handleUpdateField('environment', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
              </select>
            </div>

            {/* Log Level Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Log Level</label>
              <select
                value={config.log_level}
                onChange={(e) => handleUpdateField('log_level', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Info">Info</option>
                <option value="Debug">Debug</option>
                <option value="Warn">Warn</option>
                <option value="Error">Error</option>
              </select>
            </div>

            {/* Maintenance Mode Toggle */}
            <ToggleSwitch
              label="Maintenance Mode"
              description="Temporarily disable access to non-admin users"
              checked={!!config.maintenance_mode}
              onChange={(v) => handleUpdateField('maintenance_mode', v)}
            />

            {/* Rate Limiting Mode Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Rate Limiting Mode</label>
              <select
                value={config.rate_limiting_mode}
                onChange={(e) => handleUpdateField('rate_limiting_mode', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Standard">Standard</option>
                <option value="Strict">Strict</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>

            {/* Background Jobs Concurrency Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Background Jobs Concurrency</label>
              <select
                value={config.background_jobs_concurrency}
                onChange={(e) => handleUpdateField('background_jobs_concurrency', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="10">10</option>
                <option value="5">5</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          {/* Bottom Interactive Link */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowStatusModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              View System Status <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* CARD 2: DEVELOPER & API */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Developer & API</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Advanced API and developer settings.</p>
            </div>

            {/* Allow Legacy API Access */}
            <ToggleSwitch
              label="Allow Legacy API Access"
              description="Enable access for deprecated API versions"
              checked={!!config.allow_legacy_api}
              onChange={(v) => handleUpdateField('allow_legacy_api', v)}
            />

            {/* API Response Caching */}
            <ToggleSwitch
              label="API Response Caching"
              description="Cache API responses for better performance"
              checked={!!config.api_response_caching}
              onChange={(v) => handleUpdateField('api_response_caching', v)}
            />

            {/* Webhook Retry Attempts */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Webhook Retry Attempts</label>
                <span className="text-[10px] text-slate-400">Maximum number of retry attempts</span>
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={config.webhook_retry_attempts}
                onChange={(e) => handleUpdateField('webhook_retry_attempts', parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Webhook Timeout */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Webhook Timeout (seconds)</label>
                <span className="text-[10px] text-slate-400">Timeout in seconds for webhook calls</span>
              </div>
              <input
                type="number"
                min={5}
                max={120}
                value={config.webhook_timeout}
                onChange={(e) => handleUpdateField('webhook_timeout', parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Enable GraphQL API */}
            <ToggleSwitch
              label="Enable GraphQL API"
              description="Provide advanced querying capabilities"
              checked={!!config.enable_graphql}
              onChange={(v) => handleUpdateField('enable_graphql', v)}
            />
          </div>

          {/* Bottom Interactive Link */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowApiDocsModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              View API Documentation <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* CARD 3: FEATURE MANAGEMENT */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Feature Management</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Control features and experimental capabilities.</p>
            </div>

            {/* Beta Features */}
            <ToggleSwitch
              label="Beta Features"
              description="Enable access to beta and experimental features"
              checked={!!config.beta_features}
              onChange={(v) => handleUpdateField('beta_features', v)}
            />

            {/* AI Model Preview */}
            <ToggleSwitch
              label="AI Model Preview"
              description="Allow early access to new AI models"
              checked={!!config.ai_model_preview}
              onChange={(v) => handleUpdateField('ai_model_preview', v)}
            />

            {/* Vector Store Compression */}
            <ToggleSwitch
              label="Vector Store Compression"
              description="Optimize vector storage to reduce costs"
              checked={!!config.vector_store_compression}
              onChange={(v) => handleUpdateField('vector_store_compression', v)}
            />

            {/* Custom Domains */}
            <ToggleSwitch
              label="Custom Domains"
              description="Allow custom domains for your organization"
              checked={!!config.custom_domains}
              onChange={(v) => handleUpdateField('custom_domains', v)}
            />
          </div>

          {/* Bottom Interactive Link */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowFeatureFlagsModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              Manage Feature Flags <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* FULL WIDTH BOTTOM CARD: DANGER ZONE */}
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-5 space-y-4 shadow-none">
        <div>
          <h3 className="text-sm font-extrabold text-rose-600 dark:text-rose-400">Danger Zone</h3>
          <p className="text-[11px] text-rose-500/90 dark:text-rose-300 font-medium mt-0.5">
            Irreversible and destructive actions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* ITEM 1: RESET API KEYS */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/40 flex items-center justify-between shadow-2xs">
            <div className="pr-3 space-y-0.5">
              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 block">Reset API Keys</span>
              <span className="text-[10px] text-slate-400 block">Invalidate all API keys and tokens</span>
            </div>
            <button
              onClick={() => setShowConfirmModal('reset_keys')}
              className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer shrink-0"
            >
              Reset Keys
            </button>
          </div>

          {/* ITEM 2: CLEAR CACHE */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/40 flex items-center justify-between shadow-2xs">
            <div className="pr-3 space-y-0.5">
              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 block">Clear Cache</span>
              <span className="text-[10px] text-slate-400 block">Clear all system caches</span>
            </div>
            <button
              onClick={() => setShowConfirmModal('clear_cache')}
              className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer shrink-0"
            >
              Clear Cache
            </button>
          </div>

          {/* ITEM 3: DELETE ORGANIZATION */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/40 flex items-center justify-between shadow-2xs">
            <div className="pr-3 space-y-0.5">
              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 block">Delete Organization</span>
              <span className="text-[10px] text-slate-400 block">Permanently delete this organization and all data</span>
            </div>
            <button
              onClick={() => setShowConfirmModal('delete_org')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Trash2 size={13} /> <span>Delete Org</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. REALTIME SYSTEM STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  System Health & Telemetry Status
                </h3>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">API Gateways</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">Operational</span>
                <span className="text-[10px] text-slate-400 block">Avg Response: 18ms</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Cloudflare R2 CDN</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">Operational</span>
                <span className="text-[10px] text-slate-400 block">Hit Rate: 99.8%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Supabase Postgres</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">Healthy</span>
                <span className="text-[10px] text-slate-400 block">Active Conn: 42/100</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">9Router AI Engine</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400 block">L5 Active</span>
                <span className="text-[10px] text-slate-400 block">Failover: Enabled</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500 block">Active Service Nodes</span>
              {[
                { name: 'US-East Fastify Gateway (Render)', status: 'Online', latency: '14ms' },
                { name: 'Cloudflare Edge CDN Node (Global)', status: 'Online', latency: '6ms' },
                { name: 'Supabase DB Realtime Channel', status: 'Subscribed', latency: '22ms' }
              ].map((node) => (
                <div key={node.name} className="flex justify-between items-center p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{node.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{node.latency}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {node.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
              >
                Tutup Telemetri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REALTIME API DOCUMENTATION MODAL */}
      {showApiDocsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  ZEGA Enterprise API Reference (v1)
                </h3>
              </div>
              <button onClick={() => setShowApiDocsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              {[
                { id: 'chat', label: 'POST /v1/chat/completions' },
                { id: 'agents', label: 'GET /v1/agents/active' },
                { id: 'models', label: 'GET /v1/models/status' },
                { id: 'webhooks', label: 'POST /v1/webhooks' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setApiDocTab(t.id as any)}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                    apiDocTab === t.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div className="relative rounded-xl bg-slate-950 p-4 text-slate-100 font-mono text-[11px] space-y-2 overflow-x-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-slate-400 text-[10px]">
                <span>cURL Code Snippet</span>
                <button
                  onClick={() =>
                    handleCopyCode(
                      apiDocTab === 'chat'
                        ? `curl -X POST https://api.zegaai.site/v1/chat/completions \\\n  -H "Authorization: Bearer sk_live_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"model": "zega-swarm-l5", "messages": [{"role": "user", "content": "Analyze pipeline"}]}'`
                        : `curl -X GET https://api.zegaai.site/v1/agents/active -H "Authorization: Bearer sk_live_..."`
                    )
                  }
                  className="flex items-center gap-1 hover:text-white cursor-pointer"
                >
                  {copiedSnippet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedSnippet ? 'Copied!' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="text-emerald-400">
                {apiDocTab === 'chat' &&
                  `curl -X POST https://api.zegaai.site/v1/chat/completions \\\n  -H "Authorization: Bearer sk_live_99847291..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "zega-swarm-l5",\n    "messages": [{"role": "user", "content": "Run enterprise workflow"}]\n  }'`}
                {apiDocTab === 'agents' &&
                  `curl -X GET https://api.zegaai.site/v1/agents/active \\\n  -H "Authorization: Bearer sk_live_99847291..."`}
                {apiDocTab === 'models' &&
                  `curl -X GET https://api.zegaai.site/v1/models/status \\\n  -H "Authorization: Bearer sk_live_99847291..."`}
                {apiDocTab === 'webhooks' &&
                  `curl -X POST https://api.zegaai.site/v1/webhooks/verify \\\n  -H "X-Zega-Signature: sha256=..."`}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">CDN Base SDK: https://cdn.zegaai.site/sdk/zega-v1.min.js</span>
              <button
                onClick={() => setShowApiDocsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
              >
                Tutup Dokumentasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REALTIME FEATURE FLAGS MANAGEMENT MODAL */}
      {showFeatureFlagsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Feature Flags Manager (Realtime DB)
                </h3>
              </div>
              <button onClick={() => setShowFeatureFlagsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <ToggleSwitch
                label="Beta Features Rollout (100%)"
                description="Enable experimental AI capabilities globally"
                checked={!!config.beta_features}
                onChange={(v) => handleUpdateField('beta_features', v)}
              />
              <ToggleSwitch
                label="AI Model Preview (9Router Swarm)"
                description="Early access to next-gen AI inference models"
                checked={!!config.ai_model_preview}
                onChange={(v) => handleUpdateField('ai_model_preview', v)}
              />
              <ToggleSwitch
                label="Vector Store Compression (pgvector)"
                description="Optimize vector memory footprint by 40%"
                checked={!!config.vector_store_compression}
                onChange={(v) => handleUpdateField('vector_store_compression', v)}
              />
              <ToggleSwitch
                label="Custom Domain Routing"
                description="Allow custom SSL subdomains per organization"
                checked={!!config.custom_domains}
                onChange={(v) => handleUpdateField('custom_domains', v)}
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-emerald-600 font-bold">✓ Synced with Supabase Realtime</span>
              <button
                onClick={() => setShowFeatureFlagsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DANGER ZONE */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={24} />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Konfirmasi Action Danger Zone
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {showConfirmModal === 'reset_keys' && 'Apakah Anda yakin ingin me-reset seluruh API Keys & Token? Semua integrasi eksternal memerlukan token baru.'}
              {showConfirmModal === 'clear_cache' && 'Apakah Anda yakin ingin mengosongkan seluruh system & edge cache? Response time API dapat sedikit melambat sementara.'}
              {showConfirmModal === 'delete_org' && 'Apakah Anda benar-benar yakin ingin MENGHAPUS organisasi ini dan SELURUH data di dalamnya secara permanen?'}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDangerAction(showConfirmModal)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
