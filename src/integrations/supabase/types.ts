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
          {
            foreignKeyName: "acoes_recomendadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acoes_recomendadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acoes_recomendadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acoes_recomendadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acoes_recomendadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acoes_recomendadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acoes_recomendadas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "acordos_parcelamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acordos_parcelamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acordos_parcelamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acordos_parcelamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acordos_parcelamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acordos_parcelamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acordos_parcelamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "alertas_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "alertas_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "alertas_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "alertas_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "alertas_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "alertas_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "alertas_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
      aliquotas_interestaduais: {
        Row: {
          aliquota: number
          aliquota_importado: number
          created_at: string
          id: string
          uf_destino: Database["public"]["Enums"]["uf_brasil"]
          uf_origem: Database["public"]["Enums"]["uf_brasil"]
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          aliquota: number
          aliquota_importado?: number
          created_at?: string
          id?: string
          uf_destino: Database["public"]["Enums"]["uf_brasil"]
          uf_origem: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          aliquota?: number
          aliquota_importado?: number
          created_at?: string
          id?: string
          uf_destino?: Database["public"]["Enums"]["uf_brasil"]
          uf_origem?: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: []
      }
      aliquotas_internas_uf: {
        Row: {
          aliquota: number
          aliquota_fcp: number
          base_legal: string | null
          categoria_produto: string
          created_at: string
          id: string
          uf: Database["public"]["Enums"]["uf_brasil"]
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          aliquota: number
          aliquota_fcp?: number
          base_legal?: string | null
          categoria_produto?: string
          created_at?: string
          id?: string
          uf: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          aliquota?: number
          aliquota_fcp?: number
          base_legal?: string | null
          categoria_produto?: string
          created_at?: string
          id?: string
          uf?: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: []
      }
      aliquotas_iss_municipal: {
        Row: {
          aliquota: number
          base_legal: string | null
          codigo_ibge: number
          created_at: string
          id: string
          item_lista_id: string | null
          municipio: string
          uf: Database["public"]["Enums"]["uf_brasil"]
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          aliquota: number
          base_legal?: string | null
          codigo_ibge: number
          created_at?: string
          id?: string
          item_lista_id?: string | null
          municipio: string
          uf: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          aliquota?: number
          base_legal?: string | null
          codigo_ibge?: number
          created_at?: string
          id?: string
          item_lista_id?: string | null
          municipio?: string
          uf?: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "aliquotas_iss_municipal_item_lista_id_fkey"
            columns: ["item_lista_id"]
            isOneToOne: false
            referencedRelation: "itens_lista_iss"
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
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          empresa_id: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          updated_at?: string
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
          csll_a_pagar: number
          csll_aliquota: number | null
          csll_base: number
          csll_total: number
          csll_valor: number | null
          csrf_retido: number | null
          data_transmissao: string | null
          empresa_id: string
          estimativas_pagas: number | null
          exclusoes_permanentes: number | null
          exclusoes_temporarias: number | null
          id: string
          irpj_a_pagar: number
          irpj_adicional: number
          irpj_adicional_base: number
          irpj_aliquota_adicional: number | null
          irpj_aliquota_normal: number | null
          irpj_incentivos_deducoes: number
          irpj_normal: number
          irpj_total: number
          irpj_valor: number | null
          irrf_retido: number | null
          lucro_antes_impostos: number | null
          lucro_contabil: number | null
          lucro_real: number | null
          lucro_real_antes_compensacao: number | null
          mes: number | null
          numero_recibo: string | null
          outros_incentivos: number | null
          pat_deducao: number | null
          periodo_fim: string
          periodo_inicio: string
          saldo_negativo_anterior: number | null
          saldo_negativo_csll: number
          saldo_negativo_irpj: number
          status: string | null
          tipo_apuracao: string | null
          total_adicoes: number | null
          total_exclusoes: number | null
          total_tributos: number
          trimestre: number | null
          updated_at: string
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
          csll_a_pagar?: number
          csll_aliquota?: number | null
          csll_base?: number
          csll_total?: number
          csll_valor?: number | null
          csrf_retido?: number | null
          data_transmissao?: string | null
          empresa_id: string
          estimativas_pagas?: number | null
          exclusoes_permanentes?: number | null
          exclusoes_temporarias?: number | null
          id?: string
          irpj_a_pagar?: number
          irpj_adicional?: number
          irpj_adicional_base?: number
          irpj_aliquota_adicional?: number | null
          irpj_aliquota_normal?: number | null
          irpj_incentivos_deducoes?: number
          irpj_normal?: number
          irpj_total?: number
          irpj_valor?: number | null
          irrf_retido?: number | null
          lucro_antes_impostos?: number | null
          lucro_contabil?: number | null
          lucro_real?: number | null
          lucro_real_antes_compensacao?: number | null
          mes?: number | null
          numero_recibo?: string | null
          outros_incentivos?: number | null
          pat_deducao?: number | null
          periodo_fim: string
          periodo_inicio: string
          saldo_negativo_anterior?: number | null
          saldo_negativo_csll?: number
          saldo_negativo_irpj?: number
          status?: string | null
          tipo_apuracao?: string | null
          total_adicoes?: number | null
          total_exclusoes?: number | null
          total_tributos?: number
          trimestre?: number | null
          updated_at?: string
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
          csll_a_pagar?: number
          csll_aliquota?: number | null
          csll_base?: number
          csll_total?: number
          csll_valor?: number | null
          csrf_retido?: number | null
          data_transmissao?: string | null
          empresa_id?: string
          estimativas_pagas?: number | null
          exclusoes_permanentes?: number | null
          exclusoes_temporarias?: number | null
          id?: string
          irpj_a_pagar?: number
          irpj_adicional?: number
          irpj_adicional_base?: number
          irpj_aliquota_adicional?: number | null
          irpj_aliquota_normal?: number | null
          irpj_incentivos_deducoes?: number
          irpj_normal?: number
          irpj_total?: number
          irpj_valor?: number | null
          irrf_retido?: number | null
          lucro_antes_impostos?: number | null
          lucro_contabil?: number | null
          lucro_real?: number | null
          lucro_real_antes_compensacao?: number | null
          mes?: number | null
          numero_recibo?: string | null
          outros_incentivos?: number | null
          pat_deducao?: number | null
          periodo_fim?: string
          periodo_inicio?: string
          saldo_negativo_anterior?: number | null
          saldo_negativo_csll?: number
          saldo_negativo_irpj?: number
          status?: string | null
          tipo_apuracao?: string | null
          total_adicoes?: number | null
          total_exclusoes?: number | null
          total_tributos?: number
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
          {
            foreignKeyName: "apuracoes_irpj_csll_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_irpj_csll_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_irpj_csll_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_irpj_csll_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_irpj_csll_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_irpj_csll_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_irpj_csll_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "apuracoes_tributarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_tributarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_tributarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_tributarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_tributarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_tributarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "apuracoes_tributarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
      asaas_credit_risk_analysis: {
        Row: {
          cliente_id: string
          created_at: string
          faixa_risco: string
          id: string
          metadata: Json
          recomendacao: string | null
          score_risco: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          faixa_risco: string
          id?: string
          metadata?: Json
          recomendacao?: string | null
          score_risco: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          faixa_risco?: string
          id?: string
          metadata?: Json
          recomendacao?: string | null
          score_risco?: number
        }
        Relationships: [
          {
            foreignKeyName: "asaas_credit_risk_analysis_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
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
          codigo_barras: string | null
          conta_receber_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          invoice_url: string | null
          linha_digitavel: string | null
          link_boleto: string | null
          link_fatura: string | null
          metadata: Json | null
          nosso_numero: string | null
          pix_copia_cola: string | null
          pix_qrcode: string | null
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
          codigo_barras?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          invoice_url?: string | null
          linha_digitavel?: string | null
          link_boleto?: string | null
          link_fatura?: string | null
          metadata?: Json | null
          nosso_numero?: string | null
          pix_copia_cola?: string | null
          pix_qrcode?: string | null
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
          codigo_barras?: string | null
          conta_receber_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          invoice_url?: string | null
          linha_digitavel?: string | null
          link_boleto?: string | null
          link_fatura?: string | null
          metadata?: Json | null
          nosso_numero?: string | null
          pix_copia_cola?: string | null
          pix_qrcode?: string | null
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
          action: string
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
          action?: string
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
      audit_logs_2026_01: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_02: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_03: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_04: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_05: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_06: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_07: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_08: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_09: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_2026_10: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      audit_logs_default: {
        Row: {
          action: string
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
          action: string
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
          action?: string
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
      auditoria_tributaria: {
        Row: {
          acao: string
          criado_em: string
          empresa_id: string | null
          entidade_id: string | null
          entidade_tipo: string
          id: string
          payload_anterior: Json | null
          payload_novo: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string
          empresa_id?: string | null
          entidade_id?: string | null
          entidade_tipo: string
          id?: string
          payload_anterior?: Json | null
          payload_novo?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string
          empresa_id?: string | null
          entidade_id?: string | null
          entidade_tipo?: string
          id?: string
          payload_anterior?: Json | null
          payload_novo?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
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
      benchmarks_setoriais: {
        Row: {
          carga_media_pct: number
          carga_p25_pct: number | null
          carga_p75_pct: number | null
          cnae_prefix: string
          created_at: string
          fonte: string | null
          id: string
          regime: string
          setor: string
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          carga_media_pct: number
          carga_p25_pct?: number | null
          carga_p75_pct?: number | null
          cnae_prefix: string
          created_at?: string
          fonte?: string | null
          id?: string
          regime: string
          setor: string
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          carga_media_pct?: number
          carga_p25_pct?: number | null
          carga_p75_pct?: number | null
          cnae_prefix?: string
          created_at?: string
          fonte?: string | null
          id?: string
          regime?: string
          setor?: string
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      beneficios_fiscais: {
        Row: {
          base_legal: string | null
          codigo: string
          created_at: string
          criterios: Json
          descricao: string | null
          id: string
          nome: string
          percentual: number | null
          tipo: string
          uf: Database["public"]["Enums"]["uf_brasil"] | null
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          base_legal?: string | null
          codigo: string
          created_at?: string
          criterios?: Json
          descricao?: string | null
          id?: string
          nome: string
          percentual?: number | null
          tipo?: string
          uf?: Database["public"]["Enums"]["uf_brasil"] | null
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          base_legal?: string | null
          codigo?: string
          created_at?: string
          criterios?: Json
          descricao?: string | null
          id?: string
          nome?: string
          percentual?: number | null
          tipo?: string
          uf?: Database["public"]["Enums"]["uf_brasil"] | null
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
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
          {
            foreignKeyName: "bitrix_field_mappings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_field_mappings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_field_mappings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_field_mappings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_field_mappings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_field_mappings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_field_mappings_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      bitrix_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          domain: string | null
          expires_at: string
          id: string
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          domain?: string | null
          expires_at: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          domain?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "bitrix_sync_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_sync_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_sync_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_sync_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_sync_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_sync_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bitrix_sync_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          registros_com_erro: number
          registros_processados: number
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
          registros_com_erro?: number
          registros_processados?: number
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
          registros_com_erro?: number
          registros_processados?: number
          status?: string
          tipo?: string
        }
        Relationships: []
      }
      bling_tokens: {
        Row: {
          access_token: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string | null
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
          processed: boolean
          processed_at: string | null
          resource_id: string | null
          retries: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          module: string
          payload?: Json | null
          processed?: boolean
          processed_at?: string | null
          resource_id?: string | null
          retries?: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          module?: string
          payload?: Json | null
          processed?: boolean
          processed_at?: string | null
          resource_id?: string | null
          retries?: number
        }
        Relationships: []
      }
      bloat_snapshots: {
        Row: {
          autovacuum_count: number
          created_at: string
          dead_ratio_pct: number
          dead_rows: number
          id: string
          last_autovacuum: string | null
          last_vacuum: string | null
          live_rows: number
          snapshot_date: string
          table_name: string
          total_size_bytes: number
          total_size_pretty: string | null
        }
        Insert: {
          autovacuum_count?: number
          created_at?: string
          dead_ratio_pct?: number
          dead_rows?: number
          id?: string
          last_autovacuum?: string | null
          last_vacuum?: string | null
          live_rows?: number
          snapshot_date?: string
          table_name: string
          total_size_bytes?: number
          total_size_pretty?: string | null
        }
        Update: {
          autovacuum_count?: number
          created_at?: string
          dead_ratio_pct?: number
          dead_rows?: number
          id?: string
          last_autovacuum?: string | null
          last_vacuum?: string | null
          live_rows?: number
          snapshot_date?: string
          table_name?: string
          total_size_bytes?: number
          total_size_pretty?: string | null
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          attempts_count: number | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_until: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_permanent: boolean | null
          last_attempt_at: string | null
          metadata: Json | null
          permanent: boolean
          reason: string
          unblocked_at: string | null
          unblocked_by: string | null
        }
        Insert: {
          attempts_count?: number | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_permanent?: boolean | null
          last_attempt_at?: string | null
          metadata?: Json | null
          permanent?: boolean
          reason: string
          unblocked_at?: string | null
          unblocked_by?: string | null
        }
        Update: {
          attempts_count?: number | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_permanent?: boolean | null
          last_attempt_at?: string | null
          metadata?: Json | null
          permanent?: boolean
          reason?: string
          unblocked_at?: string | null
          unblocked_by?: string | null
        }
        Relationships: []
      }
      bloqueios_duplicidade: {
        Row: {
          created_at: string | null
          dados_tentativa: Json
          empresa_id: string | null
          id: string
          motivo: string | null
          transacao_id: string | null
          valor_bloqueado: number | null
        }
        Insert: {
          created_at?: string | null
          dados_tentativa?: Json
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          transacao_id?: string | null
          valor_bloqueado?: number | null
        }
        Update: {
          created_at?: string | null
          dados_tentativa?: Json
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
          {
            foreignKeyName: "bloqueios_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bloqueios_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bloqueios_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bloqueios_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bloqueios_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bloqueios_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "bloqueios_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "boletos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "boletos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "boletos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "boletos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "boletos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "boletos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "boletos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      catalogos_fiscais_cargas: {
        Row: {
          checksum: string
          contagens: Json
          created_at: string
          criticos: number
          duracao_ms: number
          houve_alteracao: boolean
          id: string
          last_updated: string
          mensagem: string | null
          origem: string
          status: string
          updated_at: string
          vinculos_normalizados: number
        }
        Insert: {
          checksum: string
          contagens?: Json
          created_at?: string
          criticos?: number
          duracao_ms?: number
          houve_alteracao?: boolean
          id?: string
          last_updated?: string
          mensagem?: string | null
          origem?: string
          status?: string
          updated_at?: string
          vinculos_normalizados?: number
        }
        Update: {
          checksum?: string
          contagens?: Json
          created_at?: string
          criticos?: number
          duracao_ms?: number
          houve_alteracao?: boolean
          id?: string
          last_updated?: string
          mensagem?: string | null
          origem?: string
          status?: string
          updated_at?: string
          vinculos_normalizados?: number
        }
        Relationships: []
      }
      catalogos_tributarios_health_history: {
        Row: {
          achados: Json
          avisos: number
          created_at: string
          criticos: number
          dia: string
          id: string
          infos: number
          saudavel: boolean
          total_invariantes: number
          updated_at: string
        }
        Insert: {
          achados?: Json
          avisos?: number
          created_at?: string
          criticos?: number
          dia: string
          id?: string
          infos?: number
          saudavel?: boolean
          total_invariantes?: number
          updated_at?: string
        }
        Update: {
          achados?: Json
          avisos?: number
          created_at?: string
          criticos?: number
          dia?: string
          id?: string
          infos?: number
          saudavel?: boolean
          total_invariantes?: number
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          tipo: string | null
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
          tipo?: string | null
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
          tipo?: string | null
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
          {
            foreignKeyName: "centros_custo_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vw_gastos_centro_custo"
            referencedColumns: ["centro_custo_id"]
          },
        ]
      }
      ci_security_gate_events: {
        Row: {
          created_at: string
          exception_notes: string | null
          expected_state: string
          function_name: string
          git_ref: string | null
          git_sha: string | null
          id: string
          matrix: string
          migration_revision: string | null
          observed_code: string | null
          observed_message: string | null
          observed_status: number | null
          raw: Json | null
          role_tested: string
          severity: string
          workflow_run_url: string | null
        }
        Insert: {
          created_at?: string
          exception_notes?: string | null
          expected_state: string
          function_name: string
          git_ref?: string | null
          git_sha?: string | null
          id?: string
          matrix: string
          migration_revision?: string | null
          observed_code?: string | null
          observed_message?: string | null
          observed_status?: number | null
          raw?: Json | null
          role_tested: string
          severity?: string
          workflow_run_url?: string | null
        }
        Update: {
          created_at?: string
          exception_notes?: string | null
          expected_state?: string
          function_name?: string
          git_ref?: string | null
          git_sha?: string | null
          id?: string
          matrix?: string
          migration_revision?: string | null
          observed_code?: string | null
          observed_message?: string | null
          observed_status?: number | null
          raw?: Json | null
          role_tested?: string
          severity?: string
          workflow_run_url?: string | null
        }
        Relationships: []
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
      cnaes: {
        Row: {
          anexo_simples: string | null
          atividade: Database["public"]["Enums"]["atividade_economica"] | null
          codigo: string
          created_at: string
          descricao: string
          id: string
          presuncao_csll: number
          presuncao_irpj: number
          rat_padrao: number
          sujeito_fator_r: boolean
          terceiros_padrao: number
          updated_at: string
          vedado_simples: boolean
        }
        Insert: {
          anexo_simples?: string | null
          atividade?: Database["public"]["Enums"]["atividade_economica"] | null
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          presuncao_csll?: number
          presuncao_irpj?: number
          rat_padrao?: number
          sujeito_fator_r?: boolean
          terceiros_padrao?: number
          updated_at?: string
          vedado_simples?: boolean
        }
        Update: {
          anexo_simples?: string | null
          atividade?: Database["public"]["Enums"]["atividade_economica"] | null
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          presuncao_csll?: number
          presuncao_irpj?: number
          rat_padrao?: number
          sujeito_fator_r?: boolean
          terceiros_padrao?: number
          updated_at?: string
          vedado_simples?: boolean
        }
        Relationships: []
      }
      cnpja_cache: {
        Row: {
          cnpj: string
          created_at: string
          data: Json
          expires_at: string
          fetched_at: string
          situacao_cadastral: string | null
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          data: Json
          expires_at: string
          fetched_at?: string
          situacao_cadastral?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          data?: Json
          expires_at?: string
          fetched_at?: string
          situacao_cadastral?: string | null
          updated_at?: string
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
          {
            foreignKeyName: "configuracoes_aprovacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "configuracoes_aprovacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "configuracoes_aprovacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "configuracoes_aprovacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "configuracoes_aprovacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "configuracoes_aprovacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "configuracoes_aprovacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
      conformidade_snapshots: {
        Row: {
          competencia: string
          created_at: string
          empresa_id: string
          entregues: number
          entregues_com_atraso: number
          gerado_por: string | null
          id: string
          multa_registrada: number
          nivel: string
          pontualidade: number
          score: number
          total_obrigacoes: number
          updated_at: string
          vencidas_pendentes: number
        }
        Insert: {
          competencia: string
          created_at?: string
          empresa_id: string
          entregues?: number
          entregues_com_atraso?: number
          gerado_por?: string | null
          id?: string
          multa_registrada?: number
          nivel: string
          pontualidade?: number
          score: number
          total_obrigacoes?: number
          updated_at?: string
          vencidas_pendentes?: number
        }
        Update: {
          competencia?: string
          created_at?: string
          empresa_id?: string
          entregues?: number
          entregues_com_atraso?: number
          gerado_por?: string | null
          id?: string
          multa_registrada?: number
          nivel?: string
          pontualidade?: number
          score?: number
          total_obrigacoes?: number
          updated_at?: string
          vencidas_pendentes?: number
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
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_bancarias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
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
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
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
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          anexo_url: string | null
          bitrix_deal_id: string | null
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
          bitrix_deal_id?: string | null
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
          bitrix_deal_id?: string | null
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
            foreignKeyName: "contas_receber_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
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
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      convites: {
        Row: {
          convidado_por: string
          created_at: string
          email_convidado: string
          expira_em: string
          id: string
          organizacao_id: string
          papel_proposto: Database["public"]["Enums"]["org_papel"]
          token: string
          utilizado_em: string | null
        }
        Insert: {
          convidado_por: string
          created_at?: string
          email_convidado: string
          expira_em?: string
          id?: string
          organizacao_id: string
          papel_proposto?: Database["public"]["Enums"]["org_papel"]
          token?: string
          utilizado_em?: string | null
        }
        Update: {
          convidado_por?: string
          created_at?: string
          email_convidado?: string
          expira_em?: string
          id?: string
          organizacao_id?: string
          papel_proposto?: Database["public"]["Enums"]["org_papel"]
          token?: string
          utilizado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      convites_contador: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          empresa_id: string
          expires_at: string
          id: string
          nome: string | null
          revoked_at: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          empresa_id: string
          expires_at: string
          id?: string
          nome?: string | null
          revoked_at?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          empresa_id?: string
          expires_at?: string
          id?: string
          nome?: string | null
          revoked_at?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_contador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_contador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "convites_contador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "convites_contador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "convites_contador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "convites_contador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "convites_contador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "convites_contador_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "creditos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "custom_field_definitions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "custom_field_definitions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "custom_field_definitions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "custom_field_definitions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "custom_field_definitions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "custom_field_definitions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "custom_field_definitions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          codigo_barras: string | null
          codigo_receita: string | null
          competencia: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao_receita: string | null
          empresa_id: string | null
          id: string
          linha_digitavel: string | null
          periodo_apuracao: string | null
          retencoes_ids: string[]
          status: string
          updated_at: string
          valor_juros: number
          valor_multa: number
          valor_principal: number | null
          valor_total: number | null
        }
        Insert: {
          alerta_id?: string | null
          codigo_barras?: string | null
          codigo_receita?: string | null
          competencia?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao_receita?: string | null
          empresa_id?: string | null
          id?: string
          linha_digitavel?: string | null
          periodo_apuracao?: string | null
          retencoes_ids?: string[]
          status?: string
          updated_at?: string
          valor_juros?: number
          valor_multa?: number
          valor_principal?: number | null
          valor_total?: number | null
        }
        Update: {
          alerta_id?: string | null
          codigo_barras?: string | null
          codigo_receita?: string | null
          competencia?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao_receita?: string | null
          empresa_id?: string | null
          id?: string
          linha_digitavel?: string | null
          periodo_apuracao?: string | null
          retencoes_ids?: string[]
          status?: string
          updated_at?: string
          valor_juros?: number
          valor_multa?: number
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
          {
            foreignKeyName: "darfs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "darfs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "darfs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "darfs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "darfs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "darfs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "darfs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "darfs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      digest_envios_log: {
        Row: {
          created_at: string
          duplicado: boolean
          email: string
          erro: string | null
          execucao_id: string
          hash_conteudo: string | null
          id: string
          motivo: string | null
          multa_total: number
          severidade_maxima: string | null
          simulado: boolean
          situacao: string
          total_alertas: number
          total_empresas: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duplicado?: boolean
          email: string
          erro?: string | null
          execucao_id: string
          hash_conteudo?: string | null
          id?: string
          motivo?: string | null
          multa_total?: number
          severidade_maxima?: string | null
          simulado?: boolean
          situacao: string
          total_alertas?: number
          total_empresas?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duplicado?: boolean
          email?: string
          erro?: string | null
          execucao_id?: string
          hash_conteudo?: string | null
          id?: string
          motivo?: string | null
          multa_total?: number
          severidade_maxima?: string | null
          simulado?: boolean
          situacao?: string
          total_alertas?: number
          total_empresas?: number
          user_id?: string | null
        }
        Relationships: []
      }
      dispositivos_conhecidos: {
        Row: {
          browser: string | null
          device_fingerprint: string | null
          device_name: string | null
          device_type: string | null
          id: string
          is_trusted: boolean | null
          last_login: string | null
          last_seen_at: string | null
          os: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_trusted?: boolean | null
          last_login?: string | null
          last_seen_at?: string | null
          os?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          is_trusted?: boolean | null
          last_login?: string | null
          last_seen_at?: string | null
          os?: string | null
          user_agent?: string | null
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
      edge_function_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event: string | null
          function_name: string
          id: string
          level: string
          metadata: Json | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event?: string | null
          function_name: string
          id?: string
          level?: string
          metadata?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event?: string | null
          function_name?: string
          id?: string
          level?: string
          metadata?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      elisao_alertas: {
        Row: {
          created_at: string
          descricao: string
          empresa_id: string
          id: string
          lido: boolean
          referencia_id: string | null
          resolvido: boolean
          resolvido_em: string | null
          severidade: string
          tipo_divergencia: string
          titulo: string
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          created_at?: string
          descricao: string
          empresa_id: string
          id?: string
          lido?: boolean
          referencia_id?: string | null
          resolvido?: boolean
          resolvido_em?: string | null
          severidade?: string
          tipo_divergencia: string
          titulo: string
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string
          empresa_id?: string
          id?: string
          lido?: boolean
          referencia_id?: string | null
          resolvido?: boolean
          resolvido_em?: string | null
          severidade?: string
          tipo_divergencia?: string
          titulo?: string
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "elisao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elisao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      elisao_creditos_auditoria: {
        Row: {
          aprovador_id: string | null
          created_at: string
          cst_csosn: string | null
          data_aprovacao: string | null
          divergencias_detectadas: Json
          empresa_id: string
          historico_decisoes: Json
          id: string
          metodologia_aplicada: string | null
          motivo_rejeicao: string | null
          ncm: string | null
          nota_id: string | null
          regra_id: string | null
          score_confianca: number | null
          status_aprovacao: string
          updated_at: string
          valor_base: number
          valor_credito_calculado: number
        }
        Insert: {
          aprovador_id?: string | null
          created_at?: string
          cst_csosn?: string | null
          data_aprovacao?: string | null
          divergencias_detectadas?: Json
          empresa_id: string
          historico_decisoes?: Json
          id?: string
          metodologia_aplicada?: string | null
          motivo_rejeicao?: string | null
          ncm?: string | null
          nota_id?: string | null
          regra_id?: string | null
          score_confianca?: number | null
          status_aprovacao?: string
          updated_at?: string
          valor_base?: number
          valor_credito_calculado?: number
        }
        Update: {
          aprovador_id?: string | null
          created_at?: string
          cst_csosn?: string | null
          data_aprovacao?: string | null
          divergencias_detectadas?: Json
          empresa_id?: string
          historico_decisoes?: Json
          id?: string
          metodologia_aplicada?: string | null
          motivo_rejeicao?: string | null
          ncm?: string | null
          nota_id?: string | null
          regra_id?: string | null
          score_confianca?: number | null
          status_aprovacao?: string
          updated_at?: string
          valor_base?: number
          valor_credito_calculado?: number
        }
        Relationships: [
          {
            foreignKeyName: "elisao_creditos_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_nota_id_fkey"
            columns: ["nota_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais_ocr"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elisao_creditos_auditoria_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "elisao_regras_creditos"
            referencedColumns: ["id"]
          },
        ]
      }
      elisao_regras_creditos: {
        Row: {
          aliquota: number | null
          ativo: boolean
          base_legal: string | null
          codigo: string
          created_at: string
          cst_csosn: string | null
          descricao: string
          id: string
          metodologia: string | null
          ncm_prefixo: string | null
          tipo_credito: string
          updated_at: string
        }
        Insert: {
          aliquota?: number | null
          ativo?: boolean
          base_legal?: string | null
          codigo: string
          created_at?: string
          cst_csosn?: string | null
          descricao: string
          id?: string
          metodologia?: string | null
          ncm_prefixo?: string | null
          tipo_credito: string
          updated_at?: string
        }
        Update: {
          aliquota?: number | null
          ativo?: boolean
          base_legal?: string | null
          codigo?: string
          created_at?: string
          cst_csosn?: string | null
          descricao?: string
          id?: string
          metodologia?: string | null
          ncm_prefixo?: string | null
          tipo_credito?: string
          updated_at?: string
        }
        Relationships: []
      }
      elisao_simulacoes_regime: {
        Row: {
          carga_atual: number
          carga_simulada: number
          created_at: string
          created_by: string | null
          economia_estimada: number
          empresa_id: string
          id: string
          premissas: Json
          regime_atual: string
          regime_simulado: string
          updated_at: string
        }
        Insert: {
          carga_atual?: number
          carga_simulada?: number
          created_at?: string
          created_by?: string | null
          economia_estimada?: number
          empresa_id: string
          id?: string
          premissas?: Json
          regime_atual: string
          regime_simulado: string
          updated_at?: string
        }
        Update: {
          carga_atual?: number
          carga_simulada?: number
          created_at?: string
          created_by?: string | null
          economia_estimada?: number
          empresa_id?: string
          id?: string
          premissas?: Json
          regime_atual?: string
          regime_simulado?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elisao_simulacoes_regime_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elisao_simulacoes_regime_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_simulacoes_regime_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_simulacoes_regime_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_simulacoes_regime_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_simulacoes_regime_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_simulacoes_regime_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_simulacoes_regime_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      elisao_tarefas_acionaveis: {
        Row: {
          bitrix_sync_erro: string | null
          bitrix_sync_status: string
          bitrix_task_id: string | null
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          prazo: string | null
          responsavel_id: string | null
          sincronizado_em: string | null
          status: string
          tipo_oportunidade: string
          titulo: string
          updated_at: string
          valor_envolvido: number
        }
        Insert: {
          bitrix_sync_erro?: string | null
          bitrix_sync_status?: string
          bitrix_task_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          sincronizado_em?: string | null
          status?: string
          tipo_oportunidade?: string
          titulo: string
          updated_at?: string
          valor_envolvido?: number
        }
        Update: {
          bitrix_sync_erro?: string | null
          bitrix_sync_status?: string
          bitrix_task_id?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          sincronizado_em?: string | null
          status?: string
          tipo_oportunidade?: string
          titulo?: string
          updated_at?: string
          valor_envolvido?: number
        }
        Relationships: [
          {
            foreignKeyName: "elisao_tarefas_acionaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elisao_tarefas_acionaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_tarefas_acionaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_tarefas_acionaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_tarefas_acionaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_tarefas_acionaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_tarefas_acionaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "elisao_tarefas_acionaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
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
          aliquota_rat: number | null
          aliquota_terceiros: number | null
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnae_principal: string | null
          cnpj: string | null
          codigo_fpas: string | null
          cor_hex: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          logo_url: string | null
          nome_fantasia: string | null
          razao_social: string
          regime_tributario: string | null
          sigla: string | null
          telefone: string | null
          user_id: string
        }
        Insert: {
          aliquota_rat?: number | null
          aliquota_terceiros?: number | null
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          codigo_fpas?: string | null
          cor_hex?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social: string
          regime_tributario?: string | null
          sigla?: string | null
          telefone?: string | null
          user_id?: string
        }
        Update: {
          aliquota_rat?: number | null
          aliquota_terceiros?: number | null
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          codigo_fpas?: string | null
          cor_hex?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          regime_tributario?: string | null
          sigla?: string | null
          telefone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      empresas_certificados: {
        Row: {
          ambiente: Database["public"]["Enums"]["sefaz_ambiente"]
          ativo: boolean
          cnpj: string
          created_at: string
          criado_por: string | null
          empresa_id: string
          id: string
          password_encrypted: string | null
          pfx_storage_path: string
          razao_social: string | null
          uf: string
          updated_at: string
          valido_ate: string
          valido_de: string | null
        }
        Insert: {
          ambiente?: Database["public"]["Enums"]["sefaz_ambiente"]
          ativo?: boolean
          cnpj: string
          created_at?: string
          criado_por?: string | null
          empresa_id: string
          id?: string
          password_encrypted?: string | null
          pfx_storage_path: string
          razao_social?: string | null
          uf: string
          updated_at?: string
          valido_ate: string
          valido_de?: string | null
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["sefaz_ambiente"]
          ativo?: boolean
          cnpj?: string
          created_at?: string
          criado_por?: string | null
          empresa_id?: string
          id?: string
          password_encrypted?: string | null
          pfx_storage_path?: string
          razao_social?: string | null
          uf?: string
          updated_at?: string
          valido_ate?: string
          valido_de?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "empresas_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "empresas_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "empresas_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "empresas_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "empresas_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "empresas_certificados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      entregas_obrigacoes: {
        Row: {
          competencia: string
          created_at: string
          data_entrega: string | null
          empresa_id: string
          id: string
          obrigacao_id: string
          observacoes: string | null
          prazo: string
          protocolo: string | null
          registrado_por: string | null
          status: string
          updated_at: string
          valor_multa: number
        }
        Insert: {
          competencia: string
          created_at?: string
          data_entrega?: string | null
          empresa_id: string
          id?: string
          obrigacao_id: string
          observacoes?: string | null
          prazo: string
          protocolo?: string | null
          registrado_por?: string | null
          status?: string
          updated_at?: string
          valor_multa?: number
        }
        Update: {
          competencia?: string
          created_at?: string
          data_entrega?: string | null
          empresa_id?: string
          id?: string
          obrigacao_id?: string
          observacoes?: string | null
          prazo?: string
          protocolo?: string | null
          registrado_por?: string | null
          status?: string
          updated_at?: string
          valor_multa?: number
        }
        Relationships: []
      }
      estrategias_elisao: {
        Row: {
          ativo: boolean
          base_legal: string | null
          categoria: string | null
          codigo: string
          created_at: string
          descricao: string | null
          economia_estimada_percentual: number | null
          id: string
          nome: string
          regimes_aplicaveis: string[]
          requisitos: Json
          risco: Database["public"]["Enums"]["nivel_risco"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          base_legal?: string | null
          categoria?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          economia_estimada_percentual?: number | null
          id?: string
          nome: string
          regimes_aplicaveis?: string[]
          requisitos?: Json
          risco?: Database["public"]["Enums"]["nivel_risco"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          base_legal?: string | null
          categoria?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          economia_estimada_percentual?: number | null
          id?: string
          nome?: string
          regimes_aplicaveis?: string[]
          requisitos?: Json
          risco?: Database["public"]["Enums"]["nivel_risco"]
          updated_at?: string
        }
        Relationships: []
      }
      eventos_contabilizacao_log: {
        Row: {
          created_at: string
          detalhe: string | null
          empresa_id: string
          evento_id: string | null
          id: string
          lancamento_id: string | null
          regra_id: string | null
          status: string
          tipo_evento: string
        }
        Insert: {
          created_at?: string
          detalhe?: string | null
          empresa_id: string
          evento_id?: string | null
          id?: string
          lancamento_id?: string | null
          regra_id?: string | null
          status: string
          tipo_evento: string
        }
        Update: {
          created_at?: string
          detalhe?: string | null
          empresa_id?: string
          evento_id?: string | null
          id?: string
          lancamento_id?: string | null
          regra_id?: string | null
          status?: string
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_contabilizacao_log_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "regras_contabilizacao_automatica"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias_pacotes: {
        Row: {
          created_at: string | null
          escopos: string[]
          gerado_por_email: string | null
          id: string
          manifest: Json
          periodo_fim: string | null
          periodo_inicio: string | null
          storage_path: string | null
          tamanho_bytes: number | null
          url: string | null
          verificacao_id: string | null
        }
        Insert: {
          created_at?: string | null
          escopos?: string[]
          gerado_por_email?: string | null
          id?: string
          manifest?: Json
          periodo_fim?: string | null
          periodo_inicio?: string | null
          storage_path?: string | null
          tamanho_bytes?: number | null
          url?: string | null
          verificacao_id?: string | null
        }
        Update: {
          created_at?: string | null
          escopos?: string[]
          gerado_por_email?: string | null
          id?: string
          manifest?: Json
          periodo_fim?: string | null
          periodo_inicio?: string | null
          storage_path?: string | null
          tamanho_bytes?: number | null
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
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "execucoes_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      execucoes_regua_cobranca: {
        Row: {
          canal: string | null
          conta_receber_id: string | null
          created_at: string
          empresa_id: string
          etapa: string
          id: string
          mensagem_erro: string | null
          metadata: Json
          status: string
        }
        Insert: {
          canal?: string | null
          conta_receber_id?: string | null
          created_at?: string
          empresa_id: string
          etapa: string
          id?: string
          mensagem_erro?: string | null
          metadata?: Json
          status: string
        }
        Update: {
          canal?: string | null
          conta_receber_id?: string | null
          created_at?: string
          empresa_id?: string
          etapa?: string
          id?: string
          mensagem_erro?: string | null
          metadata?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_regua_cobranca_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_regua_cobranca_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
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
          {
            foreignKeyName: "expert_conversations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "expert_conversations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "expert_conversations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "expert_conversations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "expert_conversations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "expert_conversations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "expert_conversations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
        ]
      }
      faixas_simples_nacional: {
        Row: {
          aliquota: number
          anexo: string
          created_at: string
          faixa: number
          id: string
          parcela_deduzir: number
          rbt12_ate: number
          rbt12_de: number
          reparticao: Json
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          aliquota: number
          anexo: string
          created_at?: string
          faixa: number
          id?: string
          parcela_deduzir?: number
          rbt12_ate: number
          rbt12_de: number
          reparticao?: Json
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          aliquota?: number
          anexo?: string
          created_at?: string
          faixa?: number
          id?: string
          parcela_deduzir?: number
          rbt12_ate?: number
          rbt12_de?: number
          reparticao?: Json
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: []
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
          observacoes: string | null
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
          observacoes?: string | null
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
          observacoes?: string | null
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
          {
            foreignKeyName: "faturamento_mensal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "faturamento_mensal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "faturamento_mensal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "faturamento_mensal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "faturamento_mensal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "faturamento_mensal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "faturamento_mensal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      fechamentos_tributarios: {
        Row: {
          ano: number
          checklist: Json
          created_at: string
          created_by: string | null
          empresa_id: string
          fechado_em: string | null
          fechado_por: string | null
          forcado: boolean
          id: string
          justificativa_forcado: string | null
          mes: number
          observacoes: string | null
          score_conformidade: number
          status: string
          total_apurado: number
          updated_at: string
        }
        Insert: {
          ano: number
          checklist?: Json
          created_at?: string
          created_by?: string | null
          empresa_id: string
          fechado_em?: string | null
          fechado_por?: string | null
          forcado?: boolean
          id?: string
          justificativa_forcado?: string | null
          mes: number
          observacoes?: string | null
          score_conformidade?: number
          status?: string
          total_apurado?: number
          updated_at?: string
        }
        Update: {
          ano?: number
          checklist?: Json
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          fechado_em?: string | null
          fechado_por?: string | null
          forcado?: boolean
          id?: string
          justificativa_forcado?: string | null
          mes?: number
          observacoes?: string | null
          score_conformidade?: number
          status?: string
          total_apurado?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fechamentos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fechamentos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fechamentos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fechamentos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fechamentos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fechamentos_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "fluxos_aprovacao_niveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fluxos_aprovacao_niveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fluxos_aprovacao_niveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fluxos_aprovacao_niveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fluxos_aprovacao_niveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fluxos_aprovacao_niveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fluxos_aprovacao_niveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          numero_funcionarios: number | null
          observacoes: string | null
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
          numero_funcionarios?: number | null
          observacoes?: string | null
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
          numero_funcionarios?: number | null
          observacoes?: string | null
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
          {
            foreignKeyName: "folha_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "folha_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "folha_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "folha_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "folha_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "folha_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "folha_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "formas_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cidade: string | null
          cnpj: string | null
          cnpj_cpf: string | null
          contato: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          limite_credito: number | null
          nome: string | null
          nome_fantasia: string | null
          observacoes: string | null
          ramo_atividade: string | null
          razao_social: string
          score: number | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          cnpj?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          limite_credito?: number | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          ramo_atividade?: string | null
          razao_social: string
          score?: number | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          cnpj?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          limite_credito?: number | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          ramo_atividade?: string | null
          razao_social?: string
          score?: number | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_alert_state: {
        Row: {
          alertas_enviados: number
          assinatura: string
          created_at: string
          exemplo_mensagem: string | null
          ocorrencias_no_ultimo_alerta: number
          primeiro_alerta_em: string
          severity: string
          silenciado_ate: string | null
          ultimo_alerta_em: string
          updated_at: string
        }
        Insert: {
          alertas_enviados?: number
          assinatura: string
          created_at?: string
          exemplo_mensagem?: string | null
          ocorrencias_no_ultimo_alerta?: number
          primeiro_alerta_em?: string
          severity?: string
          silenciado_ate?: string | null
          ultimo_alerta_em?: string
          updated_at?: string
        }
        Update: {
          alertas_enviados?: number
          assinatura?: string
          created_at?: string
          exemplo_mensagem?: string | null
          ocorrencias_no_ultimo_alerta?: number
          primeiro_alerta_em?: string
          severity?: string
          silenciado_ate?: string | null
          ultimo_alerta_em?: string
          updated_at?: string
        }
        Relationships: []
      }
      frontend_error_logs: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs_2026_04: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs_2026_05: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs_2026_06: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs_2026_07: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs_2026_08: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs_2026_09: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs_2026_10: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_error_logs_default: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frontend_performance_logs: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          navigation_type: string | null
          rating: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          navigation_type?: string | null
          rating?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          navigation_type?: string | null
          rating?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          value?: number
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
      glossario_tributario: {
        Row: {
          ativo: boolean
          base_legal: string | null
          categoria: string | null
          created_at: string
          exemplo: string | null
          id: string
          ordem: number
          sigla: string | null
          significado: string
          termo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          base_legal?: string | null
          categoria?: string | null
          created_at?: string
          exemplo?: string | null
          id?: string
          ordem?: number
          sigla?: string | null
          significado: string
          termo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          base_legal?: string | null
          categoria?: string | null
          created_at?: string
          exemplo?: string | null
          id?: string
          ordem?: number
          sigla?: string | null
          significado?: string
          termo?: string
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
          {
            foreignKeyName: "health_scores_operacionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "health_scores_operacionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "health_scores_operacionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "health_scores_operacionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "health_scores_operacionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "health_scores_operacionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "health_scores_operacionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "historico_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "historico_cobranca_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_cobranca_whatsapp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
      historico_relatorios: {
        Row: {
          dados_relatorio: Json | null
          duracao_ms: number | null
          erro_mensagem: string | null
          executado_em: string
          id: string
          relatorio_agendado_id: string
          status: string
        }
        Insert: {
          dados_relatorio?: Json | null
          duracao_ms?: number | null
          erro_mensagem?: string | null
          executado_em?: string
          id?: string
          relatorio_agendado_id: string
          status?: string
        }
        Update: {
          dados_relatorio?: Json | null
          duracao_ms?: number | null
          erro_mensagem?: string | null
          executado_em?: string
          id?: string
          relatorio_agendado_id?: string
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
          created_at: string | null
          data_calculo: string | null
          detalhes: Json | null
          empresa_id: string | null
          id: string
          score: number
        }
        Insert: {
          created_at?: string | null
          data_calculo?: string | null
          detalhes?: Json | null
          empresa_id?: string | null
          id?: string
          score: number
        }
        Update: {
          created_at?: string | null
          data_calculo?: string | null
          detalhes?: Json | null
          empresa_id?: string | null
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_score_saude_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_score_saude_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_score_saude_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_score_saude_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_score_saude_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_score_saude_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_score_saude_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "historico_score_saude_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      incentivos_fiscais: {
        Row: {
          ano_fim: number
          ano_inicio: number
          ativo: boolean
          ato_concessorio: string | null
          created_at: string
          created_by: string | null
          empresa_id: string
          id: string
          limite_percentual: number
          limite_valor: number
          nome: string
          numero_processo: string | null
          tipo_incentivo: string
          updated_at: string
          valor_utilizado_ano: number
        }
        Insert: {
          ano_fim: number
          ano_inicio: number
          ativo?: boolean
          ato_concessorio?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id: string
          id?: string
          limite_percentual?: number
          limite_valor?: number
          nome: string
          numero_processo?: string | null
          tipo_incentivo: string
          updated_at?: string
          valor_utilizado_ano?: number
        }
        Update: {
          ano_fim?: number
          ano_inicio?: number
          ativo?: boolean
          ato_concessorio?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          id?: string
          limite_percentual?: number
          limite_valor?: number
          nome?: string
          numero_processo?: string | null
          tipo_incentivo?: string
          updated_at?: string
          valor_utilizado_ano?: number
        }
        Relationships: [
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "incentivos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      integration_secrets: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      integrity_alerts: {
        Row: {
          affected_count: number
          alert_hour: string
          created_at: string
          domain: string
          id: string
          invariant: string
          metadata: Json | null
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          resolved_reason: string | null
          sample_ids: string[] | null
          severity: string
          updated_at: string
        }
        Insert: {
          affected_count?: number
          alert_hour?: string
          created_at?: string
          domain: string
          id?: string
          invariant: string
          metadata?: Json | null
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          sample_ids?: string[] | null
          severity: string
          updated_at?: string
        }
        Update: {
          affected_count?: number
          alert_hour?: string
          created_at?: string
          domain?: string
          id?: string
          invariant?: string
          metadata?: Json | null
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          sample_ids?: string[] | null
          severity?: string
          updated_at?: string
        }
        Relationships: []
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
      itens_lista_iss: {
        Row: {
          aliquota_maxima: number
          aliquota_minima: number
          codigo: string
          created_at: string
          descricao: string
          id: string
          retem_no_tomador: boolean
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          aliquota_maxima?: number
          aliquota_minima?: number
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          retem_no_tomador?: boolean
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          aliquota_maxima?: number
          aliquota_minima?: number
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          retem_no_tomador?: boolean
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
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
      kpis_operacionais: {
        Row: {
          categoria: string | null
          created_at: string
          id: string
          meta: number
          nome: string
          tendencia: string | null
          unidade: string | null
          updated_at: string
          user_id: string
          valor_atual: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          id?: string
          meta?: number
          nome: string
          tendencia?: string | null
          unidade?: string | null
          updated_at?: string
          user_id: string
          valor_atual?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          id?: string
          meta?: number
          nome?: string
          tendencia?: string | null
          unidade?: string | null
          updated_at?: string
          user_id?: string
          valor_atual?: number
        }
        Relationships: []
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
          competencia: string | null
          created_at: string
          created_by: string | null
          data_lancamento: string
          empresa_id: string | null
          historico: string | null
          id: string
          numero_lancamento: number | null
          origem: string | null
          status: string
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          competencia?: string | null
          created_at?: string
          created_by?: string | null
          data_lancamento?: string
          empresa_id?: string | null
          historico?: string | null
          id?: string
          numero_lancamento?: number | null
          origem?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
        }
        Update: {
          competencia?: string | null
          created_at?: string
          created_by?: string | null
          data_lancamento?: string
          empresa_id?: string | null
          historico?: string | null
          id?: string
          numero_lancamento?: number | null
          origem?: string | null
          status?: string
          updated_at?: string
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
        ]
      }
      metas_financeiras: {
        Row: {
          ano: number
          ativo: boolean
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
          ativo?: boolean
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
          ativo?: boolean
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
          {
            foreignKeyName: "metas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "metas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "metas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "metas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "metas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "metas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "metas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "movimentacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      n8n_dispatch_logs: {
        Row: {
          attempt: number
          config_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          risk_score: number | null
          success: boolean
        }
        Insert: {
          attempt?: number
          config_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          risk_score?: number | null
          success?: boolean
        }
        Update: {
          attempt?: number
          config_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          risk_score?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "n8n_dispatch_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflow_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_workflow_configs: {
        Row: {
          created_at: string
          created_by: string | null
          enabled: boolean
          event_type: string
          filters: Json
          headers: Json
          id: string
          max_risk_score: number
          min_risk_score: number
          name: string
          retry_count: number
          timeout_ms: number
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          event_type: string
          filters?: Json
          headers?: Json
          id?: string
          max_risk_score?: number
          min_risk_score?: number
          name: string
          retry_count?: number
          timeout_ms?: number
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          event_type?: string
          filters?: Json
          headers?: Json
          id?: string
          max_risk_score?: number
          min_risk_score?: number
          name?: string
          retry_count?: number
          timeout_ms?: number
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      ncms: {
        Row: {
          aliquota_ipi: number
          cest: string | null
          codigo: string
          created_at: string
          descricao: string
          id: string
          monofasico_pis_cofins: boolean
          mva_padrao: number | null
          observacoes: string | null
          sujeito_st: boolean
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          aliquota_ipi?: number
          cest?: string | null
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          monofasico_pis_cofins?: boolean
          mva_padrao?: number | null
          observacoes?: string | null
          sujeito_st?: boolean
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          aliquota_ipi?: number
          cest?: string | null
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          monofasico_pis_cofins?: boolean
          mva_padrao?: number | null
          observacoes?: string | null
          sujeito_st?: boolean
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: []
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
      nfe_eventos: {
        Row: {
          chave_acesso: string
          codigo_evento: string | null
          created_at: string
          created_by: string | null
          data_evento: string
          id: string
          justificativa: string | null
          motivo_retorno: string | null
          protocolo: string | null
          raw_payload: Json | null
          sequencial: number
          status_retorno: string | null
          tipo_evento: string
          xml_path: string | null
        }
        Insert: {
          chave_acesso: string
          codigo_evento?: string | null
          created_at?: string
          created_by?: string | null
          data_evento?: string
          id?: string
          justificativa?: string | null
          motivo_retorno?: string | null
          protocolo?: string | null
          raw_payload?: Json | null
          sequencial?: number
          status_retorno?: string | null
          tipo_evento: string
          xml_path?: string | null
        }
        Update: {
          chave_acesso?: string
          codigo_evento?: string | null
          created_at?: string
          created_by?: string | null
          data_evento?: string
          id?: string
          justificativa?: string | null
          motivo_retorno?: string | null
          protocolo?: string | null
          raw_payload?: Json | null
          sequencial?: number
          status_retorno?: string | null
          tipo_evento?: string
          xml_path?: string | null
        }
        Relationships: []
      }
      nfe_recebidas: {
        Row: {
          ambiente: Database["public"]["Enums"]["sefaz_ambiente"]
          chave_acesso: string
          cnpj_destinatario: string
          cnpj_emitente: string
          conta_pagar_id: string | null
          created_at: string
          data_emissao: string | null
          digest_value: string | null
          empresa_id: string | null
          id: string
          ie_emitente: string | null
          manifestacao_data: string | null
          manifestacao_justificativa: string | null
          manifestacao_status: Database["public"]["Enums"]["nfe_manifestacao_status"]
          modelo: string
          nsu: number
          numero: string | null
          raw_metadata: Json | null
          razao_emitente: string | null
          schema_tipo: Database["public"]["Enums"]["nfe_schema_tipo"]
          serie: string | null
          situacao_nfe: string | null
          tipo_documento: string
          uf_emitente: string | null
          updated_at: string
          valor_total: number | null
          xml_completo: boolean
          xml_path: string | null
        }
        Insert: {
          ambiente?: Database["public"]["Enums"]["sefaz_ambiente"]
          chave_acesso: string
          cnpj_destinatario: string
          cnpj_emitente: string
          conta_pagar_id?: string | null
          created_at?: string
          data_emissao?: string | null
          digest_value?: string | null
          empresa_id?: string | null
          id?: string
          ie_emitente?: string | null
          manifestacao_data?: string | null
          manifestacao_justificativa?: string | null
          manifestacao_status?: Database["public"]["Enums"]["nfe_manifestacao_status"]
          modelo?: string
          nsu: number
          numero?: string | null
          raw_metadata?: Json | null
          razao_emitente?: string | null
          schema_tipo: Database["public"]["Enums"]["nfe_schema_tipo"]
          serie?: string | null
          situacao_nfe?: string | null
          tipo_documento?: string
          uf_emitente?: string | null
          updated_at?: string
          valor_total?: number | null
          xml_completo?: boolean
          xml_path?: string | null
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["sefaz_ambiente"]
          chave_acesso?: string
          cnpj_destinatario?: string
          cnpj_emitente?: string
          conta_pagar_id?: string | null
          created_at?: string
          data_emissao?: string | null
          digest_value?: string | null
          empresa_id?: string | null
          id?: string
          ie_emitente?: string | null
          manifestacao_data?: string | null
          manifestacao_justificativa?: string | null
          manifestacao_status?: Database["public"]["Enums"]["nfe_manifestacao_status"]
          modelo?: string
          nsu?: number
          numero?: string | null
          raw_metadata?: Json | null
          razao_emitente?: string | null
          schema_tipo?: Database["public"]["Enums"]["nfe_schema_tipo"]
          serie?: string | null
          situacao_nfe?: string | null
          tipo_documento?: string
          uf_emitente?: string | null
          updated_at?: string
          valor_total?: number | null
          xml_completo?: boolean
          xml_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_recebidas_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_recebidas_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_pagar_painel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfe_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "nfe_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "nfe_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "nfe_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "nfe_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "nfe_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "nfe_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          chave_acesso: string | null
          cliente_cnpj: string | null
          cliente_nome: string | null
          created_at: string | null
          data_emissao: string | null
          empresa_id: string | null
          id: string
          numero: string | null
          serie: string | null
          status: string | null
          valor_desconto: number
          valor_frete: number
          valor_icms: number | null
          valor_produtos: number | null
          valor_total: number | null
          xml_url: string | null
        }
        Insert: {
          chave_acesso?: string | null
          cliente_cnpj?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_emissao?: string | null
          empresa_id?: string | null
          id?: string
          numero?: string | null
          serie?: string | null
          status?: string | null
          valor_desconto?: number
          valor_frete?: number
          valor_icms?: number | null
          valor_produtos?: number | null
          valor_total?: number | null
          xml_url?: string | null
        }
        Update: {
          chave_acesso?: string | null
          cliente_cnpj?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          data_emissao?: string | null
          empresa_id?: string | null
          id?: string
          numero?: string | null
          serie?: string | null
          status?: string | null
          valor_desconto?: number
          valor_frete?: number
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
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      notas_fiscais_ocr: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          chave_acesso: string | null
          created_at: string
          dados_extraidos: Json
          data_emissao: string | null
          emitente_cnpj: string | null
          emitente_nome: string | null
          empresa_id: string
          erro_mensagem: string | null
          id: string
          numero: string | null
          serie: string | null
          status: string
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          chave_acesso?: string | null
          created_at?: string
          dados_extraidos?: Json
          data_emissao?: string | null
          emitente_cnpj?: string | null
          emitente_nome?: string | null
          empresa_id: string
          erro_mensagem?: string | null
          id?: string
          numero?: string | null
          serie?: string | null
          status?: string
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          chave_acesso?: string | null
          created_at?: string
          dados_extraidos?: Json
          data_emissao?: string | null
          emitente_cnpj?: string | null
          emitente_nome?: string | null
          empresa_id?: string
          erro_mensagem?: string | null
          id?: string
          numero?: string | null
          serie?: string | null
          status?: string
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_ocr_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_ocr_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_ocr_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_ocr_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_ocr_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_ocr_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_ocr_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "notas_fiscais_ocr_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      notification_history: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          source_ref: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          source_ref?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          source_ref?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      open_finance_consents: {
        Row: {
          authorization_url: string | null
          created_at: string | null
          id: string
          institution_id: string
          permissions: string[] | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          authorization_url?: string | null
          created_at?: string | null
          id?: string
          institution_id: string
          permissions?: string[] | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          authorization_url?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string
          permissions?: string[] | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operacoes_icms: {
        Row: {
          created_at: string
          data_operacao: string
          difal: number
          empresa_id: string
          fcp: number
          finalidade: string | null
          icms_operacao_propria: number
          icms_st: number
          id: string
          ncm: string
          tipo_destinatario: Database["public"]["Enums"]["tipo_destinatario"]
          tipo_operacao: string
          tributos_aplicaveis: Json
          tributos_nao_aplicaveis: Json
          uf_destino: Database["public"]["Enums"]["uf_brasil"]
          uf_origem: Database["public"]["Enums"]["uf_brasil"]
          updated_at: string
          valor_operacao: number
          valor_total_icms: number
        }
        Insert: {
          created_at?: string
          data_operacao?: string
          difal?: number
          empresa_id: string
          fcp?: number
          finalidade?: string | null
          icms_operacao_propria?: number
          icms_st?: number
          id?: string
          ncm: string
          tipo_destinatario: Database["public"]["Enums"]["tipo_destinatario"]
          tipo_operacao: string
          tributos_aplicaveis?: Json
          tributos_nao_aplicaveis?: Json
          uf_destino: Database["public"]["Enums"]["uf_brasil"]
          uf_origem: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          valor_operacao: number
          valor_total_icms?: number
        }
        Update: {
          created_at?: string
          data_operacao?: string
          difal?: number
          empresa_id?: string
          fcp?: number
          finalidade?: string | null
          icms_operacao_propria?: number
          icms_st?: number
          id?: string
          ncm?: string
          tipo_destinatario?: Database["public"]["Enums"]["tipo_destinatario"]
          tipo_operacao?: string
          tributos_aplicaveis?: Json
          tributos_nao_aplicaveis?: Json
          uf_destino?: Database["public"]["Enums"]["uf_brasil"]
          uf_origem?: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          valor_operacao?: number
          valor_total_icms?: number
        }
        Relationships: [
          {
            foreignKeyName: "operacoes_icms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operacoes_icms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_icms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_icms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_icms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_icms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_icms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_icms_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      operacoes_tributaveis: {
        Row: {
          apuracao_id: string | null
          base_calculo: number
          cbs_aliquota: number | null
          cbs_credito: number | null
          cbs_valor: number | null
          cfop: string | null
          cliente_id: string | null
          cnpj_cpf_contraparte: string | null
          cofins_aliquota: number
          cofins_valor: number | null
          competencia: string | null
          created_at: string | null
          data_operacao: string | null
          documento_chave: string | null
          documento_numero: string | null
          documento_serie: string | null
          documento_tipo: string
          empresa_id: string | null
          erro_mensagem: string | null
          fornecedor_id: string | null
          ibs_aliquota: number | null
          ibs_credito: number | null
          ibs_valor: number | null
          icms_aliquota: number
          icms_valor: number | null
          id: string
          is_aliquota: number
          is_categoria: string | null
          is_valor: number | null
          isento: boolean
          iss_aliquota: number
          iss_valor: number | null
          motivo_isencao: string | null
          ncm: string | null
          nome_contraparte: string | null
          nota_fiscal_id: string | null
          pis_aliquota: number
          pis_valor: number | null
          reducao_aliquota: number
          regime_especial: string | null
          split_payment: boolean
          split_payment_valor: number
          status: string | null
          tipo_operacao: string | null
          uf_destino: string | null
          uf_origem: string | null
          updated_at: string
          valor_desconto: number
          valor_frete: number
          valor_operacao: number
          valor_total: number | null
        }
        Insert: {
          apuracao_id?: string | null
          base_calculo?: number
          cbs_aliquota?: number | null
          cbs_credito?: number | null
          cbs_valor?: number | null
          cfop?: string | null
          cliente_id?: string | null
          cnpj_cpf_contraparte?: string | null
          cofins_aliquota?: number
          cofins_valor?: number | null
          competencia?: string | null
          created_at?: string | null
          data_operacao?: string | null
          documento_chave?: string | null
          documento_numero?: string | null
          documento_serie?: string | null
          documento_tipo?: string
          empresa_id?: string | null
          erro_mensagem?: string | null
          fornecedor_id?: string | null
          ibs_aliquota?: number | null
          ibs_credito?: number | null
          ibs_valor?: number | null
          icms_aliquota?: number
          icms_valor?: number | null
          id?: string
          is_aliquota?: number
          is_categoria?: string | null
          is_valor?: number | null
          isento?: boolean
          iss_aliquota?: number
          iss_valor?: number | null
          motivo_isencao?: string | null
          ncm?: string | null
          nome_contraparte?: string | null
          nota_fiscal_id?: string | null
          pis_aliquota?: number
          pis_valor?: number | null
          reducao_aliquota?: number
          regime_especial?: string | null
          split_payment?: boolean
          split_payment_valor?: number
          status?: string | null
          tipo_operacao?: string | null
          uf_destino?: string | null
          uf_origem?: string | null
          updated_at?: string
          valor_desconto?: number
          valor_frete?: number
          valor_operacao?: number
          valor_total?: number | null
        }
        Update: {
          apuracao_id?: string | null
          base_calculo?: number
          cbs_aliquota?: number | null
          cbs_credito?: number | null
          cbs_valor?: number | null
          cfop?: string | null
          cliente_id?: string | null
          cnpj_cpf_contraparte?: string | null
          cofins_aliquota?: number
          cofins_valor?: number | null
          competencia?: string | null
          created_at?: string | null
          data_operacao?: string | null
          documento_chave?: string | null
          documento_numero?: string | null
          documento_serie?: string | null
          documento_tipo?: string
          empresa_id?: string | null
          erro_mensagem?: string | null
          fornecedor_id?: string | null
          ibs_aliquota?: number | null
          ibs_credito?: number | null
          ibs_valor?: number | null
          icms_aliquota?: number
          icms_valor?: number | null
          id?: string
          is_aliquota?: number
          is_categoria?: string | null
          is_valor?: number | null
          isento?: boolean
          iss_aliquota?: number
          iss_valor?: number | null
          motivo_isencao?: string | null
          ncm?: string | null
          nome_contraparte?: string | null
          nota_fiscal_id?: string | null
          pis_aliquota?: number
          pis_valor?: number | null
          reducao_aliquota?: number
          regime_especial?: string | null
          split_payment?: boolean
          split_payment_valor?: number
          status?: string | null
          tipo_operacao?: string | null
          uf_destino?: string | null
          uf_origem?: string | null
          updated_at?: string
          valor_desconto?: number
          valor_frete?: number
          valor_operacao?: number
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
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "operacoes_tributaveis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      oportunidades_elisao: {
        Row: {
          aplicavel: boolean
          base_legal: string | null
          categoria: string | null
          created_at: string
          created_by: string | null
          custo_implementacao: number | null
          data_identificacao: string
          economia_10anos_estimada: number | null
          economia_estimada: number
          empresa_id: string
          estrategia: string
          id: string
          inputs_utilizados: Json | null
          memoria_calculo: string | null
          motivo_nao_aplicavel: string | null
          observacoes: string | null
          payback_meses: number | null
          risco: string | null
          roi_pct: number | null
          status: string
          status_alterado_em: string | null
          status_alterado_por: string | null
          updated_at: string
        }
        Insert: {
          aplicavel?: boolean
          base_legal?: string | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          custo_implementacao?: number | null
          data_identificacao?: string
          economia_10anos_estimada?: number | null
          economia_estimada?: number
          empresa_id: string
          estrategia: string
          id?: string
          inputs_utilizados?: Json | null
          memoria_calculo?: string | null
          motivo_nao_aplicavel?: string | null
          observacoes?: string | null
          payback_meses?: number | null
          risco?: string | null
          roi_pct?: number | null
          status?: string
          status_alterado_em?: string | null
          status_alterado_por?: string | null
          updated_at?: string
        }
        Update: {
          aplicavel?: boolean
          base_legal?: string | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          custo_implementacao?: number | null
          data_identificacao?: string
          economia_10anos_estimada?: number | null
          economia_estimada?: number
          empresa_id?: string
          estrategia?: string
          id?: string
          inputs_utilizados?: Json | null
          memoria_calculo?: string | null
          motivo_nao_aplicavel?: string | null
          observacoes?: string | null
          payback_meses?: number | null
          risco?: string | null
          roi_pct?: number | null
          status?: string
          status_alterado_em?: string | null
          status_alterado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_elisao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_elisao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "oportunidades_elisao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "oportunidades_elisao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "oportunidades_elisao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "oportunidades_elisao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "oportunidades_elisao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "oportunidades_elisao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      organizacao_membros: {
        Row: {
          aceito_em: string | null
          ativo: boolean
          convidado_por: string | null
          created_at: string
          id: string
          organizacao_id: string
          papel_na_org: Database["public"]["Enums"]["org_papel"]
          updated_at: string
          usuario_id: string
        }
        Insert: {
          aceito_em?: string | null
          ativo?: boolean
          convidado_por?: string | null
          created_at?: string
          id?: string
          organizacao_id: string
          papel_na_org?: Database["public"]["Enums"]["org_papel"]
          updated_at?: string
          usuario_id: string
        }
        Update: {
          aceito_em?: string | null
          ativo?: boolean
          convidado_por?: string | null
          created_at?: string
          id?: string
          organizacao_id?: string
          papel_na_org?: Database["public"]["Enums"]["org_papel"]
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizacao_membros_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          responsavel_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          responsavel_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          responsavel_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      overlay_rejeicoes_auditoria: {
        Row: {
          campo: string
          catalogo: string
          created_at: string
          descricao: string | null
          id: string
          identificador: string
          motivo: string
          observacao: string | null
          ocorrencias: number
          primeira_deteccao: string
          referencia: string
          resolvido_em: string | null
          resolvido_por: string | null
          severidade: string
          ultima_deteccao: string
          updated_at: string
          valor_recebido: string | null
        }
        Insert: {
          campo: string
          catalogo: string
          created_at?: string
          descricao?: string | null
          id?: string
          identificador: string
          motivo: string
          observacao?: string | null
          ocorrencias?: number
          primeira_deteccao?: string
          referencia: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          severidade?: string
          ultima_deteccao?: string
          updated_at?: string
          valor_recebido?: string | null
        }
        Update: {
          campo?: string
          catalogo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          identificador?: string
          motivo?: string
          observacao?: string | null
          ocorrencias?: number
          primeira_deteccao?: string
          referencia?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          severidade?: string
          ultima_deteccao?: string
          updated_at?: string
          valor_recebido?: string | null
        }
        Relationships: []
      }
      pagamentos_recorrentes: {
        Row: {
          ativo: boolean
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
          tipo_cobranca: Database["public"]["Enums"]["tipo_cobranca"]
          total_gerado: number
          ultima_geracao: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          centro_custo_id?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by?: string
          data_fim?: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number
          empresa_id: string
          fornecedor_id?: string | null
          fornecedor_nome: string
          frequencia: string
          id?: string
          observacoes?: string | null
          proxima_geracao?: string | null
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          total_gerado?: number
          ultima_geracao?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
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
          tipo_cobranca?: Database["public"]["Enums"]["tipo_cobranca"]
          total_gerado?: number
          ultima_geracao?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "pagamentos_recorrentes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          conta_id: string | null
          created_at: string | null
          historico_complementar: string | null
          id: string
          lancamento_id: string | null
          ordem: number | null
          tipo: string
          valor: number
        }
        Insert: {
          conta_id?: string | null
          created_at?: string | null
          historico_complementar?: string | null
          id?: string
          lancamento_id?: string | null
          ordem?: number | null
          tipo: string
          valor: number
        }
        Update: {
          conta_id?: string | null
          created_at?: string | null
          historico_complementar?: string | null
          id?: string
          lancamento_id?: string | null
          ordem?: number | null
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
      per_dcomp: {
        Row: {
          competencia_destino: string | null
          competencia_origem: string
          created_at: string
          created_by: string | null
          creditos_ids: string[]
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
          status: string
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
          creditos_ids?: string[]
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
          status?: string
          tipo: string
          tipo_credito_origem: string
          tributo_destino?: string | null
          tributo_origem: string
          updated_at?: string
          valor_atualizado?: number | null
          valor_compensado?: number | null
          valor_original?: number
        }
        Update: {
          competencia_destino?: string | null
          competencia_origem?: string
          created_at?: string
          created_by?: string | null
          creditos_ids?: string[]
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
          status?: string
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
          {
            foreignKeyName: "per_dcomp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "per_dcomp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "per_dcomp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "per_dcomp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "per_dcomp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "per_dcomp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "per_dcomp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          alert_hour: string
          alert_key: string
          baseline_value: number | null
          created_at: string
          current_value: number
          id: string
          metadata: Json
          query_snippet: string | null
          ratio: number | null
          reason: string
          resolved_at: string | null
          resolved_reason: string | null
          sample_count: number | null
          severity: string
          source: string
        }
        Insert: {
          alert_hour?: string
          alert_key: string
          baseline_value?: number | null
          created_at?: string
          current_value: number
          id?: string
          metadata?: Json
          query_snippet?: string | null
          ratio?: number | null
          reason: string
          resolved_at?: string | null
          resolved_reason?: string | null
          sample_count?: number | null
          severity: string
          source: string
        }
        Update: {
          alert_hour?: string
          alert_key?: string
          baseline_value?: number | null
          created_at?: string
          current_value?: number
          id?: string
          metadata?: Json
          query_snippet?: string | null
          ratio?: number | null
          reason?: string
          resolved_at?: string | null
          resolved_reason?: string | null
          sample_count?: number | null
          severity?: string
          source?: string
        }
        Relationships: []
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
      pg_stat_statements_baseline: {
        Row: {
          calls: number | null
          captured_at: string
          created_at: string
          id: string
          label: string
          max_exec_time: number | null
          mean_exec_time: number | null
          query: string | null
          queryid: number | null
          rows: number | null
          shared_blks_hit: number | null
          shared_blks_read: number | null
          total_exec_time: number | null
        }
        Insert: {
          calls?: number | null
          captured_at?: string
          created_at?: string
          id?: string
          label: string
          max_exec_time?: number | null
          mean_exec_time?: number | null
          query?: string | null
          queryid?: number | null
          rows?: number | null
          shared_blks_hit?: number | null
          shared_blks_read?: number | null
          total_exec_time?: number | null
        }
        Update: {
          calls?: number | null
          captured_at?: string
          created_at?: string
          id?: string
          label?: string
          max_exec_time?: number | null
          mean_exec_time?: number | null
          query?: string | null
          queryid?: number | null
          rows?: number | null
          shared_blks_hit?: number | null
          shared_blks_read?: number | null
          total_exec_time?: number | null
        }
        Relationships: []
      }
      pix_templates: {
        Row: {
          ativo: boolean
          beneficiario_nome: string | null
          categoria: string | null
          centro_custo_id: string | null
          chave_pix: string
          cidade: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          empresa_id: string | null
          favorecido_cpf_cnpj: string | null
          favorecido_nome: string | null
          id: string
          instrucoes: string | null
          nome: string
          tags: string[]
          tipo_chave: string | null
          tipo_chave_pix: string | null
          ultimo_uso: string | null
          updated_at: string
          uso_count: number
          valor_fixo: boolean
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          beneficiario_nome?: string | null
          categoria?: string | null
          centro_custo_id?: string | null
          chave_pix: string
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          empresa_id?: string | null
          favorecido_cpf_cnpj?: string | null
          favorecido_nome?: string | null
          id?: string
          instrucoes?: string | null
          nome: string
          tags?: string[]
          tipo_chave?: string | null
          tipo_chave_pix?: string | null
          ultimo_uso?: string | null
          updated_at?: string
          uso_count?: number
          valor_fixo?: boolean
          valor_padrao?: number
        }
        Update: {
          ativo?: boolean
          beneficiario_nome?: string | null
          categoria?: string | null
          centro_custo_id?: string | null
          chave_pix?: string
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          empresa_id?: string | null
          favorecido_cpf_cnpj?: string | null
          favorecido_nome?: string | null
          id?: string
          instrucoes?: string | null
          nome?: string
          tags?: string[]
          tipo_chave?: string | null
          tipo_chave_pix?: string | null
          ultimo_uso?: string | null
          updated_at?: string
          uso_count?: number
          valor_fixo?: boolean
          valor_padrao?: number
        }
        Relationships: []
      }
      plano_contas: {
        Row: {
          aceita_lancamento: boolean
          ativo: boolean | null
          centro_resultado: string | null
          codigo: string
          codigo_referencial: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          natureza: string | null
          nivel: number
          nome: string
          parent_id: string | null
          tipo: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aceita_lancamento?: boolean
          ativo?: boolean | null
          centro_resultado?: string | null
          codigo: string
          codigo_referencial?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          natureza?: string | null
          nivel?: number
          nome: string
          parent_id?: string | null
          tipo?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aceita_lancamento?: boolean
          ativo?: boolean | null
          centro_resultado?: string | null
          codigo?: string
          codigo_referencial?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          natureza?: string | null
          nivel?: number
          nome?: string
          parent_id?: string | null
          tipo?: string | null
          updated_at?: string
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
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "plano_contas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "plano_contas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_acao: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          prazo: string | null
          prioridade: string
          progresso: number
          responsavel: string | null
          status: string
          tags: string[] | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string
          progresso?: number
          responsavel?: string | null
          status?: string
          tags?: string[] | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string
          progresso?: number
          responsavel?: string | null
          status?: string
          tags?: string[] | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          trimestre_origem: number | null
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
          trimestre_origem?: number | null
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
          trimestre_origem?: number | null
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
          {
            foreignKeyName: "prejuizos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "prejuizos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "prejuizos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "prejuizos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "prejuizos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "prejuizos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "prejuizos_fiscais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
      projecoes_reforma: {
        Row: {
          ano: number
          carga_percentual: number
          cbs: number
          created_at: string
          empresa_id: string
          ibs: number
          icms: number
          id: string
          imposto_seletivo: number
          ipi: number
          iss: number
          pis_cofins: number
          tem_split_payment: boolean
          total_tributos: number
          updated_at: string
        }
        Insert: {
          ano: number
          carga_percentual: number
          cbs?: number
          created_at?: string
          empresa_id: string
          ibs?: number
          icms?: number
          id?: string
          imposto_seletivo?: number
          ipi?: number
          iss?: number
          pis_cofins?: number
          tem_split_payment?: boolean
          total_tributos: number
          updated_at?: string
        }
        Update: {
          ano?: number
          carga_percentual?: number
          cbs?: number
          created_at?: string
          empresa_id?: string
          ibs?: number
          icms?: number
          id?: string
          imposto_seletivo?: number
          ipi?: number
          iss?: number
          pis_cofins?: number
          tem_split_payment?: boolean
          total_tributos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projecoes_reforma_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projecoes_reforma_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "projecoes_reforma_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "projecoes_reforma_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "projecoes_reforma_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "projecoes_reforma_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "projecoes_reforma_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "projecoes_reforma_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
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
      protocolos_st: {
        Row: {
          base_legal: string | null
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          segmento: string | null
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          base_legal?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          segmento?: string | null
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          base_legal?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          segmento?: string | null
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: []
      }
      protocolos_st_ncms: {
        Row: {
          cest: string | null
          created_at: string
          id: string
          mva_original: number | null
          ncm_codigo: string
          ncm_id: string | null
          protocolo_id: string
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          cest?: string | null
          created_at?: string
          id?: string
          mva_original?: number | null
          ncm_codigo: string
          ncm_id?: string | null
          protocolo_id: string
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          cest?: string | null
          created_at?: string
          id?: string
          mva_original?: number | null
          ncm_codigo?: string
          ncm_id?: string | null
          protocolo_id?: string
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_st_ncms_ncm_id_fkey"
            columns: ["ncm_id"]
            isOneToOne: false
            referencedRelation: "ncms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_st_ncms_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos_st"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_st_ufs: {
        Row: {
          created_at: string
          id: string
          papel: string
          protocolo_id: string
          uf: Database["public"]["Enums"]["uf_brasil"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          papel?: string
          protocolo_id: string
          uf: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          papel?: string
          protocolo_id?: string
          uf?: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_st_ufs_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos_st"
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
          user_agent: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean
          auth?: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
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
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      recomendacoes_metas_ia: {
        Row: {
          aplicada: boolean | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          impacto_estimado: number | null
          tipo: string
          titulo: string
        }
        Insert: {
          aplicada?: boolean | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          impacto_estimado?: number | null
          tipo: string
          titulo: string
        }
        Update: {
          aplicada?: boolean | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          impacto_estimado?: number | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "recomendacoes_metas_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recomendacoes_metas_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "recomendacoes_metas_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "recomendacoes_metas_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "recomendacoes_metas_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "recomendacoes_metas_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "recomendacoes_metas_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "recomendacoes_metas_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      regime_decision_cache: {
        Row: {
          ano: number
          created_at: string
          decisao: Json
          empresa_id: string
          expires_at: string
          id: string
          mes: number
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          decisao: Json
          empresa_id: string
          expires_at: string
          id?: string
          mes: number
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          decisao?: Json
          empresa_id?: string
          expires_at?: string
          id?: string
          mes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regime_decision_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regime_decision_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regime_decision_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regime_decision_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regime_decision_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regime_decision_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regime_decision_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regime_decision_cache_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
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
          {
            foreignKeyName: "regimes_especiais_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_especiais_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_especiais_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_especiais_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_especiais_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_especiais_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_especiais_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      regimes_simulados: {
        Row: {
          ajustes_aplicados: Json
          alertas: Json
          ano_referencia: number
          audit_log_id: string | null
          cenarios: Json
          created_by: string | null
          data_simulacao: string
          economia_anual_estimada: number | null
          empresa_id: string
          fator_r: number | null
          folha_12m: number | null
          id: string
          justificativa: string | null
          parametros: Json
          rbt12: number | null
          regime_atual: string | null
          regime_recomendado: string
          updated_at: string
          versao_motor: string | null
        }
        Insert: {
          ajustes_aplicados?: Json
          alertas?: Json
          ano_referencia: number
          audit_log_id?: string | null
          cenarios?: Json
          created_by?: string | null
          data_simulacao?: string
          economia_anual_estimada?: number | null
          empresa_id: string
          fator_r?: number | null
          folha_12m?: number | null
          id?: string
          justificativa?: string | null
          parametros?: Json
          rbt12?: number | null
          regime_atual?: string | null
          regime_recomendado: string
          updated_at?: string
          versao_motor?: string | null
        }
        Update: {
          ajustes_aplicados?: Json
          alertas?: Json
          ano_referencia?: number
          audit_log_id?: string | null
          cenarios?: Json
          created_by?: string | null
          data_simulacao?: string
          economia_anual_estimada?: number | null
          empresa_id?: string
          fator_r?: number | null
          folha_12m?: number | null
          id?: string
          justificativa?: string | null
          parametros?: Json
          rbt12?: number | null
          regime_atual?: string | null
          regime_recomendado?: string
          updated_at?: string
          versao_motor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regimes_simulados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regimes_simulados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_simulados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_simulados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_simulados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_simulados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_simulados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_simulados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "regimes_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regimes_tributarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          entidade_id: string | null
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
          entidade_id?: string | null
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
          entidade_id?: string | null
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
      regras_contabilizacao_automatica: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          conta_credito_id: string
          conta_debito_id: string
          created_at: string
          created_by: string | null
          empresa_id: string
          historico_template: string
          id: string
          nome: string
          prioridade: number
          tipo_evento: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          conta_credito_id: string
          conta_debito_id: string
          created_at?: string
          created_by?: string | null
          empresa_id: string
          historico_template?: string
          id?: string
          nome: string
          prioridade?: number
          tipo_evento: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          conta_credito_id?: string
          conta_debito_id?: string
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          historico_template?: string
          id?: string
          nome?: string
          prioridade?: number
          tipo_evento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regras_contabilizacao_automatica_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_contabilizacao_automatica_conta_credito_id_fkey"
            columns: ["conta_credito_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_contabilizacao_automatica_conta_debito_id_fkey"
            columns: ["conta_debito_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "regras_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_duplicidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regras_roteamento_financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          cliente_id: string | null
          conta_receber_id: string | null
          created_at: string | null
          data_ultima_acao: string | null
          empresa_id: string | null
          etapa_atual: string | null
          id: string
          proxima_acao_data: string | null
          status: string | null
          status_cobranca: string | null
          titulo_id: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          data_ultima_acao?: string | null
          empresa_id?: string | null
          etapa_atual?: string | null
          id?: string
          proxima_acao_data?: string | null
          status?: string | null
          status_cobranca?: string | null
          titulo_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          data_ultima_acao?: string | null
          empresa_id?: string | null
          etapa_atual?: string | null
          id?: string
          proxima_acao_data?: string | null
          status?: string | null
          status_cobranca?: string | null
          titulo_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regua_cobranca_status_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "regua_cobranca_status_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_titulo_id_fkey"
            columns: ["titulo_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regua_cobranca_status_titulo_id_fkey"
            columns: ["titulo_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_receber_painel"
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
          destinatarios: string[]
          dia_mes: number | null
          dia_semana: number | null
          empresa_id: string | null
          filtros: Json
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
          created_by?: string
          destinatarios?: string[]
          dia_mes?: number | null
          dia_semana?: number | null
          empresa_id?: string | null
          filtros?: Json
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
          destinatarios?: string[]
          dia_mes?: number | null
          dia_semana?: number | null
          empresa_id?: string | null
          filtros?: Json
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
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      relatorios_tributarios_agendados: {
        Row: {
          ano: number
          ativo: boolean
          created_at: string
          created_by: string | null
          destinatarios: string[]
          dia_envio: number
          empresa_id: string
          frequencia: string
          id: string
          proximo_envio_em: string | null
          ultimo_envio_em: string | null
          updated_at: string
        }
        Insert: {
          ano: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          destinatarios?: string[]
          dia_envio?: number
          empresa_id: string
          frequencia?: string
          id?: string
          proximo_envio_em?: string | null
          ultimo_envio_em?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          destinatarios?: string[]
          dia_envio?: number
          empresa_id?: string
          frequencia?: string
          id?: string
          proximo_envio_em?: string | null
          ultimo_envio_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_tributarios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorios_tributarios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_tributarios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_tributarios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_tributarios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_tributarios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_tributarios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "relatorios_tributarios_agendados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "resumos_executivos_semanais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "resumos_executivos_semanais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "resumos_executivos_semanais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "resumos_executivos_semanais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "resumos_executivos_semanais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "resumos_executivos_semanais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "resumos_executivos_semanais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      retencoes_fonte: {
        Row: {
          aliquota: number
          cnpj_participante: string | null
          codigo_receita: string | null
          competencia: string | null
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string | null
          darf_gerado: boolean
          data_fato_gerador: string | null
          data_recolhimento: string | null
          data_retencao: string | null
          data_vencimento: string | null
          empresa_id: string | null
          id: string
          nome_participante: string | null
          nota_fiscal_id: string | null
          numero_documento: string | null
          observacoes: string | null
          status: string
          tipo_imposto: string | null
          tipo_operacao: string | null
          tipo_retencao: string | null
          valor: number | null
          valor_base: number
          valor_retido: number
        }
        Insert: {
          aliquota?: number
          cnpj_participante?: string | null
          codigo_receita?: string | null
          competencia?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          darf_gerado?: boolean
          data_fato_gerador?: string | null
          data_recolhimento?: string | null
          data_retencao?: string | null
          data_vencimento?: string | null
          empresa_id?: string | null
          id?: string
          nome_participante?: string | null
          nota_fiscal_id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          status?: string
          tipo_imposto?: string | null
          tipo_operacao?: string | null
          tipo_retencao?: string | null
          valor?: number | null
          valor_base?: number
          valor_retido?: number
        }
        Update: {
          aliquota?: number
          cnpj_participante?: string | null
          codigo_receita?: string | null
          competencia?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          darf_gerado?: boolean
          data_fato_gerador?: string | null
          data_recolhimento?: string | null
          data_retencao?: string | null
          data_vencimento?: string | null
          empresa_id?: string | null
          id?: string
          nome_participante?: string | null
          nota_fiscal_id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          status?: string
          tipo_imposto?: string | null
          tipo_operacao?: string | null
          tipo_retencao?: string | null
          valor?: number | null
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
          {
            foreignKeyName: "retencoes_fonte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "retencoes_fonte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "retencoes_fonte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "retencoes_fonte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "retencoes_fonte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "retencoes_fonte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "retencoes_fonte_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
      rpc_observability_metrics: {
        Row: {
          called_at: string
          caller_role: string | null
          caller_user_id: string | null
          duration_ms: number
          error_message: string | null
          error_sqlstate: string | null
          function_name: string
          id: number
          meta: Json
          success: boolean
        }
        Insert: {
          called_at?: string
          caller_role?: string | null
          caller_user_id?: string | null
          duration_ms: number
          error_message?: string | null
          error_sqlstate?: string | null
          function_name: string
          id?: number
          meta?: Json
          success?: boolean
        }
        Update: {
          called_at?: string
          caller_role?: string | null
          caller_user_id?: string | null
          duration_ms?: number
          error_message?: string | null
          error_sqlstate?: string | null
          function_name?: string
          id?: number
          meta?: Json
          success?: boolean
        }
        Relationships: []
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
      saved_filter_subscriptions: {
        Row: {
          ativo: boolean
          canal: string
          created_at: string
          frequencia: string
          id: string
          saved_filter_id: string
          ultimo_envio_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          canal?: string
          created_at?: string
          frequencia?: string
          id?: string
          saved_filter_id: string
          ultimo_envio_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          canal?: string
          created_at?: string
          frequencia?: string
          id?: string
          saved_filter_id?: string
          ultimo_envio_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_filter_subscriptions_saved_filter_id_fkey"
            columns: ["saved_filter_id"]
            isOneToOne: false
            referencedRelation: "saved_filters"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string
          created_by: string | null
          empresa_id: string | null
          entity_type: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          name: string
          shared_with_roles: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          entity_type: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          name: string
          shared_with_roles?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          entity_type?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          name?: string
          shared_with_roles?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scim_operations_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          empresa_id: string | null
          external_id: string | null
          id: string
          operation: string
          request_body: Json | null
          resource_type: string
          response_body: Json | null
          status_code: number
          token_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          empresa_id?: string | null
          external_id?: string | null
          id?: string
          operation: string
          request_body?: Json | null
          resource_type: string
          response_body?: Json | null
          status_code: number
          token_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          empresa_id?: string | null
          external_id?: string | null
          id?: string
          operation?: string
          request_body?: Json | null
          resource_type?: string
          response_body?: Json | null
          status_code?: number
          token_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      scim_setup_checklist: {
        Row: {
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          id: string
          item_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          id?: string
          item_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          id?: string
          item_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scim_tokens: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          empresa_id: string
          expires_at: string | null
          id: string
          last_used_at: string | null
          nome: string
          provider_id: string | null
          token_hash: string
          token_prefix: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          empresa_id: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          nome: string
          provider_id?: string | null
          token_hash: string
          token_prefix: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          nome?: string
          provider_id?: string | null
          token_hash?: string
          token_prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "scim_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scim_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "scim_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "scim_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "scim_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "scim_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "scim_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "scim_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "scim_tokens_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          type: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          type: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resolved?: boolean
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
      sefaz_dfe_cursor: {
        Row: {
          ambiente: Database["public"]["Enums"]["sefaz_ambiente"]
          circuit_open: boolean
          cnpj: string
          created_at: string
          id: string
          last_error_at: string | null
          max_nsu: number
          next_run_at: string
          retry_count: number
          ultima_consulta: string | null
          ultimo_erro: string | null
          ultimo_nsu: number
          ultimo_status: string | null
          updated_at: string
        }
        Insert: {
          ambiente?: Database["public"]["Enums"]["sefaz_ambiente"]
          circuit_open?: boolean
          cnpj: string
          created_at?: string
          id?: string
          last_error_at?: string | null
          max_nsu?: number
          next_run_at?: string
          retry_count?: number
          ultima_consulta?: string | null
          ultimo_erro?: string | null
          ultimo_nsu?: number
          ultimo_status?: string | null
          updated_at?: string
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["sefaz_ambiente"]
          circuit_open?: boolean
          cnpj?: string
          created_at?: string
          id?: string
          last_error_at?: string | null
          max_nsu?: number
          next_run_at?: string
          retry_count?: number
          ultima_consulta?: string | null
          ultimo_erro?: string | null
          ultimo_nsu?: number
          ultimo_status?: string | null
          updated_at?: string
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
        ]
      }
      simulacao_tributos_detalhados: {
        Row: {
          adicional: number
          aliquota: number
          base_calculo: number
          base_legal: string
          created_at: string
          creditos: number
          fcp: number
          id: string
          memoria_calculo: Json | null
          regime: Database["public"]["Enums"]["regime_tributario_enum"]
          retencoes: number
          simulacao_id: string
          tributo: string
          valor_apurado: number
        }
        Insert: {
          adicional?: number
          aliquota: number
          base_calculo: number
          base_legal: string
          created_at?: string
          creditos?: number
          fcp?: number
          id?: string
          memoria_calculo?: Json | null
          regime: Database["public"]["Enums"]["regime_tributario_enum"]
          retencoes?: number
          simulacao_id: string
          tributo: string
          valor_apurado: number
        }
        Update: {
          adicional?: number
          aliquota?: number
          base_calculo?: number
          base_legal?: string
          created_at?: string
          creditos?: number
          fcp?: number
          id?: string
          memoria_calculo?: Json | null
          regime?: Database["public"]["Enums"]["regime_tributario_enum"]
          retencoes?: number
          simulacao_id?: string
          tributo?: string
          valor_apurado?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulacao_tributos_detalhados_simulacao_id_fkey"
            columns: ["simulacao_id"]
            isOneToOne: false
            referencedRelation: "simulacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      simulacoes: {
        Row: {
          base_legal_decisao: string | null
          carga_tributaria_recomendada: number | null
          created_at: string
          economia_anual_estimada: number | null
          empresa_id: string
          executada_por: string | null
          hash_inputs: string
          id: string
          inputs: Json
          motivo_recomendacao: string | null
          periodo_fim: string
          periodo_inicio: string
          regime_recomendado:
            | Database["public"]["Enums"]["regime_tributario_enum"]
            | null
          resultado_presumido: Json | null
          resultado_real: Json | null
          resultado_simples: Json | null
          tempo_execucao_ms: number | null
          updated_at: string
          versao_motor: string
        }
        Insert: {
          base_legal_decisao?: string | null
          carga_tributaria_recomendada?: number | null
          created_at?: string
          economia_anual_estimada?: number | null
          empresa_id: string
          executada_por?: string | null
          hash_inputs: string
          id?: string
          inputs: Json
          motivo_recomendacao?: string | null
          periodo_fim: string
          periodo_inicio: string
          regime_recomendado?:
            | Database["public"]["Enums"]["regime_tributario_enum"]
            | null
          resultado_presumido?: Json | null
          resultado_real?: Json | null
          resultado_simples?: Json | null
          tempo_execucao_ms?: number | null
          updated_at?: string
          versao_motor?: string
        }
        Update: {
          base_legal_decisao?: string | null
          carga_tributaria_recomendada?: number | null
          created_at?: string
          economia_anual_estimada?: number | null
          empresa_id?: string
          executada_por?: string | null
          hash_inputs?: string
          id?: string
          inputs?: Json
          motivo_recomendacao?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          regime_recomendado?:
            | Database["public"]["Enums"]["regime_tributario_enum"]
            | null
          resultado_presumido?: Json | null
          resultado_real?: Json | null
          resultado_simples?: Json | null
          tempo_execucao_ms?: number | null
          updated_at?: string
          versao_motor?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "simulacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      slo_metrics_diarias: {
        Row: {
          calculado_em: string
          cron_jobs_falha: number
          cron_jobs_sucesso: number
          data: string
          edges_health: Json
          latencia_p50_ms: number
          latencia_p95_ms: number
          latencia_p99_ms: number
          taxa_erro_pct: number
          total_requisicoes: number
          uptime_pct: number
        }
        Insert: {
          calculado_em?: string
          cron_jobs_falha?: number
          cron_jobs_sucesso?: number
          data: string
          edges_health?: Json
          latencia_p50_ms?: number
          latencia_p95_ms?: number
          latencia_p99_ms?: number
          taxa_erro_pct?: number
          total_requisicoes?: number
          uptime_pct?: number
        }
        Update: {
          calculado_em?: string
          cron_jobs_falha?: number
          cron_jobs_sucesso?: number
          data?: string
          edges_health?: Json
          latencia_p50_ms?: number
          latencia_p95_ms?: number
          latencia_p99_ms?: number
          taxa_erro_pct?: number
          total_requisicoes?: number
          uptime_pct?: number
        }
        Relationships: []
      }
      slow_query_alerts: {
        Row: {
          calls: number
          captured_at: string
          created_at: string
          id: string
          max_exec_ms: number
          mean_exec_ms: number
          query_normalized: string
          queryid: number
          rows_returned: number
          severity: string
          total_exec_ms: number
        }
        Insert: {
          calls?: number
          captured_at?: string
          created_at?: string
          id?: string
          max_exec_ms?: number
          mean_exec_ms?: number
          query_normalized: string
          queryid: number
          rows_returned?: number
          severity?: string
          total_exec_ms?: number
        }
        Update: {
          calls?: number
          captured_at?: string
          created_at?: string
          id?: string
          max_exec_ms?: number
          mean_exec_ms?: number
          query_normalized?: string
          queryid?: number
          rows_returned?: number
          severity?: string
          total_exec_ms?: number
        }
        Relationships: []
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
      solicitacoes_lgpd: {
        Row: {
          atendida_em: string | null
          created_at: string
          id: string
          justificativa: string | null
          payload_resposta: Json | null
          status: string
          tipo: string
          updated_at: string
          url_dump: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          atendida_em?: string | null
          created_at?: string
          id?: string
          justificativa?: string | null
          payload_resposta?: Json | null
          status?: string
          tipo: string
          updated_at?: string
          url_dump?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          atendida_em?: string | null
          created_at?: string
          id?: string
          justificativa?: string | null
          payload_resposta?: Json | null
          status?: string
          tipo?: string
          updated_at?: string
          url_dump?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      sped_contabil_arquivos: {
        Row: {
          ano_calendario: number
          created_at: string
          empresa_id: string
          gerado_por: string | null
          hash_sha256: string | null
          id: string
          periodo_fim: string
          periodo_inicio: string
          recibo_transmissao: string | null
          status: string
          storage_path: string
          tipo: string
          total_lancamentos: number
          total_linhas: number
          transmitido_em: string | null
          updated_at: string
          validacoes: Json
        }
        Insert: {
          ano_calendario: number
          created_at?: string
          empresa_id: string
          gerado_por?: string | null
          hash_sha256?: string | null
          id?: string
          periodo_fim: string
          periodo_inicio: string
          recibo_transmissao?: string | null
          status?: string
          storage_path: string
          tipo: string
          total_lancamentos?: number
          total_linhas?: number
          transmitido_em?: string | null
          updated_at?: string
          validacoes?: Json
        }
        Update: {
          ano_calendario?: number
          created_at?: string
          empresa_id?: string
          gerado_por?: string | null
          hash_sha256?: string | null
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          recibo_transmissao?: string | null
          status?: string
          storage_path?: string
          tipo?: string
          total_lancamentos?: number
          total_linhas?: number
          transmitido_em?: string | null
          updated_at?: string
          validacoes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sped_contabil_arquivos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sped_contabil_arquivos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sped_contabil_arquivos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sped_contabil_arquivos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sped_contabil_arquivos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sped_contabil_arquivos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sped_contabil_arquivos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sped_contabil_arquivos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      split_payment_transacoes: {
        Row: {
          cbs_retido: number
          conta_cbs: string | null
          conta_fornecedor: string | null
          conta_ibs: string | null
          conta_is: string | null
          created_at: string
          data_processamento: string | null
          documento_chave: string | null
          documento_numero: string | null
          documento_tipo: string | null
          empresa_id: string
          erro_mensagem: string | null
          ibs_retido: number
          id: string
          is_retido: number
          operacao_id: string | null
          protocolo: string | null
          status: string
          total_retido: number
          updated_at: string
          valor_liquido: number
          valor_operacao: number
        }
        Insert: {
          cbs_retido?: number
          conta_cbs?: string | null
          conta_fornecedor?: string | null
          conta_ibs?: string | null
          conta_is?: string | null
          created_at?: string
          data_processamento?: string | null
          documento_chave?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          empresa_id: string
          erro_mensagem?: string | null
          ibs_retido?: number
          id?: string
          is_retido?: number
          operacao_id?: string | null
          protocolo?: string | null
          status?: string
          total_retido?: number
          updated_at?: string
          valor_liquido?: number
          valor_operacao?: number
        }
        Update: {
          cbs_retido?: number
          conta_cbs?: string | null
          conta_fornecedor?: string | null
          conta_ibs?: string | null
          conta_is?: string | null
          created_at?: string
          data_processamento?: string | null
          documento_chave?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          empresa_id?: string
          erro_mensagem?: string | null
          ibs_retido?: number
          id?: string
          is_retido?: number
          operacao_id?: string | null
          protocolo?: string | null
          status?: string
          total_retido?: number
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
            foreignKeyName: "split_payment_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "split_payment_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "split_payment_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "split_payment_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "split_payment_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "split_payment_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "split_payment_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          allowed_domains: string[]
          ativo: boolean | null
          authorization_endpoint: string | null
          auto_provision_users: boolean
          claim_mapping: Json
          client_id: string | null
          client_secret_ref: string | null
          configuracoes: Json | null
          created_at: string | null
          created_by: string | null
          default_role: Database["public"]["Enums"]["app_role"]
          discovery_url: string | null
          empresa_id: string | null
          entity_id_idp: string | null
          force_sso_for_domains: boolean
          id: string
          jwks_uri: string | null
          metadata_xml: string | null
          name_id_format: string
          nome: string
          ordem: number
          preset: string | null
          scopes: string[]
          signature_algorithm: string
          slo_url: string | null
          sso_url: string | null
          tipo: string
          token_endpoint: string | null
          ultimo_teste_em: string | null
          ultimo_teste_mensagem: string | null
          ultimo_teste_sucesso: boolean | null
          updated_at: string
          userinfo_endpoint: string | null
          x509_cert: string | null
        }
        Insert: {
          allowed_domains?: string[]
          ativo?: boolean | null
          authorization_endpoint?: string | null
          auto_provision_users?: boolean
          claim_mapping?: Json
          client_id?: string | null
          client_secret_ref?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_role?: Database["public"]["Enums"]["app_role"]
          discovery_url?: string | null
          empresa_id?: string | null
          entity_id_idp?: string | null
          force_sso_for_domains?: boolean
          id?: string
          jwks_uri?: string | null
          metadata_xml?: string | null
          name_id_format?: string
          nome: string
          ordem?: number
          preset?: string | null
          scopes?: string[]
          signature_algorithm?: string
          slo_url?: string | null
          sso_url?: string | null
          tipo: string
          token_endpoint?: string | null
          ultimo_teste_em?: string | null
          ultimo_teste_mensagem?: string | null
          ultimo_teste_sucesso?: boolean | null
          updated_at?: string
          userinfo_endpoint?: string | null
          x509_cert?: string | null
        }
        Update: {
          allowed_domains?: string[]
          ativo?: boolean | null
          authorization_endpoint?: string | null
          auto_provision_users?: boolean
          claim_mapping?: Json
          client_id?: string | null
          client_secret_ref?: string | null
          configuracoes?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_role?: Database["public"]["Enums"]["app_role"]
          discovery_url?: string | null
          empresa_id?: string | null
          entity_id_idp?: string | null
          force_sso_for_domains?: boolean
          id?: string
          jwks_uri?: string | null
          metadata_xml?: string | null
          name_id_format?: string
          nome?: string
          ordem?: number
          preset?: string | null
          scopes?: string[]
          signature_algorithm?: string
          slo_url?: string | null
          sso_url?: string | null
          tipo?: string
          token_endpoint?: string | null
          ultimo_teste_em?: string | null
          ultimo_teste_mensagem?: string | null
          ultimo_teste_sucesso?: boolean | null
          updated_at?: string
          userinfo_endpoint?: string | null
          x509_cert?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_providers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sso_providers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sso_providers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sso_providers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sso_providers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sso_providers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sso_providers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "sso_providers_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      sso_role_mappings: {
        Row: {
          app_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          id: string
          idp_group: string
          ordem: number
          provider_id: string
          updated_at: string
        }
        Insert: {
          app_role: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          idp_group: string
          ordem?: number
          provider_id: string
          updated_at?: string
        }
        Update: {
          app_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          idp_group?: string
          ordem?: number
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_role_mappings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_sandbox_runs: {
        Row: {
          batch_id: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          email_masked: string | null
          has_errors: boolean
          id: string
          input: Json
          matched_group: string | null
          outcome: string
          provider_id: string | null
          provider_nome: string | null
          resolved_role: string | null
          result: Json
          use_provider_config: boolean
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          email_masked?: string | null
          has_errors?: boolean
          id?: string
          input?: Json
          matched_group?: string | null
          outcome: string
          provider_id?: string | null
          provider_nome?: string | null
          resolved_role?: string | null
          result?: Json
          use_provider_config?: boolean
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          email_masked?: string | null
          has_errors?: boolean
          id?: string
          input?: Json
          matched_group?: string | null
          outcome?: string
          provider_id?: string | null
          provider_nome?: string | null
          resolved_role?: string | null
          result?: Json
          use_provider_config?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sso_sandbox_runs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_user_groups: {
        Row: {
          created_at: string
          groups: string[]
          id: string
          last_synced_at: string
          matched_group: string | null
          matched_role: Database["public"]["Enums"]["app_role"] | null
          provider_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          groups?: string[]
          id?: string
          last_synced_at?: string
          matched_group?: string | null
          matched_role?: Database["public"]["Enums"]["app_role"] | null
          provider_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          groups?: string[]
          id?: string
          last_synced_at?: string
          matched_group?: string | null
          matched_role?: Database["public"]["Enums"]["app_role"] | null
          provider_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_user_groups_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_audit_trail: {
        Row: {
          action: string
          ano: number | null
          created_at: string
          empresa_id: string | null
          id: string
          is_ai_justified: boolean
          mes: number | null
          parameters: Json | null
          prompt: string | null
          response: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          ano?: number | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          is_ai_justified?: boolean
          mes?: number | null
          parameters?: Json | null
          prompt?: string | null
          response?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          ano?: number | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          is_ai_justified?: boolean
          mes?: number | null
          parameters?: Json | null
          prompt?: string | null
          response?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_audit_trail_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_audit_trail_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "tax_audit_trail_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "tax_audit_trail_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "tax_audit_trail_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "tax_audit_trail_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "tax_audit_trail_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "tax_audit_trail_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
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
          confirmado_por: string | null
          conta_bancaria_id: string | null
          created_at: string | null
          data: string
          data_confirmacao: string | null
          deleted_at: string | null
          descricao: string
          id: string
          regra_id: string | null
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
          confirmado_por?: string | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data: string
          data_confirmacao?: string | null
          deleted_at?: string | null
          descricao: string
          id?: string
          regra_id?: string | null
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
          confirmado_por?: string | null
          conta_bancaria_id?: string | null
          created_at?: string | null
          data?: string
          data_confirmacao?: string | null
          deleted_at?: string | null
          descricao?: string
          id?: string
          regra_id?: string | null
          saldo?: number | null
          status?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_bancarias_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "regras_conciliacao"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "transferencias_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "transferencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      ufs: {
        Row: {
          aliquota_fcp: number
          aliquota_interna_padrao: number
          codigo_ibge: number
          created_at: string
          difal_base_dupla: boolean
          exige_antecipacao: boolean
          id: string
          nome: string
          observacoes: string | null
          possui_fcp: boolean
          regiao: Database["public"]["Enums"]["regiao_brasil"]
          sigla: Database["public"]["Enums"]["uf_brasil"]
          updated_at: string
          vigente_ate: string | null
          vigente_de: string
        }
        Insert: {
          aliquota_fcp?: number
          aliquota_interna_padrao?: number
          codigo_ibge: number
          created_at?: string
          difal_base_dupla?: boolean
          exige_antecipacao?: boolean
          id?: string
          nome: string
          observacoes?: string | null
          possui_fcp?: boolean
          regiao: Database["public"]["Enums"]["regiao_brasil"]
          sigla: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Update: {
          aliquota_fcp?: number
          aliquota_interna_padrao?: number
          codigo_ibge?: number
          created_at?: string
          difal_base_dupla?: boolean
          exige_antecipacao?: boolean
          id?: string
          nome?: string
          observacoes?: string | null
          possui_fcp?: boolean
          regiao?: Database["public"]["Enums"]["regiao_brasil"]
          sigla?: Database["public"]["Enums"]["uf_brasil"]
          updated_at?: string
          vigente_ate?: string | null
          vigente_de?: string
        }
        Relationships: []
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
      user_active_filters: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          payload?: Json
          updated_at?: string
          user_id?: string
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
      user_demonstrativo_preferences: {
        Row: {
          created_at: string | null
          drill_down_estado: Json
          filtros_por_empresa: Json
          fonte_padrao: string
          id: string
          modo_padrao: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          drill_down_estado?: Json
          filtros_por_empresa?: Json
          fonte_padrao?: string
          id?: string
          modo_padrao?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          drill_down_estado?: Json
          filtros_por_empresa?: Json
          fonte_padrao?: string
          id?: string
          modo_padrao?: string
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
      user_digest_preferences: {
        Row: {
          ativo: boolean
          created_at: string
          dia_mes: number
          dia_semana: number
          email_alternativo: string | null
          empresas_filtro: string[]
          frequencia: string
          hora_envio: number
          id: string
          max_alertas: number
          severidade_minima: string
          tipos_ignorados: string[]
          ultimo_envio_em: string | null
          ultimo_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dia_mes?: number
          dia_semana?: number
          email_alternativo?: string | null
          empresas_filtro?: string[]
          frequencia?: string
          hora_envio?: number
          id?: string
          max_alertas?: number
          severidade_minima?: string
          tipos_ignorados?: string[]
          ultimo_envio_em?: string | null
          ultimo_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dia_mes?: number
          dia_semana?: number
          email_alternativo?: string | null
          empresas_filtro?: string[]
          frequencia?: string
          hora_envio?: number
          id?: string
          max_alertas?: number
          severidade_minima?: string
          tipos_ignorados?: string[]
          ultimo_envio_em?: string | null
          ultimo_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_empresas: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          is_default: boolean
          provisioned_via: string
          role: Database["public"]["Enums"]["app_role"]
          scim_external_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          is_default?: boolean
          provisioned_via?: string
          role?: Database["public"]["Enums"]["app_role"]
          scim_external_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          is_default?: boolean
          provisioned_via?: string
          role?: Database["public"]["Enums"]["app_role"]
          scim_external_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
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
      user_onboarding_progress: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          last_step: string | null
          steps_completed: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_step?: string | null
          steps_completed?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_step?: string | null
          steps_completed?: Json | null
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
          device_info: string | null
          id: string
          ip_address: unknown
          is_current: boolean
          last_active: string | null
          revoked: boolean | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          ip_address?: unknown
          is_current?: boolean
          last_active?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          ip_address?: unknown
          is_current?: boolean
          last_active?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
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
          telefone: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          meta_mensal?: number | null
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          meta_mensal?: number | null
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "vendedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
          {
            foreignKeyName: "verificacoes_conformidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "verificacoes_conformidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "verificacoes_conformidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "verificacoes_conformidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "verificacoes_conformidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "verificacoes_conformidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "verificacoes_conformidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
      webhook_dlq: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          event_type: string | null
          external_id: string | null
          first_failed_at: string
          headers: Json | null
          id: string
          last_attempt_at: string
          notes: string | null
          payload: Json
          resolved_at: string | null
          resolved_by: string | null
          source: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_id?: string | null
          first_failed_at?: string
          headers?: Json | null
          id?: string
          last_attempt_at?: string
          notes?: string | null
          payload?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          source: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_id?: string | null
          first_failed_at?: string
          headers?: Json | null
          id?: string
          last_attempt_at?: string
          notes?: string | null
          payload?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          updated_at?: string
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
      webhook_simulation_results: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          payload: Json
          response_body: Json | null
          response_status: number | null
          run_id: string | null
          scenario_name: string
          success: boolean | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          payload: Json
          response_body?: Json | null
          response_status?: number | null
          run_id?: string | null
          scenario_name: string
          success?: boolean | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          payload?: Json
          response_body?: Json | null
          response_status?: number | null
          run_id?: string | null
          scenario_name?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_simulation_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "webhook_simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_simulation_runs: {
        Row: {
          created_at: string | null
          created_by: string | null
          error_summary: Json | null
          failure_count: number | null
          finished_at: string | null
          id: string
          mode: string | null
          started_at: string | null
          status: string
          success_count: number | null
          target_function: string | null
          total_scenarios: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          error_summary?: Json | null
          failure_count?: number | null
          finished_at?: string | null
          id?: string
          mode?: string | null
          started_at?: string | null
          status?: string
          success_count?: number | null
          target_function?: string | null
          total_scenarios?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          error_summary?: Json | null
          failure_count?: number | null
          finished_at?: string | null
          id?: string
          mode?: string | null
          started_at?: string | null
          status?: string
          success_count?: number | null
          target_function?: string | null
          total_scenarios?: number | null
        }
        Relationships: []
      }
      webhooks_log: {
        Row: {
          attempts: number
          created_at: string
          dlq_id: string | null
          error_message: string | null
          event_type: string | null
          external_id: string | null
          id: string
          last_error_at: string | null
          last_response: Json | null
          max_attempts: number
          next_retry_at: string | null
          payload: Json | null
          processed_at: string | null
          response: Json | null
          source: string | null
          status: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          dlq_id?: string | null
          error_message?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          last_error_at?: string | null
          last_response?: Json | null
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json | null
          processed_at?: string | null
          response?: Json | null
          source?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          dlq_id?: string | null
          error_message?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          last_error_at?: string | null
          last_response?: Json | null
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json | null
          processed_at?: string | null
          response?: Json | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_log_dlq_id_fkey"
            columns: ["dlq_id"]
            isOneToOne: false
            referencedRelation: "webhook_dlq"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
      estrategias_elisao_catalogo: {
        Row: {
          ativo: boolean | null
          base_legal: string | null
          categoria: string | null
          codigo: string | null
          created_at: string | null
          descricao: string | null
          economia_estimada_percentual: number | null
          id: string | null
          nome: string | null
          regimes_aplicaveis: string[] | null
          requisitos: Json | null
          risco: Database["public"]["Enums"]["nivel_risco"] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          base_legal?: string | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          economia_estimada_percentual?: number | null
          id?: string | null
          nome?: string | null
          regimes_aplicaveis?: string[] | null
          requisitos?: Json | null
          risco?: Database["public"]["Enums"]["nivel_risco"] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          base_legal?: string | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          economia_estimada_percentual?: number | null
          id?: string | null
          nome?: string | null
          regimes_aplicaveis?: string[] | null
          requisitos?: Json | null
          risco?: Database["public"]["Enums"]["nivel_risco"] | null
          updated_at?: string | null
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
        ]
      }
      mv_benchmark_setorial: {
        Row: {
          amostra: number | null
          atualizado_em: string | null
          media: number | null
          mediana: number | null
          p25: number | null
          p75: number | null
          regime: string | null
        }
        Relationships: []
      }
      mv_performance_alerts_weekly: {
        Row: {
          alert_count: number | null
          avg_current_ms: number | null
          avg_ratio: number | null
          delta_pct_vs_prev_week: number | null
          distinct_keys: number | null
          max_current_ms: number | null
          max_ratio: number | null
          refreshed_at: string | null
          severity: string | null
          source: string | null
          total_samples: number | null
          week_start: string | null
        }
        Relationships: []
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
      v_sefaz_observability: {
        Row: {
          ambiente: Database["public"]["Enums"]["sefaz_ambiente"] | null
          circuit_open: boolean | null
          cnpj: string | null
          max_nsu: number | null
          next_run_at: string | null
          nfe_24h: number | null
          nfe_7d: number | null
          open_alerts: number | null
          retry_count: number | null
          seconds_since_last: number | null
          ultima_consulta: string | null
          ultimo_nsu: number | null
          ultimo_status: string | null
        }
        Relationships: []
      }
      v_table_bloat: {
        Row: {
          analyze_count: number | null
          autoanalyze_count: number | null
          autovacuum_count: number | null
          dead_ratio_pct: number | null
          dead_rows: number | null
          last_analyze: string | null
          last_autoanalyze: string | null
          last_autovacuum: string | null
          last_vacuum: string | null
          live_rows: number | null
          schemaname: unknown
          table_name: unknown
          table_size_pretty: string | null
          total_size_bytes: number | null
          total_size_pretty: string | null
          vacuum_count: number | null
        }
        Relationships: []
      }
      vw_auditoria_tributaria_recente: {
        Row: {
          acao: string | null
          criado_em: string | null
          empresa_id: string | null
          empresa_nome: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string | null
          payload_anterior: Json | null
          payload_novo: Json | null
          user_email: string | null
          user_id: string | null
          user_nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "auditoria_tributaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
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
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
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
            foreignKeyName: "contas_receber_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
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
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dre_mensal"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_dso_aging"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_fluxo_caixa_diario"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_metricas_cobranca"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_saldos_contas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_tributario_dashboard"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      vw_dre_mensal: {
        Row: {
          custos: number | null
          despesas_operacionais: number | null
          ebitda: number | null
          empresa_id: string | null
          id: string | null
          lucro_bruto: number | null
          mes: string | null
          receita_bruta: number | null
        }
        Insert: {
          custos?: never
          despesas_operacionais?: never
          ebitda?: never
          empresa_id?: string | null
          id?: never
          lucro_bruto?: never
          mes?: never
          receita_bruta?: never
        }
        Update: {
          custos?: never
          despesas_operacionais?: never
          ebitda?: never
          empresa_id?: string | null
          id?: never
          lucro_bruto?: never
          mes?: never
          receita_bruta?: never
        }
        Relationships: []
      }
      vw_dso_aging: {
        Row: {
          a_vencer: number | null
          dso_atual: number | null
          empresa_id: string | null
          vencido_0_30: number | null
          vencido_31_60: number | null
          vencido_61_plus: number | null
        }
        Insert: {
          a_vencer?: never
          dso_atual?: never
          empresa_id?: string | null
          vencido_0_30?: never
          vencido_31_60?: never
          vencido_61_plus?: never
        }
        Update: {
          a_vencer?: never
          dso_atual?: never
          empresa_id?: string | null
          vencido_0_30?: never
          vencido_31_60?: never
          vencido_61_plus?: never
        }
        Relationships: []
      }
      vw_edge_health: {
        Row: {
          error_count: number | null
          error_rate_pct: number | null
          function_name: string | null
          last_call_at: string | null
          p50_ms: number | null
          p95_ms: number | null
          total_calls: number | null
        }
        Relationships: []
      }
      vw_fluxo_caixa: {
        Row: {
          dia: string | null
          empresa_id: string | null
          entradas_previstas: number | null
          id: string | null
          saidas_previstas: number | null
          saldo_projetado: number | null
        }
        Insert: {
          dia?: never
          empresa_id?: string | null
          entradas_previstas?: never
          id?: never
          saidas_previstas?: never
          saldo_projetado?: never
        }
        Update: {
          dia?: never
          empresa_id?: string | null
          entradas_previstas?: never
          id?: never
          saidas_previstas?: never
          saldo_projetado?: never
        }
        Relationships: []
      }
      vw_fluxo_caixa_diario: {
        Row: {
          dia: string | null
          empresa_id: string | null
          entradas_reais: number | null
          id: string | null
          saidas_reais: number | null
          saldo_final: number | null
        }
        Insert: {
          dia?: never
          empresa_id?: string | null
          entradas_reais?: never
          id?: never
          saidas_reais?: never
          saldo_final?: never
        }
        Update: {
          dia?: never
          empresa_id?: string | null
          entradas_reais?: never
          id?: never
          saidas_reais?: never
          saldo_final?: never
        }
        Relationships: []
      }
      vw_gastos_centro_custo: {
        Row: {
          centro_custo_id: string | null
          empresa_id: string | null
          nome_centro_custo: string | null
          total_gasto: number | null
        }
        Insert: {
          centro_custo_id?: string | null
          empresa_id?: string | null
          nome_centro_custo?: string | null
          total_gasto?: never
        }
        Update: {
          centro_custo_id?: string | null
          empresa_id?: string | null
          nome_centro_custo?: string | null
          total_gasto?: never
        }
        Relationships: []
      }
      vw_metricas_cobranca: {
        Row: {
          empresa_id: string | null
          taxa_inadimplencia: number | null
          ticket_medio: number | null
          total_cobrancas_mes: number | null
        }
        Insert: {
          empresa_id?: string | null
          taxa_inadimplencia?: never
          ticket_medio?: never
          total_cobrancas_mes?: never
        }
        Update: {
          empresa_id?: string | null
          taxa_inadimplencia?: never
          ticket_medio?: never
          total_cobrancas_mes?: never
        }
        Relationships: []
      }
      vw_rpc_hotspots: {
        Row: {
          avg_ms: number | null
          bucket_hour: string | null
          calls: number | null
          errors: number | null
          function_name: string | null
          max_ms: number | null
          p50_ms: number | null
          p95_ms: number | null
          p99_ms: number | null
        }
        Relationships: []
      }
      vw_rpc_slow_calls: {
        Row: {
          called_at: string | null
          caller_role: string | null
          caller_user_id: string | null
          duration_ms: number | null
          error_message: string | null
          error_sqlstate: string | null
          function_name: string | null
          id: number | null
          meta: Json | null
          success: boolean | null
        }
        Relationships: []
      }
      vw_saldos_contas: {
        Row: {
          empresa_id: string | null
          id: string | null
          nome_conta: string | null
          saldo_atual: number | null
          ultima_atualizacao: string | null
        }
        Insert: {
          empresa_id?: string | null
          id?: never
          nome_conta?: never
          saldo_atual?: never
          ultima_atualizacao?: never
        }
        Update: {
          empresa_id?: string | null
          id?: never
          nome_conta?: never
          saldo_atual?: never
          ultima_atualizacao?: never
        }
        Relationships: []
      }
      vw_transferencias_painel: {
        Row: {
          asaas_id: string | null
          chave_pix: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string | null
          razao_social: string | null
          status: string | null
          tipo_chave: string | null
          updated_at: string | null
          valor: number | null
        }
        Relationships: []
      }
      vw_tributario_dashboard: {
        Row: {
          ano: number | null
          cbs: number | null
          competencia: string | null
          empresa_id: string | null
          ibs: number | null
          imposto_seletivo: number | null
          mes: number | null
          razao_social: string | null
          regime_tributario: string | null
          status_apuracao: string | null
          total_tributos: number | null
          tributos_novos: number | null
          tributos_residuais: number | null
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
      calcular_potencial_elisao: {
        Args: { p_empresa_id: string }
        Returns: {
          descricao: string
          ncm_relacionado: string
          tipo_oportunidade: string
          valor_estimado: number
        }[]
      }
      capture_pg_stat_statements_baseline: {
        Args: { p_label: string }
        Returns: {
          captured_at: string
          captured_rows: number
          label: string
        }[]
      }
      capture_slow_queries: {
        Args: { threshold_ms?: number }
        Returns: {
          captured: number
          deleted_old: number
        }[]
      }
      certificado_get_password: {
        Args: { p_cert_id: string; p_master_key: string }
        Returns: string
      }
      certificado_upsert: {
        Args: {
          p_ambiente: Database["public"]["Enums"]["sefaz_ambiente"]
          p_cnpj: string
          p_criado_por: string
          p_empresa_id: string
          p_master_key: string
          p_password: string
          p_pfx_storage_path: string
          p_razao_social: string
          p_uf: string
          p_valido_ate: string
          p_valido_de: string
        }
        Returns: string
      }
      check_catalogos_tributarios_invariants: { Args: never; Returns: Json }
      check_integrity_invariants: { Args: never; Returns: Json }
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
      check_nfe_xml_path_invariants: { Args: never; Returns: Json }
      claim_frontend_error_alerts: {
        Args: {
          p_cooldown_minutes?: number
          p_limit?: number
          p_threshold?: number
          p_window_minutes?: number
        }
        Returns: {
          assinatura: string
          exemplo_mensagem: string
          is_nova: boolean
          ocorrencias: number
          primeira_ocorrencia: string
          severity: string
          ultima_ocorrencia: string
          urls_distintas: number
          usuarios_afetados: number
        }[]
      }
      cleanup_expired_tokens: { Args: never; Returns: number }
      cleanup_log_tables: { Args: never; Returns: Json }
      cleanup_old_cron_logs: { Args: never; Returns: number }
      cleanup_old_login_attempts: { Args: never; Returns: number }
      cleanup_pgss_baseline: { Args: { p_days?: number }; Returns: number }
      cleanup_rpc_observability_metrics: { Args: never; Returns: number }
      clear_login_attempts: { Args: { p_email: string }; Returns: undefined }
      close_stale_integrity_alerts: {
        Args: { p_domains: string[]; p_grace?: string; p_hour: string }
        Returns: number
      }
      compare_pg_stat_baseline: {
        Args: { p_label?: string }
        Returns: {
          baseline_calls: number
          baseline_mean_ms: number
          baseline_total_ms: number
          calls_delta: number
          current_calls: number
          current_mean_ms: number
          current_total_ms: number
          mean_delta_pct: number
          query: string
          queryid: number
        }[]
      }
      confirmar_conciliacao: {
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
      confirmar_conciliacao_manual: {
        Args: {
          p_ajuste_centavos?: number
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
      delete_cron_job: { Args: { job_id: number }; Returns: boolean }
      desfazer_conciliacao: {
        Args: {
          p_conciliacao_id: string
          p_transacao_id?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      desfazer_conciliacao_manual: {
        Args: { p_transacao_id: string }
        Returns: undefined
      }
      detect_query_regressions: { Args: never; Returns: Json }
      detectar_duplicidades_financeiras: {
        Args: { p_empresa_id: string; p_tabela?: string }
        Returns: {
          contraparte_id: string
          data_vencimento: string
          entidade_tipo: string
          ids: string[]
          numero_documento: string
          ocorrencias: number
          valor: number
          valor_total: number
        }[]
      }
      drop_old_partitions: {
        Args: { p_retention_months: number; p_table: string }
        Returns: Json
      }
      duplicate_saved_filter: {
        Args: { _new_name?: string; _source_id: string }
        Returns: string
      }
      empresa_acessivel: { Args: { _empresa_id: string }; Returns: boolean }
      enqueue_webhook_retry: {
        Args: {
          p_error: string
          p_event_type: string
          p_external_id: string
          p_headers?: Json
          p_log_id: string
          p_payload: Json
          p_source: string
        }
        Returns: {
          action: string
          attempts: number
          next_retry_at: string
        }[]
      }
      ensure_monthly_partitions: {
        Args: {
          p_months_back?: number
          p_months_forward?: number
          p_table: string
        }
        Returns: number
      }
      escalate_stale_integrity_alerts: {
        Args: { p_age?: string }
        Returns: Json
      }
      export_asaas_audit_csv: {
        Args: { p_empresa_id: string }
        Returns: string
      }
      faixa_simples_reparticao_valida: {
        Args: { _rep: Json }
        Returns: boolean
      }
      fe_error_signature: { Args: { p_message: string }; Returns: string }
      fn_balancete: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_empresa_id: string
          p_nivel_max?: number
        }
        Returns: {
          aceita_lancamento: boolean
          codigo: string
          conta_id: string
          creditos: number
          debitos: number
          natureza: string
          nivel: number
          nome: string
          saldo_anterior: number
          saldo_final: number
          tipo: string
        }[]
      }
      fn_indices_contabeis: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_empresa_id: string
        }
        Returns: {
          ativo_circulante: number
          ativo_nao_circulante: number
          ativo_total: number
          clientes: number
          cmv: number
          deducoes_receita: number
          dias_periodo: number
          disponibilidades: number
          estoques: number
          fornecedores: number
          imobilizado: number
          lucro_liquido: number
          passivo_circulante: number
          passivo_nao_circulante: number
          patrimonio_liquido: number
          realizavel_lp: number
          receita_bruta: number
          receita_liquida: number
        }[]
      }
      fn_livro_razao: {
        Args: {
          p_conta_id?: string
          p_data_fim: string
          p_data_inicio: string
          p_empresa_id: string
        }
        Returns: {
          codigo: string
          conta_id: string
          credito: number
          data_lancamento: string
          debito: number
          historico: string
          lancamento_id: string
          nome: string
          numero_lancamento: number
          saldo_anterior: number
          saldo_corrido: number
        }[]
      }
      fn_norm_conta_codigo: { Args: { p_codigo: string }; Returns: string }
      generate_reconciliation_suggestions: {
        Args: {
          p_empresa_id: string
          p_transaction_date: string
          p_transaction_id?: string
          p_transaction_value: number
        }
        Returns: Json
      }
      gerar_alertas_vencimento: { Args: never; Returns: number }
      gerar_contas_recorrentes: { Args: never; Returns: number }
      gerar_numero_acordo: { Args: never; Returns: string }
      gerar_sigla_empresa: { Args: { _nome: string }; Returns: string }
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
      get_bloat_history: {
        Args: { p_days?: number }
        Returns: {
          created_at: string
          dead_ratio_pct: number
          details: string
          id: string
          severity: string
          table_name: string
        }[]
      }
      get_bloat_snapshots: {
        Args: { p_days?: number; p_table_name?: string }
        Returns: {
          autovacuum_count: number
          dead_ratio_pct: number
          dead_rows: number
          last_autovacuum: string
          live_rows: number
          snapshot_date: string
          table_name: string
          total_size_bytes: number
          total_size_pretty: string
        }[]
      }
      get_catalogos_tributarios_health: { Args: never; Returns: Json }
      get_catalogos_tributarios_history: {
        Args: { _dias?: number }
        Returns: {
          avisos: number
          criticos: number
          dia: string
          infos: number
          saudavel: boolean
          total_invariantes: number
        }[]
      }
      get_cobertura_fiscal_uf: { Args: never; Returns: Json }
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
      get_cron_run_history: {
        Args: { p_job_name?: string; p_limit?: number }
        Returns: Json
      }
      get_frontend_error_groups: {
        Args: { p_desde?: string; p_limit?: number; p_severity?: string }
        Returns: {
          assinatura: string
          exemplo_mensagem: string
          ocorrencias: number
          primeira_ocorrencia: string
          severity: string
          ultima_ocorrencia: string
          urls_distintas: number
          usuarios_afetados: number
        }[]
      }
      get_frontend_error_occurrences: {
        Args: { p_assinatura: string; p_desde?: string; p_limit?: number }
        Returns: {
          created_at: string
          error_message: string
          error_stack: string
          id: string
          metadata: Json
          severity: string
          url: string
          user_agent: string
          user_id: string
        }[]
      }
      get_integrity_alerts: {
        Args: { p_incluir_resolvidos?: boolean; p_limit?: number }
        Returns: {
          affected_count: number
          alert_hour: string
          created_at: string
          domain: string
          id: string
          invariant: string
          reason: string
          resolved_at: string
          resolved_reason: string
          sample_ids: string[]
          severity: string
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
      get_performance_alerts: {
        Args: {
          p_days?: number
          p_incluir_resolvidos?: boolean
          p_severity?: string
          p_source?: string
        }
        Returns: {
          alert_hour: string
          alert_key: string
          baseline_value: number
          created_at: string
          current_value: number
          id: string
          metadata: Json
          query_snippet: string
          ratio: number
          reason: string
          resolved_at: string
          resolved_reason: string
          sample_count: number
          severity: string
          source: string
        }[]
      }
      get_performance_alerts_weekly: {
        Args: { p_weeks?: number }
        Returns: {
          alert_count: number
          avg_current_ms: number
          avg_ratio: number
          delta_pct_vs_prev_week: number
          distinct_keys: number
          max_current_ms: number
          max_ratio: number
          refreshed_at: string
          severity: string
          source: string
          total_samples: number
          week_start: string
        }[]
      }
      get_retencoes_pendentes_count: {
        Args: { p_empresa_id: string }
        Returns: number
      }
      get_retention_history: {
        Args: { p_days?: number }
        Returns: {
          completed_at: string
          duration_ms: number
          error_message: string
          executed_at: string
          partitions_dropped: number
          per_table: Json
          skipped: boolean
          success: boolean
          total_deleted: number
        }[]
      }
      get_table_bloat: {
        Args: never
        Returns: {
          analyze_count: number
          autoanalyze_count: number
          autovacuum_count: number
          dead_ratio_pct: number
          dead_rows: number
          last_analyze: string
          last_autoanalyze: string
          last_autovacuum: string
          last_vacuum: string
          live_rows: number
          schemaname: unknown
          table_name: unknown
          table_size_pretty: string
          total_size_bytes: number
          total_size_pretty: string
          vacuum_count: number
        }[]
      }
      get_ultima_carga_fiscal: { Args: never; Returns: Json }
      get_user_permissions: { Args: { user_id: string }; Returns: string[] }
      get_user_roles: { Args: { user_id: string }; Returns: string[] }
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
      increment_failed_attempts: {
        Args: { _email: string }
        Returns: undefined
      }
      increment_pix_template_uso: {
        Args: { p_template_id: string }
        Returns: undefined
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
      is_org_membro: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_responsavel: {
        Args: { _org_id: string; _user_id: string }
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
      log_rpc_observability_call: {
        Args: {
          _duration_ms: number
          _error_message?: string
          _error_sqlstate?: string
          _function_name: string
          _meta?: Json
          _success: boolean
        }
        Returns: undefined
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
      maintain_monthly_partitions: { Args: never; Returns: Json }
      monitor_table_bloat: { Args: never; Returns: Json }
      nfe_apply_manifestacao: {
        Args: {
          p_chave: string
          p_codigo_evento: string
          p_data_evento: string
          p_justificativa: string
          p_motivo_retorno: string
          p_novo_status: Database["public"]["Enums"]["nfe_manifestacao_status"]
          p_protocolo: string
          p_raw?: Json
          p_sequencial: number
          p_status_retorno: string
          p_tipo_evento: string
        }
        Returns: Json
      }
      nfe_create_conta_pagar_from_nfe: {
        Args: {
          p_categoria_id?: string
          p_data_vencimento?: string
          p_nfe_id: string
        }
        Returns: Json
      }
      nfe_link_conta_pagar: {
        Args: { p_conta_pagar_id: string; p_nfe_id: string }
        Returns: Json
      }
      nfe_suggest_contas_pagar: {
        Args: { p_nfe_id: string }
        Returns: {
          conta_pagar_id: string
          data_vencimento: string
          descricao: string
          fornecedor_cnpj: string
          fornecedor_nome: string
          match_motivo: string
          score: number
          status: string
          valor: number
        }[]
      }
      nfe_unlink_conta_pagar: { Args: { p_nfe_id: string }; Returns: Json }
      processar_regua_cobranca: {
        Args: { p_empresa_id?: string; p_simulate?: boolean }
        Returns: Json
      }
      profile_sensitive_fields_unchanged: {
        Args: {
          _empresa_id: string
          _profile_id: string
          _role: string
          _user_id: string
        }
        Returns: boolean
      }
      purge_old_rows: {
        Args: {
          p_batch?: number
          p_column: string
          p_days: number
          p_max_batches?: number
          p_table: unknown
          p_where?: string
        }
        Returns: number
      }
      recarregar_seeds_fiscais: { Args: { p_origem?: string }; Returns: Json }
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
      refresh_performance_alerts_weekly: { Args: never; Returns: Json }
      registrar_auditoria_config: {
        Args: { _detalhes?: Json; _empresa_id?: string; _tipo_acao: string }
        Returns: undefined
      }
      registrar_evento_cobranca: {
        Args: {
          p_canal?: string
          p_conta_id: string
          p_destinatario?: string
          p_evento: string
          p_mensagem?: string
          p_metadata?: Json
        }
        Returns: string
      }
      registrar_evento_pagar: {
        Args: {
          p_conta_id: string
          p_mensagem: string
          p_metadata?: Json
          p_tipo: string
        }
        Returns: undefined
      }
      registrar_evento_receber: {
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
      reprocess_dlq: {
        Args: { p_dlq_id: string; p_notes?: string }
        Returns: string
      }
      reset_failed_attempts: { Args: { _email: string }; Returns: undefined }
      resolve_integrity_alert: {
        Args: { p_alert_id: string }
        Returns: boolean
      }
      resolve_sso_providers_for_domain: {
        Args: { p_domain: string }
        Returns: {
          allowed_domains: string[]
          force_sso_for_domains: boolean
          id: string
          nome: string
          ordem: number
          preset: string
          tipo: string
        }[]
      }
      run_daily_cleanup: { Args: never; Returns: Json }
      run_daily_cleanup_with_logging: { Args: never; Returns: undefined }
      run_integrity_cycle: { Args: never; Returns: Json }
      run_observability_rpc: {
        Args: { _function_name: string }
        Returns: undefined
      }
      sefaz_cursor_advance: {
        Args: {
          p_ambiente: Database["public"]["Enums"]["sefaz_ambiente"]
          p_cnpj: string
          p_erro?: string
          p_max_nsu?: number
          p_novo_nsu: number
          p_status?: string
        }
        Returns: {
          advanced: boolean
          ultimo_nsu: number
        }[]
      }
      sefaz_detect_nsu_gaps: { Args: { p_max_gap?: number }; Returns: number }
      sefaz_detect_stuck_cursors: { Args: never; Returns: number }
      sefaz_process_batch: {
        Args: {
          p_ambiente: string
          p_cnpj: string
          p_docs: Json
          p_empresa_id: string
          p_erro: string
          p_max_nsu: number
          p_novo_nsu: number
          p_status: string
        }
        Returns: Json
      }
      sefaz_run_observability_checks: { Args: never; Returns: Json }
      snapshot_table_bloat: { Args: never; Returns: Json }
      toggle_cron_job: {
        Args: { is_active: boolean; job_id: number }
        Returns: boolean
      }
      use_reset_token: {
        Args: { p_ip_address?: unknown; p_token_hash: string }
        Returns: boolean
      }
      validar_catalogos_tributarios: {
        Args: never
        Returns: {
          afetados: number
          detalhe: string
          invariante: string
          severidade: string
        }[]
      }
      watch_cron_failures: {
        Args: { p_lookback_minutes?: number; p_stale_hours?: number }
        Returns: Json
      }
      webhook_claim: {
        Args: {
          p_event_type: string
          p_external_id: string
          p_max_attempts?: number
          p_payload: Json
          p_source: string
        }
        Returns: {
          already_processed: boolean
          attempts: number
          id: string
          status: string
        }[]
      }
      webhook_dequeue_retries: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          created_at: string
          dlq_id: string | null
          error_message: string | null
          event_type: string | null
          external_id: string | null
          id: string
          last_error_at: string | null
          last_response: Json | null
          max_attempts: number
          next_retry_at: string | null
          payload: Json | null
          processed_at: string | null
          response: Json | null
          source: string | null
          status: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "webhooks_log"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      webhook_mark_failure: {
        Args: { p_error: string; p_id: string; p_retryable?: boolean }
        Returns: {
          dlq_id: string
          next_retry_at: string
          status: string
          will_retry: boolean
        }[]
      }
      webhook_mark_success: {
        Args: { p_id: string; p_response?: Json }
        Returns: undefined
      }
      webhook_replay: {
        Args: { p_id: string }
        Returns: {
          attempts: number
          created_at: string
          dlq_id: string | null
          error_message: string | null
          event_type: string | null
          external_id: string | null
          id: string
          last_error_at: string | null
          last_response: Json | null
          max_attempts: number
          next_retry_at: string | null
          payload: Json | null
          processed_at: string | null
          response: Json | null
          source: string | null
          status: string | null
        }
        SetofOptions: {
          from: "*"
          to: "webhooks_log"
          isOneToOne: true
          isSetofReturn: false
        }
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
      atividade_economica: "INDUSTRIA" | "COMERCIO" | "SERVICOS" | "MISTA"
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
      nfe_manifestacao_status:
        | "pendente"
        | "ciencia"
        | "confirmada"
        | "desconhecida"
        | "nao_realizada"
      nfe_schema_tipo:
        | "resNFe"
        | "procNFe"
        | "resEvento"
        | "procEventoNFe"
        | "resCTe"
        | "procCTe"
      nivel_risco: "BAIXO" | "MEDIO" | "ALTO"
      order_status:
        | "PENDING"
        | "MATCHED"
        | "ON_GOING"
        | "PICKED_UP"
        | "COMPLETED"
        | "CANCELLED"
        | "REJECTED"
        | "EXPIRED"
      org_papel: "RESPONSAVEL" | "ADMIN" | "MEMBRO" | "LEITOR"
      prioridade_alerta: "baixa" | "media" | "alta" | "critica"
      regiao_brasil: "NORTE" | "NORDESTE" | "CENTRO_OESTE" | "SUDESTE" | "SUL"
      regime_tributario_enum:
        | "MEI"
        | "SIMPLES"
        | "PRESUMIDO"
        | "REAL"
        | "ARBITRADO"
      sefaz_ambiente: "homologacao" | "producao"
      status_workflow:
        | "IDENTIFICADO"
        | "EM_ANALISE"
        | "APROVADO"
        | "EM_EXECUCAO"
        | "CONCLUIDO"
        | "CANCELADO"
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
      tipo_cobranca:
        | "boleto"
        | "pix"
        | "transferencia"
        | "cartao"
        | "debito_automatico"
        | "dinheiro"
        | "cheque"
      tipo_destinatario:
        | "CONTRIBUINTE_REVENDA"
        | "CONTRIBUINTE_USO_CONSUMO"
        | "NAO_CONTRIBUINTE"
        | "EXTERIOR"
      uf_brasil:
        | "AC"
        | "AL"
        | "AP"
        | "AM"
        | "BA"
        | "CE"
        | "DF"
        | "ES"
        | "GO"
        | "MA"
        | "MT"
        | "MS"
        | "MG"
        | "PA"
        | "PB"
        | "PR"
        | "PE"
        | "PI"
        | "RJ"
        | "RN"
        | "RS"
        | "RO"
        | "RR"
        | "SC"
        | "SP"
        | "SE"
        | "TO"
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
      atividade_economica: ["INDUSTRIA", "COMERCIO", "SERVICOS", "MISTA"],
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
      nfe_manifestacao_status: [
        "pendente",
        "ciencia",
        "confirmada",
        "desconhecida",
        "nao_realizada",
      ],
      nfe_schema_tipo: [
        "resNFe",
        "procNFe",
        "resEvento",
        "procEventoNFe",
        "resCTe",
        "procCTe",
      ],
      nivel_risco: ["BAIXO", "MEDIO", "ALTO"],
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
      org_papel: ["RESPONSAVEL", "ADMIN", "MEMBRO", "LEITOR"],
      prioridade_alerta: ["baixa", "media", "alta", "critica"],
      regiao_brasil: ["NORTE", "NORDESTE", "CENTRO_OESTE", "SUDESTE", "SUL"],
      regime_tributario_enum: [
        "MEI",
        "SIMPLES",
        "PRESUMIDO",
        "REAL",
        "ARBITRADO",
      ],
      sefaz_ambiente: ["homologacao", "producao"],
      status_workflow: [
        "IDENTIFICADO",
        "EM_ANALISE",
        "APROVADO",
        "EM_EXECUCAO",
        "CONCLUIDO",
        "CANCELADO",
      ],
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
      tipo_cobranca: [
        "boleto",
        "pix",
        "transferencia",
        "cartao",
        "debito_automatico",
        "dinheiro",
        "cheque",
      ],
      tipo_destinatario: [
        "CONTRIBUINTE_REVENDA",
        "CONTRIBUINTE_USO_CONSUMO",
        "NAO_CONTRIBUINTE",
        "EXTERIOR",
      ],
      uf_brasil: [
        "AC",
        "AL",
        "AP",
        "AM",
        "BA",
        "CE",
        "DF",
        "ES",
        "GO",
        "MA",
        "MT",
        "MS",
        "MG",
        "PA",
        "PB",
        "PR",
        "PE",
        "PI",
        "RJ",
        "RN",
        "RS",
        "RO",
        "RR",
        "SC",
        "SP",
        "SE",
        "TO",
      ],
      vehicle_type: ["MOTORCYCLE", "CAR", "VAN", "TRUCK"],
    },
  },
} as const
