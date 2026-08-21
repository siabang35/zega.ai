import { canonicalAuthManager, CanonicalAuthState, CanonicalAuthResult } from '../../services/CanonicalAuthManager';
import { umkmSupabaseService, isValidUuid } from './umkmSupabaseService';
import { chatSessionManager, AssistantType } from './chatSessionManager';
import { setActiveTenant, getActiveTenantIds } from '../contexts/TenantContext';
import { getCanonicalAccessToken, getSupabaseAuthState } from '../../../lib/supabase';

export type BootstrapStep =
  | 'IDLE'
  | 'WAITING_AUTH'
  | 'AUTH_READY'
  | 'TENANT_RESOLVING'
  | 'TENANT_READY'
  | 'CHAT_RESOLVING'
  | 'BOOTSTRAP_READY'
  | 'AUTH_REQUIRED'
  | 'BOOTSTRAP_FAILED';

export interface BootstrapState {
  step: BootstrapStep;
  authReady: boolean;
  supabaseSessionPresent: boolean;
  canonicalUserId: string | null;
  tenantReady: boolean;
  storeId: string | null;
  organizationId: string | null;
  workspaceId: string | null;
  activeChatId: string | null;
  error?: string | null;
  generation: number;
}

export function assertTenantReadyInvariant(
  tenant: any,
  currentSessionKey?: string,
  currentGeneration?: number
): boolean {
  if (!tenant) return false;

  const rawStatus = (tenant.status || tenant.tenantState || tenant.overallStatus || tenant.storeStatus || '').toUpperCase();
  const forbiddenStates = [
    'BOOTING',
    'IN_FLIGHT',
    'PROVISIONING',
    'STALE',
    'FRESH',
    'PARTIAL',
    'ABORTED',
    'WAITING_AUTH',
    'TENANT_RESOLVING',
    'AUTHENTICATING',
    'IDLE',
    'STORE_RESOLVING',
    'UNAVAILABLE',
    'LOADING'
  ];
  if (forbiddenStates.includes(rawStatus)) return false;

  const isStatusReady = rawStatus === 'READY' || rawStatus === 'TENANT_READY';
  const isVerified = tenant.verified === true || tenant.tenantVerified === true;
  const hasOrgId = Boolean(tenant.organizationId && isValidUuid(tenant.organizationId) && tenant.organizationId !== '00000000-0000-0000-0000-000000000000');
  const hasWsId = Boolean(tenant.workspaceId && isValidUuid(tenant.workspaceId) && tenant.workspaceId !== '00000000-0000-0000-0000-000000000000');
  const hasStoreId = Boolean(tenant.storeId && isValidUuid(tenant.storeId));
  const hasUserId = Boolean((tenant.userId && isValidUuid(tenant.userId)) || (tenant.authUserId && isValidUuid(tenant.authUserId)));

  if (currentSessionKey && tenant.sessionKey && tenant.sessionKey !== currentSessionKey) return false;
  if (currentGeneration !== undefined && tenant.generation !== undefined && tenant.generation !== currentGeneration) return false;

  return Boolean(isStatusReady && isVerified && hasOrgId && hasWsId && hasStoreId && hasUserId);
}

function logBootTrace(step: string, meta?: any) {
  const t = Date.now();
  console.log(`[ZEGA_BOOT_TRACE] step: ${step} t=${t}`, meta || '');
}

class DashboardBootstrapCoordinator {
  private state: BootstrapState = {
    step: 'IDLE',
    authReady: false,
    supabaseSessionPresent: false,
    canonicalUserId: null,
    tenantReady: false,
    storeId: null,
    organizationId: null,
    workspaceId: null,
    activeChatId: null,
    error: null,
    generation: 1,
  };

