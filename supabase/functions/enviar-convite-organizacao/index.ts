// ============================================
// Edge Function: enviar-convite-organizacao
// Envia por e-mail (Resend) o link de aceite de um convite de organização.
//
// Regras de segurança:
//  - Exige JWT válido (validação em código, verify_jwt = false por padrão).
//  - Só permite envio se o solicitante for RESPONSAVEL ou ADMIN ativo da org.
//  - O token do convite nunca é lido do corpo da requisição: é carregado
//    do banco a partir do convite_id, evitando enumeração/forjamento.
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

const BodySchema = z.object({
  convite_id: z.string().uuid(),
  origin: z.string().url().max(300).optional(),
});

const PAPEL_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  MEMBRO: 'Membro',
  LEITOR: 'Leitor',
  RESPONSAVEL: 'Responsável',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Não autenticado.' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: 'Sessão inválida.' }, 401);
    }
    const solicitanteId = userData.user.id;

    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ error: 'Dados inválidos.', detalhes: parsed.error.flatten().fieldErrors }, 400);
    }
    const { convite_id, origin } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: convite, error: conviteError } = await admin
      .from('convites')
      .select('id, organizacao_id, email_convidado, papel_proposto, token, expira_em, aceito_em, revogado_em')
      .eq('id', convite_id)
      .maybeSingle();

    if (conviteError) return json({ error: 'Falha ao carregar convite.' }, 500);
    if (!convite) return json({ error: 'Convite não encontrado.' }, 404);
    if (convite.revogado_em) return json({ error: 'Convite revogado.' }, 409);
    if (convite.aceito_em) return json({ error: 'Convite já aceito.' }, 409);
    if (new Date(convite.expira_em).getTime() <= Date.now()) {
      return json({ error: 'Convite expirado.' }, 409);
    }

    // Autorização: gestor ativo da organização do convite.
    const { data: vinculo } = await admin
      .from('organizacao_membros')
      .select('papel_na_org, ativo')
      .eq('organizacao_id', convite.organizacao_id)
      .eq('usuario_id', solicitanteId)
      .maybeSingle();

    const { data: org } = await admin
      .from('organizacoes')
      .select('nome, responsavel_id')
      .eq('id', convite.organizacao_id)
      .maybeSingle();

    const ehResponsavel = org?.responsavel_id === solicitanteId;
    const ehGestor =
      ehResponsavel ||
      (vinculo?.ativo === true && ['RESPONSAVEL', 'ADMIN'].includes(String(vinculo.papel_na_org)));

    if (!ehGestor) {
      return json({ error: 'Sem permissão para enviar este convite.' }, 403);
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const baseUrl = (origin ?? Deno.env.get('APP_BASE_URL') ?? '').replace(/\/+$/, '');
    const link = `${baseUrl}/convite/${convite.token}`;

    if (!resendKey) {
      // Modo simulado: não falha o fluxo de criação do convite.
      return json({ enviado: false, motivo: 'email_nao_configurado', link });
    }

    const nomeOrg = escapeHtml(org?.nome ?? 'Organização');
    const papel = PAPEL_LABEL[String(convite.papel_proposto)] ?? String(convite.papel_proposto);
    const expiraEm = new Date(convite.expira_em).toLocaleDateString('pt-BR');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">Convite para ${nomeOrg}</h2>
        <p>Você foi convidado(a) para participar da organização <strong>${nomeOrg}</strong> como <strong>${escapeHtml(papel)}</strong>.</p>
        <p style="margin:24px 0">
          <a href="${escapeHtml(link)}" style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Aceitar convite</a>
        </p>
        <p style="font-size:13px;color:#555">Este convite expira em ${expiraEm}. Se você não reconhece este convite, ignore este e-mail.</p>
      </div>`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM') ?? 'Convites <onboarding@resend.dev>',
        to: [convite.email_convidado],
        subject: `Convite para ${org?.nome ?? 'organização'}`,
        html,
      }),
    });

    if (!resp.ok) {
      const detalhe = await resp.text();
      console.error('resend_error', resp.status, detalhe.slice(0, 300));
      return json({ enviado: false, motivo: 'falha_provedor_email', link }, 502);
    }

    return json({ enviado: true, link });
  } catch (e) {
    console.error('enviar-convite-organizacao_error', e instanceof Error ? e.message : e);
    return json({ error: 'Erro interno ao enviar convite.' }, 500);
  }
});
