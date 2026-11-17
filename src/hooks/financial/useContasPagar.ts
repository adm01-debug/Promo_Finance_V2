import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import type { Database } from '@/integrations/supabase/types';
import { STALE_TIMES } from '@/lib/queryClient';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { sounds } from '@/lib/sound-feedback';
import { ConflitoVersaoError, updateComLockOtimista } from '@/lib/optimistic-lock';
import { sel, type StatusPagamento } from './types';
import type { ContasPagarPainelRow } from './views.types';
import { parseContasPagarRows } from './views.schemas';

/** Tamanho de cada página lida da view. */
const PAGINA_CONTAS_PAGAR = 1000;
/** Teto de segurança: além disso o agregado para de crescer e registra o corte. */
const TETO_CONTAS_PAGAR = 20_000;

export function useContasPagar(empresaId?: string) {
  return useQuery<ContasPagarPainelRow[]>({
    queryKey: ['contas-pagar', empresaId],
    queryFn: async () => {
      // Este hook é consumido como agregado (KPIs do painel, tesouraria,
      // fluxo de caixa contábil), não como lista paginada — a tabela usa
      // useContasPagarPaginated. Com `.limit(1000)` fixo, uma empresa com mais
      // de mil contas via o "total a pagar" encolher sem nenhum aviso. Agora lê
      // em páginas até o fim, ordenando também por id para que o corte entre
      // páginas seja estável quando houver vencimentos iguais.
      const linhas: unknown[] = [];
      let truncado = true;

      for (let inicio = 0; inicio < TETO_CONTAS_PAGAR; inicio += PAGINA_CONTAS_PAGAR) {
        let query = supabaseDyn
          .from('vw_contas_pagar_painel')
          .select(sel('*'))
          .order('data_vencimento', { ascending: true })
          .order('id', { ascending: true })
          .range(inicio, inicio + PAGINA_CONTAS_PAGAR - 1);

        if (empresaId && empresaId !== 'all') {
          query = query.eq('empresa_id', empresaId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const pagina = (data ?? []) as unknown[];
        linhas.push(...pagina);
        if (pagina.length < PAGINA_CONTAS_PAGAR) {
          truncado = false;
          break;
        }
      }

      if (truncado) {
        logger.warn('useContasPagar: teto de linhas atingido, KPIs podem estar parciais', {
          empresaId,
          teto: TETO_CONTAS_PAGAR,
        });
      }

      return parseContasPagarRows(linhas);
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
      let countQuery = supabase.from('contas_pagar').select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('vw_contas_pagar_painel')
        .select('*')
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
    mutationFn: async (data: Partial<Database['public']['Tables']['contas_pagar']['Insert']>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // user_id é a coluna real em produção (created_by nunca existiu — CP-01);
      // cast de fronteira porque o schema tipado está defasado.
      const { error } = await supabase.from('contas_pagar').insert([
        {
          ...data,
          user_id: session.user.id,
          status: data.status || 'pendente',
        } as unknown as Database['public']['Tables']['contas_pagar']['Insert'],
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      sounds.success();
    },
    onError: (error: Error) => {
      logger.error('Error creating conta pagar:', error);
      toast.error('Erro ao salvar conta a pagar');
      sounds.error();
    },
  });
}

export function useUpdateContaPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      expected_updated_at,
      ...data
    }: { id: string; expected_updated_at: string | null } & Partial<
      Database['public']['Tables']['contas_pagar']['Update']
    >) => {
      return await updateComLockOtimista('contas_pagar', id, expected_updated_at, data);
    },
    onSuccess: async () => {
      // Aguarda o refetch antes de liberar o UI: reabrir a conta com a lista
      // ainda desatualizada mandaria a versão antiga e geraria falso conflito.
      await queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      sounds.success();
    },
    onError: (error: Error) => {
      logger.error('Error updating conta pagar:', error);
      if (error instanceof ConflitoVersaoError) {
        toast.error('Esta conta foi alterada por outra pessoa. Revise e salve novamente.');
        queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      } else {
        toast.error(error.message || 'Erro ao salvar conta a pagar');
      }
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
