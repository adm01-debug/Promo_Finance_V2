-- Segundo protótipo legado de auditoria, supersedido pelo contrato consolidado
-- de `public.audit_logs` (`table_name` + `record_id`).
--
-- O projeto canônico bwwbeyolnnzppeuhgkcd não possui `entity_type`,
-- `entity_id`, `changes` ou `metadata` nessa tabela. Criá-los apenas no replay
-- produziria drift e instalaria triggers sem consumidor no sistema atual.
DO $legacy_audit_logs_v2$
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
$legacy_audit_logs_v2$;
