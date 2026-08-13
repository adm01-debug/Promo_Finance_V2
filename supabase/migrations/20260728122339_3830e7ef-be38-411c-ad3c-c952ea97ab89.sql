-- ============================================================
-- Integridade dos catálogos tributários
--  1) CHECK constraints (formato / enum / range)
--  2) Função de auditoria com RAISE WARNING (log visível)
--  3) Integração com integrity_alerts + run_integrity_cycle
-- ============================================================

-- ------------------------------------------------------------
-- 1) Constraints declarativas (idempotentes)
-- ------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('ufs','ufs_aliquota_interna_range_chk','CHECK (aliquota_interna_padrao >= 0 AND aliquota_interna_padrao <= 0.35)'),
      ('ufs','ufs_aliquota_fcp_range_chk','CHECK (aliquota_fcp >= 0 AND aliquota_fcp <= 0.05)'),
      ('ufs','ufs_codigo_ibge_range_chk','CHECK (codigo_ibge BETWEEN 11 AND 53)'),

      ('cnaes','cnaes_codigo_formato_chk','CHECK (codigo ~ ''^[0-9]{2}\.[0-9]{2}-[0-9]/[0-9]{2}$'')'),
      ('cnaes','cnaes_presuncoes_range_chk','CHECK (presuncao_irpj > 0 AND presuncao_irpj <= 1 AND presuncao_csll > 0 AND presuncao_csll <= 1)'),
      ('cnaes','cnaes_rat_valores_chk','CHECK (rat_padrao IN (0.01, 0.02, 0.03))'),
      ('cnaes','cnaes_terceiros_range_chk','CHECK (terceiros_padrao >= 0 AND terceiros_padrao <= 0.1)'),

      ('ncms','ncms_codigo_formato_chk','CHECK (codigo ~ ''^[0-9]{8}$'')'),
      ('ncms','ncms_cest_formato_chk','CHECK (cest IS NULL OR cest ~ ''^[0-9]{7}$'' OR cest ~ ''^[0-9]{2}\.[0-9]{3}\.[0-9]{2}$'')'),
      ('ncms','ncms_ipi_range_chk','CHECK (aliquota_ipi >= 0 AND aliquota_ipi <= 1)'),
      ('ncms','ncms_mva_range_chk','CHECK (mva_padrao IS NULL OR (mva_padrao >= 0 AND mva_padrao <= 3))'),

      ('aliquotas_internas_uf','aliq_internas_range_chk','CHECK (aliquota >= 0 AND aliquota <= 0.35 AND aliquota_fcp >= 0 AND aliquota_fcp <= 0.05)'),

      ('aliquotas_interestaduais','aliq_inter_valores_chk','CHECK (aliquota IN (0.04, 0.07, 0.12))'),
      ('aliquotas_interestaduais','aliq_inter_importado_range_chk','CHECK (aliquota_importado >= 0 AND aliquota_importado <= 0.12)'),
      ('aliquotas_interestaduais','aliq_inter_ufs_distintas_chk','CHECK (uf_origem <> uf_destino)'),

      ('itens_lista_iss','itens_lista_iss_faixa_chk','CHECK (aliquota_minima >= 0 AND aliquota_maxima <= 0.05 AND aliquota_minima <= aliquota_maxima)'),

      ('aliquotas_iss_municipal','aliq_iss_mun_range_chk','CHECK (aliquota >= 0 AND aliquota <= 0.05)'),
      ('aliquotas_iss_municipal','aliq_iss_mun_ibge_chk','CHECK (codigo_ibge BETWEEN 1000000 AND 9999999)'),

      ('faixas_simples_nacional','faixas_simples_aliquota_range_chk','CHECK (aliquota > 0 AND aliquota <= 1 AND parcela_deduzir >= 0)'),

      ('beneficios_fiscais','beneficios_percentual_range_chk','CHECK (percentual IS NULL OR (percentual >= 0 AND percentual <= 1))'),
      ('beneficios_fiscais','beneficios_tipo_chk','CHECK (tipo IN (''CREDITO_PRESUMIDO'',''CREDITO_OUTORGADO'',''REDUCAO_BASE'',''ISENCAO'',''DIFERIMENTO'',''ALIQUOTA_ZERO'',''SUSPENSAO'',''FINANCIAMENTO'',''INCENTIVO_MUNICIPAL'',''OUTRO''))'),

      ('estrategias_elisao','estrategias_economia_range_chk','CHECK (economia_estimada_percentual IS NULL OR (economia_estimada_percentual >= 0 AND economia_estimada_percentual <= 1))'),
      ('estrategias_elisao','estrategias_regimes_chk','CHECK (regimes_aplicaveis <@ ARRAY[''MEI'',''SIMPLES'',''PRESUMIDO'',''REAL'',''ARBITRADO'']::text[])'),

      ('protocolos_st_ncms','protocolos_st_ncms_codigo_formato_chk','CHECK (ncm_codigo ~ ''^[0-9]{8}$'')'),
      ('protocolos_st_ncms','protocolos_st_ncms_mva_range_chk','CHECK (mva_original IS NULL OR (mva_original >= 0 AND mva_original <= 3))')
    ) AS t(tbl, cname, cdef)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = r.cname AND conrelid = format('public.%I', r.tbl)::regclass
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', r.tbl, r.cname, r.cdef);
    END IF;
  END LOOP;
