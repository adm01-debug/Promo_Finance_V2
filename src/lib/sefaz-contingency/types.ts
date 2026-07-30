// Tipos do módulo de contingência SEFAZ
export type ContingencyMode =
  | 'normal'
  | 'SCAN'
  | 'DPEC'
  | 'FSDA'
  | 'SVCAN'
  | 'SVCRS'
  | 'offline';

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
  online: boolean;
  latency: number;
  lastCheck: Date;
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
