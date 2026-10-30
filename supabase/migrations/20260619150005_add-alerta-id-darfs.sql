-- Shim: adiciona alerta_id a darfs antes de 20260619151727
-- que cria INDEX idx_darfs_alerta_id e POLICY "DARFs scoped by linked empresa"
-- referenciando alerta_id (42703)
ALTER TABLE public.darfs
ADD COLUMN IF NOT EXISTS alerta_id UUID;
