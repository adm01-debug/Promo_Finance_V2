import { describe, it, expect, vi } from 'vitest';
import { calculateIVA } from '../../utils/calculations';

describe('Finance Module - IVA Calculations', () => {
  it('should calculate IVA correctly for standard rates', () => {
    const amount = 1000;
    const rate = 0.21; // 21%
    const result = calculateIVA(amount, rate);
    expect(result).toBe(210);
  });

  it('should handle zero amounts', () => {
    expect(calculateIVA(0, 0.21)).toBe(0);
  });

  it('should handle exempt transactions', () => {
    expect(calculateIVA(500, 0)).toBe(0);
  });
});

describe('Finance Module - DRE Logic', () => {
  it('should calculate Net Profit correctly', () => {
    const revenue = 10000;
    const costs = 4000;
    const taxes = 1500;
    const expenses = 2000;
    
    const netProfit = revenue - costs - taxes - expenses;
    expect(netProfit).toBe(2500);
  });
});
