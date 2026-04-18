// ============================================
// EDGE: executar-fechamento-tributario (P10)
// 6 etapas validadas + auditoria + bloqueio
// ============================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createLogger } from "../_shared/observability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CheckResult {
  id: string;
  label: string;
  ok: boolean;
  critical: boolean;
  detail: string;
}

interface ReqBody {
  empresa_id: string;
  ano: number;
  mes: number;
  forcar?: boolean;
  justificativa?: string;
  observacoes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const log = createLogger("executar-fechamento-tributario");
  const startedAt = Date.now();

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const uid = userData.user.id;

    // RBAC: admin ou financeiro
    const admin = createClient(url, service);
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", uid);
    const hasRole = (roles ?? []).some((r) => r.role === "admin" || r.role === "financeiro");
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");

    const body = (await req.json()) as ReqBody;
    if (!body.empresa_id || !body.ano || !body.mes) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log.info("fechamento_iniciado", { context: { empresa_id: body.empresa_id, ano: body.ano, mes: body.mes } });

    const checks: CheckResult[] = [];

    // 1. Apuração consolidada
    const { data: apur } = await admin
      .from("apuracoes_tributarias")
      .select("id, total_geral, status")
      .eq("empresa_id", body.empresa_id).eq("ano", body.ano).eq("mes", body.mes)
      .maybeSingle();
    checks.push({
      id: "apuracao",
      label: "Apuração tributária consolidada",
      ok: !!apur,
      critical: true,
      detail: apur ? `Total apurado: R$ ${Number(apur.total_geral || 0).toFixed(2)}` : "Não encontrada",
    });
    const totalApurado = Number(apur?.total_geral ?? 0);

