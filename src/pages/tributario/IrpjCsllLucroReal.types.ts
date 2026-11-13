import type { AjusteLalur } from '@/lib/tributario/irpj-csll';

export interface LinhaPeriodo {
  id: string;
  rotulo: string;
  lucroLiquido: number;
  receitaBruta: number;
  irrf: number;
  csllRetida: number;
  ajustes: AjusteLalur[];
}
