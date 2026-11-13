export interface TelemetryOpts {
  operation: string;
  table_name?: string;
  rpc_name?: string;
  duration_ms: number;
  record_count?: number;
  query_limit?: number;
  query_offset?: number;
  count_mode?: string;
  error_message?: string;
  user_id?: string;
}
