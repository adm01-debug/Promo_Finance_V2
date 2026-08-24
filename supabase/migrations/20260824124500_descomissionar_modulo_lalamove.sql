-- Descomissionamento definitivo do módulo Lalamove/entregas.
-- Idempotente: reflete a remoção aplicada em produção em 24/08/2026.

BEGIN;

DROP FUNCTION IF EXISTS public.check_integrity_invariants();
DROP FUNCTION IF EXISTS public.get_active_uapi_token();
DROP TRIGGER IF EXISTS on_order_status_change_sync_bitrix24 ON public.lalamove_orders;
DROP FUNCTION IF EXISTS public.trigger_bitrix24_sync();

ALTER TABLE IF EXISTS public.alerts
  DROP CONSTRAINT IF EXISTS alerts_driver_id_fkey,
  DROP CONSTRAINT IF EXISTS alerts_order_id_fkey;

ALTER TABLE IF EXISTS public.bitrix24_activities
  DROP CONSTRAINT IF EXISTS bitrix24_activities_order_id_fkey;

DROP TABLE IF EXISTS public.bitrix24_sync;
DROP TABLE IF EXISTS public.driver_locations;
DROP TABLE IF EXISTS public.active_tracking;
DROP TABLE IF EXISTS public.tracking_events;
DROP TABLE IF EXISTS public.driver_approval_queue;
DROP TABLE IF EXISTS public.driver_evaluations;
DROP TABLE IF EXISTS public.driver_incidents;
DROP TABLE IF EXISTS public.lalamove_status_history;
DROP TABLE IF EXISTS public.lalamove_stops;
DROP TABLE IF EXISTS public.lalamove_uapi_sessions;
DROP TABLE IF EXISTS public.lalamove_orders;
DROP TABLE IF EXISTS public.drivers;

ALTER TABLE IF EXISTS public."bitrix24_stage_mappings"
  DROP COLUMN IF EXISTS "lalamove_status";

DROP TYPE IF EXISTS public.approval_priority;
DROP TYPE IF EXISTS public.approval_status;
DROP TYPE IF EXISTS public.delivery_outcome;
DROP TYPE IF EXISTS public.driver_status;
DROP TYPE IF EXISTS public.incident_severity;
DROP TYPE IF EXISTS public.incident_type;
DROP TYPE IF EXISTS public.order_status;
DROP TYPE IF EXISTS public.vehicle_type;

COMMIT;