END $$;

-- Unicidade lógica adicional (evita catálogo duplicado)
CREATE UNIQUE INDEX IF NOT EXISTS ufs_codigo_ibge_unq ON public.ufs (codigo_ibge);

-- ------------------------------------------------------------
-- 2) Domínio 'tributario' nos alertas de integridade
-- ------------------------------------------------------------
ALTER TABLE public.integrity_alerts DROP CONSTRAINT IF EXISTS integrity_alerts_domain_check;
ALTER TABLE public.integrity_alerts ADD CONSTRAINT integrity_alerts_domain_check
  CHECK (domain IN ('entrega','screening','financeiro','nfe','nfe_sefaz','tributario'));

-- ------------------------------------------------------------
-- 3) Auditoria dos catálogos — read-only, emite WARNING no log
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validar_catalogos_tributarios()
RETURNS TABLE (
  invariante   text,
  severidade   text,
  afetados     bigint,
  detalhe      text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  WITH achados AS (
    SELECT 'ufs_incompletas'::text AS inv, 'critical'::text AS sev,
           GREATEST(27 - (SELECT count(*) FROM public.ufs), 0)::bigint AS qtd,
           'catálogo de UFs deve conter as 27 unidades federativas'::text AS det
    UNION ALL
    SELECT 'ufs_flag_fcp_incoerente', 'warning',
           (SELECT count(*) FROM public.ufs WHERE possui_fcp <> (aliquota_fcp > 0)),
           'possui_fcp diverge de aliquota_fcp > 0'
    UNION ALL
    SELECT 'uf_sem_aliquota_interna_geral', 'warning',
           (SELECT count(*) FROM public.ufs u
             WHERE NOT EXISTS (SELECT 1 FROM public.aliquotas_internas_uf a
                                WHERE a.uf = u.sigla AND a.categoria_produto = 'GERAL')),
           'UF sem alíquota interna na categoria GERAL'
    UNION ALL
    SELECT 'par_interestadual_ausente', 'warning',
           (SELECT (27::bigint * 26) - count(*) FROM public.aliquotas_interestaduais),
           'matriz interestadual incompleta (esperado 702 pares origem/destino)'
    UNION ALL
    SELECT 'ncm_st_sem_mva', 'warning',
           (SELECT count(*) FROM public.ncms WHERE sujeito_st AND mva_padrao IS NULL),
           'NCM sujeito a ST sem MVA padrão definida'
    UNION ALL
    SELECT 'protocolo_st_ncm_orfao', 'warning',
           (SELECT count(*) FROM public.protocolos_st_ncms p
             WHERE p.ncm_id IS NULL
                OR NOT EXISTS (SELECT 1 FROM public.ncms n WHERE n.codigo = p.ncm_codigo)),
           'item de protocolo ST sem NCM correspondente no catálogo'
    UNION ALL
    SELECT 'protocolo_st_sem_uf', 'warning',
           (SELECT count(*) FROM public.protocolos_st ps
             WHERE NOT EXISTS (SELECT 1 FROM public.protocolos_st_ufs u WHERE u.protocolo_id = ps.id)),
           'protocolo ST sem UF signatária'
    UNION ALL
    SELECT 'faixa_simples_incompleta', 'critical',
           (SELECT 30::bigint - count(*) FROM public.faixas_simples_nacional
             WHERE vigente_ate IS NULL),
           'esperadas 30 faixas vigentes (5 anexos x 6 faixas)'
    UNION ALL
    SELECT 'faixa_simples_reparticao_vazia', 'warning',
           (SELECT count(*) FROM public.faixas_simples_nacional
             WHERE reparticao = '{}'::jsonb OR reparticao IS NULL),
           'faixa do Simples sem repartição de tributos preenchida'
    UNION ALL
    SELECT 'faixa_simples_descontinua', 'critical',
           (SELECT count(*) FROM (
              SELECT f.id FROM public.faixas_simples_nacional f
              JOIN public.faixas_simples_nacional p
                ON p.anexo = f.anexo AND p.faixa = f.faixa - 1 AND p.vigente_de = f.vigente_de
              WHERE f.rbt12_de <> p.rbt12_ate
            ) s),
           'faixas do Simples com lacuna ou sobreposição de RBT12'
    UNION ALL
    SELECT 'iss_municipal_sem_item_lista', 'warning',
           (SELECT count(*) FROM public.aliquotas_iss_municipal WHERE item_lista_id IS NULL),
           'alíquota de ISS municipal sem vínculo com item da LC 116'
    UNION ALL
    SELECT 'iss_municipal_fora_da_faixa_do_item', 'critical',
           (SELECT count(*) FROM public.aliquotas_iss_municipal a
             JOIN public.itens_lista_iss i ON i.id = a.item_lista_id
             WHERE a.aliquota < i.aliquota_minima OR a.aliquota > i.aliquota_maxima),
           'alíquota municipal fora da faixa mínima/máxima do item da lista'
    UNION ALL
    SELECT 'cnae_anexo_ausente', 'warning',
           (SELECT count(*) FROM public.cnaes WHERE NOT vedado_simples AND anexo_simples IS NULL),
           'CNAE não vedado ao Simples sem anexo definido'
    UNION ALL
    SELECT 'beneficio_percentual_ausente', 'info',
           (SELECT count(*) FROM public.beneficios_fiscais
             WHERE percentual IS NULL AND tipo IN ('CREDITO_PRESUMIDO','CREDITO_OUTORGADO','REDUCAO_BASE')),
           'benefício de crédito/redução sem percentual informado'
    UNION ALL
    SELECT 'estrategia_elisao_sem_regime', 'warning',
           (SELECT count(*) FROM public.estrategias_elisao
             WHERE ativo AND cardinality(regimes_aplicaveis) = 0),
           'estratégia de elisão ativa sem regime aplicável'
  )
  SELECT a.inv, a.sev, a.qtd, a.det
  FROM achados a
  WHERE a.qtd > 0
  ORDER BY CASE a.sev WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, a.inv;
END;
$function$;

REVOKE ALL ON FUNCTION public.validar_catalogos_tributarios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validar_catalogos_tributarios() TO authenticated, service_role;

-- ------------------------------------------------------------
-- 4) Persistência em integrity_alerts + log
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_catalogos_tributarios_invariants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_hour     timestamptz := date_trunc('hour', now());
  v_total    integer := 0;
  v_critical integer := 0;
  r          RECORD;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('check_catalogos_tributarios_invariants')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  FOR r IN SELECT * FROM public.validar_catalogos_tributarios() LOOP
    v_total := v_total + 1;
    IF r.severidade = 'critical' THEN
      v_critical := v_critical + 1;
    END IF;

    -- Log visível (aparece nos logs do Postgres e na saída do psql/CI)
    RAISE WARNING 'catalogo_tributario[%] % — % ocorrência(s): %',
      r.severidade, r.invariante, r.afetados, r.detalhe;

    INSERT INTO public.integrity_alerts
      (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
    VALUES
      ('tributario', r.invariante, r.severidade, v_hour, r.afetados, r.detalhe, '{}')
    ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
      SET affected_count = EXCLUDED.affected_count,
          severity       = EXCLUDED.severity,
          reason         = EXCLUDED.reason;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'alert_hour', v_hour,
    'invariants_failed', v_total,
    'critical', v_critical
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.check_catalogos_tributarios_invariants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_catalogos_tributarios_invariants() TO service_role;

-- ------------------------------------------------------------
-- 5) Ciclo de integridade passa a incluir o domínio tributário
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_integrity_cycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_core   jsonb := '{}'::jsonb;
  v_nfe    jsonb := '{}'::jsonb;
  v_sefaz  jsonb := '{}'::jsonb;
  v_trib   jsonb := '{}'::jsonb;
  v_esc    jsonb := '{}'::jsonb;
  v_closed integer := 0;
  v_hour   timestamptz;
