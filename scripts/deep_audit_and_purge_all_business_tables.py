import urllib.request
import json
import os
import subprocess

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


# Strictly PRESERVED tables (IDENTITY, TENANCY, AUTHORIZATION, SUPERADMIN CONTROL PLANE, GLOBAL CATALOGS)
STRICT_PRESERVE = {
    'users', 'auth_identities', 'user_profiles', 'profiles', 'umkm_users',
    'organizations', 'organization_members', 'organization_memberships',
    'workspaces', 'workspace_members', 'workspace_memberships',
    'enterprise_members', 'enterprise_organizations', 'tenant_config', 'umkm_stores',
    'roles', 'permissions', 'role_permissions', 'user_roles', 'user_permissions', 'enterprise_mcp_permissions',
    'superadmin_tenant_registry', 'superadmin_accounts', 'deployment_registry', 'plans', 'platform_break_glass_access_logs',
    'enterprise_help_categories', 'enterprise_help_faqs', 'enterprise_mcp_catalog', 'integration_catalog', 'mcp_catalog', 'public_docs', 'public_faqs', 'code_examples', 'integration_categories', 'finops_categories',
    'enterprise_general_settings', 'enterprise_advanced_config', 'enterprise_notifications_config', 'enterprise_data_privacy_settings', 'enterprise_infrastructure_inventory',
    'schema_migrations', 'spatial_ref_sys', 'system_health'
}

headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    'Prefer': 'count=exact'
}

def get_table_list():
    req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/', headers=headers)
    with urllib.request.urlopen(req) as resp:
        spec = json.loads(resp.read().decode())
    return sorted(list(spec.get('definitions', {}).keys()))

def get_row_count(table):
    req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1', headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            cr = resp.headers.get('Content-Range')
            if cr:
                return int(cr.split('/')[1])
            data = json.loads(resp.read().decode())
            return len(data)
    except Exception:
        return 0

def purge_table(table):
    # Try bulk delete first
    del_url = f'{SUPABASE_URL}/rest/v1/{table}?or=(id.not.is.null,created_at.not.is.null,organization_id.not.is.null)'
    req = urllib.request.Request(del_url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            pass
    except Exception as e:
        # Fallback to chunked ID deletion
        try:
            req_get = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/{table}?select=*&limit=500', headers=headers)
            with urllib.request.urlopen(req_get) as resp_get:
                rows = json.loads(resp_get.read().decode())
            if isinstance(rows, list) and len(rows) > 0:
                pk_col = 'id' if 'id' in rows[0] else list(rows[0].keys())[0]
                ids = [str(r[pk_col]) for r in rows if r.get(pk_col) is not None]
                if ids:
                    ids_str = '","'.join(ids)
                    req_del_chunk = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/{table}?{pk_col}=in.("{ids_str}")', headers=headers, method='DELETE')
                    with urllib.request.urlopen(req_del_chunk) as resp_del:
                        pass
        except Exception as inner_e:
            pass

def main():
    print("=" * 80)
    print("      ZEGA DEEP FORENSIC AUDIT & COMPLETE BUSINESS DATA PURGE      ")
    print("=" * 80)

    tables = get_table_list()
    print(f"Discovered {len(tables)} total database tables.")

    audit_results = []
    purged_tables = []

    for t in tables:
        if t in STRICT_PRESERVE:
            cnt = get_row_count(t)
            audit_results.append({
                'table': t,
                'category': 'PRESERVED_SYSTEM_IDENTITY',
                'action': 'PRESERVED',
                'count': cnt
            })
            continue

        cnt = get_row_count(t)
        if cnt > 0:
            print(f"[*] Non-zero table detected: {t} ({cnt} rows). Purging business data...")
            purge_table(t)
            after_cnt = get_row_count(t)
            print(f"    [=] Result for {t}: Before={cnt}, After={after_cnt}")
            purged_tables.append(t)
            audit_results.append({
                'table': t,
                'category': 'PURGED_BUSINESS_STATE',
                'action': 'PURGED',
                'before': cnt,
                'after': after_cnt
            })
        else:
            audit_results.append({
                'table': t,
                'category': 'CLEAN_ZERO_STATE',
                'action': 'NO_OP',
                'count': 0
            })

    print("\n" + "=" * 80)
    print("                        PURGE EXECUTION COMPLETE                       ")
    print("=" * 80)
    print(f"Total tables evaluated : {len(tables)}")
    print(f"Total tables purged    : {len(purged_tables)}")

    with open('/tmp/zega_deep_audit_results.json', 'w') as f:
        json.dump(audit_results, f, indent=2)

if __name__ == '__main__':
    main()
