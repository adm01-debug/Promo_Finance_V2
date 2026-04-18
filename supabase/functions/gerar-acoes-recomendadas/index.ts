import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcaoIA {
  titulo: string;
  descricao: string;
  urgencia: "baixa" | "media" | "alta" | "critica";
  impacto_estimado?: number;
  impacto_tipo?: "reais" | "percentual" | "score";
  link_resolucao?: string;
  fonte: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const empresaIdFilter: string | undefined = body.empresa_id;

    let q = supabase.from("empresas").select("id, razao_social").eq("ativa", true);
    if (empresaIdFilter) q = q.eq("id", empresaIdFilter);
    const { data: empresas, error: errE } = await q;
    if (errE) throw errE;

    const resultados: Array<{ empresa_id: string; total: number; ok: boolean; erro?: string }> = [];

    for (const emp of empresas ?? []) {
      try {
        // Coleta sinais das 5 fontes
        const [anomalias, healthScore, alertasNaoLidos, apuracoesAtrasadas, lgpdPendentes] = await Promise.all([
          supabase.from("anomalias_detectadas")
            .select("id, descricao, severidade, tipo_anomalia")
            .eq("empresa_id", emp.id).eq("status", "nova")
            .in("severidade", ["alta", "critica"]).limit(10),
          supabase.from("health_scores_operacionais")
            .select("score_total, dimensoes")
            .eq("empresa_id", emp.id)
            .order("snapshot_em", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("alertas_tributarios")
            .select("id, titulo, prioridade")
            .eq("empresa_id", emp.id).eq("lido", false)
            .in("prioridade", ["alta", "critica"]).limit(10),
          supabase.from("apuracoes_tributarias")
            .select("id, competencia, status")
            .eq("empresa_id", emp.id).eq("status", "rascunho")
            .lt("competencia", new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split("T")[0])
            .limit(5),
          supabase.from("solicitacoes_lgpd")
            .select("id, tipo, status, created_at")
            .eq("status", "aberta")
            .lt("created_at", new Date(Date.now() - 7 * 86400_000).toISOString())
            .limit(5),
        ]);

        const sinais = {
          anomalias_criticas: (anomalias.data ?? []).length,
          anomalias_top: (anomalias.data ?? []).slice(0, 3),
          health_score: healthScore.data?.score_total ?? null,
          alertas_nao_lidos: (alertasNaoLidos.data ?? []).length,
          apuracoes_atrasadas: (apuracoesAtrasadas.data ?? []).length,
          lgpd_pendentes: (lgpdPendentes.data ?? []).length,
        };

        const prompt = `Você é um copilot operacional de gestão tributária/financeira. Com base nos sinais abaixo da empresa "${emp.razao_social}", gere as TOP 5 ações mais prioritárias.

Sinais:
- Anomalias críticas/altas em aberto: ${sinais.anomalias_criticas} ${sinais.anomalias_top.length ? "(ex: " + sinais.anomalias_top.map((a:any)=>a.descricao).join("; ") + ")" : ""}
- Health Score atual: ${sinais.health_score ?? "n/d"}/100
- Alertas tributários não lidos (alta/crítica): ${sinais.alertas_nao_lidos}
- Apurações tributárias atrasadas (rascunho >5d): ${sinais.apuracoes_atrasadas}
- Solicitações LGPD pendentes >7d: ${sinais.lgpd_pendentes}

Retorne JSON puro (sem markdown):
{"acoes":[{"titulo":string,"descricao":string,"urgencia":"baixa|media|alta|critica","impacto_estimado":number?,"impacto_tipo":"reais|percentual|score"?,"link_resolucao":"/anomalias|/alertas-tributarios|/apuracoes-tributarias|/configuracoes/privacidade|/dashboard-empresa"?,"fonte":string}]}

Máximo 5 ações, ordenadas por urgência. Se nenhum sinal relevante, retorne array vazio.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Você gera planos de ação executivos em JSON puro." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!aiResp.ok) {
          if (aiResp.status === 429) throw new Error("Rate limit");
          if (aiResp.status === 402) throw new Error("Créditos esgotados");
          throw new Error(`AI: ${await aiResp.text()}`);
        }

        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content);
        const acoes: AcaoIA[] = Array.isArray(parsed.acoes) ? parsed.acoes.slice(0, 5) : [];

        // Limpa ações antigas da empresa
        await supabase.from("acoes_recomendadas")
          .delete().eq("empresa_id", emp.id);

        if (acoes.length > 0) {
          const rows = acoes.map((a, idx) => ({
            empresa_id: emp.id,
            titulo: a.titulo,
            descricao: a.descricao,
            urgencia: a.urgencia,
            impacto_estimado: a.impacto_estimado ?? null,
            impacto_tipo: a.impacto_tipo ?? null,
            link_resolucao: a.link_resolucao ?? null,
            fonte: a.fonte,
            ordem: idx,
            metadata: { sinais },
          }));
          const { error: errIns } = await supabase.from("acoes_recomendadas").insert(rows);
          if (errIns) throw errIns;
        }

        resultados.push({ empresa_id: emp.id, total: acoes.length, ok: true });
      } catch (e) {
        resultados.push({
          empresa_id: emp.id, total: 0, ok: false,
          erro: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_empresas: empresas?.length ?? 0,
      resultados,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("gerar-acoes-recomendadas error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
