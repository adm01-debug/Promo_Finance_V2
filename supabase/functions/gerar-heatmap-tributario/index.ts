import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CelulaHeatmap {
  mes: number;
  tributo: string;
  valor: number;
  intensidade: number;
  variacao_mom: number | null;
}

const TRIBUTOS = ["cbs", "ibs", "imposto_seletivo", "pis", "cofins", "icms", "iss", "irpj_csll"] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { empresa_id, ano } = await req.json();
    if (!empresa_id || !ano) {
      return new Response(JSON.stringify({ error: "empresa_id e ano são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Apurações novas (CBS/IBS/IS)
    const { data: apuracoes, error: errA } = await supabase
      .from("apuracoes_tributarias")
      .select("mes, cbs_a_pagar, ibs_a_pagar, is_a_pagar, pis_residual, cofins_residual, icms_residual, iss_residual")
      .eq("empresa_id", empresa_id).eq("ano", ano);
    if (errA) throw errA;

    // IRPJ/CSLL
    const { data: irpjCsll } = await supabase
      .from("apuracoes_irpj_csll")
      .select("mes, irpj_a_pagar, csll_a_pagar")
      .eq("empresa_id", empresa_id).eq("ano", ano);

    // Matriz [12 meses][8 tributos]
    const matriz: Record<number, Record<string, number>> = {};
    for (let m = 1; m <= 12; m++) {
      matriz[m] = Object.fromEntries(TRIBUTOS.map(t => [t, 0]));
    }

    for (const a of apuracoes ?? []) {
      const m = a.mes;
      matriz[m].cbs += Number(a.cbs_a_pagar ?? 0);
      matriz[m].ibs += Number(a.ibs_a_pagar ?? 0);
      matriz[m].imposto_seletivo += Number(a.is_a_pagar ?? 0);
      matriz[m].pis += Number(a.pis_residual ?? 0);
      matriz[m].cofins += Number(a.cofins_residual ?? 0);
      matriz[m].icms += Number(a.icms_residual ?? 0);
      matriz[m].iss += Number(a.iss_residual ?? 0);
    }
    for (const i of irpjCsll ?? []) {
      const m = i.mes;
      if (m) matriz[m].irpj_csll += Number(i.irpj_a_pagar ?? 0) + Number(i.csll_a_pagar ?? 0);
    }

    // Máximo global
    let maxVal = 0;
    for (let m = 1; m <= 12; m++) for (const t of TRIBUTOS) maxVal = Math.max(maxVal, matriz[m][t]);

    // Total por mês (para identificar picos sazonais)
    const totalPorMes: number[] = [];
    for (let m = 1; m <= 12; m++) {
      totalPorMes.push(TRIBUTOS.reduce((s, t) => s + matriz[m][t], 0));
    }

    const celulas: CelulaHeatmap[] = [];
    for (let m = 1; m <= 12; m++) {
      for (const t of TRIBUTOS) {
        const valor = matriz[m][t];
        const valorAnterior = m > 1 ? matriz[m - 1][t] : 0;
        const variacao_mom = valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : null;
        celulas.push({
          mes: m,
          tributo: t,
          valor,
          intensidade: maxVal > 0 ? valor / maxVal : 0,
          variacao_mom,
        });
      }
    }

    const totalAno = totalPorMes.reduce((s, v) => s + v, 0);
    const mesPico = totalPorMes.indexOf(Math.max(...totalPorMes)) + 1;
    const mesVale = totalPorMes.indexOf(Math.min(...totalPorMes.filter(v => v > 0))) + 1;

    return new Response(JSON.stringify({
      success: true,
      ano,
      empresa_id,
      celulas,
      total_por_mes: totalPorMes,
      total_ano: totalAno,
      max_valor: maxVal,
      insights: { mes_pico: mesPico, mes_vale: mesVale > 0 ? mesVale : null },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("heatmap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
