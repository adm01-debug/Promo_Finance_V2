import { describe, it, expect } from 'vitest';
import { simularSimples } from '../simular-simples';

const baseOptions = { anoReferencia: 2024, mesReferencia: 1 };

describe('simularSimples', () => {
  it('rejeita acima de R$ 4,8 mi', () => {
    const r = simularSimples(
      { faturamentoAnual: 5_000_000, margemLucro: 10, percentualServicos: 50 },
      baseOptions,
    );
    expect(r.elegivel).toBe(false);
    expect(r.totalTributos).toBe(0);
  });

  it('calcula DAS para comércio na faixa 1 (Anexo I)', () => {
    const r = simularSimples(
      { faturamentoAnual: 120_000, margemLucro: 10, percentualServicos: 0 },
      baseOptions,
    );
    expect(r.elegivel).toBe(true);
    expect(r.anexoAplicavel).toBe('I');
    expect(r.totalTributos).toBeCloseTo(120_000 * 0.04, 0); // 4% nominal sem PD na faixa 1
  });

  it('aplica Fator R para serviços com folha alta (Anexo III)', () => {
    const r = simularSimples(
      {
        faturamentoAnual: 600_000,
        margemLucro: 20,
        percentualServicos: 100,
        folhaAnual: 200_000, // 33% > 28% → Anexo III
      },
      baseOptions,
    );
    expect(r.anexoAplicavel).toBe('III');
    expect(r.totalTributos).toBeGreaterThan(0);
  });

  it('aplica Anexo V quando folha é baixa (Fator R < 0,28)', () => {
    const r = simularSimples(
      {
        faturamentoAnual: 600_000,
        margemLucro: 20,
        percentualServicos: 100,
        folhaAnual: 50_000, // 8% < 28% → Anexo V
      },
      baseOptions,
    );
    expect(r.anexoAplicavel).toBe('V');
  });

  it('usa faturamento mensal para RBT12 quando disponível', () => {
    const hist = Array.from({ length: 12 }, (_, i) => ({
      ano: 2023,
      mes: i + 1,
      receita_bruta: 50_000,
    }));
    const r = simularSimples(
      { 
        faturamentoAnual: 1_000_000, 
        margemLucro: 10, 
        percentualServicos: 0,
        faturamentoMensal: hist 
      },
      { anoReferencia: 2024, mesReferencia: 1 },
    );
    // RBT12 = 600k (faixa 3 do Anexo I)
    expect(r.rbt12).toBe(600_000);
    expect(r.faixaAplicavel).toBe(3);
  });

  it('aplica aliquota efetiva corretamente: (RBT12 * aliq - PD) / RBT12', () => {
    // Faixa 2 Anexo I: 180k a 360k, 7.3%, PD 5940
    const r = simularSimples(
      { faturamentoAnual: 200_000, margemLucro: 10, percentualServicos: 0 },
      baseOptions,
    );
    // RBT12 estimado como faturamentoAnual = 200k
    const aliqNominal = 0.073;
    const pd = 5940;
    const aliqEfetiva = (200_000 * aliqNominal - pd) / 200_000; // (14600 - 5940) / 200000 = 8660 / 200000 = 0.0433
    expect(r.cargaEfetiva).toBeCloseTo(aliqEfetiva * 100, 4);
    expect(r.totalTributos).toBeCloseTo(200_000 * aliqEfetiva, 2);
  });
});
