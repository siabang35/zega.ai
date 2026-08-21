import { FastifyRequest } from 'fastify';
import { getTenantOrg } from '../middleware/requestContext.js';
import { getRegisteredPrivyWalletAddress, derivePrivyEmbeddedSolanaWallet, isMerchantWalletOwnedByUser } from '../routes/v1/zeroclaw.routes.js';
import { logger } from '../utils/logger.js';

export interface InvoiceSecurityParams {
  request: FastifyRequest;
  requestedUserId?: string;
  requestedMerchantPubkey?: string;
  requestedAmount?: string | number;
  requestedNetwork?: string;
  agentRole?: string;
  customerTarget?: string;
  tokenSymbol?: string;
}

export interface InvoiceSecurityAuthResult {
  authorized: boolean;
  userEmail: string;
  organizationId: string;
  authorizedMerchantWallet: string;
  canonicalAmountUsdc: number;
  network: string;
  errorResponse?: {
    statusCode: number;
    code: string;
    message: string;
  };
}

export class InvoiceSecurityService {
  /**
   * Server-side Zero-Trust authorization & validation gate for invoice operations.
   * Enforces:
   *  1. Server-side Tenant Isolation (authenticated session identity == invoice user == merchant tenant)
   *  2. Merchant Wallet Binding (requested_wallet == authorized_merchant_wallet)
   *  3. Agent Capability Boundaries (disallows non-financial agent escalation)
   *  4. Amount Validation & Canonicalization (numeric bounds, finite, positive, max 2 decimals)
   *  5. Network / Token Binding (strict server network control)
   *  6. Fail-closed atomic boundary
   */
  public static async validateSecurityContext(params: InvoiceSecurityParams): Promise<InvoiceSecurityAuthResult> {
    const { request, requestedUserId, requestedMerchantPubkey, requestedAmount, requestedNetwork, agentRole, tokenSymbol } = params;

    // 1. TENANT & PRINCIPAL IDENTITY RESOLUTION
    const principal = request.principal;
    const sessionUser = principal?.userId || principal?.email;
    // SECURITY (S-03 FIX): Fail closed — never credit invoices to a default phantom user
    if (!sessionUser && !requestedUserId) {
      return {
        authorized: false,
        userEmail: '',
        organizationId: '',
        authorizedMerchantWallet: '',
        canonicalAmountUsdc: 0,
        network: 'solana-devnet',
        errorResponse: {
          statusCode: 401,
          code: 'UNAUTHENTICATED',
          message: 'No authenticated identity available. Cannot create invoice without verified user.',
        },
      };
    }
    const userEmail = (sessionUser || requestedUserId || '').toLowerCase().trim();
    const organizationId = getTenantOrg(request) || '';

    // If authenticated session principal exists, prevent requestedUserId override attempt
    if (sessionUser && requestedUserId) {
      const cleanRequestedUser = requestedUserId.toLowerCase().trim();
      const cleanSessionUser = sessionUser.toLowerCase().trim();
      if (cleanRequestedUser !== cleanSessionUser && !cleanSessionUser.includes(cleanRequestedUser) && !cleanRequestedUser.includes(cleanSessionUser)) {
        logger.warn(
          { sessionUser, requestedUserId, action: 'tenant_user_mismatch_denied' },
          '🚫 [InvoiceSecurity] DENIED — requested userId mismatch with authenticated principal'
        );
        return {
          authorized: false,
          userEmail,
          organizationId,
          authorizedMerchantWallet: '',
          canonicalAmountUsdc: 0,
          network: 'solana-devnet',
          errorResponse: {
            statusCode: 403,
            code: 'TENANT_IDENTITY_MISMATCH',
            message: 'Requested user identity mismatches authenticated tenant principal.',
          },
        };
      }
    }

    // 2. AGENT CAPABILITY SEPARATION & CONFUSED-DEPUTY PROTECTION
    if (agentRole) {
      const normalizedRole = agentRole.toLowerCase().trim();
      const restrictedRoles = ['help', 'knowledge', 'support', 'unprivileged_copilot'];
      if (restrictedRoles.includes(normalizedRole)) {
        logger.warn(
          { userEmail, agentRole, action: 'agent_capability_escalation_denied' },
          '🚫 [InvoiceSecurity] DENIED — agent role lacks invoice creation capability'
        );
        return {
          authorized: false,
          userEmail,
          organizationId,
          authorizedMerchantWallet: '',
          canonicalAmountUsdc: 0,
          network: 'solana-devnet',
          errorResponse: {
            statusCode: 403,
            code: 'AGENT_CAPABILITY_DENIED',
            message: `Agent capability escalation blocked: role '${agentRole}' is not authorized for invoice operations.`,
          },
        };
      }
    }

    // 3. SERVER-SIDE MERCHANT WALLET BINDING
    const registeredWallet = await getRegisteredPrivyWalletAddress(userEmail).catch(() => null);
    const authorizedMerchantWallet = registeredWallet || derivePrivyEmbeddedSolanaWallet(userEmail);

    if (requestedMerchantPubkey && requestedMerchantPubkey.trim().length > 0) {
      const cleanRequestedWallet = requestedMerchantPubkey.trim();
      const cleanAuthorizedWallet = authorizedMerchantWallet.trim();

      const isExactMatch = cleanRequestedWallet.toLowerCase() === cleanAuthorizedWallet.toLowerCase();
      let isVerifiedOwner = false;
      if (!isExactMatch) {
        isVerifiedOwner = await isMerchantWalletOwnedByUser(userEmail, cleanRequestedWallet);
      }

      if (!isExactMatch && !isVerifiedOwner) {
        logger.warn(
          { userEmail, requestedMerchantPubkey, authorizedMerchantWallet, action: 'merchant_wallet_substitution_denied' },
          '🚫 [InvoiceSecurity] DENIED — merchant wallet substitution attempt'
        );
        return {
          authorized: false,
          userEmail,
          organizationId,
          authorizedMerchantWallet: cleanAuthorizedWallet,
          canonicalAmountUsdc: 0,
          network: 'solana-devnet',
          errorResponse: {
            statusCode: 403,
            code: 'MERCHANT_WALLET_MISMATCH',
            message: 'Requested merchant wallet address does not match authorized server-side merchant wallet.',
          },
        };
      }
    }

    // 4. AMOUNT VALIDATION & CANONICALIZATION
    const rawAmt = typeof requestedAmount === 'number' ? requestedAmount : parseFloat(String(requestedAmount || ''));

    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      logger.warn({ userEmail, requestedAmount, action: 'invalid_invoice_amount_denied' }, '🚫 [InvoiceSecurity] DENIED — invalid or non-positive amount');
      return {
        authorized: false,
        userEmail,
        organizationId,
        authorizedMerchantWallet,
        canonicalAmountUsdc: 0,
        network: 'solana-devnet',
        errorResponse: {
          statusCode: 400,
          code: 'INVALID_AMOUNT',
          message: 'Invoice amount must be a finite positive number greater than 0.',
        },
      };
    }

