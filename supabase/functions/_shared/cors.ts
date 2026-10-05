/**
 * Cabeçalhos CORS canônicos das Edge Functions.
 *
 * Por que este arquivo existe: diversas funções importavam `corsHeaders` de
 * `npm:@supabase/supabase-js@2.49.4/cors`, um subpath que NÃO existe no pacote — o que
 * derruba a função com erro de módulo já no boot. Aqui centralizamos a lista de
 * headers permitidos, incluindo os `x-supabase-client-*` que o cliente JS envia.
 *
 * Origem permitida (allowlist): `Access-Control-Allow-Origin: *` liberava a
 * leitura das respostas para qualquer página da internet que possuísse um JWT
 * válido. A lista agora vem de `ALLOWED_ORIGINS` (env, separada por vírgula) e
 * cai por padrão no domínio de produção + portas de dev local. Como o header só
 * aceita um valor, `corsHeadersPara(req)` devolve o `Origin` da requisição
 * quando ele está na lista (echo) — é o que permite produção e `vite dev`
 * conviverem no mesmo deploy. Webhooks chamados servidor-a-servidor não
 * carregam `Origin` e não passam por CORS no navegador, então seguem valendo.
 */
const ORIGENS_PADRAO = [
  'https://app.promo-finance.com',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:3000',
];

const origensPermitidas: readonly string[] = (() => {
  const bruto = Deno.env.get('ALLOWED_ORIGINS');
  if (!bruto) return ORIGENS_PADRAO;
  const lista = bruto
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return lista.length > 0 ? lista : ORIGENS_PADRAO;
})();

/**
 * `true` se a origem está na allowlist CORS — ignorando `*` (wildcard libera
 * o header, mas não deve liberar redirects que carregam código/sessão).
 */
export function origemCorsPermitida(origin: string): boolean {
  return origensPermitidas.includes(origin);
}

const BASE_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, asaas-access-token, ' +
    'x-supabase-client-platform, x-supabase-client-platform-version, ' +
    'x-supabase-client-platform-runtime, x-supabase-client-platform-runtime-version, ' +
    'x-supabase-client-runtime, x-supabase-client-runtime-version, ' +
    'x-request-id, x-correlation-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Resolve a origem a declarar em `Access-Control-Allow-Origin`.
 * Origem da requisição presente na allowlist → echo; ausente ou fora da lista
 * → primeira origem permitida (o navegador bloqueia a resposta para origens
 * não autorizadas, que é o comportamento desejado). `*` na allowlist ecoa
 * qualquer origem — escape hatch explícito para depuração.
 *
 * Side-effect: este módulo importa `console-persist.ts`, que faz tee de
 * console.* para `edge_function_logs` — importado aqui para cobrir toda
 * function que usa o CORS canônico sem tocar nos handlers.
 */
import './console-persist.ts';
export function origemCors(origin: string | null): string {
  if (origin && (origensPermitidas.includes('*') || origensPermitidas.includes(origin))) {
    return origin;
  }
  return origensPermitidas[0];
}

/** Headers CORS resolvidos por requisição — preferir em vez de `corsHeaders`. */
export function corsHeadersPara(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origemCors(req.headers.get('origin')),
    ...BASE_HEADERS,
  };
  // Ecoa o correlation-id recebido na resposta — propagação FE→BE e fn→fn
  // sem custo por handler (o header já vem de client.ts / getRequestId).
  const requestId = req.headers.get('x-request-id');
  if (requestId) headers['x-request-id'] = requestId;
  return headers;
}

/**
 * Conjunto estático com a origem primária (produção).
 * Mantido para compatibilidade: código novo deve usar `corsHeadersPara(req)`,
 * que ecoa o Origin permitido da requisição.
 */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': origensPermitidas[0],
  ...BASE_HEADERS,
};

/** Resposta padrão para o preflight `OPTIONS`. */
export function respostaPreflight(req?: Request): Response {
  return new Response(null, { status: 204, headers: req ? corsHeadersPara(req) : corsHeaders });
}

/** Helper para respostas JSON já com CORS aplicado. */
export function jsonComCors(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...(req ? corsHeadersPara(req) : corsHeaders), 'Content-Type': 'application/json' },
  });
}
