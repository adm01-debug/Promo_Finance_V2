import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('should handle tailwind merge conflicts', () => {
    // tailwind-merge should keep the last conflicting class
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('mt-4', 'mt-8')).toBe('mt-8');
  });

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should handle complex combinations', () => {
    const result = cn(
      'base-class',
      { conditional: true },
      ['array-class'],
      undefined,
      'final-class'
    );
    expect(result).toBe('base-class conditional array-class final-class');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(undefined)).toBe('');
  });

  it('should properly merge border radius classes', () => {
    expect(cn('rounded-md', 'rounded-lg')).toBe('rounded-lg');
  });

  it('should properly merge flex classes', () => {
    expect(cn('flex-row', 'flex-col')).toBe('flex-col');
  });
});
