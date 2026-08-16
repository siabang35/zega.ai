/**
 * ZEGA AI — Standardized Wallet API Routes (`/api/wallet`) (HARDENED Phase 3)
 *
 * SECURITY INVARIANTS:
 *   1. ALL routes require JWT authentication (fail-closed)
 *   2. ALL routes require tenant context (organization_id from verified principal)
 *   3. User identity is derived ONLY from the verified JWT principal
 *   4. Client-supplied x-user-id / x-user-email headers are NEVER trusted
 *   5. No hardcoded fallback identities
 *
 * Endpoints:
 *   GET /api/wallet              - Wallet overview (address, chain, balances)
 *   GET /api/wallet/balance      - SOL balance
 *   GET /api/wallet/tokens       - SPL token balances
 *   GET /api/wallet/transactions - User transaction history
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WalletService } from '../../services/walletService.js';
import { BalanceService } from '../../services/balanceService.js';
import { TransactionHistoryService, type TransactionStatus } from '../../services/transactionHistoryService.js';
import { populatePrincipal, requireTenantContext } from '../../middleware/requestContext.js';
import { logger } from '../../utils/logger.js';

export async function apiWalletRoutes(fastify: FastifyInstance) {
  // SECURITY: Strict JWT authentication for ALL wallet routes (fail-closed)
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
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
   * Get the verified user identity from the authenticated principal.
   *
   * SECURITY: Identity is derived EXCLUSIVELY from the verified JWT principal.
   * Client headers (x-user-id, x-user-email) are NEVER trusted.
   * No hardcoded fallback identities exist.
   */
  function getPrincipalIdentity(req: FastifyRequest, reply: FastifyReply): string | null {
    const principal = req.principal;
    if (principal && (principal.email || principal.userId)) {
      return principal.email || principal.userId;
    }

    // FAIL-CLOSED: No principal = deny
    reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing or invalid access token.', statusCode: 401 },
    });
    return null;
  }

  // GET /api/wallet
  fastify.get('/api/wallet', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getPrincipalIdentity(req, reply);
      if (!userId) return;

      const walletRecord = await WalletService.ensureUserWallet(userId);
      const balances = await BalanceService.getAccountBalances(walletRecord.walletAddress);

      return reply.send({
        wallet: {
          address: walletRecord.walletAddress,
          chain: walletRecord.chain,
          privyUserId: walletRecord.privyUserId,
          walletType: walletRecord.walletType,
        },
        balances: {
          sol: balances.sol.sol.toString(),
          lamports: balances.sol.lamports.toString(),
          tokens: balances.tokens,
        },
      });
    } catch (err: any) {
      logger.error({ err: err.message }, '[ApiWalletRoutes] Error fetching wallet overview.');
      return reply.status(500).send({
        error: 'WALLET_FETCH_FAILED',
        message: err.message || 'Failed to fetch user wallet overview.',
      });
    }
  });

  // GET /api/wallet/balance
  fastify.get('/api/wallet/balance', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getPrincipalIdentity(req, reply);
      if (!userId) return;

      const walletAddress = await WalletService.getSolanaWallet(userId);
      const sol = await BalanceService.getSolBalance(walletAddress);

      return reply.send({
        walletAddress,
        sol: sol.sol.toString(),
        lamports: sol.lamports.toString(),
      });
    } catch (err: any) {
      logger.error({ err: err.message }, '[ApiWalletRoutes] Error fetching SOL balance.');
      return reply.status(500).send({
        error: 'BALANCE_FETCH_FAILED',
        message: err.message || 'Failed to fetch SOL balance.',
      });
    }
  });

  // GET /api/wallet/tokens
  fastify.get('/api/wallet/tokens', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getPrincipalIdentity(req, reply);
      if (!userId) return;

      const walletAddress = await WalletService.getSolanaWallet(userId);
      const tokens = await BalanceService.getTokenBalances(walletAddress);

      return reply.send({
        walletAddress,
        tokens,
      });
    } catch (err: any) {
      logger.error({ err: err.message }, '[ApiWalletRoutes] Error fetching SPL tokens.');
      return reply.status(500).send({
        error: 'TOKEN_FETCH_FAILED',
        message: err.message || 'Failed to fetch SPL token balances.',
      });
    }
  });

  // GET /api/wallet/transactions
  fastify.get('/api/wallet/transactions', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getPrincipalIdentity(req, reply);
      if (!userId) return;

      const query = req.query as any;

      const page = parseInt(query?.page || '1', 10);
      const limit = parseInt(query?.limit || '20', 10);
      const status = query?.status as TransactionStatus;
      const asset = query?.asset as string;
      const type = query?.type as string;

      const result = await TransactionHistoryService.listTransactions({
        userId,
        page,
        limit,
        status,
        asset,
        type,
      });

      return reply.send(result);
    } catch (err: any) {
      logger.error({ err: err.message }, '[ApiWalletRoutes] Error listing transactions.');
      return reply.status(500).send({
        error: 'TRANSACTION_LIST_FAILED',
        message: err.message || 'Failed to list transaction history.',
      });
    }
  });
}

