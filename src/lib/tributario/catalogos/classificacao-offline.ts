// Pacote de cClassTrib + fundamentacao que a tela consome, com o fallback
// offline decidido num unico lugar.
//
// A escolha "sirvo o cache ou mostro indisponivel" morava dentro do queryFn do
// hook, onde nao dava para testar falha parcial do banco. Aqui ela e funcao de
// dependencias injetadas: sem rede com cache, com rede sem fundamentacao e com
// tudo ok.
import { TTL_PADRAO_MS, type EntradaCache } from '@/lib/offline/fiscal-cache';
import { horizonteVigencia, menorVigencia, type CclasstribCatalogo } from './cclasstrib';
import { fundamentosVazios, type FundamentosLegais } from './fundamentacao-legal';
import { hojeIso } from './repositorio';

/** Payload guardado no IndexedDB sob a chave da consulta. */
export interface PacoteClassificacaoTributaria {
  opcoes: CclasstribCatalogo[];
  fundamentos: FundamentosLegais;
}

export interface DadosClassificacaoTributaria extends PacoteClassificacaoTributaria {
  /** O pacote veio do cache offline (IndexedDB). */
  offline: boolean;
  /** Quando o pacote offline foi gravado (epoch ms). */
  gravadoEm: number | null;
  /** Ultimo dia em que o pacote serve (ISO): o menor teto entre catalogo e norma. */
  vigenciaAte: string | null;
}

export interface DepsClassificacaoTributaria {
  listarOpcoes: () => Promise<CclasstribCatalogo[]>;
  buscarFundamentos: (codigos: string[]) => Promise<FundamentosLegais>;
  lerCache: () => Promise<EntradaCache<PacoteClassificacaoTributaria> | null>;
  salvarCache: (
    pacote: PacoteClassificacaoTributaria,
    opcoes: { fimVigencia: string | null }
  ) => Promise<void>;
}

/**
 * Le catalogo vigente + fundamentacao, caindo para o cache quando a leitura
 * nao volta.
 *
 * - Catalogo vazio nao significa "nao existe": as leituras sao best effort e
 *   devolvem lista vazia quando falham, entao o cache entra antes de declarar
 *   o catalogo indisponivel.
 * - Fundamentacao com `falhou` nao regrava o cache: um erro de rede nao pode
 *   apagar o texto legal guardado nem esvaziar a coluna na tela.
 * - O cache so e gravado em leitura bem sucedida, com o menor teto de vigencia
 *   entre catalogo e norma (etapa 85).
 */
export async function carregarClassificacaoTributaria(
  deps: DepsClassificacaoTributaria
): Promise<DadosClassificacaoTributaria> {
  const opcoes = await deps.listarOpcoes();

  if (opcoes.length === 0) {
    const cache = await deps.lerCache();
    if (cache) {
      return {
        ...cache.payload,
        offline: true,
        gravadoEm: cache.gravadoEm,
        vigenciaAte: cache.fimVigencia ?? null,
      };
    }
    return {
      opcoes,
      fundamentos: fundamentosVazios(hojeIso()),
      offline: false,
      gravadoEm: null,
      vigenciaAte: null,
    };
  }

  const fundamentos = await deps.buscarFundamentos(opcoes.map((o) => o.cclasstrib));
  const vigenciaAte = menorVigencia(horizonteVigencia(opcoes), fundamentos.fimVigencia);

  if (fundamentos.falhou) {
    const cache = await deps.lerCache();
    if (cache) {
      // Catalogo veio da rede, fundamentacao do cache: o pacote guardado e o
      // unico que ainda tem o texto legal. Marcado offline de proposito.
      return {
        opcoes,
        fundamentos: cache.payload.fundamentos,
        offline: true,
        gravadoEm: cache.gravadoEm,
        vigenciaAte: menorVigencia(vigenciaAte, cache.fimVigencia),
      };
    }
    return { opcoes, fundamentos, offline: false, gravadoEm: null, vigenciaAte };
  }

  await deps.salvarCache({ opcoes, fundamentos }, { fimVigencia: vigenciaAte });
  return { opcoes, fundamentos, offline: false, gravadoEm: null, vigenciaAte };
}

/**
 * Momento (epoch ms) em que o pacote exibido deixa de valer: TTL do cache ou
 * fim da vigencia, o que vier antes. `null` quando nada declara vencimento.
 *
 * A vigencia e data pura (`YYYY-MM-DD`), comparada em UTC como em
 * `entradaExpirada`: o pacote vale ate o ultimo instante daquele dia.
 */
export function proximoVencimentoMs(
  entrada: { gravadoEm?: number | null; vigenciaAte?: string | null },
  ttlMs: number = TTL_PADRAO_MS
): number | null {
  let alvo: number | null = null;
  if (typeof entrada.gravadoEm === 'number' && Number.isFinite(entrada.gravadoEm)) {
    alvo = entrada.gravadoEm + ttlMs;
  }
  const fim = (entrada.vigenciaAte ?? '').trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
    const limite = Date.parse(fim + 'T00:00:00.000Z') + 24 * 60 * 60 * 1000;
    if (Number.isFinite(limite)) alvo = alvo === null ? limite : Math.min(alvo, limite);
  }
  return alvo;
}
