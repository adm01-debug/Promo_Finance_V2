// Edge Function: aceitar-convite
// Valida o token opaco de convite e efetiva o vínculo do usuário autenticado
// com a organização. Precisa de service role porque o convidado ainda não
// possui vínculo (e portanto não passa nas policies de RLS de leitura).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { z } from '../_shared/zod.ts';
import { corsHeaders, corsHeadersPara } from '../_shared/cors.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';

const BodySchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/, 'Token inválido'),
});

type OrgPapel = 'RESPONSAVEL' | 'ADMIN' | 'MEMBRO' | 'LEITOR';

function json(
  payload: unknown,
  status = 200,
  headers: Record<string, string> = corsHeaders
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

const normalizarEmail = (email: string) => email.trim().toLowerCase();

Deno.serve(
  withEdgeObservability('aceitar-convite', async (req) => {
    const cors = corsHeadersPara(req);
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    const res = (payload: unknown, status = 200) => json(payload, status, cors);

    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) return res({ error: 'Unauthorized' }, 401);

      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
      const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      // Cliente do usuário: apenas para identificar quem está chamando.
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userError } = await userClient.auth.getUser();
      if (userError || !userData?.user) return res({ error: 'Unauthorized' }, 401);
      const user = userData.user;

      const parsed = BodySchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return res(
          { error: 'Requisição inválida', detalhes: parsed.error.flatten().fieldErrors },
          400
        );
      }

      // Cliente privilegiado: leitura do convite + escrita do vínculo.
      const admin = createClient(SUPABASE_URL, SERVICE, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: convite, error: erroConvite } = await admin
        .from('convites')
        .select('id, organizacao_id, email_convidado, papel_proposto, expira_em, utilizado_em')
        .eq('token', parsed.data.token)
        .maybeSingle();

      if (erroConvite) return res({ error: 'Falha ao validar convite' }, 500);
      if (!convite)
        return res({ error: 'Convite não encontrado. Verifique o link recebido.' }, 404);
      if (convite.utilizado_em) return res({ error: 'Este convite já foi utilizado.' }, 409);
      if (new Date(convite.expira_em).getTime() <= Date.now()) {
        return res({ error: 'Este convite expirou. Solicite um novo ao responsável.' }, 410);
      }

      const emailUsuario = normalizarEmail(user.email ?? '');
      if (!emailUsuario || emailUsuario !== normalizarEmail(convite.email_convidado)) {
        return res(
          { error: 'Este convite foi emitido para outro e-mail. Entre com a conta convidada.' },
          403
        );
      }
      if (convite.papel_proposto === 'RESPONSAVEL') {
        return res({ error: 'Papel de convite inválido.' }, 422);
      }

      const { data: organizacao } = await admin
        .from('organizacoes')
        .select('id, nome, ativo')
        .eq('id', convite.organizacao_id)
        .maybeSingle();

      if (!organizacao || organizacao.ativo === false) {
        return res({ error: 'Organização indisponível.' }, 410);
      }

      // Idempotente: reaproveita o vínculo existente em vez de duplicar.
      const { data: existente } = await admin
        .from('organizacao_membros')
        .select('id')
        .eq('organizacao_id', convite.organizacao_id)
        .eq('usuario_id', user.id)
        .maybeSingle();

      const agora = new Date().toISOString();

      if (existente) {
        const { error } = await admin
          .from('organizacao_membros')
          .update({ papel_na_org: convite.papel_proposto, ativo: true, aceito_em: agora })
          .eq('id', existente.id);
        if (error) return res({ error: 'Falha ao ativar vínculo' }, 500);
      } else {
        const { error } = await admin.from('organizacao_membros').insert({
          organizacao_id: convite.organizacao_id,
          usuario_id: user.id,
          papel_na_org: convite.papel_proposto,
          ativo: true,
          aceito_em: agora,
        });
        if (error) return res({ error: 'Falha ao criar vínculo' }, 500);
      }

      // Consome o convite apenas após o vínculo existir (evita token queimado à toa).
      await admin.from('convites').update({ utilizado_em: agora }).eq('id', convite.id);

      return res({
        organizacao_id: organizacao.id,
        organizacao_nome: organizacao.nome,
        papel: convite.papel_proposto as OrgPapel,
      });
    } catch (_err) {
      return res({ error: 'Erro interno ao processar convite' }, 500);
    }
  })
);
