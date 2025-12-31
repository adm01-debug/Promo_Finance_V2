
-- Tabela para países permitidos (whitelist)
CREATE TABLE public.allowed_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.allowed_countries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar países" 
ON public.allowed_countries 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leitura pública para validação" 
ON public.allowed_countries 
FOR SELECT 
USING (true);

-- Adicionar configuração de geo restriction na security_settings
ALTER TABLE public.security_settings 
ADD COLUMN IF NOT EXISTS enable_geo_restriction BOOLEAN DEFAULT false;

-- Inserir Brasil como país padrão permitido
INSERT INTO public.allowed_countries (country_code, country_name) 
VALUES ('BR', 'Brasil');

-- Índice para performance
CREATE INDEX idx_allowed_countries_code ON public.allowed_countries(country_code) WHERE ativo = true;
