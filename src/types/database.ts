// Generated types for Supabase database
// Update this file when database schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contas_pagar: {
        Row: {
          id: string;
          descricao: string;
          valor: number;
          data_vencimento: string;
          data_emissao: string;
          data_pagamento: string | null;
          status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
          fornecedor_id: string | null;
          categoria_id: string | null;
          numero_documento: string | null;
          forma_pagamento: string | null;
          observacoes: string | null;
          parcelas: number;
          parcela_atual: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contas_pagar']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contas_pagar']['Insert']>;
      };
      contas_receber: {
        Row: {
          id: string;
          descricao: string;
          valor: number;
          data_vencimento: string;
          data_emissao: string;
          data_recebimento: string | null;
          status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
          cliente_id: string | null;
          categoria_id: string | null;
          numero_documento: string | null;
          forma_pagamento: string | null;
          observacoes: string | null;
          parcelas: number;
          parcela_atual: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contas_receber']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contas_receber']['Insert']>;
      };
      clientes: {
        Row: {
          id: string;
          tipo: 'pessoa_fisica' | 'pessoa_juridica';
          nome: string;
          cpf: string | null;
          cnpj: string | null;
          email: string | null;
          telefone: string | null;
          cep: string | null;
          logradouro: string | null;
          numero: string | null;
          complemento: string | null;
          bairro: string | null;
          cidade: string | null;
          estado: string | null;
          observacoes: string | null;
          ativo: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>;
      };
      fornecedores: {
        Row: {
          id: string;
          razao_social: string;
          nome_fantasia: string | null;
          cnpj: string;
          inscricao_estadual: string | null;
          email: string | null;
          telefone: string | null;
          cep: string | null;
          logradouro: string | null;
          numero: string | null;
          complemento: string | null;
          bairro: string | null;
          cidade: string | null;
          estado: string | null;
          contato_nome: string | null;
          contato_telefone: string | null;
          contato_email: string | null;
          observacoes: string | null;
          ativo: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fornecedores']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['fornecedores']['Insert']>;
      };
      categorias: {
        Row: {
          id: string;
          nome: string;
          tipo: 'receita' | 'despesa';
          cor: string;
          icone: string | null;
          descricao: string | null;
          categoria_pai_id: string | null;
          ativo: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categorias']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['categorias']['Insert']>;
      };
      transacoes: {
        Row: {
          id: string;
          tipo: 'receita' | 'despesa' | 'transferencia';
          descricao: string;
          valor: number;
          data: string;
          categoria_id: string | null;
          conta_origem_id: string | null;
          conta_destino_id: string | null;
          cliente_id: string | null;
          fornecedor_id: string | null;
          observacoes: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transacoes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['transacoes']['Insert']>;
      };
      contas_bancarias: {
        Row: {
          id: string;
          nome: string;
          banco: string | null;
          agencia: string | null;
          conta: string | null;
          tipo: 'corrente' | 'poupanca' | 'investimento' | 'caixa';
          saldo_inicial: number;
          saldo_atual: number;
          cor: string | null;
          icone: string | null;
          ativo: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contas_bancarias']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contas_bancarias']['Insert']>;
      };
      usuarios: {
        Row: {
          id: string;
          email: string;
          nome: string;
          avatar_url: string | null;
          role: 'admin' | 'manager' | 'user';
          empresa_id: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>;
      };
      empresas: {
        Row: {
          id: string;
          razao_social: string;
          nome_fantasia: string | null;
          cnpj: string;
          email: string | null;
          telefone: string | null;
          logo_url: string | null;
          plano: 'free' | 'starter' | 'pro' | 'enterprise';
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['empresas']['Insert']>;
      };
    };
    Views: {
      resumo_financeiro: {
        Row: {
          total_receitas: number;
          total_despesas: number;
          saldo: number;
          receitas_pendentes: number;
          despesas_pendentes: number;
          receitas_vencidas: number;
          despesas_vencidas: number;
        };
      };
      fluxo_caixa_mensal: {
        Row: {
          mes: string;
          receitas: number;
          despesas: number;
          saldo: number;
        };
      };
    };
    Functions: {
      get_dashboard_stats: {
        Args: { user_uuid: string };
        Returns: {
          total_receitas: number;
          total_despesas: number;
          saldo: number;
          contas_pagar_pendentes: number;
          contas_receber_pendentes: number;
          contas_vencidas: number;
        };
      };
      get_fluxo_caixa: {
        Args: { user_uuid: string; data_inicio: string; data_fim: string };
        Returns: Array<{
          data: string;
          receitas: number;
          despesas: number;
          saldo_dia: number;
          saldo_acumulado: number;
        }>;
      };
    };
    Enums: {
      status_conta: 'pendente' | 'pago' | 'recebido' | 'vencido' | 'cancelado';
      tipo_pessoa: 'pessoa_fisica' | 'pessoa_juridica';
      tipo_categoria: 'receita' | 'despesa';
      tipo_conta_bancaria: 'corrente' | 'poupanca' | 'investimento' | 'caixa';
      tipo_transacao: 'receita' | 'despesa' | 'transferencia';
      role_usuario: 'admin' | 'manager' | 'user';
      plano_empresa: 'free' | 'starter' | 'pro' | 'enterprise';
    };
  };
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific table types
export type ContaPagar = Tables<'contas_pagar'>;
export type ContaReceber = Tables<'contas_receber'>;
export type Cliente = Tables<'clientes'>;
export type Fornecedor = Tables<'fornecedores'>;
export type Categoria = Tables<'categorias'>;
export type Transacao = Tables<'transacoes'>;
export type ContaBancaria = Tables<'contas_bancarias'>;
export type Usuario = Tables<'usuarios'>;
export type Empresa = Tables<'empresas'>;

// Insert types
export type ContaPagarInsert = Insertable<'contas_pagar'>;
export type ContaReceberInsert = Insertable<'contas_receber'>;
export type ClienteInsert = Insertable<'clientes'>;
export type FornecedorInsert = Insertable<'fornecedores'>;
export type CategoriaInsert = Insertable<'categorias'>;

// Update types
export type ContaPagarUpdate = Updatable<'contas_pagar'>;
export type ContaReceberUpdate = Updatable<'contas_receber'>;
export type ClienteUpdate = Updatable<'clientes'>;
export type FornecedorUpdate = Updatable<'fornecedores'>;
export type CategoriaUpdate = Updatable<'categorias'>;

// Enum types
export type StatusConta = Database['public']['Enums']['status_conta'];
export type TipoPessoa = Database['public']['Enums']['tipo_pessoa'];
export type TipoCategoria = Database['public']['Enums']['tipo_categoria'];
export type TipoContaBancaria = Database['public']['Enums']['tipo_conta_bancaria'];
export type TipoTransacao = Database['public']['Enums']['tipo_transacao'];
export type RoleUsuario = Database['public']['Enums']['role_usuario'];
export type PlanoEmpresa = Database['public']['Enums']['plano_empresa'];
