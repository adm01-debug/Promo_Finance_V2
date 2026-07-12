// Envia notificação (Slack e/ou e-mail via Resend) para alertas críticos de performance.
// Chamado pelo trigger DB `performance_alerts_notify_trigger` via pg_net após INSERT crítico.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertPayload {
  id?: string;
  source?: string;
  alert_key?: string;
  severity?: string;
  reason?: string | null;
  current_value?: number | null;
  baseline_value?: number | null;
  ratio?: number | null;
  sample_count?: number | null;
  query_snippet?: string | null;
  created_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as { alert?: AlertPayload } | AlertPayload;
    const alert: AlertPayload = (body as { alert?: AlertPayload })?.alert ?? (body as AlertPayload);

    if (!alert || !alert.severity) {
      return new Response(JSON.stringify({ error: "payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Só notifica crítico/warning
    if (alert.severity !== "critical" && alert.severity !== "warning") {
      return new Response(JSON.stringify({ ok: true, skipped: "severity" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slackUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const emailTo = Deno.env.get("ALERTS_EMAIL_TO");
    const emailFrom = Deno.env.get("ALERTS_EMAIL_FROM") ?? "alerts@resend.dev";

    const emoji = alert.severity === "critical" ? "🚨" : "⚠️";
    const title = `${emoji} Regressão de performance (${alert.severity})`;
    const ratioTxt = alert.ratio != null ? `${Number(alert.ratio).toFixed(2)}x` : "—";
    const curTxt = alert.current_value != null ? `${Math.round(alert.current_value)}ms` : "—";
    const baseTxt = alert.baseline_value != null ? `${Math.round(alert.baseline_value)}ms` : "—";
    const summary = alert.reason || alert.alert_key || "Regressão detectada";

    const results: Record<string, unknown> = {};

    // Slack
    if (slackUrl) {
      const slackRes = await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${title}\n*${summary}*\n• Atual: ${curTxt} • Baseline: ${baseTxt} • Ratio: ${ratioTxt}\n• Origem: ${alert.source ?? "—"} • Amostras: ${alert.sample_count ?? "—"}${alert.query_snippet ? `\n\`\`\`${alert.query_snippet.slice(0, 400)}\`\`\`` : ""}`,
        }),
      });
      results.slack = { status: slackRes.status, ok: slackRes.ok };
    }

    // E-mail via Resend
    if (resendKey && emailTo) {
      const html = `
        <h2 style="font-family:system-ui;color:${alert.severity === "critical" ? "#dc2626" : "#d97706"}">${title}</h2>
        <p style="font-family:system-ui;font-size:15px"><strong>${summary}</strong></p>
        <table style="font-family:system-ui;font-size:13px;border-collapse:collapse">
          <tr><td style="padding:4px 8px;color:#666">Valor atual</td><td style="padding:4px 8px"><strong>${curTxt}</strong></td></tr>
          <tr><td style="padding:4px 8px;color:#666">Baseline</td><td style="padding:4px 8px">${baseTxt}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Ratio</td><td style="padding:4px 8px"><strong>${ratioTxt}</strong></td></tr>
          <tr><td style="padding:4px 8px;color:#666">Origem</td><td style="padding:4px 8px">${alert.source ?? "—"}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Amostras</td><td style="padding:4px 8px">${alert.sample_count ?? "—"}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Detectado em</td><td style="padding:4px 8px">${alert.created_at ?? new Date().toISOString()}</td></tr>
        </table>
        ${alert.query_snippet ? `<pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;overflow:auto">${alert.query_snippet.replace(/</g, "&lt;")}</pre>` : ""}
        <p style="font-family:system-ui;font-size:12px;color:#666;margin-top:16px">Acesse o painel em <em>/admin/telemetria</em> para investigar.</p>
      `;
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: emailTo.split(",").map((s) => s.trim()).filter(Boolean),
          subject: `${title}: ${summary.slice(0, 80)}`,
          html,
        }),
      });
      results.email = { status: resendRes.status, ok: resendRes.ok };
    }

    // Registra tentativa em query_telemetry (usando service role)
    try {
      const supaUrl = Deno.env.get("SUPABASE_URL");
      const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supaUrl && supaKey) {
        const supa = createClient(supaUrl, supaKey);
        await supa.from("query_telemetry").insert({
          source: "performance_alert_notifier",
          severity: "info",
          message: `Alerta ${alert.severity} notificado`,
          metadata: { alert_id: alert.id, channels: results },
        });
      }
    } catch (_) {
      // não bloqueia resposta
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
