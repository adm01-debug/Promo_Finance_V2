/**
 * Hardening da leitura de `regimes_simulados.parametros` (coluna jsonb).
 * O banco não garante forma: registros legados, payloads truncados e valores
 * fora de faixa precisam degradar de forma previsível — nunca lançar exceção
 * e nunca alimentar o motor com entradas ilegais.
 */
import { describe, it, expect } from 'vitest';
import { normalizarParametrosSnapshot } from '../historico-simulacao';
import { decidirRegime } from '../decidir-regime';
import type { ParametrosSimulacao } from '../types';

const BASE: ParametrosSimulacao = {
  faturamentoAnual: 1_200_000,
  margemLucro: 12,
  percentualServicos: 60,
};

describe('normalizarParametrosSnapshot — contrato', () => {
  it('rejeita payloads que não são objeto', () => {
    for (const v of [null, undefined, 42, 'x', [], true]) {
      expect(normalizarParametrosSnapshot(v)).toBeNull();
    }
  });

  it('rejeita snapshot sem faturamento anual finito', () => {
    expect(normalizarParametrosSnapshot({ margemLucro: 10 })).toBeNull();
    expect(normalizarParametrosSnapshot({ faturamentoAnual: 'abc' })).toBeNull();
    expect(normalizarParametrosSnapshot({ faturamentoAnual: -1 })).toBeNull();
  });

  it('coage faturamento anual persistido como string numérica', () => {
    expect(normalizarParametrosSnapshot({ faturamentoAnual: '850000' })?.faturamentoAnual).toBe(850_000);
  });

  it('limita percentuais e alíquotas às faixas legais', () => {
    const r = normalizarParametrosSnapshot({
      faturamentoAnual: 1_000,
      percentualServicos: 999,
      margemLucro: -500,
      aliquotaICMS: 3,
      aliquotaRAT: 0.9,
      presuncaoIrpjServicos: 0.9,
      presuncaoCsllServicos: 0.01,
    });
    expect(r?.percentualServicos).toBe(100);
    expect(r?.margemLucro).toBe(-100);
    expect(r?.aliquotaICMS).toBe(1);
    expect(r?.aliquotaRAT).toBe(0.06);
    expect(r?.presuncaoIrpjServicos).toBe(0.32);
    expect(r?.presuncaoCsllServicos).toBe(0.12);
  });

  it('descarta campo corrompido sem invalidar o snapshot inteiro', () => {
    const r = normalizarParametrosSnapshot({
      faturamentoAnual: 500_000,
      folhaAnual: { valor: 10 },
      margemLucro: 8,
    });
    expect(r?.faturamentoAnual).toBe(500_000);
    expect(r?.folhaAnual).toBeUndefined();
    expect(r?.margemLucro).toBe(8);
  });

  it('aceita apenas periodicidade válida', () => {
    expect(normalizarParametrosSnapshot({ faturamentoAnual: 1, periodicidadeApuracao: 'mensal' })
      ?.periodicidadeApuracao).toBeUndefined();
    expect(normalizarParametrosSnapshot({ faturamentoAnual: 1, periodicidadeApuracao: 'trimestral' })
      ?.periodicidadeApuracao).toBe('trimestral');
  });

  it('preserva série de faturamento bem-formada, inclusive campos opcionais', () => {
    const r = normalizarParametrosSnapshot({
      faturamentoAnual: 120_000,
      faturamentoMensal: [
        { ano: 2025, mes: 1, receita_bruta: 10_000, receita_servicos: 4_000 },
        { ano: 2025, mes: 2, receita_bruta: 12_000 },
      ],
    });
    expect(r?.faturamentoMensal).toHaveLength(2);
    expect(r?.faturamentoMensal?.[0].receita_servicos).toBe(4_000);
    expect(r?.faturamentoMensal?.[1].receita_servicos).toBeUndefined();
  });

  it('descarta série mensal com mês fora de 1..12 ou item malformado', () => {
    expect(
      normalizarParametrosSnapshot({
        faturamentoAnual: 1,
        faturamentoMensal: [{ ano: 2025, mes: 13, receita_bruta: 1 }],
      })?.faturamentoMensal,
    ).toBeUndefined();
    expect(
      normalizarParametrosSnapshot({
        faturamentoAnual: 1,
        faturamentoMensal: [{ ano: 2025, mes: 1 }],
      })?.faturamentoMensal,
    ).toBeUndefined();
  });

  it('remove chaves desconhecidas injetadas no jsonb', () => {
    const r = normalizarParametrosSnapshot({ faturamentoAnual: 1, __proto__hack: 'x', foo: 1 });
    expect(Object.keys(r ?? {})).not.toContain('foo');
  });

  it('trunca textos longos e ignora strings vazias', () => {
    const r = normalizarParametrosSnapshot({
      faturamentoAnual: 1,
      uf: '  SP  ',
      cnaePrincipal: '   ',
      atividadePrincipal: 'x'.repeat(500),
    });
    expect(r?.uf).toBe('SP');
    expect(r?.cnaePrincipal).toBeUndefined();
    expect(r?.atividadePrincipal).toHaveLength(120);
  });
});

describe('normalizarParametrosSnapshot — fuzzing de 600 payloads corrompidos', () => {
  const lixo = [
    undefined, null, NaN, Infinity, -Infinity, 'abc', '', '  ', [], {}, true, false,
    -1, 1e21, '12,5', '99', { a: 1 },
  ];

  it('nunca lança e sempre produz entrada aceita pelo motor', () => {
    const campos = [
      'folhaAnual', 'margemLucro', 'percentualServicos', 'percentualIndustria',
      'percentualRevenda', 'comprasComCredito', 'despesasOperacionais', 'aliquotaICMS',
      'aliquotaISS', 'aliquotaRAT', 'aliquotaTerceiros', 'presuncaoIrpjServicos',
      'presuncaoCsllServicos', 'prejuizoFiscalAcumulado', 'baseNegativaCsllAcumulada',
      'periodicidadeApuracao', 'lucroTrimestral', 'faturamentoMensal', 'folhaMensal', 'uf',
    ];
    let aceitos = 0;
    for (let i = 0; i < 600; i++) {
      const payload: Record<string, unknown> = { faturamentoAnual: 100_000 + i * 1_000 };
      for (const campo of campos) {
        if ((i + campo.length) % 3 === 0) payload[campo] = lixo[(i + campo.length) % lixo.length];
      }
      const snapshot = normalizarParametrosSnapshot(payload);
      expect(snapshot).not.toBeNull();
      aceitos++;
      const params = { ...BASE, ...snapshot } as ParametrosSimulacao;
      const resultado = decidirRegime(params, { anoReferencia: 2026, mesReferencia: 6 });
      for (const cenario of resultado.cenarios) {
        expect(Number.isFinite(cenario.totalTributos)).toBe(true);
        expect(cenario.totalTributos).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(cenario.cargaEfetiva)).toBe(true);
      }
    }
    expect(aceitos).toBe(600);
  });
});