  private listeners: Set<(state: BootstrapState) => void> = new Set();
  private bootstrapPromise: Promise<BootstrapState> | null = null;
  private currentAbortController: AbortController | null = null;
  private bootstrapGeneration: number = 1;
  private lastAssistantType: AssistantType = 'zega_copilot';
  private lastProvidedStoreId: string | null = null;
  private authSubscribed: boolean = false;

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener(): void {
    if (this.authSubscribed) return;
    this.authSubscribed = true;

    canonicalAuthManager.subscribe(() => {
      const authResult: CanonicalAuthResult = canonicalAuthManager.getSnapshot();
      console.log('[DASHBOARD_BOOTSTRAP_EVENT]', {
        action: 'AUTH_STATE_CHANGE',
        authStatus: authResult.status,
        sessionPresent: Boolean(authResult.session),
        authUserId: authResult.authUserId,
        currentStep: this.state.step,
        generation: this.bootstrapGeneration,
      });

      if (authResult.status === 'READY' && authResult.authUserId) {
        // Auto-resume bootstrap if stuck in WAITING_AUTH, IDLE, or BOOTSTRAP_FAILED due to auth
        if (
          this.state.step === 'WAITING_AUTH' ||
          this.state.step === 'IDLE' ||
          (this.state.step === 'BOOTSTRAP_FAILED' && this.state.error?.includes('Auth required'))
        ) {
          console.log('[DASHBOARD_BOOTSTRAP] Event-driven resume triggered for AUTH_READY (non-forcing)');
          this.executeBootstrap(this.lastAssistantType, this.lastProvidedStoreId, false);
        }
      } else if (authResult.initializationComplete && (authResult.status === 'AUTH_REQUIRED' || authResult.status === 'SESSION_INVALID')) {
        // Invalidate current bootstrap on explicit sign-out or terminal session loss
        this.bootstrapGeneration++;
        if (this.currentAbortController) {
          this.currentAbortController.abort();
          this.currentAbortController = null;
        }
        this.bootstrapPromise = null;

        this.updateState({
          step: 'AUTH_REQUIRED',
          authReady: false,
          supabaseSessionPresent: false,
          canonicalUserId: null,
          tenantReady: false,
          storeId: null,
          organizationId: null,
          workspaceId: null,
          activeChatId: null,
          error: 'Authentication required',
        });
      } else if (authResult.status === 'WAITING' || !authResult.initializationComplete) {
        if (this.state.step === 'IDLE' || !this.state.authReady) {
          this.updateState({
            step: 'WAITING_AUTH',
            authReady: false,
            supabaseSessionPresent: Boolean(authResult.session),
            error: null,
          });
        }
      }
    });
  }

  public getState(): BootstrapState {
    return { ...this.state };
  }

  public getGeneration(): number {
    return this.bootstrapGeneration;
  }

