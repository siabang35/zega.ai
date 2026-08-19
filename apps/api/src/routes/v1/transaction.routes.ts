/**
 * ZEGA AI — Standardized Transaction API Routes (HARDENED Phase 2)
 *
 * Endpoints:
 *   POST /api/transactions/transfer       - SOL Transfer
 *   POST /api/transactions/token-transfer - SPL Token Transfer
 *   GET  /api/transactions/estimate       - Fee Estimation & Sufficiency Check
 *   POST /api/transactions/preview        - Transaction Breakdown Preview
 *   POST /api/transactions                - Generic Transaction Execution
 *   GET  /api/transactions/:id            - Query Transaction by ID
 *   GET  /api/transactions/signature/:sig - Query Transaction by Signature
 *   GET  /api/transactions                - Paginated Transaction History
 *
 * SECURITY INVARIANTS:
 *   1. ALL routes require JWT authentication (fail-closed)
 *   2. ALL routes require tenant context (organization_id from verified principal)
 *   3. userId derived from authenticated principal — NOT from headers/body/query
 *   4. Transaction history scoped to authenticated user
 *   5. Idempotency keys are tenant-scoped
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WalletService } from '../../services/walletService.js';
import { SolanaTransactionService } from '../../services/solanaTransactionService.js';
import { TransactionEngine } from '../../services/transactionEngine.js';
import { TransactionHistoryService, type TransactionStatus } from '../../services/transactionHistoryService.js';
import { populatePrincipal, requireTenantContext, getTenantOrg } from '../../middleware/requestContext.js';
import { logger } from '../../utils/logger.js';

export async function transactionRoutes(fastify: FastifyInstance) {
  // SECURITY: Strict JWT authentication for ALL transaction routes
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.method === 'OPTIONS') return;
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for transaction endpoints.', statusCode: 401 },
      });
    }
  });

  // Populate principal and require tenant context
  fastify.addHook('preHandler', populatePrincipal);
  fastify.addHook('preHandler', requireTenantContext);

  /**
   * SECURITY: Derive user identity from authenticated principal.
   * NEVER trust client-supplied userId from headers, body, or query.
   */
  function getAuthenticatedUserId(request: FastifyRequest): string {
    const principal = request.principal;
    return principal?.email || principal?.userId || '';
  }

  function getTenantScopedIdempotencyKey(request: FastifyRequest): string | undefined {
    const headerKey = (request.headers['idempotency-key'] as string)?.trim();
    const bodyKey = (request.body as any)?.idempotencyKey?.trim();
    const rawKey = headerKey || bodyKey;
    if (!rawKey) return undefined;

    // SECURITY: Scope idempotency key to tenant org to prevent cross-tenant replay
    const orgId = getTenantOrg(request);
    return orgId ? `${orgId}:${rawKey}` : rawKey;
  }

  // POST /api/transactions/transfer (SOL)
  fastify.post('/api/transactions/transfer', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const idempotencyKey = getTenantScopedIdempotencyKey(req);
      const { recipient, amount } = req.body as { recipient: string; amount: string };

      if (!recipient || !amount) {
        return reply.status(400).send({
          error: 'INVALID_INPUT',
          message: 'Both "recipient" and "amount" are required.',
        });
      }

      const result = await TransactionEngine.executeTransaction({
        userId,
        recipient,
        amount,
        asset: 'SOL',
        idempotencyKey,
      });

      return reply.send(result);
    } catch (err: any) {
      const statusCode = err.code === 'INSUFFICIENT_FUNDS' ? 400 : err.code === 'CONCURRENCY_LOCK' ? 409 : 500;
      return reply.status(statusCode).send({
        error: err.code || 'TRANSACTION_EXECUTION_FAILED',
        message: err.message || 'Failed to execute SOL transfer.',
      });
    }
  });

  // POST /api/transactions/token-transfer (SPL)
  fastify.post('/api/transactions/token-transfer', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const idempotencyKey = getTenantScopedIdempotencyKey(req);
      const { mint, recipient, amount } = req.body as { mint?: string; recipient: string; amount: string };

      if (!recipient || !amount) {
        return reply.status(400).send({
          error: 'INVALID_INPUT',
          message: 'Both "recipient" and "amount" are required.',
        });
      }

      const result = await TransactionEngine.executeTransaction({
        userId,
        recipient,
        amount,
        asset: 'USDC',
        mint,
        idempotencyKey,
      });

      return reply.send(result);
    } catch (err: any) {
      const statusCode = err.code === 'INSUFFICIENT_FUNDS' ? 400 : err.code === 'CONCURRENCY_LOCK' ? 409 : 500;
      return reply.status(statusCode).send({
        error: err.code || 'TRANSACTION_EXECUTION_FAILED',
        message: err.message || 'Failed to execute SPL token transfer.',
      });
    }
  });

  // GET /api/transactions/estimate
  fastify.get('/api/transactions/estimate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const query = req.query as any;
      const { recipient, amount, asset = 'SOL', mint } = query;

      if (!recipient || !amount) {
        return reply.status(400).send({
          error: 'INVALID_INPUT',
          message: 'Both "recipient" and "amount" parameters are required.',
        });
      }

      const walletAddress = await WalletService.getSolanaWallet(userId);
      const estimate = await SolanaTransactionService.estimateFees(
        walletAddress,
        recipient,
        amount,
        asset,
        mint
      );

      return reply.send({
        networkFee: estimate.networkFeeSol.toString(),
        rent: estimate.rentExemptSol.toString(),
        totalRequired: estimate.totalRequiredSol.toString(),
        availableBalance: estimate.availableSol.toString(),
        sufficient: estimate.sufficient,
        requiresAtaCreation: estimate.requiresAtaCreation,
      });
    } catch (err: any) {
      return reply.status(500).send({
        error: 'FEE_ESTIMATION_FAILED',
        message: err.message || 'Failed to estimate transaction fees.',
      });
    }
  });

  // POST /api/transactions/preview
  fastify.post('/api/transactions/preview', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { recipient, amount, asset = 'SOL', mint } = req.body as any;

      if (!recipient || !amount) {
        return reply.status(400).send({
          error: 'INVALID_INPUT',
          message: 'Both "recipient" and "amount" are required.',
        });
      }

      const walletAddress = await WalletService.getSolanaWallet(userId);
      const preview = await SolanaTransactionService.previewTransaction({
        sender: walletAddress,
        recipient,
        amount,
        asset,
        mint,
      });

      return reply.send(preview);
    } catch (err: any) {
      return reply.status(500).send({
        error: 'PREVIEW_FAILED',
        message: err.message || 'Failed to generate transaction preview.',
      });
    }
  });

  // POST /api/transactions (Generic execution)
  fastify.post('/api/transactions', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const idempotencyKey = getTenantScopedIdempotencyKey(req);
      const body = req.body as any;

      const { recipient, amount, asset = 'SOL', mint } = body;

      if (!recipient || !amount) {
        return reply.status(400).send({
          error: 'INVALID_INPUT',
          message: 'Both "recipient" and "amount" are required.',
        });
      }

      const result = await TransactionEngine.executeTransaction({
        userId,
        recipient,
        amount,
        asset,
        mint,
        idempotencyKey,
      });

      return reply.send(result);
    } catch (err: any) {
      const statusCode = err.code === 'INSUFFICIENT_FUNDS' ? 400 : err.code === 'CONCURRENCY_LOCK' ? 409 : 500;
      return reply.status(statusCode).send({
        error: err.code || 'TRANSACTION_EXECUTION_FAILED',
        message: err.message || 'Failed to execute transaction.',
      });
    }
  });

  // GET /api/transactions/:id
  fastify.get('/api/transactions/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params as { id: string };

      // SECURITY: Scoped to authenticated user's transactions
      const record = await TransactionHistoryService.getTransactionById(id, userId);
      if (!record) {
        return reply.status(404).send({
          error: 'TRANSACTION_NOT_FOUND',
          message: `Transaction with ID "${id}" was not found.`,
        });
      }

      return reply.send(record);
    } catch (err: any) {
      return reply.status(500).send({
        error: 'FETCH_TRANSACTION_FAILED',
        message: err.message || 'Failed to fetch transaction details.',
      });
    }
  });

  // GET /api/transactions/signature/:signature
  fastify.get('/api/transactions/signature/:signature', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { signature } = req.params as { signature: string };

      const record = await TransactionHistoryService.getTransactionBySignature(signature);
      if (!record) {
        return reply.status(404).send({
          error: 'TRANSACTION_NOT_FOUND',
          message: `Transaction with signature "${signature}" was not found.`,
        });
      }

      return reply.send(record);
    } catch (err: any) {
      return reply.status(500).send({
        error: 'FETCH_TRANSACTION_FAILED',
        message: err.message || 'Failed to fetch transaction by signature.',
      });
    }
  });

  // GET /api/transactions (Paginated list)
  fastify.get('/api/transactions', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const query = req.query as any;

      const page = parseInt(query?.page || '1', 10);
      const limit = parseInt(query?.limit || '20', 10);
      const status = query?.status as TransactionStatus;
      const asset = query?.asset as string;
      const type = query?.type as string;

      // SECURITY: Scoped to authenticated user
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
      return reply.status(500).send({
        error: 'LIST_TRANSACTIONS_FAILED',
        message: err.message || 'Failed to list transactions.',
      });
    }
  });
}
