import { describe, it, expect, beforeEach } from 'vitest';
import {
  newCorrelationId,
  getCorrelationId,
  withCorrelationHeader,
  CORRELATION_HEADER,
} from '../correlation-id';

beforeEach(() => {
  // reseta o singleton entre testes forçando uma nova geração
  newCorrelationId('reset');
});

describe('correlation-id', () => {
  it('CORRELATION_HEADER usa o nome padrão x-request-id', () => {
    expect(CORRELATION_HEADER).toBe('x-request-id');
  });

  it('newCorrelationId aplica prefixo quando fornecido', () => {
    const id = newCorrelationId('salvar-conta');
    expect(id.startsWith('salvar-conta:')).toBe(true);
  });

  it('newCorrelationId sem prefixo não contém dois-pontos como separador', () => {
    const id = newCorrelationId();
    expect(id).not.toMatch(/^[^:]+:/);
    expect(id.length).toBeGreaterThan(5);
  });

  it('getCorrelationId retorna o mesmo id em chamadas consecutivas', () => {
    const id = newCorrelationId('acao');
    expect(getCorrelationId()).toBe(id);
    expect(getCorrelationId()).toBe(id);
  });

  it('newCorrelationId substitui o id atual', () => {
    const a = newCorrelationId('a');
    const b = newCorrelationId('b');
    expect(a).not.toBe(b);
    expect(getCorrelationId()).toBe(b);
  });

  it('withCorrelationHeader inclui o header padrão', () => {
    const id = newCorrelationId('h');
    const headers = withCorrelationHeader(id);
    expect(headers[CORRELATION_HEADER]).toBe(id);
  });

  it('withCorrelationHeader mescla extras sem sobrescrever o request id', () => {
    const id = newCorrelationId('mix');
    const headers = withCorrelationHeader(id, { Authorization: 'Bearer x' });
    expect(headers[CORRELATION_HEADER]).toBe(id);
    expect(headers.Authorization).toBe('Bearer x');
  });

  it('withCorrelationHeader usa getCorrelationId quando id não é passado', () => {
    const id = newCorrelationId('auto');
    const headers = withCorrelationHeader();
    expect(headers[CORRELATION_HEADER]).toBe(id);
  });

  it('gera fallback quando crypto.randomUUID não está disponível', () => {
    const originalCrypto = globalThis.crypto;
    delete (globalThis as { crypto?: unknown }).crypto;
    try {
      const id = newCorrelationId();
      expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/i);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
      });
    }
  });

  it('ids são únicos entre chamadas', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 25; i++) ids.add(newCorrelationId());
    expect(ids.size).toBe(25);
  });
});
