import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { privyWalletService } from '../../services/PrivyWalletService.js';
import { balanceService } from '../../services/balanceService.js';
import { transactionHistoryService } from '../../services/transactionHistoryService.js';
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

export async function walletRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      // Allow hook to continue if in dev/test fallback mode; extractAuthenticatedUserId handles fail-closed in prod
    }
    await populatePrincipal(request, reply);
  });

  // GET /api/wallet -> Overview & main wallet metadata
  fastify.get('/api/wallet', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = extractAuthenticatedUserId(request, reply);
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
    const rawUserId = extractAuthenticatedUserId(request, reply);
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
    const rawUserId = extractAuthenticatedUserId(request, reply);
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
    const rawUserId = extractAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const limit = parseInt((request.query as any)?.limit || '20', 10);
    const transactions = await transactionHistoryService.getUserTransactions(rawUserId, limit);

    return reply.send({
      success: true,
      transactions,
    });
  });
}

