-- Reconcilia colunas que o código grava e que nunca chegaram ao banco.
--
-- Levantamento de 17/11/2026 (docs/agentes/auditoria-drift-banco-2026-11-17.md): o
-- replay das 1034 migrations num Postgres limpo produz estas colunas, o ledger marca
-- as migrations como aplicadas e elas não existem no projeto canônico. Como um INSERT
-- ou UPDATE com coluna inválida é recusado por inteiro, não falta um campo aqui e ali:
-- há funcionalidade inteira sem efeito em produção hoje.
--
--   * anomalia_detection_runs: detectar-anomalias-financeiras grava o andamento em
--     started_at/finished_at/current_step/step_index — a barra de progresso da tela
--     nunca avança;
--   * asaas_audit_trail, asaas_sync_queue, asaas_transfers: a trilha dos webhooks de
--     cobrança, o comprovante da transferência e o histórico de erro da fila não são
--     registrados;
--   * execucoes_cobranca, fila_cobrancas, historico_cobranca_whatsapp: a falha de envio
--     e a análise de IA da conversa de cobrança não são gravadas;
--   * sso_login_attempts: o PKCE do login federado (code_verifier_hash, app_redirect)
--     não é persistido;
--   * open_finance_consents: a revogação do consentimento não é datada;
--   * resumos_executivos_semanais: destinatários e erro de envio do resumo semanal.
--
-- Tipos, nulidade e defaults são exatamente os que as migrations declaram, lidos do
-- catálogo do replay — nada foi inventado aqui.
--
-- Seguro em produção: só ADD COLUMN IF NOT EXISTS e uma UNIQUE, nenhum DROP, nenhuma
-- mudança de dado existente. Das 10 tabelas, 9 estão vazias; execucoes_cobranca tem 10
-- linhas e suas 3 colunas novas são nuláveis. Nenhuma coluna NOT NULL entra sem default.
--
-- Fora daqui, de propósito:
--   * saved_filter_subscriptions: produção tem outro desenho da mesma tabela (unique por
--     (filter_id, user_id, canal), frequencia text com CHECK que rejeita 'imediata',
--     filter_id em vez de saved_filter_id). ADD COLUMN não religa a assinatura de filtro
--     salvo — precisa de convergência de constraint, em tarefa própria;
--   * solicitacoes_lgpd.atendida_por: a PR #439 passou a guardar quem atendeu dentro de
--     payload_resposta;
--   * as 9 colunas que o código grava e nenhuma migration declara (asaas_audit_trail
--     payment_id/message/reason/..., fila_cobrancas.erro, webhooks_log.transacao,
--     profiles.phone): são nome errado no código, correção de código.

-- anomalia_detection_runs
ALTER TABLE public.anomalia_detection_runs ADD COLUMN IF NOT EXISTS current_step text

ALTER TABLE public.anomalia_detection_runs ADD COLUMN IF NOT EXISTS finished_at timestamp with time zone

ALTER TABLE public.anomalia_detection_runs ADD COLUMN IF NOT EXISTS started_at timestamp with time zone

ALTER TABLE public.anomalia_detection_runs ADD COLUMN IF NOT EXISTS step_index integer DEFAULT 0 NOT NULL

-- asaas_audit_trail
ALTER TABLE public.asaas_audit_trail ADD COLUMN IF NOT EXISTS new_status text

ALTER TABLE public.asaas_audit_trail ADD COLUMN IF NOT EXISTS previous_status text

ALTER TABLE public.asaas_audit_trail ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid()

-- asaas_sync_queue
ALTER TABLE public.asaas_sync_queue ADD COLUMN IF NOT EXISTS error_history jsonb DEFAULT '[]'::jsonb

-- asaas_transfers
ALTER TABLE public.asaas_transfers ADD COLUMN IF NOT EXISTS transaction_receipt_url text

ALTER TABLE public.asaas_transfers ADD COLUMN IF NOT EXISTS user_id uuid

