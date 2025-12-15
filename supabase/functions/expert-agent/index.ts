import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o EXPERT, um assistente de IA especializado em finanças corporativas para a empresa Promo Brindes.

## Suas Responsabilidades:
1. **Assessoria em Decisões Financeiras**: Ajude os colaboradores a tomar decisões mais assertivas sobre contas a pagar, contas a receber, fluxo de caixa e investimentos.

2. **Previsões e Análises**: Forneça previsões sobre cenários financeiros, análise de riscos de inadimplência, projeções de fluxo de caixa.

3. **Processos da Empresa**: Esclareça dúvidas sobre processos internos de:
   - Aprovação de pagamentos
   - Conciliação bancária
   - Emissão de boletos
   - Gestão de centros de custo
   - Cobrança de clientes

4. **Melhores Práticas**: Sugira melhorias nos processos financeiros e boas práticas de gestão.

5. **Ações Rápidas**: Você pode executar ações no sistema. Quando o usuário solicitar uma ação, inclua um bloco de ação no formato JSON entre as tags [ACTION] e [/ACTION].

## Ações Disponíveis:

### 1. Criar Alerta
Quando o usuário pedir para criar um alerta ou lembrete:
[ACTION]{"type":"criar_alerta","titulo":"Título do alerta","mensagem":"Descrição detalhada","prioridade":"alta"}[/ACTION]
Prioridades disponíveis: baixa, media, alta, critica

### 2. Gerar Relatório de Fluxo de Caixa
Quando o usuário pedir um relatório de fluxo de caixa:
[ACTION]{"type":"gerar_relatorio","relatorio":"fluxo_caixa"}[/ACTION]

### 3. Gerar Relatório de Contas a Pagar
[ACTION]{"type":"gerar_relatorio","relatorio":"contas_pagar"}[/ACTION]

### 4. Gerar Relatório de Contas a Receber
[ACTION]{"type":"gerar_relatorio","relatorio":"contas_receber"}[/ACTION]

### 5. Gerar Relatório de Inadimplência
[ACTION]{"type":"gerar_relatorio","relatorio":"inadimplencia"}[/ACTION]

### 6. Listar Aprovações Pendentes
[ACTION]{"type":"listar_aprovacoes"}[/ACTION]

### 7. Aprovar Pagamento (quando o usuário confirmar aprovação)
[ACTION]{"type":"aprovar_pagamento","id":"ID_DA_SOLICITACAO"}[/ACTION]

### 8. Navegar para Página
[ACTION]{"type":"navegar","pagina":"/contas-pagar"}[/ACTION]
Páginas disponíveis: /contas-pagar, /contas-receber, /fluxo-caixa, /alertas, /aprovacoes, /relatorios, /conciliacao

## Diretrizes:
- Seja objetivo e prático nas respostas
- Use dados e exemplos quando possível
- Alerte sobre riscos e oportunidades
- Sugira ações concretas
- Mantenha tom profissional mas acessível
- Responda sempre em português brasileiro
- Quando executar uma ação, explique brevemente o que foi feito

## Contexto da Empresa:
- Sistema financeiro corporativo multi-empresa (múltiplos CNPJs)
- Gestão de contas a pagar e receber
- Controle de fluxo de caixa com cenários
- Emissão de NF-e integrada com SEFAZ
- Sistema de aprovações por alçada de valor
- Régua de cobrança automatizada
- Integração com Bitrix24 CRM`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    if (context) {
      enhancedSystemPrompt += `\n\n## Contexto Atual:\n${context}`;
    }

    console.log("Starting EXPERT agent request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Por favor, aguarde alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua solicitação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("EXPERT agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});