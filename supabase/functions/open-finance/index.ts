import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { validateContract } from '../_shared/contract-validator.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { exigirVinculoEmpresa } from '../_shared/auth-guard.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { respostaIntegracaoDesativada } from '../_shared/resilience.ts';
const log = createLogger('open-finance');

const _OFSchema = z.object({
  action: z.string().min(1),
  params: z.record(z.unknown()).optional(),
});

interface OpenFinanceRequest {
  action:
    | 'get_institutions'
    | 'create_consent'
    | 'get_accounts'
    | 'get_balances'
    | 'get_transactions'
    | 'import_transactions'
    | 'refresh_token'
    | 'revoke_consent';
  params?: Record<string, any>;
}

// Open Finance Brasil API endpoints (sandbox)
const OPEN_FINANCE_CLIENT_ID = Deno.env.get('OPEN_FINANCE_CLIENT_ID');
const OPEN_FINANCE_REDIRECT_URI = Deno.env.get('OPEN_FINANCE_REDIRECT_URI');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * Não existe provedor de Open Finance homologado neste sistema: a URL de
 * autorização apontava para `openbanking.example.com` e nenhum trecho do
 * código grava `status = 'authorized'` num consentimento. Ainda assim as
 * leituras devolviam saldo e extrato inventados, e `import_transactions`
 * GRAVAVA cinco lançamentos fabricados em `transacoes_bancarias` — com a
 * coluna `saldo` recalculada sobre o `saldo_atual` verdadeiro da conta — e
 * respondia `success: true`. Na Conciliação Bancária isso vira crédito que
 * nunca entrou, pronto para baixar título real.
 *
 * Estas ações passam a ser recusadas antes de qualquer leitura ou escrita.
 * `get_institutions` continua (lista de bancos é dado de referência, não
 * afirma estado da conta de ninguém) e `revoke_consent` também, porque só
 * atualiza o status local do consentimento.
 */
export const MENSAGEM_SEM_PROVEDOR =
  'Open Finance não homologado: nenhuma instituição está conectada de verdade. ' +
  'Nenhum saldo foi lido e nenhuma transação foi importada.';

const ACOES_SEM_PROVEDOR = new Set([
  'create_consent',
  'get_accounts',
  'get_balances',
  'get_transactions',
  'import_transactions',
  'refresh_token',
]);

export function acaoExigeProvedorHomologado(action: string): boolean {
  return ACOES_SEM_PROVEDOR.has(action);
}

