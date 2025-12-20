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

6. **Sugestões Proativas**: Com base nos dados financeiros fornecidos no contexto, identifique padrões e faça sugestões proativas para melhorar a saúde financeira da empresa.

## Ações Disponíveis:

### 1. Criar Alerta
[ACTION]{"type":"criar_alerta","titulo":"Título do alerta","mensagem":"Descrição detalhada","prioridade":"alta"}[/ACTION]
Prioridades: baixa, media, alta, critica

### 2. Gerar Relatórios
[ACTION]{"type":"gerar_relatorio","relatorio":"fluxo_caixa"}[/ACTION]
Relatórios: fluxo_caixa, contas_pagar, contas_receber, inadimplencia

### 3. Listar Aprovações Pendentes
[ACTION]{"type":"listar_aprovacoes"}[/ACTION]

### 4. Aprovar Pagamento
[ACTION]{"type":"aprovar_pagamento","id":"ID_DA_SOLICITACAO"}[/ACTION]

### 5. Navegar para Página
[ACTION]{"type":"navegar","pagina":"/contas-pagar"}[/ACTION]
Páginas: /contas-pagar, /contas-receber, /fluxo-caixa, /alertas, /aprovacoes, /relatorios, /conciliacao, /clientes, /fornecedores, /boletos

### 6. Consultar Saldos Bancários
[ACTION]{"type":"consultar_saldos"}[/ACTION]

### 7. Criar Conta a Pagar
[ACTION]{"type":"criar_conta_pagar","fornecedor_nome":"Nome","descricao":"Descrição","valor":1000,"data_vencimento":"2024-12-31","tipo_cobranca":"boleto"}[/ACTION]

### 8. Criar Conta a Receber
[ACTION]{"type":"criar_conta_receber","cliente_nome":"Nome","descricao":"Descrição","valor":1000,"data_vencimento":"2024-12-31","tipo_cobranca":"boleto"}[/ACTION]

### 9. Consultar Cliente
[ACTION]{"type":"consultar_cliente","cliente_nome":"Nome do cliente"}[/ACTION]

### 10. Consultar Fornecedor
[ACTION]{"type":"consultar_fornecedor","fornecedor_nome":"Nome do fornecedor"}[/ACTION]

### 11. Analisar Fluxo de Caixa
[ACTION]{"type":"analisar_fluxo","periodo":"30"}[/ACTION]

### 12. Agendar Cobrança
[ACTION]{"type":"agendar_cobranca","id":"ID_CONTA_RECEBER"}[/ACTION]

### 13. Consultar Vencimentos
[ACTION]{"type":"consultar_vencimentos","periodo":"7"}[/ACTION]

### 14. Gerar Boleto
[ACTION]{"type":"gerar_boleto","id":"ID_CONTA_RECEBER"}[/ACTION]

### 15. Atualizar Score de Cliente
[ACTION]{"type":"atualizar_score_cliente","id":"ID_CLIENTE","novo_score":85}[/ACTION]

## Diretrizes para Sugestões Proativas:
Analise o contexto financeiro fornecido e sugira ações quando identificar:
- **Risco de Ruptura**: Se saldo projetado ficar negativo, alerte imediatamente
- **Alta Inadimplência**: Se taxa > 5%, sugira intensificar cobranças
- **Concentração de Vencimentos**: Se muitos títulos vencem na mesma data, sugira renegociação
- **Clientes de Risco**: Se há clientes com score baixo e valores altos em aberto, alerte
- **Oportunidades**: Se há desconto para pagamento antecipado disponível, avise

## Memória de Contexto:
Você tem acesso ao histórico da conversa atual. Use-o para:
- Manter continuidade nas respostas
- Evitar repetir informações já fornecidas
- Entender preferências do usuário
- Dar seguimento a ações iniciadas anteriormente

## Diretrizes Gerais:
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
    const { messages, context, conversationSummary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt with memory
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    
    if (conversationSummary) {
      enhancedSystemPrompt += `\n\n## Resumo da Conversa Anterior:\n${conversationSummary}`;
    }
    
    if (context) {
      enhancedSystemPrompt += `\n\n## Contexto Financeiro Atual:\n${context}`;
      
      // Analisar contexto para sugestões proativas
      enhancedSystemPrompt += `\n\n## Instruções de Análise Proativa:
Baseado nos dados financeiros acima, você DEVE:
1. Identificar qualquer situação de risco (saldo negativo, alta inadimplência, vencimentos concentrados)
2. Sugerir ações preventivas quando apropriado
3. Destacar oportunidades de otimização financeira
4. Alertar sobre clientes/fornecedores que precisam de atenção especial`;
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
