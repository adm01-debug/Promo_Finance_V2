/**
 * Auditoria de retries do SLO (Single Logout) feitos a partir do banner em /auth.
 *
 * Esses retries acontecem **sem sessão ativa** (auth.uid() é null), então
 * registramos via RPC `log_sso_onboarding_event`, que é SECURITY DEFINER e
 * aceita user_id nulo — escrevendo em `sso_login_attempts` com event_type
 * dedicado para que o painel /admin/sso-events consiga rastrear:
 *   - slo_retry_provider_started   → usuário clicou em "tentar no provedor"
 *   - slo_retry_provider_succeeded → edge respondeu com logout_url ou OK
 *   - slo_retry_provider_failed    → edge falhou (rede, provider_not_found, …)
 *   - slo_retry_local_started      → usuário clicou em "reiniciar revogação local"
 *   - slo_retry_local_succeeded    → cleanup ok e nenhuma sessão remanescente
 *   - slo_retry_local_failed       → cleanup ok mas sessão persistiu, ou exceção
 *
 * Como `log_sso_onboarding_event` valida event_type contra uma whitelist do
 * banco, usamos os event_types já permitidos (`redirect_dispatched`,
 * `redirect_failed`, `password_fallback_used`) e diferenciamos o tipo real do
 * evento via `context.slo_retry_kind`.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type SloRetryKind =
  | 'slo_retry_provider_started'
  | 'slo_retry_provider_succeeded'
  | 'slo_retry_provider_failed'
  | 'slo_retry_local_started'
  | 'slo_retry_local_succeeded'
  | 'slo_retry_local_failed';

interface LogSloRetryArgs {
  kind: SloRetryKind;
  providerId?: string | null;
  email?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  context?: Record<string, unknown>;
}

/**
 * Mapeia o kind interno para um event_type aceito pela whitelist da RPC.
 * O kind real fica preservado em context.slo_retry_kind para os relatórios.
 */
function mapKindToAllowedEventType(kind: SloRetryKind): string {
  if (kind.endsWith('_failed')) return 'redirect_failed';
  if (kind.endsWith('_succeeded')) return 'redirect_dispatched';
  // *_started → tratamos como fallback/uso explícito do fluxo manual
  return 'password_fallback_used';
}

export async function logSloRetry({
  kind,
  providerId,
  email,
  errorCode,
  errorMessage,
  context,
}: LogSloRetryArgs): Promise<void> {
  try {
    const success = !kind.endsWith('_failed');
    const eventType = mapKindToAllowedEventType(kind);

    const fullContext: Record<string, unknown> = {
      slo_retry_kind: kind,
      surface: 'auth_slo_failure_banner',
      occurred_at: new Date().toISOString(),
      ...(context ?? {}),
    };

    const { error } = await supabase.rpc('log_sso_onboarding_event', {
      _email: email ?? null,
      _event_type: eventType,
      _provider_id: providerId ?? null,
      _context: fullContext as never,
      _success: success,
      _error_code: errorCode ?? null,
      _error_message: errorMessage ?? null,
    });

    if (error) {
      logger.warn('[sso-slo-audit] Falha ao registrar log de retry SLO', {
        kind,
        error,
      });
    }
  } catch (e) {
    // Auditoria nunca deve quebrar o fluxo de logout.
    logger.warn('[sso-slo-audit] Exceção ao registrar log de retry SLO', { kind, error: e });
  }
}
