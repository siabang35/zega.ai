#!/usr/bin/env python3
"""
ZEGA.AI — Tenant Boundary Constitutional Audit Runner v3.2
Zero False-Positive Enforcement.
Connects to database and executes run_tenant_constitution_audit().
"""

import json
import os
import sys
import subprocess


def get_db_url():
    """Extract DATABASE_URL from apps/api/.env"""
    env_path = os.path.join(os.path.dirname(__file__), '..', 'apps', 'api', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith('DATABASE_URL=') or line.startswith('DIRECT_URL='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    supabase_url = os.environ.get('DATABASE_URL') or os.environ.get('DIRECT_URL')
    if supabase_url:
        return supabase_url
    print("[FATAL] No DATABASE_URL found in apps/api/.env or environment")
    sys.exit(1)


def run_audit():
    print("=" * 78)
    print("ZEGA.AI — TENANT BOUNDARY CONSTITUTIONAL AUDIT v3.2")
    print("ZERO FALSE-POSITIVE ENFORCEMENT")
    print("=" * 78)

    db_url = get_db_url()
    print(f"[*] Connecting to database...")

    # Run the audit function
    sql = "SELECT check_id, check_name, status, violating_count, details FROM run_tenant_constitution_audit() ORDER BY check_id;"
    try:
        result = subprocess.run(
            ['psql', db_url, '-t', '-A', '-F', '|', '-c', sql],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            print(f"[FATAL] psql error: {result.stderr}")
            sys.exit(1)
    except FileNotFoundError:
        print("[FATAL] psql not found. Install postgresql-client.")
        sys.exit(1)

    lines = [l.strip() for l in result.stdout.strip().split('\n') if l.strip()]

    print(f"\n{'ID':<4} {'CHECK NAME':<55} {'STATUS':<12} {'VIOLATIONS':<10}")
    print("-" * 85)

    passed = 0
    failed = 0
    unverified = 0
    results = []

    for line in lines:
        parts = line.split('|')
        if len(parts) < 5:
            continue
        cid, cname, status, vcount, details = parts[0], parts[1], parts[2], parts[3], parts[4]
        results.append({
            'check_id': int(cid),
            'check_name': cname.strip(),
            'status': status.strip(),
            'violating_count': int(vcount),
            'details': details.strip()
        })
        status_str = status.strip()
        icon = '✅' if status_str in ('PASSED', 'CERTIFIED') else '❌' if status_str == 'FAILED' else '⚠️'
        print(f"{cid:<4} {cname.strip():<55} {icon} {status_str:<10} {vcount:<10}")

        if status_str in ('PASSED', 'CERTIFIED'):
            passed += 1
        elif status_str == 'FAILED':
            failed += 1
        elif status_str == 'UNVERIFIED':
            unverified += 1

    print("-" * 85)
    print(f"\n{'CERTIFICATION SUMMARY':^85}")
    print(f"  PASSED:     {passed}")
    print(f"  FAILED:     {failed}")
    print(f"  UNVERIFIED: {unverified}")

    # Run self-audit
    print(f"\n{'=' * 78}")
    print("SELF-AUDIT OF AUDITOR ENGINE")
    print("=" * 78)

    sql_sa = "SELECT check_id, check_name, status, violation_count, details FROM run_certification_engine_self_audit() ORDER BY check_id;"
    try:
        result_sa = subprocess.run(
            ['psql', db_url, '-t', '-A', '-F', '|', '-c', sql_sa],
            capture_output=True, text=True, timeout=30
        )
        if result_sa.returncode == 0:
            for line in result_sa.stdout.strip().split('\n'):
                parts = line.split('|')
                if len(parts) >= 5:
                    icon = '✅' if parts[2].strip() in ('PASSED', 'CERTIFIED') else '❌'
                    print(f"  {icon} {parts[1].strip()}: {parts[2].strip()} ({parts[4].strip()})")
    except Exception as e:
        print(f"  [WARN] Self-audit failed: {e}")

    # Final verdict
    print(f"\n{'=' * 78}")
    if failed == 0 and unverified == 0 and passed == 30:
        print("✅ ZEGA TENANT CONSTITUTION CERTIFICATION v3.2 — CERTIFIED")
        print(f"   {passed}/30 checks independently verified, measured, and proven.")
        sys.exit(0)
    else:
        print("❌ CERTIFICATION FAILED")
        if failed > 0:
            print(f"   {failed} check(s) FAILED with measured violations.")
        if unverified > 0:
            print(f"   {unverified} check(s) UNVERIFIED (query execution failed).")
        print(f"   DO NOT CLAIM 30/30.")
        sys.exit(1)


def run_self_audit():
    """Run self-audit of the audit runner itself."""
    print("=" * 78)
    print("SELF-AUDIT: AUDIT RUNNER SOURCE CODE SCAN")
    print("=" * 78)

    # Read the v3.2 migration SQL
    sql_path = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations',
                            '20260815210000_certification_engine_v32.sql')
    if not os.path.exists(sql_path):
        print(f"[FATAL] Migration file not found: {sql_path}")
        sys.exit(1)

    with open(sql_path) as f:
        source = f.read()

    violations = 0

    # SA-1: No unconditional 'PASSED', 0
    import re
    matches = re.findall(r"RETURN QUERY SELECT \d+,.*'PASSED',\s*0", source)
    count = len(matches)
    icon = '✅' if count == 0 else '❌'
    print(f"  {icon} SA-1: Unconditional PASSED/0 returns: {count}")
    violations += count

    # SA-2: No fail-open := 0
    matches = re.findall(r"EXCEPTION WHEN OTHERS THEN\s*\n\s*v_\w+\s*:=\s*0", source)
    count = len(matches)
    icon = '✅' if count == 0 else '❌'
    print(f"  {icon} SA-2: Fail-open exception handlers: {count}")
    violations += count

    # SA-3: Fail-closed handler count
    count = source.count('v_unverified_count := v_unverified_count + 1')
    icon = '✅' if count >= 29 else '❌'
    print(f"  {icon} SA-3: Fail-closed handlers: {count} (need >= 29)")
    if count < 29:
        violations += 1

    print(f"\n  {'✅ SELF-AUDIT PASSED' if violations == 0 else '❌ SELF-AUDIT FAILED: ' + str(violations) + ' violations'}")
    return violations == 0


if __name__ == '__main__':
    if '--self-audit' in sys.argv:
        ok = run_self_audit()
        sys.exit(0 if ok else 1)
    else:
        run_audit()
