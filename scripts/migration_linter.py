#!/usr/bin/env python3
"""
ZEGA.AI — CI Migration Safety Gate Linter
Validates SQL migrations against constitutional tenant security rules.
"""

import re
import sys

def lint_file(file_path):
    print(f"[*] Linting migration file: {file_path}")
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    errors = []

    # Check 1: ALTER TABLE ... DISABLE ROW LEVEL SECURITY
    if re.search(r'DISABLE\s+ROW\s+LEVEL\s+SECURITY', content, re.IGNORECASE):
        errors.append("Forbidden clause detected: DISABLE ROW LEVEL SECURITY")

    # Check 2: DROP POLICY without immediate re-creation or security check
    if re.search(r'DROP\s+POLICY\b', content, re.IGNORECASE) and not re.search(r'CREATE\s+POLICY\b', content, re.IGNORECASE):
        errors.append("DROP POLICY detected without corresponding CREATE POLICY in same migration")

    # Check 3: Hardcoded fallback UUID usage
    if re.search(r'00000000-0000-0000-0000-000000000001', content):
        errors.append("Forbidden fallback UUID 00000000-0000-0000-0000-000000000001 detected")

    # Check 4: CREATE TABLE without tenant strategy or manifest update
    create_tables = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.]+)', content, re.IGNORECASE)
    for tbl in create_tables:
        if 'tenant_security_manifest' not in content and tbl not in ['tenant_security_manifest', 'schema_migrations']:
            errors.append(f"Table '{tbl}' created without registering in tenant_security_manifest")

    if errors:
        print(f"[FAIL] {len(errors)} migration lint errors found:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("[PASSED] Migration passes all constitutional security linter checks.")
        return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 migration_linter.py <path_to_sql_migration>")
        sys.exit(1)
    
    success = lint_file(sys.argv[1])
    sys.exit(0 if success else 1)
