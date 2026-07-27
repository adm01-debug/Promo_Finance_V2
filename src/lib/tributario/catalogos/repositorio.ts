// CATÁLOGOS FISCAIS — Acesso somente leitura às tabelas do banco.

import { supabase } from '@/integrations/supabase/client';
import type { AnexoSimples } from '../types';
import type { RegistroIssMunicipalBanco } from '../ipi-iss/overlay-iss';
import type { NcmBanco } from './coerencia-ncm';

import type {
  AliquotaInterestadualCatalogo,
  FaixaSimplesCatalogo,
  UfCatalogo,
} from './types';

/** Data de referência ISO (yyyy-mm-dd) usada nos filtros de vigência. */
export function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Normaliza uma data de referência arbitrária para ISO `yyyy-mm-dd`.
 *
 * Defensivo por desenho: entradas inválidas (string vazia, `Invalid Date`,
 * formato inesperado) degradam para a data de hoje em vez de derrubar o
 * cálculo — um catálogo sem recorte válido é pior que o recorte corrente.
 */
export function normalizarReferencia(entrada?: string | Date | null): string {
  if (!entrada) return hojeIso();
  if (entrada instanceof Date) {
    return Number.isNaN(entrada.getTime()) ? hojeIso() : entrada.toISOString().slice(0, 10);
  }
  const texto = String(entrada).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? hojeIso() : data.toISOString().slice(0, 10);
}

function aplicarVigencia<T extends { vigente_de: string; vigente_ate: string | null }>(
  registros: readonly T[],
  referencia: string,
): T[] {
  return registros.filter(
    (r) => r.vigente_de <= referencia && (r.vigente_ate === null || r.vigente_ate >= referencia),
  );
}

export async function buscarUfs(referencia: string = hojeIso()): Promise<UfCatalogo[]> {
  const { data, error } = await supabase
    .from('ufs')
    .select('sigla, nome, codigo_ibge, regiao, aliquota_interna_padrao, possui_fcp, aliquota_fcp, exige_antecipacao, difal_base_dupla, vigente_de, vigente_ate')
    .order('sigla');

  if (error) throw error;
  const normalizadas = (data ?? []).map((uf) => ({
    ...uf,
    aliquota_interna_padrao: Number(uf.aliquota_interna_padrao),
    aliquota_fcp: Number(uf.aliquota_fcp),
  })) as UfCatalogo[];

  // Alíquotas internas mudam por lei estadual com data certa: o motor precisa
  // enxergar apenas a versão vigente na data da operação.
  return aplicarVigencia(normalizadas, referencia);
}

export async function buscarAliquotasInterestaduais(
  referencia: string = hojeIso(),
): Promise<AliquotaInterestadualCatalogo[]> {
  const { data, error } = await supabase
    .from('aliquotas_interestaduais')
    .select('uf_origem, uf_destino, aliquota, aliquota_importado, vigente_de, vigente_ate');

  if (error) throw error;

  const normalizadas = (data ?? []).map((a) => ({
    ...a,
    aliquota: Number(a.aliquota),
    aliquota_importado: Number(a.aliquota_importado),
  })) as AliquotaInterestadualCatalogo[];

  return aplicarVigencia(normalizadas, referencia);
}

export async function buscarFaixasSimples(
  referencia: string = hojeIso(),
): Promise<FaixaSimplesCatalogo[]> {
  const { data, error } = await supabase
    .from('faixas_simples_nacional')
    .select('anexo, faixa, rbt12_de, rbt12_ate, aliquota, parcela_deduzir, vigente_de, vigente_ate')
    .order('anexo')
    .order('faixa');

  if (error) throw error;

  const normalizadas = (data ?? []).map((f) => ({
    anexo: f.anexo as AnexoSimples,
    faixa: Number(f.faixa),
    rbt12_de: Number(f.rbt12_de),
    rbt12_ate: Number(f.rbt12_ate),
    aliquota: Number(f.aliquota),
    parcela_deduzir: Number(f.parcela_deduzir),
    vigente_de: f.vigente_de,
    vigente_ate: f.vigente_ate,
  }));

  return aplicarVigencia(normalizadas, referencia);
}

/** Item da lista anexa da LC 116/2003, conforme catálogo do banco. */
export interface ItemListaIssCatalogo {
  codigo: string;
  descricao: string;
  retem_no_tomador: boolean;
  aliquota_minima: number;
  aliquota_maxima: number;
  vigente_de: string;
  vigente_ate: string | null;
}

