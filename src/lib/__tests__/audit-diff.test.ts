import { describe, it, expect } from 'vitest';
import {
  computeDiff,
  extractCamposChave,
  isEmptyDiff,
} from '../audit-diff';

describe('audit-diff', () => {
  describe('computeDiff', () => {
    it('objetos vazios ou nulos → diff vazio', () => {
      const d = computeDiff(null, undefined);
      expect(d.added).toEqual([]);
      expect(d.removed).toEqual([]);
      expect(d.changed).toEqual([]);
      expect(d.unchanged).toEqual([]);
      expect(isEmptyDiff(d)).toBe(true);
    });

    it('classifica added/removed/changed/unchanged', () => {
      const a = { nome: 'A', valor: 10, status: 'aberto' };
      const b = { nome: 'A', valor: 20, novo: true };
      const d = computeDiff(a, b);
      expect(d.unchanged.map((f) => f.key)).toEqual(['nome']);
      expect(d.changed.map((f) => f.key)).toEqual(['valor']);
      expect(d.removed.map((f) => f.key)).toEqual(['status']);
      expect(d.added.map((f) => f.key)).toEqual(['novo']);
      expect(isEmptyDiff(d)).toBe(false);
    });

    it('trata null vs undefined como iguais via normalize', () => {
      const d = computeDiff({ x: null }, { x: undefined });
      expect(d.changed).toHaveLength(0);
      // x existe em ambos → unchanged
      expect(d.unchanged.map((f) => f.key)).toContain('x');
    });

    it('objetos aninhados comparados por JSON', () => {
      const d1 = computeDiff({ meta: { a: 1 } }, { meta: { a: 1 } });
      expect(d1.changed).toHaveLength(0);
      const d2 = computeDiff({ meta: { a: 1 } }, { meta: { a: 2 } });
      expect(d2.changed.map((f) => f.key)).toEqual(['meta']);
    });

    it('ordena com chaves técnicas ao final', () => {
      const d = computeDiff(
        { id: '1', descricao: 'A', valor: 1 },
        { id: '2', descricao: 'B', valor: 2 },
      );
      const keys = d.changed.map((f) => f.key);
      expect(keys.indexOf('id')).toBe(keys.length - 1);
    });

    it('valores numéricos vs string com mesma representação são iguais', () => {
      const d = computeDiff({ x: 10 }, { x: '10' });
      expect(d.changed).toHaveLength(0);
    });
  });

  describe('extractCamposChave', () => {
    it('null/undefined retorna array vazio', () => {
      expect(extractCamposChave(null)).toEqual([]);
      expect(extractCamposChave(undefined)).toEqual([]);
    });

    it('ignora null, undefined e string vazia', () => {
      const out = extractCamposChave({ valor: 0, descricao: '', status: null, titulo: undefined });
      // valor 0 é numérico e válido; demais descartados
      expect(out).toEqual([{ key: 'valor', value: 0 }]);
    });

    it('preserva ordem de PRIORITY_KEYS', () => {
      const out = extractCamposChave({
        cliente_nome: 'C',
        valor: 100,
        status: 'pago',
        descricao: 'x',
      });
      expect(out.map((c) => c.key)).toEqual(['valor', 'status', 'descricao', 'cliente_nome']);
    });

    it('ignora chaves fora do PRIORITY_KEYS', () => {
      const out = extractCamposChave({ campo_arbitrario: 'x', valor: 1 });
      expect(out.map((c) => c.key)).toEqual(['valor']);
    });
  });
});
