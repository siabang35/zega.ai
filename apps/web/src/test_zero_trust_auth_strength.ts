/**
 * Automated Zero-Trust Auth Strength & Multi-Role Isolation Test Suite
 * 
 * Verifies:
 * 1. Storage Integrity & Anti-Tampering Checksum Guard
 * 2. Zero Fallback Email Enforcement
 * 3. OWASP Anti-Tamper Request Header Signature Generation
 * 4. Strict Role Isolation (UMKM vs Enterprise vs Superadmin)
 * 5. Atomic Account Switch Identity Isolation (Account A -> Account B)
 */

import {
  getIdentityChecksum,
  verifyStorageIdentityIntegrity,
  setStorageIdentityChecksum,
  purgeAllAuthSessionState,
} from './app/services/accountTypeManager';
import { getCanonicalAuthHeaders } from './app/dashboard/services/supabaseService';
import { resolveTenantFromUser, TenantType } from './app/dashboard/contexts/TenantContext';

export interface TestResult {
  testName: string;
  category: 'ANTI_TAMPER' | 'ROLE_ISOLATION' | 'ZERO_FALLBACK' | 'IDENTITY_SWITCH';
  passed: boolean;
  details: string;
}

export class ZeroTrustAuthSecurityAuditor {
  private results: TestResult[] = [];