  public subscribe(listener: (state: BootstrapState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public updateState(partial: Partial<BootstrapState>): BootstrapState {
    const candidate: BootstrapState = {
      ...this.state,
      ...partial,
      generation: this.bootstrapGeneration,
    };

    if (
      this.state.step === candidate.step &&
      this.state.authReady === candidate.authReady &&
      this.state.supabaseSessionPresent === candidate.supabaseSessionPresent &&
      this.state.canonicalUserId === candidate.canonicalUserId &&
      this.state.tenantReady === candidate.tenantReady &&
      this.state.storeId === candidate.storeId &&
      this.state.organizationId === candidate.organizationId &&
      this.state.workspaceId === candidate.workspaceId &&
      this.state.activeChatId === candidate.activeChatId &&
      this.state.error === candidate.error
    ) {
      return this.state;
    }

    this.state = candidate;

    logBootTrace(this.state.step, {
      authReady: this.state.authReady,
      tenantReady: this.state.tenantReady,
      storeId: this.state.storeId,
      generation: this.bootstrapGeneration
    });

    console.log('[DASHBOARD_BOOTSTRAP]', {
      step: this.state.step,
      authState: this.state.authReady ? 'READY' : 'WAITING',
      sessionPresent: this.state.supabaseSessionPresent,
      authUserId: this.state.canonicalUserId,
      tenantReady: this.state.tenantReady,
      storeId: this.state.storeId,
      chatId: this.state.activeChatId,
      bootstrapGeneration: this.bootstrapGeneration,
      action: 'STATE_UPDATE',
    });

    this.notify();
    return this.getState();
  }

  /**
   * Singleflight event-driven dashboard bootstrap execution pipeline.
   * Order: WAITING_AUTH → AUTH_READY → TENANT_RESOLVING → TENANT_READY → BOOTSTRAP_READY
   */
  public async executeBootstrap(
    assistantType: AssistantType = 'zega_copilot',
    providedStoreId?: string | null,
    forceRefresh: boolean = false
  ): Promise<BootstrapState> {
    this.lastAssistantType = assistantType;
    if (providedStoreId !== undefined) this.lastProvidedStoreId = providedStoreId;

    if (!forceRefresh && this.state.step === 'BOOTSTRAP_READY' && this.state.tenantReady) {
      return this.getState();
    }

    if (this.bootstrapPromise) {
      return this.bootstrapPromise;
    }

    const authSnapshot = canonicalAuthManager.getSnapshot();
    const activeUserId = authSnapshot.authUserId;
    const currentSessionKey = activeUserId ? `${activeUserId}:INDIVIDUAL_UMKM` : null;

    // Fast-path: Only if tenant ready invariant is FULLY satisfied & verified by canonical auth/tenant context
    const activeTenant = getActiveTenantIds();
    if (!forceRefresh && assertTenantReadyInvariant(activeTenant, currentSessionKey || undefined, this.bootstrapGeneration)) {
      this.updateState({
        step: 'BOOTSTRAP_READY',
        authReady: true,
        supabaseSessionPresent: true,
        canonicalUserId: activeTenant.userId || null,
        tenantReady: true,
        storeId: activeTenant.storeId,
        organizationId: activeTenant.organizationId,
        workspaceId: activeTenant.workspaceId,
        error: null,
      });
      const currentGen = this.bootstrapGeneration;
      const ac = new AbortController();
      this.currentAbortController = ac;
      this.resolveBackgroundChat(assistantType, activeTenant.storeId!, currentGen, ac.signal);
      return this.getState();
    }

    // Only increment generation if forceRefresh is true OR session identity changed
    if (forceRefresh) {
      this.bootstrapGeneration++;
      if (this.currentAbortController) {
        this.currentAbortController.abort();
      }
    }
    const currentGen = this.bootstrapGeneration;
    const abortController = new AbortController();
    this.currentAbortController = abortController;

    this.bootstrapPromise = (async (): Promise<BootstrapState> => {
      try {
        logBootTrace('BOOTSTRAP_INITIATED', { assistantType, forceRefresh, generation: currentGen });

        // STEP 1: AUTH WAITING
        this.updateState({ step: 'WAITING_AUTH', error: null });

        const authResult: CanonicalAuthResult = await canonicalAuthManager.waitUntilReady(10000);

        if (currentGen !== this.bootstrapGeneration || abortController.signal.aborted) {
          console.log('[DASHBOARD_BOOTSTRAP] Aborted stale auth wait, generation:', currentGen);
          return this.getState();
        }

        if (authResult.status === 'WAITING' || authResult.status === 'EXTERNAL_AUTH') {
          console.warn('[DASHBOARD_BOOTSTRAP] Auth state is:', authResult.status, '. Pausing bootstrap until auth signals READY.');
          return this.updateState({
            step: 'WAITING_AUTH',
            authReady: false,
            supabaseSessionPresent: Boolean(authResult.session),
            canonicalUserId: authResult.authUserId,
            error: null,
          });
        }

        const isAuthValid = (authResult.status === 'READY' || authResult.identityReady) && Boolean(authResult.authUserId && isValidUuid(authResult.authUserId));

        if (!isAuthValid) {
          console.warn('[DASHBOARD_BOOTSTRAP] Auth required or invalid state:', authResult.status);
          return this.updateState({
            step: 'AUTH_REQUIRED',
            authReady: false,
            supabaseSessionPresent: Boolean(authResult.session),
            canonicalUserId: authResult.authUserId,
            error: `Auth required: ${authResult.status}`,
          });
        }

        // STEP 2: IDENTITY & AUTH READY
        logBootTrace('AUTH_READY', { authUserId: authResult.authUserId });
        this.updateState({
          step: 'AUTH_READY',
          authReady: true,
          supabaseSessionPresent: Boolean(authResult.session),
          canonicalUserId: authResult.authUserId,
        });

        // STEP 3: TENANT RESOLVING
        logBootTrace('TENANT_RESOLVING_START');
        this.updateState({ step: 'TENANT_RESOLVING' });

        const tenantCtx = await umkmSupabaseService.getCanonicalTenantContext(providedStoreId, { forceFresh: forceRefresh });

        if (currentGen !== this.bootstrapGeneration || abortController.signal.aborted) {
          console.log('[DASHBOARD_BOOTSTRAP] Aborted stale tenant resolution, generation:', currentGen);
          return this.getState();
        }

        const isTenantVerified = assertTenantReadyInvariant({
          ...tenantCtx,
          verified: tenantCtx.verified || tenantCtx.tenantVerified,
        });

        if (!isTenantVerified) {
          console.warn('[DASHBOARD_BOOTSTRAP] Tenant not verified yet:', tenantCtx.storeStatus);
          return this.updateState({
            step: 'BOOTSTRAP_FAILED',
            tenantReady: false,
            storeId: tenantCtx.storeId || null,
            organizationId: tenantCtx.organizationId || null,
            workspaceId: tenantCtx.workspaceId || null,
            error: `Tenant context incomplete or loading: ${tenantCtx.storeStatus}`,
          });
        }

        logBootTrace('TENANT_READY', { storeId: tenantCtx.storeId, orgId: tenantCtx.organizationId, wsId: tenantCtx.workspaceId });
        this.updateState({ step: 'TENANT_READY' });

        // Sync active tenant state safely
        setActiveTenant({
          organizationId: tenantCtx.organizationId || '',
          workspaceId: tenantCtx.workspaceId || '',
          storeId: tenantCtx.storeId,
          tenantType: 'umkm',
          userEmail: authResult.userEmail || '',
          userId: authResult.authUserId || '',
          storeStatus: 'ready',
          verified: true,
          tenantVerified: true,
        });

        // STEP 4: BOOTSTRAP_READY (SHELL READY FOR UI RENDER)
        logBootTrace('BOOTSTRAP_READY');
        const readyState = this.updateState({
          step: 'BOOTSTRAP_READY',
          tenantReady: true,
          storeId: tenantCtx.storeId,
          organizationId: tenantCtx.organizationId,
          workspaceId: tenantCtx.workspaceId,
          error: null,
        });

        // Non-blocking asynchronous AI chat session resolution
        this.resolveBackgroundChat(assistantType, tenantCtx.storeId || '', currentGen, abortController.signal);

        return readyState;
      } catch (err: any) {
        console.error('[DASHBOARD_BOOTSTRAP] Uncaught bootstrap exception:', err);
        return this.updateState({
          step: 'BOOTSTRAP_FAILED',
          error: err?.message || 'Bootstrap exception occurred',
        });
      } finally {
        this.bootstrapPromise = null;
      }
    })();

    return this.bootstrapPromise;
  }

  /**
   * Non-blocking background chat session resolution algorithm
   */
  private async resolveBackgroundChat(
    assistantType: AssistantType,
    storeId: string,
    generation: number,
    signal: AbortSignal
  ): Promise<void> {
    try {
      const activeToken = getCanonicalAccessToken();
      const authSnapshot = canonicalAuthManager.getSnapshot();
      const supaAuthState = await getSupabaseAuthState();

      if (!supaAuthState.sessionPresent) {
        console.log('[DASHBOARD_BOOTSTRAP] Deferring background chat resolution until valid Supabase auth session is ready.');
        return;
      }

      // Perform background resolution without changing step from BOOTSTRAP_READY
      const chatId = await chatSessionManager.restoreOrBootstrapAssistantSession(assistantType, storeId);

      if (generation !== this.bootstrapGeneration || signal.aborted) {
        console.log('[DASHBOARD_BOOTSTRAP] Discarding background chat resolution for stale generation');
        return;
      }

      if (chatId && isValidUuid(chatId)) {
        this.updateState({
          step: 'BOOTSTRAP_READY',
          activeChatId: chatId,
        });
      }
    } catch (e: any) {
        console.warn('[DASHBOARD_BOOTSTRAP] Non-blocking background chat resolution note:', e);
    }
  }

  public reset(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.bootstrapPromise = null;
    this.bootstrapGeneration++;
    this.state = {
      step: 'IDLE',
      authReady: false,
      supabaseSessionPresent: false,
      canonicalUserId: null,
      tenantReady: false,
      storeId: null,
      organizationId: null,
      workspaceId: null,
      activeChatId: null,
      error: null,
      generation: this.bootstrapGeneration,
    };
    this.notify();
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch {}
    });
  }
}

export const dashboardBootstrapCoordinator = new DashboardBootstrapCoordinator();
