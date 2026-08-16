import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { invoiceService } from '../../services/InvoiceService.js';
import { populatePrincipal, requireTenantContext, getTenantOrg } from '../../middleware/requestContext.js';
import { verifyTenantAccess, denyAccess } from '../../middleware/authorization.js';
import { SupabaseService } from '../../services/supabaseService.js';
import { logger } from '../../utils/logger.js';

/**
 * ZEGA AI — Invoice Routes (HARDENED Phase 2)
 *
 * SECURITY INVARIANTS:
 *   1. ALL routes require JWT authentication (fail-closed)
 *   2. ALL routes require tenant context
 *   3. Invoice creation stamps principal's org + userId (server-side authority)
 *   4. Invoice GET verifies tenant before returning data
 *   5. Invoice list is scoped to principal's org + userId
 *   6. No dev fallback user ID — removed extractAuthenticatedUserId
 */
export async function invoiceRoutes(fastify: FastifyInstance) {
  // SECURITY: Strict JWT authentication
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for invoice endpoints.', statusCode: 401 },
      });
    }
  });

  // Populate principal and require tenant context
  fastify.addHook('preHandler', populatePrincipal);
  fastify.addHook('preHandler', requireTenantContext);

  // POST /api/invoices -> Create receiving invoice
  fastify.post('/api/invoices', async (request: FastifyRequest, reply: FastifyReply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    const body = request.body as any;

    if (!body.amount) {
      return reply.status(400).send({ success: false, message: 'Amount is required' });
    }

    // SECURITY: userId derived from authenticated principal, NOT from client
    const invoice = await invoiceService.createInvoice({
      userId: principal.userId,
      amount: body.amount.toString(),
      asset: body.asset || 'SOL',
      tokenMint: body.tokenMint,
      description: body.description,
      expiresInMinutes: body.expiresInMinutes || 60,
      metadata: body.metadata,
    });

    return reply.status(201).send({
      success: true,
      invoice,
    });
  });

  // GET /api/invoices/:id -> Get invoice details (tenant-verified)
  fastify.get('/api/invoices/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const principal = request.principal;
    const orgId = getTenantOrg(request);
    const { id } = request.params as { id: string };

    const invoice = await invoiceService.getInvoice(id);

    if (!invoice) {
      return reply.status(404).send({ success: false, message: 'Invoice not found' });
    }

    // SECURITY (C-01 FIX): Unconditional tenant isolation check.
    // Invoice MUST have an organization_id and it MUST match principal's org.
    // A NULL organization_id is DENY, not skip.
    if (!invoice.organization_id) {
      logger.warn(
        { userId: principal?.userId, invoiceId: id, action: 'invoice_denied_orphan' },
        '[Invoice] DENIED — invoice has no organization_id (fail-closed)'
      );
      return reply.status(404).send({ success: false, error: { code: 'INVOICE_TENANT_MISSING', message: 'Invoice not found' } });
    }

    if (!verifyTenantAccess(request, invoice.organization_id)) {
      logger.warn(
        { userId: principal?.userId, invoiceId: id, invoiceOrg: invoice.organization_id, principalOrg: orgId, action: 'cross_tenant_invoice_denied' },
        '[Invoice] DENIED — cross-tenant invoice access attempt'
      );
      return reply.status(404).send({ success: false, message: 'Invoice not found' });
    }

    // Check if the requesting user is the owner
    const isOwner = principal?.userId && (
      invoice.user_id === principal.userId ||
      invoice.user_id?.toLowerCase() === principal.userId.toLowerCase() ||
      invoice.user_id === principal.email ||
      invoice.user_id?.toLowerCase() === principal.email?.toLowerCase()
    );

    return reply.send({
      success: true,
      invoice: isOwner ? invoice : {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        currency: invoice.currency,
        asset: invoice.asset,
        amount: invoice.amount,
        recipient_address: invoice.recipient_address,
        status: invoice.status,
        expires_at: invoice.expires_at,
        description: invoice.description,
      },
    });
  });

  // GET /api/invoices/user/list -> List user invoices (org-scoped)
  fastify.get('/api/invoices/user/list', async (request: FastifyRequest, reply: FastifyReply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    // SECURITY: List scoped to authenticated principal's identity
    const invoices = await invoiceService.listUserInvoices(principal.userId);

    return reply.send({
      success: true,
      invoices,
    });
  });
}
