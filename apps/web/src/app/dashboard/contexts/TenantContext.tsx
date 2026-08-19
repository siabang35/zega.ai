/**
 * TenantContext.tsx — Multi-Tenant Identity Resolution Provider
 * 
 * Aligned with: docs/tenancy/TENANT_MODEL.md
 * Hierarchy: User → Organization → Workspace → Store → Resource
 * 
 * Canonical Tenant Boundary: organization_id (PRIMARY)
 * Sub-Scope Boundary: workspace_id
 * Business Entity: store_id
 */

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { supabase, setSupabaseTenantHeader } from '../../../lib/supabase';
import { isValidUuid } from '../services/umkmSupabaseService';
import { getVerifiedAccountType } from '../../services/accountTypeManager';

export type TenantType = 'umkm' | 'enterprise' | 'superadmin';

export type CanonicalTenantContext = {
  userId: string;
  organizationId: string;
  storeId: string;
  workspaceId: string;
};

/**
 * Asserts that a given context possesses valid, non-empty UUIDs for all 4 canonical tenant IDs.
 * Throws TENANT_CONTEXT_INCOMPLETE if any UUID is missing or invalid.
 */
export function assertCanonicalTenantContext(ctx: {
  userId?: string | null;
  organizationId?: string | null;
  storeId?: string | null;
  workspaceId?: string | null;
}): CanonicalTenantContext {
  const userId = ctx.userId;
  const organizationId = ctx.organizationId;
  const storeId = ctx.storeId;
  const workspaceId = ctx.workspaceId;

  if (!userId || !isValidUuid(userId)) {
    throw new Error(`TENANT_CONTEXT_INCOMPLETE: Invalid or missing userId UUID (value: "${userId || ''}")`);
  }
  if (!organizationId || !isValidUuid(organizationId)) {
    throw new Error(`TENANT_CONTEXT_INCOMPLETE: Invalid or missing organizationId UUID (value: "${organizationId || ''}")`);
  }
  if (!storeId || !isValidUuid(storeId)) {
    throw new Error(`TENANT_CONTEXT_INCOMPLETE: Invalid or missing storeId UUID (value: "${storeId || ''}")`);
  }
  if (!workspaceId || !isValidUuid(workspaceId)) {
    throw new Error(`TENANT_CONTEXT_INCOMPLETE: Invalid or missing workspaceId UUID (value: "${workspaceId || ''}")`);
  }
  if (organizationId === storeId) {
    throw new Error(`TENANT_CONTEXT_CORRUPTED: organizationId ("${organizationId}") must not equal storeId`);
  }
  if (workspaceId === storeId) {
    throw new Error(`TENANT_CONTEXT_CORRUPTED: workspaceId ("${workspaceId}") must not equal storeId`);
  }

  return {
    userId,
    organizationId,
    storeId,
    workspaceId
  };
}

export type StoreReadinessStatus =
  | 'loading'
  | 'ready'
  | 'unavailable'
  | 'error'
  | 'rpc_schema_error'
  | 'store_context_unavailable';

export interface TenantIds {
  /** Unique snapshot trace ID to verify tenant alignment across async boundaries */
  snapshotId?: string;
  /** Primary tenant isolation boundary (canonical) */
  organizationId: string;
  /** Sub-scope isolation within organization */
  workspaceId: string;
  /** Business unit / store entity (null when no valid store exists) */
  storeId: string | null;
  /** Tenant type classification */
  tenantType: TenantType;
  /** Original user email for audit trail */
  userEmail: string;
  /** User identifier */
  userId: string;
  /** Store readiness status */
  storeStatus: StoreReadinessStatus;
  /** Verification status flags for hard gate checks */
  verified?: boolean;
  tenantVerified?: boolean;
  /** Monotonic snapshot version counter */
  version?: number;
}

export interface TenantSnapshot {
  snapshotId?: string;
  userId: string;
  organizationId: string;
  storeId: string | null;
  tenantState: AuthorizedUmkmContextStatus;
  tenantVerified: boolean;
  version: number;
}

