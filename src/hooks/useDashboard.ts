import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contasPagarService } from '@/services/contas-pagar.service';
import { contasReceberService } from '@/services/contas-receber.service';
import { reportService } from '@/services/report.service';

interface DashboardStats {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
  contasAPagar: number;
  contasAReceber: number;
  contasAtrasadas: number;
  receitasHoje: number;
  despesasHoje: number;
}

interface DashboardWidgetData {
  recentTransactions: Array<{
    id: string;
    type: 'entrada' | 'saida';
    description: string;
    value: number;
    date: string;
    status: string;
  }>;
  upcomingBills: Array<{
    id: string;
    description: string;
    value: number;
    dueDate: string;
    daysUntilDue: number;
  }>;
  overdueBills: Array<{
    id: string;
    description: string;
    value: number;
    dueDate: string;
    daysOverdue: number;
  }>;
}

interface UseDashboardOptions {
  period?: 'today' | 'week' | 'month' | 'year';
  enabled?: boolean;
}

/**
 * Hook principal para o Dashboard
 */
export function useDashboard(options: UseDashboardOptions = {}) {
  const { period = 'month', enabled = true } = options;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Calcular datas baseado no período
  const dateRange = useMemo(() => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    
    let startDate: string;
    switch (period) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      case 'month':
      default:
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
    }
    
    return { startDate, endDate };
  }, [period]);

  // Stats principais
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats', dateRange],
    queryFn: async (): Promise<DashboardStats> => {
      const summary = await reportService.getSummary(dateRange);
      const today = new Date().toISOString().split('T')[0];

      // Buscar transações de hoje
      const [receberHoje, pagarHoje] = await Promise.all([
        contasReceberService.getAll({ 
          status: 'recebido', 
          startDate: today, 
          endDate: today 
        }).catch(() => []),
        contasPagarService.getAll({ 
          status: 'pago', 
          startDate: today, 
          endDate: today 
        }).catch(() => []),
      ]);

      return {
        ...summary,
        receitasHoje: (receberHoje || []).reduce((sum, c) => sum + (c.valor || 0), 0),
        despesasHoje: (pagarHoje || []).reduce((sum, c) => sum + (c.valor || 0), 0),
      };
    },
    enabled,
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  });

  // Transações recentes
  const recentTransactionsQuery = useQuery({
    queryKey: ['dashboard', 'recentTransactions'],
    queryFn: async () => {
      const [receber, pagar] = await Promise.all([
        contasReceberService.getAll(),
        contasPagarService.getAll(),
      ]);

      const transactions = [
        ...(receber || []).map(c => ({
          id: c.id,
          type: 'entrada' as const,
          description: c.descricao,
          value: c.valor,
          date: c.data_recebimento || c.data_vencimento,
          status: c.status,
        })),
        ...(pagar || []).map(c => ({
          id: c.id,
          type: 'saida' as const,
          description: c.descricao,
          value: c.valor,
          date: c.data_pagamento || c.data_vencimento,
          status: c.status,
        })),
      ];

      return transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
    enabled,
    staleTime: 60 * 1000,
  });

  // Próximas contas a vencer
  const upcomingBillsQuery = useQuery({
    queryKey: ['dashboard', 'upcomingBills'],
    queryFn: async () => {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const contas = await contasPagarService.getAll({
        status: 'pendente',
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
      });

      return (contas || []).map(conta => ({
        id: conta.id,
        description: conta.descricao,
        value: conta.valor,
        dueDate: conta.data_vencimento,
        daysUntilDue: Math.ceil(
          (new Date(conta.data_vencimento).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    },
    enabled,
    staleTime: 60 * 1000,
  });

  // Contas atrasadas
  const overdueBillsQuery = useQuery({
    queryKey: ['dashboard', 'overdueBills'],
    queryFn: async () => {
      const today = new Date();
      const contas = await contasPagarService.getOverdue();

      return (contas || []).map(conta => ({
        id: conta.id,
        description: conta.descricao,
        value: conta.valor,
        dueDate: conta.data_vencimento,
        daysOverdue: Math.ceil(
          (today.getTime() - new Date(conta.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
        ),
      })).sort((a, b) => b.daysOverdue - a.daysOverdue);
    },
    enabled,
    staleTime: 60 * 1000,
  });

  // Fluxo de caixa
  const cashFlowQuery = useQuery({
    queryKey: ['dashboard', 'cashFlow', dateRange],
    queryFn: () => reportService.getCashFlow(dateRange),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  // Refresh all data
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Status geral
  const isLoading = 
    statsQuery.isLoading || 
    recentTransactionsQuery.isLoading ||
    upcomingBillsQuery.isLoading ||
    overdueBillsQuery.isLoading;

  const isError = 
    statsQuery.isError || 
    recentTransactionsQuery.isError ||
    upcomingBillsQuery.isError ||
    overdueBillsQuery.isError;

  const error = 
    statsQuery.error || 
    recentTransactionsQuery.error ||
    upcomingBillsQuery.error ||
    overdueBillsQuery.error;

  return {
    // Data
    stats: statsQuery.data,
    recentTransactions: recentTransactionsQuery.data || [],
    upcomingBills: upcomingBillsQuery.data || [],
    overdueBills: overdueBillsQuery.data || [],
    cashFlow: cashFlowQuery.data || [],

    // Status
    isLoading,
    isError,
    error,
    refreshing,

    // Individual loading states
    statsLoading: statsQuery.isLoading,
    transactionsLoading: recentTransactionsQuery.isLoading,
    upcomingLoading: upcomingBillsQuery.isLoading,
    overdueLoading: overdueBillsQuery.isLoading,
    cashFlowLoading: cashFlowQuery.isLoading,

    // Actions
    refresh,
    
    // Date range
    dateRange,
  };
}

/**
 * Hook para stats resumidos (versão leve)
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'statsLight'],
    queryFn: async () => {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      return reportService.getSummary({
        startDate: monthAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      });
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook para alertas do dashboard
 */
export function useDashboardAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [overdue, dueToday, dueTomorrow] = await Promise.all([
        contasPagarService.getOverdue(),
        contasPagarService.getAll({
          status: 'pendente',
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        }),
        contasPagarService.getAll({
          status: 'pendente',
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
        }),
      ]);

      const alerts = [];

      if ((overdue || []).length > 0) {
        const total = (overdue || []).reduce((sum, c) => sum + (c.valor || 0), 0);
        alerts.push({
          type: 'error' as const,
          title: 'Contas Atrasadas',
          message: `${overdue!.length} conta(s) atrasada(s) totalizando R$ ${total.toFixed(2)}`,
          count: overdue!.length,
          value: total,
        });
      }

      if ((dueToday || []).length > 0) {
        const total = (dueToday || []).reduce((sum, c) => sum + (c.valor || 0), 0);
        alerts.push({
          type: 'warning' as const,
          title: 'Vence Hoje',
          message: `${dueToday!.length} conta(s) vencem hoje`,
          count: dueToday!.length,
          value: total,
        });
      }

      if ((dueTomorrow || []).length > 0) {
        const total = (dueTomorrow || []).reduce((sum, c) => sum + (c.valor || 0), 0);
        alerts.push({
          type: 'info' as const,
          title: 'Vence Amanhã',
          message: `${dueTomorrow!.length} conta(s) vencem amanhã`,
          count: dueTomorrow!.length,
          value: total,
        });
      }

      return alerts;
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
