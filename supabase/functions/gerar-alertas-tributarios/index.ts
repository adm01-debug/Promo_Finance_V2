// ============================================
// EDGE FUNCTION: gerar-alertas-tributarios (cron diário)
// Detecta sublimite Simples, Fator R, vencimentos, desvios setoriais, IRPFM
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SIMPLES_SUBLIMITE = 4_800_000;
const SIMPLES_LIMITE_ALERTA = SIMPLES_SUBLIMITE * 0.9; // 90%
const FATOR_R_MIN = 0.28;
const IRPFM_MENSAL_LIMITE = 50_000;
const DIAS_VENCIMENTO_ALERTA = 5;

interface AlertaInsert {
  empresa_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  competencia?: string | null;
  data_vencimento?: string | null;
  acao_url?: string | null;
  acao_label?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const novosAlertas: AlertaInsert[] = [];
  const hoje = new Date();
  const competenciaAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  try {
    const { data: empresas, error: errEmp } = await supabase
      .from('empresas')
      .select('id, razao_social, cnpj, regime_tributario, cnae_principal');
    if (errEmp) throw errEmp;

    for (const empresa of empresas ?? []) {
      // ============ 1) Sublimite Simples Nacional ============
      const ano = hoje.getFullYear();
      const { data: faturamentos } = await supabase
        .from('faturamento_mensal')
        .select('receita_bruta, ano, mes')
        .eq('empresa_id', empresa.id)
        .gte('ano', ano - 1);

      const rbt12 = (faturamentos ?? [])
        .filter((f) => {
          const data = new Date(f.ano, f.mes - 1, 1);
          const limite = new Date(hoje.getFullYear(), hoje.getMonth() - 12, 1);
          return data >= limite;
        })
        .reduce((acc, f) => acc + Number(f.receita_bruta || 0), 0);

      if (empresa.regime_tributario === 'simples_nacional' && rbt12 >= SIMPLES_LIMITE_ALERTA) {
        novosAlertas.push({
          empresa_id: empresa.id,
          tipo: 'sublimite_simples',
          titulo: `Sublimite do Simples Nacional próximo (${((rbt12 / SIMPLES_SUBLIMITE) * 100).toFixed(1)}%)`,
          mensagem: `RBT12 atual de R$ ${rbt12.toLocaleString('pt-BR')} já atingiu ${((rbt12 / SIMPLES_SUBLIMITE) * 100).toFixed(1)}% do sublimite estadual de R$ 4.800.000. Avalie migração para Lucro Presumido antes do estouro.`,
          prioridade: rbt12 >= SIMPLES_SUBLIMITE * 0.95 ? 'critica' : 'alta',
          competencia: competenciaAtual,
          acao_url: '/tributario/simulacao-regimes',
          acao_label: 'Simular regimes',
        });
      }

      // ============ 2) Fator R abaixo de 0,28 ============
      const { data: folha } = await supabase
        .from('folha_pagamento')
        .select('total_folha, ano, mes')
        .eq('empresa_id', empresa.id)
        .gte('ano', ano - 1);

      const folhaUlt12 = (folha ?? [])
        .filter((f) => {
          const data = new Date(f.ano, f.mes - 1, 1);
          const limite = new Date(hoje.getFullYear(), hoje.getMonth() - 12, 1);
          return data >= limite;
        })
        .reduce((acc, f) => acc + Number(f.total_folha || 0), 0);

      if (rbt12 > 0 && empresa.regime_tributario === 'simples_nacional') {
        const fatorR = folhaUlt12 / rbt12;
        if (fatorR < FATOR_R_MIN && fatorR > 0) {
          novosAlertas.push({
            empresa_id: empresa.id,
            tipo: 'fator_r_baixo',
            titulo: `Fator R em ${(fatorR * 100).toFixed(1)}% — abaixo de 28%`,
            mensagem: `O Fator R atual indica enquadramento no Anexo V (alíquotas mais altas). Aumentar folha em R$ ${(rbt12 * FATOR_R_MIN - folhaUlt12).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} permitiria reenquadramento no Anexo III.`,
            prioridade: 'alta',
            competencia: competenciaAtual,
            acao_url: '/tributario/simulacao-regimes',
            acao_label: 'Simular Anexo III vs V',
          });
        }
      }

      // ============ 3) Vencimentos DAS/DARF próximos ============
      const dataLimite = new Date(hoje);
      dataLimite.setDate(dataLimite.getDate() + DIAS_VENCIMENTO_ALERTA);

      const { data: apuracoes } = await supabase
        .from('apuracoes_tributarias')
        .select('id, ano, mes, status, total_geral')
        .eq('empresa_id', empresa.id)
        .neq('status', 'pago');

      for (const ap of apuracoes ?? []) {
        // Vencimento DAS = 20 do mês seguinte
        const vencimento = new Date(ap.ano, ap.mes, 20);
        const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / 86400000);
        if (diasParaVencer >= 0 && diasParaVencer <= DIAS_VENCIMENTO_ALERTA) {
          novosAlertas.push({
            empresa_id: empresa.id,
            tipo: 'vencimento_darf',
            titulo: `DAS/DARF vence em ${diasParaVencer} dia(s)`,
            mensagem: `Apuração ${ap.mes}/${ap.ano}: R$ ${Number(ap.total_geral || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence em ${vencimento.toLocaleDateString('pt-BR')}.`,
            prioridade: diasParaVencer <= 2 ? 'critica' : 'alta',
            data_vencimento: vencimento.toISOString().slice(0, 10),
            competencia: `${ap.ano}-${String(ap.mes).padStart(2, '0')}`,
            acao_url: '/reforma-tributaria',
          });
        }
      }

      // ============ 4) Desvio vs benchmark setorial ============
      if (empresa.cnae_principal && rbt12 > 0) {
        const cnaePrefix = String(empresa.cnae_principal).slice(0, 4);
        const { data: bench } = await supabase
          .from('benchmarks_setoriais')
          .select('carga_media_pct, setor')
          .eq('regime', empresa.regime_tributario ?? 'simples_nacional')
          .ilike('cnae_prefix', `${cnaePrefix}%`)
          .limit(1);

        if (bench && bench.length > 0) {
          const { data: ultimaApuracao } = await supabase
            .from('apuracoes_tributarias')
            .select('total_geral, ano, mes')
            .eq('empresa_id', empresa.id)
            .order('ano', { ascending: false })
            .order('mes', { ascending: false })
            .limit(1);

          if (ultimaApuracao?.[0]) {
            const cargaAtual = (Number(ultimaApuracao[0].total_geral) / (rbt12 / 12)) * 100;
            const cargaBench = Number(bench[0].carga_media_pct);
            const desvio = Math.abs(cargaAtual - cargaBench);
            if (desvio > cargaBench * 0.2) {
              novosAlertas.push({
                empresa_id: empresa.id,
                tipo: 'desvio_benchmark',
                titulo: `Carga tributária ${cargaAtual > cargaBench ? 'acima' : 'abaixo'} do setor`,
                mensagem: `Sua carga atual é ${cargaAtual.toFixed(1)}% vs média do setor "${bench[0].setor}" de ${cargaBench.toFixed(1)}%. Desvio de ${desvio.toFixed(1)} p.p. — vale revisar oportunidades de elisão.`,
                prioridade: cargaAtual > cargaBench * 1.3 ? 'alta' : 'media',
                acao_url: '/tributario/oportunidades-elisao',
              });
            }
          }
        }
      }

      // ============ 5) Dividendos PF > R$ 50k/mês (IRPFM 2026) ============
      const { data: divPF } = await supabase
        .from('movimentacoes')
        .select('valor, data_movimentacao, descricao')
        .eq('empresa_id' as any, empresa.id)
        .ilike('descricao', '%dividend%')
        .gte('data_movimentacao', new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0, 10));

