import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BitrixWebhookEvent {
  event: string;
  data: {
    FIELDS: Record<string, any>;
  };
  ts: string;
  auth: {
    domain: string;
    client_endpoint: string;
    server_endpoint: string;
    member_id: string;
    application_token: string;
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BITRIX_APPLICATION_TOKEN = Deno.env.get("BITRIX24_APPLICATION_TOKEN");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[bitrix24-webhook] Received webhook request");

    // Parse the webhook payload
    const contentType = req.headers.get("content-type") || "";
    let payload: BitrixWebhookEvent | null = null;

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const data: Record<string, any> = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      payload = {
        event: data.event || "",
        data: { FIELDS: data.data || {} },
        ts: data.ts || "",
        auth: {
          domain: data["auth[domain]"] || "",
          client_endpoint: data["auth[client_endpoint]"] || "",
          server_endpoint: data["auth[server_endpoint]"] || "",
          member_id: data["auth[member_id]"] || "",
          application_token: data["auth[application_token]"] || "",
        },
      };
    }

    if (!payload) {
      console.error("[bitrix24-webhook] Invalid payload format");
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[bitrix24-webhook] Event: ${payload.event}`, JSON.stringify(payload.data));

    // Validate application token if configured
    if (BITRIX_APPLICATION_TOKEN && payload.auth?.application_token !== BITRIX_APPLICATION_TOKEN) {
      console.warn("[bitrix24-webhook] Invalid application token");
      // Don't reject - Bitrix may send events with different tokens
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Log the webhook event
    await supabase.from("bitrix_webhook_events").insert({
      event_type: payload.event,
      payload: payload.data,
      processed: false,
      received_at: new Date().toISOString(),
    });

    // Process event based on type
    const result = await processWebhookEvent(supabase, payload);

    console.log(`[bitrix24-webhook] Processed event ${payload.event}:`, result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[bitrix24-webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processWebhookEvent(
  supabase: any,
  event: BitrixWebhookEvent
): Promise<{ action: string; entityId?: string; success: boolean }> {
  const eventType = event.event.toLowerCase();
  const fields = event.data?.FIELDS || {};

  // Deal events
  if (eventType.includes("oncrmdeal")) {
    return await processDealEvent(supabase, eventType, fields);
  }

  // Contact events
  if (eventType.includes("oncrmcontact")) {
    return await processContactEvent(supabase, eventType, fields);
  }

  // Company events
  if (eventType.includes("oncrmcompany")) {
    return await processCompanyEvent(supabase, eventType, fields);
  }

  // Invoice events
  if (eventType.includes("oncrminvoice") || eventType.includes("oncrmsmartinvoice")) {
    return await processInvoiceEvent(supabase, eventType, fields);
  }

  // Lead events
  if (eventType.includes("oncrmlead")) {
    return await processLeadEvent(supabase, eventType, fields);
  }

  // Activity events (tasks, calls, emails)
  if (eventType.includes("oncrmactivity")) {
    return await processActivityEvent(supabase, eventType, fields);
  }

  console.log(`[bitrix24-webhook] Unhandled event type: ${eventType}`);
  return { action: "ignored", success: true };
}

async function processDealEvent(
  supabase: any,
  eventType: string,
  fields: Record<string, any>
): Promise<{ action: string; entityId?: string; success: boolean }> {
  const dealId = fields.ID?.toString();

  if (!dealId) {
    console.warn("[bitrix24-webhook] Deal event without ID");
    return { action: "error", success: false };
  }

  // Get first empresa for new records
  const { data: empresas } = await supabase.from("empresas").select("id").limit(1);
  const empresaId = empresas?.[0]?.id;

  if (eventType.includes("add") || eventType.includes("update")) {
    // Map Bitrix deal to conta_receber
    const contaData = {
      bitrix_deal_id: dealId,
      descricao: fields.TITLE || `Negócio Bitrix #${dealId}`,
      valor: parseFloat(fields.OPPORTUNITY) || 0,
      data_vencimento: fields.CLOSEDATE
        ? fields.CLOSEDATE.split("T")[0]
        : new Date().toISOString().split("T")[0],
      cliente_nome: fields.COMPANY_TITLE || fields.CONTACT_FULL_NAME || `Bitrix Deal #${dealId}`,
      empresa_id: empresaId,
      status: mapDealStageToStatus(fields.STAGE_ID),
    };

    // Check if exists
    const { data: existing } = await supabase
      .from("contas_receber")
      .select("id")
      .eq("bitrix_deal_id", dealId)
      .single();

    if (existing) {
      await supabase.from("contas_receber").update(contaData).eq("id", existing.id);
      console.log(`[bitrix24-webhook] Updated conta_receber for deal ${dealId}`);
      return { action: "updated", entityId: dealId, success: true };
    } else if (empresaId) {
      // Only insert if we have empresa_id and created_by
      const { data: systemUser } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();

      if (systemUser) {
        await supabase.from("contas_receber").insert({
          ...contaData,
          created_by: systemUser.id,
        });
        console.log(`[bitrix24-webhook] Created conta_receber for deal ${dealId}`);
        return { action: "created", entityId: dealId, success: true };
      }
    }

    return { action: "skipped", entityId: dealId, success: true };
  }

  if (eventType.includes("delete")) {
    // Mark as cancelled instead of deleting
    await supabase
      .from("contas_receber")
      .update({ status: "cancelado" })
      .eq("bitrix_deal_id", dealId);
    console.log(`[bitrix24-webhook] Cancelled conta_receber for deleted deal ${dealId}`);
    return { action: "deleted", entityId: dealId, success: true };
  }

  return { action: "ignored", success: true };
}

