/**
 * Standalone Node.js Runner for Zero-Trust Auth Security Audit Suite
 * Mocks browser primitives (localStorage, document.cookie, location, window) in Node env
 * and executes securityAuditor.runFullAuditSuite().
 */

process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ikxiclpvywxxnkcaldbx.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreGljbHB2eXd4eG5rY2FsZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDA4NzcsImV4cCI6MjEwMDg3Njg3N30.vCQzR2ppnAxe7ugL6TTo1K5hqk6PdowjA59zDSf1dmo';

// 1. Mock Browser Environment Primitives in Node.js
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  key(i: number): string | null {
    const keys = Object.keys(this.store);
    return keys[i] || null;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

const mockLocalStorage = new LocalStorageMock();

(global as any).window = {
  location: { protocol: 'https:', hostname: 'localhost' },
  privyWallets: [],
  localStorage: mockLocalStorage,
};

(global as any).localStorage = mockLocalStorage;
(global as any).sessionStorage = mockLocalStorage;
(global as any).document = {
  cookie: '',
};

// 2. Import and Run Security Auditor
import { securityAuditor } from './src/test_zero_trust_auth_strength';

console.log('🚀 INITIALIZING STANDALONE ZERO-TRUST AUTH SECURITY AUDIT RUNNER...');
const results = securityAuditor.runFullAuditSuite();

if (results.failed === 0) {
  console.log('\n✨ ALL OWASP ZERO-TRUST SECURITY AUDITS PASSED WITH ZERO VULNERABILITIES!');
  process.exit(0);
} else {
  console.error(`\n🚨 DETECTED ${results.failed} SECURITY AUDIT FAILURES!`);
  process.exit(1);
}
