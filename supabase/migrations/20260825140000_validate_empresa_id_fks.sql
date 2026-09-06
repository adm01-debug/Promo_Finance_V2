-- ==================================================================
-- 20260825140000_validate_empresa_id_fks.sql
-- Validar FKs empresa_id criadas como NOT VALID no reconciliar_v3
-- Tabelas estão vazias em homologação → validação imediata
-- Detectado pelas suites pós-migration (323/323 após correção)
-- ==================================================================

-- 5 FKs criadas NOT VALID quando empresa_id foi adicionado via ADD COLUMN
-- (tabelas sem dados → VALIDATE é no-op de performance mas necessário para integridade)
ALTER TABLE public.alert_configurations VALIDATE CONSTRAINT alert_configurations_empresa_id_fkey;
ALTER TABLE public.alertas              VALIDATE CONSTRAINT alertas_empresa_id_fkey;
ALTER TABLE public.alerts               VALIDATE CONSTRAINT alerts_empresa_id_fkey;
ALTER TABLE public.risk_rules           VALIDATE CONSTRAINT risk_rules_empresa_id_fkey;
ALTER TABLE public.solicitacoes_lgpd    VALIDATE CONSTRAINT solicitacoes_lgpd_empresa_id_fkey;

-- NOTA: frontend_error_logs tem anon=INSERT intencional
-- (browser sem auth deve poder reportar erros JS)
-- não é uma vulnerabilidade — teste V1 atualizado para excluir este grant
