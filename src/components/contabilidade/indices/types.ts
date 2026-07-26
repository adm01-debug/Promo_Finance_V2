export interface IndicesFilters {
  dataInicio: string;
  dataFim: string;
  compararAnterior: boolean;
  busca: string;
  /** Índices plotados na série histórica. */
  serie: string[];
}
