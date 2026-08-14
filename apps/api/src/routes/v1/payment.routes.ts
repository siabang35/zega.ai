import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { paymentDetectionService } from '../../services/PaymentDetectionService.js';
import { webhookService } from '../../services/webhookService.js';

export async function paymentRoutes(fastify: FastifyInstance) {
  // POST /api/payments/verify -> Verify blockchain transaction signature & process payment
  fastify.post('/api/payments/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    if (!body.signature) {
      return reply.status(400).send({ success: false, message: 'Signature is required' });
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

