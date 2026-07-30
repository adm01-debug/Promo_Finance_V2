// MOTOR DE FOLHA — Apuração de encargos patronais com RAT ajustado pelo FAP.

import {
  ALIQUOTA_CPP, ALIQUOTA_FGTS, FAP_MAXIMO, FAP_MINIMO,
  RAT_AJUSTADO_MAXIMO, RAT_AJUSTADO_MINIMO, buscarFpas, grauRiscoPorCnae,
} from './tabelas';
import {
  RAT_POR_GRAU,
  type InputCprb, type InputEncargosPatronais, type LinhaEncargo,
  type ResultadoCprb, type ResultadoEncargosPatronais,
} from './types';

const sanitizar = (valor: number | undefined): number =>
  Number.isFinite(valor) && (valor as number) > 0 ? (valor as number) : 0;

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;

/** Aplica os limites legais do FAP (0,5000 a 2,0000). */
export function normalizarFap(fap?: number): number {
  if (!Number.isFinite(fap)) return 1;
  return Math.min(FAP_MAXIMO, Math.max(FAP_MINIMO, fap as number));
}

/** RAT ajustado = RAT nominal × FAP, respeitando o intervalo de 0,5% a 6%. */
export function calcularRatAjustado(ratNominal: number, fap?: number): number {
  const bruto = ratNominal * normalizarFap(fap);
  return Math.min(RAT_AJUSTADO_MAXIMO, Math.max(RAT_AJUSTADO_MINIMO, bruto));
}

/** Determina o RAT nominal a partir de override, grau de risco ou CNAE. */
export function resolverRatNominal(
  input: Pick<InputEncargosPatronais, 'aliquotaRat' | 'grauRisco'>,
  cnae?: string | null,
): number {
  if (Number.isFinite(input.aliquotaRat) && (input.aliquotaRat as number) >= 0) {
    return input.aliquotaRat as number;
  }
  const grau = input.grauRisco ?? grauRiscoPorCnae(cnae) ?? 'medio';
  return RAT_POR_GRAU[grau];
}

