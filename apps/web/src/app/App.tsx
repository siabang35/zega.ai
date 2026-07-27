import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import {
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  Globe,
  Grid3X3,
  Headphones,
  Layers3,
  Menu,
  Moon,
  Network,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  UserRoundPlus,
  Wrench,
  X,
  Zap,
  ArrowUpRight,
} from "lucide-react";
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

const NAV_LINKS = ["Home", "About", "Blog", "Pricing"];

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

export default function App() {
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [activeTab, setActiveTab] = useState("Utilization");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const triggerComingSoon = (msg = "Coming Soon — ZEGA AI Enterprise Sign Up will open shortly.") => {
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

  return (
    <div
      className="min-h-screen bg-background font-[Inter,sans-serif] text-foreground antialiased"
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}
    >
      {/* NAV */}
      <header className="sticky top-0 z-50 h-[60px] border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6 lg:px-12">
          {/* Logo */}
          <a
            href="#home"
            className="flex-shrink-0 flex items-center rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/50"
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
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="nav-link-animated transition-colors hover:text-foreground"
              >
                {l}
              </a>
            ))}
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

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[60px] z-40 border-b border-border/70 bg-background/95 p-6 backdrop-blur-2xl shadow-2xl transition-all md:hidden">
          <div className="mx-auto flex max-w-sm flex-col gap-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-foreground/90 transition-colors hover:bg-muted/70 hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <span>{l}</span>
                <span className="text-[10px] text-muted-foreground font-normal">→</span>
              </a>
            ))}
            <div className="mt-3 border-t border-border/50 pt-4">
              <button
                className="group relative w-full flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#ff6b35] via-[#e8295a] to-[#ff6b35] bg-[length:200%_100%] py-3 text-xs font-bold text-white shadow-lg shadow-[#ff6b35]/20 transition-all duration-500 hover:bg-right active:scale-[0.98] cursor-pointer"
                onClick={() => {
                  setMobileOpen(false);
                  triggerComingSoon();
                }}
              >
                <span className="relative z-10">Sign Up</span>
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
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
          <div className="h-[420px] w-[960px] rounded-full dark:bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.22)_0%,rgba(194,24,91,0.16)_35%,rgba(14,165,233,0.12)_60%,transparent_80%)] bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.12)_0%,rgba(194,24,91,0.08)_35%,rgba(14,165,233,0.06)_60%,transparent_80%)] blur-3xl" />
          {/* Subtle Accent Flairs */}
          <div className="absolute -top-10 left-1/4 h-[300px] w-[300px] rounded-full dark:bg-[#ff6b35]/15 bg-[#ff6b35]/08 blur-[90px]" />
          <div className="absolute -top-10 right-1/4 h-[300px] w-[300px] rounded-full dark:bg-[#0ea5e9]/15 bg-[#0ea5e9]/08 blur-[90px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl">
          <h1
            className="hero-text-reveal text-[clamp(2.4rem,5.5vw,4.2rem)] font-light leading-[1.06] tracking-[-0.04em] text-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tailored Plans for Every
            <br />
            <span className="font-black dark:text-white text-gray-900 drop-shadow-sm">
              Enterprise Need
            </span>
          </h1>
          <p className="hero-text-reveal hero-text-reveal-delay-1 mx-auto mt-4 max-w-md text-[13.5px] leading-relaxed text-muted-foreground font-normal">
            Flexible plans that fit your workflow and scale seamlessly with your enterprise.
          </p>

          {/* Interactive Glass Input Pill */}
          <div className="hero-text-reveal hero-text-reveal-delay-2 mx-auto mt-8 flex max-w-[380px] items-center overflow-hidden rounded-full border border-border/80 bg-card/80 p-1.5 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 focus-within:border-[#ff6b35]/60 focus-within:shadow-[#ff6b35]/10 hover:border-border">
            <input
              type="email"
              placeholder="Enter Your Email"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
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

        {/* HERO PANELS */}
        <div className="relative mx-auto mt-12 w-full max-w-[1160px]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {/* Panel 1 – chat */}
            <div className="col-span-1 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#ff6b35] via-[#d42060] to-[#8b1a2f] p-3 lg:min-h-[260px]">
              <p className="text-[9px] font-medium text-white/60">Decision stream</p>
              <div className="mt-3 space-y-2">
                <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-black/20 p-2.5 text-[9px] leading-[1.5] text-white/85">
                  Hello, I recently placed an order and wanted to see what the status is.
                </div>
                <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-black/20 p-2.5 text-[9px] leading-[1.5] text-white/85">
                  Of course! May I have your ID or phone number, please?
                </div>
                <div className="ml-auto max-w-[88%] rounded-xl rounded-tr-sm bg-white/15 p-2.5 text-[9px] leading-[1.5] text-white">
                  Can you check the purchase status?
                </div>
                <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-black/20 p-2.5 text-[9px] leading-[1.5] text-white/85">
                  Sure! Please share your order ID or the phone number used during checkout.
                </div>
              </div>
            </div>

            {/* Panel 2 – visitor overview (Chart.js) */}
            <div className="col-span-1 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#7b2ff7] via-[#4f46e5] to-[#1e3a8a] p-3 lg:min-h-[260px]">
              <p className="text-[9px] font-medium text-white/60">Visitor Overview</p>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] text-white/80">
                  ● Repeat
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] text-white/60">
                  ● Fresh
                </span>
              </div>
              <div className="mt-3 h-[80px]">
                <Bar
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      { data: [55, 70, 45, 85, 60, 90, 50], backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 3, barThickness: 8 },
                      { data: [30, 40, 25, 50, 35, 55, 30], backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, barThickness: 8 },
                    ],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: { enabled: true } }, scales: { x: { display: false }, y: { display: false } } }}
                />
              </div>
              <div className="mt-2 flex items-center justify-center">
                <div className="relative size-14">
                  <Doughnut
                    data={{ labels: ['Repeat', 'Fresh'], datasets: [{ data: [72, 28], backgroundColor: ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)'], borderWidth: 0 }] }}
                    options={{ responsive: true, maintainAspectRatio: true, cutout: '65%', plugins: { tooltip: { enabled: false } } }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">72%</span>
                </div>
              </div>
            </div>

            {/* Panel 3 – orchestrator select */}
            <div className="col-span-2 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] p-3 sm:col-span-1 lg:min-h-[260px]">
              <p className="text-[9px] font-medium text-white/60">Select a Representative</p>
              <p className="mt-0.5 text-[8px] text-white/40">
                Search or select an agent that fits your purpose.
              </p>
              <div className="mt-3 space-y-1.5">
                {[
                  "OmniOrchestrator",
                  "FiscalGuard Hybrid",
                  "HyperScale Procurement",
                  "CrossCompliance AI",
                  "Predictive JIT Logistics",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-[9px] text-white/80 transition hover:bg-white/12"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 4 – map */}
            <div className="col-span-1 overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#0369a1] via-[#1e40af] to-[#312e81] p-3 lg:min-h-[260px]">
              <p className="text-[9px] font-medium text-white/60">Cross-Company Map</p>
              <p className="mt-0.5 text-[8px] text-white/40">Country-Wise Operations</p>
              <div className="mt-4 flex flex-col gap-1.5">
                {["Finance Mesh", "Supply Chain", "Compliance", "HR & Payroll"].map((item) => (
                  <div
                    key={item}
                    className="rounded-md bg-white/10 px-2.5 py-1.5 text-[9px] text-white/75"
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* globe accent */}
              <div className="mt-3 flex justify-center">
                <Globe size={36} className="text-white/20" />
              </div>
            </div>

            {/* Panel 5 – global coverage (Chart.js + OrbitRing) */}
            <div className="col-span-1 relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] p-3 lg:min-h-[260px]">
              <p className="text-[9px] font-medium text-white/60">Global Coverage</p>
              <div className="mt-3 flex flex-col items-center justify-center gap-2">
                <div className="relative flex items-center justify-center">
                  {/* Orbit ring rotating around the chart */}
                  <OrbitRing size={110} dotCount={3} speed={10} color="rgba(14,165,233,0.6)" borderColor="rgba(14,165,233,0.15)" className="-left-[7px] -top-[7px]" />
                  <OrbitRing size={90} dotCount={2} speed={8} reverse color="rgba(255,255,255,0.3)" borderColor="rgba(255,255,255,0.08)" className="left-[3px] top-[3px]" />
                  <div className="relative size-24">
                    <Doughnut
                      data={{ labels: ['Active', 'Pending'], datasets: [{ data: [100, 0], backgroundColor: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)'], borderWidth: 0 }] }}
                      options={{ responsive: true, maintainAspectRatio: true, cutout: '70%', plugins: { tooltip: { enabled: false } } }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="font-[DM_Mono] text-[7px] font-medium text-white/60">GLOBAL</p>
                      <p className="text-lg font-black text-white"><AnimatedCounter target={100} suffix="%" /></p>
                    </div>
                  </div>
                </div>
                <p className="text-[8px] text-white/50">Operations Active</p>
                <div className="w-full space-y-1">
                  {["APAC", "EMEA", "AMER"].map((r, i) => (
                    <div key={r} className="flex items-center gap-2">
                      <span className="text-[7px] text-white/50 w-8">{r}</span>
                      <div className="flex-1 rounded-full bg-white/10 h-1">
                        <div
                          className="h-1 rounded-full bg-white/40 transition-all duration-1000"
                          style={{ width: `${[100, 88, 95][i]}%` }}
                        />
                      </div>
                    </div>
                  ))}
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

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {/* Left panel – Workplace AI Agent */}
            <article className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b35] to-[#9b27d4]">
                  <Headphones size={16} className="text-white" />
                </div>
                <span className="text-[12px] font-semibold">Tech Assistance</span>
              </div>
              <h3 className="text-[18px] font-black tracking-[-0.03em]">Workplace AI Agent</h3>
              <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                Integrate with your systems, interpret your data and workflows, and enable agentic
                actions.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <span className="flex-1 rounded-full border border-border bg-muted px-4 py-2 text-[10px] text-muted-foreground">
                  Got Questions...
                </span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </article>

            {/* Right panel – chat demo */}
            <article className="rounded-2xl border border-border bg-card p-4">
              <div className="flex h-full flex-col gap-3 justify-between">
                <div className="space-y-2.5">
                  <div className="flex gap-2 items-start">
                    <div className="size-6 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#d42060] flex-shrink-0 mt-0.5" />
                    <div className="rounded-xl rounded-tl-sm bg-secondary px-3 py-2 text-[10px] leading-5 text-secondary-foreground max-w-[85%]">
                      Hi there! I recently placed an order and wanted to see what the status is.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-xl rounded-tr-sm bg-gradient-to-br from-[#ff6b35] to-[#9b27d4] px-3 py-2 text-[10px] leading-5 text-white max-w-[85%]">
                      Of course! May I have your ID or phone number, please?
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="size-6 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#d42060] flex-shrink-0 mt-0.5" />
                    <div className="rounded-xl rounded-tl-sm bg-secondary px-3 py-2 text-[10px] leading-5 text-secondary-foreground max-w-[85%]">
                      Sure! Please share your order ID or the phone number used during checkout.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-xl rounded-tr-sm bg-muted border border-border px-3 py-2 text-[10px] leading-5 max-w-[85%]">
                      Hi, I want to track my order.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
                  <span className="flex-1 text-[10px] text-muted-foreground">Ask ZEGA anything...</span>
                  <div className="size-5 rounded-full bg-foreground grid place-items-center">
                    <ChevronRight size={10} className="text-background" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* OUR PRODUCTS */}
      <section className="px-6 py-16 lg:px-12 lg:py-20">
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
