#!/usr/bin/env python3
"""
Applies standardized Historical / Superseded notices to past audit documents in ZEGA.AI docs tree.
"""

import os

REPO_ROOT = '/home/wii-ros/Documents/Project/AEOP/ZEGA'
DOCS_DIR = os.path.join(REPO_ROOT, 'docs')

HISTORICAL_DOCS = [
    'REMEDIATION_BASELINE.md',
    'ZEGA_FINAL_REMEDIATION_REPORT.md',
    'ZEGA_FINAL_HARDENING_REPORT.md',
    'ZEROCLAW_FORENSIC_AUDIT.md',
    'security/AUDIT_V2_REPORT.md',
    'audit/ZEGA_ENTERPRISE_PRODUCTION_READINESS_AUDIT.md',
    'audit/ZEGA_FINAL_ENTERPRISE_PRODUCTION_HARDENING_REPORT.md',
    'audit/ZEGA_PRODUCTION_HARDENING_REPORT.md',
    'superteam/GRANT_SUBMISSION_EXECUTIVE_SUMMARY.md',
    'superteam/SOLANA_AGENTIC_ARCHITECTURE.md',
    'superteam/SUPERTEAM_GRANT_APPLICATION.md',
]

NOTICE_TEMPLATE = """> **Status:** HISTORICAL / SUPERSEDED
>
> This document records a previous audit state or historical submission.
> Refer to [current canonical documentation]({rel_readme}) for the current system state.

---

"""

def main():
    for rel_path in HISTORICAL_DOCS:
        full_path = os.path.join(DOCS_DIR, rel_path)
        if not os.path.exists(full_path):
            print(f"Skipping (not found): {rel_path}")
            continue

        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # If notice already exists, strip old notice block
        if 'HISTORICAL / SUPERSEDED' in content or 'DOCUMENT STATUS: HISTORICAL' in content:
            if content.startswith('>'):
                parts = content.split('---\n', 1)
                if len(parts) == 2:
                    content = parts[1]

        doc_dir = os.path.dirname(full_path)
        rel_readme = os.path.relpath(os.path.join(DOCS_DIR, 'README.md'), doc_dir)
        notice = NOTICE_TEMPLATE.format(rel_readme=rel_readme)

        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(notice + content.lstrip())

        print(f"Updated notice: {rel_path}")

if __name__ == '__main__':
    main()
