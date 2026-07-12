// deno-lint-ignore-file no-explicit-any
// Edge Function: evaluate-delivery-alerts
// Avalia as regras de tracking em tempo real e dispara alertas multi-canal.
//
// Regras:
//   1. DRIVER_STOPPED   → active_tracking.is_stopped = true AND stopped_since <= now - threshold
//   2. ROUTE_DEVIATION  → active_tracking.is_on_route = false
//   3. LATE_DELIVERY    → order.status IN_PROGRESS/PICKED_UP e (estimated_delivery|scheduled_at) + threshold < now
//
// Dispatch: para cada alerta criado, consulta alert_configurations do type
// e envia para os canais habilitados (inapp, email, whatsapp, slack, sms,
// bitrix24_task, n8n_webhook). Cada envio gera uma linha em alerts_sent.
//
// Deduplicação: usa min_interval_seconds do config para não repetir por pedido.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type AlertType = "DRIVER_STOPPED" | "ROUTE_DEVIATION" | "LATE_DELIVERY";
type Severity = "INFO" | "WARNING" | "CRITICAL";

interface AlertConfig {
  id: string;
  alert_type: AlertType;
  channel: string;
  is_enabled: boolean;
  name: string | null;
  message_template: string | null;
  min_interval_seconds: number;
  config: Record<string, any>;
  notify_email: boolean;
  email_addresses: string[] | null;
  notify_whatsapp: boolean;
  whatsapp_numbers: string[] | null;
  notify_slack: boolean;
  slack_channels: string[] | null;
  notify_sms: boolean;
  sms_numbers: string[] | null;
  notify_bitrix24_task: boolean;
  bitrix24_user_ids: number[] | null;
  notify_n8n_webhook: boolean;
  n8n_webhook_url: string | null;
}

interface PendingAlert {
  type: AlertType;
  severity: Severity;
  title: string;
  message: string;
  order_id: string;
  driver_id: string;
  metadata: Record<string, any>;
}

