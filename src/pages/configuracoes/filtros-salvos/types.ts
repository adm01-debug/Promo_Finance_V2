export interface DiagnosticState {
  entityType: string;
  remote: 'ok' | 'empty' | 'error' | 'loading';
  remoteUpdatedAt: string | null;
  remoteUpdatedAtIso: string | null;
  remoteKeys: string[];
  local: 'ok' | 'empty' | 'error';
  localKeys: string[];
  localUpdatedAt: string | null;
  localUpdatedAtIso: string | null;
  syncing: boolean;
}

export type DivergenceDirection =
  | 'in-sync'
  | 'remote-newer'
  | 'local-newer'
  | 'remote-only'
  | 'local-only'
  | 'none'
  | 'unknown';

export interface Divergence {
  direction: DivergenceDirection;
  reason: string;
}
