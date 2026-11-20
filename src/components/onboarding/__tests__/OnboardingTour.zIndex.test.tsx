/**
 * Cobertura do achado do Devin Review na PR #474: no Joyride 3, a prioridade
 * visual do tour migrou de `styles.tooltip.zIndex` para `options.zIndex`.
 * Sem ele, tooltip/overlay voltam para z-index 100/101 em vez de 10000,
 * deixando o tour sob o header/nav (regressão visual).
 *
 * Este teste fixa a prioridade 10000 nas duas pontas: `options.zIndex`
 * (componente de sobreposição) e `styles.tooltip.zIndex` (tooltip).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { OnboardingTour } from '../OnboardingTour';

const joyrideProps = vi.hoisted(() => ({
  values: [] as Array<{
    options?: Record<string, unknown>;
    styles?: Record<string, { zIndex?: unknown }>;
  }>,
}));

vi.mock('react-joyride', () => ({
  Joyride: (props: {
    options?: Record<string, unknown>;
    styles?: Record<string, { zIndex?: unknown }>;
  }) => {
    joyrideProps.values.push(props);
    return null;
  },
  STATUS: { FINISHED: 'finished', SKIPPED: 'skipped' },
}));

vi.mock('@/hooks/useOnboardingProgress', () => ({
  useOnboardingProgress: () => ({
    progress: null,
    loading: false,
    iniciarTour: vi.fn(),
    completarEtapa: vi.fn(),
    finalizar: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }),
  },
}));

describe('OnboardingTour — prioridade visual (zIndex)', () => {
  beforeEach(() => {
    joyrideProps.values.length = 0;
  });

  it('passa options.zIndex=10000 para o Joyride (sobreposição do tour)', () => {
    render(<OnboardingTour />);
    expect(joyrideProps.values).toHaveLength(1);
    expect(joyrideProps.values[0].options?.zIndex).toBe(10000);
  });

  it('mantém styles.tooltip.zIndex=10000 (tooltip do tour)', () => {
    render(<OnboardingTour />);
    expect(joyrideProps.values[0].styles?.tooltip?.zIndex).toBe(10000);
  });
});
