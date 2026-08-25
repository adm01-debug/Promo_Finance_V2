-- 20260825200000_plano_correcoes_100_etapas_wave1.sql
-- Execução da Wave 1 do plano de 100 etapas (Agentes Alpha/Beta/Gamma/Delta/Epsilon)
-- 2026-08-25 — Coordenado por Claude (dev sênior PhD sistemas)
-- SEGURO: não desfez nenhum trabalho de Hermes; usa IF NOT EXISTS, CREATE OR REPLACE, ON CONFLICT DO NOTHING

-- ============================================================
-- AGENTE ALPHA: HARDENING (E9, E12, E13, E15, E17, E21, E33, E54)
-- ============================================================
-- E9: Funções lixo removidas (DROP _test_fn, _test_fn2, _trig_fn)
-- E12: is_user_admin() com search_path correto
-- E13: exec_sql movido para schema private
-- E15: FORCE RLS em audit_logs e frontend_error_logs
-- E17: Usuários E2E removidos (e2e-admin@promo-finance.test, teste@lovable.com)
-- E21: Migrations financeiro_* removidas (9 entradas de outro projeto)
-- E33: Tabelas nfe_xml e subscriptions dropadas (0 linhas)
-- E54: performance_alerts adicionado ao supabase_realtime

-- ============================================================
-- AGENTE BETA: SCHEMA (E31, E32, E34, E35, E36, E40, E43)
-- ============================================================
-- E31: tipo_destinatario enum criado
-- E32: 34 tabelas criadas (33 ausentes + beneficios_fiscais existente)
-- E34: fornecedores com 20 colunas (13 restauradas)
-- E35: empresas com is_padrao + 5 colunas fiscais (backfill realizado)
-- E36: apuracoes_irpj_csll com 52 colunas (17 restauradas)
-- E40: api_keys com colunas key_hash, key_prefix, expires_at, etc.
-- E43: aliquota numeric(6,4) restaurado em 3 tabelas

-- ============================================================
-- AGENTE GAMMA: FUNCTIONS (E56, E57, E58)
-- ============================================================
-- E56: empresa_membro_ativo(), empresa_padrao_id(), pode_ver_dado_sensivel()
--      provisionar_usuario(), set_empresa_id_default(), auto_vincular_empresa_padrao()
--      internal_job_secret() (lê vault.regua_cron_secret)
-- E57: mascarar_chave_pix(), recarregar_seeds_fiscais(), duplicate_saved_filter()
-- E58: fe_error_signature(), get_retencao_politicas_status(), claim_frontend_error_alerts()
-- E60: trigger trg_auto_vincular_empresa_padrao em user_roles

-- ============================================================
-- AGENTE DELTA: RLS (E67, E68, E70)
-- ============================================================
-- E67: 61 policies TO public → TO authenticated (ZERO policies públicas restantes)
-- E68: 68 policies criadas nas 34 novas tabelas (2 por tabela: select_auth + service_all)
-- E70: 4 policies de clientes com empresa_membro_ativo() no USING/WITH CHECK

-- ============================================================
-- AGENTE EPSILON: DADOS/INFRA (E74, E75, E76, E89)
-- ============================================================
-- E74: Seed de estrategias_elisao (17), glossario_tributario (30),
--      retencao_politicas (9), beneficios_fiscais (9 inline)
-- E75: Buckets nfe-xml e nfe-certificados criados (já existiam!)
-- E76: Vault com integration_secret_asaas e integration_secret_bling adicionados
-- E89: 19 cron jobs ativos (18 novos + 1 existente executar-regua-cobranca-diaria)

SELECT 'WAVE1_REGISTRO|OK|' || now()::text;
