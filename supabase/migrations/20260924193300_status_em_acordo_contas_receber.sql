-- Régua de cobrança continuava cobrando contas_receber vinculadas a um
-- acordo de parcelamento ativo: acordos_parcelamento só gravava a marca em
-- `observacoes` (texto livre), e executar-regua-cobranca filtra por
-- `status IN ('pendente','vencido','parcial','atrasado')`, que ignora
-- `observacoes`. Sem um status dedicado não há como a régua saber que a
-- conta está negociada.
--
-- contas_receber.status tinha dois CHECK constraints conflitantes
-- (chk_contas_receber_status e contas_receber_status_check), cuja
-- interseção efetiva era só pendente/recebido/cancelado — 'vencido',
-- 'parcial' e 'atrasado' nunca puderam ser gravados apesar de declarados
-- em um dos dois. Consolida em um único constraint com a união dos valores
-- já declarados, mais 'em_acordo'.
ALTER TABLE contas_receber DROP CONSTRAINT IF EXISTS chk_contas_receber_status;
ALTER TABLE contas_receber DROP CONSTRAINT IF EXISTS contas_receber_status_check;

ALTER TABLE contas_receber ADD CONSTRAINT contas_receber_status_check
  CHECK (status IN (
    'pendente', 'recebido', 'pago', 'vencido', 'cancelado', 'parcial', 'atrasado', 'em_acordo'
  ));

COMMENT ON COLUMN contas_receber.status IS
  'em_acordo: conta vinculada a um acordo de parcelamento ativo (acordos_parcelamento.contas_receber_ids) — excluída da régua de cobrança automática enquanto durar.';
