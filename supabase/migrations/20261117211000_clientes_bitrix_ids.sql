-- Religa o sync do Bitrix24: as colunas de vínculo em clientes.
--
-- `clientes.bitrix_contact_id` e `clientes.bitrix_company_id` são declaradas em
-- migration e não existem no banco canônico — mesmo drift de
-- docs/agentes/auditoria-drift-banco-2026-11-17.md. O código, por sua vez,
-- usava um terceiro nome, `bitrix_id`, que é declarado em
-- 20251214170739_b7e0e8b0-39a4-42c5-844e-0a57a5e3916d.sql:275-288 mas também
-- não existe no banco canônico — logo, nunca recebeu um único vínculo:
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
-- `clientes.bitrix_id` NÃO é criada de propósito. Ela é declarada (ver acima),
-- mas não existe em produção, então não há vínculo legado para preservar:
-- conferido em information_schema.columns do projeto canônico — zero colunas
-- com esse nome em clientes, e os 12 clientes cadastrados têm
-- bitrix_contact_id e bitrix_company_id nulos. Criá-la fundiria contato e
-- empresa no mesmo campo, que é o desenho que o schema abandonou.
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
