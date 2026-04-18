// ============================================
// Edge Function: convidar-contador
// Gera token assinado para acesso read-only e envia e-mail via Resend
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { z } from 'https://esm.sh/zod@3.23.8';
import { create as createJwt, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  empresa_id: z.string().uuid(),
  email: z.string().trim().email().max(255),
  nome: z.string().trim().max(120).optional(),
  origin: z.string().url().optional(),
});

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

  const log = createLogger('convidar-contador');
  const startedAt = Date.now();
  log.info('fn_start');

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      log.warn('unauthorized_no_token');
      return json({ error: 'Unauthorized' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') ?? SERVICE;

    const supaUser = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supaUser.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      log.warn('unauthorized_invalid_jwt');
      return json({ error: 'Unauthorized' }, 401);
    }
    const userId = claims.claims.sub as string;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      log.warn('invalid_body', { context: { errors: parsed.error.flatten().fieldErrors } });
      return json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { empresa_id, email, nome, origin } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Gera token aleatório de 32 bytes (URL-safe)
    const rawBytes = new Uint8Array(32);
    crypto.getRandomValues(rawBytes);
    const rawToken = btoa(String.fromCharCode(...rawBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // JWT assinado contém payload, mas o que vai por e-mail é o rawToken
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const key = await importHmacKey(JWT_SECRET);
    const signedJwt = await createJwt(
      { alg: 'HS256', typ: 'JWT' },
      {
        sub: rawToken,
        empresa_id,
        role: 'contador_readonly',
        exp: getNumericDate(60 * 60 * 24 * 30),
      },
      key,
    );

    const tokenHash = await sha256Hex(rawToken);

    const { data: convite, error: insertErr } = await admin
      .from('convites_contador')
      .insert({
        empresa_id,
        email,
        nome: nome ?? null,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        created_by: userId,
      })
      .select('id')
      .single();

    if (insertErr) {
      log.error('insert_failed', { error_message: insertErr.message });
      return json({ error: 'Falha ao registrar convite' }, 500);
    }

    // Envia e-mail via Resend (gateway connector)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const link = `${origin ?? 'https://app.lovable.app'}/contador/${signedJwt}`;

    let emailSent = false;
    if (RESEND_API_KEY && LOVABLE_API_KEY) {
      try {
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
            <h2 style="margin:0 0 12px">Acesso de contador concedido</h2>
            <p>Olá${nome ? `, ${nome}` : ''}.</p>
            <p>Você recebeu acesso de leitura ao painel tributário desta empresa. O link abaixo é válido por 30 dias.</p>
            <p style="margin:24px 0">
              <a href="${link}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Acessar painel</a>
            </p>
            <p style="color:#64748b;font-size:12px">Se você não esperava este e-mail, ignore-o.</p>
          </div>`;

        const resp = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: 'PromoFinance <onboarding@resend.dev>',
            to: [email],
            subject: 'Seu acesso ao painel tributário',
            html,
          }),
        });
        emailSent = resp.ok;
        if (!resp.ok) {
          const txt = await resp.text();
          log.warn('email_send_failed', { status_code: resp.status, error_message: txt.slice(0, 200) });
        } else {
          log.info('email_sent', { context: { email } });
        }
      } catch (mailErr) {
        log.warn('email_exception', {
          error_message: mailErr instanceof Error ? mailErr.message : String(mailErr),
        });
      }
    } else {
      log.warn('email_skipped_missing_keys');
    }

    log.info('fn_success', {
      duration_ms: Date.now() - startedAt,
      context: { convite_id: convite.id, email_sent: emailSent },
    });

    return json({
      success: true,
      convite_id: convite.id,
      link,
      email_sent: emailSent,
      expires_at: expiresAt.toISOString(),
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
