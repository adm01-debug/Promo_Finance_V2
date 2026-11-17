// Tipos do módulo de contingência SEFAZ
export type ContingencyMode = 'normal' | 'SCAN' | 'DPEC' | 'FSDA' | 'SVCAN' | 'SVCRS' | 'offline';

export interface ContingencyState {
  mode: ContingencyMode;
  reason: string;
  activatedAt: Date | null;
  activatedBy: string;
  estimatedReturn: Date | null;
  autoActivated: boolean;
  failureCount: number;
  lastFailure: Date | null;
  pendingNFes: PendingNFe[];
}

export interface PendingNFe {
  id: string;
  numero: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: Date;
  valorTotal: number;
  destinatario: string;
  xmlContingencia: string;
  status: 'pendente' | 'transmitindo' | 'autorizada' | 'rejeitada';
  tentativas: number;
  ultimaTentativa: Date | null;
  erro?: string;
}

export interface SefazHealthStatus {
  /**
   * `null` = status desconhecido: ninguém consultou a SEFAZ.
   *
   * Enquanto a integração não estiver homologada, este é o único valor honesto —
   * `true` afirmaria disponibilidade que não foi medida e `false` afirmaria uma
   * queda que também não foi medida. `null` é falsy, então nenhum ternário
   * existente inverte de sentido ao receber o terceiro estado.
   */
  online: boolean | null;
  /** `null` quando não houve medição — 0ms seria latência fabricada. */
  latency: number | null;
  /** `null` quando nunca houve verificação. */
  lastCheck: Date | null;
  consecutiveFailures: number;
  averageResponseTime: number;
}

export interface ContingencyRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'failure_count' | 'latency' | 'schedule' | 'time_window';
  mode: ContingencyMode;
  config: {
    maxFailures?: number;
    maxLatency?: number;
    scheduleStart?: string;
    scheduleEnd?: string;
    scheduleDays?: number[];
    downtimeMinutes?: number;
  };
  reason: string;
  priority: number;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface AutoContingencyConfig {
  enabled: boolean;
  rules: ContingencyRule[];
  checkIntervalSeconds: number;
  notifyOnActivation: boolean;
  notifyOnDeactivation: boolean;
  autoDeactivateWhenOnline: boolean;
  autoDeactivateDelayMinutes: number;
}

export interface NFeData {
  [key: string]: unknown;
}
