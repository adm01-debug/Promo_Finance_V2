import { supabase } from '@/integrations/supabase/client';

export interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'recebido' | 'atrasado' | 'cancelado';
  data_recebimento?: string;
  cliente_id?: string;
  cliente?: { id: string; nome: string; cpf_cnpj?: string };
  categoria?: string;
  observacoes?: string;
  numero_documento?: string;
  forma_recebimento?: string;
  parcela?: number;
  total_parcelas?: number;
  created_at: string;
  updated_at: string;
}

export interface ContaReceberFilters {
  status?: string;
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
  vencimento: string;
  cliente_id?: string;
  categoria?: string;
  observacoes?: string;
  numero_documento?: string;
  forma_recebimento?: string;
  parcela?: number;
  total_parcelas?: number;
}

export const contasReceberService = {
  async getAll(filters?: ContaReceberFilters): Promise<ContaReceber[]> {
    let query = supabase
      .from('contas_receber')
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
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

  async getById(id: string): Promise<ContaReceber | null> {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: ContaReceberInput): Promise<ContaReceber> {
    const { data, error } = await supabase
      .from('contas_receber')
      .insert({
        ...input,
        status: 'pendente',
      })
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<ContaReceberInput>): Promise<ContaReceber> {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
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

  async markAsReceived(id: string, dataRecebimento?: string): Promise<ContaReceber> {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({
        status: 'recebido',
        data_recebimento: dataRecebimento || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async cancel(id: string): Promise<ContaReceber> {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
      .single();

    if (error) throw error;
    return data;
  },

  async getOverdue(): Promise<ContaReceber[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('contas_receber')
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
      .eq('status', 'pendente')
      .lt('vencimento', today)
      .order('vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getDueThisWeek(): Promise<ContaReceber[]> {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const { data, error } = await supabase
      .from('contas_receber')
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
      .eq('status', 'pendente')
      .gte('vencimento', today.toISOString().split('T')[0])
      .lte('vencimento', endOfWeek.toISOString().split('T')[0])
      .order('vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByCliente(clienteId: string): Promise<ContaReceber[]> {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*, cliente:clientes(id, nome, cpf_cnpj)')
      .eq('cliente_id', clienteId)
      .order('vencimento', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTotalByStatus(): Promise<Record<string, { count: number; total: number }>> {
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

  async bulkUpdate(ids: string[], updates: Partial<ContaReceberInput>): Promise<ContaReceber[]> {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select('*, cliente:clientes(id, nome, cpf_cnpj)');

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

  async bulkMarkAsReceived(ids: string[], dataRecebimento?: string): Promise<ContaReceber[]> {
    const { data, error } = await supabase
      .from('contas_receber')
      .update({
        status: 'recebido',
        data_recebimento: dataRecebimento || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select('*, cliente:clientes(id, nome, cpf_cnpj)');

    if (error) throw error;
    return data || [];
  },

  async getCategorias(): Promise<string[]> {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('categoria')
      .not('categoria', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map(d => d.categoria).filter(Boolean))];
  },

  async getSummary(filters?: ContaReceberFilters): Promise<{
    total: number;
    pendente: number;
    recebido: number;
    atrasado: number;
    count: number;
  }> {
    const contas = await this.getAll(filters);
    
    return {
      total: contas.reduce((sum, c) => sum + c.valor, 0),
      pendente: contas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0),
      recebido: contas.filter(c => c.status === 'recebido').reduce((sum, c) => sum + c.valor, 0),
      atrasado: contas.filter(c => c.status === 'atrasado').reduce((sum, c) => sum + c.valor, 0),
      count: contas.length,
    };
  },

  async exportToCSV(filters?: ContaReceberFilters): Promise<string> {
    const contas = await this.getAll(filters);
    
    const headers = ['ID', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Cliente', 'Categoria', 'Data Recebimento'];
    const rows = contas.map(c => [
      c.id,
      c.descricao,
      c.valor.toString(),
      c.vencimento,
      c.status,
      c.cliente?.nome || '',
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
