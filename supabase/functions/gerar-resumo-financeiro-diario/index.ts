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

    console.log("Gerando relatório diário de operações financeiras...")

    // 1. Buscar todas as empresas ativas
    const { data: empresas } = await supabase.from('empresas').select('id, razao_social')

    for (const empresa of (empresas || [])) {
      const { data: config } = await supabase
        .from('asaas_config')
        .select('alert_email_address')
        .eq('empresa_id', empresa.id)
        .maybeSingle()

      if (!config?.alert_email_address) continue

      // 2. Coletar estatísticas das últimas 24h
      const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { count: novosBoletos } = await supabase
        .from('asaas_payments')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresa.id)
        .gte('created_at', ontem)

      const { data: pagos } = await supabase
        .from('asaas_payments')
        .select('valor')
        .eq('empresa_id', empresa.id)
        .in('status', ['RECEIVED', 'CONFIRMED'])
        .gte('updated_at', ontem)
      
      const totalPago = pagos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0

      const { count: falhasFila } = await supabase
        .from('asaas_sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('updated_at', ontem)

      // 3. Enviar e-mail de resumo
      await supabase.functions.invoke('enviar-alerta-email', {
        body: {
          tipo: 'vencimento', // Usando um tipo existente ou criando novo
          destinatario: config.alert_email_address,
          dados: {
            titulo: `Resumo Operacional Diário - ${empresa.razao_social}`,
            mensagem: `Aqui está o resumo das últimas 24h:
            - Novos boletos emitidos: ${novosBoletos}
            - Total recebido: R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            - Falhas na fila de sincronização: ${falhasFila}
            
            Acesse o painel para detalhes completos.`,
            urlAcao: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/asaas`
          }
        }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro ao gerar relatório diário:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
