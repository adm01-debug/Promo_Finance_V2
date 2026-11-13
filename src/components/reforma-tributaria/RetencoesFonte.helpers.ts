import { TipoRetencao } from '@/hooks/useRetencoesFonte';

export const TIPO_LABELS: Record<TipoRetencao, string> = {
  irrf: 'IRRF',
  csrf: 'CSRF',
  pis_cofins_csll: 'PIS/COFINS/CSLL',
  inss: 'INSS',
  iss: 'ISS',
  cbs: 'CBS',
  ibs: 'IBS',
};
