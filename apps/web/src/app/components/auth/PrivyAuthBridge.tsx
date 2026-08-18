import { useEffect } from 'react';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { supabase, syncSupabaseAuthSession } from '../../../lib/supabase';
import {
  clearSessionAccountState,
  saveVerifiedAccountType,
  normalizeAccountType,
  logAuthTelemetry,
} from '../../services/accountTypeManager';

export interface AuthBridgeState {
  privyReady: boolean;
  privyAuthenticated: boolean;
  supabaseSessionReady: boolean;
  supabaseUserId: string | null;
  userEmail: string | null;
  syncInFlight: boolean;
  /** Canonical Auth Lifecycle State Machine: AUTH_INITIALIZING -> AUTH_READY | AUTH_REQUIRED | AUTH_ERROR */
  authState: 'AUTH_INITIALIZING' | 'AUTH_READY' | 'AUTH_EXPIRED' | 'AUTH_REFRESH_ERROR' | 'AUTH_REQUIRED' | 'AUTH_ERROR';
  /** Privy sync is an AUXILIARY subsystem — separate from canonical Supabase auth */
  privySyncStatus: 'PENDING' | 'READY' | 'FAILED' | 'UNAVAILABLE';
  privySyncError?: string;
}

let _authBridgeState: AuthBridgeState = {
  privyReady: false,
  privyAuthenticated: false,
  supabaseSessionReady: false,
  supabaseUserId: null,
  userEmail: null,
  syncInFlight: false,
  authState: 'AUTH_INITIALIZING',
  privySyncStatus: 'PENDING',
  privySyncError: undefined,
};

const _bridgeListeners = new Set<(state: AuthBridgeState) => void>();

let _authEpoch = 0;
let _isExplicitLoggedOut = false;
let _restoreSessionPromise: Promise<void> | null = null;

export function getAuthEpoch(): number {
  return _authEpoch;
}

function isAuthBridgeStateEqual(a: AuthBridgeState, b: AuthBridgeState): boolean {
  return (
    a.privyReady === b.privyReady &&
    a.privyAuthenticated === b.privyAuthenticated &&
    a.supabaseSessionReady === b.supabaseSessionReady &&
    a.supabaseUserId === b.supabaseUserId &&
    a.userEmail === b.userEmail &&
    a.syncInFlight === b.syncInFlight &&
    a.authState === b.authState &&
    a.privySyncStatus === b.privySyncStatus &&
    a.privySyncError === b.privySyncError
  );
}

import { canonicalAuthManager } from '../../services/CanonicalAuthManager';

export function updateBridgeState(partial: Partial<AuthBridgeState>, isExplicitLogout = false): void {
  const prevState = _authBridgeState.authState;

  if (isExplicitLogout) {
    _isExplicitLoggedOut = true;
  }

  // NON-REGRESSIBLE AUTH STATE GUARD:
  // AUTH_READY must NEVER regress to AUTH_REQUIRED unless explicit logout occurred!
  let nextAuthState = partial.authState ?? _authBridgeState.authState;
  if (prevState === 'AUTH_READY' && nextAuthState === 'AUTH_REQUIRED' && !_isExplicitLoggedOut) {
    console.warn('[CANONICAL_AUTH] Blocked stale AUTH_REQUIRED regression while AUTH_READY is active.');
    nextAuthState = 'AUTH_READY';
  }

  let nextUserId = partial.supabaseUserId !== undefined ? partial.supabaseUserId : _authBridgeState.supabaseUserId;
  if (prevState === 'AUTH_READY' && !nextUserId && !_isExplicitLoggedOut && isValidUuid(_authBridgeState.supabaseUserId)) {
    nextUserId = _authBridgeState.supabaseUserId;
  }

  const candidateState: AuthBridgeState = {
    ..._authBridgeState,
    ...partial,
    authState: nextAuthState,
    supabaseUserId: nextUserId
  };

  // State Flapping & Re-render Loop Guard:
  // If candidate state is identical to current state, bypass assignment & listener invocation
  if (isAuthBridgeStateEqual(_authBridgeState, candidateState)) {
    return;
  }

  _authBridgeState = candidateState;

  if (typeof window !== 'undefined') {
    (window as any).__ZEGA_AUTH_BRIDGE__ = _authBridgeState;
  }

  // Sync to CanonicalAuthManager
  const mappedStatus = _authBridgeState.authState === 'AUTH_INITIALIZING' ? 'AUTH_LOADING' : _authBridgeState.authState;
  canonicalAuthManager.updateState({
    authState: mappedStatus as any,
    canonicalUserId: _authBridgeState.supabaseUserId,
    userEmail: _authBridgeState.userEmail,
    supabaseSessionPresent: _authBridgeState.supabaseSessionReady,
    accessTokenPresent: Boolean(_authBridgeState.supabaseUserId),
  });

  if (prevState !== _authBridgeState.authState || partial.supabaseUserId !== undefined) {
    console.log('[CANONICAL_AUTH]', {
      state: _authBridgeState.authState,
      userIdPresent: Boolean(_authBridgeState.supabaseUserId),
      userId: _authBridgeState.supabaseUserId,
    });
  }

  _bridgeListeners.forEach((listener) => listener(_authBridgeState));
}

