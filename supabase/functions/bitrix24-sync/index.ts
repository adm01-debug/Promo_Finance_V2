import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BitrixResponse {
  result?: any;
  error?: string;
  error_description?: string;
  total?: number;
  next?: number;
}

interface SyncRequest {
  action: "sync_deals" | "sync_contacts" | "sync_companies" | "export_payment_status" | "test_connection" | "refresh_token";
  params?: Record<string, any>;
}

const BITRIX_DOMAIN = Deno.env.get("BITRIX24_DOMAIN");
const CLIENT_ID = Deno.env.get("BITRIX24_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("BITRIX24_CLIENT_SECRET");

async function getValidToken(supabase: any): Promise<string> {
  // First try to get token from database
  const { data: tokenData } = await supabase
    .from("bitrix_oauth_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (tokenData) {
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    // If token is still valid (with 5 min buffer), use it
    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
      return tokenData.access_token;
    }
    
    // Token expired, try to refresh
    console.log("[bitrix24-sync] Token expired, refreshing...");
    const refreshed = await refreshOAuthToken(supabase, tokenData.refresh_token);
    if (refreshed) {
      return refreshed;
    }
  }
  
  // Fall back to environment variable token
  const envToken = Deno.env.get("BITRIX24_ACCESS_TOKEN");
  if (!envToken) {
    throw new Error("No valid Bitrix24 access token available");
  }
  
  return envToken;
}

async function refreshOAuthToken(supabase: any, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`https://${BITRIX_DOMAIN}/oauth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID || "",
        client_secret: CLIENT_SECRET || "",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("[bitrix24-sync] Failed to refresh token:", await response.text());
      return null;
    }

    const data = await response.json();
    
    // Calculate expiration (Bitrix tokens typically last 1 hour)
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
    
    // Save new tokens to database
    await supabase.from("bitrix_oauth_tokens").insert({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt.toISOString(),
    });

    console.log("[bitrix24-sync] Token refreshed successfully");
    return data.access_token;
  } catch (error) {
    console.error("[bitrix24-sync] Error refreshing token:", error);
    return null;
  }
}

async function callBitrixAPI(
  method: string,
  accessToken: string,
  params?: Record<string, any>
): Promise<BitrixResponse> {
  const url = new URL(`https://${BITRIX_DOMAIN}/rest/${method}`);
  
  const body = new URLSearchParams();
  body.append("auth", accessToken);
  
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "object") {
        body.append(key, JSON.stringify(value));
      } else {
        body.append(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });

  const data = await response.json();
  
  if (data.error) {
    console.error(`[bitrix24-sync] API Error: ${data.error} - ${data.error_description}`);
  }
  
  return data;
}

async function testConnection(accessToken: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const result = await callBitrixAPI("profile", accessToken);
    
    if (result.error) {
      return { success: false, message: `Erro de conexão: ${result.error_description || result.error}` };
    }
    
    return { 
      success: true, 
      message: "Conexão estabelecida com sucesso",
      data: result.result
    };
  } catch (error: any) {
    return { success: false, message: `Erro: ${error?.message || "Erro desconhecido"}` };
  }
}

