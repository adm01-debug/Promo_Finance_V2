// CATÁLOGOS FISCAIS — Acesso somente leitura às tabelas do banco.

import { supabase } from '@/integrations/supabase/client';
import type { AnexoSimples } from '../types';
import type { RegistroIssMunicipalBanco } from '../ipi-iss/overlay-iss';
import type {
  AliquotaInterestadualCatalogo,
  FaixaSimplesCatalogo,
  UfCatalogo,
} from './types';

/** Data de referência ISO (yyyy-mm-dd) usada nos filtros de vigência. */
function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function aplicarVigencia<T extends { vigente_de: string; vigente_ate: string | null }>(
  registros: readonly T[],
  referencia: string,
): T[] {
  return registros.filter(
    (r) => r.vigente_de <= referencia && (r.vigente_ate === null || r.vigente_ate >= referencia),
  );
}

export async function buscarUfs(): Promise<UfCatalogo[]> {
  const { data, error } = await supabase
    .from('ufs')
    .select('sigla, nome, codigo_ibge, regiao, aliquota_interna_padrao, possui_fcp, aliquota_fcp, exige_antecipacao, difal_base_dupla')
    .order('sigla');

  if (error) throw error;
  return (data ?? []).map((uf) => ({
    ...uf,
    aliquota_interna_padrao: Number(uf.aliquota_interna_padrao),
    aliquota_fcp: Number(uf.aliquota_fcp),
  })) as UfCatalogo[];
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
}

/** Catálogo de NCMs versionado no banco (IPI, monofásico e ST). */
export async function buscarNcms(): Promise<NcmBanco[]> {
  const { data, error } = await supabase
    .from('ncms')
    .select('codigo, descricao, aliquota_ipi, monofasico_pis_cofins, sujeito_st, mva_padrao')
    .order('codigo');

  if (error) throw error;
  return (data ?? []).map((n) => ({
    codigo: n.codigo,
    descricao: n.descricao,
    aliquota_ipi: Number(n.aliquota_ipi),
    monofasico_pis_cofins: Boolean(n.monofasico_pis_cofins),
    sujeito_st: Boolean(n.sujeito_st),
    mva_padrao: n.mva_padrao === null ? null : Number(n.mva_padrao),
  }));
}

export async function buscarItensListaIss(): Promise<ItemListaIssCatalogo[]> {

  const { data, error } = await supabase
    .from('itens_lista_iss')
    .select('codigo, descricao, retem_no_tomador, aliquota_minima, aliquota_maxima')
    .order('codigo');

  if (error) throw error;
  return (data ?? []).map((i) => ({
    codigo: i.codigo,
    descricao: i.descricao,
    retem_no_tomador: Boolean(i.retem_no_tomador),
    aliquota_minima: Number(i.aliquota_minima),
    aliquota_maxima: Number(i.aliquota_maxima),
  }));
}

/**
 * Alíquotas municipais de ISS. O join com `itens_lista_iss` traz o código do
 * item (nulo = alíquota geral do município). A validação de faixa legal fica a
 * cargo do overlay — aqui só normalizamos o formato.
 */
export async function buscarAliquotasIssMunicipais(): Promise<RegistroIssMunicipalBanco[]> {
  const { data, error } = await supabase
    .from('aliquotas_iss_municipal')
    .select('codigo_ibge, municipio, uf, aliquota, vigente_de, vigente_ate, base_legal, itens_lista_iss(codigo)')
    .order('codigo_ibge');

  if (error) throw error;

  return (data ?? []).map((r) => {
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
}
