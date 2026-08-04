import React, { useState } from 'react';
import { getR2CdnUrl } from './utils/cdn';
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
  Menu,
  X,
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
      { id: 'privy-wallet', title: 'Privy Keyless Embedded Wallet' },
      { id: 'zeroclaw', title: 'ZeroClaw Rust Agent Node' },
      { id: 'zeroclaw-realtime-monitor', title: 'Real-Time Signature Monitor & OWASP Anti-Hacking' },
      { id: 'zeroclaw-sop', title: 'Directory SOP Engine & Checkpoints' },
      { id: 'zeroclaw-mcp', title: 'MCP Proxy (Helius & SendAI)' },
      { id: 'zeroclaw-memory', title: 'Relationship Memory CRM Graph' },
      { id: 'solana-blinks', title: 'Solana Actions & Blinks' },
      { id: 'defi-guardian', title: 'DeFi Guardian (Jupiter & Switchboard)' },
      { id: 'webhook-hmac', title: 'HMAC-SHA256 Webhook Verification' },
      { id: 'solana-pay', title: 'Solana Pay QR & Devnet RPC' },
      { id: 'solana-rpc-manager', title: 'Solana RPC Pool & Circuit Breaker' },
      { id: 'strict-privy-checkout', title: '100% Strict Privy Auth & Solana Pay Checkout' },
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
  typescript: `import { ZegaClient, ZeroClawAgent } from '@zega/sdk';

// Initialize ZEGA ZeroClaw Solana Pay Agent
const agent = new ZeroClawAgent({
  network: 'solana-devnet',
  merchantAddress: 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK', // Valid Base58 Pubkey
  usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
});

// Generate 100% Locked Amount Solana Pay Invoice (QRIS POS Style)
const invoice = await agent.createSolanaPayInvoice({
  amountUsdc: 15.00,
  label: 'ZEGA Coffee Store',
  message: 'Invoice #9012 - Cafe Latte x2',
});

console.log('Scannable QR URL:', invoice.solanaPayUrl);
// output: solana:DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK?amount=15.00&spl-token=4zMMC...

// Listen for Real-Time On-Chain Settlement (<2s auto-reconciliation)
invoice.onReconciled((settlement) => {
  console.log('🎉 PAYMENT CONFIRMED ON-CHAIN!', settlement.signature);
  // Triggers POS Cashier Success Pop-Up automatically
});`,

  python: `from zega import ZeroClawAgent

# Initialize ZeroClaw Solana Agent
agent = ZeroClawAgent(
    network="solana-devnet",
    merchant_address="DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK"
)

# Create Solana Pay Invoice with locked amount
invoice = agent.create_invoice(
    amount_usdc=15.00,
    message="Table 3 - Espresso x2"
)

print(f"QRIS Solana Pay URL: {invoice.solana_pay_url}")`,

  curl: `curl -X POST https://zegaai.site/v1/zeroclaw/agent/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Order 2 Kopi Espresso (15.00 USDC)",
    "preferredModel": "auto",
    "merchantContext": {
      "usdcAddress": "DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK"
    }
  }'`,
};


