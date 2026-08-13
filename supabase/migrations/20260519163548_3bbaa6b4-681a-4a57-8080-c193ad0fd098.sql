ALTER TABLE public.webhook_simulation_runs 
ADD COLUMN IF NOT EXISTS target_function TEXT,
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'normal';