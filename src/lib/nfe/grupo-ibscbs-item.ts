// Monta o grupo IBS/CBS de um item da NF-e (NT 2025.002) a partir do cClassTrib
// escolhido. Percentuais em %, como em `ItemNFe`; valores em reais.
//
// O calculo usa as aliquotas de transicao da Fase 2 (cronograma oficial) e as
// reducoes do catalogo oficial de cClassTrib: a aliquota efetiva do item e a
// aliquota cheia do ano multiplicada por (1 - reducao). Sem catalogo carregado
// nao ha reducao a aplicar — e sem reducao, aliquota cheia.
import {
  arredondarAliquota,
  arredondarBase,
  calcularComArredondamento,
} from '@/lib/reforma-tributaria/arredondamento';
import { obterAliquotasTransicao } from '@/lib/reforma-tributaria/regras';

/**
 * cClassTrib de brinde/mercadoria tributada integralmente (CST 000). E o default
 * por NCM: quando o item nao tem enquadramento proprio, o grupo IBS/CBS nao pode
 * sair vazio (UB12-10), e supor reducao seria pior do que supor aliquota cheia.
 */
export const CCLASS_TRIB_PADRAO_BRINDE = '000001';

/** Reducoes vigentes do cClassTrib no catalogo oficial (fracao 0-1). */
export interface ReducaoCatalogo {
  pRedCbs: number;
  pRedIbsUf: number;
  pRedIbsMun: number;
}

/** Grupo IBS/CBS calculado de um item. */
export interface GrupoIbscbsItem {
  vBC: number;
  pCBS: number;
  vCBS: number;
  pIBSUF: number;
  vIBSUF: number;
  pIBSMun: number;
  vIBSMun: number;
  vIBS: number;
}

const ZERADO: GrupoIbscbsItem = {
  vBC: 0,
  pCBS: 0,
  vCBS: 0,
  pIBSUF: 0,
  vIBSUF: 0,
  pIBSMun: 0,
  vIBSMun: 0,
  vIBS: 0,
};

/**
 * Reducao do catalogo nunca extrapola 0-100%: valor ausente ou corrompido vira
 * zero (aliquota cheia), jamais uma reducao maior que a devida.
 */
const fracaoReducao = (valor: number): number => {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(1, Math.max(0, valor));
};

/** Calcula o grupo IBS/CBS de um item a partir do valor total e das reducoes do catalogo. */
export function calcularGrupoIbscbs(
  valorItem: number,
  reducao?: ReducaoCatalogo | null,
  ano: number = new Date().getFullYear()
): GrupoIbscbsItem {
  if (!Number.isFinite(valorItem) || valorItem <= 0) return { ...ZERADO };

  const aliquotas = obterAliquotasTransicao(ano);
  const pCBS = arredondarAliquota(aliquotas.cbs * (1 - fracaoReducao(reducao?.pRedCbs ?? 0)));
  const pIBSUF = arredondarAliquota(aliquotas.ibsUf * (1 - fracaoReducao(reducao?.pRedIbsUf ?? 0)));
  const pIBSMun = arredondarAliquota(
    aliquotas.ibsMun * (1 - fracaoReducao(reducao?.pRedIbsMun ?? 0))
  );

  const vCBS = calcularComArredondamento(valorItem, pCBS);
  const vIBSUF = calcularComArredondamento(valorItem, pIBSUF);
  const vIBSMun = calcularComArredondamento(valorItem, pIBSMun);

  return {
    vBC: arredondarBase(valorItem),
    pCBS,
    vCBS,
    pIBSUF,
    vIBSUF,
    pIBSMun,
    vIBSMun,
    vIBS: arredondarBase(vIBSUF + vIBSMun),
  };
}

/**
 * Default de cClassTrib por NCM (`CCLASS_TRIB_PADRAO_BRINDE`). Devolve `null`
 * quando o item ja tem codigo escolhido, quando o NCM ainda nao tem 8 digitos ou
 * quando o catalogo carregado nao tem o codigo padrao — nesses casos a tela pede
 * a escolha explicita em vez de inventar enquadramento.
 */
export function resolverCclassTribPadrao(
  ncm: string,
  cClassTribAtual: string | undefined,
  codigosNoCatalogo: ReadonlySet<string>
): string | null {
  if (cClassTribAtual) return null;
  if (ncm.replace(/\D/g, '').length !== 8) return null;
  return codigosNoCatalogo.has(CCLASS_TRIB_PADRAO_BRINDE) ? CCLASS_TRIB_PADRAO_BRINDE : null;
}
