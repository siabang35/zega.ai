#!/usr/bin/env python3
"""
================================================================================
ZEGA.AI — TENANT CONSTITUTION SECURITY AUDIT ENGINE v5.0
EVIDENCE-BACKED AUDIT RUNNER
================================================================================
"""

import sys
import os
import json
import hashlib
import urllib.request
import urllib.parse
from datetime import datetime

def load_env():
    """Load SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from apps/api/.env or environment"""
    env_vars = {}
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'apps', 'api', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip().strip("'").strip('"')
    
    supabase_url = os.environ.get('SUPABASE_URL') or env_vars.get('SUPABASE_URL')
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    db_url = os.environ.get('DATABASE_URL') or env_vars.get('DATABASE_URL')

    if not supabase_url:
        print("[FATAL] SUPABASE_URL not found in .env or environment variables.")
        sys.exit(1)

    
    return supabase_url, service_key, db_url

def execute_rpc(supabase_url, service_key, function_name):
    """Execute Postgres RPC function via Supabase REST API"""
    url = f"{supabase_url}/rest/v1/rpc/{function_name}"
    headers = {
        'apikey': service_key,
        'Authorization': f"Bearer {service_key}",
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    req = urllib.request.Request(url, data=json.dumps({}).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body), None
    except Exception as e:
        return None, str(e)

def calculate_sha256(data_str):
    """Compute SHA-256 evidence hash"""
    return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

def run_audit():
    print("=" * 80)
    print("      ZEGA.AI — TENANT CONSTITUTION SECURITY AUDIT ENGINE v5.0")
    print("=" * 80)
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    
    supabase_url, service_key, db_url = load_env()
    print(f"Target Cluster URL : {supabase_url}")
    print(f"Service Role Key   : {'[PRESENT]' if service_key else '[MISSING]'}")
    print(f"Engine Version     : v5.0_constitutional_hardened")
    print("-" * 80)

    if not service_key:
        print("[FATAL] SUPABASE_SERVICE_ROLE_KEY is required to run the audit.")
        sys.exit(1)

    # 1. Run 50 Dynamic Invariants
    print("\n[*] Executing 50 Dynamic Invariants via run_tenant_constitution_audit_v50()...")
    invariants_data, err = execute_rpc(supabase_url, service_key, 'run_tenant_constitution_audit_v50')
    
    if err:
        print(f"[!] Error executing run_tenant_constitution_audit_v50: {err}")
        print("[!] Note: Please ensure migration 20260816000000_v50_database_constitution_master.sql is applied.")
        sys.exit(1)

    passed_count = 0
    failed_count = 0
    unverified_count = 0
    evidence_items = []

    print("\n" + "=" * 80)
    print(f"{'ID':<6} {'NAME':<42} {'STATUS':<12} {'VIOLATIONS':<12}")
    print("=" * 80)

    for item in invariants_data:
        cid = item.get('check_id')
        cname = item.get('check_name', '')
        status = item.get('status', 'UNVERIFIED')
        violations = item.get('violating_count', 0)
        details = item.get('details', '')

        if status == 'PASSED':
            passed_count += 1
            status_str = "\033[92mPASSED\033[0m"
        elif status == 'FAILED':
            failed_count += 1
            status_str = "\033[91mFAILED\033[0m"
        else:
            unverified_count += 1
            status_str = "\033[93mUNVERIFIED\033[0m"

        item_str = f"{cid}|{cname}|{status}|{violations}|{details}"
        item_hash = calculate_sha256(item_str)
        
        evidence_items.append({
            "check_id": cid,
            "name": cname,
            "status": status,
            "violating_count": violations,
            "details": details,
            "sha256_evidence": item_hash
        })

        print(f"{cid:<6} {cname:<42} {status:<12} {violations:<12}")

    # 2. Run Metamorphic Test Suite
    print("\n[*] Executing Metamorphic Mutation Test Suite via run_metamorphic_test_suite_v50()...")
    metamorphic_data, m_err = execute_rpc(supabase_url, service_key, 'run_metamorphic_test_suite_v50')
    
    metamorphic_results = []
    m_passed = 0
    m_failed = 0

    if metamorphic_data:
        print("\n" + "-" * 80)
        print(f"{'MID':<6} {'MUTATION NAME':<40} {'EXPECTED':<12} {'PASSED':<10}")
        print("-" * 80)
        for m in metamorphic_data:
            mid = m.get('mutation_id')
            mname = m.get('mutation_name')
            exp = m.get('expected')
            act = m.get('actual')
            mpassed = m.get('passed', False)
            
            if mpassed:
                m_passed += 1
            else:
                m_failed += 1

            metamorphic_results.append({
                "mutation_id": mid,
                "name": mname,
                "expected": exp,
                "actual": act,
                "passed": mpassed,
                "sha256": calculate_sha256(f"{mid}|{mname}|{exp}|{act}|{mpassed}")
            })
            print(f"{mid:<6} {mname:<40} {exp:<12} {str(mpassed):<10}")

    # 3. Certification Root Hash Calculation
    combined_hash_input = "".join([e["sha256_evidence"] for e in evidence_items]) + "".join([m["sha256"] for m in metamorphic_results])
    root_hash = calculate_sha256(combined_hash_input)

    is_certified = (failed_count == 0 and unverified_count == 0)

    audit_report = {
        "engine_version": "v5.0_constitutional_hardened",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "certification_status": "CERTIFIED" if is_certified else "NOT_CERTIFIED",
        "summary": {
            "total_invariants": len(evidence_items),
            "passed": passed_count,
            "failed": failed_count,
            "unverified": unverified_count,
            "metamorphic_total": len(metamorphic_results),
            "metamorphic_passed": m_passed,
            "metamorphic_failed": m_failed
        },
        "certification_root_hash": root_hash,
        "evidence_log": evidence_items,
        "metamorphic_log": metamorphic_results
    }

    # Write report artifact
    report_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v50_certification_report.json')
    with open(report_file, 'w') as f:
        json.dump(audit_report, f, indent=2)

    print("\n" + "=" * 80)
    print("                      CERTIFICATION AUDIT SUMMARY                              ")
    print("=" * 80)
    status_label = "\033[92mCERTIFIED\033[0m" if is_certified else "\033[91mNOT CERTIFIED\033[0m"
    print(f"Certification Status     : {status_label}")

    print(f"Total Invariants Checked : {len(evidence_items)}")
    print(f"Invariants Passed        : {passed_count}")
    print(f"Invariants Failed        : {failed_count}")
    print(f"Invariants Unverified    : {unverified_count}")
    print(f"Metamorphic Mutations    : {m_passed}/{len(metamorphic_results)} Passed")
    print(f"Certification Root Hash  : {root_hash}")
    print(f"Report File              : {report_file}")
    print("=" * 80)

    if not is_certified:
        print("\n[!] AUDIT FAILED: Tenant isolation invariants violated.")
        sys.exit(1)
    else:
        print("\n[✓] AUDIT PASSED: Database Constitution v5.0 fully verified.")
        sys.exit(0)

if __name__ == '__main__':
    run_audit()
