import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PESOS = {
  tributario: 0.25,
  financeiro: 0.25,
  operacional: 0.15,
  lgpd: 0.1,
  cadastros: 0.1,
  engajamento: 0.15,
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

async function calcularEmpresa(
  client: ReturnType<typeof createClient>,
  empresaId: string | null
) {
  // 1) Tributário: % apurações com status finalizado nos últimos 3 meses
  let scoreTrib = 50;
  try {
    const { data: aps } = await client
      .from("apuracoes_tributarias")
      .select("status")
      .eq("empresa_id", empresaId)
      .gte("competencia", new Date(new Date().setMonth(new Date().getMonth() - 3))
        .toISOString()
        .slice(0, 10));
    if (aps && aps.length > 0) {
      const ok = aps.filter((a: { status: string | null }) => a.status === "finalizado").length;
      scoreTrib = clamp((ok / aps.length) * 100);
    } else {
      scoreTrib = 70;
    }
  } catch { /* default */ }

  // 2) Financeiro: saldo positivo + inadimplência baixa
  let scoreFin = 50;
  try {
    const { data: contas } = await client
      .from("contas_bancarias")
      .select("saldo_atual")
      .eq("empresa_id", empresaId);
    const saldoTotal = (contas ?? []).reduce(
      (s: number, c: { saldo_atual: number | null }) => s + (Number(c.saldo_atual) || 0),
      0
    );
    const { data: vencidas } = await client
      .from("contas_receber")
      .select("valor")
      .eq("empresa_id", empresaId)
      .eq("status", "vencido");
    const totalVencido = (vencidas ?? []).reduce(
      (s: number, c: { valor: number | null }) => s + (Number(c.valor) || 0),
      0
    );
    const ratio = saldoTotal > 0 ? totalVencido / saldoTotal : 1;
    scoreFin = clamp(saldoTotal > 0 ? 100 - ratio * 50 : 30);
  } catch { /* default */ }

  // 3) Operacional: % conciliação
  let scoreOp = 60;
  try {
    const { data: txs } = await client
      .from("transacoes_bancarias")
      .select("conciliada")
      .gte("data", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10));
    if (txs && txs.length > 0) {
      const conc = txs.filter((t: { conciliada: boolean | null }) => t.conciliada).length;
      scoreOp = clamp((conc / txs.length) * 100);
    }
  } catch { /* default */ }

  // 4) LGPD: solicitações abertas há mais de 7 dias
  let scoreLgpd = 100;
  try {
    const { data: solicAbertas } = await client
      .from("solicitacoes_lgpd")
      .select("created_at")
      .in("status", ["aberta", "em_analise"]);
    if (solicAbertas && solicAbertas.length > 0) {
      const atrasadas = solicAbertas.filter(
        (s: { created_at: string }) =>
          Date.now() - new Date(s.created_at).getTime() > 7 * 24 * 3600 * 1000
      ).length;
      scoreLgpd = clamp(100 - atrasadas * 20);
    }
  } catch { /* default */ }

  // 5) Cadastros: empresa tem regime + cnae
  let scoreCad = 50;
  try {
    const { data: empresa } = await client
      .from("empresas")
      .select("regime_tributario, cnae_principal")
      .eq("id", empresaId)
      .maybeSingle();
    if (empresa) {
      let v = 0;
      if (empresa.regime_tributario) v += 50;
      if (empresa.cnae_principal) v += 50;
      scoreCad = v;
    }
  } catch { /* default */ }

  // 6) Engajamento: alertas atendidos
  let scoreEng = 60;
  try {
    const { data: alertas } = await client
      .from("alertas")
      .select("lido")
      .gte("created_at", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());
    if (alertas && alertas.length > 0) {
      const lidos = alertas.filter((a: { lido: boolean | null }) => a.lido).length;
      scoreEng = clamp((lidos / alertas.length) * 100);
    }
  } catch { /* default */ }

  const total =
    scoreTrib * PESOS.tributario +
    scoreFin * PESOS.financeiro +
    scoreOp * PESOS.operacional +
    scoreLgpd * PESOS.lgpd +
    scoreCad * PESOS.cadastros +
    scoreEng * PESOS.engajamento;

  return {
    score_total: Number(total.toFixed(2)),
    score_tributario: Number(scoreTrib.toFixed(2)),
    score_financeiro: Number(scoreFin.toFixed(2)),
    score_operacional: Number(scoreOp.toFixed(2)),
    score_lgpd: Number(scoreLgpd.toFixed(2)),
    score_cadastros: Number(scoreCad.toFixed(2)),
    score_engajamento: Number(scoreEng.toFixed(2)),
  };
}

async function gerarInsightsIA(score: Record<string, number>): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return "_IA indisponível._";
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é consultor financeiro/tributário sênior. Gere 3 insights priorizados em markdown (use ✅/⚠️/🚨), curtos e acionáveis em português.",
          },
          {
            role: "user",
            content: `Health score 360°:\n${JSON.stringify(score, null, 2)}\n\nGere 3 insights priorizados.`,
          },
        ],
      }),
    });
    if (!resp.ok) return "_Falha ao gerar insights._";
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content ?? "_Sem insights._";
  } catch {
    return "_Erro ao consultar IA._";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, key);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const empresaIdFiltro = body?.empresa_id ?? null;

    const { data: empresas } = await client
      .from("empresas")
      .select("id, razao_social")
      .eq("ativo", true);

    const lista = empresaIdFiltro
      ? (empresas ?? []).filter((e: { id: string }) => e.id === empresaIdFiltro)
      : empresas ?? [];

    const resultados: Array<Record<string, unknown>> = [];

    for (const emp of lista) {
      const scores = await calcularEmpresa(client, emp.id);

      // Tendência vs 7 dias atrás
      const { data: anterior } = await client
        .from("health_scores_operacionais")
        .select("score_total")
        .eq("empresa_id", emp.id)
        .lte(
          "snapshot_data",
          new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
        )
        .order("snapshot_data", { ascending: false })
        .limit(1)
        .maybeSingle();

      const tendencia = anterior?.score_total
        ? ((scores.score_total - Number(anterior.score_total)) / Number(anterior.score_total)) * 100
        : null;

      const insights = await gerarInsightsIA({ ...scores, empresa: emp.razao_social });

      const { error } = await client.from("health_scores_operacionais").upsert(
        {
          empresa_id: emp.id,
          snapshot_data: new Date().toISOString().slice(0, 10),
          ...scores,
          tendencia_pct: tendencia ? Number(tendencia.toFixed(2)) : null,
          insights_md: insights,
          detalhes: { pesos: PESOS },
        },
        { onConflict: "empresa_id,snapshot_data" }
      );
      if (error) console.error("upsert error:", error.message);

      resultados.push({ empresa_id: emp.id, ...scores, tendencia_pct: tendencia });
    }

    return new Response(
      JSON.stringify({ ok: true, total: resultados.length, resultados }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("calcular-health-score-operacional error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
