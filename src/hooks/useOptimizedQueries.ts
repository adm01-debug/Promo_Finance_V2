import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Prefetch common data on app load
export function usePrefetchCriticalData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch empresas
    queryClient.prefetchQuery({
      queryKey: ['empresas'],
      queryFn: async () => {
        const { data } = await supabase
          .from('empresas')
          .select('*')
          .eq('ativo', true)
          .order('razao_social');
        return data || [];
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // Prefetch contas bancarias
    queryClient.prefetchQuery({
      queryKey: ['contas-bancarias'],
      queryFn: async () => {
        const { data } = await supabase
          .from('contas_bancarias')
          .select('*, empresas(razao_social, nome_fantasia)')
          .eq('ativo', true)
          .order('banco');
        return data || [];
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Prefetch centros de custo
    queryClient.prefetchQuery({
      queryKey: ['centros-custo'],
      queryFn: async () => {
        const { data } = await supabase
          .from('centros_custo')
          .select('*')
          .eq('ativo', true)
          .order('nome');
        return data || [];
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  }, [queryClient]);
}

// Hook for invalidating related queries efficiently
export function useInvalidateRelatedQueries() {
  const queryClient = useQueryClient();

  const invalidateFinancialData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['fluxo-caixa'] });
    queryClient.invalidateQueries({ queryKey: ['saldos-por-banco'] });
    queryClient.invalidateQueries({ queryKey: ['evolucao-mensal'] });
    queryClient.invalidateQueries({ queryKey: ['status-contas'] });
  }, [queryClient]);

  const invalidateContasReceber = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
    invalidateFinancialData();
  }, [queryClient, invalidateFinancialData]);

  const invalidateContasPagar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
    invalidateFinancialData();
  }, [queryClient, invalidateFinancialData]);

  const invalidateContasBancarias = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contas-bancarias'] });
    queryClient.invalidateQueries({ queryKey: ['saldos-por-banco'] });
    invalidateFinancialData();
  }, [queryClient, invalidateFinancialData]);

  const invalidateTransacoes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] });
    queryClient.invalidateQueries({ queryKey: ['conciliacao'] });
    invalidateFinancialData();
  }, [queryClient, invalidateFinancialData]);

  return {
    invalidateFinancialData,
    invalidateContasReceber,
    invalidateContasPagar,
    invalidateContasBancarias,
    invalidateTransacoes,
  };
}

// Optimized select fields for common queries
export const SELECT_FIELDS = {
  contasReceber: `
    id,
    cliente_nome,
    descricao,
    valor,
    valor_recebido,
    data_vencimento,
    data_recebimento,
    status,
    tipo_cobranca,
    etapa_cobranca,
    numero_documento,
    created_at,
    cliente_id,
    centro_custo_id,
    conta_bancaria_id,
    empresa_id,
    clientes(razao_social, nome_fantasia, score),
    centros_custo(nome, codigo),
    contas_bancarias(banco)
  `,
  contasPagar: `
    id,
    fornecedor_nome,
    descricao,
    valor,
    valor_pago,
    data_vencimento,
    data_pagamento,
    status,
    tipo_cobranca,
    numero_documento,
    created_at,
    fornecedor_id,
    centro_custo_id,
    conta_bancaria_id,
    empresa_id,
    fornecedores(razao_social, nome_fantasia),
    centros_custo(nome, codigo),
    contas_bancarias(banco)
  `,
  transacoesBancarias: `
    id,
    data,
    descricao,
    valor,
    tipo,
    saldo,
    conciliada,
    conciliada_em,
    conta_bancaria_id,
    conta_pagar_id,
    conta_receber_id,
    contas_bancarias(banco, agencia, conta)
  `,
} as const;

// Pagination helper
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function getPaginationRange(params: PaginationParams) {
  const from = params.page * params.pageSize;
  const to = from + params.pageSize - 1;
  return { from, to };
}

// Debounced search hook
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Import useState at the top
import { useState } from 'react';

// Cache key generators for consistency
export const queryKeys = {
  empresas: () => ['empresas'] as const,
  empresa: (id: string) => ['empresas', id] as const,
  contasBancarias: (filters?: Record<string, unknown>) => 
    filters ? ['contas-bancarias', filters] : ['contas-bancarias'],
  contaBancaria: (id: string) => ['contas-bancarias', id] as const,
  contasReceber: (filters?: Record<string, unknown>) => 
    filters ? ['contas-receber', filters] : ['contas-receber'],
  contaReceber: (id: string) => ['contas-receber', id] as const,
  contasPagar: (filters?: Record<string, unknown>) => 
    filters ? ['contas-pagar', filters] : ['contas-pagar'],
  contaPagar: (id: string) => ['contas-pagar', id] as const,
  clientes: (filters?: Record<string, unknown>) => 
    filters ? ['clientes', filters] : ['clientes'],
  cliente: (id: string) => ['clientes', id] as const,
  fornecedores: (filters?: Record<string, unknown>) => 
    filters ? ['fornecedores', filters] : ['fornecedores'],
  fornecedor: (id: string) => ['fornecedores', id] as const,
  centrosCusto: () => ['centros-custo'] as const,
  centroCusto: (id: string) => ['centros-custo', id] as const,
  dashboardKpis: () => ['dashboard-kpis'] as const,
  fluxoCaixa: (dias: number) => ['fluxo-caixa', dias] as const,
  transacoesBancarias: (contaId?: string) => 
    contaId ? ['transacoes-bancarias', contaId] : ['transacoes-bancarias'],
  alertas: () => ['alertas'] as const,
  aprovacoes: () => ['aprovacoes'] as const,
};