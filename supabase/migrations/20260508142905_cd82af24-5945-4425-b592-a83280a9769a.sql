-- Tabela de alertas automáticos
CREATE TABLE IF NOT EXISTS public.elisao_alertas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    competencia DATE NOT NULL,
    tipo_divergencia TEXT NOT NULL, -- 'ncm_invalido', 'valor_divergente', 'documentacao_ausente'
    descricao TEXT NOT NULL,
    severidade TEXT NOT NULL DEFAULT 'media', -- 'baixa', 'media', 'alta'
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'resolvido', 'ignorado'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para alertas
ALTER TABLE public.elisao_alertas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view alerts for their companies' AND tablename = 'elisao_alertas') THEN
        CREATE POLICY "Users can view alerts for their companies"
        ON public.elisao_alertas FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE empresa_id = elisao_alertas.empresa_id
            AND user_id = auth.uid()
        ));
    END IF;
END $$;

-- Adicionar campos de aprovação em elisao_creditos_auditoria
ALTER TABLE public.elisao_creditos_auditoria 
ADD COLUMN IF NOT EXISTS aprovador_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_aprovacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
ADD COLUMN IF NOT EXISTS historico_decisoes JSONB DEFAULT '[]'::jsonb;

-- Adicionar integração Bitrix24 em elisao_tarefas_acionaveis
ALTER TABLE public.elisao_tarefas_acionaveis
ADD COLUMN IF NOT EXISTS bitrix_task_id TEXT,
ADD COLUMN IF NOT EXISTS bitrix_sync_status TEXT DEFAULT 'nao_sincronizado' CHECK (bitrix_sync_status IN ('nao_sincronizado', 'sincronizado', 'erro')),
ADD COLUMN IF NOT EXISTS bitrix_error_message TEXT;

-- Função para registrar decisão no histórico
CREATE OR REPLACE FUNCTION public.registrar_decisao_elisao()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') AND (NEW.status_aprovacao <> OLD.status_aprovacao) THEN
        NEW.historico_decisoes = COALESCE(OLD.historico_decisoes, '[]'::jsonb) || jsonb_build_object(
            'status', NEW.status_aprovacao,
            'usuario_id', auth.uid(),
            'data', now(),
            'comentario', NEW.motivo_rejeicao
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_registrar_decisao_elisao ON public.elisao_creditos_auditoria;
CREATE TRIGGER tr_registrar_decisao_elisao
BEFORE UPDATE ON public.elisao_creditos_auditoria
FOR EACH ROW
EXECUTE FUNCTION public.registrar_decisao_elisao();
