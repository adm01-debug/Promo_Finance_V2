// ============================================
// Lote P1 — Cobertura adicional dos motores tributários
// Garante ≥ 90% de cobertura em fator-r, aliquotas-simples,
// rbt12 e simular-simples (linhas/branches que ainda não estavam exercitadas).
// ============================================
import { describe, it, expect } from 'vitest';
import {
  calcularFolha12m,
  calcularFatorR,
  determinarAnexoPorFatorR,
} from '../fator-r';
import {
  obterAnexo,
  identificarFaixa,
  ANEXO_I,
  ANEXO_II,
  ANEXO_III,
  ANEXO_IV,
  ANEXO_V,
  LIMITE_SIMPLES_NACIONAL,
} from '../aliquotas-simples';
import { calcularRBT12, calcularRBA } from '../rbt12';
import { simularSimples } from '../simular-simples';
import type { FolhaMes, FaturamentoMes } from '../types';

describe('fator-r — calcularFolha12m', () => {
  it('retorna 0 com histórico vazio', () => {
    expect(calcularFolha12m([], 2025, 1)).toBe(0);
  });

  it('soma os 12 meses anteriores quando há histórico completo', () => {
    const hist: FolhaMes[] = Array.from({ length: 12 }, (_, i) => ({
      ano: 2024,
      mes: i + 1,
      total_folha: 10_000,
    }));
    expect(calcularFolha12m(hist, 2025, 1)).toBe(120_000);
  });

  it('proporcionaliza para empresa em início de atividade', () => {
    const hist: FolhaMes[] = [
      { ano: 2024, mes: 11, total_folha: 5_000 },
      { ano: 2024, mes: 12, total_folha: 5_000 },
    ];
    // média 5k * 12 = 60k
    expect(calcularFolha12m(hist, 2025, 1)).toBe(60_000);
  });

  it('ignora meses futuros em relação à referência', () => {
    const hist: FolhaMes[] = [
      { ano: 2025, mes: 5, total_folha: 99_999 }, // futuro
      { ano: 2024, mes: 12, total_folha: 1_000 },
    ];
    // só o de dez/2024 conta → 1k * 12
    expect(calcularFolha12m(hist, 2025, 1)).toBe(12_000);
  });
});

describe('fator-r — determinarAnexoPorFatorR (limites)', () => {
  it('exatamente 0 → Anexo V', () => {
    expect(determinarAnexoPorFatorR(0)).toBe('V');
  });
  it('logo abaixo de 0,28 → Anexo V', () => {
    expect(determinarAnexoPorFatorR(0.2799)).toBe('V');
  });
  it('exatamente 0,28 → Anexo III', () => {
    expect(determinarAnexoPorFatorR(0.28)).toBe('III');
  });
  it('valores muito altos → Anexo III', () => {
    expect(determinarAnexoPorFatorR(5)).toBe('III');
  });
});

describe('fator-r — calcularFatorR (defesa)', () => {
  it('retorna 0 quando RBT12 negativo', () => {
    expect(calcularFatorR(1000, -1)).toBe(0);
  });
  it('retorna 0 quando RBT12 NaN', () => {
    expect(calcularFatorR(1000, Number.NaN)).toBe(0);
  });
});

describe('aliquotas-simples — obterAnexo', () => {
  it('retorna a tabela completa de cada anexo (5 × 6 faixas)', () => {
    expect(obterAnexo('I')).toEqual(ANEXO_I);
    expect(obterAnexo('II')).toEqual(ANEXO_II);
    expect(obterAnexo('III')).toEqual(ANEXO_III);
    expect(obterAnexo('IV')).toEqual(ANEXO_IV);
    expect(obterAnexo('V')).toEqual(ANEXO_V);
    expect(obterAnexo('I')).toHaveLength(6);
  });

  it('cada faixa possui aliquota e PD coerentes', () => {
    for (const anexo of ['I', 'II', 'III', 'IV', 'V'] as const) {
      const tabela = obterAnexo(anexo);
      tabela.forEach((f) => {
        expect(f.aliquota).toBeGreaterThan(0);
        expect(f.aliquota).toBeLessThan(1);
        expect(f.pd).toBeGreaterThanOrEqual(0);
        expect(f.rbt12_ate).toBeGreaterThan(f.rbt12_de);
      });
    }
  });

  it('limite global do Simples = R$ 4,8 mi', () => {
    expect(LIMITE_SIMPLES_NACIONAL).toBe(4_800_000);
    expect(identificarFaixa(LIMITE_SIMPLES_NACIONAL, 'I')?.faixa).toBe(6);
  });

  it('faixas 1-6 do Anexo V identificadas corretamente', () => {
    expect(identificarFaixa(100_000, 'V')?.faixa).toBe(1);
    expect(identificarFaixa(250_000, 'V')?.faixa).toBe(2);
    expect(identificarFaixa(500_000, 'V')?.faixa).toBe(3);
    expect(identificarFaixa(1_000_000, 'V')?.faixa).toBe(4);
    expect(identificarFaixa(2_500_000, 'V')?.faixa).toBe(5);
    expect(identificarFaixa(4_000_000, 'V')?.faixa).toBe(6);
  });
});

