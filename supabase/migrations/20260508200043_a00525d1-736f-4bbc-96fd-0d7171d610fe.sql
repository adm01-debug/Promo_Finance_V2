-- Tabela para registrar bloqueios de duplicidade (Auditoria)
CREATE TABLE IF NOT EXISTS public.bloqueios_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tabela TEXT NOT NULL, -- 'contas_pagar' ou 'fretes'
    dados_tentativa JSONB NOT NULL,
    motivo_bloqueio TEXT NOT NULL,
    campos_conflitantes JSONB NOT NULL,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bloqueios_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver seus bloqueios"
ON public.bloqueios_duplicidade FOR SELECT
USING (empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true));

-- Adicionar coluna de idempotência
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='idempotency_key') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN idempotency_key TEXT;
        CREATE UNIQUE INDEX idx_contas_pagar_idempotency ON public.contas_pagar (idempotency_key) WHERE idempotency_key IS NOT NULL;
    END IF;
END $$;

-- Função principal de validação
CREATE OR REPLACE FUNCTION public.validar_duplicidade_financeira()
RETURNS TRIGGER AS $$
DECLARE
    v_conflito_id UUID;
    v_motivo TEXT;
BEGIN
    -- 1. Idempotency Key
    IF NEW.idempotency_key IS NOT NULL THEN
        SELECT id INTO v_conflito_id FROM public.contas_pagar 
        WHERE idempotency_key = NEW.idempotency_key AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        LIMIT 1;
        
        IF v_conflito_id IS NOT NULL THEN
            v_motivo := 'Chave de idempotência duplicada (Reenvio de API)';
            INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
            VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, jsonb_build_object('idempotency_key', NEW.idempotency_key), auth.uid());
            RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
        END IF;
    END IF;

    -- 2. Regra de Negócio: Fornecedor + Valor + Documento + Mês
    SELECT id INTO v_conflito_id FROM public.contas_pagar
    WHERE empresa_id = NEW.empresa_id
      AND (fornecedor_id = NEW.fornecedor_id OR cnpj_fornecedor = NEW.cnpj_fornecedor)
      AND valor = NEW.valor
      AND numero_documento = NEW.numero_documento
      AND date_trunc('month', data_vencimento) = date_trunc('month', NEW.data_vencimento)
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status != 'cancelado'
    LIMIT 1;

    IF v_conflito_id IS NOT NULL THEN
        v_motivo := 'Pagamento idêntico detectado para o mesmo fornecedor/CNPJ, valor e documento no mês.';
        INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
        VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, 
                jsonb_build_object('fornecedor', COALESCE(NEW.fornecedor_id::text, NEW.cnpj_fornecedor), 'valor', NEW.valor, 'documento', NEW.numero_documento), 
                auth.uid());
        
        -- Alerta Automático
        INSERT INTO public.alertas_tributarios (empresa_id, titulo, descricao, prioridade, categoria)
        VALUES (NEW.empresa_id, 'Bloqueio de Duplicidade', v_motivo || ' Documento: ' || NEW.numero_documento, 'alta', 'financeiro');
        
        RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagar ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagar
BEFORE INSERT OR UPDATE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.validar_duplicidade_financeira();

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

ALTER TABLE public.bloqueios_duplicidade
  ADD COLUMN IF NOT EXISTS transacao_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bloqueios_duplicidade_transacao_id_fkey'
                   AND conrelid='public.bloqueios_duplicidade'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='public' AND cl.relname='transacoes_bancarias'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.bloqueios_duplicidade ADD CONSTRAINT bloqueios_duplicidade_transacao_id_fkey
      FOREIGN KEY (transacao_id) REFERENCES public.transacoes_bancarias(id)
      ON DELETE SET NULL;
  END IF;
END
$fk$;
