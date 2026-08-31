-- Corrige os 12 erros reais reportados por `supabase db lint` em 2026-08-31.
--
-- Estratégia:
--   * somente mudanças aditivas de índice, CREATE OR REPLACE de rotinas existentes
--     e overloads internos mínimos para o proxy autenticado de conciliação;
--   * nenhum DROP, DELETE, backfill destrutivo ou quebra das assinaturas públicas;
--   * preflight antes da primeira mudança;
--   * snapshot temporário e postflight dos contratos de função (owner, ACL,
--     SECURITY DEFINER, volatilidade, search_path, argumentos e retorno);
--   * transação única: qualquer falha reverte automaticamente todo o lote.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

-- ---------------------------------------------------------------------------
-- 1. Preflight: interromper antes de qualquer DDL se o catálogo divergir.
-- ---------------------------------------------------------------------------
DO $preflight$
DECLARE
  v_ausentes text[];
  v_retorno_validador text;
  v_signature_diverge boolean;
BEGIN
  SELECT array_agg(v.assinatura ORDER BY v.assinatura)
    INTO v_ausentes
  FROM unnest(ARRAY[
    'public.capture_index_usage_snapshot()',
    'public.claim_frontend_error_alerts(integer,integer,integer,integer)',
    'public.confirmar_conciliacao_manual(uuid,uuid,uuid,numeric)',
    'public.confirmar_conciliacao(uuid,uuid,uuid,uuid,uuid,numeric)',
    'public.desfazer_conciliacao_manual(uuid)',
    'public.get_catalogos_tributarios_health()',
    'public.increment_failed_attempts(text)',
    'public.is_country_allowed_for_login(text)',
    'public.is_ip_allowed_for_login(inet)',
    'public.sefaz_process_batch(text,text,uuid,bigint,bigint,text,text,jsonb)',
    'public.silenciar_alerta_erro_frontend(text,integer,text)',
    'public.validar_catalogos_tributarios()',
    'public.watch_cron_failures()',
    'public.watch_cron_failures(integer,integer)'
  ]::text[]) AS v(assinatura)
  WHERE to_regprocedure(v.assinatura) IS NULL;

  IF v_ausentes IS NOT NULL THEN
    RAISE EXCEPTION 'Preflight lint: funções ausentes: %', v_ausentes;
  END IF;

  SELECT array_agg(format('%s.%s:%s', e.tabela, e.coluna, e.tipo) ORDER BY e.tabela, e.coluna)
    INTO v_ausentes
  FROM (VALUES
    ('allowed_countries', 'country_code', 'text'),
    ('allowed_countries', 'ativo', 'bool'),
    ('allowed_ips', 'ip_address', 'text'),
    ('allowed_ips', 'ativo', 'bool'),
    ('conciliacoes', 'status', 'text'),
    ('contas_pagar', 'status', 'varchar'),
    ('contas_pagar', 'data_pagamento', 'date'),
    ('contas_pagar', 'valor_pago', 'numeric'),
    ('contas_pagar', 'updated_at', 'timestamptz'),
    ('contas_receber', 'status', 'varchar'),
    ('contas_receber', 'data_recebimento', 'date'),
    ('contas_receber', 'valor_recebido', 'numeric'),
    ('contas_receber', 'transacao_conciliada_id', 'uuid'),
    ('contas_receber', 'updated_at', 'timestamptz'),
    ('cron_job_logs', 'success', 'bool'),
    ('cron_job_logs', 'created_at', 'timestamptz'),
    ('frontend_error_alert_state', 'assinatura', 'text'),
    ('index_usage_snapshots', 'snapshot_date', 'date'),
    ('index_usage_snapshots', 'schema_name', 'text'),
    ('index_usage_snapshots', 'index_name', 'text'),
    ('nfe_recebidas', 'ambiente', 'sefaz_ambiente'),
    ('sefaz_dfe_cursor', 'ambiente', 'sefaz_ambiente'),
    ('transacoes_bancarias', 'status', 'text'),
    ('transacoes_bancarias', 'conciliada', 'bool'),
    ('transacoes_bancarias', 'data_confirmacao', 'timestamptz'),
    ('transacoes_bancarias', 'confirmado_por', 'uuid'),
    ('user_empresas', 'user_id', 'uuid'),
    ('user_empresas', 'empresa_id', 'uuid'),
    ('user_empresas', 'ativo', 'bool')
  ) AS e(tabela, coluna, tipo)
  LEFT JOIN information_schema.columns c
    ON c.table_schema = 'public'
   AND c.table_name = e.tabela
   AND c.column_name = e.coluna
   AND c.udt_name = e.tipo
  WHERE c.column_name IS NULL;

  IF v_ausentes IS NOT NULL THEN
    RAISE EXCEPTION 'Preflight lint: colunas/tipos ausentes: %', v_ausentes;
  END IF;

  IF to_regtype('public.sefaz_ambiente') IS NULL THEN
    RAISE EXCEPTION 'Preflight lint: enum public.sefaz_ambiente ausente';
  END IF;

  SELECT pg_catalog.pg_get_function_result(
           to_regprocedure('public.validar_catalogos_tributarios()')
         )
    INTO v_retorno_validador;

  -- O canônico usa o contrato compacto; o replay histórico ainda reproduz o
  -- contrato detalhado. O reparo abaixo trata ambos sem alterar o validador.
  IF v_retorno_validador NOT IN (
    'TABLE(tabela text, registros bigint, status text)',
    'TABLE(invariante text, severidade text, afetados bigint, detalhe text)'
  ) THEN
    RAISE EXCEPTION
      'Preflight lint: retorno inesperado de validar_catalogos_tributarios(): %',
      v_retorno_validador;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'frontend_error_alert_state'
      AND c.column_name = 'signature'
      AND c.udt_name <> 'text'
  ) THEN
    RAISE EXCEPTION
      'Preflight lint: frontend_error_alert_state.signature existe com tipo incompatível';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'frontend_error_alert_state'
      AND c.column_name = 'signature'
  ) THEN
    EXECUTE
      'SELECT EXISTS (SELECT 1 FROM public.frontend_error_alert_state '
      'WHERE signature IS DISTINCT FROM assinatura)'
      INTO v_signature_diverge;

    IF v_signature_diverge THEN
      RAISE EXCEPTION
        'Preflight lint: signature e assinatura divergem; revisão manual obrigatória';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.frontend_error_alert_state
    GROUP BY assinatura
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Preflight lint: frontend_error_alert_state possui assinatura duplicada; revisão manual obrigatória';
  END IF;

  IF to_regclass('public.uq_frontend_error_alert_state_assinatura') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_catalog.pg_index i
       WHERE i.indexrelid = to_regclass('public.uq_frontend_error_alert_state_assinatura')
         AND i.indrelid = 'public.frontend_error_alert_state'::regclass
         AND i.indisunique
         AND i.indisvalid
         AND i.indisready
         AND i.indpred IS NULL
         AND i.indexprs IS NULL
         AND i.indnkeyatts = 1
         AND i.indnatts = 1
         AND pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'assinatura'
     ) THEN
    RAISE EXCEPTION
      'Preflight lint: nome uq_frontend_error_alert_state_assinatura já pertence a índice incompatível';
  END IF;

  IF to_regclass('public.uq_index_usage_snapshots_snapshot_schema_index') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_catalog.pg_index i
       WHERE i.indexrelid = to_regclass('public.uq_index_usage_snapshots_snapshot_schema_index')
         AND i.indrelid = 'public.index_usage_snapshots'::regclass
         AND i.indisunique
         AND i.indisvalid
         AND i.indisready
         AND i.indpred IS NULL
         AND i.indexprs IS NULL
         AND i.indnkeyatts = 3
         AND i.indnatts = 3
         AND pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'snapshot_date'
         AND pg_catalog.pg_get_indexdef(i.indexrelid, 2, true) = 'schema_name'
         AND pg_catalog.pg_get_indexdef(i.indexrelid, 3, true) = 'index_name'
     ) THEN
    RAISE EXCEPTION
      'Preflight lint: nome uq_index_usage_snapshots_snapshot_schema_index já pertence a índice incompatível';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.index_usage_snapshots
    GROUP BY snapshot_date, schema_name, index_name
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Preflight lint: index_usage_snapshots possui chave lógica duplicada; revisão manual obrigatória';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.allowed_ips
    WHERE NOT pg_catalog.pg_input_is_valid(btrim(ip_address), 'inet')
  ) THEN
    RAISE EXCEPTION
      'Preflight lint: allowed_ips contém endereço que não pode ser convertido para inet';
  END IF;
