-- SECAO 1: Funcoes ausentes (128)

CREATE OR REPLACE FUNCTION public.auditar_acessos_cross_tenant(_horas integer DEFAULT 1) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.backfill_empresa_id(_dry_run boolean DEFAULT false) RETURNS TABLE(tabela text, estrategia text, registros_ajustados bigint, pendentes bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_empresa_padrao uuid;
  v_total_empresas int;
  v_n bigint;
  v_p bigint;
  r record;
  v_fks CONSTANT text[][] := ARRAY[
    ARRAY['parcelas_acordo',          'acordos_parcelamento', 'acordo_id'],
    ARRAY['asaas_audit_trail',        'asaas_payments',       'payment_id'],
    ARRAY['asaas_sync_queue',         'asaas_payments',       'payment_id'],
    ARRAY['regua_cobranca_etapas',    'regua_cobranca',       'regua_id'],
    ARRAY['itens_pedido_compra',      'pedidos_compra',       'pedido_id'],
    ARRAY['partidas_contabeis',       'lancamentos_contabeis','lancamento_id']
  ];
  v_diretas CONSTANT text[] := ARRAY[
    'contas_pagar','contas_receber','boletos','darfs','clientes','vendedores',
    'movimentacoes','lancamentos_contabeis','plano_contas','centros_custo',
    'contas_bancarias','notas_fiscais','nfe_recebidas','operacoes_tributaveis',
    'apuracoes_tributarias','creditos_tributarios','retencoes_fonte',
    'acordos_parcelamento','negativacoes','protestos','transferencias',
    'conciliacoes','sessoes_conciliacao','divergencias_conciliacao',
    'asaas_payments','asaas_customers','asaas_transfers',
    'auditoria_financeira','auditoria_tributaria','tax_audit_trail',
    'alertas_tributarios','contratos','pedidos_compra','categorias'
  ];
BEGIN
  IF NOT (
       coalesce(public.has_role(auth.uid(), 'admin'), false)
       OR coalesce(auth.role(), '') = 'service_role'
       OR current_user IN ('postgres','supabase_admin')
     ) THEN
    RAISE EXCEPTION 'backfill_empresa_id: acesso restrito a administradores';
  END IF;

  SELECT count(*) INTO v_total_empresas FROM public.empresas;
  IF v_total_empresas = 1 THEN
    SELECT id INTO v_empresa_padrao FROM public.empresas LIMIT 1;
  END IF;

  FOR r IN SELECT v_fks[i][1] AS filha, v_fks[i][2] AS pai, v_fks[i][3] AS fk
             FROM generate_subscripts(v_fks, 1) AS i
  LOOP
    CONTINUE WHEN to_regclass('public.' || r.filha) IS NULL;
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=r.filha AND column_name='empresa_id');

    IF _dry_run THEN
      EXECUTE format(
        'SELECT count(*) FROM public.%I f JOIN public.%I p ON p.id = f.%I
          WHERE f.empresa_id IS NULL AND p.empresa_id IS NOT NULL',
        r.filha, r.pai, r.fk) INTO v_n;
    ELSE
      EXECUTE format(
        'WITH upd AS (
           UPDATE public.%I f SET empresa_id = p.empresa_id
             FROM public.%I p
            WHERE p.id = f.%I AND f.empresa_id IS NULL AND p.empresa_id IS NOT NULL
          RETURNING 1)
         SELECT count(*) FROM upd', r.filha, r.pai, r.fk) INTO v_n;
    END IF;

    EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.filha) INTO v_p;

    tabela := r.filha; estrategia := 'fk:' || r.pai;
    registros_ajustados := v_n; pendentes := v_p;
    RETURN NEXT;
  END LOOP;

  FOR r IN SELECT unnest(v_diretas) AS t LOOP
    CONTINUE WHEN to_regclass('public.' || r.t) IS NULL;
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=r.t AND column_name='empresa_id');

    v_n := 0;
    IF v_empresa_padrao IS NOT NULL AND NOT _dry_run THEN
      EXECUTE format(
        'WITH upd AS (
           UPDATE public.%I SET empresa_id = $1 WHERE empresa_id IS NULL RETURNING 1)
         SELECT count(*) FROM upd', r.t) USING v_empresa_padrao INTO v_n;
    ELSIF v_empresa_padrao IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.t) INTO v_n;
    END IF;

    EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.t) INTO v_p;

    tabela := r.t;
    estrategia := CASE WHEN v_empresa_padrao IS NOT NULL
                       THEN 'empresa_unica' ELSE 'skip:multiplas_empresas' END;
    registros_ajustados := v_n; pendentes := v_p;
    RETURN NEXT;
  END LOOP;
END;
$_$;

