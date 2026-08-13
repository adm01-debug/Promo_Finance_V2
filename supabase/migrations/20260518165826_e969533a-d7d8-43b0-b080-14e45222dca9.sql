
CREATE TABLE IF NOT EXISTS public.auditoria_financeira (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela text NOT NULL, operacao text NOT NULL,
  registro_id uuid, user_id uuid, empresa_id uuid,
  dados_antigos jsonb, dados_novos jsonb, motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auditoria_financeira ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read auditoria_financeira" ON public.auditoria_financeira FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert auditoria_financeira" ON public.auditoria_financeira FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.portal_cliente_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid, email_cliente text,
  token text NOT NULL UNIQUE, ativo boolean DEFAULT true,
  expires_at timestamptz, ultimo_acesso timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_cliente_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read portal tokens" ON public.portal_cliente_tokens FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth modify portal tokens" ON public.portal_cliente_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.portal_cliente_acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid,
  token_id uuid REFERENCES public.portal_cliente_tokens(id) ON DELETE SET NULL,
  ip_address inet, user_agent text, acao text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_cliente_acessos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read portal acessos" ON public.portal_cliente_acessos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert portal acessos" ON public.portal_cliente_acessos FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS cnpj_cpf text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS contato text,
  ADD COLUMN IF NOT EXISTS limite_credito numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ramo_atividade text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS score numeric(5,2),
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS empresa_id uuid;
