export interface Props {
  empresaId?: string;
  ano: number;
}

export type DatePreset = 'all' | 'today' | 'last7' | 'last30' | 'mes' | 'ano' | 'custom';

export interface LancamentosFilters extends Record<string, unknown> {
  busca: string;
  preset: DatePreset;
  dataInicio: string | null; // ISO yyyy-MM-dd
  dataFim: string | null;
}
