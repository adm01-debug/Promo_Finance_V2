import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/lib/queryClient';
import { logger } from '@/lib/logger';
import type { StatusPagamento } from './types';
import type { ContasReceberPainelRow } from './views.types';
import { parseContasReceberRows } from './views.schemas';

/** Tamanho de cada página lida da view. */
const PAGINA_CONTAS_RECEBER = 1000;
/** Teto de segurança: além disso o agregado para de crescer e registra o corte. */
const TETO_CONTAS_RECEBER = 20_000;

export function useContasReceber(empresaId?: string) {
  return useQuery<ContasReceberPainelRow[]>({
    queryKey: ['contas-receber', empresaId],
    queryFn: async () => {
      // Mesmo defeito corrigido em useContasPagar: este hook é consumido como
      // agregado (KPIs do painel de receber, BI, dashboards, demonstrativos,
      // tesouraria, conciliação) e não como lista paginada — a tabela usa
      // useContasReceberPaginated. Com `.limit(1000)` fixo, acima de mil
      // títulos os totais encolhiam sem aviso. Agora lê em páginas até o fim,
      // ordenando também por id para que o corte entre páginas seja estável
      // quando houver vencimentos iguais.
      const linhas: unknown[] = [];
      let truncado = true;

      for (let inicio = 0; inicio < TETO_CONTAS_RECEBER; inicio += PAGINA_CONTAS_RECEBER) {
        let query = supabase
          .from('vw_contas_receber_painel')
          .select('*')
          .order('data_vencimento', { ascending: true })
          .order('id', { ascending: true })
          .range(inicio, inicio + PAGINA_CONTAS_RECEBER - 1);

        if (empresaId && empresaId !== 'all') {
          query = query.eq('empresa_id', empresaId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const pagina = (data ?? []) as unknown[];
        linhas.push(...pagina);
        if (pagina.length < PAGINA_CONTAS_RECEBER) {
          truncado = false;
          break;
        }
      }

      if (truncado) {
        logger.warn('useContasReceber: teto de linhas atingido, totais podem estar parciais', {
          empresaId,
          teto: TETO_CONTAS_RECEBER,
        });
      }

      return parseContasReceberRows(linhas);
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
      let countQuery = supabase.from('contas_receber').select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('contas_receber')
        .select(
          `
          *,
          centros_custo:centro_custo_id (nome, codigo),
          contas_bancarias:conta_bancaria_id (banco),
          clientes:cliente_id (razao_social, nome_fantasia, score)
        `
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
