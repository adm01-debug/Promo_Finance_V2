import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { exigirChamadaInterna } from '../_shared/auth-guard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
};

interface ResultadoEmpresa {
  empresa_id: string;
  analise_id?: string;
  score?: number;
  alertas_gerados: number;
  recomendacoes_geradas: number;
}

/**
 * Roda a análise preditiva de UMA empresa.
 *
 * Antes esta lógica vivia direto no handler e lia as tabelas financeiras sem
 * `empresa_id`, com client service-role (que ignora RLS): o resultado misturava
 * todos os tenants num único registro — que ainda por cima era gravado com
 * `empresa_id` nulo. Cada execução agora é fechada em um tenant.
 */
async function analisarEmpresa(
  supabase: SupabaseClient,
  empresaId: string,
  LOVABLE_API_KEY: string
): Promise<ResultadoEmpresa> {
  // Buscar dados financeiros para análise
  const hoje = new Date();
  const tresMesesAtras = new Date(hoje);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

  const [contasReceber, contasPagar, clientes, transacoes, metas] = await Promise.all([
    supabase
      .from('contas_receber')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_vencimento'),
    supabase.from('contas_pagar').select('*').eq('empresa_id', empresaId).order('data_vencimento'),
    supabase.from('clientes').select('*').eq('empresa_id', empresaId),
    supabase
      .from('transacoes_bancarias')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('data', tresMesesAtras.toISOString().split('T')[0])
      .order('data'),
    supabase.from('metas_financeiras').select('*').eq('empresa_id', empresaId).eq('ativo', true),
  ]);

  if (contasReceber.error) throw contasReceber.error;
  if (contasPagar.error) throw contasPagar.error;
  if (clientes.error) throw clientes.error;

  console.log('[executar-analise-preditiva] Dados carregados:', {
    contasReceber: contasReceber.data?.length,
    contasPagar: contasPagar.data?.length,
    clientes: clientes.data?.length,
    transacoes: transacoes.data?.length,
    metas: metas.data?.length,
  });

  // Preparar contexto para a IA
  const hojeStr = hoje.toISOString().split('T')[0];

  const recebiveisData = contasReceber.data.map((cr) => ({
    cliente: cr.cliente_nome,
    valor: cr.valor,
    vencimento: cr.data_vencimento,
    status: cr.status,
    etapa_cobranca: cr.etapa_cobranca,
    valor_recebido: cr.valor_recebido || 0,
  }));

  const pagaveisData = contasPagar.data.map((cp) => ({
    fornecedor: cp.fornecedor_nome,
    valor: cp.valor,
    vencimento: cp.data_vencimento,
    status: cp.status,
    valor_pago: cp.valor_pago || 0,
  }));

  const clientesData = clientes.data.map((c) => ({
    nome: c.razao_social,
    score: c.score,
    limite_credito: c.limite_credito,
  }));

  // Agrupar transações por mês
  const transacoesPorMes = (transacoes.data || []).reduce(
    (acc: Record<string, { receitas: number; despesas: number }>, t) => {
      const mes = t.data.substring(0, 7);
      if (!acc[mes]) acc[mes] = { receitas: 0, despesas: 0 };
      if (t.tipo === 'receita') {
        acc[mes].receitas += Number(t.valor);
      } else {
        acc[mes].despesas += Number(t.valor);
      }
      return acc;
    },
    {}
  );

  // Dados de metas para recomendações
  const metasData = (metas.data || []).map((m) => ({
    tipo: m.tipo,
    titulo: m.titulo,
    valor_meta: m.valor_meta,
    mes: m.mes,
    ano: m.ano,
  }));

  const prompt = `Você é um analista financeiro expert. Analise os dados e forneça uma análise preditiva completa.

DATA ATUAL: ${hojeStr}

CONTAS A RECEBER (${recebiveisData.length}):
${JSON.stringify(recebiveisData.slice(0, 50), null, 2)}

CONTAS A PAGAR (${pagaveisData.length}):
${JSON.stringify(pagaveisData.slice(0, 50), null, 2)}

CLIENTES (${clientesData.length}):
${JSON.stringify(clientesData.slice(0, 30), null, 2)}

HISTÓRICO TRANSAÇÕES:
${JSON.stringify(transacoesPorMes, null, 2)}

METAS ATUAIS:
${JSON.stringify(metasData, null, 2)}

Responda em JSON:
{
  "resumo_executivo": "texto",
  "score_saude_financeira": 0-100,
  "indicadores": {
  "prazo_medio_recebimento": "X dias",
  "prazo_medio_pagamento": "X dias",
  "ciclo_financeiro": "X dias",
  "liquidez_corrente": "X.XX",
  "cobertura_despesas": "X meses",
  "taxa_inadimplencia": "X%",
  "margem_liquida": "X%"
  },
  "tendencias": {
  "receitas": {"tendencia": "crescente/estável/decrescente", "variacao_percentual": "X%"},
  "despesas": {"tendencia": "crescente/estável/decrescente", "variacao_percentual": "X%"},
  "inadimplencia": {"tendencia": "crescente/estável/decrescente", "variacao_percentual": "X%"}
  },
  "projecoes": {
  "proximos_7_dias": {"entradas": 0, "saidas": 0, "saldo": 0},
  "proximos_30_dias": {"entradas": 0, "saidas": 0, "saldo": 0},
  "proximos_90_dias": {"entradas": 0, "saidas": 0, "saldo": 0}
  },
  "alertas": [
  {"tipo": "ruptura|inadimplencia_provavel|concentracao_risco|tendencia_negativa", "titulo": "texto", "descricao": "texto", "probabilidade": 0-100, "impacto_estimado": 0, "prioridade": "baixa|media|alta|critica", "sugestoes": ["ação1", "ação2"]}
  ],
  "recomendacoes_metas": [
  {"tipo_meta": "receita|despesa|lucro", "valor_sugerido": 0, "justificativa": "texto", "confianca": 0-100}
  ],
  "acoes_recomendadas": ["ação1", "ação2", "ação3"]
}

IMPORTANTE: Use valores numéricos reais. Responda APENAS com JSON válido.`;

  console.log('[executar-analise-preditiva] Chamando IA...');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um analista financeiro expert. Responda em JSON válido.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[executar-analise-preditiva] Erro IA:', response.status, errorText);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in AI response');
  }

  let analise;
  try {
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    analise = JSON.parse(cleanContent);
  } catch (parseError) {
    console.error('[executar-analise-preditiva] Erro parse:', content);
    throw new Error('Invalid JSON response from AI');
  }

  console.log('[executar-analise-preditiva] Análise recebida, salvando...');

  // Salvar análise preditiva
  const { data: analiseRecord, error: analiseError } = await supabase
    .from('historico_analises_preditivas')
    .insert({
      empresa_id: empresaId,
      score_saude_financeira: analise.score_saude_financeira || 50,
      resumo_executivo: analise.resumo_executivo,
      analise_completa: analise,
      dados_analisados: {
        contas_receber: recebiveisData.length,
        contas_pagar: pagaveisData.length,
        clientes: clientesData.length,
        meses_historico: Object.keys(transacoesPorMes).length,
      },
      projecoes: analise.projecoes,
      alertas_gerados: analise.alertas?.length || 0,
    })
    .select()
    .single();

  if (analiseError) {
    console.error('[executar-analise-preditiva] Erro salvar análise:', analiseError);
  }

  // Salvar score de saúde
  const { error: scoreError } = await supabase.from('historico_score_saude').insert({
    empresa_id: empresaId,
    score: analise.score_saude_financeira || 50,
    indicadores: analise.indicadores,
    observacoes: analise.resumo_executivo,
  });

  if (scoreError) {
    console.error('[executar-analise-preditiva] Erro salvar score:', scoreError);
  }

  // Salvar alertas preditivos
  const alertasParaSalvar = (analise.alertas || []).map((alerta: any) => ({
    empresa_id: empresaId,
    tipo: alerta.tipo || 'tendencia_negativa',
    titulo: alerta.titulo,
    descricao: alerta.descricao,
    probabilidade: alerta.probabilidade,
    impacto_estimado: alerta.impacto_estimado,
    data_previsao:
      alerta.data_previsao ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sugestoes: alerta.sugestoes,
    prioridade: alerta.prioridade || 'media',
    analise_preditiva_id: analiseRecord?.id,
  }));

  if (alertasParaSalvar.length > 0) {
    const { error: alertasError } = await supabase
      .from('alertas_preditivos')
      .insert(alertasParaSalvar);

    if (alertasError) {
      console.error('[executar-analise-preditiva] Erro salvar alertas:', alertasError);
    } else {
      console.log(`[executar-analise-preditiva] ${alertasParaSalvar.length} alertas salvos`);
    }

    // Enviar push notifications para alertas críticos
    const alertasCriticos = alertasParaSalvar.filter(
      (a: any) => a.prioridade === 'critica' || a.prioridade === 'alta'
    );
    // `send-push-notification` recusa chamada interna sem `userId` (422) para
    // não virar broadcast global — sem destinatário explícito estes pushes nunca
    // eram entregues. Endereçamos os usuários vinculados a esta empresa.
    const { data: vinculos } = await supabase
      .from('user_empresas')
      .select('user_id')
      .eq('empresa_id', empresaId)
      .eq('ativo', true);
    const destinatarios = (vinculos ?? []).map((v: { user_id: string }) => v.user_id);

    for (const alerta of alertasCriticos) {
      for (const destinatario of destinatarios) {
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: destinatario,
              title: `⚠️ ${alerta.titulo}`,
              body: alerta.descricao,
              tag: `alerta-preditivo-${alerta.tipo}`,
              data: { url: '/alertas' },
              prioridade: alerta.prioridade,
            },
          });
        } catch (pushError) {
          console.error('[executar-analise-preditiva] Erro push:', pushError);
        }
      }
    }
  }

  // Salvar recomendações de metas
  const recomendacoesParaSalvar = (analise.recomendacoes_metas || []).map((rec: any) => ({
    empresa_id: empresaId,
    tipo_meta: rec.tipo_meta,
    valor_sugerido: rec.valor_sugerido,
    justificativa: rec.justificativa,
    baseado_em: { indicadores: analise.indicadores, tendencias: analise.tendencias },
    confianca: rec.confianca,
    periodo_referencia_inicio: new Date().toISOString().split('T')[0],
    periodo_referencia_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  }));

  if (recomendacoesParaSalvar.length > 0) {
    const { error: recError } = await supabase
      .from('recomendacoes_metas_ia')
      .insert(recomendacoesParaSalvar);

    if (recError) {
      console.error('[executar-analise-preditiva] Erro salvar recomendações:', recError);
    } else {
      console.log(
        `[executar-analise-preditiva] ${recomendacoesParaSalvar.length} recomendações salvas`
      );
    }
  }

  return {
    empresa_id: empresaId,
    analise_id: analiseRecord?.id,
    score: analise.score_saude_financeira,
    alertas_gerados: alertasParaSalvar.length,
    recomendacoes_geradas: recomendacoesParaSalvar.length,
  };
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await exigirChamadaInterna(req, 'executar_analise_preditiva');
  if (!auth.ok) return auth.resposta;

  try {
    console.log('[executar-analise-preditiva] Iniciando análise preditiva agendada...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: empresas, error: empresasErr } = await supabase
      .from('empresas')
      .select('id')
      .eq('ativo', true);
    if (empresasErr) throw empresasErr;

    const empresaIds = (empresas ?? []).map((e: { id: string }) => e.id);
    console.log(`[executar-analise-preditiva] ${empresaIds.length} empresas ativas`);

    // Uma empresa que falhe não pode derrubar as demais: o job é agendado e
    // precisa entregar o máximo possível por execução.
    const resultados: ResultadoEmpresa[] = [];
    const falhas: { empresa_id: string; erro: string }[] = [];
    for (const empresaId of empresaIds) {
      try {
        resultados.push(await analisarEmpresa(supabase, empresaId, LOVABLE_API_KEY));
      } catch (erro) {
        const msg = erro instanceof Error ? erro.message : 'Erro desconhecido';
        console.error(`[executar-analise-preditiva] Falha na empresa ${empresaId}:`, msg);
        falhas.push({ empresa_id: empresaId, erro: msg });
      }
    }

    console.log('[executar-analise-preditiva] Análise concluída com sucesso!');

    return new Response(
      JSON.stringify({
        success: falhas.length === 0,
        empresas_processadas: resultados.length,
        empresas_com_falha: falhas.length,
        resultados,
        falhas,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[executar-analise-preditiva] Erro:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

if (import.meta.main) serve(handler);
