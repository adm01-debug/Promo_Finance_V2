// Edge Function proxy autenticado para RPCs nfe_* (SECURITY DEFINER).
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
  | { action: "suggest"; nfeId: string }
  | { action: "link"; nfeId: string; contaPagarId: string }
  | { action: "unlink"; nfeId: string }
  | {
      action: "create_from_nfe";
      nfeId: string;
      dataVencimento?: string | null;
      categoriaId?: string | null;
    };

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

    const ctx = beginAudit("nfe-vinculo-proxy", req);
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

    if (!isUuid((payload as { nfeId?: unknown }).nfeId)) {
      return json(400, { error: "nfeId inválido" }, { reason: "invalid_nfe_id" });
    }

    try {
      switch (payload.action) {
        case "suggest": {
          const data = await auditedRpc(ctx, deps.admin, "nfe_suggest_contas_pagar", {
            p_nfe_id: payload.nfeId,
          }, "suggest");
          return json(200, { data }, { action: "suggest" });
        }
        case "link": {
          if (!isUuid(payload.contaPagarId)) {
            return json(400, { error: "contaPagarId inválido" }, { reason: "invalid_conta_pagar_id" });
          }
          const data = await auditedRpc(ctx, deps.admin, "nfe_link_conta_pagar", {
            p_nfe_id: payload.nfeId,
            p_conta_pagar_id: payload.contaPagarId,
          }, "link");
          return json(200, { data }, { action: "link" });
        }
        case "unlink": {
          const data = await auditedRpc(ctx, deps.admin, "nfe_unlink_conta_pagar", {
            p_nfe_id: payload.nfeId,
          }, "unlink");
          return json(200, { data }, { action: "unlink" });
        }
        case "create_from_nfe": {
          const data = await auditedRpc(ctx, deps.admin, "nfe_create_conta_pagar_from_nfe", {
            p_nfe_id: payload.nfeId,
            p_data_vencimento: payload.dataVencimento ?? null,
            p_categoria_id: payload.categoriaId ?? null,
          }, "create_from_nfe");
          return json(200, { data }, { action: "create_from_nfe" });
        }
        default:
          return json(400, { error: "Ação desconhecida" }, { reason: "unknown_action" });
      }
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
