import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json();
    console.log("Bling webhook received:", JSON.stringify(payload));

    const eventType = payload.event || "unknown";
    const module = payload.module || "unknown";
    const resourceId = payload.data?.id?.toString() || null;
    const retries = payload.retries || 0;

    // Idempotency check: if same resource_id + event_type was processed, skip
    if (resourceId) {
      const { data: existing } = await supabase
        .from("bling_webhook_events")
        .select("id")
        .eq("resource_id", resourceId)
        .eq("event_type", eventType)
        .eq("processed", true)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`Event already processed: ${eventType} for ${resourceId}`);
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Store event
    const { data: event, error: insertError } = await supabase
      .from("bling_webhook_events")
      .insert({
        event_type: eventType,
        module: module,
        resource_id: resourceId,
        payload: payload,
        retries: retries,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing webhook event:", insertError);
    }

    // Process event based on module
    let processed = false;
    let errorMessage: string | null = null;

    try {
      switch (module) {
        case "Pedido de Venda":
          await processPedidoEvent(supabase, eventType, payload.data);
          processed = true;
          break;

        case "Nota Fiscal":
        case "NF-e":
          await processNFeEvent(supabase, eventType, payload.data);
          processed = true;
          break;

        case "Contas a Receber":
          await processContaReceberEvent(supabase, eventType, payload.data);
          processed = true;
          break;

        case "Contas a Pagar":
          await processContaPagarEvent(supabase, eventType, payload.data);
          processed = true;
          break;

        case "Contatos":
          await processContatoEvent(supabase, eventType, payload.data);
          processed = true;
          break;

        case "Produtos":
          await processProdutoEvent(supabase, eventType, payload.data);
          processed = true;
          break;

        case "Estoques":
          await processEstoqueEvent(supabase, eventType, payload.data);
          processed = true;
          break;

        default:
          console.log(`Unhandled module: ${module}`);
          processed = true; // Mark as processed to avoid re-processing
      }
    } catch (processError) {
      errorMessage =
        processError instanceof Error
          ? processError.message
          : "Erro ao processar evento";
      console.error(`Error processing ${module}/${eventType}:`, processError);
    }

    // Update event status
    if (event?.id) {
      await supabase
        .from("bling_webhook_events")
        .update({
          processed,
          processed_at: processed ? new Date().toISOString() : null,
          error_message: errorMessage,
        })
        .eq("id", event.id);
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "webhook_received",
      table_name: "bling_webhook_events",
      record_id: event?.id || null,
      details: `Bling webhook: ${module} - ${eventType} (resource: ${resourceId})`,
      new_data: payload,
    });

    return new Response(JSON.stringify({ ok: true, processed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
});

// --- Event Processors ---

async function processPedidoEvent(supabase: any, event: string, data: any) {
  const situacao = data?.situacao?.id;
  const pedidoId = data?.id;

  if (event === "situacao:alterada" && situacao) {
    // Create alert for important status changes
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
      acao_url: "/bling",
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
      acao_url: "/bling",
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
      acao_url: "/bling",
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
      acao_url: "/bling",
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
      acao_url: "/bling",
    });
  }
}

async function processContatoEvent(supabase: any, event: string, data: any) {
  console.log(`Contato event: ${event}, ID: ${data?.id}`);
}

async function processProdutoEvent(supabase: any, event: string, data: any) {
  console.log(`Produto event: ${event}, ID: ${data?.id}`);
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
      acao_url: "/bling",
    });
  }
}
