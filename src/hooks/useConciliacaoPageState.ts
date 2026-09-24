import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  INITIAL_FILTERS,
  type ConciliacaoFilterState,
} from '@/components/conciliacao/conciliacaoFiltersState';
import { carregarTransacoesBanco } from '@/lib/conciliacao-page-helpers';
import type { TransacaoExtrato } from './conciliacaoPage.types';

const FILTERS_STORAGE_KEY = 'conciliacao_filters';

function isFilterState(value: unknown): value is ConciliacaoFilterState {
  if (!value || typeof value !== 'object') return false;
  const filters = value as Record<string, unknown>;
  return (
    typeof filters.periodoInicio === 'string' &&
    typeof filters.periodoFim === 'string' &&
    typeof filters.valorMin === 'string' &&
    typeof filters.valorMax === 'string' &&
    ['todos', 'credito', 'debito'].includes(String(filters.tipo)) &&
    ['todos', 'alta', 'media', 'baixa'].includes(String(filters.confiancaIA)) &&
    typeof filters.centroCustoId === 'string'
  );
}

export function useFiltrosConciliacaoPersistidos() {
  const [filters, setFilters] = useState<ConciliacaoFilterState>(() => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return isFilterState(parsed) ? parsed : INITIAL_FILTERS;
    } catch {
      return INITIAL_FILTERS;
    }
  });

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  return [filters, setFilters] as const;
}

export function useContaBancariaSelecionada(currentBankAccountId: string | null | undefined) {
  const [selectedBanco, setSelectedBanco] = useState(currentBankAccountId || '');
  const bancoGlobalAnterior = useRef(currentBankAccountId);

  useEffect(() => {
    const bancoAnterior = bancoGlobalAnterior.current;
    bancoGlobalAnterior.current = currentBankAccountId;

    // `undefined` significa que o filtro global ainda não foi carregado. Já
    // `null` é uma remoção explícita e deve limpar a seleção local anterior.
    if (currentBankAccountId === undefined || bancoAnterior === currentBankAccountId) return;

    setSelectedBanco(currentBankAccountId ?? '');
  }, [currentBankAccountId]);

  return [selectedBanco, setSelectedBanco] as const;
}

type TransacoesUpdater = TransacaoExtrato[] | ((prev: TransacaoExtrato[]) => TransacaoExtrato[]);

/**
 * Busca as transações bancárias da conta selecionada via TanStack Query.
 *
 * Antes (E-016), isso era `useEffect` + `useState` local: `setTransacoes([])`
 * disparava antes do fetch terminar, então a tela piscava "Nenhuma transação
 * encontrada" a cada troca de conta — mesmo quando a conta tinha centenas de
 * transações — e uma falha na busca deixava a lista vazia sem sinalizar erro.
 * `useQuery` chaveado por `selectedBanco` resolve as duas coisas: expõe
 * `isLoading`/`isFetching`/`isError` para a tela distinguir carregando, vazio
 * real e erro, e cada conta bancária tem seu próprio cache — trocar de conta
 * não herda dados da conta anterior.
 */
export function useTransacoesBancariasSelecionadas(selectedBanco: string) {
  const queryClient = useQueryClient();
  const queryKey = ['conciliacao', 'transacoes-banco', selectedBanco] as const;

  const query = useQuery<TransacaoExtrato[]>({
    queryKey,
    queryFn: async () => {
      const rows = await carregarTransacoesBanco(selectedBanco);
      // `carregarTransacoesBanco` já notifica o erro (toast) e retorna `null`
      // em vez de lançar. Relançamos aqui para que `useQuery` marque
      // `isError` — sem isso a tela nunca distingue erro de lista vazia.
      if (rows === null) {
        throw new Error('Erro ao carregar transações bancárias');
      }
      return rows;
    },
    enabled: !!selectedBanco,
    // Opt-out do `placeholderData: previousData` global (queryClient.ts): aqui
    // trocar de conta deve mostrar o estado de carregamento, não a lista da
    // conta anterior enquanto a nova busca termina.
    placeholderData: undefined,
  });

  const setTransacoes = useCallback(
    (updater: TransacoesUpdater) => {
      queryClient.setQueryData<TransacaoExtrato[]>(queryKey, (prev) => {
        const base = prev ?? [];
        return typeof updater === 'function' ? updater(base) : updater;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey é derivada de selectedBanco, já listado
    [queryClient, selectedBanco]
  );

  return {
    transacoes: query.data ?? [],
    setTransacoes,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
