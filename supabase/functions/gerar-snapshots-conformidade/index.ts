/**
 * Etapa L — Geração automática dos snapshots de conformidade fiscal.
 *
 * Executada mensalmente por `pg_cron` (e sob demanda por administradores),
 * a função materializa o calendário de obrigações acessórias de cada empresa
 * ativa, cruza com as entregas persistidas em `entregas_obrigacoes` e grava a
 * fotografia do score em `conformidade_snapshots` (upsert idempotente pela
 * constraint única empresa_id + competencia).
 *
 * Autorização (uma das duas):
 *  - header `x-cron-secret` igual ao service role (uso interno do pg_cron);
 *  - JWT de usuário com papel `admin`.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { corsHeaders } from "../_shared/cors.ts";
import { z } from 'npm:zod@3.23.8';

import { gerarCalendario, competenciasAoRedor } from '../_shared/obrigacoes/calendario.ts';
import { calcularConformidade, type RegistroEntrega } from '../_shared/obrigacoes/conformidade.ts';
import {
  avaliarAlertasConformidade,
  type AlertaConformidade,
  type PontoHistorico,
} from '../_shared/obrigacoes/alertas.ts';
import type { RegimeAplicavel } from '../_shared/obrigacoes/types.ts';

/** Prefixo usado na coluna `tipo` para deduplicar alertas de conformidade. */
const PREFIXO_ALERTA = 'conformidade';

/** Mapeia a severidade do motor para a coluna `prioridade`. */
const PRIORIDADE: Record<AlertaConformidade['severidade'], string> = {
  critica: 'critica',
  alta: 'alta',
  media: 'media',
  baixa: 'baixa',
};


