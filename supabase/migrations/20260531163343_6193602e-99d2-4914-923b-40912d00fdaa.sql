-- 1. Create missing table user_onboarding_progress
CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    steps_completed JSONB DEFAULT '[]',
    is_completed BOOLEAN DEFAULT false,
    last_step TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_onboarding_progress TO authenticated;
GRANT ALL ON public.user_onboarding_progress TO service_role;

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding progress"
ON public.user_onboarding_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
ON public.user_onboarding_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
ON public.user_onboarding_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Restore Foreign Keys for contas_pagar
ALTER TABLE public.contas_pagar DROP CONSTRAINT IF EXISTS contas_pagar_empresa_id_fkey;
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.contas_pagar DROP CONSTRAINT IF EXISTS contas_pagar_categoria_id_fkey;
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;

-- 3. Restore Foreign Keys for contas_receber
ALTER TABLE public.contas_receber DROP CONSTRAINT IF EXISTS contas_receber_empresa_id_fkey;
ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.contas_receber DROP CONSTRAINT IF EXISTS contas_receber_categoria_id_fkey;
ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;

-- 4. Restore Foreign Keys for contas_bancarias
ALTER TABLE public.contas_bancarias DROP CONSTRAINT IF EXISTS contas_bancarias_empresa_id_fkey;
ALTER TABLE public.contas_bancarias ADD CONSTRAINT contas_bancarias_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

-- 5. Restore Foreign Keys for user_roles (pointing to profiles/auth.users)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Trigger for updated_at on user_onboarding_progress
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_onboarding_progress_updated_at
BEFORE UPDATE ON public.user_onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();