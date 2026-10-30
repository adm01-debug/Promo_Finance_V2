-- Shim: cria active_tracking antes de 20260619150341
-- que faz DROP POLICY IF EXISTS ON public.active_tracking (42P01)
-- a tabela pertence ao módulo Lalamove, criada em produção mas ausente no
-- replay do Preview; é derrubada definitivamente em 20260824124500
CREATE TABLE IF NOT EXISTS public.active_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID,
    tracking_status TEXT
);
ALTER TABLE public.active_tracking ENABLE ROW LEVEL SECURITY;
