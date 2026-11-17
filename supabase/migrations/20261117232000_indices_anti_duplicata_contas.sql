-- Liga os dois índices UNIQUE anti-duplicata de contas_pagar e contas_receber,
-- declarados no schema e impossíveis de criar até agora.
--
-- O que impedia: 6 grupos duplicados em contas_pagar e 6 em contas_receber
-- pela chave (fornecedor/cliente, valor, data_vencimento, numero_documento)
-- com status <> 'cancelado'. Medido em produção antes desta migration.
--
-- Causa dos 12: o script de seed rodou DUAS vezes em 2026-07-28, às
-- 19:09:01.817806+00 e 19:16:39.953047+00, 7m38s de intervalo. As linhas são
-- idênticas (ex.: 'Compra NF-1001', R$ 750,00, DOC-2001). Numeração sequencial
-- DOC-2001..2006 e VEN-7001..7006 nos dois lotes.
--
-- Como foi resolvido, e por que NÃO com DELETE:
-- o predicado dos índices já exclui status = 'cancelado'. Então basta marcar a
-- cópia MAIS NOVA de cada par como cancelada — que é o que uma duplicata de
-- lançamento é — em vez de apagar linha de tabela financeira. Nenhuma linha foi
-- removida, e o motivo fica gravado em `observacoes`. Nota: em produção o
-- cancelamento das 12 cópias foi executado antes de a nota existir neste
-- arquivo, então lá as 14 linhas canceladas estão com `observacoes` NULL; o
-- texto vale para quem replicar esta migration num banco novo.
--
-- 'cancelado' é valor válido nos dois CHECKs:
--   chk_contas_pagar_status      -> pendente|pago|vencido|cancelado|parcial
--   contas_receber_status_check  -> pendente|recebido|pago|vencido|cancelado|
--                                   parcial|atrasado|em_acordo
--
-- Isolamento por empresa (AGENTS §4). A chave começa em empresa_id nas duas
-- tabelas, e o PARTITION BY também. `fornecedores.empresa_id` está NULL nas 5
-- linhas de produção -- fornecedor é global --, e o formulário
-- (src/components/contas-pagar/ContaPagarFormFormulario.tsx) oferece qualquer
-- fornecedor para qualquer empresa. Sem empresa_id na chave, duas empresas com
-- o mesmo fornecedor, valor, vencimento e documento colidiriam: a obrigação
-- legítima do segundo CNPJ seria recusada com 23505, ou cancelada pelo UPDATE
-- acima. Mesmo critério de `detectar_duplicidades_financeiras`
-- (20260825100000_reconciliar_schema_completo.sql), que já filtra por empresa.
-- Hoje o banco tem 1 empresa e nenhum grupo duplicado cruzando empresas, então
-- o ajuste não muda linha nenhuma: só impede o falso positivo no dia em que a
-- segunda empresa entrar. Os DROP INDEX fazem o banco que já aplicou a versão
-- anterior desta migration convergir para a chave com empresa_id.
--
-- NULLS NOT DISTINCT nos dois indices: `empresa_id` aceita NULL
-- (20260518164611:50-74 adicionou a coluna sem NOT NULL) e UNIQUE trata NULL
-- como distinto, entao sem isso duas contas identicas com empresa_id NULL --
-- escrita de servico ou SQL administrativo, fora das policies -- passariam
-- pelos dois indices. `empresa_id` e a UNICA coluna da chave que aceita NULL:
-- valor e data_vencimento sao NOT NULL, fornecedor_id/cliente_id e
-- numero_documento ja sao excluidos pelo predicado. Postgres 17.6 em producao
-- suporta a clausula (PG >= 15). Verificado em producao: a gemea com empresa_id
-- NULL passava a ser recusada com 23505 (INSERT em bloco revertido).
--
-- Replay: os UPDATEs usam row_number() > 1, então num banco sem duplicata são
-- no-op, e num banco COM duplicata cancelam a cópia mais nova — que é
-- exatamente o que o índice exige para poder existir. Idempotente nas duas
-- situações. Sem CONCURRENTLY (falha no gateway transacional, AGENTS §4).

