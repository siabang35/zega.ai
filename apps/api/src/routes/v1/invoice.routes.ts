import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { invoiceService } from '../../services/InvoiceService.js';
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

export async function invoiceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      // Allow hook to continue if in dev/test fallback mode; extractAuthenticatedUserId handles fail-closed in prod
    }
    await populatePrincipal(request, reply);
  });

  // POST /api/invoices -> Create receiving invoice
  fastify.post('/api/invoices', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = extractAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const body = request.body as any;

    if (!body.amount) {
      return reply.status(400).send({ success: false, message: 'Amount is required' });
    }

    const invoice = await invoiceService.createInvoice({
      userId: rawUserId,
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

  // GET /api/invoices/:id -> Get invoice details
  fastify.get('/api/invoices/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const invoice = await invoiceService.getInvoice(id);

    if (!invoice) {
      return reply.status(404).send({ success: false, message: 'Invoice not found' });
    }

    const currentUserId = extractAuthenticatedUserId(request, reply);
    const isOwner = currentUserId && (invoice.user_id === currentUserId || invoice.user_id.toLowerCase() === currentUserId.toLowerCase());

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

  // GET /api/invoices/user/list -> List user invoices
  fastify.get('/api/invoices/user/list', async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUserId = extractAuthenticatedUserId(request, reply);
    if (!rawUserId) return;

    const invoices = await invoiceService.listUserInvoices(rawUserId);

    return reply.send({
      success: true,
      invoices,
    });
  });
}

