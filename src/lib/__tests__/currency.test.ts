import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  parseCurrency, 
  valueToCents, 
  centsToValue, 
  sumCurrency, 
  compareCurrency,
  calculateInstallments
} from '../currency';

describe('Currency Utilities - Robustness & Regression', () => {
  
  describe('Floating Point Precision', () => {
    it('deve somar valores decimais corretamente evitando erros de precisão IEEE 754', () => {
      const values = [0.1, 0.2];
      // Em JS puro, 0.1 + 0.2 === 0.30000000000000004
      const sum = sumCurrency(values);
      expect(sum).toBe(0.3);
    });

    it('deve lidar com somas complexas com muitos decimais', () => {
      const values = [10.25, 20.10, 30.05, 0.01];
      const sum = sumCurrency(values);
      expect(sum).toBe(60.41);
    });
  });

  describe('Currency Parsing', () => {
    it('deve fazer o parse correto de strings formatadas em BRL', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
      expect(parseCurrency('1.234,56')).toBe(1234.56);
      expect(parseCurrency('-R$ 1.234,56')).toBe(-1234.56);
    });

    it('deve lidar com notação compacta no parsing', () => {
      expect(parseCurrency('1.5K')).toBe(1500);
      expect(parseCurrency('1M')).toBe(1000000);
    });

    it('deve retornar NaN para strings inválidas', () => {
      expect(parseCurrency('texto inválido')).toBeNaN();
    });
  });

  describe('Installments calculation', () => {
    it('deve calcular parcelas sem juros e garantir que a soma bate com o total', () => {
      const result = calculateInstallments(1000, 3, 0);
      const sum = result.installmentDetails.reduce((acc, p) => acc + p.value, 0);
      expect(sum).toBe(1000);
      expect(result.installmentValue).toBe(333.33);
      expect(result.installmentDetails[2].value).toBe(333.34); // Última parcela absorve resíduo
    });

    it('deve calcular parcelas com juros compostos (Tabela Price)', () => {
      const result = calculateInstallments(1000, 10, 1); // 1% ao mês
      expect(result.installmentValue).toBe(105.58);
      expect(result.totalWithInterest).toBe(1055.82);
    });
  });

  describe('Comparison', () => {
    it('deve comparar valores monetários ignorando imprecisões mínimas', () => {
      expect(compareCurrency(0.1 + 0.2, 0.3)).toBe(0);
      expect(compareCurrency(100.05, 100.04)).toBe(1);
      expect(compareCurrency(50.00, 60.00)).toBe(-1);
    });
  });
});
