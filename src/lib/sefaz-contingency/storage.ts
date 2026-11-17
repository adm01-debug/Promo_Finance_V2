import { logger } from '@/lib/logger';
import type { ContingencyState, SefazHealthStatus } from './types';
import { HEALTH_KEY, STORAGE_KEY, initialState } from './constants';

// Versão do registro de saúde gravado no navegador. A versão anterior gravava
// status sorteado (`online: true`, `latency: 450`...); sem este marcador, quem
// já abriu o painel continuaria lendo esse valor inventado do localStorage
// mesmo depois da correção, e a aba Contingência o trataria como medição real
// (achado do Devin e do Codex na PR #423). Registro sem a versão é descartado.
const HEALTH_VERSAO = 2;

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
      if (parsed?.versao === HEALTH_VERSAO) {
        return {
          ...parsed,
          // `new Date(null)` devolveria 01/01/1970, que a tela exibiria como
          // "última verificação" — mantém nulo quando nunca houve verificação.
          lastCheck: parsed.lastCheck ? new Date(parsed.lastCheck) : null,
        };
      }
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
  //
  // `null` explícito APAGA a verificação anterior — é assim que checkSefazHealth
  // invalida o carimbo fabricado da versão antiga. Com `??` no lugar da checagem
  // de presença da chave, aquele timestamp voltava do storage e o banner o
  // reexibia como "última verificação" (achado do Codex na PR #423). Só a
  // ausência da chave preserva o valor anterior.
  const lastCheck = 'lastCheck' in status ? (status.lastCheck ?? null) : current.lastCheck;
  const updated = { ...current, ...status, lastCheck, versao: HEALTH_VERSAO };
  try {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(updated));
  } catch (error: unknown) {
    logger.error('[Contingência] Erro ao salvar status de saúde:', error);
  }
}
