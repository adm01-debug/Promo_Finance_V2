import { logger } from '@/lib/logger';
import type { ContingencyState, SefazHealthStatus } from './types';
import { HEALTH_KEY, STORAGE_KEY, initialState } from './constants';

interface ParsedNFe {
  dataEmissao: string;
  ultimaTentativa?: string | null;
}

export function getContingencyState(): ContingencyState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        activatedAt: parsed.activatedAt ? new Date(parsed.activatedAt) : null,
        estimatedReturn: parsed.estimatedReturn ? new Date(parsed.estimatedReturn) : null,
        lastFailure: parsed.lastFailure ? new Date(parsed.lastFailure) : null,
        pendingNFes: parsed.pendingNFes.map((nfe: ParsedNFe) => ({
          ...nfe,
          dataEmissao: new Date(nfe.dataEmissao),
          ultimaTentativa: nfe.ultimaTentativa ? new Date(nfe.ultimaTentativa) : null,
        })),
      };
    }
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao carregar estado:', error);
  }
  return initialState;
}

export function saveContingencyState(state: ContingencyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao salvar estado:', error);
  }
}

export function getSefazHealthStatus(): SefazHealthStatus {
  try {
    const stored = localStorage.getItem(HEALTH_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        lastCheck: new Date(parsed.lastCheck),
      };
    }
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao carregar status de saúde:', error);
  }

  return {
    online: true,
    latency: 0,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    averageResponseTime: 0,
  };
}

export function updateSefazHealthStatus(status: Partial<SefazHealthStatus>): void {
  const current = getSefazHealthStatus();
  const updated = { ...current, ...status, lastCheck: new Date() };
  localStorage.setItem(HEALTH_KEY, JSON.stringify(updated));
}