/** Unresolved sentinel — indicates tenant context has NOT been resolved from a real authenticated user yet */
const UNRESOLVED_ORG = '';
const UNRESOLVED_WS = '';

/**
 * Deterministic tenant resolution from user identity.
 * organizationId is primary boundary. storeId starts null until validated from DB.
 */
export function resolveTenantFromUser(
  userEmail?: string,
  tenantType?: TenantType
): TenantIds {
  if (!userEmail || !userEmail.trim()) {
    // No authenticated user — return unresolved tenant (fail closed)
    return {
      organizationId: UNRESOLVED_ORG,
      workspaceId: UNRESOLVED_WS,
      storeId: null,
      tenantType: tenantType || 'umkm',
      userEmail: '',
      userId: '',
      storeStatus: 'unavailable' as StoreReadinessStatus
    };
  }
  const email = userEmail.toLowerCase().trim();

  // Resolve canonical account type from verified persistence / session if tenantType not explicitly provided
  const resolvedAccType = getVerifiedAccountType(email);
  const effectiveTenantType: TenantType = tenantType || (resolvedAccType === 'ENTERPRISE' ? 'enterprise' : 'umkm');

  const storedStoreId = typeof localStorage !== 'undefined' ? localStorage.getItem('zega_active_store_id') : null;
  const storedOrgId = typeof localStorage !== 'undefined' ? localStorage.getItem('zega_active_org_id') : null;
  const storedWsId = typeof localStorage !== 'undefined' ? localStorage.getItem('zega_active_workspace_id') : null;

  const effectiveStoreId = isValidUuid(_activeTenant.storeId) ? _activeTenant.storeId : (isValidUuid(storedStoreId) ? storedStoreId : null);
  let effectiveOrgId = (isValidUuid(_activeTenant.organizationId) && _activeTenant.organizationId !== UNRESOLVED_ORG) ? _activeTenant.organizationId : (isValidUuid(storedOrgId) ? storedOrgId! : '');
  let effectiveWsId = (isValidUuid(_activeTenant.workspaceId) && _activeTenant.workspaceId !== UNRESOLVED_WS) ? _activeTenant.workspaceId : (isValidUuid(storedWsId) ? storedWsId! : '');

  if (!effectiveOrgId || !isValidUuid(effectiveOrgId) || effectiveOrgId === effectiveStoreId) {
    effectiveOrgId = UNRESOLVED_ORG;
  }
  if (!effectiveWsId || !isValidUuid(effectiveWsId) || effectiveWsId === effectiveStoreId || effectiveWsId === effectiveOrgId) {
    effectiveWsId = UNRESOLVED_WS;
  }

  const effectiveStoreStatus: StoreReadinessStatus = (effectiveStoreId && isValidUuid(effectiveStoreId) && effectiveOrgId !== UNRESOLVED_ORG && effectiveWsId !== UNRESOLVED_WS) ? 'ready' : (_activeTenant.storeStatus || 'loading');

  const isStoreReady = effectiveStoreStatus === 'ready' && Boolean(effectiveStoreId) && effectiveOrgId !== UNRESOLVED_ORG && effectiveWsId !== UNRESOLVED_WS;

  // SuperAdmin detection (platform control plane)
  if (email.endsWith('@zegaai.site') || email.endsWith('@zeroclaw.ai')) {
    return {
      organizationId: effectiveOrgId,
      workspaceId: effectiveWsId,
      storeId: effectiveStoreId,
      tenantType: 'superadmin',
      userEmail: email,
      userId: _activeTenant.userId || getAuthBridgeState().supabaseUserId || '',
      storeStatus: effectiveStoreStatus,
      verified: isStoreReady,
      tenantVerified: isStoreReady
    };
  }

  // Enterprise detection
  if (effectiveTenantType === 'enterprise') {
    return {
      organizationId: effectiveOrgId,
      workspaceId: effectiveWsId,
      storeId: effectiveStoreId,
      tenantType: 'enterprise',
      userEmail: email,
      userId: _activeTenant.userId || getAuthBridgeState().supabaseUserId || '',
      storeStatus: effectiveStoreStatus,
      verified: isStoreReady,
      tenantVerified: isStoreReady
    };
  }

  // UMKM tenant — starts unresolved until verified from database catalog
  return {
    organizationId: effectiveOrgId,
    workspaceId: effectiveWsId,
    storeId: effectiveStoreId,
    tenantType: 'umkm',
    userEmail: email,
    userId: _activeTenant.userId || getAuthBridgeState().supabaseUserId || '',
    storeStatus: effectiveStoreStatus,
    verified: isStoreReady,
    tenantVerified: isStoreReady
  };
}

