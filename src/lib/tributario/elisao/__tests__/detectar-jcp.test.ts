import { describe, it, expect } from 'vitest';
import { detectarJCP } from '../detectar-jcp';
import { ContextoEmpresa, TJLP_ANUAL } from '../types';

describe('detectarJCP', () => {
  const baseCtx: ContextoEmpresa = {
    empresa_id: '123',
    regime_atual: 'real',
    rbt12: 12000000,
    faturamento_anual: 12000000,
    patrimonio_liquido: 1000000,
    lucro_liquido: 500000,
  };

  it('deve identificar oportunidade aplicável para empresa Lucro Real com PL e lucro positivos', () => {
    const result = detectarJCP(baseCtx);
    
    expect(result.aplicavel).toBe(true);
    expect(result.estrategia).toBe('JCP');
    
    // Calculo esperado: 
    // limitePL = 1.000.000 * TJLP_ANUAL (0.0712) = 71.200
    // limiteLucro = 500.000 * 0.5 = 250.000
    // jcpDedutivel = min(71.200, 250.000) = 71.200
    // economiaEstimada = 71.200 * 0.19 = 13.528
    
    expect(result.economia_estimada).toBeCloseTo(13528, 0);
    expect(result.risco).toBe('baixo');
    expect(result.justificativa).toContain('Empresa Lucro Real com PL');
  });

  it('deve limitar JCP a 50% do lucro se o limite do PL for superior', () => {
    const ctx = {
      ...baseCtx,
      patrimonio_liquido: 10000000, // limitePL = 712.000
      lucro_liquido: 100000,       // limiteLucro = 50.000
    };
    
    const result = detectarJCP(ctx);
    
    // jcpDedutivel deve ser 50.000 (limite do lucro)
    // economiaEstimada = 50.000 * 0.19 = 9.500
    expect(result.economia_estimada).toBeCloseTo(9500, 0);
  });

  it('não deve ser aplicável para empresas fora do Lucro Real', () => {
    const ctxPresumido: ContextoEmpresa = { ...baseCtx, regime_atual: 'presumido' };
    const ctxSimples: ContextoEmpresa = { ...baseCtx, regime_atual: 'simples' };
    
    expect(detectarJCP(ctxPresumido).aplicavel).toBe(false);
    expect(detectarJCP(ctxSimples).aplicavel).toBe(false);
  });

  it('não deve ser aplicável se PL for baixo (<= 100k)', () => {
    const ctx = { ...baseCtx, patrimonio_liquido: 100000 };
    const result = detectarJCP(ctx);
    expect(result.aplicavel).toBe(false);
  });

  it('não deve ser aplicável se lucro for zero ou negativo', () => {
    const ctxZero = { ...baseCtx, lucro_liquido: 0 };
    const ctxNegativo = { ...baseCtx, lucro_liquido: -100 };
    
    expect(detectarJCP(ctxZero).aplicavel).toBe(false);
    expect(detectarJCP(ctxNegativo).aplicavel).toBe(false);
  });

  it('deve lidar com valores ausentes de PL ou Lucro', () => {
    const ctx: ContextoEmpresa = {
      empresa_id: '123',
      regime_atual: 'real',
      rbt12: 100000,
      faturamento_anual: 100000
    };
    
    const result = detectarJCP(ctx);
    expect(result.aplicavel).toBe(false);
    expect(result.economia_estimada).toBe(0);
  });

  describe('testes de fronteira (boundary values)', () => {
    it('deve ser aplicável exatamente no limite de PL (R$ 100.000,01)', () => {
      const ctx = { ...baseCtx, patrimonio_liquido: 100000.01, lucro_liquido: 50000 };
      const result = detectarJCP(ctx);
      expect(result.aplicavel).toBe(true);
    });

    it('não deve ser aplicável exatamente em R$ 100.000,00 de PL', () => {
      const ctx = { ...baseCtx, patrimonio_liquido: 100000, lucro_liquido: 50000 };
      const result = detectarJCP(ctx);
      expect(result.aplicavel).toBe(false);
    });

    it('deve ser aplicável com lucro mínimo (R$ 0,01)', () => {
      const ctx = { ...baseCtx, patrimonio_liquido: 500000, lucro_liquido: 0.01 };
      const result = detectarJCP(ctx);
      expect(result.aplicavel).toBe(true);
    });

    it('não deve ser aplicável com lucro zero', () => {
      const ctx = { ...baseCtx, patrimonio_liquido: 500000, lucro_liquido: 0 };
      const result = detectarJCP(ctx);
      expect(result.aplicavel).toBe(false);
    });

    it('deve usar limite de 50% do lucro quando for exatamente igual ao limite de PL', () => {
      // limitePL = PL * TJLP_ANUAL
      // Queremos: limitePL = 50% do lucro
      // lucro = (PL * TJLP_ANUAL) / 0.5
      const pl = 1000000;
      const limitePL = pl * TJLP_ANUAL; // 71.200
      const lucro = limitePL / 0.5; // 142.400
      
      const ctx = { ...baseCtx, patrimonio_liquido: pl, lucro_liquido: lucro };
      const result = detectarJCP(ctx);
      
      // jcpDedutivel = min(71200, 71200) = 71200
      expect(result.economia_estimada).toBeCloseTo(limitePL * 0.19, 0);
    });
  });
});

