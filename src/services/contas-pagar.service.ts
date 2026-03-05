// @ts-nocheck - Service types diverge from generated DB types
import { supabase } from '@/integrations/supabase/client';

export interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  data_pagamento?: string;
  fornecedor_id?: string;
  fornecedor?: { id: string; nome: string; cnpj?: string };
  categoria?: string;
  observacoes?: string;
  numero_documento?: string;
  forma_pagamento?: string;
  parcela?: number;
  total_parcelas?: number;
  created_at: string;
  updated_at: string;
}

export interface ContaPagarFilters {
  status?: string;
  fornecedor_id?: string;
  categoria?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  minValor?: number;
  maxValor?: number;
}

export interface ContaPagarInput {
  descricao: string;
  valor: number;
  vencimento: string;
  fornecedor_id?: string;
  categoria?: string;
  observacoes?: string;
  numero_documento?: string;
  forma_pagamento?: string;
  parcela?: number;
  total_parcelas?: number;
}

export const contasPagarService = {
  async getAll(filters?: ContaPagarFilters): Promise<ContaPagar[]> {
    let query = supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .order('vencimento', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.fornecedor_id) {
      query = query.eq('fornecedor_id', filters.fornecedor_id);
    }
    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria);
    }
    if (filters?.startDate) {
      query = query.gte('vencimento', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('vencimento', filters.endDate);
    }
    if (filters?.search) {
      query = query.ilike('descricao', `%${filters.search}%`);
    }
    if (filters?.minValor !== undefined) {
      query = query.gte('valor', filters.minValor);
    }
    if (filters?.maxValor !== undefined) {
      query = query.lte('valor', filters.maxValor);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ContaPagar | null> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: ContaPagarInput): Promise<ContaPagar> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .insert({
        ...input,
        status: 'pendente',
      })
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<ContaPagarInput>): Promise<ContaPagar> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async markAsPaid(id: string, dataPagamento?: string): Promise<ContaPagar> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        status: 'pago',
        data_pagamento: dataPagamento || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async cancel(id: string): Promise<ContaPagar> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async getOverdue(): Promise<ContaPagar[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .eq('status', 'pendente')
      .lt('vencimento', today)
      .order('vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getDueThisWeek(): Promise<ContaPagar[]> {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .eq('status', 'pendente')
      .gte('vencimento', today.toISOString().split('T')[0])
      .lte('vencimento', endOfWeek.toISOString().split('T')[0])
      .order('vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByFornecedor(fornecedorId: string): Promise<ContaPagar[]> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, nome, cnpj)')
      .eq('fornecedor_id', fornecedorId)
      .order('vencimento', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTotalByStatus(): Promise<Record<string, { count: number; total: number }>> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('status, valor');

    if (error) throw error;

    const result: Record<string, { count: number; total: number }> = {};
    (data || []).forEach(conta => {
      if (!result[conta.status]) {
        result[conta.status] = { count: 0, total: 0 };
      }
      result[conta.status].count++;
      result[conta.status].total += conta.valor;
    });

    return result;
  },

  async bulkUpdate(ids: string[], updates: Partial<ContaPagarInput>): Promise<ContaPagar[]> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select('*, fornecedor:fornecedores(id, nome, cnpj)');

    if (error) throw error;
    return data || [];
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async bulkMarkAsPaid(ids: string[], dataPagamento?: string): Promise<ContaPagar[]> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        status: 'pago',
        data_pagamento: dataPagamento || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select('*, fornecedor:fornecedores(id, nome, cnpj)');

    if (error) throw error;
    return data || [];
  },

  async getCategorias(): Promise<string[]> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('categoria')
      .not('categoria', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map(d => d.categoria).filter(Boolean))];
  },

  async exportToCSV(filters?: ContaPagarFilters): Promise<string> {
    const contas = await this.getAll(filters);
    
    const headers = ['ID', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Fornecedor', 'Categoria', 'Data Pagamento'];
    const rows = contas.map(c => [
      c.id,
      c.descricao,
      c.valor.toString(),
      c.vencimento,
      c.status,
      c.fornecedor?.nome || '',
      c.categoria || '',
      c.data_pagamento || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `contas-pagar-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    return link.download;
  },
};

export default contasPagarService;
