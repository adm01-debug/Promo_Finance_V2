import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/lib/queryClient';
import type { Tables, Database } from '@/integrations/supabase/types';

export type Empresa = Tables<'empresas'>;
export type CentroCusto = Tables<'centros_custo'>;
export type ContaBancaria = Tables<'contas_bancarias'>;
export type Cliente = Tables<'clientes'>;
export type Fornecedor = Tables<'fornecedores'>;
export type ContaPagar = Tables<'contas_pagar'>;
export type ContaReceber = Tables<'contas_receber'>;
export type StatusPagamento = Database['public']['Enums']['status_pagamento'];

// Type for external data coming from the edge function proxy
export interface ExternalCliente {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  contato: string | null;
  ativo: boolean;
  ramo_atividade?: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  score?: number | null;
  limite_credito?: number | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  bairro?: string | null;
  website?: string;
  logo_url?: string;
  grupo_economico?: string;
  inscricao_estadual?: string;
  status_externo?: string;
  is_customer?: boolean;
  is_supplier?: boolean;
  vendedor_nome?: string;
  cliente_ativado?: boolean;
  ja_comprou?: boolean;
  total_pedidos?: number;
  valor_total_compras?: number;
  ticket_medio?: number;
  grupo_clientes?: string;
  categoria?: string;
  tipo_fornecedor?: string;
  prazo_entrega_medio?: number;
  pedido_minimo?: number;
  forma_pagamento?: string;
  prazo_pagamento?: string;
  [key: string]: unknown;
}

interface ExternalListResponse<T> {
  data?: T[];
  total?: number;
  total_pages?: number;
  error?: string;
  message?: string;
  fallback?: boolean;
  missing_secrets?: string[];
}

const EXTERNAL_DATA_NOT_CONFIGURED_MESSAGES = new Set([
  'External DB not configured',
  'EXTERNAL_DB_NOT_CONFIGURED',
]);

function isExternalDataNotConfigured(payload: ExternalListResponse<unknown> | null | undefined) {
  if (!payload) return false;
  return EXTERNAL_DATA_NOT_CONFIGURED_MESSAGES.has(payload.error ?? '')
    || Boolean(payload.fallback)
    || (payload.message?.toLowerCase().includes('não configurada') ?? false)
    || (payload.message?.toLowerCase().includes('not configured') ?? false);
}

async function fetchExternalData<T>(params: {
  tabela: 'clientes' | 'fornecedores';
  limit: number;
  page?: number;
  search?: string;
}): Promise<ExternalListResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const queryParams = new URLSearchParams({
    tabela: params.tabela,
    limit: String(params.limit),
    ...(params.page ? { page: String(params.page) } : {}),
    ...(params.search ? { search: params.search } : {}),
  });

  const response = await fetch(`https://${projectId}.supabase.co/functions/v1/external-data?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  const payload = await response.json().catch(() => null) as ExternalListResponse<T> | null;

  if (!response.ok) {
    if (isExternalDataNotConfigured(payload)) {
      return { data: [], total: 0, total_pages: 0, fallback: true };
    }

    throw new Error(
      payload?.message
      || payload?.error
      || `Erro ao buscar ${params.tabela} externos`
    );
  }

  if (isExternalDataNotConfigured(payload)) {
    return { ...payload, data: [], total: 0, total_pages: 0, fallback: true };
  }

  return payload ?? { data: [], total: 0, total_pages: 0 };
}

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
    staleTime: STALE_TIMES.static,
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
    staleTime: STALE_TIMES.static,
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
    staleTime: STALE_TIMES.config,
  });
}

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

export function useContasPagar() {
  return useQuery({
    queryKey: ['contas-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_contas_pagar_painel')
        .select('*')
        .order('data_vencimento', { ascending: true })
        .limit(500);
      if (error) throw error;
      return data;
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
    staleTime: STALE_TIMES.financial,
  });
}

export function useContasReceber() {
  return useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_contas_receber_painel')
        .select('*')
        .order('data_vencimento', { ascending: true })
        .limit(500);
      if (error) throw error;
      return data;
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
    queryKey: ['contas-receber', 'paginated', page, pageSize, search, status, centroCustoId, empresaId, contaBancariaId],
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
        data: dataResult.data || [],
        totalCount: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
    },
    staleTime: STALE_TIMES.financial,
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