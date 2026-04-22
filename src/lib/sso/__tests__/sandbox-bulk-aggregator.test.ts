import { describe, it, expect } from 'vitest';
import { aggregateBulk } from '../sandbox-bulk-aggregator';
import type { BulkResult } from '../sandbox-bulk-runner';

function mkResult(over: Partial<BulkResult>): BulkResult {
  return {
    row: 1,
    claims: {},
    result: null,
    outcome: 'bloqueado',
    reason: null,
    ...over,
  };
}

function mkPreview(over: Partial<NonNullable<BulkResult['result']>['preview']> = {}) {
  return {
    email: 'a***z@empresa.com.br',
    full_name: 'X',
    groups: [],
    domain: 'empresa.com.br',
    domain_allowed: true,
    resolved_role: 'visualizador',
    matched_group: null,
    user_exists: false,
    would_jit_provision: true,
    provision_blocked_reason: null,
    provider_nome: null,
    auto_provision_users: true,
    role_mappings_evaluated: [],
    ...over,
  } as NonNullable<BulkResult['result']>['preview'];
}

describe('aggregateBulk', () => {
  it('soma counts por outcome', () => {
    const agg = aggregateBulk([
      mkResult({ outcome: 'seria_jit' }),
      mkResult({ outcome: 'seria_jit' }),
      mkResult({ outcome: 'usuario_existente' }),
      mkResult({ outcome: 'bloqueado', reason: 'X' }),
      mkResult({ outcome: 'sem_email', reason: 'Sem email' }),
      mkResult({ outcome: 'erro_rede', reason: 'timeout' }),
    ]);
    expect(agg.total).toBe(6);
    expect(agg.counts.seria_jit).toBe(2);
    expect(agg.counts.usuario_existente).toBe(1);
    expect(agg.counts.bloqueado).toBe(1);
    expect(agg.counts.sem_email).toBe(1);
    expect(agg.counts.erro_rede).toBe(1);
  });

  it('agrupa motivos de bloqueio ordenados desc', () => {
    const agg = aggregateBulk([
      mkResult({ outcome: 'bloqueado', reason: 'Domínio fora' }),
      mkResult({ outcome: 'bloqueado', reason: 'Domínio fora' }),
      mkResult({ outcome: 'bloqueado', reason: 'JIT off' }),
    ]);
    expect(agg.byBlockReason).toEqual([
      { reason: 'Domínio fora', count: 2 },
      { reason: 'JIT off', count: 1 },
    ]);
  });

  it('distribui papéis resolvidos', () => {
    const agg = aggregateBulk([
      mkResult({
        outcome: 'seria_jit',
        result: { success: true, errors: [], preview: mkPreview({ resolved_role: 'admin' }) },
      }),
      mkResult({
        outcome: 'seria_jit',
        result: { success: true, errors: [], preview: mkPreview({ resolved_role: 'admin' }) },
      }),
      mkResult({
        outcome: 'seria_jit',
        result: { success: true, errors: [], preview: mkPreview({ resolved_role: 'visualizador' }) },
      }),
    ]);
    expect(agg.byRole).toEqual([
      { role: 'admin', count: 2 },
      { role: 'visualizador', count: 1 },
    ]);
  });

  it('cobre regras: matched_count zero indica regra morta', () => {
    const agg = aggregateBulk([
      mkResult({
        outcome: 'seria_jit',
        result: {
          success: true,
          errors: [],
          preview: mkPreview({
            role_mappings_evaluated: [
              { idp_group: 'Admins', app_role: 'admin', status: 'matched', ordem: 0 },
              { idp_group: 'Op', app_role: 'operacional', status: 'no_match', ordem: 1 },
            ],
          }),
        },
      }),
    ]);
    const admins = agg.groupCoverage.find(g => g.idp_group === 'Admins');
    const op = agg.groupCoverage.find(g => g.idp_group === 'Op');
    expect(admins?.matched_count).toBe(1);
    expect(op?.matched_count).toBe(0);
  });

  it('lida com lista vazia', () => {
    const agg = aggregateBulk([]);
    expect(agg.total).toBe(0);
    expect(agg.byBlockReason).toEqual([]);
    expect(agg.byRole).toEqual([]);
    expect(agg.groupCoverage).toEqual([]);
  });
});
