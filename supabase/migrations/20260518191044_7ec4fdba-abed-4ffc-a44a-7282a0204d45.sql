-- 1. Acordos Parcelamento extra fields
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS desconto_aplicado NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS juros_aplicado NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS numero_parcelas INTEGER;
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS valor_parcela NUMERIC(15,2);

-- 2. Alertas Tributarios extra fields
ALTER TABLE public.alertas_tributarios ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.alertas_tributarios ADD COLUMN IF NOT EXISTS mensagem TEXT;
ALTER TABLE public.alertas_tributarios ADD COLUMN IF NOT EXISTS prioridade TEXT;
ALTER TABLE public.alertas_tributarios ADD COLUMN IF NOT EXISTS lido BOOLEAN DEFAULT false;
ALTER TABLE public.alertas_tributarios ADD COLUMN IF NOT EXISTS resolvido BOOLEAN DEFAULT false;

-- 3. DARFS extra fields
ALTER TABLE public.darfs ADD COLUMN IF NOT EXISTS descricao_receita TEXT;

-- 4. Acoes Recomendadas extra fields
ALTER TABLE public.acoes_recomendadas ADD COLUMN IF NOT EXISTS fonte TEXT;
ALTER TABLE public.acoes_recomendadas ADD COLUMN IF NOT EXISTS ordem INTEGER;
ALTER TABLE public.acoes_recomendadas ADD COLUMN IF NOT EXISTS gerado_em TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.acoes_recomendadas ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 5. Allowed Countries compatibility
ALTER TABLE public.allowed_countries ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 6. New table retencoes_fonte
CREATE TABLE IF NOT EXISTS public.retencoes_fonte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    tipo_imposto TEXT, -- IRRF, CSRF, ISS, etc
    valor NUMERIC(15,2),
    data_fato_gerador DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Dummy RPC for frontend calls
CREATE OR REPLACE FUNCTION public.gerar_numero_acordo()
RETURNS TEXT AS $$
BEGIN
    RETURN 'AC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
END;
$$ LANGUAGE plpgsql;

-- 8. RLS and Grants
ALTER TABLE public.retencoes_fonte ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own retencoes" ON public.retencoes_fonte FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.retencoes_fonte TO authenticated;
GRANT EXECUTE ON FUNCTION public.gerar_numero_acordo TO authenticated;
