import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for manual execution with specific report ID
    let relatorioId: string | null = null;
    try {
      const body = await req.json();
      relatorioId = body?.relatorio_id || null;
    } catch {
      // No body or invalid JSON - proceed with scheduled execution
    }

    if (relatorioId) {
      console.log(`[executar-relatorios] Execução manual do relatório: ${relatorioId}`);
    } else {
      console.log('[executar-relatorios] Iniciando execução de relatórios agendados...');
    }

    // Buscar relatórios que precisam ser executados
    const agora = new Date().toISOString();
    let query = supabase.from('relatorios_agendados').select('*');

    if (relatorioId) {
      // Manual execution - fetch specific report
      query = query.eq('id', relatorioId);
    } else {
      // Scheduled execution - fetch due reports
      query = query.eq('ativo', true).lte('proximo_envio', agora);
    }

    const { data: relatoriosParaExecutar, error: fetchError } = await query;

    if (fetchError) {
      console.error('[executar-relatorios] Erro ao buscar relatórios:', fetchError);
      throw fetchError;
    }

    console.log(`[executar-relatorios] Encontrados ${relatoriosParaExecutar?.length || 0} relatórios para executar`);

    const resultados = [];

    for (const relatorio of relatoriosParaExecutar || []) {
      console.log(`[executar-relatorios] Executando: ${relatorio.nome} (${relatorio.tipo_relatorio})`);

      try {
        // Gerar os dados do relatório
        const dadosRelatorio = await gerarDadosRelatorio(supabase, relatorio);

        // Salvar no histórico
        const { error: historicoError } = await supabase
          .from('historico_relatorios')
          .insert({
            relatorio_agendado_id: relatorio.id,
            status: 'gerado',
            dados_relatorio: dadosRelatorio,
          });

        if (historicoError) {
          console.error(`[executar-relatorios] Erro ao salvar histórico:`, historicoError);
        }

        // Calcular próxima execução
        const proximoEnvio = calcularProximoEnvio(
          relatorio.frequencia,
          relatorio.hora_execucao,
          relatorio.dia_semana,
          relatorio.dia_mes
        );

        // Atualizar o relatório agendado
        const { error: updateError } = await supabase
          .from('relatorios_agendados')
          .update({
            ultimo_envio: agora,
            proximo_envio: proximoEnvio,
          })
          .eq('id', relatorio.id);

        if (updateError) {
          console.error(`[executar-relatorios] Erro ao atualizar relatório:`, updateError);
        }

        resultados.push({
          id: relatorio.id,
          nome: relatorio.nome,
          status: 'sucesso',
          proximo_envio: proximoEnvio,
        });

        console.log(`[executar-relatorios] Relatório ${relatorio.nome} executado com sucesso`);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error(`[executar-relatorios] Erro ao executar ${relatorio.nome}:`, err);

        // Salvar erro no histórico
        await supabase
          .from('historico_relatorios')
          .insert({
            relatorio_agendado_id: relatorio.id,
            status: 'erro',
            erro_mensagem: errorMessage,
          });

        resultados.push({
          id: relatorio.id,
          nome: relatorio.nome,
          status: 'erro',
          erro: errorMessage,
        });
      }
    }

    console.log(`[executar-relatorios] Execução finalizada. ${resultados.length} relatórios processados.`);

    return new Response(
      JSON.stringify({
        success: true,
        executados: resultados.length,
        resultados,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[executar-relatorios] Erro geral:', err);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gerarDadosRelatorio(supabase: any, relatorio: any) {
  const empresaFilter = relatorio.empresa_id;
  const centroCustoFilter = relatorio.centro_custo_id;

  switch (relatorio.tipo_relatorio) {
    case 'fluxo_caixa':
      return await gerarFluxoCaixa(supabase, empresaFilter);
    case 'contas_pagar':
      return await gerarContasPagar(supabase, empresaFilter, centroCustoFilter);
    case 'contas_receber':
      return await gerarContasReceber(supabase, empresaFilter, centroCustoFilter);
    case 'dre':
      return await gerarDRE(supabase, empresaFilter);
    case 'balanco':
      return await gerarBalanco(supabase, empresaFilter);
    case 'inadimplencia':
      return await gerarInadimplencia(supabase, empresaFilter);
    default:
      throw new Error(`Tipo de relatório não suportado: ${relatorio.tipo_relatorio}`);
  }
}

async function gerarFluxoCaixa(supabase: any, empresaId: string | null) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

  let queryReceber = supabase
    .from('contas_receber')
    .select('valor, valor_recebido, status, data_vencimento')
    .gte('data_vencimento', inicioMes)
    .lte('data_vencimento', fimMes);

  let queryPagar = supabase
    .from('contas_pagar')
    .select('valor, valor_pago, status, data_vencimento')
    .gte('data_vencimento', inicioMes)
    .lte('data_vencimento', fimMes);

  if (empresaId) {
    queryReceber = queryReceber.eq('empresa_id', empresaId);
    queryPagar = queryPagar.eq('empresa_id', empresaId);
  }

  const [receberRes, pagarRes] = await Promise.all([queryReceber, queryPagar]);

  const totalReceber = receberRes.data?.reduce((acc: number, c: any) => acc + Number(c.valor), 0) || 0;
  const totalRecebido = receberRes.data?.reduce((acc: number, c: any) => acc + Number(c.valor_recebido || 0), 0) || 0;
  const totalPagar = pagarRes.data?.reduce((acc: number, c: any) => acc + Number(c.valor), 0) || 0;
  const totalPago = pagarRes.data?.reduce((acc: number, c: any) => acc + Number(c.valor_pago || 0), 0) || 0;

  return {
    periodo: { inicio: inicioMes, fim: fimMes },
    receitas: {
      previsto: totalReceber,
      realizado: totalRecebido,
      pendente: totalReceber - totalRecebido,
    },
    despesas: {
      previsto: totalPagar,
      realizado: totalPago,
      pendente: totalPagar - totalPago,
    },
    saldo: {
      previsto: totalReceber - totalPagar,
      realizado: totalRecebido - totalPago,
    },
    gerado_em: new Date().toISOString(),
  };
}

async function gerarContasPagar(supabase: any, empresaId: string | null, centroCustoId: string | null) {
  let query = supabase
    .from('contas_pagar')
    .select('id, descricao, fornecedor_nome, valor, valor_pago, status, data_vencimento, data_pagamento')
    .order('data_vencimento', { ascending: true })
    .limit(100);

  if (empresaId) query = query.eq('empresa_id', empresaId);
  if (centroCustoId) query = query.eq('centro_custo_id', centroCustoId);

  const { data, error } = await query;
  if (error) throw error;

  const resumo = {
    total: data?.length || 0,
    valor_total: data?.reduce((acc: number, c: any) => acc + Number(c.valor), 0) || 0,
    valor_pago: data?.reduce((acc: number, c: any) => acc + Number(c.valor_pago || 0), 0) || 0,
    por_status: {} as Record<string, number>,
  };

  data?.forEach((conta: any) => {
    resumo.por_status[conta.status] = (resumo.por_status[conta.status] || 0) + 1;
  });

  return {
    resumo,
    contas: data,
    gerado_em: new Date().toISOString(),
  };
}

async function gerarContasReceber(supabase: any, empresaId: string | null, centroCustoId: string | null) {
  let query = supabase
    .from('contas_receber')
    .select('id, descricao, cliente_nome, valor, valor_recebido, status, data_vencimento, data_recebimento')
    .order('data_vencimento', { ascending: true })
    .limit(100);

  if (empresaId) query = query.eq('empresa_id', empresaId);
  if (centroCustoId) query = query.eq('centro_custo_id', centroCustoId);

  const { data, error } = await query;
  if (error) throw error;

  const resumo = {
    total: data?.length || 0,
    valor_total: data?.reduce((acc: number, c: any) => acc + Number(c.valor), 0) || 0,
    valor_recebido: data?.reduce((acc: number, c: any) => acc + Number(c.valor_recebido || 0), 0) || 0,
    por_status: {} as Record<string, number>,
  };

  data?.forEach((conta: any) => {
    resumo.por_status[conta.status] = (resumo.por_status[conta.status] || 0) + 1;
  });

  return {
    resumo,
    contas: data,
    gerado_em: new Date().toISOString(),
  };
}

async function gerarDRE(supabase: any, empresaId: string | null) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

  let queryReceber = supabase
    .from('contas_receber')
    .select('valor_recebido')
    .eq('status', 'pago')
    .gte('data_recebimento', inicioMes)
    .lte('data_recebimento', fimMes);

  let queryPagar = supabase
    .from('contas_pagar')
    .select('valor_pago')
    .eq('status', 'pago')
    .gte('data_pagamento', inicioMes)
    .lte('data_pagamento', fimMes);

  if (empresaId) {
    queryReceber = queryReceber.eq('empresa_id', empresaId);
    queryPagar = queryPagar.eq('empresa_id', empresaId);
  }

  const [receberRes, pagarRes] = await Promise.all([queryReceber, queryPagar]);

  const receitaBruta = receberRes.data?.reduce((acc: number, c: any) => acc + Number(c.valor_recebido || 0), 0) || 0;
  const despesasOperacionais = pagarRes.data?.reduce((acc: number, c: any) => acc + Number(c.valor_pago || 0), 0) || 0;
  const lucroOperacional = receitaBruta - despesasOperacionais;

  return {
    periodo: { inicio: inicioMes, fim: fimMes },
    receita_bruta: receitaBruta,
    deducoes: 0,
    receita_liquida: receitaBruta,
    custos: 0,
    lucro_bruto: receitaBruta,
    despesas_operacionais: despesasOperacionais,
    lucro_operacional: lucroOperacional,
    resultado_financeiro: 0,
    lucro_liquido: lucroOperacional,
    gerado_em: new Date().toISOString(),
  };
}

