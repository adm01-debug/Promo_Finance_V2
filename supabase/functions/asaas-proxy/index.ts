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

    // Verificar autenticação do usuário
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

    // Verificar se o usuário tem papel admin ou financeiro
    const { data: roleData } = await createClient(supabaseUrl, serviceRoleKey)
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

    // Usar service role para escritas no banco (bypass RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    const { action, data } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Ação não especificada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let result: any

    switch (action) {
      // ===== CLIENTES =====
      case 'criar_cliente': {
        if (!data?.empresa_id || !data?.nome || !data?.cpf_cnpj) {
          return new Response(JSON.stringify({ error: 'empresa_id, nome e cpf_cnpj são obrigatórios' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

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

        if (result.errors) {
          console.error('Erro ASAAS criar_cliente:', JSON.stringify(result.errors))
          return new Response(JSON.stringify(result), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

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
          if (dbError) {
            console.error('Erro ao salvar cliente no banco:', dbError)
          }
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
        if (!data?.empresa_id || !data?.asaas_customer_id || !data?.valor || !data?.data_vencimento) {
          return new Response(JSON.stringify({ error: 'empresa_id, asaas_customer_id, valor e data_vencimento são obrigatórios' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const billingTypeMap: Record<string, string> = {
          boleto: 'BOLETO',
          pix: 'PIX',
          credit_card: 'CREDIT_CARD',
          debit_card: 'DEBIT_CARD',
        }

        const payload: any = {
          customer: data.asaas_customer_id,
          billingType: billingTypeMap[data.tipo] || 'BOLETO',
          value: data.valor,
          dueDate: data.data_vencimento,
          description: data.descricao,
        }

        // Campos específicos para cartão de crédito
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

        const response = await fetch(`${ASAAS_BASE_URL}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
          },
          body: JSON.stringify(payload),
        })
        result = await response.json()

        if (result.errors) {
          console.error('Erro ASAAS criar_cobranca:', JSON.stringify(result.errors))
          return new Response(JSON.stringify(result), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        if (result.id) {
          // Buscar dados adicionais (QR Code Pix, código de barras)
          let pixData: any = null
          let boletoData: any = null

          if (data.tipo === 'pix') {
            try {
              const pixResp = await fetch(`${ASAAS_BASE_URL}/payments/${result.id}/pixQrCode`, {
                headers: { 'access_token': ASAAS_API_KEY },
              })
              pixData = await pixResp.json()
            } catch (e) {
              console.error('Erro ao buscar QR Code Pix:', e)
            }
          }

          if (data.tipo === 'boleto') {
            try {
              const boletoResp = await fetch(`${ASAAS_BASE_URL}/payments/${result.id}/identificationField`, {
                headers: { 'access_token': ASAAS_API_KEY },
              })
              boletoData = await boletoResp.json()
            } catch (e) {
              console.error('Erro ao buscar linha digitável:', e)
            }
          }

          // Salvar no banco com service role
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
          if (dbError) {
            console.error('Erro ao salvar cobrança no banco:', dbError)
          }

          // Enriquecer resultado para o frontend
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
        if (!data?.asaas_id) {
          return new Response(JSON.stringify({ error: 'asaas_id é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const response = await fetch(`${ASAAS_BASE_URL}/payments/${data.asaas_id}`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      case 'cancelar_cobranca': {
        if (!data?.asaas_id) {
          return new Response(JSON.stringify({ error: 'asaas_id é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const response = await fetch(`${ASAAS_BASE_URL}/payments/${data.asaas_id}`, {
          method: 'DELETE',
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()

        if (!result.errors) {
          const { error: dbError } = await supabase
            .from('asaas_payments')
            .update({ status: 'CANCELLED' })
            .eq('asaas_id', data.asaas_id)
          if (dbError) {
            console.error('Erro ao atualizar status no banco:', dbError)
          }
        }
        break
      }

      // ===== PIX QR CODE =====
      case 'pix_qrcode': {
        if (!data?.asaas_id) {
          return new Response(JSON.stringify({ error: 'asaas_id é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const response = await fetch(`${ASAAS_BASE_URL}/payments/${data.asaas_id}/pixQrCode`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      // ===== LINHA DIGITÁVEL BOLETO =====
      case 'boleto_linha_digitavel': {
        if (!data?.asaas_id) {
          return new Response(JSON.stringify({ error: 'asaas_id é obrigatório' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const response = await fetch(`${ASAAS_BASE_URL}/payments/${data.asaas_id}/identificationField`, {
          headers: { 'access_token': ASAAS_API_KEY },
        })
        result = await response.json()
        break
      }

      // ===== TRANSFERÊNCIAS PIX =====
      case 'transferir_pix': {
        if (!data?.valor || !data?.chave_pix) {
          return new Response(JSON.stringify({ error: 'valor e chave_pix são obrigatórios' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
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
