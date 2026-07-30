import { describe, it, expect } from 'vitest';
import { simularSimples } from '../simular-simples';
import { simularPresumido } from '../simular-presumido';
import { simularReal } from '../simular-real';
import { decidirRegime } from '../decidir-regime';
import { LIMITE_SIMPLES_NACIONAL } from '../aliquotas-simples';

const baseOptions = { anoReferencia: 2024, mesReferencia: 1 };

describe('Testes de Robustez e Casos de Borda Tributários', () => {
  describe('Valores Extremos e Arredondamentos', () => {
    it('deve lidar com faturamento zero corretamente', () => {
      const params = { faturamentoAnual: 0, margemLucro: 15, percentualServicos: 50 };
      
      const simples = simularSimples(params, baseOptions);
      const presumido = simularPresumido(params);
      const real = simularReal(params);
      
      expect(simples.totalTributos).toBe(0);
      expect(presumido.totalTributos).toBe(0);
      expect(real.totalTributos).toBe(0);
      expect(simples.cargaEfetiva).toBe(0);
    });

    it('deve lidar com margem de lucro de 100% corretamente', () => {
      const faturamento = 1_000_000;
      const params = { faturamentoAnual: faturamento, margemLucro: 100, percentualServicos: 0 };
      
      const real = simularReal(params);
      // IRPJ: 15% de 1M + 10% de (1M - 240k) = 150k + 76k = 226k
      // CSLL: 9% de 1M = 90k
      expect(real.irpj).toBeCloseTo(226_000, 0);
      expect(real.csll).toBeCloseTo(90_000, 0);
    });

    it('deve lidar com faturamentos bilionários (limites de tipos numéricos)', () => {
      const faturamento = 1_000_000_000; // 1 Bilhão
      const params = { faturamentoAnual: faturamento, margemLucro: 10, percentualServicos: 10, folhaAnual: 100_000_000 };
      
      const real = simularReal(params);
      expect(real.totalTributos).toBeGreaterThan(0);
      expect(Number.isFinite(real.totalTributos)).toBe(true);
    });

    it('deve garantir precisão em arredondamentos de alíquotas efetivas', () => {
      // Caso onde a dízima periódica poderia ocorrer
      const params = { faturamentoAnual: 333_333.33, margemLucro: 15, percentualServicos: 0 };
      const simples = simularSimples(params, baseOptions);
      
      expect(simples.cargaEfetiva).toBeGreaterThan(0);
      expect(simples.totalTributos).toBeCloseTo(params.faturamentoAnual * (simples.cargaEfetiva / 100), 2);
    });
  });

  describe('Ausência de Dados e Fallbacks', () => {
    it('deve funcionar com parâmetros mínimos no decidirRegime', () => {
      const params = { faturamentoAnual: 100_000, margemLucro: 10, percentualServicos: 0 };
      const resultado = decidirRegime(params);
      
      expect(resultado.recomendado).toBeDefined();
      expect(resultado.cenarios.length).toBe(3);
    });

    it('deve lidar com folhaAnual ausente (undefined) tratando como zero', () => {
      const params = { faturamentoAnual: 500_000, margemLucro: 10, percentualServicos: 100 };
      // Sem folhaAnual, Fator R deve ser 0 -> Anexo V no Simples
      const simples = simularSimples(params, baseOptions);
      
      expect(simples.anexoAplicavel).toBe('V');
      expect(simples.fatorR).toBe(0);
    });

    it('deve lidar com faturamento mensal vazio ([]) tratando como zero', () => {
      const params = { faturamentoAnual: 100_000, margemLucro: 10, percentualServicos: 0, faturamentoMensal: [] };
      const simples = simularSimples(params, baseOptions);
      
      // RBT12 deve fallback para faturamentoAnual
      expect(simples.rbt12).toBe(100_000);
    });
  });

  describe('Limites Legais (Edge Cases)', () => {
    it('exatamente no limite do Simples Nacional (R$ 4,8M) deve ser elegível', () => {
      const params = { faturamentoAnual: LIMITE_SIMPLES_NACIONAL, margemLucro: 10, percentualServicos: 0 };
      const simples = simularSimples(params, baseOptions);
      
      expect(simples.elegivel).toBe(true);
      expect(simples.faixaAplicavel).toBe(6);
    });

    it('R$ 0,01 acima do limite do Simples Nacional deve ser inelegível', () => {
      const params = { faturamentoAnual: LIMITE_SIMPLES_NACIONAL + 0.01, margemLucro: 10, percentualServicos: 0 };
      const simples = simularSimples(params, baseOptions);
      
      expect(simples.elegivel).toBe(false);
    });

    it('limite do Lucro Presumido (R$ 78M) deve ser elegível', () => {
      const params = { faturamentoAnual: 78_000_000, margemLucro: 10, percentualServicos: 0 };
      const presumido = simularPresumido(params);
      
      expect(presumido.elegivel).toBe(true);
    });

    it('R$ 1,00 acima do limite do Lucro Presumido deve ser inelegível', () => {
      const params = { faturamentoAnual: 78_000_001, margemLucro: 10, percentualServicos: 0 };
      const presumido = simularPresumido(params);
      
      expect(presumido.elegivel).toBe(false);
    });
  });
});
