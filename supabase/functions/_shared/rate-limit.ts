/**
 * Rate limit por IP + endpoint usando a tabela public.rate_limit_logs.
 *
 * Estratégia: sliding window de 60 segundos, contagem por (endpoint, ip).
 * Fail-open: se a consulta ao banco falhar, permitimos a requisição
 * (não queremos derrubar webhooks legítimos por causa de indisponibilidade
 * do rate limiter — a validação de assinatura/HMAC continua sendo a
 * defesa primária).
 *
 * Uso:
 *   const rl = await checkRateLimit(supabase, { endpoint: 'asaas-webhook',
 *     ip, limit: 120, windowSeconds: 60 });
 *   if (!rl.allowed) return new Response('Too Many Requests', { status: 429 });
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

export interface RateLimitOptions {
  endpoint: string;
  ip: string;
  limit: number;
  windowSeconds?: number;
  userAgent?: string | null;
  /** Use `closed` em endpoints autenticados que não podem degradar sem limite. */
  failureMode?: 'open' | 'closed';
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
  unavailable?: boolean;
}

function resultadoIndisponivel(failureMode: 'open' | 'closed', limit: number): RateLimitResult {
  return {
    allowed: failureMode === 'open',
    count: 0,
    limit,
    retryAfterSeconds: failureMode === 'closed' ? 1 : 0,
    unavailable: failureMode === 'closed',
  };
}

export async function checkRateLimit(
  supabase: SupabaseLike,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const window = opts.windowSeconds ?? 60;
  const failureMode = opts.failureMode ?? 'open';

  try {
    // Contagem e registro num único RPC: `rate_limit_check` serializa as
    // chamadas do mesmo (endpoint, ip) com pg_advisory_xact_lock. Fazer
    // `select count(*)` e depois `insert` em requisições separadas deixava N
    // chamadas simultâneas lerem o mesmo total e passarem todas, furando o
    // limite por até N-1 (Devin 🔴 / Codex P2 na #438). Juntar as duas no
    // cliente não resolveria: por MVCC, o count não vê insert concorrente não
    // confirmado — a serialização tem de ser no banco.
    const { data, error } = await supabase
      .rpc('rate_limit_check', {
        _endpoint: opts.endpoint,
        _ip: opts.ip,
        _limit: opts.limit,
        _window_seconds: window,
        _user_agent: opts.userAgent ?? null,
      })
      .maybeSingle();

    if (error || !data) {
      console.warn(
        `[rate-limit] rpc error, fail-${failureMode}:`,
        error?.message ?? 'resposta vazia'
      );
      return resultadoIndisponivel(failureMode, opts.limit);
    }

    const currentCount = Number((data as { contagem: number }).contagem);
    const allowed = Boolean((data as { permitido: boolean }).permitido);

    return {
      allowed,
      count: currentCount,
      limit: opts.limit,
      retryAfterSeconds: allowed ? 0 : window,
    };
  } catch (err) {
    console.warn(`[rate-limit] fail-${failureMode} on exception:`, err);
    return resultadoIndisponivel(failureMode, opts.limit);
  }
}

export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      limit: result.limit,
      retry_after: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
      },
    }
  );
}
