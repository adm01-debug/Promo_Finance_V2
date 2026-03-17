import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, Database } from '@/integrations/supabase/types';

export type Empresa = Tables<'empresas'>;
export type CentroCusto = Tables<'centros_custo'>;
export type ContaBancaria = Tables<'contas_bancarias'>;
export type Cliente = Tables<'clientes'>;
export type Fornecedor = Tables<'fornecedores'>;
export type ContaPagar = Tables<'contas_pagar'>;
export type ContaReceber = Tables<'contas_receber'>;
export type StatusPagamento = Database['public']['Enums']['status_pagamento'];

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativo', true)
        .order('razao_social');
      if (error) throw error;
      return data as Empresa[];
    },
  });
}

export function useCentrosCusto() {
  return useQuery({
    queryKey: ['centros-custo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_custo')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data as CentroCusto[];
    },
  });
}

export function useContasBancarias() {
  return useQuery({
    queryKey: ['contas-bancarias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*, empresas(razao_social, nome_fantasia)')
        .eq('ativo', true)
        .order('banco');
      if (error) throw error;
      return data as ContaBancaria[];
    },
  });
}

export function useClientes() {
  return useQuery({
    queryKey: ['clientes', 'external'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/external-data?tabela=clientes&limit=200`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao buscar clientes externos');
      }

      const result = await response.json();
      return (result.data || []) as Cliente[];
    },
  });
}

export function useFornecedores() {
  return useQuery({
    queryKey: ['fornecedores', 'external'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/external-data?tabela=fornecedores&limit=200`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao buscar fornecedores externos');
      }

      const result = await response.json();
      return (result.data || []) as Fornecedor[];
    },
  });
}

export function useContasPagar() {
  return useQuery({
    queryKey: ['contas-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*, centros_custo(nome, codigo), contas_bancarias(banco), fornecedores(razao_social, nome_fantasia)')
        .order('data_vencimento', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export interface PaginatedContasPagarParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  centroCustoId?: string;
}

export function useContasPagarPaginated(params: PaginatedContasPagarParams) {
  const { page, pageSize, search, status, centroCustoId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['contas-pagar', 'paginated', page, pageSize, search, status, centroCustoId],
    queryFn: async () => {
      let countQuery = supabase
        .from('contas_pagar')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('contas_pagar')
        .select('*, centros_custo(nome, codigo), contas_bancarias(banco), fornecedores(razao_social, nome_fantasia)')
        .order('data_vencimento', { ascending: true })
        .range(from, to);

      // Apply filters to both queries
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

      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      return {
        data: dataResult.data || [],
        totalCount: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
    },
  });
}

export function useContasReceber() {
  return useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*, centros_custo(nome, codigo), contas_bancarias(banco), clientes(razao_social, nome_fantasia, score)')
        .order('data_vencimento', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export interface PaginatedContasReceberParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  centroCustoId?: string;
}

export function useContasReceberPaginated(params: PaginatedContasReceberParams) {
  const { page, pageSize, search, status, centroCustoId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['contas-receber', 'paginated', page, pageSize, search, status, centroCustoId],
    queryFn: async () => {
      let countQuery = supabase
        .from('contas_receber')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('contas_receber')
        .select('*, centros_custo(nome, codigo), contas_bancarias(banco), clientes(razao_social, nome_fantasia, score)')
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

      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      return {
        data: dataResult.data || [],
        totalCount: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
    },
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
  const { page, pageSize, search, status, estado, scoreRange } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['clientes', 'paginated', page, pageSize, search, status, estado, scoreRange],
    queryFn: async () => {
      let countQuery = supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('clientes')
        .select('*')
        .order('razao_social', { ascending: true })
        .range(from, to);

      // Apply filters
      if (search) {
        const searchFilter = `razao_social.ilike.%${search}%,nome_fantasia.ilike.%${search}%,cnpj_cpf.ilike.%${search}%,email.ilike.%${search}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }
      if (status === 'ativo') {
        countQuery = countQuery.eq('ativo', true);
        dataQuery = dataQuery.eq('ativo', true);
      } else if (status === 'inativo') {
        countQuery = countQuery.eq('ativo', false);
        dataQuery = dataQuery.eq('ativo', false);
      }
      if (estado && estado !== 'all') {
        countQuery = countQuery.eq('estado', estado);
        dataQuery = dataQuery.eq('estado', estado);
      }
      if (scoreRange) {
        switch (scoreRange) {
          case 'excelente':
            countQuery = countQuery.gte('score', 800);
            dataQuery = dataQuery.gte('score', 800);
            break;
          case 'bom':
            countQuery = countQuery.gte('score', 600).lt('score', 800);
            dataQuery = dataQuery.gte('score', 600).lt('score', 800);
            break;
          case 'regular':
            countQuery = countQuery.gte('score', 400).lt('score', 600);
            dataQuery = dataQuery.gte('score', 400).lt('score', 600);
            break;
          case 'critico':
            countQuery = countQuery.lt('score', 400);
            dataQuery = dataQuery.lt('score', 400);
            break;
        }
      }

      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      return {
        data: dataResult.data as Cliente[] || [],
        totalCount: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
    },
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
  const { page, pageSize, search, status, estado } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['fornecedores', 'paginated', page, pageSize, search, status, estado],
    queryFn: async () => {
      let countQuery = supabase
        .from('fornecedores')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('fornecedores')
        .select('*')
        .order('razao_social', { ascending: true })
        .range(from, to);

      // Apply filters
      if (search) {
        const searchFilter = `razao_social.ilike.%${search}%,nome_fantasia.ilike.%${search}%,cnpj_cpf.ilike.%${search}%,email.ilike.%${search}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }
      if (status === 'ativo') {
        countQuery = countQuery.eq('ativo', true);
        dataQuery = dataQuery.eq('ativo', true);
      } else if (status === 'inativo') {
        countQuery = countQuery.eq('ativo', false);
        dataQuery = dataQuery.eq('ativo', false);
      }
      if (estado && estado !== 'all') {
        countQuery = countQuery.eq('estado', estado);
        dataQuery = dataQuery.eq('estado', estado);
      }

      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      return {
        data: dataResult.data as Fornecedor[] || [],
        totalCount: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
    },
  });
}
