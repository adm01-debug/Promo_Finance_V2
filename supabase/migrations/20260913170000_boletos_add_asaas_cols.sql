ALTER TABLE public.boletos
  ADD COLUMN IF NOT EXISTS asaas_id          text,
  ADD COLUMN IF NOT EXISTS external_provider text;