async function gerarBalanco(supabase: any, empresaId: string | null) {
  let queryContas = supabase
    .from('contas_bancarias')
    .select('saldo_atual, saldo_disponivel');

  let queryReceber = supabase
    .from('contas_receber')
    .select('valor, valor_recebido')
    .in('status', ['pendente', 'parcial']);

  let queryPagar = supabase
    .from('contas_pagar')
    .select('valor, valor_pago')
    .in('status', ['pendente', 'parcial']);

  if (empresaId) {
    queryContas = queryContas.eq('empresa_id', empresaId);
    queryReceber = queryReceber.eq('empresa_id', empresaId);
    queryPagar = queryPagar.eq('empresa_id', empresaId);
  }

  const [contasRes, receberRes, pagarRes] = await Promise.all([queryContas, queryReceber, queryPagar]);

  const disponibilidades = contasRes.data?.reduce((acc: number, c: any) => acc + Number(c.saldo_atual), 0) || 0;
  const contasAReceber = receberRes.data?.reduce((acc: number, c: any) => acc + (Number(c.valor) - Number(c.valor_recebido || 0)), 0) || 0;
  const contasAPagar = pagarRes.data?.reduce((acc: number, c: any) => acc + (Number(c.valor) - Number(c.valor_pago || 0)), 0) || 0;

  const ativoCirculante = disponibilidades + contasAReceber;
  const passivoCirculante = contasAPagar;
  const patrimonioLiquido = ativoCirculante - passivoCirculante;

  return {
    ativo: {
      circulante: {
        disponibilidades,
        contas_a_receber: contasAReceber,
        total: ativoCirculante,
      },
      nao_circulante: { total: 0 },
      total: ativoCirculante,
    },
    passivo: {
      circulante: {
        contas_a_pagar: contasAPagar,
        total: passivoCirculante,
      },
      nao_circulante: { total: 0 },
      total: passivoCirculante,
    },
    patrimonio_liquido: patrimonioLiquido,
    gerado_em: new Date().toISOString(),
  };
}

