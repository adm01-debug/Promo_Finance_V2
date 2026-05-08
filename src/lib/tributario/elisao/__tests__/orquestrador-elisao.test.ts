import { describe, it, expect } from 'vitest';
import { analisarOportunidadesElisao } from '../orquestrador-elisao';
import { ContextoEmpresa } from '../types';

describe('analisarOportunidadesElisao', () => {
  it('deve consolidar e ranquear as oportunidades detectadas', () => {
    const ctx: ContextoEmpresa = {
      empresa_id: 'emp_123',
      regime_atual: 'real',
      rbt12: 10000000,
      faturamento_anual: 10000000,
      patrimonio_liquido: 5000000,
      lucro_liquido: 1000000,
      despesas_pd: 500000, // Gatilho para Lei do Bem
    };

    const result = analisarOportunidadesElisao(ctx);

    expect(result.total_oportunidades).toBe(9);
    expect(result.total_aplicaveis).toBeGreaterThanOrEqual(2); // Pelo menos JCP e Lei do Bem
    expect(result.economia_total_estimada).toBeGreaterThan(0);
    
    // Deve estar ranqueado por economia decrescente
    for (let i = 0; i < result.oportunidades.length - 1; i++) {
      expect(result.oportunidades[i].economia_estimada).toBeGreaterThanOrEqual(
        result.oportunidades[i + 1].economia_estimada
      );
    }
  });

  it('deve retornar zero economia aplicável para uma empresa recém-aberta sem dados', () => {
    const ctx: ContextoEmpresa = {
      empresa_id: 'new_emp',
      regime_atual: 'simples',
      rbt12: 0,
      faturamento_anual: 0
    };

    const result = analisarOportunidadesElisao(ctx);
    expect(result.total_aplicaveis).toBe(0);
    expect(result.economia_total_estimada).toBe(0);
  });
});
