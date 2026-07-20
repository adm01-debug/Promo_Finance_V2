import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type SsoOnboardingEventType =
  | 'domain_resolved'
  | 'auto_redirect_started'
  | 'auto_redirect_cancelled'
  | 'manual_provider_selected'
  | 'redirect_dispatched'
  | 'redirect_failed'
  | 'password_fallback_used';

export interface SsoOnboardingEventInput {
  eventType: SsoOnboardingEventType;
  email?: string | null;
  providerId?: string | null;
  context?: Record<string, unknown>;
  success?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
}

/**
 * Telemetria fire-and-forget para o fluxo de onboarding corporativo SSO.
 * Falhas nunca quebram o login — apenas logam warning local.
 *
 * Deduplica eventos idênticos consecutivos (mesmo eventType + email + providerId)
 * dentro de uma janela curta para evitar spam por re-renders do React.
 */
export function useSsoOnboardingAudit() {
  const lastSentRef = useRef<{ key: string; at: number } | null>(null);

  const logEvent = useCallback((input: SsoOnboardingEventInput) => {
    const {
      eventType,
      email,
      providerId,
      context,
      success = true,
      errorCode,
      errorMessage,
    } = input;

    // Deduplicação: mesmo evento em <1500ms é ignorado
    const key = `${eventType}|${email ?? ''}|${providerId ?? ''}`;
    const now = Date.now();
    if (lastSentRef.current && lastSentRef.current.key === key && now - lastSentRef.current.at < 1500) {
      return;
    }
    lastSentRef.current = { key, at: now };

    void (async () => {
      try {
        const { error } = await supabase.rpc('log_sso_onboarding_event', {
          _email: email ?? '',
          _event_type: eventType,
          _provider_id: providerId ?? null,
          _context: (context ?? {}) as never,
          _success: success,
          _error_code: errorCode ?? null,
          _error_message: errorMessage ?? null,
        } as never);
        if (error) {
          logger.warn('[sso-audit] falha ao registrar evento', { eventType, error: error.message });
        }
      } catch (e) {
        logger.warn('[sso-audit] exceção ao registrar evento', {
          eventType,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    })();
  }, []);

  return { logEvent };
}
