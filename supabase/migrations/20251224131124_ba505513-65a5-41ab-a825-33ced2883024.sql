-- Tabela para configuração da régua de cobrança
CREATE TABLE public.regua_cobranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  dias_antes_vencimento INTEGER, -- NULL = após vencimento
  dias_apos_vencimento INTEGER,  -- NULL = antes do vencimento
  canal TEXT NOT NULL DEFAULT 'whatsapp' CHECK (canal IN ('whatsapp', 'email', 'sms')),
  template_mensagem TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_dias CHECK (
    (dias_antes_vencimento IS NOT NULL AND dias_apos_vencimento IS NULL) OR
    (dias_antes_vencimento IS NULL AND dias_apos_vencimento IS NOT NULL) OR
    (dias_antes_vencimento IS NULL AND dias_apos_vencimento IS NULL)
  )
);

-- Tabela para histórico de envios
CREATE TABLE public.historico_cobranca_whatsapp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id) ON DELETE CASCADE,
  regua_id UUID REFERENCES public.regua_cobranca(id),
  cliente_id UUID REFERENCES public.clientes(id),
  telefone TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'entregue', 'lido', 'erro')),
  erro_mensagem TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE,
  entregue_em TIMESTAMP WITH TIME ZONE,
  lido_em TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_regua_cobranca_ativo ON public.regua_cobranca(ativo);
CREATE INDEX idx_regua_cobranca_ordem ON public.regua_cobranca(ordem);
CREATE INDEX idx_historico_cobranca_whatsapp_conta ON public.historico_cobranca_whatsapp(conta_receber_id);
CREATE INDEX idx_historico_cobranca_whatsapp_status ON public.historico_cobranca_whatsapp(status);
CREATE INDEX idx_historico_cobranca_whatsapp_created ON public.historico_cobranca_whatsapp(created_at DESC);

-- RLS
ALTER TABLE public.regua_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_cobranca_whatsapp ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regua_cobranca
CREATE POLICY "Usuários autenticados podem ver régua de cobrança"
  ON public.regua_cobranca FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins e financeiros podem gerenciar régua de cobrança"
  ON public.regua_cobranca FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]));

-- Políticas RLS para historico_cobranca_whatsapp
CREATE POLICY "Usuários autenticados podem ver histórico de cobrança"
  ON public.historico_cobranca_whatsapp FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem inserir histórico de cobrança"
  ON public.historico_cobranca_whatsapp FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar histórico de cobrança"
  ON public.historico_cobranca_whatsapp FOR UPDATE
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_regua_cobranca_updated_at
  BEFORE UPDATE ON public.regua_cobranca
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir régua padrão
INSERT INTO public.regua_cobranca (nome, descricao, dias_antes_vencimento, template_mensagem, ordem) VALUES
('Lembrete Preventivo', 'Lembrete 3 dias antes do vencimento', 3, 
  'Olá {{cliente_nome}}! 👋\n\nEste é um lembrete amigável de que sua fatura no valor de *R$ {{valor}}* vence em *{{data_vencimento}}*.\n\n📋 Descrição: {{descricao}}\n\nPague em dia e evite juros!\n\nDúvidas? Estamos à disposição. 😊',
  1),
('Dia do Vencimento', 'Aviso no dia do vencimento', 0,
  'Olá {{cliente_nome}}! 📅\n\nSua fatura de *R$ {{valor}}* vence *HOJE*!\n\n📋 Descrição: {{descricao}}\n\nEvite juros pagando hoje mesmo.\n\nPrecisa de ajuda? Entre em contato conosco.',
  2),
('Primeiro Aviso', 'Primeira cobrança após vencimento', NULL,
  'Olá {{cliente_nome}}!\n\n⚠️ Identificamos que sua fatura de *R$ {{valor}}* venceu em {{data_vencimento}} e ainda não foi paga.\n\n📋 Descrição: {{descricao}}\n\nPor favor, regularize seu pagamento para evitar a incidência de encargos.\n\nDúvidas ou dificuldades? Podemos ajudar!',
  3),
('Segunda Cobrança', 'Segunda cobrança - 7 dias após vencimento', NULL,
  'Olá {{cliente_nome}}! 🔔\n\nNotamos que sua fatura de *R$ {{valor}}* está em atraso desde {{data_vencimento}}.\n\nEntre em contato conosco para regularizar sua situação e evitar restrições.\n\nEstamos à disposição para negociar!',
  4);

-- Atualizar dias_apos_vencimento para as cobranças após vencimento
UPDATE public.regua_cobranca SET dias_apos_vencimento = 1, dias_antes_vencimento = NULL WHERE nome = 'Primeiro Aviso';
UPDATE public.regua_cobranca SET dias_apos_vencimento = 7, dias_antes_vencimento = NULL WHERE nome = 'Segunda Cobrança';