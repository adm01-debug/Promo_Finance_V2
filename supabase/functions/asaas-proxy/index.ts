// ============================================
// EDGE FUNCTION: ASAAS PROXY
// Proxy seguro para API ASAAS - Full Feature Set
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ASAAS_BASE_URL = 'https://api.asaas.com/v3'

async function asaasFetch(path: string, apiKey: string, options: RequestInit = {}) {
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
  
  return response.json()
}

Deno.serve(async (req) => {
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

    const body = await req.json()
    const { action, data } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Ação não especificada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

        if (data.juros) payload.interest = { value: data.juros }
        if (data.multa) payload.fine = { value: data.multa }
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
        if (!data?.valor || !data?.chave_pix) return err('valor e chave_pix são obrigatórios')
        result = await asaasFetch('/transfers', ASAAS_API_KEY, {
          method: 'POST',
          body: JSON.stringify({
            value: data.valor,
            pixAddressKey: data.chave_pix,
            pixAddressKeyType: data.tipo_chave || 'CPF',
            description: data.descricao,
          }),
        })
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

      default:
        return err(`Ação desconhecida: ${action}`)
    }

    return ok(result)
  } catch (error) {
    console.error('Erro asaas-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
