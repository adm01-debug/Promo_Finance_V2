-- Shim: dropa funções com defaults antes de 20260619150007 stmts 11-19
-- CREATE OR REPLACE falha (42P13) se função existe com parameter defaults
DROP FUNCTION IF EXISTS public.registrar_auditoria_config(text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.log_audit(text, uuid, text, text, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.export_asaas_audit_csv(uuid);
DROP FUNCTION IF EXISTS public.confirmar_conciliacao_manual(uuid, uuid, uuid, numeric);
DROP FUNCTION IF EXISTS public.desfazer_conciliacao_manual(uuid);
DROP FUNCTION IF EXISTS public.confirmar_envio_cobranca(uuid, text, text, boolean, text);
DROP FUNCTION IF EXISTS public.get_retencoes_pendentes_count(uuid);
DROP FUNCTION IF EXISTS public.processar_regua_cobranca(uuid, boolean);
DROP FUNCTION IF EXISTS public.get_asaas_payment_stats(uuid);