function render(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.floor((a.getTime() - b.getTime()) / 60000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const runStart = Date.now();
  const stats = { evaluated: 0, created: 0, deduped: 0, dispatched: 0, errors: 0 };

  try {
    // 1. Carrega configs habilitadas indexadas por type
    const { data: configs, error: cfgErr } = await supabase
      .from("alert_configurations")
      .select("*")
      .eq("is_enabled", true);
    if (cfgErr) throw cfgErr;

    const configsByType = new Map<AlertType, AlertConfig[]>();
    for (const c of (configs || []) as AlertConfig[]) {
      if (!configsByType.has(c.alert_type)) configsByType.set(c.alert_type, []);
      configsByType.get(c.alert_type)!.push(c);
    }

    // Thresholds (usa primeiro config do type; fallback razoável)
    const threshold = (type: AlertType, key: string, fallback: number): number => {
      const list = configsByType.get(type) || [];
      for (const c of list) {
        const v = c.config?.[key];
        if (typeof v === "number") return v;
      }
      return fallback;
    };

    const stoppedThreshold = threshold("DRIVER_STOPPED", "stopped_minutes_threshold", 15);
    const lateThreshold = threshold("LATE_DELIVERY", "delay_minutes_threshold", 10);

    // 2. Carrega tracking ativo + pedido + motorista
    const { data: tracking, error: trErr } = await supabase
      .from("active_tracking")
      .select(`
        id, order_id, driver_id, is_on_route, is_stopped, stopped_since, eta_minutes, last_updated,
        lalamove_orders:order_id ( id, lalamove_id, internal_order_id, status, customer_name, scheduled_at, estimated_delivery ),
        drivers:driver_id ( id, name, phone )
      `)
      .eq("tracking_status", "ACTIVE");
    if (trErr) throw trErr;

    stats.evaluated = tracking?.length || 0;
    const now = new Date();
    const pending: PendingAlert[] = [];

    for (const t of tracking || []) {
      const order = (t as any).lalamove_orders;
      const driver = (t as any).drivers;
      if (!order || !driver) continue;

      const orderRef = order.internal_order_id || order.lalamove_id || order.id;
      const driverName = driver.full_name || "motorista";

      // RULE 1: DRIVER_STOPPED
      if ((t as any).is_stopped && (t as any).stopped_since) {
        const stoppedMin = minutesBetween(now, new Date((t as any).stopped_since));
        if (stoppedMin >= stoppedThreshold) {
          pending.push({
            type: "DRIVER_STOPPED",
            severity: "WARNING",
            title: `Motorista parado há ${stoppedMin} min`,
            message: `${driverName} parado há ${stoppedMin} min no pedido ${orderRef}.`,
            order_id: order.id,
            driver_id: driver.id,
            metadata: { stopped_minutes: stoppedMin, threshold: stoppedThreshold, order_ref: orderRef, driver_name: driverName },
          });
        }
      }

      // RULE 2: ROUTE_DEVIATION
      if ((t as any).is_on_route === false) {
        pending.push({
          type: "ROUTE_DEVIATION",
          severity: "WARNING",
          title: `Desvio de rota — ${orderRef}`,
          message: `Motorista ${driverName} fora da rota planejada no pedido ${orderRef}.`,
          order_id: order.id,
          driver_id: driver.id,
          metadata: { order_ref: orderRef, driver_name: driverName },
        });
      }

      // RULE 3: LATE_DELIVERY (só para status em curso)
      const activeStatuses = ["ASSIGNED", "PICKED_UP", "IN_PROGRESS", "IN_TRANSIT"];
      if (activeStatuses.includes(order.status)) {
        const deadline = order.estimated_delivery ? new Date(order.estimated_delivery) : new Date(order.scheduled_at);
        const delayMin = minutesBetween(now, deadline);
        if (delayMin >= lateThreshold) {
          pending.push({
            type: "LATE_DELIVERY",
            severity: "CRITICAL",
            title: `Entrega atrasada — ${orderRef}`,
            message: `Pedido ${orderRef} atrasado em ${delayMin} min. Cliente: ${order.customer_name}.`,
            order_id: order.id,
            driver_id: driver.id,
            metadata: { delay_minutes: delayMin, threshold: lateThreshold, order_ref: orderRef, customer_name: order.customer_name },
          });
        }
      }
    }

    // 3. Deduplicação por (type, order_id) via min_interval_seconds
    for (const p of pending) {
      const list = configsByType.get(p.type) || [];
      const interval = Math.max(...list.map((c) => c.min_interval_seconds || 300), 60);
      const cutoff = new Date(Date.now() - interval * 1000).toISOString();

      const { data: recent } = await supabase
        .from("alerts")
        .select("id")
        .eq("type", p.type)
        .eq("order_id", p.order_id)
        .gte("created_at", cutoff)
        .limit(1);

      if (recent && recent.length > 0) {
        stats.deduped++;
        continue;
      }

      // Insere alerta
      const { data: inserted, error: insErr } = await supabase
        .from("alerts")
        .insert({
          type: p.type,
          severity: p.severity,
          title: p.title,
          message: p.message,
          order_id: p.order_id,
          driver_id: p.driver_id,
          metadata: p.metadata,
        })
        .select("id")
        .single();

      if (insErr || !inserted) {
        console.error("[alerts] insert failed", insErr);
        stats.errors++;
        continue;
      }
      stats.created++;

      // 4. Dispatch multi-canal
      const dispatched = await dispatch(supabase, inserted.id, p, list);
      stats.dispatched += dispatched;
    }

    return new Response(
      JSON.stringify({ success: true, stats, duration_ms: Date.now() - runStart }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[evaluate-delivery-alerts] fatal", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

// -------- Dispatcher --------

async function dispatch(
  supabase: any,
  alertId: string,
  p: PendingAlert,
  configs: AlertConfig[],
): Promise<number> {
  let count = 0;
  for (const cfg of configs) {
    // "inapp" é apenas registro em alerts (já feito). Não gera alerts_sent extra.
    if (cfg.channel === "inapp") continue;

    const tasks: Array<{ channel: string; recipient: string; fn: () => Promise<void> }> = [];

    if (cfg.notify_email && cfg.email_addresses?.length) {
      for (const to of cfg.email_addresses) {
        tasks.push({ channel: "email", recipient: to, fn: () => sendEmail(supabase, to, p) });
      }
    }
    if (cfg.notify_whatsapp && cfg.whatsapp_numbers?.length) {
      for (const to of cfg.whatsapp_numbers) {
        tasks.push({ channel: "whatsapp", recipient: to, fn: () => sendWhatsapp(to, p) });
      }
    }
    if (cfg.notify_slack && cfg.slack_channels?.length) {
      for (const ch of cfg.slack_channels) {
        tasks.push({ channel: "slack", recipient: ch, fn: () => sendSlack(ch, p) });
      }
    }
    if (cfg.notify_sms && cfg.sms_numbers?.length) {
      for (const to of cfg.sms_numbers) {
        tasks.push({ channel: "sms", recipient: to, fn: () => sendSms(to, p) });
      }
    }
    if (cfg.notify_bitrix24_task && cfg.bitrix24_user_ids?.length) {
      for (const uid of cfg.bitrix24_user_ids) {
        tasks.push({ channel: "bitrix24_task", recipient: String(uid), fn: () => sendBitrix24(uid, p) });
      }
    }
    if (cfg.notify_n8n_webhook && cfg.n8n_webhook_url) {
      tasks.push({ channel: "n8n_webhook", recipient: cfg.n8n_webhook_url, fn: () => sendN8n(cfg.n8n_webhook_url!, p) });
    }

    for (const t of tasks) {
      const row = {
        alert_id: alertId,
        channel: t.channel,
        recipient: t.recipient,
        status: "pending" as string,
        error_message: null as string | null,
        sent_at: null as string | null,
      };
      try {
        await t.fn();
        row.status = "sent";
        row.sent_at = new Date().toISOString();
        count++;
      } catch (err) {
        row.status = "failed";
        row.error_message = (err as Error).message.slice(0, 500);
        console.error(`[dispatch] ${t.channel} → ${t.recipient} failed:`, err);
      }
      await supabase.from("alerts_sent").insert(row);
    }
  }
  return count;
}

// -------- Canais --------

async function sendEmail(supabase: any, to: string, p: PendingAlert): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY not configured");

  const subject = `[${p.severity}] ${p.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:${p.severity === "CRITICAL" ? "#dc2626" : "#f59e0b"}">${p.title}</h2>
      <p>${p.message}</p>
      <pre style="background:#f3f4f6;padding:12px;border-radius:6px;font-size:12px">${JSON.stringify(p.metadata, null, 2)}</pre>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("ALERTS_EMAIL_FROM") || "alerts@lovable.app",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function sendWhatsapp(to: string, p: PendingAlert): Promise<void> {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = Deno.env.get("EVOLUTION_INSTANCE");
  if (!url || !key || !instance) throw new Error("Evolution API not configured");

  const res = await fetch(`${url}/message/sendText/${instance}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ number: to, text: `*${p.title}*\n${p.message}` }),
  });
  if (!res.ok) throw new Error(`Evolution ${res.status}: ${await res.text()}`);
}

