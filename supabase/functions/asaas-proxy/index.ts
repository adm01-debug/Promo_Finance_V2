// ============================================
// EDGE FUNCTION: ASAAS PROXY
// Proxy seguro para API ASAAS - Full Feature Set
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { validatePayload, createErrorResponse, AsaasProxySchema, corsHeaders } from '../_shared/validation.ts'
import { withRetry, createCircuitBreaker } from '../_shared/resilience.ts'

const ASAAS_BASE_URL = 'https://api.asaas.com/v3'
const asaasCB = createCircuitBreaker('asaas')

async function asaasFetch(path: string, apiKey: string, options: RequestInit = {}) {
  return await asaasCB.run(async () => {
    return await withRetry(async () => {
      const response = await fetch(`${ASAAS_BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey,
          ...(options.headers || {}),
        },
      })
      
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await response.text()
        console.error(`ASAAS retornou resposta não-JSON (${response.status}):`, text.substring(0, 500))
        throw new Error(`ASAAS retornou erro ${response.status}: resposta inesperada`)
      }
      
      const data = await response.json()
      
      // If ASAAS returns a 429 or 5xx, we want the retry logic to catch it
      if (!response.ok && [429, 500, 502, 503, 504].includes(response.status)) {
        throw new Error(`ASAAS error ${response.status}: ${JSON.stringify(data)}`)
      }

      return data
    })
  })
}

export const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada')

    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar autenticação
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar role
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'financeiro'])
      .limit(1)
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Sem permissão para acessar ASAAS' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawBody = await req.json()
    const validation = validatePayload(AsaasProxySchema, rawBody, "asaas-proxy")
    
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details)
    }

    const { action, data } = validation.data



    const ok = (result: any) => new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    const err = (msg: string, status = 400) => new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    const checkErrors = (result: any) => {
      if (result.errors) {
        console.error(`Erro ASAAS ${action}:`, JSON.stringify(result.errors))
        return new Response(JSON.stringify(result), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return null
    }

    let result: any

    switch (action) {
      // ===== CLIENTES =====
      case 'criar_cliente': {
        if (!data?.empresa_id || !data?.nome || !data?.cpf_cnpj) return err('empresa_id, nome e cpf_cnpj são obrigatórios')

        result = await asaasFetch('/customers', ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify({
            name: data.nome,
            cpfCnpj: data.cpf_cnpj,
            email: data.email,
            phone: data.telefone,
            address: data.endereco?.logradouro,
            addressNumber: data.endereco?.numero,
            complement: data.endereco?.complemento,
            province: data.endereco?.bairro,
            postalCode: data.endereco?.cep,
            city: data.endereco?.cidade,
            state: data.endereco?.estado,
          }),
        })
        const errResp1 = checkErrors(result)
        if (errResp1) return errResp1

        if (result.id) {
          const { error: dbError } = await supabase.from('asaas_customers').insert({
            asaas_id: result.id,
            empresa_id: data.empresa_id,
            cliente_id: data.cliente_id || null,
            nome: data.nome,
            cpf_cnpj: data.cpf_cnpj,
            email: data.email || null,
            telefone: data.telefone || null,
            endereco: data.endereco || null,
          })
          if (dbError) console.error('Erro DB criar_cliente:', dbError)
        }
        break
      }

      case 'editar_cliente': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        const updatePayload: any = {}
        if (data.nome) updatePayload.name = data.nome
        if (data.email) updatePayload.email = data.email
        if (data.telefone) updatePayload.phone = data.telefone
        if (data.cpf_cnpj) updatePayload.cpfCnpj = data.cpf_cnpj

        result = await asaasFetch(`/customers/${data.asaas_id}`, ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify(updatePayload),
        })
        const errRespEdit = checkErrors(result)
        if (errRespEdit) return errRespEdit

        // Sync local DB
        const dbUpdate: any = {}
        if (data.nome) dbUpdate.nome = data.nome
        if (data.email) dbUpdate.email = data.email
        if (data.telefone) dbUpdate.telefone = data.telefone
        if (data.cpf_cnpj) dbUpdate.cpf_cnpj = data.cpf_cnpj
        if (Object.keys(dbUpdate).length > 0) {
          await supabase.from('asaas_customers').update(dbUpdate).eq('asaas_id', data.asaas_id)
        }
        break
      }

      case 'excluir_cliente': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        result = await asaasFetch(`/customers/${data.asaas_id}`, ASAAS_API_KEY, { method: 'DELETE' })
        const errRespDel = checkErrors(result)
        if (errRespDel) return errRespDel
        await supabase.from('asaas_customers').delete().eq('asaas_id', data.asaas_id)
        break
      }

      case 'listar_clientes': {
        const params = new URLSearchParams()
        if (data?.offset) params.set('offset', data.offset)
        if (data?.limit) params.set('limit', data.limit || '20')
        if (data?.cpfCnpj) params.set('cpfCnpj', data.cpfCnpj)
        if (data?.name) params.set('name', data.name)
        result = await asaasFetch(`/customers?${params}`, ASAAS_API_KEY)
        break
      }

      // ===== COBRANÇAS =====
      case 'criar_cobranca': {
        if (!data?.empresa_id || !data?.asaas_customer_id || !data?.valor || !data?.data_vencimento)
          return err('empresa_id, asaas_customer_id, valor e data_vencimento são obrigatórios')

        const billingTypeMap: Record<string, string> = {
          boleto: 'BOLETO', pix: 'PIX', credit_card: 'CREDIT_CARD', debit_card: 'DEBIT_CARD',
        }

        const payload: any = {
          customer: data.asaas_customer_id,
          billingType: billingTypeMap[data.tipo] || 'BOLETO',
          value: data.valor,
          dueDate: data.data_vencimento,
          description: data.descricao,
          externalReference: data.conta_receber_id, // Link with internal ID
        }

        // Parcelamento
        if (data.parcelas && data.parcelas > 1) {
          payload.installmentCount = data.parcelas
          payload.installmentValue = data.valor_parcela || (data.valor / data.parcelas)
        }

        // Cartão de crédito
        if (data.tipo === 'credit_card' && data.cartao) {
          payload.creditCard = {
            holderName: data.cartao.holder_name,
            number: data.cartao.number,
            expiryMonth: data.cartao.expiry_month,
            expiryYear: data.cartao.expiry_year,
            ccv: data.cartao.ccv,
          }
          payload.creditCardHolderInfo = {
            name: data.cartao.holder_name,
            email: data.email,
            cpfCnpj: data.cpf_cnpj,
            postalCode: data.cep,
            phone: data.telefone,
          }
        }

        // Multas e Juros Padrão do Config
        const { data: config } = await supabase.from('asaas_config').select('*').eq('empresa_id', data.empresa_id).maybeSingle();
        
        if (data.juros || config?.default_interest_percent) 
          payload.interest = { value: data.juros || config?.default_interest_percent }
        
        if (data.multa || config?.default_fine_percent) 
          payload.fine = { value: data.multa || config?.default_fine_percent }

        if (data.desconto_valor) {
          payload.discount = {
            value: data.desconto_valor,
            dueDateLimitDays: data.desconto_dias || 0,
            type: data.desconto_tipo || 'FIXED',
          }
        }

        // Notificações
        if (data.desativar_notificacoes) {
          payload.postalService = false
        }

        result = await asaasFetch('/payments', ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        const errResp2 = checkErrors(result)
        if (errResp2) return errResp2

        if (result.id) {
          let pixData: any = null
          let boletoData: any = null

          if (data.tipo === 'pix') {
            try { pixData = await asaasFetch(`/payments/${result.id}/pixQrCode`, ASAAS_API_KEY) } catch {}
          }
          if (data.tipo === 'boleto') {
            try { boletoData = await asaasFetch(`/payments/${result.id}/identificationField`, ASAAS_API_KEY) } catch {}
          }

          const { error: dbError } = await supabase.from('asaas_payments').insert({
            asaas_id: result.id,
            asaas_customer_id: data.asaas_customer_id,
            empresa_id: data.empresa_id,
            conta_receber_id: data.conta_receber_id || null,
            tipo: data.tipo || 'boleto',
            valor: data.valor,
            data_vencimento: data.data_vencimento,
            status: result.status || 'PENDING',
            descricao: data.descricao || null,
            nosso_numero: result.nossoNumero || null,
            codigo_barras: boletoData?.barCode || null,
            linha_digitavel: boletoData?.identificationField || null,
            pix_qrcode: pixData?.encodedImage || null,
            pix_copia_cola: pixData?.payload || null,
            link_boleto: result.bankSlipUrl || null,
            link_fatura: result.invoiceUrl || null,
          })
          if (dbError) console.error('Erro DB criar_cobranca:', dbError)

          result.pixData = pixData
          result.boletoData = boletoData
        }
        break
      }

      case 'consultar_cobranca': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        result = await asaasFetch(`/payments/${data.asaas_id}`, ASAAS_API_KEY)
        break
      }

      case 'cancelar_cobranca': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        result = await asaasFetch(`/payments/${data.asaas_id}`, ASAAS_API_KEY, { method: 'DELETE' })
        const errCancel = checkErrors(result)
        if (errCancel) return errCancel
        await supabase.from('asaas_payments').update({ status: 'CANCELLED' }).eq('asaas_id', data.asaas_id)
        break
      }

      // ===== ESTORNO =====
      case 'estornar_cobranca': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        const refundPayload: any = {}
        if (data.valor) refundPayload.value = data.valor // estorno parcial
        if (data.descricao) refundPayload.description = data.descricao

        result = await asaasFetch(`/payments/${data.asaas_id}/refund`, ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify(refundPayload),
        })
        const errRefund = checkErrors(result)
        if (errRefund) return errRefund

        await supabase.from('asaas_payments').update({ status: 'REFUNDED' }).eq('asaas_id', data.asaas_id)
        break
      }

      // ===== SEGUNDA VIA =====
      case 'segunda_via_boleto': {
        if (!data?.asaas_id || !data?.nova_data_vencimento) return err('asaas_id e nova_data_vencimento são obrigatórios')
        result = await asaasFetch(`/payments/${data.asaas_id}`, ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify({ dueDate: data.nova_data_vencimento }),
        })
        const errSegunda = checkErrors(result)
        if (errSegunda) return errSegunda

        // Fetch new identification field
        const newBoleto = await asaasFetch(`/payments/${data.asaas_id}/identificationField`, ASAAS_API_KEY)
        await supabase.from('asaas_payments').update({
          data_vencimento: data.nova_data_vencimento,
          codigo_barras: newBoleto?.barCode || null,
          linha_digitavel: newBoleto?.identificationField || null,
        }).eq('asaas_id', data.asaas_id)

        result.boletoData = newBoleto
        break
      }

      // ===== PIX QR CODE =====
      case 'pix_qrcode': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        result = await asaasFetch(`/payments/${data.asaas_id}/pixQrCode`, ASAAS_API_KEY)
        break
      }

      // ===== LINHA DIGITÁVEL =====
      case 'boleto_linha_digitavel': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        result = await asaasFetch(`/payments/${data.asaas_id}/identificationField`, ASAAS_API_KEY)
        break
      }

      // ===== ASSINATURAS (RECORRÊNCIA) =====
      case 'criar_assinatura': {
        if (!data?.asaas_customer_id || !data?.valor || !data?.ciclo)
          return err('asaas_customer_id, valor e ciclo são obrigatórios')

        const cycleMap: Record<string, string> = {
          semanal: 'WEEKLY', quinzenal: 'BIWEEKLY', mensal: 'MONTHLY',
          trimestral: 'QUARTERLY', semestral: 'SEMIANNUALLY', anual: 'YEARLY',
        }

        result = await asaasFetch('/subscriptions', ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify({
            customer: data.asaas_customer_id,
            billingType: data.tipo?.toUpperCase() || 'BOLETO',
            value: data.valor,
            cycle: cycleMap[data.ciclo] || 'MONTHLY',
            nextDueDate: data.proximo_vencimento,
            description: data.descricao,
            maxPayments: data.max_parcelas || undefined,
          }),
        })
        const errSub = checkErrors(result)
        if (errSub) return errSub
        break
      }

      case 'listar_assinaturas': {
        const params = new URLSearchParams()
        if (data?.customer) params.set('customer', data.customer)
        if (data?.offset) params.set('offset', data.offset || '0')
        if (data?.limit) params.set('limit', data.limit || '20')
        result = await asaasFetch(`/subscriptions?${params}`, ASAAS_API_KEY)
        break
      }

      case 'cancelar_assinatura': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        result = await asaasFetch(`/subscriptions/${data.asaas_id}`, ASAAS_API_KEY, { method: 'DELETE' })
        break
      }

      // ===== TRANSFERÊNCIAS PIX =====
      case 'transferir_pix': {
        if (!data?.valor || !data?.chave_pix || !data?.idempotency_key) 
          return err('valor, chave_pix e idempotency_key são obrigatórios')
        
        // Verificar se já existe uma transferência com esta chave de idempotência
        const { data: existing } = await supabase
          .from('asaas_transfers')
          .select('*')
          .eq('idempotency_key', data.idempotency_key)
          .maybeSingle()
        
        if (existing) {
          return ok(existing)
        }

        const transferPayload: any = {
          value: data.valor,
          pixAddressKey: data.chave_pix,
          pixAddressKeyType: data.tipo_chave || 'CPF',
          description: data.descricao,
        }

        result = await asaasFetch('/transfers', ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify(transferPayload),
        })

        const errTransf = checkErrors(result)
        if (errTransf) return errTransf

        if (result.id) {
          const { error: dbError } = await supabase.from('asaas_transfers').insert({
            asaas_id: result.id,
            empresa_id: data.empresa_id,
            valor: data.valor,
            chave_pix: data.chave_pix,
            tipo_chave: data.tipo_chave || 'CPF',
            descricao: data.descricao || null,
            status: result.status || 'PENDING',
            idempotency_key: data.idempotency_key,
            user_id: user.id
          })
          if (dbError) console.error('Erro DB asaas_transfers:', dbError)
          
          // Registrar na auditoria
          await supabase.from('asaas_audit_trail').insert({
            payment_id: null, // transfers don't have a payment_id link here, but we could use metadata if needed
            action: 'PIX_CASHOUT_CREATED',
            details: { asaas_id: result.id, valor: data.valor, chave: data.chave_pix },
            user_id: user.id
          })
        }
        break
      }

      case 'sincronizar_transferencia': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        result = await asaasFetch(`/transfers/${data.asaas_id}`, ASAAS_API_KEY)
        const errS = checkErrors(result)
        if (errS) return errS

        await supabase.from('asaas_transfers').update({
          status: result.status,
          transaction_receipt_url: result.transactionReceiptUrl || null
        }).eq('asaas_id', data.asaas_id)

        break
      }

      // ===== SALDO =====
      case 'consultar_saldo': {
        result = await asaasFetch('/finance/balance', ASAAS_API_KEY)
        break
      }

      // ===== EXTRATO =====
      case 'extrato': {
        const params = new URLSearchParams()
        if (data?.startDate) params.set('startDate', data.startDate)
        if (data?.finishDate) params.set('finishDate', data.finishDate)
        if (data?.offset) params.set('offset', data.offset || '0')
        if (data?.limit) params.set('limit', data.limit || '50')
        result = await asaasFetch(`/financialTransactions?${params}`, ASAAS_API_KEY)
        break
      }

      // ===== NOTIFICAÇÕES =====
      case 'listar_notificacoes_cobranca': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        result = await asaasFetch(`/payments/${data.asaas_id}/notifications`, ASAAS_API_KEY)
        break
      }

      // ===== LINKS DE PAGAMENTO =====
      case 'criar_link_pagamento': {
        if (!data?.nome || !data?.valor) return err('nome e valor são obrigatórios')
        const linkPayload: any = {
          name: data.nome,
          value: data.valor,
          billingType: data.tipo?.toUpperCase() || 'UNDEFINED',
          chargeType: data.tipo_cobranca || 'DETACHED',
          dueDateLimitDays: data.dias_limite_vencimento || 10,
          description: data.descricao || undefined,
          notificationEnabled: data.notificacoes !== false,
        }
        if (data.tipo_cobranca === 'RECURRENT') {
          linkPayload.subscriptionCycle = data.ciclo_assinatura || 'MONTHLY'
        }
        if (data.max_parcelas) {
          linkPayload.chargeType = 'INSTALLMENT'
          linkPayload.maxInstallmentCount = data.max_parcelas
        }
        result = await asaasFetch('/paymentLinks', ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify(linkPayload),
        })
        const errLink = checkErrors(result)
        if (errLink) return errLink
        break
      }

      case 'listar_links_pagamento': {
        const params = new URLSearchParams()
        if (data?.offset) params.set('offset', data.offset || '0')
        if (data?.limit) params.set('limit', data.limit || '20')
        if (data?.active !== undefined) params.set('active', String(data.active))
        result = await asaasFetch(`/paymentLinks?${params}`, ASAAS_API_KEY)
        break
      }

      case 'excluir_link_pagamento': {
        if (!data?.id) return err('id é obrigatório')
        result = await asaasFetch(`/paymentLinks/${data.id}`, ASAAS_API_KEY, { method: 'DELETE' })
        break
      }

      // ===== ANTECIPAÇÃO DE RECEBÍVEIS =====
      case 'solicitar_antecipacao': {
        if (!data?.payment_id) return err('payment_id é obrigatório')
        result = await asaasFetch('/anticipations', ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify({
            payment: data.payment_id,
            installment: data.installment_id || undefined,
          }),
        })
        const errAntec = checkErrors(result)
        if (errAntec) return errAntec
        break
      }

      case 'simular_antecipacao': {
        if (!data?.payment_id) return err('payment_id é obrigatório')
        result = await asaasFetch('/anticipations/simulate', ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify({
            payment: data.payment_id,
            installment: data.installment_id || undefined,
          }),
        })
        break
      }

      case 'listar_antecipacoes': {
        const params = new URLSearchParams()
        if (data?.status) params.set('status', data.status)
        if (data?.offset) params.set('offset', data.offset || '0')
        if (data?.limit) params.set('limit', data.limit || '20')
        result = await asaasFetch(`/anticipations?${params}`, ASAAS_API_KEY)
        break
      }

      case 'obter_comprovante': {
        if (!data?.asaas_id) return err('asaas_id é obrigatório')
        // Retorna a URL de download do comprovante
        result = await asaasFetch(`/payments/${data.asaas_id}/confirmedBillingReceipt`, ASAAS_API_KEY)
        break
      }

      case 'sincronizar_pagamento': {
        if (!data?.payment_id) return err('payment_id é obrigatório')
        const { data: localPayment, error: fetchErr } = await supabase
          .from('asaas_payments')
          .select('*')
          .eq('id', data.payment_id)
          .single()
        
        if (fetchErr || !localPayment) return err('Pagamento não encontrado')
        if (!localPayment.asaas_id) return err('Pagamento sem ID Asaas')

        const asaasData = await asaasFetch(`/payments/${localPayment.asaas_id}`, ASAAS_API_KEY)
        const errSync = checkErrors(asaasData)
        if (errSync) return errSync

        const { error: updateErr } = await supabase
          .from('asaas_payments')
          .update({
            status: asaasData.status,
            valor_liquido: asaasData.netValue,
            data_pagamento: asaasData.paymentDate || null
          })
          .eq('id', data.payment_id)
        
        if (updateErr) return err('Erro ao atualizar status local')

        await supabase
          .from('asaas_sync_queue')
          .update({ status: 'completed' })
          .eq('payment_id', data.payment_id)

        // Registrar auditoria se houver motivo (reprocessamento manual)
        if (data?.reason) {
          await supabase.from('asaas_audit_trail').insert({
            payment_id: data.payment_id,
            action: 'MANUAL_SYNC',
            user_id: user.id,
            details: { reason: data.reason, manual: true }
          });
        }

        result = { success: true, status: asaasData.status }
        break
      }

      case 'processar_fila_sincronizacao': {
        const { data: config } = await supabase.from('asaas_config').select('*').limit(1).maybeSingle();
        const baseInterval = config?.retry_interval_minutes || 30;
        const multiplier = config?.backoff_multiplier || 2.0;

        const { data: queueItems, error: queueError } = await supabase
          .from('asaas_sync_queue')
          .select('*, asaas_payments(asaas_id, id)')
          .eq('status', 'PENDING')
          .lte('next_retry_at', new Date().toISOString())
          .limit(10)

        if (queueError) return err(`Erro ao buscar fila: ${queueError.message}`)
        
        const results = []
        for (const item of (queueItems || [])) {
          try {
            const asaasId = (item.asaas_payments as any)?.asaas_id
            const paymentId = (item.asaas_payments as any)?.id
            if (!asaasId) throw new Error('Pagamento sem ID Asaas')

            const asaasData = await asaasFetch(`/payments/${asaasId}`, ASAAS_API_KEY)
            
            await supabase.from('asaas_payments').update({
              status: asaasData.status,
              valor_liquido: asaasData.netValue,
              data_pagamento: asaasData.paymentDate || null
            }).eq('id', paymentId)

            await supabase.from('asaas_sync_queue').update({ 
              status: 'COMPLETED',
              attempts: item.attempts + 1
            }).eq('id', item.id)
            
            results.push({ id: item.id, status: 'COMPLETED' })
          } catch (e: any) {
            const nextRetry = new Date()
            // Cálculo com Backoff configurado: intervalo_base * (multiplicador ^ tentativas)
            const minutesToAdd = baseInterval * Math.pow(multiplier, item.attempts);
            nextRetry.setMinutes(nextRetry.getMinutes() + minutesToAdd)
            
            const newAttempts = item.attempts + 1;
            const maxAttempts = item.max_attempts || config?.retry_limit || 5;

            // Histórico de erro serializado
            const newError = {
              timestamp: new Date().toISOString(),
              message: e.message,
              attempt: newAttempts
            };
            const updatedHistory = Array.isArray(item.error_history) ? [...item.error_history, newError] : [newError];

            await supabase.from('asaas_sync_queue').update({ 
              status: newAttempts >= maxAttempts ? 'FAILED' : 'PENDING',
              last_error: e.message,
              error_history: updatedHistory,
              attempts: newAttempts,
              next_retry_at: nextRetry.toISOString()
            }).eq('id', item.id)
            results.push({ id: item.id, status: 'FAILED' })
          }
        }
        // Verificar se houve muitas falhas na última hora para disparar alerta
        const { count: failureCount } = await supabase
          .from('asaas_sync_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'FAILED')
          .gte('updated_at', new Date(Date.now() - 3600000).toISOString());

        const threshold = config?.failure_threshold || 5;
        if (failureCount && failureCount >= threshold) {
          // Disparar Alerta Email
          if (config?.alert_email_enabled && config?.alert_email_address) {
            await supabase.functions.invoke('enviar-alerta-email', {
              body: {
                tipo: 'asaas_failure',
                destinatario: config.alert_email_address,
                dados: {
                  titulo: 'Limite de falhas na sincronização Asaas atingido',
                  mensagem: `Foram detectadas ${failureCount} falhas na fila de retentativas na última hora. O limite configurado é de ${threshold}.`,
                  urlAcao: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/asaas` // Ajuste para URL real se necessário
                }
              }
            });
          }
          
          // Disparar Alerta WhatsApp
          if (config?.alert_whatsapp_enabled && config?.alert_whatsapp_number) {
            await supabase.functions.invoke('whatsapp-ia-proativo', {
              body: {
                phone: config.alert_whatsapp_number,
                message: `⚠️ *ALERTA ASAAS:* Foram detectadas ${failureCount} falhas na fila de retentativas na última hora. Acesse o painel para verificar.`
              }
            });
          }
        }

        result = { processed: results.length }
        break
      }

      case 'simular_backoff': {
        // Rotina de simulação para testar política de backoff
        const { data: config } = await supabase.from('asaas_config').select('*').limit(1).maybeSingle();
        const baseInterval = config?.retry_interval_minutes || 30;
        const multiplier = config?.backoff_multiplier || 2.0;
        
        const simulationResults = [];
        for (let i = 1; i <= 5; i++) {
          const minutes = baseInterval * Math.pow(multiplier, i - 1);
          simulationResults.push({
            tentativa: i,
            proximo_intervalo_minutos: minutes,
            exemplo_horario: new Date(Date.now() + minutes * 60000).toISOString()
          });
        }

        // Criar um registro na auditoria sobre a simulação
        await supabase.from('asaas_audit_trail').insert({
          action: 'BACKOFF_SIMULATION',
          details: { 
            config: { baseInterval, multiplier },
            results: simulationResults
          }
        });

        result = { success: true, simulation: simulationResults };
        break
      }

      case 'analisar_risco_cliente': {
        if (!data?.cliente_id) return err('cliente_id é obrigatório')
        
        const { data: cliente } = await supabase.from('clientes').select('*').eq('id', data.cliente_id).single();
        const { data: pagamentos } = await supabase.from('asaas_payments').select('*').eq('asaas_customer_id', cliente?.asaas_id).limit(20);
        
        // Simulação de análise via IA (Copilot Global)
        const prompt = `Analise o histórico de pagamentos deste cliente e sugira um score de risco (0-1000).
        Cliente: ${cliente?.razao_social}. Pagamentos: ${JSON.stringify(pagamentos)}.`
        
        const { data: iaResult } = await supabase.functions.invoke('copilot-global', {
          body: { prompt, context: 'analise_risco_credito' }
        })

        const score = parseInt(iaResult?.text?.match(/\d+/)?.[0] || '500');
        const faixa = score > 800 ? 'BAIXO' : score > 400 ? 'MEDIO' : 'ALTO';

        await supabase.from('asaas_credit_risk_analysis').insert({
          cliente_id: data.cliente_id,
          score_risco: score,
          faixa_risco: faixa,
          recomendacao: iaResult?.text || 'Sem recomendação disponível.',
          metadata: { analysis_at: new Date().toISOString() }
        });

        result = { score, faixa, recommendation: iaResult?.text };
        break
      }

      case 'gerar_sugestoes_conciliacao': {
        if (!data?.empresa_id) return err('empresa_id é obrigatório')
        if (!data?.transaction_id) return err('transaction_id é obrigatório')
        if (!data?.transaction_date) return err('transaction_date é obrigatório')
        if (typeof data?.transaction_value !== 'number') return err('transaction_value inválido')

        const { error: rpcErr } = await supabase.rpc('generate_reconciliation_suggestions', {
          p_empresa_id: data.empresa_id,
          p_transaction_date: data.transaction_date,
          p_transaction_value: data.transaction_value,
          p_transaction_id: data.transaction_id,
        })
        if (rpcErr) return err(rpcErr.message, 400)
        result = { ok: true }
        break
      }

      case 'aceitar_sugestao_conciliacao': {
        if (!data?.suggestion_id) return err('suggestion_id é obrigatório')
        if (!data?.conta_id) return err('conta_id é obrigatório')

        // Atualização transacional: sugestão + conta a receber. As duas
        // escritas ocorrem sob service_role para eliminar a necessidade de
        // GRANT/RLS extras ao usuário autenticado.
        const { error: sugErr } = await supabase
          .from('asaas_reconciliation_suggestions')
          .update({
            status: 'ACCEPTED',
            metadata: { accepted_by: user.id, accepted_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.suggestion_id)
        if (sugErr) return err(sugErr.message, 400)

        const { error: contaErr } = await supabase
          .from('contas_receber')
          .update({ status: 'pago', data_recebimento: new Date().toISOString().slice(0, 10) })
          .eq('id', data.conta_id)
        if (contaErr) return err(contaErr.message, 400)

        result = { ok: true }
        break
      }

      default:
        return err(`Ação desconhecida: ${action}`)
    }

    return ok(result)
  } catch (error: any) {
    console.error('Erro asaas-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

}

if (import.meta.main) {
  Deno.serve(handler)
}

