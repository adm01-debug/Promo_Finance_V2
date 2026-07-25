import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reset module state between tests (buffer + hydratedFromStorage são singletons)
async function freshModule() {
  vi.resetModules();
  return await import('../filterHydrationTelemetry');
}

// localStorage real in-memory para superar o mock global stateless
function installStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  const mock: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    key: (i) => Array.from(store.keys())[i] ?? null,
  };
  Object.defineProperty(window, 'localStorage', { value: mock, configurable: true, writable: true });
  return store;
}

describe('filterHydrationTelemetry', () => {
  beforeEach(() => installStorage());

  it('registra evento com timestamp ISO', async () => {
    const m = await freshModule();
    m.recordHydrationEvent({ entityType: 'clientes', status: 'success', source: 'supabase' });
    const events = m.getHydrationEvents();
    expect(events).toHaveLength(1);
    expect(events[0].entityType).toBe('clientes');
    expect(() => new Date(events[0].at).toISOString()).not.toThrow();
  });

  it('filtra falhas via getHydrationFailures', async () => {
    const m = await freshModule();
    m.recordHydrationEvent({ entityType: 'a', status: 'success', source: 'supabase' });
    m.recordHydrationEvent({ entityType: 'b', status: 'error', source: 'none', errorMessage: 'x', stage: 'supabase-read' });
    m.recordHydrationEvent({ entityType: 'c', status: 'error', source: 'localStorage', stage: 'merge' });
    const fails = m.getHydrationFailures();
    expect(fails).toHaveLength(2);
    expect(fails.every((e) => e.status === 'error')).toBe(true);
  });

  it('mantém buffer FIFO limitado a 100 eventos', async () => {
    const m = await freshModule();
    for (let i = 0; i < 120; i++) {
      m.recordHydrationEvent({ entityType: `e${i}`, status: 'success', source: 'defaults' });
    }
    const events = m.getHydrationEvents();
    expect(events).toHaveLength(100);
    expect(events[0].entityType).toBe('e20');
    expect(events[99].entityType).toBe('e119');
  });

  it('persiste no localStorage e reidrata em módulo novo', async () => {
    const m1 = await freshModule();
    m1.recordHydrationEvent({ entityType: 'x', status: 'error', source: 'none', errorMessage: 'boom' });
    const raw = window.localStorage.getItem('filter-hydration-events');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);

    const m2 = await freshModule();
    const events = m2.getHydrationEvents();
    expect(events).toHaveLength(1);
    expect(events[0].entityType).toBe('x');
  });

  it('ignora storage inválido silenciosamente', async () => {
    installStorage({ 'filter-hydration-events': '{{ invalid json' });
    const m = await freshModule();
    expect(m.getHydrationEvents()).toEqual([]);
  });

  it('descarta entradas malformadas ao reidratar', async () => {
    installStorage({
      'filter-hydration-events': JSON.stringify([
        { entityType: 'ok', status: 'success', source: 'supabase', at: new Date().toISOString() },
        { foo: 'bar' },
        null,
        'string',
      ]),
    });
    const m = await freshModule();
    const events = m.getHydrationEvents();
    expect(events).toHaveLength(1);
    expect(events[0].entityType).toBe('ok');
  });

  it('subscribeHydrationEvents entrega snapshot inicial via microtask', async () => {
    const m = await freshModule();
    m.recordHydrationEvent({ entityType: 'seed', status: 'success', source: 'supabase' });
    const listener = vi.fn();
    m.subscribeHydrationEvents(listener);
    expect(listener).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toHaveLength(1);
  });

  it('notifica listeners em novos eventos e para de notificar após unsubscribe', async () => {
    const m = await freshModule();
    const listener = vi.fn();
    const unsub = m.subscribeHydrationEvents(listener);
    await Promise.resolve(); // consome disparo inicial
    m.recordHydrationEvent({ entityType: 'novo', status: 'success', source: 'defaults' });
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    m.recordHydrationEvent({ entityType: 'outro', status: 'success', source: 'defaults' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('isola erro em listener sem derrubar os demais', async () => {
    const m = await freshModule();
    let calls = 0;
    const bad = vi.fn(() => { calls++; if (calls > 1) throw new Error('listener crash'); });
    const good = vi.fn();
    m.subscribeHydrationEvents(bad);
    m.subscribeHydrationEvents(good);
    await Promise.resolve();
    m.recordHydrationEvent({ entityType: 'z', status: 'success', source: 'supabase' });
    expect(bad).toHaveBeenCalledTimes(2);
    expect(good).toHaveBeenCalledTimes(2);
  });

  it('clearHydrationEvents esvazia buffer, persiste e notifica', async () => {
    const m = await freshModule();
    m.recordHydrationEvent({ entityType: 'a', status: 'success', source: 'supabase' });
    const listener = vi.fn();
    m.subscribeHydrationEvents(listener);
    await Promise.resolve();
    m.clearHydrationEvents();
    expect(m.getHydrationEvents()).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem('filter-hydration-events')!)).toEqual([]);
    // 1 disparo inicial + 1 do clear
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0]).toEqual([]);
  });

  it('tolera ausência de window (SSR) sem lançar', async () => {
    // Simula ambiente sem window/localStorage removendo apenas a chave
    const m = await freshModule();
    const original = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: () => { throw new Error('unavailable'); }, setItem: () => { throw new Error('quota'); } },
      configurable: true,
    });
    expect(() =>
      m.recordHydrationEvent({ entityType: 'ssr', status: 'success', source: 'defaults' }),
    ).not.toThrow();
    Object.defineProperty(window, 'localStorage', { value: original, configurable: true });
  });
});
