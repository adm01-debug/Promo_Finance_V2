import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KPIs {
  receita_total: number;
  despesa_total: number;
  saldo: number;
  total_alertas: number;
  alertas_criticos: number;
  tributos_pagar: number;
  contas_pagar_vencidas: number;
  contas_receber_vencidas: number;
}

async function gerarResumoEmpresa(supabase: any, LOVABLE_API_KEY: string, empresaId: string, semanaInicio: string, semanaFim: string) {
  // Agrega KPIs últimos 7 dias
  const { data: receitas } = await supabase
    .from("contas_receber").select("valor")
    .eq("empresa_id", empresaId)
    .gte("data_recebimento", semanaInicio).lte("data_recebimento", semanaFim);
  const { data: despesas } = await supabase
    .from("contas_pagar").select("valor")
    .eq("empresa_id", empresaId)
    .gte("data_pagamento", semanaInicio).lte("data_pagamento", semanaFim);
  const { count: alertasTotal } = await supabase
    .from("alertas_tributarios").select("*", { count: "exact", head: true })
    .eq("empresa_id", empresaId).gte("created_at", semanaInicio);
  const { count: alertasCriticos } = await supabase
    .from("alertas_tributarios").select("*", { count: "exact", head: true })
    .eq("empresa_id", empresaId).eq("prioridade", "critica").gte("created_at", semanaInicio);
  const { count: cpVencidas } = await supabase
    .from("contas_pagar").select("*", { count: "exact", head: true })
    .eq("empresa_id", empresaId).eq("status", "vencido");
  const { count: crVencidas } = await supabase
    .from("contas_receber").select("*", { count: "exact", head: true })
    .eq("empresa_id", empresaId).eq("status", "vencido");

  const receita_total = (receitas ?? []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const despesa_total = (despesas ?? []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);

  const kpis: KPIs = {
    receita_total, despesa_total, saldo: receita_total - despesa_total,
    total_alertas: alertasTotal ?? 0,
    alertas_criticos: alertasCriticos ?? 0,
    tributos_pagar: 0,
    contas_pagar_vencidas: cpVencidas ?? 0,
    contas_receber_vencidas: crVencidas ?? 0,
  };

  const prompt = `Você é o assistente executivo de uma empresa brasileira. Gere um resumo semanal em markdown com 5 seções:
1. **Highlights** (2-3 bullets)
2. **Tributário** (status fiscal)
3. **Alertas** (atenções)
4. **Oportunidades** (insights)
5. **Próximos passos** (3 ações)

Dados da semana ${semanaInicio} a ${semanaFim}:
- Receita realizada: R$ ${receita_total.toFixed(2)}
- Despesa realizada: R$ ${despesa_total.toFixed(2)}
- Saldo: R$ ${kpis.saldo.toFixed(2)}
- Alertas tributários: ${kpis.total_alertas} (${kpis.alertas_criticos} críticos)
- Contas a pagar vencidas: ${kpis.contas_pagar_vencidas}
- Contas a receber vencidas: ${kpis.contas_receber_vencidas}

Tom: executivo, direto, em português brasileiro. Máximo 600 palavras.`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: "Você gera resumos executivos semanais em markdown para gestores." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!aiResp.ok) {
    const errTxt = await aiResp.text();
    if (aiResp.status === 429) throw new Error("Rate limit excedido");
    if (aiResp.status === 402) throw new Error("Créditos esgotados");
    throw new Error(`AI gateway: ${errTxt}`);
  }

  const aiData = await aiResp.json();
  const resumoMd = aiData.choices?.[0]?.message?.content ?? "Resumo indisponível";

  return { kpis, resumoMd };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => ({}));
    const empresaIdFilter: string | undefined = body.empresa_id;

    const hoje = new Date();
    const semanaFim = new Date(hoje); semanaFim.setDate(hoje.getDate() - 1);
    const semanaInicio = new Date(semanaFim); semanaInicio.setDate(semanaFim.getDate() - 6);
    const sIni = semanaInicio.toISOString().split("T")[0];
    const sFim = semanaFim.toISOString().split("T")[0];

    let q = supabase.from("empresas").select("id, razao_social").eq("ativa", true);
    if (empresaIdFilter) q = q.eq("id", empresaIdFilter);
    const { data: empresas, error: errE } = await q;
    if (errE) throw errE;

    const resultados: Array<{ empresa_id: string; ok: boolean; erro?: string }> = [];

    for (const emp of empresas ?? []) {
      try {
        const { kpis, resumoMd } = await gerarResumoEmpresa(supabase, LOVABLE_API_KEY, emp.id, sIni, sFim);

        // Destinatários
        const { data: agendados } = await supabase
          .from("relatorios_tributarios_agendados")
          .select("destinatarios").eq("empresa_id", emp.id).eq("ativo", true);
        const destinatarios: string[] = [];
        for (const a of agendados ?? []) {
          if (Array.isArray(a.destinatarios)) destinatarios.push(...a.destinatarios);
        }
        const dest = Array.from(new Set(destinatarios.filter(Boolean)));

        let enviadoEm: string | null = null;
        let erroEnvio: string | null = null;
        if (RESEND_API_KEY && dest.length > 0) {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Resumo Executivo <onboarding@resend.dev>",
              to: dest,
              subject: `📊 Resumo semanal — ${emp.razao_social} (${sIni} a ${sFim})`,
              html: `<div style="font-family:system-ui,sans-serif;max-width:680px;margin:auto"><h1>Resumo Executivo Semanal</h1><p><strong>${emp.razao_social}</strong> · ${sIni} a ${sFim}</p><pre style="white-space:pre-wrap;font-family:inherit">${resumoMd}</pre></div>`,
            }),
          });
          if (r.ok) enviadoEm = new Date().toISOString();
          else erroEnvio = await r.text();
        }

        await supabase.from("resumos_executivos_semanais").upsert({
          empresa_id: emp.id, semana_inicio: sIni, semana_fim: sFim,
          resumo_md: resumoMd, kpis: kpis as any,
          destinatarios: dest, enviado_em: enviadoEm, erro_envio: erroEnvio,
        }, { onConflict: "empresa_id,semana_inicio" });

        resultados.push({ empresa_id: emp.id, ok: true });
      } catch (e) {
        resultados.push({ empresa_id: emp.id, ok: false, erro: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({
      success: true, semana_inicio: sIni, semana_fim: sFim,
      total_empresas: empresas?.length ?? 0, resultados,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("resumo-executivo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
