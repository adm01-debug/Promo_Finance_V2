// Leitura do cat?logo oficial de cClassTrib (LC 214/2025) e do cat?logo de NCM.
//
// As duas tabelas nascem vazias: o conte?do vem das cargas da RFB (etapas 79-81).
// Por isso toda leitura aqui ? *best effort*: cat?logo vazio significa "sem
// refer?ncia para comparar", nunca "registro inv?lido". Quem valida (etapa 46)
// s? emite diverg?ncia quando teve o dado em m?os ? sem dado, n?o h? o que
// afirmar sobre o NCM do contribuinte.
import { supabase } from '@/integrations/supabase/client';
import { hojeIso, normalizarReferencia } from './repositorio';
import {
  buscarFundamentosLegais,
  fundamentosVazios,
  type FundamentosLegais,
} from './fundamentacao-legal';

/** Linha vigente de `catalogo_cclasstrib`. */
export interface CclasstribCatalogo {
  cclasstrib: string;
  cst: string;
  descricao: string;
  exigeGibscbs: boolean;
  pRedCbs: number;
  pRedIbsUf: number;
  pRedIbsMun: number;
  versaoIt: string;
  /** Início da vigência (ISO) — usado como piso do cache offline (etapa 85). */
  inicioVigencia?: string | null;
  /**
   * Fim da vigência (ISO) ou `null` quando a RFB não declarou encerramento.
   * É o teto do cache offline: passado esse dia a lista deixa de valer.
   */
  fimVigencia?: string | null;
}

/** Linha vigente de `catalogo_ncm`. */
export interface NcmCatalogo {
  ncm: string;
  descricao: string;
}

export interface ReferenciasFiscais {
  /** cClassTrib (6 d?gitos) para a linha vigente. */
  cclasstrib: Map<string, CclasstribCatalogo>;
  /** NCM (8 d?gitos) para a linha vigente. */
  ncm: Map<string, NcmCatalogo>;
  /** Data usada no recorte de vig?ncia. */
  referencia: string;
  /**
   * A tabela tem conte?do? Distingue "cat?logo vazio" (carga da RFB n?o rodou)
   * de "nenhum c?digo do lote existe no cat?logo" ? s? o segundo ? diverg?ncia.
   * Sem essa flag, um mapa vazio dos dois jeitos suprimiria o alerta.
   */
  cclasstribCarregado: boolean;
  ncmCarregado: boolean;
  /**
   * Etapa 82: fundamentacao legal vigente dos cClassTrib do lote. Mesma leitura
   * *best effort* dos catalogos acima - sem linha, o alerta sai sem a norma.
   */
  fundamentos: FundamentosLegais;
}

const VAZIO = (referencia: string): ReferenciasFiscais => ({
  cclasstrib: new Map(),
  ncm: new Map(),
  referencia,
  cclasstribCarregado: false,
  ncmCarregado: false,
  fundamentos: fundamentosVazios(referencia),
});

/** Mant?m s? a linha que estava vigente na data de refer?ncia. */
const vigenteEm = (inicio: string | null, fim: string | null, referencia: string): boolean => {
  if (!inicio || inicio > referencia) return false;
  if (fim && fim < referencia) return false;
  return true;
};

/**
 * O catalogo cobre a data de referencia?
 *
 * `carregado` responde "posso afirmar algo sobre este codigo nesta data?", nao
 * "a tabela tem linhas". As cargas da RFB (etapas 79-81) marcam
 * `inicio_vigencia = 2026-01-01`: para uma nota de 2025 a consulta por codigo
 * volta com linha (a tabela esta cheia), mas nenhuma linha vigente na data, e
 * comparar com o mapa vazio acusava REG-011/REG-013 em nota correta. Sem
 * cobertura para a data, a resposta certa e "nao ha referencia", o mesmo
 * silencio de catalogo vazio.
 */
const temCobertura = async (
  tabela: 'catalogo_cclasstrib' | 'catalogo_ncm',
  referencia: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from(tabela)
    .select(tabela === 'catalogo_cclasstrib' ? 'cclasstrib' : 'ncm')
    .lte('inicio_vigencia', referencia)
    .or(`fim_vigencia.is.null,fim_vigencia.gte.${referencia}`)
    .limit(1);
  return !error && (data ?? []).length > 0;
};

