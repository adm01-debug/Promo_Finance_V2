/**
 * Gap #28 — Digest semanal de silenciamentos de alerta prestes a expirar.
 *
 * Um silenciamento criado no Gap #26 expira em silêncio: o alerta volta a
 * disparar sem aviso e o time trata como incidente novo. Esta função roda
 * semanalmente (pg_cron), reivindica via `claim_silenciamentos_digest` a lista
 * de assinaturas cujo prazo vence (ou venceu) dentro da janela e notifica os
 * administradores por e-mail (Resend) e/ou Slack.
 *
 * Idempotência: a RPC grava a trilha do digest na MESMA transação em que
 * devolve as linhas e serializa execuções concorrentes com LOCK — dois
 * disparos simultâneos do cron produzem no máximo um envio.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/validation.ts";
import { exigirChamadaInterna } from "../_shared/auth-guard.ts";

interface ItemDigest {
  assinatura: string;
  severity: string;
  exemplo_mensagem: string | null;
  silenciado_ate: string;
  horas_restantes: number;
  ja_expirou: boolean;
  alertas_enviados: number;
}

/** Sanitiza números do corpo da requisição com clamp defensivo. */
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

function prazo(item: ItemDigest): string {
  if (item.ja_expirou) {
    return `expirou há ${Math.abs(item.horas_restantes).toFixed(0)}h`;
  }
  return `expira em ${item.horas_restantes.toFixed(0)}h`;
}

function montarHtml(itens: ItemDigest[], janelaHoras: number): string {
  const linhas = itens
    .map(
      (i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;">
            ${i.ja_expirou ? "⏰ " : "⏳ "}${escapeHtml(i.assinatura)}
          </td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(i.severity)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(prazo(i))}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.alertas_enviados}x</td>
        </tr>`,
    )
    .join("");

  const expirados = itens.filter((i) => i.ja_expirou).length;

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;">
      <div style="background:#0f172a;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">🔕 Silenciamentos de alerta</h1>
      </div>
      <div style="padding:24px;background:#f9fafb;">
        <p style="color:#4b5563;">
          ${itens.length} assinatura(s) com silenciamento vencendo na janela de ${janelaHoras}h
          — ${expirados} já voltaram a alertar.
        </p>
        <p style="color:#4b5563;font-size:13px;">
          Renove o silenciamento apenas se a causa raiz continuar em tratamento.
          Renovações sucessivas escondem bugs crônicos.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#e5e7eb;">
              <th style="padding:8px;text-align:left;">Assinatura</th>
              <th style="padding:8px;">Sev.</th>
              <th style="padding:8px;">Prazo</th>
              <th style="padding:8px;">Notif.</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
      <div style="background:#e5e7eb;padding:12px;text-align:center;color:#6b7280;font-size:12px;">
        Resumo automático semanal — painel: /admin/erros-frontend
      </div>
    </div>`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // [auth-guard] Endpoint de automacao interna: exige service role ou segredo
  // rotacionavel em `x-cron-secret`. Sem isso a funcao roda com service role
  // para qualquer requisicao anonima da internet.
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

    const janelaHoras = num(raw.janelaHoras, 168, 1, 720);
    const minIntervaloHoras = num(raw.minIntervaloHoras, 144, 0, 720);

    const { data, error } = await supabase.rpc("claim_silenciamentos_digest", {
      p_horas: janelaHoras,
      p_min_intervalo_horas: minIntervaloHoras,
    });

    if (error) {
      console.error("Falha ao reivindicar digest:", error.message);
      return jsonResponse({ success: false, error: "falha ao consultar silenciamentos" }, 500);
    }

    const itens = (data ?? []) as ItemDigest[];
    if (itens.length === 0) {
      return jsonResponse({
        success: true,
        itens: 0,
        message: "nenhum silenciamento a comunicar (ou digest recente já enviado)",
      });
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

    const slackUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    if (slackUrl) {
      try {
        const texto = itens
          .map((i) => `• [${i.severity}] ${i.assinatura} — ${prazo(i)}`)
          .join("\n");
        const resp = await fetch(slackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🔕 Silenciamentos de alerta vencendo (janela ${janelaHoras}h)\n${texto}`,
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
            subject: `🔕 ${itens.length} silenciamento(s) de alerta vencendo`,
            html: montarHtml(itens, janelaHoras),
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
      itens: itens.length,
      expirados: itens.filter((i) => i.ja_expirou).length,
      canais,
      janelaHoras,
    });
  } catch (e) {
    console.error("Erro inesperado:", e instanceof Error ? e.message : String(e));
    return jsonResponse({ success: false, error: "erro interno" }, 500);
  }
});
