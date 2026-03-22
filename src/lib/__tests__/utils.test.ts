import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (classname merge)', () => {
  it('mescla classes', () => expect(cn('a', 'b')).toBe('a b'));
  it('resolve conflitos tailwind', () => expect(cn('p-2', 'p-4')).toBe('p-4'));
  it('ignora undefined', () => expect(cn('a', undefined, 'b')).toBe('a b'));
  it('ignora false', () => expect(cn('a', false && 'hidden', 'b')).toBe('a b'));
  it('vazio', () => expect(cn()).toBe(''));
  it('condicionais', () => {
    const active = true;
    expect(cn('base', active && 'active')).toBe('base active');
  });
});
