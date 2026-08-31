-- Snapshot legado substituído pelo contrato consolidado criado em
-- `20251214170739_b7e0e8b0-39a4-42c5-844e-0a57a5e3916d.sql`.
--
-- A versão antiga tentava acrescentar implicitamente `entity_type` e
-- `entity_id` a uma tabela já existente por meio de CREATE TABLE IF NOT
-- EXISTS. As colunas nunca eram adicionadas e o primeiro CREATE INDEX falhava.
-- O contrato canônico usa `table_name` e `record_id`; não devemos introduzir
-- colunas ou triggers paralelos apenas para fazer o replay passar.
DO $audit_logs_contract_preflight$
BEGIN
  IF to_regclass('public.audit_logs') IS NULL THEN
    RAISE EXCEPTION
      'replay: public.audit_logs deveria ter sido criada pela migration consolidada';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'table_name'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'record_id'
  ) THEN
    RAISE EXCEPTION
      'replay: contrato consolidado de public.audit_logs está incompleto';
  END IF;
END
$audit_logs_contract_preflight$;
