#!/usr/bin/env python3
"""
Documentation Integrity & Link Graph Verifier for ZEGA.AI
Audits all markdown files under /docs for:
1. Relative markdown links & target existence (excluding code blocks)
2. Referenced repository file paths
3. Unscoped marketing rhetoric / forbidden terms (excluding rule definitions)
"""

import os
import glob
import re
import sys

FORBIDDEN_RHETORIC = [
    (r'100%\s*secure', '100% secure'),
    (r'fully\s*secure', 'fully secure'),
    (r'completely\s*secure', 'completely secure'),
    (r'zero\s*vulnerabilities', 'zero vulnerabilities'),
    (r'zero\s*idor', 'zero idor'),
    (r'winner-ready', 'winner-ready'),
    (r'1st-place\s*potential', '1st-place potential'),
    (r'battle-tested', 'battle-tested'),
    (r'bulletproof', 'bulletproof'),
    (r'unbreakable', 'unbreakable'),
    (r'enterprise-grade\s*security', 'enterprise-grade security'),
]

# Rule definition files where forbidden terms are defined as rules, not used as hype
RULE_DEFINITION_FILES = {
    'governance/EVIDENCE_STANDARD.md',
    'audit/CLAIM_EVIDENCE_RECONCILIATION.md',
}

# Known external, planned, or upstream-referenced paths in specs/guides
PLANNED_OR_EXTERNAL_PATHS_PREFIXES = (
    'docs/book/',
    'docs/integrations/',
    'docs/TDD/',
    'docs/API/',
    'docs/guides/',
    'docs/security/playbook',
    'docs/deployment/',
    'docs/multi-tenancy/',
    'docs/multitenancy/',
    'docs/zeroclaw/sops/',
    'apps/api/src/routes/actions/',
    'apps/api/src/test_live_llm_keys.ts',
    'apps/web/src/services/privyWalletService.ts',
)

# Consolidated micro-documents that have been removed and must not be referenced as active targets
DELETED_SUPERSEDED_DOCS = [
    'PAYMENT_INFRASTRUCTURE_AUDIT_AND_RUNBOOK.md',
    'SOLANA_PAYMENT_SECURITY_MATRIX.md',
    'AI_ISOLATION.md',
    'CACHE_ISOLATION.md',
    'STORAGE_ISOLATION.md',
    'RAG_ISOLATION.md',
    'MCP_SECURITY.md',
    'ENTERPRISE_MODEL.md',
    'SUPERADMIN_MODEL.md',
    'UMKM_MODEL.md',
    'DATA_RECONCILIATION.md',
    'MIGRATION_EXCEPTIONS.md',
    'SCHEMA_AUDIT.md',
    'MONOREPO_ARCHITECTURE.md',
    'ARCHITECTURE_ZEROCLAW_PRIVY_REALTIME.md',
    'ZEGA_PRIVY_WITHDRAWAL_ARCHITECTURE.md',
]

def strip_code_blocks(text):
    """Removes fenced code blocks ``` ... ``` from text to avoid false positive links inside code examples."""
    return re.sub(r'```[\s\S]*?```', '', text)

