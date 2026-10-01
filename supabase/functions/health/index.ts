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

  // Ping externo com prazo: uma API que segura a conexão aberta não pode
  // travar o painel de status — estoura em 'outage' após o timeout.
  const ping = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      return res.ok ? 'operational' : 'degraded';
    } catch {
      return 'outage';
    }
  };

  const [dbRes, asaasStatus, blingStatus] = await Promise.all([
    (async () => {
      try {
        const { error } = await supabase
          .from('asaas_config')
          .select('count', { count: 'exact', head: true })
          .limit(1);
        return error ? 'degraded' : 'operational';
      } catch {
        return 'outage';
      }
    })(),
    ping('https://api.asaas.com/v3/ping'),
    ping('https://api.bling.com.br/Api/v3/ping'),
  ]);

  db.status = dbRes;
  apis.asaas.status = asaasStatus;
  apis.bling.status = blingStatus;

  services.realtime = { status: db.status };
  if (db.status === 'outage') health.status = 'degraded';

  return json(health);
});
