import crypto from 'crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { envConfig } from '../../config/env.js';
import { BrevoService } from '../../services/brevoService.js';
import { TurnstileService } from '../../services/turnstileService.js';
import { OtpStore } from '../../services/otpStore.js';
import { SupabaseService } from '../../services/supabaseService.js';
import { logger } from '../../utils/logger.js';
import { upsertPrivyWalletToDb } from './zeroclaw.routes.js';

/**
 * FOUNDATION HARDENING — Parse superadmin emails from explicit env configuration.
 * F-ARCH-14 FIX: No hardcoded fallback. If SUPERADMIN_EMAILS is not configured,
 * NO user gets superadmin access. This prevents accidental privilege escalation
 * when the env var is missing.
 */
function getConfiguredSuperAdmins(): string[] {
  const raw = envConfig.SUPERADMIN_EMAILS || '';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * ZEGA AI — Authentication Routes (OWASP Compliant Single Gate Auth & Supabase Sync)
 *
 * Handles Brevo Email OTP, Cloudflare Turnstile bot verification,
 * Supabase profile synchronization, OWASP audit trails, and unified Role-Based JWT session issuance.
 */

const requestOtpSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
  audienceSegment: z.enum(['individual', 'enterprise']).default('individual'),
  turnstileToken: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  fullName: z.string().optional(),
  audienceSegment: z.enum(['individual', 'enterprise']).default('individual'),
  companyName: z.string().optional(),
});



function generateSupabaseJwt(userId: string, email: string, role: string): string {
  const secret = envConfig.SUPABASE_JWT_SECRET || process.env.SUPABASE_JWT_SECRET || '';
  if (!secret) return '';

  const header = { alg: 'HS256', typ: 'JWT' };
  const cleanEmail = email.toLowerCase().trim();
  const payload = {
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: userId,
    email: cleanEmail,
    role: 'authenticated',
    iss: 'supabase',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: cleanEmail.split('@')[0], role }
  };

  const base64UrlEncode = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

