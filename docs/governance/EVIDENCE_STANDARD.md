# ZEGA.AI Documentation Evidence & Governance Standard

## 1. Objective & Scope

This standard establishes the mandatory evidence hierarchy, documentation taxonomy, and verification procedures for all documentation in the `ZEGA.AI` repository. 

Every claim regarding architecture, database schemas, multi-tenancy isolation, security controls, payment settlement, AI guardrails, performance, and test results MUST strictly adhere to this evidence framework.

---

## 2. Absolute Evidence Hierarchy (E0 – E7)

Documentation assertions DO NOT constitute proof. Evidence is defined as code, SQL migrations, executable test suites, verifiable CLI output, or external independent validation.

| Level | Classification | Description & Qualification |
|---|---|---|
| **E0** | **Assertion Only** | Claim made in documentation or PRD without matching repository source code or test verification. Marked as `UNVERIFIED` or `UNKNOWN`. |
| **E1** | **Specification / PRD** | Product requirement document, architectural diagram, or RFC describing intended behavior. |
| **E2** | **Source Implementation** | Concrete implementation in application code (`apps/`, `packages/`, `scripts/`). |
| **E3** | **Database Schema / Migration** | SQL migration (`supabase/migrations/`), schema constraints, RLS policies, database triggers, or views. |
| **E4** | **Automated Test** | Executable unit, integration, or end-to-end test (`*.test.ts`, `*.spec.ts`) covering the exact claim. |
| **E5** | **Persisted Test Output** | Persisted test execution artifact, CI run log, or deterministic test report. |
| **E6** | **Reproducible CLI Verification** | A command that an independent engineer can run in a clean environment to obtain identical verification results. |
| **E7** | **Independent Verification** | External audit report, penetration test, or third-party reproducible verification. |

---

## 3. Mandatory Document Status Taxonomy

All documentation files and individual technical claims MUST use one of the following canonical status labels:

* `IMPLEMENTED` — Code exists in the repository.
* `VERIFIED` — Code exists and an executable automated test (E4/E6) passes within the stated scope.
* `PARTIALLY_VERIFIED` — Test covers a subset of claimed functionality or edge cases remain.
* `UNVERIFIED` — Claim exists in design/PRD but lacks automated test or runtime verification.
* `PROPOSED` — Feature specification under review; no code implemented.
* `PLANNED` — Scheduled roadmap item with no implementation.
* `DEPRECATED` — Obsolete feature or legacy route scheduled for removal.
* `SUPERSEDED` — Documentation superseded by a newer canonical document.
* `UNKNOWN` — Claim status cannot be determined due to missing evidence or environment access.

### Forbidden Rhetoric Policy
The following subjective, unquantified, or absolute terms are **STRICTLY FORBIDDEN** unless accompanied by exact scope, evidence level, and denominator:
* `100% secure` / `fully secure` / `completely secure`
* `zero vulnerabilities` / `zero IDOR`
* `production-grade` / `enterprise-grade`
* `battle-tested` / `winner-ready` / `1st-place potential`
* `certified`

**Correct Usage Example:**
> `The cross-tenant probe test suite reported zero unauthorized cross-tenant access for the 29 API routes tested in apps/api/src/__tests__/multi-tenant-isolation.test.ts (Evidence Level: E4/E6). This does not guarantee absence of vulnerabilities outside the tested scope.`

---

## 4. Standard Claim & Verification Structure

Every major security, database, or architectural claim MUST be documented using the following standard template:

```markdown
### [Claim Title]

* **Claim**: Explicit statement of system behavior or security control.
* **Scope**: Defined environment, endpoints, tables, or actor boundaries.
* **Evidence Level**: E0 to E7.
* **Source Reference**: File path and line numbers (`apps/...`, `supabase/migrations/...`).
* **Verification Command**: Reproducible command to verify.
* **Expected Result**: Expected output / HTTP status / DB result.
* **Observed Result**: Actual execution output.
* **Limitations / Residual Risk**: Known boundaries or unverified edge cases.
* **Status**: `VERIFIED` | `PARTIALLY_VERIFIED` | `UNVERIFIED`
```

---

## 5. Canonical-Source-First Documentation Change Policy

ZEGA.AI documentation strictly adheres to a **canonical-source-first maintenance policy**.

Before creating a new documentation file:
1. **Identify Existing Canonical Owner**: Determine whether an existing canonical document (`DATABASE_INVENTORY.md`, `TENANT_MODEL.md`, `TENANT_ISOLATION.md`, `AUDIT_V2_REPORT.md`, `x402_PAYMENT_INFRASTRUCTURE.md`, `ZEGA_PLATFORM_ARCHITECTURE.md`, `TEST_MATRIX.md`, `EVIDENCE_STANDARD.md`) owns the domain.
2. **Update Canonical File First**: Update the canonical document when the technical information belongs to an existing domain.
3. **Justified New Files Only**: Create a new document only when the subject introduces a genuinely distinct documentation responsibility, audience, or lifecycle.
4. **No Duplicate Summaries**: Do not create duplicate summaries of canonical technical documentation.
5. **Historical Evidence Isolation**: Retain historical audit reports, prior RFCs, and grant evidence in `docs/audit/` with explicit `Status: HISTORICAL / SUPERSEDED` notices rather than duplicating them into active technical documentation.
6. **Reference Over Reproduction**: Verification evidence should reference canonical technical documentation rather than unnecessarily reproducing it.
7. **File Count Non-Metric**: File count is not a documentation quality metric. Documentation quality is evaluated by accuracy, discoverability, canonical ownership, evidence traceability, maintainability, appropriate detail level, and low unnecessary duplication.

---

## 6. Verification Script Capability & Limitation Matrix

The repository includes three automated verification scripts under `scripts/verification/`. Each script has explicit, bounded verification capabilities:

| Script Name | Purpose | Input Sources | Method & Scope Checked | Script Output | Explicit Limitations |
|---|---|---|---|---|---|
| `verify_docs_integrity.py` | Audits documentation link & path integrity | All `.md` files in `docs/` | Validates relative Markdown links, inline repo path references, forbidden rhetoric terms, and stale micro-doc references | `[SUCCESS] All implemented documentation integrity checks passed!` | **Does NOT establish**: Application security, absence of vulnerabilities, DB correctness, or production readiness. |
| `generate_db_inventory.py` | Extracts empirical database schema baseline | SQL migrations in `supabase/migrations/*.sql` | Counts migration files (56), tables (77), RLS status (68 enabled / 9 exempt), and RLS policies (148) | `[SUCCESS] Empirical database baseline verified against repository migrations!` | **Does NOT establish**: Live DB performance, query execution times, or live Supabase cluster connection status. |
| `inspect_tests.py` | Inventories empirical test suite coverage | Test files in `apps/api/src/__tests__/` & `packages/` | Counts total test files (30) and executable test cases (366) | `[SUCCESS] Empirical test suite inventory verified against repository test files!` | **Does NOT establish**: 100% code branch coverage or absence of runtime bugs outside tested paths. |

