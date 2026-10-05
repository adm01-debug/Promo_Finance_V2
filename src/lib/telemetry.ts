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
import { env } from '@/config/env';
import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';

// Breadcrumbs para rastreamento de ações do usuário e chamadas Supabase
// (Json para persistir em frontend_error_logs.metadata sem casts)
type BreadcrumbData = Record<string, Json> | undefined;
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
  context?: Record<string, Json>;
}

let initialized = false;
// A assinatura acontece dentro do initTelemetry — no nível do módulo ela
// quebraria os testes que mockam o client (supabase.auth indefinido).
let cachedAccessToken: string | null = null;
// O flush de unload não pode await getUser() — user.id fica em cache aqui.
let cachedUserId: string | null = null;

const errorQueue: TelemetryPayload[] = [];
const perfQueue: Metric[] = [];
let flushing = false;

const MAX_QUEUE = 50;
const FLUSH_DEBOUNCE_MS = 2000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function buildErrorRows(userId: string | null, batch: TelemetryPayload[]) {
  return batch.map((p) => ({
    user_id: userId,
    error_message: p.message.slice(0, 2000),
    error_stack: p.stack?.slice(0, 8000) ?? null,
    url: p.url ?? window.location.href,
    user_agent: p.user_agent ?? navigator.userAgent,
    severity: p.severity ?? 'error',
    metadata: { ...(p.context ?? {}), breadcrumbs: p.breadcrumbs },
  }));
}

function buildPerfRows(userId: string | null, batch: Metric[]) {
  return batch.map((m) => ({
    user_id: userId,
    metric_name: m.name,
    value: m.value,
    rating: m.rating,
    url: window.location.href,
    user_agent: navigator.userAgent,
    navigation_type: (m as Metric & { navigationType?: string }).navigationType || 'navigate',
  }));
}

// O unload fecha a aba antes do flush async terminar (await getUser +
// inserts). `fetch` com keepalive continua depois do unload — mesma
// semântica do sendBeacon, mas aceitando os headers que o PostgREST exige.
// keepalive limita ~64KiB no TOTAL dos corpos pendentes (não por request):
// um lote maior é rejeitado depois que splice(0) esvaziou a fila, e a
// telemetria se perde. O orçamento abaixo é único para os dois POSTs e
// erros têm prioridade sobre métricas.
const KEEPALIVE_ORCAMENTO_BYTES = 60_000;

function loteKeepalive<T>(rows: T[], orcamento: number): T[] {
  const encoder = new TextEncoder();
  const lote: T[] = [];
  let usado = 2; // colchetes do array serializado
  for (const row of rows) {
    // bytes UTF-8 do corpo real, não unidades UTF-16 do .length
    const tam = encoder.encode(JSON.stringify(row)).length + 1; // vírgula
    if (usado + tam > orcamento) break;
    lote.push(row);
    usado += tam;
  }
  return lote;
}

function flushQueuesKeepalive(userId: string | null): void {
  if (!cachedAccessToken) return;
  const headers = {
    apikey: env.SUPABASE_PUBLISHABLE_KEY,
    authorization: `Bearer ${cachedAccessToken}`,
    'content-type': 'application/json',
    prefer: 'return=minimal',
  };
  const post = (tabela: string, rows: Record<string, unknown>[]) =>
    fetch(`${env.SUPABASE_URL}/rest/v1/${tabela}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(rows),
      keepalive: true,
    }).catch(() => {});
  let orcamento = KEEPALIVE_ORCAMENTO_BYTES;
  if (errorQueue.length > 0) {
    const rows = loteKeepalive(buildErrorRows(userId, errorQueue.splice(0)), orcamento);
    if (rows.length > 0) {
      void post('frontend_error_logs', rows);
      // desconto também em bytes UTF-8, como a seleção do lote
      orcamento -= new TextEncoder().encode(JSON.stringify(rows)).length;
    }
  }
  if (perfQueue.length > 0 && orcamento > 0) {
    const rows = loteKeepalive(buildPerfRows(userId, perfQueue.splice(0)), orcamento);
    if (rows.length > 0) void post('frontend_performance_logs', rows);
  }
}

async function flushQueues(): Promise<void> {
  if (flushing || (errorQueue.length === 0 && perfQueue.length === 0)) return;
  flushing = true;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
      const rows = buildErrorRows(user?.id ?? null, batch);
      // eslint-disable-next-line local/no-floating-supabase-write -- débito de integridade de escrita, herdado do inventário da Etapa 15
      await supabase.from('frontend_error_logs').insert(rows);
    }

    // 2. Process performance metrics
    if (perfQueue.length > 0) {
      const batch = perfQueue.splice(0, perfQueue.length);
      const rows = buildPerfRows(user?.id ?? null, batch);
      // eslint-disable-next-line local/no-floating-supabase-write -- débito de integridade de escrita, herdado do inventário da Etapa 15
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
    const message =
      reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection');
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
    onINP(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
  } catch (err) {
    logger.warn('[telemetry] Erro ao registrar web-vitals:', err);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.access_token ?? null;
    cachedUserId = session?.user?.id ?? null;
  });

  window.addEventListener('beforeunload', () => {
    if (errorQueue.length > 0 || perfQueue.length > 0) {
      // keepalive: o fetch async comum morreria com a aba antes do await.
      flushQueuesKeepalive(cachedUserId);
    }
  });

  logger.info('[telemetry] Inicializado com Web Vitals');
}
