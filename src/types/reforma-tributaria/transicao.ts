export interface AliquotasTransicao {
  ano: number;
  cbs: number;
  ibs: number;
  icmsResidual: number;
  issResidual: number;
  pisResidual: number;
  cofinsResidual: number;
}

export const ALIQUOTAS_TRANSICAO: AliquotasTransicao[] = [
  { ano: 2026, cbs: 0.9, ibs: 0.1, icmsResidual: 100, issResidual: 100, pisResidual: 100, cofinsResidual: 100 },
  { ano: 2027, cbs: 8.8, ibs: 0.1, icmsResidual: 100, issResidual: 100, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2028, cbs: 8.8, ibs: 0.1, icmsResidual: 100, issResidual: 100, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2029, cbs: 8.8, ibs: 1.78, icmsResidual: 90, issResidual: 90, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2030, cbs: 8.8, ibs: 4.45, icmsResidual: 75, issResidual: 75, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2031, cbs: 8.8, ibs: 8.9, icmsResidual: 50, issResidual: 50, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2032, cbs: 8.8, ibs: 13.35, icmsResidual: 25, issResidual: 25, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2033, cbs: 8.8, ibs: 17.7, icmsResidual: 0, issResidual: 0, pisResidual: 0, cofinsResidual: 0 },
];

export const ALIQUOTA_REFERENCIA_IVA_DUAL = 26.5;
export const ALIQUOTA_CBS_REFERENCIA = 8.8;
export const ALIQUOTA_IBS_REFERENCIA = 17.7;
