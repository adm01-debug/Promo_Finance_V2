import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
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

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const usuario = await exigirUsuario(req);
  if (!usuario.ok) {
    // Probe público: roda os mesmos checks, mas devolve só o status agregado —
    // o monitor externo detecta indisponibilidade sem ver o contorno da infra.
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return json({ status: 'ok', timestamp: new Date().toISOString() });
    const anon = createClient(url, key);
    const ping = async (u: string): Promise<string> => {
      try {
        const res = await fetch(u, { signal: AbortSignal.timeout(3000) });
        return res.ok ? 'operational' : 'degraded';
      } catch {
        return 'outage';
      }
    };
    const [dbErr, asaasRes, blingRes] = await Promise.all([
      (async () => {
        try {
          const { error } = await anon
            .from('asaas_config')
            .select('count', { count: 'exact', head: true })
            .limit(1);
          return error;
        } catch {
          return true;
        }
      })(),
      ping('https://api.asaas.com/v3/ping'),
      ping('https://api.bling.com.br/Api/v3/ping'),
    ]);
    const falhou = dbErr || asaasRes !== 'operational' || blingRes !== 'operational';
    // Semântica de liveness: 503 só quando o app não consegue servir (banco
    // fora). APIs externas degradadas não mudam o HTTP — o corpo agregado
    // continua marcando 'outage' para monitores que o leem. O esqueleto de
    // services (só status agregado, sem internals) mantém a StatusPage
    // funcionando para visitantes anônimos da rota pública /status.
    return json(
      {
        status: falhou ? 'outage' : 'ok',
        timestamp: new Date().toISOString(),
        services: {
          edge_runtime: { status: 'operational' },
          database: { status: dbErr ? 'outage' : 'operational' },
          realtime: { status: dbErr ? 'outage' : 'operational' },
          external_apis: {
            asaas: { status: asaasRes },
            bling: { status: blingRes },
          },
        },
      },
      dbErr ? 503 : 200
    );
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
