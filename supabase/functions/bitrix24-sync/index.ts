import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';
import { Bitrix24SyncSchema, validatePayload, createErrorResponse } from '../_shared/validation.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability, segundoPlano } from '../_shared/edge-observability.ts';
import { respostaIntegracaoDesativada } from '../_shared/resilience.ts';
const log = createLogger('bitrix24-sync');

interface BitrixResponse {
  result?: any;
  error?: string;
  error_description?: string;
  total?: number;
  next?: number;
}

interface SyncRequest {
  action:
    | 'sync_deals'
    | 'sync_contacts'
    | 'sync_companies'
    | 'export_payment_status'
    | 'test_connection'
    | 'refresh_token'
    | 'sync_elisao_task'
    | 'sync_boleto';
  params?: Record<string, any>;
}

const BITRIX_DOMAIN = Deno.env.get('BITRIX24_DOMAIN');
const CLIENT_ID = Deno.env.get('BITRIX24_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('BITRIX24_CLIENT_SECRET');

async function getValidToken(supabase: any): Promise<string> {
  const { data: tokenData } = await supabase
    .from('bitrix_oauth_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tokenData) {
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) return tokenData.access_token;
    log.info('[bitrix24-sync] Token expired, refreshing...');
    const refreshed = await refreshOAuthToken(supabase, tokenData.refresh_token);
    if (refreshed) return refreshed;
  }

  const envToken = Deno.env.get('BITRIX24_ACCESS_TOKEN');
  if (!envToken) throw new Error('No valid Bitrix24 access token available');
  return envToken;
}

async function refreshOAuthToken(supabase: any, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`https://${BITRIX_DOMAIN}/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: CLIENT_ID || '', client_secret: CLIENT_SECRET || '', refresh_token: refreshToken }),
    });
    if (!response.ok) { log.error('[bitrix24-sync] Failed to refresh token:', { error_message: mensagemErro(await response.text()) }); return null; }
    const data = await response.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
    await supabase.from('bitrix_oauth_tokens').insert({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: expiresAt.toISOString() });
    log.info('[bitrix24-sync] Token refreshed successfully');
    return data.access_token;
  } catch (error) {
    log.error('[bitrix24-sync] Error refreshing token:', { error_message: mensagemErro(error), context: contextoErro(error) });
    return null;
  }
}

async function callBitrixAPI(method: string, accessToken: string, params?: Record<string, any>): Promise<BitrixResponse> {
  const url = new URL(`https://${BITRIX_DOMAIN}/rest/${method}`);
  const body = new URLSearchParams();
  body.append('auth', accessToken);
  if (params) for (const [key, value] of Object.entries(params)) body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  const response = await fetch(url.toString(), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const data = await response.json();
  if (data.error) log.error(`[bitrix24-sync] API Error: ${data.error} - ${data.error_description}`);
  return data;
}

async function testConnection(accessToken: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const result = await callBitrixAPI('profile', accessToken);
    if (result.error) { log.error('[bitrix24-sync] testConnection falhou:', { error_message: mensagemErro(result.error_description || result.error) }); return { success: false, message: 'Erro de conexão com o Bitrix24' }; }
    return { success: true, message: 'Conexão estabelecida com sucesso', data: result.result };
  } catch (error: any) {
    log.error('[bitrix24-sync] testConnection exception:', { error_message: mensagemErro(error), context: contextoErro(error) });
    return { success: false, message: 'Erro de conexão com o Bitrix24' };
  }
}

