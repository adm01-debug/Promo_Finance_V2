import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertaProativo {
  tipo: 'vencimento' | 'inadimplencia' | 'meta' | 'fluxo' | 'oportunidade';
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone: string;
  mensagem: string;
  dados: Record<string, unknown>;
  prioridade: 'alta' | 'media' | 'baixa';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { action, data } = await req.json();
    console.log('[whatsapp-ia-proativo] Ação:', action);

    if (action === 'analisar-alertas') {
      // Buscar dados para análise
      const hoje = new Date().toISOString().split('T')[0];
      const em3Dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Contas a receber próximas do vencimento
      const { data: contasVencer } = await supabase
        .from('contas_receber')
        .select(`
          *,
          cliente:clientes(id, razao_social, telefone, email)
        `)
        .eq('status', 'pendente')
        .gte('data_vencimento', hoje)
        .lte('data_vencimento', em3Dias);

      // Contas vencidas
      const { data: contasVencidas } = await supabase
        .from('contas_receber')
        .select(`
          *,
          cliente:clientes(id, razao_social, telefone, email)
        `)
        .in('status', ['pendente', 'vencido'])
        .lt('data_vencimento', hoje);

      const alertas: AlertaProativo[] = [];

      // Gerar alertas de vencimento
      contasVencer?.forEach(conta => {
        const cliente = conta.cliente as any;
        if (cliente?.telefone) {
          alertas.push({
            tipo: 'vencimento',
            cliente_id: cliente.id,
            cliente_nome: cliente.razao_social,
            cliente_telefone: cliente.telefone,
            mensagem: '',
            dados: {
              valor: conta.valor,
              vencimento: conta.data_vencimento,
              descricao: conta.descricao
            },
            prioridade: 'media'
          });
        }
      });

      // Gerar alertas de inadimplência
      contasVencidas?.forEach(conta => {
        const cliente = conta.cliente as any;
        if (cliente?.telefone) {
          const diasAtraso = Math.floor(
            (Date.now() - new Date(conta.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
          );
          alertas.push({
            tipo: 'inadimplencia',
            cliente_id: cliente.id,
            cliente_nome: cliente.razao_social,
            cliente_telefone: cliente.telefone,
            mensagem: '',
            dados: {
              valor: conta.valor,
              vencimento: conta.data_vencimento,
              dias_atraso: diasAtraso,
              descricao: conta.descricao
            },
            prioridade: diasAtraso > 15 ? 'alta' : 'media'
          });
        }
      });

      // Usar IA para gerar mensagens personalizadas
      if (lovableApiKey && alertas.length > 0) {
        for (const alerta of alertas.slice(0, 10)) { // Limitar a 10 por vez
          try {
            const prompt = gerarPromptMensagem(alerta);
            
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'system',
                    content: `Você é um assistente financeiro profissional e cordial.
                    Gere mensagens curtas e amigáveis para WhatsApp.
                    Use tom profissional mas acolhedor.
                    Máximo 200 caracteres.
                    Não use emojis em excesso.
                    Inclua sempre uma ação clara.`
                  },
                  { role: 'user', content: prompt }
                ],
                max_tokens: 150
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              alerta.mensagem = aiData.choices[0].message.content.trim();
            }
          } catch (e) {
            console.error('Erro ao gerar mensagem IA:', e);
            alerta.mensagem = gerarMensagemFallback(alerta);
          }
        }
      } else {
        // Fallback sem IA
        alertas.forEach(a => {
          a.mensagem = gerarMensagemFallback(a);
        });
      }

      return new Response(JSON.stringify({
        success: true,
        alertas,
        resumo: {
          total: alertas.length,
          vencimento: alertas.filter(a => a.tipo === 'vencimento').length,
          inadimplencia: alertas.filter(a => a.tipo === 'inadimplencia').length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'enviar-mensagem') {
      const { telefone, mensagem, cliente_id, tipo } = data;
      
      // Formatar número
      const numeroFormatado = formatarTelefone(telefone);
      
      // Gerar link do WhatsApp
      const mensagemEncoded = encodeURIComponent(mensagem);
      const whatsappLink = `https://wa.me/${numeroFormatado}?text=${mensagemEncoded}`;

      // Registrar no histórico
      await supabase.from('historico_cobranca_whatsapp').insert({
        conta_receber_id: data.conta_receber_id || null,
        cliente_id,
        telefone: numeroFormatado,
        mensagem,
        status: 'gerado'
      });

      return new Response(JSON.stringify({
        success: true,
        whatsapp_link: whatsappLink,
        numero: numeroFormatado
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'gerar-resposta-ia') {
      const { pergunta_cliente, contexto } = data;

      if (!lovableApiKey) {
        return new Response(JSON.stringify({
          success: false,
          error: 'API Key não configurada'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `Você é um assistente de cobrança profissional e empático.
              
              Contexto do cliente:
              ${JSON.stringify(contexto, null, 2)}
              
              Regras:
              - Seja cordial e profissional
              - Ofereça soluções (parcelamento, desconto para pagamento à vista)
              - Nunca seja agressivo ou ameaçador
              - Mantenha mensagens curtas (máximo 300 caracteres)
              - Sempre ofereça opções ao cliente`
            },
            { role: 'user', content: pergunta_cliente }
          ],
          max_tokens: 200
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('Erro AI:', errorText);
        throw new Error('Erro ao gerar resposta');
      }

      const aiData = await aiResponse.json();
      const resposta = aiData.choices[0].message.content.trim();

      return new Response(JSON.stringify({
        success: true,
        resposta
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[whatsapp-ia-proativo] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function gerarPromptMensagem(alerta: AlertaProativo): string {
  const dados = alerta.dados as any;
  
  switch (alerta.tipo) {
    case 'vencimento':
      return `Gere uma mensagem de lembrete amigável para ${alerta.cliente_nome} sobre uma conta de R$ ${dados.valor} que vence em ${dados.vencimento}. Ofereça ajuda caso precise de boleto ou outras formas de pagamento.`;
    
    case 'inadimplencia':
      return `Gere uma mensagem cordial de cobrança para ${alerta.cliente_nome} sobre uma conta de R$ ${dados.valor} vencida há ${dados.dias_atraso} dias. Ofereça opções de negociação e parcelamento.`;
    
    case 'oportunidade':
      return `Gere uma mensagem para ${alerta.cliente_nome} oferecendo um desconto especial de ${dados.desconto}% para pagamento antecipado.`;
    
    default:
      return `Gere uma mensagem profissional para ${alerta.cliente_nome} sobre: ${JSON.stringify(dados)}`;
  }
}

function gerarMensagemFallback(alerta: AlertaProativo): string {
  const dados = alerta.dados as any;
  
  switch (alerta.tipo) {
    case 'vencimento':
      return `Olá ${alerta.cliente_nome}! Lembrando que sua conta de R$ ${dados.valor} vence em ${dados.vencimento}. Precisa de boleto atualizado? Estamos à disposição!`;
    
    case 'inadimplencia':
      return `Olá ${alerta.cliente_nome}! Identificamos uma pendência de R$ ${dados.valor}. Podemos ajudar com opções de pagamento? Entre em contato conosco.`;
    
    default:
      return `Olá ${alerta.cliente_nome}! Entre em contato conosco para mais informações.`;
  }
}

function formatarTelefone(telefone: string): string {
  // Remover caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');
  
  // Adicionar código do país se necessário
  if (numeros.length === 11) {
    return `55${numeros}`;
  } else if (numeros.length === 10) {
    return `559${numeros}`;
  }
  
  return numeros;
}
