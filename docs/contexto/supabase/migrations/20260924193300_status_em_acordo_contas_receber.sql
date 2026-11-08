ALTER TABLE contas_receber DROP CONSTRAINT IF EXISTS chk_contas_receber_status;
ALTER TABLE contas_receber DROP CONSTRAINT IF EXISTS contas_receber_status_check;

ALTER TABLE contas_receber ADD CONSTRAINT contas_receber_status_check
  CHECK (status IN (
    'pendente', 'recebido', 'pago', 'vencido', 'cancelado', 'parcial', 'atrasado', 'em_acordo'
  ));

COMMENT ON COLUMN contas_receber.status IS
  'em_acordo: conta vinculada a um acordo de parcelamento ativo (acordos_parcelamento.contas_receber_ids) — excluída da régua de cobrança automática enquanto durar.';
