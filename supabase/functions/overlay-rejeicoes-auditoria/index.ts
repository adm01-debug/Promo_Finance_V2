// API de auditoria das rejeições dos overlays de catálogo fiscal.
//
// Ações:
//  - registrar: recebe o lote de rejeições detectadas em runtime e faz o
//    upsert idempotente em `public.overlay_rejeicoes_auditoria`
//    (incrementa ocorrências quando a mesma rejeição volta a ocorrer).
//  - resolver:  marca/desmarca uma rejeição como corrigida na origem.
//
// Autenticação: JWT validado em código (verify_jwt = false é o padrão do
// deploy). Escrita exige papel admin ou manager, checado no servidor.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { z } from '../_shared/zod.ts';
import { corsHeaders, corsHeadersPara } from '../_shared/cors.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro } from '../_shared/erros.ts';
const log = createLogger('overlay-rejeicoes-auditoria');

const RejeicaoSchema = z.object({
  catalogo: z.enum([
    'icms',
    'iss',
    'ncm',
    'monofasico',
    'mva_st',
    'interestaduais',
    'faixas_simples',
  ]),
  identificador: z.string().min(1).max(120),
  descricao: z.string().max(300).nullable().optional(),
  campo: z.string().min(1).max(80),
  motivo: z.string().min(1).max(80),
  valorRecebido: z.string().max(300).nullable().optional(),
  severidade: z.enum(['critico', 'atencao']).default('critico'),
});

const BodySchema = z.discriminatedUnion('acao', [
  z.object({
    acao: z.literal('registrar'),
    referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    rejeicoes: z.array(RejeicaoSchema).max(1000),
  }),
  z.object({
    acao: z.literal('resolver'),
    id: z.string().uuid(),
    resolvido: z.boolean(),
    observacao: z.string().max(500).nullable().optional(),
  }),
]);

function json(payload: unknown, status = 200, headers: Record<string, string> = corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const _t0 = Date.now();
  try {
    const corsHeaders = corsHeadersPara(req);
    const res = (a: unknown, b = 200) => json(a, b, corsHeaders);

    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method !== 'POST') return res({ error: 'method_not_allowed' }, 405);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Autenticação: exige um JWT válido de usuário.
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    if (!token) return res({ error: 'unauthorized' }, 401);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) return res({ error: 'unauthorized' }, 401);
    const userId = userData.user.id;

    // 2) Autorização: escrita restrita a admin/manager (checagem server-side).
    const [{ data: isAdmin }, { data: isManager }] = await Promise.all([
      admin.rpc('has_role', { _user_id: userId, _role: 'admin' }),
      admin.rpc('has_role', { _user_id: userId, _role: 'manager' }),
    ]);
    if (!isAdmin && !isManager) return res({ error: 'forbidden' }, 403);

    // 3) Validação de entrada.
    let body: z.infer<typeof BodySchema>;
    try {
      const parsed = BodySchema.safeParse(await req.json());
      if (!parsed.success) {
        return res({ error: 'invalid_payload', detalhes: parsed.error.flatten() }, 400);
      }
      body = parsed.data;
    } catch {
      return res({ error: 'invalid_json' }, 400);
    }

    if (body.acao === 'resolver') {
      const { error } = await admin
        .from('overlay_rejeicoes_auditoria')
        .update({
          resolvido_em: body.resolvido ? new Date().toISOString() : null,
          resolvido_por: body.resolvido ? userId : null,
          observacao: body.observacao ?? null,
        })
        .eq('id', body.id);
      if (error) {
        log.error('[auditoria-overlay] falha ao resolver', {
          error_message: mensagemErro(error.message),
        });
        return res({ error: 'persist_failed' }, 500);
      }
      return res({ ok: true });
    }

    // acao === "registrar"
    const { referencia, rejeicoes } = body;
    if (rejeicoes.length === 0) return res({ inseridos: 0, atualizados: 0 });

    const { data: existentes, error: readError } = await admin
      .from('overlay_rejeicoes_auditoria')
      .select('id, catalogo, identificador, campo, motivo, ocorrencias')
      .eq('referencia', referencia);
    if (readError) {
      log.error('[auditoria-overlay] falha ao ler existentes', {
        error_message: mensagemErro(readError.message),
      });
      return res({ error: 'read_failed' }, 500);
    }

    const chave = (r: { catalogo: string; identificador: string; campo: string; motivo: string }) =>
      `${r.catalogo}|${r.identificador}|${r.campo}|${r.motivo}`;
    const indice = new Map((existentes ?? []).map((e) => [chave(e), e]));

    const agora = new Date().toISOString();
    const novos: Record<string, unknown>[] = [];
    let atualizados = 0;

    for (const r of rejeicoes) {
      const atual = indice.get(chave(r));
      if (atual) {
        const { error } = await admin
          .from('overlay_rejeicoes_auditoria')
          .update({
            ocorrencias: (atual.ocorrencias ?? 1) + 1,
            ultima_deteccao: agora,
            valor_recebido: r.valorRecebido ?? null,
            descricao: r.descricao ?? null,
            severidade: r.severidade,
          })
          .eq('id', atual.id);
        if (!error) atualizados += 1;
        continue;
      }
      novos.push({
        catalogo: r.catalogo,
        identificador: r.identificador,
        descricao: r.descricao ?? null,
        campo: r.campo,
        motivo: r.motivo,
        valor_recebido: r.valorRecebido ?? null,
        severidade: r.severidade,
        referencia,
        primeira_deteccao: agora,
        ultima_deteccao: agora,
      });
    }

    if (novos.length > 0) {
      const { error } = await admin.from('overlay_rejeicoes_auditoria').insert(novos);
      if (error) {
        log.error('[auditoria-overlay] falha ao inserir', {
          error_message: mensagemErro(error.message),
        });
        return res({ error: 'persist_failed' }, 500);
      }
    }

    return res({ inseridos: novos.length, atualizados });
  } finally {
    await log.flush(Date.now() - _t0);
  }
});
