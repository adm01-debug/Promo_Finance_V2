// n8n-callback — recebe callbacks do n8n para materializar ações no banco:
//  action=create_task            → cria linha em bitrix24_activities (task) OR audit_logs
//  action=update_driver_approval → aprova/rejeita em driver_approval_queue
//  action=create_alert           → insere em alerts
//  action=log                    → apenas registra em audit_logs
// Autenticação via header x-n8n-secret (secret opcional N8N_CALLBACK_SECRET).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-n8n-secret, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CallbackBody {
  action: "create_task" | "update_driver_approval" | "create_alert" | "log";
  payload: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const expected = Deno.env.get("N8N_CALLBACK_SECRET");
    if (expected) {
      const sent = req.headers.get("x-n8n-secret");
      if (sent !== expected) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = (await req.json()) as CallbackBody;
    if (!body.action || !body.payload) {
      return new Response(JSON.stringify({ error: "action e payload são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const p = body.payload as Record<string, unknown>;
    let result: unknown = null;

    switch (body.action) {
      case "create_task": {
        const { data, error } = await supabase
          .from("bitrix24_activities")
          .insert({
            activity_type: "task",
            title: (p.title as string) ?? "Task via n8n",
            description: (p.description as string) ?? null,
            metadata: p,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }
      case "update_driver_approval": {
        const id = p.id as string;
        const status = p.status as string;
        if (!id || !status) throw new Error("id e status são obrigatórios");
        const { data, error } = await supabase
          .from("driver_approval_queue")
          .update({ status, reason: (p.reason as string) ?? null, decided_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }
      case "create_alert": {
        const { data, error } = await supabase
          .from("alerts")
          .insert({
            alert_type: (p.alert_type as string) ?? "n8n_generated",
            severity: (p.severity as string) ?? "warning",
            title: (p.title as string) ?? "Alerta via n8n",
            description: (p.description as string) ?? null,
            metadata: p,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }
      case "log": {
        const { data, error } = await supabase
          .from("audit_logs")
          .insert({ action: "n8n_callback", entity_type: "n8n", metadata: p })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }
      default:
        throw new Error(`ação desconhecida: ${body.action}`);
    }

    return new Response(JSON.stringify({ ok: true, action: body.action, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("n8n-callback error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
