-- Gate #28 — Superfície de execução de funções SECURITY DEFINER
-- 1) Guard de autorização dentro da auditoria de acessos cross-tenant.
CREATE OR REPLACE FUNCTION public.auditar_acessos_cross_tenant(_horas integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_ini timestamptz := date_trunc('hour', now()) - make_interval(hours => GREATEST(_horas, 1));
  v_fim timestamptz := date_trunc('hour', now());
  v_hour timestamptz := date_trunc('hour', now());
  v_cross int := 0;
  v_pico int := 0;
  v_noturno int := 0;
  v_delecao int := 0;
BEGIN
  -- Gate #28: somente admins autenticados ou processos internos (pg_cron/service_role).
  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar a auditoria de acessos.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtext('auditar_acessos_cross_tenant')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  -- A) Acesso a registros de empresa da qual o usuário não é membro ativo
  WITH base AS (
    SELECT a.user_id,
           max(a.user_email) AS user_email,
           NULLIF(COALESCE(a.new_data->>'empresa_id', a.old_data->>'empresa_id'), '')::uuid AS empresa_id,
           a.table_name,
           count(*) AS ocorrencias,
           jsonb_agg(DISTINCT a.action) AS acoes
    FROM public.audit_logs a
    WHERE a.created_at >= v_ini AND a.created_at < v_fim
      AND a.user_id IS NOT NULL
      AND COALESCE(a.new_data->>'empresa_id', a.old_data->>'empresa_id') IS NOT NULL
    GROUP BY 1, 3, 4
  ), viol AS (
    SELECT b.* FROM base b
    WHERE b.empresa_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = b.user_id AND ue.empresa_id = b.empresa_id AND COALESCE(ue.ativo, true)
      )
  ), ins AS (
    INSERT INTO public.acessos_suspeitos
      (tipo, severidade, janela_inicio, janela_fim, user_id, user_email, empresa_id, table_name, ocorrencias, detalhes)
    SELECT 'cross_tenant',
           CASE WHEN ocorrencias >= 10 THEN 'critical' ELSE 'warning' END,
           v_ini, v_fim, user_id, user_email, empresa_id, table_name, ocorrencias,
           jsonb_build_object('acoes', acoes)
    FROM viol
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_cross FROM ins;

  -- B) Pico de atividade administrativa vs baseline de 7 dias
  WITH admins AS (
    SELECT DISTINCT user_id FROM public.user_roles WHERE role = 'admin'
  ), atual AS (
    SELECT a.user_id, max(a.user_email) AS user_email, count(*) AS ocorrencias
    FROM public.audit_logs a
    JOIN admins ad ON ad.user_id = a.user_id
    WHERE a.created_at >= v_ini AND a.created_at < v_fim
    GROUP BY 1
  ), base AS (
    SELECT a.user_id, count(*)::numeric / (7 * 24) AS media_hora
    FROM public.audit_logs a
    JOIN admins ad ON ad.user_id = a.user_id
    WHERE a.created_at >= v_ini - interval '7 days' AND a.created_at < v_ini
    GROUP BY 1
  ), ins AS (
    INSERT INTO public.acessos_suspeitos
      (tipo, severidade, janela_inicio, janela_fim, user_id, user_email, ocorrencias, baseline, detalhes)
    SELECT 'admin_pico',
           CASE WHEN at.ocorrencias >= GREATEST(COALESCE(b.media_hora,0) * 10, 200) THEN 'critical' ELSE 'warning' END,
           v_ini, v_fim, at.user_id, at.user_email, at.ocorrencias, ROUND(COALESCE(b.media_hora, 0), 2),
           jsonb_build_object('fator', ROUND(at.ocorrencias / NULLIF(COALESCE(b.media_hora, 0), 0), 2))
    FROM atual at
    LEFT JOIN base b ON b.user_id = at.user_id
    WHERE at.ocorrencias >= 20
      AND at.ocorrencias >= GREATEST(COALESCE(b.media_hora, 0) * 3, 20)
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_pico FROM ins;

  -- C) Atividade administrativa em madrugada (00h-05h America/Sao_Paulo)
  WITH admins AS (
    SELECT DISTINCT user_id FROM public.user_roles WHERE role = 'admin'
  ), noturno AS (
    SELECT a.user_id, max(a.user_email) AS user_email, count(*) AS ocorrencias
    FROM public.audit_logs a
    JOIN admins ad ON ad.user_id = a.user_id
    WHERE a.created_at >= v_ini AND a.created_at < v_fim
      AND EXTRACT(HOUR FROM (a.created_at AT TIME ZONE 'America/Sao_Paulo')) < 5
    GROUP BY 1
  ), ins AS (
    INSERT INTO public.acessos_suspeitos
      (tipo, severidade, janela_inicio, janela_fim, user_id, user_email, ocorrencias, detalhes)
    SELECT 'admin_fora_horario', CASE WHEN ocorrencias >= 50 THEN 'critical' ELSE 'warning' END,
           v_ini, v_fim, user_id, user_email, ocorrencias,
           jsonb_build_object('janela', '00h-05h America/Sao_Paulo')
    FROM noturno WHERE ocorrencias >= 10
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_noturno FROM ins;

  -- D) Exclusões em massa
  WITH del AS (
    SELECT a.user_id, max(a.user_email) AS user_email, a.table_name, count(*) AS ocorrencias
    FROM public.audit_logs a
    WHERE a.created_at >= v_ini AND a.created_at < v_fim
      AND upper(a.action) LIKE 'DELETE%'
    GROUP BY 1, 3
  ), ins AS (
    INSERT INTO public.acessos_suspeitos
      (tipo, severidade, janela_inicio, janela_fim, user_id, user_email, table_name, ocorrencias, detalhes)
    SELECT 'delecao_massa', CASE WHEN ocorrencias >= 100 THEN 'critical' ELSE 'warning' END,
           v_ini, v_fim, user_id, user_email, table_name, ocorrencias, '{}'::jsonb
    FROM del WHERE ocorrencias >= 25
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_delecao FROM ins;

  -- E) Consolidar em integrity_alerts para o painel/escalonamento existente
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, metadata)
  SELECT 'seguranca_acesso', s.tipo,
         CASE WHEN bool_or(s.severidade = 'critical') THEN 'critical' ELSE 'warning' END,
         v_hour, count(*),
         format('%s achado(s) de %s na janela %s', count(*), s.tipo, to_char(v_ini, 'DD/MM HH24:MI')),
         jsonb_build_object('janela_inicio', v_ini, 'janela_fim', v_fim)
  FROM public.acessos_suspeitos s
  WHERE s.janela_inicio = v_ini
  GROUP BY s.tipo
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count,
        severity = EXCLUDED.severity,
        reason = EXCLUDED.reason,
        metadata = EXCLUDED.metadata;

  RETURN jsonb_build_object(
    'success', true,
    'janela_inicio', v_ini, 'janela_fim', v_fim,
    'cross_tenant', v_cross, 'admin_pico', v_pico,
    'admin_fora_horario', v_noturno, 'delecao_massa', v_delecao
  );
END;
$function$;

-- 2) Rotina de manutenção pesada: apenas processos internos.
REVOKE ALL ON FUNCTION public.backfill_empresa_id(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_empresa_id(boolean) TO service_role;

-- 3) Funções de gatilho não precisam de EXECUTE para roles do app.
REVOKE ALL ON FUNCTION public.empresas_unica_padrao() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_empresa_id_default() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_empresa_id_from_profile() FROM PUBLIC, anon, authenticated;

-- 4) Helper de tenant: somente usuários autenticados (usado em policies RLS).
REVOKE ALL ON FUNCTION public.empresa_padrao_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_padrao_id() TO authenticated, service_role;