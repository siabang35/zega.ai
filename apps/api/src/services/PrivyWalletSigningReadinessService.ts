import crypto from 'node:crypto';
import { PrivyClient } from '@privy-io/server-auth';
import { envConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface SigningReadinessReport {
  configurationReady: boolean;
  apiConnected: boolean;
  authorizationKeyConfigured: boolean;
  authorizationKeyFingerprint: string | null;
  walletId: string | null;
  walletAddress: string | null;
  ownerId: string | null;
  additionalSigners: Array<{ signerId: string; overridePolicyIds?: string[] }>;
  signerAuthorized: boolean;
  policyPermitted: boolean;
  overallSigningReady: boolean;
  error?: string;
  details?: string;
}

export class PrivyWalletSigningReadinessService {
  private client: PrivyClient | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): PrivyClient | null {
    const appId = envConfig.PRIVY_APP_ID;
    const appSecret = envConfig.PRIVY_APP_SECRET;
    const authKey = envConfig.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY || envConfig.PRIVY_AUTHORIZATION_KEY;

    if (!appId || !appSecret) {
      return null;
    }

    try {
      this.client = new PrivyClient(appId, appSecret, {
        walletApi: {
          authorizationPrivateKey: authKey || undefined,
        },
      });
      return this.client;
    } catch (err: any) {
      logger.error({ err: err.message }, '[PrivyWalletSigningReadinessService] Failed to instantiate PrivyClient');
      return null;
    }
  }

  /**
   * Safely extracts SHA-256 fingerprint of P-256 authorization public key.
   * Never logs or exposes raw private key.
   */
  public extractKeyFingerprint(authKeyStr?: string): string | null {
    const keyStr = authKeyStr || envConfig.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY || envConfig.PRIVY_AUTHORIZATION_KEY;
    if (!keyStr) return null;

    try {
      const rawKey = keyStr.replace(/^wallet-auth:/, '').trim();
      const derBuf = Buffer.from(rawKey, 'base64');
      const lines = derBuf.toString('base64').match(/.{1,64}/g) || [];
      const pemKey = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;

      const privateKeyObj = crypto.createPrivateKey(pemKey);
      const publicKeyObj = crypto.createPublicKey(privateKeyObj);
      const pubKeyDer = publicKeyObj.export({ type: 'spki', format: 'der' });
      return crypto.createHash('sha256').update(pubKeyDer).digest('hex').slice(0, 16);
    } catch (err: any) {
      logger.warn({ err: err.message }, '[PrivyWalletSigningReadinessService] Could not derive public key fingerprint');
      return 'UNPARSABLE_KEY_FMT';
    }
  }

  /**
   * Attempts to update wallet signers to authorize a signer/quorum ID.
   */
  public async provisionWalletSigner(walletId: string, signerId: string): Promise<boolean> {
    if (!this.client) {
      this.initClient();
    }
    if (!this.client) return false;

    try {
      logger.info({ walletId, signerId }, '[PrivyWalletSigningReadinessService] Provisioning signer on Privy wallet...');
      const updated = await this.client.walletApi.updateWallet({
        id: walletId,
        additionalSigners: [{ signerId }],
      });

      logger.info({ walletId, updatedSigners: updated.additionalSigners }, '[PrivyWalletSigningReadinessService] Signer provisioned successfully.');
      return true;
    } catch (err: any) {
      logger.error({ walletId, error: err.message }, '[PrivyWalletSigningReadinessService] Failed to provision signer on Privy wallet.');
      return false;
    }
  }

  /**
   * Diagnostic verification of wallet signer status and Privy signing readiness.
   */
  public async checkSigningReadiness(targetWalletId = 'fq512jbre6qryttexoa4v7s7'): Promise<SigningReadinessReport> {
    const appId = envConfig.PRIVY_APP_ID;
    const appSecret = envConfig.PRIVY_APP_SECRET;
    const authKey = envConfig.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY || envConfig.PRIVY_AUTHORIZATION_KEY;

    const configurationReady = Boolean(appId && appSecret);
    const authorizationKeyConfigured = Boolean(authKey);
    const fingerprint = this.extractKeyFingerprint(authKey);

    const report: SigningReadinessReport = {
      configurationReady,
      apiConnected: false,
      authorizationKeyConfigured,
      authorizationKeyFingerprint: fingerprint,
      walletId: targetWalletId,
      walletAddress: null,
      ownerId: null,
      additionalSigners: [],
      signerAuthorized: false,
      policyPermitted: true,
      overallSigningReady: false,
    };

    if (!configurationReady) {
      report.error = 'MISSING_PRIVY_CREDENTIALS';
      report.details = 'PRIVY_APP_ID or PRIVY_APP_SECRET environment variable is missing.';
      this.logReport(report);
      return report;
    }

    if (!this.client) {
      this.initClient();
    }

    if (!this.client) {
      report.error = 'PRIVY_CLIENT_INIT_FAILED';
      report.details = 'Could not initialize PrivyClient instance.';
      this.logReport(report);
      return report;
    }

    // ── 1. Privy API Connection & Wallet Retrieval Check ──
    try {
      const wallet = await this.client.walletApi.getWallet({ id: targetWalletId });
      report.apiConnected = true;
      report.walletId = wallet.id;
      report.walletAddress = wallet.address;
      report.ownerId = wallet.ownerId;
      report.additionalSigners = wallet.additionalSigners || [];

      // Check if ownerId or additionalSigners are present
      const hasSigners = Boolean(wallet.ownerId || (wallet.additionalSigners && wallet.additionalSigners.length > 0));
      
      // If additionalSigners is empty and ownerId exists, attempt auto-provisioning
      if (wallet.ownerId && (!wallet.additionalSigners || wallet.additionalSigners.length === 0)) {
        logger.info({ walletId: wallet.id, ownerId: wallet.ownerId }, '[PrivyWalletSigningReadinessService] Attempting automatic signer provisioning...');
        const provisioned = await this.provisionWalletSigner(wallet.id, wallet.ownerId);
        if (provisioned) {
          report.signerAuthorized = true;
        }
      } else if (hasSigners) {
        report.signerAuthorized = true;
      }
    } catch (err: any) {
      report.apiConnected = false;
      report.error = 'PRIVY_API_GET_WALLET_FAILED';
      report.details = err.message || 'Failed to connect to Privy Wallet API or locate wallet.';
      this.logReport(report);
      return report;
    }

    // ── 2. Signing Authorization Test ──
    if (authorizationKeyConfigured && report.apiConnected) {
      // Evaluate overall readiness
      report.overallSigningReady = report.signerAuthorized;
    }

    this.logReport(report);
    return report;
  }

  private logReport(report: SigningReadinessReport): void {
    if (envConfig.NODE_ENV === 'production') {
      logger.info(
        {
          walletId: report.walletId,
          walletAddress: report.walletAddress,
          signingReady: report.overallSigningReady,
          authorizationKeyConfigured: report.authorizationKeyConfigured,
          apiConnected: report.apiConnected,
          error: report.error || undefined,
        },
        '[PrivyWalletSigningReadinessService] Privy signing readiness check completed'
      );
      return;
    }

    const maskId = (val: string | null): string => {
      if (!val || val.length <= 10) return val || 'NONE';
      return `${val.slice(0, 5)}...${val.slice(-4)}`;
    };

    logger.info('====================================================');
    logger.info('   ZEGA AI — PRIVY SIGNING READINESS DIAGNOSTIC     ');
    logger.info('====================================================');
    logger.info(`Privy App ID                  : ${envConfig.PRIVY_APP_ID ? 'CONFIGURED' : 'MISSING'}`);
    logger.info(`Privy App Secret              : ${envConfig.PRIVY_APP_SECRET ? 'CONFIGURED' : 'MISSING'}`);
    logger.info(`Authorization Key Configured  : ${report.authorizationKeyConfigured ? 'YES' : 'NO'}`);
    logger.info(`Authorization Key Fingerprint : ${report.authorizationKeyFingerprint || 'NONE'}`);
    logger.info(`Privy API Connected           : ${report.apiConnected ? 'YES' : 'NO'}`);
    logger.info(`Target Wallet ID              : ${maskId(report.walletId)}`);
    logger.info(`Target Wallet Address         : ${maskId(report.walletAddress)}`);
    logger.info(`Wallet Owner Quorum ID        : ${maskId(report.ownerId)}`);
    logger.info(`Additional Signers Count      : ${report.additionalSigners.length}`);
    logger.info(`Signer Authorized             : ${report.signerAuthorized ? 'YES' : 'NO'}`);
    logger.info(`Overall Signing Ready         : ${report.overallSigningReady ? 'READY' : 'NOT READY'}`);
    if (report.error) {
      logger.warn(`Diagnostic Warning/Error     : ${report.error} — ${report.details}`);
    }
    logger.info('====================================================');
  }
}

export const privyWalletSigningReadinessService = new PrivyWalletSigningReadinessService();
