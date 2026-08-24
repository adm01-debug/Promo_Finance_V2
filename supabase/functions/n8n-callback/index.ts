// n8n-callback — recebe callbacks do n8n para materializar ações no banco.
// Ações suportadas:
//  - create_task            → insere em bitrix24_activities (subject, activity_type='task')
//  - update_driver_approval → atualiza driver_approval_queue (status, decision_notes, reviewed_at)
//  - create_alert           → insere em alerts (type, severity, title, message, metadata)
//  - log                    → registra em audit_logs (action, table_name, new_data)
// Autenticação obrigatória via header x-n8n-secret (env N8N_CALLBACK_SECRET).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-n8n-secret, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action = "create_task" | "update_driver_approval" | "create_alert" | "log";
interface CallbackBody {
  action: Action;
  payload: Record<string, unknown>;
}

const ALLOWED_APPROVAL_STATUS = new Set(["pending", "approved", "rejected", "escalated"]);
const ALLOWED_ALERT_SEVERITY = new Set(["info", "warning", "critical", "low", "medium", "high"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const expected = Deno.env.get("N8N_CALLBACK_SECRET");
    if (!expected || req.headers.get("x-n8n-secret") !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json().catch(() => null);
    const { z } = await import('https://deno.land/x/zod@v3.22.4/mod.ts');
    const { validatePayload, createErrorResponse } = await import('../_shared/validation.ts');
    const Schema = z.object({
      action: z.enum(['create_task', 'update_driver_approval', 'create_alert', 'log']),
      payload: z.record(z.any()),
    }).passthrough();
    const parsed = validatePayload(Schema, raw ?? {}, 'n8n-callback');
    if (!parsed.success) return createErrorResponse(parsed.error, 400, parsed.details);
    const body = parsed.data as CallbackBody;
    if (!body?.action || !body?.payload || typeof body.payload !== "object") {
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
            subject: (p.subject as string) ?? (p.title as string) ?? "Task via n8n",
            order_id: (p.order_id as string) ?? null,
            deal_id: typeof p.deal_id === "number" ? (p.deal_id as number) : null,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }
      case "update_driver_approval": {
        const id = p.id as string | undefined;
        const status = p.status as string | undefined;
        if (!id || !status) throw new Error("id e status são obrigatórios");
        if (!ALLOWED_APPROVAL_STATUS.has(status)) throw new Error(`status inválido: ${status}`);
        const update: Record<string, unknown> = {
          status,
          reviewed_at: new Date().toISOString(),
        };
        if (typeof p.notes === "string") update.notes = p.notes;
        if (typeof p.decision_notes === "string") update.decision_notes = p.decision_notes;
        else if (typeof p.reason === "string") update.decision_notes = p.reason;
        if (typeof p.reviewed_by === "string") update.reviewed_by = p.reviewed_by;
        const { data, error } = await supabase
          .from("driver_approval_queue")
          .update(update)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }
      case "create_alert": {
        const severity = ((p.severity as string) ?? "warning").toLowerCase();
        if (!ALLOWED_ALERT_SEVERITY.has(severity)) throw new Error(`severity inválida: ${severity}`);
        const { data, error } = await supabase
          .from("alerts")
          .insert({
            type: (p.type as string) ?? (p.alert_type as string) ?? "n8n_generated",
            severity,
            title: (p.title as string) ?? "Alerta via n8n",
            message: (p.message as string) ?? (p.description as string) ?? "",
            order_id: (p.order_id as string) ?? null,
            driver_id: (p.driver_id as string) ?? null,
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
          .insert({
            action: (p.action as string) ?? "n8n_callback",
            table_name: (p.table_name as string) ?? "n8n",
            record_id: (p.record_id as string) ?? null,
            new_data: p,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }
      default:
        throw new Error(`ação desconhecida: ${(body as { action: string }).action}`);
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
