-- SECURITY FIX: vazamento cross-tenant em tabelas financeiras via RLS.
--
-- contas_pagar, contas_receber, anomalias_detectadas, centros_custo e
-- parcelas_acordo tinham DUAS policies PERMISSIVE "FOR ALL" simultâneas:
--   1) uma policy legada ("Admins can manage X" / *_admin_write) que checa
--      apenas has_role(admin) OR has_role(financeiro), SEM considerar
--      empresa_id;
--   2) uma policy correta (*_tenant_rw / *_tenant_write) que já exige
--      adicionalmente empresa_acessivel(empresa_id).
--
-- Como policies PERMISSIVE combinam por OR, a policy (1) por si só concede
-- SELECT/INSERT/UPDATE/DELETE em TODAS as linhas de TODAS as empresas para
-- qualquer usuário com role admin/financeiro em qualquer empresa,
-- neutralizando o isolamento multi-tenant da policy (2) na mesma tabela.
-- A policy (2) já cobre o mesmo caso de uso corretamente escopado, então a
-- policy (1) é apenas removida (nenhuma funcionalidade legítima depende dela).
--
-- registro_duplicidade nunca teve RLS habilitada (tabela órfã: criada em
-- 20260508195736, sem nenhuma leitura/escrita em código-fonte ou edge
-- functions) e por herdar GRANT ALL ON ALL TABLES IN SCHEMA public TO
-- authenticated, qualquer usuário autenticado podia ler/escrever nela.
-- Habilita RLS sem nenhuma policy para authenticated (fail-closed; apenas
-- service_role continua com acesso via BYPASSRLS/role de sistema).

BEGIN;

DROP POLICY IF EXISTS "Admins can manage contas pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Admins can manage contas receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Admins can manage anomalias" ON public.anomalias_detectadas;
DROP POLICY IF EXISTS "Admins can manage centros de custo" ON public.centros_custo;
DROP POLICY IF EXISTS parcelas_acordo_admin_write ON public.parcelas_acordo;

ALTER TABLE public.registro_duplicidade ENABLE ROW LEVEL SECURITY;

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902130000','fix_rls_cross_tenant_leak_financeiro')
ON CONFLICT (version) DO NOTHING;
