// Edge: gerar-heatmap-tributario — versão determinística (stub)
// Substitui a versão com Lovable AI Gateway.
// Gera heatmap 12m × 8 tributos com intensidade normalizada e variação MoM.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders, respostaPreflight, jsonComCors } from '../_shared/cors.ts';

interface ReqBody { empresa_id?: string; ano?: number; }
interface CelulaHeatmap {
  mes: number;
  tributo: string;
  valor: number;
  intensidade: number;
  variacao_mom: number | null;
}

const TRIBUTOS = ['cbs', 'ibs', 'imposto_seletivo', 'pis', 'cofins', 'icms', 'iss', 'irpj_csll'] as const;
const ALIQUOTAS: Record<string, number> = {
  cbs: 0.012,
  ibs: 0.017,
  imposto_seletivo: 0.004,
  pis: 0.0165,
  cofins: 0.076,
  icms: 0.04,
  iss: 0.025,
  irpj_csll: 0.034,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return respostaPreflight();
  if (req.method !== 'POST') return jsonComCors({ error: 'Método não permitido' }, 405);

  try {
    const body: ReqBody = await req.json().catch(() => ({}));
    const empresaId = body?.empresa_id;
    const ano = Number(body?.ano ?? new Date().getFullYear());
    if (!empresaId) return jsonComCors({ error: 'empresa_id é obrigatório' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Buscar faturamento mensal real do ano (se houver)
    let receitaPorMes: Record<number, number> = {};
    if (supabaseUrl && serviceKey) {
      const supa = createClient(supabaseUrl, serviceKey);
      const { data: fat } = await supa
        .from('faturamento_mensal')
        .select('mes, receita_bruta')
        .eq('empresa_id', empresaId)
        .eq('ano', ano);

      if (fat && fat.length > 0) {
        for (const r of fat) receitaPorMes[r.mes] = Number(r.receita_bruta || 0);
      }
    }

    // Fallback sazonal determinístico (sazonalidade típica de eventos + indústria promocional)
    const sazonalidade = [0.78, 0.82, 0.95, 1.05, 1.12, 1.18, 1.05, 0.98, 0.92, 0.88, 0.82, 0.75];
    const receitaMedia = 285000;

    // Gerar células
    const celulas: CelulaHeatmap[] = [];
    let maxValor = 0;
    const totaisPorTributo: Record<string, number> = {};
    for (const t of TRIBUTOS) totaisPorTributo[t] = 0;

    const variacoesMesAnterior: Record<string, number | null> = {};
    for (const t of TRIBUTOS) variacoesMesAnterior[t] = null;

    for (let mes = 1; mes <= 12; mes++) {
      const receita = receitaPorMes[mes] ?? receitaMedia * sazonalidade[mes - 1];
      for (const t of TRIBUTOS) {
        const valor = receita * ALIQUOTAS[t];
        if (valor > maxValor) maxValor = valor;
        celulas.push({
          mes,
          tributo: t,
          valor: Math.round(valor),
          intensidade: 0, // preenchido depois
          variacao_mom: null,
        });
      }
    }

    // Calcula intensidade (0-1 normalizado pelo máximo do mês+tributo) e variação MoM
    for (const c of celulas) {
      c.intensidade = maxValor > 0 ? Math.round((c.valor / maxValor) * 100) / 100 : 0;
      // variação MoM: pegar célula do mês anterior do mesmo tributo
      if (c.mes > 1) {
        const anterior = celulas.find((x) => x.mes === c.mes - 1 && x.tributo === c.tributo);
        if (anterior && anterior.valor > 0) {
          c.variacao_mom = Math.round(((c.valor - anterior.valor) / anterior.valor) * 1000) / 10;
        }
      }
    }

    const totalPorMes = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return celulas.filter((c) => c.mes === m).reduce((acc, c) => acc + c.valor, 0);
    });

    const totalAno = totalPorMes.reduce((a, b) => a + b, 0);
    const mesPico = totalPorMes.indexOf(Math.max(...totalPorMes)) + 1;
    const mesValeIdx = totalPorMes.findIndex((v) => v === Math.min(...totalPorMes));
    const mesVale = mesValeIdx >= 0 ? mesValeIdx + 1 : null;

    return jsonComCors({
      success: true,
      ano,
      empresa_id: empresaId,
      celulas,
      total_por_mes: totalPorMes.map((v) => Math.round(v)),
      total_ano: Math.round(totalAno),
      max_valor: Math.round(maxValor),
      insights: { mes_pico: mesPico, mes_vale: mesVale },
    });
  } catch (err) {
    return jsonComCors({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});