// CATÁLOGOS FISCAIS — Acesso somente leitura às tabelas do banco.

import { supabase } from '@/integrations/supabase/client';
import type { AnexoSimples } from '../types';
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
