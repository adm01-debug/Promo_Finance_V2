import { describe, it, expect } from 'vitest';
import { detectarDeliberacaoLucros } from '../detectar-deliberacao-lucros';
import { detectarRecuperacaoPisCofins } from '../detectar-recuperacao-pis-cofins';
import { detectarDepreciacaoAcelerada } from '../detectar-depreciacao-acelerada';
import { detectarSudeneSudam } from '../detectar-sudene-sudam';
import { analisarOportunidadesElisao } from '../orquestrador-elisao';
import type { ContextoEmpresa } from '../types';
import { ANOS_PRESCRICAO_CREDITO, ALIQUOTA_IRRF_DIVIDENDOS } from '../types';

const base: ContextoEmpresa = {
  empresa_id: 'emp-1',
  regime_atual: 'real',
  rbt12: 10_000_000,
  faturamento_anual: 10_000_000,
  lucro_liquido: 1_000_000,
};

describe('detectarDeliberacaoLucros', () => {
  const dentroDaJanela = new Date('2025-06-30T12:00:00-03:00');
  const foraDaJanela = new Date('2026-03-01T12:00:00-03:00');

  it('é aplicável dentro da janela com saldo e sem ata registrada', () => {
    const r = detectarDeliberacaoLucros(
      { ...base, lucros_acumulados_ate_2025: 2_000_000 },
      dentroDaJanela,
    );
    expect(r.aplicavel).toBe(true);
    expect(r.economia_estimada).toBeCloseTo(2_000_000 * ALIQUOTA_IRRF_DIVIDENDOS, 2);
  });

  it('não é aplicável após 31/12/2025', () => {
    const r = detectarDeliberacaoLucros(
      { ...base, lucros_acumulados_ate_2025: 2_000_000 },
      foraDaJanela,
    );
    expect(r.aplicavel).toBe(false);
    expect(r.economia_estimada).toBe(0);
    expect(r.observacoes).toContain('31/12/2025');
  });

  it('não é aplicável quando a ata já foi registrada', () => {
    const r = detectarDeliberacaoLucros(
      { ...base, lucros_acumulados_ate_2025: 500_000, deliberacao_lucros_registrada: true },
      dentroDaJanela,
    );
    expect(r.aplicavel).toBe(false);
  });

  it('não é aplicável sem saldo de lucros', () => {
    expect(detectarDeliberacaoLucros(base, dentroDaJanela).aplicavel).toBe(false);
  });
});

describe('detectarRecuperacaoPisCofins', () => {
  it('projeta o crédito informado sobre a janela prescricional', () => {
    const r = detectarRecuperacaoPisCofins({
      ...base,
      creditos_pis_cofins_nao_aproveitados: 100_000,
    });
    expect(r.aplicavel).toBe(true);
    expect(r.economia_estimada).toBe(100_000 * ANOS_PRESCRICAO_CREDITO);
    expect(r.observacoes).toBeUndefined();
  });

  it('usa proxy de receita quando o crédito não é informado', () => {
    const r = detectarRecuperacaoPisCofins(base);
    expect(r.economia_estimada).toBeCloseTo(10_000_000 * 0.003 * 5, 2);
    expect(r.observacoes).toContain('proxy');
  });

  it('não se aplica fora do Lucro Real', () => {
    const r = detectarRecuperacaoPisCofins({ ...base, regime_atual: 'presumido' });
    expect(r.aplicavel).toBe(false);
    expect(r.economia_estimada).toBe(0);
  });
});

describe('detectarDepreciacaoAcelerada', () => {
  const industrial: ContextoEmpresa = {
    ...base,
    cnae: '2229-3/02',
    investimento_maquinas_anual: 1_000_000,
  };

  it('aplica-se a indústria no Lucro Real com investimento e lucro', () => {
    const r = detectarDepreciacaoAcelerada(industrial);
    expect(r.aplicavel).toBe(true);
    // 1.000.000 × 90% × 34% × 12% × 4,5
    expect(r.economia_estimada).toBeCloseTo(1_000_000 * 0.9 * 0.34 * 0.12 * 4.5, 2);
  });

  it('reconhece indústria pelo percentual de receita industrial', () => {
    const r = detectarDepreciacaoAcelerada({
      ...base,
      percentual_industria: 80,
      investimento_maquinas_anual: 500_000,
    });
    expect(r.aplicavel).toBe(true);
  });

  it('não se aplica a CNAE de comércio', () => {
    const r = detectarDepreciacaoAcelerada({ ...industrial, cnae: '4649-4/08' });
    expect(r.aplicavel).toBe(false);
    expect(r.justificativa).toContain('industriais');
  });

  it('não se aplica sem investimento', () => {
    const r = detectarDepreciacaoAcelerada({ ...industrial, investimento_maquinas_anual: 0 });
    expect(r.aplicavel).toBe(false);
  });

  it('não se aplica sem lucro tributável', () => {
    const r = detectarDepreciacaoAcelerada({ ...industrial, lucro_liquido: 0 });
    expect(r.aplicavel).toBe(false);
  });
});

describe('detectarSudeneSudam', () => {
  it('aplica 75% sobre o IRPJ básico em UF da SUDENE', () => {
    const r = detectarSudeneSudam({ ...base, uf: 'PE' });
    expect(r.aplicavel).toBe(true);
    expect(r.economia_estimada).toBeCloseTo(1_000_000 * 0.15 * 0.75, 2);
    expect(r.justificativa).toContain('SUDENE');
  });

  it('reconhece UF da SUDAM', () => {
    const r = detectarSudeneSudam({ ...base, uf: 'am' });
    expect(r.aplicavel).toBe(true);
    expect(r.justificativa).toContain('SUDAM');
  });

  it('não se aplica a UF fora das áreas incentivadas', () => {
    const r = detectarSudeneSudam({ ...base, uf: 'SP' });
    expect(r.aplicavel).toBe(false);
    expect(r.economia_estimada).toBe(0);
  });

  it('não se aplica fora do Lucro Real', () => {
    const r = detectarSudeneSudam({ ...base, uf: 'BA', regime_atual: 'presumido' });
    expect(r.aplicavel).toBe(false);
  });
});

describe('orquestrador com as 13 estratégias', () => {
  it('mantém invariantes estruturais em qualquer contexto', () => {
    const contextos: ContextoEmpresa[] = [
      base,
      { ...base, regime_atual: 'simples', faturamento_anual: 0, rbt12: 0, lucro_liquido: 0 },
      { ...base, uf: 'CE', cnae: '2229-3/02', investimento_maquinas_anual: 300_000 },
      { ...base, regime_atual: 'presumido', lucro_liquido: -50_000 },
    ];

    for (const ctx of contextos) {
      const r = analisarOportunidadesElisao(ctx);
      expect(r.total_oportunidades).toBe(13);
      expect(new Set(r.oportunidades.map((o) => o.estrategia)).size).toBe(13);
      for (const o of r.oportunidades) {
        expect(o.economia_estimada).toBeGreaterThanOrEqual(0);
        expect(o.economia_min).toBeLessThanOrEqual(o.economia_max);
        expect(Number.isFinite(o.economia_estimada)).toBe(true);
        expect(o.proximos_passos.length).toBeGreaterThan(0);
        if (!o.aplicavel) expect(o.economia_estimada).toBe(0);
      }
      // Determinismo
      expect(analisarOportunidadesElisao(ctx)).toEqual(r);
    }
  });
});
