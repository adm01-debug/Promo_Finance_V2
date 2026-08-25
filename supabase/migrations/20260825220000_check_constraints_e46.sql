-- E46: 256 CHECK constraints da origem
DO $outer$
DECLARE cnt integer:=0; errs integer:=0; skip integer:=0;
BEGIN
  BEGIN
    ALTER TABLE public.acessos_suspeitos ADD CONSTRAINT acessos_suspeitos_severidade_check CHECK ((severidade = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.acessos_suspeitos ADD CONSTRAINT acessos_suspeitos_tipo_check CHECK ((tipo = ANY (ARRAY['cross_tenant'::text, 'admin_pico'::text, 'admin_fora_horario'::text, 'delecao_massa'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_alert_state ADD CONSTRAINT fe_alert_state_bounds_chk CHECK (((length(assinatura) <= 200) AND (length(COALESCE(exemplo_mensagem, ''::text)) <= 2000) AND (ocorrencias_no_ultimo_alerta >= 0) AND (alertas_enviados >= 0))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_alert_state ADD CONSTRAINT fe_alert_state_severity_chk CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.webhooks_log ADD CONSTRAINT chk_webhooks_log_status CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'success'::text, 'failed'::text, 'retrying'::text, 'dead'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_interestaduais ADD CONSTRAINT aliq_inter_importado_range_chk CHECK (((aliquota_importado >= (0)::numeric) AND (aliquota_importado <= 0.12))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_interestaduais ADD CONSTRAINT aliq_inter_ufs_distintas_chk CHECK ((uf_origem <> uf_destino)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_interestaduais ADD CONSTRAINT aliq_inter_valores_chk CHECK ((aliquota = ANY (ARRAY[0.04, 0.07, 0.12]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_interestaduais ADD CONSTRAINT aliquotas_interestaduais_vigencia_chk CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_internas_uf ADD CONSTRAINT aliq_internas_range_chk CHECK (((aliquota >= (0)::numeric) AND (aliquota <= 0.35) AND (aliquota_fcp >= (0)::numeric) AND (aliquota_fcp <= 0.05))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_internas_uf ADD CONSTRAINT aliquotas_internas_uf_vigencia_chk CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_iss_municipal ADD CONSTRAINT aliq_iss_mun_ibge_chk CHECK (((codigo_ibge >= 1000000) AND (codigo_ibge <= 9999999))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_iss_municipal ADD CONSTRAINT aliq_iss_mun_range_chk CHECK (((aliquota >= (0)::numeric) AND (aliquota <= 0.05))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.aliquotas_iss_municipal ADD CONSTRAINT aliq_iss_mun_vigencia_chk CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_key_prefix_check CHECK ((key_prefix ~ '^[A-Za-z0-9_-]{4,16}$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_name_check CHECK (((char_length(name) >= 2) AND (char_length(name) <= 120))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.apuracoes_irpj_csll ADD CONSTRAINT apuracoes_irpj_csll_mes_check CHECK (((mes IS NULL) OR ((mes >= 1) AND (mes <= 12)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.apuracoes_irpj_csll ADD CONSTRAINT apuracoes_irpj_csll_trimestre_check CHECK (((trimestre IS NULL) OR ((trimestre >= 1) AND (trimestre <= 4)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.asaas_credit_risk_analysis ADD CONSTRAINT asaas_credit_risk_analysis_faixa_risco_check CHECK ((faixa_risco = ANY (ARRAY['BAIXO'::text, 'MEDIO'::text, 'ALTO'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.asaas_credit_risk_analysis ADD CONSTRAINT asaas_credit_risk_analysis_score_risco_check CHECK (((score_risco >= 0) AND (score_risco <= 1000))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.auditoria_tributaria ADD CONSTRAINT auditoria_tributaria_acao_check CHECK ((acao = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.auditoria_tributaria ADD CONSTRAINT auditoria_tributaria_entidade_tipo_check CHECK (((char_length(entidade_tipo) >= 1) AND (char_length(entidade_tipo) <= 120))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.benchmarks_setoriais ADD CONSTRAINT benchmark_percentis_coerentes CHECK (((carga_p25_pct IS NULL) OR (carga_p75_pct IS NULL) OR (carga_p75_pct >= carga_p25_pct))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.benchmarks_setoriais ADD CONSTRAINT benchmark_vigencia_valida CHECK (((vigencia_fim IS NULL) OR (vigencia_fim >= vigencia_inicio))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.benchmarks_setoriais ADD CONSTRAINT benchmarks_setoriais_carga_media_pct_check CHECK (((carga_media_pct >= (0)::numeric) AND (carga_media_pct <= (100)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.benchmarks_setoriais ADD CONSTRAINT benchmarks_setoriais_carga_p25_pct_check CHECK (((carga_p25_pct IS NULL) OR ((carga_p25_pct >= (0)::numeric) AND (carga_p25_pct <= (100)::numeric)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.benchmarks_setoriais ADD CONSTRAINT benchmarks_setoriais_carga_p75_pct_check CHECK (((carga_p75_pct IS NULL) OR ((carga_p75_pct >= (0)::numeric) AND (carga_p75_pct <= (100)::numeric)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.benchmarks_setoriais ADD CONSTRAINT benchmarks_setoriais_cnae_prefix_check CHECK ((cnae_prefix ~ '^[0-9]{2,7}$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.benchmarks_setoriais ADD CONSTRAINT benchmarks_setoriais_regime_check CHECK ((regime = ANY (ARRAY['simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'mei'::text, 'arbitrado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.benchmarks_setoriais ADD CONSTRAINT benchmarks_setoriais_setor_check CHECK (((char_length(setor) >= 2) AND (char_length(setor) <= 160))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.beneficios_fiscais ADD CONSTRAINT beneficios_fiscais_vigencia_chk CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.beneficios_fiscais ADD CONSTRAINT beneficios_percentual_range_chk CHECK (((percentual IS NULL) OR ((percentual >= (0)::numeric) AND (percentual <= (1)::numeric)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.beneficios_fiscais ADD CONSTRAINT beneficios_tipo_chk CHECK ((tipo = ANY (ARRAY['CREDITO_PRESUMIDO'::text, 'CREDITO_OUTORGADO'::text, 'REDUCAO_BASE'::text, 'ISENCAO'::text, 'DIFERIMENTO'::text, 'ALIQUOTA_ZERO'::text, 'SUSPENSAO'::text, 'FINANCIAMENTO'::text, 'INCENTIVO_MUNICIPAL'::text, 'OUTRO'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.bling_sync_logs ADD CONSTRAINT bling_sync_logs_modulo_check CHECK (((char_length(modulo) >= 2) AND (char_length(modulo) <= 80))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.bling_sync_logs ADD CONSTRAINT bling_sync_logs_registros_com_erro_check CHECK ((registros_com_erro >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.bling_sync_logs ADD CONSTRAINT bling_sync_logs_registros_processados_check CHECK ((registros_processados >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.bling_sync_logs ADD CONSTRAINT bling_sync_logs_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'executando'::text, 'sucesso'::text, 'erro'::text, 'parcial'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.bling_sync_logs ADD CONSTRAINT bling_sync_logs_tipo_check CHECK ((tipo = ANY (ARRAY['manual'::text, 'automatica'::text, 'webhook'::text, 'retry'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.bling_sync_logs ADD CONSTRAINT bling_sync_periodo_valido CHECK (((finalizado_em IS NULL) OR (finalizado_em >= iniciado_em))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.bling_webhook_events ADD CONSTRAINT bling_webhook_events_retries_check CHECK (((retries >= 0) AND (retries <= 50))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.bling_webhook_events ADD CONSTRAINT bling_webhook_processed_coerente CHECK (((processed = false) OR (processed_at IS NOT NULL))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.boletos ADD CONSTRAINT chk_boletos_status CHECK ((status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'pago'::text, 'vencido'::text, 'cancelado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.catalogos_fiscais_cargas ADD CONSTRAINT catalogos_fiscais_cargas_origem_check CHECK ((origem = ANY (ARRAY['cron'::text, 'manual'::text, 'ci'::text, 'migration'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.catalogos_fiscais_cargas ADD CONSTRAINT catalogos_fiscais_cargas_status_check CHECK ((status = ANY (ARRAY['ok'::text, 'erro'::text, 'sem_alteracao'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.catalogos_tributarios_health_history ADD CONSTRAINT catalogos_tributarios_health_history_avisos_check CHECK ((avisos >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.catalogos_tributarios_health_history ADD CONSTRAINT catalogos_tributarios_health_history_criticos_check CHECK ((criticos >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.catalogos_tributarios_health_history ADD CONSTRAINT catalogos_tributarios_health_history_infos_check CHECK ((infos >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.catalogos_tributarios_health_history ADD CONSTRAINT catalogos_tributarios_health_history_total_invariantes_check CHECK ((total_invariantes >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.categorias ADD CONSTRAINT categorias_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ci_security_gate_events ADD CONSTRAINT ci_security_gate_events_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.clientes ADD CONSTRAINT clientes_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['PF'::character varying, 'PJ'::character varying])::text[]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.cnaes ADD CONSTRAINT cnaes_anexo_simples_check CHECK ((anexo_simples = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.cnaes ADD CONSTRAINT cnaes_codigo_formato_chk CHECK ((codigo ~ '^[0-9]{2}\.[0-9]{2}-[0-9]/[0-9]{2}$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.cnaes ADD CONSTRAINT cnaes_presuncoes_range_chk CHECK (((presuncao_irpj > (0)::numeric) AND (presuncao_irpj <= (1)::numeric) AND (presuncao_csll > (0)::numeric) AND (presuncao_csll <= (1)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.cnaes ADD CONSTRAINT cnaes_rat_valores_chk CHECK ((rat_padrao = ANY (ARRAY[0.01, 0.02, 0.03]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.cnaes ADD CONSTRAINT cnaes_terceiros_range_chk CHECK (((terceiros_padrao >= (0)::numeric) AND (terceiros_padrao <= 0.1))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.cnpja_cache ADD CONSTRAINT cnpja_cache_cnpj_check CHECK ((cnpj ~ '^[0-9]{14}$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.cnpja_cache ADD CONSTRAINT cnpja_cache_validade CHECK ((expires_at > fetched_at)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.conformidade_snapshots ADD CONSTRAINT conformidade_snapshots_competencia_fmt CHECK ((competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.conformidade_snapshots ADD CONSTRAINT conformidade_snapshots_nivel_check CHECK ((nivel = ANY (ARRAY['critico'::text, 'atencao'::text, 'bom'::text, 'excelente'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.conformidade_snapshots ADD CONSTRAINT conformidade_snapshots_pontualidade_range CHECK (((pontualidade >= (0)::numeric) AND (pontualidade <= (100)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.conformidade_snapshots ADD CONSTRAINT conformidade_snapshots_score_range CHECK (((score >= (0)::numeric) AND (score <= (100)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.contas_pagar ADD CONSTRAINT chk_contas_pagar_status CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'pago'::character varying, 'vencido'::character varying, 'cancelado'::character varying, 'parcial'::character varying])::text[]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'pago'::character varying, 'atrasado'::character varying, 'cancelado'::character varying])::text[]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_valor_check CHECK ((valor >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.contas_receber ADD CONSTRAINT chk_contas_receber_status CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'recebido'::character varying, 'pago'::character varying, 'vencido'::character varying, 'cancelado'::character varying, 'parcial'::character varying])::text[]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'recebido'::character varying, 'atrasado'::character varying, 'cancelado'::character varying])::text[]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_valor_check CHECK ((valor >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.convites_contador ADD CONSTRAINT convite_expira_no_futuro CHECK ((expires_at > created_at)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.convites_contador ADD CONSTRAINT convite_revogado_nao_aceito CHECK (((revoked_at IS NULL) OR (accepted_at IS NULL) OR (revoked_at >= accepted_at))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.convites_contador ADD CONSTRAINT convites_contador_email_check CHECK ((email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.convites_contador ADD CONSTRAINT convites_contador_token_hash_check CHECK ((token_hash ~ '^[a-f0-9]{64}$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.darfs ADD CONSTRAINT darfs_status_check CHECK ((status = ANY (ARRAY['gerado'::text, 'pago'::text, 'vencido'::text, 'cancelado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.digest_envios_log ADD CONSTRAINT digest_envios_log_multa_total_check CHECK ((multa_total >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.digest_envios_log ADD CONSTRAINT digest_envios_log_severidade_maxima_check CHECK ((severidade_maxima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.digest_envios_log ADD CONSTRAINT digest_envios_log_situacao_check CHECK ((situacao = ANY (ARRAY['enviado'::text, 'ignorado'::text, 'falhou'::text, 'simulado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.digest_envios_log ADD CONSTRAINT digest_envios_log_total_alertas_check CHECK ((total_alertas >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.digest_envios_log ADD CONSTRAINT digest_envios_log_total_empresas_check CHECK ((total_empresas >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.drivers ADD CONSTRAINT drivers_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.drivers ADD CONSTRAINT drivers_risk_score_check CHECK (((risk_score >= (0)::numeric) AND (risk_score <= (10)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.edge_function_logs ADD CONSTRAINT edge_function_logs_level_check CHECK ((level = ANY (ARRAY['debug'::text, 'info'::text, 'warn'::text, 'error'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.elisao_alertas ADD CONSTRAINT elisao_alertas_severidade_check CHECK ((severidade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.elisao_creditos_auditoria ADD CONSTRAINT elisao_creditos_auditoria_score_confianca_check CHECK (((score_confianca IS NULL) OR ((score_confianca >= 0) AND (score_confianca <= 100)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.elisao_creditos_auditoria ADD CONSTRAINT elisao_creditos_auditoria_status_aprovacao_check CHECK ((status_aprovacao = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.elisao_regras_creditos ADD CONSTRAINT elisao_regras_creditos_aliquota_check CHECK (((aliquota IS NULL) OR ((aliquota >= (0)::numeric) AND (aliquota <= (1)::numeric)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.elisao_tarefas_acionaveis ADD CONSTRAINT elisao_tarefas_acionaveis_bitrix_sync_status_check CHECK ((bitrix_sync_status = ANY (ARRAY['nao_sincronizado'::text, 'sincronizando'::text, 'sincronizado'::text, 'erro'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.elisao_tarefas_acionaveis ADD CONSTRAINT elisao_tarefas_acionaveis_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluida'::text, 'cancelada'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.empresas ADD CONSTRAINT empresas_aliquota_rat_range CHECK (((aliquota_rat IS NULL) OR ((aliquota_rat >= (0)::numeric) AND (aliquota_rat <= 0.06)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.empresas ADD CONSTRAINT empresas_aliquota_terceiros_range CHECK (((aliquota_terceiros IS NULL) OR ((aliquota_terceiros >= (0)::numeric) AND (aliquota_terceiros <= 0.08)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.empresas ADD CONSTRAINT empresas_cnae_principal_formato CHECK (((cnae_principal IS NULL) OR ((length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) >= 2) AND (length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) <= 7)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.empresas ADD CONSTRAINT empresas_regime_tributario_check CHECK (((regime_tributario IS NULL) OR (regime_tributario = ANY (ARRAY['mei'::text, 'simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'arbitrado'::text])))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.entregas_obrigacoes ADD CONSTRAINT entregas_obrigacoes_competencia_fmt CHECK ((competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.entregas_obrigacoes ADD CONSTRAINT entregas_obrigacoes_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'entregue'::text, 'dispensada'::text, 'retificada'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.estrategias_elisao ADD CONSTRAINT estrategias_economia_range_chk CHECK (((economia_estimada_percentual IS NULL) OR ((economia_estimada_percentual >= (0)::numeric) AND (economia_estimada_percentual <= (1)::numeric)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.estrategias_elisao ADD CONSTRAINT estrategias_regimes_chk CHECK ((regimes_aplicaveis <@ ARRAY['MEI'::text, 'SIMPLES'::text, 'PRESUMIDO'::text, 'REAL'::text, 'ARBITRADO'::text])) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.eventos_contabilizacao_log ADD CONSTRAINT eventos_contabilizacao_log_status_check CHECK ((status = ANY (ARRAY['sucesso'::text, 'sem_regra'::text, 'erro'::text, 'duplicado'::text, 'simulado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.eventos_contabilizacao_log ADD CONSTRAINT eventos_contabilizacao_log_tipo_evento_check CHECK ((tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.execucoes_regua_cobranca ADD CONSTRAINT execucao_falha_tem_motivo CHECK (((status = 'sucesso'::text) OR (mensagem_erro IS NOT NULL))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.execucoes_regua_cobranca ADD CONSTRAINT execucoes_regua_cobranca_canal_check CHECK (((canal IS NULL) OR (lower(canal) = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text, 'telefone'::text])))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.execucoes_regua_cobranca ADD CONSTRAINT execucoes_regua_cobranca_etapa_check CHECK (((char_length(btrim(etapa)) >= 1) AND (char_length(btrim(etapa)) <= 120))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.execucoes_regua_cobranca ADD CONSTRAINT execucoes_regua_cobranca_status_check CHECK ((status = ANY (ARRAY['sucesso'::text, 'falha'::text, 'erro'::text, 'ignorado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.expert_messages ADD CONSTRAINT expert_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.faixas_simples_nacional ADD CONSTRAINT faixas_simples_aliquota_range_chk CHECK (((aliquota > (0)::numeric) AND (aliquota <= (1)::numeric) AND (parcela_deduzir >= (0)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.faixas_simples_nacional ADD CONSTRAINT faixas_simples_intervalo_chk CHECK ((rbt12_ate > rbt12_de)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.faixas_simples_nacional ADD CONSTRAINT faixas_simples_nacional_anexo_check CHECK ((anexo = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.faixas_simples_nacional ADD CONSTRAINT faixas_simples_nacional_faixa_check CHECK (((faixa >= 1) AND (faixa <= 6))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.faixas_simples_nacional ADD CONSTRAINT faixas_simples_reparticao_soma_chk CHECK (public.faixa_simples_reparticao_valida(reparticao)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.faixas_simples_nacional ADD CONSTRAINT faixas_simples_vigencia_chk CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.fechamentos_tributarios ADD CONSTRAINT fechamento_forcado_justificado CHECK (((NOT forcado) OR ((justificativa_forcado IS NOT NULL) AND (char_length(btrim(justificativa_forcado)) >= 10)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.fechamentos_tributarios ADD CONSTRAINT fechamentos_tributarios_ano_check CHECK (((ano >= 2000) AND (ano <= 2100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.fechamentos_tributarios ADD CONSTRAINT fechamentos_tributarios_mes_check CHECK (((mes >= 1) AND (mes <= 12))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.fechamentos_tributarios ADD CONSTRAINT fechamentos_tributarios_score_conformidade_check CHECK (((score_conformidade >= (0)::numeric) AND (score_conformidade <= (100)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.fechamentos_tributarios ADD CONSTRAINT fechamentos_tributarios_status_check CHECK ((status = ANY (ARRAY['aberto'::text, 'em_revisao'::text, 'fechado'::text, 'reaberto'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.fila_cobrancas ADD CONSTRAINT chk_fila_cobrancas_status CHECK ((status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'falhou'::text, 'cancelado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_05 ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_05 ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_06 ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_06 ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_07 ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_07 ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_08 ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_08 ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_09 ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_09 ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_10 ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_10 ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_11 ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_2026_11 ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_default ADD CONSTRAINT frontend_error_logs_payload_bounds CHECK (((length(COALESCE(error_message, ''::text)) <= 2000) AND (length(COALESCE(error_stack, ''::text)) <= 8000) AND (length(COALESCE(url, ''::text)) <= 2000) AND (length(COALESCE(user_agent, ''::text)) <= 500) AND (pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.frontend_error_logs_default ADD CONSTRAINT frontend_error_logs_severity_check CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.geo_blocks ADD CONSTRAINT geo_blocks_block_type_check CHECK ((block_type = ANY (ARRAY['full'::text, 'login_only'::text, 'registration_only'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.historico_relatorios ADD CONSTRAINT historico_relatorios_status_check CHECK ((status = ANY (ARRAY['sucesso'::text, 'erro'::text, 'parcial'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.incentivos_fiscais ADD CONSTRAINT incentivo_periodo_valido CHECK ((ano_fim >= ano_inicio)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.incentivos_fiscais ADD CONSTRAINT incentivos_fiscais_ano_fim_check CHECK (((ano_fim >= 1990) AND (ano_fim <= 2100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.incentivos_fiscais ADD CONSTRAINT incentivos_fiscais_ano_inicio_check CHECK (((ano_inicio >= 1990) AND (ano_inicio <= 2100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.incentivos_fiscais ADD CONSTRAINT incentivos_fiscais_limite_percentual_check CHECK (((limite_percentual >= (0)::numeric) AND (limite_percentual <= (100)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.incentivos_fiscais ADD CONSTRAINT incentivos_fiscais_limite_valor_check CHECK ((limite_valor >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.incentivos_fiscais ADD CONSTRAINT incentivos_fiscais_valor_utilizado_ano_check CHECK ((valor_utilizado_ano >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.integrity_alerts ADD CONSTRAINT integrity_alerts_domain_check CHECK ((domain = ANY (ARRAY['entrega'::text, 'screening'::text, 'financeiro'::text, 'nfe'::text, 'nfe_sefaz'::text, 'tributario'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.integrity_alerts ADD CONSTRAINT integrity_alerts_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.itens_lista_iss ADD CONSTRAINT itens_lista_iss_faixa_chk CHECK (((aliquota_minima >= (0)::numeric) AND (aliquota_maxima <= 0.05) AND (aliquota_minima <= aliquota_maxima))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.itens_lista_iss ADD CONSTRAINT itens_lista_iss_vigencia_coerente CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.kpis_operacionais ADD CONSTRAINT kpis_operacionais_tendencia_check CHECK ((tendencia = ANY (ARRAY['subindo'::text, 'descendo'::text, 'estavel'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.login_attempts ADD CONSTRAINT login_attempts_email_lowercase_chk CHECK (((email IS NULL) OR (email = lower(email)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.movimentacoes ADD CONSTRAINT movimentacoes_tipo_check CHECK ((tipo = ANY (ARRAY['entrada'::text, 'saida'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.performance_alerts ADD CONSTRAINT performance_alerts_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.performance_alerts ADD CONSTRAINT performance_alerts_source_check CHECK ((source = ANY (ARRAY['query_telemetry'::text, 'pg_stat_statements'::text, 'cron'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.n8n_workflow_configs ADD CONSTRAINT n8n_workflow_configs_event_type_check CHECK ((event_type = ANY (ARRAY['driver_approval'::text, 'driver_incident'::text, 'alert_triggered'::text, 'order_status_change'::text, 'route_deviation'::text, 'driver_stopped'::text, 'late_delivery'::text, 'risk_score_high'::text, 'custom'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.n8n_workflow_configs ADD CONSTRAINT n8n_workflow_configs_max_risk_score_check CHECK (((max_risk_score >= 0) AND (max_risk_score <= 100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.n8n_workflow_configs ADD CONSTRAINT n8n_workflow_configs_min_risk_score_check CHECK (((min_risk_score >= 0) AND (min_risk_score <= 100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ncms ADD CONSTRAINT ncms_cest_formato_chk CHECK (((cest IS NULL) OR (cest ~ '^[0-9]{7}$'::text) OR (cest ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{2}$'::text))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ncms ADD CONSTRAINT ncms_codigo_formato_chk CHECK ((codigo ~ '^[0-9]{8}$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ncms ADD CONSTRAINT ncms_ipi_range_chk CHECK (((aliquota_ipi >= (0)::numeric) AND (aliquota_ipi <= (1)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ncms ADD CONSTRAINT ncms_mva_range_chk CHECK (((mva_padrao IS NULL) OR ((mva_padrao >= (0)::numeric) AND (mva_padrao <= (3)::numeric)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ncms ADD CONSTRAINT ncms_vigencia_coerente CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.nfe_recebidas ADD CONSTRAINT nfe_recebidas_chave_acesso_check CHECK ((length(chave_acesso) = 44)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.notas_fiscais_ocr ADD CONSTRAINT notas_fiscais_ocr_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'processando'::text, 'processada'::text, 'erro'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.notification_history ADD CONSTRAINT notification_history_channel_check CHECK ((channel = ANY (ARRAY['inapp'::text, 'push'::text, 'email'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.notification_history ADD CONSTRAINT notification_history_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text, 'queued'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.operacoes_icms ADD CONSTRAINT operacoes_icms_finalidade_check CHECK (((finalidade IS NULL) OR (finalidade = ANY (ARRAY['REVENDA'::text, 'USO_CONSUMO'::text, 'ATIVO_IMOBILIZADO'::text, 'INDUSTRIALIZACAO'::text])))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.operacoes_icms ADD CONSTRAINT operacoes_icms_ncm_check CHECK ((ncm ~ '^[0-9]{8}$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.operacoes_icms ADD CONSTRAINT operacoes_icms_tipo_operacao_check CHECK ((tipo_operacao = ANY (ARRAY['INTERNA'::text, 'INTERESTADUAL'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.operacoes_icms ADD CONSTRAINT operacoes_icms_valor_operacao_check CHECK ((valor_operacao >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.oportunidades_elisao ADD CONSTRAINT oportunidades_elisao_status_check CHECK ((status = ANY (ARRAY['identificada'::text, 'em_analise'::text, 'aprovada'::text, 'em_execucao'::text, 'implementada'::text, 'descartada'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.organizacoes ADD CONSTRAINT organizacoes_tipo_check CHECK ((tipo = ANY (ARRAY['ESCRITORIO_CONTABIL'::text, 'EMPRESA'::text, 'CONSULTORIA'::text, 'OUTRO'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.overlay_rejeicoes_auditoria ADD CONSTRAINT overlay_rejeicoes_auditoria_catalogo_check CHECK ((catalogo = ANY (ARRAY['icms'::text, 'iss'::text, 'ncm'::text, 'monofasico'::text, 'mva_st'::text, 'interestaduais'::text, 'faixas_simples'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.overlay_rejeicoes_auditoria ADD CONSTRAINT overlay_rejeicoes_auditoria_severidade_check CHECK ((severidade = ANY (ARRAY['critico'::text, 'atencao'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.pagamentos_recorrentes ADD CONSTRAINT pag_recorrente_periodo CHECK (((data_fim IS NULL) OR (data_fim >= data_inicio))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.pagamentos_recorrentes ADD CONSTRAINT pagamentos_recorrentes_dia_vencimento_check CHECK (((dia_vencimento >= 1) AND (dia_vencimento <= 31))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.pagamentos_recorrentes ADD CONSTRAINT pagamentos_recorrentes_frequencia_check CHECK ((frequencia = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.pagamentos_recorrentes ADD CONSTRAINT pagamentos_recorrentes_total_gerado_check CHECK ((total_gerado >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.pagamentos_recorrentes ADD CONSTRAINT pagamentos_recorrentes_valor_check CHECK ((valor >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.partidas_contabeis ADD CONSTRAINT partidas_contabeis_tipo_check CHECK ((tipo = ANY (ARRAY['D'::text, 'C'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.partidas_contabeis ADD CONSTRAINT partidas_contabeis_valor_positivo CHECK ((valor > (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.password_reset_requests ADD CONSTRAINT password_reset_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.per_dcomp ADD CONSTRAINT per_dcomp_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'aguardando_transmissao'::text, 'transmitido'::text, 'em_analise'::text, 'deferido'::text, 'indeferido'::text, 'cancelado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.per_dcomp ADD CONSTRAINT per_dcomp_tipo_check CHECK ((tipo = ANY (ARRAY['per'::text, 'dcomp'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.per_dcomp ADD CONSTRAINT per_dcomp_tipo_credito_origem_check CHECK ((tipo_credito_origem = ANY (ARRAY['saldo_negativo'::text, 'pagamento_indevido'::text, 'retencao'::text, 'ressarcimento'::text, 'exportacao'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.per_dcomp ADD CONSTRAINT per_dcomp_valor_atualizado_check CHECK (((valor_atualizado IS NULL) OR (valor_atualizado >= (0)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.per_dcomp ADD CONSTRAINT per_dcomp_valor_compensado_check CHECK (((valor_compensado IS NULL) OR (valor_compensado >= (0)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.per_dcomp ADD CONSTRAINT per_dcomp_valor_original_check CHECK ((valor_original >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.pix_templates ADD CONSTRAINT pix_templates_uso_count_check CHECK ((uso_count >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.pix_templates ADD CONSTRAINT pix_templates_valor_padrao_nao_negativo CHECK ((valor_padrao >= (0)::numeric)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.planos_acao ADD CONSTRAINT planos_acao_prioridade_check CHECK ((prioridade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.planos_acao ADD CONSTRAINT planos_acao_progresso_check CHECK (((progresso >= 0) AND (progresso <= 100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.planos_acao ADD CONSTRAINT planos_acao_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluido'::text, 'cancelado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.prejuizos_fiscais ADD CONSTRAINT prejuizos_fiscais_trimestre_origem_check CHECK (((trimestre_origem IS NULL) OR ((trimestre_origem >= 1) AND (trimestre_origem <= 4)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.projecoes_reforma ADD CONSTRAINT projecoes_reforma_ano_check CHECK (((ano >= 2026) AND (ano <= 2033))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.projecoes_reforma ADD CONSTRAINT projecoes_reforma_carga_percentual_check CHECK (((carga_percentual >= (0)::numeric) AND (carga_percentual <= (200)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.protocolos_st ADD CONSTRAINT protocolos_st_vigencia_chk CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.protocolos_st_ncms ADD CONSTRAINT protocolos_st_ncms_codigo_formato_chk CHECK ((ncm_codigo ~ '^[0-9]{8}$'::text)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.protocolos_st_ncms ADD CONSTRAINT protocolos_st_ncms_mva_range_chk CHECK (((mva_original IS NULL) OR ((mva_original >= (0)::numeric) AND (mva_original <= (3)::numeric)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.protocolos_st_ncms ADD CONSTRAINT protocolos_st_ncms_vigencia_coerente CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.protocolos_st_ufs ADD CONSTRAINT protocolos_st_ufs_papel_check CHECK ((papel = ANY (ARRAY['ORIGEM'::text, 'DESTINO'::text, 'AMBOS'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.regime_decision_cache ADD CONSTRAINT regime_decision_cache_ano_check CHECK (((ano >= 2000) AND (ano <= 2100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.regime_decision_cache ADD CONSTRAINT regime_decision_cache_mes_check CHECK (((mes >= 1) AND (mes <= 12))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.regras_contabilizacao_automatica ADD CONSTRAINT regra_contas_distintas CHECK ((conta_debito_id <> conta_credito_id)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.regras_contabilizacao_automatica ADD CONSTRAINT regras_contabilizacao_automatica_nome_check CHECK (((char_length(btrim(nome)) >= 2) AND (char_length(btrim(nome)) <= 160))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.regras_contabilizacao_automatica ADD CONSTRAINT regras_contabilizacao_automatica_prioridade_check CHECK ((prioridade >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.regras_contabilizacao_automatica ADD CONSTRAINT regras_contabilizacao_automatica_tipo_evento_check CHECK ((tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.relatorios_agendados ADD CONSTRAINT relatorios_agendados_dia_mes_check CHECK (((dia_mes IS NULL) OR ((dia_mes >= 1) AND (dia_mes <= 31)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.relatorios_agendados ADD CONSTRAINT relatorios_agendados_dia_semana_check CHECK (((dia_semana IS NULL) OR ((dia_semana >= 0) AND (dia_semana <= 6)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.relatorios_agendados ADD CONSTRAINT relatorios_agendados_frequencia_check CHECK ((frequencia = ANY (ARRAY['diario'::text, 'semanal'::text, 'quinzenal'::text, 'mensal'::text, 'trimestral'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.relatorios_tributarios_agendados ADD CONSTRAINT relatorios_tributarios_agendados_ano_check CHECK (((ano >= 2000) AND (ano <= 2100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.relatorios_tributarios_agendados ADD CONSTRAINT relatorios_tributarios_agendados_dia_envio_check CHECK (((dia_envio >= 1) AND (dia_envio <= 28))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.relatorios_tributarios_agendados ADD CONSTRAINT relatorios_tributarios_agendados_frequencia_check CHECK ((frequencia = ANY (ARRAY['mensal'::text, 'trimestral'::text, 'anual'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.retencao_politicas ADD CONSTRAINT retencao_politicas_coerencia CHECK ((((dias IS NULL) AND (coluna IS NULL)) OR ((dias >= 1) AND (coluna IS NOT NULL)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.retencoes_fonte ADD CONSTRAINT retencoes_fonte_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'recolhido'::text, 'compensado'::text, 'cancelado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.saved_filter_subscriptions ADD CONSTRAINT saved_filter_subscriptions_canal_check CHECK ((canal = ANY (ARRAY['email'::text, 'push'::text, 'whatsapp'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.saved_filter_subscriptions ADD CONSTRAINT saved_filter_subscriptions_frequencia_check CHECK ((frequencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.saved_filters ADD CONSTRAINT saved_filters_shared_requires_empresa CHECK (((NOT is_shared) OR (empresa_id IS NOT NULL))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.scim_operations_log ADD CONSTRAINT scim_operations_log_duration_ms_check CHECK (((duration_ms IS NULL) OR (duration_ms >= 0))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.scim_operations_log ADD CONSTRAINT scim_operations_log_operation_check CHECK ((operation = ANY (ARRAY['create'::text, 'read'::text, 'list'::text, 'replace'::text, 'patch'::text, 'delete'::text, 'deactivate'::text, 'error'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.scim_operations_log ADD CONSTRAINT scim_operations_log_resource_type_check CHECK ((resource_type = ANY (ARRAY['User'::text, 'Group'::text, 'Schema'::text, 'ResourceType'::text, 'ServiceProviderConfig'::text, 'Bulk'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.scim_operations_log ADD CONSTRAINT scim_operations_log_status_code_check CHECK (((status_code >= 100) AND (status_code <= 599))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.scim_setup_checklist ADD CONSTRAINT scim_setup_checklist_item_key_check CHECK (((char_length(item_key) >= 1) AND (char_length(item_key) <= 120))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.security_alerts ADD CONSTRAINT security_alerts_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.simulacao_tributos_detalhados ADD CONSTRAINT simulacao_tributos_detalhados_aliquota_check CHECK (((aliquota >= (0)::numeric) AND (aliquota <= (1)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.simulacoes ADD CONSTRAINT simulacoes_carga_chk CHECK (((carga_tributaria_recomendada IS NULL) OR ((carga_tributaria_recomendada >= (0)::numeric) AND (carga_tributaria_recomendada <= (2)::numeric)))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.simulacoes ADD CONSTRAINT simulacoes_periodo_chk CHECK ((periodo_fim >= periodo_inicio)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.simulacoes ADD CONSTRAINT simulacoes_tempo_execucao_ms_check CHECK (((tempo_execucao_ms IS NULL) OR (tempo_execucao_ms >= 0))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.slo_metrics_diarias ADD CONSTRAINT slo_metrics_diarias_taxa_erro_pct_check CHECK (((taxa_erro_pct >= (0)::numeric) AND (taxa_erro_pct <= (100)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.slo_metrics_diarias ADD CONSTRAINT slo_metrics_diarias_uptime_pct_check CHECK (((uptime_pct >= (0)::numeric) AND (uptime_pct <= (100)::numeric))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.slow_query_alerts ADD CONSTRAINT slow_query_alerts_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.solicitacoes_lgpd ADD CONSTRAINT solicitacoes_lgpd_status_check CHECK ((status = ANY (ARRAY['aberta'::text, 'em_analise'::text, 'atendida'::text, 'rejeitada'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.solicitacoes_lgpd ADD CONSTRAINT solicitacoes_lgpd_tipo_check CHECK ((tipo = ANY (ARRAY['acesso'::text, 'portabilidade'::text, 'exclusao'::text, 'retificacao'::text, 'anonimizacao'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sped_contabil_arquivos ADD CONSTRAINT sped_contabil_arquivos_ano_calendario_check CHECK (((ano_calendario >= 2000) AND (ano_calendario <= 2100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sped_contabil_arquivos ADD CONSTRAINT sped_contabil_arquivos_status_check CHECK ((status = ANY (ARRAY['gerado'::text, 'rejeitado'::text, 'transmitido'::text, 'cancelado'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sped_contabil_arquivos ADD CONSTRAINT sped_contabil_arquivos_tipo_check CHECK ((tipo = ANY (ARRAY['ECD'::text, 'ECF'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sped_contabil_arquivos ADD CONSTRAINT sped_contabil_arquivos_total_lancamentos_check CHECK ((total_lancamentos >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sped_contabil_arquivos ADD CONSTRAINT sped_contabil_arquivos_total_linhas_check CHECK ((total_linhas >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sped_contabil_arquivos ADD CONSTRAINT sped_periodo_valido CHECK ((periodo_fim >= periodo_inicio)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sso_role_mappings ADD CONSTRAINT sso_role_mappings_idp_group_check CHECK (((char_length(btrim(idp_group)) >= 1) AND (char_length(btrim(idp_group)) <= 200))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sso_role_mappings ADD CONSTRAINT sso_role_mappings_ordem_check CHECK ((ordem >= 0)) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.sso_sandbox_runs ADD CONSTRAINT sso_sandbox_runs_outcome_check CHECK ((outcome = ANY (ARRAY['bloqueado'::text, 'seria_jit'::text, 'usuario_existente'::text, 'sem_email'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.tax_audit_trail ADD CONSTRAINT tax_audit_trail_action_check CHECK ((action = ANY (ARRAY['simulated'::text, 'cache_hit'::text, 'decided'::text, 'exported'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.tax_audit_trail ADD CONSTRAINT tax_audit_trail_ano_check CHECK (((ano >= 2000) AND (ano <= 2100))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.tax_audit_trail ADD CONSTRAINT tax_audit_trail_mes_check CHECK (((mes >= 1) AND (mes <= 12))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ufs ADD CONSTRAINT ufs_aliquota_fcp_range_chk CHECK (((aliquota_fcp >= (0)::numeric) AND (aliquota_fcp <= 0.05))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ufs ADD CONSTRAINT ufs_aliquota_interna_range_chk CHECK (((aliquota_interna_padrao >= (0)::numeric) AND (aliquota_interna_padrao <= 0.35))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ufs ADD CONSTRAINT ufs_codigo_ibge_range_chk CHECK (((codigo_ibge >= 11) AND (codigo_ibge <= 53))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.ufs ADD CONSTRAINT ufs_vigencia_coerente CHECK (((vigente_ate IS NULL) OR (vigente_ate >= vigente_de))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_demonstrativo_preferences ADD CONSTRAINT user_demonstrativo_preferences_fonte_padrao_check CHECK ((fonte_padrao = ANY (ARRAY['competencia'::text, 'caixa'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_demonstrativo_preferences ADD CONSTRAINT user_demonstrativo_preferences_modo_padrao_check CHECK ((modo_padrao = ANY (ARRAY['dre'::text, 'balanco'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_digest_preferences ADD CONSTRAINT user_digest_preferences_dia_mes_check CHECK (((dia_mes >= 1) AND (dia_mes <= 28))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_digest_preferences ADD CONSTRAINT user_digest_preferences_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_digest_preferences ADD CONSTRAINT user_digest_preferences_email_alternativo_check CHECK (((email_alternativo IS NULL) OR (email_alternativo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_digest_preferences ADD CONSTRAINT user_digest_preferences_frequencia_check CHECK ((frequencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_digest_preferences ADD CONSTRAINT user_digest_preferences_hora_envio_check CHECK (((hora_envio >= 0) AND (hora_envio <= 23))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_digest_preferences ADD CONSTRAINT user_digest_preferences_max_alertas_check CHECK (((max_alertas >= 1) AND (max_alertas <= 500))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_digest_preferences ADD CONSTRAINT user_digest_preferences_severidade_minima_check CHECK ((severidade_minima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.user_empresas ADD CONSTRAINT user_empresas_provisioned_via_check CHECK ((provisioned_via = ANY (ARRAY['manual'::text, 'sso'::text, 'scim'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.webauthn_challenges ADD CONSTRAINT webauthn_challenges_type_check CHECK ((type = ANY (ARRAY['registration'::text, 'authentication'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  BEGIN
    ALTER TABLE public.whatsapp_conversas ADD CONSTRAINT whatsapp_conversas_direcao_check CHECK ((direcao = ANY (ARRAY['entrada'::text, 'saida'::text]))) NOT VALID;
    cnt:=cnt+1;
  EXCEPTION WHEN duplicate_object THEN skip:=skip+1; WHEN undefined_table THEN skip:=skip+1; WHEN OTHERS THEN errs:=errs+1;
  END;
  RAISE NOTICE 'E46: % adicionados, % skip, % erros', cnt, skip, errs;
END $outer$;
SELECT 'E46|total|'||count(*)::text FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND con.contype='c';
