import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { BlingWebhookSchema, BlingWebhookV2Schema, corsHeaders, createErrorResponse } from '../_shared/validation.ts';
import { contractVersionHeaders, validateVersionedContract } from '../_shared/versioned-contract.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { createValidationErrorResponse } from '../_shared/contract-response.ts';
import { authenticateWebhook } from '../_shared/webhook-auth.ts';
import { processWithIdempotency, RetryableError } from '../_shared/webhook-idempotency.ts';


export const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }


  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Rate limit: 120 req/min por IP (webhook público — HMAC continua sendo defesa primária)
    const ip = (req.headers.get('x-forwarded-for') || '0.0.0.0').split(',')[0].trim();
    const rl = await checkRateLimit(supabase, {
      endpoint: 'bling-webhook',
      ip,
      limit: 120,
      windowSeconds: 60,
      userAgent: req.headers.get('user-agent'),
    });
    if (!rl.allowed) return rateLimitResponse(rl, corsHeaders);

    const rawBody = await req.text();
    const auth = await authenticateWebhook(supabase, {
      provider: 'bling',
      req,
      rawBody,
      corsHeaders,
    });
    if (!auth.ok) return auth.response;

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return createValidationErrorResponse([{
        path: '$',
        message: 'JSON malformado',
        code: 'invalid_json',
      }], corsHeaders);
    }
    console.log("Bling webhook received:", JSON.stringify(body));

    const validation = validateVersionedContract(req, body, {
      v1: BlingWebhookSchema, v2: BlingWebhookV2Schema, functionName: 'bling-webhook',
    });
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
    const eventType = payload.event || "unknown";
    const module = payload.module || "unknown";
    const resourceId = payload.data?.id?.toString() || null;
    const retries = payload.retries || 0;


    const externalId = payload.eventId ??
      (resourceId ? `${module}:${resourceId}:${eventType}` : null);
    const { claim, failure } = await processWithIdempotency(
      supabase,
      { source: 'bling', externalId, eventType, payload, maxAttempts: Math.max(5, retries + 1) },
      async () => {
      try {
      switch (module) {
        case "Pedido de Venda":
          await processPedidoEvent(supabase, eventType, payload.data);
          break;

        case "Nota Fiscal":
        case "NF-e":
          await processNFeEvent(supabase, eventType, payload.data);
          break;

        case "Contas a Receber":
          await processContaReceberEvent(supabase, eventType, payload.data);
          break;

        case "Contas a Pagar":
          await processContaPagarEvent(supabase, eventType, payload.data);
          break;

        case "Contatos":
          await processContatoEvent(supabase, eventType, payload.data);
          break;

        case "Produtos":
          await processProdutoEvent(supabase, eventType, payload.data);
          break;

        case "Estoques":
          await processEstoqueEvent(supabase, eventType, payload.data);
          break;

        default:
          console.log(`Unhandled module: ${module}`);
      }
      } catch (processError) {
        throw new RetryableError(processError instanceof Error ? processError.message : 'Erro ao processar evento');
      }
      },
    );
    if (claim.alreadyProcessed) {
      return new Response(JSON.stringify({ ok: true, duplicated: true }), {
        status: 200,
        headers: { ...corsHeaders, ...contractVersionHeaders(validation.version), "Content-Type": "application/json" },
      });
    }
    if (failure) {
      return new Response(JSON.stringify({ ok: false, will_retry: failure.willRetry, status: failure.status }), {
        status: 200,
        headers: { ...corsHeaders, ...contractVersionHeaders(validation.version), "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, processed: true }), {
      status: 200,
      headers: { ...corsHeaders, ...contractVersionHeaders(validation.version), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Bling webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}


// --- Event Processors ---

async function processPedidoEvent(supabase: any, event: string, data: any) {
  const situacao = data?.situacao?.id;
  const pedidoId = data?.id;

  if (event === "situacao:alterada" && situacao) {
    const situacaoNames: Record<number, string> = {
      6: "Em aberto",
      9: "Atendido",
      12: "Cancelado",
      15: "Em andamento",
    };

    const nome = situacaoNames[situacao] || `Situação ${situacao}`;
    const prioridade = situacao === 12 ? "alta" : "media";

    await supabase.from("alertas").insert({
      tipo: "bling_pedido",
      titulo: `Pedido Bling #${pedidoId} → ${nome}`,
      mensagem: `O pedido #${pedidoId} no Bling teve sua situação alterada para "${nome}".`,
      prioridade,
      entidade_tipo: "bling_pedido",
      entidade_id: String(pedidoId),
      acao_url: "/notas-fiscais", // Gap #7: fixed from /bling
    });
  }
}

async function processNFeEvent(supabase: any, event: string, data: any) {
  const nfeId = data?.id;

  if (event === "autorizacao_sefaz" || event === "emissao") {
    await supabase.from("alertas").insert({
      tipo: "bling_nfe",
      titulo: `NF-e Bling #${nfeId} ${event === "autorizacao_sefaz" ? "autorizada" : "emitida"}`,
      mensagem: `A NF-e #${nfeId} foi ${event === "autorizacao_sefaz" ? "autorizada pelo SEFAZ" : "emitida"} no Bling.`,
      prioridade: "baixa",
      entidade_tipo: "bling_nfe",
      entidade_id: String(nfeId),
      acao_url: "/notas-fiscais", // Gap #7: fixed
    });
  }

  if (event === "cancelamento") {
    await supabase.from("alertas").insert({
      tipo: "bling_nfe",
      titulo: `NF-e Bling #${nfeId} cancelada`,
      mensagem: `A NF-e #${nfeId} foi cancelada no Bling.`,
      prioridade: "alta",
      entidade_tipo: "bling_nfe",
      entidade_id: String(nfeId),
      acao_url: "/notas-fiscais", // Gap #7: fixed
    });
  }
}

async function processContaReceberEvent(supabase: any, event: string, data: any) {
  if (event === "baixa") {
    await supabase.from("alertas").insert({
      tipo: "bling_financeiro",
      titulo: `Recebimento registrado no Bling`,
      mensagem: `Uma conta a receber (ID: ${data?.id}) teve baixa registrada no Bling.`,
      prioridade: "baixa",
      entidade_tipo: "bling_conta_receber",
      entidade_id: String(data?.id),
      acao_url: "/notas-fiscais", // Gap #7: fixed
    });
  }
}

async function processContaPagarEvent(supabase: any, event: string, data: any) {
  if (event === "baixa") {
    await supabase.from("alertas").insert({
      tipo: "bling_financeiro",
      titulo: `Pagamento registrado no Bling`,
      mensagem: `Uma conta a pagar (ID: ${data?.id}) teve baixa registrada no Bling.`,
      prioridade: "baixa",
      entidade_tipo: "bling_conta_pagar",
      entidade_id: String(data?.id),
      acao_url: "/notas-fiscais", // Gap #7: fixed
    });
  }
}

// Gap #11: Real sync for Contato events
async function processContatoEvent(supabase: any, event: string, data: any) {
  const contatoId = data?.id;
  if (!contatoId) return;

  if (event === "incluir" || event === "alterar") {
    const nome = data?.nome || data?.nomeFantasia || "";

    if (nome) {
      // Não atualizamos `clientes` por CPF/CNPJ aqui: o payload não traz
      // contexto de empresa e uma busca global pode escrever no tenant errado.
      // A sincronização multiempresa precisa de vínculo explícito por empresa.

      // Always create an alert
      await supabase.from("alertas").insert({
        tipo: "bling_contato",
        titulo: `Contato ${event === "incluir" ? "criado" : "atualizado"} no Bling`,
        mensagem: `O contato "${nome}" (ID: ${contatoId}) foi ${event === "incluir" ? "incluído" : "alterado"} no Bling.`,
        prioridade: "baixa",
        entidade_tipo: "bling_contato",
        entidade_id: String(contatoId),
        acao_url: "/notas-fiscais",
      });
    }
  }

  if (event === "excluir") {
    await supabase.from("alertas").insert({
      tipo: "bling_contato",
      titulo: `Contato excluído no Bling`,
      mensagem: `O contato (ID: ${contatoId}) foi excluído no Bling.`,
      prioridade: "media",
      entidade_tipo: "bling_contato",
      entidade_id: String(contatoId),
      acao_url: "/notas-fiscais",
    });
  }
}

// Gap #11: Real sync for Produto events
async function processProdutoEvent(supabase: any, event: string, data: any) {
  const produtoId = data?.id;
  if (!produtoId) return;

  const nome = data?.nome || data?.descricao || "";
  const sku = data?.codigo || "";

  if (event === "incluir" || event === "alterar") {
    await supabase.from("alertas").insert({
      tipo: "bling_produto",
      titulo: `Produto ${event === "incluir" ? "criado" : "atualizado"} no Bling`,
      mensagem: `O produto "${nome || "sem nome"}" (SKU: ${sku || "N/A"}, ID: ${produtoId}) foi ${event === "incluir" ? "incluído" : "alterado"} no Bling.`,
      prioridade: "baixa",
      entidade_tipo: "bling_produto",
      entidade_id: String(produtoId),
      acao_url: "/notas-fiscais",
    });
  }

  if (event === "excluir") {
    await supabase.from("alertas").insert({
      tipo: "bling_produto",
      titulo: `Produto excluído no Bling`,
      mensagem: `O produto (ID: ${produtoId}) foi excluído no Bling.`,
      prioridade: "media",
      entidade_tipo: "bling_produto",
      entidade_id: String(produtoId),
      acao_url: "/notas-fiscais",
    });
  }
}

async function processEstoqueEvent(supabase: any, event: string, data: any) {
  if (event === "saldo_abaixo_minimo") {
    await supabase.from("alertas").insert({
      tipo: "bling_estoque",
      titulo: `Estoque mínimo atingido no Bling`,
      mensagem: `O produto (ID: ${data?.id}) atingiu o estoque mínimo no Bling. Verificar necessidade de reposição.`,
      prioridade: "alta",
      entidade_tipo: "bling_produto",
      entidade_id: String(data?.id),
      acao_url: "/notas-fiscais", // Gap #7: fixed
    });
  }
}
