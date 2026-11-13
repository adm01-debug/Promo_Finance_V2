export interface ScimLogRow {
  id: string;
  token_id: string | null;
  empresa_id: string | null;
  resource_type: string;
  operation: string;
  external_id: string | null;
  user_id: string | null;
  status_code: number;
  request_body: unknown;
  response_body: unknown;
  duration_ms: number | null;
  created_at: string;
}

export type StatusBucket = 'all' | '2xx' | '4xx' | '5xx';
