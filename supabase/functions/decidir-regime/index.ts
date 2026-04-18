// ============================================
// EDGE FUNCTION: decidir-regime
// Orquestra simulação Simples + Presumido + Real server-side
// e persiste em regimes_simulados.
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ---------- Tipos ----------
type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

interface FaturamentoMes {
  ano: number; mes: number; receita_bruta: number;
  receita_servicos?: number; receita_revenda?: number;
  receita_industria?: number; receita_exportacao?: number;
}
interface FolhaMes {
  ano: number; mes: number; salarios: number; pro_labore: number;
  encargos: number; total_folha: number;
}
interface ParametrosSimulacao {
  faturamentoAnual: number;
  faturamentoMensal?: FaturamentoMes[];
  folhaMensal?: FolhaMes[];
  folhaAnual?: number;
  margemLucro: number;
  percentualServicos: number;
  comprasComCredito?: number;
  despesasOperacionais?: number;
}
interface ResultadoCenario {
  regime: RegimeTributario; nome: string; elegivel: boolean;
  motivoInelegibilidade?: string;
  irpj: number; csll: number; pis: number; cofins: number; cpp: number;
  icms: number; iss: number; cbs: number; ibs: number;
  totalTributos: number; cargaEfetiva: number;
  rbt12?: number; fatorR?: number; anexoAplicavel?: AnexoSimples;
  faixaAplicavel?: number; aliquotaNominal?: number;
  observacoes: string[];
}

// ---------- Tabelas Simples ----------
const ANEXOS: Record<AnexoSimples, Array<{ faixa: number; ate: number; aliq: number; pd: number }>> = {
  I: [
    { faixa: 1, ate: 180000, aliq: 0.04, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.073, pd: 5940 },
    { faixa: 3, ate: 720000, aliq: 0.095, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.107, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.143, pd: 87300 },
    { faixa: 6, ate: 4800000, aliq: 0.19, pd: 378000 },
  ],
  II: [
    { faixa: 1, ate: 180000, aliq: 0.045, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.078, pd: 5940 },
    { faixa: 3, ate: 720000, aliq: 0.10, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.112, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.147, pd: 85500 },
    { faixa: 6, ate: 4800000, aliq: 0.30, pd: 720000 },
  ],
  III: [
    { faixa: 1, ate: 180000, aliq: 0.06, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.112, pd: 9360 },
    { faixa: 3, ate: 720000, aliq: 0.135, pd: 17640 },
    { faixa: 4, ate: 1800000, aliq: 0.16, pd: 35640 },
    { faixa: 5, ate: 3600000, aliq: 0.21, pd: 125640 },
    { faixa: 6, ate: 4800000, aliq: 0.33, pd: 648000 },
  ],
  IV: [
    { faixa: 1, ate: 180000, aliq: 0.045, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.09, pd: 8100 },
    { faixa: 3, ate: 720000, aliq: 0.102, pd: 12420 },
    { faixa: 4, ate: 1800000, aliq: 0.14, pd: 39780 },
    { faixa: 5, ate: 3600000, aliq: 0.22, pd: 183780 },
    { faixa: 6, ate: 4800000, aliq: 0.33, pd: 828000 },
  ],
  V: [
    { faixa: 1, ate: 180000, aliq: 0.155, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.18, pd: 4500 },
    { faixa: 3, ate: 720000, aliq: 0.195, pd: 9900 },
    { faixa: 4, ate: 1800000, aliq: 0.205, pd: 17100 },
    { faixa: 5, ate: 3600000, aliq: 0.23, pd: 62100 },
    { faixa: 6, ate: 4800000, aliq: 0.305, pd: 540000 },
  ],
};
const LIMITE_SIMPLES = 4_800_000;
const LIMITE_PRESUMIDO = 78_000_000;