// ============================================================================
// Global listener system for _activeTenant changes.
// When the async resolver mutates _activeTenant via updateActiveTenantStore/Org/Workspace,
// it notifies all subscribed TenantProvider instances so React re-renders.
// ============================================================================
type TenantChangeListener = () => void;
const _tenantChangeListeners = new Set<TenantChangeListener>();

function notifyTenantChanged(): void {
  _tenantChangeListeners.forEach(listener => { try { listener(); } catch { } });
}

export function subscribeTenantChanges(listener: TenantChangeListener): () => void {
  _tenantChangeListeners.add(listener);
  return () => { _tenantChangeListeners.delete(listener); };
}


export type AuthorizedUmkmContextStatus =
  | 'BOOTING'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'TENANT_RESOLVING'
  | 'STORE_RESOLVING'
  | 'ONBOARDING_REQUIRED'
  | 'PROVISIONING'
  | 'READY'
  | 'NO_STORE'
  | 'STORE_CONTEXT_UNAVAILABLE'
  | 'IDENTITY_MAPPING_ERROR'
  | 'RPC_SCHEMA_ERROR'
  | 'ERROR'
  | 'SIGNED_OUT';

export interface AuthorizedUmkmContext {
  status: AuthorizedUmkmContextStatus;
  userId: string;
  userEmail: string;
  organizationId: string;
  workspaceId: string;
  storeId: string | null;
  store: any | null;
  tenantType: TenantType;
  authReady: boolean;
  organizationReady: boolean;
  storeReady: boolean;
  error?: string | null;
  provisionStore?: (params: { storeName: string; category?: string; phone?: string; location?: string }) => Promise<{ ok: boolean; storeId?: string; error?: string }>;
}

const AuthorizedUmkmReactContext = createContext<AuthorizedUmkmContext>({
  status: 'BOOTING',
  userId: '',
  userEmail: '',
  organizationId: UNRESOLVED_ORG,
  workspaceId: UNRESOLVED_WS,
  storeId: null,
  store: null,
  tenantType: 'umkm',
  authReady: false,
  organizationReady: false,
  storeReady: false
});

export function useAuthorizedUmkmContext(): AuthorizedUmkmContext {
  return useContext(AuthorizedUmkmReactContext);
}

// ============================================================================
// React Context (Backward Compatible TenantContext)
// ============================================================================

const TenantContext = createContext<TenantIds>({
  organizationId: UNRESOLVED_ORG,
  workspaceId: UNRESOLVED_WS,
  storeId: null,
  tenantType: 'umkm',
  userEmail: '',
  userId: '',
  storeStatus: 'loading'
});

export function useTenant(): TenantIds {
  return useContext(TenantContext);
}

interface TenantProviderProps {
  userEmail?: string;
  tenantType?: TenantType;
  children: React.ReactNode;
}

import { getAuthBridgeState } from '../../components/auth/PrivyAuthBridge';
import { canonicalAuthManager } from '../../services/CanonicalAuthManager';