async function sendSlack(channel: string, p: PendingAlert): Promise<void> {
  const webhook = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhook) throw new Error("SLACK_WEBHOOK_URL not configured");
  const color = p.severity === "CRITICAL" ? "#dc2626" : p.severity === "WARNING" ? "#f59e0b" : "#3b82f6";
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel,
      attachments: [{ color, title: p.title, text: p.message, fields: Object.entries(p.metadata).map(([k, v]) => ({ title: k, value: String(v), short: true })) }],
    }),
  });
  if (!res.ok) throw new Error(`Slack ${res.status}: ${await res.text()}`);
}

async function sendSms(to: string, p: PendingAlert): Promise<void> {
  const url = Deno.env.get("SMS_WEBHOOK_URL");
  if (!url) throw new Error("SMS_WEBHOOK_URL not configured");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, message: `${p.title} — ${p.message}` }),
  });
  if (!res.ok) throw new Error(`SMS ${res.status}: ${await res.text()}`);
}

async function sendBitrix24(userId: number, p: PendingAlert): Promise<void> {
  const webhook = Deno.env.get("BITRIX24_WEBHOOK_URL");
  if (!webhook) throw new Error("BITRIX24_WEBHOOK_URL not configured");
  const res = await fetch(`${webhook}/tasks.task.add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        TITLE: `[Alerta] ${p.title}`,
        DESCRIPTION: `${p.message}\n\n${JSON.stringify(p.metadata, null, 2)}`,
        RESPONSIBLE_ID: userId,
        PRIORITY: p.severity === "CRITICAL" ? 2 : 1,
      },
    }),
  });
  if (!res.ok) throw new Error(`Bitrix24 ${res.status}: ${await res.text()}`);
}

async function sendN8n(webhookUrl: string, p: PendingAlert): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: p.type,
      severity: p.severity,
      title: p.title,
      message: p.message,
      order_id: p.order_id,
      driver_id: p.driver_id,
      metadata: p.metadata,
      timestamp: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`n8n ${res.status}: ${await res.text()}`);
}
