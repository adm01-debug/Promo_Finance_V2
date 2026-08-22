import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

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

        const correlationId = crypto.randomUUID()
        const { data: execucao, error: reservaError } = await supabase
          .from('execucoes_regua_cobranca')
          .insert({
            empresa_id: regra.empresa_id,
            conta_receber_id: conta.id,
            etapa: regra.etapa || regra.nome,
            canal: regra.canal,
            status: 'processando',
            metadata: {
              regra_id: regra.id,
              correlation_id: correlationId,
              timestamp: new Date().toISOString(),
            },
          })
          .select('id')
          .single()

        // A constraint única diária é a autoridade para execuções concorrentes.
        if (reservaError?.code === '23505') continue
        if (reservaError) throw reservaError

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
            const { error: envioError } = await supabase.functions.invoke('enviar-alerta-email', {
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
            if (envioError) errorMsg = envioError.message
            else success = true
          } else if (canal === 'whatsapp' && conta.clientes?.telefone) {
            const { error: envioError } = await supabase.functions.invoke('whatsapp-ia-proativo', {
              body: {
                phone: conta.clientes.telefone,
                message: template.replace('{{valor}}', conta.valor)
              }
            })
            if (envioError) errorMsg = envioError.message
            else success = true
          }

          // 4. Logar execução e disparar alerta em caso de falha
          const { error: atualizacaoError } = await supabase.from('execucoes_regua_cobranca').update({
            status: success ? 'sucesso' : 'falha',
            mensagem_erro: errorMsg || (!success ? 'Falha no envio da mensagem' : null),
          }).eq('id', execucao.id)

          if (atualizacaoError) throw atualizacaoError

          if (!success) {
            console.error(`Falha na régua para conta ${conta.id}: ${errorMsg || 'Erro no envio'}`)
            // O trigger no banco cuidará de criar o alerta na tabela 'alertas'
          }

          results.push({ conta_id: conta.id, regra: regra.nome, success, correlation_id: correlationId })
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
    const mensagemErro = error instanceof Error ? error.message : 'Erro inesperado na régua de cobrança'
    return new Response(JSON.stringify({ error: mensagemErro }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
