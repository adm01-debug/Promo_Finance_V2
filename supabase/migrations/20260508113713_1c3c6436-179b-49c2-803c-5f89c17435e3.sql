-- Create table for user demonstrativo preferences
CREATE TABLE IF NOT EXISTS public.user_demonstrativo_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modo_padrao TEXT DEFAULT 'dre', -- 'dre' or 'balanco'
    fonte_padrao TEXT DEFAULT 'competencia', -- 'competencia' or 'caixa'
    filtros_por_empresa JSONB DEFAULT '{}'::jsonb, -- Store filters indexed by empresa_id
    drill_down_estado JSONB DEFAULT '{}'::jsonb, -- Store which lines are open/selected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_demonstrativo_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_demonstrativo_preferences_updated_at
BEFORE UPDATE ON public.user_demonstrativo_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();