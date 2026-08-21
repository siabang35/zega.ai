import { SupabaseService } from './supabaseService.js';
import crypto from 'node:crypto';

export interface CanonicalAuthContext {
  authUserId: string;
  email?: string;
}

export interface ResolvedCanonicalUser {
  appUserId: string;
  authUserId: string;
  email: string;
  status: string;
}

export interface ResolvedTenantGraph {
  storeId: string;
  organizationId: string;
  workspaceId: string;
}

export class IdentityResolverError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 401) {
    super(message);
    this.name = 'IdentityResolverError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function isValidUuid(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
}

/**
 * RESOLVE CANONICAL APPLICATION USER
 * Canonical Identity Chain:
 * External Auth Identity (JWT sub) -> auth_user_id -> public.users.auth_user_id -> public.users.id (app_user_id)
 *
 * For coacole9:
 * auth_user_id: 943863c0-1587-4193-9e56-c016562f7add
 * app_user_id:  04a2920e-7a52-4f2f-a4a4-347e77ae2023
 */
export async function resolveCanonicalApplicationUser(
  authContext: CanonicalAuthContext
): Promise<ResolvedCanonicalUser> {
  const { authUserId, email } = authContext;

  if (!authUserId || (!isValidUuid(authUserId) && !authUserId.trim())) {
    throw new IdentityResolverError(
      'AUTHENTICATION_REQUIRED',
      'Valid authentication context (auth_user_id) required',
      401
    );
  }

  const supabase = SupabaseService.getClient();
  if (!supabase) {
    throw new IdentityResolverError(
      'SERVICE_UNAVAILABLE',
      'Database service is currently unavailable',
      503
    );
  }

  const cleanEmail = email ? email.trim().toLowerCase() : '';

  // 1. Primary Hot Path: Lookup public.users by auth_user_id (Indexed)
  if (isValidUuid(authUserId)) {
    const { data: userByAuth } = await supabase
      .from('users')
      .select('id, auth_user_id, email, status')
      .eq('auth_user_id', authUserId)
      .limit(1);

    if (userByAuth && userByAuth.length > 0 && userByAuth[0]?.id) {
      const u = userByAuth[0];
      if (u.status === 'disabled') {
        throw new IdentityResolverError(
          'USER_NOT_AUTHORIZED',
          'Application user account is disabled',
          403
        );
      }
      return {
        appUserId: u.id,
        authUserId: u.auth_user_id || authUserId,
        email: u.email || cleanEmail,
        status: u.status || 'active',
      };
    }
  }

  // 2. Direct Lookup Path: Check if authUserId IS already a public.users.id
  if (isValidUuid(authUserId)) {
    const { data: userById } = await supabase
      .from('users')
      .select('id, auth_user_id, email, status')
      .eq('id', authUserId)
      .limit(1);

    if (userById && userById.length > 0 && userById[0]?.id) {
      const u = userById[0];
      if (u.status === 'disabled') {
        throw new IdentityResolverError(
          'USER_NOT_AUTHORIZED',
          'Application user account is disabled',
          403
        );
      }
      return {
        appUserId: u.id,
        authUserId: u.auth_user_id || authUserId,
        email: u.email || cleanEmail,
        status: u.status || 'active',
      };
    }
  }

  // 3. Email Reconciliation Path (Deterministic 1:1 legacy user reconciliation)
  if (cleanEmail) {
    const { data: userByEmail } = await supabase
      .from('users')
      .select('id, auth_user_id, email, status')
      .ilike('email', cleanEmail)
      .limit(2);

    if (userByEmail && userByEmail.length === 1 && userByEmail[0]?.id) {
      const u = userByEmail[0];
      // Link auth_user_id if not linked yet
      if (!u.auth_user_id && isValidUuid(authUserId)) {
        try {
          await supabase
            .from('users')
            .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
            .eq('id', u.id);
        } catch (err) {
          console.warn('[IDENTITY_RESOLVER] Link auth_user_id notice:', err);
        }
      }

      if (u.status === 'disabled') {
        throw new IdentityResolverError(
          'USER_NOT_AUTHORIZED',
          'Application user account is disabled',
          403
        );
      }

      return {
        appUserId: u.id,
        authUserId: u.auth_user_id || authUserId,
        email: u.email || cleanEmail,
        status: u.status || 'active',
      };
    }
  }

  // 4. Auto-Provisioning Path: Brand new user registration
  if (cleanEmail || isValidUuid(authUserId)) {
    try {
      const newAppUserId = crypto.randomUUID();
      const insertPayload: any = {
        id: newAppUserId,
        email: cleanEmail || `user_${Date.now()}@zegaai.site`,
        full_name: cleanEmail ? cleanEmail.split('@')[0] : 'ZEGA User',
        role: 'individual',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isValidUuid(authUserId)) {
        insertPayload.auth_user_id = authUserId;
      }

      const { data: insertedUser, error: insertErr } = await supabase
        .from('users')
        .insert(insertPayload)
        .select('id, auth_user_id, email, status')
        .maybeSingle();

      if (insertedUser?.id) {
        return {
          appUserId: insertedUser.id,
          authUserId: insertedUser.auth_user_id || authUserId,
          email: insertedUser.email || cleanEmail,
          status: insertedUser.status || 'active',
        };
      }
    } catch (err) {
      console.warn('[IDENTITY_RESOLVER] Exception during auto-provisioning:', err);
    }
  }

  throw new IdentityResolverError(
    'APPLICATION_USER_NOT_FOUND',
    'Valid application user profile could not be resolved or created for given session',
    401
  );
}

