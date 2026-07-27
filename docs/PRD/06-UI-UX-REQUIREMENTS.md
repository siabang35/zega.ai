# ZEGA AI PRD — UI/UX Requirements

## 6. UI/UX Design System

### 6.1 Design Philosophy

ZEGA AI delivers a **premium, enterprise-grade experience** that scales seamlessly across desktop, tablet, and mobile. The interface must convey trust, intelligence, and control — reflecting the sophistication of the platform it governs.

**Design Principles:**
1. **Clarity Over Complexity** — Dense data presented through progressive disclosure
2. **Mobile-First, Desktop-Rich** — Full functionality on mobile; enhanced layouts on desktop
3. **Dark Mode Default** — Reduces eye strain for 24/7 operations; light mode available
4. **Real-Time Everywhere** — All dashboards update via WebSocket; no manual refresh
5. **Accessibility First** — WCAG 2.1 AA minimum; AAA for critical workflows
6. **Micro-Interactions** — Subtle animations that communicate state changes
7. **Zero-Training UX** — Intuitive enough for C-suite; powerful enough for operators

### 6.2 Responsive Breakpoints & Layout

| Breakpoint | Width | Layout | Target |
|---|---|---|---|
| **Mobile S** | 320–374px | Single column, bottom navigation | Small phones |
| **Mobile M** | 375–427px | Single column, bottom navigation | Standard phones |
| **Mobile L** | 428–767px | Single column, expandable panels | Large phones |
| **Tablet** | 768–1023px | Two-column, collapsible sidebar | Tablets |
| **Desktop** | 1024–1439px | Three-column, persistent sidebar | Laptops |
| **Desktop XL** | 1440–1919px | Three-column, expanded data panels | Monitors |
| **Ultra-wide** | 1920px+ | Multi-panel workspace, picture-in-picture | Command centers |

### 6.3 Core UI Components

#### 6.3.1 Command Center Dashboard (Desktop)

| Section | Content | Update Frequency |
|---|---|---|
| **Strategic Overview** | Enterprise KPIs, P&L summary, risk score | Real-time (WebSocket) |
| **Agent Activity Feed** | Live stream of agent actions and decisions | Real-time |
| **Mesh Health Grid** | Status of all 11 meshes with drill-down | 5-second intervals |
| **Financial Pulse** | Cash positions, FX rates, payment volumes | Real-time |
| **Alert Center** | Prioritized alerts with action buttons | Real-time push |
| **Digital Twin Panel** | Active simulations and results | On-demand |
| **Global Map** | Subsidiary locations with operational status | 30-second intervals |

#### 6.3.2 Mobile Experience

| Feature | Mobile Adaptation |
|---|---|
| **Dashboard** | Swipeable card stack; most critical KPIs first |
| **Agent Control** | Tap-to-expand agent details; swipe actions (approve/reject) |
| **Alerts** | Push notifications with inline action buttons |
| **Approvals** | Full approval workflow with biometric confirmation |
| **Search** | Voice-enabled universal search |
| **Offline Mode** | Cached dashboards with sync indicator; queued approvals |
| **Navigation** | Bottom tab bar (5 primary sections) + gesture navigation |

#### 6.3.3 Design Token System

```yaml
Colors:
  primary: "#6366F1"          # Indigo — Trust, intelligence
  secondary: "#8B5CF6"        # Violet — Innovation
  accent: "#06B6D4"           # Cyan — Data, clarity
  success: "#10B981"          # Emerald — Positive outcomes
  warning: "#F59E0B"          # Amber — Caution
  danger: "#EF4444"           # Red — Critical alerts
  background:
    dark: "#0F172A"           # Slate 900
    surface: "#1E293B"        # Slate 800
    elevated: "#334155"       # Slate 700
  text:
    primary: "#F8FAFC"        # Slate 50
    secondary: "#94A3B8"      # Slate 400
    muted: "#64748B"          # Slate 500

Typography:
  font_family: "'Inter', 'SF Pro Display', -apple-system, sans-serif"
  scale: [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72]
  weight: [400, 500, 600, 700]
  line_height: [1.2, 1.4, 1.5, 1.6]

Spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128]

Elevation:
  level_1: "0 1px 3px rgba(0,0,0,0.3)"
  level_2: "0 4px 6px rgba(0,0,0,0.3)"
  level_3: "0 10px 15px rgba(0,0,0,0.3)"
  level_4: "0 20px 25px rgba(0,0,0,0.3)"

Border_Radius: [4, 8, 12, 16, 24, 9999]

Animations:
  duration: { fast: "150ms", normal: "300ms", slow: "500ms" }
  easing: "cubic-bezier(0.4, 0, 0.2, 1)"
```

