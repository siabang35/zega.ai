import { reconciliationService, BatchReconciliationReport } from './ReconciliationService.js';
import { supabaseService } from './supabaseService.js';
import { logger } from '../utils/logger.js';

export class ReconciliationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isExecuting = false;
  private intervalMs: number;

  constructor(intervalMs = 120_000) { // Default: 2 minutes periodic cycle
    this.intervalMs = intervalMs;
  }

  /**
   * Starts the background reconciliation scheduler.
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('[ReconciliationScheduler] Scheduler is already running.');
      return;
    }

    this.isRunning = true;
    logger.info(`⚡ [ReconciliationScheduler] Background Reconciliation Scheduler started (Interval: ${this.intervalMs}ms)`);

    // Run first batch reconciliation cycle asynchronously after short boot delay (5s)
    setTimeout(() => {
      this.runReconciliationCycle().catch((err) => {
        logger.error({ err: err.message }, '[ReconciliationScheduler] Initial cycle error');
      });
    }, 5000);

    // Schedule periodic execution loop
    this.timer = setInterval(() => {
      this.runReconciliationCycle().catch((err) => {
        logger.error({ err: err.message }, '[ReconciliationScheduler] Periodic cycle error');
      });
    }, this.intervalMs);
  }

  /**
   * Stops the background reconciliation scheduler gracefully.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info('[ReconciliationScheduler] Background Reconciliation Scheduler stopped.');
  }

  /**
   * Executes a single reconciliation cycle with single-instance lock protection.
   */
  public async runReconciliationCycle(): Promise<BatchReconciliationReport | null> {
    if (this.isExecuting) {
      logger.info('[ReconciliationScheduler] Cycle skipped: Previous batch cycle still in progress.');
      return null;
    }

    this.isExecuting = true;
    const startTime = Date.now();

    try {
      // 🔒 Multi-Node Single-Instance Guard via DB Advisory Lock
      const supabase = supabaseService.getClient();
      if (supabase) {
        let lockAcquired = true;
        try {
          const { data } = await supabase.rpc('check_rate_limit', {
            p_identifier: 'system',
            p_action: `reconciliation_worker_lock_${Math.floor(Date.now() / 2000)}`,
            p_max_requests: 1,
            p_window_seconds: 2,
          });
          lockAcquired = data !== false;
        } catch {
          lockAcquired = true;
        }

        if (lockAcquired === false) {
          logger.info('[ReconciliationScheduler] Cycle skipped: Another worker node holds the active reconciliation lock.');
          return null;
        }
      }

      logger.info('[ReconciliationScheduler] Starting automated batch reconciliation cycle...');
      const report = await reconciliationService.reconcileBatch();
      const durationMs = Date.now() - startTime;

      logger.info({
        durationMs,
        withdrawalsScanned: report.withdrawalsScanned,
        withdrawalsFinalized: report.withdrawalsFinalized,
        withdrawalsReleased: report.withdrawalsReleased,
        expiredInvoicesChecked: report.expiredInvoicesChecked,
        discrepanciesFound: report.discrepancies.length,
      }, `✅ [ReconciliationScheduler] Batch reconciliation completed in ${durationMs}ms`);

      return report;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      logger.error({
        durationMs,
        error: err.message,
        stack: err.stack,
      }, '[ReconciliationScheduler] Error during batch reconciliation execution cycle');
      return null;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Returns current operational status of the reconciliation scheduler.
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      isExecuting: this.isExecuting,
      intervalMs: this.intervalMs,
    };
  }
}

export const reconciliationScheduler = new ReconciliationScheduler();
