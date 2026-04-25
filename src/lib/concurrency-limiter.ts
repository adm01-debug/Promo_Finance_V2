/**
 * Semáforo assíncrono simples — limita o número de tarefas executando em paralelo.
 *
 * Útil em conjunto com `createAdaptiveChunkController` quando o tamanho do lote
 * deve crescer (para amortizar overhead) mas a quantidade real de requests
 * simultâneos contra o backend precisa ficar limitada para não sobrecarregar
 * conexões / RLS / connection pool.
 *
 * Uso:
 * ```ts
 * const limit = createConcurrencyLimiter(4);
 * await Promise.all(items.map((it) => limit(() => process(it))));
 * ```
 */

export type LimitedRunner = <T>(task: () => Promise<T>) => Promise<T>;

export interface ConcurrencyLimiter {
  /** Executa `task` respeitando o limite de concorrência atual. */
  run: LimitedRunner;
  /** Quantidade de tarefas atualmente em execução. */
  active: () => number;
  /** Quantidade de tarefas aguardando slot. */
  pending: () => number;
  /** Limite atual. */
  limit: () => number;
  /**
   * Ajusta o limite em tempo de execução. Aumentar libera tarefas pendentes
   * imediatamente; reduzir só passa a valer para próximas chamadas a `run`.
   */
  setLimit: (next: number) => void;
}

export function createConcurrencyLimiter(initialLimit: number): ConcurrencyLimiter {
  let max = Math.max(1, Math.floor(initialLimit));
  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    while (active < max && queue.length > 0) {
      const release = queue.shift()!;
      active++;
      release();
    }
  };

  const acquire = (): Promise<void> =>
    new Promise<void>((resolve) => {
      queue.push(resolve);
      next();
    });

  const run: LimitedRunner = async (task) => {
    await acquire();
    try {
      return await task();
    } finally {
      active--;
      next();
    }
  };

  return {
    run,
    active: () => active,
    pending: () => queue.length,
    limit: () => max,
    setLimit: (n: number) => {
      max = Math.max(1, Math.floor(n));
      next();
    },
  };
}

/** Helper conveniente — executa uma lista respeitando o limite, com `Promise.allSettled`. */
export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number | ConcurrencyLimiter,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const limiter = typeof limit === "number" ? createConcurrencyLimiter(limit) : limit;
  return Promise.allSettled(items.map((it, i) => limiter.run(() => fn(it, i))));
}