async function syncDeals(
  supabase: any,
  accessToken: string,
  userId: string
): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  console.log("[bitrix24-sync] Starting deals sync...");
  
  // Create sync log
  const { data: logData } = await supabase.from("bitrix_sync_logs").insert({
    tipo: "entrada",
    entidade: "deals",
    status: "pendente",
    created_by: userId,
  }).select().single();

  const logId = logData?.id;
  let processed = 0;
  let errors = 0;
  let start = 0;
  const batchSize = 50;

  try {
    // Get field mappings
    const { data: mappings } = await supabase
      .from("bitrix_field_mappings")
      .select("*")
      .eq("entidade", "deal")
      .eq("ativo", true);

    // Get first empresa_id
    const { data: empresas } = await supabase.from("empresas").select("id").limit(1);
    const empresaId = empresas?.[0]?.id;

    if (!empresaId) {
      throw new Error("Nenhuma empresa cadastrada no sistema");
    }

    while (true) {
      const result = await callBitrixAPI("crm.deal.list", accessToken, {
        start,
        select: ["ID", "TITLE", "OPPORTUNITY", "CLOSEDATE", "COMPANY_ID", "STAGE_ID", "CURRENCY_ID"],
        order: { ID: "ASC" },
      });

      if (result.error) {
        throw new Error(result.error_description || result.error);
      }

      const deals = result.result || [];
      
      for (const deal of deals) {
        try {
          // Map Bitrix deal to conta_receber
          const contaData = {
            bitrix_deal_id: String(deal.ID),
            descricao: deal.TITLE || `Deal #${deal.ID}`,
            valor: parseFloat(deal.OPPORTUNITY) || 0,
            data_vencimento: deal.CLOSEDATE ? deal.CLOSEDATE.split("T")[0] : new Date().toISOString().split("T")[0],
            cliente_nome: `Bitrix Deal #${deal.ID}`,
            empresa_id: empresaId,
            created_by: userId,
            status: "pendente",
          };

          // Check if already exists
          const { data: existing } = await supabase
            .from("contas_receber")
            .select("id")
            .eq("bitrix_deal_id", String(deal.ID))
            .single();

          if (existing) {
            // Update
            await supabase
              .from("contas_receber")
              .update(contaData)
              .eq("id", existing.id);
          } else {
            // Insert
            await supabase.from("contas_receber").insert(contaData);
          }

          processed++;
        } catch (err) {
          console.error(`[bitrix24-sync] Error processing deal ${deal.ID}:`, err);
          errors++;
        }
      }

      // Check if there are more records
      if (!result.next) break;
      start = result.next;
    }

    // Update sync log
    await supabase.from("bitrix_sync_logs").update({
      status: errors > 0 ? "parcial" : "sucesso",
      registros_processados: processed,
      registros_com_erro: errors,
      finalizado_em: new Date().toISOString(),
    }).eq("id", logId);

    return {
      success: true,
      processed,
      errors,
      message: `Sincronização concluída: ${processed} deals importados, ${errors} erros`,
    };
  } catch (error: any) {
    console.error("[bitrix24-sync] Sync failed:", error);
    
    await supabase.from("bitrix_sync_logs").update({
      status: "erro",
      registros_processados: processed,
      registros_com_erro: errors,
      mensagem_erro: error?.message || "Erro desconhecido",
      finalizado_em: new Date().toISOString(),
    }).eq("id", logId);

    return {
      success: false,
      processed,
      errors,
      message: `Erro na sincronização: ${error?.message || "Erro desconhecido"}`,
    };
  }
}

