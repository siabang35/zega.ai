import 'fastify';

/**
 * ZEGA AI — Fastify Type Augmentation
 *
 * Extends Fastify's built-in types to support ZEGA's enterprise
 * authorization, tenant context, and request-scoped principal model.
 *
 * Design Principle (Section 0.3 — Server Authority):
 *   Principal identity, organization, role, and permissions are derived
 *   server-side from JWT claims and database lookups. Client input is
 *   untrusted and is never the source of truth for authorization.
 */

/** Authenticated principal identity extracted from verified JWT */
export interface ZegaPrincipal {
  /** User ID (UUID from profiles table / JWT sub claim) */
  userId: string;
  /** User email (from JWT claims) */
  email: string;
  /** User role (server-derived, never from client) */
  role: 'individual' | 'umkm' | 'enterprise' | 'superadmin';
  /** Organization ID the user is acting within (if multi-tenant context) */
  organizationId?: string;
  /** Organization role within that org (if org-scoped) */
  orgRole?: 'owner' | 'admin' | 'member' | 'billing_contact';
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    /** Server-derived principal context — populated after authentication.
     *  Contains the canonical identity, role, and tenant scope for
     *  authorization decisions. NEVER derived from request body. */
    principal?: ZegaPrincipal;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      role?: string;
      organizationId?: string;
      orgRole?: string;
      iat?: number;
      exp?: number;
    };
    user: {
      sub: string;
      email: string;
      role?: string;
      organizationId?: string;
      orgRole?: string;
    };
  }
}
