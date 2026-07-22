// Edge Function: nfe-upload-certificado
// Recebe um certificado digital A1 (.pfx) em base64 + senha, valida com node-forge,
// extrai CNPJ + validade, salva o .pfx no bucket privado `nfe-certificados` e
// persiste os metadados criptografados via RPC certificado_upsert.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import forge from 'npm:node-forge@1.3.1';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  empresa_id: z.string().uuid(),
  pfx_base64: z.string().min(100),
  password: z.string().min(1).max(256),
  ambiente: z.enum(['homologacao', 'producao']).default('homologacao'),
  uf: z.string().length(2),
});

function log(...args: unknown[]) {
  console.log('[nfe-upload-certificado]', ...args);
}

function extractCnpjFromSubject(subject: forge.pki.Certificate['subject']): string | null {
  // OID 2.16.76.1.3.3 = CNPJ da pessoa jurídica (ICP-Brasil)
  const cn = subject.getField('CN')?.value ?? '';
  const match = cn.match(/(\d{14})/);
  if (match) return match[1];

  // Fallback: procurar em SubjectAltName via extensions (feito fora)
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const t0 = Date.now();
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const MASTER_KEY = Deno.env.get('NFE_CERT_MASTER_KEY');
    if (!MASTER_KEY) {
      return new Response(JSON.stringify({ error: 'server_missing_master_key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cliente com o JWT do usuário para checar role
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'invalid_session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = userRes.user;

    const service = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await service.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'forbidden_admin_only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json();
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'invalid_body', details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const { empresa_id, pfx_base64, password, ambiente, uf } = parsed.data;

    // Decodifica o .pfx
    let pfxBytes: Uint8Array;
    try {
      pfxBytes = Uint8Array.from(atob(pfx_base64), (c) => c.charCodeAt(0));
    } catch {
      return new Response(JSON.stringify({ error: 'pfx_base64_invalid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parseia com node-forge
    let cnpj = '';
    let razaoSocial = '';
    let validoDe: string | null = null;
    let validoAte: string | null = null;
    try {
      const p12Der = forge.util.createBuffer(pfxBytes as unknown as string);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const bags = certBags[forge.pki.oids.certBag] ?? [];
      const cert = bags[0]?.cert;
      if (!cert) throw new Error('cert_bag_empty');

      const cn = (cert.subject.getField('CN')?.value ?? '') as string;
      razaoSocial = cn.split(':')[0]?.trim() ?? cn;

      const cnpjMatch = cn.match(/(\d{14})/);
      if (cnpjMatch) cnpj = cnpjMatch[1];
      if (!cnpj) {
        // procurar OID 2.16.76.1.3.3 nas extensões
        const altExt = cert.getExtension('subjectAltName') as forge.pki.SubjectAltNameExtension | null;
        if (altExt?.altNames) {
          for (const alt of altExt.altNames) {
            const v = (alt.value ?? '') as string;
            const m = v.match(/(\d{14})/);
            if (m) { cnpj = m[1]; break; }
          }
        }
      }
      if (!cnpj) throw new Error('cnpj_not_found_in_cert');

      validoDe = cert.validity.notBefore.toISOString();
      validoAte = cert.validity.notAfter.toISOString();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log('parse_error', msg);
      return new Response(
        JSON.stringify({ error: 'pfx_parse_failed', details: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (new Date(validoAte!) < new Date()) {
      return new Response(JSON.stringify({ error: 'cert_expired', valido_ate: validoAte }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload do .pfx no bucket privado
    const storagePath = `${empresa_id}/${cnpj}-${ambiente}.pfx`;
    const { error: upErr } = await service.storage
      .from('nfe-certificados')
      .upload(storagePath, pfxBytes, {
        upsert: true,
        contentType: 'application/x-pkcs12',
      });
    if (upErr) {
      log('storage_error', upErr.message);
      return new Response(JSON.stringify({ error: 'storage_upload_failed', details: upErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Persiste via RPC (criptografa a senha com pgp_sym_encrypt)
    const { data: certId, error: rpcErr } = await service.rpc('certificado_upsert', {
      p_empresa_id: empresa_id,
      p_cnpj: cnpj,
      p_razao_social: razaoSocial,
      p_pfx_storage_path: storagePath,
      p_password: password,
      p_master_key: MASTER_KEY,
      p_valido_de: validoDe,
      p_valido_ate: validoAte,
      p_ambiente: ambiente,
      p_uf: uf.toUpperCase(),
      p_criado_por: user.id,
    });
    if (rpcErr) {
      log('rpc_error', rpcErr.message);
      return new Response(JSON.stringify({ error: 'db_upsert_failed', details: rpcErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Inicializa cursor de NSU se não existir
    await service
      .from('sefaz_dfe_cursor')
      .upsert(
        { cnpj, ambiente, ultimo_nsu: 0, max_nsu: 0 },
        { onConflict: 'cnpj,ambiente', ignoreDuplicates: true },
      );

    log('success', { cnpj, ambiente, duration_ms: Date.now() - t0 });

    return new Response(
      JSON.stringify({
        ok: true,
        cert_id: certId,
        cnpj,
        razao_social: razaoSocial,
        valido_de: validoDe,
        valido_ate: validoAte,
        ambiente,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('unhandled', msg);
    return new Response(JSON.stringify({ error: 'internal_error', details: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