/**
 * Teto de codigos por consulta `.in()`.
 *
 * O PostgREST corta a resposta em `db-max-rows` (1000 linhas no padrao do
 * Supabase) sem avisar: um lote com mais codigos que isso receberia so parte do
 * catalogo e o validador trataria os codigos omitidos como ausentes. 300 deixa
 * margem para o caso de um codigo ter mais de uma vigencia (o historico da
 * etapa 80 preserva periodos encerrados), entao cada resposta fica muito abaixo
 * do corte.
 */
const LOTE_CODIGOS = 300;

const consultarCclasstrib = (codigos: string[]) =>
  supabase
    .from('catalogo_cclasstrib')
    .select(
      'cclasstrib, cst, descricao, exige_gibscbs, p_red_cbs, p_red_ibs_uf, p_red_ibs_mun, versao_it, inicio_vigencia, fim_vigencia'
    )
    .in('cclasstrib', codigos);

const consultarNcm = (codigos: string[]) =>
  supabase
    .from('catalogo_ncm')
    .select('ncm, descricao, inicio_vigencia, fim_vigencia')
    .in('ncm', codigos);

type LinhaCclasstrib = NonNullable<Awaited<ReturnType<typeof consultarCclasstrib>>['data']>[number];
type LinhaNcm = NonNullable<Awaited<ReturnType<typeof consultarNcm>>['data']>[number];

/** Le em lotes; `null` significa erro de leitura (mesmo silencio de antes). */
async function lerCclasstrib(codigos: string[]): Promise<LinhaCclasstrib[] | null> {
  const linhas: LinhaCclasstrib[] = [];
  for (let i = 0; i < codigos.length; i += LOTE_CODIGOS) {
    const { data, error } = await consultarCclasstrib(codigos.slice(i, i + LOTE_CODIGOS));
    if (error) return null;
    linhas.push(...(data ?? []));
  }
  return linhas;
}

async function lerNcm(codigos: string[]): Promise<LinhaNcm[] | null> {
  const linhas: LinhaNcm[] = [];
  for (let i = 0; i < codigos.length; i += LOTE_CODIGOS) {
    const { data, error } = await consultarNcm(codigos.slice(i, i + LOTE_CODIGOS));
    if (error) return null;
    linhas.push(...(data ?? []));
  }
  return linhas;
}

/**
 * Carrega as refer?ncias vigentes apenas para os c?digos que a importa??o
 * realmente tocou. Um XML de 200 itens costuma trazer menos de 10 cClassTrib
 * distintos; carregar o cat?logo inteiro (~10 mil NCMs) s? para conferir
 * alguns seria tr?fego e mem?ria desperdi?ados.
 *
 * C?digos vazios s?o descartados antes da consulta: `.in()` com string vazia
 * casaria com linha vazia, n?o com aus?ncia.
 */
export async function buscarReferenciasFiscais(
  cclasstribs: string[],
  ncms: string[],
  dataReferencia?: string | Date | null
): Promise<ReferenciasFiscais> {
  const referencia = normalizarReferencia(dataReferencia ?? hojeIso());
  const codigosTrib = [...new Set(cclasstribs.map((c) => c.trim()).filter(Boolean))];
  const codigosNcm = [...new Set(ncms.map((n) => n.replace(/\D/g, '')).filter(Boolean))];

  const resultado = VAZIO(referencia);

  if (codigosTrib.length > 0) {
    const lidas = await lerCclasstrib(codigosTrib);

    if (lidas) {
      // `carregado` significa "ha referencia para esta data", nao "o catalogo
      // tem linhas" nem "esta consulta achou o codigo". Um lote so com codigos
      // desconhecidos deixa a consulta filtrada vazia em cima de um catalogo
      // cheio, e o alerta de divergencia (REG-013) era suprimido justamente no
      // caso que precisa dele. A sonda mantem a supressao para catalogo
      // realmente vazio, para data sem cobertura e para erro de consulta.
      const vigentes = lidas.filter((linha) =>
        vigenteEm(linha.inicio_vigencia, linha.fim_vigencia, referencia)
      );
      resultado.cclasstribCarregado =
        vigentes.length > 0 || (await temCobertura('catalogo_cclasstrib', referencia));
      for (const linha of vigentes) {
        resultado.cclasstrib.set(linha.cclasstrib, {
          cclasstrib: linha.cclasstrib,
          cst: linha.cst,
          descricao: linha.descricao,
          exigeGibscbs: Boolean(linha.exige_gibscbs),
          pRedCbs: Number(linha.p_red_cbs),
          pRedIbsUf: Number(linha.p_red_ibs_uf),
          pRedIbsMun: Number(linha.p_red_ibs_mun),
          versaoIt: linha.versao_it,
          inicioVigencia: linha.inicio_vigencia,
          fimVigencia: linha.fim_vigencia,
        });
      }
    }
  }

  if (codigosNcm.length > 0) {
    const lidas = await lerNcm(codigosNcm);

    if (lidas) {
      // Mesma semantica do cClassTrib: o mapa de NCM tambem e recortado pelos
      // codigos do lote, entao consulta vazia nao prova catalogo vazio. E a
      // vigencia conta: o espelho da etapa 80 grava inicio_vigencia 2026-01-01,
      // logo uma nota de 2025 nao tem referencia de NCM e nao pode acusar
      // REG-012 por isso.
      const vigentes = lidas.filter((linha) =>
        vigenteEm(linha.inicio_vigencia, linha.fim_vigencia, referencia)
      );
      resultado.ncmCarregado =
        vigentes.length > 0 || (await temCobertura('catalogo_ncm', referencia));
      for (const linha of vigentes) {
        resultado.ncm.set(linha.ncm, { ncm: linha.ncm, descricao: linha.descricao });
      }
    }
  }

  // Etapa 82: o texto legal dos mesmos cClassTrib. Consulta separada porque a
  // fundamentacao so interessa a quem teve divergencia; best effort como as
  // demais - sem catalogo, o alerta continua saindo, apenas sem a norma.
  resultado.fundamentos = await buscarFundamentosLegais(codigosTrib, referencia);

  return resultado;
}