CREATE OR REPLACE FUNCTION public.calcular_potencial_elisao(p_empresa_id uuid) RETURNS TABLE(tipo_oportunidade text, descricao text, valor_estimado numeric, ncm_relacionado text)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT 'oportunidade_elisao'::TEXT,
         COALESCE(o.categoria, o.estrategia),
         o.economia_estimada,
         NULL::TEXT
  FROM public.oportunidades_elisao o
  WHERE o.empresa_id = p_empresa_id
    AND o.aplicavel
    AND o.status <> 'descartada'
  UNION ALL
  SELECT 'credito_tributario'::TEXT,
         COALESCE(c.metodologia_aplicada, 'Crédito identificado em auditoria'),
         c.valor_credito_calculado,
         c.ncm
  FROM public.elisao_creditos_auditoria c
  WHERE c.empresa_id = p_empresa_id
    AND c.status_aprovacao = 'aprovado';
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.capture_index_usage_snapshot() CASCADE;
CREATE OR REPLACE FUNCTION public.capture_index_usage_snapshot() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_linhas integer;
BEGIN
  INSERT INTO public.index_usage_snapshots (
    snapshot_date, schema_name, table_name, index_name,
    idx_scan, size_bytes, is_unique, is_primary
  )
  SELECT CURRENT_DATE,
         s.schemaname,
         s.relname,
         s.indexrelname,
         s.idx_scan,
         pg_relation_size(s.indexrelid),
         i.indisunique,
         i.indisprimary
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON i.indexrelid = s.indexrelid
  WHERE s.schemaname = 'public'
  ON CONFLICT (snapshot_date, schema_name, index_name) DO UPDATE
    SET idx_scan = EXCLUDED.idx_scan,
        size_bytes = EXCLUDED.size_bytes;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;

  DELETE FROM public.index_usage_snapshots
  WHERE snapshot_date < CURRENT_DATE - INTERVAL '180 days';

  RETURN v_linhas;
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_pg_stat_statements_baseline(p_label text) RETURNS TABLE(captured_rows bigint, label text, captured_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_captured_at TIMESTAMPTZ := now();
  v_count BIGINT;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.pg_stat_statements_baseline (
    label, queryid, query, calls, total_exec_time, mean_exec_time,
    max_exec_time, rows, shared_blks_hit, shared_blks_read, captured_at
  )
  SELECT p_label, s.queryid, LEFT(s.query, 2000), s.calls, s.total_exec_time,
         s.mean_exec_time, s.max_exec_time, s.rows, s.shared_blks_hit,
         s.shared_blks_read, v_captured_at
  FROM extensions.pg_stat_statements s
  WHERE s.dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
    AND s.query NOT ILIKE '%pg_stat_statements%';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count, p_label, v_captured_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_slow_queries(threshold_ms numeric DEFAULT 500) RETURNS TABLE(captured integer, deleted_old integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog', 'extensions'
    AS $$
DECLARE
  v_captured INTEGER := 0;
  v_deleted INTEGER := 0;
  v_has_pgss BOOLEAN;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtext('capture_slow_queries')) THEN
    RETURN QUERY SELECT 0, 0; RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') INTO v_has_pgss;
  IF NOT v_has_pgss THEN
    RETURN QUERY SELECT 0, 0; RETURN;
  END IF;

  DELETE FROM public.slow_query_alerts WHERE captured_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  WITH slow AS (
    SELECT s.queryid, LEFT(regexp_replace(s.query, '\s+', ' ', 'g'), 2000) AS query_normalized,
           s.calls, ROUND(s.mean_exec_time::numeric, 3) AS mean_exec_ms,
           ROUND(s.total_exec_time::numeric, 3) AS total_exec_ms,
           ROUND(s.max_exec_time::numeric, 3) AS max_exec_ms,
           s.rows AS rows_returned,
           CASE WHEN s.mean_exec_time >= 2000 THEN 'critical'
                WHEN s.mean_exec_time >= 1000 THEN 'warning'
                ELSE 'info' END AS severity
    FROM extensions.pg_stat_statements s
    WHERE s.mean_exec_time >= threshold_ms
      AND s.query !~* '^\s*(EXPLAIN|SET|SHOW|BEGIN|COMMIT|ROLLBACK|DEALLOCATE)'
      AND s.query !~* 'pg_stat_statements|capture_slow_queries'
    ORDER BY s.mean_exec_time DESC LIMIT 20
  ), ins AS (
    INSERT INTO public.slow_query_alerts (
      queryid, query_normalized, calls, mean_exec_ms,
      total_exec_ms, max_exec_ms, rows_returned, severity
    )
    SELECT queryid, query_normalized, calls, mean_exec_ms,
           total_exec_ms, max_exec_ms, rows_returned, severity FROM slow
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_captured FROM ins;

  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  SELECT 'slow_query_capture', 'pg_stat_statements',
         LEAST(mean_exec_ms::integer, 2147483647), severity,
         LEFT(query_normalized, 500), now()
  FROM public.slow_query_alerts
  WHERE captured_at > now() - INTERVAL '1 minute'
    AND severity IN ('warning','critical');

  RETURN QUERY SELECT v_captured, v_deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.certificado_get_password(p_cert_id uuid, p_master_key text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_pwd TEXT;
BEGIN
  SELECT extensions.pgp_sym_decrypt(password_encrypted, p_master_key)
    INTO v_pwd
    FROM public.empresas_certificados
    WHERE id = p_cert_id;
  RETURN v_pwd;
END $$;

CREATE OR REPLACE FUNCTION public.certificado_upsert(p_empresa_id uuid, p_cnpj text, p_razao_social text, p_pfx_storage_path text, p_password text, p_master_key text, p_valido_de timestamp with time zone, p_valido_ate timestamp with time zone, p_ambiente public.sefaz_ambiente, p_uf text, p_criado_por uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.empresas_certificados (
    empresa_id, cnpj, razao_social, pfx_storage_path, password_encrypted,
    valido_de, valido_ate, ambiente, uf, criado_por, ativo
  ) VALUES (
    p_empresa_id, p_cnpj, p_razao_social, p_pfx_storage_path,
    extensions.pgp_sym_encrypt(p_password, p_master_key),
    p_valido_de, p_valido_ate, p_ambiente, p_uf, p_criado_por, TRUE
  )
  ON CONFLICT (empresa_id, cnpj, ambiente) DO UPDATE SET
    razao_social = EXCLUDED.razao_social,
    pfx_storage_path = EXCLUDED.pfx_storage_path,
    password_encrypted = EXCLUDED.password_encrypted,
    valido_de = EXCLUDED.valido_de,
    valido_ate = EXCLUDED.valido_ate,
    uf = EXCLUDED.uf,
    ativo = TRUE,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.check_login_lockout(p_email text) RETURNS TABLE(is_locked boolean, remaining_seconds integer, attempt_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_record login_attempts%ROWTYPE;
BEGIN
  SELECT * INTO v_record
  FROM login_attempts
  WHERE email = lower(p_email)
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  -- Reset if first attempt was more than 24 hours ago
  IF v_record.first_attempt_at < now() - interval '24 hours' THEN
    DELETE FROM login_attempts WHERE email = lower(p_email);
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  -- Check if currently locked
  IF v_record.locked_until IS NOT NULL AND v_record.locked_until > now() THEN
    RETURN QUERY SELECT 
      true,
      EXTRACT(EPOCH FROM (v_record.locked_until - now()))::integer,
      v_record.attempt_count;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 0, v_record.attempt_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_login_lockout_v2(p_email text, p_ip_address inet DEFAULT NULL::inet) RETURNS TABLE(is_locked boolean, remaining_seconds integer, attempt_count integer, is_ip_blocked boolean, block_reason text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_record login_attempts%ROWTYPE;
  v_ip_blocked blocked_ips%ROWTYPE;
  v_ip_attempts integer;
BEGIN
  -- Verificar se IP está bloqueado permanentemente ou temporariamente
  IF p_ip_address IS NOT NULL THEN
    SELECT * INTO v_ip_blocked
    FROM blocked_ips
    WHERE ip_address = p_ip_address
      AND (is_permanent = true OR expires_at > now());
    
    IF v_ip_blocked IS NOT NULL THEN
      RETURN QUERY SELECT 
        true,
        CASE WHEN v_ip_blocked.is_permanent THEN 86400 
             ELSE EXTRACT(EPOCH FROM (v_ip_blocked.expires_at - now()))::integer 
        END,
        0,
        true,
        v_ip_blocked.reason;
      RETURN;
    END IF;
    
    -- Verificar rate limit por IP (máximo 20 tentativas em 1 hora)
    SELECT COUNT(*) INTO v_ip_attempts
    FROM login_attempts
    WHERE ip_address = p_ip_address
      AND last_attempt_at > now() - interval '1 hour';
    
    IF v_ip_attempts >= 20 THEN
      -- Bloquear IP temporariamente
      INSERT INTO blocked_ips (ip_address, reason, expires_at)
      VALUES (p_ip_address, 'Excesso de tentativas de login', now() + interval '1 hour')
      ON CONFLICT (ip_address) DO UPDATE SET
        expires_at = now() + interval '1 hour',
        attempts_count = blocked_ips.attempts_count + 1;
      
      RETURN QUERY SELECT true, 3600, v_ip_attempts, true, 'IP bloqueado por excesso de tentativas'::text;
      RETURN;
    END IF;
  END IF;

  -- Verificar lockout por email
  SELECT * INTO v_record
  FROM login_attempts
  WHERE email = lower(p_email)
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, false, NULL::text;
    RETURN;
  END IF;

  -- Reset se primeira tentativa foi há mais de 24 horas
  IF v_record.first_attempt_at < now() - interval '24 hours' THEN
    DELETE FROM login_attempts WHERE email = lower(p_email);
    RETURN QUERY SELECT false, 0, 0, false, NULL::text;
    RETURN;
  END IF;

  -- Verificar se está bloqueado
  IF v_record.locked_until IS NOT NULL AND v_record.locked_until > now() THEN
    RETURN QUERY SELECT 
      true,
      EXTRACT(EPOCH FROM (v_record.locked_until - now()))::integer,
      v_record.attempt_count,
      false,
      v_record.block_reason;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 0, v_record.attempt_count, false, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_frontend_error_alerts(p_window_minutes integer DEFAULT 15, p_threshold integer DEFAULT 10, p_cooldown_minutes integer DEFAULT 60, p_limit integer DEFAULT 20) RETURNS TABLE(assinatura text, exemplo_mensagem text, severity text, ocorrencias bigint, usuarios_afetados bigint, urls_distintas bigint, primeira_ocorrencia timestamp with time zone, ultima_ocorrencia timestamp with time zone, is_nova boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
DECLARE
  v_threshold integer := greatest(1, coalesce(p_threshold, 10));
  v_cooldown integer := greatest(0, least(coalesce(p_cooldown_minutes, 60), 10080));
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 100));
  v_desde timestamptz := now() - make_interval(mins => greatest(1, least(coalesce(p_window_minutes, 15), 1440)));
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH grupos AS (
    SELECT
      public.fe_error_signature(fel.error_message) AS sig,
      (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo,
      (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS sev,
      count(*) AS total,
      count(DISTINCT fel.user_id) AS usuarios,
      count(DISTINCT fel.url) AS urls,
      min(fel.created_at) AS primeira,
      max(fel.created_at) AS ultima
    FROM public.frontend_error_logs fel
    WHERE fel.created_at >= v_desde
    GROUP BY 1
    HAVING count(*) >= v_threshold
  ),
  elegiveis AS (
    SELECT g.*
    FROM grupos g
    LEFT JOIN public.frontend_error_alert_state s ON s.assinatura = g.sig
    WHERE s.assinatura IS NULL
       OR (
         coalesce(s.silenciado_ate, '-infinity'::timestamptz) < now()
         AND s.ultimo_alerta_em <= now() - make_interval(mins => v_cooldown)
       )
    ORDER BY g.total DESC
    LIMIT v_limit
  ),
  gravados(sig_gravada, nova) AS (
    INSERT INTO public.frontend_error_alert_state AS st (
      assinatura, severity, exemplo_mensagem, primeiro_alerta_em,
      ultimo_alerta_em, ocorrencias_no_ultimo_alerta, alertas_enviados
    )
    SELECT e.sig, e.sev, left(e.exemplo, 2000), now(), now(), e.total, 1
    FROM elegiveis e
    ON CONFLICT (assinatura) DO UPDATE SET
      severity = EXCLUDED.severity,
      exemplo_mensagem = EXCLUDED.exemplo_mensagem,
      ultimo_alerta_em = now(),
      ocorrencias_no_ultimo_alerta = EXCLUDED.ocorrencias_no_ultimo_alerta,
      alertas_enviados = st.alertas_enviados + 1
    RETURNING st.assinatura, (st.alertas_enviados = 1)
  )
  SELECT e.sig, e.exemplo, e.sev, e.total, e.usuarios, e.urls, e.primeira, e.ultima, gr.nova
  FROM elegiveis e
  JOIN gravados gr ON gr.sig_gravada = e.sig
  ORDER BY e.total DESC;
END
$$;

CREATE OR REPLACE FUNCTION public.claim_silenciamentos_digest(p_horas integer DEFAULT 168, p_min_intervalo_horas integer DEFAULT 144) RETURNS TABLE(assinatura text, severity text, exemplo_mensagem text, silenciado_ate timestamp with time zone, horas_restantes numeric, ja_expirou boolean, alertas_enviados integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_horas integer := least(greatest(coalesce(p_horas, 168), 1), 720);
  v_min   integer := least(greatest(coalesce(p_min_intervalo_horas, 144), 0), 720);
BEGIN
  -- Serializa execuções concorrentes do agendador antes de decidir o envio.
  LOCK TABLE public.frontend_error_silence_digest_log IN SHARE ROW EXCLUSIVE MODE;

  IF v_min > 0 AND EXISTS (
    SELECT 1 FROM public.frontend_error_silence_digest_log d
    WHERE d.executado_em > now() - make_interval(hours => v_min)
  ) THEN
    RETURN; -- digest recente já enviado
  END IF;

  RETURN QUERY
  WITH sel AS (
    SELECT
      s.assinatura,
      s.severity,
      s.exemplo_mensagem,
      s.silenciado_ate,
      round(extract(epoch FROM (s.silenciado_ate - now())) / 3600.0, 1)::numeric AS horas_restantes,
      (s.silenciado_ate <= now()) AS ja_expirou,
      s.alertas_enviados
    FROM public.frontend_error_alert_state s
    WHERE s.silenciado_ate IS NOT NULL
      AND s.silenciado_ate <= now() + make_interval(hours => v_horas)
      AND s.silenciado_ate >= now() - make_interval(hours => v_horas)
    ORDER BY s.silenciado_ate ASC
    LIMIT 200
  ),
  agg AS (
    SELECT count(*)::integer AS n, coalesce(array_agg(sel.assinatura), '{}'::text[]) AS lista
    FROM sel
  ),
  ins AS (
    -- Só consome a janela de cooldown quando há de fato o que comunicar.
    INSERT INTO public.frontend_error_silence_digest_log (janela_horas, itens, assinaturas)
    SELECT v_horas, agg.n, agg.lista FROM agg WHERE agg.n > 0
    RETURNING 1
  )
  SELECT sel.assinatura, sel.severity, sel.exemplo_mensagem, sel.silenciado_ate,
         sel.horas_restantes, sel.ja_expirou, sel.alertas_enviados
  FROM sel
  WHERE (SELECT count(*) FROM ins) >= 0
  ORDER BY sel.silenciado_ate ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_pgss_baseline(p_days integer DEFAULT 90) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.pg_stat_statements_baseline
   WHERE captured_at < now() - make_interval(days => GREATEST(p_days, 7));
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  DELETE FROM login_attempts WHERE email = lower(p_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.close_stale_integrity_alerts(p_hour timestamp with time zone, p_domains text[], p_grace interval DEFAULT '00:00:00'::interval) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_hour IS NULL OR p_domains IS NULL OR array_length(p_domains, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Um alerta representa um sintoma vivo. Se nenhuma rodada dentro da janela
  -- [p_hour - p_grace, ...] reproduziu o invariante, a inconsistencia foi
  -- corrigida: encerra. O limite e INCLUSIVO (>=) — com grace = 0 a propria
  -- rodada corrente conta como reincidencia.
  WITH fechados AS (
    UPDATE public.integrity_alerts a
    SET resolved_at = now(),
        resolved_reason = 'auto: invariante nao reproduzido em ' || p_hour::text
    WHERE a.resolved_at IS NULL
      AND a.domain = ANY (p_domains)
      AND a.alert_hour < (p_hour - p_grace)
      AND NOT EXISTS (
        SELECT 1 FROM public.integrity_alerts b
        WHERE b.domain = a.domain
          AND b.invariant = a.invariant
          AND b.alert_hour >= (p_hour - p_grace)
      )
    RETURNING 1
  )
  SELECT count(*)::int INTO v_count FROM fechados;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.compare_pg_stat_baseline(p_label text DEFAULT 'post-hardening-initial'::text) RETURNS TABLE(queryid bigint, query text, baseline_calls bigint, current_calls bigint, calls_delta bigint, baseline_mean_ms double precision, current_mean_ms double precision, mean_delta_pct numeric, baseline_total_ms double precision, current_total_ms double precision)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
  WITH base AS (
    SELECT DISTINCT ON (b.queryid)
      b.queryid, b.query, b.calls, b.mean_exec_time, b.total_exec_time
    FROM public.pg_stat_statements_baseline b
    WHERE b.label = p_label
    ORDER BY b.queryid, b.captured_at DESC
  ),
  curr AS (
    SELECT s.queryid, s.calls, s.mean_exec_time, s.total_exec_time, s.query
    FROM extensions.pg_stat_statements s
    WHERE s.dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  )
  SELECT
    COALESCE(base.queryid, curr.queryid) AS queryid,
    COALESCE(base.query, curr.query) AS query,
    COALESCE(base.calls, 0) AS baseline_calls,
    COALESCE(curr.calls, 0) AS current_calls,
    COALESCE(curr.calls, 0) - COALESCE(base.calls, 0) AS calls_delta,
    COALESCE(base.mean_exec_time, 0) AS baseline_mean_ms,
    COALESCE(curr.mean_exec_time, 0) AS current_mean_ms,
    CASE
      WHEN COALESCE(base.mean_exec_time, 0) > 0
        THEN ROUND(((COALESCE(curr.mean_exec_time, 0) - base.mean_exec_time) / base.mean_exec_time * 100)::NUMERIC, 2)
      ELSE NULL
    END AS mean_delta_pct,
    COALESCE(base.total_exec_time, 0) AS baseline_total_ms,
    COALESCE(curr.total_exec_time, 0) AS current_total_ms
  FROM base
  FULL OUTER JOIN curr ON curr.queryid = base.queryid
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY COALESCE(curr.total_exec_time, 0) DESC
  LIMIT 200;
$$;

CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(p_conciliacao_id uuid, p_user_id uuid, p_transacao_id uuid DEFAULT NULL::uuid, p_conta_pagar_id uuid DEFAULT NULL::uuid, p_conta_receber_id uuid DEFAULT NULL::uuid, p_ajuste_centavos numeric DEFAULT 0) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
    UPDATE public.conciliacoes
    SET status = 'confirmado',
        confirmado_por = p_user_id,
        confirmado_em = now(),
        updated_at = now()
    WHERE id = p_conciliacao_id;
    
    IF p_transacao_id IS NOT NULL THEN
        UPDATE public.transacoes_bancarias SET status = 'conciliado' WHERE id = p_transacao_id;
    END IF;
    
    IF p_conta_pagar_id IS NOT NULL THEN
        UPDATE public.contas_pagar SET status = 'pago', data_pagamento = now(), valor_pago = valor + p_ajuste_centavos WHERE id = p_conta_pagar_id;
    END IF;

    IF p_conta_receber_id IS NOT NULL THEN
        UPDATE public.contas_receber SET status = 'recebido', data_recebimento = now(), valor_recebido = valor + p_ajuste_centavos WHERE id = p_conta_receber_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid DEFAULT NULL::uuid, p_conta_receber_id uuid DEFAULT NULL::uuid, p_ajuste_centavos numeric DEFAULT 0) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_empresa uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cb.empresa_id INTO v_empresa
  FROM public.transacoes_bancarias tb
  JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
  WHERE tb.id = p_transacao_id;

  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'transacao_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_empresas ue
    WHERE ue.user_id = v_uid AND ue.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  IF p_conta_pagar_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.contas_pagar cp
    WHERE cp.id = p_conta_pagar_id AND cp.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_conta_pagar' USING ERRCODE = '42501';
  END IF;

  IF p_conta_receber_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.contas_receber cr
    WHERE cr.id = p_conta_receber_id AND cr.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_conta_receber' USING ERRCODE = '42501';
  END IF;

  UPDATE public.transacoes_bancarias
  SET status = 'confirmado',
      data_confirmacao = now(),
      updated_at = now()
  WHERE id = p_transacao_id;

  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
    SET status = 'pago',
        data_pagamento = COALESCE(data_pagamento, (SELECT data FROM public.transacoes_bancarias WHERE id = p_transacao_id)),
        valor_pago = valor,
        updated_at = now()
    WHERE id = p_conta_pagar_id;
  END IF;

  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
    SET status = 'pago',
        data_recebimento = COALESCE(data_recebimento, (SELECT data FROM public.transacoes_bancarias WHERE id = p_transacao_id)),
        valor_recebido = valor,
        transacao_conciliada_id = p_transacao_id,
        updated_at = now()
    WHERE id = p_conta_receber_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirmar_envio_cobranca(p_fila_id uuid, p_provider text DEFAULT NULL::text, p_provider_message_id text DEFAULT NULL::text, p_sucesso boolean DEFAULT true, p_erro text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
    UPDATE public.fila_cobrancas
    SET 
        status = CASE WHEN p_sucesso THEN 'enviado' ELSE 'falhou' END,
        provider = p_provider,
        updated_at = now()
    WHERE id = p_fila_id;

    INSERT INTO public.historico_cobranca (
        empresa_id,
        fila_id,
        provider,
        provider_message_id,
        status,
        mensagem,
        created_at
    )
    SELECT 
        empresa_id,
        id,
        p_provider,
        p_provider_message_id,
        CASE WHEN p_sucesso THEN 'enviado' ELSE 'falhou' END,
        p_erro,
        now()
    FROM public.fila_cobrancas
    WHERE id = p_fila_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.definir_empresa_padrao(_empresa_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ativo boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem definir a empresa padrão';
  END IF;

  SELECT COALESCE(ativo, true) INTO v_ativo FROM public.empresas WHERE id = _empresa_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa inexistente';
  END IF;
  IF NOT v_ativo THEN
    RAISE EXCEPTION 'Empresa inativa não pode ser a padrão';
  END IF;

  UPDATE public.empresas SET is_padrao = true WHERE id = _empresa_id;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, details)
  VALUES (auth.uid(), 'EMPRESA_PADRAO_DEFINIDA', 'empresas', _empresa_id::text,
          jsonb_build_object('empresa_id', _empresa_id), 'Empresa padrão alterada');

  RETURN jsonb_build_object('ok', true, 'empresa_id', _empresa_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_cron_job(job_id bigint) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'cron'
    AS $$
DECLARE
  v_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem remover tarefas agendadas';
  END IF;

  SELECT jobname INTO v_name FROM cron.job WHERE jobid = job_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Tarefa agendada % não encontrada', job_id;
  END IF;

  PERFORM cron.unschedule(v_name);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(p_conciliacao_id uuid, p_transacao_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
    DELETE FROM public.conciliacoes
    WHERE id = p_conciliacao_id;

    IF p_transacao_id IS NOT NULL THEN
        UPDATE public.transacoes_bancarias SET status = 'pendente' WHERE id = p_transacao_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_empresa uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cb.empresa_id INTO v_empresa
  FROM public.transacoes_bancarias tb
  JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
  WHERE tb.id = p_transacao_id;

  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'transacao_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_empresas ue
    WHERE ue.user_id = v_uid AND ue.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  UPDATE public.transacoes_bancarias
  SET status = 'pendente',
      data_confirmacao = NULL,
      confirmado_por = NULL,
      updated_at = now()
  WHERE id = p_transacao_id;

  UPDATE public.contas_receber
  SET transacao_conciliada_id = NULL,
      status = CASE WHEN data_vencimento < now()::date THEN 'vencido' ELSE 'pendente' END,
      updated_at = now()
  WHERE transacao_conciliada_id = p_transacao_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.detectar_duplicidades_financeiras(p_empresa_id uuid, p_tabela text DEFAULT 'contas_pagar'::text) RETURNS TABLE(entidade_tipo text, contraparte_id uuid, numero_documento text, valor numeric, data_vencimento date, ocorrencias bigint, valor_total numeric, ids uuid[])
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_empresa_id IS NULL THEN
    RAISE EXCEPTION 'empresa_id é obrigatório';
  END IF;
  IF p_tabela NOT IN ('contas_pagar', 'contas_receber') THEN
    RAISE EXCEPTION 'Tabela inválida: %. Use contas_pagar ou contas_receber.', p_tabela;
  END IF;
  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado à empresa informada';
  END IF;

  IF p_tabela = 'contas_pagar' THEN
    RETURN QUERY
    SELECT 'conta_pagar'::text, cp.fornecedor_id, cp.numero_documento, cp.valor,
           cp.data_vencimento::date, count(*)::bigint, sum(cp.valor)::numeric,
           array_agg(cp.id ORDER BY cp.created_at)
    FROM public.contas_pagar cp
    WHERE cp.empresa_id = p_empresa_id
      AND cp.deleted_at IS NULL
      AND COALESCE(cp.status,'pendente') <> 'cancelado'
    GROUP BY cp.fornecedor_id, cp.numero_documento, cp.valor, cp.data_vencimento::date
    HAVING count(*) > 1
    ORDER BY count(*) DESC, sum(cp.valor) DESC;
  ELSE
    RETURN QUERY
    SELECT 'conta_receber'::text, cr.cliente_id, cr.numero_documento, cr.valor,
           cr.data_vencimento::date, count(*)::bigint, sum(cr.valor)::numeric,
           array_agg(cr.id ORDER BY cr.created_at)
    FROM public.contas_receber cr
    WHERE cr.empresa_id = p_empresa_id
      AND cr.deleted_at IS NULL
      AND COALESCE(cr.status,'pendente') <> 'cancelado'
    GROUP BY cr.cliente_id, cr.numero_documento, cr.valor, cr.data_vencimento::date
    HAVING count(*) > 1
    ORDER BY count(*) DESC, sum(cr.valor) DESC;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.drop_old_partitions(p_table text, p_retention_months integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $_$
DECLARE
  v_cutoff date := (date_trunc('month', now()) - make_interval(months => p_retention_months))::date;
  v_rec record;
  v_dropped text[] := ARRAY[]::text[];
  v_upper date;
BEGIN
  IF p_retention_months IS NULL OR p_retention_months < 1 THEN
    RAISE EXCEPTION 'retention_months deve ser >= 1';
  END IF;

  FOR v_rec IN
    SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
    FROM pg_class parent
    JOIN pg_inherits i ON i.inhparent = parent.oid
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_namespace n ON n.oid = parent.relnamespace
    WHERE n.nspname = 'public' AND parent.relname = p_table
  LOOP
    IF v_rec.bound IS NULL OR v_rec.bound ILIKE '%DEFAULT%' THEN
      CONTINUE;
    END IF;

    v_upper := (regexp_match(v_rec.bound, $re$TO \('([0-9]{4}-[0-9]{2}-[0-9]{2})$re$))[1]::date;
    IF v_upper IS NOT NULL AND v_upper <= v_cutoff THEN
      EXECUTE format('DROP TABLE IF EXISTS public.%I', v_rec.relname);
      v_dropped := v_dropped || v_rec.relname;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'table', p_table,
    'cutoff', v_cutoff,
    'dropped', v_dropped,
    'dropped_count', cardinality(v_dropped)
  );
END;
$_$;

CREATE OR REPLACE FUNCTION public.duplicate_saved_filter(_source_id uuid, _new_name text DEFAULT ''::text) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_source public.saved_filters%ROWTYPE;
  v_name text;
  v_new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- RLS de SELECT garante que só presets acessíveis sejam encontrados.
  SELECT * INTO v_source FROM public.saved_filters WHERE id = _source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Preset não encontrado ou sem acesso';
  END IF;

  v_name := NULLIF(btrim(coalesce(_new_name, '')), '');
  IF v_name IS NULL THEN
    v_name := v_source.name || ' (cópia)';
  END IF;

  INSERT INTO public.saved_filters (
    user_id, created_by, entity_type, name, filters, is_default, is_shared, empresa_id, shared_with_roles
  ) VALUES (
    auth.uid(), auth.uid(), v_source.entity_type, v_name, v_source.filters, false, false, NULL, '{}'::text[]
  )
  ON CONFLICT (user_id, entity_type, name) DO UPDATE SET filters = EXCLUDED.filters, updated_at = now()
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.empresa_acessivel(_empresa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT _empresa_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.user_empresas ue
       WHERE ue.empresa_id = _empresa_id
         AND ue.user_id = (SELECT auth.uid())
         AND COALESCE(ue.ativo, true)
     )
$$;

CREATE OR REPLACE FUNCTION public.empresa_membro_ativo(_empresa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT _empresa_id IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.user_empresas ue
       WHERE ue.empresa_id = _empresa_id
         AND ue.user_id = (SELECT auth.uid())
         AND ue.ativo = true
     );
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.empresas_unica_padrao() CASCADE;
CREATE OR REPLACE FUNCTION public.empresas_unica_padrao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Empresa desativada nunca permanece como padrão
  IF NOT COALESCE(NEW.ativo, true) THEN
    IF TG_OP = 'UPDATE' AND NEW.is_padrao AND COALESCE(OLD.ativo, true) THEN
      NEW.is_padrao := false;
      RETURN NEW;
    END IF;
    IF NEW.is_padrao THEN
      RAISE EXCEPTION 'Uma empresa inativa não pode ser a empresa padrão';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.is_padrao THEN
    UPDATE public.empresas e
       SET is_padrao = false
     WHERE e.is_padrao AND e.id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_webhook_retry(p_log_id uuid, p_source text, p_event_type text, p_external_id text, p_payload jsonb, p_error text, p_headers jsonb DEFAULT '{}'::jsonb) RETURNS TABLE(action text, next_retry_at timestamp with time zone, attempts integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_attempts INTEGER := 0;
  v_next TIMESTAMPTZ;
  v_backoff INTERVAL;
BEGIN
  -- Determinar tentativa atual
  IF p_log_id IS NOT NULL THEN
    SELECT COALESCE(wl.attempts, 0) + 1 INTO v_attempts
      FROM public.webhooks_log wl WHERE wl.id = p_log_id;
  ELSE
    v_attempts := 1;
  END IF;

  IF v_attempts >= 3 THEN
    -- Move para DLQ
    INSERT INTO public.webhook_dlq (
      source, event_type, external_id, payload, headers,
      error_message, attempts, last_attempt_at
    ) VALUES (
      p_source, p_event_type, p_external_id, COALESCE(p_payload,'{}'::jsonb),
      COALESCE(p_headers,'{}'::jsonb), p_error, v_attempts, now()
    );

    IF p_log_id IS NOT NULL THEN
      UPDATE public.webhooks_log
         SET status='dead', attempts=v_attempts, last_error_at=now(),
             error_message=p_error, next_retry_at=NULL
       WHERE id = p_log_id;
    END IF;

    RETURN QUERY SELECT 'moved_to_dlq'::TEXT, NULL::TIMESTAMPTZ, v_attempts;
    RETURN;
  END IF;

  -- Backoff exponencial: 1min, 5min, 30min
  v_backoff := CASE v_attempts
    WHEN 1 THEN INTERVAL '1 minute'
    WHEN 2 THEN INTERVAL '5 minutes'
    ELSE INTERVAL '30 minutes'
  END;
  v_next := now() + v_backoff;

  IF p_log_id IS NOT NULL THEN
    UPDATE public.webhooks_log
       SET status='retrying', attempts=v_attempts,
           next_retry_at=v_next, last_error_at=now(),
           error_message=p_error
     WHERE id = p_log_id;
  ELSE
    INSERT INTO public.webhooks_log (
      source, event_type, external_id, payload, status,
      error_message, attempts, next_retry_at, last_error_at
    ) VALUES (
      p_source, p_event_type, p_external_id, COALESCE(p_payload,'{}'::jsonb),
      'retrying', p_error, v_attempts, v_next, now()
    );
  END IF;

  RETURN QUERY SELECT 'scheduled_retry'::TEXT, v_next, v_attempts;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_monthly_partitions(p_table text, p_months_back integer DEFAULT 6, p_months_forward integer DEFAULT 3) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_start date;
  v_end date;
  v_partition_name text;
  v_created int := 0;
  i int;
BEGIN
  FOR i IN -p_months_back..p_months_forward LOOP
    v_start := date_trunc('month', now() + make_interval(months => i))::date;
    v_end := (v_start + interval '1 month')::date;
    v_partition_name := format('%s_%s', p_table, to_char(v_start, 'YYYY_MM'));

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_partition_name
    ) THEN
      EXECUTE format(
        'CREATE TABLE public.%I PARTITION OF public.%I FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, p_table, v_start, v_end
      );
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_partition_name);
      v_created := v_created + 1;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname = p_table || '_default'
  ) THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.%I DEFAULT',
      p_table || '_default', p_table
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table || '_default');
  END IF;

  RETURN v_created;
END;
$$;

CREATE OR REPLACE FUNCTION public.escalate_stale_integrity_alerts(p_age interval DEFAULT '24:00:00'::interval) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_count   bigint := 0;
  v_oldest  timestamptz;
  v_domains text[];
  v_samples uuid[];
  v_hour    timestamptz := date_trunc('hour', now());
  v_closed  integer := 0;
BEGIN
  SELECT count(*), min(created_at),
         array_agg(DISTINCT domain),
         (array_agg(id ORDER BY created_at))[1:5]
    INTO v_count, v_oldest, v_domains, v_samples
    FROM public.integrity_alerts
   WHERE resolved_at IS NULL
     AND severity = 'critical'
     AND created_at < now() - p_age;

  IF COALESCE(v_count, 0) = 0 THEN
    UPDATE public.performance_alerts
       SET resolved_at = now(),
           resolved_reason = 'auto: nenhum alerta critico de integridade envelhecido'
     WHERE source = 'cron'
       AND alert_key = 'integrity_stale_critical'
       AND resolved_at IS NULL;
    GET DIAGNOSTICS v_closed = ROW_COUNT;
    RETURN jsonb_build_object('escalated', 0, 'closed', v_closed, 'success', true);
  END IF;

  INSERT INTO public.performance_alerts (
    source, alert_key, alert_hour, severity, reason,
    current_value, sample_count, metadata
  ) VALUES (
    'cron', 'integrity_stale_critical', v_hour, 'critical',
    format('%s alerta(s) critico(s) de integridade abertos ha mais de %s (mais antigo: %s)',
           v_count, p_age::text, to_char(v_oldest, 'DD/MM HH24:MI')),
    v_count, v_count,
    jsonb_build_object(
      'dominios', to_jsonb(v_domains),
      'amostras', to_jsonb(v_samples),
      'mais_antigo', v_oldest,
      'idade_horas', round(EXTRACT(EPOCH FROM (now() - v_oldest)) / 3600.0, 1)
    )
  )
  ON CONFLICT (source, alert_key, alert_hour) DO UPDATE
    SET reason        = EXCLUDED.reason,
        current_value = EXCLUDED.current_value,
        sample_count  = EXCLUDED.sample_count,
        metadata      = EXCLUDED.metadata,
        resolved_at   = NULL,
        resolved_reason = NULL;

  RETURN jsonb_build_object(
    'escalated', v_count, 'closed', 0,
    'oldest', v_oldest, 'domains', to_jsonb(v_domains), 'success', true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.export_asaas_audit_csv(p_empresa_id uuid) RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_csv text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem exportar auditoria.';
  END IF;

  WITH linhas AS (
    SELECT
      to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
      COALESCE(a.action, '')                     AS action,
      COALESCE(a.actor::text, '')                AS actor,
      COALESCE(a.payment_id::text, '')     AS payment_id,
      COALESCE(p.asaas_id, '')                   AS asaas_id,
      COALESCE(p.status, '')                     AS status,
      COALESCE(p.valor::text, '')                AS valor,
      -- Escape CSV (RFC 4180): duplica aspas e envolve em aspas
      '"' || replace(replace(COALESCE(a.details::text, '{}'), '"', '""'), E'\n', ' ') || '"' AS details
    FROM public.asaas_audit_trail a
    LEFT JOIN public.asaas_payments p ON p.id = a.payment_id
    WHERE p.empresa_id = p_empresa_id OR p.empresa_id IS NULL
    ORDER BY a.created_at DESC
    LIMIT 50000
  )
  SELECT
    'created_at,action,actor,payment_id,asaas_id,status,valor,details' || E'\n'
    || COALESCE(string_agg(
         created_at || ',' || action || ',' || actor || ',' ||
         payment_id || ',' || asaas_id || ',' || status || ',' ||
         valor || ',' || details,
         E'\n'
       ), '')
  INTO v_csv
  FROM linhas;

  RETURN v_csv;
END;
$$;

CREATE OR REPLACE FUNCTION public.faixa_simples_reparticao_valida(_rep jsonb) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT _rep = '{}'::jsonb
      OR abs(100 - coalesce((SELECT sum((value)::numeric) FROM jsonb_each_text(_rep)), 0)) <= 0.01;
$$;

CREATE OR REPLACE FUNCTION public.fe_error_signature(p_message text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT left(
    regexp_replace(
      regexp_replace(coalesce(p_message, ''), '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
      '\d+', '<n>', 'g'), 200)
$$;

CREATE OR REPLACE FUNCTION public.fn_balancete(p_empresa_id uuid, p_data_inicio date, p_data_fim date, p_nivel_max integer DEFAULT NULL::integer) RETURNS TABLE(conta_id uuid, codigo text, nome text, tipo text, natureza text, nivel integer, aceita_lancamento boolean, saldo_anterior numeric, debitos numeric, creditos numeric, saldo_final numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH RECURSIVE mov AS (
    SELECT
      p.conta_id AS c_id,
      SUM(CASE WHEN l.data_lancamento < p_data_inicio
               THEN CASE WHEN p.tipo = 'D' THEN p.valor ELSE -p.valor END
               ELSE 0 END) AS saldo_anterior,
      SUM(CASE WHEN l.data_lancamento >= p_data_inicio AND l.data_lancamento <= p_data_fim AND p.tipo = 'D'
               THEN p.valor ELSE 0 END) AS debitos,
      SUM(CASE WHEN l.data_lancamento >= p_data_inicio AND l.data_lancamento <= p_data_fim AND p.tipo = 'C'
               THEN p.valor ELSE 0 END) AS creditos
    FROM public.partidas_contabeis p
    JOIN public.lancamentos_contabeis l ON l.id = p.lancamento_id
    WHERE l.empresa_id = p_empresa_id
      AND l.data_lancamento <= p_data_fim
      AND COALESCE(l.status, 'ativo') <> 'cancelado'
    GROUP BY p.conta_id
  ),
  closure AS (
    SELECT pc.id AS ancestor_id, pc.id AS descendant_id
    FROM public.plano_contas pc
    WHERE pc.empresa_id = p_empresa_id
    UNION ALL
    SELECT c.ancestor_id, pc.id
    FROM closure c
    JOIN public.plano_contas pc ON pc.parent_id = c.descendant_id
    WHERE pc.empresa_id = p_empresa_id
  )
  SELECT
    pc.id,
    pc.codigo,
    pc.nome,
    pc.tipo,
    pc.natureza,
    COALESCE(pc.nivel, 1)::integer,
    COALESCE(pc.aceita_lancamento, true),
    COALESCE(SUM(m.saldo_anterior), 0)::numeric,
    COALESCE(SUM(m.debitos), 0)::numeric,
    COALESCE(SUM(m.creditos), 0)::numeric,
    (COALESCE(SUM(m.saldo_anterior), 0) + COALESCE(SUM(m.debitos), 0) - COALESCE(SUM(m.creditos), 0))::numeric
  FROM public.plano_contas pc
  JOIN closure cl ON cl.ancestor_id = pc.id
  LEFT JOIN mov m ON m.c_id = cl.descendant_id
  WHERE pc.empresa_id = p_empresa_id
    AND COALESCE(pc.ativo, true) = true
    AND (p_nivel_max IS NULL OR COALESCE(pc.nivel, 1) <= p_nivel_max)
  GROUP BY pc.id, pc.codigo, pc.nome, pc.tipo, pc.natureza, pc.nivel, pc.aceita_lancamento
  ORDER BY pc.codigo;
$$;

CREATE OR REPLACE FUNCTION public.fn_indices_contabeis(p_empresa_id uuid, p_data_inicio date, p_data_fim date) RETURNS TABLE(ativo_total numeric, ativo_circulante numeric, ativo_nao_circulante numeric, realizavel_lp numeric, imobilizado numeric, disponibilidades numeric, clientes numeric, estoques numeric, passivo_circulante numeric, passivo_nao_circulante numeric, fornecedores numeric, patrimonio_liquido numeric, receita_bruta numeric, deducoes_receita numeric, receita_liquida numeric, cmv numeric, lucro_liquido numeric, dias_periodo integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH bal AS (
    SELECT
      b.saldo_final,
      b.debitos,
      b.creditos,
      b.aceita_lancamento,
      public.fn_norm_conta_codigo(COALESCE(NULLIF(pc.codigo_referencial, ''), b.codigo)) AS k
    FROM public.fn_balancete(p_empresa_id, p_data_inicio, p_data_fim) b
    JOIN public.plano_contas pc ON pc.id = b.conta_id
    WHERE b.aceita_lancamento
  ),
  -- Patrimoniais: saldo acumulado (D-C). Resultado: movimento do período.
  agg AS (
    SELECT
      SUM(CASE WHEN k LIKE '01%'     THEN saldo_final ELSE 0 END) AS ativo_total,
      SUM(CASE WHEN k LIKE '0101%'   THEN saldo_final ELSE 0 END) AS ativo_circulante,
      SUM(CASE WHEN k LIKE '0102%'   THEN saldo_final ELSE 0 END) AS ativo_nao_circulante,
      SUM(CASE WHEN k LIKE '010201%' THEN saldo_final ELSE 0 END) AS realizavel_lp,
      SUM(CASE WHEN k LIKE '010203%' THEN saldo_final ELSE 0 END) AS imobilizado,
      SUM(CASE WHEN k LIKE '010101%' OR k LIKE '010102%' THEN saldo_final ELSE 0 END) AS disponibilidades,
      SUM(CASE WHEN k LIKE '010103%' THEN saldo_final ELSE 0 END) AS clientes,
      SUM(CASE WHEN k LIKE '010104%' THEN saldo_final ELSE 0 END) AS estoques,
      SUM(CASE WHEN k LIKE '0201%'   THEN -saldo_final ELSE 0 END) AS passivo_circulante,
      SUM(CASE WHEN k LIKE '0202%'   THEN -saldo_final ELSE 0 END) AS passivo_nao_circulante,
      SUM(CASE WHEN k LIKE '020101%' THEN -saldo_final ELSE 0 END) AS fornecedores,
      SUM(CASE WHEN k LIKE '0203%'   THEN -saldo_final ELSE 0 END) AS patrimonio_liquido,
      SUM(CASE WHEN k LIKE '0301%'   THEN (creditos - debitos) ELSE 0 END) AS receita_bruta,
      SUM(CASE WHEN k LIKE '0302%'   THEN (debitos - creditos) ELSE 0 END) AS deducoes_receita,
      SUM(CASE WHEN k LIKE '0303%'   THEN (debitos - creditos) ELSE 0 END) AS cmv,
      SUM(CASE WHEN k LIKE '03%'     THEN (creditos - debitos) ELSE 0 END) AS lucro_liquido
    FROM bal
  )
  SELECT
    COALESCE(ativo_total, 0)::numeric,
    COALESCE(ativo_circulante, 0)::numeric,
    COALESCE(ativo_nao_circulante, 0)::numeric,
    COALESCE(realizavel_lp, 0)::numeric,
    COALESCE(imobilizado, 0)::numeric,
    COALESCE(disponibilidades, 0)::numeric,
    COALESCE(clientes, 0)::numeric,
    COALESCE(estoques, 0)::numeric,
    COALESCE(passivo_circulante, 0)::numeric,
    COALESCE(passivo_nao_circulante, 0)::numeric,
    COALESCE(fornecedores, 0)::numeric,
    COALESCE(patrimonio_liquido, 0)::numeric,
    COALESCE(receita_bruta, 0)::numeric,
    COALESCE(deducoes_receita, 0)::numeric,
    (COALESCE(receita_bruta, 0) - COALESCE(deducoes_receita, 0))::numeric,
    COALESCE(cmv, 0)::numeric,
    COALESCE(lucro_liquido, 0)::numeric,
    GREATEST((p_data_fim - p_data_inicio) + 1, 1)::integer
  FROM agg;
$$;

CREATE OR REPLACE FUNCTION public.fn_livro_razao(p_empresa_id uuid, p_data_inicio date, p_data_fim date, p_conta_id uuid DEFAULT NULL::uuid) RETURNS TABLE(conta_id uuid, codigo text, nome text, saldo_anterior numeric, lancamento_id uuid, data_lancamento date, numero_lancamento bigint, historico text, debito numeric, credito numeric, saldo_corrido numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH base AS (
    SELECT
      p.conta_id AS c_id,
      pc.codigo AS c_codigo,
      pc.nome AS c_nome,
      l.id AS l_id,
      l.data_lancamento AS l_data,
      l.numero_lancamento AS l_numero,
      COALESCE(l.historico, COALESCE(p.historico_complementar, '')) AS l_hist,
      CASE WHEN p.tipo = 'D' THEN p.valor ELSE 0 END AS deb,
      CASE WHEN p.tipo = 'C' THEN p.valor ELSE 0 END AS cred,
      (l.data_lancamento < p_data_inicio) AS anterior,
      COALESCE(p.ordem, 0) AS p_ordem
    FROM public.partidas_contabeis p
    JOIN public.lancamentos_contabeis l ON l.id = p.lancamento_id
    JOIN public.plano_contas pc ON pc.id = p.conta_id
    WHERE l.empresa_id = p_empresa_id
      AND l.data_lancamento <= p_data_fim
      AND COALESCE(l.status, 'ativo') <> 'cancelado'
      AND (p_conta_id IS NULL OR p.conta_id = p_conta_id)
  ),
  ant AS (
    SELECT c_id, COALESCE(SUM(deb - cred), 0) AS saldo_anterior
    FROM base WHERE anterior GROUP BY c_id
  )
  SELECT
    b.c_id,
    b.c_codigo,
    b.c_nome,
    COALESCE(a.saldo_anterior, 0)::numeric,
    b.l_id,
    b.l_data,
    b.l_numero,
    b.l_hist,
    b.deb::numeric,
    b.cred::numeric,
    (COALESCE(a.saldo_anterior, 0) + SUM(b.deb - b.cred) OVER (
        PARTITION BY b.c_id ORDER BY b.l_data, b.l_numero NULLS LAST, b.p_ordem, b.l_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW))::numeric
  FROM base b
  LEFT JOIN ant a ON a.c_id = b.c_id
  WHERE NOT b.anterior
  ORDER BY b.c_codigo, b.l_data, b.l_numero NULLS LAST, b.p_ordem;
$$;

CREATE OR REPLACE FUNCTION public.fn_norm_conta_codigo(p_codigo text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT string_agg(lpad(seg, 2, '0'), '' ORDER BY ord)
     FROM unnest(
       string_to_array(regexp_replace(COALESCE(p_codigo, ''), '[^0-9.]', '', 'g'), '.')
     ) WITH ORDINALITY AS t(seg, ord)
     WHERE seg <> ''),
    ''
  );
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.frontend_error_logs_sanitize() CASCADE;
CREATE OR REPLACE FUNCTION public.frontend_error_logs_sanitize() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Canário do gate de segurança: aceita a requisição (prova o privilégio de
  -- INSERT) mas descarta a linha, mantendo a base limpa.
  IF NEW.error_message IS NOT NULL
     AND NEW.error_message LIKE '[ci-anon-surface-probe]%' THEN
    RETURN NULL;
  END IF;

  -- Truncamento defensivo: mantém os payloads dentro dos limites do CHECK
  -- frontend_error_logs_payload_bounds em vez de rejeitar a telemetria.
  NEW.error_message := left(NEW.error_message, 2000);
  NEW.error_stack   := left(NEW.error_stack, 8000);
  NEW.url           := left(NEW.url, 2000);
  NEW.user_agent    := left(NEW.user_agent, 500);

  IF NEW.metadata IS NULL THEN
    NEW.metadata := '{}'::jsonb;
  ELSIF pg_column_size(NEW.metadata) > 16384 THEN
    NEW.metadata := jsonb_build_object(
      'truncated', true,
      'original_size_bytes', pg_column_size(NEW.metadata)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gate_25_policies_sem_tenant() CASCADE;
CREATE OR REPLACE FUNCTION public.gate_25_policies_sem_tenant() RETURNS TABLE(tabela text, policy_name text, cmd text, vinculo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH exempt AS (
    SELECT unnest(ARRAY[
      'profiles','user_empresas','user_roles','sso_providers','sso_role_mappings',
      'sso_sandbox_runs','sso_user_groups','scim_tokens','scim_operations_log',
      'empresas','relatorios_agendados','historico_relatorios'
    ]) AS tbl
  ),
  candidatas AS (
    SELECT p.tablename::text AS tabela, p.policyname::text AS policy_name, p.cmd::text AS cmd,
           CASE WHEN EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema='public' AND c.table_name=p.tablename AND c.column_name='empresa_id'
           ) THEN 'direto' ELSE 'fk' END AS vinculo,
           EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema='public' AND c.table_name=p.tablename AND c.column_name='empresa_id'
           ) AS tem_coluna,
           EXISTS (
             SELECT 1 FROM pg_constraint fk
             JOIN information_schema.columns pc
               ON pc.table_schema='public'
              AND pc.table_name = fk.confrelid::regclass::text
              AND pc.column_name = 'empresa_id'
             WHERE fk.contype='f'
               AND fk.connamespace='public'::regnamespace
               AND fk.conrelid::regclass::text = p.tablename
           ) AS tem_fk
    FROM pg_policies p
    WHERE p.schemaname='public'
      AND p.tablename NOT IN (SELECT tbl FROM exempt)
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) LIKE '%has_role%'
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) NOT LIKE '%empresa%'
  )
  SELECT tabela, policy_name, cmd, vinculo
  FROM candidatas
  WHERE tem_coluna OR tem_fk
  ORDER BY 1, 2;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gate_27_secdef_sem_search_path() CASCADE;
CREATE OR REPLACE FUNCTION public.gate_27_secdef_sem_search_path() RETURNS TABLE(funcao text, argumentos text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
  SELECT
    p.proname::text,
    pg_get_function_identity_arguments(p.oid)::text,
    CASE
      WHEN sp.cfg IS NULL THEN 'sem SET search_path'
      ELSE 'search_path inseguro: ' || sp.cfg
    END
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  LEFT JOIN LATERAL (
    SELECT c AS cfg
    FROM unnest(COALESCE(p.proconfig, '{}'::text[])) c
    WHERE c LIKE 'search_path=%'
    LIMIT 1
  ) sp ON true
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND p.prokind = 'f'
    AND (
      sp.cfg IS NULL
      OR sp.cfg ~* '(^|[=,[:space:]])"?\$user"?([,[:space:]]|$)'
    )
  ORDER BY 1;
$_$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gate_29_rpc_sem_escopo_empresa() CASCADE;
CREATE OR REPLACE FUNCTION public.gate_29_rpc_sem_escopo_empresa() RETURNS TABLE(funcao text, tabelas text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH tenant_tabs AS (
    SELECT c.relname::text AS relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'empresa_id' AND a.attnum > 0
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  ), secdef AS (
    SELECT p.oid, p.proname::text AS fn, p.prosrc
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  )
  SELECT s.fn, string_agg(DISTINCT t.relname, ',')
  FROM secdef s
  JOIN tenant_tabs t ON s.prosrc ~ ('\mpublic\.' || t.relname || '\M')
  WHERE s.prosrc !~* '(empresa_acessivel|empresa_membro_ativo|empresa_id\s*=|empresa_padrao_id)'
    AND s.fn NOT IN ('resolve_sso_providers_for_domain')
  GROUP BY s.fn;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gate_30_views_inseguras() CASCADE;
CREATE OR REPLACE FUNCTION public.gate_30_views_inseguras() RETURNS TABLE(objeto text, tipo text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.relname::text,
         CASE c.relkind WHEN 'v' THEN 'view' ELSE 'matview' END,
         CASE
           WHEN c.relkind = 'v'
                AND NOT EXISTS (
                  SELECT 1 FROM unnest(coalesce(c.reloptions, '{}'::text[])) o
                  WHERE lower(o) IN ('security_invoker=on','security_invoker=true')
                )
             THEN 'view sem security_invoker: consulta roda com privilégios do owner e ignora RLS'
           WHEN c.relkind = 'm'
                AND (has_table_privilege('anon', c.oid, 'SELECT')
                  OR has_table_privilege('authenticated', c.oid, 'SELECT'))
             THEN 'matview exposta a roles do app: RLS não se aplica a visões materializadas'
         END
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v','m')
    AND (
      (c.relkind = 'v' AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(c.reloptions, '{}'::text[])) o
        WHERE lower(o) IN ('security_invoker=on','security_invoker=true')
      ))
      OR (c.relkind = 'm' AND (has_table_privilege('anon', c.oid, 'SELECT')
                            OR has_table_privilege('authenticated', c.oid, 'SELECT')))
    );
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gate_31_tenant_sem_indice() CASCADE;
CREATE OR REPLACE FUNCTION public.gate_31_tenant_sem_indice() RETURNS TABLE(tabela text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.relname::text,
         'tabela com RLS por empresa_id sem índice liderado por empresa_id: policies forçam seq scan por tenant'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'empresa_id' AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity
    AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = c.oid AND i.indkey[0] = a.attnum
    )
  ORDER BY 1;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gate_32_pii_sem_mascara() CASCADE;
CREATE OR REPLACE FUNCTION public.gate_32_pii_sem_mascara() RETURNS TABLE(objeto text, coluna text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.relname::text, 'chave_pix',
         'view expõe chave_pix sem mascarar_chave_pix()/pode_ver_dado_sensivel()'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'chave_pix' AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v','m')
    AND pg_get_viewdef(c.oid, true) NOT ILIKE '%mascarar_chave_pix%'
  ORDER BY 1;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gate_33_indices_redundantes() CASCADE;
CREATE OR REPLACE FUNCTION public.gate_33_indices_redundantes() RETURNS TABLE(tabela text, indice_redundante text, indice_equivalente text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  WITH idx AS (
    SELECT i.indrelid,
           i.indexrelid,
           i.indisunique,
           i.indisprimary,
           i.indkey::text  AS cols,
           i.indclass::text AS opclass,
           COALESCE(pg_get_expr(i.indexprs, i.indrelid), '') AS expr,
           COALESCE(pg_get_expr(i.indpred,   i.indrelid), '') AS pred,
           c.relname AS idxname,
           t.relname AS tblname
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
  )
  SELECT a.tblname::text,
         a.idxname::text,
         b.idxname::text,
         'mesmas colunas/opclass/predicado de um índice único ou anterior'::text
  FROM idx a
  JOIN idx b
    ON a.indrelid = b.indrelid
   AND a.cols = b.cols
   AND a.opclass = b.opclass
   AND a.expr = b.expr
   AND a.pred = b.pred
   AND a.indexrelid <> b.indexrelid
  WHERE NOT a.indisprimary
    AND NOT a.indisunique
    AND (b.indisunique OR b.indisprimary OR b.indexrelid < a.indexrelid)
$$;

CREATE OR REPLACE FUNCTION public.gate_34_indices_nao_utilizados(_min_dias integer DEFAULT 30) RETURNS TABLE(tabela text, indice text, dias_observados integer, tamanho_kb bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  WITH janela AS (
    SELECT index_name,
           max(table_name)  AS table_name,
           max(idx_scan)    AS scans_max,
           min(idx_scan)    AS scans_min,
           max(size_bytes)  AS size_bytes,
           bool_or(is_unique OR is_primary) AS protegido,
           (max(snapshot_date) - min(snapshot_date))::int AS dias
    FROM public.index_usage_snapshots
    WHERE snapshot_date >= CURRENT_DATE - (_min_dias * 2)
    GROUP BY index_name
  )
  SELECT j.table_name,
         j.index_name,
         j.dias,
         (j.size_bytes / 1024)::bigint
  FROM janela j
  WHERE NOT j.protegido
    AND j.dias >= _min_dias
    AND j.scans_max = 0
    AND j.scans_min = 0
    AND NOT EXISTS (
      SELECT 1 FROM public.indices_uso_excecoes e WHERE e.index_name = j.index_name
    )
    AND EXISTS (
      SELECT 1 FROM pg_indexes p
      WHERE p.schemaname = 'public' AND p.indexname = j.index_name
    )
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gate_35_tabelas_sem_retencao() CASCADE;
CREATE OR REPLACE FUNCTION public.gate_35_tabelas_sem_retencao() RETURNS TABLE(tabela text, coluna_temporal text, tamanho text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $_$
  SELECT ('public.' || c.relname)::text,
         (SELECT a.attname::text
            FROM pg_attribute a
            JOIN pg_type t ON t.oid = a.atttypid
           WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
             AND t.typname IN ('timestamptz','timestamp','date')
           ORDER BY (a.attname IN ('created_at','executed_at','dia')) DESC, a.attnum
           LIMIT 1),
         pg_size_pretty(pg_total_relation_size(c.oid))
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND NOT c.relispartition
     AND c.relname !~ '_(default|[0-9]{4}_[0-9]{2})$'
     AND c.relname ~ '(_log|_logs|logs_|_history|historico_|_snapshots|_events|_eventos|_attempts|_trail|auditoria_|_audit|telemetr|_cache|_runs|_queue)'
     AND EXISTS (
       SELECT 1 FROM pg_attribute a
        JOIN pg_type t ON t.oid = a.atttypid
       WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
         AND t.typname IN ('timestamptz','timestamp','date')
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.retencao_politicas p
        WHERE p.tabela = 'public.' || c.relname
     )
   ORDER BY pg_total_relation_size(c.oid) DESC;
$_$;

CREATE OR REPLACE FUNCTION public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
    -- Basic stub for suggestions
    RETURN jsonb_build_array();
END;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gerar_alertas_vencimento() CASCADE;
CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_inseridos integer := 0;
BEGIN
  WITH titulos AS (
    SELECT cp.id, cp.empresa_id, cp.descricao AS titulo_desc, cp.valor,
           cp.data_vencimento, 'conta_pagar'::text AS entidade_tipo
    FROM public.contas_pagar cp
    WHERE cp.deleted_at IS NULL
      AND COALESCE(cp.status,'pendente') NOT IN ('pago','cancelado')
      AND cp.data_vencimento <= CURRENT_DATE + 7
    UNION ALL
    SELECT cr.id, cr.empresa_id, COALESCE(cr.numero_documento, 'Título a receber'), cr.valor,
           cr.data_vencimento, 'conta_receber'
    FROM public.contas_receber cr
    WHERE cr.deleted_at IS NULL
      AND COALESCE(cr.status,'pendente') NOT IN ('recebido','pago','cancelado')
      AND cr.data_vencimento <= CURRENT_DATE + 7
  ), destinos AS (
    SELECT t.*, ue.user_id,
      CASE
        WHEN t.data_vencimento < CURRENT_DATE THEN 'critica'
        WHEN t.data_vencimento <= CURRENT_DATE + 3 THEN 'alta'
        ELSE 'media'
      END AS prioridade
    FROM titulos t
    JOIN public.user_empresas ue
      ON ue.empresa_id = t.empresa_id AND COALESCE(ue.ativo, true)
  ), novos AS (
    INSERT INTO public.alertas (user_id, tipo, titulo, mensagem, prioridade, entidade_id, entidade_tipo, acao_url)
    SELECT d.user_id,
           'vencimento',
           CASE WHEN d.data_vencimento < CURRENT_DATE
                THEN 'Título vencido' ELSE 'Vencimento próximo' END,
           format('%s - R$ %s com vencimento em %s',
                  COALESCE(d.titulo_desc, 'Título'),
                  to_char(COALESCE(d.valor, 0), 'FM999G999G990D00'),
                  to_char(d.data_vencimento, 'DD/MM/YYYY')),
           d.prioridade,
           d.id,
           d.entidade_tipo,
           CASE WHEN d.entidade_tipo = 'conta_pagar' THEN '/contas-pagar' ELSE '/contas-receber' END
    FROM destinos d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.alertas a
      WHERE a.user_id = d.user_id
        AND a.entidade_id = d.id
        AND a.tipo = 'vencimento'
        AND a.created_at > now() - INTERVAL '24 hours'
    )
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_inseridos FROM novos;

  RETURN v_inseridos;
END;
$_$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.gerar_contas_recorrentes() CASCADE;
CREATE OR REPLACE FUNCTION public.gerar_contas_recorrentes() RETURNS integer
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rec       RECORD;
  v_data      DATE;
  v_limite    DATE := CURRENT_DATE + INTERVAL '30 days';
  v_criadas   INTEGER := 0;
  v_ref       DATE;
  v_dia       INTEGER;
  v_intervalo INTERVAL;
BEGIN
  FOR v_rec IN
    SELECT * FROM public.pagamentos_recorrentes
    WHERE ativo
      AND data_inicio <= v_limite
      AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  LOOP
    v_intervalo := CASE v_rec.frequencia
      WHEN 'semanal'    THEN INTERVAL '7 days'
      WHEN 'quinzenal'  THEN INTERVAL '15 days'
      WHEN 'mensal'     THEN INTERVAL '1 month'
      WHEN 'bimestral'  THEN INTERVAL '2 months'
      WHEN 'trimestral' THEN INTERVAL '3 months'
      WHEN 'semestral'  THEN INTERVAL '6 months'
      ELSE INTERVAL '1 year'
    END;

    v_ref := COALESCE(v_rec.proxima_geracao, v_rec.data_inicio);

    WHILE v_ref <= v_limite AND (v_rec.data_fim IS NULL OR v_ref <= v_rec.data_fim) LOOP
      -- ajusta para o dia de vencimento válido dentro do mês
      v_dia := LEAST(
        v_rec.dia_vencimento,
        EXTRACT(DAY FROM (date_trunc('month', v_ref) + INTERVAL '1 month - 1 day'))::INTEGER
      );
      v_data := CASE
        WHEN v_rec.frequencia IN ('semanal','quinzenal') THEN v_ref
        ELSE date_trunc('month', v_ref)::DATE + (v_dia - 1)
      END;

      IF NOT EXISTS (
        SELECT 1 FROM public.contas_pagar cp
        WHERE cp.deleted_at IS NULL
          AND cp.metadata->>'pagamento_recorrente_id' = v_rec.id::TEXT
          AND cp.data_vencimento = v_data
      ) THEN
        INSERT INTO public.contas_pagar (
          descricao, valor, data_vencimento, status, fornecedor_id, fornecedor_nome,
          empresa_id, centro_custo_id, conta_bancaria_id, tipo_cobranca, observacoes,
          recorrente, user_id, metadata
        ) VALUES (
          v_rec.descricao, v_rec.valor, v_data, 'pendente', v_rec.fornecedor_id, v_rec.fornecedor_nome,
          v_rec.empresa_id, v_rec.centro_custo_id, v_rec.conta_bancaria_id,
          v_rec.tipo_cobranca::TEXT, v_rec.observacoes,
          TRUE, auth.uid(),
          jsonb_build_object('pagamento_recorrente_id', v_rec.id, 'gerado_em', now())
        );
        v_criadas := v_criadas + 1;
      END IF;

      v_ref := (v_ref + v_intervalo)::DATE;
    END LOOP;

    UPDATE public.pagamentos_recorrentes
       SET ultima_geracao = CURRENT_DATE,
           proxima_geracao = v_ref,
           total_gerado    = total_gerado + v_criadas
     WHERE id = v_rec.id;
  END LOOP;

  RETURN v_criadas;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_sigla_empresa(_nome text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT upper(
    substring(
      regexp_replace(coalesce(_nome, 'EMP'), '[^a-zA-Z0-9]', '', 'g')
      from 1 for 3
    )
  );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE OR REPLACE FUNCTION public.get_acessos_suspeitos(_horas integer DEFAULT 168, _somente_abertos boolean DEFAULT true) RETURNS SETOF public.acessos_suspeitos
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT s.* FROM public.acessos_suspeitos s
  WHERE public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND (s.empresa_id IS NULL OR public.empresa_acessivel(s.empresa_id))
    AND s.created_at >= now() - make_interval(hours => GREATEST(COALESCE(_horas, 168), 1))
    AND (NOT COALESCE(_somente_abertos, true) OR s.revisado_em IS NULL)
  ORDER BY (s.severidade = 'critical') DESC, s.created_at DESC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.get_active_uapi_token() RETURNS TABLE(access_token text, refresh_token text, user_fid text, token_age_hours numeric, needs_refresh boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT 
    s.access_token,
    s.refresh_token,
    s.user_fid,
    EXTRACT(EPOCH FROM (now() - s.token_obtained_at)) / 3600 AS token_age_hours,
    EXTRACT(EPOCH FROM (now() - s.token_obtained_at)) / 3600 > 20 AS needs_refresh
  FROM public.lalamove_uapi_sessions s
  WHERE s.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_asaas_payment_stats(p_empresa_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Autorização: admin OU usuário vinculado à empresa
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.empresa_id = p_empresa_id
        AND ue.ativo = true
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário sem vínculo com a empresa informada.';
  END IF;

  SELECT jsonb_build_object(
    'empresa_id',           p_empresa_id,
    'total_pagamentos',     COUNT(*),
    'total_pago',           COALESCE(SUM(CASE WHEN status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH') THEN valor ELSE 0 END), 0),
    'total_pendente',       COALESCE(SUM(CASE WHEN status IN ('PENDING','AWAITING_RISK_ANALYSIS') THEN valor ELSE 0 END), 0),
    'total_vencido',        COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN valor ELSE 0 END), 0),
    'total_cancelado',      COALESCE(SUM(CASE WHEN status IN ('DELETED','CANCELED') THEN valor ELSE 0 END), 0),
    'total_reembolsado',    COALESCE(SUM(CASE WHEN status IN ('REFUNDED','REFUND_REQUESTED') THEN valor ELSE 0 END), 0),
    'valor_liquido_recebido', COALESCE(SUM(CASE WHEN status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH') THEN COALESCE(valor_liquido, valor) ELSE 0 END), 0),
    'qtd_pago',             COUNT(*) FILTER (WHERE status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH')),
    'qtd_pendente',         COUNT(*) FILTER (WHERE status IN ('PENDING','AWAITING_RISK_ANALYSIS')),
    'qtd_vencido',          COUNT(*) FILTER (WHERE status = 'OVERDUE'),
    'qtd_cancelado',        COUNT(*) FILTER (WHERE status IN ('DELETED','CANCELED')),
    'ticket_medio_pago',    COALESCE(AVG(valor) FILTER (WHERE status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH')), 0),
    'proximo_vencimento',   MIN(data_vencimento) FILTER (WHERE status IN ('PENDING','AWAITING_RISK_ANALYSIS')),
    'ultimo_recebimento',   MAX(data_pagamento) FILTER (WHERE status IN ('RECEIVED','CONFIRMED','RECEIVED_IN_CASH')),
    'gerado_em',            now()
  )
  INTO v_result
  FROM public.asaas_payments
  WHERE empresa_id = p_empresa_id;

  RETURN COALESCE(v_result, jsonb_build_object(
    'empresa_id', p_empresa_id,
    'total_pagamentos', 0,
    'gerado_em', now()
  ));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_bloat_history(p_days integer DEFAULT 30) RETURNS TABLE(id uuid, table_name text, dead_ratio_pct integer, severity text, details text, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar histórico de bloat.';
  END IF;

  RETURN QUERY
  SELECT qt.id, qt.table_name, qt.duration_ms AS dead_ratio_pct,
         qt.severity, qt.error_message AS details, qt.created_at
  FROM public.query_telemetry qt
  WHERE qt.operation = 'bloat_monitor'
    AND qt.created_at > now() - make_interval(days => GREATEST(p_days, 1))
  ORDER BY qt.created_at DESC
  LIMIT 5000;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_bloat_snapshots(p_days integer DEFAULT 30, p_table_name text DEFAULT NULL::text) RETURNS TABLE(snapshot_date date, table_name text, live_rows bigint, dead_rows bigint, dead_ratio_pct numeric, total_size_bytes bigint, total_size_pretty text, last_autovacuum timestamp with time zone, autovacuum_count bigint)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar snapshots de bloat.';
  END IF;

  RETURN QUERY
  SELECT s.snapshot_date, s.table_name, s.live_rows, s.dead_rows, s.dead_ratio_pct,
         s.total_size_bytes, s.total_size_pretty, s.last_autovacuum, s.autovacuum_count
  FROM public.bloat_snapshots s
  WHERE s.snapshot_date > CURRENT_DATE - make_interval(days => GREATEST(p_days, 1))
    AND (p_table_name IS NULL OR s.table_name = p_table_name)
  ORDER BY s.snapshot_date DESC, s.dead_ratio_pct DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_catalogos_tributarios_history(_dias integer DEFAULT 30) RETURNS TABLE(dia date, criticos integer, avisos integer, infos integer, total_invariantes integer, saudavel boolean)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_dias integer := LEAST(GREATEST(COALESCE(_dias, 30), 1), 365);
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT h.dia, h.criticos, h.avisos, h.infos, h.total_invariantes, h.saudavel
    FROM public.catalogos_tributarios_health_history h
    WHERE h.dia >= current_date - v_dias
    ORDER BY h.dia ASC;
END;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.get_cobertura_fiscal_uf() CASCADE;
CREATE OR REPLACE FUNCTION public.get_cobertura_fiscal_uf() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ufs jsonb;
  v_globais jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(x ORDER BY x->>'uf')
  INTO v_ufs
  FROM (
    SELECT jsonb_build_object(
      'uf', u.sigla::text,
      'nome', u.nome,
      'regiao', u.regiao::text,
      'uf_atualizado_em', u.updated_at,
      'aliquotas_internas', COALESCE(ai.total, 0),
      'aliquotas_internas_atualizado_em', ai.ultima,
      'iss_municipios', COALESCE(iss.municipios, 0),
      'iss_registros', COALESCE(iss.total, 0),
      'iss_atualizado_em', iss.ultima,
      'protocolos_st', COALESCE(st.total, 0),
      'protocolos_st_atualizado_em', st.ultima,
      'beneficios_fiscais', COALESCE(bf.total, 0),
      'beneficios_atualizado_em', bf.ultima
    ) AS x
    FROM public.ufs u
    LEFT JOIN (
      SELECT uf, count(*)::int AS total, max(updated_at) AS ultima
      FROM public.aliquotas_internas_uf GROUP BY uf
    ) ai ON ai.uf = u.sigla
    LEFT JOIN (
      SELECT uf, count(*)::int AS total,
             count(DISTINCT codigo_ibge)::int AS municipios,
             max(updated_at) AS ultima
      FROM public.aliquotas_iss_municipal GROUP BY uf
    ) iss ON iss.uf = u.sigla
    LEFT JOIN (
      SELECT su.uf, count(DISTINCT su.protocolo_id)::int AS total, max(p.updated_at) AS ultima
      FROM public.protocolos_st_ufs su
      JOIN public.protocolos_st p ON p.id = su.protocolo_id
      GROUP BY su.uf
    ) st ON st.uf = u.sigla
    LEFT JOIN (
      SELECT uf, count(*)::int AS total, max(updated_at) AS ultima
      FROM public.beneficios_fiscais WHERE uf IS NOT NULL GROUP BY uf
    ) bf ON bf.uf = u.sigla
  ) s;

  SELECT jsonb_build_object(
    'cnaes', (SELECT count(*)::int FROM public.cnaes),
    'cnaes_atualizado_em', (SELECT max(updated_at) FROM public.cnaes),
    'ncms', (SELECT count(*)::int FROM public.ncms),
    'ncms_atualizado_em', (SELECT max(updated_at) FROM public.ncms),
    'ncms_st', (SELECT count(*)::int FROM public.ncms WHERE sujeito_st),
    'protocolos_st', (SELECT count(*)::int FROM public.protocolos_st),
    'protocolos_st_ncms', (SELECT count(*)::int FROM public.protocolos_st_ncms),
    'itens_lista_iss', (SELECT count(*)::int FROM public.itens_lista_iss),
    'ufs_total', (SELECT count(*)::int FROM public.ufs)
  ) INTO v_globais;

  RETURN jsonb_build_object(
    'gerado_em', now(),
    'globais', v_globais,
    'ufs', COALESCE(v_ufs, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cron_run_history(p_job_name text DEFAULT NULL::text, p_limit integer DEFAULT 100) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  runs jsonb;
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 1000);
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar execuções agendadas.';
  END IF;

  SELECT jsonb_agg(t) INTO runs
  FROM (
    SELECT r.jobid, j.jobname, r.runid, r.status,
           r.return_message, r.start_time, r.end_time
    FROM cron.job_run_details r
    JOIN cron.job j ON r.jobid = j.jobid
    WHERE (p_job_name IS NULL OR j.jobname = p_job_name)
    ORDER BY r.start_time DESC
    LIMIT v_limit
  ) t;

  RETURN COALESCE(runs, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_frontend_error_groups(p_desde timestamp with time zone DEFAULT (now() - '7 days'::interval), p_severity text DEFAULT NULL::text, p_limit integer DEFAULT 50) RETURNS TABLE(assinatura text, exemplo_mensagem text, severity text, ocorrencias bigint, usuarios_afetados bigint, urls_distintas bigint, primeira_ocorrencia timestamp with time zone, ultima_ocorrencia timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    left(regexp_replace(
           regexp_replace(fel.error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
           '\d+', '<n>', 'g'), 200) AS assinatura,
    (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo_mensagem,
    (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS severity,
    count(*) AS ocorrencias,
    count(DISTINCT fel.user_id) AS usuarios_afetados,
    count(DISTINCT fel.url) AS urls_distintas,
    min(fel.created_at) AS primeira_ocorrencia,
    max(fel.created_at) AS ultima_ocorrencia
  FROM public.frontend_error_logs fel
  WHERE fel.created_at >= p_desde
    AND (p_severity IS NULL OR fel.severity = p_severity)
  GROUP BY 1
  ORDER BY count(*) DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
END $$;

CREATE OR REPLACE FUNCTION public.get_frontend_error_occurrences(p_assinatura text, p_desde timestamp with time zone DEFAULT (now() - '7 days'::interval), p_limit integer DEFAULT 25) RETURNS TABLE(id uuid, created_at timestamp with time zone, severity text, error_message text, error_stack text, url text, user_agent text, user_id uuid, metadata jsonb)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT fel.id, fel.created_at, fel.severity, fel.error_message, fel.error_stack,
         fel.url, fel.user_agent, fel.user_id, fel.metadata
  FROM public.frontend_error_logs fel
  WHERE fel.created_at >= p_desde
    AND left(regexp_replace(
              regexp_replace(fel.error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
              '\d+', '<n>', 'g'), 200) = p_assinatura
  ORDER BY fel.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 25), 100));
END $$;

CREATE OR REPLACE FUNCTION public.get_integrity_alerts(p_limit integer DEFAULT 100, p_incluir_resolvidos boolean DEFAULT false) RETURNS TABLE(id uuid, domain text, invariant text, severity text, affected_count bigint, reason text, sample_ids uuid[], alert_hour timestamp with time zone, resolved_at timestamp with time zone, resolved_reason text, created_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT a.id, a.domain, a.invariant, a.severity, a.affected_count, a.reason,
         a.sample_ids, a.alert_hour, a.resolved_at, a.resolved_reason, a.created_at
  FROM public.integrity_alerts a
  WHERE (p_incluir_resolvidos OR a.resolved_at IS NULL)
  ORDER BY (a.resolved_at IS NOT NULL), a.alert_hour DESC, a.severity
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_lockout_details(_email text) RETURNS TABLE(is_locked boolean, remaining_minutes integer, lockout_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_attempts INTEGER;
  v_last_attempt TIMESTAMP WITH TIME ZONE;
  v_lockout_duration_minutes INTEGER := 15; -- Configuração padrão
BEGIN
  SELECT attempt_count, last_attempt_at 
  INTO v_attempts, v_last_attempt
  FROM public.login_attempts
  WHERE email = _email;

  IF v_attempts >= 5 AND v_last_attempt > now() - (v_lockout_duration_minutes || ' minutes')::interval THEN
    is_locked := TRUE;
    remaining_minutes := EXTRACT(MINUTE FROM (v_last_attempt + (v_lockout_duration_minutes || ' minutes')::interval) - now())::INTEGER;
    lockout_count := (v_attempts / 5)::INTEGER;
  ELSE
    is_locked := FALSE;
    remaining_minutes := 0;
    lockout_count := 0;
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_performance_alerts(p_days integer DEFAULT 7, p_severity text DEFAULT NULL::text, p_source text DEFAULT NULL::text, p_incluir_resolvidos boolean DEFAULT false) RETURNS TABLE(id uuid, source text, alert_key text, alert_hour timestamp with time zone, severity text, reason text, current_value numeric, baseline_value numeric, ratio numeric, sample_count integer, query_snippet text, metadata jsonb, created_at timestamp with time zone, resolved_at timestamp with time zone, resolved_reason text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar alertas de performance.';
  END IF;

  RETURN QUERY
  SELECT a.id, a.source, a.alert_key, a.alert_hour, a.severity, a.reason,
         a.current_value, a.baseline_value, a.ratio, a.sample_count,
         a.query_snippet, a.metadata, a.created_at, a.resolved_at, a.resolved_reason
  FROM public.performance_alerts a
  WHERE a.created_at > now() - make_interval(days => GREATEST(p_days, 1))
    AND (p_severity IS NULL OR a.severity = p_severity)
    AND (p_source IS NULL OR a.source = p_source)
    AND (COALESCE(p_incluir_resolvidos, false) OR a.resolved_at IS NULL)
  ORDER BY
    CASE WHEN a.resolved_at IS NULL THEN 0 ELSE 1 END,
    CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
    a.created_at DESC
  LIMIT 500;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_performance_alerts_weekly(p_weeks integer DEFAULT 12) RETURNS TABLE(week_start date, source text, severity text, alert_count bigint, distinct_keys bigint, avg_current_ms numeric, max_current_ms numeric, avg_ratio numeric, max_ratio numeric, total_samples numeric, delta_pct_vs_prev_week numeric, refreshed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar tendências.';
  END IF;

  RETURN QUERY
  SELECT mv.week_start, mv.source, mv.severity, mv.alert_count, mv.distinct_keys,
         mv.avg_current_ms, mv.max_current_ms, mv.avg_ratio, mv.max_ratio,
         mv.total_samples::numeric, mv.delta_pct_vs_prev_week, mv.refreshed_at
  FROM public.mv_performance_alerts_weekly mv
  WHERE mv.week_start > (now() - make_interval(weeks => GREATEST(p_weeks, 1)))::date
  ORDER BY mv.week_start DESC, mv.source, mv.severity;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_retencoes_pendentes_count(p_empresa_id uuid) RETURNS bigint
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF p_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Empresa nao informada';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado a empresa informada';
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM public.retencoes_fonte
    WHERE empresa_id = p_empresa_id
      AND status = 'pendente'
      AND darf_gerado = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_retention_history(p_days integer DEFAULT 30) RETURNS TABLE(executed_at timestamp with time zone, completed_at timestamp with time zone, duration_ms integer, success boolean, skipped boolean, error_message text, total_deleted bigint, partitions_dropped integer, per_table jsonb)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer perfil admin'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH runs AS (
    SELECT l.executed_at, l.completed_at, l.duration_ms, l.success,
           l.error_message, COALESCE(l.result, '{}'::jsonb) AS result
      FROM public.cron_job_logs l
     WHERE l.job_name = 'daily-log-retention'
       AND l.executed_at >= now() - make_interval(days => v_days)
  ),
  expandido AS (
    SELECT r.*,
           COALESCE((
             SELECT jsonb_object_agg(kv.key, kv.value)
               FROM jsonb_each(r.result) AS kv
              WHERE jsonb_typeof(kv.value) = 'number'
                AND kv.key NOT IN ('duration_ms')
           ), '{}'::jsonb) AS tabelas
      FROM runs r
  )
  SELECT
    e.executed_at,
    e.completed_at,
    e.duration_ms,
    COALESCE(e.success, false),
    COALESCE((e.result->>'skipped')::boolean, false),
    e.error_message,
    COALESCE((
      SELECT sum((kv.value)::text::bigint) FROM jsonb_each(e.tabelas) kv
    ), 0)::bigint,
    (
      COALESCE((e.result#>>'{partitions,audit_logs_dropped,dropped_count}')::int, 0)
      + COALESCE((e.result#>>'{partitions,frontend_error_logs_dropped,dropped_count}')::int, 0)
    ),
    e.tabelas
  FROM expandido e
  ORDER BY e.executed_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_silenciamentos_expirando(p_horas integer DEFAULT 72) RETURNS TABLE(assinatura text, severity text, exemplo_mensagem text, silenciado_ate timestamp with time zone, horas_restantes numeric, ja_expirou boolean, alertas_enviados integer, ocorrencias_no_ultimo_alerta integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_horas integer := least(greatest(coalesce(p_horas, 72), 1), 720);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar silenciamentos.';
  END IF;

  RETURN QUERY
  SELECT
    s.assinatura,
    s.severity,
    s.exemplo_mensagem,
    s.silenciado_ate,
    round(extract(epoch FROM (s.silenciado_ate - now())) / 3600.0, 1)::numeric,
    (s.silenciado_ate <= now()),
    s.alertas_enviados,
    s.ocorrencias_no_ultimo_alerta
  FROM public.frontend_error_alert_state s
  WHERE s.silenciado_ate IS NOT NULL
    AND s.silenciado_ate <= now() + make_interval(hours => v_horas)
    AND s.silenciado_ate >= now() - make_interval(hours => v_horas)
  ORDER BY s.silenciado_ate ASC
  LIMIT 200;
END;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.get_ultima_carga_fiscal() CASCADE;
CREATE OR REPLACE FUNCTION public.get_ultima_carga_fiscal() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  SELECT to_jsonb(c) INTO v
    FROM public.catalogos_fiscais_cargas c
   ORDER BY c.last_updated DESC
   LIMIT 1;

  RETURN COALESCE(v, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid) RETURNS text[]
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticacao requerida';
  END IF;

  IF get_user_permissions.user_id IS DISTINCT FROM (select auth.uid())
     AND NOT public.has_role((select auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: consulta restrita ao proprio usuario';
  END IF;

  RETURN ARRAY(
    SELECT DISTINCT p.name
    FROM public.permissions p
    JOIN public.role_permissions rp ON p.id = rp.permission_id
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = get_user_permissions.user_id
      AND ur.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid) RETURNS text[]
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticacao requerida';
  END IF;

  IF get_user_roles.user_id IS DISTINCT FROM (select auth.uid())
     AND NOT public.has_role((select auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: consulta restrita ao proprio usuario';
  END IF;

  RETURN ARRAY(
    SELECT ur.role::text FROM public.user_roles ur
    WHERE ur.user_id = get_user_roles.user_id
      AND ur.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.role_permissions rp ON p.id = rp.permission_id
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND p.name = _permission_name
      AND ur.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = _user_id
      AND user_roles.role = _role
      AND user_roles.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_failed_attempts(_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  INSERT INTO public.login_attempts (email, attempt_count, last_attempt_at, success)
  VALUES (_email, 1, now(), false)
  ON CONFLICT (email) DO UPDATE
  SET attempt_count = login_attempts.attempt_count + 1,
      last_attempt_at = now(),
      success = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_pix_template_uso(p_template_id uuid) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.pix_templates
     SET uso_count = COALESCE(uso_count, 0) + 1
   WHERE id = p_template_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_country_allowed_for_login(_country text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.allowed_countries WHERE country_code = _country AND is_active = true);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_country_blocked(_country_code text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.geo_blocks
        WHERE country_code = _country_code
          AND is_blocked = true
          AND (expires_at IS NULL OR expires_at > now())
    )
$$;

CREATE OR REPLACE FUNCTION public.is_ip_allowed_for_login(_ip inet) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.allowed_ips WHERE ip_address = _ip AND is_active = true);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address inet) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip_address = p_ip_address
      AND (is_permanent = true OR expires_at > now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_ip_whitelisted(_ip_address inet) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.ip_whitelist
        WHERE is_active = true
          AND (ip_address = _ip_address OR _ip_address << cidr_range::inet)
    )
$$;

CREATE OR REPLACE FUNCTION public.is_known_device(_user_id uuid, _fingerprint text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_devices
        WHERE user_id = _user_id
          AND device_fingerprint = _fingerprint
    )
$$;

CREATE OR REPLACE FUNCTION public.is_org_membro(_org_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT
    CASE
      -- contexto de backend (service_role / jobs): auth.uid() é NULL
      WHEN (SELECT auth.uid()) IS NULL THEN TRUE
      WHEN _user_id = (SELECT auth.uid()) THEN TRUE
      WHEN public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN TRUE
      ELSE FALSE
    END
    AND EXISTS (
      SELECT 1 FROM public.organizacao_membros
      WHERE organizacao_id = _org_id AND usuario_id = _user_id AND ativo
    );
$$;

CREATE OR REPLACE FUNCTION public.is_org_responsavel(_org_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT
    CASE
      WHEN (SELECT auth.uid()) IS NULL THEN TRUE
      WHEN _user_id = (SELECT auth.uid()) THEN TRUE
      WHEN public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN TRUE
      ELSE FALSE
    END
    AND EXISTS (
      SELECT 1 FROM public.organizacoes
      WHERE id = _org_id AND responsavel_id = _user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_token_valid(p_token_hash text) RETURNS TABLE(is_valid boolean, user_id uuid, expires_in_seconds integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_record password_reset_tokens%ROWTYPE;
BEGIN
  SELECT * INTO v_record
  FROM password_reset_tokens
  WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND used_at IS NULL
  LIMIT 1;
  
  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 0;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true,
    v_record.user_id,
    EXTRACT(EPOCH FROM (v_record.expires_at - now()))::integer;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit(p_table_name text, p_record_id uuid, p_action text, p_details text DEFAULT NULL::text, p_old_data jsonb DEFAULT NULL::jsonb, p_new_data jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO public.audit_logs (table_name, record_id, action, details, old_data, new_data, user_id, user_email)
    VALUES (p_table_name, p_record_id, p_action, p_details, p_old_data, p_new_data, auth.uid(), (auth.jwt()->>'email'))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_rpc_observability_call(_function_name text, _duration_ms numeric, _success boolean, _error_sqlstate text DEFAULT NULL::text, _error_message text DEFAULT NULL::text, _meta jsonb DEFAULT '{}'::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _uid UUID := auth.uid();
  _role TEXT := current_setting('request.jwt.claim.role', true);
BEGIN
  INSERT INTO public.rpc_observability_metrics(
    function_name, caller_user_id, caller_role,
    duration_ms, success, error_sqlstate, error_message, meta
  ) VALUES (
    _function_name, _uid, COALESCE(_role, current_user::text),
    _duration_ms, _success, _error_sqlstate, _error_message, COALESCE(_meta,'{}'::jsonb)
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_sso_onboarding_event(_email text, _event_type text, _provider_id text DEFAULT NULL::text, _context jsonb DEFAULT '{}'::jsonb, _success boolean DEFAULT true, _error_code text DEFAULT NULL::text, _error_message text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
    INSERT INTO public.sso_login_attempts (
        email,
        event_type,
        provider_id,
        context,
        success,
        error_code,
        error_message
    ) VALUES (
        _email,
        _event_type,
        _provider_id,
        _context,
        _success,
        _error_code,
        _error_message
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.mascarar_chave_pix(_valor text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN _valor IS NULL OR length(btrim(_valor)) = 0 THEN _valor
    WHEN length(btrim(_valor)) <= 4 THEN repeat('*', length(btrim(_valor)))
    ELSE repeat('*', greatest(length(btrim(_valor)) - 4, 3)) || right(btrim(_valor), 4)
  END;
$$;

CREATE OR REPLACE FUNCTION public.nfe_apply_manifestacao(p_chave text, p_tipo_evento text, p_codigo_evento text, p_sequencial integer, p_data_evento timestamp with time zone, p_protocolo text, p_justificativa text, p_status_retorno text, p_motivo_retorno text, p_novo_status public.nfe_manifestacao_status, p_raw jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nfe_id UUID;
  v_status_atual public.nfe_manifestacao_status;
  v_inserted BOOLEAN := FALSE;
BEGIN
  SELECT id, manifestacao_status
    INTO v_nfe_id, v_status_atual
    FROM public.nfe_recebidas
   WHERE chave_acesso = p_chave
   FOR UPDATE;

  IF v_nfe_id IS NULL THEN
    RAISE EXCEPTION 'nfe_nao_encontrada' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.nfe_eventos(
    chave_acesso, tipo_evento, codigo_evento, sequencial,
    data_evento, protocolo, justificativa,
    status_retorno, motivo_retorno, raw_payload, created_by
  ) VALUES (
    p_chave, p_tipo_evento, p_codigo_evento, GREATEST(p_sequencial,1),
    COALESCE(p_data_evento, now()), p_protocolo, p_justificativa,
    p_status_retorno, p_motivo_retorno, p_raw, auth.uid()
  )
  ON CONFLICT (chave_acesso, tipo_evento, sequencial) DO NOTHING
  RETURNING TRUE INTO v_inserted;

  -- Atualiza status apenas se retorno SEFAZ for aceito (135/136/155).
  IF p_status_retorno IN ('135','136','155') THEN
    UPDATE public.nfe_recebidas
       SET manifestacao_status = p_novo_status,
           manifestacao_data = COALESCE(p_data_evento, now()),
           manifestacao_justificativa = p_justificativa,
           updated_at = now()
     WHERE id = v_nfe_id;
  END IF;

  RETURN jsonb_build_object(
    'nfe_id', v_nfe_id,
    'status_anterior', v_status_atual,
    'status_novo', CASE WHEN p_status_retorno IN ('135','136','155')
                        THEN p_novo_status ELSE v_status_atual END,
    'evento_inserido', COALESCE(v_inserted, FALSE)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date DEFAULT NULL::date, p_categoria_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_forn_id uuid;
  v_cnpj text;
  v_new_cp uuid;
  v_venc date;
BEGIN
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  IF v_nfe.conta_pagar_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_linked', true, 'conta_pagar_id', v_nfe.conta_pagar_id);
  END IF;

  IF v_nfe.valor_total IS NULL OR v_nfe.valor_total <= 0 THEN
    RAISE EXCEPTION 'NFe % sem valor_total válido para gerar conta a pagar', p_nfe_id USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_cnpj := regexp_replace(coalesce(v_nfe.cnpj_emitente, ''), '\D', '', 'g');

  -- Match / cria fornecedor
  SELECT id INTO v_forn_id FROM public.fornecedores
   WHERE regexp_replace(coalesce(cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> ''
   LIMIT 1;

  IF v_forn_id IS NULL AND v_cnpj <> '' THEN
    INSERT INTO public.fornecedores (razao_social, cnpj, user_id)
    VALUES (coalesce(v_nfe.razao_emitente, v_cnpj), v_cnpj, auth.uid())
    RETURNING id INTO v_forn_id;
  END IF;

  v_venc := coalesce(p_data_vencimento, (coalesce(v_nfe.data_emissao, now())::date + INTERVAL '30 days')::date);

  INSERT INTO public.contas_pagar (
    descricao, valor, data_vencimento, status, fornecedor_id, empresa_id,
    numero_documento, categoria_id, metadata, user_id, fornecedor_nome
  )
  VALUES (
    left(concat('NFe ', coalesce(v_nfe.numero, '?'), ' - ', coalesce(v_nfe.razao_emitente, v_cnpj)), 255),
    v_nfe.valor_total,
    v_venc,
    'pendente',
    v_forn_id,
    v_nfe.empresa_id,
    v_nfe.chave_acesso,
    p_categoria_id,
    jsonb_build_object(
      'origem', 'nfe_recebida',
      'nfe_id', p_nfe_id::text,
      'nfe_chave', v_nfe.chave_acesso,
      'nfe_numero', v_nfe.numero,
      'nfe_serie', v_nfe.serie
    ),
    auth.uid(),
    v_nfe.razao_emitente
  )
  RETURNING id INTO v_new_cp;

  UPDATE public.nfe_recebidas
  SET conta_pagar_id = v_new_cp, updated_at = now()
  WHERE id = p_nfe_id;

  RETURN jsonb_build_object('ok', true, 'already_linked', false, 'conta_pagar_id', v_new_cp, 'fornecedor_id', v_forn_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_cp public.contas_pagar%ROWTYPE;
BEGIN
  -- Lock ordenado para evitar deadlock (nfe < conta)
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  SELECT * INTO v_cp FROM public.contas_pagar WHERE id = p_conta_pagar_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta a pagar % não encontrada ou removida', p_conta_pagar_id USING ERRCODE = 'no_data_found';
  END IF;

  -- Idempotente: já vinculada
  IF v_nfe.conta_pagar_id = p_conta_pagar_id THEN
    RETURN jsonb_build_object('ok', true, 'already_linked', true, 'conta_pagar_id', p_conta_pagar_id);
  END IF;

  -- NFe já ligada a outra conta
  IF v_nfe.conta_pagar_id IS NOT NULL AND v_nfe.conta_pagar_id <> p_conta_pagar_id THEN
    RAISE EXCEPTION 'NFe já está vinculada à conta %', v_nfe.conta_pagar_id USING ERRCODE = 'unique_violation';
  END IF;

  -- Conta já usada por outra NFe
  IF EXISTS (
    SELECT 1 FROM public.nfe_recebidas nr2
    WHERE nr2.conta_pagar_id = p_conta_pagar_id AND nr2.id <> p_nfe_id
  ) THEN
    RAISE EXCEPTION 'Conta a pagar % já está vinculada a outra NFe', p_conta_pagar_id USING ERRCODE = 'unique_violation';
  END IF;

  UPDATE public.nfe_recebidas
  SET conta_pagar_id = p_conta_pagar_id,
      updated_at = now()
  WHERE id = p_nfe_id;

  UPDATE public.contas_pagar
  SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'nfe_chave', v_nfe.chave_acesso,
        'nfe_id', p_nfe_id::text,
        'nfe_vinculo_em', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ),
      updated_at = now()
  WHERE id = p_conta_pagar_id;

  RETURN jsonb_build_object('ok', true, 'already_linked', false, 'conta_pagar_id', p_conta_pagar_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.nfe_suggest_contas_pagar(p_nfe_id uuid) RETURNS TABLE(conta_pagar_id uuid, descricao text, valor numeric, data_vencimento date, status text, fornecedor_cnpj text, fornecedor_nome text, score numeric, match_motivo text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_cnpj text;
BEGIN
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  v_cnpj := regexp_replace(coalesce(v_nfe.cnpj_emitente, ''), '\D', '', 'g');

  RETURN QUERY
  SELECT
    cp.id,
    cp.descricao::text,
    cp.valor,
    cp.data_vencimento,
    cp.status::text,
    f.cnpj::text,
    coalesce(f.nome_fantasia, f.razao_social)::text,
    -- score: 100 base, +50 se cnpj bate, +30 se valor bate, -0.5 por dia de diferença
    (
      50
      + CASE WHEN regexp_replace(coalesce(f.cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> '' THEN 50 ELSE 0 END
      + CASE WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) < 0.01 THEN 30
             WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) / greatest(v_nfe.valor_total, 1) < 0.02 THEN 15
             ELSE 0 END
      - least(30, abs(extract(day from (cp.data_vencimento::timestamptz - coalesce(v_nfe.data_emissao, now())))) * 0.5)
    )::numeric AS score,
    concat_ws(' | ',
      CASE WHEN regexp_replace(coalesce(f.cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> '' THEN 'CNPJ' END,
      CASE WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) < 0.01 THEN 'Valor exato'
           WHEN v_nfe.valor_total IS NOT NULL AND abs(cp.valor - v_nfe.valor_total) / greatest(v_nfe.valor_total, 1) < 0.02 THEN 'Valor ~2%' END
    )::text AS match_motivo
  FROM public.contas_pagar cp
  LEFT JOIN public.fornecedores f ON f.id = cp.fornecedor_id
  WHERE cp.deleted_at IS NULL
    AND cp.status IN ('pendente', 'parcial', 'vencido', 'atrasado')
    AND cp.empresa_id IS NOT DISTINCT FROM v_nfe.empresa_id
    AND NOT EXISTS (
      SELECT 1 FROM public.nfe_recebidas nr2
      WHERE nr2.conta_pagar_id = cp.id AND nr2.id <> p_nfe_id
    )
  ORDER BY score DESC, cp.data_vencimento ASC
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.nfe_unlink_conta_pagar(p_nfe_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cp uuid;
BEGIN
  UPDATE public.nfe_recebidas
  SET conta_pagar_id = NULL, updated_at = now()
  WHERE id = p_nfe_id
  RETURNING conta_pagar_id INTO v_cp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  RETURN jsonb_build_object('ok', true, 'conta_pagar_id', v_cp);
END;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.pix_template_sync_legacy() CASCADE;
CREATE OR REPLACE FUNCTION public.pix_template_sync_legacy() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.favorecido_nome := COALESCE(NEW.favorecido_nome, NEW.beneficiario_nome);
  NEW.beneficiario_nome := COALESCE(NEW.beneficiario_nome, NEW.favorecido_nome);
  NEW.tipo_chave_pix := COALESCE(NEW.tipo_chave_pix, NEW.tipo_chave);
  NEW.tipo_chave := COALESCE(NEW.tipo_chave, NEW.tipo_chave_pix);
  IF NEW.favorecido_nome IS NULL OR NEW.tipo_chave_pix IS NULL THEN
    RAISE EXCEPTION 'favorecido_nome e tipo_chave_pix são obrigatórios';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id uuid DEFAULT NULL::uuid, p_simulate boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
    result JSONB;
BEGIN
    -- Simulação de processamento (em produção aqui rodaria a lógica de gatilhos)
    IF p_simulate THEN
        result := jsonb_build_object(
            'total_enfileirados', (SELECT count(*) FROM public.contas_receber WHERE status = 'pendente' AND empresa_id = COALESCE(p_empresa_id, empresa_id)),
            'message', 'Simulação concluída com base nos títulos pendentes.'
        );
    ELSE
        result := jsonb_build_object(
            'total_enfileirados', 0,
            'message', 'Lógica de produção: disparos agendados.'
        );
    END IF;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.profile_sensitive_fields_unchanged(_profile_id uuid, _user_id uuid, _role text, _empresa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _profile_id
      AND p.user_id IS NOT DISTINCT FROM _user_id
      AND p.role IS NOT DISTINCT FROM _role
      AND p.empresa_id IS NOT DISTINCT FROM _empresa_id
  );
$$;

CREATE OR REPLACE FUNCTION public.provisionar_usuario(_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_empresa uuid;
  v_email text;
  v_nome text;
  v_perfil_criado boolean := false;
  v_vinculo_criado boolean := false;
  v_role_criada boolean := false;
  v_resultado jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'usuario_invalido');
  END IF;

  SELECT u.email,
         COALESCE(
           NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
           NULLIF(u.raw_user_meta_data ->> 'name', ''),
           split_part(COALESCE(u.email, ''), '@', 1)
         )
    INTO v_email, v_nome
  FROM auth.users u
  WHERE u.id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'usuario_inexistente');
  END IF;

  v_empresa := public.empresa_padrao_id();

  -- 1. Perfil
  INSERT INTO public.profiles (id, user_id, email, full_name, empresa_id)
  VALUES (_user_id, _user_id, v_email, v_nome, v_empresa)
  ON CONFLICT (id) DO NOTHING;
  v_perfil_criado := FOUND;

  UPDATE public.profiles p
     SET empresa_id = v_empresa,
         user_id = COALESCE(p.user_id, _user_id)
   WHERE p.id = _user_id
     AND v_empresa IS NOT NULL
     AND p.empresa_id IS DISTINCT FROM v_empresa
     AND NOT EXISTS (
       SELECT 1 FROM public.user_empresas ue
       WHERE ue.user_id = _user_id AND ue.ativo
     );

  -- 2. Vínculo com a empresa padrão (menor privilégio)
  IF v_empresa IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = _user_id) THEN
    INSERT INTO public.user_empresas (user_id, empresa_id, role, is_default, provisioned_via, ativo)
    VALUES (_user_id, v_empresa, 'visualizador'::app_role, true, 'manual', true)
    ON CONFLICT (user_id, empresa_id) DO NOTHING;
    v_vinculo_criado := FOUND;
  END IF;

  -- 3. Papel global inicial (nunca rebaixa papéis existentes)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND COALESCE(ur.is_active, true)
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ) THEN
    INSERT INTO public.user_roles (user_id, role, notes)
    VALUES (_user_id, 'visualizador'::app_role, 'Provisionamento automático no primeiro acesso')
    ON CONFLICT DO NOTHING;
    v_role_criada := FOUND;
  END IF;

  v_resultado := jsonb_build_object(
    'ok', true,
    'empresa_id', v_empresa,
    'perfil_criado', v_perfil_criado,
    'vinculo_criado', v_vinculo_criado,
    'role_criada', v_role_criada
  );

  -- 4. Trilha de auditoria — apenas quando houve efeito e sem quebrar o login
  IF v_perfil_criado OR v_vinculo_criado OR v_role_criada THEN
    BEGIN
      INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, new_data, details)
      VALUES (
        _user_id,
        v_email,
        'PROVISIONAMENTO_USUARIO',
        'user_empresas',
        _user_id::text,
        v_resultado,
        'Provisionamento automático no primeiro acesso'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- auditoria é best-effort
    END;
  END IF;

  RETURN v_resultado;
END;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.provisionar_usuario_atual() CASCADE;
CREATE OR REPLACE FUNCTION public.provisionar_usuario_atual() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória para provisionamento';
  END IF;
  RETURN public.provisionar_usuario(v_uid);
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_old_rows(p_table regclass, p_column text, p_days integer, p_where text DEFAULT NULL::text, p_batch integer DEFAULT 10000, p_max_batches integer DEFAULT 50) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $_$
DECLARE
  v_total bigint := 0;
  v_count bigint;
  v_i integer := 0;
  v_sql text;
BEGIN
  IF p_days IS NULL OR p_days < 1 THEN
    RAISE EXCEPTION 'purge_old_rows: p_days deve ser >= 1 (recebido %)', p_days;
  END IF;
  IF p_batch < 1 OR p_batch > 100000 THEN
    RAISE EXCEPTION 'purge_old_rows: p_batch fora da faixa permitida (1..100000)';
  END IF;

  -- valida que a coluna existe e é temporal (evita injeção via p_column)
  PERFORM 1
    FROM pg_attribute a
    JOIN pg_type t ON t.oid = a.atttypid
   WHERE a.attrelid = p_table
     AND a.attname = p_column
     AND a.attnum > 0
     AND NOT a.attisdropped
     AND t.typname IN ('timestamptz','timestamp','date');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'purge_old_rows: coluna temporal % inexistente em %', p_column, p_table::text;
  END IF;

  v_sql := format(
    'DELETE FROM %s WHERE ctid IN (SELECT ctid FROM %s WHERE %I < now() - ($1 || '' days'')::interval %s LIMIT %s)',
    p_table::text, p_table::text, p_column,
    CASE WHEN p_where IS NULL OR btrim(p_where) = '' THEN '' ELSE 'AND (' || p_where || ')' END,
    p_batch
  );

  LOOP
    v_i := v_i + 1;
    EXECUTE v_sql USING p_days;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    EXIT WHEN v_count < p_batch OR v_i >= p_max_batches;
  END LOOP;

  RETURN v_total;
END;
$_$;

CREATE OR REPLACE FUNCTION public.recarregar_seeds_fiscais(p_origem text DEFAULT 'cron'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_inicio timestamptz := clock_timestamp();
  v_contagens jsonb;
  v_checksum text;
  v_vinculos integer := 0;
  v_criticos integer := 0;
  v_health jsonb;
  v_existente public.catalogos_fiscais_cargas%ROWTYPE;
  v_id uuid;
  v_status text;
BEGIN
  IF p_origem NOT IN ('cron','manual','ci','migration') THEN
    RAISE EXCEPTION 'Origem inválida: %', p_origem USING ERRCODE = '22023';
  END IF;

  -- Chamadas manuais exigem papel admin; execuções internas (cron/service_role) seguem.
  IF p_origem = 'manual' AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  -- Serializa execuções concorrentes (idempotência sob cron + disparo manual)
  IF NOT pg_try_advisory_xact_lock(hashtext('recarregar_seeds_fiscais')) THEN
    RETURN jsonb_build_object('status','sem_alteracao','mensagem','Recarga já em execução');
  END IF;

  -- 2.1) Normalização idempotente: vincula itens de protocolo ST ao NCM correspondente
  WITH atualizados AS (
    UPDATE public.protocolos_st_ncms pn
       SET ncm_id = n.id,
           updated_at = now()
      FROM public.ncms n
     WHERE pn.ncm_id IS NULL
       AND n.codigo = pn.ncm_codigo
    RETURNING 1
  )
  SELECT count(*)::int INTO v_vinculos FROM atualizados;

  -- 2.2) Revalidação das invariantes (gera/auto-resolve alertas)
  BEGIN
    v_health := public.check_catalogos_tributarios_invariants();
    v_criticos := COALESCE((v_health->>'criticos')::int, 0);
  EXCEPTION WHEN OTHERS THEN
    v_criticos := 0;
    v_health := jsonb_build_object('erro', SQLERRM);
  END;

  -- 2.3) Fotografia determinística do estado dos catálogos
  SELECT jsonb_build_object(
    'ufs', (SELECT count(*) FROM public.ufs),
    'cnaes', (SELECT count(*) FROM public.cnaes),
    'ncms', (SELECT count(*) FROM public.ncms),
    'itens_lista_iss', (SELECT count(*) FROM public.itens_lista_iss),
    'aliquotas_iss_municipal', (SELECT count(*) FROM public.aliquotas_iss_municipal),
    'aliquotas_internas_uf', (SELECT count(*) FROM public.aliquotas_internas_uf),
    'aliquotas_interestaduais', (SELECT count(*) FROM public.aliquotas_interestaduais),
    'protocolos_st', (SELECT count(*) FROM public.protocolos_st),
    'protocolos_st_ufs', (SELECT count(*) FROM public.protocolos_st_ufs),
    'protocolos_st_ncms', (SELECT count(*) FROM public.protocolos_st_ncms),
    'faixas_simples_nacional', (SELECT count(*) FROM public.faixas_simples_nacional),
    'beneficios_fiscais', (SELECT count(*) FROM public.beneficios_fiscais)
  ) INTO v_contagens;

  v_checksum := md5(v_contagens::text);

  SELECT * INTO v_existente
    FROM public.catalogos_fiscais_cargas
   WHERE checksum = v_checksum
   LIMIT 1;

  IF v_existente.id IS NOT NULL THEN
    -- Idempotente: mesmo estado → apenas atualiza a data da última verificação
    UPDATE public.catalogos_fiscais_cargas
       SET last_updated = now(),
           origem = p_origem,
           status = 'sem_alteracao',
           criticos = v_criticos,
           vinculos_normalizados = v_vinculos,
           duracao_ms = (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int
     WHERE id = v_existente.id;
    v_id := v_existente.id;
    v_status := 'sem_alteracao';
  ELSE
    INSERT INTO public.catalogos_fiscais_cargas (
      origem, status, checksum, contagens, houve_alteracao,
      vinculos_normalizados, criticos, duracao_ms, mensagem
    ) VALUES (
      p_origem, 'ok', v_checksum, v_contagens, true,
      v_vinculos, v_criticos,
      (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int,
      format('Nova versão dos catálogos fiscais (%s vínculos normalizados)', v_vinculos)
    )
    RETURNING id INTO v_id;
    v_status := 'ok';
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'status', v_status,
    'checksum', v_checksum,
    'contagens', v_contagens,
    'vinculos_normalizados', v_vinculos,
    'criticos', v_criticos,
    'last_updated', now(),
    'duracao_ms', (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_failed_login(p_email text, p_ip_address inet DEFAULT NULL::inet) RETURNS TABLE(is_now_locked boolean, lockout_seconds integer, total_attempts integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_record login_attempts%ROWTYPE;
  v_new_count integer;
  v_lockout_duration interval;
BEGIN
  SELECT * INTO v_record
  FROM login_attempts
  WHERE email = lower(p_email)
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  -- Reset if first attempt was more than 24 hours ago
  IF v_record IS NOT NULL AND v_record.first_attempt_at < now() - interval '24 hours' THEN
    DELETE FROM login_attempts WHERE email = lower(p_email);
    v_record := NULL;
  END IF;

  IF v_record IS NULL THEN
    -- First failed attempt
    INSERT INTO login_attempts (email, ip_address, attempt_count)
    VALUES (lower(p_email), p_ip_address, 1);
    
    RETURN QUERY SELECT false, 0, 1;
    RETURN;
  END IF;

  v_new_count := v_record.attempt_count + 1;

  -- Calculate exponential lockout after 5 attempts
  -- 5 attempts: 30 seconds
  -- 6 attempts: 1 minute
  -- 7 attempts: 2 minutes
  -- 8 attempts: 4 minutes
  -- 9 attempts: 8 minutes
  -- 10+ attempts: 15 minutes max
  IF v_new_count >= 5 THEN
    v_lockout_duration := (30 * power(2, LEAST(v_new_count - 5, 5)))::integer * interval '1 second';
    IF v_lockout_duration > interval '15 minutes' THEN
      v_lockout_duration := interval '15 minutes';
    END IF;
    
    UPDATE login_attempts
    SET 
      attempt_count = v_new_count,
      last_attempt_at = now(),
      locked_until = now() + v_lockout_duration,
      ip_address = COALESCE(p_ip_address, login_attempts.ip_address)
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT 
      true, 
      EXTRACT(EPOCH FROM v_lockout_duration)::integer,
      v_new_count;
    RETURN;
  END IF;

  -- Not yet at lockout threshold
  UPDATE login_attempts
  SET 
    attempt_count = v_new_count,
    last_attempt_at = now(),
    ip_address = COALESCE(p_ip_address, login_attempts.ip_address)
  WHERE id = v_record.id;

  RETURN QUERY SELECT false, 0, v_new_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_failed_login_v2(p_email text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS TABLE(is_locked boolean, lockout_seconds integer, attempt_count integer, is_suspicious boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_record login_attempts%ROWTYPE;
  v_new_count integer;
  v_lockout_duration interval;
  v_is_suspicious boolean := false;
  v_block_reason text;
BEGIN
  -- Verificar padrões suspeitos: mesmo IP tentando múltiplos emails
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(DISTINCT email) > 5 INTO v_is_suspicious
    FROM login_attempts
    WHERE ip_address = p_ip_address
      AND last_attempt_at > now() - interval '10 minutes';
  END IF;

  SELECT * INTO v_record
  FROM login_attempts
  WHERE email = lower(p_email)
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  -- Reset se primeira tentativa foi há mais de 24 horas
  IF v_record IS NOT NULL AND v_record.first_attempt_at < now() - interval '24 hours' THEN
    DELETE FROM login_attempts WHERE email = lower(p_email);
    v_record := NULL;
  END IF;

  IF v_record IS NULL THEN
    INSERT INTO login_attempts (email, ip_address, attempt_count, user_agent, is_suspicious)
    VALUES (lower(p_email), p_ip_address, 1, p_user_agent, v_is_suspicious);
    
    RETURN QUERY SELECT false, 0, 1, v_is_suspicious;
    RETURN;
  END IF;

  v_new_count := v_record.attempt_count + 1;

  -- Rate limiting RIGOROSO:
  -- 3 tentativas: 1 minuto
  -- 4 tentativas: 5 minutos
  -- 5 tentativas: 15 minutos
  -- 6 tentativas: 30 minutos
  -- 7 tentativas: 1 hora
  -- 8+ tentativas: 2 horas
  IF v_new_count >= 3 THEN
    CASE 
      WHEN v_new_count = 3 THEN 
        v_lockout_duration := interval '1 minute';
        v_block_reason := 'Múltiplas tentativas incorretas';
      WHEN v_new_count = 4 THEN 
        v_lockout_duration := interval '5 minutes';
        v_block_reason := 'Tentativas persistentes';
      WHEN v_new_count = 5 THEN 
        v_lockout_duration := interval '15 minutes';
        v_block_reason := 'Possível ataque de força bruta';
      WHEN v_new_count = 6 THEN 
        v_lockout_duration := interval '30 minutes';
        v_block_reason := 'Ataque de força bruta detectado';
      WHEN v_new_count = 7 THEN 
        v_lockout_duration := interval '1 hour';
        v_block_reason := 'Ataque persistente';
      ELSE 
        v_lockout_duration := interval '2 hours';
        v_block_reason := 'Conta sob ataque - bloqueio estendido';
    END CASE;
    
    -- Se suspeito, dobrar tempo de lockout
    IF v_is_suspicious OR v_record.is_suspicious THEN
      v_lockout_duration := v_lockout_duration * 2;
      v_block_reason := v_block_reason || ' (atividade suspeita)';
    END IF;
    
    UPDATE login_attempts
    SET 
      attempt_count = v_new_count,
      last_attempt_at = now(),
      locked_until = now() + v_lockout_duration,
      ip_address = COALESCE(p_ip_address, login_attempts.ip_address),
      user_agent = COALESCE(p_user_agent, login_attempts.user_agent),
      is_suspicious = v_is_suspicious OR login_attempts.is_suspicious,
      block_reason = v_block_reason
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT 
      true, 
      EXTRACT(EPOCH FROM v_lockout_duration)::integer,
      v_new_count,
      v_is_suspicious OR v_record.is_suspicious;
    RETURN;
  END IF;

  UPDATE login_attempts
  SET 
    attempt_count = v_new_count,
    last_attempt_at = now(),
    ip_address = COALESCE(p_ip_address, login_attempts.ip_address),
    user_agent = COALESCE(p_user_agent, login_attempts.user_agent),
    is_suspicious = v_is_suspicious OR login_attempts.is_suspicious
  WHERE id = v_record.id;

  RETURN QUERY SELECT false, 0, v_new_count, v_is_suspicious;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_auditoria_config(_tipo_acao text, _empresa_id uuid DEFAULT NULL::uuid, _detalhes jsonb DEFAULT '{}'::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        details,
        new_data,
        created_at
    ) VALUES (
        v_user_id,
        _tipo_acao,
        'config_change',
        'Config change for empresa ' || COALESCE(_empresa_id::text, 'global'),
        _detalhes,
        now()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_evento_cobranca(p_conta_id uuid, p_evento text, p_mensagem text DEFAULT NULL::text, p_canal text DEFAULT NULL::text, p_destinatario text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_id uuid;
  v_empresa uuid;
BEGIN
  SELECT empresa_id INTO v_empresa FROM public.contas_receber WHERE id = p_conta_id;

  INSERT INTO public.historico_cobranca (
    conta_receber_id, empresa_id, evento, mensagem, canal, destinatario, metadata, created_at
  ) VALUES (
    p_conta_id, v_empresa, p_evento, p_mensagem, p_canal, p_destinatario, COALESCE(p_metadata, '{}'::jsonb), now()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_evento_pagar(p_conta_id uuid, p_tipo text, p_mensagem text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_uid uuid := (select auth.uid());
  v_empresa uuid;
  v_found boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticacao requerida';
  END IF;
  IF p_conta_id IS NULL THEN
    RAISE EXCEPTION 'Conta nao informada';
  END IF;

  SELECT true, cp.empresa_id INTO v_found, v_empresa
  FROM public.contas_pagar cp WHERE cp.id = p_conta_id;

  IF NOT COALESCE(v_found, false) THEN
    RAISE EXCEPTION 'Conta a pagar inexistente';
  END IF;
  IF v_empresa IS NOT NULL AND NOT public.empresa_acessivel(v_empresa) THEN
    RAISE EXCEPTION 'Acesso negado a empresa da conta informada';
  END IF;

  INSERT INTO public.audit_logs (
    user_id, table_name, record_id, action, details, new_data, created_at
  ) VALUES (
    v_uid,
    'contas_pagar',
    p_conta_id,
    COALESCE(p_tipo, 'evento'),
    p_mensagem,
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_evento_receber(p_conta_id uuid, p_evento text DEFAULT NULL::text, p_detalhes jsonb DEFAULT '{}'::jsonb, p_tipo text DEFAULT 'sistema'::text, p_mensagem text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_uid uuid := (select auth.uid());
  v_empresa uuid;
  v_found boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticacao requerida';
  END IF;
  IF p_conta_id IS NULL THEN
    RAISE EXCEPTION 'Conta nao informada';
  END IF;

  SELECT true, cr.empresa_id INTO v_found, v_empresa
  FROM public.contas_receber cr WHERE cr.id = p_conta_id;

  IF NOT COALESCE(v_found, false) THEN
    RAISE EXCEPTION 'Conta a receber inexistente';
  END IF;
  IF v_empresa IS NOT NULL AND NOT public.empresa_acessivel(v_empresa) THEN
    RAISE EXCEPTION 'Acesso negado a empresa da conta informada';
  END IF;

  INSERT INTO public.logs_baixa_automatica (
    user_id, conta_receber_id, resultado, mensagem, detalhes, created_at
  ) VALUES (
    v_uid,
    p_conta_id,
    COALESCE(p_tipo, p_evento, 'evento'),
    p_mensagem,
    COALESCE(NULLIF(p_metadata, '{}'::jsonb), p_detalhes, '{}'::jsonb),
    now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reprocess_dlq(p_dlq_id uuid, p_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_dlq public.webhook_dlq%ROWTYPE;
  v_new_log_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem reprocessar DLQ.';
  END IF;

  SELECT * INTO v_dlq FROM public.webhook_dlq WHERE id = p_dlq_id AND resolved_at IS NULL;
  IF v_dlq IS NULL THEN
    RAISE EXCEPTION 'DLQ item não encontrado ou já resolvido';
  END IF;

  INSERT INTO public.webhooks_log (
    source, event_type, external_id, payload, status,
    attempts, next_retry_at
  ) VALUES (
    v_dlq.source, v_dlq.event_type, v_dlq.external_id, v_dlq.payload,
    'pending', 0, now()
  ) RETURNING id INTO v_new_log_id;

  UPDATE public.webhook_dlq
     SET resolved_at = now(),
         resolved_by = auth.uid(),
         notes = COALESCE(p_notes, notes)
   WHERE id = p_dlq_id;

  RETURN v_new_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  UPDATE public.login_attempts
  SET attempt_count = 0,
      success = true,
      last_attempt_at = now()
  WHERE email = _email;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_integrity_alert(p_alert_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_rows integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.integrity_alerts
  SET resolved_at = now(),
      resolved_by = auth.uid(),
      resolved_reason = 'manual: encerrado por administrador'
  WHERE id = p_alert_id
    AND resolved_at IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_sso_providers_for_domain(p_domain text) RETURNS TABLE(id uuid, nome text, tipo text, preset text, force_sso_for_domains boolean, ordem integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT
    sp.id,
    sp.nome,
    sp.tipo,
    sp.preset,
    sp.force_sso_for_domains,
    sp.ordem
  FROM public.sso_providers sp
  WHERE sp.ativo = true
    AND length(trim(coalesce(p_domain, ''))) BETWEEN 3 AND 253
    AND trim(lower(p_domain)) = ANY (
      SELECT lower(domain) FROM unnest(sp.allowed_domains) AS domain
    )
  ORDER BY sp.ordem ASC, sp.nome ASC;
$$;

CREATE OR REPLACE FUNCTION public.run_observability_rpc(_function_name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _t0 TIMESTAMPTZ := clock_timestamp();
  _dur NUMERIC;
  _allowed TEXT[] := ARRAY[
    'monitor_table_bloat',
    'snapshot_table_bloat',
    'refresh_performance_alerts_weekly',
    'sefaz_run_observability_checks',
    'capture_pg_stat_statements_baseline',
    'capture_slow_queries'
  ];
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF NOT (_function_name = ANY(_allowed)) THEN
    RAISE EXCEPTION 'function % not allowed', _function_name;
  END IF;

  EXECUTE format('SELECT public.%I()', _function_name);

  _dur := EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000;
  PERFORM public.log_rpc_observability_call(
    _function_name, _dur, true, NULL, NULL, jsonb_build_object('via','run_observability_rpc'));
EXCEPTION WHEN OTHERS THEN
  _dur := EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000;
  PERFORM public.log_rpc_observability_call(
    _function_name, _dur, false, SQLSTATE, SQLERRM, jsonb_build_object('via','run_observability_rpc'));
  RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.sefaz_cursor_advance(p_cnpj text, p_ambiente public.sefaz_ambiente, p_novo_nsu bigint, p_max_nsu bigint DEFAULT NULL::bigint, p_status text DEFAULT NULL::text, p_erro text DEFAULT NULL::text) RETURNS TABLE(ultimo_nsu bigint, advanced boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_prev BIGINT;
  v_advanced BOOLEAN := false;
BEGIN
  INSERT INTO public.sefaz_dfe_cursor (cnpj, ambiente, ultimo_nsu, max_nsu, ultima_consulta, ultimo_status, ultimo_erro)
  VALUES (p_cnpj, p_ambiente, GREATEST(p_novo_nsu, 0), COALESCE(p_max_nsu, p_novo_nsu), now(), p_status, p_erro)
  ON CONFLICT (cnpj, ambiente) DO NOTHING;

  SELECT c.ultimo_nsu INTO v_prev
  FROM public.sefaz_dfe_cursor c
  WHERE c.cnpj = p_cnpj AND c.ambiente = p_ambiente
  FOR UPDATE;

  IF p_novo_nsu > COALESCE(v_prev, 0) THEN
    UPDATE public.sefaz_dfe_cursor
      SET ultimo_nsu = p_novo_nsu,
          max_nsu = GREATEST(COALESCE(max_nsu, 0), COALESCE(p_max_nsu, p_novo_nsu)),
          ultima_consulta = now(),
          ultimo_status = COALESCE(p_status, ultimo_status),
          ultimo_erro = p_erro,
          retry_count = 0,
          last_error_at = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
          updated_at = now()
      WHERE cnpj = p_cnpj AND ambiente = p_ambiente;
    v_advanced := true;
  ELSE
    UPDATE public.sefaz_dfe_cursor
      SET ultima_consulta = now(),
          ultimo_status = COALESCE(p_status, ultimo_status),
          ultimo_erro = p_erro,
          last_error_at = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
          updated_at = now()
      WHERE cnpj = p_cnpj AND ambiente = p_ambiente;
  END IF;

  RETURN QUERY SELECT COALESCE(v_prev, p_novo_nsu, 0), v_advanced;
END;
$$;

CREATE OR REPLACE FUNCTION public.sefaz_detect_nsu_gaps(p_max_gap bigint DEFAULT 5) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hour  timestamptz := date_trunc('hour', now());
  v_count integer := 0;
BEGIN
  WITH ordered AS (
    SELECT
      id,
      cnpj_destinatario AS cnpj,
      ambiente::text    AS ambiente,
      nsu,
      LAG(nsu) OVER (PARTITION BY cnpj_destinatario, ambiente ORDER BY nsu) AS prev_nsu
    FROM public.nfe_recebidas
    WHERE nsu IS NOT NULL
      AND created_at > now() - interval '7 days'
  ),
  furos AS (
    SELECT id, cnpj, ambiente, nsu, prev_nsu, (nsu - prev_nsu) AS salto
    FROM ordered
    WHERE prev_nsu IS NOT NULL AND (nsu - prev_nsu) > p_max_gap
  ),
  resumo AS (
    SELECT
      count(*)::bigint                                   AS total,
      max(salto)                                         AS max_gap,
      (array_agg(id ORDER BY nsu DESC))[1:5]             AS amostras,
      jsonb_agg(DISTINCT jsonb_build_object('cnpj', cnpj, 'ambiente', ambiente)) AS escopos
    FROM furos
    HAVING count(*) > 0
  )
  INSERT INTO public.integrity_alerts
    (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids, metadata)
  SELECT
    'nfe_sefaz',
    'nsu_gap_detected',
    -- (b) severidade dentro do CHECK
    CASE WHEN r.max_gap > 50 THEN 'critical'
         WHEN r.max_gap > 20 THEN 'warning'
         ELSE 'info' END,
    v_hour,
    r.total,
    format('Detectados %s gaps na sequência NSU nos últimos 7 dias (maior salto = %s, limite = %s)',
           r.total, r.max_gap, p_max_gap),
    r.amostras,                                   -- (a) uuid[] de nfe_recebidas
    jsonb_build_object('max_gap', r.max_gap, 'threshold', p_max_gap, 'escopos', r.escopos)
  FROM resumo r
  ON CONFLICT (domain, invariant, alert_hour) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.sefaz_process_batch(p_cnpj text, p_ambiente text, p_empresa_id uuid, p_novo_nsu bigint, p_max_nsu bigint, p_status text, p_erro text, p_docs jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cursor_atual BIGINT;
  v_doc          JSONB;
  v_payload      JSONB;
  v_kind         TEXT;
  v_novos        INT := 0;
  v_eventos      INT := 0;
  v_ignorados    INT := 0;
  v_inserted_id  UUID;
BEGIN
  -- Lock do cursor por (cnpj, ambiente) para serializar processamentos concorrentes.
  SELECT ultimo_nsu INTO v_cursor_atual
  FROM public.sefaz_dfe_cursor
  WHERE cnpj = p_cnpj AND ambiente = p_ambiente::ambiente_sefaz
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.sefaz_dfe_cursor (cnpj, ambiente, ultimo_nsu, max_nsu, retry_count, next_run_at, circuit_open)
    VALUES (p_cnpj, p_ambiente::ambiente_sefaz, 0, 0, 0, now(), false)
    RETURNING ultimo_nsu INTO v_cursor_atual;
  END IF;

  -- Processa docs (upsert idempotente por chave/evento).
  IF p_docs IS NOT NULL AND jsonb_typeof(p_docs) = 'array' THEN
    FOR v_doc IN SELECT * FROM jsonb_array_elements(p_docs)
    LOOP
      v_kind    := v_doc->>'kind';
      v_payload := v_doc->'payload';

      IF v_kind = 'nfe' THEN
        INSERT INTO public.nfe_recebidas (
          empresa_id, chave_acesso, cnpj_emitente, razao_emitente, ie_emitente, uf_emitente,
          cnpj_destinatario, numero, serie, modelo, data_emissao, valor_total,
          digest_value, tipo_documento, schema_tipo, nsu, ambiente,
          xml_path, xml_completo
        ) VALUES (
          p_empresa_id,
          v_payload->>'chave_acesso',
          v_payload->>'cnpj_emitente',
          v_payload->>'razao_emitente',
          v_payload->>'ie_emitente',
          v_payload->>'uf_emitente',
          v_payload->>'cnpj_destinatario',
          v_payload->>'numero',
          v_payload->>'serie',
          v_payload->>'modelo',
          NULLIF(v_payload->>'data_emissao','')::timestamptz,
          NULLIF(v_payload->>'valor_total','')::numeric,
          v_payload->>'digest_value',
          v_payload->>'tipo_documento',
          (v_payload->>'schema_tipo')::nfe_schema_tipo,
          (v_doc->>'nsu')::bigint,
          p_ambiente::ambiente_sefaz,
          v_payload->>'xml_path',
          COALESCE((v_payload->>'xml_completo')::boolean, true)
        )
        ON CONFLICT (chave_acesso) DO NOTHING
        RETURNING id INTO v_inserted_id;

        IF v_inserted_id IS NOT NULL THEN
          v_novos := v_novos + 1;
        ELSE
          v_ignorados := v_ignorados + 1;
        END IF;
        v_inserted_id := NULL;

      ELSIF v_kind = 'evento' THEN
        INSERT INTO public.nfe_eventos (
          chave_acesso, tipo_evento, codigo_evento, sequencial,
          data_evento, protocolo, justificativa,
          status_retorno, motivo_retorno
        ) VALUES (
          v_payload->>'chave_acesso',
          v_payload->>'tipo_evento',
          v_payload->>'codigo_evento',
          COALESCE((v_payload->>'sequencial')::int, 1),
          COALESCE(NULLIF(v_payload->>'data_evento','')::timestamptz, now()),
          v_payload->>'protocolo',
          v_payload->>'justificativa',
          v_payload->>'status_retorno',
          v_payload->>'motivo_retorno'
        )
        ON CONFLICT (chave_acesso, tipo_evento, sequencial) DO NOTHING
        RETURNING id INTO v_inserted_id;

        IF v_inserted_id IS NOT NULL THEN
          v_eventos := v_eventos + 1;
        ELSE
          v_ignorados := v_ignorados + 1;
        END IF;
        v_inserted_id := NULL;

      ELSE
        RAISE EXCEPTION 'sefaz_process_batch: kind desconhecido "%"', v_kind;
      END IF;
    END LOOP;
  END IF;

  -- Cursor NUNCA regride. Só avança se novo NSU > atual.
  IF p_novo_nsu > v_cursor_atual THEN
    UPDATE public.sefaz_dfe_cursor
       SET ultimo_nsu     = p_novo_nsu,
           max_nsu        = GREATEST(max_nsu, COALESCE(p_max_nsu, max_nsu)),
           ultimo_status  = p_status,
           ultimo_erro    = p_erro,
           ultima_consulta= now(),
           retry_count    = CASE WHEN p_erro IS NULL THEN 0 ELSE retry_count END,
           last_error_at  = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
           updated_at     = now()
     WHERE cnpj = p_cnpj AND ambiente = p_ambiente::ambiente_sefaz;
  ELSE
    -- Sem avanço: apenas registra status/erro (útil para rate_limit, empty, etc.)
    UPDATE public.sefaz_dfe_cursor
       SET ultimo_status  = p_status,
           ultimo_erro    = p_erro,
           ultima_consulta= now(),
           last_error_at  = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
           updated_at     = now()
     WHERE cnpj = p_cnpj AND ambiente = p_ambiente::ambiente_sefaz;
  END IF;

  RETURN jsonb_build_object(
    'cursor_antes',    v_cursor_atual,
    'cursor_depois',   GREATEST(v_cursor_atual, p_novo_nsu),
    'novos',           v_novos,
    'eventos',         v_eventos,
    'ignorados',       v_ignorados
  );
END;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.set_empresa_id_from_profile() CASCADE;
CREATE OR REPLACE FUNCTION public.set_empresa_id_from_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    SELECT p.empresa_id INTO NEW.empresa_id
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.silenciar_alerta_erro_frontend(p_assinatura text, p_horas integer DEFAULT 24, p_motivo text DEFAULT NULL::text) RETURNS public.frontend_error_alert_state
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sig text := left(btrim(coalesce(p_assinatura, '')), 200);
  v_horas integer;
  v_ate timestamptz;
  v_antes jsonb;
  v_row public.frontend_error_alert_state;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  IF v_sig = '' THEN
    RAISE EXCEPTION 'assinatura obrigatoria' USING ERRCODE = '22023';
  END IF;

  -- p_horas <= 0 (ou NULL) reativa os alertas; teto de 30 dias evita silêncio eterno
  v_horas := least(greatest(coalesce(p_horas, 0), 0), 720);
  v_ate := CASE WHEN v_horas = 0 THEN NULL ELSE now() + make_interval(hours => v_horas) END;

  SELECT to_jsonb(s) INTO v_antes
  FROM public.frontend_error_alert_state s
  WHERE s.assinatura = v_sig;

  INSERT INTO public.frontend_error_alert_state AS st (assinatura, silenciado_ate)
  VALUES (v_sig, v_ate)
  ON CONFLICT (assinatura) DO UPDATE SET silenciado_ate = EXCLUDED.silenciado_ate
  RETURNING st.* INTO v_row;

  INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data, details)
  VALUES (
    v_uid,
    (auth.jwt() ->> 'email'),
    CASE WHEN v_ate IS NULL THEN 'unmute_frontend_error_alert' ELSE 'mute_frontend_error_alert' END,
    'frontend_error_alert_state',
    v_sig,
    v_antes,
    to_jsonb(v_row),
    left(coalesce(nullif(btrim(coalesce(p_motivo, '')), ''), 'sem motivo informado'), 500)
  );

  RETURN v_row;
END
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.sync_regime_tributario_empresa() CASCADE;
CREATE OR REPLACE FUNCTION public.sync_regime_tributario_empresa() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_regime TEXT;
BEGIN
  IF NOT COALESCE(NEW.ativo, true) THEN
    RETURN NEW;
  END IF;
  v_regime := lower(regexp_replace(btrim(NEW.regime_nome), '\s+', '_', 'g'));
  IF v_regime IN ('mei','simples_nacional','lucro_presumido','lucro_real','arbitrado') THEN
    UPDATE public.empresas SET regime_tributario = v_regime WHERE id = NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_cron_job(job_id bigint, is_active boolean) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'cron'
    AS $$
DECLARE
  v_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem gerenciar tarefas agendadas';
  END IF;

  SELECT jobname INTO v_name FROM cron.job WHERE jobid = job_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Tarefa agendada % não encontrada', job_id;
  END IF;

  PERFORM cron.alter_job(job_id := job_id, active := is_active);
  RETURN true;
END;
$$;

-- same name, different sig — drop first
DROP FUNCTION IF EXISTS public.trigger_bitrix24_sync() CASCADE;
CREATE OR REPLACE FUNCTION public.trigger_bitrix24_sync() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  sync_record RECORD;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if this order has a Bitrix24 deal linked
    SELECT * INTO sync_record FROM bitrix24_sync WHERE order_id = NEW.id LIMIT 1;
    
    -- Also check if deal_id is set directly on the order
    IF sync_record IS NOT NULL OR NEW.bitrix24_deal_id IS NOT NULL THEN
      -- Insert a sync request that will be processed
      INSERT INTO bitrix24_sync (order_id, deal_id, sync_status, last_synced_at)
      VALUES (
        NEW.id, 
        COALESCE(sync_record.deal_id, NEW.bitrix24_deal_id),
        'pending',
        now()
      )
      ON CONFLICT (order_id) 
      DO UPDATE SET 
        sync_status = 'pending',
        last_synced_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.use_reset_token(p_token_hash text, p_ip_address inet DEFAULT NULL::inet) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE password_reset_tokens
  SET 
    used_at = now(),
    ip_address = COALESCE(p_ip_address, password_reset_tokens.ip_address)
  WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND used_at IS NULL;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.watch_cron_failures(p_lookback_minutes integer DEFAULT 90, p_stale_hours integer DEFAULT 36) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'cron', 'pg_catalog'
    AS $$
DECLARE
  v_lookback integer := LEAST(GREATEST(COALESCE(p_lookback_minutes, 90), 5), 10080);
  v_stale    integer := LEAST(GREATEST(COALESCE(p_stale_hours, 36), 2), 720);
  v_fail     integer := 0;
  v_stalled  integer := 0;
  v_nunca    integer := 0;
  v_resolv   integer := 0;
  v_started  timestamptz := clock_timestamp();
BEGIN
  -- 1) Falhas recentes, agregadas por job.
  WITH falhas AS (
    SELECT
      j.jobname,
      count(*)::numeric AS total,
      max(d.end_time)   AS ultima,
      (array_agg(d.return_message ORDER BY d.start_time DESC))[1] AS msg
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
    WHERE d.status = 'failed'
      AND d.start_time >= now() - make_interval(mins => v_lookback)
    GROUP BY j.jobname
  ), ins AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, sample_count, metadata)
    SELECT
      'cron',
      'job_failed:' || f.jobname,
      'critical',
      format('Automação "%s" falhou %s vez(es) nos últimos %s min', f.jobname, f.total, v_lookback),
      f.total,
      f.total::int,
      jsonb_build_object(
        'jobname', f.jobname,
        'last_failure_at', f.ultima,
        'return_message', left(coalesce(f.msg, ''), 500)
      )
    FROM falhas f
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO v_fail FROM ins;

  -- 2) Jobs sem execução, com tolerância derivada da expressão cron.
  WITH base AS (
    SELECT
      j.jobname,
      j.schedule,
      max(d.start_time) AS ultima,
      CASE
        WHEN split_part(j.schedule, ' ', 3) <> '*' THEN 24 * 35
        WHEN split_part(j.schedule, ' ', 5) <> '*' THEN 24 * 8
        WHEN split_part(j.schedule, ' ', 2) <> '*' THEN v_stale
        ELSE 3
      END AS tolerancia_h
    FROM cron.job j
    LEFT JOIN cron.job_run_details d ON d.jobid = j.jobid
    WHERE j.active
    GROUP BY j.jobname, j.schedule
  ),
  ins2 AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, metadata)
    SELECT
      'cron',
      'job_stale:' || b.jobname,
      'warning',
      format('Automação "%s" (%s) sem execução há mais de %s h',
             b.jobname, b.schedule, b.tolerancia_h),
      round(EXTRACT(epoch FROM (now() - b.ultima)) / 3600.0, 2),
      jsonb_build_object(
        'jobname', b.jobname, 'schedule', b.schedule,
        'last_run_at', b.ultima, 'tolerancia_horas', b.tolerancia_h
      )
    FROM base b
    WHERE b.ultima IS NOT NULL
      AND b.ultima < now() - make_interval(hours => b.tolerancia_h)
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  ),
  ins3 AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, metadata)
    SELECT
      'cron',
      'job_never_ran:' || b.jobname,
      'info',
      format('Automação "%s" (%s) ainda não possui execução registrada',
             b.jobname, b.schedule),
      0,
      jsonb_build_object(
        'jobname', b.jobname, 'schedule', b.schedule,
        'tolerancia_horas', b.tolerancia_h
      )
    FROM base b
    WHERE b.ultima IS NULL
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  )
  SELECT
    (SELECT count(*)::int FROM ins2),
    (SELECT count(*)::int FROM ins3)
  INTO v_stalled, v_nunca;

  -- 3) Encerramento automático: o alerta só existe enquanto o sintoma existir.
  --    Um job que voltou a rodar com sucesso depois do alerta deixa de ser incidente.
  WITH ultimo_ok AS (
    SELECT j.jobname, max(d.end_time) AS ok_em
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
    WHERE d.status = 'succeeded'
    GROUP BY j.jobname
  ), fechados AS (
    UPDATE public.performance_alerts a
    SET resolved_at = now(),
        resolved_reason = format('Automação "%s" executou com sucesso em %s',
                                 u.jobname, to_char(u.ok_em, 'DD/MM/YYYY HH24:MI'))
    FROM ultimo_ok u
    WHERE a.source = 'cron'
      AND a.resolved_at IS NULL
      AND a.alert_key IN ('job_failed:' || u.jobname,
                          'job_stale:' || u.jobname,
                          'job_never_ran:' || u.jobname)
      AND u.ok_em > a.created_at
    RETURNING 1
  )
  SELECT count(*)::int INTO v_resolv FROM fechados;

  RETURN jsonb_build_object(
    'ok', true,
    'lookback_minutes', v_lookback,
    'stale_hours_default', v_stale,
    'novos_alertas_falha', v_fail,
    'novos_alertas_sem_execucao', v_stalled,
    'novos_alertas_nunca_executou', v_nunca,
    'alertas_encerrados', v_resolv,
    'duration_ms', round(EXTRACT(epoch FROM (clock_timestamp() - v_started)) * 1000)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.webhook_claim(p_source text, p_external_id text, p_event_type text, p_payload jsonb, p_max_attempts integer DEFAULT 5) RETURNS TABLE(id uuid, status text, attempts integer, already_processed boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
BEGIN
  IF p_source IS NULL OR length(trim(p_source)) = 0 THEN
    RAISE EXCEPTION 'source is required';
  END IF;

  IF p_external_id IS NULL THEN
    INSERT INTO public.webhooks_log(source, external_id, event_type, payload, status, attempts, max_attempts)
    VALUES (p_source, NULL, p_event_type, COALESCE(p_payload, '{}'::jsonb), 'processing', 1, GREATEST(1, p_max_attempts))
    RETURNING * INTO v_row;
    id := v_row.id; status := v_row.status; attempts := v_row.attempts; already_processed := false;
    RETURN NEXT; RETURN;
  END IF;

  INSERT INTO public.webhooks_log(source, external_id, event_type, payload, status, attempts, max_attempts)
  VALUES (p_source, p_external_id, p_event_type, COALESCE(p_payload, '{}'::jsonb), 'processing', 1, GREATEST(1, p_max_attempts))
  ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NOT NULL THEN
    id := v_row.id; status := v_row.status; attempts := v_row.attempts; already_processed := false;
    RETURN NEXT; RETURN;
  END IF;

  SELECT * INTO v_row
    FROM public.webhooks_log AS w
   WHERE w.source = p_source AND w.external_id = p_external_id
   FOR UPDATE;

  IF v_row.status = 'success' THEN
    id := v_row.id; status := v_row.status; attempts := v_row.attempts; already_processed := true;
    RETURN NEXT; RETURN;
  END IF;

  UPDATE public.webhooks_log AS w
     SET status        = 'processing',
         attempts      = w.attempts + 1,
         last_error_at = NULL
   WHERE w.id = v_row.id
  RETURNING * INTO v_row;

  id := v_row.id; status := v_row.status; attempts := v_row.attempts; already_processed := false;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.webhook_dequeue_retries(p_limit integer DEFAULT 25) RETURNS SETOF public.webhooks_log
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  UPDATE public.webhooks_log
     SET status = 'processing'
   WHERE id IN (
     SELECT id
       FROM public.webhooks_log
      WHERE status IN ('pending','retrying')
        AND next_retry_at IS NOT NULL
        AND next_retry_at <= now()
      ORDER BY next_retry_at ASC
      LIMIT GREATEST(1, p_limit)
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.webhook_mark_failure(p_id uuid, p_error text, p_retryable boolean DEFAULT true) RETURNS TABLE(status text, will_retry boolean, next_retry_at timestamp with time zone, dlq_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
  v_backoff INTERVAL;
  v_dlq UUID;
  v_final_status TEXT;
  v_will_retry BOOLEAN := false;
  v_next TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_row FROM public.webhooks_log WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'webhook % not found', p_id;
  END IF;

  IF p_retryable AND v_row.attempts < v_row.max_attempts THEN
    -- 2^attempts minutos, cap 60min
    v_backoff := make_interval(mins => LEAST(60, POWER(2, v_row.attempts)::INT));
    v_next := now() + v_backoff;
    v_final_status := 'retrying';
    v_will_retry := true;

    UPDATE public.webhooks_log
       SET status        = 'retrying',
           error_message = p_error,
           last_error_at = now(),
           next_retry_at = v_next
     WHERE id = p_id;
  ELSE
    -- Sem retry: promove ao DLQ
    v_final_status := 'dead';
    INSERT INTO public.webhook_dlq(source, event_type, external_id, payload, error_message, attempts)
    VALUES (v_row.source, v_row.event_type, v_row.external_id, v_row.payload, p_error, v_row.attempts)
    RETURNING id INTO v_dlq;

    UPDATE public.webhooks_log
       SET status        = 'dead',
           error_message = p_error,
           last_error_at = now(),
           next_retry_at = NULL,
           dlq_id        = v_dlq
     WHERE id = p_id;
  END IF;

  RETURN QUERY SELECT v_final_status, v_will_retry, v_next, v_dlq;
END;
$$;

CREATE OR REPLACE FUNCTION public.webhook_mark_success(p_id uuid, p_response jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE public.webhooks_log
     SET status        = 'success',
         processed_at  = now(),
         last_response = p_response,
         error_message = NULL,
         next_retry_at = NULL
   WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.webhook_replay(p_id uuid) RETURNS public.webhooks_log
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_row public.webhooks_log%ROWTYPE;
BEGIN
  -- Guarda: só admin ou service_role (auth.uid() nulo).
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized: admin role required to replay webhooks';
  END IF;

  UPDATE public.webhooks_log
     SET status        = 'pending',
         next_retry_at = now(),
         attempts      = LEAST(attempts, max_attempts - 1),
         error_message = NULL,
         last_error_at = NULL,
         dlq_id        = NULL
   WHERE id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'webhook % not found', p_id;
  END IF;

  -- Se veio de DLQ, marca DLQ como resolvido.
  IF v_row.dlq_id IS NOT NULL THEN
    UPDATE public.webhook_dlq
       SET resolved_at = now(),
           notes = COALESCE(notes,'') || E'\nRe-enfileirado via webhook_replay em ' || now()::text
     WHERE id = v_row.dlq_id;
  END IF;

  RETURN v_row;
END;
$$;

-- SECAO 2: Triggers ausentes (151)

CREATE OR REPLACE TRIGGER set_updated_at_d9c737e24ed42de7266f BEFORE UPDATE ON public.acordos_parcelamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_alert_configurations_set_empresa BEFORE INSERT ON public.alert_configurations FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_default();

CREATE OR REPLACE TRIGGER trg_audit_alert_configurations AFTER INSERT OR DELETE OR UPDATE ON public.alert_configurations FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER update_alert_config_updated_at BEFORE UPDATE ON public.alert_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_alertas_set_empresa BEFORE INSERT ON public.alertas FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_from_profile();

CREATE OR REPLACE TRIGGER set_updated_at_fb6d54b516a66b2b99f3 BEFORE UPDATE ON public.alertas_preditivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_alerts_set_empresa BEFORE INSERT ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_default();

CREATE OR REPLACE TRIGGER trg_aliq_inter_updated_at BEFORE UPDATE ON public.aliquotas_interestaduais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_aliq_internas_updated_at BEFORE UPDATE ON public.aliquotas_internas_uf FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_aliq_iss_updated_at BEFORE UPDATE ON public.aliquotas_iss_municipal FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_audit_allowed_countries AFTER INSERT OR DELETE OR UPDATE ON public.allowed_countries FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER trg_audit_allowed_ips AFTER INSERT OR DELETE OR UPDATE ON public.allowed_ips FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER set_updated_at_f7bd4a317caf2651584f BEFORE UPDATE ON public.anomalias_detectadas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_414e25aed7d9071a4748 BEFORE UPDATE ON public.apuracoes_tributarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_c9b96759e48801387f71 BEFORE UPDATE ON public.asaas_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_9d8cee55d8b7c2070327 BEFORE UPDATE ON public.asaas_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_60e90ad3dec9516f2ca9 BEFORE UPDATE ON public.asaas_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_4efff01553ff16302e45 BEFORE UPDATE ON public.asaas_reconciliation_suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_358c32867d1f3b611c3b BEFORE UPDATE ON public.asaas_sync_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_750f942dec954ad99332 BEFORE UPDATE ON public.asaas_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER sanitize_auth_log_metadata_trigger BEFORE INSERT ON public.auth_logs FOR EACH ROW EXECUTE FUNCTION public.sanitize_auth_log_metadata();

CREATE OR REPLACE TRIGGER trg_benchmarks_updated_at BEFORE UPDATE ON public.benchmarks_setoriais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_beneficios_updated_at BEFORE UPDATE ON public.beneficios_fiscais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER update_bitrix24_tokens_updated_at BEFORE UPDATE ON public.bitrix24_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_bitrix_tokens_updated_at BEFORE UPDATE ON public.bitrix_oauth_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_bling_tokens_updated_at BEFORE UPDATE ON public.bling_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_6ccc02b67895ed316b66 BEFORE UPDATE ON public.boletos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_b7d9e68ed31698bcfe97 BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_catalogos_fiscais_cargas BEFORE UPDATE ON public.catalogos_fiscais_cargas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_catalogos_health_history_updated_at BEFORE UPDATE ON public.catalogos_tributarios_health_history FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_18e8b04fb0e329ecb61f BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_0d5cf71cba5e923b906a BEFORE UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_0670acdde4e1e38b5669 BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_cnaes_updated_at BEFORE UPDATE ON public.cnaes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_cnpja_cache_updated_at BEFORE UPDATE ON public.cnpja_cache FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_3a25b26abdf52bd44121 BEFORE UPDATE ON public.configuracoes_aprovacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_conformidade_snapshots_updated_at BEFORE UPDATE ON public.conformidade_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_e4fd639d8315ad49b4d1 BEFORE UPDATE ON public.contas_bancarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_891eba3b06036ba9ea7e BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_f4f31d38308fe5dff30a BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_convites_contador_updated_at BEFORE UPDATE ON public.convites_contador FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_0c7ce82e1f5cca97d953 BEFORE UPDATE ON public.custom_field_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_fb9bfe686d34f4bee9a0 BEFORE UPDATE ON public.custom_field_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_408bdc8fafbc18b00290 BEFORE UPDATE ON public.darfs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_elisao_alertas_updated_at BEFORE UPDATE ON public.elisao_alertas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_cred_aud_updated_at BEFORE UPDATE ON public.elisao_creditos_auditoria FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_regras_creditos_updated_at BEFORE UPDATE ON public.elisao_regras_creditos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_elisao_sim_updated_at BEFORE UPDATE ON public.elisao_simulacoes_regime FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_tarefas_elisao_updated_at BEFORE UPDATE ON public.elisao_tarefas_acionaveis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_empresas_unica_padrao BEFORE INSERT OR UPDATE OF is_padrao, ativo ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.empresas_unica_padrao();

CREATE OR REPLACE TRIGGER trg_emp_cert_updated BEFORE UPDATE ON public.empresas_certificados FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE OR REPLACE TRIGGER trg_entregas_obrigacoes_updated_at BEFORE UPDATE ON public.entregas_obrigacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_estrategias_updated_at BEFORE UPDATE ON public.estrategias_elisao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_a78c869af115da2c0dbe BEFORE UPDATE ON public.expert_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_faixas_simples_updated_at BEFORE UPDATE ON public.faixas_simples_nacional FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_fechamentos_updated_at BEFORE UPDATE ON public.fechamentos_tributarios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_24d30bafb2eecf05024f BEFORE UPDATE ON public.fila_cobrancas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_d05a1e8f4af4f67d1bb5 BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_fe_alert_state_updated_at BEFORE UPDATE ON public.frontend_error_alert_state FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_frontend_error_logs_sanitize BEFORE INSERT ON public.frontend_error_logs FOR EACH ROW EXECUTE FUNCTION public.frontend_error_logs_sanitize();

CREATE OR REPLACE TRIGGER trg_audit_geo_blocks AFTER INSERT OR DELETE OR UPDATE ON public.geo_blocks FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER update_geo_blocks_updated_at BEFORE UPDATE ON public.geo_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_glossario_updated_at BEFORE UPDATE ON public.glossario_tributario FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_incentivos_updated_at BEFORE UPDATE ON public.incentivos_fiscais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_integration_secrets_updated_at BEFORE UPDATE ON public.integration_secrets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_integrity_alerts_updated_at BEFORE UPDATE ON public.integrity_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_audit_ip_whitelist AFTER INSERT OR DELETE OR UPDATE ON public.ip_whitelist FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER update_ip_whitelist_updated_at BEFORE UPDATE ON public.ip_whitelist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_itens_iss_updated_at BEFORE UPDATE ON public.itens_lista_iss FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_kpis_operacionais_updated_at BEFORE UPDATE ON public.kpis_operacionais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_lancamento_contabil_before_insert BEFORE INSERT ON public.lancamentos_contabeis FOR EACH ROW EXECUTE FUNCTION public.lancamento_contabil_before_insert();

CREATE OR REPLACE TRIGGER trg_lancamento_contabil_before_update BEFORE UPDATE ON public.lancamentos_contabeis FOR EACH ROW EXECUTE FUNCTION public.lancamento_contabil_before_update();

CREATE OR REPLACE TRIGGER set_updated_at_d7d66ed0673bb8a6cd90 BEFORE UPDATE ON public.logs_conciliacao_retroativa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_metas BEFORE UPDATE ON public.metas_financeiras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_n8n_cfg_updated BEFORE UPDATE ON public.n8n_workflow_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_ncms_updated_at BEFORE UPDATE ON public.ncms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_nfe_rec_updated BEFORE UPDATE ON public.nfe_recebidas FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE OR REPLACE TRIGGER trg_nfe_recebidas_updated_at BEFORE UPDATE ON public.nfe_recebidas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_nf_ocr_updated_at BEFORE UPDATE ON public.notas_fiscais_ocr FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_open_finance BEFORE UPDATE ON public.open_finance_consents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_operacoes_icms_updated_at BEFORE UPDATE ON public.operacoes_icms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_oport_elisao_updated_at BEFORE UPDATE ON public.oportunidades_elisao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_org_membros_updated_at BEFORE UPDATE ON public.organizacao_membros FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_organizacoes_updated_at BEFORE UPDATE ON public.organizacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_overlay_rejeicoes_updated_at BEFORE UPDATE ON public.overlay_rejeicoes_auditoria FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_pag_recorr_updated_at BEFORE UPDATE ON public.pagamentos_recorrentes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_normalizar_tipo_partida BEFORE INSERT OR UPDATE ON public.partidas_contabeis FOR EACH ROW EXECUTE FUNCTION public.normalizar_tipo_partida();

CREATE CONSTRAINT TRIGGER trg_validar_partidas_dobradas AFTER INSERT OR DELETE OR UPDATE ON public.partidas_contabeis DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.validar_partidas_dobradas();

CREATE OR REPLACE TRIGGER trg_invalidate_old_tokens AFTER INSERT ON public.password_reset_tokens FOR EACH ROW EXECUTE FUNCTION public.invalidate_old_tokens();

CREATE OR REPLACE TRIGGER trg_set_token_expiration BEFORE INSERT ON public.password_reset_tokens FOR EACH ROW EXECUTE FUNCTION public.set_token_expiration();

CREATE OR REPLACE TRIGGER trg_per_dcomp_updated_at BEFORE UPDATE ON public.per_dcomp FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER performance_alerts_notify_trigger AFTER INSERT ON public.performance_alerts FOR EACH ROW EXECUTE FUNCTION public.notify_performance_alert_trigger();

CREATE OR REPLACE TRIGGER trg_audit_permissions AFTER INSERT OR DELETE OR UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER trg_pix_template_sync_legacy BEFORE INSERT OR UPDATE ON public.pix_templates FOR EACH ROW EXECUTE FUNCTION public.pix_template_sync_legacy();

CREATE OR REPLACE TRIGGER trg_pix_templates_updated_at BEFORE UPDATE ON public.pix_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_planos_acao_updated_at BEFORE UPDATE ON public.planos_acao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_a3e34a0da7a4b2d1563e BEFORE UPDATE ON public.portal_cliente_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_d970728376beb1370578 BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_prevent_profile_privilege_escalation BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

CREATE OR REPLACE TRIGGER trg_proj_reforma_updated_at BEFORE UPDATE ON public.projecoes_reforma FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_protocolos_st_updated_at BEFORE UPDATE ON public.protocolos_st FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_protocolo_st_ncm_autolink BEFORE INSERT OR UPDATE OF ncm_codigo ON public.protocolos_st_ncms FOR EACH ROW EXECUTE FUNCTION public.protocolo_st_ncm_autolink();

CREATE OR REPLACE TRIGGER trg_protocolos_st_ncms_updated_at BEFORE UPDATE ON public.protocolos_st_ncms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_protocolos_st_ufs_updated_at BEFORE UPDATE ON public.protocolos_st_ufs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_regime_cache_updated_at BEFORE UPDATE ON public.regime_decision_cache FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_3f1eaae3a0a07aa516a5 BEFORE UPDATE ON public.regimes_simulados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_sync_regime_empresa AFTER INSERT OR UPDATE ON public.regimes_tributarios FOR EACH ROW EXECUTE FUNCTION public.sync_regime_tributario_empresa();

CREATE OR REPLACE TRIGGER trg_regras_contab_updated_at BEFORE UPDATE ON public.regras_contabilizacao_automatica FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_411e7594aa600ded799f BEFORE UPDATE ON public.regras_roteamento_financeiro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_audit_regras_roteamento_financeiro AFTER INSERT OR DELETE OR UPDATE ON public.regras_roteamento_financeiro FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER set_updated_at_d109c735b0fcf7754280 BEFORE UPDATE ON public.regua_cobranca FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_7895f3de16aa8553d228 BEFORE UPDATE ON public.regua_cobranca_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_relat_agend_updated_at BEFORE UPDATE ON public.relatorios_agendados FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_rel_trib_agend_updated_at BEFORE UPDATE ON public.relatorios_tributarios_agendados FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_retencao_politicas_updated_at BEFORE UPDATE ON public.retencao_politicas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_audit_risk_rules AFTER INSERT OR DELETE OR UPDATE ON public.risk_rules FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER trg_risk_rules_set_empresa BEFORE INSERT ON public.risk_rules FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_default();

CREATE OR REPLACE TRIGGER update_risk_rules_updated_at BEFORE UPDATE ON public.risk_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_audit_role_permissions AFTER INSERT OR DELETE OR UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER trg_saved_filter_subs_updated_at BEFORE UPDATE ON public.saved_filter_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_saved_filters_updated_at BEFORE UPDATE ON public.saved_filters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_scim_checklist_updated_at BEFORE UPDATE ON public.scim_setup_checklist FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_e04cfc68ebaf2388af42 BEFORE UPDATE ON public.security_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_audit_security_settings AFTER INSERT OR DELETE OR UPDATE ON public.security_settings FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER trg_dfe_cursor_updated BEFORE UPDATE ON public.sefaz_dfe_cursor FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE OR REPLACE TRIGGER trg_simulacoes_updated_at BEFORE UPDATE ON public.simulacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_solicitacoes_lgpd_set_empresa BEFORE INSERT ON public.solicitacoes_lgpd FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_from_profile();

CREATE OR REPLACE TRIGGER trg_solicitacoes_lgpd_updated_at BEFORE UPDATE ON public.solicitacoes_lgpd FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_sped_arquivos_updated_at BEFORE UPDATE ON public.sped_contabil_arquivos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_split_payment_transacoes_updated_at BEFORE UPDATE ON public.split_payment_transacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_cf7fd5d83c82e171dad1 BEFORE UPDATE ON public.sso_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_audit_sso_providers AFTER INSERT OR DELETE OR UPDATE ON public.sso_providers FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER trg_sso_role_mappings_updated_at BEFORE UPDATE ON public.sso_role_mappings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_sso_user_groups_updated_at BEFORE UPDATE ON public.sso_user_groups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_3e8011f6fa0d13424163 BEFORE UPDATE ON public.templates_cobranca FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_ufs_updated_at BEFORE UPDATE ON public.ufs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_user_active_filters_updated_at BEFORE UPDATE ON public.user_active_filters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_7c3e342523c10fdce4a8 BEFORE UPDATE ON public.user_anomalia_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER tr_user_anomalia_preferences_updated_at BEFORE UPDATE ON public.user_anomalia_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_demonstrativo_preferences_updated_at BEFORE UPDATE ON public.user_demonstrativo_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER tr_user_digest_preferences_updated_at BEFORE UPDATE ON public.user_digest_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_09910d2394bcdefb9694 BEFORE UPDATE ON public.user_empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_94b77f57a764fd8b2a8c BEFORE UPDATE ON public.user_filter_presets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_843738dbe839129b260e BEFORE UPDATE ON public.user_onboarding_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER tr_user_onboarding_progress_updated_at BEFORE UPDATE ON public.user_onboarding_progress FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_audit_user_roles AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_generic();

CREATE OR REPLACE TRIGGER trg_auto_vincular_empresa_padrao AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.auto_vincular_empresa_padrao();

CREATE OR REPLACE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_webhook_dlq_updated BEFORE UPDATE ON public.webhook_dlq FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SECAO 3: Policies ausentes (445)

DROP POLICY IF EXISTS "acessos_suspeitos acessos_suspeitos_tenant_select" ON public.acessos_suspeitos;
CREATE POLICY acessos_suspeitos_tenant_select ON public.acessos_suspeitos FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id))));

DROP POLICY IF EXISTS "acoes_recomendadas Empresa-based access" ON public.acoes_recomendadas;
CREATE POLICY "Empresa-based access" ON public.acoes_recomendadas TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "acordos_parcelamento Empresa-based access" ON public.acordos_parcelamento;
CREATE POLICY "Empresa-based access" ON public.acordos_parcelamento TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "acordos_parcelamento Owner manage acordos" ON public.acordos_parcelamento;
CREATE POLICY "Owner manage acordos" ON public.acordos_parcelamento TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "alert_configurations alert_configurations_tenant_delete" ON public.alert_configurations;
CREATE POLICY alert_configurations_tenant_delete ON public.alert_configurations FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));

DROP POLICY IF EXISTS "alert_configurations alert_configurations_tenant_insert" ON public.alert_configurations;
CREATE POLICY alert_configurations_tenant_insert ON public.alert_configurations FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role))));

DROP POLICY IF EXISTS "alert_configurations alert_configurations_tenant_select" ON public.alert_configurations;
CREATE POLICY alert_configurations_tenant_select ON public.alert_configurations FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS "alert_configurations alert_configurations_tenant_update" ON public.alert_configurations;
CREATE POLICY alert_configurations_tenant_update ON public.alert_configurations FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS "alertas alertas_owner_delete" ON public.alertas;
CREATE POLICY alertas_owner_delete ON public.alertas FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "alertas alertas_owner_insert" ON public.alertas;
CREATE POLICY alertas_owner_insert ON public.alertas FOR INSERT TO authenticated WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id))));

DROP POLICY IF EXISTS "alertas alertas_owner_select" ON public.alertas;
CREATE POLICY alertas_owner_select ON public.alertas FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "alertas alertas_owner_update" ON public.alertas;
CREATE POLICY alertas_owner_update ON public.alertas FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id))));

DROP POLICY IF EXISTS "alertas_preditivos alertas_preditivos_empresa_select" ON public.alertas_preditivos;
CREATE POLICY alertas_preditivos_empresa_select ON public.alertas_preditivos FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "alertas_tributarios Empresa-based access" ON public.alertas_tributarios;
CREATE POLICY "Empresa-based access" ON public.alertas_tributarios TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "alerts alerts_tenant_delete" ON public.alerts;
CREATE POLICY alerts_tenant_delete ON public.alerts FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));

DROP POLICY IF EXISTS "alerts alerts_tenant_insert" ON public.alerts;
CREATE POLICY alerts_tenant_insert ON public.alerts FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role))));

DROP POLICY IF EXISTS "alerts alerts_tenant_select" ON public.alerts;
CREATE POLICY alerts_tenant_select ON public.alerts FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS "alerts alerts_tenant_update" ON public.alerts;
CREATE POLICY alerts_tenant_update ON public.alerts FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS "alerts_sent alerts_sent_tenant_delete" ON public.alerts_sent;
CREATE POLICY alerts_sent_tenant_delete ON public.alerts_sent FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));

DROP POLICY IF EXISTS "alerts_sent alerts_sent_tenant_insert" ON public.alerts_sent;
CREATE POLICY alerts_sent_tenant_insert ON public.alerts_sent FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))));

DROP POLICY IF EXISTS "alerts_sent alerts_sent_tenant_select" ON public.alerts_sent;
CREATE POLICY alerts_sent_tenant_select ON public.alerts_sent FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))));

DROP POLICY IF EXISTS "alerts_sent alerts_sent_tenant_update" ON public.alerts_sent;
CREATE POLICY alerts_sent_tenant_update ON public.alerts_sent FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))));

DROP POLICY IF EXISTS "aliquotas_interestaduais aliq_inter_select_authenticated" ON public.aliquotas_interestaduais;
CREATE POLICY aliq_inter_select_authenticated ON public.aliquotas_interestaduais FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "aliquotas_interestaduais aliq_inter_write_admin" ON public.aliquotas_interestaduais;
CREATE POLICY aliq_inter_write_admin ON public.aliquotas_interestaduais TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "aliquotas_internas_uf aliq_internas_select_authenticated" ON public.aliquotas_internas_uf;
CREATE POLICY aliq_internas_select_authenticated ON public.aliquotas_internas_uf FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "aliquotas_internas_uf aliq_internas_write_admin" ON public.aliquotas_internas_uf;
CREATE POLICY aliq_internas_write_admin ON public.aliquotas_internas_uf TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "aliquotas_iss_municipal aliq_iss_select_authenticated" ON public.aliquotas_iss_municipal;
CREATE POLICY aliq_iss_select_authenticated ON public.aliquotas_iss_municipal FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "aliquotas_iss_municipal aliq_iss_write_admin" ON public.aliquotas_iss_municipal;
CREATE POLICY aliq_iss_write_admin ON public.aliquotas_iss_municipal TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "allowed_countries Admin manage" ON public.allowed_countries;
CREATE POLICY "Admin manage" ON public.allowed_countries TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role)))));

DROP POLICY IF EXISTS "allowed_countries Public read" ON public.allowed_countries;
CREATE POLICY "Public read" ON public.allowed_countries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "allowed_ips allowed_ips_admin_all" ON public.allowed_ips;
CREATE POLICY allowed_ips_admin_all ON public.allowed_ips TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "anexos_financeiros Owner manage anexos" ON public.anexos_financeiros;
CREATE POLICY "Owner manage anexos" ON public.anexos_financeiros TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "anomalia_detection_runs anomalia_runs_owner_or_admin_select" ON public.anomalia_detection_runs;
CREATE POLICY anomalia_runs_owner_or_admin_select ON public.anomalia_detection_runs FOR SELECT TO authenticated USING (((triggered_by = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "anomalia_toast_eventos Users can insert toast events" ON public.anomalia_toast_eventos;
CREATE POLICY "Users can insert toast events" ON public.anomalia_toast_eventos FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "anomalia_toast_eventos Users can view their own toast events" ON public.anomalia_toast_eventos;
CREATE POLICY "Users can view their own toast events" ON public.anomalia_toast_eventos FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "anomalias_detectadas anomalias_detectadas_empresa_select" ON public.anomalias_detectadas;
CREATE POLICY anomalias_detectadas_empresa_select ON public.anomalias_detectadas FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "anomalias_detectadas anomalias_detectadas_tenant_rw" ON public.anomalias_detectadas;
CREATE POLICY anomalias_detectadas_tenant_rw ON public.anomalias_detectadas TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "api_keys api_keys_delete" ON public.api_keys;
CREATE POLICY api_keys_delete ON public.api_keys FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "api_keys api_keys_select" ON public.api_keys;
CREATE POLICY api_keys_select ON public.api_keys FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "aprovacao_comentarios Users can insert their own comments" ON public.aprovacao_comentarios;
CREATE POLICY "Users can insert their own comments" ON public.aprovacao_comentarios FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "aprovacao_comentarios aprovacao_comentarios_owner_select" ON public.aprovacao_comentarios;
CREATE POLICY aprovacao_comentarios_owner_select ON public.aprovacao_comentarios FOR SELECT TO authenticated USING (((solicitacao_id IN ( SELECT solicitacoes_aprovacao.id
   FROM public.solicitacoes_aprovacao
  WHERE ((solicitacoes_aprovacao.solicitado_por = ( SELECT auth.uid() AS uid)) OR (solicitacoes_aprovacao.aprovado_por = ( SELECT auth.uid() AS uid))))) OR (user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "apuracoes_irpj_csll Empresa-based access" ON public.apuracoes_irpj_csll;
CREATE POLICY "Empresa-based access" ON public.apuracoes_irpj_csll TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "apuracoes_tributarias apuracoes_tributarias_empresa_select" ON public.apuracoes_tributarias;
CREATE POLICY apuracoes_tributarias_empresa_select ON public.apuracoes_tributarias FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "apuracoes_tributarias apuracoes_tributarias_tenant_rw" ON public.apuracoes_tributarias;
CREATE POLICY apuracoes_tributarias_tenant_rw ON public.apuracoes_tributarias TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "asaas_audit_trail asaas_audit_tenant_select" ON public.asaas_audit_trail;
CREATE POLICY asaas_audit_tenant_select ON public.asaas_audit_trail FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.asaas_payments p
  WHERE ((p.id = asaas_audit_trail.payment_id) AND public.empresa_acessivel(p.empresa_id))))));

DROP POLICY IF EXISTS "asaas_config asaas_config_tenant_rw" ON public.asaas_config;
CREATE POLICY asaas_config_tenant_rw ON public.asaas_config TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "asaas_credit_risk_analysis credit_risk_select" ON public.asaas_credit_risk_analysis;
CREATE POLICY credit_risk_select ON public.asaas_credit_risk_analysis FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.clientes c
  WHERE ((c.id = asaas_credit_risk_analysis.cliente_id) AND public.empresa_acessivel(c.empresa_id)))));

DROP POLICY IF EXISTS "asaas_customers asaas_customers_empresa_select" ON public.asaas_customers;
CREATE POLICY asaas_customers_empresa_select ON public.asaas_customers FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "asaas_customers asaas_customers_tenant_rw" ON public.asaas_customers;
CREATE POLICY asaas_customers_tenant_rw ON public.asaas_customers TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "asaas_payments asaas_payments_empresa_select" ON public.asaas_payments;
CREATE POLICY asaas_payments_empresa_select ON public.asaas_payments FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "asaas_payments asaas_payments_tenant_rw" ON public.asaas_payments;
CREATE POLICY asaas_payments_tenant_rw ON public.asaas_payments TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "asaas_reconciliation_suggestions asaas_recon_empresa_select" ON public.asaas_reconciliation_suggestions;
CREATE POLICY asaas_recon_empresa_select ON public.asaas_reconciliation_suggestions FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "asaas_reconciliation_suggestions asaas_reconciliation_suggestions_tenant_rw" ON public.asaas_reconciliation_suggestions;
CREATE POLICY asaas_reconciliation_suggestions_tenant_rw ON public.asaas_reconciliation_suggestions TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "asaas_sync_queue asaas_sync_tenant_all" ON public.asaas_sync_queue;
CREATE POLICY asaas_sync_tenant_all ON public.asaas_sync_queue TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.asaas_payments p
  WHERE ((p.id = asaas_sync_queue.payment_id) AND public.empresa_acessivel(p.empresa_id)))))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.asaas_payments p
  WHERE ((p.id = asaas_sync_queue.payment_id) AND public.empresa_acessivel(p.empresa_id))))));

DROP POLICY IF EXISTS "asaas_transfers asaas_transfers_empresa_select" ON public.asaas_transfers;
CREATE POLICY asaas_transfers_empresa_select ON public.asaas_transfers FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "asaas_transfers asaas_transfers_tenant_rw" ON public.asaas_transfers;
CREATE POLICY asaas_transfers_tenant_rw ON public.asaas_transfers TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "audit_logs Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "audit_logs audit_logs_insert_self_attributed" ON public.audit_logs;
CREATE POLICY audit_logs_insert_self_attributed ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ((user_email IS NULL) OR (user_email = ( SELECT (auth.jwt() ->> 'email'::text))))));

DROP POLICY IF EXISTS "auditoria_financeira auditoria_financeira_empresa_select" ON public.auditoria_financeira;
CREATE POLICY auditoria_financeira_empresa_select ON public.auditoria_financeira FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "auditoria_financeira auditoria_user_insert" ON public.auditoria_financeira;
CREATE POLICY auditoria_user_insert ON public.auditoria_financeira FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "auditoria_tributaria auditoria_trib_select_tenant" ON public.auditoria_tributaria;
CREATE POLICY auditoria_trib_select_tenant ON public.auditoria_tributaria FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "auth_logs Admins can view all auth logs" ON public.auth_logs;
CREATE POLICY "Admins can view all auth logs" ON public.auth_logs FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "auth_logs Authenticated can insert auth logs" ON public.auth_logs;
CREATE POLICY "Authenticated can insert auth logs" ON public.auth_logs FOR INSERT TO authenticated WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'operacional'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'visualizador'::public.app_role)));

DROP POLICY IF EXISTS "auth_logs Users can view own auth logs" ON public.auth_logs;
CREATE POLICY "Users can view own auth logs" ON public.auth_logs FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "benchmarks_setoriais benchmarks_admin_write" ON public.benchmarks_setoriais;
CREATE POLICY benchmarks_admin_write ON public.benchmarks_setoriais TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "benchmarks_setoriais benchmarks_select" ON public.benchmarks_setoriais;
CREATE POLICY benchmarks_select ON public.benchmarks_setoriais FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "beneficios_fiscais beneficios_select_authenticated" ON public.beneficios_fiscais;
CREATE POLICY beneficios_select_authenticated ON public.beneficios_fiscais FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "beneficios_fiscais beneficios_write_admin" ON public.beneficios_fiscais;
CREATE POLICY beneficios_write_admin ON public.beneficios_fiscais TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bitrix24_activities bitrix24_activities_tenant_delete" ON public.bitrix24_activities;
CREATE POLICY bitrix24_activities_tenant_delete ON public.bitrix24_activities FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));

DROP POLICY IF EXISTS "bitrix24_activities bitrix24_activities_tenant_insert" ON public.bitrix24_activities;
CREATE POLICY bitrix24_activities_tenant_insert ON public.bitrix24_activities FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))));

DROP POLICY IF EXISTS "bitrix24_activities bitrix24_activities_tenant_select" ON public.bitrix24_activities;
CREATE POLICY bitrix24_activities_tenant_select ON public.bitrix24_activities FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))));

DROP POLICY IF EXISTS "bitrix24_activities bitrix24_activities_tenant_update" ON public.bitrix24_activities;
CREATE POLICY bitrix24_activities_tenant_update ON public.bitrix24_activities FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))));

DROP POLICY IF EXISTS "bitrix24_stage_mappings Admins can delete stage mappings" ON public.bitrix24_stage_mappings;
CREATE POLICY "Admins can delete stage mappings" ON public.bitrix24_stage_mappings FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bitrix24_stage_mappings Authorized roles can view stage mappings" ON public.bitrix24_stage_mappings;
CREATE POLICY "Authorized roles can view stage mappings" ON public.bitrix24_stage_mappings FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'operacional'::public.app_role)));