-- execucoes_cobranca
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS cliente_id uuid

ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS erro_mensagem text

ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS metadata jsonb

-- fila_cobrancas
ALTER TABLE public.fila_cobrancas ADD COLUMN IF NOT EXISTS erro_mensagem text

-- historico_cobranca_whatsapp
ALTER TABLE public.historico_cobranca_whatsapp ADD COLUMN IF NOT EXISTS created_by uuid

ALTER TABLE public.historico_cobranca_whatsapp ADD COLUMN IF NOT EXISTS enviado_em timestamp with time zone

ALTER TABLE public.historico_cobranca_whatsapp ADD COLUMN IF NOT EXISTS ia_proxima_acao text

ALTER TABLE public.historico_cobranca_whatsapp ADD COLUMN IF NOT EXISTS ia_resumo text

-- open_finance_consents
ALTER TABLE public.open_finance_consents ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone

-- resumos_executivos_semanais
ALTER TABLE public.resumos_executivos_semanais ADD COLUMN IF NOT EXISTS destinatarios text[] DEFAULT ARRAY[]::text[] NOT NULL

ALTER TABLE public.resumos_executivos_semanais ADD COLUMN IF NOT EXISTS erro_envio text

-- sso_login_attempts
ALTER TABLE public.sso_login_attempts ADD COLUMN IF NOT EXISTS app_redirect text

ALTER TABLE public.sso_login_attempts ADD COLUMN IF NOT EXISTS code_verifier_hash text

ALTER TABLE public.sso_login_attempts ADD COLUMN IF NOT EXISTS duration_ms integer

ALTER TABLE public.sso_login_attempts ADD COLUMN IF NOT EXISTS empresa_id uuid

-- O upsert de gerar-resumo-executivo-semanal usa onConflict empresa_id,semana_inicio.
-- A UNIQUE é declarada pelas migrations e não existe em produção; sem ela o upsert
-- falha com 42P10 mesmo com as colunas acima. Tabela vazia, criação imediata.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'resumos_executivos_semanais'
      AND c.conname = 'resumos_executivos_semanais_empresa_id_semana_inicio_key'
  ) THEN
    ALTER TABLE public.resumos_executivos_semanais
      ADD CONSTRAINT resumos_executivos_semanais_empresa_id_semana_inicio_key
      UNIQUE (empresa_id, semana_inicio);
  END IF;
END $$

-- Chaves estrangeiras declaradas junto com 4 dessas colunas e ausentes em
-- produção. Tipo e default iguais não garantem integridade referencial: sem
-- isto o banco aceitaria user_id, cliente_id ou empresa_id apontando para
-- registro que não existe. As 4 tabelas-alvo existem; asaas_audit_trail,
-- asaas_transfers e sso_login_attempts estão vazias, e as 10 linhas de
-- execucoes_cobranca têm cliente_id nulo (coluna recém-criada), então a
-- validação não encontra violação.
--
-- Fora daqui: as FKs de payment_id em asaas_audit_trail e asaas_sync_queue, que
-- as migrations declaram sobre a coluna fantasma payment_id — o vínculo real é
-- o de asaas_payment_id, que já existe em produção, e o código foi corrigido
-- para usá-lo na PR #441.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT *
    FROM (
      VALUES
        ('asaas_audit_trail', 'asaas_audit_trail_user_id_fkey',
         'FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
        ('asaas_transfers', 'asaas_transfers_user_id_fkey',
         'FOREIGN KEY (user_id) REFERENCES auth.users(id)'),
        ('execucoes_cobranca', 'execucoes_cobranca_cliente_id_fkey',
         'FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)'),
        ('sso_login_attempts', 'sso_login_attempts_empresa_id_fkey',
         'FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL')
    ) AS v(tabela, nome, definicao)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = r.tabela AND c.conname = r.nome
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', r.tabela, r.nome, r.definicao);
    END IF;
  END LOOP;
END $$
