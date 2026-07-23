// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/lib/queryClient';
import type { StatusPagamento } from './types';

export type ContaReceberPainelRow = Record<string, any>;

export function useContasReceber(empresaId?: string) {
  return useQuery({
    queryKey: ['contas-receber', empresaId],
    queryFn: async (): Promise<ContaReceberPainelRow[]> => {
      let query = supabase
        .from('vw_contas_receber_painel')
        .select('*')
        .order('data_vencimento', { ascending: true })
        .limit(1000);

      if (empresaId && empresaId !== 'all') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ContaReceberPainelRow[];
    },
    staleTime: STALE_TIMES.financial,
  });
}



export interface PaginatedContasReceberParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  centroCustoId?: string;
  empresaId?: string;
  contaBancariaId?: string;
}

export function useContasReceberPaginated(params: PaginatedContasReceberParams) {
  const { page, pageSize, search, status, centroCustoId, empresaId, contaBancariaId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: [
      'contas-receber',
      'paginated',
      page,
      pageSize,
      search,
      status,
      centroCustoId,
      empresaId,
      contaBancariaId,
    ],
    queryFn: async () => {
      let countQuery = supabase
        .from('contas_receber')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('contas_receber')
        .select(
          `
          *,
          centros_custo:centro_custo_id (nome, codigo),
          contas_bancarias:conta_bancaria_id (banco),
          clientes:cliente_id (razao_social, nome_fantasia, score)
        `,
        )
        .order('data_vencimento', { ascending: true })
        .range(from, to);

      if (search) {
        const searchFilter = `cliente_nome.ilike.%${search}%,descricao.ilike.%${search}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }
      if (status && status !== 'all') {
        const validStatus = status as StatusPagamento;
        countQuery = countQuery.eq('status', validStatus);
        dataQuery = dataQuery.eq('status', validStatus);
      }
      if (centroCustoId && centroCustoId !== 'all') {
        countQuery = countQuery.eq('centro_custo_id', centroCustoId);
        dataQuery = dataQuery.eq('centro_custo_id', centroCustoId);
      }
      if (empresaId && empresaId !== 'all') {
        countQuery = countQuery.eq('empresa_id', empresaId);
        dataQuery = dataQuery.eq('empresa_id', empresaId);
      }
      if (contaBancariaId && contaBancariaId !== 'all') {
        countQuery = countQuery.eq('conta_bancaria_id', contaBancariaId);
        dataQuery = dataQuery.eq('conta_bancaria_id', contaBancariaId);
      }

      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      return {
        data: dataResult.data ?? [],
        totalCount: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
    },
    staleTime: STALE_TIMES.financial,
  });
}
