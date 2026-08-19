import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withdrawalService } from '../../services/WithdrawalService.js';
import { solanaTransactionService } from '../../services/solanaTransactionService.js';
import { populatePrincipal, requireTenantContext, getTenantOrg } from '../../middleware/requestContext.js';
import { logger } from '../../utils/logger.js';

/**
 * ZEGA AI — Withdrawal Routes (HARDENED Phase 2)
 *
 * SECURITY INVARIANTS:
 *   1. ALL routes require JWT authentication (fail-closed)
 *   2. ALL routes require tenant context
 *   3. userId derived from authenticated principal
 *   4. Idempotency keys tenant-scoped
 *   5. Withdrawal list scoped to authenticated user
 */
export async function withdrawalRoutes(fastify: FastifyInstance) {
  // SECURITY: Strict JWT authentication
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === 'OPTIONS') return;
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for withdrawal endpoints.', statusCode: 401 },
      });
    }
  });

  // Populate principal and require tenant context
  fastify.addHook('preHandler', populatePrincipal);
  fastify.addHook('preHandler', requireTenantContext);

  // POST /api/withdrawals -> Execute withdrawal request via Privy signing
  fastify.post('/api/withdrawals', async (request: FastifyRequest, reply: FastifyReply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    const orgId = getTenantOrg(request);
    const rawIdempotencyKey = request.headers['idempotency-key'] as string;
    // SECURITY: Scope idempotency key to tenant to prevent cross-tenant replay
    const idempotencyKey = rawIdempotencyKey && orgId
      ? `${orgId}:${rawIdempotencyKey.trim()}`
      : rawIdempotencyKey?.trim();

    const body = request.body as any;

    if (!body.recipient || !body.amount) {
      return reply.status(400).send({
        success: false,
        message: 'Recipient address and amount are required',
      });
    }

    try {
      // SECURITY: userId from authenticated principal, NOT client
      const withdrawal = await withdrawalService.executeWithdrawal({
        userId: principal.email || principal.userId,
        recipient: body.recipient,
        amount: body.amount.toString(),
        asset: body.asset || 'SOL',
        tokenMint: body.tokenMint,
        idempotencyKey,
      });

      return reply.status(201).send({
        success: true,
        withdrawal,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message || 'Withdrawal failed',
      });
    }
  });

  // GET /api/withdrawals -> List user withdrawals (scoped to authenticated user)
  fastify.get('/api/withdrawals', async (request: FastifyRequest, reply: FastifyReply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    // SECURITY: Scoped to authenticated principal's identity
    const userId = principal.email || principal.userId;
    const withdrawals = await withdrawalService.listUserWithdrawals(userId);

    return reply.send({
      success: true,
      withdrawals,
    });
  });
}
