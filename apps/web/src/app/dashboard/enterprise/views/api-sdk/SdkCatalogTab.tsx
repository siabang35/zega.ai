import React from 'react';
import {
  Copy,
  Download,
  ExternalLink,
  BookOpen,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { getR2CdnUrl } from '../../../../utils/cdn';

export interface SdkItem {
  id: string;
  language: string;
  name: string;
  package_name: string;
  version: string;
  platform: string;
  install_command: string;
  icon_url: string;
  status: 'Stable' | 'Beta' | 'Preview';
  badge: 'Active' | 'Coming soon';
  last_update?: string;
}

interface SdkCatalogTabProps {
  onTriggerToast?: (msg: string) => void;
  onNavigateToDocs: () => void;
  onNavigateToExamples: () => void;
}

export function SdkCatalogTab({
  onTriggerToast,
  onNavigateToDocs,
  onNavigateToExamples
}: SdkCatalogTabProps) {
  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (onTriggerToast) onTriggerToast(`📋 ${label} copied to clipboard!`);
  };

  const sdkGridList: SdkItem[] = [
    {
      id: 'sdk_js',
      language: 'JavaScript / TypeScript',
      name: 'JavaScript / TypeScript SDK',
      package_name: '@zega/sdk',
      version: 'v2.4.0',
      platform: 'Node.js, Browser',
      install_command: 'npm install @zega/sdk',
      icon_url: getR2CdnUrl('/design/design_enterprise/JavaScript-logo.png', true),
      status: 'Stable',
      badge: 'Active',
      last_update: 'May 26, 2025'
    },
    {
      id: 'sdk_py',
      language: 'Python',
      name: 'Python SDK',
      package_name: 'zega-ai',
      version: 'v2.4.0',
      platform: 'Linux, macOS, Win',
      install_command: 'pip install zega-ai',
      icon_url: getR2CdnUrl('/design/design_enterprise/python_logo.webp', true),
      status: 'Stable',
      badge: 'Active',
      last_update: 'May 26, 2025'
    },
    {
      id: 'sdk_go',
      language: 'Go',
      name: 'Go SDK',
      package_name: 'zega-go',
      version: 'v2.3.0',
      platform: 'Linux, macOS, Win',
      install_command: 'go get github.com/zega/zega-go',
      icon_url: getR2CdnUrl('/design/design_enterprise/Go-Logo_LightBlue.png', true),
      status: 'Stable',
      badge: 'Active',
      last_update: 'May 26, 2025'
    },
    {
      id: 'sdk_java',
      language: 'Java',
      name: 'Java SDK',
      package_name: 'zega-java',
      version: 'v2.3.1',
      platform: 'Linux, macOS, Win',
      install_command: 'implementation "site.zegaai:sdk:2.3.1"',
      icon_url: getR2CdnUrl('/design/design_enterprise/java.png', true),
      status: 'Beta',
      badge: 'Coming soon',
      last_update: 'May 15, 2025'
    },
    {
      id: 'sdk_dotnet',
      language: '.NET',
      name: '.NET SDK',
      package_name: 'zega-dotnet',
      version: 'v2.2.0',
      platform: 'Windows, Linux, macOS',
      install_command: 'dotnet add package Zega.SDK',
      icon_url: getR2CdnUrl('/design/design_enterprise/JavaScript-logo.png', true),
      status: 'Beta',
      badge: 'Coming soon',
      last_update: 'May 10, 2025'
    },
    {
      id: 'sdk_curl',
      language: 'cURL',
      name: 'cURL Direct REST',
      package_name: 'curl',
      version: 'Latest',
      platform: 'Any',
      install_command: 'curl https://api.zegaai.site/v1/...',
      icon_url: getR2CdnUrl('/design/design_enterprise/Curl-logo.webp', true),
      status: 'Stable',
      badge: 'Active',
      last_update: 'May 27, 2025'
    }
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 1: AVAILABLE SDKs & LIBRARIES GRID */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Available SDKs & Libraries</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official SDKs to help you integrate ZEGA AI into your applications faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sdkGridList.map((sdk) => (
            <div
              key={sdk.id}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      <img src={sdk.icon_url} alt={sdk.language} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{sdk.language}</h4>
                      <span className="text-[10px] font-mono text-slate-400">{sdk.version}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {sdk.language === 'JavaScript / TypeScript' && 'Full-featured SDK for Node.js and modern browsers.'}
                  {sdk.language === 'Python' && 'Python SDK for building AI-powered applications.'}
                  {sdk.language === 'Go' && 'High-performance Go SDK for backend services.'}
                  {sdk.language === 'Java' && 'Enterprise-ready Java SDK for corporate workloads.'}
                  {sdk.language === '.NET' && '.NET SDK for enterprise applications.'}
                  {sdk.language === 'cURL' && 'Make API requests directly with cURL.'}
                </p>

                {/* INSTALL COMMAND BOX */}
                <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10.5px] flex items-center justify-between">
                  <span className="truncate max-w-[200px]">{sdk.install_command}</span>
                  <button
                    onClick={() => copyText(sdk.install_command, `${sdk.language} Command`)}
                    className="text-slate-400 hover:text-white cursor-pointer ml-1"
                    title="Copy command"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              {/* BOTTOM LINK BUTTON */}
              <div className="pt-2">
                {sdk.badge === 'Coming soon' ? (
                  <button
                    onClick={() => onTriggerToast && onTriggerToast(`🔔 Subscribed to ${sdk.language} release notification`)}
                    className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Notify me</span>
                    <span>→</span>
                  </button>
                ) : sdk.language === 'cURL' ? (
                  <button
                    onClick={onNavigateToExamples}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View examples</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    onClick={onNavigateToDocs}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Documentation</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: SDK COMPARISON TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">SDK Comparison</h3>
          <p className="text-xs text-slate-500">Detailed technical specs across supported environments.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-extrabold">
                <th className="py-2.5 px-3">SDK</th>
                <th className="py-2.5 px-3">LANGUAGE</th>
                <th className="py-2.5 px-3">VERSION</th>
                <th className="py-2.5 px-3">PLATFORM</th>
                <th className="py-2.5 px-3">LAST UPDATE</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {sdkGridList.map((sdk) => (
                <tr key={sdk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{sdk.language}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-semibold">{sdk.language.split('/')[0]}</td>
                  <td className="py-3 px-3 font-mono text-[11px]">{sdk.version}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{sdk.platform}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{sdk.last_update}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sdk.status === 'Stable'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}
                    >
                      {sdk.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => copyText(sdk.install_command, sdk.language)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy Install Command"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: REQUIREMENTS & NEED HELP CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* REQUIREMENTS CARD */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xs">
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Requirements</h4>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-indigo-600" />
              <span>API access with a valid API Key</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="size-1.5 rounded-full bg-indigo-600" />
              <span>HTTPS endpoint: https://api.zegaai.site</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-indigo-600" />
              <span>All SDKs support rate limiting and retries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-indigo-600" />
              <span>See documentation for full requirements</span>
            </div>
          </div>
          <button onClick={onNavigateToDocs} className="pt-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
            <span>View all docs</span>
            <span>→</span>
          </button>
        </div>

        {/* NEED HELP CARD */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xs">
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Need Help?</h4>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 flex items-center justify-center font-bold">
                <BookOpen size={16} />
              </div>
              <div>
                <button onClick={onNavigateToDocs} className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block">
                  Visit Documentation
                </button>
                <span className="text-[11px] text-slate-500">Comprehensive guides and references.</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 flex items-center justify-center font-bold">
                <MessageSquare size={16} />
              </div>
              <div>
                <button onClick={() => onTriggerToast && onTriggerToast('💬 Opening Developer Community Forum')} className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block">
                  Join Developer Community
                </button>
                <span className="text-[11px] text-slate-500">Get help from other developers.</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 flex items-center justify-center font-bold">
                <HelpCircle size={16} />
              </div>
              <div>
                <button onClick={() => onTriggerToast && onTriggerToast('📞 Contacting 24/7 Enterprise Developer Support')} className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-left block">
                  Contact Support
                </button>
                <span className="text-[11px] text-slate-500">Our team is here to help.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