async function gerarInadimplencia(supabase: any, empresaId: string | null) {
  const hoje = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('contas_receber')
    .select('id, cliente_nome, valor, valor_recebido, data_vencimento, status')
    .eq('status', 'vencido')
    .lt('data_vencimento', hoje);

  if (empresaId) query = query.eq('empresa_id', empresaId);

  const { data: vencidos, error } = await query;
  if (error) throw error;

  let queryTotal = supabase
    .from('contas_receber')
    .select('valor');

  if (empresaId) queryTotal = queryTotal.eq('empresa_id', empresaId);

  const { data: todas } = await queryTotal;

  const valorTotal = todas?.reduce((acc: number, c: any) => acc + Number(c.valor), 0) || 0;
  const valorVencido = vencidos?.reduce((acc: number, c: any) => acc + (Number(c.valor) - Number(c.valor_recebido || 0)), 0) || 0;
  const taxaInadimplencia = valorTotal > 0 ? (valorVencido / valorTotal) * 100 : 0;

  // Agrupar por cliente
  const porCliente: Record<string, { nome: string; valor: number; quantidade: number }> = {};
  vencidos?.forEach((conta: any) => {
    const valorPendente = Number(conta.valor) - Number(conta.valor_recebido || 0);
    if (!porCliente[conta.cliente_nome]) {
      porCliente[conta.cliente_nome] = { nome: conta.cliente_nome, valor: 0, quantidade: 0 };
    }
    porCliente[conta.cliente_nome].valor += valorPendente;
    porCliente[conta.cliente_nome].quantidade += 1;
  });

  const clientesInadimplentes = Object.values(porCliente)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  return {
    resumo: {
      total_vencido: valorVencido,
      quantidade_vencidos: vencidos?.length || 0,
      taxa_inadimplencia: taxaInadimplencia,
      valor_carteira: valorTotal,
    },
    clientes_inadimplentes: clientesInadimplentes,
    detalhes: vencidos?.slice(0, 50),
    gerado_em: new Date().toISOString(),
  };
}

function calcularProximoEnvio(
  frequencia: string,
  hora: string,
  diaSemana: number | null,
  diaMes: number | null
): string {
  const agora = new Date();
  const [horas, minutos] = hora.split(':').map(Number);

  let proximo = new Date(agora);
  proximo.setHours(horas, minutos, 0, 0);

  // Sempre avançar para o próximo período
  switch (frequencia) {
    case 'diario':
      proximo.setDate(proximo.getDate() + 1);
      break;
    case 'semanal':
      proximo.setDate(proximo.getDate() + 7);
      if (diaSemana !== null) {
        const diaAtual = proximo.getDay();
        const diff = (diaSemana - diaAtual + 7) % 7;
        proximo.setDate(proximo.getDate() + diff);
      }
      break;
    case 'mensal':
      proximo.setMonth(proximo.getMonth() + 1);
      if (diaMes !== null) {
        proximo.setDate(Math.min(diaMes, new Date(proximo.getFullYear(), proximo.getMonth() + 1, 0).getDate()));
      }
      break;
  }

  return proximo.toISOString();
}
