ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS bitrix_task_id text;