DROP POLICY IF EXISTS "bitrix24_stage_mappings Managers can insert stage mappings" ON public.bitrix24_stage_mappings;
CREATE POLICY "Managers can insert stage mappings" ON public.bitrix24_stage_mappings FOR INSERT TO authenticated WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "bitrix24_stage_mappings Managers can update stage mappings" ON public.bitrix24_stage_mappings;
CREATE POLICY "Managers can update stage mappings" ON public.bitrix24_stage_mappings FOR UPDATE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "bitrix24_tokens Admins can delete tokens" ON public.bitrix24_tokens;
CREATE POLICY "Admins can delete tokens" ON public.bitrix24_tokens FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bitrix24_tokens Admins can insert tokens" ON public.bitrix24_tokens;
CREATE POLICY "Admins can insert tokens" ON public.bitrix24_tokens FOR INSERT TO authenticated WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bitrix24_tokens Admins can update tokens" ON public.bitrix24_tokens;
CREATE POLICY "Admins can update tokens" ON public.bitrix24_tokens FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bitrix24_tokens Only admins can view tokens" ON public.bitrix24_tokens;
CREATE POLICY "Only admins can view tokens" ON public.bitrix24_tokens FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bitrix_field_mappings bitrix_field_mappings_empresa_select" ON public.bitrix_field_mappings;
CREATE POLICY bitrix_field_mappings_empresa_select ON public.bitrix_field_mappings FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "bitrix_oauth_tokens bitrix_oauth_tokens_service_role_only" ON public.bitrix_oauth_tokens;
CREATE POLICY bitrix_oauth_tokens_service_role_only ON public.bitrix_oauth_tokens TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bitrix_sync_logs bitrix_sync_logs_empresa_select" ON public.bitrix_sync_logs;
CREATE POLICY bitrix_sync_logs_empresa_select ON public.bitrix_sync_logs FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "bitrix_webhook_events Admin only manage" ON public.bitrix_webhook_events;
CREATE POLICY "Admin only manage" ON public.bitrix_webhook_events TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role)))));

