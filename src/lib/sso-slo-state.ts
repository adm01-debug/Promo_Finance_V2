/**
 * Estado de falha do SSO Single Logout (SLO).
 *
 * Persistimos um pequeno snapshot em sessionStorage para que o banner em /auth
 * possa exibir o motivo correto e oferecer ações de recuperação:
 *  - Tentar novamente o logout no provedor (chama edge `sso-logout` de novo).
 *  - Reiniciar a revogação local (re-executa runAuthCleanup + supabase.auth.signOut).
 *
 * Não usamos toasts efêmeros porque o usuário pode chegar em /auth com um redirect
 * duro (window.location.replace) e a mensagem precisa sobreviver ao reload.
 */
const KEY = 'sso-slo-failure';

export type SloFailureReason =
  | 'provider_logout_failed'
  | 'local_cleanup_failed'
  | 'unknown';

export interface SloFailureSnapshot {
  reason: SloFailureReason;
  providerNome: string | null;
  providerId: string | null;
  message: string | null;
  /** Se o cleanup local (storages, cookies, cache) falhou também. */
  localCleanupFailed: boolean;
  /** Se o logout no provedor falhou (edge sso-logout retornou erro ou não devolveu URL). */
  providerLogoutFailed: boolean;
  ts: number;
}

export function setSloFailure(snapshot: Omit<SloFailureSnapshot, 'ts'>): void {
  try {
    const payload: SloFailureSnapshot = { ...snapshot, ts: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* noop */
  }
}

export function readSloFailure(): SloFailureSnapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SloFailureSnapshot;
    if (!parsed || typeof parsed !== 'object' || !parsed.reason) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSloFailure(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Mensagens humanas em PT-BR por motivo. */
export const SLO_REASON_COPY: Record<SloFailureReason, { title: string; description: string }> = {
  provider_logout_failed: {
    title: 'Não conseguimos encerrar a sessão no provedor SSO',
    description:
      'Sua sessão local foi revogada, mas o provedor de identidade pode ainda manter a sessão ativa em outras aplicações. Recomendamos tentar o logout no provedor novamente.',
  },
  local_cleanup_failed: {
    title: 'Falha ao limpar a sessão local',
    description:
      'Não foi possível limpar todos os dados locais (cookies, cache, armazenamento). Por segurança, reinicie a revogação local antes de continuar.',
  },
  unknown: {
    title: 'Falha ao encerrar a sessão',
    description:
      'Ocorreu um problema inesperado ao encerrar sua sessão. Tente novamente para garantir que o logout seja completo.',
  },
};
