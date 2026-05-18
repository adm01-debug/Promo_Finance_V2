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
      login_attempts: {
        Row: {
          attempt_count: number
          block_reason: string | null
          created_at: string
          email: string
          first_attempt_at: string
          id: string
          ip_address: unknown
          is_suspicious: boolean | null
          last_attempt_at: string
          locked_until: string | null
          user_agent: string | null
        }
        Insert: {
          attempt_count?: number
          block_reason?: string | null
          created_at?: string
          email: string
          first_attempt_at?: string
          id?: string
          ip_address?: unknown
          is_suspicious?: boolean | null
          last_attempt_at?: string
          locked_until?: string | null
          user_agent?: string | null
        }
        Update: {
          attempt_count?: number
          block_reason?: string | null
          created_at?: string
          email?: string
          first_attempt_at?: string
          id?: string
          ip_address?: unknown
          is_suspicious?: boolean | null
          last_attempt_at?: string
          locked_until?: string | null
          user_agent?: string | null
        }
        Relationships: []
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
      password_reset_requests: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_agent: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_agent?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
      is_country_blocked: { Args: { _country_code: string }; Returns: boolean }
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
      app_role: "admin" | "manager" | "operator" | "viewer"
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
      app_role: ["admin", "manager", "operator", "viewer"],
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
      vehicle_type: ["MOTORCYCLE", "CAR", "VAN", "TRUCK"],
    },
  },
} as const
