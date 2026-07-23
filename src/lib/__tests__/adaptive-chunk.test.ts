import { describe, it, expect } from 'vitest';
import { createAdaptiveChunkController, type AdaptiveAdjustment } from '../adaptive-chunk';

describe('adaptive-chunk (AIMD)', () => {
  it('respeita clamp inicial entre min e max', () => {
    const c = createAdaptiveChunkController({ initial: 999, min: 5, max: 20 });
    expect(c.size()).toBe(20);
    const c2 = createAdaptiveChunkController({ initial: 1, min: 5, max: 20 });
    expect(c2.size()).toBe(5);
  });

  it('cresce aditivamente quando latência ≤ alvo', () => {
    const events: AdaptiveAdjustment[] = [];
    const c = createAdaptiveChunkController({
      initial: 10, min: 2, max: 50, targetLatencyPerItemMs: 100, increaseStep: 5,
      onAdjust: (e) => events.push(e),
    });
    c.report({ batchSize: 10, durationMs: 500 }); // 50ms/item
    expect(c.size()).toBe(15);
    expect(events[0].reason).toBe('increase');
  });

  it('reduz multiplicativamente quando latência acima da tolerância', () => {
    const c = createAdaptiveChunkController({
      initial: 20, min: 2, max: 50, targetLatencyPerItemMs: 100, tolerance: 1.5, decreaseFactor: 0.5,
    });
    c.report({ batchSize: 20, durationMs: 20 * 300 }); // 300ms/item > 150
    expect(c.size()).toBe(10);
  });

  it('reduz agressivo quando taxa de falhas excede threshold', () => {
    const events: AdaptiveAdjustment[] = [];
    const c = createAdaptiveChunkController({
      initial: 20, min: 2, max: 50, failureThreshold: 0.1, decreaseFactor: 0.5,
      onAdjust: (e) => events.push(e),
    });
    c.report({ batchSize: 20, durationMs: 100, failed: 5 }); // 25% falhas
    expect(events[0].reason).toBe('decrease-failures');
    expect(c.size()).toBe(10);
  });

  it('mantém tamanho na zona morta (entre alvo e tolerance*alvo)', () => {
    const c = createAdaptiveChunkController({
      initial: 10, min: 2, max: 50, targetLatencyPerItemMs: 100, tolerance: 1.5,
    });
    c.report({ batchSize: 10, durationMs: 10 * 130 }); // 130ms/item — entre 100 e 150
    expect(c.size()).toBe(10);
    expect(c.snapshot().lastPerItemMs).toBe(130);
  });

  it('nunca cresce acima de max nem reduz abaixo de min', () => {
    const c = createAdaptiveChunkController({ initial: 4, min: 2, max: 5, targetLatencyPerItemMs: 100 });
    // várias rodadas rápidas
    for (let i = 0; i < 10; i++) c.report({ batchSize: c.size(), durationMs: c.size() * 10 });
    expect(c.size()).toBeLessThanOrEqual(5);
    // força falhas
    for (let i = 0; i < 10; i++) c.report({ batchSize: c.size(), durationMs: 1, failed: c.size() });
    expect(c.size()).toBeGreaterThanOrEqual(2);
  });
});
