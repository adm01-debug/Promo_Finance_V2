import type { BalanceteRow } from '@/lib/contabil/balancete-utils';

export type { BalanceteRow };

export interface BalanceteFilters extends Record<string, unknown> {
  dataInicio: string;
  dataFim: string;
  nivelMax: string;
  apenasComMovimento: boolean;
  busca: string;
}
