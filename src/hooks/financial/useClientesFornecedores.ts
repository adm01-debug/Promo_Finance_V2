// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/queryClient';
import { fetchExternalData } from './externalData';
import type { Cliente, ExternalCliente, Fornecedor } from './types';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes', 'external'],
    queryFn: async () => {
      const result = await fetchExternalData<ExternalCliente>({
        tabela: 'clientes',
        limit: 200,
      });
      return (result.data || []) as ExternalCliente[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFornecedores() {
  return useQuery({
    queryKey: ['fornecedores', 'external'],
    queryFn: async () => {
      const result = await fetchExternalData<ExternalCliente>({
        tabela: 'fornecedores',
        limit: 200,
      });
      return (result.data || []) as ExternalCliente[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
}

export interface PaginatedClientesParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  estado?: string;
  scoreRange?: string;
}

export function useClientesPaginated(params: PaginatedClientesParams) {
  const { page, pageSize, search } = params;

  return useQuery({
    queryKey: ['clientes', 'paginated', 'external', page, pageSize, search],
    queryFn: async () => {
      const result = await fetchExternalData<Cliente>({
        tabela: 'clientes',
        page,
        limit: pageSize,
        search,
      });

      return {
        data: (result.data || []) as Cliente[],
        totalCount: result.total || 0,
        totalPages: result.total_pages || 0,
      };
    },
    staleTime: STALE_TIMES.config,
  });
}

export interface PaginatedFornecedoresParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  estado?: string;
}

export function useFornecedoresPaginated(params: PaginatedFornecedoresParams) {
  const { page, pageSize, search } = params;

  return useQuery({
    queryKey: ['fornecedores', 'paginated', 'external', page, pageSize, search],
    queryFn: async () => {
      const result = await fetchExternalData<Fornecedor>({
        tabela: 'fornecedores',
        page,
        limit: pageSize,
        search,
      });

      return {
        data: (result.data || []) as Fornecedor[],
        totalCount: result.total || 0,
        totalPages: result.total_pages || 0,
      };
    },
    staleTime: STALE_TIMES.config,
  });
}