/**
 * RESOLVE SERVER-SIDE TENANT GRAPH
 * Strict Server-Side Tenant Resolution:
 * app_user_id -> organization_members -> organization_id -> umkm_stores -> store_id & workspace_id
 *
 * For coacole9 expected:
 * app_user_id:    04a2920e-7a52-4f2f-a4a4-347e77ae2023
 * organization:   6b3d5e83-5d18-4c6d-a9c7-5688de0999d0
 * workspace:      899a542a-cb1a-4908-9795-d63e7e703466
 * store:          67b89f6f-c940-4a0b-b705-8e3e08cf1d80
 */
export async function resolveServerSideTenantGraph(
  appUserId: string,
  email?: string,
  requestedStoreId?: string
): Promise<ResolvedTenantGraph> {
  if (!appUserId || !isValidUuid(appUserId)) {
    throw new IdentityResolverError(
      'INVALID_AUTHENTICATION',
      'Valid canonical app_user_id required for tenant resolution',
      401
    );
  }

  const supabase = SupabaseService.getClient();
  if (!supabase) {
    throw new IdentityResolverError(
      'SERVICE_UNAVAILABLE',
      'Database service is currently unavailable',
      503
    );
  }

  // 1. Cross-Tenant Security Check if client requested a specific store_id
  if (requestedStoreId && isValidUuid(requestedStoreId)) {
    const { data: requestedStore } = await supabase
      .from('umkm_stores')
      .select('id, organization_id, workspace_id, user_id')
      .eq('id', requestedStoreId)
      .maybeSingle();

    if (requestedStore) {
      // Verify caller is the store user OR belongs to the store's organization
      let isOwnerOrMember = requestedStore.user_id === appUserId;

      if (!isOwnerOrMember && requestedStore.organization_id) {
        const { data: memberCheck } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', requestedStore.organization_id)
          .eq('user_id', appUserId)
          .eq('status', 'active')
          .limit(1);

        if (memberCheck && memberCheck.length > 0) {
          isOwnerOrMember = true;
        }
      }

      if (isOwnerOrMember) {
        return {
          storeId: requestedStore.id,
          organizationId: requestedStore.organization_id || '',
          workspaceId: requestedStore.workspace_id || '',
        };
      } else {
        // Client attempted to access another user's store! REJECT!
        throw new IdentityResolverError(
          'TENANT_ACCESS_DENIED',
          'Access denied to requested store context. Multi-tenant boundary violation.',
          403
        );
      }
    }
  }

  // 2. Server-side authoritative lookup by app_user_id in umkm_stores
  const { data: stores } = await supabase
    .from('umkm_stores')
    .select('id, organization_id, workspace_id')
    .eq('user_id', appUserId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (stores && stores.length > 0 && stores[0]?.id) {
    let orgId = stores[0].organization_id || '';
    let wsId = stores[0].workspace_id || '';

    // If orgId or wsId are missing, repair via organization_members
    if (!orgId) {
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', appUserId)
        .eq('status', 'active')
        .limit(1);
      if (memberships && memberships.length > 0) {
        orgId = memberships[0].organization_id;
      }
    }

    return {
      storeId: stores[0].id,
      organizationId: orgId,
      workspaceId: wsId,
    };
  }

  // 3. Lookup via organization_members for appUserId
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', appUserId)
    .eq('status', 'active')
    .limit(1);

  if (memberships && memberships.length > 0 && memberships[0]?.organization_id) {
    const orgId = memberships[0].organization_id;
    const { data: orgStores } = await supabase
      .from('umkm_stores')
      .select('id, organization_id, workspace_id')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (orgStores && orgStores.length > 0 && orgStores[0]?.id) {
      return {
        storeId: orgStores[0].id,
        organizationId: orgId,
        workspaceId: orgStores[0].workspace_id || '',
      };
    }
  }

  // 4. Dynamic Auto-Provisioning for New User Tenant Graph
  try {
    const orgId = crypto.randomUUID();
    const wsId = crypto.randomUUID();
    const storeId = crypto.randomUUID();
    const storeName = email ? `${email.split('@')[0]}'s Store` : 'Toko UMKM Starter';

    // Insert Organization
    await supabase.from('organizations').insert({
      id: orgId,
      name: `${storeName} Organization`,
      slug: `org-${appUserId.substring(0, 8)}-${Date.now().toString(36)}`,
      type: 'umkm',
    });

    // Insert Member
    await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: appUserId,
      role: 'owner',
      status: 'active',
    });

    // Insert Workspace
    await supabase.from('workspaces').insert({
      id: wsId,
      organization_id: orgId,
      name: `${storeName} Workspace`,
      slug: `ws-${appUserId.substring(0, 8)}`,
      status: 'active',
    });

    // Insert Store
    await supabase.from('umkm_stores').insert({
      id: storeId,
      organization_id: orgId,
      workspace_id: wsId,
      user_id: appUserId,
      store_name: storeName,
      category: 'General',
      is_active: true,
    });

    return {
      storeId,
      organizationId: orgId,
      workspaceId: wsId,
    };
  } catch (err) {
    console.error('[TENANT_RESOLVER] Auto-provisioning tenant exception:', err);
  }

  throw new IdentityResolverError(
    'STORE_NOT_FOUND',
    'Failed to resolve or provision store tenant graph for user',
    404
  );
}
