import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Estratégia de correspondência devolvida pelo endpoint (exata ou fallback). */
export interface MatchInfo {
  estrategia: string;
  exato: boolean;
  detalhe?: string;
}

export interface ConsultaUFResult {
  recurso: 'uf';
  uf: string;
  match: MatchInfo;
  aliquota_interna: {
    categoria_produto: string | null;
    aliquota: number;
    aliquota_fcp: number | null;
    base_legal: string | null;
  } | null;
  categorias_disponiveis: string[];
  interestadual: { aliquota: number; aliquota_importado: number | null } | null;
  protocolos_st: unknown[];
  beneficios_fiscais: unknown[];
  iss_municipal: unknown[];
}

export interface NcmResumo {
  codigo: string;
  descricao: string | null;
  aliquota_ipi: number | null;
  cest: string | null;
  monofasico_pis_cofins: boolean | null;
  sujeito_st: boolean | null;
  mva_padrao: number | null;
}

export interface ConsultaNCMResult {
  recurso: 'ncm';
  modo: 'detalhe' | 'listagem';
  match?: MatchInfo;
  ncm?: NcmResumo | null;
  ncms?: NcmResumo[];
  alternativas?: NcmResumo[];
  monofasico?: boolean | null;
  cenario_st?: {
    aplicavel: boolean;
    estrategia: string;
    protocolos: unknown[];
    mva_sugerida: number | null;
  } | null;
  aliquota_interna_destino?: unknown;
  uf_referencia?: string | null;
}

export interface ConsultaCNAEResult {
  recurso: 'cnae';
  match: MatchInfo;
  cnae: {
    codigo: string;
    descricao: string | null;
    anexo_simples: string | null;
    sujeito_fator_r: boolean | null;
    vedado_simples: boolean | null;
    presuncao_irpj: number | null;
    presuncao_csll: number | null;
  } | null;
  alternativas: unknown[];
}

export type ConsultaParams =
  | { recurso: 'uf'; uf: string; uf_destino?: string; categoria?: string; municipio?: number }
  | { recurso: 'cnae'; codigo: string }
  | {
      recurso: 'ncm';
      codigo?: string;
      uf?: string;
      uf_destino?: string;
      monofasico?: boolean;
      st?: boolean;
      limite?: number;
    };

/**
 * Invoca a edge function de consulta tributária. Erros de rede/validação são
 * propagados para o React Query tratar (retry/estado de erro na UI).
 */
export async function consultarTributos<T>(params: ConsultaParams): Promise<T> {
  const { data, error } = await supabase.functions.invoke('consulta-tributaria', {
    body: params,
  });
  if (error) throw new Error(error.message);
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: unknown }).error));
  }
  return data as T;
}

/** Hook genérico de consulta com cache (catálogos mudam raramente). */
export function useConsultaTributaria<T>(params: ConsultaParams | null, enabled = true) {
  return useQuery<T>({
    queryKey: ['consulta-tributaria', params],
    queryFn: () => consultarTributos<T>(params as ConsultaParams),
    enabled: enabled && params !== null,
    staleTime: 1000 * 60 * 30,
  });
}

export const useConsultaUF = (uf?: string, extras?: { uf_destino?: string; categoria?: string; municipio?: number }) =>
  useConsultaTributaria<ConsultaUFResult>(uf ? { recurso: 'uf', uf, ...extras } : null);

export const useConsultaCNAE = (codigo?: string) =>
  useConsultaTributaria<ConsultaCNAEResult>(codigo && codigo.length >= 2 ? { recurso: 'cnae', codigo } : null);

export const useConsultaNCM = (
  codigo?: string,
  extras?: { uf?: string; uf_destino?: string; monofasico?: boolean; st?: boolean; limite?: number },
) => useConsultaTributaria<ConsultaNCMResult>({ recurso: 'ncm', codigo, ...extras });