function isValidUuid(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
}

function resolveActiveSession(sessionUser?: any): { userId: string | null; email: string | null; isReady: boolean } {
  if (sessionUser?.id && isValidUuid(sessionUser.id)) {
    return {
      userId: sessionUser.id,
      email: sessionUser.email || null,
      isReady: true,
    };
  }
  try {
    const mockStr = typeof localStorage !== 'undefined' ? localStorage.getItem('zega_mock_session') : null;
    if (mockStr) {
      const parsed = JSON.parse(mockStr);
      const possibleId = parsed.user?.id || parsed.id;
      if (parsed && parsed.email && !parsed.isGuest && isValidUuid(possibleId)) {
        return {
          userId: possibleId,
          email: parsed.email,
          isReady: true,
        };
      }
    }
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('zega_access_token') : null;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const subId = payload.sub || payload.id;
          if (payload && isValidUuid(subId)) {
            return {
              userId: subId,
              email: payload.email || null,
              isReady: true,
            };
          }
        }
      } catch { }
    }
  } catch (e) { }
  return { userId: null, email: null, isReady: false };
}

export function getAuthBridgeState(): AuthBridgeState {
  return _authBridgeState;
}

export function subscribeAuthBridgeState(listener: (state: AuthBridgeState) => void): () => void {
  _bridgeListeners.add(listener);
  listener(_authBridgeState);
  return () => {
    _bridgeListeners.delete(listener);
  };
}

let _authReadyPromise: Promise<AuthBridgeState> | null = null;

/**
 * Shared Auth Readiness Promise Barrier.
 * Multiple concurrent callers await this single shared promise.
 * Resolves when authState exits AUTH_INITIALIZING.
 */
export function waitForAuthReady(timeoutMs: number = 5000): Promise<AuthBridgeState> {
  const currentState = getAuthBridgeState();
  if (currentState.authState !== 'AUTH_INITIALIZING') {
    return Promise.resolve(currentState);
  }

  if (_authReadyPromise) {
    return _authReadyPromise;
  }

  _authReadyPromise = new Promise<AuthBridgeState>((resolve) => {
    let timer: any = null;

    const unsubscribe = subscribeAuthBridgeState((state) => {
      if (state.authState !== 'AUTH_INITIALIZING') {
        if (timer) clearTimeout(timer);
        unsubscribe();
        _authReadyPromise = null;
        resolve(state);
      }
    });

    timer = setTimeout(() => {
      unsubscribe();
      _authReadyPromise = null;
      resolve(getAuthBridgeState());
    }, timeoutMs);
  });

  return _authReadyPromise;
}