DROP POLICY IF EXISTS "bling_sync_logs bling_sync_logs_insert" ON public.bling_sync_logs;
CREATE POLICY bling_sync_logs_insert ON public.bling_sync_logs FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "bling_sync_logs bling_sync_logs_select" ON public.bling_sync_logs;
CREATE POLICY bling_sync_logs_select ON public.bling_sync_logs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role)));

DROP POLICY IF EXISTS "bling_tokens bling_tokens_service_role_only" ON public.bling_tokens;
CREATE POLICY bling_tokens_service_role_only ON public.bling_tokens TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bling_webhook_events bling_webhook_events_admin_select" ON public.bling_webhook_events;
CREATE POLICY bling_webhook_events_admin_select ON public.bling_webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "bloat_snapshots Admins podem consultar snapshots de bloat" ON public.bloat_snapshots;
CREATE POLICY "Admins podem consultar snapshots de bloat" ON public.bloat_snapshots FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "blocked_ips Admins can manage blocked IPs" ON public.blocked_ips;
CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "blocked_ips Managers can view blocked IPs" ON public.blocked_ips;
CREATE POLICY "Managers can view blocked IPs" ON public.blocked_ips FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role));

DROP POLICY IF EXISTS "bloqueios_duplicidade Empresa-based access" ON public.bloqueios_duplicidade;
CREATE POLICY "Empresa-based access" ON public.bloqueios_duplicidade TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "boletos Owner manage boletos" ON public.boletos;
CREATE POLICY "Owner manage boletos" ON public.boletos TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "boletos boletos_grupo_select" ON public.boletos;
CREATE POLICY boletos_grupo_select ON public.boletos FOR SELECT TO authenticated USING (((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))));

