// Edge Function proxy autenticado para RPCs nfe_* (SECURITY DEFINER).
// Frontend não chama mais RPCs diretamente: valida JWT e usa service_role.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform" };

type Action =
  | { action: "suggest"; nfeId: string }
  | { action: "link"; nfeId: string; contaPagarId: string }
  | { action: "unlink"; nfeId: string }
  | { action: "create_from_nfe"; nfeId: string; dataVencimento?: string | null; categoriaId?: string | null };

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

    if (!isUuid((payload as { nfeId?: unknown }).nfeId)) {
      return json(400, { error: "nfeId inválido" });
    }

    try {
      switch (payload.action) {
        case "suggest": {
          const { data, error } = await deps.admin.rpc("nfe_suggest_contas_pagar", { p_nfe_id: payload.nfeId });
          if (error) throw error;
          return json(200, { data });
        }
        case "link": {
          if (!isUuid(payload.contaPagarId)) return json(400, { error: "contaPagarId inválido" });
          const { data, error } = await deps.admin.rpc("nfe_link_conta_pagar", {
            p_nfe_id: payload.nfeId,
            p_conta_pagar_id: payload.contaPagarId,
          });
          if (error) throw error;
          return json(200, { data });
        }
        case "unlink": {
          const { data, error } = await deps.admin.rpc("nfe_unlink_conta_pagar", { p_nfe_id: payload.nfeId });
          if (error) throw error;
          return json(200, { data });
        }
        case "create_from_nfe": {
          const { data, error } = await deps.admin.rpc("nfe_create_conta_pagar_from_nfe", {
            p_nfe_id: payload.nfeId,
            p_data_vencimento: payload.dataVencimento ?? null,
            p_categoria_id: payload.categoriaId ?? null,
          });
          if (error) throw error;
          return json(200, { data });
        }
        default:
          return json(400, { error: "Ação desconhecida" });
      }
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

// Só inicia o servidor fora do contexto de teste.
if (!Deno.env.get("DENO_TESTING")) {
  Deno.serve(createHandler(defaultDeps()));
}
