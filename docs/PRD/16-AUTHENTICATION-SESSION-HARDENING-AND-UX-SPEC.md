# ZEGA AI PRD — Authentication, Session Hardening & UI/UX Specification

## 16. Authentication, Session Hardening & UI/UX Specifications (July 2026)

### 16.1 Overview & Architecture Intent
This document defines the technical specifications, security protocols, and UI/UX standards for **ZEGA AI Platform**'s authentication flow, session management, Guest Demo environment, enterprise sidebar navigation, and dual-theme visual ergonomics.

---

### 16.2 Authentication & Session Hardening

#### A. Strict Session Lifecycle Management
1. **Sign Out Protocol**:
   - Triggering **Sign Out** inside the sidebar footer or mobile drawer executes `SupabaseDashboardService.signOut()`.
   - Purges local storage session keys (`zega_mock_session`), session cookies (`zega_session`), and authentication cache (`auth_cache`).
   - Resets state `showDashboard` to `false` and performs a safe URL fall-through to `/` without blank screen glitches or route traps.

2. **Route Guarding & Console CTA Harmonization**:
   - Accessing `/console` or `/dashboard` when unauthenticated automatically opens `AuthModal` (`handleOpenAuth("self-serve")`), matching the **Try Now** CTA button behavior seamlessly.
   - When an active session is detected, clicking **Console** immediately opens the active `UserDashboard` or `SuperAdminDashboard` without delay.

---

### 16.3 Guest Demo Mode Best Practices

1. **Guest Identity & Credentials**:
   - **Individual/UMKM Guest**: `Guest Explorer (Demo Mode)` (`guest@zegaai.site`).
   - **Enterprise Guest**: `Acme Enterprise (Guest Demo)` (`enterprise.guest@zegaai.site`).
   - Profile capsule features a distinct `GUEST DEMO` or `ENTERPRISE` badge with 1px neutral border styling.

2. **Non-Intrusive Guest Banner**:
   - Renders a top informational banner (`"⚡ Guest Mode — Exploring ZEGA AI Platform as Enterprise Guest / Individual Guest."`).
   - Clean, focused layout without redundant top links; Sign Out is exclusively accessed via the sidebar or mobile drawer footer.

---

### 16.4 Enterprise Accordion Sidebar Navigation

1. **Collapsible Accordion Categories**:
   - Categorized into `Orchestration & Agents`, `Intelligence & MCP`, `Autonomous Payments & Wallets`, `Governance & Security`, and `Infrastructure & Control`.
   - Each category header is equipped with `ChevronDown` / `ChevronRight` toggles.
   - **Auto-Expansion**: Selecting an active tab automatically expands its parent category, while allowing non-active categories to collapse, eliminating vertical sidebar clutter.

2. **Official ZEGA AI Logo Display**:
   - Sidebar header displays the official `zegalogo.png` image with theme-aware filter inversion (`dark:[filter:invert(1)_hue-rotate(180deg)]`) across both Individual & Enterprise modes.

---

### 16.5 Mobile Responsiveness & Drawer Navigation

1. **Mobile Header & Drawer Toggle**:
   - Displays a mobile hamburger menu button (`Menu` icon) on screen widths `< 768px` (`md:hidden`).
   - Toggling the hamburger button activates a responsive backdrop-blurred drawer overlay (`mobileMenuOpen`).
   - Drawer contains the complete category item list, user profile capsule, and quick Sign Out action button.

2. **Mobile Status Badge**:
   - Responsive status indicator collapses from `"Operational (All Nodes Online)"` on desktop to `"Operational"` on mobile to prevent top header overflow.

---

### 16.6 Theme Ergonomics & Design System Standards

1. **Design System Baseline**:
   - **Flat 1px Borders**: Strict enforcement of `border-slate-200` in Light Mode and `border-slate-800` in Dark Mode.
   - **Corporate Palette**: Slate backdrop surfaces (`bg-slate-900`/`bg-slate-950` in Dark Mode, `bg-slate-50`/`bg-white` in Light Mode) paired with Indigo & Emerald accents.
   - **WhatsApp Bot Accent**: High-contrast, theme-safe Emerald palette (`text-emerald-700 dark:text-emerald-300`, `bg-emerald-50 dark:bg-emerald-950/60`, `border-emerald-200 dark:border-emerald-800`).
