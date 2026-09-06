BEGIN;

-- Hardening focal de superfície pública:
-- 1) `gerar_numero_acordo()` é usado apenas por fluxo autenticado no frontend.
--    Não há consumidor anônimo legítimo no repositório, então removemos
--    EXECUTE de `anon`/`PUBLIC` e preservamos `authenticated`/`service_role`.
-- 2) O banco destino ao vivo ainda pode ter views anteriores à reconciliação.
--    Corrigimos a opção security_invoker sem substituir a definição das views.
-- 3) `vw_contas_receber_painel` é recriada com a mesma projeção canônica e
--    mascaramento de chave PIX, pois o gate ao vivo detectou exposição direta.

REVOKE EXECUTE ON FUNCTION public.gerar_numero_acordo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gerar_numero_acordo() TO authenticated, service_role;

DO $do$
DECLARE
  view_name text;
BEGIN
  FOREACH view_name IN ARRAY ARRAY[
    'vw_rpc_hotspots',
    'v_table_bloat',
    'extratos_bancarios_importados',
    'vw_fluxo_caixa_diario',
    'v_sefaz_observability',
    'vw_dre_mensal',
    'vw_dso_aging',
    'vw_fluxo_caixa',
    'vw_gastos_centro_custo',
    'vw_metricas_cobranca',
    'vw_rpc_slow_calls',
    'vw_saldos_contas',
    'vw_webhooks_recentes'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = view_name
        AND c.relkind = 'v'
    ) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', view_name);
    END IF;
  END LOOP;
END;
$do$;

-- Materialized views não suportam RLS/security_invoker. A view semanal de
-- performance permanece disponível apenas para o backend de serviço.
DO $do$
BEGIN
  IF to_regclass('public.mv_performance_alerts_weekly') IS NOT NULL THEN
    REVOKE ALL ON public.mv_performance_alerts_weekly FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON public.mv_performance_alerts_weekly TO service_role;
  END IF;
END;
$do$;

-- Guard: 42P16 — drop first if column set changed on preview branch
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
CREATE OR REPLACE VIEW public.vw_contas_receber_painel
WITH (security_invoker = true) AS
SELECT
  cr.id,
  cr.descricao,
  cr.valor,
  cr.data_vencimento,
  cr.data_recebimento,
  cr.status,
  cr.cliente_id,
  cr.user_id,
  cr.created_at,
  cr.updated_at,
  cr.empresa_id,
  cr.categoria_id,
  cr.centro_custo_id,
  cr.forma_recebimento,
  cr.conta_bancaria_id,
  cr.numero_documento,
  cr.observacoes,
  cr.valor_recebido,
  cr.juros,
  cr.multa,
  cr.desconto,
  cr.recorrente,
  cr.parcela_atual,
  cr.total_parcelas,
  cr.anexo_url,
  cr.score,
  cr.metadata,
  cr.cliente_nome,
  cr.etapa_cobranca,
  cr.tipo_cobranca,
  cr.numero_parcela_atual,
  cr.valor_desconto,
  CASE
    WHEN public.pode_ver_dado_sensivel() THEN cr.chave_pix
    ELSE public.mascarar_chave_pix(cr.chave_pix)
  END AS chave_pix,
  cr.data_emissao,
  cr.categoria_nome,
  cl.razao_social AS cliente_razao_social,
  cl.nome_fantasia AS cliente_nome_fantasia,
  COALESCE(
    cr.cliente_nome,
    cl.razao_social,
    'Cliente não identificado'::text
  ) AS cliente_nome_display,
  cc.nome AS centro_custo_nome,
  cb.banco AS conta_bancaria_nome
FROM public.contas_receber cr
LEFT JOIN public.clientes cl ON cr.cliente_id = cl.id
LEFT JOIN public.centros_custo cc ON cr.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cr.conta_bancaria_id = cb.id;

GRANT SELECT ON public.vw_contas_receber_painel TO authenticated, service_role;

COMMIT;
