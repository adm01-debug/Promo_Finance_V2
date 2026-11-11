-- Shim: adiciona colunas ausentes em historico_cobranca antes de 20260711152458
-- que cria INDEX idx_historico_cobranca_empresa_status_created (empresa_id, status, created_at DESC)
-- Erro: 42703 — column "status" does not exist at statement 11
-- Colunas adicionadas fora do sistema de migrations em produção; Preview não as tem.
ALTER TABLE public.historico_cobranca
  ADD COLUMN IF NOT EXISTS status              text,
  ADD COLUMN IF NOT EXISTS mensagem            text,
  ADD COLUMN IF NOT EXISTS evento              text,
  ADD COLUMN IF NOT EXISTS metadata            jsonb,
  ADD COLUMN IF NOT EXISTS empresa_id          uuid,
  ADD COLUMN IF NOT EXISTS fila_id             uuid,
  ADD COLUMN IF NOT EXISTS etapa               text,
  ADD COLUMN IF NOT EXISTS provider            text,
  ADD COLUMN IF NOT EXISTS provider_message_id text;
