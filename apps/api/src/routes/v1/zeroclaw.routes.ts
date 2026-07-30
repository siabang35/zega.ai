import type { FastifyPluginAsync } from 'fastify';

interface ZeroClawEventBody {
  eventType: 'payment_reconciled' | 'refund_requested' | 'agent_heartbeat' | 'checkpoint_update';
  network?: string;
  referenceKey?: string;
  amount?: number;
  currency?: string;
  signature?: string;
  customerChannel?: string;
  checkpointId?: string;
  prompt?: string;
  details?: Record<string, unknown>;
}

const DEVNET_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

let zeroClawState = {
  agentStatus: 'active',
  custodyTier: 'T1 (Keyless / Unsigned)',
  network: 'solana-devnet',
  rpcUrl: DEVNET_RPC_URL,
  connectedChannels: ['WhatsApp (+628123456789)', 'Telegram Bot', 'ZEGA Monorepo MCP'],
  totalReconciledUsdc: 485.50,
  reconciledTxCount: 24,
  lastHeartbeat: new Date().toISOString(),
};

interface PendingCheckpoint {
  checkpointId: string;
  timestamp: string;
  customerChannel: string;
  amountUsdc: number;
  recipientAddress: string;
  prompt: string;
  status: 'pending' | 'approved' | 'rejected';
  injectionFlagged: boolean;
}

const pendingCheckpoints: PendingCheckpoint[] = [
  {
    checkpointId: 'chk_ref_9901',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    customerChannel: 'WhatsApp (+628198765432)',
    amountUsdc: 25.00,
    recipientAddress: 'AttackerSolanaPublicKey1111111111111111111',
    prompt: 'Prompt Injection Warning: Customer message requested instant refund of 25 USDC claiming item was damaged.',
    status: 'pending',
    injectionFlagged: true,
  }
];

const reconciledEvents: Array<{
  id: string;
  signature: string;
  amount: number;
  currency: string;
  timestamp: string;
  channel: string;
  network: string;
  slot?: number;
}> = [
  {
    id: 'tx_rec_001',
    signature: '5K2bM7xP9q8Z1a3N8xY2wLzR4w9M3k',
    amount: 15.00,
    currency: 'USDC',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    channel: 'WhatsApp (+628123456789)',
    network: 'solana-devnet',
    slot: 480000100,
  },
];

export const zeroclawRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /v1/zeroclaw/status ──
  fastify.get('/status', async () => {
    return {
      success: true,
      data: {
        state: zeroClawState,
        pendingCheckpoints,
        recentReconciledEvents: reconciledEvents.slice(0, 10),
      },
    };
  });

  // ── GET /v1/zeroclaw/solana-rpc ── Query REAL Solana Devnet RPC Live!
  fastify.get<{ Querystring: { address?: string } }>('/solana-rpc', async (request, reply) => {
    const address = request.query.address || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Default Devnet USDC Mint

    try {
      // Query 1: getAccountInfo
      const accountRes = await fetch(DEVNET_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [address, { encoding: 'jsonParsed' }],
        }),
      });
      const accountJson = (await accountRes.json()) as any;

      // Query 2: getSignaturesForAddress
      const sigRes = await fetch(DEVNET_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'getSignaturesForAddress',
          params: [address, { limit: 5, commitment: 'confirmed' }],
        }),
      });
      const sigJson = (await sigRes.json()) as any;

      return reply.send({
        success: true,
        network: 'solana-devnet',
        rpcUrl: DEVNET_RPC_URL,
        address,
        accountInfo: accountJson.result || null,
        signatures: sigJson.result || [],
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: 'Failed to query Solana Devnet RPC',
        details: err.message,
      });
    }
  });

  // ── POST /v1/zeroclaw/events ──
  fastify.post<{ Body: ZeroClawEventBody }>('/events', async (request, reply) => {
    const body = request.body || {};
    const { eventType, amount, currency, signature, customerChannel, checkpointId, prompt, details } = body;

    zeroClawState.lastHeartbeat = new Date().toISOString();

    if (eventType === 'payment_reconciled') {
      const parsedAmount = amount || 0;
      zeroClawState.totalReconciledUsdc += parsedAmount;
      zeroClawState.reconciledTxCount += 1;

      const event = {
        id: `tx_rec_${Date.now()}`,
        signature: signature || `sig_${Math.random().toString(36).substring(7)}`,
        amount: parsedAmount,
        currency: currency || 'USDC',
        timestamp: new Date().toISOString(),
        channel: customerChannel || 'WhatsApp',
        network: zeroClawState.network,
        slot: (details?.slot as number) || 480000650,
      };
      reconciledEvents.unshift(event);

      fastify.log.info({ event }, 'ZeroClaw payment reconciled on Solana Devnet');
      return reply.send({ success: true, message: 'Payment reconciled successfully', event });
    }

    if (eventType === 'refund_requested' || eventType === 'checkpoint_update') {
      const newCheckpoint: PendingCheckpoint = {
        checkpointId: checkpointId || `chk_${Date.now()}`,
        timestamp: new Date().toISOString(),
        customerChannel: customerChannel || 'WhatsApp',
        amountUsdc: amount || 0,
        recipientAddress: (details?.recipientAddress as string) || 'UnknownAddress',
        prompt: prompt || 'Refund request requiring human owner approval.',
        status: 'pending',
        injectionFlagged: true,
      };
      pendingCheckpoints.unshift(newCheckpoint);

      return reply.send({ success: true, message: 'Refund approval checkpoint logged', checkpoint: newCheckpoint });
    }

    return reply.send({ success: true, message: 'ZeroClaw event received' });
  });

  // ── POST /v1/zeroclaw/approve-checkpoint ──
  fastify.post<{ Body: { checkpointId: string; decision: 'approve' | 'reject' } }>(
    '/approve-checkpoint',
    async (request, reply) => {
      const { checkpointId, decision } = request.body || {};
      const checkpoint = pendingCheckpoints.find((c) => c.checkpointId === checkpointId);

      if (!checkpoint) {
        return reply.status(404).send({ success: false, error: 'Checkpoint not found' });
      }

      checkpoint.status = decision === 'approve' ? 'approved' : 'rejected';

      fastify.log.info({ checkpointId, decision }, 'ZeroClaw refund checkpoint decision updated');
      return reply.send({
        success: true,
        message: `Checkpoint ${checkpointId} set to ${checkpoint.status}`,
        checkpoint,
      });
    }
  );
};