async function syncDeals(supabase: any, accessToken: string, userId: string): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  log.info('[bitrix24-sync] Starting deals sync...');
  const { data: logData } = await supabase.from('bitrix_sync_logs').insert({ tipo: 'entrada', entidade: 'deals', status: 'pendente', created_by: userId }).select().single();
  const logId = logData?.id;
  let processed = 0, errors = 0, start = 0;
  try {
    const { data: empresas } = await supabase.from('empresas').select('id').limit(1);
    const empresaId = empresas?.[0]?.id;
    if (!empresaId) throw new Error('Nenhuma empresa cadastrada no sistema');
    while (true) {
      const result = await callBitrixAPI('crm.deal.list', accessToken, { start, select: ['ID','TITLE','OPPORTUNITY','CLOSEDATE','COMPANY_ID','STAGE_ID','CURRENCY_ID'], order: { ID: 'ASC' } });
      if (result.error) throw new Error(result.error_description || result.error);
      for (const deal of result.result || []) {
        try {
          const contaData = { bitrix_deal_id: String(deal.ID), descricao: deal.TITLE || `Deal #${deal.ID}`, valor: parseFloat(deal.OPPORTUNITY) || 0, data_vencimento: deal.CLOSEDATE ? deal.CLOSEDATE.split('T')[0] : new Date().toISOString().split('T')[0], cliente_nome: `Bitrix Deal #${deal.ID}`, empresa_id: empresaId, created_by: userId, status: 'pendente' };
          const { data: existing } = await supabase.from('contas_receber').select('id').eq('bitrix_deal_id', String(deal.ID)).single();
          if (existing) await supabase.from('contas_receber').update(contaData).eq('id', existing.id);
          else await supabase.from('contas_receber').insert(contaData);
          processed++;
        } catch (err) { log.error(`[bitrix24-sync] Error processing deal ${deal.ID}:`, { error_message: mensagemErro(err), context: contextoErro(err) }); errors++; }
      }
      if (!result.next) break;
      start = result.next;
    }
    await supabase.from('bitrix_sync_logs').update({ status: errors > 0 ? 'parcial' : 'sucesso', registros_processados: processed, registros_com_erro: errors, finalizado_em: new Date().toISOString() }).eq('id', logId);
    return { success: true, processed, errors, message: `Sincronização concluída: ${processed} deals importados, ${errors} erros` };
  } catch (error: any) {
    log.error('[bitrix24-sync] Sync failed:', { error_message: mensagemErro(error), context: contextoErro(error) });
    await supabase.from('bitrix_sync_logs').update({ status: 'erro', registros_processados: processed, registros_com_erro: errors, mensagem_erro: error?.message || 'Erro desconhecido', finalizado_em: new Date().toISOString() }).eq('id', logId);
    return { success: false, processed, errors, message: 'Erro na sincronização' };
  }
}

async function syncContacts(supabase: any, accessToken: string, userId: string): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  log.info('[bitrix24-sync] Starting contacts sync...');
  const { data: logData } = await supabase.from('bitrix_sync_logs').insert({ tipo: 'entrada', entidade: 'contacts', status: 'pendente', created_by: userId }).select().single();
  const logId = logData?.id;
  let processed = 0, errors = 0, start = 0;
  try {
    while (true) {
      const result = await callBitrixAPI('crm.contact.list', accessToken, { start, select: ['ID','NAME','LAST_NAME','EMAIL','PHONE','ADDRESS','ADDRESS_CITY','ADDRESS_PROVINCE'], order: { ID: 'ASC' } });
      if (result.error) throw new Error(result.error_description || result.error);
      for (const contact of result.result || []) {
        try {
          const clienteData = { bitrix_id: String(contact.ID), razao_social: `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim() || `Contato #${contact.ID}`, email: Array.isArray(contact.EMAIL) ? contact.EMAIL[0]?.VALUE : contact.EMAIL, telefone: Array.isArray(contact.PHONE) ? contact.PHONE[0]?.VALUE : contact.PHONE, cidade: contact.ADDRESS_CITY, estado: contact.ADDRESS_PROVINCE, endereco: contact.ADDRESS };
          const { data: existing } = await supabase.from('clientes').select('id').eq('bitrix_id', String(contact.ID)).single();
          if (existing) await supabase.from('clientes').update(clienteData).eq('id', existing.id);
          else await supabase.from('clientes').insert(clienteData);
          processed++;
        } catch (err) { log.error(`[bitrix24-sync] Error processing contact ${contact.ID}:`, { error_message: mensagemErro(err), context: contextoErro(err) }); errors++; }
      }
      if (!result.next) break;
      start = result.next;
    }
    await supabase.from('bitrix_sync_logs').update({ status: errors > 0 ? 'parcial' : 'sucesso', registros_processados: processed, registros_com_erro: errors, finalizado_em: new Date().toISOString() }).eq('id', logId);
    return { success: true, processed, errors, message: `Sincronização concluída: ${processed} contatos importados, ${errors} erros` };
  } catch (error: any) {
    log.error('[bitrix24-sync] Contacts sync failed:', { error_message: mensagemErro(error), context: contextoErro(error) });
    await supabase.from('bitrix_sync_logs').update({ status: 'erro', registros_processados: processed, registros_com_erro: errors, mensagem_erro: error?.message || 'Erro desconhecido', finalizado_em: new Date().toISOString() }).eq('id', logId);
    return { success: false, processed, errors, message: 'Erro na sincronização' };
  }
}

