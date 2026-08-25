-- =====================================================
-- 20260825120000_fixes_pos_validacao.sql
-- Fixes identificados pela suite de validação 5 agentes
-- =====================================================

-- FIX A2: empresa_id faltando em 5 tabelas (parser colsOf
--  não capturou tabelas que surgiram entre dump e reconciliar_v3)
ALTER TABLE public.alert_configurations ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.alertas              ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.alerts               ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.risk_rules           ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.solicitacoes_lgpd    ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- FIX A4a: 3 cron jobs ausentes
-- (src/cron.txt formato CRON|name|sched com parts.length=6
--  foi ignorado pela condição parts.length<7 do gerador)
SELECT cron.unschedule('gerar-alertas-vencimento-diario')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='gerar-alertas-vencimento-diario');
SELECT cron.schedule('gerar-alertas-vencimento-diario','0 8 * * *',
  'select public.gerar_alertas_vencimento();');

SELECT cron.unschedule('gerar-contas-recorrentes-diario')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='gerar-contas-recorrentes-diario');
SELECT cron.schedule('gerar-contas-recorrentes-diario','35 3 * * *',
  'select public.gerar_contas_recorrentes();');

SELECT cron.unschedule('processar-regua-cobranca-diario')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='processar-regua-cobranca-diario');
SELECT cron.schedule('processar-regua-cobranca-diario','0 9 * * *',
  'select public.processar_regua_cobranca(null, false);');

-- FIX A1: REVOKE PUBLIC EXECUTE novamente (cobre funções criadas
-- pelo reconciliar_v3 APÓS o hardening, que ficaram com proacl=NULL)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Registro
INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES('20260825120000','fixes_pos_validacao',ARRAY['fixes_pos_validacao'])
ON CONFLICT DO NOTHING;
