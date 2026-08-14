import { describe, it, expect } from 'vitest';
import {
  parseContasReceberRows,
  parseContasPagarRows,
  parseRows,
  contasReceberPainelRowSchema,
} from '../views.schemas';

describe('views.schemas — parseRows', () => {
  it('aceita linhas válidas mínimas de contas a receber', () => {
    const rows = [
      { id: 'r1', descricao: 'Fatura 001', valor: 1000, status: 'aberto' },
      { id: 'r2', valor: null, status: null },
    ];
    const parsed = parseContasReceberRows(rows);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('r1');
    expect(parsed[0].valor).toBe(1000);
  });

  it('aceita linhas válidas mínimas de contas a pagar', () => {
    const rows = [{ id: 'p1', descricao: 'Aluguel', valor: 500 }];
    const parsed = parseContasPagarRows(rows);
    expect(parsed[0].descricao).toBe('Aluguel');
  });

  it('preserva colunas adicionais via passthrough', () => {
    const rows = [{ id: 'r1', valor: 10, extra_col: 'x' } as Record<string, unknown>];
    const parsed = parseContasReceberRows(rows);
    expect((parsed[0] as unknown as Record<string, unknown>).extra_col).toBe('x');
  });

  it('lança em test mode quando linha tem tipo inválido', () => {
    const rows = [{ id: 123, valor: 'não-numérico' }];
    expect(() => parseContasReceberRows(rows)).toThrow(/Contrato divergente/);
  });

  it('parseRows: array vazio retorna array vazio', () => {
    const out = parseRows(contasReceberPainelRowSchema, [], 'vw_test');
    expect(out).toEqual([]);
  });

  it('parseRows: erro cita a view no texto lançado', () => {
    try {
      parseRows(contasReceberPainelRowSchema, [{ id: {} }], 'vw_minha_view');
      throw new Error('deveria ter lançado');
    } catch (err) {
      expect(String(err)).toMatch(/vw_minha_view/);
    }
  });
});
