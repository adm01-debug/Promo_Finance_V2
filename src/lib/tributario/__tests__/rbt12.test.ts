import { describe, it, expect } from 'vitest';
import { calcularRBT12, calcularRBA } from '../rbt12';
import { FaturamentoMes } from '../types';

describe('calcularRBT12', () => {
  it('deve somar os últimos 12 meses quando houver histórico completo', () => {
    const historico: FaturamentoMes[] = [];
    for (let i = 1; i <= 15; i++) {
      historico.push({
        ano: 2024,
        mes: i > 12 ? i - 12 : i,
        receita_bruta: 100000,
        receita_exportacao: 0
      });
    }
    // Adicionando um ano diferente para garantir ordenação
    historico[12].ano = 2025; 
    historico[13].ano = 2025;
    historico[14].ano = 2025;

    // Referência: Março 2025. Deve pegar Fev 2025 retroativo a 12 meses.
    const result = calcularRBT12(historico, 2025, 3);
    expect(result).toBe(1200000); // 100k * 12
  });

  it('deve proporcionalizar quando houver menos de 12 meses (início de atividade)', () => {
    const historico: FaturamentoMes[] = [
      { ano: 2025, mes: 1, receita_bruta: 100000, receita_exportacao: 0 },
      { ano: 2025, mes: 2, receita_bruta: 200000, receita_exportacao: 0 },
    ];

    // Referência: Março 2025. Tem 2 meses. Média = 150k. RBT12 = 150k * 12 = 1.8M.
    const result = calcularRBT12(historico, 2025, 3);
    expect(result).toBe(1800000);
  });

  it('deve retornar 0 se não houver faturamento anterior', () => {
    const result = calcularRBT12([], 2025, 1);
    expect(result).toBe(0);
  });
});

describe('calcularRBA', () => {
  it('deve somar apenas faturamento do ano específico', () => {
    const historico: FaturamentoMes[] = [
      { ano: 2024, mes: 12, receita_bruta: 100000, receita_exportacao: 0 },
      { ano: 2025, mes: 1, receita_bruta: 50000, receita_exportacao: 0 },
      { ano: 2025, mes: 2, receita_bruta: 50000, receita_exportacao: 0 },
    ];
    
    expect(calcularRBA(historico, 2025)).toBe(100000);
    expect(calcularRBA(historico, 2024)).toBe(100000);
  });
});