-- Trigger legado `trg_validar_duplicidade_pagar`
-- (20260508200327_cb379296-ba4d-4201-9f04-d175b2535749.sql:112-114) e
-- BEFORE INSERT OR UPDATE e `validar_duplicidade_avancada()` nao verifica se
-- NEW.status passou para 'cancelado': ele procura outra conta nao cancelada com
-- a mesma chave e levanta DUPLICIDADE_DETECTADA ao achar justamente a copia
-- antiga que esta limpeza preserva. Num banco COM duplicata e COM esse trigger
-- instalado (replay do zero -- nenhuma migration posterior o derruba), o UPDATE
-- abaixo abortaria. Produção nao tem o trigger (pg_trigger em
-- contas_pagar: set_updated_at e trg_anexos_sync_empresa), entao os dois blocos
-- abaixo sao no-op la. Suspende so ele, so durante a limpeza, e devolve depois.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'contas_pagar' AND t.tgname = 'trg_validar_duplicidade_pagar'
      AND NOT t.tgisinternal
  ) THEN
    ALTER TABLE public.contas_pagar DISABLE TRIGGER trg_validar_duplicidade_pagar;
  END IF;
END $$;

WITH dup AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY empresa_id, fornecedor_id, valor, data_vencimento, numero_documento
      ORDER BY created_at
    ) AS rn
  FROM public.contas_pagar
  WHERE status <> 'cancelado'
    AND fornecedor_id IS NOT NULL
    AND numero_documento IS NOT NULL
)
UPDATE public.contas_pagar c
SET
  status = 'cancelado',
  observacoes = concat_ws(
    ' | ',
    nullif(c.observacoes, ''),
    'Duplicata cancelada automaticamente para liberar idx_contas_pagar_prevent_duplicates; a copia mais antiga foi mantida. Nenhuma linha apagada.'
  ),
  updated_at = now()
FROM dup
WHERE dup.id = c.id
  AND dup.rn > 1;

WITH dup AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY empresa_id, cliente_id, valor, data_vencimento, numero_documento
      ORDER BY created_at
    ) AS rn
  FROM public.contas_receber
  WHERE status <> 'cancelado'
    AND cliente_id IS NOT NULL
    AND numero_documento IS NOT NULL
)
UPDATE public.contas_receber c
SET
  status = 'cancelado',
  observacoes = concat_ws(
    ' | ',
    nullif(c.observacoes, ''),
    'Duplicata cancelada automaticamente para liberar idx_contas_receber_prevent_duplicates; a copia mais antiga foi mantida. Nenhuma linha apagada.'
  ),
  updated_at = now()
FROM dup
WHERE dup.id = c.id
  AND dup.rn > 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'contas_pagar' AND t.tgname = 'trg_validar_duplicidade_pagar'
      AND NOT t.tgisinternal AND t.tgenabled = 'D'
  ) THEN
    ALTER TABLE public.contas_pagar ENABLE TRIGGER trg_validar_duplicidade_pagar;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_contas_pagar_prevent_duplicates;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_prevent_duplicates
  ON public.contas_pagar USING btree (empresa_id, fornecedor_id, valor, data_vencimento, numero_documento)
  NULLS NOT DISTINCT
  WHERE (((status)::text <> 'cancelado'::text)
     AND (fornecedor_id IS NOT NULL)
     AND (numero_documento IS NOT NULL));

DROP INDEX IF EXISTS public.idx_contas_receber_prevent_duplicates;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_receber_prevent_duplicates
  ON public.contas_receber USING btree (empresa_id, cliente_id, valor, data_vencimento, numero_documento)
  NULLS NOT DISTINCT
  WHERE (((status)::text <> 'cancelado'::text)
     AND (cliente_id IS NOT NULL)
     AND (numero_documento IS NOT NULL));
