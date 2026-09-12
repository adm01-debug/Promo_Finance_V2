import { describe, expect, it } from 'vitest';
import { runScenario } from '../runner';
import type { FaultKind, ScenarioSpec } from '../types';

function simularEntrega(fault: FaultKind): ReturnType<typeof runScenario> {
  const spec: ScenarioSpec = {
    id: `entregas-${fault}`,
    domain: 'entregas',
    fault: { kind: fault },
    seed: 42,
    size: 3,
  };
  return runScenario(spec);
}

describe('cenários de entregas', () => {
  it('executa o fluxo rastreável completo em vez de ignorar o domínio', () => {
    const resultado = simularEntrega('none');

    expect(resultado.mutations).toBeGreaterThan(0);
    expect(resultado.violations).toEqual([]);
  });

  it.each([
    'entrega_driver_offline',
    'entrega_gps_lost',
    'entrega_pod_missing',
    'entrega_status_regressivo',
  ] satisfies FaultKind[])('preserva invariantes com a falha %s', (fault) => {
    expect(simularEntrega(fault).violations).toEqual([]);
  });
});
