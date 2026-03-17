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
      account_lockouts: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          id: string
          last_failed_attempt: string | null
          locked_until: string | null
          lockout_count: number | null
          updated_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_failed_attempt?: string | null
          locked_until?: string | null
          lockout_count?: number | null
          updated_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_failed_attempt?: string | null
          locked_until?: string | null
          lockout_count?: number | null
          updated_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
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
      alertas_tributarios: {
        Row: {
          acao_label: string | null
          acao_url: string | null
          competencia: string | null
          created_at: string
          data_lembrete: string | null
          data_vencimento: string | null
          empresa_id: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          lido: boolean | null
          mensagem: string
          prioridade: string
          resolvido: boolean | null
          resolvido_em: string | null
          resolvido_por: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          acao_label?: string | null
          acao_url?: string | null
          competencia?: string | null
          created_at?: string
          data_lembrete?: string | null
          data_vencimento?: string | null
          empresa_id?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lido?: boolean | null
          mensagem: string
          prioridade?: string
          resolvido?: boolean | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          acao_label?: string | null
          acao_url?: string | null
          competencia?: string | null
          created_at?: string
          data_lembrete?: string | null
          data_vencimento?: string | null
          empresa_id?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          prioridade?: string
          resolvido?: boolean | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      allowed_countries: {
        Row: {
          ativo: boolean | null
          country_code: string
          country_name: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          ativo?: boolean | null
          country_code: string
          country_name: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          ativo?: boolean | null
          country_code?: string
          country_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: []
      }
      allowed_ips: {
        Row: {
          ativo: boolean | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          ip_address: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          ip_address: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          ip_address?: string
          user_id?: string | null
        }
        Relationships: []
      }
      anexos_financeiros: {
        Row: {
          created_at: string
          descricao: string | null
          entidade_id: string
          entidade_tipo: string
          id: string
          nome_arquivo: string
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          updated_at: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          nome_arquivo: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          nome_arquivo?: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      apuracoes_irpj_csll: {
        Row: {
          adicoes_permanentes: number | null
          adicoes_temporarias: number | null
          ano: number
          compensacao_prejuizos: number | null
          created_at: string
          created_by: string | null
          csll_a_pagar: number | null
          csll_aliquota: number | null
          csll_base: number | null
          csll_total: number | null
          csrf_retido: number | null
          data_transmissao: string | null
          empresa_id: string
          estimativas_pagas: number | null
          exclusoes_permanentes: number | null
          exclusoes_temporarias: number | null
          id: string
          irpj_a_pagar: number | null
          irpj_adicional: number | null
          irpj_adicional_base: number | null
          irpj_aliquota_normal: number | null
          irpj_incentivos_deducoes: number | null
          irpj_normal: number | null
          irpj_total: number | null
          irrf_retido: number | null
          lucro_contabil: number | null
          lucro_real: number | null
          lucro_real_antes_compensacao: number | null
          mes: number | null
          numero_recibo: string | null
          saldo_negativo_anterior: number | null
          saldo_negativo_csll: number | null
          saldo_negativo_irpj: number | null
          status: string | null
          tipo_apuracao: string
          total_adicoes: number | null
          total_exclusoes: number | null
          total_tributos: number | null
          trimestre: number | null
          updated_at: string
        }
        Insert: {
          adicoes_permanentes?: number | null
          adicoes_temporarias?: number | null
          ano: number
          compensacao_prejuizos?: number | null
          created_at?: string
          created_by?: string | null
          csll_a_pagar?: number | null
          csll_aliquota?: number | null
          csll_base?: number | null
          csll_total?: number | null
          csrf_retido?: number | null
          data_transmissao?: string | null
          empresa_id: string
          estimativas_pagas?: number | null
          exclusoes_permanentes?: number | null
          exclusoes_temporarias?: number | null
          id?: string
          irpj_a_pagar?: number | null
          irpj_adicional?: number | null
          irpj_adicional_base?: number | null
          irpj_aliquota_normal?: number | null
          irpj_incentivos_deducoes?: number | null
          irpj_normal?: number | null
          irpj_total?: number | null
          irrf_retido?: number | null
          lucro_contabil?: number | null
          lucro_real?: number | null
          lucro_real_antes_compensacao?: number | null
          mes?: number | null
          numero_recibo?: string | null
          saldo_negativo_anterior?: number | null
          saldo_negativo_csll?: number | null
          saldo_negativo_irpj?: number | null
          status?: string | null
          tipo_apuracao: string
          total_adicoes?: number | null
          total_exclusoes?: number | null
          total_tributos?: number | null
          trimestre?: number | null
          updated_at?: string
        }
        Update: {
          adicoes_permanentes?: number | null
          adicoes_temporarias?: number | null
          ano?: number
          compensacao_prejuizos?: number | null
          created_at?: string
          created_by?: string | null
          csll_a_pagar?: number | null
          csll_aliquota?: number | null
          csll_base?: number | null
          csll_total?: number | null
          csrf_retido?: number | null
          data_transmissao?: string | null
          empresa_id?: string
          estimativas_pagas?: number | null
          exclusoes_permanentes?: number | null
          exclusoes_temporarias?: number | null
          id?: string
          irpj_a_pagar?: number | null
          irpj_adicional?: number | null
          irpj_adicional_base?: number | null
          irpj_aliquota_normal?: number | null
          irpj_incentivos_deducoes?: number | null
          irpj_normal?: number | null
          irpj_total?: number | null
          irrf_retido?: number | null
          lucro_contabil?: number | null
          lucro_real?: number | null
          lucro_real_antes_compensacao?: number | null
          mes?: number | null
          numero_recibo?: string | null
          saldo_negativo_anterior?: number | null
          saldo_negativo_csll?: number | null
          saldo_negativo_irpj?: number | null
          status?: string | null
          tipo_apuracao?: string
          total_adicoes?: number | null
          total_exclusoes?: number | null
          total_tributos?: number | null
          trimestre?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apuracoes_irpj_csll_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      apuracoes_tributarias: {
        Row: {
          ano: number
          cbs_a_compensar: number | null
          cbs_a_pagar: number | null
          cbs_creditos: number | null
          cbs_debitos: number | null
          cbs_saldo_anterior: number | null
          cofins_residual: number | null
          competencia: string
          created_at: string
          created_by: string | null
          data_transmissao: string | null
          empresa_id: string
          ibs_a_compensar: number | null
          ibs_a_pagar: number | null
          ibs_creditos: number | null
          ibs_debitos: number | null
          ibs_saldo_anterior: number | null
          icms_residual: number | null
          id: string
          is_a_pagar: number | null
          is_creditos: number | null
          is_debitos: number | null
          iss_residual: number | null
          mes: number
          pis_residual: number | null
          protocolo_transmissao: string | null
          status: string | null
          total_geral: number | null
          total_tributos_novos: number | null
          total_tributos_residuais: number | null
          updated_at: string
        }
        Insert: {
          ano: number
          cbs_a_compensar?: number | null
          cbs_a_pagar?: number | null
          cbs_creditos?: number | null
          cbs_debitos?: number | null
          cbs_saldo_anterior?: number | null
          cofins_residual?: number | null
          competencia: string
          created_at?: string
          created_by?: string | null
          data_transmissao?: string | null
          empresa_id: string
          ibs_a_compensar?: number | null
          ibs_a_pagar?: number | null
          ibs_creditos?: number | null
          ibs_debitos?: number | null
          ibs_saldo_anterior?: number | null
          icms_residual?: number | null
          id?: string
          is_a_pagar?: number | null
          is_creditos?: number | null
          is_debitos?: number | null
          iss_residual?: number | null
          mes: number
          pis_residual?: number | null
          protocolo_transmissao?: string | null
          status?: string | null
          total_geral?: number | null
          total_tributos_novos?: number | null
          total_tributos_residuais?: number | null
          updated_at?: string
        }
        Update: {
          ano?: number
          cbs_a_compensar?: number | null
          cbs_a_pagar?: number | null
          cbs_creditos?: number | null
          cbs_debitos?: number | null
          cbs_saldo_anterior?: number | null
          cofins_residual?: number | null
          competencia?: string
          created_at?: string
          created_by?: string | null
          data_transmissao?: string | null
          empresa_id?: string
          ibs_a_compensar?: number | null
          ibs_a_pagar?: number | null
          ibs_creditos?: number | null
          ibs_debitos?: number | null
          ibs_saldo_anterior?: number | null
          icms_residual?: number | null
          id?: string
          is_a_pagar?: number | null
          is_creditos?: number | null
          is_debitos?: number | null
          iss_residual?: number | null
          mes?: number
          pis_residual?: number | null
          protocolo_transmissao?: string | null
          status?: string | null
          total_geral?: number | null
          total_tributos_novos?: number | null
          total_tributos_residuais?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apuracoes_tributarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_customers: {
        Row: {
          asaas_id: string
          cliente_id: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          empresa_id: string
          endereco: Json | null
          id: string
          nome: string
          sincronizado_em: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          asaas_id: string
          cliente_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id: string
          endereco?: Json | null
          id?: string
          nome: string
          sincronizado_em?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          asaas_id?: string
          cliente_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: Json | null
          id?: string
          nome?: string
          sincronizado_em?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_customers_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_customers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_payments: {
        Row: {
          asaas_customer_id: string | null
          asaas_id: string
          codigo_barras: string | null
          conta_receber_id: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          empresa_id: string
          erro_mensagem: string | null
          id: string
          linha_digitavel: string | null
          link_boleto: string | null
          link_fatura: string | null
          nosso_numero: string | null
          pix_copia_cola: string | null
          pix_qrcode: string | null
          status: string
          tipo: string
          updated_at: string | null
          valor: number
          valor_liquido: number | null
          webhook_payload: Json | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_id: string
          codigo_barras?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          empresa_id: string
          erro_mensagem?: string | null
          id?: string
          linha_digitavel?: string | null
          link_boleto?: string | null
          link_fatura?: string | null
          nosso_numero?: string | null
          pix_copia_cola?: string | null
          pix_qrcode?: string | null
          status?: string
          tipo: string
          updated_at?: string | null
          valor: number
          valor_liquido?: number | null
          webhook_payload?: Json | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_id?: string
          codigo_barras?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          empresa_id?: string
          erro_mensagem?: string | null
          id?: string
          linha_digitavel?: string | null
          link_boleto?: string | null
          link_fatura?: string | null
          nosso_numero?: string | null
          pix_copia_cola?: string | null
          pix_qrcode?: string | null
          status?: string
          tipo?: string
          updated_at?: string | null
          valor?: number
          valor_liquido?: number | null
          webhook_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_payments_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_payments_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_payments_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
      auditoria_financeira: {
        Row: {
          created_at: string
          dados_antigos: Json | null
          dados_novos: Json | null
          id: string
          ip_address: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dados_antigos?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dados_antigos?: Json | null
          dados_novos?: Json | null
          id?: string
          ip_address?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
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
      bling_sync_logs: {
        Row: {
          created_at: string
          created_by: string | null
          detalhes: Json | null
          finalizado_em: string | null
          id: string
          iniciado_em: string
          mensagem_erro: string | null
          modulo: string
          registros_com_erro: number | null
          registros_processados: number | null
          status: string
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detalhes?: Json | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          mensagem_erro?: string | null
          modulo: string
          registros_com_erro?: number | null
          registros_processados?: number | null
          status?: string
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detalhes?: Json | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          mensagem_erro?: string | null
          modulo?: string
          registros_com_erro?: number | null
          registros_processados?: number | null
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      bling_tokens: {
        Row: {
          access_token: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      bling_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          module: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
          received_at: string
          resource_id: string | null
          retries: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          module: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string
          resource_id?: string | null
          retries?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          module?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          received_at?: string
          resource_id?: string | null
          retries?: number | null
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          blocked_until: string | null
          created_at: string | null
          id: string
          ip_address: string
          permanent: boolean | null
          reason: string | null
          unblocked_at: string | null
          unblocked_by: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address: string
          permanent?: boolean | null
          reason?: string | null
          unblocked_at?: string | null
          unblocked_by?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string
          permanent?: boolean | null
          reason?: string | null
          unblocked_at?: string | null
          unblocked_by?: string | null
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
            foreignKeyName: "boletos_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
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
            foreignKeyName: "boletos_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
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
      categorias: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          plano_conta_id: string | null
          tipo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          plano_conta_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          plano_conta_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
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
          {
            foreignKeyName: "centros_custo_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
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
          contato_financeiro_id: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          limite_credito: number | null
          nome_fantasia: string | null
          observacoes: string | null
          ramo_atividade: string | null
          razao_social: string
          score: number | null
          telefone: string | null
          tipo: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          ativo?: boolean
          bitrix_id?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          contato_financeiro_id?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          limite_credito?: number | null
          nome_fantasia?: string | null
          observacoes?: string | null
          ramo_atividade?: string | null
          razao_social: string
          score?: number | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          ativo?: boolean
          bitrix_id?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          contato_financeiro_id?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          limite_credito?: number | null
          nome_fantasia?: string | null
          observacoes?: string | null
          ramo_atividade?: string | null
          razao_social?: string
          score?: number | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_contato_financeiro_id_fkey"
            columns: ["contato_financeiro_id"]
            isOneToOne: false
            referencedRelation: "contatos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacoes: {
        Row: {
          conta_bancaria_id: string
          created_at: string
          diferenca: number | null
          empresa_id: string | null
          finalizada_em: string | null
          finalizada_por: string | null
          id: string
          periodo_fim: string
          periodo_inicio: string
          saldo_banco: number
          saldo_sistema: number
          status: string | null
          total_conciliados: number | null
          total_pendentes: number | null
          updated_at: string
        }
        Insert: {
          conta_bancaria_id: string
          created_at?: string
          diferenca?: number | null
          empresa_id?: string | null
          finalizada_em?: string | null
          finalizada_por?: string | null
          id?: string
          periodo_fim: string
          periodo_inicio: string
          saldo_banco?: number
          saldo_sistema?: number
          status?: string | null
          total_conciliados?: number | null
          total_pendentes?: number | null
          updated_at?: string
        }
        Update: {
          conta_bancaria_id?: string
          created_at?: string
          diferenca?: number | null
          empresa_id?: string | null
          finalizada_em?: string | null
          finalizada_por?: string | null
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          saldo_banco?: number
          saldo_sistema?: number
          status?: string | null
          total_conciliados?: number | null
          total_pendentes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacoes_parciais: {
        Row: {
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          observacoes: string | null
          transacao_bancaria_id: string
          valor_parcial: number
        }
        Insert: {
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          observacoes?: string | null
          transacao_bancaria_id: string
          valor_parcial: number
        }
        Update: {
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          observacoes?: string | null
          transacao_bancaria_id?: string
          valor_parcial?: number
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_parciais_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_parciais_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_parciais_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_parciais_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_parciais_transacao_bancaria_id_fkey"
            columns: ["transacao_bancaria_id"]
            isOneToOne: false
            referencedRelation: "transacoes_bancarias"
            referencedColumns: ["id"]
          },
        ]
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
          nome: string | null
          saldo_atual: number
          saldo_disponivel: number
          saldo_inicial: number | null
          tipo: string | null
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
          nome?: string | null
          saldo_atual?: number
          saldo_disponivel?: number
          saldo_inicial?: number | null
          tipo?: string | null
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
          nome?: string | null
          saldo_atual?: number
          saldo_disponivel?: number
          saldo_inicial?: number | null
          tipo?: string | null
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
          categoria: string | null
          centro_custo_id: string | null
          codigo_barras: string | null
          conta_bancaria_id: string | null
          contato_id: string | null
          created_at: string
          created_by: string
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento: string | null
          forma_pagamento_id: string | null
          fornecedor_id: string | null
          fornecedor_nome: string
          frequencia_recorrencia: string | null
          id: string
          numero_documento: string | null
          numero_parcela_atual: number | null
          observacoes: string | null
          parcela_atual: number | null
          plano_conta_id: string | null
          recorrente: boolean
          status: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"]
          total_parcelas: number | null
          updated_at: string
          user_id: string | null
          valor: number
          valor_desconto: number | null
          valor_final: number | null
          valor_juros: number | null
          valor_multa: number | null
          valor_original: number | null
          valor_pago: number | null
          vencimento: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          bitrix_deal_id?: string | null
          categoria?: string | null
          centro_custo_id?: string | null
          codigo_barras?: string | null
          conta_bancaria_id?: string | null
          contato_id?: string | null
          created_at?: string
          created_by: string
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento?: string | null
          forma_pagamento_id?: string | null
          fornecedor_id?: string | null
          fornecedor_nome: string
          frequencia_recorrencia?: string | null
          id?: string
          numero_documento?: string | null
          numero_parcela_atual?: number | null
          observacoes?: string | null
          parcela_atual?: number | null
          plano_conta_id?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          total_parcelas?: number | null
          updated_at?: string
          user_id?: string | null
          valor: number
          valor_desconto?: number | null
          valor_final?: number | null
          valor_juros?: number | null
          valor_multa?: number | null
          valor_original?: number | null
          valor_pago?: number | null
          vencimento?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          bitrix_deal_id?: string | null
          categoria?: string | null
          centro_custo_id?: string | null
          codigo_barras?: string | null
          conta_bancaria_id?: string | null
          contato_id?: string | null
          created_at?: string
          created_by?: string
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: string | null
          forma_pagamento_id?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string
          frequencia_recorrencia?: string | null
          id?: string
          numero_documento?: string | null
          numero_parcela_atual?: number | null
          observacoes?: string | null
          parcela_atual?: number | null
          plano_conta_id?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          total_parcelas?: number | null
          updated_at?: string
          user_id?: string | null
          valor?: number
          valor_desconto?: number | null
          valor_final?: number | null
          valor_juros?: number | null
          valor_multa?: number | null
          valor_original?: number | null
          valor_pago?: number | null
          vencimento?: string | null
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
            foreignKeyName: "contas_pagar_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
          },
          {
            foreignKeyName: "contas_pagar_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_financeiros"
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
            foreignKeyName: "contas_pagar_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          bitrix_deal_id: string | null
          categoria: string | null
          centro_custo_id: string | null
          chave_pix: string | null
          cliente_id: string | null
          cliente_nome: string
          codigo_barras: string | null
          conta_bancaria_id: string | null
          contato_id: string | null
          created_at: string
          created_by: string
          data_emissao: string
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          etapa_cobranca: Database["public"]["Enums"]["etapa_cobranca"] | null
          forma_pagamento_id: string | null
          forma_recebimento: string | null
          frequencia_recorrencia: string | null
          id: string
          link_boleto: string | null
          numero_documento: string | null
          numero_parcela_atual: number | null
          observacoes: string | null
          parcela_atual: number | null
          plano_conta_id: string | null
          recorrente: boolean | null
          status: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"]
          total_parcelas: number | null
          updated_at: string
          user_id: string | null
          valor: number
          valor_desconto: number | null
          valor_final: number | null
          valor_juros: number | null
          valor_multa: number | null
          valor_original: number | null
          valor_pago: number | null
          valor_recebido: number | null
          vencimento: string | null
          vendedor_id: string | null
        }
        Insert: {
          bitrix_deal_id?: string | null
          categoria?: string | null
          centro_custo_id?: string | null
          chave_pix?: string | null
          cliente_id?: string | null
          cliente_nome: string
          codigo_barras?: string | null
          conta_bancaria_id?: string | null
          contato_id?: string | null
          created_at?: string
          created_by: string
          data_emissao?: string
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          etapa_cobranca?: Database["public"]["Enums"]["etapa_cobranca"] | null
          forma_pagamento_id?: string | null
          forma_recebimento?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          link_boleto?: string | null
          numero_documento?: string | null
          numero_parcela_atual?: number | null
          observacoes?: string | null
          parcela_atual?: number | null
          plano_conta_id?: string | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          total_parcelas?: number | null
          updated_at?: string
          user_id?: string | null
          valor: number
          valor_desconto?: number | null
          valor_final?: number | null
          valor_juros?: number | null
          valor_multa?: number | null
          valor_original?: number | null
          valor_pago?: number | null
          valor_recebido?: number | null
          vencimento?: string | null
          vendedor_id?: string | null
        }
        Update: {
          bitrix_deal_id?: string | null
          categoria?: string | null
          centro_custo_id?: string | null
          chave_pix?: string | null
          cliente_id?: string | null
          cliente_nome?: string
          codigo_barras?: string | null
          conta_bancaria_id?: string | null
          contato_id?: string | null
          created_at?: string
          created_by?: string
          data_emissao?: string
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          etapa_cobranca?: Database["public"]["Enums"]["etapa_cobranca"] | null
          forma_pagamento_id?: string | null
          forma_recebimento?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          link_boleto?: string | null
          numero_documento?: string | null
          numero_parcela_atual?: number | null
          observacoes?: string | null
          parcela_atual?: number | null
          plano_conta_id?: string | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          total_parcelas?: number | null
          updated_at?: string
          user_id?: string | null
          valor?: number
          valor_desconto?: number | null
          valor_final?: number | null
          valor_juros?: number | null
          valor_multa?: number | null
          valor_original?: number | null
          valor_pago?: number | null
          valor_recebido?: number | null
          vencimento?: string | null
          vendedor_id?: string | null
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
            foreignKeyName: "contas_receber_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
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
            foreignKeyName: "contas_receber_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_financeiros: {
        Row: {
          ativo: boolean
          cargo: string | null
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          departamento: string | null
          email: string | null
          empresa: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          departamento?: string | null
          email?: string | null
          empresa?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          departamento?: string | null
          email?: string | null
          empresa?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_financeiros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          arquivo_url: string | null
          cliente_id: string | null
          created_at: string
          created_by: string
          data_fim: string | null
          data_inicio: string
          data_renovacao: string | null
          descricao: string
          dias_aviso_renovacao: number | null
          empresa_id: string | null
          fornecedor_id: string | null
          id: string
          numero_contrato: string | null
          observacoes: string | null
          renovacao_automatica: boolean | null
          status: string
          tipo: string
          updated_at: string
          valor_mensal: number | null
          valor_total: number | null
        }
        Insert: {
          arquivo_url?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by: string
          data_fim?: string | null
          data_inicio: string
          data_renovacao?: string | null
          descricao: string
          dias_aviso_renovacao?: number | null
          empresa_id?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_contrato?: string | null
          observacoes?: string | null
          renovacao_automatica?: boolean | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_mensal?: number | null
          valor_total?: number | null
        }
        Update: {
          arquivo_url?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string
          data_fim?: string | null
          data_inicio?: string
          data_renovacao?: string | null
          descricao?: string
          dias_aviso_renovacao?: number | null
          empresa_id?: string | null
          fornecedor_id?: string | null
          id?: string
          numero_contrato?: string | null
          observacoes?: string | null
          renovacao_automatica?: boolean | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_mensal?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      creditos_tributarios: {
        Row: {
          aliquota: number
          apuracao_id: string | null
          competencia_origem: string
          competencia_utilizacao: string | null
          created_at: string
          created_by: string | null
          data_origem: string
          documento_chave: string | null
          documento_numero: string | null
          documento_serie: string | null
          documento_tipo: string | null
          empresa_id: string
          fornecedor_cnpj: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string
          nota_fiscal_id: string | null
          observacoes: string | null
          saldo_disponivel: number | null
          status: string | null
          tipo_credito: string
          tipo_tributo: string
          updated_at: string
          valor_base: number
          valor_credito: number
          valor_utilizado: number | null
        }
        Insert: {
          aliquota: number
          apuracao_id?: string | null
          competencia_origem: string
          competencia_utilizacao?: string | null
          created_at?: string
          created_by?: string | null
          data_origem: string
          documento_chave?: string | null
          documento_numero?: string | null
          documento_serie?: string | null
          documento_tipo?: string | null
          empresa_id: string
          fornecedor_cnpj?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          nota_fiscal_id?: string | null
          observacoes?: string | null
          saldo_disponivel?: number | null
          status?: string | null
          tipo_credito: string
          tipo_tributo: string
          updated_at?: string
          valor_base: number
          valor_credito: number
          valor_utilizado?: number | null
        }
        Update: {
          aliquota?: number
          apuracao_id?: string | null
          competencia_origem?: string
          competencia_utilizacao?: string | null
          created_at?: string
          created_by?: string | null
          data_origem?: string
          documento_chave?: string | null
          documento_numero?: string | null
          documento_serie?: string | null
          documento_tipo?: string | null
          empresa_id?: string
          fornecedor_cnpj?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          nota_fiscal_id?: string | null
          observacoes?: string | null
          saldo_disponivel?: number | null
          status?: string | null
          tipo_credito?: string
          tipo_tributo?: string
          updated_at?: string
          valor_base?: number
          valor_credito?: number
          valor_utilizado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creditos_tributarios_apuracao_id_fkey"
            columns: ["apuracao_id"]
            isOneToOne: false
            referencedRelation: "apuracoes_tributarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_tributarios_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_tributarios_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      darfs: {
        Row: {
          codigo_barras: string | null
          codigo_receita: string
          competencia: string
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao_receita: string
          empresa_id: string
          id: string
          linha_digitavel: string | null
          retencoes_ids: string[] | null
          status: string | null
          updated_at: string
          valor_juros: number | null
          valor_multa: number | null
          valor_principal: number
          valor_total: number
        }
        Insert: {
          codigo_barras?: string | null
          codigo_receita: string
          competencia: string
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao_receita: string
          empresa_id: string
          id?: string
          linha_digitavel?: string | null
          retencoes_ids?: string[] | null
          status?: string | null
          updated_at?: string
          valor_juros?: number | null
          valor_multa?: number | null
          valor_principal: number
          valor_total: number
        }
        Update: {
          codigo_barras?: string | null
          codigo_receita?: string
          competencia?: string
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao_receita?: string
          empresa_id?: string
          id?: string
          linha_digitavel?: string | null
          retencoes_ids?: string[] | null
          status?: string | null
          updated_at?: string
          valor_juros?: number | null
          valor_multa?: number | null
          valor_principal?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "darfs_empresa_id_fkey"
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
          regime_tributario: string | null
          telefone: string | null
          tipo_pessoa: string | null
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
          regime_tributario?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
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
          regime_tributario?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      execucoes_cobranca: {
        Row: {
          canal: string
          cliente_id: string | null
          cliente_nome: string | null
          conta_receber_id: string | null
          created_at: string
          destinatario: string | null
          empresa_id: string | null
          entregue: boolean | null
          entregue_em: string | null
          erro_mensagem: string | null
          etapa: string
          fila_id: string | null
          id: string
          lido: boolean | null
          lido_em: string | null
          mensagem: string | null
          provider: string | null
          provider_message_id: string | null
          respondido: boolean | null
          resposta: string | null
          status: string
          updated_at: string
        }
        Insert: {
          canal: string
          cliente_id?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string
          destinatario?: string | null
          empresa_id?: string | null
          entregue?: boolean | null
          entregue_em?: string | null
          erro_mensagem?: string | null
          etapa: string
          fila_id?: string | null
          id?: string
          lido?: boolean | null
          lido_em?: string | null
          mensagem?: string | null
          provider?: string | null
          provider_message_id?: string | null
          respondido?: boolean | null
          resposta?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          canal?: string
          cliente_id?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string
          destinatario?: string | null
          empresa_id?: string | null
          entregue?: boolean | null
          entregue_em?: string | null
          erro_mensagem?: string | null
          etapa?: string
          fila_id?: string | null
          id?: string
          lido?: boolean | null
          lido_em?: string | null
          mensagem?: string | null
          provider?: string | null
          provider_message_id?: string | null
          respondido?: boolean | null
          resposta?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_cobranca_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_fila_id_fkey"
            columns: ["fila_id"]
            isOneToOne: false
            referencedRelation: "fila_cobrancas"
            referencedColumns: ["id"]
          },
        ]
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
      extrato_bancario: {
        Row: {
          categoria: string | null
          conciliado: boolean | null
          conta_bancaria_id: string
          created_at: string
          data: string
          descricao: string
          empresa_id: string | null
          hash_transacao: string | null
          id: string
          importado_de: string | null
          numero_documento: string | null
          observacoes: string | null
          saldo: number | null
          tipo: string
          transacao_bancaria_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          conciliado?: boolean | null
          conta_bancaria_id: string
          created_at?: string
          data: string
          descricao: string
          empresa_id?: string | null
          hash_transacao?: string | null
          id?: string
          importado_de?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          saldo?: number | null
          tipo: string
          transacao_bancaria_id?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          conciliado?: boolean | null
          conta_bancaria_id?: string
          created_at?: string
          data?: string
          descricao?: string
          empresa_id?: string | null
          hash_transacao?: string | null
          id?: string
          importado_de?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          saldo?: number | null
          tipo?: string
          transacao_bancaria_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "extrato_bancario_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_bancario_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_bancario_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_bancario_transacao_bancaria_id_fkey"
            columns: ["transacao_bancaria_id"]
            isOneToOne: false
            referencedRelation: "transacoes_bancarias"
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
      fila_cobrancas: {
        Row: {
          agendado_para: string | null
          canal: string
          cliente_id: string | null
          cliente_nome: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          destinatario: string | null
          empresa_id: string | null
          erro_mensagem: string | null
          etapa: string
          id: string
          max_tentativas: number | null
          mensagem_renderizada: string | null
          prioridade: number | null
          processado_em: string | null
          processado_por: string | null
          proxima_tentativa: string | null
          status: string
          template_id: string | null
          tentativas: number | null
          updated_at: string
        }
        Insert: {
          agendado_para?: string | null
          canal: string
          cliente_id?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          destinatario?: string | null
          empresa_id?: string | null
          erro_mensagem?: string | null
          etapa: string
          id?: string
          max_tentativas?: number | null
          mensagem_renderizada?: string | null
          prioridade?: number | null
          processado_em?: string | null
          processado_por?: string | null
          proxima_tentativa?: string | null
          status?: string
          template_id?: string | null
          tentativas?: number | null
          updated_at?: string
        }
        Update: {
          agendado_para?: string | null
          canal?: string
          cliente_id?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          destinatario?: string | null
          empresa_id?: string | null
          erro_mensagem?: string | null
          etapa?: string
          id?: string
          max_tentativas?: number | null
          mensagem_renderizada?: string | null
          prioridade?: number | null
          processado_em?: string | null
          processado_por?: string | null
          proxima_tentativa?: string | null
          status?: string
          template_id?: string | null
          tentativas?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fila_cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_cobrancas_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_cobrancas_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_cobrancas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_cobrancas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates_cobranca"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          codigo: string | null
          created_at: string
          dias_compensacao: number | null
          icone: string | null
          id: string
          nome: string
          requer_dados_bancarios: boolean | null
          taxa_percentual: number | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          dias_compensacao?: number | null
          icone?: string | null
          id?: string
          nome: string
          requer_dados_bancarios?: boolean | null
          taxa_percentual?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          dias_compensacao?: number | null
          icone?: string | null
          id?: string
          nome?: string
          requer_dados_bancarios?: boolean | null
          taxa_percentual?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string | null
          categoria: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          cnpj_cpf: string | null
          conta: string | null
          contato: string | null
          contato_financeiro_id: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string | null
          nome_fantasia: string | null
          observacoes: string | null
          pix: string | null
          razao_social: string
          score: number | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          cnpj_cpf?: string | null
          conta?: string | null
          contato?: string | null
          contato_financeiro_id?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          pix?: string | null
          razao_social: string
          score?: number | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          cnpj_cpf?: string | null
          conta?: string | null
          contato?: string | null
          contato_financeiro_id?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          pix?: string | null
          razao_social?: string
          score?: number | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_contato_financeiro_id_fkey"
            columns: ["contato_financeiro_id"]
            isOneToOne: false
            referencedRelation: "contatos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "historico_cobranca_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
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
            foreignKeyName: "historico_cobranca_whatsapp_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
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
            foreignKeyName: "historico_conciliacao_ia_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
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
            foreignKeyName: "historico_conciliacao_ia_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
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
      incentivos_fiscais: {
        Row: {
          ano_fim: number | null
          ano_inicio: number
          ativo: boolean | null
          ato_concessorio: string | null
          created_at: string
          empresa_id: string
          id: string
          limite_percentual: number | null
          limite_valor: number | null
          nome: string
          numero_processo: string | null
          tipo_incentivo: string
          updated_at: string
          valor_utilizado_ano: number | null
        }
        Insert: {
          ano_fim?: number | null
          ano_inicio: number
          ativo?: boolean | null
          ato_concessorio?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          limite_percentual?: number | null
          limite_valor?: number | null
          nome: string
          numero_processo?: string | null
          tipo_incentivo: string
          updated_at?: string
          valor_utilizado_ano?: number | null
        }
        Update: {
          ano_fim?: number | null
          ano_inicio?: number
          ativo?: boolean | null
          ato_concessorio?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          limite_percentual?: number | null
          limite_valor?: number | null
          nome?: string
          numero_processo?: string | null
          tipo_incentivo?: string
          updated_at?: string
          valor_utilizado_ano?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      known_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string
          device_type: string | null
          first_seen_at: string
          id: string
          ip_address: string | null
          is_trusted: boolean | null
          last_seen_at: string
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_seen_at?: string
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_seen_at?: string
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lalur_lancamentos: {
        Row: {
          apuracao_id: string | null
          codigo_lancamento: string | null
          conta_contabil: string | null
          created_at: string
          data_realizacao: string | null
          descricao: string
          documento_suporte: string | null
          empresa_id: string
          historico: string | null
          id: string
          natureza: string
          saldo_parte_b: number | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          apuracao_id?: string | null
          codigo_lancamento?: string | null
          conta_contabil?: string | null
          created_at?: string
          data_realizacao?: string | null
          descricao: string
          documento_suporte?: string | null
          empresa_id: string
          historico?: string | null
          id?: string
          natureza: string
          saldo_parte_b?: number | null
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          apuracao_id?: string | null
          codigo_lancamento?: string | null
          conta_contabil?: string | null
          created_at?: string
          data_realizacao?: string | null
          descricao?: string
          documento_suporte?: string | null
          empresa_id?: string
          historico?: string | null
          id?: string
          natureza?: string
          saldo_parte_b?: number | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lalur_lancamentos_apuracao_id_fkey"
            columns: ["apuracao_id"]
            isOneToOne: false
            referencedRelation: "apuracoes_irpj_csll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lalur_lancamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          blocked_reason: string | null
          created_at: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_email: string
        }
        Insert: {
          blocked_reason?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          success: boolean
          user_agent?: string | null
          user_email: string
        }
        Update: {
          blocked_reason?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_email?: string
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
      movimentacoes: {
        Row: {
          categoria_id: string | null
          centro_custo_id: string | null
          conciliada: boolean | null
          conciliada_em: string | null
          conciliada_por: string | null
          conta_bancaria_id: string | null
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          data_competencia: string | null
          data_movimentacao: string
          deleted_at: string | null
          descricao: string
          empresa_id: string | null
          estornada: boolean | null
          estornada_em: string | null
          forma_pagamento_id: string | null
          id: string
          movimentacao_estorno_id: string | null
          numero_documento: string | null
          observacoes: string | null
          origem: string | null
          tipo: string
          transferencia_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          conciliada?: boolean | null
          conciliada_em?: string | null
          conciliada_por?: string | null
          conta_bancaria_id?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data_competencia?: string | null
          data_movimentacao?: string
          deleted_at?: string | null
          descricao: string
          empresa_id?: string | null
          estornada?: boolean | null
          estornada_em?: string | null
          forma_pagamento_id?: string | null
          id?: string
          movimentacao_estorno_id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          origem?: string | null
          tipo: string
          transferencia_id?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          conciliada?: boolean | null
          conciliada_em?: string | null
          conciliada_por?: string | null
          conta_bancaria_id?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data_competencia?: string | null
          data_movimentacao?: string
          deleted_at?: string | null
          descricao?: string
          empresa_id?: string | null
          estornada?: boolean | null
          estornada_em?: string | null
          forma_pagamento_id?: string | null
          id?: string
          movimentacao_estorno_id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          origem?: string | null
          tipo?: string
          transferencia_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
          },
          {
            foreignKeyName: "movimentacoes_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      negativacoes: {
        Row: {
          bureau: string
          cliente_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          data_exclusao: string | null
          data_inclusao: string | null
          empresa_id: string | null
          id: string
          motivo: string | null
          observacoes: string | null
          protocolo: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          bureau: string
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data_exclusao?: string | null
          data_inclusao?: string | null
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          protocolo?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          bureau?: string
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data_exclusao?: string | null
          data_inclusao?: string | null
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          protocolo?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "negativacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negativacoes_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negativacoes_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negativacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      new_device_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          created_at: string
          device_id: string | null
          id: string
          ip_address: string | null
          seen_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: string | null
          seen_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: string | null
          seen_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "new_device_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "known_devices"
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
      operacoes_tributaveis: {
        Row: {
          apuracao_id: string | null
          base_calculo: number
          cbs_aliquota: number | null
          cbs_credito: number | null
          cbs_valor: number | null
          cest: string | null
          cfop: string | null
          cliente_id: string | null
          cnpj_cpf_contraparte: string | null
          cofins_aliquota: number | null
          cofins_valor: number | null
          competencia: string
          created_at: string
          created_by: string | null
          data_operacao: string
          documento_chave: string | null
          documento_numero: string | null
          documento_serie: string | null
          documento_tipo: string
          empresa_id: string
          erro_mensagem: string | null
          fornecedor_id: string | null
          ibs_aliquota: number | null
          ibs_credito: number | null
          ibs_valor: number | null
          icms_aliquota: number | null
          icms_valor: number | null
          id: string
          is_aliquota: number | null
          is_categoria: string | null
          is_valor: number | null
          isento: boolean | null
          iss_aliquota: number | null
          iss_valor: number | null
          motivo_isencao: string | null
          municipio_destino: string | null
          municipio_origem: string | null
          ncm: string | null
          nome_contraparte: string | null
          nota_fiscal_id: string | null
          pis_aliquota: number | null
          pis_valor: number | null
          reducao_aliquota: number | null
          regime_especial: string | null
          split_payment: boolean | null
          split_payment_valor: number | null
          status: string | null
          tipo_operacao: string
          uf_destino: string | null
          uf_origem: string | null
          updated_at: string
          valor_desconto: number | null
          valor_frete: number | null
          valor_operacao: number
          valor_outros: number | null
          valor_seguro: number | null
        }
        Insert: {
          apuracao_id?: string | null
          base_calculo: number
          cbs_aliquota?: number | null
          cbs_credito?: number | null
          cbs_valor?: number | null
          cest?: string | null
          cfop?: string | null
          cliente_id?: string | null
          cnpj_cpf_contraparte?: string | null
          cofins_aliquota?: number | null
          cofins_valor?: number | null
          competencia: string
          created_at?: string
          created_by?: string | null
          data_operacao: string
          documento_chave?: string | null
          documento_numero?: string | null
          documento_serie?: string | null
          documento_tipo: string
          empresa_id: string
          erro_mensagem?: string | null
          fornecedor_id?: string | null
          ibs_aliquota?: number | null
          ibs_credito?: number | null
          ibs_valor?: number | null
          icms_aliquota?: number | null
          icms_valor?: number | null
          id?: string
          is_aliquota?: number | null
          is_categoria?: string | null
          is_valor?: number | null
          isento?: boolean | null
          iss_aliquota?: number | null
          iss_valor?: number | null
          motivo_isencao?: string | null
          municipio_destino?: string | null
          municipio_origem?: string | null
          ncm?: string | null
          nome_contraparte?: string | null
          nota_fiscal_id?: string | null
          pis_aliquota?: number | null
          pis_valor?: number | null
          reducao_aliquota?: number | null
          regime_especial?: string | null
          split_payment?: boolean | null
          split_payment_valor?: number | null
          status?: string | null
          tipo_operacao: string
          uf_destino?: string | null
          uf_origem?: string | null
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_operacao: number
          valor_outros?: number | null
          valor_seguro?: number | null
        }
        Update: {
          apuracao_id?: string | null
          base_calculo?: number
          cbs_aliquota?: number | null
          cbs_credito?: number | null
          cbs_valor?: number | null
          cest?: string | null
          cfop?: string | null
          cliente_id?: string | null
          cnpj_cpf_contraparte?: string | null
          cofins_aliquota?: number | null
          cofins_valor?: number | null
          competencia?: string
          created_at?: string
          created_by?: string | null
          data_operacao?: string
          documento_chave?: string | null
          documento_numero?: string | null
          documento_serie?: string | null
          documento_tipo?: string
          empresa_id?: string
          erro_mensagem?: string | null
          fornecedor_id?: string | null
          ibs_aliquota?: number | null
          ibs_credito?: number | null
          ibs_valor?: number | null
          icms_aliquota?: number | null
          icms_valor?: number | null
          id?: string
          is_aliquota?: number | null
          is_categoria?: string | null
          is_valor?: number | null
          isento?: boolean | null
          iss_aliquota?: number | null
          iss_valor?: number | null
          motivo_isencao?: string | null
          municipio_destino?: string | null
          municipio_origem?: string | null
          ncm?: string | null
          nome_contraparte?: string | null
          nota_fiscal_id?: string | null
          pis_aliquota?: number | null
          pis_valor?: number | null
          reducao_aliquota?: number | null
          regime_especial?: string | null
          split_payment?: boolean | null
          split_payment_valor?: number | null
          status?: string | null
          tipo_operacao?: string
          uf_destino?: string | null
          uf_origem?: string | null
          updated_at?: string
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_operacao?: number
          valor_outros?: number | null
          valor_seguro?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operacoes_tributaveis_apuracao_id_fkey"
            columns: ["apuracao_id"]
            isOneToOne: false
            referencedRelation: "apuracoes_tributarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "pagamentos_recorrentes_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
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
          {
            foreignKeyName: "parcelas_acordo_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          id: string
          motivo_rejeicao: string | null
          solicitado_em: string
          status: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          id?: string
          motivo_rejeicao?: string | null
          solicitado_em?: string
          status?: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          id?: string
          motivo_rejeicao?: string | null
          solicitado_em?: string
          status?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      per_dcomp: {
        Row: {
          competencia_destino: string | null
          competencia_origem: string
          created_at: string
          created_by: string | null
          creditos_ids: string[] | null
          data_decisao: string | null
          data_protocolo: string | null
          data_transmissao: string | null
          empresa_id: string
          fundamentacao_legal: string | null
          id: string
          justificativa: string | null
          numero_processo: string | null
          numero_recibo: string | null
          observacoes: string | null
          prazo_recurso: string | null
          status: string | null
          tipo: string
          tipo_credito_origem: string
          tributo_destino: string | null
          tributo_origem: string
          updated_at: string
          valor_atualizado: number | null
          valor_compensado: number | null
          valor_original: number
        }
        Insert: {
          competencia_destino?: string | null
          competencia_origem: string
          created_at?: string
          created_by?: string | null
          creditos_ids?: string[] | null
          data_decisao?: string | null
          data_protocolo?: string | null
          data_transmissao?: string | null
          empresa_id: string
          fundamentacao_legal?: string | null
          id?: string
          justificativa?: string | null
          numero_processo?: string | null
          numero_recibo?: string | null
          observacoes?: string | null
          prazo_recurso?: string | null
          status?: string | null
          tipo: string
          tipo_credito_origem: string
          tributo_destino?: string | null
          tributo_origem: string
          updated_at?: string
          valor_atualizado?: number | null
          valor_compensado?: number | null
          valor_original: number
        }
        Update: {
          competencia_destino?: string | null
          competencia_origem?: string
          created_at?: string
          created_by?: string | null
          creditos_ids?: string[] | null
          data_decisao?: string | null
          data_protocolo?: string | null
          data_transmissao?: string | null
          empresa_id?: string
          fundamentacao_legal?: string | null
          id?: string
          justificativa?: string | null
          numero_processo?: string | null
          numero_recibo?: string | null
          observacoes?: string | null
          prazo_recurso?: string | null
          status?: string | null
          tipo?: string
          tipo_credito_origem?: string
          tributo_destino?: string | null
          tributo_origem?: string
          updated_at?: string
          valor_atualizado?: number | null
          valor_compensado?: number | null
          valor_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "per_dcomp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      plano_contas: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string
          descricao: string
          id: string
          natureza: string
          nivel: number
          parent_id: string | null
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          natureza: string
          nivel?: number
          parent_id?: string | null
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          natureza?: string
          nivel?: number
          parent_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      ponto_departamentos: {
        Row: {
          cargo: string | null
          codigo_firebird: number | null
          created_at: string | null
          id: number
          nome: string | null
          responsavel: string | null
          updated_at: string | null
        }
        Insert: {
          cargo?: string | null
          codigo_firebird?: number | null
          created_at?: string | null
          id?: number
          nome?: string | null
          responsavel?: string | null
          updated_at?: string | null
        }
        Update: {
          cargo?: string | null
          codigo_firebird?: number | null
          created_at?: string | null
          id?: number
          nome?: string | null
          responsavel?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ponto_funcionarios: {
        Row: {
          celular: string | null
          codigo_firebird: number | null
          cpf: string | null
          cracha: string | null
          created_at: string | null
          data_admissao: string | null
          data_desligamento: string | null
          data_nascimento: string | null
          departamento_id: number | null
          email: string | null
          empresa_codigo: number | null
          funcao: string | null
          id: number
          matricula: string | null
          nome: string | null
          pis: string | null
          rg: string | null
          situacao: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          celular?: string | null
          codigo_firebird?: number | null
          cpf?: string | null
          cracha?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          data_nascimento?: string | null
          departamento_id?: number | null
          email?: string | null
          empresa_codigo?: number | null
          funcao?: string | null
          id?: number
          matricula?: string | null
          nome?: string | null
          pis?: string | null
          rg?: string | null
          situacao?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          celular?: string | null
          codigo_firebird?: number | null
          cpf?: string | null
          cracha?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          data_nascimento?: string | null
          departamento_id?: number | null
          email?: string | null
          empresa_codigo?: number | null
          funcao?: string | null
          id?: number
          matricula?: string | null
          nome?: string | null
          pis?: string | null
          rg?: string | null
          situacao?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ponto_funcionarios_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "ponto_departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      ponto_registros: {
        Row: {
          abono: string | null
          abono_negativo: string | null
          codigo_firebird: number | null
          created_at: string | null
          dados_brutos: Json | null
          data_batida: string | null
          entrada_1: string | null
          entrada_2: string | null
          entrada_3: string | null
          entrada_4: string | null
          entrada_5: string | null
          entrada_6: string | null
          folga: number | null
          funcionario_id: number | null
          horario_codigo: number | null
          id: number
          justificativa_abono: number | null
          neutro: number | null
          observacoes: Json | null
          saida_1: string | null
          saida_2: string | null
          saida_3: string | null
          saida_4: string | null
          saida_5: string | null
          saida_6: string | null
          sincronizado_em: string | null
          updated_at: string | null
        }
        Insert: {
          abono?: string | null
          abono_negativo?: string | null
          codigo_firebird?: number | null
          created_at?: string | null
          dados_brutos?: Json | null
          data_batida?: string | null
          entrada_1?: string | null
          entrada_2?: string | null
          entrada_3?: string | null
          entrada_4?: string | null
          entrada_5?: string | null
          entrada_6?: string | null
          folga?: number | null
          funcionario_id?: number | null
          horario_codigo?: number | null
          id?: number
          justificativa_abono?: number | null
          neutro?: number | null
          observacoes?: Json | null
          saida_1?: string | null
          saida_2?: string | null
          saida_3?: string | null
          saida_4?: string | null
          saida_5?: string | null
          saida_6?: string | null
          sincronizado_em?: string | null
          updated_at?: string | null
        }
        Update: {
          abono?: string | null
          abono_negativo?: string | null
          codigo_firebird?: number | null
          created_at?: string | null
          dados_brutos?: Json | null
          data_batida?: string | null
          entrada_1?: string | null
          entrada_2?: string | null
          entrada_3?: string | null
          entrada_4?: string | null
          entrada_5?: string | null
          entrada_6?: string | null
          folga?: number | null
          funcionario_id?: number | null
          horario_codigo?: number | null
          id?: number
          justificativa_abono?: number | null
          neutro?: number | null
          observacoes?: Json | null
          saida_1?: string | null
          saida_2?: string | null
          saida_3?: string | null
          saida_4?: string | null
          saida_5?: string | null
          saida_6?: string | null
          sincronizado_em?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ponto_registros_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "ponto_funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ponto_sync_log: {
        Row: {
          created_at: string | null
          departamentos_sincronizados: number | null
          erro: string | null
          fim: string | null
          funcionarios_sincronizados: number | null
          id: number
          inicio: string | null
          registros_atualizados: number | null
          registros_novos: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          departamentos_sincronizados?: number | null
          erro?: string | null
          fim?: string | null
          funcionarios_sincronizados?: number | null
          id?: number
          inicio?: string | null
          registros_atualizados?: number | null
          registros_novos?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          departamentos_sincronizados?: number | null
          erro?: string | null
          fim?: string | null
          funcionarios_sincronizados?: number | null
          id?: number
          inicio?: string | null
          registros_atualizados?: number | null
          registros_novos?: number | null
          status?: string | null
        }
        Relationships: []
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
      prejuizos_fiscais: {
        Row: {
          ano_origem: number
          created_at: string
          data_limite_compensacao: string | null
          empresa_id: string
          id: string
          observacoes: string | null
          saldo_disponivel: number
          status: string | null
          tipo: string
          trimestre_origem: number | null
          updated_at: string
          valor_compensado: number | null
          valor_original: number
        }
        Insert: {
          ano_origem: number
          created_at?: string
          data_limite_compensacao?: string | null
          empresa_id: string
          id?: string
          observacoes?: string | null
          saldo_disponivel: number
          status?: string | null
          tipo: string
          trimestre_origem?: number | null
          updated_at?: string
          valor_compensado?: number | null
          valor_original: number
        }
        Update: {
          ano_origem?: number
          created_at?: string
          data_limite_compensacao?: string | null
          empresa_id?: string
          id?: string
          observacoes?: string | null
          saldo_disponivel?: number
          status?: string | null
          tipo?: string
          trimestre_origem?: number | null
          updated_at?: string
          valor_compensado?: number | null
          valor_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "prejuizos_fiscais_empresa_id_fkey"
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
          cargo: string | null
          created_at: string
          email: string
          empresa_id: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email: string
          empresa_id?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string
          empresa_id?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      protestos: {
        Row: {
          cartorio: string | null
          cidade_cartorio: string | null
          cliente_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          custas: number | null
          data_pagamento: string | null
          data_protesto: string | null
          data_protocolo: string | null
          empresa_id: string | null
          estado_cartorio: string | null
          id: string
          observacoes: string | null
          protocolo: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          cartorio?: string | null
          cidade_cartorio?: string | null
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          custas?: number | null
          data_pagamento?: string | null
          data_protesto?: string | null
          data_protocolo?: string | null
          empresa_id?: string | null
          estado_cartorio?: string | null
          id?: string
          observacoes?: string | null
          protocolo?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          cartorio?: string | null
          cidade_cartorio?: string | null
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          custas?: number | null
          data_pagamento?: string | null
          data_protesto?: string | null
          data_protocolo?: string | null
          empresa_id?: string | null
          estado_cartorio?: string | null
          id?: string
          observacoes?: string | null
          protocolo?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "protestos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protestos_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protestos_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protestos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
      rate_limit_logs: {
        Row: {
          blocked: boolean | null
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string
          requests_count: number | null
          window_start: string | null
        }
        Insert: {
          blocked?: boolean | null
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: string
          requests_count?: number | null
          window_start?: string | null
        }
        Update: {
          blocked?: boolean | null
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string
          requests_count?: number | null
          window_start?: string | null
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
      regimes_especiais_empresa: {
        Row: {
          ativo: boolean | null
          ato_legal: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          empresa_id: string
          id: string
          numero_processo: string | null
          reducao_cbs: number | null
          reducao_ibs: number | null
          regime_codigo: string
          regime_nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          ato_legal?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          empresa_id: string
          id?: string
          numero_processo?: string | null
          reducao_cbs?: number | null
          reducao_ibs?: number | null
          regime_codigo: string
          regime_nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          ato_legal?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          empresa_id?: string
          id?: string
          numero_processo?: string | null
          reducao_cbs?: number | null
          reducao_ibs?: number | null
          regime_codigo?: string
          regime_nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regimes_especiais_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_conciliacao: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          entidade_id: string | null
          entidade_nome: string
          id: string
          lancamento_tipo: string
          padrao_descricao: string
          updated_at: string | null
          vezes_aplicada: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          entidade_id?: string | null
          entidade_nome: string
          id?: string
          lancamento_tipo: string
          padrao_descricao: string
          updated_at?: string | null
          vezes_aplicada?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          entidade_id?: string | null
          entidade_nome?: string
          id?: string
          lancamento_tipo?: string
          padrao_descricao?: string
          updated_at?: string | null
          vezes_aplicada?: number | null
        }
        Relationships: []
      }
      regua_cobranca: {
        Row: {
          ativo: boolean | null
          auto_executar: boolean | null
          canais: string[] | null
          canal: string
          created_at: string
          created_by: string | null
          descricao: string | null
          dias_antes_vencimento: number | null
          dias_apos_vencimento: number | null
          dias_gatilho: number | null
          empresa_id: string | null
          id: string
          nome: string
          ordem: number
          template_mensagem: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          auto_executar?: boolean | null
          canais?: string[] | null
          canal?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          dias_antes_vencimento?: number | null
          dias_apos_vencimento?: number | null
          dias_gatilho?: number | null
          empresa_id?: string | null
          id?: string
          nome: string
          ordem?: number
          template_mensagem: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          auto_executar?: boolean | null
          canais?: string[] | null
          canal?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          dias_antes_vencimento?: number | null
          dias_apos_vencimento?: number | null
          dias_gatilho?: number | null
          empresa_id?: string | null
          id?: string
          nome?: string
          ordem?: number
          template_mensagem?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regua_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "relatorios_agendados_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
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
      retencoes_fonte: {
        Row: {
          aliquota: number
          cnpj_participante: string | null
          codigo_receita: string | null
          competencia: string
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          darf_gerado: boolean | null
          data_fato_gerador: string
          data_recolhimento: string | null
          data_retencao: string
          data_vencimento: string
          empresa_id: string
          id: string
          nome_participante: string
          nota_fiscal_id: string | null
          numero_documento: string | null
          observacoes: string | null
          status: string | null
          tipo_operacao: string
          tipo_retencao: string
          updated_at: string
          valor_base: number
          valor_retido: number
        }
        Insert: {
          aliquota: number
          cnpj_participante?: string | null
          codigo_receita?: string | null
          competencia: string
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          darf_gerado?: boolean | null
          data_fato_gerador: string
          data_recolhimento?: string | null
          data_retencao: string
          data_vencimento: string
          empresa_id: string
          id?: string
          nome_participante: string
          nota_fiscal_id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          status?: string | null
          tipo_operacao: string
          tipo_retencao: string
          updated_at?: string
          valor_base: number
          valor_retido: number
        }
        Update: {
          aliquota?: number
          cnpj_participante?: string | null
          codigo_receita?: string | null
          competencia?: string
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          darf_gerado?: boolean | null
          data_fato_gerador?: string
          data_recolhimento?: string | null
          data_retencao?: string
          data_vencimento?: string
          empresa_id?: string
          id?: string
          nome_participante?: string
          nota_fiscal_id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          status?: string | null
          tipo_operacao?: string
          tipo_retencao?: string
          updated_at?: string
          valor_base?: number
          valor_retido?: number
        }
        Relationships: [
          {
            foreignKeyName: "retencoes_fonte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          type: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          type: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          type?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          allowed_global_ips: string[] | null
          enable_geo_restriction: boolean | null
          id: string
          require_2fa: boolean | null
          restrict_by_ip: boolean | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allowed_global_ips?: string[] | null
          enable_geo_restriction?: boolean | null
          id?: string
          require_2fa?: boolean | null
          restrict_by_ip?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allowed_global_ips?: string[] | null
          enable_geo_restriction?: boolean | null
          id?: string
          require_2fa?: boolean | null
          restrict_by_ip?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "solicitacoes_aprovacao_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
            referencedColumns: ["id"]
          },
        ]
      }
      split_payment_transacoes: {
        Row: {
          cbs_retido: number | null
          conta_cbs: string | null
          conta_fornecedor: string | null
          conta_ibs: string | null
          conta_is: string | null
          created_at: string
          data_processamento: string | null
          documento_chave: string | null
          documento_numero: string | null
          documento_tipo: string
          empresa_id: string
          erro_mensagem: string | null
          ibs_retido: number | null
          id: string
          is_retido: number | null
          operacao_id: string
          protocolo: string | null
          status: string | null
          total_retido: number | null
          updated_at: string
          valor_liquido: number
          valor_operacao: number
        }
        Insert: {
          cbs_retido?: number | null
          conta_cbs?: string | null
          conta_fornecedor?: string | null
          conta_ibs?: string | null
          conta_is?: string | null
          created_at?: string
          data_processamento?: string | null
          documento_chave?: string | null
          documento_numero?: string | null
          documento_tipo: string
          empresa_id: string
          erro_mensagem?: string | null
          ibs_retido?: number | null
          id?: string
          is_retido?: number | null
          operacao_id: string
          protocolo?: string | null
          status?: string | null
          total_retido?: number | null
          updated_at?: string
          valor_liquido: number
          valor_operacao: number
        }
        Update: {
          cbs_retido?: number | null
          conta_cbs?: string | null
          conta_fornecedor?: string | null
          conta_ibs?: string | null
          conta_is?: string | null
          created_at?: string
          data_processamento?: string | null
          documento_chave?: string | null
          documento_numero?: string | null
          documento_tipo?: string
          empresa_id?: string
          erro_mensagem?: string | null
          ibs_retido?: number | null
          id?: string
          is_retido?: number | null
          operacao_id?: string
          protocolo?: string | null
          status?: string | null
          total_retido?: number | null
          updated_at?: string
          valor_liquido?: number
          valor_operacao?: number
        }
        Relationships: [
          {
            foreignKeyName: "split_payment_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_payment_transacoes_operacao_id_fkey"
            columns: ["operacao_id"]
            isOneToOne: false
            referencedRelation: "operacoes_tributaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_cobranca: {
        Row: {
          assunto: string | null
          ativo: boolean
          canal: string
          corpo: string
          created_at: string
          created_by: string | null
          empresa_id: string | null
          etapa: string
          id: string
          padrao: boolean | null
          tom: string | null
          updated_at: string
          variaveis_disponiveis: string[] | null
          versao: number | null
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean
          canal: string
          corpo: string
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          etapa: string
          id?: string
          padrao?: boolean | null
          tom?: string | null
          updated_at?: string
          variaveis_disponiveis?: string[] | null
          versao?: number | null
        }
        Update: {
          assunto?: string | null
          ativo?: boolean
          canal?: string
          corpo?: string
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          etapa?: string
          id?: string
          padrao?: boolean | null
          tom?: string | null
          updated_at?: string
          variaveis_disponiveis?: string[] | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_bancarias: {
        Row: {
          conciliacao_parcial: boolean | null
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
          valor_conciliado: number | null
        }
        Insert: {
          conciliacao_parcial?: boolean | null
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
          valor_conciliado?: number | null
        }
        Update: {
          conciliacao_parcial?: boolean | null
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
          valor_conciliado?: number | null
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
            foreignKeyName: "transacoes_bancarias_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
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
            foreignKeyName: "transacoes_bancarias_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_bancarias_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_bancarias_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencias: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          asaas_status: string | null
          asaas_transfer_id: string | null
          cancelado_em: string | null
          cancelado_por: string | null
          chave_pix: string | null
          codigo_barras: string | null
          comprovante_url: string | null
          conta_bancaria_id: string | null
          conta_destino_id: string | null
          conta_pagar_id: string | null
          created_at: string
          created_by: string | null
          data_efetivacao: string | null
          data_transferencia: string
          descricao: string
          empresa_id: string | null
          erro_mensagem: string | null
          favorecido_agencia: string | null
          favorecido_banco: string | null
          favorecido_conta: string | null
          favorecido_cpf_cnpj: string | null
          favorecido_nome: string | null
          favorecido_tipo_conta: string | null
          id: string
          linha_digitavel: string | null
          motivo_cancelamento: string | null
          movimentacao_id: string | null
          numero_documento: string | null
          observacoes: string | null
          origem: string | null
          protocolo: string | null
          status: string
          taxa: number | null
          tipo: string
          tipo_chave_pix: string | null
          updated_at: string
          valor: number
          valor_liquido: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          asaas_status?: string | null
          asaas_transfer_id?: string | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          chave_pix?: string | null
          codigo_barras?: string | null
          comprovante_url?: string | null
          conta_bancaria_id?: string | null
          conta_destino_id?: string | null
          conta_pagar_id?: string | null
          created_at?: string
          created_by?: string | null
          data_efetivacao?: string | null
          data_transferencia?: string
          descricao: string
          empresa_id?: string | null
          erro_mensagem?: string | null
          favorecido_agencia?: string | null
          favorecido_banco?: string | null
          favorecido_conta?: string | null
          favorecido_cpf_cnpj?: string | null
          favorecido_nome?: string | null
          favorecido_tipo_conta?: string | null
          id?: string
          linha_digitavel?: string | null
          motivo_cancelamento?: string | null
          movimentacao_id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          origem?: string | null
          protocolo?: string | null
          status?: string
          taxa?: number | null
          tipo?: string
          tipo_chave_pix?: string | null
          updated_at?: string
          valor: number
          valor_liquido?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          asaas_status?: string | null
          asaas_transfer_id?: string | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          chave_pix?: string | null
          codigo_barras?: string | null
          comprovante_url?: string | null
          conta_bancaria_id?: string | null
          conta_destino_id?: string | null
          conta_pagar_id?: string | null
          created_at?: string
          created_by?: string | null
          data_efetivacao?: string | null
          data_transferencia?: string
          descricao?: string
          empresa_id?: string | null
          erro_mensagem?: string | null
          favorecido_agencia?: string | null
          favorecido_banco?: string | null
          favorecido_conta?: string | null
          favorecido_cpf_cnpj?: string | null
          favorecido_nome?: string | null
          favorecido_tipo_conta?: string | null
          id?: string
          linha_digitavel?: string | null
          motivo_cancelamento?: string | null
          movimentacao_id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          origem?: string | null
          protocolo?: string | null
          status?: string
          taxa?: number | null
          tipo?: string
          tipo_chave_pix?: string | null
          updated_at?: string
          valor?: number
          valor_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: string | null
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_activity: string | null
          revoked: boolean | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_activity?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_activity?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          meta_mensal: number | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      webhooks_log: {
        Row: {
          created_at: string
          erro_mensagem: string | null
          event_type: string
          headers: Json | null
          id: string
          ip_origem: string | null
          payload: Json | null
          processado: boolean | null
          processado_em: string | null
          provider: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          erro_mensagem?: string | null
          event_type: string
          headers?: Json | null
          id?: string
          ip_origem?: string | null
          payload?: Json | null
          processado?: boolean | null
          processado_em?: string | null
          provider: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          erro_mensagem?: string | null
          event_type?: string
          headers?: Json | null
          id?: string
          ip_origem?: string | null
          payload?: Json | null
          processado?: boolean | null
          processado_em?: string | null
          provider?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      workflow_aprovacoes: {
        Row: {
          aprovacoes: Json
          aprovado_em: string | null
          aprovadores_necessarios: number
          created_at: string
          descricao: string
          entidade_id: string
          expira_em: string | null
          id: string
          motivo_rejeicao: string | null
          nivel_necessario: number
          solicitante_id: string
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          aprovacoes?: Json
          aprovado_em?: string | null
          aprovadores_necessarios?: number
          created_at?: string
          descricao: string
          entidade_id: string
          expira_em?: string | null
          id?: string
          motivo_rejeicao?: string | null
          nivel_necessario?: number
          solicitante_id: string
          status?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          aprovacoes?: Json
          aprovado_em?: string | null
          aprovadores_necessarios?: number
          created_at?: string
          descricao?: string
          entidade_id?: string
          expira_em?: string | null
          id?: string
          motivo_rejeicao?: string | null
          nivel_necessario?: number
          solicitante_id?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
    }
    Views: {
      vw_contas_pagar_painel: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          bitrix_deal_id: string | null
          categoria: string | null
          centro_custo_id: string | null
          centro_custo_nome: string | null
          codigo_barras: string | null
          conta_bancaria_id: string | null
          conta_banco: string | null
          contato_id: string | null
          created_at: string | null
          created_by: string | null
          data_emissao: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          forma_pagamento_id: string | null
          fornecedor_cnpj_display: string | null
          fornecedor_display: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          frequencia_recorrencia: string | null
          id: string | null
          numero_documento: string | null
          numero_parcela_atual: number | null
          observacoes: string | null
          parcela_atual: number | null
          plano_conta_codigo: string | null
          plano_conta_id: string | null
          plano_conta_nome: string | null
          recorrente: boolean | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"] | null
          total_parcelas: number | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
          valor_desconto: number | null
          valor_final: number | null
          valor_juros: number | null
          valor_multa: number | null
          valor_original: number | null
          valor_pago: number | null
          vencimento: string | null
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
            foreignKeyName: "contas_pagar_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
          },
          {
            foreignKeyName: "contas_pagar_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_financeiros"
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
            foreignKeyName: "contas_pagar_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_contas_receber_painel: {
        Row: {
          bitrix_deal_id: string | null
          categoria: string | null
          centro_custo_id: string | null
          centro_custo_nome: string | null
          chave_pix: string | null
          cliente_cpf_cnpj_display: string | null
          cliente_display: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_score: number | null
          codigo_barras: string | null
          conta_bancaria_id: string | null
          conta_banco: string | null
          contato_id: string | null
          created_at: string | null
          created_by: string | null
          data_emissao: string | null
          data_recebimento: string | null
          data_vencimento: string | null
          descricao: string | null
          empresa_id: string | null
          etapa_cobranca: Database["public"]["Enums"]["etapa_cobranca"] | null
          forma_pagamento_id: string | null
          forma_recebimento: string | null
          frequencia_recorrencia: string | null
          id: string | null
          link_boleto: string | null
          numero_documento: string | null
          numero_parcela_atual: number | null
          observacoes: string | null
          parcela_atual: number | null
          plano_conta_id: string | null
          plano_conta_nome: string | null
          recorrente: boolean | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"] | null
          total_parcelas: number | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
          valor_desconto: number | null
          valor_final: number | null
          valor_juros: number | null
          valor_multa: number | null
          valor_original: number | null
          valor_pago: number | null
          valor_recebido: number | null
          vencimento: string | null
          vendedor_id: string | null
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
            foreignKeyName: "contas_receber_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
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
            foreignKeyName: "contas_receber_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_dre_mensal: {
        Row: {
          despesas: number | null
          empresa_id: string | null
          mes: string | null
          receitas: number | null
          resultado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_dso_aging: {
        Row: {
          a_vencer: number | null
          empresa_id: string | null
          saldo_aberto: number | null
          total_titulos: number | null
          valor_total: number | null
          vencido_0_7: number | null
          vencido_16_30: number | null
          vencido_31_60: number | null
          vencido_61_90: number | null
          vencido_8_15: number | null
          vencido_90_mais: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_fluxo_caixa: {
        Row: {
          despesas_previstas: number | null
          dia: string | null
          receitas_previstas: number | null
          saldo_dia: number | null
        }
        Relationships: []
      }
      vw_fluxo_caixa_diario: {
        Row: {
          dia: string | null
          empresa_id: string | null
          entradas: number | null
          saidas: number | null
          saldo: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_gastos_centro_custo: {
        Row: {
          centro_custo_id: string | null
          codigo: string | null
          nome: string | null
          orcamento_previsto: number | null
          percentual_utilizado: number | null
          total_gasto: number | null
        }
        Relationships: []
      }
      vw_metricas_cobranca: {
        Row: {
          canal: string | null
          empresa_id: string | null
          etapa: string | null
          taxa_entrega: number | null
          total_entregues: number | null
          total_enviados: number | null
          total_lidos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_saldos_contas: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          banco: string | null
          conta: string | null
          cor: string | null
          empresa_id: string | null
          empresa_nome: string | null
          id: string | null
          saldo_atual: number | null
          tipo_conta: string | null
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
      vw_transferencias_painel: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          asaas_status: string | null
          asaas_transfer_id: string | null
          banco_destino: string | null
          banco_origem: string | null
          cancelado_em: string | null
          cancelado_por: string | null
          chave_pix: string | null
          codigo_barras: string | null
          comprovante_url: string | null
          conta_bancaria_id: string | null
          conta_destino_id: string | null
          conta_destino_numero: string | null
          conta_origem_numero: string | null
          conta_pagar_id: string | null
          created_at: string | null
          created_by: string | null
          data_efetivacao: string | null
          data_transferencia: string | null
          descricao: string | null
          empresa_id: string | null
          erro_mensagem: string | null
          favorecido_agencia: string | null
          favorecido_banco: string | null
          favorecido_conta: string | null
          favorecido_cpf_cnpj: string | null
          favorecido_nome: string | null
          favorecido_tipo_conta: string | null
          id: string | null
          linha_digitavel: string | null
          motivo_cancelamento: string | null
          movimentacao_id: string | null
          numero_documento: string | null
          observacoes: string | null
          origem: string | null
          protocolo: string | null
          status: string | null
          taxa: number | null
          tipo: string | null
          tipo_chave_pix: string | null
          updated_at: string | null
          valor: number | null
          valor_liquido: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_webhooks_recentes: {
        Row: {
          created_at: string | null
          erro_mensagem: string | null
          event_type: string | null
          headers: Json | null
          id: string | null
          ip_origem: string | null
          payload: Json | null
          processado: boolean | null
          processado_em: string | null
          provider: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
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
      check_account_lockout: { Args: { _email: string }; Returns: boolean }
      confirmar_conciliacao: {
        Args: {
          p_conta_pagar_id?: string
          p_conta_receber_id?: string
          p_transacao_id: string
        }
        Returns: undefined
      }
      confirmar_envio_cobranca: {
        Args: {
          p_erro?: string
          p_fila_id: string
          p_provider?: string
          p_provider_message_id?: string
          p_sucesso?: boolean
        }
        Returns: undefined
      }
      delete_cron_job: { Args: { job_id: number }; Returns: undefined }
      fn_verificar_vencidos: { Args: never; Returns: undefined }
      gerar_alertas_pendencias_conciliacao: { Args: never; Returns: undefined }
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
      get_lockout_details: {
        Args: { _email: string }
        Returns: {
          is_locked: boolean
          lockout_count: number
          remaining_minutes: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_webauthn_credential_by_email: {
        Args: { p_email: string }
        Returns: {
          counter: number
          credential_id: string
          public_key: string
          user_id: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_failed_attempts: {
        Args: { _email: string }
        Returns: undefined
      }
      is_country_allowed_for_login: {
        Args: { _country: string }
        Returns: boolean
      }
      is_ip_allowed_for_login: { Args: { _ip: string }; Returns: boolean }
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
      processar_fila_cobrancas: {
        Args: { p_limite?: number }
        Returns: {
          canal: string
          cliente_nome: string
          conta_receber_id: string
          destinatario: string
          etapa: string
          fila_id: string
          mensagem: string
        }[]
      }
      processar_regua_cobranca: {
        Args: { p_empresa_id?: string }
        Returns: {
          total_enfileirados: number
          total_ja_cobrados: number
          total_sem_contato: number
        }[]
      }
      reset_failed_attempts: { Args: { _email: string }; Returns: undefined }
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
        | "atrasado"
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
      status_pagamento: [
        "pago",
        "pendente",
        "vencido",
        "parcial",
        "cancelado",
        "atrasado",
      ],
      tipo_cobranca: ["boleto", "pix", "cartao", "transferencia", "dinheiro"],
      tipo_transacao: ["receita", "despesa"],
    },
  },
} as const
