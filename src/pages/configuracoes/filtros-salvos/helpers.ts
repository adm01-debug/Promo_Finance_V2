import { logger } from '@/lib/logger';
import type { DiagnosticState, Divergence } from './types';

export function readLocalState(key?: string): {
  keys: string[];
  ts: string | null;
  tsIso: string | null;
  status: 'ok' | 'empty' | 'error';
} {
  if (!key || typeof window === 'undefined') return { keys: [], ts: null, tsIso: null, status: 'empty' };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { keys: [], ts: null, tsIso: null, status: 'empty' };
    const parsed = JSON.parse(raw);
    const filters = (parsed?.filters ?? parsed) as Record<string, unknown>;
    const tsIso = parsed?.ts ? new Date(parsed.ts).toISOString() : null;
    const ts = parsed?.ts ? new Date(parsed.ts).toLocaleString('pt-BR') : null;
    return { keys: Object.keys(filters || {}), ts, tsIso, status: 'ok' };
  } catch (e) {
    logger.warn('[FiltrosSalvos] failed reading local', { key, e });
    return { keys: [], ts: null, tsIso: null, status: 'error' };
  }
}

/**
 * Calcula a divergência entre o estado remoto (Supabase/conta) e local
 * (localStorage/dispositivo). Direção indica para onde o sync deve fluir
 * para reconciliar — quem está mais novo "vence" a próxima hidratação.
 */
export function computeDivergence(d?: DiagnosticState): Divergence {
  if (!d || d.remote === 'loading' || d.syncing) return { direction: 'unknown', reason: 'Carregando…' };
  if (d.remote === 'error') return { direction: 'unknown', reason: 'Erro ao ler conta' };

  const hasRemote = d.remote === 'ok';
  const hasLocal = d.local === 'ok';

  if (!hasRemote && !hasLocal) return { direction: 'none', reason: 'Sem filtros salvos' };
  if (hasRemote && !hasLocal) return { direction: 'remote-only', reason: 'Existe na conta, ausente neste dispositivo' };
  if (!hasRemote && hasLocal) return { direction: 'local-only', reason: 'Existe no dispositivo, ausente na conta' };

  const remoteSet = new Set(d.remoteKeys);
  const localSet = new Set(d.localKeys);
  const sameKeys =
    remoteSet.size === localSet.size && [...remoteSet].every((k) => localSet.has(k));

  const rT = d.remoteUpdatedAtIso ? Date.parse(d.remoteUpdatedAtIso) : NaN;
  const lT = d.localUpdatedAtIso ? Date.parse(d.localUpdatedAtIso) : NaN;

  if (Number.isFinite(rT) && Number.isFinite(lT)) {
    const diff = rT - lT;
    if (Math.abs(diff) < 2000 && sameKeys) return { direction: 'in-sync', reason: 'Conta e dispositivo idênticos' };
    if (diff > 0) return { direction: 'remote-newer', reason: 'Conta mais recente que dispositivo' };
    if (diff < 0) return { direction: 'local-newer', reason: 'Dispositivo mais recente que conta' };
  }

  if (sameKeys) return { direction: 'in-sync', reason: 'Mesmas chaves em ambos' };
  return { direction: 'unknown', reason: 'Chaves divergentes sem timestamp confiável' };
}
