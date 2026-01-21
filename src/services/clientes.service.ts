import { supabase } from '@/integrations/supabase/client';

export interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo: boolean;
  observacoes?: string;
  limite_credito?: number;
  created_at: string;
  updated_at: string;
}

export interface ClienteFilters {
  ativo?: boolean;
  search?: string;
  estado?: string;
  cidade?: string;
}

export interface ClienteInput {
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  limite_credito?: number;
}

export interface ClienteStats {
  totalReceber: number;
  totalRecebido: number;
  contasAbertas: number;
  contasAtrasadas: number;
  ultimaCompra?: string;
}

export const clientesService = {
  async getAll(filters?: ClienteFilters): Promise<Cliente[]> {
    let query = supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });

    if (filters?.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo);
    }
    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,cpf_cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }
    if (filters?.cidade) {
      query = query.ilike('cidade', `%${filters.cidade}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByCpfCnpj(cpfCnpj: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cpf_cnpj', cpfCnpj)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(input: ClienteInput): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        ...input,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<ClienteInput>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deactivate(id: string): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ativo: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async activate(id: string): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ativo: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getContasReceber(clienteId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('vencimento', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getStats(clienteId: string): Promise<ClienteStats> {
    const contas = await this.getContasReceber(clienteId);
    const today = new Date().toISOString().split('T')[0];

    const totalReceber = contas
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + c.valor, 0);

    const totalRecebido = contas
      .filter(c => c.status === 'recebido')
      .reduce((sum, c) => sum + c.valor, 0);

    const contasAbertas = contas.filter(c => c.status === 'pendente').length;
    
    const contasAtrasadas = contas.filter(
      c => c.status === 'pendente' && c.vencimento < today
    ).length;

    const ultimaConta = contas
      .filter(c => c.status === 'recebido')
      .sort((a, b) => new Date(b.data_recebimento).getTime() - new Date(a.data_recebimento).getTime())[0];

    return {
      totalReceber,
      totalRecebido,
      contasAbertas,
      contasAtrasadas,
      ultimaCompra: ultimaConta?.data_recebimento,
    };
  },

  async search(term: string): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('ativo', true)
      .or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  async getEstados(): Promise<string[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('estado')
      .not('estado', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map(d => d.estado).filter(Boolean))].sort();
  },

  async getCidades(estado?: string): Promise<string[]> {
    let query = supabase
      .from('clientes')
      .select('cidade')
      .not('cidade', 'is', null);

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;
    if (error) throw error;
    return [...new Set((data || []).map(d => d.cidade).filter(Boolean))].sort();
  },

  async checkLimiteCredito(clienteId: string): Promise<{ disponivel: number; usado: number; limite: number }> {
    const cliente = await this.getById(clienteId);
    if (!cliente) throw new Error('Cliente não encontrado');

    const limite = cliente.limite_credito || 0;
    
    const { data: contasPendentes } = await supabase
      .from('contas_receber')
      .select('valor')
      .eq('cliente_id', clienteId)
      .eq('status', 'pendente');

    const usado = (contasPendentes || []).reduce((sum, c) => sum + c.valor, 0);

    return {
      limite,
      usado,
      disponivel: Math.max(0, limite - usado),
    };
  },

  async exportToCSV(filters?: ClienteFilters): Promise<string> {
    const clientes = await this.getAll(filters);
    
    const headers = ['ID', 'Nome', 'CPF/CNPJ', 'Email', 'Telefone', 'Cidade', 'Estado', 'Ativo'];
    const rows = clientes.map(c => [
      c.id,
      c.nome,
      c.cpf_cnpj || '',
      c.email || '',
      c.telefone || '',
      c.cidade || '',
      c.estado || '',
      c.ativo ? 'Sim' : 'Não',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    return link.download;
  },
};

export default clientesService;
