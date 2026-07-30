import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setSloFailure,
  readSloFailure,
  clearSloFailure,
  SLO_REASON_COPY,
  type SloFailureReason,
} from '../sso-slo-state';

// setup.ts substitui sessionStorage por vi.fn() sem estado. Recriamos um backing map por teste.
let store: Record<string, string>;
beforeEach(() => {
  store = {};
  vi.mocked(sessionStorage.getItem).mockImplementation((k: string) => store[k] ?? null);
  vi.mocked(sessionStorage.setItem).mockImplementation((k: string, v: string) => {
    store[k] = String(v);
  });
  vi.mocked(sessionStorage.removeItem).mockImplementation((k: string) => {
    delete store[k];
  });
});

describe('sso-slo-state', () => {
  it('persiste e recupera snapshot com timestamp', () => {
    const before = Date.now();
    setSloFailure({
      reason: 'provider_logout_failed',
      providerNome: 'Okta',
      providerId: 'prov-1',
      message: 'timeout',
      localCleanupFailed: false,
      providerLogoutFailed: true,
    });
    const snap = readSloFailure();
    expect(snap).not.toBeNull();
    expect(snap!.providerNome).toBe('Okta');
    expect(snap!.reason).toBe('provider_logout_failed');
    expect(snap!.ts).toBeGreaterThanOrEqual(before);
  });

  it('readSloFailure retorna null quando vazio', () => {
    expect(readSloFailure()).toBeNull();
  });

  it('readSloFailure retorna null para JSON inválido', () => {
    store['sso-slo-failure'] = '{{not json';
    expect(readSloFailure()).toBeNull();
  });

  it('readSloFailure retorna null para payload sem reason', () => {
    store['sso-slo-failure'] = JSON.stringify({ foo: 'bar' });
    expect(readSloFailure()).toBeNull();
  });

  it('clearSloFailure remove o snapshot', () => {
    setSloFailure({
      reason: 'unknown',
      providerNome: null,
      providerId: null,
      message: null,
      localCleanupFailed: false,
      providerLogoutFailed: false,
    });
    clearSloFailure();
    expect(readSloFailure()).toBeNull();
  });

  it('setSloFailure não lança quando sessionStorage falha', () => {
    vi.mocked(sessionStorage.setItem).mockImplementationOnce(() => {
      throw new Error('quota');
    });
    expect(() =>
      setSloFailure({
        reason: 'unknown',
        providerNome: null,
        providerId: null,
        message: null,
        localCleanupFailed: false,
        providerLogoutFailed: false,
      }),
    ).not.toThrow();
  });

  it('readSloFailure não lança quando sessionStorage falha', () => {
    vi.mocked(sessionStorage.getItem).mockImplementationOnce(() => {
      throw new Error('denied');
    });
    expect(readSloFailure()).toBeNull();
  });

  it('clearSloFailure não lança quando sessionStorage falha', () => {
    vi.mocked(sessionStorage.removeItem).mockImplementationOnce(() => {
      throw new Error('denied');
    });
    expect(() => clearSloFailure()).not.toThrow();
  });

  it('SLO_REASON_COPY contém título e descrição para todos os motivos', () => {
    const reasons: SloFailureReason[] = [
      'provider_logout_failed',
      'local_cleanup_failed',
      'unknown',
    ];
    for (const r of reasons) {
      expect(SLO_REASON_COPY[r].title.length).toBeGreaterThan(5);
      expect(SLO_REASON_COPY[r].description.length).toBeGreaterThan(10);
    }
  });
});
