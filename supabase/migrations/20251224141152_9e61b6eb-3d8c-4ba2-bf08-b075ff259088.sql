
-- Adicionar ramo de atividade aos clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS ramo_atividade text;

-- Criar tabela de vendedores
CREATE TABLE IF NOT EXISTS public.vendedores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  email text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  meta_mensal numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

-- Políticas para vendedores
CREATE POLICY "Usuários autenticados podem ver vendedores" 
ON public.vendedores 
FOR SELECT 
USING (true);

CREATE POLICY "Financeiro+ podem gerenciar vendedores" 
ON public.vendedores 
FOR ALL 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Adicionar vendedor às contas a receber
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.vendedores(id);

-- Adicionar vendedor aos clientes (vendedor responsável pelo cliente)
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.vendedores(id);

-- Trigger para updated_at em vendedores
CREATE TRIGGER update_vendedores_updated_at
BEFORE UPDATE ON public.vendedores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_ramo_atividade ON public.clientes(ramo_atividade);
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor_id ON public.clientes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vendedor_id ON public.contas_receber(vendedor_id);