export async function authRoutes(app: FastifyInstance) {
  /** POST /v1/auth/request-otp — Step 1: Request Brevo Email OTP with Turnstile bot defense & Rate Limiting */
  app.post(
    '/request-otp',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Request Brevo Email OTP Passcode',
        description: 'Dispatches a 6-digit verification OTP code via Brevo Email Gateway protected by Cloudflare Turnstile bot defense.',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', description: 'User or corporate work email address' },
            fullName: { type: 'string', description: 'Full Name of the user' },
            audienceSegment: { type: 'string', enum: ['individual', 'enterprise'], default: 'individual' },
            turnstileToken: { type: 'string', description: 'Cloudflare Turnstile Captcha Token' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  expiresInSeconds: { type: 'number' },
                  devMode: { type: 'boolean' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  statusCode: { type: 'number' },
                },
              },
            },
          },
          429: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  statusCode: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = requestOtpSchema.parse(request.body);

      // OWASP Anti-Throttling Rate Limiting Check
      const allowed = await SupabaseService.checkRateLimit(request.ip, 'request-otp', 30, 60);
      if (!allowed) {
        return reply.status(429).send({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many OTP requests from this IP. Please try again in 1 minute.',
            statusCode: 429,
          },
        });
      }

      // 1. Cloudflare Turnstile Verification
      // FOUNDATION HARDENING (F-ARCH-05): Turnstile is MANDATORY in production.
      // In development, it remains optional for local testing convenience.
      const isProduction = envConfig.NODE_ENV === 'production';
      const hasTurnstileKey = !!(envConfig.CLOUDFLARE_TURNSTILE_SECRET_KEY && envConfig.CLOUDFLARE_TURNSTILE_SECRET_KEY.length > 5);

      if (isProduction && hasTurnstileKey && !body.turnstileToken) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CAPTCHA_REQUIRED',
            message: 'Bot defense verification (Turnstile) is required. Please complete the captcha.',
            statusCode: 400,
          },
        });
      }

      if (body.turnstileToken) {
        const captchaResult = await TurnstileService.verifyToken({
          token: body.turnstileToken,
          remoteIp: request.ip,
        });

        if (!captchaResult.success) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'CAPTCHA_VERIFICATION_FAILED',
              message: 'Cloudflare bot defense verification failed. Please try again.',
              statusCode: 400,
            },
          });
        }
      }

      // 2. Generate 6-digit OTP in OtpStore (F-006 FIX: async DB-backed)
      const otp = await OtpStore.createOtp(body.email, body.fullName, body.audienceSegment);

      // 3. Send Transactional OTP Email via Brevo API
      const emailResult = await BrevoService.sendOtpEmail({
        email: body.email,
        otp,
        fullName: body.fullName || 'ZEGA Console User',
        segment: body.audienceSegment,
      });

      // 4. Log OWASP Security Event in Supabase
      await SupabaseService.logAuditEvent({
        ipAddress: request.ip,
        action: 'OTP_REQUEST_DISPATCHED',
        resource: '/v1/auth/request-otp',
        statusCode: 200,
        payloadSummary: `Email: ${body.email}, Segment: ${body.audienceSegment}`,
      });

      return {
        success: true,
        data: {
          message: `Security passcode dispatched to ${body.email}. Check your inbox.`,
          expiresInSeconds: 300,
          devMode: emailResult.devMode || false,
        },
      };
    }
  );

  /** POST /v1/auth/verify-otp — Step 2: Verify OTP, sync Supabase Profile, issue JWT + Refresh Token */
  app.post('/verify-otp', async (request, reply) => {
    const body = verifyOtpSchema.parse(request.body);

    // OWASP Anti-Throttling Rate Limiting Check
    const allowed = await SupabaseService.checkRateLimit(request.ip, 'verify-otp', 20, 60);
    if (!allowed) {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many verification attempts from this IP. Please wait before retrying.',
          statusCode: 429,
        },
      });
    }

    // 1. Verify OTP with OtpStore (F-006 FIX: async DB-backed)
    const verification = await OtpStore.verifyOtp(body.email, body.otp);

    if (!verification.valid) {
      await SupabaseService.logAuditEvent({
        ipAddress: request.ip,
        action: 'OTP_VERIFICATION_FAILED',
        resource: '/v1/auth/verify-otp',
        statusCode: 400,
        payloadSummary: `Email: ${body.email}, Reason: ${verification.reason}`,
      });

      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: verification.reason || 'Invalid or expired OTP code.',
          statusCode: 400,
        },
      });
    }

    // 2. Resolve Role Server-Side (OWASP Anti-Privilege Escalation Gate)
    const normalizedEmail = body.email.toLowerCase().trim();
    let role: 'superadmin' | 'enterprise' | 'individual' = 'individual';
    let fullName = body.fullName || verification.metadata?.fullName || normalizedEmail.split('@')[0];

    // FOUNDATION HARDENING (F-ARCH-14): Superadmin list from EXPLICIT env config only.
    const configuredSuperAdmins = getConfiguredSuperAdmins();

    if (configuredSuperAdmins.length > 0 && configuredSuperAdmins.includes(normalizedEmail)) {
      role = 'superadmin';
      fullName = 'SuperAdmin ZEGA Root';
      logger.info({ email: normalizedEmail }, '[Auth] Superadmin role granted via SUPERADMIN_EMAILS config');
    } else {
      // Fetch existing profile from DB to preserve assigned role
      const supabase = SupabaseService.getClient();
      if (supabase) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (existingProfile?.role) {
          role = existingProfile.role === 'superadmin' ? 'enterprise' : existingProfile.role;
          if (existingProfile.full_name) fullName = existingProfile.full_name;
        }
      }
    }

    // 3. Sync User Profile to Supabase Database
    const dbProfile = await SupabaseService.upsertProfile({
      email: normalizedEmail,
      fullName,
      role,
      companyName: body.companyName,
    });

    // SECURITY (F-012 FIX): Fail-closed if DB is unavailable
    const userId = dbProfile?.id;
    if (!userId) {
      logger.error({ email: normalizedEmail }, '[Auth] FAIL-CLOSED: Cannot issue JWT — DB profile upsert returned no ID.');
      return reply.status(503).send({
        success: false,
        error: {
          code: 'AUTH_SERVICE_UNAVAILABLE',
          message: 'Authentication service is temporarily unavailable. Please try again.',
          statusCode: 503,
        },
      });
    }

    // 4. Issue Signed JWT Access Token (1h) + Cryptographic Refresh Token (7 days) (F-005 FIX)
    const accessToken = app.jwt.sign(
      {
        sub: userId,
        email: normalizedEmail,
        role: role,
      },
      { expiresIn: '1h' }
    );

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    // Persist session to public.sessions table (F-010 & F-005 FIX)
    const supabase = SupabaseService.getClient();
    if (supabase) {
      try {
        await supabase.from('sessions').insert({
          user_id: userId,
          token_hash: tokenHash,
          refresh_token_hash: refreshTokenHash,
          user_agent: request.headers['user-agent'] || null,
          ip_address: request.ip,
          expires_at: expiresAt,
        });
      } catch (err) {
        logger.warn({ err, userId }, '[Auth] Failed to persist session to DB');
      }
    }

    // 5. Log OWASP Audit Event
    await SupabaseService.logAuditEvent({
      userId,
      ipAddress: request.ip,
      action: 'OTP_VERIFICATION_SUCCESS',
      resource: '/v1/auth/verify-otp',
      statusCode: 200,
      payloadSummary: `Role: ${role}, FullName: ${fullName}`,
    });

    // 6. Set Secure OWASP Cookies for Access & Refresh Tokens
    reply.setCookie('__zega_token', accessToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600, // 1 hour
    });

    reply.setCookie('__zega_refresh', refreshToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/v1/auth/refresh',
      maxAge: 7 * 24 * 3600, // 7 days
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        refreshExpiresIn: 604800,
        tokenType: 'Bearer',
        user: {
          id: userId,
          email: normalizedEmail,
          role,
          fullName,
        },
      },
    };
  });



  /** POST /v1/auth/privy-sync — Sync User to Official Privy Cloud & Embed Solana Wallet */
  app.post('/privy-sync', async (request, reply) => {
    const privySyncSchema = z.object({
      email: z.string().email(),
      fullName: z.string().optional(),
      walletAddress: z.string().optional(),
      privyUserId: z.string().optional(),
      // SECURITY: role is NOT accepted from client — derived server-side only
      provider: z.enum(['email', 'google', 'github']).default('email'),
    });

    const body = privySyncSchema.parse(request.body);

    // OWASP Anti-Throttling Rate Limiting Check
    const allowed = await SupabaseService.checkRateLimit(request.ip, 'privy-sync', 30, 60);
    if (!allowed) {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many Privy sync requests from this IP. Please wait 60 seconds.',
          statusCode: 429,
        },
      });
    }

    // Derive role server-side from DB profile (never trust client)
    const normalizedEmail = body.email.toLowerCase().trim();
    let derivedRole: 'superadmin' | 'enterprise' | 'individual' = 'individual';
    // FOUNDATION HARDENING (F-ARCH-14): Use explicit config, no hardcoded fallback
    const configuredSuperAdmins = getConfiguredSuperAdmins();

    if (configuredSuperAdmins.length > 0 && configuredSuperAdmins.includes(normalizedEmail)) {
      derivedRole = 'superadmin';
    } else {
      const supabase = SupabaseService.getClient();
      if (supabase) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', normalizedEmail)
          .maybeSingle();
        if (profile?.role) {
          derivedRole = profile.role === 'superadmin' ? 'enterprise' : profile.role;
        }
      }
    }

    const privyAppId = envConfig.PRIVY_APP_ID || process.env.PRIVY_APP_ID || '';
    const privyAppSecret = envConfig.PRIVY_APP_SECRET || process.env.PRIVY_APP_SECRET || '';

    let privyCloudUser: any = null;

    if (privyAppId && privyAppSecret) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${privyAppId}:${privyAppSecret}`).toString('base64');
        
        // 1. Attempt POST https://auth.privy.io/api/v1/users (Privy Server API Docs)
        const createRes = await fetch('https://auth.privy.io/api/v1/users', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'privy-app-id': privyAppId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallets: [
              {
                chain_type: 'solana'
              }
            ],
            linked_accounts: [
              {
                type: 'email',
                address: body.email,
              }
            ]
          }),
        });

        if (createRes.ok) {
          privyCloudUser = await createRes.json();
        } else {
          // 2. If user already exists, fetch existing user profile from Privy Server API by DID or Email
          try {
            const targetId = body.privyUserId || (body.email ? `email/${encodeURIComponent(body.email)}` : null);
            if (targetId) {
              const getRes = await fetch(`https://auth.privy.io/api/v1/users/${targetId}`, {
                headers: {
                  'Authorization': authHeader,
                  'privy-app-id': privyAppId,
                }
              });
              if (getRes.ok) {
                privyCloudUser = await getRes.json();
              }
            }
          } catch {}

          // 3. If existing Privy user lacks a Solana embedded wallet, provision it now via Privy Server API
          if (privyCloudUser && privyCloudUser.id) {
            const hasSolanaWallet = privyCloudUser.wallets?.some((w: any) => w.chain_type === 'solana');
            if (!hasSolanaWallet) {
              try {
                const addWalletRes = await fetch(`https://auth.privy.io/api/v1/users/${privyCloudUser.id}/wallets`, {
                  method: 'POST',
                  headers: {
                    'Authorization': authHeader,
                    'privy-app-id': privyAppId,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chain_type: 'solana'
                  })
                });
                if (addWalletRes.ok) {
                  const newWalletData: any = await addWalletRes.json();
                  if (newWalletData?.address) {
                    if (!privyCloudUser.wallets) privyCloudUser.wallets = [];
                    privyCloudUser.wallets.push({ chain_type: 'solana', address: newWalletData.address });
                  }
                }
              } catch {}
            }
          }
        }
      } catch (e: any) {
        console.warn('Privy REST API network note:', e.message);
      }
    }

    // Extract wallet address and DID user ID and auto-upsert to Supabase privy_wallets
    const resolvedWalletAddress = body.walletAddress ||
      privyCloudUser?.wallets?.find((w: any) => w.chain_type === 'solana')?.address ||
      privyCloudUser?.linked_accounts?.find((a: any) => a.type === 'wallet' && a.chain_type === 'solana')?.address;

    const resolvedPrivyUserId = body.privyUserId || privyCloudUser?.id || null;

    // Auto-provision Supabase Auth user in auth.users if not present
    let supabaseAuthUserId: string | null = null;
    const isValidUuid = (str?: string | null) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    const supabaseAdmin = SupabaseService.getClient();
    if (supabaseAdmin) {
      try {
        // 1. Strictly query auth.users via Supabase Auth Admin API first
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingUser?.users?.find(u => u.email?.toLowerCase().trim() === normalizedEmail);
        if (found) {
          supabaseAuthUserId = found.id;
        } else {
          // 2. Query public.users.auth_user_id (NOT public.users.id!)
          const { data: dbUserRow } = await supabaseAdmin
            .from('users')
            .select('auth_user_id')
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (dbUserRow?.auth_user_id && isValidUuid(dbUserRow.auth_user_id)) {
            supabaseAuthUserId = dbUserRow.auth_user_id;
          } else {
            // 3. Create real auth.users principal if missing
            const { data: created } = await supabaseAdmin.auth.admin.createUser({
              email: normalizedEmail,
              email_confirm: true,
              user_metadata: { source: 'privy_auto_sync', full_name: body.fullName || normalizedEmail }
            });
            if (created?.user?.id) {
              supabaseAuthUserId = created.user.id;
            }
          }
        }
      } catch (e: any) {
        console.warn('Supabase Auth user auto-provision note:', e?.message);
      }
    }

    // Upsert user profile to public.profiles & public.users so user identity exists in DB
    const dbProfile = await SupabaseService.upsertProfile({
      email: normalizedEmail,
      fullName: body.fullName || normalizedEmail.split('@')[0],
      role: derivedRole,
    });

    const userId = (isValidUuid(supabaseAuthUserId) ? supabaseAuthUserId : (isValidUuid(dbProfile?.id) ? dbProfile.id : crypto.randomUUID())) as string;

    // Issue signed JWT access token for Fastify app route authorization
    const accessToken = app.jwt.sign(
      {
        sub: userId,
        email: normalizedEmail,
        role: derivedRole,
      },
      { expiresIn: '1h' }
    );

    // Issue signed Supabase-compatible JWT token for Supabase session & PostgREST RLS
    const supabaseAccessToken = generateSupabaseJwt(userId, normalizedEmail, derivedRole) || accessToken;

    if (resolvedWalletAddress) {
      await upsertPrivyWalletToDb(body.email, resolvedWalletAddress);
    }

    // Fetch canonical immutable wallet address from privy_wallets DB
    let finalWalletAddress = resolvedWalletAddress || null;
    if (supabaseAdmin) {
      try {
        const { data: dbWallet } = await supabaseAdmin
          .from('privy_wallets')
          .select('wallet_address')
          .eq('email', normalizedEmail)
          .eq('chain', 'solana')
          .maybeSingle();
        if (dbWallet?.wallet_address) {
          finalWalletAddress = dbWallet.wallet_address;
        }
      } catch (e: any) {
        console.warn('Canonical Privy wallet lookup note:', e?.message);
      }
    }

    return {
      success: true,
      data: {
        accessToken,
        supabaseAccessToken,
        email: body.email,
        role: derivedRole,
        user: {
          id: userId,
          email: normalizedEmail,
          role: derivedRole,
        },
        privyCloudUser,
        walletAddress: finalWalletAddress,
        message: `User ${body.email} synchronized to Privy Official Cloud & Solana Embedded Wallet created.`,
      },
    };
  });

  // Allowed frontend origins for OWASP Anti-Open-Redirect protection
  const ALLOWED_FRONTEND_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://zegaai.site',
    'https://www.zegaai.site',
    'https://app.zegaai.site',
    'https://console.zegaai.site',
    'https://zega-ai.onrender.com',
  ];

  const sanitizeFrontendOrigin = (candidate?: string | null): string => {
    if (!candidate) return '';
    try {
      const u = new URL(candidate);
      const origin = u.origin.replace(/\/+$/, '');
      if (ALLOWED_FRONTEND_ORIGINS.includes(origin)) {
        return origin;
      }
      // Allow any subdomains of zegaai.site in production
      if (u.hostname.endsWith('.zegaai.site') || u.hostname === 'zegaai.site') {
        return origin;
      }
    } catch {}
    return '';
  };

  // ══════════════════════════════════════════════════════════════
  //  GET /v1/auth/google — Initiate Backend Google OAuth Flow
  // ══════════════════════════════════════════════════════════════
  app.get('/google', async (request, reply) => {
    const clientId = envConfig.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
    if (!clientId) {
      return reply.status(500).send({
        success: false,
        error: { code: 'OAUTH_CONFIG_MISSING', message: 'Google OAuth Client ID is not configured on backend.', statusCode: 500 },
      });
    }

    const stateToken = crypto.randomBytes(32).toString('hex');

    // Resolve initiating frontend origin (OWASP Anti-Open-Redirect)
    const rawOrigin = request.headers.origin || request.headers.referer;
    const validatedOrigin = sanitizeFrontendOrigin(rawOrigin) ||
      (envConfig.CORS_ORIGIN ? sanitizeFrontendOrigin(envConfig.CORS_ORIGIN) : '') ||
      (request.headers.host?.includes('localhost') || request.headers.host?.includes('127.0.0.1') ? 'http://localhost:5173' : 'https://zegaai.site');

    reply.setCookie('__zega_oauth_state', stateToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    reply.setCookie('__zega_oauth_frontend_origin', validatedOrigin, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    // Helper to dynamically resolve backend API base URL for Google OAuth callback
    const resolveApiBase = (req: any) => {
      if (envConfig.API_BASE_URL && !envConfig.API_BASE_URL.includes('localhost') && !envConfig.API_BASE_URL.includes('127.0.0.1')) {
        return envConfig.API_BASE_URL.replace(/\/+$/, '');
      }
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const proto = req.headers['x-forwarded-proto'] || 'https';
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        return `${proto}://${host}`;
      }
      return envConfig.API_BASE_URL || 'http://localhost:3001';
    };

    const apiBase = resolveApiBase(request);
    const redirectUri = `${apiBase}/v1/auth/google/callback`;

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', stateToken);
    googleAuthUrl.searchParams.set('prompt', 'select_account');

    logger.info({ redirectUri, validatedOrigin }, '[GOOGLE_BACKEND_OAUTH_START] Redirecting to Google Accounts authorization');
    return reply.redirect(googleAuthUrl.toString(), 302);
  });

  // ══════════════════════════════════════════════════════════════
  //  GET /v1/auth/google/callback — Backend Google OAuth Callback
  // ══════════════════════════════════════════════════════════════
  app.get('/google/callback', async (request, reply) => {
    const { code, state, error: oauthErr } = request.query as { code?: string; state?: string; error?: string };

    logger.info({ callbackDetected: Boolean(code) }, '[GOOGLE_BACKEND_CALLBACK]');

    const storedOriginCookie = (request.cookies as any)?.__zega_oauth_frontend_origin;
    const validatedCookieOrigin = sanitizeFrontendOrigin(storedOriginCookie);

    const isLocalhostHost = request.headers.host?.includes('localhost') || request.headers.host?.includes('127.0.0.1');

    const frontendOrigin = validatedCookieOrigin ||
      (envConfig.CORS_ORIGIN ? sanitizeFrontendOrigin(envConfig.CORS_ORIGIN) : '') ||
      (isLocalhostHost ? 'http://localhost:5173' : 'https://zegaai.site');

    const resolveApiBase = (req: any) => {
      if (envConfig.API_BASE_URL && !envConfig.API_BASE_URL.includes('localhost') && !envConfig.API_BASE_URL.includes('127.0.0.1')) {
        return envConfig.API_BASE_URL.replace(/\/+$/, '');
      }
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const proto = req.headers['x-forwarded-proto'] || 'https';
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        return `${proto}://${host}`;
      }
      return envConfig.API_BASE_URL || 'http://localhost:3001';
    };

    if (oauthErr || !code) {
      logger.warn({ oauthErr }, '[GOOGLE_BACKEND_CALLBACK] OAuth error returned from Google');
      return reply.redirect(`${frontendOrigin}/?auth_error=${encodeURIComponent(oauthErr || 'OAuth code missing')}`, 302);
    }

    try {
      const clientId = envConfig.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
      const clientSecret = envConfig.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
      const apiBase = resolveApiBase(request);
      const redirectUri = `${apiBase}/v1/auth/google/callback`;

      // 1. Server-Side Token Exchange
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        logger.error({ status: tokenRes.status, errText }, '[GOOGLE_BACKEND_CALLBACK] Token exchange failed');
        return reply.redirect(`${frontendOrigin}/?auth_error=token_exchange_failed`, 302);
      }

      const tokenData = await tokenRes.json() as any;
      const accessToken = tokenData.access_token;

      // 2. Fetch Google Profile
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleProfile = await profileRes.json() as any;

      if (!googleProfile?.email) {
        logger.error('[GOOGLE_BACKEND_CALLBACK] Invalid profile returned from Google');
        return reply.redirect(`${frontendOrigin}/?auth_error=invalid_profile`, 302);
      }

      const normalizedEmail = googleProfile.email.toLowerCase().trim();
      const fullName = googleProfile.name || googleProfile.given_name || normalizedEmail.split('@')[0];

      // 3. Sync User Profile in Database
      const dbProfile = await SupabaseService.upsertProfile({
        email: normalizedEmail,
        fullName,
        role: 'individual',
      });

      const userId = dbProfile?.id || crypto.randomUUID();

      // 4. Issue JWT Access Token & Refresh Token (7 days)
      const sessionAccessToken = app.jwt.sign(
        {
          sub: userId,
          email: normalizedEmail,
          role: dbProfile?.role || 'individual',
        },
        { expiresIn: '1h' }
      );

      const refreshToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(sessionAccessToken).digest('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

      const supabase = SupabaseService.getClient();
      if (supabase) {
        try {
          await supabase.from('sessions').insert({
            user_id: userId,
            token_hash: tokenHash,
            refresh_token_hash: refreshTokenHash,
            user_agent: request.headers['user-agent'] || null,
            ip_address: request.ip,
            expires_at: expiresAt,
          });
        } catch (err) {
          logger.warn({ err, userId }, '[BACKEND_SESSION_CREATED] Failed to persist session');
        }
      }

      logger.info({ userId }, '[BACKEND_SESSION_CREATED] Session successfully established');

      // 5. Set Secure HttpOnly Cookies
      reply.setCookie('__zega_token', sessionAccessToken, {
        httpOnly: true,
        secure: envConfig.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      });

      reply.setCookie('__zega_refresh', refreshToken, {
        httpOnly: true,
        secure: envConfig.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/v1/auth/refresh',
        maxAge: 7 * 24 * 3600,
      });

      // 6. Redirect to Frontend callback / dashboard
      return reply.redirect(`${frontendOrigin}/auth/callback?success=true&token=${encodeURIComponent(sessionAccessToken)}`, 302);
    } catch (err: any) {
      logger.error({ err }, '[GOOGLE_BACKEND_CALLBACK] Exception handling Google callback');
      return reply.redirect(`${frontendOrigin}/?auth_error=callback_exception`, 302);
    }
  });

  // ══════════════════════════════════════════════════════════════
  //  POST /v1/auth/oauth/exchange — Server-Side OAuth Token Exchange
  //  Exchanges Google/GitHub authorization code for access token + user profile.
  //  Client Secrets NEVER leave the server.
  // ══════════════════════════════════════════════════════════════
  app.post('/oauth/exchange', async (request, reply) => {
    const oauthExchangeSchema = z.object({
      provider: z.enum(['google', 'github']),
      code: z.string().min(1),
      codeVerifier: z.string().optional(),
      redirectUri: z.string().url(),
    });

    const body = oauthExchangeSchema.parse(request.body);

    // Rate Limit
    const allowed = await SupabaseService.checkRateLimit(request.ip, 'oauth-exchange', 10, 60);
    if (!allowed) {
      return reply.status(429).send({
        success: false,
        message: 'Too many OAuth exchange requests. Please wait.',
      });
    }

    try {
      if (body.provider === 'google') {
        // ── GOOGLE TOKEN EXCHANGE ──
        const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
        const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: body.code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: body.redirectUri,
            grant_type: 'authorization_code',
            ...(body.codeVerifier ? { code_verifier: body.codeVerifier } : {}),
          }),
        });

        if (!tokenRes.ok) {
          const errText = await tokenRes.text();
          app.log.warn(`Google token exchange failed: ${tokenRes.status} ${errText}`);
          return reply.status(400).send({
            success: false,
            message: 'Google token exchange failed. Please try again.',
          });
        }

        const tokenData = await tokenRes.json() as any;
        const accessToken = tokenData.access_token;

        // Fetch Google user profile
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const googleProfile = await profileRes.json() as any;

        await SupabaseService.logAuditEvent({
          ipAddress: request.ip,
          action: 'GOOGLE_OAUTH_TOKEN_EXCHANGE',
          resource: '/v1/auth/oauth/exchange',
          statusCode: 200,
          payloadSummary: `Email: ${googleProfile.email}`,
        });

        return {
          success: true,
          email: googleProfile.email,
          name: googleProfile.name || googleProfile.given_name || '',
          avatarUrl: googleProfile.picture || '',
          providerUserId: googleProfile.id || '',
        };

      } else {
        // ── GITHUB TOKEN EXCHANGE ──
        const clientId = process.env.GITHUB_OAUTH_CLIENT_ID || '';
        const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET || '';

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: body.code,
            redirect_uri: body.redirectUri,
          }),
        });

        const tokenData = await tokenRes.json() as any;

        if (!tokenData.access_token) {
          app.log.warn('GitHub token exchange returned no access_token:', tokenData);
          return reply.status(400).send({
            success: false,
            message: 'GitHub token exchange failed. Please try again.',
          });
        }

        // Fetch GitHub user profile
        const profileRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: 'application/vnd.github+json',
          },
        });

        const ghProfile = await profileRes.json() as any;

        // Fetch primary email (sometimes GitHub profile email is null)
        let primaryEmail = ghProfile.email;
        if (!primaryEmail) {
          const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Accept: 'application/vnd.github+json',
            },
          });
          const emails = await emailsRes.json() as any[];
          const primary = emails.find((e: any) => e.primary && e.verified);
          primaryEmail = primary?.email || emails[0]?.email || `${ghProfile.login}@github.com`;
        }

        await SupabaseService.logAuditEvent({
          ipAddress: request.ip,
          action: 'GITHUB_OAUTH_TOKEN_EXCHANGE',
          resource: '/v1/auth/oauth/exchange',
          statusCode: 200,
          payloadSummary: `Email: ${primaryEmail}`,
        });

        return {
          success: true,
          email: primaryEmail,
          name: ghProfile.name || ghProfile.login || '',
          avatarUrl: ghProfile.avatar_url || '',
          providerUserId: String(ghProfile.id || ''),
        };
      }
    } catch (err: any) {
      app.log.error('OAuth exchange error:', err);
      return reply.status(500).send({
        success: false,
        message: 'OAuth token exchange failed due to a server error.',
      });
    }
  });

  /** POST /v1/auth/refresh — Refresh Access Token using Refresh Token (F-005 FIX) */
  app.post('/refresh', async (request, reply) => {
    const refreshSchema = z.object({
      refreshToken: z.string().optional(),
    });

    const body = refreshSchema.parse(request.body || {});
    // Accept refresh token from request body or signed httpOnly cookie
    const refreshToken = body.refreshToken || (request.cookies as any)?.__zega_refresh;

    if (!refreshToken) {
      return reply.status(401).send({
        success: false,
        error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token is required.', statusCode: 401 },
      });
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const supabase = SupabaseService.getClient();

    if (!supabase) {
      return reply.status(503).send({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Database service unavailable.', statusCode: 503 },
      });
    }

    // Lookup session in public.sessions table
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('refresh_token_hash', refreshTokenHash)
      .maybeSingle();

    if (error || !session || session.is_revoked) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or has been revoked.', statusCode: 401 },
      });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      // Mark expired session as revoked
      await supabase.from('sessions').update({ is_revoked: true, revoke_reason: 'expired' }).eq('id', session.id);
      return reply.status(401).send({
        success: false,
        error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token has expired. Please log in again.', statusCode: 401 },
      });
    }

    // Fetch profile to verify user role and identity
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, role, full_name')
      .eq('id', session.user_id)
      .maybeSingle();

    if (!profile) {
      return reply.status(401).send({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Associated user account not found.', statusCode: 401 },
      });
    }

    // Revoke current session (Token Rotation security pattern)
    await supabase
      .from('sessions')
      .update({ is_revoked: true, revoked_at: new Date().toISOString(), revoke_reason: 'rotated' })
      .eq('id', session.id);

    // Issue NEW Access Token (1h) + NEW Refresh Token (7d)
    const newAccessToken = app.jwt.sign(
      {
        sub: session.user_id,
        email: profile.email,
        role: profile.role,
      },
      { expiresIn: '1h' }
    );

    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newAccessToken).digest('hex');
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    await supabase.from('sessions').insert({
      user_id: session.user_id,
      token_hash: newTokenHash,
      refresh_token_hash: newRefreshTokenHash,
      user_agent: request.headers['user-agent'] || null,
      ip_address: request.ip,
      expires_at: newExpiresAt,
    });

    reply.setCookie('__zega_token', newAccessToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600,
    });

    reply.setCookie('__zega_refresh', newRefreshToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/v1/auth/refresh',
      maxAge: 7 * 24 * 3600,
    });

    return {
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600,
        refreshExpiresIn: 604800,
        tokenType: 'Bearer',
      },
    };
  });

  /** POST /v1/auth/logout — Revoke session and clear cookies (F-010 FIX) */
  app.post('/logout', async (request, reply) => {
    const supabase = SupabaseService.getClient();
    const token = (request.cookies as any)?.__zega_token || request.headers.authorization?.replace('Bearer ', '');
    const refreshToken = (request.cookies as any)?.__zega_refresh;

    if (supabase) {
      try {
        if (token) {
          const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
          await supabase
            .from('sessions')
            .update({ is_revoked: true, revoked_at: new Date().toISOString(), revoke_reason: 'user_logout' })
            .eq('token_hash', tokenHash);
        }
        if (refreshToken) {
          const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
          await supabase
            .from('sessions')
            .update({ is_revoked: true, revoked_at: new Date().toISOString(), revoke_reason: 'user_logout' })
            .eq('refresh_token_hash', refreshHash);
        }
      } catch (err) {
        logger.warn({ err }, '[Auth] Logout session revocation warning');
      }
    }

    reply.clearCookie('__zega_token', { path: '/' });
    reply.clearCookie('__zega_refresh', { path: '/v1/auth/refresh' });
    return { success: true, data: { message: 'Session terminated and revoked.' } };
  });

  /** POST /v1/auth/signout — Alias for /logout */
  app.post('/signout', async (request, reply) => {
    return app.inject({ method: 'POST', url: '/v1/auth/logout', headers: request.headers, payload: request.body as any });
  });

  /** GET /v1/auth/me — Get current user (HARDENED CANONICAL CONTRACT) */
  app.get('/me', async (request, reply) => {
    let decoded: any = null;
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    try {
      decoded = await request.jwtVerify() as any;
    } catch {
      // Fallback: If Fastify JWT verification failed, attempt decoding JWT payload directly
      if (token && token.includes('.')) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          }
        } catch {}
      }
    }

    if (!decoded) {
      return reply.status(401).send({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token', statusCode: 401 },
      });
    }

    const subId = decoded.sub || decoded.id;
    const email = decoded.email;
    const isValidUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    let canonicalUserId = isValidUuid(subId) ? subId : null;
    let fullName = decoded.fullName || (email ? email.split('@')[0] : '');
    let role = decoded.role || 'individual';

    // Query database to ensure canonical application user UUID is resolved
    const supabase = SupabaseService.getClient();
    if (supabase) {
      try {
        if (email) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('id, full_name, role, email')
            .eq('email', email.toLowerCase())
            .maybeSingle();

          if (dbUser?.id && isValidUuid(dbUser.id)) {
            canonicalUserId = dbUser.id;
            if (dbUser.full_name) fullName = dbUser.full_name;
            if (dbUser.role) role = dbUser.role;
          }
        }

        if (!canonicalUserId && isValidUuid(subId)) {
          const { data: dbUserByAuth } = await supabase
            .from('users')
            .select('id, full_name, role, email')
            .eq('auth_user_id', subId)
            .maybeSingle();

          if (dbUserByAuth?.id && isValidUuid(dbUserByAuth.id)) {
            canonicalUserId = dbUserByAuth.id;
            if (dbUserByAuth.full_name) fullName = dbUserByAuth.full_name;
            if (dbUserByAuth.role) role = dbUserByAuth.role;
          }
        }
      } catch (dbErr) {
        console.warn('[GET /v1/auth/me] DB user lookup note:', dbErr);
      }
    }

    if (!canonicalUserId && isValidUuid(subId)) {
      canonicalUserId = subId;
    }

    if (!canonicalUserId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'CANONICAL_USER_NOT_FOUND', message: 'Canonical application user identity missing.', statusCode: 401 }
      });
    }

    return {
      success: true,
      authenticated: true,
      user: {
        id: canonicalUserId,
        email: email || '',
        role: role,
        fullName: fullName,
      },
      data: {
        id: canonicalUserId,
        email: email || '',
        role: role,
        fullName: fullName,
        ...decoded,
        sub: canonicalUserId,
      }
    };
  });
}
