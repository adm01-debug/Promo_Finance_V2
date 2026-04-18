// ============================================
// EDGE: gerar-dre-tributaria (P10)
// Demonstrativo de Resultado com decomposição fiscal
// ============================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createLogger } from "../_shared/observability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReqBody {
  empresa_id: string;
  periodo: string; // YYYY-MM
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const log = createLogger("gerar-dre-tributaria");
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

    const admin = createClient(url, service);
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", uid);
    const hasRole = (roles ?? []).some((r) =>
      r.role === "admin" || r.role === "financeiro" || r.role === "visualizador"
    );
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    if (!body.empresa_id || !body.periodo) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [anoStr, mesStr] = body.periodo.split("-");
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    if (!ano || !mes) {
      return new Response(JSON.stringify({ error: "periodo_invalido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inicio = `${anoStr}-${mesStr.padStart(2, "0")}-01`;
    const fimDate = new Date(ano, mes, 0);
    const fim = `${anoStr}-${mesStr.padStart(2, "0")}-${String(fimDate.getDate()).padStart(2, "0")}`;

    // Receita bruta (contas_receber pagas)
    const { data: receitas } = await admin
      .from("contas_receber")
      .select("valor_recebido, valor")
      .eq("empresa_id", body.empresa_id)
      .gte("data_vencimento", inicio).lte("data_vencimento", fim);
    const receitaBruta = (receitas ?? []).reduce(
      (s, r) => s + Number(r.valor_recebido ?? r.valor ?? 0), 0
    );

    // Apuração tributária
    const { data: apur } = await admin
      .from("apuracoes_tributarias")
      .select("cbs_a_pagar, ibs_a_pagar, is_a_pagar, pis_residual, cofins_residual, icms_residual, iss_residual, total_geral")
      .eq("empresa_id", body.empresa_id).eq("ano", ano).eq("mes", mes)
      .maybeSingle();

    const cbs = Number(apur?.cbs_a_pagar ?? 0);
    const ibs = Number(apur?.ibs_a_pagar ?? 0);
    const is = Number(apur?.is_a_pagar ?? 0);
    const pis = Number(apur?.pis_residual ?? 0);
    const cofins = Number(apur?.cofins_residual ?? 0);
    const icms = Number(apur?.icms_residual ?? 0);
    const iss = Number(apur?.iss_residual ?? 0);
    const totalDeducoes = cbs + ibs + is + pis + cofins + icms + iss;
    const receitaLiquida = receitaBruta - totalDeducoes;

    // Custos (contas_pagar do período)
    const { data: custos } = await admin
      .from("contas_pagar")
      .select("valor_pago, valor")
      .eq("empresa_id", body.empresa_id)
      .gte("data_vencimento", inicio).lte("data_vencimento", fim);
    const custosTotais = (custos ?? []).reduce(
      (s, c) => s + Number(c.valor_pago ?? c.valor ?? 0), 0
    );

    const lucroBruto = receitaLiquida - custosTotais;

    // IRPJ/CSLL (apuracao trimestral mais recente do ano)
    const { data: irpj } = await admin
      .from("apuracoes_irpj_csll")
      .select("irpj_a_pagar, csll_a_pagar")
      .eq("empresa_id", body.empresa_id)
      .eq("ano", ano)
      .order("trimestre", { ascending: false })
      .limit(1)
      .maybeSingle();
    const irpjValor = Number(irpj?.irpj_a_pagar ?? 0) / 3; // proporção mensal
    const csllValor = Number(irpj?.csll_a_pagar ?? 0) / 3;

    const lucroLiquido = lucroBruto - irpjValor - csllValor;

    // Comparativo regime ótimo (cache P7)
    const { data: regime } = await admin
      .from("regime_decision_cache" as never)
      .select("decisao")
      .eq("empresa_id", body.empresa_id).eq("ano", ano).eq("mes", mes)
      .maybeSingle();

    type RegimeDecisao = { recomendado?: { regime?: string; totalTributos?: number } };
    const decisao = (regime as { decisao?: RegimeDecisao } | null)?.decisao;
    const regimeOtimo = decisao?.recomendado?.regime;
    const tributosOtimo = Number(decisao?.recomendado?.totalTributos ?? 0) / 12;
    const economiaPotencial = totalDeducoes + irpjValor + csllValor - tributosOtimo;

    const dre = {
      periodo: body.periodo,
      receita_bruta: receitaBruta,
      deducoes: {
        cbs, ibs, imposto_seletivo: is,
        pis, cofins, icms, iss,
        total: totalDeducoes,
      },
      receita_liquida: receitaLiquida,
      custos: custosTotais,
      lucro_bruto: lucroBruto,
      irpj: irpjValor,
      csll: csllValor,
      lucro_liquido: lucroLiquido,
      carga_tributaria_pct: receitaBruta > 0
        ? ((totalDeducoes + irpjValor + csllValor) / receitaBruta) * 100 : 0,
      comparativo_regime_otimo: regimeOtimo ? {
        regime: regimeOtimo,
        tributos_estimados: tributosOtimo,
        economia_potencial: economiaPotencial,
      } : null,
    };

    log.info("dre_gerada", {
      duration_ms: Date.now() - startedAt,
      context: { empresa_id: body.empresa_id, periodo: body.periodo },
    });
    await log.flush();

    return new Response(JSON.stringify({ success: true, dre }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("erro_dre", { error_message: msg, duration_ms: Date.now() - startedAt });
    await log.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