async function processContactEvent(
  supabase: any,
  eventType: string,
  fields: Record<string, any>
): Promise<{ action: string; entityId?: string; success: boolean }> {
  const contactId = fields.ID?.toString();

  if (!contactId) {
    return { action: "error", success: false };
  }

  if (eventType.includes("add") || eventType.includes("update")) {
    const clienteData = {
      bitrix_id: contactId,
      razao_social:
        `${fields.NAME || ""} ${fields.LAST_NAME || ""}`.trim() || `Contato #${contactId}`,
      email: extractFirstValue(fields.EMAIL),
      telefone: extractFirstValue(fields.PHONE),
      cidade: fields.ADDRESS_CITY,
      estado: fields.ADDRESS_PROVINCE,
      endereco: fields.ADDRESS,
    };

    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("bitrix_id", contactId)
      .single();

    if (existing) {
      await supabase.from("clientes").update(clienteData).eq("id", existing.id);
      return { action: "updated", entityId: contactId, success: true };
    } else {
      await supabase.from("clientes").insert(clienteData);
      return { action: "created", entityId: contactId, success: true };
    }
  }

  if (eventType.includes("delete")) {
    await supabase.from("clientes").update({ ativo: false }).eq("bitrix_id", contactId);
    return { action: "deleted", entityId: contactId, success: true };
  }

  return { action: "ignored", success: true };
}

async function processCompanyEvent(
  supabase: any,
  eventType: string,
  fields: Record<string, any>
): Promise<{ action: string; entityId?: string; success: boolean }> {
  const companyId = fields.ID?.toString();

  if (!companyId) {
    return { action: "error", success: false };
  }

  if (eventType.includes("add") || eventType.includes("update")) {
    const clienteData = {
      bitrix_id: companyId,
      razao_social: fields.TITLE || `Empresa #${companyId}`,
      email: extractFirstValue(fields.EMAIL),
      telefone: extractFirstValue(fields.PHONE),
      cidade: fields.ADDRESS_CITY,
      estado: fields.ADDRESS_PROVINCE,
      endereco: fields.ADDRESS,
    };

    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("bitrix_id", companyId)
      .single();

    if (existing) {
      await supabase.from("clientes").update(clienteData).eq("id", existing.id);
      return { action: "updated", entityId: companyId, success: true };
    } else {
      await supabase.from("clientes").insert(clienteData);
      return { action: "created", entityId: companyId, success: true };
    }
  }

  if (eventType.includes("delete")) {
    await supabase.from("clientes").update({ ativo: false }).eq("bitrix_id", companyId);
    return { action: "deleted", entityId: companyId, success: true };
  }

  return { action: "ignored", success: true };
}

