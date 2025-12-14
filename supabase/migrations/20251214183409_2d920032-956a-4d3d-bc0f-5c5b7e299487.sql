-- Create settings table for approval workflow configuration
CREATE TABLE public.configuracoes_aprovacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_minimo_aprovacao numeric NOT NULL DEFAULT 1000,
  aprovadores_obrigatorios integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.configuracoes_aprovacao ENABLE ROW LEVEL SECURITY;

-- Only admins can manage approval settings
CREATE POLICY "Admins can manage configuracoes_aprovacao"
ON public.configuracoes_aprovacao
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view configuracoes_aprovacao"
ON public.configuracoes_aprovacao
FOR SELECT
USING (true);

-- Create approval requests table
CREATE TABLE public.solicitacoes_aprovacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_pagar_id uuid NOT NULL REFERENCES public.contas_pagar(id) ON DELETE CASCADE,
  solicitado_por uuid NOT NULL,
  solicitado_em timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por uuid,
  aprovado_em timestamp with time zone,
  motivo_rejeicao text,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solicitacoes_aprovacao ENABLE ROW LEVEL SECURITY;

-- All authenticated can view approval requests
CREATE POLICY "Authenticated users can view solicitacoes_aprovacao"
ON public.solicitacoes_aprovacao
FOR SELECT
USING (true);

-- Operacional+ can create approval requests
CREATE POLICY "Operacional+ can insert solicitacoes_aprovacao"
ON public.solicitacoes_aprovacao
FOR INSERT
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]));

-- Financeiro+ can update approval requests (approve/reject)
CREATE POLICY "Financeiro+ can update solicitacoes_aprovacao"
ON public.solicitacoes_aprovacao
FOR UPDATE
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Add trigger for updated_at on configuracoes_aprovacao
CREATE TRIGGER update_configuracoes_aprovacao_updated_at
BEFORE UPDATE ON public.configuracoes_aprovacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.configuracoes_aprovacao (valor_minimo_aprovacao, aprovadores_obrigatorios, ativo)
VALUES (5000, 1, true);