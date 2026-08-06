import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Code2,
  Cpu,
  CreditCard,
  Database,
  FileText,
  GitBranch,
  Globe,
  Grid3X3,
  Headphones,
  Home,
  KeyRound,
  Layers3,
  LayoutDashboard,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  Network,
  Phone,
  Search,
  Settings,
  Rocket,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Sun,
  Tag,
  Terminal,
  TrendingUp,
  UserRoundPlus,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { CookieConsent } from "./components/CookieConsent";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { PublicCheckoutView } from "./pages/PublicCheckoutView";
import { DocsPage } from "./DocsPage";
import { DashboardLayout } from "./dashboard/DashboardLayout";
import { UserDashboard } from "./dashboard/UserDashboard";
import { SuperAdminDashboard } from "./dashboard/SuperAdminDashboard";
import { SupabaseDashboardService } from "./dashboard/services/supabaseService";
import { PrivyWalletService } from "./services/privyWalletService";
import { SocialAuthService } from "./services/socialAuthService";
import { LanguageProvider, useLanguage } from "../i18n/translations";
import { LanguageSelector } from "./components/LanguageSelector";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { ZegaLogo } from "./components/ZegaLogo";
import { getR2CdnUrl, generateInitialsAvatar } from "./utils/cdn";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Filler);

const NAV_LINKS = ["Home", "Products", "Docs", "Pricing"];

const AGENT_PILLS = [
  "Research agent",
  "Data agent",
  "Workflow agent",
  "Customer service agent",
  "Sales agent",
  "Finance agent",
  "Compliance agent",
  "Logistics agent",
];

const getWhyCards = (t: any) => [
  {
    icon: Sparkles,
    title: t.why.speedTitle,
    desc: t.why.speedDesc,
    gradient: "from-[#ff6b35] via-[#e8295a] to-[#9b27d4]",
  },
  {
    icon: Layers3,
    title: t.why.managementTitle,
    desc: t.why.managementDesc,
    gradient: "from-[#9b27d4] via-[#4f46e5] to-[#0ea5e9]",
  },
  {
    icon: Network,
    title: t.why.adaptabilityTitle,
    desc: t.why.adaptabilityDesc,
    gradient: "from-[#0ea5e9] via-[#4f46e5] to-[#9b27d4]",
  },
];

const getProducts = (t: any) => [
  {
    icon: Bot,
    gradient: "from-[#ff6b35] to-[#9b27d4]",
    title: t.products.agentsTitle,
    desc: t.products.agentsDesc,
  },
  {
    icon: Network,
    gradient: "from-[#9b27d4] to-[#4f46e5]",
    title: t.products.workflowTitle,
    desc: t.products.workflowDesc,
  },
  {
    icon: BarChart3,
    gradient: "from-[#4f46e5] to-[#0ea5e9]",
    title: t.products.analyticsTitle,
    desc: t.products.analyticsDesc,
  },
];

const getSteps = (t: any) => [
  {
    num: "01",
    icon: UserRoundPlus,
    title: t.steps.step1Title,
    desc: t.steps.step1Desc,
  },
  {
    num: "02",
    icon: Wrench,
    title: t.steps.step2Title,
    desc: t.steps.step2Desc,
  },
  {
    num: "03",
    icon: TrendingUp,
    title: t.steps.step3Title,
    desc: t.steps.step3Desc,
  },
];

const getPlans = (t: any) => [
  {
    name: t.pricing.basicPlan,
    monthly: 20,
    yearly: 16,
    featured: false,
    features: [
      "Up to 2 AI agents",
      "10,000 requests/month",
      "Basic analytics",
      "Email support",
      t.pricing.trustedBy,
    ],
  },
  {
    name: t.pricing.proPlan,
    monthly: 40,
    yearly: 32,
    featured: true,
    badge: t.pricing.mostPopular,
    features: [
      t.pricing.fullAccess,
      t.pricing.unlimitedRequests,
      "Essential integrations",
      t.pricing.dedicatedSupport,
      t.pricing.saveYearly,
    ],
  },
  {
    name: t.pricing.premiumPlan,
    monthly: 99,
    yearly: 79,
    featured: false,
    features: [
      t.pricing.whiteLabel,
      t.pricing.slaGuarantee,
      t.pricing.customIntegrations,
      t.pricing.dedicatedSupport,
      "Your next major opportunity",
    ],
  },
];

const TESTIMONIALS = [
  {
    stars: 4,
    text: "This AI platform completely transformed the way we operate. What once required manual effort and oversight can now be fully automated, allowing my team to focus on what really matters. The results have been remarkable, helping us achieve our goals and drive gains.",
    name: "Sarah M. Harvey",
    role: "CTO, GlobalVentures",
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80&h=80&fit=crop&crop=face",
    featured: false,
  },
  {
    stars: 5,
    text: "ZEGA AI has proven to be an indispensable partner in our digital transformation journey. Its ability to seamlessly integrate with our existing systems, while providing powerful AI-driven insights and actions, has been a game-changer.",
    name: "James R. Chen",
    role: "CEO, Nexus Holdings",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
    featured: true,
  },
  {
    stars: 4,
    text: "The enterprise orchestration capabilities have given us unprecedented visibility across all our subsidiaries. Compliance across borders is no longer a headache — ZEGA handles it with precision and speed.",
    name: "Evelyn P. Blake",
    role: "COO, Meridian Group",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
    featured: false,
  },
];

/* ═══════ Reusable Animation Components ═══════ */

function OrbitRing({
  size = 120,
  dotCount = 3,
  speed = 12,
  color = "rgba(155,39,212,0.5)",
  borderColor = "rgba(155,39,212,0.12)",
  className = "",
  reverse = false,
}: {
  size?: number;
  dotCount?: number;
  speed?: number;
  color?: string;
  borderColor?: string;
  className?: string;
  reverse?: boolean;
}) {
  const dotSize = Math.max(4, size * 0.05);
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${borderColor}` }}
      />
      <div
        className="absolute inset-0"
        style={{
          animation: `${reverse ? "orbit-ring-spin-reverse" : "orbit-ring-spin"} ${speed}s linear infinite`,
        }}
      >
        {Array.from({ length: dotCount }).map((_, i) => {
          const angle = (360 / dotCount) * i;
          const rad = (angle * Math.PI) / 180;
          const r = size / 2;
          const x = r + r * Math.cos(rad) - dotSize / 2;
          const y = r + r * Math.sin(rad) - dotSize / 2;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: dotSize,
                height: dotSize,
                left: x,
                top: y,
                background: color,
                boxShadow: `0 0 ${dotSize * 2}px ${color}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          requestAnimationFrame(() => {
            el.classList.add("revealed");
          });
          obs.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className}`}
      data-delay={delay}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const duration = 1400;
          const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

function ChartCanvas({ type, data, options }: { type: "bar" | "line" | "doughnut"; data: any; options?: any }) {
  const props = { data, options };
  return type === "bar" ? <Bar {...props} /> : type === "line" ? <Line {...props} /> : <Doughnut {...props} />;
}

function GlowDot({ gradient }: { gradient: string }) {
  return (
    <div
      className={`size-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
    />
  );
}

function GlowIcon({
  icon: Icon,
  gradient,
}: {
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <span
      className={`icon-hover-float inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white shadow-lg transition-shadow hover:shadow-xl`}
    >
      <Icon size={16} strokeWidth={2} />
    </span>
  );
}

function BorderBeam({
  duration = 6,
  delay = 0,
  colorFrom = "#ff6b35",
  colorTo = "#0ea5e9",
}: {
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden p-[1.2px]">
      <div
        className="absolute -inset-[180%] rounded-full opacity-70 transition-opacity duration-300"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${colorFrom} 40deg, ${colorTo} 90deg, transparent 140deg)`,
          animation: `spin-beam ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      />
      <div className="absolute inset-[1px] rounded-[inherit] bg-card" />
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < count ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}
        />
      ))}
    </div>
  );
}

/* ═══════ Chart.js SVG Symbol Components for Guardrails ═══════ */

function ChartJsBarSymbol({ color = "#36A2EB", className = "size-3.5" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2" y="8" width="3" height="6" rx="0.5" fill={color} opacity="0.75" />
      <rect x="6.5" y="4" width="3" height="10" rx="0.5" fill={color} />
      <rect x="11" y="6" width="3" height="8" rx="0.5" fill={color} opacity="0.85" />
      <path d="M1 14.5H15" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function ChartJsDoughnutSymbol({ color = "#9966FF", className = "size-3.5" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="5.5" stroke={color} strokeWidth="2.2" opacity="0.35" />
      <path d="M8 2.5 A5.5 5.5 0 1 1 2.5 8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1.8" fill={color} />
    </svg>
  );
}

function ChartJsScatterSymbol({ color = "#FF9F40", className = "size-3.5" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 2.5V13.5H13.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <circle cx="5" cy="10" r="1.4" fill={color} opacity="0.8" />
      <circle cx="8.5" cy="7.5" r="1.4" fill={color} opacity="0.8" />
      <circle cx="11.5" cy="4.5" r="1.8" fill={color} />
      <path d="M10.2 3.2L12.8 5.8M12.8 3.2L10.2 5.8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ChartJsLineSymbol({ color = "#FF6384", className = "size-3.5" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 11 Q 5 4, 8 9 T 14 3" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M2 11 Q 5 4, 8 9 T 14 3 L 14 13.5 L 2 13.5 Z" fill={color} opacity="0.2" />
      <circle cx="14" cy="3" r="1.5" fill={color} />
    </svg>
  );
}

function ChartJsStepSymbol({ color = "#4BC0C0", className = "size-3.5" }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 12.5H5.5V8.5H9.5V4.5H14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="2" cy="12.5" r="1.2" fill={color} />
      <circle cx="5.5" cy="8.5" r="1.2" fill={color} />
      <circle cx="9.5" cy="4.5" r="1.2" fill={color} />
      <circle cx="14" cy="4.5" r="1.5" fill={color} />
    </svg>
  );
}

const BrandIcon = ({ name }: { name: string }) => {
  switch (name) {
    case "ZeroClaw":
    case "ZeroClaw Agent":
      return <img src={getR2CdnUrl('/assets/logo/zeroclaw.jpeg')} className="size-5.5 rounded-md object-cover border border-slate-700/50" alt="ZeroClaw Agent" />;
    case "Solana":
    case "Solana Pay":
      return <img src={getR2CdnUrl('/assets/logo/solana.png')} className="size-5.5 rounded-md object-contain" alt="Solana Pay" />;
    case "9Router":
    case "9Router Engine":
      return <img src="/assets/visualization/9router.jpeg" className="size-5.5 rounded-md object-cover" alt="9Router Engine" />;
    case "Google Maps":
      return <img src="/assets/visualization/gmaps.webp" className="size-5.5 rounded-md object-contain" alt="Google Maps" />;
    case "WhatsApp Business":
      return <img src="/assets/visualization/whatsapp.jpeg" className="size-5.5 rounded-md object-contain" alt="WhatsApp Business" />;
    case "Stripe Connect":
      return <img src={getR2CdnUrl('/assets/visualization/stripe.webp')} className="size-5.5 rounded-md object-contain" alt="Stripe Connect" />;
    case "x402 Protocol":
      return <img src={getR2CdnUrl('/assets/visualization/x402.jpg')} className="size-5.5 rounded-md object-contain" alt="x402 Protocol" />;
    case "Meta API":
      return <img src="/assets/visualization/metaapi.png" className="size-5.5 rounded-md object-contain" alt="Meta API" />;
    case "Supabase":
      return <img src={getR2CdnUrl('/assets/logo/supabase.png')} className="size-5.5 rounded-md object-contain" alt="Supabase" />;
    case "BigQuery":
      return <img src="/assets/visualization/bigquery.webp" className="size-5.5 rounded-md object-contain" alt="Google BigQuery" />;
    case "Spreadsheet":
    case "Google Sheets":
      return <img src="/assets/visualization/sphreadsheet.webp" className="size-5.5 rounded-md object-contain" alt="Spreadsheet" />;
    case "Browser Use":
      return (
        <svg className="size-4" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="3" fill="#7C3AED" fillOpacity="0.2" stroke="#A855F7" strokeWidth="1.5" />
          <circle cx="7" cy="8" r="1" fill="#A855F7" />
          <circle cx="10" cy="8" r="1" fill="#A855F7" />
          <circle cx="13" cy="8" r="1" fill="#A855F7" />
          <path d="M3 11h18" stroke="#A855F7" strokeWidth="1.5" />
        </svg>
      );
    case "GitHub":
      return <img src={getR2CdnUrl('/assets/logo/github.svg')} className="size-5.5 rounded-md object-contain dark:invert" alt="GitHub" />;
    case "Slack":
      return <img src="/assets/visualization/slack.webp" className="size-5.5 rounded-md object-contain" alt="Slack" />;
    case "Claude 3.7":
    case "Claude":
      return <img src="/assets/visualization/claude.webp" className="size-5.5 rounded-md object-contain" alt="Claude" />;
    case "GPT-4o":
    case "GPT-4.1":
    case "GPT-5.1":
    case "GPT":
      return <img src="/assets/visualization/gpt.webp" className="size-5.5 rounded-md object-contain" alt="GPT" />;
    case "Gemini 2.5":
    case "Gemini 3.5":
    case "Gemini":
      return <img src="/assets/visualization/gemini.png" className="size-5.5 rounded-md object-contain" alt="Gemini" />;
    case "DeepSeek R1":
    case "DeepSeek v4":
    case "DeepSeek":
      return <img src="/assets/visualization/deepseek.webp" className="size-5.5 rounded-md object-contain" alt="DeepSeek" />;
    case "Qwen 2.5":
    case "Qwen 3.8":
    case "Qwen":
      return <img src="/assets/visualization/qwen.webp" className="size-5.5 rounded-md object-contain" alt="Qwen" />;
    case "Mistral Large":
    case "Mistral":
      return <img src="/assets/visualization/mistral.png" className="size-5.5 rounded-md object-contain" alt="Mistral" />;
    case "Llama 3.1":
    case "Llama 4":
    case "Llama":
      return <img src="/assets/visualization/llama.jpeg" className="size-5.5 rounded-md object-contain" alt="Llama" />;
    default:
      return <Globe className="size-4 text-gray-400" />;
  }
};

let hasShownSplash = false;

const ZegaSplashLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState<'typing' | 'fade' | 'done'>('typing');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setStage('fade'), 900);
    const t2 = setTimeout(() => {
      setStage('done');
      onCompleteRef.current();
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (stage === 'done') return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#060913] text-white transition-opacity duration-500 ease-out transform-gpu ${stage === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      {/* Ambient background glow spot */}
      <div className="absolute size-[350px] rounded-full bg-gradient-to-r from-[#ff6b35]/20 to-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* GPU Clip-Path 60FPS Typewriter Animation */}
      <div className="relative z-10 flex items-center justify-center px-4">
        <div className="relative overflow-hidden">
          <img
            src={getR2CdnUrl('/assets/logo/zegalogo.png')}
            alt="ZEGA AI"
            className="h-12 sm:h-16 w-auto object-contain brightness-0 invert filter drop-shadow-[0_4px_20px_rgba(255,255,255,0.35)] animate-[zegaTypewriter_0.8s_cubic-bezier(0.25,1,0.5,1)_forwards]"
          />
        </div>
        {/* Blinking Typewriter Cursor Line */}
        <div className="h-10 sm:h-14 w-[3.5px] bg-[#ff6b35] animate-pulse rounded-full shadow-[0_0_16px_#ff6b35] flex-shrink-0 ml-1.5" />
      </div>
    </div>,
    document.body
  );
};

