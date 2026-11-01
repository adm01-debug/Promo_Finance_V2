// Helper de captura de erro para edge functions → Sentry.
// NÃO envia body de request/response — dado financeiro sensível.
// Para ativar: adicione SENTRY_DSN nas Supabase Edge Function secrets
// (painel Supabase → Edge Functions → Secrets).

const SENTRY_DSN = Deno.env.get('SENTRY_DSN');
const SENTRY_ENVIRONMENT = Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production';

export async function captureException(
  error: unknown,
  context?: Record<string, string>
): Promise<void> {
  if (!SENTRY_DSN) return; // não ativo se sem DSN

  const eventId = crypto.randomUUID().replace(/-/g, '');
  const payload = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    platform: 'other',
    environment: SENTRY_ENVIRONMENT,
    exception: {
      values: [
        {
          type: error instanceof Error ? error.name : 'Error',
          value: error instanceof Error ? error.message : String(error),
          stacktrace:
            error instanceof Error && error.stack
              ? {
                  frames: error.stack
                    .split('\n')
                    .slice(1)
                    .map((line) => ({ filename: line.trim() })),
                }
              : undefined,
        },
      ],
    },
    extra: context ?? {},
  };

  const [projectId, publicKey] = parseDsn(SENTRY_DSN);
  await fetch(`https://sentry.io/api/${projectId}/store/`, {
    method: 'POST',
    headers: {
      'X-Sentry-Auth': `Sentry sentry_version=7,sentry_key=${publicKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => {}); // nunca lança para não mascarar erro original
}

function parseDsn(dsn: string): [string, string] {
  // formato: https://<key>@<host>/<project_id>
  const url = new URL(dsn);
  return [url.pathname.slice(1), url.username];
}
