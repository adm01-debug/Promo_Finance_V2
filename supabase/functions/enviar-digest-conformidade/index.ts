/**
 * Etapa P — Envio do digest de alertas de conformidade fiscal por e-mail.
 *
 * Executada diariamente por `pg_cron` (e sob demanda por administradores),
 * a função:
 *  1. lê os alertas de conformidade ainda não notificados em
 *     `alertas_tributarios` (tipo `conformidade:*`, status `pendente`);
 *  2. monta um digest determinístico por destinatário (módulo puro
 *     `_shared/obrigacoes/digest.ts`);
 *  3. envia via Resend (quando `RESEND_API_KEY` existir) ou entra em modo
 *     simulação, sem falhar o job;
 *  4. marca os alertas enviados como `notificado` — o que torna a execução
 *     idempotente: reprocessar no mesmo dia não reenvia nada.
 *
 * Autorização (uma das duas):
 *  - header `x-cron-secret` conferido contra `integration_secrets`;
 *  - JWT de usuário com papel `admin`.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

import { construirDigest, type AlertaDigest } from '../_shared/obrigacoes/digest.ts';
import { hashAlertas, planejarEnvios } from '../_shared/obrigacoes/preferencias-digest.ts';

/** Prefixo gravado na coluna `tipo` pelo job de snapshots. */
const PREFIXO_ALERTA = 'conformidade';
/** Status aplicado após o envio bem-sucedido. */
const STATUS_NOTIFICADO = 'notificado';
/** Fuso de referência das preferências (horário comercial brasileiro). */
const FUSO = 'America/Sao_Paulo';

const BodySchema = z.object({
  /** Restringe o digest a uma empresa. */
  empresaId: z.string().uuid().optional(),
  /** Destinatários explícitos; se ausente, usa as preferências dos usuários. */
  destinatarios: z.array(z.string().email()).max(50).optional(),
  /** Ignora as preferências e envia um digest único aos administradores. */
  forcarGlobal: z.boolean().default(false),
  /** Competência exibida no cabeçalho (AAAA-MM). */
  competencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  /** Severidade mínima incluída no digest. */
  severidadeMinima: z.enum(['baixa', 'media', 'alta', 'critica']).default('media'),
  /** Quando true, não envia e não marca alertas — apenas devolve a prévia. */
  dryRun: z.boolean().default(false),
  /** Teto de alertas por execução (proteção contra payloads gigantes). */
  limite: z.number().int().min(1).max(500).default(200),
});

