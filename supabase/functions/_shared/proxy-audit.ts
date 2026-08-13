// Auditoria compartilhada para Edge Function proxies.
// Fornece logging estruturado + persistência opcional em audit_logs
// com request_id, usuário autenticado, RPC alvo, duração e resultado.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.4";
import { createLogger, Logger } from "./logger.ts";
import { CORRELATION_HEADER, correlationResponseHeaders, getRequestId } from "./correlation.ts";

export interface AuditContext {
  requestId: string;
  functionName: string;
  logger: Logger;
  userId: string | null;
  startedAt: number;
}

export function beginAudit(functionName: string, req: Request): AuditContext {
  const requestId = getRequestId(req);
  const logger = createLogger(functionName, requestId);
  logger.info("request received", {
    method: req.method,
    url: new URL(req.url).pathname,
  });
  return { requestId, functionName, logger, userId: null, startedAt: Date.now() };
}

export function withCorrelation(
  ctx: AuditContext,
  headers: HeadersInit = {},
): HeadersInit {
  return { ...headers, ...correlationResponseHeaders(ctx.requestId) };
}

/** Persiste um evento na tabela `audit_logs` (best-effort — nunca lança). */
async function persistAudit(
  admin: Pick<SupabaseClient, "from">,
  ctx: AuditContext,
  entry: {
    action: string;
    resource: string;
    status: "success" | "error" | "denied";
    details: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await admin.from("audit_logs").insert({
      user_id: ctx.userId,
      action: `edge.${ctx.functionName}.${entry.action}`,
      resource_type: entry.resource,
      metadata: {
        request_id: ctx.requestId,
        status: entry.status,
        duration_ms: Date.now() - ctx.startedAt,
        ...entry.details,
      },
    });
  } catch (e) {
    ctx.logger.warn("failed to persist audit log", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * Executa uma RPC via service_role registrando início, sucesso ou falha
 * em log estruturado e em `audit_logs`. Encaminha a exceção original.
 */
export async function auditedRpc<T = unknown>(
  ctx: AuditContext,
  admin: Pick<SupabaseClient, "rpc" | "from">,
  rpc: string,
  params: Record<string, unknown>,
  action = rpc,
): Promise<T> {
  const startedAt = Date.now();
  ctx.logger.info("rpc call start", { rpc, action, user_id: ctx.userId });
  const { data, error } = await admin.rpc(rpc, params);
  const duration_ms = Date.now() - startedAt;

  if (error) {
    ctx.logger.error("rpc call failed", {
      rpc,
      action,
      user_id: ctx.userId,
      duration_ms,
      code: error.code,
      message: error.message,
    });
    await persistAudit(admin, ctx, {
      action,
      resource: rpc,
      status: "error",
      details: { params, error: { code: error.code, message: error.message } },
    });
    throw error;
  }

  ctx.logger.info("rpc call success", { rpc, action, user_id: ctx.userId, duration_ms });
  await persistAudit(admin, ctx, {
    action,
    resource: rpc,
    status: "success",
    details: { params },
  });
  return data as T;
}

/** Log final da requisição — chame antes de retornar a resposta. */
export function finalizeAudit(
  ctx: AuditContext,
  status: number,
  extra: Record<string, unknown> = {},
): void {
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  const payload = {
    status,
    duration_ms: Date.now() - ctx.startedAt,
    user_id: ctx.userId,
    ...extra,
  };
  if (level === "error") ctx.logger.error("request finalized", payload);
  else if (level === "warn") ctx.logger.warn("request finalized", payload);
  else ctx.logger.info("request finalized", payload);
}

export { CORRELATION_HEADER };
