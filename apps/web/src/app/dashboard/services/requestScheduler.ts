/**
 * requestScheduler.ts — Single-Flight Registries & Priority Request Scheduler
 * 
 * Provides:
 * 1. Keyed In-Flight Registries (tenantFlights, chatFlights, dashboardFlights, profileFlights, analyticsFlights)
 * 2. Priority Request Scheduling (P0: Auth/Tenant, P1: Chat/Critical, P2: Widgets, P3: Analytics/Prefetch, P4: Background)
 * 3. Adaptive Concurrency (Connection-aware & Visibility-aware execution slots)
 * 4. Cancellation & Generation-based Backpressure
 */

export type RequestPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface ScheduledTask<T> {
  id: string;
  key: string;
  priority: RequestPriority;
  execute: (signal?: AbortSignal) => Promise<T>;
  abortController?: AbortController;
  timestamp: number;
}

// ============================================================================
// Single-Flight Keyed In-Flight Registries
// ============================================================================

class KeyedFlightRegistry {
  private flights = new Map<string, Promise<any>>();

  public coalesced<T>(key: string, task: () => Promise<T>): Promise<T> {
    if (this.flights.has(key)) {
      return this.flights.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await task();
      } finally {
        this.flights.delete(key);
      }
    })();

    this.flights.set(key, promise);
    return promise;
  }

  public isFlightActive(key: string): boolean {
    return this.flights.has(key);
  }

  public cancelFlight(key: string): void {
    this.flights.delete(key);
  }

  public clearAll(): void {
    this.flights.clear();
  }
}

export const tenantFlights = new KeyedFlightRegistry();
export const chatFlights = new KeyedFlightRegistry();
export const dashboardFlights = new KeyedFlightRegistry();
export const profileFlights = new KeyedFlightRegistry();
export const analyticsFlights = new KeyedFlightRegistry();

// ============================================================================
// Priority Request Scheduler Engine
// ============================================================================

const PRIORITY_WEIGHTS: Record<RequestPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4
};

class PriorityRequestScheduler {
  private activeCount = 0;
  private queue: ScheduledTask<any>[] = [];

  /** Derive max concurrent requests based on connection & visibility */
  private getMaxConcurrency(): number {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return 2; // Deprioritize when tab is backgrounded
    }

    const conn = (typeof navigator !== 'undefined' && (navigator as any).connection) || null;
    if (conn) {
      if (conn.saveData) return 2;
      const effType = conn.effectiveType;
      if (effType === 'slow-2g' || effType === '2g') return 2;
      if (effType === '3g') return 4;
    }
    return 6; // Standard fast path limit
  }

  public schedule<T>(
    key: string,
    priority: RequestPriority,
    execute: (signal?: AbortSignal) => Promise<T>,
    abortController?: AbortController
  ): Promise<T> {
    // P0 requests run immediately without queue delay
    if (priority === 'P0') {
      return execute(abortController?.signal);
    }

    return new Promise<T>((resolve, reject) => {
      const task: ScheduledTask<T> = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        key,
        priority,
        execute: async (signal) => {
          try {
            const res = await execute(signal);
            resolve(res);
            return res;
          } catch (err) {
            reject(err);
            throw err;
          }
        },
        abortController,
        timestamp: Date.now()
      };

      // Cancel older tasks with identical key if queued
      this.cancelDuplicateKeyTasks(key);

      this.queue.push(task);
      this.queue.sort((a, b) => PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority]);
      this.processQueue();
    });
  }

  private cancelDuplicateKeyTasks(key: string): void {
    const remaining: ScheduledTask<any>[] = [];
    for (const item of this.queue) {
      if (item.key === key && item.priority !== 'P0') {
        item.abortController?.abort();
      } else {
        remaining.push(item);
      }
    }
    this.queue = remaining;
  }

  private async processQueue(): Promise<void> {
    const maxSlots = this.getMaxConcurrency();
    while (this.activeCount < maxSlots && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      if (task.abortController?.signal.aborted) {
        continue;
      }

      this.activeCount++;
      (async () => {
        try {
          await task.execute(task.abortController?.signal);
        } catch {
        } finally {
          this.activeCount--;
          this.processQueue();
        }
      })();
    }
  }

  public purgeQueue(priorityFilter?: RequestPriority): void {
    if (!priorityFilter) {
      this.queue.forEach(t => t.abortController?.abort());
      this.queue = [];
    } else {
      this.queue = this.queue.filter(t => {
        if (t.priority === priorityFilter) {
          t.abortController?.abort();
          return false;
        }
        return true;
      });
    }
  }
}

export const globalScheduler = new PriorityRequestScheduler();
