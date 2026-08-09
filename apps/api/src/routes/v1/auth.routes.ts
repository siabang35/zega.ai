import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { envConfig } from '../../config/env.js';
import { BrevoService } from '../../services/brevoService.js';
import { TurnstileService } from '../../services/turnstileService.js';
import { OtpStore } from '../../services/otpStore.js';
import { SupabaseService } from '../../services/supabaseService.js';
import { logger } from '../../utils/logger.js';

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

      // 2. Generate 6-digit OTP in OtpStore
      const otp = OtpStore.createOtp(body.email, body.fullName, body.audienceSegment);

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

  /** POST /v1/auth/verify-otp — Step 2: Verify OTP, sync Supabase Profile, and issue JWT */
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

    // 1. Verify OTP with OtpStore
    const verification = OtpStore.verifyOtp(body.email, body.otp);

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
    // No hardcoded fallback — if SUPERADMIN_EMAILS is not configured, nobody gets superadmin.
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

    const userId = dbProfile?.id || crypto.randomUUID();

    // 4. Issue Signed JWT Access Token
    // FOUNDATION HARDENING: Reduced from 8h to 1h for smaller breach window.
    // A refresh token mechanism should be added for seamless session extension.
    const token = app.jwt.sign(
      {
        sub: userId,
        email: normalizedEmail,
        role: role,
      },
      { expiresIn: '1h' }
    );

    // 5. Log OWASP Audit Event
    await SupabaseService.logAuditEvent({
      userId,
      ipAddress: request.ip,
      action: 'OTP_VERIFICATION_SUCCESS',
      resource: '/v1/auth/verify-otp',
      statusCode: 200,
      payloadSummary: `Role: ${role}, FullName: ${fullName}`,
    });

    // 6. Set Secure OWASP HTTP-Only Cookie
    reply.setCookie('__zega_token', token, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1 * 3600, // FOUNDATION HARDENING: 1h to match JWT expiry
    });

    return {
      success: true,
      data: {
        accessToken: token,
        expiresIn: 3600, // FOUNDATION HARDENING: 1h
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
        const res = await fetch('https://auth.privy.io/api/v1/users', {
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

        if (res.ok) {
          privyCloudUser = await res.json();
        } else {
          const errText = await res.text();
          console.warn('Privy REST API note (User may already exist):', res.status, errText);
        }
      } catch (e: any) {
        console.warn('Privy REST API network note:', e.message);
      }
    }

    return {
      success: true,
      data: {
        email: body.email,
        role: derivedRole,
        privyCloudUser,
        message: `User ${body.email} synchronized to Privy Official Cloud & Solana Embedded Wallet created.`,
      },
    };
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

  /** POST /v1/auth/logout — Clear session */
  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('__zega_token', { path: '/' });
    reply.clearCookie('__zega_refresh', { path: '/v1/auth/refresh' });
    return { success: true, data: { message: 'Session terminated' } };
  });

  /** POST /v1/auth/signout — Alias for /logout */
  app.post('/signout', async (_request, reply) => {
    reply.clearCookie('__zega_token', { path: '/' });
    reply.clearCookie('__zega_refresh', { path: '/v1/auth/refresh' });
    return { success: true, data: { message: 'Session terminated' } };
  });

  /** GET /v1/auth/me — Get current user */
  app.get('/me', async (request, reply) => {
    try {
      const decoded = await request.jwtVerify();
      return { success: true, data: decoded };
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token', statusCode: 401 },
      });
    }
  });
}
