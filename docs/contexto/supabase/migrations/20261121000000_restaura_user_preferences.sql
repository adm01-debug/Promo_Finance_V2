-- Restaura public.user_preferences (key/value JSONB por usuário).
-- A tabela foi removida por 20261117190000 (DROP de resíduos da Lovable) — mas
-- o painel Configurações > Sistema (hook usePreferenciasSistema, PR #484) e os
-- filtros salvos a usam com (user_id, key) -> payload. Schema idêntico ao da
-- 20260508114653 + policies granulares com WITH CHECK no INSERT (padrão RLS
-- do repo). Restauração não-destrutiva.

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL, -- ex: 'configuracoes.sistema'
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
)

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY

CREATE POLICY "preferencias_sistema_select_own"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id)

CREATE POLICY "preferencias_sistema_insert_own"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id)

CREATE POLICY "preferencias_sistema_update_own"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id)

CREATE POLICY "preferencias_sistema_delete_own"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id)

-- A função handle_updated_at() já existe endurecida (search_path fixo) na
-- migration 20260619150639 — não redefine aqui para não remover o hardening.
-- Registra apenas o trigger da tabela nesta restauração.
CREATE TRIGGER tr_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at()

GRANT ALL ON public.user_preferences TO authenticated
