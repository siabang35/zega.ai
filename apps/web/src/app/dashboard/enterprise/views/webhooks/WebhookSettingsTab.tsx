import React, { useState } from 'react';
import {
  Key,
  Shield,
  Clock,
  RefreshCw,
  Sliders,
  Send,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  Lock,
  Globe,
  Filter,
  Layers,
  Check,
  FileCode,
  Zap,
  Server
} from 'lucide-react';

interface WebhookSettingsTabProps {
  onTriggerToast?: (msg: string) => void;
}

export function WebhookSettingsTab({ onTriggerToast }: WebhookSettingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'general' | 'security' | 'retry' | 'headers' | 'ip' | 'filtering' | 'advanced'
  >('general');

  // GENERAL STATE
  const [showSecret, setShowSecret] = useState(false);
  const [secretKey, setSecretKey] = useState('whsec_88921a009fb24c9182491294');
  const [timeout, setTimeout] = useState(10);
  const [maxRetries, setMaxRetries] = useState(5);
  const [contentType, setContentType] = useState('application/json');
  const [gatewayEnabled, setGatewayEnabled] = useState(true);
  const [testEndpointUrl, setTestEndpointUrl] = useState('https://webhook.site/your-test-endpoint');
  const [sendingTest, setSendingTest] = useState(false);

  // SECURITY STATE
  const [enforceTls13, setEnforceTls13] = useState(true);
  const [sigAlg, setSigAlg] = useState('HMAC-SHA256');
  const [mtlsEnabled, setMtlsEnabled] = useState(false);
  const [mtlsCertPem, setMtlsCertPem] = useState(
    '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIU...\n-----END CERTIFICATE-----'
  );
  const [autoRotateDays, setAutoRotateDays] = useState(90);

  // RETRY POLICY STATE
  const [retryStrategy, setRetryStrategy] = useState('Exponential Backoff');
  const [retryMultiplier, setRetryMultiplier] = useState(2);
  const [dlqEnabled, setDlqEnabled] = useState(true);
  const [dlqUrl, setDlqUrl] = useState('https://dlq.acme.com/webhooks/dead-letter');
  const [rateLimitRps, setRateLimitRps] = useState(100);

  // HEADERS STATE
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: 'X-Zega-Source', value: 'WebhookGateway' },
    { key: 'X-Zega-Version', value: 'v2.4' }
  ]);
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderVal, setNewHeaderVal] = useState('');
  const [userAgent, setUserAgent] = useState('ZEGA-Webhook-Gateway/2.4 (Enterprise Engine)');

  // IP ALLOWLIST STATE
  const [allowedIps, setAllowedIps] = useState<string[]>(['192.168.1.0/24', '10.0.0.0/8', '0.0.0.0/0']);
  const [newIpInput, setNewIpInput] = useState('');
  const [enforceIpAllowlist, setEnforceIpAllowlist] = useState(true);
  const outboundStaticIps = ['34.120.45.10', '34.120.45.11', '34.120.45.12'];

  // EVENT FILTERING STATE
  const [topics, setTopics] = useState<Record<string, boolean>>({
    'checkout.*': true,
    'invoice.*': true,
    'user.*': true,
    'subscription.*': true,
    'payment.*': true,
    'agent.*': false
  });
  const [jsonPathExpr, setJsonPathExpr] = useState('$.data.status == "success"');

  // ADVANCED STATE
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [compressionAlg, setCompressionAlg] = useState('gzip');
  const [maxPayloadSizeMb, setMaxPayloadSizeMb] = useState(10);
  const [payloadEncryption, setPayloadEncryption] = useState(false);
  const [circuitBreakerThreshold, setCircuitBreakerThreshold] = useState(5);
  const [loggingLevel, setLoggingLevel] = useState('INFO');

  const handleRotateSecret = () => {
    const newSec = 'whsec_' + Math.random().toString(36).substring(2, 22);
    setSecretKey(newSec);
    if (onTriggerToast) onTriggerToast('🔄 Webhook Signature Secret Rotated!');
  };

  const handleSendTest = () => {
    setSendingTest(true);
    window.setTimeout(() => {
      setSendingTest(false);
      if (onTriggerToast) onTriggerToast(`🚀 Test webhook payload sent to ${testEndpointUrl} (200 OK)!`);
    }, 600);
  };

  const handleAddHeader = () => {
    if (!newHeaderKey.trim()) return;
    setCustomHeaders((prev) => [...prev, { key: newHeaderKey, value: newHeaderVal }]);
    setNewHeaderKey('');
    setNewHeaderVal('');
    if (onTriggerToast) onTriggerToast('➕ Custom Header Added!');
  };

  const handleRemoveHeader = (idx: number) => {
    setCustomHeaders((prev) => prev.filter((_, i) => i !== idx));
    if (onTriggerToast) onTriggerToast('🗑️ Header Removed');
  };

  const handleAddIp = () => {
    if (!newIpInput.trim()) return;
    setAllowedIps((prev) => [...prev, newIpInput.trim()]);
    setNewIpInput('');
    if (onTriggerToast) onTriggerToast('🌐 IP Range Added to Allowlist');
  };

  const handleRemoveIp = (ip: string) => {
    setAllowedIps((prev) => prev.filter((i) => i !== ip));
    if (onTriggerToast) onTriggerToast('🗑️ IP Removed from Allowlist');
  };

  const handleSaveSettings = () => {
    if (onTriggerToast) onTriggerToast('💾 Webhook Gateway Settings Saved to Database!');
  };

  return (
    <div className="space-y-6">
      {/* 2-COLUMN SETTINGS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT (3 cols): SETTINGS NAVIGATION LIST */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1 shadow-2xs">
          {[
            { id: 'general', label: 'General', sub: 'Basic configuration' },
            { id: 'security', label: 'Security', sub: 'Authentication & secrets' },
            { id: 'retry', label: 'Retry Policy', sub: 'Retry & timeout settings' },
            { id: 'headers', label: 'Headers', sub: 'Custom headers' },
            { id: 'ip', label: 'IP Allowlist', sub: 'Access control' },
            { id: 'filtering', label: 'Event Filtering', sub: 'Filter events' },
            { id: 'advanced', label: 'Advanced', sub: 'Advanced settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer block ${
                activeSubTab === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className={`font-bold text-xs block ${activeSubTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 block">{item.sub}</span>
            </button>
          ))}
        </div>

        {/* RIGHT (9 cols): SETTINGS CONFIGURATION PANEL */}
        <div className="lg:col-span-9 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-2xs">
          {/* SUB-TAB 1: GENERAL */}
          {activeSubTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">General Settings</h3>
                <p className="text-xs text-slate-500">Configure global webhook gateway settings.</p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Secret Name</label>
                  <input
                    type="text"
                    readOnly
                    value="Checkout Webhook"
                    className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Webhook Signature Secret</label>
                  <p className="text-[11px] text-slate-500 mb-2">Used to verify webhook payload signatures (HMAC SHA-256).</p>
                  
                  <div className="flex items-center gap-2 max-w-md">
                    <div className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs text-emerald-400 flex items-center justify-between">
                      <span>{showSecret ? secretKey : secretKey.substring(0, 8) + '••••••••••••••••'}</span>
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-slate-400 hover:text-white cursor-pointer ml-2"
                      >
                        {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>

                    <button
                      onClick={handleRotateSecret}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Rotate Secret</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Timeout (seconds)</label>
                  <input
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                  />
                  <span className="text-[10.5px] text-slate-400 block mt-1">Response time limit for endpoint response.</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Maximum Retry Attempts</label>
                  <input
                    type="number"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                  />
                  <span className="text-[10.5px] text-slate-400 block mt-1">Number of retry attempts for failed deliveries.</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Content-Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs cursor-pointer"
                  >
                    <option value="application/json">application/json</option>
                    <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Enable Webhook Gateway</span>
                    <span className="text-[11px] text-slate-500">Enable or pause all webhook deliveries across endpoints.</span>
                  </div>
                  <button
                    onClick={() => setGatewayEnabled(!gatewayEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      gatewayEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`size-4 rounded-full bg-white transition-transform absolute top-1 ${gatewayEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Test Settings</h4>
                <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
                  <input
                    type="text"
                    value={testEndpointUrl}
                    onChange={(e) => setTestEndpointUrl(e.target.value)}
                    className="flex-1 w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: SECURITY */}
          {activeSubTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Security & Authentication</h3>
                <p className="text-xs text-slate-500">Configure TLS, signature algorithms, mTLS, and auto-rotation schedules.</p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Enforce TLS v1.3 Standard</span>
                    <span className="text-[11px] text-slate-500">Reject non-encrypted or legacy TLS connections for webhook deliveries.</span>
                  </div>
                  <button
                    onClick={() => setEnforceTls13(!enforceTls13)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${enforceTls13 ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`size-4 rounded-full bg-white transition-transform absolute top-1 ${enforceTls13 ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Signature Algorithm</label>
                  <select
                    value={sigAlg}
                    onChange={(e) => setSigAlg(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs cursor-pointer"
                  >
                    <option value="HMAC-SHA256">HMAC-SHA256 (Recommended Standard)</option>
                    <option value="HMAC-SHA512">HMAC-SHA512 (High Security)</option>
                    <option value="Ed25519">Ed25519 Asymmetric Signature</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">Mutual TLS (mTLS) Client Verification</span>
                      <span className="text-[11px] text-slate-500">Present client X.509 certificate on webhook delivery requests.</span>
                    </div>
                    <button
                      onClick={() => setMtlsEnabled(!mtlsEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${mtlsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`size-4 rounded-full bg-white transition-transform absolute top-1 ${mtlsEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {mtlsEnabled && (
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">mTLS Client Certificate (PEM format)</label>
                      <textarea
                        rows={4}
                        value={mtlsCertPem}
                        onChange={(e) => setMtlsCertPem(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-[11px] text-emerald-400"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Secret Auto-Rotation Schedule</label>
                  <select
                    value={autoRotateDays}
                    onChange={(e) => setAutoRotateDays(Number(e.target.value))}
                    className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs cursor-pointer"
                  >
                    <option value={0}>Disabled (Manual Rotation Only)</option>
                    <option value={30}>Every 30 Days</option>
                    <option value={60}>Every 60 Days</option>
                    <option value={90}>Every 90 Days (Enterprise Best Practice)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: RETRY POLICY */}
          {activeSubTab === 'retry' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Retry Policy & Dead Letter Queue</h3>
                <p className="text-xs text-slate-500">Define backoff schedules, rate limits, and fallback endpoints for failed deliveries.</p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Backoff Strategy</label>
                    <select
                      value={retryStrategy}
                      onChange={(e) => setRetryStrategy(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs cursor-pointer"
                    >
                      <option value="Exponential Backoff">Exponential Backoff (Recommended)</option>
                      <option value="Linear Backoff">Linear Backoff</option>
                      <option value="Fixed Interval">Fixed Interval</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Interval Multiplier</label>
                    <input
                      type="number"
                      value={retryMultiplier}
                      onChange={(e) => setRetryMultiplier(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">Dead Letter Queue (DLQ) Integration</span>
                      <span className="text-[11px] text-slate-500">Route undeliverable webhook payloads to a fallback DLQ endpoint after max retries.</span>
                    </div>
                    <button
                      onClick={() => setDlqEnabled(!dlqEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${dlqEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`size-4 rounded-full bg-white transition-transform absolute top-1 ${dlqEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {dlqEnabled && (
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">DLQ Endpoint Target URL</label>
                      <input
                        type="text"
                        value={dlqUrl}
                        onChange={(e) => setDlqUrl(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs text-indigo-400"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Gateway Throttle Rate Limit (Requests / Sec)</label>
                  <input
                    type="number"
                    value={rateLimitRps}
                    onChange={(e) => setRateLimitRps(Number(e.target.value))}
                    className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                  />
                  <span className="text-[10.5px] text-slate-400 block mt-1">Maximum outbound HTTP request burst per second per endpoint.</span>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: HEADERS */}
          {activeSubTab === 'headers' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Custom HTTP Headers</h3>
                <p className="text-xs text-slate-500">Inject custom HTTP headers into all outbound webhook request payloads.</p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">User-Agent Header</label>
                  <input
                    type="text"
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>

                <div className="space-y-3">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Header Key-Value Pairs</label>
                  {customHeaders.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={h.key}
                        className="w-1/3 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold"
                      />
                      <input
                        type="text"
                        readOnly
                        value={h.value}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                      />
                      <button
                        onClick={() => handleRemoveHeader(i)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/60 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Header-Name"
                      value={newHeaderKey}
                      onChange={(e) => setNewHeaderKey(e.target.value)}
                      className="w-1/3 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Header-Value"
                      value={newHeaderVal}
                      onChange={(e) => setNewHeaderVal(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                    <button
                      onClick={handleAddHeader}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 5: IP ALLOWLIST */}
          {activeSubTab === 'ip' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">IP Allowlist & Outbound Static Pool</h3>
                <p className="text-xs text-slate-500">Configure firewall CIDR access rules and copy static outbound gateway IPs.</p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Enforce Inbound IP Allowlist</span>
                    <span className="text-[11px] text-slate-500">Restrict gateway administration API to designated CIDR blocks.</span>
                  </div>
                  <button
                    onClick={() => setEnforceIpAllowlist(!enforceIpAllowlist)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${enforceIpAllowlist ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`size-4 rounded-full bg-white transition-transform absolute top-1 ${enforceIpAllowlist ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Allowed CIDR Ranges</label>
                  <div className="flex flex-wrap gap-2">
                    {allowedIps.map((ip) => (
                      <span key={ip} className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {ip}
                        <button onClick={() => handleRemoveIp(ip)} className="hover:text-rose-600 cursor-pointer">✕</button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2 max-w-md">
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.0/24"
                      value={newIpInput}
                      onChange={(e) => setNewIpInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                    />
                    <button onClick={handleAddIp} className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer">
                      Add IP
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Outbound Static Gateway IP Pool</h4>
                  <p className="text-[11px] text-slate-500">Whitelist these static IP addresses on your destination corporate firewall.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {outboundStaticIps.map((ip) => (
                      <div key={ip} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-between">
                        <span>{ip}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ip);
                            if (onTriggerToast) onTriggerToast(`📋 Copied ${ip} to clipboard!`);
                          }}
                          className="hover:text-white cursor-pointer"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 6: EVENT FILTERING */}
          {activeSubTab === 'filtering' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Event Filtering & Rules Engine</h3>
                <p className="text-xs text-slate-500">Filter webhook delivery execution using topic patterns and JSONPath expressions.</p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Subscribed Event Topics</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.keys(topics).map((topic) => (
                      <label
                        key={topic}
                        onClick={() => setTopics((prev) => ({ ...prev, [topic]: !prev[topic] }))}
                        className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-colors ${
                          topics[topic]
                            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <span>{topic}</span>
                        <input type="checkbox" checked={topics[topic]} readOnly className="size-4" />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">JSONPath Filter Condition</label>
                  <p className="text-[11px] text-slate-500 mb-2">Only trigger webhooks when payload matches this JSONPath expression.</p>
                  <input
                    type="text"
                    value={jsonPathExpr}
                    onChange={(e) => setJsonPathExpr(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs text-emerald-400 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 7: ADVANCED */}
          {activeSubTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Advanced Engine Settings</h3>
                <p className="text-xs text-slate-500">Configure payload compression, circuit breakers, and system logging levels.</p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Compression Algorithm</label>
                    <select
                      value={compressionAlg}
                      onChange={(e) => setCompressionAlg(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs cursor-pointer"
                    >
                      <option value="gzip">gzip (Default Standard)</option>
                      <option value="brotli">brotli (High Compression Ratio)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Max Payload Size (MB)</label>
                    <input
                      type="number"
                      value={maxPayloadSizeMb}
                      onChange={(e) => setMaxPayloadSizeMb(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Circuit Breaker Threshold</label>
                    <input
                      type="number"
                      value={circuitBreakerThreshold}
                      onChange={(e) => setCircuitBreakerThreshold(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs"
                    />
                    <span className="text-[10.5px] text-slate-400 block mt-1">Consecutive errors before temporarily isolating failing endpoint.</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Logging Verbosity Level</label>
                    <select
                      value={loggingLevel}
                      onChange={(e) => setLoggingLevel(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-xs cursor-pointer"
                    >
                      <option value="DEBUG">DEBUG (Detailed Telemetry)</option>
                      <option value="INFO">INFO (Standard Production Log)</option>
                      <option value="WARN">WARN (Warnings & Errors Only)</option>
                      <option value="ERROR">ERROR (Errors Only)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAVE BUTTON FOOTER */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-2"
            >
              <Check size={14} />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