export const DocsPage: React.FC<DocsPageProps> = ({ onBack, dark, setDark, triggerComingSoon }) => {
  const [activeTab, setActiveTab] = useState('quickstart');
  const [codeLang, setCodeLang] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [pkgManager, setPkgManager] = useState<'npm' | 'pnpm' | 'yarn' | 'bun' | 'curl'>('npm');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBackToMain = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'docs.zegaai.site' || window.location.hostname.startsWith('docs.'))) {
      window.location.href = 'https://zegaai.site';
    } else {
      onBack();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter navigation items by search query
  const filteredNav = DOCS_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif] text-foreground antialiased selection:bg-[#ff6b35]/20 selection:text-[#ff6b35]">
      {/* Enterprise Dedicated Documentation Header (Stripe / Vercel Standard) */}
      <header className="sticky top-0 z-50 h-[58px] border-b border-border/50 bg-background/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-3 sm:px-8">
          {/* Left: Branding & Navigation Back Link */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden grid size-8 place-items-center rounded-lg border border-border/80 bg-card/80 text-foreground transition-all hover:bg-muted cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {/* Seamless Back to Main Site Button on LEFT */}
            <button
              onClick={handleBackToMain}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/80 px-2.5 py-1 text-[11px] font-semibold text-foreground/90 transition-all hover:bg-muted/80 hover:border-[#ff6b35]/40 hover:text-[#ff6b35] shadow-2xs group cursor-pointer whitespace-nowrap"
              title="Return to ZEGA AI Main Site"
            >
              <ArrowLeft size={13} className="text-muted-foreground group-hover:-translate-x-0.5 group-hover:text-[#ff6b35] transition-transform flex-shrink-0" />
              <span className="hidden sm:inline">Main Site</span>
              <span className="sm:hidden text-[10px]">Back</span>
            </button>

            <div className="h-3.5 w-px bg-border/60" />

            <button
              onClick={handleBackToMain}
              className="flex items-center gap-1.5 group focus:outline-none cursor-pointer"
              title="ZEGA AI Home"
            >
              <img
                src="https://cdn.zegaai.site/assets/logo/zegalogo.png"
                alt="ZEGA AI"
                width={120}
                height={34}
                className="h-5.5 sm:h-7.5 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] transition-[filter,opacity] duration-300 group-hover:opacity-85"
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
              href="https://github.com/siabang35/zega.ai"
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
                else handleBackToMain();
              }}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff6b35] bg-[length:200%_100%] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-bold text-white shadow-md shadow-[#ff6b35]/25 transition-all duration-500 hover:bg-right hover:scale-[1.03] active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              <span>Get API Key</span>
              <ExternalLink size={10} className="ml-1 opacity-80 hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Glassmorphic Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-background/95 backdrop-blur-2xl flex flex-col pt-[58px] animate-in fade-in duration-200">
          <div className="p-4 border-b border-border/50">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#ff6b35]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {(searchQuery ? filteredNav : DOCS_NAV).map((group) => (
              <div key={group.category} className="space-y-2">
                <h4 className="px-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                  {group.category}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        activeTab === item.id
                          ? 'bg-[#ff6b35]/15 text-[#ff6b35] font-bold border border-[#ff6b35]/30'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <span>{item.title}</span>
                      {activeTab === item.id && <Check size={14} className="text-[#ff6b35]" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
          {/* Mobile Documentation Navigation Bar (<768px) */}
          <div className="md:hidden flex items-center justify-between gap-2 pb-3 mb-4 border-b border-border/40">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex-1 flex items-center justify-between rounded-xl border border-border/80 bg-card/80 px-3 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted/80 transition-all cursor-pointer truncate"
            >
              <div className="flex items-center gap-2 truncate">
                <BookOpen size={14} className="text-[#ff6b35] flex-shrink-0" />
                <span className="truncate">{DOCS_NAV.flatMap((g) => g.items).find((i) => i.id === activeTab)?.title || 'Quickstart'}</span>
              </div>
              <ChevronDown size={14} className="text-muted-foreground flex-shrink-0 ml-2" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#ff6b35]/30 bg-[#ff6b35]/10 px-3 py-2 text-[11px] font-bold text-[#ff6b35] hover:bg-[#ff6b35]/20 transition-all cursor-pointer flex-shrink-0"
            >
              <Menu size={14} />
              <span>Menu</span>
            </button>
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
              {activeTab === 'privy-wallet' && 'Non-custodial, keyless Solana wallet management powered by Privy SDK and 1-to-1 deterministic email binding for authenticated users.'}
              {activeTab === 'zeroclaw' && 'Self-hosted Rust AI agent runtime operating under Keyless Tier 1 custody for secure Solana Pay QR settlements and SOP approval checkpoints.'}
              {activeTab === 'zeroclaw-sop' && 'Directory-structured SOP engine with cron scheduling, channel triggers, and human-in-the-loop approval checkpoints.'}
              {activeTab === 'zeroclaw-mcp' && 'Model Context Protocol (MCP) proxy integration for Helius DAS RPC tool calls and SendAI Solana execution capabilities.'}
              {activeTab === 'zeroclaw-memory' && 'Knowledge graph CRM tracking customer interactions, order history, patterns, and merchant operational decisions.'}
              {activeTab === 'solana-blinks' && 'Solana Actions GET preview card renderer & POST transaction builder with shareable dial.to Blink link generation.'}
              {activeTab === 'defi-guardian' && 'Real-time token price checks via Jupiter Price V2 API & Switchboard Crossbar with threshold alerts and portfolio tracking.'}
              {activeTab === 'webhook-hmac' && 'Inbound webhook channel signature verification using HMAC-SHA256 headers for secure agent messaging ingress.'}
              {activeTab === 'solana-pay' && 'Real-time Solana Devnet RPC transaction verification, preset merchant invoices, and global USD/IDR currency conversion.'}
              {activeTab === 'solana-rpc-manager' && 'Production multi-provider RPC failover pool (Alchemy + Helius + Solana Devnet) with exponential circuit breaker cooldowns, token bucket rate limiting, request deduplication, and OWASP security guards.'}
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
              {activeTab === 'privy-wallet' ? (
                <span>Privy provides <code className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[11px] text-blue-400">Non-Custodial Keyless Embedded Wallets</code>. Every email address deterministically derives exactly 1 private Solana wallet address.</span>
              ) : activeTab === 'zeroclaw' || activeTab === 'solana-pay' || activeTab === 'sop-checkpoints' ? (
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

          {/* Privy Keyless Solana Embedded Wallet Interactive Article Renderer */}
          {activeTab === 'privy-wallet' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <img
                    src={getR2CdnUrl('/assets/logo/privy-logo.png')}
                    alt="Privy"
                    className="h-5 w-auto object-contain dark:invert"
                  />
                  <span>Privy Keyless Solana Embedded Wallet Architecture</span>
                </h2>
                <p>
                  ZEGA AI pairs ZeroClaw autonomous agent execution with <strong>Privy Embedded Wallet SDK</strong> to provide non-custodial, keyless Solana wallet management for authenticated users (Individual/UMKM & Enterprise).
                </p>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                    <ShieldCheck size={16} />
                    <span>Security & Operational Highlights</span>
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-[11.5px]">
                    <li><strong>1-to-1 Deterministic Binding (1 Email = 1 Wallet):</strong> Each authenticated email address maps to exactly one private Solana keyless wallet address (`PrivySol...`).</li>
                    <li><strong>Zero Server-Side Custody:</strong> Private keys are never hosted on ZEGA backend servers or database records. All signing operations occur client-side via Privy non-custodial key management.</li>
                    <li><strong>Brevo SMTP OTP Passcode Guard:</strong> 6-digit security passcodes are delivered securely via Brevo Email Gateway with Cloudflare Turnstile bot defense.</li>
                    <li><strong>ZeroClaw Solana Pay Settlement Reconciliation:</strong> Backend API route <code className="font-mono text-emerald-500">/v1/zeroclaw/settlement/record</code> automatically stores Privy verification metadata (<code className="font-mono text-emerald-500">privyVerified: true</code>, <code className="font-mono text-emerald-500">privyWalletAddress</code>, <code className="font-mono text-emerald-500">privyUserId</code>).</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Environment Configuration Setup</h3>
                <p>
                  To activate Privy Keyless Embedded Wallets across frontend and backend services:
                </p>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto">
                  <pre>
{`# 1. Frontend Environment Setup (apps/web/.env)
VITE_PRIVY_APP_ID=cm6privy_app_id_placeholder

# 2. Backend Environment Setup (apps/api/.env)
PRIVY_APP_ID=cm6privy_app_id_placeholder
PRIVY_APP_SECRET=sec_privy_app_secret_placeholder`}
                  </pre>
                </div>
              </section>
            </div>
          )}

          {/* ZeroClaw Specific Interactive Article Renderers */}
          {activeTab === 'zeroclaw' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    🦀 ZeroClaw v0.8.3 Agent Node & Gateway Bridge
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10.5px] font-bold flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Gateway v0.8.3 Active (http://127.0.0.1:4242)
                  </span>
                </div>

                <p>
                  <strong>ZeroClaw</strong> is a self-hosted, ultra-lightweight Rust AI agent runtime built to handle Solana Pay QR invoicing, real-time RPC signature verification, and human-in-the-loop SOP approval checkpoints. In ZEGA AI, it connects directly to the local daemon gateway via <strong>Fastify REST API & Webhook Forwarders</strong>.
                </p>

                {/* Gateway Protocol Architecture Cards */}
                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <Zap size={14} className="text-amber-500" />
                      <span>1. Health Ping (/health)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Periodic 1.2s timeout ping to <code className="font-mono text-amber-500">http://127.0.0.1:4242/health</code> ensuring zero-crash fallback if offline.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <Lock size={14} className="text-emerald-500" />
                      <span>2. One-Time Pairing (/pair)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Send <code className="font-mono text-emerald-500">X-Pairing-Code</code> (e.g. <code className="font-mono text-emerald-400">137170</code>) to generate active Bearer tokens persisted in per-browser <code className="font-mono">localStorage</code>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <Terminal size={14} className="text-blue-500" />
                      <span>3. Webhook Forwarding (/webhook)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Terminal prompts execute via <code className="font-mono text-blue-500">POST /webhook</code> with payload <code className="font-mono text-slate-400">{`{"message": prompt}`}</code>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2 mt-4">
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Key Architectural Principles</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Keyless Tier 1 Custody:</strong> Zero private keys stored server-side. Transactions are signed directly by user wallets (Phantom / Solflare).</li>
                    <li><strong>Standalone Bridge Package (<code className="font-mono text-emerald-500">@zega/zeroclaw-bridge</code>):</strong> Fastify routes delegate all daemon communication to <code className="font-mono text-emerald-500">ZeroClawGatewayClient</code> with automatic SemVer version matrix validation (<code className="font-mono text-emerald-400">v0.8.0 - v0.8.x</code>).</li>
                    <li><strong>Cryptographic Reference Key Tracking:</strong> Automatically appends unique reference keys (<code className="font-mono text-emerald-500">&reference=RefXXXXXXX</code>) to Solana Pay URIs for 1-to-1 on-chain transaction matching.</li>
                    <li><strong>Real Devnet RPC Signature Sync:</strong> Continuous Devnet RPC listener (<code className="font-mono text-emerald-500">/v1/zeroclaw/solana-rpc</code>) querying <code className="font-mono text-emerald-400">getSignaturesForAddress</code> and syncing exact confirmed signatures (<code className="font-mono text-emerald-400">2GX6B72w...</code>).</li>
                    <li><strong>Precision Amount Extraction Engine:</strong> Advanced prompt parser stripping table identifiers prior to amount extraction, accurately parsing exact decimal values (<code className="font-mono text-emerald-400">0.543 USDC</code>) without table number multiplication errors.</li>
                    <li><strong>Fastify REST API Endpoints:</strong> Live endpoints for telemetry (<code className="font-mono">/v1/zeroclaw/status</code>), Devnet RPC (<code className="font-mono">/v1/zeroclaw/solana-rpc</code>), events (<code className="font-mono">/v1/zeroclaw/events</code>), and approvals (<code className="font-mono">/v1/zeroclaw/approve-checkpoint</code>).</li>
                    <li><strong>Supabase PostgreSQL RLS:</strong> Table <code className="font-mono">zeroclaw_solana_settlements</code> and <code className="font-mono">zeroclaw_sop_checkpoints</code> with automated Realtime publication.</li>
                  </ul>
                </div>
              </section>

              {/* Public ZeroClaw Gateway v0.8.3 Quick Integration Developer Guide */}
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🚀 Public Developer Setup: How to Run ZeroClaw Daemon</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Follow these step-by-step instructions to install, pair, and connect your own ZeroClaw v0.8.3 daemon to the ZEGA AI ecosystem or any custom Web3 application:
                </p>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto space-y-2">
                  <div className="text-slate-400 font-bold"># Step 1: Install ZeroClaw CLI Toolchain</div>
                  <pre>{`curl -fsSL https://zeroclawlabs.ai/install.sh | bash`}</pre>

                  <div className="text-slate-400 font-bold pt-2"># Step 2: Start ZeroClaw Gateway Daemon on Port 4242</div>
                  <pre>{`zeroclaw gateway --port 4242 --network solana-devnet`}</pre>

                  <div className="text-slate-400 font-bold pt-2"># Step 3: Verify Native Health Ping Response</div>
                  <pre>{`curl -s http://127.0.0.1:4242/health`}</pre>

                  <div className="text-slate-400 font-bold pt-2"># Step 4: Execute Authenticated Webhook Prompt</div>
                  <pre>{`curl -s -X POST http://127.0.0.1:4242/webhook \\
  -H "Authorization: Bearer <YOUR_SESSION_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Generate 15 USDC Solana Pay QR for Cafe Latte"}'`}</pre>
                </div>
              </section>

              {/* cURL Interactive Testing Example Box */}
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live ZEGA Gateway Bridge Verification cURL Snippet</h3>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-200 overflow-x-auto">
                  <pre>
{`# 1. Test ZeroClaw Daemon v0.8.3 Health Check
curl -s http://127.0.0.1:4242/health

# 2. Query ZEGA Fastify API Gateway Status Bridge
curl -s http://localhost:3001/v1/zeroclaw/status

# 3. Pair ZEGA Terminal with One-Time Code
curl -s -X POST http://localhost:3001/v1/zeroclaw/pair \\
  -H "Content-Type: application/json" \\
  -d '{"pairingCode": "137170"}'`}
                  </pre>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">ZeroClaw REST API Endpoint Reference</h3>
                <div className="rounded-xl border border-border/80 overflow-x-auto font-mono text-[11px]">
                  <table className="w-full min-w-[550px] text-left">
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
                        <td className="p-3 font-sans">Get ZeroClaw Gateway v0.8.3 health status (/health), custody tier, and active messaging channels.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-emerald-500">/v1/zeroclaw/pair</td>
                        <td className="p-3 text-slate-400">POST</td>
                        <td className="p-3 font-sans">Pair ZEGA Terminal with ZeroClaw Gateway v0.8.3 via X-Pairing-Code header (e.g. 137170).</td>
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

          {/* Real-Time Signature Monitor & OWASP Anti-Hacking */}
          {activeTab === 'zeroclaw-realtime-monitor' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🛡️ ZeroClaw Real-Time Signature Monitor & OWASP Anti-Hacking Suite
                </h2>
                <p>
                  ZeroClaw integrates an automated, real-time Solana Devnet RPC monitoring service (<code className="font-mono text-emerald-500">ZeroClawSignatureMonitorService</code>) executing forced IPv4 socket resolution (<code className="font-mono text-emerald-400">family: 4</code>) to eliminate IPv6 RPC timeout issues and deliver zero-latency payment reconciliation.
                </p>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">5-Layer OWASP Top 10 Anti-Hacking & Zero-Trust Hardening</h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-[11.5px]">
                    <li><strong>OWASP API3 Base58 Input Sanitization:</strong> All <code className="font-mono text-emerald-400">referenceKey</code>, <code className="font-mono text-emerald-400">merchantPubkey</code>, and <code className="font-mono text-emerald-400">txSignature</code> inputs are strictly regex-validated against Base58 pattern (<code className="font-mono text-emerald-500">/^[1-9A-HJ-NP-Za-km-z]{'{87,88}'}$/</code>). Synthetic or invalid signature strings are rejected immediately at Layer 2.</li>
                    <li><strong>Zero-Amount Transfer Rejection (Layer 5):</strong> Transactions with <code className="font-mono text-emerald-400">0</code> USDC or SOL transfer amount (account initializations, non-payment contract calls) are strictly rejected with HTTP 403 (<code className="font-mono text-emerald-400">ZERO_AMOUNT_CHECK</code>).</li>
                    <li><strong>Merchant & Reference Key Recipient Match (Layer 5):</strong> Deep inspection verifies that the transaction destination account or account list matches the merchant's Privy wallet address or invoice reference key (<code className="font-mono text-emerald-400">RECIPIENT_MATCH_FAIL</code>).</li>
                    <li><strong>OWASP API8 Anti-Replay Guard:</strong> Performs automated database lookup in Supabase <code className="font-mono text-emerald-400">zeroclaw_solana_settlements</code> to prevent reusing a single transaction signature across multiple invoices.</li>
                    <li><strong>High-Concurrency Single-Flight Queue:</strong> Single-flight promise lock (<code className="font-mono text-emerald-500">syncTelegramBotUpdatesSingleFlight</code>) eliminates Telegram HTTP 409 Conflicts, paired with exponential backoff retry dispatcher for rate-limited (<code className="font-mono text-emerald-400">HTTP 429</code>) message delivery.</li>
                  </ul>
                </div>
              </section>
            </div>
          )}

          {/* SOP Engine & Checkpoints */}
          {activeTab === 'zeroclaw-sop' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  📜 ZeroClaw SOP Engine & Human Checkpoints
                </h2>
                <p>
                  ZeroClaw executes deterministic multi-step <strong>Standard Operating Procedures (SOPs)</strong> defined in a directory layout (<code className="font-mono">docs/zeroclaw/sops/&lt;name&gt;/SOP.toml</code> + <code className="font-mono">SOP.md</code>). Each SOP supports cron scheduling, channel triggers, untrusted payload guards, and human approval checkpoints.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">1. payment-reconciliation</h4>
                    <p className="text-[11px] text-muted-foreground">6-step cron+channel SOP polling reference keys and matching on-chain RPC confirmations via Helius DAS.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">2. refund-approval</h4>
                    <p className="text-[11px] text-muted-foreground">5-step SOP screening prompt injection and pausing at <code className="font-mono text-emerald-500">kind: checkpoint</code> human gate.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">3. defi-guardian</h4>
                    <p className="text-[11px] text-muted-foreground">5-step cron SOP querying Jupiter Price V2 & Switchboard Crossbar, triggering channel alerts on price drop.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-card space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">4. balance-alert</h4>
                    <p className="text-[11px] text-muted-foreground">4-step cron SOP checking SOL & USDC balances against minimum merchant threshold limits.</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* MCP Proxy (Helius & SendAI) */}
          {activeTab === 'zeroclaw-mcp' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🔌 Model Context Protocol (MCP) Client Proxy
                </h2>
                <p>
                  ZeroClaw integrates Model Context Protocol (MCP) clients to seamlessly proxy tool calls to external services with strict tool namespacing (<code className="font-mono">server__tool</code>).
                </p>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-200 space-y-2 overflow-x-auto">
                  <div className="text-emerald-400 font-bold"># Active MCP Servers Configured in ZEGA API (/v1/zeroclaw/mcp/servers):</div>
                  <div>- helius (SSE Transport, 12 tools: getAsset, getSignaturesForAddress, getCompressedNftProof...)</div>
                  <div>- sendai-solana (STDIO Transport, 60 tools: getBalance, transfer, simulateTransaction...)</div>
                </div>
              </section>
            </div>
          )}

          {/* Relationship Memory CRM Graph */}
          {activeTab === 'zeroclaw-memory' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🧠 Relationship Memory Knowledge Graph
                </h2>
                <p>
                  ZeroClaw stores structured connections separate from semantic vector memory. It tracks 8 node types (<code className="font-mono">client</code>, <code className="font-mono">contact</code>, <code className="font-mono">pattern</code>...) and 8 edge relations (<code className="font-mono">interacted_with</code>, <code className="font-mono">manages_client</code>...) persisted to Supabase PostgreSQL (<code className="font-mono">zeroclaw_memory_nodes</code>, <code className="font-mono">zeroclaw_memory_edges</code>).
                </p>
              </section>
            </div>
          )}

          {/* Solana Actions & Blinks */}
          {activeTab === 'solana-blinks' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🔗 Solana Actions & Blinks Integration
                </h2>
                <p>
                  ZeroClaw generates native <strong>Solana Actions & Blinks</strong>. Any chat channel (WhatsApp, Telegram) can render shareable <code className="font-mono">https://dial.to/?action=...</code> links, allowing customers to sign transactions directly in Twitter/X or messaging apps.
                </p>
              </section>
            </div>
          )}

          {/* DeFi Guardian */}
          {activeTab === 'defi-guardian' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🛡️ DeFi Financial Guardian (Jupiter & Switchboard)
                </h2>
                <p>
                  Monitors merchant token holdings (SOL/USDC) and price feeds via <strong>Jupiter Price V2 API</strong> and <strong>Switchboard Crossbar</strong>. Triggers alert notifications whenever asset values deviate beyond preset percentages.
                </p>
              </section>
            </div>
          )}

          {/* HMAC-SHA256 Webhook Verification */}
          {activeTab === 'webhook-hmac' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🔐 Webhook Channel HMAC-SHA256 Verification
                </h2>
                <p>
                  Inbound message webhooks (<code className="font-mono">POST /v1/zeroclaw/webhook/inbound</code>) require cryptographic signature validation using <code className="font-mono">X-Webhook-Signature: sha256=&lt;HMAC-SHA256&gt;</code> generated from <code className="font-mono">ZEROCLAW_WEBHOOK_SECRET</code>. Unsigned payloads fail closed with HTTP 401.
                </p>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">4-Tier Client RPC Resolution & 5-Layer Backend Security Pipeline</h3>
                <p>
                  ZeroClaw production architecture combines client-side RPC fallback with a 5-layer backend security pipeline enforcing strict <strong>OWASP API Security Top 10</strong> compliance:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 font-sans">
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                      <Zap size={14} />
                      <span>4-Tier RPC Signature Resolution</span>
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li><strong>Tier 1:</strong> Render API Proxy for merchant wallet.</li>
                      <li><strong>Tier 2:</strong> Render API Proxy for default merchant wallet.</li>
                      <li><strong>Tier 3:</strong> Direct client-side JSON-RPC call to <code className="font-mono text-emerald-400">api.devnet.solana.com</code>.</li>
                      <li><strong>Tier 4:</strong> Verified Devnet hardcoded fallback signature.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                    <h4 className="font-bold text-blue-600 dark:text-blue-400 text-xs flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      <span>5-Layer OWASP Backend Pipeline</span>
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li><strong>Layer 1 (Amount):</strong> Positive number validation.</li>
                      <li><strong>Layer 2 (Base58):</strong> Base58 regex <code className="font-mono text-blue-400">/^[1-9A-HJ-NP-Za-km-z]+$/</code>.</li>
                      <li><strong>Layer 3 (Anti-Replay):</strong> Idempotency set guard.</li>
                      <li><strong>Layer 4 (RPC Status):</strong> On-chain <code className="font-mono text-blue-400">getSignatureStatuses</code>.</li>
                      <li><strong>Layer 5 (Tx Detail):</strong> Recipient wallet delta verification.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Devnet RPC Signature Pool & OWASP Protection</h3>
                <p>
                  All generated transactions link directly to active, verifiable Solana Devnet RPC signatures (<code className="font-mono">Slot 480013691+</code>). Backed by <strong>Rate Limiting (100 req/min Anti-Throttling)</strong> and <strong>1MB Payload Size Limit (Anti-Chunking / Anti-DoS)</strong>.
                </p>
              </section>
            </div>
          )}

          {/* Solana RPC Pool & Circuit Breaker Manager */}
          {activeTab === 'solana-rpc-manager' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  ⚡ Enterprise Solana RPC Pool & Circuit Breaker Architecture
                </h2>
                <p>
                  ZEGA AI eliminates <strong>HTTP 429 Rate Limiting</strong> and retry storms via a centralized, multi-provider failover pool (<code className="font-mono text-emerald-500">SolanaRpcManager</code>). The engine orchestrates requests across <strong>Alchemy Devnet</strong>, <strong>Helius Devnet</strong>, and <strong>Official Solana Devnet</strong>.
                </p>

                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400">Circuit Breaker Cooldown</h4>
                    <p className="text-[11px] text-slate-500">Automatically isolates failing or rate-limited providers into 30s → 60s → 120s exponential cooldowns.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1.5">
                    <h4 className="font-bold text-blue-600 dark:text-blue-400">Request Deduplication</h4>
                    <p className="text-[11px] text-slate-500">Coalesces parallel duplicate calls into a single in-flight Promise, cutting RPC network overhead by up to 90%.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1.5">
                    <h4 className="font-bold text-purple-600 dark:text-purple-400">OWASP Hardened</h4>
                    <p className="text-[11px] text-slate-500">Validates RPC method whitelists and cleans string parameters against zero-width unicode injection vectors.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Status Telemetry API</h3>
                <p>Query real-time provider health scores, active cooldowns, and average latency metrics via Fastify endpoint:</p>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-slate-200 space-y-2 overflow-x-auto">
                  <div className="text-slate-400 font-bold"># Query Live Solana RPC Pool Telemetry</div>
                  <pre>{`curl -s http://localhost:3001/v1/zeroclaw/rpc-pool/status`}</pre>
                </div>
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

          {activeTab === 'strict-privy-checkout' && (
            <div className="space-y-8 my-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  🔒 100% Strict Privy Authentication & Public Checkout Architecture
                </h2>
                <p>
                  ZEGA AI strictly enforces <strong>Privy Embedded Solana Wallet Authentication</strong>. Demo mode bypass options, guest login buttons, and fake preset auto-generations have been completely purged to ensure total data isolation and security compliance.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400">1-to-1 Privy Session Binding</h4>
                    <p className="text-[11px] text-slate-500">Every user session is strictly authenticated via Google, GitHub, or Brevo OTP Passcode, deterministically deriving a single non-custodial Solana wallet address.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1.5">
                    <h4 className="font-bold text-blue-600 dark:text-blue-400">Public Standalone Checkout (/checkout/:id)</h4>
                    <p className="text-[11px] text-slate-500">Public checkout pages run on isolated routes without modal race conditions, supporting native mobile Solflare and Phantom wallet deep-links.</p>
                  </div>
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
              <a
                href="https://github.com/siabang35/zega.ai"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[10.5px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github size={12} />
                <span>Edit page on GitHub</span>
              </a>
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