      const totalDividendos = (divPF ?? []).reduce((acc: number, m: any) => acc + Number(m.valor || 0), 0);
      if (totalDividendos > IRPFM_MENSAL_LIMITE) {
        novosAlertas.push({
          empresa_id: empresa.id,
          tipo: 'irpfm_2026',
          titulo: `Dividendos PF acima de R$ 50k — IRPFM 2026`,
          mensagem: `Pagamentos de dividendos no último mês somam R$ ${totalDividendos.toLocaleString('pt-BR')}. A partir de 2026, valores acima de R$ 50k/mês geram Imposto Mínimo PF (Lei 15.270/2025) — avalie Holding Patrimonial.`,
          prioridade: 'media',
          acao_url: '/tributario/oportunidades-elisao',
          acao_label: 'Ver Holding Patrimonial',
        });
      }
    }

    // ============ Persiste alertas evitando duplicatas (mesmo tipo+empresa nos últimos 7d) ============
    let inseridos = 0;
    for (const alerta of novosAlertas) {
      const { data: existe } = await supabase
        .from('alertas_tributarios')
        .select('id')
        .eq('empresa_id', alerta.empresa_id)
        .eq('tipo', alerta.tipo)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1);

      if (existe && existe.length > 0) continue;

      const { error } = await supabase.from('alertas_tributarios').insert(alerta);
      if (!error) inseridos++;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        empresas_processadas: empresas?.length ?? 0,
        alertas_gerados: inseridos,
        alertas_avaliados: novosAlertas.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[gerar-alertas-tributarios]', e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
