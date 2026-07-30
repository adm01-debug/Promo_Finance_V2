import { describe, it, expect } from 'vitest';
import { simularSimples, type ParametrosSimulacao } from '../shared-logic';

const base = (over: Partial<ParametrosSimulacao> = {}): ParametrosSimulacao => ({
  faturamentoAnual: 1_000_000,
  margemLucro: 20,
  percentualServicos: 0,
  percentualRevenda: 100,
  folhaAnual: 100_000,
  ...over,
});

describe('Sublimite estadual e ISS retido no Simples Nacional', () => {
  it('não altera o DAS quando o RBT12 está abaixo do sublimite', () => {
    const r = simularSimples(base(), 2026, 7);
    expect(r.sublimiteExcedido).toBe(false);
    expect(r.icmsForaDAS).toBe(0);
    expect(r.totalTributos).toBeGreaterThan(0);
  });

  it('retira ICMS do DAS quando o RBT12 supera o sublimite (comércio)', () => {
    const p = base({ faturamentoAnual: 4_000_000 });
    const r = simularSimples(p, 2026, 7);
    expect(r.sublimiteExcedido).toBe(true);
    expect(r.icmsForaDAS).toBeCloseTo(4_000_000 * 0.18, 2);
    expect(r.icms).toBe(r.icmsForaDAS);
    expect(r.totalTributos).toBeGreaterThan(r.icms!);
  });

  it('retira ISS do DAS quando o RBT12 supera o sublimite (serviços Anexo III)', () => {
    const r = simularSimples(
      base({
        faturamentoAnual: 4_000_000,
        percentualServicos: 100,
        percentualRevenda: 0,
        folhaAnual: 1_500_000,
        aliquotaISS: 0.03,
      }),
      2026,
      7,
    );
    expect(r.anexoAplicavel).toBe('III');
    expect(r.sublimiteExcedido).toBe(true);
    expect(r.issForaDAS).toBeCloseTo(4_000_000 * 0.03, 2);
  });

  it('respeita sublimite customizado do estado', () => {
    const r = simularSimples(base({ faturamentoAnual: 2_000_000, sublimiteEstadual: 1_800_000 }), 2026, 7);
    expect(r.sublimiteExcedido).toBe(true);
  });

  it('deduz ISS retido na fonte do DAS, limitado à parcela de ISS', () => {
    const p = base({
      percentualServicos: 100,
      percentualRevenda: 0,
      folhaAnual: 400_000,
      issRetidoFonte: 5_000,
    });
    const semRetencao = simularSimples({ ...p, issRetidoFonte: 0 }, 2026, 7);
    const comRetencao = simularSimples(p, 2026, 7);
    expect(comRetencao.issRetidoDeduzido).toBeCloseTo(5_000, 2);
    expect(comRetencao.totalTributos).toBeCloseTo(semRetencao.totalTributos - 5_000, 2);
    expect(comRetencao.iss).toBeCloseTo(semRetencao.iss - 5_000, 2);
  });

  it('nunca gera DAS negativo com retenção acima da parcela de ISS', () => {
    const r = simularSimples(
      base({
        percentualServicos: 100,
        percentualRevenda: 0,
        folhaAnual: 400_000,
        issRetidoFonte: 10_000_000,
      }),
      2026,
      7,
    );
    expect(r.iss).toBeCloseTo(0, 6);
    expect(r.totalTributos).toBeGreaterThanOrEqual(0);
  });

  it('simulação de centenas de cenários mantém invariantes', () => {
    for (let i = 0; i < 300; i++) {
      const fat = 100_000 + (i * 15_000);
      if (fat > 4_800_000) break;
      const serv = (i % 101);
      const r = simularSimples(
        base({
          faturamentoAnual: fat,
          percentualServicos: serv,
          percentualRevenda: 100 - serv,
          folhaAnual: fat * ((i % 40) / 100),
          issRetidoFonte: i * 10,
        }),
        2026,
        7,
      );
      expect(Number.isFinite(r.totalTributos)).toBe(true);
      expect(r.totalTributos).toBeGreaterThanOrEqual(0);
      expect(r.iss).toBeGreaterThanOrEqual(0);
      expect(r.icms).toBeGreaterThanOrEqual(0);
      expect(r.cargaEfetiva).toBeLessThan(100);
    }
  });
});
