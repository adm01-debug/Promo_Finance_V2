export interface PartidaFlat {
  data: string;
  numero: number | null;
  historico: string;
  conta_id: string;
  conta_codigo: string;
  conta_nome: string;
  debito: number;
  credito: number;
}

export type DatePreset = 'all' | 'today' | 'last7' | 'last30' | 'mes' | 'ano' | 'custom';

export interface RazaoFilters extends Record<string, unknown> {
  preset: DatePreset;
  dataInicio: string;
  dataFim: string;
  contaId: string;
  busca: string;
}

export interface RazaoGrupo {
  conta_id: string;
  codigo: string;
  nome: string;
  saldo_inicial: number;
  movs: PartidaFlat[];
}
