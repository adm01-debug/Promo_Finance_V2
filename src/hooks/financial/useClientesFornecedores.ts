import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/queryClient';
import { supabase } from '@/integrations/supabase/client';
import { fetchExternalData, isExternalDataNotConfigured } from './externalData';
import type { Cliente, ExternalCliente, Fornecedor } from './types';

interface FetchResult<T> {
  data: T[];
  total: number;
  total_pages: number;
  fallback?: boolean;
}

async function fetchClientesFromLocal(): Promise<FetchResult<ExternalCliente>> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('razao_social', { ascending: true })
    .limit(200);
  if (error) throw error;
  const rows = (data ?? []) as unknown as ExternalCliente[];
  return { data: rows, total: rows.length, total_pages: 1 };
}

async function fetchFornecedoresFromLocal(): Promise<FetchResult<ExternalCliente>> {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .order('razao_social', { ascending: true })
    .limit(200);
  if (error) throw error;
  const rows = (data ?? []) as unknown as ExternalCliente[];
  return { data: rows, total: rows.length, total_pages: 1 };
}

export function useClientes() {
  return useQuery({
    queryKey: ['clientes', 'external'],
    queryFn: async () => {
      const result = await fetchExternalData<ExternalCliente>({
        tabela: 'clientes',
        limit: 200,
      });
      if (isExternalDataNotConfigured(result)) {
        const fallback = await fetchClientesFromLocal();
        return fallback.data;
      }
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
      if (isExternalDataNotConfigured(result)) {
        const fallback = await fetchFornecedoresFromLocal();
        return fallback.data;
      }
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

      if (isExternalDataNotConfigured(result)) {
        const fallback = await fetchClientesFromLocal();
        let data = fallback.data;
        if (search) {
          const needle = search.toLowerCase();
          data = data.filter(
            (c) =>
              (c.razao_social ?? '').toLowerCase().includes(needle) ||
              ((c.nome_fantasia ?? '') as string).toLowerCase().includes(needle) ||
              ((c.cnpj_cpf ?? '') as string).includes(needle),
          );
        }
        return { data: data as unknown as Cliente[], totalCount: data.length, totalPages: 1 };
      }

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

      if (isExternalDataNotConfigured(result)) {
        const fallback = await fetchFornecedoresFromLocal();
        let data = fallback.data;
        if (search) {
          const needle = search.toLowerCase();
          data = data.filter(
            (c) =>
              (c.razao_social ?? '').toLowerCase().includes(needle) ||
              ((c.nome_fantasia ?? '') as string).toLowerCase().includes(needle) ||
              ((c.cnpj_cpf ?? '') as string).includes(needle),
          );
        }
        return { data: data as unknown as Fornecedor[], totalCount: data.length, totalPages: 1 };
      }

      return {
        data: (result.data || []) as Fornecedor[],
        totalCount: result.total || 0,
        totalPages: result.total_pages || 0,
      };
    },
    staleTime: STALE_TIMES.config,
  });
}
