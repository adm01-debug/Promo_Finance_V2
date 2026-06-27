import { describe, it, expect } from 'vitest';
import { resolvePreset } from '../presets';
import type { TransitionName } from '../types';

describe('resolvePreset', () => {
  const effects: TransitionName[] = [
    'fade', 'blur-rise', 'slide-left', 'slide-right', 'slide-up', 'slide-down',
    'zoom-in', 'zoom-out', 'flip-x', 'flip-y', 'parallax', 'scale', 'none',
  ];

  it.each(effects)('retorna variants completas para %s', (effect) => {
    const p = resolvePreset({ effect });
    expect(p.variants.initial).toBeDefined();
    expect(p.variants.animate).toBeDefined();
    expect(p.variants.exit).toBeDefined();
  });

  it('marca needsPerspective em flip-x/flip-y', () => {
    expect(resolvePreset({ effect: 'flip-x' }).needsPerspective).toBe(true);
    expect(resolvePreset({ effect: 'flip-y' }).needsPerspective).toBe(true);
    expect(resolvePreset({ effect: 'fade' }).needsPerspective).toBe(false);
  });

  it('aplica duração customizada (ms → s)', () => {
    const p = resolvePreset({ effect: 'fade', duration: 500 });
    expect(p.transition).toMatchObject({ duration: 0.5 });
  });

  it('aceita easing spring', () => {
    const p = resolvePreset({ effect: 'fade', easing: 'spring' });
    expect(p.transition).toMatchObject({ type: 'spring' });
  });

  it('aceita cubic-bezier array', () => {
    const p = resolvePreset({ effect: 'fade', easing: [0.25, 0.1, 0.25, 1] });
    expect(p.transition).toMatchObject({ ease: [0.25, 0.1, 0.25, 1] });
  });

  it('respeita distance custom em slide', () => {
    const p = resolvePreset({ effect: 'slide-left', distance: 100 });
    expect((p.variants.initial as { x: number }).x).toBe(100);
  });
});