async function syncCompanies(supabase: any, accessToken: string, userId: string): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  log.info('[bitrix24-sync] Starting companies sync...');
  const { data: logData } = await supabase.from('bitrix_sync_logs').insert({ tipo: 'entrada', entidade: 'companies', status: 'pendente', created_by: userId }).select().single();
  const logId = logData?.id;
  let processed = 0, errors = 0, start = 0;
  try {
    while (true) {
      const result = await callBitrixAPI('crm.company.list', accessToken, { start, select: ['ID','TITLE','EMAIL','PHONE','ADDRESS','ADDRESS_CITY','ADDRESS_PROVINCE'], order: { ID: 'ASC' } });
      if (result.error) throw new Error(result.error_description || result.error);
      for (const company of result.result || []) {
        try {
          const clienteData = { bitrix_id: String(company.ID), razao_social: company.TITLE || `Empresa #${company.ID}`, email: Array.isArray(company.EMAIL) ? company.EMAIL[0]?.VALUE : company.EMAIL, telefone: Array.isArray(company.PHONE) ? company.PHONE[0]?.VALUE : company.PHONE, cidade: company.ADDRESS_CITY, estado: company.ADDRESS_PROVINCE, endereco: company.ADDRESS };
          const { data: existing } = await supabase.from('clientes').select('id').eq('bitrix_id', String(company.ID)).single();
          if (existing) await supabase.from('clientes').update(clienteData).eq('id', existing.id);
          else await supabase.from('clientes').insert(clienteData);
          processed++;
        } catch (err) { log.error(`[bitrix24-sync] Error processing company ${company.ID}:`, { error_message: mensagemErro(err), context: contextoErro(err) }); errors++; }
      }
      if (!result.next) break;
      start = result.next;
    }
    await supabase.from('bitrix_sync_logs').update({ status: errors > 0 ? 'parcial' : 'sucesso', registros_processados: processed, registros_com_erro: errors, finalizado_em: new Date().toISOString() }).eq('id', logId);
    return { success: true, processed, errors, message: `Sincronização concluída: ${processed} empresas importadas, ${errors} erros` };
  } catch (error: any) {
    log.error('[bitrix24-sync] Companies sync failed:', { error_message: mensagemErro(error), context: contextoErro(error) });
    await supabase.from('bitrix_sync_logs').update({ status: 'erro', registros_processados: processed, registros_com_erro: errors, mensagem_erro: error?.message || 'Erro desconhecido', finalizado_em: new Date().toISOString() }).eq('id', logId);
    return { success: false, processed, errors, message: 'Erro na sincronização' };
  }
}

async function exportPaymentStatus(supabase: any, accessToken: string, userId: string): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
  log.info('[bitrix24-sync] Starting payment status export...');
  const { data: logData } = await supabase.from('bitrix_sync_logs').insert({ tipo: 'saida', entidade: 'payment_status', status: 'pendente', created_by: userId }).select().single();
  const logId = logData?.id;
  let processed = 0, errors = 0;
  try {
    const { data: contasPagas } = await supabase.from('contas_receber').select('*').not('bitrix_deal_id', 'is', null).eq('status', 'pago');
    for (const conta of contasPagas || []) {
      try {
        const result = await callBitrixAPI('crm.deal.update', accessToken, { id: conta.bitrix_deal_id, fields: { STAGE_ID: 'WON', COMMENTS: `Pagamento recebido em ${conta.data_recebimento || new Date().toISOString().split('T')[0]}` } });
        if (result.error) throw new Error(result.error_description || result.error);
        processed++;
      } catch (err) { log.error(`[bitrix24-sync] Error updating deal ${conta.bitrix_deal_id}:`, { error_message: mensagemErro(err), context: contextoErro(err) }); errors++; }
    }
    await supabase.from('bitrix_sync_logs').update({ status: errors > 0 ? 'parcial' : 'sucesso', registros_processados: processed, registros_com_erro: errors, finalizado_em: new Date().toISOString() }).eq('id', logId);
    return { success: true, processed, errors, message: `Exportação concluída: ${processed} status atualizados, ${errors} erros` };
  } catch (error: any) {
    log.error('[bitrix24-sync] Export failed:', { error_message: mensagemErro(error), context: contextoErro(error) });
    await supabase.from('bitrix_sync_logs').update({ status: 'erro', registros_processados: processed, registros_com_erro: errors, mensagem_erro: error?.message || 'Erro desconhecido', finalizado_em: new Date().toISOString() }).eq('id', logId);
    return { success: false, processed, errors, message: 'Erro na exportação' };
  }
}

