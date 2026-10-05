import { corsHeaders, corsHeadersPara } from '../_shared/cors.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';

const PROJECT_REF = 'bwwbeyolnnzppeuhgkcd';
const ACS_URL = `https://${PROJECT_REF}.supabase.co/auth/v1/sso/saml/acs`;
const ENTITY_ID = `https://${PROJECT_REF}.supabase.co/auth/v1/sso/saml/metadata`;
const OIDC_CALLBACK = `https://${PROJECT_REF}.supabase.co/auth/v1/callback`;

Deno.serve(
  withEdgeObservability('sso-generate-metadata', async (req) => {
    const corsHeaders = corsHeadersPara(req);
    const res = (a: unknown, b = 200) => json(a, b, corsHeaders);

    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
      const raw = await req.json().catch(() => ({}));
      const { z } = await import('https://deno.land/x/zod@v3.22.4/mod.ts');
      const { validatePayload } = await import('../_shared/validation.ts');
      const Schema = z
        .object({ tipo: z.enum(['oidc', 'saml']), nome: z.string().optional() })
        .passthrough();
      const parsed = validatePayload(Schema, raw, 'sso-generate-metadata');
      if (!parsed.success) return res({ error: parsed.error, details: parsed.details }, 400);
      const { tipo, nome } = parsed.data;

      if (tipo === 'oidc') {
        return res(
          {
            callback_url: OIDC_CALLBACK,
            entity_id: ENTITY_ID,
            instructions: "Cole o callback_url no campo 'Redirect URI' do seu provedor OIDC",
          },
          200
        );
      }

      if (tipo === 'saml') {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${ENTITY_ID}">
  <SPSSODescriptor AuthnRequestsSigned="false"
                   WantAssertionsSigned="true"
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${ACS_URL}"
                              index="0"
                              isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
        return res(
          {
            metadata_xml: xml,
            acs_url: ACS_URL,
            entity_id: ENTITY_ID,
            nome: nome ?? 'Promo Finance',
            instructions:
              'Faça upload da metadata XML no seu IdP SAML, ou configure ACS URL e Entity ID manualmente',
          },
          200
        );
      }

      return res({ error: 'tipo inválido' }, 400);
    } catch (e) {
      return res({ error: e instanceof Error ? e.message : 'Erro' }, 500);
    }
  })
);

function json(data: unknown, status: number, headers: Record<string, string> = corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