/** Catálogo de NCMs versionado no banco (IPI, monofásico e ST). */
export async function buscarNcms(referencia: string = hojeIso()): Promise<NcmBanco[]> {
  const { data, error } = await supabase
    .from('ncms')
    .select('codigo, descricao, aliquota_ipi, monofasico_pis_cofins, sujeito_st, mva_padrao, vigente_de, vigente_ate')
    .order('codigo');

  if (error) throw error;
  const normalizados = (data ?? []).map((n) => ({
    codigo: n.codigo,
    descricao: n.descricao,
    aliquota_ipi: Number(n.aliquota_ipi),
    monofasico_pis_cofins: Boolean(n.monofasico_pis_cofins),
    sujeito_st: Boolean(n.sujeito_st),
    mva_padrao: n.mva_padrao === null ? null : Number(n.mva_padrao),
    vigente_de: n.vigente_de,
    vigente_ate: n.vigente_ate,
  }));

  // Só chega ao motor o recorte vigente na data de referência.
  return aplicarVigencia(normalizados, referencia);
}

export async function buscarItensListaIss(
  referencia: string = hojeIso(),
): Promise<ItemListaIssCatalogo[]> {
  const { data, error } = await supabase
    .from('itens_lista_iss')
    .select('codigo, descricao, retem_no_tomador, aliquota_minima, aliquota_maxima, vigente_de, vigente_ate')
    .order('codigo');

  if (error) throw error;
  const normalizados = (data ?? []).map((i) => ({
    codigo: i.codigo,
    descricao: i.descricao,
    retem_no_tomador: Boolean(i.retem_no_tomador),
    aliquota_minima: Number(i.aliquota_minima),
    aliquota_maxima: Number(i.aliquota_maxima),
    vigente_de: i.vigente_de,
    vigente_ate: i.vigente_ate,
  }));

  // Itens revogados da lista da LC 116 não devem alimentar as guardas do motor.
  return aplicarVigencia(normalizados, referencia);
}

/**
 * Alíquotas municipais de ISS. O join com `itens_lista_iss` traz o código do
 * item (nulo = alíquota geral do município). A validação de faixa legal fica a
 * cargo do overlay — aqui só normalizamos o formato.
 */
export async function buscarAliquotasIssMunicipais(
  referencia: string = hojeIso(),
): Promise<RegistroIssMunicipalBanco[]> {
  const { data, error } = await supabase
    .from('aliquotas_iss_municipal')
    .select('codigo_ibge, municipio, uf, aliquota, vigente_de, vigente_ate, base_legal, itens_lista_iss(codigo)')
    .order('codigo_ibge');

  if (error) throw error;

  const normalizados = (data ?? []).map((r) => {
    const item = r.itens_lista_iss as { codigo: string } | null;
    return {
      codigo_ibge: r.codigo_ibge,
      municipio: r.municipio,
      uf: r.uf as string,
      item_codigo: item?.codigo ?? null,
      aliquota: Number(r.aliquota),
      vigente_de: r.vigente_de,
      vigente_ate: r.vigente_ate,
      base_legal: r.base_legal,
    } satisfies RegistroIssMunicipalBanco;
  });

  // O overlay revalida a vigência, mas filtrar aqui evita transportar
  // registros revogados até a camada de validação.
  return normalizados.filter(
    (r) =>
      (r.vigente_de === null || r.vigente_de === undefined || r.vigente_de <= referencia) &&
      (r.vigente_ate === null || r.vigente_ate === undefined || r.vigente_ate >= referencia),
  );
}

/** NCM vinculado a protocolo de ST, já recortado pela vigência. */
export interface ProtocoloStNcmCatalogo {
  protocolo_id: string;
  ncm_codigo: string;
  mva_original: number | null;
  cest: string | null;
  vigente_de: string;
  vigente_ate: string | null;
}

/**
 * NCMs sujeitos a protocolo de ST vigentes na data de referência.
 * Protocolos denunciados deixam de produzir MVA a partir da data de encerramento.
 */
export async function buscarProtocolosStNcms(
  referencia: string = hojeIso(),
): Promise<ProtocoloStNcmCatalogo[]> {
  const { data, error } = await supabase
    .from('protocolos_st_ncms')
    .select('protocolo_id, ncm_codigo, mva_original, cest, vigente_de, vigente_ate')
    .order('ncm_codigo');

  if (error) throw error;

  const normalizados = (data ?? []).map((p) => ({
    protocolo_id: p.protocolo_id,
    ncm_codigo: p.ncm_codigo,
    mva_original: p.mva_original === null ? null : Number(p.mva_original),
    cest: p.cest,
    vigente_de: p.vigente_de,
    vigente_ate: p.vigente_ate,
  }));

  return aplicarVigencia(normalizados, referencia);
}
