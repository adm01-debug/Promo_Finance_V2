import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DadosFluxo {
  saldo_atual: number;
  saldo_final: number;
  total_receitas: number;
  total_despesas: number;
  dias_projecao: number;
  dias_cobertura: number;
  dias_negativos: number;
  probabilidade_ruptura: number;
  cenario: string;
  variacao_saldo: number;
  margem_operacional: number;
}

interface Insight {
  tipo: 'alerta' | 'oportunidade' | 'recomendacao';
  titulo: string;
  descricao: string;
  impacto?: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const dados: DadosFluxo = await req.json();
    console.log('Dados recebidos para análise:', dados);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const prompt = `Você é um CFO especialista em análise financeira. Analise os seguintes dados de fluxo de caixa e forneça insights acionáveis.

DADOS DO FLUXO DE CAIXA:
- Saldo Atual: R$ ${dados.saldo_atual.toLocaleString('pt-BR')}
- Saldo Projetado Final: R$ ${dados.saldo_final.toLocaleString('pt-BR')}
- Variação: R$ ${dados.variacao_saldo.toLocaleString('pt-BR')}
- Total Receitas Previstas: R$ ${dados.total_receitas.toLocaleString('pt-BR')}
- Total Despesas Previstas: R$ ${dados.total_despesas.toLocaleString('pt-BR')}
- Margem Operacional: ${dados.margem_operacional.toFixed(1)}%
- Período de Projeção: ${dados.dias_projecao} dias
- Dias de Cobertura: ${dados.dias_cobertura} dias
- Dias com Saldo Negativo: ${dados.dias_negativos}
- Probabilidade de Ruptura: ${dados.probabilidade_ruptura.toFixed(1)}%
- Cenário Analisado: ${dados.cenario}

REGRAS:
1. Retorne APENAS um JSON válido, sem markdown
2. Score de saúde de 0 a 100 baseado nos indicadores
3. Insights devem ser específicos e acionáveis
4. Priorize alertas de risco
5. Sugira ações concretas`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um CFO especialista. Responda APENAS com JSON válido seguindo a estrutura: {"resumo": "string", "insights": [{"tipo": "alerta|oportunidade|recomendacao", "titulo": "string", "descricao": "string", "impacto": "string opcional", "prioridade": "alta|media|baixa"}], "acoes_sugeridas": ["string"], "score_saude": number}'
          },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analise_fluxo",
              description: "Retorna análise estruturada do fluxo de caixa",
              parameters: {
                type: "object",
                properties: {
                  resumo: {
                    type: "string",
                    description: "Resumo executivo da situação financeira em 1-2 frases"
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tipo: { type: "string", enum: ["alerta", "oportunidade", "recomendacao"] },
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        impacto: { type: "string" },
                        prioridade: { type: "string", enum: ["alta", "media", "baixa"] }
                      },
                      required: ["tipo", "titulo", "descricao", "prioridade"]
                    }
                  },
                  acoes_sugeridas: {
                    type: "array",
                    items: { type: "string" }
                  },
                  score_saude: {
                    type: "number",
                    description: "Score de saúde financeira de 0 a 100"
                  }
                },
                required: ["resumo", "insights", "acoes_sugeridas", "score_saude"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analise_fluxo" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Lovable AI:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const aiData = await response.json();
    console.log('Resposta da IA:', JSON.stringify(aiData, null, 2));

    // Extrair argumentos do tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const analise = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(analise), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: tentar parsear da mensagem
    const content = aiData.choices?.[0]?.message?.content;
    if (content) {
      try {
        const analise = JSON.parse(content);
        return new Response(JSON.stringify(analise), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        console.log('Não foi possível parsear como JSON, gerando análise padrão');
      }
    }

    // Fallback com análise básica
    const analiseFallback = gerarAnaliseFallback(dados);
    return new Response(JSON.stringify(analiseFallback), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na análise de fluxo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function gerarAnaliseFallback(dados: DadosFluxo) {
  const insights: Insight[] = [];
  const acoes: string[] = [];
  let score = 70;

  // Análise de cobertura
  if (dados.dias_cobertura < 7) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Cobertura de Caixa Crítica',
      descricao: `Apenas ${dados.dias_cobertura} dias de cobertura. Risco alto de ruptura de caixa.`,
      impacto: 'Pode comprometer operações essenciais',
      prioridade: 'alta'
    });
    acoes.push('Antecipar recebíveis com desconto ou negociar linha de crédito emergencial');
    score -= 25;
  } else if (dados.dias_cobertura < 15) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Cobertura de Caixa Baixa',
      descricao: `${dados.dias_cobertura} dias de cobertura está abaixo do ideal de 30 dias.`,
      prioridade: 'media'
    });
    score -= 10;
  }

  // Análise de ruptura
  if (dados.probabilidade_ruptura > 30) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Alto Risco de Ruptura',
      descricao: `Probabilidade de ${dados.probabilidade_ruptura.toFixed(0)}% de saldo negativo no período.`,
      impacto: 'Pode gerar juros por uso de cheque especial',
      prioridade: 'alta'
    });
    acoes.push('Revisar cronograma de pagamentos e postergar despesas não essenciais');
    score -= 15;
  }

  // Análise de margem
  if (dados.margem_operacional > 15) {
    insights.push({
      tipo: 'oportunidade',
      titulo: 'Margem Operacional Saudável',
      descricao: `Margem de ${dados.margem_operacional.toFixed(1)}% indica boa gestão de custos.`,
      prioridade: 'baixa'
    });
    score += 10;
  } else if (dados.margem_operacional < 5) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Margem Operacional Apertada',
      descricao: `Margem de apenas ${dados.margem_operacional.toFixed(1)}%. Pouco espaço para imprevistos.`,
      prioridade: 'media'
    });
    acoes.push('Revisar contratos de fornecedores e buscar renegociações');
    score -= 10;
  }

  // Análise de variação
  if (dados.variacao_saldo > 0) {
    insights.push({
      tipo: 'oportunidade',
      titulo: 'Tendência de Crescimento',
      descricao: `Projeção de aumento de R$ ${dados.variacao_saldo.toLocaleString('pt-BR')} no saldo.`,
      prioridade: 'baixa'
    });
  } else if (dados.variacao_saldo < -50000) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Queima de Caixa Elevada',
      descricao: `Redução projetada de R$ ${Math.abs(dados.variacao_saldo).toLocaleString('pt-BR')} no período.`,
      impacto: 'Necessidade de captação ou redução de custos',
      prioridade: 'alta'
    });
    acoes.push('Mapear despesas cortáveis e acelerar ciclo de recebimento');
  }

  // Recomendação geral
  insights.push({
    tipo: 'recomendacao',
    titulo: 'Monitoramento Contínuo',
    descricao: 'Acompanhe diariamente as movimentações e ajuste projeções conforme realizações.',
    prioridade: 'baixa'
  });

  if (acoes.length === 0) {
    acoes.push('Manter política de cobrança proativa para reduzir inadimplência');
    acoes.push('Revisar periodicamente contratos de fornecedores recorrentes');
  }

  // Normalizar score
  score = Math.max(0, Math.min(100, score));

  // Gerar resumo
  let resumo = '';
  if (score >= 80) {
    resumo = 'Fluxo de caixa saudável com boa previsibilidade. Mantenha o monitoramento regular.';
  } else if (score >= 60) {
    resumo = 'Situação estável, mas com pontos de atenção. Recomendamos ações preventivas.';
  } else if (score >= 40) {
    resumo = 'Atenção requerida. Existem riscos que precisam ser mitigados no curto prazo.';
  } else {
    resumo = 'Situação crítica. Ação imediata necessária para evitar ruptura de caixa.';
  }

  return {
    resumo,
    insights,
    acoes_sugeridas: acoes,
    score_saude: score
  };
}
