import { describe, expect, it } from 'vitest';

import { secureRandomInt } from '../secure-random';

describe('secureRandomInt', () => {
  it('returns integers inside [min, max)', () => {
    for (let i = 0; i < 200; i++) {
      const v = secureRandomInt(1500, 2500);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1500);
      expect(v).toBeLessThan(2500);
    }
  });

  it('handles a single-element range and rejects inverted bounds', () => {
    expect(secureRandomInt(5, 6)).toBe(5);
    expect(secureRandomInt(7, 7)).toBe(7);
    expect(() => secureRandomInt(9, 3)).toThrow(RangeError);
  });

  it('rejects ranges wider than the 32-bit source instead of looping', () => {
    expect(() => secureRandomInt(0, 0x100000001)).toThrow(RangeError);
    expect(() => secureRandomInt(0, Infinity)).toThrow(RangeError);
    expect(() => secureRandomInt(0, NaN)).toThrow(RangeError);
  });

  it('covers the full range without a crypto dependency', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(secureRandomInt(0, 10));
    expect(seen.size).toBe(10);
    for (const v of seen) expect(v).toBeGreaterThanOrEqual(0);
  });
});
