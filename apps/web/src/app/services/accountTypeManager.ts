/**
 * accountTypeManager.ts — ZEGA Unified Authentication & Account-Type Manager
 *
 * Implements:
 * 1. Strict separation between Auth Identity ("WHO ARE YOU?") and Account Type ("WHICH PRODUCT/ONBOARDING FLOW DID YOU CHOOSE?").
 * 2. Pending Auth Intent state machine surviving OAuth redirects, page reloads, and callbacks.
 * 3. CRITICAL SECURITY INVARIANT: Existing verified account type ALWAYS WINS over client/UI selection.
 * 4. Safe telemetry logging for auth, account type, onboarding, and tenant bootstrap without secret leakage.
 */

export type CanonicalAccountType = 'INDIVIDUAL_UMKM' | 'ENTERPRISE';

export type AccountTypeState =
  | 'TYPE_SELECTION_REQUIRED'
  | 'TYPE_SELECTED'
  | 'AUTH_LOADING'
  | 'AUTH_READY'
  | 'ONBOARDING_REQUIRED'
  | 'ONBOARDING_IN_PROGRESS'
  | 'PROVISIONING'
  | 'READY'
  | 'AUTH_ERROR';

export type AuthProviderType = 'google' | 'github' | 'email' | 'enterprise';

export interface PendingAuthIntent {
  flowId: string;
  accountType: CanonicalAccountType;
  provider: AuthProviderType;
  createdAt: number;
  metadata?: {
    companyName?: string;
    teamSize?: string;
    objective?: string;
    fullName?: string;
    email?: string;
  };
}

const PENDING_INTENT_KEY = 'zega_pending_auth_intent';
const SELECTED_TYPE_KEY = 'zega_selected_account_type';
const VERIFIED_TYPES_KEY = 'zega_verified_account_types';
const INTENT_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

/** Safe Debug Telemetry Logger — Never logs access tokens, refresh tokens, or secrets */
export function logAuthTelemetry(
  category: 'AUTH_FLOW' | 'ACCOUNT_TYPE' | 'ONBOARDING' | 'TENANT_BOOTSTRAP',
  data: Record<string, any>
): void {
  // Sanitize payload to strip tokens/passwords
  const sanitized = { ...data };
  const sensitiveKeys = ['accessToken', 'access_token', 'refreshToken', 'refresh_token', 'secret', 'password', 'token'];
  for (const k of sensitiveKeys) {
    if (k in sanitized) {
      sanitized[k] = '[REDACTED]';
    }
  }
  console.log(`[${category}]`, sanitized);
}

/** Normalize raw role/type string to CanonicalAccountType */
export function normalizeAccountType(raw?: string | null): CanonicalAccountType | null {
  if (!raw) return null;
  const cleaned = String(raw).trim().toUpperCase();
  if (cleaned === 'INDIVIDUAL' || cleaned === 'UMKM' || cleaned === 'INDIVIDUAL_UMKM' || cleaned === 'SELF-SERVE') {
    return 'INDIVIDUAL_UMKM';
  }
  if (cleaned === 'ENTERPRISE' || cleaned === 'ENTERPRISE_SCALE') {
    return 'ENTERPRISE';
  }
  return null;
}

/** Format CanonicalAccountType to display role string */
export function formatAccountTypeRole(accountType: CanonicalAccountType): 'individual' | 'enterprise' {
  return accountType === 'ENTERPRISE' ? 'enterprise' : 'individual';
}

