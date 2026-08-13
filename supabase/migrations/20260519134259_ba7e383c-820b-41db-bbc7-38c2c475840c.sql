CREATE TABLE IF NOT EXISTS public.resumos_executivos_semanais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    semana_inicio DATE NOT NULL,
    semana_fim DATE NOT NULL,
    resumo_md TEXT NOT NULL,
    kpis JSONB DEFAULT '{}'::jsonb,
    enviado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resumos_executivos_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total resumos_executivos_semanais" ON public.resumos_executivos_semanais FOR ALL USING (true) WITH CHECK (true);