DROP POLICY IF EXISTS "budgets Budgets scoped by owner or empresa" ON public.budgets;
CREATE POLICY "Budgets scoped by owner or empresa" ON public.budgets TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (company_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (company_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))));

DROP POLICY IF EXISTS "catalogos_fiscais_cargas Admins leem cargas de catalogos fiscais" ON public.catalogos_fiscais_cargas;
CREATE POLICY "Admins leem cargas de catalogos fiscais" ON public.catalogos_fiscais_cargas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "catalogos_tributarios_health_history admins leem historico saude fiscal" ON public.catalogos_tributarios_health_history;
CREATE POLICY "admins leem historico saude fiscal" ON public.catalogos_tributarios_health_history FOR SELECT TO authenticated USING (( SELECT public.has_role(auth.uid(), 'admin'::public.app_role) AS has_role));

DROP POLICY IF EXISTS "categorias Categorias scoped by empresa" ON public.categorias;
CREATE POLICY "Categorias scoped by empresa" ON public.categorias TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))));

DROP POLICY IF EXISTS "centros_custo centros_custo_empresa_select" ON public.centros_custo;
CREATE POLICY centros_custo_empresa_select ON public.centros_custo FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "centros_custo centros_custo_tenant_rw" ON public.centros_custo;
CREATE POLICY centros_custo_tenant_rw ON public.centros_custo TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "ci_security_gate_events Admins can view CI security gate events" ON public.ci_security_gate_events;
CREATE POLICY "Admins can view CI security gate events" ON public.ci_security_gate_events FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "ci_security_gate_events Service role manages CI security gate events" ON public.ci_security_gate_events;
CREATE POLICY "Service role manages CI security gate events" ON public.ci_security_gate_events TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "clientes clientes_grupo_select" ON public.clientes;
CREATE POLICY clientes_grupo_select ON public.clientes FOR SELECT TO authenticated USING (((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))));

