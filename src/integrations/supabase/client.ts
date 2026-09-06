import { createClient } from '@supabase/supabase-js';
import { addBreadcrumb } from '@/lib/telemetry';
import { getCorrelationId } from '@/lib/correlation-id';
import { env } from '@/config/env';
import type { Database } from './types';

const storageKey = `sb-${env.SUPABASE_PROJECT_ID}-auth-token`;

const supabaseInstance = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Proxy para interceptar chamadas e adicionar breadcrumbs
const supabaseProxyHandler: ProxyHandler<object> = {
  get(target, prop) {
    const value = (target as Record<PropertyKey, unknown>)[prop];
    if (prop === 'from' && typeof value === 'function') {
      const fromFn = (...args: unknown[]) => {
        const tableName = args[0];
        addBreadcrumb(`Supabase: Accessing table ${tableName}`);
        return value.apply(target, args);
      };
      return fromFn;
    }
    if (prop === 'functions' && value) {
      return new Proxy(value as object, {
        get(fnTarget, fnProp) {
          const fnValue = (fnTarget as Record<PropertyKey, unknown>)[fnProp];
          if (fnProp === 'invoke' && typeof fnValue === 'function') {
            const invokeFn = (...args: unknown[]) => {
              const fnName = args[0];
              const options = (args[1] ?? {}) as {
                headers?: Record<string, string>;
                [k: string]: unknown;
              };
              // Sprint 3.2: propagar x-request-id em toda invocação de
              // Edge Function para permitir tracing end-to-end (client → fn → DB).
              const rid = getCorrelationId();
              const nextOptions = {
                ...options,
                headers: { 'x-request-id': rid, ...(options.headers ?? {}) },
              };
              addBreadcrumb(`Supabase: Invoking Edge Function ${fnName}`, {
                requestId: rid,
              });
              return fnValue.apply(fnTarget, [fnName, nextOptions]);
            };
            return invokeFn;
          }
          return fnValue;
        },
      });
    }
    return value;
  },
};

export const supabase = new Proxy(
  supabaseInstance,
  supabaseProxyHandler,
) as unknown as typeof supabaseInstance;

/**
 * Health-check pós-boot: valida que a URL/anon key apontam para um projeto
 * Supabase real e acessível. Retorna { ok, status, error } — nunca lança.
 * Timeout curto para não travar o boot em ambientes offline (PWA).
 *
 * Usa `/auth/v1/health` (GoTrue) porque `/rest/v1/` exige `service_role` e
 * retornaria 401 mesmo com uma anon key válida — o que fazia o app bloquear
 * o boot em 100% das sessões (regressão P0 corrigida em 2026-07).
 */
export async function verifySupabaseHealth(
  timeoutMs = 3000,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
      signal: controller.signal,
    });
    // GoTrue responde 200 quando saudável. Qualquer 2xx/3xx = ok.
    // 401/403/404 aqui indicam URL/anon key inválidas de verdade.
    return { ok: res.status >= 200 && res.status < 400, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}
