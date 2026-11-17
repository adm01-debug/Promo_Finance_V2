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
-- Replay: os UPDATEs usam row_number() > 1, então num banco sem duplicata são
-- no-op, e num banco COM duplicata cancelam a cópia mais nova — que é
-- exatamente o que o índice exige para poder existir. Idempotente nas duas
-- situações. Sem CONCURRENTLY (falha no gateway transacional, AGENTS §4).

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

DROP INDEX IF EXISTS public.idx_contas_pagar_prevent_duplicates;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_prevent_duplicates
  ON public.contas_pagar USING btree (empresa_id, fornecedor_id, valor, data_vencimento, numero_documento)
  WHERE (((status)::text <> 'cancelado'::text)
     AND (fornecedor_id IS NOT NULL)
     AND (numero_documento IS NOT NULL));

DROP INDEX IF EXISTS public.idx_contas_receber_prevent_duplicates;
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_receber_prevent_duplicates
  ON public.contas_receber USING btree (empresa_id, cliente_id, valor, data_vencimento, numero_documento)
  WHERE (((status)::text <> 'cancelado'::text)
     AND (cliente_id IS NOT NULL)
     AND (numero_documento IS NOT NULL));
