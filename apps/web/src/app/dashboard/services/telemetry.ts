/**
 * telemetry.ts — Performance Telemetry & Metrics Instrumentation
 * 
 * Tracks timings for tenant resolution, dashboard hydration, chat creation, and AI streaming.
 */

export interface TelemetryMetrics {
  appShellMs?: number;
  authReadyMs?: number;
  tenantReadyMs?: number;
  dashboardP0Ms?: number;
  dashboardInteractiveMs?: number;
  chatReadyMs?: number;
  aiContextMs?: number;
  aiRequestStartMs?: number;
  aiFirstTokenMs?: number;
  aiStreamMs?: number;
  aiPersistMs?: number;
  aiTotalMs?: number;
}

export type PerfStageTag =
  | 'AUTH'
  | 'IDENTITY'
  | 'TENANT'
  | 'CHAT'
  | 'CONTEXT'
  | 'ROUTER'
  | 'MODEL'
  | 'STREAM'
  | 'RENDER';

class TelemetryTracker {
  private metrics: TelemetryMetrics = {};
  private marks = new Set<string>();
  private stageStarts = new Map<PerfStageTag, number>();

  public mark(name: string): void {
    if (typeof performance === 'undefined') return;
    try {
      performance.mark(name);
      this.marks.add(name);
    } catch {}
  }

  public measure(measureName: string, startMark: string, endMark: string): number | null {
    if (typeof performance === 'undefined') return null;
    try {
      if (!this.marks.has(startMark) || !this.marks.has(endMark)) {
        return null;
      }
      performance.measure(measureName, startMark, endMark);
      const entries = performance.getEntriesByName(measureName, 'measure');
      if (entries.length > 0) {
        const duration = Math.round(entries[entries.length - 1].duration);
        (this.metrics as any)[measureName] = duration;
        return duration;
      }
    } catch {}
    return null;
  }

  public startStage(stage: PerfStageTag): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.stageStarts.set(stage, now);
    this.mark(`start_${stage.toLowerCase()}`);
  }

  public endStage(stage: PerfStageTag, extraCtx?: Record<string, any>): number {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const start = this.stageStarts.get(stage);
    const durationMs = start !== undefined ? Math.round(now - start) : 0;
    this.mark(`end_${stage.toLowerCase()}`);
    this.stageStarts.delete(stage);

    console.log(`[PERF_${stage}]`, { durationMs, ...extraCtx });
    return durationMs;
  }

  public logSummary(): void {
    console.log('[PERFORMANCE_TELEMETRY]', this.metrics);
  }

  public getMetrics(): TelemetryMetrics {
    return { ...this.metrics };
  }
}

export const telemetry = new TelemetryTracker();
