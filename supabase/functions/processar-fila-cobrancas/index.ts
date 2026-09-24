import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { exigirInternaOuUsuario } from '../_shared/auth-guard.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const guard = await exigirInternaOuUsuario(req)
  if (!guard.ok) return guard.resposta

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    if (guard.dados.origem === 'usuario') {
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', guard.dados.userId)

      if (roleError) {
        throw roleError
      }

      const allowed = (roles ?? []).some((item: { role: string }) =>
        ['admin', 'financeiro'].includes(item.role)
      )
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'Acesso restrito a admin ou financeiro' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    console.log("Iniciando processamento da fila de cobranças...")

    // 1. Reivindicar itens pendentes de forma atomica: a RPC processar_fila_cobrancas
    // usa FOR UPDATE SKIP LOCKED, eliminando a corrida do SELECT+UPDATE manual anterior
    // em que duas invocacoes concorrentes podiam pegar e enviar a mesma cobranca duas
    // vezes (Etapa E-010, PLANO_100.md; A-018 em AUDITORIA.md).
    const { data: fila, error: filaError } = await supabase.rpc('processar_fila_cobrancas', {
      p_limite: 20,
    })

    if (filaError) throw filaError

    const results = []

    if (fila && fila.length > 0) {
      const filaIds = fila.map((item: any) => item.fila_id)

      // A RPC devolve apenas fila_id/canal/destinatario/mensagem/cliente_nome/etapa/
      // conta_receber_id (ver migration 20260317001356). empresa_id, cliente_id e
      // tentativas nao fazem parte do retorno; buscamos aqui para preencher a
      // auditoria em execucoes_cobranca. Seguro: essas linhas ja estao reservadas
      // com status='processando' por esta chamada, sem corrida com outra invocacao.
      const { data: detalhesFila, error: detalhesError } = await supabase
        .from('fila_cobrancas')
        .select('id, empresa_id, cliente_id, tentativas')
        .in('id', filaIds)

      if (detalhesError) throw detalhesError

      const detalhesPorId = new Map((detalhesFila || []).map((d: any) => [d.id, d]))

      for (const item of fila) {
        try {
          const canal = item.canal?.toLowerCase()
          let erroEnvio: string | null = `Canal ${canal} sem destinatário configurado`

          if (canal === 'email' && item.destinatario) {
            const { error } = await supabase.functions.invoke('enviar-alerta-email', {
              body: {
                tipo: 'vencimento',
                destinatario: item.destinatario,
                dados: {
                  titulo: `Cobrança: ${item.etapa}`,
                  mensagem: item.mensagem,
                  urlAcao: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/cobrancas`
                }
              }
            })
            erroEnvio = error?.message ?? null
          } else if (canal === 'whatsapp' && item.destinatario) {
            const { error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
              body: {
                phone: item.destinatario,
                message: item.mensagem
              }
            })
            erroEnvio = error?.message ?? null
          }

          // Etapa E-009 (PLANO_100.md; A-013 em AUDITORIA.md): functions.invoke() nao
          // lanca excecao em erro HTTP -- so marcamos sucesso quando nao houver erro.
          const success = erroEnvio === null
          const detalheItem = detalhesPorId.get(item.fila_id)

          // 2. Mover para execuções (log)
          await supabase.from('execucoes_cobranca').insert({
            empresa_id: detalheItem?.empresa_id ?? null,
            conta_receber_id: item.conta_receber_id,
            cliente_id: detalheItem?.cliente_id ?? null,
            cliente_nome: item.cliente_nome,
            etapa: item.etapa,
            canal: item.canal,
            destinatario: item.destinatario,
            mensagem: item.mensagem,
            status: success ? 'enviado' : 'falhou',
            provider: canal === 'email' ? 'resend' : 'whatsapp-ia',
            erro_mensagem: erroEnvio
          })

          // 3. Atualizar status na fila
          await supabase.from('fila_cobrancas').update({
            status: success ? 'enviado' : 'falhou',
            tentativas: (detalheItem?.tentativas || 0) + 1,
            erro_mensagem: erroEnvio
          }).eq('id', item.fila_id)

          results.push({ id: item.fila_id, success })
        } catch (e) {
          console.error(`Falha ao processar item ${item.fila_id}:`, e)
          await supabase.from('fila_cobrancas').update({ status: 'falhou', erro: e.message }).eq('id', item.fila_id)
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro processar fila:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}
