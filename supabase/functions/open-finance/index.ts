import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OpenFinanceRequest {
  action:
    | "get_institutions"
    | "create_consent"
    | "get_accounts"
    | "get_balances"
    | "get_transactions"
    | "import_transactions"
    | "refresh_token"
    | "revoke_consent";
  params?: Record<string, any>;
}

// Open Finance Brasil API endpoints (sandbox)
const OPEN_FINANCE_BASE_URL = Deno.env.get("OPEN_FINANCE_BASE_URL") || "https://api.openbanking.org.br/sandbox";
const OPEN_FINANCE_CLIENT_ID = Deno.env.get("OPEN_FINANCE_CLIENT_ID");
const OPEN_FINANCE_CLIENT_SECRET = Deno.env.get("OPEN_FINANCE_CLIENT_SECRET");
const OPEN_FINANCE_REDIRECT_URI = Deno.env.get("OPEN_FINANCE_REDIRECT_URI");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, params }: OpenFinanceRequest = await req.json();
    console.log(`[open-finance] Action: ${action}, User: ${user.id}`);

    let result;

    switch (action) {
      case "get_institutions":
        result = await getParticipatingInstitutions();
        break;

      case "create_consent":
        result = await createConsent(supabase, user.id, params);
        break;

      case "get_accounts":
        result = await getAccounts(supabase, user.id, params?.consent_id);
        break;

      case "get_balances":
        result = await getBalances(supabase, user.id, params?.consent_id, params?.account_id);
        break;

      case "get_transactions":
        result = await getTransactions(
          supabase,
          user.id,
          params?.consent_id,
          params?.account_id,
          params?.start_date,
          params?.end_date
        );
        break;

      case "import_transactions":
        result = await importTransactionsToSystem(
          supabase,
          user.id,
          params?.consent_id,
          params?.account_id,
          params?.conta_bancaria_id,
          params?.start_date,
          params?.end_date
        );
        break;

      case "refresh_token":
        result = await refreshAccessToken(supabase, user.id, params?.consent_id);
        break;

      case "revoke_consent":
        result = await revokeConsent(supabase, user.id, params?.consent_id);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[open-finance] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Get list of participating institutions in Open Finance Brazil
async function getParticipatingInstitutions(): Promise<any> {
  console.log("[open-finance] Fetching participating institutions");

  // This would call the Open Finance directory API
  // For now, return a simulated list of major Brazilian banks
  const institutions = [
    {
      id: "bb",
      name: "Banco do Brasil",
      logo: "https://www.bb.com.br/docs/portal/img/logobb.png",
      status: "active",
      api_base_url: "https://openbanking.bb.com.br",
    },
    {
      id: "itau",
      name: "Itaú Unibanco",
      logo: "https://www.itau.com.br/_arquivosestaticos/Itau/defaultTheme/img/logo-itau.png",
      status: "active",
      api_base_url: "https://secure.api.itau",
    },
    {
      id: "bradesco",
      name: "Bradesco",
      logo: "https://banco.bradesco/assets/classic/img/logo-bradesco.png",
      status: "active",
      api_base_url: "https://openbanking.bradesco.com.br",
    },
    {
      id: "santander",
      name: "Santander Brasil",
      logo: "https://www.santander.com.br/institucional/img/logo-santander.png",
      status: "active",
      api_base_url: "https://openbanking.santander.com.br",
    },
    {
      id: "caixa",
      name: "Caixa Econômica Federal",
      logo: "https://www.caixa.gov.br/PublishingImages/marca-caixa.png",
      status: "active",
      api_base_url: "https://openbanking.caixa.gov.br",
    },
    {
      id: "nubank",
      name: "Nubank",
      logo: "https://nubank.com.br/images/nu-icon.png",
      status: "active",
      api_base_url: "https://prod-global-webapp-proxy.nubank.com.br",
    },
    {
      id: "inter",
      name: "Banco Inter",
      logo: "https://static.bancointer.com.br/images/logoInter.svg",
      status: "active",
      api_base_url: "https://openbanking.bancointer.com.br",
    },
    {
      id: "c6bank",
      name: "C6 Bank",
      logo: "https://www.c6bank.com.br/assets/images/logo-c6bank.svg",
      status: "active",
      api_base_url: "https://openbanking.c6bank.com.br",
    },
  ];

  return {
    success: true,
    institutions,
    total: institutions.length,
  };
}

// Create consent request for Open Finance access
async function createConsent(
  supabase: any,
  userId: string,
  params?: Record<string, any>
): Promise<any> {
  const institutionId = params?.institution_id;
  const permissions = params?.permissions || [
    "ACCOUNTS_READ",
    "ACCOUNTS_BALANCES_READ",
    "RESOURCES_READ",
    "CREDIT_CARDS_ACCOUNTS_READ",
    "CREDIT_CARDS_ACCOUNTS_BILLS_READ",
  ];

  console.log(`[open-finance] Creating consent for user ${userId} at institution ${institutionId}`);

  // In a real implementation, this would:
  // 1. Call the institution's consent API
  // 2. Redirect user to bank for authorization
  // 3. Receive callback with authorization code
  // 4. Exchange code for access token

  // Simulated consent creation
  const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

  // Store consent in database
  await supabase.from("open_finance_consents").insert({
    id: consentId,
    user_id: userId,
    institution_id: institutionId,
    permissions: permissions,
    status: "awaiting_authorization",
    expires_at: expiresAt.toISOString(),
  });

  // Build authorization URL
  const authUrl = buildAuthorizationUrl(institutionId, consentId, permissions);

  return {
    success: true,
    consent_id: consentId,
    authorization_url: authUrl,
    expires_at: expiresAt.toISOString(),
    message: "Redirecione o usuário para a URL de autorização",
  };
}

function buildAuthorizationUrl(
  institutionId: string,
  consentId: string,
  permissions: string[]
): string {
  // This would be the actual bank's authorization URL
  const baseUrl = `https://openbanking.example.com/authorize`;
  const params = new URLSearchParams({
    client_id: OPEN_FINANCE_CLIENT_ID || "",
    redirect_uri: OPEN_FINANCE_REDIRECT_URI || "",
    response_type: "code",
    scope: permissions.join(" "),
    state: consentId,
  });

  return `${baseUrl}?${params.toString()}`;
}

// Get linked accounts
async function getAccounts(
  supabase: any,
  userId: string,
  consentId?: string
): Promise<any> {
  console.log(`[open-finance] Getting accounts for user ${userId}, consent ${consentId}`);

  // Check consent is valid
  if (consentId) {
    const { data: consent } = await supabase
      .from("open_finance_consents")
      .select("*")
      .eq("id", consentId)
      .eq("user_id", userId)
      .eq("status", "authorized")
      .single();

    if (!consent) {
      throw new Error("Consentimento não encontrado ou não autorizado");
    }
  }

  // In a real implementation, call the bank's accounts API
  // For demo, return simulated accounts
  const accounts = [
    {
      id: "acc_001",
      type: "CONTA_CORRENTE",
      subtype: "INDIVIDUAL",
      currency: "BRL",
      accountNumber: "****1234",
      branch: "0001",
      bank: {
        code: "341",
        name: "Itaú Unibanco",
      },
    },
    {
      id: "acc_002",
      type: "CONTA_POUPANCA",
      subtype: "INDIVIDUAL",
      currency: "BRL",
      accountNumber: "****5678",
      branch: "0001",
      bank: {
        code: "341",
        name: "Itaú Unibanco",
      },
    },
  ];

  return {
    success: true,
    accounts,
    total: accounts.length,
  };
}

// Get account balances
async function getBalances(
  supabase: any,
  userId: string,
  consentId?: string,
  accountId?: string
): Promise<any> {
  console.log(`[open-finance] Getting balances for account ${accountId}`);

  // Simulated balances
  const balances = {
    account_id: accountId,
    available: {
      amount: "245890.50",
      currency: "BRL",
    },
    current: {
      amount: "248500.00",
      currency: "BRL",
    },
    blocked: {
      amount: "2609.50",
      currency: "BRL",
    },
    updated_at: new Date().toISOString(),
  };

  return {
    success: true,
    balances,
  };
}

// Get account transactions
async function getTransactions(
  supabase: any,
  userId: string,
  consentId?: string,
  accountId?: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  console.log(`[open-finance] Getting transactions for account ${accountId}`);

  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate || new Date().toISOString();

  // Simulated transactions
  const transactions = [
    {
      id: "txn_001",
      type: "PIX",
      amount: "-1500.00",
      currency: "BRL",
      description: "PIX Enviado - FORNECEDOR LTDA",
      category: "TRANSFER",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "COMPLETED",
    },
    {
      id: "txn_002",
      type: "PIX",
      amount: "5000.00",
      currency: "BRL",
      description: "PIX Recebido - CLIENTE ABC",
      category: "TRANSFER",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "COMPLETED",
    },
    {
      id: "txn_003",
      type: "TED",
      amount: "-8500.00",
      currency: "BRL",
      description: "TED - PAGTO FORNECEDOR",
      category: "TRANSFER",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "COMPLETED",
    },
    {
      id: "txn_004",
      type: "BOLETO",
      amount: "-2350.00",
      currency: "BRL",
      description: "PGTO BOLETO - ENERGIA ELETRICA",
      category: "BILL_PAYMENT",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "COMPLETED",
    },
    {
      id: "txn_005",
      type: "CREDIT",
      amount: "12500.00",
      currency: "BRL",
      description: "DEP BOLETO - FATURA 12345",
      category: "DEPOSIT",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "COMPLETED",
    },
  ];

  return {
    success: true,
    transactions,
    total: transactions.length,
    period: { start, end },
  };
}

// Import transactions to the system for reconciliation
async function importTransactionsToSystem(
  supabase: any,
  userId: string,
  consentId?: string,
  accountId?: string,
  contaBancariaId?: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  console.log(`[open-finance] Importing transactions for account ${accountId} to conta_bancaria ${contaBancariaId}`);

  if (!contaBancariaId) {
    throw new Error("ID da conta bancária do sistema é obrigatório");
  }

  // Get transactions from Open Finance
  const transactionsResult = await getTransactions(
    supabase,
    userId,
    consentId,
    accountId,
    startDate,
    endDate
  );

  const transactions = transactionsResult.transactions;
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Get existing transactions to avoid duplicates
  const { data: existingTransactions } = await supabase
    .from("transacoes_bancarias")
    .select("descricao, data, valor")
    .eq("conta_bancaria_id", contaBancariaId);

  const existingKeys = new Set(
    existingTransactions?.map((t: any) => `${t.descricao}-${t.data}-${t.valor}`) || []
  );

  // Calculate running balance
  const { data: contaBancaria } = await supabase
    .from("contas_bancarias")
    .select("saldo_atual")
    .eq("id", contaBancariaId)
    .single();

  let runningBalance = contaBancaria?.saldo_atual || 0;

  for (const txn of transactions) {
    const amount = parseFloat(txn.amount);
    const txnDate = new Date(txn.date).toISOString().split("T")[0];
    const tipo = amount >= 0 ? "receita" : "despesa";
    const valorAbsoluto = Math.abs(amount);

    // Check for duplicates
    const key = `${txn.description}-${txnDate}-${valorAbsoluto}`;
    if (existingKeys.has(key)) {
      console.log(`[open-finance] Skipping duplicate transaction: ${txn.description}`);
      skipped++;
      continue;
    }

    try {
      // Insert transaction
      const { error: insertError } = await supabase.from("transacoes_bancarias").insert({
        conta_bancaria_id: contaBancariaId,
        data: txnDate,
        descricao: txn.description,
        valor: valorAbsoluto,
        tipo: tipo,
        saldo: runningBalance + amount,
        conciliada: false,
      });

      if (insertError) {
        console.error(`[open-finance] Error inserting transaction:`, insertError);
        errors++;
      } else {
        imported++;
        runningBalance += amount;
        existingKeys.add(key);
      }
    } catch (err) {
      console.error(`[open-finance] Error processing transaction:`, err);
      errors++;
    }
  }

  console.log(`[open-finance] Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);

  return {
    success: true,
    imported,
    skipped,
    errors,
    total: transactions.length,
    message: `Importação concluída: ${imported} transações importadas, ${skipped} duplicadas ignoradas`,
  };
}

// Refresh access token
async function refreshAccessToken(
  supabase: any,
  userId: string,
  consentId?: string
): Promise<any> {
  console.log(`[open-finance] Refreshing token for consent ${consentId}`);

  // In real implementation, call token refresh endpoint
  // Update stored tokens

  return {
    success: true,
    message: "Token atualizado com sucesso",
    expires_in: 3600,
  };
}

// Revoke consent
async function revokeConsent(
  supabase: any,
  userId: string,
  consentId?: string
): Promise<any> {
  console.log(`[open-finance] Revoking consent ${consentId}`);

  if (!consentId) {
    throw new Error("Consent ID is required");
  }

  // Update consent status
  await supabase
    .from("open_finance_consents")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", consentId)
    .eq("user_id", userId);

  return {
    success: true,
    message: "Consentimento revogado com sucesso",
  };
}
