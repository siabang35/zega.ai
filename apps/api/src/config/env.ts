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
 * FOUNDATION HARDENING (F-ARCH-04):
 *   - Critical security secrets (JWT_SECRET, COOKIE_SECRET) have NO defaults — startup fails if missing.
 *   - Infrastructure credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) default to 'placeholder'
 *     for dev convenience, but a PRODUCTION GUARD rejects placeholders in production.
 *   - Superadmin emails MUST be explicitly configured — no hardcoded fallback.
 *
 * All environment variables are validated at startup via Zod.
 * If any required variable is missing or invalid, the server will
 * refuse to start and print a clear error message.
 */

// ── Known placeholder values that must NEVER appear in production ──
const PLACEHOLDER_VALUES = [
  'placeholder',
  'placeholder-service-role-key',
  'placeholder-anon-key',
  'sk_test_placeholder',
  'whsec_placeholder',
  'https://placeholder.supabase.co',
];

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_BASE_URL: z.string().url().default('http://localhost:3001'),

  // Supabase — placeholder defaults for dev only, rejected in production
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder-service-role-key'),
  SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Stripe — placeholder defaults for dev only, rejected in production
  STRIPE_SECRET_KEY: z.string().default('sk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_placeholder'),

  // Multi-LLM AI Providers
  OPENAI_API_KEY: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().default(''),
  GOOGLE_AI_API_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),
  GROQ_API_KEY: z.string().default(''),
  OPENROUTER_API_KEY: z.string().default(''),
  HUGGINGFACE_API_KEY: z.string().default(''),
  JATEVO_API_KEY: z.string().default(''),
  NINE_ROUTER_API_KEY: z.string().default(''),

  // Solana RPC Pool & Network Endpoints
  SOLANA_RPC_PRIMARY: z.string().default(''),
  SOLANA_RPC_SECONDARY: z.string().default(''),
  SOLANA_RPC_TERTIARY: z.string().default(''),
  SOLANA_RPC_FALLBACK: z.string().default('https://api.devnet.solana.com'),
  SOLANA_RPC_OFFICIAL: z.string().default('https://api.devnet.solana.com'),
  SOLANA_RPC_URL: z.string().default('https://api.devnet.solana.com'),
  SOLANA_RPC_1: z.string().default(''),
  SOLANA_RPC_2: z.string().default(''),
  SOLANA_RPC_3: z.string().default(''),
  SOLANA_RPC_4: z.string().default(''),

  // ZeroClaw Bridge & Telegram Bot
  ZEROCLAW_GATEWAY_URL: z.string().default('http://127.0.0.1:4242'),
  ZEROCLAW_BEARER_TOKEN: z.string().default(''),
  TELEGRAM_BOT_TOKEN: z.string().default(''),

  // Privy Keyless Embedded Wallet & Social OAuth
  PRIVY_APP_ID: z.string().default(''),
  PRIVY_APP_SECRET: z.string().default(''),
  GOOGLE_OAUTH_CLIENT_ID: z.string().default(''),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().default(''),
  GITHUB_OAUTH_CLIENT_ID: z.string().default(''),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().default(''),
  OAUTH_REDIRECT_URI: z.string().default('http://localhost:5173/auth/callback'),

  // Security & Encryption — NO DEFAULTS for critical secrets
  JWT_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().default(''),
  SUPABASE_JWT_SECRET: z.string().default(''),
  DATABASE_URL: z.string().default(''),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(60000),

  // Superadmin Emails — MUST be explicitly configured, no hardcoded fallback (F-ARCH-14 FIX)
  SUPERADMIN_EMAILS: z.string().default(''),

  // Cloudflare Turnstile & Brevo Email Service
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().default(''),
  SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_KEY: z.string().default(''),
  BREVO_API_KEY: z.string().default(''),
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

/**
 * FOUNDATION HARDENING — Production Startup Guard
 *
 * In production mode, verifies that no critical configuration is using
 * placeholder/default values. The server REFUSES TO START if placeholder
 * credentials are detected in production — this prevents accidental
 * deployment with fake/missing infrastructure credentials.
 *
 * Design Principle: Fail-fast at startup, not at first request.
 */
function validateProductionGuard(config: EnvConfig): void {
  if (config.NODE_ENV !== 'production') return;

  const violations: string[] = [];

  // Critical infrastructure — MUST be real in production
  if (PLACEHOLDER_VALUES.includes(config.SUPABASE_URL)) {
    violations.push('SUPABASE_URL is a placeholder value');
  }
  if (PLACEHOLDER_VALUES.includes(config.SUPABASE_SERVICE_ROLE_KEY)) {
    violations.push('SUPABASE_SERVICE_ROLE_KEY is a placeholder value');
  }
  if (PLACEHOLDER_VALUES.includes(config.SUPABASE_ANON_KEY)) {
    violations.push('SUPABASE_ANON_KEY is a placeholder value');
  }

  // Payment infrastructure — must be configured if used
  if (PLACEHOLDER_VALUES.includes(config.STRIPE_SECRET_KEY)) {
    // Warn but don't block — Stripe may not be actively used
    console.warn('⚠️  STRIPE_SECRET_KEY is a placeholder. Stripe payments will be rejected.');
  }
  if (PLACEHOLDER_VALUES.includes(config.STRIPE_WEBHOOK_SECRET)) {
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET is a placeholder. Stripe webhooks will be rejected.');
  }

  // Superadmin configuration — MUST be explicit in production
  if (!config.SUPERADMIN_EMAILS || config.SUPERADMIN_EMAILS.trim() === '') {
    console.warn('⚠️  SUPERADMIN_EMAILS is not configured. No superadmin access will be granted.');
  }

  if (violations.length > 0) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  🚫 PRODUCTION STARTUP BLOCKED — PLACEHOLDER CREDENTIALS   ║');
    console.error('╠══════════════════════════════════════════════════════════════╣');
    for (const v of violations) {
      console.error(`║  ❌ ${v.padEnd(56)}║`);
    }
    console.error('╠══════════════════════════════════════════════════════════════╣');
    console.error('║  Configure real credentials in .env or environment vars.   ║');
    console.error('║  The server will NOT start with placeholder values in      ║');
    console.error('║  NODE_ENV=production.                                      ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  }
}

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  // FOUNDATION HARDENING: Block production startup with placeholder credentials
  validateProductionGuard(result.data);

  return result.data;
}

export const envConfig = loadEnv();