async function processInvoiceEvent(
  supabase: any,
  eventType: string,
  fields: Record<string, any>
): Promise<{ action: string; entityId?: string; success: boolean }> {
  const invoiceId = fields.ID?.toString();

  if (!invoiceId) {
    return { action: "error", success: false };
  }

  console.log(`[bitrix24-webhook] Processing invoice event: ${eventType} for ID ${invoiceId}`);

  // Get first empresa
  const { data: empresas } = await supabase.from("empresas").select("id").limit(1);
  const empresaId = empresas?.[0]?.id;

  if (eventType.includes("add") || eventType.includes("update")) {
    const contaData = {
      bitrix_deal_id: `invoice_${invoiceId}`,
      descricao: fields.TITLE || `Fatura Bitrix #${invoiceId}`,
      valor: parseFloat(fields.PRICE) || parseFloat(fields.OPPORTUNITY) || 0,
      data_vencimento: fields.PAY_BEFORE_DATE
        ? fields.PAY_BEFORE_DATE.split("T")[0]
        : new Date().toISOString().split("T")[0],
      cliente_nome: fields.COMPANY_TITLE || fields.CONTACT_FULL_NAME || `Invoice #${invoiceId}`,
      empresa_id: empresaId,
      status: mapInvoiceStatusToPaymentStatus(fields.STATUS_ID),
    };

    const { data: existing } = await supabase
      .from("contas_receber")
      .select("id")
      .eq("bitrix_deal_id", `invoice_${invoiceId}`)
      .single();

    if (existing) {
      await supabase.from("contas_receber").update(contaData).eq("id", existing.id);
      return { action: "updated", entityId: invoiceId, success: true };
    } else if (empresaId) {
      const { data: systemUser } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();

      if (systemUser) {
        await supabase.from("contas_receber").insert({
          ...contaData,
          created_by: systemUser.id,
        });
        return { action: "created", entityId: invoiceId, success: true };
      }
    }

    return { action: "skipped", entityId: invoiceId, success: true };
  }

  return { action: "ignored", success: true };
}

async function processLeadEvent(
  supabase: any,
  eventType: string,
  fields: Record<string, any>
): Promise<{ action: string; entityId?: string; success: boolean }> {
  const leadId = fields.ID?.toString();

  if (!leadId) {
    return { action: "error", success: false };
  }

  console.log(`[bitrix24-webhook] Processing lead event: ${eventType} for ID ${leadId}`);

  // Leads are potential clients, add to clientes with lower score
  if (eventType.includes("add") || eventType.includes("update")) {
    const clienteData = {
      bitrix_id: `lead_${leadId}`,
      razao_social: fields.TITLE || fields.NAME || `Lead #${leadId}`,
      email: extractFirstValue(fields.EMAIL),
      telefone: extractFirstValue(fields.PHONE),
      score: 500, // Lower score for leads
      observacoes: `Lead do Bitrix24 - Status: ${fields.STATUS_ID || "N/A"}`,
    };

    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("bitrix_id", `lead_${leadId}`)
      .single();

    if (existing) {
      await supabase.from("clientes").update(clienteData).eq("id", existing.id);
      return { action: "updated", entityId: leadId, success: true };
    } else {
      await supabase.from("clientes").insert(clienteData);
      return { action: "created", entityId: leadId, success: true };
    }
  }

  return { action: "ignored", success: true };
}

async function processActivityEvent(
  supabase: any,
  eventType: string,
  fields: Record<string, any>
): Promise<{ action: string; entityId?: string; success: boolean }> {
  const activityId = fields.ID?.toString();

  console.log(`[bitrix24-webhook] Activity event: ${eventType} for ID ${activityId}`);

  // Log activity events for future reference
  // Could be used to track calls, emails, tasks related to payments

  return { action: "logged", entityId: activityId, success: true };
}

// Helper functions
function extractFirstValue(field: any): string | null {
  if (Array.isArray(field) && field.length > 0) {
    return field[0]?.VALUE || null;
  }
  return typeof field === "string" ? field : null;
}

function mapDealStageToStatus(stageId: string): string {
  if (!stageId) return "pendente";

  const stage = stageId.toUpperCase();

  if (stage.includes("WON") || stage.includes("FINAL")) {
    return "pago";
  }
  if (stage.includes("LOSE") || stage.includes("LOST")) {
    return "cancelado";
  }
  if (stage.includes("PREPAYMENT") || stage.includes("PAYMENT")) {
    return "parcial";
  }

  return "pendente";
}

function mapInvoiceStatusToPaymentStatus(statusId: string): string {
  if (!statusId) return "pendente";

  const status = statusId.toUpperCase();

  if (status.includes("P") || status.includes("PAID")) {
    return "pago";
  }
  if (status.includes("D") || status.includes("DECLINED") || status.includes("CANCELLED")) {
    return "cancelado";
  }

  return "pendente";
}
