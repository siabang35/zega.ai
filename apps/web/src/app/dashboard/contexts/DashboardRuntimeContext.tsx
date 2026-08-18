/**
 * DashboardRuntimeContext.tsx — Dashboard Bootstrap & Orchestrator Provider
 * 
 * Provides:
 * 1. Single dashboard orchestration runtime layer
 * 2. Granular loading state hierarchy: APP_BOOTSTRAP | TENANT_RESOLVING | DASHBOARD_CRITICAL | DASHBOARD_BACKGROUND
 * 3. Decouples child consumers (HomeView, Copilot, AI Assistant) from triggering tenant resolution
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuthorizedUmkmContext, useTenant, TenantIds, AuthorizedUmkmContext } from './TenantContext';
import { globalScheduler } from '../services/requestScheduler';
import { telemetry } from '../services/telemetry';

export type DashboardLoadingPhase = 
  | 'APP_BOOTSTRAP'
  | 'TENANT_RESOLVING'
  | 'DASHBOARD_CRITICAL'
  | 'DASHBOARD_BACKGROUND'
  | 'READY';

export interface DashboardRuntimeContextValue {
  phase: DashboardLoadingPhase;
  isCriticalReady: boolean;
  isBackgroundReady: boolean;
  tenant: TenantIds;
  authorizedContext: AuthorizedUmkmContext;
  refetchCriticalData: () => Promise<void>;
}

const DashboardRuntimeReactContext = createContext<DashboardRuntimeContextValue | null>(null);

export function DashboardRuntimeProvider({ children }: { children: React.ReactNode }) {
  const tenant = useTenant();
  const authCtx = useAuthorizedUmkmContext();

  const [isCriticalReady, setIsCriticalReady] = useState(false);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);

  const phase: DashboardLoadingPhase = useMemo(() => {
    if (!authCtx.authReady) {
      return 'APP_BOOTSTRAP';
    }
    if (authCtx.status === 'TENANT_RESOLVING' || authCtx.status === 'BOOTING') {
      return 'TENANT_RESOLVING';
    }
    if (!isCriticalReady) {
      return 'DASHBOARD_CRITICAL';
    }
    if (!isBackgroundReady) {
      return 'DASHBOARD_BACKGROUND';
    }
    return 'READY';
  }, [authCtx.authReady, authCtx.status, isCriticalReady, isBackgroundReady]);

  // Priority-scheduled P0/P1 data hydration
  useEffect(() => {
    if (authCtx.authReady && authCtx.status === 'READY' && tenant.storeStatus === 'ready') {
      telemetry.mark('tenantReady');
      globalScheduler.schedule(
        `dashboard:critical:${tenant.storeId}`,
        'P1',
        async () => {
          telemetry.mark('dashboardCriticalStart');
          setIsCriticalReady(true);
          telemetry.mark('dashboardCriticalEnd');
          telemetry.measure('dashboardP0Ms', 'tenantReady', 'dashboardCriticalEnd');
        }
      );

      // P3 background prefetch
      globalScheduler.schedule(
        `dashboard:background:${tenant.storeId}`,
        'P3',
        async () => {
          setIsBackgroundReady(true);
        }
      );
    }
  }, [authCtx.authReady, authCtx.status, tenant.storeStatus, tenant.storeId]);

  const refetchCriticalData = async () => {
    setIsCriticalReady(false);
    await globalScheduler.schedule(
      `dashboard:critical:${tenant.storeId}`,
      'P0',
      async () => {
        setIsCriticalReady(true);
      }
    );
  };

  const value = useMemo<DashboardRuntimeContextValue>(() => ({
    phase,
    isCriticalReady,
    isBackgroundReady,
    tenant,
    authorizedContext: authCtx,
    refetchCriticalData
  }), [phase, isCriticalReady, isBackgroundReady, tenant, authCtx]);

  return (
    <DashboardRuntimeReactContext.Provider value={value}>
      {children}
    </DashboardRuntimeReactContext.Provider>
  );
}

export function useDashboardRuntime(): DashboardRuntimeContextValue {
  const ctx = useContext(DashboardRuntimeReactContext);
  if (!ctx) {
    throw new Error('useDashboardRuntime must be used within a DashboardRuntimeProvider');
  }
  return ctx;
}

export function useCanonicalTenant(): TenantIds {
  const { tenant } = useDashboardRuntime();
  return tenant;
}
