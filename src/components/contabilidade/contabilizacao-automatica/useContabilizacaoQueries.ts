import { useQuery } from '@tanstack/react-query';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { queryConfig } from '@/lib/queryClient';
import type { Categoria, EventoLog, PlanoConta, Regra } from './types';

/**
 * Encapsula todas as queries da aba de Contabilização Automática.
 * QueryKeys estáveis + staleTime alinhado ao DOMAIN_QUERY_CONFIG.
 */
export function useContabilizacaoQueries(empresaId: string) {
  const regrasQuery = useQuery<Regra[]>({
    queryKey: ['regras_contab', empresaId],
    queryFn: async () => {
      const { data, error } = await supabaseDyn
        .from<Regra>('regras_contabilizacao_automatica')
        .select('*')
        .eq('empresa_id', empresaId);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!empresaId,
    ...queryConfig('planoContas'),
  });

  const contasQuery = useQuery<PlanoConta[]>({
    queryKey: ['plano_contas_analiticas'],
    queryFn: async () => {
      const { data, error } = await supabaseDyn
        .from<PlanoConta>('plano_contas')
        .select('id, codigo, nome, descricao, natureza, tipo')
        .eq('tipo', 'analitica')
        .order('codigo');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    ...queryConfig('planoContas'),
  });

  const categoriasQuery = useQuery<Categoria[]>({
    queryKey: ['categorias', empresaId],
    queryFn: async () => {
      const { data, error } = await supabaseDyn
        .from<Categoria>('categorias')
        .select('id, nome')
        .eq('empresa_id', empresaId)
        .order('nome');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!empresaId,
    ...queryConfig('categorias'),
  });

  const logsQuery = useQuery<EventoLog[]>({
    queryKey: ['eventos_contab_log', empresaId],
    queryFn: async () => {
      const { data, error } = await supabaseDyn
        .from<EventoLog>('eventos_contabilizacao_log')
        .select('id, tipo_evento, evento_id, status, detalhe, created_at, lancamento_id')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!empresaId,
    refetchInterval: 30_000,
    ...queryConfig('alertas'),
  });

  return { regrasQuery, contasQuery, categoriasQuery, logsQuery };
}
