// Edge Function proxy autenticado para RPCs de conciliação (SECURITY DEFINER).
// Frontend não chama mais RPCs diretamente: valida JWT e usa service_role.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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
  admin: Pick<SupabaseClient, "rpc">;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function createHandler(deps: HandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json(405, { error: "Method not allowed" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const { userId } = await deps.verifyJwt(authHeader.replace("Bearer ", ""));
    if (!userId) return json(401, { error: "Unauthorized" });

    let payload: Action;
    try {
      payload = (await req.json()) as Action;
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    if (!isUuid((payload as { transacaoId?: unknown }).transacaoId)) {
      return json(400, { error: "transacaoId inválido" });
    }

    try {
      if (payload.action === "confirmar") {
        if (payload.contaPagarId != null && !isUuid(payload.contaPagarId)) {
          return json(400, { error: "contaPagarId inválido" });
        }
        if (payload.contaReceberId != null && !isUuid(payload.contaReceberId)) {
          return json(400, { error: "contaReceberId inválido" });
        }
        const ajuste = Number.isFinite(payload.ajusteCentavos) ? Number(payload.ajusteCentavos) : 0;
        const { error } = await deps.admin.rpc("confirmar_conciliacao_manual", {
          p_transacao_id: payload.transacaoId,
          p_conta_pagar_id: payload.contaPagarId ?? null,
          p_conta_receber_id: payload.contaReceberId ?? null,
          p_ajuste_centavos: ajuste,
        });
        if (error) throw error;
        return json(200, { ok: true });
      }
      if (payload.action === "desfazer") {
        const { error } = await deps.admin.rpc("desfazer_conciliacao_manual", {
          p_transacao_id: payload.transacaoId,
        });
        if (error) throw error;
        return json(200, { ok: true });
      }
      return json(400, { error: "Ação desconhecida" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return json(400, { error: msg });
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
