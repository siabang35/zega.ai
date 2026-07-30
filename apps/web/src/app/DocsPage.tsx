import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Code2,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  Check,
  Copy,
  ExternalLink,
  Search,
  Sparkles,
  Zap,
  Globe,
  ChevronRight,
  ChevronDown,
  FileText,
  Lock,
  AlertCircle,
  Info,
  HelpCircle,
  Github,
  Command,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';

interface DocsPageProps {
  onBack: () => void;
  dark?: boolean;
  setDark?: (dark: boolean) => void;
  triggerComingSoon?: () => void;
}

const DOCS_NAV = [
  {
    category: 'GETTING STARTED',
    items: [
      { id: 'quickstart', title: 'Quickstart Guide' },
      { id: 'architecture', title: '9Router Architecture' },
      { id: 'installation', title: 'SDK & API Setup' },
    ],
  },
  {
    category: 'CORE ENGINES',
    items: [
      { id: '9router', title: 'Dynamic LLM Routing' },
      { id: 'guardrails', title: '5-Layer Guardrails' },
      { id: 'orchestrator', title: 'ZEGA Orchestrator' },
    ],
  },
  {
    category: 'SOLANA & ZEROCLAW AGENTS',
    items: [
      { id: 'zeroclaw', title: 'ZeroClaw Rust Agent Node' },
      { id: 'solana-pay', title: 'Solana Pay QR & Devnet RPC' },
      { id: 'sop-checkpoints', title: 'SOP Human Approval Checkpoints' },
      { id: 'enterprise-zeroclaw', title: 'Enterprise Swarm & Guardrails' },
    ],
  },
  {
    category: 'ENTERPRISE & COMPLIANCE',
    items: [
      { id: 'pii', title: 'PII Redaction & Audit' },
      { id: 'auth', title: 'OTP & Bot Defense' },
      { id: 'deployment', title: 'Vercel & Render Setup' },
      { id: 'sla', title: 'High Availability (SLA)' },
    ],
  },
];

const CODE_EXAMPLES = {
  typescript: `import { ZegaClient } from '@zega/sdk';

// Initialize ZEGA AI Client with 9Router
const zega = new ZegaClient({
  apiKey: process.env.ZEGA_API_KEY!,
  routing: {
    engine: '9router-v2',
    strategy: 'cost-optimized', // 'latency-first' | 'cost-optimized'
    maxLatencyMs: 350,
  },
  guardrails: {
    inputSanitize: true,
    piiRedaction: true,
    injectionBlock: true,
  },
});

// Run multi-agent orchestrator workflow
const result = await zega.orchestrate({
  task: 'Process quarterly financial audit report',
  modelFallback: ['gpt-5.1', 'claude-3.7-sonnet', 'deepseek-v4'],
  timeoutMs: 5000,
});

console.log('Result:', result.output);
console.log('Routed via:', result.telemetry.routedModel);`,

  python: `from zega import ZegaClient

# Initialize Python SDK
zega = ZegaClient(
    api_key="zeg_live_849204810293",
    routing_strategy="latency-first",
    pii_redaction=True
)

# Execute autonomous task
response = zega.orchestrate(
    task="Summarize customer feedback & flag compliance issues",
    fallback_models=["claude-3.7-sonnet", "gpt-5.1"],
    guardrails_enabled=True
)

print(f"Status: {response.status}")
print(f"Output: {response.output}")`,

  curl: `curl -X POST https://api.zega.ai/v1/orchestrate \\
  -H "Authorization: Bearer zeg_live_849204810293" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task": "Extract entity relations from contract PDF",
    "routing": {
      "strategy": "cost-optimized",
      "maxLatencyMs": 400
    },
    "guardrails": {
      "piiRedaction": true
    }
  }'`,
};