function calcularRBT12(hist: FaturamentoMes[], ano: number, mes: number): number {
  if (!hist?.length) return 0;
  const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes));
  const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes));
  if (!ant.length) return 0;
  const u12 = ant.slice(0, 12);
  const soma = u12.reduce((a, f) => a + (f.receita_bruta || 0), 0);
  return u12.length < 12 ? (soma / u12.length) * 12 : soma;
}
function calcularFolha12m(hist: FolhaMes[], ano: number, mes: number): number {
  if (!hist?.length) return 0;
  const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes));
  const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes));
  const u12 = ant.slice(0, 12);
  const soma = u12.reduce((a, f) => a + (f.total_folha || 0), 0);
  return u12.length < 12 && u12.length > 0 ? (soma / u12.length) * 12 : soma;
}

function simularSimples(p: ParametrosSimulacao, ano: number, mes: number): ResultadoCenario {
  const obs: string[] = [];
  if (p.faturamentoAnual > LIMITE_SIMPLES) {
    return {
      regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: false,
      motivoInelegibilidade: `Faturamento acima de R$ 4,8 mi`,
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0, icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0, observacoes: ['Acima do limite legal.'],
    };
  }
  let rbt12 = p.faturamentoAnual;
  if (p.faturamentoMensal?.length) {
    const r = calcularRBT12(p.faturamentoMensal, ano, mes);
    if (r > 0) rbt12 = r;
  }
  const folha12m = p.folhaMensal?.length
    ? calcularFolha12m(p.folhaMensal, ano, mes)
    : (p.folhaAnual || 0);
  const fatorR = rbt12 > 0 ? folha12m / rbt12 : 0;
  let anexo: AnexoSimples = 'I';
  if (p.percentualServicos > 50) {
    anexo = fatorR >= 0.28 ? 'III' : 'V';
    obs.push(`Fator R = ${(fatorR * 100).toFixed(2)}% → Anexo ${anexo}.`);
  } else {
    obs.push('Atividade comercial → Anexo I.');
  }
  const faixa = ANEXOS[anexo].find((f) => rbt12 <= f.ate);
  if (!faixa) {
    return {
      regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: false,
      motivoInelegibilidade: 'RBT12 fora das faixas',
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0, icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0, observacoes: obs,
    };
  }
  const aliqEfet = Math.max(0, ((rbt12 * faixa.aliq) - faixa.pd) / rbt12);
  const das = p.faturamentoAnual * aliqEfet;
  obs.push(`Faixa ${faixa.faixa}, alíq nominal ${(faixa.aliq * 100).toFixed(2)}%, efetiva ${(aliqEfet * 100).toFixed(2)}%.`);
  return {
    regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: true,
    irpj: das * 0.1, csll: das * 0.05, pis: das * 0.03, cofins: das * 0.13,
    cpp: das * 0.4, icms: anexo === 'I' || anexo === 'II' ? das * 0.3 : 0,
    iss: anexo === 'III' || anexo === 'IV' || anexo === 'V' ? das * 0.3 : 0,
    cbs: 0, ibs: 0,
    totalTributos: das, cargaEfetiva: (das / p.faturamentoAnual) * 100,
    rbt12, fatorR, anexoAplicavel: anexo, faixaAplicavel: faixa.faixa,
    aliquotaNominal: faixa.aliq * 100, observacoes: obs,
  };
}

