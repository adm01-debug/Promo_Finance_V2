/**
 * Base de cálculo oficial IBS/CBS — NT 2025.002 v1.51+ / art. 11 LC 214/2025
 *
 * baseRG = vProd + vFrete + vSeg + vOutro − vDesc − vICMS − vFCP
 *          − vPIS − vCOFINS (apenas 2026, art. 348 LC 214/2025 — ano-teste)
 *          + vIS (se incidente)
 */

export interface CamposBaseCalculo {
  vProd: number;
  vFrete?: number;
  vSeg?: number;
  vOutro?: number;
  vDesc?: number;
  /** ICMS destacado na NF-e */
  vICMS?: number;
  /** Fundo de Combate à Pobreza */
  vFCP?: number;
  /** PIS destacado (deduzido apenas em 2026) */
  vPIS?: number;
  /** COFINS destacado (deduzido apenas em 2026) */
  vCOFINS?: number;
  /** Imposto Seletivo, quando incidente */
  vIS?: number;
}

export interface ResultadoBaseCalculo {
  baseRG: number;
  avisos: string[];
}

/**
 * Calcula a base de cálculo unificada IBS/CBS conforme NT 2025.002.
 * Em 2026, deduz PIS/COFINS (art. 348 — CBS/IBS compensáveis/dispensados no ano-teste).
 */
export function calcularBaseCalculo(
  campos: CamposBaseCalculo,
  anoReferencia: number
): ResultadoBaseCalculo {
  const avisos: string[] = [];

  // PIS/COFINS só deduzem em 2026 (ano-teste, art. 348 LC 214/2025)
  const vPIS = anoReferencia === 2026 ? (campos.vPIS ?? 0) : 0;
  const vCOFINS = anoReferencia === 2026 ? (campos.vCOFINS ?? 0) : 0;

  if (anoReferencia === 2026 && campos.vPIS === undefined && campos.vCOFINS === undefined) {
    avisos.push(
      '2026: vPIS/vCOFINS não informados — base pode estar ligeiramente acima do correto (art. 348 LC 214/2025).'
    );
  }

  const baseRG =
    (campos.vProd ?? 0) +
    (campos.vFrete ?? 0) +
    (campos.vSeg ?? 0) +
    (campos.vOutro ?? 0) -
    (campos.vDesc ?? 0) -
    (campos.vICMS ?? 0) -
    (campos.vFCP ?? 0) -
    vPIS -
    vCOFINS +
    (campos.vIS ?? 0);

  if (baseRG < 0) {
    avisos.push(`Base negativa (${baseRG.toFixed(2)}): verifique os campos de dedução.`);
  }

  return { baseRG: Math.max(0, baseRG), avisos };
}
