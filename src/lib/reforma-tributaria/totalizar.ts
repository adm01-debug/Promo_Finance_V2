/**
 * Totalização de tributos — evita rejeição 1091 (NT 2025.002)
 *
 * Regra obrigatória: vTotalTributos = Σ vCBS_item + Σ vIBS_item + Σ vIS_item
 * NUNCA aplique a alíquota sobre a soma das bases — diverge por arredondamento.
 */

export interface ItemTributavel {
  valorCBS: number;
  valorIBS: number;
  /** Split UF — se informado junto com valorIBSMun, usa; senão assume 50/50 */
  valorIBSUF?: number;
  valorIBSMun?: number;
  valorIS?: number;
}

export interface TotaisTributos {
  totalCBS: number;
  totalIBS: number;
  totalIBSUF: number;
  totalIBSMun: number;
  totalIS: number;
  /** CBS + IBS + IS */
  totalGeral: number;
}

/**
 * Totaliza tributos somando item a item (NT 2025.002 — rejeição 1091).
 */
export function totalizarTributos(itens: ItemTributavel[]): TotaisTributos {
  let totalCBS = 0;
  let totalIBSUF = 0;
  let totalIBSMun = 0;
  let totalIS = 0;

  for (const item of itens) {
    totalCBS += item.valorCBS;

    if (item.valorIBSUF !== undefined && item.valorIBSMun !== undefined) {
      totalIBSUF += item.valorIBSUF;
      totalIBSMun += item.valorIBSMun;
    } else {
      // Sem split explícito: 50/50 como fallback conservador
      totalIBSUF += item.valorIBS / 2;
      totalIBSMun += item.valorIBS / 2;
    }

    totalIS += item.valorIS ?? 0;
  }

  const totalIBS = totalIBSUF + totalIBSMun;
  const totalGeral = totalCBS + totalIBS + totalIS;

  return { totalCBS, totalIBS, totalIBSUF, totalIBSMun, totalIS, totalGeral };
}
