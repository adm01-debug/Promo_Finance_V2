import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Anomalia {
  id: string;
  tipo_anomalia: string;
  severidade: "baixa" | "media" | "alta" | "critica";
  status: "nova" | "investigando" | "falso_positivo" | "confirmada";
  descricao: string;
  detectada_em: string;
  resolvida_em: string | null;
}

const TIPO_LABEL: Record<string, string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(url, key);

    const body = await req.json().catch(() => ({}));
    const destinatariosOverride: string[] | undefined = body?.destinatarios;
    const horasJanela: number = Number(body?.horas ?? 24);

    const desde = new Date(Date.now() - horasJanela * 3600 * 1000).toISOString();

    // 1) Anomalias críticas/altas detectadas na janela
    const { data: detectadasRaw, error: errDet } = await supabase
      .from("anomalias_detectadas")
      .select(
        "id, tipo_anomalia, severidade, status, descricao, detectada_em, resolvida_em",
      )
      .in("severidade", ["critica", "alta"])
      .gte("detectada_em", desde)
      .order("detectada_em", { ascending: false })
      .limit(1000);
    if (errDet) throw errDet;
    const detectadas = (detectadasRaw ?? []) as Anomalia[];

    // 2) Anomalias resolvidas na janela (para taxa global de FP)
    const { data: resolvidasRaw } = await supabase
      .from("anomalias_detectadas")
      .select("id, tipo_anomalia, severidade, status, resolvida_em")
      .in("severidade", ["critica", "alta"])
      .in("status", ["confirmada", "falso_positivo"])
      .gte("resolvida_em", desde)
      .limit(2000);
    const resolvidas = (resolvidasRaw ?? []) as Pick<
      Anomalia,
      "id" | "tipo_anomalia" | "severidade" | "status" | "resolvida_em"
    >[];

    // Agrega por detector (tipo_anomalia)
    const tipos = Array.from(
      new Set([
        ...detectadas.map((a) => a.tipo_anomalia),
        ...resolvidas.map((a) => a.tipo_anomalia),
      ]),
    );
    const porDetector = tipos.map((tipo) => {
      const det = detectadas.filter((a) => a.tipo_anomalia === tipo);
      const res = resolvidas.filter((a) => a.tipo_anomalia === tipo);
      const fp = res.filter((a) => a.status === "falso_positivo").length;
      const conf = res.filter((a) => a.status === "confirmada").length;
      const total = fp + conf;
      const taxaFP = total > 0 ? (fp / total) * 100 : 0;
      return {
        tipo,
        label: TIPO_LABEL[tipo] ?? tipo,
        detectadas: det.length,
        criticas: det.filter((a) => a.severidade === "critica").length,
        altas: det.filter((a) => a.severidade === "alta").length,
        confirmadas: conf,
        falsos_positivos: fp,
        taxa_fp_pct: taxaFP,
      };
    });

    const totalDetectadas = detectadas.length;
    const totalCriticas = detectadas.filter((a) => a.severidade === "critica").length;
    const totalAltas = detectadas.filter((a) => a.severidade === "alta").length;
    const totalFP = resolvidas.filter((a) => a.status === "falso_positivo").length;
    const totalResolvidas = resolvidas.length;
    const taxaFPGeral =
      totalResolvidas > 0 ? (totalFP / totalResolvidas) * 100 : 0;

    // App URL pública (para deep links). Cai para preview se não houver custom.
    const appUrl =
      Deno.env.get("APP_PUBLIC_URL") ??
      "https://project-promofinance-harmony.lovable.app";

    const linkAnomalia = (id: string) =>
      `${appUrl}/admin/insights-ia/anomalia/${id}`;

    // ===== HTML =====
    const dataStr = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    const linhasDetector = porDetector
      .sort((a, b) => b.detectadas - a.detectadas)
      .map(
        (d) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${d.label}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center"><strong>${d.detectadas}</strong></td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#dc2626">${d.criticas}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#ea580c">${d.altas}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${d.confirmadas}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${d.falsos_positivos}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center"><strong>${fmt(d.taxa_fp_pct)}%</strong></td>
        </tr>`,
      )
      .join("");

    const linhasItens = detectadas
      .slice(0, 50)
      .map(
        (a) => `
        <tr>
          <td style="padding:6px;border-bottom:1px solid #f1f1f1;font-size:12px">
            <span style="display:inline-block;padding:2px 6px;border-radius:4px;background:${
              a.severidade === "critica" ? "#fee2e2" : "#ffedd5"
            };color:${a.severidade === "critica" ? "#991b1b" : "#9a3412"};font-weight:600;text-transform:uppercase;font-size:10px">${a.severidade}</span>
          </td>
          <td style="padding:6px;border-bottom:1px solid #f1f1f1;font-size:12px">${TIPO_LABEL[a.tipo_anomalia] ?? a.tipo_anomalia}</td>
          <td style="padding:6px;border-bottom:1px solid #f1f1f1;font-size:12px">${a.descricao.replace(/</g, "&lt;").slice(0, 140)}</td>
          <td style="padding:6px;border-bottom:1px solid #f1f1f1;font-size:12px">
            <a href="${linkAnomalia(a.id)}" style="color:#2563eb;text-decoration:none">Drill-down →</a>
          </td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;background:#f8fafc;padding:20px">