def run_docs_integrity_audit(repo_root=None):
    if not repo_root:
        repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), '../..'))
    
    docs_dir = os.path.join(repo_root, 'docs')
    md_files = sorted(glob.glob(os.path.join(docs_dir, '**/*.md'), recursive=True))

    broken_links = []
    rhetoric_hits = []
    invalid_repo_paths = []

    link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')

    for mf in md_files:
        rel_doc = os.path.relpath(mf, docs_dir)
        with open(mf, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        content_no_code = strip_code_blocks(content)

        # Check links outside code blocks
        for m in link_pattern.finditer(content_no_code):
            text, link = m.group(1), m.group(2).strip()
            if link.startswith(('http://', 'https://', '#', 'mailto:')):
                continue
            
            clean_link = link.replace('file://', '').split('#')[0]
            if not clean_link:
                continue

            if clean_link.startswith('/'):
                target_path = clean_link
            else:
                target_path = os.path.normpath(os.path.join(os.path.dirname(mf), clean_link))

            if not os.path.exists(target_path):
                line_no = content[:m.start()].count('\n') + 1
                broken_links.append((rel_doc, line_no, text, link, target_path))

        # Check single-line inline code paths e.g. `apps/api/src/index.ts`
        inline_ticks = re.findall(r'`([^`\n]+)`', content)
        for code_item in inline_ticks:
            code_item = code_item.strip()
            if any(code_item.startswith(prefix) for prefix in ('apps/', 'packages/', 'supabase/', 'scripts/', 'docs/')):
                # Skip tree structures, wildcards, commands, or planned/external spec paths
                if '*' in code_item or '\n' in code_item or ' ' in code_item or '...' in code_item:
                    continue
                if any(code_item.startswith(prefix) for prefix in PLANNED_OR_EXTERNAL_PATHS_PREFIXES):
                    continue

                clean_ref = code_item.split('#')[0].split(':')[0]
                full_path = os.path.join(repo_root, clean_ref)
                if not os.path.exists(full_path):
                    idx = content.find(f'`{code_item}`')
                    line_no = content[:idx].count('\n') + 1 if idx != -1 else 1
                    invalid_repo_paths.append((rel_doc, line_no, code_item))

        # Check for references to deleted/superseded micro-documents in non-historical active docs
        if not rel_doc.startswith('audit/'):
            for deleted_doc in DELETED_SUPERSEDED_DOCS:
                if deleted_doc in content:
                    idx = content.find(deleted_doc)
                    line_no = content[:idx].count('\n') + 1
                    invalid_repo_paths.append((rel_doc, line_no, f"Reference to superseded doc '{deleted_doc}'"))

        # Check rhetoric (skip rule definition files)
        if rel_doc not in RULE_DEFINITION_FILES:
            for pattern, label in FORBIDDEN_RHETORIC:
                for m in re.finditer(pattern, content, re.IGNORECASE):
                    line_no = content[:m.start()].count('\n') + 1
                    rhetoric_hits.append((rel_doc, line_no, m.group(0)))

    return {
        'total_docs_count': len(md_files),
        'broken_links': broken_links,
        'rhetoric_hits': rhetoric_hits,
        'invalid_repo_paths': invalid_repo_paths,
    }

def main():
    repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), '../..'))
    results = run_docs_integrity_audit(repo_root)

    print("=== ZEGA.AI Documentation Integrity Audit ===")
    print(f"Total Markdown Files Audited: {results['total_docs_count']}")
    print(f"Broken Markdown Links:        {len(results['broken_links'])}")
    print(f"Invalid Repo Path References: {len(results['invalid_repo_paths'])}")
    print(f"Forbidden Rhetoric Hits:      {len(results['rhetoric_hits'])}")

    if results['broken_links']:
        print("\n--- BROKEN LINKS ---")
        for doc, lno, txt, lk, tgt in results['broken_links']:
            print(f"  {doc}:L{lno} [{txt}]({lk}) -> Target not found ({tgt})")

    if results['invalid_repo_paths']:
        print("\n--- INVALID REPO PATH REFERENCES ---")
        for doc, lno, pth in results['invalid_repo_paths']:
            print(f"  {doc}:L{lno} `{pth}` -> Path does not exist in repo")

    if results['rhetoric_hits']:
        print("\n--- FORBIDDEN RHETORIC HITS ---")
        for doc, lno, match in results['rhetoric_hits']:
            print(f"  {doc}:L{lno} -> '{match}'")

    if results['broken_links'] or results['invalid_repo_paths'] or results['rhetoric_hits']:
        sys.exit(1)
    else:
        print("\n[SUCCESS] All implemented documentation integrity checks passed!")

if __name__ == '__main__':
    main()
