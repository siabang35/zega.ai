import { canonicalAuthManager, CanonicalAuthState, CanonicalAuthResult } from '../../services/CanonicalAuthManager';
import { umkmSupabaseService, isValidUuid } from './umkmSupabaseService';
import { chatSessionManager, AssistantType } from './chatSessionManager';
import { setActiveTenant, getActiveTenantIds } from '../contexts/TenantContext';

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
          console.log('[DASHBOARD_BOOTSTRAP] Event-driven resume triggered for AUTH_READY');
          this.executeBootstrap(this.lastAssistantType, this.lastProvidedStoreId, true);
        }
      } else if (authResult.status === 'AUTH_REQUIRED' || authResult.status === 'SESSION_INVALID') {
        // Invalidate current bootstrap on sign-out or session loss
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
      } else if (authResult.status === 'WAITING') {
        if (this.state.step === 'IDLE' || !this.state.authReady) {
          this.updateState({
            step: 'WAITING_AUTH',
            authReady: false,
            supabaseSessionPresent: false,
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
   * Pipeline: AUTH_WAITING → AUTH_READY → TENANT_RESOLVING → TENANT_READY (BOOTSTRAP_READY Shell) → Non-blocking CHAT_RESOLVING
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

    // Increment generation & abort previous running execution controller
    this.bootstrapGeneration++;
    const currentGen = this.bootstrapGeneration;

    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    const abortController = new AbortController();
    this.currentAbortController = abortController;

    this.bootstrapPromise = (async (): Promise<BootstrapState> => {
      try {
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

        if (authResult.status !== 'READY' || !authResult.authUserId || !authResult.session) {
          console.warn('[DASHBOARD_BOOTSTRAP] Auth required or invalid state:', authResult.status);
          return this.updateState({
            step: 'AUTH_REQUIRED',
            authReady: false,
            supabaseSessionPresent: Boolean(authResult.session),
            canonicalUserId: authResult.authUserId,
            error: `Auth required: ${authResult.status}`,
          });
        }

        // STEP 2: IDENTITY & SUPABASE SESSION RESOLVED
        this.updateState({
          step: 'AUTH_READY',
          authReady: true,
          supabaseSessionPresent: Boolean(authResult.session),
          canonicalUserId: authResult.authUserId,
        });

        // STEP 3: TENANT RESOLVING
        this.updateState({ step: 'TENANT_RESOLVING' });

        const tenantCtx = await umkmSupabaseService.getCanonicalTenantContext(providedStoreId);

        if (currentGen !== this.bootstrapGeneration || abortController.signal.aborted) {
          console.log('[DASHBOARD_BOOTSTRAP] Aborted stale tenant resolution, generation:', currentGen);
          return this.getState();
        }

        const isTenantVerified = Boolean(
          tenantCtx.verified &&
          isValidUuid(tenantCtx.storeId) &&
          isValidUuid(tenantCtx.organizationId) &&
          isValidUuid(tenantCtx.workspaceId)
        );

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

        // Sync active tenant state
        setActiveTenant({
          organizationId: tenantCtx.organizationId || '',
          workspaceId: tenantCtx.workspaceId || '',
          storeId: tenantCtx.storeId,
          tenantType: 'umkm',
          userEmail: authResult.userEmail || '',
          userId: authResult.authUserId,
          storeStatus: 'ready',
          verified: true,
          tenantVerified: true,
        });

        // STEP 4: TENANT READY -> DASHBOARD SHELL BOOTSTRAP_READY (NON-BLOCKING FOR AI/CHAT)
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
      this.updateState({ step: 'CHAT_RESOLVING' });
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
      } else {
        console.warn('[DASHBOARD_BOOTSTRAP] Background chat resolution returned null chatId');
        this.updateState({ step: 'BOOTSTRAP_READY' });
      }
    } catch (e: any) {
      console.warn('[DASHBOARD_BOOTSTRAP] Non-blocking background chat resolution note:', e);
      this.updateState({ step: 'BOOTSTRAP_READY' });
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
