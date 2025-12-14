-- Tabela para armazenar logs de sincronização do Bitrix24
CREATE TABLE public.bitrix_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'alteracao')),
  entidade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'sucesso', 'erro', 'parcial')),
  registros_processados INTEGER DEFAULT 0,
  registros_com_erro INTEGER DEFAULT 0,
  mensagem_erro TEXT,
  detalhes JSONB,
  iniciado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configuração de mapeamento de campos
CREATE TABLE public.bitrix_field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entidade TEXT NOT NULL,
  campo_bitrix TEXT NOT NULL,
  campo_sistema TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  transformacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entidade, campo_bitrix)
);

-- Tabela para armazenar tokens OAuth
CREATE TABLE public.bitrix_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bitrix_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies para bitrix_sync_logs
CREATE POLICY "Authenticated users can view sync logs" ON public.bitrix_sync_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financeiro+ can insert sync logs" ON public.bitrix_sync_logs
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- RLS Policies para bitrix_field_mappings
CREATE POLICY "Authenticated users can view field mappings" ON public.bitrix_field_mappings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage field mappings" ON public.bitrix_field_mappings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para bitrix_oauth_tokens (apenas admin)
CREATE POLICY "Admin can manage oauth tokens" ON public.bitrix_oauth_tokens
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_bitrix_field_mappings_updated_at
  BEFORE UPDATE ON public.bitrix_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bitrix_oauth_tokens_updated_at
  BEFORE UPDATE ON public.bitrix_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir mapeamentos padrão
INSERT INTO public.bitrix_field_mappings (entidade, campo_bitrix, campo_sistema, ativo, obrigatorio) VALUES
  ('deal', 'ID', 'bitrix_deal_id', true, true),
  ('deal', 'TITLE', 'descricao', true, true),
  ('deal', 'OPPORTUNITY', 'valor', true, true),
  ('deal', 'CLOSEDATE', 'data_vencimento', true, false),
  ('deal', 'COMPANY_ID', 'cliente_id', true, false),
  ('contact', 'ID', 'bitrix_id', true, true),
  ('contact', 'NAME', 'razao_social', true, true),
  ('contact', 'EMAIL', 'email', true, false),
  ('contact', 'PHONE', 'telefone', true, false),
  ('company', 'ID', 'bitrix_id', true, true),
  ('company', 'TITLE', 'razao_social', true, true),
  ('company', 'EMAIL', 'email', true, false),
  ('company', 'PHONE', 'telefone', true, false);