async function syncContacts(
  supabase: any,
  accessToken: string,
  userId: string
): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  console.log("[bitrix24-sync] Starting contacts sync...");
  
  const { data: logData } = await supabase.from("bitrix_sync_logs").insert({
    tipo: "entrada",
    entidade: "contacts",
    status: "pendente",
    created_by: userId,
  }).select().single();

  const logId = logData?.id;
  let processed = 0;
  let errors = 0;
  let start = 0;

  try {
    while (true) {
      const result = await callBitrixAPI("crm.contact.list", accessToken, {
        start,
        select: ["ID", "NAME", "LAST_NAME", "EMAIL", "PHONE", "ADDRESS", "ADDRESS_CITY", "ADDRESS_PROVINCE"],
        order: { ID: "ASC" },
      });

      if (result.error) {
        throw new Error(result.error_description || result.error);
      }

      const contacts = result.result || [];
      
      for (const contact of contacts) {
        try {
          const clienteData = {
            bitrix_id: String(contact.ID),
            razao_social: `${contact.NAME || ""} ${contact.LAST_NAME || ""}`.trim() || `Contato #${contact.ID}`,
            email: Array.isArray(contact.EMAIL) ? contact.EMAIL[0]?.VALUE : contact.EMAIL,
            telefone: Array.isArray(contact.PHONE) ? contact.PHONE[0]?.VALUE : contact.PHONE,
            cidade: contact.ADDRESS_CITY,
            estado: contact.ADDRESS_PROVINCE,
            endereco: contact.ADDRESS,
          };

          const { data: existing } = await supabase
            .from("clientes")
            .select("id")
            .eq("bitrix_id", String(contact.ID))
            .single();

          if (existing) {
            await supabase.from("clientes").update(clienteData).eq("id", existing.id);
          } else {
            await supabase.from("clientes").insert(clienteData);
          }

          processed++;
        } catch (err) {
          console.error(`[bitrix24-sync] Error processing contact ${contact.ID}:`, err);
          errors++;
        }
      }

      if (!result.next) break;
      start = result.next;
    }

    await supabase.from("bitrix_sync_logs").update({
      status: errors > 0 ? "parcial" : "sucesso",
      registros_processados: processed,
      registros_com_erro: errors,
      finalizado_em: new Date().toISOString(),
    }).eq("id", logId);

    return {
      success: true,
      processed,
      errors,
      message: `Sincronização concluída: ${processed} contatos importados, ${errors} erros`,
    };
  } catch (error: any) {
    console.error("[bitrix24-sync] Contacts sync failed:", error);
    
    await supabase.from("bitrix_sync_logs").update({
      status: "erro",
      registros_processados: processed,
      registros_com_erro: errors,
      mensagem_erro: error?.message || "Erro desconhecido",
      finalizado_em: new Date().toISOString(),
    }).eq("id", logId);

    return {
      success: false,
      processed,
      errors,
      message: `Erro na sincronização: ${error?.message || "Erro desconhecido"}`,
    };
  }
}

async function syncCompanies(
  supabase: any,
  accessToken: string,
  userId: string
): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  console.log("[bitrix24-sync] Starting companies sync...");
  
  const { data: logData } = await supabase.from("bitrix_sync_logs").insert({
    tipo: "entrada",
    entidade: "companies",
    status: "pendente",
    created_by: userId,
  }).select().single();

  const logId = logData?.id;
  let processed = 0;
  let errors = 0;
  let start = 0;

  try {
    while (true) {
      const result = await callBitrixAPI("crm.company.list", accessToken, {
        start,
        select: ["ID", "TITLE", "EMAIL", "PHONE", "ADDRESS", "ADDRESS_CITY", "ADDRESS_PROVINCE"],
        order: { ID: "ASC" },
      });

      if (result.error) {
        throw new Error(result.error_description || result.error);
      }

      const companies = result.result || [];
      
      for (const company of companies) {
        try {
          const clienteData = {
            bitrix_id: String(company.ID),
            razao_social: company.TITLE || `Empresa #${company.ID}`,
            email: Array.isArray(company.EMAIL) ? company.EMAIL[0]?.VALUE : company.EMAIL,
            telefone: Array.isArray(company.PHONE) ? company.PHONE[0]?.VALUE : company.PHONE,
            cidade: company.ADDRESS_CITY,
            estado: company.ADDRESS_PROVINCE,
            endereco: company.ADDRESS,
          };

          const { data: existing } = await supabase
            .from("clientes")
            .select("id")
            .eq("bitrix_id", String(company.ID))
            .single();

          if (existing) {
            await supabase.from("clientes").update(clienteData).eq("id", existing.id);
          } else {
            await supabase.from("clientes").insert(clienteData);
          }

          processed++;
        } catch (err) {
          console.error(`[bitrix24-sync] Error processing company ${company.ID}:`, err);
          errors++;
        }
      }

      if (!result.next) break;
      start = result.next;
    }

    await supabase.from("bitrix_sync_logs").update({
      status: errors > 0 ? "parcial" : "sucesso",
      registros_processados: processed,
      registros_com_erro: errors,
      finalizado_em: new Date().toISOString(),
    }).eq("id", logId);

    return {
      success: true,
      processed,
      errors,
      message: `Sincronização concluída: ${processed} empresas importadas, ${errors} erros`,
    };
  } catch (error: any) {
    console.error("[bitrix24-sync] Companies sync failed:", error);
    
    await supabase.from("bitrix_sync_logs").update({
      status: "erro",
      registros_processados: processed,
      registros_com_erro: errors,
      mensagem_erro: error?.message || "Erro desconhecido",
      finalizado_em: new Date().toISOString(),
    }).eq("id", logId);

    return {
      success: false,
      processed,
      errors,
      message: `Erro na sincronização: ${error?.message || "Erro desconhecido"}`,
    };
  }
}

