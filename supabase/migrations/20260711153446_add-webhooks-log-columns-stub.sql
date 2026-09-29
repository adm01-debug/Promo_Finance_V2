-- Shim: adiciona colunas ausentes em webhooks_log antes de 20260711153447
-- que cria INDEX idx_webhooks_log_source_ext ON public.webhooks_log (source, external_id) (42703)
-- Colunas adicionadas fora do sistema de migrations em produção; Preview não as tem.
ALTER TABLE public.webhooks_log
  ADD COLUMN IF NOT EXISTS source        text,
  ADD COLUMN IF NOT EXISTS external_id   text,
  ADD COLUMN IF NOT EXISTS processed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS max_attempts  integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS dlq_id        uuid,
  ADD COLUMN IF NOT EXISTS last_response jsonb;
