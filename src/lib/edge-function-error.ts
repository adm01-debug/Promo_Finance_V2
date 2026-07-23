/**
 * Tratamento centralizado de erros para chamadas às Edge Functions (proxies).
 *
 * Normaliza falhas de rede, autenticação (401/403) e respostas 4xx/5xx do
 * Supabase Functions em uma única classe `EdgeFunctionError` com status, code
 * e mensagem legível em PT-BR. Também expõe helpers para invocação segura
 * (`invokeEdge`) e para exibir toast padronizado (`handleEdgeError`).
 */
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/error-tracking';

export interface EdgeErrorBody {
  error?: string;
  message?: string;
  code?: string;
  reason?: string;
  details?: unknown;
}

export class EdgeFunctionError extends Error {
  readonly status: number;
  readonly code: string;
  readonly functionName: string;
  readonly body: EdgeErrorBody | null;
  readonly cause?: unknown;

  constructor(params: {
    functionName: string;
    status: number;
    code: string;
    message: string;
    body?: EdgeErrorBody | null;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'EdgeFunctionError';
    this.functionName = params.functionName;
    this.status = params.status;
    this.code = params.code;
    this.body = params.body ?? null;
    this.cause = params.cause;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
  get isServerError(): boolean {
    return this.status >= 500;
  }
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida. Verifique os dados e tente novamente.',
  401: 'Sua sessão expirou. Faça login novamente.',
  403: 'Você não tem permissão para executar esta ação.',
  404: 'Recurso não encontrado.',
  408: 'Tempo de resposta esgotado. Tente novamente.',
  409: 'Conflito ao processar a operação.',
  422: 'Dados inválidos para esta operação.',
  429: 'Muitas requisições. Aguarde alguns instantes e tente novamente.',
  500: 'Erro interno do servidor. Tente novamente em instantes.',
  502: 'Serviço temporariamente indisponível.',
  503: 'Serviço temporariamente indisponível.',
  504: 'Tempo de resposta esgotado no servidor.',
};

function friendlyMessage(status: number, body: EdgeErrorBody | null, fallback: string): string {
  const bodyMsg = body?.error || body?.message;
  if (bodyMsg && typeof bodyMsg === 'string') return bodyMsg;
  return DEFAULT_MESSAGES[status] ?? fallback;
}

async function readBody(res: Response): Promise<EdgeErrorBody | null> {
  try {
    const clone = res.clone();
    const text = await clone.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as EdgeErrorBody;
    } catch {
      return { message: text.slice(0, 500) };
    }
  } catch {
    return null;
  }
}

/**
 * Normaliza um erro proveniente de `supabase.functions.invoke` em `EdgeFunctionError`.
 */
export async function normalizeEdgeError(
  functionName: string,
  error: unknown,
  bodyFallback?: EdgeErrorBody | null,
): Promise<EdgeFunctionError> {
  // FunctionsHttpError → non-2xx do handler
  if (error instanceof FunctionsHttpError) {
    const res = (error as unknown as { context?: Response }).context;
    const status = res?.status ?? 500;
    const body = res ? await readBody(res) : bodyFallback ?? null;
    return new EdgeFunctionError({
      functionName,
      status,
      code: body?.code ?? body?.reason ?? `HTTP_${status}`,
      message: friendlyMessage(status, body, error.message),
      body,
      cause: error,
    });
  }
  if (error instanceof FunctionsRelayError) {
    return new EdgeFunctionError({
      functionName,
      status: 502,
      code: 'RELAY_ERROR',
      message: 'Falha de comunicação com o serviço. Tente novamente.',
      cause: error,
    });
  }
  if (error instanceof FunctionsFetchError) {
    return new EdgeFunctionError({
      functionName,
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Sem conexão com o servidor. Verifique sua internet.',
      cause: error,
    });
  }
  const msg = error instanceof Error ? error.message : String(error);
  return new EdgeFunctionError({
    functionName,
    status: 500,
    code: 'UNKNOWN',
    message: msg || 'Erro desconhecido ao chamar o serviço.',
    cause: error,
  });
}

interface InvokeOptions {
  /** Se true, dispara signOut automático ao receber 401. Default: true. */
  signOutOn401?: boolean;
  /** Silencia envio ao rastreador de erros para 4xx esperados. */
  silent?: boolean;
}

/**
 * Invoca uma Edge Function e normaliza erros. Também trata payloads `{ error }`
 * retornados com status 200 pelos nossos proxies.
 */
export async function invokeEdge<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
  options: InvokeOptions = {},
): Promise<T> {
  const { signOutOn401 = true, silent = false } = options;

  const { data, error } = await supabase.functions.invoke<
    { data?: T; ok?: boolean; error?: string; code?: string } | T
  >(functionName, { body });

  if (error) {
    const normalized = await normalizeEdgeError(functionName, error);
    await maybeHandleAuthFailure(normalized, signOutOn401);
    if (!silent) reportEdgeError(normalized);
    throw normalized;
  }

  // Proxies retornam { error } com status 200 em alguns fluxos.
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    const payload = data as { error?: string; code?: string };
    const normalized = new EdgeFunctionError({
      functionName,
      status: 400,
      code: payload.code ?? 'PROXY_ERROR',
      message: payload.error ?? 'Falha ao processar a operação.',
      body: payload,
    });
    if (!silent) reportEdgeError(normalized);
    throw normalized;
  }

  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