async function syncElisaoTask(supabase: any, accessToken: string, tarefaId: string, userId: string): Promise<{ success: boolean; message: string }> {
  log.info(`[bitrix24-sync] Syncing elisao task ${tarefaId}...`);
  try {
    const { data: tarefa, error: tError } = await supabase.from('elisao_tarefas_acionaveis').select('*').eq('id', tarefaId).single();
    if (tError || !tarefa) throw new Error('Tarefa não encontrada');
    const taskParams = { fields: { TITLE: `[RECUPERAÇÃO FISCAL] ${tarefa.titulo}`, DESCRIPTION: `${tarefa.descricao}\n\nValor estimado: R$ ${tarefa.valor_envolvido}\nPrazo: ${tarefa.prazo || 'N/D'}`, RESPONSIBLE_ID: 1, DEADLINE: tarefa.prazo ? `${tarefa.prazo}T18:00:00` : undefined } };
    let result;
    if (tarefa.bitrix_task_id) result = await callBitrixAPI(`tasks.task.update?taskId=${tarefa.bitrix_task_id}`, accessToken, taskParams);
    else result = await callBitrixAPI('tasks.task.add', accessToken, taskParams);
    if (result.error) throw new Error(result.error_description || result.error);
    const bitrixTaskId = result.result?.task?.id || tarefa.bitrix_task_id;
    await supabase.from('elisao_tarefas_acionaveis').update({ bitrix_task_id: String(bitrixTaskId), bitrix_sync_status: 'sincronizado', bitrix_error_message: null }).eq('id', tarefaId);
    return { success: true, message: 'Tarefa sincronizada com Bitrix24' };
  } catch (error: any) {
    log.error('[bitrix24-sync] Elisao task sync failed:', { error_message: mensagemErro(error), context: contextoErro(error) });
    await supabase.from('elisao_tarefas_acionaveis').update({ bitrix_sync_status: 'erro', bitrix_error_message: error?.message || 'Erro desconhecido' }).eq('id', tarefaId);
    return { success: false, message: 'Erro na sincronização' };
  }
}

async function syncBoleto(supabase: any, accessToken: string, boleto: any, userId: string): Promise<{ success: boolean; message: string; bitrix_id?: string }> {
  log.info(`[bitrix24-sync] Syncing boleto ${boleto.id} to Bitrix...`);
  try {
    let dealId = boleto.bitrix_id;
    if (!dealId && boleto.conta_receber_id) {
      const { data: conta } = await supabase.from('contas_receber').select('bitrix_deal_id').eq('id', boleto.conta_receber_id).single();
      dealId = conta?.bitrix_deal_id;
    }
    if (!dealId) throw new Error('Deal Bitrix24 não encontrado para este boleto');
    const message = `<b>BOLETO GERADO</b><br/>Número: ${boleto.numero}<br/>Valor: R$ ${boleto.valor}<br/>Vencimento: ${boleto.vencimento}<br/>Linha Digitável: ${boleto.linha_digitavel}<br/><a href="${boleto.link_fatura || boleto.link_boleto}">Clique aqui para ver o boleto</a>`;
    const result = await callBitrixAPI('crm.timeline.item.add', accessToken, { fields: { ENTITY_ID: dealId, ENTITY_TYPE_ID: 2, BASE_ID: dealId, BASE_TYPE_ID: 2, CONTENT: message } });
    if (result.error) throw new Error(result.error_description || result.error);
    return { success: true, message: 'Boleto sincronizado com o timeline do Bitrix24', bitrix_id: dealId };
  } catch (error: any) {
    log.error('[bitrix24-sync] Boleto sync failed:', { error_message: mensagemErro(error), context: contextoErro(error) });
    return { success: false, message: 'Erro na sincronização' };
  }
}

serve(
  withEdgeObservability('bitrix24-sync', async (req) => {
    const _t0 = Date.now();
    try {
      const corsHeaders = corsHeadersPara(req);
      if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
      try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Authorization header required');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) throw new Error('Invalid authentication token');
        const inativa = respostaIntegracaoDesativada('bitrix24', corsHeaders);
        if (inativa) return inativa;
        const rawBody = await req.json();
        const validation = validatePayload(Bitrix24SyncSchema, rawBody, 'bitrix24-sync');
        if (!validation.success) return createErrorResponse(validation.error, 400, validation.details, req);
        const { action, params } = validation.data;
        log.info(`[bitrix24-sync] Action: ${action}, User: ${user.id}`);
        const accessToken = await getValidToken(supabase);
        let result;
        switch (action) {
          case 'test_connection': result = await testConnection(accessToken); break;
          case 'sync_deals': result = await syncDeals(supabase, accessToken, user.id); break;
          case 'sync_contacts': result = await syncContacts(supabase, accessToken, user.id); break;
          case 'sync_companies': result = await syncCompanies(supabase, accessToken, user.id); break;
          case 'export_payment_status': result = await exportPaymentStatus(supabase, accessToken, user.id); break;
          case 'sync_elisao_task': result = await syncElisaoTask(supabase, accessToken, params?.id, user.id); break;
          case 'sync_boleto': result = await syncBoleto(supabase, accessToken, params?.boleto, user.id); break;
          default: throw new Error(`Unknown action: ${action}`);
        }
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (error: any) {
        log.error('[bitrix24-sync] Error:', { error_message: mensagemErro(error), context: contextoErro(error) });
        return new Response(JSON.stringify({ success: false, message: 'Erro desconhecido' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } finally {
      log.info('request', { duration_ms: Date.now() - _t0 });
      await segundoPlano(log.flush());
    }
  })
);
