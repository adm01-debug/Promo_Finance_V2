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
      // `carregado` significa "o catalogo tem dados", nao "esta consulta achou o
      // codigo". Um lote so com codigos desconhecidos deixa a consulta filtrada
      // vazia em cima de um catalogo cheio, e o alerta de divergencia (REG-013)
      // era suprimido justamente no caso que precisa dele. A sonda mantem a
      // supressao para catalogo realmente vazio e para erro de consulta.
      resultado.cclasstribCarregado = (data ?? []).length > 0;
      if (!resultado.cclasstribCarregado) {
        const sonda = await supabase.from('catalogo_cclasstrib').select('cclasstrib').limit(1);
        resultado.cclasstribCarregado = !sonda.error && (sonda.data ?? []).length > 0;
      }
      for (const linha of data ?? []) {
        if (!vigenteEm(linha.inicio_vigencia, linha.fim_vigencia, referencia)) continue;
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
      // codigos do lote, entao consulta vazia nao prova catalogo vazio.
      resultado.ncmCarregado = (data ?? []).length > 0;
      if (!resultado.ncmCarregado) {
        const sonda = await supabase.from('catalogo_ncm').select('ncm').limit(1);
        resultado.ncmCarregado = !sonda.error && (sonda.data ?? []).length > 0;
      }
      for (const linha of data ?? []) {
        if (!vigenteEm(linha.inicio_vigencia, linha.fim_vigencia, referencia)) continue;
        resultado.ncm.set(linha.ncm, { ncm: linha.ncm, descricao: linha.descricao });
      }
    }
  }

  return resultado;
}
