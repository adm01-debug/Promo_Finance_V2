import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log("Iniciando processamento da régua de cobrança...")

    // 1. Buscar todas as regras ativas
    const { data: regras, error: regrasError } = await supabase
      .from('regua_cobranca')
      .select('*')
      .eq('ativo', true)
      .order('prioridade', { ascending: false })

    if (regrasError) throw regrasError

    const results = []

    for (const regra of regras) {
      console.log(`Processando regra: ${regra.nome} (Dias: ${regra.dias_gatilho})`)
      
      const dayOffset = regra.dias_gatilho || 0
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - dayOffset)
      const targetDateStr = targetDate.toISOString().split('T')[0]

      // 2. Buscar contas que vencem/venceram nesta data e estão pendentes
      const { data: contas, error: contasError } = await supabase
        .from('contas_receber')
        .select('*, clientes(email, telefone)')
        .eq('data_vencimento', targetDateStr)
        .eq('status', 'pendente')
        .eq('empresa_id', regra.empresa_id)

      if (contasError) {
        console.error(`Erro ao buscar contas para regra ${regra.id}:`, contasError)
        continue
      }

      for (const conta of contas) {
        // Verificar se já foi executada para esta conta e etapa hoje
        const { data: jaExecutado } = await supabase
          .from('execucoes_regua_cobranca')
          .select('id')
          .eq('conta_receber_id', conta.id)
          .eq('etapa', regra.etapa || regra.nome)
          .gte('created_at', new Date().toISOString().split('T')[0])
          .maybeSingle()

        if (jaExecutado) continue

        try {
          // 3. Disparar ação conforme canal
          const canal = regra.canal?.toLowerCase() || 'email'
          let success = false
          let errorMsg = null

          let template = regra.template_mensagem || 'Seu título está próximo do vencimento.'
          
          // INTEGRAÇÃO IA: Personalizar mensagem se configurado
          if (regra.configuracoes_ia?.personalizar_mensagens) {
            try {
              const prompt = `Gere uma mensagem amigável de cobrança para o cliente ${conta.clientes?.nome || 'Cliente'}. 
              Valor: R$ ${conta.valor}. Vencimento: ${conta.data_vencimento}.
              Contexto da regra: ${regra.nome}. Tom: ${regra.configuracoes_ia?.tom || 'profissional'}.`
              
              const { data: iaResult } = await supabase.functions.invoke('copilot-global', {
                body: { prompt, context: 'financeiro_cobranca' }
              })
              
              if (iaResult?.text) template = iaResult.text
            } catch (iaErr) {
              console.warn("Falha ao personalizar com IA, usando template padrão:", iaErr)
            }
          }

          if (canal === 'email' && conta.clientes?.email) {
            await supabase.functions.invoke('enviar-alerta-email', {
              body: {
                tipo: 'vencimento',
                destinatario: conta.clientes.email,
                dados: {
                  titulo: `Lembrete de Pagamento: ${regra.nome}`,
                  mensagem: template.replace('{{valor}}', conta.valor),
                  valor: conta.valor,
                  dataVencimento: conta.data_vencimento
                }
              }
            })
            success = true
          } else if (canal === 'whatsapp' && conta.clientes?.telefone) {
            await supabase.functions.invoke('whatsapp-ia-proativo', {
              body: {
                phone: conta.clientes.telefone,
                message: template.replace('{{valor}}', conta.valor)
              }
            })
            success = true
          }

          // 4. Logar execução
          await supabase.from('execucoes_regua_cobranca').insert({
            empresa_id: regra.empresa_id,
            conta_receber_id: conta.id,
            etapa: regra.etapa || regra.nome,
            canal: regra.canal,
            status: success ? 'sucesso' : 'falha',
            mensagem_erro: errorMsg,
            metadata: { regra_id: regra.id }
          })

          results.push({ conta_id: conta.id, regra: regra.nome, success })
        } catch (e) {
          console.error(`Falha ao executar régua para conta ${conta.id}:`, e)
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro régua cobrança:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
