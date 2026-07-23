import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  contasReceberPainelRowSchema,
  contasPagarPainelRowSchema,
  parseRows,
} from '../views.schemas';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('views.schemas — validação runtime Zod', () => {
  const validReceber = {
    id: 'uuid-1',
    descricao: 'Fatura',
    valor: 100,
    data_vencimento: '2026-01-01',
    status: 'pendente',
  };
  const validPagar = {
    id: 'uuid-2',
    descricao: 'NF fornecedor',
    valor: 250,
    data_vencimento: '2026-01-15',
    status: 'pendente',
  };

  it('aceita linhas válidas de contas a receber com passthrough', () => {
    const parsed = contasReceberPainelRowSchema.parse({
      ...validReceber,
      campo_extra: 'ok',
    });
    expect(parsed.id).toBe('uuid-1');
    expect((parsed as Record<string, unknown>).campo_extra).toBe('ok');
  });

  it('aceita linhas válidas de contas a pagar', () => {
    const parsed = contasPagarPainelRowSchema.parse(validPagar);
    expect(parsed.valor).toBe(250);
  });

  it('rejeita quando tipos divergem (valor não numérico)', () => {
    const r = contasReceberPainelRowSchema.safeParse({
      ...validReceber,
      valor: 'cem',
    });
    expect(r.success).toBe(false);
  });

  describe('parseRows', () => {
    beforeEach(() => {
      vi.stubEnv('MODE', 'production');
      // @ts-expect-error override readonly for teste
      import.meta.env.DEV = false;
    });
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('em produção descarta linhas inválidas mantendo as válidas', async () => {
      // Reimporta módulo com nova env para reavaliar STRICT
      vi.resetModules();
      const mod = await import('../views.schemas');
      const out = mod.parseRows(
        mod.contasReceberPainelRowSchema,
        [validReceber, { ...validReceber, valor: 'x' }, validReceber],
        'vw_contas_receber_painel',
      );
      expect(out).toHaveLength(2);
    });

    it('em dev/test lança quando alguma linha diverge', () => {
      expect(() =>
        parseRows(
          contasReceberPainelRowSchema,
          [{ ...validReceber, valor: 'x' }],
          'vw_contas_receber_painel',
        ),
      ).toThrow(/Contrato divergente/);
    });

    it('retorna array vazio sem erro quando não há linhas', () => {
      expect(parseRows(contasReceberPainelRowSchema, [], 'v')).toEqual([]);
    });
  });
});
