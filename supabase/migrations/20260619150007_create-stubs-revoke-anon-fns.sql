-- Shim: cria stubs das funções admin/cleanup antes de 20260711145322
-- que faz REVOKE EXECUTE FROM anon nessas funções (42883 — does not exist)
-- Funções criadas fora do sistema de migrations em produção; Preview não as tem.
CREATE OR REPLACE FUNCTION public.run_daily_cleanup()
RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;

CREATE OR REPLACE FUNCTION public.run_daily_cleanup_with_logging()
RETURNS void LANGUAGE sql AS $$ SELECT $$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS integer LANGUAGE sql AS $$ SELECT 0 $$;

CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS integer LANGUAGE sql AS $$ SELECT 0 $$;

CREATE OR REPLACE FUNCTION public.cleanup_old_cron_logs()
RETURNS integer LANGUAGE sql AS $$ SELECT 0 $$;

CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS SETOF record LANGUAGE sql AS $$ SELECT null::record WHERE false $$;

CREATE OR REPLACE FUNCTION public.get_cron_run_history()
RETURNS jsonb LANGUAGE sql AS $$ SELECT '[]'::jsonb $$;

CREATE OR REPLACE FUNCTION public.get_cron_run_history(p_job_name text, p_limit integer)
RETURNS jsonb LANGUAGE sql AS $$ SELECT '[]'::jsonb $$;

CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_email text)
RETURNS void LANGUAGE sql AS $$ SELECT $$;

CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text)
RETURNS void LANGUAGE sql AS $$ SELECT $$;

CREATE OR REPLACE FUNCTION public.increment_failed_attempts(_email text)
RETURNS void LANGUAGE sql AS $$ SELECT $$;

CREATE OR REPLACE FUNCTION public.registrar_auditoria_config(_tipo_acao text, _empresa_id uuid, _detalhes jsonb)
RETURNS void LANGUAGE sql AS $$ SELECT $$;

CREATE OR REPLACE FUNCTION public.log_audit(p_table_name text, p_record_id uuid, p_action text, p_details text, p_old_data jsonb, p_new_data jsonb)
RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;

CREATE OR REPLACE FUNCTION public.export_asaas_audit_csv(p_empresa_id uuid)
RETURNS text LANGUAGE sql AS $$ SELECT '' $$;

CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)
RETURNS void LANGUAGE sql AS $$ SELECT $$;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid)
RETURNS void LANGUAGE sql AS $$ SELECT $$;

CREATE OR REPLACE FUNCTION public.confirmar_envio_cobranca(p_fila_id uuid, p_provider text, p_provider_message_id text, p_sucesso boolean, p_erro text)
RETURNS void LANGUAGE sql AS $$ SELECT $$;

CREATE OR REPLACE FUNCTION public.get_retencoes_pendentes_count(p_empresa_id uuid)
RETURNS bigint LANGUAGE sql AS $$ SELECT 0::bigint $$;

CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id uuid, p_simulate boolean)
RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;

CREATE OR REPLACE FUNCTION public.get_asaas_payment_stats(p_empresa_id uuid)
RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
