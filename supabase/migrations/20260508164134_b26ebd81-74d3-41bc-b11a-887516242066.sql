-- Tabela de Auditoria de Configurações
CREATE TABLE IF NOT EXISTS public.auditoria_configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_acao TEXT NOT NULL, -- 'troca_empresa', 'filtro_alterado', 'parametro_alterado'
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.auditoria_configuracoes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver auditoria das suas empresas') THEN
        CREATE POLICY "Usuários podem ver auditoria das suas empresas"
        ON public.auditoria_configuracoes FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'financeiro')
        ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem inserir auditoria') THEN
        CREATE POLICY "Usuários podem inserir auditoria"
        ON public.auditoria_configuracoes FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Função para registrar auditoria via RPC
CREATE OR REPLACE FUNCTION public.registrar_auditoria_config(
    _tipo_acao TEXT,
    _empresa_id UUID,
    _detalhes JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auditoria_configuracoes (user_id, empresa_id, tipo_acao, detalhes)
    VALUES (auth.uid(), _empresa_id, _tipo_acao, _detalhes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