DROP POLICY IF EXISTS "clientes clientes_grupo_update" ON public.clientes;
CREATE POLICY clientes_grupo_update ON public.clientes FOR UPDATE TO authenticated USING (public.empresa_membro_ativo(empresa_id)) WITH CHECK (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS "clientes clientes_owner_delete" ON public.clientes;
CREATE POLICY clientes_owner_delete ON public.clientes FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "clientes clientes_owner_insert" ON public.clientes;
CREATE POLICY clientes_owner_insert ON public.clientes FOR INSERT TO authenticated WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_membro_ativo(empresa_id))));

DROP POLICY IF EXISTS "clientes clientes_owner_select" ON public.clientes;
CREATE POLICY clientes_owner_select ON public.clientes FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "clientes clientes_owner_update" ON public.clientes;
CREATE POLICY clientes_owner_update ON public.clientes FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_membro_ativo(empresa_id))));

DROP POLICY IF EXISTS "cnaes cnaes_select_authenticated" ON public.cnaes;
CREATE POLICY cnaes_select_authenticated ON public.cnaes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cnaes cnaes_write_admin" ON public.cnaes;
CREATE POLICY cnaes_write_admin ON public.cnaes TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "cnpja_cache cnpja_cache_service_role_only" ON public.cnpja_cache;
CREATE POLICY cnpja_cache_service_role_only ON public.cnpja_cache TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "conciliacoes conciliacoes_owner_all" ON public.conciliacoes;
CREATE POLICY conciliacoes_owner_all ON public.conciliacoes TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "conciliacoes_parciais concil_parciais_owner_all" ON public.conciliacoes_parciais;
CREATE POLICY concil_parciais_owner_all ON public.conciliacoes_parciais TO authenticated USING ((( SELECT auth.uid() AS uid) = created_by)) WITH CHECK ((( SELECT auth.uid() AS uid) = created_by));

DROP POLICY IF EXISTS "configuracoes_aprovacao configuracoes_aprovacao_empresa_select" ON public.configuracoes_aprovacao;
CREATE POLICY configuracoes_aprovacao_empresa_select ON public.configuracoes_aprovacao FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "configuracoes_aprovacao configuracoes_aprovacao_tenant_rw" ON public.configuracoes_aprovacao;
CREATE POLICY configuracoes_aprovacao_tenant_rw ON public.configuracoes_aprovacao TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "configuracoes_duplicidade Empresa-based access" ON public.configuracoes_duplicidade;
CREATE POLICY "Empresa-based access" ON public.configuracoes_duplicidade TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "configuracoes_duplicidade configuracoes_duplicidade_tenant_rw" ON public.configuracoes_duplicidade;
CREATE POLICY configuracoes_duplicidade_tenant_rw ON public.configuracoes_duplicidade TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "conformidade_snapshots conformidade_snapshots_empresa_insert" ON public.conformidade_snapshots;
CREATE POLICY conformidade_snapshots_empresa_insert ON public.conformidade_snapshots FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));

DROP POLICY IF EXISTS "conformidade_snapshots conformidade_snapshots_empresa_select" ON public.conformidade_snapshots;
CREATE POLICY conformidade_snapshots_empresa_select ON public.conformidade_snapshots FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));

DROP POLICY IF EXISTS "conformidade_snapshots conformidade_snapshots_empresa_update" ON public.conformidade_snapshots;
CREATE POLICY conformidade_snapshots_empresa_update ON public.conformidade_snapshots FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));

DROP POLICY IF EXISTS "conformidade_snapshots conformidade_snapshots_tenant_rw" ON public.conformidade_snapshots;
CREATE POLICY conformidade_snapshots_tenant_rw ON public.conformidade_snapshots TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "contas_bancarias contas_bancarias_empresa_select" ON public.contas_bancarias;
CREATE POLICY contas_bancarias_empresa_select ON public.contas_bancarias FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "contas_pagar contas_pagar_empresa_select" ON public.contas_pagar;
CREATE POLICY contas_pagar_empresa_select ON public.contas_pagar FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "contas_pagar contas_pagar_tenant_rw" ON public.contas_pagar;
CREATE POLICY contas_pagar_tenant_rw ON public.contas_pagar TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "contas_receber contas_receber_empresa_select" ON public.contas_receber;
CREATE POLICY contas_receber_empresa_select ON public.contas_receber FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "contas_receber contas_receber_tenant_rw" ON public.contas_receber;
CREATE POLICY contas_receber_tenant_rw ON public.contas_receber TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "contratos Empresa-based access" ON public.contratos;
CREATE POLICY "Empresa-based access" ON public.contratos TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "convites convites_manage_responsavel" ON public.convites;
CREATE POLICY convites_manage_responsavel ON public.convites TO authenticated USING ((public.is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role))) WITH CHECK (((convidado_por = ( SELECT auth.uid() AS uid)) AND (public.is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role))));

DROP POLICY IF EXISTS "convites_contador convites_contador_revogar" ON public.convites_contador;
CREATE POLICY convites_contador_revogar ON public.convites_contador FOR UPDATE TO authenticated USING ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role)))) WITH CHECK ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));

DROP POLICY IF EXISTS "convites_contador convites_contador_select" ON public.convites_contador;
CREATE POLICY convites_contador_select ON public.convites_contador FOR SELECT TO authenticated USING ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));

DROP POLICY IF EXISTS "creditos_tributarios Access by empresa_id" ON public.creditos_tributarios;
CREATE POLICY "Access by empresa_id" ON public.creditos_tributarios TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "cron_job_logs Admins can view cron logs" ON public.cron_job_logs;
CREATE POLICY "Admins can view cron logs" ON public.cron_job_logs FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "custom_field_definitions Custom field definitions scoped by empresa" ON public.custom_field_definitions;
CREATE POLICY "Custom field definitions scoped by empresa" ON public.custom_field_definitions TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))));

DROP POLICY IF EXISTS "custom_field_values Custom field values scoped by definition empresa" ON public.custom_field_values;
CREATE POLICY "Custom field values scoped by definition empresa" ON public.custom_field_values TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.custom_field_definitions d
  WHERE ((d.id = custom_field_values.definition_id) AND (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (d.empresa_id IN ( SELECT ue.empresa_id
           FROM public.user_empresas ue
          WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.custom_field_definitions d
  WHERE ((d.id = custom_field_values.definition_id) AND (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (d.empresa_id IN ( SELECT ue.empresa_id
           FROM public.user_empresas ue
          WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))))));

DROP POLICY IF EXISTS "darfs DARFs scoped by linked empresa" ON public.darfs;
CREATE POLICY "DARFs scoped by linked empresa" ON public.darfs FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))) OR (alerta_id IN ( SELECT at.id
   FROM public.alertas_tributarios at
  WHERE (at.empresa_id IN ( SELECT ue.empresa_id
           FROM public.user_empresas ue
          WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))));

DROP POLICY IF EXISTS "darfs darfs_tenant_rw" ON public.darfs;
CREATE POLICY darfs_tenant_rw ON public.darfs TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "digest_envios_log Admins podem consultar o log de envios do digest" ON public.digest_envios_log;
CREATE POLICY "Admins podem consultar o log de envios do digest" ON public.digest_envios_log FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "dispositivos_conhecidos User-based access" ON public.dispositivos_conhecidos;
CREATE POLICY "User-based access" ON public.dispositivos_conhecidos TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "divergencias_conciliacao Empresa-based access" ON public.divergencias_conciliacao;
CREATE POLICY "Empresa-based access" ON public.divergencias_conciliacao TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "edge_function_logs edge_function_logs_admin_select" ON public.edge_function_logs;
CREATE POLICY edge_function_logs_admin_select ON public.edge_function_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "elisao_alertas elisao_alertas_acesso" ON public.elisao_alertas;
CREATE POLICY elisao_alertas_acesso ON public.elisao_alertas TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "elisao_creditos_auditoria creditos_auditoria_delete_admin" ON public.elisao_creditos_auditoria;
CREATE POLICY creditos_auditoria_delete_admin ON public.elisao_creditos_auditoria FOR DELETE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "elisao_creditos_auditoria creditos_auditoria_insert" ON public.elisao_creditos_auditoria;
CREATE POLICY creditos_auditoria_insert ON public.elisao_creditos_auditoria FOR INSERT TO authenticated WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "elisao_creditos_auditoria creditos_auditoria_select" ON public.elisao_creditos_auditoria;
CREATE POLICY creditos_auditoria_select ON public.elisao_creditos_auditoria FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "elisao_regras_creditos regras_creditos_admin" ON public.elisao_regras_creditos;
CREATE POLICY regras_creditos_admin ON public.elisao_regras_creditos TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "elisao_regras_creditos regras_creditos_leitura" ON public.elisao_regras_creditos;
CREATE POLICY regras_creditos_leitura ON public.elisao_regras_creditos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "elisao_simulacoes_regime elisao_sim_regime_acesso" ON public.elisao_simulacoes_regime;
CREATE POLICY elisao_sim_regime_acesso ON public.elisao_simulacoes_regime TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "elisao_tarefas_acionaveis tarefas_elisao_acesso" ON public.elisao_tarefas_acionaveis;
CREATE POLICY tarefas_elisao_acesso ON public.elisao_tarefas_acionaveis TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "email_verifications Admins can delete verifications" ON public.email_verifications;
CREATE POLICY "Admins can delete verifications" ON public.email_verifications FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "email_verifications Users can insert own verifications" ON public.email_verifications;
CREATE POLICY "Users can insert own verifications" ON public.email_verifications FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "email_verifications Users can update their verifications" ON public.email_verifications;
CREATE POLICY "Users can update their verifications" ON public.email_verifications FOR UPDATE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "email_verifications Users can view own verifications" ON public.email_verifications;
CREATE POLICY "Users can view own verifications" ON public.email_verifications FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "empresas Owner manage empresas" ON public.empresas;
CREATE POLICY "Owner manage empresas" ON public.empresas TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "empresas_certificados cert_empresa_read" ON public.empresas_certificados;
CREATE POLICY cert_empresa_read ON public.empresas_certificados FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = empresas_certificados.empresa_id)))));

DROP POLICY IF EXISTS "empresas_certificados empresas_certificados_tenant_rw" ON public.empresas_certificados;
CREATE POLICY empresas_certificados_tenant_rw ON public.empresas_certificados TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "entregas_obrigacoes entregas_obrigacoes_empresa_insert" ON public.entregas_obrigacoes;
CREATE POLICY entregas_obrigacoes_empresa_insert ON public.entregas_obrigacoes FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));

DROP POLICY IF EXISTS "entregas_obrigacoes entregas_obrigacoes_empresa_select" ON public.entregas_obrigacoes;
CREATE POLICY entregas_obrigacoes_empresa_select ON public.entregas_obrigacoes FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));

DROP POLICY IF EXISTS "entregas_obrigacoes entregas_obrigacoes_empresa_update" ON public.entregas_obrigacoes;
CREATE POLICY entregas_obrigacoes_empresa_update ON public.entregas_obrigacoes FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));

DROP POLICY IF EXISTS "entregas_obrigacoes entregas_obrigacoes_tenant_rw" ON public.entregas_obrigacoes;
CREATE POLICY entregas_obrigacoes_tenant_rw ON public.entregas_obrigacoes TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "estrategias_elisao estrategias_select_authenticated" ON public.estrategias_elisao;
CREATE POLICY estrategias_select_authenticated ON public.estrategias_elisao FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "estrategias_elisao estrategias_write_admin" ON public.estrategias_elisao;
CREATE POLICY estrategias_write_admin ON public.estrategias_elisao TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "eventos_contabilizacao_log eventos_contab_select" ON public.eventos_contabilizacao_log;
CREATE POLICY eventos_contab_select ON public.eventos_contabilizacao_log FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "evidencias_pacotes Evidencias scoped by verificacao" ON public.evidencias_pacotes;
CREATE POLICY "Evidencias scoped by verificacao" ON public.evidencias_pacotes TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.verificacoes_conformidade vc
  WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id
           FROM public.user_empresas ue
          WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.verificacoes_conformidade vc
  WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id
           FROM public.user_empresas ue
          WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))))));

