-- 1. Melhorar logs de Webhooks
ALTER TABLE public.webhooks_log 
ADD COLUMN IF NOT EXISTS correlation_id TEXT,
ADD COLUMN IF NOT EXISTS ip_origem TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 2. Garantir isolamento Multi-CNPJ/Tenant em tabelas críticas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_bancarias' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.contas_bancarias ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
    END IF;
END $$;

-- 3. Adicionar alertas automáticos para falhas críticas
CREATE OR REPLACE FUNCTION public.gerar_alerta_falha_processamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'falha' OR NEW.erro_mensagem IS NOT NULL THEN
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      user_id
    ) VALUES (
      'falha_operacional',
      'Falha no Webhook: ' || COALESCE(NEW.event_type, 'Desconhecido'),
      'O processamento do webhook falhou: ' || COALESCE(NEW.erro_mensagem, 'Erro desconhecido') || '. Verifique o painel de logs.',
      'alta',
      'webhook',
      NEW.id,
      (SELECT user_id FROM public.perfil_usuarios WHERE empresa_id = NEW.empresa_id LIMIT 1)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_alerta_webhook_falha ON public.webhooks_log;
CREATE TRIGGER tr_alerta_webhook_falha
AFTER INSERT OR UPDATE ON public.webhooks_log
FOR EACH ROW WHEN (NEW.erro_mensagem IS NOT NULL)
EXECUTE FUNCTION public.gerar_alerta_falha_processamento();

-- Alerta para falha na Régua de Cobrança
CREATE OR REPLACE FUNCTION public.gerar_alerta_falha_regua()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'falha' THEN
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      user_id
    ) VALUES (
      'falha_regua',
      'Falha na Régua de Cobrança',
      'Não foi possível executar a etapa ' || NEW.etapa || ' para o título ' || NEW.conta_receber_id || '. Motivo: ' || COALESCE(NEW.mensagem_erro, 'Sem detalhes'),
      'media',
      'conta_receber',
      NEW.conta_receber_id,
      (SELECT user_id FROM public.perfil_usuarios WHERE empresa_id = NEW.empresa_id LIMIT 1)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_alerta_regua_falha ON public.execucoes_regua_cobranca;
CREATE TRIGGER tr_alerta_regua_falha
AFTER INSERT ON public.execucoes_regua_cobranca
FOR EACH ROW WHEN (NEW.status = 'falha')
EXECUTE FUNCTION public.gerar_alerta_falha_regua();
