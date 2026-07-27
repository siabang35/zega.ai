import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
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
  Layers3,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  Network,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Sun,
  Tag,
  TrendingUp,
  UserRoundPlus,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { DocsPage } from "./DocsPage";
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

const WHY_CARDS = [
  {
    icon: Sparkles,
    title: "Speed",
    desc: "Get quicker results with our enterprise AI solutions and AI agent marketplace.",
    gradient: "from-[#ff6b35] via-[#e8295a] to-[#9b27d4]",
  },
  {
    icon: Layers3,
    title: "Management",
    desc: "Harness the capabilities of a standardized platform designed to meet every demand.",
    gradient: "from-[#9b27d4] via-[#4f46e5] to-[#0ea5e9]",
  },
  {
    icon: Network,
    title: "Adaptability",
    desc: "We take an ecosystem-first approach, so you have the flexibility to decide.",
    gradient: "from-[#0ea5e9] via-[#4f46e5] to-[#9b27d4]",
  },
];

const PRODUCTS = [
  {
    icon: Bot,
    gradient: "from-[#ff6b35] to-[#9b27d4]",
    title: "Intelligent Agents",
    desc: "Deploy pre-built AI workers for HR, Finance, and IT, customized to your brand voice.",
  },
  {
    icon: Network,
    gradient: "from-[#9b27d4] to-[#4f46e5]",
    title: "Workflow Orchestrator",
    desc: "Visualize complex processes and automate triggers without writing a single line of code.",
  },
  {
    icon: BarChart3,
    gradient: "from-[#4f46e5] to-[#0ea5e9]",
    title: "Data Analytics",
    desc: "Real-time insights into agent performance and enterprise ROI tracking.",
  },
];

const STEPS = [
  {
    num: "01",
    icon: UserRoundPlus,
    title: "Sign Up & Connect",
    desc: "Securely connect the systems you are ready to orchestrate with your enterprise.",
  },
  {
    num: "02",
    icon: Wrench,
    title: "Configure Agents",
    desc: "Set objectives, policies, and meaningful approval gates for your AI agents.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Deploy & Scale",
    desc: "Launch, observe, and expand agents safely across the entire group.",
  },
];

const TESTIMONIALS = [
  {
    stars: 4,
    text: "This AI platform completely transformed the way we operate. What once required manual effort and oversight can now be fully automated, allowing my team to focus on what really matters. The results have been remarkable, helping us achieve our goals and drive gains.",
    name: "Sarah M. Harvey",
    role: "CTO, GlobalVentures",
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80&h=80&fit=crop&crop=face",
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
  },
];