export function calcularEncargosPatronais(
  input: InputEncargosPatronais,
  cnae?: string | null,
): ResultadoEncargosPatronais {
  const alertas: string[] = [];
  const linhas: LinhaEncargo[] = [];

  const proLabore = sanitizar(input.proLabore);
  const folhaTotal = sanitizar(input.folha);
  // Pró-labore integra a CPP, mas não RAT/Terceiros/FGTS (IN RFB 2.110/22, art. 32).
  const baseRatTerceiros = Math.max(0, folhaTotal - Math.min(proLabore, folhaTotal));
  const baseCpp = folhaTotal;

  const ratNominal = resolverRatNominal(input, cnae);
  const fap = normalizarFap(input.fap);
  const ratAjustado = calcularRatAjustado(ratNominal, input.fap);

  const fpas = buscarFpas(input.fpas);
  const aliquotaTerceiros = Number.isFinite(input.aliquotaTerceiros) && (input.aliquotaTerceiros as number) >= 0
    ? (input.aliquotaTerceiros as number)
    : fpas.aliquotaTerceiros;

  const desobrigadoPatronal = Boolean(input.simplesNacional) || Boolean(input.imunePatronal);

  const cpp = desobrigadoPatronal ? 0 : arredondar(baseCpp * ALIQUOTA_CPP);
  const rat = desobrigadoPatronal ? 0 : arredondar(baseRatTerceiros * ratAjustado);
  const terceiros = desobrigadoPatronal ? 0 : arredondar(baseRatTerceiros * aliquotaTerceiros);
  const incluirFgts = input.incluirFgts !== false;
  const fgts = incluirFgts ? arredondar(baseRatTerceiros * ALIQUOTA_FGTS) : 0;

  if (!desobrigadoPatronal) {
    linhas.push({
      rubrica: 'CPP (INSS patronal)', base: baseCpp, aliquota: ALIQUOTA_CPP, valor: cpp,
      fundamento: 'Lei 8.212/91, art. 22, I',
    });
    linhas.push({
      rubrica: `RAT ajustado (RAT ${(ratNominal * 100).toFixed(1)}% × FAP ${fap.toFixed(4)})`,
      base: baseRatTerceiros, aliquota: ratAjustado, valor: rat,
      fundamento: 'Lei 8.212/91, art. 22, II c/c Lei 10.666/03, art. 10',
    });
    linhas.push({
      rubrica: `Terceiros (FPAS ${fpas.fpas} — ${fpas.descricao})`,
      base: baseRatTerceiros, aliquota: aliquotaTerceiros, valor: terceiros,
      fundamento: 'IN RFB 2.110/2022, Anexo II',
    });
  } else {
    alertas.push(
      input.simplesNacional
        ? 'Optante do Simples Nacional (Anexos I a III): CPP e Terceiros já recolhidos no DAS.'
        : 'Entidade imune/isenta: contribuição patronal não devida.',
    );
  }

  if (incluirFgts) {
    linhas.push({
      rubrica: 'FGTS', base: baseRatTerceiros, aliquota: ALIQUOTA_FGTS, valor: fgts,
      fundamento: 'Lei 8.036/90, art. 15',
    });
  }

  if (input.fap !== undefined && normalizarFap(input.fap) !== input.fap) {
    alertas.push(`FAP informado (${input.fap}) fora do intervalo legal 0,5000–2,0000; ajustado para ${fap.toFixed(4)}.`);
  }
  if (proLabore > folhaTotal) {
    alertas.push('Pró-labore informado é maior que a folha total; base de RAT/Terceiros zerada.');
  }
  if (fap < 1 && !desobrigadoPatronal) {
    alertas.push(`FAP bonificado (${fap.toFixed(4)}) reduz o RAT de ${(ratNominal * 100).toFixed(1)}% para ${(ratAjustado * 100).toFixed(3)}%.`);
  }

  const totalInss = arredondar(cpp + rat + terceiros);
  const totalEncargos = arredondar(totalInss + fgts);

  return {
    baseCpp, baseRatTerceiros, ratNominal, fap, ratAjustado, aliquotaTerceiros,
    cpp, rat, terceiros, fgts, totalInss, totalEncargos,
    percentualSobreFolha: folhaTotal > 0 ? totalEncargos / folhaTotal : 0,
    linhas, alertas,
  };
}

/** Compara a folha onerada (CPP 20%) com a CPRB sobre a receita bruta. */
export function compararDesoneracaoFolha(input: InputCprb): ResultadoCprb {
  const alertas: string[] = [];
  const receitaBruta = sanitizar(input.receitaBruta);
  const aliquotaCprb = Number.isFinite(input.aliquotaCprb) && input.aliquotaCprb > 0 ? input.aliquotaCprb : 0;

  const onerado = calcularEncargosPatronais(input.encargos);
  const cprb = arredondar(receitaBruta * aliquotaCprb);

  // Na CPRB substitui-se apenas a cota patronal de 20%; RAT, Terceiros e FGTS permanecem.
  const encargosRemanescentes = arredondar(onerado.rat + onerado.terceiros + onerado.fgts);
  const totalDesonerado = arredondar(cprb + encargosRemanescentes);
  const totalOnerado = onerado.totalEncargos;
  const economia = arredondar(totalOnerado - totalDesonerado);

  if (onerado.cpp === 0) {
    alertas.push('Empresa sem CPP devida: a desoneração não produz efeito.');
  }
  if (aliquotaCprb === 0) {
    alertas.push('Alíquota de CPRB não informada; comparativo considera CPRB igual a zero.');
  }

  return {
    cprb, aliquotaCprb, receitaBruta,
    cppFolha: onerado.cpp,
    encargosRemanescentes, totalDesonerado, totalOnerado, economia,
    recomendacao: economia > 0 ? 'cprb' : 'folha',
    alertas,
  };
}
