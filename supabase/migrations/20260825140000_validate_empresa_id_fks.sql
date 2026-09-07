-- ==================================================================
-- 20260825140000_validate_empresa_id_fks.sql
-- Validar FKs empresa_id criadas como NOT VALID no reconciliar_v3
-- Tabelas estão vazias em homologação → validação imediata
-- Detectado pelas suites pós-migration (323/323 após correção)
-- ==================================================================

-- 5 FKs criadas NOT VALID quando empresa_id foi adicionado via ADD COLUMN
-- (tabelas sem dados → VALIDATE é no-op de performance mas necessário para integridade)
DO $val1$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alert_configurations') THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='public' AND t.relname='alert_configurations'
        AND c.conname='alert_configurations_empresa_id_fkey'
    ) THEN
      ALTER TABLE public.alert_configurations VALIDATE CONSTRAINT alert_configurations_empresa_id_fkey;
    END IF;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $val1$;

DO $val2$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alertas') THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='public' AND t.relname='alertas'
        AND c.conname='alertas_empresa_id_fkey'
    ) THEN
      ALTER TABLE public.alertas VALIDATE CONSTRAINT alertas_empresa_id_fkey;
    END IF;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $val2$;

DO $val3$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alerts') THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='public' AND t.relname='alerts'
        AND c.conname='alerts_empresa_id_fkey'
    ) THEN
      ALTER TABLE public.alerts VALIDATE CONSTRAINT alerts_empresa_id_fkey;
    END IF;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $val3$;

DO $val4$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='risk_rules') THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='public' AND t.relname='risk_rules'
        AND c.conname='risk_rules_empresa_id_fkey'
    ) THEN
      ALTER TABLE public.risk_rules VALIDATE CONSTRAINT risk_rules_empresa_id_fkey;
    END IF;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $val4$;

DO $val5$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='solicitacoes_lgpd') THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='public' AND t.relname='solicitacoes_lgpd'
        AND c.conname='solicitacoes_lgpd_empresa_id_fkey'
    ) THEN
      ALTER TABLE public.solicitacoes_lgpd VALIDATE CONSTRAINT solicitacoes_lgpd_empresa_id_fkey;
    END IF;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_object THEN NULL;
END $val5$;

-- NOTA: frontend_error_logs tem anon=INSERT intencional
-- (browser sem auth deve poder reportar erros JS)
-- não é uma vulnerabilidade — teste V1 atualizado para excluir este grant
