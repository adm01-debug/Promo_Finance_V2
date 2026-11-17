-- 20261102000000_registrar_grupo_b_rls_cross_tenant.sql
-- Reconciliacao da PR #238: registra no schema_migrations as 15 migrations 20260902* do Grupo B
-- (fix_rls_cross_tenant) que ja foram aplicadas manualmente no banco, mas nao constam rastreadas.
--
-- Nao reexecuta DDL. Condiciona o registro a conferencia dos EFEITOS REAIS de cada migration no
-- banco: se alguma verificacao falhar, a transacao inteira aborta (RAISE EXCEPTION) e NENHUMA
-- versao e registrada. Regra: uma versao so pode entrar no ledger se o estado do banco comprovar
-- que o fix correspondente foi aplicado (ausencia das policies vulneraveis dropadas / presenca das
-- policies corrigidas com corpo escopado / funcoes e views com o efeito esperado).
--
-- Referencias dos efeitos esperados: arquivos supabase/migrations/20260902*.sql do Grupo B.

BEGIN;

DO $do$
DECLARE
    r record;
    pname text;
BEGIN
    -- ============ 20260902160000 / 20260902250000: views e matviews legadas ============
    -- Efeito esperado: REVOKE ALL ... FROM anon, authenticated em cada relacao existente.
    FOR r IN SELECT * FROM (VALUES
        ('vw_monthly_summary', 'v'),
        ('vw_cash_flow', 'v'),
        ('vw_contas_atrasadas', 'v'),
        ('vw_totals_by_category', 'v'),
        ('mv_dashboard_metrics', 'm'),
        ('mv_fluxo_caixa', 'm'),
        ('mv_top_fornecedores', 'm'),
        ('mv_inadimplencia', 'm'),
        ('vw_audit_report', 'v')
    ) AS v(relname, relkind) LOOP
        IF EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = r.relname AND c.relkind = r.relkind
              AND (
                has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                OR has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                OR has_table_privilege('public', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
              )
        ) THEN
        RAISE EXCEPTION '20260902160000: relacao ''%s'' ainda concedida a anon/authenticated', r.relname;
        END IF;
    END LOOP;

    -- ============ 20260902170000: RPCs SECURITY DEFINER sem escopo ============
    -- Efeito esperado: confirmar_conciliacao DROPado; fn_verificar_vencidos sem grant publico;
    -- processar_regua_cobranca reescrita com empresa_acessivel.
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = 'confirmar_conciliacao') THEN
        RAISE EXCEPTION '20260902170000: confirmar_conciliacao ainda existe (DROP nao confirmado)';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = 'fn_verificar_vencidos'
                AND (has_function_privilege('anon', p.oid, 'EXECUTE')
                  OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
                  OR has_function_privilege('public', p.oid, 'EXECUTE'))) THEN
        RAISE EXCEPTION '20260902170000: fn_verificar_vencidos ainda executavel por anon/authenticated/PUBLIC';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'processar_regua_cobranca'
                    AND pg_get_functiondef(p.oid) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902170000: processar_regua_cobranca ausente ou sem empresa_acessivel (corpo nao confirmado)';
    END IF;

    -- ============ 20260902180000: RPCs nfe_* com escopo empresa_acessivel ============
    FOR pname IN SELECT unnest(ARRAY['nfe_create_conta_pagar_from_nfe','nfe_link_conta_pagar',
                               'nfe_suggest_contas_pagar','nfe_unlink_conta_pagar']) LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                       WHERE n.nspname = 'public' AND p.proname = pname
                         AND pg_get_functiondef(p.oid) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902180000: rpc ''%s'' ausente ou sem empresa_acessivel (corpo nao confirmado)', pname;
        END IF;
    END LOOP;

    -- ============ 20260902130000 fix_rls_cross_tenant_leak_financeiro ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'anomalias_detectadas' AND policyname = 'Admins can manage anomalias') THEN
        RAISE EXCEPTION '20260902130000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage anomalias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'centros_custo' AND policyname = 'Admins can manage centros de custo') THEN
        RAISE EXCEPTION '20260902130000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage centros de custo';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_pagar' AND policyname = 'Admins can manage contas pagar') THEN
        RAISE EXCEPTION '20260902130000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage contas pagar';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_receber' AND policyname = 'Admins can manage contas receber') THEN
        RAISE EXCEPTION '20260902130000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage contas receber';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'parcelas_acordo' AND policyname = 'parcelas_acordo_admin_write') THEN
        RAISE EXCEPTION '20260902130000: policy ''%s'' ainda existe (DROP nao confirmado)', 'parcelas_acordo_admin_write';
    END IF;

    -- ============ 20260902140000 fix_rls_cross_tenant_leak_financeiro_parte2 ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'centros_custo' AND policyname = 'Financeiro+ can manage centros_custo') THEN
        RAISE EXCEPTION '20260902140000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ can manage centros_custo';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_pagar' AND policyname = 'Admin can delete contas_pagar') THEN
        RAISE EXCEPTION '20260902140000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin can delete contas_pagar';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_pagar' AND policyname = 'Financeiro+ can update contas_pagar') THEN
        RAISE EXCEPTION '20260902140000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ can update contas_pagar';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_pagar' AND policyname = 'Operacional+ can insert contas_pagar') THEN
        RAISE EXCEPTION '20260902140000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operacional+ can insert contas_pagar';
    END IF;

    -- ============ 20260902150000 fix_rls_cross_tenant_leak_financeiro_parte3 ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'anomalias_detectadas' AND policyname = 'Apenas admin atualiza anomalias') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Apenas admin atualiza anomalias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'anomalias_detectadas' AND policyname = 'Apenas admin visualiza anomalias') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Apenas admin visualiza anomalias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'anomalias_detectadas' AND policyname = 'Sistema insere anomalias') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Sistema insere anomalias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_pagar' AND policyname = 'Operacional+ podem ver contas_pagar') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operacional+ podem ver contas_pagar';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_receber' AND policyname = 'Admin can delete contas_receber') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin can delete contas_receber';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_receber' AND policyname = 'Financeiro+ can update contas_receber') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ can update contas_receber';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_receber' AND policyname = 'Operacional+ can insert contas_receber') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operacional+ can insert contas_receber';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_receber' AND policyname = 'Operacional+ podem ver contas_receber') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operacional+ podem ver contas_receber';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'parcelas_acordo' AND policyname = 'Financeiro+ podem gerenciar parcelas') THEN
        RAISE EXCEPTION '20260902150000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem gerenciar parcelas';
    END IF;

    -- ============ 20260902160000 fix_bypass_views_matviews_legadas ============

    -- ============ 20260902170000 fix_rpcs_security_definer_sem_escopo ============

    -- ============ 20260902180000 fix_nfe_vinculo_rpcs_sem_escopo ============

    -- ============ 20260902190000 fix_rls_cross_tenant_leak_grupo_a ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'acoes_recomendadas' AND policyname = 'Admin manage acoes_recomendadas') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin manage acoes_recomendadas';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'acoes_recomendadas' AND policyname = 'Admin/financeiro lê acoes_recomendadas') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/financeiro lê acoes_recomendadas';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'acordos_parcelamento' AND policyname = 'Admin pode deletar acordos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin pode deletar acordos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'acordos_parcelamento' AND policyname = 'Financeiro+ podem atualizar acordos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem atualizar acordos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'acordos_parcelamento' AND policyname = 'Financeiro+ podem criar acordos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem criar acordos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'acordos_parcelamento' AND policyname = 'Financeiro+ podem ver acordos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem ver acordos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alert_configurations' AND policyname = 'Admins can delete alert configs') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can delete alert configs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alert_configurations' AND policyname = 'Admins managers can view alert configs') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins managers can view alert configs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alert_configurations' AND policyname = 'Managers can insert alert configs') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Managers can insert alert configs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alert_configurations' AND policyname = 'Managers can update alert configs') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Managers can update alert configs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alert_configurations' AND policyname = 'Viewers can view alert configs') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Viewers can view alert configs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alertas' AND policyname = 'Users can insert own or privileged system alertas') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Users can insert own or privileged system alertas';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alertas' AND policyname = 'Users can update own or privileged system alertas') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Users can update own or privileged system alertas';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alertas_preditivos' AND policyname = 'Usuários podem ver alertas preditivos com escopo') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Usuários podem ver alertas preditivos com escopo';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alertas_tributarios' AND policyname = 'Users can delete own or elevated alertas_tributarios') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Users can delete own or elevated alertas_tributarios';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alertas_tributarios' AND policyname = 'Users can insert own or elevated alertas_tributarios') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Users can insert own or elevated alertas_tributarios';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alertas_tributarios' AND policyname = 'Users can update own or elevated alertas_tributarios') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Users can update own or elevated alertas_tributarios';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alertas_tributarios' AND policyname = 'Users can view own or elevated alertas_tributarios') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Users can view own or elevated alertas_tributarios';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Authorized roles can view alerts') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can view alerts';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Managers can delete alerts') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Managers can delete alerts';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Operators can insert alerts') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operators can insert alerts';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Operators can update alerts') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operators can update alerts';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'Viewers can view alerts') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Viewers can view alerts';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'apuracoes_tributarias' AND policyname = 'apuracoes_tributarias_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'apuracoes_tributarias_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_config' AND policyname = 'asaas_config_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'asaas_config_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_customers' AND policyname = 'Admins e financeiro podem ver clientes ASAAS') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins e financeiro podem ver clientes ASAAS';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_customers' AND policyname = 'asaas_customers_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'asaas_customers_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_payments' AND policyname = 'Admins e financeiro podem ver pagamentos ASAAS') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins e financeiro podem ver pagamentos ASAAS';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_payments' AND policyname = 'asaas_payments_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'asaas_payments_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_reconciliation_suggestions' AND policyname = 'asaas_recon_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'asaas_recon_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_transfers' AND policyname = 'asaas_transfers_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'asaas_transfers_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'auditoria_financeira' AND policyname = 'Admin can read auditoria_financeira') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin can read auditoria_financeira';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'auditoria_tributaria' AND policyname = 'auditoria_trib_admin_select') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'auditoria_trib_admin_select';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'boletos' AND policyname = 'Operacional+ podem ver boletos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operacional+ podem ver boletos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'categorias' AND policyname = 'Admin/fin can manage categorias') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/fin can manage categorias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'clientes' AND policyname = 'Operacional+ podem ver clientes') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operacional+ podem ver clientes';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'configuracoes_aprovacao' AND policyname = 'Admin financeiro can view configuracoes_aprovacao') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin financeiro can view configuracoes_aprovacao';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'configuracoes_aprovacao' AND policyname = 'Admins can manage configuracoes_aprovacao') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage configuracoes_aprovacao';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'configuracoes_aprovacao' AND policyname = 'configuracoes_aprovacao_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'configuracoes_aprovacao_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'configuracoes_duplicidade' AND policyname = 'config_dup_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'config_dup_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'conformidade_snapshots' AND policyname = 'conformidade_snapshots_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'conformidade_snapshots_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contas_bancarias' AND policyname = 'Financeiro+ podem ver contas_bancarias') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem ver contas_bancarias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'contratos' AND policyname = 'Financeiro+ podem ver contratos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem ver contratos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'convites_contador' AND policyname = 'Usuario revoga proprio convite') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Usuario revoga proprio convite';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'convites_contador' AND policyname = 'Usuario ve proprios convites') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Usuario ve proprios convites';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'darfs' AND policyname = 'Admins can manage darfs') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage darfs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'empresas_certificados' AND policyname = 'cert_admin_all') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'cert_admin_all';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'execucoes_cobranca' AND policyname = 'Fin users can read execucoes_cobranca') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can read execucoes_cobranca';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'execucoes_cobranca' AND policyname = 'System can insert execucoes_cobranca') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'System can insert execucoes_cobranca';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'faturamento_mensal' AND policyname = 'Admin/financeiro can delete faturamento') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/financeiro can delete faturamento';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'faturamento_mensal' AND policyname = 'Authorized roles can insert faturamento') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can insert faturamento';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'faturamento_mensal' AND policyname = 'Authorized roles can update faturamento') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can update faturamento';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'faturamento_mensal' AND policyname = 'Authorized roles can view faturamento') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can view faturamento';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'fechamentos_tributarios' AND policyname = 'Admin/financeiro podem atualizar fechamentos abertos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/financeiro podem atualizar fechamentos abertos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'fechamentos_tributarios' AND policyname = 'Admin/financeiro podem inserir fechamentos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/financeiro podem inserir fechamentos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'fechamentos_tributarios' AND policyname = 'Admin/financeiro/contador podem ler fechamentos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/financeiro/contador podem ler fechamentos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'fila_cobrancas' AND policyname = 'Admins can manage queue') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage queue';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'fila_cobrancas' AND policyname = 'Fin users can read fila_cobrancas') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can read fila_cobrancas';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'folha_pagamento' AND policyname = 'Admin/financeiro can delete folha') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/financeiro can delete folha';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'folha_pagamento' AND policyname = 'Authorized roles can insert folha') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can insert folha';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'folha_pagamento' AND policyname = 'Authorized roles can update folha') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can update folha';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'folha_pagamento' AND policyname = 'Authorized roles can view folha') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can view folha';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'health_scores_operacionais' AND policyname = 'Apenas admin visualiza health scores') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Apenas admin visualiza health scores';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_analises_preditivas' AND policyname = 'Usuários podem ver próprias análises ou papel elevado') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Usuários podem ver próprias análises ou papel elevado';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_cobranca' AND policyname = 'Financeiro+ can insert historico_cobranca') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ can insert historico_cobranca';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_cobranca' AND policyname = 'Financeiro+ podem ver historico_cobranca') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem ver historico_cobranca';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_cobranca_whatsapp' AND policyname = 'Financeiro e admin podem ver histórico de cobrança') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro e admin podem ver histórico de cobrança';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_cobranca_whatsapp' AND policyname = 'Financeiro+ podem atualizar historico cobranca whatsapp') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem atualizar historico cobranca whatsapp';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_cobranca_whatsapp' AND policyname = 'Financeiro+ podem inserir historico cobranca whatsapp') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem inserir historico cobranca whatsapp';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_score_saude' AND policyname = 'Financeiro e admin podem ver histórico de score') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro e admin podem ver histórico de score';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'lancamentos_contabeis' AND policyname = 'lanc_insert') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'lanc_insert';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'lancamentos_contabeis' AND policyname = 'lanc_select') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'lanc_select';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'lancamentos_contabeis' AND policyname = 'lanc_update') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'lanc_update';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'metas_financeiras' AND policyname = 'Financeiro+ can manage metas_financeiras') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ can manage metas_financeiras';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'metas_financeiras' AND policyname = 'Financeiro+ podem ver metas_financeiras') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem ver metas_financeiras';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'movimentacoes' AND policyname = 'Admin can delete movimentacoes') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin can delete movimentacoes';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'movimentacoes' AND policyname = 'Fin users can insert movimentacoes') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can insert movimentacoes';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'movimentacoes' AND policyname = 'Fin users can read movimentacoes') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can read movimentacoes';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'movimentacoes' AND policyname = 'Fin users can update movimentacoes') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can update movimentacoes';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'negativacoes' AND policyname = 'Admins can manage negativacoes') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage negativacoes';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'negativacoes' AND policyname = 'Fin users can read negativacoes') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can read negativacoes';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'notas_fiscais' AND policyname = 'Operacional+ podem ver notas fiscais') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operacional+ podem ver notas fiscais';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'notas_fiscais_ocr' AND policyname = 'Owner ou admin/financeiro visualiza NFs OCR') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Owner ou admin/financeiro visualiza NFs OCR';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'pix_templates' AND policyname = 'Admins can delete pix_templates') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can delete pix_templates';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'pix_templates' AND policyname = 'Admins can manage pix') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage pix';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'pix_templates' AND policyname = 'Role-based select pix_templates') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Role-based select pix_templates';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'prejuizos_fiscais' AND policyname = 'prejuizos_fiscais_admin_write') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'prejuizos_fiscais_admin_write';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'protestos' AND policyname = 'Admins can manage protestos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage protestos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'protestos' AND policyname = 'Fin users can read protestos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can read protestos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'recomendacoes_metas_ia' AND policyname = 'Financeiro+ podem ver recomendações') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem ver recomendações';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regime_decision_cache' AND policyname = 'regime_cache_read_authorized') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'regime_cache_read_authorized';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regimes_simulados' AND policyname = 'Authorized roles can insert regimes simulados') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can insert regimes simulados';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regimes_simulados' AND policyname = 'Authorized roles can view regimes simulados') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can view regimes simulados';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regras_conciliacao' AND policyname = 'Admin financeiro can read regras_conciliacao') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin financeiro can read regras_conciliacao';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regras_conciliacao' AND policyname = 'Financeiro+ podem atualizar regras_conciliacao') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem atualizar regras_conciliacao';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regras_conciliacao' AND policyname = 'Financeiro+ podem inserir regras_conciliacao') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem inserir regras_conciliacao';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regua_cobranca' AND policyname = 'Admin financeiro can view regua_cobranca') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin financeiro can view regua_cobranca';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'relatorios_tributarios_agendados' AND policyname = 'rel_trib_agend_admin_fin_select') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'rel_trib_agend_admin_fin_select';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'resumos_executivos_semanais' AND policyname = 'Admin/financeiro visualiza resumos executivos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/financeiro visualiza resumos executivos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'resumos_executivos_semanais' AND policyname = 'Admins gerenciam resumos executivos') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins gerenciam resumos executivos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'risk_rules' AND policyname = 'Admins can delete risk rules') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can delete risk rules';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'risk_rules' AND policyname = 'Authorized roles can view risk rules') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Authorized roles can view risk rules';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'risk_rules' AND policyname = 'Managers can insert risk rules') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Managers can insert risk rules';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'risk_rules' AND policyname = 'Managers can update risk rules') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Managers can update risk rules';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'risk_rules' AND policyname = 'Viewers can view risk rules') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Viewers can view risk rules';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'solicitacoes_lgpd' AND policyname = 'Apenas admin atualiza solicitações') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Apenas admin atualiza solicitações';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'solicitacoes_lgpd' AND policyname = 'Usuários veem suas próprias solicitações') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Usuários veem suas próprias solicitações';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'sped_contabil_arquivos' AND policyname = 'sped_contabil_insert') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'sped_contabil_insert';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'sped_contabil_arquivos' AND policyname = 'sped_contabil_select') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'sped_contabil_select';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'templates_cobranca' AND policyname = 'Admin can manage templates_cobranca') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin can manage templates_cobranca';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'templates_cobranca' AND policyname = 'Admin financeiro can read templates_cobranca') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin financeiro can read templates_cobranca';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'templates_cobranca' AND policyname = 'Admins can manage templates') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage templates';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'transferencias' AND policyname = 'Admin can delete transferencias') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin can delete transferencias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'transferencias' AND policyname = 'Fin users can insert transferencias') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can insert transferencias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'transferencias' AND policyname = 'Fin users can read transferencias') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can read transferencias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'transferencias' AND policyname = 'Fin users can update transferencias') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can update transferencias';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'vendedores' AND policyname = 'Financeiro+ podem gerenciar vendedores') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem gerenciar vendedores';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'vendedores' AND policyname = 'Operacional+ podem ver vendedores') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Operacional+ podem ver vendedores';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'verificacoes_conformidade' AND policyname = 'Admin/financeiro/contador podem ler verificacoes') THEN
        RAISE EXCEPTION '20260902190000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admin/financeiro/contador podem ler verificacoes';
    END IF;

    -- ============ 20260902200000 fix_rls_cross_tenant_leak_grupo_c ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_customers' AND policyname = 'Admins e financeiro podem atualizar clientes ASAAS') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins e financeiro podem atualizar clientes ASAAS';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_customers' AND policyname = 'Admins e financeiro podem inserir clientes ASAAS') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins e financeiro podem inserir clientes ASAAS';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_payments' AND policyname = 'Admins e financeiro podem atualizar pagamentos ASAAS') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins e financeiro podem atualizar pagamentos ASAAS';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_payments' AND policyname = 'Admins e financeiro podem inserir pagamentos ASAAS') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins e financeiro podem inserir pagamentos ASAAS';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'fila_cobrancas' AND policyname = 'Fin users can manage fila_cobrancas') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can manage fila_cobrancas';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'negativacoes' AND policyname = 'Fin users can manage negativacoes') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can manage negativacoes';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'pix_templates' AND policyname = 'Role-based update pix_templates') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Role-based update pix_templates';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'protestos' AND policyname = 'Fin users can manage protestos') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Fin users can manage protestos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regua_cobranca' AND policyname = 'Admins e financeiros podem gerenciar régua de cobrança') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins e financeiros podem gerenciar régua de cobrança';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'sped_contabil_arquivos' AND policyname = 'sped_contabil_update') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ainda existe (DROP nao confirmado)', 'sped_contabil_update';
    END IF;
    -- policies corrigidas que DEVEM existir com corpo escopado:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_customers' AND policyname = 'asaas_customers_tenant_rw' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'asaas_customers_tenant_rw', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_payments' AND policyname = 'asaas_payments_tenant_rw' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'asaas_payments_tenant_rw', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fila_cobrancas' AND policyname = 'fila_cobrancas_tenant_rw' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'fila_cobrancas_tenant_rw', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'negativacoes' AND policyname = 'negativacoes_tenant_rw' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'negativacoes_tenant_rw', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pix_templates' AND policyname = 'pix_templates_tenant_rw' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'pix_templates_tenant_rw', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'protestos' AND policyname = 'protestos_tenant_rw' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'protestos_tenant_rw', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'regua_cobranca' AND policyname = 'regua_cobranca_tenant_rw' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'regua_cobranca_tenant_rw', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sped_contabil_arquivos' AND policyname = 'sped_arquivos_update_admin' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902200000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'sped_arquivos_update_admin', 'empresa_acessivel';
    END IF;

    -- ============ 20260902210000 fix_rls_cross_tenant_leak_grupo_b1 ============
    -- policies corrigidas que DEVEM existir com corpo escopado:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alertas' AND policyname = 'Users can view own or privileged system alertas' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can view own or privileged system alertas', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alertas_preditivos' AND policyname = 'Atualizar alertas preditivos restrito' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Atualizar alertas preditivos restrito', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alertas_preditivos' AND policyname = 'Inserir alertas preditivos restrito' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Inserir alertas preditivos restrito', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bitrix_field_mappings' AND policyname = 'Admin can manage field mappings' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin can manage field mappings', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bitrix_sync_logs' AND policyname = 'Financeiro+ can insert sync logs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ can insert sync logs', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'boletos' AND policyname = 'Admin can delete boletos' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin can delete boletos', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'boletos' AND policyname = 'Financeiro+ can update boletos' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ can update boletos', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'boletos' AND policyname = 'Operacional+ can insert boletos' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Operacional+ can insert boletos', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clientes' AND policyname = 'Operacional+ can manage clientes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_membro_ativo%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Operacional+ can manage clientes', 'empresa_membro_ativo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conciliacoes' AND policyname = 'Fin users can manage conciliacoes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Fin users can manage conciliacoes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conciliacoes' AND policyname = 'Fin users can read conciliacoes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Fin users can read conciliacoes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contas_bancarias' AND policyname = 'Financeiro+ can manage contas' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ can manage contas', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contatos_financeiros' AND policyname = 'Admin/financeiro can read contatos_financeiros' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin/financeiro can read contatos_financeiros', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contatos_financeiros' AND policyname = 'Fin users can manage contatos_financeiros' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Fin users can manage contatos_financeiros', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'eventos_contabilizacao_log' AND policyname = 'eventos_contab_insert' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'eventos_contab_insert', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'extrato_bancario' AND policyname = 'Fin users can manage extrato_bancario' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Fin users can manage extrato_bancario', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'extrato_bancario' AND policyname = 'Fin users can read extrato_bancario' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Fin users can read extrato_bancario', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fechamentos_tributarios' AND policyname = 'Apenas admin pode deletar fechamentos' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Apenas admin pode deletar fechamentos', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fornecedores' AND policyname = 'Operacional+ can manage fornecedores' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Operacional+ can manage fornecedores', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fornecedores' AND policyname = 'Operacional+ podem ver fornecedores' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Operacional+ podem ver fornecedores', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'health_scores_operacionais' AND policyname = 'Sistema insere health scores via service role' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Sistema insere health scores via service role', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historico_analises_preditivas' AND policyname = 'Usuários podem inserir próprias análises ou papel elevado' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Usuários podem inserir próprias análises ou papel elevado', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historico_score_saude' AND policyname = 'Financeiro e admin podem inserir histórico de score' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro e admin podem inserir histórico de score', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notas_fiscais' AND policyname = 'Operacional+ can manage notas_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_membro_ativo%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Operacional+ can manage notas_fiscais', 'empresa_membro_ativo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notas_fiscais_ocr' AND policyname = 'Admins deletam NFs OCR' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins deletam NFs OCR', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notas_fiscais_ocr' AND policyname = 'Usuários atualizam suas próprias NFs OCR' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Usuários atualizam suas próprias NFs OCR', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oportunidades_elisao' AND policyname = 'Admin/financeiro can delete oportunidades elisao' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin/financeiro can delete oportunidades elisao', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oportunidades_elisao' AND policyname = 'Admin/financeiro can update oportunidades elisao' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin/financeiro can update oportunidades elisao', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oportunidades_elisao' AND policyname = 'Authorized roles can insert oportunidades elisao' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Authorized roles can insert oportunidades elisao', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'oportunidades_elisao' AND policyname = 'Authorized roles can view oportunidades elisao' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Authorized roles can view oportunidades elisao', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pagamentos_recorrentes' AND policyname = 'Admins podem deletar pagamentos recorrentes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins podem deletar pagamentos recorrentes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pagamentos_recorrentes' AND policyname = 'Financeiro+ podem atualizar pagamentos_recorrentes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar pagamentos_recorrentes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pagamentos_recorrentes' AND policyname = 'Operacional+ podem ver pagamentos_recorrentes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Operacional+ podem ver pagamentos_recorrentes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partidas_contabeis' AND policyname = 'partidas_delete' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'partidas_delete', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partidas_contabeis' AND policyname = 'partidas_insert' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'partidas_insert', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partidas_contabeis' AND policyname = 'partidas_select' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'partidas_select', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'partidas_contabeis' AND policyname = 'partidas_update' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'partidas_update', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portal_cliente_tokens' AND policyname = 'Financeiro e admin podem gerenciar tokens' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro e admin podem gerenciar tokens', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portal_cliente_tokens' AND policyname = 'portal_tokens_admin_all' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'portal_tokens_admin_all', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'recomendacoes_metas_ia' AND policyname = 'Financeiro+ podem atualizar recomendações' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar recomendações', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'regimes_simulados' AND policyname = 'Admin/financeiro can delete regimes simulados' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin/financeiro can delete regimes simulados', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'regimes_simulados' AND policyname = 'Admin/financeiro can update regimes simulados' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin/financeiro can update regimes simulados', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relatorios_agendados' AND policyname = 'Users can delete own scheduled reports or elevated' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can delete own scheduled reports or elevated', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relatorios_agendados' AND policyname = 'Users can update own scheduled reports or elevated' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can update own scheduled reports or elevated', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relatorios_agendados' AND policyname = 'Users can view own scheduled reports or elevated' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can view own scheduled reports or elevated', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relatorios_agendados' AND policyname = 'relatorios_agendados_proprios' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'relatorios_agendados_proprios', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relatorios_tributarios_agendados' AND policyname = 'rel_trib_agend_admin_delete' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'rel_trib_agend_admin_delete', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relatorios_tributarios_agendados' AND policyname = 'rel_trib_agend_admin_fin_insert' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'rel_trib_agend_admin_fin_insert', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'relatorios_tributarios_agendados' AND policyname = 'rel_trib_agend_admin_fin_update' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902210000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'rel_trib_agend_admin_fin_update', 'empresa_acessivel';
    END IF;

    -- ============ 20260902220000 fix_rls_cross_tenant_leak_sensiveis ============
    -- policies corrigidas que DEVEM existir com corpo escopado:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'empresas' AND policyname = 'Financeiro+ can manage empresas' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ can manage empresas', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'empresas' AND policyname = 'Operacional+ podem ver empresas' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Operacional+ podem ver empresas', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can manage profiles' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins can manage profiles', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can update all profiles' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins can update all profiles', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins can view all profiles', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can view own profile', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scim_operations_log' AND policyname = 'Admins view scim logs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins view scim logs', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'scim_operations_log' AND policyname = 'scim_operations_log_admin_select' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'scim_operations_log_admin_select', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sso_login_attempts' AND policyname = 'Admins can view SSO login attempts' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins can view SSO login attempts', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sso_login_attempts' AND policyname = 'Admins veem tentativas SSO' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins veem tentativas SSO', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sso_providers' AND policyname = 'Admins manage sso providers' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins manage sso providers', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_empresas' AND policyname = 'Admins manage user_empresas' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins manage user_empresas', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_empresas' AND policyname = 'Users view own empresa links' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902220000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users view own empresa links', 'empresa_acessivel';
    END IF;

    -- ============ 20260902230000 fix_rls_tautologia_empresas_asaas_elisao ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_audit_trail' AND policyname = 'Permitir leitura da auditoria para autenticados') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Permitir leitura da auditoria para autenticados';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_reconciliation_suggestions' AND policyname = 'Users can view suggestions of their company') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Users can view suggestions of their company';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_transfers' AND policyname = 'Users can view transfers of their company') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Users can view transfers of their company';
    END IF;
    -- policies corrigidas que DEVEM existir com corpo escopado:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_audit_trail' AND policyname = 'Users can view audit trail of their company' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%payment_id%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can view audit trail of their company', 'payment_id';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_audit_trail' AND policyname = 'asaas_audit_admin_all' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%payment_id%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'asaas_audit_admin_all', 'payment_id';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_config' AND policyname = 'Users can insert their own company asaas config' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can insert their own company asaas config', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_config' AND policyname = 'Users can update their own company asaas config' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can update their own company asaas config', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_config' AND policyname = 'Users can view their own company asaas config' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can view their own company asaas config', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_credit_risk_analysis' AND policyname = 'Users can view credit risk analysis of their customers' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can view credit risk analysis of their customers', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_scheduled_transfers' AND policyname = 'Users can manage their company scheduled transfers' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can manage their company scheduled transfers', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_transfers' AND policyname = 'Admins can insert transfers' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins can insert transfers', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_transfers' AND policyname = 'Admins can update transfers' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins can update transfers', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'elisao_analise_gap' AND policyname = 'Users can view their company gap analysis' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can view their company gap analysis', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'elisao_creditos_auditoria' AND policyname = 'Users can manage company audit logs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can manage company audit logs', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'elisao_simulacoes_regime' AND policyname = 'Users can manage their company simulations' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can manage their company simulations', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'elisao_tarefas_acionaveis' AND policyname = 'Users can manage company action tasks' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902230000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can manage company action tasks', 'empresa_acessivel';
    END IF;

    -- ============ 20260902240000 fix_rls_gaps_pos_pr54 ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'centros_custo' AND policyname = 'Financeiro+ podem ver centros_custo') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem ver centros_custo';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'lancamentos_contabeis' AND policyname = 'lanc_delete') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ainda existe (DROP nao confirmado)', 'lanc_delete';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'parcelas_acordo' AND policyname = 'Financeiro+ podem ver parcelas_acordo') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Financeiro+ podem ver parcelas_acordo';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'regua_cobranca' AND policyname = 'Admins can manage regua') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage regua';
    END IF;
    -- policies corrigidas que DEVEM existir com corpo escopado:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apuracoes_irpj_csll' AND policyname = 'Admin pode deletar apuracoes_irpj_csll' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar apuracoes_irpj_csll', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apuracoes_irpj_csll' AND policyname = 'Financeiro+ podem atualizar apuracoes_irpj_csll' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar apuracoes_irpj_csll', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apuracoes_irpj_csll' AND policyname = 'Financeiro+ podem inserir apuracoes_irpj_csll' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir apuracoes_irpj_csll', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apuracoes_irpj_csll' AND policyname = 'Financeiro+ podem ver apuracoes_irpj_csll' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver apuracoes_irpj_csll', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apuracoes_tributarias' AND policyname = 'Admin pode deletar apuracoes_tributarias' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar apuracoes_tributarias', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apuracoes_tributarias' AND policyname = 'Financeiro+ podem atualizar apuracoes_tributarias' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar apuracoes_tributarias', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apuracoes_tributarias' AND policyname = 'Financeiro+ podem inserir apuracoes_tributarias' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir apuracoes_tributarias', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'apuracoes_tributarias' AND policyname = 'Financeiro+ podem ver apuracoes_tributarias' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver apuracoes_tributarias', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creditos_tributarios' AND policyname = 'Admin pode deletar creditos_tributarios' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar creditos_tributarios', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creditos_tributarios' AND policyname = 'Financeiro+ podem atualizar creditos_tributarios' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar creditos_tributarios', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creditos_tributarios' AND policyname = 'Financeiro+ podem inserir creditos_tributarios' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir creditos_tributarios', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creditos_tributarios' AND policyname = 'Financeiro+ podem ver creditos_tributarios' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver creditos_tributarios', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'darfs' AND policyname = 'Admin pode deletar darfs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar darfs', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'darfs' AND policyname = 'Financeiro+ podem atualizar darfs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar darfs', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'darfs' AND policyname = 'Financeiro+ podem inserir darfs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir darfs', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'darfs' AND policyname = 'Financeiro+ podem ver darfs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver darfs', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historico_conciliacao_ia' AND policyname = 'Financeiro+ podem inserir historico_conciliacao_ia' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%tipo_lancamento%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir historico_conciliacao_ia', 'tipo_lancamento';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historico_conciliacao_ia' AND policyname = 'Financeiro+ podem ver historico_conciliacao_ia' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%tipo_lancamento%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver historico_conciliacao_ia', 'tipo_lancamento';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'incentivos_fiscais' AND policyname = 'Admin pode deletar incentivos_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar incentivos_fiscais', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'incentivos_fiscais' AND policyname = 'Financeiro+ podem atualizar incentivos_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar incentivos_fiscais', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'incentivos_fiscais' AND policyname = 'Financeiro+ podem inserir incentivos_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir incentivos_fiscais', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'incentivos_fiscais' AND policyname = 'Financeiro+ podem ver incentivos_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver incentivos_fiscais', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lalur_lancamentos' AND policyname = 'Admin pode deletar lalur_lancamentos' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar lalur_lancamentos', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lalur_lancamentos' AND policyname = 'Financeiro+ podem atualizar lalur_lancamentos' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar lalur_lancamentos', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lalur_lancamentos' AND policyname = 'Financeiro+ podem inserir lalur_lancamentos' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir lalur_lancamentos', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lalur_lancamentos' AND policyname = 'Financeiro+ podem ver lalur_lancamentos' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver lalur_lancamentos', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lancamentos_contabeis' AND policyname = 'Lancamentos scoped by empresa' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%user_empresas%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Lancamentos scoped by empresa', 'user_empresas';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'operacoes_tributaveis' AND policyname = 'Admin pode deletar operacoes_tributaveis' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar operacoes_tributaveis', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'operacoes_tributaveis' AND policyname = 'Financeiro+ podem atualizar operacoes_tributaveis' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar operacoes_tributaveis', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'operacoes_tributaveis' AND policyname = 'Financeiro+ podem inserir operacoes_tributaveis' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir operacoes_tributaveis', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'operacoes_tributaveis' AND policyname = 'Financeiro+ podem ver operacoes_tributaveis' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver operacoes_tributaveis', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pagamentos_recorrentes' AND policyname = 'Financeiro+ podem atualizar pagamentos_recorrentes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar pagamentos_recorrentes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pagamentos_recorrentes' AND policyname = 'Operacional+ podem ver pagamentos_recorrentes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Operacional+ podem ver pagamentos_recorrentes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pagamentos_recorrentes' AND policyname = 'Usuários podem criar pagamentos recorrentes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Usuários podem criar pagamentos recorrentes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'per_dcomp' AND policyname = 'Admin pode deletar per_dcomp' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar per_dcomp', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'per_dcomp' AND policyname = 'Financeiro+ podem atualizar per_dcomp' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar per_dcomp', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'per_dcomp' AND policyname = 'Financeiro+ podem inserir per_dcomp' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir per_dcomp', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'per_dcomp' AND policyname = 'Financeiro+ podem ver per_dcomp' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver per_dcomp', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prejuizos_fiscais' AND policyname = 'Admin pode deletar prejuizos_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar prejuizos_fiscais', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prejuizos_fiscais' AND policyname = 'Financeiro+ podem atualizar prejuizos_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar prejuizos_fiscais', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prejuizos_fiscais' AND policyname = 'Financeiro+ podem inserir prejuizos_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir prejuizos_fiscais', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prejuizos_fiscais' AND policyname = 'Financeiro+ podem ver prejuizos_fiscais' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver prejuizos_fiscais', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'regimes_especiais_empresa' AND policyname = 'Admin pode deletar regimes_especiais_empresa' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar regimes_especiais_empresa', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'regimes_especiais_empresa' AND policyname = 'Financeiro+ podem atualizar regimes_especiais_empresa' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar regimes_especiais_empresa', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'regimes_especiais_empresa' AND policyname = 'Financeiro+ podem inserir regimes_especiais_empresa' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir regimes_especiais_empresa', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'regimes_especiais_empresa' AND policyname = 'Financeiro+ podem ver regimes_especiais_empresa' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver regimes_especiais_empresa', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'retencoes_fonte' AND policyname = 'Admin pode deletar retencoes_fonte' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar retencoes_fonte', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'retencoes_fonte' AND policyname = 'Financeiro+ podem atualizar retencoes_fonte' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar retencoes_fonte', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'retencoes_fonte' AND policyname = 'Financeiro+ podem inserir retencoes_fonte' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir retencoes_fonte', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'retencoes_fonte' AND policyname = 'Financeiro+ podem ver retencoes_fonte' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver retencoes_fonte', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'split_payment_transacoes' AND policyname = 'Admin pode deletar split_payment_transacoes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin pode deletar split_payment_transacoes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'split_payment_transacoes' AND policyname = 'Financeiro+ podem atualizar split_payment_transacoes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem atualizar split_payment_transacoes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'split_payment_transacoes' AND policyname = 'Financeiro+ podem inserir split_payment_transacoes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir split_payment_transacoes', 'empresa_acessivel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'split_payment_transacoes' AND policyname = 'Financeiro+ podem ver split_payment_transacoes' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%empresa_acessivel%') THEN
        RAISE EXCEPTION '20260902240000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver split_payment_transacoes', 'empresa_acessivel';
    END IF;

    -- ============ 20260902250000 fix_storage_view_audit_trail_gaps ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'asaas_audit_trail' AND policyname = 'Permitir leitura da auditoria para autenticados') THEN
        RAISE EXCEPTION '20260902250000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Permitir leitura da auditoria para autenticados';
    END IF;
    -- policies corrigidas que DEVEM existir com corpo escopado:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_audit_trail' AND policyname = 'Users can view audit trail of their company' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%payment_id%') THEN
        RAISE EXCEPTION '20260902250000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Users can view audit trail of their company', 'payment_id';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_audit_trail' AND policyname = 'asaas_audit_admin_all' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%payment_id%') THEN
        RAISE EXCEPTION '20260902250000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'asaas_audit_admin_all', 'payment_id';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin/financeiro visualiza tax reports' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%user_empresas%') THEN
        RAISE EXCEPTION '20260902250000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admin/financeiro visualiza tax reports', 'user_empresas';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete tax reports' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%user_empresas%') THEN
        RAISE EXCEPTION '20260902250000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Admins can delete tax reports', 'user_empresas';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'nfe_xml_empresa_read' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%user_empresas%') THEN
        RAISE EXCEPTION '20260902250000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'nfe_xml_empresa_read', 'user_empresas';
    END IF;

    -- ============ 20260902260000 fix_historico_conciliacao_ia_or_bypass ============
    -- policies corrigidas que DEVEM existir com corpo escopado:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historico_conciliacao_ia' AND policyname = 'Financeiro+ podem inserir historico_conciliacao_ia' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%tipo_lancamento%') THEN
        RAISE EXCEPTION '20260902260000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem inserir historico_conciliacao_ia', 'tipo_lancamento';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historico_conciliacao_ia' AND policyname = 'Financeiro+ podem ver historico_conciliacao_ia' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%tipo_lancamento%') THEN
        RAISE EXCEPTION '20260902260000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Financeiro+ podem ver historico_conciliacao_ia', 'tipo_lancamento';
    END IF;

    -- ============ 20260902270000 fix_orphan_policies_pos_pr55 ============
    -- policies vulneraveis que DEVEM ter sido dropadas:
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'darfs' AND policyname = 'Admins can manage darfs') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Admins can manage darfs';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'darfs' AND policyname = 'DARFs scoped by linked empresa') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ainda existe (DROP nao confirmado)', 'DARFs scoped by linked empresa';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_conciliacao_ia' AND policyname = 'historico_conciliacao_ia_role_select') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ainda existe (DROP nao confirmado)', 'historico_conciliacao_ia_role_select';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'historico_conciliacao_ia' AND policyname = 'historico_conciliacao_ia_tenant_select') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ainda existe (DROP nao confirmado)', 'historico_conciliacao_ia_tenant_select';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'lancamentos_contabeis' AND policyname = 'Owner manage lancamentos') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ainda existe (DROP nao confirmado)', 'Owner manage lancamentos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'pagamentos_recorrentes' AND policyname = 'pagamentos_recorrentes_acesso') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ainda existe (DROP nao confirmado)', 'pagamentos_recorrentes_acesso';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies
              WHERE schemaname = 'public' AND tablename = 'per_dcomp' AND policyname = 'per_dcomp_admin_all') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ainda existe (DROP nao confirmado)', 'per_dcomp_admin_all';
    END IF;
    -- policies corrigidas que DEVEM existir com corpo escopado:
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'asaas_audit_trail' AND policyname = 'asaas_audit_tenant_select' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%payment_id%') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'asaas_audit_tenant_select', 'payment_id';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Usuários autenticados leem suas NFs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%foldername%') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Usuários autenticados leem suas NFs', 'foldername';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Usuários deletam suas NFs' AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%foldername%') THEN
        RAISE EXCEPTION '20260902270000: policy ''%s'' ausente ou corpo sem ''%s'' (correcao nao confirmada)', 'Usuários deletam suas NFs', 'foldername';
    END IF;

END;
$do$;

INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902130000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902140000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902150000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902160000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902170000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902180000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902190000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902200000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902210000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902220000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902230000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902240000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902250000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902260000') ON CONFLICT DO NOTHING;
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260902270000') ON CONFLICT DO NOTHING;

COMMIT;