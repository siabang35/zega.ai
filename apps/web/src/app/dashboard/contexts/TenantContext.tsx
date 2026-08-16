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

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { setSupabaseTenantHeader } from '../../../lib/supabase';

export type TenantType = 'umkm' | 'enterprise' | 'superadmin';

export type StoreReadinessStatus = 'loading' | 'ready' | 'unavailable' | 'error';

export interface TenantIds {
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
  tenantType: TenantType = 'umkm'
): TenantIds {
  if (!userEmail || !userEmail.trim()) {
    // No authenticated user — return unresolved tenant (fail closed)
    return {
      organizationId: UNRESOLVED_ORG,
      workspaceId: UNRESOLVED_WS,
      storeId: null,
      tenantType,
      userEmail: '',
      userId: '',
      storeStatus: 'unavailable' as StoreReadinessStatus
    };
  }
  const email = userEmail.toLowerCase().trim();
  
  // SuperAdmin detection (platform control plane)
  if (email.endsWith('@zegaai.site') || email.endsWith('@zeroclaw.ai')) {
    return {
      organizationId: hashToUuid('zega-platform-superadmin-org'),
      workspaceId: hashToUuid('zega-platform-superadmin-ws'),
      storeId: null,
      tenantType: 'superadmin',
      userEmail: email,
      userId: email,
      storeStatus: 'loading'
    };
  }

  // Enterprise detection
  if (tenantType === 'enterprise') {
    const domain = email.split('@')[1] || 'default';
    const domainHash = hashToUuid(domain);
    return {
      organizationId: domainHash,
      workspaceId: hashToUuid(`${domain}:ws:default`),
      storeId: null,
      tenantType: 'enterprise',
      userEmail: email,
      userId: email,
      storeStatus: 'loading'
    };
  }

  // UMKM tenant — deterministic per email
  const userHash = hashToUuid(email);
  const wsHash = hashToUuid(`${email}:ws:default`);
  return {
    organizationId: userHash,
    workspaceId: wsHash,
    storeId: null,
    tenantType: 'umkm',
    userEmail: email,
    userId: email,
    storeStatus: 'loading'
  };
}

/**
 * Deterministic UUID v5-style hash from a string.
 * Produces consistent UUIDs for the same input across sessions.
 */
function hashToUuid(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate deterministic UUID from hash
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash * 31 + 17).toString(16).padStart(8, '0');
  const hex3 = Math.abs(hash * 37 + 23).toString(16).padStart(4, '0');
  const hex4 = Math.abs(hash * 41 + 29).toString(16).padStart(4, '0');
  const hex5 = Math.abs(hash * 43 + 31).toString(16).padStart(12, '0');
  
  return `${hex.substring(0, 8)}-${hex2.substring(0, 4)}-4${hex3.substring(0, 3)}-a${hex4.substring(0, 3)}-${hex5.substring(0, 12)}`;
}


export type AuthorizedUmkmContextStatus = 
  | 'BOOTING'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'TENANT_RESOLVING'
  | 'STORE_RESOLVING'
  | 'READY'
  | 'NO_STORE'
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

export function TenantProvider({ userEmail, tenantType = 'umkm', children }: TenantProviderProps) {
  const tenant = useMemo(
    () => resolveTenantFromUser(userEmail, tenantType),
    [userEmail, tenantType]
  );

  useEffect(() => {
    setActiveTenant(tenant);
  }, [tenant]);

  const authContextValue = useMemo<AuthorizedUmkmContext>(() => {
    const orgValid = !!tenant.organizationId && tenant.organizationId !== UNRESOLVED_ORG;
    const storeValid = !!tenant.storeId && tenant.storeStatus === 'ready';
    
    let status: AuthorizedUmkmContextStatus = 'BOOTING';
    if (!userEmail) {
      status = 'AUTHENTICATING';
    } else if (!orgValid) {
      status = 'TENANT_RESOLVING';
    } else if (tenant.storeStatus === 'loading') {
      status = 'STORE_RESOLVING';
    } else if (storeValid) {
      status = 'READY';
    } else {
      status = 'NO_STORE';
    }

    return {
      status,
      userId: tenant.userId,
      userEmail: tenant.userEmail,
      organizationId: tenant.organizationId,
      workspaceId: tenant.workspaceId,
      storeId: tenant.storeId,
      store: null,
      tenantType: tenant.tenantType,
      authReady: !!userEmail,
      organizationReady: orgValid,
      storeReady: storeValid
    };
  }, [tenant, userEmail]);

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
  storeStatus: 'loading'
};

/** Called by TenantProvider to sync active tenant to service layer & Supabase REST headers */
export function setActiveTenant(tenant: TenantIds): void {
  // Monotonic state guard: Do not overwrite an existing valid UUID organizationId with empty/unresolved string
  if ((!tenant.organizationId || tenant.organizationId === UNRESOLVED_ORG) && 
      _activeTenant.organizationId && _activeTenant.organizationId !== UNRESOLVED_ORG) {
    _activeTenant = {
      ...tenant,
      organizationId: _activeTenant.organizationId,
      workspaceId: _activeTenant.workspaceId
    };
  } else {
    _activeTenant = { ...tenant };
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
  _activeTenant = {
    ..._activeTenant,
    storeId,
    storeStatus
  };
}

/** Adopt a real (DB-sourced) organization_id into singleton tenant state + Supabase headers */
export function updateActiveTenantOrg(organizationId: string): void {
  if (!organizationId || organizationId.trim() === '') return;
  _activeTenant = {
    ..._activeTenant,
    organizationId
  };
  setSupabaseTenantHeader(organizationId);
}

/** Sync resolved workspaceId into singleton tenant state */
export function updateActiveTenantWorkspace(workspaceId: string): void {
  if (!workspaceId || workspaceId.trim() === '') return;
  _activeTenant = {
    ..._activeTenant,
    workspaceId
  };
}
