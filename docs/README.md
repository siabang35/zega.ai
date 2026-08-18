# ZEGA.AI Documentation Index

> Technical documentation for the ZEGA.AI platform. All documentation is maintained under strict evidence-based governance (`governance/EVIDENCE_STANDARD.md`).

## Start Here

- **[Platform Architecture](architecture/ZEGA_PLATFORM_ARCHITECTURE.md)** — Master platform architecture, workspace topology, and tenant context.
- **[Security Architecture](security/ARCHITECTURE.md)** — Security controls, threat matrix, and isolation boundaries.
- **[Tenant Isolation Security](security/TENANT_ISOLATION.md)** — 14-layer defense-in-depth isolation rules for RAG, Cache, Storage, AI, and MCP.
- **[Data Ownership Matrix](tenancy/DATA_OWNERSHIP_MATRIX.md)** — Tenancy ownership mapping for all inventoried database tables.
- **[Payment Infrastructure](payments/x402_PAYMENT_INFRASTRUCTURE.md)** — `x402` payment settlement matrix, Solana vault controls, and Privy keyless signing.
- **[ZeroClaw Integration Guide](zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md)** — Production integration of ZeroClaw agent runtime daemon and ZEGA bridge package.

## Engineering

- **[Architecture](architecture/ZEGA_PLATFORM_ARCHITECTURE.md)** — Monorepo workspace structure, Fastify microservices, and Vercel configuration.
- **[Database](database/DATABASE_INVENTORY.md)** — 77 unique database tables inventory, RLS status, schema drift, and migration exceptions.
- **[Tenancy](tenancy/TENANT_MODEL.md)** — Canonical hierarchy, store reconciliation framework, UMKM shared SaaS, Enterprise, and Superadmin control plane.
- **[Payments](payments/x402_PAYMENT_INFRASTRUCTURE.md)** — Settlement verification pipeline, RPC failover, atomic withdrawals, and runbooks.
- **[ZeroClaw](zeroclaw/ZEROCLAW_INTEGRATION_MATRIX.md)** — [Integration Guide](zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md) | [Operator Guide](zeroclaw/AGENT_OPERATOR_GUIDE.md)
- **[Operations](operations/DISASTER_RECOVERY.md)** — Disaster recovery procedures and runbooks.

## Security & Verification

- **[Multi-Tenant RLS Security Hardening](security/MULTI_TENANT_RLS_SECURITY_HARDENING.md)** — Forensic RLS audit, 4-case authorization decision tree, identity sync, and fail-closed store resolution architecture.
- **[Security Architecture](security/ARCHITECTURE.md)** — [Tenant Isolation](security/TENANT_ISOLATION.md) | [RBAC Matrix](security/RBAC.md) | [Cross-Tenant Tests](security/CROSS_TENANT_TESTS.md) | [Audit V2 Report](security/AUDIT_V2_REPORT.md)
- **[Test Matrix](verification/TEST_MATRIX.md)** — 366 executable test cases, test categories, and verification mapping.
- **[Evidence Standard](governance/EVIDENCE_STANDARD.md)** — Absolute Evidence Hierarchy (E0–E7), status taxonomy, and rules.

## Product

- **[PRD Index & Specifications](PRD/README.md)** — Product specifications 01 to 44 marked by canonical status (`PROPOSED`, `PLANNED`, `PARTIALLY_IMPLEMENTED`, `IMPLEMENTED`, `VERIFIED`).

## Audit & Historical Evidence

- **[Claim-Evidence Reconciliation](audit/CLAIM_EVIDENCE_RECONCILIATION.md)** — Reconciled claim-to-evidence mappings.
- **[Audit Score Reconciliation](audit/AUDIT_SCORE_RECONCILIATION.md)** — Reconciliation of historical scores into status standards.
- **[Documentation Integrity Report](audit/DOCUMENTATION_INTEGRITY_REPORT.md)** — Forensic audit findings and structural remediation report.
- **[Historical & Remediation Baseline](REMEDIATION_BASELINE.md)** — Historical remediation assessment baseline.
