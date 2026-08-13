
-- Item 33: Deduplicação de índices
-- Estratégia: manter o mais estabelecido; remover o duplicado.

-- 1) BRIN duplicados (btree já existia em created_at) — dropar BRIN
DROP INDEX IF EXISTS public.brin_audit_logs_2026_01_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_02_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_03_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_04_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_05_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_06_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_07_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_08_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_09_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_2026_10_ca;
DROP INDEX IF EXISTS public.brin_audit_logs_default_ca;
DROP INDEX IF EXISTS public.brin_auth_logs_created_at;
DROP INDEX IF EXISTS public.brin_cron_job_logs_created_at;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_01_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_02_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_03_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_04_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_05_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_06_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_07_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_08_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_09_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_2026_10_ca;
DROP INDEX IF EXISTS public.brin_frontend_error_logs_default_ca;
DROP INDEX IF EXISTS public.brin_frontend_performance_logs_created_at;
DROP INDEX IF EXISTS public.brin_query_telemetry_created_at;
DROP INDEX IF EXISTS public.brin_rate_limit_logs_created_at;
DROP INDEX IF EXISTS public.brin_runtime_error_logs_created_at;
DROP INDEX IF EXISTS public.brin_webhook_dlq_created_at;

-- 2) Índices manuais duplicando constraint UNIQUE (o índice da UNIQUE cobre)
DROP INDEX IF EXISTS public.idx_tracking_order;
DROP INDEX IF EXISTS public.idx_blocked_ips_ip;
DROP INDEX IF EXISTS public.idx_drivers_lalamove_id;
DROP INDEX IF EXISTS public.idx_geo_blocks_country;
DROP INDEX IF EXISTS public.idx_orders_lalamove_id;
DROP INDEX IF EXISTS public.idx_profiles_user_id;
DROP INDEX IF EXISTS public.idx_user_devices_user_fingerprint;
DROP INDEX IF EXISTS public.idx_user_passkeys_credential_id;

-- 3) webhook_events: manter o mais específico (event_type)
DROP INDEX IF EXISTS public.idx_webhooks_type;

INSERT INTO public.audit_logs (table_name, action, details, created_at)
VALUES ('pg_index', 'duplicate_indexes_removed',
        'Item 33: 37 índices duplicados removidos (BRIN redundantes + duplicações de UNIQUE).',
        now());
