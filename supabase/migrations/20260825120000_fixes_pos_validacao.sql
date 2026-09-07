-- =====================================================
-- 20260825120000_fixes_pos_validacao.sql
-- Fixes identificados pela suite de validação 5 agentes
-- =====================================================

-- FIX A2: empresa_id faltando em 5 tabelas (parser colsOf
--  não capturou tabelas que surgiram entre dump e reconciliar_v3)
DO $fix_a2$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alert_configurations') THEN
    ALTER TABLE public.alert_configurations ADD COLUMN IF NOT EXISTS empresa_id uuid;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alertas') THEN
    ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS empresa_id uuid;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='alerts') THEN
    ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS empresa_id uuid;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='risk_rules') THEN
    ALTER TABLE public.risk_rules ADD COLUMN IF NOT EXISTS empresa_id uuid;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='solicitacoes_lgpd') THEN
    ALTER TABLE public.solicitacoes_lgpd ADD COLUMN IF NOT EXISTS empresa_id uuid;
  END IF;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $fix_a2$;

-- FIX A4a: 3 cron jobs ausentes
-- (src/cron.txt formato CRON|name|sched com parts.length=6
--  foi ignorado pela condição parts.length<7 do gerador)
DO $fix_cron1$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('gerar-alertas-vencimento-diario');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $fix_cron1$;
DO $fix_cron1s$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.schedule('gerar-alertas-vencimento-diario','0 8 * * *',
      'select public.gerar_alertas_vencimento();');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $fix_cron1s$;

DO $fix_cron2$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('gerar-contas-recorrentes-diario');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $fix_cron2$;
DO $fix_cron2s$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.schedule('gerar-contas-recorrentes-diario','35 3 * * *',
      'select public.gerar_contas_recorrentes();');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $fix_cron2s$;

DO $fix_cron3$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('processar-regua-cobranca-diario');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $fix_cron3$;
DO $fix_cron3s$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.schedule('processar-regua-cobranca-diario','0 9 * * *',
      'select public.processar_regua_cobranca(null, false);');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $fix_cron3s$;

-- FIX A1: REVOKE PUBLIC EXECUTE novamente (cobre funções criadas
-- pelo reconciliar_v3 APÓS o hardening, que ficaram com proacl=NULL)
DO $fix_revoke$ BEGIN
  REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
EXCEPTION WHEN OTHERS THEN NULL;
END $fix_revoke$;