let signOutInFlight = false;
async function maybeHandleAuthFailure(err: EdgeFunctionError, enabled: boolean): Promise<void> {
  if (!enabled || !err.isAuthError || signOutInFlight) return;
  signOutInFlight = true;
  try {
    logger.warn('[edge] 401 recebido — encerrando sessão', { fn: err.functionName });
    await supabase.auth.signOut().catch(() => undefined);
    if (typeof window !== 'undefined') {
      const current = window.location.pathname + window.location.search;
      const target = `/auth?redirect=${encodeURIComponent(current)}`;
      // pequeno delay para o toast aparecer antes do redirect
      setTimeout(() => window.location.replace(target), 350);
    }
  } finally {
    // deixa a flag ativa até o navigate; reset em caso de SPA sem reload
    setTimeout(() => {
      signOutInFlight = false;
    }, 5000);
  }
}

function reportEdgeError(err: EdgeFunctionError): void {
  // 401/403/404/409/422/429 são esperados no fluxo — evita ruído no Sentry.
  const expected = [401, 403, 404, 409, 422, 429];
  if (expected.includes(err.status)) {
    logger.warn('[edge] falha esperada', {
      fn: err.functionName,
      status: err.status,
      code: err.code,
    });
    return;
  }
  captureException(err, {
    tags: { source: 'edge_function', fn: err.functionName, status: String(err.status) },
    extra: { body: err.body },
  });
}

/**
 * Exibe toast padronizado a partir de um erro (EdgeFunctionError ou Error genérico).
 * Retorna a mensagem exibida para consumo em UI/testes.
 */
export function handleEdgeError(err: unknown, titleFallback = 'Ocorreu um erro'): string {
  const edge = err instanceof EdgeFunctionError ? err : null;
  const description = edge?.message ?? (err instanceof Error ? err.message : String(err));

  if (edge?.isAuthError) {
    toast.error('Sessão expirada', { description: 'Redirecionando para o login...' });
    return description;
  }
  if (edge?.isForbidden) {
    toast.error('Acesso negado', { description });
    return description;
  }
  if (edge?.status === 429) {
    toast.warning('Muitas requisições', { description });
    return description;
  }
  if (edge?.isServerError) {
    toast.error('Serviço indisponível', { description });
    return description;
  }
  toast.error(titleFallback, { description });
  return description;
}