async function exportPaymentStatus(
  supabase: any,
  accessToken: string,
  userId: string
): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  console.log("[bitrix24-sync] Starting payment status export...");
  
  const { data: logData } = await supabase.from("bitrix_sync_logs").insert({
    tipo: "saida",
    entidade: "payment_status",
    status: "pendente",
    created_by: userId,
  }).select().single();

  const logId = logData?.id;
  let processed = 0;
  let errors = 0;

  try {
    // Get contas_receber with bitrix_deal_id that are paid
    const { data: contasPagas } = await supabase
      .from("contas_receber")
      .select("*")
      .not("bitrix_deal_id", "is", null)
      .eq("status", "pago");

    for (const conta of contasPagas || []) {
      try {
        // Update deal stage in Bitrix to "WON"
        const result = await callBitrixAPI("crm.deal.update", accessToken, {
          id: conta.bitrix_deal_id,
          fields: {
            STAGE_ID: "WON",
            COMMENTS: `Pagamento recebido em ${conta.data_recebimento || new Date().toISOString().split("T")[0]}`,
          },
        });

        if (result.error) {
          throw new Error(result.error_description || result.error);
        }

        processed++;
      } catch (err) {
        console.error(`[bitrix24-sync] Error updating deal ${conta.bitrix_deal_id}:`, err);
        errors++;
      }
    }

    await supabase.from("bitrix_sync_logs").update({
      status: errors > 0 ? "parcial" : "sucesso",
      registros_processados: processed,
      registros_com_erro: errors,
      finalizado_em: new Date().toISOString(),
    }).eq("id", logId);

    return {
      success: true,
      processed,
      errors,
      message: `Exportação concluída: ${processed} status atualizados, ${errors} erros`,
    };
  } catch (error: any) {
    console.error("[bitrix24-sync] Export failed:", error);
    
    await supabase.from("bitrix_sync_logs").update({
      status: "erro",
      registros_processados: processed,
      registros_com_erro: errors,
      mensagem_erro: error?.message || "Erro desconhecido",
      finalizado_em: new Date().toISOString(),
    }).eq("id", logId);

    return {
      success: false,
      processed,
      errors,
      message: `Erro na exportação: ${error?.message || "Erro desconhecido"}`,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid authentication token");
    }

    const { action, params }: SyncRequest = await req.json();
    console.log(`[bitrix24-sync] Action: ${action}, User: ${user.id}`);

    // Get valid Bitrix token
    const accessToken = await getValidToken(supabase);

    let result;
    switch (action) {
      case "test_connection":
        result = await testConnection(accessToken);
        break;
      case "sync_deals":
        result = await syncDeals(supabase, accessToken, user.id);
        break;
      case "sync_contacts":
        result = await syncContacts(supabase, accessToken, user.id);
        break;
      case "sync_companies":
        result = await syncCompanies(supabase, accessToken, user.id);
        break;
      case "export_payment_status":
        result = await exportPaymentStatus(supabase, accessToken, user.id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[bitrix24-sync] Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error?.message || "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
