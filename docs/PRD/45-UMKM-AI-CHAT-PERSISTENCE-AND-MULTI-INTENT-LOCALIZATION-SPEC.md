# PRD 45: UMKM AI Chat History Persistence, Decoupled Language Architecture & Multi-Intent Natural Engine Specification

## 1. Executive Overview

The **ZEGA AI Autonomous Assistant Architecture** unifies three AI chat interfaces into a 100% database-backed, enterprise-grade conversational suite:
1. **Home AI Assistant** (`HomeView.tsx` - Ops Specialist)
2. **ZEGA Copilot** (`UmkmDashboardContainer.tsx` - Floating Drawer Assistant)
3. **Live Chat with AI** (`HelpView.tsx` - Support Specialist Direct)

This specification defines the architectural standards for **Zero LocalStorage Persistence**, **Decoupled Dual-Language Control**, **Multi-Intent Natural Language Inference**, and **History Drawer UI Scoping**.

---

## 2. 100% Database-Backed Persistence Architecture

To guarantee multi-device access, zero state corruption, and multi-tenant row-level security (RLS), all chat history is persisted strictly to Supabase PostgreSQL master tables:

### A. Isolated Chat Persistence Tables
- `umkm_ai_assistant_chats` & `umkm_ai_assistant_messages` (Home AI Assistant)
- `umkm_zega_copilot_chats` & `umkm_zega_copilot_messages` (Floating ZEGA Copilot)
- `umkm_live_help_chats` & `umkm_live_help_messages` (Help Page Live Chat)

### B. Session Lifecycle & Persistence Rules
1. **Pre-Flight Session Check**: Before dispatching any prompt, the client checks or creates an active session in Supabase DB via `SupabaseDashboardService.getOrCreateActive...Chat()`.
2. **Synchronous DB Save**: User prompts (`sender: 'user'`) are written to DB prior to invoking LLM endpoints.
3. **Guaranteed Assistant Reply Persistence**: AI replies (`sender: 'ai'` / `'copilot'`) are saved to Supabase DB regardless of whether inference originated from the backend Fastify API (`/v1/umkm/copilot/chat`) or the client fallback engine.
4. **Zero LocalStorage Fallback**: `localStorage` is strictly restricted to user preferences (`zega_ui_language`, `zega_ai_default_language`). No message text or history arrays are stored locally.

---

## 3. Decoupled Dual-Language System Architecture

To allow merchants to operate with an English interface while receiving AI answers in Indonesian (or vice versa), the platform maintains a strict separation of concerns:

```
┌────────────────────────────────────────────────────────┐
│               Merchant Browser Environment             │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
  ┌───────────────────┐           ┌───────────────────┐
  │   getUiLang()     │           │   getAiLang()     │
  └─────────┬─────────┘           └─────────┬─────────┘
            │                               │
            ▼                               ▼
 ┌─────────────────────┐         ┌─────────────────────┐
 │ UI Labels, Buttons, │         │ System Prompts, LLM │
 │ History Drawer Text │         │ Output Preferences  │
 └─────────────────────┘         └─────────────────────┘
```

1. **`getUiLang()`**: Controls UI elements (e.g. "Open Chat" / "Buka Chat", "Diskusi Utama" / "Main Session", history empty states).
2. **`getAiLang()` / `getAiPrefLang()`**: Controls backend system instructions (`targetLangInstruction`) and client fallback response language generation.

---

## 4. Multi-Intent Natural AI Specialist Engine

To eliminate rigid prompt echoing (e.g., *"Regarding your question..."*) and provide actionable business advice, the AI specialist engine implements multi-intent keyword recognition:

| Intent Category | Triggers / Keywords | Intelligent Response Summary |
|---|---|---|
| **Fashion & Apparel Store** | `fashion`, `baju`, `pakaian`, `boutique`, `distro` | 24/7 WA AI Catalog, Size Guide Automation, Flash Promo Broadcasts, POS S/M/L/XL Variant Inventory Alerts |
| **Profit & Omzet Growth** | `profit`, `untung`, `omzet`, `penjualan`, `make more` | WA Cart Recovery, AI Sales Swarm Cross-Selling, High-Margin POS Item Analytics |
| **Operational Consultation** | `i dont know`, `bingung`, `gimana`, `apa aja` | Guided business consultation prioritizing WA API, POS Cashier, or Stock Management |
| **Auto POS Cashier** | `kasir`, `pos`, `transaksi`, `printer`, `struk` | Real-time POS syncing, Bluetooth thermal printer troubleshooting, transaction logs |
| **WhatsApp API & Bot** | `whatsapp`, `wa`, `broadcast`, `template` | Webhook verification, order receipt dispatch, 24/7 AI catalog chat configuration |
| **Inventory Stock** | `stok`, `inventory`, `barang`, `gudang` | Real-time stock decrement on sale, minimum reorder thresholds, supplier alerts |
| **ZEGA Platform** | `zega`, `platform`, `explain`, `apa itu` | Unified enterprise AI workspace overview covering POS, WA API 24/7, and AI Swarms |

---

## 5. UI/UX Hardening & History Modal Scoping

1. **Drawer Container Scoping**: Enforced `position: relative` on all sliding history drawer containers (`UmkmDashboardContainer.tsx`, `HelpView.tsx`). History overlays positioned with `absolute inset-0` remain bounded inside the drawer rather than triggering full-screen viewport overflow.
2. **Redundant Element Cleanup**:
   - Removed duplicate decorative badges (`ZEGA COPILOT`, `LIVE HELP`).
   - Removed redundant header clear/trash buttons to simplify user actions.
   - Dynamic localization for "Open Chat" / "Buka Chat" and history session titles based on `getUiLang()`.
