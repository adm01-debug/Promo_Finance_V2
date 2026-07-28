import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { exigirInternaOuUsuario } from "../_shared/auth-guard.ts";
import { mensagemErro } from "../_shared/erros.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  // [auth-guard] Aceita automacao interna (cron/trigger) ou usuario logado.
  const guard = await exigirInternaOuUsuario(req);
  if (!guard.ok) return guard.resposta;


  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log("Iniciando processamento da fila de cobranças...")

    // 1. Buscar itens pendentes na fila
    const { data: fila, error: filaError } = await supabase
      .from('fila_cobrancas')
      .select('*')
      .eq('status', 'pendente')
      .limit(20)

    if (filaError) throw filaError

    const results = []

    for (const item of fila) {
      try {
        // Marcar como processando
        await supabase.from('fila_cobrancas').update({ status: 'processando' }).eq('id', item.id)

        let success = false
        const canal = item.canal?.toLowerCase()

        if (canal === 'email' && item.destinatario) {
          await supabase.functions.invoke('enviar-alerta-email', {
            body: {
              tipo: 'vencimento',
              destinatario: item.destinatario,
              dados: {
                titulo: `Cobrança: ${item.etapa}`,
                mensagem: item.mensagem_renderizada,
                urlAcao: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/cobrancas`
              }
            }
          })
          success = true
        } else if (canal === 'whatsapp' && item.destinatario) {
          await supabase.functions.invoke('whatsapp-ia-proativo', {
            body: {
              phone: item.destinatario,
              message: item.mensagem_renderizada
            }
          })
          success = true
        }

        // 2. Mover para execuções (log)
        await supabase.from('execucoes_cobranca').insert({
          empresa_id: item.empresa_id,
          conta_receber_id: item.conta_receber_id,
          cliente_id: item.cliente_id,
          cliente_nome: item.cliente_nome,
          etapa: item.etapa,
          canal: item.canal,
          destinatario: item.destinatario,
          mensagem: item.mensagem_renderizada,
          status: success ? 'enviado' : 'falhou',
          provider: canal === 'email' ? 'resend' : 'whatsapp-ia'
        })

        // 3. Atualizar status na fila
        await supabase.from('fila_cobrancas').update({ 
          status: success ? 'enviado' : 'falhou',
          tentativas: (item.tentativas || 0) + 1
        }).eq('id', item.id)

        results.push({ id: item.id, success })
      } catch (e) {
        console.error(`Falha ao processar item ${item.id}:`, e)
        await supabase.from('fila_cobrancas').update({ status: 'falhou', erro: mensagemErro(e) }).eq('id', item.id)
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro processar fila:', error)
    return new Response(JSON.stringify({ error: mensagemErro(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
