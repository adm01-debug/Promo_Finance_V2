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

import { createLogger, redigirTexto } from './observability.ts';

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
          // A mensagem e a stack saem do processo sem a redação da tabela —
          // um erro com token/segredo interpolado vazaria no Sentry.
          value: redigirTexto(error instanceof Error ? error.message : String(error)),
          stacktrace:
            error instanceof Error ? framesDo(redigirTexto(error.stack ?? '')) : undefined,
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

// Espelha um ReadableStream chamando `aoTerminar` no desfecho real:
// 'ok' quando o produtor encerra, 'error' quando quebra no meio, 'cancel'
// quando o consumidor desiste — sem bloquear a entrega do primeiro chunk.
function espelharStream(
  origem: ReadableStream<Uint8Array>,
  aoTerminar: (desfecho: 'ok' | 'error' | 'cancel', detalhe?: string) => void
): ReadableStream<Uint8Array> {
  const reader = origem.getReader();
  // Um request = um evento: cancel() dispara o desfecho e o read()
  // pendente rejeita logo em seguida — sem a trava, pull() registraria
  // um segundo request_error fantasma para a mesma requisição.
  let terminado = false;
  const registrar = (d: 'ok' | 'error' | 'cancel', detalhe?: string) => {
    if (terminado) return;
    terminado = true;
    aoTerminar(d, detalhe);
  };
  // pull() em vez de drenar em start(): cada leitura só acontece quando o
  // consumidor pede (desiredSize > 0), preservando a contrapressão do SSE.
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          registrar('ok');
          reader.releaseLock();
          return;
        }
        controller.enqueue(value);
      } catch (e) {
        registrar('error', e instanceof Error ? e.message : String(e));
        controller.error(e);
        reader.releaseLock();
      }
    },
    cancel(reason) {
      registrar('cancel', typeof reason === 'string' ? reason : undefined);
      // Cancela o reader (e não a origem direta): a mesma referência usada
      // pelo pull é liberada e propaga o cancelamento ao produtor.
      void reader.cancel(reason);
    },
  });
}

export function withEdgeObservability(functionName: string, handler: Handler): Handler {
  return async (req: Request): Promise<Response> => {
    // Preflight CORS não é tráfego de negócio — medir ele inflaria rate e
    // misturaria durations de ~0ms no percentil. Passa direto.
    if (req.method === 'OPTIONS') return handler(req);

    // O client Supabase propaga x-request-id (correlation.ts); o
    // x-correlation-id cobre chamadas externas fora do client.
    const requestId =
      req.headers.get('x-request-id') ?? req.headers.get('x-correlation-id') ?? crypto.randomUUID();
    const log = createLogger(functionName, requestId);
    const inicio = Date.now();
    try {
      // O handler recebe o ID resolvido: sem isso, requisições sem
      // x-request-id (ou só com x-correlation-id) logariam dentro do
      // handler um ID diverso do usado nos eventos request_end/error.
      const cabecalhos = new Headers(req.headers);
      cabecalhos.set('x-request-id', requestId);
      const res = await handler(new Request(req, { headers: cabecalhos }));
      // Resposta SSE (text/event-stream) continua produzindo depois do
      // return — medir aqui registraria ~0ms e sucesso mesmo se o stream
      // falhar no meio. Encadeia um stream espelho que registra o fim real.
      if (res.headers.get('content-type')?.includes('text/event-stream') && res.body) {
        const corpoEspelhado = espelharStream(res.body, (desfecho, detalhe) => {
          if (desfecho === 'ok') {
            log.info('request_end', {
              duration_ms: Date.now() - inicio,
              status_code: res.status,
              context: { method: req.method, stream: true },
            });
          } else {
            log.error('request_error', {
              duration_ms: Date.now() - inicio,
              status_code: res.status,
              error_message: detalhe ?? 'stream interrompido',
              context: { method: req.method, stream: true, desfecho },
            });
          }
          void segundoPlano(log.flush());
        });
        return new Response(corpoEspelhado, res);
      }
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
          // Só o caminho: a query dos callbacks carrega code/state/verifier
          // (credenciais OIDC) e não pode sair do processo.
          path: new URL(req.url).pathname,
        })
      );
      if (envio) await envio;
      throw erro;
    }
  };
}
