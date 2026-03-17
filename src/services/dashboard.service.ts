import { supabase } from '@/integrations/supabase/client'; // dashboard service

export interface DashboardStats {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
  contasAPagar: number;
  contasAReceber: number;
  contasAtrasadas: number;
  receitasHoje: number;
  despesasHoje: number;
}

export interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  data: string;
  categoria?: string;
  status: string;
}

export interface UpcomingBill {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  daysUntilDue: number;
  fornecedor?: { id: string; nome: string };
}

export interface OverdueBill {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  daysOverdue: number;
  fornecedor?: { id: string; nome: string };
}

export interface CashFlowItem {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  periodo?: 'today' | 'week' | 'month' | 'year';
}

export const dashboardService = {
  async getStats(filters?: DashboardFilters): Promise<DashboardStats> {
    const { startDate, endDate } = getDateRange(filters?.periodo || 'month');

    const [receitasResult, despesasResult, contasPagarResult, contasReceberResult] = await Promise.all([
      supabase
        .from('contas_receber')
        .select('valor')
        .eq('status', 'pago')
        .gte('data_recebimento', startDate)
        .lte('data_recebimento', endDate),
      supabase
        .from('contas_pagar')
        .select('valor')
        .eq('status', 'pago')
        .gte('data_pagamento', startDate)
        .lte('data_pagamento', endDate),
      supabase
        .from('contas_pagar')
        .select('id, status, data_vencimento')
        .in('status', ['pendente', 'atrasado']),
      supabase
        .from('contas_receber')
        .select('id, status, data_vencimento')
        .in('status', ['pendente', 'atrasado']),
    ]);

    const totalReceitas = receitasResult.data?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
    const totalDespesas = despesasResult.data?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0;
    
    const today = new Date().toISOString().split('T')[0];
    const contasAtrasadas = [
      ...(contasPagarResult.data?.filter(c => c.data_vencimento < today && c.status !== 'pago') || []),
      ...(contasReceberResult.data?.filter(c => c.data_vencimento < today && c.status !== 'pago') || []),
    ].length;

    // Get today's transactions
    const [receitasHojeResult, despesasHojeResult] = await Promise.all([
      supabase
        .from('contas_receber')
        .select('valor')
        .eq('status', 'pago')
        .eq('data_recebimento', today),
      supabase
        .from('contas_pagar')
        .select('valor')
        .eq('status', 'pago')
        .eq('data_pagamento', today),
    ]);

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido: totalReceitas - totalDespesas,
      contasAPagar: contasPagarResult.data?.length || 0,
      contasAReceber: contasReceberResult.data?.length || 0,
      contasAtrasadas,
      receitasHoje: receitasHojeResult.data?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0,
      despesasHoje: despesasHojeResult.data?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0,
    };
  },

  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    const [receitas, despesas] = await Promise.all([
      supabase
        .from('contas_receber')
        .select('id, descricao, valor, data_recebimento, status, categoria')
        .order('data_recebimento', { ascending: false })
        .limit(limit),
      supabase
        .from('contas_pagar')
        .select('id, descricao, valor, data_pagamento, status, categoria')
        .order('data_pagamento', { ascending: false })
        .limit(limit),
    ]);

    const transactions: Transaction[] = [
      ...(receitas.data?.map(r => ({
        id: r.id,
        descricao: r.descricao,
        valor: r.valor,
        tipo: 'receita' as const,
        data: r.data_recebimento,
        categoria: r.categoria,
        status: r.status,
      })) || []),
      ...(despesas.data?.map(d => ({
        id: d.id,
        descricao: d.descricao,
        valor: d.valor,
        tipo: 'despesa' as const,
        data: d.data_pagamento,
        categoria: d.categoria,
        status: d.status,
      })) || []),
    ];

    return transactions
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, limit);
  },

  async getUpcomingBills(days = 7): Promise<UpcomingBill[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const { data, error } = await supabase
      .from('contas_pagar')
      .select('id, descricao, valor, data_vencimento, fornecedor:fornecedores(id, razao_social)')
      .eq('status', 'pendente')
      .gte('data_vencimento', today.toISOString().split('T')[0])
      .lte('data_vencimento', futureDate.toISOString().split('T')[0])
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    return (data || []).map(bill => ({
      id: bill.id,
      descricao: bill.descricao,
      valor: bill.valor,
      vencimento: bill.data_vencimento,
      daysUntilDue: Math.ceil(
        (new Date(bill.data_vencimento).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
      fornecedor: bill.fornecedor,
    }));
  },

  async getOverdueBills(): Promise<OverdueBill[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('contas_pagar')
      .select('id, descricao, valor, data_vencimento, fornecedor:fornecedores(id, razao_social)')
      .eq('status', 'pendente')
      .lt('data_vencimento', today)
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    const todayDate = new Date();
    return (data || []).map(bill => ({
      id: bill.id,
      descricao: bill.descricao,
      valor: bill.valor,
      vencimento: bill.data_vencimento,
      daysOverdue: Math.ceil(
        (todayDate.getTime() - new Date(bill.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
      ),
      fornecedor: bill.fornecedor,
    }));
  },

  async getDueToday(): Promise<UpcomingBill[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('contas_pagar')
      .select('id, descricao, valor, data_vencimento, fornecedor:fornecedores(id, razao_social)')
      .eq('status', 'pendente')
      .eq('data_vencimento', today);

    if (error) throw error;

    return (data || []).map(bill => ({
      id: bill.id,
      descricao: bill.descricao,
      valor: bill.valor,
      vencimento: bill.data_vencimento,
      daysUntilDue: 0,
      fornecedor: bill.fornecedor,
    }));
  },

  async getDueTomorrow(): Promise<UpcomingBill[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('contas_pagar')
      .select('id, descricao, valor, data_vencimento, fornecedor:fornecedores(id, razao_social)')
      .eq('status', 'pendente')
      .eq('data_vencimento', tomorrowStr);

    if (error) throw error;

    return (data || []).map(bill => ({
      id: bill.id,
      descricao: bill.descricao,
      valor: bill.valor,
      vencimento: bill.vencimento,
      daysUntilDue: 1,
      fornecedor: bill.fornecedor,
    }));
  },

  async getCashFlow(filters?: DashboardFilters): Promise<CashFlowItem[]> {
    const { startDate, endDate } = getDateRange(filters?.periodo || 'month');

    const [receitas, despesas] = await Promise.all([
      supabase
        .from('contas_receber')
        .select('data_recebimento, valor')
        .eq('status', 'pago')
        .gte('data_recebimento', startDate)
        .lte('data_recebimento', endDate),
      supabase
        .from('contas_pagar')
        .select('data_pagamento, valor')
        .eq('status', 'pago')
        .gte('data_pagamento', startDate)
        .lte('data_pagamento', endDate),
    ]);

    const cashFlowMap = new Map<string, { entradas: number; saidas: number }>();

    receitas.data?.forEach(r => {
      const date = r.data_recebimento;
      const current = cashFlowMap.get(date) || { entradas: 0, saidas: 0 };
      current.entradas += r.valor;
      cashFlowMap.set(date, current);
    });

    despesas.data?.forEach(d => {
      const date = d.data_pagamento;
      const current = cashFlowMap.get(date) || { entradas: 0, saidas: 0 };
      current.saidas += d.valor;
      cashFlowMap.set(date, current);
    });

    const sortedDates = Array.from(cashFlowMap.keys()).sort();
    let saldoAcumulado = 0;

    return sortedDates.map(date => {
      const { entradas, saidas } = cashFlowMap.get(date)!;
      const saldo = entradas - saidas;
      saldoAcumulado += saldo;

      return {
        date,
        entradas,
        saidas,
        saldo,
        saldoAcumulado,
      };
    });
  },
};

function getDateRange(periodo: string): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  let startDate: string;

  switch (periodo) {
    case 'today':
      startDate = endDate;
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    case 'year':
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      startDate = yearAgo.toISOString().split('T')[0];
      break;
    case 'month':
    default:
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
  }

  return { startDate, endDate };
}

export default dashboardService;
