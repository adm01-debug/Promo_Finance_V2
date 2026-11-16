-- Régua de cobrança por título
CREATE TABLE IF NOT EXISTS public.regua_cobranca_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo_id UUID NOT NULL, -- Referência ao contas_receber ou boleto
    cliente_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    etapa_atual TEXT NOT NULL DEFAULT 'preventiva',
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, disparado, erro, concluido
    data_proximo_disparo TIMESTAMP WITH TIME ZONE,
    historico JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.regua_cobranca_status ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regua_cobranca_status
CREATE POLICY "Usuários podem ver status da régua de sua empresa" 
ON public.regua_cobranca_status FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = regua_cobranca_status.empresa_id));

-- Adicionar colunas Bitrix24 na tabela de boletos (se não existirem)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='bitrix_id') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='bitrix_status') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='eventos_pagamento') THEN
        ALTER TABLE public.boletos ADD COLUMN eventos_pagamento JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Fila de conciliação pendente
CREATE TABLE IF NOT EXISTS public.conciliacao_sugestoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transacao_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    sugestoes JSONB NOT NULL, -- Array de matches possíveis com score e IDs do sistema
    status TEXT DEFAULT 'pendente', -- pendente, aceito, rejeitado
    analisado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.conciliacao_sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sugestões de sua empresa" 
ON public.conciliacao_sugestoes FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = conciliacao_sugestoes.empresa_id));

-- Reconciliacao com o banco de PRODUCAO, no arquivo que CRIA a tabela.
--
-- Estas colunas existem no canonico bwwbeyolnnzppeuhgkcd e a cadeia nunca as
-- criava. O numero veio de replay real (Postgres 16.15, os 1025 arquivos em
-- ordem, 1 transacao por arquivo): a secao 4 de 20261116190000 imprimia
--   NOTICE: indices de FK: 109 aplicados, 17 ignorados por coluna ou tabela ausente
-- e 4 arquivos abortavam por coluna ausente.
--
-- A coluna entra AQUI, e nao num arquivo de timestamp novo, porque medi que um
-- arquivo no fim da cadeia nao resolve: com a migration 20261116220000
-- aplicada, os 126 nomes de indice presentes no replay seguiam 106, iguais a
-- sem ela, porque ela roda DEPOIS de quem precisa da coluna. Mesmo padrao do
-- indice da FK em 20260712223141.
--
-- Em producao e no-op: este arquivo ja foi aplicado, e migration-ledger.yml
-- compara versao (nome do arquivo), nao checksum de conteudo.
--
-- Para asaas_audit_trail.asaas_payment_id, asaas_sync_queue.asaas_payment_id e
-- fila_cobrancas.etapa_id esta e uma ADICAO, nao renomeacao: em producao a
-- coluna antiga nao existe mais, mas 18 arquivos da cadeia ainda a usam (o
-- ultimo em 20261102000000), e renomear aqui quebra 20260508183450 e
-- 20260508184054 — medido. A remocao da coluna antiga e outra tarefa.

ALTER TABLE public.regua_cobranca_status
  ADD COLUMN IF NOT EXISTS conta_receber_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='regua_cobranca_status_conta_receber_id_fkey'
                   AND conrelid='public.regua_cobranca_status'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='public' AND cl.relname='contas_receber'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.regua_cobranca_status ADD CONSTRAINT regua_cobranca_status_conta_receber_id_fkey
      FOREIGN KEY (conta_receber_id) REFERENCES public.contas_receber(id)
      ON DELETE NO ACTION;
  END IF;
END
$fk$;
