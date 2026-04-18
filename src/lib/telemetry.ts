/**
 * Telemetria de erros frontend
 *
 * Captura window.onerror e unhandledrejection, persistindo em
 * frontend_error_logs (RLS estrita: usuário só vê os próprios; admin vê todos).
 *
 * Uso: chamar `initTelemetry()` uma única vez em src/main.tsx (após criação do root).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

type Severity = 'error' | 'warning' | 'critical';

interface TelemetryPayload {
  message: string;
  stack?: string | null;
  url?: string;
  user_agent?: string;
  severity?: Severity;
  context?: Record<string, unknown>;
}

let initialized = false;
const queue: TelemetryPayload[] = [];
let flushing = false;

const MAX_QUEUE = 50;
const FLUSH_DEBOUNCE_MS = 800;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushQueue(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;

  const batch = queue.splice(0, queue.length);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const rows = batch.map((p) => ({
      user_id: user?.id ?? null,
      message: p.message.slice(0, 2000),
      stack: p.stack?.slice(0, 8000) ?? null,
      url: p.url ?? window.location.href,
      user_agent: p.user_agent ?? navigator.userAgent,
      severity: p.severity ?? 'error',
      context: (p.context ?? null) as never,
    }));

    const { error } = await supabase.from('frontend_error_logs').insert(rows);
    if (error) {
      // Não loga via reportError para evitar loop infinito
      logger.warn('[telemetry] Falha ao persistir logs:', error.message);
    }
  } catch (err) {
    logger.warn('[telemetry] Exceção ao enviar batch:', err);
  } finally {
    flushing = false;
  }
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    void flushQueue();
  }, FLUSH_DEBOUNCE_MS);
}

/**
 * Reporta um erro manualmente para a telemetria.
 * Use em catch blocks de fluxos críticos (mutations, edge function calls).
 */
export function reportError(payload: TelemetryPayload): void {
  if (queue.length >= MAX_QUEUE) {
    queue.shift(); // descarta mais antigo para evitar memory leak
  }
  queue.push(payload);
  scheduleFlush();
}

/**
 * Inicializa listeners globais. Idempotente.
 */
export function initTelemetry(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (event) => {
    reportError({
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      url: event.filename || window.location.href,
      severity: 'error',
      context: {
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection');
    const stack = reason instanceof Error ? reason.stack : undefined;
    reportError({
      message,
      stack,
      severity: 'error',
      context: { type: 'unhandledrejection' },
    });
  });

  // Flush antes de fechar a aba
  window.addEventListener('beforeunload', () => {
    if (queue.length > 0) {
      void flushQueue();
    }
  });

  logger.info('[telemetry] Inicializado');
}
