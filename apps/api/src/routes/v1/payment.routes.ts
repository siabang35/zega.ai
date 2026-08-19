import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { paymentDetectionService } from '../../services/PaymentDetectionService.js';
import { webhookService } from '../../services/webhookService.js';
import { populatePrincipal, requireTenantContext, getTenantOrg } from '../../middleware/requestContext.js';
import { verifyTenantAccess, denyAccess } from '../../middleware/authorization.js';
import { SupabaseService } from '../../services/supabaseService.js';
import { logger } from '../../utils/logger.js';

/**
 * ZEGA AI — Payment Routes (HARDENED Phase 2)
 *
 * SECURITY INVARIANTS:
 *   1. ALL routes require JWT authentication (fail-closed)
 *   2. ALL routes require tenant context (organization_id from verified principal)
 *   3. Invoice ownership verified server-side before payment processing
 *   4. Client-supplied invoiceId is resolved and tenant-checked
 */
export async function paymentRoutes(fastify: FastifyInstance) {
  // SECURITY: Strict JWT authentication for ALL payment routes
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === 'OPTIONS') return;
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for payment endpoints.', statusCode: 401 },
      });
    }
  });

  // Populate principal and require tenant context
  fastify.addHook('preHandler', populatePrincipal);
  fastify.addHook('preHandler', requireTenantContext);

  // POST /api/payments/verify -> Verify blockchain transaction signature & process payment
  fastify.post('/api/payments/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const principal = request.principal;
    const orgId = getTenantOrg(request);

    if (!body.signature) {
      return reply.status(400).send({ success: false, message: 'Signature is required' });
    }

    // SECURITY: If invoiceId is provided, verify it belongs to principal's org
    if (body.invoiceId) {
      const supabase = SupabaseService.getClient();
      if (supabase) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, organization_id, user_id')
          .eq('id', body.invoiceId)
          .maybeSingle();

        if (!invoice) {
          return reply.status(404).send({ success: false, message: 'Invoice not found' });
        }

        // SECURITY (F-03 FIX): Unconditional tenant isolation check.
        // Invoice MUST have an organization_id and it MUST match principal's org.
        // A NULL organization_id is DENY, not skip.
        if (!invoice.organization_id) {
          logger.warn(
            { userId: principal?.userId, invoiceId: body.invoiceId, action: 'payment_denied_orphan_invoice' },
            '[Payment] DENIED — invoice has no organization_id (fail-closed)'
          );
          return denyAccess(reply, 'PAYMENT_TENANT_MISSING', 'Invoice has no organization context. Payment denied.');
        }

        if (!verifyTenantAccess(request, invoice.organization_id)) {
          logger.warn(
            { userId: principal?.userId, invoiceOrg: invoice.organization_id, principalOrg: orgId, action: 'cross_tenant_payment_denied' },
            '[Payment] DENIED — cross-tenant payment verification attempt'
          );
          return denyAccess(reply, 'PAYMENT_TENANT_MISMATCH', 'Invoice does not belong to your organization.');
        }
      }
    }

    try {
      const payment = await paymentDetectionService.verifyAndProcessPayment({
        signature: body.signature,
        invoiceId: body.invoiceId,
      });

      return reply.send({
        success: true,
        payment,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message || 'Payment verification failed',
      });
    }
  });
}
