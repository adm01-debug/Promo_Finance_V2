import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type FornecedorRow = Database['public']['Tables']['fornecedores']['Row'];

export interface FornecedorFilters {
  ativo?: boolean;
  search?: string;
  estado?: string;
  categoria?: string;
}

export interface FornecedorInput {
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  categoria?: string;
  observacoes?: string;
  contato_nome?: string;
  contato_telefone?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
  empresa_id?: string;
}

export interface FornecedorStats {
  totalPago: number;
  totalPendente: number;
  contasAbertas: number;
  contasAtrasadas: number;
  ultimoPagamento?: string;
}

export const fornecedoresService = {
  async getAll(filters?: FornecedorFilters): Promise<FornecedorRow[]> {
    let query = supabase
      .from('fornecedores')
      .select('*')
      .order('razao_social', { ascending: true });

    if (filters?.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo);
    }
    if (filters?.search) {
      query = query.or(`razao_social.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }
    if (filters?.categoria) {
      query = query.eq('categoria', filters.categoria);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<FornecedorRow | null> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByCnpj(cnpj: string): Promise<FornecedorRow | null> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('cnpj', cnpj)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(input: FornecedorInput): Promise<FornecedorRow> {
    const { data, error } = await supabase
      .from('fornecedores')
      .insert({
        razao_social: input.razao_social,
        nome_fantasia: input.nome_fantasia,
        cnpj: input.cnpj,
        email: input.email,
        telefone: input.telefone,
        endereco: input.endereco,
        cidade: input.cidade,
        estado: input.estado,
        cep: input.cep,
        categoria: input.categoria,
        observacoes: input.observacoes,
        contato_nome: input.contato_nome,
        contato_telefone: input.contato_telefone,
        banco: input.banco,
        agencia: input.agencia,
        conta: input.conta,
        pix: input.pix,
        empresa_id: input.empresa_id,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<FornecedorInput>): Promise<FornecedorRow> {
    const { data, error } = await supabase
      .from('fornecedores')
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
      .from('fornecedores')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deactivate(id: string): Promise<FornecedorRow> {
    const { data, error } = await supabase
      .from('fornecedores')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async activate(id: string): Promise<FornecedorRow> {
    const { data, error } = await supabase
      .from('fornecedores')
      .update({ ativo: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getContasPagar(fornecedorId: string) {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('fornecedor_id', fornecedorId)
      .order('data_vencimento', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getStats(fornecedorId: string): Promise<FornecedorStats> {
    const contas = await this.getContasPagar(fornecedorId);
    const today = new Date().toISOString().split('T')[0];

    const totalPendente = contas
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + c.valor, 0);

    const totalPago = contas
      .filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + c.valor, 0);

    const contasAbertas = contas.filter(c => c.status === 'pendente').length;
    
    const contasAtrasadas = contas.filter(
      c => c.status === 'pendente' && c.data_vencimento < today
    ).length;

    const ultimaConta = contas
      .filter(c => c.status === 'pago')
      .sort((a, b) => new Date(b.data_pagamento || '').getTime() - new Date(a.data_pagamento || '').getTime())[0];

    return {
      totalPago,
      totalPendente,
      contasAbertas,
      contasAtrasadas,
      ultimoPagamento: ultimaConta?.data_pagamento || undefined,
    };
  },

  async search(term: string): Promise<FornecedorRow[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('ativo', true)
      .or(`razao_social.ilike.%${term}%,cnpj.ilike.%${term}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  async getCategorias(): Promise<string[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('categoria')
      .not('categoria', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map(d => d.categoria).filter(Boolean) as string[])].sort();
  },

  async getEstados(): Promise<string[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('estado')
      .not('estado', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map(d => d.estado).filter(Boolean) as string[])].sort();
  },

  async exportToCSV(filters?: FornecedorFilters): Promise<string> {
    const fornecedores = await this.getAll(filters);
    
    const headers = ['ID', 'Razão Social', 'CNPJ', 'Email', 'Telefone', 'Cidade', 'Estado', 'Categoria', 'Ativo'];
    const rows = fornecedores.map(f => [
      f.id,
      f.razao_social,
      f.cnpj || '',
      f.email || '',
      f.telefone || '',
      f.cidade || '',
      f.estado || '',
      f.categoria || '',
      f.ativo ? 'Sim' : 'Não',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `fornecedores-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    return link.download;
  },
};

export default fornecedoresService;