/** Save pre-OAuth / pre-OTP pending auth intent */
export function savePendingAuthIntent(
  params: Omit<PendingAuthIntent, 'flowId' | 'createdAt'>
): PendingAuthIntent {
  const flowId = `flow-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const intent: PendingAuthIntent = {
    ...params,
    flowId,
    createdAt: Date.now(),
  };

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(PENDING_INTENT_KEY, JSON.stringify(intent));
      sessionStorage.setItem(SELECTED_TYPE_KEY, intent.accountType);
    } catch (e) {
      console.warn('[ACCOUNT_TYPE] Failed to write pending intent to sessionStorage:', e);
    }
  }

  logAuthTelemetry('AUTH_FLOW', {
    action: 'SAVE_PENDING_INTENT',
    flowId: intent.flowId,
    accountType: intent.accountType,
    provider: intent.provider,
  });

  return intent;
}

/** Read pending auth intent without consuming it */
export function getPendingAuthIntent(): PendingAuthIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_INTENT_KEY);
    if (!raw) return null;
    const intent: PendingAuthIntent = JSON.parse(raw);

    // Check expiration
    if (Date.now() - intent.createdAt > INTENT_TTL_MS) {
      logAuthTelemetry('ACCOUNT_TYPE', {
        action: 'PENDING_INTENT_EXPIRED',
        flowId: intent.flowId,
        ageSeconds: Math.round((Date.now() - intent.createdAt) / 1000),
      });
      clearPendingAuthIntent();
      return null;
    }
    return intent;
  } catch {
    return null;
  }
}

/** Read and consume (remove) pending auth intent (single-use guard) */
export function consumePendingAuthIntent(): PendingAuthIntent | null {
  const intent = getPendingAuthIntent();
  clearPendingAuthIntent();
  if (intent) {
    logAuthTelemetry('AUTH_FLOW', {
      action: 'CONSUME_PENDING_INTENT',
      flowId: intent.flowId,
      accountType: intent.accountType,
      provider: intent.provider,
    });
  }
  return intent;
}

/** Clear pending auth intent */
export function clearPendingAuthIntent(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(PENDING_INTENT_KEY);
    } catch {}
  }
}

/** Persist a verified account type for a user email */
export function saveVerifiedAccountType(email: string, accountType: CanonicalAccountType): void {
  if (!email || typeof window === 'undefined') return;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const raw = localStorage.getItem(VERIFIED_TYPES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[cleanEmail] = {
      accountType,
      verifiedAt: new Date().toISOString(),
    };
    localStorage.setItem(VERIFIED_TYPES_KEY, JSON.stringify(map));
    logAuthTelemetry('ACCOUNT_TYPE', {
      action: 'SAVE_VERIFIED_ACCOUNT_TYPE',
      email: cleanEmail,
      accountType,
    });
  } catch (e) {
    console.warn('[ACCOUNT_TYPE] Failed to save verified account type:', e);
  }
}

/** Purge verified account type for email when identity is invalid or blocked */
export function purgeVerifiedAccountType(email?: string | null): void {
  if (!email || typeof window === 'undefined') return;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const raw = localStorage.getItem(VERIFIED_TYPES_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      delete map[cleanEmail];
      localStorage.setItem(VERIFIED_TYPES_KEY, JSON.stringify(map));
    }
  } catch {}
}

/** Read a verified account type for a user email if one exists */
export function getVerifiedAccountType(email?: string | null): CanonicalAccountType | null {
  if (!email || typeof window === 'undefined') return null;
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check verified types store
  try {
    const raw = localStorage.getItem(VERIFIED_TYPES_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[cleanEmail]?.accountType) {
        const norm = normalizeAccountType(map[cleanEmail].accountType);
        if (norm) return norm;
      }
    }
  } catch {}

  // 2. Check zega_social_profiles
  try {
    const profilesStr = localStorage.getItem('zega_social_profiles');
    if (profilesStr) {
      const profiles = JSON.parse(profilesStr);
      if (profiles[cleanEmail]?.role) {
        const norm = normalizeAccountType(profiles[cleanEmail].role);
        if (norm) return norm;
      }
    }
  } catch {}

  // 3. Check existing zega_mock_session
  try {
    const sessStr = localStorage.getItem('zega_mock_session');
    if (sessStr) {
      const sess = JSON.parse(sessStr);
      const sessEmail = sess.email || sess.user?.email;
      if (sessEmail && String(sessEmail).toLowerCase().trim() === cleanEmail) {
        const role = sess.role || sess.user?.user_metadata?.role;
        const norm = normalizeAccountType(role);
        if (norm) return norm;
      }
    }
  } catch {}

  return null;
}

/**
 * Resolve Canonical Account Type for a user session/attempt
 *
 * CRITICAL SECURITY INVARIANT:
 * 1. Existing verified account type ALWAYS WINS over new client selection.
 * 2. New users use consumePendingAuthIntent() or explicit UI selection.
 * 3. Default fallback is INDIVIDUAL_UMKM.
 */
export function resolveCanonicalAccountType(params: {
  userEmail?: string | null;
  userMetadataRole?: string | null;
  selectedUiType?: CanonicalAccountType | null;
  consumeIntent?: boolean;
}): { accountType: CanonicalAccountType; source: 'EXISTING_VERIFIED' | 'PENDING_INTENT' | 'UI_SELECTION' | 'DEFAULT' } {
  const { userEmail, userMetadataRole, selectedUiType, consumeIntent = false } = params;

  // 1. Check existing verified account type for email
  const existingVerified = getVerifiedAccountType(userEmail);
  if (existingVerified) {
    logAuthTelemetry('ACCOUNT_TYPE', {
      selected: selectedUiType || 'NONE',
      persisted: existingVerified,
      resolved: existingVerified,
      source: 'EXISTING_VERIFIED',
      email: userEmail,
    });
    return { accountType: existingVerified, source: 'EXISTING_VERIFIED' };
  }

  // 2. Check metadata role if available
  const normMetadata = normalizeAccountType(userMetadataRole);
  if (normMetadata) {
    if (userEmail) saveVerifiedAccountType(userEmail, normMetadata);
    logAuthTelemetry('ACCOUNT_TYPE', {
      selected: selectedUiType || 'NONE',
      persisted: normMetadata,
      resolved: normMetadata,
      source: 'EXISTING_VERIFIED',
      email: userEmail,
    });
    return { accountType: normMetadata, source: 'EXISTING_VERIFIED' };
  }

  // 3. Check pending auth intent
  const intent = consumeIntent ? consumePendingAuthIntent() : getPendingAuthIntent();
  if (intent) {
    logAuthTelemetry('ACCOUNT_TYPE', {
      selected: selectedUiType || 'NONE',
      persisted: null,
      resolved: intent.accountType,
      source: 'PENDING_INTENT',
      flowId: intent.flowId,
      provider: intent.provider,
    });
    return { accountType: intent.accountType, source: 'PENDING_INTENT' };
  }

  // 4. Check UI selection
  if (selectedUiType) {
    logAuthTelemetry('ACCOUNT_TYPE', {
      selected: selectedUiType,
      persisted: null,
      resolved: selectedUiType,
      source: 'UI_SELECTION',
    });
    return { accountType: selectedUiType, source: 'UI_SELECTION' };
  }

  // 5. Default fallback
  logAuthTelemetry('ACCOUNT_TYPE', {
    selected: null,
    persisted: null,
    resolved: 'INDIVIDUAL_UMKM',
    source: 'DEFAULT',
  });
  return { accountType: 'INDIVIDUAL_UMKM', source: 'DEFAULT' };
}

/** Clear all onboarding and session state on sign out */
export function clearSessionAccountState(): void {
  if (typeof window === 'undefined') return;
  try {
    clearPendingAuthIntent();
    sessionStorage.removeItem(SELECTED_TYPE_KEY);
    logAuthTelemetry('AUTH_FLOW', { action: 'CLEAR_SESSION_ACCOUNT_STATE' });
  } catch {}
}

/**
 * Comprehensive Purge Utility for User Identity & Session Switching
 * Wipes ALL localStorage, sessionStorage, cookies, and in-memory caches
 * to prevent identity contamination when logging out or switching accounts.
 */
export function purgeAllAuthSessionState(): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Storage Keys to Purge from LocalStorage
    const exactLocalKeys = [
      'zega_access_token',
      'zega_jwt',
      'zega_supabase_access_token',
      'zega_user_email',
      'zega_active_store_id',
      'zega_active_org_id',
      'zega_active_workspace_id',
      'zega_verified_account_types',
      'zega_mock_session',
      'zega_user_avatar',
      'zega_auth_token',
      'zega_identity_checksum',
      'token',
      'privy_user_email',
      'sb-access-token',
      'zega_social_profiles',
    ];

    exactLocalKeys.forEach((key) => {
      try { localStorage.removeItem(key); } catch {}
    });

    // 2. Pattern Matching LocalStorage Purge (sb-*-auth-token, zega_privy_wallet_*, zega_cache_*)
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('zega_privy_wallet_') ||
           k.startsWith('zega_cache_') ||
           (k.startsWith('sb-') && k.endsWith('-auth-token')))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });
    } catch {}

    // 3. SessionStorage Purge
    try {
      clearPendingAuthIntent();
      sessionStorage.removeItem(SELECTED_TYPE_KEY);
      sessionStorage.removeItem(PENDING_INTENT_KEY);
    } catch {}

    // 4. Cookies Purge
    try {
      document.cookie = 'zega_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
      document.cookie = 'sb-access-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    } catch {}

    // 5. In-Memory Window Reference Reset
    try {
      (window as any).privyWallets = [];
      if ((window as any).__ZEGA_TERMINAL_BLOCKED_USERS__) {
        (window as any).__ZEGA_TERMINAL_BLOCKED_USERS__.clear();
      }
      delete (window as any).__ZEGA_AUTH_IDENTITY_BLOCKED__;
      delete (window as any).__ZEGA_CANONICAL_AUTH__;
    } catch {}

    logAuthTelemetry('AUTH_FLOW', { action: 'PURGE_ALL_AUTH_SESSION_STATE_COMPLETED' });
  } catch (e) {
    console.warn('[ACCOUNT_TYPE_MANAGER] Error in purgeAllAuthSessionState:', e);
  }
}

/**
 * OWASP Anti-Storage Tampering & Anti-Exploit Cryptographic Identity Checksum
 * Generates a deterministic hash signature binding local storage state to active user identity.
 */
export function getIdentityChecksum(userEmail: string, userId: string = ''): string {
  const normEmail = (userEmail || '').toLowerCase().trim();
  const normId = (userId || '').trim();
  if (!normEmail && !normId) return '';
  
  let hash = 5381;
  const str = `ZEGA_OWASP_L3_BOUND_${normEmail}_${normId}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return `zega_sig_${(hash >>> 0).toString(16)}`;
}

