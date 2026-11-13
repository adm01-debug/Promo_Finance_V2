export type TipoRelatorio =
  | 'dre-tributario'
  | 'balancete'
  | 'comparativo'
  | 'creditos'
  | 'carga-efetiva';

export interface Props {
  empresaId?: string;
}
