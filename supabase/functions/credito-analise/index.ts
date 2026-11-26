// Edge Function: credito-analise
// Fila de análise de crédito da 1ª venda para o Financeiro (admin/financeiro):
//   listar          -> linhas de analises_credito (default: pendentes)
//   atualizar_dados -> CNPJ corrigido (reconsulta CNPJ.já), Escavador e consulta
//                      financeira registrados pelo analista
//   decidir         -> aprovado/reprovado + limite/parcelas/parecer; devolve a
//                      decisão ao Promo Champions (receive-credit-decision) e,
//                      se aprovado e o cliente existe no Finance, grava o limite.
//
// verify_jwt=false: o guard é exigirPapel (JWT validado no Auth + user_roles).

import { createLogger } from '../_shared/observability.ts';
import { getRequestId } from '../_shared/correlation.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { clientDeServico, exigirPapel } from '../_shared/auth-guard.ts';
import { createErrorResponse, parseJsonBody, validatePayload } from '../_shared/validation.ts';
import { CreditoAnaliseSchema } from '../_shared/credito/schemas.ts';
import { consultarCnpjInterno } from '../_shared/credito/cnpja.ts';
import { avaliarAlertas, normalizarCnpj } from '../_shared/credito/regras.ts';

const DEFAULT_CALLBACK_URL =
  'https://usyxfpqlsspldubptrdl.supabase.co/functions/v1/receive-credit-decision';
const PAPEIS = ['admin', 'financeiro'] as const;