BEGIN
  BEGIN
    v_core := public.check_integrity_invariants();
  EXCEPTION WHEN OTHERS THEN
    v_core := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  IF COALESCE((v_core->>'success')::boolean, false) THEN
    v_hour := (v_core->>'alert_hour')::timestamptz;
    v_closed := v_closed + public.close_stale_integrity_alerts(
      v_hour, ARRAY['entrega','screening','financeiro'], interval '0'
    );
  END IF;

  BEGIN
    v_nfe := public.check_nfe_xml_path_invariants();
  EXCEPTION WHEN OTHERS THEN
    v_nfe := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  IF COALESCE((v_nfe->>'success')::boolean, false) THEN
    v_closed := v_closed + public.close_stale_integrity_alerts(
      (v_nfe->>'alert_hour')::timestamptz, ARRAY['nfe'], interval '0'
    );
  END IF;

  BEGIN
    v_sefaz := public.sefaz_run_observability_checks();
    v_closed := v_closed + public.close_stale_integrity_alerts(
      date_trunc('hour', now()), ARRAY['nfe_sefaz'], interval '3 hours'
    );
  EXCEPTION WHEN OTHERS THEN
    v_sefaz := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  BEGIN
    v_trib := public.check_catalogos_tributarios_invariants();
    IF COALESCE((v_trib->>'success')::boolean, false) THEN
      v_closed := v_closed + public.close_stale_integrity_alerts(
        (v_trib->>'alert_hour')::timestamptz, ARRAY['tributario'], interval '0'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_trib := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  BEGIN
    v_esc := public.escalate_stale_integrity_alerts(interval '24 hours');
  EXCEPTION WHEN OTHERS THEN
    v_esc := jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
  END;

  RETURN COALESCE(v_core, '{}'::jsonb) || jsonb_build_object(
    'nfe_xml', v_nfe,
    'sefaz', v_sefaz,
    'tributario', v_trib,
    'escalonamento', v_esc,
    'alertas_encerrados', v_closed
  );
END;
$function$;

COMMENT ON FUNCTION public.validar_catalogos_tributarios() IS
  'Audita os catálogos tributários (UF, CNAE, NCM, ISS, Simples, ST, benefícios, elisão) e retorna apenas as invariantes violadas.';
COMMENT ON FUNCTION public.check_catalogos_tributarios_invariants() IS
  'Executa validar_catalogos_tributarios(), emite WARNING no log e persiste os achados em integrity_alerts (domain=tributario).';