import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[gerar-alertas] Iniciando geração de alertas automáticos...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body para opções
    let options = { incluirMetas: true, userId: null };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // Sem body, usar padrões
    }

    // Chamar a função do banco para gerar alertas de vencimento
    const { error: vencimentoError } = await supabase.rpc('gerar_alertas_vencimento');

    if (vencimentoError) {
      console.error('[gerar-alertas] Erro ao gerar alertas de vencimento:', vencimentoError);
    }

    let alertasMetasCriados = 0;

    // Verificar metas em risco
    if (options.incluirMetas) {
      console.log('[gerar-alertas] Verificando metas em risco...');
      alertasMetasCriados = await verificarMetasEmRisco(supabase, options.userId);
    }

    console.log('[gerar-alertas] Alertas gerados com sucesso');

    // Contar alertas criados recentemente
    const { count } = await supabase
      .from('alertas')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alertas gerados com sucesso',
        alertas_criados: count || 0,
        alertas_metas: alertasMetasCriados
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('[gerar-alertas] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function verificarMetasEmRisco(supabase: any, userId: string | null): Promise<number> {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const diaDoMes = hoje.getDate();
  const diasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
  const percentualMesDecorrido = (diaDoMes / diasNoMes) * 100;

  console.log(`[gerar-alertas] Verificando metas para ${mesAtual}/${anoAtual} - ${percentualMesDecorrido.toFixed(1)}% do mês decorrido`);

  // Buscar metas ativas do mês
  const { data: metas, error: metasError } = await supabase
    .from('metas_financeiras')
    .select('*')
    .eq('mes', mesAtual)
    .eq('ano', anoAtual)
    .eq('ativo', true);

  if (metasError) {
    console.error('[gerar-alertas] Erro ao buscar metas:', metasError);
    return 0;
  }

  if (!metas || metas.length === 0) {
    console.log('[gerar-alertas] Nenhuma meta ativa encontrada');
    return 0;
  }

  // Buscar dados reais do mês
  const inicioMes = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
  const fimMes = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${diasNoMes}`;

  // Receitas realizadas
  const { data: receitas } = await supabase
    .from('contas_receber')
    .select('valor_recebido')
    .eq('status', 'pago')
    .gte('data_recebimento', inicioMes)
    .lte('data_recebimento', fimMes);

  const totalReceitas = (receitas || []).reduce((acc: number, r: any) => acc + (r.valor_recebido || 0), 0);

  // Despesas realizadas
  const { data: despesas } = await supabase
    .from('contas_pagar')
    .select('valor_pago')
    .eq('status', 'pago')
    .gte('data_pagamento', inicioMes)
    .lte('data_pagamento', fimMes);

  const totalDespesas = (despesas || []).reduce((acc: number, d: any) => acc + (d.valor_pago || 0), 0);

  // Inadimplência
  const { data: receber } = await supabase
    .from('contas_receber')
    .select('valor, status')
    .gte('data_vencimento', inicioMes)
    .lte('data_vencimento', fimMes);

  const totalReceber = (receber || []).reduce((acc: number, r: any) => acc + (r.valor || 0), 0);
  const vencidos = (receber || []).filter((r: any) => r.status === 'vencido');
  const totalVencido = vencidos.reduce((acc: number, r: any) => acc + (r.valor || 0), 0);
  const taxaInadimplencia = totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;

  let alertasCriados = 0;

  for (const meta of metas) {
    let valorAtual = 0;
    let percentualAtingido = 0;
    let emRisco = false;
    let nivelRisco: 'media' | 'alta' | 'critica' = 'media';
    let mensagem = '';

    switch (meta.tipo) {
      case 'receita':
        valorAtual = totalReceitas;
        percentualAtingido = meta.valor_meta > 0 ? (valorAtual / meta.valor_meta) * 100 : 0;
        // Meta de receita em risco se estamos atrasados em relação ao esperado
        const percentualEsperadoReceita = percentualMesDecorrido * 0.8; // 80% do ritmo esperado
        emRisco = percentualAtingido < percentualEsperadoReceita;
        
        if (emRisco) {
          const falta = meta.valor_meta - valorAtual;
          const diasRestantes = diasNoMes - diaDoMes;
          const mediaIdealDiaria = falta / diasRestantes;
          
          if (percentualAtingido < percentualMesDecorrido * 0.5) {
            nivelRisco = 'critica';
          } else if (percentualAtingido < percentualMesDecorrido * 0.7) {
            nivelRisco = 'alta';
          }
          
          mensagem = `Meta de receita em risco! Atingido R$ ${valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${meta.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentualAtingido.toFixed(1)}%). Faltam R$ ${falta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${diasRestantes} dias.`;
        }
        break;

      case 'despesa':
        valorAtual = totalDespesas;
        percentualAtingido = meta.valor_meta > 0 ? (valorAtual / meta.valor_meta) * 100 : 0;
        // Meta de despesa em risco se gastando mais rápido que o esperado
        emRisco = percentualAtingido > percentualMesDecorrido * 1.1; // 10% acima do ritmo
        
        if (emRisco) {
          const excedente = valorAtual - (meta.valor_meta * (percentualMesDecorrido / 100));
          
          if (percentualAtingido > 100) {
            nivelRisco = 'critica';
          } else if (percentualAtingido > percentualMesDecorrido * 1.3) {
            nivelRisco = 'alta';
          }
          
          mensagem = `Limite de despesas em risco! Gasto R$ ${valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${meta.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentualAtingido.toFixed(1)}%). Você está R$ ${Math.abs(excedente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acima do ritmo ideal.`;
        }
        break;

      case 'inadimplencia':
        valorAtual = taxaInadimplencia;
        percentualAtingido = valorAtual;
        emRisco = taxaInadimplencia > meta.valor_meta * 0.7; // Alerta quando atinge 70% do limite
        
        if (emRisco) {
          if (taxaInadimplencia >= meta.valor_meta) {
            nivelRisco = 'critica';
          } else if (taxaInadimplencia > meta.valor_meta * 0.85) {
            nivelRisco = 'alta';
          }
          
          mensagem = `Taxa de inadimplência em ${taxaInadimplencia.toFixed(1)}% está ${taxaInadimplencia >= meta.valor_meta ? 'acima' : 'próxima'} do limite de ${meta.valor_meta}%. Total vencido: R$ ${totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
        }
        break;
    }

    if (emRisco) {
      // Verificar se já existe alerta similar recente (últimas 24h)
      const ontemISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: alertasExistentes } = await supabase
        .from('alertas')
        .select('id')
        .eq('tipo', 'meta_em_risco')
        .eq('entidade_tipo', 'meta_financeira')
        .eq('entidade_id', meta.id)
        .gte('created_at', ontemISO);

      if (!alertasExistentes || alertasExistentes.length === 0) {
        console.log(`[gerar-alertas] Criando alerta para meta ${meta.tipo} (${meta.id})`);
        
        const { error: insertError } = await supabase
          .from('alertas')
          .insert({
            tipo: 'meta_em_risco',
            titulo: `${meta.titulo} em Risco`,
            mensagem: mensagem,
            prioridade: nivelRisco,
            entidade_tipo: 'meta_financeira',
            entidade_id: meta.id,
            acao_url: '/',
            user_id: userId || meta.created_by,
          });

        if (insertError) {
          console.error('[gerar-alertas] Erro ao criar alerta de meta:', insertError);
        } else {
          alertasCriados++;
        }
      } else {
        console.log(`[gerar-alertas] Alerta para meta ${meta.tipo} já existe nas últimas 24h`);
      }
    }
  }

  console.log(`[gerar-alertas] ${alertasCriados} alertas de metas criados`);
  return alertasCriados;
}
