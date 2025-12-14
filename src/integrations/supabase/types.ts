export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          acao_url: string | null
          created_at: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          lido: boolean
          mensagem: string
          prioridade: Database["public"]["Enums"]["prioridade_alerta"]
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          acao_url?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lido?: boolean
          mensagem: string
          prioridade?: Database["public"]["Enums"]["prioridade_alerta"]
          tipo: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          acao_url?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lido?: boolean
          mensagem?: string
          prioridade?: Database["public"]["Enums"]["prioridade_alerta"]
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bitrix_field_mappings: {
        Row: {
          ativo: boolean
          campo_bitrix: string
          campo_sistema: string
          created_at: string
          entidade: string
          id: string
          obrigatorio: boolean
          transformacao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          campo_bitrix: string
          campo_sistema: string
          created_at?: string
          entidade: string
          id?: string
          obrigatorio?: boolean
          transformacao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          campo_bitrix?: string
          campo_sistema?: string
          created_at?: string
          entidade?: string
          id?: string
          obrigatorio?: boolean
          transformacao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bitrix_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      bitrix_sync_logs: {
        Row: {
          created_at: string
          created_by: string | null
          detalhes: Json | null
          entidade: string
          finalizado_em: string | null
          id: string
          iniciado_em: string
          mensagem_erro: string | null
          registros_com_erro: number | null
          registros_processados: number | null
          status: string
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detalhes?: Json | null
          entidade: string
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          mensagem_erro?: string | null
          registros_com_erro?: number | null
          registros_processados?: number | null
          status?: string
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detalhes?: Json | null
          entidade?: string
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          mensagem_erro?: string | null
          registros_com_erro?: number | null
          registros_processados?: number | null
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      boletos: {
        Row: {
          agencia: string
          banco: string
          cedente_cnpj: string | null
          cedente_nome: string
          codigo_barras: string
          conta: string
          conta_bancaria_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string
          descricao: string | null
          empresa_id: string
          id: string
          linha_digitavel: string
          numero: string
          observacoes: string | null
          sacado_cpf_cnpj: string | null
          sacado_nome: string
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          agencia: string
          banco: string
          cedente_cnpj?: string | null
          cedente_nome: string
          codigo_barras: string
          conta: string
          conta_bancaria_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by: string
          descricao?: string | null
          empresa_id: string
          id?: string
          linha_digitavel: string
          numero: string
          observacoes?: string | null
          sacado_cpf_cnpj?: string | null
          sacado_nome: string
          status?: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          agencia?: string
          banco?: string
          cedente_cnpj?: string | null
          cedente_nome?: string
          codigo_barras?: string
          conta?: string
          conta_bancaria_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          linha_digitavel?: string
          numero?: string
          observacoes?: string | null
          sacado_cpf_cnpj?: string | null
          sacado_nome?: string
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "boletos_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletos_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          orcamento_previsto: number
          orcamento_realizado: number
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          orcamento_previsto?: number
          orcamento_realizado?: number
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          orcamento_previsto?: number
          orcamento_realizado?: number
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          bitrix_id: string | null
          cidade: string | null
          cnpj_cpf: string | null
          contato: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          limite_credito: number | null
          nome_fantasia: string | null
          observacoes: string | null
          razao_social: string
          score: number | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bitrix_id?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          limite_credito?: number | null
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social: string
          score?: number | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bitrix_id?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          limite_credito?: number | null
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social?: string
          score?: number | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_aprovacao: {
        Row: {
          aprovadores_obrigatorios: number
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          updated_at: string
          valor_minimo_aprovacao: number
        }
        Insert: {
          aprovadores_obrigatorios?: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
          valor_minimo_aprovacao?: number
        }
        Update: {
          aprovadores_obrigatorios?: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
          valor_minimo_aprovacao?: number
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          agencia: string
          ativo: boolean
          banco: string
          codigo_banco: string
          conta: string
          cor: string | null
          created_at: string
          empresa_id: string
          id: string
          saldo_atual: number
          saldo_disponivel: number
          tipo_conta: string
          updated_at: string
        }
        Insert: {
          agencia: string
          ativo?: boolean
          banco: string
          codigo_banco: string
          conta: string
          cor?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          saldo_atual?: number
          saldo_disponivel?: number
          tipo_conta?: string
          updated_at?: string
        }
        Update: {
          agencia?: string
          ativo?: boolean
          banco?: string
          codigo_banco?: string
          conta?: string
          cor?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          saldo_atual?: number
          saldo_disponivel?: number
          tipo_conta?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          bitrix_deal_id: string | null
          centro_custo_id: string | null
          codigo_barras: string | null
          conta_bancaria_id: string | null
          created_at: string
          created_by: string
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          fornecedor_id: string | null
          fornecedor_nome: string
          id: string
          numero_documento: string | null
          observacoes: string | null
          recorrente: boolean
          status: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"]
          updated_at: string
          valor: number
          valor_pago: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          bitrix_deal_id?: string | null
          centro_custo_id?: string | null
          codigo_barras?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by: string
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          fornecedor_id?: string | null
          fornecedor_nome: string
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          updated_at?: string
          valor: number
          valor_pago?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          bitrix_deal_id?: string | null
          centro_custo_id?: string | null
          codigo_barras?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by?: string
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          fornecedor_id?: string | null
          fornecedor_nome?: string
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          updated_at?: string
          valor?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          bitrix_deal_id: string | null
          centro_custo_id: string | null
          chave_pix: string | null
          cliente_id: string | null
          cliente_nome: string
          codigo_barras: string | null
          conta_bancaria_id: string | null
          created_at: string
          created_by: string
          data_emissao: string
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          etapa_cobranca: Database["public"]["Enums"]["etapa_cobranca"] | null
          id: string
          link_boleto: string | null
          numero_documento: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"]
          updated_at: string
          valor: number
          valor_recebido: number | null
        }
        Insert: {
          bitrix_deal_id?: string | null
          centro_custo_id?: string | null
          chave_pix?: string | null
          cliente_id?: string | null
          cliente_nome: string
          codigo_barras?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by: string
          data_emissao?: string
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          etapa_cobranca?: Database["public"]["Enums"]["etapa_cobranca"] | null
          id?: string
          link_boleto?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          updated_at?: string
          valor: number
          valor_recebido?: number | null
        }
        Update: {
          bitrix_deal_id?: string | null
          centro_custo_id?: string | null
          chave_pix?: string | null
          cliente_id?: string | null
          cliente_nome?: string
          codigo_barras?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by?: string
          data_emissao?: string
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          etapa_cobranca?: Database["public"]["Enums"]["etapa_cobranca"] | null
          id?: string
          link_boleto?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          updated_at?: string
          valor?: number
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          cnpj: string
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          nome_fantasia: string | null
          razao_social: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          razao_social: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cidade: string | null
          cnpj_cpf: string | null
          contato: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_fantasia: string | null
          observacoes: string | null
          razao_social: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          razao_social?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      historico_relatorios: {
        Row: {
          dados_relatorio: Json | null
          erro_mensagem: string | null
          executado_em: string
          id: string
          relatorio_agendado_id: string | null
          status: string
        }
        Insert: {
          dados_relatorio?: Json | null
          erro_mensagem?: string | null
          executado_em?: string
          id?: string
          relatorio_agendado_id?: string | null
          status?: string
        }
        Update: {
          dados_relatorio?: Json | null
          erro_mensagem?: string | null
          executado_em?: string
          id?: string
          relatorio_agendado_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_relatorios_relatorio_agendado_id_fkey"
            columns: ["relatorio_agendado_id"]
            isOneToOne: false
            referencedRelation: "relatorios_agendados"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          chave_acesso: string | null
          cliente_cnpj: string | null
          cliente_id: string | null
          cliente_nome: string
          created_at: string
          created_by: string
          data_emissao: string
          data_saida: string | null
          empresa_id: string
          id: string
          motivo_cancelamento: string | null
          natureza_operacao: string
          numero: string
          protocolo: string | null
          serie: string
          status: Database["public"]["Enums"]["status_nfe"]
          updated_at: string
          valor_desconto: number | null
          valor_frete: number | null
          valor_icms: number | null
          valor_ipi: number | null
          valor_produtos: number
          valor_seguro: number | null
          valor_total: number
          xml_nfe: string | null
        }
        Insert: {
          chave_acesso?: string | null
          cliente_cnpj?: string | null
          cliente_id?: string | null
          cliente_nome: string
          created_at?: string
          created_by: string
          data_emissao?: string
          data_saida?: string | null
          empresa_id: string
          id?: string
          motivo_cancelamento?: string | null
          natureza_operacao: string
          numero: string
          protocolo?: string | null
          serie?: string
          status?: Database["public"]["Enums"]["status_nfe"]
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_produtos: number
          valor_seguro?: number | null
          valor_total: number
          xml_nfe?: string | null
        }
        Update: {
          chave_acesso?: string | null
          cliente_cnpj?: string | null
          cliente_id?: string | null
          cliente_nome?: string
          created_at?: string
          created_by?: string
          data_emissao?: string
          data_saida?: string | null
          empresa_id?: string
          id?: string
          motivo_cancelamento?: string | null
          natureza_operacao?: string
          numero?: string
          protocolo?: string | null
          serie?: string
          status?: Database["public"]["Enums"]["status_nfe"]
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number
          xml_nfe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      relatorios_agendados: {
        Row: {
          ativo: boolean
          centro_custo_id: string | null
          created_at: string
          created_by: string
          dia_mes: number | null
          dia_semana: number | null
          empresa_id: string | null
          frequencia: string
          hora_execucao: string
          id: string
          nome: string
          proximo_envio: string | null
          tipo_relatorio: string
          ultimo_envio: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          centro_custo_id?: string | null
          created_at?: string
          created_by: string
          dia_mes?: number | null
          dia_semana?: number | null
          empresa_id?: string | null
          frequencia: string
          hora_execucao?: string
          id?: string
          nome: string
          proximo_envio?: string | null
          tipo_relatorio: string
          ultimo_envio?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          centro_custo_id?: string | null
          created_at?: string
          created_by?: string
          dia_mes?: number | null
          dia_semana?: number | null
          empresa_id?: string | null
          frequencia?: string
          hora_execucao?: string
          id?: string
          nome?: string
          proximo_envio?: string | null
          tipo_relatorio?: string
          ultimo_envio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_agendados_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_aprovacao: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          conta_pagar_id: string
          created_at: string
          id: string
          motivo_rejeicao: string | null
          observacoes: string | null
          solicitado_em: string
          solicitado_por: string
          status: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          conta_pagar_id: string
          created_at?: string
          id?: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          solicitado_em?: string
          solicitado_por: string
          status?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          conta_pagar_id?: string
          created_at?: string
          id?: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          solicitado_em?: string
          solicitado_por?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_aprovacao_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_bancarias: {
        Row: {
          conciliada: boolean
          conciliada_em: string | null
          conciliada_por: string | null
          conta_bancaria_id: string
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          saldo: number
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          valor: number
        }
        Insert: {
          conciliada?: boolean
          conciliada_em?: string | null
          conciliada_por?: string | null
          conta_bancaria_id: string
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data: string
          descricao: string
          id?: string
          saldo: number
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          valor: number
        }
        Update: {
          conciliada?: boolean
          conciliada_em?: string | null
          conciliada_por?: string | null
          conta_bancaria_id?: string
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          saldo?: number
          tipo?: Database["public"]["Enums"]["tipo_transacao"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_bancarias_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_bancarias_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_bancarias_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          _action: Database["public"]["Enums"]["audit_action"]
          _details?: string
          _new_data?: Json
          _old_data?: Json
          _record_id?: string
          _table_name?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "financeiro" | "operacional" | "visualizador"
      audit_action:
        | "INSERT"
        | "UPDATE"
        | "DELETE"
        | "LOGIN"
        | "LOGOUT"
        | "EXPORT"
        | "APPROVE"
        | "REJECT"
      etapa_cobranca:
        | "preventiva"
        | "lembrete"
        | "cobranca"
        | "negociacao"
        | "juridico"
      prioridade_alerta: "baixa" | "media" | "alta" | "critica"
      status_nfe:
        | "autorizada"
        | "pendente"
        | "cancelada"
        | "denegada"
        | "inutilizada"
      status_pagamento:
        | "pago"
        | "pendente"
        | "vencido"
        | "parcial"
        | "cancelado"
      tipo_cobranca: "boleto" | "pix" | "cartao" | "transferencia" | "dinheiro"
      tipo_transacao: "receita" | "despesa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "financeiro", "operacional", "visualizador"],
      audit_action: [
        "INSERT",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "EXPORT",
        "APPROVE",
        "REJECT",
      ],
      etapa_cobranca: [
        "preventiva",
        "lembrete",
        "cobranca",
        "negociacao",
        "juridico",
      ],
      prioridade_alerta: ["baixa", "media", "alta", "critica"],
      status_nfe: [
        "autorizada",
        "pendente",
        "cancelada",
        "denegada",
        "inutilizada",
      ],
      status_pagamento: ["pago", "pendente", "vencido", "parcial", "cancelado"],
      tipo_cobranca: ["boleto", "pix", "cartao", "transferencia", "dinheiro"],
      tipo_transacao: ["receita", "despesa"],
    },
  },
} as const