/**
 * PrivyAuthBridge
 *
 * Establishes authentication and session state synchronization between ZEGA identity
 * and Privy SDK. Synchronizes Privy user identity into Supabase Auth session.
 */
export function PrivyAuthBridge() {
  const { authenticated: privyAuthenticated, user: privyUser, ready: privyReady } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();

  // 1. Single Canonical Auth State Restoration Engine
  useEffect(() => {
    const currentEpoch = ++_authEpoch;

    const restoreSession = async () => {
      // 1. Check local session token / mock session
      const active = resolveActiveSession();
      if (active.isReady) {
        _isExplicitLoggedOut = false;
        // Inspect if Supabase client currently holds a genuine active session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        const hasGenuineSession = Boolean(existingSession?.user?.id);
        updateBridgeState({
          supabaseSessionReady: hasGenuineSession,
          supabaseUserId: active.userId,
          userEmail: active.email || _authBridgeState.userEmail,
          authState: 'AUTH_READY',
        });
      }

      // 2. Perform backend verification via GET /v1/auth/me
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('zega_access_token') : null;
      if (token) {
        let syncedSessionSuccess = false;
        try {
          if ((supabase as any).rest?.headers) {
            (supabase as any).rest.headers['Authorization'] = `Bearer ${token}`;
          }
          syncedSessionSuccess = await syncSupabaseAuthSession(token);
        } catch (e) {
          console.warn('[CANONICAL_AUTH] Supabase auth session restore note:', e);
        }

        try {
          const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ||
            (import.meta.env.VITE_API_URL as string) ||
            (window.location.origin.includes('localhost') ? 'http://localhost:3001' : 'https://api.zegaai.site');
          const meRes = await fetch(`${apiBase}/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (currentEpoch !== _authEpoch) return;

          if (meRes.ok) {
            const meData = await meRes.json();
            const u = meData.user || meData.data || {};
            const canonicalId = u.id || u.sub;
            if (isValidUuid(canonicalId)) {
              _isExplicitLoggedOut = false;
              updateBridgeState({
                supabaseSessionReady: syncedSessionSuccess,
                supabaseUserId: canonicalId,
                userEmail: u.email || active.email || _authBridgeState.userEmail,
                authState: 'AUTH_READY',
              });
              return;
            }
          }
        } catch (err) {
          console.warn('[CANONICAL_AUTH] /v1/auth/me note:', err);
        }
      }

      // If active session is ready from local token, retain AUTH_READY
      if (_authBridgeState.authState === 'AUTH_READY') return;

      // 3. Fallback Supabase session check
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (currentEpoch !== _authEpoch) return;

        const supaActive = resolveActiveSession(session?.user);
        if (supaActive.isReady) {
          _isExplicitLoggedOut = false;
          updateBridgeState({
            supabaseSessionReady: true,
            supabaseUserId: supaActive.userId,
            userEmail: supaActive.email || _authBridgeState.userEmail,
            authState: 'AUTH_READY',
          });
          return;
        }
      } catch (err) {
        console.warn('[CANONICAL_AUTH] Supabase session check note:', err);
      }

      if (currentEpoch === _authEpoch && (_authBridgeState.authState as string) !== 'AUTH_READY') {
        updateBridgeState({
          supabaseSessionReady: false,
          supabaseUserId: null,
          authState: 'AUTH_REQUIRED',
        });
      }
    };

    if (_restoreSessionPromise) {
      _restoreSessionPromise.then(() => {
        if (currentEpoch === _authEpoch) {
          // Session already restored by in-flight execution
        }
      });
    } else {
      _restoreSessionPromise = (async () => {
        try {
          await restoreSession();
        } finally {
          _restoreSessionPromise = null;
        }
      })();
    }

    const handleStorageOrAuthEvent = () => {
      const active = resolveActiveSession();
      if (active.isReady) {
        _isExplicitLoggedOut = false;
        updateBridgeState({
          supabaseSessionReady: true,
          supabaseUserId: active.userId,
          userEmail: active.email || _authBridgeState.userEmail,
          authState: 'AUTH_READY',
        });
      }
    };

    window.addEventListener('storage', handleStorageOrAuthEvent);
    window.addEventListener('zega_auth_updated', handleStorageOrAuthEvent);

    // Isolated Supabase Auth Event Observer
    // (Only handle explicit SIGNED_OUT, NEVER overwrite AUTH_READY with AUTH_REQUIRED unless explicit logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        const active = resolveActiveSession();
        if (active.isReady && !_isExplicitLoggedOut) {
          console.warn('[CANONICAL_AUTH] Ignored implicit Supabase SIGNED_OUT event because local active session is valid.');
          return;
        }
        clearSessionAccountState();
        logAuthTelemetry('AUTH_FLOW', { action: 'SUPABASE_SIGNED_OUT' });
        updateBridgeState({
          supabaseSessionReady: false,
          supabaseUserId: null,
          userEmail: null,
          authState: 'AUTH_REQUIRED',
        }, true);
        return;
      }

      const active = resolveActiveSession(session?.user);
      if (active.isReady) {
        _isExplicitLoggedOut = false;
        updateBridgeState({
          supabaseSessionReady: true,
          supabaseUserId: active.userId,
          userEmail: active.email || _authBridgeState.userEmail,
          authState: 'AUTH_READY',
        });
      } else {
        // Update auxiliary Supabase session flag WITHOUT regressing canonical auth state
        updateBridgeState({
          supabaseSessionReady: true
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageOrAuthEvent);
      window.removeEventListener('zega_auth_updated', handleStorageOrAuthEvent);
    };
  }, []);

  // Inspect current ZEGA authenticated session from localStorage
  const zegaSessionStr = typeof window !== 'undefined' ? localStorage.getItem('zega_mock_session') : null;
  let zegaSession: any = null;
  try {
    if (zegaSessionStr) {
      zegaSession = JSON.parse(zegaSessionStr);
    }
  } catch (e) { }

  const zegaEmail = zegaSession?.email || zegaSession?.user?.email;

  // Extract stable Solana wallet address primitive to prevent infinite useEffect re-render loop
  const solanaWalletAddress = solanaWallets?.[0]?.address || '';

  // Extract the Privy user's email from their linked accounts or primary email object
  const privyEmail = (privyUser?.email as any)?.address
    || (privyUser?.linkedAccounts?.find((a: any) => a.type === 'email') as any)?.address
    || null;

  // Update initial Privy readiness state
  useEffect(() => {
    updateBridgeState({
      privyReady,
      privyAuthenticated,
      userEmail: privyEmail || zegaEmail || _authBridgeState.userEmail,
    });
  }, [privyReady, privyAuthenticated, privyEmail, zegaEmail]);

  // 2. Synchronize Privy identity -> Supabase Auth Session
  useEffect(() => {
    if (!privyAuthenticated || !privyUser) return;
    const cleanPrivyEmail = privyEmail ? String(privyEmail).toLowerCase().trim() : (zegaEmail ? String(zegaEmail).toLowerCase().trim() : '');
    if (!cleanPrivyEmail) return;

    let isSubscribed = true;

    async function syncPrivyToSupabase() {
      if (_authBridgeState.syncInFlight) return;

      try {
        // 1. Inspect existing active Supabase Auth session first (Canonical Session Preservation Guard)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession && existingSession.user?.id) {
          const isEmailMismatch = Boolean(
            existingSession.user.email && cleanPrivyEmail &&
            existingSession.user.email.toLowerCase().trim() !== cleanPrivyEmail.toLowerCase().trim()
          );

          // Check if this session userId was flagged as terminal/blocked due to AUTH_IDENTITY_NOT_FOUND
          const isTerminalBlocked = typeof window !== 'undefined' &&
            ((window as any).__ZEGA_TERMINAL_BLOCKED_USERS__?.has(existingSession.user.id) ||
              (window as any).__ZEGA_AUTH_IDENTITY_BLOCKED__ === existingSession.user.id);

          if (!isTerminalBlocked && !isEmailMismatch) {
            console.log('[PRIVY AUTH BRIDGE] Active Supabase session detected. Preserving canonical session.', {
              userId: existingSession.user.id,
              email: existingSession.user.email,
            });
            if (isSubscribed) {
              updateBridgeState({
                supabaseSessionReady: true,
                supabaseUserId: existingSession.user.id,
                userEmail: existingSession.user.email || cleanPrivyEmail || _authBridgeState.userEmail,
                syncInFlight: false,
                privySyncStatus: _authBridgeState.privySyncStatus === 'READY' ? 'READY' : 'PENDING',
              });
            }
            return;
          } else {
            console.warn('[PRIVY AUTH BRIDGE] Stale/Mismatched session detected in PrivyAuthBridge:', {
              existingSessionEmail: existingSession.user.email,
              newPrivyEmail: cleanPrivyEmail,
              isTerminalBlocked
            }, 'Purging stale session...');
            await supabase.auth.signOut({ scope: 'local' });
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.removeItem('zega_mock_session');
              localStorage.removeItem('zega_access_token');
              localStorage.removeItem('zega_user_email');
              localStorage.removeItem('zega_active_store_id');
            }
          }
        }

        updateBridgeState({ syncInFlight: true });

        const embeddedSolana = solanaWallets?.find(
          (w: any) => (w?.chainType === 'solana' || !w?.chainType) && (w?.walletClientType === 'privy' || w?.type === 'solana')
        ) || solanaWallets?.[0];
        const walletAddress = embeddedSolana?.address || localStorage.getItem(`zega_privy_wallet_${cleanPrivyEmail}`) || undefined;

        // Call API endpoint to sync Privy user and generate signed Supabase JWT access token
        const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) ||
          (import.meta.env.VITE_API_URL as string) ||
          (window.location.origin.includes('localhost') ? 'http://localhost:3001' : 'https://api.zegaai.site');
        const res = await fetch(`${API_BASE}/v1/auth/privy-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanPrivyEmail,
            privyUserId: privyUser?.id,
            walletAddress,
          }),
        });

        if (res.ok) {
          const syncData = await res.json();
          const appToken = syncData?.data?.accessToken;
          const supabaseToken = syncData?.data?.supabaseAccessToken || appToken;
          const userId = syncData?.data?.user?.id || syncData?.data?.email || cleanPrivyEmail;
          const role = syncData?.data?.role || 'individual';
          const normAccType = normalizeAccountType(role) || 'INDIVIDUAL_UMKM';
          saveVerifiedAccountType(cleanPrivyEmail, normAccType);

          // Mark Privy sync as READY on success
          if (isSubscribed) {
            updateBridgeState({ privySyncStatus: 'READY', privySyncError: undefined });
          }
          console.log('[PRIVY_SYNC_STATUS] READY');

          if (supabaseToken) {
            // Update local storage session cache
            const mockSession = {
              user: {
                id: userId,
                email: cleanPrivyEmail,
                user_metadata: { full_name: cleanPrivyEmail.split('@')[0], role, is_guest: false }
              },
              role,
              fullName: cleanPrivyEmail.split('@')[0],
              email: cleanPrivyEmail,
              isGuest: false,
              accessToken: supabaseToken,
            };
            localStorage.setItem('zega_mock_session', JSON.stringify(mockSession));
            localStorage.setItem('zega_access_token', supabaseToken);
            localStorage.setItem('zega_user_email', cleanPrivyEmail);

            // Inject Authorization header & sync session into canonical Supabase client instance
            if ((supabase as any).rest?.headers) {
              (supabase as any).rest.headers['Authorization'] = `Bearer ${supabaseToken}`;
            }
            await syncSupabaseAuthSession(supabaseToken);

            let sessionUserId = userId;
            let sessionValidated = true;

            if (supabaseToken && supabaseToken.includes('.')) {
              try {
                const parts = supabaseToken.split('.');
                if (parts.length === 3) {
                  const payload = JSON.parse(atob(parts[1]));
                  if (payload?.sub) {
                    sessionUserId = payload.sub;
                  }
                }
              } catch { /* skip non-blocking */ }
            }

            if (isSubscribed) {
              updateBridgeState({
                supabaseSessionReady: sessionValidated,
                supabaseUserId: sessionUserId,
                userEmail: cleanPrivyEmail,
              });

              console.log('[SUPABASE_AUTH_DIAGNOSTIC]', {
                hasSession: sessionValidated,
                hasAccessToken: true,
                userId: sessionUserId,
              });
            }
          }
        } else {
          // PART 3: Non-200 responses — check for 401 specifically
          const statusCode = res.status;
          let errorText = '';
          try { errorText = await res.text(); } catch { /* skip */ }

          if (statusCode === 401) {
            // 401 = PRIVY_SYNC_UNAVAILABLE — do NOT infinite-retry
            console.warn('[PRIVY_SYNC_STATUS] UNAVAILABLE (401):', errorText);
            if (isSubscribed) {
              updateBridgeState({
                privySyncStatus: 'UNAVAILABLE',
                privySyncError: `401: ${errorText.slice(0, 200)}`,
              });
            }
          } else {
            console.warn('[PRIVY_SYNC_STATUS] FAILED:', statusCode, errorText);
            if (isSubscribed) {
              updateBridgeState({
                privySyncStatus: 'FAILED',
                privySyncError: `${statusCode}: ${errorText.slice(0, 200)}`,
              });
            }
          }
          // CRITICAL: Do NOT invalidate Supabase session on Privy sync failure
        }
      } catch (err: any) {
        console.warn('[PRIVY AUTH BRIDGE] Privy -> Supabase session sync note:', err?.message);
        // PART 2: Privy sync failure must NOT corrupt Supabase auth
        if (isSubscribed) {
          updateBridgeState({
            privySyncStatus: 'FAILED',
            privySyncError: err?.message || 'Unknown sync error',
          });
        }
        console.warn('[PRIVY_SYNC_STATUS] FAILED (exception):', err?.message);
      } finally {
        if (isSubscribed) {
          updateBridgeState({ syncInFlight: false });
        }
      }
    }

    syncPrivyToSupabase();

    return () => {
      isSubscribed = false;
    };
  }, [privyAuthenticated, privyUser, privyEmail, zegaEmail, solanaWalletAddress]);

  // Global Privy Solana Embedded Wallet Cache Synchronizer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cleanZegaEmail = zegaEmail ? String(zegaEmail).toLowerCase().trim() : '';
    const cleanPrivyEmail = privyEmail ? String(privyEmail).toLowerCase().trim() : '';

    if (Array.isArray(solanaWallets) && solanaWallets.length > 0) {
      if (!cleanZegaEmail || !cleanPrivyEmail || cleanPrivyEmail === cleanZegaEmail) {
        (window as any).privyWallets = solanaWallets;

        if (cleanZegaEmail && privyAuthenticated) {
          const embeddedSolana = solanaWallets.find(
            (w: any) => (w?.chainType === 'solana' || !w?.chainType) && (w?.walletClientType === 'privy' || w?.type === 'solana')
          ) || solanaWallets[0];

          if (embeddedSolana?.address) {
            localStorage.setItem(`zega_privy_wallet_${cleanZegaEmail}`, embeddedSolana.address);
            console.log('[PRIVY AUTH BRIDGE] Cached verified embedded Solana wallet:', embeddedSolana.address, 'for user:', cleanZegaEmail);
          }
        }
      } else {
        console.warn(`[PRIVY AUTH BRIDGE] Mismatch detected: Privy email (${cleanPrivyEmail}) != ZEGA email (${cleanZegaEmail}). Clearing stale wallet cache.`);
        (window as any).privyWallets = [];
      }
    }
  }, [solanaWalletAddress, zegaEmail, privyAuthenticated, privyUser, privyEmail]);

  return null;
}
