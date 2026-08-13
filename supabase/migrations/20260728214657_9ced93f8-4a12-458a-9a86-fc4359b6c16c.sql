-- ============================================================
-- Backfill único (idempotente) de empresa_id em tabelas financeiras/fiscais
-- ============================================================
-- Estratégia, nesta ordem de precedência:
--   1) Herdar a empresa do registro-pai via FK (fonte mais confiável).
--   2) Se não houver pai e existir exatamente UMA empresa cadastrada,
--      atribuir essa empresa (tenant único = sem ambiguidade).
--   3) Caso contrário, não tocar na linha e reportá-la como pendente.
-- Reexecutar é seguro: só atua onde empresa_id IS NULL.

CREATE OR REPLACE FUNCTION public.backfill_empresa_id(_dry_run boolean DEFAULT false)
RETURNS TABLE(tabela text, estrategia text, registros_ajustados bigint, pendentes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_empresa_padrao uuid;
  v_total_empresas int;
  v_n bigint;
  v_p bigint;
  r record;
  -- tabela filha, tabela pai, coluna FK na filha
  v_fks CONSTANT text[][] := ARRAY[
    ARRAY['parcelas_acordo',          'acordos_parcelamento', 'acordo_id'],
    ARRAY['asaas_audit_trail',        'asaas_payments',       'payment_id'],
    ARRAY['asaas_sync_queue',         'asaas_payments',       'payment_id'],
    ARRAY['regua_cobranca_etapas',    'regua_cobranca',       'regua_id'],
    ARRAY['itens_pedido_compra',      'pedidos_compra',       'pedido_id'],
    ARRAY['partidas_contabeis',       'lancamentos_contabeis','lancamento_id']
  ];
  -- tabelas multi-inquilino que caem no fallback de empresa única
  v_diretas CONSTANT text[] := ARRAY[
    'contas_pagar','contas_receber','boletos','darfs','clientes','vendedores',
    'movimentacoes','lancamentos_contabeis','plano_contas','centros_custo',
    'contas_bancarias','notas_fiscais','nfe_recebidas','operacoes_tributaveis',
    'apuracoes_tributarias','creditos_tributarios','retencoes_fonte',
    'acordos_parcelamento','negativacoes','protestos','transferencias',
    'conciliacoes','sessoes_conciliacao','divergencias_conciliacao',
    'asaas_payments','asaas_customers','asaas_transfers',
    'auditoria_financeira','auditoria_tributaria','tax_audit_trail',
    'alertas_tributarios','contratos','pedidos_compra','categorias'
  ];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'backfill_empresa_id: acesso restrito a administradores';
  END IF;

  SELECT count(*) INTO v_total_empresas FROM public.empresas;
  IF v_total_empresas = 1 THEN
    SELECT id INTO v_empresa_padrao FROM public.empresas LIMIT 1;
  END IF;

  -- Etapa 1: herança via FK -------------------------------------------------
  FOR r IN SELECT v_fks[i][1] AS filha, v_fks[i][2] AS pai, v_fks[i][3] AS fk
             FROM generate_subscripts(v_fks, 1) AS i
  LOOP
    CONTINUE WHEN to_regclass('public.' || r.filha) IS NULL;
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=r.filha AND column_name='empresa_id');

    IF _dry_run THEN
      EXECUTE format(
        'SELECT count(*) FROM public.%I f JOIN public.%I p ON p.id = f.%I
          WHERE f.empresa_id IS NULL AND p.empresa_id IS NOT NULL',
        r.filha, r.pai, r.fk) INTO v_n;
    ELSE
      EXECUTE format(
        'WITH upd AS (
           UPDATE public.%I f SET empresa_id = p.empresa_id
             FROM public.%I p
            WHERE p.id = f.%I AND f.empresa_id IS NULL AND p.empresa_id IS NOT NULL
          RETURNING 1)
         SELECT count(*) FROM upd', r.filha, r.pai, r.fk) INTO v_n;
    END IF;

    EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.filha) INTO v_p;

    tabela := r.filha; estrategia := 'fk:' || r.pai;
    registros_ajustados := v_n; pendentes := v_p;
    RETURN NEXT;
  END LOOP;

  -- Etapa 2: fallback de empresa única --------------------------------------
  IF v_empresa_padrao IS NOT NULL THEN
    FOREACH r IN ARRAY (SELECT array_agg(ROW(t)::record) FROM unnest(v_diretas) t) LOOP
      NULL; -- placeholder inalcançável
    END LOOP;
  END IF;

  FOR r IN SELECT unnest(v_diretas) AS t LOOP
    CONTINUE WHEN to_regclass('public.' || r.t) IS NULL;
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=r.t AND column_name='empresa_id');

    v_n := 0;
    IF v_empresa_padrao IS NOT NULL AND NOT _dry_run THEN
      EXECUTE format(
        'WITH upd AS (
           UPDATE public.%I SET empresa_id = $1 WHERE empresa_id IS NULL RETURNING 1)
         SELECT count(*) FROM upd', r.t) USING v_empresa_padrao INTO v_n;
    ELSIF v_empresa_padrao IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.t) INTO v_n;
    END IF;

    EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.t) INTO v_p;

    tabela := r.t;
    estrategia := CASE WHEN v_empresa_padrao IS NOT NULL
                       THEN 'empresa_unica' ELSE 'skip:multiplas_empresas' END;
    registros_ajustados := v_n; pendentes := v_p;
    RETURN NEXT;
  END LOOP;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.backfill_empresa_id(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.backfill_empresa_id(boolean) TO authenticated, service_role;

COMMENT ON FUNCTION public.backfill_empresa_id(boolean) IS
  'Backfill idempotente de empresa_id: herda via FK do registro-pai e, na ausência de pai, usa a empresa padrão quando o ambiente tem apenas uma empresa. Restrito a admin/service_role.';