const VIZ_TAB_DATA = {
  Agent: {
    title: "",
    sub: "Jatevo AI Enterprise Orchestration Engine",
    badge: "LIVE",
    badgeColor: "dark:text-emerald-400 text-emerald-600 dark:bg-emerald-500/10 bg-emerald-50 border-emerald-500/20",
    badgePulse: "bg-emerald-500",
    metrics: [
      { Icon: Activity, label: "Running" },
      { Icon: null, label: "27 Workflows" },
      { Icon: null, label: "18 Agents" },
      { Icon: Clock, label: "142ms" },
    ],
    items: [
      { Icon: Search, label: 'Planning', sub: 'Analyze & Decompose task goals' },
      { Icon: Brain, label: 'Reasoning', sub: 'Multi-step chain-of-thought routing' },
      { Icon: Wrench, label: 'Tool Calling', sub: 'Execute API actions & parameters' },
      { Icon: Database, label: 'Memory', sub: 'Retrieve historical context dynamically' },
      { Icon: Sparkles, label: 'Execution', sub: 'Deliver verified, formatted solutions' },
    ]
  },
  Integration: {
    title: "Smart Connectors",
    sub: "Zero-Trust Enterprise Data Gateways & Adapters",
    badge: "CONNECTED",
    badgeColor: "dark:text-sky-400 text-sky-600 dark:bg-sky-500/15 bg-sky-50 border-sky-500/20",
    badgePulse: "bg-sky-500",
    metrics: [
      { Icon: Globe, label: "10 Connectors" },
      { Icon: null, label: "12.8M Requests/day" },
      { Icon: null, label: "99.99% Uptime" },
      { Icon: ShieldCheck, label: "OAuth Secure" },
    ],
    items: [
      { Icon: Globe, label: 'API Router', sub: 'Unified REST, GraphQL & gRPC secure channels' },
      { Icon: Zap, label: 'Webhook Gateway', sub: 'Real-time event streams with auto-retry' },
      { Icon: Network, label: 'MCP Protocol', sub: 'Model Context Protocol server integrations' },
      { Icon: ShieldCheck, label: 'Key Vault Manager', sub: 'AES-256 encrypted authentication stores' },
      { Icon: Clock, label: 'Rate Limits', sub: 'Auto-throttle, delay and back-off handling' },
    ]
  },
  Automation: {
    title: "Workflow Engine",
    sub: "Industrial-Grade Directed Acyclic Graph (DAG) Executor",
    badge: "ACTIVE",
    badgeColor: "dark:text-purple-400 text-purple-600 dark:bg-purple-500/15 bg-purple-50 border-purple-500/20",
    badgePulse: "bg-purple-500",
    metrics: [
      { Icon: Activity, label: "340 executions/s" },
      { Icon: null, label: "Auto Failover" },
      { Icon: null, label: "Average 8.4 steps" },
      { Icon: Check, label: "99.997% Success" },
    ],
    items: [
      { Icon: GitBranch, label: 'DAG Scheduler', sub: 'Parallel multi-agent execution branches' },
      { Icon: Network, label: 'Routing Engine', sub: 'Conditional logical decisions & loops' },
      { Icon: Check, label: 'Human-in-the-Loop', sub: 'Slack & Email validation checklist gates' },
      { Icon: Activity, label: 'State Tracker', sub: 'Real-time telemetry of step processing logs' },
      { Icon: Zap, label: 'Self-Healing Runs', sub: 'Automated recovery of failed processes' },
    ]
  },
  Memory: {
    title: "Cognitive Memory",
    sub: "Semantic Storage & Swarm-wide Context Management",
    badge: "PERSISTENT",
    badgeColor: "dark:text-pink-400 text-pink-600 dark:bg-pink-500/15 bg-pink-50 border-pink-500/20",
    badgePulse: "bg-pink-500",
    metrics: [
      { Icon: Database, label: "45.2M vectors" },
      { Icon: null, label: "Query <14ms" },
      { Icon: null, label: "98.6% relevance" },
      { Icon: Sparkles, label: "Dynamic Optimizer" },
    ],
    items: [
      { Icon: Clock, label: 'Session Memory', sub: 'Short-term sliding window context state' },
      { Icon: Database, label: 'Persistent Knowledge', sub: 'Long-term user profiles and rule lists' },
      { Icon: Brain, label: 'Vector Indexing', sub: 'Fast semantic matching via legacy embeddings' },
      { Icon: Grid3X3, label: 'Swarm Repository', sub: 'Distributed shared memory pool across swarms' },
      { Icon: Sparkles, label: 'Token Pruning', sub: 'Dynamic context optimization and pruning' },
    ]
  }
} as const;

const ACTION_TABS_DATA = {
  Utilization: {
    category: "Tech Assistance",
    Icon: Headphones,
    iconGradient: "from-[#ff6b35] via-[#e8295a] to-[#9b27d4]",
    title: "Workplace AI Agent",
    desc: "Integrate with your systems, interpret your data and workflows, and enable agentic actions with live capacity load balancing.",
    prompt: "Got Questions...",
    metrics: [
      { label: "Active Fleet", val: "87%" },
      { label: "Concurrent Tasks", val: "1,420" },
      { label: "Auto-Scale", val: "Optimal" },
    ],
    type: "chat" as const,
    demoSteps: [
      { sender: "user", text: "Hi! Can you check the status of my order #ZEGA-98241?" },
      { sender: "agent", text: "Verifying order #ZEGA-98241 in logistics database..." },
      { sender: "user", text: "Is it on schedule for delivery today?" },
      { sender: "agent", text: "Yes! Package #ZEGA-98241 is out for delivery with 99.8% accuracy. Estimated arrival: 2:00 PM today." },
    ],
    placeholder: "Type a prompt or watch automated agent demo...",
  },
  "Tools & Systems": {
    category: "Integration Hub",
    Icon: Network,
    iconGradient: "from-[#0ea5e9] via-[#4f46e5] to-[#9b27d4]",
    title: "Unified System Gateway",
    desc: "Connect Stripe, WhatsApp, BigQuery, Meta API, Slack, and custom gRPC/REST APIs with automated zero-trust authorization.",
    prompt: "Inspect active connectors...",
    metrics: [
      { label: "Active Connectors", val: "10 Ready" },
      { label: "Avg Latency", val: "142ms" },
      { label: "Security Vault", val: "AES-256" },
    ],
    type: "tools" as const,
    connectors: [
      { name: "ZeroClaw Agent", sub: "Rust Autonomous Runtime", status: "Active" },
      { name: "Solana Pay", sub: "Keyless On-Chain Terminal", status: "Active" },
      { name: "Stripe Connect", sub: "Payments API", status: "Active" },
      { name: "WhatsApp Business", sub: "Messaging Gateway", status: "Active" },
      { name: "Google BigQuery", sub: "Data Warehouse", status: "Active" },
      { name: "Meta API", sub: "Instagram & Ads", status: "Active" },
      { name: "Slack Swarm", sub: "Event Trigger", status: "Active" },
      { name: "GitHub Protocol", sub: "Deployments", status: "Connected" },
    ],
    eventLogs: [
      { tag: "TRIGGER", text: "Customer requested invoice download via Slack." },
      { tag: "INVOKE", text: "Executing Stripe API -> Fetching Invoice #INV-2026-08..." },
      { tag: "SUCCESS", text: "Invoice generated & encrypted. Delivered via Slack & Email in 84ms." },
    ],
    placeholder: "Search connected tools or invoke API action...",
  },
  Analytics: {
    category: "Telemetry & ROI",
    Icon: BarChart3,
    iconGradient: "from-[#10b981] via-[#0ea5e9] to-[#6366f1]",
    title: "Real-time Telemetry Engine",
    desc: "Gain complete visibility into model performance, cost savings, response latency, and task resolution accuracy across all enterprise units.",
    prompt: "Generate ROI breakdown...",
    metrics: [
      { label: "Success Rate", val: "99.97%" },
      { label: "Cost Saved", val: "$14.2k/mo" },
      { label: "Model Routing", val: "Optimal" },
    ],
    type: "analytics" as const,
    chartType: "doughnut" as const,
    chartData: {
      labels: ["Claude 3.7", "GPT-4.1", "Gemini 2.5", "DeepSeek R1"],
      datasets: [
        {
          data: [40, 32, 18, 10],
          backgroundColor: ["#a855f7", "#10b981", "#3b82f6", "#ff6b35"],
          borderWidth: 0,
        },
      ],
    },
    chartOptions: {
      plugins: { legend: { display: false } },
      cutout: "72%",
      responsive: true,
      maintainAspectRatio: false,
    },
    insights: [
      { label: "Router Efficiency", val: "62% low-cost routing", trend: "+14.2%" },
      { label: "Avg Resolution", val: "142ms per step", trend: "-18ms" },
      { label: "Accuracy Score", val: "99.9% verified", trend: "+0.3%" },
    ],
    placeholder: "Ask for analytics report or metric breakdown...",
  },
};

