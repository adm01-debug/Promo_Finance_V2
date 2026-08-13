/**
 * Concurrency Limiter Utility
 * Limits the number of concurrent asynchronous operations.
 */
export class ConcurrencyLimiter {
  private limit: number;
  private activeCount: number = 0;
  private queue: Array<() => void> = [];

  constructor(limit: number) {
    this.limit = limit;
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.limit) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    this.activeCount++;
    try {
      return await task();
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }
}