serve(
  withEdgeObservability('open-finance', async (req) => {
    const _t0 = Date.now();
    try {
      const corsHeaders = corsHeadersPara(req);
      if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Authorization required' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify user
        const token = authHeader.replace('Bearer ', '');
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const _raw = await req.json();
        const _v = await validateContract(_OFSchema, _raw);
        if (!_v.success) return _v.response;
        const { action, params } = _v.data as unknown as OpenFinanceRequest;

        // Kill-switch depois de auth+schema para as ações sem recurso de empresa:
        // import_transactions tem vínculo próprio (conta bancária) e checa lá dentro,
        // senão um usuário sem escopo sobre a conta sondaria o estado do circuito.
        // revoke_consent também fica de fora: só atualiza o status local do
        // consentimento — bloquear a revogação num incidente violaria LGPD.
        if (action !== 'import_transactions' && action !== 'revoke_consent') {
          const inativa = respostaIntegracaoDesativada('open_finance', corsHeaders);
          if (inativa) return inativa;
        }
        log.info(`[open-finance] Action: ${action}, User: ${user.id}`);

        // Recusa antes de ler ou gravar qualquer coisa. Fica depois de auth e
        // schema de propósito: o caminho de entrada real deste defeito era a
        // invocação direta da função, não o clique na tela (o botão Importar só
        // aparece com consentimento `authorized`, status que nada grava).
        if (acaoExigeProvedorHomologado(action)) {
          log.warn('[open-finance] acao recusada: integracao nao homologada', { action });
          return new Response(JSON.stringify({ success: false, error: MENSAGEM_SEM_PROVEDOR }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let result;

        switch (action) {
          case 'get_institutions':
            result = await getParticipatingInstitutions();
            break;

          case 'create_consent':
            result = await createConsent(supabase, user.id, params);
            break;

          case 'get_accounts':
            result = await getAccounts(supabase, user.id, params?.consent_id);
            break;

          case 'get_balances':
            result = await getBalances(supabase, user.id, params?.consent_id, params?.account_id);
            break;

          case 'get_transactions':
            result = await getTransactions(
              supabase,
              user.id,
              params?.consent_id,
              params?.account_id,
              params?.start_date,
              params?.end_date
            );
            break;

          case 'import_transactions': {
            const contaBancariaId = params?.conta_bancaria_id;
            if (!contaBancariaId) {
              throw new Error('ID da conta bancária do sistema é obrigatório');
            }

            // Etapa E-012 (PLANO_100.md): a conta bancária de destino não era validada
            // contra o vínculo empresa↔usuário antes da gravação via service_role,
            // permitindo IDOR entre tenants (A-015 em AUDITORIA.md).
            const { data: contaBancariaAlvo, error: contaBancariaError } = await supabase
              .from('contas_bancarias')
              .select('empresa_id')
              .eq('id', contaBancariaId)
              .maybeSingle();
            if (contaBancariaError || !contaBancariaAlvo?.empresa_id) {
              return new Response(JSON.stringify({ error: 'Conta bancária não encontrada' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            const vinculo = await exigirVinculoEmpresa(user.id, contaBancariaAlvo.empresa_id, req);
            if (!vinculo.ok) return vinculo.resposta;

            const inativaImport = respostaIntegracaoDesativada('open_finance', corsHeaders);
            if (inativaImport) return inativaImport;

            result = await importTransactionsToSystem(
              supabase,
              user.id,
              params?.consent_id,
              params?.account_id,
              contaBancariaId,
              params?.start_date,
              params?.end_date
            );
            break;
          }

          case 'refresh_token':
            result = await refreshAccessToken(supabase, user.id, params?.consent_id);
            break;

          case 'revoke_consent':
            result = await revokeConsent(supabase, user.id, params?.consent_id);
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        log.error('[open-finance] Error:', {
          error_message: mensagemErro(error),
          context: contextoErro(error),
        });
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } finally {
      log.info('request', { duration_ms: Date.now() - _t0 });
      await log.flush();
    }
  })
);

// Get list of participating institutions in Open Finance Brazil
async function getParticipatingInstitutions(): Promise<any> {
  log.info('[open-finance] Fetching participating institutions');

  // This would call the Open Finance directory API
  // For now, return a simulated list of major Brazilian banks
  const INSTITUICOES: Array<[id: string, nome: string, logo: string, apiBase: string]> = [
    [
      'bb',
      'Banco do Brasil',
      'https://www.bb.com.br/docs/portal/img/logobb.png',
      'https://openbanking.bb.com.br',
    ],
    [
      'itau',
      'Itaú Unibanco',
      'https://www.itau.com.br/_arquivosestaticos/Itau/defaultTheme/img/logo-itau.png',
      'https://secure.api.itau',
    ],
    [
      'bradesco',
      'Bradesco',
      'https://banco.bradesco/assets/classic/img/logo-bradesco.png',
      'https://openbanking.bradesco.com.br',
    ],
    [
      'santander',
      'Santander Brasil',
      'https://www.santander.com.br/institucional/img/logo-santander.png',
      'https://openbanking.santander.com.br',
    ],
    [
      'caixa',
      'Caixa Econômica Federal',
      'https://www.caixa.gov.br/PublishingImages/marca-caixa.png',
      'https://openbanking.caixa.gov.br',
    ],
    [
      'nubank',
      'Nubank',
      'https://nubank.com.br/images/nu-icon.png',
      'https://prod-global-webapp-proxy.nubank.com.br',
    ],
    [
      'inter',
      'Banco Inter',
      'https://static.bancointer.com.br/images/logoInter.svg',
      'https://openbanking.bancointer.com.br',
    ],
    [
      'c6bank',
      'C6 Bank',
      'https://www.c6bank.com.br/assets/images/logo-c6bank.svg',
      'https://openbanking.c6bank.com.br',
    ],
  ];
  const institutions = INSTITUICOES.map(([id, name, logo, api_base_url]) => ({
    id,
    name,
    logo,
    status: 'active',
    api_base_url,
  }));

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
    'ACCOUNTS_READ',
    'ACCOUNTS_BALANCES_READ',
    'RESOURCES_READ',
    'CREDIT_CARDS_ACCOUNTS_READ',
    'CREDIT_CARDS_ACCOUNTS_BILLS_READ',
  ];

  log.info(`[open-finance] Creating consent for user ${userId} at institution ${institutionId}`);

  // In a real implementation, this would:
  // 1. Call the institution's consent API
  // 2. Redirect user to bank for authorization
  // 3. Receive callback with authorization code
  // 4. Exchange code for access token

  // Sem provedor homologado não há consentimento a criar: a URL de autorização
  // apontava para `openbanking.example.com` e o registro gravado aqui nascia
  // em `awaiting_authorization` para sempre, porque nada neste código grava
  // `authorized`. Mandar o usuário para aquela URL era prometer um fluxo de
  // banco que não existe.
  throw new Error(MENSAGEM_SEM_PROVEDOR);
}

// Get linked accounts
async function getAccounts(supabase: any, userId: string, consentId?: string): Promise<any> {
  log.info(`[open-finance] Getting accounts for user ${userId}, consent ${consentId}`);

  // Check consent is valid
  if (consentId) {
    const { data: consent } = await supabase
      .from('open_finance_consents')
      .select('*')
      .eq('id', consentId)
      .eq('user_id', userId)
      .eq('status', 'authorized')
      .single();

    if (!consent) {
      throw new Error('Consentimento não encontrado ou não autorizado');
    }
  }

  // As duas contas devolvidas aqui ('****1234' e '****5678', Itaú) eram fixas
  // no código, para qualquer usuário de qualquer empresa.
  throw new Error(MENSAGEM_SEM_PROVEDOR);
}

// Get account balances
async function getBalances(
  supabase: any,
  userId: string,
  consentId?: string,
  accountId?: string
): Promise<any> {
  log.info(`[open-finance] Getting balances for account ${accountId}`);

  // Respondia R$ 245.890,50 disponível para qualquer conta de qualquer empresa.
  throw new Error(MENSAGEM_SEM_PROVEDOR);
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
  log.info(`[open-finance] Getting transactions for account ${accountId}`);

  // Devolvia cinco lançamentos fixos (PIX de R$ 5.000 de 'CLIENTE ABC', TED de
  // R$ 8.500 para 'PAGTO FORNECEDOR'...) com datas relativas a agora. Era daqui
  // que `importTransactionsToSystem` tirava o que gravava no extrato.
  throw new Error(MENSAGEM_SEM_PROVEDOR);
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
  log.info(
    `[open-finance] Importing transactions for account ${accountId} to conta_bancaria ${contaBancariaId}`
  );

  if (!contaBancariaId) {
    throw new Error('ID da conta bancária do sistema é obrigatório');
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
    .from('transacoes_bancarias')
    .select('descricao, data, valor')
    .eq('conta_bancaria_id', contaBancariaId);

  const existingKeys = new Set(
    existingTransactions?.map((t: any) => `${t.descricao}-${t.data}-${t.valor}`) || []
  );

  // Calculate running balance
  const { data: contaBancaria } = await supabase
    .from('contas_bancarias')
    .select('saldo_atual')
    .eq('id', contaBancariaId)
    .single();

  let runningBalance = contaBancaria?.saldo_atual || 0;

  for (const txn of transactions) {
    const amount = parseFloat(txn.amount);
    const txnDate = new Date(txn.date).toISOString().split('T')[0];
    const tipo = amount >= 0 ? 'receita' : 'despesa';
    const valorAbsoluto = Math.abs(amount);

    // Check for duplicates
    const key = `${txn.description}-${txnDate}-${valorAbsoluto}`;
    if (existingKeys.has(key)) {
      log.info(`[open-finance] Skipping duplicate transaction: ${txn.description}`);
      skipped++;
      continue;
    }

    try {
      // Insert transaction
      const { error: insertError } = await supabase.from('transacoes_bancarias').insert({
        conta_bancaria_id: contaBancariaId,
        data: txnDate,
        descricao: txn.description,
        valor: valorAbsoluto,
        tipo: tipo,
        saldo: runningBalance + amount,
        conciliada: false,
      });

      if (insertError) {
        log.error(`[open-finance] Error inserting transaction:`, {
          error_message: mensagemErro(insertError),
          context: contextoErro(insertError),
        });
        errors++;
      } else {
        imported++;
        runningBalance += amount;
        existingKeys.add(key);
      }
    } catch (err) {
      log.error(`[open-finance] Error processing transaction:`, {
        error_message: mensagemErro(err),
        context: contextoErro(err),
      });
      errors++;
    }
  }

  log.info(
    `[open-finance] Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`
  );

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
async function refreshAccessToken(supabase: any, userId: string, consentId?: string): Promise<any> {
  log.info(`[open-finance] Refreshing token for consent ${consentId}`);

  // Respondia 'Token atualizado com sucesso' sem chamar endpoint algum nem
  // tocar em token nenhum.
  throw new Error(MENSAGEM_SEM_PROVEDOR);
}

// Revoke consent
async function revokeConsent(supabase: any, userId: string, consentId?: string): Promise<any> {
  log.info(`[open-finance] Revoking consent ${consentId}`);

  if (!consentId) {
    throw new Error('Consent ID is required');
  }

  // Update consent status
  await supabase
    .from('open_finance_consents')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', consentId)
    .eq('user_id', userId);

  return {
    success: true,
    message: 'Consentimento revogado com sucesso',
  };
}