const BodySchema = z.object({
  /** Competências AAAA-MM a recalcular. Se ausente, usa as últimas `meses`. */
  competencias: z.array(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)).max(24).optional(),
  /** Quantidade de competências retroativas quando `competencias` não é informado. */
  meses: z.number().int().min(1).max(24).default(3),
  /** Restringe a execução a uma empresa. */
  empresaId: z.string().uuid().optional(),
  /** Regime considerado no calendário (default: catálogo completo do Lucro Real). */
  regime: z.enum(['simples', 'presumido', 'real', 'todos']).default('real'),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/** Últimas `n` competências mensais já encerradas, da mais antiga para a mais recente. */
function ultimasCompetencias(hojeISO: string, n: number): string[] {
  const base = hojeISO.slice(0, 7);
  // -1 desloca para o mês anterior (competência fechada).
  return competenciasAoRedor(base, n, 0).slice(0, n);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Ambiente incompleto' }, 500);

  try {
    // ---- Autorização -------------------------------------------------------
    const cronSecret = req.headers.get('x-cron-secret');
    let autorizado = false;
    let geradoPor: string | null = null;

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    if (cronSecret) {
      // Segredo do cron vive em `integration_secrets` (sem policies → só service_role).
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
      geradoPor = userData.user.id;
    }

    // ---- Entrada -----------------------------------------------------------
    let raw: unknown = {};
    if (req.method === 'POST') {
      raw = await req.json().catch(() => ({}));
    }
    const parsed = BodySchema.safeParse(raw ?? {});
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { meses, empresaId, regime } = parsed.data;

    const hoje = new Date().toISOString().slice(0, 10);
    const competencias =
      parsed.data.competencias && parsed.data.competencias.length > 0
        ? [...parsed.data.competencias].sort()
        : ultimasCompetencias(hoje, meses);

    // ---- Empresas em escopo ------------------------------------------------
    let empresasQuery = admin.from('empresas').select('id,razao_social').eq('ativo', true);
    if (empresaId) empresasQuery = empresasQuery.eq('id', empresaId);
    const { data: empresas, error: empErr } = await empresasQuery;
    if (empErr) return json({ error: 'Falha ao listar empresas', details: empErr.message }, 500);

    const resultados: Array<{
      empresaId: string;
      competencia: string;
      score: number;
      nivel: string;
    }> = [];
    const falhas: Array<{ empresaId: string; erro: string }> = [];
    let alertasCriados = 0;

    for (const empresa of empresas ?? []) {
      try {
        const { data: entregas, error: entErr } = await admin
          .from('entregas_obrigacoes')
          .select('obrigacao_id,competencia,status,data_entrega,valor_multa')
          .eq('empresa_id', empresa.id)
          .in('competencia', competencias);
        if (entErr) throw new Error(entErr.message);

        const registros: RegistroEntrega[] = (entregas ?? []).map((e) => ({
          obrigacaoId: e.obrigacao_id as string,
          competencia: e.competencia as string,
          status: e.status as RegistroEntrega['status'],
          dataEntrega: (e.data_entrega as string | null) ?? null,
          valorMulta: Number(e.valor_multa ?? 0),
        }));

        const linhas = competencias.map((competencia) => {
          const itens = gerarCalendario({
            competencias: [competencia],
            regime: regime as RegimeAplicavel,
            hoje,
          });
          const r = calcularConformidade(
            itens,
            registros.filter((x) => x.competencia === competencia),
          );
          resultados.push({
            empresaId: empresa.id as string,
            competencia,
            score: r.score,
            nivel: r.nivel,
          });
          return {
            empresa_id: empresa.id as string,
            competencia,
            score: r.score,
            nivel: r.nivel,
            total_obrigacoes: r.total,
            entregues: r.entregues + r.dispensadas,
            vencidas_pendentes: r.vencidasPendentes,
            entregues_com_atraso: r.entreguesComAtraso,
            pontualidade: r.pontualidade,
            multa_registrada: r.multaRegistrada,
            gerado_por: geradoPor,
          };
        });

        const { error: upErr } = await admin
          .from('conformidade_snapshots')
          .upsert(linhas, { onConflict: 'empresa_id,competencia' });
        if (upErr) throw new Error(upErr.message);

        // ---- Etapa N: alertas automáticos sobre o histórico ------------------
        // Relê a série completa persistida (inclui competências antigas) para
        // que tendência e multa acumulada considerem todo o histórico, não só
        // as competências recalculadas nesta execução.
        const { data: hist, error: histErr } = await admin
          .from('conformidade_snapshots')
          .select(
            'competencia,score,nivel,total_obrigacoes,entregues,vencidas_pendentes,entregues_com_atraso,pontualidade,multa_registrada',
          )
          .eq('empresa_id', empresa.id)
          .order('competencia', { ascending: false })
          .limit(12);
        if (histErr) throw new Error(histErr.message);

        const serie: PontoHistorico[] = (hist ?? [])
          .map((s) => ({
            competencia: s.competencia as string,
            score: Number(s.score),
            nivel: s.nivel as PontoHistorico['nivel'],
            total: Number(s.total_obrigacoes),
            entregues: Number(s.entregues),
            vencidasPendentes: Number(s.vencidas_pendentes),
            entreguesComAtraso: Number(s.entregues_com_atraso),
            pontualidade: Number(s.pontualidade),
            multaRegistrada: Number(s.multa_registrada),
          }))
          .sort((a, b) => (a.competencia < b.competencia ? -1 : 1));

        const alertas = avaliarAlertasConformidade(serie);
        if (alertas.length > 0) {
          const tipos = alertas.map((a) => `${PREFIXO_ALERTA}:${a.chave}`);
          // Deduplicação idempotente: `tipo` carrega a chave determinística.
          const { data: existentes, error: exErr } = await admin
            .from('alertas_tributarios')
            .select('tipo')
            .eq('empresa_id', empresa.id)
            .in('tipo', tipos);
          if (exErr) throw new Error(exErr.message);

          const jaExiste = new Set((existentes ?? []).map((r) => r.tipo as string));
          const novos = alertas
            .filter((a) => !jaExiste.has(`${PREFIXO_ALERTA}:${a.chave}`))
            .map((a) => ({
              empresa_id: empresa.id as string,
              tipo: `${PREFIXO_ALERTA}:${a.chave}`,
              titulo: a.titulo,
              descricao: a.mensagem,
              mensagem: a.mensagem,
              prioridade: PRIORIDADE[a.severidade],
              valor: a.valor,
              status: 'pendente',
              lido: false,
              resolvido: false,
            }));

          if (novos.length > 0) {
            const { error: insErr } = await admin.from('alertas_tributarios').insert(novos);
            if (insErr) throw new Error(insErr.message);
            alertasCriados += novos.length;
          }
        }
      } catch (e) {
        falhas.push({ empresaId: empresa.id as string, erro: (e as Error).message });
      }
    }

    return json({
      ok: falhas.length === 0,
      hoje,
      competencias,
      empresasProcessadas: (empresas ?? []).length - falhas.length,
      snapshots: resultados.length,
      alertasCriados,
      falhas,
    });

  } catch (e) {
    console.error('gerar-snapshots-conformidade falhou:', (e as Error).message);
    return json({ error: 'Erro interno', details: (e as Error).message }, 500);
  }
});
