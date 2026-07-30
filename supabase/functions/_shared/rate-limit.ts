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
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(
  supabase: SupabaseLike,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const window = opts.windowSeconds ?? 60;
  const since = new Date(Date.now() - window * 1000).toISOString();

  try {
    const { count, error } = await supabase
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('endpoint', opts.endpoint)
      .eq('ip_address', opts.ip)
      .gte('created_at', since);

    if (error) {
      console.warn('[rate-limit] query error, fail-open:', error.message);
      return { allowed: true, count: 0, limit: opts.limit, retryAfterSeconds: 0 };
    }

    const currentCount = (count ?? 0) + 1;
    const allowed = currentCount <= opts.limit;

    // Registra a requisição atual (fire-and-forget, mas awaited para consistência)
    await supabase.from('rate_limit_logs').insert({
      endpoint: opts.endpoint,
      ip_address: opts.ip,
      user_agent: opts.userAgent ?? null,
      blocked: !allowed,
      request_count: 1,
      window_start: since,
      window_end: new Date().toISOString(),
    });

    return {
      allowed,
      count: currentCount,
      limit: opts.limit,
      retryAfterSeconds: allowed ? 0 : window,
    };
  } catch (err) {
    console.warn('[rate-limit] fail-open on exception:', err);
    return { allowed: true, count: 0, limit: opts.limit, retryAfterSeconds: 0 };
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
