// Helper de captura de erro para edge functions → Sentry.
// NÃO envia body de request/response — dado financeiro sensível.
// Para ativar: adicione SENTRY_DSN nas Supabase Edge Function secrets
// (painel Supabase → Edge Functions → Secrets).

import { redigirTexto } from './observability.ts';
import { framesDo, segundoPlano } from './edge-observability.ts';

const SENTRY_ENVIRONMENT = Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production';

interface SentryTarget {
  projectId: string;
  publicKey: string;
  endpointUrl: string;
}

// parseDsn retorna null se o DSN for inválido — nunca lança.
// Preserva protocolo + host do DSN (pode ser o123.ingest.de.sentry.io, etc.).
function parseDsn(dsn: string): SentryTarget | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/\/+$/, '').split('/').pop();
    if (!projectId || !u.username) return null;
    return {
      projectId,
      publicKey: u.username,
      endpointUrl: `${u.protocol}//${u.host}/api/${projectId}/store/`,
    };
  } catch {
    return null;
  }
}

export function captureException(
  error: unknown,
  context?: Record<string, string>
): void {
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) return;

  const target = parseDsn(dsn);
  if (!target) {
    console.error('[sentry] DSN inválido — captureException ignorado');
    return;
  }

  const eventId = crypto.randomUUID().replace(/-/g, '');
  const errMsg = redigirTexto(error instanceof Error ? error.message : String(error));
  const errStack = error instanceof Error ? error.stack : undefined;

  const payload = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: 'other',
    environment: SENTRY_ENVIRONMENT,
    exception: {
      values: [
        {
          type: error instanceof Error ? error.name : 'Error',
          value: errMsg,
          stacktrace: errStack ? framesDo(redigirTexto(errStack)) : undefined,
        },
      ],
    },
    extra: context ?? {},
  };

  const envio = fetch(target.endpointUrl, {
    method: 'POST',
    headers: {
      'X-Sentry-Auth': `Sentry sentry_version=7,sentry_key=${target.publicKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then(() => undefined)
    .catch(() => {
      // Observabilidade nunca derruba a função — falha de envio é silenciosa.
    });

  segundoPlano(envio);
}
