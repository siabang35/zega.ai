import { supabase, syncSupabaseAuthSession } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import {
  setStorageIdentityChecksum,
  verifyStorageIdentityIntegrity,
  purgeAllAuthSessionState,
} from './accountTypeManager';

export type CanonicalAuthStateStatus =
  | 'AUTH_LOADING'
  | 'AUTH_READY'
  | 'AUTH_REQUIRED'
  | 'AUTH_EXPIRED'
  | 'AUTH_INVALID'
  | 'AUTH_ERROR';

export type SupabaseSessionStateStatus =
  | 'SESSION_LOADING'
  | 'SESSION_READY'
  | 'SESSION_ABSENT'
  | 'SESSION_INVALID';

export type IdentitySource = 'SUPABASE' | 'EXTERNAL' | 'NONE';

export interface CanonicalAuthState {
  authState: CanonicalAuthStateStatus;
  sessionState: SupabaseSessionStateStatus;
  identitySource: IdentitySource;
  canonicalUserId: string | null;
  userEmail: string | null;
  supabaseSessionPresent: boolean;
  accessTokenPresent: boolean;
  expiresAt: number | null;
  session: Session | null;
  error?: string | null;
  identityReady: boolean;
  backendVerified: boolean;
  supabaseSessionReady: boolean;
  externalSessionReady: boolean;
  sessionProvider: 'supabase' | 'privy' | 'external' | 'none';
}

export interface CanonicalAuthResult {
  status: 'READY' | 'EXTERNAL_AUTH' | 'WAITING' | 'AUTH_REQUIRED' | 'AUTH_ERROR' | 'SESSION_INVALID';
  authState: CanonicalAuthStateStatus;
  sessionState: SupabaseSessionStateStatus;
  identitySource: IdentitySource;
  session: Session | null;
  authUserId: string | null;
  publicUserId: string | null;
  userEmail: string | null;
  generation: number;
  identityReady: boolean;
  backendVerified: boolean;
  supabaseSessionReady: boolean;
  externalSessionReady: boolean;
  sessionProvider: 'supabase' | 'privy' | 'external' | 'none';
}

function isValidUuid(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
}

class CanonicalAuthManager {
  private state: CanonicalAuthState = {
    authState: 'AUTH_LOADING',
    sessionState: 'SESSION_LOADING',
    identitySource: 'NONE',
    canonicalUserId: null,
    userEmail: null,
    supabaseSessionPresent: false,
    accessTokenPresent: false,
    expiresAt: null,
    session: null,
    error: null,
    identityReady: false,
    backendVerified: false,
    supabaseSessionReady: false,
    externalSessionReady: false,
    sessionProvider: 'none',
  };

  private listeners: Set<(state: CanonicalAuthState) => void> = new Set();
  private authInitPromise: Promise<CanonicalAuthState> | null = null;
  private sessionPromise: Promise<Session | null> | null = null;
  private refreshPromise: Promise<Session | null> | null = null;
  private authGeneration: number = 0;
  private listenerRegistered: boolean = false;

  constructor() {
    this.setupAuthChangeListenerOnce();
  }

  public getState(): CanonicalAuthState {
    return { ...this.state };
  }

  public getGeneration(): number {
    return this.authGeneration;
  }