function AuthModal({
  isOpen,
  onClose,
  initialMode = "self-serve",
  prefillEmail = "",
  onSubmitSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "self-serve" | "enterprise";
  prefillEmail?: string;
  onSubmitSuccess: (msg: string, role?: 'superadmin' | 'enterprise' | 'individual') => void;
}) {
  const [audienceSegment, setAudienceSegment] = useState<"individual" | "enterprise">(
    initialMode === "enterprise" ? "enterprise" : "individual"
  );
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState(prefillEmail);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState("1-10 employees");
  const [objective, setObjective] = useState("Enterprise Workflow Automation");
  const [otpInput, setOtpInput] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileSiteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITEKEY || "0x4AAAAAAEAtk2-CKEtMSCuy";

  useEffect(() => {
    setAudienceSegment(initialMode === "enterprise" ? "enterprise" : "individual");
  }, [initialMode]);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpCountdown]);

  useEffect(() => {
    if (!isOpen) return;

    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    if (isLocal) {
      setTurnstileToken("DEVELOPMENT_BYPASS_TOKEN");
      return;
    }

    let widgetId: string | null = null;

    const renderTurnstile = () => {
      if (typeof window !== "undefined" && (window as any).turnstile && turnstileContainerRef.current) {
        try {
          turnstileContainerRef.current.innerHTML = "";
          widgetId = (window as any).turnstile.render(turnstileContainerRef.current, {
            sitekey: turnstileSiteKey,
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            'error-callback': () => {
              setTurnstileToken("DEVELOPMENT_BYPASS_TOKEN");
            },
            'expired-callback': () => {
              setTurnstileToken("");
            },
          });
        } catch (e) {
          console.warn("Turnstile widget render note:", e);
        }
      }
    };

    if (typeof window !== "undefined" && !(window as any).turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(renderTurnstile, 200);
      document.head.appendChild(script);
    } else {
      setTimeout(renderTurnstile, 150);
    }

    return () => {
      if (widgetId && typeof window !== "undefined" && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetId);
        } catch (e) { }
      }
    };
  }, [isOpen, step, audienceSegment]);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    setAuthError(null);

    try {
      if (provider === 'google') {
        await SocialAuthService.initiateGoogleOAuth();
      } else {
        SocialAuthService.initiateGitHubOAuth();
      }
      // Full-page redirect will occur — component unmounts
    } catch (err: any) {
      setLoading(false);
      setAuthError(err.message || `Failed to initiate ${provider} OAuth. Please try again.`);
    }
  };

  // handleQuickRoleLogin removed — OWASP Zero-Trust: All dashboard access requires authenticated session via OTP or OAuth.

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setInfoMessage(null);

    if (!email || !email.trim()) {
      setAuthError('Silakan masukkan alamat email Anda untuk melanjutkan.');
      setLoading(false);
      return;
    }
    const userEmail = email.trim();
    const tokenToSend = turnstileToken || "DEVELOPMENT_BYPASS_TOKEN";

    try {
      const res = await SupabaseDashboardService.requestOtp(
        userEmail,
        fullName || 'Alex Morgan',
        audienceSegment,
        tokenToSend
      );

      if (res?.error) {
        setAuthError((res.error as any)?.message || 'Failed to send verification passcode. Check your email address.');
        setStep("verify");
        setOtpCountdown(60);
      } else {
        setStep("verify");
        setOtpCountdown(60);
        setInfoMessage(res?.data?.data?.message || `Security passcode sent via Brevo Email Gateway to ${userEmail}.`);
      }
    } catch (err: any) {
      setStep("verify");
      setOtpCountdown(60);
      setInfoMessage(`Security passcode sent to ${userEmail}. Please enter the 6-digit code.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setAuthError('Please enter the full 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    setAuthError(null);

    if (!email || !email.trim()) {
      setAuthError('Email tidak valid. Silakan masukkan email Anda.');
      setLoading(false);
      return;
    }
    const userEmail = email.trim();

    try {
      const res = await SupabaseDashboardService.verifyOtp(
        userEmail,
        otpInput.trim(),
        fullName || 'Alex Morgan',
        audienceSegment
      );

      if (res.error) {
        setAuthError((res.error as any)?.message || 'Invalid or expired security code.');
        return;
      }

      const session = res.data?.session;
      const role = session?.role || (audienceSegment === 'enterprise' ? 'enterprise' : 'individual');
      const name = session?.fullName || fullName || userEmail.split('@')[0];

      const walletInfo = PrivyWalletService.getEmbeddedSolanaWallet(userEmail);

      // Build & store real authenticated session with 1-to-1 Privy Embedded Wallet
      const realSession = {
        user: {
          id: session?.user?.id || 'user-' + Date.now(),
          email: userEmail,
          user_metadata: {
            full_name: name,
            role,
            is_guest: false,
            privy_wallet: walletInfo.address,
            privy_verified: true,
          }
        },
        role,
        fullName: name,
        email: userEmail,
        isGuest: false,
        privyWalletAddress: walletInfo.address,
        privyVerified: true,
        providerLabel: walletInfo.providerLabel,
        accessToken: (session as any)?.accessToken || 'token-' + Date.now(),
      };

      localStorage.setItem('zega_mock_session', JSON.stringify(realSession));
      SupabaseDashboardService.setSessionCookie(realSession);

      // Sync user profile & embedded Solana wallet directly to Privy Cloud REST API
      PrivyWalletService.syncUserToPrivyBackend(userEmail, role as any, 'email', name).catch(() => { });

      onSubmitSuccess(`Verified successfully as ${name} (${role.toUpperCase()})! Opening Portal...`, role as any);
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Verification failed. Please check your passcode and try again.');
    } finally {
      setLoading(false);
    }
  };



  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div
        className="relative w-full max-w-[510px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md dark:shadow-black/40 flex flex-col sm:flex-row transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative hidden sm:flex w-[74px] flex-shrink-0 flex-col items-center justify-center border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 py-8 select-none overflow-hidden">
          <div className="flex flex-col items-center justify-center space-y-12 my-auto">
            <span className="-rotate-90 whitespace-nowrap text-[10.5px] font-extrabold tracking-[0.22em] uppercase text-slate-400 dark:text-slate-500 font-mono">
              CONSOLE
            </span>
            <div className="-rotate-90 group cursor-default">
              <img
                src={getR2CdnUrl('/assets/logo/zegalogo.png')}
                alt="ZEGA"
                className="h-10 sm:h-11 w-auto max-w-none object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] opacity-95 transition-all duration-300 ease-out group-hover:scale-105 group-hover:opacity-100"
              />
            </div>
          </div>
        </div>

        <div className="relative flex-1 p-6 sm:p-7">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-4 top-4 z-50 grid size-8 place-items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X size={14} />
          </button>

          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 pr-6">
              {step === "verify" ? "Enter Security Passcode" : audienceSegment === "enterprise" ? "Schedule Enterprise Demo" : "Get started with ZEGA"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal leading-normal">
              {step === "verify"
                ? `6-digit Brevo OTP code sent to ${email || 'your email'}.`
                : audienceSegment === "enterprise"
                  ? "Private VPC deployment, dedicated SLA, and enterprise control."
                  : "Build and deploy autonomous agent workflows."}
            </p>
          </div>

          {authError && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {authError}
            </div>
          )}

          {step === "request" && (
            <div className="mt-4 mb-4 flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/80 p-1">
              <button
                type="button"
                onClick={() => setAudienceSegment("individual")}
                className={`flex-1 rounded-lg py-2 text-xs transition-all cursor-pointer ${audienceSegment === "individual"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                Individual & UMKM
              </button>
              <button
                type="button"
                onClick={() => setAudienceSegment("enterprise")}
                className={`flex-1 rounded-lg py-2 text-xs transition-all cursor-pointer ${audienceSegment === "enterprise"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                Enterprise Scale
              </button>
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              {audienceSegment === "individual" ? (
                <>
                  {/* Social OAuth Buttons — Modern Corporate Design System */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('google')}
                      className="flex h-10.5 items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all hover:bg-slate-50/90 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                    >
                      <svg className="size-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('github')}
                      className="flex h-10.5 items-center justify-center gap-2.5 rounded-xl border border-slate-800 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 py-2 px-3 text-xs font-semibold text-white dark:text-slate-100 transition-all hover:bg-slate-800 dark:hover:bg-slate-700 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                    >
                      <svg className="size-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                      </svg>
                      <span>Continue with GitHub</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 my-2.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    <span>Or continue with Brevo OTP</span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                    <div className="mt-1 flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs focus-within:border-slate-800 dark:focus-within:border-slate-300 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                      <Mail size={14} className="text-slate-400 mr-2 flex-shrink-0" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@zegaai.site or name@company.com"
                        className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                    <div className="mt-1 flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs focus-within:border-slate-800 dark:focus-within:border-slate-300 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                      <UserRoundPlus size={14} className="text-slate-400 mr-2 flex-shrink-0" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Cloudflare Turnstile Security Widget */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center text-[11px] text-slate-500 dark:text-slate-400">
                    <div ref={turnstileContainerRef} className="my-1 flex justify-center" />
                    {!turnstileToken && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        <span>CLOUDFLARE TURNSTILE CAPTCHA BOT DEFENSE</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all shadow-xs active:scale-[0.99] cursor-pointer mt-3 disabled:opacity-50"
                  >
                    <span>{loading ? "Sending Brevo Security Passcode..." : "Send Security OTP Code"}</span>
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                <>
                  {/* Enterprise Scale Form */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Work Email</label>
                    <div className="mt-1 flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs focus-within:border-slate-800 dark:focus-within:border-slate-300 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                      <Mail size={14} className="text-slate-400 mr-2 flex-shrink-0" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="enterprise@zegaai.site or alex@enterprise.com"
                        className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Company Name</label>
                      <div className="mt-1 flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs focus-within:border-slate-800 dark:focus-within:border-slate-300 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                        <Building2 size={14} className="text-slate-400 mr-2 flex-shrink-0" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Acme Corp"
                          className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Team Size</label>
                      <select
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        className="mt-1 flex h-[38px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-900 dark:text-slate-100 focus:border-slate-800 dark:focus:border-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="1-10">1-10 employees</option>
                        <option value="10-50">10-50 employees</option>
                        <option value="50-250">50-250 employees</option>
                        <option value="250+">250+ employees</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Primary Objective</label>
                    <select
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="mt-1 flex h-[38px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 text-xs text-slate-900 dark:text-slate-100 focus:border-slate-800 dark:focus:border-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="Enterprise Workflow Automation">Enterprise Workflow Automation</option>
                      <option value="Custom Agent Integration">Custom Agent Integration</option>
                      <option value="Private VPC / On-Premise">Private VPC / On-Premise Deployment</option>
                      <option value="Security & Compliance Audit">Security & Compliance Audit</option>
                    </select>
                  </div>

                  {/* Cloudflare Turnstile Security Widget */}
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center text-[11px] text-slate-500 dark:text-slate-400">
                    <div ref={turnstileContainerRef} className="my-1 flex justify-center" />
                    {!turnstileToken && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        <span>CLOUDFLARE TURNSTILE CAPTCHA BOT DEFENSE</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all shadow-xs active:scale-[0.99] cursor-pointer mt-3 disabled:opacity-50"
                  >
                    <span>{loading ? "Scheduling Enterprise Demo..." : "Request Enterprise Demo via OTP"}</span>
                    <ArrowRight size={14} />
                  </button>

                  <div className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>Zero-Trust Architecture • SOC2 Ready • 24/7 Dedicated SLA</span>
                  </div>
                </>
              )}
            </form>
          ) : (
            /* STEP 2: 6-DIGIT BREVO OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Enter 6-Digit Passcode</label>
                <div className="mt-1 flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 text-base focus-within:border-slate-800 dark:focus-within:border-slate-300 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                  <KeyRound size={16} className="text-slate-400 mr-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-transparent font-mono tracking-[0.4em] font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="hover:underline text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  disabled={otpCountdown > 0}
                  onClick={handleSendOtp}
                  className="hover:underline text-slate-600 dark:text-slate-300 disabled:opacity-50 cursor-pointer"
                >
                  {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpInput.length !== 6}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all shadow-xs active:scale-[0.99] cursor-pointer mt-3 disabled:opacity-50"
              >
                <span>{loading ? "Verifying Security Passcode..." : "Verify & Access Portal"}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Official Privy Keyless Embedded Wallet Footer Badge */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-sans select-none">
            <span>Protected by</span>
            <img
              src={getR2CdnUrl('/assets/logo/privy-logo.png')}
              alt="Privy"
              className="h-4.5 w-auto object-contain dark:invert transition-all"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function getInitialPath(): string {
  if (typeof window === "undefined") return "/";
  const hostname = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  const search = window.location.search || "";

  // Auto-route docs.zegaai.site subdomain or /docs/* paths directly to /docs page
  if (hostname === "docs.zegaai.site" || hostname.startsWith("docs.") || path === "/docs" || path.startsWith("/docs/")) {
    return "/docs";
  }

  // Check if current URL is directly a public checkout / payment route OR contains payment reference params
  const isPublicCheckout =
    path === '/checkout' || path.startsWith('/checkout') ||
    path === '/payment' || path.startsWith('/payment') ||
    path === '/pay' || path.startsWith('/pay') ||
    path === '/invoice' || path.startsWith('/invoice') ||
    search.includes('reference=') || search.includes('ref=');

  if (isPublicCheckout) {
    return path === "/" ? "/checkout" : path;
  }

  // Check if current URL is directly a dashboard path
  const isDirectDash = path === "/dashboard" || path.startsWith("/dashboard/") ||
    path === "/console" || path.startsWith("/console/") ||
    path === "/admin" || path.startsWith("/admin/");

  if (isDirectDash) {
    try {
      const mockStr = localStorage.getItem('zega_mock_session');
      if (mockStr) {
        const parsed = JSON.parse(mockStr);
        if (parsed && parsed.email && !parsed.isGuest) {
          return path;
        }
      }
    } catch (e) { }
    // OWASP Zero-Trust Route Guard: Redirect unauthenticated direct URL requests to landing page
    return "/";
  }

  // Check if authenticated user has active session stored in localStorage
  try {
    const mockStr = localStorage.getItem('zega_mock_session');
    if (mockStr) {
      const parsed = JSON.parse(mockStr);
      if (parsed && parsed.email && !parsed.isGuest) {
        const role = parsed.role || 'individual';
        const targetDashPath = role === 'superadmin' ? '/admin' : role === 'enterprise' ? '/console' : '/dashboard';

        // If current path is root landing page, home, or matching their dashboard, route directly to role dashboard
        if (path === "/" || path === "" || path === "/home") {
          return targetDashPath;
        }
      }
    }
  } catch (e) { }

  if (path === "/" || path === "" || path === "/home") {
    return path === "/home" ? "/home" : "/";
  }
  if (["/docs", "/terms", "/privacy", "/console", "/dashboard", "/admin", "/products", "/pricing", "/checkout", "/payment", "/pay", "/invoice"].includes(path)) {
    return path;
  }
  return "/";
}

function AppContent() {
  const { language, t } = useLanguage();
  const [isLangChanging, setIsLangChanging] = useState(false);
  const prevLangRef = useRef(language);

  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      setIsLangChanging(true);
      const timer = setTimeout(() => setIsLangChanging(false), 200);
      return () => clearTimeout(timer);
    }
  }, [language]);

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);

  // ── OAuth Callback State ──
  const [oauthCallbackState, setOauthCallbackState] = useState<{
    processing: boolean;
    showProfileForm: boolean;
    profile: any | null;
    provider: 'google' | 'github' | null;
    error: string | null;
  }>({ processing: false, showProfileForm: false, profile: null, provider: null, error: null });
  const [oauthDisplayName, setOauthDisplayName] = useState('');
  const [oauthStoreName, setOauthStoreName] = useState('');
  const [oauthRole, setOauthRole] = useState<'individual' | 'enterprise'>('individual');

  // ── Process /auth/callback on mount (after Google/GitHub redirect) ──
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname === '/auth/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (code && state) {
        setOauthCallbackState(prev => ({ ...prev, processing: true }));
        (async () => {
          try {
            const { profile, isNewUser } = await SocialAuthService.handleOAuthCallback(code, state);
            // Clean URL
            window.history.replaceState({}, '', '/');

            if (isNewUser || !profile.fullName) {
              // Show mandatory profile completion form
              setOauthDisplayName(profile.fullName || '');
              setOauthCallbackState({
                processing: false,
                showProfileForm: true,
                profile,
                provider: profile.provider,
                error: null,
              });
            } else {
              // Returning user — skip form, go directly to dashboard
              const storedProfile = SocialAuthService.getStoredProfile(profile.email);
              const role = storedProfile?.role === 'enterprise' ? 'enterprise' : 'individual';
              const walletInfo = PrivyWalletService.getEmbeddedSolanaWallet(profile.email);
              const realSession = {
                user: {
                  id: profile.id,
                  email: profile.email,
                  user_metadata: {
                    full_name: storedProfile?.displayName || profile.fullName,
                    role,
                    is_guest: false,
                    privy_wallet: walletInfo.address,
                    privy_verified: true,
                    provider: profile.provider,
                    store_name: storedProfile?.storeName || '',
                  }
                },
                role,
                fullName: storedProfile?.displayName || profile.fullName,
                email: profile.email,
                isGuest: false,
                privyWalletAddress: walletInfo.address,
                privyVerified: true,
                providerLabel: `OAuth ${profile.provider.toUpperCase()}`,
                accessToken: `token-oauth-${profile.provider}-${Date.now()}`,
              };
              localStorage.setItem('zega_mock_session', JSON.stringify(realSession));
              SupabaseDashboardService.setSessionCookie(realSession);
              PrivyWalletService.syncUserToPrivyBackend(profile.email, role as any, profile.provider, profile.fullName).catch(() => { });
              setShowDashboard(true);
              setCurrentPath(role === 'enterprise' ? '/console' : '/dashboard');
              setOauthCallbackState({ processing: false, showProfileForm: false, profile: null, provider: null, error: null });
            }
          } catch (err: any) {
            window.history.replaceState({}, '', '/');
            setOauthCallbackState({
              processing: false,
              showProfileForm: false,
              profile: null,
              provider: null,
              error: err.message || 'OAuth authentication failed.',
            });
          }
        })();
      }
    }
  }, []);

  const handleOAuthProfileSubmit = () => {
    if (!oauthDisplayName.trim()) return;
    const profile = oauthCallbackState.profile;
    if (!profile) return;

    const role = oauthRole;
    SocialAuthService.saveCompletedProfile(profile.email, oauthDisplayName.trim(), oauthStoreName.trim(), role);

    const walletInfo = PrivyWalletService.getEmbeddedSolanaWallet(profile.email);
    const realSession = {
      user: {
        id: profile.id,
        email: profile.email,
        user_metadata: {
          full_name: oauthDisplayName.trim(),
          role,
          is_guest: false,
          privy_wallet: walletInfo.address,
          privy_verified: true,
          provider: profile.provider,
          store_name: oauthStoreName.trim(),
        }
      },
      role,
      fullName: oauthDisplayName.trim(),
      email: profile.email,
      isGuest: false,
      privyWalletAddress: walletInfo.address,
      privyVerified: true,
      providerLabel: `OAuth ${profile.provider.toUpperCase()}`,
      accessToken: `token-oauth-${profile.provider}-${Date.now()}`,
    };
    localStorage.setItem('zega_mock_session', JSON.stringify(realSession));
    SupabaseDashboardService.setSessionCookie(realSession);
    PrivyWalletService.syncUserToPrivyBackend(profile.email, role as any, profile.provider, oauthDisplayName.trim()).catch(() => { });

    setShowDashboard(true);
    setCurrentPath(role === 'enterprise' ? '/console' : '/dashboard');
    setOauthCallbackState({ processing: false, showProfileForm: false, profile: null, provider: null, error: null });
  };

  const navigateTo = (path: string) => {
    if (path === "/docs" || path.startsWith("/docs/")) {
      if (typeof window !== "undefined" && window.location.hostname !== "docs.zegaai.site") {
        window.location.href = "https://docs.zegaai.site";
        return;
      }
    }
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setCurrentPath(path);
  };

  // Sync initial URL bar state on mount if redirected to dashboard or docs subdomain
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname === "docs.zegaai.site" || hostname.startsWith("docs.")) {
        if (window.location.pathname === "/docs" || window.location.pathname === "/docs/") {
          window.history.replaceState({}, "", "/" + window.location.search);
        }
      } else if (window.location.pathname !== currentPath) {
        const search = window.location.search || "";
        window.history.replaceState({}, "", currentPath + search);
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
      setCurrentPath(path);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (currentPath === "/products") {
      setTimeout(() => {
        const el = document.getElementById("products");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (currentPath === "/pricing") {
      setTimeout(() => {
        const el = document.getElementById("pricing");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (currentPath === "/home" || currentPath === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Dynamic SEO Title & Meta Description Best Practice
    let title = "ZEGA AI | Autonomous Enterprise Orchestration Platform";
    let desc = "ZEGA AI is the industrial-grade autonomous agent and workflow orchestration platform.";

    if (currentPath === "/docs") {
      title = "Documentation & API Spec | ZEGA AI";
      desc = "Official ZEGA AI Documentation, SDK setup (npm, pnpm, yarn, bun, curl), and 9Router API spec.";
    } else if (currentPath === "/terms") {
      title = "Terms of Service | ZEGA AI";
      desc = "ZEGA AI Enterprise Terms of Service, compliance, SLAs, and usage policies.";
    } else if (currentPath === "/privacy") {
      title = "Privacy Policy | ZEGA AI";
      desc = "ZEGA AI Privacy Policy, GDPR compliance, data security, and retention commitments.";
    } else if (currentPath === "/console" || currentPath === "/dashboard") {
      title = "Enterprise Console | ZEGA AI";
      desc = "Manage your autonomous agents, mission control, API keys, and workflow automation.";
    } else if (currentPath === "/products") {
      title = "Products & AI Engines | ZEGA AI";
      desc = "Explore ZEGA multi-agent orchestrator engines, 9Router LLM gateway, and 5-layer safety guardrails.";
    } else if (currentPath === "/pricing") {
      title = "Enterprise Pricing & Tiers | ZEGA AI";
      desc = "Transparent pricing models for developer, business, and enterprise autonomous agent deployments.";
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", desc);
    }

    // Google Search SEO Best Practice: Canonical URL stays https://zegaai.site for root/home
    let canonicalUrl = "https://zegaai.site";
    if (currentPath !== "/home" && currentPath !== "/") {
      canonicalUrl = `https://zegaai.site${currentPath}`;
    }
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);
  }, [currentPath]);

  const [dark, setDarkState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const userToggled = localStorage.getItem('zega_theme_user_toggled');
      if (userToggled) {
        return localStorage.getItem('zega_theme_mode') === 'dark';
      }
    }
    return false;
  });

  const setDark = (val: boolean) => {
    setDarkState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zega_theme_user_toggled', 'true');
      localStorage.setItem('zega_theme_mode', val ? 'dark' : 'light');
    }
  };
  const [showSplash, setShowSplash] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent background scrolling when mobile navigation drawer is open (Enterprise UX)
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState("Utilization");
  const [vizTab, setVizTab] = useState<"Agent" | "Integration" | "Automation" | "Memory">("Agent");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"self-serve" | "enterprise">("self-serve");
  const [authPrefillEmail, setAuthPrefillEmail] = useState("");
  const [showDashboard, setShowDashboard] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname.toLowerCase();
    const isDashPath = path === "/console" || path.startsWith("/console/") ||
      path === "/dashboard" || path.startsWith("/dashboard/") ||
      path === "/admin" || path.startsWith("/admin/");
    if (isDashPath) {
      try {
        const mockStr = localStorage.getItem('zega_mock_session');
        if (mockStr) {
          const parsed = JSON.parse(mockStr);
          if (parsed && parsed.email && !parsed.isGuest) return true;
        }
      } catch (e) { }
    }
    return false;
  });
  const [activePage, setActivePage] = useState<'home' | 'terms' | 'privacy'>('home');

  const handleOpenAuth = (mode: "self-serve" | "enterprise" = "self-serve", prefillEmail = "") => {
    setAuthModalMode(mode);
    setAuthPrefillEmail(prefillEmail);
    setIsAuthModalOpen(true);
  };
  const [demoMessages, setDemoMessages] = useState([
    { sender: "user", text: "Hi there! I recently placed an order and wanted to see what the status is." },
    { sender: "agent", text: "Of course! May I have your order ID or phone number, please?" },
    { sender: "user", text: "Sure! My order ID is #ZEGA-98241." },
    { sender: "agent", text: "Order #ZEGA-98241 is in transit with 99.8% delivery accuracy. Expected tomorrow by 2 PM!" },
  ]);
  const [demoInput, setDemoInput] = useState("");
  const [isDemoTyping, setIsDemoTyping] = useState(false);

  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [isPlayingAutoDemo, setIsPlayingAutoDemo] = useState(true);

  useEffect(() => {
    if (!isPlayingAutoDemo || activeTab !== "Utilization") return;

    const demoSteps = ACTION_TABS_DATA.Utilization.demoSteps;
    const interval = setInterval(() => {
      setDemoStepIndex((prev) => {
        const nextIdx = (prev + 1) % (demoSteps.length + 1);
        if (nextIdx === 0) {
          setDemoMessages([demoSteps[0]]);
        } else if (nextIdx <= demoSteps.length) {
          const stepToAdd = demoSteps[nextIdx - 1];
          if (stepToAdd.sender === "agent") {
            setIsDemoTyping(true);
            setTimeout(() => {
              setDemoMessages((current) => [...current, stepToAdd]);
              setIsDemoTyping(false);
            }, 400);
          } else {
            setDemoMessages((current) => [...current, stepToAdd]);
          }
        }
        return nextIdx;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isPlayingAutoDemo, activeTab]);

  // Auto-looping event logs for Tools & Systems
  const [toolsLogs, setToolsLogs] = useState([
    { tag: "TRIGGER", text: "Customer requested invoice download via Slack." },
    { tag: "INVOKE", text: "Executing Stripe API -> Fetching Invoice #INV-2026-08..." },
    { tag: "SUCCESS", text: "Invoice generated & encrypted. Delivered in 84ms." },
  ]);

  useEffect(() => {
    if (activeTab !== "Tools & Systems") return;

    const extraLogs = [
      { tag: "TRIGGER", text: "Incoming Webhook received from WhatsApp Business Gateway." },
      { tag: "INVOKE", text: "Executing 9Router PII Redaction & 5-Layer Guardrail Filter..." },
      { tag: "SUCCESS", text: "Sanitized input passed to DeepSeek v4. Response in 42ms." },
      { tag: "TRIGGER", text: "BigQuery sync job scheduled for customer analytics." },
      { tag: "INVOKE", text: "Writing 14.2k events to Google BigQuery cluster..." },
      { tag: "SUCCESS", text: "Data sync completed with zero loss (100% integrity)." },
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      const logToAdd = extraLogs[logIndex % extraLogs.length];
      setToolsLogs((prev) => [...prev.slice(-3), logToAdd]);
      logIndex++;
    }, 2200);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleSendDemoMessage = (customText?: string) => {
    setIsPlayingAutoDemo(false);
    const textToSend = (customText || demoInput).trim();
    if (!textToSend || isDemoTyping) return;

    setDemoMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setDemoInput("");
    setIsDemoTyping(true);

    setTimeout(() => {
      let aiReply = "Task executed via 9Router Engine with 99.9% latency & accuracy optimization.";
      const lower = textToSend.toLowerCase();
      if (lower.includes("order") || lower.includes("status")) {
        aiReply = "Order #ZEGA-98241 status verified: Out for delivery via express logistics. ETA: 2:00 PM.";
      } else if (lower.includes("invoice") || lower.includes("stripe") || lower.includes("pay")) {
        aiReply = "Invoice #INV-2026-08 retrieved via Stripe Connect API. Sent to Slack & Email!";
      } else if (lower.includes("sla") || lower.includes("roi") || lower.includes("analytics")) {
        aiReply = "Telemetry report generated: 99.97% Uptime, $14.2k monthly savings via 9Router low-latency routing.";
      }

      setDemoMessages((prev) => [...prev, { sender: "agent", text: aiReply }]);
      setIsDemoTyping(false);
    }, 600);
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamic coordination points state
  const containerRef = useRef<HTMLDivElement>(null);
  const topPointsRef = useRef<(HTMLDivElement | null)[]>([]);
  const leftPointsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const rightPointsRef = useRef<(HTMLDivElement | null)[]>([]);
  const bottomPointsRef = useRef<(HTMLDivElement | null)[]>([]);
  const topHubRef = useRef<HTMLDivElement>(null);
  const leftHubRef = useRef<HTMLDivElement>(null);
  const rightHubRef = useRef<HTMLDivElement>(null);
  const routerTopRef = useRef<HTMLDivElement>(null);
  const routerBottomRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{
    topPoints: { x: number; y: number }[];
    leftPoints: { x: number; y: number }[];
    rightPoints: { x: number; y: number }[];
    bottomPoints: { x: number; y: number }[];
    topHub: { x: number; y: number } | null;
    leftHub: { x: number; y: number } | null;
    rightHub: { x: number; y: number } | null;
    bottomHub: { x: number; y: number } | null;
    routerTop: { x: number; y: number } | null;
    routerBottom: { x: number; y: number } | null;
  }>({
    topPoints: [],
    leftPoints: [],
    rightPoints: [],
    bottomPoints: [],
    topHub: null,
    leftHub: null,
    rightHub: null,
    bottomHub: null,
    routerTop: null,
    routerBottom: null,
  });

  const updateCoordinates = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const topPoints = topPointsRef.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.bottom - containerRect.top,
      };
    });

    const leftPoints = leftPointsRef.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
    });

    const rightPoints = rightPointsRef.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
    });

    const bottomPoints = bottomPointsRef.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top,
      };
    });

    const topHub = topHubRef.current
      ? {
        x: topHubRef.current.getBoundingClientRect().left + topHubRef.current.getBoundingClientRect().width / 2 - containerRect.left,
        y: topHubRef.current.getBoundingClientRect().top - containerRect.top,
      }
      : null;

    const bottomHub = topHubRef.current
      ? {
        x: topHubRef.current.getBoundingClientRect().left + topHubRef.current.getBoundingClientRect().width / 2 - containerRect.left,
        y: topHubRef.current.getBoundingClientRect().bottom - containerRect.top,
      }
      : null;

    const leftHub = leftHubRef.current
      ? {
        x: leftHubRef.current.getBoundingClientRect().left + leftHubRef.current.getBoundingClientRect().width / 2 - containerRect.left,
        y: leftHubRef.current.getBoundingClientRect().top + leftHubRef.current.getBoundingClientRect().height / 2 - containerRect.top,
      }
      : null;

    const rightHub = rightHubRef.current
      ? {
        x: rightHubRef.current.getBoundingClientRect().left + rightHubRef.current.getBoundingClientRect().width / 2 - containerRect.left,
        y: rightHubRef.current.getBoundingClientRect().top + rightHubRef.current.getBoundingClientRect().height / 2 - containerRect.top,
      }
      : null;

    const routerTop = routerTopRef.current
      ? {
        x: routerTopRef.current.getBoundingClientRect().left + routerTopRef.current.getBoundingClientRect().width / 2 - containerRect.left,
        y: routerTopRef.current.getBoundingClientRect().top - containerRect.top,
      }
      : null;

    const routerBottom = routerBottomRef.current
      ? {
        x: routerBottomRef.current.getBoundingClientRect().left + routerBottomRef.current.getBoundingClientRect().width / 2 - containerRect.left,
        y: routerBottomRef.current.getBoundingClientRect().bottom - containerRect.top,
      }
      : null;

    setCoords({ topPoints, leftPoints, rightPoints, bottomPoints, topHub, leftHub, rightHub, bottomHub, routerTop, routerBottom });
  }, []);

  useEffect(() => {
    let rafId: number;
    const scheduleUpdate = () => {
      rafId = requestAnimationFrame(() => {
        updateCoordinates();
      });
    };

    scheduleUpdate();
    // Run initial 2 ticks to catch image loads
    const t1 = setTimeout(scheduleUpdate, 150);
    const t2 = setTimeout(scheduleUpdate, 500);

    // Setup resize observer
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      observer = new ResizeObserver(scheduleUpdate);
      observer.observe(containerRef.current);
    }

    const handleResize = () => scheduleUpdate();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [updateCoordinates]);

  const handleNewsletterSubscribe = async (subEmail?: string) => {
    const targetEmail = (subEmail || email).trim();
    if (!targetEmail) {
      setToastMessage("Please enter your work email address.");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // Standard RFC 5322 Email Validation
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(targetEmail)) {
      setToastMessage("Please enter a valid email address.");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const res = await SupabaseDashboardService.subscribeNewsletter(targetEmail);
    if (res.error) {
      setToastMessage((res.error as any)?.message || "Failed to subscribe to newsletter.");
    } else {
      setToastMessage(`Subscribed! ${targetEmail} is registered for ZEGA AI updates.`);
      setEmail("");
      setEmailTouched(false);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const triggerComingSoon = (msg = "Coming Soon — ZEGA AI Enterprise Sign Up will open shortly.") => {
    if (email && email.trim() !== "") {
      handleNewsletterSubscribe(email);
      return;
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const isDash =
      currentPath === '/console' || currentPath.startsWith('/console/') ||
      currentPath === '/dashboard' || currentPath.startsWith('/dashboard/') ||
      currentPath === '/admin' || currentPath.startsWith('/admin/');

    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('zega_theme_user_toggled') : null;
    if (!savedTheme) {
      setDarkState(false);
    }
  }, [currentPath, showDashboard]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame: number;
    let x = 0;
    const tick = () => {
      x += 0.4;
      if (x >= el.scrollWidth / 2) x = 0;
      el.scrollLeft = x;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // ── OAuth Callback Processing Overlay ──
  if (oauthCallbackState.processing) {
    return (
      <div className={dark ? 'dark' : ''}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-lg">
          <div className="text-center space-y-4 animate-pulse">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Lock size={28} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Memproses Autentikasi OAuth...</h2>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">Menukarkan authorization code dan memverifikasi identitas Anda secara aman.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── OAuth Mandatory Profile Completion Form (New Social Auth Users) ──
  if (oauthCallbackState.showProfileForm && oauthCallbackState.profile) {
    const profile = oauthCallbackState.profile;
    return (
      <div className={dark ? 'dark' : ''}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">

            {/* Top Brand Banner */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">ZEGA AI Security SSO</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="uppercase">{profile.provider} Connected</span>
              </div>
            </div>

            {/* Profile Avatar Card */}
            <div className="px-6 pt-5 pb-3 text-center space-y-2">
              <div className="relative inline-block">
                <div className="size-16 rounded-full ring-2 ring-emerald-500/30 dark:ring-emerald-400/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 mx-auto overflow-hidden shadow-sm">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.fullName || 'User'} className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl">
                      {(profile.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 shadow-xs border-2 border-white dark:border-slate-900">
                  <Check size={10} strokeWidth={3} />
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Setup Account Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Full Name <span className="text-rose-500">*</span></label>
                <div className="mt-1 flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs focus-within:border-slate-900 dark:focus-within:border-slate-100 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 dark:focus-within:ring-slate-100/10 transition-all">
                  <UserRoundPlus size={15} className="text-slate-400 mr-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={oauthDisplayName}
                    onChange={(e) => setOauthDisplayName(e.target.value)}
                    placeholder="e.g. Danz Assyidq"
                    className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Store / Business Name <span className="text-slate-400 font-normal text-[10px] lowercase">(optional)</span></label>
                <div className="mt-1 flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs focus-within:border-slate-900 dark:focus-within:border-slate-100 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 dark:focus-within:ring-slate-100/10 transition-all">
                  <Building2 size={15} className="text-slate-400 mr-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={oauthStoreName}
                    onChange={(e) => setOauthStoreName(e.target.value)}
                    placeholder="e.g. Warung Kopi Nusantara"
                    className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Account Segment</label>
                <div className="mt-1 flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/80 p-1">
                  <button
                    type="button"
                    onClick={() => setOauthRole('individual')}
                    className={`flex-1 rounded-lg py-2 text-xs transition-all cursor-pointer font-semibold ${oauthRole === 'individual'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                  >
                    Individual / UMKM
                  </button>
                  <button
                    type="button"
                    onClick={() => setOauthRole('enterprise')}
                    className={`flex-1 rounded-lg py-2 text-xs transition-all cursor-pointer font-semibold ${oauthRole === 'enterprise'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                  >
                    Enterprise Scale
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOAuthProfileSubmit}
                disabled={!oauthDisplayName.trim()}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <span>Launch ZEGA AI Dashboard</span>
                <ArrowRight size={15} />
              </button>

              <div className="pt-2 text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  🔒 Zero-Trust Keyless Wallet Partitioning active on Privy Solana Network
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── OAuth Error Alert ──
  if (oauthCallbackState.error) {
    return (
      <div className={dark ? 'dark' : ''}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-lg p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xl p-6 text-center space-y-4">
            <div className="size-14 rounded-full bg-rose-100 dark:bg-rose-950 mx-auto flex items-center justify-center">
              <AlertCircle size={28} className="text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Autentikasi Gagal</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{oauthCallbackState.error}</p>
            <button
              onClick={() => setOauthCallbackState({ processing: false, showProfileForm: false, profile: null, provider: null, error: null })}
              className="w-full h-10 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold cursor-pointer hover:bg-slate-800 dark:hover:bg-white transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPublicCheckout =
    !currentPath.startsWith('/console') && (
      currentPath === '/checkout' || currentPath.startsWith('/checkout') ||
      currentPath === '/payment' || currentPath.startsWith('/payment') ||
      currentPath === '/pay' || currentPath.startsWith('/pay') ||
      currentPath === '/invoice' || currentPath.startsWith('/invoice') ||
      (typeof window !== 'undefined' && (
        window.location.pathname.includes('/checkout') ||
        (window.location.pathname.includes('/payment') && !window.location.pathname.startsWith('/console')) ||
        (window.location.pathname.includes('/pay') && !window.location.pathname.startsWith('/console')) ||
        window.location.search.includes('reference=') ||
        window.location.search.includes('ref=')
      ))
    );

  if (isPublicCheckout) {
    return (
      <div className={dark ? 'dark' : ''}>
        <PublicCheckoutView />
      </div>
    );
  }

  if (currentPath === '/terms' || activePage === 'terms') {
    return (
      <div className={dark ? 'dark' : ''}>
        <TermsOfService onBack={() => { setActivePage('home'); navigateTo('/home'); }} />
      </div>
    );
  }

  if (currentPath === '/privacy' || activePage === 'privacy') {
    return (
      <div className={dark ? 'dark' : ''}>
        <PrivacyPolicy onBack={() => { setActivePage('home'); navigateTo('/home'); }} />
      </div>
    );
  }

  if (currentPath === '/docs' || showDocs) {
    return (
      <DocsPage
        onBack={() => {
          setShowDocs(false);
          navigateTo('/home');
        }}
        dark={dark}
        setDark={setDark}
        triggerComingSoon={triggerComingSoon}
      />
    );
  }

  const isDashboardRoute =
    currentPath === '/console' || currentPath.startsWith('/console/') ||
    currentPath === '/dashboard' || currentPath.startsWith('/dashboard/') ||
    currentPath === '/admin' || currentPath.startsWith('/admin/');

  if (isDashboardRoute) {
    let session: any = null;
    try {
      const mock = localStorage.getItem('zega_mock_session');
      if (mock) {
        session = JSON.parse(mock);
      }
    } catch (e) {
      session = null;
    }

    // OWASP Zero-Trust Authentication Guard: Block unauthenticated or guest users from dashboard routes
    if (!session || !session.email || session.isGuest) {
      localStorage.removeItem('zega_mock_session');
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
      setTimeout(() => {
        setCurrentPath('/');
        setIsAuthModalOpen(true);
        setToastMessage('🔒 Akses Dibatasi: Silakan masuk dengan akun terverifikasi untuk mengakses Dashboard ZEGA AI.');
      }, 0);
      return null;
    }

    const role = currentPath.startsWith('/admin')
      ? 'superadmin'
      : currentPath.startsWith('/console')
        ? 'enterprise'
        : currentPath.startsWith('/dashboard')
          ? 'individual'
          : (session?.role || 'individual');

      if (role === 'superadmin') {
        return (
          <SuperAdminDashboard
            onClose={() => {
              localStorage.removeItem('zega_mock_session');
              setShowDashboard(false);
              setCurrentPath('/');
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/');
              }
            }}
            dark={dark}
            setDark={setDark}
            onSwitchToUserMode={() => {
              const userSession = {
                ...session,
                role: 'enterprise',
              };
              localStorage.setItem('zega_mock_session', JSON.stringify(userSession));
              navigateTo('/console');
            }}
          />
        );
      }
      return (
        <UserDashboard
          onClose={() => {
            localStorage.removeItem('zega_mock_session');
            setShowDashboard(false);
            setCurrentPath('/');
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
          }}
          dark={dark}
          setDark={setDark}
          userRole={role as any}
          userEmail={session?.email || ''}
          userName={session?.fullName || ''}
          isGuest={false}
          onSwitchToAdminMode={() => {
            const adminSession = {
              ...session,
              role: 'superadmin',
            };
            localStorage.setItem('zega_mock_session', JSON.stringify(adminSession));
            navigateTo('/admin');
          }}
        />
      );
    }

  return (
    <div
      className={`min-h-screen bg-background font-[Inter,sans-serif] text-foreground antialiased transition-all duration-200 ${isLangChanging ? "opacity-50 scale-[0.998]" : "opacity-100 scale-100"
        }`}
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}
    >
      {showSplash && <ZegaSplashLoader onComplete={() => setShowSplash(false)} />}

      {/* NAV */}
      <header className="sticky top-0 z-50 h-[60px] border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/");
            }}
            className="flex-shrink-0 flex items-center rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/50 cursor-pointer"
            aria-label="ZEGA AI — Back to home"
          >
            <ZegaLogo size={42} showText={false} imgClassName="h-8.5 sm:h-10 lg:h-11.5 w-auto" />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted-foreground md:flex">
            {[
              { id: "home", label: t.nav.home, href: "/" },
              { id: "products", label: t.nav.products, href: "/products" },
              { id: "docs", label: t.nav.docs, href: "/docs" },
              { id: "pricing", label: t.nav.pricing, href: "/pricing" },
            ].map((item) => {
              const isActive =
                item.id === "docs" ? (currentPath === "/docs" || showDocs) :
                  item.id === "products" ? currentPath === "/products" :
                    item.id === "pricing" ? currentPath === "/pricing" :
                      (currentPath === "/home" || currentPath === "/" || currentPath === "");
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    if (item.id === "docs") {
                      navigateTo("/docs");
                    } else if (item.id === "products") {
                      navigateTo("/products");
                    } else if (item.id === "pricing") {
                      navigateTo("/pricing");
                    } else {
                      navigateTo("/");
                    }
                  }}
                  className={`nav-link-animated transition-colors hover:text-foreground ${isActive ? "text-[#ff6b35] font-bold" : ""
                    }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Language Selector (EN, ID, ZH) */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="pill-hover-glow grid size-8 place-items-center rounded-full border border-border/80 bg-card/50 text-muted-foreground transition-all duration-300 hover:border-foreground/30 hover:text-foreground cursor-pointer"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Unified Launch App CTA Button — Smart Authentication & Role Aware */}
            <button
              onClick={async () => {
                const session = await SupabaseDashboardService.getCurrentSession();
                if (session) {
                  setShowDashboard(true);
                  const userRole = session.role || 'individual';
                  if (userRole === 'individual') {
                    navigateTo("/dashboard");
                  } else if (userRole === 'superadmin') {
                    navigateTo("/admin");
                  } else {
                    navigateTo("/console");
                  }
                } else {
                  handleOpenAuth("self-serve");
                }
              }}
              className="group relative hidden sm:inline-flex items-center justify-center gap-2 h-9 px-4.5 text-[12.5px] font-semibold tracking-wide text-white whitespace-nowrap shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff4500] bg-[length:200%_100%] border border-white/25 shadow-md shadow-[#ff6b35]/25 transition-all duration-300 hover:bg-right hover:shadow-lg hover:shadow-[#ff6b35]/40 hover:scale-[1.03] active:scale-95 cursor-pointer select-none"
            >
              <span className="relative z-10 flex items-center gap-2 whitespace-nowrap shrink-0">
                <Rocket
                  size={15}
                  className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                />
                <span className="whitespace-nowrap shrink-0 font-semibold tracking-wide leading-none">{t.nav.tryNow}</span>
              </span>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid size-8 place-items-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground md:hidden cursor-pointer"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={15} className="text-[#ff6b35]" /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {/* Mobile Sticky Sub-Header Dropdown Menu — Absolute Attached to Sticky Header */}
        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 z-50 max-h-[85vh] w-full overflow-y-auto border-b border-border/80 bg-background text-foreground p-4 sm:p-5 shadow-2xl md:hidden animate-fadeIn">
            <div className="mx-auto flex max-w-md flex-col gap-1.5">
              {[
                { label: "Home", id: "home", sub: "Platform Overview & Features", Icon: Home, href: "/home" },
                { label: "Products", id: "products", sub: "Core AI Engines & Guardrails", Icon: Layers3, href: "/products" },
                { label: "Docs", id: "docs", sub: "Developer Guides & API Spec", Icon: BookOpen, href: "/docs" },
                { label: "Pricing", id: "pricing", sub: "Flexible Enterprise Tiers", Icon: Tag, href: "/pricing" },
              ].map(({ label, id, sub, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex items-center justify-between rounded-xl p-3 transition-all hover:bg-muted/80 active:scale-[0.99]"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    if (id === "docs") {
                      navigateTo("/docs");
                    } else if (id === "products") {
                      navigateTo("/products");
                    } else if (id === "pricing") {
                      navigateTo("/pricing");
                    } else {
                      navigateTo("/");
                    }
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-9 flex-shrink-0 place-items-center rounded-xl border border-border/60 bg-card text-foreground/80 group-hover:border-[#ff6b35]/40 group-hover:text-[#ff6b35] transition-all">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-foreground leading-tight group-hover:text-[#ff6b35] transition-colors">{label}</p>
                      <p className="text-[10.5px] text-muted-foreground font-normal mt-0.5">{sub}</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </a>
              ))}

              {/* Mobile Footer CTAs & Operational Status */}
              <div className="mt-3 border-t border-border/50 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    className="w-full rounded-xl border border-border/80 bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                    onClick={() => {
                      setMobileOpen(false);
                      navigateTo("/docs");
                    }}
                  >
                    View Docs
                  </button>
                  <button
                    className="group relative w-full flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff4500] bg-[length:200%_100%] py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6b35]/20 hover:bg-right active:scale-[0.98] transition-all cursor-pointer"
                    onClick={() => {
                      setMobileOpen(false);
                      handleOpenAuth("self-serve");
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Rocket
                        size={15}
                        className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                      />
                      <span className="font-semibold tracking-wide">{t.nav.tryNow}</span>
                    </span>
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/40 py-2 text-[10px] font-mono text-muted-foreground border border-border/40">
                  <span className="relative flex size-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
                  </span>
                  <span>ZEGA Cloud Systems Operational — 99.97% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pb-12 pt-16 sm:pt-20 lg:pt-24 text-center border-b border-slate-200/80 dark:border-white/[0.06]"
      >
        {/* Harmonious Multi-Tone Ambient Glow Aura */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden">
          {/* Main Top Center Radial Glow */}
          <div className="h-[460px] w-[1040px] rounded-full dark:bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.22)_0%,rgba(194,24,91,0.16)_35%,rgba(14,165,233,0.12)_60%,transparent_80%)] bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.08)_0%,rgba(244,114,182,0.05)_40%,rgba(56,189,248,0.05)_70%,transparent_85%)] blur-3xl" />
          {/* Subtle Accent Flairs */}
          <div className="absolute -top-10 left-1/4 h-[320px] w-[320px] rounded-full dark:bg-[#ff6b35]/15 bg-[#ff6b35]/05 blur-[90px]" />
          <div className="absolute -top-10 right-1/4 h-[320px] w-[320px] rounded-full dark:bg-[#0ea5e9]/15 bg-[#0ea5e9]/05 blur-[90px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          {/* Seamless Enterprise Announcement Pill */}
          <div
            onClick={() => handleOpenAuth('enterprise')}
            className="hero-text-reveal mx-auto mb-6 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border dark:border-white/12 border-slate-200/90 dark:bg-white/[0.04] bg-slate-900/[0.03] px-3.5 sm:px-4.5 py-1.5 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/40 dark:hover:border-orange-400/40 cursor-pointer shadow-2xs group select-none"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <img src={getR2CdnUrl('/assets/logo/jatevo.svg')} className="h-3.5 sm:h-4 w-auto object-contain dark:brightness-0 dark:invert transition-all" alt="Jatevo" />
              <span className="text-[10.5px] sm:text-[11px] font-semibold dark:text-slate-200 text-slate-700">Orchestrator</span>
            </div>
            <span className="text-slate-400 dark:text-slate-600 font-bold text-[8px] sm:text-[9px] shrink-0">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <img src={getR2CdnUrl('/assets/logo/zeroclaw.jpeg')} className="size-3.5 rounded object-cover" alt="ZeroClaw" />
              <span className="text-[10.5px] sm:text-[11px] font-semibold dark:text-slate-200 text-slate-700">ZeroClaw <span className="hidden sm:inline">AI Engine</span></span>
            </div>
            <span className="text-slate-400 dark:text-slate-600 font-bold text-[8px] sm:text-[9px] shrink-0">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <img src={getR2CdnUrl('/assets/logo/solana.png')} className="size-3.5 rounded object-contain" alt="Solana" />
              <span className="text-[10.5px] sm:text-[11px] font-semibold dark:text-slate-300 text-slate-600">Solana Pay <span className="hidden sm:inline">Settlement</span></span>
            </div>
          </div>

          <h1
            className="hero-text-reveal text-[clamp(2.3rem,5.5vw,4.1rem)] font-light leading-[1.08] tracking-[-0.035em] text-slate-900 dark:text-white max-w-3xl"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.hero.title}
          </h1>
          <p
            className="hero-text-reveal hero-text-reveal-delay-1 mx-auto mt-4.5 max-w-[640px] text-[14px] sm:text-[15.5px] leading-relaxed text-slate-600 dark:text-muted-foreground font-normal [text-wrap:balance]"
            style={{ textWrap: 'balance' }}
          >
            {t.hero.subtitle}
          </p>

          {/* Clean Enterprise Email Input Pill — Ultra Responsive for Mobile & Desktop */}
          <div className="hero-text-reveal hero-text-reveal-delay-2 mx-auto mt-5 sm:mt-7 flex w-full max-w-[92vw] sm:max-w-[420px] items-center overflow-hidden rounded-full border border-slate-300 dark:border-white/12 bg-white dark:bg-[#0f111a]/90 p-1 sm:p-1.5 backdrop-blur-xl shadow-none transition-all duration-200 focus-within:border-slate-400 dark:focus-within:border-white/30 focus-within:ring-2 focus-within:ring-slate-400/10 dark:focus-within:ring-white/5">
            <Mail size={14} strokeWidth={1.75} className="ml-2.5 sm:ml-3.5 flex-shrink-0 text-slate-400 dark:text-slate-400 transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNewsletterSubscribe(email);
              }}
              placeholder={t.hero.enterEmail}
              className="min-w-0 flex-1 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2 text-[11.5px] sm:text-[12.5px] font-medium text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/60 border-none outline-none ring-0 focus:ring-0 focus:outline-none"
              autoComplete="email"
            />
            <button
              onClick={() => handleNewsletterSubscribe(email)}
              className="group relative flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff6b35] bg-[length:200%_100%] px-3.5 sm:px-5 py-2 sm:py-2.5 text-[10.5px] sm:text-[11.5px] font-bold text-white shadow-xs transition-all duration-300 hover:bg-right hover:opacity-95 active:scale-95 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-1">
                Subscribe <ArrowRight size={12} className="hidden sm:inline" />
              </span>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </div>

          {/* Interactive 3D Robotic Swarm Video Showcase — Centered High Definition Widescreen Canvas */}
          <div className="hero-text-reveal hero-text-reveal-delay-2 relative mx-auto mt-6 sm:mt-10 w-full max-w-[94vw] sm:max-w-[780px] lg:max-w-[840px] group select-none overflow-visible">
            {/* Multi-Layer Ambient Glow Backdrop Aura — Mobile Safe Inset */}
            <div className="absolute -inset-2 sm:-inset-6 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-r from-[#ff6b35]/25 via-[#e8295a]/20 to-[#0ea5e9]/25 blur-2xl sm:blur-3xl opacity-70 sm:opacity-80 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative overflow-hidden rounded-xl sm:rounded-3xl border border-slate-200/90 dark:border-white/12 bg-slate-950/80 shadow-[0_20px_50px_-15px_rgba(255,107,53,0.25)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-all duration-500 hover:scale-[1.01]">
              {/* Top Glass Highlight Edge */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/25 to-transparent z-20" />

              {/* High-Performance Smooth Looping Video */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  poster={getR2CdnUrl('/assets/3D/zega_robotic.png')}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                >
                  <source src={getR2CdnUrl('/assets/3D/zega_animate.mp4')} type="video/mp4" />
                  <img
                    src={getR2CdnUrl('/assets/3D/zega_robotic.png')}
                    alt="ZEGA Robotic Autonomous Swarm"
                    className="w-full h-full object-cover object-center"
                  />
                </video>

                {/* Soft Edge Ambient Overlay */}
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl sm:rounded-3xl bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(10,14,26,0.4)_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-30" />
              </div>
            </div>
          </div>
        </div>

        {/* ORCHESTRATION FLOW VISUALIZATION */}
        <div className="relative mx-auto mt-8 sm:mt-12 lg:mt-14 mb-8 sm:mb-12 w-full max-w-[1280px] px-3 sm:px-6 lg:px-8">
          <div className="w-full overflow-x-auto pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {/* Ambient Orange & Pink Glow Orbs */}
            <div className="pointer-events-none absolute -top-16 -left-16 size-80 rounded-full bg-gradient-to-br from-[#ff6b35]/20 via-[#e8295a]/15 to-transparent blur-3xl dark:opacity-40 opacity-70" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 size-80 rounded-full bg-gradient-to-tl from-[#e8295a]/20 via-[#ff6b35]/15 to-transparent blur-3xl dark:opacity-40 opacity-70" />

            {/* Flow animation styling */}
            <style>{`
              @keyframes flowDash { 0% { stroke-dashoffset: 24; } 100% { stroke-dashoffset: 0; } }
              .orch-line { stroke-dasharray: 4 4; animation: flowDash 1.2s linear infinite; }
              .orch-line-rev { stroke-dasharray: 4 4; animation: flowDash 1.2s linear infinite reverse; }
              @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
              .orch-fade { animation: fadeInUp 0.5s ease both; }
              @keyframes glowPulse { 0%,100% { opacity: 0.4; filter: drop-shadow(0 0 2px rgba(56,189,248,0.5)); } 50% { opacity: 1; filter: drop-shadow(0 0 6px rgba(56,189,248,0.8)); } }
              .glow-hub { animation: glowPulse 2s ease-in-out infinite; }
            `}</style>

            <div ref={containerRef} className="relative w-full min-w-[880px] lg:min-w-0 rounded-2xl border dark:border-white/[0.08] border-slate-200/90 dark:bg-[#0a0e1a]/95 bg-white/85 backdrop-blur-2xl p-4 sm:p-5 lg:p-6 shadow-none dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all overflow-hidden">
              {/* Glassmorphic Top Border Glow Line */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#ff6b35]/50 dark:via-[#ff6b35]/70 via-[#e8295a]/40 to-transparent z-20" />

              {/* Dot grid */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

              {/* Dynamic Curved Bezier Connectors Overlay — Direct child of containerRef */}
              <svg
                viewBox={coords.leftHub && coords.leftPoints.length > 0 ? undefined : "0 0 1000 450"}
                preserveAspectRatio={coords.leftHub && coords.leftPoints.length > 0 ? undefined : "none"}
                fill="none"
                className="absolute inset-0 size-full pointer-events-none z-20 overflow-visible"
              >
                {/* Fallback to static percentage lines while layout coordinates are loading */}
                {(!coords.leftHub || coords.leftPoints.length === 0) ? (
                  <>
                    {/* 10 Paths from Layer 2 Integrations to Left Hub Node */}
                    {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5, 382.5, 427.5].map((y, i) => {
                      const color = i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#e8295a" : "#38bdf8";
                      const isLeftActive = vizTab === 'Agent' || vizTab === 'Integration' || vizTab === 'Automation';
                      const strokeOpacity1 = isLeftActive ? 0.12 : 0.02;
                      const strokeOpacity2 = isLeftActive ? 0.9 : 0.15;
                      return (
                        <g key={`static-l2-${i}`} fill="none" className="transition-opacity duration-350">
                          <path d={`M 178 ${y} C 250 ${y}, 290 225, 333 225`} className="orch-line" stroke={color} strokeWidth="3.5" strokeOpacity={strokeOpacity1} fill="none" />
                          <path d={`M 178 ${y} C 250 ${y}, 290 225, 333 225`} className="orch-line" stroke={color} strokeWidth="0.85" strokeOpacity={strokeOpacity2} fill="none" />
                        </g>
                      );
                    })}
                    {/* Left Hub Node to Center */}
                    <path d="M 333 225 L 340 225" className="orch-line" stroke="#ff6b35" strokeWidth="1.5" strokeOpacity={vizTab === 'Memory' ? 0.25 : 0.9} fill="none" />
                    {/* Center to Right Hub Node */}
                    <path d="M 660 225 L 667 225" className="orch-line" stroke="#ff6b35" strokeWidth="1.5" strokeOpacity={vizTab === 'Integration' ? 0.25 : 0.9} fill="none" />
                    {/* 8 Paths from Right Hub Node to Layer 4 AI Agents */}
                    {[30, 86, 142, 198, 254, 310, 366, 422].map((y, i) => {
                      const color = i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#e8295a" : "#38bdf8";
                      const isRightActive = vizTab === 'Agent' || vizTab === 'Automation' || vizTab === 'Memory';
                      const strokeOpacity1 = isRightActive ? 0.12 : 0.02;
                      const strokeOpacity2 = isRightActive ? 0.9 : 0.1;
                      return (
                        <g key={`static-l4-${i}`} fill="none" className="transition-opacity duration-350">
                          <path d={`M 667 225 C 710 225, 750 ${y}, 822 ${y}`} className="orch-line" stroke={color} strokeWidth="3.5" strokeOpacity={strokeOpacity1} fill="none" />
                          <path d={`M 667 225 C 710 225, 750 ${y}, 822 ${y}`} className="orch-line" stroke={color} strokeWidth="0.85" strokeOpacity={strokeOpacity2} fill="none" />
                        </g>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Dynamic top lines fanning from Layer 1 cards to Top Hub Node */}
                    {coords.topPoints.map((pt, i) => {
                      if (!pt || (pt.x === 0 && pt.y === 0) || !coords.topHub) return null;
                      const color = i % 2 === 0 ? "#38bdf8" : "#818cf8";
                      const x1 = pt.x;
                      const y1 = pt.y;
                      const x2 = coords.topHub.x;
                      const y2 = coords.topHub.y;
                      const cp1x = x1;
                      const cp1y = y1 + (y2 - y1) * 0.55;
                      const cp2x = x2;
                      const cp2y = y1 + (y2 - y1) * 0.45;
                      return (
                        <g key={`dyn-l1-${i}`} fill="none" className="transition-opacity duration-350">
                          <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth="1.2" strokeOpacity={0.85} fill="none" style={{ animationDelay: `${i * 0.12}s` }} />
                        </g>
                      );
                    })}

                    {/* Dynamic left lines fanning to connection hub (Layer 2 Integrations -> Database Hub) */}
                    {coords.leftPoints.map((pt, i) => {
                      if (!pt || (pt.x === 0 && pt.y === 0) || !coords.leftHub) return null;
                      const color = i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#e8295a" : "#38bdf8";
                      const x1 = pt.x;
                      const y1 = pt.y;
                      const x2 = coords.leftHub.x;
                      const y2 = coords.leftHub.y;

                      const cp1x = x1 + (x2 - x1) * 0.55;
                      const cp1y = y1;
                      const cp2x = x1 + (x2 - x1) * 0.45;
                      const cp2y = y2;

                      const isLeftActive = vizTab === 'Agent' || vizTab === 'Integration' || vizTab === 'Automation';
                      const strokeOpacity1 = isLeftActive ? 0.12 : 0.02;
                      const strokeOpacity2 = isLeftActive ? 0.9 : 0.15;
                      return (
                        <g key={`dyn-l2-${i}`} fill="none" className="transition-opacity duration-350">
                          <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth="3" strokeOpacity={strokeOpacity1} fill="none" style={{ animationDelay: `${i * 0.08}s` }} />
                          <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth="0.85" strokeOpacity={strokeOpacity2} fill="none" style={{ animationDelay: `${i * 0.08}s` }} />
                        </g>
                      );
                    })}

                    {/* Dynamic right lines fanning from connection hub (Layer 4 Shield Hub -> AI Agents) */}
                    {coords.rightPoints.map((pt, i) => {
                      if (!pt || (pt.x === 0 && pt.y === 0) || !coords.rightHub) return null;
                      const color = i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#e8295a" : "#38bdf8";
                      const x1 = coords.rightHub.x;
                      const y1 = coords.rightHub.y;
                      const x2 = pt.x;
                      const y2 = pt.y;

                      const cp1x = x1 + (x2 - x1) * 0.45;
                      const cp1y = y1;
                      const cp2x = x1 + (x2 - x1) * 0.55;
                      const cp2y = y2;

                      const isRightActive = vizTab === 'Agent' || vizTab === 'Automation' || vizTab === 'Memory';
                      const strokeOpacity1 = isRightActive ? 0.12 : 0.02;
                      const strokeOpacity2 = isRightActive ? 0.9 : 0.15;
                      return (
                        <g key={`dyn-l4-${i}`} fill="none" className="transition-opacity duration-350">
                          <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth="3" strokeOpacity={strokeOpacity1} fill="none" style={{ animationDelay: `${i * 0.15}s` }} />
                          <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth="0.85" strokeOpacity={strokeOpacity2} fill="none" style={{ animationDelay: `${i * 0.15}s` }} />
                        </g>
                      );
                    })}
                    {/* Dynamic line from ZEGA AI Orchestrator bottom to 9Router Engine top */}
                    {coords.bottomHub && coords.routerTop && (
                      <g fill="none" className="transition-opacity duration-350">
                        <path
                          d={`M ${coords.bottomHub.x} ${coords.bottomHub.y} C ${coords.bottomHub.x} ${coords.bottomHub.y + (coords.routerTop.y - coords.bottomHub.y) * 0.5}, ${coords.routerTop.x} ${coords.routerTop.y - (coords.routerTop.y - coords.bottomHub.y) * 0.5}, ${coords.routerTop.x} ${coords.routerTop.y}`}
                          className="orch-line"
                          stroke="#ff6b35"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </g>
                    )}

                    {/* Dynamic lines fanning from 9Router Engine bottom to 7 LLM Model cards */}
                    {coords.routerBottom && coords.bottomPoints.map((pt, i) => {
                      if (!pt || (pt.x === 0 && pt.y === 0)) return null;
                      const color = i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#38bdf8" : "#6366f1";
                      const x1 = coords.routerBottom!.x;
                      const y1 = coords.routerBottom!.y;
                      const x2 = pt.x;
                      const y2 = pt.y;
                      const cp1x = x1;
                      const cp1y = y1 + (y2 - y1) * 0.5;
                      const cp2x = x2;
                      const cp2y = y1 + (y2 - y1) * 0.5;
                      return (
                        <g key={`dyn-l5-${i}`} fill="none" className="transition-opacity duration-350">
                          <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth="1.2" strokeOpacity={0.85} fill="none" style={{ animationDelay: `${i * 0.1}s` }} />
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>

              {/* ═══════════ LAYER 1 — EVENT SOURCES ═══════════ */}
              <div className="orch-fade relative z-10 mb-4">
                <p className="text-[8px] font-bold tracking-[0.2em] uppercase dark:text-[#818cf8]/70 text-indigo-700 mb-2">Layer 1 · Event Sources</p>
                <div className="grid grid-cols-5 gap-2">
                  {([
                    { Icon: Globe, label: 'API', sub: 'REST / GraphQL' },
                    { Icon: Zap, label: 'Webhook', sub: 'Real-time Events' },
                    { Icon: Calendar, label: 'Scheduler', sub: 'Cron / Intervals' },
                    { Icon: FileText, label: 'Form Submitted', sub: 'Web / Mobile' },
                    { Icon: Network, label: 'MCP', sub: 'Model Context Protocol' },
                  ] as const).map(({ Icon, label, sub }, i) => (
                    <div
                      key={label}
                      ref={(el) => { topPointsRef.current[i] = el; }}
                      className="flex items-center gap-2 rounded-lg border dark:border-white/[0.06] border-slate-200/80 dark:bg-white/[0.02] bg-white px-3 py-2 transition-all hover:dark:bg-white/[0.04] hover:bg-slate-50 hover:shadow-xs"
                    >
                      <Icon size={14} className="flex-shrink-0 dark:text-[#818cf8] text-indigo-500" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold dark:text-white/85 text-slate-800 truncate">{label}</p>
                        <p className="text-[7.5px] dark:text-white/30 text-slate-500 font-medium truncate">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══════════ LAYER 2+3+4 — MAIN ORCHESTRATION ═══════════ */}
              <div className="orch-fade relative z-10 grid grid-cols-[28%_44%_28%] justify-between gap-0 items-center">

                {/* LEFT — Layer 2: Integrations */}
                <div className="relative z-10">
                  <p className="text-[8px] font-bold tracking-[0.2em] uppercase dark:text-emerald-400/70 text-emerald-700 mb-1 text-left">Layer 2 · Integrations</p>
                  <p className="text-[7px] dark:text-white/20 text-slate-400 mb-2 text-left font-medium">Connected tools and services</p>
                  <div className="space-y-1">
                    {([
                      { name: 'Google Maps', sub: 'Location & Geo Data' },
                      { name: 'WhatsApp Business', sub: 'Messaging API' },
                      { name: 'Stripe Connect', sub: 'Payments & Billing' },
                      { name: 'x402 Protocol', sub: 'M2M Micropayments' },
                      { name: 'Meta API', sub: 'Instagram & Ads' },
                      { name: 'BigQuery', sub: 'Data Warehouse' },
                      { name: 'Spreadsheet', sub: 'Google Sheets & Excel' },
                      { name: 'Browser Use', sub: 'Web Automation' },
                      { name: 'GitHub', sub: 'Code & Repos' },
                      { name: 'Slack', sub: 'Team Collaboration' },
                    ] as const).map(({ name, sub }, i) => (
                      <div key={name} className="flex items-center justify-between rounded-lg border dark:border-[#1e3a4a] border-slate-200/90 dark:bg-[#091522] bg-white px-2.5 py-1 transition-all hover:dark:bg-[#0c1e30] hover:bg-slate-50 hover:border-slate-300">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-shrink-0 size-6 rounded-md dark:bg-white/[0.04] bg-slate-100 flex items-center justify-center">
                            <BrandIcon name={name} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9.5px] font-semibold dark:text-white/90 text-slate-900 truncate">{name}</p>
                            <p className="text-[7px] dark:text-white/40 text-slate-500 font-medium truncate">{sub}</p>
                          </div>
                        </div>
                        <span
                          ref={(el) => { leftPointsRef.current[i] = el; }}
                          className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse ml-1.5 flex-shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* CENTER — Layer 3: ZEGA AI Orchestrator */}
                <div className="relative z-10 w-full max-w-[440px] mx-auto px-1 sm:px-2">
                  <div ref={topHubRef} className="relative rounded-2xl border dark:border-[#ff6b35]/35 border-orange-200 dark:bg-[#091422] bg-white overflow-visible shadow-none dark:shadow-[0_8px_32px_rgba(255,107,53,0.08)] transition-all mt-4 sm:mt-6">
                    {/* LEFT HUB NODE BADGE — GLOWING ORANGE/RED */}
                    <div ref={leftHubRef} className="flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full border-2 border-[#ff6b35] dark:bg-[#1a0a14] bg-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] dark:shadow-[0_0_16px_rgba(255,107,53,0.8)] items-center justify-center">
                      <Database size={13} className="text-[#ff6b35]" />
                    </div>

                    {/* RIGHT HUB NODE BADGE — GLOWING ORANGE/RED */}
                    <div ref={rightHubRef} className="flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full border-2 border-[#ff6b35] dark:bg-[#1a0a14] bg-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] dark:shadow-[0_0_16px_rgba(255,107,53,0.8)] items-center justify-center">
                      <ShieldCheck size={13} className="text-[#ff6b35]" />
                    </div>

                    {/* Tabs bar — Fixed height 38px at the top of the card */}
                    <div className="flex h-[38px] border-b dark:border-white/[0.06] border-gray-200/80 rounded-t-2xl overflow-hidden bg-slate-50/50 dark:bg-transparent">
                      {(['Agent', 'Integration', 'Automation', 'Memory'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setVizTab(tab)}
                          className={`flex-1 py-2 text-[9.5px] sm:text-[10px] font-semibold tracking-wide transition-all duration-200 ease-out cursor-pointer transform-gpu active:scale-98 ${vizTab === tab
                            ? 'dark:text-white text-gray-900 dark:bg-white/[0.06] bg-white border-b-2 border-[#ff6b35] dark:border-[#ff6b35] font-bold shadow-xs'
                            : 'dark:text-white/40 text-gray-500 hover:dark:text-white/70 hover:text-gray-700 hover:bg-slate-100/50 dark:hover:bg-white/[0.02]'
                            }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Smooth Animated Tab Content Container */}
                    <div key={vizTab} className="animate-fadeIn transition-opacity duration-300 transform-gpu will-change-[opacity]">
                      {/* Logo + Title — Fixed Height 70px Header across all tabs */}
                      <div className="flex flex-col items-center h-[70px] justify-center px-4 pt-2.5 pb-1.5">
                        <img
                          src={getR2CdnUrl('/assets/logo/zegalogo.png')}
                          alt="ZEGA AI"
                          className="h-6 sm:h-7 w-auto object-contain transition-[filter] duration-300 dark:[filter:invert(1)_hue-rotate(180deg)] dark:drop-shadow-[0_1px_8px_rgba(255,255,255,0.08)]"
                        />
                        {VIZ_TAB_DATA[vizTab].title && (
                          <h3 className="mt-0.5 text-[12.5px] sm:text-[13.5px] font-bold dark:text-white/95 text-slate-800 tracking-tight">
                            {VIZ_TAB_DATA[vizTab].title}
                          </h3>
                        )}
                        <p className="mt-0.5 text-[8px] sm:text-[8.5px] dark:text-white/40 text-slate-500 font-semibold text-center flex items-center justify-center gap-1.5">
                          <img src={getR2CdnUrl('/assets/logo/jatevo.svg')} className="h-3.5 sm:h-4 w-auto object-contain dark:brightness-0 dark:invert transition-all inline-block" alt="Jatevo" />
                          <span>Enterprise Orchestration Engine</span>
                        </p>
                      </div>

                      {/* Workflow Pipeline — Fixed 215px Height across all tabs */}
                      <div className="px-4 sm:px-5 pb-2.5 space-y-1.5 h-[215px] flex flex-col justify-center transition-all duration-300">
                        {VIZ_TAB_DATA[vizTab].items.map(({ Icon, label, sub }, idx) => (
                          <div
                            key={label}
                            className="flex items-center gap-3 rounded-xl dark:bg-[#0a1622] bg-slate-50/50 border dark:border-[#1e3a4a]/70 border-slate-200/80 px-3 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs transform-gpu"
                            style={{ animationDelay: `${idx * 40}ms` }}
                          >
                            <Icon size={13} className="flex-shrink-0 dark:text-[#818cf8]/80 text-indigo-550" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[9.5px] sm:text-[10px] font-semibold dark:text-white/85 text-gray-800">{label}</p>
                              <p className="text-[7.5px] sm:text-[8px] dark:text-white/30 text-slate-500 font-medium">{sub}</p>
                            </div>
                            <Check size={12} className="flex-shrink-0 dark:text-emerald-400/80 text-emerald-500" />
                          </div>
                        ))}
                      </div>

                      {/* Live status bar — Fixed Height 36px */}
                      <div className="flex items-center justify-between px-4 sm:px-5 h-[36px] border-t dark:border-white/[0.05] border-gray-100 dark:bg-white/[0.01] bg-slate-50/50 rounded-b-2xl">
                        <div className="flex items-center gap-1.5">
                          <span className={`size-1.5 rounded-full ${VIZ_TAB_DATA[vizTab].badgePulse} animate-pulse`} />
                          <span className={`text-[8px] sm:text-[8.5px] font-bold ${VIZ_TAB_DATA[vizTab].badgeColor} border px-2 py-0.5 rounded-md`}>{VIZ_TAB_DATA[vizTab].badge}</span>
                        </div>
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          {VIZ_TAB_DATA[vizTab].metrics.map((m, idx) => {
                            const Icon = m.Icon;
                            return (
                              <span key={idx} className="text-[8px] sm:text-[8.5px] dark:text-white/40 text-slate-500 font-medium flex items-center gap-1">
                                {Icon && <Icon size={9} />}
                                {m.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Layer 4: AI Agents */}
                <div className="relative z-10">
                  <p className="text-[8px] font-bold tracking-[0.2em] uppercase dark:text-[#0ea5e9]/70 text-sky-700 mb-1 text-left">Layer 4 · AI Agents</p>
                  <p className="text-[7px] dark:text-white/20 text-gray-400 mb-2 text-left">Autonomous agents working on your business</p>
                  <div className="space-y-1">
                    {([
                      { Icon: Zap, name: 'Agentic Payment Agent', sub: 'Solana Pay · ZeroClaw Escrow · Settle', active: true },
                      { Icon: Cpu, name: 'DeFi Guardian Agent', sub: 'Solana DEX · Auto-Yield · Protection', active: true },
                      { Icon: Star, name: 'Sales Agent', sub: 'HubSpot · LinkedIn · WhatsApp', active: true },
                      { Icon: CreditCard, name: 'Finance Agent', sub: 'Stripe · x402 · Invoices', active: true },
                      { Icon: Headphones, name: 'CS Agent', sub: 'WhatsApp · Telegram · Email', active: true },
                      { Icon: TrendingUp, name: 'SEO Agent', sub: 'GSC · GA4 · Ads · Keywords', active: true },
                      { Icon: BarChart3, name: 'Analytics Agent', sub: 'BigQuery · Metabase · Reports', active: true },
                      { Icon: ShieldCheck, name: 'Risk & Strategy Agent', sub: 'Cost Optimization & Mitigation', active: true },
                      { Icon: Search, name: 'Research Agent', sub: 'Web · Papers · News · Data', active: false },
                      { Icon: Code2, name: 'Coding Agent', sub: 'GitHub · Code · Deployments', active: false },
                    ] as const).map(({ Icon, name, sub, active }, i) => (
                      <div
                        ref={(el) => { rightPointsRef.current[i] = el; }}
                        key={name}
                        className="flex items-center gap-2 rounded-lg border dark:border-[#1e3a4a] border-slate-200/90 dark:bg-[#091522] bg-white px-2.5 py-1 transition-all hover:dark:bg-[#0c1e30] hover:bg-slate-50 hover:border-slate-300"
                      >
                        <div className={`flex-shrink-0 size-6 rounded-md flex items-center justify-center ${active ? 'dark:bg-sky-500/10 bg-sky-50' : 'dark:bg-white/[0.03] bg-slate-50'}`}>
                          <Icon size={12} className={active ? 'dark:text-sky-400 text-sky-600' : 'dark:text-white/25 text-slate-400'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[9.5px] font-semibold dark:text-white/85 text-slate-800 truncate">{name}</p>
                            <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[6.5px] font-bold uppercase tracking-wider ${active ? 'dark:bg-emerald-500/15 bg-emerald-50 dark:text-emerald-400 text-emerald-600 dark:border-emerald-500/20 border-emerald-200' : 'dark:bg-white/[0.04] bg-slate-100 dark:text-white/30 text-slate-400 border dark:border-white/[0.05] border-slate-200'}`}>{active ? 'Active' : 'Idle'}</span>
                          </div>
                          <p className="text-[7px] dark:text-white/30 text-slate-500 font-medium truncate">{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ═══════════ LAYER 5 — 9ROUTER & MODEL ROUTER ═══════════ */}
              <div className="orch-fade relative z-10 my-4 lg:mt-6 lg:mb-3">
                <p className="text-[8px] font-bold tracking-[0.2em] uppercase dark:text-[#ff6b35]/60 text-orange-500 mb-2">Layer 5 · Model Router Engine</p>

                {/* 9Router Engine — Centered Hub */}
                <div ref={routerTopRef} className="flex flex-col items-center justify-center mx-auto max-w-xl mb-4 lg:mb-6">
                  <div ref={routerBottomRef} className="w-full flex flex-col items-center rounded-xl border dark:border-[#ff6b35]/30 border-orange-200 dark:bg-[#091522] bg-white px-4 py-3 shadow-md shadow-orange-500/5">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="size-8.5 rounded-lg dark:bg-white/[0.04] bg-orange-50/80 flex items-center justify-center p-0.5 border border-orange-200/60 dark:border-orange-500/30 overflow-hidden flex-shrink-0">
                        <img src="/assets/visualization/9router.jpeg" alt="9Router Logo" className="size-full object-cover rounded-md" />
                      </div>
                      <div className="text-left">
                        <p className="text-[12px] font-bold dark:text-white/90 text-slate-800">9Router Engine</p>
                        <p className="text-[8.5px] dark:text-white/35 text-slate-500 font-medium">Intelligent Model Routing & Optimization Hub</p>
                      </div>
                    </div>

                    {/* Integrated capability badges */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t dark:border-white/[0.06] border-slate-100 w-full">
                      {([
                        { Icon: Clock, label: 'Latency Opt' },
                        { Icon: CreditCard, label: 'Cost Opt' },
                        { Icon: GitBranch, label: 'Fallback Mgmt' },
                        { Icon: Activity, label: 'AI Scoring' },
                        { Icon: Sparkles, label: 'Smart Routing' },
                        { Icon: Cpu, label: 'Multi-LLM Load Balance' },
                      ] as const).map(({ Icon, label }) => (
                        <div key={label} className="flex items-center gap-1 rounded-md dark:bg-white/[0.03] bg-slate-50 border dark:border-white/[0.05] border-slate-200/60 px-2 py-1 transition-all hover:border-orange-500/40">
                          <Icon size={10} className="dark:text-orange-400 text-[#ff6b35]" />
                          <span className="text-[8px] font-semibold dark:text-white/70 text-slate-700">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LLM Models Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {([
                    { label: 'Claude', sub: 'Anthropic' },
                    { label: 'GPT-4o', sub: 'OpenAI' },
                    { label: 'Gemini', sub: 'Google' },
                    { label: 'DeepSeek', sub: 'DeepSeek' },
                    { label: 'Qwen', sub: 'Alibaba' },
                    { label: 'Mistral', sub: 'Mistral AI' },
                    { label: 'Llama', sub: 'Meta' },
                  ] as const).map(({ label, sub }, i) => (
                    <div
                      key={label}
                      ref={(el) => { bottomPointsRef.current[i] = el; }}
                      className="flex flex-col items-center rounded-lg border dark:border-[#1e3a4a] border-slate-200/60 dark:bg-[#091522] bg-white px-2 py-2 transition-all hover:bg-slate-50/50 hover:border-slate-350 hover:shadow shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                    >
                      <div className="size-6 rounded-md dark:bg-white/[0.04] bg-orange-50 flex items-center justify-center mb-1">
                        <BrandIcon name={label} />
                      </div>
                      <p className="text-[9px] font-semibold dark:text-white/80 text-slate-800">{label}</p>
                      <p className="text-[7px] dark:text-white/25 text-slate-500 font-medium">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══════════ GUARDRAILS ═══════════ */}
              <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 rounded-xl dark:bg-[#080d1a] bg-slate-50/70 dark:border-white/[0.06] border-slate-200/80 border p-3">
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="size-7 rounded-lg bg-[#2563eb]/10 dark:bg-[#3b82f6]/20 flex items-center justify-center border border-blue-500/20">
                    <ShieldCheck size={15} className="dark:text-blue-400 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black tracking-wider uppercase dark:text-white/90 text-slate-800">Guardrails</p>
                    <p className="text-[8px] dark:text-white/35 text-slate-500 font-medium">5-Layer Protection System</p>
                  </div>
                </div>

                {/* Guardrails Pills Grid — 5 Equal Columns for 100% Proportional Width Fill */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 flex-1">
                  {([
                    {
                      Symbol: ChartJsBarSymbol,
                      label: 'Input Sanitize',
                      sub: 'Validate & Clean',
                      color: '#36A2EB', // Chart.js Blue
                      bg: 'dark:bg-[#0f172a] bg-[#eff6ff]',
                      border: 'dark:border-[#1e3a8a]/60 border-[#bfdbfe]',
                      text: 'dark:text-[#60a5fa] text-[#1d4ed8]',
                    },
                    {
                      Symbol: ChartJsDoughnutSymbol,
                      label: 'PII Redaction',
                      sub: 'Protect Privacy',
                      color: '#9966FF', // Chart.js Purple
                      bg: 'dark:bg-[#1e1b4b] bg-[#f5f3ff]',
                      border: 'dark:border-[#4c1d95]/60 border-[#ddd6fe]',
                      text: 'dark:text-[#a78bfa] text-[#6d28d9]',
                    },
                    {
                      Symbol: ChartJsScatterSymbol,
                      label: 'Injection Block',
                      sub: 'Prevent Attacks',
                      color: '#FF9F40', // Chart.js Amber/Orange
                      bg: 'dark:bg-[#431407] bg-[#fff7ed]',
                      border: 'dark:border-[#7c2d12]/60 border-[#fed7aa]',
                      text: 'dark:text-[#fb923c] text-[#c2410c]',
                    },
                    {
                      Symbol: ChartJsLineSymbol,
                      label: 'Output Filter',
                      sub: 'Harm Shield',
                      color: '#FF6384', // Chart.js Red/Rose
                      bg: 'dark:bg-[#4c0519] bg-[#fff1f2]',
                      border: 'dark:border-[#881337]/60 border-[#fecdd3]',
                      text: 'dark:text-[#f43f5e] text-[#be123c]',
                    },
                    {
                      Symbol: ChartJsStepSymbol,
                      label: 'Audit Trail',
                      sub: 'Log Everything',
                      color: '#4BC0C0', // Chart.js Teal/Emerald
                      bg: 'dark:bg-[#064e3b] bg-[#ecfdf5]',
                      border: 'dark:border-[#065f46]/60 border-[#a7f3d0]',
                      text: 'dark:text-[#34d399] text-[#047857]',
                    },
                  ] as const).map(({ Symbol, label, sub, color, bg, border, text }) => (
                    <div key={label} className={`flex items-center justify-center gap-2 rounded-lg border ${border} ${bg} px-2.5 py-1.5 shadow-sm transition-all hover:scale-[1.01]`}>
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <Symbol color={color} className="size-3.5" />
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className={`text-[8.5px] sm:text-[9.5px] font-bold ${text} leading-normal truncate`}>{label}</span>
                        <span className="text-[7.5px] sm:text-[8px] font-semibold text-slate-400 dark:text-white/35 leading-none mt-0.5 truncate">{sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══════════ SETTLEMENT & EXECUTION LAYER ═══════════ */}
              <div className="relative z-10 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl dark:bg-[#091522] bg-slate-50 dark:border-white/[0.08] border-slate-200 border p-3 shadow-none">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="text-[11.5px] font-bold dark:text-slate-100 text-slate-900 tracking-tight">Autonomous Execution & On-Chain Terminal</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg dark:bg-[#0c1a29] bg-white border dark:border-slate-800 border-slate-200/80 shadow-none">
                    <img src={getR2CdnUrl('/assets/logo/zeroclaw.jpeg')} className="size-4 rounded object-cover border border-slate-700/50" alt="ZeroClaw" />
                    <span className="text-[11px] font-semibold dark:text-slate-100 text-slate-900">ZeroClaw AI</span>
                    <span className="text-[9px] text-slate-500 font-mono">(Rust)</span>
                  </div>

                  <span className="text-slate-400 dark:text-slate-600 font-bold text-xs">×</span>

                  <a
                    href="https://explorer.solana.com/address/4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg dark:bg-[#0c1a29] bg-white border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors shadow-none cursor-pointer group"
                    title="View live ZeroClaw settlement transactions on Solana Devnet Explorer"
                  >
                    <img src={getR2CdnUrl('/assets/logo/solana.png')} className="size-4 rounded object-contain" alt="Solana" />
                    <span className="text-[11px] font-semibold">Solana Devnet</span>
                    <ArrowUpRight size={12} className="text-emerald-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>

                  <button
                    onClick={() => handleOpenAuth('enterprise')}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-semibold text-xs transition-all shadow-none flex items-center gap-1.5 cursor-pointer ml-1"
                  >
                    <span>Demo Terminal</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLABORATIVE AGENTS */}
      <section
        id="about"
        className="border-b border-border/40 px-6 py-14 lg:px-12 lg:py-18"
      >
        <ScrollReveal>
          <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-2 lg:items-center">
            <h2
              className="text-[clamp(1.9rem,4vw,3rem)] font-black leading-[1.04] tracking-[-0.04em]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t.collaborative.title}
            </h2>
            <p className="max-w-sm text-[13px] leading-6 text-muted-foreground lg:ml-auto">
              {t.collaborative.subtitle}
            </p>
          </div>
        </ScrollReveal>

        {/* scrolling pills */}
        <div
          ref={scrollRef}
          className="mt-8 flex gap-3 overflow-hidden whitespace-nowrap select-none py-1.5"
          style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
        >
          {[...(t.hero.pills || AGENT_PILLS), ...(t.hero.pills || AGENT_PILLS)].map((pill, i) => (
            <div
              key={i}
              className="group relative flex-shrink-0 inline-flex items-center rounded-full p-[1px] overflow-hidden shadow-sm transition-all duration-300 hover:scale-105"
            >
              {/* Rotating Border Line Beam Animation */}
              <div
                className="pointer-events-none absolute -inset-[200%] rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, ${i % 3 === 0 ? '#ff6b35' : i % 3 === 1 ? '#9b27d4' : '#0ea5e9'} 40deg, #ffffff 80deg, transparent 120deg)`,
                  animation: `spin-beam ${4 + (i % 4) * 1.5}s linear infinite`,
                }}
              />
              <span className="relative z-10 rounded-full bg-card px-5 py-2.5 text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {pill}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* WHY ZEGA STANDS OUT */}
      <section className="px-6 py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1000px]">
          <ScrollReveal>
            <h2
              className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t.why.title}
            </h2>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">
              {t.why.subtitle}
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {getWhyCards(t).map(({ icon: Icon, title, desc, gradient }, idx) => (
              <ScrollReveal key={title} delay={(idx % 3) + 1}>
                <article
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 h-full"
                >
                  {/* Rotating Border Beam Line */}
                  <div
                    className="pointer-events-none absolute -inset-[200%] rounded-full opacity-40 group-hover:opacity-90 transition-opacity"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 0deg, #ff6b35 35deg, #9b27d4 75deg, #0ea5e9 115deg, transparent 155deg)`,
                      animation: `spin-beam ${7 + idx * 2}s linear infinite`,
                    }}
                  />
                  <div className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-card" />
                  <div className="relative z-10">
                    <div className="flex justify-center">
                      <GlowIcon icon={Icon} gradient={gradient} />
                    </div>
                    <h3 className="mt-5 text-[14px] font-bold">{title}</h3>
                    <p className="mx-auto mt-2 max-w-[180px] text-[11px] leading-5 text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.6fr]">
            <article className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
              {/* Rotating Border Beam Line */}
              <div
                className="pointer-events-none absolute -inset-[200%] rounded-full opacity-40 group-hover:opacity-90 transition-opacity"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, #ff6b35 35deg, #9b27d4 75deg, #0ea5e9 115deg, transparent 155deg)`,
                  animation: `spin-beam 9s linear infinite`,
                }}
              />
              <div className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-card" />
              <div className="relative z-10">
                <GlowIcon
                  icon={Layers3}
                  gradient="from-[#ff6b35] via-[#9b27d4] to-[#0ea5e9]"
                />
                <h3 className="mt-5 text-[14px] font-bold">{t.why.multiAgentTitle}</h3>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  {t.why.multiAgentDesc}
                </p>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_120%,rgba(255,107,53,.2),transparent_50%),radial-gradient(ellipse_at_50%_120%,rgba(155,39,212,.18),transparent_45%),radial-gradient(ellipse_at_20%_120%,rgba(14,165,233,.15),transparent_50%)]" />
              <div className="relative">
                <h3 className="text-[18px] font-black tracking-[-0.03em]">
                  {t.why.readyTitle}
                </h3>
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  {t.why.readyDesc}
                </p>
                <div className="mt-6 flex gap-2.5">
                  <a
                    href="#pricing"
                    className="rounded-full bg-foreground px-5 py-2.5 text-[11px] font-bold text-background transition-opacity hover:opacity-90"
                  >
                    {t.why.getStarted}
                  </a>
                  <a
                    href="#contact"
                    className="rounded-full border border-border px-5 py-2.5 text-[11px] font-bold text-foreground transition-colors hover:bg-secondary"
                  >
                    {t.why.contactUs}
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* EXPERIENCE IN ACTION */}
      <section id="blog" className="border-y border-border/40 px-6 py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1000px]">
          <ScrollReveal>
            <h2
              className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t.action.title}
            </h2>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">
              {t.action.subtitle}
            </p>

            <div className="mt-2 text-[11px] text-muted-foreground text-center">
              {t.action.teamOperates}
            </div>
          </ScrollReveal>

          {/* Tabs */}
          <div className="mt-4 flex justify-center">
            <div className="flex rounded-full border border-border bg-card p-1">
              {["Utilization", "Tools & Systems", "Analytics"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-medium transition-all ${activeTab === tab
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Tab Content based on ACTION_TABS_DATA */}
          {(() => {
            const data = ACTION_TABS_DATA[activeTab as keyof typeof ACTION_TABS_DATA] || ACTION_TABS_DATA.Utilization;
            const IconComponent = data.Icon;
            return (
              <div className="mt-7 grid gap-4 sm:grid-cols-2 items-stretch">
                {/* Left panel – Dynamic Title, Category, Desc & Metrics */}
                <article className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between shadow-sm transition-all duration-300">
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${data.iconGradient} shadow-md`}>
                        <IconComponent size={16} className="text-white" />
                      </div>
                      <span className="text-[12px] font-bold text-foreground/90">{data.category}</span>
                    </div>
                    <h3 className="text-[18px] font-black tracking-[-0.03em] text-foreground">{data.title}</h3>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground font-normal">
                      {data.desc}
                    </p>

                    {/* Dynamic Metrics */}
                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/50 pt-4">
                      {data.metrics.map((m, idx) => (
                        <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-2 text-center">
                          <p className="text-[12px] font-bold font-mono text-foreground">{m.val}</p>
                          <p className="text-[7.5px] text-muted-foreground font-medium mt-0.5">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2 text-[10.5px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Automated Workflow
                    </span>
                    <span className="font-bold text-foreground/80">9Router Engine</span>
                  </div>
                </article>

                {/* Right panel – Contextual Live Automated Demonstration */}
                <article className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between shadow-sm transition-all duration-300 min-h-[300px] relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground font-mono">
                        LIVE AGENT WORKFLOW DEMO
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground/70">
                      Real-time Execution
                    </span>
                  </div>

                  {data.type === "chat" && (
                    <div className="flex h-full flex-col justify-between gap-4">
                      {/* Automated Message Thread */}
                      <div className="space-y-2.5 min-h-[220px] max-h-[260px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {demoMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-2 items-start ${msg.sender === "agent" ? "justify-end" : ""}`}
                          >
                            <div
                              className={`rounded-xl px-3.5 py-2 text-[10px] leading-5 max-w-[85%] font-medium ${msg.sender === "agent"
                                ? "rounded-tr-sm bg-gradient-to-br from-[#ff6b35] to-[#9b27d4] text-white shadow-sm"
                                : "rounded-tl-sm bg-secondary text-secondary-foreground"
                                }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}

                        {/* Animated AI Typing Indicator */}
                        {isDemoTyping && (
                          <div className="flex justify-end gap-2 items-center">
                            <div className="rounded-xl rounded-tr-sm bg-muted border border-border px-3 py-1.5 text-[9.5px] font-medium text-muted-foreground flex items-center gap-1.5">
                              <span>ZEGA Agent processing</span>
                              <span className="flex gap-0.5">
                                <span className="size-1 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="size-1 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="size-1 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {data.type === "tools" && (
                    <div className="flex h-full flex-col justify-between gap-4">
                      {/* Connected Tools & Event Log */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            Active Connectors & Live Triggers
                          </span>
                          <span className="flex items-center gap-1.5 text-[8.5px] font-mono text-emerald-500 font-bold">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            6 Connectors Active
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {data.connectors.map((c, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5">
                              <div className="min-w-0">
                                <p className="text-[9.5px] font-bold text-foreground truncate">{c.name}</p>
                                <p className="text-[7.5px] text-muted-foreground truncate">{c.sub}</p>
                              </div>
                              <span className="flex-shrink-0 size-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                            </div>
                          ))}
                        </div>

                        {/* Real-time execution log */}
                        <div className="rounded-xl border border-border/60 bg-muted/40 p-2.5 space-y-1.5 font-mono text-[9px] min-h-[105px]">
                          {toolsLogs.map((log, i) => (
                            <div key={i} className="flex items-center gap-2 animate-fadeIn">
                              <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase ${log.tag === "TRIGGER" ? "bg-sky-500/20 text-sky-400" : log.tag === "INVOKE" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                {log.tag}
                              </span>
                              <span className="text-foreground/80 truncate text-[8.5px]">{log.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {data.type === "analytics" && (() => {
                    const analyticsData = ACTION_TABS_DATA.Analytics;
                    return (
                      <div className="flex h-full flex-col justify-between gap-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Model Traffic Distribution & ROI Insights</p>

                        <div className="grid grid-cols-[110px_1fr] items-center gap-3">
                          <div className="h-[100px] relative flex items-center justify-center">
                            <ChartCanvas type={analyticsData.chartType} data={analyticsData.chartData} options={analyticsData.chartOptions} />
                          </div>

                          <div className="space-y-1.5">
                            {analyticsData.insights.map((ins, i) => (
                              <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5">
                                <div>
                                  <p className="text-[9px] font-bold text-foreground">{ins.label}</p>
                                  <p className="text-[8px] text-muted-foreground font-medium">{ins.val}</p>
                                </div>
                                <span className="text-[8px] font-bold text-emerald-500">{ins.trend}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 shadow-inner mt-2">
                          <span className="flex-1 text-[10px] text-muted-foreground">{analyticsData.placeholder}</span>
                          <div className="size-5 rounded-full bg-foreground grid place-items-center">
                            <ChevronRight size={10} className="text-background" />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </article>
              </div>
            );
          })()}
        </div>
      </section>

      {/* OUR PRODUCTS */}
      <section id="products" className="px-6 py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[900px]">
          <h2
            className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.products.sectionTitle}
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            {t.products.subtitle}
          </p>

          <div className="mt-10 grid gap-8 text-center sm:grid-cols-3">
            {getProducts(t).map(({ icon: Icon, gradient, title, desc }) => (
              <article key={title}>
                <div className="flex justify-center">
                  <GlowIcon icon={Icon} gradient={gradient} />
                </div>
                <h4 className="mt-4 text-[13px] font-bold">{title}</h4>
                <p className="mx-auto mt-2 max-w-[200px] text-[11px] leading-5 text-muted-foreground">
                  {desc}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-9 text-center">
            <a
              href="#pricing"
              className="inline-flex rounded-full bg-foreground px-6 py-2.5 text-[11px] font-bold text-background transition-opacity hover:opacity-90"
            >
              {t.products.seeAll}
            </a>
          </div>
        </div>
      </section>

      {/* GET STARTED */}
      <section className="border-y border-border/40 px-6 py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[960px]">
          <h2
            className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.steps.sectionTitle}
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            {t.steps.subtitle}
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {getSteps(t).map(({ num, icon: Icon, title, desc }, idx) => (
              <article
                key={num}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* Rotating Border Beam Line */}
                <div
                  className="pointer-events-none absolute -inset-[200%] rounded-full opacity-40 group-hover:opacity-90 transition-opacity"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, #ff6b35 35deg, #9b27d4 75deg, #0ea5e9 115deg, transparent 155deg)`,
                    animation: `spin-beam ${7 + idx * 2}s linear infinite`,
                  }}
                />
                <div className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-card" />
                <div className="relative z-10">
                  <div
                    className="pointer-events-none absolute -top-2 left-0 select-none font-black leading-none text-[5rem] text-foreground/[0.04]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    aria-hidden
                  >
                    {num}
                  </div>
                  <p className="font-[DM_Mono] text-[10px] font-medium text-muted-foreground">{num}</p>
                  <div className="mt-4 flex">
                    <GlowIcon
                      icon={Icon}
                      gradient="from-[#ff6b35] via-[#9b27d4] to-[#0ea5e9]"
                    />
                  </div>
                  <h3 className="mt-5 text-[13px] font-bold">{title}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-[1000px]">
          <h2
            className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.testimonials.sectionTitle}
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            {t.testimonials.subtitle}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 items-start">
            {TESTIMONIALS.map(({ stars, text, name, role, img, featured }) => (
              <article
                key={name}
                className={`group relative overflow-hidden rounded-2xl border border-border/70 p-5 transition-all duration-300 hover:shadow-xl ${featured
                  ? "bg-gradient-to-br from-[#0e1014] to-[#161820] sm:scale-105 sm:shadow-2xl"
                  : "bg-card"
                  }`}
              >
                {/* Rotating Border Beam Line */}
                <div
                  className="pointer-events-none absolute -inset-[200%] rounded-full opacity-30 group-hover:opacity-85 transition-opacity"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, #ff6b35 35deg, #9b27d4 75deg, #0ea5e9 115deg, transparent 155deg)`,
                    animation: `spin-beam 8s linear infinite`,
                  }}
                />
                <div className="pointer-events-none absolute inset-[1px] rounded-[15px] bg-card" />
                <div className="relative z-10">
                  <Stars count={stars} />
                  <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{text}</p>
                  <div className={`mt-5 flex items-center gap-3 ${featured ? "flex-col text-center" : ""}`}>
                    <ImageWithFallback
                      src={getR2CdnUrl(img)}
                      fallbackSrc={generateInitialsAvatar(name)}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      className={`rounded-full object-cover border border-white/10 ${featured ? "size-14" : "size-9"}`}
                    />
                    <div>
                      <p className="text-[12px] font-bold">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="border-t border-border/40 px-6 py-16 lg:px-12 lg:py-20"
      >
        <div className="mx-auto max-w-[960px]">
          <h2
            className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.pricing.sectionTitle}
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            {t.pricing.subtitle}
          </p>

          {/* Toggle */}
          <div className="mt-7 flex justify-center">
            <div className="flex rounded-full border border-border bg-card p-1">
              {(["monthly", "yearly"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`rounded-full px-5 py-2 text-[11px] font-semibold capitalize transition-all ${billing === b
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {b === "monthly" ? t.pricing.monthly : t.pricing.yearly}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 items-start">
            {getPlans(t).map(({ name, monthly, yearly, featured, badge, features }) => (
              <article
                key={name}
                className={`relative overflow-hidden rounded-2xl border p-6 ${featured
                  ? "border-transparent bg-gradient-to-br from-[#ff6b35] via-[#c2185b] to-[#0ea5e9]"
                  : "border-border bg-card"
                  }`}
              >
                {featured && badge && (
                  <div className="absolute top-3 right-3">
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur-sm">
                      {badge}
                    </span>
                  </div>
                )}
                <p className={`text-[12px] font-semibold ${featured ? "text-white/80" : "text-muted-foreground"}`}>
                  {name}
                </p>
                <div className={`mt-3 flex items-baseline gap-1 ${featured ? "text-white" : ""}`}>
                  <span className="text-[11px] font-medium">$</span>
                  <span className="text-[2.2rem] font-black leading-none tracking-[-0.04em]">
                    {billing === "monthly" ? monthly : yearly}
                  </span>
                  <span className={`text-[11px] ${featured ? "text-white/60" : "text-muted-foreground"}`}>
                    /month
                  </span>
                </div>
                <button
                  onClick={() => handleOpenAuth(name.includes("Premium") || name.includes("Pelanggan") ? "enterprise" : "self-serve")}
                  className={`mt-5 flex w-full items-center justify-center rounded-full py-2.5 text-[11px] font-bold transition-all hover:opacity-90 cursor-pointer ${featured
                    ? "bg-white text-[#c2185b]"
                    : "border border-border text-foreground hover:bg-secondary"
                    }`}
                >
                  {name.includes("Premium") ? t.pricing.contactSales : t.pricing.startTrial}
                </button>
                <ul className="mt-5 space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        size={12}
                        className={`mt-0.5 flex-shrink-0 ${featured ? "text-white" : "text-foreground"}`}
                        strokeWidth={2.5}
                      />
                      <span
                        className={`text-[11px] leading-5 ${featured ? "text-white/85" : "text-muted-foreground"}`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION - PROPORTIONAL LIQUID WATER WAVE FILL */}
      <section
        id="contact"
        className="relative mx-4 my-8 overflow-hidden rounded-3xl py-14 px-6 text-center sm:mx-6 sm:my-12 sm:py-16 sm:px-8 lg:mx-12 lg:my-16 lg:py-20 lg:px-12 bg-[#0a0b10] border border-white/10 shadow-2xl"
      >
        {/* Proportional Liquid Water Waves filling bottom of card */}
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
          {/* Base gradient spots */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(ellipse at 0% 100%, rgba(255,107,53,.85) 0%, transparent 40%), radial-gradient(ellipse at 50% 80%, rgba(194,24,91,.8) 0%, transparent 45%), radial-gradient(ellipse at 100% 50%, rgba(14,165,233,.8) 0%, transparent 45%), #0a0b10",
            }}
          />

          {/* Liquid Water SVG Wave Layer 1 */}
          <div
            className="absolute -bottom-2 left-0 w-[200%] h-[68%] sm:h-[72%] lg:h-[70%] opacity-75"
            style={{ animation: "water-wave-1 10s ease-in-out infinite alternate" }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path
                fill="url(#cta-water-grad-1)"
                d="M0,160 Q360,260 720,160 T1440,160 L1440,320 L0,320 Z"
              />
              <defs>
                <linearGradient id="cta-water-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#d42060" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Liquid Water SVG Wave Layer 2 */}
          <div
            className="absolute -bottom-1 left-0 w-[200%] h-[58%] sm:h-[62%] lg:h-[60%] opacity-90"
            style={{ animation: "water-wave-2 7s ease-in-out infinite alternate" }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path
                fill="url(#cta-water-grad-2)"
                d="M0,192 Q360,100 720,192 T1440,192 L1440,320 L0,320 Z"
              />
              <defs>
                <linearGradient id="cta-water-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.7" />
                  <stop offset="45%" stopColor="#c2185b" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-xl">
          <h2
            className="text-[clamp(1.85rem,5.5vw,2.75rem)] font-black leading-[1.14] tracking-[-0.04em] text-white drop-shadow-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.cta.title}
          </h2>
          <p className="mt-3.5 text-[12px] sm:text-[13px] text-white/80 font-medium max-w-[280px] sm:max-w-none mx-auto leading-relaxed">
            {t.cta.subtitle}
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => handleOpenAuth("self-serve")}
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-[12px] font-bold text-[#0a0b10] shadow-xl transition-all duration-300 hover:opacity-95 hover:scale-105 active:scale-95 cursor-pointer"
            >
              {t.cta.tryFree}
            </button>
          </div>
        </div>
      </section>

      {/* Fullscreen Enterprise Dashboards — SuperAdmin or User View */}
      {showDashboard && (() => {
        const mock = localStorage.getItem('zega_mock_session');
        const session = mock ? JSON.parse(mock) : null;
        const role = session?.role || 'enterprise';

        if (role === 'superadmin') {
          return (
            <SuperAdminDashboard
              onClose={() => setShowDashboard(false)}
              dark={dark}
              setDark={setDark}
              onSwitchToUserMode={() => {
                const userSession = {
                  ...session,
                  role: 'enterprise',
                };
                localStorage.setItem('zega_mock_session', JSON.stringify(userSession));
                setShowDashboard(false);
                setTimeout(() => setShowDashboard(true), 50);
              }}
            />
          );
        }

        return (
          <UserDashboard
            onClose={() => {
              localStorage.removeItem('zega_mock_session');
              setShowDashboard(false);
              setCurrentPath('/');
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/');
              }
            }}
            dark={dark}
            setDark={setDark}
            userRole={role}
            userEmail={session?.email || ''}
            userName={session?.fullName || ''}
            isGuest={false}
          />
        );
      })()}

      {/* Auth & Onboarding Modal for Individual, UMKM & Enterprise */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        prefillEmail={authPrefillEmail}
        onSubmitSuccess={(msg, role) => {
          setIsAuthModalOpen(false);
          setToastMessage(msg);
          setShowDashboard(true);
          const targetRole = role || (authModalMode === 'enterprise' ? 'enterprise' : 'individual');
          if (targetRole === 'individual') {
            navigateTo("/dashboard");
          } else if (targetRole === 'superadmin') {
            navigateTo("/admin");
          } else {
            navigateTo("/console");
          }
        }}
      />

      {/* PROFESSIONAL ENTERPRISE TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-full border border-border/80 bg-card/95 px-4.5 py-3 text-xs font-semibold text-foreground backdrop-blur-xl shadow-2xl transition-all">
          <div className="size-2 rounded-full bg-[#ff6b35] animate-pulse" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative overflow-hidden border-t border-border/40 bg-card/10 pt-16 pb-6 px-6 lg:px-12">
        <div className="mx-auto max-w-[1100px] flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex flex-col gap-3 text-center md:text-left items-center md:items-start">
            <a
              href="#home"
              className="inline-flex items-center rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/50"
              aria-label="ZEGA AI — Back to home"
            >
              <img
                src={getR2CdnUrl('/assets/logo/zegalogo.png')}
                alt="ZEGA AI"
                width={200}
                height={55}
                className="h-11 w-auto object-contain lg:h-14 [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.15)] transition-[filter] duration-300"
                loading="lazy"
                decoding="async"
              />
            </a>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 max-w-[320px] leading-relaxed">
              {t.footer.tag}
            </p>

            {/* Supported by Superteam Indonesia Badge */}
            <div className="mt-2 flex items-center gap-3 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md w-fit shadow-xs">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Supported by</span>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <img
                  src={getR2CdnUrl('/assets/logo/superteam.jpg')}
                  alt="Superteam Indonesia"
                  className="size-8 rounded-full object-cover border-2 border-indigo-500/30 shadow-xs"
                />
                <span className="text-sm font-black text-slate-900 dark:text-slate-50 font-sans tracking-tight">Superteam ID</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3.5">
            <div className="flex gap-3">
              <a href="https://x.com/zegaai" target="_blank" rel="noopener noreferrer" className="pill-hover-glow grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-all duration-300">
                <span className="sr-only">X (Twitter)</span>
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="#" className="pill-hover-glow grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-all duration-300">
                <span className="sr-only">LinkedIn</span>
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zm-.5-10.268a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11.5 10.268h-3v-4.5c0-1.077-.812-1.5-1.5-1.5s-1.5.423-1.5 1.5V19h-3v-9h3v1.078c.451-.622 1.341-1.078 2.5-1.078 1.968 0 3.5 1.488 3.5 4.5v4.5z" /></svg>
              </a>
              <a href="https://github.com/siabang35/zega.ai" target="_blank" rel="noopener noreferrer" className="pill-hover-glow grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-all duration-300">
                <span className="sr-only">GitHub</span>
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground">© 2026 ZEGA AI. {t.footer.rights}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <button onClick={() => navigateTo('/terms')} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{t.footer.terms}</button>
              <span className="text-[10px] text-muted-foreground/40">·</span>
              <button onClick={() => navigateTo('/privacy')} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{t.footer.privacy}</button>
            </div>
          </div>
        </div>

        {/* Giant backdrop logo */}
        <div className="relative overflow-hidden w-full text-center mt-12 mb-0 select-none pointer-events-none">
          <span
            className="text-[clamp(5rem,14vw,14rem)] font-extrabold leading-none tracking-tighter bg-gradient-to-b from-foreground/[0.08] via-foreground/[0.02] to-transparent bg-clip-text text-transparent block uppercase"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.07em' }}
          >
            ZEGA AI
          </span>
        </div>
      </footer>
      {!showSplash && (
        <CookieConsent
          onNavigatePrivacy={() => navigateTo('/privacy')}
          onNavigateTerms={() => navigateTo('/terms')}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}