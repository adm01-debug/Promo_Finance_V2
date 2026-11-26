// Etapa 84: a consulta por NCM também responde "qual cClassTrib, quanta redução
// e qual norma". O catálogo é a fonte; aqui só filtramos e reduzimos as linhas ao
// que a tela mostra, para o componente não carregar regra de negócio.
import {
  escolherFundamento,
  resumoFundamento,
  type FundamentoLegalResumo,
  type FundamentosLegais,
} from '@/lib/tributario/catalogos/fundamentacao-legal';
import type { CclasstribCatalogo } from '@/lib/tributario/catalogos/cclasstrib';

/** Linha pronta para a tabela da consulta pública. */
export interface LinhaCclasstribReducao {
  cclasstrib: string;
  cst: string;
  descricao: string;
  exigeGibscbs: boolean;
  /** Fração de redução (0,6 = 60%), como vem do catálogo. */
  pRedCbs: number;
  pRedIbsUf: number;
  pRedIbsMun: number;
  /** Norma que fundamenta a classificação, quando o catálogo já foi carregado. */
  fundamento?: FundamentoLegalResumo;
}

export interface FiltroCclasstrib {
  /** CST exato; vazio significa "todos". */
  cst?: string;
  /** Trecho do código ou da descrição, sem acento e sem caixa. */
  busca?: string;
}

/** Compara texto sem acento e sem caixa: "Isencao" acha "Isenção". */
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** CSTs presentes no catálogo, em ordem, para alimentar o seletor. */
export function cstsDoCatalogo(opcoes: readonly CclasstribCatalogo[]): string[] {
  const csts = new Set<string>();
  for (const opcao of opcoes) {
    const cst = opcao.cst.trim();
    if (cst) csts.add(cst);
  }
  return [...csts].sort((a, b) => a.localeCompare(b));
}

/**
 * Filtra por CST e por trecho e anexa o fundamento do par cClassTrib/CST.
 *
 * `escolherFundamento` já cai para a primeira linha do cClassTrib quando a RFB
 * publicou o par com outro CST — o mesmo critério do alerta REG-011, para tela e
 * validação não divergirem.
 */
export function montarLinhasCclasstrib(
  opcoes: readonly CclasstribCatalogo[],
  fundamentos: FundamentosLegais,
  filtro: FiltroCclasstrib = {}
): LinhaCclasstribReducao[] {
  const cst = (filtro.cst ?? '').trim();
  const busca = normalizar((filtro.busca ?? '').trim());
  const linhas: LinhaCclasstribReducao[] = [];

  for (const opcao of opcoes) {
    if (cst && opcao.cst.trim() !== cst) continue;
    if (busca && !normalizar(`${opcao.cclasstrib} ${opcao.descricao}`).includes(busca)) continue;
    linhas.push({
      cclasstrib: opcao.cclasstrib,
      cst: opcao.cst,
      descricao: opcao.descricao,
      exigeGibscbs: opcao.exigeGibscbs,
      pRedCbs: opcao.pRedCbs,
      pRedIbsUf: opcao.pRedIbsUf,
      pRedIbsMun: opcao.pRedIbsMun,
      fundamento: resumoFundamento(escolherFundamento(fundamentos, opcao.cclasstrib, opcao.cst)),
    });
  }

  return linhas;
}
