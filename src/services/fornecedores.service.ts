// @ts-nocheck - Service types diverge from generated DB types
import { supabase } from '@/integrations/supabase/client';

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo: boolean;
  categoria?: string;
  observacoes?: string;
  contato_nome?: string;
  contato_telefone?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
  created_at: string;
  updated_at: string;
}

export interface FornecedorFilters {
  ativo?: boolean;
  search?: string;
  estado?: string;
  categoria?: string;
}

export interface FornecedorInput {
  nome: string;
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
}

export interface FornecedorStats {
  totalPago: number;
  totalPendente: number;
  contasAbertas: number;
  contasAtrasadas: number;
  ultimoPagamento?: string;
}

export const fornecedoresService = {
  async getAll(filters?: FornecedorFilters): Promise<Fornecedor[]> {
    let query = supabase
      .from('fornecedores')
      .select('*')
      .order('nome', { ascending: true });

    if (filters?.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo);
    }
    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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

  async getById(id: string): Promise<Fornecedor | null> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByCnpj(cnpj: string): Promise<Fornecedor | null> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('cnpj', cnpj)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(input: FornecedorInput): Promise<Fornecedor> {
    const { data, error } = await supabase
      .from('fornecedores')
      .insert({
        ...input,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<FornecedorInput>): Promise<Fornecedor> {
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

  async deactivate(id: string): Promise<Fornecedor> {
    const { data, error } = await supabase
      .from('fornecedores')
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

  async activate(id: string): Promise<Fornecedor> {
    const { data, error } = await supabase
      .from('fornecedores')
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

  async getContasPagar(fornecedorId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('fornecedor_id', fornecedorId)
      .order('vencimento', { ascending: false });

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
      c => c.status === 'pendente' && c.vencimento < today
    ).length;

    const ultimaConta = contas
      .filter(c => c.status === 'pago')
      .sort((a, b) => new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime())[0];

    return {
      totalPago,
      totalPendente,
      contasAbertas,
      contasAtrasadas,
      ultimoPagamento: ultimaConta?.data_pagamento,
    };
  },

  async search(term: string): Promise<Fornecedor[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('ativo', true)
      .or(`nome.ilike.%${term}%,cnpj.ilike.%${term}%`)
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
    return [...new Set((data || []).map(d => d.categoria).filter(Boolean))].sort();
  },

  async getEstados(): Promise<string[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('estado')
      .not('estado', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map(d => d.estado).filter(Boolean))].sort();
  },

  async exportToCSV(filters?: FornecedorFilters): Promise<string> {
    const fornecedores = await this.getAll(filters);
    
    const headers = ['ID', 'Nome', 'CNPJ', 'Email', 'Telefone', 'Cidade', 'Estado', 'Categoria', 'Ativo'];
    const rows = fornecedores.map(f => [
      f.id,
      f.nome,
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