const PLANS = [
  {
    name: "Basic Plan",
    monthly: 20,
    yearly: 16,
    featured: false,
    features: [
      "Up to 2 AI agents",
      "10,000 requests/month",
      "Basic analytics",
      "Email support",
      "Trusted by over 500 teams",
    ],
  },
  {
    name: "Pro Plan",
    monthly: 40,
    yearly: 32,
    featured: true,
    badge: "Most Popular",
    features: [
      "Get full access to 20 agents",
      "Unlimited requests/month",
      "Essential integrations",
      "Dedicated support",
      "Save $80/year upgrading early",
    ],
  },
  {
    name: "Premium",
    monthly: 99,
    yearly: 79,
    featured: false,
    features: [
      "White-label option",
      "SLA guarantee",
      "Custom integrations",
      "Dedicated support",
      "Your next major opportunity",
    ],
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
          el.classList.add("revealed");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
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
    case "9Router":
    case "9Router Engine":
      return <img src="/assets/visualization/9router.jpeg" className="size-5.5 rounded-md object-cover" alt="9Router Engine" />;
    case "Google Maps":
      return <img src="/assets/visualization/gmaps.webp" className="size-5.5 rounded-md object-contain" alt="Google Maps" />;
    case "WhatsApp Business":
      return <img src="/assets/visualization/whatsapp.jpeg" className="size-5.5 rounded-md object-contain" alt="WhatsApp Business" />;
    case "Stripe Connect":
      return <img src="/assets/visualization/stripe.webp" className="size-5.5 rounded-md object-contain" alt="Stripe Connect" />;
    case "x402 Protocol":
      return <img src="/assets/visualization/x402.jpg" className="size-5.5 rounded-md object-contain" alt="x402 Protocol" />;
    case "Meta API":
      return <img src="/assets/visualization/metaapi.png" className="size-5.5 rounded-md object-contain" alt="Meta API" />;
    case "Supabase":
      return (
        <svg className="size-4" viewBox="0 0 24 24" fill="none">
          <path d="M13.35 2.05a1.2 1.2 0 00-1.7.25L3.3 14.5A1.2 1.2 0 004.3 16.3h7.8l-1.45 5.65a1.2 1.2 0 001.7-.25l8.35-12.2a1.2 1.2 0 00-1-1.8h-7.8l1.45-5.65z" fill="#3ECF8E" />
        </svg>
      );
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
      return (
        <svg className="size-4 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
        </svg>
      );
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

  useEffect(() => {
    const t1 = setTimeout(() => setStage('fade'), 900);
    const t2 = setTimeout(() => {
      setStage('done');
      onComplete();
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (stage === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#060913] text-white transition-opacity duration-500 ease-out transform-gpu ${stage === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      {/* Ambient background glow spot */}
      <div className="absolute size-[350px] rounded-full bg-gradient-to-r from-[#ff6b35]/20 to-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* GPU Clip-Path 60FPS Typewriter Animation */}
      <div className="relative z-10 flex items-center justify-center px-4">
        <div className="relative overflow-hidden">
          <img
            src="/assets/logo/zegalogo.png"
            alt="ZEGA AI"
            className="h-12 sm:h-16 w-auto object-contain brightness-0 invert filter drop-shadow-[0_4px_20px_rgba(255,255,255,0.35)] animate-[zegaTypewriter_0.8s_cubic-bezier(0.25,1,0.5,1)_forwards]"
          />
        </div>
        {/* Blinking Typewriter Cursor Line */}
        <div className="h-10 sm:h-14 w-[3.5px] bg-[#ff6b35] animate-pulse rounded-full shadow-[0_0_16px_#ff6b35] flex-shrink-0 ml-1.5" />
      </div>
    </div>
  );
};

const VIZ_TAB_DATA = {
  Agent: {
    title: "",
    sub: "Enterprise Autonomous Agent Orchestrator",
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
      { label: "9Router Efficiency", val: "62% low-cost routing", trend: "+14.2%" },
      { label: "Avg Resolution", val: "142ms per step", trend: "-18ms" },
      { label: "Accuracy Score", val: "99.9% verified", trend: "+0.3%" },
    ],
    placeholder: "Ask for analytics report or metric breakdown...",
  },
};

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== "undefined" && !hasShownSplash) {
      hasShownSplash = true;
      return true;
    }
    return false;
  });
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState("Utilization");
  const [vizTab, setVizTab] = useState<"Agent" | "Integration" | "Automation" | "Memory">("Agent");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
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

  const triggerComingSoon = (msg = "Coming Soon — ZEGA AI Enterprise Sign Up will open shortly.") => {
    if (email && email.trim() !== "") {
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isEmailValid) {
        msg = "Please enter a valid email address.";
      } else {
        msg = `White-listed! ${email} is registered for ZEGA AI early access.`;
        setEmail("");
        setEmailTouched(false);
      }
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

  if (showDocs) {
    return (
      <DocsPage
        onBack={() => setShowDocs(false)}
        dark={dark}
        setDark={setDark}
        triggerComingSoon={triggerComingSoon}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-background font-[Inter,sans-serif] text-foreground antialiased"
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}
    >
      {showSplash && <ZegaSplashLoader onComplete={() => setShowSplash(false)} />}

      {/* NAV */}
      <header className="sticky top-0 z-50 h-[60px] border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6 lg:px-12">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              if (showDocs) setShowDocs(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex-shrink-0 flex items-center rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/50 cursor-pointer"
            aria-label="ZEGA AI — Back to home"
          >
            <img
              src="/assets/logo/zegalogo.png"
              alt="ZEGA AI"
              width={140}
              height={40}
              className="h-8 w-auto object-contain lg:h-9 [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.15)] transition-[filter] duration-300"
              loading="eager"
              decoding="async"
            />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted-foreground md:flex">
            {NAV_LINKS.map((l) => {
              const isDocsActive = l === "Docs" && showDocs;
              return (
                <a
                  key={l}
                  href={l === "Docs" ? "#docs" : `#${l.toLowerCase()}`}
                  onClick={(e) => {
                    if (l === "Docs") {
                      e.preventDefault();
                      setShowDocs(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      if (showDocs) setShowDocs(false);
                      if (l === "Products") {
                        e.preventDefault();
                        setTimeout(() => {
                          const el = document.getElementById("products");
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth" });
                          }
                        }, 50);
                      }
                    }
                  }}
                  className={`nav-link-animated transition-colors hover:text-foreground ${isDocsActive ? "text-[#ff6b35] font-bold" : ""
                    }`}
                >
                  {l}
                </a>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="pill-hover-glow grid size-8 place-items-center rounded-full border border-border/80 bg-card/50 text-muted-foreground transition-all duration-300 hover:border-foreground/30 hover:text-foreground"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Sign Up CTA Button — Premium */}
            <button
              onClick={() => triggerComingSoon()}
              className="group relative hidden items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff6b35] bg-[length:200%_100%] px-5 py-2 text-[12px] font-bold text-white shadow-lg shadow-[#ff6b35]/30 transition-all duration-500 hover:bg-right hover:shadow-xl hover:shadow-[#ff6b35]/40 hover:scale-[1.04] active:scale-95 sm:inline-flex cursor-pointer"
            >
              <span className="relative z-10">Sign Up</span>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid size-8 place-items-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu — Enterprise Best Practice Redesign */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[60px] z-40 border-b border-border/60 bg-background/95 p-5 backdrop-blur-2xl shadow-2xl transition-all md:hidden animate-fadeIn">
          <div className="mx-auto flex max-w-md flex-col gap-1.5">
            {[
              { label: "Home", sub: "Platform Overview & Features", Icon: Home, href: "#home" },
              { label: "Products", sub: "Core AI Engines & Guardrails", Icon: Layers3, href: "#products" },
              { label: "Docs", sub: "Developer Guides & API Spec", Icon: BookOpen, href: "#docs" },
              { label: "Pricing", sub: "Flexible Enterprise Tiers", Icon: Tag, href: "#pricing" },
            ].map(({ label, sub, Icon, href }) => (
              <a
                key={label}
                href={href}
                className="group flex items-center justify-between rounded-xl p-3 transition-all hover:bg-muted/60 active:scale-[0.99]"
                onClick={(e) => {
                  setMobileOpen(false);
                  if (label === "Docs") {
                    e.preventDefault();
                    setShowDocs(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    if (showDocs) setShowDocs(false);
                    if (label === "Products") {
                      e.preventDefault();
                      setTimeout(() => {
                        const el = document.getElementById("products");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 50);
                    }
                  }
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="grid size-9 flex-shrink-0 place-items-center rounded-xl border border-border/60 bg-card text-foreground/80 group-hover:border-[#ff6b35]/40 group-hover:text-[#ff6b35] transition-all">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground leading-tight group-hover:text-[#ff6b35] transition-colors">{label}</p>
                    <p className="text-[10px] text-muted-foreground font-normal mt-0.5">{sub}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}

            {/* Mobile Footer CTAs & Operational Status */}
            <div className="mt-3 border-t border-border/50 pt-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="w-full rounded-xl border border-border bg-card py-2.5 text-[11px] font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition-all cursor-pointer"
                  onClick={() => {
                    setMobileOpen(false);
                    setShowDocs(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  View Docs
                </button>
                <button
                  className="group relative w-full flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff6b35] bg-[length:200%_100%] py-2.5 text-[11px] font-bold text-white shadow-md shadow-[#ff6b35]/20 hover:bg-right active:scale-[0.98] transition-all cursor-pointer"
                  onClick={() => {
                    setMobileOpen(false);
                    triggerComingSoon();
                  }}
                >
                  <span className="relative z-10">Sign Up</span>
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/40 py-1.5 text-[9.5px] font-mono text-muted-foreground">
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

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden px-6 pb-0 pt-16 text-center lg:px-12 lg:pt-22"
      >
        {/* Harmonious Multi-Tone Ambient Glow Aura */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden">
          {/* Main Top Center Radial Glow */}
          <div className="h-[420px] w-[960px] rounded-full dark:bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.22)_0%,rgba(194,24,91,0.16)_35%,rgba(14,165,233,0.12)_60%,transparent_80%)] bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.05)_0%,rgba(244,114,182,0.03)_40%,rgba(56,189,248,0.03)_70%,transparent_85%)] blur-3xl" />
          {/* Subtle Accent Flairs */}
          <div className="absolute -top-10 left-1/4 h-[300px] w-[300px] rounded-full dark:bg-[#ff6b35]/15 bg-[#ff6b35]/03 blur-[90px]" />
          <div className="absolute -top-10 right-1/4 h-[300px] w-[300px] rounded-full dark:bg-[#0ea5e9]/15 bg-[#0ea5e9]/03 blur-[90px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl">
          <h1
            className="hero-text-reveal text-[clamp(2.4rem,5.5vw,4.2rem)] font-light leading-[1.06] tracking-[-0.04em] text-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tailored Plans for Every
            <br />
            <span className="font-black dark:text-white text-slate-900">
              Enterprise Need
            </span>
          </h1>
          <p className="hero-text-reveal hero-text-reveal-delay-1 mx-auto mt-4 max-w-md text-[13.5px] leading-relaxed text-muted-foreground font-normal">
            Flexible plans that fit your workflow and scale seamlessly with your enterprise.
          </p>

          {/* Interactive Glass Input Pill */}
          <div className={`hero-text-reveal hero-text-reveal-delay-2 mx-auto mt-8 flex max-w-[380px] items-center overflow-hidden rounded-full border p-1.5 backdrop-blur-xl shadow-xl transition-all duration-300 ${emailTouched && email.trim() !== ""
            ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
              ? 'border-emerald-500/50 shadow-[#10b981]/10 bg-white/90 dark:bg-card/90'
              : 'border-rose-500/50 shadow-[#f43f5e]/10 bg-white/90 dark:bg-card/90'
            : 'border-border/80 focus-within:border-[#ff6b35]/60 focus-within:shadow-[#ff6b35]/10 dark:border-white/10 dark:bg-white/[0.03] bg-white/80'
            }`}>
            <Mail size={14} className={`ml-3.5 transition-colors ${emailTouched && email.trim() !== ""
              ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ? 'text-emerald-500'
                : 'text-rose-500'
              : 'dark:text-white/30 text-slate-400'
              }`} />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailTouched(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") triggerComingSoon();
              }}
              placeholder="Enter Your Email"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/75 focus:outline-none"
            />
            <button
              onClick={() => triggerComingSoon()}
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff6b35] bg-[length:200%_100%] px-6 py-2.5 text-[11px] font-bold text-white shadow-md shadow-[#ff6b35]/25 transition-all duration-500 hover:bg-right hover:shadow-lg hover:shadow-[#ff6b35]/35 hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <span className="relative z-10">Join ZEGA</span>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </div>
        </div>

        {/* ORCHESTRATION FLOW VISUALIZATION */}
        <div className="relative mx-auto mt-12 w-full max-w-[1200px] px-2">
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
          <div ref={containerRef} className="relative rounded-2xl border dark:border-white/[0.06] border-gray-200/80 dark:bg-[#0a0e1a]/90 bg-white/70 backdrop-blur-xl p-3 sm:p-5 lg:p-6 overflow-hidden shadow-2xl dark:shadow-black/50 shadow-gray-200/40">
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

                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
                    let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

                    if (isMobile) {
                      const isRightColumn = i % 2 === 1;
                      if (isRightColumn) {
                        // Right column cards curve into right margin, stream down right edge, and curve left into leftHub
                        cp1x = x1 + 18;
                        cp1y = y1;
                        cp2x = Math.max(x1 + 25, x2 + 120);
                        cp2y = Math.max(y2 - 25, y1 + 30);
                      } else {
                        // Left column cards curve into central gutter and stream down into leftHub
                        cp1x = x1 + 14;
                        cp1y = y1;
                        cp2x = x2 + 10;
                        cp2y = Math.max(y2 - (y2 - y1) * 0.4, y1 + 15);
                      }
                    } else {
                      cp1x = x1 + (x2 - x1) * 0.55;
                      cp1y = y1;
                      cp2x = x1 + (x2 - x1) * 0.45;
                      cp2y = y2;
                    }

                    const isLeftActive = vizTab === 'Agent' || vizTab === 'Integration' || vizTab === 'Automation';
                    const strokeOpacity2 = isLeftActive ? 0.9 : 0.2;
                    return (
                      <g key={`dyn-l2-${i}`} fill="none" className="transition-opacity duration-350">
                        {!isMobile && (
                          <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth="3" strokeOpacity={isLeftActive ? 0.12 : 0.02} fill="none" style={{ animationDelay: `${i * 0.08}s` }} />
                        )}
                        <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth={isMobile ? "1.2" : "0.85"} strokeOpacity={strokeOpacity2} fill="none" style={{ animationDelay: `${i * 0.08}s` }} />
                      </g>
                    );
                  })}

                  {/* Dynamic right lines fanning from connection hub (Layer 4 Shield Hub -> AI Agents) */}
                  {coords.rightPoints.map((pt, i) => {
                    if (!pt || (pt.x === 0 && pt.y === 0) || !coords.rightHub) return null;
                    const color = i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#e8295a" : "#38bdf8";

                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
                    const x1 = isMobile ? pt.x : coords.rightHub.x;
                    const y1 = isMobile ? pt.y : coords.rightHub.y;
                    const x2 = isMobile ? coords.rightHub.x : pt.x;
                    const y2 = isMobile ? coords.rightHub.y : pt.y;

                    let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

                    if (isMobile) {
                      cp1x = x1 + 20;
                      cp1y = y1;
                      cp2x = x2 + 20;
                      cp2y = Math.max(y2 - 20, y1 + 20);
                    } else {
                      cp1x = x1 + (x2 - x1) * 0.45;
                      cp1y = y1;
                      cp2x = x1 + (x2 - x1) * 0.55;
                      cp2y = y2;
                    }

                    const isRightActive = vizTab === 'Agent' || vizTab === 'Automation' || vizTab === 'Memory';
                    const strokeOpacity2 = isRightActive ? 0.9 : 0.15;
                    return (
                      <g key={`dyn-l4-${i}`} fill="none" className="transition-opacity duration-350">
                        {!isMobile && (
                          <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth="3" strokeOpacity={isRightActive ? 0.12 : 0.02} fill="none" style={{ animationDelay: `${i * 0.15}s` }} />
                        )}
                        <path d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`} className="orch-line" stroke={color} strokeWidth={isMobile ? "1.2" : "0.85"} strokeOpacity={strokeOpacity2} fill="none" style={{ animationDelay: `${i * 0.15}s` }} />
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
              <p className="text-[8px] font-bold tracking-[0.2em] uppercase dark:text-[#818cf8]/60 text-indigo-400 mb-2">Layer 1 · Event Sources</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                    className="flex items-center gap-2 rounded-lg border dark:border-white/[0.06] border-gray-200/80 dark:bg-white/[0.02] bg-white/80 px-3 py-2 transition-all hover:dark:bg-white/[0.04] hover:bg-white hover:shadow-sm"
                  >
                    <Icon size={14} className="flex-shrink-0 dark:text-[#818cf8] text-indigo-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold dark:text-white/85 text-gray-800 truncate">{label}</p>
                      <p className="text-[7.5px] dark:text-white/30 text-gray-400 truncate">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══════════ LAYER 2+3+4 — MAIN ORCHESTRATION ═══════════ */}
            <div className="orch-fade relative z-10 grid grid-cols-1 lg:grid-cols-[24%_52%_24%] justify-between gap-3 lg:gap-0 items-center">

              {/* LEFT — Layer 2: Integrations */}
              <div className="relative z-10">
                <p className="text-[8px] font-bold tracking-[0.2em] uppercase dark:text-emerald-400/60 text-emerald-500 mb-1 text-center lg:text-left">Layer 2 · Integrations</p>
                <p className="text-[7px] dark:text-white/20 text-gray-400 mb-2.5 text-center lg:text-left border-b lg:border-0 border-border/40 pb-2 lg:pb-0 mb-3 lg:mb-2.5">Connected tools and services</p>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:block gap-2.5 lg:space-y-1.5">
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
                    <div key={name} className="flex items-center justify-between rounded-lg border dark:border-[#1e3a4a] border-slate-200/60 dark:bg-[#091522] bg-white px-2.5 py-2 transition-all hover:dark:bg-[#0c1e30] hover:bg-slate-50/50 hover:border-slate-300 hover:shadow-md">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex-shrink-0 size-7 rounded-md dark:bg-white/[0.04] bg-indigo-50 flex items-center justify-center">
                          <BrandIcon name={name} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold dark:text-white/85 text-slate-800 truncate">{name}</p>
                          <p className="text-[7.5px] dark:text-white/30 text-slate-500 font-medium truncate">{sub}</p>
                        </div>
                      </div>
                      <span
                        ref={(el) => { leftPointsRef.current[i] = el; }}
                        className="size-1.5 rounded-full bg-emerald-400 animate-pulse ml-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Dotted Connection Line */}
              <div className="flex lg:hidden justify-center my-3.5">
                <svg width="2" height="24" className="dark:opacity-30 opacity-20">
                  <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="orch-line" />
                </svg>
              </div>

              {/* CENTER — Layer 3: ZEGA AI Orchestrator */}
              <div className="relative z-10 w-full max-w-[490px] mx-auto my-3 lg:my-0 lg:px-2">
                <div ref={topHubRef} className="relative rounded-2xl border dark:border-[#ff6b35]/35 border-orange-200 dark:bg-[#091422] bg-white overflow-visible shadow-[0_8px_32px_rgba(255,107,53,0.08),0_1px_3px_rgba(0,0,0,0.02)] transition-all">
                  {/* LEFT HUB NODE BADGE — GLOWING ORANGE/RED */}
                  <div ref={leftHubRef} className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full border-2 border-[#ff6b35] dark:bg-[#1a0a14] bg-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] dark:shadow-[0_0_16px_rgba(255,107,53,0.8)] items-center justify-center">
                    <Database size={13} className="text-[#ff6b35]" />
                  </div>

                  {/* RIGHT HUB NODE BADGE — GLOWING ORANGE/RED */}
                  <div ref={rightHubRef} className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 size-8 rounded-full border-2 border-[#ff6b35] dark:bg-[#1a0a14] bg-white shadow-[0_4px_12px_rgba(255,107,53,0.25)] dark:shadow-[0_0_16px_rgba(255,107,53,0.8)] items-center justify-center">
                    <ShieldCheck size={13} className="text-[#ff6b35]" />
                  </div>

                  {/* Tabs bar — Fixed height 40px */}
                  <div className="flex h-[40px] border-b dark:border-white/[0.06] border-gray-200/80 rounded-t-2xl overflow-hidden bg-slate-50/50 dark:bg-transparent">
                    {(['Agent', 'Integration', 'Automation', 'Memory'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setVizTab(tab)}
                        className={`flex-1 py-2.5 text-[9.5px] sm:text-[10px] font-semibold tracking-wide transition-all duration-200 ease-out cursor-pointer transform-gpu active:scale-98 ${vizTab === tab
                          ? 'dark:text-white text-gray-900 dark:bg-white/[0.06] bg-white border-b-2 border-[#ff6b35] dark:border-[#ff6b35] font-bold shadow-xs'
                          : 'dark:text-white/40 text-gray-400 hover:dark:text-white/70 hover:text-gray-600'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Smooth Animated Tab Content Container */}
                  <div key={vizTab} className="animate-fadeIn transition-opacity duration-300 transform-gpu will-change-[opacity]">
                    {/* Logo + Title — Fixed Height 76px Header across all tabs */}
                    <div className="flex flex-col items-center h-[76px] justify-center px-4 pt-3.5 pb-2">
                      <img
                        src="/assets/logo/zegalogo.png"
                        alt="ZEGA AI"
                        className="h-7 sm:h-8 w-auto object-contain transition-[filter] duration-300 dark:[filter:invert(1)_hue-rotate(180deg)] dark:drop-shadow-[0_1px_8px_rgba(255,255,255,0.08)]"
                      />
                      {VIZ_TAB_DATA[vizTab].title && (
                        <h3 className="mt-1 text-[13px] sm:text-[14px] font-bold dark:text-white/95 text-slate-800 tracking-tight">
                          {VIZ_TAB_DATA[vizTab].title}
                        </h3>
                      )}
                      <p className="mt-0.5 text-[8.5px] sm:text-[9px] dark:text-white/40 text-slate-500 font-semibold text-center">
                        {VIZ_TAB_DATA[vizTab].sub}
                      </p>
                    </div>

                    {/* Workflow Pipeline — Fixed 235px Height across all tabs */}
                    <div className="px-4 sm:px-5 pb-3 space-y-1.5 h-[235px] flex flex-col justify-center transition-all duration-300">
                      {VIZ_TAB_DATA[vizTab].items.map(({ Icon, label, sub }, idx) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 rounded-xl dark:bg-[#0a1622] bg-slate-50/50 border dark:border-[#1e3a4a]/70 border-slate-200/80 px-3 py-1.8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm transform-gpu"
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          <Icon size={13} className="flex-shrink-0 dark:text-[#818cf8]/80 text-indigo-550" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-[10.5px] font-semibold dark:text-white/85 text-gray-800">{label}</p>
                            <p className="text-[7.5px] sm:text-[8px] dark:text-white/30 text-slate-500 font-medium">{sub}</p>
                          </div>
                          <Check size={12} className="flex-shrink-0 dark:text-emerald-400/80 text-emerald-500" />
                        </div>
                      ))}
                    </div>

                    {/* Live status bar — Fixed Height 38px */}
                    <div className="flex items-center justify-between px-4 sm:px-5 h-[38px] border-t dark:border-white/[0.05] border-gray-100 dark:bg-white/[0.01] bg-slate-50/50 rounded-b-2xl">
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

              {/* Mobile Dotted Connection Line */}
              <div className="flex lg:hidden justify-center my-3.5">
                <svg width="2" height="24" className="dark:opacity-30 opacity-20">
                  <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="orch-line" />
                </svg>
              </div>

              {/* RIGHT — Layer 4: AI Agents */}
              <div className="relative z-10">
                <p className="text-[8px] font-bold tracking-[0.2em] uppercase dark:text-[#0ea5e9]/60 text-sky-500 mb-1 text-center lg:text-left">Layer 4 · AI Agents</p>
                <p className="text-[7px] dark:text-white/20 text-gray-400 mb-2.5 text-center lg:text-left border-b lg:border-0 border-border/40 pb-2 lg:pb-0 mb-3 lg:mb-2.5">Autonomous agents working on your business</p>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:block gap-2.5 lg:space-y-1.5">
                  {([
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
                      className="flex items-center gap-2.5 rounded-lg border dark:border-[#1e3a4a] border-slate-200/60 dark:bg-[#091522] bg-white px-2.5 py-2 transition-all hover:dark:bg-[#0c1e30] hover:bg-slate-50/50 hover:border-slate-300 hover:shadow-md"
                    >
                      <div className={`flex-shrink-0 size-7 rounded-md flex items-center justify-center ${active ? 'dark:bg-sky-500/10 bg-sky-50' : 'dark:bg-white/[0.03] bg-slate-50'}`}>
                        <Icon size={13} className={active ? 'dark:text-sky-400 text-sky-600' : 'dark:text-white/25 text-slate-400'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] font-semibold dark:text-white/85 text-slate-800 truncate">{name}</p>
                          <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[6.5px] font-bold uppercase tracking-wider ${active ? 'dark:bg-emerald-500/15 bg-emerald-50 dark:text-emerald-400 text-emerald-600 dark:border-emerald-500/20 border-emerald-200' : 'dark:bg-white/[0.04] bg-slate-100 dark:text-white/30 text-slate-400 border dark:border-white/[0.05] border-slate-200'}`}>{active ? 'Active' : 'Idle'}</span>
                        </div>
                        <p className="text-[7.5px] dark:text-white/30 text-slate-500 font-medium truncate">{sub}</p>
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
                      { Icon: CircleDot, label: 'FX Netting' },
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
          </div>
        </div>
      </section>

      {/* COLLABORATIVE AGENTS */}
      <section
        id="about"
        className="border-b border-border/40 px-6 py-14 lg:px-12 lg:py-18"
      >
        <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-2 lg:items-center">
          <h2
            className="text-[clamp(1.9rem,4vw,3rem)] font-black leading-[1.04] tracking-[-0.04em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Collaborative agents
            <br />
            built for complex
            <br />
            workflows.
          </h2>
          <p className="max-w-sm text-[13px] leading-6 text-muted-foreground lg:ml-auto">
            Experience a powerful network of AI agents collaborating in real time, combining
            research, data analysis, workflow automation, and customer assistance into one unified,
            intelligent system.
          </p>
        </div>

        {/* scrolling pills */}
        <div
          ref={scrollRef}
          className="mt-8 flex gap-3 overflow-hidden whitespace-nowrap select-none py-1.5"
          style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
        >
          {[...AGENT_PILLS, ...AGENT_PILLS].map((pill, i) => (
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
          <h2
            className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Why ZEGA Stands Out
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            Intelligent, fast, and more adaptable than traditional AI solutions.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {WHY_CARDS.map(({ icon: Icon, title, desc, gradient }, idx) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
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
                <h3 className="mt-5 text-[14px] font-bold">Multi-Agent System</h3>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  Deploy specialized agents that communicate and collaborate seamlessly to handle
                  complex workflows.
                </p>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_120%,rgba(255,107,53,.2),transparent_50%),radial-gradient(ellipse_at_50%_120%,rgba(155,39,212,.18),transparent_45%),radial-gradient(ellipse_at_20%_120%,rgba(14,165,233,.15),transparent_50%)]" />
              <div className="relative">
                <h3 className="text-[18px] font-black tracking-[-0.03em]">
                  Are you ready to begin
                </h3>
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  Let's turn this into reality. We're ready when you are.
                </p>
                <div className="mt-6 flex gap-2.5">
                  <a
                    href="#pricing"
                    className="rounded-full bg-foreground px-5 py-2.5 text-[11px] font-bold text-background transition-opacity hover:opacity-90"
                  >
                    Get Started
                  </a>
                  <a
                    href="#contact"
                    className="rounded-full border border-border px-5 py-2.5 text-[11px] font-bold text-foreground transition-colors hover:bg-secondary"
                  >
                    Contact us
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
          <h2
            className="text-center text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Experience ZEGA in Action
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            See how our AI agents seamlessly handle complex workflows in real time.
          </p>

          <div className="mt-2 text-[11px] text-muted-foreground text-center">
            Understand How Your Team Operates
          </div>

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
            Our Products
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            Complete suite of AI-powered solutions for modern enterprises.
          </p>

          <div className="mt-10 grid gap-8 text-center sm:grid-cols-3">
            {PRODUCTS.map(({ icon: Icon, gradient, title, desc }) => (
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
              See All Products
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
            Get Started in 3 Steps
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            Launch your enterprise intelligence in minutes.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {STEPS.map(({ num, icon: Icon, title, desc }, idx) => (
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
            Trusted by Our Customers
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            See what enterprise leaders say about ZEGA AI.
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
                    <img
                      src={img}
                      alt={name}
                      className={`rounded-full object-cover ${featured ? "size-14" : "size-9"}`}
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
            Plans That Fit Your Needs
          </h2>
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            Select the plan that supports your work and grows as your business expands.
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
                  {b}
                  {b === "yearly" && (
                    <span className="ml-1.5 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#9b27d4] px-1.5 py-0.5 text-[8px] font-bold text-white">
                      -20%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 items-start">
            {PLANS.map(({ name, monthly, yearly, featured, badge, features }) => (
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
                  onClick={() => triggerComingSoon()}
                  className={`mt-5 flex w-full items-center justify-center rounded-full py-2.5 text-[11px] font-bold transition-all hover:opacity-90 cursor-pointer ${featured
                    ? "bg-white text-[#c2185b]"
                    : "border border-border text-foreground hover:bg-secondary"
                    }`}
                >
                  Choose Plan
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
        className="relative mx-6 mb-6 overflow-hidden rounded-2xl p-12 text-center lg:mx-12 lg:mb-12 bg-[#0a0b10] border border-white/10 shadow-2xl"
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
            className="absolute -bottom-2 left-0 w-[200%] h-[68%] sm:h-[62%] lg:h-[55%] opacity-70"
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
                  <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#d42060" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.75" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Liquid Water SVG Wave Layer 2 */}
          <div
            className="absolute -bottom-1 left-0 w-[200%] h-[58%] sm:h-[52%] lg:h-[45%] opacity-85"
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
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.65" />
                  <stop offset="45%" stopColor="#c2185b" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.65" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="relative z-10">
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-black tracking-[-0.04em] text-white drop-shadow-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Ready to Shape the Future
            <br />
            with ZEGA AI?
          </h2>
          <p className="mt-3 text-[13px] text-white/80 font-medium">
            All your enterprise needs, orchestrated in one place.
          </p>
          <button
            onClick={() => triggerComingSoon()}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-[12px] font-bold text-[#0a0b10] shadow-lg transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Start Now
          </button>
        </div>
      </section>

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
          <div className="flex flex-col gap-2.5 text-center md:text-left">
            <a
              href="#home"
              className="inline-flex items-center rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/50"
              aria-label="ZEGA AI — Back to home"
            >
              <img
                src="/assets/logo/zegalogo.png"
                alt="ZEGA AI"
                width={160}
                height={44}
                className="h-9 w-auto object-contain lg:h-11 [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.15)] transition-[filter] duration-300"
                loading="lazy"
                decoding="async"
              />
            </a>
            <p className="text-[11px] text-muted-foreground max-w-[200px]">
              Zero-Friction Enterprise Generative Automation.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3.5">
            <div className="flex gap-3">
              <a href="#" className="pill-hover-glow grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-all duration-300">
                <span className="sr-only">Twitter</span>
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="#" className="pill-hover-glow grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-all duration-300">
                <span className="sr-only">LinkedIn</span>
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zm-.5-10.268a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11.5 10.268h-3v-4.5c0-1.077-.812-1.5-1.5-1.5s-1.5.423-1.5 1.5V19h-3v-9h3v1.078c.451-.622 1.341-1.078 2.5-1.078 1.968 0 3.5 1.488 3.5 4.5v4.5z" /></svg>
              </a>
              <a href="#" className="pill-hover-glow grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-all duration-300">
                <span className="sr-only">GitHub</span>
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground">© 2026 ZEGA AI. All rights reserved.</p>
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
    </div>
  );
}
