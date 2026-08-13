// Edge Function: validate-ip-geo
// Validação de IP/Geo no servidor (não pode ser bypassada pelo cliente).
// - Resolve IP real via headers do proxy (cf-connecting-ip, x-forwarded-for)
// - Consulta geolocalização server-side
// - Aplica regras de allowlist (allowed_ips, allowed_countries)
// - Registra tentativa em auth_logs para rastreabilidade
//
// Rota: POST /functions/v1/validate-ip-geo
// Body: { email?: string }
// Resposta: { allowed: boolean, reason?: string, ip: string, country: string|null }
//
// verify_jwt = false — chamada antes do login. Não retorna dados sensíveis.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { validateContract } from "../_shared/contract-validator.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const _IpGeoSchema = z.object({ email: z.string().email().optional() }).partial();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GeoLookup {
  ip: string;
  country: string | null;
  source: 'ipapi' | 'ipwho' | 'none';
}

async function resolveClientIp(req: Request): Promise<string | null> {
  // Prioridade: CF-Connecting-IP > X-Real-IP > primeiro IP em X-Forwarded-For
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || null;
  return null;
}

async function lookupGeo(ip: string): Promise<GeoLookup> {
  // Tenta ipapi.co primeiro
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const r = await fetch(`https://ipapi.co/${ip}/json/`, { signal: ctrl.signal });
    clearTimeout(t);
    if (r.ok) {
      const j = await r.json();
      if (j && !j.error) {
        return { ip, country: j.country_code ?? null, source: 'ipapi' };
      }
    }
  } catch {
    // fallback abaixo
  }
  // Fallback: ipwho.is
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const r = await fetch(`https://ipwho.is/${ip}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (r.ok) {
      const j = await r.json();
      if (j?.success !== false) {
        return { ip, country: j.country_code ?? null, source: 'ipwho' };
      }
    }
  } catch {
    // ignore
  }
  return { ip, country: null, source: 'none' };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    return new Response(
      JSON.stringify({ error: 'server_misconfigured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  const admin = createClient(url, key);

  let body: { email?: string } = {};
  try {
    const _raw = await req.json();
    const _v = await validateContract(_IpGeoSchema, _raw);
    if (!_v.success) return _v.response;
    body = _v.data as { email?: string };
  } catch {
    // ok — body opcional
  }
  const email = (body.email ?? '').toString().toLowerCase().trim() || null;

  const ip = await resolveClientIp(req);
  if (!ip) {
    // Sem IP resolvido, não podemos afirmar bloqueio nem liberação — negar por padrão
    // é seguro, mas quebraria previews sem proxy. Optamos por permitir e registrar.
    await admin.from('auth_logs').insert({
      event_type: 'ip_geo_validation_no_ip',
      email,
      metadata: { headers: {
        'x-forwarded-for': req.headers.get('x-forwarded-for'),
        'cf-connecting-ip': req.headers.get('cf-connecting-ip'),
      } },
    }).then(() => {}, () => {});
    return new Response(
      JSON.stringify({ allowed: true, reason: 'ip_unresolved', ip: null, country: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // 1) IP bloqueado?
  const { data: ipBlocked } = await admin.rpc('is_ip_blocked', { p_ip_address: ip });
  if (ipBlocked === true) {
    await admin.from('auth_logs').insert({
      event_type: 'ip_geo_validation_blocked_ip',
      email,
      ip_address: ip,
      metadata: { reason: 'blocked_ip' },
    }).then(() => {}, () => {});
    return new Response(
      JSON.stringify({ allowed: false, reason: 'blocked_ip', ip, country: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // 2) IP na allowlist? (bypass positivo)
  const { data: ipAllowed } = await admin.rpc('is_ip_allowed_for_login', { _ip: ip });

  // 3) Geo
  const geo = await lookupGeo(ip);
  let allowed = true;
  let reason: string | undefined;

  if (ipAllowed === false) {
    // Se há entradas em allowed_ips e este IP não está, negar.
    // A função retorna false apenas quando existe pelo menos uma regra ativa
    // e nenhuma bate — mantém compat: se tabela vazia, política = permissiva.
    // (Documentado em .lovable/memory/features/... se aplicável)
    allowed = false;
    reason = 'ip_not_allowlisted';
  }

  if (allowed && geo.country) {
    const { data: countryAllowed } = await admin.rpc('is_country_allowed_for_login', {
      _country: geo.country,
    });
    if (countryAllowed === false) {
      allowed = false;
      reason = 'country_not_allowlisted';
    }
  }

  await admin.from('auth_logs').insert({
    event_type: allowed ? 'ip_geo_validation_ok' : 'ip_geo_validation_denied',
    email,
    ip_address: ip,
    metadata: { country: geo.country, source: geo.source, reason: reason ?? null },
  }).then(() => {}, () => {});

  return new Response(
    JSON.stringify({ allowed, reason, ip, country: geo.country }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
