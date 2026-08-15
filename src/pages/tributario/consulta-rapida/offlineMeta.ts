/** Metadado gravado pelo hook quando a resposta veio do IndexedDB. */
export interface OfflineMeta {
  origem: 'cache';
  gravadoEm: number;
}

/**
 * Extrai o metadado `_offline` de uma resposta de consulta tributária.
 * Defensivo: aceita `unknown` porque o payload varia por recurso (UF/CNAE/NCM).
 */
export function extrairOffline(data: unknown): OfflineMeta | null {
  if (!data || typeof data !== 'object') return null;
  const meta = (data as { _offline?: unknown })._offline;
  if (!meta || typeof meta !== 'object') return null;
  const { origem, gravadoEm } = meta as Partial<OfflineMeta>;
  if (origem !== 'cache' || typeof gravadoEm !== 'number' || !Number.isFinite(gravadoEm)) return null;
  return { origem, gravadoEm };
}

/** Formata o instante da gravação em pt-BR, tolerando timestamps inválidos. */
export function formatarGravadoEm(gravadoEm: number): string {
  const d = new Date(gravadoEm);
  if (Number.isNaN(d.getTime())) return 'data desconhecida';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
