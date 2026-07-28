/**
 * Telemetria de erros e performance frontend
 *
 * Captura window.onerror, unhandledrejection e Web Vitals (LCP, FID, CLS, etc.),
 * persistindo em frontend_error_logs e frontend_performance_logs.
 *
 * Uso: chamar `initTelemetry()` uma única vez em src/main.tsx.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import { onCLS, onFID, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';

/**
 * Converte um objeto arbitrário em `Json` serializável.
 *
 * Breadcrumbs carregam `Record<string, unknown>` fornecido pelo chamador, que
 * pode conter valores não serializáveis (funções, Map, referências cíclicas,
 * `undefined`). O round-trip por JSON normaliza tudo isso e garante que o
 * payload enviado ao banco seja exatamente o que a coluna `jsonb` aceita —
 * evitando tanto erro de tipo quanto falha silenciosa de insert em runtime.
 */
function toJson(value: unknown): Json {
  try {
    return JSON.parse(JSON.stringify(value ?? {})) as Json;
  } catch {
    // Referência cíclica ou getter que lança: preserva-se o erro, perde-se o anexo.
    return { _unserializable: true };
  }
}


// Breadcrumbs para rastreamento de ações do usuário e chamadas Supabase
type BreadcrumbData = Record<string, unknown> | undefined;
const breadcrumbs: Array<{ message: string; timestamp: string; data?: BreadcrumbData }> = [];
const MAX_BREADCRUMBS = 20;

export function addBreadcrumb(message: string, data?: BreadcrumbData) {
  breadcrumbs.push({ message, data, timestamp: new Date().toISOString() });
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
}

type Severity = 'error' | 'warning' | 'critical';

interface TelemetryPayload {
  message: string;
  stack?: string | null;
  url?: string;
  user_agent?: string;
  severity?: Severity;
  breadcrumbs?: typeof breadcrumbs;
  context?: Record<string, unknown>;
}

let initialized = false;
const errorQueue: TelemetryPayload[] = [];
const perfQueue: Metric[] = [];
let flushing = false;

const MAX_QUEUE = 50;
const FLUSH_DEBOUNCE_MS = 2000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushQueues(): Promise<void> {
  if (flushing || (errorQueue.length === 0 && perfQueue.length === 0)) return;
  flushing = true;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // RLS exige usuário autenticado para inserts nessas tabelas.
    // Quando anônimo, descarta a fila para evitar 401 em loop no console.
    if (!user) {
      errorQueue.length = 0;
      perfQueue.length = 0;
      return;
    }



    // 1. Process errors
    if (errorQueue.length > 0) {
      const batch = errorQueue.splice(0, errorQueue.length);
      // Os nomes abaixo espelham EXATAMENTE as colunas de frontend_error_logs.
      // Antes desta correção o payload usava message/stack/context, que não
      // existem no schema: todo insert falhava com PGRST204 e era engolido
      // pelo catch, deixando o monitoramento de erros cego em produção.
      const rows = batch.map((p) => ({
        user_id: user?.id ?? null,
        error_message: p.message.slice(0, 2000),
        error_stack: p.stack?.slice(0, 8000) ?? null,
        url: (p.url ?? window.location.href).slice(0, 2000),
        user_agent: (p.user_agent ?? navigator.userAgent).slice(0, 500),
        severity: p.severity ?? 'error',
        metadata: { ...(p.context ?? {}), breadcrumbs: p.breadcrumbs },
      }));
      await supabase.from('frontend_error_logs').insert(rows);
    }


    // 2. Process performance metrics
    if (perfQueue.length > 0) {
      const batch = perfQueue.splice(0, perfQueue.length);
      const rows = batch.map((m) => ({
        user_id: user?.id ?? null,
        metric_name: m.name,
        value: m.value,
        rating: m.rating,
        url: window.location.href,
        user_agent: navigator.userAgent,
        navigation_type: (m as Metric & { navigationType?: string }).navigationType || 'navigate',
      }));
      await supabase.from('frontend_performance_logs').insert(rows);
    }
  } catch (err) {
    logger.warn('[telemetry] Exceção ao enviar batches:', err);
  } finally {
    flushing = false;
  }
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    void flushQueues();
  }, FLUSH_DEBOUNCE_MS);
}

export function reportError(payload: TelemetryPayload): void {
  if (errorQueue.length >= MAX_QUEUE) errorQueue.shift();
  errorQueue.push({ ...payload, breadcrumbs: [...breadcrumbs] });
  scheduleFlush();
}

function reportMetric(metric: Metric): void {
  if (perfQueue.length >= MAX_QUEUE) perfQueue.shift();
  perfQueue.push(metric);
  scheduleFlush();
}

export function initTelemetry(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Errors
  window.addEventListener('error', (event) => {
    reportError({
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      url: event.filename || window.location.href,
      severity: 'error',
      context: { lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection');
    reportError({
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
      severity: 'error',
      context: { type: 'unhandledrejection' },
    });
  });

  // Web Vitals
  try {
    onCLS(reportMetric);
    onFID(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
  } catch (err) {
    logger.warn('[telemetry] Erro ao registrar web-vitals:', err);
  }

  window.addEventListener('beforeunload', () => {
    if (errorQueue.length > 0 || perfQueue.length > 0) {
      void flushQueues();
    }
  });

  logger.info('[telemetry] Inicializado com Web Vitals');
}

