/**
 * Cash Flow Calculator
 * Calculate and project cash flow
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  eachMonthOfInterval,
  format,
  parseISO,
  isWithinInterval,
  addMonths,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Types
export interface CashFlowItem {
  date: string;
  receitas: number;
  despesas: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface CashFlowSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldoPeriodo: number;
  saldoInicial: number;
  saldoFinal: number;
  maiorReceita: number;
  maiorDespesa: number;
  mediaDiaria: number;
}

export interface CashFlowProjection {
  date: string;
  projetado: number;
  realizado?: number;
  variacao?: number;
}

interface Transaction {
  id: string;
  valor: number;
  vencimento: string;
  status: string;
  tipo: 'receita' | 'despesa';
}

// API functions
async function fetchTransactions(
  startDate: Date,
  endDate: Date
): Promise<Transaction[]> {
  const [receitasRes, despesasRes] = await Promise.all([
    supabase
      .from('contas_receber')
      .select('id, valor, vencimento, status')
      .gte('vencimento', startDate.toISOString())
      .lte('vencimento', endDate.toISOString()),
    supabase
      .from('contas_pagar')
      .select('id, valor, vencimento, status')
      .gte('vencimento', startDate.toISOString())
      .lte('vencimento', endDate.toISOString()),
  ]);

  const receitas: Transaction[] = (receitasRes.data || []).map((r) => ({
    ...r,
    tipo: 'receita' as const,
  }));

  const despesas: Transaction[] = (despesasRes.data || []).map((d) => ({
    ...d,
    tipo: 'despesa' as const,
  }));

  return [...receitas, ...despesas];
}

async function fetchSaldoInicial(date: Date): Promise<number> {
  const { data } = await supabase
    .from('contas_bancarias')
    .select('saldo_atual')
    .eq('ativo', true);

  return (data || []).reduce((sum, acc) => sum + (acc.saldo_atual || 0), 0);
}

/**
 * Calculate daily cash flow
 */
export function calculateDailyCashFlow(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  saldoInicial: number
): CashFlowItem[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  let saldoAcumulado = saldoInicial;

  return days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    const dayTransactions = transactions.filter(
      (t) => t.vencimento.startsWith(dayStr)
    );

    const receitas = dayTransactions
      .filter((t) => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0);

    const despesas = dayTransactions
      .filter((t) => t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0);

    const saldo = receitas - despesas;
    saldoAcumulado += saldo;

    return {
      date: dayStr,
      receitas,
      despesas,
      saldo,
      saldoAcumulado,
    };
  });
}

/**
 * Calculate monthly cash flow
 */
