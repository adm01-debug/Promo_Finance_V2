// ============================================
// Edge Function: validar-token-contador
// Valida JWT do contador e retorna dashboard mínimo (read-only)
// PÚBLICA — não exige Authorization header
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { verify as verifyJwt } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const log = createLogger('validar-token-contador');
  const startedAt = Date.now();

  try {
    const { token } = await req.json().catch(() => ({}));
    if (!token || typeof token !== 'string') {
      return json({ error: 'Token ausente' }, 400);
    }

    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') ?? SERVICE;

    let payload: Record<string, unknown>;
    try {
      const key = await importHmacKey(JWT_SECRET);
      payload = await verifyJwt(token, key);
    } catch {
      log.warn('jwt_invalid');
      return json({ error: 'Token inválido ou expirado' }, 401);
    }

    if (payload.role !== 'contador_readonly') {
      return json({ error: 'Token sem permissão' }, 403);
    }

    const rawToken = String(payload.sub ?? '');
    const empresaId = String(payload.empresa_id ?? '');
    if (!rawToken || !empresaId) return json({ error: 'Token malformado' }, 400);

    const tokenHash = await sha256Hex(rawToken);
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: convite } = await admin
      .from('convites_contador')
      .select('id, empresa_id, email, expires_at, accepted_at, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (!convite) return json({ error: 'Convite não encontrado' }, 404);
    if (convite.revoked_at) return json({ error: 'Convite revogado' }, 403);
    if (new Date(convite.expires_at) < new Date()) return json({ error: 'Convite expirado' }, 403);

    // Marca aceite na primeira visita
    if (!convite.accepted_at) {
      await admin
        .from('convites_contador')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', convite.id);
    }

    // Busca dados read-only da empresa
    const { data: empresa } = await admin
      .from('empresas')
      .select('id, razao_social, nome_fantasia, cnpj, regime_tributario')
      .eq('id', empresaId)
      .maybeSingle();

    if (!empresa) return json({ error: 'Empresa não encontrada' }, 404);

    log.info('fn_success', { duration_ms: Date.now() - startedAt, context: { empresa_id: empresaId } });

    return json({
      success: true,
      empresa,
      convite: { email: convite.email, expires_at: convite.expires_at },
    }, 200);
  } catch (err) {
    log.error('fn_failure', {
      error_message: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - startedAt,
    });
    return json({ error: 'Erro interno' }, 500);
  } finally {
    await log.flush();
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
