import { describe, it, expect } from 'vitest';
import { calcularFatorR, determinarAnexoPorFatorR } from '../fator-r';

describe('Fator R', () => {
  it('deve calcular corretamente a proporção folha/receita', () => {
    expect(calcularFatorR(28000, 100000)).toBe(0.28);
    expect(calcularFatorR(10000, 100000)).toBe(0.1);
    expect(calcularFatorR(0, 100000)).toBe(0);
  });

  it('deve retornar 0 se a receita for zero ou negativa para evitar divisão por zero', () => {
    expect(calcularFatorR(10000, 0)).toBe(0);
    expect(calcularFatorR(10000, -500)).toBe(0);
  });

  it('deve determinar o anexo correto com base no fator r', () => {
    expect(determinarAnexoPorFatorR(0.28)).toBe('III');
    expect(determinarAnexoPorFatorR(0.35)).toBe('III');
    expect(determinarAnexoPorFatorR(0.279)).toBe('V');
    expect(determinarAnexoPorFatorR(0.1)).toBe('V');
  });
});
