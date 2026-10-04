// Observabilidade de borda das edge functions: um wrapper em volta do
// handler do Deno.serve que emite métricas RED (Rate, Errors, Duration)
// para edge_function_logs e captura exceções não tratadas no Sentry —
// tudo sem SDK, via a API pública de envelopes.
//
// Uso:
//   Deno.serve(withEdgeObservability('minha-fn', async (req) => { ... }));
//
// RED sai de uma linha `request_end` por requisição (duration_ms +
// status_code): rate = count(*), errors = count(status_code>=5xx ou
// request_error), duration = percentis de duration_ms — consultáveis
// direto na tabela edge_function_logs.

import { createLogger } from './observability.ts';

type Handler = (req: Request) => Promise<Response> | Response;

interface SentryTarget {
  url: string;
  authHeader: string;
}

// DSN no formato https://<public_key>@<host>/<project_id>. Aceita
// EDGE_SENTRY_DSN (escopo edge) e cai para SENTRY_DSN (compartilhada).
function sentryTarget(): SentryTarget | null {
  const dsn = Deno.env.get('EDGE_SENTRY_DSN') ?? Deno.env.get('SENTRY_DSN');
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/\/+$/, '').split('/').pop();
    if (!projectId || !u.username) return null;
    return {
      url: `${u.protocol}//${u.host}/api/${projectId}/envelope/`,
      authHeader:
        `Sentry sentry_version=7, sentry_client=edge-observability/1.0, ` +
        `sentry_key=${u.username}`,
    };
  } catch {
    return null;
  }
}

// Converte stack do V8/Deno ("at fn (file:///x.ts:1:2)") em frames Sentry.
function framesDo(stack: string | undefined) {
  if (!stack) return undefined;
  const frames = stack
    .split('\n')
    .map((linha) => {
      const m = linha.match(/at\s+(.*?)\s*\(?(.+?):(\d+):(\d+)\)?\s*$/);
      if (!m) return null;
      return {
        function: m[1] || '<anonymous>',
        filename: m[2],
        lineno: Number(m[3]),
        colno: Number(m[4]),
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);
  return frames.length > 0 ? { frames: frames.reverse() } : undefined;
}

export function capturarExcecaoSentry(
  error: unknown,
  contexto: Record<string, unknown>
): Promise<void> {
  const target = sentryTarget();
  if (!target) return Promise.resolve();
  const eventId = crypto.randomUUID().replace(/-/g, '');
  const evento = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'edge-observability',
    server_name: 'supabase-edge',
    tags: { function_name: String(contexto.function_name ?? ''), runtime: 'deno-edge' },
    extra: contexto,
    exception: {
      values: [
        {
          type: error instanceof Error ? error.name : 'Error',
          value: error instanceof Error ? error.message : String(error),
          stacktrace: error instanceof Error ? framesDo(error.stack) : undefined,
        },
      ],
    },
  };
  const corpo = [
    JSON.stringify({ event_id: eventId }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(evento),
  ].join('\n');
  return fetch(target.url, {
    method: 'POST',
    headers: {
      'X-Sentry-Auth': target.authHeader,
      'Content-Type': 'application/x-sentry-envelope',
    },
    body: corpo,
  })
    .then(() => undefined)
    .catch(() => {
      // Observabilidade nunca derruba a função — falha de envio é silenciosa.
    });
}

// Executa promessa sem bloquear a resposta quando o runtime expõe
// EdgeRuntime.waitUntil (Supabase Edge); fora dele, aguarda — num runner
// de teste/local, perder o flush significaria perder o dado.
function segundoPlano(p: Promise<void>): Promise<void> | void {
  try {
    const rt = (globalThis as Record<string, unknown>).EdgeRuntime as
      | { waitUntil?: (p: Promise<unknown>) => void }
      | undefined;
    if (rt?.waitUntil) {
      rt.waitUntil(p);
      return;
    }
  } catch {
    // segue para o await
  }
  return p;
}

export function withEdgeObservability(functionName: string, handler: Handler): Handler {
  return async (req: Request): Promise<Response> => {
    // Preflight CORS não é tráfego de negócio — medir ele inflaria rate e
    // misturaria durations de ~0ms no percentil. Passa direto.
    if (req.method === 'OPTIONS') return handler(req);

    const requestId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
    const log = createLogger(functionName, requestId);
    const inicio = Date.now();
    try {
      const res = await handler(req);
      log.info('request_end', {
        duration_ms: Date.now() - inicio,
        status_code: res.status,
        context: { method: req.method },
      });
      const flush = segundoPlano(log.flush());
      if (flush) await flush;
      return res;
    } catch (erro) {
      log.error('request_error', {
        duration_ms: Date.now() - inicio,
        status_code: 500,
        error_message: erro instanceof Error ? erro.message : String(erro),
        context: { method: req.method },
      });
      const flush = segundoPlano(log.flush());
      if (flush) await flush;
      const envio = segundoPlano(
        capturarExcecaoSentry(erro, {
          function_name: functionName,
          request_id: requestId,
          method: req.method,
          url: req.url,
        })
      );
      if (envio) await envio;
      throw erro;
    }
  };
}
