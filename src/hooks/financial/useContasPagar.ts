// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { STALE_TIMES } from '@/lib/queryClient';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { sounds } from '@/lib/sound-feedback';
import { sel, type StatusPagamento } from './types';
import type { ContasPagarPainelRow } from './views.types';
import { parseContasPagarRows } from './views.schemas';

export function useContasPagar(empresaId?: string) {
  return useQuery<ContasPagarPainelRow[]>({
    queryKey: ['contas-pagar', empresaId],
    queryFn: async () => {
      let query = supabaseDyn
        .from('vw_contas_pagar_painel')
        .select(sel('*'))
        .order('data_vencimento', { ascending: true })
        .limit(1000);

      if (empresaId && empresaId !== 'all') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return parseContasPagarRows((data ?? []) as unknown[]);
    },
    staleTime: STALE_TIMES.financial,
  });
}


export interface PaginatedContasPagarParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  centroCustoId?: string;
  empresaId?: string;
  contaBancariaId?: string;
}

export function useContasPagarPaginated(params: PaginatedContasPagarParams) {
  const { page, pageSize, search, status, centroCustoId, empresaId, contaBancariaId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: [
      'contas-pagar',
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
        .from('contas_pagar')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('contas_pagar')
        .select(
          `
          *,
          centros_custo:centro_custo_id (nome, codigo),
          contas_bancarias:conta_bancaria_id (banco),
          fornecedores:fornecedor_id (razao_social, nome_fantasia)
        `,
        )
        .order('data_vencimento', { ascending: true })
        .range(from, to);

      if (search) {
        const searchFilter = `fornecedor_nome.ilike.%${search}%,descricao.ilike.%${search}%`;
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

export function useCreateContaPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { error } = await supabase.from('contas_pagar').insert([
        {
          ...data,
          created_by: session.user.id,
          status: data.status || 'pendente',
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      sounds.success();
    },
    onError: (error: Error) => {
      logger.error('Error creating conta pagar:', error);
      sounds.error();
    },
  });
}

export function useUpdateContaPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('contas_pagar').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      sounds.success();
    },
    onError: (error: Error) => {
      logger.error('Error updating conta pagar:', error);
      sounds.error();
    },
  });
}

export function useDeleteContaPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast.success('Conta excluída com sucesso');
      sounds.success();
    },
    onError: (error: Error) => {
      logger.error('Error deleting conta pagar:', error);
      toast.error('Erro ao excluir conta');
      sounds.error();
    },
  });
}
