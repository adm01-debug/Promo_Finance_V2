export interface HistoricoRow {
  id: string;
  ano_calendario: number;
  created_at: string;
  total_lancamentos: number;
  total_linhas: number;
  status: string;
  hash_sha256: string | null;
  storage_path: string;
  recibo_transmissao: string | null;
  validacoes: { erros: string[]; avisos: string[] };
  tipo: string;
  periodo_inicio: string;
  periodo_fim: string;
  gerado_por: string | null;
  empresa_id: string;
}

export type StatusFilter = 'all' | 'liberada' | 'bloqueada' | 'transmitida';
export type ValidacaoFilter = 'all' | 'com_erros' | 'com_avisos' | 'sem_alertas';
export type ExportStatus = 'idle' | 'queued' | 'processing' | 'done' | 'error';

export const DRAFT_KEY = (tipo: 'ECD' | 'ECF', empresaId?: string) =>
  `sped-wizard-draft:${tipo}:${empresaId || '_'}`;

export const AUDIT_EXPANDED_KEY = (empresaId?: string) =>
  `sped-audit:expanded:${empresaId || '_'}`;
