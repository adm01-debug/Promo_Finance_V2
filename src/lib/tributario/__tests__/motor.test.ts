import { describe, it, expect } from 'vitest';
import { calcularRBT12, calcularRBA } from '../rbt12';
import { calcularFatorR, determinarAnexoPorFatorR } from '../fator-r';
import { identificarFaixa } from '../aliquotas-simples';
import { simularSimples } from '../simular-simples';
import { simularPresumido } from '../simular-presumido';
import { simularReal } from '../simular-real';
import { decidirRegime } from '../decidir-regime';

describe('Motor Tributário', () => {
  describe('RBT12', () => {
    it('calcula soma simples para 12+ meses', () => {
      const hist = Array.from({ length: 12 }, (_, i) => ({
        ano: 2024,
        mes: i + 1,
        receita_bruta: 100000,
      }));
      // Reference: jan/2025 → soma todos os 12 meses de 2024
      expect(calcularRBT12(hist, 2025, 1)).toBe(1_200_000);
    });

    it('proporcionaliza para empresa com <13 meses (início de atividade)', () => {
      const hist = [
        { ano: 2024, mes: 10, receita_bruta: 50000 },
        { ano: 2024, mes: 11, receita_bruta: 50000 },
        { ano: 2024, mes: 12, receita_bruta: 50000 },
      ];
      // 3 meses, R$ 150k → média R$ 50k × 12 = R$ 600k
      expect(calcularRBT12(hist, 2025, 1)).toBe(600_000);
    });

    it('retorna 0 sem histórico', () => {
      expect(calcularRBT12([], 2025, 1)).toBe(0);
    });

    it('RBA acumula apenas o ano-calendário', () => {
      const hist = [
        { ano: 2024, mes: 12, receita_bruta: 100 },
        { ano: 2025, mes: 1, receita_bruta: 200 },
        { ano: 2025, mes: 2, receita_bruta: 300 },
      ];
      expect(calcularRBA(hist, 2025)).toBe(500);
    });
  });

  describe('Fator R', () => {
    it('calcula corretamente', () => {
      expect(calcularFatorR(280_000, 1_000_000)).toBeCloseTo(0.28);
    });
    it('retorna 0 com RBT12 zero', () => {
      expect(calcularFatorR(100, 0)).toBe(0);
    });
    it('Fator R ≥ 0.28 → Anexo III', () => {
      expect(determinarAnexoPorFatorR(0.28)).toBe('III');
      expect(determinarAnexoPorFatorR(0.5)).toBe('III');
    });
    it('Fator R < 0.28 → Anexo V', () => {
      expect(determinarAnexoPorFatorR(0.27)).toBe('V');
    });
  });

  describe('Faixas Simples', () => {
    it('identifica faixa 1 do Anexo I', () => {
      const f = identificarFaixa(150_000, 'I');
      expect(f?.faixa).toBe(1);
      expect(f?.aliquota).toBe(0.04);
    });
    it('identifica faixa 6 do Anexo III', () => {
      const f = identificarFaixa(4_000_000, 'III');
      expect(f?.faixa).toBe(6);
    });
    it('retorna null acima do limite', () => {
      expect(identificarFaixa(5_000_000, 'I')).toBeNull();
    });
  });

  describe('Simular Simples', () => {
    it('rejeita acima de R$ 4,8 mi', () => {
      const r = simularSimples(
        { faturamentoAnual: 5_000_000, margemLucro: 10, percentualServicos: 50 },
        { anoReferencia: 2025, mesReferencia: 1 },
      );
      expect(r.elegivel).toBe(false);
    });

    it('calcula DAS para comércio na faixa 1', () => {
      const r = simularSimples(
        { faturamentoAnual: 120_000, margemLucro: 10, percentualServicos: 0 },
        { anoReferencia: 2025, mesReferencia: 1 },
      );
      expect(r.elegivel).toBe(true);
      expect(r.anexoAplicavel).toBe('I');
      expect(r.totalTributos).toBeCloseTo(120_000 * 0.04, 0); // 4% nominal sem PD na faixa 1
    });

    it('aplica Fator R para serviços com folha alta', () => {
      const r = simularSimples(
        {
          faturamentoAnual: 600_000,
          margemLucro: 20,
          percentualServicos: 100,
          folhaAnual: 200_000, // 33% > 28% → Anexo III
        },
        { anoReferencia: 2025, mesReferencia: 1 },
      );
      expect(r.anexoAplicavel).toBe('III');
    });

    it('aplica Anexo V quando folha é baixa', () => {
      const r = simularSimples(
        {
          faturamentoAnual: 600_000,
          margemLucro: 20,
          percentualServicos: 100,
          folhaAnual: 50_000, // 8% < 28% → Anexo V
        },
        { anoReferencia: 2025, mesReferencia: 1 },
      );
      expect(r.anexoAplicavel).toBe('V');
    });
  });

  describe('Simular Presumido', () => {
    it('rejeita acima de R$ 78 mi', () => {
      const r = simularPresumido({ faturamentoAnual: 100_000_000, margemLucro: 10, percentualServicos: 0 });
      expect(r.elegivel).toBe(false);
    });

    it('calcula corretamente para comércio', () => {
      const r = simularPresumido({ faturamentoAnual: 1_000_000, margemLucro: 10, percentualServicos: 0 });
      expect(r.elegivel).toBe(true);
      expect(r.totalTributos).toBeGreaterThan(0);
      expect(r.cargaEfetiva).toBeGreaterThan(0);
    });
  });

  describe('Simular Real', () => {
    it('é sempre elegível', () => {
      const r = simularReal({ faturamentoAnual: 50_000_000, margemLucro: 15, percentualServicos: 30 });
      expect(r.elegivel).toBe(true);
    });

    it('aplica adicional de IRPJ acima de 240k', () => {
      const r = simularReal({ faturamentoAnual: 10_000_000, margemLucro: 20, percentualServicos: 0 });
      // Lucro = 2M → adicional sobre 1.76M
      expect(r.irpj).toBeGreaterThan(2_000_000 * 0.15);
    });
  });

  describe('Decidir Regime', () => {
    it('retorna 3 cenários e recomendação', () => {
      const r = decidirRegime({ faturamentoAnual: 1_000_000, margemLucro: 15, percentualServicos: 30 });
      expect(r.cenarios).toHaveLength(3);
      expect(r.recomendado).toBeDefined();
      expect(r.recomendado.elegivel).toBe(true);
    });

    it('Lucro Real é fallback acima do limite Presumido', () => {
      const r = decidirRegime({ faturamentoAnual: 100_000_000, margemLucro: 8, percentualServicos: 0 });
      expect(r.recomendado.regime).toBe('lucro_real');
    });

    it('calcula economia vs regime atual', () => {
      const r = decidirRegime(
        { faturamentoAnual: 1_000_000, margemLucro: 30, percentualServicos: 0 },
        { regimeAtual: 'lucro_real' },
      );
      expect(r.economiaAnualVsAtual).toBeDefined();
    });
  });
});
