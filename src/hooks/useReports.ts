import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  reportService, 
  ReportFilters, 
  SummaryReport, 
  CashFlowItem,
  CategoryReport,
  ClienteReport,
  FornecedorReport,
  AgingReport,
} from '@/services/report.service';

interface UseReportsOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Hook para gerenciar relatórios
 */
export function useReports(
  filters: ReportFilters = {},
  options: UseReportsOptions = {}
) {
  const { enabled = true, staleTime = 5 * 60 * 1000, refetchOnWindowFocus = false } = options;

  const summaryQuery = useQuery({
    queryKey: ['reports', 'summary', filters],
    queryFn: () => reportService.getSummary(filters),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });

  const cashFlowQuery = useQuery({
    queryKey: ['reports', 'cashFlow', filters],
    queryFn: () => reportService.getCashFlow(filters),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });

  const despesasCategoriaQuery = useQuery({
    queryKey: ['reports', 'despesasCategoria', filters],
    queryFn: () => reportService.getDespesasByCategoria(filters),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });

  const receitasCategoriaQuery = useQuery({
    queryKey: ['reports', 'receitasCategoria', filters],
    queryFn: () => reportService.getReceitasByCategoria(filters),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });

  const clientesQuery = useQuery({
    queryKey: ['reports', 'clientes', filters],
    queryFn: () => reportService.getByCliente(filters),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });

  const fornecedoresQuery = useQuery({
    queryKey: ['reports', 'fornecedores', filters],
    queryFn: () => reportService.getByFornecedor(filters),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });

  const agingPagarQuery = useQuery({
    queryKey: ['reports', 'agingPagar'],
    queryFn: () => reportService.getAging('pagar'),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });

  const agingReceberQuery = useQuery({
    queryKey: ['reports', 'agingReceber'],
    queryFn: () => reportService.getAging('receber'),
    enabled,
    staleTime,
    refetchOnWindowFocus,
  });

  const exportSummaryToCSV = useCallback(() => {
    if (summaryQuery.data) {
      reportService.exportToCSV([summaryQuery.data], 'relatorio-resumo');
    }
  }, [summaryQuery.data]);

  const exportCashFlowToCSV = useCallback(() => {
    if (cashFlowQuery.data) {
      reportService.exportToCSV(cashFlowQuery.data, 'fluxo-caixa');
    }
  }, [cashFlowQuery.data]);

  const exportDespesasToCSV = useCallback(() => {
    if (despesasCategoriaQuery.data) {
      reportService.exportToCSV(despesasCategoriaQuery.data, 'despesas-categoria');
    }
  }, [despesasCategoriaQuery.data]);

  const exportReceitasToCSV = useCallback(() => {
    if (receitasCategoriaQuery.data) {
      reportService.exportToCSV(receitasCategoriaQuery.data, 'receitas-categoria');
    }
  }, [receitasCategoriaQuery.data]);

  const exportClientesToCSV = useCallback(() => {
    if (clientesQuery.data) {
      reportService.exportToCSV(
        clientesQuery.data.map(c => ({
          cliente: c.cliente.nome,
          totalReceber: c.totalReceber,
          totalRecebido: c.totalRecebido,
          contasAbertas: c.contasAbertas,
          contasAtrasadas: c.contasAtrasadas,
        })),
        'relatorio-clientes'
      );
    }
  }, [clientesQuery.data]);

  const exportFornecedoresToCSV = useCallback(() => {
    if (fornecedoresQuery.data) {
      reportService.exportToCSV(
        fornecedoresQuery.data.map(f => ({
          fornecedor: f.fornecedor.nome,
          totalPagar: f.totalPagar,
          totalPago: f.totalPago,
          contasAbertas: f.contasAbertas,
          contasAtrasadas: f.contasAtrasadas,
        })),
        'relatorio-fornecedores'
      );
    }
  }, [fornecedoresQuery.data]);

  const isLoading = 
    summaryQuery.isLoading || 
    cashFlowQuery.isLoading ||
    despesasCategoriaQuery.isLoading ||
    receitasCategoriaQuery.isLoading;

  const isError = 
    summaryQuery.isError || 
    cashFlowQuery.isError ||
    despesasCategoriaQuery.isError ||
    receitasCategoriaQuery.isError;

  const refetchAll = useCallback(async () => {
    await Promise.all([
      summaryQuery.refetch(),
      cashFlowQuery.refetch(),
      despesasCategoriaQuery.refetch(),
      receitasCategoriaQuery.refetch(),
      clientesQuery.refetch(),
      fornecedoresQuery.refetch(),
      agingPagarQuery.refetch(),
      agingReceberQuery.refetch(),
    ]);
  }, [
    summaryQuery, 
    cashFlowQuery, 
    despesasCategoriaQuery, 
    receitasCategoriaQuery,
    clientesQuery,
    fornecedoresQuery,
    agingPagarQuery,
    agingReceberQuery,
  ]);

  return {
    // Data
    summary: summaryQuery.data,
    cashFlow: cashFlowQuery.data,
    despesasCategoria: despesasCategoriaQuery.data,
    receitasCategoria: receitasCategoriaQuery.data,
    clientes: clientesQuery.data,
    fornecedores: fornecedoresQuery.data,
    agingPagar: agingPagarQuery.data,
    agingReceber: agingReceberQuery.data,

    // Status
    isLoading,
    isError,
    
    // Individual loading states
    summaryLoading: summaryQuery.isLoading,
    cashFlowLoading: cashFlowQuery.isLoading,
    despesasLoading: despesasCategoriaQuery.isLoading,
    receitasLoading: receitasCategoriaQuery.isLoading,
    clientesLoading: clientesQuery.isLoading,
    fornecedoresLoading: fornecedoresQuery.isLoading,
    agingPagarLoading: agingPagarQuery.isLoading,
    agingReceberLoading: agingReceberQuery.isLoading,

    // Export functions
    exportSummaryToCSV,
    exportCashFlowToCSV,
    exportDespesasToCSV,
    exportReceitasToCSV,
    exportClientesToCSV,
    exportFornecedoresToCSV,

    // Refetch
    refetchAll,
  };
}

/**
 * Hook para relatório de resumo apenas
 */
export function useSummaryReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'summary', filters],
    queryFn: () => reportService.getSummary(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para fluxo de caixa apenas
 */
export function useCashFlowReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'cashFlow', filters],
    queryFn: () => reportService.getCashFlow(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para aging report
 */
export function useAgingReport(type: 'pagar' | 'receber') {
  return useQuery({
    queryKey: ['reports', `aging${type}`],
    queryFn: () => reportService.getAging(type),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para relatório por categoria
 */
export function useCategoryReport(
  type: 'despesas' | 'receitas',
  filters: ReportFilters = {}
) {
  return useQuery({
    queryKey: ['reports', `${type}Categoria`, filters],
    queryFn: () => 
      type === 'despesas' 
        ? reportService.getDespesasByCategoria(filters)
        : reportService.getReceitasByCategoria(filters),
    staleTime: 5 * 60 * 1000,
  });
}
