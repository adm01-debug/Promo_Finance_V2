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
        // `new Date(null)` devolveria 01/01/1970, que a tela exibiria como
        // "última verificação" — mantém nulo quando nunca houve verificação.
        lastCheck: parsed.lastCheck ? new Date(parsed.lastCheck) : null,
      };
    }
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao carregar status de saúde:', error);
  }

  // Sem nada gravado, o status é desconhecido — não "online com 0ms". Este
  // default era a segunda fonte de status fabricado: a tela abria afirmando
  // "SEFAZ Online / Rápido" sem nenhuma consulta ter acontecido.
  return {
    online: null,
    latency: null,
    lastCheck: null,
    consecutiveFailures: 0,
    averageResponseTime: 0,
  };
}

export function updateSefazHealthStatus(status: Partial<SefazHealthStatus>): void {
  const current = getSefazHealthStatus();
  // Não forçar `new Date()`: carimbar verificação em quem não verificou nada é
  // fabricar dado. Quem mediu de verdade passa `lastCheck` explicitamente.
  const updated = { ...current, ...status, lastCheck: status.lastCheck ?? current.lastCheck };
  try {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(updated));
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao salvar status de saúde:', error);
  }
}