    // 2. Conformidade ≥ 70
    const { data: conf } = await admin
      .from("verificacoes_conformidade" as never)
      .select("score")
      .eq("empresa_id", body.empresa_id)
      .order("verificado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    const score = Number((conf as { score?: number } | null)?.score ?? 0);
    checks.push({
      id: "conformidade",
      label: "Conformidade fiscal ≥ 70",
      ok: score >= 70,
      critical: true,
      detail: `Score atual: ${score.toFixed(0)}/100`,
    });

    // 3. DARFs gerados (relatorios_tributarios com tipo darf)
    const periodo = `${body.ano}-${String(body.mes).padStart(2, "0")}`;
    const { count: darfsCount } = await admin
      .from("relatorios_tributarios" as never)
      .select("*", { count: "exact", head: true })
      .eq("empresa_id", body.empresa_id)
      .eq("tipo", "darf")
      .like("competencia", `${periodo}%`);
    checks.push({
      id: "darfs",
      label: "DARFs/guias geradas",
      ok: (darfsCount ?? 0) > 0,
      critical: false,
      detail: `${darfsCount ?? 0} guia(s) registrada(s)`,
    });

    // 4. Conciliação bancária do período (movimentações conciliadas)
    const inicio = `${body.ano}-${String(body.mes).padStart(2, "0")}-01`;
    const fimDate = new Date(body.ano, body.mes, 0);
    const fim = `${body.ano}-${String(body.mes).padStart(2, "0")}-${String(fimDate.getDate()).padStart(2, "0")}`;
    const { count: pendentes } = await admin
      .from("transacoes_bancarias")
      .select("*", { count: "exact", head: true })
      .gte("data", inicio).lte("data", fim)
      .eq("conciliada", false);
    checks.push({
      id: "conciliacao",
      label: "Conciliação bancária do período",
      ok: (pendentes ?? 0) === 0,
      critical: false,
      detail: `${pendentes ?? 0} transação(ões) pendente(s)`,
    });

    // 5. Decisão de regime cacheada
    const { data: regime } = await admin
      .from("regime_decision_cache" as never)
      .select("decisao, expires_at")
      .eq("empresa_id", body.empresa_id).eq("ano", body.ano).eq("mes", body.mes)
      .maybeSingle();
    checks.push({
      id: "regime",
      label: "Decisão de regime cacheada",
      ok: !!regime,
      critical: false,
      detail: regime ? "Cache válido encontrado" : "Recomendação não calculada",
    });

    // 6. SPED preliminar (relatorio tipo sped)
    const { count: spedCount } = await admin
      .from("relatorios_tributarios" as never)
      .select("*", { count: "exact", head: true })
      .eq("empresa_id", body.empresa_id)
      .eq("tipo", "sped")
      .like("competencia", `${periodo}%`);
    checks.push({
      id: "sped",
      label: "SPED preliminar gerado",
      ok: (spedCount ?? 0) > 0,
      critical: false,
      detail: `${spedCount ?? 0} arquivo(s) SPED`,
    });

    // Avaliação
    const criticalFails = checks.filter((c) => c.critical && !c.ok);
    const allOk = checks.every((c) => c.ok);
    const podeFechar = criticalFails.length === 0 || (body.forcar && isAdmin && body.justificativa);

    if (!podeFechar && body.forcar && !isAdmin) {
      return new Response(JSON.stringify({
        error: "force_requires_admin",
        checks,
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!podeFechar) {
      // Apenas registra status em_revisao
      const { data: upserted } = await admin
        .from("fechamentos_tributarios")
        .upsert({
          empresa_id: body.empresa_id,
          ano: body.ano, mes: body.mes,
          status: "em_revisao",
          checklist: checks,
          score_conformidade: score,
          total_apurado: totalApurado,
          observacoes: body.observacoes,
          created_by: uid,
        }, { onConflict: "empresa_id,ano,mes" })
        .select().maybeSingle();

      log.warn("fechamento_bloqueado", {
        duration_ms: Date.now() - startedAt,
        context: { criticos: criticalFails.length },
      });
      await log.flush();

      return new Response(JSON.stringify({
        success: false,
        status: "em_revisao",
        fechamento: upserted,
        checks,
        critical_fails: criticalFails,
        message: "Etapas críticas falharam. Resolva ou solicite admin para forçar.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fechar
    const { data: fechamento, error: errFech } = await admin
      .from("fechamentos_tributarios")
      .upsert({
        empresa_id: body.empresa_id,
        ano: body.ano, mes: body.mes,
        status: "fechado",
        checklist: checks,
        score_conformidade: score,
        total_apurado: totalApurado,
        observacoes: body.observacoes,
        forcado: !!body.forcar && criticalFails.length > 0,
        justificativa_forcado: body.forcar ? body.justificativa ?? null : null,
        fechado_por: uid,
        fechado_em: new Date().toISOString(),
        created_by: uid,
      }, { onConflict: "empresa_id,ano,mes" })
      .select().maybeSingle();

    if (errFech) throw errFech;

    // Opcional: notificar via Resend (best-effort)
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const { data: empresa } = await admin
          .from("empresas").select("razao_social, email").eq("id", body.empresa_id).maybeSingle();
        const dest = empresa?.email;
        if (dest) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Fechamento Tributário <onboarding@resend.dev>",
              to: [dest],
              subject: `Fechamento ${periodo} concluído — ${empresa?.razao_social ?? ""}`,
              html: `<h2>Fechamento tributário concluído</h2>
                <p>Período: <strong>${periodo}</strong></p>
                <p>Score conformidade: <strong>${score.toFixed(0)}/100</strong></p>
                <p>Total apurado: <strong>R$ ${totalApurado.toFixed(2)}</strong></p>
                <p>Status: <strong>${allOk ? "Concluído com sucesso" : "Concluído com ressalvas"}</strong></p>`,
            }),
          });
        }
      }
    } catch (e) {
      log.warn("notificacao_falha", { error_message: e instanceof Error ? e.message : String(e) });
    }

    log.info("fechamento_concluido", {
      duration_ms: Date.now() - startedAt,
      status_code: 200,
    });
    await log.flush();

    return new Response(JSON.stringify({
      success: true,
      status: "fechado",
      fechamento,
      checks,
      score,
      total_apurado: totalApurado,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("erro_fechamento", { error_message: msg, duration_ms: Date.now() - startedAt });
    await log.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
