import { supabase } from '@/integrations/supabase/client';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  clienteId?: string;
  fornecedorId?: string;
  categoria?: string;
}

export interface CashFlowItem {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface SummaryReport {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
  contasAPagar: number;
  contasAReceber: number;
  contasAtrasadas: number;
  percentualRecebido: number;
  percentualPago: number;
}

export interface CategoryReport {
  categoria: string;
  total: number;
  quantidade: number;
  percentual: number;
}

export interface ClienteReport {
  cliente: { id: string; nome: string };
  totalReceber: number;
  totalRecebido: number;
  contasAbertas: number;
  contasAtrasadas: number;
}

export interface FornecedorReport {
  fornecedor: { id: string; nome: string };
  totalPagar: number;
  totalPago: number;
  contasAbertas: number;
  contasAtrasadas: number;
}

export interface AgingReport {
  faixa: string;
  quantidade: number;
  valor: number;
  percentual: number;
}

export const reportService = {
  async getSummary(filters: ReportFilters = {}): Promise<SummaryReport> {
    const { startDate, endDate } = filters;

    let contasReceberQuery = supabase.from('contas_receber').select('*');
    if (startDate) contasReceberQuery = contasReceberQuery.gte('data_vencimento', startDate);
    if (endDate) contasReceberQuery = contasReceberQuery.lte('data_vencimento', endDate);
    const { data: contasReceber } = await contasReceberQuery;

    let contasPagarQuery = supabase.from('contas_pagar').select('*');
    if (startDate) contasPagarQuery = contasPagarQuery.gte('data_vencimento', startDate);
    if (endDate) contasPagarQuery = contasPagarQuery.lte('data_vencimento', endDate);
    const { data: contasPagar } = await contasPagarQuery;

    const today = new Date().toISOString().split('T')[0];

    const totalReceitas = (contasReceber || []).filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalDespesas = (contasPagar || []).filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor || 0), 0);
    const contasAPagar = (contasPagar || []).filter(c => c.status !== 'pago').reduce((sum, c) => sum + (c.valor || 0), 0);
    const contasAReceber = (contasReceber || []).filter(c => c.status !== 'pago').reduce((sum, c) => sum + (c.valor || 0), 0);
    const contasAtrasadas = [
      ...(contasPagar || []).filter(c => c.status !== 'pago' && c.data_vencimento < today),
      ...(contasReceber || []).filter(c => c.status !== 'pago' && c.data_vencimento < today),
    ].length;

    const totalContasReceber = (contasReceber || []).length;
    const contasRecebidas = (contasReceber || []).filter(c => c.status === 'pago').length;
    const totalContasPagar = (contasPagar || []).length;
    const contasPagas = (contasPagar || []).filter(c => c.status === 'pago').length;

