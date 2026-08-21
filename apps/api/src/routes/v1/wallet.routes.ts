import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { privyWalletService } from '../../services/PrivyWalletService.js';
import { balanceService } from '../../services/balanceService.js';
import { transactionHistoryService } from '../../services/transactionHistoryService.js';
import { populatePrincipal, requireTenantContext } from '../../middleware/requestContext.js';

/**
 * ZEGA AI — Wallet Routes (HARDENED Phase 2)
 *
 * SECURITY INVARIANTS:
 *   1. ALL routes require JWT authentication (fail-closed)
 *   2. ALL routes require tenant context
 *   3. userId derived from authenticated principal — NOT from headers
 *   4. No dev fallback identity
 */
export async function walletRoutes(fastify: FastifyInstance) {
  // SECURITY: Strict JWT authentication
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === 'OPTIONS') return;
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for wallet endpoints.', statusCode: 401 },
      });
    }
  });

  // Populate principal and require tenant context
  fastify.addHook('preHandler', populatePrincipal);
  fastify.addHook('preHandler', requireTenantContext);

  /**
   * SECURITY: Derive user identity from authenticated principal only.
   */
  function getAuthenticatedUserId(request: FastifyRequest, reply: FastifyReply): string | null {
    const principal = request.principal;
    // SECURITY (S-05 FIX): Use principal.userId (canonical UUID), never email
    if (principal && principal.userId) {
      return principal.userId;
    }

    reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing or invalid access token.', statusCode: 401 },
    });
    return null;
  }

  // GET /api/wallet -> Overview & main wallet metadata
  fastify.get('/api/wallet', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = getAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const wallet = await privyWalletService.ensureUserSolanaWallet(rawUserId);
    const balances = await balanceService.getBalances(wallet.wallet_address);

    return reply.send({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.wallet_address,
        chain: wallet.chain,
        privyUserId: wallet.privy_user_id,
        walletType: wallet.wallet_type,
        status: wallet.status,
      },
      balances,
    });
  });

  // GET /api/wallet/balance -> Native SOL balance
  fastify.get('/api/wallet/balance', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = getAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const wallet = await privyWalletService.ensureUserSolanaWallet(rawUserId);
    const solBalance = await balanceService.getSolBalance(wallet.wallet_address);

    return reply.send({
      success: true,
      address: wallet.wallet_address,
      sol: solBalance,
    });
  });

  // GET /api/wallet/tokens -> SPL token balances
  fastify.get('/api/wallet/tokens', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = getAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const wallet = await privyWalletService.ensureUserSolanaWallet(rawUserId);
    const balances = await balanceService.getBalances(wallet.wallet_address);

    return reply.send({
      success: true,
      address: wallet.wallet_address,
      tokens: balances.tokens,
    });
  });

  // GET /api/wallet/transactions -> User transaction history
  fastify.get('/api/wallet/transactions', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = getAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const limit = parseInt((request.query as any)?.limit || '20', 10);
    const transactions = await transactionHistoryService.getUserTransactions(rawUserId, limit);

    return reply.send({
      success: true,
      transactions,
    });
  });
}