END
$preflight$;

-- Snapshot efêmero: usado apenas para provar que CREATE OR REPLACE não mudou
-- owner, ACL, elevação, search_path, volatilidade ou assinatura. ON COMMIT DROP.
CREATE TEMP TABLE _pf_lint_function_contract_before ON COMMIT DROP AS
SELECT p.oid,
       p.proowner,
       p.prolang,
       p.prokind,
       p.prosecdef,
       p.proleakproof,
       p.provolatile,
       p.proparallel,
       p.proconfig,
       p.proacl,
       p.prorettype,
       p.proretset,
       p.pronargdefaults,
       p.proargtypes,
       p.proallargtypes,
       p.proargmodes,
       p.proargnames
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'capture_index_usage_snapshot',
    'claim_frontend_error_alerts',
    'confirmar_conciliacao_manual',
    'confirmar_conciliacao',
    'desfazer_conciliacao_manual',
    'get_catalogos_tributarios_health',
    'increment_failed_attempts',
    'is_country_allowed_for_login',
    'is_ip_allowed_for_login',
    'sefaz_process_batch',
    'silenciar_alerta_erro_frontend',
    'validar_catalogos_tributarios',
    'watch_cron_failures'
  );

-- ---------------------------------------------------------------------------
-- 2. Chaves naturais necessárias aos UPSERTs.
--    Os preflights acima impedem que CREATE UNIQUE INDEX falhe no meio do lote.
-- ---------------------------------------------------------------------------
DO $indexes$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index i
    WHERE i.indrelid = 'public.frontend_error_alert_state'::regclass
      AND i.indisunique
      AND i.indisvalid
      AND i.indisready
      AND i.indpred IS NULL
      AND i.indexprs IS NULL
      AND i.indnkeyatts = 1
      AND i.indnatts = 1
      AND pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'assinatura'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uq_frontend_error_alert_state_assinatura '
         || 'ON public.frontend_error_alert_state (assinatura)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index i
    WHERE i.indrelid = 'public.index_usage_snapshots'::regclass
      AND i.indisunique
      AND i.indisvalid
      AND i.indisready
      AND i.indpred IS NULL
      AND i.indexprs IS NULL
      AND i.indnkeyatts = 3
      AND i.indnatts = 3
      AND pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'snapshot_date'
      AND pg_catalog.pg_get_indexdef(i.indexrelid, 2, true) = 'schema_name'
      AND pg_catalog.pg_get_indexdef(i.indexrelid, 3, true) = 'index_name'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uq_index_usage_snapshots_snapshot_schema_index '
         || 'ON public.index_usage_snapshots (snapshot_date, schema_name, index_name)';
  END IF;
