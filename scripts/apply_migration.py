#!/usr/bin/env python3
import os
import sys
import subprocess

def get_db_url():
    env_path = os.path.join(os.path.dirname(__file__), '..', 'apps', 'api', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith('DATABASE_URL=') or line.startswith('DIRECT_URL='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    return os.environ.get('DATABASE_URL') or os.environ.get('DIRECT_URL')

def apply_sql(sql_file):
    db_url = get_db_url()
    if not db_url:
        print("[!] No DATABASE_URL found.")
        sys.exit(1)

    print(f"[*] Applying SQL file {sql_file} to database...")
    result = subprocess.run(['psql', db_url, '-f', sql_file], capture_output=True, text=True)
    if result.returncode == 0:
        print("[✓] Migration applied successfully!")
        print(result.stdout)
    else:
        print("[!] Failed to apply migration:")
        print(result.stderr)
        sys.exit(1)

if __name__ == '__main__':
    sql_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations', '20260818000000_trusted_user_bootstrap_and_provisioning_fix.sql')
    apply_sql(sql_path)
