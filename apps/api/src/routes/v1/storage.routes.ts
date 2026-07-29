import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { R2StorageService } from '../../services/r2StorageService.js';
import { SupabaseService } from '../../services/supabaseService.js';

const presignedUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  folder: z.string().optional().default('user-uploads'),
});

export async function storageRoutes(app: FastifyInstance) {
  /** GET /v1/storage/test-connection — Verify Supabase DB & Cloudflare R2 CDN Connectivity */
  app.get(
    '/test-connection',
    {
      schema: {
        tags: ['Storage & System'],
        summary: 'Test Supabase & Cloudflare R2 Connectivity',
        description: 'Performs live healthcheck on Supabase DB and Cloudflare R2 CDN S3 storage bucket.',
      },
    },
    async (_request, _reply) => {
      const r2Health = await R2StorageService.testConnection();

      // Supabase Ping Test
      const supabaseClient = SupabaseService.getClient();
      let supabaseStatus = 'disconnected';
      let supabaseLatency = 0;

      if (supabaseClient) {
        const start = Date.now();
        try {
          const { error } = await supabaseClient.from('profiles').select('count', { count: 'exact', head: true });
          supabaseLatency = Date.now() - start;
          supabaseStatus = error ? `connected (Error: ${error.message})` : `connected (${supabaseLatency}ms)`;
        } catch (e: any) {
          supabaseStatus = `error (${e?.message})`;
        }
      }

      return {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          supabase: {
            status: supabaseStatus,
            url: process.env.SUPABASE_URL || 'Not Configured',
          },
          cloudflareR2: {
            status: r2Health.success ? 'connected' : 'error',
            message: r2Health.message,
            latencyMs: r2Health.latencyMs,
            publicDomain: process.env.R2_PUBLIC_DOMAIN || 'https://cdn.zegaai.site',
            bucket: process.env.R2_BUCKET_NAME || 'zega-ai',
          },
        },
      };
    }
  );

  /** POST /v1/storage/upload — Best-Practice Image Upload to Cloudflare R2 CDN */
  app.post(
    '/upload',
    {
      schema: {
        tags: ['Storage & System'],
        summary: 'Upload Image / Asset to Cloudflare R2 CDN',
        description: 'Directly uploads an image file (PNG, JPG, WEBP, SVG) to Cloudflare R2 and returns its public CDN URL.',
      },
    },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          success: false,
          error: { code: 'FILE_MISSING', message: 'No image file uploaded in form-data payload.', statusCode: 400 },
        });
      }

      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_MIME_TYPE',
            message: `Unsupported file type (${data.mimetype}). Allowed types: ${allowedMimeTypes.join(', ')}`,
            statusCode: 400,
          },
        });
      }

      const buffer = await data.toBuffer();

      // OWASP 10MB payload size validation
      if (buffer.length > 10 * 1024 * 1024) {
        return reply.status(400).send({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds maximum allowed limit (10MB).', statusCode: 400 },
        });
      }

      const uploadResult = await R2StorageService.uploadFile({
        content: buffer,
        contentType: data.mimetype,
        folder: 'images',
      });

      return {
        success: true,
        data: {
          filename: data.filename,
          mimetype: data.mimetype,
          sizeBytes: buffer.length,
          publicUrl: uploadResult.url,
          cdnKey: uploadResult.key,
        },
      };
    }
  );

  /** POST /v1/storage/presigned-url — Generate Presigned Upload URL for Direct Client R2 Uploads */
  app.post(
    '/presigned-url',
    {
      schema: {
        tags: ['Storage & System'],
        summary: 'Generate Presigned R2 Upload URL',
        description: 'Generates a temporary signed S3 URL for client-side direct upload to Cloudflare R2 CDN.',
      },
    },
    async (request, reply) => {
      const body = presignedUrlSchema.parse(request.body);

      const result = await R2StorageService.generatePresignedUploadUrl({
        filename: body.filename,
        contentType: body.contentType,
        folder: body.folder,
      });

      return {
        success: true,
        data: result,
      };
    }
  );
}
