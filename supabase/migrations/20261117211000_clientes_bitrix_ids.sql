-- Religa o sync do Bitrix24: as colunas de vínculo em clientes.
--
-- `clientes.bitrix_contact_id` e `clientes.bitrix_company_id` são declaradas em
-- migration e não existem no banco canônico — mesmo drift de
-- docs/agentes/auditoria-drift-banco-2026-11-17.md. O código, por sua vez,
-- usava um terceiro nome, `bitrix_id`, que não existe em lugar nenhum:
--
--   * bitrix24-sync/index.ts:385,398 grava e filtra o contato;
--   * bitrix24-sync/index.ts:503,515 grava e filtra a empresa;
--   * useBitrix24.ts:106 lista os clientes já sincronizados.
--
-- Como INSERT/UPDATE e filtro em coluna inexistente são recusados, o sync do
-- Bitrix não vinculava nada e a aba de clientes sincronizados vinha sempre
-- vazia. Esta migration cria as duas colunas declaradas; o código foi corrigido
-- para usá-las, separando contato de empresa como o schema declara.
--
-- `clientes.bitrix_id` NÃO é criada de propósito: não é declarada por nenhuma
-- migration, e criá-la fundiria contato e empresa no mesmo campo.
--
-- Índice em cada uma porque o sync filtra por elas a cada registro processado;
-- as migrations não declaram índice aqui, então o nome segue a convenção
-- idx_<tabela>_<coluna> usada no resto do schema.
--
-- Só ADD COLUMN IF NOT EXISTS e CREATE INDEX IF NOT EXISTS: nenhum dado
-- alterado, idempotente.

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bitrix_contact_id text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS bitrix_company_id text;

CREATE INDEX IF NOT EXISTS idx_clientes_bitrix_contact_id
  ON public.clientes(bitrix_contact_id)
  WHERE bitrix_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_bitrix_company_id
  ON public.clientes(bitrix_company_id)
  WHERE bitrix_company_id IS NOT NULL;
