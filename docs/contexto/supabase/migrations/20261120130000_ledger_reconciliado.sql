-- Reconciliação do ledger remoto de migrations.
--
-- A versão 20261120130000 (coluna `servico` em slo_metrics_diarias, edge
-- `calcular-slo-metrics-diario`) entrou na main via #478 depois dos pushes
-- das #483/#484, que já haviam registrado no ledger as versões vizinhas
-- (20261120235900, 20261121000000). O gate de divergência do prod-migrate
-- bloqueava qualquer push porque 20261120130000 ficou local-only com
-- versão menor que o máximo remoto.
--
-- Em produção a coluna já existe (drift Lovable, usada pela edge há meses),
-- então o DDL abaixo é idempotente (ADD COLUMN IF NOT EXISTS = no-op aqui)
-- e, ao registrar a versão no ledger, destrava a fila — mantendo também o
-- propósito original da #478 de criar a coluna em bancos reconstruídos só
-- pelas migrations.
ALTER TABLE public.slo_metrics_diarias
  ADD COLUMN IF NOT EXISTS servico TEXT NOT NULL DEFAULT 'geral'
