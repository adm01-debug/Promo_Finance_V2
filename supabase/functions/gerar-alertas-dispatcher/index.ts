// deno-lint-ignore-file
// Edge Function: gerar-alertas-dispatcher
// Sprint 4.3 — auditoria sênior: consolida alertas em um único endpoint com
// dispatch por tipo (?tipo=financeiro|tributario|preditivo|health-score).
//
// Compatibilidade retroativa: mantém as funções antigas em produção; este
// dispatcher permite migração gradual e adição de novos tipos sem novo deploy.

import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { getRequestId, correlationResponseHeaders } from '../_shared/correlation.ts';

const ALERT_TYPES = ['financeiro', 'tributario', 'preditivo', 'health-score'] as const;
type AlertType = typeof ALERT_TYPES[number];

const FUNCTION_MAP: Record<AlertType, string> = {
  'financeiro': 'gerar-alertas',
  'tributario': 'gerar-alertas-tributarios',
  'preditivo': 'analise-preditiva',
  'health-score': 'calcular-health-score-operacional',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = getRequestId(req);
  const logger = createLogger('gerar-alertas-dispatcher', requestId);
  const headers = { ...corsHeaders, ...correlationResponseHeaders(requestId), 'Content-Type': 'application/json' };

  try {
    const url = new URL(req.url);
    const tipo = (url.searchParams.get('tipo') || 'financeiro').toLowerCase() as AlertType;

    if (!ALERT_TYPES.includes(tipo)) {
      logger.warn('tipo inválido', { tipo });
      return new Response(
        JSON.stringify({ error: 'tipo inválido', allowed: ALERT_TYPES }),
        { headers, status: 400 },
      );
    }

    const targetFunction = FUNCTION_MAP[tipo];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const authHeader = req.headers.get('Authorization') || '';
    const body = req.method === 'GET' ? null : await req.text();

    logger.info('dispatching', { tipo, target: targetFunction });

    const resp = await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'x-request-id': requestId,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
      },
      body,
    });

    const data = await resp.text();
    logger.info('dispatched', { tipo, status: resp.status });

    return new Response(data, { headers, status: resp.status });
  } catch (err) {
    logger.error('dispatch failed', { error: (err as Error).message });
    return new Response(
      JSON.stringify({ error: (err as Error).message, request_id: requestId }),
      { headers, status: 500 },
    );
  }
});
