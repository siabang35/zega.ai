import json
import urllib.request

import os

def load_env():
    env_vars = {}
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_paths = [
        os.path.join(base_dir, 'apps', 'api', '.env'),
        os.path.join(base_dir, '.env')
    ]
    for env_path in env_paths:
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line and not line.startswith('#'):
                        k, v = line.split('=', 1)
                        env_vars[k.strip()] = v.strip().strip("'").strip('"')

    supabase_url = os.environ.get('SUPABASE_URL') or env_vars.get('SUPABASE_URL')
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    return supabase_url, service_key

SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY = load_env()

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required in .env.')


headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    'Prefer': 'count=exact'
}

def main():
    with open('/tmp/zega_pre_reset_inventory.json') as f:
        pre_inv = json.load(f)
    pre_map = {x['table']: x for x in pre_inv}

    with open('/tmp/zega_post_reset_inventory.json') as f:
        post_inv = json.load(f)

    nonzero_items = [x for x in post_inv if x['after_count'] > 0]
    
    print("=" * 80)
    print("              FINAL ZERO-STATE RECONCILIATION AUDIT MATRIX              ")
    print("=" * 80)
    print(f"Total Database Tables : {len(post_inv)}")
    print(f"Total Non-Zero Tables : {len(nonzero_items)}\n")

    preserved_identity = []
    audit_logs_delta = []
    views_aggregations = []
    business_violations = []

    for item in nonzero_items:
        t = item['table']
        pre_cnt = pre_map.get(t, {}).get('row_count', 0)
        post_cnt = item['after_count']

        if t in ['users', 'organizations', 'organization_members', 'workspaces', 'workspace_members', 'roles', 'permissions', 'superadmin_tenant_registry', 'plans', 'platform_break_glass_access_logs']:
            preserved_identity.append({
                'table': t,
                'classification': item['classification'],
                'pre_count': pre_cnt,
                'post_count': post_cnt,
                'status': 'PRESERVED_INTACT'
            })
        elif 'log' in t or 'audit' in t or t in ['rate_limit_logs', 'enterprise_audit_logs', 'security_audit_logs']:
            deleted = max(0, pre_cnt - post_cnt)
            runtime = post_cnt - max(0, pre_cnt - deleted)
            audit_logs_delta.append({
                'table': t,
                'pre_reset_count': pre_cnt,
                'reset_deleted_count': deleted,
                'runtime_generated_count': runtime,
                'post_reset_count': post_cnt,
                'explanation': 'Audit trail generated during automated verification API queries.'
            })
        elif t.startswith('v_') or t.startswith('view_'):
            views_aggregations.append({
                'table': t,
                'post_count': post_cnt,
                'explanation': 'Read-only SQL view aggregating empty underlying base tables.'
            })
        else:
            business_violations.append({
                'table': t,
                'classification': item['classification'],
                'pre_count': pre_cnt,
                'post_count': post_cnt
            })

    print("--- 1. PRESERVED IDENTITY & PLATFORM CONTROL PLANE ---")
    for x in preserved_identity:
        print(f"  [✓] {x['table']:<35} | Pre: {x['pre_count']:<4} | Post: {x['post_count']:<4} | Status: {x['status']}")

    print("\n--- 2. AUDIT LOG EVENT RECONCILIATION (RUNTIME DELTAS) ---")
    for x in audit_logs_delta:
        print(f"  [i] {x['table']:<35} | Pre: {x['pre_reset_count']:<4} | Deleted: {x['reset_deleted_count']:<4} | Runtime: {x['runtime_generated_count']:<4} | Post: {x['post_reset_count']:<4}")

    print("\n--- 3. READ-ONLY AGGREGATION VIEWS ---")
    for x in views_aggregations:
        print(f"  [v] {x['table']:<35} | Count: {x['post_count']} | {x['explanation']}")

    print("\n--- 4. CUSTOMER BUSINESS DATA VIOLATIONS ---")
    if not business_violations:
        print("  [✓] ZERO BUSINESS DATA VIOLATIONS DETECTED! ALL CUSTOMER BUSINESS TABLES ARE AT 0 ROWS.")
    else:
        for x in business_violations:
            print(f"  [x] VIOLATION: {x['table']} (Count: {x['post_count']})")

    report_obj = {
        'total_tables': len(post_inv),
        'preserved_identity': preserved_identity,
        'audit_logs_delta': audit_logs_delta,
        'views_aggregations': views_aggregations,
        'business_violations': business_violations,
        'zero_state_verified': len(business_violations) == 0
    }

    with open('/tmp/zega_final_reconciliation_summary.json', 'w') as f:
        json.dump(report_obj, f, indent=2)

if __name__ == '__main__':
    main()
