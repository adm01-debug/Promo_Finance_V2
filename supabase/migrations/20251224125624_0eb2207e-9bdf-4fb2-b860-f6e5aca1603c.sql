-- Tabela para tokens de acesso do portal do cliente
CREATE TABLE public.portal_cliente_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  email_cliente VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year')
);

-- Índices para performance
CREATE INDEX idx_portal_tokens_token ON public.portal_cliente_tokens(token);
CREATE INDEX idx_portal_tokens_cliente ON public.portal_cliente_tokens(cliente_id);

-- RLS para tokens do portal
ALTER TABLE public.portal_cliente_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura por token (acesso público para validação)
CREATE POLICY "Tokens podem ser validados publicamente" 
ON public.portal_cliente_tokens 
FOR SELECT 
USING (ativo = true AND expires_at > now());

-- Política para usuários autenticados gerenciarem tokens
CREATE POLICY "Usuários autenticados podem gerenciar tokens" 
ON public.portal_cliente_tokens 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Tabela para histórico de acessos do portal
CREATE TABLE public.portal_cliente_acessos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID REFERENCES public.portal_cliente_tokens(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  acao VARCHAR(50) NOT NULL,
  detalhes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para histórico
CREATE INDEX idx_portal_acessos_cliente ON public.portal_cliente_acessos(cliente_id);
CREATE INDEX idx_portal_acessos_token ON public.portal_cliente_acessos(token_id);

-- RLS para histórico de acessos
ALTER TABLE public.portal_cliente_acessos ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (log de acesso)
CREATE POLICY "Acessos podem ser registrados publicamente" 
ON public.portal_cliente_acessos 
FOR INSERT 
WITH CHECK (true);

-- Política para usuários autenticados visualizarem
CREATE POLICY "Usuários autenticados podem ver acessos" 
ON public.portal_cliente_acessos 
FOR SELECT
USING (auth.uid() IS NOT NULL);