    return {
      totalReceitas, totalDespesas, saldoLiquido: totalReceitas - totalDespesas,
      contasAPagar, contasAReceber, contasAtrasadas,
      percentualRecebido: totalContasReceber > 0 ? Math.round((contasRecebidas / totalContasReceber) * 100) : 0,
      percentualPago: totalContasPagar > 0 ? Math.round((contasPagas / totalContasPagar) * 100) : 0,
    };
  },

  async getCashFlow(filters: ReportFilters = {}): Promise<CashFlowItem[]> {
    const { startDate, endDate } = filters;

    let receberQuery = supabase.from('contas_receber').select('valor, data_recebimento').eq('status', 'pago').not('data_recebimento', 'is', null);
    if (startDate) receberQuery = receberQuery.gte('data_recebimento', startDate);
    if (endDate) receberQuery = receberQuery.lte('data_recebimento', endDate);
    const { data: recebidas } = await receberQuery;

    let pagarQuery = supabase.from('contas_pagar').select('valor, data_pagamento').eq('status', 'pago').not('data_pagamento', 'is', null);
    if (startDate) pagarQuery = pagarQuery.gte('data_pagamento', startDate);
    if (endDate) pagarQuery = pagarQuery.lte('data_pagamento', endDate);
    const { data: pagas } = await pagarQuery;

    const cashFlowMap = new Map<string, { entradas: number; saidas: number }>();

    (recebidas || []).forEach(conta => {
      const date = conta.data_recebimento;
      const existing = cashFlowMap.get(date) || { entradas: 0, saidas: 0 };
      existing.entradas += conta.valor || 0;
      cashFlowMap.set(date, existing);
    });

    (pagas || []).forEach(conta => {
      const date = conta.data_pagamento;
      const existing = cashFlowMap.get(date) || { entradas: 0, saidas: 0 };
      existing.saidas += conta.valor || 0;
      cashFlowMap.set(date, existing);
    });

    const sortedDates = Array.from(cashFlowMap.keys()).sort();
    let saldoAcumulado = 0;

    return sortedDates.map(date => {
      const { entradas, saidas } = cashFlowMap.get(date)!;
      const saldo = entradas - saidas;
      saldoAcumulado += saldo;
      return { date, entradas, saidas, saldo, saldoAcumulado };
    });
  },

  async getDespesasByCategoria(filters: ReportFilters = {}): Promise<CategoryReport[]> {
    const { startDate, endDate } = filters;
    let query = supabase.from('contas_pagar').select('tipo_cobranca, valor');
    if (startDate) query = query.gte('data_vencimento', startDate);
    if (endDate) query = query.lte('data_vencimento', endDate);
    const { data } = await query;

    const categoriaMap = new Map<string, { total: number; quantidade: number }>();
    let grandTotal = 0;

    (data || []).forEach(conta => {
      const categoria = (conta as any).tipo_cobranca || 'Sem categoria';
      const existing = categoriaMap.get(categoria) || { total: 0, quantidade: 0 };
      existing.total += conta.valor || 0;
      existing.quantidade += 1;
      categoriaMap.set(categoria, existing);
      grandTotal += conta.valor || 0;
    });

    return Array.from(categoriaMap.entries())
      .map(([categoria, { total, quantidade }]) => ({
        categoria, total, quantidade,
        percentual: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },

  async getReceitasByCategoria(filters: ReportFilters = {}): Promise<CategoryReport[]> {
    const { startDate, endDate } = filters;
    let query = supabase.from('contas_receber').select('tipo_cobranca, valor');
    if (startDate) query = query.gte('data_vencimento', startDate);
    if (endDate) query = query.lte('data_vencimento', endDate);
    const { data } = await query;

    const categoriaMap = new Map<string, { total: number; quantidade: number }>();
    let grandTotal = 0;

    (data || []).forEach(conta => {
      const categoria = (conta as any).tipo_cobranca || 'Sem categoria';
      const existing = categoriaMap.get(categoria) || { total: 0, quantidade: 0 };
      existing.total += conta.valor || 0;
      existing.quantidade += 1;
      categoriaMap.set(categoria, existing);
      grandTotal += conta.valor || 0;
    });

    return Array.from(categoriaMap.entries())
      .map(([categoria, { total, quantidade }]) => ({
        categoria, total, quantidade,
        percentual: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },

  async getByCliente(filters: ReportFilters = {}): Promise<ClienteReport[]> {
    const { startDate, endDate } = filters;
    const today = new Date().toISOString().split('T')[0];

    // Get contas_receber with client info (client name stored directly on the conta)
    let query = supabase.from('contas_receber').select('*');
    if (startDate) query = query.gte('data_vencimento', startDate);
    if (endDate) query = query.lte('data_vencimento', endDate);
    const { data: contas } = await query;

    // Group by cliente_id
    const clienteMap = new Map<string, { nome: string; contas: typeof contas }>();
    (contas || []).forEach(c => {
      if (!c.cliente_id) return;
      const existing = clienteMap.get(c.cliente_id);
      if (existing) {
        existing.contas!.push(c);
      } else {
        clienteMap.set(c.cliente_id, { nome: c.cliente_nome || 'Desconhecido', contas: [c] });
      }
    });

    return Array.from(clienteMap.entries()).map(([id, { nome, contas: contasCliente }]) => ({
      cliente: { id, nome },
      totalReceber: (contasCliente || []).filter(c => c.status !== 'pago').reduce((sum, c) => sum + (c.valor || 0), 0),
      totalRecebido: (contasCliente || []).filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor || 0), 0),
      contasAbertas: (contasCliente || []).filter(c => c.status !== 'pago').length,
      contasAtrasadas: (contasCliente || []).filter(c => c.status !== 'pago' && c.data_vencimento < today).length,
    })).filter(r => r.totalReceber > 0 || r.totalRecebido > 0);
  },

  async getByFornecedor(filters: ReportFilters = {}): Promise<FornecedorReport[]> {
    const { startDate, endDate } = filters;
    const today = new Date().toISOString().split('T')[0];

    let query = supabase.from('contas_pagar').select('*');
    if (startDate) query = query.gte('data_vencimento', startDate);
    if (endDate) query = query.lte('data_vencimento', endDate);
    const { data: contas } = await query;

    // Group by fornecedor_id
    const fornecedorMap = new Map<string, { nome: string; contas: typeof contas }>();
    (contas || []).forEach(c => {
      if (!c.fornecedor_id) return;
      const existing = fornecedorMap.get(c.fornecedor_id);
      if (existing) {
        existing.contas!.push(c);
      } else {
        fornecedorMap.set(c.fornecedor_id, { nome: c.fornecedor_nome || 'Desconhecido', contas: [c] });
      }
    });

    return Array.from(fornecedorMap.entries()).map(([id, { nome, contas: contasFornecedor }]) => ({
      fornecedor: { id, nome },
      totalPagar: (contasFornecedor || []).filter(c => c.status !== 'pago').reduce((sum, c) => sum + (c.valor || 0), 0),
      totalPago: (contasFornecedor || []).filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor || 0), 0),
      contasAbertas: (contasFornecedor || []).filter(c => c.status !== 'pago').length,
      contasAtrasadas: (contasFornecedor || []).filter(c => c.status !== 'pago' && c.data_vencimento < today).length,
    })).filter(r => r.totalPagar > 0 || r.totalPago > 0);
  },

  async getAging(type: 'pagar' | 'receber'): Promise<AgingReport[]> {
    const today = new Date();
    const table = type === 'pagar' ? 'contas_pagar' : 'contas_receber';

    const { data, error } = await supabase.from(table).select('valor, data_vencimento').neq('status', 'pago');
    if (error) throw new Error(error.message);

    const faixas: Record<string, { quantidade: number; valor: number }> = {
      'A vencer (0-30 dias)': { quantidade: 0, valor: 0 },
      'A vencer (31-60 dias)': { quantidade: 0, valor: 0 },
      'A vencer (61-90 dias)': { quantidade: 0, valor: 0 },
      'A vencer (90+ dias)': { quantidade: 0, valor: 0 },
      'Vencido (1-30 dias)': { quantidade: 0, valor: 0 },
      'Vencido (31-60 dias)': { quantidade: 0, valor: 0 },
      'Vencido (61-90 dias)': { quantidade: 0, valor: 0 },
      'Vencido (90+ dias)': { quantidade: 0, valor: 0 },
    };

    let total = 0;

    (data || []).forEach(conta => {
      const vencimento = new Date(conta.data_vencimento);
      const diffDays = Math.floor((vencimento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let faixa: string;
      if (diffDays >= 0) {
        if (diffDays <= 30) faixa = 'A vencer (0-30 dias)';
        else if (diffDays <= 60) faixa = 'A vencer (31-60 dias)';
        else if (diffDays <= 90) faixa = 'A vencer (61-90 dias)';
        else faixa = 'A vencer (90+ dias)';
      } else {
        const absDays = Math.abs(diffDays);
        if (absDays <= 30) faixa = 'Vencido (1-30 dias)';
        else if (absDays <= 60) faixa = 'Vencido (31-60 dias)';
        else if (absDays <= 90) faixa = 'Vencido (61-90 dias)';
        else faixa = 'Vencido (90+ dias)';
      }

      faixas[faixa].quantidade += 1;
      faixas[faixa].valor += conta.valor || 0;
      total += conta.valor || 0;
    });

    return Object.entries(faixas)
      .filter(([, { quantidade }]) => quantidade > 0)
      .map(([faixa, { quantidade, valor }]) => ({
        faixa, quantidade, valor,
        percentual: total > 0 ? Math.round((valor / total) * 100) : 0,
      }));
  },

  exportToCSV(data: Record<string, unknown>[], filename: string): void {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return value;
      }).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  },
};