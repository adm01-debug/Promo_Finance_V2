import { describe, it, expect } from 'vitest';

import { simularSimples } from '../shared-logic';
import type { ParametrosSimulacao } from '../shared-logic';

/**
 * CPP patronal fora do DAS — Anexo IV (LC 123/2006, art. 18, §5º-C).
 *
 * Empresas do Anexo IV (construção civil, vigilância, limpeza, advocacia)
 * NÃO recolhem a contribuição previdenciária patronal dentro do DAS: pagam
 * 20% sobre a folha + RAT/FAP em GPS/DCTFWeb. Antes desta correção o motor
 * zerava a CPP do Anexo IV e não a somava por fora, subestimando a carga.
 */

const base = (over: Partial<ParametrosSimulacao> = {}): ParametrosSimulacao => ({
  faturamentoAnual: 1_200_000,
  folhaAnual: 300_000,
  percentualServicos: 100,
  percentualIndustria: 0,
  percentualRevenda: 0,
  margemLucro: 20,
  atividadePrincipal: 'construção civil',
  ...over,
});

describe('CPP fora do DAS — Anexo IV', () => {
  it('classifica construção civil no Anexo IV e cobra CPP por fora', () => {
    const r = simularSimples(base());
    expect(r.anexoAplicavel).toBe('IV');
    // 300.000 × (20% + RAT 2%) = 66.000
    expect(r.cppForaDAS).toBeCloseTo(66_000, 2);
    expect(r.cpp).toBeCloseTo(66_000, 2);
    expect(r.observacoes.join(' ')).toMatch(/FORA do DAS/i);
  });

  it('o total inclui a CPP por fora, acima do DAS puro', () => {
    const comFolha = simularSimples(base());
    const semFolha = simularSimples(base({ folhaAnual: 0 }));
    expect(comFolha.totalTributos - semFolha.totalTributos).toBeCloseTo(66_000, 2);
    expect(semFolha.cppForaDAS).toBe(0);
    expect(comFolha.cargaEfetiva).toBeGreaterThan(semFolha.cargaEfetiva);
  });

  it('respeita a alíquota RAT informada e a limita a 6%', () => {
    expect(simularSimples(base({ aliquotaRAT: 0.03 })).cppForaDAS).toBeCloseTo(69_000, 2);
    expect(simularSimples(base({ aliquotaRAT: 0.99 })).cppForaDAS).toBeCloseTo(78_000, 2);
    expect(simularSimples(base({ aliquotaRAT: -1 })).cppForaDAS).toBeCloseTo(60_000, 2);
  });

  it('não aplica CPP por fora em anexos onde ela já está no DAS', () => {
    for (const atividade of ['comércio varejista', 'indústria de brindes', 'consultoria']) {
      const r = simularSimples(base({ atividadePrincipal: atividade, percentualServicos: 0, percentualRevenda: 100 }));
      expect(r.anexoAplicavel).not.toBe('IV');
      expect(r.cppForaDAS ?? 0).toBe(0);
      expect(r.cpp).toBeGreaterThan(0);
    }
  });

  it('mantém invariantes financeiras em centenas de cenários do Anexo IV', () => {
    for (let i = 0; i < 400; i++) {
      const faturamentoAnual = 50_000 + Math.random() * 4_700_000;
      const folhaAnual = Math.random() * faturamentoAnual * 0.6;
      const rat = [0, 0.01, 0.02, 0.03][i % 4];
      const r = simularSimples(
        base({ faturamentoAnual, folhaAnual, aliquotaRAT: rat, issRetidoFonte: i % 5 === 0 ? 5_000 : 0 }),
      );
      expect(r.anexoAplicavel).toBe('IV');
      expect(Number.isFinite(r.totalTributos)).toBe(true);
      expect(r.totalTributos).toBeGreaterThanOrEqual(0);
      expect(r.cppForaDAS).toBeCloseTo(folhaAnual * (0.2 + rat), 6);
      expect(r.totalTributos).toBeGreaterThanOrEqual((r.cppForaDAS ?? 0) - 1e-6);
      expect(r.cargaEfetiva).toBeGreaterThan(0);
    }
  });
});
