#!/usr/bin/env python3
"""
ZEGA.AI — TENANT CONSTITUTION SECURITY AUDIT ENGINE v5.1
Evidence-backed audit runner with root hash certification.
"""
import sys, os, json, hashlib, urllib.request, urllib.parse
from datetime import datetime

def load_env():
    env_vars = {}
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'apps', 'api', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip().strip("'").strip('"')
    url = os.environ.get('SUPABASE_URL') or env_vars.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url:
        print("[FATAL] SUPABASE_URL not found in .env or environment variables.")
        sys.exit(1)
    return url, key


def rpc(url, key, fn):
    req = urllib.request.Request(
        f"{url}/rest/v1/rpc/{fn}",
        data=json.dumps({}).encode(),
        headers={'apikey': key, 'Authorization': f"Bearer {key}", 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode()), None
    except Exception as e:
        return None, str(e)

def sha256(s):
    return hashlib.sha256(s.encode()).hexdigest()

def run():
    print("=" * 80)
    print("      ZEGA.AI — TENANT CONSTITUTION AUDIT ENGINE v5.1")
    print("=" * 80)
    ts = datetime.utcnow().isoformat() + "Z"
    print(f"Timestamp: {ts}")
    url, key = load_env()
    print(f"Target: {url}")
    print(f"Key: {'[PRESENT]' if key else '[MISSING]'}")
    if not key:
        print("[FATAL] SUPABASE_SERVICE_ROLE_KEY required."); sys.exit(1)

    # Phase 1: Part 1 invariants (INV-01 to INV-25)
    print("\n[1/4] Running INV-01..INV-25 via run_tenant_constitution_audit_v51()...")
    d1, e1 = rpc(url, key, 'run_tenant_constitution_audit_v51')
    if e1:
        print(f"[!] Error: {e1}"); sys.exit(1)

    # Phase 2: Part 2 invariants (INV-26 to INV-50)
    print("[2/4] Running INV-26..INV-50 via run_certification_v51_extended()...")
    d2, e2 = rpc(url, key, 'run_certification_v51_extended')
    if e2:
        print(f"[!] Error: {e2}"); sys.exit(1)

    # Phase 3: Metamorphic suite
    print("[3/4] Running metamorphic suite via run_metamorphic_test_suite_v51()...")
    dm, em = rpc(url, key, 'run_metamorphic_test_suite_v51')

    # Combine invariants (exclude internal counters)
    all_inv = [i for i in (d1 or []) if i.get('check_name','') != '_INTERNAL_COUNTERS'] + (d2 or [])
    passed = sum(1 for i in all_inv if i.get('status') == 'PASSED')
    failed = sum(1 for i in all_inv if i.get('status') == 'FAILED')
    unverified = sum(1 for i in all_inv if i.get('status') == 'UNVERIFIED')
    certified_items = sum(1 for i in all_inv if i.get('status') == 'CERTIFIED')

    print(f"\n{'='*80}")
    print(f"{'ID':<6} {'NAME':<42} {'STATUS':<12} {'VIOLATIONS':<10}")
    print("=" * 80)
    evidence = []
    for i in all_inv:
        cid = i.get('check_id', 0)
        name = i.get('check_name', '')
        st = i.get('status', 'UNVERIFIED')
        vc = i.get('violating_count', 0)
        det = i.get('details', '')
        h = sha256(f"{cid}|{name}|{st}|{vc}|{det}")
        evidence.append({"check_id": cid, "name": name, "status": st, "violations": vc, "details": det, "sha256": h})
        color = '\033[92m' if st in ('PASSED','CERTIFIED') else '\033[91m' if st == 'FAILED' else '\033[93m'
        print(f"{cid:<6} {name:<42} {color}{st}\033[0m {vc}")

    # Metamorphic results
    m_results = []
    m_passed = m_failed = 0
    if dm:
        print(f"\n{'-'*80}")
        print(f"{'MID':<6} {'MUTATION':<40} {'EXPECTED':<12} {'PASSED':<8}")
        print("-" * 80)
        for m in dm:
            mp = m.get('passed', False)
            if mp: m_passed += 1
            else: m_failed += 1
            mh = sha256(f"{m.get('mutation_id')}|{m.get('mutation_name')}|{m.get('expected')}|{m.get('actual')}|{mp}")
            m_results.append({**m, "sha256": mh})
            print(f"{m.get('mutation_id',''):<6} {m.get('mutation_name',''):<40} {m.get('expected',''):<12} {mp}")

    # Root hash
    combined = "".join(e["sha256"] for e in evidence) + "".join(m["sha256"] for m in m_results)
    root_hash = sha256(combined)
    is_cert = failed == 0 and unverified == 0

    report = {
        "engine_version": "v5.1_constitutional_hardened",
        "timestamp": ts,
        "status": "CERTIFIED" if is_cert else "NOT_CERTIFIED",
        "summary": {"total": len(all_inv), "passed": passed, "failed": failed, "unverified": unverified, "certified": certified_items, "metamorphic_total": len(m_results), "metamorphic_passed": m_passed, "metamorphic_failed": m_failed},
        "root_hash": root_hash,
        "evidence": evidence,
        "metamorphic": m_results
    }

    rpath = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v51_certification_report.json')
    with open(rpath, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n{'='*80}")
    print("                    CERTIFICATION SUMMARY v5.1")
    print("=" * 80)
    cs = '\033[92mCERTIFIED\033[0m' if is_cert else '\033[91mNOT CERTIFIED\033[0m'
    print(f"Status          : {cs}")
    print(f"Invariants      : {passed}/{len(all_inv)} passed, {failed} failed, {unverified} unverified")
    print(f"Metamorphic     : {m_passed}/{len(m_results)} passed")
    print(f"Root Hash       : {root_hash}")
    print(f"Report          : {rpath}")
    print("=" * 80)
    sys.exit(0 if is_cert else 1)

if __name__ == '__main__':
    run()
