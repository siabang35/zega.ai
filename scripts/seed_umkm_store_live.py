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
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    return supabase_url, service_key

SUPABASE_URL, SUPABASE_KEY = load_env()

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env or environment variables.")
    sys.exit(1)


def seed_store():
    url = f"{SUPABASE_URL}/rest/v1/umkm_stores"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # First check existing stores for org
    check_url = f"{SUPABASE_URL}/rest/v1/umkm_stores?organization_id=eq.6f287c60-d75e-4101-a11c-0012abcce43f"
    req_check = urllib.request.Request(check_url, headers=headers)
    with urllib.request.urlopen(req_check) as resp:
        existing = json.loads(resp.read().decode())
        print(f"[*] Existing stores for organization 6f287c60-d75e-4101-a11c-0012abcce43f: {len(existing)}")
        if len(existing) > 0:
            print("Store already exists:", existing[0])
            return existing[0]

    # Insert default store
    payload = {
        "id": "6f287c60-d75e-4101-a11c-0012abcce43e",
        "organization_id": "6f287c60-d75e-4101-a11c-0012abcce43f",
        "name": "Toko UMKM ZEGA AI",
        "store_id_code": "STORE-DEF001",
        "email": "cicikberiuk@gmail.com",
        "phone": "+6281234567890",
        "address": "Jl. Utama No. 1, Jakarta"
    }
    
    req_post = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req_post) as resp:
            inserted = json.loads(resp.read().decode())
            print("[✓] Successfully seeded store record:", inserted)
            return inserted
    except Exception as e:
        print("[!] Error seeding store:", e)
        if hasattr(e, 'read'):
            print("Error details:", e.read().decode())

if __name__ == "__main__":
    seed_store()
