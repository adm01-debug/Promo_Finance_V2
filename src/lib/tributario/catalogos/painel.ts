// CATÁLOGOS FISCAIS — Agregação pura para o painel administrativo de coerência.
//
// Este módulo não faz I/O: recebe os registros já lidos do banco e devolve
// o estado consolidado de cada catálogo (OK / divergente / vazio), pronto
// para renderização. Toda a lógica é determinística e testável isoladamente.

import { compararFaixasComCatalogo, descreverDivergencias } from './coerencia';
import {
  compararItensIssComCatalogo,
  descreverDivergenciasIss,
  type ItemIssBanco,
} from './coerencia-iss';
import {
  compararNcmsComCatalogo,
  descreverDivergenciasNcm,
  type NcmBanco,
} from './coerencia-ncm';
import { compararUfsComCatalogo, validarMarcadorFcp } from './coerencia-ufs';
import type {
  AliquotaInterestadualCatalogo,
  FaixaSimplesCatalogo,
  UfCatalogo,
} from './types';

/** Situação consolidada de um catálogo no painel. */
export type SituacaoCatalogo = 'ok' | 'divergente' | 'vazio';

export interface StatusCatalogo {
  /** Identificador estável, usado como key de renderização. */
  id: 'ufs' | 'interestaduais' | 'faixas_simples' | 'itens_iss' | 'ncms';
  titulo: string;
  situacao: SituacaoCatalogo;
  /** Quantidade de registros carregados do banco. */
  registros: number;
  /** Quantidade esperada quando o catálogo é fechado (null = variável). */
  esperado: number | null;
  /** Mensagens legíveis descrevendo cada problema encontrado. */
  problemas: string[];
}

export interface ResumoPainelCatalogos {
  catalogos: StatusCatalogo[];
  totalRegistros: number;
  totalProblemas: number;
  /** Pior situação entre todos os catálogos. */
  situacaoGeral: SituacaoCatalogo;
}

const UFS_ESPERADAS = 27;
const PARES_INTERESTADUAIS_ESPERADOS = UFS_ESPERADAS * (UFS_ESPERADAS - 1); // 702

/** Regiões cujo destino recebe 7% quando a origem é Sul/Sudeste (exceto ES). */
const REGIOES_SETE_PORCENTO = new Set(['NORTE', 'NORDESTE', 'CENTRO_OESTE']);
const ORIGENS_SETE_PORCENTO = new Set(['SUL', 'SUDESTE']);

const EPSILON = 1e-9;
const iguais = (a: number, b: number) => Math.abs(a - b) <= EPSILON;

/**
 * Alíquota interestadual esperada pela regra constitucional vigente:
 * 7% de Sul/Sudeste (exceto ES) para Norte/Nordeste/Centro-Oeste e ES;
 * 12% nos demais casos entre contribuintes.
 */
export function aliquotaInterestadualEsperada(
  origem: UfCatalogo,
  destino: UfCatalogo,
): number {
  const origemPrivilegiada = ORIGENS_SETE_PORCENTO.has(origem.regiao) && origem.sigla !== 'ES';
  const destinoBeneficiado = REGIOES_SETE_PORCENTO.has(destino.regiao) || destino.sigla === 'ES';
  return origemPrivilegiada && destinoBeneficiado ? 0.07 : 0.12;
}

/**
 * Valida o catálogo interestadual contra a regra constitucional e a
 * alíquota de importado (4%, Resolução SF 13/2012).
 */
export function validarInterestaduais(
  ufs: readonly UfCatalogo[],
  aliquotas: readonly AliquotaInterestadualCatalogo[],
): string[] {
  const problemas: string[] = [];
  const porSigla = new Map(ufs.map((u) => [u.sigla, u]));
  const vistos = new Set<string>();

  for (const a of aliquotas) {
    const chave = `${a.uf_origem}->${a.uf_destino}`;
    if (vistos.has(chave)) {
      problemas.push(`${chave}: par duplicado no catálogo`);
      continue;
    }
    vistos.add(chave);

    if (a.uf_origem === a.uf_destino) {
      problemas.push(`${chave}: operação interna não deve constar no catálogo interestadual`);
      continue;
    }

    const origem = porSigla.get(a.uf_origem);
    const destino = porSigla.get(a.uf_destino);
    if (!origem || !destino) {
      problemas.push(`${chave}: UF inexistente no catálogo de UFs`);
      continue;
    }

    const esperada = aliquotaInterestadualEsperada(origem, destino);
    if (!iguais(Number(a.aliquota), esperada)) {
      problemas.push(`${chave}: alíquota ${a.aliquota} ≠ esperada ${esperada}`);
    }

    if (!iguais(Number(a.aliquota_importado), 0.04)) {
      problemas.push(`${chave}: alíquota de importado ${a.aliquota_importado} ≠ 0.04`);
    }
  }

  if (ufs.length === UFS_ESPERADAS && aliquotas.length !== PARES_INTERESTADUAIS_ESPERADOS) {
    problemas.push(
      `Cobertura incompleta: ${aliquotas.length} pares carregados, ${PARES_INTERESTADUAIS_ESPERADOS} esperados`,
    );
  }

  return problemas;
}