function simularPresumido(p: ParametrosSimulacao): ResultadoCenario {
  if (p.faturamentoAnual > LIMITE_PRESUMIDO) {
    return {
      regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: false,
      motivoInelegibilidade: 'Faturamento > R$ 78 mi',
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0, icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0, observacoes: ['Obrigatório Lucro Real.'],
    };
  }
  const ps = p.percentualServicos / 100;
  const pc = 1 - ps;
  const rs = p.faturamentoAnual * ps;
  const rc = p.faturamentoAnual * pc;
  const baseIrpj = rs * 0.32 + rc * 0.08;
  const irpj = baseIrpj * 0.15 + (baseIrpj > 240000 ? (baseIrpj - 240000) * 0.10 : 0);
  const csll = (rs * 0.32 + rc * 0.12) * 0.09;
  const pis = p.faturamentoAnual * 0.0065;
  const cofins = p.faturamentoAnual * 0.03;
  const icms = rc * 0.18;
  const iss = rs * 0.05;
  const cpp = (p.folhaAnual || 0) * 0.20;
  const total = irpj + csll + pis + cofins + icms + iss + cpp;
  return {
    regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: true,
    irpj, csll, pis, cofins, cpp, icms, iss, cbs: 0, ibs: 0,
    totalTributos: total, cargaEfetiva: (total / p.faturamentoAnual) * 100,
    observacoes: ['Presunção 8% comércio / 32% serviços.', 'PIS/COFINS cumulativo.'],
  };
}

function simularReal(p: ParametrosSimulacao): ResultadoCenario {
  const lucro = p.faturamentoAnual * (p.margemLucro / 100);
  const irpj = Math.max(0, lucro * 0.15 + (lucro > 240000 ? (lucro - 240000) * 0.10 : 0));
  const csll = Math.max(0, lucro * 0.09);
  const baseCred = (p.comprasComCredito || 0) + (p.despesasOperacionais || 0);
  const pis = Math.max(0, p.faturamentoAnual * 0.0165 - baseCred * 0.0165);
  const cofins = Math.max(0, p.faturamentoAnual * 0.076 - baseCred * 0.076);
  const ps = p.percentualServicos / 100;
  const rs = p.faturamentoAnual * ps;
  const rc = p.faturamentoAnual * (1 - ps);
  const icms = Math.max(0, rc * 0.18 - (p.comprasComCredito || 0) * 0.18);
  const iss = rs * 0.05;
  const cpp = (p.folhaAnual || 0) * 0.20;
  const total = irpj + csll + pis + cofins + icms + iss + cpp;
  return {
    regime: 'lucro_real', nome: 'Lucro Real', elegivel: true,
    irpj, csll, pis, cofins, cpp, icms, iss, cbs: 0, ibs: 0,
    totalTributos: total, cargaEfetiva: (total / p.faturamentoAnual) * 100,
    observacoes: [`Lucro estimado: ${p.margemLucro}% do faturamento.`, 'PIS/COFINS não-cumulativo.'],
  };
}