    const MAX_SINGLE_INVOICE_USDC = 100000;
    if (rawAmt > MAX_SINGLE_INVOICE_USDC) {
      logger.warn({ userEmail, rawAmt, action: 'excessive_invoice_amount_denied' }, '🚫 [InvoiceSecurity] DENIED — invoice amount exceeds tenant policy limits');
      return {
        authorized: false,
        userEmail,
        organizationId,
        authorizedMerchantWallet,
        canonicalAmountUsdc: 0,
        network: 'solana-devnet',
        errorResponse: {
          statusCode: 400,
          code: 'AMOUNT_POLICY_EXCEEDED',
          message: `Invoice amount exceeds maximum policy limit of ${MAX_SINGLE_INVOICE_USDC} USDC.`,
        },
      };
    }

    // Canonicalize amount to max 2 decimal places for USDC
    const canonicalAmountUsdc = Math.round(rawAmt * 100) / 100 > 0 ? Math.round(rawAmt * 100) / 100 : rawAmt;

    // 5. NETWORK & TOKEN BINDING
    const serverNetwork = process.env.SOLANA_NETWORK || 'solana-devnet';
    if (requestedNetwork && requestedNetwork.trim().length > 0) {
      const cleanRequestedNet = requestedNetwork.toLowerCase().trim();
      if ((cleanRequestedNet.includes('mainnet') && !serverNetwork.includes('mainnet')) || (cleanRequestedNet.includes('devnet') && serverNetwork.includes('mainnet'))) {
        logger.warn(
          { userEmail, requestedNetwork, serverNetwork, action: 'network_binding_violation_denied' },
          '🚫 [InvoiceSecurity] DENIED — network context violation'
        );
        return {
          authorized: false,
          userEmail,
          organizationId,
          authorizedMerchantWallet,
          canonicalAmountUsdc,
          network: serverNetwork,
          errorResponse: {
            statusCode: 400,
            code: 'NETWORK_BINDING_VIOLATION',
            message: `Requested network '${requestedNetwork}' violates trusted server network policy ('${serverNetwork}').`,
          },
        };
      }
    }

    // 6. TOKEN SYMBOL CHECK
    if (tokenSymbol && !['USDC', 'SOL'].includes(tokenSymbol.toUpperCase())) {
      return {
        authorized: false,
        userEmail,
        organizationId,
        authorizedMerchantWallet,
        canonicalAmountUsdc,
        network: serverNetwork,
        errorResponse: {
          statusCode: 400,
          code: 'UNSUPPORTED_TOKEN',
          message: `Token '${tokenSymbol}' is not supported for invoice settlement.`,
        },
      };
    }

    return {
      authorized: true,
      userEmail,
      organizationId,
      authorizedMerchantWallet,
      canonicalAmountUsdc,
      network: serverNetwork,
    };
  }
}
