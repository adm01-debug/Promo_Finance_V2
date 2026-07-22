import { logger } from '@/lib/logger';
import type { ContingencyMode, ContingencyState, PendingNFe, SefazHealthStatus } from './types';
import { getContingencyState, getSefazHealthStatus, saveContingencyState, updateSefazHealthStatus } from './storage';

export function activateContingency(
  mode: ContingencyMode,
  reason: string,
  activatedBy: string,
  estimatedReturn?: Date,
  autoActivated = false,
): ContingencyState {
  const state: ContingencyState = {
    ...getContingencyState(),
    mode,
    reason,
    activatedAt: new Date(),
    activatedBy,
    estimatedReturn: estimatedReturn || null,
    autoActivated,
  };
  saveContingencyState(state);
  logger.debug('[Contingência] Modo ativado:', mode, 'Motivo:', reason);
  return state;
}

export function deactivateContingency(): ContingencyState {
  const state: ContingencyState = {
    ...getContingencyState(),
    mode: 'normal',
    reason: '',
    activatedAt: null,
    activatedBy: '',
    estimatedReturn: null,
    autoActivated: false,
    failureCount: 0,
  };
  saveContingencyState(state);
  logger.debug('[Contingência] Modo desativado');
  return state;
}

export function registerCommunicationFailure(): ContingencyState {
  const state = getContingencyState();
  state.failureCount++;
  state.lastFailure = new Date();

  if (state.failureCount >= 3 && state.mode === 'normal') {
    return activateContingency(
      'offline',
      'SEFAZ indisponível - múltiplas falhas de comunicação',
      'Sistema',
      undefined,
      true,
    );
  }

  saveContingencyState(state);
  return state;
}

export function registerCommunicationSuccess(): void {
  const state = getContingencyState();
  state.failureCount = 0;
  saveContingencyState(state);
}

export function addPendingNFe(
  nfe: Omit<PendingNFe, 'status' | 'tentativas' | 'ultimaTentativa'>,
): ContingencyState {
  const state = getContingencyState();
  state.pendingNFes.push({
    ...nfe,
    status: 'pendente',
    tentativas: 0,
    ultimaTentativa: null,
  });
  saveContingencyState(state);
  logger.debug('[Contingência] NF-e pendente adicionada:', nfe.numero);
  return state;
}

export function updatePendingNFe(
  id: string,
  updates: Partial<Pick<PendingNFe, 'status' | 'tentativas' | 'ultimaTentativa' | 'erro'>>,
): ContingencyState {
  const state = getContingencyState();
  const nfeIndex = state.pendingNFes.findIndex((n) => n.id === id);
  if (nfeIndex >= 0) {
    state.pendingNFes[nfeIndex] = { ...state.pendingNFes[nfeIndex], ...updates };
    saveContingencyState(state);
  }
  return state;
}

export function removePendingNFe(id: string): ContingencyState {
  const state = getContingencyState();
  state.pendingNFes = state.pendingNFes.filter((n) => n.id !== id);
  saveContingencyState(state);
  return state;
}

export async function checkSefazHealth(): Promise<SefazHealthStatus> {
  const startTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700));

  const isOnline = Math.random() > 0.1;
  const latency = Date.now() - startTime;

  const currentHealth = getSefazHealthStatus();
  const status: SefazHealthStatus = {
    online: isOnline,
    latency,
    lastCheck: new Date(),
    consecutiveFailures: isOnline ? 0 : currentHealth.consecutiveFailures + 1,
    averageResponseTime: isOnline
      ? (currentHealth.averageResponseTime + latency) / 2
      : currentHealth.averageResponseTime,
  };

  updateSefazHealthStatus(status);

  if (!isOnline) {
    registerCommunicationFailure();
  } else {
    registerCommunicationSuccess();
  }

  return status;
}

export function getContingencyStats(): {
  totalPending: number;
  pendingValue: number;
  oldestPending: Date | null;
  transmissionAttempts: number;
} {
  const state = getContingencyState();
  const pending = state.pendingNFes.filter((n) => n.status === 'pendente');

  return {
    totalPending: pending.length,
    pendingValue: pending.reduce((sum, n) => sum + n.valorTotal, 0),
    oldestPending:
      pending.length > 0
        ? new Date(Math.min(...pending.map((n) => n.dataEmissao.getTime())))
        : null,
    transmissionAttempts: pending.reduce((sum, n) => sum + n.tentativas, 0),
  };
}
