import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { OptionalEmpresaIdSchema, corsHeaders, validatePayload, createErrorResponse } from "../_shared/validation.ts";
import { exigirChamadaInterna } from "../_shared/auth-guard.ts";


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

/**
 * O client Deno e criado sem os tipos gerados do banco, entao cada `select`
 * devolve `{ coluna: unknown }`. Em vez de anotar o callback (o que colidia com
 * a inferencia e produzia 15 erros de type-check), normalizamos a leitura num
 * unico ponto: o formato esperado e declarado explicitamente pelo chamador.
 */
function linhas<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

function paraNumero(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function calcularEmpresa(
  // Tipo explicito: `ReturnType<typeof createClient>` resolve os genericos sem
  // vinculo (`SupabaseClient<unknown, never, ...>`) e nao aceita o client real.
  client: SupabaseClient<any, "public", any>,
  empresaId: string,
) {
  // `alertas`, `solicitacoes_lgpd` e `transacoes_bancarias` nao possuem
  // `empresa_id`. Sem estas duas resolucoes os scores 3, 4 e 6 eram calculados
  // sobre a base inteira: o health score de uma empresa refletia o
  // comportamento de outros inquilinos. Resolvemos o vinculo indireto uma vez.
  const { data: perfisRaw } = await client
    .from("profiles")
    .select("user_id")
    .eq("empresa_id", empresaId);
  const usuariosEmpresa = linhas<{ user_id: string | null }>(perfisRaw)
    .map((p) => p.user_id)
    .filter((id): id is string => typeof id === "string");

  const { data: contasRaw } = await client
    .from("contas_bancarias")
    .select("id, saldo_atual")
    .eq("empresa_id", empresaId);
  const contasEmpresa = linhas<{ id: string; saldo_atual: unknown }>(contasRaw);
  const idsContas = contasEmpresa.map((c) => c.id);

  // 1) Tributário: % apurações com status finalizado nos últimos 3 meses
  let scoreTrib = 50;
  try {
    const { data } = await client
      .from("apuracoes_tributarias")
      .select("status")
      .eq("empresa_id", empresaId)
      .gte(
        "competencia",
        new Date(new Date().setMonth(new Date().getMonth() - 3))
          .toISOString()
          .slice(0, 10),
      );
    const aps = linhas<{ status: string | null }>(data);
    if (aps.length > 0) {
      const ok = aps.filter((a) => a.status === "finalizado").length;
      scoreTrib = clamp((ok / aps.length) * 100);
    } else {
      scoreTrib = 70;
    }
  } catch { /* default */ }

  // 2) Financeiro: saldo positivo + inadimplência baixa
  let scoreFin = 50;
  try {
    const saldoTotal = contasEmpresa.reduce(
      (s, c) => s + paraNumero(c.saldo_atual),
      0,
    );
    const { data: vencidasRaw } = await client
      .from("contas_receber")
      .select("valor")
      .eq("empresa_id", empresaId)
      .eq("status", "vencido");
    const totalVencido = linhas<{ valor: unknown }>(vencidasRaw).reduce(
      (s, c) => s + paraNumero(c.valor),
      0,
    );
    const ratio = saldoTotal > 0 ? totalVencido / saldoTotal : 1;
    scoreFin = clamp(saldoTotal > 0 ? 100 - ratio * 50 : 30);
  } catch { /* default */ }

  // 3) Operacional: % conciliação (escopo: contas bancárias desta empresa)
  let scoreOp = 60;
  try {
    if (idsContas.length > 0) {
      const { data } = await client
        .from("transacoes_bancarias")
        .select("conciliada")
        .in("conta_bancaria_id", idsContas)
        .gte(
          "data",
          new Date(new Date().setDate(new Date().getDate() - 30))
            .toISOString()
            .slice(0, 10),
        );
      const txs = linhas<{ conciliada: boolean | null }>(data);
      if (txs.length > 0) {
        const conc = txs.filter((t) => t.conciliada === true).length;
        scoreOp = clamp((conc / txs.length) * 100);
      }
    }
  } catch { /* default */ }

  // 4) LGPD: solicitações abertas há mais de 7 dias (usuários desta empresa)
  let scoreLgpd = 100;
  try {
    if (usuariosEmpresa.length > 0) {
      const { data } = await client
        .from("solicitacoes_lgpd")
        .select("created_at")
        .in("user_id", usuariosEmpresa)
        .in("status", ["aberta", "em_analise"]);
      const solicAbertas = linhas<{ created_at: string | null }>(data);
      if (solicAbertas.length > 0) {
        const atrasadas = solicAbertas.filter((s) =>
          s.created_at !== null &&
          Date.now() - new Date(s.created_at).getTime() > 7 * 24 * 3600 * 1000
        ).length;
        scoreLgpd = clamp(100 - atrasadas * 20);
      }
    }
  } catch { /* default */ }

  // 5) Cadastros: empresa tem regime + cnae
  let scoreCad = 50;
  try {
    const { data } = await client
      .from("empresas")
      .select("regime_tributario, cnae_principal")
      .eq("id", empresaId)
      .maybeSingle();
    const empresa = data as
      | { regime_tributario: unknown; cnae_principal: unknown }
      | null;
    if (empresa) {
      let v = 0;
      if (empresa.regime_tributario) v += 50;
      if (empresa.cnae_principal) v += 50;
      scoreCad = v;
    }
  } catch { /* default */ }

  // 6) Engajamento: alertas atendidos (usuários desta empresa)
  let scoreEng = 60;
  try {
    if (usuariosEmpresa.length > 0) {
      const { data } = await client
        .from("alertas")
        .select("lido")
        .in("user_id", usuariosEmpresa)
        .gte(
          "created_at",
          new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        );
      const alertas = linhas<{ lido: boolean | null }>(data);
      if (alertas.length > 0) {
        const lidos = alertas.filter((a) => a.lido === true).length;
        scoreEng = clamp((lidos / alertas.length) * 100);
      }
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

  // [auth-guard] Endpoint de automacao interna: exige service role ou segredo
  // rotacionavel em `x-cron-secret`. Sem isso a funcao roda com service role
  // para qualquer requisicao anonima da internet.
  const guard = await exigirChamadaInterna(req);
  if (!guard.ok) return guard.resposta;


  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, key);

    const rawBody = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const validation = validatePayload(OptionalEmpresaIdSchema, rawBody, "calcular-health-score-operacional");
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details);
    }
    const empresaIdFiltro = validation.data.empresa_id ?? null;


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
