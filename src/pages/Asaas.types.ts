export type DetailStatEntry = { status?: string };

export type AuditTrailLog = {
  id: string;
  payment_id?: string;
  action: string;
  created_at: string;
  details?: { message?: string } | null;
  previous_status?: string | null;
  new_status?: string | null;
};

export interface AsaasStats {
  total: number;
  pendentes: number;
  recebidos: number;
  vencidos: number;
  valorPendente: number;
  valorRecebido: number;
}

export interface SaldoAsaas {
  balance: number;
  totalPending: number;
}
