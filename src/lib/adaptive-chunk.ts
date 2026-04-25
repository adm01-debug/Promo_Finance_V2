/**
 * Controlador de tamanho de lote adaptativo (AIMD — Additive Increase, Multiplicative Decrease).
 *
 * Ajusta dinamicamente o `chunkSize` usado em loops de processamento paralelo
 * de acordo com o desempenho observado do backend:
 *   - Latência por item baixa e sem falhas  → cresce aditivamente (até `max`).
 *   - Latência alta ou falhas               → reduz multiplicativamente (até `min`).
 *
 * Inspirado em algoritmos de controle de congestionamento (TCP Reno) e nas
 * heurísticas de auto-tuning usadas por workers de fila (e.g. Sidekiq, BullMQ).
 *
 * Uso típico:
 * ```ts
 * const ctl = createAdaptiveChunkController({ initial: 10, min: 2, max: 50 });
 * for (let i = 0; i < total; ) {
 *   const size = ctl.size();
 *   const slice = items.slice(i, i + size);
 *   const t0 = performance.now();
 *   const results = await Promise.allSettled(slice.map(processItem));
 *   const failed = results.filter(r => r.status === "rejected").length;
 *   ctl.report({ batchSize: slice.length, durationMs: performance.now() - t0, failed });
 *   i += slice.length;
 * }
 * ```
 */

export interface AdaptiveChunkOptions {
  /** Tamanho inicial do lote. Default: 10. */
  initial?: number;
  /** Tamanho mínimo (nunca reduz abaixo disso). Default: 2. */
  min?: number;
  /** Tamanho máximo (nunca cresce acima disso). Default: 50. */
  max?: number;
  /**
   * Latência-alvo *por item* em ms. Lotes acima desse alvo são considerados
   * "lentos" e disparam redução. Default: 250 ms/item.
   */
  targetLatencyPerItemMs?: number;
  /**
   * Tolerância de latência: lotes com latência por item até
   * `targetLatencyPerItemMs * tolerance` mantêm o tamanho atual sem crescer.
   * Default: 1.5 (i.e. zona morta entre alvo e 1.5× alvo).
   */
  tolerance?: number;
  /** Quanto somar ao crescer. Default: 2. */
  increaseStep?: number;
  /** Fator multiplicativo ao reduzir (0..1). Default: 0.5. */
  decreaseFactor?: number;
  /**
   * Taxa de falhas a partir da qual o controlador força redução agressiva
   * (independente da latência). Default: 0.1 (10%).
   */
  failureThreshold?: number;
  /** Logger opcional para inspeção/telemetria. */
  onAdjust?: (info: AdaptiveAdjustment) => void;
}

export interface BatchReport {
  batchSize: number;
  durationMs: number;
  failed?: number;
}

export interface AdaptiveAdjustment {
  previous: number;
  next: number;
  reason: "increase" | "hold" | "decrease-latency" | "decrease-failures";
  perItemMs: number;
  failureRate: number;
}

export interface AdaptiveChunkController {
  /** Tamanho recomendado para o próximo lote. */
  size: () => number;
  /** Reporta o resultado do último lote — atualiza `size()` para o próximo. */
  report: (r: BatchReport) => void;
  /** Snapshot do estado atual (útil para UI/telemetria). */
  snapshot: () => Readonly<{ current: number; lastPerItemMs: number; lastFailureRate: number }>;
}

export function createAdaptiveChunkController(
  options: AdaptiveChunkOptions = {},
): AdaptiveChunkController {
  const min = Math.max(1, options.min ?? 2);
  const max = Math.max(min, options.max ?? 50);
  const target = Math.max(1, options.targetLatencyPerItemMs ?? 250);
  const tolerance = Math.max(1, options.tolerance ?? 1.5);
  const increaseStep = Math.max(1, options.increaseStep ?? 2);
  const decreaseFactor = Math.min(0.95, Math.max(0.1, options.decreaseFactor ?? 0.5));
  const failureThreshold = Math.min(1, Math.max(0, options.failureThreshold ?? 0.1));

  let current = clamp(options.initial ?? 10, min, max);
  let lastPerItemMs = 0;
  let lastFailureRate = 0;

  return {
    size: () => current,
    snapshot: () => ({ current, lastPerItemMs, lastFailureRate }),
    report: ({ batchSize, durationMs, failed = 0 }) => {
      const safeBatch = Math.max(1, batchSize);
      const perItem = durationMs / safeBatch;
      const failureRate = failed / safeBatch;
      lastPerItemMs = perItem;
      lastFailureRate = failureRate;

      const previous = current;
      let next = current;
      let reason: AdaptiveAdjustment["reason"] = "hold";

      if (failureRate >= failureThreshold) {
        // Backend sob estresse / erros — recua de forma agressiva.
        next = clamp(Math.floor(current * decreaseFactor), min, max);
        reason = "decrease-failures";
      } else if (perItem > target * tolerance) {
        // Acima da tolerância de latência — recua multiplicativamente.
        next = clamp(Math.floor(current * decreaseFactor), min, max);
        reason = "decrease-latency";
      } else if (perItem <= target) {
        // Dentro do alvo — cresce aditivamente.
        next = clamp(current + increaseStep, min, max);
        reason = next === current ? "hold" : "increase";
      } else {
        // Zona morta (entre alvo e tolerance*alvo): mantém.
        reason = "hold";
      }

      current = next;
      options.onAdjust?.({ previous, next, reason, perItemMs: perItem, failureRate });
    },
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Math.floor(n)));
}
