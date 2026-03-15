// ============================================
// EDGE FUNCTION: ASAAS PROXY
// Proxy seguro para API ASAAS
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASAAS_BASE_URL = 'https://api.asaas.com/v3'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada')
    }

    // Verificar autenticação
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { action, data } = body

    let result: any

    switch (action) {
      // ===== CLIENTES =====
      case 'criar_cliente': {
        const response = await fetch(`${ASAAS_BASE_URL}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
          },
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
        result = await response.json()

        if (result.id) {
          // Salvar no banco
          await supabase.from('asaas_customers').insert({
            asaas_id: result.id,
            empresa_id: data.empresa_id,
            cliente_id: data.cliente_id || null,
            nome: data.nome,
            cpf_cnpj: data.cpf_cnpj,
            email: data.email,
            telefone: data.telefone,
            endereco: data.endereco || null,
          })
        }
        break
      }

      case 'listar_clientes': {
        const params = new URLSearchParams()
        if (data?.offset) params.set('offset', data.offset)
        if (data?.limit) params.set('limit', data.limit || '20')
        if (data?.cpfCnpj) params.set('cpfCnpj', data.cpfCnpj)
        if (data?.name) params.set('name', data.name)

        const response = await fetch(`${ASAAS_BASE_URL}/customers?${params}`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      // ===== COBRANÇAS =====
      case 'criar_cobranca': {
        const payload: any = {
          customer: data.asaas_customer_id,
          billingType: data.tipo?.toUpperCase() || 'BOLETO',
          value: data.valor,
          dueDate: data.data_vencimento,
          description: data.descricao,
        }

        // Campos específicos por tipo
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

        if (data.juros) {
          payload.interest = { value: data.juros }
        }
        if (data.multa) {
          payload.fine = { value: data.multa }
        }
        if (data.desconto_valor) {
          payload.discount = {
            value: data.desconto_valor,
            dueDateLimitDays: data.desconto_dias || 0,
            type: data.desconto_tipo || 'FIXED',
          }
        }

        const response = await fetch(`${ASAAS_BASE_URL}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
          },
          body: JSON.stringify(payload),
        })
        result = await response.json()

        if (result.id) {
          // Buscar dados adicionais (QR Code Pix, código de barras)
          let pixData: any = null
          let boletoData: any = null

          if (data.tipo === 'pix' || data.tipo === 'UNDEFINED') {
            try {
              const pixResp = await fetch(`${ASAAS_BASE_URL}/payments/${result.id}/pixQrCode`, {
                headers: { 'access_token': ASAAS_API_KEY },
              })
              pixData = await pixResp.json()
            } catch (e) { /* ignore */ }
          }

          if (data.tipo === 'boleto' || result.billingType === 'BOLETO') {
            try {
              const boletoResp = await fetch(`${ASAAS_BASE_URL}/payments/${result.id}/identificationField`, {
                headers: { 'access_token': ASAAS_API_KEY },
              })
              boletoData = await boletoResp.json()
            } catch (e) { /* ignore */ }
          }

          // Salvar no banco
          await supabase.from('asaas_payments').insert({
            asaas_id: result.id,
            asaas_customer_id: data.asaas_customer_id,
            empresa_id: data.empresa_id,
            conta_receber_id: data.conta_receber_id || null,
            tipo: data.tipo || 'boleto',
            valor: data.valor,
            data_vencimento: data.data_vencimento,
            status: result.status || 'PENDING',
            descricao: data.descricao,
            nosso_numero: result.nossoNumero,
            codigo_barras: boletoData?.barCode || null,
            linha_digitavel: boletoData?.identificationField || null,
            pix_qrcode: pixData?.encodedImage || null,
            pix_copia_cola: pixData?.payload || null,
            link_boleto: result.bankSlipUrl || null,
            link_fatura: result.invoiceUrl || null,
          })

          // Enriquecer resultado
          result.pixData = pixData
          result.boletoData = boletoData
        }
        break
      }

      case 'listar_cobrancas': {
        const params = new URLSearchParams()
        if (data?.customer) params.set('customer', data.customer)
        if (data?.status) params.set('status', data.status)
        if (data?.offset) params.set('offset', data.offset)
        if (data?.limit) params.set('limit', data.limit || '20')

        const response = await fetch(`${ASAAS_BASE_URL}/payments?${params}`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      case 'consultar_cobranca': {
        const response = await fetch(`${ASAAS_BASE_URL}/payments/${data.asaas_id}`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      case 'cancelar_cobranca': {
        const response = await fetch(`${ASAAS_BASE_URL}/payments/${data.asaas_id}`, {
          method: 'DELETE',
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()

        if (!result.errors) {
          await supabase
            .from('asaas_payments')
            .update({ status: 'CANCELLED' })
            .eq('asaas_id', data.asaas_id)
        }
        break
      }

      // ===== PIX QR CODE =====
      case 'pix_qrcode': {
        const response = await fetch(`${ASAAS_BASE_URL}/payments/${data.asaas_id}/pixQrCode`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      // ===== LINHA DIGITÁVEL BOLETO =====
      case 'boleto_linha_digitavel': {
        const response = await fetch(`${ASAAS_BASE_URL}/payments/${data.asaas_id}/identificationField`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      // ===== TRANSFERÊNCIAS PIX =====
      case 'transferir_pix': {
        const response = await fetch(`${ASAAS_BASE_URL}/transfers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
          },
          body: JSON.stringify({
            value: data.valor,
            pixAddressKey: data.chave_pix,
            pixAddressKeyType: data.tipo_chave || 'CPF',
            description: data.descricao,
          }),
        })
        result = await response.json()
        break
      }

      // ===== SALDO =====
      case 'consultar_saldo': {
        const response = await fetch(`${ASAAS_BASE_URL}/finance/balance`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro asaas-proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