export function calculateMonthlyCashFlow(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  saldoInicial: number
): CashFlowItem[] {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  let saldoAcumulado = saldoInicial;

  return months.map((month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthStr = format(month, 'yyyy-MM');

    const monthTransactions = transactions.filter((t) => {
      const date = parseISO(t.vencimento);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    const receitas = monthTransactions
      .filter((t) => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0);

    const despesas = monthTransactions
      .filter((t) => t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0);

    const saldo = receitas - despesas;
    saldoAcumulado += saldo;

    return {
      date: monthStr,
      receitas,
      despesas,
      saldo,
      saldoAcumulado,
    };
  });
}

/**
 * Calculate cash flow summary
 */
export function calculateCashFlowSummary(
  items: CashFlowItem[],
  saldoInicial: number
): CashFlowSummary {
  const totalReceitas = items.reduce((sum, item) => sum + item.receitas, 0);
  const totalDespesas = items.reduce((sum, item) => sum + item.despesas, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;

  const maiorReceita = Math.max(...items.map((i) => i.receitas), 0);
  const maiorDespesa = Math.max(...items.map((i) => i.despesas), 0);

  const dias = items.length || 1;
  const mediaDiaria = (totalReceitas - totalDespesas) / dias;

  return {
    totalReceitas,
    totalDespesas,
    saldoPeriodo,
    saldoInicial,
    saldoFinal: saldoInicial + saldoPeriodo,
    maiorReceita,
    maiorDespesa,
    mediaDiaria,
  };
}

/**
 * Project future cash flow based on historical data
 */
export function projectCashFlow(
  historicalItems: CashFlowItem[],
  monthsToProject: number,
  saldoAtual: number
): CashFlowProjection[] {
  // Calculate average monthly values
  const avgReceitas = historicalItems.reduce((sum, i) => sum + i.receitas, 0) / 
    (historicalItems.length || 1);
  const avgDespesas = historicalItems.reduce((sum, i) => sum + i.despesas, 0) / 
    (historicalItems.length || 1);

  const projections: CashFlowProjection[] = [];
  let saldo = saldoAtual;

  for (let i = 1; i <= monthsToProject; i++) {
    const date = addMonths(new Date(), i);
    const projected = avgReceitas - avgDespesas;
    saldo += projected;

    projections.push({
      date: format(date, 'yyyy-MM'),
      projetado: saldo,
    });
  }

  return projections;
}

/**
 * Hook for daily cash flow
 */
export function useDailyCashFlow(startDate: Date, endDate: Date) {
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['cash-flow-transactions', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => fetchTransactions(startDate, endDate),
  });

  const { data: saldoInicial = 0, isLoading: loadingSaldo } = useQuery({
    queryKey: ['cash-flow-saldo', startDate.toISOString()],
    queryFn: () => fetchSaldoInicial(startDate),
  });

  const cashFlow = useMemo(() => {
    if (!transactions.length) return [];
    return calculateDailyCashFlow(transactions, startDate, endDate, saldoInicial);
  }, [transactions, startDate, endDate, saldoInicial]);

  const summary = useMemo(() => {
    return calculateCashFlowSummary(cashFlow, saldoInicial);
  }, [cashFlow, saldoInicial]);

  return {
    cashFlow,
    summary,
    isLoading: loadingTransactions || loadingSaldo,
  };
}

/**
 * Hook for monthly cash flow
 */
export function useMonthlyCashFlow(months = 12) {
  const endDate = endOfMonth(new Date());
  const startDate = startOfMonth(subMonths(new Date(), months - 1));

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['cash-flow-monthly', months],
    queryFn: () => fetchTransactions(startDate, endDate),
  });

  const { data: saldoInicial = 0, isLoading: loadingSaldo } = useQuery({
    queryKey: ['cash-flow-saldo-monthly'],
    queryFn: () => fetchSaldoInicial(startDate),
  });

  const cashFlow = useMemo(() => {
    if (!transactions.length) return [];
    return calculateMonthlyCashFlow(transactions, startDate, endDate, saldoInicial);
  }, [transactions, startDate, endDate, saldoInicial]);

  const summary = useMemo(() => {
    return calculateCashFlowSummary(cashFlow, saldoInicial);
  }, [cashFlow, saldoInicial]);

  return {
    cashFlow,
    summary,
    isLoading: loadingTransactions || loadingSaldo,
  };
}

/**
 * Hook for cash flow projection
 */
export function useCashFlowProjection(monthsHistory = 6, monthsToProject = 6) {
  const { cashFlow: historical, isLoading } = useMonthlyCashFlow(monthsHistory);

  const { data: saldoAtual = 0 } = useQuery({
    queryKey: ['current-balance'],
    queryFn: () => fetchSaldoInicial(new Date()),
  });

  const projections = useMemo(() => {
    if (!historical.length) return [];
    return projectCashFlow(historical, monthsToProject, saldoAtual);
  }, [historical, monthsToProject, saldoAtual]);

  return {
    historical,
    projections,
    isLoading,
  };
}

/**
 * Format cash flow data for charts
 */
export function formatCashFlowForChart(items: CashFlowItem[]): Array<{
  name: string;
  receitas: number;
  despesas: number;
  saldo: number;
}> {
  return items.map((item) => ({
    name: item.date.length === 7
      ? format(parseISO(item.date + '-01'), 'MMM/yy', { locale: ptBR })
      : format(parseISO(item.date), 'dd/MM', { locale: ptBR }),
    receitas: item.receitas,
    despesas: item.despesas,
    saldo: item.saldoAcumulado,
  }));
}

export type { Transaction };
export default useDailyCashFlow;
