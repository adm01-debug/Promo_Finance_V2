/**
 * Gap #24 — Alerta proativo de erros do frontend.
 *
 * Executa periodicamente (pg_cron), detecta assinaturas de erro que ultrapassaram
 * um limiar de ocorrências dentro de uma janela e dispara notificação por e-mail
 * (Resend) e/ou Slack. A deduplicação/cooldown é garantida no banco pela RPC
 * `claim_frontend_error_alerts`, que registra o disparo na MESMA transação —
 * portanto execuções concorrentes não geram alertas duplicados.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/validation.ts";
import { exigirChamadaInterna } from "../_shared/auth-guard.ts";
import { z } from '../_shared/zod.ts';
import { createValidationErrorResponse } from '../_shared/contract-response.ts';

const BodySchema = z.object({
  windowMinutes: z.union([z.number(), z.string().trim().min(1)]).optional(),
  threshold: z.union([z.number(), z.string().trim().min(1)]).optional(),
  cooldownMinutes: z.union([z.number(), z.string().trim().min(1)]).optional(),
  limit: z.union([z.number(), z.string().trim().min(1)]).optional(),
}).strict();

interface AlertaErro {
  assinatura: string;
  exemplo_mensagem: string | null;
  severity: string;
  ocorrencias: number;
  usuarios_afetados: number;
  urls_distintas: number;
  primeira_ocorrencia: string;
  ultima_ocorrencia: string;
  is_nova: boolean;
}

interface Config {
  windowMinutes: number;
  threshold: number;
  cooldownMinutes: number;
  limit: number;
}

/** Sanitiza números vindos do corpo da requisição, com clamp defensivo. */
function num(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function montarHtml(alertas: AlertaErro[], cfg: Config): string {
  const linhas = alertas
    .map(
      (a) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;">
            ${a.is_nova ? "🆕 " : ""}${escapeHtml(a.assinatura)}
          </td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(a.severity)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:bold;">${a.ocorrencias}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${a.usuarios_afetados}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;">
      <div style="background:#dc2626;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">🚨 Pico de erros no frontend</h1>
      </div>
      <div style="padding:24px;background:#f9fafb;">
        <p style="color:#4b5563;">
          ${alertas.length} assinatura(s) ultrapassaram ${cfg.threshold} ocorrências
          nos últimos ${cfg.windowMinutes} minutos.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#e5e7eb;">
              <th style="padding:8px;text-align:left;">Assinatura</th>
              <th style="padding:8px;">Sev.</th>
              <th style="padding:8px;">Ocorr.</th>
              <th style="padding:8px;">Usuários</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
      <div style="background:#e5e7eb;padding:12px;text-align:center;color:#6b7280;font-size:12px;">
        Monitoramento automático — painel: /admin/erros-frontend
      </div>
    </div>`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // [auth-guard] Worker interno de agregacao de erros: exige service role ou x-cron-secret.
  const guard = await exigirChamadaInterna(req);
  if (!guard.ok) return guard.resposta;


  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let raw: Record<string, unknown> = {};
    try {
      raw = (await req.json()) as Record<string, unknown>;
    } catch {
      raw = {};
    }
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) return createValidationErrorResponse(parsed.error, corsHeaders);
    raw = parsed.data;

    const cfg: Config = {
      windowMinutes: num(raw.windowMinutes, 15, 1, 1440),
      threshold: num(raw.threshold, 10, 1, 100000),
      cooldownMinutes: num(raw.cooldownMinutes, 60, 0, 10080),
      limit: num(raw.limit, 20, 1, 100),
    };

    const { data, error } = await supabase.rpc("claim_frontend_error_alerts", {
      p_window_minutes: cfg.windowMinutes,
      p_threshold: cfg.threshold,
      p_cooldown_minutes: cfg.cooldownMinutes,
      p_limit: cfg.limit,
    });

    if (error) {
      console.error("Falha ao reivindicar alertas:", error.message);
      return jsonResponse({ success: false, error: "falha ao consultar alertas" }, 500);
    }

    const alertas = (data ?? []) as AlertaErro[];
    if (alertas.length === 0) {
      return jsonResponse({ success: true, alertas: 0, message: "nenhum pico detectado" });
    }

    // Destinatários: administradores com e-mail cadastrado.
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = (admins ?? []).map((a: { user_id: string }) => a.user_id);
    let destinatarios: string[] = [];
    if (adminIds.length > 0) {
      const { data: perfis } = await supabase
        .from("profiles")
        .select("email")
        .in("user_id", adminIds)
        .not("email", "is", null);
      destinatarios = (perfis ?? [])
        .map((p: { email: string | null }) => p.email)
        .filter((e): e is string => typeof e === "string" && e.includes("@"));
    }

    const canais: Record<string, string> = {};

    // Slack (opcional)
    const slackUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    if (slackUrl) {
      try {
        const texto = alertas
          .map((a) => `• [${a.severity}] ${a.ocorrencias}x — ${a.assinatura}`)
          .join("\n");
        const resp = await fetch(slackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚨 Pico de erros no frontend (janela ${cfg.windowMinutes}min)\n${texto}`,
          }),
        });
        canais.slack = resp.ok ? "enviado" : `falha_${resp.status}`;
      } catch (e) {
        canais.slack = "falha";
        console.error("Slack:", e instanceof Error ? e.message : String(e));
      }
    } else {
      canais.slack = "nao_configurado";
    }

    // E-mail (Resend)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && destinatarios.length > 0) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Monitoramento <onboarding@resend.dev>",
            to: destinatarios,
            subject: `🚨 ${alertas.length} pico(s) de erro no frontend`,
            html: montarHtml(alertas, cfg),
          }),
        });
        canais.email = resp.ok ? "enviado" : `falha_${resp.status}`;
        if (!resp.ok) console.error("Resend:", await resp.text());
      } catch (e) {
        canais.email = "falha";
        console.error("Resend:", e instanceof Error ? e.message : String(e));
      }
    } else {
      canais.email = resendKey ? "sem_destinatarios" : "nao_configurado";
    }

    return jsonResponse({
      success: true,
      alertas: alertas.length,
      novas: alertas.filter((a) => a.is_nova).length,
      canais,
      config: cfg,
    });
  } catch (e) {
    console.error("Erro inesperado:", e instanceof Error ? e.message : String(e));
    return jsonResponse({ success: false, error: "erro interno" }, 500);
  }
});