export const DocsPage: React.FC<DocsPageProps> = ({ onBack, dark, setDark, triggerComingSoon }) => {
  const [activeTab, setActiveTab] = useState('quickstart');
  const [codeLang, setCodeLang] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [pkgManager, setPkgManager] = useState<'npm' | 'pnpm' | 'yarn' | 'bun' | 'curl'>('npm');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif] text-foreground antialiased selection:bg-[#ff6b35]/20 selection:text-[#ff6b35]">
      {/* Enterprise Dedicated Documentation Header (Stripe / Vercel Standard) */}
      <header className="sticky top-0 z-50 h-[58px] border-b border-border/50 bg-background/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-4 sm:px-8">
          {/* Left: Branding & Navigation Back Link */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* Seamless Back to Main Site Button on LEFT */}
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1 text-[11px] font-semibold text-foreground/90 transition-all hover:bg-muted/80 hover:border-[#ff6b35]/40 hover:text-[#ff6b35] shadow-2xs group cursor-pointer whitespace-nowrap"
              title="Return to ZEGA AI Main Site"
            >
              <ArrowLeft size={13} className="text-muted-foreground group-hover:-translate-x-0.5 group-hover:text-[#ff6b35] transition-transform flex-shrink-0" />
              <span className="hidden sm:inline">Main Site</span>
              <span className="sm:hidden text-[10px]">Back</span>
            </button>

            <div className="h-3.5 w-px bg-border/60" />

            <button
              onClick={onBack}
              className="flex items-center gap-1.5 group focus:outline-none cursor-pointer"
              title="ZEGA AI Home"
            >
              <img
                src="https://cdn.zegaai.site/assets/logo/zegalogo.png"
                alt="ZEGA AI"
                width={120}
                height={34}
                className="h-6 sm:h-7.5 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] transition-[filter,opacity] duration-300 group-hover:opacity-85"
                loading="eager"
                decoding="async"
              />
            </button>

            <div className="h-3.5 w-px bg-border/60" />

            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-[#ff6b35]/10 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#ff6b35] border border-[#ff6b35]/20">
                Docs
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[9.5px] font-mono text-muted-foreground border border-border/60">
                v2.4
              </span>
            </div>
          </div>

          {/* Center: Global Documentation Search Bar (⌘K) */}
          <div className="relative flex-1 max-w-md mx-4 hidden md:block">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search documentation, API reference, or SDKs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-card/60 py-1.5 pl-9 pr-12 text-[11.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[#ff6b35]/60 focus:bg-background transition-all shadow-2xs"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
              <Command size={10} />
              <span>K</span>
            </div>
          </div>

          {/* Right: Theme Toggle & API Key CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/60"
            >
              <Github size={14} />
              <span>GitHub</span>
            </a>

            {setDark && (
              <button
                onClick={() => setDark(!dark)}
                className="grid size-7.5 sm:size-8 place-items-center rounded-full border border-border/80 bg-card/60 text-muted-foreground transition-all duration-300 hover:border-foreground/30 hover:text-foreground cursor-pointer flex-shrink-0"
                aria-label="Toggle theme"
              >
                {dark ? <Sun size={12} /> : <Moon size={12} />}
              </button>
            )}

            <button
              onClick={() => {
                if (triggerComingSoon) triggerComingSoon();
                else onBack();
              }}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff6b35] bg-[length:200%_100%] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold text-white shadow-md shadow-[#ff6b35]/25 transition-all duration-500 hover:bg-right hover:scale-[1.03] active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              <span>Get API Key</span>
              <ExternalLink size={10} className="ml-1 opacity-80 hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-border/40 p-6 hidden md:block min-h-[calc(100vh-56px)] sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto">
          <div className="space-y-6">
            {DOCS_NAV.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <h4 className="px-2 text-[9.5px] font-black uppercase tracking-wider text-muted-foreground/70">
                  {group.category}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-all ${
                        activeTab === item.id
                          ? 'bg-[#ff6b35]/10 text-[#ff6b35] font-bold border border-[#ff6b35]/20'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Main Article Column */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-12 max-w-4xl min-h-[calc(100vh-56px)]">
          {/* Mobile Documentation Navigation Pills */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-border/40">
            {DOCS_NAV.flatMap((g) => g.items).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-[10.5px] font-semibold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#ff6b35] text-white shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] sm:text-[11px] text-muted-foreground mb-4">
            <span className="hover:text-foreground cursor-pointer" onClick={onBack}>Docs</span>
            <ChevronRight size={11} />
            <span className="hover:text-foreground cursor-pointer">Getting Started</span>
            <ChevronRight size={11} />
            <span className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-none">
              {DOCS_NAV.flatMap((g) => g.items).find((i) => i.id === activeTab)?.title || 'Quickstart'}
            </span>
          </div>

          {/* Title Header */}
          <div className="border-b border-border/40 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {DOCS_NAV.flatMap((g) => g.items).find((i) => i.id === activeTab)?.title || 'Documentation'}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {activeTab === 'zeroclaw' && 'Self-hosted Rust AI agent runtime operating under Keyless Tier 1 custody for secure Solana Pay QR settlements and SOP approval checkpoints.'}
              {activeTab === 'solana-pay' && 'Real-time Solana Devnet RPC transaction verification, preset merchant invoices, and global USD/IDR currency conversion.'}
              {activeTab === 'sop-checkpoints' && 'Human-in-the-loop audit checkpoints protecting AI agent financial execution against prompt injection and unauthorized refund requests.'}
              {activeTab === 'quickstart' && 'Learn how to integrate the ZEGA AI client and leverage 9Router dynamic model selection for optimal latency and enterprise cost savings.'}
              {activeTab === 'architecture' && 'Understand the 5-layer architecture powering autonomous swarms, sandbox environments, and real-time LLM orchestration.'}
              {activeTab === 'installation' && 'Set up the ZEGA AI SDK in TypeScript, Python, or raw cURL HTTP calls for your production backend.'}
              {activeTab === '9router' && 'Dynamic latency & cost-based AI model routing with zero-downtime automatic fallback across OpenAI, Anthropic, and Google AI.'}
              {activeTab === 'guardrails' && '5-layer security guardrail system ensuring PII redaction, prompt injection defense, and schema validation.'}
              {activeTab === 'orchestrator' && 'Manage multi-agent swarms, sandbox task execution, and automated workflow triggers.'}
              {activeTab === 'pii' && 'Automated real-time PII scrubbing, hashing, and audit logging to ensure strict HIPAA, GDPR, and SOC2 compliance.'}
              {activeTab === 'auth' && 'Hardened authentication flow combining Cloudflare Turnstile bot defense, Brevo SMTP OTP delivery, and Supabase RLS policies.'}
              {activeTab === 'deployment' && 'Production deployment instructions for hosting the Vite web application on Vercel and the Fastify API on Render Cloud.'}
              {activeTab === 'sla' && 'Enterprise SLAs guaranteeing 99.9% uptime, global CDN distribution, and dedicated priority routing queues.'}
            </p>
          </div>

          {/* GitBook Callout Alert Box */}
          <div className="my-6 flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-[12px] leading-relaxed text-foreground">
            <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-blue-500 block mb-0.5">Enterprise Recommendation</strong>
              {activeTab === 'zeroclaw' || activeTab === 'solana-pay' || activeTab === 'sop-checkpoints' ? (
                <span>ZeroClaw operates on <code className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px] text-blue-400">Keyless Tier 1 Custody</code>. All Devnet signatures are 100% verifiable via Solana Explorer.</span>
              ) : activeTab === 'deployment' ? (
                <span>For Vercel deployment, configure <code className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px] text-blue-400">VITE_API_URL</code> pointing to your Render backend API service.</span>
              ) : activeTab === 'auth' ? (
                <span>Ensure <code className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px] text-blue-400">CLOUDFLARE_TURNSTILE_SECRET_KEY</code> is configured in backend environment variables.</span>
              ) : (
                <span>For high-throughput production workloads, ensure your API Key has <code className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px] text-blue-400">9router-v2</code> permissions enabled in your ZEGA console.</span>
              )}
            </div>
          </div>

          {/* ZeroClaw Specific Interactive Article Renderers */}
          {activeTab === 'zeroclaw' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🦀 ZeroClaw Agent Node Overview
                </h2>
                <p>
                  <strong>ZeroClaw</strong> is a self-hosted, ultra-lightweight Rust AI agent runtime built to handle Solana Pay QR invoicing, real-time RPC signature verification, and human-in-the-loop SOP approval checkpoints.
                </p>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Key Principles Implemented</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Keyless Tier 1 Custody:</strong> Zero private keys stored server-side. Transactions are signed directly by user wallets (Phantom / Solflare).</li>
                    <li><strong>Fastify REST API Endpoints:</strong> Live endpoints for telemetry (<code className="font-mono">/v1/zeroclaw/status</code>), Devnet RPC (<code className="font-mono">/v1/zeroclaw/solana-rpc</code>), events (<code className="font-mono">/v1/zeroclaw/events</code>), and approvals (<code className="font-mono">/v1/zeroclaw/approve-checkpoint</code>).</li>
                    <li><strong>Supabase PostgreSQL RLS:</strong> Table <code className="font-mono">zeroclaw_solana_settlements</code> and <code className="font-mono">zeroclaw_sop_checkpoints</code> with automated Realtime publication.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">ZeroClaw REST API Endpoint Reference</h3>
                <div className="rounded-xl border border-border/80 overflow-hidden font-mono text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold">
                      <tr>
                        <th className="p-3">Endpoint</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Functionality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      <tr>
                        <td className="p-3 font-bold text-emerald-500">/v1/zeroclaw/status</td>
                        <td className="p-3 text-slate-400">GET</td>
                        <td className="p-3 font-sans">Get agent node health status, custody tier, and active messaging channels.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-emerald-500">/v1/zeroclaw/solana-rpc</td>
                        <td className="p-3 text-slate-400">GET</td>
                        <td className="p-3 font-sans">Fetch live slot and confirmed transaction signatures directly from Solana Devnet RPC.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-emerald-500">/v1/zeroclaw/events</td>
                        <td className="p-3 text-slate-400">POST</td>
                        <td className="p-3 font-sans">Generate reference keys and register reconciled Solana Pay invoices into Supabase.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-emerald-500">/v1/zeroclaw/approve-checkpoint</td>
                        <td className="p-3 text-slate-400">POST</td>
                        <td className="p-3 font-sans">Submit human admin approval decision for security-flagged prompt injection checkpoints.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'solana-pay' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  ⚡ Solana Pay QR & Devnet RPC Reconciliation
                </h2>
                <p>
                  ZeroClaw integrates standardized <strong>Solana Pay Transfer Request Scheme</strong> (<code className="font-mono">solana:recipient?amount=...&reference=...</code>) enabling instant mobile QR checkout for UMKM merchants and individual creators.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Merchant Quick Presets</h4>
                    <p className="text-[11px] text-slate-500">Includes <em>Pay for Product (15 USDC)</em>, <em>Kasir Settlement</em>, <em>Agent Micro-Pay (0.05 USDC)</em>, and <em>Swarm Escrow (250 USDC)</em>.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Dual Currency Mode (USD/IDR)</h4>
                    <p className="text-[11px] text-slate-500">Fixed exchange rate <strong>1 USD = Rp 18.000 IDR</strong> applied dynamically across metrics, charts, and stream rows.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Devnet RPC Signature Pool</h3>
                <p>
                  All generated transactions link directly to active, verifiable Solana Devnet RPC signatures (<code className="font-mono">Slot 480013691+</code>). Users can click <strong>Solana Explorer</strong> on any row to verify transaction status live on-chain without encounter 'Not Found' errors.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'sop-checkpoints' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🛡️ Human-in-the-Loop SOP Approval Checkpoints
                </h2>
                <p>
                  ZeroClaw enforces Standard Operating Procedure (SOP) guardrails to shield autonomous financial operations from <strong>prompt injection attacks</strong>.
                </p>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <h3 className="font-bold text-amber-600 dark:text-amber-400 text-sm">Security Workflow</h3>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>WhatsApp/Telegram chat user requests a high-value financial refund or wallet drain.</li>
                    <li>ZeroClaw AI prompt guard flags suspicious injection patterns and creates a pending record in <code className="font-mono">zeroclaw_sop_checkpoints</code>.</li>
                    <li>Financial execution is frozen until an authorized human admin reviews the checkpoint and clicks <strong>Approve</strong> or <strong>Reject</strong> in ZeroClaw Terminal.</li>
                  </ol>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'enterprise-zeroclaw' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🏢 Enterprise Swarm Escrow & Custom Policy Guardrails
                </h2>
                <p>
                  For large-scale corporate deployments, ZeroClaw provides multi-agent task orchestration, spending caps, and automated enterprise ERP integration.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Multi-Agent Swarm Escrow</h3>
                    <p className="text-[11.5px] text-muted-foreground">
                      Deploys autonomous task delegation between primary AI coordinators and sub-task executors with funds safely locked in Solana Pay escrow reference contracts until sub-task completion.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Policy Configuration (config.toml)</h3>
                    <p className="text-[11.5px] text-muted-foreground">
                      Enforces hard spending limits per transaction (<code className="font-mono">max_usdc_per_tx = 500</code>), allowed token mints (USDC, SOL), and custom injection regex rules.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Enterprise ERP & Webhook Streaming</h3>
                <p>
                  Connect ZeroClaw real-time events directly to SAP, Salesforce, or internal corporate accounting tools via HTTP Webhooks and Supabase Realtime WebSocket listeners.
                </p>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto">
                  <pre>
{`// Enterprise Webhook Listener Example
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

supabase
  .channel('enterprise_settlements')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'zeroclaw_solana_settlements' }, (payload) => {
    console.log('Real-time Enterprise Solana Settlement:', payload.new);
    // Forward to ERP System (SAP / Salesforce)
  })
  .subscribe();`}
                  </pre>
                </div>
              </section>
            </div>
          )}

          {/* Step 1: Installation */}
          <section className="space-y-4 my-8">
            <h2 className="text-xl font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#ff6b35]/15 text-[#ff6b35] text-xs font-black">1</span>
              Install the Client Library
            </h2>
            <p className="text-xs text-muted-foreground">
              Select your package manager to install the official ZEGA AI SDK & CLI tools:
            </p>

            {/* Package Manager Selector Tabs */}
            <div className="rounded-xl border border-border/80 bg-slate-950 dark:bg-slate-950 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(['npm', 'pnpm', 'yarn', 'bun', 'curl'] as const).map((pm) => (
                    <button
                      key={pm}
                      onClick={() => setPkgManager(pm)}
                      className={`rounded-md px-3 py-1 text-[10.5px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        pkgManager === pm
                          ? 'bg-[#ff6b35] text-white shadow-xs'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const cmd =
                      pkgManager === 'npm' ? 'npm install @zega/sdk' :
                      pkgManager === 'pnpm' ? 'pnpm add @zega/sdk' :
                      pkgManager === 'yarn' ? 'yarn add @zega/sdk' :
                      pkgManager === 'bun' ? 'bun add @zega/sdk' :
                      'curl -fsSL https://get.zegaai.site/install.sh | sh';
                    copyCode(cmd);
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4 font-mono text-[11.5px] text-slate-200 flex items-center gap-3">
                <span className="text-[#ff6b35] font-bold">$</span>
                <code>
                  {pkgManager === 'npm' && 'npm install @zega/sdk'}
                  {pkgManager === 'pnpm' && 'pnpm add @zega/sdk'}
                  {pkgManager === 'yarn' && 'yarn add @zega/sdk'}
                  {pkgManager === 'bun' && 'bun add @zega/sdk'}
                  {pkgManager === 'curl' && 'curl -fsSL https://get.zegaai.site/install.sh | sh'}
                </code>
              </div>
            </div>
          </section>

          {/* Step 2: Code Execution with Tabs */}
          <section className="space-y-4 my-10">
            <h2 className="text-xl font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#ff6b35]/15 text-[#ff6b35] text-xs font-black">2</span>
              Initialize & Run Orchestrator
            </h2>

            {/* Code Language Switcher Tabs */}
            <div className="rounded-2xl border border-border/80 bg-slate-950 dark:bg-slate-950 shadow-md overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2">
                <div className="flex gap-2">
                  {(['typescript', 'python', 'curl'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={`rounded-md px-3 py-1 text-[10.5px] font-bold capitalize transition-all ${
                        codeLang === lang
                          ? 'bg-[#ff6b35] text-white shadow-xs'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => copyCode(CODE_EXAMPLES[codeLang])}
                  className="flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-[10px] text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="p-4 font-mono text-[11.5px] text-slate-100 overflow-x-auto leading-relaxed">
                <pre>
                  <code>{CODE_EXAMPLES[codeLang]}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* API Parameter Table */}
          <section className="my-10 space-y-4">
            <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif]">
              Orchestrate Parameters Reference
            </h3>

            <div className="rounded-xl border border-border/70 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-[11.5px]">
                <thead className="bg-muted/50 border-b border-border/60 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Parameter</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Required</th>
                    <th className="px-4 py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#ff6b35]">task</td>
                    <td className="px-4 py-3 text-muted-foreground">string</td>
                    <td className="px-4 py-3 text-emerald-500 font-bold">Yes</td>
                    <td className="px-4 py-3 font-sans text-muted-foreground">Natural language prompt or structured task objective.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#ff6b35]">routing.strategy</td>
                    <td className="px-4 py-3 text-muted-foreground">string</td>
                    <td className="px-4 py-3 text-muted-foreground">No</td>
                    <td className="px-4 py-3 font-sans text-muted-foreground">Either <code className="rounded bg-muted px-1">cost-optimized</code> or <code className="rounded bg-muted px-1">latency-first</code>.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#ff6b35]">modelFallback</td>
                    <td className="px-4 py-3 text-muted-foreground">Array&lt;string&gt;</td>
                    <td className="px-4 py-3 text-muted-foreground">No</td>
                    <td className="px-4 py-3 font-sans text-muted-foreground">Ordered list of backup LLMs in case primary provider reaches quota.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Next / Previous Pagination Cards */}
          <div className="mt-12 pt-6 border-t border-border/40 grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('installation')}
              className="flex flex-col items-start p-4 rounded-xl border border-border/70 bg-card hover:border-[#ff6b35]/50 transition-all text-left group"
            >
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 group-hover:text-[#ff6b35]">
                <ArrowLeft size={10} /> Previous
              </span>
              <span className="text-xs font-bold text-foreground mt-1">SDK & API Installation</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className="flex flex-col items-end p-4 rounded-xl border border-border/70 bg-card hover:border-[#ff6b35]/50 transition-all text-right group"
            >
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 group-hover:text-[#ff6b35]">
                Next <ArrowRight size={10} />
              </span>
              <span className="text-xs font-bold text-foreground mt-1">9Router Engine Architecture</span>
            </button>
          </div>
        </main>

        {/* Right "On This Page" Table of Contents Sidebar */}
        <aside className="w-56 flex-shrink-0 p-6 hidden lg:block min-h-[calc(100vh-56px)] sticky top-[56px] h-[calc(100vh-56px)] border-l border-border/30">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              On this page
            </h4>
            <nav className="space-y-2 text-[11px] text-muted-foreground font-medium">
              <a href="#quickstart" className="block text-[#ff6b35] font-bold">1. Quickstart Overview</a>
              <a href="#installation" className="block hover:text-foreground transition-colors pl-2">Client Installation</a>
              <a href="#execution" className="block hover:text-foreground transition-colors pl-2">Initialize SDK</a>
              <a href="#parameters" className="block hover:text-foreground transition-colors pl-2">Parameter Reference</a>
            </nav>

            <div className="pt-6 border-t border-border/40 space-y-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-[10.5px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github size={12} />
                <span>Edit page on GitHub</span>
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-[10.5px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle size={12} />
                <span>Ask AI Assistant</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