<div style="max-width:760px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0">
  <h1 style="margin:0 0 4px;font-size:20px">Relatório diário de anomalias</h1>
  <p style="margin:0 0 20px;color:#64748b;font-size:13px">Janela: últimas ${horasJanela}h · Gerado em ${dataStr}</p>

  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
    <div style="flex:1;min-width:140px;padding:12px;border-radius:8px;background:#f1f5f9">
      <div style="font-size:11px;text-transform:uppercase;color:#64748b">Detectadas</div>
      <div style="font-size:24px;font-weight:700">${totalDetectadas}</div>
    </div>
    <div style="flex:1;min-width:140px;padding:12px;border-radius:8px;background:#fee2e2">
      <div style="font-size:11px;text-transform:uppercase;color:#991b1b">Críticas</div>
      <div style="font-size:24px;font-weight:700;color:#991b1b">${totalCriticas}</div>
    </div>
    <div style="flex:1;min-width:140px;padding:12px;border-radius:8px;background:#ffedd5">
      <div style="font-size:11px;text-transform:uppercase;color:#9a3412">Altas</div>
      <div style="font-size:24px;font-weight:700;color:#9a3412">${totalAltas}</div>
    </div>
    <div style="flex:1;min-width:140px;padding:12px;border-radius:8px;background:#ecfeff">
      <div style="font-size:11px;text-transform:uppercase;color:#155e75">Taxa FP</div>
      <div style="font-size:24px;font-weight:700;color:#155e75">${fmt(taxaFPGeral)}%</div>
    </div>
  </div>

  <h2 style="font-size:15px;margin:20px 0 8px">Por detector</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:8px;text-align:left">Detector</th>
        <th style="padding:8px">Detectadas</th>
        <th style="padding:8px">Críticas</th>
        <th style="padding:8px">Altas</th>
        <th style="padding:8px">Confirmadas</th>
        <th style="padding:8px">FP</th>
        <th style="padding:8px">Taxa FP</th>
      </tr>
    </thead>
    <tbody>${linhasDetector || `<tr><td colspan="7" style="padding:12px;text-align:center;color:#64748b">Sem detecções na janela.</td></tr>`}</tbody>
  </table>

  <h2 style="font-size:15px;margin:24px 0 8px">Itens (${Math.min(detectadas.length, 50)} de ${detectadas.length})</h2>
  <table style="width:100%;border-collapse:collapse">
    <tbody>${linhasItens || `<tr><td style="padding:12px;text-align:center;color:#64748b">Nenhum item para listar.</td></tr>`}</tbody>
  </table>

  <p style="margin-top:24px;font-size:11px;color:#94a3b8">Relatório automático · Não responda este e-mail</p>
</div></body></html>`;

    // Resolve destinatários: override > admins
    let destinatarios: string[] = destinatariosOverride ?? [];
    if (destinatarios.length === 0) {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const ids = (admins ?? []).map((r: { user_id: string }) => r.user_id);
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("email")
          .in("id", ids);
        destinatarios = (profs ?? [])
          .map((p: { email: string | null }) => p.email)
          .filter((e): e is string => !!e);
      }
    }

    const subject = `[Anomalias] ${totalDetectadas} detecções (${totalCriticas} críticas) · ${horasJanela}h`;
    let envioStatus: "enviado" | "simulado" | "sem_destinatarios" = "enviado";

    if (destinatarios.length === 0) {
      envioStatus = "sem_destinatarios";
    } else if (!resendKey) {
      envioStatus = "simulado";
      console.log("RESEND_API_KEY ausente — relatório simulado");
    } else {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Anomalias <onboarding@resend.dev>",
          to: destinatarios,
          subject,
          html,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Resend erro:", resp.status, txt);
        throw new Error(`Falha ao enviar: ${resp.status}`);
      }
    }

    // Persiste alerta para histórico/auditoria
    await supabase.from("alertas").insert({
      tipo: "relatorio_diario_anomalias",
      titulo: subject,
      mensagem: `Detectadas=${totalDetectadas} Crit=${totalCriticas} Altas=${totalAltas} TaxaFP=${fmt(taxaFPGeral)}% (status=${envioStatus})`,
      prioridade: totalCriticas > 0 ? "alta" : "media",
      acao_url: `${appUrl}/admin/insights-ia`,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        envioStatus,
        destinatarios: destinatarios.length,
        totalDetectadas,
        totalCriticas,
        totalAltas,
        taxaFPGeral,
        porDetector,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("relatorio-diario-anomalias error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