export function TenantProvider({ userEmail, tenantType = 'umkm', children }: TenantProviderProps) {
  // Version counter: incremented whenever _activeTenant is mutated by the async resolver.
  // This forces useMemo recomputation so React sees the latest storeReady/orgId/storeId.
  const [tenantVersion, setTenantVersion] = useState(0);

  const effectiveEmail = userEmail || getAuthBridgeState().userEmail || (() => {
    try {
      const mockStr = typeof localStorage !== 'undefined' ? localStorage.getItem('zega_mock_session') : null;
      if (mockStr) {
        const parsed = JSON.parse(mockStr);
        return parsed?.email || parsed?.user?.email || null;
      }
    } catch { }
    return null;
  })();

  const tenant = useMemo(
    () => resolveTenantFromUser(effectiveEmail, tenantType),
    [effectiveEmail, tenantType]
  );

  // Subscribe to global _activeTenant changes so we re-render when the async resolver finishes
  useEffect(() => {
    const unsub = subscribeTenantChanges(() => {
      setTenantVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const isResolvingTenantRef = React.useRef(false);

  useEffect(() => {
    const authBridge = getAuthBridgeState();
    const canonicalAuth = canonicalAuthManager.getSnapshot();
    const isSettledReady = _activeTenant.storeStatus === 'ready' && isValidUuid(_activeTenant.storeId) && isValidUuid(_activeTenant.organizationId) && isValidUuid(_activeTenant.workspaceId);

    const isIdentityAvailable = canonicalAuth.identityReady || Boolean(authBridge.supabaseUserId) || Boolean(canonicalAuth.authUserId);

    if (authBridge.authState === 'AUTH_INITIALIZING' || (authBridge.authState !== 'AUTH_READY' && !isIdentityAvailable)) {
      console.log('[TenantProvider] Gating tenant resolution: auth state is AUTH_INITIALIZING or identity unavailable.');
      return;
    }
    if (authBridge.authState === 'AUTH_REQUIRED' && !isIdentityAvailable) {
      console.log('[TenantProvider] Gating tenant resolution: auth state is AUTH_REQUIRED.');
      if (!isSettledReady) {
        updateActiveTenantStore(null, 'unavailable');
      }
      return;
    }

    // Only update active tenant if not settled ready and active tenant identity differs
    if (!isSettledReady && (_activeTenant.userEmail !== tenant.userEmail || !_activeTenant.userId)) {
      setActiveTenant(tenant);
    }

    if (isSettledReady) {
      isResolvingTenantRef.current = false;
      return;
    }

    const isContextIncomplete = !isValidUuid(_activeTenant.organizationId) || _activeTenant.organizationId === UNRESOLVED_ORG || !isValidUuid(_activeTenant.workspaceId) || _activeTenant.workspaceId === UNRESOLVED_WS || !_activeTenant.storeId;
    if (effectiveEmail && !isResolvingTenantRef.current && (isContextIncomplete || (_activeTenant.storeStatus !== 'ready' && _activeTenant.storeStatus !== 'unavailable' && _activeTenant.storeStatus !== 'error'))) {
      isResolvingTenantRef.current = true;
      import('../services/umkmSupabaseService').then(({ umkmSupabaseService }) => {
        umkmSupabaseService.getCanonicalTenantContext().catch(err => {
          console.warn('[TenantProvider] Asynchronous tenant resolution warning:', err);
        }).finally(() => {
          isResolvingTenantRef.current = false;
        });
      }).catch(err => {
        console.warn('[TenantProvider] Dynamic import warning:', err);
        isResolvingTenantRef.current = false;
      });
    }
  }, [tenant, effectiveEmail]);

  const authContextValue = useMemo<AuthorizedUmkmContext>(() => {
    // Read from _activeTenant singleton which is mutated by the async resolver
    const currentTenant = _activeTenant;
    const authBridge = getAuthBridgeState();
    const userValid = !!currentTenant.userId && isValidUuid(currentTenant.userId);
    const orgValid = !!currentTenant.organizationId && currentTenant.organizationId !== UNRESOLVED_ORG && isValidUuid(currentTenant.organizationId);
    const storeValid = (currentTenant.storeStatus === 'ready' || isValidUuid(currentTenant.storeId)) && isValidUuid(currentTenant.storeId);
    const wsValid = !!currentTenant.workspaceId && currentTenant.workspaceId !== UNRESOLVED_WS && isValidUuid(currentTenant.workspaceId);

    const effectiveOrgId = orgValid ? currentTenant.organizationId : UNRESOLVED_ORG;
    const effectiveWsId = wsValid ? currentTenant.workspaceId : UNRESOLVED_WS;

    // DECOUPLED: authReady derived SOLELY from canonical auth bridge, NOT from tenant state
    const authReady = authBridge.authState === 'AUTH_READY';

    let status: AuthorizedUmkmContextStatus = 'BOOTING';
    if (!authReady && authBridge.authState === 'AUTH_INITIALIZING') {
      status = 'BOOTING';
    } else if (!authReady) {
      status = 'AUTHENTICATING';
    } else if (storeValid && orgValid && wsValid && userValid) {
      status = 'READY';
    } else if (!orgValid && !storeValid && currentTenant.storeStatus === 'loading') {
      status = 'TENANT_RESOLVING';
    } else if (currentTenant.storeStatus === 'loading') {
      status = 'STORE_RESOLVING';
    } else if (currentTenant.storeStatus === 'unavailable' && (currentTenant as any).resolutionState === 'NO_PROVISIONED_STORE' && !currentTenant.storeId) {
      status = 'ONBOARDING_REQUIRED';
    } else if (storeValid) {
      // Transitional state: store is valid but full tenant resolution (org/workspace) in progress
      status = 'TENANT_RESOLVING';
    } else {
      // Auth is ready but tenant not yet — transitional state
      status = 'TENANT_RESOLVING';
    }

    return {
      status,
      userId: currentTenant.userId,
      userEmail: currentTenant.userEmail || effectiveEmail,
      organizationId: effectiveOrgId,
      workspaceId: effectiveWsId,
      storeId: currentTenant.storeId,
      store: null,
      tenantType: currentTenant.tenantType,
      authReady,
      organizationReady: orgValid,
      storeReady: storeValid,
      provisionStore: provisionUmkmStore
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, userEmail, tenantVersion]);

  return (
    <AuthorizedUmkmReactContext.Provider value={authContextValue}>
      <TenantContext.Provider value={tenant}>
        {children}
      </TenantContext.Provider>
    </AuthorizedUmkmReactContext.Provider>
  );
}

// ============================================================================
// Service Layer Helpers (non-React, for use inside supabaseService.ts)
// ============================================================================

let _tenantGeneration = 1;

export function getTenantGeneration(): number {
  return _tenantGeneration;
}

/** 
 * Singleton tenant state for service layer (set by TenantProvider on mount).
 * This avoids requiring React hooks inside service functions.
 */
let _activeTenant: TenantIds = {
  organizationId: UNRESOLVED_ORG,
  workspaceId: UNRESOLVED_WS,
  storeId: null,
  tenantType: 'umkm',
  userEmail: '',
  userId: '',
  storeStatus: 'unavailable',
  version: 1
};

/** Called by TenantProvider to sync active tenant to service layer & Supabase REST headers */
export function setActiveTenant(tenant: TenantIds): void {
  // Check if this is a true user switch:
  // ONLY reset if BOTH current and incoming user IDs/emails are valid and do NOT represent the same user.
  const isSameUser = _activeTenant.userId === tenant.userId ||
    (_activeTenant.userEmail && tenant.userEmail && _activeTenant.userEmail.toLowerCase() === tenant.userEmail.toLowerCase()) ||
    (!_activeTenant.userId || !tenant.userId);

  if (!isSameUser) {
    _tenantGeneration++;
    console.log('[TENANT_RESOLVER] User changed — incrementing tenantGeneration to', _tenantGeneration, {
      prevUser: _activeTenant.userId || _activeTenant.userEmail,
      newUser: tenant.userId || tenant.userEmail
    });
    _activeTenant = {
      organizationId: UNRESOLVED_ORG,
      workspaceId: UNRESOLVED_WS,
      storeId: null,
      tenantType: tenant.tenantType,
      userEmail: tenant.userEmail,
      userId: tenant.userId,
      storeStatus: 'loading',
      version: _tenantGeneration
    };
    // Invalidate resolver cache on user switch (dynamic import to avoid circular dependency)
    import('../services/umkmSupabaseService').then(({ invalidateTenantResolutionCache }) => {
      invalidateTenantResolutionCache();
    }).catch(() => { });
    notifyTenantChanged();
    return;
  }

  // Monotonic state guard: An active READY tenant snapshot is IMMUTABLE for the duration of the user session.
  // Rejects any attempt to overwrite an existing READY state with loading, unavailable, or unresolved states.
  const isCurrentReady = _activeTenant.storeStatus === 'ready' && isValidUuid(_activeTenant.storeId) && isValidUuid(_activeTenant.organizationId) && isValidUuid(_activeTenant.workspaceId);
  const isIncomingReady = tenant.storeStatus === 'ready' && isValidUuid(tenant.storeId) && isValidUuid(tenant.organizationId) && isValidUuid(tenant.workspaceId);

  if (isCurrentReady && !isIncomingReady && isSameUser) {
    console.log('[TENANT_RESOLVER] [CONTEXT_OVERWRITE_ATTEMPT] Blocked regression of READY tenant snapshot:', {
      existingStoreId: _activeTenant.storeId,
      existingOrgId: _activeTenant.organizationId,
      existingWsId: _activeTenant.workspaceId,
      incomingStoreStatus: tenant.storeStatus
    });
    // Retain full READY snapshot, only merging optional metadata updates
    _activeTenant = {
      ..._activeTenant,
      userEmail: tenant.userEmail || _activeTenant.userEmail,
      userId: _activeTenant.userId || tenant.userId
    };
  } else {
    _activeTenant = {
      ...tenant,
      userId: _activeTenant.userId && isSameUser ? _activeTenant.userId : tenant.userId
    };
  }

  if (_activeTenant.organizationId && _activeTenant.organizationId !== UNRESOLVED_ORG) {
    setSupabaseTenantHeader(_activeTenant.organizationId);
  }
}

/** Get current tenant IDs for use in service queries */
export function getActiveTenantIds(): TenantIds {
  return _activeTenant;
}

/** Sync resolved storeId and storeStatus into singleton tenant state */
export function updateActiveTenantStore(storeId: string | null, storeStatus: StoreReadinessStatus = 'ready'): void {
  const targetStoreId = storeId || _activeTenant.storeId;
  const isTargetValid = isValidUuid(targetStoreId);

  if (_activeTenant.storeStatus === 'ready' && _activeTenant.storeId && (!storeId || storeStatus === 'loading' || storeStatus === 'unavailable')) {
    console.log('[TENANT_RESOLVER] [CONTEXT_OVERWRITE_ATTEMPT] Ignored attempt to update store state to non-ready while store is already READY');
    return;
  }

  if (isTargetValid && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('zega_active_store_id', targetStoreId!);
    } catch { }
  }

  const effectiveUserId = _activeTenant.userId || getAuthBridgeState().supabaseUserId || '';
  _activeTenant = {
    ..._activeTenant,
    userId: effectiveUserId,
    storeId: targetStoreId,
    storeStatus: isTargetValid ? 'ready' : storeStatus,
    verified: isTargetValid,
    tenantVerified: isTargetValid
  };
  notifyTenantChanged();
}

/** Adopt a real (DB-sourced) organization_id into singleton tenant state + Supabase headers */
export function updateActiveTenantOrg(organizationId: string): void {
  if (!organizationId || organizationId.trim() === '') return;
  _activeTenant = {
    ..._activeTenant,
    organizationId
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zega_active_org_id', organizationId);
    }
  } catch { }
  setSupabaseTenantHeader(organizationId);
  notifyTenantChanged();
}

/** Sync resolved workspaceId into singleton tenant state */
export function updateActiveTenantWorkspace(workspaceId: string): void {
  if (!workspaceId || workspaceId.trim() === '') return;
  _activeTenant = {
    ..._activeTenant,
    workspaceId
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('zega_active_workspace_id', workspaceId);
    }
  } catch { }
  notifyTenantChanged();
}

/**
 * Provision a legitimate, verified store row for the authenticated user in umkm_stores.
 * Enforces canonical multi-tenant RLS security by assigning user_id = session.user.id.
 */
export async function provisionUmkmStore(params: {
  storeName: string;
  category?: string;
  phone?: string;
  location?: string;
}): Promise<{ ok: boolean; storeId?: string; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const activeTenant = getActiveTenantIds();
    const bridgeState = getAuthBridgeState();
    const userId = session?.user?.id || bridgeState.supabaseUserId || activeTenant.userId || activeTenant.userEmail;

    if (!userId) {
      return { ok: false, error: 'User is not authenticated or lacks a valid user identity.' };
    }

    console.log('[TenantContext] Provisioning new store row for user via server RPC:', userId, params);

    const storeName = params.storeName.trim();
    const phone = params.phone?.trim() || undefined;

    const { ensureStoreForCurrentUser, umkmSupabaseService } = await import('../services/umkmSupabaseService');
    const rpcRes = await ensureStoreForCurrentUser({ storeName, phone: phone || undefined });

    if (!rpcRes.ok || !rpcRes.storeId) {
      console.error('[TenantContext] Error creating umkm_store row via RPC:', rpcRes.error);
      return { ok: false, error: rpcRes.error || 'Failed to provision store record.' };
    }

    console.log('[TenantContext] Store provisioned successfully via RPC:', rpcRes.storeId);
    updateActiveTenantStore(rpcRes.storeId, 'ready');
    if (rpcRes.organizationId) updateActiveTenantOrg(rpcRes.organizationId);
    if (rpcRes.workspaceId) updateActiveTenantWorkspace(rpcRes.workspaceId);

    // Invalidate resolution caches & force dynamic resolution
    const { invalidateTenantResolutionCache } = await import('../services/umkmSupabaseService');
    invalidateTenantResolutionCache();
    await umkmSupabaseService.getCanonicalTenantContext(rpcRes.storeId);

    return { ok: true, storeId: rpcRes.storeId };
  } catch (err: any) {
    console.error('[TenantContext] Store provisioning exception:', err);
    return { ok: false, error: err?.message || 'Unexpected store creation exception.' };
  }
}

/** Get immutable snapshot of current tenant state */
export function getTenantSnapshot(): TenantSnapshot {
  const current = getActiveTenantIds();
  const storeValid = (current.storeStatus === 'ready' || isValidUuid(current.storeId)) && isValidUuid(current.storeId);
  const orgValid = !!current.organizationId && current.organizationId !== UNRESOLVED_ORG && isValidUuid(current.organizationId);
  const effectiveOrgId = orgValid ? current.organizationId : UNRESOLVED_ORG;
  const state: AuthorizedUmkmContextStatus = storeValid ? 'READY' : (current.storeStatus === 'loading' ? 'TENANT_RESOLVING' : 'ONBOARDING_REQUIRED');

  return Object.freeze({
    snapshotId: current.snapshotId,
    userId: current.userId,
    organizationId: effectiveOrgId,
    storeId: current.storeId,
    tenantState: state,
    tenantVerified: storeValid,
    version: current.version || Date.now()
  });
}

export interface CanonicalRequestContext {
  userId: string;
  organizationId: string;
  workspaceId: string;
  storeId: string;
  tenantMode: TenantType;
  authGeneration: number;
}

/** Get immutable canonical request context for hot path execution */
export function getCanonicalRequestContext(): CanonicalRequestContext | null {
  const t = _activeTenant;
  const isReady = t.storeStatus === 'ready' && isValidUuid(t.storeId) && isValidUuid(t.organizationId) && isValidUuid(t.workspaceId) && isValidUuid(t.userId);
  if (!isReady) return null;
  return Object.freeze({
    userId: t.userId,
    organizationId: t.organizationId,
    workspaceId: t.workspaceId,
    storeId: t.storeId!,
    tenantMode: t.tenantType,
    authGeneration: _tenantGeneration
  });
}

