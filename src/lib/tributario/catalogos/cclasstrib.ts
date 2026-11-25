// Leitura do cat?logo oficial de cClassTrib (LC 214/2025) e do cat?logo de NCM.
//
// As duas tabelas nascem vazias: o conte?do vem das cargas da RFB (etapas 79-81).
// Por isso toda leitura aqui ? *best effort*: cat?logo vazio significa "sem
// refer?ncia para comparar", nunca "registro inv?lido". Quem valida (etapa 46)
// s? emite diverg?ncia quando teve o dado em m?os ? sem dado, n?o h? o que
// afirmar sobre o NCM do contribuinte.
import { supabase } from '@/integrations/supabase/client';
import { hojeIso, normalizarReferencia } from './repositorio';

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
}

const VAZIO = (referencia: string): ReferenciasFiscais => ({
  cclasstrib: new Map(),
  ncm: new Map(),
  referencia,
  cclasstribCarregado: false,
  ncmCarregado: false,
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
    const { data, error } = await supabase
      .from('catalogo_cclasstrib')
      .select(
        'cclasstrib, cst, descricao, exige_gibscbs, p_red_cbs, p_red_ibs_uf, p_red_ibs_mun, versao_it, inicio_vigencia, fim_vigencia'
      )
      .in('cclasstrib', codigosTrib);

    if (!error) {
      // `carregado` significa "ha referencia para esta data", nao "o catalogo
      // tem linhas" nem "esta consulta achou o codigo". Um lote so com codigos
      // desconhecidos deixa a consulta filtrada vazia em cima de um catalogo
      // cheio, e o alerta de divergencia (REG-013) era suprimido justamente no
      // caso que precisa dele. A sonda mantem a supressao para catalogo
      // realmente vazio, para data sem cobertura e para erro de consulta.
      const vigentes = (data ?? []).filter((linha) =>
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
        });
      }
    }
  }

  if (codigosNcm.length > 0) {
    const { data, error } = await supabase
      .from('catalogo_ncm')
      .select('ncm, descricao, inicio_vigencia, fim_vigencia')
      .in('ncm', codigosNcm);

    if (!error) {
      // Mesma semantica do cClassTrib: o mapa de NCM tambem e recortado pelos
      // codigos do lote, entao consulta vazia nao prova catalogo vazio. E a
      // vigencia conta: o espelho da etapa 80 grava inicio_vigencia 2026-01-01,
      // logo uma nota de 2025 nao tem referencia de NCM e nao pode acusar
      // REG-012 por isso.
      const vigentes = (data ?? []).filter((linha) =>
        vigenteEm(linha.inicio_vigencia, linha.fim_vigencia, referencia)
      );
      resultado.ncmCarregado =
        vigentes.length > 0 || (await temCobertura('catalogo_ncm', referencia));
      for (const linha of vigentes) {
        resultado.ncm.set(linha.ncm, { ncm: linha.ncm, descricao: linha.descricao });
      }
    }
  }

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
    });
  }

  return [...vigentes.values()];
}
