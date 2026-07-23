import { describe, it, expect } from 'vitest';
import { createConcurrencyLimiter, runWithConcurrency } from '../concurrency-limiter';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('concurrency-limiter', () => {
  it('nunca ultrapassa o limite configurado', async () => {
    const limiter = createConcurrencyLimiter(3);
    let inFlight = 0;
    let peak = 0;
    const tasks = Array.from({ length: 20 }, () =>
      limiter.run(async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await wait(5);
        inFlight--;
      }),
    );
    await Promise.all(tasks);
    expect(peak).toBeLessThanOrEqual(3);
    expect(limiter.active()).toBe(0);
    expect(limiter.pending()).toBe(0);
  });

  it('setLimit aumenta libera tarefas pendentes imediatamente', async () => {
    const limiter = createConcurrencyLimiter(1);
    let running = 0;
    let peak = 0;
    const tasks = Array.from({ length: 6 }, () =>
      limiter.run(async () => {
        running++;
        peak = Math.max(peak, running);
        await wait(20);
        running--;
      }),
    );
    await wait(1);
    limiter.setLimit(4);
    await Promise.all(tasks);
    expect(peak).toBeGreaterThanOrEqual(2);
    expect(peak).toBeLessThanOrEqual(4);
  });

  it('setLimit trata valores inválidos (mínimo 1)', () => {
    const limiter = createConcurrencyLimiter(5);
    limiter.setLimit(0);
    expect(limiter.limit()).toBe(1);
    limiter.setLimit(-10);
    expect(limiter.limit()).toBe(1);
  });

  it('runWithConcurrency retorna allSettled preservando ordem', async () => {
    const results = await runWithConcurrency([1, 2, 3, 4], 2, async (n) => {
      if (n === 3) throw new Error('boom');
      return n * 10;
    });
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual({ status: 'fulfilled', value: 10 });
    expect(results[2].status).toBe('rejected');
  });

  it('propaga exceções da task e libera o slot', async () => {
    const limiter = createConcurrencyLimiter(1);
    await expect(
      limiter.run(async () => {
        throw new Error('x');
      }),
    ).rejects.toThrow('x');
    expect(limiter.active()).toBe(0);
    // slot livre — próxima roda normal
    await expect(limiter.run(async () => 42)).resolves.toBe(42);
  });
});
