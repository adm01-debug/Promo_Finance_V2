import { describe, it, expect, beforeEach, vi } from 'vitest';

// Substitui o localStorage totalmente mockado do setup por um store real em memória
const store = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  },
});

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { getSefazHealthStatus, updateSefazHealthStatus } from '../sefaz-contingency/storage';
import {
  checkSefazHealth,
  activateContingency,
  deactivateContingency,
} from '../sefaz-contingency/state';
import {
  runAutoContingencyCheck,
  evaluateContingencyRules,
  shouldAutoDeactivate,
  saveAutoContingencyConfig,
} from '../sefaz-contingency/rules';
import { HEALTH_KEY } from '../sefaz-contingency/constants';

function regraDeTresFalhas() {
  saveAutoContingencyConfig({
    enabled: true,
    checkInterval: 1,
    autoDeactivateWhenOnline: true,
    autoDeactivateDelayMinutes: 0,
    notifyOnActivation: false,
    rules: [
      {
        id: 'r1',
        name: 'Três falhas',
        enabled: true,
        priority: 1,
        type: 'failure_count',
        mode: 'SVCAN',
        reason: 'Falhas consecutivas',
        config: { maxFailures: 3 },
        createdAt: new Date('2026-01-01'),
      },
    ],
  });
}

describe('SEFAZ não fabrica status (F11)', () => {
  beforeEach(() => {
    store.clear();
    deactivateContingency();
    store.clear();
  });

  it('sem nada gravado, o status é desconhecido — não "online com 0ms"', () => {
    const health = getSefazHealthStatus();
    expect(health.online).toBeNull();
    expect(health.latency).toBeNull();
    expect(health.lastCheck).toBeNull();
  });

  it('status gravado sem lastCheck não vira 01/01/1970', () => {
    store.set(HEALTH_KEY, JSON.stringify({ online: null, latency: null, lastCheck: null }));
    expect(getSefazHealthStatus().lastCheck).toBeNull();
  });

  it('updateSefazHealthStatus não carimba verificação em quem não verificou', () => {
    updateSefazHealthStatus({ consecutiveFailures: 2 });
    const health = getSefazHealthStatus();
    expect(health.lastCheck).toBeNull();
    expect(health.consecutiveFailures).toBe(2);
  });

  it('quem mede de verdade passa lastCheck e ele é preservado', () => {
    const quando = new Date('2026-11-17T10:00:00.000Z');
    updateSefazHealthStatus({ online: true, latency: 180, lastCheck: quando });
    const health = getSefazHealthStatus();
    expect(health.online).toBe(true);
    expect(health.latency).toBe(180);
    expect(health.lastCheck?.toISOString()).toBe(quando.toISOString());
  });

  it('checkSefazHealth devolve desconhecido em vez de sortear online/latência', async () => {
    const health = await checkSefazHealth();
    expect(health.online).toBeNull();
    expect(health.latency).toBeNull();
    expect(health.lastCheck).toBeNull();
  });

  it('checkSefazHealth preserva os contadores de falha já registrados', async () => {
    updateSefazHealthStatus({ consecutiveFailures: 3, averageResponseTime: 250 });
    const health = await checkSefazHealth();
    expect(health.consecutiveFailures).toBe(3);
    expect(health.averageResponseTime).toBe(250);
  });

  it('a regra de 3 falhas continua existindo e dispararia — nada foi removido', () => {
    regraDeTresFalhas();
    updateSefazHealthStatus({ consecutiveFailures: 3 });
    const avaliacao = evaluateContingencyRules();
    expect(avaliacao.shouldActivate).toBe(true);
    expect(avaliacao.triggeredRule?.mode).toBe('SVCAN');
  });

  it('runAutoContingencyCheck não ativa contingência com status desconhecido', async () => {
    regraDeTresFalhas();
    updateSefazHealthStatus({ consecutiveFailures: 3 });
    const resultado = await runAutoContingencyCheck();
    expect(resultado.action).toBe('none');
    expect(resultado.newState).toBeUndefined();
  });

  it('não devolve a emissão ao modo normal sozinho com status desconhecido', async () => {
    regraDeTresFalhas();
    activateContingency('SVCAN', 'motivo', 'Sistema (Automático)', undefined, true);
    expect(shouldAutoDeactivate()).toBe(false);
    const resultado = await runAutoContingencyCheck();
    expect(resultado.action).toBe('none');
  });
});
