import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ClienteRow = Database['public']['Tables']['clientes']['Row'];

export interface ClienteFilters {
  ativo?: boolean;
  search?: string;
  estado?: string;
  cidade?: string;
}

export interface ClienteInput {
  razao_social: string;
  nome_fantasia?: string;
  cnpj_cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  limite_credito?: number;
  tipo?: string;
  empresa_id?: string;
}

export interface ClienteStats {
  totalReceber: number;
  totalRecebido: number;
  contasAbertas: number;
  contasAtrasadas: number;
  ultimaCompra?: string;
}

export const clientesService = {
  async getAll(filters?: ClienteFilters): Promise<ClienteRow[]> {
    let query = supabase
      .from('clientes')
      .select('*')
      .order('razao_social', { ascending: true });

    if (filters?.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo);
    }
    if (filters?.search) {
      query = query.or(`razao_social.ilike.%${filters.search}%,cnpj_cpf.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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

  async getById(id: string): Promise<ClienteRow | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByCpfCnpj(cpfCnpj: string): Promise<ClienteRow | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cnpj_cpf', cpfCnpj)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(input: ClienteInput): Promise<ClienteRow> {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        razao_social: input.razao_social,
        nome_fantasia: input.nome_fantasia,
        cnpj_cpf: input.cnpj_cpf,
        email: input.email,
        telefone: input.telefone,
        endereco: input.endereco,
        cidade: input.cidade,
        estado: input.estado,
        observacoes: input.observacoes,
        limite_credito: input.limite_credito,
        tipo: input.tipo,
        empresa_id: input.empresa_id,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<ClienteInput>): Promise<ClienteRow> {
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

  async deactivate(id: string): Promise<ClienteRow> {
    const { data, error } = await supabase
      .from('clientes')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async activate(id: string): Promise<ClienteRow> {
    const { data, error } = await supabase
      .from('clientes')
      .update({ ativo: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getContasReceber(clienteId: string) {
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('data_vencimento', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getStats(clienteId: string): Promise<ClienteStats> {
    const contas = await this.getContasReceber(clienteId);
    const today = new Date().toISOString().split('T')[0];

    const totalReceber = contas
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + (c.valor || 0), 0);

    const totalRecebido = contas
      .filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + (c.valor || 0), 0);

    const contasAbertas = contas.filter(c => c.status === 'pendente').length;
    
    const contasAtrasadas = contas.filter(
      c => c.status === 'pendente' && c.data_vencimento < today
    ).length;

    const ultimaConta = contas
      .filter(c => c.status === 'pago')
      .sort((a, b) => new Date(b.data_recebimento || '').getTime() - new Date(a.data_recebimento || '').getTime())[0];

    return {
      totalReceber,
      totalRecebido,
      contasAbertas,
      contasAtrasadas,
      ultimaCompra: ultimaConta?.data_recebimento || undefined,
    };
  },

  async search(term: string): Promise<ClienteRow[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('ativo', true)
      .or(`razao_social.ilike.%${term}%,cnpj_cpf.ilike.%${term}%`)
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
    return [...new Set((data || []).map(d => d.estado).filter(Boolean) as string[])].sort();
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
    return [...new Set((data || []).map(d => d.cidade).filter(Boolean) as string[])].sort();
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
    
    const headers = ['ID', 'Razão Social', 'CPF/CNPJ', 'Email', 'Telefone', 'Cidade', 'Estado', 'Ativo'];
    const rows = clientes.map(c => [
      c.id,
      c.razao_social,
      c.cnpj_cpf || '',
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