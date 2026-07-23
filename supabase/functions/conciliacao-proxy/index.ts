// Edge Function proxy autenticado para RPCs de conciliação (SECURITY DEFINER).
// Frontend não chama mais RPCs diretamente: valida JWT e usa service_role.
// Auditoria: logs estruturados + persistência em audit_logs por chamada.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  auditedRpc,
  beginAudit,
  finalizeAudit,
  withCorrelation,
} from "../_shared/proxy-audit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-request-id",
};

type Action =
  | {
      action: "confirmar";
      transacaoId: string;
      contaPagarId?: string | null;
      contaReceberId?: string | null;
      ajusteCentavos?: number | null;
    }
  | { action: "desfazer"; transacaoId: string };

export interface HandlerDeps {
  verifyJwt: (token: string) => Promise<{ userId: string | null }>;
  admin: Pick<SupabaseClient, "rpc" | "from">;
}

function isUuid(s: unknown): s is string {
  return typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function createHandler(deps: HandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const ctx = beginAudit("conciliacao-proxy", req);
    const json = (status: number, body: unknown, extra: Record<string, unknown> = {}) => {
      finalizeAudit(ctx, status, extra);
      return new Response(JSON.stringify(body), {
        status,
        headers: withCorrelation(ctx, { ...corsHeaders, "Content-Type": "application/json" }),
      });
    };

    if (req.method !== "POST") return json(405, { error: "Method not allowed" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      ctx.logger.warn("missing bearer token");
      return json(401, { error: "Unauthorized" }, { reason: "missing_token" });
    }

    const { userId } = await deps.verifyJwt(authHeader.replace("Bearer ", ""));
    if (!userId) {
      ctx.logger.warn("invalid jwt");
      return json(401, { error: "Unauthorized" }, { reason: "invalid_jwt" });
    }
    ctx.userId = userId;

    let payload: Action;
    try {
      payload = (await req.json()) as Action;
    } catch {
      return json(400, { error: "Invalid JSON" }, { reason: "invalid_json" });
    }

    if (!isUuid((payload as { transacaoId?: unknown }).transacaoId)) {
      return json(400, { error: "transacaoId inválido" }, { reason: "invalid_transacao_id" });
    }

    try {
      if (payload.action === "confirmar") {
        if (payload.contaPagarId != null && !isUuid(payload.contaPagarId)) {
          return json(400, { error: "contaPagarId inválido" }, { reason: "invalid_conta_pagar_id" });
        }
        if (payload.contaReceberId != null && !isUuid(payload.contaReceberId)) {
          return json(400, { error: "contaReceberId inválido" }, { reason: "invalid_conta_receber_id" });
        }
        const ajuste = Number.isFinite(payload.ajusteCentavos) ? Number(payload.ajusteCentavos) : 0;
        await auditedRpc(ctx, deps.admin, "confirmar_conciliacao_manual", {
          p_transacao_id: payload.transacaoId,
          p_conta_pagar_id: payload.contaPagarId ?? null,
          p_conta_receber_id: payload.contaReceberId ?? null,
          p_ajuste_centavos: ajuste,
        }, "confirmar");
        return json(200, { ok: true }, { action: "confirmar" });
      }
      if (payload.action === "desfazer") {
        await auditedRpc(ctx, deps.admin, "desfazer_conciliacao_manual", {
          p_transacao_id: payload.transacaoId,
        }, "desfazer");
        return json(200, { ok: true }, { action: "desfazer" });
      }
      return json(400, { error: "Ação desconhecida" }, { reason: "unknown_action" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return json(400, { error: msg }, { reason: "rpc_error" });
    }
  };
}

function defaultDeps(): HandlerDeps {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  return {
    verifyJwt: async (token: string) => {
      const { data, error } = await anon.auth.getClaims(token);
      if (error || !data?.claims?.sub) return { userId: null };
      return { userId: data.claims.sub as string };
    },
    admin,
  };
}

if (!Deno.env.get("DENO_TESTING")) {
  Deno.serve(createHandler(defaultDeps()));
}
