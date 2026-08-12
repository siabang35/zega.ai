# Safe Multi-Tenant Schema Migration Plan

## Phase Plan
1. Schema Alterations (Add organization_id, workspace_id, composite constraints).
2. Data Reconciliation (Map legacy store_id to organizations and workspaces).
3. RLS Policy Hardening (Revoke anon policies, enforce auth.uid() membership resolution).
4. Codebase Refactoring (Server-side TenantContext, API IDOR checks, AI/RAG isolation).
