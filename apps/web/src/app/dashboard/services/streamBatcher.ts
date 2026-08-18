/**
 * streamBatcher.ts — Frame-Aligned AI Token Streaming Batcher
 * 
 * Prevents raw AI stream tokens from triggering hundreds of individual React state renders.
 * Batches incoming token chunks into frame-aligned updates using requestAnimationFrame.
 */

export interface StreamBatcherOptions {
  onFlush: (accumulatedText: string) => void;
  frameRateTarget?: number;
}

export class StreamBatcher {
  private pendingText = '';
  private animationFrameId: number | null = null;
  private onFlush: (text: string) => void;
  private isDestroyed = false;

  constructor(options: StreamBatcherOptions) {
    this.onFlush = options.onFlush;
  }

  public append(chunk: string): void {
    if (this.isDestroyed || !chunk) return;
    this.pendingText += chunk;

    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  public flush(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.pendingText && !this.isDestroyed) {
      this.onFlush(this.pendingText);
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.pendingText = '';
  }
}
