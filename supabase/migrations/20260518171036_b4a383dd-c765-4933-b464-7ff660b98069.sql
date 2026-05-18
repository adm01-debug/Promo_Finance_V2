-- 1. Create user_anomalia_preferences table
CREATE TABLE IF NOT EXISTS public.user_anomalia_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    toast_enabled BOOLEAN NOT NULL DEFAULT true,
    toast_min_severidade TEXT NOT NULL DEFAULT 'critica',
    toast_severidades_ativas TEXT[] NOT NULL DEFAULT '{critica,alta}',
    toast_duracao_segundos INTEGER NOT NULL DEFAULT 12,
    toast_acoes JSONB NOT NULL DEFAULT '{"drill_down": true, "abrir_pagina": true, "copiar_id": false, "marcar_lida": false}',
    drawer_acoes JSONB NOT NULL DEFAULT '{"abrir_entidade": true, "pagina_completa": true, "copiar_id": false, "marcar_lida": false}',
    silenciar_ate TIMESTAMP WITH TIME ZONE,
    centros_custo_silenciados UUID[] NOT NULL DEFAULT '{}',
    tipos_silenciados TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS and add policies
ALTER TABLE public.user_anomalia_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" ON public.user_anomalia_preferences
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Make clientes.nome nullable
ALTER TABLE public.clientes ALTER COLUMN nome DROP NOT NULL;

-- 4. Add missing foreign keys to asaas_reconciliation_suggestions
-- First check if columns exist, if not add them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asaas_reconciliation_suggestions' AND column_name = 'contas_receber_id') THEN
        ALTER TABLE public.asaas_reconciliation_suggestions ADD COLUMN contas_receber_id UUID REFERENCES public.contas_receber(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asaas_reconciliation_suggestions' AND column_name = 'contas_pagar_id') THEN
        ALTER TABLE public.asaas_reconciliation_suggestions ADD COLUMN contas_pagar_id UUID REFERENCES public.contas_pagar(id);
    END IF;
END $$;

-- 5. Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_user_anomalia_preferences_updated_at ON public.user_anomalia_preferences;
CREATE TRIGGER tr_user_anomalia_preferences_updated_at
    BEFORE UPDATE ON public.user_anomalia_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