  private logResult(testName: string, category: TestResult['category'], passed: boolean, details: string) {
    const result: TestResult = { testName, category, passed, details };
    this.results.push(result);
    const icon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[SECURITY_AUDIT] ${icon} | [${category}] ${testName}: ${details}`);
  }

  /**
   * TEST 1: Storage Anti-Tampering & Cryptographic Checksum Test
   */
  public testStorageAntiTampering(): void {
    console.log('\n--- Running TEST 1: Storage Anti-Tampering & Checksum ---');
    try {
      const email = 'wildanassyidiq142@gmail.com';
      const userId = '00000000-0000-0000-0000-000000000001';

      // A. Stamp valid identity checksum
      setStorageIdentityChecksum(email, userId);
      const isIntegrityValid = verifyStorageIdentityIntegrity(email, userId);
      this.logResult(
        'Valid Storage Signature Check',
        'ANTI_TAMPER',
        isIntegrityValid,
        isIntegrityValid ? 'Valid checksum verified successfully.' : 'Valid checksum failed integrity check!'
      );

      // B. Simulate Attacker Tampering (Modifying localStorage email to impersonate another user)
      localStorage.setItem('zega_user_email', 'hacker@malicious.com');
      const isTamperedCaught = !verifyStorageIdentityIntegrity(email, userId);
      const wasStoragePurged = !localStorage.getItem('zega_identity_checksum');

      this.logResult(
        'Tampered Email Detection & Fail-Closed Storage Sanitization',
        'ANTI_TAMPER',
        isTamperedCaught && wasStoragePurged,
        isTamperedCaught && wasStoragePurged
          ? 'Storage tampering detected! Stale local storage was instantly sanitized.'
          : 'CRITICAL SECURITY VULNERABILITY: Storage tampering was NOT caught or purged!'
      );
    } catch (e: any) {
      this.logResult('Storage Anti-Tampering Test', 'ANTI_TAMPER', false, `Exception: ${e.message}`);
    }
  }

  /**
   * TEST 2: Zero Fallback Email Enforcement Test
   */
  public testZeroFallbackEnforcement(): void {
    console.log('\n--- Running TEST 2: Zero Fallback Email Enforcement ---');
    try {
      // Purge storage to ensure pristine unauthenticated environment
      purgeAllAuthSessionState();

      const headers = getCanonicalAuthHeaders();
      const userEmailHeader = headers['x-user-email'] || '';
      
      const containsHardcodedFallback = 
        userEmailHeader.includes('siabang35') || 
        userEmailHeader.includes('cikberiuk') || 
        userEmailHeader.includes('umkm-user');

      this.logResult(
        'Zero Fallback Email Audit',
        'ZERO_FALLBACK',
        !containsHardcodedFallback,
        !containsHardcodedFallback
          ? `Unauthenticated request contains zero fallback emails (x-user-email: "${userEmailHeader}").`
          : `SECURITY LEAK: Found hardcoded fallback email in request headers: "${userEmailHeader}"`
      );

      // Verify OWASP Anti-Tamper Headers exist
      const hasTimestamp = Boolean(headers['X-ZEGA-Timestamp']);
      const hasSig = Boolean(headers['X-ZEGA-Anti-Tamper-Sig']);

      this.logResult(
        'OWASP Anti-Tamper Request Signature & Timestamp Headers',
        'ZERO_FALLBACK',
        hasTimestamp && hasSig,
        hasTimestamp && hasSig
          ? `Generated OWASP headers: Timestamp=${headers['X-ZEGA-Timestamp']}, Sig=${headers['X-ZEGA-Anti-Tamper-Sig']}`
          : 'Missing OWASP Anti-Tamper headers!'
      );
    } catch (e: any) {
      this.logResult('Zero Fallback Enforcement Test', 'ZERO_FALLBACK', false, `Exception: ${e.message}`);
    }
  }

  /**
   * TEST 3: Multi-Layer Zero-Trust Role Isolation (UMKM vs Enterprise vs Superadmin)
   */
  public testRoleIsolation(): void {
    console.log('\n--- Running TEST 3: Strict Role Isolation ---');
    try {
      // A. Test UMKM User Role Isolation
      const umkmEmail = 'toko.berkah@gmail.com';
      const umkmTenant = resolveTenantFromUser(umkmEmail, 'umkm');
      const isUmkmIsolated = umkmTenant.tenantType === 'umkm';

      this.logResult(
        'UMKM Role Isolation Gate',
        'ROLE_ISOLATION',
        isUmkmIsolated,
        isUmkmIsolated
          ? `UMKM User resolved to tenantType="${umkmTenant.tenantType}". Restricted to store-level tenant context.`
          : `FAIL: UMKM User erroneously assigned tenantType="${umkmTenant.tenantType}"`
      );

      // B. Test Enterprise User Role Isolation
      const enterpriseEmail = 'executive@enterprise-corp.com';
      localStorage.setItem('zega_verified_account_types', JSON.stringify({ [enterpriseEmail]: 'ENTERPRISE' }));
      const enterpriseTenant = resolveTenantFromUser(enterpriseEmail);
      const isEnterpriseIsolated = enterpriseTenant.tenantType === 'enterprise';

      this.logResult(
        'Enterprise Role Isolation Gate',
        'ROLE_ISOLATION',
        isEnterpriseIsolated,
        isEnterpriseIsolated
          ? `Enterprise User resolved to tenantType="${enterpriseTenant.tenantType}". Scoped to organization/workspace hierarchy.`
          : `FAIL: Enterprise User erroneously assigned tenantType="${enterpriseTenant.tenantType}"`
      );

      // C. Test Superadmin Control Plane Domain-Gated Isolation
      const superadminEmail = 'root@zegaai.site';
      const superadminTenant = resolveTenantFromUser(superadminEmail);
      const isSuperadminIsolated = superadminTenant.tenantType === 'superadmin';

      this.logResult(
        'Superadmin Control Plane Isolation Gate',
        'ROLE_ISOLATION',
        isSuperadminIsolated,
        isSuperadminIsolated
          ? `Superadmin User resolved to tenantType="${superadminTenant.tenantType}". Access restricted to platform control plane.`
          : `FAIL: Superadmin domain user erroneously assigned tenantType="${superadminTenant.tenantType}"`
      );
    } catch (e: any) {
      this.logResult('Role Isolation Test', 'ROLE_ISOLATION', false, `Exception: ${e.message}`);
    }
  }

  /**
   * TEST 4: Atomic Identity Switch Isolation (Account A -> Account B)
   */
  public testIdentitySwitchIsolation(): void {
    console.log('\n--- Running TEST 4: Atomic Account Switch Isolation ---');
    try {
      const emailA = 'userA@gmail.com';
      const userIdA = '11111111-1111-1111-1111-111111111111';
      const storeIdA = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';

      // 1. Establish User A Session
      setStorageIdentityChecksum(emailA, userIdA);
      localStorage.setItem('zega_active_store_id', storeIdA);
      localStorage.setItem('zega_user_email', emailA);

      // 2. Perform Atomic Session Purge (simulating sign out / account switch trigger)
      purgeAllAuthSessionState();

      // 3. Establish User B Session
      const emailB = 'userB@gmail.com';
      const userIdB = '22222222-2222-2222-2222-222222222222';
      setStorageIdentityChecksum(emailB, userIdB);

      const storedStoreIdAfterSwitch = localStorage.getItem('zega_active_store_id');
      const storedUserEmail = localStorage.getItem('zega_user_email');
      const isCleanSwitch = !storedStoreIdAfterSwitch && storedUserEmail === emailB;

      this.logResult(
        'Account A -> Account B Identity Contamination Check',
        'IDENTITY_SWITCH',
        isCleanSwitch,
        isCleanSwitch
          ? 'Account B established zero-contamination session. Account A store ID was completely wiped.'
          : `CRITICAL IDENTITY REPRESSION BUG: Account B inherited Account A store ID (${storedStoreIdAfterSwitch})!`
      );
    } catch (e: any) {
      this.logResult('Identity Switch Isolation Test', 'IDENTITY_SWITCH', false, `Exception: ${e.message}`);
    }
  }

  /**
   * Run All Security Audits and summarize
   */
  public runFullAuditSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
    console.log('================================================================');
    console.log('🔒 STARTING ZEGA AI ZERO-TRUST AUTH SECURITY AUDIT SUITE');
    console.log('================================================================');

    this.testStorageAntiTampering();
    this.testZeroFallbackEnforcement();
    this.testRoleIsolation();
    this.testIdentitySwitchIsolation();

    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    console.log('\n================================================================');
    console.log(`📊 SECURITY AUDIT SUMMARY: ${passed}/${total} TESTS PASSED (${failed} FAILED)`);
    console.log('================================================================\n');

    return { total, passed, failed, results: this.results };
  }
}

// Export singleton test runner
export const securityAuditor = new ZeroTrustAuthSecurityAuditor();
