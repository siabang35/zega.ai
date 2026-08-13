#!/usr/bin/env python3
"""
Empirical Database Inventory Generator & Verifier for ZEGA.AI
Scans supabase/migrations/*.sql and computes:
- Migration file count
- Unique table count
- RLS enabled table count & exemptions
- Total RLS policies created
"""

import os
import glob
import re
import sys

def run_db_inventory_audit(repo_root=None):
    if not repo_root:
        repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), '../..'))
    
    migrations_dir = os.path.join(repo_root, 'supabase/migrations')
    if not os.path.exists(migrations_dir):
        print(f"Error: Migrations directory not found at {migrations_dir}", file=sys.stderr, flush=True)
        return None

    sql_files = sorted(glob.glob(os.path.join(migrations_dir, '*.sql')))
    tables = {}

    table_create_re = re.compile(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.\"]+)', re.IGNORECASE)
    rls_enable_re = re.compile(r'ALTER\s+TABLE\s+(?:ONLY\s+)?([a-zA-Z0-9_\.\"]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY', re.IGNORECASE)
    policy_re = re.compile(r'CREATE\s+POLICY\s+"?([^"]+)"?\s+ON\s+([a-zA-Z0-9_\.\"]+)', re.IGNORECASE)

    for sql_file in sql_files:
        fname = os.path.basename(sql_file)
        with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        for m in table_create_re.finditer(content):
            raw_tname = m.group(1).replace('public.', '').replace('"', '').strip()
            if raw_tname and raw_tname not in tables:
                tables[raw_tname] = {
                    'created_in': fname,
                    'rls_enabled': False,
                    'policies': [],
                }

        for m in rls_enable_re.finditer(content):
            tname = m.group(1).replace('public.', '').replace('"', '').strip()
            if tname in tables:
                tables[tname]['rls_enabled'] = True

        for m in policy_re.finditer(content):
            pname = m.group(1).strip()
            tname = m.group(2).replace('public.', '').replace('"', '').strip()
            if tname in tables:
                tables[tname]['policies'].append((pname, fname))

    rls_enabled_cnt = sum(1 for t in tables.values() if t['rls_enabled'])
    exempt_cnt = sum(1 for t in tables.values() if not t['rls_enabled'])
    total_policies = sum(len(t['policies']) for t in tables.values())

    stats = {
        'migration_files_count': len(sql_files),
        'total_tables_count': len(tables),
        'rls_enabled_count': rls_enabled_cnt,
        'exempt_tables_count': exempt_cnt,
        'total_policies_count': total_policies,
        'tables': tables,
    }

    return stats

def main():
    stats = run_db_inventory_audit()
    if not stats:
        sys.exit(1)

    print("=== ZEGA.AI Empirical Database Inventory ===", flush=True)
    print(f"Migration Files Count: {stats['migration_files_count']}", flush=True)
    print(f"Total Database Tables: {stats['total_tables_count']}", flush=True)
    print(f"RLS Enabled Tables:    {stats['rls_enabled_count']}", flush=True)
    print(f"Exempt System Tables:  {stats['exempt_tables_count']}", flush=True)
    print(f"Total RLS Policies:    {stats['total_policies_count']}", flush=True)

    # Verification checks against baseline
    assert stats['migration_files_count'] == 56, f"Expected 56 migration files, got {stats['migration_files_count']}"
    assert stats['total_tables_count'] == 77, f"Expected 77 total tables, got {stats['total_tables_count']}"
    assert stats['rls_enabled_count'] == 68, f"Expected 68 RLS-enabled tables, got {stats['rls_enabled_count']}"
    assert stats['exempt_tables_count'] == 9, f"Expected 9 exempt tables, got {stats['exempt_tables_count']}"
    assert stats['total_policies_count'] == 148, f"Expected 148 RLS policies, got {stats['total_policies_count']}"

    print("\n[SUCCESS] Empirical database baseline verified against repository migrations!", flush=True)

if __name__ == '__main__':
    main()
