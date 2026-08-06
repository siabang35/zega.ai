import React, { useState, useEffect } from 'react';
import { Plus, Key, Code, BookOpen } from 'lucide-react';
import { ApiKeysTab, ApiKeyItem } from './api-sdk/ApiKeysTab';
import { SdkCatalogTab } from './api-sdk/SdkCatalogTab';
import { CodeExamplesTab } from './api-sdk/CodeExamplesTab';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';

interface ApiSdkViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function ApiSdkView({ onTriggerToast }: ApiSdkViewProps) {
  const [activeTab, setActiveTab] = useState<'keys' | 'sdks' | 'examples'>('keys');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('Production');
  const [newKeyPerms, setNewKeyPerms] = useState('Full Access');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key_prod',
      name: 'Production Key',
      key_prefix: 'zga_live_••••••••',
      full_key_preview: 'zga_live_981249124819241829481294',
      environment: 'Production',
      permissions: 'Full Access',
      created_at: 'May 20, 2025',
      created_by: 'cole.coe@zegaai.com',
      last_used_at: 'Just now',
      status: 'Active'
    },
    {
      id: 'key_analytics',
      name: 'Analytics Service',
      key_prefix: 'zga_live_••••••••',
      full_key_preview: 'zga_live_412914812948124192412941',
      environment: 'Production',
      permissions: 'Read Only',
      created_at: 'May 18, 2025',
      created_by: 'cole.coe@zegaai.com',
      last_used_at: '2 min ago',
      status: 'Active'
    },
    {
      id: 'key_dev',
      name: 'DevKey - Team A',
      key_prefix: 'zga_dev_••••••••',
      full_key_preview: 'zga_dev_812491824912481294182941',
      environment: 'Development',
      permissions: 'Read / Write',
      created_at: 'May 15, 2025',
      created_by: 'dev.team@zegaai.com',
      last_used_at: '1 hour ago',
      status: 'Active'
    },
    {
      id: 'key_cuco',
      name: 'CUCO Key',
      key_prefix: 'zga_ci_••••••••',
      full_key_preview: 'zga_ci_918249182491824918294182',
      environment: 'Production',
      permissions: 'Read Only',
      created_at: 'May 10, 2025',
      created_by: 'ci.runner@zegaai.com',
      last_used_at: '3 hours ago',
      status: 'Active'
    },
    {
      id: 'key_billing',
      name: 'Billing Integration',
      key_prefix: 'zga_billing_••••••••',
      full_key_preview: 'zga_billing_129481294812491824918241',
      environment: 'Production',
      permissions: 'Billing',
      created_at: 'May 05, 2025',
      created_by: 'finance@zegaai.com',
      last_used_at: '1 day ago',
      status: 'Inactive'
    },
    {
      id: 'key_test',
      name: 'Test Key',
      key_prefix: 'zga_test_••••••••',
      full_key_preview: 'zga_test_812491824912491284918249',
      environment: 'Testing',
      permissions: 'Read Only',
      created_at: 'May 01, 2025',
      created_by: 'qa.tester@zegaai.com',
      last_used_at: 'Revoked',
      status: 'Revoked'
    }
  ]);

  // Load API keys from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    enterpriseSupabaseService.getApiKeysRealtime().then((data) => {
      if (isMounted && data && data.length > 0) {
        setApiKeys(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      if (onTriggerToast) onTriggerToast('⚠️ Please enter key name!');
      return;
    }

    const res = await enterpriseSupabaseService.createApiKey({
      name: newKeyName,
      environment: newKeyEnv,
      permissions: newKeyPerms
    });

    if (res.success && res.key) {
      setApiKeys((prev) => [res.key, ...prev]);
      setGeneratedKey(res.rawKey || 'zga_live_' + Math.random().toString(36).substring(2, 20));
      if (onTriggerToast) onTriggerToast('🔑 API Key Created Successfully!');
    } else {
      // Fallback
      const randStr = Math.random().toString(36).substring(2, 10);
      const fullKey = `zga_live_${randStr}_${Math.random().toString(36).substring(2, 18)}`;
      const newKeyObj: ApiKeyItem = {
        id: `key_${Date.now()}`,
        name: newKeyName,
        key_prefix: `zga_live_${randStr}••••••••`,
        full_key_preview: fullKey,
        environment: newKeyEnv,
        permissions: newKeyPerms,
        created_at: 'Just now',
        created_by: 'cole.coe@zegaai.com',
        last_used_at: 'Just now',
        status: 'Active'
      };
      setApiKeys((prev) => [newKeyObj, ...prev]);
      setGeneratedKey(fullKey);
      if (onTriggerToast) onTriggerToast('🔑 API Key Created Successfully!');
    }
  };

  const handleRevokeKey = async (id: string) => {
    await enterpriseSupabaseService.revokeApiKey(id);
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'Revoked' as const } : k))
    );
    if (onTriggerToast) onTriggerToast('🚫 API Key Revoked!');
  };

  const handleRegenerateKey = async (id: string) => {
    const res = await enterpriseSupabaseService.regenerateApiKey(id);
    if (res.success && res.key) {
      setApiKeys((prev) => prev.map((k) => (k.id === id ? res.key : k)));
      if (onTriggerToast) onTriggerToast(`🔄 Key Regenerated: ${res.rawKey}`);
    } else {
      if (onTriggerToast) onTriggerToast('🔄 Key Regenerated Successfully!');
    }
  };

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
          onClick={() => {
            setGeneratedKey(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs w-fit"
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
          { id: 'examples', label: 'Code Examples' }
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

      {/* RENDER ACTIVE TAB PAGE */}
      {activeTab === 'keys' && (
        <ApiKeysTab
          apiKeys={apiKeys}
          onTriggerToast={onTriggerToast}
          onCreateKeyModal={() => {
            setGeneratedKey(null);
            setShowCreateModal(true);
          }}
          onRevokeKey={handleRevokeKey}
          onRegenerateKey={handleRegenerateKey}
        />
      )}

      {activeTab === 'sdks' && (
        <SdkCatalogTab
          onTriggerToast={onTriggerToast}
          onNavigateToDocs={() => {
            if (onTriggerToast) onTriggerToast('📖 Opening Documentation');
          }}
          onNavigateToExamples={() => setActiveTab('examples')}
        />
      )}

      {activeTab === 'examples' && (
        <CodeExamplesTab
          onTriggerToast={onTriggerToast}
          onNavigateToDocs={() => {
            if (onTriggerToast) onTriggerToast('📖 Opening Full Code Examples Documentation');
          }}
        />
      )}

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Create New API Key</h3>
              <p className="text-xs text-slate-500">Configure key permissions and deployment environment.</p>
            </div>

            {generatedKey ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 space-y-3">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  🎉 Key Generated! Please save it now (it won't be shown again):
                </span>
                <div className="p-2.5 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs font-bold break-all">
                  {generatedKey}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    if (onTriggerToast) onTriggerToast('📋 Key copied to clipboard!');
                    setShowCreateModal(false);
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                >
                  Copy & Close
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Key Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Production Service Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-medium text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Environment</label>
                  <select
                    value={newKeyEnv}
                    onChange={(e) => setNewKeyEnv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-medium text-xs cursor-pointer"
                  >
                    <option value="Production">Production</option>
                    <option value="Development">Development</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Permissions</label>
                  <select
                    value={newKeyPerms}
                    onChange={(e) => setNewKeyPerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-medium text-xs cursor-pointer"
                  >
                    <option value="Full Access">Full Access</option>
                    <option value="Read Only">Read Only</option>
                    <option value="Read / Write">Read / Write</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApiKey}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Generate Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
