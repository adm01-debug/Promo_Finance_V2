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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acoes_recomendadas: {
        Row: {
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          expires_at: string | null
          fonte: string | null
          gerado_em: string | null
          id: string
          impacto_estimado: number | null
          impacto_tipo: string | null
          link_resolucao: string | null
          ordem: number | null
          prioridade: string | null
          score: number | null
          status: string | null
          titulo: string
          urgencia: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          expires_at?: string | null
          fonte?: string | null
          gerado_em?: string | null
          id?: string
          impacto_estimado?: number | null
          impacto_tipo?: string | null
          link_resolucao?: string | null
          ordem?: number | null
          prioridade?: string | null
          score?: number | null
          status?: string | null
          titulo: string
          urgencia?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          expires_at?: string | null
          fonte?: string | null
          gerado_em?: string | null
          id?: string
          impacto_estimado?: number | null
          impacto_tipo?: string | null
          link_resolucao?: string | null
          ordem?: number | null
          prioridade?: string | null
          score?: number | null
          status?: string | null
          titulo?: string
          urgencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acoes_recomendadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      acordos_parcelamento: {
        Row: {
          cliente_email: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          conta_receber_id: string | null
          contas_receber_ids: string[] | null
          created_at: string
          created_by: string | null
          data_primeiro_vencimento: string | null
          desconto_aplicado: number | null
          dia_vencimento: number | null
          empresa_id: string | null
          id: string
          juros_aplicado: number | null
          numero_acordo: string | null
          numero_parcelas: number | null
          observacoes: string | null
          status: string | null
          total_parcelas: number
          updated_at: string | null
          user_id: string
          valor_original: number | null
          valor_parcela: number | null
          valor_total: number
          valor_total_acordo: number | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          conta_receber_id?: string | null
          contas_receber_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          data_primeiro_vencimento?: string | null
          desconto_aplicado?: number | null
          dia_vencimento?: number | null
          empresa_id?: string | null
          id?: string
          juros_aplicado?: number | null
          numero_acordo?: string | null
          numero_parcelas?: number | null
          observacoes?: string | null
          status?: string | null
          total_parcelas?: number
          updated_at?: string | null
          user_id?: string
          valor_original?: number | null
          valor_parcela?: number | null
          valor_total?: number
          valor_total_acordo?: number | null
        }
        Update: {
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          conta_receber_id?: string | null
          contas_receber_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          data_primeiro_vencimento?: string | null
          desconto_aplicado?: number | null
          dia_vencimento?: number | null
          empresa_id?: string | null
          id?: string
          juros_aplicado?: number | null
          numero_acordo?: string | null
          numero_parcelas?: number | null
          observacoes?: string | null
          status?: string | null
          total_parcelas?: number
          updated_at?: string | null
          user_id?: string
          valor_original?: number | null
          valor_parcela?: number | null
          valor_total?: number
          valor_total_acordo?: number | null
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
      active_tracking: {
        Row: {
          alerts_sent: Json | null
          current_latitude: number
          current_longitude: number
          destination_lat: number | null
          destination_lng: number | null
          driver_id: string
          eta_minutes: number | null
          expected_route: Json | null
          heading: number | null
          id: string
          is_on_route: boolean | null
          is_stopped: boolean | null
          last_updated: string
          order_id: string
          origin_lat: number | null
          origin_lng: number | null
          speed: number | null
          stopped_since: string | null
          tracking_ended_at: string | null
          tracking_started_at: string | null
          tracking_status: string | null
        }
        Insert: {
          alerts_sent?: Json | null
          current_latitude: number
          current_longitude: number
          destination_lat?: number | null
          destination_lng?: number | null
          driver_id: string
          eta_minutes?: number | null
          expected_route?: Json | null
          heading?: number | null
          id?: string
          is_on_route?: boolean | null
          is_stopped?: boolean | null
          last_updated?: string
          order_id: string
          origin_lat?: number | null
          origin_lng?: number | null
          speed?: number | null
          stopped_since?: string | null
          tracking_ended_at?: string | null
          tracking_started_at?: string | null
          tracking_status?: string | null
        }
        Update: {
          alerts_sent?: Json | null
          current_latitude?: number
          current_longitude?: number
          destination_lat?: number | null
          destination_lng?: number | null
          driver_id?: string
          eta_minutes?: number | null
          expected_route?: Json | null
          heading?: number | null
          id?: string
          is_on_route?: boolean | null
          is_stopped?: boolean | null
          last_updated?: string
          order_id?: string
          origin_lat?: number | null
          origin_lng?: number | null
          speed?: number | null
          stopped_since?: string | null
          tracking_ended_at?: string | null
          tracking_started_at?: string | null
          tracking_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_tracking_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_tracking_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_configurations: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          bitrix24_user_ids: number[] | null
          channel: string
          conditions: Json | null
          config: Json | null
          created_at: string
          created_by: string | null
          email_addresses: string[] | null
          id: string
          is_enabled: boolean | null
          message_template: string | null
          min_interval_seconds: number | null
          n8n_webhook_url: string | null
          name: string | null
          notify_bitrix24_task: boolean | null
          notify_email: boolean | null
          notify_n8n_webhook: boolean | null
          notify_slack: boolean | null
          notify_sms: boolean | null
          notify_whatsapp: boolean | null
          recipients: string[] | null
          slack_channels: string[] | null
          sms_numbers: string[] | null
          updated_at: string
          whatsapp_numbers: string[] | null
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type"]
          bitrix24_user_ids?: number[] | null
          channel: string
          conditions?: Json | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          email_addresses?: string[] | null
          id?: string
          is_enabled?: boolean | null
          message_template?: string | null
          min_interval_seconds?: number | null
          n8n_webhook_url?: string | null
          name?: string | null
          notify_bitrix24_task?: boolean | null
          notify_email?: boolean | null
          notify_n8n_webhook?: boolean | null
          notify_slack?: boolean | null
          notify_sms?: boolean | null
          notify_whatsapp?: boolean | null
          recipients?: string[] | null
          slack_channels?: string[] | null
          sms_numbers?: string[] | null
          updated_at?: string
          whatsapp_numbers?: string[] | null
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type"]
          bitrix24_user_ids?: number[] | null
          channel?: string
          conditions?: Json | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          email_addresses?: string[] | null
          id?: string
          is_enabled?: boolean | null
          message_template?: string | null
          min_interval_seconds?: number | null
          n8n_webhook_url?: string | null
          name?: string | null
          notify_bitrix24_task?: boolean | null
          notify_email?: boolean | null
          notify_n8n_webhook?: boolean | null
          notify_slack?: boolean | null
          notify_sms?: boolean | null
          notify_whatsapp?: boolean | null
          recipients?: string[] | null
          slack_channels?: string[] | null
          sms_numbers?: string[] | null
          updated_at?: string
          whatsapp_numbers?: string[] | null
        }
        Relationships: []
      }
      alertas: {
        Row: {
          acao_url: string | null
          created_at: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          lido: boolean | null
          mensagem: string | null
          prioridade: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          acao_url?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string | null
          prioridade?: string | null
          tipo: string
          titulo: string
          user_id?: string
        }
        Update: {
          acao_url?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string | null
          prioridade?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      alertas_preditivos: {
        Row: {
          created_at: string | null
          data_prevista: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          metadata: Json | null
          probabilidade: number | null
          status: string | null
          tipo: string
          titulo: string
          updated_at: string | null
          valor_estimado: number | null
        }
        Insert: {
          created_at?: string | null
          data_prevista?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          metadata?: Json | null
          probabilidade?: number | null
          status?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Update: {
          created_at?: string | null
          data_prevista?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          metadata?: Json | null
          probabilidade?: number | null
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          valor_estimado?: number | null
        }
        Relationships: []
      }
      alertas_tributarios: {
        Row: {
          created_at: string | null
          data_vencimento: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          lido: boolean | null
          mensagem: string | null
          prioridade: string | null
          resolvido: boolean | null
          status: string | null
          tipo: string | null
          titulo: string
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string | null
          prioridade?: string | null
          resolvido?: boolean | null
          status?: string | null
          tipo?: string | null
          titulo: string
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string | null
          prioridade?: string | null
          resolvido?: boolean | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          valor?: number | null
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
      alerts: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          order_id: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          order_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          order_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts_sent: {
        Row: {
          alert_id: string
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          recipient: string
          retry_count: number | null
          sent_at: string | null
          status: string
        }
        Insert: {
          alert_id: string
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          alert_id?: string
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_sent_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      allowed_countries: {
        Row: {
          ativo: boolean | null
          country_code: string
          country_name: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
        }
        Insert: {
          ativo?: boolean | null
          country_code: string
          country_name?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
        }
        Update: {
          ativo?: boolean | null
          country_code?: string
          country_name?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
        }
        Relationships: []
      }
      allowed_ips: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          ip_address: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          ip_address: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
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
          entidade_id: string
          entidade_tipo: string
          id: string
          mime_type: string | null
          nome_arquivo: string
          tamanho_bytes: number | null
          url: string
          url_publica: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entidade_id: string
          entidade_tipo: string
          id?: string
          mime_type?: string | null
          nome_arquivo: string
          tamanho_bytes?: number | null
          url: string
          url_publica?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          mime_type?: string | null
          nome_arquivo?: string
          tamanho_bytes?: number | null
          url?: string
          url_publica?: string | null
          user_id?: string
        }
        Relationships: []
      }
      anomalia_detection_runs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          inseridas: number | null
          status: string | null
          trigger_source: string | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          inseridas?: number | null
          status?: string | null
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          inseridas?: number | null
          status?: string | null
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      anomalia_toast_eventos: {
        Row: {
          acoes_disponiveis: string[] | null
          anomalia_id: string | null
          centro_custo_nome: string | null
          descricao: string | null
          dispatched_at: string | null
          duracao_segundos: number | null
          id: string
          severidade: string | null
          tipo_anomalia: string | null
          titulo: string | null
          user_id: string | null
        }
        Insert: {
          acoes_disponiveis?: string[] | null
          anomalia_id?: string | null
          centro_custo_nome?: string | null
          descricao?: string | null
          dispatched_at?: string | null
          duracao_segundos?: number | null
          id?: string
          severidade?: string | null
          tipo_anomalia?: string | null
          titulo?: string | null
          user_id?: string | null
        }
        Update: {
          acoes_disponiveis?: string[] | null
          anomalia_id?: string | null
          centro_custo_nome?: string | null
          descricao?: string | null
          dispatched_at?: string | null
          duracao_segundos?: number | null
          id?: string
          severidade?: string | null
          tipo_anomalia?: string | null
          titulo?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomalia_toast_eventos_anomalia_id_fkey"
            columns: ["anomalia_id"]
            isOneToOne: false
            referencedRelation: "anomalias_detectadas"
            referencedColumns: ["id"]
          },
        ]
      }
      anomalias_detectadas: {
        Row: {
          bitrix_task_id: string | null
          centro_custo_id: string | null
          centro_custo_nome: string | null
          created_at: string | null
          dados: Json | null
          descricao: string | null
          detectada_em: string | null
          empresa_id: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          metadata: Json | null
          observacoes: string | null
          prioridade: string | null
          resolucao: string | null
          resolvida_em: string | null
          resolvida_por: string | null
          revisado_em: string | null
          revisado_por: string | null
          score_confianca: number | null
          severidade: string | null
          status: string | null
          tipo: string
          tipo_anomalia: string | null
          titulo: string | null
          updated_at: string | null
          user_id: string | null
          valor_envolvido: number | null
        }
        Insert: {
          bitrix_task_id?: string | null
          centro_custo_id?: string | null
          centro_custo_nome?: string | null
          created_at?: string | null
          dados?: Json | null
          descricao?: string | null
          detectada_em?: string | null
          empresa_id?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          metadata?: Json | null
          observacoes?: string | null
          prioridade?: string | null
          resolucao?: string | null
          resolvida_em?: string | null
          resolvida_por?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          score_confianca?: number | null
          severidade?: string | null
          status?: string | null
          tipo: string
          tipo_anomalia?: string | null
          titulo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_envolvido?: number | null
        }
        Update: {
          bitrix_task_id?: string | null
          centro_custo_id?: string | null
          centro_custo_nome?: string | null
          created_at?: string | null
          dados?: Json | null
          descricao?: string | null
          detectada_em?: string | null
          empresa_id?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          metadata?: Json | null
          observacoes?: string | null
          prioridade?: string | null
          resolucao?: string | null
          resolvida_em?: string | null
          resolvida_por?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          score_confianca?: number | null
          severidade?: string | null
          status?: string | null
          tipo?: string
          tipo_anomalia?: string | null
          titulo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_envolvido?: number | null
        }
        Relationships: []
      }
      aprovacao_comentarios: {
        Row: {
          comentario: string | null
          created_at: string | null
          id: string
          solicitacao_id: string | null
          user_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          solicitacao_id?: string | null
          user_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          solicitacao_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      apuracoes_irpj_csll: {
        Row: {
          adicional_irpj: number | null
          adicoes_permanentes: number | null
          adicoes_temporarias: number | null
          ano: number | null
          base_calculo_csll: number | null
          base_calculo_irpj: number | null
          compensacao_prejuizo: number | null
          compensacao_prejuizos: number | null
          created_at: string | null
          created_by: string | null
          csll_aliquota: number | null
          csll_valor: number | null
          csrf_retido: number | null
          empresa_id: string
          estimativas_pagas: number | null
          exclusoes_permanentes: number | null
          exclusoes_temporarias: number | null
          id: string
          irpj_aliquota_adicional: number | null
          irpj_aliquota_normal: number | null
          irpj_valor: number | null
          irrf_retido: number | null
          lucro_antes_impostos: number | null
          lucro_contabil: number | null
          lucro_real: number | null
          lucro_real_antes_compensacao: number | null
          outros_incentivos: number | null
          pat_deducao: number | null
          periodo_fim: string
          periodo_inicio: string
          saldo_negativo_anterior: number | null
          status: string | null
          tipo_apuracao: string | null
          total_adicoes: number | null
          total_exclusoes: number | null
        }
        Insert: {
          adicional_irpj?: number | null
          adicoes_permanentes?: number | null
          adicoes_temporarias?: number | null
          ano?: number | null
          base_calculo_csll?: number | null
          base_calculo_irpj?: number | null
          compensacao_prejuizo?: number | null
          compensacao_prejuizos?: number | null
          created_at?: string | null
          created_by?: string | null
          csll_aliquota?: number | null
          csll_valor?: number | null
          csrf_retido?: number | null
          empresa_id: string
          estimativas_pagas?: number | null
          exclusoes_permanentes?: number | null
          exclusoes_temporarias?: number | null
          id?: string
          irpj_aliquota_adicional?: number | null
          irpj_aliquota_normal?: number | null
          irpj_valor?: number | null
          irrf_retido?: number | null
          lucro_antes_impostos?: number | null
          lucro_contabil?: number | null
          lucro_real?: number | null
          lucro_real_antes_compensacao?: number | null
          outros_incentivos?: number | null
          pat_deducao?: number | null
          periodo_fim: string
          periodo_inicio: string
          saldo_negativo_anterior?: number | null
          status?: string | null
          tipo_apuracao?: string | null
          total_adicoes?: number | null
          total_exclusoes?: number | null
        }
        Update: {
          adicional_irpj?: number | null
          adicoes_permanentes?: number | null
          adicoes_temporarias?: number | null
          ano?: number | null
          base_calculo_csll?: number | null
          base_calculo_irpj?: number | null
          compensacao_prejuizo?: number | null
          compensacao_prejuizos?: number | null
          created_at?: string | null
          created_by?: string | null
          csll_aliquota?: number | null
          csll_valor?: number | null
          csrf_retido?: number | null
          empresa_id?: string
          estimativas_pagas?: number | null
          exclusoes_permanentes?: number | null
          exclusoes_temporarias?: number | null
          id?: string
          irpj_aliquota_adicional?: number | null
          irpj_aliquota_normal?: number | null
          irpj_valor?: number | null
          irrf_retido?: number | null
          lucro_antes_impostos?: number | null
          lucro_contabil?: number | null
          lucro_real?: number | null
          lucro_real_antes_compensacao?: number | null
          outros_incentivos?: number | null
          pat_deducao?: number | null
          periodo_fim?: string
          periodo_inicio?: string
          saldo_negativo_anterior?: number | null
          status?: string | null
          tipo_apuracao?: string | null
          total_adicoes?: number | null
          total_exclusoes?: number | null
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
          ano: number | null
          cbs_a_compensar: number | null
          cbs_a_pagar: number | null
          cbs_creditos: number | null
          cbs_debitos: number | null
          cbs_saldo_anterior: number | null
          cofins_residual: number | null
          competencia: string | null
          created_at: string | null
          empresa_id: string | null
          ibs_a_compensar: number | null
          ibs_a_pagar: number | null
          ibs_creditos: number | null
          ibs_debitos: number | null
          ibs_saldo_anterior: number | null
          icms_a_pagar: number | null
          icms_creditos: number | null
          icms_debitos: number | null
          icms_residual: number | null
          id: string
          is_a_compensar: number | null
          is_a_pagar: number | null
          is_creditos: number | null
          is_debitos: number | null
          iss_a_pagar: number | null
          iss_creditos: number | null
          iss_debitos: number | null
          iss_residual: number | null
          mes: number | null
          pis_residual: number | null
          status: string | null
          tipo_tributo: string | null
          total_geral: number | null
          total_tributos_novos: number | null
          total_tributos_residuais: number | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          ano?: number | null
          cbs_a_compensar?: number | null
          cbs_a_pagar?: number | null
          cbs_creditos?: number | null
          cbs_debitos?: number | null
          cbs_saldo_anterior?: number | null
          cofins_residual?: number | null
          competencia?: string | null
          created_at?: string | null
          empresa_id?: string | null
          ibs_a_compensar?: number | null
          ibs_a_pagar?: number | null
          ibs_creditos?: number | null
          ibs_debitos?: number | null
          ibs_saldo_anterior?: number | null
          icms_a_pagar?: number | null
          icms_creditos?: number | null
          icms_debitos?: number | null
          icms_residual?: number | null
          id?: string
          is_a_compensar?: number | null
          is_a_pagar?: number | null
          is_creditos?: number | null
          is_debitos?: number | null
          iss_a_pagar?: number | null
          iss_creditos?: number | null
          iss_debitos?: number | null
          iss_residual?: number | null
          mes?: number | null
          pis_residual?: number | null
          status?: string | null
          tipo_tributo?: string | null
          total_geral?: number | null
          total_tributos_novos?: number | null
          total_tributos_residuais?: number | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          ano?: number | null
          cbs_a_compensar?: number | null
          cbs_a_pagar?: number | null
          cbs_creditos?: number | null
          cbs_debitos?: number | null
          cbs_saldo_anterior?: number | null
          cofins_residual?: number | null
          competencia?: string | null
          created_at?: string | null
          empresa_id?: string | null
          ibs_a_compensar?: number | null
          ibs_a_pagar?: number | null
          ibs_creditos?: number | null
          ibs_debitos?: number | null
          ibs_saldo_anterior?: number | null
          icms_a_pagar?: number | null
          icms_creditos?: number | null
          icms_debitos?: number | null
          icms_residual?: number | null
          id?: string
          is_a_compensar?: number | null
          is_a_pagar?: number | null
          is_creditos?: number | null
          is_debitos?: number | null
          iss_a_pagar?: number | null
          iss_creditos?: number | null
          iss_debitos?: number | null
          iss_residual?: number | null
          mes?: number | null
          pis_residual?: number | null
          status?: string | null
          tipo_tributo?: string | null
          total_geral?: number | null
          total_tributos_novos?: number | null
          total_tributos_residuais?: number | null
          updated_at?: string | null
          valor_total?: number | null
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
      asaas_audit_trail: {
        Row: {
          action: string | null
          actor: string | null
          asaas_payment_id: string | null
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action?: string | null
          actor?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string | null
          actor?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_audit_trail_asaas_payment_id_fkey"
            columns: ["asaas_payment_id"]
            isOneToOne: false
            referencedRelation: "asaas_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_config: {
        Row: {
          ambiente: string | null
          api_key_encrypted: string | null
          ativo: boolean | null
          configuracoes: Json | null
          created_at: string
          empresa_id: string | null
          id: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          ambiente?: string | null
          api_key_encrypted?: string | null
          ativo?: boolean | null
          configuracoes?: Json | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          ambiente?: string | null
          api_key_encrypted?: string | null
          ativo?: boolean | null
          configuracoes?: Json | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      asaas_customers: {
        Row: {
          asaas_id: string | null
          cliente_id: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          endereco: Json | null
          id: string
          metadata: Json | null
          nome: string | null
          razao_social: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          asaas_id?: string | null
          cliente_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: Json | null
          id?: string
          metadata?: Json | null
          nome?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          asaas_id?: string | null
          cliente_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: Json | null
          id?: string
          metadata?: Json | null
          nome?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      asaas_payments: {
        Row: {
          asaas_customer_id: string | null
          asaas_id: string | null
          bank_slip_url: string | null
          conta_receber_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          invoice_url: string | null
          metadata: Json | null
          status: string | null
          tipo: string | null
          updated_at: string
          valor: number | null
          valor_liquido: number | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_id?: string | null
          bank_slip_url?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          invoice_url?: string | null
          metadata?: Json | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          valor?: number | null
          valor_liquido?: number | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_id?: string | null
          bank_slip_url?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          invoice_url?: string | null
          metadata?: Json | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          valor?: number | null
          valor_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_payments_asaas_customer_id_fkey"
            columns: ["asaas_customer_id"]
            isOneToOne: false
            referencedRelation: "asaas_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_reconciliation_suggestions: {
        Row: {
          conta_receber_id: string | null
          contas_pagar_id: string | null
          contas_receber_id: string | null
          created_at: string
          data_vencimento: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          metadata: Json | null
          score: number | null
          status: string | null
          transaction_id: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          conta_receber_id?: string | null
          contas_pagar_id?: string | null
          contas_receber_id?: string | null
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          metadata?: Json | null
          score?: number | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          conta_receber_id?: string | null
          contas_pagar_id?: string | null
          contas_receber_id?: string | null
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          metadata?: Json | null
          score?: number | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_reconciliation_suggestions_contas_pagar_id_fkey"
            columns: ["contas_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_reconciliation_suggestions_contas_pagar_id_fkey"
            columns: ["contas_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_reconciliation_suggestions_contas_receber_id_fkey"
            columns: ["contas_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_reconciliation_suggestions_contas_receber_id_fkey"
            columns: ["contas_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_sync_queue: {
        Row: {
          asaas_payment_id: string | null
          attempts: number | null
          created_at: string
          id: string
          last_error: string | null
          next_retry_at: string | null
          payload: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          asaas_payment_id?: string | null
          attempts?: number | null
          created_at?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          payload?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          asaas_payment_id?: string | null
          attempts?: number | null
          created_at?: string
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          payload?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_sync_queue_asaas_payment_id_fkey"
            columns: ["asaas_payment_id"]
            isOneToOne: false
            referencedRelation: "asaas_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_transfers: {
        Row: {
          asaas_id: string | null
          chave_pix: string | null
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          status: string | null
          tipo_chave: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          asaas_id?: string | null
          chave_pix?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          status?: string | null
          tipo_chave?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          asaas_id?: string | null
          chave_pix?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          status?: string | null
          tipo_chave?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
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
          action: string
          created_at?: string | null
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
          action?: string
          created_at?: string | null
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
          empresa_id: string | null
          id: string
          motivo: string | null
          operacao: string
          registro_id: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dados_antigos?: Json | null
          dados_novos?: Json | null
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          operacao: string
          registro_id?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dados_antigos?: Json | null
          dados_novos?: Json | null
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          operacao?: string
          registro_id?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auth_logs: {
        Row: {
          created_at: string | null
          event_type: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bitrix_field_mappings: {
        Row: {
          ativo: boolean | null
          bitrix_field_name: string
          campo_bitrix: string | null
          campo_sistema: string | null
          created_at: string | null
          empresa_id: string | null
          entidade: string | null
          entity_type: string
          id: string
          internal_field_name: string
          obrigatorio: boolean | null
          transformacao: string | null
        }
        Insert: {
          ativo?: boolean | null
          bitrix_field_name: string
          campo_bitrix?: string | null
          campo_sistema?: string | null
          created_at?: string | null
          empresa_id?: string | null
          entidade?: string | null
          entity_type: string
          id?: string
          internal_field_name: string
          obrigatorio?: boolean | null
          transformacao?: string | null
        }
        Update: {
          ativo?: boolean | null
          bitrix_field_name?: string
          campo_bitrix?: string | null
          campo_sistema?: string | null
          created_at?: string | null
          empresa_id?: string | null
          entidade?: string | null
          entity_type?: string
          id?: string
          internal_field_name?: string
          obrigatorio?: boolean | null
          transformacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bitrix_field_mappings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      bitrix_sync_logs: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          empresa_id: string | null
          entidade: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          finalizado_em: string | null
          id: string
          iniciado_em: string | null
          mensagem_erro: string | null
          registros_com_erro: number | null
          registros_processados: number | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          empresa_id?: string | null
          entidade?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string | null
          mensagem_erro?: string | null
          registros_com_erro?: number | null
          registros_processados?: number | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          empresa_id?: string | null
          entidade?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string | null
          mensagem_erro?: string | null
          registros_com_erro?: number | null
          registros_processados?: number | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bitrix_sync_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      bitrix_webhook_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          received_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          received_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          received_at?: string | null
        }
        Relationships: []
      }
      bitrix24_activities: {
        Row: {
          activity_id: number
          activity_type: string
          created_at: string
          deal_id: number
          id: string
          order_id: string | null
          subject: string
        }
        Insert: {
          activity_id: number
          activity_type: string
          created_at?: string
          deal_id: number
          id?: string
          order_id?: string | null
          subject: string
        }
        Update: {
          activity_id?: number
          activity_type?: string
          created_at?: string
          deal_id?: number
          id?: string
          order_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitrix24_activities_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitrix24_activities_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitrix24_activities_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      bitrix24_stage_mappings: {
        Row: {
          bitrix_stage_id: string
          bitrix_stage_name: string | null
          created_at: string
          id: string
          lalamove_status: string
        }
        Insert: {
          bitrix_stage_id: string
          bitrix_stage_name?: string | null
          created_at?: string
          id?: string
          lalamove_status: string
        }
        Update: {
          bitrix_stage_id?: string
          bitrix_stage_name?: string | null
          created_at?: string
          id?: string
          lalamove_status?: string
        }
        Relationships: []
      }
      bitrix24_sync: {
        Row: {
          created_at: string
          deal_id: number
          id: string
          last_error: string | null
          last_synced_at: string
          order_id: string | null
          sync_status: string
          synced_fields: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: number
          id?: string
          last_error?: string | null
          last_synced_at?: string
          order_id?: string | null
          sync_status?: string
          synced_fields?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: number
          id?: string
          last_error?: string | null
          last_synced_at?: string
          order_id?: string | null
          sync_status?: string
          synced_fields?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitrix24_sync_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitrix24_sync_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitrix24_sync_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      bitrix24_tokens: {
        Row: {
          access_token: string
          created_at: string
          domain: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          domain: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          domain?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          attempts_count: number | null
          blocked_at: string | null
          blocked_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_permanent: boolean | null
          last_attempt_at: string | null
          metadata: Json | null
          reason: string
        }
        Insert: {
          attempts_count?: number | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_permanent?: boolean | null
          last_attempt_at?: string | null
          metadata?: Json | null
          reason: string
        }
        Update: {
          attempts_count?: number | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_permanent?: boolean | null
          last_attempt_at?: string | null
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      bloqueios_duplicidade: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          id: string
          motivo: string | null
          transacao_id: string | null
          valor_bloqueado: number | null
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          transacao_id?: string | null
          valor_bloqueado?: number | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          transacao_id?: string | null
          valor_bloqueado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      boletos: {
        Row: {
          agencia: string | null
          banco: string | null
          banco_nome: string | null
          bitrix_id: string | null
          bitrix_status: string | null
          cedente_cnpj: string | null
          cedente_nome: string | null
          codigo_barras: string | null
          conta: string | null
          conta_bancaria_id: string | null
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          data_emissao: string | null
          data_pagamento: string | null
          desconto: number | null
          descricao: string | null
          empresa_id: string | null
          eventos_pagamento: Json | null
          id: string
          juros_multa: number | null
          linha_digitavel: string | null
          nosso_numero: string | null
          numero: string | null
          observacoes: string | null
          rastreio_status: Json | null
          sacado_cpf_cnpj: string | null
          sacado_nome: string | null
          status: string | null
          updated_at: string | null
          url_pdf: string | null
          user_id: string
          valor: number
          valor_pago: number | null
          vencimento: string | null
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          banco_nome?: string | null
          bitrix_id?: string | null
          bitrix_status?: string | null
          cedente_cnpj?: string | null
          cedente_nome?: string | null
          codigo_barras?: string | null
          conta?: string | null
          conta_bancaria_id?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          desconto?: number | null
          descricao?: string | null
          empresa_id?: string | null
          eventos_pagamento?: Json | null
          id?: string
          juros_multa?: number | null
          linha_digitavel?: string | null
          nosso_numero?: string | null
          numero?: string | null
          observacoes?: string | null
          rastreio_status?: Json | null
          sacado_cpf_cnpj?: string | null
          sacado_nome?: string | null
          status?: string | null
          updated_at?: string | null
          url_pdf?: string | null
          user_id?: string
          valor?: number
          valor_pago?: number | null
          vencimento?: string | null
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          banco_nome?: string | null
          bitrix_id?: string | null
          bitrix_status?: string | null
          cedente_cnpj?: string | null
          cedente_nome?: string | null
          codigo_barras?: string | null
          conta?: string | null
          conta_bancaria_id?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          desconto?: number | null
          descricao?: string | null
          empresa_id?: string | null
          eventos_pagamento?: Json | null
          id?: string
          juros_multa?: number | null
          linha_digitavel?: string | null
          nosso_numero?: string | null
          numero?: string | null
          observacoes?: string | null
          rastreio_status?: Json | null
          sacado_cpf_cnpj?: string | null
          sacado_nome?: string | null
          status?: string | null
          updated_at?: string | null
          url_pdf?: string | null
          user_id?: string
          valor?: number
          valor_pago?: number | null
          vencimento?: string | null
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
            referencedColumns: ["conta_id"]
          },
          {
            foreignKeyName: "boletos_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletos_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
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
      budgets: {
        Row: {
          budgeted_amount: number | null
          category: string | null
          company_id: string | null
          created_at: string | null
          id: string
          period: string | null
          spent_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          budgeted_amount?: number | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          period?: string | null
          spent_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          budgeted_amount?: number | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          period?: string | null
          spent_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          empresa_id: string | null
          icone: string | null
          id: string
          nome: string
          plano_conta_id: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          empresa_id?: string | null
          icone?: string | null
          id?: string
          nome: string
          plano_conta_id?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          empresa_id?: string | null
          icone?: string | null
          id?: string
          nome?: string
          plano_conta_id?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
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
          ativo: boolean | null
          codigo: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          nome: string
          orcamento_previsto: number | null
          orcamento_realizado: number | null
          parent_id: string | null
          responsavel: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          orcamento_previsto?: number | null
          orcamento_realizado?: number | null
          parent_id?: string | null
          responsavel?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          orcamento_previsto?: number | null
          orcamento_realizado?: number | null
          parent_id?: string | null
          responsavel?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          ativo: boolean | null
          cidade: string | null
          cnpj_cpf: string | null
          contato: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          limite_credito: number | null
          nome: string | null
          nome_fantasia: string | null
          observacoes: string | null
          ramo_atividade: string | null
          razao_social: string | null
          score: number | null
          telefone: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          limite_credito?: number | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          ramo_atividade?: string | null
          razao_social?: string | null
          score?: number | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cidade?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          limite_credito?: number | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          ramo_atividade?: string | null
          razao_social?: string | null
          score?: number | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conciliacoes: {
        Row: {
          conta_bancaria_id: string | null
          created_at: string
          empresa_id: string | null
          id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          status: string
          total_conciliados: number | null
          user_id: string
        }
        Insert: {
          conta_bancaria_id?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string
          total_conciliados?: number | null
          user_id?: string
        }
        Update: {
          conta_bancaria_id?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string
          total_conciliados?: number | null
          user_id?: string
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
            referencedColumns: ["conta_id"]
          },
        ]
      }
      conciliacoes_parciais: {
        Row: {
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string
          id: string
          transacao_bancaria_id: string
          valor_parcial: number
        }
        Insert: {
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          transacao_bancaria_id: string
          valor_parcial: number
        }
        Update: {
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          transacao_bancaria_id?: string
          valor_parcial?: number
        }
        Relationships: []
      }
      configuracoes_aprovacao: {
        Row: {
          aprovadores_obrigatorios: number | null
          ativo: boolean | null
          created_at: string | null
          empresa_id: string | null
          id: string
          modulo: string | null
          updated_at: string | null
          valor_minimo: number | null
          valor_minimo_aprovacao: number | null
        }
        Insert: {
          aprovadores_obrigatorios?: number | null
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          modulo?: string | null
          updated_at?: string | null
          valor_minimo?: number | null
          valor_minimo_aprovacao?: number | null
        }
        Update: {
          aprovadores_obrigatorios?: number | null
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          modulo?: string | null
          updated_at?: string | null
          valor_minimo?: number | null
          valor_minimo_aprovacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_aprovacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_duplicidade: {
        Row: {
          ativo: boolean
          campos_validacao: Json
          created_at: string
          criado_por: string | null
          empresa_id: string | null
          fuzzy_matching: boolean
          id: string
          tolerancia_dias: number
          versao: number
        }
        Insert: {
          ativo?: boolean
          campos_validacao?: Json
          created_at?: string
          criado_por?: string | null
          empresa_id?: string | null
          fuzzy_matching?: boolean
          id?: string
          tolerancia_dias?: number
          versao?: number
        }
        Update: {
          ativo?: boolean
          campos_validacao?: Json
          created_at?: string
          criado_por?: string | null
          empresa_id?: string | null
          fuzzy_matching?: boolean
          id?: string
          tolerancia_dias?: number
          versao?: number
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          banco: string | null
          codigo_banco: string | null
          configuracoes_conciliacao: Json | null
          configuracoes_roteamento: Json | null
          conta: string | null
          cor: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          nome: string | null
          numero_conta: string | null
          saldo_atual: number
          saldo_disponivel: number | null
          saldo_inicial: number | null
          tipo_conta: string | null
          updated_at: string | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          banco?: string | null
          codigo_banco?: string | null
          configuracoes_conciliacao?: Json | null
          configuracoes_roteamento?: Json | null
          conta?: string | null
          cor?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string | null
          numero_conta?: string | null
          saldo_atual?: number
          saldo_disponivel?: number | null
          saldo_inicial?: number | null
          tipo_conta?: string | null
          updated_at?: string | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          banco?: string | null
          codigo_banco?: string | null
          configuracoes_conciliacao?: Json | null
          configuracoes_roteamento?: Json | null
          conta?: string | null
          cor?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string | null
          numero_conta?: string | null
          saldo_atual?: number
          saldo_disponivel?: number | null
          saldo_inicial?: number | null
          tipo_conta?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          anexo_url: string | null
          aprovado_por: string | null
          categoria: string | null
          categoria_id: string | null
          categoria_nome: string | null
          centro_custo_id: string | null
          centro_resultado: string | null
          conta_bancaria_id: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          deleted_at: string | null
          desconto: number | null
          descricao: string
          empresa_id: string | null
          forma_pagamento: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string
          juros: number | null
          metadata: Json | null
          multa: number | null
          numero_documento: string | null
          observacoes: string | null
          parcela_atual: number | null
          recorrente: boolean | null
          status: string | null
          tipo_cobranca: string | null
          total_parcelas: number | null
          transacao_conciliada_id: string | null
          updated_at: string | null
          user_id: string | null
          valor: number
          valor_pago: number | null
        }
        Insert: {
          anexo_url?: string | null
          aprovado_por?: string | null
          categoria?: string | null
          categoria_id?: string | null
          categoria_nome?: string | null
          centro_custo_id?: string | null
          centro_resultado?: string | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          deleted_at?: string | null
          desconto?: number | null
          descricao: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          juros?: number | null
          metadata?: Json | null
          multa?: number | null
          numero_documento?: string | null
          observacoes?: string | null
          parcela_atual?: number | null
          recorrente?: boolean | null
          status?: string | null
          tipo_cobranca?: string | null
          total_parcelas?: number | null
          transacao_conciliada_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor: number
          valor_pago?: number | null
        }
        Update: {
          anexo_url?: string | null
          aprovado_por?: string | null
          categoria?: string | null
          categoria_id?: string | null
          categoria_nome?: string | null
          centro_custo_id?: string | null
          centro_resultado?: string | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          deleted_at?: string | null
          desconto?: number | null
          descricao?: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          juros?: number | null
          metadata?: Json | null
          multa?: number | null
          numero_documento?: string | null
          observacoes?: string | null
          parcela_atual?: number | null
          recorrente?: boolean | null
          status?: string | null
          tipo_cobranca?: string | null
          total_parcelas?: number | null
          transacao_conciliada_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number
          valor_pago?: number | null
        }
        Relationships: [
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
          anexo_url: string | null
          categoria_id: string | null
          categoria_nome: string | null
          centro_custo_id: string | null
          chave_pix: string | null
          cliente_id: string | null
          cliente_nome: string | null
          conta_bancaria_id: string | null
          created_at: string | null
          data_emissao: string | null
          data_recebimento: string | null
          data_vencimento: string
          deleted_at: string | null
          desconto: number | null
          descricao: string
          empresa_id: string | null
          etapa_cobranca: string | null
          forma_recebimento: string | null
          id: string
          juros: number | null
          metadata: Json | null
          multa: number | null
          numero_documento: string | null
          numero_parcela_atual: number | null
          observacoes: string | null
          parcela_atual: number | null
          recorrente: boolean | null
          score: number | null
          status: string | null
          tipo_cobranca: string | null
          total_parcelas: number | null
          transacao_conciliada_id: string | null
          updated_at: string | null
          user_id: string | null
          valor: number
          valor_desconto: number | null
          valor_recebido: number | null
          vendedor_id: string | null
        }
        Insert: {
          anexo_url?: string | null
          categoria_id?: string | null
          categoria_nome?: string | null
          centro_custo_id?: string | null
          chave_pix?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          deleted_at?: string | null
          desconto?: number | null
          descricao: string
          empresa_id?: string | null
          etapa_cobranca?: string | null
          forma_recebimento?: string | null
          id?: string
          juros?: number | null
          metadata?: Json | null
          multa?: number | null
          numero_documento?: string | null
          numero_parcela_atual?: number | null
          observacoes?: string | null
          parcela_atual?: number | null
          recorrente?: boolean | null
          score?: number | null
          status?: string | null
          tipo_cobranca?: string | null
          total_parcelas?: number | null
          transacao_conciliada_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor: number
          valor_desconto?: number | null
          valor_recebido?: number | null
          vendedor_id?: string | null
        }
        Update: {
          anexo_url?: string | null
          categoria_id?: string | null
          categoria_nome?: string | null
          centro_custo_id?: string | null
          chave_pix?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          deleted_at?: string | null
          desconto?: number | null
          descricao?: string
          empresa_id?: string | null
          etapa_cobranca?: string | null
          forma_recebimento?: string | null
          id?: string
          juros?: number | null
          metadata?: Json | null
          multa?: number | null
          numero_documento?: string | null
          numero_parcela_atual?: number | null
          observacoes?: string | null
          parcela_atual?: number | null
          recorrente?: boolean | null
          score?: number | null
          status?: string | null
          tipo_cobranca?: string | null
          total_parcelas?: number | null
          transacao_conciliada_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number
          valor_desconto?: number | null
          valor_recebido?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string
          empresa_id: string | null
          id: string
          numero_contrato: string | null
          renovacao_automatica: boolean | null
          status: string | null
          tipo: string | null
          user_id: string | null
          valor_mensal: number | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao: string
          empresa_id?: string | null
          id?: string
          numero_contrato?: string | null
          renovacao_automatica?: boolean | null
          status?: string | null
          tipo?: string | null
          user_id?: string | null
          valor_mensal?: number | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string
          empresa_id?: string | null
          id?: string
          numero_contrato?: string | null
          renovacao_automatica?: boolean | null
          status?: string | null
          tipo?: string | null
          user_id?: string | null
          valor_mensal?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      creditos_tributarios: {
        Row: {
          competencia_origem: string | null
          created_at: string | null
          data_origem: string
          empresa_id: string | null
          id: string
          nota_fiscal_id: string | null
          saldo_disponivel: number
          status: string | null
          tipo_tributo: string
          valor_credito: number | null
          valor_utilizado: number | null
        }
        Insert: {
          competencia_origem?: string | null
          created_at?: string | null
          data_origem?: string
          empresa_id?: string | null
          id?: string
          nota_fiscal_id?: string | null
          saldo_disponivel?: number
          status?: string | null
          tipo_tributo: string
          valor_credito?: number | null
          valor_utilizado?: number | null
        }
        Update: {
          competencia_origem?: string | null
          created_at?: string | null
          data_origem?: string
          empresa_id?: string | null
          id?: string
          nota_fiscal_id?: string | null
          saldo_disponivel?: number
          status?: string | null
          tipo_tributo?: string
          valor_credito?: number | null
          valor_utilizado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
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
      cron_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          result: Json | null
          success: boolean | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          result?: Json | null
          success?: boolean | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          result?: Json | null
          success?: boolean | null
        }
        Relationships: []
      }
      custom_field_definitions: {
        Row: {
          active: boolean | null
          created_at: string | null
          empresa_id: string | null
          entity_type: string
          field_type: string
          id: string
          label: string
          name: string
          options: Json | null
          placeholder: string | null
          required: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          entity_type: string
          field_type?: string
          id?: string
          label: string
          name: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          entity_type?: string
          field_type?: string
          id?: string
          label?: string
          name?: string
          options?: Json | null
          placeholder?: string | null
          required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string | null
          definition_id: string | null
          entity_id: string
          field_value: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          definition_id?: string | null
          entity_id: string
          field_value?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          definition_id?: string | null
          entity_id?: string
          field_value?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      darfs: {
        Row: {
          alerta_id: string | null
          codigo_receita: string | null
          created_at: string | null
          data_vencimento: string | null
          descricao_receita: string | null
          id: string
          periodo_apuracao: string | null
          valor_principal: number | null
          valor_total: number | null
        }
        Insert: {
          alerta_id?: string | null
          codigo_receita?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao_receita?: string | null
          id?: string
          periodo_apuracao?: string | null
          valor_principal?: number | null
          valor_total?: number | null
        }
        Update: {
          alerta_id?: string | null
          codigo_receita?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao_receita?: string | null
          id?: string
          periodo_apuracao?: string | null
          valor_principal?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "darfs_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas_tributarios"
            referencedColumns: ["id"]
          },
        ]
      }
      dispositivos_conhecidos: {
        Row: {
          browser: string | null
          device_name: string | null
          id: string
          is_trusted: boolean | null
          last_login: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          device_name?: string | null
          id?: string
          is_trusted?: boolean | null
          last_login?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          device_name?: string | null
          id?: string
          is_trusted?: boolean | null
          last_login?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      divergencias_conciliacao: {
        Row: {
          conta_bancaria_id: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          recomendacao: string | null
          resolvida: boolean | null
          resolvida_em: string | null
          resolvida_por: string | null
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          tipo_divergencia: string | null
          transacao_id: string | null
          valor_divergencia: number | null
        }
        Insert: {
          conta_bancaria_id?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          recomendacao?: string | null
          resolvida?: boolean | null
          resolvida_em?: string | null
          resolvida_por?: string | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          tipo_divergencia?: string | null
          transacao_id?: string | null
          valor_divergencia?: number | null
        }
        Update: {
          conta_bancaria_id?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          recomendacao?: string | null
          resolvida?: boolean | null
          resolvida_em?: string | null
          resolvida_por?: string | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          tipo_divergencia?: string | null
          transacao_id?: string | null
          valor_divergencia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "divergencias_conciliacao_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "divergencias_conciliacao_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["conta_id"]
          },
          {
            foreignKeyName: "divergencias_conciliacao_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_approval_queue: {
        Row: {
          approval_priority:
            | Database["public"]["Enums"]["approval_priority"]
            | null
          decision_notes: string | null
          driver_id: string
          driver_name: string | null
          id: string
          notes: string | null
          order_id: string
          priority: number | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_factors: string[] | null
          risk_score: number
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          approval_priority?:
            | Database["public"]["Enums"]["approval_priority"]
            | null
          decision_notes?: string | null
          driver_id: string
          driver_name?: string | null
          id?: string
          notes?: string | null
          order_id: string
          priority?: number | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_factors?: string[] | null
          risk_score: number
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          approval_priority?:
            | Database["public"]["Enums"]["approval_priority"]
            | null
          decision_notes?: string | null
          driver_id?: string
          driver_name?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          priority?: number | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_factors?: string[] | null
          risk_score?: number
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "driver_approval_queue_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_approval_queue_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_approval_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_approval_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_approval_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_evaluations: {
        Row: {
          action_required: string | null
          approved: boolean
          auto_blocked: boolean
          completed_deliveries: number | null
          created_at: string
          driver_id: string
          evaluated_at: string
          failure_rate: number | null
          id: string
          incident_count: number | null
          order_id: string | null
          recommendation: string | null
          requires_manual: boolean
          risk_factors: Json
          risk_level: string
          risk_reasons: string[] | null
          risk_score: number
          total_deliveries: number | null
          triggered_by: string
        }
        Insert: {
          action_required?: string | null
          approved?: boolean
          auto_blocked?: boolean
          completed_deliveries?: number | null
          created_at?: string
          driver_id: string
          evaluated_at?: string
          failure_rate?: number | null
          id?: string
          incident_count?: number | null
          order_id?: string | null
          recommendation?: string | null
          requires_manual?: boolean
          risk_factors?: Json
          risk_level?: string
          risk_reasons?: string[] | null
          risk_score?: number
          total_deliveries?: number | null
          triggered_by?: string
        }
        Update: {
          action_required?: string | null
          approved?: boolean
          auto_blocked?: boolean
          completed_deliveries?: number | null
          created_at?: string
          driver_id?: string
          evaluated_at?: string
          failure_rate?: number | null
          id?: string
          incident_count?: number | null
          order_id?: string | null
          recommendation?: string | null
          requires_manual?: boolean
          risk_factors?: Json
          risk_level?: string
          risk_reasons?: string[] | null
          risk_score?: number
          total_deliveries?: number | null
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_evaluations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_evaluations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_evaluations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_evaluations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_evaluations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_incidents: {
        Row: {
          created_at: string
          description: string
          driver_id: string
          evidence_urls: string[] | null
          id: string
          metadata: Json | null
          order_id: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          type: Database["public"]["Enums"]["incident_type"]
        }
        Insert: {
          created_at?: string
          description: string
          driver_id: string
          evidence_urls?: string[] | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          type: Database["public"]["Enums"]["incident_type"]
        }
        Update: {
          created_at?: string
          description?: string
          driver_id?: string
          evidence_urls?: string[] | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          type?: Database["public"]["Enums"]["incident_type"]
        }
        Relationships: [
          {
            foreignKeyName: "driver_incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_incidents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_incidents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_incidents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy_meters: number | null
          heading_degrees: number | null
          id: number
          is_moving: boolean | null
          latitude: number
          longitude: number
          recorded_at: string
          speed_kmh: number | null
          tracking_id: string
        }
        Insert: {
          accuracy_meters?: number | null
          heading_degrees?: number | null
          id?: number
          is_moving?: boolean | null
          latitude: number
          longitude: number
          recorded_at?: string
          speed_kmh?: number | null
          tracking_id: string
        }
        Update: {
          accuracy_meters?: number | null
          heading_degrees?: number | null
          id?: number
          is_moving?: boolean | null
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed_kmh?: number | null
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "active_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          avg_delay_minutes: number | null
          blacklist_reason: string | null
          blacklisted: boolean | null
          cancelled_deliveries: number | null
          completed_deliveries: number | null
          created_at: string
          external_rating: number | null
          external_success_rate: number | null
          external_total_deliveries: number | null
          failed_deliveries: number | null
          failure_rate: number | null
          first_seen_at: string | null
          id: string
          lalamove_id: string | null
          last_active_at: string | null
          last_delivery_at: string | null
          last_evaluated_at: string | null
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          rating: number | null
          risk_level: string | null
          risk_reasons: Json | null
          risk_score: number | null
          status: Database["public"]["Enums"]["driver_status"]
          success_rate: number | null
          total_deliveries: number | null
          updated_at: string
          vehicle_plate: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          whitelisted: boolean | null
        }
        Insert: {
          avg_delay_minutes?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          cancelled_deliveries?: number | null
          completed_deliveries?: number | null
          created_at?: string
          external_rating?: number | null
          external_success_rate?: number | null
          external_total_deliveries?: number | null
          failed_deliveries?: number | null
          failure_rate?: number | null
          first_seen_at?: string | null
          id?: string
          lalamove_id?: string | null
          last_active_at?: string | null
          last_delivery_at?: string | null
          last_evaluated_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          risk_level?: string | null
          risk_reasons?: Json | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          success_rate?: number | null
          total_deliveries?: number | null
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          whitelisted?: boolean | null
        }
        Update: {
          avg_delay_minutes?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          cancelled_deliveries?: number | null
          completed_deliveries?: number | null
          created_at?: string
          external_rating?: number | null
          external_success_rate?: number | null
          external_total_deliveries?: number | null
          failed_deliveries?: number | null
          failure_rate?: number | null
          first_seen_at?: string | null
          id?: string
          lalamove_id?: string | null
          last_active_at?: string | null
          last_delivery_at?: string | null
          last_evaluated_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          risk_level?: string | null
          risk_reasons?: Json | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          success_rate?: number | null
          total_deliveries?: number | null
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          whitelisted?: boolean | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token_hash: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token_hash: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          logo_url: string | null
          nome_fantasia: string | null
          razao_social: string
          telefone: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social: string
          telefone?: string | null
          user_id?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          telefone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      evidencias_pacotes: {
        Row: {
          created_at: string | null
          id: string
          url: string | null
          verificacao_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          url?: string | null
          verificacao_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          url?: string | null
          verificacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_pacotes_verificacao_id_fkey"
            columns: ["verificacao_id"]
            isOneToOne: false
            referencedRelation: "verificacoes_conformidade"
            referencedColumns: ["id"]
          },
        ]
      }
      execucoes_cobranca: {
        Row: {
          canal: string | null
          cliente_nome: string | null
          conta_receber_id: string | null
          created_at: string
          destinatario: string | null
          empresa_id: string | null
          etapa: string | null
          id: string
          mensagem: string | null
          provider: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          canal?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string
          destinatario?: string | null
          empresa_id?: string | null
          etapa?: string | null
          id?: string
          mensagem?: string | null
          provider?: string | null
          status?: string | null
          user_id?: string
        }
        Update: {
          canal?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string
          destinatario?: string | null
          empresa_id?: string | null
          etapa?: string | null
          id?: string
          mensagem?: string | null
          provider?: string | null
          status?: string | null
          user_id?: string
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
      expert_conversations: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          id: string
          last_message_at: string | null
          resumo: string | null
          status: string | null
          titulo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          last_message_at?: string | null
          resumo?: string | null
          status?: string | null
          titulo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          last_message_at?: string | null
          resumo?: string | null
          status?: string | null
          titulo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_conversations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_messages: {
        Row: {
          actions: Json | null
          actions_executed: boolean | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          actions?: Json | null
          actions_executed?: boolean | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          actions?: Json | null
          actions_executed?: boolean | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
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
          arquivo_origem: string | null
          codigo_transacao: string | null
          conciliado: boolean
          conta_bancaria_id: string | null
          created_at: string
          data: string
          descricao: string
          hash_transacao: string | null
          id: string
          importado_de: string | null
          importado_em: string | null
          linha_arquivo: number | null
          numero_documento: string | null
          numero_documento_banco: string | null
          saldo: number | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          arquivo_origem?: string | null
          codigo_transacao?: string | null
          conciliado?: boolean
          conta_bancaria_id?: string | null
          created_at?: string
          data: string
          descricao: string
          hash_transacao?: string | null
          id?: string
          importado_de?: string | null
          importado_em?: string | null
          linha_arquivo?: number | null
          numero_documento?: string | null
          numero_documento_banco?: string | null
          saldo?: number | null
          tipo: string
          user_id?: string
          valor: number
        }
        Update: {
          arquivo_origem?: string | null
          codigo_transacao?: string | null
          conciliado?: boolean
          conta_bancaria_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          hash_transacao?: string | null
          id?: string
          importado_de?: string | null
          importado_em?: string | null
          linha_arquivo?: number | null
          numero_documento?: string | null
          numero_documento_banco?: string | null
          saldo?: number | null
          tipo?: string
          user_id?: string
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
            referencedColumns: ["conta_id"]
          },
        ]
      }
      faturamento_mensal: {
        Row: {
          ano: number | null
          created_at: string | null
          created_by: string | null
          empresa_id: string
          id: string
          impostos_federais: number | null
          impostos_municipais: number | null
          mes: number | null
          mes_referencia: string
          receita_bruta: number | null
          receita_exportacao: number | null
          receita_industria: number | null
          receita_revenda: number | null
          receita_servicos: number | null
          receita_vendas: number | null
          valor_faturamento: number | null
          valor_impostos: number | null
        }
        Insert: {
          ano?: number | null
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          id?: string
          impostos_federais?: number | null
          impostos_municipais?: number | null
          mes?: number | null
          mes_referencia: string
          receita_bruta?: number | null
          receita_exportacao?: number | null
          receita_industria?: number | null
          receita_revenda?: number | null
          receita_servicos?: number | null
          receita_vendas?: number | null
          valor_faturamento?: number | null
          valor_impostos?: number | null
        }
        Update: {
          ano?: number | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          id?: string
          impostos_federais?: number | null
          impostos_municipais?: number | null
          mes?: number | null
          mes_referencia?: string
          receita_bruta?: number | null
          receita_exportacao?: number | null
          receita_industria?: number | null
          receita_revenda?: number | null
          receita_servicos?: number | null
          receita_vendas?: number | null
          valor_faturamento?: number | null
          valor_impostos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faturamento_mensal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_conciliacao_ia: {
        Row: {
          acao: string
          created_at: string | null
          created_by: string | null
          feedback_texto: string | null
          id: string
          lancamento_descricao: string | null
          lancamento_entidade: string | null
          motivo_rejeicao: string | null
          score_original: number | null
          tipo_lancamento: string | null
          transacao_bancaria_id: string | null
          transacao_descricao: string | null
          transacao_id: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          created_by?: string | null
          feedback_texto?: string | null
          id?: string
          lancamento_descricao?: string | null
          lancamento_entidade?: string | null
          motivo_rejeicao?: string | null
          score_original?: number | null
          tipo_lancamento?: string | null
          transacao_bancaria_id?: string | null
          transacao_descricao?: string | null
          transacao_id?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          created_by?: string | null
          feedback_texto?: string | null
          id?: string
          lancamento_descricao?: string | null
          lancamento_entidade?: string | null
          motivo_rejeicao?: string | null
          score_original?: number | null
          tipo_lancamento?: string | null
          transacao_bancaria_id?: string | null
          transacao_descricao?: string | null
          transacao_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_conciliacao_ia_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_cobrancas: {
        Row: {
          canal: string | null
          cliente_id: string | null
          cliente_nome: string | null
          conta_receber_id: string | null
          created_at: string | null
          destinatario: string | null
          empresa_id: string | null
          etapa: string | null
          etapa_id: string | null
          id: string
          last_error: string | null
          max_tentativas: number
          provider: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          tentativas: number
          updated_at: string | null
        }
        Insert: {
          canal?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          destinatario?: string | null
          empresa_id?: string | null
          etapa?: string | null
          etapa_id?: string | null
          id?: string
          last_error?: string | null
          max_tentativas?: number
          provider?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
          tentativas?: number
          updated_at?: string | null
        }
        Update: {
          canal?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          destinatario?: string | null
          empresa_id?: string | null
          etapa?: string | null
          etapa_id?: string | null
          id?: string
          last_error?: string | null
          max_tentativas?: number
          provider?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          tentativas?: number
          updated_at?: string | null
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
            foreignKeyName: "fila_cobrancas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "regua_cobranca_etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      fluxos_aprovacao_niveis: {
        Row: {
          aprovadores_obrigatorios: number | null
          configuracao_id: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          nivel: number | null
          nome: string | null
          ordem: number | null
          role_responsavel: string | null
          valor_minimo: number | null
        }
        Insert: {
          aprovadores_obrigatorios?: number | null
          configuracao_id?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nivel?: number | null
          nome?: string | null
          ordem?: number | null
          role_responsavel?: string | null
          valor_minimo?: number | null
        }
        Update: {
          aprovadores_obrigatorios?: number | null
          configuracao_id?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          nivel?: number | null
          nome?: string | null
          ordem?: number | null
          role_responsavel?: string | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fluxos_aprovacao_niveis_configuracao_id_fkey"
            columns: ["configuracao_id"]
            isOneToOne: false
            referencedRelation: "configuracoes_aprovacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluxos_aprovacao_niveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_pagamento: {
        Row: {
          ano: number | null
          beneficios: number | null
          created_at: string | null
          created_by: string | null
          empresa_id: string
          encargos: number | null
          id: string
          mes: number | null
          mes_referencia: string
          pro_labore: number | null
          qtd_funcionarios: number | null
          salarios: number | null
          total_folha: number | null
          valor_total: number | null
        }
        Insert: {
          ano?: number | null
          beneficios?: number | null
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          encargos?: number | null
          id?: string
          mes?: number | null
          mes_referencia: string
          pro_labore?: number | null
          qtd_funcionarios?: number | null
          salarios?: number | null
          total_folha?: number | null
          valor_total?: number | null
        }
        Update: {
          ano?: number | null
          beneficios?: number | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          encargos?: number | null
          id?: string
          mes?: number | null
          mes_referencia?: string
          pro_labore?: number | null
          qtd_funcionarios?: number | null
          salarios?: number | null
          total_folha?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folha_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          empresa_id: string
          id: string
          nome: string
          tipo: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          empresa_id: string
          id?: string
          nome: string
          tipo?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cnpj: string | null
          created_at: string | null
          id: string
          nome_fantasia: string | null
          razao_social: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          nome_fantasia?: string | null
          razao_social?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs: {
        Row: {
          component_name: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          stack: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      geo_blocks: {
        Row: {
          block_type: string
          blocked_by: string | null
          country_code: string
          country_name: string
          created_at: string
          expires_at: string | null
          id: string
          is_blocked: boolean
          reason: string | null
          updated_at: string
        }
        Insert: {
          block_type?: string
          blocked_by?: string | null
          country_code: string
          country_name: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_blocked?: boolean
          reason?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: string
          blocked_by?: string | null
          country_code?: string
          country_name?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_blocked?: boolean
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      health_scores_operacionais: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          insights_md: string | null
          metadata: Json | null
          recomendacoes: Json | null
          score: number | null
          score_cadastros: number | null
          score_engajamento: number | null
          score_financeiro: number | null
          score_lgpd: number | null
          score_operacional: number | null
          score_total: number | null
          score_tributario: number | null
          snapshot_data: Json | null
          tendencia_pct: number | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          insights_md?: string | null
          metadata?: Json | null
          recomendacoes?: Json | null
          score?: number | null
          score_cadastros?: number | null
          score_engajamento?: number | null
          score_financeiro?: number | null
          score_lgpd?: number | null
          score_operacional?: number | null
          score_total?: number | null
          score_tributario?: number | null
          snapshot_data?: Json | null
          tendencia_pct?: number | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          insights_md?: string | null
          metadata?: Json | null
          recomendacoes?: Json | null
          score?: number | null
          score_cadastros?: number | null
          score_engajamento?: number | null
          score_financeiro?: number | null
          score_lgpd?: number | null
          score_operacional?: number | null
          score_total?: number | null
          score_tributario?: number | null
          snapshot_data?: Json | null
          tendencia_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_scores_operacionais_empresa_id_fkey"
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
          created_at: string | null
          duracao_ms: number | null
          empresa_id: string | null
          id: string
          insights: Json | null
          modelo_usado: string | null
          recomendacoes: Json | null
          resumo_executivo: string | null
          score_saude_financeira: number | null
          tipo_analise: string | null
          user_id: string | null
        }
        Insert: {
          alertas_gerados?: number | null
          created_at?: string | null
          duracao_ms?: number | null
          empresa_id?: string | null
          id?: string
          insights?: Json | null
          modelo_usado?: string | null
          recomendacoes?: Json | null
          resumo_executivo?: string | null
          score_saude_financeira?: number | null
          tipo_analise?: string | null
          user_id?: string | null
        }
        Update: {
          alertas_gerados?: number | null
          created_at?: string | null
          duracao_ms?: number | null
          empresa_id?: string | null
          id?: string
          insights?: Json | null
          modelo_usado?: string | null
          recomendacoes?: Json | null
          resumo_executivo?: string | null
          score_saude_financeira?: number | null
          tipo_analise?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      historico_cobranca: {
        Row: {
          canal: string | null
          cliente_id: string | null
          conta_receber_id: string | null
          created_at: string | null
          destinatario: string | null
          empresa_id: string | null
          etapa: string | null
          evento: string | null
          fila_id: string | null
          id: string
          mensagem: string | null
          metadata: Json | null
          provider: string | null
          provider_message_id: string | null
          status: string | null
        }
        Insert: {
          canal?: string | null
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          destinatario?: string | null
          empresa_id?: string | null
          etapa?: string | null
          evento?: string | null
          fila_id?: string | null
          id?: string
          mensagem?: string | null
          metadata?: Json | null
          provider?: string | null
          provider_message_id?: string | null
          status?: string | null
        }
        Update: {
          canal?: string | null
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          destinatario?: string | null
          empresa_id?: string | null
          etapa?: string | null
          evento?: string | null
          fila_id?: string | null
          id?: string
          mensagem?: string | null
          metadata?: Json | null
          provider?: string | null
          provider_message_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_cobranca_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "historico_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_cobranca_whatsapp: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          lido_em: string | null
          mensagem: string
          metadata: Json | null
          status: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          lido_em?: string | null
          mensagem: string
          metadata?: Json | null
          status?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          lido_em?: string | null
          mensagem?: string
          metadata?: Json | null
          status?: string | null
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
            foreignKeyName: "historico_cobranca_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_cobrancas_boletos: {
        Row: {
          boleto_id: string | null
          conta_receber_id: string | null
          created_at: string
          descricao: string | null
          id: string
          metadados: Json | null
          tipo_evento: string
          user_id: string | null
        }
        Insert: {
          boleto_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          metadados?: Json | null
          tipo_evento: string
          user_id?: string | null
        }
        Update: {
          boleto_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          metadados?: Json | null
          tipo_evento?: string
          user_id?: string | null
        }
        Relationships: []
      }
      historico_conciliacao_ia: {
        Row: {
          acao: string | null
          analise_ia: string | null
          aprovado_por: string | null
          confianca: string | null
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          motivos: Json | null
          resultado: Json | null
          score: number | null
          score_ia: number | null
          sessao_id: string | null
          tipo_lancamento: string | null
          transacao_bancaria_id: string | null
          transacao_id: string | null
        }
        Insert: {
          acao?: string | null
          analise_ia?: string | null
          aprovado_por?: string | null
          confianca?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          motivos?: Json | null
          resultado?: Json | null
          score?: number | null
          score_ia?: number | null
          sessao_id?: string | null
          tipo_lancamento?: string | null
          transacao_bancaria_id?: string | null
          transacao_id?: string | null
        }
        Update: {
          acao?: string | null
          analise_ia?: string | null
          aprovado_por?: string | null
          confianca?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          motivos?: Json | null
          resultado?: Json | null
          score?: number | null
          score_ia?: number | null
          sessao_id?: string | null
          tipo_lancamento?: string | null
          transacao_bancaria_id?: string | null
          transacao_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "historico_conciliacao_ia_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes_conciliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          added_by: string | null
          cidr_range: string | null
          created_at: string | null
          description: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          cidr_range?: string | null
          created_at?: string | null
          description: string
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          cidr_range?: string | null
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      itens_pedido_compra: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          pedido_id: string
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          pedido_id: string
          quantidade?: number
          valor_unitario?: number
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          pedido_id?: string
          quantidade?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_compra_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      lalamove_orders: {
        Row: {
          actual_delivery: string | null
          bitrix24_deal_id: number | null
          cost_center: string | null
          created_at: string
          currency: string
          custom_rating: number | null
          customer_name: string
          customer_phone: string | null
          delay_minutes: number | null
          delivery_address: string
          delivery_latitude: number | null
          delivery_longitude: number | null
          department: string | null
          distance_meters: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_delivery: string | null
          id: string
          internal_notes: string | null
          internal_order_id: string | null
          internal_status: string | null
          is_urgent: boolean | null
          lalamove_id: string
          metadata: Json | null
          outcome: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          quotation_id: string | null
          scheduled_at: string
          share_link: string | null
          status: Database["public"]["Enums"]["order_status"]
          tags: string[] | null
          total_cost: number
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          actual_delivery?: string | null
          bitrix24_deal_id?: number | null
          cost_center?: string | null
          created_at?: string
          currency?: string
          custom_rating?: number | null
          customer_name: string
          customer_phone?: string | null
          delay_minutes?: number | null
          delivery_address: string
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          department?: string | null
          distance_meters?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_delivery?: string | null
          id?: string
          internal_notes?: string | null
          internal_order_id?: string | null
          internal_status?: string | null
          is_urgent?: boolean | null
          lalamove_id: string
          metadata?: Json | null
          outcome?: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          quotation_id?: string | null
          scheduled_at?: string
          share_link?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tags?: string[] | null
          total_cost?: number
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          actual_delivery?: string | null
          bitrix24_deal_id?: number | null
          cost_center?: string | null
          created_at?: string
          currency?: string
          custom_rating?: number | null
          customer_name?: string
          customer_phone?: string | null
          delay_minutes?: number | null
          delivery_address?: string
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          department?: string | null
          distance_meters?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_delivery?: string | null
          id?: string
          internal_notes?: string | null
          internal_order_id?: string | null
          internal_status?: string | null
          is_urgent?: boolean | null
          lalamove_id?: string
          metadata?: Json | null
          outcome?: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          quotation_id?: string | null
          scheduled_at?: string
          share_link?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tags?: string[] | null
          total_cost?: number
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lalamove_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lalamove_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      lalamove_status_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          old_status: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          old_status?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          old_status?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lalamove_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lalamove_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lalamove_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      lalamove_stops: {
        Row: {
          address: string
          arrived_at: string | null
          completed_at: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          order_id: string
          pod_delivered_at: string | null
          pod_image_url: string | null
          pod_status: string | null
          remarks: string | null
          stop_index: number
        }
        Insert: {
          address: string
          arrived_at?: string | null
          completed_at?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          order_id: string
          pod_delivered_at?: string | null
          pod_image_url?: string | null
          pod_status?: string | null
          remarks?: string | null
          stop_index: number
        }
        Update: {
          address?: string
          arrived_at?: string | null
          completed_at?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          order_id?: string
          pod_delivered_at?: string | null
          pod_image_url?: string | null
          pod_status?: string | null
          remarks?: string | null
          stop_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "lalamove_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lalamove_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lalamove_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      lalamove_uapi_sessions: {
        Row: {
          access_token: string
          city_id: number | null
          created_at: string | null
          ep_role: number | null
          id: string
          is_active: boolean | null
          last_refreshed_at: string | null
          refresh_method: string | null
          refresh_token: string
          token_expires_at: string
          token_obtained_at: string
          updated_at: string | null
          user_fid: string | null
        }
        Insert: {
          access_token: string
          city_id?: number | null
          created_at?: string | null
          ep_role?: number | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          refresh_method?: string | null
          refresh_token: string
          token_expires_at?: string
          token_obtained_at?: string
          updated_at?: string | null
          user_fid?: string | null
        }
        Update: {
          access_token?: string
          city_id?: number | null
          created_at?: string | null
          ep_role?: number | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          refresh_method?: string | null
          refresh_token?: string
          token_expires_at?: string
          token_obtained_at?: string
          updated_at?: string | null
          user_fid?: string | null
        }
        Relationships: []
      }
      lancamentos_contabeis: {
        Row: {
          created_at: string
          data_lancamento: string
          empresa_id: string | null
          historico: string | null
          id: string
          numero_lancamento: number | null
          origem: string | null
          status: string
          user_id: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_lancamento?: string
          empresa_id?: string | null
          historico?: string | null
          id?: string
          numero_lancamento?: number | null
          origem?: string | null
          status?: string
          user_id?: string
          valor_total?: number
        }
        Update: {
          created_at?: string
          data_lancamento?: string
          empresa_id?: string | null
          historico?: string | null
          id?: string
          numero_lancamento?: number | null
          origem?: string | null
          status?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_count: number
          block_reason: string | null
          blocked_reason: string | null
          created_at: string
          email: string
          first_attempt_at: string
          id: string
          ip_address: unknown
          is_suspicious: boolean | null
          last_attempt_at: string
          locked_until: string | null
          success: boolean | null
          user_agent: string | null
          user_email: string | null
        }
        Insert: {
          attempt_count?: number
          block_reason?: string | null
          blocked_reason?: string | null
          created_at?: string
          email: string
          first_attempt_at?: string
          id?: string
          ip_address?: unknown
          is_suspicious?: boolean | null
          last_attempt_at?: string
          locked_until?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
        }
        Update: {
          attempt_count?: number
          block_reason?: string | null
          blocked_reason?: string | null
          created_at?: string
          email?: string
          first_attempt_at?: string
          id?: string
          ip_address?: unknown
          is_suspicious?: boolean | null
          last_attempt_at?: string
          locked_until?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      logs_baixa_automatica: {
        Row: {
          conta_receber_id: string | null
          created_at: string
          detalhes: Json | null
          id: string
          mensagem: string | null
          resultado: string | null
          user_id: string
        }
        Insert: {
          conta_receber_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          mensagem?: string | null
          resultado?: string | null
          user_id?: string
        }
        Update: {
          conta_receber_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          mensagem?: string | null
          resultado?: string | null
          user_id?: string
        }
        Relationships: []
      }
      logs_conciliacao_retroativa: {
        Row: {
          conta_bancaria_id: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          divergencias_encontradas: number | null
          empresa_id: string | null
          erro_detalhe: string | null
          id: string
          progresso: number | null
          status: string
          total_conciliado: number | null
          total_processado: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conta_bancaria_id?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          divergencias_encontradas?: number | null
          empresa_id?: string | null
          erro_detalhe?: string | null
          id?: string
          progresso?: number | null
          status?: string
          total_conciliado?: number | null
          total_processado?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          conta_bancaria_id?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          divergencias_encontradas?: number | null
          empresa_id?: string | null
          erro_detalhe?: string | null
          id?: string
          progresso?: number | null
          status?: string
          total_conciliado?: number | null
          total_processado?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_conciliacao_retroativa_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_conciliacao_retroativa_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["conta_id"]
          },
        ]
      }
      metas_financeiras: {
        Row: {
          ano: number
          created_at: string | null
          empresa_id: string | null
          id: string
          mes: number
          tipo: string
          titulo: string
          user_id: string | null
          valor_meta: number
        }
        Insert: {
          ano: number
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          mes: number
          tipo: string
          titulo: string
          user_id?: string | null
          valor_meta: number
        }
        Update: {
          ano?: number
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          mes?: number
          tipo?: string
          titulo?: string
          user_id?: string | null
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          factor_id: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          factor_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          created_at: string | null
          data_movimentacao: string | null
          deleted_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          tipo: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_movimentacao?: string | null
          deleted_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          tipo?: string | null
          valor?: number
        }
        Update: {
          created_at?: string | null
          data_movimentacao?: string | null
          deleted_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          tipo?: string | null
          valor?: number
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
      negativacoes: {
        Row: {
          bureau: string | null
          cliente_id: string | null
          conta_receber_id: string | null
          created_at: string | null
          data_baixa: string | null
          data_negativacao: string | null
          empresa_id: string | null
          id: string
          motivo: string | null
          protocolo: string | null
          status: string
          valor: number
        }
        Insert: {
          bureau?: string | null
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          data_baixa?: string | null
          data_negativacao?: string | null
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          protocolo?: string | null
          status?: string
          valor: number
        }
        Update: {
          bureau?: string | null
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          data_baixa?: string | null
          data_negativacao?: string | null
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          protocolo?: string | null
          status?: string
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
        ]
      }
      new_device_alerts: {
        Row: {
          created_at: string | null
          device_id: string | null
          email_sent: boolean | null
          id: string
          ip_address: unknown
          sent_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          email_sent?: boolean | null
          id?: string
          ip_address?: unknown
          sent_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          email_sent?: boolean | null
          id?: string
          ip_address?: unknown
          sent_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "new_device_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          chave_acesso: string | null
          created_at: string | null
          data_emissao: string | null
          empresa_id: string | null
          id: string
          numero: string | null
          serie: string | null
          status: string | null
          valor_icms: number | null
          valor_produtos: number | null
          valor_total: number | null
          xml_url: string | null
        }
        Insert: {
          chave_acesso?: string | null
          created_at?: string | null
          data_emissao?: string | null
          empresa_id?: string | null
          id?: string
          numero?: string | null
          serie?: string | null
          status?: string | null
          valor_icms?: number | null
          valor_produtos?: number | null
          valor_total?: number | null
          xml_url?: string | null
        }
        Update: {
          chave_acesso?: string | null
          created_at?: string | null
          data_emissao?: string | null
          empresa_id?: string | null
          id?: string
          numero?: string | null
          serie?: string | null
          status?: string | null
          valor_icms?: number | null
          valor_produtos?: number | null
          valor_total?: number | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      operacoes_tributaveis: {
        Row: {
          cbs_aliquota: number | null
          cbs_credito: number | null
          cbs_valor: number | null
          cofins_valor: number | null
          created_at: string | null
          data_operacao: string | null
          empresa_id: string | null
          ibs_aliquota: number | null
          ibs_credito: number | null
          ibs_valor: number | null
          icms_valor: number | null
          id: string
          is_valor: number | null
          iss_valor: number | null
          pis_valor: number | null
          status: string | null
          tipo_operacao: string | null
          valor_total: number | null
        }
        Insert: {
          cbs_aliquota?: number | null
          cbs_credito?: number | null
          cbs_valor?: number | null
          cofins_valor?: number | null
          created_at?: string | null
          data_operacao?: string | null
          empresa_id?: string | null
          ibs_aliquota?: number | null
          ibs_credito?: number | null
          ibs_valor?: number | null
          icms_valor?: number | null
          id?: string
          is_valor?: number | null
          iss_valor?: number | null
          pis_valor?: number | null
          status?: string | null
          tipo_operacao?: string | null
          valor_total?: number | null
        }
        Update: {
          cbs_aliquota?: number | null
          cbs_credito?: number | null
          cbs_valor?: number | null
          cofins_valor?: number | null
          created_at?: string | null
          data_operacao?: string | null
          empresa_id?: string | null
          ibs_aliquota?: number | null
          ibs_credito?: number | null
          ibs_valor?: number | null
          icms_valor?: number | null
          id?: string
          is_valor?: number | null
          iss_valor?: number | null
          pis_valor?: number | null
          status?: string | null
          tipo_operacao?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas_acordo: {
        Row: {
          acordo_id: string | null
          created_at: string | null
          data_vencimento: string
          id: string
          numero_parcela: number
          status: string | null
          valor: number
        }
        Insert: {
          acordo_id?: string | null
          created_at?: string | null
          data_vencimento: string
          id?: string
          numero_parcela: number
          status?: string | null
          valor: number
        }
        Update: {
          acordo_id?: string | null
          created_at?: string | null
          data_vencimento?: string
          id?: string
          numero_parcela?: number
          status?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_acordo_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos_parcelamento"
            referencedColumns: ["id"]
          },
        ]
      }
      partidas_contabeis: {
        Row: {
          conta_contabil_id: string | null
          created_at: string | null
          id: string
          lancamento_id: string | null
          tipo: string
          valor: number
        }
        Insert: {
          conta_contabil_id?: string | null
          created_at?: string | null
          id?: string
          lancamento_id?: string | null
          tipo: string
          valor: number
        }
        Update: {
          conta_contabil_id?: string | null
          created_at?: string | null
          id?: string
          lancamento_id?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "partidas_contabeis_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_contabeis"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          motivo_rejeicao: string | null
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          solicitado_em: string | null
          status: string
          user_agent: string | null
          user_email: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          motivo_rejeicao?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          solicitado_em?: string | null
          status?: string
          user_agent?: string | null
          user_email: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          motivo_rejeicao?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          solicitado_em?: string | null
          status?: string
          user_agent?: string | null
          user_email?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pedidos_compra: {
        Row: {
          created_at: string | null
          data_emissao: string | null
          empresa_id: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          previsao_entrega: string | null
          status: string
          valor_total: number
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string | null
          empresa_id?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          previsao_entrega?: string | null
          status?: string
          valor_total?: number
        }
        Update: {
          created_at?: string | null
          data_emissao?: string | null
          empresa_id?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          previsao_entrega?: string | null
          status?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      pix_templates: {
        Row: {
          ativo: boolean
          beneficiario_nome: string
          chave_pix: string
          cidade: string
          created_at: string | null
          empresa_id: string | null
          id: string
          instrucoes: string | null
          nome: string
          tipo_chave: string
        }
        Insert: {
          ativo?: boolean
          beneficiario_nome: string
          chave_pix: string
          cidade: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          instrucoes?: string | null
          nome: string
          tipo_chave: string
        }
        Update: {
          ativo?: boolean
          beneficiario_nome?: string
          chave_pix?: string
          cidade?: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          instrucoes?: string | null
          nome?: string
          tipo_chave?: string
        }
        Relationships: []
      }
      plano_contas: {
        Row: {
          ativo: boolean | null
          centro_resultado: string | null
          codigo: string
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          natureza: string | null
          nome: string
          tipo: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          centro_resultado?: string | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          natureza?: string | null
          nome: string
          tipo?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          centro_resultado?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          natureza?: string | null
          nome?: string
          tipo?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_cliente_acessos: {
        Row: {
          acao: string | null
          cliente_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          token_id: string | null
          user_agent: string | null
        }
        Insert: {
          acao?: string | null
          cliente_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          token_id?: string | null
          user_agent?: string | null
        }
        Update: {
          acao?: string | null
          cliente_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          token_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
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
          email_cliente: string | null
          expires_at: string | null
          id: string
          token: string
          ultimo_acesso: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cliente_id?: string | null
          created_at?: string
          email_cliente?: string | null
          expires_at?: string | null
          id?: string
          token: string
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: string | null
          created_at?: string
          email_cliente?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prejuizos_fiscais: {
        Row: {
          ano_origem: number | null
          created_at: string | null
          created_by: string | null
          empresa_id: string
          id: string
          periodo: string
          saldo_atual: number | null
          saldo_disponivel: number | null
          status: string | null
          tipo: string | null
          valor_acumulado: number | null
          valor_compensado: number | null
          valor_original: number | null
          valor_utilizado: number | null
        }
        Insert: {
          ano_origem?: number | null
          created_at?: string | null
          created_by?: string | null
          empresa_id: string
          id?: string
          periodo: string
          saldo_atual?: number | null
          saldo_disponivel?: number | null
          status?: string | null
          tipo?: string | null
          valor_acumulado?: number | null
          valor_compensado?: number | null
          valor_original?: number | null
          valor_utilizado?: number | null
        }
        Update: {
          ano_origem?: number | null
          created_at?: string | null
          created_by?: string | null
          empresa_id?: string
          id?: string
          periodo?: string
          saldo_atual?: number | null
          saldo_disponivel?: number | null
          status?: string | null
          tipo?: string | null
          valor_acumulado?: number | null
          valor_compensado?: number | null
          valor_original?: number | null
          valor_utilizado?: number | null
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
          created_at: string
          email: string | null
          empresa_id: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      protestos: {
        Row: {
          cartorio: string | null
          cidade_cartorio: string | null
          cliente_id: string | null
          conta_receber_id: string | null
          created_at: string | null
          custas: number | null
          data_cancelamento: string | null
          data_protesto: string | null
          empresa_id: string | null
          estado_cartorio: string | null
          id: string
          numero_protesto: string | null
          status: string
          valor: number
        }
        Insert: {
          cartorio?: string | null
          cidade_cartorio?: string | null
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          custas?: number | null
          data_cancelamento?: string | null
          data_protesto?: string | null
          empresa_id?: string | null
          estado_cartorio?: string | null
          id?: string
          numero_protesto?: string | null
          status?: string
          valor: number
        }
        Update: {
          cartorio?: string | null
          cidade_cartorio?: string | null
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          custas?: number | null
          data_cancelamento?: string | null
          data_protesto?: string | null
          empresa_id?: string | null
          estado_cartorio?: string | null
          id?: string
          numero_protesto?: string | null
          status?: string
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
        ]
      }
      query_telemetry: {
        Row: {
          count_mode: string | null
          created_at: string
          duration_ms: number
          error_message: string | null
          id: string
          operation: string
          query_limit: number | null
          query_offset: number | null
          record_count: number | null
          rpc_name: string | null
          severity: string
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          count_mode?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          operation?: string
          query_limit?: number | null
          query_offset?: number | null
          record_count?: number | null
          rpc_name?: string | null
          severity?: string
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          count_mode?: string | null
          created_at?: string
          duration_ms?: number
          error_message?: string | null
          id?: string
          operation?: string
          query_limit?: number | null
          query_offset?: number | null
          record_count?: number | null
          rpc_name?: string | null
          severity?: string
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          request_count: number | null
          user_agent: string | null
          user_id: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: unknown
          request_count?: number | null
          user_agent?: string | null
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          request_count?: number | null
          user_agent?: string | null
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      regimes_especiais_empresa: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_inicio: string | null
          empresa_id: string | null
          id: string
          reducao_cbs: number | null
          reducao_ibs: number | null
          regime_nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicio?: string | null
          empresa_id?: string | null
          id?: string
          reducao_cbs?: number | null
          reducao_ibs?: number | null
          regime_nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicio?: string | null
          empresa_id?: string | null
          id?: string
          reducao_cbs?: number | null
          reducao_ibs?: number | null
          regime_nome?: string
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
      regimes_tributarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_inicio: string | null
          empresa_id: string | null
          id: string
          reducao_cbs: number | null
          reducao_ibs: number | null
          regime_nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicio?: string | null
          empresa_id?: string | null
          id?: string
          reducao_cbs?: number | null
          reducao_ibs?: number | null
          regime_nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicio?: string | null
          empresa_id?: string | null
          id?: string
          reducao_cbs?: number | null
          reducao_ibs?: number | null
          regime_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "regimes_tributarios_empresa_id_fkey"
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
          categoria_id: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          empresa_id: string | null
          entidade_nome: string | null
          id: string
          lancamento_tipo: string | null
          nome: string
          padrao_descricao: string | null
          user_id: string | null
          valor_exato: number | null
          vezes_aplicada: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          empresa_id?: string | null
          entidade_nome?: string | null
          id?: string
          lancamento_tipo?: string | null
          nome: string
          padrao_descricao?: string | null
          user_id?: string | null
          valor_exato?: number | null
          vezes_aplicada?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          empresa_id?: string | null
          entidade_nome?: string | null
          id?: string
          lancamento_tipo?: string | null
          nome?: string
          padrao_descricao?: string | null
          user_id?: string | null
          valor_exato?: number | null
          vezes_aplicada?: number | null
        }
        Relationships: []
      }
      regras_duplicidade: {
        Row: {
          ativa: boolean | null
          campos_validacao: string[]
          created_at: string | null
          empresa_id: string
          id: string
          tempo_bloqueio_minutos: number | null
        }
        Insert: {
          ativa?: boolean | null
          campos_validacao: string[]
          created_at?: string | null
          empresa_id: string
          id?: string
          tempo_bloqueio_minutos?: number | null
        }
        Update: {
          ativa?: boolean | null
          campos_validacao?: string[]
          created_at?: string | null
          empresa_id?: string
          id?: string
          tempo_bloqueio_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "regras_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_roteamento_financeiro: {
        Row: {
          ativa: boolean | null
          condicoes: Json | null
          conta_bancaria_id: string | null
          created_at: string | null
          empresa_id: string
          id: string
          nome: string
          prioridade: number | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          condicoes?: Json | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          nome: string
          prioridade?: number | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          condicoes?: Json | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          prioridade?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regras_roteamento_financeiro_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["conta_id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      regua_cobranca: {
        Row: {
          ativo: boolean
          auto_executar: boolean | null
          canais: string[] | null
          created_at: string | null
          descricao: string | null
          dias_gatilho: number[] | null
          empresa_id: string | null
          etapa: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          auto_executar?: boolean | null
          canais?: string[] | null
          created_at?: string | null
          descricao?: string | null
          dias_gatilho?: number[] | null
          empresa_id?: string | null
          etapa?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          auto_executar?: boolean | null
          canais?: string[] | null
          created_at?: string | null
          descricao?: string | null
          dias_gatilho?: number[] | null
          empresa_id?: string | null
          etapa?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      regua_cobranca_etapas: {
        Row: {
          ativo: boolean
          created_at: string | null
          dias_offset: number
          id: string
          ordem: number
          regua_id: string
          template_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          dias_offset: number
          id?: string
          ordem?: number
          regua_id: string
          template_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          dias_offset?: number
          id?: string
          ordem?: number
          regua_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regua_cobranca_etapas_regua_id_fkey"
            columns: ["regua_id"]
            isOneToOne: false
            referencedRelation: "regua_cobranca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regua_cobranca_etapas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates_cobranca"
            referencedColumns: ["id"]
          },
        ]
      }
      regua_cobranca_status: {
        Row: {
          conta_receber_id: string | null
          created_at: string | null
          data_ultima_acao: string | null
          empresa_id: string | null
          etapa_atual: string | null
          id: string
          proxima_acao_data: string | null
          status_cobranca: string | null
          updated_at: string | null
        }
        Insert: {
          conta_receber_id?: string | null
          created_at?: string | null
          data_ultima_acao?: string | null
          empresa_id?: string | null
          etapa_atual?: string | null
          id?: string
          proxima_acao_data?: string | null
          status_cobranca?: string | null
          updated_at?: string | null
        }
        Update: {
          conta_receber_id?: string | null
          created_at?: string | null
          data_ultima_acao?: string | null
          empresa_id?: string | null
          etapa_atual?: string | null
          id?: string
          proxima_acao_data?: string | null
          status_cobranca?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regua_cobranca_status_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      resumos_executivos_semanais: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          enviado_em: string | null
          id: string
          kpis: Json | null
          resumo_md: string
          semana_fim: string
          semana_inicio: string
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          enviado_em?: string | null
          id?: string
          kpis?: Json | null
          resumo_md: string
          semana_fim: string
          semana_inicio: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          enviado_em?: string | null
          id?: string
          kpis?: Json | null
          resumo_md?: string
          semana_fim?: string
          semana_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumos_executivos_semanais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      retencoes_fonte: {
        Row: {
          created_at: string | null
          data_fato_gerador: string | null
          empresa_id: string | null
          id: string
          tipo_imposto: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_fato_gerador?: string | null
          empresa_id?: string | null
          id?: string
          tipo_imposto?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_fato_gerador?: string | null
          empresa_id?: string | null
          id?: string
          tipo_imposto?: string | null
          valor?: number | null
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
      risk_rules: {
        Row: {
          condition: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          score_impact: number
          updated_at: string
        }
        Insert: {
          condition: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          score_impact: number
          updated_at?: string
        }
        Update: {
          condition?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          score_impact?: number
          updated_at?: string
        }
        Relationships: []
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
      runtime_error_logs: {
        Row: {
          app_version: string | null
          component_stack: string | null
          created_at: string
          error_id: string
          error_message: string
          error_name: string
          fingerprint: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          metadata: Json | null
          occurrence_count: number
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          component_stack?: string | null
          created_at?: string
          error_id: string
          error_message: string
          error_name: string
          fingerprint?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json | null
          occurrence_count?: number
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          component_stack?: string | null
          created_at?: string
          error_id?: string
          error_message?: string
          error_name?: string
          fingerprint?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json | null
          occurrence_count?: number
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          allowed_global_ips: Json
          created_at: string
          enable_geo_restriction: boolean | null
          id: string
          require_2fa: boolean
          restrict_by_ip: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allowed_global_ips?: Json
          created_at?: string
          enable_geo_restriction?: boolean | null
          id?: string
          require_2fa?: boolean
          restrict_by_ip?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allowed_global_ips?: Json
          created_at?: string
          enable_geo_restriction?: boolean | null
          id?: string
          require_2fa?: boolean
          restrict_by_ip?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sessoes_conciliacao: {
        Row: {
          conta_bancaria_id: string | null
          created_at: string
          empresa_id: string | null
          id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          status: string
          total_conciliados: number
          user_id: string
        }
        Insert: {
          conta_bancaria_id?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string
          total_conciliados?: number
          user_id?: string
        }
        Update: {
          conta_bancaria_id?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status?: string
          total_conciliados?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_conciliacao_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_conciliacao_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["conta_id"]
          },
        ]
      }
      solicitacoes_aprovacao: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          conta_pagar_id: string | null
          created_at: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          motivo_rejeicao: string | null
          observacoes: string | null
          solicitado_em: string | null
          solicitado_por: string | null
          status: string
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          conta_pagar_id?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          solicitado_em?: string | null
          solicitado_por?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          conta_pagar_id?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          motivo_rejeicao?: string | null
          observacoes?: string | null
          solicitado_em?: string | null
          solicitado_por?: string | null
          status?: string
          user_id?: string
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
      sso_login_attempts: {
        Row: {
          context: Json | null
          created_at: string | null
          email: string | null
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          provider_id: string | null
          success: boolean | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          email?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          provider_id?: string | null
          success?: boolean | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          email?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          provider_id?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      sso_providers: {
        Row: {
          ativo: boolean | null
          configuracoes: Json | null
          created_at: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          configuracoes?: Json | null
          created_at?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          configuracoes?: Json | null
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      templates_cobranca: {
        Row: {
          assunto: string | null
          ativo: boolean
          canal: string
          corpo: string
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          etapa: string | null
          id: string
          nome: string
          padrao: boolean | null
          provider: string | null
          tom: string | null
          updated_at: string | null
          variaveis_disponiveis: string[] | null
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean
          canal: string
          corpo: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          etapa?: string | null
          id?: string
          nome: string
          padrao?: boolean | null
          provider?: string | null
          tom?: string | null
          updated_at?: string | null
          variaveis_disponiveis?: string[] | null
        }
        Update: {
          assunto?: string | null
          ativo?: boolean
          canal?: string
          corpo?: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          etapa?: string | null
          id?: string
          nome?: string
          padrao?: boolean | null
          provider?: string | null
          tom?: string | null
          updated_at?: string | null
          variaveis_disponiveis?: string[] | null
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          created_at: string
          driver_id: string
          event_type: string | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          metadata: Json | null
          order_id: string
          speed: number | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          event_type?: string | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          metadata?: Json | null
          order_id: string
          speed?: number | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          event_type?: string | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          metadata?: Json | null
          order_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lalamove_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_operator_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_bancarias: {
        Row: {
          categoria_id: string | null
          compensacao_aceita_em: string | null
          compensacao_aceita_por: string | null
          compensacao_classificacao: string | null
          compensacao_evidencia_url: string | null
          compensacao_motivo: string | null
          compensacao_regra: string | null
          compensacao_valor: number | null
          conciliada: boolean | null
          conta_bancaria_id: string | null
          created_at: string | null
          data: string
          deleted_at: string | null
          descricao: string
          id: string
          saldo: number | null
          status: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          compensacao_aceita_em?: string | null
          compensacao_aceita_por?: string | null
          compensacao_classificacao?: string | null
          compensacao_evidencia_url?: string | null
          compensacao_motivo?: string | null
          compensacao_regra?: string | null
          compensacao_valor?: number | null
          conciliada?: boolean | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data: string
          deleted_at?: string | null
          descricao: string
          id?: string
          saldo?: number | null
          status?: string
          tipo: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          compensacao_aceita_em?: string | null
          compensacao_aceita_por?: string | null
          compensacao_classificacao?: string | null
          compensacao_evidencia_url?: string | null
          compensacao_motivo?: string | null
          compensacao_regra?: string | null
          compensacao_valor?: number | null
          conciliada?: boolean | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data?: string
          deleted_at?: string | null
          descricao?: string
          id?: string
          saldo?: number | null
          status?: string
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      transferencias: {
        Row: {
          chave_pix: string | null
          conta_destino_id: string | null
          conta_origem_id: string | null
          created_at: string | null
          data_transferencia: string | null
          descricao: string | null
          empresa_id: string | null
          favorecido_nome: string | null
          id: string
          pix_chave_destino: string | null
          status: string | null
          tipo: string | null
          user_id: string | null
          valor: number
        }
        Insert: {
          chave_pix?: string | null
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string | null
          data_transferencia?: string | null
          descricao?: string | null
          empresa_id?: string | null
          favorecido_nome?: string | null
          id?: string
          pix_chave_destino?: string | null
          status?: string | null
          tipo?: string | null
          user_id?: string | null
          valor: number
        }
        Update: {
          chave_pix?: string | null
          conta_destino_id?: string | null
          conta_origem_id?: string | null
          created_at?: string | null
          data_transferencia?: string | null
          descricao?: string | null
          empresa_id?: string | null
          favorecido_nome?: string | null
          id?: string
          pix_chave_destino?: string | null
          status?: string | null
          tipo?: string | null
          user_id?: string | null
          valor?: number
        }
        Relationships: [
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
            referencedColumns: ["conta_id"]
          },
          {
            foreignKeyName: "transferencias_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["conta_id"]
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
      user_action_audit: {
        Row: {
          action_type: string
          created_at: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_anomalia_preferences: {
        Row: {
          centros_custo_silenciados: string[]
          created_at: string | null
          drawer_acoes: Json
          id: string
          silenciar_ate: string | null
          tipos_silenciados: string[]
          toast_acoes: Json
          toast_duracao_segundos: number
          toast_enabled: boolean
          toast_min_severidade: string
          toast_severidades_ativas: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          centros_custo_silenciados?: string[]
          created_at?: string | null
          drawer_acoes?: Json
          id?: string
          silenciar_ate?: string | null
          tipos_silenciados?: string[]
          toast_acoes?: Json
          toast_duracao_segundos?: number
          toast_enabled?: boolean
          toast_min_severidade?: string
          toast_severidades_ativas?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          centros_custo_silenciados?: string[]
          created_at?: string | null
          drawer_acoes?: Json
          id?: string
          silenciar_ate?: string | null
          tipos_silenciados?: string[]
          toast_acoes?: Json
          toast_duracao_segundos?: number
          toast_enabled?: boolean
          toast_min_severidade?: string
          toast_severidades_ativas?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          first_seen_at: string | null
          id: string
          ip_address: unknown
          is_trusted: boolean | null
          last_seen_at: string | null
          location_city: string | null
          location_country: string | null
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          first_seen_at?: string | null
          id?: string
          ip_address?: unknown
          is_trusted?: boolean | null
          last_seen_at?: string | null
          location_city?: string | null
          location_country?: string | null
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          first_seen_at?: string | null
          id?: string
          ip_address?: unknown
          is_trusted?: boolean | null
          last_seen_at?: string | null
          location_city?: string | null
          location_country?: string | null
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_filter_presets: {
        Row: {
          created_at: string | null
          entity_type: string | null
          filters: Json
          id: string
          is_default: boolean | null
          name: string
          screen_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_type?: string | null
          filters?: Json
          id?: string
          is_default?: boolean | null
          name: string
          screen_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_type?: string | null
          filters?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          screen_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_passkeys: {
        Row: {
          backed_up: boolean | null
          counter: number
          created_at: string
          credential_id: string
          device_type: string | null
          friendly_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id: string
          device_type?: string | null
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id?: string
          device_type?: string | null
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          last_active: string | null
          revoked: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          last_active?: string | null
          revoked?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          last_active?: string | null
          revoked?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string | null
          empresa_id: string | null
          id: string
          meta_mensal: number | null
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          meta_mensal?: number | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          meta_mensal?: number | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      verificacoes_conformidade: {
        Row: {
          checks_aprovados: number | null
          created_at: string | null
          empresa_id: string | null
          id: string
          itens: Json | null
          nivel: string | null
          periodo: string | null
          score: number | null
          status: string | null
          titulo: string
          total_checks: number | null
        }
        Insert: {
          checks_aprovados?: number | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          itens?: Json | null
          nivel?: string | null
          periodo?: string | null
          score?: number | null
          status?: string | null
          titulo: string
          total_checks?: number | null
        }
        Update: {
          checks_aprovados?: number | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          itens?: Json | null
          nivel?: string | null
          periodo?: string | null
          score?: number | null
          status?: string | null
          titulo?: string
          total_checks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verificacoes_conformidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number | null
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string | null
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number | null
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string | null
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number | null
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string | null
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          lalamove_order_id: string | null
          processed: boolean | null
          processed_at: string | null
          raw_payload: Json
          received_at: string
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: string
          lalamove_order_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          raw_payload: Json
          received_at?: string
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          lalamove_order_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          raw_payload?: Json
          received_at?: string
        }
        Relationships: []
      }
      webhooks_log: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json | null
          response: Json | null
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          response?: Json | null
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          response?: Json | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      whatsapp_conversas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          direcao: string | null
          empresa_id: string | null
          id: string
          intencao_pagamento: boolean | null
          mensagem: string
          resumo_ia: string | null
          sentimento: string | null
          status: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          direcao?: string | null
          empresa_id?: string | null
          id?: string
          intencao_pagamento?: boolean | null
          mensagem: string
          resumo_ia?: string | null
          sentimento?: string | null
          status?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          direcao?: string | null
          empresa_id?: string | null
          id?: string
          intencao_pagamento?: boolean | null
          mensagem?: string
          resumo_ia?: string | null
          sentimento?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      drivers_safe_view: {
        Row: {
          avg_delay_minutes: number | null
          blacklist_reason: string | null
          blacklisted: boolean | null
          cancelled_deliveries: number | null
          completed_deliveries: number | null
          created_at: string | null
          external_rating: number | null
          external_success_rate: number | null
          external_total_deliveries: number | null
          failed_deliveries: number | null
          failure_rate: number | null
          first_seen_at: string | null
          id: string | null
          lalamove_id: string | null
          last_active_at: string | null
          last_delivery_at: string | null
          last_evaluated_at: string | null
          name: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          rating: number | null
          risk_level: string | null
          risk_reasons: Json | null
          risk_score: number | null
          status: Database["public"]["Enums"]["driver_status"] | null
          success_rate: number | null
          total_deliveries: number | null
          updated_at: string | null
          vehicle_plate: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
          whitelisted: boolean | null
        }
        Insert: {
          avg_delay_minutes?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          cancelled_deliveries?: number | null
          completed_deliveries?: number | null
          created_at?: string | null
          external_rating?: number | null
          external_success_rate?: number | null
          external_total_deliveries?: number | null
          failed_deliveries?: number | null
          failure_rate?: number | null
          first_seen_at?: string | null
          id?: string | null
          lalamove_id?: string | null
          last_active_at?: string | null
          last_delivery_at?: string | null
          last_evaluated_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: never
          photo_url?: string | null
          rating?: number | null
          risk_level?: string | null
          risk_reasons?: Json | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          success_rate?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          vehicle_plate?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          whitelisted?: boolean | null
        }
        Update: {
          avg_delay_minutes?: number | null
          blacklist_reason?: string | null
          blacklisted?: boolean | null
          cancelled_deliveries?: number | null
          completed_deliveries?: number | null
          created_at?: string | null
          external_rating?: number | null
          external_success_rate?: number | null
          external_total_deliveries?: number | null
          failed_deliveries?: number | null
          failure_rate?: number | null
          first_seen_at?: string | null
          id?: string | null
          lalamove_id?: string | null
          last_active_at?: string | null
          last_delivery_at?: string | null
          last_evaluated_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: never
          photo_url?: string | null
          rating?: number | null
          risk_level?: string | null
          risk_reasons?: Json | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          success_rate?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
          vehicle_plate?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          whitelisted?: boolean | null
        }
        Relationships: []
      }
      extratos_bancarios_importados: {
        Row: {
          arquivo_origem: string | null
          codigo_transacao: string | null
          conciliado: boolean | null
          conta_bancaria_id: string | null
          created_at: string | null
          data: string | null
          descricao: string | null
          hash_transacao: string | null
          id: string | null
          importado_de: string | null
          importado_em: string | null
          linha_arquivo: number | null
          numero_documento: string | null
          numero_documento_banco: string | null
          saldo: number | null
          tipo: string | null
          user_id: string | null
          valor: number | null
        }
        Insert: {
          arquivo_origem?: string | null
          codigo_transacao?: string | null
          conciliado?: boolean | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          hash_transacao?: string | null
          id?: string | null
          importado_de?: string | null
          importado_em?: string | null
          linha_arquivo?: number | null
          numero_documento?: string | null
          numero_documento_banco?: string | null
          saldo?: number | null
          tipo?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Update: {
          arquivo_origem?: string | null
          codigo_transacao?: string | null
          conciliado?: boolean | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          hash_transacao?: string | null
          id?: string | null
          importado_de?: string | null
          importado_em?: string | null
          linha_arquivo?: number | null
          numero_documento?: string | null
          numero_documento_banco?: string | null
          saldo?: number | null
          tipo?: string | null
          user_id?: string | null
          valor?: number | null
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
            referencedColumns: ["conta_id"]
          },
        ]
      }
      orders_operator_view: {
        Row: {
          actual_delivery: string | null
          bitrix24_deal_id: number | null
          cost_center: string | null
          created_at: string | null
          currency: string | null
          custom_rating: number | null
          customer_name: string | null
          customer_phone: string | null
          delay_minutes: number | null
          delivery_address: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          department: string | null
          distance_meters: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_delivery: string | null
          id: string | null
          internal_notes: string | null
          internal_order_id: string | null
          internal_status: string | null
          is_urgent: boolean | null
          lalamove_id: string | null
          metadata: Json | null
          outcome: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          quotation_id: string | null
          scheduled_at: string | null
          share_link: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          tags: string[] | null
          total_cost: number | null
          updated_at: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Insert: {
          actual_delivery?: string | null
          bitrix24_deal_id?: number | null
          cost_center?: string | null
          created_at?: string | null
          currency?: string | null
          custom_rating?: number | null
          customer_name?: string | null
          customer_phone?: never
          delay_minutes?: number | null
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          department?: string | null
          distance_meters?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_delivery?: string | null
          id?: string | null
          internal_notes?: string | null
          internal_order_id?: string | null
          internal_status?: string | null
          is_urgent?: boolean | null
          lalamove_id?: string | null
          metadata?: Json | null
          outcome?: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          quotation_id?: string | null
          scheduled_at?: string | null
          share_link?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tags?: string[] | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Update: {
          actual_delivery?: string | null
          bitrix24_deal_id?: number | null
          cost_center?: string | null
          created_at?: string | null
          currency?: string | null
          custom_rating?: number | null
          customer_name?: string | null
          customer_phone?: never
          delay_minutes?: number | null
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          department?: string | null
          distance_meters?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_delivery?: string | null
          id?: string | null
          internal_notes?: string | null
          internal_order_id?: string | null
          internal_status?: string | null
          is_urgent?: boolean | null
          lalamove_id?: string | null
          metadata?: Json | null
          outcome?: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          quotation_id?: string | null
          scheduled_at?: string | null
          share_link?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tags?: string[] | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lalamove_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lalamove_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_safe_view: {
        Row: {
          actual_delivery: string | null
          bitrix24_deal_id: number | null
          cost_center: string | null
          created_at: string | null
          currency: string | null
          custom_rating: number | null
          customer_name: string | null
          customer_phone: string | null
          delay_minutes: number | null
          delivery_address: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          department: string | null
          distance_meters: number | null
          driver_id: string | null
          duration_minutes: number | null
          estimated_delivery: string | null
          id: string | null
          internal_notes: string | null
          internal_order_id: string | null
          internal_status: string | null
          is_urgent: boolean | null
          lalamove_id: string | null
          metadata: Json | null
          outcome: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address: string | null
          pickup_latitude: number | null
          pickup_longitude: number | null
          quotation_id: string | null
          scheduled_at: string | null
          share_link: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          tags: string[] | null
          total_cost: number | null
          updated_at: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Insert: {
          actual_delivery?: string | null
          bitrix24_deal_id?: number | null
          cost_center?: string | null
          created_at?: string | null
          currency?: string | null
          custom_rating?: number | null
          customer_name?: string | null
          customer_phone?: never
          delay_minutes?: number | null
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          department?: string | null
          distance_meters?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_delivery?: string | null
          id?: string | null
          internal_notes?: string | null
          internal_order_id?: string | null
          internal_status?: string | null
          is_urgent?: boolean | null
          lalamove_id?: string | null
          metadata?: Json | null
          outcome?: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          quotation_id?: string | null
          scheduled_at?: string | null
          share_link?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tags?: string[] | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Update: {
          actual_delivery?: string | null
          bitrix24_deal_id?: number | null
          cost_center?: string | null
          created_at?: string | null
          currency?: string | null
          custom_rating?: number | null
          customer_name?: string | null
          customer_phone?: never
          delay_minutes?: number | null
          delivery_address?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          department?: string | null
          distance_meters?: number | null
          driver_id?: string | null
          duration_minutes?: number | null
          estimated_delivery?: string | null
          id?: string | null
          internal_notes?: string | null
          internal_order_id?: string | null
          internal_status?: string | null
          is_urgent?: boolean | null
          lalamove_id?: string | null
          metadata?: Json | null
          outcome?: Database["public"]["Enums"]["delivery_outcome"] | null
          pickup_address?: string | null
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          quotation_id?: string | null
          scheduled_at?: string | null
          share_link?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tags?: string[] | null
          total_cost?: number | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lalamove_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lalamove_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_safe_view"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_contas_pagar_painel: {
        Row: {
          anexo_url: string | null
          aprovado_por: string | null
          categoria: string | null
          categoria_id: string | null
          categoria_nome: string | null
          centro_custo_id: string | null
          centro_custo_nome: string | null
          centro_resultado: string | null
          conta_bancaria_id: string | null
          conta_bancaria_nome: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          desconto: number | null
          descricao: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          fornecedor_nome_display: string | null
          fornecedor_nome_fantasia: string | null
          fornecedor_razao_social: string | null
          id: string | null
          juros: number | null
          metadata: Json | null
          multa: number | null
          numero_documento: string | null
          observacoes: string | null
          parcela_atual: number | null
          recorrente: boolean | null
          status: string | null
          tipo_cobranca: string | null
          total_parcelas: number | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
          valor_pago: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_contas_receber_painel: {
        Row: {
          anexo_url: string | null
          categoria_id: string | null
          categoria_nome: string | null
          centro_custo_id: string | null
          centro_custo_nome: string | null
          chave_pix: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_nome_display: string | null
          cliente_nome_fantasia: string | null
          cliente_razao_social: string | null
          conta_bancaria_id: string | null
          conta_bancaria_nome: string | null
          created_at: string | null
          data_emissao: string | null
          data_recebimento: string | null
          data_vencimento: string | null
          desconto: number | null
          descricao: string | null
          empresa_id: string | null
          etapa_cobranca: string | null
          forma_recebimento: string | null
          id: string | null
          juros: number | null
          metadata: Json | null
          multa: number | null
          numero_documento: string | null
          numero_parcela_atual: number | null
          observacoes: string | null
          parcela_atual: number | null
          recorrente: boolean | null
          score: number | null
          status: string | null
          tipo_cobranca: string | null
          total_parcelas: number | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
          valor_desconto: number | null
          valor_recebido: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_dre_mensal: {
        Row: {
          despesa: number | null
          empresa_id: string | null
          mes: string | null
          receita: number | null
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
      vw_fluxo_caixa_diario: {
        Row: {
          data: string | null
          despesas: number | null
          empresa_id: string | null
          receitas: number | null
        }
        Relationships: []
      }
      vw_metricas_cobranca: {
        Row: {
          empresa_id: string | null
          total_cobrancas: number | null
          total_pagas: number | null
          total_vencidas: number | null
        }
        Relationships: []
      }
      vw_saldos_contas: {
        Row: {
          conta_id: string | null
          nome: string | null
          saldo_atual: number | null
          saldo_disponivel: number | null
        }
        Insert: {
          conta_id?: string | null
          nome?: string | null
          saldo_atual?: number | null
          saldo_disponivel?: number | null
        }
        Update: {
          conta_id?: string | null
          nome?: string | null
          saldo_atual?: number | null
          saldo_disponivel?: number | null
        }
        Relationships: []
      }
      vw_webhooks_recentes: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string | null
          payload: Json | null
          response: Json | null
          source: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_login_lockout: {
        Args: { p_email: string }
        Returns: {
          attempt_count: number
          is_locked: boolean
          remaining_seconds: number
        }[]
      }
      check_login_lockout_v2: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: {
          attempt_count: number
          block_reason: string
          is_ip_blocked: boolean
          is_locked: boolean
          remaining_seconds: number
        }[]
      }
      cleanup_expired_tokens: { Args: never; Returns: number }
      cleanup_old_cron_logs: { Args: never; Returns: number }
      cleanup_old_login_attempts: { Args: never; Returns: number }
      clear_login_attempts: { Args: { p_email: string }; Returns: undefined }
      confirmar_conciliacao:
        | {
            Args: { p_conciliacao_id: string; p_user_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_conciliacao_id: string
              p_transacao_id?: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_conciliacao_id: string
              p_conta_pagar_id?: string
              p_conta_receber_id?: string
              p_transacao_id?: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_ajuste_centavos?: number
              p_conciliacao_id: string
              p_conta_pagar_id?: string
              p_conta_receber_id?: string
              p_transacao_id?: string
              p_user_id: string
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
      desfazer_conciliacao:
        | { Args: { p_conciliacao_id: string }; Returns: undefined }
        | {
            Args: { p_conciliacao_id: string; p_transacao_id?: string }
            Returns: undefined
          }
        | {
            Args: {
              p_conciliacao_id: string
              p_transacao_id?: string
              p_user_id?: string
            }
            Returns: undefined
          }
      export_asaas_audit_csv: {
        Args: { p_empresa_id: string }
        Returns: string
      }
      generate_reconciliation_suggestions:
        | {
            Args: {
              p_empresa_id: string
              p_transaction_date: string
              p_transaction_id?: string
              p_transaction_value: number
            }
            Returns: Json
          }
        | { Args: { p_sessao_id: string }; Returns: undefined }
        | {
            Args: { p_empresa_id?: string; p_sessao_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_empresa_id?: string
              p_sessao_id: string
              p_transaction_date?: string
            }
            Returns: undefined
          }
      gerar_numero_acordo: { Args: never; Returns: string }
      get_active_uapi_token: {
        Args: never
        Returns: {
          access_token: string
          needs_refresh: boolean
          refresh_token: string
          token_age_hours: number
          user_fid: string
        }[]
      }
      get_asaas_payment_stats: { Args: { p_empresa_id: string }; Returns: Json }
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
      get_cron_run_history:
        | { Args: never; Returns: Json }
        | { Args: { p_job_name?: string; p_limit?: number }; Returns: Json }
      get_retencoes_pendentes_count: {
        Args: { p_empresa_id: string }
        Returns: number
      }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          action: string
          module: string
          permission_name: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_permission: {
        Args: { _permission_name: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_country_allowed_for_login: {
        Args: { _country: string }
        Returns: boolean
      }
      is_country_blocked: { Args: { _country_code: string }; Returns: boolean }
      is_ip_allowed_for_login: { Args: { _ip: unknown }; Returns: boolean }
      is_ip_blocked: { Args: { p_ip_address: unknown }; Returns: boolean }
      is_ip_whitelisted: { Args: { _ip_address: unknown }; Returns: boolean }
      is_known_device: {
        Args: { _fingerprint: string; _user_id: string }
        Returns: boolean
      }
      is_token_valid: {
        Args: { p_token_hash: string }
        Returns: {
          expires_in_seconds: number
          is_valid: boolean
          user_id: string
        }[]
      }
      log_audit: {
        Args: {
          p_action: string
          p_details?: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: string
      }
      log_sso_onboarding_event: {
        Args: {
          _context?: Json
          _email: string
          _error_code?: string
          _error_message?: string
          _event_type: string
          _provider_id?: string
          _success?: boolean
        }
        Returns: undefined
      }
      processar_regua_cobranca: {
        Args: { p_empresa_id?: string; p_simulate?: boolean }
        Returns: Json
      }
      record_failed_login: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: {
          is_now_locked: boolean
          lockout_seconds: number
          total_attempts: number
        }[]
      }
      record_failed_login_v2: {
        Args: { p_email: string; p_ip_address?: unknown; p_user_agent?: string }
        Returns: {
          attempt_count: number
          is_locked: boolean
          is_suspicious: boolean
          lockout_seconds: number
        }[]
      }
      registrar_auditoria_config: {
        Args: { _detalhes?: Json; _empresa_id?: string; _tipo_acao: string }
        Returns: undefined
      }
      registrar_evento_pagar:
        | {
            Args: { p_conta_id: string; p_detalhes?: Json; p_evento: string }
            Returns: string
          }
        | {
            Args: {
              p_conta_id: string
              p_mensagem: string
              p_metadata?: Json
              p_tipo: string
            }
            Returns: undefined
          }
      registrar_evento_receber:
        | {
            Args: {
              p_conta_id: string
              p_detalhes?: Json
              p_evento?: string
              p_mensagem?: string
              p_metadata?: Json
              p_tipo?: string
            }
            Returns: undefined
          }
        | {
            Args: { p_conta_id: string; p_detalhes?: Json; p_evento: string }
            Returns: string
          }
        | {
            Args: {
              p_conta_id: string
              p_detalhes?: Json
              p_evento: string
              p_tipo?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_conta_id: string
              p_mensagem: string
              p_metadata?: Json
              p_tipo: string
            }
            Returns: undefined
          }
      run_daily_cleanup: { Args: never; Returns: Json }
      run_daily_cleanup_with_logging: { Args: never; Returns: undefined }
      use_reset_token: {
        Args: { p_ip_address?: unknown; p_token_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "INFO" | "WARNING" | "CRITICAL"
      alert_type:
        | "DRIVER_BLOCKED"
        | "ROUTE_DEVIATION"
        | "DRIVER_STOPPED"
        | "LATE_DELIVERY"
        | "APPROVAL_REQUIRED"
        | "ORDER_CANCELLED"
      app_role:
        | "admin"
        | "manager"
        | "operator"
        | "viewer"
        | "financeiro"
        | "operacional"
        | "visualizador"
        | "contador"
      approval_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL"
      approval_status: "PENDING" | "APPROVED" | "REJECTED"
      delivery_outcome:
        | "SUCCESS"
        | "FAILED"
        | "DAMAGED"
        | "STOLEN"
        | "LATE"
        | "WRONG_ADDRESS"
        | "CUSTOMER_UNAVAILABLE"
      driver_status:
        | "APPROVED"
        | "PENDING_APPROVAL"
        | "BLOCKED"
        | "WHITELIST"
        | "BLACKLIST"
      incident_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      incident_type:
        | "ROUTE_DEVIATION"
        | "LONG_STOP"
        | "LATE_DELIVERY"
        | "CUSTOMER_COMPLAINT"
        | "DAMAGE"
        | "OTHER"
      order_status:
        | "PENDING"
        | "MATCHED"
        | "ON_GOING"
        | "PICKED_UP"
        | "COMPLETED"
        | "CANCELLED"
        | "REJECTED"
        | "EXPIRED"
      prioridade_alerta: "baixa" | "media" | "alta" | "critica"
      tipo_alerta_tributario:
        | "vencimento_apuracao"
        | "vencimento_darf"
        | "vencimento_obrigacao"
        | "prazo_credito"
        | "limite_compensacao"
        | "pendencia_conciliacao"
        | "inconsistencia_fiscal"
        | "atualizacao_legislacao"
        | "split_payment"
        | "retencao_pendente"
        | "nfe_rejeitada"
        | "saldo_negativo"
      vehicle_type: "MOTORCYCLE" | "CAR" | "VAN" | "TRUCK"
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
      alert_severity: ["INFO", "WARNING", "CRITICAL"],
      alert_type: [
        "DRIVER_BLOCKED",
        "ROUTE_DEVIATION",
        "DRIVER_STOPPED",
        "LATE_DELIVERY",
        "APPROVAL_REQUIRED",
        "ORDER_CANCELLED",
      ],
      app_role: [
        "admin",
        "manager",
        "operator",
        "viewer",
        "financeiro",
        "operacional",
        "visualizador",
        "contador",
      ],
      approval_priority: ["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"],
      approval_status: ["PENDING", "APPROVED", "REJECTED"],
      delivery_outcome: [
        "SUCCESS",
        "FAILED",
        "DAMAGED",
        "STOLEN",
        "LATE",
        "WRONG_ADDRESS",
        "CUSTOMER_UNAVAILABLE",
      ],
      driver_status: [
        "APPROVED",
        "PENDING_APPROVAL",
        "BLOCKED",
        "WHITELIST",
        "BLACKLIST",
      ],
      incident_severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      incident_type: [
        "ROUTE_DEVIATION",
        "LONG_STOP",
        "LATE_DELIVERY",
        "CUSTOMER_COMPLAINT",
        "DAMAGE",
        "OTHER",
      ],
      order_status: [
        "PENDING",
        "MATCHED",
        "ON_GOING",
        "PICKED_UP",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
        "EXPIRED",
      ],
      prioridade_alerta: ["baixa", "media", "alta", "critica"],
      tipo_alerta_tributario: [
        "vencimento_apuracao",
        "vencimento_darf",
        "vencimento_obrigacao",
        "prazo_credito",
        "limite_compensacao",
        "pendencia_conciliacao",
        "inconsistencia_fiscal",
        "atualizacao_legislacao",
        "split_payment",
        "retencao_pendente",
        "nfe_rejeitada",
        "saldo_negativo",
      ],
      vehicle_type: ["MOTORCYCLE", "CAR", "VAN", "TRUCK"],
    },
  },
} as const
