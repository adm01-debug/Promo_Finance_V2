export interface ConciliacaoFilterState {
  periodoInicio: string;
  periodoFim: string;
  valorMin: string;
  valorMax: string;
  tipo: 'todos' | 'credito' | 'debito';
  confiancaIA: 'todos' | 'alta' | 'media' | 'baixa';
  centroCustoId: string;
}

export const INITIAL_FILTERS: ConciliacaoFilterState = {
  periodoInicio: '',
  periodoFim: '',
  valorMin: '',
  valorMax: '',
  tipo: 'todos',
  confiancaIA: 'todos',
  centroCustoId: 'todos',
};
