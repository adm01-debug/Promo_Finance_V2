import { describe, expect, it } from 'vitest';
import { extrairOffline, formatarGravadoEm } from '../offlineMeta';

describe('extrairOffline', () => {
  it('devolve null para payloads sem metadado', () => {
    expect(extrairOffline(undefined)).toBeNull();
    expect(extrairOffline(null)).toBeNull();
    expect(extrairOffline({ recurso: 'uf' })).toBeNull();
    expect(extrairOffline('texto')).toBeNull();
  });

  it('rejeita metadado malformado', () => {
    expect(extrairOffline({ _offline: {} })).toBeNull();
    expect(extrairOffline({ _offline: { origem: 'rede', gravadoEm: 1 } })).toBeNull();
    expect(extrairOffline({ _offline: { origem: 'cache', gravadoEm: 'x' } })).toBeNull();
    expect(extrairOffline({ _offline: { origem: 'cache', gravadoEm: Number.NaN } })).toBeNull();
  });

  it('extrai metadado válido', () => {
    expect(extrairOffline({ _offline: { origem: 'cache', gravadoEm: 1700000000000 } })).toEqual({
      origem: 'cache',
      gravadoEm: 1700000000000,
    });
  });
});

describe('formatarGravadoEm', () => {
  it('formata timestamp válido', () => {
    expect(formatarGravadoEm(1700000000000)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('tolera timestamp inválido', () => {
    expect(formatarGravadoEm(Number.NaN)).toBe('data desconhecida');
  });
});
