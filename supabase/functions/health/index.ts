import { corsHeadersPara } from '../_shared/cors.ts';
import { clientDeServico, exigirUsuario } from '../_shared/auth-guard.ts';

/**
 * Liveness probe público e mínimo; probe profundo para usuário autenticado.
 *
 * Visitante anônimo recebe apenas `{status:'ok'}` — o check de dependências
 * (database/realtime/asaas/bling) expõe contorno interno da infra e por isso
 * exige JWT válido. A StatusPage chama a função com a sessão do usuário e
 * continua recebendo `services.*` para o painel.
 */
Deno.serve(async (req) => {
  const corsHeaders = corsHeadersPara(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const usuario = await exigirUsuario(req);
  if (!usuario.ok) {
    return json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  const supabase = clientDeServico();
  const health: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    status: 'operational',
    services: {
      edge_runtime: { status: 'operational' },
      database: { status: 'unknown' },
      realtime: { status: 'unknown' },
      external_apis: {
        asaas: { status: 'unknown' },
        bling: { status: 'unknown' },
      },
    },
  };
  const services = health.services as Record<
    string,
    { status: string } | Record<string, { status: string }>
  >;
  const db = services.database as { status: string };
  const apis = services.external_apis as Record<string, { status: string }>;

  try {
    const { error } = await supabase
      .from('asaas_config')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    db.status = error ? 'degraded' : 'operational';
  } catch {
    db.status = 'outage';
  }

  try {
    const asaasRes = await fetch('https://api.asaas.com/v3/ping').catch(() => null);
    apis.asaas.status = asaasRes?.ok ? 'operational' : 'degraded';
  } catch {
    apis.asaas.status = 'outage';
  }

  try {
    const blingRes = await fetch('https://api.bling.com.br/Api/v3/ping').catch(() => null);
    apis.bling.status = blingRes?.ok ? 'operational' : 'degraded';
  } catch {
    apis.bling.status = 'outage';
  }

  services.realtime = { status: db.status };
  if (db.status === 'outage') health.status = 'degraded';

  return json(health);
});
