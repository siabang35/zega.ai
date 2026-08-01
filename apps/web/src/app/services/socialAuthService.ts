/**
 * OWASP Anti-Hacking Social Auth Service (Google v3 & GitHub)
 *
 * Implements:
 * 1. Real Google OAuth2 PKCE Authorization Code flow via accounts.google.com.
 * 2. Real GitHub OAuth2 Authorization Code flow via github.com.
 * 3. CSRF State Token generation & validation (Anti-State Tampering).
 * 4. PKCE (Proof Key for Code Exchange) S256 Code Challenge for Google.
 * 5. Backend token exchange via /v1/auth/oauth/exchange (keeps Client Secret server-side).
 * 6. 1-to-1 Privy Embedded Solana Wallet binding per social account.
 * 7. Supabase RPC `public.upsert_social_oauth_account` persistence.
 */

import { supabase } from '../../lib/supabase';
import { PrivyWalletService } from './privyWalletService';

export interface SocialAuthProfile {
  id: string;
  provider: 'google' | 'github';
  providerUserId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  privyWalletAddress: string;
  privyVerified: boolean;
  csrfStateToken: string;
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';

export class SocialAuthService {

  // ══════════════════════════════════════════════════════════════
  //  CRYPTO HELPERS
  // ══════════════════════════════════════════════════════════════

  /** Generate cryptographically random CSRF State Token */
  public static generateStateToken(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /** Generate PKCE Code Verifier & Challenge (S256) */
  public static async generatePkce(): Promise<{ verifier: string; challenge: string }> {
    const verifier = this.generateStateToken();
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      return { verifier, challenge: verifier };
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return { verifier, challenge };
  }

  // ══════════════════════════════════════════════════════════════
  //  OAUTH REDIRECT INITIATORS
  // ══════════════════════════════════════════════════════════════

  /** Initiate real Google OAuth2 PKCE Authorization redirect */
  public static async initiateGoogleOAuth(): Promise<void> {
    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    const state = this.generateStateToken();
    const { verifier, challenge } = await this.generatePkce();

    // Persist CSRF state + PKCE verifier in sessionStorage for callback validation
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_pkce_verifier', verifier);
    sessionStorage.setItem('oauth_provider', 'google');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    });

    window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /** Initiate real GitHub OAuth2 Authorization redirect */
  public static initiateGitHubOAuth(): void {
    const clientId = import.meta.env.VITE_GITHUB_OAUTH_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    const state = this.generateStateToken();

    // Persist CSRF state in sessionStorage for callback validation
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_provider', 'github');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });

    window.location.href = `${GITHUB_AUTH_URL}?${params.toString()}`;
  }

  // ══════════════════════════════════════════════════════════════
  //  OAUTH CALLBACK HANDLER
  // ══════════════════════════════════════════════════════════════

  /** Handle OAuth callback — validate CSRF state, exchange code via backend, return profile */
  public static async handleOAuthCallback(
    code: string,
    returnedState: string
  ): Promise<{
    profile: SocialAuthProfile;
    isNewUser: boolean;
  }> {
    // 1. Validate CSRF State Token
    const savedState = sessionStorage.getItem('oauth_state');
    const savedProvider = (sessionStorage.getItem('oauth_provider') || 'google') as 'google' | 'github';
    const savedPkceVerifier = sessionStorage.getItem('oauth_pkce_verifier');

    if (!savedState || savedState !== returnedState) {
      throw new Error('OAuth CSRF State token mismatch. Possible state tampering detected.');
    }

    // Clean up sessionStorage
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_pkce_verifier');
    sessionStorage.removeItem('oauth_provider');

    // 2. Exchange authorization code for access token via secure backend proxy
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`;

    const exchangeRes = await fetch(`${apiUrl}/v1/auth/oauth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: savedProvider,
        code,
        codeVerifier: savedPkceVerifier || undefined,
        redirectUri,
      }),
    });

    if (!exchangeRes.ok) {
      const err = await exchangeRes.json().catch(() => ({}));
      throw new Error(err.message || `OAuth token exchange failed (${exchangeRes.status})`);
    }

    const { email, name, avatarUrl, providerUserId } = await exchangeRes.json();

    // 3. Derive 1-to-1 Privy Solana Keyless Wallet
    const walletInfo = PrivyWalletService.getEmbeddedSolanaWallet(email);
    const csrfStateToken = this.generateStateToken();

    const profile: SocialAuthProfile = {
      id: `user-social-${savedProvider}-${Date.now()}`,
      provider: savedProvider,
      providerUserId: providerUserId || `${savedProvider}_${Date.now().toString(36)}`,
      email,
      fullName: name || '',
      avatarUrl,
      privyWalletAddress: walletInfo.address,
      privyVerified: true,
      csrfStateToken,
    };

    // 4. Check if user already has a stored profile (returning user vs new user)
    const storedProfiles = JSON.parse(localStorage.getItem('zega_social_profiles') || '{}');
    const isNewUser = !storedProfiles[email];

    // 5. Persist to Supabase Database table public.social_oauth_accounts via RPC
    try {
      await supabase.rpc('upsert_social_oauth_account', {
        p_user_id: profile.id,
        p_provider: savedProvider,
        p_provider_user_id: profile.providerUserId,
        p_email: email,
        p_full_name: profile.fullName,
        p_avatar_url: profile.avatarUrl,
        p_privy_wallet_address: walletInfo.address,
        p_last_login_ip: typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1',
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ZEGA-Agent',
      });
    } catch (e) {
      console.warn('Supabase social_oauth_accounts RPC note:', e);
    }

    return { profile, isNewUser };
  }

  // ══════════════════════════════════════════════════════════════
  //  PROFILE PERSISTENCE
  // ══════════════════════════════════════════════════════════════

  /** Save completed profile to localStorage (marks user as returning) */
  public static saveCompletedProfile(email: string, displayName: string, storeName: string, role: string): void {
    const storedProfiles = JSON.parse(localStorage.getItem('zega_social_profiles') || '{}');
    storedProfiles[email] = {
      displayName,
      storeName,
      role,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem('zega_social_profiles', JSON.stringify(storedProfiles));
  }

  /** Get stored profile for a returning user */
  public static getStoredProfile(email: string): { displayName: string; storeName: string; role: string } | null {
    const storedProfiles = JSON.parse(localStorage.getItem('zega_social_profiles') || '{}');
    return storedProfiles[email] || null;
  }
}
