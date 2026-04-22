import type { BulkResult, BulkOutcome } from './sandbox-bulk-runner';

export interface BulkAggregate {
  total: number;
  counts: Record<BulkOutcome, number>;
  byBlockReason: Array<{ reason: string; count: number }>;
  byRole: Array<{ role: string; count: number }>;
  groupCoverage: Array<{ idp_group: string; app_role: string; matched_count: number }>;
}

const EMPTY_COUNTS: Record<BulkOutcome, number> = {
  bloqueado: 0,
  seria_jit: 0,
  usuario_existente: 0,
  sem_email: 0,
  erro_rede: 0,
};

export function aggregateBulk(results: BulkResult[]): BulkAggregate {
  const counts: Record<BulkOutcome, number> = { ...EMPTY_COUNTS };
  const reasonMap = new Map<string, number>();
  const roleMap = new Map<string, number>();
  const groupMap = new Map<string, { app_role: string; matched_count: number }>();

  for (const r of results) {
    counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;

    if (r.outcome === 'bloqueado' || r.outcome === 'sem_email' || r.outcome === 'erro_rede') {
      const reason = r.reason ?? 'Motivo desconhecido';
      reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
    }

    if (r.result?.preview.resolved_role) {
      const role = r.result.preview.resolved_role;
      roleMap.set(role, (roleMap.get(role) ?? 0) + 1);
    }

    const evals = r.result?.preview.role_mappings_evaluated ?? [];
    for (const m of evals) {
      const key = `${m.idp_group}→${m.app_role}`;
      const cur = groupMap.get(key) ?? { app_role: m.app_role, matched_count: 0 };
      if (m.status === 'matched') cur.matched_count++;
      groupMap.set(key, cur);
    }
  }

  const byBlockReason = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const byRole = Array.from(roleMap.entries())
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);

  const groupCoverage = Array.from(groupMap.entries())
    .map(([key, v]) => ({
      idp_group: key.split('→')[0],
      app_role: v.app_role,
      matched_count: v.matched_count,
    }))
    .sort((a, b) => b.matched_count - a.matched_count);

  return {
    total: results.length,
    counts,
    byBlockReason,
    byRole,
    groupCoverage,
  };
}