DROP POLICY IF EXISTS "execucoes_cobranca Owner manage execucoes" ON public.execucoes_cobranca;
CREATE POLICY "Owner manage execucoes" ON public.execucoes_cobranca TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "execucoes_cobranca execucoes_cobranca_empresa_all" ON public.execucoes_cobranca;
CREATE POLICY execucoes_cobranca_empresa_all ON public.execucoes_cobranca TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "execucoes_regua_cobranca execucoes_regua_select" ON public.execucoes_regua_cobranca;
CREATE POLICY execucoes_regua_select ON public.execucoes_regua_cobranca FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "expert_conversations Users can manage their own conversations" ON public.expert_conversations;
CREATE POLICY "Users can manage their own conversations" ON public.expert_conversations TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "expert_messages Users can insert messages to their conversations" ON public.expert_messages;
CREATE POLICY "Users can insert messages to their conversations" ON public.expert_messages FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.expert_conversations c
  WHERE ((c.id = expert_messages.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "expert_messages Users can view messages from their conversations" ON public.expert_messages;
CREATE POLICY "Users can view messages from their conversations" ON public.expert_messages FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.expert_conversations c
  WHERE ((c.id = expert_messages.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "expert_messages Usuários veem mensagens de suas conversas" ON public.expert_messages;
CREATE POLICY "Usuários veem mensagens de suas conversas" ON public.expert_messages TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.expert_conversations c
  WHERE ((c.id = expert_messages.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.expert_conversations c
  WHERE ((c.id = expert_messages.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "extrato_bancario Users can manage their own extrato_bancario" ON public.extrato_bancario;
CREATE POLICY "Users can manage their own extrato_bancario" ON public.extrato_bancario TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "extrato_bancario extrato_owner_all" ON public.extrato_bancario;
CREATE POLICY extrato_owner_all ON public.extrato_bancario TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "faixas_simples_nacional faixas_simples_select_authenticated" ON public.faixas_simples_nacional;
CREATE POLICY faixas_simples_select_authenticated ON public.faixas_simples_nacional FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "faixas_simples_nacional faixas_simples_write_admin" ON public.faixas_simples_nacional;
CREATE POLICY faixas_simples_write_admin ON public.faixas_simples_nacional TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "faturamento_mensal Empresa-based access" ON public.faturamento_mensal;
CREATE POLICY "Empresa-based access" ON public.faturamento_mensal TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "fechamentos_tributarios fechamentos_insert" ON public.fechamentos_tributarios;
CREATE POLICY fechamentos_insert ON public.fechamentos_tributarios FOR INSERT TO authenticated WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "fechamentos_tributarios fechamentos_select" ON public.fechamentos_tributarios;
CREATE POLICY fechamentos_select ON public.fechamentos_tributarios FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "fechamentos_tributarios fechamentos_update" ON public.fechamentos_tributarios;
CREATE POLICY fechamentos_update ON public.fechamentos_tributarios FOR UPDATE TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "feedback_conciliacao_ia User-based access" ON public.feedback_conciliacao_ia;
CREATE POLICY "User-based access" ON public.feedback_conciliacao_ia TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "feedback_conciliacao_ia Users can manage feedback" ON public.feedback_conciliacao_ia;
CREATE POLICY "Users can manage feedback" ON public.feedback_conciliacao_ia TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "fila_cobrancas fila_cobrancas_empresa_select" ON public.fila_cobrancas;
CREATE POLICY fila_cobrancas_empresa_select ON public.fila_cobrancas FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "fila_cobrancas fila_cobrancas_tenant_rw" ON public.fila_cobrancas;
CREATE POLICY fila_cobrancas_tenant_rw ON public.fila_cobrancas TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "fluxos_aprovacao_niveis Access by empresa_id" ON public.fluxos_aprovacao_niveis;
CREATE POLICY "Access by empresa_id" ON public.fluxos_aprovacao_niveis TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "folha_pagamento Empresa-based access" ON public.folha_pagamento;
CREATE POLICY "Empresa-based access" ON public.folha_pagamento TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "formas_pagamento Empresa-based access" ON public.formas_pagamento;
CREATE POLICY "Empresa-based access" ON public.formas_pagamento TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "fornecedores fornecedores_owner_delete" ON public.fornecedores;
CREATE POLICY fornecedores_owner_delete ON public.fornecedores FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "fornecedores fornecedores_owner_insert" ON public.fornecedores;
CREATE POLICY fornecedores_owner_insert ON public.fornecedores FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "fornecedores fornecedores_owner_select" ON public.fornecedores;
CREATE POLICY fornecedores_owner_select ON public.fornecedores FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "fornecedores fornecedores_owner_update" ON public.fornecedores;
CREATE POLICY fornecedores_owner_update ON public.fornecedores FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "frontend_error_alert_state fe_alert_state_admin_select" ON public.frontend_error_alert_state;
CREATE POLICY fe_alert_state_admin_select ON public.frontend_error_alert_state FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "frontend_error_logs Admins can view frontend errors" ON public.frontend_error_logs;
CREATE POLICY "Admins can view frontend errors" ON public.frontend_error_logs FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "frontend_error_logs frontend_error_user_insert" ON public.frontend_error_logs;
CREATE POLICY frontend_error_user_insert ON public.frontend_error_logs FOR INSERT TO authenticated, anon WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) OR (user_id IS NULL)));

DROP POLICY IF EXISTS "frontend_error_silence_digest_log fe_silence_digest_admin_select" ON public.frontend_error_silence_digest_log;
CREATE POLICY fe_silence_digest_admin_select ON public.frontend_error_silence_digest_log FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "frontend_performance_logs Admins can view performance logs" ON public.frontend_performance_logs;
CREATE POLICY "Admins can view performance logs" ON public.frontend_performance_logs FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "frontend_performance_logs Authenticated users can insert performance logs" ON public.frontend_performance_logs;
CREATE POLICY "Authenticated users can insert performance logs" ON public.frontend_performance_logs FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));

DROP POLICY IF EXISTS "geo_blocks Admins can delete geo blocks" ON public.geo_blocks;
CREATE POLICY "Admins can delete geo blocks" ON public.geo_blocks FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "geo_blocks Admins can insert geo blocks" ON public.geo_blocks;
CREATE POLICY "Admins can insert geo blocks" ON public.geo_blocks FOR INSERT TO authenticated WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "geo_blocks Admins can manage geo blocks" ON public.geo_blocks;
CREATE POLICY "Admins can manage geo blocks" ON public.geo_blocks TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "geo_blocks Admins can update geo blocks" ON public.geo_blocks;
CREATE POLICY "Admins can update geo blocks" ON public.geo_blocks FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "geo_blocks Managers can view geo blocks" ON public.geo_blocks;
CREATE POLICY "Managers can view geo blocks" ON public.geo_blocks FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role));

DROP POLICY IF EXISTS "glossario_tributario glossario_admin" ON public.glossario_tributario;
CREATE POLICY glossario_admin ON public.glossario_tributario TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "glossario_tributario glossario_leitura" ON public.glossario_tributario;
CREATE POLICY glossario_leitura ON public.glossario_tributario FOR SELECT TO authenticated USING (ativo);

DROP POLICY IF EXISTS "health_scores_operacionais health_scores_empresa_select" ON public.health_scores_operacionais;
CREATE POLICY health_scores_empresa_select ON public.health_scores_operacionais FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "historico_analises_preditivas hap_user_insert" ON public.historico_analises_preditivas;
CREATE POLICY hap_user_insert ON public.historico_analises_preditivas FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "historico_analises_preditivas historico_analises_preditivas_empresa_select" ON public.historico_analises_preditivas;
CREATE POLICY historico_analises_preditivas_empresa_select ON public.historico_analises_preditivas FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "historico_cobranca historico_cobranca_empresa_all" ON public.historico_cobranca;
CREATE POLICY historico_cobranca_empresa_all ON public.historico_cobranca TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "historico_cobranca_whatsapp Empresa-based access" ON public.historico_cobranca_whatsapp;
CREATE POLICY "Empresa-based access" ON public.historico_cobranca_whatsapp TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "historico_cobrancas_boletos historico_cobrancas_boletos_empresa_select" ON public.historico_cobrancas_boletos;
CREATE POLICY historico_cobrancas_boletos_empresa_select ON public.historico_cobrancas_boletos FOR SELECT TO authenticated USING ((conta_receber_id IN ( SELECT contas_receber.id
   FROM public.contas_receber
  WHERE (contas_receber.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM public.user_empresas
          WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))))));

DROP POLICY IF EXISTS "historico_cobrancas_boletos historico_cobrancas_user_all" ON public.historico_cobrancas_boletos;
CREATE POLICY historico_cobrancas_user_all ON public.historico_cobrancas_boletos TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "historico_conciliacao_ia historico_conciliacao_ia_tenant_select" ON public.historico_conciliacao_ia;
CREATE POLICY historico_conciliacao_ia_tenant_select ON public.historico_conciliacao_ia FOR SELECT TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND ((EXISTS ( SELECT 1
   FROM public.contas_receber cr
  WHERE ((cr.id = historico_conciliacao_ia.conta_receber_id) AND public.empresa_acessivel(cr.empresa_id)))) OR (EXISTS ( SELECT 1
   FROM public.contas_pagar cp
  WHERE ((cp.id = historico_conciliacao_ia.conta_pagar_id) AND public.empresa_acessivel(cp.empresa_id)))) OR (EXISTS ( SELECT 1
   FROM public.sessoes_conciliacao s
  WHERE ((s.id = historico_conciliacao_ia.sessao_id) AND ((s.user_id = ( SELECT auth.uid() AS uid)) OR public.empresa_acessivel(s.empresa_id))))))));

DROP POLICY IF EXISTS "historico_relatorios historico_relatorios_leitura" ON public.historico_relatorios;
CREATE POLICY historico_relatorios_leitura ON public.historico_relatorios FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.relatorios_agendados r
  WHERE ((r.id = historico_relatorios.relatorio_agendado_id) AND ((r.created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "historico_score_saude historico_score_saude_empresa_select" ON public.historico_score_saude;
CREATE POLICY historico_score_saude_empresa_select ON public.historico_score_saude FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "incentivos_fiscais incentivos_fiscais_acesso" ON public.incentivos_fiscais;
CREATE POLICY incentivos_fiscais_acesso ON public.incentivos_fiscais TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "index_usage_snapshots Somente admins leem snapshots de índices" ON public.index_usage_snapshots;
CREATE POLICY "Somente admins leem snapshots de índices" ON public.index_usage_snapshots FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "indices_uso_excecoes Somente admins gerenciam exceções de índice" ON public.indices_uso_excecoes;
CREATE POLICY "Somente admins gerenciam exceções de índice" ON public.indices_uso_excecoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "integration_secrets integration_secrets_no_client_access" ON public.integration_secrets;
CREATE POLICY integration_secrets_no_client_access ON public.integration_secrets AS RESTRICTIVE TO authenticated, anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "integrity_alerts integrity_alerts_admin_read" ON public.integrity_alerts;
CREATE POLICY integrity_alerts_admin_read ON public.integrity_alerts FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "integrity_alerts integrity_alerts_service_all" ON public.integrity_alerts;
CREATE POLICY integrity_alerts_service_all ON public.integrity_alerts TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ip_whitelist Admins can delete whitelist" ON public.ip_whitelist;
CREATE POLICY "Admins can delete whitelist" ON public.ip_whitelist FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "ip_whitelist Admins can insert whitelist" ON public.ip_whitelist;
CREATE POLICY "Admins can insert whitelist" ON public.ip_whitelist FOR INSERT TO authenticated WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "ip_whitelist Admins can manage IP whitelist" ON public.ip_whitelist;
CREATE POLICY "Admins can manage IP whitelist" ON public.ip_whitelist TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "ip_whitelist Admins can update whitelist" ON public.ip_whitelist;
CREATE POLICY "Admins can update whitelist" ON public.ip_whitelist FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "ip_whitelist Managers can view IP whitelist" ON public.ip_whitelist;
CREATE POLICY "Managers can view IP whitelist" ON public.ip_whitelist FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role));

DROP POLICY IF EXISTS "itens_lista_iss itens_iss_select_authenticated" ON public.itens_lista_iss;
CREATE POLICY itens_iss_select_authenticated ON public.itens_lista_iss FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "itens_lista_iss itens_iss_write_admin" ON public.itens_lista_iss;
CREATE POLICY itens_iss_write_admin ON public.itens_lista_iss TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "itens_pedido_compra itens_pedido_compra_empresa_select" ON public.itens_pedido_compra;
CREATE POLICY itens_pedido_compra_empresa_select ON public.itens_pedido_compra FOR SELECT TO authenticated USING ((pedido_id IN ( SELECT pedidos_compra.id
   FROM public.pedidos_compra
  WHERE (pedidos_compra.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM public.user_empresas
          WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))))));

DROP POLICY IF EXISTS "kpis_operacionais kpis_operacionais_owner" ON public.kpis_operacionais;
CREATE POLICY kpis_operacionais_owner ON public.kpis_operacionais TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "lancamentos_contabeis Lancamentos scoped by empresa" ON public.lancamentos_contabeis;
CREATE POLICY "Lancamentos scoped by empresa" ON public.lancamentos_contabeis TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))));

DROP POLICY IF EXISTS "login_attempts Admins can delete login attempts" ON public.login_attempts;
CREATE POLICY "Admins can delete login attempts" ON public.login_attempts FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "login_attempts Admins can insert login attempts" ON public.login_attempts;
CREATE POLICY "Admins can insert login attempts" ON public.login_attempts FOR INSERT TO authenticated WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "login_attempts Admins can update login attempts" ON public.login_attempts;
CREATE POLICY "Admins can update login attempts" ON public.login_attempts FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "login_attempts Admins can view login attempts" ON public.login_attempts;
CREATE POLICY "Admins can view login attempts" ON public.login_attempts FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "logs_baixa_automatica logs_baixa_insert_owner" ON public.logs_baixa_automatica;
CREATE POLICY logs_baixa_insert_owner ON public.logs_baixa_automatica FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "logs_baixa_automatica logs_baixa_select_owner" ON public.logs_baixa_automatica;
CREATE POLICY logs_baixa_select_owner ON public.logs_baixa_automatica FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "logs_conciliacao_retroativa logs_retro_insert_owner" ON public.logs_conciliacao_retroativa;
CREATE POLICY logs_retro_insert_owner ON public.logs_conciliacao_retroativa FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "logs_conciliacao_retroativa logs_retro_select_owner" ON public.logs_conciliacao_retroativa;
CREATE POLICY logs_retro_select_owner ON public.logs_conciliacao_retroativa FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "metas_financeiras Empresa-based access" ON public.metas_financeiras;
CREATE POLICY "Empresa-based access" ON public.metas_financeiras TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "mfa_sessions Users can delete their MFA sessions" ON public.mfa_sessions;
CREATE POLICY "Users can delete their MFA sessions" ON public.mfa_sessions FOR DELETE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "mfa_sessions Users can insert their MFA sessions" ON public.mfa_sessions;
CREATE POLICY "Users can insert their MFA sessions" ON public.mfa_sessions FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "mfa_sessions Users can manage own MFA sessions" ON public.mfa_sessions;
CREATE POLICY "Users can manage own MFA sessions" ON public.mfa_sessions TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "mfa_sessions Users can update their MFA sessions" ON public.mfa_sessions;
CREATE POLICY "Users can update their MFA sessions" ON public.mfa_sessions FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "movimentacoes Access by empresa_id" ON public.movimentacoes;
CREATE POLICY "Access by empresa_id" ON public.movimentacoes TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "n8n_dispatch_logs Admins e managers visualizam logs n8n" ON public.n8n_dispatch_logs;
CREATE POLICY "Admins e managers visualizam logs n8n" ON public.n8n_dispatch_logs FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "n8n_workflow_configs Admins e managers gerenciam configs n8n" ON public.n8n_workflow_configs;
CREATE POLICY "Admins e managers gerenciam configs n8n" ON public.n8n_workflow_configs TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "ncms ncms_select_authenticated" ON public.ncms;
CREATE POLICY ncms_select_authenticated ON public.ncms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ncms ncms_write_admin" ON public.ncms;
CREATE POLICY ncms_write_admin ON public.ncms TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "negativacoes negativacoes_empresa_select" ON public.negativacoes;
CREATE POLICY negativacoes_empresa_select ON public.negativacoes FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "negativacoes negativacoes_tenant_rw" ON public.negativacoes;
CREATE POLICY negativacoes_tenant_rw ON public.negativacoes TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "new_device_alerts Users can delete their device alerts" ON public.new_device_alerts;
CREATE POLICY "Users can delete their device alerts" ON public.new_device_alerts FOR DELETE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "new_device_alerts Users can insert their device alerts" ON public.new_device_alerts;
CREATE POLICY "Users can insert their device alerts" ON public.new_device_alerts FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "new_device_alerts Users can update their device alerts" ON public.new_device_alerts;
CREATE POLICY "Users can update their device alerts" ON public.new_device_alerts FOR UPDATE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "new_device_alerts Users can view own device alerts" ON public.new_device_alerts;
CREATE POLICY "Users can view own device alerts" ON public.new_device_alerts FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "nfe_eventos nfe_ev_read_via_nfe" ON public.nfe_eventos;
CREATE POLICY nfe_ev_read_via_nfe ON public.nfe_eventos FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM (public.nfe_recebidas r
     JOIN public.user_empresas ue ON ((ue.empresa_id = r.empresa_id)))
  WHERE ((r.chave_acesso = nfe_eventos.chave_acesso) AND (ue.user_id = ( SELECT auth.uid() AS uid)))))));

DROP POLICY IF EXISTS "nfe_recebidas nfe_rec_empresa_read" ON public.nfe_recebidas;
CREATE POLICY nfe_rec_empresa_read ON public.nfe_recebidas FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = nfe_recebidas.empresa_id)))))));

DROP POLICY IF EXISTS "nfe_recebidas nfe_rec_empresa_update" ON public.nfe_recebidas;
CREATE POLICY nfe_rec_empresa_update ON public.nfe_recebidas FOR UPDATE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = nfe_recebidas.empresa_id)))))));

DROP POLICY IF EXISTS "notas_fiscais notas_fiscais_empresa_select" ON public.notas_fiscais;
CREATE POLICY notas_fiscais_empresa_select ON public.notas_fiscais FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "notas_fiscais_ocr notas_fiscais_ocr_acesso" ON public.notas_fiscais_ocr;
CREATE POLICY notas_fiscais_ocr_acesso ON public.notas_fiscais_ocr TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "notification_history notification_history_owner" ON public.notification_history;
CREATE POLICY notification_history_owner ON public.notification_history TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "open_finance_consents Users can manage their own consents" ON public.open_finance_consents;
CREATE POLICY "Users can manage their own consents" ON public.open_finance_consents TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "operacoes_icms operacoes_icms_acesso" ON public.operacoes_icms;
CREATE POLICY operacoes_icms_acesso ON public.operacoes_icms TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "operacoes_tributaveis operacoes_tributaveis_empresa_select" ON public.operacoes_tributaveis;
CREATE POLICY operacoes_tributaveis_empresa_select ON public.operacoes_tributaveis FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "oportunidades_elisao oportunidades_elisao_acesso" ON public.oportunidades_elisao;
CREATE POLICY oportunidades_elisao_acesso ON public.oportunidades_elisao TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "organizacao_membros org_membros_manage_responsavel" ON public.organizacao_membros;
CREATE POLICY org_membros_manage_responsavel ON public.organizacao_membros TO authenticated USING ((public.is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role))) WITH CHECK ((public.is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "organizacao_membros org_membros_select" ON public.organizacao_membros;
CREATE POLICY org_membros_select ON public.organizacao_membros FOR SELECT TO authenticated USING (((usuario_id = ( SELECT auth.uid() AS uid)) OR public.is_org_membro(organizacao_id, ( SELECT auth.uid() AS uid)) OR public.is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "organizacoes organizacoes_delete_responsavel" ON public.organizacoes;
CREATE POLICY organizacoes_delete_responsavel ON public.organizacoes FOR DELETE TO authenticated USING (((responsavel_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "organizacoes organizacoes_insert_proprio" ON public.organizacoes;
CREATE POLICY organizacoes_insert_proprio ON public.organizacoes FOR INSERT TO authenticated WITH CHECK ((responsavel_id = ( SELECT auth.uid() AS uid)));

DROP POLICY IF EXISTS "organizacoes organizacoes_select_membro_ou_admin" ON public.organizacoes;
CREATE POLICY organizacoes_select_membro_ou_admin ON public.organizacoes FOR SELECT TO authenticated USING (((responsavel_id = ( SELECT auth.uid() AS uid)) OR public.is_org_membro(id, ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "organizacoes organizacoes_update_responsavel" ON public.organizacoes;
CREATE POLICY organizacoes_update_responsavel ON public.organizacoes FOR UPDATE TO authenticated USING (((responsavel_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role))) WITH CHECK (((responsavel_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "overlay_rejeicoes_auditoria Gestores atualizam auditoria de overlay" ON public.overlay_rejeicoes_auditoria;
CREATE POLICY "Gestores atualizam auditoria de overlay" ON public.overlay_rejeicoes_auditoria FOR UPDATE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "overlay_rejeicoes_auditoria Gestores inserem auditoria de overlay" ON public.overlay_rejeicoes_auditoria;
CREATE POLICY "Gestores inserem auditoria de overlay" ON public.overlay_rejeicoes_auditoria FOR INSERT TO authenticated WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "overlay_rejeicoes_auditoria Gestores leem auditoria de overlay" ON public.overlay_rejeicoes_auditoria;
CREATE POLICY "Gestores leem auditoria de overlay" ON public.overlay_rejeicoes_auditoria FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "overlay_rejeicoes_auditoria Gestores removem auditoria de overlay" ON public.overlay_rejeicoes_auditoria;
CREATE POLICY "Gestores removem auditoria de overlay" ON public.overlay_rejeicoes_auditoria FOR DELETE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "pagamentos_recorrentes pagamentos_recorrentes_acesso" ON public.pagamentos_recorrentes;
CREATE POLICY pagamentos_recorrentes_acesso ON public.pagamentos_recorrentes TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "parcelas_acordo parcelas_acordo_empresa_select" ON public.parcelas_acordo;
CREATE POLICY parcelas_acordo_empresa_select ON public.parcelas_acordo FOR SELECT TO authenticated USING ((acordo_id IN ( SELECT a.id
   FROM public.acordos_parcelamento a
  WHERE (a.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM public.user_empresas
          WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))))));

DROP POLICY IF EXISTS "parcelas_acordo parcelas_acordo_tenant_write" ON public.parcelas_acordo;
CREATE POLICY parcelas_acordo_tenant_write ON public.parcelas_acordo TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND (EXISTS ( SELECT 1
   FROM public.acordos_parcelamento a
  WHERE ((a.id = parcelas_acordo.acordo_id) AND public.empresa_acessivel(a.empresa_id)))))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND (EXISTS ( SELECT 1
   FROM public.acordos_parcelamento a
  WHERE ((a.id = parcelas_acordo.acordo_id) AND public.empresa_acessivel(a.empresa_id))))));

DROP POLICY IF EXISTS "partidas_contabeis Partidas scoped by lancamento" ON public.partidas_contabeis;
CREATE POLICY "Partidas scoped by lancamento" ON public.partidas_contabeis TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lancamentos_contabeis lc
  WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id
           FROM public.user_empresas ue
          WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.lancamentos_contabeis lc
  WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id
           FROM public.user_empresas ue
          WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))))));

DROP POLICY IF EXISTS "password_reset_requests Admins and managers can view reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins and managers can view reset requests" ON public.password_reset_requests FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "password_reset_requests Admins can update reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can update reset requests" ON public.password_reset_requests FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "password_reset_requests Users can request own password reset" ON public.password_reset_requests;
CREATE POLICY "Users can request own password reset" ON public.password_reset_requests FOR INSERT TO authenticated WITH CHECK ((user_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = ( SELECT auth.uid() AS uid))))::text));

DROP POLICY IF EXISTS "password_reset_tokens Admins can delete reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Admins can delete reset tokens" ON public.password_reset_tokens FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "password_reset_tokens Authenticated can insert own reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Authenticated can insert own reset tokens" ON public.password_reset_tokens FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "password_reset_tokens Users can select own reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Users can select own reset tokens" ON public.password_reset_tokens FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "pedidos_compra pedidos_compra_empresa_select" ON public.pedidos_compra;
CREATE POLICY pedidos_compra_empresa_select ON public.pedidos_compra FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "per_dcomp per_dcomp_acesso" ON public.per_dcomp;
CREATE POLICY per_dcomp_acesso ON public.per_dcomp TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "performance_alerts Admins podem ler alertas de performance" ON public.performance_alerts;
CREATE POLICY "Admins podem ler alertas de performance" ON public.performance_alerts FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "permissions Admins can delete permissions" ON public.permissions;
CREATE POLICY "Admins can delete permissions" ON public.permissions FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "permissions Admins can insert permissions" ON public.permissions;
CREATE POLICY "Admins can insert permissions" ON public.permissions FOR INSERT TO authenticated WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "permissions Admins can update permissions" ON public.permissions;
CREATE POLICY "Admins can update permissions" ON public.permissions FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "permissions Anyone authenticated can view permissions" ON public.permissions;
CREATE POLICY "Anyone authenticated can view permissions" ON public.permissions FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) IS NOT NULL));

DROP POLICY IF EXISTS "pg_stat_statements_baseline Admins can view baselines" ON public.pg_stat_statements_baseline;
CREATE POLICY "Admins can view baselines" ON public.pg_stat_statements_baseline FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "pix_templates pix_templates_empresa_select" ON public.pix_templates;
CREATE POLICY pix_templates_empresa_select ON public.pix_templates FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "pix_templates pix_templates_tenant_rw" ON public.pix_templates;
CREATE POLICY pix_templates_tenant_rw ON public.pix_templates TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "plano_contas Empresa-based access" ON public.plano_contas;
CREATE POLICY "Empresa-based access" ON public.plano_contas TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "planos_acao planos_acao_owner" ON public.planos_acao;
CREATE POLICY planos_acao_owner ON public.planos_acao TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "portal_cliente_acessos portal_acessos_admin_insert" ON public.portal_cliente_acessos;
CREATE POLICY portal_acessos_admin_insert ON public.portal_cliente_acessos FOR INSERT TO authenticated WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "portal_cliente_acessos portal_acessos_admin_select" ON public.portal_cliente_acessos;
CREATE POLICY portal_acessos_admin_select ON public.portal_cliente_acessos FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "portal_cliente_tokens portal_tokens_admin_all" ON public.portal_cliente_tokens;
CREATE POLICY portal_tokens_admin_all ON public.portal_cliente_tokens TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "prejuizos_fiscais prejuizos_fiscais_empresa_select" ON public.prejuizos_fiscais;
CREATE POLICY prejuizos_fiscais_empresa_select ON public.prejuizos_fiscais FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "prejuizos_fiscais prejuizos_fiscais_tenant_rw" ON public.prejuizos_fiscais;
CREATE POLICY prejuizos_fiscais_tenant_rw ON public.prejuizos_fiscais TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "profiles Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "profiles Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id))) WITH CHECK ((((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id)) AND public.profile_sensitive_fields_unchanged(id, user_id, role, empresa_id)));

DROP POLICY IF EXISTS "profiles Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = id) OR (( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "projecoes_reforma projecoes_reforma_acesso" ON public.projecoes_reforma;
CREATE POLICY projecoes_reforma_acesso ON public.projecoes_reforma TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "protestos protestos_empresa_select" ON public.protestos;
CREATE POLICY protestos_empresa_select ON public.protestos FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "protestos protestos_tenant_rw" ON public.protestos;
CREATE POLICY protestos_tenant_rw ON public.protestos TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "protocolos_st protocolos_st_select_authenticated" ON public.protocolos_st;
CREATE POLICY protocolos_st_select_authenticated ON public.protocolos_st FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "protocolos_st protocolos_st_write_admin" ON public.protocolos_st;
CREATE POLICY protocolos_st_write_admin ON public.protocolos_st TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "protocolos_st_ncms protocolos_st_ncms_select_authenticated" ON public.protocolos_st_ncms;
CREATE POLICY protocolos_st_ncms_select_authenticated ON public.protocolos_st_ncms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "protocolos_st_ncms protocolos_st_ncms_write_admin" ON public.protocolos_st_ncms;
CREATE POLICY protocolos_st_ncms_write_admin ON public.protocolos_st_ncms TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "protocolos_st_ufs protocolos_st_ufs_select_authenticated" ON public.protocolos_st_ufs;
CREATE POLICY protocolos_st_ufs_select_authenticated ON public.protocolos_st_ufs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "protocolos_st_ufs protocolos_st_ufs_write_admin" ON public.protocolos_st_ufs;
CREATE POLICY protocolos_st_ufs_write_admin ON public.protocolos_st_ufs TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "push_subscriptions push_subscriptions_owner" ON public.push_subscriptions;
CREATE POLICY push_subscriptions_owner ON public.push_subscriptions TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "query_telemetry Admins can manage telemetry" ON public.query_telemetry;
CREATE POLICY "Admins can manage telemetry" ON public.query_telemetry TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "query_telemetry Managers can view telemetry" ON public.query_telemetry;
CREATE POLICY "Managers can view telemetry" ON public.query_telemetry FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role));

DROP POLICY IF EXISTS "query_telemetry System can insert telemetry" ON public.query_telemetry;
CREATE POLICY "System can insert telemetry" ON public.query_telemetry FOR INSERT TO authenticated WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'operacional'::public.app_role)));

DROP POLICY IF EXISTS "rate_limit_logs Admins can view rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "rate_limit_logs Authenticated can insert rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "Authenticated can insert rate limit logs" ON public.rate_limit_logs FOR INSERT TO authenticated WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'operacional'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'visualizador'::public.app_role)));

DROP POLICY IF EXISTS "recomendacoes_metas_ia recomendacoes_metas_ia_empresa_select" ON public.recomendacoes_metas_ia;
CREATE POLICY recomendacoes_metas_ia_empresa_select ON public.recomendacoes_metas_ia FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "regime_decision_cache regime_cache_select" ON public.regime_decision_cache;
CREATE POLICY regime_cache_select ON public.regime_decision_cache FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "regimes_especiais_empresa Access by empresa_id" ON public.regimes_especiais_empresa;
CREATE POLICY "Access by empresa_id" ON public.regimes_especiais_empresa TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "regimes_simulados regimes_simulados_empresa_insert" ON public.regimes_simulados;
CREATE POLICY regimes_simulados_empresa_insert ON public.regimes_simulados FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "regimes_simulados regimes_simulados_empresa_select" ON public.regimes_simulados;
CREATE POLICY regimes_simulados_empresa_select ON public.regimes_simulados FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "regimes_tributarios Empresa-based access" ON public.regimes_tributarios;
CREATE POLICY "Empresa-based access" ON public.regimes_tributarios TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "regras_conciliacao Empresa-based access" ON public.regras_conciliacao;
CREATE POLICY "Empresa-based access" ON public.regras_conciliacao TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "regras_contabilizacao_automatica regras_contab_select" ON public.regras_contabilizacao_automatica;
CREATE POLICY regras_contab_select ON public.regras_contabilizacao_automatica FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "regras_contabilizacao_automatica regras_contab_write" ON public.regras_contabilizacao_automatica;
CREATE POLICY regras_contab_write ON public.regras_contabilizacao_automatica TO authenticated USING ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'contador'::public.app_role)))) WITH CHECK ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'contador'::public.app_role))));

DROP POLICY IF EXISTS "regras_duplicidade Empresa-based access" ON public.regras_duplicidade;
CREATE POLICY "Empresa-based access" ON public.regras_duplicidade TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "regras_roteamento_financeiro Empresa-based access" ON public.regras_roteamento_financeiro;
CREATE POLICY "Empresa-based access" ON public.regras_roteamento_financeiro TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "regua_cobranca regua_cobranca_empresa_select" ON public.regua_cobranca;
CREATE POLICY regua_cobranca_empresa_select ON public.regua_cobranca FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "regua_cobranca regua_cobranca_tenant_rw" ON public.regua_cobranca;
CREATE POLICY regua_cobranca_tenant_rw ON public.regua_cobranca TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "regua_cobranca_etapas regua_cobranca_etapas_empresa_select" ON public.regua_cobranca_etapas;
CREATE POLICY regua_cobranca_etapas_empresa_select ON public.regua_cobranca_etapas FOR SELECT TO authenticated USING ((regua_id IN ( SELECT regua_cobranca.id
   FROM public.regua_cobranca
  WHERE (regua_cobranca.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM public.user_empresas
          WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))))));

DROP POLICY IF EXISTS "regua_cobranca_etapas regua_cobranca_etapas_tenant_write" ON public.regua_cobranca_etapas;
CREATE POLICY regua_cobranca_etapas_tenant_write ON public.regua_cobranca_etapas TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.regua_cobranca r
  WHERE ((r.id = regua_cobranca_etapas.regua_id) AND public.empresa_acessivel(r.empresa_id)))))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.regua_cobranca r
  WHERE ((r.id = regua_cobranca_etapas.regua_id) AND public.empresa_acessivel(r.empresa_id))))));

DROP POLICY IF EXISTS "regua_cobranca_status Access by empresa_id" ON public.regua_cobranca_status;
CREATE POLICY "Access by empresa_id" ON public.regua_cobranca_status TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "relatorios_agendados relatorios_agendados_proprios" ON public.relatorios_agendados;
CREATE POLICY relatorios_agendados_proprios ON public.relatorios_agendados TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "relatorios_tributarios_agendados rel_trib_agend_all" ON public.relatorios_tributarios_agendados;
CREATE POLICY rel_trib_agend_all ON public.relatorios_tributarios_agendados TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "resumos_executivos_semanais Empresa-based access" ON public.resumos_executivos_semanais;
CREATE POLICY "Empresa-based access" ON public.resumos_executivos_semanais TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "retencao_politicas retencao_politicas_admin_select" ON public.retencao_politicas;
CREATE POLICY retencao_politicas_admin_select ON public.retencao_politicas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "retencoes_fonte Empresa-based access" ON public.retencoes_fonte;
CREATE POLICY "Empresa-based access" ON public.retencoes_fonte TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "risk_rules risk_rules_tenant_delete" ON public.risk_rules;
CREATE POLICY risk_rules_tenant_delete ON public.risk_rules FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));

DROP POLICY IF EXISTS "risk_rules risk_rules_tenant_insert" ON public.risk_rules;
CREATE POLICY risk_rules_tenant_insert ON public.risk_rules FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role))));

DROP POLICY IF EXISTS "risk_rules risk_rules_tenant_select" ON public.risk_rules;
CREATE POLICY risk_rules_tenant_select ON public.risk_rules FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS "risk_rules risk_rules_tenant_update" ON public.risk_rules;
CREATE POLICY risk_rules_tenant_update ON public.risk_rules FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));

DROP POLICY IF EXISTS "role_permissions Admins can delete role permissions" ON public.role_permissions;
CREATE POLICY "Admins can delete role permissions" ON public.role_permissions FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "role_permissions Admins can insert role permissions" ON public.role_permissions;
CREATE POLICY "Admins can insert role permissions" ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "role_permissions Admins can manage role_permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "role_permissions Admins can update role permissions" ON public.role_permissions;
CREATE POLICY "Admins can update role permissions" ON public.role_permissions FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "role_permissions Anyone authenticated can view role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone authenticated can view role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) IS NOT NULL));

DROP POLICY IF EXISTS "rpc_observability_metrics admin_read_rpc_metrics" ON public.rpc_observability_metrics;
CREATE POLICY admin_read_rpc_metrics ON public.rpc_observability_metrics FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "runtime_error_logs Admins can delete error logs" ON public.runtime_error_logs;
CREATE POLICY "Admins can delete error logs" ON public.runtime_error_logs FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "runtime_error_logs Admins can update error logs" ON public.runtime_error_logs;
CREATE POLICY "Admins can update error logs" ON public.runtime_error_logs FOR UPDATE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "runtime_error_logs Admins managers can view error logs" ON public.runtime_error_logs;
CREATE POLICY "Admins managers can view error logs" ON public.runtime_error_logs FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "runtime_error_logs Authenticated can insert error logs" ON public.runtime_error_logs;
CREATE POLICY "Authenticated can insert error logs" ON public.runtime_error_logs FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));

DROP POLICY IF EXISTS "saved_filter_subscriptions saved_filter_subscriptions_owner" ON public.saved_filter_subscriptions;
CREATE POLICY saved_filter_subscriptions_owner ON public.saved_filter_subscriptions TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "saved_filters saved_filters_owner_write" ON public.saved_filters;
CREATE POLICY saved_filters_owner_write ON public.saved_filters TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "saved_filters saved_filters_select" ON public.saved_filters;
CREATE POLICY saved_filters_select ON public.saved_filters FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (is_shared AND (empresa_id IS NOT NULL) AND public.empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (saved_filters.shared_with_roles))))))));

DROP POLICY IF EXISTS "scim_operations_log scim_operations_log_admin_select" ON public.scim_operations_log;
CREATE POLICY scim_operations_log_admin_select ON public.scim_operations_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "scim_setup_checklist scim_checklist_own" ON public.scim_setup_checklist;
CREATE POLICY scim_checklist_own ON public.scim_setup_checklist TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "scim_tokens Admins manage scim_tokens" ON public.scim_tokens;
CREATE POLICY "Admins manage scim_tokens" ON public.scim_tokens TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role)))));

