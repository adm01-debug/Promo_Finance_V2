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
      acordos_parcelamento: {
        Row: {
          cliente_email: string | null
          cliente_id: string | null
          cliente_nome: string
          cliente_telefone: string | null
          contas_receber_ids: string[]
          created_at: string
          created_by: string
          data_primeiro_vencimento: string
          desconto_aplicado: number | null
          dia_vencimento: number
          empresa_id: string
          id: string
          juros_aplicado: number | null
          numero_acordo: string
          numero_parcelas: number
          observacoes: string | null
          status: string
          updated_at: string
          valor_original: number
          valor_parcela: number
          valor_total_acordo: number
        }
        Insert: {
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          contas_receber_ids?: string[]
          created_at?: string
          created_by: string
          data_primeiro_vencimento: string
          desconto_aplicado?: number | null
          dia_vencimento: number
          empresa_id: string
          id?: string
          juros_aplicado?: number | null
          numero_acordo: string
          numero_parcelas: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_original: number
          valor_parcela: number
          valor_total_acordo: number
        }
        Update: {
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          contas_receber_ids?: string[]
          created_at?: string
          created_by?: string
          data_primeiro_vencimento?: string
          desconto_aplicado?: number | null
          dia_vencimento?: number
          empresa_id?: string
          id?: string
          juros_aplicado?: number | null
          numero_acordo?: string
          numero_parcelas?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_original?: number
          valor_parcela?: number
          valor_total_acordo?: number
        }
        Relationships: [
          {
            foreignKeyName: "acordos_parcelamento_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_parcelamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
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
      alertas_preditivos: {
        Row: {
          analise_preditiva_id: string | null
          created_at: string
          data_previsao: string | null
          descricao: string
          id: string
          impacto_estimado: number | null
          prioridade: string
          probabilidade: number | null
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          sugestoes: Json | null
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          analise_preditiva_id?: string | null
          created_at?: string
          data_previsao?: string | null
          descricao: string
          id?: string
          impacto_estimado?: number | null
          prioridade: string
          probabilidade?: number | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          sugestoes?: Json | null
          tipo: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          analise_preditiva_id?: string | null
          created_at?: string
          data_previsao?: string | null
          descricao?: string
          id?: string
          impacto_estimado?: number | null
          prioridade?: string
          probabilidade?: number | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          sugestoes?: Json | null
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_preditivos_analise_preditiva_id_fkey"
            columns: ["analise_preditiva_id"]
            isOneToOne: false
            referencedRelation: "historico_analises_preditivas"
            referencedColumns: ["id"]
          },
        ]
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
      bitrix_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          received_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string
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
      expert_conversations: {
        Row: {
          created_at: string
          id: string
          resumo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resumo?: string | null
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resumo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expert_messages: {
        Row: {
          actions: Json | null
          actions_executed: boolean | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          actions?: Json | null
          actions_executed?: boolean | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          actions?: Json | null
          actions_executed?: boolean | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "expert_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_conciliacao_ia: {
        Row: {
          acao: string
          created_at: string
          created_by: string | null
          id: string
          lancamento_descricao: string | null
          lancamento_entidade: string
          motivo_rejeicao: string | null
          score_original: number
          tipo_lancamento: string
          transacao_descricao: string
        }
        Insert: {
          acao: string
          created_at?: string
          created_by?: string | null
          id?: string
          lancamento_descricao?: string | null
          lancamento_entidade: string
          motivo_rejeicao?: string | null
          score_original: number
          tipo_lancamento: string
          transacao_descricao: string
        }
        Update: {
          acao?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lancamento_descricao?: string | null
          lancamento_entidade?: string
          motivo_rejeicao?: string | null
          score_original?: number
          tipo_lancamento?: string
          transacao_descricao?: string
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
      historico_analises_preditivas: {
        Row: {
          alertas_gerados: number | null
          analise_completa: Json
          created_at: string
          created_by: string | null
          dados_analisados: Json | null
          id: string
          projecoes: Json | null
          resumo_executivo: string | null
          score_saude_financeira: number
        }
        Insert: {
          alertas_gerados?: number | null
          analise_completa: Json
          created_at?: string
          created_by?: string | null
          dados_analisados?: Json | null
          id?: string
          projecoes?: Json | null
          resumo_executivo?: string | null
          score_saude_financeira: number
        }
        Update: {
          alertas_gerados?: number | null
          analise_completa?: Json
          created_at?: string
          created_by?: string | null
          dados_analisados?: Json | null
          id?: string
          projecoes?: Json | null
          resumo_executivo?: string | null
          score_saude_financeira?: number
        }
        Relationships: []
      }
      historico_cobranca: {
        Row: {
          conta_receber_id: string
          created_at: string
          created_by: string | null
          etapa_anterior: string | null
          etapa_nova: string
          id: string
          observacoes: string | null
        }
        Insert: {
          conta_receber_id: string
          created_at?: string
          created_by?: string | null
          etapa_anterior?: string | null
          etapa_nova: string
          id?: string
          observacoes?: string | null
        }
        Update: {
          conta_receber_id?: string
          created_at?: string
          created_by?: string | null
          etapa_anterior?: string | null
          etapa_nova?: string
          id?: string
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_cobranca_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_cobranca_whatsapp: {
        Row: {
          cliente_id: string | null
          conta_receber_id: string
          created_at: string
          created_by: string | null
          entregue_em: string | null
          enviado_em: string | null
          erro_mensagem: string | null
          id: string
          lido_em: string | null
          mensagem: string
          regua_id: string | null
          status: string
          telefone: string
        }
        Insert: {
          cliente_id?: string | null
          conta_receber_id: string
          created_at?: string
          created_by?: string | null
          entregue_em?: string | null
          enviado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          lido_em?: string | null
          mensagem: string
          regua_id?: string | null
          status?: string
          telefone: string
        }
        Update: {
          cliente_id?: string | null
          conta_receber_id?: string
          created_at?: string
          created_by?: string | null
          entregue_em?: string | null
          enviado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          lido_em?: string | null
          mensagem?: string
          regua_id?: string | null
          status?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_cobranca_whatsapp_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_cobranca_whatsapp_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_cobranca_whatsapp_regua_id_fkey"
            columns: ["regua_id"]
            isOneToOne: false
            referencedRelation: "regua_cobranca"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_conciliacao_ia: {
        Row: {
          acao: string
          analise_ia: string | null
          aprovado_por: string | null
          confianca: string
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          id: string
          motivos: Json
          score_ia: number
          tipo_lancamento: string
          transacao_bancaria_id: string | null
        }
        Insert: {
          acao: string
          analise_ia?: string | null
          aprovado_por?: string | null
          confianca: string
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          id?: string
          motivos?: Json
          score_ia: number
          tipo_lancamento: string
          transacao_bancaria_id?: string | null
        }
        Update: {
          acao?: string
          analise_ia?: string | null
          aprovado_por?: string | null
          confianca?: string
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          id?: string
          motivos?: Json
          score_ia?: number
          tipo_lancamento?: string
          transacao_bancaria_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_conciliacao_ia_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_conciliacao_ia_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_conciliacao_ia_transacao_bancaria_id_fkey"
            columns: ["transacao_bancaria_id"]
            isOneToOne: false
            referencedRelation: "transacoes_bancarias"
            referencedColumns: ["id"]
          },
        ]
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
      historico_score_saude: {
        Row: {
          created_at: string
          id: string
          indicadores: Json | null
          observacoes: string | null
          score: number
        }
        Insert: {
          created_at?: string
          id?: string
          indicadores?: Json | null
          observacoes?: string | null
          score: number
        }
        Update: {
          created_at?: string
          id?: string
          indicadores?: Json | null
          observacoes?: string | null
          score?: number
        }
        Relationships: []
      }
      metas_financeiras: {
        Row: {
          ano: number
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          mes: number
          tipo: string
          titulo: string
          updated_at: string
          valor_meta: number
        }
        Insert: {
          ano: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          mes: number
          tipo: string
          titulo: string
          updated_at?: string
          valor_meta?: number
        }
        Update: {
          ano?: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          mes?: number
          tipo?: string
          titulo?: string
          updated_at?: string
          valor_meta?: number
        }
        Relationships: []
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
      open_finance_consents: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          institution_id: string
          permissions: string[]
          refresh_token: string | null
          revoked_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id: string
          institution_id: string
          permissions: string[]
          refresh_token?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          institution_id?: string
          permissions?: string[]
          refresh_token?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pagamentos_recorrentes: {
        Row: {
          ativo: boolean | null
          centro_custo_id: string | null
          conta_bancaria_id: string | null
          created_at: string
          created_by: string
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number
          empresa_id: string
          fornecedor_id: string | null
          fornecedor_nome: string
          frequencia: string
          id: string
          observacoes: string | null
          proxima_geracao: string | null
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"] | null
          total_gerado: number | null
          ultima_geracao: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          centro_custo_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by: string
          data_fim?: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number
          empresa_id: string
          fornecedor_id?: string | null
          fornecedor_nome: string
          frequencia?: string
          id?: string
          observacoes?: string | null
          proxima_geracao?: string | null
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"] | null
          total_gerado?: number | null
          ultima_geracao?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean | null
          centro_custo_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          dia_vencimento?: number
          empresa_id?: string
          fornecedor_id?: string | null
          fornecedor_nome?: string
          frequencia?: string
          id?: string
          observacoes?: string | null
          proxima_geracao?: string | null
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"] | null
          total_gerado?: number | null
          ultima_geracao?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_recorrentes_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas_acordo: {
        Row: {
          acordo_id: string
          conta_receber_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          numero_parcela: number
          status: string
          valor: number
          valor_pago: number | null
        }
        Insert: {
          acordo_id: string
          conta_receber_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          numero_parcela: number
          status?: string
          valor: number
          valor_pago?: number | null
        }
        Update: {
          acordo_id?: string
          conta_receber_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          numero_parcela?: number
          status?: string
          valor?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_acordo_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos_parcelamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcelas_acordo_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_cliente_acessos: {
        Row: {
          acao: string
          cliente_id: string | null
          created_at: string
          detalhes: Json | null
          id: string
          ip_address: string | null
          token_id: string | null
          user_agent: string | null
        }
        Insert: {
          acao: string
          cliente_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          token_id?: string | null
          user_agent?: string | null
        }
        Update: {
          acao?: string
          cliente_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          token_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_cliente_acessos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_cliente_acessos_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "portal_cliente_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_cliente_tokens: {
        Row: {
          ativo: boolean | null
          cliente_id: string | null
          created_at: string
          email_cliente: string
          expires_at: string
          id: string
          token: string
          ultimo_acesso: string | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id?: string | null
          created_at?: string
          email_cliente: string
          expires_at?: string
          id?: string
          token: string
          ultimo_acesso?: string | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string | null
          created_at?: string
          email_cliente?: string
          expires_at?: string
          id?: string
          token?: string
          ultimo_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_cliente_tokens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
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
      push_subscriptions: {
        Row: {
          ativo: boolean
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recomendacoes_metas_ia: {
        Row: {
          aceita: boolean | null
          baseado_em: Json | null
          confianca: number | null
          created_at: string
          id: string
          justificativa: string
          meta_id: string | null
          periodo_referencia_fim: string | null
          periodo_referencia_inicio: string | null
          tipo_meta: string
          valor_sugerido: number
        }
        Insert: {
          aceita?: boolean | null
          baseado_em?: Json | null
          confianca?: number | null
          created_at?: string
          id?: string
          justificativa: string
          meta_id?: string | null
          periodo_referencia_fim?: string | null
          periodo_referencia_inicio?: string | null
          tipo_meta: string
          valor_sugerido: number
        }
        Update: {
          aceita?: boolean | null
          baseado_em?: Json | null
          confianca?: number | null
          created_at?: string
          id?: string
          justificativa?: string
          meta_id?: string | null
          periodo_referencia_fim?: string | null
          periodo_referencia_inicio?: string | null
          tipo_meta?: string
          valor_sugerido?: number
        }
        Relationships: [
          {
            foreignKeyName: "recomendacoes_metas_ia_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      regua_cobranca: {
        Row: {
          ativo: boolean | null
          canal: string
          created_at: string
          created_by: string | null
          descricao: string | null
          dias_antes_vencimento: number | null
          dias_apos_vencimento: number | null
          id: string
          nome: string
          ordem: number
          template_mensagem: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          canal?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          dias_antes_vencimento?: number | null
          dias_apos_vencimento?: number | null
          id?: string
          nome: string
          ordem?: number
          template_mensagem: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          canal?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          dias_antes_vencimento?: number | null
          dias_apos_vencimento?: number | null
          id?: string
          nome?: string
          ordem?: number
          template_mensagem?: string
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
      calcular_proxima_geracao: {
        Args: {
          p_dia_vencimento: number
          p_frequencia: string
          p_ultima_geracao: string
        }
        Returns: string
      }
      confirmar_conciliacao: {
        Args: {
          p_conta_pagar_id?: string
          p_conta_receber_id?: string
          p_transacao_id: string
        }
        Returns: undefined
      }
      delete_cron_job: { Args: { job_id: number }; Returns: undefined }
      gerar_alertas_vencimento: { Args: never; Returns: undefined }
      gerar_contas_recorrentes: { Args: never; Returns: number }
      gerar_numero_acordo: { Args: never; Returns: string }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          database: string
          jobid: number
          jobname: string
          nodename: string
          nodeport: number
          schedule: string
          username: string
        }[]
      }
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
      toggle_cron_job: {
        Args: { is_active: boolean; job_id: number }
        Returns: undefined
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
