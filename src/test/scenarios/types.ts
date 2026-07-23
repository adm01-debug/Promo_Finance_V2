/**
 * Tipos compartilhados do harness de cenários.
 */

export type Domain =
  | "conciliacao"
  | "webhooks"
  | "cobranca"
  | "anomalias"
  | "nfe"
  | "entregas";

export type FaultKind =
  | "none"
  | "timeout"
  | "flaky"
  | "reorder"
  | "duplicate"
  | "latency"
  | "partial_write"
  | "nfe_gzip_corrupt"
  | "nfe_nsu_gap"
  | "nfe_soap_timeout"
  | "entrega_driver_offline"
  | "entrega_gps_lost"
  | "entrega_pod_missing"
  | "entrega_status_regressivo";

export interface FaultSpec {
  kind: FaultKind;
  /** taxa 0..1 para flaky/partial_write, k para duplicate, ms para timeout/latency */
  param?: number;
}

export interface ScenarioSpec {
  id: string;
  domain: Domain;
  fault: FaultSpec;
  seed: number;
  /** tamanho do lote (transações/eventos/boletos/anomalias) */
  size: number;
}

export interface InvariantViolation {
  invariant: string;
  message: string;
  details?: unknown;
}

export interface ScenarioResult {
  spec: ScenarioSpec;
  durationMs: number;
  mutations: number;
  violations: InvariantViolation[];
}

/**
 * Estado "de banco" in-memory pós-execução.
 * Estrutura minimalista mas suficiente para todos os invariantes.
 */
export interface ScenarioState {
  empresaId: string;

  contas: {
    saldoInicial: number;
    saldoFinal: number;
  };

  transacoes: Array<{
    id: string;
    transacaoExternaId: string;
    valor: number; // positivo=crédito, negativo=débito
    conciliada: boolean;
    lancamentoId?: string;
  }>;

  lancamentos: Array<{
    id: string;
    tipo: "pagar" | "receber";
    valor: number;
  }>;

  webhookEvents: Array<{
    id: string; // event_id
    paymentId: string;
    tipo: "PAYMENT_CREATED" | "PAYMENT_CONFIRMED" | "PAYMENT_FAILED";
    processedAt: number; // ordem lógica de processamento
    /** contagem de vezes que o handler foi invocado com este event_id */
    invocations: number;
  }>;

  anomalias: Array<{
    id: string;
    status: "nova" | "confirmada" | "falso_positivo";
    statusHistory: string[];
  }>;

  reguaDisparos: Array<{
    boletoId: string;
    etapa: string;
    janela: string; // ex: "2026-07-22"
  }>;

  auditLogs: Array<{
    entidade: string;
    entidadeId: string;
    de: string | null;
    para: string;
  }>;

  nfe: {
    ultimoNsuHistory: number[];
    recebidas: Array<{
      chaveAcesso: string;
      nsu: number;
      xmlSalvo: boolean;
      /** Caminho no bucket `nfe-xml`: `{empresa_id}/{chave}.xml`. Presente quando xmlSalvo=true. */
      xmlPath?: string;
      manifestacao: "pendente" | "ciencia" | "confirmada" | "desconhecida" | "nao_realizada";
      manifestacaoHistory: string[];
    }>;
    eventos: Array<{
      id: string;
      chaveAcesso: string;
      tipo: string;
    }>;
  };

  entregas: Array<{
    orderId: string;
    status:
      | "pending"
      | "assigning"
      | "picked_up"
      | "in_progress"
      | "delivered"
      | "canceled"
      | "failed";
    statusHistory: string[];
    driverId?: string;
    deliveredAt?: number;
    hasPod: boolean;
    gpsPoints: number;
    canceledReason?: string;
  }>;
}