function situacao(registros: number, problemas: readonly string[]): SituacaoCatalogo {
  if (registros === 0) return 'vazio';
  return problemas.length > 0 ? 'divergente' : 'ok';
}

const PESO_SITUACAO: Record<SituacaoCatalogo, number> = { ok: 0, divergente: 2, vazio: 1 };

/** Consolida o estado dos três catálogos base para o painel administrativo. */
export function resumirPainelCatalogos(entrada: {
  ufs: readonly UfCatalogo[];
  interestaduais: readonly AliquotaInterestadualCatalogo[];
  faixas: readonly FaixaSimplesCatalogo[];
  /** Itens da LC 116 vindos do banco. Omitido = catálogo não consultado. */
  itensIss?: readonly ItemIssBanco[];
  /** Catálogo de NCMs do banco. Omitido = catálogo não consultado. */
  ncms?: readonly NcmBanco[];
}): ResumoPainelCatalogos {
  const { ufs, interestaduais, faixas, itensIss, ncms } = entrada;

  const problemasUfs = [
    ...compararUfsComCatalogo(ufs).map((d) =>
      d.campo === 'ausente'
        ? `${d.uf}: ausente no catálogo do banco`
        : d.campo === 'excedente'
          ? `${d.uf}: presente no banco mas desconhecida pelo motor`
          : `${d.uf} — ${d.campo}: motor ${d.valorCodigo} ≠ banco ${d.valorBanco}`,
    ),
    ...validarMarcadorFcp(ufs),
  ];
  if (ufs.length > 0 && ufs.length !== UFS_ESPERADAS) {
    problemasUfs.push(`Total de UFs ${ufs.length} ≠ ${UFS_ESPERADAS}`);
  }

  const problemasInter = validarInterestaduais(ufs, interestaduais);
  const problemasFaixas = descreverDivergencias(compararFaixasComCatalogo(faixas));

  const catalogos: StatusCatalogo[] = [
    {
      id: 'ufs',
      titulo: 'Unidades Federativas (ICMS interno e FCP)',
      situacao: situacao(ufs.length, problemasUfs),
      registros: ufs.length,
      esperado: UFS_ESPERADAS,
      problemas: problemasUfs,
    },
    {
      id: 'interestaduais',
      titulo: 'Alíquotas interestaduais',
      situacao: situacao(interestaduais.length, problemasInter),
      registros: interestaduais.length,
      esperado: PARES_INTERESTADUAIS_ESPERADOS,
      problemas: problemasInter,
    },
    {
      id: 'faixas_simples',
      titulo: 'Faixas do Simples Nacional',
      situacao: situacao(faixas.length, problemasFaixas),
      registros: faixas.length,
      esperado: 30,
      problemas: problemasFaixas,
    },
  ];

  if (itensIss) {
    const problemasIss = descreverDivergenciasIss(compararItensIssComCatalogo(itensIss));
    catalogos.push({
      id: 'itens_iss',
      titulo: 'Itens da lista de serviços (LC 116/2003)',
      situacao: situacao(itensIss.length, problemasIss),
      registros: itensIss.length,
      esperado: null,
      problemas: problemasIss,
    });
  }

  if (ncms) {
    const problemasNcm = descreverDivergenciasNcm(compararNcmsComCatalogo(ncms));
    catalogos.push({
      id: 'ncms',
      titulo: 'NCMs (TIPI, monofásico e ST)',
      situacao: situacao(ncms.length, problemasNcm),
      registros: ncms.length,
      esperado: null,
      problemas: problemasNcm,
    });
  }

  const situacaoGeral = catalogos.reduce<SituacaoCatalogo>(
    (pior, c) => (PESO_SITUACAO[c.situacao] > PESO_SITUACAO[pior] ? c.situacao : pior),
    'ok',
  );

  return {
    catalogos,
    totalRegistros: catalogos.reduce((s, c) => s + c.registros, 0),
    totalProblemas: catalogos.reduce((s, c) => s + c.problemas.length, 0),
    situacaoGeral,
  };
}