describe('rbt12 — branches restantes', () => {
  it('retorna 0 se todos os meses do histórico são posteriores à referência', () => {
    const hist: FaturamentoMes[] = [
      { ano: 2025, mes: 6, receita_bruta: 50_000 },
      { ano: 2025, mes: 7, receita_bruta: 50_000 },
    ];
    expect(calcularRBT12(hist, 2025, 1)).toBe(0);
  });

  it('soma somente o ano-calendário em calcularRBA', () => {
    const hist: FaturamentoMes[] = [
      { ano: 2023, mes: 12, receita_bruta: 1 },
      { ano: 2024, mes: 1, receita_bruta: 10 },
      { ano: 2024, mes: 2, receita_bruta: 20 },
      { ano: 2025, mes: 1, receita_bruta: 100 },
    ];
    expect(calcularRBA(hist, 2024)).toBe(30);
    expect(calcularRBA(hist, 2025)).toBe(100);
    expect(calcularRBA(hist, 2026)).toBe(0);
  });
});

describe('simular-simples — caminhos com histórico e forcarAnexo', () => {
  const opcoes = { anoReferencia: 2025, mesReferencia: 1 };

  it('usa histórico mensal para calcular RBT12', () => {
    const faturamentoMensal: FaturamentoMes[] = Array.from({ length: 12 }, (_, i) => ({
      ano: 2024,
      mes: i + 1,
      receita_bruta: 50_000,
    }));
    const r = simularSimples(
      {
        faturamentoAnual: 600_000,
        margemLucro: 10,
        percentualServicos: 0,
        faturamentoMensal,
      },
      opcoes,
    );
    expect(r.elegivel).toBe(true);
    expect(r.rbt12).toBe(600_000);
  });

  it('quando histórico mensal existe mas não tem meses anteriores, fallback para faturamentoAnual', () => {
    const faturamentoMensal: FaturamentoMes[] = [
      { ano: 2025, mes: 6, receita_bruta: 99_999 }, // futuro → ignorado
    ];
    const r = simularSimples(
      {
        faturamentoAnual: 480_000,
        margemLucro: 10,
        percentualServicos: 0,
        faturamentoMensal,
      },
      opcoes,
    );
    expect(r.elegivel).toBe(true);
    expect(r.rbt12).toBe(480_000);
    expect(r.observacoes?.some((o) => o.includes('estimado'))).toBe(true);
  });

  it('respeita forcarAnexo (II) mesmo para serviços', () => {
    const r = simularSimples(
      {
        faturamentoAnual: 300_000,
        margemLucro: 10,
        percentualServicos: 100,
        folhaAnual: 50_000,
      },
      { ...opcoes, forcarAnexo: 'II' },
    );
    expect(r.elegivel).toBe(true);
    expect(r.anexoAplicavel).toBe('II');
  });

  it('usa folha mensal quando fornecida', () => {
    const folhaMensal: FolhaMes[] = Array.from({ length: 12 }, (_, i) => ({
      ano: 2024,
      mes: i + 1,
      total_folha: 20_000, // 240k/ano
    }));
    const r = simularSimples(
      {
        faturamentoAnual: 600_000,
        margemLucro: 10,
        percentualServicos: 100, // serviços → fator R aplica
        folhaMensal,
      },
      opcoes,
    );
    // 240k folha / 600k RBT12 = 0,40 → Anexo III
    expect(r.anexoAplicavel).toBe('III');
    expect(r.fatorR).toBeCloseTo(0.4, 2);
  });

  it('observação de atividade comercial quando %serviços ≤ 50', () => {
    const r = simularSimples(
      { faturamentoAnual: 300_000, margemLucro: 10, percentualServicos: 30 },
      opcoes,
    );
    expect(r.anexoAplicavel).toBe('I');
    expect(r.observacoes?.some((o) => o.toLowerCase().includes('comercial'))).toBe(true);
  });
});