/**
 * Lista as linhas vigentes do catalogo, para montar as opcoes de escolha em tela
 * (etapa 53). Diferente de `buscarReferenciasFiscais`, aqui nao ha lote de
 * codigos conhecidos: a tela precisa do catalogo inteiro para oferecer o leque.
 *
 * Best effort igual ao resto do modulo: erro de leitura devolve lista vazia, e
 * um codigo com duas linhas vigentes fica com a ultima — mesmo criterio do
 * `Map` da busca por codigo, que e o que o consumidor enxerga.
 */
export async function listarCclasstribVigentes(
  dataReferencia?: string | Date | null
): Promise<CclasstribCatalogo[]> {
  const referencia = normalizarReferencia(dataReferencia ?? hojeIso());
  const { data, error } = await supabase
    .from('catalogo_cclasstrib')
    .select(
      'cclasstrib, cst, descricao, exige_gibscbs, p_red_cbs, p_red_ibs_uf, p_red_ibs_mun, versao_it, inicio_vigencia, fim_vigencia'
    )
    .order('cclasstrib');

  if (error) return [];

  const vigentes = new Map<string, CclasstribCatalogo>();
  for (const linha of data ?? []) {
    if (!vigenteEm(linha.inicio_vigencia, linha.fim_vigencia, referencia)) continue;
    vigentes.set(linha.cclasstrib, {
      cclasstrib: linha.cclasstrib,
      cst: linha.cst,
      descricao: linha.descricao,
      exigeGibscbs: Boolean(linha.exige_gibscbs),
      pRedCbs: Number(linha.p_red_cbs),
      pRedIbsUf: Number(linha.p_red_ibs_uf),
      pRedIbsMun: Number(linha.p_red_ibs_mun),
      versaoIt: linha.versao_it,
      inicioVigencia: linha.inicio_vigencia,
      fimVigencia: linha.fim_vigencia,
    });
  }

  return [...vigentes.values()];
}

/**
 * Menor `fim_vigencia` do catálogo: o dia em que a lista deixa de valer.
 *
 * Serve de teto para o cache offline (etapa 85): assim que a primeira vigência
 * encerra, a lista guardada muda, então guardar além disso seria servir dado
 * vencido como se fosse atual. `null` quando nenhuma linha declara fim — aí vale
 * só o TTL.
 */
export function horizonteVigencia(opcoes: readonly CclasstribCatalogo[]): string | null {
  return menorVigencia(...opcoes.map((opcao) => opcao.fimVigencia));
}

/**
 * Menor data `YYYY-MM-DD` valida entre as informadas (`null` se nenhuma declara
 * fim). O pacote de catalogo guardado offline vence no primeiro dos seus tetos:
 * o do cClassTrib e o da fundamentacao legal, que tem vigencia propria.
 */
export function menorVigencia(...datas: (string | null | undefined)[]): string | null {
  let menor: string | null = null;
  for (const bruta of datas) {
    const fim = (bruta ?? '').trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fim)) continue;
    if (menor === null || fim < menor) menor = fim;
  }
  return menor;
}
