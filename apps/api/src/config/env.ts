import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Native Node.js 20 environment loader
try {
  process.loadEnvFile(path.resolve(__dirname, '../../.env'));
} catch (e) {
  try {
    process.loadEnvFile();
  } catch (err) {}
}

/**
 * ZEGA AI — Environment Configuration
 *
 * All environment variables are validated at startup via Zod.
 * If any required variable is missing or invalid, the server will
 * refuse to start and print a clear error message.
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_BASE_URL: z.string().url().default('http://localhost:3001'),

  // Supabase
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder-service-role-key'),
  SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().default('sk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_placeholder'),

  // AI Providers
  OPENAI_API_KEY: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().default(''),
  GOOGLE_AI_API_KEY: z.string().default(''),

  // Security
  JWT_SECRET: z.string().min(32).default('zega-ai-dev-jwt-secret-change-in-production-32chars'),
  COOKIE_SECRET: z.string().min(32).default('zega-ai-dev-cookie-secret-change-in-production-32ch'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Cloudflare Turnstile & Brevo Email Service
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().default(''),
  SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('no-reply@zegaai.site'),

  // Cloudflare R2 Storage
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET_NAME: z.string().default('zega-ai'),
  R2_ENDPOINT: z.string().default(''),
  R2_PUBLIC_DOMAIN: z.string().default('https://cdn.zegaai.site'),

  // ZEGA API & Webhook Configuration
  ZEGA_PUBLIC_API_KEY: z.string().default(''),
  ZEGA_SECRET_API_KEY: z.string().default(''),
  ZEGA_WEBHOOK_URL: z.string().default('https://zegaai.site/api/v1/webhook'),
  ZEGA_WEBHOOK_SECRET: z.string().default(''),

  // x402
  X402_NETWORK: z.enum(['base', 'base-sepolia', 'arbitrum', 'polygon']).default('base-sepolia'),
  X402_RPC_URL: z.string().url().default('https://sepolia.base.org'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

export const envConfig = loadEnv();
