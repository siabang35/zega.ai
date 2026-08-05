# PRD 35: RPC URL Log Sanitization & Strict Environment Security Specification

> **Version:** 1.0.0 | **Date:** 2026-08-05 | **Status:** Implemented & Verified | **Scope:** ZEGA AI API Security & Compliance

---

## 1. Executive Summary

This document specifies the security hardening standards implemented across the ZEGA AI backend to eliminate credential leaks in log streams and enforce 100% environment-driven configuration (`apps/api/.env`) validated at startup via Zod (`apps/api/src/config/env.ts`).

---

## 2. Core Security Hardening Requirements

### 2.1 URL Log Sanitization Engine (`urlSanitizer.ts`)
- **Automatic Key Masking**: All URLs containing embedded third-party API keys (e.g. Alchemy path keys `alch_...` or Helius query string `?api-key=...`) are parsed and sanitized before output.
- **Rules**:
  1. `?api-key=xxxx` / `?key=xxxx` / `?token=xxxx` -> `?api-key=***`
  2. `/v2/alch_O-QLJJeqpS3MpXj4k4VPd` -> `/v2/alch_***`
  3. `/v1/3092049283402394` -> `/v1/***`

### 2.2 Pino Logger Serializers (`logger.ts`)
- Configured Pino logger with custom field serializers for `url` and `rpcUrl` fields.
- Ensures all structured JSON logs produced by `logger.info`, `logger.warn`, and `logger.error` automatically sanitize any URL fields passed in payload objects.

### 2.3 Strict Zod Environment Validation (`env.ts`)
- All environment variables are validated at startup.
- Covers 25+ parameters including Multi-RPC pools, Multi-LLM API keys (Groq, Gemini, OpenRouter, HuggingFace, Jatevo, 9Router), Privy App credentials, OAuth credentials, and Telegram Bot tokens.

### 2.4 Complete Purge of Hardcoded String Fallbacks
- All hardcoded secret fallbacks (e.g., `cms9...` for Privy App ID and `a0d5...` for Brevo SMTP user) have been completely purged from source code files and replaced with strict `envConfig` resolution.

---

## 3. Verification & Compliance Matrix

| Security Check | Before State | Implemented Solution | Compliance Status |
|---|---|---|---|
| **RPC Terminal Logs** | Exposed raw `alch_...` and `api-key=...` in stdout JSON | `urlSanitizer.ts` + Pino `serializers` | ✅ PASSED (100% Masked) |
| **Privy App ID Fallback** | Hardcoded string `cms9...` in `auth.routes.ts` | `envConfig.PRIVY_APP_ID` | ✅ PASSED |
| **Brevo SMTP User Fallback** | Hardcoded string `a0d5...` in `brevoService.ts` | `envConfig.SMTP_USER` | ✅ PASSED |
| **Zod Env Schema** | Partial env coverage | Full 25+ key Zod validation in `env.ts` | ✅ PASSED |
