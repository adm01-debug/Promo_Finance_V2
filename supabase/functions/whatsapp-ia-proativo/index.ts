import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {
  corsHeaders,
  createErrorResponse,
  validatePayload,
  WhatsappIaProativoSchema,
} from '../_shared/validation.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { corsHeadersComSegredo, exigirInternaOuUsuario } from '../_shared/auth-guard.ts';

interface AlertaProativo {
  tipo: 'vencimento' | 'inadimplencia' | 'meta' | 'fluxo' | 'oportunidade';
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone: string;
  mensagem: string;
  dados: Record<string, unknown>;
  prioridade: 'alta' | 'media' | 'baixa';
}

interface IdentidadeAutorizada {
  origem: 'interna' | 'usuario';
  userId: string | null;
}

type EscopoEmpresas = string[] | null;

type ResultadoEscopo = { ok: true; empresaIds: EscopoEmpresas } | { ok: false; resposta: Response };

interface ContaReceberAlerta {
  id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  valor: number;
  data_vencimento: string;
  descricao: string;
}

interface ClienteAlerta {
  id: string;
  empresa_id: string | null;
  razao_social: string | null;
  nome: string | null;
  telefone: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respostaJson(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function extrairEmpresaSolicitada(
  data: Record<string, unknown>
): { ok: true; empresaId: string | null } | { ok: false; resposta: Response } {
  const contexto =
    data.contexto && typeof data.contexto === 'object' && !Array.isArray(data.contexto)
      ? (data.contexto as Record<string, unknown>)
      : null;
  const candidatos = [data.empresa_id, contexto?.empresa_id].filter(
    (valor) => valor !== undefined && valor !== null
  );

  for (const valor of candidatos) {
    if (typeof valor !== 'string' || !UUID_RE.test(valor)) {
      return {
        ok: false,
        resposta: respostaJson(
          {
            error: 'empresa_invalida',
            message: 'empresa_id deve ser um UUID válido.',
          },
          400
        ),
      };
    }
  }

  const ids = [...new Set(candidatos as string[])];
  if (ids.length > 1) {
    return {
      ok: false,
      resposta: respostaJson(
        {
          error: 'empresa_ambigua',
          message: 'Os identificadores de empresa informados não coincidem.',
        },
        400
      ),
    };
  }

  return { ok: true, empresaId: ids[0] ?? null };
}

async function resolverEscopoEmpresas(
  supabase: SupabaseClient,
  identidade: IdentidadeAutorizada,
  empresaSolicitada: string | null
): Promise<ResultadoEscopo> {
  if (identidade.origem === 'interna') {
    return {
      ok: true,
      empresaIds: empresaSolicitada ? [empresaSolicitada] : null,
    };
  }

  // A identidade vem do JWT validado pelo guard. O corpo nunca define quais
  // tenants o usuário pode acessar; a fonte de verdade são os vínculos ativos.
  if (!identidade.userId) {
    return {
      ok: false,
      resposta: respostaJson(
        { error: 'sem_permissao', message: 'Usuário sem identidade válida.' },
        403
      ),
    };
  }

  const { data, error } = await supabase
    .from('user_empresas')
    .select('empresa_id')
    .eq('user_id', identidade.userId)
    .eq('ativo', true);

  if (error) {
    console.error('[whatsapp-ia-proativo] Falha ao resolver empresas do usuário:', error);
    return {
      ok: false,
      resposta: respostaJson(
        {
          error: 'erro_autorizacao',
          message: 'Não foi possível validar o acesso às empresas.',
        },
        503
      ),
    };
  }

  const empresasPermitidas = [
    ...new Set(
      (data ?? [])
        .map((vinculo: { empresa_id?: unknown }) => vinculo.empresa_id)
        .filter((id): id is string => typeof id === 'string' && UUID_RE.test(id))
    ),
  ];

  if (
    empresasPermitidas.length === 0 ||
    (empresaSolicitada && !empresasPermitidas.includes(empresaSolicitada))
  ) {
    return {
      ok: false,
      resposta: respostaJson(
        {
          error: 'sem_permissao_empresa',
          message: 'A empresa solicitada não está acessível para este usuário.',
        },
        403
      ),
    };
  }

  return {
    ok: true,
    empresaIds: empresaSolicitada ? [empresaSolicitada] : empresasPermitidas,
  };
}

function empresaEstaNoEscopo(empresaId: unknown, escopo: EscopoEmpresas): empresaId is string {
  return typeof empresaId === 'string' && (escopo === null || escopo.includes(empresaId));
}

export interface WhatsappIaProativoDependencies {
  autorizar: typeof exigirInternaOuUsuario;
  buscar: typeof fetch;
  criarClient: typeof createClient;
  verificarRateLimit: typeof checkRateLimit;
}

export function createHandler(overrides: Partial<WhatsappIaProativoDependencies> = {}) {
  const dependencies: WhatsappIaProativoDependencies = {
    autorizar: exigirInternaOuUsuario,
    buscar: fetch,
    criarClient: createClient,
    verificarRateLimit: checkRateLimit,
    ...overrides,
  };

  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeadersComSegredo });
    }

    const guard = await dependencies.autorizar(req);
    if (!guard.ok) return guard.resposta;

    try {
      const rawBody = normalizarPayloadLegado(await req.json());
      const validation = validatePayload(WhatsappIaProativoSchema, rawBody, 'whatsapp-ia-proativo');
      if (!validation.success) {
        return createErrorResponse(validation.error, 400, validation.details);
      }
      const { action } = validation.data;
      const data = validation.data.data ?? {};
      const empresaSolicitada = extrairEmpresaSolicitada(data);
      if (!empresaSolicitada.ok) return empresaSolicitada.resposta;

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

      const supabase = dependencies.criarClient(supabaseUrl, supabaseKey);

      const escopo = await resolverEscopoEmpresas(
        supabase,
        guard.dados,
        empresaSolicitada.empresaId
      );
      if (!escopo.ok) return escopo.resposta;

      // Rate limit: 30 req/min por IP (endpoint IA)
      const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
      const rl = await dependencies.verificarRateLimit(supabase, {
        endpoint: 'whatsapp-ia-proativo',
        ip,
        limit: 30,
        windowSeconds: 60,
        userAgent: req.headers.get('user-agent'),
      });
      if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

      console.log('[whatsapp-ia-proativo] Ação:', action);

      if (action === 'analisar-alertas') {
        // Buscar dados para análise
        const hoje = new Date().toISOString().split('T')[0];
        const em3Dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // O client é service_role, portanto TODO acesso de usuário precisa do
        // filtro derivado de user_empresas. Não usamos empresa_id do payload
        // como autorização.
        let contasVencerQuery = supabase
          .from('contas_receber')
          .select('id,empresa_id,cliente_id,valor,data_vencimento,descricao')
          .eq('status', 'pendente')
          .gte('data_vencimento', hoje)
          .lte('data_vencimento', em3Dias);
        if (escopo.empresaIds !== null) {
          contasVencerQuery = contasVencerQuery.in('empresa_id', escopo.empresaIds);
        }
        const { data: contasVencerRaw, error: erroContasVencer } = await contasVencerQuery;

        let contasVencidasQuery = supabase
          .from('contas_receber')
          .select('id,empresa_id,cliente_id,valor,data_vencimento,descricao')
          .in('status', ['pendente', 'vencido'])
          .lt('data_vencimento', hoje);
        if (escopo.empresaIds !== null) {
          contasVencidasQuery = contasVencidasQuery.in('empresa_id', escopo.empresaIds);
        }
        const { data: contasVencidasRaw, error: erroContasVencidas } = await contasVencidasQuery;

        if (erroContasVencer || erroContasVencidas) {
          console.error(
            '[whatsapp-ia-proativo] Falha ao consultar contas autorizadas:',
            erroContasVencer ?? erroContasVencidas
          );
          return respostaJson(
            { error: 'erro_consulta', message: 'Falha ao consultar alertas.' },
            503
          );
        }

        // Defesa em profundidade: mesmo que um mock/proxy ignore o filtro
        // PostgREST, dados fora do escopo não chegam à montagem do prompt.
        const contasVencer = (contasVencerRaw ?? []).filter((conta: ContaReceberAlerta) =>
          empresaEstaNoEscopo(conta.empresa_id, escopo.empresaIds)
        ) as ContaReceberAlerta[];
        const contasVencidas = (contasVencidasRaw ?? []).filter((conta: ContaReceberAlerta) =>
          empresaEstaNoEscopo(conta.empresa_id, escopo.empresaIds)
        ) as ContaReceberAlerta[];

        const clienteIds = [
          ...new Set(
            [...contasVencer, ...contasVencidas]
              .map((conta) => conta.cliente_id)
              .filter((id): id is string => typeof id === 'string')
          ),
        ];
        let clientes: ClienteAlerta[] = [];

        if (clienteIds.length > 0) {
          let clientesQuery = supabase
            .from('clientes')
            .select('id,empresa_id,razao_social,nome,telefone')
            .in('id', clienteIds);
          if (escopo.empresaIds !== null) {
            clientesQuery = clientesQuery.in('empresa_id', escopo.empresaIds);
          }
          const { data: clientesRaw, error: erroClientes } = await clientesQuery;
          if (erroClientes) {
            console.error(
              '[whatsapp-ia-proativo] Falha ao consultar clientes autorizados:',
              erroClientes
            );
            return respostaJson(
              {
                error: 'erro_consulta',
                message: 'Falha ao consultar clientes.',
              },
              503
            );
          }
          clientes = (clientesRaw ?? []).filter((cliente: ClienteAlerta) =>
            empresaEstaNoEscopo(cliente.empresa_id, escopo.empresaIds)
          ) as ClienteAlerta[];
        }

        const clientesPorEmpresa = new Map(
          clientes.map((cliente) => [
            `${cliente.empresa_id ?? 'sem-empresa'}:${cliente.id}`,
            cliente,
          ])
        );

        const alertas: AlertaProativo[] = [];

        // Gerar alertas de vencimento
        contasVencer.forEach((conta) => {
          const cliente = clientesPorEmpresa.get(
            `${conta.empresa_id ?? 'sem-empresa'}:${conta.cliente_id}`
          );
          if (cliente?.telefone) {
            alertas.push({
              tipo: 'vencimento',
              cliente_id: cliente.id,
              cliente_nome: cliente.razao_social ?? cliente.nome ?? 'Cliente',
              cliente_telefone: cliente.telefone,
              mensagem: '',
              dados: {
                empresa_id: conta.empresa_id,
                conta_receber_id: conta.id,
                valor: conta.valor,
                vencimento: conta.data_vencimento,
                descricao: conta.descricao,
              },
              prioridade: 'media',
            });
          }
        });

        // Gerar alertas de inadimplência
        contasVencidas.forEach((conta) => {
          const cliente = clientesPorEmpresa.get(
            `${conta.empresa_id ?? 'sem-empresa'}:${conta.cliente_id}`
          );
          if (cliente?.telefone) {
            const diasAtraso = Math.floor(
              (Date.now() - new Date(conta.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
            );
            alertas.push({
              tipo: 'inadimplencia',
              cliente_id: cliente.id,
              cliente_nome: cliente.razao_social ?? cliente.nome ?? 'Cliente',
              cliente_telefone: cliente.telefone,
              mensagem: '',
              dados: {
                empresa_id: conta.empresa_id,
                conta_receber_id: conta.id,
                valor: conta.valor,
                vencimento: conta.data_vencimento,
                dias_atraso: diasAtraso,
                descricao: conta.descricao,
              },
              prioridade: diasAtraso > 15 ? 'alta' : 'media',
            });
          }
        });

        // Usar IA para gerar mensagens personalizadas
        if (lovableApiKey && alertas.length > 0) {
          for (const alerta of alertas.slice(0, 10)) {
            // Limitar a 10 por vez
            try {
              const prompt = gerarPromptMensagem(alerta);

              const aiResponse = await dependencies.buscar(
                'https://ai.gateway.lovable.dev/v1/chat/completions',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${lovableApiKey}`,
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
                    Inclua sempre uma ação clara.`,
                      },
                      { role: 'user', content: prompt },
                    ],
                    max_tokens: 150,
                  }),
                }
              );

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                alerta.mensagem = aiData.choices[0].message.content.trim();
              }
            } catch (e: unknown) {
              console.error('Erro ao gerar mensagem IA:', e);
              alerta.mensagem = gerarMensagemFallback(alerta);
            }
          }
        } else {
          // Fallback sem IA
          alertas.forEach((a) => {
            a.mensagem = gerarMensagemFallback(a);
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            alertas,
            resumo: {
              total: alertas.length,
              vencimento: alertas.filter((a) => a.tipo === 'vencimento').length,
              inadimplencia: alertas.filter((a) => a.tipo === 'inadimplencia').length,
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (action === 'test') {
        const { telefone, mensagem } = data;
        if (
          typeof telefone !== 'string' ||
          telefone.trim().length === 0 ||
          typeof mensagem !== 'string' ||
          mensagem.trim().length === 0
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'telefone e mensagem são obrigatórios',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        const numeroFormatado = formatarTelefone(telefone);
        const whatsappLink = `https://wa.me/${numeroFormatado}?text=${encodeURIComponent(
          mensagem
        )}`;
        return new Response(
          JSON.stringify({
            success: true,
            whatsapp_link: whatsappLink,
            test: true,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (action === 'enviar-mensagem') {
        const { telefone, mensagem } = data;
        if (
          typeof telefone !== 'string' ||
          telefone.trim().length === 0 ||
          typeof mensagem !== 'string' ||
          mensagem.trim().length === 0
        ) {
          return respostaJson(
            {
              success: false,
              error: 'telefone e mensagem são obrigatórios',
            },
            400
          );
        }

        const contaReceberId = data.conta_receber_id;
        const clienteIdInformado = data.cliente_id;
        if (
          (contaReceberId !== undefined &&
            contaReceberId !== null &&
            (typeof contaReceberId !== 'string' || !UUID_RE.test(contaReceberId))) ||
          (clienteIdInformado !== undefined &&
            clienteIdInformado !== null &&
            (typeof clienteIdInformado !== 'string' || !UUID_RE.test(clienteIdInformado)))
        ) {
          return respostaJson(
            {
              error: 'referencia_invalida',
              message: 'conta_receber_id e cliente_id devem ser UUIDs válidos.',
            },
            400
          );
        }

        let empresaAutorizada = empresaSolicitada.empresaId;
        let clienteAutorizado = typeof clienteIdInformado === 'string' ? clienteIdInformado : null;

        if (typeof contaReceberId === 'string') {
          let contaQuery = supabase
            .from('contas_receber')
            .select('id,empresa_id,cliente_id')
            .eq('id', contaReceberId);
          if (escopo.empresaIds !== null) {
            contaQuery = contaQuery.in('empresa_id', escopo.empresaIds);
          }
          const { data: conta, error: erroConta } = await contaQuery.maybeSingle();
          if (erroConta) {
            console.error(
              '[whatsapp-ia-proativo] Falha ao autorizar conta da mensagem:',
              erroConta
            );
            return respostaJson(
              {
                error: 'erro_autorizacao',
                message: 'Não foi possível validar a conta informada.',
              },
              503
            );
          }
          if (
            !conta ||
            !empresaEstaNoEscopo(conta.empresa_id, escopo.empresaIds) ||
            (clienteAutorizado && clienteAutorizado !== conta.cliente_id)
          ) {
            return respostaJson(
              {
                error: 'sem_permissao_empresa',
                message: 'Conta ou cliente fora do escopo autorizado.',
              },
              403
            );
          }
          empresaAutorizada = conta.empresa_id;
          clienteAutorizado = conta.cliente_id;

          // A FK não garante que conta e cliente pertençam ao mesmo tenant.
          // Validamos a combinação para impedir que um vínculo inconsistente
          // grave ou exponha referência de outra empresa via service_role.
          if (clienteAutorizado) {
            let clienteDaContaQuery = supabase
              .from('clientes')
              .select('id,empresa_id')
              .eq('id', clienteAutorizado)
              .eq('empresa_id', empresaAutorizada);
            if (escopo.empresaIds !== null) {
              clienteDaContaQuery = clienteDaContaQuery.in('empresa_id', escopo.empresaIds);
            }
            const { data: clienteDaConta, error: erroClienteDaConta } =
              await clienteDaContaQuery.maybeSingle();
            if (erroClienteDaConta) {
              console.error(
                '[whatsapp-ia-proativo] Falha ao autorizar cliente da conta:',
                erroClienteDaConta
              );
              return respostaJson(
                {
                  error: 'erro_autorizacao',
                  message: 'Não foi possível validar o cliente da conta.',
                },
                503
              );
            }
            if (
              !clienteDaConta ||
              clienteDaConta.empresa_id !== empresaAutorizada ||
              !empresaEstaNoEscopo(clienteDaConta.empresa_id, escopo.empresaIds)
            ) {
              return respostaJson(
                {
                  error: 'sem_permissao_empresa',
                  message: 'Cliente da conta fora do escopo autorizado.',
                },
                403
              );
            }
          }
        } else if (clienteAutorizado) {
          let clienteQuery = supabase
            .from('clientes')
            .select('id,empresa_id')
            .eq('id', clienteAutorizado);
          if (escopo.empresaIds !== null) {
            clienteQuery = clienteQuery.in('empresa_id', escopo.empresaIds);
          }
          const { data: cliente, error: erroCliente } = await clienteQuery.maybeSingle();
          if (erroCliente) {
            console.error(
              '[whatsapp-ia-proativo] Falha ao autorizar cliente da mensagem:',
              erroCliente
            );
            return respostaJson(
              {
                error: 'erro_autorizacao',
                message: 'Não foi possível validar o cliente informado.',
              },
              503
            );
          }
          if (!cliente || !empresaEstaNoEscopo(cliente.empresa_id, escopo.empresaIds)) {
            return respostaJson(
              {
                error: 'sem_permissao_empresa',
                message: 'Cliente fora do escopo autorizado.',
              },
              403
            );
          }
          empresaAutorizada = cliente.empresa_id;
        }

        // Formatar número
        const numeroFormatado = formatarTelefone(telefone);

        // Gerar link do WhatsApp
        const mensagemEncoded = encodeURIComponent(mensagem);
        const whatsappLink = `https://wa.me/${numeroFormatado}?text=${mensagemEncoded}`;

        // O schema canônico não possui conta_receber_id nem telefone como
        // colunas. Mantemos essas referências em metadata, preservando campos
        // adicionais do caller, mas sobrescrevendo os dois valores sensíveis
        // com as versões já validadas/normalizadas pelo servidor.
        if (typeof contaReceberId === 'string') {
          const metadataRecebida =
            data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
              ? (data.metadata as Record<string, unknown>)
              : {};
          const { error: erroHistorico } = await supabase
            .from('historico_cobranca_whatsapp')
            .insert({
              empresa_id: empresaAutorizada,
              cliente_id: clienteAutorizado,
              mensagem,
              status: 'gerado',
              metadata: {
                ...metadataRecebida,
                conta_receber_id: contaReceberId,
                telefone: numeroFormatado,
              },
            });
          if (erroHistorico) {
            console.error('[whatsapp-ia-proativo] Falha ao registrar histórico:', erroHistorico);
            return respostaJson(
              {
                error: 'erro_registro',
                message: 'Não foi possível registrar a mensagem.',
              },
              503
            );
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            whatsapp_link: whatsappLink,
            numero: numeroFormatado,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (action === 'gerar-resposta-ia') {
        const { pergunta_cliente, contexto } = data;

        if (typeof pergunta_cliente !== 'string' || pergunta_cliente.trim().length === 0) {
          return respostaJson(
            {
              success: false,
              error: 'pergunta_cliente é obrigatória',
            },
            400
          );
        }

        if (!lovableApiKey) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'API Key não configurada',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const aiResponse = await dependencies.buscar(
          'https://ai.gateway.lovable.dev/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
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
              - Sempre ofereça opções ao cliente`,
                },
                { role: 'user', content: pergunta_cliente },
              ],
              max_tokens: 200,
            }),
          }
        );

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('Erro AI:', errorText);
          throw new Error('Erro ao gerar resposta');
        }

        const aiData = await aiResponse.json();
        const resposta = aiData.choices[0].message.content.trim();

        return new Response(
          JSON.stringify({
            success: true,
            resposta,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[whatsapp-ia-proativo] Erro:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Erro interno',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

export const handler = createHandler();

if (import.meta.main) {
  serve(handler);
}

function normalizarPayloadLegado(rawBody: unknown): unknown {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return rawBody;
  }

  const payload = rawBody as Record<string, unknown>;
  if (
    payload.action === undefined &&
    typeof payload.phone === 'string' &&
    typeof payload.message === 'string'
  ) {
    return {
      action: 'enviar-mensagem',
      data: {
        telefone: payload.phone,
        mensagem: payload.message,
      },
    };
  }

  return rawBody;
}

function gerarPromptMensagem(alerta: AlertaProativo): string {
  const dados = alerta.dados;

  switch (alerta.tipo) {
    case 'vencimento':
      return `Gere uma mensagem de lembrete amigável para ${alerta.cliente_nome} sobre uma conta de R$ ${dados.valor} que vence em ${dados.vencimento}. Ofereça ajuda caso precise de boleto ou outras formas de pagamento.`;

    case 'inadimplencia':
      return `Gere uma mensagem cordial de cobrança para ${alerta.cliente_nome} sobre uma conta de R$ ${dados.valor} vencida há ${dados.dias_atraso} dias. Ofereça opções de negociação e parcelamento.`;

    case 'oportunidade':
      return `Gere uma mensagem para ${alerta.cliente_nome} oferecendo um desconto especial de ${dados.desconto}% para pagamento antecipado.`;

    default:
      return `Gere uma mensagem profissional para ${alerta.cliente_nome} sobre: ${JSON.stringify(
        dados
      )}`;
  }
}

function gerarMensagemFallback(alerta: AlertaProativo): string {
  const dados = alerta.dados;

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