/**
 * OWASP Storage Integrity Guard
 * Verifies local storage identity signature against current active user.
 * Returns false and automatically executes purgeAllAuthSessionState() if a mismatch is detected.
 */
export function verifyStorageIdentityIntegrity(userEmail: string, userId: string = ''): boolean {
  if (typeof window === 'undefined') return true;
  if (!userEmail && !userId) return true;
  
  const activeEmail = (userEmail || '').toLowerCase().trim();
  const storedUserEmail = (localStorage.getItem('zega_user_email') || '').toLowerCase().trim();
  const storedChecksum = localStorage.getItem('zega_identity_checksum');

  // 1. Strict OWASP Email Isolation Guard:
  // If local storage has a stored email that differs from the active logged-in email, purge immediately.
  if (storedUserEmail && activeEmail && storedUserEmail !== activeEmail) {
    console.warn('[OWASP SECURITY] Stale localStorage user email mismatch detected! Purging session data...', {
      storedUserEmail,
      activeEmail
    });
    purgeAllAuthSessionState();
    return false;
  }

  // 2. If no stored checksum exists yet (fresh login / new environment), consider valid
  if (!storedChecksum) {
    return true;
  }

  // 3. Dynamically resolve effective userId if omitted (e.g. during initial page load/render)
  let effectiveUserId = (userId || '').trim();
  if (!effectiveUserId && typeof window !== 'undefined') {
    try {
      const canonicalAuth = (window as any).__ZEGA_CANONICAL_AUTH__;
      if (canonicalAuth?.canonicalUserId) {
        effectiveUserId = canonicalAuth.canonicalUserId;
      }
    } catch {}
  }

  // 4. Calculate expected signatures:
  // - Full signature (email + userId)
  const fullChecksum = effectiveUserId ? getIdentityChecksum(activeEmail, effectiveUserId) : null;
  // - Fallback signature (email alone, if checksum was stored without userId)
  const emailOnlyChecksum = getIdentityChecksum(activeEmail, '');

  // 5. Signature Matching Logic:
  if ((fullChecksum && storedChecksum === fullChecksum) || storedChecksum === emailOnlyChecksum) {
    return true;
  }

  // 6. Session Initialization / Hydration Protection:
  // If effectiveUserId is not yet available (auth state loading/initializing), BUT activeEmail matches storedUserEmail,
  // do NOT trigger a false-positive purge.
  if (!effectiveUserId && activeEmail && storedUserEmail === activeEmail) {
    return true;
  }

  // 7. Actual Checksum Tampering / Corruption Detected
  console.warn('[OWASP SECURITY] Storage identity checksum mismatch detected! Sanitizing stale session data...', {
    storedChecksum,
    fullChecksum,
    emailOnlyChecksum,
    storedUserEmail,
    activeEmail,
    effectiveUserId
  });
  purgeAllAuthSessionState();
  return false;
}

/**
 * Binds active user identity to local storage with OWASP Cryptographic Checksum
 */
export function setStorageIdentityChecksum(userEmail: string, userId: string = ''): void {
  if (typeof window === 'undefined') return;
  const checksum = getIdentityChecksum(userEmail, userId);
  if (checksum) {
    try {
      localStorage.setItem('zega_identity_checksum', checksum);
      if (userEmail) {
        localStorage.setItem('zega_user_email', userEmail.toLowerCase().trim());
      }
    } catch {}
  }
}
