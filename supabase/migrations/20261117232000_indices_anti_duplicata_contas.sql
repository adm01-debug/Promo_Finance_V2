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
-- removida, e o motivo fica gravado em `observacoes`.
--
-- 'cancelado' é valor válido nos dois CHECKs:
--   chk_contas_pagar_status      -> pendente|pago|vencido|cancelado|parcial
--   contas_receber_status_check  -> pendente|recebido|pago|vencido|cancelado|
--                                   parcial|atrasado|em_acordo
--
-- Replay: os UPDATEs usam row_number() > 1, então num banco sem duplicata são
-- no-op, e num banco COM duplicata cancelam a cópia mais nova — que é
-- exatamente o que o índice exige para poder existir. Idempotente nas duas
-- situações. Sem CONCURRENTLY (falha no gateway transacional, AGENTS §4).

WITH dup AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY fornecedor_id, valor, data_vencimento, numero_documento
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
      PARTITION BY cliente_id, valor, data_vencimento, numero_documento
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_prevent_duplicates
  ON public.contas_pagar USING btree (fornecedor_id, valor, data_vencimento, numero_documento)
  WHERE (((status)::text <> 'cancelado'::text)
     AND (fornecedor_id IS NOT NULL)
     AND (numero_documento IS NOT NULL));

CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_receber_prevent_duplicates
  ON public.contas_receber USING btree (cliente_id, valor, data_vencimento, numero_documento)
  WHERE (((status)::text <> 'cancelado'::text)
     AND (cliente_id IS NOT NULL)
     AND (numero_documento IS NOT NULL));
