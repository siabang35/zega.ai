# PRD 37: Enterprise Mobile Navigation & Payments-Billing Routing Modernization

## 1. Executive Summary
This document specifies the enterprise-grade modernization of the mobile navigation suite and routing architecture in **ZEGA AI Enterprise Studio** (`/console`). All legacy hamburger (`Menu`) and close (`X`) controls have been superseded by a unified, high-contrast **Chevron Design Language** (`ChevronLeft` / `ChevronRight`). Additionally, routing conflicts between public checkout pages (`/payment`) and internal console pages (`/console/payments-billing`) have been strictly isolated to ensure zero disruption to enterprise workflows.

---

## 2. Technical Architecture & Modifications

### 2.1 Unified Chevron Navigation Control System
- **Floating Chevron Border Toggle**: Standardized circular button (`size-7 rounded-full bg-slate-900 dark:bg-indigo-600 text-white ring-2 ring-white shadow-lg`) anchored to the right border (`-right-3.5 top-[28px] -translate-y-1/2`) on both Desktop Sidebar and Mobile Slide Drawer.
- **Mobile Open Toggle (`(|>)`)**: Uniform circular high-contrast Chevron button rendered on the top mobile navbar header (`md:hidden`) and mobile glassmorphism bottom navigation bar.
- **Single Control Discipline**: Removed duplicate inner drawer close buttons to prevent UI collisions and maintain a clean visual hierarchy.
- **Scrollbar Line Elimination**: Applied `[&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]` to inner drawer containers to prevent native browser scrollbar lines.

### 2.2 Routing Isolation (`/console/payments-billing`)
- **Public Checkout Isolation**: Updated `App.tsx` route matching so `isPublicCheckout` strictly excludes console routes (`!currentPath.startsWith('/console')`).
- **RESTful Route Mapping**: Updated `EnterpriseDashboard.tsx` tab-to-slug mapping:
  - `payments_bills` ➔ `/console/payments-billing` (with fallback mapping for `/console/payments`).
- **Result**: Direct navigation to `/console/payments-billing` opens the Enterprise Usage & Billing view as intended, without triggering `PublicCheckoutView`.

---

## 3. Security & Key Leakage Verification
- **OWASP Level 3 Inspection**: All modified files and migrations were scanned for hardcoded credentials. Verified 100% clean with zero API keys or private secrets exposed.

---

## 4. Revision History
- **Version**: 1.0.0
- **Date**: 2026-08-06
- **Authors**: ZEGA Enterprise Core Team & Antigravity Assistant
