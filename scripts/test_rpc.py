import urllib.request
import json
import os
import sys

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
    anon_key = os.environ.get('SUPABASE_ANON_KEY') or env_vars.get('SUPABASE_ANON_KEY')
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    return supabase_url, anon_key, service_key

SUPABASE_URL, ANON_KEY, SERVICE_KEY = load_env()

if not SUPABASE_URL or not SERVICE_KEY:
    print("[ERROR] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env or environment variables.")
    sys.exit(1)


def test_rpc(key, label, org_id="6f287c60-d75e-4101-a11c-0012abcce43f"):
    url = f"{SUPABASE_URL}/rest/v1/rpc/fn_ensure_store_for_organization"
    payload = {"p_org_id": org_id}
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    print(f"\n--- Testing RPC with {label} for org {org_id} ---")
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read().decode()
            print(f"[✓] SUCCESS ({resp.status}): {data}")
            return True
    except urllib.error.HTTPError as e:
        print(f"[!] HTTP ERROR ({e.code}): {e.read().decode()}")
        return False
    except Exception as e:
        print(f"[!] EXCEPTION: {e}")
        return False

if __name__ == "__main__":
    test_rpc(SERVICE_KEY, "SERVICE ROLE KEY")
    test_rpc(SERVICE_KEY, "SERVICE ROLE KEY (test 2)")