DROP POLICY IF EXISTS "security_alerts security_alerts_admin_all" ON public.security_alerts;
CREATE POLICY security_alerts_admin_all ON public.security_alerts TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "security_audit_logs Authenticated users can insert security logs" ON public.security_audit_logs;
CREATE POLICY "Authenticated users can insert security logs" ON public.security_audit_logs FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));

DROP POLICY IF EXISTS "security_audit_logs Only admins can view security logs" ON public.security_audit_logs;
CREATE POLICY "Only admins can view security logs" ON public.security_audit_logs FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "security_settings sec_settings_admin_all" ON public.security_settings;
CREATE POLICY sec_settings_admin_all ON public.security_settings TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "sefaz_dfe_cursor cursor_admin_read" ON public.sefaz_dfe_cursor;
CREATE POLICY cursor_admin_read ON public.sefaz_dfe_cursor FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "sessoes_conciliacao Owner manage sessoes" ON public.sessoes_conciliacao;
CREATE POLICY "Owner manage sessoes" ON public.sessoes_conciliacao TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "sessoes_conciliacao Users can manage their own sessoes_conciliacao" ON public.sessoes_conciliacao;
CREATE POLICY "Users can manage their own sessoes_conciliacao" ON public.sessoes_conciliacao TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "simulacao_tributos_detalhados sim_trib_acesso" ON public.simulacao_tributos_detalhados;
CREATE POLICY sim_trib_acesso ON public.simulacao_tributos_detalhados TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.simulacoes s
  WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND public.empresa_acessivel(s.empresa_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.simulacoes s
  WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND public.empresa_acessivel(s.empresa_id)))));

DROP POLICY IF EXISTS "simulacoes simulacoes_acesso" ON public.simulacoes;
CREATE POLICY simulacoes_acesso ON public.simulacoes TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "slo_metrics_diarias slo_metrics_admin_select" ON public.slo_metrics_diarias;
CREATE POLICY slo_metrics_admin_select ON public.slo_metrics_diarias FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "slow_query_alerts Admins podem visualizar slow_query_alerts" ON public.slow_query_alerts;
CREATE POLICY "Admins podem visualizar slow_query_alerts" ON public.slow_query_alerts FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "solicitacoes_aprovacao Owner manage aprovacoes" ON public.solicitacoes_aprovacao;
CREATE POLICY "Owner manage aprovacoes" ON public.solicitacoes_aprovacao TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "solicitacoes_lgpd lgpd_owner_insert" ON public.solicitacoes_lgpd;
CREATE POLICY lgpd_owner_insert ON public.solicitacoes_lgpd FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id))));

DROP POLICY IF EXISTS "solicitacoes_lgpd lgpd_scoped_select" ON public.solicitacoes_lgpd;
CREATE POLICY lgpd_scoped_select ON public.solicitacoes_lgpd FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empresa_id IS NOT NULL) AND public.empresa_membro_ativo(empresa_id))));

DROP POLICY IF EXISTS "solicitacoes_lgpd lgpd_scoped_update" ON public.solicitacoes_lgpd;
CREATE POLICY lgpd_scoped_update ON public.solicitacoes_lgpd FOR UPDATE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empresa_id IS NOT NULL) AND public.empresa_membro_ativo(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empresa_id IS NOT NULL) AND public.empresa_membro_ativo(empresa_id)));

DROP POLICY IF EXISTS "sped_contabil_arquivos sped_arquivos_delete_admin" ON public.sped_contabil_arquivos;
CREATE POLICY sped_arquivos_delete_admin ON public.sped_contabil_arquivos FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "sped_contabil_arquivos sped_arquivos_insert" ON public.sped_contabil_arquivos;
CREATE POLICY sped_arquivos_insert ON public.sped_contabil_arquivos FOR INSERT TO authenticated WITH CHECK (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "sped_contabil_arquivos sped_arquivos_select" ON public.sped_contabil_arquivos;
CREATE POLICY sped_arquivos_select ON public.sped_contabil_arquivos FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "sped_contabil_arquivos sped_arquivos_update_admin" ON public.sped_contabil_arquivos;
CREATE POLICY sped_arquivos_update_admin ON public.sped_contabil_arquivos FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "split_payment_transacoes split_payment_empresa_insert" ON public.split_payment_transacoes;
CREATE POLICY split_payment_empresa_insert ON public.split_payment_transacoes FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "split_payment_transacoes split_payment_empresa_select" ON public.split_payment_transacoes;
CREATE POLICY split_payment_empresa_select ON public.split_payment_transacoes FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "split_payment_transacoes split_payment_empresa_update" ON public.split_payment_transacoes;
CREATE POLICY split_payment_empresa_update ON public.split_payment_transacoes FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "sso_login_attempts Admins can view SSO login attempts" ON public.sso_login_attempts;
CREATE POLICY "Admins can view SSO login attempts" ON public.sso_login_attempts FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "sso_providers Admins manage sso providers" ON public.sso_providers;
CREATE POLICY "Admins manage sso providers" ON public.sso_providers TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "sso_role_mappings sso_role_mappings_admin" ON public.sso_role_mappings;
CREATE POLICY sso_role_mappings_admin ON public.sso_role_mappings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "sso_sandbox_runs sso_sandbox_runs_admin" ON public.sso_sandbox_runs;
CREATE POLICY sso_sandbox_runs_admin ON public.sso_sandbox_runs TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (created_by = auth.uid())));

DROP POLICY IF EXISTS "sso_user_groups sso_user_groups_select" ON public.sso_user_groups;
CREATE POLICY sso_user_groups_select ON public.sso_user_groups FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "tax_audit_trail tax_audit_select" ON public.tax_audit_trail;
CREATE POLICY tax_audit_select ON public.tax_audit_trail FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR ((empresa_id IS NOT NULL) AND public.empresa_acessivel(empresa_id))));

DROP POLICY IF EXISTS "templates_cobranca templates_cobranca_empresa_select" ON public.templates_cobranca;
CREATE POLICY templates_cobranca_empresa_select ON public.templates_cobranca FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))));

DROP POLICY IF EXISTS "templates_cobranca templates_cobranca_tenant_rw" ON public.templates_cobranca;
CREATE POLICY templates_cobranca_tenant_rw ON public.templates_cobranca TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));

DROP POLICY IF EXISTS "transacoes_bancarias transacoes_bancarias_empresa_select" ON public.transacoes_bancarias;
CREATE POLICY transacoes_bancarias_empresa_select ON public.transacoes_bancarias FOR SELECT TO authenticated USING ((conta_bancaria_id IN ( SELECT contas_bancarias.id
   FROM public.contas_bancarias
  WHERE (contas_bancarias.empresa_id IN ( SELECT user_empresas.empresa_id
           FROM public.user_empresas
          WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))))));

DROP POLICY IF EXISTS "transferencias Empresa-based access" ON public.transferencias;
CREATE POLICY "Empresa-based access" ON public.transferencias TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "ufs ufs_select_authenticated" ON public.ufs;
CREATE POLICY ufs_select_authenticated ON public.ufs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ufs ufs_write_admin" ON public.ufs;
CREATE POLICY ufs_write_admin ON public.ufs TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "user_action_audit Users can insert their own audit logs" ON public.user_action_audit;
CREATE POLICY "Users can insert their own audit logs" ON public.user_action_audit FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_action_audit Users can view their own audit logs" ON public.user_action_audit;
CREATE POLICY "Users can view their own audit logs" ON public.user_action_audit FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_active_filters user_active_filters_owner" ON public.user_active_filters;
CREATE POLICY user_active_filters_owner ON public.user_active_filters TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

DROP POLICY IF EXISTS "user_anomalia_preferences Users can manage their own preferences" ON public.user_anomalia_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_anomalia_preferences TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_demonstrativo_preferences Users can manage their own preferences" ON public.user_demonstrativo_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_demonstrativo_preferences TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_devices Users can delete their devices" ON public.user_devices;
CREATE POLICY "Users can delete their devices" ON public.user_devices FOR DELETE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "user_devices Users can insert their devices" ON public.user_devices;
CREATE POLICY "Users can insert their devices" ON public.user_devices FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_devices Users can manage own devices" ON public.user_devices;
CREATE POLICY "Users can manage own devices" ON public.user_devices TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_devices Users can update their devices" ON public.user_devices;
CREATE POLICY "Users can update their devices" ON public.user_devices FOR UPDATE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "user_devices Users can view own devices" ON public.user_devices;
CREATE POLICY "Users can view own devices" ON public.user_devices FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_digest_preferences Admins visualizam preferencias de digest" ON public.user_digest_preferences;
CREATE POLICY "Admins visualizam preferencias de digest" ON public.user_digest_preferences FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "user_digest_preferences Usuarios gerenciam suas preferencias de digest" ON public.user_digest_preferences;
CREATE POLICY "Usuarios gerenciam suas preferencias de digest" ON public.user_digest_preferences TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_empresas Admins manage user_empresas" ON public.user_empresas;
CREATE POLICY "Admins manage user_empresas" ON public.user_empresas TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "user_empresas Users view own empresa links" ON public.user_empresas;
CREATE POLICY "Users view own empresa links" ON public.user_empresas FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "user_filter_presets Users can manage their presets" ON public.user_filter_presets;
CREATE POLICY "Users can manage their presets" ON public.user_filter_presets TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_onboarding_progress Users can insert their own onboarding progress" ON public.user_onboarding_progress;
CREATE POLICY "Users can insert their own onboarding progress" ON public.user_onboarding_progress FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_onboarding_progress Users can update their own onboarding progress" ON public.user_onboarding_progress;
CREATE POLICY "Users can update their own onboarding progress" ON public.user_onboarding_progress FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_onboarding_progress Users can view their own onboarding progress" ON public.user_onboarding_progress;
CREATE POLICY "Users can view their own onboarding progress" ON public.user_onboarding_progress FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_passkeys Users can delete own passkeys" ON public.user_passkeys;
CREATE POLICY "Users can delete own passkeys" ON public.user_passkeys FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_passkeys Users can delete their passkeys" ON public.user_passkeys;
CREATE POLICY "Users can delete their passkeys" ON public.user_passkeys FOR DELETE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "user_passkeys Users can insert own passkeys" ON public.user_passkeys;
CREATE POLICY "Users can insert own passkeys" ON public.user_passkeys FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_passkeys Users can insert their passkeys" ON public.user_passkeys;
CREATE POLICY "Users can insert their passkeys" ON public.user_passkeys FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_passkeys Users can update own passkeys" ON public.user_passkeys;
CREATE POLICY "Users can update own passkeys" ON public.user_passkeys FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_passkeys Users can update their passkeys" ON public.user_passkeys;
CREATE POLICY "Users can update their passkeys" ON public.user_passkeys FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_passkeys Users can view own passkeys" ON public.user_passkeys;
CREATE POLICY "Users can view own passkeys" ON public.user_passkeys FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "user_roles Admins can delete user roles" ON public.user_roles;
CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "user_roles Admins can insert user roles" ON public.user_roles;
CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "user_roles Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "user_roles Admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins can update user roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "user_roles Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "user_sessions Users see own sessions" ON public.user_sessions;
CREATE POLICY "Users see own sessions" ON public.user_sessions FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "vendedores Empresa-based access" ON public.vendedores;
CREATE POLICY "Empresa-based access" ON public.vendedores TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "verificacoes_conformidade Access by empresa_id" ON public.verificacoes_conformidade;
CREATE POLICY "Access by empresa_id" ON public.verificacoes_conformidade TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

DROP POLICY IF EXISTS "webauthn_challenges Authenticated can create challenges" ON public.webauthn_challenges;
CREATE POLICY "Authenticated can create challenges" ON public.webauthn_challenges FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "webauthn_challenges Authenticated can read own challenges" ON public.webauthn_challenges;
CREATE POLICY "Authenticated can read own challenges" ON public.webauthn_challenges FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "webauthn_challenges Users can delete their challenges" ON public.webauthn_challenges;
CREATE POLICY "Users can delete their challenges" ON public.webauthn_challenges FOR DELETE TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "webauthn_challenges Users can insert their challenges" ON public.webauthn_challenges;
CREATE POLICY "Users can insert their challenges" ON public.webauthn_challenges FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "webauthn_challenges Users can update their challenges" ON public.webauthn_challenges;
CREATE POLICY "Users can update their challenges" ON public.webauthn_challenges FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "webauthn_credentials users manage own webauthn" ON public.webauthn_credentials;
CREATE POLICY "users manage own webauthn" ON public.webauthn_credentials TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

DROP POLICY IF EXISTS "webhook_dlq Admins podem atualizar DLQ" ON public.webhook_dlq;
CREATE POLICY "Admins podem atualizar DLQ" ON public.webhook_dlq FOR UPDATE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "webhook_dlq Admins podem visualizar DLQ" ON public.webhook_dlq;
CREATE POLICY "Admins podem visualizar DLQ" ON public.webhook_dlq FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "webhook_events Admins can delete events" ON public.webhook_events;
CREATE POLICY "Admins can delete events" ON public.webhook_events FOR DELETE TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "webhook_events Authorized roles can view webhook events" ON public.webhook_events;
CREATE POLICY "Authorized roles can view webhook events" ON public.webhook_events FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "webhook_events Authorized roles can view webhooks" ON public.webhook_events;
CREATE POLICY "Authorized roles can view webhooks" ON public.webhook_events FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "webhook_events Managers can update events" ON public.webhook_events;
CREATE POLICY "Managers can update events" ON public.webhook_events FOR UPDATE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));

DROP POLICY IF EXISTS "webhook_events Operators can insert events" ON public.webhook_events;
CREATE POLICY "Operators can insert events" ON public.webhook_events FOR INSERT TO authenticated WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'operacional'::public.app_role)));

DROP POLICY IF EXISTS "webhook_events Viewers can view webhook events" ON public.webhook_events;
CREATE POLICY "Viewers can view webhook events" ON public.webhook_events FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'visualizador'::public.app_role));

DROP POLICY IF EXISTS "webhook_simulation_results Users can view simulation results" ON public.webhook_simulation_results;
CREATE POLICY "Users can view simulation results" ON public.webhook_simulation_results FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.webhook_simulation_runs r
  WHERE ((r.id = webhook_simulation_results.run_id) AND (r.created_by = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "webhook_simulation_runs Users can insert simulation runs" ON public.webhook_simulation_runs;
CREATE POLICY "Users can insert simulation runs" ON public.webhook_simulation_runs FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = created_by));

DROP POLICY IF EXISTS "webhook_simulation_runs Users can view simulation runs" ON public.webhook_simulation_runs;
CREATE POLICY "Users can view simulation runs" ON public.webhook_simulation_runs FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = created_by));

DROP POLICY IF EXISTS "webhooks_log webhooks_log_admin_insert" ON public.webhooks_log;
CREATE POLICY webhooks_log_admin_insert ON public.webhooks_log FOR INSERT TO authenticated WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "webhooks_log webhooks_log_admin_select" ON public.webhooks_log;
CREATE POLICY webhooks_log_admin_select ON public.webhooks_log FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));

DROP POLICY IF EXISTS "whatsapp_conversas Empresa-based access" ON public.whatsapp_conversas;
CREATE POLICY "Empresa-based access" ON public.whatsapp_conversas TO authenticated USING (((empresa_id IN ( SELECT user_empresas.empresa_id
   FROM public.user_empresas
  WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::public.app_role))))));

-- SECAO 4: Indices ausentes (49)

CREATE UNIQUE INDEX IF NOT EXISTS aliq_iss_mun_geral_unq ON public.aliquotas_iss_municipal USING btree (codigo_ibge, vigente_de) WHERE (item_lista_id IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS catalogos_fiscais_cargas_checksum_key ON public.catalogos_fiscais_cargas USING btree (checksum);

CREATE INDEX IF NOT EXISTS catalogos_fiscais_cargas_last_updated_idx ON public.catalogos_fiscais_cargas USING btree (last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_alert_configurations_empresa ON public.alert_configurations USING btree (empresa_id);

CREATE INDEX IF NOT EXISTS idx_alertas_empresa_id ON public.alertas USING btree (empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_empresa ON public.alerts USING btree (empresa_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_trib_criado ON public.auditoria_tributaria USING btree (criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_trib_entidade ON public.auditoria_tributaria USING btree (entidade_tipo, entidade_id);

CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON public.benchmarks_setoriais USING btree (regime, cnae_prefix);

CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_modulo ON public.bling_sync_logs USING btree (modulo);

CREATE INDEX IF NOT EXISTS idx_bling_webhook_events_resource ON public.bling_webhook_events USING btree (module, resource_id);

CREATE INDEX IF NOT EXISTS idx_contas_receber_bitrix_deal ON public.contas_receber USING btree (bitrix_deal_id) WHERE (bitrix_deal_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_fe_alert_state_ultimo ON public.frontend_error_alert_state USING btree (ultimo_alerta_em DESC);

CREATE INDEX IF NOT EXISTS idx_fe_silence_digest_executado ON public.frontend_error_silence_digest_log USING btree (executado_em DESC);

CREATE INDEX IF NOT EXISTS idx_frontend_error_logs_sev_created ON ONLY public.frontend_error_logs USING btree (severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_index_usage_snapshots_idx_date ON public.index_usage_snapshots USING btree (index_name, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_op_icms_empresa ON public.operacoes_icms USING btree (empresa_id, data_operacao DESC);

CREATE INDEX IF NOT EXISTS idx_oport_empresa ON public.oportunidades_elisao USING btree (empresa_id, aplicavel);

CREATE INDEX IF NOT EXISTS idx_overlay_rejeicoes_abertas ON public.overlay_rejeicoes_auditoria USING btree (resolvido_em) WHERE (resolvido_em IS NULL);

CREATE INDEX IF NOT EXISTS idx_overlay_rejeicoes_catalogo ON public.overlay_rejeicoes_auditoria USING btree (catalogo, referencia DESC);

CREATE INDEX IF NOT EXISTS idx_pag_recorr_empresa ON public.pagamentos_recorrentes USING btree (empresa_id, ativo);

CREATE INDEX IF NOT EXISTS idx_pag_recorr_proxima ON public.pagamentos_recorrentes USING btree (proxima_geracao) WHERE ativo;

CREATE INDEX IF NOT EXISTS idx_perf_alerts_open ON public.performance_alerts USING btree (created_at DESC) WHERE (resolved_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_perf_alerts_resolved_created ON public.performance_alerts USING btree (created_at) WHERE (resolved_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_pix_templates_uso ON public.pix_templates USING btree (ativo, uso_count DESC);

CREATE INDEX IF NOT EXISTS idx_regimes_simulados_ajustes_aplicados ON public.regimes_simulados USING gin (ajustes_aplicados);

CREATE INDEX IF NOT EXISTS idx_regras_contab_lookup ON public.regras_contabilizacao_automatica USING btree (empresa_id, tipo_evento, ativo, prioridade);

CREATE INDEX IF NOT EXISTS idx_risk_rules_empresa ON public.risk_rules USING btree (empresa_id);

CREATE INDEX IF NOT EXISTS idx_scim_operations_log_empresa_id ON public.scim_operations_log USING btree (empresa_id);

CREATE INDEX IF NOT EXISTS idx_scim_ops_token ON public.scim_operations_log USING btree (token_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts USING btree (resolved) WHERE (resolved = false);

CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts USING btree (type);

CREATE INDEX IF NOT EXISTS idx_sim_hash ON public.simulacoes USING btree (hash_inputs);

CREATE INDEX IF NOT EXISTS idx_sim_trib_regime ON public.simulacao_tributos_detalhados USING btree (simulacao_id, regime);

CREATE INDEX IF NOT EXISTS idx_sim_trib_sim ON public.simulacao_tributos_detalhados USING btree (simulacao_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_empresa_id ON public.solicitacoes_lgpd USING btree (empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sped_arq_empresa_tipo_ano ON public.sped_contabil_arquivos USING btree (empresa_id, tipo, ano_calendario, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sso_role_mappings_provider ON public.sso_role_mappings USING btree (provider_id, ordem);

CREATE INDEX IF NOT EXISTS idx_sso_sandbox_runs_batch ON public.sso_sandbox_runs USING btree (batch_id);

CREATE INDEX IF NOT EXISTS idx_tarefas_elisao_empresa ON public.elisao_tarefas_acionaveis USING btree (empresa_id, prazo);

CREATE INDEX IF NOT EXISTS lancamentos_contabeis_empresa_comp_idx ON public.lancamentos_contabeis USING btree (empresa_id, competencia);

CREATE INDEX IF NOT EXISTS partidas_contabeis_conta_idx ON public.partidas_contabeis USING btree (conta_id);

CREATE INDEX IF NOT EXISTS partidas_contabeis_conta_lanc_idx ON public.partidas_contabeis USING btree (conta_id, lancamento_id) INCLUDE (tipo, valor);

CREATE INDEX IF NOT EXISTS plano_contas_codigo_referencial_idx ON public.plano_contas USING btree (empresa_id, codigo_referencial);

CREATE UNIQUE INDEX IF NOT EXISTS plano_contas_empresa_codigo_uidx ON public.plano_contas USING btree (empresa_id, codigo) WHERE (empresa_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS plano_contas_parent_idx ON public.plano_contas USING btree (parent_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_acessos_suspeitos_janela ON public.acessos_suspeitos USING btree (tipo, janela_inicio, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(empresa_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(table_name, ''::text));

CREATE UNIQUE INDEX IF NOT EXISTS uq_convite_contador_ativo ON public.convites_contador USING btree (empresa_id, lower(email)) WHERE ((revoked_at IS NULL) AND (accepted_at IS NULL));

CREATE UNIQUE INDEX IF NOT EXISTS uq_eventos_contab_sucesso ON public.eventos_contabilizacao_log USING btree (tipo_evento, evento_id) WHERE (status = 'sucesso'::text);

-- SECAO 5: Constraints ausentes (58)

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alert_configurations_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.alert_configurations
    ADD CONSTRAINT alert_configurations_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alertas_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.alertas
    ADD CONSTRAINT alertas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alerts_driver_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alerts_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alerts_order_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.lalamove_orders(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='aliquotas_interestaduais_unq' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.aliquotas_interestaduais
    ADD CONSTRAINT aliquotas_interestaduais_unq UNIQUE (uf_origem, uf_destino, vigente_de);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='aliquotas_internas_uf_unq' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.aliquotas_internas_uf
    ADD CONSTRAINT aliquotas_internas_uf_unq UNIQUE (uf, categoria_produto, vigente_de);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='aliq_iss_mun_unq' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.aliquotas_iss_municipal
    ADD CONSTRAINT aliq_iss_mun_unq UNIQUE (codigo_ibge, item_lista_id, vigente_de);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='api_keys_hash_unico' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_hash_unico UNIQUE (key_hash);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='api_keys_nome_unico_por_empresa' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_nome_unico_por_empresa UNIQUE (empresa_id, name);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='audit_logs_pkey1' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey1 PRIMARY KEY (id, created_at);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='auditoria_tributaria_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.auditoria_tributaria
    ADD CONSTRAINT auditoria_tributaria_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='benchmark_unico' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.benchmarks_setoriais
    ADD CONSTRAINT benchmark_unico UNIQUE (cnae_prefix, regime, vigencia_inicio);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bitrix24_activities_order_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.bitrix24_activities
    ADD CONSTRAINT bitrix24_activities_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.lalamove_orders(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bitrix24_stage_mappings_lalamove_status_key' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.bitrix24_stage_mappings
    ADD CONSTRAINT bitrix24_stage_mappings_lalamove_status_key UNIQUE (lalamove_status);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='catalogos_health_history_dia_key' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.catalogos_tributarios_health_history
    ADD CONSTRAINT catalogos_health_history_dia_key UNIQUE (dia);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='conformidade_snapshots_unica' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.conformidade_snapshots
    ADD CONSTRAINT conformidade_snapshots_unica UNIQUE (empresa_id, competencia);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='convites_contador_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.convites_contador
    ADD CONSTRAINT convites_contador_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='convites_contador_token_hash_key' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.convites_contador
    ADD CONSTRAINT convites_contador_token_hash_key UNIQUE (token_hash);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='elisao_creditos_auditoria_nota_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.elisao_creditos_auditoria
    ADD CONSTRAINT elisao_creditos_auditoria_nota_id_fkey FOREIGN KEY (nota_id) REFERENCES public.notas_fiscais_ocr(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='elisao_simulacoes_regime_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.elisao_simulacoes_regime
    ADD CONSTRAINT elisao_simulacoes_regime_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='entregas_obrigacoes_unica' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.entregas_obrigacoes
    ADD CONSTRAINT entregas_obrigacoes_unica UNIQUE (empresa_id, obrigacao_id, competencia);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='eventos_contabilizacao_log_regra_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.eventos_contabilizacao_log
    ADD CONSTRAINT eventos_contabilizacao_log_regra_id_fkey FOREIGN KEY (regra_id) REFERENCES public.regras_contabilizacao_automatica(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='faixas_simples_unq' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.faixas_simples_nacional
    ADD CONSTRAINT faixas_simples_unq UNIQUE (anexo, faixa, vigente_de);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fechamento_unico' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.fechamentos_tributarios
    ADD CONSTRAINT fechamento_unico UNIQUE (empresa_id, ano, mes);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='frontend_error_logs_pkey1' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.frontend_error_logs
    ADD CONSTRAINT frontend_error_logs_pkey1 PRIMARY KEY (id, created_at);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='index_usage_snapshots_unico' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.index_usage_snapshots
    ADD CONSTRAINT index_usage_snapshots_unico UNIQUE (snapshot_date, schema_name, index_name);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integration_secrets_chave_key' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.integration_secrets
    ADD CONSTRAINT integration_secrets_chave_key UNIQUE (chave);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='kpis_operacionais_unique' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.kpis_operacionais
    ADD CONSTRAINT kpis_operacionais_unique UNIQUE (user_id, nome);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='operacoes_icms_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.operacoes_icms
    ADD CONSTRAINT operacoes_icms_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='overlay_rejeicoes_unicidade' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.overlay_rejeicoes_auditoria
    ADD CONSTRAINT overlay_rejeicoes_unicidade UNIQUE (catalogo, identificador, campo, motivo, referencia);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='plano_contas_parent_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.plano_contas
    ADD CONSTRAINT plano_contas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.plano_contas(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='projecoes_reforma_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.projecoes_reforma
    ADD CONSTRAINT projecoes_reforma_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_proj_emp_ano' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.projecoes_reforma
    ADD CONSTRAINT uq_proj_emp_ano UNIQUE (empresa_id, ano);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='protocolos_st_ncms_unq' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.protocolos_st_ncms
    ADD CONSTRAINT protocolos_st_ncms_unq UNIQUE (protocolo_id, ncm_codigo);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='protocolos_st_ufs_unq' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.protocolos_st_ufs
    ADD CONSTRAINT protocolos_st_ufs_unq UNIQUE (protocolo_id, uf);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='regra_nome_unico_empresa' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regra_nome_unico_empresa UNIQUE (empresa_id, nome);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='regras_contabilizacao_automatica_categoria_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regras_contabilizacao_automatica_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='regras_contabilizacao_automatica_conta_credito_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regras_contabilizacao_automatica_conta_credito_id_fkey FOREIGN KEY (conta_credito_id) REFERENCES public.plano_contas(id) ON DELETE RESTRICT;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='regras_contabilizacao_automatica_conta_debito_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regras_contabilizacao_automatica_conta_debito_id_fkey FOREIGN KEY (conta_debito_id) REFERENCES public.plano_contas(id) ON DELETE RESTRICT;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='risk_rules_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.risk_rules
    ADD CONSTRAINT risk_rules_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='saved_filter_subscriptions_saved_filter_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.saved_filter_subscriptions
    ADD CONSTRAINT saved_filter_subscriptions_saved_filter_id_fkey FOREIGN KEY (saved_filter_id) REFERENCES public.saved_filters(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='saved_filter_subscriptions_unique' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.saved_filter_subscriptions
    ADD CONSTRAINT saved_filter_subscriptions_unique UNIQUE (saved_filter_id, user_id);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='saved_filters_unique' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.saved_filters
    ADD CONSTRAINT saved_filters_unique UNIQUE (user_id, entity_type, name);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='scim_checklist_unico' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.scim_setup_checklist
    ADD CONSTRAINT scim_checklist_unico UNIQUE (user_id, item_key);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='simulacao_tributos_detalhados_simulacao_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.simulacao_tributos_detalhados
    ADD CONSTRAINT simulacao_tributos_detalhados_simulacao_id_fkey FOREIGN KEY (simulacao_id) REFERENCES public.simulacoes(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='simulacoes_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.simulacoes
    ADD CONSTRAINT simulacoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='simulacoes_executada_por_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.simulacoes
    ADD CONSTRAINT simulacoes_executada_por_fkey FOREIGN KEY (executada_por) REFERENCES auth.users(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='solicitacoes_lgpd_empresa_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.solicitacoes_lgpd
    ADD CONSTRAINT solicitacoes_lgpd_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_role_mapping_unico' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.sso_role_mappings
    ADD CONSTRAINT sso_role_mapping_unico UNIQUE (provider_id, idp_group);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_role_mappings_provider_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.sso_role_mappings
    ADD CONSTRAINT sso_role_mappings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_sandbox_runs_provider_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.sso_sandbox_runs
    ADD CONSTRAINT sso_sandbox_runs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE SET NULL;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_user_group_unico' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.sso_user_groups
    ADD CONSTRAINT sso_user_group_unico UNIQUE (user_id, provider_id);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_user_groups_provider_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.sso_user_groups
    ADD CONSTRAINT sso_user_groups_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_active_filters_unique' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.user_active_filters
    ADD CONSTRAINT user_active_filters_unique UNIQUE (user_id, entity_type);'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_anomalia_preferences_user_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.user_anomalia_preferences
    ADD CONSTRAINT user_anomalia_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_digest_preferences_user_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.user_digest_preferences
    ADD CONSTRAINT user_digest_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;'; END IF; END $do_block$;

DO $do_block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_roles_user_id_fkey' AND connamespace='public'::regnamespace) THEN EXECUTE 'ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;'; END IF; END $do_block$;

-- SECAO 6: Cron jobs ausentes (14)

SELECT cron.unschedule('pgss_weekly_baseline') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='pgss_weekly_baseline');
SELECT cron.schedule('pgss_weekly_baseline', '0 3 * * 0', $CRON_CMD$| to_char(now(),'YYYY_MM_DD'));$CRON_CMD$);

-- =====================================================
-- FASE 7b: Fixes pós-v3 (2026-08-25 sessão 3)
-- =====================================================

-- Dedup aliquotas_iss_municipal (28 linhas duplicadas)
WITH keep AS (
  SELECT min(ctid) AS ctid_keep
  FROM public.aliquotas_iss_municipal
  WHERE item_lista_id IS NULL
  GROUP BY codigo_ibge, vigente_de
)
DELETE FROM public.aliquotas_iss_municipal
WHERE item_lista_id IS NULL
  AND ctid NOT IN (SELECT ctid_keep FROM keep);

CREATE UNIQUE INDEX IF NOT EXISTS aliq_iss_mun_geral_unq
  ON public.aliquotas_iss_municipal USING btree (codigo_ibge, vigente_de)
  WHERE (item_lista_id IS NULL);

-- Dedup plano_contas (6 linhas, mantendo a mais referenciada)
WITH ranked AS (
  SELECT p.id,
    row_number() OVER (
      PARTITION BY p.empresa_id, p.codigo
      ORDER BY (SELECT count(*) FROM public.partidas_contabeis pc WHERE pc.conta_contabil_id=p.id) DESC, p.ctid ASC
    ) AS rn
  FROM public.plano_contas p WHERE p.empresa_id IS NOT NULL
)
DELETE FROM public.plano_contas WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS plano_contas_empresa_codigo_uidx
  ON public.plano_contas USING btree (empresa_id, codigo)
  WHERE (empresa_id IS NOT NULL);

-- Converter provider_id text→uuid nas tabelas SSO (0 rows)
ALTER TABLE public.sso_role_mappings ALTER COLUMN provider_id TYPE uuid USING NULL;
ALTER TABLE public.sso_sandbox_runs  ALTER COLUMN provider_id TYPE uuid USING NULL;
ALTER TABLE public.sso_user_groups   ALTER COLUMN provider_id TYPE uuid USING NULL;

DO $do_block$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_role_mappings_provider_id_fkey') THEN
    EXECUTE 'ALTER TABLE ONLY public.sso_role_mappings ADD CONSTRAINT sso_role_mappings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE CASCADE';
  END IF;
END $do_block$;
DO $do_block$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_sandbox_runs_provider_id_fkey') THEN
    EXECUTE 'ALTER TABLE ONLY public.sso_sandbox_runs ADD CONSTRAINT sso_sandbox_runs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE SET NULL';
  END IF;
END $do_block$;
DO $do_block$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_user_groups_provider_id_fkey') THEN
    EXECUTE 'ALTER TABLE ONLY public.sso_user_groups ADD CONSTRAINT sso_user_groups_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE CASCADE';
  END IF;
END $do_block$;

-- Limpar orphans e adicionar FKs auth.users
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
DO $do_block$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_roles_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
  END IF;
END $do_block$;

DELETE FROM public.user_anomalia_preferences WHERE user_id NOT IN (SELECT id FROM auth.users);
DO $do_block$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_anomalia_preferences_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE ONLY public.user_anomalia_preferences ADD CONSTRAINT user_anomalia_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
  END IF;
END $do_block$;

-- Registrar
