// Hook: listagem de NF-e recebidas via puxador SEFAZ (Fase 3).
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaScope } from '@/contexts/EmpresaScopeContext';

export type ManifestacaoStatus =
  | 'pendente'
  | 'ciencia'
  | 'confirmada'
  | 'desconhecida'
  | 'nao_realizada';

export interface NfeRecebida {
  id: string;
  empresa_id: string | null;
  chave_acesso: string;
  cnpj_emitente: string;
  razao_emitente: string | null;
  uf_emitente: string | null;
  numero: string | null;
  serie: string | null;
  modelo: string;
  data_emissao: string | null;
  valor_total: number | null;
  ambiente: 'producao' | 'homologacao';
  nsu: number;
  xml_path: string | null;
  xml_completo: boolean;
  manifestacao_status: ManifestacaoStatus;
  manifestacao_data: string | null;
  situacao_nfe: string | null;
  conta_pagar_id: string | null;
  created_at: string;
}

export interface NfeFiltros {
  status?: ManifestacaoStatus | 'todos';
  emitente?: string;
  dataInicio?: string;
  dataFim?: string;
  vinculadaContaPagar?: 'sim' | 'nao' | 'todos';
}

export function useNfeRecebidas(filtros: NfeFiltros = {}) {
  const { empresaId } = useEmpresaScope();

  return useQuery({
    queryKey: ['nfe-recebidas', empresaId, filtros],
    queryFn: async (): Promise<NfeRecebida[]> => {
      let q = supabase
        .from('nfe_recebidas')
        .select(
          'id,empresa_id,chave_acesso,cnpj_emitente,razao_emitente,uf_emitente,numero,serie,modelo,data_emissao,valor_total,ambiente,nsu,xml_path,xml_completo,manifestacao_status,manifestacao_data,situacao_nfe,conta_pagar_id,created_at'
        )
        .order('data_emissao', { ascending: false, nullsFirst: false })
        .limit(500);

      if (empresaId) q = q.eq('empresa_id', empresaId);
      if (filtros.status && filtros.status !== 'todos')
        q = q.eq('manifestacao_status', filtros.status);
      if (filtros.emitente)
        q = q.or(
          `cnpj_emitente.ilike.%${filtros.emitente}%,razao_emitente.ilike.%${filtros.emitente}%`
        );
      if (filtros.dataInicio) q = q.gte('data_emissao', filtros.dataInicio);
      if (filtros.dataFim) q = q.lte('data_emissao', filtros.dataFim);
      if (filtros.vinculadaContaPagar === 'sim') q = q.not('conta_pagar_id', 'is', null);
      if (filtros.vinculadaContaPagar === 'nao') q = q.is('conta_pagar_id', null);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as NfeRecebida[];
    },
    staleTime: 60_000,
  });
}

export async function getNfeXmlSignedUrl(xmlPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('nfe-xml')
    .createSignedUrl(xmlPath, 300);
  if (error) return null;
  return data?.signedUrl ?? null;
}
