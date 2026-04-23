// Edge function chamada pelo cliente quando uma assinatura de filtro salvo
// dispara uma notificação. Centraliza:
//  1. Gravação no histórico unificado (`notification_history`) — uma linha
//     por canal entregue, para a "central de notificações" do usuário.
//  2. Envio do e-mail (canal opcional) usando Resend, reaproveitando o
//     mesmo padrão visual do `enviar-alerta-email`.
//
// Rodamos isso server-side por dois motivos:
// - O histórico precisa ser inserido com service_role (RLS bloqueia inserts
//   do cliente, para evitar spoof de notificações por outros usuários).
// - A chave do Resend não pode vazar para o navegador.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  /** Identificador da assinatura ou do filtro de origem (para auditoria). */
  sourceRef?: string;
  /** Nome do filtro salvo, exibido no título e no e-mail. */
  filterName: string;
  /** Texto curto que vira o título da notificação (in-app/e-mail). */
  title: string;
  /** Corpo descritivo (multiline). */
  body: string;
  /** Quais canais devem ser registrados/disparados nesta chamada. */
  channels: { inapp?: boolean; email?: boolean; push?: boolean };
  /** Metadados livres anexados ao histórico (ex.: módulo, contagem). */
  metadata?: Record<string, unknown>;
  /** Link sugerido (ex.: /anomalias?filterId=...). Vai no e-mail e no histórico. */
  url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Valida JWT do chamador (verify_jwt = true por padrão no projeto;
    // ainda assim derivamos o userId a partir do header para evitar spoof).
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? null;

    const payload = (await req.json()) as NotifyRequest;
    if (!payload?.title || !payload?.filterName || !payload?.channels) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente admin para inserts no histórico (RLS bloqueia inserts client-side).
    const admin = createClient(supabaseUrl, serviceKey);

    const baseRow = {
      user_id: userId,
      source: "saved_filter_subscription",
      source_ref: payload.sourceRef ?? null,
      title: payload.title,
      body: payload.body,
      metadata: {
        ...(payload.metadata ?? {}),
        filterName: payload.filterName,
        url: payload.url ?? null,
      } as Record<string, unknown>,
    };

    // Cada canal vira uma linha — facilita filtros na UI ("ver só e-mails").
    const insertRows: Array<typeof baseRow & { channel: string; status: string; error_message: string | null }> = [];
    if (payload.channels.inapp) {
      insertRows.push({ ...baseRow, channel: "inapp", status: "sent", error_message: null });
    }
    if (payload.channels.push) {
      insertRows.push({ ...baseRow, channel: "push", status: "sent", error_message: null });
    }

    let emailStatus: "sent" | "failed" | "queued" = "queued";
    let emailError: string | null = null;

    if (payload.channels.email) {
      if (!userEmail) {
        emailStatus = "failed";
        emailError = "Conta sem e-mail cadastrado";
      } else if (!resendApiKey) {
        // Sem Resend ainda registramos no histórico para o usuário ver
        // que o e-mail foi pulado e por quê.
        emailStatus = "failed";
        emailError = "RESEND_API_KEY não configurada";
      } else {
        try {
          const html = renderEmail({
            title: payload.title,
            body: payload.body,
            filterName: payload.filterName,
            url: payload.url,
          });
          const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Alertas <onboarding@resend.dev>",
              to: [userEmail],
              subject: `[${payload.filterName}] ${payload.title}`,
              html,
            }),
          });
          if (!resp.ok) {
            emailStatus = "failed";
            emailError = `Resend ${resp.status}: ${(await resp.text()).slice(0, 200)}`;
          } else {
            emailStatus = "sent";
          }
        } catch (e) {
          emailStatus = "failed";
          emailError = (e as Error).message.slice(0, 200);
        }
      }
      insertRows.push({
        ...baseRow,
        channel: "email",
        status: emailStatus,
        error_message: emailError,
      });
    }

    if (insertRows.length > 0) {
      const { error: insErr } = await admin
        .from("notification_history")
        .insert(insertRows);
      if (insErr) {
        console.error("[notify-saved-filter] insert history failed", insErr);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        recorded: insertRows.length,
        emailStatus: payload.channels.email ? emailStatus : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[notify-saved-filter] erro", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmail(input: {
  title: string;
  body: string;
  filterName: string;
  url?: string;
}): string {
  const lines = (input.body ?? "").split("\n").map((l) => escapeHtml(l)).join("<br/>");
  const cta = input.url
    ? `<a href="${escapeHtml(input.url)}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:20px;">Ver no app</a>`
    : "";
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:20px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:18px;">🔔 ${escapeHtml(input.filterName)}</h1>
      </div>
      <div style="padding:30px;background:#ffffff;">
        <h2 style="color:#1f2937;margin-top:0;font-size:16px;">${escapeHtml(input.title)}</h2>
        <p style="color:#4b5563;line-height:1.6;font-size:14px;">${lines}</p>
        ${cta}
      </div>
      <div style="background:#f3f4f6;padding:15px;text-align:center;color:#6b7280;font-size:12px;">
        Você recebeu este e-mail porque ativou notificações para o filtro "${escapeHtml(input.filterName)}".
      </div>
    </div>
  `;
}

serve(handler);
