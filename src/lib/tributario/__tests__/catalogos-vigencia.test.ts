import { describe, expect, it } from 'vitest';
import { normalizarReferencia } from '@/lib/tributario/catalogos/repositorio';

const HOJE = new Date().toISOString().slice(0, 10);

describe('normalizarReferencia', () => {
  it('mantém datas ISO válidas', () => {
    expect(normalizarReferencia('2023-06-15')).toBe('2023-06-15');
  });

  it('aceita Date e converte para ISO', () => {
    expect(normalizarReferencia(new Date('2024-02-29T12:00:00Z'))).toBe('2024-02-29');
  });

  it('degrada para hoje em entradas ausentes ou inválidas', () => {
    expect(normalizarReferencia(undefined)).toBe(HOJE);
    expect(normalizarReferencia(null)).toBe(HOJE);
    expect(normalizarReferencia('')).toBe(HOJE);
    expect(normalizarReferencia('data-invalida')).toBe(HOJE);
    expect(normalizarReferencia(new Date('x'))).toBe(HOJE);
  });
});
