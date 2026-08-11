import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withdrawalService } from '../../services/WithdrawalService.js';
import { solanaTransactionService } from '../../services/solanaTransactionService.js';
import { populatePrincipal } from '../../middleware/requestContext.js';
import { envConfig } from '../../config/env.js';

function extractAuthenticatedUserId(request: FastifyRequest, reply: FastifyReply): string | null {
  const principal = request.principal;
  if (principal && (principal.email || principal.userId)) {
    return principal.email || principal.userId;
  }

  const jwtUser = request.user;
  if (jwtUser && (jwtUser.email || jwtUser.sub)) {
    return jwtUser.email || jwtUser.sub;
  }

  // Fallback ONLY in non-production for local/integration testing
  const isDev = process.env.NODE_ENV !== 'production' && envConfig.NODE_ENV !== 'production';
  const headerUserId = request.headers['x-user-id'] as string;
  const headerEmail = request.headers['x-user-email'] as string;

  if (isDev && (headerUserId || headerEmail)) {
    return (headerUserId || headerEmail).trim();
  }

  if (isDev) {
    return 'user@zegaai.site';
  }

  reply.status(401).send({
    success: false,
    error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing or invalid access token.', statusCode: 401 },
  });
  return null;
}

export async function withdrawalRoutes(fastify: FastifyInstance) {
  // Add onRequest JWT check attempt & populatePrincipal middleware
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      // Allow hook to continue if in dev/test fallback mode; extractAuthenticatedUserId handles fail-closed in prod
    }
    await populatePrincipal(request, reply);
  });

  // POST /api/withdrawals -> Execute withdrawal request via Privy signing
  fastify.post('/api/withdrawals', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = extractAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const idempotencyKey = request.headers['idempotency-key'] as string;
    const body = request.body as any;

    if (!body.recipient || !body.amount) {
      return reply.status(400).send({
        success: false,
        message: 'Recipient address and amount are required',
      });
    }

    try {
      const withdrawal = await withdrawalService.executeWithdrawal({
        userId: rawUserId,
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

  // GET /api/withdrawals -> List user withdrawals
  fastify.get('/api/withdrawals', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = extractAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const withdrawals = await withdrawalService.listUserWithdrawals(rawUserId);

    return reply.send({
      success: true,
      withdrawals,
    });
  });
}

