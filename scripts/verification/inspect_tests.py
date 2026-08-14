#!/usr/bin/env python3
"""
Empirical Test Suite Inventory Generator & Verifier for ZEGA.AI
Scans test files in:
- apps/api/src/__tests__/*.test.ts
- packages/zeroclaw-bridge/src/__tests__/*.test.ts
Computes:
- Total test files count
- Total executable test cases (it/test blocks)
"""

import os
import glob
import re
import sys

def run_test_inventory_audit(repo_root=None):
    if not repo_root:
        repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), '../..'))

    api_tests = sorted(glob.glob(os.path.join(repo_root, 'apps/api/src/__tests__/*.test.ts')))
    bridge_tests = sorted(glob.glob(os.path.join(repo_root, 'packages/zeroclaw-bridge/src/__tests__/*.test.ts')))

    all_test_files = api_tests + bridge_tests
    total_test_cases = 0
    suite_details = []

    for tf in all_test_files:
        with open(tf, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            tests = re.findall(r'(it|test)\s*\(\s*[\'"`](.*?)[\'"`]', content)
            rel = os.path.relpath(tf, repo_root)
            suite_details.append((rel, len(tests)))
            total_test_cases += len(tests)

    return {
        'total_test_files': len(all_test_files),
        'api_test_files': len(api_tests),
        'bridge_test_files': len(bridge_tests),
        'total_test_cases': total_test_cases,
        'suite_details': suite_details,
    }

def main():
    stats = run_test_inventory_audit()

    print("=== ZEGA.AI Empirical Test Suite Inventory ===")
    print(f"Total Test Files: {stats['total_test_files']} (API: {stats['api_test_files']}, Bridge: {stats['bridge_test_files']})")
    print(f"Total Executable Test Cases: {stats['total_test_cases']}")

    # Verification checks against baseline
    assert stats['total_test_files'] == 30, f"Expected 30 test files, got {stats['total_test_files']}"
    assert stats['total_test_cases'] == 366, f"Expected 366 total test cases, got {stats['total_test_cases']}"

    print("\n[SUCCESS] Empirical test suite inventory verified against repository test files!")

if __name__ == '__main__':
    main()
