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


describe('detectarJCP — limite duplo do art. 9º §1º (Lei 9.249/95)', () => {
  const ctx: ContextoEmpresa = {
    empresa_id: 'jcp-limite',
    regime_atual: 'real',
    rbt12: 20_000_000,
    faturamento_anual: 20_000_000,
    patrimonio_liquido: 10_000_000,
    lucro_liquido: 100_000,
  };

  it('usa 50% dos lucros acumulados quando superior a 50% do lucro do exercício', () => {
    const r = detectarJCP({ ...ctx, lucros_acumulados: 4_000_000 });
    // limitePL = 10.000.000 × TJLP = 712.000 | limite legal = max(50.000, 2.000.000)
    expect(r.memoria_calculo.limite_legal_aplicado).toBeCloseTo(2_000_000, 2);
    expect(r.memoria_calculo.jcp_dedutivel).toBeCloseTo(10_000_000 * TJLP_ANUAL, 2);
    expect(r.observacoes).toContain('lucros acumulados');
  });

  it('soma reservas de lucros aos lucros acumulados na formação do limite', () => {
    const r = detectarJCP({ ...ctx, lucros_acumulados: 300_000, reservas_lucros: 500_000 });
    expect(r.memoria_calculo.limite_lucros_acumulados).toBeCloseTo(400_000, 2);
  });

  it('permite JCP com prejuízo no exercício, mas lucros acumulados positivos', () => {
    const r = detectarJCP({ ...ctx, lucro_liquido: -50_000, lucros_acumulados: 1_000_000 });
    expect(r.aplicavel).toBe(true);
    expect(r.memoria_calculo.limite_lucro_exercicio).toBe(0);
    expect(r.memoria_calculo.jcp_dedutivel).toBeGreaterThan(0);
  });

  it('respeita a base restrita do PL da Lei 14.789/2023 quando informada', () => {
    const r = detectarJCP({ ...ctx, patrimonio_liquido_base_jcp: 2_000_000, lucros_acumulados: 5_000_000 });
    expect(r.memoria_calculo.base_patrimonio_liquido).toBe(2_000_000);
    expect(r.memoria_calculo.jcp_dedutivel).toBeCloseTo(2_000_000 * TJLP_ANUAL, 2);
  });

  it('mantém coerência entre economia bruta, IRRF e economia líquida', () => {
    const r = detectarJCP({ ...ctx, lucros_acumulados: 4_000_000 });
    const m = r.memoria_calculo;
    expect(m.economia_irpj_csll - m.irrf_a_pagar).toBeCloseTo(m.economia_liquida, 6);
    expect(r.economia_estimada).toBeCloseTo(m.jcp_dedutivel * 0.19, 6);
  });

  it('zera a memória de cálculo quando a estratégia não é aplicável', () => {
    const r = detectarJCP({ ...ctx, regime_atual: 'presumido', lucros_acumulados: 4_000_000 });
    expect(r.aplicavel).toBe(false);
    expect(r.memoria_calculo.jcp_dedutivel).toBe(0);
    expect(r.economia_estimada).toBe(0);
  });

  it('nunca ultrapassa o teto econômico PL × TJLP em 500 cenários aleatórios', () => {
    for (let i = 0; i < 500; i++) {
      const pl = 100_001 + Math.random() * 50_000_000;
      const c: ContextoEmpresa = {
        ...ctx,
        patrimonio_liquido: pl,
        lucro_liquido: Math.random() * 8_000_000 - 1_000_000,
        lucros_acumulados: Math.random() * 20_000_000,
        reservas_lucros: Math.random() * 5_000_000,
      };
      const m = detectarJCP(c).memoria_calculo;
      expect(m.jcp_dedutivel).toBeLessThanOrEqual(m.limite_pl_tjlp + 1e-6);
      expect(m.jcp_dedutivel).toBeLessThanOrEqual(m.limite_legal_aplicado + 1e-6);
      expect(m.jcp_dedutivel).toBeGreaterThanOrEqual(0);
    }
  });
});
