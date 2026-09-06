-- SECURITY FIX: views e materialized views legadas que bypassavam RLS.
--
-- Achado por verificação adversarial: 4 views e 4 materialized views
-- criadas em 003_seed_data.sql / 20251231000002_materialized_views.sql /
-- 20251231000200_add_materialized_views.sql fazem SELECT direto de
-- contas_pagar/contas_receber SEM filtro de empresa_id (pré-datam o modelo
-- multi-tenant) e nunca ganharam security_invoker nem tiveram o GRANT ALL
-- genérico (20260518153054_..._sql:109, "GRANT ALL ON ALL TABLES IN SCHEMA
-- public TO authenticated") revogado depois.
--
-- Views sem security_invoker rodam com os privilégios do dono da view
-- (não do usuário que consulta) — como o dono é sempre o superusuário de
-- migration, a RLS das tabelas base (contas_pagar/contas_receber) é
-- inteiramente ignorada. Materialized views NUNCA respeitam RLS no
-- Postgres, é uma limitação estrutural.
--
-- Nenhuma delas é referenciada em src/ nem supabase/functions/ (confirmado
-- por grep exaustivo) — são código morto substituído pelas views atuais
-- (vw_contas_pagar_painel, vw_contas_receber_painel, vw_fluxo_caixa_diario
-- etc., já com security_invoker=true desde 20260825100000/20260827101000).
-- Em vez de DROP (podem existir consultas ad-hoc/relatórios externos
-- dependendo delas), apenas revoga o acesso de anon/authenticated, seguindo
-- o mesmo padrão defensivo (IF EXISTS via pg_class) já usado para
-- mv_benchmark_setorial e mv_performance_alerts_weekly
-- (20260827100000/20260827101000_..._sql).

BEGIN;

DO $$
DECLARE
  v_relkind text;
  obj record;
BEGIN
  FOR obj IN
    SELECT * FROM (VALUES
      ('vw_monthly_summary', 'v'),
      ('vw_cash_flow', 'v'),
      ('vw_contas_atrasadas', 'v'),
      ('vw_totals_by_category', 'v'),
      ('mv_dashboard_metrics', 'm'),
      ('mv_fluxo_caixa', 'm'),
      ('mv_top_fornecedores', 'm'),
      ('mv_inadimplencia', 'm')
    ) AS t(relname, relkind)
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = obj.relname AND c.relkind = obj.relkind
    ) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', obj.relname);
      EXECUTE format('GRANT SELECT ON public.%I TO service_role', obj.relname);
    END IF;
  END LOOP;
END;
$$;

COMMIT;
