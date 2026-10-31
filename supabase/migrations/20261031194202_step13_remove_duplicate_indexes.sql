-- Step 13: Remover 23 de 24 pares de índices duplicados
-- (Par custom_oauth_providers_identifier_idx está no schema auth — fora de escopo)

-- Lote 1: DROP INDEX simples (sem constraint)
DROP INDEX IF EXISTS public.uq_index_usage_snapshots_snapshot_schema_index;
DROP INDEX IF EXISTS public.idx_bloat_snapshots_date_table;
DROP INDEX IF EXISTS public.idx_perf_alerts_source_key;
DROP INDEX IF EXISTS public.ux_integration_secrets_chave;
DROP INDEX IF EXISTS public.idx_ncms_st;
DROP INDEX IF EXISTS public.idx_alert_configurations_enabled;

-- Lote 2: DROP INDEX simples (sem constraint)
DROP INDEX IF EXISTS public.idx_ncms_codigo;
DROP INDEX IF EXISTS public.idx_ufs_sigla;
DROP INDEX IF EXISTS public.idx_regras_rot_empresa;
DROP INDEX IF EXISTS public.idx_pst_ncms_protocolo;
DROP INDEX IF EXISTS public.idx_cnaes_codigo;
DROP INDEX IF EXISTS public.idx_pst_ufs_protocolo;

-- Lote 3: DROP INDEX simples (sem constraint)
DROP INDEX IF EXISTS public.idx_relatorios_tributarios_agendados_empresa_id;
DROP INDEX IF EXISTS public.uq_nfe_rec_conta_pagar;
DROP INDEX IF EXISTS public.idx_webhooks_log_source_ext;
DROP INDEX IF EXISTS public.custom_oauth_providers_identifier_idx;

-- Lote 4: DROP CONSTRAINT (ambos lados tinham constraint; mantém o de maior idx_scan)
ALTER TABLE public.aliquotas_interestaduais DROP CONSTRAINT IF EXISTS aliquotas_interestaduais_unq;
ALTER TABLE public.protocolos_st_ufs DROP CONSTRAINT IF EXISTS protocolos_st_ufs_unq;
ALTER TABLE public.conformidade_snapshots DROP CONSTRAINT IF EXISTS conformidade_snapshots_empresa_id_competencia_key;
ALTER TABLE public.aliquotas_internas_uf DROP CONSTRAINT IF EXISTS aliquotas_internas_uf_unq;
ALTER TABLE public.faixas_simples_nacional DROP CONSTRAINT IF EXISTS faixas_simples_unq;
ALTER TABLE public.fechamentos_tributarios DROP CONSTRAINT IF EXISTS fechamento_unico;
ALTER TABLE public.entregas_obrigacoes DROP CONSTRAINT IF EXISTS entregas_obrigacoes_uniq;
ALTER TABLE public.user_active_filters DROP CONSTRAINT IF EXISTS user_active_filters_user_id_entity_type_key;
