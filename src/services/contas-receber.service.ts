import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type StatusPagamento = Database['public']['Enums']['status_pagamento'];
type TipoCobranca = Database['public']['Enums']['tipo_cobranca'];

export interface ContaReceberFilters {
  status?: StatusPagamento;
  cliente_id?: string;
  categoria?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  minValor?: number;
  maxValor?: number;
}

export interface ContaReceberInput {
  descricao: string;
  valor: number;
  data_vencimento: string;
  cliente_id?: string;
  cliente_nome: string;
  categoria?: string;
  observacoes?: string;
  numero_documento?: string;
  forma_recebimento?: string;
  tipo_cobranca?: TipoCobranca;
  empresa_id: string;
  centro_custo_id?: string;
  conta_bancaria_id?: string;
  created_by: string;
  numero_parcela_atual?: number;
  total_parcelas?: number;
  vendedor_id?: string;
}

export const contasReceberService = {
  async getAll(filters?: ContaReceberFilters) {
    let query = supabase
      .from('vw_contas_receber_painel')
      .select('*')
      .order('vencimento', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.cliente_id) {
      query = query.eq('cliente_id', filters.cliente_id);
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
      .from('contas_receber')
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: ContaReceberInput) {
    const { data, error } = await supabase
      .from('contas_receber')
      .insert({
        descricao: input.descricao,
        valor: input.valor,
        data_vencimento: input.data_vencimento,
        cliente_id: input.cliente_id,
        cliente_nome: input.cliente_nome,
        categoria: input.categoria,
        observacoes: input.observacoes,
        numero_documento: input.numero_documento,
        forma_recebimento: input.forma_recebimento,
        tipo_cobranca: input.tipo_cobranca || 'boleto',
        empresa_id: input.empresa_id,
        centro_custo_id: input.centro_custo_id,
        conta_bancaria_id: input.conta_bancaria_id,
        created_by: input.created_by,
        numero_parcela_atual: input.numero_parcela_atual,
        total_parcelas: input.total_parcelas,
        vendedor_id: input.vendedor_id,
        status: 'pendente' as StatusPagamento,
      })
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<ContaReceberInput>) {
    const updateData: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('contas_receber')
      .update(updateData as any)
      .eq('id', id)
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contas_receber')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async markAsReceived(id: string, dataRecebimento?: string) {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({
        status: 'pago' as StatusPagamento,
        data_recebimento: dataRecebimento || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)')
      .single();

    if (error) throw error;
    return data;
  },

  async cancel(id: string) {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({
        status: 'cancelado' as StatusPagamento,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)')
      .single();

    if (error) throw error;
    return data;
  },

  async getOverdue() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('contas_receber')
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)')
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
      .from('contas_receber')
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)')
      .eq('status', 'pendente')
      .gte('data_vencimento', today.toISOString().split('T')[0])
      .lte('data_vencimento', endOfWeek.toISOString().split('T')[0])
      .order('data_vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByCliente(clienteId: string) {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)')
      .eq('cliente_id', clienteId)
      .order('data_vencimento', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTotalByStatus() {
    const { data, error } = await supabase
      .from('contas_receber')
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

  async bulkUpdate(ids: string[], updates: Partial<ContaReceberInput>) {
    const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('contas_receber')
      .update(updateData as any)
      .in('id', ids)
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)');

    if (error) throw error;
    return data || [];
  },

  async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('contas_receber')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async bulkMarkAsReceived(ids: string[], dataRecebimento?: string) {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({
        status: 'pago' as StatusPagamento,
        data_recebimento: dataRecebimento || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select('*, cliente:clientes(id, razao_social, cnpj_cpf)');

    if (error) throw error;
    return data || [];
  },

  async getCategorias(): Promise<string[]> {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('categoria')
      .not('categoria', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map(d => d.categoria).filter(Boolean) as string[])];
  },

  async getSummary(filters?: ContaReceberFilters) {
    const contas = await this.getAll(filters);
    
    return {
      total: contas.reduce((sum, c: any) => sum + (c.valor || 0), 0),
      pendente: contas.filter((c: any) => c.status === 'pendente').reduce((sum, c: any) => sum + (c.valor || 0), 0),
      recebido: contas.filter((c: any) => c.status === 'pago').reduce((sum, c: any) => sum + (c.valor || 0), 0),
      atrasado: contas.filter((c: any) => c.status === 'vencido').reduce((sum, c: any) => sum + (c.valor || 0), 0),
      count: contas.length,
    };
  },

  async exportToCSV(filters?: ContaReceberFilters): Promise<string> {
    const contas = await this.getAll(filters);
    
    const headers = ['ID', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Cliente', 'Categoria', 'Data Recebimento'];
    const rows = contas.map((c: any) => [
      c.id,
      c.descricao,
      c.valor?.toString() || '',
      c.vencimento || c.data_vencimento || '',
      c.status,
      c.cliente_nome || '',
      c.categoria || '',
      c.data_recebimento || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `contas-receber-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    return link.download;
  },
};

export default contasReceberService;