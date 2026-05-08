-- Tabela de preferências globais do usuário (substituindo ou estendendo o que já existe)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL, -- ex: 'contabilidade.demonstrativos'
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Tabela para presets de filtros salvos
CREATE TABLE IF NOT EXISTS public.user_filter_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- ex: 'dre-balanco', 'razao-diario'
  name TEXT NOT NULL, -- Nome dado pelo usuário ao preset
  filters JSONB NOT NULL,
  empresa_id TEXT, -- Opcional: vincular preset a uma empresa específica
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de auditoria para mudanças de filtros/preferências
CREATE TABLE IF NOT EXISTS public.user_action_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'preference_change', 'filter_change', 'preset_saved'
  entity_type TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_action_audit ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own filter presets"
  ON public.user_filter_presets
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs"
  ON public.user_action_audit
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.user_action_audit
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_user_filter_presets_updated_at
  BEFORE UPDATE ON public.user_filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
