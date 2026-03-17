import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ContaPagarRow = Database['public']['Tables']['contas_pagar']['Row'];
type StatusPagamento = Database['public']['Enums']['status_pagamento'];
type TipoCobranca = Database['public']['Enums']['tipo_cobranca'];

export interface ContaPagarFilters {
  status?: StatusPagamento;
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
  data_vencimento: string;
  fornecedor_id?: string;
  fornecedor_nome: string;
  categoria?: string;
  observacoes?: string;
  numero_documento?: string;
  forma_pagamento?: string;
  tipo_cobranca?: TipoCobranca;
  empresa_id: string;
  centro_custo_id?: string;
  conta_bancaria_id?: string;
  created_by: string;
  numero_parcela_atual?: number;
  total_parcelas?: number;
}

export const contasPagarService = {
  async getAll(filters?: ContaPagarFilters) {
    let query = supabase
      .from('vw_contas_pagar_painel')
      .select('*')
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

  async getById(id: string) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: ContaPagarInput) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .insert({
        descricao: input.descricao,
        valor: input.valor,
        data_vencimento: input.data_vencimento,
        fornecedor_id: input.fornecedor_id,
        fornecedor_nome: input.fornecedor_nome,
        categoria: input.categoria,
        observacoes: input.observacoes,
        numero_documento: input.numero_documento,
        forma_pagamento: input.forma_pagamento,
        tipo_cobranca: input.tipo_cobranca || 'boleto',
        empresa_id: input.empresa_id,
        centro_custo_id: input.centro_custo_id,
        conta_bancaria_id: input.conta_bancaria_id,
        created_by: input.created_by,
        numero_parcela_atual: input.numero_parcela_atual,
        total_parcelas: input.total_parcelas,
        status: 'pendente' as StatusPagamento,
      })
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<ContaPagarInput>) {
    const updateData: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('contas_pagar')
      .update(updateData as any)
      .eq('id', id)
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)')
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

  async markAsPaid(id: string, dataPagamento?: string) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        status: 'pago' as StatusPagamento,
        data_pagamento: dataPagamento || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async cancel(id: string) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        status: 'cancelado' as StatusPagamento,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async getOverdue() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)')
      .eq('status', 'pendente')
      .lt('data_vencimento', today)
      .order('data_vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getDueThisWeek() {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)')
      .eq('status', 'pendente')
      .gte('data_vencimento', today.toISOString().split('T')[0])
      .lte('data_vencimento', endOfWeek.toISOString().split('T')[0])
      .order('data_vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByFornecedor(fornecedorId: string) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)')
      .eq('fornecedor_id', fornecedorId)
      .order('data_vencimento', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTotalByStatus() {
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

  async bulkUpdate(ids: string[], updates: Partial<ContaPagarInput>) {
    const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('contas_pagar')
      .update(updateData as any)
      .in('id', ids)
      .select('*, fornecedor:fornecedores(id, razao_social, nome_fantasia, cnpj)');

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

  async bulkMarkAsPaid(ids: string[], dataPagamento?: string) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .update({
        status: 'pago' as StatusPagamento,
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
    return [...new Set((data || []).map(d => d.categoria).filter(Boolean) as string[])];
  },

  async exportToCSV(filters?: ContaPagarFilters): Promise<string> {
    const contas = await this.getAll(filters);
    
    const headers = ['ID', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Fornecedor', 'Categoria', 'Data Pagamento'];
    const rows = contas.map((c: any) => [
      c.id,
      c.descricao,
      c.valor?.toString() || '',
      c.vencimento || c.data_vencimento || '',
      c.status,
      c.fornecedor_nome || '',
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