const PESO: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/** E-mails dos administradores — fallback quando não há preferências. */
async function destinatariosAdmin(
  admin: ReturnType<typeof createClient>,
): Promise<string[]> {
  const { data: adminRoles } = await admin.from('user_roles').select('user_id').eq('role', 'admin');
  const adminIds = (adminRoles ?? []).map((r) => r.user_id as string);
  if (adminIds.length === 0) return [];
  const { data: perfis } = await admin
    .from('profiles')
    .select('email')
    .in('user_id', adminIds)
    .not('email', 'is', null);
  return [...new Set((perfis ?? []).map((p) => String(p.email)).filter((e) => e.includes('@')))];
}


Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Ambiente incompleto' }, 500);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    // ---- Autorização -------------------------------------------------------
    const cronSecret = req.headers.get('x-cron-secret');
    let autorizado = false;

    if (cronSecret) {
      const { data: segredo } = await admin
        .from('integration_secrets')
        .select('valor')
        .eq('chave', 'conformidade_cron')
        .maybeSingle();
      autorizado = Boolean(segredo?.valor) && segredo?.valor === cronSecret;
      if (!autorizado) return json({ error: 'Não autorizado' }, 401);
    }

    if (!autorizado) {
      const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
      if (!jwt) return json({ error: 'Não autorizado' }, 401);
      const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
      if (userErr || !userData.user) return json({ error: 'Não autorizado' }, 401);
      const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
        _user_id: userData.user.id,
        _role: 'admin',
      });
      if (roleErr) return json({ error: 'Falha ao validar papel', details: roleErr.message }, 500);
      if (isAdmin !== true) return json({ error: 'Requer papel admin' }, 403);
      autorizado = true;
    }

    // ---- Entrada -----------------------------------------------------------
    const raw = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const parsed = BodySchema.safeParse(raw ?? {});
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { empresaId, competencia, severidadeMinima, dryRun, limite } = parsed.data;

    // ---- Alertas pendentes -------------------------------------------------
    let query = admin
      .from('alertas_tributarios')
      .select('id,empresa_id,tipo,prioridade,titulo,mensagem,descricao,valor,created_at')
      .like('tipo', `${PREFIXO_ALERTA}:%`)
      .eq('status', 'pendente')
      .eq('resolvido', false)
      .order('created_at', { ascending: false })
      .limit(limite);
    if (empresaId) query = query.eq('empresa_id', empresaId);

    const { data: linhas, error: alertasErr } = await query;
    if (alertasErr) {
      return json({ error: 'Falha ao ler alertas', details: alertasErr.message }, 500);
    }

    const relevantes = (linhas ?? []).filter(
      (l) => PESO[String(l.prioridade ?? 'baixa')] <= PESO[severidadeMinima],
    );

    if (relevantes.length === 0) {
      return json({ success: true, enviados: 0, motivo: 'nenhum alerta pendente' });
    }

    // ---- Nomes das empresas (uma consulta, sem N+1) ------------------------
    const ids = [...new Set(relevantes.map((l) => l.empresa_id).filter(Boolean))] as string[];
    const nomes = new Map<string, string>();
    if (ids.length > 0) {
      const { data: empresas } = await admin
        .from('empresas')
        .select('id,razao_social')
        .in('id', ids);
      for (const e of empresas ?? []) nomes.set(e.id as string, (e.razao_social as string) ?? '');
    }

    const alertas: AlertaDigest[] = relevantes.map((l) => {
      const tipo = String(l.tipo ?? '').split(':');
      return {
        empresaId: String(l.empresa_id ?? 'sem-empresa'),
        empresaNome: nomes.get(String(l.empresa_id)) || 'Empresa não identificada',
        tipo: tipo[1] ?? 'score_baixo',
        severidade: String(l.prioridade ?? 'baixa'),
        competencia: tipo[2] ?? (competencia ?? ''),
        titulo: String(l.titulo ?? 'Alerta de conformidade'),
        mensagem: String(l.mensagem ?? l.descricao ?? ''),
        valor: l.valor === null || l.valor === undefined ? null : Number(l.valor),
      };
    });

    // ---- Etapa R: planejamento por preferências de usuário -----------------
    // Se o chamador passou destinatários explícitos, mantemos o comportamento
    // legado (um único digest para todos). Caso contrário, cada usuário recebe
    // um digest recortado pelas suas preferências.
    const explicitos = parsed.data.destinatarios ?? [];
    const agora = new Date();
    // Converte o instante UTC para os campos de calendário do fuso brasileiro
    // usando `en-CA` (formato ISO estável) — evita depender do locale do runtime.
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(agora);
    const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
    const SEMANA = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const anoLocal = Number(parte('year'));
    const mesLocal = Number(parte('month'));
    const contexto = {
      diaSemana: Math.max(0, SEMANA.indexOf(parte('weekday'))),
      diaMes: Number(parte('day')),
      hora: Number(parte('hour')) % 24,
      toleranciaHoras: 2,
      ultimoDiaDoMes: new Date(Date.UTC(anoLocal, mesLocal, 0)).getUTCDate(),
    };


    interface Envio {
      readonly email: string;
      readonly userId: string | null;
      readonly alertas: AlertaDigest[];
      readonly hash: string;
    }

    let envios: Envio[] = [];
    let ignorados: readonly { userId: string; motivo: string }[] = [];

    if (explicitos.length > 0 || forcarGlobal) {
      let destinatarios = explicitos;
      if (destinatarios.length === 0) {
        destinatarios = await destinatariosAdmin(admin);
      }
      const hash = hashAlertas(alertas);
      envios = destinatarios.map((email) => ({ email, userId: null, alertas, hash }));
    } else {
      const { data: prefsRaw, error: prefsErr } = await admin
        .from('user_digest_preferences')
        .select('user_id,ativo,frequencia,dia_semana,dia_mes,hora_envio,severidade_minima,tipos_ignorados,empresas_filtro,email_alternativo,max_alertas,ultimo_hash')
        .eq('ativo', true);
      if (prefsErr) {
        return json({ error: 'Falha ao ler preferências', details: prefsErr.message }, 500);
      }

      // Resolve o e-mail: `email_alternativo` tem precedência sobre o perfil.
      const userIds = (prefsRaw ?? []).map((p) => String(p.user_id));
      const emailsPerfil = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: perfis } = await admin
          .from('profiles')
          .select('user_id,email')
          .in('user_id', userIds);
        for (const p of perfis ?? []) {
          if (p.email) emailsPerfil.set(String(p.user_id), String(p.email));
        }
      }

      const comEmail = (prefsRaw ?? []).map((p) => ({
        ...p,
        email: p.email_alternativo ?? emailsPerfil.get(String(p.user_id)) ?? null,
      }));

      const plano = planejarEnvios(comEmail, alertas, contexto);
      ignorados = plano.ignorados;
      envios = plano.envios.map((e) => ({
        email: e.email,
        userId: e.preferencia.userId,
        alertas: [...e.alertas],
        hash: e.hash,
      }));

      // Fallback seguro: se ninguém configurou preferências ainda, o digest não
      // pode simplesmente sumir — cai para os administradores.
      if ((prefsRaw ?? []).length === 0) {
        const destinatarios = await destinatariosAdmin(admin);
        const hash = hashAlertas(alertas);
        envios = destinatarios.map((email) => ({ email, userId: null, alertas, hash }));
      }
    }

    if (dryRun) {
      return json({
        success: true,
        dryRun: true,
        contexto,
        ignorados,
        envios: envios.map((e) => ({
          email: e.email,
          totalAlertas: e.alertas.length,
          hash: e.hash,
          assunto: construirDigest(e.alertas, { competenciaReferencia: competencia }).assunto,
        })),
      });
    }

    if (envios.length === 0) {
      return json({ success: true, enviados: 0, motivo: 'nenhum destinatário elegível', ignorados });
    }

    // ---- Envio -------------------------------------------------------------
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const simulado = !resendKey;
    const idsEnviados = new Set<string>();
    const falhas: { email: string; detalhe: string }[] = [];
    const idPorChave = new Map<string, string>();
    for (const l of relevantes) {
      idPorChave.set(
        `${String(l.empresa_id)}|${String(l.tipo)}|${String(l.titulo)}`,
        String(l.id),
      );
    }

    for (const envio of envios) {
      const digest = construirDigest(envio.alertas, {
        remetenteNome: 'Hub Tributário',
        urlBase: Deno.env.get('APP_PUBLIC_URL') ?? undefined,
        competenciaReferencia: competencia,
      });

      if (!simulado) {
        const resposta = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM') ?? 'Hub Tributário <onboarding@resend.dev>',
            to: [envio.email],
            subject: digest.assunto,
            html: digest.html,
            text: digest.texto,
          }),
        });
        if (!resposta.ok) {
          // Falha individual não derruba o lote: os alertas deste destinatário
          // simplesmente não são marcados e voltam no próximo ciclo.
          falhas.push({ email: envio.email, detalhe: (await resposta.text()).slice(0, 200) });
          continue;
        }
      }

      for (const a of envio.alertas) {
        const id = idPorChave.get(`${a.empresaId}|${PREFIXO_ALERTA}:${a.tipo}:${a.competencia}|${a.titulo}`)
          ?? idPorChave.get(`${a.empresaId}|${PREFIXO_ALERTA}:${a.tipo}|${a.titulo}`);
        if (id) idsEnviados.add(id);
      }

      if (envio.userId) {
        await admin
          .from('user_digest_preferences')
          .update({ ultimo_envio_em: new Date().toISOString(), ultimo_hash: envio.hash })
          .eq('user_id', envio.userId);
      }
    }

    // ---- Idempotência: marca somente o que foi efetivamente enviado --------
    if (idsEnviados.size > 0) {
      const { error: updErr } = await admin
        .from('alertas_tributarios')
        .update({ status: STATUS_NOTIFICADO })
        .in('id', [...idsEnviados]);
      if (updErr) {
        return json(
          { error: 'E-mail enviado, mas falhou ao marcar alertas', details: updErr.message },
          500,
        );
      }
    }

    return json({
      success: falhas.length === 0,
      simulado,
      enviados: envios.length - falhas.length,
      alertasMarcados: idsEnviados.size,
      falhas,
      ignorados,
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido';
    return json({ error: 'Erro inesperado', details: mensagem }, 500);
  }
});