  public subscribe(listener: (state: CanonicalAuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public updateState(partial: Partial<CanonicalAuthState>): CanonicalAuthState {
    const prevState = this.state.authState;
    const prevUserId = this.state.canonicalUserId;

    // Retain canonical userId if present and valid during transitional updates
    let nextUserId = partial.canonicalUserId !== undefined ? partial.canonicalUserId : this.state.canonicalUserId;
    if (prevState === 'AUTH_READY' && !nextUserId && isValidUuid(prevUserId) && partial.authState !== 'AUTH_REQUIRED') {
      nextUserId = prevUserId;
    }

    let nextAuthState = partial.authState !== undefined ? partial.authState : this.state.authState;
    let nextSessionState = partial.sessionState !== undefined ? partial.sessionState : this.state.sessionState;
    let nextIdentitySource = partial.identitySource !== undefined ? partial.identitySource : this.state.identitySource;
    let nextSession = partial.session !== undefined ? partial.session : this.state.session;
    let nextSupabasePresent = partial.supabaseSessionPresent !== undefined ? partial.supabaseSessionPresent : this.state.supabaseSessionPresent;

    // STRICT INVARIANT ENFORCEMENT:
    // 1. If session is present and valid, sessionState MUST be SESSION_READY and identitySource SUPABASE.
    if (nextSession && nextSession.user && isValidUuid(nextSession.user.id)) {
      nextSupabasePresent = true;
      nextSessionState = 'SESSION_READY';
      if (nextAuthState === 'AUTH_READY' || nextAuthState === 'AUTH_LOADING') {
        nextAuthState = 'AUTH_READY';
        nextIdentitySource = 'SUPABASE';
      }
    } else {
      nextSupabasePresent = false;
      if (nextSessionState === 'SESSION_READY') {
        nextSessionState = 'SESSION_ABSENT';
      }
    }

    // 2. FORBIDDEN CONTRADICTION: AUTH_READY + sessionState=SESSION_LOADING
    // If authState is set to AUTH_READY while sessionState is SESSION_LOADING, authState MUST remain AUTH_LOADING!
    if (nextAuthState === 'AUTH_READY' && nextSessionState === 'SESSION_LOADING') {
      nextAuthState = 'AUTH_LOADING';
    }

    // 3. FORBIDDEN CONTRADICTION: AUTH_READY with invalid user identity UUID
    const hasValidIdentity = Boolean(nextUserId && isValidUuid(nextUserId));
    if (nextAuthState === 'AUTH_READY' && !hasValidIdentity) {
      nextAuthState = 'AUTH_REQUIRED';
      nextSessionState = 'SESSION_ABSENT';
      nextIdentitySource = 'NONE';
    }

    // 4. Set identitySource appropriately if EXTERNAL identity
    if (nextAuthState === 'AUTH_READY' && !nextSupabasePresent && hasValidIdentity) {
      nextIdentitySource = 'EXTERNAL';
      nextSessionState = 'SESSION_ABSENT';
    }

    const identityReady = (nextAuthState === 'AUTH_READY' || nextAuthState === 'AUTH_LOADING') && hasValidIdentity;
    const backendVerified = partial.backendVerified !== undefined
      ? partial.backendVerified
      : (this.state.backendVerified || (nextAuthState === 'AUTH_READY' && hasValidIdentity));
    const supabaseSessionReady = Boolean(nextSupabasePresent && nextSession);
    const externalSessionReady = Boolean(hasValidIdentity && !nextSupabasePresent);
    let sessionProvider: 'supabase' | 'privy' | 'external' | 'none' = 'none';
    if (supabaseSessionReady) {
      sessionProvider = 'supabase';
    } else if (externalSessionReady) {
      sessionProvider = nextIdentitySource === 'EXTERNAL' ? 'external' : 'privy';
    } else if (identityReady) {
      sessionProvider = 'privy';
    }

    const candidateState: CanonicalAuthState = {
      ...this.state,
      ...partial,
      authState: nextAuthState,
      sessionState: nextSessionState,
      identitySource: nextIdentitySource,
      canonicalUserId: nextUserId,
      supabaseSessionPresent: nextSupabasePresent,
      session: nextSession,
      identityReady,
      backendVerified,
      supabaseSessionReady,
      externalSessionReady,
      sessionProvider,
    };

    if (
      this.state.authState === candidateState.authState &&
      this.state.sessionState === candidateState.sessionState &&
      this.state.identitySource === candidateState.identitySource &&
      this.state.canonicalUserId === candidateState.canonicalUserId &&
      this.state.userEmail === candidateState.userEmail &&
      this.state.supabaseSessionPresent === candidateState.supabaseSessionPresent &&
      this.state.accessTokenPresent === candidateState.accessTokenPresent &&
      this.state.expiresAt === candidateState.expiresAt &&
      this.state.session === candidateState.session &&
      this.state.identityReady === candidateState.identityReady &&
      this.state.supabaseSessionReady === candidateState.supabaseSessionReady &&
      this.state.externalSessionReady === candidateState.externalSessionReady &&
      this.state.sessionProvider === candidateState.sessionProvider &&
      this.state.error === candidateState.error
    ) {
      return this.state;
    }

    const prevAuthState = this.state.authState;
    const prevSessionState = this.state.sessionState;

    if (this.state.canonicalUserId !== candidateState.canonicalUserId && candidateState.canonicalUserId !== null) {
      this.authGeneration++;
    }

    this.state = candidateState;

    if (this.state.authState === 'AUTH_READY' && this.state.canonicalUserId) {
      setStorageIdentityChecksum(this.state.userEmail || '', this.state.canonicalUserId);
    }

    if (typeof window !== 'undefined') {
      (window as any).__ZEGA_CANONICAL_AUTH__ = this.state;
    }

    if (prevAuthState !== this.state.authState) {
      console.log('[AUTH_STATE]', { previous: prevAuthState, next: this.state.authState });
    }
    if (prevSessionState !== this.state.sessionState) {
      console.log('[SESSION_STATE]', { previous: prevSessionState, next: this.state.sessionState });
    }

    console.log('[CANONICAL_AUTH_MANAGER]', {
      authState: this.state.authState,
      sessionState: this.state.sessionState,
      identitySource: this.state.identitySource,
      userId: this.state.canonicalUserId,
      identityReady: this.state.identityReady,
      supabaseSessionReady: this.state.supabaseSessionReady,
      sessionProvider: this.state.sessionProvider,
      supabaseSessionPresent: this.state.supabaseSessionPresent,
      generation: this.authGeneration,
    });

    this.notify();
    return this.getState();
  }

  /**
   * Register single global auth state change listener ONCE
   */
  private setupAuthChangeListenerOnce(): void {
    if (this.listenerRegistered) return;
    this.listenerRegistered = true;

    try {
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('[SUPABASE_AUTH_EVENT]', { event, userId: session?.user?.id || null });

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (session && session.user && isValidUuid(session.user.id)) {
            this.updateState({
              authState: 'AUTH_READY',
              sessionState: 'SESSION_READY',
              canonicalUserId: session.user.id,
              userEmail: session.user.email || null,
              supabaseSessionPresent: true,
              accessTokenPresent: Boolean(session.access_token),
              expiresAt: session.expires_at || null,
              session,
              error: null,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          this.authGeneration++;
          this.updateState({
            authState: 'AUTH_REQUIRED',
            sessionState: 'SESSION_ABSENT',
            identitySource: 'NONE',
            canonicalUserId: null,
            userEmail: null,
            supabaseSessionPresent: false,
            accessTokenPresent: false,
            expiresAt: null,
            session: null,
            error: null,
          });
        }
      });
    } catch (e) {
      console.warn('[CANONICAL_AUTH_MANAGER] Failed to setup onAuthStateChange listener:', e);
    }
  }

  /**
   * Singleflight initialization of canonical auth state.
   */
  public async initialize(): Promise<CanonicalAuthState> {
    if (this.state.authState !== 'AUTH_LOADING' && this.state.authState !== 'AUTH_ERROR') {
      return this.getState();
    }

    if (this.authInitPromise) {
      return this.authInitPromise;
    }

    this.authInitPromise = (async () => {
      try {
        // 1. Inspect existing Supabase session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('[CANONICAL_AUTH_MANAGER] Supabase getSession note:', sessionError.message);
        }

        if (session && session.user && isValidUuid(session.user.id)) {
          return this.updateState({
            authState: 'AUTH_READY',
            sessionState: 'SESSION_READY',
            identitySource: 'SUPABASE',
            canonicalUserId: session.user.id,
            userEmail: session.user.email || null,
            supabaseSessionPresent: true,
            accessTokenPresent: Boolean(session.access_token),
            expiresAt: session.expires_at || null,
            session,
            error: null,
          });
        }

        // 2. Fallback check for cached access token or external JWT
        const localToken = typeof localStorage !== 'undefined'
          ? (localStorage.getItem('zega_access_token') || localStorage.getItem('zega_jwt') || localStorage.getItem('token'))
          : null;

        if (localToken) {
          const synced = await syncSupabaseAuthSession(localToken);
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          let effectiveUserId = freshSession?.user?.id;
          let effectiveEmail = freshSession?.user?.email;

          if (!effectiveUserId && localToken.includes('.')) {
            try {
              const payload = JSON.parse(atob(localToken.split('.')[1]));
              const sub = payload?.sub || payload?.id;
              if (isValidUuid(sub)) {
                effectiveUserId = sub;
                effectiveEmail = payload?.email || null;
              }
            } catch { }
          }

          if (effectiveUserId && isValidUuid(effectiveUserId)) {
            const hasGenuineSession = Boolean(synced && freshSession);
            return this.updateState({
              authState: 'AUTH_READY',
              sessionState: hasGenuineSession ? 'SESSION_READY' : 'SESSION_ABSENT',
              identitySource: hasGenuineSession ? 'SUPABASE' : 'EXTERNAL',
              canonicalUserId: effectiveUserId,
              userEmail: effectiveEmail || null,
              supabaseSessionPresent: hasGenuineSession,
              accessTokenPresent: true,
              expiresAt: freshSession?.expires_at || null,
              session: freshSession || null,
              error: null,
            });
          }
        }

        // No session found after initial restoration check
        return this.updateState({
          authState: 'AUTH_REQUIRED',
          sessionState: 'SESSION_ABSENT',
          identitySource: 'NONE',
          canonicalUserId: null,
          userEmail: null,
          supabaseSessionPresent: false,
          accessTokenPresent: Boolean(localToken),
          expiresAt: null,
          session: null,
          error: null,
        });
      } catch (err: any) {
        console.error('[CANONICAL_AUTH_MANAGER] Auth initialization exception:', err);
        return this.updateState({
          authState: 'AUTH_ERROR',
          sessionState: 'SESSION_ABSENT',
          identitySource: 'NONE',
          canonicalUserId: null,
          userEmail: null,
          supabaseSessionPresent: false,
          accessTokenPresent: false,
          expiresAt: null,
          session: null,
          error: err?.message || 'Auth initialization failed',
        });
      } finally {
        this.authInitPromise = null;
      }
    })();

    return this.authInitPromise;
  }

  /**
   * Singleflight waitForCanonicalSupabaseSession promise handler.
   */
  public async waitForCanonicalSupabaseSession(): Promise<Session | null> {
    if (this.state.session && this.state.sessionState === 'SESSION_READY') {
      return this.state.session;
    }

    if (this.sessionPromise) {
      return this.sessionPromise;
    }

    this.sessionPromise = (async (): Promise<Session | null> => {
      try {
        const auth = await this.waitUntilReady(10000);
        if (auth.status === 'READY' && auth.session) {
          return auth.session;
        }
        return null;
      } finally {
        this.sessionPromise = null;
      }
    })();

    return this.sessionPromise;
  }

  /**
   * Singleflight centralized token refresh operation
   */
  public async refreshSession(): Promise<Session | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async (): Promise<Session | null> => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          console.warn('[CANONICAL_AUTH_MANAGER] Centralized refreshSession failed:', error?.message);
          return null;
        }
        this.updateState({
          authState: 'AUTH_READY',
          sessionState: 'SESSION_READY',
          identitySource: 'SUPABASE',
          canonicalUserId: data.session.user.id,
          userEmail: data.session.user.email || null,
          supabaseSessionPresent: true,
          accessTokenPresent: true,
          expiresAt: data.session.expires_at || null,
          session: data.session,
          error: null,
        });
        return data.session;
      } catch (err) {
        console.warn('[CANONICAL_AUTH_MANAGER] Centralized refreshSession exception:', err);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Bounded wait until auth state is no longer AUTH_LOADING.
   */
  public async waitUntilReady(timeoutMs: number = 10000): Promise<CanonicalAuthResult> {
    let current = this.getState();
    if (current.authState === 'AUTH_LOADING' || current.sessionState === 'SESSION_LOADING') {
      this.initialize().catch(() => { });

      await new Promise<CanonicalAuthState>((resolve) => {
        let timer: any = null;
        let unsubscribe: (() => void) | null = null;

        unsubscribe = this.subscribe((state) => {
          if (state.authState !== 'AUTH_LOADING' && state.sessionState !== 'SESSION_LOADING') {
            if (timer) clearTimeout(timer);
            if (unsubscribe) unsubscribe();
            resolve(state);
          }
        });

        timer = setTimeout(() => {
          if (unsubscribe) unsubscribe();
          resolve(this.getState());
        }, timeoutMs);
      });
      current = this.getState();
    }

    const isReadyIdentity = current.identityReady && Boolean(current.canonicalUserId && isValidUuid(current.canonicalUserId));
    const isFullReady = (current.authState === 'AUTH_READY' || current.authState === 'AUTH_LOADING') && isReadyIdentity;

    let status: 'READY' | 'EXTERNAL_AUTH' | 'WAITING' | 'AUTH_REQUIRED' | 'AUTH_ERROR' | 'SESSION_INVALID' = 'READY';
    if (!isFullReady) {
      if (current.authState === 'AUTH_LOADING' || current.sessionState === 'SESSION_LOADING') {
        status = 'WAITING';
      } else if (current.authState === 'AUTH_REQUIRED') {
        status = 'AUTH_REQUIRED';
      } else if (current.authState === 'AUTH_ERROR') {
        status = 'AUTH_ERROR';
      } else {
        status = 'SESSION_INVALID';
      }
    }

    const result: CanonicalAuthResult = {
      status,
      authState: current.authState,
      sessionState: current.sessionState,
      identitySource: current.identitySource,
      session: current.session,
      authUserId: current.canonicalUserId,
      publicUserId: current.canonicalUserId,
      userEmail: current.userEmail,
      generation: this.authGeneration,
      identityReady: current.identityReady,
      backendVerified: current.backendVerified,
      supabaseSessionReady: current.supabaseSessionReady,
      externalSessionReady: current.externalSessionReady,
      sessionProvider: current.sessionProvider,
    };

    console.log('[AUTH_CANONICAL_SNAPSHOT]', {
      authState: result.authState,
      identityReady: result.identityReady,
      backendVerified: result.backendVerified,
      sessionProvider: result.sessionProvider,
      supabaseSessionReady: result.supabaseSessionReady,
      userId: result.authUserId,
      generation: result.generation,
    });

    return result;
  }

  /**
   * Return synchronous snapshot of canonical auth state machine result.
   */
  public getSnapshot(): CanonicalAuthResult {
    const current = this.getState();
    const isReadyIdentity = current.identityReady && Boolean(current.canonicalUserId && isValidUuid(current.canonicalUserId));
    const isFullReady = (current.authState === 'AUTH_READY' || current.authState === 'AUTH_LOADING') && isReadyIdentity;

    let status: 'READY' | 'EXTERNAL_AUTH' | 'WAITING' | 'AUTH_REQUIRED' | 'AUTH_ERROR' | 'SESSION_INVALID' = 'READY';
    if (!isFullReady) {
      if (current.authState === 'AUTH_LOADING' || current.sessionState === 'SESSION_LOADING') {
        status = 'WAITING';
      } else if (current.authState === 'AUTH_REQUIRED') {
        status = 'AUTH_REQUIRED';
      } else if (current.authState === 'AUTH_ERROR') {
        status = 'AUTH_ERROR';
      } else {
        status = 'SESSION_INVALID';
      }
    }

    const result: CanonicalAuthResult = {
      status,
      authState: current.authState,
      sessionState: current.sessionState,
      identitySource: current.identitySource,
      session: current.session,
      authUserId: current.canonicalUserId,
      publicUserId: current.canonicalUserId,
      userEmail: current.userEmail,
      generation: this.authGeneration,
      identityReady: current.identityReady,
      backendVerified: current.backendVerified,
      supabaseSessionReady: current.supabaseSessionReady,
      externalSessionReady: current.externalSessionReady,
      sessionProvider: current.sessionProvider,
    };

    console.log('[AUTH_CANONICAL_SNAPSHOT]', {
      authState: result.authState,
      identityReady: result.identityReady,
      backendVerified: result.backendVerified,
      sessionProvider: result.sessionProvider,
      supabaseSessionReady: result.supabaseSessionReady,
      userId: result.authUserId,
      generation: result.generation,
    });

    return result;
  }

  /**
   * Return actual Supabase auth session if present and valid.
   */
  public async getSession(): Promise<Session | null> {
    const session = await this.waitForCanonicalSupabaseSession();
    if (session && session.user && isValidUuid(session.user.id)) {
      return session;
    }
    return null;
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch { }
    });
  }
}

export const canonicalAuthManager = new CanonicalAuthManager();

