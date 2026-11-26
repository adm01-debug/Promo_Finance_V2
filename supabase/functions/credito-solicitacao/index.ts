// Edge Function: credito-solicitacao
// Recebe do Promo Champions a solicitação de análise de crédito da 1ª venda
// (evento `credito.solicitado`), abre a linha em `analises_credito`, consulta o
// CNPJ.já quando há CNPJ e grava os alertas para o analista.
//
// Envelope (igual ao supply-dispatch do Champions):
//   headers: x-webhook-signature: sha256=<hex HMAC do corpo cru>
//   body:    { event, correlation_key, payload }
//   secret:  CHAMPIONS_CREDITO_WEBHOOK_SECRET
//
// verify_jwt=false (chamada máquina-a-máquina): o guard é a assinatura HMAC.

import { createLogger } from '../_shared/observability.ts';
import { getRequestId } from '../_shared/correlation.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { clientDeServico, segredosIguais } from '../_shared/auth-guard.ts';
import { validatePayload } from '../_shared/validation.ts';
import { CreditoSolicitacaoSchema } from '../_shared/credito/schemas.ts';
import { consultarCnpjInterno } from '../_shared/credito/cnpja.ts';
import { avaliarAlertas, normalizarCnpj } from '../_shared/credito/regras.ts';

const MAX_BODY_BYTES = 64 * 1024;

async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function responder(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersPara(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(
  withEdgeObservability('credito-solicitacao', async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeadersPara(req) });
    }
    if (req.method !== 'POST') {
      return responder(req, 405, { ok: false, error: 'method_not_allowed' });
    }

    const logger = createLogger('credito-solicitacao', getRequestId(req));
    const t0 = Date.now();

    const secret = Deno.env.get('CHAMPIONS_CREDITO_WEBHOOK_SECRET');
    if (!secret) {
      logger.error('secret_missing', { error_message: 'CHAMPIONS_CREDITO_WEBHOOK_SECRET ausente' });
      await logger.flush();
      return responder(req, 503, { ok: false, error: 'secret_not_configured' });
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return responder(req, 413, { ok: false, error: 'payload_too_large' });
    }

    const header = req.headers.get('x-webhook-signature') ?? '';
    if (!header) return responder(req, 401, { ok: false, error: 'hmac_missing' });
    const esperado = await hmacHex(secret, rawBody);
    const recebido = (header.startsWith('sha256=') ? header.slice(7) : header).toLowerCase();
    if (!segredosIguais(esperado, recebido)) {
      logger.warn('hmac_mismatch', { status_code: 401 });
      await logger.flush();
      return responder(req, 401, { ok: false, error: 'hmac_mismatch' });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return responder(req, 400, { ok: false, error: 'invalid_json' });
    }

    const validation = validatePayload(CreditoSolicitacaoSchema, parsed, 'credito-solicitacao');
    if (!validation.success) {
      return responder(req, 422, {
        ok: false,
        error: 'invalid_payload',
        details: validation.details,
      });
    }
    const { correlation_key, payload } = validation.data;
    const cliente = payload.cliente ?? {};
    const cnpj = normalizarCnpj(cliente.cnpj ?? null);
    const valorPedido =
      typeof payload.valor_total === 'string'
        ? Number(payload.valor_total)
        : (payload.valor_total ?? null);

    const admin = clientDeServico();

    // Vincula ao cadastro do Finance quando o CNPJ (ou e-mail) já existe.
    let clienteId: string | null = null;
    if (cnpj) {
      const { data } = await admin
        .from('clientes')
        .select('id')
        .eq('cnpj_cpf', cnpj)
        .limit(1)
        .maybeSingle();
      clienteId = data?.id ?? null;
    }
    if (!clienteId && cliente.email) {
      const { data } = await admin
        .from('clientes')
        .select('id')
        .ilike('email', cliente.email.trim())
        .limit(1)
        .maybeSingle();
      clienteId = data?.id ?? null;
    }

    const { data: inserida, error: insertError } = await admin
      .from('analises_credito')
      .insert({
        origem: payload.origem ?? 'promo_champions',
        referencia_externa: payload.pedido_id,
        correlation_key,
        pedido_numero: payload.pedido_numero ?? null,
        valor_pedido: Number.isFinite(valorPedido) ? valorPedido : null,
        cliente_id: clienteId,
        cliente_nome: cliente.nome ?? null,
        cliente_empresa: cliente.empresa ?? null,
        cliente_email: cliente.email ?? null,
        cliente_telefone: cliente.telefone ?? null,
        cnpj,
        vendedor_email: payload.vendedor_email ?? null,
        solicitado_em: payload.solicitado_em ?? new Date().toISOString(),
        alertas: avaliarAlertas(null, valorPedido),
      })
      .select('id')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        logger.info('duplicate_ignored', { context: { pedido_id: payload.pedido_id } });
        await logger.flush();
        return responder(req, 200, {
          ok: true,
          status: 'duplicate_ignored',
          pedido_id: payload.pedido_id,
        });
      }
      logger.error('insert_failed', { error_message: insertError.message });
      await logger.flush();
      return responder(req, 500, { ok: false, error: 'internal' });
    }

    const analiseId = inserida.id as string;

    // Enriquecimento automático: CNPJ.já (cache ou API). Falha aqui não derruba a
    // solicitação — o analista vê o alerta e pode reconsultar pela tela.
    if (cnpj) {
      const consulta = await consultarCnpjInterno(admin, cnpj);
      if (consulta.ok) {
        const { error: updError } = await admin
          .from('analises_credito')
          .update({
            dados_cnpja: consulta.dados,
            alertas: avaliarAlertas(consulta.dados, valorPedido),
          })
          .eq('id', analiseId);
        if (updError) logger.warn('cnpja_update_failed', { error_message: updError.message });
        logger.info('cnpja_consultado', {
          context: { analise_id: analiseId, origem: consulta.origem },
        });
      } else {
        logger.warn('cnpja_falhou', {
          error_message: consulta.erro,
          context: { analise_id: analiseId },
        });
      }
    }

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
      context: { analise_id: analiseId, pedido_id: payload.pedido_id, com_cnpj: !!cnpj },
    });
    await logger.flush();
    return responder(req, 200, { ok: true, status: 'processed', analise_id: analiseId });
  })
);
