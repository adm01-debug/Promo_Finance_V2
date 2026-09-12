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

function resultadoIndisponivel(
  failureMode: 'open' | 'closed',
  limit: number,
): RateLimitResult {
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
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const window = opts.windowSeconds ?? 60;
  const failureMode = opts.failureMode ?? 'open';
  const since = new Date(Date.now() - window * 1000).toISOString();

  try {
    const { count, error } = await supabase
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('endpoint', opts.endpoint)
      .eq('ip_address', opts.ip)
      .gte('created_at', since);

    if (error) {
      console.warn(`[rate-limit] query error, fail-${failureMode}:`, error.message);
      return resultadoIndisponivel(failureMode, opts.limit);
    }

    const currentCount = (count ?? 0) + 1;
    const allowed = currentCount <= opts.limit;

    // A inserção também é parte da defesa: ignorar seu erro faria um endpoint
    // em modo fechado aceitar chamadas sem conseguir contabilizá-las.
    const { error: erroRegistro } = await supabase.from('rate_limit_logs').insert({
      endpoint: opts.endpoint,
      ip_address: opts.ip,
      user_agent: opts.userAgent ?? null,
      blocked: !allowed,
      request_count: 1,
      window_start: since,
      window_end: new Date().toISOString(),
    });
    if (erroRegistro) {
      console.warn(`[rate-limit] insert error, fail-${failureMode}:`, erroRegistro.message);
      return resultadoIndisponivel(failureMode, opts.limit);
    }

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

export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>): Response {
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
    },
  );
}