END
$indexes$;

-- ---------------------------------------------------------------------------
-- 3. SEFAZ: enum real é public.sefaz_ambiente, não ambiente_sefaz.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sefaz_process_batch(
  p_cnpj text,
  p_ambiente text,
  p_empresa_id uuid,
  p_novo_nsu bigint,
  p_max_nsu bigint,
  p_status text,
  p_erro text,
  p_docs jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cursor_atual bigint;
  v_doc jsonb;
  v_payload jsonb;
  v_kind text;
  v_novos integer := 0;
  v_eventos integer := 0;
  v_ignorados integer := 0;
  v_inserted_id uuid;
BEGIN
  SELECT ultimo_nsu
    INTO v_cursor_atual
  FROM public.sefaz_dfe_cursor
  WHERE cnpj = p_cnpj
    AND ambiente = p_ambiente::public.sefaz_ambiente
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.sefaz_dfe_cursor (
      cnpj, ambiente, ultimo_nsu, max_nsu,
      retry_count, next_run_at, circuit_open
    )
    VALUES (
      p_cnpj, p_ambiente::public.sefaz_ambiente, 0, 0,
      0, now(), false
    )
    RETURNING ultimo_nsu INTO v_cursor_atual;
  END IF;

  IF p_docs IS NOT NULL AND jsonb_typeof(p_docs) = 'array' THEN
    FOR v_doc IN SELECT * FROM jsonb_array_elements(p_docs)
    LOOP
      v_kind := v_doc->>'kind';
      v_payload := v_doc->'payload';

      IF v_kind = 'nfe' THEN
        INSERT INTO public.nfe_recebidas (
          empresa_id, chave_acesso, cnpj_emitente, razao_emitente, ie_emitente,
          uf_emitente, cnpj_destinatario, numero, serie, modelo, data_emissao,
          valor_total, digest_value, tipo_documento, schema_tipo, nsu, ambiente,
          xml_path, xml_completo
        )
        VALUES (
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
          nullif(v_payload->>'data_emissao', '')::timestamptz,
          nullif(v_payload->>'valor_total', '')::numeric,
          v_payload->>'digest_value',
          v_payload->>'tipo_documento',
          (v_payload->>'schema_tipo')::public.nfe_schema_tipo,
          (v_doc->>'nsu')::bigint,
          p_ambiente::public.sefaz_ambiente,
          v_payload->>'xml_path',
          coalesce((v_payload->>'xml_completo')::boolean, true)
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
          data_evento, protocolo, justificativa, status_retorno, motivo_retorno
        )
        VALUES (
          v_payload->>'chave_acesso',
          v_payload->>'tipo_evento',
          v_payload->>'codigo_evento',
          coalesce((v_payload->>'sequencial')::integer, 1),
          coalesce(nullif(v_payload->>'data_evento', '')::timestamptz, now()),
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

  IF p_novo_nsu > v_cursor_atual THEN
    UPDATE public.sefaz_dfe_cursor
       SET ultimo_nsu = p_novo_nsu,
           max_nsu = greatest(max_nsu, coalesce(p_max_nsu, max_nsu)),
           ultimo_status = p_status,
           ultimo_erro = p_erro,
           ultima_consulta = now(),
           retry_count = CASE WHEN p_erro IS NULL THEN 0 ELSE retry_count END,
           last_error_at = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
           updated_at = now()
     WHERE cnpj = p_cnpj
       AND ambiente = p_ambiente::public.sefaz_ambiente;
  ELSE
    UPDATE public.sefaz_dfe_cursor
       SET ultimo_status = p_status,
           ultimo_erro = p_erro,
           ultima_consulta = now(),
           last_error_at = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
           updated_at = now()
     WHERE cnpj = p_cnpj
       AND ambiente = p_ambiente::public.sefaz_ambiente;
  END IF;

  RETURN jsonb_build_object(
    'cursor_antes', v_cursor_atual,
    'cursor_depois', greatest(v_cursor_atual, p_novo_nsu),
    'novos', v_novos,
    'eventos', v_eventos,
    'ignorados', v_ignorados
  );
END
$function$;

-- ---------------------------------------------------------------------------
-- 4. Alertas de frontend: UPSERTs agora têm chave única real e preenchem
--    simultaneamente as colunas de compatibilidade `signature` e `assinatura`.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_frontend_error_alerts(
  p_window_minutes integer DEFAULT 15,
  p_threshold integer DEFAULT 10,
  p_cooldown_minutes integer DEFAULT 60,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  assinatura text,
  exemplo_mensagem text,
  severity text,
  ocorrencias bigint,
  usuarios_afetados bigint,
  urls_distintas bigint,
  primeira_ocorrencia timestamptz,
  ultima_ocorrencia timestamptz,
  is_nova boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_threshold integer := greatest(1, coalesce(p_threshold, 10));
  v_cooldown integer := greatest(0, least(coalesce(p_cooldown_minutes, 60), 10080));
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 100));
  v_desde timestamptz := now() - make_interval(
    mins => greatest(1, least(coalesce(p_window_minutes, 15), 1440))
  );
  v_colunas_insert text;
  v_valores_insert text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  -- O banco canônico ainda exige a coluna legada `signature`; o replay limpo
  -- não a possui. Os dois fragmentos abaixo são constantes escolhidas apenas
  -- pelo catálogo, sem interpolação de entrada do usuário.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'frontend_error_alert_state'
      AND c.column_name = 'signature'
  ) THEN
    v_colunas_insert :=
      'signature, assinatura, severity, exemplo_mensagem, primeiro_alerta_em, '
      'ultimo_alerta_em, ocorrencias_no_ultimo_alerta, alertas_enviados';
    v_valores_insert :=
      'e.sig, e.sig, e.sev, left(e.exemplo, 2000), now(), now(), e.total, 1';
  ELSE
    v_colunas_insert :=
      'assinatura, severity, exemplo_mensagem, primeiro_alerta_em, '
      'ultimo_alerta_em, ocorrencias_no_ultimo_alerta, alertas_enviados';
    v_valores_insert :=
      'e.sig, e.sev, left(e.exemplo, 2000), now(), now(), e.total, 1';
  END IF;

  RETURN QUERY EXECUTE format($claim_sql$
  WITH grupos AS (
    SELECT public.fe_error_signature(fel.error_message) AS sig,
           (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo,
           (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS sev,
           count(*) AS total,
           count(DISTINCT fel.user_id) AS usuarios,
           count(DISTINCT fel.url) AS urls,
           min(fel.created_at) AS primeira,
           max(fel.created_at) AS ultima
    FROM public.frontend_error_logs fel
    WHERE fel.created_at >= $1
    GROUP BY 1
    HAVING count(*) >= $2
  ),
  elegiveis AS (
    SELECT g.*
    FROM grupos g
    LEFT JOIN public.frontend_error_alert_state s ON s.assinatura = g.sig
    WHERE s.assinatura IS NULL
       OR (
         coalesce(s.silenciado_ate, '-infinity'::timestamptz) < now()
         AND s.ultimo_alerta_em <= now() - make_interval(mins => $3)
       )
    ORDER BY g.total DESC
    LIMIT $4
  ),
  gravados(sig_gravada, nova) AS (
    INSERT INTO public.frontend_error_alert_state AS st (%s)
    SELECT %s
    FROM elegiveis e
    ON CONFLICT (assinatura) DO UPDATE
       SET severity = EXCLUDED.severity,
           exemplo_mensagem = EXCLUDED.exemplo_mensagem,
           ultimo_alerta_em = now(),
           ocorrencias_no_ultimo_alerta = EXCLUDED.ocorrencias_no_ultimo_alerta,
           alertas_enviados = st.alertas_enviados + 1
    RETURNING st.assinatura, (st.alertas_enviados = 1)
  )
  SELECT e.sig, e.exemplo, e.sev, e.total, e.usuarios, e.urls,
         e.primeira, e.ultima, gr.nova
  FROM elegiveis e
  JOIN gravados gr ON gr.sig_gravada = e.sig
  ORDER BY e.total DESC
  $claim_sql$, v_colunas_insert, v_valores_insert)
  USING v_desde, v_threshold, v_cooldown, v_limit;
END
$function$;

CREATE OR REPLACE FUNCTION public.silenciar_alerta_erro_frontend(
  p_assinatura text,
  p_horas integer DEFAULT 24,
  p_motivo text DEFAULT NULL::text
)
RETURNS public.frontend_error_alert_state
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_sig text := left(btrim(coalesce(p_assinatura, '')), 200);
  v_horas integer;
  v_ate timestamptz;
  v_antes jsonb;
  v_row public.frontend_error_alert_state;
  v_colunas_insert text;
  v_valores_insert text;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  IF v_sig = '' THEN
    RAISE EXCEPTION 'assinatura obrigatoria' USING ERRCODE = '22023';
  END IF;

  v_horas := least(greatest(coalesce(p_horas, 0), 0), 720);
  v_ate := CASE
    WHEN v_horas = 0 THEN NULL
    ELSE now() + make_interval(hours => v_horas)
  END;

  SELECT to_jsonb(s)
    INTO v_antes
  FROM public.frontend_error_alert_state s
  WHERE s.assinatura = v_sig;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'frontend_error_alert_state'
      AND c.column_name = 'signature'
  ) THEN
    v_colunas_insert := 'signature, assinatura, silenciado_ate';
    v_valores_insert := '$1, $1, $2';
  ELSE
    v_colunas_insert := 'assinatura, silenciado_ate';
    v_valores_insert := '$1, $2';
  END IF;

  EXECUTE format(
    'INSERT INTO public.frontend_error_alert_state AS st (%s) '
    'VALUES (%s) ON CONFLICT (assinatura) DO UPDATE '
    'SET silenciado_ate = EXCLUDED.silenciado_ate RETURNING st.*',
    v_colunas_insert,
    v_valores_insert
  )
  INTO v_row
  USING v_sig, v_ate;

  INSERT INTO public.audit_logs (
    user_id, user_email, action, table_name, record_id,
    old_data, new_data, details
  )
  VALUES (
    v_uid,
    auth.jwt()->>'email',
    CASE
      WHEN v_ate IS NULL THEN 'unmute_frontend_error_alert'
      ELSE 'mute_frontend_error_alert'
    END,
    'frontend_error_alert_state',
    v_sig,
    v_antes,
    to_jsonb(v_row),
    left(
      coalesce(nullif(btrim(coalesce(p_motivo, '')), ''), 'sem motivo informado'),
      500
    )
  );

  RETURN v_row;
END
$function$;

-- ---------------------------------------------------------------------------
-- 5. Snapshot de índices: chave natural explícita para o UPSERT diário.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_index_usage_snapshot()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_linhas integer;
BEGIN
  INSERT INTO public.index_usage_snapshots (
    snapshot_date, schema_name, table_name, index_name,
    idx_scan, size_bytes, is_unique, is_primary
  )
  SELECT current_date,
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
  WHERE snapshot_date < current_date - interval '180 days';

  RETURN v_linhas;
END
$function$;

-- ---------------------------------------------------------------------------
-- 6. Login: email não é UNIQUE e possui duplicatas reais. Serializa por email,
--    calcula um único próximo contador e sincroniza todas as linhas legadas,
--    sem apagar histórico e sem criar uma constraint incompatível.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_failed_attempts(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_email text := lower(btrim(_email));
  v_proxima_tentativa integer;
  v_atualizadas integer;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email obrigatório' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('increment_failed_attempts:' || v_email, 0)
  );

  SELECT coalesce(max(attempt_count), 0) + 1
    INTO v_proxima_tentativa
  FROM public.login_attempts
  WHERE lower(btrim(email)) = v_email;

  UPDATE public.login_attempts
     SET attempt_count = v_proxima_tentativa,
         last_attempt_at = now(),
         success = false
   WHERE lower(btrim(email)) = v_email;

  GET DIAGNOSTICS v_atualizadas = ROW_COUNT;

  IF v_atualizadas = 0 THEN
    INSERT INTO public.login_attempts (
      email, attempt_count, last_attempt_at, success
    )
    VALUES (v_email, 1, now(), false);
  END IF;
END
$function$;

-- ---------------------------------------------------------------------------
-- 7. Allowlist geográfica/IP: nomes e tipos reais do banco canônico.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_country_allowed_for_login(_country text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_countries ac
    WHERE ac.country_code = _country
      -- `ativo` é o campo canônico; `enabled` só existe no banco consolidado.
      -- to_jsonb(record) mantém a migration compatível com o replay histórico.
      AND coalesce(
        nullif(to_jsonb(ac)->>'ativo', '')::boolean,
        nullif(to_jsonb(ac)->>'enabled', '')::boolean,
        false
      )
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.is_ip_allowed_for_login(_ip inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_ips ai
    WHERE ai.ativo IS TRUE
      AND CASE
        WHEN pg_catalog.pg_input_is_valid(btrim(ai.ip_address), 'inet')
          THEN btrim(ai.ip_address)::inet >>= _ip
        ELSE false
      END
  );
END
$function$;

-- ---------------------------------------------------------------------------
-- 8. Saúde fiscal: adaptar o agregador ao retorno canônico atual
--    TABLE(tabela, registros, status), preservando o JSON consumido pelo front.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_catalogos_tributarios_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_achados jsonb := '[]'::jsonb;
  v_criticos integer := 0;
  v_avisos integer := 0;
  v_infos integer := 0;
  v_ultima timestamptz;
  v_auto_24h integer;
  v_abertos integer;
  v_registro jsonb;
  v_invariante text;
  v_severidade text;
  v_afetados bigint;
  v_detalhe text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin' USING ERRCODE = '42501';
  END IF;

  FOR v_registro IN
    SELECT to_jsonb(c)
    FROM public.validar_catalogos_tributarios() c
  LOOP
    IF v_registro ? 'tabela' THEN
      -- Contrato compacto do banco canônico.
      IF upper(coalesce(v_registro->>'status', '')) = 'OK' THEN
        CONTINUE;
      END IF;

      v_invariante := 'catalogo_' || coalesce(v_registro->>'tabela', 'desconhecido')
                       || '_' || lower(coalesce(v_registro->>'status', 'desconhecido'));
      v_severidade := CASE
        WHEN upper(coalesce(v_registro->>'status', '')) IN ('VAZIO', 'INCOMPLETO')
          THEN 'critical'
        ELSE 'warning'
      END;
      v_afetados := CASE
        WHEN v_registro->>'tabela' = 'ufs'
         AND upper(coalesce(v_registro->>'status', '')) = 'INCOMPLETO'
          THEN greatest(27 - coalesce((v_registro->>'registros')::bigint, 0), 1)
        ELSE greatest(coalesce((v_registro->>'registros')::bigint, 0), 1)
      END;
      v_detalhe := format(
        'Catálogo %s com status %s (%s registro(s))',
        v_registro->>'tabela',
        v_registro->>'status',
        v_registro->>'registros'
      );
    ELSE
      -- Contrato detalhado ainda reproduzido pelo histórico de migrations.
      v_invariante := coalesce(v_registro->>'invariante', 'catalogo_desconhecido');
      v_severidade := lower(coalesce(v_registro->>'severidade', 'warning'));
      v_afetados := greatest(coalesce((v_registro->>'afetados')::bigint, 0), 1);
      v_detalhe := coalesce(v_registro->>'detalhe', 'Falha de catálogo sem detalhe');
    END IF;

    IF v_severidade = 'critical' THEN
      v_criticos := v_criticos + 1;
    ELSIF v_severidade = 'warning' THEN
      v_avisos := v_avisos + 1;
    ELSE
      v_infos := v_infos + 1;
    END IF;

    v_achados := v_achados || jsonb_build_array(jsonb_build_object(
      'invariante', v_invariante,
      'severidade', v_severidade,
      'afetados', v_afetados,
      'detalhe', v_detalhe
    ));
  END LOOP;

  SELECT max(alert_hour),
         count(*) FILTER (
           WHERE resolved_at >= now() - interval '24 hours'
             AND coalesce(resolved_reason, '') LIKE 'auto:%'
         )::integer,
         count(*) FILTER (WHERE resolved_at IS NULL)::integer
    INTO v_ultima, v_auto_24h, v_abertos
  FROM public.integrity_alerts
  WHERE domain = 'tributario';

  RETURN jsonb_build_object(
    'gerado_em', now(),
    'ultima_verificacao', v_ultima,
    'criticos', coalesce(v_criticos, 0),
    'avisos', coalesce(v_avisos, 0),
    'infos', coalesce(v_infos, 0),
    'auto_resolvidos_24h', coalesce(v_auto_24h, 0),
    'alertas_abertos', coalesce(v_abertos, 0),
    'saudavel', coalesce(v_criticos, 0) + coalesce(v_avisos, 0) = 0,
    'achados', v_achados
  );
END
$function$;

-- ---------------------------------------------------------------------------
-- 9. Conciliação: remover referências às colunas ausentes e manter os campos
--    de confirmação que realmente existem em transacoes_bancarias.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
  p_conciliacao_id uuid,
  p_user_id uuid,
  p_transacao_id uuid DEFAULT NULL::uuid,
  p_conta_pagar_id uuid DEFAULT NULL::uuid,
  p_conta_receber_id uuid DEFAULT NULL::uuid,
  p_ajuste_centavos numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  UPDATE public.conciliacoes
     SET status = 'confirmado'
   WHERE id = p_conciliacao_id;

  IF p_transacao_id IS NOT NULL THEN
    UPDATE public.transacoes_bancarias
       SET status = 'conciliado',
           conciliada = true,
           data_confirmacao = now(),
           confirmado_por = p_user_id
     WHERE id = p_transacao_id;
  END IF;

  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
       SET status = 'pago',
           data_pagamento = now(),
           valor_pago = valor + p_ajuste_centavos
     WHERE id = p_conta_pagar_id;
  END IF;

  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
       SET status = 'recebido',
           data_recebimento = now(),
           valor_recebido = valor + p_ajuste_centavos
     WHERE id = p_conta_receber_id;
  END IF;
END
$function$;

CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(
  p_transacao_id uuid,
  p_user_id uuid,
  p_conta_pagar_id uuid DEFAULT NULL::uuid,
  p_conta_receber_id uuid DEFAULT NULL::uuid,
  p_ajuste_centavos numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_empresa uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cb.empresa_id
    INTO v_empresa
  FROM public.transacoes_bancarias tb
  JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
  WHERE tb.id = p_transacao_id;

  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'transacao_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_empresas ue
    WHERE ue.user_id = v_uid
      AND ue.empresa_id = v_empresa
      AND ue.ativo IS TRUE
  ) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  IF p_conta_pagar_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.contas_pagar cp
    WHERE cp.id = p_conta_pagar_id
      AND cp.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_conta_pagar' USING ERRCODE = '42501';
  END IF;

  IF p_conta_receber_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.contas_receber cr
    WHERE cr.id = p_conta_receber_id
      AND cr.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_conta_receber' USING ERRCODE = '42501';
  END IF;

  UPDATE public.transacoes_bancarias
     SET status = 'confirmado',
         conciliada = true,
         data_confirmacao = now(),
         confirmado_por = v_uid
   WHERE id = p_transacao_id;

  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
       SET status = 'pago',
           data_pagamento = coalesce(
             data_pagamento,
             (SELECT data FROM public.transacoes_bancarias WHERE id = p_transacao_id)
           ),
           valor_pago = valor + p_ajuste_centavos,
           updated_at = now()
     WHERE id = p_conta_pagar_id;
  END IF;

  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
       SET status = 'recebido',
           data_recebimento = coalesce(
             data_recebimento,
             (SELECT data FROM public.transacoes_bancarias WHERE id = p_transacao_id)
           ),
           valor_recebido = valor + p_ajuste_centavos,
           transacao_conciliada_id = p_transacao_id,
           updated_at = now()
     WHERE id = p_conta_receber_id;
  END IF;
END
$function$;

CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(
  p_transacao_id uuid,
  p_conta_pagar_id uuid DEFAULT NULL::uuid,
  p_conta_receber_id uuid DEFAULT NULL::uuid,
  p_ajuste_centavos numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM public.confirmar_conciliacao_manual(
    p_transacao_id,
    auth.uid(),
    p_conta_pagar_id,
    p_conta_receber_id,
    p_ajuste_centavos
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao_manual(
  p_transacao_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := coalesce(p_user_id, auth.uid());
  v_empresa uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cb.empresa_id
    INTO v_empresa
  FROM public.transacoes_bancarias tb
  JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
  WHERE tb.id = p_transacao_id;

  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'transacao_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_empresas ue
    WHERE ue.user_id = v_uid
      AND ue.empresa_id = v_empresa
      AND ue.ativo IS TRUE
  ) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  UPDATE public.transacoes_bancarias
     SET status = 'pendente',
         conciliada = false,
         data_confirmacao = NULL,
         confirmado_por = NULL
   WHERE id = p_transacao_id;

  UPDATE public.contas_receber
     SET transacao_conciliada_id = NULL,
         status = CASE
           WHEN data_vencimento < now()::date THEN 'vencido'
           ELSE 'pendente'
         END,
         updated_at = now()
   WHERE transacao_conciliada_id = p_transacao_id;
END
$function$;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM public.desfazer_conciliacao_manual(p_transacao_id, auth.uid());
END
$function$;

REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(uuid, uuid, uuid, uuid, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(uuid, uuid, uuid, uuid, numeric)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(uuid, uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 10. Watcher legado sem argumentos: cron_job_logs usa `success`, não `status`.
--     O overload principal (integer, integer) permanece byte a byte inalterado.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.watch_cron_failures()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $function$
DECLARE
  v_falhas integer;
BEGIN
  SELECT count(*)
    INTO v_falhas
  FROM public.cron_job_logs
  WHERE success IS FALSE
    AND created_at > now() - interval '24 hours';

  RETURN jsonb_build_object(
    'failures_24h', v_falhas,
    'checked_at', now()
  );
END
$function$;

-- ---------------------------------------------------------------------------
-- 11. Postflight: índices corretos, identificadores quebrados ausentes e
--     contrato de segurança/ACL idêntico ao snapshot anterior.
-- ---------------------------------------------------------------------------
DO $postflight$
DECLARE
  v_def text;
  v_drift text[];
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index i
    WHERE i.indrelid = 'public.frontend_error_alert_state'::regclass
      AND i.indisunique
      AND i.indisvalid
      AND i.indisready
      AND i.indpred IS NULL
      AND i.indexprs IS NULL
      AND i.indnkeyatts = 1
      AND i.indnatts = 1
      AND pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'assinatura'
  ) THEN
    RAISE EXCEPTION 'Postflight lint: índice único de assinatura não foi criado corretamente';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index i
    WHERE i.indrelid = 'public.index_usage_snapshots'::regclass
      AND i.indisunique
      AND i.indisvalid
      AND i.indisready
      AND i.indpred IS NULL
      AND i.indexprs IS NULL
      AND i.indnkeyatts = 3
      AND i.indnatts = 3
      AND pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) = 'snapshot_date'
      AND pg_catalog.pg_get_indexdef(i.indexrelid, 2, true) = 'schema_name'
      AND pg_catalog.pg_get_indexdef(i.indexrelid, 3, true) = 'index_name'
  ) THEN
    RAISE EXCEPTION 'Postflight lint: índice único do snapshot não foi criado corretamente';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
           to_regprocedure(
             'public.sefaz_process_batch(text,text,uuid,bigint,bigint,text,text,jsonb)'
           )
         )
    INTO v_def;
  IF v_def LIKE '%::ambiente_sefaz%' OR v_def NOT LIKE '%::public.sefaz_ambiente%' THEN
    RAISE EXCEPTION 'Postflight lint: cast SEFAZ ainda aponta para enum incorreto';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
           to_regprocedure('public.increment_failed_attempts(text)')
         )
    INTO v_def;
  IF v_def LIKE '%ON CONFLICT (email)%'
     OR v_def NOT LIKE '%pg_advisory_xact_lock%'
     OR v_def NOT LIKE '%lower(btrim(email)) = v_email%' THEN
    RAISE EXCEPTION 'Postflight lint: incremento de login continua dependente de UNIQUE(email)';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
           to_regprocedure('public.watch_cron_failures()')
         )
    INTO v_def;
  IF v_def LIKE '%WHERE status=%' OR v_def NOT LIKE '%success IS FALSE%' THEN
    RAISE EXCEPTION 'Postflight lint: watcher legado ainda usa cron_job_logs.status';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
           to_regprocedure('public.confirmar_conciliacao_manual(uuid,uuid,uuid,numeric)')
         )
    INTO v_def;
  IF v_def NOT LIKE '%auth.uid()%'
     OR v_def NOT LIKE '%public.confirmar_conciliacao_manual(%' THEN
    RAISE EXCEPTION
      'Postflight lint: wrapper público de conciliação manual não delegou para o overload interno autenticado';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
           to_regprocedure('public.confirmar_conciliacao_manual(uuid,uuid,uuid,uuid,numeric)')
         )
    INTO v_def;
  IF v_def NOT LIKE '%ue.ativo IS TRUE%'
     OR position('updated_at' IN split_part(v_def, 'IF p_conta_pagar_id', 1)) > 0 THEN
    RAISE EXCEPTION
      'Postflight lint: overload interno de conciliação manual não preservou vínculo ativo/schema real';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
           to_regprocedure('public.desfazer_conciliacao_manual(uuid)')
         )
    INTO v_def;
  IF v_def NOT LIKE '%auth.uid()%'
     OR v_def NOT LIKE '%public.desfazer_conciliacao_manual(p_transacao_id, auth.uid())%' THEN
    RAISE EXCEPTION
      'Postflight lint: wrapper público de desfazer conciliação não delegou para o overload interno autenticado';
  END IF;

  SELECT pg_catalog.pg_get_functiondef(
           to_regprocedure('public.desfazer_conciliacao_manual(uuid,uuid)')
         )
    INTO v_def;
  IF v_def NOT LIKE '%ue.ativo IS TRUE%'
     OR position('updated_at' IN split_part(v_def, 'UPDATE public.contas_receber', 1)) > 0 THEN
    RAISE EXCEPTION
      'Postflight lint: overload interno de desfazer conciliação não preservou vínculo ativo/schema real';
  END IF;

  SELECT array_agg(
           coalesce(p.oid, b.oid)::regprocedure::text
           ORDER BY coalesce(p.oid, b.oid)::regprocedure::text
         )
    INTO v_drift
  FROM _pf_lint_function_contract_before b
  LEFT JOIN pg_catalog.pg_proc p ON p.oid = b.oid
  WHERE p.oid IS NULL
     OR p.proowner IS DISTINCT FROM b.proowner
     OR p.prolang IS DISTINCT FROM b.prolang
     OR p.prokind IS DISTINCT FROM b.prokind
     OR p.prosecdef IS DISTINCT FROM b.prosecdef
     OR p.proleakproof IS DISTINCT FROM b.proleakproof
     OR p.provolatile IS DISTINCT FROM b.provolatile
     OR p.proparallel IS DISTINCT FROM b.proparallel
     OR p.proconfig IS DISTINCT FROM b.proconfig
     OR p.proacl IS DISTINCT FROM b.proacl
     OR p.prorettype IS DISTINCT FROM b.prorettype
     OR p.proretset IS DISTINCT FROM b.proretset
     OR p.pronargdefaults IS DISTINCT FROM b.pronargdefaults
     OR p.proargtypes IS DISTINCT FROM b.proargtypes
     OR p.proallargtypes IS DISTINCT FROM b.proallargtypes
     OR p.proargmodes IS DISTINCT FROM b.proargmodes
     OR p.proargnames IS DISTINCT FROM b.proargnames;

  IF v_drift IS NOT NULL THEN
    RAISE EXCEPTION
      'Postflight lint: contrato/ACL de função divergiu; rollback automático: %',
      v_drift;
  END IF;
END
$postflight$;

COMMIT;

-- Rollback operacional após commit (se necessário):
--   1. não faça DROP das tabelas/colunas/funções;
--   2. restaure as definições anteriores por uma nova migration revisada;
--   3. só então remova os dois índices aditivos, caso comprovadamente necessário.
-- Durante esta migration o rollback é automático e atômico por BEGIN/COMMIT.
