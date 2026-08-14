/**
 * ZEGA AI — Standardized Transaction API Routes (`/api/transactions`)
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
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WalletService } from '../../services/walletService.js';
import { SolanaTransactionService } from '../../services/solanaTransactionService.js';
import { TransactionEngine } from '../../services/transactionEngine.js';
import { TransactionHistoryService, type TransactionStatus } from '../../services/transactionHistoryService.js';
import { logger } from '../../utils/logger.js';

export async function transactionRoutes(fastify: FastifyInstance) {
  function getUserIdentity(req: FastifyRequest): string {
    const headerUserId = req.headers['x-user-id'] as string;
    const headerEmail = req.headers['x-user-email'] as string;
    const bodyUser = (req.body as any)?.userId;
    const queryUser = (req.query as any)?.userId || (req.query as any)?.email;

    const user = headerUserId || headerEmail || bodyUser || queryUser || 'user@zegaai.site';
    return user.trim();
  }

  function getIdempotencyKey(req: FastifyRequest): string | undefined {
    const headerKey = req.headers['idempotency-key'] as string;
    const bodyKey = (req.body as any)?.idempotencyKey;
    return (headerKey || bodyKey)?.trim();
  }

  // POST /api/transactions/transfer (SOL)
  fastify.post('/api/transactions/transfer', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = getUserIdentity(req);
      const idempotencyKey = getIdempotencyKey(req);
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
      const userId = getUserIdentity(req);
      const idempotencyKey = getIdempotencyKey(req);
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
      const userId = getUserIdentity(req);
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
      const userId = getUserIdentity(req);
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
      const userId = getUserIdentity(req);
      const idempotencyKey = getIdempotencyKey(req);
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
      const userId = getUserIdentity(req);
      const { id } = req.params as { id: string };

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
      const userId = getUserIdentity(req);
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
      return reply.status(500).send({
        error: 'LIST_TRANSACTIONS_FAILED',
        message: err.message || 'Failed to list transactions.',
      });
    }
  });
}