async function assinar(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${hex}`;
}

function responder(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersPara(req), 'Content-Type': 'application/json' },
  });
}

interface Analise {
  id: string;
  referencia_externa: string;
  status: string;
  cnpj: string | null;
  cliente_id: string | null;
  valor_pedido: number | null;
  dados_cnpja: unknown;
  dados_escavador: unknown;
  dados_consulta_financeira: unknown;
}

async function notificarChampions(
  analise: Analise,
  decisao: 'aprovado' | 'reprovado',
  limite: number | null,
  parcelas: number | null,
  parecer: string | null
): Promise<{ ok: boolean; erro?: string }> {
  const secret = Deno.env.get('CHAMPIONS_CREDITO_CALLBACK_SECRET');
  if (!secret) return { ok: false, erro: 'CHAMPIONS_CREDITO_CALLBACK_SECRET não configurada' };
  const url = Deno.env.get('CHAMPIONS_CREDITO_CALLBACK_URL') || DEFAULT_CALLBACK_URL;

  const body = JSON.stringify({
    event: 'credito.decidido',
    correlation_key: analise.id,
    payload: {
      pedido_id: analise.referencia_externa,
      analise_id: analise.id,
      decisao,
      limite_aprovado: limite,
      parcelas_max: parcelas,
      parecer,
      decidido_em: new Date().toISOString(),
    },
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': await assinar(secret, body),
        'x-webhook-event': 'credito.decidido',
        'x-correlation-key': analise.id,
      },
      body,
      signal: controller.signal,
    });
    const text = await res.text();
    if (res.ok) return { ok: true };
    return { ok: false, erro: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(
  withEdgeObservability('credito-analise', async (req: Request) => {
    const cors = corsHeadersPara(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return responder(req, 405, { error: 'Método não permitido' });

    const logger = createLogger('credito-analise', getRequestId(req));
    const t0 = Date.now();

    const guard = await exigirPapel(req, PAPEIS);
    if (!guard.ok) return guard.resposta;

    const corpo = await parseJsonBody(req, 'credito-analise', cors);
    if (!corpo.success) return corpo.response;
    const validation = validatePayload(CreditoAnaliseSchema, corpo.data, 'credito-analise');
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details, req);
    }
    const input = validation.data;
    const admin = clientDeServico();

    try {
      if (input.action === 'listar') {
        let query = admin
          .from('analises_credito')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(input.limite ?? 100);
        const status = input.status ?? 'pendente';
        if (status === 'pendente') query = query.in('status', ['pendente', 'em_analise']);
        else if (status !== 'todos') query = query.eq('status', status);
        const { data, error } = await query;
        if (error) throw error;
        return responder(req, 200, { analises: data ?? [] });
      }

      const { data: analiseRaw, error: getError } = await admin
        .from('analises_credito')
        .select(
          'id, referencia_externa, status, cnpj, cliente_id, valor_pedido, dados_cnpja, dados_escavador, dados_consulta_financeira'
        )
        .eq('id', input.analise_id)
        .maybeSingle();
      if (getError) throw getError;
      if (!analiseRaw) return responder(req, 404, { error: 'Análise não encontrada' });
      const analise = analiseRaw as Analise;

      if (input.action === 'atualizar_dados') {
        if (analise.status === 'aprovado' || analise.status === 'reprovado') {
          return responder(req, 409, { error: 'Análise já decidida' });
        }
        const patch: Record<string, unknown> = { status: 'em_analise' };
        if (typeof input.escavador === 'string') {
          patch.dados_escavador = {
            resumo: input.escavador,
            registrado_em: new Date().toISOString(),
          };
        }
        if (typeof input.consulta_financeira === 'string') {
          patch.dados_consulta_financeira = {
            resumo: input.consulta_financeira,
            registrado_em: new Date().toISOString(),
          };
        }
        const novoCnpj =
          input.cnpj !== undefined && input.cnpj !== null ? normalizarCnpj(input.cnpj) : null;
        if (input.cnpj && !novoCnpj)
          return responder(req, 400, { error: 'CNPJ inválido (14 dígitos)' });
        if (novoCnpj && novoCnpj !== analise.cnpj) {
          patch.cnpj = novoCnpj;
          const consulta = await consultarCnpjInterno(admin, novoCnpj);
          if (consulta.ok) {
            patch.dados_cnpja = consulta.dados;
            patch.alertas = avaliarAlertas(consulta.dados, analise.valor_pedido);
          } else {
            logger.warn('cnpja_falhou', { error_message: consulta.erro });
            patch.alertas = avaliarAlertas(null, analise.valor_pedido);
          }
          if (!analise.cliente_id) {
            const { data: cli } = await admin
              .from('clientes')
              .select('id')
              .eq('cnpj_cpf', novoCnpj)
              .limit(1)
              .maybeSingle();
            if (cli?.id) patch.cliente_id = cli.id;
          }
        }
        const { data: atualizada, error: updError } = await admin
          .from('analises_credito')
          .update(patch)
          .eq('id', analise.id)
          .select('*')
          .single();
        if (updError) throw updError;
        return responder(req, 200, { analise: atualizada });
      }

      // decidir
      if (analise.status === 'aprovado' || analise.status === 'reprovado') {
        return responder(req, 409, { error: 'Análise já decidida' });
      }
      const limite = input.decisao === 'aprovado' ? (input.limite_aprovado ?? null) : null;
      const parcelas = input.decisao === 'aprovado' ? (input.parcelas_max ?? null) : null;
      const parecer = input.parecer ?? null;

      const { error: decError } = await admin
        .from('analises_credito')
        .update({
          status: input.decisao,
          limite_aprovado: limite,
          parcelas_max: parcelas,
          parecer,
          decidido_por: guard.dados.userId,
          decidido_em: new Date().toISOString(),
        })
        .eq('id', analise.id);
      if (decError) throw decError;

      if (input.decisao === 'aprovado' && analise.cliente_id && limite !== null) {
        const { error: limError } = await admin
          .from('clientes')
          .update({ limite_credito: limite })
          .eq('id', analise.cliente_id);
        if (limError) logger.warn('limite_cliente_falhou', { error_message: limError.message });
      }

      const callback = await notificarChampions(analise, input.decisao, limite, parcelas, parecer);
      const { data: final, error: cbError } = await admin
        .from('analises_credito')
        .update({
          callback_status: callback.ok ? 'enviado' : 'falhou',
          callback_erro: callback.ok ? null : (callback.erro ?? 'erro desconhecido').slice(0, 1000),
          callback_em: new Date().toISOString(),
        })
        .eq('id', analise.id)
        .select('*')
        .single();
      if (cbError) throw cbError;

      logger.info('decisao_registrada', {
        duration_ms: Date.now() - t0,
        status_code: 200,
        context: { analise_id: analise.id, decisao: input.decisao, callback_ok: callback.ok },
      });
      await logger.flush();
      return responder(req, 200, { analise: final, callback });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      logger.error('fn_failure', {
        duration_ms: Date.now() - t0,
        status_code: 500,
        error_message: message,
      });
      await logger.flush();
      return responder(req, 500, { error: message });
    }
  })
);