### 6.4 Key User Flows

#### 6.4.1 C-Suite Strategic Review (Desktop)

```
Login (MFA/Biometric) → Command Center Dashboard
  → View Enterprise KPIs (auto-loaded)
  → Drill into underperforming subsidiary
    → See mesh-level KPIs
    → View agent recommendations
    → Approve/reject strategic action
  → Open Digital Twin
    → Run scenario simulation
    → Compare outcomes
    → Deploy winning strategy
  → Review pending approvals (> $100K)
    → Approve with digital signature
```

#### 6.4.2 Mobile Approval Workflow

```
Push notification: "Payment approval needed: $250K"
  → Tap notification → App opens to approval screen
  → View transaction details + agent rationale
  → Swipe through supporting documents
  → Approve with Face ID / Fingerprint
  → Confirmation animation → Return to dashboard
  Total time: < 30 seconds
```

### 6.5 Accessibility Requirements

| Requirement | Standard | Implementation |
|---|---|---|
| **Color Contrast** | WCAG 2.1 AA (4.5:1 normal, 3:1 large text) | Automated contrast checking in design system |
| **Keyboard Navigation** | Full keyboard operability | Focus management, skip links, tab order |
| **Screen Readers** | ARIA landmarks, labels, live regions | Semantic HTML + ARIA attributes |
| **Motion Sensitivity** | `prefers-reduced-motion` respect | All animations honor OS setting |
| **Text Scaling** | Up to 200% without loss of content | Relative units (rem/em) throughout |
| **Touch Targets** | Minimum 44x44px | Enforced in component library |
| **Language** | Multi-language support | i18n framework with RTL support |
| **Color Blindness** | Patterns + icons supplement color | Never use color as sole indicator |

### 6.6 Performance Requirements (UI)

| Metric | Target |
|---|---|
| **First Contentful Paint (FCP)** | < 1.2s |
| **Largest Contentful Paint (LCP)** | < 2.5s |
| **Cumulative Layout Shift (CLS)** | < 0.1 |
| **First Input Delay (FID)** | < 100ms |
| **Time to Interactive (TTI)** | < 3.5s |
| **Bundle Size (initial)** | < 200KB gzipped |
| **Dashboard Data Load** | < 500ms after shell render |
| **WebSocket Reconnection** | < 2s automatic reconnect |
| **Offline Capability** | Service Worker caching; offline dashboard viewing |

### 6.7 Enterprise Orchestration Flow & Interactive Action Demonstration

#### 6.7.1 5-Layer Visualization Architecture
The main enterprise landing & orchestration interface implements a 5-layer interactive visualization hierarchy:

```
[Layer 1: Event Sources]  -> Webhook / User Query / Schedule / System Alert
       │
[Layer 2: Integrations]   -> Smart Connectors (Stripe, WhatsApp, BigQuery, Supabase)
       │
[Layer 3: ZEGA AI Engine] -> Interactive Orchestrator (Utilization | Tools & Systems | Analytics)
       │
[Layer 4: AI Agents]      -> Autonomous Agent Swarm (Planning, Reasoning, Execution)
       │
[Layer 5: 9Router Engine] -> Multi-Model Intelligent Router (Logo: /assets/visualization/9router.jpeg)
```

#### 6.7.2 9Router Engine Visual Branding
- **Logo Asset**: High-resolution enterprise image `/assets/visualization/9router.jpeg`.
- **Card Framing**: Solid border framing with dark/light mode responsive container styling.

#### 6.7.3 Dynamic Contextual Action Tabs ("Experience ZEGA in Action")
The landing interface provides a 3-way dynamic interactive panel system driven by `ACTION_TABS_DATA`:

| Tab | Context Category | Primary Visual | Interactive Demonstration |
|---|---|---|---|
| **`Utilization`** | Tech Assistance & Fleet Load | Workplace AI Agent metrics (87% active fleet, 1.4k tasks) | Live customer service query & order tracking chat demo |
| **`Tools & Systems`** | Enterprise Integration Hub | Active connectors grid (Stripe, WhatsApp, BigQuery, Supabase) + 142ms latency | Real-time API event execution log (`TRIGGER`, `INVOKE`, `SUCCESS`) |
| **`Analytics`** | Telemetry & ROI Dashboard | Real-time Telemetry Engine (99.97% success, $14.2k/mo saved) | **Chart.js Doughnut Chart** model traffic distribution (Claude 3.7, GPT-4.1, Gemini 2.5, DeepSeek R1) + 9Router ROI insights |