function decidirRegime(p: ParametrosSimulacao, ano: number, mes: number, regimeAtual?: RegimeTributario) {
  const cenarios = [simularSimples(p, ano, mes), simularPresumido(p), simularReal(p)];
  const elegiveis = cenarios.filter((c) => c.elegivel).sort((a, b) => a.totalTributos - b.totalTributos);
  const recomendado = elegiveis[0] || cenarios[2];
  const segundoLugar = elegiveis[1];
  let economia: number | undefined;
  if (regimeAtual) {
    const atual = cenarios.find((c) => c.regime === regimeAtual);
    if (atual?.elegivel) economia = atual.totalTributos - recomendado.totalTributos;
  }
  const alertas: string[] = [];
  if (segundoLugar) {
    const diff = ((segundoLugar.totalTributos - recomendado.totalTributos) / recomendado.totalTributos) * 100;
    if (diff < 5) alertas.push(`Diferença pequena (${diff.toFixed(1)}%) entre ${recomendado.nome} e ${segundoLugar.nome}.`);
  }
  const justificativa = `${recomendado.nome} apresenta a menor carga: R$ ${recomendado.totalTributos.toFixed(0)} (${recomendado.cargaEfetiva.toFixed(2)}%).`;
  return { cenarios, recomendado, segundoLugar, economiaAnualVsAtual: economia, alertas, justificativa };
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { empresaId, anoReferencia, mesReferencia, parametrosOverride, regimeAtual, persist = true } = body;

    if (!empresaId || typeof empresaId !== 'string') {
      return new Response(JSON.stringify({ error: 'empresaId obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hoje = new Date();
    const ano = anoReferencia ?? hoje.getFullYear();
    const mes = mesReferencia ?? hoje.getMonth() + 1;

    // Buscar dados
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const [{ data: faturamento }, { data: folha }] = await Promise.all([
      sb.from('faturamento_mensal').select('*').eq('empresa_id', empresaId).order('ano', { ascending: false }).order('mes', { ascending: false }).limit(24),
      sb.from('folha_pagamento').select('*').eq('empresa_id', empresaId).order('ano', { ascending: false }).order('mes', { ascending: false }).limit(24),
    ]);

    const faturamentoMensal: FaturamentoMes[] = (faturamento || []).map((f) => ({
      ano: f.ano, mes: f.mes, receita_bruta: Number(f.receita_bruta) || 0,
      receita_servicos: Number(f.receita_servicos) || 0,
      receita_revenda: Number(f.receita_revenda) || 0,
      receita_industria: Number(f.receita_industria) || 0,
      receita_exportacao: Number(f.receita_exportacao) || 0,
    }));
    const folhaMensal: FolhaMes[] = (folha || []).map((f) => ({
      ano: f.ano, mes: f.mes,
      salarios: Number(f.salarios) || 0,
      pro_labore: Number(f.pro_labore) || 0,
      encargos: Number(f.encargos) || 0,
      total_folha: Number(f.total_folha ?? (Number(f.salarios) || 0) + (Number(f.encargos) || 0)) || 0,
    }));

    const faturamentoAnual = faturamentoMensal
      .filter((f) => f.ano === ano)
      .reduce((a, f) => a + f.receita_bruta, 0)
      || faturamentoMensal.slice(0, 12).reduce((a, f) => a + f.receita_bruta, 0);
    const folhaAnual = folhaMensal
      .filter((f) => f.ano === ano)
      .reduce((a, f) => a + f.total_folha, 0)
      || folhaMensal.slice(0, 12).reduce((a, f) => a + f.total_folha, 0);

    const params: ParametrosSimulacao = {
      faturamentoAnual: parametrosOverride?.faturamentoAnual ?? faturamentoAnual,
      faturamentoMensal,
      folhaMensal,
      folhaAnual: parametrosOverride?.folhaAnual ?? folhaAnual,
      margemLucro: parametrosOverride?.margemLucro ?? 15,
      percentualServicos: parametrosOverride?.percentualServicos ?? 50,
      comprasComCredito: parametrosOverride?.comprasComCredito ?? 0,
      despesasOperacionais: parametrosOverride?.despesasOperacionais ?? 0,
    };

    if (params.faturamentoAnual <= 0) {
      return new Response(JSON.stringify({ error: 'Sem dados de faturamento para a empresa' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resultado = decidirRegime(params, ano, mes, regimeAtual);

    let simulacaoId: string | null = null;
    if (persist) {
      const { data: ins } = await sb.from('regimes_simulados').insert({
        empresa_id: empresaId,
        ano_referencia: ano,
        rbt12: resultado.recomendado.rbt12 ?? params.faturamentoAnual,
        folha_12m: params.folhaAnual ?? 0,
        fator_r: resultado.recomendado.fatorR ?? null,
        regime_atual: regimeAtual ?? null,
        regime_recomendado: resultado.recomendado.regime,
        cenarios: resultado.cenarios as unknown as Record<string, unknown>,
        alertas: resultado.alertas,
        justificativa: resultado.justificativa,
        economia_anual_estimada: resultado.economiaAnualVsAtual ?? null,
        parametros: params as unknown as Record<string, unknown>,
        created_by: claims.claims.sub,
      }).select('id').maybeSingle();
      simulacaoId = ins?.id ?? null;
    }

    return new Response(JSON.stringify({ ...resultado, simulacaoId, params }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[decidir-regime] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
