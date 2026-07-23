import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  activateContingency,
  deactivateContingency,
  registerCommunicationFailure,
  registerCommunicationSuccess,
  addPendingNFe,
  updatePendingNFe,
  removePendingNFe,
  getContingencyStats,
} from '../sefaz-contingency/state';
import { getContingencyState } from '../sefaz-contingency/storage';

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

function makeNFe(id: string, valor = 100, dataEmissao = new Date('2026-01-01')) {
  return {
    id,
    numero: `n-${id}`,
    serie: '1',
    chaveAcesso: 'x'.repeat(44),
    dataEmissao,
    valorTotal: valor,
    destinatario: 'Cliente',
    xmlContingencia: '<xml/>',
  };
}

describe('sefaz-contingency :: state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('activateContingency salva modo, motivo e activatedAt', () => {
    const s = activateContingency('SVCAN', 'Motivo X', 'user@test');
    expect(s.mode).toBe('SVCAN');
    expect(s.reason).toBe('Motivo X');
    expect(s.activatedAt).toBeInstanceOf(Date);
    expect(getContingencyState().mode).toBe('SVCAN');
  });

  it('deactivateContingency reseta modo e contadores', () => {
    activateContingency('offline', 'r', 'u');
    const s = deactivateContingency();
    expect(s.mode).toBe('normal');
    expect(s.failureCount).toBe(0);
    expect(s.activatedAt).toBeNull();
  });

  it('registerCommunicationFailure ativa offline após 3 falhas', () => {
    registerCommunicationFailure();
    registerCommunicationSuccess();
    expect(getContingencyState().failureCount).toBe(0);
    registerCommunicationFailure();
    registerCommunicationFailure();
    const s = registerCommunicationFailure();
    expect(s.mode).toBe('offline');
    expect(s.autoActivated).toBe(true);
  });

  it('registerCommunicationFailure não sobrescreve modo já ativado manualmente', () => {
    activateContingency('SVCAN', 'manual', 'user');
    registerCommunicationFailure();
    registerCommunicationFailure();
    registerCommunicationFailure();
    expect(getContingencyState().mode).toBe('SVCAN');
  });

  it('addPendingNFe / updatePendingNFe / removePendingNFe', () => {
    addPendingNFe(makeNFe('a'));
    addPendingNFe(makeNFe('b', 200));
    expect(getContingencyState().pendingNFes).toHaveLength(2);

    updatePendingNFe('a', { status: 'autorizada', tentativas: 2 });
    const nfeA = getContingencyState().pendingNFes.find((n) => n.id === 'a');
    expect(nfeA?.status).toBe('autorizada');
    expect(nfeA?.tentativas).toBe(2);

    removePendingNFe('a');
    expect(getContingencyState().pendingNFes.map((n) => n.id)).toEqual(['b']);
  });

  it('updatePendingNFe é no-op para id inexistente', () => {
    addPendingNFe(makeNFe('a'));
    const before = JSON.stringify(getContingencyState().pendingNFes);
    updatePendingNFe('missing', { status: 'autorizada' });
    expect(JSON.stringify(getContingencyState().pendingNFes)).toBe(before);
  });

  it('getContingencyStats agrega apenas pendentes', () => {
    addPendingNFe(makeNFe('a', 100, new Date('2026-01-02')));
    addPendingNFe(makeNFe('b', 250, new Date('2026-01-01')));
    addPendingNFe(makeNFe('c', 999, new Date('2025-12-01')));
    updatePendingNFe('c', { status: 'autorizada', tentativas: 5 });
    updatePendingNFe('a', { tentativas: 1 });
    updatePendingNFe('b', { tentativas: 3 });

    const stats = getContingencyStats();
    expect(stats.totalPending).toBe(2);
    expect(stats.pendingValue).toBe(350);
    expect(stats.transmissionAttempts).toBe(4);
    expect(stats.oldestPending?.toISOString()).toBe(new Date('2026-01-01').toISOString());
  });

  it('getContingencyStats sem pendentes retorna oldestPending=null', () => {
    const stats = getContingencyStats();
    expect(stats.totalPending).toBe(0);
    expect(stats.pendingValue).toBe(0);
    expect(stats.oldestPending).toBeNull();
  });
});
