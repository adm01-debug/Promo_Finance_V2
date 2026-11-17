import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createErrorResponse, validatePayload, parseJsonBody } from '../_shared/validation.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { corsHeadersPara } from '../_shared/cors.ts';
import { mfaAdminInsuficiente } from '../_shared/auth-guard.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
const log = createLogger('processar-solicitacao-lgpd');

interface Payload {
  solicitacao_id: string;
}

serve(
  withEdgeObservability('processar-solicitacao-lgpd', async (req) => {
    const _t0 = Date.now();
    try {
      const corsHeaders = corsHeadersPara(req);
      if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      const startedAt = Date.now();
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const authHeader = req.headers.get('Authorization') ?? '';

        const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: authHeader } },
        });
        const adminClient = createClient(supabaseUrl, serviceKey);

        const { data: userData, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userData.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const userId = userData.user.id;

        const __json = await parseJsonBody(req, 'processar-solicitacao-lgpd');
        if (!__json.success) return __json.response;
        const body = __json.data as Payload;
        const __contract = validatePayload(
          z.object({ solicitacao_id: z.string().uuid() }),
          (typeof body === 'object' ? body : {}) as unknown,
          'processar-solicitacao-lgpd'
        );
        if (!__contract.success)
          return createErrorResponse(__contract.error, 422, __contract.details, req);
        if (!body?.solicitacao_id) {
          return new Response(JSON.stringify({ error: 'solicitacao_id required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: sol, error: solErr } = await adminClient
          .from('solicitacoes_lgpd')
          .select('*')
          .eq('id', body.solicitacao_id)
          .maybeSingle();
        if (solErr || !sol) {
          return new Response(JSON.stringify({ error: 'Solicitação não encontrada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Permissão: dono ou admin
        const { data: isAdmin } = await adminClient.rpc('has_role', {
          _user_id: userId,
          _role: 'admin',
        });
        if (sol.user_id !== userId && !isAdmin) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // Admin operando a solicitação de outro titular: exige aal2 quando o
        // MFA-admin estiver ligado — mesma regra do guard exigirPapel.
        if (
          sol.user_id !== userId &&
          mfaAdminInsuficiente(['admin'], authHeader.replace(/^Bearer\s+/i, ''))
        ) {
          return new Response(JSON.stringify({ error: 'mfa_required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const targetUserId = sol.user_id;
        let payloadResposta: Record<string, unknown> = {};
        let urlDump: string | null = null;

        // Coletar dados do titular
        const [profile, alertas, audits, solicitacoes] = await Promise.all([
          adminClient.from('profiles').select('*').eq('id', targetUserId).maybeSingle(),
          adminClient.from('alertas').select('*').eq('user_id', targetUserId).limit(1000),
          adminClient
            .from('audit_logs')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(1000),
          adminClient.from('solicitacoes_lgpd').select('*').eq('user_id', targetUserId),
        ]);

        const dump = {
          gerado_em: new Date().toISOString(),
          titular: { id: targetUserId, email: sol.user_email },
          profile: profile.data,
          alertas: alertas.data ?? [],
          audit_logs: audits.data ?? [],
          solicitacoes_lgpd: solicitacoes.data ?? [],
        };

        if (sol.tipo === 'acesso') {
          payloadResposta = dump;
        } else if (sol.tipo === 'portabilidade') {
          // Gera CSV agregado e faz upload
          const sections: string[] = [];
          sections.push(`# DUMP LGPD — ${sol.user_email} — ${new Date().toISOString()}`);
          for (const [name, rows] of Object.entries({
            profile: profile.data ? [profile.data] : [],
            alertas: alertas.data ?? [],
            audit_logs: audits.data ?? [],
            solicitacoes_lgpd: solicitacoes.data ?? [],
          })) {
            sections.push(`\n\n## ${name}`);
            const arr = rows as Record<string, unknown>[];
            if (arr.length === 0) {
              sections.push('(sem registros)');
              continue;
            }
            const headers = Object.keys(arr[0]);
            sections.push(headers.join(','));
            for (const r of arr) {
              sections.push(
                headers
                  .map((h) => {
                    const v = r[h];
                    if (v == null) return '';
                    const s = typeof v === 'string' ? v : JSON.stringify(v);
                    return `"${s.replace(/"/g, '""')}"`;
                  })
                  .join(',')
              );
            }
          }
          const csv = '\uFEFF' + sections.join('\n');
          const path = `lgpd/${targetUserId}/dump-${Date.now()}.csv`;
          const { error: upErr } = await adminClient.storage
            .from('relatorios-tributarios')
            .upload(path, new Blob([csv], { type: 'text/csv' }), {
              contentType: 'text/csv; charset=utf-8',
              upsert: true,
            });
          if (upErr) throw upErr;
          const { data: signed } = await adminClient.storage
            .from('relatorios-tributarios')
            .createSignedUrl(path, 60 * 60 * 24);
          urlDump = signed?.signedUrl ?? null;
          payloadResposta = { formato: 'csv', path, registros: dump };
        } else if (sol.tipo === 'exclusao' || sol.tipo === 'anonimizacao') {
          const hashed = `anon-${targetUserId.slice(0, 8)}@removido.local`;
          // `phone` não existe em public.profiles (as colunas são id, full_name,
          // avatar_url, role, created_at, updated_at, email, user_id, empresa_id).
          // Com ela no payload o UPDATE inteiro era recusado pelo banco, e o erro
          // não era checado: nenhum dado do titular era anonimizado e a
          // solicitação ainda assim seguia para "atendida".
          const { error: erroAnon } = await adminClient
            .from('profiles')
            .update({
              full_name: 'Titular removido',
              email: hashed,
              avatar_url: null,
            })
            .eq('id', targetUserId);
          if (erroAnon) throw erroAnon;
          payloadResposta = {
            anonimizado_em: new Date().toISOString(),
            email_substituto: hashed,
          };
        } else if (sol.tipo === 'retificacao') {
          payloadResposta = {
            instrucoes:
              'Retificação requer revisão manual do administrador. Justificativa registrada.',
          };
        }

        // Atualiza solicitação.
        // Quem atendeu vai dentro de payload_resposta: a coluna atendida_por não
        // existe em public.solicitacoes_lgpd, e com ela no payload este UPDATE era
        // recusado — a solicitação nunca saía de "pendente", mesmo com a resposta
        // já gerada e o dump no storage.
        const { error: erroFechamento } = await adminClient
          .from('solicitacoes_lgpd')
          .update({
            status: 'atendida',
            payload_resposta: { ...payloadResposta, atendida_por: userId },
            url_dump: urlDump,
            atendida_em: new Date().toISOString(),
          })
          .eq('id', sol.id);
        if (erroFechamento) throw erroFechamento;

        // Auditoria P9
        await adminClient.from('auditoria_tributaria').insert({
          acao: 'update',
          entidade_tipo: 'solicitacoes_lgpd',
          entidade_id: sol.id,
          user_id: userId,
          user_email: userData.user.email,
          payload_novo: { tipo: sol.tipo, atendida: true },
        });

        return new Response(
          JSON.stringify({
            ok: true,
            tipo: sol.tipo,
            url_dump: urlDump,
            payload: payloadResposta,
            duration_ms: Date.now() - startedAt,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        log.error('processar-solicitacao-lgpd error:', {
          error_message: mensagemErro(e),
          context: contextoErro(e),
        });
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } finally {
      log.info('request', { duration_ms: Date.now() - _t0 });
      await log.flush();
    }
  })
);
