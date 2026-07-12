
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_contas_pagar_status') THEN
    ALTER TABLE public.contas_pagar
      ADD CONSTRAINT chk_contas_pagar_status
      CHECK (status IN ('pendente','pago','vencido','cancelado','parcial')) NOT VALID;
    ALTER TABLE public.contas_pagar VALIDATE CONSTRAINT chk_contas_pagar_status;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_contas_receber_status') THEN
    ALTER TABLE public.contas_receber
      ADD CONSTRAINT chk_contas_receber_status
      CHECK (status IN ('pendente','recebido','pago','vencido','cancelado','parcial')) NOT VALID;
    ALTER TABLE public.contas_receber VALIDATE CONSTRAINT chk_contas_receber_status;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_boletos_status') THEN
    ALTER TABLE public.boletos
      ADD CONSTRAINT chk_boletos_status
      CHECK (status IN ('pendente','enviado','pago','vencido','cancelado')) NOT VALID;
    ALTER TABLE public.boletos VALIDATE CONSTRAINT chk_boletos_status;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_fila_cobrancas_status') THEN
    ALTER TABLE public.fila_cobrancas
      ADD CONSTRAINT chk_fila_cobrancas_status
      CHECK (status IN ('pendente','enviado','falhou','cancelado')) NOT VALID;
    ALTER TABLE public.fila_cobrancas VALIDATE CONSTRAINT chk_fila_cobrancas_status;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_webhooks_log_status') THEN
    ALTER TABLE public.webhooks_log
      ADD CONSTRAINT chk_webhooks_log_status
      CHECK (status IN ('pending','processing','success','failed','retrying','dead')) NOT VALID;
    ALTER TABLE public.webhooks_log VALIDATE CONSTRAINT chk_webhooks_log_status;
  END IF;
END $$;

INSERT INTO public.audit_logs (table_name, action, details, created_at)
VALUES ('pg_constraint', 'status_checks_added',
        'Item 34: CHECK constraints de status aplicadas em 5 tabelas críticas.',
        now());
